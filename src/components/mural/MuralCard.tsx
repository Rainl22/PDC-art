'use client'
import Link from 'next/link'
import { useT } from '@/lib/i18n/client'
import { getMuralGradient } from '@/lib/gradients'
import { ConfidenceBadge } from '@/components/ui/ConfidenceBadge'
import { ArtworkBadge } from '@/components/ui/ArtworkBadge'
import { isLocationUnknown } from '@/lib/location'
import { Check, Images } from 'lucide-react'
import type { Mural } from '@/types/mural'

interface Props {
  mural: Mural
  selectable?: boolean
  selected?: boolean
  onSelect?: (id: string) => void
  distance?: string   // e.g. "350 m" when sorting by nearest
}

/** The mural photo is the whole card; name, artist, location and status sit on a white card over its lower part. */
export function MuralCard({ mural, selectable, selected, onSelect, distance }: Props) {
  const { t } = useT()
  const gradient = getMuralGradient(mural.slug)
  const cover    = mural.cover_photo ?? null
  const locationText = isLocationUnknown(mural) || !mural.location_description?.trim() ? t('loc.unknown') : mural.location_description

  const inner = (
    <div className={`relative aspect-[3/4] overflow-hidden rounded-card bg-groove
      ${selectable ? 'cursor-pointer' : ''}
      ${selected   ? 'ring-2 ring-sea ring-offset-1' : ''}`}
      onClick={selectable ? () => onSelect?.(mural.id) : undefined}
    >
      {/* photo = the card */}
      {cover
        ? <img src={cover} alt={mural.title} className="absolute inset-0 w-full h-full object-cover" />
        : <div className="absolute inset-0" style={{ background: gradient }} />
      }

      {mural.photos?.length > 1 && (
        <span className="absolute top-2 left-2 flex items-center gap-1 text-caption font-display font-semibold text-white bg-black/50 rounded-full px-1.5 py-0.5">
          <Images size={10} />{mural.photos.length}
        </span>
      )}
      {selectable && (
        <div className={`absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center transition-colors
          ${selected ? 'bg-sea text-white' : 'bg-white/70 text-transparent'}`}>
          <Check size={11} strokeWidth={3} />
        </div>
      )}

      {/* overlay card: floats over the lower part of the photo; every line is one line so all cards are the same height */}
      <div className="absolute inset-x-card-inset bottom-card-inset rounded-card bg-surface px-3 pt-2.5 pb-2.5">
        <p className="text-card font-medium text-ink truncate">
          {mural.title?.trim() || t('card.untitled')}
        </p>
        <p className={`text-caption mt-0.5 truncate ${mural.artist ? 'text-sea' : 'text-ink-3'}`}>
          {mural.artist || t('card.artistUnknown')}
        </p>
        <p className="text-caption text-ink-3 truncate">
          {distance && <span className="text-sea font-semibold">{distance} · </span>}
          {locationText}
        </p>
        <div className="mt-2 flex gap-1 h-[1.125rem] overflow-hidden">  {/* at most 2 tags: status, then Changed */}
          <ConfidenceBadge level={mural.confidence} sm />
          <ArtworkBadge mural={mural} sm />
        </div>
      </div>
    </div>
  )

  if (selectable) return inner

  return <Link href={`/gallery/${mural.slug}`} className="block">{inner}</Link>
}
