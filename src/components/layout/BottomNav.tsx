'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutGrid, Map, Route, Heart } from 'lucide-react'

const NAV = [
  { href: '/gallery', label: 'Gallery', Icon: LayoutGrid },
  { href: '/map',     label: 'Map',     Icon: Map },
  { href: '/tour',    label: 'Tour',    Icon: Route },
  { href: '/saved',   label: 'Saved',   Icon: Heart },
]

export function BottomNav() {
  const path = usePathname()
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-surface border-t border-groove flex items-stretch pb-safe">
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
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
