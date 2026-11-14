import type { ConfidenceLevel } from '@/types/mural'

const CFG: Record<ConfidenceLevel, { label: string; cls: string; dot: 'filled' | 'ring' | 'dashed' | 'x' }> = {
  verified:   { label: 'Verified',   cls: 'bg-certain-bg text-certain',   dot: 'filled'  },
  likely:     { label: 'Likely',     cls: 'bg-likely-bg text-likely',     dot: 'ring'    },
  unverified: { label: 'Unverified', cls: 'bg-guessing-bg text-guessing', dot: 'dashed'  },
  removed:    { label: 'Removed',    cls: 'bg-removed-bg text-removed',   dot: 'x'       },
}

export function ConfidenceBadge({ level, sm }: { level: ConfidenceLevel; sm?: boolean }) {
  const { label, cls, dot } = CFG[level]
  const size = sm ? 'text-[9px] px-1.5 py-0.5' : 'text-[10px] px-2 py-0.5'
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-display font-semibold tracking-wide uppercase ${cls} ${size}`}>
      {dot === 'filled'  && <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />}
      {dot === 'ring'    && <span className="w-1.5 h-1.5 rounded-full border border-current shrink-0" />}
      {dot === 'dashed'  && <span className="w-1.5 h-1.5 rounded-full border border-dashed border-current shrink-0" />}
      {dot === 'x'       && <span className="text-[8px] leading-none shrink-0">✕</span>}
      {label}
    </span>
  )
}
