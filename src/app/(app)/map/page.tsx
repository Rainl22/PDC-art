'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import * as maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { createClient } from '@/lib/supabase/client'
import { ConfidenceBadge } from '@/components/ui/ConfidenceBadge'
import { MenuButton } from '@/components/layout/SideMenu'
import { useT } from '@/lib/i18n/client'
import { ArtistLinks } from '@/components/mural/ArtistLinks'
import { LocationPill } from '@/components/ui/LocationPill'
import { getMuralGradient } from '@/lib/gradients'
import { Search, Navigation, ChevronRight, X } from 'lucide-react'
import Link from 'next/link'
import type { Mural } from '@/types/mural'

// The bundled MapLibre worker can't resolve its own URL under Next.js — serve it from /public.
maplibregl.setWorkerUrl('/maplibre/maplibre-gl-worker.mjs')

// confidence → pin colour
const PIN_COLOR: Record<string, string> = {
  verified:   '#0A7560',
  likely:     '#A86C10',
  unverified: '#9E2222',
  removed:    '#6038A0',
}

// Playa del Carmen centre
const PDC_CENTER: [number, number] = [-87.0739, 20.6296]

export default function MapPage() {
  const { t } = useT()
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef       = useRef<maplibregl.Map | null>(null)
  const markersRef   = useRef<maplibregl.Marker[]>([])

  const [murals, setMurals]       = useState<Mural[]>([])
  const [active, setActive]       = useState<Mural | null>(null)
  const [search, setSearch]       = useState('')

  // the map is a fixed full-screen view: stop the page itself from scrolling
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setActive(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // fetch murals
  useEffect(() => {
    const sb = createClient()
    sb.from('murals').select('*').then(({ data }) => setMurals((data ?? []) as Mural[]))
  }, [])

  // init map
  useEffect(() => {
    if (mapRef.current || !containerRef.current) return
    mapRef.current = new maplibregl.Map({
      container: containerRef.current,
      // OpenFreeMap: free vector tiles, no API key (attribution is added automatically)
      style: 'https://tiles.openfreemap.org/styles/positron',
      center: PDC_CENTER,
      zoom: 14,
    })
    mapRef.current.on('click', () => setActive(null))
    return () => { mapRef.current?.remove(); mapRef.current = null }
  }, [])

  // add markers when murals load
  useEffect(() => {
    if (!mapRef.current) return
    // clear old markers
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []

    murals
      .filter(m => m.coordinates)
      .forEach(mural => {
        const el = document.createElement('div')
        const lead = mural.precision === 'lead'
        const color = PIN_COLOR[mural.confidence] ?? '#326A82'
        el.style.cssText = `
          width:20px;height:20px;border-radius:50%;
          background:${lead ? 'white' : color};
          border:3px ${lead ? `dashed ${color}` : 'solid white'};
          box-shadow:0 2px 8px rgba(0,0,0,.28);
          cursor:pointer;
        `
        el.addEventListener('click', e => { e.stopPropagation(); setActive(mural) })
        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([mural.coordinates!.lng, mural.coordinates!.lat])
          .addTo(mapRef.current!)
        markersRef.current.push(marker)
      })
  }, [murals])

  const withCoords = murals.filter(m => m.coordinates).length
  const missing = murals.length - withCoords

  return (
    <div className="fixed inset-x-0 top-0 bottom-[var(--nav-h)] bg-bg overflow-hidden overscroll-none">
      {/* map */}
      <div ref={containerRef} className="w-full h-full" style={{ position: 'absolute', inset: 0 }} />

      {/* search bar */}
      <div className="absolute top-safe-or-12 left-3 right-3 z-10 flex items-center gap-2">
        <MenuButton className="shadow-md" />
        <div className="flex-1 bg-white rounded-full shadow-md px-4 py-2.5 flex items-center gap-2">
          <Search size={14} className="text-ink-3 shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('map.search')}
            className="flex-1 text-[13px] outline-none placeholder:text-ink-3"
          />
        </div>
      </div>

      {/* murals we can't place yet */}
      {withCoords > 0 && missing > 0 && !active && (
        <Link href="/gallery"
          className="absolute top-[4.75rem] left-3 z-10 inline-flex items-center gap-1.5 bg-white/90 backdrop-blur-sm rounded-full shadow-md px-3 py-1.5 text-[11px] font-display font-semibold text-ink-2">
          <span className="w-1.5 h-1.5 rounded-full bg-guessing" />
          {t(missing === 1 ? 'map.missing.one' : 'map.missing.many', { n: missing })}
        </Link>
      )}

      {/* no-coords notice */}
      {withCoords === 0 && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-10 bg-white/90 backdrop-blur-sm rounded-xl px-5 py-3 shadow-md text-center w-72">
          <p className="text-[13px] font-display font-semibold text-ink mb-1">{t('map.soon')}</p>
          <p className="text-[11px] text-ink-2 leading-relaxed">
            {t('map.soonBody')}
          </p>
        </div>
      )}

      {/* bottom drawer */}
      {active && (
        <div className="absolute bottom-0 left-0 right-0 z-20">
          <div className="bg-surface rounded-t-2xl shadow-xl overflow-hidden">
            {/* mural image */}
            <div className="relative h-36">
              {active.cover_photo
                ? <img src={active.cover_photo} alt={active.title} className="w-full h-full object-cover" />
                : <div className="w-full h-full" style={{ background: getMuralGradient(active.slug) }} />
              }
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/40" />
              {/* drag handle */}
              <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-9 h-1 bg-white/50 rounded-full" />
              {/* badge */}
              <div className="absolute top-4 left-3">
                <ConfidenceBadge level={active.confidence} sm />
              </div>
              {/* close */}
              <button onClick={() => setActive(null)}
                aria-label={t('map.close')}
                className="absolute top-2.5 right-2.5 w-9 h-9 rounded-full bg-black/40 flex items-center justify-center text-white">
                <X size={16} />
              </button>
            </div>
            {/* info */}
            <div className="px-4 py-4">
              <p className="font-display font-bold text-[16px] mb-0.5">{active.title}</p>
              {(active.artist || active.artists?.length) && <p className="text-sea text-[12px] font-medium mb-1"><ArtistLinks mural={active} /></p>}
              <p className="text-ink-3 text-[11px] mb-2">{active.location_description}</p>
              {active.precision === 'lead' && <div className="mb-3"><LocationPill mural={active} sm /></div>}
              <div className="flex gap-3">
                {active.coordinates && (
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${active.coordinates.lat},${active.coordinates.lng}&travelmode=walking`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex-1 bg-sea text-white rounded-full py-2.5 flex items-center justify-center gap-2 text-[12px] font-display font-semibold"
                  >
                    <Navigation size={13} /> {t('map.takeMe')}
                  </a>
                )}
                <Link href={`/gallery/${active.slug}`}
                  className="flex-1 bg-bg text-ink rounded-full py-2.5 flex items-center justify-center gap-1 text-[12px] font-display font-semibold">
                  {t('map.details')} <ChevronRight size={13} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
