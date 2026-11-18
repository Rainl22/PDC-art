import { requireAdmin } from '@/lib/auth/requireAdmin'
import { SubmissionCard } from '@/components/admin/SubmissionCard'
import type { Submission } from '@/types/mural'

export default async function SubmissionsPage() {
  const { supabase } = await requireAdmin()
  const { data } = await supabase.from('submissions').select('*').order('created_at', { ascending: false }).limit(100)
  const all = (data ?? []) as Submission[]
  // "Still here" taps on the same mural collapse into one card (newest shown) that resolves all of them together.
  const tap = (s: Submission) => s.status === 'pending' && !!s.mural_slug && !!s.notes?.includes('Sent from a "Still here" tap')
  const extra = new Map<string, string[]>()
  const pending = all.filter(s => s.status === 'pending').filter(s => {
    if (!tap(s)) return true
    const seen = extra.get(s.mural_slug!)
    if (seen) { seen.push(s.id); return false }
    extra.set(s.mural_slug!, [])
    return true
  })
  const done = all.filter(s => s.status !== 'pending')
  return (
    <div className="space-y-4">
      <details className="bg-surface rounded-sheet p-4 text-13 text-ink-2 leading-relaxed">
        <summary className="cursor-pointer font-semibold text-ink">How reviewing works</summary>
        <ul className="list-disc pl-4 mt-2 space-y-1.5">
          <li><b>Auto-verified</b> (green tag): a photo plus GPS within 50 m of the mural’s pin was applied automatically. Nothing to do; check the photo if you like.</li>
          <li><b>New mural</b> → “Create mural…”: fix the title, artist(s) and location, then create. Known artists fill in their Instagram automatically; type a handle or link for a new one and it’s saved for next time.</li>
          <li><b>Photos for an existing mural</b> → “Add photos to mural”. “Repainted” replaces the photos, keeps the old ones as history and tags the mural <b>Changed</b>. Bundled placeholder photos are replaced by the first real ones.</li>
          <li><b>Verify location</b> → “Confirm location”: shows how far the person was from the pin (green = within 50 m).</li>
          <li><b>Missing the artist?</b> Each card for an existing mural shows its artist. If it’s missing, type the name (and handle) right there and press “Save artist”, or use “Edit mural” for everything else (year, medium, notes, photo order, status).</li>
          <li><b>Location suggestion</b> → “Apply location…” sets the address and precision on the existing mural.</li>
          <li>“GPS + photo” (blue tag) means the person shared GPS and a photo; a good sign, but new murals are never published automatically.</li>
        </ul>
      </details>
      <h1 className="font-bold text-16">Pending ({pending.length})</h1>
      {pending.length === 0 && <p className="text-14 text-ink-3">Nothing to review.</p>}
      {pending.map(s => <SubmissionCard key={s.id} submission={s} alsoIds={tap(s) ? extra.get(s.mural_slug!) : undefined} />)}
      {done.length > 0 && (
        <>
          <h2 className="font-bold text-14 text-ink-2 pt-4">Reviewed ({done.length})</h2>
          {done.map(s => <SubmissionCard key={s.id} submission={s} />)}
        </>
      )}
    </div>
  )
}
