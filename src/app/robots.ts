import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

// One rule for every crawler, AI crawlers included (GPTBot, ClaudeBot,
// PerplexityBot, Google-Extended all obey "*"): being readable by them is how
// the site gets cited in AI answers. Only private/user surfaces are excluded.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api/', '/auth/', '/profile', '/signin'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
