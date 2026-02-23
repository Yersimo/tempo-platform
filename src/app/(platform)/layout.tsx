'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'
import { TempoProvider, useTempo } from '@/lib/store'
import { ToastContainer } from '@/components/ui/toast'

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useTempo()
  const router = useRouter()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    // Check localStorage directly for SSR safety
    const stored = localStorage.getItem('tempo_current_user')
    if (!stored && !isLoggedIn) {
      router.replace('/login')
    } else {
      setChecked(true)
    }
  }, [isLoggedIn, router])

  if (!checked) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-canvas">
        <div className="animate-pulse text-t3 text-sm">Loading...</div>
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
