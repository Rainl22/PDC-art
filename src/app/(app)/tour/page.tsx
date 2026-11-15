'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getTourIds, clearTour, buildGoogleMapsUrl } from '@/lib/tour'
import { getMuralGradient } from '@/lib/gradients'
import { Clock, Navigation, Plus, GripVertical, Trash2 } from 'lucide-react'
import Link from 'next/link'
import type { Mural } from '@/types/mural'

export default function TourPage() {
  const router = useRouter()
  const [stops, setStops]   = useState<Mural[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const ids = getTourIds()
    if (ids.length === 0) { setLoading(false); return }
    const sb = createClient()
    sb.from('murals').select('*').in('id', ids).then(({ data }) => {
      // preserve order
      const map = new Map((data ?? []).map((m: Mural) => [m.id, m]))
      setStops(ids.map(id => map.get(id)).filter(Boolean) as Mural[])
      setLoading(false)
    })
  }, [])

  function remove(id: string) {
    setStops(prev => prev.filter(s => s.id !== id))
  }

  function startTour() {
    const coords = stops.map(s => s.coordinates).filter(Boolean) as { lat: number; lng: number }[]
    const url = buildGoogleMapsUrl(coords)
    if (url) window.open(url, '_blank')
  }

  const hasCoords   = stops.filter(s => s.coordinates).length
  const canNavigate = hasCoords >= 2
  const walkMins    = stops.length * 10 // rough estimate

  if (loading) return (
    <div className="flex items-center justify-center h-[calc(100dvh-var(--nav-h))]">
      <div className="w-8 h-8 border-2 border-sea border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (stops.length === 0) return (
    <div className="flex flex-col items-center justify-center h-[calc(100dvh-var(--nav-h))] gap-4 px-8 text-center">
      <div className="w-16 h-16 rounded-2xl bg-sea-tint flex items-center justify-center">
        <Navigation size={28} className="text-sea" />
      </div>
      <h1 className="font-display font-bold text-xl">No tour yet</h1>
      <p className="text-ink-2 text-[14px] leading-relaxed">
        Go to the gallery, tap <strong>Select</strong>, choose your murals, then hit <strong>Build Tour</strong>.
      </p>
      <Link href="/gallery"
        className="mt-2 bg-sea text-white rounded-full px-6 py-3 font-display font-semibold text-[14px]">
        Browse Gallery
      </Link>
    </div>
  )

  return (
    <div className="flex flex-col min-h-[calc(100dvh-var(--nav-h))] bg-bg">
      {/* header */}
      <header className="bg-surface border-b border-groove sticky top-0 z-10 px-4 pt-safe pb-0">
        <div className="py-3 flex items-start justify-between">
          <div>
            <h1 className="font-display font-bold text-[17px]">My Tour</h1>
            <div className="flex items-center gap-1.5 mt-1 text-[12px] text-ink-3">
              <Clock size={12} />
              <span>~{walkMins} min walk · {stops.length} stop{stops.length > 1 ? 's' : ''}</span>
            </div>
          </div>
          <button onClick={() => { clearTour(); setStops([]) }}
            className="text-[12px] text-ink-3 font-medium mt-1">
            Clear
          </button>
        </div>
      </header>

      {/* stops list */}
      <div className="flex-1 p-3">
        {stops.map((stop, i) => (
          <div key={stop.id}>
            <div className="bg-surface rounded-xl overflow-hidden flex items-center gap-0 shadow-sm">
              {/* number */}
              <div className="w-9 text-center font-display font-bold text-[13px] text-ink-3 shrink-0">{i + 1}</div>
              {/* thumb */}
              <div className="w-14 h-14 shrink-0 overflow-hidden">
                {stop.cover_photo
                  ? <img src={stop.cover_photo} alt={stop.title} className="w-full h-full object-cover" />
                  : <div className="w-full h-full" style={{ background: getMuralGradient(stop.slug) }} />
                }
              </div>
              {/* info */}
              <div className="flex-1 px-3 min-w-0">
                <p className="text-[13px] font-medium text-ink truncate">{stop.title}</p>
                <p className="text-[11px] text-ink-3 truncate mt-0.5">{stop.artist ?? stop.location_description}</p>
              </div>
              {/* actions */}
              <div className="flex items-center pr-2 gap-1">
                <button onClick={() => remove(stop.id)} className="p-2 text-ink-3 hover:text-guessing">
                  <Trash2 size={14} />
                </button>
                <div className="p-2 text-ink-3 cursor-grab">
                  <GripVertical size={14} />
                </div>
              </div>
            </div>
            {/* leg indicator */}
            {i < stops.length - 1 && (
              <div className="flex items-center gap-2 py-2 pl-9">
                <div className="w-0.5 h-5 bg-groove rounded-full" />
                <span className="text-[11px] text-ink-3">~10 min walk</span>
              </div>
            )}
          </div>
        ))}

        {/* add more */}
        <Link href="/gallery"
          className="mt-2 flex items-center justify-center gap-2 py-4 border-2 border-dashed border-groove rounded-xl">
          <Plus size={15} className="text-ink-3" />
          <span className="text-[13px] text-ink-3 font-display font-semibold">Add another mural</span>
        </Link>
      </div>

      {/* footer */}
      <div className="bg-surface border-t border-groove px-4 py-4 sticky bottom-[var(--nav-h)] z-10">
        {/* stats */}
        <div className="flex items-center mb-4">
          <div className="flex-1 text-center">
            <p className="font-display font-bold text-[17px]">{stops.length}</p>
            <p className="text-[10px] text-ink-3 mt-0.5">murals</p>
          </div>
          <div className="w-px h-8 bg-groove" />
          <div className="flex-1 text-center">
            <p className="font-display font-bold text-[17px]">~{walkMins}m</p>
            <p className="text-[10px] text-ink-3 mt-0.5">walk time</p>
          </div>
          <div className="w-px h-8 bg-groove" />
          <div className="flex-1 text-center">
            <p className="font-display font-bold text-[17px]">{(stops.length * 0.4).toFixed(1)} km</p>
            <p className="text-[10px] text-ink-3 mt-0.5">distance</p>
          </div>
        </div>
        <button
          onClick={startTour}
          disabled={!canNavigate}
          className="w-full bg-sea text-white rounded-full py-3 flex items-center justify-center gap-2 font-display font-semibold text-[14px] disabled:opacity-50"
        >
          <Navigation size={15} />
          {canNavigate ? 'Start Tour in Google Maps' : 'Coordinates pending verification'}
        </button>
      </div>
    </div>
  )
}
