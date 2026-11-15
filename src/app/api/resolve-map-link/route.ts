import { NextResponse } from 'next/server'
import { parseMapCoords } from '@/lib/geo'

export const runtime = 'nodejs'

// Only ever follow redirects between these map hosts (prevents the endpoint being used as an open proxy).
const ALLOWED = new Set([
  'maps.app.goo.gl', 'goo.gl', 'www.google.com', 'google.com', 'maps.google.com',
  'www.google.com.mx', 'maps.apple.com', 'maps.apple',
])

// Best-effort per-instance limit: 20 lookups / 10 min / IP (the database enforces the real limits on what gets saved).
const hits = new Map<string, number[]>()
function limited(ip: string) {
  const now = Date.now()
  const recent = (hits.get(ip) ?? []).filter(t => now - t < 10 * 60_000)
  recent.push(now); hits.set(ip, recent)
  if (hits.size > 5000) hits.clear()
  return recent.length > 20
}

const hostOk = (u: URL) => u.protocol === 'https:' && ALLOWED.has(u.hostname)

export async function POST(req: Request) {
  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'unknown'
  if (limited(ip)) return NextResponse.json({ error: 'Too many requests. Please wait a few minutes.' }, { status: 429 })
  let input = ''
  try { input = String((await req.json()).url ?? '').trim() } catch { /* handled below */ }
  if (!input || input.length > 2000) return NextResponse.json({ error: 'Paste a map link.' }, { status: 400 })

  // Plain coordinates or a full link that already contains them — no network needed.
  const direct = parseMapCoords(input)
  if (direct) return NextResponse.json({ coordinates: direct })

  let url: URL
  try { url = new URL(input) } catch { return NextResponse.json({ error: 'That doesn’t look like a link.' }, { status: 400 }) }
  if (!hostOk(url)) return NextResponse.json({ error: 'Please paste a Google Maps or Apple Maps link.' }, { status: 400 })

  for (let i = 0; i < 5; i++) {
    let res: Response
    try {
      res = await fetch(url, { redirect: 'manual', headers: { 'user-agent': 'Mozilla/5.0 (compatible; MuralesPDC/1.0)' }, signal: AbortSignal.timeout(6000) })
    } catch {
      return NextResponse.json({ error: 'Couldn’t open that link. Try sharing the pin again.' }, { status: 502 })
    }
    const loc = res.headers.get('location')
    if (!loc) break
    let next: URL
    try { next = new URL(loc, url) } catch { break }
    const found = parseMapCoords(next.toString())
    if (found) return NextResponse.json({ coordinates: found })
    if (!hostOk(next)) break
    url = next
  }
  return NextResponse.json({ error: 'No exact pin found in that link. Long-press the spot in your map app and share that pin.' }, { status: 422 })
}
