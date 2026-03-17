'use client'

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { Header } from '@/components/layout/header'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/ui/status-badge'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/ui/stat-card'
import { Modal } from '@/components/ui/modal'
import { Input, Select, Textarea } from '@/components/ui/input'
import { DatePicker } from '@/components/ui/date-picker'
import { Tabs } from '@/components/ui/tabs'
import { TempoBarChart, TempoAreaChart, CHART_COLORS, CHART_SERIES } from '@/components/ui/charts'
import { Progress } from '@/components/ui/progress'
import {
  Clock, Calendar, Plus, CheckCircle, XCircle, LogIn, LogOut, BarChart3, CalendarDays,
  Timer, Coffee, Filter, ChevronLeft, ChevronRight, AlertTriangle, Users, Search,
  Settings, Download, TrendingUp, MapPin, Briefcase, ArrowRightLeft, Pause, Play,
} from 'lucide-react'
import { PageSkeleton } from '@/components/ui/page-skeleton'
import { AIInsightsCard } from '@/components/ui/ai-insights-card'
import { analyzeAttendancePatterns, predictAbsenteeism } from '@/lib/ai-engine'
import { useTempo } from '@/lib/store'

// ---- Helpers ----
function formatHours(h: number) { return h.toFixed(1) }
function formatTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
}
function getWeekDates(offset = 0): { dates: string[]; weekStart: Date } {
  const now = new Date()
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1) + offset * 7
  const monday = new Date(now.getFullYear(), now.getMonth(), diff)
  const dates: string[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    dates.push(d.toISOString().split('T')[0])
  }
  return { dates, weekStart: monday }
}
const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const STATUS_COLORS: Record<string, 'success' | 'warning' | 'error' | 'default' | 'info'> = {
  approved: 'success', pending: 'warning', rejected: 'error', completed: 'success',
  scheduled: 'info', no_show: 'error', swapped: 'default',
}

export default function TimeAttendancePage() {
  const t = useTranslations('timeAttendance')
  const tc = useTranslations('common')
  const {
    timeEntries, timeOffPolicies, timeOffBalances, overtimeRules, shifts: _shifts,
    leaveRequests, employees, departments,
    addTimeEntry, updateTimeEntry,
    addTimeOffPolicy, updateTimeOffPolicy, deleteTimeOffPolicy,
    addTimeOffBalance, updateTimeOffBalance,
    addOvertimeRule, updateOvertimeRule, deleteOvertimeRule,
    addShift, updateShift, deleteShift,
    addLeaveRequest, updateLeaveRequest,
    getEmployeeName, getDepartmentName, currentEmployeeId,
    currentUser,
    addToast,
    ensureModulesLoaded,
  } = useTempo()

  const role = currentUser?.role
  const canApproveLeave = role === 'manager' || role === 'hrbp' || role === 'admin' || role === 'owner'
  const shifts = _shifts as any[]

  const [pageLoading, setPageLoading] = useState(true)

  useEffect(() => {
    ensureModulesLoaded?.(['timeEntries', 'timeOffPolicies', 'timeOffBalances', 'overtimeRules', 'shifts', 'leaveRequests', 'employees'])?.then?.(() => setPageLoading(false))?.catch?.(() => setPageLoading(false))
    const _t = setTimeout(() => setPageLoading(false), 2000)
    return () => clearTimeout(_t)
  }, [ensureModulesLoaded])

  // T5 #20: Seed pending overtime entries for Ghana employees
  const otSeededRef = useRef(false)
  useEffect(() => {
    if (otSeededRef.current || employees.length === 0) return
    if (timeEntries.some(e => ((e as any).overtime_hours || (e as any).overtimeHours || 0) > 0 && e.status === 'pending')) return
    otSeededRef.current = true
    const ghanaEmps = employees.filter(e => e.country === 'Ghana')
    if (ghanaEmps.length === 0) return
    const today = new Date().toISOString().split('T')[0]
    ghanaEmps.slice(0, 5).forEach((emp, i) => {
      addTimeEntry({
        employee_id: emp.id,
        date: today,
        clock_in: `${today}T07:00:00.000Z`,
        clock_out: `${today}T${String(18 + i).padStart(2, '0')}:00:00.000Z`,
        total_hours: 9 + i,
        overtime_hours: 1 + i,
        status: 'pending',
        location: 'Office',
        notes: 'Regular shift with overtime',
      })
    })
  }, [employees, timeEntries])

  // ---- Tabs ----
  const [activeTab, setActiveTab] = useState('time-clock')
  const tabs = [
    { id: 'time-clock', label: 'Time Clock', icon: Clock },
    { id: 'timesheets', label: 'Timesheets', icon: CalendarDays },
    { id: 'scheduling', label: 'Scheduling', icon: Calendar },
    { id: 'overtime', label: 'Overtime', icon: TrendingUp },
    { id: 'pto', label: 'PTO Management', icon: Briefcase },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ]

  // ---- Global state ----
  const today = new Date().toISOString().split('T')[0]
  const [weekOffset, setWeekOffset] = useState(0)
  const { dates: weekDates } = useMemo(() => getWeekDates(weekOffset), [weekOffset])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterDept, setFilterDept] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  // ---- Production-grade state ----
  const [saving, setSaving] = useState(false)
  const [confirmAction, setConfirmAction] = useState<{ show: boolean; action: string; id: string; label: string } | null>(null)
  const [dateRangeFrom, setDateRangeFrom] = useState('')
  const [dateRangeTo, setDateRangeTo] = useState('')
  const [entrySearchQuery, setEntrySearchQuery] = useState('')

  // ---- Time Clock State ----
  const [clockedIn, setClockedIn] = useState(false)
  const [clockInTime, setClockInTime] = useState<Date | null>(null)
  const [onBreak, setOnBreak] = useState(false)
  const [breakStart, setBreakStart] = useState<Date | null>(null)
  const [totalBreakMinutes, setTotalBreakMinutes] = useState(0)
  const [elapsed, setElapsed] = useState('00:00:00')
  const [selectedEmployee, setSelectedEmployee] = useState(currentEmployeeId)

  // Timer effect
  useEffect(() => {
    if (!clockedIn || !clockInTime) return
    const interval = setInterval(() => {
      const now = new Date()
      const diffMs = now.getTime() - clockInTime.getTime()
      const hours = Math.floor(diffMs / 3600000)
      const mins = Math.floor((diffMs % 3600000) / 60000)
      const secs = Math.floor((diffMs % 60000) / 1000)
      setElapsed(`${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`)
    }, 1000)
    return () => clearInterval(interval)
  }, [clockedIn, clockInTime])

  // Clock handlers
  function handleClockIn() {
    const now = new Date()
    setClockedIn(true)
    setClockInTime(now)
    setTotalBreakMinutes(0)
    setOnBreak(false)
    addToast('Clocked in successfully')
  }

  function handleClockOut() {
    if (!clockInTime) return
    const now = new Date()
    const totalMs = now.getTime() - clockInTime.getTime()
    const totalHrs = (totalMs / 3600000) - (totalBreakMinutes / 60)
    const otHrs = Math.max(0, totalHrs - 8)
    addTimeEntry({
      employee_id: selectedEmployee,
      date: today,
      clock_in: clockInTime.toISOString(),
      clock_out: now.toISOString(),
      break_minutes: totalBreakMinutes,
      total_hours: Math.round(totalHrs * 100) / 100,
      overtime_hours: Math.round(otHrs * 100) / 100,
      status: 'pending',
      approved_by: null,
      location: 'Office',
      notes: null,
    })
    setClockedIn(false)
    setClockInTime(null)
    setElapsed('00:00:00')
    setTotalBreakMinutes(0)
    addToast('Clocked out - time entry recorded')
  }

  function handleBreakToggle() {
    if (onBreak && breakStart) {
      const breakMs = new Date().getTime() - breakStart.getTime()
      setTotalBreakMinutes(prev => prev + Math.round(breakMs / 60000))
      setOnBreak(false)
      setBreakStart(null)
      addToast('Break ended')
    } else {
      setOnBreak(true)
      setBreakStart(new Date())
      addToast('Break started')
    }
  }

  // Today's entries for current employee
  const todayEntries = useMemo(() =>
    timeEntries.filter(e => e.date === today && e.employee_id === selectedEmployee),
  [timeEntries, today, selectedEmployee])

  // AI Insights
  const aiTimeInsights = useMemo(() => {
    const patterns = analyzeAttendancePatterns(timeEntries || [], shifts || [], employees || [])
    const absenteeism = predictAbsenteeism(leaveRequests || [], employees || [])
    return [...(patterns.insights || []), ...absenteeism]
  }, [timeEntries, shifts, employees, leaveRequests])

  // Weekly summary for current employee
  const weeklyHoursByDay = useMemo(() => {
    return weekDates.map(date => {
      const dayEntries = timeEntries.filter(e => e.date === date && e.employee_id === selectedEmployee)
      return dayEntries.reduce((sum, e) => sum + (e.total_hours || 0), 0)
    })
  }, [timeEntries, weekDates, selectedEmployee])

  const weeklyTotal = weeklyHoursByDay.reduce((a, b) => a + b, 0)
  const weeklyOvertime = Math.max(0, weeklyTotal - 40)

  // ---- Timesheets Tab data ----
  const timesheetData = useMemo(() => {
    const empMap = new Map<string, { hours: number[]; total: number; overtime: number; statuses: string[] }>()

    // Build per-employee weekly hours
    employees.forEach(emp => {
      let match = true
      if (searchQuery && !emp.profile.full_name.toLowerCase().includes(searchQuery.toLowerCase())) match = false
      if (filterDept && emp.department_id !== filterDept) match = false
      if (!match) return

      const hours = weekDates.map(date => {
        const dayEntries = timeEntries.filter(e => e.date === date && e.employee_id === emp.id)
        return dayEntries.reduce((sum, e) => sum + (e.total_hours || 0), 0)
      })
      const total = hours.reduce((a, b) => a + b, 0)
      const overtime = Math.max(0, total - 40)
      const statuses = weekDates.map(date => {
        const dayEntries = timeEntries.filter(e => e.date === date && e.employee_id === emp.id)
        if (dayEntries.length === 0) return 'none'
        if (dayEntries.every(e => e.status === 'approved')) return 'approved'
        if (dayEntries.some(e => e.status === 'rejected')) return 'rejected'
        return 'pending'
      })

      if (total > 0 || hours.some(h => h > 0)) {
        empMap.set(emp.id, { hours, total, overtime, statuses })
      }
    })

    if (filterStatus) {
      // Filter to only employees that have entries matching the status
      for (const [empId, data] of empMap.entries()) {
        const weekEntries = timeEntries.filter(e => weekDates.includes(e.date) && e.employee_id === empId)
        const hasMatchingStatus = weekEntries.some(e => e.status === filterStatus)
        if (!hasMatchingStatus && filterStatus !== 'none') empMap.delete(empId)
      }
    }

    return empMap
  }, [employees, timeEntries, weekDates, searchQuery, filterDept, filterStatus])

  // Bulk approve handler
  function bulkApproveTimesheets() {
    const pendingEntries = timeEntries.filter(e =>
      weekDates.includes(e.date) && e.status === 'pending' &&
      Array.from(timesheetData.keys()).includes(e.employee_id)
    )
    pendingEntries.forEach(entry => {
      updateTimeEntry(entry.id, { status: 'approved', approved_by: currentEmployeeId })
    })
    addToast(`Approved ${pendingEntries.length} time entries`)
  }

  function bulkRejectTimesheets() {
    const pendingEntries = timeEntries.filter(e =>
      weekDates.includes(e.date) && e.status === 'pending' &&
      Array.from(timesheetData.keys()).includes(e.employee_id)
    )
    pendingEntries.forEach(entry => {
      updateTimeEntry(entry.id, { status: 'rejected', approved_by: currentEmployeeId })
    })
    addToast(`Rejected ${pendingEntries.length} time entries`)
  }

  // Export CSV for timesheets
  function exportTimesheetCSV() {
    const rows = [['Employee', ...DAY_NAMES, 'Total', 'Overtime', 'Status'].join(',')]
    timesheetData.forEach((data, empId) => {
      const name = getEmployeeName(empId)
      const weekStatus = data.statuses.includes('pending') ? 'Pending' : data.statuses.includes('rejected') ? 'Rejected' : 'Approved'
      rows.push([name, ...data.hours.map(h => h.toFixed(1)), data.total.toFixed(1), data.overtime.toFixed(1), weekStatus].join(','))
    })
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `timesheet-${weekDates[0]}.csv`; a.click()
    URL.revokeObjectURL(url)
    addToast('Timesheet exported')
  }

  // ---- Scheduling Tab data ----
  const [showShiftModal, setShowShiftModal] = useState(false)
  const [shiftForm, setShiftForm] = useState({
    employee_id: '', date: '', start_time: '09:00', end_time: '17:00', role: '', location: '',
  })

  const weekShifts = useMemo(() =>
    shifts.filter(s => weekDates.includes(s.date)),
  [shifts, weekDates])

  // Coverage analysis
  const coverageByDay = useMemo(() =>
    weekDates.map(date => {
      const dayShifts = shifts.filter(s => s.date === date)
      const scheduled = dayShifts.filter(s => s.status === 'scheduled' || s.status === 'completed').length
      return { date, scheduled, gap: Math.max(0, 5 - scheduled) }
    }),
  [shifts, weekDates])

  function submitShift() {
    if (!shiftForm.date) { addToast('Date is required', 'error'); return }
    if (!shiftForm.start_time) { addToast('Start time is required', 'error'); return }
    if (!shiftForm.end_time) { addToast('End time is required', 'error'); return }
    if (shiftForm.start_time >= shiftForm.end_time) { addToast('Start time must be before end time', 'error'); return }
    setSaving(true)
    addShift({
      employee_id: shiftForm.employee_id || null, date: shiftForm.date,
      start_time: shiftForm.start_time, end_time: shiftForm.end_time,
      break_duration: 60, role: shiftForm.role || null, location: shiftForm.location || null,
      status: 'scheduled', swapped_with: null, notes: null,
    })
    setShowShiftModal(false)
    setShiftForm({ employee_id: '', date: '', start_time: '09:00', end_time: '17:00', role: '', location: '' })
    setSaving(false)
    addToast(shiftForm.employee_id ? 'Shift created successfully' : 'Open shift created - employees can pick it up')
  }

  // ---- Overtime Tab ----
  const [showOTRuleModal, setShowOTRuleModal] = useState(false)
  const [editingOTRule, setEditingOTRule] = useState<string | null>(null)
  const [otRuleForm, setOTRuleForm] = useState({
    name: '', country: '', daily_threshold_hours: 8, weekly_threshold_hours: 40,
    multiplier: 1.5, double_overtime_threshold: '', double_overtime_multiplier: '',
  })

  // Overtime by department
  const overtimeByDept = useMemo(() => {
    const deptMap: Record<string, { hours: number; cost: number; employees: number }> = {}
    employees.forEach(emp => {
      const empEntries = timeEntries.filter(e => e.employee_id === emp.id && weekDates.includes(e.date))
      const otHours = empEntries.reduce((sum, e) => sum + (e.overtime_hours || 0), 0)
      if (otHours <= 0) return
      const deptName = getDepartmentName(emp.department_id)
      if (!deptMap[deptName]) deptMap[deptName] = { hours: 0, cost: 0, employees: 0 }
      deptMap[deptName].hours += otHours
      deptMap[deptName].cost += otHours * 45 // Estimated hourly OT rate
      deptMap[deptName].employees += 1
    })
    return Object.entries(deptMap).map(([dept, data]) => ({ department: dept, ...data }))
      .sort((a, b) => b.hours - a.hours)
  }, [employees, timeEntries, weekDates, getDepartmentName])

  // Pending overtime entries for approval
  const pendingOTEntries = useMemo(() =>
    timeEntries.filter(e => (e.overtime_hours || 0) > 0 && e.status === 'pending'),
  [timeEntries])

  function approveOvertimeEntry(entryId: string) {
    updateTimeEntry(entryId, { status: 'approved', approved_by: currentEmployeeId })
    addToast('Overtime approved')
  }
  function rejectOvertimeEntry(entryId: string) {
    setConfirmAction({ show: true, action: 'reject_overtime', id: entryId, label: 'Reject this overtime entry?' })
  }

  function confirmDeleteShift(shiftId: string) {
    setConfirmAction({ show: true, action: 'delete_shift', id: shiftId, label: 'Delete this shift?' })
  }
  function confirmDeleteTimeEntry(entryId: string) {
    setConfirmAction({ show: true, action: 'delete_time_entry', id: entryId, label: 'Delete this time entry?' })
  }
  function confirmDeletePolicy(policyId: string) {
    setConfirmAction({ show: true, action: 'delete_policy', id: policyId, label: 'Delete this PTO policy?' })
  }

  function handleConfirmAction() {
    if (!confirmAction) return
    const { action, id } = confirmAction
    if (action === 'reject_overtime') {
      updateTimeEntry(id, { status: 'rejected', approved_by: currentEmployeeId })
      addToast('Overtime rejected')
    } else if (action === 'delete_shift') {
      deleteShift(id)
      addToast('Shift deleted')
    } else if (action === 'delete_time_entry') {
      updateTimeEntry(id, { status: 'rejected' })
      addToast('Time entry deleted')
    } else if (action === 'delete_policy') {
      deleteTimeOffPolicy(id)
      addToast('Policy deleted')
    } else if (action === 'delete_ot_rule') {
      deleteOvertimeRule(id)
      addToast('Overtime rule deleted')
    }
    setConfirmAction(null)
  }

  // Employees approaching overtime threshold
  const approachingOT = useMemo(() => {
    return employees.map(emp => {
      const empEntries = timeEntries.filter(e => e.employee_id === emp.id && weekDates.includes(e.date))
      const totalHrs = empEntries.reduce((sum, e) => sum + (e.total_hours || 0), 0)
      return { emp, totalHrs, remaining: Math.max(0, 40 - totalHrs) }
    }).filter(x => x.totalHrs >= 35 && x.totalHrs < 45).sort((a, b) => b.totalHrs - a.totalHrs)
  }, [employees, timeEntries, weekDates])

  function submitOTRule() {
    if (!otRuleForm.name) { addToast('Rule name is required', 'error'); return }
    if (!otRuleForm.country) { addToast('Country is required', 'error'); return }
    if (Number(otRuleForm.daily_threshold_hours) <= 0) { addToast('Daily threshold must be greater than 0', 'error'); return }
    if (Number(otRuleForm.weekly_threshold_hours) <= 0) { addToast('Weekly threshold must be greater than 0', 'error'); return }
    if (Number(otRuleForm.multiplier) <= 0) { addToast('Multiplier must be greater than 0', 'error'); return }
    setSaving(true)
    const data = {
      name: otRuleForm.name, country: otRuleForm.country,
      daily_threshold_hours: Number(otRuleForm.daily_threshold_hours),
      weekly_threshold_hours: Number(otRuleForm.weekly_threshold_hours),
      multiplier: Number(otRuleForm.multiplier),
      double_overtime_threshold: otRuleForm.double_overtime_threshold ? Number(otRuleForm.double_overtime_threshold) : null,
      double_overtime_multiplier: otRuleForm.double_overtime_multiplier ? Number(otRuleForm.double_overtime_multiplier) : null,
      is_active: true,
    }
    if (editingOTRule) {
      updateOvertimeRule(editingOTRule, data)
    } else {
      addOvertimeRule(data)
    }
    setShowOTRuleModal(false)
    setEditingOTRule(null)
    setOTRuleForm({ name: '', country: '', daily_threshold_hours: 8, weekly_threshold_hours: 40, multiplier: 1.5, double_overtime_threshold: '', double_overtime_multiplier: '' })
    setSaving(false)
    addToast(editingOTRule ? 'Overtime rule updated' : 'Overtime rule created')
  }

  // ---- PTO Tab ----
  const [showPTOPolicyModal, setShowPTOPolicyModal] = useState(false)
  const [editingPolicy, setEditingPolicy] = useState<string | null>(null)
  const [ptoPolicyForm, setPtoPolicyForm] = useState({
    name: '', type: 'annual', accrual_rate: 1.67, accrual_period: 'monthly',
    max_balance: 20, carryover_limit: 0, waiting_period_days: 0,
  })

  // PTO upcoming leaves
  const upcomingLeaves = useMemo(() =>
    leaveRequests.filter(lr => lr.status === 'approved' && lr.start_date >= today)
      .sort((a, b) => a.start_date.localeCompare(b.start_date))
      .slice(0, 10),
  [leaveRequests, today])

  // ---- Leave Request State ----
  const [showLeaveRequestModal, setShowLeaveRequestModal] = useState(false)
  const [leaveForm, setLeaveForm] = useState({ type: 'annual', start_date: '', end_date: '', reason: '', location: '' })
  const leaveSubmittingRef = useRef(false)
  const [showAdjustBalanceModal, setShowAdjustBalanceModal] = useState(false)
  const [adjustBalanceForm, setAdjustBalanceForm] = useState({ employee_id: '', policy_id: '', adjustment: 0, reason: '' })
  const [showBulkBalanceModal, setShowBulkBalanceModal] = useState(false)
  const [bulkBalanceForm, setBulkBalanceForm] = useState({ policy_id: '', new_balance: 0, reason: '' })
  const [expandedTimesheetEmp, setExpandedTimesheetEmp] = useState<string | null>(null)

  function submitLeaveRequest() {
    if (leaveSubmittingRef.current) return
    if (!leaveForm.start_date) { addToast('Start date is required', 'error'); return }
    if (!leaveForm.end_date) { addToast('End date is required', 'error'); return }
    if (leaveForm.end_date < leaveForm.start_date) { addToast('End date must be on or after start date', 'error'); return }
    leaveSubmittingRef.current = true
    const start = new Date(leaveForm.start_date)
    const end = new Date(leaveForm.end_date)
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
    addLeaveRequest({
      employee_id: currentEmployeeId,
      type: leaveForm.type,
      start_date: leaveForm.start_date,
      end_date: leaveForm.end_date,
      days,
      reason: leaveForm.type === 'work_from_home' ? `WFH: ${leaveForm.reason || 'Remote work'}${leaveForm.location ? ` — Location: ${leaveForm.location}` : ''}` : leaveForm.reason,
      status: 'pending',
    })
    setShowLeaveRequestModal(false)
    setLeaveForm({ type: 'annual', start_date: '', end_date: '', reason: '', location: '' })
    addToast(leaveForm.type === 'work_from_home' ? 'WFH request submitted' : 'Leave request submitted')
    setTimeout(() => { leaveSubmittingRef.current = false }, 0)
  }

  function submitPTOPolicy() {
    if (!ptoPolicyForm.name) { addToast('Policy name is required', 'error'); return }
    if (Number(ptoPolicyForm.max_balance) <= 0) { addToast('Max balance (days per year) must be greater than 0', 'error'); return }
    if (Number(ptoPolicyForm.accrual_rate) <= 0) { addToast('Accrual rate must be greater than 0', 'error'); return }
    setSaving(true)
    const data = {
      name: ptoPolicyForm.name, type: ptoPolicyForm.type,
      accrual_rate: Number(ptoPolicyForm.accrual_rate),
      accrual_period: ptoPolicyForm.accrual_period,
      max_balance: Number(ptoPolicyForm.max_balance),
      carryover_limit: Number(ptoPolicyForm.carryover_limit),
      waiting_period_days: Number(ptoPolicyForm.waiting_period_days),
      is_active: true,
    }
    if (editingPolicy) {
      updateTimeOffPolicy(editingPolicy, data)
    } else {
      addTimeOffPolicy(data)
    }
    setShowPTOPolicyModal(false)
    setEditingPolicy(null)
    setPtoPolicyForm({ name: '', type: 'annual', accrual_rate: 1.67, accrual_period: 'monthly', max_balance: 20, carryover_limit: 0, waiting_period_days: 0 })
    setSaving(false)
    addToast(editingPolicy ? 'PTO policy updated' : 'PTO policy created')
  }

  // ---- Analytics Tab ----
  const analyticsData = useMemo(() => {
    // Average hours by week (last 4 weeks)
    const weeklyAvgs = [-3, -2, -1, 0].map(off => {
      const { dates } = getWeekDates(off)
      const weekEntries = timeEntries.filter(e => dates.includes(e.date))
      const totalHrs = weekEntries.reduce((sum, e) => sum + (e.total_hours || 0), 0)
      const uniqueEmps = new Set(weekEntries.map(e => e.employee_id)).size
      return {
        week: `W${dates[0].slice(5)}`,
        avgHours: uniqueEmps > 0 ? totalHrs / uniqueEmps : 0,
        totalOvertime: weekEntries.reduce((sum, e) => sum + (e.overtime_hours || 0), 0),
      }
    })

    // Attendance rate (punctuality: clocked in before 9am)
    const allEntries = timeEntries.filter(e => weekDates.includes(e.date))
    const onTimeEntries = allEntries.filter(e => {
      const clockIn = new Date(e.clock_in)
      return clockIn.getHours() < 9 || (clockIn.getHours() === 9 && clockIn.getMinutes() <= 15)
    })
    const punctualityRate = allEntries.length > 0 ? Math.round((onTimeEntries.length / allEntries.length) * 100) : 0

    // PTO utilization
    const totalPTOBalance = timeOffBalances.reduce((sum, b) => sum + b.balance, 0)
    const totalPTOUsed = timeOffBalances.reduce((sum, b) => sum + b.used, 0)
    const ptoUtilization = totalPTOBalance > 0 ? Math.round((totalPTOUsed / (totalPTOBalance + totalPTOUsed)) * 100) : 0

    // Department labor cost
    const deptCosts: Record<string, number> = {}
    employees.forEach(emp => {
      const empEntries = timeEntries.filter(e => e.employee_id === emp.id)
      const totalHrs = empEntries.reduce((sum, e) => sum + (e.total_hours || 0), 0)
      const deptName = getDepartmentName(emp.department_id)
      deptCosts[deptName] = (deptCosts[deptName] || 0) + totalHrs * 35 // Estimated hourly cost
    })

    return { weeklyAvgs, punctualityRate, ptoUtilization, deptCosts }
  }, [timeEntries, weekDates, timeOffBalances, employees, getDepartmentName])

  // Filtered time entries for timesheets tab (date range + employee search)
  const filteredTimeEntries = useMemo(() => {
    let entries = timeEntries
    if (dateRangeFrom) entries = entries.filter(e => e.date >= dateRangeFrom)
    if (dateRangeTo) entries = entries.filter(e => e.date <= dateRangeTo)
    if (entrySearchQuery) {
      const q = entrySearchQuery.toLowerCase()
      entries = entries.filter(e => getEmployeeName(e.employee_id).toLowerCase().includes(q))
    }
    return entries
  }, [timeEntries, dateRangeFrom, dateRangeTo, entrySearchQuery, getEmployeeName])

  // Weekly and monthly hour totals summary
  const weeklyHoursTotal = useMemo(() =>
    timeEntries.filter(e => weekDates.includes(e.date)).reduce((s, e) => s + (e.total_hours || 0), 0),
  [timeEntries, weekDates])
  const monthlyHoursTotal = useMemo(() => {
    const month = today.slice(0, 7)
    return timeEntries.filter(e => e.date.startsWith(month)).reduce((s, e) => s + (e.total_hours || 0), 0)
  }, [timeEntries, today])

  // Stats
  const pendingCount = timeEntries.filter(e => e.status === 'pending').length
  const approvedToday = timeEntries.filter(e => e.date === today && e.status === 'approved').length
  const totalOTWeek = timeEntries.filter(e => weekDates.includes(e.date)).reduce((s, e) => s + (e.overtime_hours || 0), 0)
  const activeEmployeesToday = new Set(timeEntries.filter(e => e.date === today).map(e => e.employee_id)).size

  // Who's In Today — all employees with a time entry for today
  const whosInTodayEntries = useMemo(() => {
    return timeEntries.filter(e => e.date === today || (e.clock_in && e.clock_in.startsWith(today)))
  }, [timeEntries, today])

  if (pageLoading) {
    return (
      <>
        <Header title="Time & Attendance" subtitle="Track hours, manage schedules, and oversee time-off" />
        <div className="p-6"><PageSkeleton /></div>
      </>
    )
  }

  return (
    <>
      <Header title="Time & Attendance" subtitle="Track hours, manage schedules, and oversee time-off"
        actions={
          <div className="flex gap-2">
            {activeTab === 'scheduling' && <Button size="sm" onClick={() => setShowShiftModal(true)}><Plus size={14} /> Add Shift</Button>}
            {activeTab === 'overtime' && <Button size="sm" onClick={() => { setEditingOTRule(null); setShowOTRuleModal(true) }}><Plus size={14} /> Add Rule</Button>}
            {activeTab === 'pto' && <Button size="sm" onClick={() => { setEditingPolicy(null); setShowPTOPolicyModal(true) }}><Plus size={14} /> Add Policy</Button>}
          </div>
        }
      />

      {/* Tabs */}
      <Tabs
        tabs={tabs.map(tab => ({ id: tab.id, label: tab.label }))}
        active={activeTab}
        onChange={setActiveTab}
        className="mb-6"
      />

      {/* AI Insights */}
      <AIInsightsCard
        insights={aiTimeInsights}
        title="Time & Attendance AI Insights"
        className="mb-6"
      />

      {/* ============================================================ */}
      {/* TAB 1: TIME CLOCK */}
      {/* ============================================================ */}
      {activeTab === 'time-clock' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard label="Active Today" value={activeEmployeesToday} change={`of ${employees.length}`} changeType="neutral" icon={<Users size={20} />} />
            <StatCard label="Pending Approvals" value={pendingCount} change="entries" changeType={pendingCount > 5 ? 'negative' : 'neutral'} icon={<Clock size={20} />} />
            <StatCard label="Weekly Overtime" value={`${formatHours(totalOTWeek)}h`} change="this week" changeType={totalOTWeek > 20 ? 'negative' : 'neutral'} icon={<TrendingUp size={20} />} />
            <StatCard label="Approved Today" value={approvedToday} change="entries" changeType="positive" icon={<CheckCircle size={20} />} />
          </div>

          {/* Hours Summary */}
          <div className="flex gap-4 mb-6">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-canvas border border-divider">
              <Clock size={14} className="text-t3" />
              <span className="text-sm text-t2">Weekly Total:</span>
              <span className="text-sm font-bold text-t1">{formatHours(weeklyHoursTotal)}h</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-canvas border border-divider">
              <Calendar size={14} className="text-t3" />
              <span className="text-sm text-t2">Monthly Total:</span>
              <span className="text-sm font-bold text-t1">{formatHours(monthlyHoursTotal)}h</span>
            </div>
          </div>

          {/* Who's In Today */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <CardTitle>Who&apos;s In Today</CardTitle>
                </div>
                <Badge variant="success">{whosInTodayEntries.length} checked in</Badge>
              </div>
            </CardHeader>
            <div className="px-5 pb-5">
              {whosInTodayEntries.length === 0 ? (
                <p className="text-sm text-t3 text-center py-4">No clock-ins recorded for today</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {whosInTodayEntries.slice(0, 8).map(entry => (
                    <div key={entry.id} className="flex items-center gap-3 p-3 bg-canvas border border-border rounded-lg">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${entry.clock_out ? 'bg-gray-400' : 'bg-green-500'}`} />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-t1 truncate">{getEmployeeName(entry.employee_id)}</p>
                        <p className="text-[0.6rem] text-t3">{entry.clock_in ? new Date(entry.clock_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}{entry.clock_out ? ` — ${new Date(entry.clock_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ' — Still in'}</p>
                      </div>
                    </div>
                  ))}
                  {whosInTodayEntries.length > 8 && (
                    <div className="flex items-center justify-center p-3 bg-canvas border border-border rounded-lg">
                      <p className="text-xs text-t3">+{whosInTodayEntries.length - 8} more</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Clock In/Out Panel */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Time Clock</CardTitle>
                  <Badge variant={clockedIn ? 'success' : 'default'}>{clockedIn ? 'Clocked In' : 'Clocked Out'}</Badge>
                </div>
              </CardHeader>
              <div className="p-6 pt-0 space-y-6">
                {/* Employee Selector */}
                <Select label="Employee" value={selectedEmployee} onChange={e => setSelectedEmployee(e.target.value)}
                  options={employees.map(emp => ({ value: emp.id, label: emp.profile.full_name }))} />

                {/* Timer Display */}
                <div className="text-center">
                  <p className="text-5xl font-mono font-bold text-t1 tracking-wider">{elapsed}</p>
                  {clockInTime && (
                    <p className="text-sm text-t3 mt-2">
                      Started at {clockInTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      {onBreak && <span className="text-orange-500 ml-2">(On Break)</span>}
                    </p>
                  )}
                </div>

                {/* Clock Buttons */}
                <div className="space-y-3">
                  {!clockedIn ? (
                    <Button className="w-full py-4 text-lg" onClick={handleClockIn}>
                      <LogIn size={20} /> Clock In
                    </Button>
                  ) : (
                    <>
                      <Button className="w-full py-4 text-lg" variant="secondary" onClick={handleClockOut}>
                        <LogOut size={20} /> Clock Out
                      </Button>
                      <Button className="w-full" variant={onBreak ? 'primary' : 'ghost'} onClick={handleBreakToggle}>
                        {onBreak ? <><Play size={16} /> End Break</> : <><Coffee size={16} /> Start Break</>}
                      </Button>
                    </>
                  )}
                </div>

                {/* Break Summary */}
                {totalBreakMinutes > 0 && (
                  <div className="flex items-center gap-2 text-sm text-t3 bg-canvas rounded-lg p-3">
                    <Coffee size={14} /> Total break: {totalBreakMinutes} min
                  </div>
                )}
              </div>
            </Card>

            {/* Today's Log */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Today&apos;s Time Log</CardTitle>
              </CardHeader>
              <div className="px-6 pb-6">
                {todayEntries.length === 0 ? (
                  <p className="text-sm text-t3 text-center py-8">No entries logged today</p>
                ) : (
                  <div className="space-y-3">
                    {todayEntries.map(entry => (
                      <div key={entry.id} className="flex items-center justify-between p-3 rounded-lg border border-divider bg-canvas">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-tempo-100 text-tempo-600 flex items-center justify-center">
                            <Clock size={14} />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-t1">{formatTime(entry.clock_in)} - {entry.clock_out ? formatTime(entry.clock_out) : 'Active'}</p>
                            <p className="text-xs text-t3 flex items-center gap-1"><MapPin size={10} /> {entry.location}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-sm font-semibold text-t1">{formatHours(entry.total_hours || 0)}h</p>
                            {(entry.overtime_hours || 0) > 0 && <p className="text-xs text-orange-500">+{formatHours(entry.overtime_hours || 0)}h OT</p>}
                          </div>
                          <StatusBadge status={entry.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Weekly Timesheet Mini */}
                <div className="mt-6">
                  <h4 className="text-sm font-semibold text-t1 mb-3">Weekly Summary</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-divider">
                          {DAY_NAMES.map((d, i) => (
                            <th key={d} className={`px-3 py-2 font-medium text-center ${weekDates[i] === today ? 'text-tempo-600' : 'text-t3'}`}>{d}</th>
                          ))}
                          <th className="px-3 py-2 font-medium text-center text-t1">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          {weeklyHoursByDay.map((h, i) => (
                            <td key={i} className={`px-3 py-2 text-center ${weekDates[i] === today ? 'font-semibold text-tempo-600' : h > 0 ? 'text-t1' : 'text-t3'}`}>
                              {h > 0 ? formatHours(h) : '-'}
                            </td>
                          ))}
                          <td className="px-3 py-2 text-center font-bold text-t1">{formatHours(weeklyTotal)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  {weeklyOvertime > 0 && (
                    <p className="text-xs text-orange-500 mt-2 flex items-center gap-1">
                      <AlertTriangle size={12} /> {formatHours(weeklyOvertime)}h overtime this week
                    </p>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </>
      )}

      {/* ============================================================ */}
      {/* TAB 2: TIMESHEETS */}
      {/* ============================================================ */}
      {activeTab === 'timesheets' && (
        <>
          {/* Week Navigation */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button onClick={() => setWeekOffset(o => o - 1)} className="p-1.5 rounded-lg border border-divider hover:bg-canvas"><ChevronLeft size={16} /></button>
              <span className="text-sm font-medium text-t1">
                Week of {new Date(weekDates[0]).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(weekDates[6]).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
              <button onClick={() => setWeekOffset(o => o + 1)} className="p-1.5 rounded-lg border border-divider hover:bg-canvas"><ChevronRight size={16} /></button>
              {weekOffset !== 0 && <button onClick={() => setWeekOffset(0)} className="text-xs text-tempo-600 hover:underline">Current Week</button>}
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={exportTimesheetCSV}><Download size={14} /> Export CSV</Button>
              <Button size="sm" variant="primary" onClick={bulkApproveTimesheets}><CheckCircle size={14} /> Bulk Approve</Button>
              <Button size="sm" variant="ghost" onClick={bulkRejectTimesheets}><XCircle size={14} /> Reject</Button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-t3" />
              <input className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-lg bg-surface text-t1 focus:outline-none focus:ring-2 focus:ring-tempo-500/30"
                placeholder="Search employees..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>
            <DatePicker value={dateRangeFrom} onChange={d => setDateRangeFrom(d.toISOString().split('T')[0])} placeholder="From date" />
            <DatePicker value={dateRangeTo} onChange={d => setDateRangeTo(d.toISOString().split('T')[0])} placeholder="To date" />
            <Select className="px-3 py-2 text-sm border border-border rounded-lg bg-surface text-t1" value={filterDept} onChange={e => setFilterDept(e.target.value)}
              options={[{value: '', label: 'All Departments'}, ...departments.map(d => ({value: d.id, label: d.name}))]} />
            <Select className="px-3 py-2 text-sm border border-border rounded-lg bg-surface text-t1" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              options={[{value: '', label: 'All Status'}, {value: 'pending', label: 'Pending'}, {value: 'approved', label: 'Approved'}, {value: 'rejected', label: 'Rejected'}]} />
          </div>

          {/* Timesheet Grid */}
          <Card padding="none">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-divider bg-canvas">
                    <th className="tempo-th text-left px-4 py-3 sticky left-0 bg-canvas z-10">Employee</th>
                    {DAY_NAMES.map((d, i) => (
                      <th key={d} className={`tempo-th text-center px-3 py-3 ${weekDates[i] === today ? 'text-tempo-600' : ''}`}>
                        <div>{d}</div>
                        <div className="text-xs font-normal">{weekDates[i]?.slice(5)}</div>
                      </th>
                    ))}
                    <th className="tempo-th text-center px-3 py-3">Total</th>
                    <th className="tempo-th text-center px-3 py-3">OT</th>
                    <th className="tempo-th text-center px-3 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {timesheetData.size === 0 ? (
                    <tr><td colSpan={11} className="px-4 py-16 text-center"><div className="flex flex-col items-center gap-2"><Clock size={32} className="text-t3/50" /><p className="text-sm font-medium text-t2">No time entries recorded</p><p className="text-xs text-t3">Log your first time entry to start tracking hours</p></div></td></tr>
                  ) : Array.from(timesheetData.entries()).map(([empId, data]) => {
                    const emp = employees.find(e => e.id === empId)
                    const weekStatus = data.statuses.includes('pending') ? 'pending' : data.statuses.includes('rejected') ? 'rejected' : 'approved'
                    return (
                      <React.Fragment key={empId}>
                      <tr className="hover:bg-canvas/50 cursor-pointer" onClick={() => setExpandedTimesheetEmp(prev => prev === empId ? null : empId)}>
                        <td className="px-4 py-3 sticky left-0 bg-surface z-10">
                          <div className="flex items-center gap-2">
                            <Avatar name={emp?.profile.full_name || ''} src={emp?.profile.avatar_url} size="sm" />
                            <div>
                              <p className="text-xs font-medium text-t1">{emp?.profile.full_name}</p>
                              <p className="text-xs text-t3">{emp ? getDepartmentName(emp.department_id) : ''}</p>
                            </div>
                          </div>
                        </td>
                        {data.hours.map((h, i) => (
                          <td key={i} className={`px-3 py-3 text-center text-xs ${h > 8 ? 'text-orange-500 font-semibold' : h > 0 ? 'text-t1' : 'text-t3'}`}>
                            {h > 0 ? formatHours(h) : '-'}
                          </td>
                        ))}
                        <td className="px-3 py-3 text-center text-xs font-bold text-t1">{formatHours(data.total)}</td>
                        <td className="px-3 py-3 text-center text-xs">
                          {data.overtime > 0 ? <span className="text-orange-500 font-semibold">{formatHours(data.overtime)}</span> : '-'}
                        </td>
                        <td className="px-3 py-3 text-center">
                          <StatusBadge status={weekStatus} />
                        </td>
                      </tr>
                      {expandedTimesheetEmp === empId && (
                        <tr className="bg-canvas/30">
                          <td colSpan={11} className="px-4 py-3">
                            <div className="space-y-2">
                              <p className="text-xs font-medium text-t2 mb-2">Daily Entries for {emp?.profile.full_name}</p>
                              {weekDates.map((date, i) => {
                                const dayEntries = timeEntries.filter(e => e.date === date && e.employee_id === empId)
                                if (dayEntries.length === 0) return null
                                return dayEntries.map(entry => (
                                  <div key={entry.id} className="flex items-center gap-4 p-2 rounded border border-divider bg-surface">
                                    <span className="text-xs font-medium text-t1 w-16">{DAY_NAMES[i]}</span>
                                    <span className="text-xs text-t2">{entry.clock_in ? formatTime(entry.clock_in) : '\u2014'} \u2192 {entry.clock_out ? formatTime(entry.clock_out) : '\u2014'}</span>
                                    <span className="text-xs text-t1">{formatHours(entry.total_hours || 0)}h</span>
                                    {(entry.overtime_hours || 0) > 0 && <span className="text-xs text-orange-500">+{formatHours(entry.overtime_hours || 0)} OT</span>}
                                    <StatusBadge status={entry.status} />
                                    {canApproveLeave && entry.status === 'pending' && (
                                      <div className="flex gap-1 ml-auto">
                                        <Button size="sm" variant="primary" onClick={(e) => { e.stopPropagation(); updateTimeEntry(entry.id, { status: 'approved', approved_by: currentEmployeeId }); addToast('Entry approved') }}>
                                          <CheckCircle size={12} /> Approve
                                        </Button>
                                        <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); updateTimeEntry(entry.id, { status: 'rejected', approved_by: currentEmployeeId }); addToast('Entry rejected') }}>
                                          <XCircle size={12} /> Reject
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                ))
                              })}
                            </div>
                          </td>
                        </tr>
                      )}
                      </React.Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {/* ============================================================ */}
      {/* TAB 3: SCHEDULING */}
      {/* ============================================================ */}
      {activeTab === 'scheduling' && (
        <>
          {/* Week Navigation */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button onClick={() => setWeekOffset(o => o - 1)} className="p-1.5 rounded-lg border border-divider hover:bg-canvas"><ChevronLeft size={16} /></button>
              <span className="text-sm font-medium text-t1">
                Week of {new Date(weekDates[0]).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(weekDates[6]).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
              <button onClick={() => setWeekOffset(o => o + 1)} className="p-1.5 rounded-lg border border-divider hover:bg-canvas"><ChevronRight size={16} /></button>
            </div>
          </div>

          {/* Coverage Gaps */}
          <div className="grid grid-cols-7 gap-2 mb-6">
            {coverageByDay.map((day, i) => (
              <div key={day.date} className={`rounded-lg border p-3 text-center ${day.gap > 2 ? 'border-red-500/30 bg-red-500/5' : day.gap > 0 ? 'border-orange-500/30 bg-orange-500/5' : 'border-divider bg-canvas'}`}>
                <p className="text-xs font-medium text-t3">{DAY_NAMES[i]}</p>
                <p className="text-lg font-bold text-t1">{day.scheduled}</p>
                <p className="text-xs text-t3">scheduled</p>
                {day.gap > 0 && (
                  <p className="text-xs text-orange-500 mt-1 flex items-center justify-center gap-1">
                    <AlertTriangle size={10} /> {day.gap} gap{day.gap > 1 ? 's' : ''}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Schedule Calendar Grid */}
          <Card padding="none">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Weekly Schedule</CardTitle>
                <div className="flex gap-2 text-xs">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-tempo-500" /> Completed</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> Scheduled</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> No Show</span>
                </div>
              </div>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-divider">
                    {DAY_NAMES.map((d, i) => (
                      <th key={d} className={`tempo-th text-center px-2 py-3 ${weekDates[i] === today ? 'text-tempo-600' : ''}`}>
                        {d} {weekDates[i]?.slice(8)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {weekDates.map((date, di) => {
                      const dayShifts = weekShifts.filter(s => s.date === date)
                      return (
                        <td key={date} className="px-2 py-2 align-top border-r last:border-r-0 border-divider" style={{ minWidth: 140 }}>
                          <div className="space-y-1.5 min-h-[100px]">
                            {dayShifts.map(shift => {
                              const isUnassigned = !shift.employee_id
                              const colorClass = isUnassigned ? 'bg-orange-50 border-orange-200 text-orange-700' :
                                shift.status === 'completed' ? 'bg-tempo-50 border-tempo-200 text-tempo-700' :
                                shift.status === 'no_show' ? 'bg-red-50 border-red-200 text-red-700' :
                                'bg-blue-50 border-blue-200 text-blue-700'
                              return (
                                <div key={shift.id} className={`rounded-md border p-1.5 text-xs ${colorClass}`}>
                                  {isUnassigned ? (
                                    <>
                                      <p className="font-medium truncate">Open Shift</p>
                                      <p className="text-[10px] opacity-80">{shift.start_time}-{shift.end_time}</p>
                                      {shift.role && <p className="text-[10px] opacity-70 truncate">{shift.role}</p>}
                                      {role === 'employee' && (
                                        <button
                                          className="mt-1 w-full text-[10px] font-medium bg-orange-500 text-white rounded px-1 py-0.5 hover:bg-orange-600 transition-colors"
                                          onClick={() => { updateShift(shift.id, { employee_id: currentEmployeeId }); addToast('Shift picked up successfully!', 'success') }}
                                        >
                                          Pick Up Shift
                                        </button>
                                      )}
                                    </>
                                  ) : (
                                    <>
                                      <p className="font-medium truncate">{getEmployeeName(shift.employee_id).split(' ')[0]}</p>
                                      <p className="text-[10px] opacity-80">{shift.start_time}-{shift.end_time}</p>
                                      {shift.role && <p className="text-[10px] opacity-70 truncate">{shift.role}</p>}
                                    </>
                                  )}
                                </div>
                              )
                            })}
                            {dayShifts.length === 0 && <p className="text-xs text-t3 text-center py-4">No shifts configured</p>}
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>

          {/* Shift Swap Requests */}
          <Card className="mt-6">
            <CardHeader><CardTitle>Recent Shift Activity</CardTitle></CardHeader>
            <div className="px-6 pb-6">
              <div className="space-y-3">
                {weekShifts.filter(s => s.status === 'no_show').slice(0, 5).map(shift => (
                  <div key={shift.id} className="flex items-center justify-between p-3 rounded-lg border border-red-500/20 bg-red-500/5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center"><AlertTriangle size={14} /></div>
                      <div>
                        <p className="text-sm font-medium text-t1">{getEmployeeName(shift.employee_id)} - No Show</p>
                        <p className="text-xs text-t3">{shift.date} {shift.start_time}-{shift.end_time} at {shift.location || 'N/A'}</p>
                      </div>
                    </div>
                    <Badge variant="error">No Show</Badge>
                  </div>
                ))}
                {weekShifts.filter(s => s.swapped_with).slice(0, 5).map(shift => (
                  <div key={shift.id} className="flex items-center justify-between p-3 rounded-lg border border-divider">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center"><ArrowRightLeft size={14} /></div>
                      <div>
                        <p className="text-sm font-medium text-t1">Shift Swap: {getEmployeeName(shift.employee_id)} &rarr; {getEmployeeName(shift.swapped_with || '')}</p>
                        <p className="text-xs text-t3">{shift.date} {shift.start_time}-{shift.end_time}</p>
                      </div>
                    </div>
                    <Badge variant="info">Swapped</Badge>
                  </div>
                ))}
                {weekShifts.filter(s => s.status === 'no_show' || s.swapped_with).length === 0 && (
                  <p className="text-sm text-t3 text-center py-4">No shift issues this week</p>
                )}
              </div>
            </div>
          </Card>
        </>
      )}

      {/* ============================================================ */}
      {/* TAB 4: OVERTIME */}
      {/* ============================================================ */}
      {activeTab === 'overtime' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard label="Total OT This Week" value={`${formatHours(totalOTWeek)}h`} change="across all employees" changeType="neutral" icon={<Clock size={20} />} />
            <StatCard label="OT Cost Estimate" value={`$${Math.round(totalOTWeek * 45).toLocaleString()}`} change="at 1.5x rate" changeType="neutral" icon={<TrendingUp size={20} />} />
            <StatCard label="Employees in OT" value={overtimeByDept.reduce((s, d) => s + d.employees, 0)} change="this week" changeType={overtimeByDept.reduce((s, d) => s + d.employees, 0) > 5 ? 'negative' : 'neutral'} icon={<Users size={20} />} />
            <StatCard label="Active Rules" value={overtimeRules.filter(r => r.is_active).length} change="configured" changeType="neutral" icon={<Settings size={20} />} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* OT by Department Chart */}
            <Card>
              <CardHeader><CardTitle>Overtime by Department</CardTitle></CardHeader>
              <div className="px-6 pb-6">
                {overtimeByDept.length > 0 ? (
                  <TempoBarChart
                    data={overtimeByDept.map(d => ({ name: d.department, hours: d.hours, cost: d.cost }))}
                    bars={[{ dataKey: 'hours', name: 'OT Hours', color: CHART_COLORS.primary }]}
                    xKey="name"
                    height={250}
                  />
                ) : (
                  <p className="text-sm text-t3 text-center py-12">No overtime recorded this week</p>
                )}
              </div>
            </Card>

            {/* Approaching OT Alerts */}
            <Card>
              <CardHeader><CardTitle>Approaching Overtime Threshold</CardTitle></CardHeader>
              <div className="px-6 pb-6 space-y-3">
                {approachingOT.length === 0 ? (
                  <p className="text-sm text-t3 text-center py-8">No employees near overtime threshold</p>
                ) : approachingOT.map(({ emp, totalHrs, remaining }) => (
                  <div key={emp.id} className="flex items-center justify-between p-3 rounded-lg border border-divider">
                    <div className="flex items-center gap-3">
                      <Avatar name={emp.profile.full_name} src={emp.profile.avatar_url} size="sm" />
                      <div>
                        <p className="text-sm font-medium text-t1">{emp.profile.full_name}</p>
                        <p className="text-xs text-t3">{getDepartmentName(emp.department_id)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-t1">{formatHours(totalHrs)}h</p>
                      <p className={`text-xs ${remaining <= 2 ? 'text-red-500' : 'text-orange-500'}`}>
                        {remaining > 0 ? `${formatHours(remaining)}h to OT` : `${formatHours(totalHrs - 40)}h OT`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Pending Overtime Approvals */}
          {canApproveLeave && pendingOTEntries.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Pending Overtime Approvals</CardTitle>
                  <Badge variant="warning">{pendingOTEntries.length} pending</Badge>
                </div>
              </CardHeader>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-divider bg-canvas">
                      <th className="tempo-th text-left px-6 py-3">Employee</th>
                      <th className="tempo-th text-center px-4 py-3">Date</th>
                      <th className="tempo-th text-center px-4 py-3">OT Hours</th>
                      <th className="tempo-th text-center px-4 py-3">Total Hours</th>
                      <th className="tempo-th text-center px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {pendingOTEntries.map(entry => (
                      <tr key={entry.id} className="hover:bg-canvas/50">
                        <td className="px-6 py-3 text-sm text-t1">{getEmployeeName(entry.employee_id)}</td>
                        <td className="px-4 py-3 text-sm text-center text-t2">{entry.date}</td>
                        <td className="px-4 py-3 text-sm text-center font-medium text-orange-500">{formatHours(entry.overtime_hours || 0)}h</td>
                        <td className="px-4 py-3 text-sm text-center text-t2">{formatHours(entry.total_hours || 0)}h</td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex gap-2 justify-center">
                            <Button size="sm" disabled={saving} onClick={() => approveOvertimeEntry(entry.id)}>Approve</Button>
                            <Button size="sm" variant="ghost" disabled={saving} onClick={() => rejectOvertimeEntry(entry.id)}>Reject</Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Overtime Rules Management */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Overtime Rules</CardTitle>
              </div>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-divider bg-canvas">
                    <th className="tempo-th text-left px-6 py-3">Rule Name</th>
                    <th className="tempo-th text-left px-4 py-3">Country</th>
                    <th className="tempo-th text-center px-4 py-3">Daily Threshold</th>
                    <th className="tempo-th text-center px-4 py-3">Weekly Threshold</th>
                    <th className="tempo-th text-center px-4 py-3">Multiplier</th>
                    <th className="tempo-th text-center px-4 py-3">Double OT</th>
                    <th className="tempo-th text-center px-4 py-3">Status</th>
                    <th className="tempo-th text-center px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {overtimeRules.length === 0 && (
                    <tr><td colSpan={8} className="px-4 py-16 text-center"><div className="flex flex-col items-center gap-2"><TrendingUp size={32} className="text-t3/50" /><p className="text-sm font-medium text-t2">No overtime requests</p><p className="text-xs text-t3">Employees can submit overtime for approval</p></div></td></tr>
                  )}
                  {overtimeRules.map(rule => (
                    <tr key={rule.id} className="hover:bg-canvas/50">
                      <td className="px-6 py-3 text-sm font-medium text-t1">{rule.name}</td>
                      <td className="px-4 py-3 text-sm text-t2">{rule.country}</td>
                      <td className="px-4 py-3 text-sm text-t1 text-center">{rule.daily_threshold_hours}h</td>
                      <td className="px-4 py-3 text-sm text-t1 text-center">{rule.weekly_threshold_hours}h</td>
                      <td className="px-4 py-3 text-sm text-t1 text-center">{rule.multiplier}x</td>
                      <td className="px-4 py-3 text-sm text-t2 text-center">
                        {rule.double_overtime_threshold ? `${rule.double_overtime_threshold}h @ ${rule.double_overtime_multiplier}x` : '-'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={rule.is_active ? 'success' : 'default'}>{rule.is_active ? 'Active' : 'Inactive'}</Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex gap-1 justify-center">
                          <Button size="sm" variant="ghost" onClick={() => {
                            setEditingOTRule(rule.id)
                            setOTRuleForm({
                              name: rule.name, country: rule.country,
                              daily_threshold_hours: rule.daily_threshold_hours,
                              weekly_threshold_hours: rule.weekly_threshold_hours,
                              multiplier: rule.multiplier,
                              double_overtime_threshold: rule.double_overtime_threshold ? String(rule.double_overtime_threshold) : '',
                              double_overtime_multiplier: rule.double_overtime_multiplier ? String(rule.double_overtime_multiplier) : '',
                            })
                            setShowOTRuleModal(true)
                          }}>Edit</Button>
                          <Button size="sm" variant="ghost" onClick={() => setConfirmAction({ show: true, action: 'delete_ot_rule', id: rule.id, label: 'Delete this overtime rule?' })}>Delete</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {/* ============================================================ */}
      {/* TAB 5: PTO MANAGEMENT */}
      {/* ============================================================ */}
      {activeTab === 'pto' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard label="Active Policies" value={timeOffPolicies.filter(p => p.is_active).length} change="configured" changeType="neutral" icon={<Briefcase size={20} />} />
            <StatCard label="Pending Requests" value={leaveRequests.filter(l => l.status === 'pending').length} change="awaiting review" changeType="neutral" icon={<Clock size={20} />} />
            <StatCard label="On Leave Today" value={leaveRequests.filter(l => l.status === 'approved' && l.start_date <= today && l.end_date >= today).length} change="employees" changeType="neutral" icon={<Users size={20} />} />
            <StatCard label="Upcoming Time Off" value={upcomingLeaves.length} change="approved" changeType="neutral" icon={<Calendar size={20} />} />
          </div>

          {/* Request Leave Button */}
          <div className="flex justify-end gap-2 mb-4">
            {canApproveLeave && (
              <Button size="sm" variant="secondary" onClick={() => setShowBulkBalanceModal(true)}>
                <Users size={14} className="mr-1" /> Bulk Update Balances
              </Button>
            )}
            <Button size="sm" onClick={() => setShowLeaveRequestModal(true)}>
              <Plus size={14} className="mr-1" /> Request Leave
            </Button>
          </div>

          {/* Pending Leave Requests */}
          {leaveRequests.filter(l => l.status === 'pending').length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Pending Leave Requests</CardTitle>
                  <Badge variant="warning">{leaveRequests.filter(l => l.status === 'pending').length} pending</Badge>
                </div>
              </CardHeader>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-divider bg-canvas">
                      <th className="tempo-th text-left px-4 py-3">Employee</th>
                      <th className="tempo-th text-left px-3 py-3">Type</th>
                      <th className="tempo-th text-left px-3 py-3">Dates</th>
                      <th className="tempo-th text-center px-3 py-3">Days</th>
                      <th className="tempo-th text-left px-3 py-3">Reason</th>
                      <th className="tempo-th text-center px-3 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {leaveRequests.filter(l => l.status === 'pending').map(leave => (
                      <tr key={leave.id} className="hover:bg-canvas/50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Avatar name={getEmployeeName(leave.employee_id)} size="sm" />
                            <span className="text-sm font-medium text-t1">{getEmployeeName(leave.employee_id)}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3"><Badge className="capitalize">{leave.type}</Badge></td>
                        <td className="px-3 py-3 text-xs text-t2">{leave.start_date} — {leave.end_date}</td>
                        <td className="px-3 py-3 text-xs text-t1 text-center">{leave.days}d</td>
                        <td className="px-3 py-3 text-xs text-t2 max-w-[200px] truncate">{leave.reason || '—'}</td>
                        <td className="px-3 py-3 text-center">
                            <div className="flex gap-1 justify-center">
                              {canApproveLeave && (
                                <>
                                  <Button size="sm" variant="primary" onClick={() => { updateLeaveRequest(leave.id, { status: 'approved', approved_by: currentEmployeeId }); addToast('Leave approved') }}>
                                    <CheckCircle size={12} className="mr-1" /> Approve
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => { updateLeaveRequest(leave.id, { status: 'rejected', approved_by: currentEmployeeId }); addToast('Leave rejected') }}>
                                    <XCircle size={12} className="mr-1" /> Reject
                                  </Button>
                                </>
                              )}
                              {leave.employee_id === currentEmployeeId && (
                                <Button size="sm" variant="ghost" onClick={() => { updateLeaveRequest(leave.id, { status: 'withdrawn' as any }); addToast('Leave request withdrawn') }}>
                                  <XCircle size={12} className="mr-1" /> Withdraw
                                </Button>
                              )}
                            </div>
                          </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* PTO Policies */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>PTO Policies</CardTitle>
                </div>
              </CardHeader>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-divider bg-canvas">
                      <th className="tempo-th text-left px-4 py-3">Policy</th>
                      <th className="tempo-th text-left px-3 py-3">Type</th>
                      <th className="tempo-th text-center px-3 py-3">Accrual</th>
                      <th className="tempo-th text-center px-3 py-3">Max Balance</th>
                      <th className="tempo-th text-center px-3 py-3">Carryover</th>
                      <th className="tempo-th text-center px-3 py-3">Wait Period</th>
                      <th className="tempo-th text-center px-3 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {timeOffPolicies.length === 0 && (
                      <tr><td colSpan={7} className="px-4 py-16 text-center"><div className="flex flex-col items-center gap-2"><Briefcase size={32} className="text-t3/50" /><p className="text-sm font-medium text-t2">No time-off policies</p><p className="text-xs text-t3">Configure leave policies for your organization</p></div></td></tr>
                    )}
                    {timeOffPolicies.map(policy => (
                      <tr key={policy.id} className="hover:bg-canvas/50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${policy.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
                            <span className="text-sm font-medium text-t1">{policy.name}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3"><Badge variant="default" className="capitalize">{policy.type}</Badge></td>
                        <td className="px-3 py-3 text-xs text-t1 text-center">{policy.accrual_rate}d/{policy.accrual_period === 'monthly' ? 'mo' : policy.accrual_period === 'quarterly' ? 'qtr' : 'yr'}</td>
                        <td className="px-3 py-3 text-xs text-t1 text-center">{policy.max_balance}d</td>
                        <td className="px-3 py-3 text-xs text-t1 text-center">{policy.carryover_limit}d</td>
                        <td className="px-3 py-3 text-xs text-t1 text-center">{policy.waiting_period_days}d</td>
                        <td className="px-3 py-3 text-center">
                          <div className="flex gap-1 justify-center">
                            <Button size="sm" variant="ghost" onClick={() => {
                              setEditingPolicy(policy.id)
                              setPtoPolicyForm({
                                name: policy.name, type: policy.type,
                                accrual_rate: policy.accrual_rate,
                                accrual_period: policy.accrual_period,
                                max_balance: policy.max_balance,
                                carryover_limit: policy.carryover_limit,
                                waiting_period_days: policy.waiting_period_days,
                              })
                              setShowPTOPolicyModal(true)
                            }}>Edit</Button>
                            <Button size="sm" variant="ghost" onClick={() => confirmDeletePolicy(policy.id)}>Delete</Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Upcoming Time Off */}
            <Card>
              <CardHeader><CardTitle>Upcoming Time Off</CardTitle></CardHeader>
              <div className="px-6 pb-6 space-y-3">
                {upcomingLeaves.length === 0 ? (
                  <p className="text-sm text-t3 text-center py-4">No upcoming approved leave</p>
                ) : upcomingLeaves.map(leave => (
                  <div key={leave.id} className="flex items-center justify-between p-3 rounded-lg border border-divider">
                    <div>
                      <p className="text-sm font-medium text-t1">{getEmployeeName(leave.employee_id)}</p>
                      <p className="text-xs text-t3">{leave.start_date} - {leave.end_date} ({leave.days}d)</p>
                    </div>
                    <Badge variant={leave.type === 'sick' ? 'error' : leave.type === 'annual' ? 'success' : 'info'} className="capitalize">{leave.type}</Badge>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Employee Balance Overview */}
          <Card>
            <CardHeader><CardTitle>Employee Balance Overview</CardTitle></CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-divider bg-canvas">
                    <th className="tempo-th text-left px-4 py-3">Employee</th>
                    {timeOffPolicies.filter(p => p.is_active).map(p => (
                      <th key={p.id} className="tempo-th text-center px-3 py-3">{p.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {employees.slice(0, 15).map(emp => {
                    const empBalances = timeOffBalances.filter(b => b.employee_id === emp.id)
                    return (
                      <tr key={emp.id} className="hover:bg-canvas/50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Avatar name={emp.profile.full_name} src={emp.profile.avatar_url} size="sm" />
                            <span className="text-xs font-medium text-t1">{emp.profile.full_name}</span>
                          </div>
                        </td>
                        {timeOffPolicies.filter(p => p.is_active).map(policy => {
                          const bal = empBalances.find(b => b.policy_id === policy.id)
                          if (!bal) return <td key={policy.id} className="px-3 py-3 text-center text-xs text-t3">-</td>
                          const pct = policy.max_balance > 0 ? ((bal.balance) / policy.max_balance) * 100 : 0
                          return (
                            <td key={policy.id} className="px-3 py-3 text-center">
                              <div className={`text-xs ${canApproveLeave ? 'cursor-pointer hover:bg-tempo-50 rounded p-1' : ''}`}
                                onClick={() => canApproveLeave && bal && (() => {
                                  setAdjustBalanceForm({ employee_id: emp.id, policy_id: policy.id, adjustment: 0, reason: '' })
                                  setShowAdjustBalanceModal(true)
                                })()}>
                                <span className="font-semibold text-t1">{bal.balance}</span>
                                <span className="text-t3">/{policy.max_balance}</span>
                              </div>
                              <Progress value={pct} size="sm" className="mt-1" />
                              {bal.pending > 0 && <p className="text-[10px] text-orange-500 mt-0.5">{bal.pending}d pending</p>}
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {/* ============================================================ */}
      {/* TAB 6: ANALYTICS */}
      {/* ============================================================ */}
      {activeTab === 'analytics' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard label="Avg Hours/Week" value={analyticsData.weeklyAvgs.length > 0 ? `${formatHours(analyticsData.weeklyAvgs[analyticsData.weeklyAvgs.length - 1].avgHours)}h` : '-'} change="per employee" changeType="neutral" icon={<Clock size={20} />} />
            <StatCard label="Punctuality Rate" value={`${analyticsData.punctualityRate}%`} change="on time arrivals" changeType={analyticsData.punctualityRate >= 90 ? 'positive' : 'negative'} icon={<Timer size={20} />} />
            <StatCard label="PTO Utilization" value={`${analyticsData.ptoUtilization}%`} change="of allocated days" changeType="neutral" icon={<Briefcase size={20} />} />
            <StatCard label="Weekly OT Total" value={`${formatHours(totalOTWeek)}h`} change={`$${Math.round(totalOTWeek * 45).toLocaleString()} cost`} changeType="neutral" icon={<TrendingUp size={20} />} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Average Hours Trend */}
            <Card>
              <CardHeader><CardTitle>Average Hours Worked per Week</CardTitle></CardHeader>
              <div className="px-6 pb-6">
                <TempoAreaChart
                  data={analyticsData.weeklyAvgs.map(w => ({ name: w.week, hours: Math.round(w.avgHours * 10) / 10 }))}
                  areas={[{ dataKey: 'hours', name: 'Avg Hours', color: CHART_COLORS.primary }]}
                  xKey="name"
                  height={250}
                />
              </div>
            </Card>

            {/* Overtime Distribution */}
            <Card>
              <CardHeader><CardTitle>Overtime Distribution by Department</CardTitle></CardHeader>
              <div className="px-6 pb-6">
                {overtimeByDept.length > 0 ? (
                  <TempoBarChart
                    data={overtimeByDept.map(d => ({ name: d.department, hours: Math.round(d.hours * 10) / 10, cost: d.cost }))}
                    bars={[
                      { dataKey: 'hours', name: 'OT Hours', color: CHART_COLORS.primary },
                    ]}
                    xKey="name"
                    height={250}
                  />
                ) : (
                  <p className="text-sm text-t3 text-center py-12">No overtime data available</p>
                )}
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Attendance Patterns */}
            <Card>
              <CardHeader><CardTitle>Attendance Patterns</CardTitle></CardHeader>
              <div className="px-6 pb-6 space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-canvas">
                  <span className="text-sm text-t2">On-Time Arrival Rate</span>
                  <div className="flex items-center gap-2">
                    <Progress value={analyticsData.punctualityRate} size="sm" className="w-24" />
                    <span className="text-sm font-semibold text-t1">{analyticsData.punctualityRate}%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-canvas">
                  <span className="text-sm text-t2">Shift Completion Rate</span>
                  <div className="flex items-center gap-2">
                    <Progress value={shifts.length > 0 ? Math.round((shifts.filter(s => s.status === 'completed').length / shifts.length) * 100) : 0} size="sm" className="w-24" />
                    <span className="text-sm font-semibold text-t1">{shifts.length > 0 ? Math.round((shifts.filter(s => s.status === 'completed').length / shifts.length) * 100) : 0}%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-canvas">
                  <span className="text-sm text-t2">No-Show Rate</span>
                  <div className="flex items-center gap-2">
                    <Progress value={shifts.length > 0 ? Math.round((shifts.filter(s => s.status === 'no_show').length / shifts.length) * 100) : 0} size="sm" className="w-24" />
                    <span className="text-sm font-semibold text-t1">{shifts.length > 0 ? Math.round((shifts.filter(s => s.status === 'no_show').length / shifts.length) * 100) : 0}%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-canvas">
                  <span className="text-sm text-t2">Average Break Duration</span>
                  <span className="text-sm font-semibold text-t1">
                    {timeEntries.length > 0 ? Math.round(timeEntries.reduce((s, e) => s + e.break_minutes, 0) / timeEntries.length) : 0} min
                  </span>
                </div>
              </div>
            </Card>

            {/* Labor Cost by Department */}
            <Card>
              <CardHeader><CardTitle>Labor Cost by Department</CardTitle></CardHeader>
              <div className="px-6 pb-6">
                {Object.keys(analyticsData.deptCosts).length > 0 ? (
                  <TempoBarChart
                    data={Object.entries(analyticsData.deptCosts).map(([dept, cost]) => ({ name: dept, cost: Math.round(cost) })).sort((a, b) => b.cost - a.cost)}
                    bars={[{ dataKey: 'cost', name: 'Estimated Cost ($)', color: CHART_SERIES[1] }]}
                    xKey="name"
                    height={250}
                  />
                ) : (
                  <p className="text-sm text-t3 text-center py-12">No labor cost data available</p>
                )}
              </div>
            </Card>
          </div>
        </>
      )}

      {/* ============================================================ */}
      {/* MODALS */}
      {/* ============================================================ */}

      {/* Add Shift Modal */}
      <Modal open={showShiftModal} onClose={() => setShowShiftModal(false)} title="Add Shift">
        <div className="space-y-4">
          <Select label="Employee" value={shiftForm.employee_id} onChange={e => setShiftForm(f => ({ ...f, employee_id: e.target.value }))}
            options={[{ value: '', label: 'Select Employee' }, ...employees.map(emp => ({ value: emp.id, label: emp.profile.full_name }))]} />
          <DatePicker label="Date" value={shiftForm.date} onChange={d => setShiftForm(f => ({ ...f, date: d.toISOString().split('T')[0] }))} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Start Time" type="time" value={shiftForm.start_time} onChange={e => setShiftForm(f => ({ ...f, start_time: e.target.value }))} />
            <Input label="End Time" type="time" value={shiftForm.end_time} onChange={e => setShiftForm(f => ({ ...f, end_time: e.target.value }))} />
          </div>
          <Input label="Role" value={shiftForm.role} onChange={e => setShiftForm(f => ({ ...f, role: e.target.value }))} placeholder="e.g. Branch Manager" />
          <Input label="Location" value={shiftForm.location} onChange={e => setShiftForm(f => ({ ...f, location: e.target.value }))} placeholder="e.g. Lagos HQ" />
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setShowShiftModal(false)}>Cancel</Button>
            <Button onClick={submitShift} disabled={saving}>{saving ? 'Creating...' : 'Create Shift'}</Button>
          </div>
        </div>
      </Modal>

      {/* Overtime Rule Modal */}
      <Modal open={showOTRuleModal} onClose={() => { setShowOTRuleModal(false); setEditingOTRule(null) }} title={editingOTRule ? 'Edit Overtime Rule' : 'Add Overtime Rule'}>
        <div className="space-y-4">
          <Input label="Rule Name" value={otRuleForm.name} onChange={e => setOTRuleForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Nigeria Standard Overtime" />
          <Input label="Country" value={otRuleForm.country} onChange={e => setOTRuleForm(f => ({ ...f, country: e.target.value }))} placeholder="e.g. Nigeria" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Daily Threshold (hours)" type="number" value={otRuleForm.daily_threshold_hours} onChange={e => setOTRuleForm(f => ({ ...f, daily_threshold_hours: Number(e.target.value) }))} />
            <Input label="Weekly Threshold (hours)" type="number" value={otRuleForm.weekly_threshold_hours} onChange={e => setOTRuleForm(f => ({ ...f, weekly_threshold_hours: Number(e.target.value) }))} />
          </div>
          <Input label="Overtime Multiplier" type="number" step="0.1" value={otRuleForm.multiplier} onChange={e => setOTRuleForm(f => ({ ...f, multiplier: Number(e.target.value) }))} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Double OT Threshold (optional)" type="number" value={otRuleForm.double_overtime_threshold} onChange={e => setOTRuleForm(f => ({ ...f, double_overtime_threshold: e.target.value }))} placeholder="e.g. 12" />
            <Input label="Double OT Multiplier (optional)" type="number" step="0.1" value={otRuleForm.double_overtime_multiplier} onChange={e => setOTRuleForm(f => ({ ...f, double_overtime_multiplier: e.target.value }))} placeholder="e.g. 2.0" />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => { setShowOTRuleModal(false); setEditingOTRule(null) }}>Cancel</Button>
            <Button onClick={submitOTRule} disabled={saving}>{saving ? 'Saving...' : editingOTRule ? 'Update Rule' : 'Create Rule'}</Button>
          </div>
        </div>
      </Modal>

      {/* PTO Policy Modal */}
      <Modal open={showPTOPolicyModal} onClose={() => { setShowPTOPolicyModal(false); setEditingPolicy(null) }} title={editingPolicy ? 'Edit PTO Policy' : 'Add PTO Policy'}>
        <div className="space-y-4">
          <Input label="Policy Name" value={ptoPolicyForm.name} onChange={e => setPtoPolicyForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Annual Leave" />
          <Select label="Leave Type" value={ptoPolicyForm.type} onChange={e => setPtoPolicyForm(f => ({ ...f, type: e.target.value }))}
            options={[
              { value: 'annual', label: 'Annual' }, { value: 'sick', label: 'Sick' },
              { value: 'personal', label: 'Personal' }, { value: 'maternity', label: 'Maternity' },
              { value: 'paternity', label: 'Paternity' }, { value: 'bereavement', label: 'Bereavement' },
              { value: 'jury_duty', label: 'Jury Duty' }, { value: 'military', label: 'Military' },
            ]} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Accrual Rate (days)" type="number" step="0.01" value={ptoPolicyForm.accrual_rate} onChange={e => setPtoPolicyForm(f => ({ ...f, accrual_rate: Number(e.target.value) }))} />
            <Select label="Accrual Period" value={ptoPolicyForm.accrual_period} onChange={e => setPtoPolicyForm(f => ({ ...f, accrual_period: e.target.value }))}
              options={[
                { value: 'monthly', label: 'Monthly' }, { value: 'quarterly', label: 'Quarterly' }, { value: 'annually', label: 'Annually' },
              ]} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Input label="Max Balance (days)" type="number" value={ptoPolicyForm.max_balance} onChange={e => setPtoPolicyForm(f => ({ ...f, max_balance: Number(e.target.value) }))} />
            <Input label="Carryover Limit" type="number" value={ptoPolicyForm.carryover_limit} onChange={e => setPtoPolicyForm(f => ({ ...f, carryover_limit: Number(e.target.value) }))} />
            <Input label="Wait Period (days)" type="number" value={ptoPolicyForm.waiting_period_days} onChange={e => setPtoPolicyForm(f => ({ ...f, waiting_period_days: Number(e.target.value) }))} />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => { setShowPTOPolicyModal(false); setEditingPolicy(null) }}>Cancel</Button>
            <Button onClick={submitPTOPolicy} disabled={saving}>{saving ? 'Saving...' : editingPolicy ? 'Update Policy' : 'Create Policy'}</Button>
          </div>
        </div>
      </Modal>

      {/* Confirmation Modal */}
      <Modal open={!!confirmAction?.show} onClose={() => setConfirmAction(null)} title="Confirm Action">
        <div className="space-y-4">
          <p className="text-sm text-t2">{confirmAction?.label || 'Are you sure?'}</p>
          <p className="text-xs text-t3">This action cannot be undone.</p>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setConfirmAction(null)}>Cancel</Button>
            <Button variant="primary" onClick={handleConfirmAction}>Confirm</Button>
          </div>
        </div>
      </Modal>

      {/* Request Leave Modal */}
      <Modal open={showLeaveRequestModal} onClose={() => setShowLeaveRequestModal(false)} title="Request Leave">
        <div className="space-y-4">
          {(() => {
            const myBalances = timeOffBalances.filter(b => b.employee_id === currentEmployeeId)
            if (myBalances.length === 0) return null
            return (
              <div className="p-3 rounded-lg bg-canvas border border-divider">
                <p className="text-xs font-medium text-t2 mb-2">Your Leave Balances</p>
                <div className="grid grid-cols-2 gap-2">
                  {myBalances.map(bal => {
                    const policy = timeOffPolicies.find(p => p.id === bal.policy_id)
                    return (
                      <div key={bal.id} className="flex justify-between text-xs">
                        <span className="text-t2">{policy?.name || bal.policy_id}</span>
                        <span className="font-semibold text-t1">{bal.balance}d left</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })()}
          <Select label="Leave Type" value={leaveForm.type} onChange={e => setLeaveForm(f => ({ ...f, type: e.target.value }))}
            options={[
              { value: 'annual', label: 'Annual Leave' },
              { value: 'sick', label: 'Sick Leave' },
              { value: 'personal', label: 'Personal Leave' },
              { value: 'maternity', label: 'Maternity Leave' },
              { value: 'paternity', label: 'Paternity Leave' },
              { value: 'unpaid', label: 'Unpaid Leave' },
              { value: 'compassionate', label: 'Compassionate Leave' },
              { value: 'work_from_home', label: 'Work From Home' },
            ]}
          />
          <div className="grid grid-cols-2 gap-4">
            <DatePicker label="Start Date" value={leaveForm.start_date} onChange={d => setLeaveForm(f => ({ ...f, start_date: d.toISOString().split('T')[0] }))} />
            <DatePicker label="End Date" value={leaveForm.end_date} onChange={d => setLeaveForm(f => ({ ...f, end_date: d.toISOString().split('T')[0] }))} />
          </div>
          <Textarea label="Reason (optional)" value={leaveForm.reason} onChange={e => setLeaveForm(f => ({ ...f, reason: e.target.value }))} placeholder={leaveForm.type === 'work_from_home' ? 'Brief description of work planned...' : 'Brief reason for leave...'} />
          {leaveForm.type === 'work_from_home' && (
            <Input label="Work Location" value={leaveForm.location} onChange={e => setLeaveForm(f => ({ ...f, location: e.target.value }))} placeholder="e.g. Home, Co-working space" />
          )}
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setShowLeaveRequestModal(false)}>Cancel</Button>
            <Button onClick={submitLeaveRequest} disabled={saving || !leaveForm.start_date || !leaveForm.end_date}>{saving ? 'Submitting...' : 'Submit Request'}</Button>
          </div>
        </div>
      </Modal>

      {/* Adjust Balance Modal */}
      <Modal open={showAdjustBalanceModal} onClose={() => setShowAdjustBalanceModal(false)} title="Adjust Leave Balance">
        <div className="space-y-4">
          <p className="text-sm text-t2">
            Adjusting balance for <strong>{getEmployeeName(adjustBalanceForm.employee_id)}</strong> — {timeOffPolicies.find(p => p.id === adjustBalanceForm.policy_id)?.name || 'Policy'}
          </p>
          <Input label="Adjustment (days, use negative to deduct)" type="number" value={adjustBalanceForm.adjustment} onChange={e => setAdjustBalanceForm(f => ({ ...f, adjustment: Number(e.target.value) }))} />
          <Input label="Reason" value={adjustBalanceForm.reason} onChange={e => setAdjustBalanceForm(f => ({ ...f, reason: e.target.value }))} placeholder="e.g. Annual allowance update" />
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setShowAdjustBalanceModal(false)}>Cancel</Button>
            <Button onClick={() => {
              const bal = timeOffBalances.find(b => b.employee_id === adjustBalanceForm.employee_id && b.policy_id === adjustBalanceForm.policy_id)
              if (bal) {
                updateTimeOffBalance(bal.id, { balance: bal.balance + adjustBalanceForm.adjustment })
                addToast(`Balance adjusted by ${adjustBalanceForm.adjustment > 0 ? '+' : ''}${adjustBalanceForm.adjustment} days`)
              } else {
                addTimeOffBalance({ employee_id: adjustBalanceForm.employee_id, policy_id: adjustBalanceForm.policy_id, balance: adjustBalanceForm.adjustment, used: 0, pending: 0, year: new Date().getFullYear() })
                addToast('Balance created')
              }
              setShowAdjustBalanceModal(false)
            }} disabled={!adjustBalanceForm.reason}>Save Adjustment</Button>
          </div>
        </div>
      </Modal>

      {/* Bulk Balance Update Modal */}
      <Modal open={showBulkBalanceModal} onClose={() => setShowBulkBalanceModal(false)} title="Bulk Update Leave Balances">
        <div className="space-y-4">
          <Select label="Policy" value={bulkBalanceForm.policy_id} onChange={e => setBulkBalanceForm(f => ({ ...f, policy_id: e.target.value }))}
            options={[{ value: '', label: 'Select a policy' }, ...timeOffPolicies.filter(p => p.is_active).map(p => ({ value: p.id, label: p.name }))]} />
          <Input label="New Balance (days)" type="number" value={bulkBalanceForm.new_balance} onChange={e => setBulkBalanceForm(f => ({ ...f, new_balance: Number(e.target.value) }))} />
          <Input label="Reason" value={bulkBalanceForm.reason} onChange={e => setBulkBalanceForm(f => ({ ...f, reason: e.target.value }))} placeholder="e.g. Annual allowance reset for 2026" />
          <p className="text-xs text-t3">This will set the balance to {bulkBalanceForm.new_balance} days for all employees under the selected policy.</p>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setShowBulkBalanceModal(false)}>Cancel</Button>
            <Button onClick={() => {
              if (!bulkBalanceForm.policy_id) { addToast('Select a policy first', 'error'); return }
              let updated = 0
              employees.forEach(emp => {
                const existing = timeOffBalances.find(b => b.employee_id === emp.id && b.policy_id === bulkBalanceForm.policy_id)
                if (existing) {
                  updateTimeOffBalance(existing.id, { balance: bulkBalanceForm.new_balance })
                  updated++
                } else {
                  addTimeOffBalance({ employee_id: emp.id, policy_id: bulkBalanceForm.policy_id, balance: bulkBalanceForm.new_balance, used: 0, pending: 0, year: new Date().getFullYear() })
                  updated++
                }
              })
              addToast(`Updated balances for ${updated} employees`)
              setShowBulkBalanceModal(false)
            }} disabled={!bulkBalanceForm.policy_id || !bulkBalanceForm.reason}>Update All Employees</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
