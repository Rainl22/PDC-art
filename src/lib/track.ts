import { track as vercelTrack } from '@vercel/analytics'

/** The only events we record. Names only: no free text, no personal data. */
export type EventName =
  | 'page_view'
  | 'explore_map_click'   // landing: "Explore the map"
  | 'how_it_works_click'  // landing: "See how it works"
  | 'install_click'       // landing or side menu: tapped "Install the app"
  | 'app_installed'       // browser confirmed the install
  | 'tour_started'        // first stop added to an empty tour
  | 'favourite_saved'     // heart tapped on (not off)
  | 'map_pin_tapped'      // a mural pin/card opened on the map (path = that mural's page)
  | 'directions_tapped'   // "Take me there" / "Open in Google Maps" tapped (path = that mural's page, or /tour)

const VID_KEY = 'pdc.vid'       // random device id (localStorage). Not tied to a person.
const SRC_KEY = 'pdc.src'       // where this visit came from (sessionStorage)
const OFF_KEY = 'pdc.notrack'   // set by opening /?notrack=1 on a device you don't want counted (e.g. the owner's phone)

/** Short links used in WhatsApp stories / Instagram. They show the landing page (see next.config.mjs). */
const SHORT_LINKS: Record<string, string> = { '/wa': 'whatsapp', '/ig': 'instagram' }

function enabled(): boolean {
  if (typeof window === 'undefined' || process.env.NODE_ENV !== 'production') return false
  if (location.pathname.startsWith('/admin')) return false
  try { return localStorage.getItem(OFF_KEY) !== '1' } catch { return true }
}

function visitorId(): string {
  try {
    let id = localStorage.getItem(VID_KEY)
    if (!id) {
      id = (crypto.randomUUID?.() ?? `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`)
      localStorage.setItem(VID_KEY, id)
    }
    return id
  } catch { return 'no-storage-' + Math.random().toString(36).slice(2, 10) }
}

const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9._-]/g, '').slice(0, 60)

function referrerSource(): string | null {
  try {
    if (!document.referrer) return null
    const host = new URL(document.referrer).hostname.replace(/^www\./, '')
    if (host === location.hostname.replace(/^www\./, '')) return null
    if (/instagram/.test(host)) return 'instagram'
    if (/facebook|fb\.com|fb\.me|messenger/.test(host)) return 'facebook'
    if (/whatsapp|wa\.me/.test(host)) return 'whatsapp'
    if (/google\./.test(host)) return 'google'
    if (/^(t\.co|twitter\.com|x\.com)$/.test(host)) return 'x'
    return clean(host) || null
  } catch { return null }
}

/** Run once per page load, before the first page view: handles ?notrack and works out where the visit came from. */
export function initTracking(): void {
  if (typeof window === 'undefined') return
  try {
    const q = new URLSearchParams(location.search)
    if (q.get('notrack') === '1') localStorage.setItem(OFF_KEY, '1')
    if (q.get('notrack') === '0') localStorage.removeItem(OFF_KEY)
    const found = SHORT_LINKS[location.pathname] ?? (q.get('utm_source') ? clean(q.get('utm_source')!) : null) ?? referrerSource()
    if (found) sessionStorage.setItem(SRC_KEY, found)
  } catch { /* storage blocked: source stays "direct" */ }
}

function currentSource(): string {
  try { return sessionStorage.getItem(SRC_KEY) || 'direct' } catch { return 'direct' }
}

/** The short links count as the landing page. Query strings are never sent. */
function normalisePath(p: string): string {
  const path = p.split(/[?#]/)[0] || '/'
  return SHORT_LINKS[path] ? '/' : path
}

function send(name: EventName, path?: string): void {
  if (!enabled()) return
  const body = JSON.stringify({ v: visitorId(), name, path: normalisePath(path ?? location.pathname), source: currentSource() })
  try { if (navigator.sendBeacon?.('/api/e', new Blob([body], { type: 'application/json' }))) return } catch { /* fall through */ }
  try { fetch('/api/e', { method: 'POST', body, keepalive: true, headers: { 'content-type': 'application/json' } }).catch(() => {}) } catch { /* ignore */ }
}

export function trackPageView(): void { send('page_view') }

/** `path` says which mural an action was about, e.g. `/gallery/some-slug`; it defaults to the current page.
 *  Fire-and-forget. Never throws, so analytics can't break the app (blocked scripts, private mode, SSR).
 *  Goes to our own database (admin → Stats) and to Vercel (custom events there need the Pro plan). */
export function track(name: Exclude<EventName, 'page_view'>, path?: string): void {
  try { vercelTrack(name) } catch { /* ignore */ }
  send(name, path)
}
