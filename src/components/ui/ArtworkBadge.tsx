'use client'
import { Paintbrush } from 'lucide-react'
import type { Mural } from '@/types/mural'
import { useT } from '@/lib/i18n/client'
import { Tag } from './Tag'

/** Shown when the location is the same but the painting itself has been replaced. */
export function ArtworkBadge({ mural, sm }: { mural: Pick<Mural, 'artwork_status'>; sm?: boolean }) {
  const { t } = useT()
  if (mural.artwork_status !== 'changed') return null
  return <Tag tone="likely" size={sm ? 'sm' : 'md'} icon={<Paintbrush size={sm ? 7 : 9} className="shrink-0" />}>{t('artwork.changed')}</Tag>
}
