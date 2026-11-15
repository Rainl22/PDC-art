import type { Mural } from '@/types/mural'
import { MapPinOff, MapPin } from 'lucide-react'

type Loc = Pick<Mural, 'precision' | 'coordinates'>

/** We have *some* position: coordinates, or a precision better than "lead". */
export const hasLocation = (m: Loc) =>
  !!m.coordinates || (!!m.precision && m.precision !== 'lead')

/** Position exists but still needs checking on site. */
export const isLocationUnconfirmed = (m: Loc) => hasLocation(m) && m.precision === 'lead'

/** No usable position at all. */
export const isLocationUnknown = (m: Loc) => !hasLocation(m)

export function LocationPill({ mural, sm }: { mural: Loc; sm?: boolean }) {
  const unknown = isLocationUnknown(mural)
  if (!unknown && !isLocationUnconfirmed(mural)) return null
  const size = sm ? 'text-[9px] px-1.5 py-0.5' : 'text-[10px] px-2 py-0.5'
  const Icon = unknown ? MapPinOff : MapPin
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-display font-semibold tracking-wide uppercase ${unknown ? 'bg-guessing-bg text-guessing' : 'bg-likely-bg text-likely'} ${size}`}>
      <Icon size={sm ? 9 : 10} className="shrink-0" />
      {unknown ? 'Location unknown' : 'Location unconfirmed'}
    </span>
  )
}
