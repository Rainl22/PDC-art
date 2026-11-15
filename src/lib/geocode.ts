import type { Coordinates, PrecisionLabel } from '@/types/mural'

/** Turn a written address into approximate coordinates. Admin tool: results are suggestions to review, never saved silently. */
export interface GeoCandidate { label: string; coords: Coordinates; precision: PrecisionLabel; source: 'intersection' | 'address' }

const BBOX = { s: 20.58, w: -87.12, n: 20.68, e: -87.03 } // Playa del Carmen
const NOMINATIM = 'https://nominatim.openstreetmap.org/search'
const OVERPASS = 'https://overpass-api.de/api/interpreter'

interface Street { kind: 'calle' | 'avenida'; n: number }

/** "Calle 2 y Avenida 10", "Av 10 con Calle 20", "Calle 2 Norte at Avenida 10" → two streets. */
export function extractStreets(text: string): Street[] {
  const out: Street[] = []
  const re = /\b(calle|avenida|av\.?)\s*(\d{1,3})\b/gi
  for (const m of Array.from(text.matchAll(re))) {
    const s: Street = { kind: m[1].toLowerCase().startsWith('c') ? 'calle' : 'avenida', n: parseInt(m[2], 10) }
    if (!out.some(o => o.kind === s.kind && o.n === s.n)) out.push(s)
  }
  return out
}

/** Overpass regex for an OSM street name (avoids backslashes so it embeds safely in a query string). */
export function streetNameRegex(s: Street): string {
  if (s.kind === 'calle') return `(^|[ ])Calle[ ]+${s.n}([ ]|$)`
  const base = `(^|[ ])(Avenida|Av[.]?)[ ]+${s.n}([ ]|$)|(^|[ ])${s.n}[ ]*(Avenida|Av[.]?)([ ]|$)`
  return s.n === 5 ? `${base}|Quinta Avenida` : base
}

export function intersectionQuery(a: Street, b: Street): string {
  const box = `${BBOX.s},${BBOX.w},${BBOX.n},${BBOX.e}`
  return `[out:json][timeout:25];
way["highway"]["name"~"${streetNameRegex(a)}"](${box})->.a;
way["highway"]["name"~"${streetNameRegex(b)}"](${box})->.b;
node(w.a)(w.b);
out;`
}

/** Strip the filler we write for unknown places so the geocoder isn't confused by it. */
export function cleanAddress(text: string): string {
  return text
    .replace(/[—–-]\s*(exact )?location (unconfirmed|unknown).*$/i, '')
    .replace(/exact location unconfirmed/i, '')
    .replace(/\(.*?\)/g, ' ')
    .replace(/\s+/g, ' ').trim()
}
/** Too vague to geocode: empty, "Unknown…", or flagged unconfirmed with no street to go on. */
export const looksUnknown = (text: string) =>
  !cleanAddress(text) || /^(unknown|location (unconfirmed|unknown))/i.test(cleanAddress(text)) ||
  (/unconfirmed|unknown/i.test(text) && extractStreets(text).length === 0)

async function intersection(a: Street, b: Street, signal?: AbortSignal): Promise<GeoCandidate | null> {
  const res = await fetch(OVERPASS, { method: 'POST', body: 'data=' + encodeURIComponent(intersectionQuery(a, b)), signal,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' } })
  if (!res.ok) return null
  const json = await res.json() as { elements?: { lat: number; lon: number }[] }
  const nodes = (json.elements ?? []).filter(n => Number.isFinite(n.lat) && Number.isFinite(n.lon))
  if (nodes.length === 0) return null
  // a street pair can share a few nodes (dual carriageways): take the centre
  const lat = nodes.reduce((s, n) => s + n.lat, 0) / nodes.length, lng = nodes.reduce((s, n) => s + n.lon, 0) / nodes.length
  const name = (s: Street) => `${s.kind === 'calle' ? 'Calle' : 'Avenida'} ${s.n}`
  return { label: `Corner of ${name(a)} and ${name(b)}`, coords: { lat: +lat.toFixed(6), lng: +lng.toFixed(6) }, precision: 'intersection', source: 'intersection' }
}

async function nominatim(text: string, signal?: AbortSignal): Promise<GeoCandidate[]> {
  const q = `${cleanAddress(text)}, Playa del Carmen, Quintana Roo, Mexico`
  const url = `${NOMINATIM}?format=jsonv2&limit=3&bounded=1&viewbox=${BBOX.w},${BBOX.n},${BBOX.e},${BBOX.s}&q=${encodeURIComponent(q)}`
  const res = await fetch(url, { signal, headers: { Accept: 'application/json' } })
  if (!res.ok) return []
  const rows = await res.json() as { lat: string; lon: string; display_name: string; addresstype?: string }[]
  return rows.filter(r => Number.isFinite(+r.lat) && Number.isFinite(+r.lon)).map(r => ({
    label: r.display_name.split(',').slice(0, 3).join(','),
    coords: { lat: +(+r.lat).toFixed(6), lng: +(+r.lon).toFixed(6) },
    // street-level matches are approximate; only a named place/building is closer to a landmark
    precision: (['building', 'amenity', 'shop', 'tourism', 'place'].includes(r.addresstype ?? '') ? 'landmark' : 'block') as PrecisionLabel,
    source: 'address' as const,
  }))
}

export async function geocodeAddress(text: string, signal?: AbortSignal): Promise<GeoCandidate[]> {
  if (looksUnknown(text)) return []
  const out: GeoCandidate[] = []
  const streets = extractStreets(text)
  // only a Calle and an Avenida can cross (two Calles run parallel)
  const cross = streets.find(a => a.kind === 'calle') && streets.find(a => a.kind === 'avenida')
  if (cross) {
    try { const c = await intersection(streets.find(a => a.kind === 'calle')!, streets.find(a => a.kind === 'avenida')!, signal); if (c) out.push(c) } catch { /* fall through to the address search */ }
  }
  try { out.push(...await nominatim(text, signal)) } catch { /* no results */ }
  return out
}
