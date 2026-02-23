'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils/cn'
import { TempoLockup } from '@/components/brand/tempo-lockup'
import { useTempo } from '@/lib/store'
import {
  LayoutDashboard, Users, TrendingUp, Banknote, GraduationCap, HeartPulse,
  UserCheck, Wallet, Clock, Shield, Receipt, Briefcase, Laptop, AppWindow,
  FileText, PieChart, BarChart3, Settings, ChevronLeft, Menu,
  LogOut
} from 'lucide-react'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  badge?: number
}

interface NavGroup {
  title: string
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    title: 'CORE',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard size={18} /> },
      { label: 'People', href: '/people', icon: <Users size={18} /> },
    ],
  },
  {
    title: 'PEOPLE',
    items: [
      { label: 'Performance', href: '/performance', icon: <TrendingUp size={18} />, badge: 3 },
      { label: 'Compensation', href: '/compensation', icon: <Banknote size={18} /> },
      { label: 'Learning', href: '/learning', icon: <GraduationCap size={18} /> },
      { label: 'Engagement', href: '/engagement', icon: <HeartPulse size={18} /> },
      { label: 'Mentoring', href: '/mentoring', icon: <UserCheck size={18} /> },
    ],
  },
  {
    title: 'OPERATIONS',
    items: [
      { label: 'Payroll', href: '/payroll', icon: <Wallet size={18} /> },
      { label: 'Time & Attendance', href: '/time-attendance', icon: <Clock size={18} />, badge: 2 },
      { label: 'Benefits', href: '/benefits', icon: <Shield size={18} /> },
      { label: 'Expense', href: '/expense', icon: <Receipt size={18} />, badge: 3 },
    ],
  },
  {
    title: 'TALENT',
    items: [
      { label: 'Recruiting', href: '/recruiting', icon: <Briefcase size={18} />, badge: 5 },
    ],
  },
  {
    title: 'IT',
    items: [
      { label: 'Devices', href: '/it/devices', icon: <Laptop size={18} /> },
      { label: 'Apps', href: '/it/apps', icon: <AppWindow size={18} /> },
    ],
  },
  {
    title: 'FINANCE',
    items: [
      { label: 'Invoices', href: '/finance/invoices', icon: <FileText size={18} /> },
      { label: 'Budgets', href: '/finance/budgets', icon: <PieChart size={18} /> },
    ],
  },
  {
    title: 'INSIGHTS',
    items: [
      { label: 'Analytics', href: '/analytics', icon: <BarChart3 size={18} /> },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { currentUser, logout } = useTempo()
  const [collapsed, setCollapsed] = useState(false)

  const displayName = currentUser?.full_name || 'Amara Kone'
  const displayTitle = currentUser?.job_title || 'CHRO'
  const initials = displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  const roleBadge = currentUser?.role || 'owner'

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col bg-chrome h-screen sticky top-0 transition-all duration-300 border-r border-dark-border',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-4 py-5">
          {!collapsed && <TempoLockup variant="color" size="sm" />}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-t3 hover:text-white p-1 rounded transition-colors"
          >
            {collapsed ? <Menu size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2 pb-4 space-y-4">
          {navGroups.map((group) => (
            <div key={group.title}>
              {!collapsed && (
                <div className="px-3 py-1.5 text-[0.6rem] font-semibold uppercase tracking-[0.1em] text-white/30">
                  {group.title}
                </div>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-[0.8rem] transition-colors',
                        isActive
                          ? 'bg-tempo-600/12 text-tempo-400 font-medium'
                          : 'text-white/50 hover:text-white/80 hover:bg-white/[0.06]'
                      )}
                    >
                      {isActive && (
                        <div className="absolute left-[-8px] top-1/2 -translate-y-1/2 w-[3px] h-4 bg-tempo-600 rounded-r" />
                      )}
                      <span className={cn(isActive && 'text-tempo-400')}>
                        {item.icon}
                      </span>
                      {!collapsed && (
                        <>
                          <span className="flex-1">{item.label}</span>
                          {item.badge && (
                            <span className="bg-tempo-600 text-white text-[0.6rem] font-semibold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
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
          <div className="border-t border-dark-border px-3 py-3">
            <div className="flex items-center gap-3 px-2 py-1.5">
              <div className="w-8 h-8 rounded-full bg-tempo-600/20 flex items-center justify-center text-tempo-400 text-xs font-semibold">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium text-white truncate">{displayName}</span>
                  <span className="text-[0.5rem] font-semibold px-1 py-0.5 rounded bg-tempo-600/20 text-tempo-400 uppercase">
                    {roleBadge}
                  </span>
                </div>
                <div className="text-[0.65rem] text-white/40 truncate">{displayTitle}</div>
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

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-chrome border-t border-dark-border z-50 px-2 pb-[env(safe-area-inset-bottom)]">
        <div className="flex justify-around py-2">
          {[
            { label: 'Home', href: '/dashboard', icon: <LayoutDashboard size={20} /> },
            { label: 'People', href: '/people', icon: <Users size={20} /> },
            { label: 'Perform', href: '/performance', icon: <TrendingUp size={20} /> },
            { label: 'Finance', href: '/finance/invoices', icon: <Wallet size={20} /> },
            { label: 'More', href: '/settings', icon: <Menu size={20} /> },
          ].map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center gap-1 px-3 py-1',
                  isActive ? 'text-tempo-400' : 'text-white/50'
                )}
              >
                {item.icon}
                <span className="text-[0.55rem]">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
