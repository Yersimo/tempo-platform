'use client'

import { Search } from 'lucide-react'
import { NotificationBell } from '@/components/notifications'

interface HeaderProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

export function Header({ title, subtitle, actions }: HeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-xl font-semibold text-t1 tracking-tight">{title}</h1>
        {subtitle && <p className="text-xs text-t3 mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        {actions}
        <NotificationBell />
        <div className="hidden md:flex items-center gap-2 bg-white border border-border rounded-lg px-3 py-1.5 text-xs text-t3 w-64">
          <Search size={14} />
          <span>Search anything...</span>
          <span className="ml-auto text-[0.6rem] border border-divider rounded px-1.5 py-0.5">&#x2318;K</span>
        </div>
      </div>
    </div>
  )
}
