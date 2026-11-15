/* Murales PDC service worker — small and conservative.
   - Pages: network first (always fresh); if offline, fall back to a cached copy or /offline.html
   - Built JS/CSS (hashed) and mural photos: cached for speed + offline viewing
   - Everything else (Supabase API, map tiles, auth) is left alone. */
const VERSION = 'v2'
const SHELL = `shell-${VERSION}`
const ASSETS = `assets-${VERSION}`
const PAGES = `pages-${VERSION}`

self.addEventListener('install', event => {
  event.waitUntil(caches.open(SHELL).then(c => c.addAll(['/offline.html', '/icon-192.png'])).then(() => self.skipWaiting()))
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => ![SHELL, ASSETS, PAGES].includes(k)).map(k => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', event => {
  const req = event.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/auth/') || url.pathname.startsWith('/admin')) return

  // Page navigations: network first
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then(res => {
          if (res.ok) { const copy = res.clone(); caches.open(PAGES).then(c => c.put(req, copy)) }
          return res
        })
        .catch(async () => (await caches.match(req)) || (await caches.match('/offline.html'))),
    )
    return
  }

  // Immutable build files: cache first
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(res => {
        if (res.ok) { const copy = res.clone(); caches.open(ASSETS).then(c => c.put(req, copy)) }
        return res
      })),
    )
    return
  }

  // Mural photos, icons, worker files: stale-while-revalidate
  if (url.pathname.startsWith('/murals/') || url.pathname.startsWith('/maplibre/') || /^\/(icon-|apple-touch-icon)/.test(url.pathname)) {
    event.respondWith(
      caches.open(ASSETS).then(async cache => {
        const hit = await cache.match(req)
        const net = fetch(req).then(res => { if (res.ok) cache.put(req, res.clone()); return res }).catch(() => hit)
        return hit || net
      }),
    )
  }
})

// --- Admin push notifications (new submissions) ---
self.addEventListener('push', event => {
  let d = {}
  try { d = event.data ? event.data.json() : {} } catch { /* plain text push */ }
  event.waitUntil(self.registration.showNotification(d.title || 'Murales PDC', {
    body: d.body || '',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: { url: d.url || '/admin/submissions' },
  }))
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  const url = (event.notification.data && event.notification.data.url) || '/admin/submissions'
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    for (const c of list) { if ('focus' in c) { c.navigate(url).catch(() => {}); return c.focus() } }
    return self.clients.openWindow(url)
  }))
})
