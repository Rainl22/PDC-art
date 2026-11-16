'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Row { id: string; body: string; author_name: string | null; status_vote: string | null; created_at: string; murals: { title: string; slug: string } | null }

export function CommentRow({ row }: { row: Row }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  async function del() {
    if (!confirm('Delete this comment?')) return
    setBusy(true)
    await createClient().from('comments').delete().eq('id', row.id)
    router.refresh()
  }
  return (
    <div className="bg-surface rounded-sheet p-3 flex items-start gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-caption text-ink-3">
          {row.author_name ?? 'Anonymous'} · {new Date(row.created_at).toLocaleDateString()}
          {row.murals && <> · <Link href={`/gallery/${row.murals.slug}`} className="text-sea underline underline-offset-2">{row.murals.title}</Link></>}
        </p>
        <p className="text-body text-ink mt-1 break-words">{row.body || <em className="text-ink-3">(vote only: {row.status_vote})</em>}</p>
      </div>
      <button onClick={del} disabled={busy} aria-label="Delete comment" className="p-2 text-guessing disabled:opacity-40"><Trash2 size={15} /></button>
    </div>
  )
}
