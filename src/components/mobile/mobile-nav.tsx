'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, Users, CheckSquare, Menu, X, User, Rocket } from 'lucide-react'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils/cn'

interface MobileNavProps {
  approvalCount?: number
  activeTab?: string
  onTabChange?: (tab: string) => void
}

export function MobileManagerNav({ approvalCount = 0, activeTab, onTabChange }: MobileNavProps) {
  const pathname = usePathname()
  const [showMore, setShowMore] = useState(false)

  // Show on all mobile pages
  const isMobilePage = pathname?.startsWith('/mobile')

  useEffect(() => {
    setShowMore(false)
  }, [pathname])

  if (!isMobilePage) return null

  // On sub-pages, show a back-to-home nav
  const isSubPage = pathname !== '/mobile'

  const tabs = isSubPage
    ? [
        { id: 'home', label: 'Home', icon: LayoutDashboard, href: '/mobile' },
        { id: 'team', label: 'Team', icon: Users, href: '/mobile/team' },
        { id: 'approvals', label: 'Approvals', icon: CheckSquare, badge: approvalCount, href: '/mobile/approvals' },
        { id: 'profile', label: 'Profile', icon: User, href: '/mobile/profile' },
      ]
    : [
        { id: 'home', label: 'Home', icon: LayoutDashboard },
        { id: 'team', label: 'Team', icon: Users },
        { id: 'approvals', label: 'Approvals', icon: CheckSquare, badge: approvalCount },
        { id: 'more', label: 'More', icon: showMore ? X : Menu },
      ]

  const moreLinks = [
    { href: '/mobile/approvals', label: 'Approvals' },
    { href: '/mobile/team', label: 'Team View' },
    { href: '/mobile/profile', label: 'My Profile' },
    { href: '/people/talent-marketplace', label: 'Talent Marketplace' },
    { href: '/dashboard', label: 'Full Dashboard' },
    { href: '/payroll', label: 'Payroll' },
    { href: '/time-attendance', label: 'Time & Attendance' },
    { href: '/expense', label: 'Expenses' },
    { href: '/recruiting', label: 'Recruiting' },
    { href: '/learning', label: 'Learning' },
    { href: '/performance', label: 'Performance' },
    { href: '/settings', label: 'Settings' },
  ]

  const getActiveId = () => {
    if (pathname === '/mobile') return activeTab || 'home'
    if (pathname === '/mobile/team') return 'team'
    if (pathname === '/mobile/approvals') return 'approvals'
    if (pathname === '/mobile/profile') return 'profile'
    return 'home'
  }

  const currentActiveId = getActiveId()

  return (
    <>
      {/* More menu overlay */}
      {showMore && (
        <div className="fixed inset-0 z-40 flex flex-col lg:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowMore(false)}
          />
          <div
            className="absolute bottom-0 left-0 right-0 bg-[#161821] rounded-t-2xl"
            style={{ paddingBottom: 'calc(72px + env(safe-area-inset-bottom, 0px))' }}
          >
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-white/10" />
            </div>
            <div className="px-4 pb-4 max-h-[60vh] overflow-y-auto">
              <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3 px-2">
                All Modules
              </p>
              <div className="grid grid-cols-2 gap-2">
                {moreLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center gap-2 px-3 py-3 rounded-xl bg-white/[0.03] text-white/60 text-sm active:bg-white/[0.06] transition-colors min-h-[44px]"
                    onClick={() => setShowMore(false)}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#0f1117]/95 backdrop-blur-xl border-t border-white/[0.06] z-50 lg:hidden pb-[env(safe-area-inset-bottom)]">
        <div className="flex justify-around items-end pt-1.5 pb-1">
          {tabs.map((tab) => {
            const isActive = tab.id === 'more' ? showMore : (currentActiveId === tab.id)
            const Icon = tab.icon
            const tabHref = (tab as any).href

            return tabHref ? (
              <Link
                key={tab.id}
                href={tabHref}
                className={cn(
                  'flex flex-col items-center gap-0.5 px-4 py-2 min-w-[64px] min-h-[44px] relative transition-colors',
                  isActive ? 'text-orange-400' : 'text-white/30'
                )}
              >
                <div className="relative">
                  <Icon size={22} />
                  {(tab as any).badge != null && (tab as any).badge > 0 && (
                    <span className="absolute -top-1.5 -right-2.5 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                      {(tab as any).badge > 99 ? '99+' : (tab as any).badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-medium">{tab.label}</span>
              </Link>
            ) : (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.id === 'more') {
                    setShowMore(!showMore)
                  } else {
                    setShowMore(false)
                    onTabChange?.(tab.id)
                  }
                }}
                className={cn(
                  'flex flex-col items-center gap-0.5 px-4 py-2 min-w-[64px] min-h-[44px] relative transition-colors',
                  isActive ? 'text-orange-400' : 'text-white/30'
                )}
              >
                <div className="relative">
                  <Icon size={22} />
                  {(tab as any).badge != null && (tab as any).badge > 0 && (
                    <span className="absolute -top-1.5 -right-2.5 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                      {(tab as any).badge > 99 ? '99+' : (tab as any).badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-medium">{tab.label}</span>
              </button>
            )
          })}
        </div>
      </nav>
    </>
  )
}
