'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useT } from '@/lib/i18n/client'

interface Props {
  photos: string[]
  title: string
  gradient: string
  overlay?: React.ReactNode
}

export function PhotoGallery({ photos, title, gradient, overlay }: Props) {
  const { t } = useT()
  const [index, setIndex] = useState(0)
  const [open, setOpen] = useState<number | null>(null)
  const scroller = useRef<HTMLDivElement>(null)
  const touchX = useRef<number | null>(null)
  const n = photos.length

  function onScroll() {
    const el = scroller.current
    if (el) setIndex(Math.round(el.scrollLeft / el.clientWidth))
  }
  function goTo(i: number) {
    scroller.current?.scrollTo({ left: i * scroller.current.clientWidth, behavior: 'smooth' })
  }

  const step = useCallback((d: number) => setOpen(o => (o === null ? o : (o + d + n) % n)), [n])

  useEffect(() => {
    if (open === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(null)
      if (e.key === 'ArrowRight') step(1)
      if (e.key === 'ArrowLeft') step(-1)
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [open, step])

  return (
    <div className="relative h-72 overflow-hidden bg-groove">
      {n === 0 ? (
        <div className="w-full h-full" style={{ background: gradient }} />
      ) : (
        <div ref={scroller} onScroll={onScroll}
          className="flex h-full overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {photos.map((src, i) => (
            <button key={src} type="button" onClick={() => setOpen(i)} aria-label={t('photo.viewFull', { i: i + 1, n })}
              className="shrink-0 w-full h-full snap-center cursor-zoom-in">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`${title} — photo ${i + 1}`} loading={i === 0 ? 'eager' : 'lazy'}
                className="w-full h-full object-cover" draggable={false} />
            </button>
          ))}
        </div>
      )}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-black/40 via-transparent to-black/10" />
      <div className="absolute inset-0 pointer-events-none [&>*]:pointer-events-auto">{overlay}</div>

      {n > 1 && (
        <>
          <div className="absolute bottom-[calc(0.75rem+var(--space-sheet-overlap))] left-0 right-0 flex justify-center gap-1.5 pointer-events-none">
            {photos.map((_, i) => (
              <span key={i} className={`h-1.5 rounded-full transition-all ${i === index ? 'w-4 bg-surface' : 'w-1.5 bg-glass-dim'}`} />
            ))}
          </div>
          <span className="absolute bottom-[calc(0.75rem+var(--space-sheet-overlap))] right-4 text-13 font-semibold text-on-dark bg-scrim rounded-full px-2 py-0.5 pointer-events-none">
            {index + 1} / {n}
          </span>
          <button type="button" aria-label={t('photo.prev')} onClick={() => goTo(Math.max(index - 1, 0))}
            className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-glass items-center justify-center">
            <ChevronLeft size={18} />
          </button>
          <button type="button" aria-label={t('photo.next')} onClick={() => goTo(Math.min(index + 1, n - 1))}
            className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-glass items-center justify-center">
            <ChevronRight size={18} />
          </button>
        </>
      )}

      {open !== null && (
        <div role="dialog" aria-modal="true" aria-label={`${title} photo ${open + 1} of ${n}`}
          className="fixed inset-0 z-[100] bg-backdrop flex items-center justify-center"
          onTouchStart={e => { touchX.current = e.touches[0].clientX }}
          onTouchEnd={e => {
            if (touchX.current === null || n < 2) return
            const dx = e.changedTouches[0].clientX - touchX.current
            if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1)
            touchX.current = null
          }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photos[open]} alt={`${title} — photo ${open + 1}`} className="max-w-full max-h-full object-contain select-none" draggable={false} />
          <button type="button" aria-label={t('photo.close')} onClick={() => setOpen(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-glass-faint text-on-dark flex items-center justify-center">
            <X size={20} />
          </button>
          {n > 1 && (
            <>
              <button type="button" aria-label={t('photo.prev')} onClick={() => step(-1)}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-glass-faint text-on-dark flex items-center justify-center">
                <ChevronLeft size={22} />
              </button>
              <button type="button" aria-label={t('photo.next')} onClick={() => step(1)}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-glass-faint text-on-dark flex items-center justify-center">
                <ChevronRight size={22} />
              </button>
              <span className="absolute bottom-5 left-1/2 -translate-x-1/2 text-13 text-on-dark ">{open + 1} / {n}</span>
            </>
          )}
        </div>
      )}
    </div>
  )
}
