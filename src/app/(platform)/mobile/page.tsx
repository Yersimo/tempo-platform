'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  CheckSquare, Users, Calendar, Receipt, Clock, MessageSquare,
  RefreshCw, Bell, BellOff, ChevronRight, Briefcase, Home, Plane,
  MapPin, UserPlus, Award, TrendingUp,
} from 'lucide-react'
import { useTempo } from '@/lib/store'
import { Avatar } from '@/components/ui/avatar'
import { ApprovalCard, type ApprovalItem } from '@/components/mobile/approval-card'
import { MobileManagerNav } from '@/components/mobile/mobile-nav'
import { usePushNotifications, useSyncStatus } from '@/lib/hooks/use-push-notifications'
import { cn } from '@/lib/utils/cn'

type TabId = 'home' | 'team' | 'approvals'

export default function MobileManagerPage() {
  const searchParams = useSearchParams()
  const initialTab = (searchParams.get('tab') as TabId) || 'home'
  const [activeTab, setActiveTab] = useState<TabId>(initialTab)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pullStartY, setPullStartY] = useState(0)
  const [pullDistance, setPullDistance] = useState(0)

  const {
    currentUser,
    employees,
    departments,
    leaveRequests,
    expenseReports,
    timeEntries,
    ensureModulesLoaded,
    updateLeaveRequest,
    updateExpenseReport,
  } = useTempo()

  const { isSupported: pushSupported, permission: pushPermission, subscribe: subscribePush } = usePushNotifications()
  const { pendingCount: syncPending } = useSyncStatus()

  // Load required modules
  useEffect(() => {
    ensureModulesLoaded?.(['employees', 'departments', 'leaveRequests', 'expenseReports', 'timeEntries'])
  }, [ensureModulesLoaded])

  // ─── Derived Data ───
  const currentEmployee = useMemo(() => {
    return employees.find((e: Record<string, unknown>) => e.id === currentUser?.employee_id)
  }, [employees, currentUser])

  const directReports = useMemo(() => {
    if (!currentUser?.employee_id) return []
    return employees.filter((e: Record<string, unknown>) =>
      e.manager_id === currentUser.employee_id || e.reports_to === currentUser.employee_id
    )
  }, [employees, currentUser])

  const pendingApprovals = useMemo((): ApprovalItem[] => {
    const items: ApprovalItem[] = []

    // Pending leave requests
    leaveRequests
      .filter((lr: Record<string, unknown>) => lr.status === 'pending')
      .forEach((lr: Record<string, unknown>) => {
        const emp = employees.find((e: Record<string, unknown>) => e.id === lr.employee_id)
        const dept = departments.find((d: Record<string, unknown>) => d.id === (emp as Record<string, unknown>)?.department_id)
        const empName = (emp as Record<string, unknown>)?.profile
          ? ((emp as Record<string, unknown>).profile as Record<string, unknown>)?.full_name as string
          : (emp as Record<string, unknown>)?.full_name as string || 'Unknown'
        items.push({
          id: lr.id as string,
          type: 'leave',
          requester: {
            name: empName,
            avatar_url: (emp as Record<string, unknown>)?.profile
              ? ((emp as Record<string, unknown>).profile as Record<string, unknown>)?.avatar_url as string
              : null,
            department: (dept as Record<string, unknown>)?.name as string,
          },
          title: `${(lr.leave_type as string || lr.type as string || 'Leave').replace(/_/g, ' ')} request`,
          subtitle: `${lr.days || lr.total_days || '—'} day(s)`,
          dates: lr.start_date ? { start: lr.start_date as string, end: (lr.end_date || lr.start_date) as string } : undefined,
          submitted: (lr.submitted_at || lr.created_at || new Date().toISOString()) as string,
          details: lr.reason as string || lr.notes as string,
        })
      })

    // Pending expense reports
    expenseReports
      .filter((er: Record<string, unknown>) => er.status === 'pending' || er.status === 'submitted')
      .forEach((er: Record<string, unknown>) => {
        const emp = employees.find((e: Record<string, unknown>) => e.id === er.employee_id)
        const empName = (emp as Record<string, unknown>)?.profile
          ? ((emp as Record<string, unknown>).profile as Record<string, unknown>)?.full_name as string
          : (emp as Record<string, unknown>)?.full_name as string || 'Unknown'
        items.push({
          id: er.id as string,
          type: 'expense',
          requester: {
            name: empName,
            avatar_url: (emp as Record<string, unknown>)?.profile
              ? ((emp as Record<string, unknown>).profile as Record<string, unknown>)?.avatar_url as string
              : null,
          },
          title: (er.title || er.description || 'Expense Report') as string,
          subtitle: er.category as string || 'General',
          amount: (er.total_amount || er.amount) as number,
          currency: (er.currency || 'USD') as string,
          submitted: (er.submitted_at || er.created_at || new Date().toISOString()) as string,
          details: er.description as string,
        })
      })

    return items.sort((a, b) => new Date(b.submitted).getTime() - new Date(a.submitted).getTime())
  }, [leaveRequests, expenseReports, employees, departments])

  // ─── Team Status ───
  const teamStatus = useMemo(() => {
    return directReports.map((emp: Record<string, unknown>) => {
      const empLeave = leaveRequests.find(
        (lr: Record<string, unknown>) =>
          lr.employee_id === emp.id &&
          lr.status === 'approved' &&
          new Date(lr.start_date as string) <= new Date() &&
          new Date((lr.end_date || lr.start_date) as string) >= new Date()
      )
      const hasTimeEntry = timeEntries.some(
        (te: Record<string, unknown>) =>
          te.employee_id === emp.id &&
          new Date(te.date as string).toDateString() === new Date().toDateString()
      )
      const name = emp.profile
        ? (emp.profile as Record<string, unknown>).full_name as string
        : emp.full_name as string || 'Unknown'
      const avatarUrl = emp.profile
        ? (emp.profile as Record<string, unknown>).avatar_url as string
        : null

      let status: 'in-office' | 'on-leave' | 'wfh' | 'unknown' = 'unknown'
      let statusDetail = ''
      if (empLeave) {
        status = 'on-leave'
        statusDetail = ((empLeave as Record<string, unknown>).leave_type || (empLeave as Record<string, unknown>).type || 'Leave') as string
      } else if (hasTimeEntry) {
        status = 'in-office'
      } else {
        status = 'wfh'
      }

      return {
        id: emp.id as string,
        name,
        avatarUrl,
        jobTitle: emp.job_title as string || '',
        status,
        statusDetail: statusDetail.replace(/_/g, ' '),
        department: emp.department_id as string,
      }
    })
  }, [directReports, leaveRequests, timeEntries])

  // ─── Activity Feed ───
  const recentActivity = useMemo(() => {
    const activities: Array<{ id: string; icon: string; text: string; time: string; color: string }> = []

    // Recent leave approvals
    leaveRequests
      .filter((lr: Record<string, unknown>) => lr.status === 'approved')
      .slice(0, 3)
      .forEach((lr: Record<string, unknown>) => {
        const emp = employees.find((e: Record<string, unknown>) => e.id === lr.employee_id)
        const name = emp?.profile
          ? (emp.profile as Record<string, unknown>).full_name as string
          : (emp as any)?.full_name as string || 'Someone'
        activities.push({
          id: `leave-${lr.id}`,
          icon: 'calendar',
          text: `${name} — leave approved`,
          time: (lr.updated_at || lr.created_at || '') as string,
          color: 'text-blue-400',
        })
      })

    // Recent expense approvals
    expenseReports
      .filter((er: Record<string, unknown>) => er.status === 'approved')
      .slice(0, 3)
      .forEach((er: Record<string, unknown>) => {
        const emp = employees.find((e: Record<string, unknown>) => e.id === er.employee_id)
        const name = emp?.profile
          ? (emp.profile as Record<string, unknown>).full_name as string
          : (emp as any)?.full_name as string || 'Someone'
        activities.push({
          id: `expense-${er.id}`,
          icon: 'receipt',
          text: `${name} — expense approved`,
          time: (er.updated_at || er.created_at || '') as string,
          color: 'text-emerald-400',
        })
      })

    return activities
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 10)
  }, [leaveRequests, expenseReports, employees])

  // ─── Actions ───
  const handleApprove = useCallback((id: string, comment?: string) => {
    const leave = leaveRequests.find((lr: Record<string, unknown>) => lr.id === id)
    if (leave) {
      updateLeaveRequest?.(id, { status: 'approved', reviewer_comment: comment })
      return
    }
    const expense = expenseReports.find((er: Record<string, unknown>) => er.id === id)
    if (expense) {
      updateExpenseReport?.(id, { status: 'approved', reviewer_comment: comment })
    }
  }, [leaveRequests, expenseReports, updateLeaveRequest, updateExpenseReport])

  const handleReject = useCallback((id: string, comment?: string) => {
    const leave = leaveRequests.find((lr: Record<string, unknown>) => lr.id === id)
    if (leave) {
      updateLeaveRequest?.(id, { status: 'rejected', reviewer_comment: comment })
      return
    }
    const expense = expenseReports.find((er: Record<string, unknown>) => er.id === id)
    if (expense) {
      updateExpenseReport?.(id, { status: 'rejected', reviewer_comment: comment })
    }
  }, [leaveRequests, expenseReports, updateLeaveRequest, updateExpenseReport])

  // ─── Pull to Refresh ───
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      setPullStartY(e.touches[0].clientY)
    }
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (pullStartY === 0) return
    const distance = e.touches[0].clientY - pullStartY
    if (distance > 0 && distance < 150) {
      setPullDistance(distance)
    }
  }, [pullStartY])

  const handleTouchEnd = useCallback(() => {
    if (pullDistance > 80) {
      setIsRefreshing(true)
      ensureModulesLoaded?.(['employees', 'departments', 'leaveRequests', 'expenseReports', 'timeEntries'])
        .then(() => {
          setTimeout(() => setIsRefreshing(false), 500)
        })
    }
    setPullStartY(0)
    setPullDistance(0)
  }, [pullDistance, ensureModulesLoaded])

  const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    'in-office': { label: 'In Office', color: 'text-green-400', bg: 'bg-green-500/15' },
    'on-leave': { label: 'On Leave', color: 'text-amber-400', bg: 'bg-amber-500/15' },
    'wfh': { label: 'WFH', color: 'text-blue-400', bg: 'bg-blue-500/15' },
    'unknown': { label: 'Unknown', color: 'text-white/30', bg: 'bg-white/[0.04]' },
  }

  const ACTIVITY_ICONS: Record<string, React.ReactNode> = {
    calendar: <Calendar size={14} />,
    receipt: <Receipt size={14} />,
    user: <UserPlus size={14} />,
    award: <Award size={14} />,
  }

  const greeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div
      className="min-h-screen bg-canvas pb-24 -mx-6 -mt-6 lg:-mx-8 lg:-mt-8"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull to refresh indicator */}
      {(pullDistance > 0 || isRefreshing) && (
        <div
          className="flex items-center justify-center py-3 text-white/40 transition-all"
          style={{ height: isRefreshing ? 48 : pullDistance * 0.5 }}
        >
          <RefreshCw
            size={18}
            className={cn(isRefreshing && 'animate-spin')}
            style={{ transform: `rotate(${pullDistance * 2}deg)` }}
          />
        </div>
      )}

      {/* Header */}
      <div className="sticky top-0 z-30 bg-canvas/95 backdrop-blur-xl border-b border-white/[0.04] px-5 pt-[env(safe-area-inset-top)] pb-4">
        <div className="flex items-center justify-between pt-4">
          <div>
            <p className="text-xs text-white/30 mb-0.5">{greeting()}</p>
            <h1 className="text-lg font-bold text-white">
              {currentUser?.full_name?.split(' ')[0] || 'Manager'}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {syncPending > 0 && (
              <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-1 rounded-full">
                {syncPending} pending sync
              </span>
            )}
            {pushSupported && pushPermission !== 'granted' && (
              <button
                onClick={subscribePush}
                className="p-2.5 rounded-xl bg-white/[0.04] text-white/30 active:bg-white/[0.08] min-h-[44px] min-w-[44px] flex items-center justify-center"
                title="Enable notifications"
              >
                <BellOff size={18} />
              </button>
            )}
            {pushPermission === 'granted' && (
              <div className="p-2.5 rounded-xl bg-orange-600/10 text-orange-400 min-h-[44px] min-w-[44px] flex items-center justify-center">
                <Bell size={18} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-5 pt-5">
        {/* ─── HOME TAB ─── */}
        {activeTab === 'home' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Quick Actions Grid */}
            <div>
              <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Quick Actions</h2>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: CheckSquare, label: 'Approvals', color: 'text-orange-400', bg: 'bg-orange-500/10', badge: pendingApprovals.length, tab: 'approvals' as TabId },
                  { icon: Users, label: 'My Team', color: 'text-blue-400', bg: 'bg-blue-500/10', badge: directReports.length, tab: 'team' as TabId },
                  { icon: Calendar, label: 'Leave', color: 'text-purple-400', bg: 'bg-purple-500/10', href: '/time-attendance' },
                  { icon: Receipt, label: 'Expenses', color: 'text-emerald-400', bg: 'bg-emerald-500/10', href: '/expense' },
                  { icon: Clock, label: 'Time', color: 'text-cyan-400', bg: 'bg-cyan-500/10', href: '/time-attendance' },
                  { icon: MessageSquare, label: 'Messages', color: 'text-pink-400', bg: 'bg-pink-500/10', href: '/chat' },
                ].map((action) => {
                  const Icon = action.icon
                  const content = (
                    <div
                      key={action.label}
                      className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-[#1a1d27] border border-white/[0.04] active:bg-white/[0.06] transition-colors min-h-[88px] relative"
                    >
                      {action.badge != null && action.badge > 0 && (
                        <span className="absolute top-2 right-2 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                          {action.badge}
                        </span>
                      )}
                      <div className={cn('p-2 rounded-xl', action.bg)}>
                        <Icon size={20} className={action.color} />
                      </div>
                      <span className="text-[11px] font-medium text-white/50">{action.label}</span>
                    </div>
                  )

                  if ('tab' in action && action.tab) {
                    return (
                      <button key={action.label} onClick={() => setActiveTab(action.tab!)}>
                        {content}
                      </button>
                    )
                  }
                  if ('href' in action) {
                    return (
                      <a key={action.label} href={action.href}>
                        {content}
                      </a>
                    )
                  }
                  return content
                })}
              </div>
            </div>

            {/* Pending Approvals Preview */}
            {pendingApprovals.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider">
                    Pending Approvals
                  </h2>
                  <button
                    onClick={() => setActiveTab('approvals')}
                    className="text-xs text-orange-400 flex items-center gap-1 min-h-[44px]"
                  >
                    View all ({pendingApprovals.length})
                    <ChevronRight size={14} />
                  </button>
                </div>
                {pendingApprovals.slice(0, 2).map((item) => (
                  <ApprovalCard
                    key={item.id}
                    item={item}
                    onApprove={handleApprove}
                    onReject={handleReject}
                  />
                ))}
              </div>
            )}

            {/* Team Status Preview */}
            {teamStatus.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider">
                    Team Today
                  </h2>
                  <button
                    onClick={() => setActiveTab('team')}
                    className="text-xs text-orange-400 flex items-center gap-1 min-h-[44px]"
                  >
                    View all
                    <ChevronRight size={14} />
                  </button>
                </div>
                <div className="space-y-2">
                  {teamStatus.slice(0, 4).map((member) => (
                    <div key={member.id} className="flex items-center gap-3 p-3 rounded-xl bg-[#1a1d27] border border-white/[0.04]">
                      <Avatar name={member.name} src={member.avatarUrl} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{member.name}</p>
                        <p className="text-[11px] text-white/30 truncate">{member.jobTitle}</p>
                      </div>
                      <span className={cn(
                        'text-[10px] font-medium px-2.5 py-1 rounded-full',
                        STATUS_CONFIG[member.status].bg,
                        STATUS_CONFIG[member.status].color
                      )}>
                        {STATUS_CONFIG[member.status].label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Activity */}
            {recentActivity.length > 0 && (
              <div>
                <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">
                  Recent Activity
                </h2>
                <div className="space-y-1">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center gap-3 py-2.5">
                      <div className={cn('p-1.5 rounded-lg bg-white/[0.04]', activity.color)}>
                        {ACTIVITY_ICONS[activity.icon] || <TrendingUp size={14} />}
                      </div>
                      <p className="flex-1 text-xs text-white/50 truncate">{activity.text}</p>
                      <span className="text-[10px] text-white/20 whitespace-nowrap">
                        {activity.time ? timeAgo(activity.time) : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── TEAM TAB ─── */}
        {activeTab === 'team' && (
          <div className="animate-in fade-in duration-300">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-white">My Team</h2>
              <span className="text-xs text-white/30">{directReports.length} direct reports</span>
            </div>

            {/* Status summary */}
            <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
              {(['in-office', 'wfh', 'on-leave'] as const).map((status) => {
                const count = teamStatus.filter((m) => m.status === status).length
                return (
                  <div key={status} className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-xl whitespace-nowrap',
                    STATUS_CONFIG[status].bg
                  )}>
                    <span className={cn('text-xs font-medium', STATUS_CONFIG[status].color)}>
                      {count}
                    </span>
                    <span className="text-xs text-white/40">{STATUS_CONFIG[status].label}</span>
                  </div>
                )
              })}
            </div>

            {/* Team list */}
            <div className="space-y-2">
              {teamStatus.map((member) => (
                <div key={member.id} className="flex items-center gap-3 p-4 rounded-2xl bg-[#1a1d27] border border-white/[0.04]">
                  <Avatar name={member.name} src={member.avatarUrl} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{member.name}</p>
                    <p className="text-xs text-white/30 truncate">{member.jobTitle}</p>
                    {member.status === 'on-leave' && member.statusDetail && (
                      <p className="text-[11px] text-amber-400/70 mt-0.5">{member.statusDetail}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className={cn(
                      'text-[10px] font-medium px-2.5 py-1 rounded-full',
                      STATUS_CONFIG[member.status].bg,
                      STATUS_CONFIG[member.status].color
                    )}>
                      {STATUS_CONFIG[member.status].label}
                    </span>
                    <div className="flex gap-1">
                      <a
                        href="/chat"
                        className="p-1.5 rounded-lg bg-white/[0.04] text-white/25 active:bg-white/[0.08] min-w-[32px] min-h-[32px] flex items-center justify-center"
                      >
                        <MessageSquare size={14} />
                      </a>
                    </div>
                  </div>
                </div>
              ))}

              {teamStatus.length === 0 && (
                <div className="text-center py-12">
                  <Users size={32} className="text-white/10 mx-auto mb-3" />
                  <p className="text-sm text-white/30">No direct reports found</p>
                  <p className="text-xs text-white/15 mt-1">Team members will appear here</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── APPROVALS TAB ─── */}
        {activeTab === 'approvals' && (
          <div className="animate-in fade-in duration-300">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-white">Pending Approvals</h2>
              {pendingApprovals.length > 0 && (
                <span className="text-xs bg-red-500/15 text-red-400 px-2.5 py-1 rounded-full font-medium">
                  {pendingApprovals.length} pending
                </span>
              )}
            </div>

            {/* Filter chips */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
              {['All', 'Leave', 'Expense', 'Timesheet'].map((filter) => (
                <button
                  key={filter}
                  className="px-3 py-1.5 rounded-full text-xs font-medium bg-white/[0.04] text-white/40 active:bg-white/[0.08] whitespace-nowrap min-h-[32px]"
                >
                  {filter}
                </button>
              ))}
            </div>

            {/* Swipe hint */}
            {pendingApprovals.length > 0 && (
              <p className="text-[10px] text-white/15 text-center mb-3">
                Swipe right to approve, left to reject
              </p>
            )}

            {/* Approval cards */}
            {pendingApprovals.map((item) => (
              <ApprovalCard
                key={item.id}
                item={item}
                onApprove={handleApprove}
                onReject={handleReject}
              />
            ))}

            {pendingApprovals.length === 0 && (
              <div className="text-center py-16">
                <CheckSquare size={40} className="text-white/10 mx-auto mb-3" />
                <p className="text-sm text-white/30">All caught up!</p>
                <p className="text-xs text-white/15 mt-1">No pending approvals</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mobile Bottom Nav */}
      <MobileManagerNav
        approvalCount={pendingApprovals.length}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as TabId)}
      />
    </div>
  )
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const minutes = Math.floor(diff / (1000 * 60))
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}
