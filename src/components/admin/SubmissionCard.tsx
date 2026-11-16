'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ExternalLink, Check, X, Plus, MapPin } from 'lucide-react'
import { Lightbox } from '@/components/ui/Lightbox'
import { errMsg } from '@/lib/errors'
import { createClient } from '@/lib/supabase/client'
import { slugify } from '@/lib/slug'
import { metresBetween } from '@/lib/geo'
import { AddressLocator } from './AddressLocator'
import { useKnownArtists } from '@/lib/useKnownArtists'
import { enrichAndSaveArtists, parseArtistLine, useArtistDirectory } from '@/lib/artistDirectory'
import { adminField, adminLabel, primaryBtn, ghostBtn, CONFIDENCE, PRECISION } from './fields'
import type { Submission, ConfidenceLevel, PrecisionLabel } from '@/types/mural'

const EXISTING = /Location suggestion for existing mural:\s*([a-z0-9-]+)/i
const VERIFY = /Location verification for existing mural:\s*([a-z0-9-]+)/i

export function SubmissionCard({ submission: s }: { submission: Submission }) {
  const router = useRouter()
  const sb = createClient()
  const existingSlug = s.notes?.match(EXISTING)?.[1] ?? null
  const verifySlug = s.notes?.match(VERIFY)?.[1] ?? null
  const knownArtists = useKnownArtists()
  const directory = useArtistDirectory()
  const targetSlug = verifySlug ?? existingSlug ?? s.mural_slug ?? null
  const allPhotos = (s.photo_paths ?? []).map(p => sb.storage.from('submissions').getPublicUrl(p).data.publicUrl)
  // Ticked photos are the ones to use; with none ticked, all of them are used.
  const [picked, setPicked] = useState<string[]>([])
  const [viewer, setViewer] = useState<number | null>(null)
  const photos = picked.length ? allPhotos.filter(u => picked.includes(u)) : allPhotos
  const togglePick = (u: string) => setPicked(p => p.includes(u) ? p.filter(x => x !== u) : [...p, u])
  const pending = s.status === 'pending'
  const photoUpdate = s.kind === 'photos_same' || s.kind === 'photos_repainted'
  const repainted = s.kind === 'photos_repainted'

  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [title, setTitle] = useState(s.title ?? '')
  const [artist, setArtist] = useState(s.artist ?? '')
  const [location, setLocation] = useState(s.location_description)
  const [confidence, setConfidence] = useState<ConfidenceLevel>('unverified')
  const [handle, setHandle] = useState('')
  const [pinned, setPinned] = useState<{ lat: number; lng: number } | null>(s.coordinates ?? null)
  const [mural, setMural] = useState<{ id: string; title: string; artist: string | null; coordinates: { lat: number; lng: number } | null } | null>(null)
  const [qArtist, setQArtist] = useState('')
  const [qHandle, setQHandle] = useState('')
  const muralCoords = mural?.coordinates ?? null
  const [precision, setPrecision] = useState<PrecisionLabel | ''>(s.coordinates ? 'landmark' : '')

  useEffect(() => {
    if (!targetSlug) return
    sb.from('murals').select('id,title,artist,coordinates').eq('slug', targetSlug).maybeSingle().then(({ data }) => setMural(data ?? null))
  }, [targetSlug]) // eslint-disable-line react-hooks/exhaustive-deps

  /** "Name1, Name2" + a handle/link for the first name → Artist[] (known artists get their saved link). */
  const buildArtists = async (names: string, firstHandle: string) => {
    const list = names.split(',').map(n => n.trim()).filter(Boolean).map((n, i) => parseArtistLine(i === 0 && firstHandle.trim() ? `${n} | ${firstHandle.trim()}` : n)!)
    return enrichAndSaveArtists(list)
  }
  const pickArtist = (v: string) => {
    setArtist(v)
    const k = directory.find(v)
    if (k && !handle) setHandle(k.instagram ?? k.url ?? '')
  }
  const saveMuralArtist = () => run(async () => {
    if (!mural || !qArtist.trim()) throw new Error('Enter the artist name')
    const list = await buildArtists(qArtist, qHandle)
    const { error: e } = await sb.from('murals').update({ artist: list.map(a => a.name).join(', '), artists: list, artist_verified: true }).eq('id', mural.id)
    if (e) throw e
    setMural({ ...mural, artist: list.map(a => a.name).join(', ') }); setQArtist(''); setQHandle('')
    router.refresh()
  })
  const verifyDistance = s.coordinates && muralCoords ? metresBetween(s.coordinates, muralCoords) : null

  async function finish(status: 'approved' | 'rejected') {
    // keep a record of which photos were used
    const patch: { status: string; photo_paths?: string[] } = { status }
    if (status === 'approved' && picked.length) patch.photo_paths = (s.photo_paths ?? []).filter((_, i) => picked.includes(allPhotos[i]))
    const { error: e } = await sb.from('submissions').update(patch).eq('id', s.id)
    if (e) throw e
    router.refresh()
  }
  const run = async (fn: () => Promise<void>) => {
    setBusy(true); setError(null)
    try { await fn() } catch (e) { setError(errMsg(e)) } finally { setBusy(false) }
  }

  /** Photo update for an existing mural: repainted → old photos move to history, mural is tagged Changed. */
  const addPhotos = () => run(async () => {
    const { data: m, error: e1 } = await sb.from('murals').select('id,title,artist,photos,cover_photo,previous_photos,artwork_history,confidence,precision').eq('slug', s.mural_slug!).maybeSingle()
    if (e1) throw e1
    if (!m) throw new Error(`Mural "${s.mural_slug}" not found`)
    // repainted + new name: the old name stays with the old photos
    const newName = s.title?.trim() && s.title.trim().toLowerCase() !== m.title.trim().toLowerCase() ? s.title.trim() : null
    const newArtist = s.artist?.trim() && s.artist.trim().toLowerCase() !== (m.artist ?? '').trim().toLowerCase() ? s.artist.trim() : null
    const artists = newArtist ? await buildArtists(newArtist, '') : null
    const patch: Record<string, unknown> = repainted
      ? {
          ...(artists ? { artist: artists.map(a => a.name).join(', '), artists, artist_verified: true } : {}), photos, cover_photo: photos[0] ?? null, previous_photos: [...(m.previous_photos ?? []), ...(m.photos ?? [])],
          ...(newName ? { title: newName } : {}),
          artwork_history: [...(m.artwork_history ?? []), { title: m.title, artist: m.artist, photos: m.photos ?? [], replaced_at: new Date().toISOString() }],
          artwork_status: 'changed', artwork_changed_at: new Date().toISOString(),
          // approving the replacement also confirms the spot: verified, and the pin follows the submission when it has one
          ...(m.confidence === 'removed' ? {} : { confidence: 'verified' }),
          ...(s.coordinates ? { coordinates: s.coordinates } : {}),
          ...(s.coordinates && (!m.precision || m.precision === 'lead') ? { precision: 'landmark' } : {}) }
      : (m.photos ?? []).every((u: string) => u.startsWith('/murals/'))
        // the bundled placeholder photos get replaced by the first real ones
        ? { photos, cover_photo: photos[0] ?? null }
        : { photos: [...(m.photos ?? []), ...photos], cover_photo: m.cover_photo ?? photos[0] ?? null }
    const { error: e2 } = await sb.from('murals').update(patch).eq('id', m.id)
    if (e2) throw e2
    await finish('approved')
  })

  /** Someone stood at the mural and confirmed it: mark the location verified. */
  const confirmLocation = () => run(async () => {
    const { data: m, error: e1 } = await sb.from('murals').select('id,precision,confidence,coordinates').eq('slug', verifySlug!).maybeSingle()
    if (e1) throw e1
    if (!m) throw new Error(`Mural "${verifySlug}" not found`)
    const patch: Record<string, unknown> = { confidence: m.confidence === 'removed' ? 'removed' : 'verified' }
    if (!m.precision || m.precision === 'lead') patch.precision = 'landmark'
    if (!m.coordinates && s.coordinates) patch.coordinates = s.coordinates
    const { error: e2 } = await sb.from('murals').update(patch).eq('id', m.id)
    if (e2) throw e2
    await finish('approved')
  })

  const createMural = () => run(async () => {
    const base = slugify(title || location)
    let slug = base
    for (let i = 2; i < 20; i++) {
      const { data } = await sb.from('murals').select('id').eq('slug', slug).maybeSingle()
      if (!data) break
      slug = `${base}-${i}`
    }
    const artists = artist.trim() ? await buildArtists(artist, handle) : []
    const { error: e } = await sb.from('murals').insert({
      slug, title: title.trim() || 'Untitled',
      artist: artists.length ? artists.map(a => a.name).join(', ') : null,
      artists: artists.length ? artists : null, artist_verified: artists.length > 0,
      location_description: location.trim(), coordinates: pinned,
      confidence, precision: precision || null, photos: photos, cover_photo: photos[0] ?? null,
      notes: s.notes ?? null,
    })
    if (e) throw e
    await finish('approved')
  })

  const applyLocation = () => run(async () => {
    const patch: Record<string, unknown> = { location_description: location.trim(), precision: precision || null }
    if (s.coordinates) patch.coordinates = s.coordinates
    const { error: e } = await sb.from('murals').update(patch).eq('slug', existingSlug!)
    if (e) throw e
    await finish('approved')
  })

  return (
    <div className="bg-surface rounded-xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display font-semibold text-body truncate">{s.title || 'Untitled'}</p>
          <p className="text-caption text-ink-3">{new Date(s.created_at).toLocaleString()} · {s.status}</p>
          <div className="flex flex-wrap gap-1 mt-1">
            {s.auto_verified && <span className="text-caption font-display font-semibold px-2 py-0.5 rounded-full bg-certain-bg text-certain">Auto-verified · {s.auto_note}</span>}
            {!s.auto_verified && s.coordinates && (s.photo_paths?.length ?? 0) > 0 && (s.location_source === 'device' || s.location_source === 'photo') && (
              <span className="text-caption font-display font-semibold px-2 py-0.5 rounded-full bg-sea-tint text-sea">GPS + photo ({s.location_source})</span>
            )}
          </div>
        </div>
        {verifySlug && (
          <Link href={`/gallery/${verifySlug}`} className="shrink-0 text-caption text-sea underline underline-offset-2">Verify location: {verifySlug}</Link>
        )}
        {photoUpdate && s.mural_slug && (
          <Link href={`/gallery/${s.mural_slug}`} className="shrink-0 text-caption text-sea underline underline-offset-2">
            {repainted ? 'Repainted: ' : 'Photos for '}{s.mural_slug}
          </Link>
        )}
        {existingSlug && <Link href={`/gallery/${existingSlug}`} className="shrink-0 text-caption text-sea underline underline-offset-2">Location for {existingSlug}</Link>}
      </div>

      {allPhotos.length > 0 && (
        <div className="space-y-1.5">
          <div className="grid grid-cols-4 gap-2">
            {allPhotos.map((u, i) => {
              const on = picked.includes(u)
              return (
                <div key={u} className={`relative aspect-square rounded-sm overflow-hidden bg-groove ${on ? 'ring-2 ring-sea' : ''}`}>
                  <button type="button" onClick={() => setViewer(i)} aria-label={`View photo ${i + 1}`} className="block w-full h-full">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={u} alt="" className={`w-full h-full object-cover ${picked.length && !on ? 'opacity-40' : ''}`} />
                  </button>
                  {pending && allPhotos.length > 1 && (
                    <button type="button" onClick={() => togglePick(u)} aria-pressed={on} aria-label={on ? `Unselect photo ${i + 1}` : `Select photo ${i + 1}`}
                      className={`absolute top-1 left-1 w-6 h-6 rounded-full flex items-center justify-center border ${on ? 'bg-sea border-sea text-white' : 'bg-black/40 border-white text-transparent'}`}>
                      <Check size={13} />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
          {pending && allPhotos.length > 1 && (
            <p className="text-caption text-ink-3">
              {picked.length ? `${picked.length} of ${allPhotos.length} selected — only these will be used.` : 'Tap the circle on photos to keep. None selected = all are used.'}
            </p>
          )}
        </div>
      )}
      {viewer !== null && <Lightbox photos={allPhotos} start={viewer} onClose={() => setViewer(null)} />}

      <div className="text-small text-ink-2 space-y-1">
        {s.artist && <p><span className="text-ink-3">Artist:</span> {s.artist}</p>}
        <p><span className="text-ink-3">Where:</span> {s.location_description}</p>
        {s.coordinates && (
          <p className="flex items-center gap-1.5">
            <MapPin size={12} className="text-sea" />
            {s.coordinates.lat.toFixed(5)}, {s.coordinates.lng.toFixed(5)}{s.location_source ? ` (${s.location_source})` : ''}
            <a href={`https://www.google.com/maps/search/?api=1&query=${s.coordinates.lat},${s.coordinates.lng}`} target="_blank" rel="noopener noreferrer" className="text-sea" aria-label="Open in Google Maps"><ExternalLink size={12} /></a>
          </p>
        )}
        {s.notes && <p className="whitespace-pre-line"><span className="text-ink-3">Notes:</span> {s.notes}</p>}
      </div>

      {repainted && mural && s.artist?.trim() && s.artist.trim().toLowerCase() !== (mural.artist ?? '').trim().toLowerCase() && (
        <p className="text-small font-display font-semibold text-sea">New artist: {mural.artist ? `“${mural.artist}” → ` : ''}“{s.artist}”</p>
      )}
      {repainted && mural && s.title && s.title.trim().toLowerCase() !== mural.title.trim().toLowerCase() && (
        <p className="text-small font-display font-semibold text-sea">Rename: “{mural.title}” → “{s.title}” (the old name stays with the old photos)</p>
      )}

      {targetSlug && mural && (
        <div className="rounded-lg bg-bg p-3 space-y-2">
          <p className="text-small text-ink-2">
            <span className="text-ink-3">Mural’s artist:</span> {mural.artist || <span className="text-guessing">missing</span>}
            {' · '}<Link href={`/admin/murals/${mural.id}`} className="text-sea underline underline-offset-2">Edit mural</Link>
          </p>
          {!mural.artist && pending && (
            <div className="flex flex-wrap gap-2 items-end">
              <div className="flex-1 min-w-[8rem]"><label className={adminLabel}>Artist name</label>
                <input className={adminField} list="known-artists-q" value={qArtist} onChange={e => { setQArtist(e.target.value); const k = directory.find(e.target.value); if (k && !qHandle) setQHandle(k.instagram ?? k.url ?? '') }} />
                <datalist id="known-artists-q">{knownArtists.map(n => <option key={n} value={n} />)}</datalist></div>
              <div className="flex-1 min-w-[8rem]"><label className={adminLabel}>Instagram / link</label>
                <input className={adminField} value={qHandle} onChange={e => setQHandle(e.target.value)} placeholder="senkoeone" /></div>
              <button className={primaryBtn} disabled={busy || !qArtist.trim()} onClick={saveMuralArtist}>Save artist</button>
            </div>
          )}
        </div>
      )}

      {verifySlug && s.coordinates && verifyDistance !== null && (
        <p className={`text-small font-display font-semibold ${verifyDistance <= 50 ? 'text-certain' : 'text-guessing'}`}>
          {Math.round(verifyDistance)} m from the mural’s pin{verifyDistance <= 50 ? ' · close enough' : ' · far — check the photo'}
        </p>
      )}

      {pending && verifySlug && (
        <div className="flex flex-wrap gap-2">
          <button className={primaryBtn} disabled={busy} onClick={confirmLocation}>
            <Check size={12} className="inline -mt-0.5" /> Confirm location (mark verified)
          </button>
          <button className={ghostBtn} disabled={busy} onClick={() => run(() => finish('rejected'))}><X size={12} className="inline -mt-0.5" /> Reject</button>
        </div>
      )}

      {pending && photoUpdate && (
        <div className="flex flex-wrap gap-2">
          <button className={primaryBtn} disabled={busy || photos.length === 0} onClick={addPhotos}>
            <Check size={12} className="inline -mt-0.5" /> {repainted ? 'Replace photos, verify & tag Changed' : 'Add photos to mural'}
          </button>
          <button className={ghostBtn} disabled={busy} onClick={() => run(() => finish('rejected'))}><X size={12} className="inline -mt-0.5" /> Reject</button>
        </div>
      )}

      {pending && !photoUpdate && !verifySlug && !open && (
        <div className="flex flex-wrap gap-2">
          <button className={primaryBtn} onClick={() => setOpen(true)}>
            {existingSlug ? <><Check size={12} className="inline -mt-0.5" /> Apply location…</> : <><Plus size={12} className="inline -mt-0.5" /> Create mural…</>}
          </button>
          <button className={ghostBtn} disabled={busy} onClick={() => run(() => finish('rejected'))}><X size={12} className="inline -mt-0.5" /> Reject</button>
        </div>
      )}

      {pending && !photoUpdate && !verifySlug && open && (
        <div className="space-y-2 border-t border-groove pt-3">
          {!existingSlug && (
            <>
              <div><label className={adminLabel}>Title</label><input className={adminField} value={title} onChange={e => setTitle(e.target.value)} /></div>
              <div><label className={adminLabel}>Artist(s) — comma separated</label><input className={adminField} list="known-artists" value={artist} onChange={e => pickArtist(e.target.value)} />
                <datalist id="known-artists">{knownArtists.map(n => <option key={n} value={n} />)}</datalist></div>
              <div><label className={adminLabel}>Instagram handle or link (first artist) — filled in for known artists</label>
                <input className={adminField} value={handle} onChange={e => setHandle(e.target.value)} placeholder="senkoeone" /></div>
            </>
          )}
          <div><label className={adminLabel}>Location description</label><input className={adminField} value={location} onChange={e => setLocation(e.target.value)} /></div>
          {!existingSlug && (
            <div className="space-y-1.5">
              {pinned
                ? <p className="text-small text-ink-2 flex items-center gap-1.5"><MapPin size={12} className="text-sea" />Pin: {pinned.lat.toFixed(5)}, {pinned.lng.toFixed(5)} <button type="button" className="text-sea underline underline-offset-2" onClick={() => setPinned(null)}>clear</button></p>
                : <p className="text-caption text-guessing">No pin yet. The mural won’t show on the map until it has one.</p>}
              <AddressLocator address={location} onPick={(c, p) => { setPinned(c); setPrecision(p) }} />
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            {!existingSlug && (
              <div><label className={adminLabel}>Status</label>
                <select className={adminField} value={confidence} onChange={e => setConfidence(e.target.value as ConfidenceLevel)}>
                  {CONFIDENCE.map(c => <option key={c}>{c}</option>)}
                </select></div>
            )}
            <div><label className={adminLabel}>Precision</label>
              <select className={adminField} value={precision} onChange={e => setPrecision(e.target.value as PrecisionLabel | '')}>
                <option value="">(none)</option>{PRECISION.map(p => <option key={p}>{p}</option>)}
              </select></div>
          </div>
          <div className="flex gap-2 pt-1">
            <button className={primaryBtn} disabled={busy || !location.trim()} onClick={existingSlug ? applyLocation : createMural}>
              {existingSlug ? 'Apply to mural' : 'Create mural'}
            </button>
            <button className={ghostBtn} onClick={() => setOpen(false)}>Cancel</button>
          </div>
        </div>
      )}
      {error && <p className="text-small text-guessing" role="alert">{error}</p>}
    </div>
  )
}
