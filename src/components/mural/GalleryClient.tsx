'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MuralCard } from './MuralCard'
import { saveTourIds } from '@/lib/tour'
import { MenuButton } from '@/components/layout/SideMenu'
import { useT } from '@/lib/i18n/client'
import type { Key } from '@/lib/i18n/dict'
import type { Mural, ConfidenceLevel } from '@/types/mural'

const FILTERS: { label: Key; value: ConfidenceLevel | 'all' }[] = [
  { label: 'filter.all',        value: 'all'        },
  { label: 'filter.verified',   value: 'verified'   },
  { label: 'filter.likely',     value: 'likely'     },
  { label: 'filter.unverified', value: 'unverified' },
]

export function GalleryClient({ murals }: { murals: Mural[] }) {
  const router = useRouter()
  const { t } = useT()
  const [filter, setFilter]       = useState<ConfidenceLevel | 'all'>('all')
  const [selecting, setSelecting] = useState(false)
  const [selected, setSelected]   = useState<Set<string>>(new Set())

  const filtered = murals.filter(m => filter === 'all' || m.confidence === filter)

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
      <header className="bg-surface border-b border-groove sticky top-0 z-10 pt-safe">
        <div className="px-4 py-3 flex items-center gap-3">
          <MenuButton />
          <h1 className="flex-1 font-display font-bold text-[17px] tracking-tight">
            {selecting ? t('gallery.selectMurals') : t('gallery.title')}
          </h1>
          <button
            onClick={() => { setSelecting(s => !s); setSelected(new Set()) }}
            className="text-sea text-[13px] font-display font-semibold border border-sea rounded-full px-3 py-1"
          >
            {selecting ? t('gallery.cancel') : t('gallery.select')}
          </button>
        </div>
        {/* filter chips */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-none">
          {FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`shrink-0 px-3 py-1 rounded-full text-[11px] font-display font-semibold tracking-wide transition-colors
                ${filter === f.value
                  ? 'bg-ink text-surface'
                  : 'bg-groove text-ink-2 hover:bg-groove/80'}`}
            >
              {t(f.label)}
            </button>
          ))}
        </div>
      </header>

      {/* grid */}
      <div className="grid grid-cols-2 gap-2.5 p-3 pb-4">
        {filtered.map(m => (
          <MuralCard
            key={m.id}
            mural={m}
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
            <p className="font-display font-bold text-[13px] text-ink">
              {selected.size === 0 ? t('select.tap') : t(selected.size === 1 ? 'select.one' : 'select.many', { n: selected.size })}
            </p>
            <p className="text-[10px] text-ink-3 mt-0.5">{t('select.min')}</p>
          </div>
          <button
            onClick={buildTour}
            disabled={selected.size < 2}
            className="bg-sea text-white rounded-full px-4 py-2 text-[12px] font-display font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {t('select.build')}
          </button>
        </div>
      )}
    </div>
  )
}
