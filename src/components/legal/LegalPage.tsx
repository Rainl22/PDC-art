import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { MenuButton } from '@/components/layout/SideMenu'
import { getT } from '@/lib/i18n/server'
import type { LegalDoc } from '@/lib/legal/content'

export function LegalPage({ doc }: { doc: LegalDoc }) {
  const { t } = getT()
  return (
    <main className="bg-surface min-h-dvh">
      <header className="sticky top-0 z-10 bg-surface border-b border-groove px-4 pt-safe py-3 flex items-center gap-3">
        <MenuButton />
        <h1 className="flex-1 font-display font-bold text-[17px] tracking-tight">{doc.title}</h1>
        <Link href="/gallery" aria-label={t('legal.back')} className="w-9 h-9 rounded-full flex items-center justify-center text-ink-2 hover:bg-bg">
          <ChevronLeft size={18} />
        </Link>
      </header>
      <article className="px-5 py-5 max-w-prose mx-auto">
        <p className="text-[11px] text-ink-3">{t('legal.updated')}: {doc.updated}</p>
        <p className="text-[13px] text-ink-2 leading-relaxed mt-3">{doc.intro}</p>
        {doc.sections.map(s => (
          <section key={s.h} className="mt-6">
            <h2 className="font-display font-bold text-[14px] text-ink">{s.h}</h2>
            {s.p.map((para, i) => (
              <p key={i} className="text-[13px] text-ink-2 leading-relaxed mt-2">{para}</p>
            ))}
          </section>
        ))}
      </article>
    </main>
  )
}
