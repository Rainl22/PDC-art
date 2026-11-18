import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Syne, DM_Sans } from 'next/font/google'
import { LocaleProvider } from '@/lib/i18n/client'
import { ServiceWorkerRegister } from '@/components/layout/ServiceWorkerRegister'
import { getLocale } from '@/lib/i18n/server'

// Fonts are downloaded at build time and served from our own domain (no request to Google, no layout jump).
const syne = Syne({ subsets: ['latin'], weight: ['400', '600', '700', '800'], display: 'swap', variable: '--font-syne' })
const dmSans = DM_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700'], display: 'swap', variable: '--font-dm-sans' })

export const metadata: Metadata = {
  metadataBase: new URL('https://www.murles-pdc.art'),
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
    type: 'website', siteName: 'Murales PDC', locale: 'en_US', alternateLocale: ['es_MX'],
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'Murales PDC: the street art of Playa del Carmen' }],
  },
  twitter: { card: 'summary_large_image', title: 'Murales PDC', description: 'Street art map of Playa del Carmen', images: ['/og.png'] },
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
    <html lang={locale} className={`${syne.variable} ${dmSans.variable}`}>
      <body><LocaleProvider initial={locale}>{children}</LocaleProvider>
        <ServiceWorkerRegister /></body>
    </html>
  )
}
