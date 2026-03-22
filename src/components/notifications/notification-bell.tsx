'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useTempo } from '@/lib/store'
import {
  Bell, Check, CheckCheck, Info, AlertTriangle,
  MessageSquare, Clock, CircleCheck, ShieldAlert,
  AtSign, ThumbsUp, X
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface DemoNotification {
  id: string
  type: string
  title: string
  message: string
  link?: string | null
  is_read: boolean
  created_at: string
  sender_id?: string | null
}

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  info: { icon: Info, color: 'text-gray-500', bg: 'bg-gray-100' },
  success: { icon: CircleCheck, color: 'text-green-500', bg: 'bg-green-500/10' },
  warning: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  action_required: { icon: ShieldAlert, color: 'text-tempo-600', bg: 'bg-tempo-600/10' },
  mention: { icon: AtSign, color: 'text-gray-500', bg: 'bg-gray-100' },
  approval: { icon: ThumbsUp, color: 'text-gray-500', bg: 'bg-gray-100' },
  reminder: { icon: Clock, color: 'text-gray-500', bg: 'bg-gray-100' },
}

function getRelativeTime(dateStr: string): string {
  const now = Date.now()
  const date = new Date(dateStr).getTime()
  const diff = now - date
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function NotificationBell() {
  const router = useRouter()
  const t = useTranslations('notifications')
  const { notifications: storeNotifications, unreadNotificationCount, markNotificationRead, markAllNotificationsRead, platformEvents } = useTempo() as any
  const [isOpen, setIsOpen] = useState(false)
  const [apiNotifications, setApiNotifications] = useState<DemoNotification[]>([])
  const [apiUnreadCount, setApiUnreadCount] = useState<number | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Fetch from API (will silently fail in demo mode)
  const fetchFromApi = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications')
      if (res.ok) {
        const data = await res.json()
        if (data.notifications?.length) {
          setApiNotifications(data.notifications)
          setApiUnreadCount(data.unread_count ?? 0)
        }
      }
    } catch {
      // Use store data
    }
  }, [])

  useEffect(() => {
    fetchFromApi()
    const interval = setInterval(fetchFromApi, 30000)
    return () => clearInterval(interval)
  }, [fetchFromApi])

  // Convert platform events into notification format
  const platformNotifications: DemoNotification[] = (platformEvents || []).map((ev: any) => ({
    id: `pe-${ev.id}`,
    type: ev.type?.includes('alert') || ev.type?.includes('violation') ? 'warning' : ev.type?.includes('security') ? 'action_required' : 'info',
    title: `\u26A1 ${ev.title || ev.type}`,
    message: ev.data ? Object.values(ev.data).filter(Boolean).slice(0, 2).join(' - ') : '',
    link: null,
    is_read: false,
    created_at: ev.timestamp || new Date().toISOString(),
  }))

  // Decide which data source to use
  const baseNotifications: DemoNotification[] = apiNotifications.length > 0 ? apiNotifications : storeNotifications
  const notifications: DemoNotification[] = [...platformNotifications, ...baseNotifications]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 50)
  const unreadCount = (apiUnreadCount !== null ? apiUnreadCount : unreadNotificationCount) + platformNotifications.length

  // Close panel when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        panelRef.current && !panelRef.current.contains(event.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Close on escape
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsOpen(false)
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  const handleNotificationClick = async (notification: DemoNotification) => {
    if (!notification.is_read) {
      // Try API first
      try {
        await fetch('/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'mark_read', notificationId: notification.id }),
        })
      } catch {
        // fallback
      }
      // Update store
      markNotificationRead(notification.id)
      // Update local state
      setApiNotifications(prev =>
        prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n)
      )
      setApiUnreadCount(prev => prev !== null ? Math.max(0, prev - 1) : null)
    }
    if (notification.link) {
      router.push(notification.link)
      setIsOpen(false)
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_all_read' }),
      })
    } catch {
      // fallback
    }
    markAllNotificationsRead()
    setApiNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    setApiUnreadCount(0)
  }

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-t3 hover:text-t1 hover:bg-white rounded-lg transition-colors"
        aria-label={t('title')}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-tempo-600 text-white text-[0.6rem] font-bold rounded-full leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          ref={panelRef}
          className="absolute right-0 top-full mt-2 w-[380px] max-h-[440px] bg-white border border-border rounded-xl overflow-hidden z-50"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-divider">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-t1">{t('title')}</h3>
              {unreadCount > 0 && (
                <span className="bg-tempo-600/10 text-tempo-600 text-[0.65rem] font-semibold px-1.5 py-0.5 rounded-full">
                  {unreadCount} {t('new')}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-1 text-[0.7rem] text-t3 hover:text-tempo-600 transition-colors px-2 py-1 rounded-md hover:bg-canvas"
                >
                  <CheckCheck size={12} />
                  {t('markAllRead')}
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-t3 hover:text-t1 p-1 rounded-md hover:bg-canvas transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div className="overflow-y-auto max-h-[360px]">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <div className="w-10 h-10 rounded-full bg-canvas flex items-center justify-center mb-3">
                  <Bell size={18} className="text-t3" />
                </div>
                <p className="text-sm text-t2 font-medium">{t('empty')}</p>
                <p className="text-xs text-t3 mt-1">{t('emptyDescription')}</p>
              </div>
            ) : (
              notifications.map((notification) => {
                const config = TYPE_CONFIG[notification.type] || TYPE_CONFIG.info
                const Icon = config.icon
                return (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      'w-full flex items-start gap-3 px-4 py-3 text-left transition-colors border-b border-divider last:border-b-0',
                      notification.is_read
                        ? 'bg-white hover:bg-canvas/50'
                        : 'bg-tempo-600/[0.02] hover:bg-tempo-600/[0.05]'
                    )}
                  >
                    {/* Type indicator */}
                    <div className={cn('mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0', config.bg)}>
                      <Icon size={14} className={config.color} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn(
                          'text-[0.8rem] leading-tight truncate',
                          notification.is_read ? 'text-t2 font-normal' : 'text-t1 font-medium'
                        )}>
                          {notification.title}
                        </p>
                        {!notification.is_read && (
                          <div className="w-2 h-2 rounded-full bg-tempo-600 flex-shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-[0.7rem] text-t3 mt-0.5 line-clamp-2 leading-relaxed">
                        {notification.message}
                      </p>
                      <p className="text-[0.6rem] text-t3/60 mt-1">
                        {getRelativeTime(notification.created_at)}
                      </p>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
