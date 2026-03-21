'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'
import { TempoProvider, useTempo } from '@/lib/store'
import { ToastContainer } from '@/components/ui/toast'
import { ImpersonationBanner } from '@/components/admin/impersonation-banner'
import { ErrorBoundary } from '@/components/error-boundary'
import { SessionTimeout } from '@/components/session-timeout'
import { Skeleton } from '@/components/ui/skeleton'
import { HelpProvider } from '@/lib/help-context'
import { HelpPanel } from '@/components/help/help-panel'
import { HelpButton } from '@/components/help/help-button'
import { OnboardingTour } from '@/components/help/onboarding-tour'
import { SupportWidget } from '@/components/support/support-widget'

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
      <div className="flex min-h-screen bg-canvas">
        {/* Sidebar skeleton */}
        <div className="hidden lg:flex w-[260px] flex-col border-r border-border bg-card p-4 gap-3">
          <Skeleton height="h-8" width="w-28" className="mb-4" />
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} height="h-8" width={i % 3 === 0 ? 'w-3/4' : 'w-full'} className="rounded-lg" />
          ))}
        </div>
        {/* Main content skeleton */}
        <main className="flex-1 min-w-0 p-6 lg:p-8">
          <div className="max-w-[1400px] space-y-6 animate-in fade-in duration-300">
            <div className="space-y-2">
              <Skeleton height="h-7" width="w-48" />
              <Skeleton height="h-4" width="w-72" className="opacity-60" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} height="h-24" className="rounded-xl" />
              ))}
            </div>
            <Skeleton height="h-[400px]" className="rounded-xl" />
          </div>
        </main>
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
        <HelpProvider>
          <ImpersonationBanner />
          <SessionTimeout />
          <div className="flex min-h-screen bg-canvas">
            <Sidebar />
            <main className="flex-1 min-w-0">
              <div className="p-6 lg:p-8 pb-24 lg:pb-8 max-w-[1400px]">
                <ErrorBoundary module="Platform">
                  {children}
                </ErrorBoundary>
              </div>
            </main>
          </div>
          <HelpPanel />
          <HelpButton />
          <SupportWidget />
          <OnboardingTour />
          <ToastContainer />
        </HelpProvider>
      </AuthGuard>
    </TempoProvider>
  )
}
