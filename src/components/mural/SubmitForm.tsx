'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Camera, X, CheckCircle2, ChevronLeft, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { submitMural, spamCode } from '@/lib/murals'
import { prepareImage } from '@/lib/image'
import { useT } from '@/lib/i18n/client'
import { useKnownArtists } from '@/lib/useKnownArtists'
import { useAuth } from '@/lib/auth/useAuth'
import { slugify } from '@/lib/slug'
import { enrichAndSaveArtists, parseArtistLine } from '@/lib/artistDirectory'
import { errMsg } from '@/lib/errors'
import { LocationPicker, type LocationSource } from './LocationPicker'
import type { Coordinates } from '@/types/mural'

const MAX_PHOTOS = 4
const MAX_BYTES = 25 * 1024 * 1024 // originals are resized before upload
const TYPES = ['image/jpeg', 'image/png', 'image/webp']
const field = 'w-full min-h-field bg-surface rounded-panel px-3 py-2.5 outline-none border border-groove focus:border-sea placeholder:text-ink-3'

export function SubmitForm({ existing, mode }: { existing?: { slug: string; title: string } | null; mode?: 'photos' | 'verify' | 'update' }) {
  const photosMode = mode === 'photos'
  const verifyMode = mode === 'verify'
  const updateMode = mode === 'update' // a new mural at the same spot: new name, maybe a new artist, new photos
  const knownArtists = useKnownArtists()
  const { isAdmin } = useAuth()
  const { t } = useT()
  const router = useRouter()
  const [title, setTitle] = useState(existing?.title ?? '')
  const [artist, setArtist] = useState('')
  const [location, setLocation] = useState('')
  const [notes, setNotes] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [coords, setCoords] = useState<Coordinates | null>(null)
  const [source, setSource] = useState<LocationSource | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [newName, setNewName] = useState('')
  const [photoKind, setPhotoKind] = useState<'photos_same' | 'photos_repainted'>('photos_same')
  const [trap, setTrap] = useState('') // honeypot: real people never see or fill this
  const [gpsNames, setGpsNames] = useState<Set<File>>(new Set()) // photos that carry GPS data (shown as a "GPS ✓" chip)

  async function addFiles(list: FileList | null) {
    if (!list) return
    const next = [...files]
    const added: File[] = []
    for (const f of Array.from(list)) {
      if (!TYPES.includes(f.type)) { setError(t('submit.errPhotoType')); continue }
      if (f.size > MAX_BYTES) { setError(t('submit.errPhotoSize')); continue }
      if (next.length < MAX_PHOTOS) { next.push(f); added.push(f) }
    }
    setFiles(next)
    // Use GPS tagged in the photo (if any and no pin set yet). The upload itself is re-encoded without it.
    try {
      const exifr = await import('exifr')
      let pinned = !!coords
      const withGps: File[] = []
      for (const f of added) {
        const g = await exifr.gps(f).catch(() => null)
        if (g && Number.isFinite(g.latitude) && Number.isFinite(g.longitude)) {
          withGps.push(f)
          if (!pinned) { setCoords({ lat: g.latitude, lng: g.longitude }); setSource('photo'); pinned = true }
        }
      }
      if (withGps.length) setGpsNames(prev => new Set([...Array.from(prev), ...withGps]))
    } catch { /* no metadata — fine */ }
  }

  /** Back to wherever the person came from; falls back to the gallery (or the mural) if the page was opened directly. */
  function goBack() {
    if (typeof window !== 'undefined' && window.history.length > 1) router.back()
    else router.push(existing ? `/gallery/${existing.slug}` : '/gallery')
  }

  /** Close the form: back to where the person came from, asking first if they've already filled something in. */
  function cancel() {
    const dirty = !!((title.trim() && title.trim() !== (existing?.title ?? '')) || artist.trim() || location.trim() || notes.trim() || newName.trim() || files.length || coords)
    if (dirty && !window.confirm(t('submit.discard'))) return
    goBack()
  }

  function another() {
    setTitle(existing?.title ?? ''); setArtist(''); setLocation(''); setNotes(''); setFiles([])
    setCoords(null); setSource(null); setError(null); setPhotoKind('photos_same'); setNewName(''); setDone(false)
    window.scrollTo({ top: 0 })
  }

  /** Why the Send button is disabled, in words (never just a greyed-out button). */
  const needsPhoto = (!existing || photosMode || updateMode) && files.length === 0
  const needsLocation = !photosMode && !verifyMode && !updateMode && !location.trim() && !coords
  const blocker = needsPhoto ? t('submit.needPhoto') : needsLocation ? t('submit.needLocation') : null

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if ((!photosMode && !verifyMode && !updateMode && !location.trim() && !coords) || loading) return
    if ((!existing || photosMode || updateMode) && files.length === 0) { setError(t('submit.errPhotoRequired')); return }
    if (verifyMode && !coords) { setError(t('submit.errVerifyCoords')); return }
    if (trap) { setDone(true); return } // bot: pretend it worked
    setLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      const paths: string[] = []
      for (const f of files) {
        const path = `${crypto.randomUUID()}.jpg`
        const body = await prepareImage(f)
        const { error: upErr } = await supabase.storage.from('submissions').upload(path, body, { contentType: 'image/jpeg' })
        if (upErr) throw upErr
        paths.push(path)
      }
      // A new mural submitted by a signed-in admin is published straight away (no review queue).
      if (isAdmin && !existing) {
        const base = slugify(title || location) || 'mural'
        let slug = base
        for (let i = 2; i < 20; i++) {
          const { data } = await supabase.from('murals').select('id').eq('slug', slug).maybeSingle()
          if (!data) break
          slug = `${base}-${i}`
        }
        const names = artist.split(',').map(n => n.trim()).filter(Boolean).map(n => parseArtistLine(n)!)
        const artists = names.length ? await enrichAndSaveArtists(names) : []
        const urls = paths.map(p => supabase.storage.from('submissions').getPublicUrl(p).data.publicUrl)
        const gps = !!coords && (source === 'device' || source === 'photo')   // GPS from the device or the photo = proof of location
        const { error: insErr } = await supabase.from('murals').insert({
          slug, title: title.trim() || 'Untitled',
          artist: artists.length ? artists.map(a => a.name).join(', ') : null,
          artists: artists.length ? artists : null, artist_verified: artists.length > 0,
          location_description: location.trim() || (coords ? `Pinned location (${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)})` : 'Unknown'),
          coordinates: coords, confidence: gps ? 'verified' : 'unverified', precision: coords ? 'landmark' : null,
          photos: urls, cover_photo: urls[0] ?? null, notes: notes.trim() || null,
        })
        if (insErr) throw insErr
        router.push(`/gallery/${slug}`)
        return
      }
      await submitMural({
        kind: updateMode ? 'photos_repainted' : photosMode ? photoKind : existing ? 'location' : 'new',
        mural_slug: existing?.slug ?? null,
        // repainted: the name can change (optional); the old name stays with the old photos
        title: updateMode ? (newName.trim() || existing!.title) : photosMode ? (photoKind === 'photos_repainted' && newName.trim() ? newName.trim() : existing!.title) : verifyMode ? existing!.title : title.trim() || null,
        artist: updateMode ? artist.trim() || null : photosMode || verifyMode ? null : artist.trim() || null,
        location_description: photosMode || updateMode ? `Photo update for existing mural: ${existing!.slug}` : verifyMode ? `Location verification for existing mural: ${existing!.slug}` : location.trim() || (coords ? `Pinned location (${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)})` : ''),
        coordinates: coords,
        location_source: coords ? source : !photosMode && !verifyMode && !updateMode && location.trim() ? 'manual' : null,
        notes: [verifyMode ? `Location verification for existing mural: ${existing!.slug}` : existing && !photosMode && !updateMode ? `Location suggestion for existing mural: ${existing.slug}` : '', notes.trim()].filter(Boolean).join('\n') || null,
        photo_paths: paths,
      })
      setDone(true)
    } catch (e) {
      const code = spamCode(e)
      if (isAdmin && !existing) { setError(errMsg(e)); return }
      setError(code === 'rate_limited' ? t('spam.rate') : code === 'too_long' ? t('spam.long') : t('submit.errGeneric'))
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="bg-surface rounded-panel p-6 text-center">
        <CheckCircle2 className="mx-auto text-certain" size={36} />
        <p className="font-semibold mt-3">{t('submit.thanks')}</p>
        <p className="text-14 text-ink-2 mt-1">{t('submit.pending')}</p>
        <div className="mt-5 flex flex-col items-center gap-2">
          <button type="button" onClick={goBack}
            className="inline-flex items-center gap-1 rounded-full bg-sea text-on-dark px-5 py-2.5 text-14 font-semibold">
            <ChevronLeft size={15} />
            {existing ? t('submit.backTo', { title: existing.title }) : t('submit.goBack')}
          </button>
          <button type="button" onClick={another}
            className="inline-flex items-center gap-1 rounded-full border border-groove text-ink-2 px-4 py-2 text-13 font-semibold">
            <Plus size={13} />
            {t('submit.another')}
          </button>
        </div>
      </div>
    )
  }

  const picker = <LocationPicker coords={coords} source={source} onChange={(c, src) => { setCoords(c); setSource(src) }} />
  const label = 'block text-14 font-semibold text-ink mb-1.5'

  // photos come first: the most useful input, and the biggest target
  const photoBlock = (
    <section>
      <div className="flex items-baseline justify-between mb-1.5">
        <h2 className="text-14 font-semibold text-ink">{t('submit.photos')}</h2>
        <span className="text-13 text-ink-2">{t('submit.counter', { n: files.length, max: MAX_PHOTOS })}</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <label className="col-span-1 row-span-2 min-h-[11rem] rounded-panel border-2 border-dashed border-sea bg-sea-tint text-sea flex flex-col items-center justify-center gap-2 px-2 text-center cursor-pointer focus-within:outline focus-within:outline-[3px] focus-within:outline-offset-[3px] focus-within:outline-sea">
          <Camera size={28} />
          <span className="text-14 font-semibold leading-tight">{t('submit.photoTile')}</span>
          <span className="text-13 text-ink-2 leading-tight">{t('submit.photoTileHint')}</span>
          <input type="file" accept="image/*" multiple disabled={files.length >= MAX_PHOTOS} className="sr-only"
            onChange={e => { setError(null); addFiles(e.target.files); e.target.value = '' }} />
        </label>
        {Array.from({ length: MAX_PHOTOS }).map((_, i) => {
          const f = files[i]
          return (
            <div key={i} className="relative aspect-square rounded-panel overflow-hidden bg-surface border border-groove">
              {f && (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
                  {gpsNames.has(f) && <span className="absolute bottom-1 left-1 text-12 font-bold bg-certain text-on-dark rounded-full px-1.5 py-px">{t('submit.gps')}</span>}
                  <button type="button" aria-label={t('submit.removePhoto')} onClick={() => setFiles(files.filter((_, j) => j !== i))}
                    className="absolute top-0 right-0 w-control h-control flex items-start justify-end p-1">
                    <span className="w-6 h-6 rounded-full bg-scrim text-on-dark flex items-center justify-center"><X size={14} /></span>
                  </button>
                </>
              )}
            </div>
          )
        })}
      </div>
      <p className="text-13 text-ink-2 mt-1.5">{t('submit.photoHint', { n: MAX_PHOTOS })}</p>
    </section>
  )

  const notesBlock = (
    <label className="block">
      <span className={label}>{t('submit.notesLabel')}</span>
      <textarea className={field} rows={3} placeholder={t('submit.notesPh')} value={notes} onChange={e => setNotes(e.target.value)} />
    </label>
  )

  return (
    <form onSubmit={submit} className="space-y-5">
      <button type="button" onClick={cancel} aria-label={t('submit.close')}
        className="absolute right-gutter top-controls w-control h-control rounded-full bg-surface border border-groove text-ink flex items-center justify-center">
        <X size={20} />
      </button>
      <input type="text" name="website" value={trap} onChange={e => setTrap(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden="true"
        className="absolute left-[-9999px] w-px h-px opacity-0" />
      <datalist id="known-artists">{knownArtists.map(n => <option key={n} value={n} />)}</datalist>

      {photoBlock}

      {photosMode ? (
        <>
          <fieldset className="space-y-2">
            <legend className={label}>{t('submit.photoKindQ')}</legend>
            {(['photos_same', 'photos_repainted'] as const).map(k => (
              <label key={k} className={`flex items-center gap-2 rounded-panel px-3 min-h-field text-14 border cursor-pointer ${photoKind === k ? 'border-sea bg-sea-tint text-sea' : 'border-groove bg-surface'}`}>
                <input type="radio" name="photoKind" checked={photoKind === k} onChange={() => setPhotoKind(k)} className="accent-sea" />
                {k === 'photos_same' ? t('submit.photoSame') : t('submit.photoRepainted')}
              </label>
            ))}
            {photoKind === 'photos_repainted' && (
              <label className="block">
                <span className={label}>{t('submit.newName')}</span>
                <input className={field} maxLength={120} value={newName} onChange={e => setNewName(e.target.value)} placeholder={existing!.title} />
                <p className="text-13 text-ink-2 mt-1">{t('submit.newNameHint')}</p>
              </label>
            )}
          </fieldset>
          <section><h2 className={label}>{t('submit.where')}</h2>{picker}</section>
        </>
      ) : updateMode ? (
        <>
          <label className="block">
            <span className={label}>{t('submit.newName')}</span>
            <input className={field} maxLength={120} value={newName} onChange={e => setNewName(e.target.value)} placeholder={existing!.title} />
            <p className="text-13 text-ink-2 mt-1">{t('submit.newNameHint')}</p>
          </label>
          <label className="block">
            <span className={label}>{t('submit.artistLabel')}</span>
            <input className={field} list="known-artists" autoComplete="off" placeholder={t('submit.artistPhNew')} value={artist} onChange={e => setArtist(e.target.value)} />
          </label>
          <section><h2 className={label}>{t('submit.where')}</h2>{picker}</section>
        </>
      ) : verifyMode ? (
        <section><h2 className={label}>{t('submit.where')}</h2>{picker}</section>
      ) : (
        <>
          {/* where: the street text, the pin (device, photo or pasted link) and where it came from */}
          <section className="space-y-2">
            <div className="flex items-baseline justify-between">
              <h2 className="text-14 font-semibold text-ink">{t('submit.where')}</h2>
              <span className={`text-13 font-semibold ${coords ? 'text-certain' : 'text-ink-2'}`}>
                {coords ? (source === 'photo' ? t('submit.fromPhoto') : t('locpick.pinSet')) : t('submit.locNeeded')}
              </span>
            </div>
            <label className="block">
              <span className="sr-only">{t('submit.whereLabel')}</span>
              <input className={field} required={!coords} placeholder={t('submit.wherePh')} value={location} onChange={e => setLocation(e.target.value)} />
            </label>
            {picker}
          </section>
          <section className="space-y-3">
            <div className="flex items-baseline justify-between">
              <h2 className="text-14 font-semibold text-ink">{t('submit.details')}</h2>
              <span className="text-13 text-ink-2">{t('submit.optional')}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <span className="sr-only">{t('submit.titleLabel')}</span>
                <input className={field} placeholder={t('submit.titleLabel')} aria-label={t('submit.titleLabel')} value={title} onChange={e => setTitle(e.target.value)} />
              </label>
              <label className="block">
                <span className="sr-only">{t('submit.artistLabel')}</span>
                <input className={field} list="known-artists" autoComplete="off" placeholder={t('submit.artistLabel')} aria-label={t('submit.artistLabel')} value={artist} onChange={e => setArtist(e.target.value)} />
              </label>
            </div>
          </section>
        </>
      )}
      {notesBlock}

      <p className="text-12 text-ink-2 leading-snug">
        {t('submit.rights')}{' '}
        <Link href="/terms" className="underline underline-offset-2">{t('submit.rightsLink')}</Link>.
      </p>

      {/* sticky footer: one clear action; when it can't be used yet, it says what is missing */}
      <div className="sticky bottom-[var(--nav-h)] z-10 -mx-gutter px-gutter py-3 bg-bg border-t border-groove space-y-2">
        {error && <p className="text-13 text-danger" role="alert">{error}</p>}
        <button type="submit" disabled={!!blocker || loading}
          className="w-full h-[3.25rem] rounded-full bg-sea text-on-dark font-semibold text-16 disabled:bg-groove disabled:text-ink-2">
          {loading ? t('submit.submitting') : blocker ?? t('submit.submit')}
        </button>
      </div>
    </form>
  )
}
