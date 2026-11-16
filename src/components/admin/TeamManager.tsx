'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserPlus, Trash2, Crown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { adminField, adminLabel, primaryBtn, ghostBtn } from './fields'

export interface Member { email: string; role: 'owner' | 'moderator'; created_at: string }

const MESSAGES: Record<string, string> = {
  bad_email: 'Enter a valid email address.',
  not_allowed: 'You don’t have access to manage the team.',
  cannot_remove_owner: 'The owner can’t be removed.',
}
const explain = (e: unknown) => {
  const m = (e as { message?: string })?.message ?? ''
  const key = Object.keys(MESSAGES).find(k => m.includes(k))
  return key ? MESSAGES[key] : m || 'Something went wrong.'
}

/** Owner = you (can't be removed by anyone). Moderators do everything else: review submissions, edit murals, add and remove other moderators. */
export function TeamManager({ members, myEmail, myRole }: { members: Member[]; myEmail: string; myRole: string }) {
  const router = useRouter()
  const sb = createClient()
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  async function add() {
    setBusy(true); setMsg(null)
    const { error } = await sb.rpc('add_team_member', { p_email: email })
    setBusy(false)
    if (error) return setMsg({ ok: false, text: explain(error) })
    setMsg({ ok: true, text: `${email.trim().toLowerCase()} can now sign in and review. Ask them to open /signin and use that email.` })
    setEmail(''); router.refresh()
  }

  async function remove(m: Member) {
    if (!confirm(`Remove ${m.email} from the team? They’ll lose access to /admin straight away.`)) return
    setBusy(true); setMsg(null)
    const { error } = await sb.rpc('remove_team_member', { p_email: m.email })
    setBusy(false)
    if (error) return setMsg({ ok: false, text: explain(error) })
    setMsg({ ok: true, text: `${m.email} was removed.` }); router.refresh()
  }

  return (
    <div className="space-y-4">
      <div className="bg-surface rounded-xl p-4 text-[12px] text-ink-2 leading-relaxed space-y-1">
        <p><b>Owner</b> — the main account. Can’t be removed by anyone.</p>
        <p><b>Moderator</b> — can review and publish submissions, edit murals, moderate comments, and add or remove other moderators. Can’t remove the owner.</p>
      </div>

      <ul className="space-y-2">
        {members.map(m => (
          <li key={m.email} className="bg-surface rounded-xl p-3 flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${m.role === 'owner' ? 'bg-likely-bg text-likely' : 'bg-sea-tint text-sea'}`}>
              {m.role === 'owner' ? <Crown size={14} /> : <span className="text-[12px] font-bold">{m.email[0]?.toUpperCase()}</span>}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] truncate">{m.email}{m.email.toLowerCase() === myEmail.toLowerCase() ? ' (you)' : ''}</p>
              <p className="text-[11px] text-ink-3 capitalize">{m.role}</p>
            </div>
            {m.role !== 'owner' && (
              <button className={ghostBtn} disabled={busy} onClick={() => remove(m)} aria-label={`Remove ${m.email}`}>
                <Trash2 size={12} className="inline -mt-0.5" /> Remove
              </button>
            )}
          </li>
        ))}
      </ul>

      <div className="bg-surface rounded-xl p-4 space-y-2">
        <label className={adminLabel}>Add a moderator by email</label>
        <div className="flex gap-2">
          <input className={adminField} type="email" inputMode="email" autoComplete="off" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@example.com" />
          <button className={primaryBtn} disabled={busy || !email.includes('@')} onClick={add}><UserPlus size={12} className="inline -mt-0.5" /> Add</button>
        </div>
        <p className="text-[10px] text-ink-3">They sign in at /signin with a magic link sent to this exact email, and get access right away. Signed in as {myRole}.</p>
      </div>
      {msg && <p className={`text-[12px] ${msg.ok ? 'text-certain' : 'text-guessing'}`} role="alert">{msg.text}</p>}
    </div>
  )
}
