'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils/cn'
import { TempoLockup } from '@/components/brand/tempo-lockup'
import { useAdmin } from '@/lib/admin-store'
import {
  LayoutDashboard, Building2, ChevronLeft, Menu, LogOut, Shield,
  Users, Package, Settings, UserPlus,
} from 'lucide-react'

interface NavGroup {
  title: string
  items: { label: string; href: string; icon: React.ReactNode; badge?: number }[]
}

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { adminUser, logoutAdmin } = useAdmin()
  const [collapsed, setCollapsed] = useState(false)

  const navGroups: NavGroup[] = [
    {
      title: 'Overview',
      items: [
        { label: 'Dashboard', href: '/admin', icon: <LayoutDashboard size={18} /> },
      ],
    },
    {
      title: 'Manage',
      items: [
        { label: 'Organizations', href: '/admin/organizations', icon: <Building2 size={18} /> },
        { label: 'Users', href: '/admin/users', icon: <Users size={18} /> },
        { label: 'Licenses & Modules', href: '/admin/licenses', icon: <Package size={18} /> },
      ],
    },
    {
      title: 'System',
      items: [
        { label: 'Settings', href: '/admin/settings', icon: <Settings size={18} /> },
      ],
    },
  ]

  const handleLogout = async () => {
    await logoutAdmin()
    router.push('/admin/login')
  }

  const displayName = adminUser?.name || 'Admin'
  const displayRole = adminUser?.role?.replace('_', ' ') || 'admin'
  const initials = displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <aside
      className={cn(
        'hidden lg:flex flex-col bg-chrome h-screen sticky top-0 transition-all duration-300 border-r border-dark-border',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo + Admin Badge */}
      <div className="flex items-center justify-between px-4 py-5">
        {!collapsed && (
          <div className="flex flex-col">
            <TempoLockup variant="color" size="sm" />
            <div className="flex items-center gap-1.5 mt-0.5 pl-0.5">
              <Shield size={10} className="text-amber-400" />
              <span className="text-[0.6rem] text-amber-400/80 font-semibold uppercase tracking-wider">Admin Console</span>
            </div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="text-t3 hover:text-white p-1 rounded transition-colors"
        >
          {collapsed ? <Menu size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Navigation */}
      <nav aria-label="Admin navigation" className="flex-1 overflow-y-auto px-2 pb-4 space-y-4">
        {navGroups.map((group) => (
          <div key={group.title}>
            {!collapsed && (
              <div className="px-3 py-1.5 text-[0.6rem] font-semibold uppercase tracking-[0.1em] text-white/30">
                {group.title}
              </div>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      'relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-[0.8rem] transition-colors',
                      isActive
                        ? 'bg-amber-500/12 text-amber-400 font-medium'
                        : 'text-white/50 hover:text-white/80 hover:bg-white/[0.06]'
                    )}
                  >
                    {isActive && (
                      <div className="absolute left-[-8px] top-1/2 -translate-y-1/2 w-[3px] h-4 bg-amber-500 rounded-r" />
                    )}
                    <span className={cn(isActive && 'text-amber-400')}>
                      {item.icon}
                    </span>
                    {!collapsed && (
                      <>
                        <span className="flex-1">{item.label}</span>
                        {item.badge && (
                          <span className="bg-amber-500 text-white text-[0.6rem] font-semibold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User section */}
      {!collapsed && (
        <div className="border-t border-dark-border px-3 py-3 space-y-1">
          <div className="flex items-center gap-3 px-2 py-1.5">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 text-xs font-semibold">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-white truncate">{displayName}</span>
                <span className="text-[0.5rem] font-semibold px-1 py-0.5 rounded bg-amber-500/20 text-amber-400 uppercase">
                  {displayRole}
                </span>
              </div>
              <div className="text-[0.65rem] text-white/40 truncate">{adminUser?.email}</div>
            </div>
            <button
              onClick={handleLogout}
              className="text-white/40 hover:text-red-400 transition-colors"
              title="Sign out"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      )}
      {collapsed && (
        <div className="border-t border-dark-border px-3 py-3 flex justify-center">
          <button
            onClick={handleLogout}
            className="text-white/40 hover:text-red-400 transition-colors p-1"
            title="Sign out"
          >
            <LogOut size={16} />
          </button>
        </div>
      )}
    </aside>
  )
}
