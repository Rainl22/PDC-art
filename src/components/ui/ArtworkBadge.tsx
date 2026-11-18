'use client'
import { Paintbrush } from 'lucide-react'
import type { Mural } from '@/types/mural'
import { useT } from '@/lib/i18n/client'
import { Tag } from './Tag'

/** Shown when the location is the same but the painting itself has been replaced. */
export function ArtworkBadge({ mural }: { mural: Pick<Mural, 'artwork_status'> }) {
  const { t } = useT()
  if (mural.artwork_status !== 'changed') return null
  return <Tag tone="unconfirmed" icon={<Paintbrush size={11} className="shrink-0" />}>{t('artwork.changed')}</Tag>
}
