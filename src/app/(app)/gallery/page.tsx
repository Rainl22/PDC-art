import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { GalleryClient } from '@/components/mural/GalleryClient'
import type { Mural } from '@/types/mural'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Mural gallery · Murales PDC',
  description:
    'Browse every street mural in Playa del Carmen with photos, artists and locations. Sort by nearest, newest or most liked. Galería de murales de Playa del Carmen.',
  alternates: { canonical: '/gallery' },
}

export default async function GalleryPage() {
  const supabase = createClient()
  const { data } = await supabase
    .from('murals')
    .select('*')
    .order('title')

  return <GalleryClient murals={(data ?? []) as Mural[]} />
}
