import type { ReactNode } from 'react'

export type TagTone = 'certain' | 'unconfirmed' | 'danger' | 'removed' | 'sea' | 'neutral'
export type TagDot = 'filled' | 'ring' | 'dashed' | 'x'

const TONE: Record<TagTone, string> = {
  certain:     'bg-certain-bg text-certain',
  unconfirmed: 'bg-unconfirmed-bg text-unconfirmed',
  danger:      'bg-danger-bg text-danger',
  removed:     'bg-removed-bg text-removed',
  sea:         'bg-sea-tint text-sea',
  neutral:     'bg-groove text-ink-2',
}

/** The one pill used for every tag (status, changed, place, rotating wall): DM Sans 600, 12px, pill. */
export function Tag({ tone, dot, icon, children }: { tone: TagTone; dot?: TagDot; icon?: ReactNode; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-semibold text-12 px-2 py-[3px] whitespace-nowrap ${TONE[tone]}`}>
      {dot === 'filled' && <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />}
      {dot === 'ring'   && <span className="w-1.5 h-1.5 rounded-full border border-current shrink-0" />}
      {dot === 'dashed' && <span className="w-1.5 h-1.5 rounded-full border border-dashed border-current shrink-0" />}
      {dot === 'x'      && <span className="leading-none shrink-0" aria-hidden>✕</span>}
      {icon}
      {children}
    </span>
  )
}
