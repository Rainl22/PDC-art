'use client'
import { ThumbImg } from '@/components/ui/ThumbImg'
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
import { GroupPicker } from '@/components/mural/GroupPicker'
import { TourButton } from '@/components/ui/TourButton'
import { HeartIcon } from '@/components/mural/LikeButton'
import { getMuralGradient } from '@/lib/gradients'
import { useMuralPins, reducedMotion } from '@/lib/useMuralPins'
import { displayTitle, displayPlace, walkMinutes } from '@/lib/format'
import { Search, Navigation, X, LocateFixed, Loader2, Images } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { track } from '@/lib/track'
import { metresBetween, formatDistance } from '@/lib/geo'
import { matchMural } from '@/lib/search'
import type { Mural } from '@/types/mural'

// The bundled MapLibre worker can't resolve its own URL under Next.js — serve it from /public.
maplibregl.setWorkerUrl('/maplibre/maplibre-gl-worker.mjs')

// Playa del Carmen centre
const PDC_CENTER: [number, number] = [-87.0739, 20.6296]

/** Space reserved at the bottom of the map for the pin card on phones, so a selected pin is never hidden behind it. */
const SHEET_PAD = 280

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
            <ThumbImg src={src} alt={`${title} — ${k + 1}`} loading={k === 0 ? 'eager' : 'lazy'} decoding="async" className="w-full h-full object-cover" draggable={false} />
          </button>
        ))}
      </div>
      {photos.length > 1 && (
        <span className="absolute bottom-1.5 right-1.5 flex items-center gap-1 text-12 font-semibold text-on-dark bg-scrim rounded-full px-1.5 py-px pointer-events-none">
          <Images size={11} aria-hidden />{i + 1}/{photos.length}
        </span>
      )}
    </>
  )
}

export default function MapPage() {
  const { t } = useT()
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef       = useRef<maplibregl.Map | null>(null)

  const [murals, setMurals]       = useState<Mural[]>([])
  const router = useRouter()
  const [active, setActive]       = useState<Mural | null>(null)
  const [group, setGroup]         = useState<Mural[] | null>(null)   // murals too close to separate
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
    sb.from('murals').select('*').then(({ data }) => setMurals(((data ?? []) as Mural[]).filter(m => m.confidence !== 'removed')))
  }, [])

  // init map
  useEffect(() => {
    if (mapRef.current || !containerRef.current) return
    const map = new maplibregl.Map({
      container: containerRef.current,
      // OpenFreeMap: free vector tiles, no API key
      style: 'https://tiles.openfreemap.org/styles/positron',
      center: PDC_CENTER,
      zoom: 14,
      attributionControl: false,
    })
    // attribution stays, collapsed into the small "i" control so it doesn't eat a bar above the tab bar
    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right')
    map.on('click', () => { setActive(null); setGroup(null) })
    mapRef.current = map
    setMapReady(true)
    return () => { map.remove(); mapRef.current = null }
  }, [])

  useMuralPins({ mapRef, ready: mapReady, murals, activeId: active?.id, onSelect: m => { setGroup(null); setActive(m); track('map_pin_tapped', `/gallery/${m.slug}`) }, onGroup: g => { setActive(null); setGroup(g) } })

  // keep the selected pin visible above the pin card
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return
    const motion = reducedMotion() ? { duration: 0 } : {}
    if (active?.coordinates) map.easeTo({ center: [active.coordinates.lng, active.coordinates.lat], padding: { bottom: window.matchMedia('(min-width:1024px)').matches ? 0 : SHEET_PAD, top: 0, left: 0, right: 0 }, ...motion })
    else map.easeTo({ padding: { bottom: 0, top: 0, left: 0, right: 0 }, ...motion })
  }, [active, mapReady])

  // "my location": starts on tap (so the browser's permission prompt is a response to a user action)
  const locate = useCallback(() => {
    const map = mapRef.current
    if (!map) return
    if (me && watchRef.current !== null) { map.easeTo({ center: [me.lng, me.lat], zoom: Math.max(map.getZoom(), 16), ...(reducedMotion() ? { duration: 0 } : {}) }); return }
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
        if (!centered.current) { centered.current = true; map.easeTo({ center: [p.lng, p.lat], zoom: Math.max(map.getZoom(), 16), ...(reducedMotion() ? { duration: 0 } : {}) }) }
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
  const results = search.trim() ? murals.filter(m => matchMural(m, search)).slice(0, 12) : []
  function pickResult(m: Mural) {
    setSearch('')
    if (!m.coordinates || !mapRef.current) { router.push(`/gallery/${m.slug}`); return }
    mapRef.current.jumpTo({ zoom: Math.max(mapRef.current.getZoom(), 17) })
    setActive(m)
  }

  const dist = active && me && active.coordinates ? metresBetween(me, active.coordinates) : null
  const place = active ? displayPlace(active) : ''

  return (
    <div className="fixed inset-x-0 top-[var(--topbar-h)] bottom-[var(--nav-h)] bg-bg overflow-hidden overscroll-none">
      {/* map */}
      <div ref={containerRef} className="w-full h-full" style={{ position: 'absolute', inset: 0 }} />

      {/* search bar: the logo (opens the menu) on the left, then the search field */}
      <div className="absolute top-controls left-gutter right-gutter lg:right-auto lg:w-[420px] z-10 flex items-center gap-2">
        <MenuButton />
        <div className="h-field flex-1 min-w-0 bg-surface rounded-full shadow-1 pl-4 pr-1.5 flex items-center gap-2">
          <Search size={18} className="text-ink-2 shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('map.search')} aria-label={t('map.search')}
            enterKeyHint="search" autoComplete="off"
            className="flex-1 min-w-0 bg-transparent outline-none placeholder:text-ink-3"
          />
          {search && <button type="button" aria-label={t('map.close')} onClick={() => setSearch('')} className="text-ink-2 shrink-0 w-control h-control flex items-center justify-center"><X size={18} /></button>}
        </div>
      </div>

      {/* search results: mural name, artist name or handle, location */}
      {search.trim() && (
        <div className="absolute top-[calc(var(--inset-top-controls)+var(--field-h)+var(--gap-control))] left-gutter right-gutter z-20 bg-surface rounded-panel shadow-2 max-h-[50vh] overflow-y-auto">
          {results.length === 0
            ? <p className="px-4 py-3 text-14 text-ink-2">{t('map.noResults')}</p>
            : results.map(m => (
              <button key={m.id} type="button" onClick={() => pickResult(m)}
                className="w-full text-left px-4 py-2.5 border-b border-groove last:border-0 flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {m.cover_photo ? <ThumbImg src={m.cover_photo} alt="" loading="lazy" className="w-10 h-10 rounded-inset object-cover shrink-0" /> : <div className="w-10 h-10 rounded-inset bg-groove shrink-0" />}
                <div className="min-w-0">
                  <p className="text-14 font-medium truncate">{displayTitle(m.title)}</p>
                  <p className="text-13 text-ink-2 truncate">{m.artist ?? ''}{m.coordinates ? '' : ` · ${t('map.noPin')}`}</p>
                </div>
              </button>
            ))}
        </div>
      )}

      {/* my location */}
      <div className="absolute top-[calc(var(--inset-top-controls)+var(--field-h)+var(--gap-control))] right-gutter z-10 flex flex-col items-end gap-1.5">
        <button onClick={() => { setHint(null); locate() }} aria-label={t('map.locate')}
          className={`w-control h-control rounded-full shadow-1 flex items-center justify-center ${me ? 'bg-surface text-you' : 'bg-surface text-ink-2'}`}>
          {locating ? <Loader2 size={20} className="animate-spin" /> : <LocateFixed size={20} />}
        </button>
        {hint && !me && (
          <div role="status" className="bg-ink text-on-dark rounded-panel shadow-2 px-3 py-2 text-13 max-w-[220px] flex items-start gap-2">
            <span className="flex-1">{hint === 'tap' ? t('map.hintTap') : t('map.hintBlocked')}</span>
            <button onClick={() => setHint(null)} aria-label={t('map.close')} className="opacity-80 hover:opacity-100 w-6 h-6 flex items-center justify-center"><X size={14} /></button>
          </div>
        )}
        {locError && <p className="bg-glass rounded-panel shadow-1 px-3 py-1.5 text-13 text-danger max-w-[200px] text-right">{t('map.locError')}</p>}
      </div>

      {/* no-coords notice */}
      {withCoords === 0 && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-10 bg-glass backdrop-blur-sm rounded-sheet px-5 py-3 shadow-1 text-center w-72">
          <p className="text-14 font-semibold text-ink mb-1">{t('map.soon')}</p>
          <p className="text-13 text-ink-2 leading-relaxed">
            {t('map.soonBody')}
          </p>
        </div>
      )}

      {/* murals on the same spot: choose one */}
      {group && !active && (
        <GroupPicker murals={group} onClose={() => setGroup(null)} onPick={m => { setGroup(null); setActive(m); track('map_pin_tapped', `/gallery/${m.slug}`) }}
          className="absolute z-20 bottom-3 left-gutter right-gutter lg:right-auto lg:bottom-6 lg:w-[380px]" />
      )}

      {/* pin card (bottom sheet) */}
      {active && (
        <div className="absolute bottom-0 left-0 right-0 z-20 lg:left-gutter lg:right-auto lg:bottom-6 lg:w-[380px]">
          <div className="bg-surface rounded-t-card lg:rounded-card shadow-2 px-gutter pt-4 pb-4 relative">
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-[5px] bg-groove rounded-full pointer-events-none" />
            <button onClick={() => setActive(null)} aria-label={t('map.close')}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-bg text-ink flex items-center justify-center before:absolute before:-inset-1.5 before:content-['']">
              <X size={16} />
            </button>
            <div className="flex gap-3 mt-1">
              {/* photo: 96×120, swipeable; tapping opens the mural page */}
              <div className="relative w-24 h-[7.5rem] shrink-0 overflow-hidden rounded-panel bg-groove">
                <CardPhotos photos={active.photos?.length ? active.photos : active.cover_photo ? [active.cover_photo] : []} title={active.title} slug={active.slug}
                  onOpen={() => router.push(`/gallery/${active.slug}`)} />
              </div>
              <div className="min-w-0 flex-1 pr-8 cursor-pointer"
                onClick={e => { if (!(e.target as HTMLElement).closest('a,button')) router.push(`/gallery/${active.slug}`) }}>
                <div className="flex flex-wrap gap-1 mb-1">
                  <ConfidenceBadge level={active.confidence} />
                  <ArtworkBadge mural={active} />
                </div>
                <p className="font-display font-bold text-20 leading-tight line-clamp-2">{displayTitle(active.title)}</p>
                {(active.artist || active.artists?.length) && <p className="text-sea text-14 font-medium mt-0.5 underline underline-offset-2"><ArtistLinks mural={active} /></p>}
                <p className="text-13 text-ink-2 mt-1 truncate">
                  {dist !== null && <><strong className="font-semibold text-ink">{formatDistance(dist)}</strong> · {walkMinutes(dist)} min · </>}
                  {place || t('card.locUnconfirmed')}
                </p>
                {active.precision === 'lead' && <div className="mt-1"><LocationPill mural={active} /></div>}
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              {active.coordinates && (
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${active.coordinates.lat},${active.coordinates.lng}&travelmode=walking`}
                  target="_blank" rel="noopener noreferrer"
                  onClick={() => track('directions_tapped', `/gallery/${active.slug}`)}
                  className="flex-1 min-w-0 h-field bg-sea text-on-dark rounded-full flex items-center justify-center gap-2 text-14 font-semibold"
                >
                  <Navigation size={16} /> {t('map.takeMe')}
                </a>
              )}
              <TourButton muralId={active.id} className="flex-1 min-w-0" />
              <HeartIcon muralId={active.id} variant="outline" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
