import Link from 'next/link'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { ChevronRight } from 'lucide-react'
import { ConfidenceBadge } from '@/components/ui/ConfidenceBadge'
import { loadArtistGaps } from '@/lib/artistGaps'
import { AlertTriangle } from 'lucide-react'
import type { Mural } from '@/types/mural'

export default async function AdminMurals() {
  const { supabase } = await requireAdmin()
  const { data } = await supabase.from('murals').select('id,slug,title,artist,confidence,cover_photo,coordinates').order('title')
  const gaps = await loadArtistGaps(supabase)
  const murals = (data ?? []) as Pick<Mural, 'id' | 'slug' | 'title' | 'artist' | 'confidence' | 'cover_photo' | 'coordinates'>[]
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="font-bold text-16">Murals ({murals.length})</h1>
        <Link href="/admin/murals/new" className="rounded-full bg-sea text-on-dark px-4 py-2 text-13 font-semibold">+ Add</Link>
      </div>
      {gaps.length > 0 && (
        <div className="bg-unconfirmed-bg text-unconfirmed rounded-panel p-3 space-y-1.5">
          <p className="flex items-center gap-1.5 text-13 font-semibold"><AlertTriangle size={14} />{gaps.length} {gaps.length === 1 ? 'artist has' : 'artists have'} no social link</p>
          <ul className="text-13 space-y-0.5">
            {gaps.map(g => (
              <li key={g.name}><b>{g.name}</b> — {g.murals.map((m, i) => (<span key={m.id}>{i > 0 && ', '}<Link href={`/admin/murals/${m.id}`} className="underline underline-offset-2">{m.title}</Link></span>))}</li>
            ))}
          </ul>
        </div>
      )}
      {murals.map(m => (
        <Link key={m.id} href={`/admin/murals/${m.id}`} className="bg-surface rounded-sheet p-3 flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {m.cover_photo ? <img src={m.cover_photo} alt="" className="w-12 h-12 rounded-inset object-cover shrink-0" /> : <div className="w-12 h-12 rounded-inset bg-groove shrink-0" />}
          <div className="flex-1 min-w-0">
            <p className="text-14 font-medium truncate">{m.title}</p>
            <p className="text-13 text-ink-3 truncate">{m.artist ?? 'Artist unknown'}{m.coordinates ? '' : ' · no coordinates'}</p>
          </div>
          <ConfidenceBadge level={m.confidence} />
          <ChevronRight size={15} className="text-ink-3 shrink-0" />
        </Link>
      ))}
    </div>
  )
}
