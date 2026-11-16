'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { BadgeCheck, MapPin, Camera } from 'lucide-react'
import { useT } from '@/lib/i18n/client'

/** Small "Verify" pill inside the location block: choose to verify the location or the image. */
export function VerifyMenu({ slug, title }: { slug: string; title: string }) {
  const { t } = useT()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const close = (e: Event) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('pointerdown', close); document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', esc) }
  }, [open])
  const q = `mural=${encodeURIComponent(slug)}&title=${encodeURIComponent(title)}`
  const item = 'flex items-center gap-2 px-3 py-2.5 text-small font-display font-semibold text-ink hover:bg-bg'
  return (
    <div ref={ref} className="relative inline-block">
      <button type="button" onClick={() => setOpen(o => !o)} aria-expanded={open} aria-haspopup="menu"
        className="inline-flex items-center gap-1 rounded-full border border-sea text-sea px-2.5 py-0.5 text-caption font-display font-semibold uppercase tracking-wide">
        <BadgeCheck size={11} />{t('detail.verify')}
      </button>
      {open && (
        <div role="menu" className="absolute left-0 top-full mt-1.5 z-20 w-44 bg-surface rounded-xl shadow-xl border border-groove overflow-hidden">
          <Link role="menuitem" href={`/submit?${q}&mode=verify`} className={item}><MapPin size={14} className="text-sea" />{t('detail.verifyLocation')}</Link>
          <Link role="menuitem" href={`/submit?${q}&mode=photos`} className={`${item} border-t border-groove`}><Camera size={14} className="text-sea" />{t('detail.verifyImage')}</Link>
        </div>
      )}
    </div>
  )
}
