import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { CloseButton } from '@/components/ui/CloseButton'
import { MuralEditor } from '@/components/admin/MuralEditor'
import type { Mural } from '@/types/mural'

export default async function EditMural({ params }: { params: { id: string } }) {
  const { supabase } = await requireAdmin()
  const { data } = await supabase.from('murals').select('*').eq('id', params.id).maybeSingle()
  if (!data) notFound()
  const m = data as Mural
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <h1 className="flex-1 min-w-0 font-display font-bold text-[18px] truncate">{m.title}</h1>
        <CloseButton fallback="/admin/murals" className="" />
      </div>
      <MuralEditor mural={m} />
    </div>
  )
}
