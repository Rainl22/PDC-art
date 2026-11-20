/* eslint-disable @next/next/no-img-element */
import type { Metadata } from 'next'
import './landing.css'
import { createClient } from '@/lib/supabase/server'
import { getLocale } from '@/lib/i18n/server'
import { displayArtist } from '@/lib/format'
import { LangToggle, InstallHint, TrackedLink } from '@/components/landing/LandingClient'
import { websiteJsonLd } from '@/lib/jsonld'

const TITLE = 'Murales PDC: the street art of Playa del Carmen'
const DESC = 'A free app to explore the murals of Playa del Carmen, learn about the artists, build mural tours and add the ones you find.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: '/' },
  openGraph: {
    title: TITLE, description: DESC, url: '/', siteName: 'Murales PDC', type: 'website',
    locale: 'en_US', alternateLocale: ['es_MX'],
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'Murales PDC: the street art of Playa del Carmen' }],
  },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESC, images: ['/og.png'] },
}

const COPY = {
  en: {
    what: 'What it does', murals: 'Murals', contribute: 'Contribute', open: 'Open the app',
    eyebrow: 'Street art of Playa del Carmen', h1a: 'Walk the ', h1b: 'murals', h1c: ' of Playa.',
    lede: 'Explore Playa del Carmen’s street art. Create a tour around your favourite murals and add new ones you find.',
    cta: 'Explore the map', how: 'See how it works', noSignup: 'No sign-up', howShort: 'How it works',
    credit: 'Senkoe', verified: 'Verified location', addNew: 'Add new murals',
    nMurals: 'murals', nArtists: 'artists', free: 'Free, no ads',
    installBtn: 'Install the app', installIos: 'On iPhone: tap Share, then Add to Home Screen.',
    qr: 'Open on your phone',
    featEyebrow: 'What it does', featH2: 'Everything you need to see the city’s walls.',
    f1h: 'Explore', f1p: 'Browse murals in a photo gallery or on a map. Sort by what’s nearest to you, newest, or most liked.',
    f2h: 'Meet the artists', f2p: 'See who painted the mural and follow them on Instagram.',
    f3h: 'Build a tour', f3p: 'Pick the murals you like, get them in walking order with time estimates, and start in Google Maps.',
    f4h: 'Add what you find', f4p: 'Spot a mural that isn’t listed? Send a photo and a location. Update ones that were repainted or removed.',
    scrEyebrow: 'See it in the app', scrH2: 'Your pocket guide to the Playa’s murals.',
    s1: 'Find', s1p: 'Pins show every mural. A green ring means the location is verified.',
    s2: 'Explore', s2p: 'Tap a pin to see the photos, the artist and how far it is.',
    s3: 'Wander', s3p: 'Stops in order, with walking time and distance. Start it in Google Maps.',
    galEyebrow: 'In the app now', galH2: 'A few of the walls waiting for you.', galP: 'Every photo here was added by people walking the city.',
    unknown: 'Artist unknown',
    conEyebrow: 'Community map', conH2: 'Know a mural we’re missing?', conP: 'The map grows when people add to it. Send a photo and a location, and the team checks it before it goes live.', add: 'Add a mural',
    h1l: 'Take a photo of the wall', h2l: 'Share the location or let your phone find it', h3l: 'Name the artist if you know them', h4l: 'We review it, then it appears on the map',
    foot: 'Free, no ads. Made for the people of Playa del Carmen and everyone who visits. Murals belong to their artists.', privacy: 'Privacy', terms: 'Terms',
  },
  es: {
    what: 'Qué hace', murals: 'Murales', contribute: 'Colabora', open: 'Abrir la app',
    eyebrow: 'Arte urbano de Playa del Carmen', h1a: 'Camina los ', h1b: 'murales', h1c: ' de Playa.',
    lede: 'Explora el arte urbano de Playa del Carmen. Crea un recorrido con tus murales favoritos y agrega los que encuentres.',
    cta: 'Explorar el mapa', how: 'Cómo funciona', noSignup: 'Sin registro', howShort: 'Cómo funciona',
    credit: 'Senkoe', verified: 'Ubicación verificada', addNew: 'Agrega murales nuevos',
    nMurals: 'murales', nArtists: 'artistas', free: 'Gratis, sin anuncios',
    installBtn: 'Instalar la app', installIos: 'En iPhone: toca Compartir y luego Añadir a pantalla de inicio.',
    qr: 'Ábrela en tu teléfono',
    featEyebrow: 'Qué hace', featH2: 'Todo lo que necesitas para ver los muros de la ciudad.',
    f1h: 'Explora', f1p: 'Mira los murales en una galería de fotos o en un mapa. Ordénalos por cercanía, novedad o los que más gustan.',
    f2h: 'Conoce a los artistas', f2p: 'Descubre quién pintó el mural y síguele en Instagram.',
    f3h: 'Arma un recorrido', f3p: 'Elige los murales que te gusten, recíbelos en orden de caminata con tiempos estimados y empieza en Google Maps.',
    f4h: 'Agrega lo que encuentres', f4p: '¿Viste un mural que no está? Envía una foto y la ubicación. Actualiza los que fueron repintados o quitados.',
    scrEyebrow: 'Mírala en la app', scrH2: 'Tu guía de bolsillo de los murales de Playa.',
    s1: 'Encuentra', s1p: 'Los puntos muestran cada mural. Un aro verde significa que la ubicación está verificada.',
    s2: 'Explora', s2p: 'Toca un punto para ver las fotos, el artista y qué tan lejos está.',
    s3: 'Recorre', s3p: 'Paradas en orden, con tiempo y distancia a pie. Empieza en Google Maps.',
    galEyebrow: 'Ya en la app', galH2: 'Algunos de los muros que te esperan.', galP: 'Cada foto la agregó gente que camina la ciudad.',
    unknown: 'Artista desconocido',
    conEyebrow: 'Mapa comunitario', conH2: '¿Conoces un mural que falta?', conP: 'El mapa crece cuando la gente lo completa. Envía una foto y la ubicación, y el equipo la revisa antes de publicarla.', add: 'Agregar un mural',
    h1l: 'Toma una foto del muro', h2l: 'Comparte la ubicación o deja que tu teléfono la encuentre', h3l: 'Nombra al artista si lo conoces', h4l: 'Lo revisamos y aparece en el mapa',
    foot: 'Gratis, sin anuncios. Hecha para la gente de Playa del Carmen y quienes la visitan. Los murales pertenecen a sus artistas.', privacy: 'Privacidad', terms: 'Términos',
  },
} as const

const WALL: { img: string; slug?: string; alt: string; title: string; artist: string | null; dims?: [number, number] }[] = [
  { img: 'old-mayan-woman', slug: 'old-mayan-woman', alt: 'Portrait of an elderly Mayan woman', title: 'Old Mayan Woman', artist: 'Pinta o Muere' },
  { img: 'viva-playa-del-carmen', slug: 'viva-playa-del-carmen', alt: 'Wide mural with a catrina and a graffiti centerpiece', title: 'Viva Playa del Carmen', artist: 'Kin kab pinturas' },
  { img: 'la-chica', slug: 'la-chica', alt: 'Teal mural of a figure with flowers for a head', title: 'La Chica', artist: 'Senkoe' },
  { img: 'white-skull-marigolds', slug: 'white-skull-marigolds', alt: 'White skull and marigolds mural', title: 'White Skull and Marigolds', artist: null },
  { img: 'dia-de-muertos-2025', slug: 'dia-de-muertos-2025', alt: 'Día de Muertos mural with a catrina', title: 'Día de Muertos 2026', artist: 'Pinta o Muere' },
  { img: 'mayan-woman', slug: 'mayan-woman', alt: 'Woman with ram horns mural', title: 'Mayan Woman', artist: '@peokmancilla' },
  { img: 'giant-sea-turtles', slug: 'giant-sea-turtles', alt: 'Giant sea turtle on a teal wall', title: 'Giant Sea Turtles', artist: 'Senkoe' },
  { img: 'gober-restaurant', slug: 'gober-restaurant', alt: 'Mural on a beachside restaurant', title: 'Gober Restaurant', artist: 'Theanunaki' },
  { img: 'crocodile-lilies', alt: 'Crocodile rising out of the water beside lily pads', title: 'Crocodile and lilies', artist: '@imer_hu', dims: [900, 1200] },
  { img: 'skull-warrior', alt: 'Skeletal warrior in a jade headdress with feathers', title: 'Jade skull warrior', artist: null, dims: [900, 1200] },
  { img: 'catrina-altar', alt: 'Catrina lighting a candle at an altar', title: 'Catrina at the altar', artist: 'Hoacko', dims: [900, 1200] },
  { img: 'sea-turtle-blue', alt: 'Colorful sea turtle on a blue wall', title: 'Sea turtle on blue', artist: null, dims: [813, 1100] },
]

const Icon = ({ children }: { children: React.ReactNode }) => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
)

/** Real numbers for the proof strip: published murals and distinct named artists. */
async function counts() {
  try {
    const { data } = await createClient().from('murals').select('artist,artists,confidence')
    const rows = (data ?? []).filter(m => m.confidence !== 'removed')
    const names = new Set<string>()
    for (const m of rows) {
      const list: string[] = Array.isArray(m.artists) && m.artists.length ? m.artists.map((a: { name?: string }) => a.name ?? '') : [m.artist ?? '']
      list.map(n => n.trim().replace(/^@/, '').toLowerCase()).filter(Boolean).forEach(n => names.add(n))
    }
    return { murals: rows.length, artists: names.size }
  } catch { return null }
}

/** Artist line for each mural in the "walls" strip, from the same data (and the same display rules) as the app. */
async function wallArtists(): Promise<Record<string, string>> {
  try {
    const { data } = await createClient().from('murals').select('slug,artist,artists').in('slug', WALL.flatMap(w => (w.slug ? [w.slug] : [])))
    return Object.fromEntries((data ?? []).map(m => [m.slug as string, displayArtist(m)]))
  } catch { return {} }
}

export default async function Landing() {
  const c = COPY[getLocale()]
  const [n, fromDb] = await Promise.all([counts(), wallArtists()])
  return (
    <div className="lp">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd()) }} />
<div className="wrap">
  <nav>
    <a className="brand" href="#top"><img src="/site/logo.png" alt="" width="38" height="38" />Murales PDC</a>
    <div className="nav-links">
      <a href="#features">{c.what}</a>
      <a href="#gallery">{c.murals}</a>
      <a href="#contribute">{c.contribute}</a>
      <LangToggle />
      <a className="btn" href="/gallery">{c.open}</a>
    </div>
  </nav>

  <header className="hero" id="top">
    {/* phone: a complete mural photo fills the top of the screen */}
    <div className="hero-photo">
      <img src="/site/giant-sea-turtles.jpg" alt="Giant sea turtle mural on a teal wall" width="675" height="900" fetchPriority="high" />
      <span className="credit">{c.credit}</span>
      <span className="pin a"><i></i>{c.verified}</span>
    </div>
    <div>
      <span className="eyebrow">{c.eyebrow}</span>
      <h1>{c.h1a}<em>{c.h1b}</em>{c.h1c}</h1>
      <p className="lede">{c.lede}</p>
      <div className="cta-row">
        <TrackedLink className="btn" href="/map" event="explore_map_click">{c.cta}</TrackedLink>
        <TrackedLink className="btn ghost" href="#features" event="how_it_works_click">{c.how}</TrackedLink>
        <figure className="qr">
          <img src="/site/qr-map.svg" alt="" width="88" height="88" />
          <figcaption>{c.qr}</figcaption>
        </figure>
      </div>
      <p className="subline">{c.noSignup} · <a href="#features">{c.howShort}</a></p>
      {n && (
        <ul className="proof" aria-label="Murales PDC in numbers">
          <li><b>{n.murals}</b>{c.nMurals}</li>
          <li><b>{n.artists}</b>{c.nArtists}</li>
          <li><b>{c.free.split(',')[0]}</b>{c.free.split(',')[1]?.trim()}</li>
        </ul>
      )}
      <InstallHint labels={{ button: c.installBtn, ios: c.installIos }} />
    </div>
    <div className="collage" aria-label="Murals from Playa del Carmen">
      <div className="p p1"><img src="/site/the-gym-mural.jpg" alt="Jaguar mural in orange, red and blue" width="675" height="900" /><span className="credit">Senkoe</span></div>
      <div className="p p2"><img src="/site/indian-woman.jpg" alt="Mural of a woman in a feathered headdress" width="675" height="900" style={{ objectPosition: '50% 30%' }} /><span className="credit">Senkoe</span></div>
      <div className="p p3"><img src="/site/frida-khalo.jpg" alt="Mural of Frida Kahlo with red flowers in her hair" width="675" height="900" /><span className="credit">Theanunaki</span></div>
      <div className="pin a"><i></i>{c.verified}</div>
      <div className="pin blue b"><i></i>{c.addNew}</div>
    </div>
  </header>
</div>

<div className="wrap">

  <section id="features">
    <div className="head">
      <span className="eyebrow">{c.featEyebrow}</span>
      <h2>{c.featH2}</h2>
    </div>
    <div className="features">
      <article className="feat">
        <div className="ic"><Icon><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></Icon></div>
        <h3>{c.f1h}</h3><p>{c.f1p}</p>
      </article>
      <article className="feat">
        <div className="ic"><Icon><circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/></Icon></div>
        <h3>{c.f2h}</h3><p>{c.f2p}</p>
      </article>
      <article className="feat">
        <div className="ic"><Icon><circle cx="6" cy="19" r="2.5"/><circle cx="18" cy="5" r="2.5"/><path d="M8.5 19H15a3.5 3.5 0 0 0 0-7H9a3.5 3.5 0 0 1 0-7h6.5"/></Icon></div>
        <h3>{c.f3h}</h3><p>{c.f3p}</p>
      </article>
      <article className="feat">
        <div className="ic"><Icon><path d="M3 8a2 2 0 0 1 2-2h2l1.5-2h7L17 6h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/><circle cx="12" cy="13" r="3.5"/></Icon></div>
        <h3>{c.f4h}</h3><p>{c.f4p}</p>
      </article>
    </div>
  </section>

  <section id="screens">
    <div className="head">
      <span className="eyebrow">{c.scrEyebrow}</span>
      <h2>{c.scrH2}</h2>
    </div>
    <div className="phones">
      <figure className="phone-fig">
        <div className="phone"><img src="/site/app-map.jpg" alt="Map of Playa del Carmen with mural pins" width="574" height="1276" loading="lazy" /></div>
        <figcaption><b>{c.s1}</b>{c.s1p}</figcaption>
      </figure>
      <figure className="phone-fig">
        <div className="phone"><img src="/site/app-mural.jpg" alt="Mural card on the map with photos, artist name and distance" width="584" height="1282" loading="lazy" /></div>
        <figcaption><b>{c.s2}</b>{c.s2p}</figcaption>
      </figure>
      <figure className="phone-fig">
        <div className="phone"><img src="/site/app-tour.jpg" alt="My tour screen with stops, walking times and a start button" width="571" height="1274" loading="lazy" /></div>
        <figcaption><b>{c.s3}</b>{c.s3p}</figcaption>
      </figure>
    </div>
  </section>

  <section id="gallery">
    <div className="head">
      <span className="eyebrow">{c.galEyebrow}</span>
      <h2>{c.galH2}</h2>
      <p>{c.galP}</p>
    </div>
    <div className="wall">
      {WALL.map(w => {
        const artist = (w.slug && w.slug in fromDb ? fromDb[w.slug] : (w.artist ?? '').replace(/^@/, '')) || null
        return (
        <figure key={w.img}>
          <div className="ph"><img src={`/site/${w.img}.jpg`} alt={w.alt} loading="lazy" /></div>
          <figcaption>{w.title}<span className={artist ? '' : 'unk'}>{artist ?? c.unknown}</span></figcaption>
        </figure>
        )
      })}
    </div>
  </section>

  <section id="contribute" style={{ paddingTop: 0 }}>
    <div className="contribute">
      <div>
        <span className="eyebrow" style={{ color: 'inherit', opacity: 0.8 }}>{c.conEyebrow}</span>
        <h2 style={{ marginTop: 14 }}>{c.conH2}</h2>
        <p>{c.conP}</p>
        <a className="btn" href="/submit">{c.add}</a>
      </div>
      <ul className="how-add">
        <li>{c.h1l}</li><li>{c.h2l}</li><li>{c.h3l}</li><li>{c.h4l}</li>
      </ul>
    </div>
  </section>

  <footer>
    <a className="brand" href="#top"><img src="/site/logo.png" alt="" width="38" height="38" />Murales PDC</a>
    <div>{c.foot}</div>
    <div className="cols"><a href="/gallery">{c.open}</a><a href="/privacy">{c.privacy}</a><a href="/terms">{c.terms}</a></div>
  </footer>
</div>
    </div>
  )
}
