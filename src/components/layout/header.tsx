'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, LogOut, Settings, ArrowLeftRight, ChevronDown, User } from 'lucide-react'
import { NotificationBell } from '@/components/notifications'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { useTempo } from '@/lib/store'
import { allDemoCredentials } from '@/lib/demo-data'
import { cn } from '@/lib/utils/cn'

interface HeaderProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
  hideBreadcrumb?: boolean
}

export function Header({ title, subtitle, actions, hideBreadcrumb }: HeaderProps) {
  const { currentUser, logout, switchUser, org } = useTempo()
  const router = useRouter()
  const [showMenu, setShowMenu] = useState(false)
  const [showSwitcher, setShowSwitcher] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const displayName = currentUser?.full_name || 'Amara Kone'
  const displayTitle = currentUser?.job_title || 'CHRO'
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
  const roleBadge = currentUser?.role || 'owner'

  // Close menu on outside click
  useEffect(() => {
    if (!showMenu) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false)
        setShowSwitcher(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showMenu])

  const handleLogout = async () => {
    setShowMenu(false)
    await logout()
    router.push('/login')
  }

  const handleSwitchUser = async (employeeId: string) => {
    setShowMenu(false)
    setShowSwitcher(false)
    await switchUser(employeeId)
    router.push('/dashboard')
    setTimeout(() => window.location.reload(), 100)
  }

  const openCommandPalette = () => {
    const event = new KeyboardEvent('keydown', {
      key: 'k',
      metaKey: true,
      ctrlKey: navigator.platform.toLowerCase().includes('win'),
      bubbles: true,
    })
    document.dispatchEvent(event)
  }

  const ecobankUsers = allDemoCredentials.filter(c => !c.employeeId.startsWith('kemp-'))
  const kashUsers = allDemoCredentials.filter(c => c.employeeId.startsWith('kemp-'))
  const roleLabels: Record<string, string> = { owner: 'Owner', admin: 'Admin', hrbp: 'HRBP', manager: 'Manager', employee: 'Employee' }

  return (
    <div className="mb-6">
      {!hideBreadcrumb && <Breadcrumb />}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 flex-shrink-0">
          <h1 className="tempo-page-title">{title}</h1>
          {subtitle && <p className="tempo-page-subtitle mt-0.5">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {actions}
          <button
            onClick={openCommandPalette}
            className="hidden md:flex items-center gap-2 bg-white dark:bg-gray-800 border border-border rounded-lg px-3 py-1.5 text-xs text-t3 w-64 hover:border-tempo-300 hover:shadow-sm transition-all cursor-pointer"
          >
            <Search size={14} />
            <span>Search anything...</span>
            <span className="ml-auto text-[0.6rem] border border-divider rounded px-1.5 py-0.5">&#x2318;K</span>
          </button>
          <NotificationBell />

          {/* User Avatar + Dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className={cn(
                'flex items-center gap-2 rounded-full pl-1 pr-2 py-1 transition-all',
                'hover:bg-gray-100 dark:hover:bg-gray-800',
                showMenu && 'bg-gray-100 dark:bg-gray-800'
              )}
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-tempo-500 to-tempo-700 flex items-center justify-center text-white text-xs font-semibold shadow-sm">
                {initials}
              </div>
              <span className="hidden md:block text-sm font-medium text-t1 max-w-[120px] truncate">{displayName.split(' ')[0]}</span>
              <ChevronDown size={12} className={cn('hidden md:block text-t3 transition-transform', showMenu && 'rotate-180')} />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-gray-900 border border-border rounded-xl shadow-xl shadow-gray-200/50 dark:shadow-gray-900/50 z-[60] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                {/* User info header */}
                <div className="px-4 py-3 border-b border-divider bg-gray-50/50 dark:bg-gray-800/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-tempo-500 to-tempo-700 flex items-center justify-center text-white text-sm font-semibold">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-t1 truncate">{displayName}</span>
                        <span className="text-[0.55rem] font-bold px-1.5 py-0.5 rounded-full bg-tempo-100 text-tempo-700 uppercase tracking-wide">
                          {roleBadge}
                        </span>
                      </div>
                      <div className="text-xs text-t3 truncate">{displayTitle}</div>
                      {org?.name && <div className="text-[0.65rem] text-t3/60 truncate mt-0.5">{org.name}</div>}
                    </div>
                  </div>
                </div>

                {/* Menu items */}
                <div className="py-1.5">
                  <button
                    onClick={() => { setShowMenu(false); router.push('/settings') }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-t2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <Settings size={15} className="text-t3" />
                    Settings
                  </button>
                  <button
                    onClick={() => setShowSwitcher(!showSwitcher)}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-2 text-sm text-t2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors',
                      showSwitcher && 'bg-gray-50 dark:bg-gray-800'
                    )}
                  >
                    <ArrowLeftRight size={15} className="text-t3" />
                    Switch User
                    <ChevronDown size={12} className={cn('ml-auto text-t3 transition-transform', showSwitcher && 'rotate-180')} />
                  </button>
                </div>

                {/* User switcher */}
                {showSwitcher && (
                  <div className="border-t border-divider max-h-64 overflow-y-auto">
                    {[{ label: 'Ecobank', users: ecobankUsers }, { label: 'Kash', users: kashUsers }].map(group => (
                      group.users.length > 0 && (
                        <div key={group.label}>
                          <div className="px-4 py-1.5 text-[0.6rem] font-bold text-t3 uppercase tracking-widest bg-gray-50/80 dark:bg-gray-800/80">{group.label}</div>
                          {group.users.map(u => {
                            const isCurrentUser = currentUser?.employee_id === u.employeeId
                            return (
                              <button
                                key={u.employeeId}
                                onClick={() => handleSwitchUser(u.employeeId)}
                                disabled={isCurrentUser}
                                className={cn(
                                  'w-full flex items-center gap-3 px-4 py-2 text-left transition-colors',
                                  isCurrentUser ? 'bg-tempo-50 dark:bg-tempo-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                                )}
                              >
                                <div className={cn(
                                  'w-7 h-7 rounded-full flex items-center justify-center text-[0.6rem] font-semibold',
                                  isCurrentUser ? 'bg-tempo-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-t2'
                                )}>
                                  {u.label.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs font-medium text-t1 truncate">{u.label}</div>
                                  <div className="text-[0.6rem] text-t3">{roleLabels[u.role] || u.role}</div>
                                </div>
                                {isCurrentUser && <div className="w-1.5 h-1.5 rounded-full bg-tempo-500" />}
                              </button>
                            )
                          })}
                        </div>
                      )
                    ))}
                  </div>
                )}

                {/* Logout */}
                <div className="border-t border-divider py-1.5">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                  >
                    <LogOut size={15} />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
