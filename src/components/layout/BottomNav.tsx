'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutGrid, Map, Route, PlusCircle } from 'lucide-react'
import { useT } from '@/lib/i18n/client'
import { useTour } from '@/lib/tour'
import type { Key } from '@/lib/i18n/dict'

const NAV: { href: string; label: Key; Icon: typeof Map }[] = [
  { href: '/gallery', label: 'nav.gallery', Icon: LayoutGrid },
  { href: '/map',     label: 'nav.map',     Icon: Map },
  { href: '/tour',    label: 'nav.tour',    Icon: Route },
  { href: '/submit',  label: 'nav.submit',  Icon: PlusCircle },
]

export function BottomNav() {
  const path = usePathname()
  const { t } = useT()
  const { count } = useTour()
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-surface border-t border-groove flex items-stretch pb-safe h-[var(--nav-h)]">
      {NAV.map(({ href, label, Icon }) => {
        const active = path.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={`flex flex-col items-center justify-center gap-0.5 flex-1 text-12 transition-colors ${active ? 'text-sea font-bold' : 'text-ink-2 font-medium'}`}
          >
            {/* active indicator: a soft pill behind the icon, so it isn't colour alone */}
            <span className={`relative flex items-center justify-center w-14 h-[30px] rounded-full transition-colors ${active ? 'bg-sea-tint' : ''}`}>
              <Icon size={20} strokeWidth={active ? 2.5 : 1.75} />
              {href === '/tour' && count > 0 && (
                <span aria-label={String(count)} className="absolute -top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-marigold text-ink text-12 font-bold leading-[18px] text-center">{count}</span>
              )}
            </span>
            {t(label)}
          </Link>
        )
      })}
    </nav>
  )
}
