'use client'
import Link from 'next/link'
import { useT } from '@/lib/i18n/client'
import { getMuralGradient } from '@/lib/gradients'
import { ConfidenceBadge } from '@/components/ui/ConfidenceBadge'
import { isLocationUnknown } from '@/components/ui/LocationPill'
import { Check, Images } from 'lucide-react'
import type { Mural } from '@/types/mural'

interface Props {
  mural: Mural
  selectable?: boolean
  selected?: boolean
  onSelect?: (id: string) => void
}

export function MuralCard({ mural, selectable, selected, onSelect }: Props) {
  const { t } = useT()
  const gradient = getMuralGradient(mural.slug)
  const cover    = mural.cover_photo ?? null

  const inner = (
    <div className={`relative bg-surface rounded-md overflow-hidden flex flex-col h-full
      ${selectable ? 'cursor-pointer' : ''}
      ${selected   ? 'ring-2 ring-sea ring-offset-1' : ''}`}
      onClick={selectable ? () => onSelect?.(mural.id) : undefined}
    >
      {/* cover */}
      <div className="aspect-[4/3] relative overflow-hidden shrink-0">
        {cover
          ? <img src={cover} alt={mural.title} className="absolute inset-0 w-full h-full object-cover" />
          : <div className="absolute inset-0" style={{ background: gradient }} />
        }
        {mural.photos?.length > 1 && (
          <span className="absolute top-2 left-2 flex items-center gap-1 text-[10px] font-display font-semibold text-white bg-black/50 rounded-full px-1.5 py-0.5">
            <Images size={10} />{mural.photos.length}
          </span>
        )}
        {/* badge */}
        <div className="absolute bottom-2 left-2">
          <ConfidenceBadge level={mural.confidence} sm />
        </div>
        {/* selection checkmark */}
        {selectable && (
          <div className={`absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center transition-colors
            ${selected ? 'bg-sea text-white' : 'bg-white/70 text-transparent'}`}>
            <Check size={11} strokeWidth={3} />
          </div>
        )}
      </div>
      {/* info — fixed rows so every card is the same height */}
      <div className="p-2.5 flex-1">
        <p className="text-[13px] font-medium text-ink leading-snug line-clamp-2 min-h-[36px]">
          {mural.title?.trim() || t('card.untitled')}
        </p>
        <p className={`text-[11px] mt-0.5 truncate ${mural.artist ? 'text-sea' : 'text-ink-3'}`}>
          {mural.artist || t('card.artistUnknown')}
        </p>
        <p className="text-[10px] text-ink-3 mt-0.5 truncate">
          {isLocationUnknown(mural) || !mural.location_description?.trim()
            ? t('loc.unknown')
            : mural.location_description}
        </p>
      </div>
    </div>
  )

  if (selectable) return inner

  return <Link href={`/gallery/${mural.slug}`} className="block h-full">{inner}</Link>
}
