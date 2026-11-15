'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { href: '/admin', label: 'Overview', exact: true },
  { href: '/admin/submissions', label: 'Submissions' },
  { href: '/admin/murals', label: 'Murals' },
  { href: '/admin/comments', label: 'Comments' },
]

export function AdminTabs() {
  const path = usePathname()
  return (
    <nav className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-none">
      {TABS.map(t => {
        const active = t.exact ? path === t.href : path.startsWith(t.href)
        return (
          <Link key={t.href} href={t.href}
            className={`shrink-0 px-3 py-1 rounded-full text-[11px] font-display font-semibold tracking-wide transition-colors
              ${active ? 'bg-ink text-surface' : 'bg-groove text-ink-2'}`}>
            {t.label}
          </Link>
        )
      })}
    </nav>
  )
}
