'use client'

import { Search } from 'lucide-react'
import { NotificationBell } from '@/components/notifications'
import { Breadcrumb } from '@/components/ui/breadcrumb'

interface HeaderProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
  hideBreadcrumb?: boolean
}

export function Header({ title, subtitle, actions, hideBreadcrumb }: HeaderProps) {
  const openCommandPalette = () => {
    // Dispatch Cmd+K to open the command palette already registered in sidebar
    const event = new KeyboardEvent('keydown', {
      key: 'k',
      metaKey: true,
      ctrlKey: navigator.platform.toLowerCase().includes('win'),
      bubbles: true,
    })
    document.dispatchEvent(event)
  }

  return (
    <div className="mb-6">
      {!hideBreadcrumb && <Breadcrumb />}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-t1 tracking-tight">{title}</h1>
          {subtitle && <p className="text-xs text-t3 mt-0.5">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-3">
          {actions}
          <NotificationBell />
          <button
            onClick={openCommandPalette}
            className="hidden md:flex items-center gap-2 bg-white border border-border rounded-lg px-3 py-1.5 text-xs text-t3 w-64 hover:border-tempo-300 hover:shadow-sm transition-all cursor-pointer"
          >
            <Search size={14} />
            <span>Search anything...</span>
            <span className="ml-auto text-[0.6rem] border border-divider rounded px-1.5 py-0.5">&#x2318;K</span>
          </button>
        </div>
      </div>
    </div>
  )
}
