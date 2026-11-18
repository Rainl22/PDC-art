'use client'
import { ThumbImg } from '@/components/ui/ThumbImg'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import * as maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { Navigation, Route } from 'lucide-react'
import { useMuralPins } from '@/lib/useMuralPins'
import { useTour, buildGoogleMapsUrl } from '@/lib/tour'
import { distanceKm } from '@/lib/geo'
import { walkMinutes } from '@/lib/format'
import { useT } from '@/lib/i18n/client'
import type { Mural } from '@/types/mural'

maplibregl.setWorkerUrl('/maplibre/maplibre-gl-worker.mjs')

/** Desktop map panel next to the Explore grid: same photo pins; hover/selection stays in sync with the cards; docked tour tray. */
export default function ExploreMap({ murals, all, activeId, hoverId, onSelect }: {
  murals: Mural[]; all: Mural[]; activeId: string | null; hoverId: string | null; onSelect: (m: Mural) => void
}) {
  const { t } = useT()
  const ref = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const [ready, setReady] = useState(false)
  const tour = useTour()

  useEffect(() => {
    if (!ref.current || mapRef.current) return
    // start already framed on the pins (set at creation: more reliable than moving the camera before the style has loaded)
    const b = new maplibregl.LngLatBounds()
    let n = 0
    murals.forEach(m => { if (m.coordinates) { b.extend([m.coordinates.lng, m.coordinates.lat]); n++ } })
    const map = new maplibregl.Map({
      container: ref.current, style: 'https://tiles.openfreemap.org/styles/positron', attributionControl: false,
      ...(n > 0 ? { bounds: b, fitBoundsOptions: { padding: 60, maxZoom: 16 } } : { center: [-87.0739, 20.6296] as [number, number], zoom: 14 }),
    })
    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right')
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')
    mapRef.current = map
    setReady(true)
    return () => { map.remove(); mapRef.current = null }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useMuralPins({ mapRef, ready, murals, activeId, hoverId, onSelect })

  // bring the selected mural into view
  useEffect(() => {
    const m = all.find(x => x.id === activeId)
    if (m?.coordinates && mapRef.current) mapRef.current.easeTo({ center: [m.coordinates.lng, m.coordinates.lat] })
  }, [activeId, all])

  const stops = tour.ids.map(id => all.find(m => m.id === id)).filter(Boolean) as Mural[]
  const routable = stops.filter(s => s.coordinates)
  const mins = walkMinutes(routable.slice(1).reduce((sum, s, i) => sum + distanceKm(routable[i].coordinates!, s.coordinates!) * 1300, 0))
  const url = buildGoogleMapsUrl(routable.map(s => s.coordinates!))

  return (
    <div className="relative w-full h-full rounded-card overflow-hidden bg-groove shadow-1">
      <div ref={ref} className="w-full h-full" style={{ position: 'absolute', inset: 0 }} />
      {stops.length > 0 && (
        <div className="absolute left-3 right-3 bottom-3 z-10 bg-surface rounded-panel shadow-2 p-3 flex items-center gap-3">
          <div className="flex -space-x-2 shrink-0" aria-hidden>
            {stops.slice(0, 4).map(s => (
              // eslint-disable-next-line @next/next/no-img-element
              <ThumbImg key={s.id} src={s.cover_photo ?? ''} alt="" className="w-9 h-9 rounded-full object-cover border-2 border-surface bg-groove" />
            ))}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-14 font-semibold truncate">{t(stops.length === 1 ? 'tour.tray.one' : 'tour.tray.many', { n: stops.length })}</p>
            {routable.length > 1 && <p className="text-13 text-ink-2 truncate">{t('tour.minutes', { n: mins })} · {t('tour.summary.walking')}</p>}
          </div>
          <Link href="/tour" className="h-10 px-3 rounded-full bg-marigold-tint text-ink text-14 font-semibold flex items-center gap-1"><Route size={16} />{t('tour.view')}</Link>
          {url && <a href={url} target="_blank" rel="noopener noreferrer" className="h-10 px-4 rounded-full bg-sea text-on-dark text-14 font-semibold flex items-center gap-1.5"><Navigation size={16} />{t('tour.walk')}</a>}
        </div>
      )}
    </div>
  )
}
