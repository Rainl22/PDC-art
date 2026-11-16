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
    const raw = new URLSearchParams(window.location.search).get('next') ?? '/profile'
    const next = raw.startsWith('/') && !raw.startsWith('//') ? raw : '/profile'
    ;(async () => {
      try {
        // reading the session processes the tokens in the link's #fragment
        const { data: { session } } = await createImplicitClient().auth.getSession()
        if (!session) throw new Error('no session in link')
        const { error } = await createClient().auth.setSession({ access_token: session.access_token, refresh_token: session.refresh_token })
        if (error) throw error
        window.location.replace(next)   // full load so the server sees the new session
      } catch {
        setFailed(true)
        window.location.replace('/signin?error=callback')
      }
    })()
  }, [])

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center gap-3 px-gutter text-center text-ink-2">
      {!failed && <Loader2 className="animate-spin text-sea" size={28} />}
      <p className="text-body">{t('auth.finishing')}</p>
    </main>
  )
}
