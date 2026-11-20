import type { Metadata } from 'next'

// The tour page is a client component, so its metadata lives in this layout.
export const metadata: Metadata = {
  title: 'Mural walking tour · Murales PDC',
  description:
    'Build a self-guided street art walking tour of Playa del Carmen: pick your favourite murals, get them in walking order with time estimates, and start the route in Google Maps. Recorrido de murales de Playa del Carmen.',
  alternates: { canonical: '/tour' },
}

export default function TourLayout({ children }: { children: React.ReactNode }) {
  return children
}
