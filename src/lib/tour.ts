const KEY = 'murales-pdc-tour'

export function getTourIds(): string[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]')
  } catch {
    return []
  }
}

export function saveTourIds(ids: string[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(ids))
  } catch {}
}

export function clearTour(): void {
  try {
    localStorage.removeItem(KEY)
  } catch {}
}

/** Google Maps accepts an origin + destination + up to 9 waypoints. */
export const MAX_ROUTE_STOPS = 11

export function buildGoogleMapsUrl(
  stops: { lat: number; lng: number }[]
): string | null {
  if (stops.length < 2) return null
  stops = stops.slice(0, MAX_ROUTE_STOPS)
  const origin = `${stops[0].lat},${stops[0].lng}`
  const dest   = `${stops[stops.length - 1].lat},${stops[stops.length - 1].lng}`
  const wps    = stops.slice(1, -1).map(s => `${s.lat},${s.lng}`).join('|')
  const base   = 'https://www.google.com/maps/dir/?api=1'
  const params = `&origin=${origin}&destination=${dest}${wps ? `&waypoints=${wps}` : ''}&travelmode=walking`
  return base + params
}
