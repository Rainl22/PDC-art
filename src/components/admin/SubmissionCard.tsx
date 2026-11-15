'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ExternalLink, Check, X, Plus, MapPin } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { slugify } from '@/lib/slug'
import { adminField, adminLabel, primaryBtn, ghostBtn, CONFIDENCE, PRECISION } from './fields'
import type { Submission, ConfidenceLevel, PrecisionLabel } from '@/types/mural'

const EXISTING = /Location suggestion for existing mural:\s*([a-z0-9-]+)/i

export function SubmissionCard({ submission: s }: { submission: Submission }) {
  const router = useRouter()
  const sb = createClient()
  const existingSlug = s.notes?.match(EXISTING)?.[1] ?? null
  const photos = (s.photo_paths ?? []).map(p => sb.storage.from('submissions').getPublicUrl(p).data.publicUrl)
  const pending = s.status === 'pending'

  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [title, setTitle] = useState(s.title ?? '')
  const [artist, setArtist] = useState(s.artist ?? '')
  const [location, setLocation] = useState(s.location_description)
  const [confidence, setConfidence] = useState<ConfidenceLevel>('unverified')
  const [precision, setPrecision] = useState<PrecisionLabel | ''>(s.coordinates ? 'landmark' : '')

  async function finish(status: 'approved' | 'rejected') {
    const { error: e } = await sb.from('submissions').update({ status }).eq('id', s.id)
    if (e) throw e
    router.refresh()
  }
  const run = async (fn: () => Promise<void>) => {
    setBusy(true); setError(null)
    try { await fn() } catch (e) { setError(e instanceof Error ? e.message : 'Something went wrong') } finally { setBusy(false) }
  }

  const createMural = () => run(async () => {
    const base = slugify(title || location)
    let slug = base
    for (let i = 2; i < 20; i++) {
      const { data } = await sb.from('murals').select('id').eq('slug', slug).maybeSingle()
      if (!data) break
      slug = `${base}-${i}`
    }
    const { error: e } = await sb.from('murals').insert({
      slug, title: title.trim() || 'Untitled', artist: artist.trim() || null,
      location_description: location.trim(), coordinates: s.coordinates ?? null,
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
          <p className="font-display font-semibold text-[14px] truncate">{s.title || 'Untitled'}</p>
          <p className="text-[11px] text-ink-3">{new Date(s.created_at).toLocaleString()} · {s.status}</p>
        </div>
        {existingSlug && <Link href={`/gallery/${existingSlug}`} className="shrink-0 text-[11px] text-sea underline underline-offset-2">Location for {existingSlug}</Link>}
      </div>

      {photos.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {photos.map(u => (
            <a key={u} href={u} target="_blank" rel="noopener noreferrer" className="aspect-square rounded-sm overflow-hidden bg-groove block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={u} alt="" className="w-full h-full object-cover" />
            </a>
          ))}
        </div>
      )}

      <div className="text-[12px] text-ink-2 space-y-1">
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

      {pending && !open && (
        <div className="flex flex-wrap gap-2">
          <button className={primaryBtn} onClick={() => setOpen(true)}>
            {existingSlug ? <><Check size={12} className="inline -mt-0.5" /> Apply location…</> : <><Plus size={12} className="inline -mt-0.5" /> Create mural…</>}
          </button>
          <button className={ghostBtn} disabled={busy} onClick={() => run(() => finish('rejected'))}><X size={12} className="inline -mt-0.5" /> Reject</button>
        </div>
      )}

      {pending && open && (
        <div className="space-y-2 border-t border-groove pt-3">
          {!existingSlug && (
            <>
              <div><label className={adminLabel}>Title</label><input className={adminField} value={title} onChange={e => setTitle(e.target.value)} /></div>
              <div><label className={adminLabel}>Artist</label><input className={adminField} value={artist} onChange={e => setArtist(e.target.value)} /></div>
            </>
          )}
          <div><label className={adminLabel}>Location description</label><input className={adminField} value={location} onChange={e => setLocation(e.target.value)} /></div>
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
      {error && <p className="text-[12px] text-guessing" role="alert">{error}</p>}
    </div>
  )
}
