'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils/cn'
import { TempoLockup } from '@/components/brand/tempo-lockup'
import { useTempo } from '@/lib/store'
import {
  LayoutDashboard, Users, TrendingUp, Banknote, GraduationCap, HeartPulse,
  UserCheck, UserMinus, UserPlus, Wallet, Clock, Shield, ShieldCheck, Receipt, Briefcase, Laptop, AppWindow, Cloud,
  FileText, PieChart, BarChart3, Settings, ChevronLeft, Menu,
  LogOut, FolderKanban, Compass, Zap, Plug, Store, Code,
  CreditCard, Plane, MessageSquare, Lock, Globe, FileSignature,
  KeyRound, Blocks, FlaskConical, Network, CircleDollarSign,
  ArrowLeftRight, X, Building2, BookOpen, Route, Sparkles, MoreHorizontal, Grid3X3,
  Calendar, GitBranch, Rocket, Package, Scale, Layers, History,
} from 'lucide-react'
import { allDemoCredentials } from '@/lib/demo-data'
import { isEvaluatorAccount, EVALUATOR_SIDEBAR_ALLOWED } from '@/lib/evaluator-demo-data'
import { usePermissions } from '@/lib/hooks/use-permissions'
import { LocaleSwitcher } from '@/components/layout/locale-switcher'
import { ThemeToggle } from '@/components/theme-toggle'
import { CommandPalette } from '@/components/search'
import { EntitySwitcher } from '@/components/platform/entity-switcher'

const SIDEBAR_COLLAPSED_KEY = 'tempo_sidebar_collapsed'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  badge?: number
  /** Permission(s) required to see this item. Empty = visible to all. */
  requiredPermissions?: string[]
}

interface NavGroup {
  title: string
  items: NavItem[]
}

/**
 * Hrefs whose badges represent items requiring USER ACTION (approvals, unread messages, pending reviews).
 * All other badges are informational (headcounts, course counts) and should be hidden.
 */
const ACTIONABLE_BADGE_HREFS = new Set([
  '/time-attendance',  // pending leave approvals
  '/expense',          // pending expense approvals
  '/chat',             // unread messages
  '/performance',      // pending reviews
])

/** The primary nav items shown when collapsed (icon rail). Max ~10 items. */
const PRIMARY_HREFS = new Set([
  '/dashboard',
  '/people',
  '/payroll',
  '/time-attendance',
  '/recruiting',
  '/learning',
  '/expense',
  '/chat',
  '/performance',
  '/settings',
])

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { currentUser, logout, switchUser, org } = useTempo()
  const [showSwitcher, setShowSwitcher] = useState(false)
  const [showMoreApps, setShowMoreApps] = useState(false)
  const [showMobileMore, setShowMobileMore] = useState(false)
  const t = useTranslations('nav')
  const tCommon = useTranslations('common')

  // Close mobile menu on route change
  useEffect(() => {
    setShowMobileMore(false)
  }, [pathname])

  // Persist collapsed state in localStorage, default to collapsed (true)
  const [collapsed, setCollapsed] = useState(true)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY)
      if (stored !== null) {
        setCollapsed(stored === 'true')
      }
    } catch { /* SSR / privacy mode */ }
  }, [])

  const toggleCollapsed = useCallback(() => {
    setCollapsed(prev => {
      const next = !prev
      try { localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next)) } catch { /* ignore */ }
      if (next) setShowMoreApps(false) // close More when collapsing
      return next
    })
  }, [])

  const role = currentUser?.role || 'owner'
  const isEvaluator = !!(currentUser?.email && isEvaluatorAccount(currentUser.email))
  const { canAny } = usePermissions()

  const allNavGroups: NavGroup[] = [
    {
      title: t('core'),
      items: [
        { label: t('dashboard'), href: '/dashboard', icon: <LayoutDashboard size={18} /> },
        { label: t('peopleLabel'), href: '/people', icon: <Users size={18} /> },
        { label: 'Org Chart', href: '/people/org-chart', icon: <GitBranch size={18} /> },
        { label: 'Org Design', href: '/people/org-design', icon: <Building2 size={18} /> },
        { label: 'Team Calendar', href: '/people/team-calendar', icon: <Calendar size={18} /> },
        { label: 'Positions', href: '/people?tab=positions', icon: <Layers size={18} /> },
        { label: t('recruiting'), href: '/recruiting', icon: <Briefcase size={18} />, badge: 5, requiredPermissions: ['recruiting:read'] },
        { label: 'Chat', href: '/chat', icon: <MessageSquare size={18} /> },
      ],
    },
    {
      title: t('people'),
      items: [
        { label: t('performance'), href: '/performance', icon: <TrendingUp size={18} />, badge: 3 },
        { label: t('compensation'), href: '/compensation', icon: <Banknote size={18} />, requiredPermissions: ['compensation:read'] },
        { label: t('learning'), href: '/learning', icon: <GraduationCap size={18} /> },
        { label: 'Academies', href: '/academies', icon: <BookOpen size={18} />, requiredPermissions: ['learning:read'] },
        { label: t('engagement'), href: '/engagement', icon: <HeartPulse size={18} /> },
        { label: t('mentoring'), href: '/mentoring', icon: <UserCheck size={18} /> },
        { label: 'Mentoring Hub', href: '/people/mentoring', icon: <Users size={18} /> },
        { label: 'Talent Marketplace', href: '/people/talent-marketplace', icon: <Rocket size={18} /> },
        { label: 'Journeys', href: '/journeys', icon: <Route size={18} /> },
        { label: 'Moments', href: '/moments', icon: <Sparkles size={18} /> },
        { label: 'Offboarding', href: '/offboarding', icon: <UserMinus size={18} />, requiredPermissions: ['offboarding:read'] },
      ],
    },
    {
      title: t('operations'),
      items: [
        { label: t('payroll'), href: '/payroll', icon: <Wallet size={18} />, requiredPermissions: ['payroll:read'] },
        { label: 'My Payslips', href: '/payslips', icon: <FileText size={18} /> },
        { label: t('timeAttendance'), href: '/time-attendance', icon: <Clock size={18} />, badge: 2 },
        { label: t('benefits'), href: '/benefits', icon: <Shield size={18} /> },
        { label: t('expense'), href: '/expense', icon: <Receipt size={18} />, badge: 3 },
        { label: 'Travel', href: '/travel', icon: <Plane size={18} /> },
        { label: 'Global Workforce', href: '/global-workforce', icon: <Globe size={18} />, requiredPermissions: ['people:read'] },
        { label: "Workers' Comp", href: '/workers-comp', icon: <ShieldCheck size={18} />, requiredPermissions: ['compliance:read'] },
      ],
    },
    {
      title: t('it') + ' & ' + t('finance'),
      items: [
        { label: 'IT Cloud', href: '/it-cloud', icon: <Cloud size={18} />, requiredPermissions: ['it:read'] },
        { label: t('devices'), href: '/it/devices', icon: <Laptop size={18} />, requiredPermissions: ['it:read'] },
        { label: t('apps'), href: '/it/apps', icon: <AppWindow size={18} />, requiredPermissions: ['it:read'] },
        { label: 'Identity', href: '/identity', icon: <KeyRound size={18} />, requiredPermissions: ['identity:read'] },
        { label: 'Passwords', href: '/password-manager', icon: <Lock size={18} />, requiredPermissions: ['it:read'] },
        { label: 'Marketplace', href: '/marketplace', icon: <Store size={18} />, requiredPermissions: ['settings:read'] },
        { label: t('invoices'), href: '/finance/invoices', icon: <FileText size={18} />, requiredPermissions: ['invoices:read'] },
        { label: t('budgets'), href: '/finance/budgets', icon: <PieChart size={18} />, requiredPermissions: ['budgets:read'] },
        { label: 'Corporate Cards', href: '/finance/cards', icon: <CreditCard size={18} />, requiredPermissions: ['finance:read'] },
        { label: 'Bill Pay', href: '/finance/bill-pay', icon: <CircleDollarSign size={18} />, requiredPermissions: ['finance:read'] },
        { label: 'Global Spend', href: '/finance/global-spend', icon: <Globe size={18} />, requiredPermissions: ['finance:read'] },
        { label: 'General Ledger', href: '/finance/general-ledger', icon: <BookOpen size={18} />, requiredPermissions: ['finance:read'] },
        { label: 'Procurement', href: '/finance/procurement', icon: <Package size={18} />, requiredPermissions: ['finance:read'] },
        { label: 'Revenue', href: '/finance/revenue', icon: <Scale size={18} />, requiredPermissions: ['finance:read'] },
        { label: 'Transfer Pricing', href: '/finance/transfer-pricing', icon: <ArrowLeftRight size={18} />, requiredPermissions: ['finance:read'] },
      ],
    },
    {
      title: t('strategic'),
      items: [
        { label: t('projects'), href: '/projects', icon: <FolderKanban size={18} /> },
        { label: t('strategy'), href: '/strategy', icon: <Compass size={18} /> },
        { label: 'Headcount', href: '/headcount', icon: <UserPlus size={18} />, requiredPermissions: ['headcount:read'] },
        { label: 'Compliance', href: '/compliance', icon: <ShieldCheck size={18} />, requiredPermissions: ['compliance:read'] },
        { label: 'Automation', href: '/workflows', icon: <Zap size={18} />, requiredPermissions: ['workflows:read'] },
        { label: t('workflowStudio'), href: '/workflow-studio', icon: <Zap size={18} />, requiredPermissions: ['workflows:manage'] },
        { label: t('analytics'), href: '/analytics', icon: <BarChart3 size={18} />, requiredPermissions: ['analytics:read'] },
        { label: 'Predictive Analytics', href: '/analytics/predictions', icon: <Sparkles size={18} />, requiredPermissions: ['analytics:read'] },
        { label: 'Board Reports', href: '/analytics/board-reports', icon: <BookOpen size={18} />, requiredPermissions: ['analytics:read'] },
        { label: 'Documents', href: '/documents', icon: <FileSignature size={18} /> },
        { label: 'App Studio', href: '/app-studio', icon: <Blocks size={18} />, requiredPermissions: ['admin:full'] },
        { label: 'Sandbox', href: '/sandbox', icon: <FlaskConical size={18} />, requiredPermissions: ['admin:full'] },
        { label: 'Groups', href: '/groups', icon: <Network size={18} /> },
        { label: 'Developer', href: '/developer', icon: <Code size={18} />, requiredPermissions: ['admin:full'] },
        { label: 'Security Admin', href: '/settings/security', icon: <Shield size={18} />, requiredPermissions: ['settings:manage'] },
      ],
    },
  ]

  // Filter nav items by permissions
  const filterByPermissions = (groups: NavGroup[]): NavGroup[] =>
    groups
      .map(group => ({
        ...group,
        items: group.items.filter(item => {
          if (!item.requiredPermissions || item.requiredPermissions.length === 0) return true
          return canAny(item.requiredPermissions as any)
        }),
      }))
      .filter(group => group.items.length > 0)

  // Filter nav groups for evaluator accounts (restricted module list)
  const filterNavGroups = (groups: NavGroup[], allowed: Set<string>, prefixMatch = false): NavGroup[] =>
    groups
      .map(group => ({
        ...group,
        items: group.items.filter(item =>
          prefixMatch
            ? allowed.has(item.href) || Array.from(allowed).some(p => item.href.startsWith(p + '/'))
            : allowed.has(item.href)
        ),
      }))
      .filter(group => group.items.length > 0)

  const navGroups: NavGroup[] = isEvaluator
    ? filterNavGroups(allNavGroups, EVALUATOR_SIDEBAR_ALLOWED, true)
    : filterByPermissions(allNavGroups)

  // Flatten all visible items
  const allItems = navGroups.flatMap(g => g.items)

  // Split into primary (icon rail) and secondary (More Apps)
  const primaryItems = allItems.filter(item => PRIMARY_HREFS.has(item.href))
  const secondaryItems = allItems.filter(item => !PRIMARY_HREFS.has(item.href))

  const displayName = currentUser?.full_name || 'Amara Kone'
  const displayTitle = currentUser?.job_title || 'CHRO'
  const initials = displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  const roleBadge = currentUser?.role || 'owner'

  const canSwitchUsers = true

  const handleSwitchUser = async (employeeId: string) => {
    setShowSwitcher(false)
    await switchUser(employeeId)
    router.push('/dashboard')
    setTimeout(() => window.location.reload(), 100)
  }

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  const ecobankUsers = allDemoCredentials.filter(c => !c.employeeId.startsWith('kemp-'))
  const kashUsers = allDemoCredentials.filter(c => c.employeeId.startsWith('kemp-'))
  const roleOrder = ['owner', 'admin', 'hrbp', 'manager', 'employee'] as const
  const roleLabels: Record<string, string> = { owner: 'Owner', admin: 'Admin', hrbp: 'HRBP', manager: 'Manager', employee: 'Employee' }

  // Render a single nav link (shared between collapsed and expanded states)
  const renderNavLink = (item: NavItem, isCollapsed: boolean) => {
    const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
    return (
      <Link
        key={item.href}
        href={item.href}
        title={isCollapsed ? item.label : undefined}
        aria-current={isActive ? 'page' : undefined}
        className={cn(
          'relative flex items-center gap-2.5 rounded-lg text-[0.8rem] transition-colors',
          isCollapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2',
          isActive
            ? 'bg-white/10 text-white font-medium'
            : 'text-white/50 hover:text-white/80 hover:bg-white/[0.06]'
        )}
      >
        <span className={cn(isActive && 'text-white')}>
          {item.icon}
        </span>
        {!isCollapsed && (
          <>
            <span className="flex-1">{item.label}</span>
            {!!(item.badge && item.badge > 0 && ACTIONABLE_BADGE_HREFS.has(item.href)) && (
              <span className="bg-tempo-600 text-white text-[0.6rem] font-semibold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                {item.badge}
              </span>
            )}
          </>
        )}
      </Link>
    )
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
        {/* Logo + Toggle */}
        <div className={cn('flex items-center py-5', collapsed ? 'justify-center px-2' : 'justify-between px-4')}>
          {!collapsed && (
            <div className="flex flex-col">
              <TempoLockup variant="white" size="sm" />
              <span className="text-[0.6rem] text-white/50 mt-0.5 pl-0.5">{org.name}</span>
            </div>
          )}
          <button
            onClick={toggleCollapsed}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="text-t3 hover:text-white p-1 rounded transition-colors"
          >
            {collapsed ? <Menu size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Search (expanded only) */}
        {!collapsed && (
          <div className="px-3 pb-3">
            <CommandPalette />
          </div>
        )}

        {/* Entity Switcher (multi-entity orgs) */}
        <EntitySwitcher collapsed={collapsed} />

        {/* Navigation */}
        <nav aria-label="Main navigation" className="flex-1 overflow-y-auto px-2 pb-4">
          {collapsed ? (
            /* --- COLLAPSED: icon rail with primary items --- */
            <div className="space-y-0.5">
              {primaryItems.map(item => renderNavLink(item, true))}

              {/* More Apps button */}
              {secondaryItems.length > 0 && (
                <>
                  <div className="my-2 mx-2 border-t border-white/10" />
                  <button
                    onClick={() => setShowMoreApps(!showMoreApps)}
                    title="More Apps"
                    className={cn(
                      'relative flex items-center justify-center w-full px-2 py-2.5 rounded-lg text-[0.8rem] transition-colors',
                      showMoreApps
                        ? 'bg-white/10 text-white'
                        : 'text-white/50 hover:text-white/80 hover:bg-white/[0.06]'
                    )}
                  >
                    <MoreHorizontal size={18} />
                  </button>
                </>
              )}

              {/* More Apps flyout (collapsed mode) */}
              {showMoreApps && (
                <div className="absolute left-16 top-0 bottom-0 w-56 bg-chrome border-r border-dark-border z-40 overflow-y-auto">
                  <div className="px-3 py-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">More Apps</span>
                      <button onClick={() => setShowMoreApps(false)} className="text-white/40 hover:text-white transition-colors">
                        <X size={14} />
                      </button>
                    </div>
                    {navGroups.map(group => {
                      const groupSecondary = group.items.filter(i => !PRIMARY_HREFS.has(i.href))
                      if (groupSecondary.length === 0) return null
                      return (
                        <div key={group.title} className="mb-3">
                          <div className="px-2 py-1.5 text-[0.6rem] font-semibold uppercase tracking-[0.1em] text-white/30">
                            {group.title}
                          </div>
                          <div className="space-y-0.5">
                            {groupSecondary.map(item => renderNavLink(item, false))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* --- EXPANDED: full nav with groups, primary items first, then More --- */
            <div className="space-y-4">
              {/* Primary items (ungrouped) */}
              <div>
                <div className="px-3 py-1.5 text-[0.6rem] font-semibold uppercase tracking-[0.1em] text-white/30">
                  Main
                </div>
                <div className="space-y-0.5">
                  {primaryItems.map(item => renderNavLink(item, false))}
                </div>
              </div>

              {/* Separator + More Apps toggle */}
              {secondaryItems.length > 0 && (
                <>
                  <button
                    onClick={() => setShowMoreApps(!showMoreApps)}
                    className={cn(
                      'flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-[0.8rem] transition-colors',
                      showMoreApps
                        ? 'bg-white/10 text-white font-medium'
                        : 'text-white/50 hover:text-white/80 hover:bg-white/[0.06]'
                    )}
                  >
                    <Grid3X3 size={18} />
                    <span className="flex-1 text-left">More Apps</span>
                    <ChevronLeft size={14} className={cn('transition-transform', showMoreApps ? '-rotate-90' : 'rotate-0')} />
                  </button>

                  {showMoreApps && (
                    <div className="space-y-4">
                      {navGroups.map(group => {
                        const groupSecondary = group.items.filter(i => !PRIMARY_HREFS.has(i.href))
                        if (groupSecondary.length === 0) return null
                        return (
                          <div key={group.title}>
                            <div className="px-3 py-1.5 text-[0.6rem] font-semibold uppercase tracking-[0.1em] text-white/30">
                              {group.title}
                            </div>
                            <div className="space-y-0.5">
                              {groupSecondary.map(item => renderNavLink(item, false))}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </nav>

        {/* Bottom section */}
        {collapsed ? (
          <div className="border-t border-dark-border px-2 py-3 space-y-1 flex flex-col items-center">
            <Link
              href="/settings"
              title="Settings"
              className={cn(
                'flex items-center justify-center p-2 rounded-lg transition-colors',
                pathname.startsWith('/settings')
                  ? 'bg-white/10 text-white'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/[0.06]'
              )}
            >
              <Settings size={18} />
            </Link>
            <button
              onClick={handleLogout}
              className="text-white/40 hover:text-red-400 transition-colors p-2"
              title={tCommon('signOut')}
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <div className="border-t border-dark-border px-3 py-3 space-y-1">
            <Link
              href="/help"
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-lg text-[0.8rem] transition-colors',
                pathname.startsWith('/help')
                  ? 'bg-white/10 text-white font-medium'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/[0.06]'
              )}
            >
              <BookOpen size={18} />
              <span className="flex-1">Help Center</span>
            </Link>
            <Link
              href="/settings"
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-lg text-[0.8rem] transition-colors mb-1',
                pathname.startsWith('/settings')
                  ? 'bg-white/10 text-white font-medium'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/[0.06]'
              )}
            >
              <Settings size={18} />
              <span className="flex-1">{t('settings')}</span>
            </Link>
            <div className="flex items-center justify-between px-2">
              <LocaleSwitcher />
              <ThemeToggle />
            </div>
            {/* Compact bottom — locale & theme only (profile moved to header) */}
          </div>
        )}
      </aside>

      {/* Backdrop for More Apps flyout in collapsed mode */}
      {collapsed && showMoreApps && (
        <div
          className="fixed inset-0 z-30 lg:block hidden"
          onClick={() => setShowMoreApps(false)}
        />
      )}

      {/* Mobile Bottom Tab Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-chrome/95 backdrop-blur-lg border-t border-dark-border z-50 pb-[env(safe-area-inset-bottom)]" style={{ WebkitBackdropFilter: 'blur(20px)' }}>
        <div className="flex justify-around items-end pt-1.5 pb-1">
          {[
            { label: 'Home', href: '/dashboard', icon: <LayoutDashboard size={22} /> },
            { label: 'People', href: '/people', icon: <Users size={22} /> },
            { label: 'Payroll', href: '/payroll', icon: <Wallet size={22} /> },
            { label: 'Chat', href: '/chat', icon: <MessageSquare size={22} /> },
          ].map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center gap-0.5 min-w-[56px] min-h-[44px] relative',
                  isActive ? 'text-tempo-400' : 'text-white/45'
                )}
              >
                {isActive && (
                  <span className="absolute -top-1.5 w-5 h-[3px] rounded-full bg-tempo-500" />
                )}
                {item.icon}
                <span className={cn('text-[0.6rem] leading-none', isActive && 'font-medium')}>{item.label}</span>
              </Link>
            )
          })}
          {/* More tab - opens full-screen menu */}
          <button
            onClick={() => setShowMobileMore(prev => !prev)}
            className={cn(
              'flex flex-col items-center justify-center gap-0.5 min-w-[56px] min-h-[44px] relative',
              showMobileMore ? 'text-tempo-400' : 'text-white/45'
            )}
          >
            {showMobileMore ? <X size={22} /> : <Grid3X3 size={22} />}
            <span className={cn('text-[0.6rem] leading-none', showMobileMore && 'font-medium')}>More</span>
          </button>
        </div>
      </nav>

      {/* Mobile "More" full-screen overlay menu */}
      {showMobileMore && (
        <div className="lg:hidden fixed inset-0 z-40 flex flex-col">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 mobile-menu-enter"
            style={{ animationDuration: '0.2s' }}
            onClick={() => setShowMobileMore(false)}
          />
          {/* Menu panel */}
          <div
            className="mobile-menu-enter absolute bottom-0 left-0 right-0 bg-chrome rounded-t-2xl max-h-[85vh] flex flex-col"
            style={{ paddingBottom: 'calc(72px + env(safe-area-inset-bottom, 0px))' }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-9 h-1 rounded-full bg-white/20" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-3">
              <span className="text-base font-semibold text-white">All Apps</span>
              <button
                onClick={() => setShowMobileMore(false)}
                className="text-white/40 hover:text-white p-1"
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-6" style={{ WebkitOverflowScrolling: 'touch' }}>
              {/* User info */}
              <div className="flex items-center gap-3 px-2 py-3 mb-3 border-b border-white/10">
                <div className="w-10 h-10 rounded-full bg-tempo-600/20 flex items-center justify-center text-tempo-400 text-sm font-semibold">
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">{displayName}</div>
                  <div className="text-xs text-white/40 truncate">{displayTitle}</div>
                </div>
                <span className="text-[0.6rem] font-semibold px-1.5 py-0.5 rounded bg-tempo-600/20 text-tempo-400 uppercase">
                  {roleBadge}
                </span>
              </div>

              {/* Nav groups */}
              {navGroups.map(group => (
                <div key={group.title} className="mb-4">
                  <div className="px-2 py-2 text-[0.6rem] font-semibold uppercase tracking-[0.1em] text-white/30">
                    {group.title}
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    {group.items.map(item => {
                      const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setShowMobileMore(false)}
                          className={cn(
                            'flex flex-col items-center gap-1.5 py-3 px-1 rounded-xl transition-colors min-h-[72px] justify-center',
                            isActive
                              ? 'bg-tempo-600/15 text-tempo-400'
                              : 'text-white/50 active:bg-white/[0.06]'
                          )}
                        >
                          <span className="flex items-center justify-center w-8 h-8">
                            {item.icon}
                          </span>
                          <span className={cn('text-[0.6rem] leading-tight text-center', isActive && 'font-medium')}>
                            {item.label}
                          </span>
                          {!!(item.badge && item.badge > 0 && ACTIONABLE_BADGE_HREFS.has(item.href)) && (
                            <span className="absolute -top-0.5 -right-0.5 bg-tempo-600 text-white text-[0.5rem] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      )
                    })}
                  </div>
                </div>
              ))}

              {/* Quick actions */}
              <div className="border-t border-white/10 pt-3 mt-2 space-y-1">
                <Link
                  href="/settings"
                  onClick={() => setShowMobileMore(false)}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl text-white/60 active:bg-white/[0.06]"
                >
                  <Settings size={20} />
                  <span className="text-sm">Settings</span>
                </Link>
                <Link
                  href="/help"
                  onClick={() => setShowMobileMore(false)}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl text-white/60 active:bg-white/[0.06]"
                >
                  <BookOpen size={20} />
                  <span className="text-sm">Help Center</span>
                </Link>
                <button
                  onClick={() => { setShowMobileMore(false); handleLogout() }}
                  className="flex items-center gap-3 w-full px-3 py-3 rounded-xl text-red-400/80 active:bg-white/[0.06]"
                >
                  <LogOut size={20} />
                  <span className="text-sm">Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

/**
 * Exports all nav items with their icons for use by the dashboard "Your Apps" grid.
 * Returns a flat array of { label, href, icon } objects for all modules.
 */
export function getAllAppModules(): { label: string; href: string; icon: React.ReactNode }[] {
  return [
    { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard size={24} /> },
    { label: 'People', href: '/people', icon: <Users size={24} /> },
    { label: 'Recruiting', href: '/recruiting', icon: <Briefcase size={24} /> },
    { label: 'Chat', href: '/chat', icon: <MessageSquare size={24} /> },
    { label: 'Performance', href: '/performance', icon: <TrendingUp size={24} /> },
    { label: 'Compensation', href: '/compensation', icon: <Banknote size={24} /> },
    { label: 'Learning', href: '/learning', icon: <GraduationCap size={24} /> },
    { label: 'Engagement', href: '/engagement', icon: <HeartPulse size={24} /> },
    { label: 'Mentoring', href: '/mentoring', icon: <UserCheck size={24} /> },
    { label: 'Journeys', href: '/journeys', icon: <Route size={24} /> },
    { label: 'Moments', href: '/moments', icon: <Sparkles size={24} /> },
    { label: 'Offboarding', href: '/offboarding', icon: <UserMinus size={24} /> },
    { label: 'Payroll', href: '/payroll', icon: <Wallet size={24} /> },
    { label: 'Payslips', href: '/payslips', icon: <FileText size={24} /> },
    { label: 'Time & Attendance', href: '/time-attendance', icon: <Clock size={24} /> },
    { label: 'Benefits', href: '/benefits', icon: <Shield size={24} /> },
    { label: 'Expenses', href: '/expense', icon: <Receipt size={24} /> },
    { label: 'Travel', href: '/travel', icon: <Plane size={24} /> },
    { label: 'Global Workforce', href: '/global-workforce', icon: <Globe size={24} /> },
    { label: "Workers' Comp", href: '/workers-comp', icon: <ShieldCheck size={24} /> },
    { label: 'IT Cloud', href: '/it-cloud', icon: <Cloud size={24} /> },
    { label: 'Devices', href: '/it/devices', icon: <Laptop size={24} /> },
    { label: 'Apps', href: '/it/apps', icon: <AppWindow size={24} /> },
    { label: 'Identity', href: '/identity', icon: <KeyRound size={24} /> },
    { label: 'Passwords', href: '/password-manager', icon: <Lock size={24} /> },
    { label: 'Marketplace', href: '/marketplace', icon: <Store size={24} /> },
    { label: 'Invoices', href: '/finance/invoices', icon: <FileText size={24} /> },
    { label: 'Budgets', href: '/finance/budgets', icon: <PieChart size={24} /> },
    { label: 'Corporate Cards', href: '/finance/cards', icon: <CreditCard size={24} /> },
    { label: 'Bill Pay', href: '/finance/bill-pay', icon: <CircleDollarSign size={24} /> },
    { label: 'Global Spend', href: '/finance/global-spend', icon: <Globe size={24} /> },
    { label: 'General Ledger', href: '/finance/general-ledger', icon: <BookOpen size={24} /> },
    { label: 'Procurement', href: '/finance/procurement', icon: <Package size={24} /> },
    { label: 'Revenue', href: '/finance/revenue', icon: <Scale size={24} /> },
    { label: 'Transfer Pricing', href: '/finance/transfer-pricing', icon: <ArrowLeftRight size={24} /> },
    { label: 'Board Reports', href: '/analytics/board-reports', icon: <BookOpen size={24} /> },
    { label: 'Org Design', href: '/people/org-design', icon: <Building2 size={24} /> },
    { label: 'Projects', href: '/projects', icon: <FolderKanban size={24} /> },
    { label: 'Strategy', href: '/strategy', icon: <Compass size={24} /> },
    { label: 'Headcount', href: '/headcount', icon: <UserPlus size={24} /> },
    { label: 'Compliance', href: '/compliance', icon: <ShieldCheck size={24} /> },
    { label: 'Automation', href: '/workflows', icon: <Zap size={24} /> },
    { label: 'Analytics', href: '/analytics', icon: <BarChart3 size={24} /> },
    { label: 'Documents', href: '/documents', icon: <FileSignature size={24} /> },
    { label: 'App Studio', href: '/app-studio', icon: <Blocks size={24} /> },
    { label: 'Sandbox', href: '/sandbox', icon: <FlaskConical size={24} /> },
    { label: 'Groups', href: '/groups', icon: <Network size={24} /> },
    { label: 'Developer', href: '/developer', icon: <Code size={24} /> },
    { label: 'Help Center', href: '/help', icon: <BookOpen size={24} /> },
    { label: 'Settings', href: '/settings', icon: <Settings size={24} /> },
  ]
}
