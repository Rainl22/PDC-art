'use client'
import { useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getTourIds, setTourIds, clearTour, buildGoogleMapsUrl, shortestOrder, MAX_ROUTE_STOPS } from '@/lib/tour'
import { distanceKm } from '@/lib/geo'
import { walkMinutes, displayTitle, displayArtist } from '@/lib/format'
import { getMuralGradient } from '@/lib/gradients'
import { Navigation, Plus, Trash2, ChevronUp, ChevronDown, Share2, LocateFixed, Shuffle, Route } from 'lucide-react'
import { Logo } from '@/components/brand/Logo'
import { MenuButton } from '@/components/layout/SideMenu'
import { useT } from '@/lib/i18n/client'
import type { Mural } from '@/types/mural'

// MapLibre is heavy: load it only when there is a route to show
const TourMap = dynamic(() => import('@/components/mural/TourMap'), { ssr: false, loading: () => <div className="w-full h-[180px] rounded-card bg-groove" /> })

type Pt = { lat: number; lng: number }

export default function TourPage() {
  const { t } = useT()
  const [stops, setStops]     = useState<Mural[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [me, setMe]           = useState<Pt | null>(null)       // set when "My location" is on
  const [locating, setLocating] = useState(false)
  const [locError, setLocError] = useState(false)
  const [copied, setCopied]   = useState(false)

  useEffect(() => {
    const sb = createClient()
    // a shared link (/tour?stops=slug1,slug2) rebuilds the tour; otherwise use the stops saved on this device
    const slugs = new URLSearchParams(window.location.search).get('stops')?.split(',').map(s => s.trim()).filter(Boolean).slice(0, 25) ?? []
    if (slugs.length) {
      sb.from('murals').select('*').in('slug', slugs).then(({ data }) => {
        const bySlug = new Map((data ?? []).map((m: Mural) => [m.slug, m]))
        const list = slugs.map(s => bySlug.get(s)).filter(Boolean) as Mural[]
        setTourIds(list.map(m => m.id))
        setStops(list); setLoading(false)
        window.history.replaceState(null, '', '/tour')
      })
      return
    }
    const ids = getTourIds()
    if (ids.length === 0) { setLoading(false); return }
    sb.from('murals').select('*').in('id', ids).then(({ data }) => {
      const map = new Map((data ?? []).map((m: Mural) => [m.id, m]))
      setStops(ids.map(id => map.get(id)).filter(Boolean) as Mural[])
      setLoading(false)
    })
  }, [])

  function commit(next: Mural[]) {
    setStops(next)
    setTourIds(next.map(s => s.id))
    if (next.length === 0) setEditing(false)
  }
  const remove = (id: string) => commit(stops.filter(s => s.id !== id))
  function move(i: number, d: -1 | 1) {
    const j = i + d
    if (j < 0 || j >= stops.length) return
    const next = [...stops];[next[i], next[j]] = [next[j], next[i]]
    commit(next)
  }

  // "My location": the route starts where you are
  function toggleMe() {
    if (me) { setMe(null); return }
    if (!('geolocation' in navigator)) { setLocError(true); return }
    setLocating(true); setLocError(false)
    navigator.geolocation.getCurrentPosition(
      pos => { setMe({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocating(false) },
      () => { setLocError(true); setLocating(false) },
      { enableHighAccuracy: true, maximumAge: 30_000, timeout: 15_000 },
    )
  }

  function shortest() { commit(shortestOrder(stops, me, distanceKm)) }

  // Only stops with coordinates can be routed. Estimates use straight-line distance × 1.3 (street detours), then 80 m/min (see lib/format).
  const routable = stops.filter(s => s.coordinates)
  const used     = routable.slice(0, me ? MAX_ROUTE_STOPS - 1 : MAX_ROUTE_STOPS)
  const canNavigate = used.length >= (me ? 1 : 2)
  const legM = (a: Pt, b: Pt) => distanceKm(a, b) * 1.3 * 1000
  const path: Pt[] = me ? [me, ...used.map(s => s.coordinates!)] : used.map(s => s.coordinates!)
  const pathKey = path.map(p => `${p.lat},${p.lng}`).join('|')
  const totalM = useMemo(() => path.slice(1).reduce((sum, p, i) => sum + legM(path[i], p), 0), [pathKey])  // eslint-disable-line react-hooks/exhaustive-deps
  const walkMins = walkMinutes(totalM)

  function startTour() {
    const url = buildGoogleMapsUrl(used.map(s => s.coordinates!), !!me)
    if (url) window.open(url, '_blank')
  }

  async function share() {
    const url = `${window.location.origin}/tour?stops=${stops.map(s => encodeURIComponent(s.slug)).join(',')}`
    try {
      if (navigator.share) await navigator.share({ title: t('tour.title'), text: t('tour.shareText'), url })
      else { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000) }
    } catch { /* cancelled */ }
  }

  const header = (right?: React.ReactNode) => (
    <div className="px-gutter min-h-control mb-3 flex items-center gap-3">
      <Logo size={36} />
      <h1 className="flex-1 font-display font-extrabold text-28 tracking-tight">{t('tour.title')}</h1>
      {right}
      <MenuButton />
    </div>
  )

  if (loading) return (
    <div className="pt-controls">
      {header()}
      <div className="flex justify-center pt-24"><div className="w-8 h-8 border-2 border-sea border-t-transparent rounded-full animate-spin" /></div>
    </div>
  )

  if (stops.length === 0) return (
    <div className="pt-controls">
      {header()}
      <div className="flex flex-col items-center justify-center gap-4 px-8 pt-20 text-center">
        <div className="w-16 h-16 rounded-panel bg-sea-tint flex items-center justify-center">
          <Route size={28} className="text-sea" />
        </div>
        <h2 className="font-display font-bold text-20">{t('tour.emptyTitle')}</h2>
        <p className="text-ink-2 text-14 leading-relaxed">{t('tour.emptyBody')}</p>
        <div className="flex gap-2 mt-2">
          <Link href="/gallery" className="h-field px-6 rounded-full bg-sea text-on-dark font-semibold text-14 flex items-center">{t('tour.browse')}</Link>
          <Link href="/map" className="h-field px-6 rounded-full bg-sea-tint text-sea font-semibold text-14 flex items-center">{t('tour.browseMap')}</Link>
        </div>
      </div>
    </div>
  )

  const chip = (active: boolean) => `h-9 px-3 rounded-full text-14 font-medium border inline-flex items-center gap-1.5 transition-colors ${active ? 'bg-ink text-on-dark border-ink' : 'bg-surface text-ink border-groove'}`

  return (
    <div className="flex flex-col min-h-[calc(100dvh-var(--nav-h))] pt-controls">
      {header(
        <button type="button" onClick={() => setEditing(e => !e)} className="min-h-control px-2 text-14 font-semibold text-sea">
          {editing ? t('tour.done') : t('tour.edit')}
        </button>
      )}

      <div className="px-gutter space-y-3 pb-4">
        {/* route preview */}
        {canNavigate && <TourMap stops={used.map(s => s.coordinates!)} me={me} label={t('tour.title')} />}

        {/* summary: units are always spelled out */}
        <div className="grid grid-cols-3 gap-2">
          {[
            [String(stops.length), t('tour.summary.stops')],
            [canNavigate ? t('tour.minutes', { n: walkMins }) : '—', t('tour.summary.walking')],
            [canNavigate ? (totalM < 1000 ? `${Math.round(totalM / 10) * 10} m` : `${(totalM / 1000).toFixed(1)} km`) : '—', t('tour.summary.distance')],
          ].map(([v, l]) => (
            <div key={l} className="bg-surface rounded-panel px-3 py-2.5 shadow-1">
              <p className="font-display font-extrabold text-20 leading-tight">{v}</p>
              <p className="text-13 font-medium text-ink-2">{l}</p>
            </div>
          ))}
        </div>

        {/* options */}
        <div className="flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <span className="text-14 text-ink-2 shrink-0">{t('tour.startFrom')}</span>
          <button type="button" onClick={toggleMe} aria-pressed={!!me} disabled={locating} className={`${chip(!!me)} shrink-0`}><LocateFixed size={16} />{t('tour.myLocation')}</button>
          <button type="button" onClick={shortest} disabled={routable.length < 2} className={`${chip(false)} shrink-0`}><Shuffle size={16} />{t('tour.shortest')}</button>
        </div>
        {locError && <p className="text-13 text-danger" role="alert">{t('tour.noLocation')}</p>}

        {/* stops */}
        <div className="bg-surface rounded-card shadow-1 p-2">
          {stops.map((stop, i) => {
            const next = stops[i + 1]
            const km = stop.coordinates && next?.coordinates ? distanceKm(stop.coordinates, next.coordinates) * 1.3 : null
            return (
              <div key={stop.id}>
                <div className="flex items-center gap-3 p-2">
                  <span className="w-6 h-6 rounded-full bg-sea-tint text-sea text-13 font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                  <Link href={`/gallery/${stop.slug}`} className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-12 h-12 shrink-0 overflow-hidden rounded-inset bg-groove">
                      {stop.cover_photo
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={stop.cover_photo} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />
                        : <div className="w-full h-full" style={{ background: getMuralGradient(stop.slug) }} />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-16 font-semibold text-ink truncate leading-tight">{displayTitle(stop.title)}</p>
                      {stop.coordinates
                        ? <p className="text-13 text-ink-2 truncate">{displayArtist(stop) || stop.location_description}</p>
                        : <p className="text-13 text-danger truncate">{t('tour.noPin')}</p>}
                    </div>
                  </Link>
                  {/* reorder + delete only in Edit mode, so a stray tap can't remove a stop */}
                  {editing && (
                    <div className="flex items-center shrink-0">
                      <button type="button" aria-label={t('tour.moveUp')} disabled={i === 0} onClick={() => move(i, -1)} className="w-control h-control flex items-center justify-center text-ink-2 disabled:opacity-30"><ChevronUp size={20} /></button>
                      <button type="button" aria-label={t('tour.moveDown')} disabled={i === stops.length - 1} onClick={() => move(i, 1)} className="w-control h-control flex items-center justify-center text-ink-2 disabled:opacity-30"><ChevronDown size={20} /></button>
                      <button type="button" aria-label={t('tour.remove')} onClick={() => remove(stop.id)} className="w-control h-control flex items-center justify-center text-danger"><Trash2 size={18} /></button>
                    </div>
                  )}
                </div>
                {/* leg: dotted connector and the walk time */}
                {next && (
                  <div className="flex items-center gap-3 pl-[1.375rem] min-h-7">
                    <div className="h-6 border-l-2 border-dotted border-ink-3" aria-hidden />
                    {km !== null && <span className="text-13 text-ink-2">{t('tour.leg', { n: walkMinutes(km * 1000) })}</span>}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <Link href="/gallery" className="flex items-center justify-center gap-2 min-h-field border-2 border-dashed border-groove rounded-card text-ink-2 text-14 font-semibold">
          <Plus size={16} />{t('tour.add')}
        </Link>

        {editing && (
          <button type="button" onClick={() => { clearTour(); setStops([]); setEditing(false) }} className="w-full min-h-control text-14 font-semibold text-danger">{t('tour.clear')}</button>
        )}
        {routable.length < stops.length && <p className="text-13 text-danger text-center">{t('tour.partial', { n: routable.length, m: stops.length })}</p>}
        {routable.length > used.length && <p className="text-13 text-ink-2 text-center">{t('tour.cap', { n: used.length })}</p>}
      </div>

      {/* sticky actions */}
      <div className="sticky bottom-[var(--nav-h)] z-10 mt-auto bg-bg border-t border-groove px-gutter py-3 flex items-center gap-2">
        <button onClick={startTour} disabled={!canNavigate}
          className="flex-1 min-w-0 h-[3.25rem] rounded-full bg-sea text-on-dark flex items-center justify-center gap-2 text-16 font-semibold disabled:bg-groove disabled:text-ink-2">
          <Navigation size={18} />
          {canNavigate ? t('tour.walk') : t('tour.pending')}
        </button>
        <button onClick={share} aria-label={copied ? t('detail.shareCopied') : t('tour.share')}
          className="w-[3.25rem] h-[3.25rem] rounded-full bg-surface border border-groove text-ink flex items-center justify-center shrink-0">
          <Share2 size={20} className={copied ? 'text-certain' : ''} />
        </button>
      </div>
    </div>
  )
}
