import type { Key } from '@/lib/i18n/dict'

/** Where a mural is: shown as a tag on the mural page. Add a type here, in the DB check constraint and in the i18n dictionary. */
export const PLACE_TYPES = ['restaurant', 'bar', 'school', 'dive_shop', 'hotel', 'gym'] as const
export type PlaceType = (typeof PLACE_TYPES)[number]

export const PLACE_LABEL: Record<PlaceType, Key> = {
  restaurant: 'place.restaurant',
  bar: 'place.bar',
  school: 'place.school',
  dive_shop: 'place.dive_shop',
  hotel: 'place.hotel',
  gym: 'place.gym',
}
