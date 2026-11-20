import type { Metadata } from 'next'

// The map page is a client component, so its metadata lives in this layout.
export const metadata: Metadata = {
  title: 'Street art map of Playa del Carmen · Murales PDC',
  description:
    'Interactive map of the street murals of Playa del Carmen, Mexico. Every pin is a mural with photos and artist info; green rings are community-verified locations. Mapa del arte urbano de Playa del Carmen.',
  alternates: { canonical: '/map' },
}

export default function MapLayout({ children }: { children: React.ReactNode }) {
  return children
}
