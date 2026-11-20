/** @type {import('next').NextConfig} */
const nextConfig = {
  // Short "source" links for sharing (WhatsApp status, Instagram bio). They show the normal landing page but keep their own
  // path in the address bar, so Vercel Analytics lists them as separate pages (e.g. /wa) and we can count who came from where.
  async rewrites() {
    return [
      { source: '/wa', destination: '/' },
      { source: '/ig', destination: '/' },
    ]
  },
  // The site moved to www.murales-pdc.art (2026-11-20). The old "murles" domains
  // and the vercel.app URL 308 to it so old links, QR codes and bookmarks keep working.
  // (Preview deployments have unique hostnames, so the exact-match vercel.app rule never hits them.)
  async redirects() {
    const to = 'https://www.murales-pdc.art/:path*'
    return [
      // the mural's slug was corrected in the database (2026-11-20)
      { source: '/gallery/frida-khalo', destination: '/gallery/frida-kahlo', permanent: true },
      { source: '/:path*', has: [{ type: 'host', value: 'www.murles-pdc.art' }], destination: to, permanent: true },
      { source: '/:path*', has: [{ type: 'host', value: 'murles-pdc.art' }], destination: to, permanent: true },
      { source: '/:path*', has: [{ type: 'host', value: 'pdc-art.vercel.app' }], destination: to, permanent: true },
    ]
  },
}

export default nextConfig
