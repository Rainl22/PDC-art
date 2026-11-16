'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { href: '/admin', label: 'Overview', exact: true },
  { href: '/admin/submissions', label: 'Submissions' },
  { href: '/admin/murals', label: 'Murals' },
  { href: '/admin/comments', label: 'Comments' },
  { href: '/admin/team', label: 'Team' },
]

export function AdminTabs({ pending = 0 }: { pending?: number }) {
  const path = usePathname()
  return (
    <nav className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-none">
      {TABS.map(t => {
        const active = t.exact ? path === t.href : path.startsWith(t.href)
        return (
          <Link key={t.href} href={t.href}
            className={`shrink-0 px-3 py-1 rounded-full text-caption font-display font-semibold tracking-wide transition-colors
              ${active ? 'bg-ink text-surface' : 'bg-groove text-ink-2'}`}>
            {t.label}
            {t.href === '/admin/submissions' && pending > 0 && (
              <span className={`ml-1.5 inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full text-caption font-bold ${active ? 'bg-surface text-ink' : 'bg-likely text-on-dark'}`}>{pending}</span>
            )}
          </Link>
        )
      })}
    </nav>
  )
}
