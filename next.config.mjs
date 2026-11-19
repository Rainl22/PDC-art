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
}

export default nextConfig
