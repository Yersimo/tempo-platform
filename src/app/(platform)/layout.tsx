'use client'

import { Sidebar } from '@/components/layout/sidebar'
import { TempoProvider } from '@/lib/store'
import { ToastContainer } from '@/components/ui/toast'

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <TempoProvider>
      <div className="flex min-h-screen bg-canvas">
        <Sidebar />
        <main className="flex-1 min-w-0">
          <div className="p-6 lg:p-8 pb-24 lg:pb-8 max-w-[1400px]">
            {children}
          </div>
        </main>
      </div>
      <ToastContainer />
    </TempoProvider>
  )
}
