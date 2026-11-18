'use client'
import type { Mural } from '@/types/mural'
import { useT } from '@/lib/i18n/client'
import { isLocationUnknown, isLocationUnconfirmed } from '@/lib/location'
import { MapPinOff, MapPin } from 'lucide-react'
import { Tag } from './Tag'

export function LocationPill({ mural }: { mural: Pick<Mural, 'precision' | 'coordinates'> }) {
  const { t } = useT()
  const unknown = isLocationUnknown(mural)
  if (!unknown && !isLocationUnconfirmed(mural)) return null
  const Icon = unknown ? MapPinOff : MapPin
  return (
    <Tag tone={unknown ? 'danger' : 'unconfirmed'} icon={<Icon size={11} className="shrink-0" />}>
      {unknown ? t('loc.unknown') : t('loc.unconfirmed')}
    </Tag>
  )
}
