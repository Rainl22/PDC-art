'use client'
import { useEffect, useMemo, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { useSearchParams } from 'next/navigation'
import { MuralCard } from './MuralCard'
import { useLikes } from '@/lib/likes'
import { useRouter } from 'next/navigation'
import { getTourIds, saveTourIds } from '@/lib/tour'
import { MenuButton } from '@/components/layout/SideMenu'
import { useT } from '@/lib/i18n/client'
import type { Key } from '@/lib/i18n/dict'
import { metresBetween, formatDistance } from '@/lib/geo'
import { matchMural } from '@/lib/search'
import { Search, X, ArrowDownUp, Check } from 'lucide-react'
import type { Mural, ConfidenceLevel } from '@/types/mural'

const ExploreMap = dynamic(() => import('./ExploreMap'), { ssr: false })

type Filter = ConfidenceLevel | 'all' | 'changed' | 'saved'
type Sort = 'name' | 'artist' | 'updated' | 'nearest' | 'liked'

const CHIPS: { label: Key; value: Exclude<Filter, 'all' | 'removed' | 'likely'> }[] = [
  { label: 'filter.verified',   value: 'verified'   },
  { label: 'filter.unverified', value: 'unverified' },
  { label: 'filter.changed',    value: 'changed'    },
  { label: 'filter.saved',      value: 'saved'      },
]

const SORTS: { value: Sort; label: Key }[] = [
  { value: 'name',    label: 'sort.name'    },
  { value: 'artist',  label: 'sort.artist'  },
  { value: 'updated', label: 'sort.updated' },
  { value: 'liked',   label: 'sort.liked'   },
  { value: 'nearest', label: 'sort.nearest' },
]

/** First artist's name without a leading @, so "@ron.e.rox" sorts under R; empty when unknown. */
const artistKey = (m: Mural) => (m.artists?.[0]?.name ?? m.artist ?? '').trim().replace(/^@/, '').toLowerCase()

/** When a mural was added or last repainted (photos added to the same painting don't count). */
const lastChanged = (m: Mural) => Math.max(Date.parse(m.created_at) || 0, Date.parse(m.artwork_changed_at ?? '') || 0)

export function GalleryClient({ murals }: { murals: Mural[] }) {
  const { t } = useT()
  const router = useRouter()
  const [selecting, setSelecting] = useState(false)
  const [selected, setSelected]   = useState<Set<string>>(new Set())
  const likes = useLikes()
  const [filter, setFilter]       = useState<Filter>('all')
  const [sort, setSort]           = useState<Sort>('updated')
  const [me, setMe]               = useState<{ lat: number; lng: number } | null>(null)
  const [locating, setLocating]   = useState(false)
  const [locError, setLocError]   = useState(false)
  const [query, setQuery]         = useState('')
  const [sortOpen, setSortOpen]   = useState(false)
  const [activeId, setActiveId]   = useState<string | null>(null)   // selected from the desktop map
  const [hoverId, setHoverId]     = useState<string | null>(null)   // hovered card <-> pin (desktop)

  // the desktop top bar searches by sending people here with ?q=
  const urlQuery = useSearchParams().get('q')
  useEffect(() => { if (urlQuery !== null) setQuery(urlQuery) }, [urlQuery])

  const selectOnMap = useCallback((m: Mural) => {
    setActiveId(m.id)
    document.getElementById(`card-${m.id}`)?.scrollIntoView({ block: 'center', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
  }, [])

  function chooseSort(next: Sort) {
    setLocError(false)
    if (next !== 'nearest' || me) { setSort(next); return }
    // "Nearest" needs your position: ask when the person picks it
    if (!('geolocation' in navigator)) { setLocError(true); return }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      pos => { setMe({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setSort('nearest'); setLocating(false) },
      () => { setLocError(true); setLocating(false) },
      { enableHighAccuracy: false, maximumAge: 60_000, timeout: 15_000 },
    )
  }

  const distanceOf = (m: Mural) => (me && m.coordinates ? metresBetween(me, m.coordinates) : null)

  const visible = useMemo(() => {
    const keep = (m: Mural) =>
      filter === 'all' ? true
      : filter === 'changed' ? m.artwork_status === 'changed'
      : filter === 'saved' ? likes.has(m.id)
      : filter === 'unverified' ? m.confidence === 'unverified' || m.confidence === 'likely'
      : m.confidence === filter
    const list = murals.filter(m => matchMural(m, query)).filter(keep)
    const by: Record<Sort, (a: Mural, b: Mural) => number> = {
      name: (a, b) => (a.title ?? '').localeCompare(b.title ?? ''),
      // unknown artists go last; ties fall back to the title
      artist: (a, b) => {
        const x = artistKey(a), y = artistKey(b)
        if (!x !== !y) return x ? -1 : 1
        return x.localeCompare(y) || (a.title ?? '').localeCompare(b.title ?? '')
      },
      updated: (a, b) => lastChanged(b) - lastChanged(a),
      liked: (a, b) => (b.like_count ?? 0) - (a.like_count ?? 0) || (a.title ?? '').localeCompare(b.title ?? ''),
      // murals without a pin go last
      nearest: (a, b) => (distanceOf(a) ?? Infinity) - (distanceOf(b) ?? Infinity),
    }
    return [...list].sort(by[sort])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [murals, filter, sort, me, query, likes.ids])

  function toggleSelect(id: string) {
    setSelected(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next })
  }
  /** Adds the chosen murals to the tour (keeping stops already in it, no duplicates) and opens it. */
  function buildTour() {
    saveTourIds(Array.from(new Set([...getTourIds(), ...Array.from(selected)])))
    router.push('/tour')
  }

  const chip = (active: boolean) =>
    `shrink-0 h-9 px-4 rounded-full text-14 font-medium border transition-colors ${active ? 'bg-ink text-on-dark border-ink' : 'bg-surface text-ink border-groove'}`
  const sortLabel = t(SORTS.find(o => o.value === sort)!.label)

  return (
    <div className="bg-bg lg:grid lg:grid-cols-[minmax(0,1fr)_520px] lg:gap-8 lg:px-8 lg:items-start">
    <div className="flex flex-col min-h-dvh md:max-w-[960px] md:mx-auto lg:max-w-none lg:mx-0 lg:min-h-0">
      {/* header: logo + title + menu, then search, then chips */}
      <header className="bg-bg sticky top-[var(--topbar-h)] z-20 pt-controls">
        <div className="px-gutter min-h-control mb-3 flex items-center gap-3">
          <MenuButton />
          <h1 className="flex-1 min-w-0 truncate font-display font-extrabold text-28 tracking-tight">{t('gallery.title')}</h1>
          <button type="button" onClick={() => { setSelecting(v => !v); setSelected(new Set()) }}
            className="shrink-0 h-control px-4 rounded-full border border-sea text-sea text-14 font-semibold">
            {selecting ? t('gallery.cancel') : t('gallery.select')}
          </button>
        </div>
        <div className="px-gutter pb-3 lg:hidden">
          <div className="h-field bg-surface rounded-full shadow-1 px-4 flex items-center gap-2">
            <Search size={18} className="text-ink-2 shrink-0" />
            <input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder={t('gallery.searchFull')} aria-label={t('gallery.searchFull')}
              enterKeyHint="search" autoComplete="off" className="flex-1 min-w-0 bg-transparent outline-none placeholder:text-ink-3" />
            {query && (
              <button type="button" aria-label={t('gallery.clearSearch')} onClick={() => setQuery('')} className="text-ink-2 shrink-0 w-control h-control -mr-3 flex items-center justify-center"><X size={18} /></button>
            )}
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto px-gutter pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button type="button" aria-pressed={sort === 'nearest'} disabled={locating}
            onClick={() => chooseSort(sort === 'nearest' ? 'updated' : 'nearest')} className={chip(sort === 'nearest')}>{t('filter.nearMe')}</button>
          {CHIPS.map(c => (
            <button key={c.value} type="button" aria-pressed={filter === c.value}
              onClick={() => setFilter(f => (f === c.value ? 'all' : c.value))} className={chip(filter === c.value)}>
              {c.value === 'verified' && <span aria-hidden className="inline-block w-2 h-2 rounded-full bg-certain mr-1.5 align-middle" />}
              {t(c.label)}
            </button>
          ))}
        </div>
        {/* count + sort */}
        <div className="flex items-center gap-2 px-gutter pb-1">
          <p className="flex-1 min-w-0 text-14 text-ink-2 truncate">
            <strong className="font-semibold text-ink">{t(visible.length === 1 ? 'gallery.count.one' : 'gallery.count.many', { n: visible.length })}</strong> · {sortLabel}
          </p>
          <button type="button" onClick={() => setSortOpen(true)} aria-label={t('sort.open')}
            className="w-control h-control -mr-2 rounded-full flex items-center justify-center text-ink"><ArrowDownUp size={20} /></button>
        </div>
        {(locating || locError) && (
          <p className={`px-gutter pb-2 text-13 ${locError ? 'text-danger' : 'text-ink-2'}`}>{locating ? t('sort.locating') : t('sort.locError')}</p>
        )}
      </header>

      {visible.length === 0 && <p className="text-center text-14 text-ink-2 py-10">{t('filter.none')}</p>}

      {/* grid: 2 columns, 12px between columns, 16px between rows */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-x-grid gap-y-row lg:gap-x-5 min-[1600px]:grid-cols-4 px-gutter lg:px-0 pt-2 pb-24 lg:pb-12">
        {visible.map((m, i) => (
          <MuralCard key={m.id} mural={m} priority={i < 4} active={activeId === m.id} onHover={setHoverId} selectable={selecting} selected={selected.has(m.id)} onSelect={toggleSelect}
            distance={me && distanceOf(m) !== null ? formatDistance(distanceOf(m)!) : undefined} />
        ))}
      </div>

      {/* tour selection bar */}
      {selecting && (
        <div className="fixed bottom-[var(--nav-h)] left-0 right-0 z-[45] bg-surface border-t border-groove px-gutter py-3 flex items-center justify-between gap-3 shadow-2">
          <div className="min-w-0">
            <p className="font-semibold text-14 text-ink">{selected.size === 0 ? t('select.tap') : t(selected.size === 1 ? 'select.one' : 'select.many', { n: selected.size })}</p>
            <p className="text-13 text-ink-2">{t('select.min')}</p>
          </div>
          <button type="button" onClick={buildTour} disabled={selected.size < 2}
            className="shrink-0 h-field px-5 rounded-full bg-sea text-on-dark text-14 font-semibold disabled:bg-groove disabled:text-ink-2">
            {t('select.build')}
          </button>
        </div>
      )}

      {/* sort sheet */}
      {sortOpen && (
        <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label={t('sort.open')}>
          <div className="absolute inset-0 bg-scrim" onClick={() => setSortOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 bg-surface rounded-t-card pb-safe-or-4 pt-3 shadow-2">
            <div className="w-10 h-[5px] rounded-full bg-groove mx-auto mb-2" />
            <p className="px-gutter py-2 font-display font-bold text-20">{t('sort.label')}</p>
            {SORTS.map(o => (
              <button key={o.value} type="button" onClick={() => { chooseSort(o.value); setSortOpen(false) }}
                className="w-full min-h-field px-gutter flex items-center justify-between text-16 text-ink">
                {t(o.label)}{sort === o.value && <Check size={18} className="text-sea" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>

    {/* desktop: sticky map panel beside the cards */}
    <aside className="hidden lg:block sticky top-[calc(var(--topbar-h)+1.5rem)] h-[calc(100dvh-var(--topbar-h)-3rem)] mt-6" aria-label="Map">
      <ExploreMap murals={visible} all={murals} activeId={activeId} hoverId={hoverId} onSelect={selectOnMap} />
    </aside>
    </div>
  )
}