import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { MenuButton } from '@/components/layout/SideMenu'
import { getT } from '@/lib/i18n/server'
import type { LegalDoc } from '@/lib/legal/content'

export function LegalPage({ doc }: { doc: LegalDoc }) {
  const { t } = getT()
  return (
    <main className="bg-surface min-h-dvh">
      <header className="sticky top-0 z-10 bg-surface border-b border-groove px-gutter pt-controls pb-3 flex items-center gap-3 min-h-control box-content">
        <MenuButton />
        <h1 className="flex-1 font-display font-bold text-card tracking-tight">{doc.title}</h1>
        <Link href="/gallery" aria-label={t('legal.back')} className="w-9 h-9 rounded-full flex items-center justify-center text-ink-2 hover:bg-bg">
          <ChevronLeft size={18} />
        </Link>
      </header>
      <article className="px-5 py-5 max-w-prose mx-auto">
        <p className="text-caption text-ink-3">{t('legal.updated')}: {doc.updated}</p>
        <p className="text-body text-ink-2 leading-relaxed mt-3">{doc.intro}</p>
        {doc.sections.map(s => (
          <section key={s.h} className="mt-6">
            <h2 className="font-display font-bold text-body text-ink">{s.h}</h2>
            {s.p.map((para, i) => (
              <p key={i} className="text-body text-ink-2 leading-relaxed mt-2">{para}</p>
            ))}
          </section>
        ))}
      </article>
    </main>
  )
}
