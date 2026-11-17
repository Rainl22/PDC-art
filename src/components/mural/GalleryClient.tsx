'use client'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MuralCard } from './MuralCard'
import { saveTourIds } from '@/lib/tour'
import { MenuButton } from '@/components/layout/SideMenu'
import { Select } from '@/components/ui/Select'
import { useT } from '@/lib/i18n/client'
import type { Key } from '@/lib/i18n/dict'
import { metresBetween, formatDistance } from '@/lib/geo'
import { matchMural } from '@/lib/search'
import { Search, X } from 'lucide-react'
import type { Mural, ConfidenceLevel } from '@/types/mural'

type Filter = ConfidenceLevel | 'all' | 'changed'
type Sort = 'name' | 'artist' | 'updated' | 'nearest' | 'liked'

const FILTERS: { label: Key; value: Filter }[] = [
  { label: 'filter.all',        value: 'all'        },
  { label: 'filter.verified',   value: 'verified'   },
  { label: 'filter.unverified', value: 'unverified' },
  { label: 'filter.changed',    value: 'changed'    },
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
  const router = useRouter()
  const { t } = useT()
  const [filter, setFilter]       = useState<Filter>('all')
  const [sort, setSort]           = useState<Sort>('updated')
  const [me, setMe]               = useState<{ lat: number; lng: number } | null>(null)
  const [locating, setLocating]   = useState(false)
  const [locError, setLocError]   = useState(false)
  const [query, setQuery]     = useState('')
  const [selecting, setSelecting] = useState(false)
  const [selected, setSelected]   = useState<Set<string>>(new Set())

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
    const list = murals.filter(m => matchMural(m, query)).filter(m => filter === 'all' ? true : filter === 'changed' ? m.artwork_status === 'changed' : filter === 'unverified' ? m.confidence === 'unverified' || m.confidence === 'likely' : m.confidence === filter)
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
  }, [murals, filter, sort, me, query])

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function buildTour() {
    saveTourIds(Array.from(selected))
    router.push('/tour')
  }

  return (
    <div className="flex flex-col min-h-dvh bg-bg">
      {/* header */}
      <header className="bg-surface border-b border-groove sticky top-0 z-20 pt-controls">
        <div className="px-gutter h-control mb-3 flex items-center gap-3">
          <MenuButton />
          <h1 className="flex-1 font-display font-bold text-card tracking-tight">
            {selecting ? t('gallery.selectMurals') : t('gallery.title')}
          </h1>
          <button
            onClick={() => { setSelecting(s => !s); setSelected(new Set()) }}
            className="text-sea text-body font-display font-semibold border border-sea rounded-full px-3 py-1"
          >
            {selecting ? t('gallery.cancel') : t('gallery.select')}
          </button>
        </div>
        {/* search: mural name, artist name or handle, location */}
        <div className="px-gutter pb-3">
          <div className="h-control bg-bg rounded-full px-4 flex items-center gap-2">
            <Search size={14} className="text-ink-3 shrink-0" />
            <input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder={t('gallery.search')}
              enterKeyHint="search" autoComplete="off" className="flex-1 min-w-0 bg-transparent text-body outline-none placeholder:text-ink-3" />
            {query && (
              <button type="button" aria-label={t('gallery.clearSearch')} onClick={() => setQuery('')} className="text-ink-3 shrink-0"><X size={15} /></button>
            )}
          </div>
        </div>
        {/* show (filter) on the left, sort on the right */}
        <div className="flex items-center gap-gap-control px-gutter pb-3">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-caption text-ink-3 font-display font-semibold uppercase tracking-wide">{t('filter.label')}</span>
            <Select className="w-[6.75rem]" label={t('filter.label')} value={filter} onChange={setFilter}
              options={FILTERS.map(f => ({ value: f.value, label: t(f.label) }))} />
          </div>
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <span className="text-caption text-ink-3 font-display font-semibold uppercase tracking-wide">{t('sort.label')}</span>
            <Select className="flex-1" align="right" label={t('sort.label')} value={sort} onChange={chooseSort} disabled={locating}
              options={SORTS.map(o => ({ value: o.value, label: t(o.label) }))} />
          </div>
        </div>
        {(locating || locError) && (
          <p className={`px-gutter pb-2 text-caption ${locError ? 'text-guessing' : 'text-ink-3'}`}>{locating ? t('sort.locating') : t('sort.locError')}</p>
        )}
      </header>

      {visible.length === 0 && <p className="text-center text-body text-ink-3 py-10">{t('filter.none')}</p>}

      {/* grid */}
      <div className="grid grid-cols-2 gap-grid p-grid pb-4">
        {visible.map(m => (
          <MuralCard
            key={m.id}
            mural={m}
            distance={sort === 'nearest' && distanceOf(m) !== null ? formatDistance(distanceOf(m)!) : undefined}
            selectable={selecting}
            selected={selected.has(m.id)}
            onSelect={toggleSelect}
          />
        ))}
      </div>

      {/* tour selection bar */}
      {selecting && (
        <div className="fixed bottom-[var(--nav-h)] left-0 right-0 z-40 bg-surface border-t-2 border-sea-tint px-4 py-3 flex items-center justify-between shadow-lg">
          <div>
            <p className="font-display font-bold text-body text-ink">
              {selected.size === 0 ? t('select.tap') : t(selected.size === 1 ? 'select.one' : 'select.many', { n: selected.size })}
            </p>
            <p className="text-caption text-ink-3 mt-0.5">{t('select.min')}</p>
          </div>
          <button
            onClick={buildTour}
            disabled={selected.size < 2}
            className="bg-sea text-on-dark rounded-full px-4 py-2 text-small font-display font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {t('select.build')}
          </button>
        </div>
      )}
    </div>
  )
}
