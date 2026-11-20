/* eslint-disable @next/next/no-img-element */
import type { Metadata } from 'next'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import Link from 'next/link'
import { Logo } from '@/components/brand/Logo'
import { Tag } from '@/components/ui/Tag'

// Static page: built once, no database, no sign-in.
export const dynamic = 'force-static'

const TITLE = 'Murales PDC design system: tokens, colour, type and components'
const DESC = 'The design system behind Murales PDC, a free street art map of Playa del Carmen: colour and status tokens, typography, spacing, photo map pins and components, all meeting WCAG AA.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: '/design-system' },
  openGraph: { title: TITLE, description: DESC, url: '/design-system', siteName: 'Murales PDC', type: 'article',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'Murales PDC design system' }] },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESC, images: ['/og.png'] },
}

/** Set once the case study is live, then the page links back to it. */
const CASE_STUDY_URL: string | null = null

// ---- read the real tokens (src/styles/tokens.css is the single source of truth) -------------------
const css = readFileSync(join(process.cwd(), 'src/styles/tokens.css'), 'utf8')
const root = css.slice(css.indexOf(':root'), css.indexOf('}', css.indexOf(':root')))
const HEX: Record<string, string> = {}
for (const m of Array.from(root.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})/g))) HEX[m[1]] = m[2].toUpperCase()

function lum(hex: string) {
  const c = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
}
function ratio(a: string, b: string) {
  const [x, y] = [lum(HEX[a]), lum(HEX[b])].sort((p, q) => q - p)
  return (x + 0.05) / (y + 0.05)
}

const NEUTRALS = [
  ['bg', 'Page background. Warm cream.'], ['surface', 'Cards and sheets.'], ['groove', 'Borders, dividers.'],
  ['ink', 'Primary text.'], ['ink-2', 'Secondary text.'], ['ink-3', 'Tertiary text, placeholders.'],
]
const BRAND = [
  ['sea', 'Primary brand colour, buttons.'], ['sea-dark', 'Pressed and hover.'], ['sea-tint', 'Light brand backgrounds.'],
  ['marigold', 'Tour badge and tour tray only.'], ['marigold-tint', 'Tour backgrounds.'], ['you', '"You are here" dot.'],
]
const STATUS = [
  ['certain', 'certain-bg', 'Verified', 'Confirmed on site.'],
  ['unconfirmed', 'unconfirmed-bg', 'Unconfirmed', 'Also used for Changed.'],
  ['removed', 'removed-bg', 'Removed', 'Wall painted over. Kept as a record.'],
  ['danger', 'danger-bg', 'Error', 'Errors and delete actions only.'],
]
const PAIRS: [string, string, string][] = [
  ['ink', 'bg', 'Body text on page'], ['ink-2', 'bg', 'Secondary text on page'], ['ink-3', 'bg', 'Tertiary text on page'],
  ['ink-3', 'surface', 'Tertiary text on cards'], ['surface', 'sea', 'White on sea (buttons)'], ['sea', 'sea-tint', 'Sea on sea tint'],
  ['certain', 'certain-bg', 'Verified tag'], ['unconfirmed', 'unconfirmed-bg', 'Unconfirmed tag'],
  ['removed', 'removed-bg', 'Removed tag'], ['danger', 'danger-bg', 'Error tag'], ['ink', 'marigold', 'Ink on marigold'],
]
HEX.surface = HEX.surface ?? '#FFFFFF'

const TYPE = [
  ['40', 'fs-40', 'Display', 'Syne 800', 'Landing hero only'],
  ['28', 'fs-28', 'Screen title (h1)', 'Syne 800', 'One per screen'],
  ['20', 'fs-20', 'Sheet title (h2)', 'Syne 700', 'Display font stops at 20px and up'],
  ['16', 'fs-16', 'Body, inputs, card titles', 'DM Sans 400 / 600', '16px stops iOS zooming into inputs'],
  ['14', 'fs-14', 'Secondary text, buttons', 'DM Sans 500 / 600', ''],
  ['13', 'fs-13', 'Captions, meta', 'DM Sans 400', ''],
  ['12', 'fs-12', 'Tags, tab labels', 'DM Sans 600', 'Absolute minimum. Nothing is smaller.'],
]
const RADII = [['r-inset', '8px', 'Thumbnails, small chips'], ['r-panel', '16px', 'Card photos, inputs, panels'], ['r-card', '24px', 'Pin card, tour list'], ['r-sheet', '32px', 'White sheet on the mural page'], ['full', '9999px', 'Pills, round buttons']]
const SPACE = [['space-gutter', '16px', 'Screen edge'], ['space-grid', '12px', 'Between gallery cards'], ['space-row', '20px', 'Between gallery rows'], ['control-h', '44px', 'Minimum hit area for any control'], ['field-h', '48px', 'Buttons, inputs, search']]

const NAV = [['principles', 'Principles'], ['colour', 'Colour'], ['status', 'Status'], ['contrast', 'Contrast'], ['type', 'Type'], ['shape', 'Shape and space'], ['pins', 'Map pins'], ['components', 'Components'], ['access', 'Accessibility']]

function Section({ id, title, lead, children }: { id: string; title: string; lead?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 mt-16">
      <h2 className="font-display font-bold text-20 text-ink">{title}</h2>
      {lead && <p className="mt-2 text-16 text-ink-2 max-w-[60ch]">{lead}</p>}
      <div className="mt-6">{children}</div>
    </section>
  )
}

function Swatch({ name, note }: { name: string; note: string }) {
  const hex = HEX[name]
  return (
    <div className="bg-surface rounded-panel shadow-1 overflow-hidden">
      <div className="h-16 border-b border-groove" style={{ background: `var(--${name})` }} />
      <div className="p-3">
        <p className="text-14 font-semibold text-ink">{name}</p>
        <p className="text-13 text-ink-2">{hex}</p>
        <p className="text-13 text-ink-2 mt-1">{note}</p>
      </div>
    </div>
  )
}

function Pin({ photo, ring, size = 40, label }: { photo: string; ring: string; size?: number; label: string }) {
  return (
    <figure className="flex flex-col items-center gap-2 m-0">
      <span className="flex items-center justify-center" style={{ width: 44, height: 44 }}>
        <img src={photo} alt="" width={size} height={size}
          style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', border: `${ring === 'var(--sea)' ? 4 : 3}px solid ${ring}`, boxSizing: 'border-box', boxShadow: 'var(--shadow-2)' }} />
      </span>
      <figcaption className="text-13 text-ink-2 text-center">{label}</figcaption>
    </figure>
  )
}

export default function DesignSystemPage() {
  return (
    <div className="min-h-dvh">
      <header className="border-b border-groove bg-surface">
        <div className="mx-auto max-w-[1040px] px-gutter h-[4.5rem] flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3 font-display font-bold text-20 text-ink"><Logo size={36} />Murales PDC</Link>
          <nav aria-label="App" className="flex items-center gap-4 text-14 font-semibold">
            <Link href="/gallery" className="text-sea min-h-control inline-flex items-center">Gallery</Link>
            <Link href="/map" className="text-sea min-h-control inline-flex items-center">Map</Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-[1040px] px-gutter pb-24">
        <div className="pt-12">
          <p className="text-13 font-semibold text-sea uppercase tracking-wide">Design system</p>
          <h1 className="font-display font-extrabold text-28 sm:text-40 text-ink mt-2">The design system behind Murales PDC</h1>
          <p className="mt-4 text-16 text-ink-2 max-w-[62ch]">
            Murales PDC is a free, mobile-first street art map of Playa del Carmen, Mexico, in English and Spanish. This is the system that keeps it consistent:
            one set of tokens for colour, type, radius and spacing, reused across the gallery, the map, the mural page, tours and the volunteer team area.
            Every text colour pair meets WCAG AA. {CASE_STUDY_URL && <>Read the <a className="text-sea underline" href={CASE_STUDY_URL}>case study</a>.</>}
          </p>
          <nav aria-label="On this page" className="mt-8 flex flex-wrap gap-2">
            {NAV.map(([id, label]) => (
              <a key={id} href={`#${id}`} className="min-h-control inline-flex items-center rounded-full bg-surface border border-groove px-4 text-14 font-semibold text-ink">{label}</a>
            ))}
          </nav>
        </div>

        <Section id="principles" title="Principles" lead="Five rules that decide the small things.">
          <ol className="grid gap-4 sm:grid-cols-2">
            {[
              ['Be honest about uncertainty', 'A map of temporary art is always partly wrong. Every mural shows how sure we are (status), how exact the pin is (precision) and what has changed (history). Unconfirmed is a normal state, not an error.'],
              ['Let the art lead', 'The interface stays quiet (warm cream, sea blue, white cards) so the murals provide the colour. Photos fill the frame, and every photo sits next to the artist’s name.'],
              ['Make contributing lighter than consuming', 'No account, one photo, location filled in automatically. Reporting takes one tap. Changing the record needs proof on site.'],
              ['Design for the street', '44px tap targets, a 12px type floor, AA contrast in bright sun, light thumbnails on mobile data.'],
              ['Build systems, not screens', 'One Tag, one Card, one pin, one token file, reused across gallery, map, mural page, tour and admin.'],
            ].map(([h, p], i) => (
              <li key={h} className="bg-surface rounded-panel shadow-1 p-5">
                <p className="text-13 font-semibold text-sea">{i + 1}</p>
                <h3 className="font-display font-bold text-20 text-ink mt-1">{h}</h3>
                <p className="text-14 text-ink-2 mt-2">{p}</p>
              </li>
            ))}
          </ol>
        </Section>

        <Section id="colour" title="Colour" lead="Cream and sea blue lead. The mural photos supply the rest. Tokens live in one file, and these values are read from it when the page is built.">
          <h3 className="text-14 font-semibold text-ink mb-3">Neutrals</h3>
          <div className="grid gap-grid grid-cols-2 sm:grid-cols-3">{NEUTRALS.map(([n, d]) => <Swatch key={n} name={n} note={d} />)}</div>
          <h3 className="text-14 font-semibold text-ink mt-8 mb-3">Brand and accents</h3>
          <div className="grid gap-grid grid-cols-2 sm:grid-cols-3">{BRAND.map(([n, d]) => <Swatch key={n} name={n} note={d} />)}</div>
        </Section>

        <Section id="status" title="Status" lead="Status never relies on colour alone: each state also has its own dot shape, so it works in bright sun and for colour-blind users. Red is for errors only.">
          <div className="grid gap-grid sm:grid-cols-2">
            {STATUS.map(([fg, bg, name, note]) => (
              <div key={name} className="bg-surface rounded-panel shadow-1 p-4 flex items-center gap-4">
                <div className="w-14 h-14 rounded-inset shrink-0" style={{ background: `var(--${bg})`, border: `3px solid var(--${fg})` }} />
                <div>
                  <p className="text-14 font-semibold text-ink">{name}</p>
                  <p className="text-13 text-ink-2">{HEX[fg]} on {HEX[bg]}</p>
                  <p className="text-13 text-ink-2">{note}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 bg-surface rounded-panel shadow-1 p-5">
            <p className="text-14 font-semibold text-ink mb-3">The one Tag component</p>
            <div className="flex flex-wrap gap-3">
              <Tag tone="certain" dot="filled">Verified</Tag>
              <Tag tone="unconfirmed" dot="dashed">Unverified</Tag>
              <Tag tone="unconfirmed" dot="ring">Changed</Tag>
              <Tag tone="removed" dot="x">Removed</Tag>
              <Tag tone="danger">Error</Tag>
              <Tag tone="sea">Place</Tag>
              <Tag tone="neutral">Rotating wall</Tag>
            </div>
            <p className="text-13 text-ink-2 mt-3">DM Sans 600, 12px, pill. Filled dot: verified. Dashed ring: unverified. Ring: changed. Cross: removed.</p>
          </div>
        </Section>

        <Section id="contrast" title="Contrast" lead="Every text pair meets WCAG AA (4.5:1). The lightest grey went from 2.4:1 to 4.7:1. Ratios below are calculated from the live tokens.">
          <div className="bg-surface rounded-panel shadow-1 overflow-x-auto">
            <table className="w-full text-14">
              <thead><tr className="text-left text-13 text-ink-2 border-b border-groove"><th className="p-3 font-semibold">Pair</th><th className="p-3 font-semibold">Example</th><th className="p-3 font-semibold">Ratio</th><th className="p-3 font-semibold">AA</th></tr></thead>
              <tbody>
                {PAIRS.map(([fg, bg, label]) => {
                  const r = ratio(fg, bg)
                  return (
                    <tr key={label} className="border-b border-groove last:border-0">
                      <td className="p-3 text-ink">{label}<br /><span className="text-13 text-ink-2">{HEX[fg]} on {HEX[bg]}</span></td>
                      <td className="p-3"><span className="inline-block rounded-inset px-3 py-1 font-semibold" style={{ color: `var(--${fg})`, background: `var(--${bg})`, border: '1px solid var(--groove)' }}>Aa</span></td>
                      <td className="p-3 font-semibold text-ink">{r.toFixed(2)}:1</td>
                      <td className="p-3 font-semibold" style={{ color: r >= 4.5 ? 'var(--certain)' : 'var(--danger)' }}>{r >= 4.5 ? 'Pass' : 'Fail'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Section>

        <Section id="type" title="Type" lead="Two fonts, self-hosted. Syne for display at 20px and up, DM Sans for everything else. Nothing is under 12px.">
          <div className="bg-surface rounded-panel shadow-1 divide-y divide-groove">
            {TYPE.map(([px, tok, role, font, note]) => (
              <div key={px} className="p-4 grid gap-1 sm:grid-cols-[7rem_1fr_14rem] sm:items-baseline">
                <p className="text-13 text-ink-2">{px}px · --{tok}</p>
                <p className={px >= '20' ? 'font-display text-ink' : 'text-ink'} style={{ fontSize: `var(--${tok})`, fontWeight: px === '40' || px === '28' ? 800 : px === '20' ? 700 : 600, lineHeight: 1.2 }}>{role}</p>
                <p className="text-13 text-ink-2">{font}{note ? ` · ${note}` : ''}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section id="shape" title="Shape and space" lead="A 4px grid. Radius and spacing have roles, so components use names like panel and card instead of raw numbers.">
          <div className="grid gap-grid sm:grid-cols-2">
            <div className="bg-surface rounded-panel shadow-1 p-5">
              <p className="text-14 font-semibold text-ink mb-4">Radius</p>
              <div className="space-y-3">
                {RADII.map(([t, v, use]) => (
                  <div key={t} className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-sea-tint border-2 border-sea shrink-0" style={{ borderRadius: t === 'full' ? '9999px' : `var(--${t})` }} />
                    <div><p className="text-14 font-semibold text-ink">{t} · {v}</p><p className="text-13 text-ink-2">{use}</p></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-surface rounded-panel shadow-1 p-5">
              <p className="text-14 font-semibold text-ink mb-4">Spacing and sizes</p>
              <div className="space-y-3">
                {SPACE.map(([t, v, use]) => (
                  <div key={t} className="flex items-center gap-4">
                    <div className="h-4 bg-sea rounded-full shrink-0" style={{ width: v }} />
                    <div><p className="text-14 font-semibold text-ink">{t} · {v}</p><p className="text-13 text-ink-2">{use}</p></div>
                  </div>
                ))}
              </div>
              <p className="text-14 font-semibold text-ink mt-6 mb-3">Elevation</p>
              <div className="flex gap-4">
                <div className="flex-1 h-16 rounded-panel bg-surface flex items-center justify-center text-13 text-ink-2" style={{ boxShadow: 'var(--shadow-1)' }}>shadow-1 · surfaces</div>
                <div className="flex-1 h-16 rounded-panel bg-surface flex items-center justify-center text-13 text-ink-2" style={{ boxShadow: 'var(--shadow-2)' }}>shadow-2 · floating</div>
              </div>
            </div>
          </div>
        </Section>

        <Section id="pins" title="Map pins" lead="Pins are 40px photo discs inside a 44px tap area. A solid ring carries the status. Pins that are too close are grouped into a count. There is no legend: the colour and shape rules above are the legend.">
          <div className="bg-surface rounded-panel shadow-1 p-6">
            <div className="flex flex-wrap gap-x-10 gap-y-6">
              <Pin photo="/design-system/giant-sea-turtles.jpg" ring="var(--certain)" label="Verified" />
              <Pin photo="/design-system/frida-khalo.jpg" ring="var(--unconfirmed)" label="Unconfirmed" />
              <Pin photo="/design-system/mayan-woman.jpg" ring="var(--sea)" size={40} label="Selected" />
              <figure className="flex flex-col items-center gap-2 m-0">
                <span className="flex items-center justify-center" style={{ width: 44, height: 44 }}>
                  <span className="flex items-center justify-center bg-ink text-on-dark font-semibold text-16 rounded-full" style={{ width: 40, height: 40, boxShadow: 'var(--shadow-2)' }}>3</span>
                </span>
                <figcaption className="text-13 text-ink-2">Group</figcaption>
              </figure>
              <figure className="flex flex-col items-center gap-2 m-0">
                <span className="flex items-center justify-center" style={{ width: 44, height: 44 }}>
                  <span className="rounded-full" style={{ width: 20, height: 20, background: 'var(--you)', border: '3px solid var(--on-dark)', boxShadow: 'var(--shadow-2)' }} />
                </span>
                <figcaption className="text-13 text-ink-2">You are here</figcaption>
              </figure>
            </div>
            <p className="text-13 text-ink-2 mt-5">Murals shown: Senkoe, Theanunaki and @peokmancilla. Credit the artist next to every photo.</p>
          </div>
        </Section>

        <Section id="components" title="Components" lead="Reused across gallery, map, mural page, tour and the team area.">
          <div className="grid gap-grid sm:grid-cols-2">
            <div className="bg-surface rounded-panel shadow-1 p-5">
              <p className="text-14 font-semibold text-ink mb-4">Buttons (48px, pill)</p>
              <div className="flex flex-col gap-3">
                <span className="h-field rounded-full bg-sea text-on-dark flex items-center justify-center text-14 font-semibold">Take me there</span>
                <span className="min-h-field rounded-full border border-sea text-sea flex items-center justify-center text-14 font-semibold">Update this mural</span>
                <span className="h-field rounded-full flex items-center justify-center text-14 font-semibold" style={{ background: 'var(--marigold)', color: 'var(--ink)' }}>Create tour</span>
              </div>
              <p className="text-13 text-ink-2 mt-3">Sea for the main action, outline for secondary, marigold for tours only.</p>
            </div>
            <div className="bg-surface rounded-panel shadow-1 p-5">
              <p className="text-14 font-semibold text-ink mb-4">Mural card (4:5 photo, text below)</p>
              <div className="max-w-[220px]">
                <div className="relative aspect-[4/5] overflow-hidden rounded-panel bg-groove">
                  <img src="/design-system/frida-khalo.jpg" alt="" className="absolute inset-0 w-full h-full object-cover" />
                  <div aria-hidden className="absolute inset-0 mix-blend-soft-light" style={{ background: 'var(--image-tint)', opacity: 'var(--image-tint-opacity)' }} />
                  <div className="absolute top-2 left-2"><Tag tone="unconfirmed">Unverified</Tag></div>
                </div>
                <div className="mt-3 px-0.5 space-y-0.5">
                  <p className="text-16 font-semibold text-ink leading-tight">Frida</p>
                  <p className="text-14 font-medium text-sea">Theanunaki</p>
                  <p className="text-13 text-ink-2">Centro · 350 m</p>
                </div>
              </div>
              <p className="text-13 text-ink-2 mt-3">A warm soft-light tint makes photos shot in different light feel like one set. Only murals that are not verified carry a tag.</p>
            </div>
          </div>
        </Section>

        <Section id="access" title="Accessibility" lead="Built for someone standing in the street: one-handed, in bright sun, on mobile data.">
          <ul className="grid gap-grid sm:grid-cols-2">
            {[
              ['AA contrast', 'Every text pair is at least 4.5:1. The lightest grey was 2.4:1 and is now 4.7:1.'],
              ['44px tap targets', 'Every control has at least a 44px hit area. Primary buttons and inputs are 48px.'],
              ['12px type floor', 'Nothing is smaller than 12px. Inputs are 16px so iOS does not zoom.'],
              ['Not colour alone', 'Status uses a shape cue (filled, dashed, ring, cross) as well as colour.'],
              ['Keyboard focus', 'A 3px sea outline with a 3px offset on every focusable element.'],
              ['Reduced motion', 'Animations and press effects are switched off when the device asks for it.'],
              ['Light on data', '600px thumbnails (about 50 KB instead of about 500 KB) and self-hosted fonts.'],
              ['Two languages', 'English and Spanish, switched with one toggle.'],
            ].map(([h, p]) => (
              <li key={h} className="bg-surface rounded-panel shadow-1 p-4">
                <p className="text-14 font-semibold text-ink">{h}</p>
                <p className="text-14 text-ink-2 mt-1">{p}</p>
              </li>
            ))}
          </ul>
        </Section>

        <footer className="mt-20 pt-6 border-t border-groove text-13 text-ink-2">
          Murales PDC is free, with no ads. Murals belong to their artists.{' '}
          <Link href="/" className="text-sea underline">Open the app</Link>
        </footer>
      </main>
    </div>
  )
}
