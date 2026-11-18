'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutGrid, Map, Route, PlusCircle, Search } from 'lucide-react'
import { Logo } from '@/components/brand/Logo'
import { useMenu } from '@/components/layout/SideMenu'
import { useT } from '@/lib/i18n/client'
import { LOCALES } from '@/lib/i18n/dict'
import { useTour } from '@/lib/tour'
import type { Key } from '@/lib/i18n/dict'

const TABS: { href: string; label: Key; Icon: typeof Map }[] = [
  { href: '/gallery', label: 'nav.gallery', Icon: LayoutGrid },
  { href: '/map',     label: 'nav.map',     Icon: Map },
  { href: '/tour',    label: 'nav.tour',    Icon: Route },
  { href: '/submit',  label: 'nav.submit',  Icon: PlusCircle },
]

/** Desktop top app bar (>=1024px). Phones keep the bottom tab bar. */
export function TopBar() {
  const path = usePathname()
  const router = useRouter()
  const { t, locale, setLocale } = useT()
  const { count } = useTour()
  const { open } = useMenu()
  const [q, setQ] = useState('')
  return (
    <header className="hidden lg:flex sticky top-0 z-40 h-[var(--topbar-h)] items-center gap-6 px-8 bg-surface border-b border-groove">
      <button type="button" onClick={open} aria-label={t('menu.open')} aria-haspopup="dialog"
        className="flex items-center gap-3 shrink-0 h-12 pl-1 pr-3 -ml-1 rounded-panel cursor-pointer hover:bg-bg active:scale-[.98] transition-colors">
        <Logo size={40} />
        <span className="font-display font-extrabold text-20 tracking-tight">Murales PDC</span>
      </button>
      <nav className="flex items-center gap-1 flex-1" aria-label="Main">
        {TABS.map(({ href, label, Icon }) => {
          const active = path.startsWith(href)
          return (
            <Link key={href} href={href} aria-current={active ? 'page' : undefined}
              className={`h-10 px-4 rounded-full flex items-center gap-2 text-14 transition-colors ${active ? 'bg-sea-tint text-sea-dark font-bold' : 'text-ink-2 font-medium hover:bg-bg'}`}>
              <Icon size={18} />
              {t(label)}
              {href === '/tour' && count > 0 && <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-marigold text-ink text-12 font-bold leading-[18px] text-center">{count}</span>}
            </Link>
          )
        })}
      </nav>
      <form role="search" onSubmit={e => { e.preventDefault(); router.push(q.trim() ? `/gallery?q=${encodeURIComponent(q.trim())}` : '/gallery') }}
        className="w-[340px] h-11 rounded-full bg-bg border border-groove px-4 flex items-center gap-2 focus-within:border-sea">
        <Search size={18} className="text-ink-2 shrink-0" />
        <input value={q} onChange={e => setQ(e.target.value)} placeholder={t('gallery.searchFull')} aria-label={t('gallery.searchFull')}
          autoComplete="off" className="flex-1 min-w-0 bg-transparent outline-none placeholder:text-ink-3" />
      </form>
      <div className="flex gap-0.5 p-[3px] rounded-full bg-bg border border-groove" role="group" aria-label="Language">
        {LOCALES.map(l => (
          <button key={l} type="button" aria-pressed={locale === l} onClick={() => setLocale(l)}
            className={`min-w-[44px] h-[38px] rounded-full text-13 font-semibold ${locale === l ? 'bg-ink text-on-dark' : 'text-ink-2'}`}>{l.toUpperCase()}</button>
        ))}
      </div>
    </header>
  )
}
