import type { Coordinates } from '@/types/mural'

const PDC: Coordinates = { lat: 20.6296, lng: -87.0739 }

const valid = (lat: number, lng: number) =>
  Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 && !(lat === 0 && lng === 0)

/** Great-circle distance in km. */
export function distanceKm(a: Coordinates, b: Coordinates) {
  const r = (d: number) => (d * Math.PI) / 180
  const h = Math.sin(r(b.lat - a.lat) / 2) ** 2 +
    Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(r(b.lng - a.lng) / 2) ** 2
  return 12742 * Math.asin(Math.sqrt(h))
}

/** Is this roughly in the Playa del Carmen area (sanity check for pasted links / GPS)? */
export const isNearPlaya = (c: Coordinates) => distanceKm(c, PDC) <= 30

/**
 * Pull coordinates out of a Google Maps or Apple Maps URL.
 * Prefers the pinned place over the camera/viewport centre.
 */
export function parseMapCoords(raw: string): Coordinates | null {
  let s = raw.trim()
  try { s = decodeURIComponent(s) } catch { /* keep raw */ }
  const pairs: RegExp[] = [
    /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/,                               // Google place pin
    /\/maps\/place\/(-?\d+\.\d+),\s*(-?\d+\.\d+)/,                  // Google /place/lat,lng
    /[?&](?:ll|q|query|daddr|destination|coordinate|sll)=(-?\d+\.\d+)[,\s]+(-?\d+\.\d+)/, // Apple + Google params
    /@(-?\d+\.\d+),(-?\d+\.\d+)/,                                    // viewport centre (least precise)
    /^\s*(-?\d{1,2}\.\d+)\s*[,;\s]\s*(-?\d{1,3}\.\d+)\s*$/,          // plain "lat, lng"
  ]
  for (const re of pairs) {
    const m = s.match(re)
    if (m) {
      const lat = parseFloat(m[1]), lng = parseFloat(m[2])
      if (valid(lat, lng)) return { lat, lng }
    }
  }
  return null
}

/** Straight-line distance in metres between two points. */
export function metresBetween(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371000, rad = (d: number) => d * Math.PI / 180
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}
export const formatDistance = (m: number) => (m < 1000 ? `${Math.round(m / 10) * 10} m` : `${(m / 1000).toFixed(1)} km`)
