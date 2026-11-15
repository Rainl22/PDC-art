'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutGrid, Map, Route, PlusCircle } from 'lucide-react'
import { useT } from '@/lib/i18n/client'
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
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-surface border-t border-groove flex items-stretch pb-safe h-[var(--nav-h)]">
      {NAV.map(({ href, label, Icon }) => {
        const active = path.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center justify-center gap-1 flex-1 py-2 text-[10px] font-display font-medium tracking-wide transition-colors
              ${active ? 'text-sea' : 'text-ink-3'}`}
          >
            <Icon size={18} strokeWidth={active ? 2.5 : 1.75} />
            {t(label)}
          </Link>
        )
      })}
    </nav>
  )
}
