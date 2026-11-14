import { createClient } from '@/lib/supabase/server'
import { GalleryClient } from '@/components/mural/GalleryClient'
import type { Mural } from '@/types/mural'

export const revalidate = 60

export default async function GalleryPage() {
  const supabase = createClient()
  const { data } = await supabase
    .from('murals')
    .select('*')
    .order('title')

  return <GalleryClient murals={(data ?? []) as Mural[]} />
}
