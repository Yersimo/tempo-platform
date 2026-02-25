'use client'

import { useState, useEffect, useCallback, useRef, createContext, useContext, useMemo } from 'react'
import type { ReactNode } from 'react'
import { createBrowserClient } from '@supabase/ssr'

// ─── Types ──────────────────────────────────────────────────────────

type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE'

interface RealtimePayload<T = Record<string, unknown>> {
  eventType: RealtimeEvent
  new: T
  old: T
  table: string
  schema: string
  commit_timestamp: string
}

interface UseRealtimeOptions<T = Record<string, unknown>> {
  table: string
  schema?: string
  event?: RealtimeEvent | '*'
  filter?: string
  onInsert?: (record: T) => void
  onUpdate?: (record: T, old: T) => void
  onDelete?: (old: T) => void
  onChange?: (payload: RealtimePayload<T>) => void
  enabled?: boolean
}

interface UsePresenceOptions {
  channel: string
  userData: { id: string; name: string; avatar?: string }
}

export interface PresenceUser {
  id: string
  name: string
  avatar?: string
  lastSeen: string
  status: 'online' | 'away'
}

interface NotificationRecord {
  id: string
  org_id: string
  recipient_id: string
  type: string
  channel: string
  title: string
  message: string
  link: string | null
  is_read: boolean
  created_at: string
  sender_id: string | null
}

// ─── Helpers ────────────────────────────────────────────────────────

function isSupabaseConfigured(): boolean {
  try {
    return Boolean(
      typeof window !== 'undefined' &&
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
  } catch {
    return false
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _sharedClient: any | null | undefined

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getSharedClient(): any | null {
  if (_sharedClient !== undefined) return _sharedClient
  if (!isSupabaseConfigured()) {
    _sharedClient = null
    return null
  }
  try {
    _sharedClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    return _sharedClient
  } catch {
    _sharedClient = null
    return null
  }
}

const AWAY_THRESHOLD_MS = 2 * 60 * 1000
const HEARTBEAT_INTERVAL_MS = 30 * 1000

// ─── useRealtimeSubscription ────────────────────────────────────────

export function useRealtimeSubscription<T = Record<string, unknown>>(
  options: UseRealtimeOptions<T>
): { isConnected: boolean; error: string | null } {
  const {
    table, schema = 'public', event = '*', filter,
    onInsert, onUpdate, onDelete, onChange, enabled = true,
  } = options

  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const channelRef = useRef<any>(null)

  const onInsertRef = useRef(onInsert)
  const onUpdateRef = useRef(onUpdate)
  const onDeleteRef = useRef(onDelete)
  const onChangeRef = useRef(onChange)

  useEffect(() => {
    onInsertRef.current = onInsert
    onUpdateRef.current = onUpdate
    onDeleteRef.current = onDelete
    onChangeRef.current = onChange
  })

  useEffect(() => {
    if (!enabled) {
      setIsConnected(false)
      setError(null)
      return
    }

    const supabase = getSharedClient()
    if (!supabase) {
      setIsConnected(false)
      setError(null)
      return
    }

    let cancelled = false

    try {
      const channelName = `realtime:${table}:${filter || 'all'}`
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pgFilter: any = { event, schema, table }
      if (filter) pgFilter.filter = filter

      const channel = supabase
        .channel(channelName)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .on('postgres_changes' as any, pgFilter, (payload: any) => {
          if (cancelled) return
          const typed: RealtimePayload<T> = {
            eventType: payload.eventType,
            new: payload.new as T,
            old: payload.old as T,
            table: payload.table,
            schema: payload.schema,
            commit_timestamp: payload.commit_timestamp,
          }
          switch (typed.eventType) {
            case 'INSERT': onInsertRef.current?.(typed.new); break
            case 'UPDATE': onUpdateRef.current?.(typed.new, typed.old); break
            case 'DELETE': onDeleteRef.current?.(typed.old); break
          }
          onChangeRef.current?.(typed)
        })
        .subscribe((status: string, err?: Error) => {
          if (cancelled) return
          if (status === 'SUBSCRIBED') { setIsConnected(true); setError(null) }
          else if (status === 'CHANNEL_ERROR') { setIsConnected(false); setError(err?.message || 'Channel error') }
          else if (status === 'TIMED_OUT') { setIsConnected(false); setError('Subscription timed out') }
          else if (status === 'CLOSED') { setIsConnected(false) }
        })

      channelRef.current = channel
    } catch (err: unknown) {
      setIsConnected(false)
      setError(err instanceof Error ? err.message : 'Failed to subscribe')
    }

    return () => {
      cancelled = true
      try {
        if (channelRef.current) {
          const supabase = getSharedClient()
          supabase?.removeChannel(channelRef.current)
          channelRef.current = null
        }
      } catch { /* cleanup */ }
      setIsConnected(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, schema, event, filter, enabled])

  return { isConnected, error }
}

// ─── usePresence ────────────────────────────────────────────────────

export function usePresence(options: UsePresenceOptions): {
  onlineUsers: PresenceUser[]
  isConnected: boolean
} {
  const { channel: channelName, userData } = options
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([])
  const [isConnected, setIsConnected] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const channelRef = useRef<any>(null)
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const userDataRef = useRef(userData)

  useEffect(() => { userDataRef.current = userData })

  useEffect(() => {
    const supabase = getSharedClient()
    if (!supabase) { setIsConnected(false); return }

    let cancelled = false

    try {
      const channel = supabase.channel(channelName, {
        config: { presence: { key: userData.id } },
      })

      channel
        .on('presence', { event: 'sync' }, () => {
          if (cancelled) return
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const state = channel.presenceState() as Record<string, any[]>
          const now = Date.now()
          const users: PresenceUser[] = []

          for (const presences of Object.values(state)) {
            const presence = presences[0]
            if (!presence?.id) continue
            const lastSeenTs = new Date(presence.lastSeen).getTime()
            users.push({
              id: presence.id,
              name: presence.name,
              avatar: presence.avatar,
              lastSeen: presence.lastSeen,
              status: now - lastSeenTs > AWAY_THRESHOLD_MS ? 'away' : 'online',
            })
          }
          setOnlineUsers(users)
        })
        .subscribe(async (status: string) => {
          if (cancelled) return
          if (status === 'SUBSCRIBED') {
            setIsConnected(true)
            try {
              await channel.track({
                id: userDataRef.current.id,
                name: userDataRef.current.name,
                avatar: userDataRef.current.avatar,
                lastSeen: new Date().toISOString(),
              })
            } catch { /* ignore */ }
            heartbeatRef.current = setInterval(async () => {
              if (cancelled) return
              try {
                await channel.track({
                  id: userDataRef.current.id,
                  name: userDataRef.current.name,
                  avatar: userDataRef.current.avatar,
                  lastSeen: new Date().toISOString(),
                })
              } catch { /* ignore */ }
            }, HEARTBEAT_INTERVAL_MS)
          } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
            setIsConnected(false)
          }
        })

      channelRef.current = channel
    } catch { setIsConnected(false) }

    return () => {
      cancelled = true
      if (heartbeatRef.current) { clearInterval(heartbeatRef.current); heartbeatRef.current = null }
      try {
        if (channelRef.current) {
          const supabase = getSharedClient()
          supabase?.removeChannel(channelRef.current)
          channelRef.current = null
        }
      } catch { /* cleanup */ }
      setIsConnected(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelName, userData.id])

  return { onlineUsers, isConnected }
}

// ─── useNotificationRealtime ────────────────────────────────────────

export function useNotificationRealtime(
  orgId: string,
  recipientId: string
): {
  latestNotification: NotificationRecord | null
  newCount: number
  resetCount: () => void
  isConnected: boolean
} {
  const [latestNotification, setLatestNotification] = useState<NotificationRecord | null>(null)
  const [newCount, setNewCount] = useState(0)

  const resetCount = useCallback(() => setNewCount(0), [])

  const supabaseAvailable = isSupabaseConfigured()

  const handleInsert = useCallback((record: NotificationRecord) => {
    if (record.recipient_id !== recipientId) return
    setLatestNotification(record)
    setNewCount(prev => prev + 1)
  }, [recipientId])

  const { isConnected } = useRealtimeSubscription<NotificationRecord>({
    table: 'notifications',
    filter: `org_id=eq.${orgId}`,
    event: 'INSERT',
    enabled: supabaseAvailable && Boolean(orgId) && Boolean(recipientId),
    onInsert: handleInsert,
  })

  // Polling fallback when Supabase not configured
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastPollRef = useRef<string>(new Date().toISOString())

  useEffect(() => {
    if (supabaseAvailable || !orgId || !recipientId) return
    let cancelled = false

    const poll = async () => {
      try {
        const res = await fetch(`/api/notifications?since=${encodeURIComponent(lastPollRef.current)}`)
        if (!res.ok) return
        const data = await res.json()
        const notifications: NotificationRecord[] = data.notifications || []
        if (notifications.length > 0 && !cancelled) {
          setLatestNotification(notifications[0])
          setNewCount(prev => prev + notifications.length)
          lastPollRef.current = notifications[0].created_at
        }
      } catch { /* silent */ }
    }

    poll()
    pollingRef.current = setInterval(poll, 30_000)

    return () => {
      cancelled = true
      if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null }
    }
  }, [supabaseAvailable, orgId, recipientId])

  return { latestNotification, newCount, resetCount, isConnected }
}

// ─── RealtimeProvider ───────────────────────────────────────────────

interface RealtimeContextValue {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any | null
  isConnected: boolean
  orgId: string
}

const RealtimeContext = createContext<RealtimeContextValue>({
  supabase: null,
  isConnected: false,
  orgId: '',
})

export function useRealtimeContext(): RealtimeContextValue {
  return useContext(RealtimeContext)
}

interface RealtimeProviderProps {
  children: ReactNode
  orgId: string
}

export function RealtimeProvider({ children, orgId }: RealtimeProviderProps) {
  const [isConnected, setIsConnected] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const channelRef = useRef<any>(null)
  const supabase = useMemo(() => getSharedClient(), [])

  useEffect(() => {
    if (!supabase || !orgId) { setIsConnected(false); return }
    let cancelled = false

    try {
      const channel = supabase
        .channel(`org:${orgId}:heartbeat`)
        .subscribe((status: string) => {
          if (!cancelled) setIsConnected(status === 'SUBSCRIBED')
        })
      channelRef.current = channel
    } catch { setIsConnected(false) }

    return () => {
      cancelled = true
      try {
        if (channelRef.current) {
          supabase.removeChannel(channelRef.current)
          channelRef.current = null
        }
      } catch { /* cleanup */ }
      setIsConnected(false)
    }
  }, [supabase, orgId])

  const value = useMemo<RealtimeContextValue>(
    () => ({ supabase, isConnected, orgId }),
    [supabase, isConnected, orgId]
  )

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  )
}

export type {
  RealtimeEvent, RealtimePayload, UseRealtimeOptions,
  UsePresenceOptions, NotificationRecord, RealtimeProviderProps,
}
