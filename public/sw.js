// PSBC Work Immersion Portal — Service Worker v10
// Strategy: network-only for everything except icons/manifest
// Bumping version forces all old caches to be wiped on next open

const CACHE_NAME = 'ojt-portal-v10'

// ── Install: skip waiting immediately, no pre-caching ────────
self.addEventListener('install', event => {
  event.waitUntil(self.skipWaiting())
})

// ── Activate: delete ALL old caches, claim all clients ───────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(k => caches.delete(k))))
      .then(() => self.clients.claim())
      .then(() => {
        // Tell all open tabs to reload so they get fresh JS/CSS
        return self.clients.matchAll({ type: 'window' }).then(clients => {
          clients.forEach(client => client.postMessage({ type: 'SW_UPDATED' }))
        })
      })
  )
})

// ── Fetch: network-only for everything except a tiny set ─────
self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)

  // Non-GET: always pass through
  if (request.method !== 'GET') return

  // _next/static (JS, CSS bundles) → ALWAYS network, never cache
  // This is the critical part — Next.js CSS-in-JS chunks must always be fresh
  if (url.pathname.startsWith('/_next/')) {
    event.respondWith(
      fetch(request).catch(() => new Response('', { status: 503 }))
    )
    return
  }

  // API routes → network only
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() =>
        new Response(JSON.stringify({ error: 'offline' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        })
      )
    )
    return
  }

  // HTML navigation → network only (always get fresh page)
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request).catch(() =>
        new Response('<h1>You are offline</h1><p>Please reconnect and try again.</p>', {
          status: 503,
          headers: { 'Content-Type': 'text/html' },
        })
      )
    )
    return
  }

  // Static icons/images/manifest → cache-first (these never change)
  if (url.pathname.match(/\.(png|jpg|jpeg|svg|ico|webp)$/) || url.pathname === '/manifest.json') {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache =>
        cache.match(request).then(cached => {
          if (cached) return cached
          return fetch(request).then(response => {
            if (response.ok) cache.put(request, response.clone())
            return response
          }).catch(() => cached ?? new Response('', { status: 404 }))
        })
      )
    )
    return
  }

  // Everything else → network only
  event.respondWith(fetch(request).catch(() => new Response('', { status: 503 })))
})

// ── Push notifications ────────────────────────────────────────
self.addEventListener('push', event => {
  const data = event.data?.json() ?? {}
  event.waitUntil(
    self.registration.showNotification(data.title ?? 'PSBC Work Immersion', {
      body:    data.body ?? 'You have a new notification',
      icon:    '/icon-192.png',
      badge:   '/icon-72.png',
      vibrate: [100, 50, 100],
      data:    { url: data.url ?? '/' },
    })
  )
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  const url = event.notification.data?.url ?? '/'
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(windowClients => {
      for (const client of windowClients) {
        if (client.url === url && 'focus' in client) return client.focus()
      }
      return self.clients.openWindow(url)
    })
  )
})
