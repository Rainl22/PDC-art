'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, Route } from 'lucide-react'
import { useTour } from '@/lib/tour'
import { useT } from '@/lib/i18n/client'

/** Fixed above the tab bar while the tour has stops (on the gallery and mural pages). */
export function TourTray() {
  const path = usePathname()
  const { count } = useTour()
  const { t } = useT()
  if (count === 0 || !path.startsWith('/gallery')) return null
  return (
    <div className="lg:hidden fixed left-gutter right-gutter bottom-[calc(var(--nav-h)+0.75rem)] z-40 h-14 rounded-full bg-ink text-on-dark shadow-2 pl-4 pr-2 flex items-center gap-3">
      <Route size={20} className="shrink-0" />
      <p className="flex-1 min-w-0 text-14 truncate"><strong className="font-semibold">{t(count === 1 ? 'tour.tray.one' : 'tour.tray.many', { n: count })}</strong></p>
      <Link href="/tour" className="h-10 px-4 rounded-full bg-marigold text-ink text-14 font-semibold flex items-center gap-1">
        {t('tour.view')}<ChevronRight size={16} />
      </Link>
    </div>
  )
}
