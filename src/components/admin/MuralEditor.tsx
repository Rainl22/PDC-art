'use client'
import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowUp, ArrowDown, Trash2, ImagePlus, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { prepareImage } from '@/lib/image'
import { slugify } from '@/lib/slug'
import { errMsg } from '@/lib/errors'
import { enrichAndSaveArtists, parseArtistLine } from '@/lib/artistDirectory'
import { useKnownArtists } from '@/lib/useKnownArtists'
import { PLACE_TYPES } from '@/lib/places'
import { LocationPicker, type LocationSource } from '@/components/mural/LocationPicker'
import { AddressLocator } from './AddressLocator'
import { adminField, adminLabel, primaryBtn, ghostBtn, CONFIDENCE, PRECISION } from './fields'
import type { Mural, Coordinates, ConfidenceLevel, PrecisionLabel, Artist } from '@/types/mural'

const toArtistLines = (a?: Artist[] | null, fallback?: string | null) =>
  a?.length ? a.map(x => { const h = x.instagram || x.url; return h ? `${x.name} | ${h}` : x.name }).join('\n') : fallback ?? ''
const parseArtists = (text: string): Artist[] =>
  text.split('\n').map(l => l.trim()).filter(Boolean).map(parseArtistLine).filter((a): a is Artist => !!a)
const coverFor = (url?: string) => (url ? url.replace(/(\/murals\/[^/]+\/\d+)\.jpg$/, '$1-t.jpg') : null)

export function MuralEditor({ mural }: { mural?: Mural }) {
  const router = useRouter()
  const sb = createClient()
  const fileInput = useRef<HTMLInputElement>(null)
  const knownArtists = useKnownArtists()

  const [title, setTitle] = useState(mural?.title ?? '')
  const [slug, setSlug] = useState(mural?.slug ?? '')
  const [artists, setArtists] = useState(toArtistLines(mural?.artists, mural?.artist))
  const [location, setLocation] = useState(mural?.location_description ?? '')
  const [coords, setCoords] = useState<Coordinates | null>(mural?.coordinates ?? null)
  const [source, setSource] = useState<LocationSource | null>(null)
  const [confidence, setConfidence] = useState<ConfidenceLevel>(mural?.confidence ?? 'unverified')
  const [precision, setPrecision] = useState<PrecisionLabel | ''>(mural?.precision ?? '')
  const [year, setYear] = useState(mural?.year?.toString() ?? '')
  const [medium, setMedium] = useState(mural?.medium ?? '')
  const [notes, setNotes] = useState(mural?.notes ?? '')
  const [credit, setCredit] = useState(mural?.photo_credit ?? '')
  const [creditUrl, setCreditUrl] = useState(mural?.photo_credit_url ?? '')
  const [photos, setPhotos] = useState<string[]>(mural?.photos ?? [])
  const [placeType, setPlaceType] = useState<string>(mural?.place_type ?? '')
  const [changesOften, setChangesOften] = useState(mural?.changes_often ?? false)
  const [artwork, setArtwork] = useState<'original' | 'changed'>(mural?.artwork_status ?? 'original')
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const move = (i: number, d: number) => setPhotos(p => {
    const n = [...p]; const j = i + d
    if (j < 0 || j >= n.length) return p
    ;[n[i], n[j]] = [n[j], n[i]]; return n
  })

  async function upload(files: FileList | null) {
    if (!files?.length) return
    setUploading(true); setMsg(null)
    try {
      const folder = slug || slugify(title) || 'mural'
      const urls: string[] = []
      for (const f of Array.from(files)) {
        const body = await prepareImage(f)
        const path = `${folder}/${crypto.randomUUID()}.jpg`
        const { error } = await sb.storage.from('mural-photos').upload(path, body, { contentType: 'image/jpeg' })
        if (error) throw error
        urls.push(sb.storage.from('mural-photos').getPublicUrl(path).data.publicUrl)
      }
      setPhotos(p => [...p, ...urls])
    } catch (e) { setMsg({ ok: false, text: errMsg(e, 'Upload failed') }) }
    finally { setUploading(false); if (fileInput.current) fileInput.current.value = '' }
  }

  async function save() {
    setBusy(true); setMsg(null)
    try {
      // fill in links we already know for these artists, and remember any new ones
      const list = await enrichAndSaveArtists(parseArtists(artists))
      const row = {
        title: title.trim(), slug: (slug || slugify(title)).trim(),
        artist: list.length ? list.map(a => a.name).join(', ') : null,
        artists: list.length ? list : null,
        artist_verified: list.length > 0,
        location_description: location.trim() || 'Unknown',
        coordinates: coords, confidence, precision: precision || null,
        year: year ? parseInt(year, 10) : null, medium: medium.trim() || null, notes: notes.trim() || null,
        photo_credit: credit.trim() || null, photo_credit_url: creditUrl.trim() || null,
        photos, cover_photo: coverFor(photos[0]),
        artwork_status: artwork,
        place_type: placeType || null,
        changes_often: changesOften,
        // First time it's tagged Changed: keep the photos that were replaced as history.
        ...(artwork === 'changed' && mural?.artwork_status !== 'changed' ? {
          artwork_changed_at: new Date().toISOString(),
          previous_photos: [...(mural?.previous_photos ?? []), ...(mural?.photos ?? []).filter(u => !photos.includes(u))],
        } : {}),
        ...(artwork === 'original' ? { artwork_changed_at: null } : {}),
      }
      if (!row.title) throw new Error('Title is required')
      if (mural) {
        const { error } = await sb.from('murals').update(row).eq('id', mural.id)
        if (error) throw error
        setMsg({ ok: true, text: 'Saved.' }); router.refresh()
      } else {
        const { data, error } = await sb.from('murals').insert(row).select('id').single()
        if (error) throw error
        router.push(`/admin/murals/${data.id}`)
      }
    } catch (e) { setMsg({ ok: false, text: errMsg(e, 'Save failed') }) }
    finally { setBusy(false) }
  }

  async function remove() {
    if (!mural || !confirm(`Delete "${mural.title}"? This also deletes its comments and can't be undone.`)) return
    setBusy(true)
    const { error } = await sb.from('murals').delete().eq('id', mural.id)
    if (error) { setMsg({ ok: false, text: error.message }); setBusy(false); return }
    router.push('/admin/murals'); router.refresh()
  }

  return (
    <div className="space-y-4">
      <div className="bg-surface rounded-xl p-4 space-y-3">
        <div><label className={adminLabel}>Title</label><input className={adminField} value={title} onChange={e => setTitle(e.target.value)} /></div>
        <div><label className={adminLabel}>Slug (URL)</label>
          <input className={adminField} value={slug} placeholder={slugify(title)} onChange={e => setSlug(e.target.value)} disabled={!!mural} />
          {mural && <p className="text-caption text-ink-3 mt-1">Slug can’t change after creation (it’s in the URL and photo paths).</p>}</div>
        <div><label className={adminLabel}>Artists — one per line, “Name | instagram handle or link”</label>
          <textarea className={adminField} rows={3} value={artists} onChange={e => setArtists(e.target.value)} placeholder={'Senkoe | senkoeone'} />
          <p className="text-caption text-ink-3 mt-1">Known artists are filled in automatically: type just the name and their link is added on save. Handles are saved to the artist directory. Any non-Instagram link (TikTok, website…) works too.</p>
          {knownArtists.length > 0 && <p className="text-caption text-ink-3 mt-1">Known: {knownArtists.slice(0, 12).join(', ')}{knownArtists.length > 12 ? '…' : ''}</p>}</div>
        <div className="grid grid-cols-2 gap-2">
          <div><label className={adminLabel}>Status</label>
            <select className={adminField} value={confidence} onChange={e => setConfidence(e.target.value as ConfidenceLevel)}>{CONFIDENCE.map(c => <option key={c}>{c}</option>)}</select></div>
          <div><label className={adminLabel}>Precision</label>
            <select className={adminField} value={precision} onChange={e => setPrecision(e.target.value as PrecisionLabel | '')}>
              <option value="">(none — shows as location unknown)</option>{PRECISION.map(p => <option key={p}>{p}</option>)}</select></div>
          <div><label className={adminLabel}>Place (tag)</label>
            <select className={adminField} value={placeType} onChange={e => setPlaceType(e.target.value)}>
              <option value="">(none)</option>{PLACE_TYPES.map(p => <option key={p} value={p}>{p.replace('_', ' ')}</option>)}</select></div>
          <div className="flex items-end"><label className="flex items-center gap-2 text-body text-ink-2 pb-2.5">
            <input type="checkbox" checked={changesOften} onChange={e => setChangesOften(e.target.checked)} className="accent-sea" />
            Rotating wall (changes often)</label></div>
          <div className="col-span-2"><label className={adminLabel}>Artwork (the painting itself)</label>
            <select className={adminField} value={artwork} onChange={e => setArtwork(e.target.value as 'original' | 'changed')}>
              <option value="original">original</option><option value="changed">changed — repainted at the same spot</option></select>
            <p className="text-caption text-ink-3 mt-1">Status above is about the location; this is about the mural. When set to changed, replaced photos are kept as history.</p></div>
        </div>
      </div>

      <div className="bg-surface rounded-xl p-4 space-y-3">
        <div><label className={adminLabel}>Location description</label><input className={adminField} value={location} onChange={e => setLocation(e.target.value)} /></div>
        <LocationPicker coords={coords} source={source} onChange={(c, src) => { setCoords(c); setSource(src) }} />
        <AddressLocator address={location} onPick={(c, p) => { setCoords(c); setSource(null); setPrecision(p) }} />
        <p className="text-caption text-ink-3">Set precision above to mark the location as confirmed (anything except “lead” or none).</p>
      </div>

      <div className="bg-surface rounded-xl p-4 space-y-3">
        <p className={adminLabel}>Photos — first is the cover</p>
        <div className="space-y-2">
          {photos.map((u, i) => (
            <div key={u} className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={u} alt="" className="w-14 h-14 rounded-sm object-cover bg-groove shrink-0" />
              <p className="flex-1 min-w-0 text-caption text-ink-3 truncate">{i === 0 ? 'Cover · ' : ''}{u.split('/').slice(-2).join('/')}</p>
              <button type="button" aria-label="Move up" onClick={() => move(i, -1)} className="p-1.5 text-ink-2"><ArrowUp size={15} /></button>
              <button type="button" aria-label="Move down" onClick={() => move(i, 1)} className="p-1.5 text-ink-2"><ArrowDown size={15} /></button>
              <button type="button" aria-label="Remove photo" onClick={() => setPhotos(p => p.filter((_, j) => j !== i))} className="p-1.5 text-guessing"><Trash2 size={15} /></button>
            </div>
          ))}
        </div>
        <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={e => upload(e.target.files)} />
        <button type="button" className={ghostBtn} onClick={() => fileInput.current?.click()} disabled={uploading}>
          {uploading ? <Loader2 size={13} className="inline animate-spin" /> : <ImagePlus size={13} className="inline -mt-0.5" />} Add photos
        </button>
        <div className="grid grid-cols-2 gap-2">
          <div><label className={adminLabel}>Photo credit</label><input className={adminField} value={credit} onChange={e => setCredit(e.target.value)} placeholder="Name" /></div>
          <div><label className={adminLabel}>Credit link</label><input className={adminField} value={creditUrl} onChange={e => setCreditUrl(e.target.value)} placeholder="https://…" inputMode="url" /></div>
        </div>
      </div>

      <div className="bg-surface rounded-xl p-4 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div><label className={adminLabel}>Year</label><input className={adminField} value={year} onChange={e => setYear(e.target.value.replace(/\D/g, ''))} inputMode="numeric" /></div>
          <div><label className={adminLabel}>Medium</label><input className={adminField} value={medium} onChange={e => setMedium(e.target.value)} /></div>
        </div>
        <div><label className={adminLabel}>Notes</label><textarea className={adminField} rows={4} value={notes} onChange={e => setNotes(e.target.value)} /></div>
      </div>

      {msg && <p className={`text-small ${msg.ok ? 'text-certain' : 'text-guessing'}`} role="status">{msg.text}</p>}
      <div className="flex flex-wrap gap-2">
        <button className={primaryBtn} onClick={save} disabled={busy || uploading}>{busy ? 'Saving…' : mural ? 'Save changes' : 'Create mural'}</button>
        {mural && <Link href={`/gallery/${mural.slug}`} className={ghostBtn}>View</Link>}
        {mural && <button className={`${ghostBtn} !text-guessing ml-auto`} onClick={remove} disabled={busy}>Delete</button>}
      </div>
    </div>
  )
}
