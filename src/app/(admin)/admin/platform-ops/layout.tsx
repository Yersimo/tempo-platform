'use client'

import Link from 'next/link'
import {
  LayoutDashboard, Building2, BarChart3, AlertTriangle,
  HeadphonesIcon, Server, Database, Shield, LogOut,
} from 'lucide-react'

const navItems = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, href: '/admin/platform-ops' },
  { id: 'tenants', label: 'Tenants', icon: Building2, href: '/admin/platform-ops?tab=tenants' },
  { id: 'usage', label: 'Usage', icon: BarChart3, href: '/admin/platform-ops?tab=usage' },
  { id: 'alerts', label: 'Alerts', icon: AlertTriangle, href: '/admin/platform-ops?tab=alerts' },
  { id: 'support', label: 'Support', icon: HeadphonesIcon, href: '/admin/platform-ops?tab=support' },
  { id: 'system', label: 'System', icon: Server, href: '/admin/platform-ops?tab=system' },
  { id: 'backups', label: 'Backups', icon: Database, href: '/admin/platform-ops?tab=backups' },
]

export default function PlatformOpsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[calc(100vh-3rem)] -m-6 lg:-m-8 bg-gray-950 rounded-xl overflow-hidden border border-gray-800">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-[220px] flex-col border-r border-gray-800 bg-gray-900 text-gray-100">
        <div className="px-4 py-4 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <Shield size={18} className="text-amber-400" />
            <span className="font-semibold text-sm text-white">Platform Ops</span>
          </div>
          <p className="text-[0.6rem] text-gray-500 mt-0.5">Infrastructure & Support</p>
        </div>

        <nav className="flex-1 py-2 px-2 space-y-0.5">
          {navItems.map(item => (
            <Link
              key={item.id}
              href={item.href}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            >
              <item.icon size={14} />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="px-2 py-3 border-t border-gray-800">
          <Link
            href="/admin"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors"
          >
            <LogOut size={14} />
            Back to Admin
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 overflow-auto">
        {children}
      </main>
    </div>
  )
}
