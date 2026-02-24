'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { AdminProvider, useAdmin } from '@/lib/admin-store'
import { AdminSidebar } from '@/components/admin/admin-sidebar'

function AdminGuard({ children }: { children: React.ReactNode }) {
  const { adminUser, isLoading } = useAdmin()
  const router = useRouter()
  const pathname = usePathname()
  const [ready, setReady] = useState(false)
  const hasRedirected = useRef(false)

  useEffect(() => {
    if (isLoading) return

    // Login page doesn't need auth guard
    if (pathname === '/admin/login') {
      setReady(true)
      return
    }

    if (!adminUser) {
      if (hasRedirected.current) return
      hasRedirected.current = true
      router.push('/admin/login')
    } else {
      setReady(true)
    }
  }, [adminUser, isLoading, router, pathname])

  if (isLoading || !ready) {
    // Login page shows immediately
    if (pathname === '/admin/login') {
      return <>{children}</>
    }
    return (
      <div className="flex items-center justify-center min-h-screen bg-canvas">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-2 border-border" />
            <div className="absolute inset-0 w-12 h-12 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-t1">Loading Admin Console</p>
            <p className="text-xs text-t3 mt-1">Verifying credentials...</p>
          </div>
        </div>
      </div>
    )
  }

  // Login page has no sidebar
  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  return (
    <div className="flex min-h-screen bg-canvas">
      <AdminSidebar />
      <main className="flex-1 min-w-0">
        <div className="p-6 lg:p-8 max-w-[1400px]">
          {children}
        </div>
      </main>
    </div>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminProvider>
      <AdminGuard>
        {children}
      </AdminGuard>
    </AdminProvider>
  )
}
