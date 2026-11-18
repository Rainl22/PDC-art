'use client'
import { Check, Route } from 'lucide-react'
import { useTour } from '@/lib/tour'
import { useT } from '@/lib/i18n/client'

/** "Add to tour" / "In tour ✓". One tap, no mode. `tint` = soft sea button (48px); `pill` = small pill on photos (36px). */
export function TourButton({ muralId, variant = 'tint', className = '' }: { muralId: string; variant?: 'tint' | 'pill'; className?: string }) {
  const { t } = useT()
  const tour = useTour()
  const inTour = tour.has(muralId)
  const size = variant === 'pill' ? 'h-9 px-3 text-13 bg-glass shadow-1 text-ink' : `h-field px-4 text-14 ${inTour ? 'bg-sea text-on-dark' : 'bg-sea-tint text-sea'}`
  return (
    <button type="button" aria-pressed={inTour}
      onClick={e => { e.preventDefault(); e.stopPropagation(); tour.toggle(muralId) }}
      className={`inline-flex items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap active:scale-95 transition-transform ${size} ${className}`}>
      {inTour ? <Check size={16} strokeWidth={2.5} /> : <Route size={16} />}
      {inTour ? t('tour.inTour') : t('tour.addTo')}
    </button>
  )
}
