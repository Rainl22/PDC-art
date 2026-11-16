import Link from 'next/link'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { ChevronRight } from 'lucide-react'
import { ConfidenceBadge } from '@/components/ui/ConfidenceBadge'
import type { Mural } from '@/types/mural'

export default async function AdminMurals() {
  const { supabase } = await requireAdmin()
  const { data } = await supabase.from('murals').select('id,slug,title,artist,confidence,cover_photo,coordinates').order('title')
  const murals = (data ?? []) as Pick<Mural, 'id' | 'slug' | 'title' | 'artist' | 'confidence' | 'cover_photo' | 'coordinates'>[]
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="font-display font-bold text-card">Murals ({murals.length})</h1>
        <Link href="/admin/murals/new" className="rounded-full bg-sea text-on-dark px-4 py-2 text-small font-display font-semibold">+ Add</Link>
      </div>
      {murals.map(m => (
        <Link key={m.id} href={`/admin/murals/${m.id}`} className="bg-surface rounded-sheet p-3 flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {m.cover_photo ? <img src={m.cover_photo} alt="" className="w-12 h-12 rounded-inset object-cover shrink-0" /> : <div className="w-12 h-12 rounded-inset bg-groove shrink-0" />}
          <div className="flex-1 min-w-0">
            <p className="text-body font-medium truncate">{m.title}</p>
            <p className="text-caption text-ink-3 truncate">{m.artist ?? 'Artist unknown'}{m.coordinates ? '' : ' · no coordinates'}</p>
          </div>
          <ConfidenceBadge level={m.confidence} sm />
          <ChevronRight size={15} className="text-ink-3 shrink-0" />
        </Link>
      ))}
    </div>
  )
}
