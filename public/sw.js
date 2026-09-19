// PSBC Work Immersion Portal — Service Worker
// Caches static assets for offline use

const CACHE_NAME = 'ojt-portal-v1'
const OFFLINE_URL = '/login'

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/login',
  '/dashboard',
  '/narratives',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/psbc-logo.svg',
]

// Install — cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS).catch(() => {
        // Non-critical — don't fail install if some assets are missing
      })
    }).then(() => self.skipWaiting())
  )
})

// Activate — clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  )
})

// Fetch — network first, fall back to cache
self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET and API requests — always go to network
  if (request.method !== 'GET') return
  if (url.pathname.startsWith('/api/')) return
  if (url.pathname.startsWith('/_next/')) return

  event.respondWith(
    fetch(request)
      .then(response => {
        // Cache successful responses for pages
        if (response.ok && !url.pathname.startsWith('/api/')) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone))
        }
        return response
      })
      .catch(() => {
        // Offline fallback
        return caches.match(request).then(cached => {
          if (cached) return cached
          // For navigation requests, show login page
          if (request.mode === 'navigate') {
            return caches.match(OFFLINE_URL)
          }
          return new Response('Offline', { status: 503 })
        })
      })
  )
})

// Handle push notifications (for future use)
self.addEventListener('push', event => {
  const data = event.data?.json() ?? {}
  const title   = data.title   ?? 'PSBC Work Immersion'
  const options = {
    body:    data.body    ?? 'You have a new notification',
    icon:    '/icon-192.png',
    badge:   '/icon-72.png',
    vibrate: [100, 50, 100],
    data:    { url: data.url ?? '/' },
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

// Open app when notification is clicked
self.addEventListener('notificationclick', event => {
  event.notification.close()
  const url = event.notification.data?.url ?? '/'
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(windowClients => {
      // Focus existing window if open
      for (const client of windowClients) {
        if (client.url === url && 'focus' in client) {
          return client.focus()
        }
      }
      // Open new window
      if (clients.openWindow) return clients.openWindow(url)
    })
  )
})
