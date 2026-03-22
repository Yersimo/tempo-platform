'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { Header } from '@/components/layout/header'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/ui/stat-card'
import { Progress } from '@/components/ui/progress'
import { Modal } from '@/components/ui/modal'
import { Input, Select, Textarea } from '@/components/ui/input'
import { Tabs } from '@/components/ui/tabs'
import { TempoBarChart, TempoDonutChart, CHART_COLORS, CHART_SERIES } from '@/components/ui/charts'
import { Avatar } from '@/components/ui/avatar'
import {
  UserMinus, ClipboardList, MessageSquareText, BarChart3,
  Plus, ChevronRight, ChevronDown, Check, Clock, AlertTriangle,
  Shield, Laptop, BookOpen, MessageCircle, DollarSign, Heart,
  FileText, Search, X, ArrowUpDown, Calendar, User,
  CheckCircle2, Circle, SkipForward, GripVertical,
} from 'lucide-react'
import { PageSkeleton } from '@/components/ui/page-skeleton'
import { useTempo, useOrgCurrency } from '@/lib/store'
import { useEventCascade } from '@/lib/event-cascade-context'
import { formatCurrency } from '@/lib/utils/format-currency'

// ─── Category config ──────────────────────────────────────────
const CATEGORIES = {
  access_revocation: { label: 'Access Revocation', icon: Shield, color: 'text-red-500' },
  device_return: { label: 'Device Return', icon: Laptop, color: 'text-blue-500' },
  knowledge_transfer: { label: 'Knowledge Transfer', icon: BookOpen, color: 'text-purple-500' },
  exit_interview: { label: 'Exit Interview', icon: MessageCircle, color: 'text-amber-500' },
  final_pay: { label: 'Final Pay', icon: DollarSign, color: 'text-green-500' },
  benefits: { label: 'Benefits', icon: Heart, color: 'text-pink-500' },
  documents: { label: 'Documents', icon: FileText, color: 'text-cyan-500' },
} as const

type CategoryKey = keyof typeof CATEGORIES

const REASON_LABELS: Record<string, string> = {
  resignation: 'Resignation',
  termination: 'Termination',
  layoff: 'Layoff',
  retirement: 'Retirement',
  end_of_contract: 'End of Contract',
}

const STATUS_BADGE: Record<string, { label: string; variant: 'success' | 'warning' | 'error' | 'info' | 'default' }> = {
  pending: { label: 'Pending', variant: 'warning' },
  in_progress: { label: 'In Progress', variant: 'info' },
  completed: { label: 'Completed', variant: 'success' },
  cancelled: { label: 'Cancelled', variant: 'error' },
  skipped: { label: 'Skipped', variant: 'default' },
}

export default function OffboardingPage() {
  const {
    employees, getEmployeeName, getDepartmentName,
    offboardingChecklists, offboardingChecklistItems,
    offboardingProcesses, offboardingTasks, exitSurveys,
    addOffboardingChecklist, updateOffboardingChecklist,
    addOffboardingChecklistItem, updateOffboardingChecklistItem, deleteOffboardingChecklistItem,
    addOffboardingProcess, updateOffboardingProcess,
    addOffboardingTask, updateOffboardingTask,
    addExitSurvey, addToast, org,
    currentUser, currentEmployeeId,
    ensureModulesLoaded, updateEmployee,
    addPlatformEvent,
  } = useTempo()
  const defaultCurrency = useOrgCurrency()
  const { triggerCascade } = useEventCascade()

  const [pageLoading, setPageLoading] = useState(true)

  useEffect(() => {
    ensureModulesLoaded?.(['offboardingChecklists', 'offboardingChecklistItems', 'offboardingProcesses', 'offboardingTasks', 'exitSurveys', 'employees'])?.then?.(() => setPageLoading(false))?.catch?.(() => setPageLoading(false))
    const _t = setTimeout(() => setPageLoading(false), 2000)
    return () => clearTimeout(_t)
  }, [ensureModulesLoaded])

  // T5 #44 + #36: Seed contract expiry and probation data for Ghana employees
  // T5 #44 + #36: Seed contract expiry and probation data
  const offboardSeedRef = useRef(false)
  useEffect(() => {
    if (offboardSeedRef.current || employees.length < 5) return
    const hasContractDates = employees.some(e => (e as any).contractEndDate || (e as any).contract_end_date)
    const hasProbation = employees.some(e => (e as any).employmentStatus === 'probation' || (e as any).employment_status === 'probation')
    if (hasContractDates && hasProbation) return
    offboardSeedRef.current = true
    // Use first available employees for seeding
    const seedCandidates = employees.filter(e => e.country === 'Ghana').length >= 5
      ? employees.filter(e => e.country === 'Ghana')
      : employees.slice(0, 10)
    if (!hasContractDates && seedCandidates.length >= 3) {
      const in25Days = new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      seedCandidates.slice(0, 3).forEach(emp => updateEmployee(emp.id, { contractEndDate: in25Days }))
    }
    if (!hasProbation && seedCandidates.length >= 5) {
      updateEmployee(seedCandidates[3].id, { employmentStatus: 'probation' })
      updateEmployee(seedCandidates[4].id, { employmentStatus: 'probation' })
    }
  }, [employees])

  // ── Persist KT item to API (best-effort) ──────
  async function persistKTItem(item: { id: string; employee_id: string; area: string; recipient_id: string; status: string; notes: string; created_at: string }) {
    try {
      await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(org?.id ? { 'x-org-id': org.id } : {}) },
        body: JSON.stringify({
          entity: 'offboarding_tasks',
          action: 'upsert',
          id: item.id,
          data: {
            employee_id: item.employee_id,
            title: item.area,
            category: 'knowledge_transfer',
            assigned_to: item.recipient_id,
            status: item.status,
            notes: item.notes,
            created_at: item.created_at,
          },
        }),
      })
    } catch {
      // Silently fail – UI state is already updated
    }
  }

  // ── Knowledge Transfer State ────────────────────
  const [showKTModal, setShowKTModal] = useState(false)
  const [ktItems, setKTItems] = useState<{ id: string; employee_id: string; area: string; recipient_id: string; status: 'pending' | 'in_progress' | 'completed'; notes: string; created_at: string }[]>([])
  const [ktForm, setKTForm] = useState({ employee_id: '', area: '', recipient_id: '', notes: '' })

  // ── Tab State ───────────────────────────────
  const [activeTab, setActiveTab] = useState('processes')
  const tabs = [
    { id: 'processes', label: 'Active Processes', count: offboardingProcesses.filter(p => p.status !== 'completed' && p.status !== 'cancelled').length },
    { id: 'checklists', label: 'Checklists', count: offboardingChecklists.length },
    { id: 'surveys', label: 'Exit Surveys', count: exitSurveys.length },
    { id: 'knowledge-transfer', label: 'Knowledge Transfer', count: ktItems.length },
    { id: 'alumni', label: 'Alumni Archive', count: offboardingProcesses.filter(p => p.status === 'completed').length },
    { id: 'analytics', label: 'Analytics' },
  ]

  // ── Process State ───────────────────────────
  const [showNewProcessModal, setShowNewProcessModal] = useState(false)
  const [selectedProcessId, setSelectedProcessId] = useState<string | null>(null)
  const [processForm, setProcessForm] = useState({
    employee_id: '', reason: 'resignation', last_working_date: '', checklist_id: '', notes: '',
  })
  const [processSearch, setProcessSearch] = useState('')
  const [processStatusFilter, setProcessStatusFilter] = useState('all')

  // T5 #42: Reassignment blocking modal state
  const [showReassignModal, setShowReassignModal] = useState(false)
  const [reassignProcessId, setReassignProcessId] = useState<string | null>(null)
  const [orphanedReports, setOrphanedReports] = useState<any[]>([])
  const [reassignments, setReassignments] = useState<Record<string, string>>({})

  // ── Checklist State ─────────────────────────
  const [showChecklistModal, setShowChecklistModal] = useState(false)
  const [editingChecklistId, setEditingChecklistId] = useState<string | null>(null)
  const [expandedChecklist, setExpandedChecklist] = useState<string | null>(null)
  const [checklistForm, setChecklistForm] = useState({ name: '', description: '', is_default: false })
  const [showItemModal, setShowItemModal] = useState(false)
  const [itemForm, setItemForm] = useState({
    checklist_id: '', title: '', description: '', category: 'access_revocation' as string,
    assignee_role: '', order_index: 0, is_required: true,
  })

  // ── Confirmation / Saving State ────────────────
  const [confirmAction, setConfirmAction] = useState<{ show: boolean; action: string; id: string; label: string } | null>(null)
  const [saving, setSaving] = useState(false)

  // ── Survey State ────────────────────────────
  const [selectedSurveyId, setSelectedSurveyId] = useState<string | null>(null)
  const [showSurveyModal, setShowSurveyModal] = useState(false)
  const [surveyForm, setSurveyForm] = useState({
    employee_id: '',
    is_anonymous: false,
    overall_satisfaction: 3,
    management_rating: 3,
    work_life_balance: 3,
    career_growth: 3,
    compensation_satisfaction: 3,
    team_culture: 3,
    reason_for_leaving: '',
    what_could_improve: '',
    best_part: '',
    additional_comments: '',
    would_recommend: true,
  })

  // ═══════════════════════════════════════════════
  //  COMPUTED VALUES
  // ═══════════════════════════════════════════════

  const filteredProcesses = useMemo(() => {
    return offboardingProcesses.filter(p => {
      const emp = employees.find(e => e.id === p.employee_id)
      const matchSearch = !processSearch ||
        (emp?.profile?.full_name || '').toLowerCase().includes(processSearch.toLowerCase())
      const matchStatus = processStatusFilter === 'all' || p.status === processStatusFilter
      return matchSearch && matchStatus
    })
  }, [offboardingProcesses, employees, processSearch, processStatusFilter])

  const selectedProcess = useMemo(() =>
    offboardingProcesses.find(p => p.id === selectedProcessId),
    [offboardingProcesses, selectedProcessId]
  )

  const selectedProcessTasks = useMemo(() =>
    offboardingTasks.filter(t => t.process_id === selectedProcessId),
    [offboardingTasks, selectedProcessId]
  )

  const selectedSurvey = useMemo(() =>
    exitSurveys.find(s => s.id === selectedSurveyId),
    [exitSurveys, selectedSurveyId]
  )

  // Stats
  const activeProcessCount = offboardingProcesses.filter(p => p.status === 'in_progress' || p.status === 'pending').length
  const completedProcessCount = offboardingProcesses.filter(p => p.status === 'completed').length
  const totalTasks = offboardingTasks.length
  const completedTasks = offboardingTasks.filter(t => t.status === 'completed').length
  const overallCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  // Average days to complete
  const completedProcesses = offboardingProcesses.filter(p => p.completed_at && p.started_at)
  const avgDays = completedProcesses.length > 0
    ? Math.round(completedProcesses.reduce((sum, p) => {
      const start = new Date(p.started_at).getTime()
      const end = new Date(p.completed_at!).getTime()
      return sum + (end - start) / (1000 * 60 * 60 * 24)
    }, 0) / completedProcesses.length)
    : 0

  // ═══════════════════════════════════════════════
  //  ANALYTICS DATA
  // ═══════════════════════════════════════════════

  const reasonBreakdown = useMemo(() => {
    const counts: Record<string, number> = {}
    offboardingProcesses.forEach(p => {
      counts[p.reason] = (counts[p.reason] || 0) + 1
    })
    return Object.entries(counts).map(([reason, count], i) => ({
      name: REASON_LABELS[reason] || reason,
      value: count,
      color: CHART_SERIES[i % CHART_SERIES.length],
    }))
  }, [offboardingProcesses])

  const taskCompletionByCategory = useMemo(() => {
    const catStats: Record<string, { total: number; completed: number }> = {}
    offboardingTasks.forEach(task => {
      const item = offboardingChecklistItems.find(i => i.id === task.checklist_item_id)
      if (item) {
        const cat = item.category
        if (!catStats[cat]) catStats[cat] = { total: 0, completed: 0 }
        catStats[cat].total++
        if (task.status === 'completed') catStats[cat].completed++
      }
    })
    return Object.entries(catStats).map(([cat, stats]) => ({
      name: CATEGORIES[cat as CategoryKey]?.label || cat,
      completed: stats.completed,
      total: stats.total,
      rate: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
    }))
  }, [offboardingTasks, offboardingChecklistItems])

  const monthlyTrends = useMemo(() => {
    const months: Record<string, number> = {}
    offboardingProcesses.forEach(p => {
      const month = p.started_at.slice(0, 7)
      months[month] = (months[month] || 0) + 1
    })
    return Object.entries(months).sort().map(([month, count]) => ({
      name: new Date(month + '-01').toLocaleDateString('en', { month: 'short', year: '2-digit' }),
      count,
    }))
  }, [offboardingProcesses])

  const surveyThemes = useMemo(() => {
    const themes: Record<string, { total: number; sum: number }> = {
      'Overall Satisfaction': { total: 0, sum: 0 },
      'Management': { total: 0, sum: 0 },
      'Work-Life Balance': { total: 0, sum: 0 },
      'Career Growth': { total: 0, sum: 0 },
      'Compensation': { total: 0, sum: 0 },
      'Team Culture': { total: 0, sum: 0 },
    }
    exitSurveys.forEach(s => {
      const r = s.responses as Record<string, unknown>
      if (r) {
        if (typeof r.overall_satisfaction === 'number') { themes['Overall Satisfaction'].total++; themes['Overall Satisfaction'].sum += r.overall_satisfaction }
        if (typeof r.management_rating === 'number') { themes['Management'].total++; themes['Management'].sum += r.management_rating }
        if (typeof r.work_life_balance === 'number') { themes['Work-Life Balance'].total++; themes['Work-Life Balance'].sum += r.work_life_balance }
        if (typeof r.career_growth === 'number') { themes['Career Growth'].total++; themes['Career Growth'].sum += r.career_growth }
        if (typeof r.compensation_satisfaction === 'number') { themes['Compensation'].total++; themes['Compensation'].sum += r.compensation_satisfaction }
        if (typeof r.team_culture === 'number') { themes['Team Culture'].total++; themes['Team Culture'].sum += r.team_culture }
      }
    })
    return Object.entries(themes)
      .filter(([, v]) => v.total > 0)
      .map(([name, v]) => ({ name, avg: +(v.sum / v.total).toFixed(1) }))
  }, [exitSurveys])

  // Top reasons for leaving (for survey summary)
  const topReasons = useMemo(() => {
    const reasons: Record<string, number> = {}
    exitSurveys.forEach(s => {
      const r = s.responses as Record<string, unknown>
      if (r?.reason_for_leaving && typeof r.reason_for_leaving === 'string') {
        const reason = r.reason_for_leaving.slice(0, 60)
        reasons[reason] = (reasons[reason] || 0) + 1
      }
    })
    return Object.entries(reasons)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([reason, count]) => ({ reason, count }))
  }, [exitSurveys])

  // ═══════════════════════════════════════════════
  //  HANDLERS
  // ═══════════════════════════════════════════════

  function getProcessProgress(processId: string) {
    const tasks = offboardingTasks.filter(t => t.process_id === processId)
    if (tasks.length === 0) return 0
    const done = tasks.filter(t => t.status === 'completed' || t.status === 'skipped').length
    return Math.round((done / tasks.length) * 100)
  }

  const canApproveOffboarding = currentUser?.role === 'hrbp' || currentUser?.role === 'admin' || currentUser?.role === 'owner'

  // T5 #44: Contract expiry monitor
  const expiringContracts = useMemo(() => {
    const now = new Date()
    const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    return employees.filter(e => {
      const endDate = (e as any).contract_end_date || (e as any).contractEndDate
      if (!endDate) return false
      const d = new Date(endDate)
      return d >= now && d <= thirtyDays
    }).map(e => ({
      ...e,
      contract_end_date: (e as any).contract_end_date || (e as any).contractEndDate,
      has_active_process: offboardingProcesses.some(p => p.employee_id === e.id && p.status !== 'completed' && p.status !== 'cancelled'),
    }))
  }, [employees, offboardingProcesses])

  // T5 #42: Manager departure — detect orphaned direct reports
  function checkOrphanedReports(employeeId: string) {
    const directReports = employees.filter(e => (e as any).manager_id === employeeId || (e as any).managerId === employeeId)
    return directReports
  }

  // T5 #36: Detect probation status
  function isProbationEmployee(employeeId: string) {
    const emp = employees.find(e => e.id === employeeId) as any
    return emp?.employment_status === 'probation' || emp?.employmentStatus === 'probation' || emp?.status === 'probation' || emp?.probation === true
  }

  function handleNewProcess() {
    const errors: string[] = []
    if (!processForm.employee_id) errors.push('Employee is required')
    if (!processForm.last_working_date) errors.push('Last working date is required')
    if (!processForm.reason) errors.push('Reason is required')
    if (errors.length > 0) { addToast(errors.join('. '), 'error'); return }
    const checklistId = processForm.checklist_id || offboardingChecklists[0]?.id

    // T5 #36: Apply probation-specific rules
    const isProbation = isProbationEmployee(processForm.employee_id)
    const probationNotes = isProbation ? `[PROBATION] Shorter notice period applies (1 week). No leave payout. ` : ''

    // T5 #42: Check for orphaned direct reports
    const orphanedReports = checkOrphanedReports(processForm.employee_id)
    const orphanWarning = orphanedReports.length > 0 ? `[WARNING] ${orphanedReports.length} direct report(s) need reassignment: ${orphanedReports.map(e => e.profile?.full_name).join(', ')}. ` : ''

    setSaving(true)
    try {
      addOffboardingProcess({
        employee_id: processForm.employee_id,
        initiated_by: currentEmployeeId,
        status: 'pending',
        checklist_id: checklistId,
        last_working_date: processForm.last_working_date,
        reason: processForm.reason,
        notes: `${probationNotes}${orphanWarning}${processForm.notes || ''}`.trim(),
      })

      const empName = employees.find(e => e.id === processForm.employee_id)?.profile?.full_name || 'Employee'
      triggerCascade('EMPLOYEE_TERMINATED', { employeeName: empName })

      if (orphanedReports.length > 0) {
        addToast(`Offboarding submitted — ${orphanedReports.length} direct report(s) need reassignment`, 'info')
      } else {
        addToast('Offboarding submitted for approval')
      }

      // Cross-module notification: offboarding initiated
      const emp = employees.find((e: any) => e.id === processForm.employee_id)
      addPlatformEvent?.({ type: 'offboarding.initiated', title: 'Offboarding Initiated', data: { name: emp?.profile?.full_name || getEmployeeName(processForm.employee_id), lastDate: processForm.last_working_date, reason: processForm.reason } })

      setShowNewProcessModal(false)
      setProcessForm({ employee_id: '', reason: 'resignation', last_working_date: '', checklist_id: '', notes: '' })
    } finally {
      setSaving(false)
    }
  }

  function approveOffboarding(processId: string) {
    const process = offboardingProcesses.find((p: any) => p.id === processId)
    if (!process) return

    // T5 #42: Block approval if employee has direct reports that need reassignment
    const directReports = checkOrphanedReports(process.employee_id)
    if (directReports.length > 0) {
      setOrphanedReports(directReports)
      setReassignProcessId(processId)
      setReassignments({})
      setShowReassignModal(true)
      return
    }

    finalizeApproval(processId)
  }

  function finalizeApproval(processId: string) {
    const process = offboardingProcesses.find((p: any) => p.id === processId)
    if (!process) return
    updateOffboardingProcess(processId, { status: 'in_progress', approved_by: currentEmployeeId, approved_at: new Date().toISOString() })
    // Now auto-generate tasks from checklist
    const items = offboardingChecklistItems.filter((i: any) => i.checklist_id === process.checklist_id)
    items.forEach((item: any) => {
      addOffboardingTask({
        process_id: processId,
        checklist_item_id: item.id,
        assignee_id: null,
        status: 'pending',
      })
    })
    // G14: Auto-create IT Access Revocation task
    addOffboardingTask({
      process_id: processId,
      checklist_item_id: 'auto_it_revocation',
      assignee_id: null,
      status: 'pending',
      title: 'IT Access Revocation',
      description: 'Revoke all IT access: email, VPN, SSO, internal tools. Disable Active Directory account.',
      category: 'access_revocation',
    })
    // G15: Auto-trigger COBRA notification for benefits termination
    addOffboardingTask({
      process_id: processId,
      checklist_item_id: 'auto_cobra_notification',
      assignee_id: null,
      status: 'pending',
      title: 'Send COBRA Notification',
      description: 'Send COBRA continuation coverage notice to departing employee within 14 days of benefits termination.',
      category: 'benefits',
    })
    addToast('Offboarding approved — tasks created (incl. IT revocation & COBRA notice)')
  }

  function confirmReassignAndApprove() {
    if (!reassignProcessId) return
    // Check all orphaned reports have been reassigned
    const allReassigned = orphanedReports.every(r => reassignments[r.id])
    if (!allReassigned) { addToast('Please reassign all direct reports before approving'); return }
    // Apply reassignments
    orphanedReports.forEach(r => {
      if (reassignments[r.id]) {
        updateEmployee(r.id, { managerId: reassignments[r.id] })
      }
    })
    setShowReassignModal(false)
    finalizeApproval(reassignProcessId)
    setReassignProcessId(null)
    setOrphanedReports([])
    setReassignments({})
    addToast('Direct reports reassigned successfully')
  }

  function rejectOffboarding(processId: string) {
    updateOffboardingProcess(processId, { status: 'cancelled' })
    addToast('Offboarding rejected')
  }

  function handleToggleTask(taskId: string, currentStatus: string) {
    if (currentStatus === 'completed') {
      updateOffboardingTask(taskId, { status: 'pending', completed_at: null, completed_by: null })
    } else {
      updateOffboardingTask(taskId, {
        status: 'completed',
        completed_at: new Date().toISOString(),
        completed_by: 'emp-17',
      })
    }
  }

  function handleSkipTask(taskId: string) {
    updateOffboardingTask(taskId, { status: 'skipped', completed_at: null, completed_by: null })
  }

  function handleSaveChecklist() {
    if (!checklistForm.name) { addToast('Checklist name is required', 'error'); return }
    setSaving(true)
    try {
      if (editingChecklistId) {
        updateOffboardingChecklist(editingChecklistId, checklistForm)
      } else {
        addOffboardingChecklist(checklistForm)
      }
      addToast(editingChecklistId ? 'Checklist updated' : 'Checklist created')
      setShowChecklistModal(false)
      setEditingChecklistId(null)
      setChecklistForm({ name: '', description: '', is_default: false })
    } finally {
      setSaving(false)
    }
  }

  function handleSubmitSurvey() {
    const errors: string[] = []
    if (!surveyForm.employee_id && !surveyForm.is_anonymous) errors.push('Employee is required (or mark as anonymous)')
    // Check at least 1 meaningful response exists
    const hasRating = surveyForm.overall_satisfaction !== 3 || surveyForm.management_rating !== 3 || surveyForm.work_life_balance !== 3 || surveyForm.career_growth !== 3 || surveyForm.compensation_satisfaction !== 3 || surveyForm.team_culture !== 3
    const hasText = !!surveyForm.reason_for_leaving || !!surveyForm.what_could_improve || !!surveyForm.best_part || !!surveyForm.additional_comments
    if (!hasRating && !hasText) errors.push('At least 1 response (rating or text) is required')
    if (errors.length > 0) { addToast(errors.join('. '), 'error'); return }
    setSaving(true)
    try {
      addExitSurvey({
        employee_id: surveyForm.is_anonymous ? null : surveyForm.employee_id,
        is_anonymous: surveyForm.is_anonymous,
        responses: {
          overall_satisfaction: surveyForm.overall_satisfaction,
          management_rating: surveyForm.management_rating,
          work_life_balance: surveyForm.work_life_balance,
          career_growth: surveyForm.career_growth,
          compensation_satisfaction: surveyForm.compensation_satisfaction,
          team_culture: surveyForm.team_culture,
          reason_for_leaving: surveyForm.reason_for_leaving,
          what_could_improve: surveyForm.what_could_improve,
          best_part: surveyForm.best_part,
          additional_comments: surveyForm.additional_comments,
          would_recommend: surveyForm.would_recommend,
        },
      })
      addToast('Exit survey submitted successfully')
      setShowSurveyModal(false)
      setSurveyForm({
        employee_id: '', is_anonymous: false,
        overall_satisfaction: 3, management_rating: 3, work_life_balance: 3,
        career_growth: 3, compensation_satisfaction: 3, team_culture: 3,
        reason_for_leaving: '', what_could_improve: '', best_part: '',
        additional_comments: '', would_recommend: true,
      })
    } finally {
      setSaving(false)
    }
  }

  function handleSaveItem() {
    const errors: string[] = []
    if (!itemForm.title) errors.push('Task title is required')
    if (!itemForm.category) errors.push('Category is required')
    if (!itemForm.checklist_id) errors.push('Checklist is required')
    if (errors.length > 0) { addToast(errors.join('. '), 'error'); return }
    setSaving(true)
    try {
      addOffboardingChecklistItem(itemForm)
      addToast('Checklist item added')
      setShowItemModal(false)
      setItemForm({ checklist_id: '', title: '', description: '', category: 'access_revocation', assignee_role: '', order_index: 0, is_required: true })
    } finally {
      setSaving(false)
    }
  }

  // ── Confirmation Action Handler ──────────────
  function executeConfirmAction() {
    if (!confirmAction) return
    setSaving(true)
    try {
      switch (confirmAction.action) {
        case 'cancel_process':
          updateOffboardingProcess(confirmAction.id, { status: 'cancelled' })
          addToast('Offboarding process cancelled')
          break
        case 'complete_process':
          updateOffboardingProcess(confirmAction.id, { status: 'completed', completed_at: new Date().toISOString() })
          addToast('Offboarding marked as complete')
          break
        case 'delete_checklist_item':
          deleteOffboardingChecklistItem(confirmAction.id)
          addToast('Checklist item deleted')
          break
      }
    } finally {
      setSaving(false)
      setConfirmAction(null)
    }
  }

  // ═══════════════════════════════════════════════
  //  FINAL PAY COMPUTATION
  // ═══════════════════════════════════════════════

  function computeFinalPay(process: any) {
    const employee = employees.find(e => e.id === process.employee_id) as any
    if (!employee) return null

    const lastDate = new Date(process.last_working_date || Date.now())
    const daysInMonth = new Date(lastDate.getFullYear(), lastDate.getMonth() + 1, 0).getDate()
    const daysWorked = lastDate.getDate()

    // Use employee salary from compensation or default (amounts in cents)
    const annualSalary = employee.salary || employee.base_salary || employee.compensation?.base_salary || 6000000 // fallback $60k
    const monthlySalary = Math.round(annualSalary / 12)
    const proRatedSalary = Math.round((monthlySalary * daysWorked) / daysInMonth)

    // Outstanding leave (estimate 5 days at daily rate)
    const dailyRate = Math.round(monthlySalary / daysInMonth)
    const leaveBalance = employee.leave_balance || employee.leaveBalance || 5 // days
    const leavePayout = dailyRate * leaveBalance

    // Severance (if applicable) - 1 month per year of service
    const startDate = new Date(employee.start_date || employee.hire_date || employee.startDate || employee.hireDate || '2023-01-01')
    const yearsOfService = Math.max(1, Math.round((lastDate.getTime() - startDate.getTime()) / (365.25 * 86400000)))
    const severance = process.reason === 'layoff' || process.reason === 'redundancy' || process.reason === 'restructuring' ? monthlySalary * yearsOfService : 0

    const totalFinalPay = proRatedSalary + leavePayout + severance

    return {
      monthlySalary,
      proRatedSalary,
      daysWorked,
      daysInMonth,
      dailyRate,
      leaveBalance,
      leavePayout,
      severance,
      yearsOfService,
      totalFinalPay,
      lastDate: lastDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
    }
  }

  // ═══════════════════════════════════════════════
  //  RENDER
  // ═══════════════════════════════════════════════

  if (pageLoading) {
    return (
      <>
        <Header title="Offboarding" subtitle="Manage employee departures, checklists, and exit surveys" />
        <div className="p-6"><PageSkeleton /></div>
      </>
    )
  }

  return (
    <div>
      <Header
        title="Offboarding"
        subtitle="Manage employee departures, checklists, and exit surveys"
        actions={
          <Button onClick={() => setShowNewProcessModal(true)}>
            <Plus size={14} className="mr-1" /> Initiate Offboarding
          </Button>
        }
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Active Processes"
          value={activeProcessCount}
          icon={<UserMinus size={20} />}
          change={`${completedProcessCount} completed`}
          changeType="neutral"
        />
        <StatCard
          label="Task Completion"
          value={`${overallCompletionRate}%`}
          icon={<CheckCircle2 size={20} />}
          change={`${completedTasks} of ${totalTasks} tasks`}
          changeType={overallCompletionRate > 70 ? 'positive' : 'neutral'}
        />
        <StatCard
          label="Avg. Duration"
          value={`${avgDays} days`}
          icon={<Clock size={20} />}
          change="Average time to complete"
          changeType="neutral"
        />
        <StatCard
          label="Exit Surveys"
          value={exitSurveys.length}
          icon={<MessageSquareText size={20} />}
          change={`${exitSurveys.filter(s => !(s.is_anonymous)).length} identified`}
          changeType="neutral"
        />
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

      <div className="mt-6">
        {/* ═══════════════════════════════════════
            TAB: Active Processes
        ═══════════════════════════════════════ */}
        {activeTab === 'processes' && (
          <div>
            {/* T5 #44: Contract Expiry Alerts */}
            {expiringContracts.length > 0 && !selectedProcess && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle size={16} className="text-amber-600 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-amber-800">{expiringContracts.length} contract(s) expiring within 30 days</p>
                    <div className="mt-2 space-y-1">
                      {expiringContracts.map(emp => (
                        <div key={emp.id} className="flex items-center justify-between text-xs">
                          <span className="text-amber-700">{emp.profile?.full_name} — expires {(emp as any).contract_end_date}</span>
                          {(emp as any).has_active_process ? (
                            <Badge variant="success">Offboarding initiated</Badge>
                          ) : (
                            <Button size="sm" onClick={() => { setProcessForm(f => ({ ...f, employee_id: emp.id, reason: 'end_of_contract', last_working_date: (emp as any).contract_end_date || '' })); setShowNewProcessModal(true) }}>
                              Initiate Offboarding
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
            {selectedProcess ? (
              // ── Process Detail View ─────────
              <div>
                <button
                  onClick={() => setSelectedProcessId(null)}
                  className="text-xs text-t3 hover:text-t1 mb-4 flex items-center gap-1"
                >
                  <ChevronRight size={12} className="rotate-180" /> Back to all processes
                </button>

                <Card className="mb-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={getEmployeeName(selectedProcess.employee_id)} size="lg" />
                      <div>
                        <h3 className="text-sm font-semibold text-t1">{getEmployeeName(selectedProcess.employee_id)}</h3>
                        <p className="text-xs text-t3">
                          {employees.find(e => e.id === selectedProcess.employee_id)?.job_title} &middot;{' '}
                          {getDepartmentName(employees.find(e => e.id === selectedProcess.employee_id)?.department_id || '')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={STATUS_BADGE[selectedProcess.status]?.variant || 'default'}>
                        {STATUS_BADGE[selectedProcess.status]?.label}
                      </Badge>
                      <Badge variant="info">{REASON_LABELS[selectedProcess.reason]}</Badge>
                      <span className="text-xs text-t3">Last day: {selectedProcess.last_working_date}</span>
                    </div>
                  </div>
                  {selectedProcess.notes && (
                    <p className="text-xs text-t3 mt-3 border-t border-divider pt-3">{selectedProcess.notes}</p>
                  )}
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-t3">Overall Progress</span>
                      <span className="text-xs font-medium text-t1">{getProcessProgress(selectedProcess.id)}%</span>
                    </div>
                    <Progress value={getProcessProgress(selectedProcess.id)} color={getProcessProgress(selectedProcess.id) === 100 ? 'success' : 'orange'} size="md" />
                  </div>
                </Card>

                {/* Tasks grouped by category */}
                {(Object.keys(CATEGORIES) as CategoryKey[]).map(catKey => {
                  const catTasks = selectedProcessTasks.filter(t => {
                    const item = offboardingChecklistItems.find(i => i.id === t.checklist_item_id)
                    return item?.category === catKey
                  })
                  if (catTasks.length === 0) return null
                  const CatIcon = CATEGORIES[catKey].icon
                  const catCompleted = catTasks.filter(t => t.status === 'completed' || t.status === 'skipped').length

                  return (
                    <Card key={catKey} className="mb-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <CatIcon size={16} className={CATEGORIES[catKey].color} />
                          <h4 className="text-xs font-semibold text-t1">{CATEGORIES[catKey].label}</h4>
                        </div>
                        <span className="text-[0.65rem] text-t3">{catCompleted}/{catTasks.length} completed</span>
                      </div>
                      <div className="space-y-2">
                        {catTasks.map(task => {
                          const item = offboardingChecklistItems.find(i => i.id === task.checklist_item_id)
                          return (
                            <div key={task.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-canvas/50 group">
                              <button
                                onClick={() => handleToggleTask(task.id, task.status)}
                                className="mt-0.5 shrink-0"
                              >
                                {task.status === 'completed' ? (
                                  <CheckCircle2 size={16} className="text-green-500" />
                                ) : task.status === 'skipped' ? (
                                  <SkipForward size={16} className="text-t3" />
                                ) : task.status === 'in_progress' ? (
                                  <Clock size={16} className="text-blue-500" />
                                ) : (
                                  <Circle size={16} className="text-t3 group-hover:text-t2" />
                                )}
                              </button>
                              <div className="flex-1 min-w-0">
                                <p className={`text-xs font-medium ${task.status === 'completed' ? 'text-t3 line-through' : 'text-t1'}`}>
                                  {item?.title || 'Unknown Task'}
                                </p>
                                {item?.description && (
                                  <p className="text-[0.65rem] text-t3 mt-0.5">{item.description}</p>
                                )}
                                <div className="flex items-center gap-3 mt-1">
                                  {task.assignee_id && (
                                    <span className="text-[0.6rem] text-t3">
                                      Assigned: {getEmployeeName(task.assignee_id)}
                                    </span>
                                  )}
                                  {item?.assignee_role && !task.assignee_id && (
                                    <span className="text-[0.6rem] text-t3">
                                      Role: {item.assignee_role}
                                    </span>
                                  )}
                                  {task.completed_at && (
                                    <span className="text-[0.6rem] text-t3">
                                      Completed: {new Date(task.completed_at).toLocaleDateString()}
                                    </span>
                                  )}
                                  {task.notes && (
                                    <span className="text-[0.6rem] text-t3 italic">
                                      {task.notes}
                                    </span>
                                  )}
                                </div>
                              </div>
                              {task.status !== 'completed' && task.status !== 'skipped' && (
                                <button
                                  onClick={() => handleSkipTask(task.id)}
                                  className="text-[0.6rem] text-t3 hover:text-t1 opacity-0 group-hover:opacity-100 transition-opacity"
                                  title="Skip task"
                                >
                                  Skip
                                </button>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </Card>
                  )
                })}

                {/* Final Pay Computation */}
                {(() => {
                  const fp = computeFinalPay(selectedProcess)
                  if (!fp) return null
                  return (
                    <Card className="mt-4">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle>Final Pay Computation</CardTitle>
                          <Badge variant="warning">Estimate</Badge>
                        </div>
                      </CardHeader>
                      <div className="px-5 pb-5">
                        <div className="space-y-3">
                          <div className="flex justify-between text-sm">
                            <span className="text-t2">Monthly salary</span>
                            <span className="font-medium text-t1">{formatCurrency(fp.monthlySalary, defaultCurrency, { cents: true })}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-t2">Pro-rated salary ({fp.daysWorked}/{fp.daysInMonth} days)</span>
                            <span className="font-medium text-t1">{formatCurrency(fp.proRatedSalary, defaultCurrency, { cents: true })}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-t2">Leave payout ({fp.leaveBalance} days @ {formatCurrency(fp.dailyRate, defaultCurrency, { cents: true })}/day)</span>
                            <span className="font-medium text-t1">{formatCurrency(fp.leavePayout, defaultCurrency, { cents: true })}</span>
                          </div>
                          {fp.severance > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-t2">Severance ({fp.yearsOfService} yr{fp.yearsOfService > 1 ? 's' : ''} of service)</span>
                              <span className="font-medium text-t1">{formatCurrency(fp.severance, defaultCurrency, { cents: true })}</span>
                            </div>
                          )}
                          <div className="border-t border-divider pt-3 flex justify-between">
                            <span className="text-sm font-semibold text-t1">Total Final Pay</span>
                            <span className="text-sm font-bold text-tempo-600">{formatCurrency(fp.totalFinalPay, defaultCurrency, { cents: true })}</span>
                          </div>
                        </div>
                        <p className="text-[0.6rem] text-t3 mt-3">* Estimated as of {fp.lastDate}. Actual amounts will be confirmed by payroll after processing deductions, taxes, and final adjustments.</p>
                      </div>
                    </Card>
                  )
                })()}

                {/* Process actions */}
                <div className="flex gap-2 mt-4">
                  {selectedProcess.status === 'pending' && canApproveOffboarding && (
                    <Button onClick={() => approveOffboarding(selectedProcess.id)}>
                      <Check size={14} className="mr-1" /> Approve & Start
                    </Button>
                  )}
                  {selectedProcess.status === 'pending' && canApproveOffboarding && (
                    <Button variant="ghost" onClick={() => rejectOffboarding(selectedProcess.id)}>
                      <X size={14} className="mr-1" /> Reject
                    </Button>
                  )}
                  {selectedProcess.status === 'in_progress' && getProcessProgress(selectedProcess.id) === 100 && (
                    <Button onClick={() => setConfirmAction({ show: true, action: 'complete_process', id: selectedProcess.id, label: `Mark offboarding for ${getEmployeeName(selectedProcess.employee_id)} as complete? This action is irreversible.` })}>
                      <Check size={14} className="mr-1" /> Mark Complete
                    </Button>
                  )}
                  {(selectedProcess.status === 'pending' || selectedProcess.status === 'in_progress') && (
                    <Button
                      variant="ghost"
                      onClick={() => setConfirmAction({ show: true, action: 'cancel_process', id: selectedProcess.id, label: `Cancel offboarding process for ${getEmployeeName(selectedProcess.employee_id)}? All pending tasks will be abandoned.` })}
                    >
                      <X size={14} className="mr-1" /> Cancel Process
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              // ── Process List View ─────────
              <div>
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <div className="relative flex-1 max-w-xs">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-t3" />
                    <input
                      type="text"
                      placeholder="Search employees..."
                      value={processSearch}
                      onChange={(e) => setProcessSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-divider rounded-lg text-t1 placeholder:text-t3 focus:outline-none focus:ring-2 focus:ring-tempo-600/20"
                    />
                  </div>
                  <Select
                    value={processStatusFilter}
                    onChange={(e) => setProcessStatusFilter(e.target.value)}
                    options={[
                      { value: 'all', label: 'All Statuses' },
                      { value: 'pending', label: 'Pending' },
                      { value: 'in_progress', label: 'In Progress' },
                      { value: 'completed', label: 'Completed' },
                      { value: 'cancelled', label: 'Cancelled' },
                    ]}
                    className="w-40"
                  />
                </div>

                {filteredProcesses.length === 0 ? (
                  <Card className="text-center py-12">
                    <UserMinus size={32} className="mx-auto text-t3 mb-3" />
                    <p className="text-sm font-medium text-t2">
                      {processStatusFilter === 'completed' ? 'No completed offboarding' :
                       processStatusFilter === 'cancelled' ? 'No cancelled offboarding processes' :
                       processSearch ? 'No matching processes found' :
                       'No active offboarding processes'}
                    </p>
                    <p className="text-xs text-t3 mt-1">
                      {processStatusFilter === 'completed' ? 'Historical records will appear here once processes are finished' :
                       processSearch ? 'Try adjusting your search terms' :
                       'Processes will appear when employees are departing'}
                    </p>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {filteredProcesses.map(process => {
                      const emp = employees.find(e => e.id === process.employee_id)
                      const progress = getProcessProgress(process.id)
                      const taskCount = offboardingTasks.filter(t => t.process_id === process.id).length
                      const completedCount = offboardingTasks.filter(t => t.process_id === process.id && (t.status === 'completed' || t.status === 'skipped')).length

                      return (
                        <Card
                          key={process.id}
                          className="cursor-pointer hover:border-tempo-200 transition-colors"
                          onClick={() => setSelectedProcessId(process.id)}
                        >
                          <div className="flex items-center gap-4">
                            <Avatar name={emp?.profile?.full_name || 'Unknown'} size="md" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-sm font-medium text-t1">{emp?.profile?.full_name || 'Unknown'}</h3>
                                <Badge variant={STATUS_BADGE[process.status]?.variant || 'default'}>
                                  {STATUS_BADGE[process.status]?.label}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-t3">
                                <span>{emp?.job_title}</span>
                                <span>&middot;</span>
                                <span>{REASON_LABELS[process.reason]}</span>
                                <span>&middot;</span>
                                <span>Last day: {process.last_working_date}</span>
                              </div>
                              {process.status === 'pending' && taskCount === 0 ? (
                                <div className="mt-2 flex items-center gap-2">
                                  <Badge variant="warning" className="text-[10px]">Awaiting Approval</Badge>
                                  <span className="text-[0.65rem] text-t3">Tasks will be created after approval</span>
                                </div>
                              ) : (
                                <div className="mt-2 flex items-center gap-3">
                                  <div className="flex-1">
                                    <Progress value={progress} size="sm" color={progress === 100 ? 'success' : 'orange'} />
                                  </div>
                                  <span className="text-[0.65rem] text-t3 whitespace-nowrap">
                                    {completedCount}/{taskCount} tasks
                                  </span>
                                </div>
                              )}
                              {process.status === 'pending' && canApproveOffboarding && (
                                <div className="mt-2 flex gap-2" onClick={(e) => e.stopPropagation()}>
                                  <Button size="sm" onClick={(e) => { e.stopPropagation(); approveOffboarding(process.id) }}>Approve</Button>
                                  <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); rejectOffboarding(process.id) }}>Reject</Button>
                                </div>
                              )}
                            </div>
                            <ChevronRight size={16} className="text-t3 shrink-0" />
                          </div>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════
            TAB: Checklists
        ═══════════════════════════════════════ */}
        {activeTab === 'checklists' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs text-t3">{offboardingChecklists.length} checklist template{offboardingChecklists.length !== 1 ? 's' : ''}</p>
              <Button onClick={() => { setEditingChecklistId(null); setChecklistForm({ name: '', description: '', is_default: false }); setShowChecklistModal(true) }}>
                <Plus size={14} className="mr-1" /> New Checklist
              </Button>
            </div>

            {offboardingChecklists.length === 0 ? (
              <Card className="text-center py-12">
                <ClipboardList size={32} className="mx-auto text-t3 mb-3" />
                <p className="text-sm font-medium text-t2">No offboarding templates</p>
                <p className="text-xs text-t3 mt-1">Create reusable checklists for consistent offboarding</p>
              </Card>
            ) : (
            <div className="space-y-4">
              {offboardingChecklists.map(checklist => {
                const items = offboardingChecklistItems.filter(i => i.checklist_id === checklist.id)
                const isExpanded = expandedChecklist === checklist.id

                return (
                  <Card key={checklist.id}>
                    <div
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => setExpandedChecklist(isExpanded ? null : checklist.id)}
                    >
                      <div className="flex items-center gap-3">
                        <ClipboardList size={18} className="text-tempo-500" />
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-t1">{checklist.name}</h3>
                            {checklist.is_default && <Badge variant="orange">Default</Badge>}
                          </div>
                          {checklist.description && (
                            <p className="text-xs text-t3 mt-0.5">{checklist.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-t3">{items.length} items</span>
                        <ChevronDown size={16} className={`text-t3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-4 border-t border-divider pt-4">
                        {/* Group items by category */}
                        {(Object.keys(CATEGORIES) as CategoryKey[]).map(catKey => {
                          const catItems = items.filter(i => i.category === catKey).sort((a, b) => a.order_index - b.order_index)
                          if (catItems.length === 0) return null
                          const CatIcon = CATEGORIES[catKey].icon

                          return (
                            <div key={catKey} className="mb-4 last:mb-0">
                              <div className="flex items-center gap-2 mb-2">
                                <CatIcon size={14} className={CATEGORIES[catKey].color} />
                                <h4 className="text-xs font-semibold text-t2">{CATEGORIES[catKey].label}</h4>
                              </div>
                              <div className="space-y-1 ml-6">
                                {catItems.map((item, idx) => (
                                  <div key={item.id} className="flex items-center gap-2 group py-1">
                                    <GripVertical size={12} className="text-t3 opacity-0 group-hover:opacity-100 cursor-grab" />
                                    <span className="text-xs text-t3 w-5">{idx + 1}.</span>
                                    <span className="text-xs text-t1 flex-1">{item.title}</span>
                                    {item.assignee_role && (
                                      <Badge variant="default">{item.assignee_role}</Badge>
                                    )}
                                    {item.is_required && (
                                      <span className="text-[0.6rem] text-red-500 font-medium">Required</span>
                                    )}
                                    <button
                                      onClick={(e) => { e.stopPropagation(); setConfirmAction({ show: true, action: 'delete_checklist_item', id: item.id, label: `Delete checklist item "${item.title}"? This cannot be undone.` }) }}
                                      className="text-t3 hover:text-error opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <X size={12} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )
                        })}

                        <div className="flex gap-2 mt-4 pt-3 border-t border-divider">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              setItemForm(prev => ({ ...prev, checklist_id: checklist.id, order_index: items.length + 1 }))
                              setShowItemModal(true)
                            }}
                          >
                            <Plus size={12} className="mr-1" /> Add Item
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              setEditingChecklistId(checklist.id)
                              setChecklistForm({ name: checklist.name, description: checklist.description || '', is_default: checklist.is_default })
                              setShowChecklistModal(true)
                            }}
                          >
                            Edit Checklist
                          </Button>
                        </div>
                      </div>
                    )}
                  </Card>
                )
              })}
            </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════
            TAB: Exit Surveys
        ═══════════════════════════════════════ */}
        {activeTab === 'surveys' && (
          <div>
            {selectedSurvey ? (
              // ── Survey Detail ──────────
              <div>
                <button
                  onClick={() => setSelectedSurveyId(null)}
                  className="text-xs text-t3 hover:text-t1 mb-4 flex items-center gap-1"
                >
                  <ChevronRight size={12} className="rotate-180" /> Back to surveys
                </button>

                <Card className="mb-4">
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar name={selectedSurvey.is_anonymous ? 'Anonymous' : getEmployeeName(selectedSurvey.employee_id)} size="md" />
                    <div>
                      <h3 className="text-sm font-semibold text-t1">
                        {selectedSurvey.is_anonymous ? 'Anonymous Response' : getEmployeeName(selectedSurvey.employee_id)}
                      </h3>
                      <p className="text-xs text-t3">
                        Submitted {new Date(selectedSurvey.submitted_at).toLocaleDateString()}
                        {selectedSurvey.is_anonymous && <Badge variant="info" className="ml-2">Anonymous</Badge>}
                      </p>
                    </div>
                  </div>

                  {selectedSurvey.responses && (() => {
                    const r = selectedSurvey.responses as Record<string, unknown>
                    return (
                      <div className="space-y-4">
                        {/* Ratings */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {[
                            { key: 'overall_satisfaction', label: 'Overall Satisfaction' },
                            { key: 'management_rating', label: 'Management' },
                            { key: 'work_life_balance', label: 'Work-Life Balance' },
                            { key: 'career_growth', label: 'Career Growth' },
                            { key: 'compensation_satisfaction', label: 'Compensation' },
                            { key: 'team_culture', label: 'Team Culture' },
                          ].map(item => (
                            <div key={item.key} className="bg-canvas rounded-lg p-3">
                              <p className="text-[0.65rem] text-t3 mb-1">{item.label}</p>
                              <div className="flex items-center gap-2">
                                <span className="text-lg font-semibold text-t1">{String(r[item.key] ?? '-')}</span>
                                <span className="text-[0.6rem] text-t3">/5</span>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Text responses */}
                        <div className="space-y-3 mt-4 border-t border-divider pt-4">
                          {[
                            { key: 'reason_for_leaving', label: 'Reason for Leaving' },
                            { key: 'what_could_improve', label: 'What Could Improve' },
                            { key: 'best_part', label: 'Best Part of Working Here' },
                            { key: 'additional_comments', label: 'Additional Comments' },
                          ].map(item => r[item.key] ? (
                            <div key={item.key}>
                              <p className="text-xs font-medium text-t2 mb-1">{item.label}</p>
                              <p className="text-xs text-t1 bg-canvas rounded-lg p-3">{String(r[item.key])}</p>
                            </div>
                          ) : null)}
                        </div>

                        {typeof r.would_recommend === 'boolean' && (
                          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-divider">
                            <span className="text-xs text-t2">Would recommend to others:</span>
                            <Badge variant={r.would_recommend ? 'success' : 'error'}>
                              {r.would_recommend ? 'Yes' : 'No'}
                            </Badge>
                          </div>
                        )}
                      </div>
                    )
                  })()}
                </Card>
              </div>
            ) : (
              // ── Survey List + Summary ──────────
              <div>
                {/* Summary Card */}
                {surveyThemes.length > 0 && (
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle>Survey Insights Summary</CardTitle>
                    </CardHeader>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                      {surveyThemes.map(theme => (
                        <div key={theme.name} className="text-center">
                          <p className="text-[0.65rem] text-t3 mb-1">{theme.name}</p>
                          <p className={`text-lg font-semibold ${theme.avg >= 4 ? 'text-green-600' : theme.avg >= 3 ? 'text-amber-600' : 'text-red-600'}`}>
                            {theme.avg}
                          </p>
                          <p className="text-[0.55rem] text-t3">/ 5.0</p>
                        </div>
                      ))}
                    </div>
                    {topReasons.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-divider">
                        <p className="text-xs font-medium text-t2 mb-2">Top Reasons for Leaving</p>
                        <div className="space-y-1.5">
                          {topReasons.map((r, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs">
                              <span className="text-t3 w-4">{i + 1}.</span>
                              <span className="text-t1 flex-1 truncate">{r.reason}</span>
                              <Badge variant="default">{r.count}x</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>
                )}

                <div className="flex justify-end mb-4">
                  <Button onClick={() => setShowSurveyModal(true)}>
                    <Plus size={14} className="mr-1" /> Submit Exit Survey
                  </Button>
                </div>

                {exitSurveys.length === 0 ? (
                  <Card className="text-center py-12">
                    <MessageSquareText size={32} className="mx-auto text-t3 mb-3" />
                    <p className="text-sm font-medium text-t2">No exit surveys yet</p>
                    <p className="text-xs text-t3 mt-1">Gather feedback from departing employees to improve retention</p>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {exitSurveys.map(survey => {
                      const r = survey.responses as Record<string, unknown>
                      return (
                        <Card
                          key={survey.id}
                          className="cursor-pointer hover:border-tempo-200 transition-colors"
                          onClick={() => setSelectedSurveyId(survey.id)}
                        >
                          <div className="flex items-center gap-4">
                            <Avatar
                              name={survey.is_anonymous ? 'Anonymous' : getEmployeeName(survey.employee_id)}
                              size="md"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="text-sm font-medium text-t1">
                                  {survey.is_anonymous ? 'Anonymous' : getEmployeeName(survey.employee_id)}
                                </h3>
                                {survey.is_anonymous && <Badge variant="info">Anonymous</Badge>}
                              </div>
                              <p className="text-xs text-t3 mt-0.5">
                                Submitted {new Date(survey.submitted_at).toLocaleDateString()}
                                {r?.overall_satisfaction ? ` - Rating: ${String(r.overall_satisfaction)}/5` : ''}
                              </p>
                              {r?.reason_for_leaving ? (
                                <p className="text-xs text-t2 mt-1 line-clamp-1">{String(r.reason_for_leaving)}</p>
                              ) : null}
                            </div>
                            <ChevronRight size={16} className="text-t3 shrink-0" />
                          </div>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════
            TAB: Knowledge Transfer
        ═══════════════════════════════════════ */}
        {activeTab === 'knowledge-transfer' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-t1">Knowledge Transfer Tracking</h3>
                <p className="text-xs text-t3">Document and track knowledge handovers for departing employees</p>
              </div>
              <Button onClick={() => setShowKTModal(true)}>
                <Plus size={14} /> Add Knowledge Area
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <StatCard label="Total Areas" value={ktItems.length} icon={<BookOpen size={18} />} />
              <StatCard label="In Progress" value={ktItems.filter(k => k.status === 'in_progress').length} icon={<Clock size={18} />} />
              <StatCard label="Completed" value={ktItems.filter(k => k.status === 'completed').length} icon={<CheckCircle2 size={18} />} />
            </div>

            {/* Knowledge Transfer Items */}
            {ktItems.length === 0 ? (
              <Card>
                <div className="p-8 text-center">
                  <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-500 mx-auto mb-3">
                    <BookOpen size={24} />
                  </div>
                  <p className="text-sm font-medium text-t1 mb-1">No knowledge transfers yet</p>
                  <p className="text-xs text-t3">Create a knowledge transfer area to track handovers</p>
                </div>
              </Card>
            ) : (
              <div className="space-y-2">
                {ktItems.map(item => {
                  const emp = employees.find(e => e.id === item.employee_id)
                  const recipient = employees.find(e => e.id === item.recipient_id)
                  return (
                    <Card key={item.id}>
                      <div className="p-4 flex items-center gap-4">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          item.status === 'completed' ? 'bg-green-50 text-green-600' :
                          item.status === 'in_progress' ? 'bg-blue-50 text-blue-600' :
                          'bg-gray-50 text-gray-500'
                        }`}>
                          <BookOpen size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-t1">{item.area}</p>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-xs text-t3">From: {emp?.profile?.full_name || 'Unknown'}</span>
                            <span className="text-xs text-t3">To: {recipient?.profile?.full_name || 'Unknown'}</span>
                          </div>
                          {item.notes && <p className="text-xs text-t3 mt-0.5 truncate">{item.notes}</p>}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <select
                            value={item.status}
                            onChange={e => {
                              const newStatus = e.target.value as 'pending' | 'in_progress' | 'completed'
                              setKTItems(prev => prev.map(k =>
                                k.id === item.id ? { ...k, status: newStatus } : k
                              ))
                              persistKTItem({ ...item, status: newStatus })
                              addToast(`Knowledge transfer "${item.area}" updated to ${newStatus.replace('_', ' ')}`)
                            }}
                            className="text-xs bg-canvas border border-border rounded-lg px-2 py-1 text-t1 outline-none focus:border-tempo-600"
                          >
                            <option value="pending">Pending</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                          </select>
                          <Badge variant={
                            item.status === 'completed' ? 'success' :
                            item.status === 'in_progress' ? 'info' : 'warning'
                          }>
                            {item.status === 'in_progress' ? 'In Progress' : item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                          </Badge>
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            )}

            {/* Add Knowledge Transfer Modal */}
            <Modal open={showKTModal} onClose={() => setShowKTModal(false)} title="Add Knowledge Transfer Area">
              <div className="space-y-4">
                <Select label="Departing Employee" value={ktForm.employee_id} onChange={e => setKTForm(f => ({ ...f, employee_id: e.target.value }))} options={[
                  { value: '', label: 'Select employee...' },
                  ...employees.map(e => ({ value: e.id, label: e.profile.full_name })),
                ]} />
                <div>
                  <label className="text-xs font-medium text-t1 block mb-1">Knowledge Area</label>
                  <input
                    type="text"
                    value={ktForm.area}
                    onChange={e => setKTForm(f => ({ ...f, area: e.target.value }))}
                    className="w-full px-3 py-2 bg-canvas border border-border rounded-lg text-sm text-t1 focus:border-tempo-600 focus:ring-1 focus:ring-tempo-600/20 outline-none"
                    placeholder="e.g. Client onboarding process, API documentation..."
                  />
                </div>
                <Select label="Transfer Recipient" value={ktForm.recipient_id} onChange={e => setKTForm(f => ({ ...f, recipient_id: e.target.value }))} options={[
                  { value: '', label: 'Select recipient...' },
                  ...employees.filter(e => e.id !== ktForm.employee_id).map(e => ({ value: e.id, label: e.profile.full_name })),
                ]} />
                <div>
                  <label className="text-xs font-medium text-t1 block mb-1">Notes</label>
                  <textarea
                    value={ktForm.notes}
                    onChange={e => setKTForm(f => ({ ...f, notes: e.target.value }))}
                    className="w-full px-3 py-2 bg-canvas border border-border rounded-lg text-sm text-t1 focus:border-tempo-600 focus:ring-1 focus:ring-tempo-600/20 outline-none resize-none"
                    rows={3}
                    placeholder="Additional context or details..."
                  />
                </div>
                <Button
                  onClick={() => {
                    if (!ktForm.employee_id || !ktForm.area || !ktForm.recipient_id) return
                    const id = `kt-${Date.now()}`
                    const newItem = {
                      id,
                      employee_id: ktForm.employee_id,
                      area: ktForm.area,
                      recipient_id: ktForm.recipient_id,
                      status: 'pending' as const,
                      notes: ktForm.notes,
                      created_at: new Date().toISOString(),
                    }
                    setKTItems(prev => [...prev, newItem])
                    persistKTItem(newItem)
                    addToast(`Knowledge transfer area "${ktForm.area}" created`)
                    setKTForm({ employee_id: '', area: '', recipient_id: '', notes: '' })
                    setShowKTModal(false)
                  }}
                  disabled={!ktForm.employee_id || !ktForm.area || !ktForm.recipient_id}
                  className="w-full"
                >
                  Create Knowledge Transfer
                </Button>
              </div>
            </Modal>
          </div>
        )}

        {/* ═══════════════════════════════════════
            TAB: Alumni Archive
        ═══════════════════════════════════════ */}
        {activeTab === 'alumni' && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Alumni Directory</CardTitle>
              </CardHeader>
              <div className="px-6 pb-6">
                {offboardingProcesses.filter(p => p.status === 'completed').length === 0 ? (
                  <p className="text-sm text-t3 text-center py-8">No offboarded employees yet. Completed offboarding processes will appear here as alumni records.</p>
                ) : (
                  <div className="space-y-3">
                    {offboardingProcesses.filter(p => p.status === 'completed').map(process => {
                      const emp = employees.find(e => e.id === process.employee_id)
                      const survey = exitSurveys.find(s => s.employee_id === process.employee_id)
                      return (
                        <div key={process.id} className="flex items-center justify-between p-4 rounded-lg border border-divider hover:bg-canvas/50">
                          <div className="flex items-center gap-3">
                            <Avatar name={emp?.profile?.full_name || 'Unknown'} size="sm" />
                            <div>
                              <p className="text-sm font-medium text-t1">{emp?.profile?.full_name || 'Unknown Employee'}</p>
                              <p className="text-xs text-t3">{emp?.job_title || 'N/A'} &middot; Left: {process.completed_at ? new Date(process.completed_at).toLocaleDateString() : 'N/A'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="default">{(process as any).reason || 'N/A'}</Badge>
                            {survey && <Badge variant="info">Exit Survey</Badge>}
                            {(survey?.responses as any)?.would_recommend && <Badge variant="success">Would Recommend</Badge>}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* ═══════════════════════════════════════
            TAB: Analytics
        ═══════════════════════════════════════ */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Reason Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Offboarding Reasons</CardTitle>
                </CardHeader>
                {reasonBreakdown.length > 0 ? (
                  <TempoDonutChart
                    data={reasonBreakdown}
                    height={240}
                    centerLabel={String(offboardingProcesses.length)}
                    centerSub="Total"
                    showLegend
                  />
                ) : (
                  <p className="text-xs text-t3 text-center py-8">No data available</p>
                )}
              </Card>

              {/* Task Completion by Category */}
              <Card>
                <CardHeader>
                  <CardTitle>Task Completion by Category</CardTitle>
                </CardHeader>
                {taskCompletionByCategory.length > 0 ? (
                  <TempoBarChart
                    data={taskCompletionByCategory}
                    bars={[
                      { dataKey: 'completed', name: 'Completed', color: CHART_COLORS.emerald },
                      { dataKey: 'total', name: 'Total', color: CHART_COLORS.slate },
                    ]}
                    height={240}
                    showLegend
                    layout="horizontal"
                  />
                ) : (
                  <p className="text-xs text-t3 text-center py-8">No data available</p>
                )}
              </Card>

              {/* Monthly Trends */}
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Offboarding Trends</CardTitle>
                </CardHeader>
                {monthlyTrends.length > 0 ? (
                  <TempoBarChart
                    data={monthlyTrends}
                    bars={[{ dataKey: 'count', name: 'Offboardings', color: CHART_COLORS.primary }]}
                    height={240}
                  />
                ) : (
                  <p className="text-xs text-t3 text-center py-8">No data available</p>
                )}
              </Card>

              {/* Exit Survey Themes */}
              <Card>
                <CardHeader>
                  <CardTitle>Exit Survey Ratings</CardTitle>
                </CardHeader>
                {surveyThemes.length > 0 ? (
                  <TempoBarChart
                    data={surveyThemes}
                    bars={[{ dataKey: 'avg', name: 'Average Rating', color: CHART_COLORS.violet }]}
                    height={240}
                    layout="horizontal"
                  />
                ) : (
                  <p className="text-xs text-t3 text-center py-8">No survey data available</p>
                )}
              </Card>
            </div>

            {/* Summary Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Offboarding Summary</CardTitle>
              </CardHeader>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-t1">{offboardingProcesses.length}</p>
                  <p className="text-xs text-t3">Total Processes</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{completedProcessCount}</p>
                  <p className="text-xs text-t3">Completed</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{avgDays}</p>
                  <p className="text-xs text-t3">Avg. Days to Complete</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">{exitSurveys.length}</p>
                  <p className="text-xs text-t3">Exit Surveys</p>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════
          MODAL: New Offboarding Process
      ═══════════════════════════════════════ */}
      <Modal
        open={showNewProcessModal}
        onClose={() => setShowNewProcessModal(false)}
        title="Initiate Offboarding"
        description="Start the offboarding process for a departing employee"
        size="lg"
      >
        <div className="space-y-4">
          <Select
            label="Employee"
            value={processForm.employee_id}
            onChange={(e) => setProcessForm(prev => ({ ...prev, employee_id: e.target.value }))}
            options={[
              { value: '', label: 'Select employee...' },
              ...employees.map(e => ({ value: e.id, label: e.profile?.full_name || 'Unknown' })),
            ]}
          />
          <Select
            label="Reason"
            value={processForm.reason}
            onChange={(e) => setProcessForm(prev => ({ ...prev, reason: e.target.value }))}
            options={[
              { value: 'resignation', label: 'Resignation' },
              { value: 'termination', label: 'Termination' },
              { value: 'layoff', label: 'Layoff' },
              { value: 'retirement', label: 'Retirement' },
              { value: 'end_of_contract', label: 'End of Contract' },
            ]}
          />
          <Input
            label="Last Working Date"
            type="date"
            value={processForm.last_working_date}
            onChange={(e) => setProcessForm(prev => ({ ...prev, last_working_date: e.target.value }))}
          />
          <Select
            label="Checklist Template"
            value={processForm.checklist_id}
            onChange={(e) => setProcessForm(prev => ({ ...prev, checklist_id: e.target.value }))}
            options={[
              { value: '', label: 'Use default checklist' },
              ...offboardingChecklists.map(c => ({ value: c.id, label: c.name })),
            ]}
          />
          <Textarea
            label="Notes"
            value={processForm.notes}
            onChange={(e) => setProcessForm(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Add any notes about this offboarding..."
            rows={3}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setShowNewProcessModal(false)}>Cancel</Button>
            <Button
              onClick={handleNewProcess}
              disabled={!processForm.employee_id || !processForm.last_working_date || saving}
            >
              {saving ? 'Saving...' : 'Initiate Offboarding'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ═══════════════════════════════════════
          MODAL: Create/Edit Checklist
      ═══════════════════════════════════════ */}
      <Modal
        open={showChecklistModal}
        onClose={() => { setShowChecklistModal(false); setEditingChecklistId(null) }}
        title={editingChecklistId ? 'Edit Checklist' : 'New Checklist Template'}
        description="Create a reusable offboarding checklist template"
      >
        <div className="space-y-4">
          <Input
            label="Checklist Name"
            value={checklistForm.name}
            onChange={(e) => setChecklistForm(prev => ({ ...prev, name: e.target.value }))}
            placeholder="e.g., Standard Offboarding"
          />
          <Textarea
            label="Description"
            value={checklistForm.description}
            onChange={(e) => setChecklistForm(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Describe when this checklist should be used..."
            rows={3}
          />
          <label className="flex items-center gap-2 text-xs text-t1 cursor-pointer">
            <input
              type="checkbox"
              checked={checklistForm.is_default}
              onChange={(e) => setChecklistForm(prev => ({ ...prev, is_default: e.target.checked }))}
              className="rounded border-divider text-tempo-600 focus:ring-tempo-600"
            />
            Set as default checklist
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => { setShowChecklistModal(false); setEditingChecklistId(null) }}>Cancel</Button>
            <Button onClick={handleSaveChecklist} disabled={!checklistForm.name || saving}>
              {saving ? 'Saving...' : editingChecklistId ? 'Save Changes' : 'Create Checklist'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ═══════════════════════════════════════
          MODAL: Add Checklist Item
      ═══════════════════════════════════════ */}
      <Modal
        open={showItemModal}
        onClose={() => setShowItemModal(false)}
        title="Add Checklist Item"
        description="Add a new task to the checklist template"
      >
        <div className="space-y-4">
          <Input
            label="Task Title"
            value={itemForm.title}
            onChange={(e) => setItemForm(prev => ({ ...prev, title: e.target.value }))}
            placeholder="e.g., Revoke VPN access"
          />
          <Textarea
            label="Description"
            value={itemForm.description}
            onChange={(e) => setItemForm(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Detailed instructions for this task..."
            rows={2}
          />
          <Select
            label="Category"
            value={itemForm.category}
            onChange={(e) => setItemForm(prev => ({ ...prev, category: e.target.value }))}
            options={Object.entries(CATEGORIES).map(([key, val]) => ({
              value: key,
              label: val.label,
            }))}
          />
          <Input
            label="Assignee Role"
            value={itemForm.assignee_role}
            onChange={(e) => setItemForm(prev => ({ ...prev, assignee_role: e.target.value }))}
            placeholder="e.g., IT, HR, Manager"
          />
          <label className="flex items-center gap-2 text-xs text-t1 cursor-pointer">
            <input
              type="checkbox"
              checked={itemForm.is_required}
              onChange={(e) => setItemForm(prev => ({ ...prev, is_required: e.target.checked }))}
              className="rounded border-divider text-tempo-600 focus:ring-tempo-600"
            />
            Required task
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setShowItemModal(false)}>Cancel</Button>
            <Button onClick={handleSaveItem} disabled={!itemForm.title || saving}>
              {saving ? 'Saving...' : 'Add Item'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ═══════════════════════════════════════
          MODAL: Submit Exit Survey
      ═══════════════════════════════════════ */}
      <Modal
        open={showSurveyModal}
        onClose={() => setShowSurveyModal(false)}
        title="Submit Exit Survey"
        description="Record feedback from a departing employee"
        size="lg"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Select
              label="Employee"
              value={surveyForm.employee_id}
              onChange={(e) => setSurveyForm(prev => ({ ...prev, employee_id: e.target.value }))}
              options={[
                { value: '', label: 'Select employee...' },
                ...employees.map(e => ({ value: e.id, label: e.profile?.full_name || 'Unknown' })),
              ]}
              className="flex-1"
            />
            <label className="flex items-center gap-2 text-xs text-t1 cursor-pointer mt-5">
              <input
                type="checkbox"
                checked={surveyForm.is_anonymous}
                onChange={(e) => setSurveyForm(prev => ({ ...prev, is_anonymous: e.target.checked }))}
                className="rounded border-divider text-tempo-600 focus:ring-tempo-600"
              />
              Anonymous
            </label>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { key: 'overall_satisfaction', label: 'Overall Satisfaction' },
              { key: 'management_rating', label: 'Management' },
              { key: 'work_life_balance', label: 'Work-Life Balance' },
              { key: 'career_growth', label: 'Career Growth' },
              { key: 'compensation_satisfaction', label: 'Compensation' },
              { key: 'team_culture', label: 'Team Culture' },
            ].map(item => (
              <div key={item.key}>
                <label className="text-xs text-t2 block mb-1">{item.label}</label>
                <select
                  value={String((surveyForm as any)[item.key])}
                  onChange={(e) => setSurveyForm(prev => ({ ...prev, [item.key]: Number(e.target.value) }))}
                  className="w-full px-2 py-1.5 text-xs bg-white border border-divider rounded-lg text-t1 focus:outline-none focus:ring-2 focus:ring-tempo-600/20"
                >
                  {[1,2,3,4,5].map(v => (
                    <option key={v} value={v}>{v} / 5</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <Textarea
            label="Reason for Leaving"
            value={surveyForm.reason_for_leaving}
            onChange={(e) => setSurveyForm(prev => ({ ...prev, reason_for_leaving: e.target.value }))}
            placeholder="What is the primary reason for leaving?"
            rows={2}
          />
          <Textarea
            label="What Could Improve"
            value={surveyForm.what_could_improve}
            onChange={(e) => setSurveyForm(prev => ({ ...prev, what_could_improve: e.target.value }))}
            placeholder="What could the company do better?"
            rows={2}
          />
          <Textarea
            label="Best Part of Working Here"
            value={surveyForm.best_part}
            onChange={(e) => setSurveyForm(prev => ({ ...prev, best_part: e.target.value }))}
            placeholder="What did you enjoy most about working here?"
            rows={2}
          />
          <Textarea
            label="Additional Comments"
            value={surveyForm.additional_comments}
            onChange={(e) => setSurveyForm(prev => ({ ...prev, additional_comments: e.target.value }))}
            placeholder="Any other feedback..."
            rows={2}
          />
          <label className="flex items-center gap-2 text-xs text-t1 cursor-pointer">
            <input
              type="checkbox"
              checked={surveyForm.would_recommend}
              onChange={(e) => setSurveyForm(prev => ({ ...prev, would_recommend: e.target.checked }))}
              className="rounded border-divider text-tempo-600 focus:ring-tempo-600"
            />
            Would recommend this company to others
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setShowSurveyModal(false)}>Cancel</Button>
            <Button
              onClick={handleSubmitSurvey}
              disabled={(!surveyForm.employee_id && !surveyForm.is_anonymous) || saving}
            >
              {saving ? 'Submitting...' : 'Submit Survey'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ═══════════════════════════════════════
          MODAL: Confirmation Dialog
      ═══════════════════════════════════════ */}
      <Modal
        open={!!confirmAction?.show}
        onClose={() => setConfirmAction(null)}
        title="Confirm Action"
      >
        <div className="space-y-4">
          <p className="text-sm text-t2">{confirmAction?.label}</p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setConfirmAction(null)}>Cancel</Button>
            <Button onClick={executeConfirmAction} disabled={saving}>
              {saving ? 'Processing...' : 'Confirm'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* T5 #42: Reassignment Blocking Modal */}
      <Modal
        open={showReassignModal}
        onClose={() => setShowReassignModal(false)}
        title="Reassign Direct Reports Before Approval"
        description={`This employee has ${orphanedReports.length} direct report(s) that must be reassigned to a new manager before offboarding can proceed.`}
        size="lg"
      >
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-sm text-amber-800 font-medium">⚠️ Blocking: All direct reports must be reassigned</p>
            <p className="text-xs text-amber-700 mt-1">Approving offboarding without reassigning reports would leave these employees without a manager.</p>
          </div>
          <div className="divide-y divide-divider">
            {orphanedReports.map(report => (
              <div key={report.id} className="py-3 flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-sm font-medium text-t1">{report.profile?.full_name || 'Unknown'}</p>
                  <p className="text-xs text-t3">{report.job_title || report.jobTitle}</p>
                </div>
                <Select
                  label="New Manager"
                  value={reassignments[report.id] || ''}
                  onChange={(e) => setReassignments(prev => ({ ...prev, [report.id]: e.target.value }))}
                  options={[
                    { value: '', label: 'Select manager...' },
                    ...employees
                      .filter(e => e.role === 'manager' || (e.role as string) === 'hrbp' || e.role === 'admin')
                      .filter(e => e.id !== reassignProcessId && !orphanedReports.some(r => r.id === e.id))
                      .map(e => ({ value: e.id, label: e.profile?.full_name || 'Unknown' })),
                  ]}
                  className="w-56"
                />
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setShowReassignModal(false)}>Cancel</Button>
            <Button
              onClick={confirmReassignAndApprove}
              disabled={!orphanedReports.every(r => reassignments[r.id])}
            >
              Reassign & Approve Offboarding
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
