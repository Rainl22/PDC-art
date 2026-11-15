'use client'
import type { Mural } from '@/types/mural'
import { useT } from '@/lib/i18n/client'

/** Artist name(s); each links to their Instagram when we have the handle. */
export function ArtistLinks({ mural, className = '' }: { mural: Pick<Mural, 'artist' | 'artists'>; className?: string }) {
  const { t } = useT()
  const artists = mural.artists?.length ? mural.artists : mural.artist ? [{ name: mural.artist }] : []
  if (artists.length === 0) return <span className="text-ink-3">{t('card.artistUnknown')}</span>
  return (
    <span className={className}>
      {artists.map((a, i) => (
        <span key={a.name}>
          {i > 0 && ', '}
          {a.instagram ? (
            <a href={`https://www.instagram.com/${a.instagram}/`} target="_blank" rel="noopener noreferrer"
              className="underline decoration-sea/40 underline-offset-2 hover:decoration-sea">
              {a.name}
            </a>
          ) : a.name}
        </span>
      ))}
    </span>
  )
}
