'use client'
import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { createImplicitClient } from '@/lib/supabase/implicit'
import { useT } from '@/lib/i18n/client'

/** Landing page of the emailed sign-in link: reads the session from the link, stores it as the app's normal session, then continues. */
export default function AuthFinish() {
  const { t } = useT()
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const raw = params.get('next')
    const explicit = raw && raw.startsWith('/') && !raw.startsWith('//') ? raw : null
    // Where to land: the page asked for, otherwise the admin area for admins and the profile for everyone else.
    const landing = async (sb: ReturnType<typeof createClient>) => {
      if (explicit) return explicit
      const { data } = await sb.rpc('is_admin')
      return data === true ? '/admin' : '/profile'
    }
    ;(async () => {
      const sb = createClient()
      try {
        // Already signed in (e.g. the link was opened a second time, which Supabase rejects as used): just continue.
        const { data: { user } } = await sb.auth.getUser()
        if (user) { window.location.replace(await landing(sb)); return }
        // reading the session processes the tokens in the link's #fragment
        const { data: { session } } = await createImplicitClient().auth.getSession()
        if (!session) throw new Error('no session in link')
        const { error } = await sb.auth.setSession({ access_token: session.access_token, refresh_token: session.refresh_token })
        if (error) throw error
        window.location.replace(await landing(sb))   // full load so the server sees the new session
      } catch {
        setFailed(true)
        window.location.replace('/signin?error=callback')
      }
    })()
  }, [])

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center gap-3 px-gutter text-center text-ink-2">
      {!failed && <Loader2 className="animate-spin text-sea" size={28} />}
      <p className="text-14">{t('auth.finishing')}</p>
    </main>
  )
}
