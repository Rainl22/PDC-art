'use client'
import Link from 'next/link'
import { useT } from '@/lib/i18n/client'
import { getMuralGradient } from '@/lib/gradients'
import { Tag } from '@/components/ui/Tag'
import { HeartIcon } from './LikeButton'
import { TourButton } from '@/components/ui/TourButton'
import { displayTitle, displayArtist, displayPlace } from '@/lib/format'
import { ThumbImg } from '@/components/ui/ThumbImg'
import { Images } from 'lucide-react'
import type { Mural } from '@/types/mural'

interface Props {
  mural: Mural
  distance?: string   // e.g. "350 m", only when we know where the person is
  priority?: boolean  // first cards load eagerly, the rest lazily
  active?: boolean    // selected from the desktop map: 3px sea outline
  onHover?: (id: string | null) => void
}

/** Photo-first card: 4:5 photo on top (badges in the corners only), text underneath. Never shows coordinates. */
export function MuralCard({ mural, distance, priority, active, onHover }: Props) {
  const { t } = useT()
  const gradient = getMuralGradient(mural.slug)
  const cover    = mural.cover_photo ?? null
  const place    = displayPlace(mural) || t('card.locUnconfirmed')
  const artist   = displayArtist(mural)
  const verified = mural.confidence === 'verified'
  const removed  = mural.confidence === 'removed'
  const photoCount = mural.photos?.length ?? 0

  return (
    <div id={`card-${mural.id}`} className="group relative" onMouseEnter={() => onHover?.(mural.id)} onMouseLeave={() => onHover?.(null)}>
      <Link href={`/gallery/${mural.slug}`} className="block">
        <div className={`relative aspect-[4/5] overflow-hidden rounded-panel bg-groove ${active ? 'outline outline-[3px] outline-sea outline-offset-[3px]' : ''}`}>
          {cover
            ? <ThumbImg src={cover} alt={mural.title} eager={priority} className={`absolute inset-0 w-full h-full object-cover ${removed ? 'saturate-[.6]' : ''}`} />
            : <div className="absolute inset-0" style={{ background: gradient }} />}
          {/* warm soft-light tint so photos taken in different light feel like one set */}
          <div aria-hidden className="absolute inset-0 pointer-events-none mix-blend-soft-light"
            style={{ background: 'var(--image-tint)', opacity: 'var(--image-tint-opacity)' }} />

          {/* status, top-left: only murals that are not verified (or removed) carry a tag */}
          {!verified && (
            <div className="absolute top-2 left-2">
              <Tag tone={removed ? 'removed' : 'unconfirmed'}>{t(removed ? 'conf.removed' : 'conf.unverified')}</Tag>
            </div>
          )}

          {photoCount > 1 && (
            <span aria-label={t('card.photos', { n: photoCount })} className="absolute bottom-2 right-2 flex items-center gap-1 text-12 font-semibold text-on-dark bg-scrim rounded-full px-2 py-0.5">
              <Images size={12} aria-hidden />{photoCount}
            </span>
          )}
        </div>

        <div className="mt-3 px-0.5 space-y-0.5">
          <p className="text-16 font-semibold text-ink leading-tight line-clamp-2">{displayTitle(mural.title) || t('card.untitled')}</p>
          <p className={`text-14 font-medium truncate ${artist ? 'text-sea' : 'text-ink-2'}`}>{artist || t('card.artistUnknown')}</p>
          <p className="text-13 text-ink-2 truncate">{[place, distance].filter(Boolean).join(' · ')}</p>
        </div>
      </Link>

      {/* desktop: "Add to tour" appears on hover or keyboard focus */}
      <div className="hidden lg:block absolute inset-x-0 top-0 aspect-[4/5] pointer-events-none">
        <TourButton muralId={mural.id} variant="pill" className="pointer-events-auto absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 group-focus-within:opacity-100 transition-opacity" />
      </div>
      {/* save heart: a sibling of the link (no button inside a link); 36px visual, 44px tap area */}
      <HeartIcon muralId={mural.id} className="absolute top-1.5 right-1.5" />
    </div>
  )
}
