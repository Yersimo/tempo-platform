'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'
import { TempoProvider, useTempo } from '@/lib/store'
import { ToastContainer } from '@/components/ui/toast'

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { currentUser, isLoading } = useTempo()
  const router = useRouter()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Wait for store to finish loading (which validates session via cookie)
    if (isLoading) return

    if (!currentUser) {
      // No valid session - middleware will redirect, but handle client nav too
      router.replace('/login')
    } else {
      setReady(true)
    }
  }, [currentUser, isLoading, router])

  if (isLoading || !ready) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-canvas">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-t3 text-sm">Loading Tempo...</span>
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
