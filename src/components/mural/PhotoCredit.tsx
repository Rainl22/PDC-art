'use client'
import type { Mural } from '@/types/mural'
import { useT } from '@/lib/i18n/client'

/** Credit for photos we didn't take. Hidden once none of those photos are shown any more (bundled ones live under /murals/). */
export function PhotoCredit({ mural }: { mural: Pick<Mural, 'photo_credit' | 'photo_credit_url' | 'photos'> }) {
  const { t } = useT()
  const stillShown = (mural.photos ?? []).some(p => p.startsWith('/murals/'))
  if (!mural.photo_credit || !stillShown) return null
  return (
    <p className="text-caption text-ink-3">
      {t('photo.credit')}{' '}
      {mural.photo_credit_url ? (
        <a href={mural.photo_credit_url} target="_blank" rel="noopener noreferrer"
          className="underline underline-offset-2 hover:text-sea">
          {mural.photo_credit}
        </a>
      ) : mural.photo_credit}
    </p>
  )
}
