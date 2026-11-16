'use client'
import { useEffect, useState } from 'react'
import { Bell, BellOff, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { VAPID_PUBLIC_KEY, urlBase64ToUint8Array } from '@/lib/push'
import { ghostBtn, primaryBtn } from './fields'

type State = 'checking' | 'unsupported' | 'denied' | 'off' | 'on'

/** Turn push alerts on/off for new submissions on this device (works once the site is installed / in production). */
export function EnableAlerts() {
  const [state, setState] = useState<State>('checking')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    (async () => {
      if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return setState('unsupported')
      if (Notification.permission === 'denied') return setState('denied')
      const reg = await navigator.serviceWorker.getRegistration()
      if (!reg) return setState('unsupported')
      setState((await reg.pushManager.getSubscription()) ? 'on' : 'off')
    })().catch(() => setState('unsupported'))
  }, [])

  async function enable() {
    setBusy(true); setError(null)
    try {
      const perm = await Notification.requestPermission()
      if (perm !== 'granted') { setState(perm === 'denied' ? 'denied' : 'off'); return }
      const reg = await navigator.serviceWorker.ready
      const sub = (await reg.pushManager.getSubscription()) ?? await reg.pushManager.subscribe({
        userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
      })
      const j = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } }
      const { error: e } = await createClient().from('push_subscriptions')
        .upsert({ endpoint: j.endpoint, p256dh: j.keys.p256dh, auth: j.keys.auth }, { onConflict: 'endpoint' })
      if (e) throw e
      setState('on')
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not turn on alerts') }
    finally { setBusy(false) }
  }

  async function disable() {
    setBusy(true); setError(null)
    try {
      const reg = await navigator.serviceWorker.getRegistration()
      const sub = await reg?.pushManager.getSubscription()
      if (sub) {
        await createClient().from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
        await sub.unsubscribe()
      }
      setState('off')
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not turn off alerts') }
    finally { setBusy(false) }
  }

  if (state === 'checking') return null
  return (
    <div className="bg-surface rounded-xl p-4 flex items-start gap-3">
      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${state === 'on' ? 'bg-certain-bg text-certain' : 'bg-groove text-ink-3'}`}>
        {state === 'on' ? <Bell size={16} /> : <BellOff size={16} />}
      </div>
      <div className="flex-1 min-w-0 space-y-2">
        <p className="font-display font-semibold text-[13px]">New-submission alerts {state === 'on' ? 'are on for this device' : ''}</p>
        {state === 'unsupported' && <p className="text-small text-ink-2">Not available here. On iPhone, add the site to your Home Screen and open it from there (iOS 16.4 or later); on other devices use the live site in a recent browser.</p>}
        {state === 'denied' && <p className="text-small text-ink-2">Notifications are blocked for this site. Allow them in your browser or phone settings, then reload.</p>}
        {state === 'off' && <p className="text-small text-ink-2">Get a notification on this device whenever someone submits a mural or photos.</p>}
        {state === 'on' && <p className="text-small text-ink-2">You’ll be notified when something needs review. Turn it on in each browser or phone you use.</p>}
        {(state === 'off' || state === 'on') && (
          <button className={state === 'off' ? primaryBtn : ghostBtn} disabled={busy} onClick={state === 'off' ? enable : disable}>
            {busy && <Loader2 size={12} className="inline animate-spin -mt-0.5 mr-1" />}{state === 'off' ? 'Enable alerts' : 'Turn off'}
          </button>
        )}
        {error && <p className="text-caption text-guessing" role="alert">{error}</p>}
      </div>
    </div>
  )
}
