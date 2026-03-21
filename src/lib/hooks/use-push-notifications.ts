'use client'

import { useState, useEffect, useCallback } from 'react'

interface PushNotificationState {
  isSupported: boolean
  permission: NotificationPermission | 'default'
  isSubscribed: boolean
  subscription: PushSubscription | null
}

// VAPID public key — in production this would come from env
const VAPID_PUBLIC_KEY = 'BPlaceholder-vapid-public-key-for-demo-purposes-only'

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = typeof atob !== 'undefined' ? atob(base64) : Buffer.from(base64, 'base64').toString('binary')
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export function usePushNotifications() {
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    permission: 'default',
    isSubscribed: false,
    subscription: null,
  })

  useEffect(() => {
    const isSupported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
    if (!isSupported) return

    setState((prev) => ({
      ...prev,
      isSupported: true,
      permission: Notification.permission,
    }))

    // Check existing subscription
    navigator.serviceWorker.ready.then((registration) => {
      registration.pushManager.getSubscription().then((subscription) => {
        setState((prev) => ({
          ...prev,
          isSubscribed: !!subscription,
          subscription,
        }))
      })
    })
  }, [])

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported) return false

    try {
      const permission = await Notification.requestPermission()
      setState((prev) => ({ ...prev, permission }))
      return permission === 'granted'
    } catch {
      return false
    }
  }, [state.isSupported])

  const subscribe = useCallback(async (): Promise<PushSubscription | null> => {
    if (!state.isSupported) return null

    try {
      const permission = await requestPermission()
      if (!permission) return null

      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
      })

      // Send subscription to server
      try {
        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subscription: subscription.toJSON(),
          }),
        })
      } catch {
        // Server may not have push endpoint yet — subscription is still valid client-side
      }

      setState((prev) => ({
        ...prev,
        isSubscribed: true,
        subscription,
      }))

      return subscription
    } catch {
      return null
    }
  }, [state.isSupported, requestPermission])

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!state.subscription) return false

    try {
      await state.subscription.unsubscribe()

      // Notify server
      try {
        await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            endpoint: state.subscription.endpoint,
          }),
        })
      } catch {
        // Best effort
      }

      setState((prev) => ({
        ...prev,
        isSubscribed: false,
        subscription: null,
      }))
      return true
    } catch {
      return false
    }
  }, [state.subscription])

  const sendTestNotification = useCallback(async () => {
    if (!state.isSupported || Notification.permission !== 'granted') return

    const registration = await navigator.serviceWorker.ready
    await registration.showNotification('Tempo', {
      body: 'Push notifications are working!',
      icon: '/app-icons/brand-192.png',
      badge: '/app-icons/brand-64.png',
      tag: 'tempo-test',
      data: { url: '/mobile' },
    })
  }, [state.isSupported])

  return {
    ...state,
    requestPermission,
    subscribe,
    unsubscribe,
    sendTestNotification,
  }
}

/**
 * Hook to listen for service worker sync messages
 */
export function useSyncStatus() {
  const [pendingCount, setPendingCount] = useState(0)
  const [lastSynced, setLastSynced] = useState<Date | null>(null)

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'SYNC_COMPLETE') {
        setPendingCount(0)
        setLastSynced(new Date())
      }
      if (event.data?.type === 'PENDING_COUNT') {
        setPendingCount(event.data.count)
      }
    }

    navigator.serviceWorker.addEventListener('message', handleMessage)

    // Request current pending count
    navigator.serviceWorker.ready.then((registration) => {
      registration.active?.postMessage({ type: 'GET_PENDING_COUNT' })
    })

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage)
    }
  }, [])

  return { pendingCount, lastSynced }
}
