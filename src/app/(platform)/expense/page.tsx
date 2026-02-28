'use client'

import { useState, useMemo, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { Header } from '@/components/layout/header'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/ui/stat-card'
import { Modal } from '@/components/ui/modal'
import { Input, Select, Textarea } from '@/components/ui/input'
import { TempoBarChart, TempoDonutChart, TempoSparkArea, CHART_COLORS, CHART_SERIES } from '@/components/ui/charts'
import { Progress } from '@/components/ui/progress'
import { Receipt, Plus, DollarSign, Clock, Trash2, ChevronDown, ChevronUp, BarChart3, Shield, MapPin, Wallet, FileText, Upload, Image, Search, AlertTriangle, CheckCircle, CheckCircle2, Car, Globe, Calculator, Sparkles, Users } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { useTempo } from '@/lib/store'
import { AIInsightCard, AIAlertBanner, AIScoreBadge, AIRecommendationList, AIPulse } from '@/components/ai'
import { checkPolicyCompliance, calculateFraudRiskScore, analyzeSpendingTrends, analyzeExpenseByCategory, detectPolicyViolations, forecastMonthlySpending } from '@/lib/ai-engine'

// Per diem rates (static reference data)
const perDiemRates = [
  { country: 'Nigeria', city: 'Lagos', daily: 285, meals: 95, lodging: 160, incidentals: 30 },
  { country: 'Nigeria', city: 'Abuja', daily: 250, meals: 80, lodging: 145, incidentals: 25 },
  { country: 'Ghana', city: 'Accra', daily: 240, meals: 75, lodging: 140, incidentals: 25 },
  { country: 'Kenya', city: 'Nairobi', daily: 310, meals: 100, lodging: 180, incidentals: 30 },
  { country: 'Senegal', city: 'Dakar', daily: 260, meals: 85, lodging: 150, incidentals: 25 },
  { country: "Cote d'Ivoire", city: 'Abidjan', daily: 270, meals: 90, lodging: 155, incidentals: 25 },
  { country: 'South Africa', city: 'Johannesburg', daily: 295, meals: 95, lodging: 170, incidentals: 30 },
  { country: 'United States', city: 'New York', daily: 425, meals: 130, lodging: 260, incidentals: 35 },
  { country: 'United Kingdom', city: 'London', daily: 410, meals: 120, lodging: 255, incidentals: 35 },
  { country: 'France', city: 'Paris', daily: 380, meals: 115, lodging: 235, incidentals: 30 },
]

// Simulated receipt data
const demoReceipts = [
  { id: 'rcpt-1', filename: 'flight_abidjan.pdf', category: 'Travel', amount: 450, date: '2026-02-08', status: 'matched' as const, expense_id: 'exp-1', ai_category: 'Travel' },
  { id: 'rcpt-2', filename: 'hotel_invoice.pdf', category: 'Accommodation', amount: 520, date: '2026-02-09', status: 'matched' as const, expense_id: 'exp-1', ai_category: 'Accommodation' },
  { id: 'rcpt-3', filename: 'dinner_receipt.jpg', category: 'Meals', amount: 280, date: '2026-02-10', status: 'matched' as const, expense_id: 'exp-1', ai_category: 'Meals' },
  { id: 'rcpt-4', filename: 'booth_rental.pdf', category: 'Events', amount: 500, date: '2026-02-16', status: 'matched' as const, expense_id: 'exp-2', ai_category: 'Events' },
  { id: 'rcpt-5', filename: 'taxi_receipt.png', category: 'Transport', amount: 45, date: '2026-02-20', status: 'unmatched' as const, expense_id: null, ai_category: 'Transport' },
  { id: 'rcpt-6', filename: 'supplies_order.pdf', category: 'Supplies', amount: 182, date: '2026-02-21', status: 'pending' as const, expense_id: null, ai_category: 'Supplies' },
]

export default function ExpensePage() {
  const t = useTranslations('expense')
  const tc = useTranslations('common')
  const {
    expenseReports, employees, departments, budgets,
    addExpenseReport, updateExpenseReport, deleteExpenseReport,
    getEmployeeName, getDepartmentName, currentEmployeeId,
    expensePolicies, addExpensePolicy, updateExpensePolicy,
    mileageLogs, addMileageLog, updateMileageLog,
    addToast,
  } = useTempo()

  // ---- Tab State ----
  const tabs = [
    { id: 'reports', label: t('reports'), icon: FileText },
    { id: 'analytics', label: t('analytics'), icon: BarChart3 },
    { id: 'policy-rules', label: t('policyRules'), icon: Shield },
    { id: 'per-diem-mileage', label: t('perDiemMileage'), icon: Car },
    { id: 'budgets', label: t('budgets'), icon: Wallet },
    { id: 'receipts', label: t('receipts'), icon: Receipt },
  ]
  const [activeTab, setActiveTab] = useState('reports')

  // ---- Modals ----
  const [showReportModal, setShowReportModal] = useState(false)
  const [showPolicyModal, setShowPolicyModal] = useState(false)
  const [editingPolicyId, setEditingPolicyId] = useState<string | null>(null)
  const [showMileageModal, setShowMileageModal] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  // Bulk expense approval state
  const [showBulkExpenseModal, setShowBulkExpenseModal] = useState(false)
  const [bulkExpSelectMode, setBulkExpSelectMode] = useState<'all_pending' | 'department' | 'amount' | 'individual'>('all_pending')
  const [bulkExpSelectedIds, setBulkExpSelectedIds] = useState<Set<string>>(new Set())
  const [bulkExpSelectedDepts, setBulkExpSelectedDepts] = useState<Set<string>>(new Set())
  const [bulkExpMaxAmount, setBulkExpMaxAmount] = useState(5000)
  const [bulkExpAction, setBulkExpAction] = useState<'approve' | 'reject'>('approve')

  // ---- Expand / Search ----
  const [expandedReport, setExpandedReport] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  // ---- Forms ----
  const [reportForm, setReportForm] = useState({
    employee_id: '', title: '', currency: 'USD',
    items: [{ description: '', category: 'travel', amount: 0 }] as Array<{ description: string; category: string; amount: number }>,
  })
  const [policyForm, setPolicyForm] = useState({ category: '', daily_limit: 0, receipt_threshold: 0, auto_approve_limit: 0, status: 'active' })
  const [mileageForm, setMileageForm] = useState({ employee_id: '', date: '', origin: '', destination: '', distance_km: 0, rate_per_km: 0.58 })

  // ---- Policy Document Upload ----
  const policyFileInputRef = useRef<HTMLInputElement>(null)
  const [isPolicyDragging, setIsPolicyDragging] = useState(false)
  const [policyDocument, setPolicyDocument] = useState<{
    filename: string; uploadDate: string; pageCount: number; fileSize: string
    status: 'idle' | 'uploading' | 'parsing' | 'complete'
  } | null>(null)
  const [parsingProgress, setParsingProgress] = useState(0)
  const [parsingStage, setParsingStage] = useState('')
  const [extractedRules, setExtractedRules] = useState<Array<{
    id: string; category: string; daily_limit: number; receipt_threshold: number
    auto_approve_limit: number; policy_section: string; policy_citation: string
    source: 'document' | 'manual'; status: string
  }>>([])
  const [showParsedRulesPreview, setShowParsedRulesPreview] = useState(false)
  const [policySummary, setPolicySummary] = useState<{
    documentTitle: string; effectiveDate: string; keyHighlights: string[]; totalRulesExtracted: number
  } | null>(null)

  // ---- Receipt Upload ----
  const [receiptFile, setReceiptFile] = useState<string | null>(null)
  const receiptInputRef = useRef<HTMLInputElement>(null)

  // ---- Per Diem Calculator ----
  const [perDiemCountry, setPerDiemCountry] = useState('Nigeria')
  const [perDiemStart, setPerDiemStart] = useState('')
  const [perDiemEnd, setPerDiemEnd] = useState('')

  const perDiemResult = useMemo(() => {
    if (!perDiemStart || !perDiemEnd) return null
    const start = new Date(perDiemStart)
    const end = new Date(perDiemEnd)
    const nights = Math.max(0, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)))
    const rate = perDiemRates.find(r => r.country === perDiemCountry)
    if (!rate) return null
    return { nights, daily: rate.daily, total: nights * rate.daily, meals: nights * rate.meals, lodging: nights * rate.lodging }
  }, [perDiemCountry, perDiemStart, perDiemEnd])

  // ---- Computed Data ----
  const totalSpend = expenseReports.reduce((a, e) => a + e.total_amount, 0)
  const pendingReports = expenseReports.filter(e => e.status === 'submitted' || e.status === 'pending_approval')
  const totalPending = pendingReports.reduce((a, e) => a + e.total_amount, 0)
  const reimbursedTotal = expenseReports.filter(e => e.status === 'reimbursed').reduce((a, e) => a + e.total_amount, 0)
  const avgReportValue = expenseReports.length > 0 ? Math.round(totalSpend / expenseReports.length) : 0

  // Filtered reports
  const filteredReports = useMemo(() => {
    let reports = [...expenseReports]
    if (searchQuery) reports = reports.filter(r => r.title.toLowerCase().includes(searchQuery.toLowerCase()) || getEmployeeName(r.employee_id).toLowerCase().includes(searchQuery.toLowerCase()))
    if (filterStatus) reports = reports.filter(r => r.status === filterStatus)
    return reports
  }, [expenseReports, searchQuery, filterStatus, getEmployeeName])

  // AI Data
  const spendingInsights = useMemo(() => analyzeSpendingTrends(expenseReports), [expenseReports])
  const categoryAnalysis = useMemo(() => analyzeExpenseByCategory(expenseReports), [expenseReports])
  const categoryData = categoryAnalysis.categoryBreakdown
  const policyViolations = useMemo(() => detectPolicyViolations(expenseReports, expensePolicies as any[]), [expenseReports, expensePolicies])
  const spendingForecast = useMemo(() => forecastMonthlySpending(expenseReports), [expenseReports])

  // Top spenders
  const topSpenders = useMemo(() => {
    const map: Record<string, number> = {}
    expenseReports.forEach(r => { map[r.employee_id] = (map[r.employee_id] || 0) + r.total_amount })
    return Object.entries(map).map(([id, total]) => ({ id, name: getEmployeeName(id), total })).sort((a, b) => b.total - a.total).slice(0, 5)
  }, [expenseReports, getEmployeeName])

  // Monthly spend data for sparkline
  const monthlySpendData = useMemo(() => {
    const map: Record<string, number> = {}
    expenseReports.forEach(r => {
      const d = new Date(r.submitted_at || r.created_at)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      map[key] = (map[key] || 0) + r.total_amount
    })
    return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0])).map(([, v]) => v)
  }, [expenseReports])

  // Budget utilization for expense budgets
  const expenseBudgets = useMemo(() => {
    return budgets.filter(b => (b as any).status === 'active').map(b => {
      const ba = b as any
      const pct = ba.total_amount > 0 ? Math.round((ba.spent_amount / ba.total_amount) * 100) : 0
      return { ...ba, utilization: pct, remaining: ba.total_amount - ba.spent_amount, isOver: ba.spent_amount > ba.total_amount }
    })
  }, [budgets])

  // Receipt stats
  const receiptStats = useMemo(() => {
    const matched = demoReceipts.filter(r => r.status === 'matched').length
    const unmatched = demoReceipts.filter(r => r.status === 'unmatched').length
    const pending = demoReceipts.filter(r => r.status === 'pending').length
    return { total: demoReceipts.length, matched, unmatched, pending, matchRate: demoReceipts.length > 0 ? Math.round((matched / demoReceipts.length) * 100) : 0 }
  }, [])

  // ---- Bulk Expense Approval Memos ----
  const pendingExpenseReports = useMemo(() => {
    return expenseReports.filter(r => r.status === 'pending' || r.status === 'submitted' || r.status === 'pending_approval')
  }, [expenseReports])

  const bulkExpTargetReports = useMemo(() => {
    switch (bulkExpSelectMode) {
      case 'all_pending':
        return pendingExpenseReports
      case 'department': {
        if (bulkExpSelectedDepts.size === 0) return []
        return pendingExpenseReports.filter(r => {
          const emp = employees.find(e => e.id === r.employee_id)
          return emp && bulkExpSelectedDepts.has((emp as any).department_id)
        })
      }
      case 'amount':
        return pendingExpenseReports.filter(r => r.total_amount <= bulkExpMaxAmount)
      case 'individual':
        return pendingExpenseReports.filter(r => bulkExpSelectedIds.has(r.id))
      default:
        return pendingExpenseReports
    }
  }, [bulkExpSelectMode, pendingExpenseReports, bulkExpSelectedDepts, bulkExpMaxAmount, bulkExpSelectedIds, employees])

  const bulkExpSelectedReports = bulkExpTargetReports
  const bulkExpTotalAmount = useMemo(() => {
    return bulkExpSelectedReports.reduce((sum, r) => sum + r.total_amount, 0)
  }, [bulkExpSelectedReports])

  // ---- Report CRUD ----
  function openNewReport() {
    setReportForm({ employee_id: employees[0]?.id || '', title: '', currency: 'USD', items: [{ description: '', category: 'travel', amount: 0 }] })
    setShowReportModal(true)
  }

  function addLineItem() {
    setReportForm({ ...reportForm, items: [...reportForm.items, { description: '', category: 'travel', amount: 0 }] })
  }

  function updateLineItem(index: number, field: string, value: string | number) {
    const updated = reportForm.items.map((item, i) => i === index ? { ...item, [field]: value } : item)
    setReportForm({ ...reportForm, items: updated })
  }

  function removeLineItem(index: number) {
    if (reportForm.items.length <= 1) return
    setReportForm({ ...reportForm, items: reportForm.items.filter((_, i) => i !== index) })
  }

  function submitReport() {
    if (!reportForm.employee_id || !reportForm.title) return
    const validItems = reportForm.items.filter(item => item.description && item.amount > 0)
    if (validItems.length === 0) return
    const totalAmount = validItems.reduce((a, item) => a + Number(item.amount), 0)
    addExpenseReport({
      employee_id: reportForm.employee_id, title: reportForm.title, total_amount: totalAmount, currency: reportForm.currency,
      status: 'submitted', submitted_at: new Date().toISOString(),
      items: validItems.map((item, i) => ({ id: `item-${Date.now()}-${i}`, description: item.description, category: item.category, amount: Number(item.amount), date: new Date().toISOString().split('T')[0] })),
    })
    setShowReportModal(false)
  }

  function approveReport(id: string) { updateExpenseReport(id, { status: 'approved', approved_by: currentEmployeeId, approved_at: new Date().toISOString() }) }
  function rejectReport(id: string) { updateExpenseReport(id, { status: 'rejected', approved_by: currentEmployeeId, approved_at: new Date().toISOString() }) }
  function reimburseReport(id: string) { updateExpenseReport(id, { status: 'reimbursed', reimbursed_at: new Date().toISOString() }) }
  function confirmDelete() { if (deleteConfirm) { deleteExpenseReport(deleteConfirm); setDeleteConfirm(null) } }

  // ---- Policy CRUD ----
  function openAddPolicy() { setPolicyForm({ category: '', daily_limit: 0, receipt_threshold: 0, auto_approve_limit: 0, status: 'active' }); setEditingPolicyId(null); setShowPolicyModal(true) }
  function openEditPolicy(id: string) {
    const p = expensePolicies.find(pol => pol.id === id) as any
    if (!p) return
    setPolicyForm({ category: p.category, daily_limit: p.daily_limit, receipt_threshold: p.receipt_threshold, auto_approve_limit: p.auto_approve_limit, status: p.status })
    setEditingPolicyId(id); setShowPolicyModal(true)
  }
  function submitPolicy() {
    if (!policyForm.category) return
    if (editingPolicyId) { updateExpensePolicy(editingPolicyId, policyForm) } else { addExpensePolicy(policyForm) }
    setShowPolicyModal(false)
  }

  // ---- Policy Document Upload (AI mock) ----
  function delay(ms: number) { return new Promise(resolve => setTimeout(resolve, ms)) }

  async function simulatePolicyParsing(filename: string) {
    setPolicyDocument({ filename, uploadDate: new Date().toISOString(), pageCount: Math.floor(Math.random() * 8) + 12, fileSize: `${(Math.random() * 2 + 0.5).toFixed(1)} MB`, status: 'uploading' })
    setParsingProgress(0)
    setShowParsedRulesPreview(false)
    setPolicySummary(null)

    const stages = [
      { label: t('uploadingDocument'), target: 15 },
      { label: t('processingPdf'), target: 30, statusChange: 'parsing' as const },
      { label: t('extractingText'), target: 45 },
      { label: t('identifyingRules'), target: 60 },
      { label: t('categorizingPolicies'), target: 75 },
      { label: t('validatingLimits'), target: 90 },
    ]

    for (const stage of stages) {
      setParsingStage(stage.label)
      if (stage.statusChange) setPolicyDocument(prev => prev ? { ...prev, status: stage.statusChange! } : null)
      await delay(700 + Math.random() * 500)
      setParsingProgress(stage.target)
    }

    const mockRules = [
      { category: 'Travel', daily_limit: 500, receipt_threshold: 25, auto_approve_limit: 200, policy_section: 'Section 3.1 — Business Travel', policy_citation: 'Business travel expenses are reimbursable up to $500 per day with prior manager approval.' },
      { category: 'Meals', daily_limit: 75, receipt_threshold: 15, auto_approve_limit: 50, policy_section: 'Section 3.2 — Meal Allowances', policy_citation: 'Meal expenses during business travel shall not exceed $75 per day. Receipts required for amounts over $15.' },
      { category: 'Accommodation', daily_limit: 300, receipt_threshold: 0, auto_approve_limit: 200, policy_section: 'Section 3.3 — Lodging', policy_citation: 'Hotel accommodations up to $300 per night in standard markets. All lodging requires receipts.' },
      { category: 'Transport', daily_limit: 150, receipt_threshold: 10, auto_approve_limit: 75, policy_section: 'Section 3.4 — Local Transportation', policy_citation: 'Ground transportation reimbursable up to $150/day. Ride-share preferred over taxis.' },
      { category: 'Equipment', daily_limit: 1000, receipt_threshold: 0, auto_approve_limit: 500, policy_section: 'Section 4.1 — Office Equipment', policy_citation: 'Equipment purchases up to $1,000 require department head approval. IT equipment requires CTO sign-off.' },
      { category: 'Client Entertainment', daily_limit: 200, receipt_threshold: 25, auto_approve_limit: 100, policy_section: 'Section 5.1 — Client Relations', policy_citation: 'Client entertainment expenses capped at $200 per event. Attendee list and business purpose required.' },
      { category: 'Conference & Training', daily_limit: 500, receipt_threshold: 0, auto_approve_limit: 250, policy_section: 'Section 6.1 — Professional Development', policy_citation: 'Conference registration and training costs require advance approval. Annual cap of $5,000 per employee.' },
    ].map((rule, i) => ({ ...rule, id: `extracted-${Date.now()}-${i}`, source: 'document' as const, status: 'active' }))

    setExtractedRules(mockRules)
    setPolicySummary({
      documentTitle: 'Ecobank Corporate Expense Policy FY2026',
      effectiveDate: '2026-01-01',
      keyHighlights: [
        'Maximum daily travel allowance: $500',
        'All expenses over $25 require receipts',
        'Auto-approval threshold: up to $500 for equipment',
        'Client entertainment requires attendee list',
        'Annual professional development cap: $5,000/employee',
      ],
      totalRulesExtracted: mockRules.length,
    })

    setParsingProgress(100)
    setParsingStage(t('parsingComplete'))
    setPolicyDocument(prev => prev ? { ...prev, status: 'complete' } : null)
    setShowParsedRulesPreview(true)
  }

  function applyExtractedRules() {
    extractedRules.forEach(rule => {
      const existing = expensePolicies.find(p => (p as any).category === rule.category)
      if (existing) {
        updateExpensePolicy((existing as any).id, { daily_limit: rule.daily_limit, receipt_threshold: rule.receipt_threshold, auto_approve_limit: rule.auto_approve_limit, policy_section: rule.policy_section, policy_citation: rule.policy_citation, source: 'document', status: 'active' })
      } else {
        addExpensePolicy({ category: rule.category, daily_limit: rule.daily_limit, receipt_threshold: rule.receipt_threshold, auto_approve_limit: rule.auto_approve_limit, policy_section: rule.policy_section, policy_citation: rule.policy_citation, source: 'document', status: 'active' })
      }
    })
    setShowParsedRulesPreview(false)
    addToast(t('policiesApplied'))
  }

  function handlePolicyFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) simulatePolicyParsing(file.name)
  }

  function handlePolicyDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsPolicyDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file && file.type === 'application/pdf') simulatePolicyParsing(file.name)
  }

  // ---- Mileage CRUD ----
  function submitMileage() {
    if (!mileageForm.employee_id || !mileageForm.origin || !mileageForm.destination || !mileageForm.distance_km) return
    const amount = Number((mileageForm.distance_km * mileageForm.rate_per_km).toFixed(2))
    addMileageLog({ ...mileageForm, amount, status: 'pending' })
    setShowMileageModal(false)
    setMileageForm({ employee_id: '', date: '', origin: '', destination: '', distance_km: 0, rate_per_km: 0.58 })
  }

  // ---- Bulk Expense Approval Handlers ----
  function toggleBulkExpSet<T>(set: Set<T>, value: T, setter: (s: Set<T>) => void) {
    const next = new Set(set)
    if (next.has(value)) next.delete(value)
    else next.add(value)
    setter(next)
  }

  function resetBulkExpense() {
    setShowBulkExpenseModal(false)
    setBulkExpSelectMode('all_pending')
    setBulkExpSelectedIds(new Set())
    setBulkExpSelectedDepts(new Set())
    setBulkExpMaxAmount(5000)
    setBulkExpAction('approve')
  }

  function submitBulkExpense() {
    if (bulkExpSelectedReports.length === 0) return
    const now = new Date().toISOString()
    bulkExpSelectedReports.forEach(report => {
      if (bulkExpAction === 'approve') {
        updateExpenseReport(report.id, { status: 'approved', approved_by: currentEmployeeId, approved_at: now })
      } else {
        updateExpenseReport(report.id, { status: 'rejected', approved_by: currentEmployeeId, approved_at: now })
      }
    })
    addToast(`${bulkExpSelectedReports.length} expense report${bulkExpSelectedReports.length !== 1 ? 's' : ''} ${bulkExpAction === 'approve' ? 'approved' : 'rejected'} successfully`)
    resetBulkExpense()
  }

  const forecastInsight = useMemo(() => ({
    id: 'ai-expense-forecast', category: 'prediction' as const, severity: 'info' as const,
    title: t('spendingForecast'),
    description: t('projectedMonthly', { amount: spendingForecast.projected.toLocaleString(), trend: spendingForecast.trend, confidence: spendingForecast.confidence }),
    confidence: (spendingForecast.confidence >= 75 ? 'high' : spendingForecast.confidence >= 50 ? 'medium' : 'low') as 'high' | 'medium' | 'low',
    confidenceScore: spendingForecast.confidence,
    suggestedAction: 'Review spending policies and approval thresholds', module: 'expense',
  }), [spendingForecast, t])

  return (
    <>
      <Header title={t('title')} subtitle={t('subtitle')}
        actions={<div className="flex gap-2">{pendingExpenseReports.length > 0 && <Button size="sm" variant="secondary" onClick={() => setShowBulkExpenseModal(true)}><CheckCircle size={14} /> Bulk Approve</Button>}<Button size="sm" onClick={openNewReport}><Plus size={14} /> {t('newReport')}</Button></div>}
      />

      {/* Tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto border-b border-divider">
        {tabs.map(tab => {
          const Icon = tab.icon
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === tab.id ? 'border-tempo-600 text-tempo-600' : 'border-transparent text-t3 hover:text-t1 hover:border-border'}`}>
              <Icon size={16} /> {tab.label}
            </button>
          )
        })}
      </div>

      {/* ============================================================ */}
      {/* TAB 1: REPORTS */}
      {/* ============================================================ */}
      {activeTab === 'reports' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard label={t('pendingReview')} value={pendingReports.length} icon={<Clock size={20} />} />
            <StatCard label={t('pendingAmount')} value={`$${totalPending.toLocaleString()}`} change="Awaiting approval" changeType="neutral" icon={<DollarSign size={20} />} />
            <StatCard label={t('approvedReimbursed')} value={`$${reimbursedTotal.toLocaleString()}`} change={tc('thisQuarter')} changeType="positive" />
            <StatCard label={t('totalReports')} value={expenseReports.length} icon={<Receipt size={20} />} />
          </div>

          {spendingInsights.length > 0 && <AIAlertBanner insights={spendingInsights} className="mb-4" />}

          {/* Search & Filters */}
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-t3" />
              <input className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-lg bg-surface text-t1 focus:outline-none focus:ring-2 focus:ring-tempo-500/30"
                placeholder={t('searchReports')} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>
            <select className="px-3 py-2 text-sm border border-border rounded-lg bg-surface text-t1" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">{t('filterByStatus')}</option>
              <option value="submitted">Submitted</option>
              <option value="pending_approval">Pending Approval</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="reimbursed">Reimbursed</option>
            </select>
          </div>

          <Card padding="none">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t('expenseReportsTitle')}</CardTitle>
                <Button variant="secondary" size="sm" onClick={openNewReport}><Plus size={14} /> {t('newReport')}</Button>
              </div>
            </CardHeader>
            <div className="divide-y divide-divider">
              {filteredReports.length === 0 && (
                <div className="px-6 py-12 text-center text-sm text-t3">{t('noExpenseReports')}</div>
              )}
              {filteredReports.map(report => {
                const isExpanded = expandedReport === report.id
                const compliance = checkPolicyCompliance(report)
                return (
                  <div key={report.id} className="px-6 py-4">
                    <div className="flex items-center gap-4 mb-1">
                      <Avatar name={getEmployeeName(report.employee_id)} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-t1">{report.title}</p>
                          <button onClick={() => setExpandedReport(isExpanded ? null : report.id)} className="p-0.5 text-t3 hover:text-t1 transition-colors">
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                        </div>
                        <p className="text-xs text-t3">
                          {getEmployeeName(report.employee_id)} - {t('submittedDate', { date: new Date(report.submitted_at).toLocaleDateString() })}
                        </p>
                      </div>
                      <p className="text-lg font-semibold text-t1">${report.total_amount.toLocaleString()}</p>
                      <AIScoreBadge score={calculateFraudRiskScore(report, expenseReports)} size="sm" />
                      <Badge variant={
                        report.status === 'approved' ? 'success' : report.status === 'reimbursed' ? 'info' :
                        report.status === 'rejected' ? 'error' : report.status === 'submitted' || report.status === 'pending_approval' ? 'warning' : 'default'
                      }>{report.status.replace(/_/g, ' ')}</Badge>
                      <div className="flex gap-1">
                        {(report.status === 'submitted' || report.status === 'pending_approval') && (
                          <>
                            <Button size="sm" variant="primary" onClick={() => approveReport(report.id)}>{tc('approve')}</Button>
                            <Button size="sm" variant="ghost" onClick={() => rejectReport(report.id)}>{tc('reject')}</Button>
                          </>
                        )}
                        {report.status === 'approved' && (
                          <Button size="sm" variant="primary" onClick={() => reimburseReport(report.id)}>{tc('reimburse')}</Button>
                        )}
                        <button onClick={() => setDeleteConfirm(report.id)} className="p-1.5 text-t3 hover:text-error hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Expanded detail */}
                    {isExpanded && (
                      <div className="ml-12 mt-3">
                        {report.items && report.items.length > 0 && (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
                            {report.items.map((item: { id: string; description: string; category: string; amount: number }) => (
                              <div key={item.id} className="bg-canvas rounded-lg px-3 py-2 flex justify-between">
                                <div>
                                  <p className="text-xs font-medium text-t1">{item.description}</p>
                                  <p className="text-[0.6rem] text-t3">{item.category}</p>
                                </div>
                                <p className="text-xs font-semibold text-t1">${item.amount}</p>
                              </div>
                            ))}
                          </div>
                        )}
                        {compliance.length > 0 && (
                          <div className="space-y-1">
                            {compliance.map(c => <AIInsightCard key={c.id} insight={c} compact />)}
                          </div>
                        )}
                      </div>
                    )}

                    {!isExpanded && report.items && report.items.length > 0 && (
                      <p className="ml-12 text-xs text-t3 mt-1">
                        {report.items.length !== 1 ? t('lineItemCountPlural', { count: report.items.length }) : t('lineItemCount', { count: report.items.length })}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </Card>
        </>
      )}

      {/* ============================================================ */}
      {/* TAB 2: ANALYTICS */}
      {/* ============================================================ */}
      {activeTab === 'analytics' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard label={t('totalSpend')} value={`$${totalSpend.toLocaleString()}`} change={t('allReports')} changeType="neutral" icon={<DollarSign size={20} />} />
            <StatCard label={t('avgReportValue')} value={`$${avgReportValue.toLocaleString()}`} change={`${expenseReports.length} ${t('reports').toLowerCase()}`} changeType="neutral" icon={<Receipt size={20} />} />
            <StatCard label={t('reimbursedAmount')} value={`$${reimbursedTotal.toLocaleString()}`} change={tc('thisQuarter')} changeType="positive" icon={<CheckCircle2 size={20} />} />
            <StatCard label={t('pendingReview')} value={pendingReports.length} change={`$${totalPending.toLocaleString()}`} changeType={pendingReports.length > 3 ? 'negative' : 'neutral'} icon={<Clock size={20} />} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Spending by Category */}
            <Card>
              <h3 className="text-sm font-semibold text-t1 mb-4">{t('spendingByCategory')}</h3>
              {categoryData.length > 0 ? (
                <>
                  <TempoBarChart data={categoryData.slice(0, 6).map(c => ({ name: c.category.length > 10 ? c.category.substring(0, 10) + '...' : c.category, total: c.total }))} bars={[{ dataKey: 'total', name: 'Total', color: CHART_COLORS.primary }]} xKey="name" height={140} showGrid={false} showYAxis={false} />
                  <div className="mt-3 space-y-1">
                    {categoryData.map(c => (
                      <div key={c.category} className="flex justify-between text-xs">
                        <span className="text-t2">{c.category}</span>
                        <span className="text-t1 font-medium">${c.total.toLocaleString()} ({c.count} items, avg ${c.avgAmount})</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : <p className="text-sm text-t3">{t('noExpenseReports')}</p>}
            </Card>

            {/* Category Donut */}
            <Card>
              <h3 className="text-sm font-semibold text-t1 mb-4">{t('categoryBreakdown')}</h3>
              {categoryData.length > 0 ? (
                <>
                  <TempoDonutChart data={categoryData.slice(0, 5).map((c, i) => ({
                    name: c.category, value: c.total,
                    color: CHART_SERIES[i % CHART_SERIES.length],
                  }))} height={180} />
                  <div className="mt-3 space-y-1">
                    {categoryData.slice(0, 5).map(c => {
                      const pct = totalSpend > 0 ? Math.round((c.total / totalSpend) * 100) : 0
                      return (
                        <div key={c.category} className="flex justify-between text-xs">
                          <span className="text-t2">{c.category}</span>
                          <span className="text-t1 font-medium">{pct}%</span>
                        </div>
                      )
                    })}
                  </div>
                </>
              ) : <p className="text-sm text-t3">{t('noExpenseReports')}</p>}
            </Card>
          </div>

          {/* Monthly Spending Trend */}
          {monthlySpendData.length > 0 && (
            <Card className="mb-6">
              <h3 className="text-sm font-semibold text-t1 mb-4">{t('monthlySpendingTrend')}</h3>
              <TempoSparkArea data={monthlySpendData} />
            </Card>
          )}

          {/* Top Spenders */}
          {topSpenders.length > 0 && (
            <Card padding="none" className="mb-6">
              <CardHeader><CardTitle>{t('topSpenders')}</CardTitle></CardHeader>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-divider bg-canvas">
                      <th className="tempo-th text-left px-6 py-3">{tc('employee')}</th>
                      <th className="tempo-th text-right px-4 py-3">{tc('total')}</th>
                      <th className="tempo-th text-right px-4 py-3">{t('budgetVsActual')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {topSpenders.map((s, i) => (
                      <tr key={s.id} className="hover:bg-canvas/50">
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar name={s.name} size="sm" />
                            <div>
                              <p className="text-sm font-medium text-t1">{s.name}</p>
                              <p className="text-xs text-t3">#{i + 1} spender</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-t1 text-right font-semibold">${s.total.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right"><Progress value={Math.min(100, Math.round((s.total / Math.max(1, totalSpend)) * 100 * expenseReports.length))} size="sm" showLabel /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* AI Insights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {expenseReports.length > 0 && <AIInsightCard insight={forecastInsight} compact />}
            {spendingInsights.map(insight => <AIInsightCard key={insight.id} insight={insight} compact />)}
          </div>
        </>
      )}

      {/* ============================================================ */}
      {/* TAB 3: POLICY RULES */}
      {/* ============================================================ */}
      {activeTab === 'policy-rules' && (
        <>
          {/* Policy Document Upload */}
          <Card className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={16} className="text-tempo-500" />
              <span className="text-sm font-semibold text-t1">{t('policyDocumentUpload')}</span>
              <Badge variant="ai">{t('aiPowered')}</Badge>
            </div>

            {!policyDocument ? (
              <div
                onClick={() => policyFileInputRef.current?.click()}
                onDrop={handlePolicyDrop}
                onDragOver={(e) => { e.preventDefault(); setIsPolicyDragging(true) }}
                onDragLeave={() => setIsPolicyDragging(false)}
                className={cn(
                  'flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed rounded-lg cursor-pointer transition-all',
                  isPolicyDragging ? 'border-tempo-400 bg-tempo-50' : 'border-border bg-canvas hover:border-tempo-300 hover:bg-canvas/80'
                )}
              >
                <div className="w-12 h-12 rounded-full bg-tempo-50 flex items-center justify-center">
                  <Upload size={24} className="text-tempo-500" />
                </div>
                <div className="text-center">
                  <p className="text-sm text-t2"><span className="font-medium text-tempo-600">{t('clickToUpload')}</span> {t('orDragDrop')}</p>
                  <p className="text-xs text-t3 mt-1">{t('pdfPolicyHint')}</p>
                </div>
                <input ref={policyFileInputRef} type="file" accept=".pdf" className="hidden" onChange={handlePolicyFileChange} />
              </div>
            ) : policyDocument.status !== 'complete' ? (
              <div className="p-6 bg-canvas rounded-lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-tempo-100 flex items-center justify-center">
                    <FileText size={20} className="text-tempo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-t1 truncate">{policyDocument.filename}</p>
                    <p className="text-xs text-t3">{parsingStage}</p>
                  </div>
                  <AIPulse active size="md" />
                </div>
                <Progress value={parsingProgress} color="orange" size="md" showLabel />
              </div>
            ) : (
              <div className="flex items-center gap-4 p-4 bg-canvas rounded-lg">
                <div className="w-10 h-10 rounded-lg bg-tempo-100 flex items-center justify-center shrink-0">
                  <FileText size={20} className="text-tempo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-t1">{policyDocument.filename}</p>
                  <p className="text-xs text-t3">{t('uploadedOn', { date: new Date(policyDocument.uploadDate).toLocaleDateString() })} &middot; {t('pageCount', { count: policyDocument.pageCount })} &middot; {policyDocument.fileSize}</p>
                </div>
                <Badge variant="ai">{t('aiParsed')}</Badge>
                <Button size="sm" variant="secondary" onClick={() => { setPolicyDocument(null); setExtractedRules([]); setPolicySummary(null) }}>{t('reupload')}</Button>
              </div>
            )}
          </Card>

          {/* Policy Summary */}
          {policySummary && (
            <Card className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={14} className="text-tempo-500" />
                <span className="text-sm font-semibold text-t1">{t('policySummaryTitle')}</span>
              </div>
              <p className="text-xs font-medium text-t1 mb-0.5">{policySummary.documentTitle}</p>
              <p className="text-xs text-t3 mb-3">{t('effectiveDate')}: {policySummary.effectiveDate}</p>
              <div className="space-y-1.5 mb-3">
                {policySummary.keyHighlights.map((h, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle2 size={12} className="text-success mt-0.5 shrink-0" />
                    <span className="text-xs text-t2">{h}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-t3">{t('rulesExtracted', { count: policySummary.totalRulesExtracted })}</p>
            </Card>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard label={t('policyRulesTitle')} value={expensePolicies.length} change={`${expensePolicies.filter(p => (p as any).status === 'active').length} ${t('active').toLowerCase()}`} changeType="neutral" icon={<Shield size={20} />} />
            <StatCard label={t('policyViolations')} value={policyViolations.length} change={policyViolations.filter(v => v.severity === 'critical').length > 0 ? `${policyViolations.filter(v => v.severity === 'critical').length} critical` : 'None critical'} changeType={policyViolations.length > 0 ? 'negative' : 'positive'} icon={<AlertTriangle size={20} />} />
            <StatCard label={t('autoApproveLimit')} value={`$${Math.max(...expensePolicies.map(p => (p as any).auto_approve_limit || 0)).toLocaleString()}`} change="Max limit" changeType="neutral" icon={<CheckCircle2 size={20} />} />
            <StatCard label={t('receiptThreshold')} value={`$${Math.min(...expensePolicies.filter(p => (p as any).receipt_threshold > 0).map(p => (p as any).receipt_threshold || 0)).toLocaleString()}`} change="Min threshold" changeType="neutral" icon={<Receipt size={20} />} />
          </div>

          <Card padding="none" className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t('policyRulesTitle')}</CardTitle>
                <Button size="sm" onClick={openAddPolicy}><Plus size={14} /> {t('addPolicy')}</Button>
              </div>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-divider bg-canvas">
                    <th className="tempo-th text-left px-6 py-3">{t('policyCategory')}</th>
                    <th className="tempo-th text-right px-4 py-3">{t('dailyLimit')}</th>
                    <th className="tempo-th text-right px-4 py-3">{t('receiptThreshold')}</th>
                    <th className="tempo-th text-right px-4 py-3">{t('autoApproveLimit')}</th>
                    <th className="tempo-th text-center px-4 py-3">{t('policyStatus')}</th>
                    <th className="tempo-th text-center px-4 py-3">{t('policySource')}</th>
                    <th className="tempo-th text-center px-4 py-3">{tc('actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {expensePolicies.length === 0 ? (
                    <tr><td colSpan={7} className="px-6 py-12 text-center text-xs text-t3">{t('noPolicies')}</td></tr>
                  ) : expensePolicies.map(policy => {
                    const p = policy as any
                    return (
                      <tr key={p.id} className="hover:bg-canvas/50">
                        <td className="px-6 py-3">
                          <span className="text-xs font-medium text-t1">{p.category}</span>
                          {p.policy_section && <p className="text-[10px] text-t3 mt-0.5">{p.policy_section}</p>}
                        </td>
                        <td className="px-4 py-3 text-xs text-t1 text-right">${p.daily_limit?.toLocaleString()}</td>
                        <td className="px-4 py-3 text-xs text-t2 text-right">${p.receipt_threshold?.toLocaleString()}</td>
                        <td className="px-4 py-3 text-xs text-t2 text-right">${p.auto_approve_limit?.toLocaleString()}</td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant={p.status === 'active' ? 'success' : 'default'}>{p.status === 'active' ? t('active') : t('inactive')}</Badge>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant={p.source === 'document' ? 'ai' : 'default'}>{p.source === 'document' ? t('documentSource') : t('manualSource')}</Badge>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex gap-1 justify-center">
                            <Button size="sm" variant="ghost" onClick={() => openEditPolicy(p.id)}>{tc('edit')}</Button>
                            <Button size="sm" variant="ghost" onClick={() => updateExpensePolicy(p.id, { status: p.status === 'active' ? 'inactive' : 'active' })}>
                              {p.status === 'active' ? t('inactive') : t('active')}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Policy Violations */}
          {policyViolations.length > 0 ? (
            <Card>
              <h3 className="text-sm font-semibold text-t1 mb-3">{t('policyViolations')}</h3>
              <div className="space-y-2">
                {policyViolations.map((v, i) => (
                  <div key={`${v.reportId}-${i}`} className="flex items-center gap-3 bg-canvas rounded-lg px-3 py-2">
                    <Badge variant={v.severity === 'critical' ? 'error' : 'warning'}>{v.severity}</Badge>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs text-t1">{v.violation}</span>
                      {v.policySection && <span className="text-[10px] text-t3 ml-1">({v.policySection})</span>}
                    </div>
                    <span className="text-xs font-medium text-t2 shrink-0">${v.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </Card>
          ) : (
            <Card>
              <div className="text-center py-6">
                <CheckCircle2 size={24} className="inline text-emerald-500 mb-2" />
                <p className="text-sm text-t3">{t('noPolicyViolations')}</p>
              </div>
            </Card>
          )}
        </>
      )}

      {/* ============================================================ */}
      {/* TAB 4: PER DIEM & MILEAGE */}
      {/* ============================================================ */}
      {activeTab === 'per-diem-mileage' && (
        <>
          {/* Per Diem Rates */}
          <Card padding="none" className="mb-6">
            <CardHeader><CardTitle>{t('perDiemRates')}</CardTitle></CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-divider bg-canvas">
                    <th className="tempo-th text-left px-6 py-3">{t('country')}</th>
                    <th className="tempo-th text-left px-4 py-3">{t('city')}</th>
                    <th className="tempo-th text-right px-4 py-3">{t('dailyRate')}</th>
                    <th className="tempo-th text-right px-4 py-3">{t('mealsRate')}</th>
                    <th className="tempo-th text-right px-4 py-3">{t('lodgingRate')}</th>
                    <th className="tempo-th text-right px-4 py-3">{t('incidentalsRate')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {perDiemRates.map(rate => (
                    <tr key={`${rate.country}-${rate.city}`} className="hover:bg-canvas/50">
                      <td className="px-6 py-3 text-xs font-medium text-t1">{rate.country}</td>
                      <td className="px-4 py-3 text-xs text-t2">{rate.city}</td>
                      <td className="px-4 py-3 text-xs text-t1 text-right font-semibold">${rate.daily}</td>
                      <td className="px-4 py-3 text-xs text-t2 text-right">${rate.meals}</td>
                      <td className="px-4 py-3 text-xs text-t2 text-right">${rate.lodging}</td>
                      <td className="px-4 py-3 text-xs text-t2 text-right">${rate.incidentals}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Per Diem Calculator */}
          <Card className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Calculator size={18} className="text-tempo-600" />
              <h3 className="text-sm font-semibold text-t1">{t('perDiemCalculator')}</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-medium text-t2 mb-1 block">{t('selectCountry')}</label>
                <select className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-surface text-t1" value={perDiemCountry} onChange={e => setPerDiemCountry(e.target.value)}>
                  {[...new Set(perDiemRates.map(r => r.country))].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <Input label={t('startDate')} type="date" value={perDiemStart} onChange={e => setPerDiemStart(e.target.value)} />
              <Input label={t('endDate')} type="date" value={perDiemEnd} onChange={e => setPerDiemEnd(e.target.value)} />
              <div className="flex items-end">
                <Button size="sm" onClick={() => addToast('Per diem calculated successfully')}><Calculator size={14} /> {t('calculatePerDiem')}</Button>
              </div>
            </div>
            {perDiemResult && (
              <div className="mt-4 bg-canvas rounded-lg p-4">
                <h4 className="text-sm font-semibold text-t1 mb-3">{t('estimatedPerDiem')} - {perDiemCountry}</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: t('nights', { count: perDiemResult.nights }), value: `${perDiemResult.nights}`, color: 'text-t1' },
                    { label: t('mealsRate'), value: `$${perDiemResult.meals.toLocaleString()}`, color: 'text-t1' },
                    { label: t('lodgingRate'), value: `$${perDiemResult.lodging.toLocaleString()}`, color: 'text-t1' },
                    { label: tc('total'), value: `$${perDiemResult.total.toLocaleString()}`, color: 'text-tempo-700 font-bold' },
                  ].map(item => (
                    <div key={item.label} className="bg-white rounded-lg p-3 border border-border">
                      <p className="text-xs text-t3 mb-1">{item.label}</p>
                      <p className={`text-sm ${item.color}`}>{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* Mileage Log */}
          <Card padding="none">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t('mileageLog')}</CardTitle>
                <Button size="sm" onClick={() => { setMileageForm({ employee_id: employees[0]?.id || '', date: '', origin: '', destination: '', distance_km: 0, rate_per_km: 0.58 }); setShowMileageModal(true) }}>
                  <Plus size={14} /> {t('addMileageEntry')}
                </Button>
              </div>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-divider bg-canvas">
                    <th className="tempo-th text-left px-6 py-3">{tc('employee')}</th>
                    <th className="tempo-th text-left px-4 py-3">{t('origin')}</th>
                    <th className="tempo-th text-left px-4 py-3">{t('destination')}</th>
                    <th className="tempo-th text-right px-4 py-3">{t('distance')}</th>
                    <th className="tempo-th text-right px-4 py-3">{t('ratePerKm')}</th>
                    <th className="tempo-th text-right px-4 py-3">{t('mileageAmount')}</th>
                    <th className="tempo-th text-center px-4 py-3">{tc('status')}</th>
                    <th className="tempo-th text-center px-4 py-3">{tc('actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {mileageLogs.length === 0 ? (
                    <tr><td colSpan={8} className="px-6 py-12 text-center text-xs text-t3">{t('noMileageLogs')}</td></tr>
                  ) : mileageLogs.map(log => {
                    const ml = log as any
                    return (
                      <tr key={ml.id} className="hover:bg-canvas/50">
                        <td className="px-6 py-3 text-xs font-medium text-t1">{getEmployeeName(ml.employee_id)}</td>
                        <td className="px-4 py-3 text-xs text-t2">{ml.origin}</td>
                        <td className="px-4 py-3 text-xs text-t2">{ml.destination}</td>
                        <td className="px-4 py-3 text-xs text-t1 text-right">{ml.distance_km} km</td>
                        <td className="px-4 py-3 text-xs text-t2 text-right">${ml.rate_per_km}</td>
                        <td className="px-4 py-3 text-xs text-t1 text-right font-semibold">${ml.amount?.toFixed(2)}</td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant={ml.status === 'approved' ? 'success' : 'warning'}>{ml.status}</Badge>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {ml.status === 'pending' && (
                            <Button size="sm" variant="ghost" onClick={() => updateMileageLog(ml.id, { status: 'approved' })}>{tc('approve')}</Button>
                          )}
                        </td>
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
      {/* TAB 5: BUDGETS */}
      {/* ============================================================ */}
      {activeTab === 'budgets' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard label={t('departmentBudgets')} value={expenseBudgets.length} change={`${expenseBudgets.filter(b => b.isOver).length} ${t('overBudget').toLowerCase()}`} changeType={expenseBudgets.filter(b => b.isOver).length > 0 ? 'negative' : 'positive'} icon={<Wallet size={20} />} />
            <StatCard label={t('allocated')} value={`$${(expenseBudgets.reduce((s, b) => s + b.total_amount, 0) / 1000000).toFixed(1)}M`} change="Total budget" changeType="neutral" icon={<DollarSign size={20} />} />
            <StatCard label={t('spent')} value={`$${(expenseBudgets.reduce((s, b) => s + b.spent_amount, 0) / 1000000).toFixed(1)}M`} change={tc('thisQuarter')} changeType="neutral" icon={<Receipt size={20} />} />
            <StatCard label={t('remaining')} value={`$${(expenseBudgets.reduce((s, b) => s + b.remaining, 0) / 1000000).toFixed(1)}M`} change="Available" changeType="positive" icon={<CheckCircle2 size={20} />} />
          </div>

          <Card padding="none" className="mb-6">
            <CardHeader><CardTitle>{t('departmentBudgets')}</CardTitle></CardHeader>
            <div className="divide-y divide-divider">
              {expenseBudgets.length === 0 ? (
                <div className="px-6 py-12 text-center text-sm text-t3">{t('noBudgets')}</div>
              ) : expenseBudgets.map(budget => (
                <div key={budget.id} className="px-6 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium text-t1">{budget.name}</p>
                      <p className="text-xs text-t3">{getDepartmentName(budget.department_id)} - FY{budget.fiscal_year}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-t1">${(budget.spent_amount / 1000).toFixed(0)}K / ${(budget.total_amount / 1000).toFixed(0)}K</p>
                      <Badge variant={budget.isOver ? 'error' : budget.utilization > 75 ? 'warning' : 'success'}>
                        {budget.isOver ? t('overBudget') : t('onTrack')} - {budget.utilization}%
                      </Badge>
                    </div>
                  </div>
                  <Progress value={Math.min(100, budget.utilization)} size="sm" color={budget.isOver ? 'error' : budget.utilization > 75 ? 'warning' : 'orange'} />
                  <div className="flex justify-between mt-1 text-xs text-t3">
                    <span>{t('spent')}: ${(budget.spent_amount / 1000).toFixed(0)}K</span>
                    <span>{t('remaining')}: ${(budget.remaining / 1000).toFixed(0)}K</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Over-Budget Alerts */}
          {expenseBudgets.filter(b => b.isOver || b.utilization > 85).length > 0 ? (
            <Card>
              <h3 className="text-sm font-semibold text-t1 mb-3">{t('overBudgetAlerts')}</h3>
              <div className="space-y-2">
                {expenseBudgets.filter(b => b.isOver || b.utilization > 85).map(b => (
                  <div key={b.id} className={`p-3 rounded-lg border ${b.isOver ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={14} className={b.isOver ? 'text-red-600' : 'text-amber-600'} />
                      <p className={`text-sm font-medium ${b.isOver ? 'text-red-800' : 'text-amber-800'}`}>{b.name}</p>
                    </div>
                    <p className={`text-xs mt-1 ${b.isOver ? 'text-red-700' : 'text-amber-700'}`}>
                      {b.utilization}% utilized - ${(b.spent_amount / 1000).toFixed(0)}K of ${(b.total_amount / 1000).toFixed(0)}K budget
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          ) : (
            <Card>
              <div className="text-center py-6">
                <CheckCircle2 size={24} className="inline text-emerald-500 mb-2" />
                <p className="text-sm text-t3">{t('noOverBudgetAlerts')}</p>
              </div>
            </Card>
          )}
        </>
      )}

      {/* ============================================================ */}
      {/* TAB 6: RECEIPTS */}
      {/* ============================================================ */}
      {activeTab === 'receipts' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard label={t('totalReceipts')} value={receiptStats.total} icon={<Receipt size={20} />} />
            <StatCard label={t('matchRate')} value={`${receiptStats.matchRate}%`} change={`${receiptStats.matched} ${t('matched').toLowerCase()}`} changeType={receiptStats.matchRate > 70 ? 'positive' : 'negative'} icon={<CheckCircle2 size={20} />} />
            <StatCard label={t('unmatchedCount')} value={receiptStats.unmatched} change="Needs review" changeType={receiptStats.unmatched > 0 ? 'negative' : 'positive'} icon={<AlertTriangle size={20} />} />
            <StatCard label={t('pending')} value={receiptStats.pending} change="AI processing" changeType="neutral" icon={<Clock size={20} />} />
          </div>

          {/* Upload Area */}
          <Card className="mb-6">
            <h3 className="text-sm font-semibold text-t1 mb-4">{t('uploadReceipts')}</h3>
            <input
              ref={receiptInputRef}
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={e => {
                const file = e.target.files?.[0]
                if (file) setReceiptFile(file.name)
              }}
            />
            <div
              className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-tempo-400 hover:bg-tempo-50/30 transition-colors cursor-pointer"
              onClick={() => receiptInputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); e.stopPropagation() }}
              onDrop={e => {
                e.preventDefault()
                e.stopPropagation()
                const file = e.dataTransfer.files?.[0]
                if (file) setReceiptFile(file.name)
              }}
            >
              {receiptFile ? (
                <>
                  <Upload size={32} className="mx-auto text-tempo-600 mb-3" />
                  <p className="text-sm text-t1 font-medium mb-1">{receiptFile}</p>
                  <p className="text-xs text-t3">{t('supportedFormats')}</p>
                </>
              ) : (
                <>
                  <Upload size={32} className="mx-auto text-t3 mb-3" />
                  <p className="text-sm text-t2 mb-1">{t('dragDropText')}</p>
                  <p className="text-xs text-t3">{t('supportedFormats')}</p>
                </>
              )}
            </div>
          </Card>

          {/* Receipt Gallery */}
          <Card padding="none">
            <CardHeader><CardTitle>{t('receiptGallery')}</CardTitle></CardHeader>
            <div className="p-6">
              {demoReceipts.length === 0 ? (
                <div className="text-center py-8 text-sm text-t3">{t('noReceipts')}</div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {demoReceipts.map(receipt => (
                    <div key={receipt.id} className="border border-border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                      <div className="bg-canvas h-28 flex items-center justify-center">
                        {receipt.filename.endsWith('.pdf') ? (
                          <FileText size={32} className="text-t3" />
                        ) : (
                          <Image size={32} className="text-t3" />
                        )}
                      </div>
                      <div className="p-3">
                        <p className="text-xs font-medium text-t1 truncate">{receipt.filename}</p>
                        <p className="text-xs text-t3">${receipt.amount} - {receipt.date}</p>
                        <div className="flex items-center justify-between mt-2">
                          <Badge variant={receipt.status === 'matched' ? 'success' : receipt.status === 'unmatched' ? 'error' : 'warning'}>
                            {receipt.status === 'matched' ? t('matched') : receipt.status === 'unmatched' ? t('unmatched') : t('pending')}
                          </Badge>
                          <Badge variant="ai">{t('aiClassified')}: {receipt.ai_category}</Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </>
      )}

      {/* ============================================================ */}
      {/* MODALS */}
      {/* ============================================================ */}

      {/* New Expense Report Modal */}
      <Modal open={showReportModal} onClose={() => setShowReportModal(false)} title={t('newReportModal')} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Select label={tc('employee')} value={reportForm.employee_id}
              onChange={(e) => setReportForm({ ...reportForm, employee_id: e.target.value })}
              options={employees.map(e => ({ value: e.id, label: e.profile?.full_name || '' }))} />
            <Select label={tc('currency')} value={reportForm.currency}
              onChange={(e) => setReportForm({ ...reportForm, currency: e.target.value })}
              options={[
                { value: 'USD', label: tc('currencyUSD') }, { value: 'NGN', label: tc('currencyNGN') },
                { value: 'GHS', label: tc('currencyGHS') }, { value: 'KES', label: tc('currencyKES') }, { value: 'XOF', label: tc('currencyXOF') },
              ]} />
          </div>
          <Input label={t('reportTitle')} placeholder={t('reportTitlePlaceholder')} value={reportForm.title}
            onChange={(e) => setReportForm({ ...reportForm, title: e.target.value })} />

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-medium text-t1">{tc('lineItems')}</label>
              <Button size="sm" variant="secondary" onClick={addLineItem}><Plus size={12} /> {tc('addItem')}</Button>
            </div>
            <div className="space-y-2">
              {reportForm.items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-5">
                    <Input placeholder={t('descriptionPlaceholder')} value={item.description}
                      onChange={(e) => updateLineItem(index, 'description', e.target.value)} />
                  </div>
                  <div className="col-span-3">
                    <Select value={item.category} onChange={(e) => updateLineItem(index, 'category', e.target.value)}
                      options={[
                        { value: 'travel', label: t('categoryTravel') }, { value: 'meals', label: t('categoryMeals') },
                        { value: 'accommodation', label: t('categoryAccommodation') }, { value: 'transport', label: t('categoryTransport') },
                        { value: 'supplies', label: t('categorySupplies') }, { value: 'equipment', label: t('categoryEquipment') }, { value: 'other', label: t('categoryOther') },
                      ]} />
                  </div>
                  <div className="col-span-3">
                    <Input type="number" min={0} placeholder={t('amountPlaceholder')} value={item.amount || ''}
                      onChange={(e) => updateLineItem(index, 'amount', Number(e.target.value))} />
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <button onClick={() => removeLineItem(index)} disabled={reportForm.items.length <= 1}
                      className="p-1.5 text-t3 hover:text-error hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-2">
              <p className="text-sm font-semibold text-t1">
                {tc('total')}: ${reportForm.items.reduce((a, item) => a + (Number(item.amount) || 0), 0).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowReportModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitReport}>{t('submitReport')}</Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title={t('deleteReportModal')} size="sm">
        <p className="text-sm text-t2 mb-4">{t('deleteReportConfirm')}</p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>{tc('cancel')}</Button>
          <Button variant="danger" onClick={confirmDelete}>{tc('delete')}</Button>
        </div>
      </Modal>

      {/* Policy Modal */}
      <Modal open={showPolicyModal} onClose={() => setShowPolicyModal(false)} title={editingPolicyId ? t('editPolicy') : t('addPolicy')}>
        <div className="space-y-4">
          <Input label={t('policyCategory')} value={policyForm.category} placeholder="e.g., Travel, Meals"
            onChange={e => setPolicyForm({ ...policyForm, category: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('dailyLimit')} type="number" value={policyForm.daily_limit || ''}
              onChange={e => setPolicyForm({ ...policyForm, daily_limit: Number(e.target.value) })} />
            <Input label={t('receiptThreshold')} type="number" value={policyForm.receipt_threshold || ''}
              onChange={e => setPolicyForm({ ...policyForm, receipt_threshold: Number(e.target.value) })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('autoApproveLimit')} type="number" value={policyForm.auto_approve_limit || ''}
              onChange={e => setPolicyForm({ ...policyForm, auto_approve_limit: Number(e.target.value) })} />
            <Select label={t('policyStatus')} value={policyForm.status}
              onChange={e => setPolicyForm({ ...policyForm, status: e.target.value })}
              options={[{ value: 'active', label: t('active') }, { value: 'inactive', label: t('inactive') }]} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowPolicyModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitPolicy}>{editingPolicyId ? tc('save') : t('addPolicy')}</Button>
          </div>
        </div>
      </Modal>

      {/* Extracted Rules Preview Modal */}
      <Modal open={showParsedRulesPreview} onClose={() => setShowParsedRulesPreview(false)} title={t('reviewExtractedRules')}>
        <div className="space-y-3 max-h-[420px] overflow-y-auto">
          {extractedRules.map(rule => (
            <div key={rule.id} className="border border-border rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-t1">{rule.category}</span>
                <Badge variant="ai">{rule.policy_section}</Badge>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-2">
                <div>
                  <p className="text-[10px] text-t3 uppercase tracking-wide">{t('dailyLimit')}</p>
                  <p className="text-xs font-semibold text-t1">${rule.daily_limit.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[10px] text-t3 uppercase tracking-wide">{t('receiptThreshold')}</p>
                  <p className="text-xs font-semibold text-t1">${rule.receipt_threshold}</p>
                </div>
                <div>
                  <p className="text-[10px] text-t3 uppercase tracking-wide">{t('autoApproveLimit')}</p>
                  <p className="text-xs font-semibold text-t1">${rule.auto_approve_limit.toLocaleString()}</p>
                </div>
              </div>
              <p className="text-[11px] text-t3 italic bg-canvas rounded p-2">&ldquo;{rule.policy_citation}&rdquo;</p>
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2 pt-4 border-t border-border mt-4">
          <Button variant="secondary" onClick={() => setShowParsedRulesPreview(false)}>{tc('cancel')}</Button>
          <Button onClick={applyExtractedRules}><Sparkles size={14} /> {t('applyRules', { count: extractedRules.length })}</Button>
        </div>
      </Modal>

      {/* Mileage Entry Modal */}
      <Modal open={showMileageModal} onClose={() => setShowMileageModal(false)} title={t('addMileageEntry')}>
        <div className="space-y-4">
          <Select label={tc('employee')} value={mileageForm.employee_id}
            onChange={e => setMileageForm({ ...mileageForm, employee_id: e.target.value })}
            options={employees.slice(0, 20).map(emp => ({ value: emp.id, label: emp.profile.full_name }))} />
          <Input label={t('startDate')} type="date" value={mileageForm.date}
            onChange={e => setMileageForm({ ...mileageForm, date: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('origin')} value={mileageForm.origin} placeholder="e.g., Lagos Office"
              onChange={e => setMileageForm({ ...mileageForm, origin: e.target.value })} />
            <Input label={t('destination')} value={mileageForm.destination} placeholder="e.g., Client Site"
              onChange={e => setMileageForm({ ...mileageForm, destination: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('distance')} type="number" value={mileageForm.distance_km || ''}
              onChange={e => setMileageForm({ ...mileageForm, distance_km: Number(e.target.value) })} />
            <Input label={t('ratePerKm')} type="number" value={mileageForm.rate_per_km}
              onChange={e => setMileageForm({ ...mileageForm, rate_per_km: Number(e.target.value) })} />
          </div>
          {mileageForm.distance_km > 0 && (
            <div className="bg-canvas rounded-lg p-3">
              <p className="text-xs text-t3">{t('mileageAmount')}: <span className="font-semibold text-t1">${(mileageForm.distance_km * mileageForm.rate_per_km).toFixed(2)}</span></p>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowMileageModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitMileage}>{t('addMileageEntry')}</Button>
          </div>
        </div>
      </Modal>

      {/* Bulk Expense Approval Modal */}
      <Modal open={showBulkExpenseModal} onClose={resetBulkExpense} title="Bulk Expense Approval" size="xl">
        <div className="space-y-5">
          {/* Selection Mode */}
          <div>
            <label className="block text-xs font-medium text-t1 mb-2">Selection Mode</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {([
                { value: 'all_pending', label: 'All Pending', icon: CheckCircle },
                { value: 'department', label: 'By Department', icon: Users },
                { value: 'amount', label: 'Under Amount', icon: DollarSign },
                { value: 'individual', label: 'Individual', icon: FileText },
              ] as const).map(mode => (
                <button
                  key={mode.value}
                  onClick={() => setBulkExpSelectMode(mode.value)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors',
                    bulkExpSelectMode === mode.value
                      ? 'border-tempo-500 bg-tempo-50 text-tempo-700'
                      : 'border-border bg-surface text-t2 hover:bg-canvas'
                  )}
                >
                  <mode.icon size={14} />
                  {mode.label}
                </button>
              ))}
            </div>
          </div>

          {/* Department Filter */}
          {bulkExpSelectMode === 'department' && (
            <div>
              <label className="block text-xs font-medium text-t1 mb-2">Select Departments</label>
              <div className="flex flex-wrap gap-2">
                {departments.map(dept => (
                  <button
                    key={dept.id}
                    onClick={() => toggleBulkExpSet(bulkExpSelectedDepts, dept.id, setBulkExpSelectedDepts)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                      bulkExpSelectedDepts.has(dept.id)
                        ? 'border-tempo-500 bg-tempo-50 text-tempo-700'
                        : 'border-border bg-surface text-t2 hover:bg-canvas'
                    )}
                  >
                    {dept.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Amount Threshold */}
          {bulkExpSelectMode === 'amount' && (
            <div>
              <label className="block text-xs font-medium text-t1 mb-2">Maximum Amount Threshold</label>
              <div className="flex items-center gap-3">
                <span className="text-sm text-t2">$</span>
                <input
                  type="number"
                  min={0}
                  value={bulkExpMaxAmount}
                  onChange={e => setBulkExpMaxAmount(Number(e.target.value))}
                  className="w-40 px-3 py-2 text-sm border border-border rounded-lg bg-surface text-t1 focus:outline-none focus:ring-2 focus:ring-tempo-500/30"
                />
                <span className="text-xs text-t3">Reports at or below this amount</span>
              </div>
            </div>
          )}

          {/* Report List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-medium text-t1">
                {bulkExpSelectMode === 'individual' ? 'Select Reports' : 'Matching Reports'} ({bulkExpSelectMode === 'individual' ? bulkExpSelectedIds.size : bulkExpTargetReports.length})
              </label>
              {bulkExpSelectMode === 'individual' && pendingExpenseReports.length > 0 && (
                <button
                  onClick={() => {
                    if (bulkExpSelectedIds.size === pendingExpenseReports.length) {
                      setBulkExpSelectedIds(new Set())
                    } else {
                      setBulkExpSelectedIds(new Set(pendingExpenseReports.map(r => r.id)))
                    }
                  }}
                  className="text-xs text-tempo-600 hover:text-tempo-700 font-medium"
                >
                  {bulkExpSelectedIds.size === pendingExpenseReports.length ? 'Deselect All' : 'Select All'}
                </button>
              )}
            </div>
            <div className="max-h-[280px] overflow-y-auto border border-border rounded-lg divide-y divide-divider">
              {(bulkExpSelectMode === 'individual' ? pendingExpenseReports : bulkExpTargetReports).length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-t3">No matching pending reports</div>
              ) : (
                (bulkExpSelectMode === 'individual' ? pendingExpenseReports : bulkExpTargetReports).map(report => {
                  const isSelected = bulkExpSelectMode === 'individual' ? bulkExpSelectedIds.has(report.id) : true
                  return (
                    <div
                      key={report.id}
                      onClick={() => {
                        if (bulkExpSelectMode === 'individual') {
                          toggleBulkExpSet(bulkExpSelectedIds, report.id, setBulkExpSelectedIds)
                        }
                      }}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3 transition-colors',
                        bulkExpSelectMode === 'individual' ? 'cursor-pointer hover:bg-canvas' : '',
                        isSelected && bulkExpSelectMode === 'individual' ? 'bg-tempo-50/50' : ''
                      )}
                    >
                      {bulkExpSelectMode === 'individual' && (
                        <div className={cn(
                          'w-4 h-4 rounded border flex items-center justify-center shrink-0',
                          isSelected ? 'bg-tempo-600 border-tempo-600' : 'border-border'
                        )}>
                          {isSelected && <CheckCircle size={12} className="text-white" />}
                        </div>
                      )}
                      <Avatar name={getEmployeeName(report.employee_id)} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-t1 truncate">{report.title}</p>
                        <p className="text-xs text-t3">
                          {getEmployeeName(report.employee_id)} &middot; {new Date(report.submitted_at).toLocaleDateString()} &middot; {report.items?.length || 0} item{(report.items?.length || 0) !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-t1 shrink-0">${report.total_amount.toLocaleString()}</p>
                      <Badge variant="warning">{report.status.replace(/_/g, ' ')}</Badge>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Action Toggle */}
          <div>
            <label className="block text-xs font-medium text-t1 mb-2">Action</label>
            <div className="flex gap-2">
              <button
                onClick={() => setBulkExpAction('approve')}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors',
                  bulkExpAction === 'approve'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-border bg-surface text-t2 hover:bg-canvas'
                )}
              >
                <CheckCircle size={14} />
                Approve
              </button>
              <button
                onClick={() => setBulkExpAction('reject')}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors',
                  bulkExpAction === 'reject'
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-border bg-surface text-t2 hover:bg-canvas'
                )}
              >
                <AlertTriangle size={14} />
                Reject
              </button>
            </div>
          </div>

          {/* Summary */}
          {bulkExpSelectedReports.length > 0 && (
            <div className={cn(
              'rounded-lg p-4 border',
              bulkExpAction === 'approve' ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'
            )}>
              <p className={cn('text-sm font-medium', bulkExpAction === 'approve' ? 'text-emerald-800' : 'text-red-800')}>
                {bulkExpSelectedReports.length} report{bulkExpSelectedReports.length !== 1 ? 's' : ''} will be {bulkExpAction === 'approve' ? 'approved' : 'rejected'}
              </p>
              <p className={cn('text-xs mt-1', bulkExpAction === 'approve' ? 'text-emerald-700' : 'text-red-700')}>
                Total amount: ${bulkExpTotalAmount.toLocaleString()}
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button variant="secondary" onClick={resetBulkExpense}>Cancel</Button>
            <Button
              variant={bulkExpAction === 'approve' ? 'primary' : 'danger'}
              onClick={submitBulkExpense}
              disabled={bulkExpSelectedReports.length === 0}
            >
              <CheckCircle size={14} />
              {bulkExpAction === 'approve' ? 'Approve' : 'Reject'} {bulkExpSelectedReports.length} Report{bulkExpSelectedReports.length !== 1 ? 's' : ''}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
