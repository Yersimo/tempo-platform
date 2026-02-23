'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

export interface Notification {
  id: string
  type: string
  channel: string
  title: string
  message: string
  link: string | null
  entity_type: string | null
  entity_id: string | null
  is_read: boolean
  read_at: string | null
  sender_id: string | null
  created_at: string
}

interface UseNotificationsOptions {
  pollInterval?: number // ms, default 30000
  enabled?: boolean
}

export function useNotifications(options: UseNotificationsOptions = {}) {
  const { pollInterval = 30000, enabled = true } = options
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications')
      if (!res.ok) {
        // If API is not available (demo mode), silently fail
        if (res.status === 401) return
        return
      }
      const data = await res.json()
      setNotifications(data.notifications || [])
      setUnreadCount(data.unread_count || 0)
    } catch {
      // Silently fail - will use store/demo data
    } finally {
      setIsLoading(false)
    }
  }, [])

  const markAsRead = useCallback(async (notificationId: string) => {
    // Optimistic update
    setNotifications(prev =>
      prev.map(n =>
        n.id === notificationId
          ? { ...n, is_read: true, read_at: new Date().toISOString() }
          : n
      )
    )
    setUnreadCount(prev => Math.max(0, prev - 1))

    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_read', notificationId }),
      })
    } catch {
      // Revert on failure
      fetchNotifications()
    }
  }, [fetchNotifications])

  const markAllAsRead = useCallback(async () => {
    // Optimistic update
    setNotifications(prev =>
      prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
    )
    setUnreadCount(0)

    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_all_read' }),
      })
    } catch {
      // Revert on failure
      fetchNotifications()
    }
  }, [fetchNotifications])

  const refresh = useCallback(() => {
    fetchNotifications()
  }, [fetchNotifications])

  // Initial fetch
  useEffect(() => {
    if (!enabled) return
    fetchNotifications()
  }, [enabled, fetchNotifications])

  // Polling
  useEffect(() => {
    if (!enabled || pollInterval <= 0) return

    intervalRef.current = setInterval(fetchNotifications, pollInterval)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [enabled, pollInterval, fetchNotifications])

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    refresh,
  }
}
