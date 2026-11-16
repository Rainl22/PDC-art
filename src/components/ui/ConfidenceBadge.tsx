'use client'
import type { ConfidenceLevel } from '@/types/mural'
import { useT } from '@/lib/i18n/client'
import { Tag, type TagDot, type TagTone } from './Tag'

const CFG: Record<ConfidenceLevel, { tone: TagTone; dot: TagDot }> = {
  verified:   { tone: 'certain',  dot: 'filled' },
  likely:     { tone: 'likely',   dot: 'ring'   },
  unverified: { tone: 'guessing', dot: 'dashed' },
  removed:    { tone: 'removed',  dot: 'x'      },
}

export function ConfidenceBadge({ level, sm }: { level: ConfidenceLevel; sm?: boolean }) {
  const { t } = useT()
  const shown: ConfidenceLevel = level === 'likely' ? 'unverified' : level   // "likely" was merged into "unverified"
  const { tone, dot } = CFG[shown]
  return <Tag tone={tone} dot={dot} size={sm ? 'sm' : 'md'}>{t(`conf.${shown}`)}</Tag>
}
