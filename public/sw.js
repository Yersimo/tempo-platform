// Tempo Service Worker v2 — Progressive Web App
// Provides offline support, intelligent caching, and push notifications

const CACHE_VERSION = 'tempo-v2'
const STATIC_CACHE = `${CACHE_VERSION}-static`
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`
const IMAGE_CACHE = `${CACHE_VERSION}-images`

// Max items in dynamic cache to prevent unbounded growth
const DYNAMIC_CACHE_LIMIT = 50
const IMAGE_CACHE_LIMIT = 100

// Core shell assets to precache
const PRECACHE_ASSETS = [
  '/dashboard',
  '/offline',
  '/manifest.json',
  '/favicons/favicon.svg',
  '/favicons/apple-touch-icon.png',
  '/app-icons/brand-192.png',
  '/app-icons/brand-512.png',
]

// ─── Install: precache core shell ───
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  )
})

// ─── Activate: clean old caches ───
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key.startsWith('tempo-') && !key.startsWith(CACHE_VERSION))
          .map((key) => caches.delete(key))
      )
    }).then(() => self.clients.claim())
  )
})

// ─── Trim cache helper ───
async function trimCache(cacheName, maxItems) {
  const cache = await caches.open(cacheName)
  const keys = await cache.keys()
  if (keys.length > maxItems) {
    await cache.delete(keys[0])
    return trimCache(cacheName, maxItems)
  }
}

// ─── Fetch: intelligent caching strategies ───
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') return

  // Skip API calls — always network
  if (url.pathname.startsWith('/api/')) return

  // Skip Chrome extension, blob, data URLs
  if (!url.protocol.startsWith('http')) return

  // ── Strategy: Navigation requests → Network first, offline fallback ──
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful navigation responses
          if (response.ok) {
            const clone = response.clone()
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, clone)
              trimCache(DYNAMIC_CACHE, DYNAMIC_CACHE_LIMIT)
            })
          }
          return response
        })
        .catch(() => {
          // Try dynamic cache first, then static, then offline page
          return caches.match(request)
            .then((cached) => cached || caches.match('/offline'))
        })
    )
    return
  }

  // ── Strategy: Images → Cache first, network fallback ──
  if (request.destination === 'image' || url.pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|ico)$/)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(IMAGE_CACHE).then((cache) => {
              cache.put(request, clone)
              trimCache(IMAGE_CACHE, IMAGE_CACHE_LIMIT)
            })
          }
          return response
        }).catch(() => new Response('', { status: 404 }))
      })
    )
    return
  }

  // ── Strategy: Fonts → Cache first, long-lived ──
  if (url.pathname.match(/\.(woff2?|ttf|otf|eot)$/) || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone))
          }
          return response
        })
      })
    )
    return
  }

  // ── Strategy: CSS/JS → Stale-while-revalidate ──
  if (url.pathname.match(/\.(css|js)$/) || url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const networkFetch = fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone))
          }
          return response
        })
        return cached || networkFetch
      })
    )
    return
  }

  // ── Default: Network first with dynamic cache ──
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone()
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, clone)
            trimCache(DYNAMIC_CACHE, DYNAMIC_CACHE_LIMIT)
          })
        }
        return response
      })
      .catch(() => caches.match(request))
  )
})

// ─── Push notifications ───
self.addEventListener('push', (event) => {
  if (!event.data) return

  let data
  try {
    data = event.data.json()
  } catch {
    data = { title: 'Tempo', body: event.data.text() }
  }

  const options = {
    body: data.body || '',
    icon: '/app-icons/brand-192.png',
    badge: '/app-icons/brand-64.png',
    tag: data.tag || 'tempo-notification',
    data: { url: data.url || '/dashboard' },
    actions: data.actions || [],
    vibrate: [100, 50, 100],
    requireInteraction: data.requireInteraction || false,
    renotify: !!data.tag,
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'Tempo', options)
  )
})

// ─── Notification click ───
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const url = event.notification.data?.url || '/dashboard'

  // Handle action buttons
  if (event.action === 'approve') {
    // Could POST to API for quick approve from notification
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus()
        }
      }
      return self.clients.openWindow(url)
    })
  )
})

// ─── Background sync for offline actions ───
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-pending-actions') {
    event.waitUntil(syncPendingActions())
  }
})

async function syncPendingActions() {
  try {
    const cache = await caches.open('tempo-pending')
    const keys = await cache.keys()
    for (const request of keys) {
      try {
        await fetch(request.clone())
        await cache.delete(request)
      } catch {
        // Will retry on next sync
      }
    }
  } catch {
    // Pending cache doesn't exist yet
  }
}

// ─── Periodic background sync (if supported) ───
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'tempo-refresh') {
    event.waitUntil(
      // Refresh key pages in cache
      caches.open(DYNAMIC_CACHE).then((cache) => {
        return Promise.allSettled([
          cache.add('/dashboard'),
        ])
      })
    )
  }
})
