/* eslint-disable @next/next/no-img-element */
import type { Metadata } from 'next'
import './landing.css'

export const metadata: Metadata = {
  title: 'Murales PDC: the street art of Playa del Carmen',
  description: 'A free app to explore the murals of Playa del Carmen, learn about the artists, build mural tours and add the ones you find.',
}

export default function Landing() {
  return (
    <div className="lp">
<div className="wrap">
  <nav>
    <a className="brand" href="#top"><img src="/site/logo.png" alt="" width="38" height="38" />Murales PDC</a>
    <div className="nav-links">
      <a href="#features">What it does</a>
      <a href="#gallery">Murals</a>
      <a href="#contribute">Contribute</a>
      <a className="btn" href="/gallery">Open the app</a>
    </div>
  </nav>

  <header className="hero" id="top">
    <div>
      <span className="eyebrow">Street art of Playa del Carmen</span>
      <h1>Walk the <em>murals</em> of PDC.</h1>
      <p className="lede">A free app to find the city&apos;s street art, meet the artists, build your own mural tour, and add the walls you discover.</p>
      <div className="cta-row">
        <a className="btn" href="/gallery">Open the app</a>
        <a className="btn ghost" href="#features">See how it works</a>
      </div>
      <ul className="facts"><li>Free</li><li>No ads</li><li>No sign-up to explore</li><li>English + Español</li></ul>
    </div>
    <div className="collage" aria-label="Murals from Playa del Carmen">
      <div className="p p1"><img src="/site/the-gym-mural.jpg" alt="Jaguar mural in orange, red and blue" width="675" height="900" /><span className="credit">Senkoe</span></div>
      <div className="p p2"><img src="/site/indian-woman.jpg" alt="Mural of a woman in a feathered headdress" width="675" height="900" style={{ objectPosition: '50% 30%' }} /><span className="credit">Senkoe</span></div>
      <div className="p p3"><img src="/site/frida-khalo.jpg" alt="Mural of Frida Kahlo with red flowers in her hair" width="675" height="900" /><span className="credit">Theanunaki</span></div>
      <div className="pin a"><i></i>Verified location</div>
      <div className="pin red b"><i></i>Help us verify</div>
    </div>
  </header>
</div>

<div className="wrap">
  <div className="strip" aria-hidden="true">
      <figure><img src="/site/dia-de-muertos-new.jpg" alt="Día de Muertos mural with a sculpted catrina among marigold-colored candles" width="900" height="979" loading="lazy" /><figcaption>Día de Muertos 2025<span>Pinta o Muere</span></figcaption></figure>
    <figure><img src="/site/giant-sea-turtles.jpg" alt="" loading="lazy" /></figure>
    <figure><img src="/site/old-mayan-woman.jpg" alt="" loading="lazy" /></figure>
    <figure><img src="/site/la-chica.jpg" alt="" loading="lazy" /></figure>
    <figure><img src="/site/calle-80.jpg" alt="" loading="lazy" /></figure>
    <figure><img src="/site/frida-khalo.jpg" alt="" loading="lazy" /></figure>
  </div>

  <section id="features">
    <div className="head">
      <span className="eyebrow">What it does</span>
      <h2>Everything you need to see the city&apos;s walls.</h2>
    </div>
    <div className="features">
      <article className="feat">
        <div className="ic"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg></div>
        <h3>Explore</h3>
        <p>Browse murals in a photo gallery or on a map. Sort by what&apos;s nearest to you, newest, or most liked.</p>
      </article>
      <article className="feat">
        <div className="ic"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/></svg></div>
        <h3>Meet the artists</h3>
        <p>See who painted each wall and follow them on Instagram. Every mural credits its artist.</p>
      </article>
      <article className="feat">
        <div className="ic"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="6" cy="19" r="2.5"/><circle cx="18" cy="5" r="2.5"/><path d="M8.5 19H15a3.5 3.5 0 0 0 0-7H9a3.5 3.5 0 0 1 0-7h6.5"/></svg></div>
        <h3>Build a tour</h3>
        <p>Pick the murals you like, get them in walking order with time estimates, and start in Google Maps.</p>
      </article>
      <article className="feat">
        <div className="ic"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 8a2 2 0 0 1 2-2h2l1.5-2h7L17 6h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/><circle cx="12" cy="13" r="3.5"/></svg></div>
        <h3>Add what you find</h3>
        <p>Spot a mural that isn&apos;t listed? Send a photo and a location. Update ones that were repainted or removed.</p>
      </article>
    </div>
  </section>

  <section>
    <div className="head">
      <span className="eyebrow">How a walk goes</span>
      <h2>From the couch to the sidewalk in three steps.</h2>
    </div>
    <div className="route">
      <div className="step"><b>Find</b><h3>Pick your murals</h3><p>Scroll the gallery or open the map. Tap a pin to see the photo, the artist and where it is.</p></div>
      <div className="step"><b>Walk</b><h3>Follow the route</h3><p>Add stops to a tour. The app orders them and opens walking directions in Google Maps.</p></div>
      <div className="step"><b>Share</b><h3>Fill in the map</h3><p>Like your favorites, confirm a location with your own photo, or add a wall nobody has listed yet.</p></div>
    </div>
  </section>

  <section id="gallery">
    <div className="head">
      <span className="eyebrow">In the app now</span>
      <h2>A few of the walls waiting for you.</h2>
      <p>Every photo here was added by people walking the city.</p>
    </div>
    <div className="wall">
      <figure><img src="/site/old-mayan-woman.jpg" alt="Portrait of an elderly Mayan woman" loading="lazy" /><figcaption>Old Mayan Woman<span>Pinta o Muere</span></figcaption></figure>
      <figure><img src="/site/viva-playa-del-carmen.jpg" alt="Wide mural with a catrina and a graffiti centerpiece" loading="lazy" /><figcaption>Viva Playa del Carmen<span>Kin kab pinturas</span></figcaption></figure>
      <figure><img src="/site/la-chica.jpg" alt="Teal mural of a figure with flowers for a head" loading="lazy" /><figcaption>La Chica<span>Senkoe</span></figcaption></figure>
      <figure><img src="/site/white-skull-marigolds.jpg" alt="White skull and marigolds mural" loading="lazy" /><figcaption>White Skull and Marigolds<span>Artist unknown</span></figcaption></figure>
      <figure><img src="/site/dia-de-muertos-2025.jpg" alt="Día de Muertos mural with a catrina" loading="lazy" /><figcaption>Día de Muertos 2025<span>Pinta o Muere</span></figcaption></figure>
      <figure><img src="/site/mayan-woman.jpg" alt="Woman with ram horns mural" loading="lazy" /><figcaption>Mayan Woman<span>@peokmancilla</span></figcaption></figure>
      <figure><img src="/site/giant-sea-turtles.jpg" alt="Giant sea turtle on a teal wall" loading="lazy" /><figcaption>Giant Sea Turtles<span>Senkoe</span></figcaption></figure>
      <figure><img src="/site/gober-restaurant.jpg" alt="Mural on a beachside restaurant" loading="lazy" /><figcaption>Gober restaurant<span>Theanunaki</span></figcaption></figure>
      <figure><img src="/site/crocodile-lilies.jpg" alt="Crocodile rising out of the water beside lily pads" width="900" height="1200" loading="lazy" /><figcaption>Crocodile and lilies<span>@imer_hu</span></figcaption></figure>
      <figure><img src="/site/skull-warrior.jpg" alt="Skeletal warrior in a jade headdress with feathers" width="900" height="1200" loading="lazy" /><figcaption>Jade skull warrior<span>Artist unknown</span></figcaption></figure>
      <figure><img src="/site/catrina-altar.jpg" alt="Catrina lighting a candle at an altar" width="900" height="1200" loading="lazy" /><figcaption>Catrina at the altar<span>Hoacko</span></figcaption></figure>
      <figure><img src="/site/sea-turtle-blue.jpg" alt="Colorful sea turtle on a blue wall" width="813" height="1100" loading="lazy" /><figcaption>Sea turtle on blue<span>Artist unknown</span></figcaption></figure>
    </div>
  </section>

  <section id="contribute" style={{ paddingTop: 0 }}>
    <div className="contribute">
      <div>
        <span className="eyebrow" style={{ color: 'inherit', opacity: 0.8 }}>Community map</span>
        <h2 style={{ marginTop: 14 }}>Know a mural we&apos;re missing?</h2>
        <p>The map grows when people add to it. Send a photo and a location, and the team checks it before it goes live.</p>
        <a className="btn" href="/gallery">Add a mural</a>
      </div>
      <ul className="how-add">
        <li>Take a photo of the wall</li>
        <li>Share the location or let your phone find it</li>
        <li>Name the artist if you know them</li>
        <li>We review it, then it appears on the map</li>
      </ul>
    </div>
  </section>

  <footer>
    <a className="brand" href="#top"><img src="/site/logo.png" alt="" width="38" height="38" />Murales PDC</a>
    <div>Free, no ads. Made for the people of Playa del Carmen and everyone who visits. Murals belong to their artists.</div>
    <div className="cols"><a href="/gallery">Open the app</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a></div>
  </footer>
</div>
    </div>
  )
}
