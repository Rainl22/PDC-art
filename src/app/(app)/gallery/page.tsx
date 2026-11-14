import { createClient } from '@/lib/supabase/server'
import { GalleryClient } from '@/components/mural/GalleryClient'
import type { Mural } from '@/types/mural'

export const revalidate = 60

export default async function GalleryPage() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('murals')
    .select('*')
    .order('title')

  console.log('[gallery] murals:', data?.length ?? 0, 'error:', error)

  return <GalleryClient murals={(data ?? []) as Mural[]} />
}
