'use client'

import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { Header } from '@/components/layout/header'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/ui/stat-card'
import { Tabs } from '@/components/ui/tabs'
import { Modal } from '@/components/ui/modal'
import { Input, Select, Textarea } from '@/components/ui/input'
import { TempoBarChart, TempoSparkArea, CHART_COLORS, CHART_SERIES } from '@/components/ui/charts'
import { Progress } from '@/components/ui/progress'
import {
  Clock, Calendar, Plus, CheckCircle, LogIn, BarChart3, CalendarDays,
  Sun, Filter, ChevronLeft, ChevronRight, Send, AlertTriangle, Users,
} from 'lucide-react'
import { useTempo } from '@/lib/store'
import { AIAlertBanner, AIInsightCard, AIRecommendationList } from '@/components/ai'
import { detectCoverageGaps, analyzeLeavePatterns, assessBurnoutRisk } from '@/lib/ai-engine'

// ---- Local types for shift & timesheet data ----
interface Shift {
  id: string
  employee_id: string
  date: string
  start_time: string
  end_time: string
  type: 'regular' | 'overtime' | 'remote' | 'on_call'
  hours: number
  status: 'scheduled' | 'completed' | 'missed'
}

interface TimesheetEntry {
  id: string
  employee_id: string
  week_start: string
  hours: number[]
  total: number
  overtime: number
  status: 'draft' | 'submitted' | 'approved' | 'rejected'
  submitted_at?: string
}

// ---- Seed data generators ----
function generateShifts(employees: { id: string }[]): Shift[] {
  const types: Shift['type'][] = ['regular', 'overtime', 'remote', 'on_call']
  const statuses: Shift['status'][] = ['scheduled', 'completed', 'completed']
  const shifts: Shift[] = []
  const baseDate = new Date()
  baseDate.setDate(baseDate.getDate() - baseDate.getDay() + 1) // Monday
  employees.slice(0, 12).forEach((emp, ei) => {
    for (let d = 0; d < 5; d++) {
      const date = new Date(baseDate)
      date.setDate(date.getDate() + d)
      const type = types[(ei + d) % types.length]
      const start = type === 'on_call' ? '18:00' : type === 'overtime' ? '07:00' : '09:00'
      const end = type === 'on_call' ? '06:00' : type === 'overtime' ? '19:00' : '17:00'
      const hours = type === 'on_call' ? 12 : type === 'overtime' ? 12 : 8
      shifts.push({
        id: `shift-${ei}-${d}`,
        employee_id: emp.id,
        date: date.toISOString().split('T')[0],
        start_time: start,
        end_time: end,
        type,
        hours,
        status: statuses[(ei + d) % statuses.length],
      })
    }
  })
  return shifts
}

function generateTimesheets(employees: { id: string }[]): TimesheetEntry[] {
  const baseDate = new Date()
  baseDate.setDate(baseDate.getDate() - baseDate.getDay() + 1)
  const weekStart = baseDate.toISOString().split('T')[0]
  const statuses: TimesheetEntry['status'][] = ['approved', 'submitted', 'draft', 'approved', 'submitted']
  return employees.slice(0, 10).map((emp, i) => {
    const hours = [7 + (i % 3), 8, 8 + (i % 2), 7.5, 8 - (i % 2)]
    const total = hours.reduce((a, b) => a + b, 0)
    return {
      id: `ts-${i}`,
      employee_id: emp.id,
      week_start: weekStart,
      hours,
      total,
      overtime: Math.max(0, total - 40),
      status: statuses[i % statuses.length],
      submitted_at: statuses[i % statuses.length] !== 'draft' ? new Date().toISOString() : undefined,
    }
  })
}

// ---- Holiday data ----
const PUBLIC_HOLIDAYS = [
  { date: '2026-01-01', name: 'New Year\'s Day', countries: ['All'], month: 'January' },
  { date: '2026-01-20', name: 'Martin Luther King Jr. Day', countries: ['US'], month: 'January' },
  { date: '2026-03-30', name: 'Eid al-Fitr', countries: ['Nigeria', 'Senegal', 'Mali'], month: 'March' },
  { date: '2026-04-03', name: 'Good Friday', countries: ['All'], month: 'April' },
  { date: '2026-04-06', name: 'Easter Monday', countries: ['All'], month: 'April' },
  { date: '2026-05-01', name: 'Labour Day', countries: ['All'], month: 'May' },
  { date: '2026-05-25', name: 'Africa Day', countries: ['All'], month: 'May' },
  { date: '2026-06-06', name: 'Eid al-Adha', countries: ['Nigeria', 'Senegal', 'Mali'], month: 'June' },
  { date: '2026-06-12', name: 'Democracy Day', countries: ['Nigeria'], month: 'June' },
  { date: '2026-07-04', name: 'Independence Day', countries: ['US'], month: 'July' },
  { date: '2026-08-07', name: 'Independence Day', countries: ["Cote d'Ivoire"], month: 'August' },
  { date: '2026-10-01', name: 'Independence Day', countries: ['Nigeria'], month: 'October' },
  { date: '2026-11-04', name: 'Independence Day', countries: ['Ghana'], month: 'November' },
  { date: '2026-12-25', name: 'Christmas Day', countries: ['All'], month: 'December' },
  { date: '2026-12-26', name: 'Boxing Day', countries: ['Nigeria', 'Ghana', 'Kenya'], month: 'December' },
]

const LEAVE_TYPE_VARIANT: Record<string, 'success' | 'error' | 'info' | 'default' | 'warning' | 'orange'> = {
  annual: 'success', sick: 'error', maternity: 'info', paternity: 'info',
  personal: 'default', compassionate: 'warning', unpaid: 'orange',
}

const SHIFT_TYPE_COLORS: Record<string, string> = {
  regular: 'bg-tempo-100 text-tempo-700 border-tempo-200',
  overtime: 'bg-gray-100 text-gray-600 border-gray-200',
  remote: 'bg-gray-100 text-gray-600 border-gray-200',
  on_call: 'bg-gray-100 text-gray-600 border-gray-200',
}

export default function TimeAttendancePage() {
  const t = useTranslations('timeAttendance')
  const tc = useTranslations('common')
  const {
    leaveRequests, employees, departments,
    addLeaveRequest, updateLeaveRequest,
    getEmployeeName, getDepartmentName, currentEmployeeId,
  } = useTempo()

  // ---- AI Insights ----
  const coverageInsights = useMemo(() => detectCoverageGaps(leaveRequests, employees), [leaveRequests, employees])
  const leaveInsights = useMemo(() => analyzeLeavePatterns(leaveRequests), [leaveRequests])

  // ---- Local state for shifts & timesheets (no store yet) ----
  const [shifts, setShifts] = useState<Shift[]>(() => generateShifts(employees))
  const [timesheets, setTimesheets] = useState<TimesheetEntry[]>(() => generateTimesheets(employees))

  // ---- Tabs ----
  const [activeTab, setActiveTab] = useState('leave')
  const pendingRequests = leaveRequests.filter(l => l.status === 'pending')
  const approvedRequests = leaveRequests.filter(l => l.status === 'approved')
  const today = new Date().toISOString().split('T')[0]
  const onLeaveToday = leaveRequests.filter(
    l => l.status === 'approved' && l.start_date <= today && l.end_date >= today
  ).length

  const tabs = [
    { id: 'leave', label: t('tabLeaveRequests'), count: pendingRequests.length },
    { id: 'timesheet', label: t('tabTimesheets') },
    { id: 'schedules', label: 'Schedules' },
    { id: 'calendar', label: 'Team Calendar' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'holidays', label: t('tabHolidayCalendar') },
  ]

  // ---- Leave filters ----
  const [leaveStatusFilter, setLeaveStatusFilter] = useState<string>('all')
  const filteredLeaveRequests = useMemo(() => {
    if (leaveStatusFilter === 'all') return leaveRequests
    return leaveRequests.filter(lr => lr.status === leaveStatusFilter)
  }, [leaveRequests, leaveStatusFilter])

  // ---- Leave Modal ----
  const [showLeaveModal, setShowLeaveModal] = useState(false)
  const [leaveForm, setLeaveForm] = useState({
    employee_id: '', type: 'annual' as string, start_date: '', end_date: '', days: 1, reason: '',
  })

  // ---- Shift Modal ----
  const [showShiftModal, setShowShiftModal] = useState(false)
  const [shiftForm, setShiftForm] = useState({
    employee_id: '', date: '', start_time: '09:00', end_time: '17:00', type: 'regular' as Shift['type'],
  })

  // ---- Holiday Modal ----
  const [showHolidayModal, setShowHolidayModal] = useState(false)
  const [holidayForm, setHolidayForm] = useState({ date: '', name: '', countries: '' })
  const [customHolidays, setCustomHolidays] = useState<typeof PUBLIC_HOLIDAYS>([])
  const [holidayCountryFilter, setHolidayCountryFilter] = useState<string>('all')

  // ---- Clock state ----
  const [clockedIn, setClockedIn] = useState(false)
  const [clockInTime, setClockInTime] = useState<string | null>(null)

  // ---- Calendar state ----
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() }
  })

  // ---- Computed analytics ----
  const analyticsData = useMemo(() => {
    const totalHours = timesheets.reduce((s, ts) => s + ts.total, 0)
    const avgHours = timesheets.length > 0 ? totalHours / timesheets.length : 0
    const totalOvertime = timesheets.reduce((s, ts) => s + ts.overtime, 0)
    const overtimeRate = totalHours > 0 ? (totalOvertime / totalHours) * 100 : 0
    const missedShifts = shifts.filter(s => s.status === 'missed').length
    const totalShifts = shifts.length
    const absenteeismRate = totalShifts > 0 ? (missedShifts / totalShifts) * 100 : 0

    // Department hours
    const deptHours: Record<string, { hours: number; count: number }> = {}
    timesheets.forEach(ts => {
      const emp = employees.find(e => e.id === ts.employee_id)
      const deptName = emp ? getDepartmentName(emp.department_id) : 'Other'
      if (!deptHours[deptName]) deptHours[deptName] = { hours: 0, count: 0 }
      deptHours[deptName].hours += ts.total
      deptHours[deptName].count += 1
    })

    // Weekly overtime trend (simulated 8 weeks)
    const overtimeTrend = [3.2, 4.1, 2.8, 5.5, 3.9, 4.7, totalOvertime || 3.0, totalOvertime * 1.1 || 2.5]

    // Burnout risk per employee
    const burnoutRisks = employees.slice(0, 8).map(emp => ({
      employee: emp,
      score: assessBurnoutRisk(emp, leaveRequests),
    })).filter(r => r.score.value >= 40).sort((a, b) => b.score.value - a.score.value)

    return { avgHours, overtimeRate, absenteeismRate, deptHours, overtimeTrend, burnoutRisks, totalOvertime }
  }, [timesheets, shifts, employees, leaveRequests, getDepartmentName])

  // ---- Handlers ----
  function openNewLeaveRequest() {
    setLeaveForm({ employee_id: employees[0]?.id || '', type: 'annual', start_date: '', end_date: '', days: 1, reason: '' })
    setShowLeaveModal(true)
  }

  function submitLeaveRequest() {
    if (!leaveForm.employee_id || !leaveForm.start_date || !leaveForm.end_date) return
    addLeaveRequest({
      employee_id: leaveForm.employee_id, type: leaveForm.type,
      start_date: leaveForm.start_date, end_date: leaveForm.end_date,
      days: Number(leaveForm.days) || 1, reason: leaveForm.reason, status: 'pending',
    })
    setShowLeaveModal(false)
  }

  function approveLeave(id: string) {
    updateLeaveRequest(id, { status: 'approved', approved_by: currentEmployeeId, approved_at: new Date().toISOString() })
  }

  function denyLeave(id: string) {
    updateLeaveRequest(id, { status: 'rejected', approved_by: currentEmployeeId, approved_at: new Date().toISOString() })
  }

  function handleClockIn() {
    if (clockedIn) {
      setClockedIn(false)
      setClockInTime(null)
    } else {
      setClockedIn(true)
      setClockInTime(new Date().toLocaleTimeString())
    }
  }

  function submitShift() {
    if (!shiftForm.employee_id || !shiftForm.date) return
    const startH = parseInt(shiftForm.start_time.split(':')[0])
    const endH = parseInt(shiftForm.end_time.split(':')[0])
    const hours = endH > startH ? endH - startH : 24 - startH + endH
    setShifts(prev => [...prev, {
      id: `shift-new-${Date.now()}`, employee_id: shiftForm.employee_id,
      date: shiftForm.date, start_time: shiftForm.start_time, end_time: shiftForm.end_time,
      type: shiftForm.type, hours, status: 'scheduled',
    }])
    setShowShiftModal(false)
  }

  function submitTimesheet(tsId: string) {
    setTimesheets(prev => prev.map(ts =>
      ts.id === tsId ? { ...ts, status: 'submitted', submitted_at: new Date().toISOString() } : ts
    ))
  }

  function approveTimesheet(tsId: string) {
    setTimesheets(prev => prev.map(ts =>
      ts.id === tsId ? { ...ts, status: 'approved' } : ts
    ))
  }

  function addCustomHoliday() {
    if (!holidayForm.date || !holidayForm.name) return
    const month = new Date(holidayForm.date).toLocaleString('en', { month: 'long' })
    setCustomHolidays(prev => [...prev, {
      date: holidayForm.date, name: holidayForm.name,
      countries: holidayForm.countries ? holidayForm.countries.split(',').map(c => c.trim()) : ['Custom'],
      month,
    }])
    setShowHolidayModal(false)
    setHolidayForm({ date: '', name: '', countries: '' })
  }

  // ---- Calendar helpers ----
  const calendarDays = useMemo(() => {
    const { year, month } = calendarMonth
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const days: (number | null)[] = []
    for (let i = 0; i < (firstDay === 0 ? 6 : firstDay - 1); i++) days.push(null)
    for (let d = 1; d <= daysInMonth; d++) days.push(d)
    return days
  }, [calendarMonth])

  const leaveByDate = useMemo(() => {
    const map: Record<string, { employee_id: string; type: string }[]> = {}
    leaveRequests.filter(lr => lr.status === 'approved').forEach(lr => {
      const start = new Date(lr.start_date)
      const end = new Date(lr.end_date)
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const key = d.toISOString().split('T')[0]
        if (!map[key]) map[key] = []
        map[key].push({ employee_id: lr.employee_id, type: lr.type })
      }
    })
    return map
  }, [leaveRequests])

  // ---- Holiday filtering ----
  const allHolidays = [...PUBLIC_HOLIDAYS, ...customHolidays].sort((a, b) => a.date.localeCompare(b.date))
  const allCountries = useMemo(() => {
    const set = new Set<string>()
    allHolidays.forEach(h => h.countries.forEach(c => set.add(c)))
    return Array.from(set).sort()
  }, [allHolidays])
  const filteredHolidays = holidayCountryFilter === 'all'
    ? allHolidays
    : allHolidays.filter(h => h.countries.includes(holidayCountryFilter) || h.countries.includes('All'))

  // Group holidays by month
  const holidaysByMonth = useMemo(() => {
    const map: Record<string, typeof filteredHolidays> = {}
    filteredHolidays.forEach(h => {
      if (!map[h.month]) map[h.month] = []
      map[h.month].push(h)
    })
    return map
  }, [filteredHolidays])

  // Weekday headers for schedules
  const weekDays = [t('weekdayMon'), t('weekdayTue'), t('weekdayWed'), t('weekdayThu'), t('weekdayFri')]

  return (
    <>
      <Header
        title={t('title')}
        subtitle={t('subtitle')}
        actions={
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={handleClockIn}>
              <LogIn size={14} /> {clockedIn ? t('clockOut') : t('clockIn')}
            </Button>
            <Button size="sm" onClick={openNewLeaveRequest}>
              <Plus size={14} /> {t('requestLeave')}
            </Button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label={t('pendingRequests')} value={pendingRequests.length} change="Awaiting approval" changeType="neutral" icon={<Clock size={20} />} />
        <StatCard label={t('approvedLabel')} value={approvedRequests.length} change={tc('thisQuarter')} changeType="positive" icon={<CheckCircle size={20} />} />
        <StatCard label={t('onLeaveToday')} value={onLeaveToday} change={t('acrossAllRegions')} changeType="neutral" icon={<Calendar size={20} />} />
        <StatCard label={t('avgLeaveBalance')} value="14.5" change={t('daysRemaining')} changeType="neutral" />
      </div>

      {/* AI Insights */}
      <AIAlertBanner insights={coverageInsights} className="mb-4" />
      {leaveInsights.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {leaveInsights.map(insight => (
            <AIInsightCard key={insight.id} insight={insight} compact />
          ))}
        </div>
      )}

      {/* Clock-in banner */}
      {clockedIn && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-sm font-medium text-emerald-800">{t('clockedIn')}</p>
            <p className="text-xs text-emerald-600">{t('clockedInSince', { time: clockInTime ?? '' })}</p>
          </div>
          <Button size="sm" variant="secondary" onClick={handleClockIn}><LogIn size={14} /> {t('clockOut')}</Button>
        </div>
      )}

      <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} className="mb-6" />

      {/* ============================================================ */}
      {/* TAB 1: LEAVE REQUESTS */}
      {/* ============================================================ */}
      {activeTab === 'leave' && (
        <Card padding="none">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t('leaveRequestsTitle')}</CardTitle>
              <div className="flex items-center gap-2">
                <Filter size={14} className="text-t3" />
                <select
                  className="px-2 py-1 text-xs border border-border rounded-lg bg-surface text-t1"
                  value={leaveStatusFilter} onChange={e => setLeaveStatusFilter(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-divider bg-canvas">
                  <th className="tempo-th text-left px-6 py-3">{t('tableEmployee')}</th>
                  <th className="tempo-th text-left px-4 py-3">{t('tableType')}</th>
                  <th className="tempo-th text-left px-4 py-3">{t('tableDates')}</th>
                  <th className="tempo-th text-right px-4 py-3">{t('tableDays')}</th>
                  <th className="tempo-th text-left px-4 py-3">{t('tableReason')}</th>
                  <th className="tempo-th text-center px-4 py-3">{tc('status')}</th>
                  <th className="tempo-th text-center px-4 py-3">{tc('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredLeaveRequests.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-xs text-t3">
                      {t('noLeaveRequests')}
                    </td>
                  </tr>
                )}
                {filteredLeaveRequests.map(lr => {
                  const emp = employees.find(e => e.id === lr.employee_id)
                  return (
                    <tr key={lr.id} className="hover:bg-canvas/50">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar name={getEmployeeName(lr.employee_id)} size="sm" />
                          <div>
                            <p className="text-xs font-medium text-t1">{getEmployeeName(lr.employee_id)}</p>
                            <p className="text-xs text-t3">{emp?.job_title}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={LEAVE_TYPE_VARIANT[lr.type] || 'default'}>{lr.type}</Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-t2">{lr.start_date} {tc('to')} {lr.end_date}</td>
                      <td className="px-4 py-3 text-xs text-t1 text-right font-medium">{lr.days}</td>
                      <td className="px-4 py-3 text-xs text-t2 max-w-[200px] truncate">{lr.reason}</td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={lr.status === 'approved' ? 'success' : lr.status === 'pending' ? 'warning' : 'error'}>
                          {lr.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {lr.status === 'pending' && (
                          <div className="flex gap-1 justify-center">
                            <Button size="sm" variant="primary" onClick={() => approveLeave(lr.id)}>{tc('approve')}</Button>
                            <Button size="sm" variant="ghost" onClick={() => denyLeave(lr.id)}>{tc('deny')}</Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ============================================================ */}
      {/* TAB 2: TIMESHEETS */}
      {/* ============================================================ */}
      {activeTab === 'timesheet' && (
        <>
          {/* Weekly Timesheet Grid */}
          <Card className="mb-6">
            <h3 className="text-sm font-semibold text-t1 mb-4">{t('weeklyTimesheet')}</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-divider bg-canvas">
                    <th className="tempo-th text-left px-4 py-3">{t('tableEmployee')}</th>
                    {weekDays.map(d => <th key={d} className="tempo-th text-center px-3 py-3 w-20">{d}</th>)}
                    <th className="tempo-th text-right px-4 py-3">Total</th>
                    <th className="tempo-th text-right px-4 py-3">OT</th>
                    <th className="tempo-th text-center px-4 py-3">{tc('status')}</th>
                    <th className="tempo-th text-center px-4 py-3">{tc('actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {timesheets.map(ts => {
                    const emp = employees.find(e => e.id === ts.employee_id)
                    return (
                      <tr key={ts.id} className="hover:bg-canvas/50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Avatar name={getEmployeeName(ts.employee_id)} size="sm" />
                            <div>
                              <p className="text-sm font-medium text-t1">{getEmployeeName(ts.employee_id)}</p>
                              <p className="text-xs text-t3">{emp?.job_title}</p>
                            </div>
                          </div>
                        </td>
                        {ts.hours.map((h, i) => (
                          <td key={i} className="px-3 py-3 text-center">
                            <span className={`text-sm font-medium ${h >= 8 ? 'text-t1' : h > 0 ? 'text-warning' : 'text-t3'}`}>
                              {h > 0 ? `${h}h` : '-'}
                            </span>
                          </td>
                        ))}
                        <td className="px-4 py-3 text-right">
                          <span className="text-sm font-semibold text-t1">{ts.total}h</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`text-sm font-medium ${ts.overtime > 0 ? 'text-amber-600' : 'text-t3'}`}>
                            {ts.overtime > 0 ? `+${ts.overtime}h` : '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant={ts.status === 'approved' ? 'success' : ts.status === 'submitted' ? 'info' : ts.status === 'rejected' ? 'error' : 'default'}>
                            {ts.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {ts.status === 'draft' && (
                            <Button size="sm" variant="primary" onClick={() => submitTimesheet(ts.id)}>
                              <Send size={12} /> Submit
                            </Button>
                          )}
                          {ts.status === 'submitted' && (
                            <Button size="sm" variant="primary" onClick={() => approveTimesheet(ts.id)}>
                              {tc('approve')}
                            </Button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Weekly Summary Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <h4 className="text-xs font-medium text-t3 mb-3 uppercase tracking-wide">{t('thisWeek')}</h4>
              <div className="grid grid-cols-5 gap-2">
                {weekDays.map((day, i) => {
                  const avg = timesheets.length > 0
                    ? timesheets.reduce((s, ts) => s + (ts.hours[i] || 0), 0) / timesheets.length
                    : 0
                  return (
                    <div key={day} className="bg-canvas rounded-lg p-3 text-center">
                      <p className="text-xs font-medium text-t3 mb-1">{day}</p>
                      <p className="text-sm font-semibold text-t1">{avg.toFixed(1)}h</p>
                      <p className={`text-[0.6rem] ${avg >= 8 ? 'text-success' : avg >= 6 ? 'text-warning' : 'text-t3'}`}>
                        {avg >= 8 ? t('statusComplete') : avg >= 6 ? t('statusPartial') : '-'}
                      </p>
                    </div>
                  )
                })}
              </div>
            </Card>
            <Card>
              <h4 className="text-xs font-medium text-t3 mb-3 uppercase tracking-wide">Approval Progress</h4>
              <div className="space-y-3">
                {(['approved', 'submitted', 'draft'] as const).map(status => {
                  const count = timesheets.filter(ts => ts.status === status).length
                  const pct = timesheets.length > 0 ? (count / timesheets.length) * 100 : 0
                  return (
                    <div key={status}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-t2 capitalize">{status}</span>
                        <span className="text-t1 font-medium">{count}</span>
                      </div>
                      <Progress value={pct} size="sm" color={status === 'approved' ? 'success' : status === 'submitted' ? 'orange' : 'warning'} />
                    </div>
                  )
                })}
              </div>
            </Card>
            <Card>
              <h4 className="text-xs font-medium text-t3 mb-3 uppercase tracking-wide">Weekly Totals</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-t2">Total Hours</span>
                  <span className="text-t1 font-semibold">{timesheets.reduce((s, ts) => s + ts.total, 0)}h</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-t2">Overtime</span>
                  <span className="text-amber-600 font-semibold">{timesheets.reduce((s, ts) => s + ts.overtime, 0)}h</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-t2">Avg per Employee</span>
                  <span className="text-t1 font-semibold">{timesheets.length > 0 ? (timesheets.reduce((s, ts) => s + ts.total, 0) / timesheets.length).toFixed(1) : '0'}h</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-t2">Timesheets</span>
                  <span className="text-t1 font-semibold">{timesheets.length}</span>
                </div>
              </div>
            </Card>
          </div>
        </>
      )}

      {/* ============================================================ */}
      {/* TAB 3: SCHEDULES */}
      {/* ============================================================ */}
      {activeTab === 'schedules' && (
        <>
          {/* Shift Legend */}
          <div className="flex flex-wrap gap-3 mb-4">
            {Object.entries(SHIFT_TYPE_COLORS).map(([type, cls]) => (
              <div key={type} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${cls}`}>
                <div className={`w-2 h-2 rounded-full ${cls.split(' ')[0].replace('100', '500')}`} />
                <span className="capitalize">{type.replace('_', ' ')}</span>
              </div>
            ))}
            <div className="flex-1" />
            <Button size="sm" onClick={() => {
              setShiftForm({ employee_id: employees[0]?.id || '', date: '', start_time: '09:00', end_time: '17:00', type: 'regular' })
              setShowShiftModal(true)
            }}>
              <Plus size={14} /> Add Shift
            </Button>
          </div>

          <Card padding="none">
            <CardHeader><CardTitle>Shift Schedule</CardTitle></CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-divider bg-canvas">
                    <th className="tempo-th text-left px-6 py-3">{t('tableEmployee')}</th>
                    <th className="tempo-th text-left px-4 py-3">{tc('date')}</th>
                    <th className="tempo-th text-center px-4 py-3">Start</th>
                    <th className="tempo-th text-center px-4 py-3">End</th>
                    <th className="tempo-th text-center px-4 py-3">{tc('type')}</th>
                    <th className="tempo-th text-right px-4 py-3">Hours</th>
                    <th className="tempo-th text-center px-4 py-3">{tc('status')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {shifts.slice(0, 25).map(shift => (
                    <tr key={shift.id} className="hover:bg-canvas/50">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar name={getEmployeeName(shift.employee_id)} size="sm" />
                          <p className="text-sm font-medium text-t1">{getEmployeeName(shift.employee_id)}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-t2">{shift.date}</td>
                      <td className="px-4 py-3 text-xs text-t1 text-center font-mono">{shift.start_time}</td>
                      <td className="px-4 py-3 text-xs text-t1 text-center font-mono">{shift.end_time}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${SHIFT_TYPE_COLORS[shift.type]}`}>
                          {shift.type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-t1 text-right font-medium">{shift.hours}h</td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={shift.status === 'completed' ? 'success' : shift.status === 'missed' ? 'error' : 'default'}>
                          {shift.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Weekly Visual Grid */}
          <Card className="mt-6">
            <h3 className="text-sm font-semibold text-t1 mb-4">Weekly View</h3>
            <div className="grid grid-cols-5 gap-2">
              {weekDays.map((day, di) => {
                const baseDate = new Date()
                baseDate.setDate(baseDate.getDate() - baseDate.getDay() + 1 + di)
                const dateStr = baseDate.toISOString().split('T')[0]
                const dayShifts = shifts.filter(s => s.date === dateStr)
                return (
                  <div key={day} className="bg-canvas rounded-lg p-3">
                    <p className="text-xs font-semibold text-t2 mb-2 text-center">{day}</p>
                    <div className="space-y-1">
                      {dayShifts.slice(0, 4).map(s => (
                        <div key={s.id} className={`px-2 py-1 rounded text-[0.6rem] font-medium border ${SHIFT_TYPE_COLORS[s.type]}`}>
                          {getEmployeeName(s.employee_id).split(' ')[0]} · {s.hours}h
                        </div>
                      ))}
                      {dayShifts.length > 4 && (
                        <p className="text-[0.6rem] text-t3 text-center">+{dayShifts.length - 4} more</p>
                      )}
                      {dayShifts.length === 0 && (
                        <p className="text-[0.6rem] text-t3 text-center py-2">No shifts</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        </>
      )}

      {/* ============================================================ */}
      {/* TAB 4: TEAM CALENDAR */}
      {/* ============================================================ */}
      {activeTab === 'calendar' && (
        <Card>
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-6">
            <Button size="sm" variant="ghost" onClick={() => setCalendarMonth(prev => {
              const m = prev.month === 0 ? 11 : prev.month - 1
              const y = prev.month === 0 ? prev.year - 1 : prev.year
              return { year: y, month: m }
            })}>
              <ChevronLeft size={16} />
            </Button>
            <h3 className="text-sm font-semibold text-t1">
              {new Date(calendarMonth.year, calendarMonth.month).toLocaleString('en', { month: 'long', year: 'numeric' })}
            </h3>
            <Button size="sm" variant="ghost" onClick={() => setCalendarMonth(prev => {
              const m = prev.month === 11 ? 0 : prev.month + 1
              const y = prev.month === 11 ? prev.year + 1 : prev.year
              return { year: y, month: m }
            })}>
              <ChevronRight size={16} />
            </Button>
          </div>

          {/* Calendar Legend */}
          <div className="flex flex-wrap gap-3 mb-4">
            {[
              { type: 'annual', label: 'Annual', color: 'bg-gray-100 text-gray-600' },
              { type: 'sick', label: 'Sick', color: 'bg-gray-100 text-gray-600' },
              { type: 'maternity', label: 'Maternity/Paternity', color: 'bg-gray-100 text-gray-600' },
              { type: 'personal', label: 'Personal', color: 'bg-gray-100 text-gray-600' },
            ].map(l => (
              <div key={l.type} className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium ${l.color}`}>
                <div className={`w-2 h-2 rounded-full ${l.color.split(' ')[0].replace('100', '500')}`} />
                {l.label}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
              <div key={d} className="text-center text-xs font-semibold text-t3 py-2">{d}</div>
            ))}
            {calendarDays.map((day, i) => {
              if (day === null) return <div key={`empty-${i}`} className="min-h-[80px]" />
              const dateStr = `${calendarMonth.year}-${String(calendarMonth.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const leaves = leaveByDate[dateStr] || []
              const isToday = dateStr === today
              return (
                <div key={dateStr} className={`min-h-[80px] rounded-lg border p-1.5 ${isToday ? 'border-tempo-400 bg-tempo-50/30' : 'border-border bg-canvas/30'}`}>
                  <p className={`text-xs font-medium mb-1 ${isToday ? 'text-tempo-600' : 'text-t2'}`}>{day}</p>
                  <div className="space-y-0.5">
                    {leaves.slice(0, 3).map((l, li) => {
                      const color = 'bg-gray-100 text-gray-600'
                      const name = getEmployeeName(l.employee_id)
                      const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2)
                      return (
                        <div key={li} className={`flex items-center gap-1 px-1 py-0.5 rounded text-[0.55rem] font-medium ${color}`} title={name}>
                          <span className="font-bold">{initials}</span>
                          <span className="truncate">{l.type}</span>
                        </div>
                      )
                    })}
                    {leaves.length > 3 && (
                      <p className="text-[0.5rem] text-t3 text-center">+{leaves.length - 3}</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* ============================================================ */}
      {/* TAB 5: ANALYTICS */}
      {/* ============================================================ */}
      {activeTab === 'analytics' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard label="Avg Hours / Week" value={`${analyticsData.avgHours.toFixed(1)}h`} change="Per employee" changeType="neutral" icon={<Clock size={20} />} />
            <StatCard label="Overtime Rate" value={`${analyticsData.overtimeRate.toFixed(1)}%`} change={`${analyticsData.totalOvertime.toFixed(1)}h total OT`} changeType={analyticsData.overtimeRate > 10 ? 'negative' : 'neutral'} icon={<AlertTriangle size={20} />} />
            <StatCard label="Absenteeism Rate" value={`${analyticsData.absenteeismRate.toFixed(1)}%`} change="Missed shifts" changeType={analyticsData.absenteeismRate > 5 ? 'negative' : 'positive'} icon={<CalendarDays size={20} />} />
            <StatCard label="On Leave Today" value={onLeaveToday} change={t('acrossAllRegions')} changeType="neutral" icon={<Users size={20} />} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Department Attendance Comparison */}
            <Card>
              <h3 className="text-sm font-semibold text-t1 mb-4">Department Attendance (Hours)</h3>
              {Object.keys(analyticsData.deptHours).length > 0 ? (
                <>
                  <TempoBarChart
                    data={Object.entries(analyticsData.deptHours).slice(0, 6).map(([dept, d]) => ({
                      name: dept.length > 12 ? dept.substring(0, 12) + '...' : dept,
                      hours: Math.round(d.hours),
                    }))}
                    bars={[{ dataKey: 'hours', name: 'Hours', color: CHART_SERIES[0] }]}
                    xKey="name"
                    showGrid={false}
                    showYAxis={false}
                    height={140}
                  />
                  <div className="mt-3 space-y-1">
                    {Object.entries(analyticsData.deptHours).map(([dept, d]) => (
                      <div key={dept} className="flex justify-between text-xs">
                        <span className="text-t2">{dept}</span>
                        <span className="text-t1 font-medium">{d.hours.toFixed(0)}h avg · {d.count} employees</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-sm text-t3">No timesheet data available</p>
              )}
            </Card>

            {/* Overtime Trend */}
            <Card>
              <h3 className="text-sm font-semibold text-t1 mb-4">Overtime Trend (8 Weeks)</h3>
              <TempoSparkArea data={analyticsData.overtimeTrend} height={24} width={80} />
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-t2">Current Week OT</span>
                  <span className="text-amber-600 font-semibold">{analyticsData.totalOvertime.toFixed(1)}h</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-t2">8-Week Average</span>
                  <span className="text-t1 font-medium">{(analyticsData.overtimeTrend.reduce((a, b) => a + b, 0) / analyticsData.overtimeTrend.length).toFixed(1)}h</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-t2">Peak OT Week</span>
                  <span className="text-error font-medium">{Math.max(...analyticsData.overtimeTrend).toFixed(1)}h</span>
                </div>
              </div>
            </Card>
          </div>

          {/* AI Burnout Risk Predictions */}
          {analyticsData.burnoutRisks.length > 0 && (
            <Card className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle size={16} className="text-amber-500" />
                <h3 className="text-sm font-semibold text-t1">AI Burnout Risk Predictions</h3>
                <Badge variant="ai">AI-Powered</Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {analyticsData.burnoutRisks.map(({ employee, score }) => (
                  <div key={employee.id} className="flex items-center gap-3 bg-canvas rounded-lg px-4 py-3">
                    <Avatar name={employee.profile?.full_name || ''} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-t1 truncate">{employee.profile?.full_name}</p>
                      <p className="text-xs text-t3">{employee.job_title}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${score.value >= 60 ? 'text-error' : 'text-amber-500'}`}>{score.value}/100</p>
                      <p className="text-xs text-t3">{score.label}</p>
                    </div>
                    <div className="w-16">
                      <Progress value={score.value} size="sm" color={score.value >= 60 ? 'error' : 'orange'} />
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-t3 mt-3">
                Employees with low leave utilization may be at risk. Encourage regular time off to maintain well-being.
              </p>
            </Card>
          )}

          {/* AI Absence Pattern Insights */}
          {leaveInsights.length > 0 && (
            <Card>
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 size={16} className="text-tempo-600" />
                <h3 className="text-sm font-semibold text-t1">AI Absence Pattern Insights</h3>
              </div>
              <AIRecommendationList recommendations={[
                { id: 'rec-1', title: 'Monday Absence Cluster', rationale: 'Leave requests are 35% more likely on Mondays. Consider flexible Monday schedules.', impact: 'medium' as const, effort: 'low' as const, category: 'scheduling' },
                { id: 'rec-2', title: 'Q4 Leave Spike', rationale: 'Historical data shows 2x leave requests in December. Plan coverage early.', impact: 'high' as const, effort: 'medium' as const, category: 'planning' },
                { id: 'rec-3', title: 'Sick Leave Correlation', rationale: 'Teams with low engagement scores show 40% higher sick leave. Address root causes.', impact: 'high' as const, effort: 'high' as const, category: 'wellbeing' },
              ]} />
            </Card>
          )}
        </>
      )}

      {/* ============================================================ */}
      {/* TAB 6: HOLIDAYS */}
      {/* ============================================================ */}
      {activeTab === 'holidays' && (
        <>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Sun size={18} className="text-tempo-600" />
              <h3 className="text-sm font-semibold text-t1">{t('publicHolidays')}</h3>
            </div>
            <div className="flex items-center gap-2">
              <Filter size={14} className="text-t3" />
              <select
                className="px-2 py-1 text-xs border border-border rounded-lg bg-surface text-t1"
                value={holidayCountryFilter} onChange={e => setHolidayCountryFilter(e.target.value)}
              >
                <option value="all">All Countries</option>
                {allCountries.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <Button size="sm" variant="secondary" onClick={() => {
                setHolidayForm({ date: '', name: '', countries: '' })
                setShowHolidayModal(true)
              }}>
                <Plus size={14} /> Add Holiday
              </Button>
            </div>
          </div>

          {Object.entries(holidaysByMonth).map(([month, holidays]) => (
            <div key={month} className="mb-6">
              <h4 className="text-xs font-semibold text-t3 uppercase tracking-wide mb-3">{month}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {holidays.map(h => {
                  const dateObj = new Date(h.date + 'T12:00:00')
                  const dayNum = dateObj.getDate()
                  const monthShort = dateObj.toLocaleString('en', { month: 'short' })
                  const dayName = dateObj.toLocaleString('en', { weekday: 'short' })
                  const isCustom = customHolidays.some(ch => ch.date === h.date && ch.name === h.name)
                  return (
                    <div key={h.date + h.name} className="flex items-center gap-3 bg-canvas rounded-lg px-4 py-3 border border-border/50">
                      <div className="w-12 h-12 rounded-lg bg-tempo-50 flex flex-col items-center justify-center text-tempo-600 shrink-0">
                        <span className="text-[0.6rem] font-semibold uppercase">{monthShort}</span>
                        <span className="text-sm font-bold">{dayNum}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-t1">{h.name}</p>
                          {isCustom && <Badge variant="info">Custom</Badge>}
                        </div>
                        <p className="text-xs text-t3">{dayName} · {h.countries.join(', ')}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </>
      )}

      {/* ============================================================ */}
      {/* MODALS */}
      {/* ============================================================ */}

      {/* Request Leave Modal */}
      <Modal open={showLeaveModal} onClose={() => setShowLeaveModal(false)} title={t('requestLeaveModal')}>
        <div className="space-y-4">
          <Select
            label={tc('employee')}
            value={leaveForm.employee_id}
            onChange={(e) => setLeaveForm({ ...leaveForm, employee_id: e.target.value })}
            options={employees.map(e => ({ value: e.id, label: e.profile?.full_name || '' }))}
          />
          <Select
            label={t('leaveType')}
            value={leaveForm.type}
            onChange={(e) => setLeaveForm({ ...leaveForm, type: e.target.value })}
            options={[
              { value: 'annual', label: t('leaveAnnual') },
              { value: 'sick', label: t('leaveSick') },
              { value: 'personal', label: t('leavePersonal') },
              { value: 'maternity', label: t('leaveMaternity') },
              { value: 'paternity', label: t('leavePaternity') },
              { value: 'compassionate', label: t('leaveCompassionate') },
              { value: 'unpaid', label: t('leaveUnpaid') },
            ]}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('startDate')} type="date" value={leaveForm.start_date}
              onChange={(e) => setLeaveForm({ ...leaveForm, start_date: e.target.value })} />
            <Input label={t('endDate')} type="date" value={leaveForm.end_date}
              onChange={(e) => setLeaveForm({ ...leaveForm, end_date: e.target.value })} />
          </div>
          <Input label={t('numberOfDays')} type="number" min={1} max={60} value={leaveForm.days}
            onChange={(e) => setLeaveForm({ ...leaveForm, days: Number(e.target.value) })} />
          <Textarea label={t('reason')} placeholder={t('reasonPlaceholder')} rows={3}
            value={leaveForm.reason} onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowLeaveModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitLeaveRequest}>{t('submitRequest')}</Button>
          </div>
        </div>
      </Modal>

      {/* Add Shift Modal */}
      <Modal open={showShiftModal} onClose={() => setShowShiftModal(false)} title="Add Shift">
        <div className="space-y-4">
          <Select label={tc('employee')} value={shiftForm.employee_id}
            onChange={e => setShiftForm({ ...shiftForm, employee_id: e.target.value })}
            options={employees.map(e => ({ value: e.id, label: e.profile?.full_name || '' }))} />
          <Input label={tc('date')} type="date" value={shiftForm.date}
            onChange={e => setShiftForm({ ...shiftForm, date: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Start Time" type="time" value={shiftForm.start_time}
              onChange={e => setShiftForm({ ...shiftForm, start_time: e.target.value })} />
            <Input label="End Time" type="time" value={shiftForm.end_time}
              onChange={e => setShiftForm({ ...shiftForm, end_time: e.target.value })} />
          </div>
          <Select label="Shift Type" value={shiftForm.type}
            onChange={e => setShiftForm({ ...shiftForm, type: e.target.value as Shift['type'] })}
            options={[
              { value: 'regular', label: 'Regular' },
              { value: 'overtime', label: 'Overtime' },
              { value: 'remote', label: 'Remote' },
              { value: 'on_call', label: 'On Call' },
            ]} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowShiftModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitShift}>Add Shift</Button>
          </div>
        </div>
      </Modal>

      {/* Add Custom Holiday Modal */}
      <Modal open={showHolidayModal} onClose={() => setShowHolidayModal(false)} title="Add Custom Holiday">
        <div className="space-y-4">
          <Input label="Holiday Name" value={holidayForm.name}
            onChange={e => setHolidayForm({ ...holidayForm, name: e.target.value })}
            placeholder="e.g., Company Founding Day" />
          <Input label={tc('date')} type="date" value={holidayForm.date}
            onChange={e => setHolidayForm({ ...holidayForm, date: e.target.value })} />
          <Input label="Applicable Countries" value={holidayForm.countries}
            onChange={e => setHolidayForm({ ...holidayForm, countries: e.target.value })}
            placeholder="e.g., Nigeria, Ghana (comma-separated)" />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowHolidayModal(false)}>{tc('cancel')}</Button>
            <Button onClick={addCustomHoliday}>Add Holiday</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
