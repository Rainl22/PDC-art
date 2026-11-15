'use client'
import type { Mural, Artist } from '@/types/mural'
import { useT } from '@/lib/i18n/client'
import { artistHref, useArtistDirectory } from '@/lib/artistDirectory'

/** Artist name(s); each links to their Instagram / profile when we have it (from the mural or the artist directory). */
export function ArtistLinks({ mural, className = '' }: { mural: Pick<Mural, 'artist' | 'artists'>; className?: string }) {
  const { t } = useT()
  const { find } = useArtistDirectory()
  const artists: Artist[] = mural.artists?.length ? mural.artists : mural.artist ? mural.artist.split(',').map(n => ({ name: n.trim() })).filter(a => a.name) : []
  if (artists.length === 0) return <span className="text-ink-3">{t('card.artistUnknown')}</span>
  return (
    <span className={className}>
      {artists.map((a, i) => {
        const href = artistHref(a) ?? artistHref(find(a.name))
        return (
          <span key={a.name}>
            {i > 0 && ', '}
            {href ? (
              <a href={href} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                className="underline decoration-sea/40 underline-offset-2 hover:decoration-sea">
                {a.name}
              </a>
            ) : a.name}
          </span>
        )
      })}
    </span>
  )
}
