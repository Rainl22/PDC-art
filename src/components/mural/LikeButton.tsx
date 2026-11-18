'use client'
import { useEffect, useState } from 'react'
import { Heart } from 'lucide-react'
import { useLikes } from '@/lib/likes'
import { useT } from '@/lib/i18n/client'

/** Round heart used on cards and the pin card. Visual size `size`, hit area at least 44px. */
export function HeartIcon({ muralId, size = 36, className = '', variant = 'glass' }: { muralId: string; size?: number; className?: string; variant?: 'glass' | 'outline' }) {
  const { t } = useT()
  const { has, toggle } = useLikes()
  const liked = has(muralId)
  const look = variant === 'outline'
    ? 'w-field h-field border border-groove bg-surface'
    : 'bg-glass shadow-1'
  return (
    <span className={`${className.includes("absolute") ? "" : "relative"} inline-flex ${className}`}>
      <button type="button" aria-pressed={liked} aria-label={liked ? t('like.remove') : t('like.add')}
        onClick={e => { e.preventDefault(); e.stopPropagation(); void toggle(muralId) }}
        style={variant === 'glass' ? { width: size, height: size } : undefined}
        className={`rounded-full flex items-center justify-center active:scale-95 transition-transform before:absolute before:-inset-1 before:content-[''] ${look}`}>
        <Heart size={variant === 'glass' ? 18 : 20} className={liked ? 'fill-like text-like' : 'text-ink'} />
      </button>
    </span>
  )
}

/** Heart on the mural page. The count appears only from 3 hearts, so a new mural doesn't show a lonely "0". */
export function LikeButton({ muralId, count }: { muralId: string; count: number }) {
  const { t } = useT()
  const { has, toggle, busy } = useLikes()
  const liked = has(muralId)
  const [n, setN] = useState(count)
  useEffect(() => setN(count), [count])

  async function onClick() {
    if (busy) return
    setN(v => Math.max(0, v + (liked ? -1 : 1)))     // optimistic
    const total = await toggle(muralId)
    if (total === null) setN(v => Math.max(0, v + (liked ? 1 : -1)))   // put it back
    else setN(total)
  }

  return (
    <button type="button" onClick={onClick} aria-pressed={liked} aria-label={liked ? t('like.remove') : t('like.add')}
      className={`shrink-0 inline-flex items-center justify-center gap-1.5 min-w-control h-control px-3 rounded-full border text-14 font-semibold transition-colors
        ${liked ? 'border-danger-line bg-danger-bg text-like' : 'border-groove bg-surface text-ink-2 hover:border-sea hover:text-sea'}`}>
      <Heart size={18} className={liked ? 'fill-current' : ''} />
      {n >= 3 && n}
    </button>
  )
}
