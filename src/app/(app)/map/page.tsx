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
import { TourButton } from '@/components/ui/TourButton'
import { HeartIcon } from '@/components/mural/LikeButton'
import { getMuralGradient } from '@/lib/gradients'
import { displayTitle, displayPlace, walkMinutes } from '@/lib/format'
import { Search, Navigation, X, LocateFixed, Loader2, Images } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { metresBetween, formatDistance } from '@/lib/geo'
import { matchMural } from '@/lib/search'
import type { Mural } from '@/types/mural'

// The bundled MapLibre worker can't resolve its own URL under Next.js — serve it from /public.
maplibregl.setWorkerUrl('/maplibre/maplibre-gl-worker.mjs')

// Playa del Carmen centre
const PDC_CENTER: [number, number] = [-87.0739, 20.6296]

// Pins are 40px photo circles inside a 44px button; pins closer than this (screen px) are grouped into one count.
const PIN = 40
const HIT = 44
const SELECTED = 60
const CLUSTER_PX = 48
/** Space reserved at the bottom of the map for the pin card, so a selected pin is never hidden behind it. */
const SHEET_PAD = 280

const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

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
            <img src={src} alt={`${title} — ${k + 1}`} loading={k === 0 ? 'eager' : 'lazy'} decoding="async" className="w-full h-full object-cover" draggable={false} />
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
    map.on('click', () => setActive(null))
    mapRef.current = map
    setMapReady(true)
    return () => { map.remove(); mapRef.current = null }
  }, [])

  /** A pin: a real <button> (focusable, Enter/Space opens the card) holding a 40px photo circle. Solid ring: green = verified, amber = unconfirmed. */
  const makePin = useCallback((mural: Mural, selected: boolean) => {
    const size = selected ? SELECTED : PIN
    const el = document.createElement('button')
    el.type = 'button'
    el.setAttribute('aria-label', [displayTitle(mural.title), mural.artist].filter(Boolean).join(', '))
    el.style.cssText = `width:${Math.max(HIT, size)}px;height:${Math.max(HIT, size)}px;padding:0;border:0;background:none;display:flex;align-items:center;justify-content:center;cursor:pointer;${selected ? 'z-index:5;' : ''}`
    const ring = selected ? 'var(--sea)' : mural.confidence === 'verified' ? 'var(--certain)' : 'var(--unconfirmed)'
    const disc = document.createElement('span')
    disc.style.cssText = `display:block;width:${size}px;height:${size}px;border-radius:50%;overflow:hidden;box-sizing:border-box;border:${selected ? 4 : 3}px solid ${ring};background:${getMuralGradient(mural.slug)};box-shadow:var(--shadow-2);`
    if (mural.cover_photo) {
      const img = document.createElement('img')
      img.src = mural.cover_photo; img.alt = ''; img.loading = 'lazy'; img.decoding = 'async'; img.draggable = false
      img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;'
      disc.appendChild(img)
    }
    el.appendChild(disc)
    el.addEventListener('click', e => { e.stopPropagation(); setActive(mural) })
    return el
  }, [])

  /** A group of pins that are too close to tell apart: a dark circle with the count; tapping zooms in. */
  const makeCluster = useCallback((members: Mural[], map: maplibregl.Map) => {
    const el = document.createElement('button')
    el.type = 'button'
    el.setAttribute('aria-label', `${members.length} murals`)
    el.style.cssText = `width:${HIT}px;height:${HIT}px;padding:0;border:0;background:none;display:flex;align-items:center;justify-content:center;cursor:pointer;`
    const disc = document.createElement('span')
    disc.textContent = String(members.length)
    disc.style.cssText = `display:flex;align-items:center;justify-content:center;width:${PIN}px;height:${PIN}px;border-radius:50%;background:var(--ink);color:var(--on-dark);font:600 16px var(--fb);box-shadow:var(--shadow-2);`
    el.appendChild(disc)
    el.addEventListener('click', e => {
      e.stopPropagation()
      const b = new maplibregl.LngLatBounds()
      members.forEach(m => b.extend([m.coordinates!.lng, m.coordinates!.lat]))
      map.fitBounds(b, { padding: 80, maxZoom: 19, duration: reducedMotion() ? 0 : 500 })
    })
    return el
  }, [])

  // draw pins; regroup whenever the view changes or a pin is selected
  const draw = useCallback(() => {
    const map = mapRef.current
    if (!map) return
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []
    const placed = murals.filter(m => m.coordinates)
    const used = new Set<string>()
    const pts = placed.map(m => ({ m, p: map.project([m.coordinates!.lng, m.coordinates!.lat]) }))
    // the selected pin always stands alone
    pts.sort((a, b) => (a.m.id === active?.id ? -1 : b.m.id === active?.id ? 1 : 0))
    for (const a of pts) {
      if (used.has(a.m.id)) continue
      used.add(a.m.id)
      const group = [a.m]
      if (a.m.id !== active?.id) {
        for (const b of pts) {
          if (used.has(b.m.id) || b.m.id === active?.id) continue
          if (Math.hypot(a.p.x - b.p.x, a.p.y - b.p.y) < CLUSTER_PX) { group.push(b.m); used.add(b.m.id) }
        }
      }
      const lng = group.reduce((s, g) => s + g.coordinates!.lng, 0) / group.length
      const lat = group.reduce((s, g) => s + g.coordinates!.lat, 0) / group.length
      const el = group.length > 1 ? makeCluster(group, map) : makePin(a.m, a.m.id === active?.id)
      markersRef.current.push(new maplibregl.Marker({ element: el }).setLngLat([lng, lat]).addTo(map))
    }
  }, [murals, active, makePin, makeCluster])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return
    draw()
    // regroup when the zoom changes (panning doesn't change which pins overlap)
    map.on('zoomend', draw)
    return () => { map.off('zoomend', draw) }
  }, [draw, mapReady])

  // keep the selected pin visible above the pin card
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return
    const motion = reducedMotion() ? { duration: 0 } : {}
    if (active?.coordinates) map.easeTo({ center: [active.coordinates.lng, active.coordinates.lat], padding: { bottom: SHEET_PAD, top: 0, left: 0, right: 0 }, ...motion })
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
    <div className="fixed inset-x-0 top-0 bottom-[var(--nav-h)] bg-bg overflow-hidden overscroll-none">
      {/* map */}
      <div ref={containerRef} className="w-full h-full" style={{ position: 'absolute', inset: 0 }} />

      {/* search bar, with the menu button inside its right end */}
      <div className="absolute top-controls left-gutter right-gutter z-10">
        <div className="h-field bg-surface rounded-full shadow-1 pl-4 pr-1.5 flex items-center gap-2">
          <Search size={18} className="text-ink-2 shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('map.search')} aria-label={t('map.search')}
            enterKeyHint="search" autoComplete="off"
            className="flex-1 min-w-0 bg-transparent outline-none placeholder:text-ink-3"
          />
          {search && <button type="button" aria-label={t('map.close')} onClick={() => setSearch('')} className="text-ink-2 shrink-0 w-control h-control flex items-center justify-center"><X size={18} /></button>}
          <MenuButton className="!border-0 !bg-bg" />
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
                {m.cover_photo ? <img src={m.cover_photo} alt="" loading="lazy" className="w-10 h-10 rounded-inset object-cover shrink-0" /> : <div className="w-10 h-10 rounded-inset bg-groove shrink-0" />}
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

      {/* pin card (bottom sheet) */}
      {active && (
        <div className="absolute bottom-0 left-0 right-0 z-20">
          <div className="bg-surface rounded-t-card shadow-2 px-gutter pt-4 pb-4 relative">
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
