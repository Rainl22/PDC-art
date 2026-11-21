import Link from 'next/link'
import { requireAdmin } from '@/lib/auth/requireAdmin'

type Row = Record<string, string | number>
type Stats = {
  days: number; visitors: number; returning: number; pageviews: number
  by_day: { day: string; visitors: number }[]
  by_source: { source: string; visitors: number; explored: number; tours: number; favourites: number; installs: number }[]
  by_country: { country: string; visitors: number }[]
  by_device: { device: string; visitors: number }[]
  by_os: { os: string; visitors: number }[]
  by_page: { path: string; views: number; visitors: number }[]
  by_mural: { path: string; opened: number; visitors: number; pins: number; directions: number }[]
  actions: { name: string; events: number; visitors: number }[]
}

const RANGES = [{ d: 1, label: 'Today' }, { d: 7, label: '7 days' }, { d: 30, label: '30 days' }]
const ACTION_LABEL: Record<string, string> = {
  explore_map_click: 'Tapped “Explore the map”', how_it_works_click: 'Tapped “See how it works”', install_click: 'Tapped “Install the app”',
  app_installed: 'Installed the app', map_pin_tapped: 'Tapped a map pin', directions_tapped: 'Tapped “Take me there” / Google Maps', tour_started: 'Started a tour', favourite_saved: 'Saved a favourite',
}
const SOURCE_LABEL: Record<string, string> = { whatsapp: 'WhatsApp', instagram: 'Instagram', facebook: 'Facebook', google: 'Google', x: 'X / Twitter', 'old-link': 'Old link (murles…)', direct: 'Direct / unknown' }
const regions = new Intl.DisplayNames(['en'], { type: 'region' })
const country = (c: string) => { try { return c === '??' ? 'Unknown' : regions.of(c) ?? c } catch { return c } }
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

function Card({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="bg-surface rounded-sheet p-4">
      <h2 className="font-bold text-16">{title}</h2>
      {note && <p className="text-13 text-ink-2 mt-0.5">{note}</p>}
      <div className="mt-3">{children}</div>
    </section>
  )
}

/** A label, a bar scaled to the biggest value in the list, and the number. */
function Bars({ rows, label, value, max }: { rows: Row[]; label: (r: Row) => string; value: string; max?: number }) {
  if (!rows.length) return <p className="text-13 text-ink-2">Nothing yet.</p>
  const top = max ?? Math.max(...rows.map(r => Number(r[value])), 1)
  return (
    <ul className="space-y-2">
      {rows.map((r, i) => (
        <li key={i} className="text-14">
          <div className="flex justify-between gap-3"><span className="truncate">{label(r)}</span><span className="font-semibold tabular-nums">{r[value]}</span></div>
          <div className="h-1.5 rounded-full bg-groove mt-1"><div className="h-1.5 rounded-full bg-sea" style={{ width: `${Math.max(3, (Number(r[value]) / top) * 100)}%` }} /></div>
        </li>
      ))}
    </ul>
  )
}

export default async function StatsPage({ searchParams }: { searchParams: { days?: string } }) {
  const { supabase } = await requireAdmin()
  const days = [1, 7, 30].includes(Number(searchParams.days)) ? Number(searchParams.days) : 7
  const { data, error } = await supabase.rpc('stats_summary', { p_days: days })
  const s = data as Stats | null

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h1 className="font-bold text-16 flex-1">Visitors</h1>
        {RANGES.map(r => (
          <Link key={r.d} href={`/admin/stats?days=${r.d}`} className={`px-3 py-1 rounded-full text-13 font-semibold ${r.d === days ? 'bg-ink text-surface' : 'bg-groove text-ink-2'}`}>{r.label}</Link>
        ))}
      </div>

      {error || !s ? (
        <p className="bg-surface rounded-sheet p-4 text-14 text-danger">Could not load stats{error ? `: ${error.message}` : ''}.</p>
      ) : s.visitors === 0 ? (
        <Card title="No visits recorded yet">
          <p className="text-14 text-ink-2">Counting starts once this version is live. Open the site in a private tab to test. To keep your own phone out of the numbers, open <b>/?notrack=1</b> on it once.</p>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
            {[{ n: s.visitors, l: 'Visitors' }, { n: s.returning, l: 'Came back' }, { n: s.pageviews, l: 'Page views' }].map(k => (
              <div key={k.l} className="bg-surface rounded-sheet p-4"><p className="font-bold text-28 leading-none">{k.n}</p><p className="text-13 text-ink-2 mt-1">{k.l}</p></div>
            ))}
          </div>

          <Card title="Where they came from" note="Visitors per source and what they did. “Explored” = opened the gallery or map.">
            <div className="overflow-x-auto -mx-1">
              <table className="w-full text-14 min-w-[420px]">
                <thead><tr className="text-13 text-ink-2 text-left"><th className="font-medium px-1 pb-2">Source</th><th className="font-medium px-1 pb-2 text-right">Visitors</th><th className="font-medium px-1 pb-2 text-right">Explored</th><th className="font-medium px-1 pb-2 text-right">Tours</th><th className="font-medium px-1 pb-2 text-right">Saved</th><th className="font-medium px-1 pb-2 text-right">Installs</th></tr></thead>
                <tbody>
                  {s.by_source.map(r => (
                    <tr key={r.source} className="border-t border-groove">
                      <td className="px-1 py-2">{SOURCE_LABEL[r.source] ?? cap(r.source)}</td>
                      {[r.visitors, r.explored, r.tours, r.favourites, r.installs].map((n, i) => <td key={i} className="px-1 py-2 text-right tabular-nums">{n}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card title="What they did" note="Visitors who did each action (a visitor is one device).">
            <Bars rows={s.actions as unknown as Row[]} label={r => ACTION_LABEL[r.name as string] ?? String(r.name)} value="visitors" max={s.visitors} />
          </Card>

          <Card title="Murals people looked at" note="Page opens, map-pin taps and “Take me there” taps per mural.">
            {s.by_mural?.length ? (
              <table className="w-full text-14">
                <thead><tr className="text-13 text-ink-2 text-left"><th className="font-medium px-1 pb-2">Mural</th><th className="font-medium px-1 pb-2 text-right">Opened</th><th className="font-medium px-1 pb-2 text-right">Pins</th><th className="font-medium px-1 pb-2 text-right">Directions</th></tr></thead>
                <tbody>
                  {s.by_mural.map(r => (
                    <tr key={r.path} className="border-t border-groove">
                      <td className="px-1 py-2 truncate max-w-[10rem]">{r.path.replace('/gallery/', '')}</td>
                      {[r.opened, r.pins, r.directions].map((n, i) => <td key={i} className="px-1 py-2 text-right tabular-nums">{n}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <p className="text-13 text-ink-2">Nothing yet.</p>}
          </Card>

          <Card title="Countries"><Bars rows={s.by_country as unknown as Row[]} label={r => country(r.country as string)} value="visitors" max={s.visitors} /></Card>
          <div className="grid sm:grid-cols-2 gap-3">
            <Card title="Devices"><Bars rows={s.by_device as unknown as Row[]} label={r => cap(String(r.device))} value="visitors" max={s.visitors} /></Card>
            <Card title="Systems"><Bars rows={s.by_os as unknown as Row[]} label={r => String(r.os)} value="visitors" max={s.visitors} /></Card>
          </div>
          <Card title="Top pages" note="Page views. Mural pages are listed by their address.">
            <Bars rows={s.by_page as unknown as Row[]} label={r => String(r.path)} value="views" />
          </Card>
          {days > 1 && s.by_day.length > 0 && (
            <Card title="Visitors per day">
              <Bars rows={s.by_day as unknown as Row[]} label={r => new Date(r.day + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })} value="visitors" />
            </Card>
          )}
          <p className="text-13 text-ink-3 px-1">Counted by device, not by person, and without IP addresses. Anyone with tracking blocked isn’t counted. Times are Playa del Carmen time.</p>
        </>
      )}
    </div>
  )
}
