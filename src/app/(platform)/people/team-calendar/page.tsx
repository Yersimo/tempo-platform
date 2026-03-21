'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { Header } from '@/components/layout/header'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input, Select } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Avatar } from '@/components/ui/avatar'
import { PageSkeleton } from '@/components/ui/page-skeleton'
import { useTempo } from '@/lib/store'
import {
  ChevronLeft, ChevronRight, Calendar, Users, AlertTriangle,
  Sun, Thermometer, Heart, Baby, Coffee, Clock, Filter, Eye,
} from 'lucide-react'

// ============================================================
// TYPES
// ============================================================

interface CalEmployee {
  id: string
  fullName: string
  avatarUrl: string | null
  jobTitle: string | null
  departmentId: string | null
  managerId: string | null
  country: string | null
}

interface CalLeave {
  id: string
  employeeId: string
  type: string
  startDate: string
  endDate: string
  days: number
  status: string
  reason: string | null
}

interface CalDepartment {
  id: string
  name: string
}

type CalendarViewMode = 'month' | 'week'

// ============================================================
// CONSTANTS
// ============================================================

const LEAVE_COLORS: Record<string, { bg: string; border: string; text: string; label: string; icon: typeof Sun }> = {
  annual:        { bg: 'bg-blue-100', border: 'border-blue-300', text: 'text-blue-700', label: 'Annual/Vacation', icon: Sun },
  sick:          { bg: 'bg-red-100', border: 'border-red-300', text: 'text-red-700', label: 'Sick', icon: Thermometer },
  personal:      { bg: 'bg-orange-100', border: 'border-orange-300', text: 'text-orange-700', label: 'Personal', icon: Coffee },
  maternity:     { bg: 'bg-purple-100', border: 'border-purple-300', text: 'text-purple-700', label: 'Maternity', icon: Baby },
  paternity:     { bg: 'bg-purple-100', border: 'border-purple-300', text: 'text-purple-700', label: 'Paternity', icon: Baby },
  unpaid:        { bg: 'bg-gray-100', border: 'border-gray-300', text: 'text-gray-700', label: 'Unpaid', icon: Clock },
  compassionate: { bg: 'bg-pink-100', border: 'border-pink-300', text: 'text-pink-700', label: 'Compassionate', icon: Heart },
}

const DEFAULT_LEAVE_COLOR = { bg: 'bg-gray-100', border: 'border-gray-300', text: 'text-gray-700', label: 'Other', icon: Clock }

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const DAY_NAMES_SHORT = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

// ============================================================
// DATE HELPERS
// ============================================================

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

function getFirstDayOfWeek(year: number, month: number): number {
  // 0=Mon, 6=Sun (ISO week)
  const day = new Date(year, month - 1, 1).getDay()
  return day === 0 ? 6 : day - 1
}

function formatDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function parseDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function isSameDay(a: string, b: string): boolean {
  return a === b
}

function isToday(dateStr: string): boolean {
  return dateStr === formatDate(new Date())
}

function getWeekDates(year: number, month: number, day: number): string[] {
  const date = new Date(year, month - 1, day)
  const dayOfWeek = date.getDay()
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  const monday = new Date(date)
  monday.setDate(date.getDate() + mondayOffset)

  const dates: string[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    dates.push(formatDate(d))
  }
  return dates
}

// ============================================================
// GANTT-STYLE MONTH VIEW
// ============================================================

function GanttMonthView({
  year,
  month,
  employees,
  leaves,
  deptMap,
  onLeaveClick,
}: {
  year: number
  month: number
  employees: CalEmployee[]
  leaves: CalLeave[]
  deptMap: Map<string, CalDepartment>
  onLeaveClick: (leave: CalLeave) => void
}) {
  const daysInMonth = getDaysInMonth(year, month)
  const today = formatDate(new Date())
  const todayDate = new Date()
  const isCurrentMonth = todayDate.getFullYear() === year && todayDate.getMonth() + 1 === month

  // Build leave map: employeeId -> leaves[]
  const leavesByEmployee = useMemo(() => {
    const map = new Map<string, CalLeave[]>()
    for (const leave of leaves) {
      if (!map.has(leave.employeeId)) map.set(leave.employeeId, [])
      map.get(leave.employeeId)!.push(leave)
    }
    return map
  }, [leaves])

  // Calculate availability per day
  const availabilityByDay = useMemo(() => {
    const result: Record<number, number> = {}
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      let outCount = 0
      for (const leave of leaves) {
        if (leave.status === 'rejected' || leave.status === 'cancelled') continue
        if (dateStr >= leave.startDate && dateStr <= leave.endDate) {
          outCount++
        }
      }
      result[d] = outCount
    }
    return result
  }, [leaves, year, month, daysInMonth])

  // Conflict alerts: days where >30% of filtered employees are out
  const conflictDays = useMemo(() => {
    const threshold = Math.max(1, Math.ceil(employees.length * 0.3))
    const days: number[] = []
    for (let d = 1; d <= daysInMonth; d++) {
      if ((availabilityByDay[d] || 0) >= threshold) {
        days.push(d)
      }
    }
    return new Set(days)
  }, [availabilityByDay, employees.length, daysInMonth])

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[900px]">
        {/* Header row: day numbers */}
        <div className="flex border-b border-border sticky top-0 bg-card z-10">
          <div className="w-[200px] min-w-[200px] px-3 py-2 border-r border-border">
            <span className="text-xs font-semibold text-t2">Employee</span>
          </div>
          {Array.from({ length: daysInMonth }, (_, i) => {
            const d = i + 1
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
            const dayDate = new Date(year, month - 1, d)
            const dayOfWeek = dayDate.getDay()
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
            const isTodayDay = isToday(dateStr)
            const hasConflict = conflictDays.has(d)

            return (
              <div
                key={d}
                className={`
                  flex-1 min-w-[32px] px-0.5 py-1.5 text-center border-r border-border
                  ${isWeekend ? 'bg-gray-50' : ''}
                  ${isTodayDay ? 'bg-tempo-50' : ''}
                `}
              >
                <span className={`text-[0.6rem] block ${isTodayDay ? 'font-bold text-tempo-600' : 'text-t3'}`}>
                  {DAY_NAMES_SHORT[dayOfWeek === 0 ? 6 : dayOfWeek - 1]}
                </span>
                <span className={`text-[0.65rem] font-medium ${isTodayDay ? 'text-tempo-600' : 'text-t2'}`}>
                  {d}
                </span>
                {hasConflict && (
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 mx-auto mt-0.5" title="High absence day" />
                )}
              </div>
            )
          })}
        </div>

        {/* Availability summary row */}
        <div className="flex border-b border-border bg-canvas">
          <div className="w-[200px] min-w-[200px] px-3 py-1.5 border-r border-border">
            <span className="text-[0.6rem] text-t3 font-medium">Out of office</span>
          </div>
          {Array.from({ length: daysInMonth }, (_, i) => {
            const d = i + 1
            const outCount = availabilityByDay[d] || 0
            const hasConflict = conflictDays.has(d)
            return (
              <div
                key={d}
                className={`flex-1 min-w-[32px] text-center py-1.5 border-r border-border
                  ${hasConflict ? 'bg-red-50' : ''}`}
              >
                {outCount > 0 && (
                  <span className={`text-[0.6rem] font-semibold ${hasConflict ? 'text-red-600' : 'text-t3'}`}>
                    {outCount}
                  </span>
                )}
              </div>
            )
          })}
        </div>

        {/* Employee rows */}
        {employees.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-t3">No employees match the current filters.</p>
          </div>
        ) : (
          employees.map(emp => {
            const empLeaves = leavesByEmployee.get(emp.id) || []
            return (
              <div key={emp.id} className="flex border-b border-border hover:bg-canvas/50 transition-colors">
                {/* Employee name cell */}
                <div className="w-[200px] min-w-[200px] px-3 py-2 border-r border-border flex items-center gap-2">
                  <Avatar src={emp.avatarUrl} name={emp.fullName} size="xs" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-t1 truncate">{emp.fullName}</p>
                    <p className="text-[0.55rem] text-t3 truncate">{emp.jobTitle || ''}</p>
                  </div>
                </div>

                {/* Day cells with leave bars */}
                <div className="flex flex-1 relative" style={{ minHeight: '36px' }}>
                  {/* Background day grid */}
                  {Array.from({ length: daysInMonth }, (_, i) => {
                    const d = i + 1
                    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
                    const dayDate = new Date(year, month - 1, d)
                    const dayOfWeek = dayDate.getDay()
                    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
                    const isTodayDay = isToday(dateStr)

                    return (
                      <div
                        key={d}
                        className={`flex-1 min-w-[32px] border-r border-border
                          ${isWeekend ? 'bg-gray-50/50' : ''}
                          ${isTodayDay ? 'bg-tempo-50/50' : ''}
                        `}
                      />
                    )
                  })}

                  {/* Leave bars overlaid */}
                  {empLeaves.map(leave => {
                    if (leave.status === 'rejected' || leave.status === 'cancelled') return null
                    const leaveStart = parseDate(leave.startDate)
                    const leaveEnd = parseDate(leave.endDate)
                    const monthStart = new Date(year, month - 1, 1)
                    const monthEnd = new Date(year, month - 1, daysInMonth)

                    const visStart = leaveStart < monthStart ? monthStart : leaveStart
                    const visEnd = leaveEnd > monthEnd ? monthEnd : leaveEnd

                    const startDay = visStart.getDate()
                    const endDay = visEnd.getDate()
                    const totalDays = daysInMonth

                    const leftPct = ((startDay - 1) / totalDays) * 100
                    const widthPct = ((endDay - startDay + 1) / totalDays) * 100

                    const color = LEAVE_COLORS[leave.type] || DEFAULT_LEAVE_COLOR
                    const isPending = leave.status === 'pending'

                    return (
                      <div
                        key={leave.id}
                        className={`absolute top-1 h-[calc(100%-8px)] rounded-md cursor-pointer transition-all hover:brightness-95 hover:shadow-sm
                          ${color.bg} ${color.border} border
                          ${isPending ? 'opacity-70' : ''}
                        `}
                        style={{
                          left: `${leftPct}%`,
                          width: `${widthPct}%`,
                          minWidth: '8px',
                          backgroundImage: isPending
                            ? 'repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(0,0,0,0.05) 3px, rgba(0,0,0,0.05) 6px)'
                            : undefined,
                        }}
                        onClick={() => onLeaveClick(leave)}
                        title={`${color.label} - ${leave.startDate} to ${leave.endDate}${isPending ? ' (Pending)' : ''}`}
                      >
                        {widthPct > 8 && (
                          <span className={`text-[0.5rem] font-medium px-1 truncate block leading-[28px] ${color.text}`}>
                            {color.label}
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

// ============================================================
// WEEK VIEW
// ============================================================

function WeekView({
  weekDates,
  employees,
  leaves,
  deptMap,
  onLeaveClick,
}: {
  weekDates: string[]
  employees: CalEmployee[]
  leaves: CalLeave[]
  deptMap: Map<string, CalDepartment>
  onLeaveClick: (leave: CalLeave) => void
}) {
  const today = formatDate(new Date())

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[700px]">
        {/* Header */}
        <div className="flex border-b border-border sticky top-0 bg-card z-10">
          <div className="w-[200px] min-w-[200px] px-3 py-2 border-r border-border">
            <span className="text-xs font-semibold text-t2">Employee</span>
          </div>
          {weekDates.map((dateStr, i) => {
            const d = parseDate(dateStr)
            const isWeekend = d.getDay() === 0 || d.getDay() === 6
            const isTodayDay = dateStr === today
            return (
              <div
                key={dateStr}
                className={`flex-1 min-w-[80px] px-2 py-2 text-center border-r border-border
                  ${isWeekend ? 'bg-gray-50' : ''}
                  ${isTodayDay ? 'bg-tempo-50' : ''}
                `}
              >
                <span className={`text-xs block ${isTodayDay ? 'font-bold text-tempo-600' : 'text-t3'}`}>
                  {DAY_NAMES[i]}
                </span>
                <span className={`text-sm font-semibold ${isTodayDay ? 'text-tempo-600' : 'text-t1'}`}>
                  {d.getDate()}
                </span>
                <span className="text-[0.6rem] text-t3 block">
                  {MONTH_NAMES[d.getMonth()].slice(0, 3)}
                </span>
              </div>
            )
          })}
        </div>

        {/* Employee rows */}
        {employees.map(emp => (
          <div key={emp.id} className="flex border-b border-border hover:bg-canvas/50 transition-colors">
            <div className="w-[200px] min-w-[200px] px-3 py-3 border-r border-border flex items-center gap-2">
              <Avatar src={emp.avatarUrl} name={emp.fullName} size="xs" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-t1 truncate">{emp.fullName}</p>
                <p className="text-[0.55rem] text-t3 truncate">{emp.jobTitle || ''}</p>
              </div>
            </div>
            {weekDates.map((dateStr, i) => {
              const d = parseDate(dateStr)
              const isWeekend = d.getDay() === 0 || d.getDay() === 6
              const isTodayDay = dateStr === today

              const dayLeaves = leaves.filter(l =>
                l.employeeId === emp.id &&
                l.status !== 'rejected' &&
                l.status !== 'cancelled' &&
                dateStr >= l.startDate &&
                dateStr <= l.endDate
              )

              return (
                <div
                  key={dateStr}
                  className={`flex-1 min-w-[80px] px-1 py-1.5 border-r border-border
                    ${isWeekend ? 'bg-gray-50/50' : ''}
                    ${isTodayDay ? 'bg-tempo-50/50' : ''}
                  `}
                >
                  {dayLeaves.map(leave => {
                    const color = LEAVE_COLORS[leave.type] || DEFAULT_LEAVE_COLOR
                    const isPending = leave.status === 'pending'
                    return (
                      <div
                        key={leave.id}
                        className={`px-1.5 py-1 rounded text-[0.6rem] font-medium cursor-pointer mb-0.5
                          ${color.bg} ${color.text} ${color.border} border
                          ${isPending ? 'opacity-70' : ''}
                        `}
                        style={{
                          backgroundImage: isPending
                            ? 'repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(0,0,0,0.05) 3px, rgba(0,0,0,0.05) 6px)'
                            : undefined,
                        }}
                        onClick={() => onLeaveClick(leave)}
                      >
                        {color.label}
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================================
// LEAVE DETAIL MODAL
// ============================================================

function LeaveDetailModal({
  leave,
  employees,
  onClose,
}: {
  leave: CalLeave
  employees: CalEmployee[]
  onClose: () => void
}) {
  const emp = employees.find(e => e.id === leave.employeeId)
  const color = LEAVE_COLORS[leave.type] || DEFAULT_LEAVE_COLOR

  return (
    <Modal open={true} onClose={onClose} title="Leave Request Details" size="sm">
      <div className="space-y-4">
        {emp && (
          <div className="flex items-center gap-3">
            <Avatar src={emp.avatarUrl} name={emp.fullName} size="md" />
            <div>
              <p className="text-sm font-semibold text-t1">{emp.fullName}</p>
              <p className="text-xs text-t3">{emp.jobTitle}</p>
            </div>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[0.65rem] text-t3 uppercase tracking-wide font-medium mb-1">Type</p>
            <Badge variant={leave.type === 'sick' ? 'error' : leave.type === 'annual' ? 'info' : 'default'}>
              {color.label}
            </Badge>
          </div>
          <div>
            <p className="text-[0.65rem] text-t3 uppercase tracking-wide font-medium mb-1">Status</p>
            <Badge variant={leave.status === 'approved' ? 'success' : leave.status === 'pending' ? 'warning' : 'error'}>
              {leave.status}
            </Badge>
          </div>
          <div>
            <p className="text-[0.65rem] text-t3 uppercase tracking-wide font-medium mb-1">Start Date</p>
            <p className="text-xs text-t1">{leave.startDate}</p>
          </div>
          <div>
            <p className="text-[0.65rem] text-t3 uppercase tracking-wide font-medium mb-1">End Date</p>
            <p className="text-xs text-t1">{leave.endDate}</p>
          </div>
          <div>
            <p className="text-[0.65rem] text-t3 uppercase tracking-wide font-medium mb-1">Duration</p>
            <p className="text-xs text-t1">{leave.days} day{leave.days !== 1 ? 's' : ''}</p>
          </div>
        </div>
        {leave.reason && (
          <div>
            <p className="text-[0.65rem] text-t3 uppercase tracking-wide font-medium mb-1">Reason</p>
            <p className="text-xs text-t1">{leave.reason}</p>
          </div>
        )}
      </div>
    </Modal>
  )
}

// ============================================================
// MAIN PAGE
// ============================================================

export default function TeamCalendarPage() {
  const { employees: storeEmployees, departments: storeDepts, leaveRequests: storeLeaves, ensureModulesLoaded } = useTempo()
  const [pageLoading, setPageLoading] = useState(true)
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month')
  const [deptFilter, setDeptFilter] = useState('all')
  const [managerFilter, setManagerFilter] = useState('all')
  const [selectedLeave, setSelectedLeave] = useState<CalLeave | null>(null)

  // Current date for navigation
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [weekDay, setWeekDay] = useState(now.getDate())

  // Load data
  useEffect(() => {
    ensureModulesLoaded?.(['employees', 'departments', 'leaveRequests'])
      ?.then?.(() => setPageLoading(false))
      ?.catch?.(() => setPageLoading(false))
    const t = setTimeout(() => setPageLoading(false), 2000)
    return () => clearTimeout(t)
  }, [ensureModulesLoaded])

  // Map data
  const employees: CalEmployee[] = useMemo(() =>
    (storeEmployees || [])
      .filter((e: any) => e.is_active !== false && e.isActive !== false)
      .map((e: any) => ({
        id: e.id,
        fullName: e.full_name || e.fullName || e.profile?.full_name || 'Unknown',
        avatarUrl: e.avatar_url || e.avatarUrl || e.profile?.avatar_url || null,
        jobTitle: e.job_title || e.jobTitle || null,
        departmentId: e.department_id || e.departmentId || null,
        managerId: e.manager_id || e.managerId || null,
        country: e.country || null,
      }))
  , [storeEmployees])

  const leaves: CalLeave[] = useMemo(() =>
    (storeLeaves || []).map((l: any) => ({
      id: l.id,
      employeeId: l.employee_id || l.employeeId,
      type: l.type,
      startDate: l.start_date || l.startDate,
      endDate: l.end_date || l.endDate,
      days: l.days,
      status: l.status,
      reason: l.reason || null,
    }))
  , [storeLeaves])

  const deptMap = useMemo(() => {
    const m = new Map<string, CalDepartment>()
    for (const d of (storeDepts || []) as any[]) {
      m.set(d.id, { id: d.id, name: d.name })
    }
    return m
  }, [storeDepts])

  // Filters
  const filteredEmployees = useMemo(() => {
    let emps = employees
    if (deptFilter !== 'all') {
      emps = emps.filter(e => e.departmentId === deptFilter)
    }
    if (managerFilter !== 'all') {
      emps = emps.filter(e => e.managerId === managerFilter)
    }
    return emps.sort((a, b) => a.fullName.localeCompare(b.fullName))
  }, [employees, deptFilter, managerFilter])

  const filteredLeaves = useMemo(() => {
    const empIds = new Set(filteredEmployees.map(e => e.id))
    return leaves.filter(l => empIds.has(l.employeeId))
  }, [leaves, filteredEmployees])

  // Navigation
  const goToPrev = useCallback(() => {
    if (viewMode === 'month') {
      if (month === 1) { setMonth(12); setYear(y => y - 1) }
      else setMonth(m => m - 1)
    } else {
      const d = new Date(year, month - 1, weekDay - 7)
      setYear(d.getFullYear())
      setMonth(d.getMonth() + 1)
      setWeekDay(d.getDate())
    }
  }, [viewMode, month, year, weekDay])

  const goToNext = useCallback(() => {
    if (viewMode === 'month') {
      if (month === 12) { setMonth(1); setYear(y => y + 1) }
      else setMonth(m => m + 1)
    } else {
      const d = new Date(year, month - 1, weekDay + 7)
      setYear(d.getFullYear())
      setMonth(d.getMonth() + 1)
      setWeekDay(d.getDate())
    }
  }, [viewMode, month, year, weekDay])

  const goToToday = useCallback(() => {
    const now = new Date()
    setYear(now.getFullYear())
    setMonth(now.getMonth() + 1)
    setWeekDay(now.getDate())
  }, [])

  const weekDates = useMemo(() => getWeekDates(year, month, weekDay), [year, month, weekDay])

  // Dept/manager options
  const deptOptions = useMemo(() => [
    { value: 'all', label: 'All Departments' },
    ...Array.from(deptMap.values()).map(d => ({ value: d.id, label: d.name })),
  ], [deptMap])

  const managerOptions = useMemo(() => {
    const managers = employees.filter(e =>
      employees.some(r => r.managerId === e.id)
    )
    return [
      { value: 'all', label: 'All Teams' },
      ...managers.sort((a, b) => a.fullName.localeCompare(b.fullName)).map(m => ({
        value: m.id,
        label: `${m.fullName}'s Team`,
      })),
    ]
  }, [employees])

  // Conflict summary
  const conflictDayCount = useMemo(() => {
    const daysInMonth = getDaysInMonth(year, month)
    const threshold = Math.max(1, Math.ceil(filteredEmployees.length * 0.3))
    let count = 0
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      let outCount = 0
      for (const leave of filteredLeaves) {
        if (leave.status === 'rejected' || leave.status === 'cancelled') continue
        if (dateStr >= leave.startDate && dateStr <= leave.endDate) outCount++
      }
      if (outCount >= threshold) count++
    }
    return count
  }, [year, month, filteredEmployees, filteredLeaves])

  if (pageLoading) return <PageSkeleton />

  const currentLeaves = filteredLeaves.filter(l =>
    l.status !== 'rejected' && l.status !== 'cancelled'
  )
  const pendingCount = currentLeaves.filter(l => l.status === 'pending').length
  const approvedCount = currentLeaves.filter(l => l.status === 'approved').length

  return (
    <>
      <Header
        title="Team Calendar"
        subtitle={`${filteredEmployees.length} employees \u00b7 ${MONTH_NAMES[month - 1]} ${year}`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={goToToday}>
              <Calendar size={14} className="mr-1" /> Today
            </Button>
          </div>
        }
      />

      <div className="space-y-4 mt-4">
        {/* Controls */}
        <Card padding="sm" className="p-4">
          <div className="flex flex-wrap items-end gap-3">
            {/* Month/week navigation */}
            <div className="flex items-center gap-2">
              <button
                onClick={goToPrev}
                className="p-2 rounded-lg hover:bg-canvas border border-border transition-colors"
              >
                <ChevronLeft size={16} className="text-t2" />
              </button>
              <span className="text-sm font-semibold text-t1 min-w-[160px] text-center">
                {viewMode === 'month'
                  ? `${MONTH_NAMES[month - 1]} ${year}`
                  : `Week of ${weekDates[0]}`
                }
              </span>
              <button
                onClick={goToNext}
                className="p-2 rounded-lg hover:bg-canvas border border-border transition-colors"
              >
                <ChevronRight size={16} className="text-t2" />
              </button>
            </div>

            <div className="w-[160px]">
              <Select
                options={[
                  { value: 'month', label: 'Month View' },
                  { value: 'week', label: 'Week View' },
                ]}
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value as CalendarViewMode)}
              />
            </div>

            <div className="w-[180px]">
              <Select
                options={deptOptions}
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                placeholder="Department"
              />
            </div>

            <div className="w-[200px]">
              <Select
                options={managerOptions}
                value={managerFilter}
                onChange={(e) => setManagerFilter(e.target.value)}
                placeholder="Team"
              />
            </div>
          </div>
        </Card>

        {/* Stats */}
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-canvas border border-border">
            <Users size={14} className="text-t3" />
            <span className="text-xs text-t2">{filteredEmployees.length} employees</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-50 border border-green-200">
            <span className="text-xs text-green-700">{approvedCount} approved leaves</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200">
            <span className="text-xs text-amber-700">{pendingCount} pending</span>
          </div>
          {conflictDayCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-50 border border-red-200">
              <AlertTriangle size={14} className="text-red-500" />
              <span className="text-xs text-red-700">{conflictDayCount} conflict day{conflictDayCount !== 1 ? 's' : ''} (&gt;30% out)</span>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3">
          {Object.entries(LEAVE_COLORS).map(([key, color]) => (
            <div key={key} className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded-sm ${color.bg} ${color.border} border`} />
              <span className="text-[0.65rem] text-t3">{color.label}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5">
            <div
              className="w-3 h-3 rounded-sm bg-gray-100 border border-gray-300"
              style={{
                backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)',
              }}
            />
            <span className="text-[0.65rem] text-t3">Pending</span>
          </div>
        </div>

        {/* Calendar Grid */}
        <Card padding="none">
          {viewMode === 'month' ? (
            <GanttMonthView
              year={year}
              month={month}
              employees={filteredEmployees}
              leaves={filteredLeaves}
              deptMap={deptMap}
              onLeaveClick={setSelectedLeave}
            />
          ) : (
            <WeekView
              weekDates={weekDates}
              employees={filteredEmployees}
              leaves={filteredLeaves}
              deptMap={deptMap}
              onLeaveClick={setSelectedLeave}
            />
          )}
        </Card>
      </div>

      {/* Leave Detail Modal */}
      {selectedLeave && (
        <LeaveDetailModal
          leave={selectedLeave}
          employees={employees}
          onClose={() => setSelectedLeave(null)}
        />
      )}
    </>
  )
}
