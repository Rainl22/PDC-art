'use client'
import { useEffect, useState } from 'react'
import { Loader2, MailCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { createImplicitClient } from '@/lib/supabase/implicit'
import { useT } from '@/lib/i18n/client'

const field = 'w-full text-[13px] bg-surface rounded-md px-3 py-2.5 outline-none border border-groove focus:border-sea placeholder:text-ink-3'

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.9 2.4 30.4 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.6 5.9c4.4-4.1 7-10.1 7-17.1z" />
      <path fill="#FBBC05" d="M10.5 28.7c-.5-1.5-.8-3-.8-4.7s.3-3.2.8-4.7l-7.9-6.1C.9 16.4 0 20.1 0 24s.9 7.6 2.6 10.8l7.9-6.1z" />
      <path fill="#34A853" d="M24 48c6.4 0 11.9-2.1 15.9-5.8l-7.6-5.9c-2.1 1.4-4.8 2.3-8.3 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
    </svg>
  )
}

export function SignInForm({ next }: { next?: string }) {
  const { t } = useT()
  const safeNext = next && next.startsWith('/') && !next.startsWith('//') ? next : null
  const nextQuery = safeNext ? `?next=${encodeURIComponent(safeNext)}` : ''
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [error, setError] = useState<'send' | 'rate' | null>(null)
  const [google, setGoogle] = useState(false)

  // Show "Continue with Google" only once the provider is switched on in Supabase (no redeploy needed).
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/settings`, { headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! } })
      .then(r => r.json()).then(s => setGoogle(!!s?.external?.google)).catch(() => {})
  }, [])

  // The emailed link usually opens in a new tab. When that tab signs in, this one notices and moves on too.
  useEffect(() => {
    if (!sentTo) return
    const sb = createClient()
    let stop = false
    const check = async () => {
      const { data: { user } } = await sb.auth.getUser()
      if (!user || stop) return
      stop = true
      if (safeNext) { window.location.replace(safeNext); return }
      const { data } = await sb.rpc('is_admin')
      window.location.replace(data === true ? '/admin' : '/profile')
    }
    const timer = setInterval(check, 3000)
    document.addEventListener('visibilitychange', check)
    return () => { stop = true; clearInterval(timer); document.removeEventListener('visibilitychange', check) }
  }, [sentTo, safeNext])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const address = email.trim()
    if (!address || busy) return
    setBusy(true); setError(null)
    const { error: err } = await createImplicitClient().auth.signInWithOtp({
      email: address,
      options: { emailRedirectTo: `${window.location.origin}/auth/finish${nextQuery}` },
    })
    setBusy(false)
    // too many emails requested in a short time (the hourly limit of the email service), not a problem with the address
    if (err) setError(err.status === 429 || (err as { code?: string }).code === 'over_email_send_rate_limit' ? 'rate' : 'send')
    else setSentTo(address)
  }

  async function withGoogle() {
    setBusy(true); setError(null)
    const { error: err } = await createClient().auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback${nextQuery}` },
    })
    if (err) { setBusy(false); setError('send') }
  }

  if (sentTo) {
    return (
      <div className="bg-surface rounded-md p-6 text-center">
        <div>
          <MailCheck className="mx-auto text-certain" size={36} />
          <p className="font-display font-semibold mt-3">{t('auth.checkTitle')}</p>
          <p className="text-[13px] text-ink-2 mt-1">{t('auth.checkBody', { email: sentTo })}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {google && (
        <>
          <button type="button" onClick={withGoogle} disabled={busy}
            className="w-full rounded-full border border-groove bg-surface text-ink font-display font-medium py-3 text-body inline-flex items-center justify-center gap-2.5 disabled:opacity-40">
            <GoogleMark />{t('auth.google')}
          </button>
          <div className="flex items-center gap-3 text-caption text-ink-3 uppercase tracking-wide">
            <span className="flex-1 h-px bg-groove" />{t('auth.or')}<span className="flex-1 h-px bg-groove" />
          </div>
        </>
      )}
      <form onSubmit={submit} className="space-y-3">
        <input className={field} type="email" required autoComplete="email" inputMode="email"
          placeholder={t('auth.email')} value={email} onChange={e => setEmail(e.target.value)} />
        {error && <p className="text-small text-guessing" role="alert">{t(error === 'rate' ? 'auth.errorRate' : 'auth.error')}</p>}
        <button type="submit" disabled={!email.trim() || busy}
          className="w-full rounded-full bg-sea text-white font-display font-medium py-3 text-body disabled:opacity-40 inline-flex items-center justify-center gap-2">
          {busy && <Loader2 size={15} className="animate-spin" />}
          {busy ? t('auth.sending') : t('auth.send')}
        </button>
      </form>
    </div>
  )
}
