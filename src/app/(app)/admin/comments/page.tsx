import { requireAdmin } from '@/lib/auth/requireAdmin'
import { CommentRow } from '@/components/admin/CommentRow'

interface Row { id: string; body: string; author_name: string | null; status_vote: string | null; created_at: string; murals: { title: string; slug: string } | null }

export default async function AdminComments() {
  const { supabase } = await requireAdmin()
  const { data } = await supabase.from('comments').select('id,body,author_name,status_vote,created_at,murals(title,slug)').order('created_at', { ascending: false }).limit(100)
  const rows = (data ?? []) as unknown as Row[]
  return (
    <div className="space-y-3">
      <h1 className="font-display font-bold text-card">Comments ({rows.length})</h1>
      {rows.length === 0 && <p className="text-body text-ink-3">No comments yet.</p>}
      {rows.map(r => <CommentRow key={r.id} row={r} />)}
    </div>
  )
}
