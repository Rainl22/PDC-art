'use client'
import Link from 'next/link'
import { useT } from '@/lib/i18n/client'
import { getMuralGradient } from '@/lib/gradients'
import { Tag } from '@/components/ui/Tag'
import { HeartIcon } from './LikeButton'
import { displayTitle, displayArtist, displayPlace } from '@/lib/format'
import { Check, Images } from 'lucide-react'
import type { Mural } from '@/types/mural'

interface Props {
  mural: Mural
  distance?: string   // e.g. "350 m", only when we know where the person is
  priority?: boolean  // first cards load eagerly, the rest lazily
}

/** Photo-first card: 4:5 photo on top (badges in the corners only), text underneath. Never shows coordinates. */
export function MuralCard({ mural, distance, priority }: Props) {
  const { t } = useT()
  const gradient = getMuralGradient(mural.slug)
  const cover    = mural.cover_photo ?? null
  const place    = displayPlace(mural) || t('card.locUnconfirmed')
  const artist   = displayArtist(mural)
  const verified = mural.confidence === 'verified'
  const removed  = mural.confidence === 'removed'
  const photoCount = mural.photos?.length ?? 0

  return (
    <div className="relative">
      <Link href={`/gallery/${mural.slug}`} className="block">
        <div className="relative aspect-[4/5] overflow-hidden rounded-panel bg-groove">
          {cover
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={cover} alt={mural.title} loading={priority ? 'eager' : 'lazy'} decoding="async" className={`absolute inset-0 w-full h-full object-cover ${removed ? 'saturate-[.6]' : ''}`} />
            : <div className="absolute inset-0" style={{ background: gradient }} />}
          {/* warm soft-light tint so photos taken in different light feel like one set */}
          <div aria-hidden className="absolute inset-0 pointer-events-none mix-blend-soft-light"
            style={{ background: 'var(--image-tint)', opacity: 'var(--image-tint-opacity)' }} />

          {/* status, top-left: a check for verified (not colour alone), a text tag otherwise */}
          <div className="absolute top-2 left-2">
            {verified
              ? <span role="img" aria-label={t('card.verified')} className="w-6 h-6 rounded-full bg-certain text-on-dark flex items-center justify-center ring-2 ring-on-dark"><Check size={14} strokeWidth={3} /></span>
              : <Tag tone={removed ? 'removed' : 'unconfirmed'}>{t(removed ? 'conf.removed' : 'conf.unverified')}</Tag>}
          </div>

          {photoCount > 1 && (
            <span aria-label={t('card.photos', { n: photoCount })} className="absolute bottom-2 right-2 flex items-center gap-1 text-12 font-semibold text-on-dark bg-scrim rounded-full px-2 py-0.5">
              <Images size={12} aria-hidden />{photoCount}
            </span>
          )}
        </div>

        <div className="mt-2 px-0.5 space-y-0.5">
          <p className="text-16 font-semibold text-ink leading-tight line-clamp-2">{displayTitle(mural.title) || t('card.untitled')}</p>
          <p className={`text-14 font-medium truncate ${artist ? 'text-sea' : 'text-ink-2'}`}>{artist || t('card.artistUnknown')}</p>
          <p className="text-13 text-ink-2 truncate">{[place, distance].filter(Boolean).join(' · ')}</p>
        </div>
      </Link>

      {/* save heart: a sibling of the link (no button inside a link); 36px visual, 44px tap area */}
      <HeartIcon muralId={mural.id} className="absolute top-1.5 right-1.5" />
    </div>
  )
}
