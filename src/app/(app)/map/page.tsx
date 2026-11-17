'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import * as maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { createClient } from '@/lib/supabase/client'
import { ConfidenceBadge } from '@/components/ui/ConfidenceBadge'
import { ArtworkBadge } from '@/components/ui/ArtworkBadge'
import { MenuButton } from '@/components/layout/SideMenu'
import { useT } from '@/lib/i18n/client'
import { ArtistLinks } from '@/components/mural/ArtistLinks'
import { LocationPill } from '@/components/ui/LocationPill'
import { getMuralGradient } from '@/lib/gradients'
import { Search, Navigation, ChevronRight, X, LocateFixed, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { metresBetween, formatDistance } from '@/lib/geo'
import type { Mural } from '@/types/mural'

// The bundled MapLibre worker can't resolve its own URL under Next.js — serve it from /public.
maplibregl.setWorkerUrl('/maplibre/maplibre-gl-worker.mjs')

// confidence → pin colour
// (design tokens, so pins always match the status badges)
const PIN_COLOR: Record<string, string> = {
  verified:   'var(--certain)',
  likely:     'var(--likely)',
  unverified: 'var(--guessing)',
  removed:    'var(--removed)',
}

// Playa del Carmen centre
const PDC_CENTER: [number, number] = [-87.0739, 20.6296]

/** Swipeable photos on the map card; tapping a photo (or the card text) opens the mural page. */
function CardPhotos({ photos, title, slug, onOpen }: { photos: string[]; title: string; slug: string; onOpen: () => void }) {
  const [i, setI] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => { setI(0); ref.current?.scrollTo({ left: 0 }) }, [slug])
  if (photos.length === 0) return <button type="button" onClick={onOpen} aria-label={title} className="block w-full h-full" style={{ background: getMuralGradient(slug) }} />
  return (
    <>
      <div ref={ref} onScroll={() => { const el = ref.current; if (el) setI(Math.round(el.scrollLeft / el.clientWidth)) }}
        className="flex h-full overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {photos.map((src, k) => (
          <button key={src} type="button" onClick={onOpen} aria-label={title} className="shrink-0 w-full h-full snap-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={`${title} — ${k + 1}`} loading={k === 0 ? 'eager' : 'lazy'} className="w-full h-full object-cover" draggable={false} />
          </button>
        ))}
      </div>
      {photos.length > 1 && (
        <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5 pointer-events-none">
          {photos.map((_, k) => <span key={k} className={`h-1.5 rounded-full transition-all ${k === i ? 'w-4 bg-on-dark' : 'w-1.5 bg-glass-dim'}`} />)}
        </div>
      )}
    </>
  )
}

export default function MapPage() {
  const { t } = useT()
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef       = useRef<maplibregl.Map | null>(null)
  const markersRef   = useRef<maplibregl.Marker[]>([])

  const [murals, setMurals]       = useState<Mural[]>([])
  const router = useRouter()
  const [active, setActive]       = useState<Mural | null>(null)
  const [search, setSearch]       = useState('')
  const [me, setMe]               = useState<{ lat: number; lng: number } | null>(null)
  const [locating, setLocating]   = useState(false)
  const [locError, setLocError]   = useState(false)
  const [mapReady, setMapReady]   = useState(false)
  const [hint, setHint]           = useState<'tap' | 'blocked' | null>(null)
  const watchRef  = useRef<number | null>(null)
  const meMarker  = useRef<maplibregl.Marker | null>(null)
  const centered  = useRef(false)

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
    setMapReady(true)
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
        const color = PIN_COLOR[mural.confidence] ?? 'var(--sea)'
        el.style.cssText = `
          width:20px;height:20px;border-radius:50%;
          background:${lead ? 'var(--surface)' : color};
          border:3px ${lead ? `dashed ${color}` : 'solid var(--on-dark)'};
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

  // "my location": starts on tap (so the browser's permission prompt is a response to a user action)
  const locate = useCallback(() => {
    const map = mapRef.current
    if (!map) return
    if (me && watchRef.current !== null) { map.easeTo({ center: [me.lng, me.lat], zoom: Math.max(map.getZoom(), 16) }); return }
    if (!('geolocation' in navigator)) { setLocError(true); return }
    setLocating(true); setLocError(false)
    watchRef.current = navigator.geolocation.watchPosition(
      pos => {
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setMe(p); setLocating(false); setHint(null)
        try { localStorage.setItem('pdc.located', '1') } catch { /* private mode */ }
        if (!meMarker.current) {
          const el = document.createElement('div')
          el.style.cssText = 'width:16px;height:16px;border-radius:50%;background:var(--you);border:3px solid var(--on-dark);box-shadow:0 0 0 6px color-mix(in srgb, var(--you) 25%, transparent),0 2px 6px rgb(0 0 0 / .3);'
          meMarker.current = new maplibregl.Marker({ element: el }).setLngLat([p.lng, p.lat]).addTo(map)
        } else meMarker.current.setLngLat([p.lng, p.lat])
        if (!centered.current) { centered.current = true; map.easeTo({ center: [p.lng, p.lat], zoom: Math.max(map.getZoom(), 16) }) }
      },
      () => { setLocating(false); setLocError(true); if (watchRef.current !== null) { navigator.geolocation.clearWatch(watchRef.current); watchRef.current = null } },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 },
    )
  }, [me])

  // Show my location automatically when the browser already allows it; otherwise explain the button.
  // (Browsers only ask for permission after a tap, so the first time it has to be the button.)
  useEffect(() => {
    if (!mapReady) return
    let off = false
    ;(async () => {
      let state: string = 'unknown'
      try { state = (await navigator.permissions.query({ name: 'geolocation' as PermissionName })).state } catch { /* Permissions API not available */ }
      if (off) return
      let before = false
      try { before = localStorage.getItem('pdc.located') === '1' } catch { /* ignore */ }
      if (state === 'granted' || (state === 'unknown' && before)) locate()
      else if (state === 'denied') setHint('blocked')
      else setHint('tap')
    })()
    return () => { off = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapReady])

  // the hint goes away on its own
  useEffect(() => {
    if (!hint) return
    const id = setTimeout(() => setHint(null), 9000)
    return () => clearTimeout(id)
  }, [hint])

  useEffect(() => () => {
    if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current)
    meMarker.current?.remove()
  }, [])

  const withCoords = murals.filter(m => m.coordinates).length

  return (
    <div className="fixed inset-x-0 top-0 bottom-[var(--nav-h)] bg-bg overflow-hidden overscroll-none">
      {/* map */}
      <div ref={containerRef} className="w-full h-full" style={{ position: 'absolute', inset: 0 }} />

      {/* search bar */}
      <div className="absolute top-controls left-gutter right-gutter z-10 flex items-center gap-2">
        <MenuButton className="shadow-md" />
        <div className="flex-1 h-control bg-surface rounded-full shadow-md px-4 flex items-center gap-2">
          <Search size={14} className="text-ink-3 shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('map.search')}
            className="flex-1 text-body outline-none placeholder:text-ink-3"
          />
        </div>
      </div>

      {/* my location */}
      <div className="absolute top-[calc(var(--inset-top-controls)+var(--control-h)+var(--gap-control))] right-gutter z-10 flex flex-col items-end gap-1.5">
        <button onClick={() => { setHint(null); locate() }} aria-label={t('map.locate')}
          className={`w-control h-control rounded-full shadow-md flex items-center justify-center ${me ? 'bg-surface text-you' : 'bg-surface text-ink-2'}`}>
          {locating ? <Loader2 size={17} className="animate-spin" /> : <LocateFixed size={17} />}
        </button>
        {hint && !me && (
          <div role="status" className="bg-ink text-surface rounded-panel shadow-lg px-3 py-2 text-caption max-w-[220px] flex items-start gap-2">
            <span className="flex-1">{hint === 'tap' ? t('map.hintTap') : t('map.hintBlocked')}</span>
            <button onClick={() => setHint(null)} aria-label={t('map.close')} className="opacity-70 hover:opacity-100"><X size={12} /></button>
          </div>
        )}
        {locError && <p className="bg-glass rounded-panel shadow-md px-3 py-1.5 text-caption text-guessing max-w-[200px] text-right">{t('map.locError')}</p>}
      </div>

      {/* no-coords notice */}
      {withCoords === 0 && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-10 bg-glass backdrop-blur-sm rounded-sheet px-5 py-3 shadow-md text-center w-72">
          <p className="text-body font-display font-semibold text-ink mb-1">{t('map.soon')}</p>
          <p className="text-caption text-ink-2 leading-relaxed">
            {t('map.soonBody')}
          </p>
        </div>
      )}

      {/* bottom drawer */}
      {active && (
        <div className="absolute bottom-0 left-0 right-0 z-20">
          <div className="bg-surface rounded-t-panel shadow-xl overflow-hidden">
            {/* mural image */}
            <div className="relative h-36">
              <CardPhotos photos={active.photos?.length ? active.photos : active.cover_photo ? [active.cover_photo] : []} title={active.title} slug={active.slug}
                onOpen={() => router.push(`/gallery/${active.slug}`)} />
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent to-black/40" />
              {/* drag handle */}
              <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-9 h-1 bg-glass-dim rounded-full pointer-events-none" />
              {/* badge */}
              <div className="absolute top-4 left-3 flex gap-1 pointer-events-none">
                <ConfidenceBadge level={active.confidence} sm />
                <ArtworkBadge mural={active} sm />
              </div>
              {/* close */}
              <button onClick={() => setActive(null)}
                aria-label={t('map.close')}
                className="absolute top-2.5 right-2.5 w-9 h-9 rounded-full bg-scrim flex items-center justify-center text-on-dark">
                <X size={16} />
              </button>
            </div>
            {/* info */}
            <div className="px-4 py-4 cursor-pointer"
              onClick={e => { if (!(e.target as HTMLElement).closest('a,button')) router.push(`/gallery/${active.slug}`) }}>
              <p className="font-display font-bold text-card mb-0.5">{active.title}</p>
              {(active.artist || active.artists?.length) && <p className="text-sea text-small font-medium mb-1"><ArtistLinks mural={active} /></p>}
              <p className="text-ink-3 text-caption mb-2">{active.location_description}</p>
              {me && active.coordinates && (
                <p className="text-small font-display font-semibold text-sea mb-2">{t('map.away', { d: formatDistance(metresBetween(me, active.coordinates)) })}</p>
              )}
              {active.precision === 'lead' && <div className="mb-3"><LocationPill mural={active} sm /></div>}
              <div className="flex gap-3">
                {active.coordinates && (
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${active.coordinates.lat},${active.coordinates.lng}&travelmode=walking`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex-1 bg-sea text-on-dark rounded-full py-2.5 flex items-center justify-center gap-2 text-small font-display font-semibold"
                  >
                    <Navigation size={13} /> {t('map.takeMe')}
                  </a>
                )}
                <Link href={`/gallery/${active.slug}`}
                  className="flex-1 bg-bg text-ink rounded-full py-2.5 flex items-center justify-center gap-1 text-small font-display font-semibold">
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
