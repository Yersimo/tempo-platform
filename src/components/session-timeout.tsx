'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Clock } from 'lucide-react'

const SESSION_TIMEOUT_MS = 30 * 60 * 1000 // 30 minutes
const WARNING_BEFORE_MS = 2 * 60 * 1000   // Show warning 2 min before
const CHECK_INTERVAL_MS = 30 * 1000       // Check every 30 seconds
const THROTTLE_MS = 60 * 1000             // Throttle activity updates to 1/min

const PUBLIC_PATHS = ['/login', '/signup', '/demo', '/admin/login', '/academy/login', '/', '/privacy', '/terms', '/security']

export function SessionTimeout() {
  const router = useRouter()
  const pathname = usePathname()
  const [showWarning, setShowWarning] = useState(false)
  const [countdown, setCountdown] = useState(120)
  const lastActivityRef = useRef(Date.now())
  const throttleRef = useRef(0)

  const isPublicRoute = PUBLIC_PATHS.some(p => pathname === p || pathname?.startsWith('/academy/login'))

  const updateActivity = useCallback(() => {
    const now = Date.now()
    if (now - throttleRef.current < THROTTLE_MS) return
    throttleRef.current = now
    lastActivityRef.current = now
    sessionStorage.setItem('tempo_last_activity', String(now))
    setShowWarning(false)
  }, [])

  const handleLogout = useCallback(async () => {
    try {
      await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout' }),
      })
    } catch { /* proceed to redirect regardless */ }
    sessionStorage.removeItem('tempo_last_activity')
    router.push('/login?reason=timeout')
  }, [router])

  const handleStayLoggedIn = useCallback(() => {
    lastActivityRef.current = Date.now()
    sessionStorage.setItem('tempo_last_activity', String(Date.now()))
    throttleRef.current = 0
    setShowWarning(false)
  }, [])

  useEffect(() => {
    if (isPublicRoute) return

    // Restore last activity from sessionStorage
    const stored = sessionStorage.getItem('tempo_last_activity')
    if (stored) {
      lastActivityRef.current = Number(stored)
    } else {
      lastActivityRef.current = Date.now()
      sessionStorage.setItem('tempo_last_activity', String(Date.now()))
    }

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'] as const
    events.forEach(e => document.addEventListener(e, updateActivity, { passive: true }))

    const interval = setInterval(() => {
      const elapsed = Date.now() - lastActivityRef.current
      const remaining = SESSION_TIMEOUT_MS - elapsed

      if (remaining <= 0) {
        handleLogout()
      } else if (remaining <= WARNING_BEFORE_MS) {
        setShowWarning(true)
        setCountdown(Math.ceil(remaining / 1000))
      }
    }, CHECK_INTERVAL_MS)

    // Faster countdown update when warning is showing
    const countdownInterval = setInterval(() => {
      const elapsed = Date.now() - lastActivityRef.current
      const remaining = SESSION_TIMEOUT_MS - elapsed
      if (remaining <= 0) {
        handleLogout()
      } else if (remaining <= WARNING_BEFORE_MS) {
        setCountdown(Math.ceil(remaining / 1000))
      }
    }, 1000)

    return () => {
      events.forEach(e => document.removeEventListener(e, updateActivity))
      clearInterval(interval)
      clearInterval(countdownInterval)
    }
  }, [isPublicRoute, updateActivity, handleLogout])

  if (isPublicRoute || !showWarning) return null

  const minutes = Math.floor(countdown / 60)
  const seconds = countdown % 60

  return (
    <Modal open={showWarning} onClose={handleStayLoggedIn} title="Session Expiring Soon" size="sm">
      <div className="flex flex-col items-center gap-4 py-4">
        <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
          <Clock className="w-6 h-6 text-amber-600" />
        </div>
        <p className="text-sm text-gray-600 text-center">
          Your session will expire due to inactivity in
        </p>
        <p className="text-2xl font-mono font-bold text-gray-900">
          {minutes}:{seconds.toString().padStart(2, '0')}
        </p>
        <p className="text-xs text-gray-500 text-center">
          Click below or interact with the page to stay logged in.
        </p>
        <div className="flex gap-3 w-full">
          <Button variant="outline" onClick={handleLogout} className="flex-1">
            Log Out
          </Button>
          <Button onClick={handleStayLoggedIn} className="flex-1">
            Stay Logged In
          </Button>
        </div>
      </div>
    </Modal>
  )
}
