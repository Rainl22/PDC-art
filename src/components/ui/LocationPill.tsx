'use client'
import type { Mural } from '@/types/mural'
import { useT } from '@/lib/i18n/client'
import { isLocationUnknown, isLocationUnconfirmed } from '@/lib/location'
import { MapPinOff, MapPin } from 'lucide-react'

export function LocationPill({ mural, sm }: { mural: Pick<Mural, 'precision' | 'coordinates'>; sm?: boolean }) {
  const { t } = useT()
  const unknown = isLocationUnknown(mural)
  if (!unknown && !isLocationUnconfirmed(mural)) return null
  const size = sm ? 'text-tag px-1.5 py-0.5' : 'text-caption px-2 py-0.5'
  const Icon = unknown ? MapPinOff : MapPin
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-display font-semibold tracking-wide uppercase ${unknown ? 'bg-guessing-bg text-guessing' : 'bg-likely-bg text-likely'} ${size}`}>
      <Icon size={sm ? 9 : 10} className="shrink-0" />
      {unknown ? t('loc.unknown') : t('loc.unconfirmed')}
    </span>
  )
}
