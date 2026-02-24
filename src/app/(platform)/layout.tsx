'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'
import { TempoProvider, useTempo } from '@/lib/store'
import { ToastContainer } from '@/components/ui/toast'

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { currentUser, isLoading } = useTempo()
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const hasRedirected = useRef(false)

  useEffect(() => {
    // Wait for store to finish loading (which validates session via cookie)
    if (isLoading) return

    if (!currentUser) {
      // Prevent redirect loops: only redirect once
      if (hasRedirected.current) return
      hasRedirected.current = true

      // Clear the session cookie from the client side to prevent
      // middleware from redirecting back to /dashboard
      document.cookie = 'tempo_session=;path=/;max-age=0'
      try { localStorage.removeItem('tempo_current_user') } catch { /* ignore */ }

      // Small delay to ensure cookie is cleared before navigation
      setTimeout(() => {
        window.location.href = '/login'
      }, 100)
    } else {
      setReady(true)
    }
  }, [currentUser, isLoading, router])

  if (isLoading || !ready) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-canvas">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-2 border-border" />
            <div className="absolute inset-0 w-12 h-12 rounded-full border-2 border-tempo-600 border-t-transparent animate-spin" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-t1">Loading Tempo</p>
            <p className="text-xs text-t3 mt-1">Preparing your workspace...</p>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <TempoProvider>
      <AuthGuard>
        <div className="flex min-h-screen bg-canvas">
          <Sidebar />
          <main className="flex-1 min-w-0">
            <div className="p-6 lg:p-8 pb-24 lg:pb-8 max-w-[1400px]">
              {children}
            </div>
          </main>
        </div>
        <ToastContainer />
      </AuthGuard>
    </TempoProvider>
  )
}
