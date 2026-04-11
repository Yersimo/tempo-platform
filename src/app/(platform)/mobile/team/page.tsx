'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Users, ChevronLeft, RefreshCw, MessageSquare, User,
  Calendar, ChevronRight, MapPin, Phone, Mail,
} from 'lucide-react'
import { useTempo } from '@/lib/store'
import { Avatar } from '@/components/ui/avatar'
import { cn } from '@/lib/utils/cn'

export default function MobileTeamPage() {
  const router = useRouter()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pullStartY, setPullStartY] = useState(0)
  const [pullDistance, setPullDistance] = useState(0)
  const [selectedMember, setSelectedMember] = useState<string | null>(null)
  const [calendarMonth, setCalendarMonth] = useState(new Date())

  const {
    currentUser,
    employees,
    departments,
    leaveRequests,
    timeEntries,
    ensureModulesLoaded,
  } = useTempo()

  useEffect(() => {
    ensureModulesLoaded?.(['employees', 'departments', 'leaveRequests', 'timeEntries'])
  }, [ensureModulesLoaded])

  const directReports = useMemo(() => {
    if (!currentUser?.employee_id) return []
    return employees.filter((e: Record<string, unknown>) =>
      e.manager_id === currentUser.employee_id || e.reports_to === currentUser.employee_id
    )
  }, [employees, currentUser])

  const teamStatus = useMemo(() => {
    const today = new Date()
    return directReports.map((emp: Record<string, unknown>) => {
      const empLeave = leaveRequests.find(
        (lr: Record<string, unknown>) =>
          lr.employee_id === emp.id &&
          lr.status === 'approved' &&
          new Date(lr.start_date as string) <= today &&
          new Date((lr.end_date || lr.start_date) as string) >= today
      )
      const hasTimeEntry = timeEntries.some(
        (te: Record<string, unknown>) =>
          te.employee_id === emp.id &&
          new Date(te.date as string).toDateString() === today.toDateString()
      )
      const name = emp.profile
        ? (emp.profile as Record<string, unknown>).full_name as string
        : emp.full_name as string || 'Unknown'
      const avatarUrl = emp.profile
        ? (emp.profile as Record<string, unknown>).avatar_url as string
        : null
      const email = emp.profile
        ? (emp.profile as Record<string, unknown>).email as string
        : emp.email as string || ''

      let status: 'in-office' | 'on-leave' | 'wfh' | 'unknown' = 'unknown'
      let leaveType = ''
      if (empLeave) {
        status = 'on-leave'
        leaveType = ((empLeave as any).leave_type || (empLeave as any).type || 'Leave') as string
      } else if (hasTimeEntry) {
        status = 'in-office'
      } else {
        status = 'wfh'
      }

      return {
        id: emp.id as string,
        name,
        avatarUrl,
        email,
        jobTitle: emp.job_title as string || '',
        departmentId: emp.department_id as string,
        status,
        leaveType: leaveType.replace(/_/g, ' '),
      }
    })
  }, [directReports, leaveRequests, timeEntries])

  // Who's out this week
  const outThisWeek = useMemo(() => {
    const today = new Date()
    const weekEnd = new Date(today)
    weekEnd.setDate(weekEnd.getDate() + (7 - weekEnd.getDay()))
    return leaveRequests
      .filter((lr: Record<string, unknown>) => {
        if (lr.status !== 'approved') return false
        const start = new Date(lr.start_date as string)
        const end = new Date((lr.end_date || lr.start_date) as string)
        return start <= weekEnd && end >= today && directReports.some((e: any) => e.id === lr.employee_id)
      })
      .map((lr: Record<string, unknown>) => {
        const emp = employees.find((e: Record<string, unknown>) => e.id === lr.employee_id)
        const name = emp?.profile
          ? ((emp as any).profile as any)?.full_name
          : (emp as any)?.full_name || 'Unknown'
        return {
          id: lr.id as string,
          name,
          startDate: lr.start_date as string,
          endDate: (lr.end_date || lr.start_date) as string,
          type: ((lr as any).leave_type || (lr as any).type || 'Leave').replace(/_/g, ' '),
        }
      })
  }, [leaveRequests, directReports, employees])

  // Compact calendar data
  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear()
    const month = calendarMonth.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const days: Array<{ day: number; isToday: boolean; hasLeave: boolean }> = []
    const today = new Date()

    // Padding
    for (let i = 0; i < firstDay; i++) days.push({ day: 0, isToday: false, hasLeave: false })

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d)
      const isToday = date.toDateString() === today.toDateString()
      const hasLeave = leaveRequests.some((lr: Record<string, unknown>) => {
        if (lr.status !== 'approved') return false
        if (!directReports.some((e: any) => e.id === lr.employee_id)) return false
        const start = new Date(lr.start_date as string)
        const end = new Date((lr.end_date || lr.start_date) as string)
        return date >= start && date <= end
      })
      days.push({ day: d, isToday, hasLeave })
    }
    return days
  }, [calendarMonth, leaveRequests, directReports])

  // Pull to refresh
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (window.scrollY === 0) setPullStartY(e.touches[0].clientY)
  }, [])
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (pullStartY === 0) return
    const d = e.touches[0].clientY - pullStartY
    if (d > 0 && d < 150) setPullDistance(d)
  }, [pullStartY])
  const handleTouchEnd = useCallback(() => {
    if (pullDistance > 80) {
      setIsRefreshing(true)
      ensureModulesLoaded?.(['employees', 'departments', 'leaveRequests', 'timeEntries'])
        .then(() => setTimeout(() => setIsRefreshing(false), 500))
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

  const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

  return (
    <div
      className="min-h-screen bg-canvas pb-8 -mx-6 -mt-6 lg:-mx-8 lg:-mt-8"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {(pullDistance > 0 || isRefreshing) && (
        <div className="flex items-center justify-center py-3 text-white/40 transition-all"
          style={{ height: isRefreshing ? 48 : pullDistance * 0.5 }}
        >
          <RefreshCw size={18} className={cn(isRefreshing && 'animate-spin')} />
        </div>
      )}

      {/* Header */}
      <div className="sticky top-0 z-30 bg-canvas/95 backdrop-blur-xl border-b border-white/[0.04] px-5 pt-[env(safe-area-inset-top)] pb-4">
        <div className="flex items-center gap-3 pt-4">
          <button
            onClick={() => router.push('/mobile')}
            className="p-2 rounded-xl bg-white/[0.04] text-white/50 active:bg-white/[0.08] min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-white">My Team</h1>
            <p className="text-[11px] text-white/30">{directReports.length} direct reports</p>
          </div>
        </div>
      </div>

      <div className="px-5 pt-5 space-y-6">
        {/* Status summary */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {(['in-office', 'wfh', 'on-leave'] as const).map((status) => {
            const count = teamStatus.filter((m) => m.status === status).length
            return (
              <div key={status} className={cn(
                'flex items-center gap-2 px-4 py-3 rounded-2xl whitespace-nowrap flex-1 min-h-[44px]',
                STATUS_CONFIG[status].bg
              )}>
                <span className={cn('text-lg font-bold', STATUS_CONFIG[status].color)}>{count}</span>
                <span className="text-xs text-white/40">{STATUS_CONFIG[status].label}</span>
              </div>
            )
          })}
        </div>

        {/* Who's out this week */}
        {outThisWeek.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Out This Week</h2>
            <div className="space-y-2">
              {outThisWeek.map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/[0.06] border border-amber-500/10">
                  <Calendar size={14} className="text-amber-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white font-medium truncate">{item.name}</p>
                    <p className="text-[10px] text-white/30">{item.type} &middot; {item.startDate} - {item.endDate}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Team leave calendar */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider">Team Calendar</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}
                className="p-1.5 rounded-lg bg-white/[0.04] text-white/30 active:bg-white/[0.08] min-w-[32px] min-h-[32px] flex items-center justify-center"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-xs text-white/50 min-w-[100px] text-center">
                {calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
              <button
                onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}
                className="p-1.5 rounded-lg bg-white/[0.04] text-white/30 active:bg-white/[0.08] min-w-[32px] min-h-[32px] flex items-center justify-center"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
          <div className="rounded-2xl bg-[#1a1d27] border border-white/[0.04] p-3">
            <div className="grid grid-cols-7 gap-1 mb-1">
              {WEEKDAYS.map((d, i) => (
                <div key={i} className="text-center text-[10px] text-white/20 font-medium py-1">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((d, i) => (
                <div
                  key={i}
                  className={cn(
                    'text-center text-[11px] py-1.5 rounded-lg relative',
                    d.day === 0 && 'invisible',
                    d.isToday && 'bg-teal-700/15 text-teal-400 font-bold',
                    !d.isToday && d.hasLeave && 'text-amber-400',
                    !d.isToday && !d.hasLeave && 'text-white/30',
                  )}
                >
                  {d.day > 0 && d.day}
                  {d.hasLeave && (
                    <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-amber-400" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Team list */}
        <div>
          <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Direct Reports</h2>
          <div className="space-y-2">
            {teamStatus.map((member) => (
              <button
                key={member.id}
                onClick={() => setSelectedMember(selectedMember === member.id ? null : member.id)}
                className="w-full text-left"
              >
                <div className={cn(
                  'flex items-center gap-3 p-4 rounded-2xl bg-[#1a1d27] border transition-colors',
                  selectedMember === member.id ? 'border-teal-700/20' : 'border-white/[0.04]'
                )}>
                  <Avatar name={member.name} src={member.avatarUrl} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{member.name}</p>
                    <p className="text-xs text-white/30 truncate">{member.jobTitle}</p>
                    {member.status === 'on-leave' && (
                      <p className="text-[11px] text-amber-400/70 mt-0.5">{member.leaveType}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className={cn(
                      'text-[10px] font-medium px-2.5 py-1 rounded-full',
                      STATUS_CONFIG[member.status].bg,
                      STATUS_CONFIG[member.status].color,
                    )}>
                      {STATUS_CONFIG[member.status].label}
                    </span>
                  </div>
                </div>

                {/* Expanded quick actions */}
                {selectedMember === member.id && (
                  <div className="flex gap-2 mt-2 ml-14 animate-in slide-in-from-top-2 duration-200">
                    <a
                      href="/chat"
                      className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-blue-500/10 text-blue-400 text-xs min-h-[44px] active:bg-blue-500/20"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MessageSquare size={14} /> Message
                    </a>
                    <a
                      href={`/people/${member.id}`}
                      className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-white/[0.04] text-white/50 text-xs min-h-[44px] active:bg-white/[0.08]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <User size={14} /> Profile
                    </a>
                    <a
                      href="/time-attendance"
                      className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-white/[0.04] text-white/50 text-xs min-h-[44px] active:bg-white/[0.08]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Calendar size={14} /> Leave
                    </a>
                  </div>
                )}
              </button>
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
      </div>
    </div>
  )
}
