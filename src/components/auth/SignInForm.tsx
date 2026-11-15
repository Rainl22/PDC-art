'use client'
import { useState } from 'react'
import { Loader2, MailCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useT } from '@/lib/i18n/client'

const field = 'w-full text-[13px] bg-surface rounded-md px-3 py-2.5 outline-none border border-groove focus:border-sea placeholder:text-ink-3'

export function SignInForm({ next }: { next?: string }) {
  const { t } = useT()
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [error, setError] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const address = email.trim()
    if (!address || busy) return
    setBusy(true); setError(false)
    const safeNext = next && next.startsWith('/') && !next.startsWith('//') ? next : '/profile'
    const { error: err } = await createClient().auth.signInWithOtp({
      email: address,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(safeNext)}` },
    })
    setBusy(false)
    if (err) setError(true); else setSentTo(address)
  }

  if (sentTo) {
    return (
      <div className="bg-surface rounded-md p-6 text-center">
        <MailCheck className="mx-auto text-certain" size={36} />
        <p className="font-display font-semibold mt-3">{t('auth.checkTitle')}</p>
        <p className="text-[13px] text-ink-2 mt-1">{t('auth.checkBody', { email: sentTo })}</p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <input className={field} type="email" required autoComplete="email" inputMode="email"
        placeholder={t('auth.email')} value={email} onChange={e => setEmail(e.target.value)} />
      {error && <p className="text-[12px] text-guessing" role="alert">{t('auth.error')}</p>}
      <button type="submit" disabled={!email.trim() || busy}
        className="w-full rounded-full bg-sea text-white font-display font-medium py-3 text-[14px] disabled:opacity-40 inline-flex items-center justify-center gap-2">
        {busy && <Loader2 size={15} className="animate-spin" />}
        {busy ? t('auth.sending') : t('auth.send')}
      </button>
    </form>
  )
}
