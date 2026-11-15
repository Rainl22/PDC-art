'use client'
import { Paintbrush } from 'lucide-react'
import type { Mural } from '@/types/mural'
import { useT } from '@/lib/i18n/client'

/** Shown when the location is the same but the painting itself has been replaced. */
export function ArtworkBadge({ mural, sm }: { mural: Pick<Mural, 'artwork_status'>; sm?: boolean }) {
  const { t } = useT()
  if (mural.artwork_status !== 'changed') return null
  const size = sm ? 'text-[9px] px-1.5 py-0.5' : 'text-[10px] px-2 py-0.5'
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-display font-semibold tracking-wide uppercase bg-likely-bg text-likely ${size}`}>
      <Paintbrush size={sm ? 8 : 10} className="shrink-0" />
      {t('artwork.changed')}
    </span>
  )
}
