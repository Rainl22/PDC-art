import type { Metadata, Viewport } from 'next'
import './globals.css'
import { LocaleProvider } from '@/lib/i18n/client'
import { getLocale } from '@/lib/i18n/server'

export const metadata: Metadata = {
  title: 'Murales PDC',
  description: 'Discover the street art of Playa del Carmen — maps, tours, and community verified murals.',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Murales PDC' },
  openGraph: {
    title: 'Murales PDC',
    description: 'Street art map of Playa del Carmen',
    type: 'website',
  },
}

export const viewport: Viewport = {
  themeColor: '#326A82',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = getLocale()
  return (
    <html lang={locale}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap" rel="stylesheet" />
      </head>
      <body><LocaleProvider initial={locale}>{children}</LocaleProvider></body>
    </html>
  )
}
