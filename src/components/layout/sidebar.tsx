'use client'

import { useState } from 'react'
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
  ArrowLeftRight, X, Building2, BookOpen,
} from 'lucide-react'
import { allDemoCredentials } from '@/lib/demo-data'
import { isEvaluatorAccount, EVALUATOR_SIDEBAR_ALLOWED } from '@/lib/evaluator-demo-data'
import { LocaleSwitcher } from '@/components/layout/locale-switcher'
import { ThemeToggle } from '@/components/theme-toggle'
import { CommandPalette } from '@/components/search'

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

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { currentUser, logout, switchUser, org } = useTempo()
  const [collapsed, setCollapsed] = useState(false)
  const [showSwitcher, setShowSwitcher] = useState(false)
  const t = useTranslations('nav')
  const tCommon = useTranslations('common')

  const role = currentUser?.role || 'owner'
  const isEmployee = role === 'employee'
  const isEvaluator = !!(currentUser?.email && isEvaluatorAccount(currentUser.email))

  // Employee self-service: only show modules employees need
  const EMPLOYEE_ALLOWED_HREFS = new Set([
    '/dashboard', '/people', '/performance', '/learning',
    '/engagement', '/payslips', '/time-attendance', '/benefits',
    '/expense', '/mentoring', '/chat', '/documents', '/travel',
    '/help',
  ])

  const allNavGroups: NavGroup[] = [
    {
      title: t('core'),
      items: [
        { label: t('dashboard'), href: '/dashboard', icon: <LayoutDashboard size={18} /> },
        { label: t('peopleLabel'), href: '/people', icon: <Users size={18} /> },
        { label: t('recruiting'), href: '/recruiting', icon: <Briefcase size={18} />, badge: 5 },
        { label: 'Chat', href: '/chat', icon: <MessageSquare size={18} /> },
      ],
    },
    {
      title: t('people'),
      items: [
        { label: t('performance'), href: '/performance', icon: <TrendingUp size={18} />, badge: 3 },
        { label: t('compensation'), href: '/compensation', icon: <Banknote size={18} /> },
        { label: t('learning'), href: '/learning', icon: <GraduationCap size={18} /> },
        { label: t('engagement'), href: '/engagement', icon: <HeartPulse size={18} /> },
        { label: t('mentoring'), href: '/mentoring', icon: <UserCheck size={18} /> },
        { label: 'Offboarding', href: '/offboarding', icon: <UserMinus size={18} /> },
      ],
    },
    {
      title: t('operations'),
      items: [
        { label: t('payroll'), href: '/payroll', icon: <Wallet size={18} /> },
        { label: 'My Payslips', href: '/payslips', icon: <FileText size={18} /> },
        { label: t('timeAttendance'), href: '/time-attendance', icon: <Clock size={18} />, badge: 2 },
        { label: t('benefits'), href: '/benefits', icon: <Shield size={18} /> },
        { label: t('expense'), href: '/expense', icon: <Receipt size={18} />, badge: 3 },
        { label: 'Travel', href: '/travel', icon: <Plane size={18} /> },
        { label: 'Global Workforce', href: '/global-workforce', icon: <Globe size={18} /> },
        { label: "Workers' Comp", href: '/workers-comp', icon: <ShieldCheck size={18} /> },
      ],
    },
    {
      title: t('it') + ' & ' + t('finance'),
      items: [
        { label: 'IT Cloud', href: '/it-cloud', icon: <Cloud size={18} /> },
        { label: t('devices'), href: '/it/devices', icon: <Laptop size={18} /> },
        { label: t('apps'), href: '/it/apps', icon: <AppWindow size={18} /> },
        { label: 'Identity', href: '/identity', icon: <KeyRound size={18} /> },
        { label: 'Passwords', href: '/password-manager', icon: <Lock size={18} /> },
        { label: 'Marketplace', href: '/marketplace', icon: <Store size={18} /> },
        { label: t('invoices'), href: '/finance/invoices', icon: <FileText size={18} /> },
        { label: t('budgets'), href: '/finance/budgets', icon: <PieChart size={18} /> },
        { label: 'Corporate Cards', href: '/finance/cards', icon: <CreditCard size={18} /> },
        { label: 'Bill Pay', href: '/finance/bill-pay', icon: <CircleDollarSign size={18} /> },
        { label: 'Global Spend', href: '/finance/global-spend', icon: <Globe size={18} /> },
      ],
    },
    {
      title: t('strategic'),
      items: [
        { label: t('projects'), href: '/projects', icon: <FolderKanban size={18} /> },
        { label: t('strategy'), href: '/strategy', icon: <Compass size={18} /> },
        { label: 'Headcount', href: '/headcount', icon: <UserPlus size={18} /> },
        { label: 'Compliance', href: '/compliance', icon: <ShieldCheck size={18} /> },
        { label: 'Automation', href: '/workflows', icon: <Zap size={18} /> },
        { label: t('workflowStudio'), href: '/workflow-studio', icon: <Zap size={18} /> },
        { label: t('analytics'), href: '/analytics', icon: <BarChart3 size={18} /> },
        { label: 'Documents', href: '/documents', icon: <FileSignature size={18} /> },
        { label: 'App Studio', href: '/app-studio', icon: <Blocks size={18} /> },
        { label: 'Sandbox', href: '/sandbox', icon: <FlaskConical size={18} /> },
        { label: 'Groups', href: '/groups', icon: <Network size={18} /> },
        { label: 'Developer', href: '/developer', icon: <Code size={18} /> },
      ],
    },
  ]

  // Filter nav groups for employee role
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
    : isEmployee
      ? filterNavGroups(allNavGroups, EMPLOYEE_ALLOWED_HREFS)
      : allNavGroups

  const displayName = currentUser?.full_name || 'Amara Kone'
  const displayTitle = currentUser?.job_title || 'CHRO'
  const initials = displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  const roleBadge = currentUser?.role || 'owner'

  // Allow switching for all demo users (owners/admins always, others if demo session)
  const canSwitchUsers = true // All demo users can switch for testing purposes

  const handleSwitchUser = async (employeeId: string) => {
    setShowSwitcher(false)
    await switchUser(employeeId)
    router.push('/dashboard')
    // Force full reload to refresh all module data for new user/org
    setTimeout(() => window.location.reload(), 100)
  }

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  // Group demo credentials by org for the switcher
  const ecobankUsers = allDemoCredentials.filter(c => !c.employeeId.startsWith('kemp-'))
  const kashUsers = allDemoCredentials.filter(c => c.employeeId.startsWith('kemp-'))
  const roleOrder = ['owner', 'admin', 'hrbp', 'manager', 'employee'] as const
  const roleLabels: Record<string, string> = { owner: 'Owner', admin: 'Admin', hrbp: 'HRBP', manager: 'Manager', employee: 'Employee' }

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col bg-chrome h-screen sticky top-0 transition-all duration-300 border-r border-dark-border',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        {/* Logo + Org Name */}
        <div className="flex items-center justify-between px-4 py-5">
          {!collapsed && (
            <div className="flex flex-col">
              <TempoLockup variant="color" size="sm" className="[&>span]:text-white" />
              <span className="text-[0.6rem] text-white/50 mt-0.5 pl-0.5">{org.name}</span>
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

        {/* Search */}
        {!collapsed && (
          <div className="px-3 pb-3">
            <CommandPalette />
          </div>
        )}

        {/* Navigation */}
        <nav aria-label="Main navigation" className="flex-1 overflow-y-auto px-2 pb-4 space-y-4">
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
                      aria-current={isActive ? 'page' : undefined}
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
          <div className="border-t border-dark-border px-3 py-3 space-y-1">
            <Link
              href="/help"
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-lg text-[0.8rem] transition-colors',
                pathname.startsWith('/help')
                  ? 'bg-tempo-600/12 text-tempo-400 font-medium'
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
                  ? 'bg-tempo-600/12 text-tempo-400 font-medium'
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
            {/* User Switcher Panel */}
            {showSwitcher && canSwitchUsers && (
              <div className="relative">
                <div className="absolute bottom-full left-0 right-0 mb-1 bg-[#1a1a2e] border border-white/10 rounded-lg shadow-xl max-h-[60vh] overflow-y-auto z-50">
                  <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 sticky top-0 bg-[#1a1a2e]">
                    <span className="text-xs font-semibold text-white/70 uppercase tracking-wider">Switch User</span>
                    <button onClick={() => setShowSwitcher(false)} className="text-white/40 hover:text-white transition-colors">
                      <X size={14} />
                    </button>
                  </div>
                  {/* Ecobank */}
                  <div className="px-2 py-1.5">
                    <div className="flex items-center gap-1.5 px-2 py-1">
                      <Building2 size={10} className="text-tempo-400" />
                      <span className="text-[0.6rem] font-semibold text-tempo-400 uppercase tracking-wider">Ecobank Transnational</span>
                    </div>
                    {roleOrder.map(r => {
                      const users = ecobankUsers.filter(u => u.role === r)
                      if (users.length === 0) return null
                      return users.map(u => {
                        const isCurrentUser = currentUser?.employee_id === u.employeeId
                        const userInitials = u.label.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                        return (
                          <button
                            key={u.employeeId + u.email}
                            onClick={() => !isCurrentUser && handleSwitchUser(u.employeeId)}
                            className={cn(
                              'flex items-center gap-2.5 w-full px-2 py-1.5 rounded-md text-left transition-colors',
                              isCurrentUser ? 'bg-tempo-600/15 cursor-default' : 'hover:bg-white/[0.06] cursor-pointer'
                            )}
                          >
                            <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-white/60 text-[0.55rem] font-semibold shrink-0">
                              {userInitials}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className={cn('text-[0.7rem] truncate', isCurrentUser ? 'text-tempo-400 font-medium' : 'text-white/80')}>{u.title}</span>
                                <span className="text-[0.5rem] font-semibold px-1 py-0.5 rounded bg-white/10 text-white/50 uppercase shrink-0">{roleLabels[u.role]}</span>
                              </div>
                              <div className="text-[0.6rem] text-white/30 truncate">{u.department}</div>
                            </div>
                            {isCurrentUser && <div className="w-1.5 h-1.5 rounded-full bg-tempo-500 shrink-0" />}
                          </button>
                        )
                      })
                    })}
                  </div>
                  {/* Kash & Co */}
                  <div className="px-2 py-1.5 border-t border-white/5">
                    <div className="flex items-center gap-1.5 px-2 py-1">
                      <Building2 size={10} className="text-blue-400" />
                      <span className="text-[0.6rem] font-semibold text-blue-400 uppercase tracking-wider">Kash & Co (South Africa)</span>
                    </div>
                    {kashUsers.map(u => {
                      const isCurrentUser = currentUser?.employee_id === u.employeeId
                      const userInitials = u.label.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                      return (
                        <button
                          key={u.employeeId}
                          onClick={() => !isCurrentUser && handleSwitchUser(u.employeeId)}
                          className={cn(
                            'flex items-center gap-2.5 w-full px-2 py-1.5 rounded-md text-left transition-colors',
                            isCurrentUser ? 'bg-blue-600/15 cursor-default' : 'hover:bg-white/[0.06] cursor-pointer'
                          )}
                        >
                          <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-white/60 text-[0.55rem] font-semibold shrink-0">
                            {userInitials}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className={cn('text-[0.7rem] truncate', isCurrentUser ? 'text-blue-400 font-medium' : 'text-white/80')}>{u.title}</span>
                              <span className="text-[0.5rem] font-semibold px-1 py-0.5 rounded bg-white/10 text-white/50 uppercase shrink-0">{roleLabels[u.role]}</span>
                            </div>
                            <div className="text-[0.6rem] text-white/30 truncate">{u.department}</div>
                          </div>
                          {isCurrentUser && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
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
              <div className="flex items-center gap-1">
                {canSwitchUsers && (
                  <button
                    onClick={() => setShowSwitcher(!showSwitcher)}
                    className={cn(
                      'text-white/40 hover:text-tempo-400 transition-colors p-0.5',
                      showSwitcher && 'text-tempo-400'
                    )}
                    title="Switch user"
                  >
                    <ArrowLeftRight size={13} />
                  </button>
                )}
                <button
                  onClick={handleLogout}
                  className="text-white/40 hover:text-red-400 transition-colors p-0.5"
                  title={tCommon('signOut')}
                >
                  <LogOut size={14} />
                </button>
              </div>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="border-t border-dark-border px-3 py-3 flex justify-center">
            <button
              onClick={handleLogout}
              className="text-white/40 hover:text-red-400 transition-colors p-1"
              title={tCommon('signOut')}
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
            { label: t('mobileHome'), href: '/dashboard', icon: <LayoutDashboard size={20} /> },
            { label: t('peopleLabel'), href: '/people', icon: <Users size={20} /> },
            { label: t('mobilePerform'), href: '/performance', icon: <TrendingUp size={20} /> },
            { label: t('mobileFinance'), href: '/finance/invoices', icon: <Wallet size={20} /> },
            { label: t('mobileMore'), href: '/settings', icon: <Menu size={20} /> },
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
