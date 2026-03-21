// Tempo Service Worker v3 — Progressive Web App with Manager Experience
// Provides offline support, intelligent caching, push notifications, and background sync

const CACHE_VERSION = 'tempo-v3'
const STATIC_CACHE = `${CACHE_VERSION}-static`
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`
const IMAGE_CACHE = `${CACHE_VERSION}-images`
const API_CACHE = `${CACHE_VERSION}-api`
const PENDING_ACTIONS = 'tempo-pending-actions'

// Max items in dynamic cache to prevent unbounded growth
const DYNAMIC_CACHE_LIMIT = 50
const IMAGE_CACHE_LIMIT = 100
const API_CACHE_LIMIT = 30

// Core shell assets to precache
const PRECACHE_ASSETS = [
  '/dashboard',
  '/mobile',
  '/offline',
  '/manifest.json',
  '/favicons/favicon.svg',
  '/favicons/apple-touch-icon.png',
  '/app-icons/brand-192.png',
  '/app-icons/brand-512.png',
]

// API routes to cache for offline access
const CACHEABLE_API_ROUTES = [
  '/api/data/employees',
  '/api/data/leaveRequests',
  '/api/data/expenseReports',
  '/api/data/timeEntries',
  '/api/data/departments',
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
          .filter((key) => key.startsWith('tempo-') && !key.startsWith(CACHE_VERSION) && key !== PENDING_ACTIONS)
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

  // Skip Chrome extension, blob, data URLs
  if (!url.protocol.startsWith('http')) return

  // ── Strategy: API GET requests → Network-first with cache fallback ──
  if (url.pathname.startsWith('/api/') && request.method === 'GET') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(API_CACHE).then((cache) => {
              cache.put(request, clone)
              trimCache(API_CACHE, API_CACHE_LIMIT)
            })
          }
          return response
        })
        .catch(() => {
          return caches.match(request).then((cached) => {
            if (cached) return cached
            return new Response(JSON.stringify({ error: 'offline', cached: false }), {
              status: 503,
              headers: { 'Content-Type': 'application/json' },
            })
          })
        })
    )
    return
  }

  // ── Queue non-GET API requests when offline ──
  if (url.pathname.startsWith('/api/') && request.method !== 'GET') {
    event.respondWith(
      fetch(request).catch(async () => {
        // Store the action for later sync
        await queuePendingAction(request)
        return new Response(JSON.stringify({
          queued: true,
          message: 'Action queued for sync when back online',
        }), {
          status: 202,
          headers: { 'Content-Type': 'application/json' },
        })
      })
    )
    return
  }

  // Skip remaining non-GET requests
  if (request.method !== 'GET') return

  // ── Strategy: Navigation requests → Network first, offline fallback ──
  if (request.mode === 'navigate') {
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
        .catch(() => {
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

// ─── Queue pending actions for offline sync ───
async function queuePendingAction(request) {
  try {
    const body = await request.clone().text()
    const db = await openPendingDB()
    const tx = db.transaction('actions', 'readwrite')
    const store = tx.objectStore('actions')
    await new Promise((resolve, reject) => {
      const req = store.add({
        url: request.url,
        method: request.method,
        headers: Object.fromEntries(request.headers.entries()),
        body,
        timestamp: Date.now(),
      })
      req.onsuccess = resolve
      req.onerror = reject
    })
  } catch {
    // IndexedDB not available — fall back to cache API
    const cache = await caches.open(PENDING_ACTIONS)
    await cache.put(request.clone(), new Response('queued'))
  }
}

// ─── IndexedDB for pending actions ───
function openPendingDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('tempo-pending-sync', 1)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains('actions')) {
        db.createObjectStore('actions', { keyPath: 'id', autoIncrement: true })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

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
    data: { url: data.url || '/mobile', action: data.action || null },
    actions: data.actions || [
      { action: 'approve', title: 'Approve', icon: '/app-icons/brand-64.png' },
      { action: 'view', title: 'View', icon: '/app-icons/brand-64.png' },
    ],
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

  const url = event.notification.data?.url || '/mobile'

  // Handle action buttons from notification
  if (event.action === 'approve' && event.notification.data?.action) {
    event.waitUntil(
      fetch(event.notification.data.action, { method: 'POST' })
        .then(() => {
          return self.registration.showNotification('Tempo', {
            body: 'Approved successfully',
            icon: '/app-icons/brand-192.png',
            tag: 'tempo-action-result',
          })
        })
        .catch(() => {
          return self.clients.openWindow(url)
        })
    )
    return
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
  // Try IndexedDB first
  try {
    const db = await openPendingDB()
    const tx = db.transaction('actions', 'readonly')
    const store = tx.objectStore('actions')
    const actions = await new Promise((resolve) => {
      const req = store.getAll()
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => resolve([])
    })

    for (const action of actions) {
      try {
        await fetch(action.url, {
          method: action.method,
          headers: action.headers,
          body: action.body,
        })
        // Remove synced action
        const deleteTx = db.transaction('actions', 'readwrite')
        const deleteStore = deleteTx.objectStore('actions')
        deleteStore.delete(action.id)
      } catch {
        // Will retry on next sync
      }
    }

    // Notify clients about sync completion
    const clients = await self.clients.matchAll()
    clients.forEach((client) => {
      client.postMessage({ type: 'SYNC_COMPLETE', count: actions.length })
    })
  } catch {
    // Fall back to cache-based pending actions
    try {
      const cache = await caches.open(PENDING_ACTIONS)
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
}

// ─── Periodic background sync (if supported) ───
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'tempo-refresh') {
    event.waitUntil(
      caches.open(API_CACHE).then((cache) => {
        return Promise.allSettled(
          CACHEABLE_API_ROUTES.map((route) =>
            fetch(route).then((response) => {
              if (response.ok) cache.put(route, response)
            })
          )
        )
      })
    )
  }
})

// ─── Message handler for client communication ───
self.addEventListener('message', (event) => {
  if (event.data?.type === 'GET_PENDING_COUNT') {
    openPendingDB()
      .then((db) => {
        const tx = db.transaction('actions', 'readonly')
        const store = tx.objectStore('actions')
        return new Promise((resolve) => {
          const req = store.count()
          req.onsuccess = () => resolve(req.result)
          req.onerror = () => resolve(0)
        })
      })
      .then((count) => {
        event.source.postMessage({ type: 'PENDING_COUNT', count })
      })
      .catch(() => {
        event.source.postMessage({ type: 'PENDING_COUNT', count: 0 })
      })
  }

  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
