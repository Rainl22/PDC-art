import type { Mural } from '@/types/mural'
import { SITE_URL, SITE_NAME, absoluteUrl } from '@/lib/site'
import { displayTitle, displayArtist, displayPlace } from '@/lib/format'

// schema.org JSON-LD builders. Rendered with <script type="application/ld+json">
// so Google rich results and AI crawlers get machine-readable facts.

export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        name: SITE_NAME,
        alternateName: 'Street art map of Playa del Carmen',
        url: `${SITE_URL}/`,
        inLanguage: ['en', 'es'],
      },
      {
        '@type': 'WebApplication',
        name: SITE_NAME,
        url: `${SITE_URL}/`,
        applicationCategory: 'TravelApplication',
        operatingSystem: 'Any',
        isAccessibleForFree: true,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        about: {
          '@type': 'Thing',
          name: 'Street art in Playa del Carmen, Quintana Roo, Mexico',
        },
      },
    ],
  }
}

export function muralJsonLd(m: Mural) {
  const title = displayTitle(m.title)
  const url = `${SITE_URL}/gallery/${m.slug}`
  const photos = [m.cover_photo, ...(m.photos ?? [])].filter((p): p is string => !!p)
  const images = Array.from(new Set(photos.map(absoluteUrl)))
  const place = displayPlace(m)

  const artists = (m.artists?.length ? m.artists : m.artist ? [{ name: m.artist }] : []).map(a => {
    const sameAs = [
      'instagram' in a && a.instagram ? `https://www.instagram.com/${a.instagram.replace(/^@/, '')}` : null,
      'url' in a ? (a.url ?? null) : null,
    ].filter(Boolean)
    return {
      '@type': 'Person',
      name: a.name.replace(/^@/, ''),
      ...(sameAs.length ? { sameAs } : {}),
    }
  })

  const artwork = {
    '@context': 'https://schema.org',
    // TouristAttraction is a Place, which legitimises geo + address on an artwork.
    '@type': ['VisualArtwork', 'TouristAttraction'],
    name: title,
    url,
    ...(images.length ? { image: images } : {}),
    ...(artists.length ? { creator: artists } : {}),
    ...(m.year ? { dateCreated: String(m.year) } : {}),
    artform: 'Mural',
    ...(m.medium ? { artMedium: m.medium } : {}),
    description:
      m.notes?.trim() ||
      `${title}: street mural in Playa del Carmen, Mexico${artists.length ? `, painted by ${displayArtist(m)}` : ''}${place ? `, located at ${place}` : ''}.`,
    isAccessibleForFree: true,
    publicAccess: true,
    address: {
      '@type': 'PostalAddress',
      ...(place ? { streetAddress: place } : {}),
      addressLocality: 'Playa del Carmen',
      addressRegion: 'Quintana Roo',
      addressCountry: 'MX',
    },
    ...(m.coordinates
      ? {
          geo: {
            '@type': 'GeoCoordinates',
            latitude: m.coordinates.lat,
            longitude: m.coordinates.lng,
          },
        }
      : {}),
  }

  const breadcrumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: SITE_NAME, item: `${SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name: 'Gallery', item: `${SITE_URL}/gallery` },
      { '@type': 'ListItem', position: 3, name: title, item: url },
    ],
  }

  return [artwork, breadcrumbs]
}
