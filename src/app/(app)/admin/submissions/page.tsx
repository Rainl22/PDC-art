import { requireAdmin } from '@/lib/auth/requireAdmin'
import { SubmissionCard } from '@/components/admin/SubmissionCard'
import type { Submission } from '@/types/mural'

export default async function SubmissionsPage() {
  const { supabase } = await requireAdmin()
  const { data } = await supabase.from('submissions').select('*').order('created_at', { ascending: false }).limit(100)
  const all = (data ?? []) as Submission[]
  const pending = all.filter(s => s.status === 'pending')
  const done = all.filter(s => s.status !== 'pending')
  return (
    <div className="space-y-4">
      <h1 className="font-display font-bold text-[18px]">Pending ({pending.length})</h1>
      {pending.length === 0 && <p className="text-[13px] text-ink-3">Nothing to review.</p>}
      {pending.map(s => <SubmissionCard key={s.id} submission={s} />)}
      {done.length > 0 && (
        <>
          <h2 className="font-display font-bold text-[14px] text-ink-2 pt-4">Reviewed ({done.length})</h2>
          {done.map(s => <SubmissionCard key={s.id} submission={s} />)}
        </>
      )}
    </div>
  )
}
