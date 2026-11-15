// Sends a Web Push notification to every subscribed admin device when a submission arrives.
// Called by a database trigger (pg_net) with a shared secret; builds the message from the stored submission,
// so a caller can only ever trigger a notification about a real submission.
import webpush from 'npm:web-push@3.6.7'
import { createClient } from 'npm:@supabase/supabase-js@2'

const KIND: Record<string, string> = {
  new: 'New mural',
  location: 'Location suggestion',
  verify_location: 'Location verification',
  photos_same: 'New photos',
  photos_repainted: 'Repainted mural photos',
}

Deno.serve(async (req) => {
  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const { data: secrets } = await sb.from('app_secrets').select('name,value')
  const s = Object.fromEntries((secrets ?? []).map((r: { name: string; value: string }) => [r.name, r.value]))
  if (!s.notify_secret || req.headers.get('x-notify-secret') !== s.notify_secret) return new Response('forbidden', { status: 403 })

  let id = ''
  try { id = String((await req.json()).id ?? '') } catch { /* handled below */ }
  if (!id) return new Response('missing id', { status: 400 })

  const { data: sub } = await sb.from('submissions')
    .select('title,kind,status,mural_slug,photo_paths,auto_verified,auto_note').eq('id', id).maybeSingle()
  if (!sub) return new Response('not found', { status: 404 })

  const name = sub.title || sub.mural_slug || 'Untitled'
  const n = sub.photo_paths?.length ?? 0
  const what = KIND[sub.kind] ?? 'Submission'
  const payload = JSON.stringify({
    title: sub.auto_verified ? `Auto-verified: ${name}` : `${what}: ${name}`,
    body: sub.auto_verified ? `${sub.auto_note ?? 'Verified with proof'}. Tap to review.` : `${n} photo${n === 1 ? '' : 's'} waiting for review.`,
    url: '/admin/submissions',
  })

  webpush.setVapidDetails('https://pdc-art.vercel.app', s.vapid_public, s.vapid_private)
  const { data: subs } = await sb.from('push_subscriptions').select('id,endpoint,p256dh,auth')
  let sent = 0, removed = 0, failed = 0
  await Promise.all((subs ?? []).map(async (d: { id: string; endpoint: string; p256dh: string; auth: string }) => {
    try {
      await webpush.sendNotification({ endpoint: d.endpoint, keys: { p256dh: d.p256dh, auth: d.auth } }, payload, { TTL: 86400 })
      sent++
    } catch (e) {
      const code = (e as { statusCode?: number }).statusCode
      if (code === 404 || code === 410) { await sb.from('push_subscriptions').delete().eq('id', d.id); removed++ } else failed++
    }
  }))
  return Response.json({ sent, removed, failed })
})
