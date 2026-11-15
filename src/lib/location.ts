import type { Mural } from '@/types/mural'

type Loc = Pick<Mural, 'precision' | 'coordinates'>

/** We have *some* position: coordinates, or a precision better than "lead". */
export const hasLocation = (m: Loc) =>
  !!m.coordinates || (!!m.precision && m.precision !== 'lead')

/** Position exists but still needs checking on site. */
export const isLocationUnconfirmed = (m: Loc) => hasLocation(m) && m.precision === 'lead'

/** No usable position at all. */
export const isLocationUnknown = (m: Loc) => !hasLocation(m)
