'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ImagePlus, X, CheckCircle2, ChevronLeft, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { submitMural, spamCode } from '@/lib/murals'
import { prepareImage } from '@/lib/image'
import { useT } from '@/lib/i18n/client'
import { useKnownArtists } from '@/lib/useKnownArtists'
import { LocationPicker, type LocationSource } from './LocationPicker'
import type { Coordinates } from '@/types/mural'

const MAX_PHOTOS = 4
const MAX_BYTES = 25 * 1024 * 1024 // originals are resized before upload
const TYPES = ['image/jpeg', 'image/png', 'image/webp']
const field = 'w-full text-body bg-surface rounded-panel px-3 py-2.5 outline-none border border-groove focus:border-sea placeholder:text-ink-3'

export function SubmitForm({ existing, mode }: { existing?: { slug: string; title: string } | null; mode?: 'photos' | 'verify' | 'update' }) {
  const photosMode = mode === 'photos'
  const verifyMode = mode === 'verify'
  const updateMode = mode === 'update' // a new mural at the same spot: new name, maybe a new artist, new photos
  const knownArtists = useKnownArtists()
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
    if (!coords) {
      try {
        const exifr = await import('exifr')
        for (const f of added) {
          const g = await exifr.gps(f)
          if (g && Number.isFinite(g.latitude) && Number.isFinite(g.longitude)) {
            setCoords({ lat: g.latitude, lng: g.longitude }); setSource('photo'); break
          }
        }
      } catch { /* no metadata — fine */ }
    }
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
      setError(code === 'rate_limited' ? t('spam.rate') : code === 'too_long' ? t('spam.long') : t('submit.errGeneric'))
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="bg-surface rounded-panel p-6 text-center">
        <CheckCircle2 className="mx-auto text-certain" size={36} />
        <p className="font-display font-semibold mt-3">{t('submit.thanks')}</p>
        <p className="text-body text-ink-2 mt-1">{t('submit.pending')}</p>
        <div className="mt-5 flex flex-col items-center gap-2">
          <button type="button" onClick={goBack}
            className="inline-flex items-center gap-1 rounded-full bg-sea text-on-dark px-5 py-2.5 text-body font-display font-semibold">
            <ChevronLeft size={15} />
            {existing ? t('submit.backTo', { title: existing.title }) : t('submit.goBack')}
          </button>
          <button type="button" onClick={another}
            className="inline-flex items-center gap-1 rounded-full border border-groove text-ink-2 px-4 py-2 text-small font-display font-semibold">
            <Plus size={13} />
            {t('submit.another')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <button type="button" onClick={cancel} aria-label={t('submit.close')}
        className="absolute right-gutter top-controls w-control h-control rounded-full bg-groove text-ink-2 flex items-center justify-center">
        <X size={16} />
      </button>
      <input type="text" name="website" value={trap} onChange={e => setTrap(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden="true"
        className="absolute left-[-9999px] w-px h-px opacity-0" />
      <datalist id="known-artists">{knownArtists.map(n => <option key={n} value={n} />)}</datalist>
      {photosMode ? (
        <fieldset className="space-y-2">
          <legend className="text-small font-medium text-ink-2 mb-1">{t('submit.photoKindQ')}</legend>
          {(['photos_same', 'photos_repainted'] as const).map(k => (
            <label key={k} className={`flex items-center gap-2 rounded-panel px-3 py-2.5 text-body border cursor-pointer ${photoKind === k ? 'border-sea bg-sea-tint text-sea' : 'border-groove bg-surface'}`}>
              <input type="radio" name="photoKind" checked={photoKind === k} onChange={() => setPhotoKind(k)} className="accent-sea" />
              {k === 'photos_same' ? t('submit.photoSame') : t('submit.photoRepainted')}
            </label>
          ))}
          {photoKind === 'photos_repainted' && (
            <div>
              <input className={field} maxLength={120} value={newName} onChange={e => setNewName(e.target.value)} placeholder={`${t('submit.newName')} — ${existing!.title}`} />
              <p className="text-caption text-ink-3 mt-1">{t('submit.newNameHint')}</p>
            </div>
          )}
          <LocationPicker coords={coords} source={source} onChange={(c, src) => { setCoords(c); setSource(src) }} />
        </fieldset>
      ) : updateMode ? (
        <>
          <div>
            <input className={field} maxLength={120} value={newName} onChange={e => setNewName(e.target.value)} placeholder={`${t('submit.newName')} — ${existing!.title}`} />
            <p className="text-caption text-ink-3 mt-1">{t('submit.newNameHint')}</p>
          </div>
          <input className={field} list="known-artists" autoComplete="off" placeholder={t('submit.artistPhNew')} value={artist} onChange={e => setArtist(e.target.value)} />
          <LocationPicker coords={coords} source={source} onChange={(c, src) => { setCoords(c); setSource(src) }} />
        </>
      ) : verifyMode ? (
        <LocationPicker coords={coords} source={source} onChange={(c, src) => { setCoords(c); setSource(src) }} />
      ) : (
        <>
          <input className={field} placeholder={t('submit.titlePh')} value={title} onChange={e => setTitle(e.target.value)} />
          <input className={field} list="known-artists" autoComplete="off" placeholder={t('submit.artistPh')} value={artist} onChange={e => setArtist(e.target.value)} />
          <input className={field} required={!coords} placeholder={`${t('submit.wherePh')}${coords ? '' : ' *'}`} value={location} onChange={e => setLocation(e.target.value)} />
          <LocationPicker coords={coords} source={source} onChange={(c, src) => { setCoords(c); setSource(src) }} />
        </>
      )}
      <textarea className={field} rows={3} placeholder={t('submit.notesPh')} value={notes} onChange={e => setNotes(e.target.value)} />

      <div>
        <div className="grid grid-cols-4 gap-2">
          {files.map((f, i) => (
            <div key={i} className="relative aspect-square rounded-inset overflow-hidden bg-groove">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
              <button type="button" aria-label={t('submit.removePhoto')} onClick={() => setFiles(files.filter((_, j) => j !== i))}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-scrim text-on-dark flex items-center justify-center">
                <X size={12} />
              </button>
            </div>
          ))}
          {files.length < MAX_PHOTOS && (
            <label className="aspect-square rounded-inset border border-dashed border-ink-3 flex items-center justify-center text-ink-3 cursor-pointer">
              <ImagePlus size={20} />
              <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden"
                onChange={e => { setError(null); addFiles(e.target.files); e.target.value = '' }} />
            </label>
          )}
        </div>
        <p className="text-caption text-ink-3 mt-1.5">{existing && !photosMode && !updateMode ? '' : '* '}{t('submit.photoHint', { n: MAX_PHOTOS })}</p>
      </div>

      <p className="text-caption text-ink-3 leading-snug">
        {t('submit.rights')}{' '}
        <Link href="/terms" className="underline underline-offset-2">{t('submit.rightsLink')}</Link>.
      </p>

      {error && <p className="text-small text-guessing" role="alert">{error}</p>}
      <button type="submit" disabled={(!photosMode && !verifyMode && !updateMode && !location.trim() && !coords) || loading}
        className="w-full rounded-full bg-sea text-on-dark font-display font-medium py-3 text-body disabled:opacity-40">
        {loading ? t('submit.submitting') : t('submit.submit')}
      </button>
      <button type="button" onClick={cancel} disabled={loading}
        className="w-full rounded-full border border-groove text-ink-2 font-display font-medium py-3 text-body disabled:opacity-40">
        {t('submit.cancel')}
      </button>
    </form>
  )
}
