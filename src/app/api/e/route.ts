import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const NAMES = new Set(['page_view', 'explore_map_click', 'how_it_works_click', 'install_click', 'app_installed', 'tour_started', 'favourite_saved', 'map_pin_click', 'tour_stop_added', 'walk_started', 'tour_shared'])
const BOTS = /bot|crawl|spider|slurp|preview|headless|lighthouse|facebookexternalhit|whatsapp|pingdom|monitor/i
const done = () => new NextResponse(null, { status: 204 })

function parseUA(ua: string) {
  const device = /ipad|tablet|android(?!.*mobile)/i.test(ua) ? 'tablet' : /mobi|iphone|ipod|android/i.test(ua) ? 'mobile' : 'desktop'
  const os = /iphone|ipad|ipod/i.test(ua) ? 'iOS' : /android/i.test(ua) ? 'Android' : /windows/i.test(ua) ? 'Windows' : /mac os x|macintosh/i.test(ua) ? 'macOS' : /linux|cros/i.test(ua) ? 'Linux' : 'other'
  const browser = /instagram/i.test(ua) ? 'Instagram app' : /fban|fbav/i.test(ua) ? 'Facebook app'
    : /edg\//i.test(ua) ? 'Edge' : /opr\/|opera/i.test(ua) ? 'Opera' : /samsungbrowser/i.test(ua) ? 'Samsung'
    : /chrome|crios/i.test(ua) ? 'Chrome' : /firefox|fxios/i.test(ua) ? 'Firefox' : /safari/i.test(ua) ? 'Safari' : 'other'
  return { device, os, browser }
}

/** Receives anonymous usage events. Country comes from Vercel's edge header; the IP address is never read or stored. */
export async function POST(req: NextRequest) {
  const ua = req.headers.get('user-agent') ?? ''
  if (!ua || BOTS.test(ua)) return done()
  let b: { v?: unknown; name?: unknown; path?: unknown; source?: unknown; mural?: unknown }
  try { b = await req.json() } catch { return done() }

  const v = typeof b.v === 'string' && /^[A-Za-z0-9_-]{8,64}$/.test(b.v) ? b.v : null
  const name = typeof b.name === 'string' && NAMES.has(b.name) ? b.name : null
  if (!v || !name) return done()
  const path = typeof b.path === 'string' && b.path.startsWith('/') && !b.path.startsWith('/admin') ? b.path.split(/[?#]/)[0].slice(0, 200) : null
  const source = typeof b.source === 'string' && /^[a-z0-9._-]{1,60}$/.test(b.source) ? b.source : 'direct'
  const mural = typeof b.mural === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(b.mural) ? b.mural.toLowerCase() : null
  const c = (req.headers.get('x-vercel-ip-country') ?? '').toUpperCase()
  const country = /^[A-Z]{2}$/.test(c) ? c : null

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } })
  await supabase.from('events').insert({ visitor_id: v, name, path, source, mural_id: mural, country, ...parseUA(ua) })
  return done()
}
