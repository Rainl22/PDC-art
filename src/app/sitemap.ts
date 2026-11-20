import type { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'
import { SITE_URL } from '@/lib/site'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const statics: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/gallery`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/map`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/tour`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/submit`, changeFrequency: 'yearly', priority: 0.4 },
    { url: `${SITE_URL}/privacy`, changeFrequency: 'yearly', priority: 0.1 },
    { url: `${SITE_URL}/terms`, changeFrequency: 'yearly', priority: 0.1 },
  ]

  // Plain anon client: sitemap renders outside a request, so no cookies here.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return statics

  try {
    const supabase = createClient(url, key)
    const { data } = await supabase.from('murals').select('slug,updated_at').order('slug')
    const murals: MetadataRoute.Sitemap = (data ?? []).map(m => ({
      url: `${SITE_URL}/gallery/${m.slug}`,
      lastModified: m.updated_at ? new Date(m.updated_at) : undefined,
      changeFrequency: 'monthly',
      priority: 0.8,
    }))
    return [...statics, ...murals]
  } catch {
    return statics
  }
}
