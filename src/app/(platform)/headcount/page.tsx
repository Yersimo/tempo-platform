'use client'

import { useState, useMemo, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Header } from '@/components/layout/header'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/ui/stat-card'
import { Tabs } from '@/components/ui/tabs'
import { Modal } from '@/components/ui/modal'
import { Input, Select, Textarea } from '@/components/ui/input'
import { TempoAreaChart, TempoBarChart, TempoLineChart, TempoDonutChart, TempoGauge, CHART_COLORS, CHART_SERIES } from '@/components/ui/charts'
import {
  UserPlus, Users, DollarSign, TrendingUp, Plus, Pencil, Trash2,
  CheckCircle2, XCircle, Clock, AlertTriangle, Search, Filter,
  BarChart3, Target, Calendar, Briefcase, ArrowRight, MessageSquare,
  ChevronDown, ChevronUp,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { useTempo } from '@/lib/store'
import { PageSkeleton } from '@/components/ui/page-skeleton'
import { AIInsightsCard } from '@/components/ui/ai-insights-card'
import { analyzeHeadcountTrends } from '@/lib/ai-engine'

const STATUS_BADGE: Record<string, { variant: 'default' | 'success' | 'warning' | 'error' | 'info' | 'orange'; label: string }> = {
  planned: { variant: 'info', label: 'Planned' },
  approved: { variant: 'orange', label: 'Approved' },
  open: { variant: 'warning', label: 'Open' },
  filled: { variant: 'success', label: 'Filled' },
  cancelled: { variant: 'error', label: 'Cancelled' },
}

const PRIORITY_BADGE: Record<string, { variant: 'default' | 'success' | 'warning' | 'error' | 'info' | 'orange'; label: string }> = {
  critical: { variant: 'error', label: 'Critical' },
  high: { variant: 'warning', label: 'High' },
  medium: { variant: 'info', label: 'Medium' },
  low: { variant: 'default', label: 'Low' },
}

const TYPE_LABELS: Record<string, string> = {
  new: 'New',
  backfill: 'Backfill',
  conversion: 'Conversion',
}

const BUDGET_CATEGORY_LABELS: Record<string, string> = {
  base_salary: 'Base Salary',
  benefits: 'Benefits',
  equity: 'Equity',
  signing_bonus: 'Signing Bonus',
  relocation: 'Relocation',
  equipment: 'Equipment',
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function fmt(n: number) {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`
  return `$${n.toLocaleString()}`
}

export default function HeadcountPage() {
  const t = useTranslations('headcount')
  const tc = useTranslations('common')
  const {
    headcountPlans, headcountPositions, headcountBudgetItems,
    departments, employees,
    addHeadcountPlan, updateHeadcountPlan,
    addHeadcountPosition, updateHeadcountPosition, deleteHeadcountPosition,
    addHeadcountBudgetItem, updateHeadcountBudgetItem, deleteHeadcountBudgetItem,
    getEmployeeName, getDepartmentName,
    addToast,
    ensureModulesLoaded,
  } = useTempo()

  const [pageLoading, setPageLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [confirmAction, setConfirmAction] = useState<{show:boolean, type:string, id:string, label:string}|null>(null)

  useEffect(() => {
    ensureModulesLoaded?.(['headcountPlans', 'headcountPositions', 'headcountBudgetItems', 'employees', 'departments'])?.then?.(() => setPageLoading(false))?.catch?.(() => setPageLoading(false))
    const t = setTimeout(() => setPageLoading(false), 2000)
    return () => clearTimeout(t)
  }, [ensureModulesLoaded])

  const [activeTab, setActiveTab] = useState('overview')
  const [selectedPlanId, setSelectedPlanId] = useState(headcountPlans.find(p => p.status === 'active')?.id || headcountPlans[0]?.id || '')

  // Filters for positions tab
  const [filterDept, setFilterDept] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterPriority, setFilterPriority] = useState('')
  const [filterType, setFilterType] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // Position modal
  const [showPositionModal, setShowPositionModal] = useState(false)
  const [editingPositionId, setEditingPositionId] = useState<string | null>(null)
  const [posForm, setPosForm] = useState({
    department_id: '',
    job_title: '',
    level: '',
    type: 'new' as string,
    priority: 'medium' as string,
    salary_min: 0,
    salary_max: 0,
    currency: 'USD',
    target_start_date: '',
    justification: '',
  })

  // Approval modal
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve')
  const [approvalPositionId, setApprovalPositionId] = useState('')
  const [approvalComment, setApprovalComment] = useState('')

  // Plan modal
  const [showPlanModal, setShowPlanModal] = useState(false)
  const [planForm, setPlanForm] = useState({
    name: '',
    fiscal_year: new Date().getFullYear().toString(),
    department_id: '',
    total_headcount: 0,
    total_budget: 0,
    status: 'draft' as string,
  })

  // Budget item modal
  const [showBudgetModal, setShowBudgetModal] = useState(false)
  const [budgetPositionId, setBudgetPositionId] = useState('')
  const [editingBudgetItemId, setEditingBudgetItemId] = useState<string | null>(null)
  const [budgetForm, setBudgetForm] = useState({
    category: 'base_salary' as string,
    amount: 0,
    currency: 'USD',
    notes: '',
  })

  // Expanded position detail
  const [expandedPos, setExpandedPos] = useState<string | null>(null)

  // Derived data
  const activePlan = headcountPlans.find(p => p.id === selectedPlanId)
  const planPositions = useMemo(() =>
    headcountPositions.filter(p => p.plan_id === selectedPlanId),
    [headcountPositions, selectedPlanId]
  )

  const activePositions = useMemo(() =>
    planPositions.filter(p => p.status !== 'cancelled'),
    [planPositions]
  )

  const totalPlanned = activePositions.length
  const filledCount = activePositions.filter(p => p.status === 'filled').length
  const openCount = activePositions.filter(p => p.status === 'open').length
  const approvedCount = activePositions.filter(p => p.status === 'approved').length
  const plannedCount = activePositions.filter(p => p.status === 'planned').length

  // Budget calculations
  const totalBudgetAllocated = useMemo(() => {
    const posIds = new Set(activePositions.map(p => p.id))
    return headcountBudgetItems
      .filter(b => posIds.has(b.position_id))
      .reduce((sum, b) => sum + b.amount, 0)
  }, [activePositions, headcountBudgetItems])

  const filledBudget = useMemo(() => {
    const filledPosIds = new Set(activePositions.filter(p => p.status === 'filled').map(p => p.id))
    return headcountBudgetItems
      .filter(b => filledPosIds.has(b.position_id))
      .reduce((sum, b) => sum + b.amount, 0)
  }, [activePositions, headcountBudgetItems])

  const budgetUtilPct = totalBudgetAllocated > 0 ? Math.round((filledBudget / totalBudgetAllocated) * 100) : 0

  // Filtered positions for Positions tab
  const filteredPositions = useMemo(() => {
    let result = planPositions
    if (filterDept) result = result.filter(p => p.department_id === filterDept)
    if (filterStatus) result = result.filter(p => p.status === filterStatus)
    if (filterPriority) result = result.filter(p => p.priority === filterPriority)
    if (filterType) result = result.filter(p => p.type === filterType)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(p => p.job_title.toLowerCase().includes(q) || (p.level || '').toLowerCase().includes(q))
    }
    return result
  }, [planPositions, filterDept, filterStatus, filterPriority, filterType, searchQuery])

  // Department breakdown
  const deptBreakdown = useMemo(() => {
    const map: Record<string, { planned: number; filled: number; open: number; approved: number; budget: number }> = {}
    activePositions.forEach(p => {
      if (!map[p.department_id]) map[p.department_id] = { planned: 0, filled: 0, open: 0, approved: 0, budget: 0 }
      map[p.department_id].planned++
      if (p.status === 'filled') map[p.department_id].filled++
      if (p.status === 'open') map[p.department_id].open++
      if (p.status === 'approved') map[p.department_id].approved++
    })
    headcountBudgetItems.forEach(b => {
      const pos = activePositions.find(p => p.id === b.position_id)
      if (pos && map[pos.department_id]) {
        map[pos.department_id].budget += b.amount
      }
    })
    return Object.entries(map).map(([deptId, data]) => ({
      department: getDepartmentName(deptId),
      departmentId: deptId,
      ...data,
    })).sort((a, b) => b.planned - a.planned)
  }, [activePositions, headcountBudgetItems, getDepartmentName])

  // Budget by category
  const budgetByCategory = useMemo(() => {
    const posIds = new Set(activePositions.map(p => p.id))
    const map: Record<string, number> = {}
    headcountBudgetItems
      .filter(b => posIds.has(b.position_id))
      .forEach(b => {
        map[b.category] = (map[b.category] || 0) + b.amount
      })
    return Object.entries(map).map(([cat, amount]) => ({
      name: BUDGET_CATEGORY_LABELS[cat] || cat,
      value: amount,
    })).sort((a, b) => b.value - a.value)
  }, [activePositions, headcountBudgetItems])

  // AI Insights
  const aiHeadcountInsights = useMemo(() => analyzeHeadcountTrends(
    employees || [],
    departments || [],
  ).insights || [], [employees, departments])

  // Pending approvals (planned positions needing approval)
  const pendingApprovals = useMemo(() =>
    planPositions.filter(p => p.status === 'planned'),
    [planPositions]
  )

  // Approval history (approved + rejected/cancelled with approvedBy set)
  const approvalHistory = useMemo(() =>
    planPositions.filter(p => p.approved_by && (p.status === 'approved' || p.status === 'open' || p.status === 'filled')),
    [planPositions]
  )

  // Monthly planned vs actual data for area chart
  const monthlyData = useMemo(() => {
    return MONTHS.map((month, idx) => {
      const monthNum = idx + 1
      const planned = activePositions.filter(p => {
        if (!p.target_start_date) return false
        const d = new Date(p.target_start_date)
        return d.getMonth() + 1 <= monthNum
      }).length
      const filled = activePositions.filter(p => {
        if (!p.filled_at) return false
        const d = new Date(p.filled_at)
        return d.getMonth() + 1 <= monthNum
      }).length
      return { name: month, planned, filled }
    })
  }, [activePositions])

  // Forecasting data
  const forecastData = useMemo(() => {
    const currentEmployeeCount = employees.length
    let cumulativeCost = filledBudget
    return MONTHS.map((month, idx) => {
      const positionsInMonth = activePositions.filter(p => {
        if (!p.target_start_date) return false
        const d = new Date(p.target_start_date)
        return d.getMonth() === idx && p.status !== 'cancelled' && p.status !== 'filled'
      })
      const monthCost = positionsInMonth.reduce((sum, pos) => {
        const posBudget = headcountBudgetItems
          .filter(b => b.position_id === pos.id && b.category === 'base_salary')
          .reduce((s, b) => s + b.amount, 0)
        return sum + (posBudget / 12) // monthly cost
      }, 0)
      cumulativeCost += monthCost
      const projectedHC = currentEmployeeCount + activePositions.filter(p => {
        if (!p.target_start_date) return false
        const d = new Date(p.target_start_date)
        return d.getMonth() <= idx && p.status !== 'cancelled'
      }).length
      return {
        name: month,
        cost: Math.round(cumulativeCost),
        headcount: projectedHC,
      }
    })
  }, [activePositions, headcountBudgetItems, employees.length, filledBudget])

  // Department growth comparison for forecasting
  const deptGrowthData = useMemo(() => {
    return deptBreakdown.map(d => ({
      name: d.department.length > 12 ? d.department.slice(0, 12) + '...' : d.department,
      current: employees.filter(e => e.department_id === d.departmentId).length,
      planned: d.planned,
      filled: d.filled,
    }))
  }, [deptBreakdown, employees])

  // Budget runway
  const budgetRunway = useMemo(() => {
    const totalBudget = activePlan?.total_budget || 0
    const monthlyBurn = totalBudgetAllocated > 0 ? totalBudgetAllocated / 12 : 0
    const remaining = totalBudget - filledBudget
    const monthsRemaining = monthlyBurn > 0 ? Math.round(remaining / monthlyBurn) : 0
    return { totalBudget, remaining, monthlyBurn, monthsRemaining }
  }, [activePlan, totalBudgetAllocated, filledBudget])

  // Cost per hire
  const costPerHire = useMemo(() => {
    if (filledCount === 0) return 0
    return Math.round(filledBudget / filledCount)
  }, [filledBudget, filledCount])

  // Tab definitions
  const tabs = [
    { id: 'overview', label: t('tabOverview') },
    { id: 'positions', label: t('tabPositions'), count: activePositions.length },
    { id: 'budget', label: t('tabBudget') },
    { id: 'approvals', label: t('tabApprovals'), count: pendingApprovals.length },
    { id: 'forecasting', label: t('tabForecasting') },
  ]

  // ---- Position CRUD ----
  function openNewPosition() {
    setEditingPositionId(null)
    setPosForm({
      department_id: departments[0]?.id || '',
      job_title: '',
      level: '',
      type: 'new',
      priority: 'medium',
      salary_min: 0,
      salary_max: 0,
      currency: 'USD',
      target_start_date: '',
      justification: '',
    })
    setShowPositionModal(true)
  }

  function openEditPosition(id: string) {
    const pos = headcountPositions.find(p => p.id === id)
    if (!pos) return
    setEditingPositionId(id)
    setPosForm({
      department_id: pos.department_id,
      job_title: pos.job_title,
      level: pos.level || '',
      type: pos.type,
      priority: pos.priority,
      salary_min: pos.salary_min || 0,
      salary_max: pos.salary_max || 0,
      currency: pos.currency || 'USD',
      target_start_date: pos.target_start_date || '',
      justification: pos.justification || '',
    })
    setShowPositionModal(true)
  }

  async function submitPosition() {
    if (!posForm.job_title.trim()) { addToast('Job title is required', 'error'); return }
    if (!posForm.department_id) { addToast('Department is required', 'error'); return }
    if (!selectedPlanId) { addToast('No plan selected', 'error'); return }
    setSaving(true)
    try {
      const data = {
        plan_id: selectedPlanId,
        department_id: posForm.department_id,
        job_title: posForm.job_title,
        level: posForm.level || null,
        type: posForm.type,
        priority: posForm.priority,
        salary_min: Number(posForm.salary_min) || 0,
        salary_max: Number(posForm.salary_max) || 0,
        currency: posForm.currency,
        target_start_date: posForm.target_start_date || null,
        justification: posForm.justification || null,
        status: 'planned',
      }
      if (editingPositionId) {
        const { status: _s, ...rest } = data
        updateHeadcountPosition(editingPositionId, rest)
      } else {
        addHeadcountPosition(data)
      }
      setShowPositionModal(false)
      addToast(editingPositionId ? 'Position updated' : 'Position created')
    } finally { setSaving(false) }
  }

  // ---- Approval ----
  function openApproval(posId: string, action: 'approve' | 'reject') {
    setApprovalPositionId(posId)
    setApprovalAction(action)
    setApprovalComment('')
    setShowApprovalModal(true)
  }

  async function submitApproval() {
    if (!approvalPositionId) return
    setSaving(true)
    try {
      if (approvalAction === 'approve') {
        updateHeadcountPosition(approvalPositionId, {
          status: 'approved',
          approved_by: 'emp-17',
        })
        addToast('Position approved')
      } else {
        updateHeadcountPosition(approvalPositionId, {
          status: 'cancelled',
        })
        addToast('Position rejected')
      }
      setShowApprovalModal(false)
    } finally { setSaving(false) }
  }

  // ---- Budget Item ----
  function openAddBudgetItem(posId: string) {
    setBudgetPositionId(posId)
    setBudgetForm({ category: 'base_salary', amount: 0, currency: 'USD', notes: '' })
    setShowBudgetModal(true)
  }

  async function submitBudgetItem() {
    if (!budgetPositionId) { addToast('No position selected', 'error'); return }
    if (!budgetForm.amount || Number(budgetForm.amount) <= 0) { addToast('Amount must be greater than zero', 'error'); return }
    setSaving(true)
    try {
      if (editingBudgetItemId) {
        updateHeadcountBudgetItem(editingBudgetItemId, {
          category: budgetForm.category,
          amount: Number(budgetForm.amount),
          currency: budgetForm.currency,
          notes: budgetForm.notes || null,
        })
      } else {
        addHeadcountBudgetItem({
          position_id: budgetPositionId,
          category: budgetForm.category,
          amount: Number(budgetForm.amount),
          currency: budgetForm.currency,
          notes: budgetForm.notes || null,
        })
      }
      setShowBudgetModal(false)
      setEditingBudgetItemId(null)
      addToast(editingBudgetItemId ? 'Budget item updated' : 'Budget item added')
    } finally { setSaving(false) }
  }

  function openEditBudgetItem(bi: any) {
    setBudgetPositionId(bi.position_id)
    setEditingBudgetItemId(bi.id)
    setBudgetForm({
      category: bi.category,
      amount: bi.amount,
      currency: bi.currency || 'USD',
      notes: bi.notes || '',
    })
    setShowBudgetModal(true)
  }

  // ---- Plan CRUD ----
  function openNewPlan() {
    setPlanForm({
      name: '',
      fiscal_year: new Date().getFullYear().toString(),
      department_id: '',
      total_headcount: 0,
      total_budget: 0,
      status: 'draft',
    })
    setShowPlanModal(true)
  }

  async function submitPlan() {
    if (!planForm.name.trim()) { addToast('Plan name is required', 'error'); return }
    if (!planForm.fiscal_year.trim()) { addToast('Fiscal year is required', 'error'); return }
    setSaving(true)
    try {
      addHeadcountPlan({
        name: planForm.name,
        fiscal_year: planForm.fiscal_year,
        department_id: planForm.department_id || null,
        total_headcount: Number(planForm.total_headcount) || 0,
        total_budget: Number(planForm.total_budget) || 0,
        status: planForm.status,
      })
      setShowPlanModal(false)
      addToast('Plan created')
    } finally { setSaving(false) }
  }

  // ---- Status change ----
  function changeStatus(posId: string, newStatus: string) {
    updateHeadcountPosition(posId, { status: newStatus })
  }

  if (pageLoading) {
    return (
      <>
        <Header
          title={t('title')}
          subtitle={t('subtitle')}
          actions={<Button size="sm" disabled><Plus size={14} /> {t('newPosition')}</Button>}
        />
        <div className="p-6"><PageSkeleton /></div>
      </>
    )
  }

  return (
    <>
      <Header
        title={t('title')}
        subtitle={t('subtitle')}
        actions={
          <div className="flex items-center gap-2">
            <Select
              value={selectedPlanId}
              onChange={e => setSelectedPlanId(e.target.value)}
              options={headcountPlans.map(p => ({ value: p.id, label: `${p.name} (${p.fiscal_year})` }))}
              className="w-56"
            />
            <Button size="sm" variant="secondary" onClick={openNewPlan}>
              <Plus size={14} />
              New Plan
            </Button>
            <Button size="sm" onClick={openNewPosition}>
              <Plus size={14} />
              {t('addPosition')}
            </Button>
          </div>
        }
      />

      {/* Plan Status Banner */}
      {activePlan && (
        <div className="mb-4 flex items-center gap-3 px-4 py-2.5 rounded-lg border border-divider bg-card">
          <Badge variant={activePlan.status === 'active' ? 'success' : activePlan.status === 'approved' ? 'orange' : activePlan.status === 'closed' ? 'info' : 'default'}>
            {activePlan.status.charAt(0).toUpperCase() + activePlan.status.slice(1)}
          </Badge>
          <span className="text-xs text-t2">{activePlan.name}</span>
          <span className="text-xs text-t3 ml-auto">Total Budget: <span className="font-semibold text-t1">{fmt(activePlan.total_budget)}</span></span>
        </div>
      )}

      <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

      {/* AI Insights */}
      <AIInsightsCard
        insights={aiHeadcountInsights}
        title="Headcount AI Insights"
        className="mt-6"
      />

      <div className="mt-6">
        {/* ═══════════════════════════ OVERVIEW TAB ═══════════════════════════ */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label={t('totalPlanned')}
                value={totalPlanned}
                change={`${plannedCount} pending approval`}
                changeType="neutral"
                icon={<Users size={20} />}
              />
              <StatCard
                label={t('filled')}
                value={filledCount}
                change={`${totalPlanned > 0 ? Math.round((filledCount / totalPlanned) * 100) : 0}% fill rate`}
                changeType="positive"
                icon={<CheckCircle2 size={20} />}
              />
              <StatCard
                label={t('openPositions')}
                value={openCount}
                change={`${approvedCount} approved, pending recruitment`}
                changeType="neutral"
                icon={<Briefcase size={20} />}
              />
              <StatCard
                label={t('budgetUtilization')}
                value={`${budgetUtilPct}%`}
                change={`${fmt(filledBudget)} of ${fmt(totalBudgetAllocated)}`}
                changeType={budgetUtilPct > 90 ? 'negative' : budgetUtilPct > 60 ? 'neutral' : 'positive'}
                icon={<DollarSign size={20} />}
              />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>{t('plannedVsActual')}</CardTitle>
                </CardHeader>
                <div className="p-4">
                  <TempoAreaChart
                    data={monthlyData}
                    areas={[
                      { dataKey: 'planned', name: 'Planned', color: CHART_COLORS.blue },
                      { dataKey: 'filled', name: 'Filled', color: CHART_COLORS.emerald },
                    ]}
                    height={260}
                    showLegend
                  />
                </div>
              </Card>

              <Card className="flex flex-col items-center justify-center">
                <CardHeader className="w-full">
                  <CardTitle>{t('budgetUtilization')}</CardTitle>
                </CardHeader>
                <div className="p-4 flex flex-col items-center">
                  <TempoGauge value={budgetUtilPct} max={100} size={160} label="utilized" />
                  <div className="mt-4 space-y-1 text-center">
                    <p className="text-xs text-t3">Allocated: <span className="font-semibold text-t1">{fmt(totalBudgetAllocated)}</span></p>
                    <p className="text-xs text-t3">Spent: <span className="font-semibold text-success">{fmt(filledBudget)}</span></p>
                    <p className="text-xs text-t3">Remaining: <span className="font-semibold text-warning">{fmt(totalBudgetAllocated - filledBudget)}</span></p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Department Breakdown Table */}
            <Card padding="none">
              <CardHeader>
                <CardTitle>{t('departmentBreakdown')}</CardTitle>
              </CardHeader>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-divider bg-canvas">
                      <th className="text-left px-4 py-2.5 font-medium text-t3">{t('department')}</th>
                      <th className="text-center px-4 py-2.5 font-medium text-t3">{t('planned')}</th>
                      <th className="text-center px-4 py-2.5 font-medium text-t3">{t('filled')}</th>
                      <th className="text-center px-4 py-2.5 font-medium text-t3">{t('open')}</th>
                      <th className="text-center px-4 py-2.5 font-medium text-t3">{t('approved')}</th>
                      <th className="text-right px-4 py-2.5 font-medium text-t3">{t('budget')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deptBreakdown.map(d => (
                      <tr key={d.departmentId} className="border-b border-divider last:border-0 hover:bg-canvas/50">
                        <td className="px-4 py-3 font-medium text-t1">{d.department}</td>
                        <td className="text-center px-4 py-3 text-t2">{d.planned}</td>
                        <td className="text-center px-4 py-3">
                          <span className="text-success font-medium">{d.filled}</span>
                        </td>
                        <td className="text-center px-4 py-3">
                          <span className="text-warning font-medium">{d.open}</span>
                        </td>
                        <td className="text-center px-4 py-3 text-t2">{d.approved}</td>
                        <td className="text-right px-4 py-3 font-medium text-t1 tabular-nums">{fmt(d.budget)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* ═══════════════════════════ POSITIONS TAB ═══════════════════════════ */}
        {activeTab === 'positions' && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-t3" />
                <input
                  type="text"
                  placeholder="Search positions..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-divider rounded-lg text-t1 placeholder:text-t3 focus:outline-none focus:ring-2 focus:ring-tempo-600/20 focus:border-tempo-600"
                />
              </div>
              <Select
                value={filterDept}
                onChange={e => setFilterDept(e.target.value)}
                options={[{ value: '', label: t('allDepartments') }, ...departments.map(d => ({ value: d.id, label: d.name }))]}
                className="w-44"
              />
              <Select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                options={[
                  { value: '', label: t('allStatuses') },
                  { value: 'planned', label: 'Planned' },
                  { value: 'approved', label: 'Approved' },
                  { value: 'open', label: 'Open' },
                  { value: 'filled', label: 'Filled' },
                  { value: 'cancelled', label: 'Cancelled' },
                ]}
                className="w-36"
              />
              <Select
                value={filterPriority}
                onChange={e => setFilterPriority(e.target.value)}
                options={[
                  { value: '', label: t('allPriorities') },
                  { value: 'critical', label: 'Critical' },
                  { value: 'high', label: 'High' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'low', label: 'Low' },
                ]}
                className="w-36"
              />
              <Select
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                options={[
                  { value: '', label: t('allTypes') },
                  { value: 'new', label: 'New' },
                  { value: 'backfill', label: 'Backfill' },
                  { value: 'conversion', label: 'Conversion' },
                ]}
                className="w-36"
              />
            </div>

            {/* Positions Table */}
            <Card padding="none">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-divider bg-canvas">
                      <th className="text-left px-4 py-2.5 font-medium text-t3">{t('jobTitle')}</th>
                      <th className="text-left px-4 py-2.5 font-medium text-t3">{t('department')}</th>
                      <th className="text-left px-4 py-2.5 font-medium text-t3">{t('level')}</th>
                      <th className="text-center px-4 py-2.5 font-medium text-t3">{t('type')}</th>
                      <th className="text-center px-4 py-2.5 font-medium text-t3">{t('status')}</th>
                      <th className="text-center px-4 py-2.5 font-medium text-t3">{t('priority')}</th>
                      <th className="text-right px-4 py-2.5 font-medium text-t3">{t('salaryRange')}</th>
                      <th className="text-left px-4 py-2.5 font-medium text-t3">{t('targetStartDate')}</th>
                      <th className="text-center px-4 py-2.5 font-medium text-t3">{tc('actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPositions.length === 0 && (
                      <tr>
                        <td colSpan={9} className="text-center px-4 py-8 text-t3">{t('noPositions')}</td>
                      </tr>
                    )}
                    {filteredPositions.map(pos => {
                      const sBadge = STATUS_BADGE[pos.status] || STATUS_BADGE.planned
                      const pBadge = PRIORITY_BADGE[pos.priority] || PRIORITY_BADGE.medium
                      const isExpanded = expandedPos === pos.id
                      const posBudgetItems = headcountBudgetItems.filter(b => b.position_id === pos.id)
                      const posBudgetTotal = posBudgetItems.reduce((s, b) => s + b.amount, 0)

                      return (
                        <tr key={pos.id} className="border-b border-divider last:border-0">
                          <td className="px-4 py-3">
                            <button
                              className="text-left hover:text-tempo-600 transition-colors"
                              onClick={() => setExpandedPos(isExpanded ? null : pos.id)}
                            >
                              <span className="font-medium text-t1 flex items-center gap-1">
                                {pos.job_title}
                                {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                              </span>
                            </button>
                            {isExpanded && (
                              <div className="mt-2 space-y-2 bg-canvas rounded-lg p-3 border border-divider">
                                {pos.justification && (
                                  <div>
                                    <span className="text-[10px] font-medium text-t3 uppercase tracking-wider">{t('justification')}</span>
                                    <p className="text-xs text-t2 mt-0.5">{pos.justification}</p>
                                  </div>
                                )}
                                {pos.filled_by && (
                                  <div>
                                    <span className="text-[10px] font-medium text-t3 uppercase tracking-wider">Filled By</span>
                                    <p className="text-xs text-t1 mt-0.5">{getEmployeeName(pos.filled_by)}</p>
                                  </div>
                                )}
                                {pos.approved_by && (
                                  <div>
                                    <span className="text-[10px] font-medium text-t3 uppercase tracking-wider">{t('approvedBy')}</span>
                                    <p className="text-xs text-t1 mt-0.5">{getEmployeeName(pos.approved_by)}</p>
                                  </div>
                                )}
                                {/* Budget items for this position */}
                                <div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-medium text-t3 uppercase tracking-wider">{t('budget')} ({fmt(posBudgetTotal)})</span>
                                    <button
                                      onClick={() => openAddBudgetItem(pos.id)}
                                      className="text-[10px] text-tempo-600 hover:underline"
                                    >+ Add Item</button>
                                  </div>
                                  {posBudgetItems.length > 0 && (
                                    <div className="mt-1 space-y-0.5">
                                      {posBudgetItems.map(bi => (
                                        <div key={bi.id} className="flex items-center justify-between text-xs group">
                                          <span className="text-t2">{BUDGET_CATEGORY_LABELS[bi.category] || bi.category}</span>
                                          <div className="flex items-center gap-2">
                                            <span className="text-t1 tabular-nums">{fmt(bi.amount)}</span>
                                            <button
                                              onClick={() => openEditBudgetItem(bi)}
                                              className="p-0.5 text-t3 hover:text-t1 opacity-0 group-hover:opacity-100 transition-opacity"
                                              title="Edit"
                                            >
                                              <Pencil size={10} />
                                            </button>
                                            <button
                                              onClick={() => setConfirmAction({ show: true, type: 'delete_budget_item', id: bi.id, label: BUDGET_CATEGORY_LABELS[bi.category] || bi.category })}
                                              className="p-0.5 text-t3 hover:text-error opacity-0 group-hover:opacity-100 transition-opacity"
                                              title="Delete"
                                            >
                                              <Trash2 size={10} />
                                            </button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-t2">{getDepartmentName(pos.department_id)}</td>
                          <td className="px-4 py-3 text-t2">{pos.level || '-'}</td>
                          <td className="text-center px-4 py-3">
                            <Badge variant="default">{TYPE_LABELS[pos.type] || pos.type}</Badge>
                          </td>
                          <td className="text-center px-4 py-3">
                            <Badge variant={sBadge.variant}>{sBadge.label}</Badge>
                          </td>
                          <td className="text-center px-4 py-3">
                            <Badge variant={pBadge.variant}>{pBadge.label}</Badge>
                          </td>
                          <td className="text-right px-4 py-3 text-t2 tabular-nums">
                            {pos.salary_min && pos.salary_max
                              ? `${fmt(pos.salary_min)} - ${fmt(pos.salary_max)}`
                              : '-'
                            }
                          </td>
                          <td className="px-4 py-3 text-t2">
                            {pos.target_start_date || '-'}
                          </td>
                          <td className="text-center px-4 py-3">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => openEditPosition(pos.id)}
                                className="p-1 text-t3 hover:text-t1 transition-colors"
                                title="Edit"
                              >
                                <Pencil size={13} />
                              </button>
                              {pos.status === 'planned' && (
                                <button
                                  onClick={() => openApproval(pos.id, 'approve')}
                                  className="p-1 text-t3 hover:text-success transition-colors"
                                  title="Approve"
                                >
                                  <CheckCircle2 size={13} />
                                </button>
                              )}
                              {pos.status === 'approved' && (
                                <button
                                  onClick={() => changeStatus(pos.id, 'open')}
                                  className="p-1 text-t3 hover:text-tempo-600 transition-colors"
                                  title="Open for recruiting"
                                >
                                  <ArrowRight size={13} />
                                </button>
                              )}
                              {(pos.status === 'planned' || pos.status === 'cancelled') && (
                                <button
                                  onClick={() => setConfirmAction({ show: true, type: 'delete_position', id: pos.id, label: pos.job_title })}
                                  className="p-1 text-t3 hover:text-error transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* ═══════════════════════════ BUDGET TAB ═══════════════════════════ */}
        {activeTab === 'budget' && (
          <div className="space-y-6">
            {/* Budget Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label={t('totalBudget')}
                value={fmt(activePlan?.total_budget || 0)}
                icon={<DollarSign size={20} />}
              />
              <StatCard
                label={t('allocated')}
                value={fmt(totalBudgetAllocated)}
                change={`${totalBudgetAllocated > 0 ? Math.round((totalBudgetAllocated / (activePlan?.total_budget || 1)) * 100) : 0}% of total`}
                changeType="neutral"
                icon={<Target size={20} />}
              />
              <StatCard
                label={t('spent')}
                value={fmt(filledBudget)}
                change={`On filled positions`}
                changeType="positive"
                icon={<CheckCircle2 size={20} />}
              />
              <StatCard
                label={t('costPerHire')}
                value={fmt(costPerHire)}
                change={`${filledCount} positions filled`}
                changeType="neutral"
                icon={<UserPlus size={20} />}
              />
            </div>

            {/* Budget by Category + Dept Allocation */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>{t('budgetByCategory')}</CardTitle>
                </CardHeader>
                <div className="p-4">
                  {budgetByCategory.length > 0 ? (
                    <TempoDonutChart
                      data={budgetByCategory}
                      centerLabel={fmt(totalBudgetAllocated)}
                      centerSub="Total"
                      height={280}
                      formatter={(v: number) => fmt(v)}
                    />
                  ) : (
                    <p className="text-xs text-t3 text-center py-8">No budget items</p>
                  )}
                  {/* Legend */}
                  <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 mt-3">
                    {budgetByCategory.map((item, i) => (
                      <div key={item.name} className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ background: CHART_SERIES[i % CHART_SERIES.length] }} />
                        <span className="text-[10px] text-t3">{item.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('budgetByCategory')}</CardTitle>
                </CardHeader>
                <div className="p-4">
                  <TempoBarChart
                    data={budgetByCategory.map(c => ({
                      name: c.name.length > 10 ? c.name.slice(0, 10) + '...' : c.name,
                      amount: c.value,
                    }))}
                    bars={[{ dataKey: 'amount', name: 'Amount', color: CHART_COLORS.primary }]}
                    height={280}
                    formatter={fmt}
                  />
                </div>
              </Card>
            </div>

            {/* Department Budget Allocation Table */}
            <Card padding="none">
              <CardHeader>
                <CardTitle>{t('deptBudgetAllocation')}</CardTitle>
              </CardHeader>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-divider bg-canvas">
                      <th className="text-left px-4 py-2.5 font-medium text-t3">{t('department')}</th>
                      <th className="text-center px-4 py-2.5 font-medium text-t3">Positions</th>
                      <th className="text-right px-4 py-2.5 font-medium text-t3">{t('allocated')}</th>
                      <th className="text-right px-4 py-2.5 font-medium text-t3">{t('spent')}</th>
                      <th className="text-right px-4 py-2.5 font-medium text-t3">{t('remaining')}</th>
                      <th className="text-center px-4 py-2.5 font-medium text-t3">{t('status')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deptBreakdown.map(d => {
                      const deptFilledPosIds = new Set(
                        activePositions
                          .filter(p => p.department_id === d.departmentId && p.status === 'filled')
                          .map(p => p.id)
                      )
                      const deptSpent = headcountBudgetItems
                        .filter(b => deptFilledPosIds.has(b.position_id))
                        .reduce((s, b) => s + b.amount, 0)
                      const remaining = d.budget - deptSpent
                      const isOver = remaining < 0

                      return (
                        <tr key={d.departmentId} className="border-b border-divider last:border-0 hover:bg-canvas/50">
                          <td className="px-4 py-3 font-medium text-t1">{d.department}</td>
                          <td className="text-center px-4 py-3 text-t2">{d.planned}</td>
                          <td className="text-right px-4 py-3 text-t1 tabular-nums">{fmt(d.budget)}</td>
                          <td className="text-right px-4 py-3 text-t2 tabular-nums">{fmt(deptSpent)}</td>
                          <td className={cn(
                            "text-right px-4 py-3 tabular-nums font-medium",
                            isOver ? 'text-error' : 'text-success'
                          )}>
                            {isOver ? '-' : ''}{fmt(Math.abs(remaining))}
                          </td>
                          <td className="text-center px-4 py-3">
                            <Badge variant={isOver ? 'error' : deptSpent > 0 ? 'success' : 'default'}>
                              {isOver ? t('overBudget') : deptSpent > 0 ? t('onBudget') : t('underBudget')}
                            </Badge>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* ═══════════════════════════ APPROVALS TAB ═══════════════════════════ */}
        {activeTab === 'approvals' && (
          <div className="space-y-6">
            {/* Pending Approvals */}
            <Card padding="none">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{t('pendingApprovals')}</CardTitle>
                  <Badge variant="warning">{pendingApprovals.length} pending</Badge>
                </div>
              </CardHeader>
              {pendingApprovals.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <CheckCircle2 size={32} className="mx-auto text-success opacity-50 mb-2" />
                  <p className="text-xs text-t3">{t('noPendingApprovals')}</p>
                </div>
              ) : (
                <div className="divide-y divide-divider">
                  {pendingApprovals.map(pos => (
                    <div key={pos.id} className="px-6 py-4 hover:bg-canvas/50">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-t1">{pos.job_title}</p>
                          <p className="text-xs text-t3 mt-0.5">
                            {getDepartmentName(pos.department_id)} &middot; {pos.level || 'Level TBD'} &middot; {TYPE_LABELS[pos.type]}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <Badge variant={PRIORITY_BADGE[pos.priority]?.variant || 'default'}>
                              {PRIORITY_BADGE[pos.priority]?.label || pos.priority}
                            </Badge>
                            <span className="text-xs text-t3">
                              {pos.salary_min && pos.salary_max ? `${fmt(pos.salary_min)} - ${fmt(pos.salary_max)}` : 'Salary TBD'}
                            </span>
                            {pos.target_start_date && (
                              <span className="text-xs text-t3 flex items-center gap-1">
                                <Calendar size={10} />
                                {pos.target_start_date}
                              </span>
                            )}
                          </div>
                          {pos.justification && (
                            <p className="text-xs text-t2 mt-2 bg-canvas rounded px-2 py-1.5 border border-divider">
                              {pos.justification}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 ml-4 shrink-0">
                          <Button size="sm" onClick={() => openApproval(pos.id, 'approve')}>
                            <CheckCircle2 size={13} />
                            {t('approve')}
                          </Button>
                          <Button size="sm" variant="danger" onClick={() => openApproval(pos.id, 'reject')}>
                            <XCircle size={13} />
                            {t('reject')}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Approval History */}
            <Card padding="none">
              <CardHeader>
                <CardTitle>{t('approvalHistory')}</CardTitle>
              </CardHeader>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-divider bg-canvas">
                      <th className="text-left px-4 py-2.5 font-medium text-t3">{t('jobTitle')}</th>
                      <th className="text-left px-4 py-2.5 font-medium text-t3">{t('department')}</th>
                      <th className="text-center px-4 py-2.5 font-medium text-t3">{t('status')}</th>
                      <th className="text-left px-4 py-2.5 font-medium text-t3">{t('approvedBy')}</th>
                      <th className="text-left px-4 py-2.5 font-medium text-t3">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {approvalHistory.map(pos => (
                      <tr key={pos.id} className="border-b border-divider last:border-0 hover:bg-canvas/50">
                        <td className="px-4 py-3 font-medium text-t1">{pos.job_title}</td>
                        <td className="px-4 py-3 text-t2">{getDepartmentName(pos.department_id)}</td>
                        <td className="text-center px-4 py-3">
                          <Badge variant={STATUS_BADGE[pos.status]?.variant || 'default'}>
                            {STATUS_BADGE[pos.status]?.label || pos.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-t2">{pos.approved_by ? getEmployeeName(pos.approved_by) : '-'}</td>
                        <td className="px-4 py-3 text-t3">{pos.updated_at ? new Date(pos.updated_at).toLocaleDateString() : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* ═══════════════════════════ FORECASTING TAB ═══════════════════════════ */}
        {activeTab === 'forecasting' && (
          <div className="space-y-6">
            {/* Labor Cost Projection */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>{t('laborCostProjection')}</CardTitle>
                </CardHeader>
                <div className="p-4">
                  <TempoLineChart
                    data={forecastData}
                    lines={[
                      { dataKey: 'cost', name: 'Projected Cost', color: CHART_COLORS.primary, strokeWidth: 2 },
                    ]}
                    height={280}
                    formatter={fmt}
                    showLegend
                  />
                </div>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('headcountGrowthProjection')}</CardTitle>
                </CardHeader>
                <div className="p-4">
                  <TempoAreaChart
                    data={forecastData}
                    areas={[
                      { dataKey: 'headcount', name: 'Projected Headcount', color: CHART_COLORS.blue },
                    ]}
                    height={280}
                    showLegend
                  />
                </div>
              </Card>
            </div>

            {/* Department Growth + Budget Runway */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>{t('departmentGrowth')}</CardTitle>
                </CardHeader>
                <div className="p-4">
                  <TempoBarChart
                    data={deptGrowthData}
                    bars={[
                      { dataKey: 'current', name: 'Current', color: CHART_COLORS.slate },
                      { dataKey: 'filled', name: 'Filled', color: CHART_COLORS.emerald },
                      { dataKey: 'planned', name: 'Planned', color: CHART_COLORS.blue },
                    ]}
                    height={280}
                    showLegend
                  />
                </div>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('budgetRunway')}</CardTitle>
                </CardHeader>
                <div className="p-4 flex flex-col items-center justify-center h-full">
                  <TempoGauge
                    value={budgetRunway.monthsRemaining}
                    max={12}
                    size={160}
                    label={t('monthsRemaining')}
                  />
                  <div className="mt-6 w-full space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-t3">{t('totalBudget')}</span>
                      <span className="text-xs font-semibold text-t1 tabular-nums">{fmt(budgetRunway.totalBudget)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-t3">{t('remaining')}</span>
                      <span className="text-xs font-semibold text-success tabular-nums">{fmt(budgetRunway.remaining)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-t3">Monthly Burn</span>
                      <span className="text-xs font-semibold text-warning tabular-nums">{fmt(budgetRunway.monthlyBurn)}</span>
                    </div>
                    <div className="h-px bg-divider" />
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-t3">{t('currentHeadcount')}</span>
                      <span className="text-xs font-semibold text-t1">{employees.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-t3">Planned Growth</span>
                      <span className="text-xs font-semibold text-t1">+{activePositions.filter(p => p.status !== 'filled' && p.status !== 'cancelled').length}</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════ MODALS ═══════════════════ */}

      {/* Position Modal */}
      <Modal
        open={showPositionModal}
        onClose={() => setShowPositionModal(false)}
        title={editingPositionId ? t('editPosition') : t('addPosition')}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t('jobTitle')}
              value={posForm.job_title}
              onChange={e => setPosForm(f => ({ ...f, job_title: e.target.value }))}
              placeholder="e.g. Senior Software Engineer"
            />
            <Select
              label={t('department')}
              value={posForm.department_id}
              onChange={e => setPosForm(f => ({ ...f, department_id: e.target.value }))}
              options={departments.map(d => ({ value: d.id, label: d.name }))}
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Input
              label={t('level')}
              value={posForm.level}
              onChange={e => setPosForm(f => ({ ...f, level: e.target.value }))}
              placeholder="e.g. Senior, Manager"
            />
            <Select
              label={t('type')}
              value={posForm.type}
              onChange={e => setPosForm(f => ({ ...f, type: e.target.value }))}
              options={[
                { value: 'new', label: t('new') },
                { value: 'backfill', label: t('backfill') },
                { value: 'conversion', label: t('conversion') },
              ]}
            />
            <Select
              label={t('priority')}
              value={posForm.priority}
              onChange={e => setPosForm(f => ({ ...f, priority: e.target.value }))}
              options={[
                { value: 'critical', label: t('critical') },
                { value: 'high', label: t('high') },
                { value: 'medium', label: t('medium') },
                { value: 'low', label: t('low') },
              ]}
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Salary Min"
              type="number"
              value={posForm.salary_min || ''}
              onChange={e => setPosForm(f => ({ ...f, salary_min: Number(e.target.value) }))}
            />
            <Input
              label="Salary Max"
              type="number"
              value={posForm.salary_max || ''}
              onChange={e => setPosForm(f => ({ ...f, salary_max: Number(e.target.value) }))}
            />
            <Input
              label={t('targetStartDate')}
              type="date"
              value={posForm.target_start_date}
              onChange={e => setPosForm(f => ({ ...f, target_start_date: e.target.value }))}
            />
          </div>
          <Textarea
            label={t('justification')}
            value={posForm.justification}
            onChange={e => setPosForm(f => ({ ...f, justification: e.target.value }))}
            placeholder="Explain why this position is needed..."
            rows={3}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowPositionModal(false)} disabled={saving}>{tc('cancel')}</Button>
            <Button onClick={submitPosition} disabled={saving}>{saving ? 'Saving...' : editingPositionId ? tc('save') : t('addPosition')}</Button>
          </div>
        </div>
      </Modal>

      {/* Approval Modal */}
      <Modal
        open={showApprovalModal}
        onClose={() => setShowApprovalModal(false)}
        title={approvalAction === 'approve' ? 'Approve Position' : 'Reject Position'}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-t2">
            {approvalAction === 'approve'
              ? 'Are you sure you want to approve this position? It will move to "Approved" status.'
              : 'Are you sure you want to reject this position? It will be cancelled.'
            }
          </p>
          <Textarea
            label={t('addComment')}
            value={approvalComment}
            onChange={e => setApprovalComment(e.target.value)}
            placeholder="Optional comment..."
            rows={3}
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowApprovalModal(false)} disabled={saving}>{tc('cancel')}</Button>
            <Button
              variant={approvalAction === 'approve' ? 'primary' : 'danger'}
              onClick={submitApproval}
              disabled={saving}
            >
              {saving ? 'Saving...' : approvalAction === 'approve' ? t('approve') : t('reject')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Budget Item Modal */}
      <Modal
        open={showBudgetModal}
        onClose={() => { setShowBudgetModal(false); setEditingBudgetItemId(null) }}
        title={editingBudgetItemId ? 'Edit Budget Item' : 'Add Budget Item'}
        size="sm"
      >
        <div className="space-y-4">
          <Select
            label="Category"
            value={budgetForm.category}
            onChange={e => setBudgetForm(f => ({ ...f, category: e.target.value }))}
            options={[
              { value: 'base_salary', label: t('baseSalary') },
              { value: 'benefits', label: t('benefits') },
              { value: 'equity', label: t('equity') },
              { value: 'signing_bonus', label: t('signingBonus') },
              { value: 'relocation', label: t('relocation') },
              { value: 'equipment', label: t('equipment') },
            ]}
          />
          <Input
            label="Amount"
            type="number"
            value={budgetForm.amount || ''}
            onChange={e => setBudgetForm(f => ({ ...f, amount: Number(e.target.value) }))}
          />
          <Input
            label="Notes"
            value={budgetForm.notes}
            onChange={e => setBudgetForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="Optional notes..."
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => { setShowBudgetModal(false); setEditingBudgetItemId(null) }} disabled={saving}>{tc('cancel')}</Button>
            <Button onClick={submitBudgetItem} disabled={saving}>{saving ? 'Saving...' : editingBudgetItemId ? tc('save') : 'Add Item'}</Button>
          </div>
        </div>
      </Modal>

      {/* New Plan Modal */}
      <Modal
        open={showPlanModal}
        onClose={() => setShowPlanModal(false)}
        title="New Headcount Plan"
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Plan Name"
            value={planForm.name}
            onChange={e => setPlanForm(f => ({ ...f, name: e.target.value }))}
            placeholder="e.g. FY2026 Engineering Growth Plan"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Fiscal Year"
              value={planForm.fiscal_year}
              onChange={e => setPlanForm(f => ({ ...f, fiscal_year: e.target.value }))}
              placeholder="e.g. 2026"
            />
            <Select
              label={t('department')}
              value={planForm.department_id}
              onChange={e => setPlanForm(f => ({ ...f, department_id: e.target.value }))}
              options={[{ value: '', label: 'All Departments' }, ...departments.map(d => ({ value: d.id, label: d.name }))]}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Total Headcount"
              type="number"
              value={planForm.total_headcount || ''}
              onChange={e => setPlanForm(f => ({ ...f, total_headcount: Number(e.target.value) }))}
              placeholder="e.g. 25"
            />
            <Input
              label="Total Budget ($)"
              type="number"
              value={planForm.total_budget || ''}
              onChange={e => setPlanForm(f => ({ ...f, total_budget: Number(e.target.value) }))}
              placeholder="e.g. 2500000"
            />
          </div>
          <Select
            label={t('status')}
            value={planForm.status}
            onChange={e => setPlanForm(f => ({ ...f, status: e.target.value }))}
            options={[
              { value: 'draft', label: 'Draft' },
              { value: 'active', label: 'Active' },
              { value: 'approved', label: 'Approved' },
              { value: 'closed', label: 'Closed' },
            ]}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowPlanModal(false)} disabled={saving}>{tc('cancel')}</Button>
            <Button onClick={submitPlan} disabled={saving || !planForm.name || !planForm.fiscal_year}>{saving ? 'Saving...' : 'Create Plan'}</Button>
          </div>
        </div>
      </Modal>

      {/* Confirmation Modal */}
      <Modal
        open={!!confirmAction?.show}
        onClose={() => setConfirmAction(null)}
        title="Confirm Action"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-t2">
            Are you sure you want to delete <span className="font-semibold text-t1">{confirmAction?.label}</span>? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setConfirmAction(null)}>Cancel</Button>
            <Button variant="danger" disabled={saving} onClick={() => {
              if (!confirmAction) return
              setSaving(true)
              try {
                if (confirmAction.type === 'delete_position') {
                  deleteHeadcountPosition(confirmAction.id)
                  addToast('Position deleted')
                } else if (confirmAction.type === 'delete_budget_item') {
                  deleteHeadcountBudgetItem(confirmAction.id)
                  addToast('Budget item deleted')
                }
              } finally {
                setSaving(false)
                setConfirmAction(null)
              }
            }}>
              {saving ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
