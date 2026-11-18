import type { Mural } from '@/types/mural'

const SMALL = new Set(['de', 'del', 'la', 'las', 'el', 'los', 'y', 'en', 'of', 'the', 'on', 'at', 'in', 'and', 'a'])

/** Display-only title case for titles typed all in lower case ("Viva playa del carmen" → "Viva Playa del Carmen").
 *  Titles that already have capitals inside (e.g. "Día de Muertos (school wall)") are left alone. */
export function displayTitle(title: string | null | undefined): string {
  const t = (title ?? '').trim()
  if (!t || /[A-ZÁÉÍÓÚÑ]/.test(t.slice(1))) return t
  return t.split(' ').map((w, i) => {
    if (!w || (i > 0 && SMALL.has(w.toLowerCase()))) return w
    return w.charAt(0).toUpperCase() + w.slice(1)
  }).join(' ')
}

/** Artist line for cards: names without a leading @ (the handle is only the Instagram link target), no duplicates. */
export function displayArtist(m: Pick<Mural, 'artist' | 'artists'>): string {
  const names = (m.artists?.length ? m.artists.map(a => a.name) : [m.artist ?? ''])
    .map(n => (n ?? '').trim().replace(/^@/, ''))
    .filter(Boolean)
  const seen = new Set<string>()
  return names.filter(n => { const k = n.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true }).join(', ')
}

/** Raw coordinates must never reach the screen: "Pinned location (20.65037, -87.05495)" counts as no description. */
const COORDS = /\(?-?\d{1,3}\.\d{3,}\s*,\s*-?\d{1,3}\.\d{3,}\)?/

/** A human-readable place, or '' when we only have coordinates. */
export function displayPlace(m: Pick<Mural, 'location_description'>): string {
  const d = (m.location_description ?? '').trim()
  if (!d || /^pinned location/i.test(d) || COORDS.test(d)) return ''
  return d
}

/** Walking speed used for estimates everywhere: 80 m/min (about 4.8 km/h). */
export const WALK_M_PER_MIN = 80
export const walkMinutes = (metres: number) => Math.max(1, Math.round(metres / WALK_M_PER_MIN))
