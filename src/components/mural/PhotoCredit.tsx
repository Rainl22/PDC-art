import type { Mural } from '@/types/mural'

export function PhotoCredit({ mural }: { mural: Pick<Mural, 'photo_credit' | 'photo_credit_url'> }) {
  if (!mural.photo_credit) return null
  return (
    <p className="px-5 pt-2 text-[10px] text-ink-3 leading-snug">
      Photo:{' '}
      {mural.photo_credit_url ? (
        <a href={mural.photo_credit_url} target="_blank" rel="noopener noreferrer"
          className="underline underline-offset-2 hover:text-sea">
          {mural.photo_credit}
        </a>
      ) : mural.photo_credit}
    </p>
  )
}
