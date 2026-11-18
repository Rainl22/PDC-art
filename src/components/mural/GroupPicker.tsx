'use client'
import { X } from 'lucide-react'
import { ThumbImg } from '@/components/ui/ThumbImg'
import { useT } from '@/lib/i18n/client'
import { displayTitle, displayArtist } from '@/lib/format'
import type { Mural } from '@/types/mural'

/** Murals so close together that the map can't pull them apart (usually one wall): pick one from the list. */
export function GroupPicker({ murals, onPick, onClose, className = '' }: { murals: Mural[]; onPick: (m: Mural) => void; onClose: () => void; className?: string }) {
  const { t } = useT()
  return (
    <div role="dialog" aria-label={t('map.group', { n: murals.length })} className={`bg-surface rounded-card shadow-2 p-3 ${className}`}>
      <div className="flex items-center justify-between pl-1 pb-1">
        <p className="text-14 font-semibold">{t('map.group', { n: murals.length })}</p>
        <button type="button" onClick={onClose} aria-label={t('map.close')} className="w-control h-control -mr-2 flex items-center justify-center text-ink-2"><X size={18} /></button>
      </div>
      <ul className="max-h-[50vh] overflow-y-auto">
        {murals.map(m => (
          <li key={m.id}>
            <button type="button" onClick={() => onPick(m)} className="w-full min-h-[3.5rem] flex items-center gap-3 p-1 rounded-panel text-left hover:bg-bg">
              <span className="w-12 h-12 shrink-0 overflow-hidden rounded-inset bg-groove">
                {m.cover_photo && <ThumbImg src={m.cover_photo} alt="" className="w-full h-full object-cover" />}
              </span>
              <span className="min-w-0">
                <span className="block text-16 font-semibold truncate">{displayTitle(m.title)}</span>
                <span className="block text-13 text-ink-2 truncate">{displayArtist(m) || t('card.artistUnknown')}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
