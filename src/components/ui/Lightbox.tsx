'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

/** Full-screen photo viewer: swipe (or arrow keys / buttons) to see the next photo. */
export function Lightbox({ photos, start, onClose }: { photos: string[]; start: number; onClose: () => void }) {
  const [i, setI] = useState(start)
  const touchX = useRef<number | null>(null)
  const n = photos.length
  const step = useCallback((d: number) => setI(o => (o + d + n) % n), [n])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') step(1)
      if (e.key === 'ArrowLeft') step(-1)
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [onClose, step])

  const btn = 'absolute w-10 h-10 rounded-full bg-white/15 text-white flex items-center justify-center'
  return (
    <div role="dialog" aria-modal="true" aria-label={`Photo ${i + 1} of ${n}`}
      className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
      onTouchStart={e => { touchX.current = e.touches[0].clientX }}
      onTouchEnd={e => {
        if (touchX.current === null || n < 2) return
        const dx = e.changedTouches[0].clientX - touchX.current
        if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1)
        touchX.current = null
      }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photos[i]} alt={`Photo ${i + 1}`} className="max-w-full max-h-full object-contain select-none" draggable={false} />
      <button type="button" aria-label="Close" onClick={onClose} className={`${btn} top-4 right-4`}><X size={20} /></button>
      {n > 1 && (
        <>
          <button type="button" aria-label="Previous photo" onClick={() => step(-1)} className={`${btn} left-3 top-1/2 -translate-y-1/2`}><ChevronLeft size={22} /></button>
          <button type="button" aria-label="Next photo" onClick={() => step(1)} className={`${btn} right-3 top-1/2 -translate-y-1/2`}><ChevronRight size={22} /></button>
          <span className="absolute bottom-5 left-1/2 -translate-x-1/2 text-small text-white/90 font-display">{i + 1} / {n}</span>
        </>
      )}
    </div>
  )
}
