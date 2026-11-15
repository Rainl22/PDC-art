'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ImagePlus, X, CheckCircle2, ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { submitMural } from '@/lib/murals'
import { prepareImage } from '@/lib/image'
import { LocationPicker, type LocationSource } from './LocationPicker'
import type { Coordinates } from '@/types/mural'

const MAX_PHOTOS = 4
const MAX_BYTES = 25 * 1024 * 1024 // originals are resized before upload
const TYPES = ['image/jpeg', 'image/png', 'image/webp']
const field = 'w-full text-[13px] bg-surface rounded-md px-3 py-2.5 outline-none border border-groove focus:border-sea placeholder:text-ink-3'

export function SubmitForm({ existing }: { existing?: { slug: string; title: string } | null }) {
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

  async function addFiles(list: FileList | null) {
    if (!list) return
    const next = [...files]
    const added: File[] = []
    for (const f of Array.from(list)) {
      if (!TYPES.includes(f.type)) { setError('Photos must be JPEG, PNG or WebP.'); continue }
      if (f.size > MAX_BYTES) { setError('Each photo must be under 25 MB.'); continue }
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

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if ((!location.trim() && !coords) || loading) return
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
        title: title.trim() || null,
        artist: artist.trim() || null,
        location_description: location.trim() || (coords ? `Pinned location (${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)})` : ''),
        coordinates: coords,
        location_source: coords ? source : location.trim() ? 'manual' : null,
        notes: [existing ? `Location suggestion for existing mural: ${existing.slug}` : '', notes.trim()].filter(Boolean).join('\n') || null,
        photo_paths: paths,
      })
      setDone(true)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="bg-surface rounded-md p-6 text-center">
        <CheckCircle2 className="mx-auto text-certain" size={36} />
        <p className="font-display font-semibold mt-3">Thank you!</p>
        <p className="text-[13px] text-ink-2 mt-1">Your submission is pending review.</p>
        <Link href={existing ? `/gallery/${existing.slug}` : '/gallery'}
          className="inline-flex items-center gap-1 mt-5 rounded-full border border-sea text-sea px-4 py-2 text-[13px] font-display font-semibold">
          <ChevronLeft size={15} />
          {existing ? `Back to ${existing.title}` : 'Back to gallery'}
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <input className={field} placeholder="Title (if you know it)" value={title} onChange={e => setTitle(e.target.value)} />
      <input className={field} placeholder="Artist (if you know it)" value={artist} onChange={e => setArtist(e.target.value)} />
      <input className={field} required={!coords} placeholder={`Where is it? Street, cross street, landmark${coords ? '' : ' *'}`} value={location} onChange={e => setLocation(e.target.value)} />
      <LocationPicker coords={coords} source={source} onChange={(c, src) => { setCoords(c); setSource(src) }} />
      <textarea className={field} rows={3} placeholder="Notes" value={notes} onChange={e => setNotes(e.target.value)} />

      <div>
        <div className="grid grid-cols-4 gap-2">
          {files.map((f, i) => (
            <div key={i} className="relative aspect-square rounded-sm overflow-hidden bg-groove">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
              <button type="button" aria-label="Remove photo" onClick={() => setFiles(files.filter((_, j) => j !== i))}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center">
                <X size={12} />
              </button>
            </div>
          ))}
          {files.length < MAX_PHOTOS && (
            <label className="aspect-square rounded-sm border border-dashed border-ink-3 flex items-center justify-center text-ink-3 cursor-pointer">
              <ImagePlus size={20} />
              <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden"
                onChange={e => { addFiles(e.target.files); e.target.value = '' }} />
            </label>
          )}
        </div>
        <p className="text-[11px] text-ink-3 mt-1.5">Up to {MAX_PHOTOS} photos. If a photo has location data, we\u2019ll use it for the pin.</p>
      </div>

      {error && <p className="text-[12px] text-guessing" role="alert">{error}</p>}
      <button type="submit" disabled={(!location.trim() && !coords) || loading}
        className="w-full rounded-full bg-sea text-white font-display font-medium py-3 text-[14px] disabled:opacity-40">
        {loading ? 'Submitting…' : 'Submit mural'}
      </button>
    </form>
  )
}
