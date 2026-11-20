// Canonical origin for absolute URLs (sitemap, canonicals, JSON-LD, share images).
// Override with NEXT_PUBLIC_SITE_URL in Vercel if the primary domain ever changes again.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.murales-pdc.art').replace(/\/$/, '')

export const SITE_NAME = 'Murales PDC'

export function absoluteUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path
  return `${SITE_URL}${path.startsWith('/') ? '' : '/'}${path}`
}
