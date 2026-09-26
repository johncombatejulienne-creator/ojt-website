// PSBC Work Immersion Portal — Service Worker v4
// IMPORTANT: Version bump forces old SW to be replaced immediately

const CACHE_NAME = 'ojt-portal-v4'

// Only cache these static assets — NOT HTML pages
const STATIC_ASSETS = [
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-72.png',
  '/psbc-logo.jpg',
]

// Install — cache only static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      cache.addAll(STATIC_ASSETS).catch(() => {})
    ).then(() => self.skipWaiting())
  )
})

// Activate — delete ALL old caches immediately
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(key => caches.delete(key)))
    ).then(() => self.clients.claim())
  )
})

// Fetch strategy:
// - HTML/navigation pages → ALWAYS network (never serve from cache)
// - Static assets (images, manifest) → cache first
self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') return

  // ALWAYS fetch HTML/navigation from network — never cache pages
  // This prevents the stuck splash screen on re-open
  if (request.mode === 'navigate' ||
      request.headers.get('accept')?.includes('text/html') ||
      url.pathname === '/' ||
      url.pathname === '/login' ||
      url.pathname === '/dashboard' ||
      url.pathname.startsWith('/teacher') ||
      url.pathname.startsWith('/narratives') ||
      url.pathname.startsWith('/api/')) {
    // Network only for all page requests
    event.respondWith(
      fetch(request).catch(() =>
        new Response('You are offline. Please reconnect and try again.', {
          status: 503,
          headers: { 'Content-Type': 'text/plain' }
        })
      )
    )
    return
  }

  // Cache-first for static assets only (images, icons, manifest)
  if (url.pathname.match(/\.(png|jpg|jpeg|svg|ico|webp|json)$/)) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached
        return fetch(request).then(response => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then(cache => cache.put(request, clone))
          }
          return response
        }).catch(() => cached ?? new Response('', { status: 404 }))
      })
    )
    return
  }

  // Everything else → network only
  event.respondWith(fetch(request))
})

// Push notifications
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
    clients.matchAll({ type: 'window' }).then(windowClients => {
      for (const client of windowClients) {
        if (client.url === url && 'focus' in client) return client.focus()
      }
      if (clients.openWindow) return clients.openWindow(url)
    })
  )
})
