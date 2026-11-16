'use client'
import { Building2, RefreshCw } from 'lucide-react'
import type { Mural } from '@/types/mural'
import { useT } from '@/lib/i18n/client'
import { PLACE_LABEL, type PlaceType } from '@/lib/places'
import { Tag } from './Tag'

/** Where the mural is (restaurant, school…) and whether the wall keeps changing. */
export function PlaceTags({ mural }: { mural: Pick<Mural, 'place_type' | 'changes_often'> }) {
  const { t } = useT()
  const place = mural.place_type && PLACE_LABEL[mural.place_type as PlaceType]
  return (
    <>
      {place && <Tag tone="sea" icon={<Building2 size={9} className="shrink-0" />}>{t(place)}</Tag>}
      {mural.changes_often && <Tag tone="neutral" icon={<RefreshCw size={9} className="shrink-0" />}>{t('tag.rotating')}</Tag>}
    </>
  )
}
