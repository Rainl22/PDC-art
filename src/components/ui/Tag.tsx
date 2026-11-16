import type { ReactNode } from 'react'

export type TagTone = 'certain' | 'likely' | 'guessing' | 'removed' | 'sea' | 'neutral'
export type TagDot = 'filled' | 'ring' | 'dashed' | 'x'

const TONE: Record<TagTone, string> = {
  certain:  'bg-certain-bg text-certain',
  likely:   'bg-likely-bg text-likely',
  guessing: 'bg-guessing-bg text-guessing',
  removed:  'bg-removed-bg text-removed',
  sea:      'bg-sea-tint text-sea',
  neutral:  'bg-groove text-ink-2',
}

/** The one pill used for every tag (status, changed, place, rotating wall). `size="sm"` is for gallery cards. */
export function Tag({ tone, size = 'md', dot, icon, children }: { tone: TagTone; size?: 'sm' | 'md'; dot?: TagDot; icon?: ReactNode; children: ReactNode }) {
  const type = size === 'sm' ? 'text-tag-sm px-1.5 py-px gap-[3px]' : 'text-tag px-2 py-0.5 gap-1'
  const d = size === 'sm' ? 'w-[5px] h-[5px]' : 'w-1.5 h-1.5'
  return (
    <span className={`inline-flex items-center rounded-full font-display font-semibold tracking-wide uppercase whitespace-nowrap ${TONE[tone]} ${type}`}>
      {dot === 'filled' && <span className={`${d} rounded-full bg-current shrink-0`} />}
      {dot === 'ring'   && <span className={`${d} rounded-full border border-current shrink-0`} />}
      {dot === 'dashed' && <span className={`${d} rounded-full border border-dashed border-current shrink-0`} />}
      {dot === 'x'      && <span className="leading-none shrink-0">✕</span>}
      {icon}
      {children}
    </span>
  )
}
