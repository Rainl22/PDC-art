'use client'
import { useEffect, useState } from 'react'
import { Heart } from 'lucide-react'
import { setLike } from '@/lib/murals'
import { useT } from '@/lib/i18n/client'

const KEY = 'pdc.likes'
const read = (): string[] => { try { return JSON.parse(localStorage.getItem(KEY) ?? '[]') } catch { return [] } }
const write = (ids: string[]) => { try { localStorage.setItem(KEY, JSON.stringify(ids)) } catch { /* private mode */ } }

/** Heart with the running count. One like per device; tap again to undo. */
export function LikeButton({ muralId, count }: { muralId: string; count: number }) {
  const { t } = useT()
  const [liked, setLiked] = useState(false)
  const [n, setN] = useState(count)
  const [busy, setBusy] = useState(false)

  useEffect(() => { setLiked(read().includes(muralId)) }, [muralId])

  async function toggle() {
    if (busy) return
    const next = !liked
    setBusy(true); setLiked(next); setN(v => Math.max(0, v + (next ? 1 : -1)))   // optimistic
    try {
      const total = await setLike(muralId, next)
      setN(total)
      write(next ? Array.from(new Set(read().concat(muralId))) : read().filter(id => id !== muralId))
    } catch {
      setLiked(!next); setN(v => Math.max(0, v + (next ? -1 : 1)))                 // put it back
    } finally { setBusy(false) }
  }

  return (
    <button type="button" onClick={toggle} aria-pressed={liked} aria-label={liked ? t('like.remove') : t('like.add')}
      className={`shrink-0 inline-flex items-center gap-1.5 h-9 px-3 rounded-full border text-small font-display font-semibold transition-colors
        ${liked ? 'border-guessing/30 bg-guessing-bg text-guessing' : 'border-groove text-ink-2 hover:border-sea hover:text-sea'}`}>
      <Heart size={15} className={liked ? 'fill-current' : ''} />
      {n}
    </button>
  )
}
