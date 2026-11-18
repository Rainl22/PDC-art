'use client'
import { ThumbImg } from '@/components/ui/ThumbImg'
import Link from 'next/link'
import { useT } from '@/lib/i18n/client'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getMuralGradient } from '@/lib/gradients'

export interface PagerMural { slug: string; title: string; cover_photo: string | null }

function PagerCard({ mural, dir }: { mural: PagerMural; dir: 'prev' | 'next' }) {
  const Icon = dir === 'prev' ? ChevronLeft : ChevronRight
  const { t } = useT()
  return (
    <Link href={`/gallery/${mural.slug}`}
      className={`flex-1 min-w-0 bg-bg rounded-panel overflow-hidden flex flex-col ${dir === 'next' ? 'text-right' : ''}`}>
      <div className="aspect-[4/3] relative overflow-hidden shrink-0">
        {mural.cover_photo
          // eslint-disable-next-line @next/next/no-img-element
          ? <ThumbImg src={mural.cover_photo} alt="" className="absolute inset-0 w-full h-full object-cover" />
          : <div className="absolute inset-0" style={{ background: getMuralGradient(mural.slug) }} />}
      </div>
      <div className="p-2.5">
        <p className={`flex items-center gap-1 text-12 font-semibold text-ink-2 ${dir === 'next' ? 'justify-end' : ''}`}>
          {dir === 'prev' && <Icon size={11} />}
          {dir === 'prev' ? t('pager.previous') : t('pager.next')}
          {dir === 'next' && <Icon size={11} />}
        </p>
        <p className="text-14 font-medium text-ink leading-snug line-clamp-2 mt-0.5">{mural.title}</p>
      </div>
    </Link>
  )
}

export function MuralPager({ prev, next }: { prev: PagerMural | null; next: PagerMural | null }) {
  const { t } = useT()
  if (!prev && !next) return null
  return (
    <nav aria-label={t('pager.more')} className="flex gap-2.5">
      {prev ? <PagerCard mural={prev} dir="prev" /> : <div className="flex-1" />}
      {next ? <PagerCard mural={next} dir="next" /> : <div className="flex-1" />}
    </nav>
  )
}
