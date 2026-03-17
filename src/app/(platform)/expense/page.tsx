'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Header } from '@/components/layout/header'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/ui/stat-card'
import { Modal } from '@/components/ui/modal'
import { Input, Select, Textarea } from '@/components/ui/input'
import { DatePicker } from '@/components/ui/date-picker'
import { TempoBarChart, TempoDonutChart, TempoSparkArea, CHART_COLORS, CHART_SERIES } from '@/components/ui/charts'
import { Progress } from '@/components/ui/progress'
import { Tabs } from '@/components/ui/tabs'
import { ExpandableStats } from '@/components/ui/expandable-stats'
import { Receipt, Plus, DollarSign, Clock, Trash2, ChevronDown, ChevronUp, BarChart3, Shield, MapPin, Wallet, FileText, Upload, Image, Search, AlertTriangle, CheckCircle, CheckCircle2, Car, Globe, Calculator, Sparkles, Users, Copy, Eye, XCircle, ArrowRight, Banknote, RotateCcw, Navigation, Zap, Layers, MessageCircle, Send } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { useTempo } from '@/lib/store'
import { PageSkeleton } from '@/components/ui/page-skeleton'
import { AIInsightCard, AIAlertBanner, AIScoreBadge, AIRecommendationList, AIPulse } from '@/components/ai'
import { AIInsightsCard } from '@/components/ui/ai-insights-card'
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
    currentUser,
    expensePolicies, addExpensePolicy, updateExpensePolicy,
    mileageLogs, addMileageLog, updateMileageLog,
    receiptMatches, addReceiptMatch, updateReceiptMatch,
    mileageEntries, addMileageEntry, updateMileageEntry,
    advancedExpensePolicies, addAdvancedExpensePolicy, updateAdvancedExpensePolicy, deleteAdvancedExpensePolicy,
    reimbursementBatches, addReimbursementBatch, updateReimbursementBatch,
    duplicateDetections, addDuplicateDetection, updateDuplicateDetection,
    payrollRuns,
    addToast,
    ensureModulesLoaded,
  } = useTempo()

  const role = currentUser?.role
  const canApproveExpenses = role === 'manager' || role === 'hrbp' || role === 'admin' || role === 'owner'

  const [pageLoading, setPageLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [confirmAction, setConfirmAction] = useState<{show:boolean, type:string, id:string, label:string}|null>(null)

  useEffect(() => {
    ensureModulesLoaded?.(['expenseReports', 'expensePolicies', 'mileageLogs', 'receiptMatches', 'mileageEntries', 'advancedExpensePolicies', 'reimbursementBatches', 'duplicateDetections'])?.then?.(() => setPageLoading(false))?.catch?.(() => setPageLoading(false))
    const _t = setTimeout(() => setPageLoading(false), 2000)
    return () => clearTimeout(_t)
  }, [])

  // ---- Tab State ----
  const tabs = [
    { id: 'reports', label: t('reports'), icon: FileText },
    { id: 'receipt-management', label: 'Receipt Management', icon: Receipt },
    { id: 'mileage', label: 'Mileage', icon: Navigation },
    { id: 'advanced-policies', label: 'Policies', icon: Zap },
    { id: 'reimbursement', label: 'Reimbursement', icon: Banknote },
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
  const [filterTeamOnly, setFilterTeamOnly] = useState(false)

  // Compute direct reports for team-only filter
  const directReportIds = useMemo(() => {
    if (!canApproveExpenses) return new Set<string>()
    return new Set(employees.filter((e: any) => e.manager_id === currentEmployeeId).map((e: any) => e.id))
  }, [employees, currentEmployeeId, canApproveExpenses])

  // ---- Forms ----
  const [reportForm, setReportForm] = useState({
    employee_id: '', title: '', currency: 'USD',
    items: [{ description: '', category: 'travel', amount: 0, date: new Date().toISOString().split('T')[0] }] as Array<{ description: string; category: string; amount: number; date: string }>,
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

  // ---- Inline Comment Threads on Expense Reports ----
  const [reportComments, setReportComments] = useState<Record<string, Array<{ id: string; author: string; text: string; timestamp: string }>>>({})
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({})

  function addComment(reportId: string) {
    const text = (commentInputs[reportId] || '').trim()
    if (!text) return
    const authorName = currentUser?.full_name || currentUser?.email || 'You'
    const newComment = { id: `cmt-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`, author: authorName, text, timestamp: new Date().toISOString() }
    setReportComments(prev => ({ ...prev, [reportId]: [...(prev[reportId] || []), newComment] }))
    setCommentInputs(prev => ({ ...prev, [reportId]: '' }))
  }

  // ---- Conditional Approval Rules (Policies Tab) ----
  const [approvalRules, setApprovalRules] = useState<Array<{
    id: string; enabled: boolean
    conditionType: 'amount' | 'category' | 'department'
    conditionOperator: '>' | '<' | '='
    conditionValue: string | number
    action: 'route_manager' | 'route_vp' | 'route_finance' | 'route_cfo' | 'auto_approve' | 'flag_review'
  }>>([
    { id: 'ar-1', enabled: true, conditionType: 'amount', conditionOperator: '>', conditionValue: 1000, action: 'route_vp' },
    { id: 'ar-2', enabled: true, conditionType: 'category', conditionOperator: '=', conditionValue: 'travel', action: 'route_finance' },
    { id: 'ar-3', enabled: false, conditionType: 'amount', conditionOperator: '<', conditionValue: 100, action: 'auto_approve' },
    { id: 'ar-4', enabled: true, conditionType: 'department', conditionOperator: '=', conditionValue: 'Engineering', action: 'route_manager' },
  ])
  const [showApprovalRuleBuilder, setShowApprovalRuleBuilder] = useState(false)
  const [newApprovalRule, setNewApprovalRule] = useState<{
    conditionType: 'amount' | 'category' | 'department'
    conditionOperator: '>' | '<' | '='
    conditionValue: string | number
    action: 'route_manager' | 'route_vp' | 'route_finance' | 'route_cfo' | 'auto_approve' | 'flag_review'
  }>({ conditionType: 'amount', conditionOperator: '>', conditionValue: 0, action: 'route_manager' })

  function addApprovalRule() {
    if (newApprovalRule.conditionType === 'amount' && !newApprovalRule.conditionValue) return
    if (newApprovalRule.conditionType !== 'amount' && !newApprovalRule.conditionValue) return
    setApprovalRules(prev => [...prev, { ...newApprovalRule, id: `ar-${Date.now()}`, enabled: true }])
    setNewApprovalRule({ conditionType: 'amount', conditionOperator: '>', conditionValue: 0, action: 'route_manager' })
    setShowApprovalRuleBuilder(false)
  }

  function toggleApprovalRule(id: string) {
    setApprovalRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r))
  }

  function deleteApprovalRule(id: string) {
    setApprovalRules(prev => prev.filter(r => r.id !== id))
  }

  const approvalRuleActionLabels: Record<string, string> = {
    route_manager: 'Route to Manager',
    route_vp: 'Require VP Approval',
    route_finance: 'Finance Review',
    route_cfo: 'Route to CFO',
    auto_approve: 'Auto-approve',
    flag_review: 'Flag for Review',
  }

  const approvalRuleActionColors: Record<string, string> = {
    route_manager: 'border-l-blue-500',
    route_vp: 'border-l-purple-500',
    route_finance: 'border-l-emerald-500',
    route_cfo: 'border-l-red-500',
    auto_approve: 'border-l-green-500',
    flag_review: 'border-l-amber-500',
  }

  function formatCondition(rule: typeof approvalRules[0]) {
    if (rule.conditionType === 'amount') return `Amount ${rule.conditionOperator} $${Number(rule.conditionValue).toLocaleString()}`
    if (rule.conditionType === 'category') return `Category = ${String(rule.conditionValue).charAt(0).toUpperCase() + String(rule.conditionValue).slice(1)}`
    return `Department = ${rule.conditionValue}`
  }

  // ---- Receipt Management (new) ----
  const [showDuplicateDetail, setShowDuplicateDetail] = useState<string | null>(null)

  // ---- Mileage Entry (new) ----
  const [showMileageEntryModal, setShowMileageEntryModal] = useState(false)
  const [mileageEntryForm, setMileageEntryForm] = useState({
    employee_id: '', date: '', start_location: '', end_location: '', distance_miles: 0, rate: 0.67, purpose: '', vehicle_type: 'personal' as string, trip_type: 'one_way' as string,
  })

  // ---- Advanced Policy (new) ----
  const [showAdvancedPolicyModal, setShowAdvancedPolicyModal] = useState(false)
  const [advancedPolicyForm, setAdvancedPolicyForm] = useState({
    name: '', is_active: true, applies_to: 'all' as string,
    rules: [{ field: 'amount', operator: '>', value: 0 as string | number, action: 'warn' as string }],
  })

  // ---- Reimbursement (new) ----
  const [showReimbursementModal, setShowReimbursementModal] = useState(false)
  const [reimbursementMethod, setReimbursementMethod] = useState<'payroll' | 'direct_deposit' | 'manual'>('payroll')
  const [selectedReimbursementIds, setSelectedReimbursementIds] = useState<Set<string>>(new Set())

  // ---- Quick-Add Expense Templates ----
  const quickAddTemplates = [
    { label: 'Meal', icon: '🍽️', category: 'meals', defaultAmount: 50, description: 'Business meal' },
    { label: 'Transport', icon: '🚕', category: 'transport', defaultAmount: 30, description: 'Ride/taxi' },
    { label: 'Flight', icon: '✈️', category: 'travel', defaultAmount: 500, description: 'Flight ticket' },
    { label: 'Hotel', icon: '🏨', category: 'accommodation', defaultAmount: 200, description: 'Hotel stay' },
    { label: 'Supplies', icon: '📦', category: 'supplies', defaultAmount: 75, description: 'Office supplies' },
    { label: 'Mileage', icon: '🚗', category: 'transport', defaultAmount: 0, description: 'Mileage reimbursement' },
  ]

  // ---- Receipt Upload in Submit Flow ----
  const [receiptUploads, setReceiptUploads] = useState<Array<{ id: string; filename: string; size: string; status: 'uploading' | 'processing' | 'done'; ocrData?: { amount?: number; vendor?: string; date?: string; category?: string } }>>([])
  const submitReceiptRef = useRef<HTMLInputElement>(null)
  const [isDraggingReceipt, setIsDraggingReceipt] = useState(false)

  function simulateReceiptUpload(file: File) {
    const id = `upload-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`
    const sizeStr = file.size < 1024 * 1024 ? `${(file.size / 1024).toFixed(0)} KB` : `${(file.size / (1024 * 1024)).toFixed(1)} MB`
    setReceiptUploads(prev => [...prev, { id, filename: file.name, size: sizeStr, status: 'uploading' }])
    // Simulate upload then OCR
    setTimeout(() => {
      setReceiptUploads(prev => prev.map(u => u.id === id ? { ...u, status: 'processing' } : u))
      setTimeout(() => {
        const ocrData = {
          amount: Math.round(Math.random() * 400 + 20),
          vendor: ['Restaurant Sahel', 'Uber Lagos', 'Air Cote d\'Ivoire', 'Novotel', 'Bolt'][Math.floor(Math.random() * 5)],
          date: new Date().toISOString().split('T')[0],
          category: ['meals', 'transport', 'travel', 'accommodation', 'transport'][Math.floor(Math.random() * 5)],
        }
        setReceiptUploads(prev => prev.map(u => u.id === id ? { ...u, status: 'done', ocrData } : u))
        addToast('Receipt scanned - data extracted via AI')
      }, 1500)
    }, 1000)
  }

  function applyOcrToLineItem(upload: typeof receiptUploads[0]) {
    if (!upload.ocrData) return
    const emptyIdx = reportForm.items.findIndex(item => !item.description && !item.amount)
    if (emptyIdx >= 0) {
      const updated = [...reportForm.items]
      updated[emptyIdx] = {
        description: upload.ocrData.vendor || '',
        category: upload.ocrData.category || 'other',
        amount: upload.ocrData.amount || 0,
        date: upload.ocrData.date || new Date().toISOString().split('T')[0],
      }
      setReportForm({ ...reportForm, items: updated })
    } else {
      setReportForm({
        ...reportForm,
        items: [...reportForm.items, {
          description: upload.ocrData.vendor || '',
          category: upload.ocrData.category || 'other',
          amount: upload.ocrData.amount || 0,
          date: upload.ocrData.date || new Date().toISOString().split('T')[0],
        }],
      })
    }
    addToast('OCR data applied to line item')
  }

  function removeReceiptUpload(id: string) {
    setReceiptUploads(prev => prev.filter(u => u.id !== id))
  }

  // ---- Reject with Reason ----
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectingReportId, setRejectingReportId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  function openRejectDialog(reportId: string) {
    setRejectingReportId(reportId)
    setRejectReason('')
    setShowRejectModal(true)
  }

  function submitRejectWithReason() {
    if (!rejectingReportId) return
    if (!rejectReason.trim()) { addToast('Please provide a reason for rejection', 'error'); return }
    setSaving(true)
    try {
      updateExpenseReport(rejectingReportId, {
        status: 'rejected',
        approved_by: currentEmployeeId,
        approved_at: new Date().toISOString(),
        rejection_reason: rejectReason.trim(),
      })
      setShowRejectModal(false)
      setRejectingReportId(null)
      setRejectReason('')
    } finally { setSaving(false) }
  }

  // ---- Draft Saving ----
  const [hasDraft, setHasDraft] = useState(false)
  const DRAFT_KEY = 'tempo_expense_draft'

  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY)
      if (saved) setHasDraft(true)
    } catch {}
  }, [])

  function saveDraft() {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(reportForm))
      addToast('Draft saved')
      setHasDraft(true)
    } catch {}
  }

  function loadDraft() {
    try {
      const saved = localStorage.getItem(DRAFT_KEY)
      if (saved) {
        const data = JSON.parse(saved)
        setReportForm(data)
        setShowReportModal(true)
        addToast('Draft loaded')
      }
    } catch {}
  }

  function clearDraft() {
    try { localStorage.removeItem(DRAFT_KEY) } catch {}
    setHasDraft(false)
  }

  // ---- Policy Warnings for Submit Flow ----
  const submitPolicyWarnings = useMemo(() => {
    const warnings: string[] = []
    reportForm.items.forEach(item => {
      if (!item.amount || !item.category) return
      const policy = expensePolicies.find((p: any) => p.category?.toLowerCase() === item.category?.toLowerCase() && p.status === 'active') as any
      if (policy) {
        if (policy.daily_limit && item.amount > policy.daily_limit) {
          warnings.push(`"${item.description || item.category}" ($${item.amount}) exceeds ${item.category} daily limit of $${policy.daily_limit}`)
        }
        if (policy.receipt_threshold && item.amount > policy.receipt_threshold && receiptUploads.length === 0) {
          warnings.push(`"${item.description || item.category}" ($${item.amount}) requires a receipt (threshold: $${policy.receipt_threshold})`)
        }
      }
      // General high-amount warning
      if (item.amount > 500 && !warnings.some(w => w.includes(item.description || item.category))) {
        warnings.push(`"${item.description || item.category}" ($${item.amount}) exceeds $500 and may require additional approval`)
      }
    })
    return warnings
  }, [reportForm.items, expensePolicies, receiptUploads.length])

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
    if (filterTeamOnly && canApproveExpenses) reports = reports.filter(r => directReportIds.has(r.employee_id))
    return reports
  }, [expenseReports, searchQuery, filterStatus, getEmployeeName, filterTeamOnly, canApproveExpenses, directReportIds])

  // AI Data
  const spendingInsights = useMemo(() => analyzeSpendingTrends(expenseReports), [expenseReports])
  const categoryAnalysis = useMemo(() => analyzeExpenseByCategory(expenseReports), [expenseReports])
  const categoryData = categoryAnalysis.categoryBreakdown
  const policyViolations = useMemo(() => detectPolicyViolations(expenseReports, expensePolicies as any[]), [expenseReports, expensePolicies])
  const spendingForecast = useMemo(() => forecastMonthlySpending(expenseReports), [expenseReports])

  const aiExpenseInsights = useMemo(() => {
    return [...(categoryAnalysis.insights || []), ...spendingInsights]
  }, [categoryAnalysis.insights, spendingInsights])

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

  // ---- Receipt Matching Stats ----
  const receiptMatchStats = useMemo(() => {
    const matched = receiptMatches.filter((r: any) => r.match_status === 'matched').length
    const mismatches = receiptMatches.filter((r: any) => ['mismatch_amount', 'mismatch_vendor', 'mismatch_date'].includes(r.match_status)).length
    const pending = receiptMatches.filter((r: any) => r.match_status === 'pending').length
    const noReceipt = receiptMatches.filter((r: any) => r.match_status === 'no_receipt').length
    const avgConfidence = receiptMatches.filter((r: any) => r.confidence != null).reduce((a: number, r: any) => a + (r.confidence || 0), 0) / Math.max(1, receiptMatches.filter((r: any) => r.confidence != null).length)
    return { total: receiptMatches.length, matched, mismatches, pending, noReceipt, avgConfidence: Math.round(avgConfidence * 100) }
  }, [receiptMatches])

  // ---- Mileage Entry Stats ----
  const mileageEntryStats = useMemo(() => {
    const totalMiles = mileageEntries.reduce((a: number, m: any) => a + m.distance_miles, 0)
    const totalAmount = mileageEntries.reduce((a: number, m: any) => a + m.amount, 0)
    const pendingCount = mileageEntries.filter((m: any) => m.status === 'pending').length
    const approvedCount = mileageEntries.filter((m: any) => m.status === 'approved').length
    // Monthly summary
    const currentMonth = new Date().toISOString().slice(0, 7)
    const monthEntries = mileageEntries.filter((m: any) => m.date?.startsWith(currentMonth))
    const monthlyMiles = monthEntries.reduce((a: number, m: any) => a + m.distance_miles, 0)
    const monthlyAmount = monthEntries.reduce((a: number, m: any) => a + m.amount, 0)
    return { totalMiles, totalAmount, pendingCount, approvedCount, monthlyMiles, monthlyAmount, total: mileageEntries.length }
  }, [mileageEntries])

  // ---- Reimbursement Stats ----
  const reimbursementStats = useMemo(() => {
    const totalBatches = reimbursementBatches.length
    const completedBatches = reimbursementBatches.filter((b: any) => b.status === 'completed').length
    const pendingBatches = reimbursementBatches.filter((b: any) => b.status === 'pending').length
    const totalReimbursed = reimbursementBatches.filter((b: any) => b.status === 'completed').reduce((a: number, b: any) => a + b.total_amount, 0)
    const pendingAmount = reimbursementBatches.filter((b: any) => b.status === 'pending').reduce((a: number, b: any) => a + b.total_amount, 0)
    return { totalBatches, completedBatches, pendingBatches, totalReimbursed, pendingAmount }
  }, [reimbursementBatches])

  // ---- Duplicate Detection Stats ----
  const duplicateStats = useMemo(() => {
    const flagged = duplicateDetections.filter((d: any) => d.status === 'flagged').length
    const confirmed = duplicateDetections.filter((d: any) => d.status === 'confirmed_duplicate').length
    const dismissed = duplicateDetections.filter((d: any) => d.status === 'dismissed').length
    const amountSaved = duplicateDetections.filter((d: any) => d.status === 'confirmed_duplicate').reduce((a: number, d: any) => a + (d.duplicate_amount || 0), 0)
    return { total: duplicateDetections.length, flagged, confirmed, dismissed, amountSaved }
  }, [duplicateDetections])

  // ---- Advanced Policy Violation Log ----
  const advancedPolicyViolationLog = useMemo(() => {
    const violations: Array<{ id: string; employee: string; expense: string; policy: string; rule: string; action: string; amount: number }> = []
    expenseReports.forEach((report: any) => {
      if (!report.items) return
      report.items.forEach((item: any) => {
        advancedExpensePolicies.forEach((policy: any) => {
          if (!policy.is_active || !policy.rules) return
          policy.rules.forEach((rule: any) => {
            let violated = false
            if (rule.field === 'amount' && rule.operator === '>' && item.amount > rule.value) violated = true
            if (rule.field === 'amount' && rule.operator === '<' && item.amount < rule.value) violated = true
            if (rule.field === 'category' && rule.operator === '=' && item.category?.toLowerCase() === String(rule.value).toLowerCase()) violated = true
            if (rule.field === 'category' && rule.operator === 'contains' && item.category?.toLowerCase().includes(String(rule.value).toLowerCase())) violated = true
            if (violated) {
              violations.push({
                id: `v-${report.id}-${item.id}-${policy.id}`,
                employee: getEmployeeName(report.employee_id),
                expense: item.description || report.title,
                policy: policy.name,
                rule: `${rule.field} ${rule.operator} ${rule.value}`,
                action: rule.action,
                amount: item.amount,
              })
            }
          })
        })
      })
    })
    return violations
  }, [expenseReports, advancedExpensePolicies, getEmployeeName])

  // Approved reports available for reimbursement
  const approvedForReimbursement = useMemo(() => {
    const reimbursedIds = new Set<string>()
    reimbursementBatches.forEach((b: any) => {
      if (b.items) b.items.forEach((item: any) => { if (item.expense_report_id) reimbursedIds.add(item.expense_report_id) })
    })
    return expenseReports.filter((r: any) => r.status === 'approved' && !reimbursedIds.has(r.id))
  }, [expenseReports, reimbursementBatches])

  // ---- Mileage Entry CRUD ----
  function submitMileageEntry() {
    if (!mileageEntryForm.employee_id) { addToast('Employee is required', 'error'); return }
    if (!mileageEntryForm.date) { addToast('Date is required', 'error'); return }
    if (!mileageEntryForm.start_location) { addToast('Start location is required', 'error'); return }
    if (!mileageEntryForm.end_location) { addToast('End location is required', 'error'); return }
    if (!mileageEntryForm.distance_miles) { addToast('Distance is required', 'error'); return }
    setSaving(true)
    try {
      const amount = Number((mileageEntryForm.distance_miles * mileageEntryForm.rate).toFixed(2))
      addMileageEntry({ ...mileageEntryForm, amount, status: 'pending', approved_by: null })
      setShowMileageEntryModal(false)
      setMileageEntryForm({ employee_id: '', date: '', start_location: '', end_location: '', distance_miles: 0, rate: 0.67, purpose: '', vehicle_type: 'personal', trip_type: 'one_way' })
    } finally { setSaving(false) }
  }

  // ---- Advanced Policy CRUD ----
  function submitAdvancedPolicy() {
    if (!advancedPolicyForm.name) { addToast('Policy name is required', 'error'); return }
    setSaving(true)
    try {
      addAdvancedExpensePolicy({ ...advancedPolicyForm })
      setShowAdvancedPolicyModal(false)
      setAdvancedPolicyForm({ name: '', is_active: true, applies_to: 'all', rules: [{ field: 'amount', operator: '>', value: 0, action: 'warn' }] })
    } finally { setSaving(false) }
  }

  // ---- Reimbursement Batch ----
  function submitReimbursementBatch() {
    if (selectedReimbursementIds.size === 0) { addToast('Select at least one expense to reimburse', 'error'); return }
    setSaving(true)
    try {
      const selectedReports = approvedForReimbursement.filter((r: any) => selectedReimbursementIds.has(r.id))
      const totalAmount = selectedReports.reduce((a: number, r: any) => a + r.total_amount, 0)
      const items = selectedReports.map((r: any) => ({
        id: `ri-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        expense_report_id: r.id,
        employee_id: r.employee_id,
        amount: r.total_amount,
        currency: r.currency || 'USD',
        status: 'pending' as const,
        notes: r.title,
      }))
      addReimbursementBatch({
        status: 'pending',
        method: reimbursementMethod,
        total_amount: totalAmount,
        currency: 'USD',
        employee_count: new Set(selectedReports.map((r: any) => r.employee_id)).size,
        processed_at: null,
        payroll_run_id: null,
        items,
      })
      setShowReimbursementModal(false)
      setSelectedReimbursementIds(new Set())
    } finally { setSaving(false) }
  }

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
    setReportForm({ employee_id: currentEmployeeId || employees[0]?.id || '', title: '', currency: 'USD', items: [{ description: '', category: 'travel', amount: 0, date: new Date().toISOString().split('T')[0] }] })
    setReceiptUploads([])
    setShowReportModal(true)
  }

  function addLineItem() {
    setReportForm({ ...reportForm, items: [...reportForm.items, { description: '', category: 'travel', amount: 0, date: new Date().toISOString().split('T')[0] }] })
  }

  function applyQuickAdd(template: typeof quickAddTemplates[0]) {
    const emptyIdx = reportForm.items.findIndex(item => !item.description && !item.amount)
    if (emptyIdx >= 0) {
      const updated = [...reportForm.items]
      updated[emptyIdx] = { description: template.description, category: template.category, amount: template.defaultAmount, date: new Date().toISOString().split('T')[0] }
      setReportForm({ ...reportForm, items: updated })
    } else {
      setReportForm({ ...reportForm, items: [...reportForm.items, { description: template.description, category: template.category, amount: template.defaultAmount, date: new Date().toISOString().split('T')[0] }] })
    }
  }

  function updateLineItem(index: number, field: string, value: string | number) {
    const updated = reportForm.items.map((item, i) => i === index ? { ...item, [field]: value } : item)
    setReportForm({ ...reportForm, items: updated })
  }

  function removeLineItem(index: number) {
    if (reportForm.items.length <= 1) return
    setReportForm({ ...reportForm, items: reportForm.items.filter((_, i) => i !== index) })
  }

  // T5 #35: Duplicate expense detection state
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false)
  const [duplicateMatch, setDuplicateMatch] = useState<any>(null)
  const [duplicateConfirmed, setDuplicateConfirmed] = useState(false)
  const reportSubmittingRef = useRef(false)

  function submitReport() {
    if (reportSubmittingRef.current) return
    if (!reportForm.employee_id) { addToast('Employee is required', 'error'); return }
    if (!reportForm.title) { addToast('Report title is required', 'error'); return }
    const validItems = reportForm.items.filter(item => item.description && item.amount > 0)
    if (validItems.length === 0) { addToast('At least one line item with description and amount is required', 'error'); return }
    const totalAmount = validItems.reduce((a, item) => a + Number(item.amount), 0)

    // T5 #35: Check for duplicate submissions within 7 days
    if (!duplicateConfirmed) {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      const possibleDup = expenseReports.find((r: any) =>
        r.employee_id === reportForm.employee_id &&
        (r.totalAmount || r.total_amount) === totalAmount &&
        (r.submittedAt || r.submitted_at) && (r.submittedAt || r.submitted_at) > sevenDaysAgo
      )
      if (possibleDup) {
        setDuplicateMatch(possibleDup)
        setShowDuplicateWarning(true)
        return
      }
    }

    reportSubmittingRef.current = true
    setSaving(true)
    try {
      addExpenseReport({
        employee_id: reportForm.employee_id, title: reportForm.title, total_amount: totalAmount, currency: reportForm.currency,
        status: 'submitted', submitted_at: new Date().toISOString(),
        items: validItems.map((item) => ({ id: crypto.randomUUID(), description: item.description, category: item.category, amount: Number(item.amount), date: item.date || new Date().toISOString().split('T')[0] })),
        receipt_count: receiptUploads.filter(r => r.status === 'done').length,
      })
      setShowReportModal(false)
      setDuplicateConfirmed(false)
      setReceiptUploads([])
      clearDraft()
    } finally {
      setSaving(false)
      setTimeout(() => { reportSubmittingRef.current = false }, 0)
    }
  }

  function approveReport(id: string) { setSaving(true); try { updateExpenseReport(id, { status: 'approved', approved_by: currentEmployeeId, approved_at: new Date().toISOString() }) } finally { setSaving(false) } }
  function rejectReport(id: string) { setSaving(true); try { updateExpenseReport(id, { status: 'rejected', approved_by: currentEmployeeId, approved_at: new Date().toISOString() }) } finally { setSaving(false) } }
  function reimburseReport(id: string) { updateExpenseReport(id, { status: 'reimbursed', reimbursed_at: new Date().toISOString() }) }
  function confirmDelete() { if (deleteConfirm) { deleteExpenseReport(deleteConfirm); setDeleteConfirm(null) } }

  function executeConfirmAction() {
    if (!confirmAction) return
    setSaving(true)
    try {
      switch (confirmAction.type) {
        case 'reject_report':
          rejectReport(confirmAction.id)
          break
        case 'delete_advanced_policy':
          deleteAdvancedExpensePolicy(confirmAction.id)
          break
      }
    } finally {
      setSaving(false)
      setConfirmAction(null)
    }
  }

  // ---- Policy CRUD ----
  function openAddPolicy() { setPolicyForm({ category: '', daily_limit: 0, receipt_threshold: 0, auto_approve_limit: 0, status: 'active' }); setEditingPolicyId(null); setShowPolicyModal(true) }
  function openEditPolicy(id: string) {
    const p = expensePolicies.find(pol => pol.id === id) as any
    if (!p) return
    setPolicyForm({ category: p.category, daily_limit: p.daily_limit, receipt_threshold: p.receipt_threshold, auto_approve_limit: p.auto_approve_limit, status: p.status })
    setEditingPolicyId(id); setShowPolicyModal(true)
  }
  function submitPolicy() {
    if (!policyForm.category) { addToast('Policy category is required', 'error'); return }
    setSaving(true)
    try {
      if (editingPolicyId) { updateExpensePolicy(editingPolicyId, policyForm) } else { addExpensePolicy(policyForm) }
      setShowPolicyModal(false)
    } finally { setSaving(false) }
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
    if (!mileageForm.employee_id) { addToast('Employee is required', 'error'); return }
    if (!mileageForm.origin) { addToast('Origin is required', 'error'); return }
    if (!mileageForm.destination) { addToast('Destination is required', 'error'); return }
    if (!mileageForm.distance_km) { addToast('Distance is required', 'error'); return }
    setSaving(true)
    try {
      const amount = Number((mileageForm.distance_km * mileageForm.rate_per_km).toFixed(2))
      addMileageLog({ ...mileageForm, amount, status: 'pending' })
      setShowMileageModal(false)
      setMileageForm({ employee_id: '', date: '', origin: '', destination: '', distance_km: 0, rate_per_km: 0.58 })
    } finally { setSaving(false) }
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
    if (bulkExpSelectedReports.length === 0) { addToast('Select at least one report', 'error'); return }
    setSaving(true)
    try {
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
    } finally { setSaving(false) }
  }

  const forecastInsight = useMemo(() => ({
    id: 'ai-expense-forecast', category: 'prediction' as const, severity: 'info' as const,
    title: t('spendingForecast'),
    description: t('projectedMonthly', { amount: spendingForecast.projected.toLocaleString(), trend: spendingForecast.trend, confidence: spendingForecast.confidence }),
    confidence: (spendingForecast.confidence >= 75 ? 'high' : spendingForecast.confidence >= 50 ? 'medium' : 'low') as 'high' | 'medium' | 'low',
    confidenceScore: spendingForecast.confidence,
    suggestedAction: 'Review spending policies and approval thresholds', module: 'expense',
  }), [spendingForecast, t])

  if (pageLoading) {
    return (
      <>
        <Header title={t('title')} subtitle={t('subtitle')} />
        <div className="p-6"><PageSkeleton /></div>
      </>
    )
  }

  return (
    <>
      <Header title={t('title')} subtitle={t('subtitle')}
        actions={<div className="flex gap-2">{pendingExpenseReports.length > 0 && <Button size="sm" variant="secondary" onClick={() => setShowBulkExpenseModal(true)}><CheckCircle size={14} /> Bulk Approve</Button>}<Button size="sm" onClick={openNewReport}><Plus size={14} /> {t('newReport')}</Button></div>}
      />

      {/* Stats */}
      <ExpandableStats>
        <StatCard label={t('pendingReview')} value={pendingReports.length} icon={<Clock size={20} />} />
        <StatCard label={t('pendingAmount')} value={`$${totalPending.toLocaleString()}`} change="Awaiting approval" changeType="neutral" icon={<DollarSign size={20} />} />
        <StatCard label={t('approvedReimbursed')} value={`$${reimbursedTotal.toLocaleString()}`} change={tc('thisQuarter')} changeType="positive" />
        <StatCard label={t('totalReports')} value={expenseReports.length} icon={<Receipt size={20} />} />
      </ExpandableStats>

      {/* AI Insights */}
      {aiExpenseInsights.length > 0 && (
        <AIInsightsCard
          insights={aiExpenseInsights}
          title="Expense AI Insights"
          maxVisible={3}
          className="mb-6"
        />
      )}

      {spendingInsights.length > 0 && <AIAlertBanner insights={spendingInsights} className="mb-4" />}

      {/* Tabs */}
      <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} className="mb-6" />

      {/* ============================================================ */}
      {/* TAB 1: REPORTS */}
      {/* ============================================================ */}
      {activeTab === 'reports' && (
        <>
          {/* Search & Filters */}
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-t3" />
              <input className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-lg bg-surface text-t1 focus:outline-none focus:ring-2 focus:ring-tempo-500/30"
                placeholder={t('searchReports')} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>
            <Select className="px-3 py-2 text-sm border border-border rounded-lg bg-surface text-t1" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              options={[{value: '', label: t('filterByStatus')}, {value: 'submitted', label: 'Submitted'}, {value: 'pending_approval', label: 'Pending Approval'}, {value: 'approved', label: 'Approved'}, {value: 'rejected', label: 'Rejected'}, {value: 'reimbursed', label: 'Reimbursed'}]} />
            {canApproveExpenses && (
              <label className="flex items-center gap-2 px-3 py-2 text-sm border border-border rounded-lg bg-surface cursor-pointer whitespace-nowrap">
                <input type="checkbox" checked={filterTeamOnly} onChange={e => setFilterTeamOnly(e.target.checked)} className="accent-tempo-500" />
                <Users size={14} /> My Team
              </label>
            )}
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
                        {(report.status === 'submitted' || report.status === 'pending_approval') && canApproveExpenses && report.employee_id !== currentEmployeeId && (
                          <>
                            <Button size="sm" variant="primary" onClick={() => approveReport(report.id)}><CheckCircle size={12} /> {tc('approve')}</Button>
                            <Button size="sm" variant="danger" onClick={() => openRejectDialog(report.id)}><XCircle size={12} /> {tc('reject')}</Button>
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

                        {/* Inline Comment Thread */}
                        <div className="mt-4 border-t border-divider pt-4">
                          <div className="flex items-center gap-2 mb-3">
                            <MessageCircle size={14} className="text-t3" />
                            <span className="text-xs font-semibold text-t1">Comments</span>
                            {(reportComments[report.id]?.length || 0) > 0 && (
                              <Badge variant="default">{reportComments[report.id].length}</Badge>
                            )}
                          </div>

                          {/* Comment list */}
                          <div className="space-y-3 mb-3">
                            {(reportComments[report.id] || []).map(comment => {
                              const initials = comment.author.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                              return (
                                <div key={comment.id} className="flex items-start gap-3">
                                  <div className="w-7 h-7 rounded-full bg-tempo-100 dark:bg-tempo-900/40 flex items-center justify-center shrink-0">
                                    <span className="text-[10px] font-semibold text-tempo-700 dark:text-tempo-300">{initials}</span>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-baseline gap-2">
                                      <span className="text-xs font-medium text-t1">{comment.author}</span>
                                      <span className="text-[10px] text-t3">{new Date(comment.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <p className="text-xs text-t2 mt-0.5 bg-canvas rounded-lg rounded-tl-none px-3 py-2">{comment.text}</p>
                                  </div>
                                </div>
                              )
                            })}
                            {(!reportComments[report.id] || reportComments[report.id].length === 0) && (
                              <p className="text-[10px] text-t3 italic">No comments yet. Start the discussion below.</p>
                            )}
                          </div>

                          {/* Add comment input */}
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-tempo-100 dark:bg-tempo-900/40 flex items-center justify-center shrink-0">
                              <span className="text-[10px] font-semibold text-tempo-700 dark:text-tempo-300">
                                {(currentUser?.full_name || 'Y').split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                              </span>
                            </div>
                            <div className="flex-1 flex items-center gap-2 bg-canvas rounded-lg border border-border px-3 py-1.5">
                              <input
                                type="text"
                                className="flex-1 bg-transparent text-xs text-t1 placeholder:text-t3 outline-none"
                                placeholder="Add a comment..."
                                value={commentInputs[report.id] || ''}
                                onChange={e => setCommentInputs(prev => ({ ...prev, [report.id]: e.target.value }))}
                                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addComment(report.id) } }}
                              />
                              <button
                                onClick={() => addComment(report.id)}
                                disabled={!(commentInputs[report.id] || '').trim()}
                                className="p-1 rounded text-tempo-600 hover:text-tempo-700 disabled:text-t3 disabled:cursor-not-allowed transition-colors"
                              >
                                <Send size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
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

          {/* Duplicate Detection */}
          {duplicateDetections.length > 0 && (
            <Card padding="none" className="mt-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Copy size={16} className="text-amber-500" />
                    <CardTitle>Duplicate Detection</CardTitle>
                    <Badge variant="warning">{duplicateStats.flagged} flagged</Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-t3">
                    <span>{duplicateStats.confirmed} confirmed</span>
                    <span>{duplicateStats.dismissed} dismissed</span>
                    <span className="text-emerald-600 font-medium">${duplicateStats.amountSaved.toLocaleString()} saved</span>
                  </div>
                </div>
              </CardHeader>
              <div className="divide-y divide-divider">
                {duplicateDetections.map((dup: any) => (
                  <div key={dup.id} className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${dup.status === 'flagged' ? 'bg-amber-50 dark:bg-amber-950/30' : dup.status === 'confirmed_duplicate' ? 'bg-red-50 dark:bg-red-950/30' : 'bg-gray-50 dark:bg-gray-800/30'}`}>
                        <Copy size={16} className={dup.status === 'flagged' ? 'text-amber-500' : dup.status === 'confirmed_duplicate' ? 'text-red-500' : 'text-gray-400'} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-t1">{dup.expense_description}</span>
                          <span className="text-xs text-t3">vs</span>
                          <span className="text-xs font-medium text-t1">{dup.duplicate_description}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-t3">
                          <span>{getEmployeeName(dup.employee_id)}</span>
                          <span className="font-medium">{Math.round((dup.similarity || 0) * 100)}% similar</span>
                          {dup.fields && (
                            <span>Matching: {Object.entries(dup.fields).filter(([, v]) => v).map(([k]) => k).join(', ')}</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-t1">${dup.expense_amount} / ${dup.duplicate_amount}</p>
                      </div>
                      <Badge variant={dup.status === 'flagged' ? 'warning' : dup.status === 'confirmed_duplicate' ? 'error' : 'default'}>
                        {dup.status.replace('_', ' ')}
                      </Badge>
                      {dup.status === 'flagged' && (
                        <div className="flex gap-1 shrink-0">
                          <Button size="sm" variant="ghost" onClick={() => updateDuplicateDetection(dup.id, { status: 'confirmed_duplicate', reviewed_by: currentEmployeeId })}>
                            Confirm
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => updateDuplicateDetection(dup.id, { status: 'dismissed', reviewed_by: currentEmployeeId })}>
                            Dismiss
                          </Button>
                        </div>
                      )}
                    </div>

                    {showDuplicateDetail === dup.id && (
                      <div className="mt-3 ml-12 grid grid-cols-2 gap-3">
                        <div className="bg-canvas rounded-lg p-3 border border-border">
                          <p className="text-[10px] uppercase text-t3 mb-1 font-medium">Original Expense</p>
                          <p className="text-xs font-medium text-t1">{dup.expense_description}</p>
                          <p className="text-xs text-t2">${dup.expense_amount}</p>
                        </div>
                        <div className="bg-canvas rounded-lg p-3 border border-border">
                          <p className="text-[10px] uppercase text-t3 mb-1 font-medium">Potential Duplicate</p>
                          <p className="text-xs font-medium text-t1">{dup.duplicate_description}</p>
                          <p className="text-xs text-t2">${dup.duplicate_amount}</p>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => setShowDuplicateDetail(showDuplicateDetail === dup.id ? null : dup.id)}
                      className="ml-12 mt-1 text-[10px] text-tempo-600 hover:text-tempo-700"
                    >
                      {showDuplicateDetail === dup.id ? 'Hide details' : 'Show details'}
                    </button>
                  </div>
                ))}
              </div>
            </Card>
          )}
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
                <Select className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-surface text-t1" value={perDiemCountry} onChange={e => setPerDiemCountry(e.target.value)}
                  options={[...new Set(perDiemRates.map(r => r.country))].map(c => ({value: c, label: c}))} />
              </div>
              <DatePicker label={t('startDate')} value={perDiemStart} onChange={d => setPerDiemStart(d.toISOString().split('T')[0])} />
              <DatePicker label={t('endDate')} value={perDiemEnd} onChange={d => setPerDiemEnd(d.toISOString().split('T')[0])} />
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
      {/* TAB: RECEIPT MANAGEMENT */}
      {/* ============================================================ */}
      {activeTab === 'receipt-management' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard label="Total Receipts" value={receiptMatchStats.total} icon={<Receipt size={20} />} />
            <StatCard label="Matched" value={receiptMatchStats.matched} change={`${receiptMatchStats.avgConfidence}% avg confidence`} changeType="positive" icon={<CheckCircle2 size={20} />} />
            <StatCard label="Mismatches" value={receiptMatchStats.mismatches} change="Needs review" changeType={receiptMatchStats.mismatches > 0 ? 'negative' : 'positive'} icon={<AlertTriangle size={20} />} />
            <StatCard label="Pending" value={receiptMatchStats.pending} change="AI processing" changeType="neutral" icon={<Clock size={20} />} />
          </div>

          {/* Bulk Upload Area */}
          <Card className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Upload size={16} className="text-tempo-500" />
              <span className="text-sm font-semibold text-t1">Bulk Receipt Upload</span>
              <Badge variant="ai">AI-Powered</Badge>
            </div>
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-tempo-400 hover:bg-tempo-50/30 transition-colors cursor-pointer">
              <Upload size={32} className="mx-auto text-t3 mb-3" />
              <p className="text-sm text-t2 mb-1">Drag & drop multiple receipts here</p>
              <p className="text-xs text-t3">PNG, JPG, PDF supported. AI will auto-extract amount, vendor, and date.</p>
            </div>
          </Card>

          {/* Mismatch Alerts */}
          {receiptMatches.filter((r: any) => ['mismatch_amount', 'mismatch_vendor', 'mismatch_date'].includes(r.match_status)).length > 0 && (
            <Card className="mb-6">
              <h3 className="text-sm font-semibold text-t1 mb-3 flex items-center gap-2">
                <AlertTriangle size={16} className="text-amber-500" /> Mismatch Alerts
              </h3>
              <div className="space-y-2">
                {receiptMatches.filter((r: any) => ['mismatch_amount', 'mismatch_vendor', 'mismatch_date'].includes(r.match_status)).map((match: any) => (
                  <div key={match.id} className="flex items-center gap-3 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-lg px-4 py-3">
                    <Badge variant="warning">{match.match_status.replace('mismatch_', '').replace('_', ' ')}</Badge>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-t1">{match.extracted_vendor}</p>
                      <p className="text-xs text-t3">{match.discrepancy_notes}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-semibold text-t1">${match.extracted_amount}</p>
                      <p className="text-xs text-t3">{match.confidence ? `${Math.round(match.confidence * 100)}% confidence` : 'N/A'}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button size="sm" variant="ghost" onClick={() => updateReceiptMatch(match.id, { match_status: 'matched' })}>
                        <CheckCircle size={12} /> Accept
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => updateReceiptMatch(match.id, { match_status: 'no_receipt' })}>
                        <XCircle size={12} /> Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Receipt Match Table */}
          <Card padding="none">
            <CardHeader>
              <CardTitle>Receipt Matching Results</CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-divider bg-canvas">
                    <th className="tempo-th text-left px-6 py-3">Receipt</th>
                    <th className="tempo-th text-left px-4 py-3">Vendor</th>
                    <th className="tempo-th text-right px-4 py-3">Amount</th>
                    <th className="tempo-th text-center px-4 py-3">Date</th>
                    <th className="tempo-th text-center px-4 py-3">Confidence</th>
                    <th className="tempo-th text-center px-4 py-3">Status</th>
                    <th className="tempo-th text-center px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {receiptMatches.length === 0 ? (
                    <tr><td colSpan={7} className="px-6 py-12 text-center text-xs text-t3">No receipt matches yet</td></tr>
                  ) : receiptMatches.map((match: any) => (
                    <tr key={match.id} className="hover:bg-canvas/50">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <FileText size={14} className="text-t3" />
                          <span className="text-xs font-medium text-t1">{match.receipt_url?.split('/').pop() || 'Receipt'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-t2">{match.extracted_vendor || 'Unknown'}</td>
                      <td className="px-4 py-3 text-xs text-t1 text-right font-semibold">${match.extracted_amount || 0}</td>
                      <td className="px-4 py-3 text-xs text-t2 text-center">{match.extracted_date || 'N/A'}</td>
                      <td className="px-4 py-3 text-center">
                        {match.confidence != null ? (
                          <span className={`text-xs font-semibold ${match.confidence >= 0.9 ? 'text-emerald-600' : match.confidence >= 0.7 ? 'text-amber-600' : 'text-red-600'}`}>
                            {Math.round(match.confidence * 100)}%
                          </span>
                        ) : <span className="text-xs text-t3">--</span>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={
                          match.match_status === 'matched' ? 'success' :
                          match.match_status === 'pending' ? 'warning' :
                          match.match_status === 'no_receipt' ? 'error' : 'warning'
                        }>
                          {match.match_status.replace(/_/g, ' ')}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {match.match_status === 'pending' && (
                          <Button size="sm" variant="ghost" onClick={() => updateReceiptMatch(match.id, { match_status: 'matched', confidence: 0.95 })}>
                            Match
                          </Button>
                        )}
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
      {/* TAB: MILEAGE */}
      {/* ============================================================ */}
      {activeTab === 'mileage' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard label="Total Miles" value={`${mileageEntryStats.totalMiles.toFixed(1)} mi`} icon={<Navigation size={20} />} />
            <StatCard label="Total Amount" value={`$${mileageEntryStats.totalAmount.toFixed(2)}`} change={`${mileageEntryStats.total} entries`} changeType="neutral" icon={<DollarSign size={20} />} />
            <StatCard label="Pending Approval" value={mileageEntryStats.pendingCount} change="Awaiting review" changeType={mileageEntryStats.pendingCount > 0 ? 'negative' : 'positive'} icon={<Clock size={20} />} />
            <StatCard label="This Month" value={`${mileageEntryStats.monthlyMiles.toFixed(1)} mi`} change={`$${mileageEntryStats.monthlyAmount.toFixed(2)}`} changeType="neutral" icon={<Car size={20} />} />
          </div>

          {/* Monthly Mileage Summary */}
          <Card className="mb-6">
            <h3 className="text-sm font-semibold text-t1 mb-3">Monthly Summary</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-canvas rounded-lg p-4">
                <p className="text-xs text-t3 mb-1">Approved This Month</p>
                <p className="text-lg font-bold text-t1">{mileageEntries.filter((m: any) => m.status === 'approved' && m.date?.startsWith(new Date().toISOString().slice(0, 7))).length}</p>
                <p className="text-xs text-emerald-600">$
                  {mileageEntries.filter((m: any) => m.status === 'approved' && m.date?.startsWith(new Date().toISOString().slice(0, 7))).reduce((a: number, m: any) => a + m.amount, 0).toFixed(2)}
                </p>
              </div>
              <div className="bg-canvas rounded-lg p-4">
                <p className="text-xs text-t3 mb-1">IRS Rate (2026)</p>
                <p className="text-lg font-bold text-t1">$0.67</p>
                <p className="text-xs text-t3">per mile</p>
              </div>
              <div className="bg-canvas rounded-lg p-4">
                <p className="text-xs text-t3 mb-1">Avg Trip Distance</p>
                <p className="text-lg font-bold text-t1">
                  {mileageEntries.length > 0 ? (mileageEntryStats.totalMiles / mileageEntries.length).toFixed(1) : 0} mi
                </p>
                <p className="text-xs text-t3">across {mileageEntries.length} trips</p>
              </div>
            </div>
          </Card>

          {/* Map Visualization Placeholder */}
          <Card className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <MapPin size={16} className="text-tempo-500" />
              <h3 className="text-sm font-semibold text-t1">Route Map</h3>
              <Badge variant="default">Preview</Badge>
            </div>
            <div className="bg-canvas rounded-lg p-8 text-center border border-dashed border-border">
              <Globe size={48} className="mx-auto text-t3 mb-3 opacity-50" />
              <p className="text-sm text-t2 mb-1">Route visualization</p>
              <p className="text-xs text-t3">Map integration showing trip routes will be available in the next release</p>
            </div>
          </Card>

          {/* Mileage Log Table */}
          <Card padding="none">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Mileage Log</CardTitle>
                <Button size="sm" onClick={() => { setMileageEntryForm({ employee_id: employees[0]?.id || '', date: '', start_location: '', end_location: '', distance_miles: 0, rate: 0.67, purpose: '', vehicle_type: 'personal', trip_type: 'one_way' }); setShowMileageEntryModal(true) }}>
                  <Plus size={14} /> Add Entry
                </Button>
              </div>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-divider bg-canvas">
                    <th className="tempo-th text-left px-6 py-3">Employee</th>
                    <th className="tempo-th text-left px-4 py-3">Date</th>
                    <th className="tempo-th text-left px-4 py-3">Route</th>
                    <th className="tempo-th text-right px-4 py-3">Distance</th>
                    <th className="tempo-th text-right px-4 py-3">Amount</th>
                    <th className="tempo-th text-center px-4 py-3">Vehicle</th>
                    <th className="tempo-th text-center px-4 py-3">Trip</th>
                    <th className="tempo-th text-center px-4 py-3">Status</th>
                    <th className="tempo-th text-center px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {mileageEntries.length === 0 ? (
                    <tr><td colSpan={9} className="px-6 py-12 text-center text-xs text-t3">No mileage entries</td></tr>
                  ) : mileageEntries.map((entry: any) => (
                    <tr key={entry.id} className="hover:bg-canvas/50">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar name={getEmployeeName(entry.employee_id)} size="sm" />
                          <span className="text-xs font-medium text-t1">{getEmployeeName(entry.employee_id)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-t2">{entry.date}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-xs text-t2">
                          <span>{entry.start_location}</span>
                          <ArrowRight size={10} className="text-t3 shrink-0" />
                          <span>{entry.end_location}</span>
                        </div>
                        {entry.purpose && <p className="text-[10px] text-t3 mt-0.5">{entry.purpose}</p>}
                      </td>
                      <td className="px-4 py-3 text-xs text-t1 text-right font-medium">{entry.distance_miles} mi</td>
                      <td className="px-4 py-3 text-xs text-t1 text-right font-semibold">${entry.amount?.toFixed(2)}</td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant="default">{entry.vehicle_type}</Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant="default">{entry.trip_type?.replace('_', ' ')}</Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={entry.status === 'approved' ? 'success' : entry.status === 'rejected' ? 'error' : 'warning'}>
                          {entry.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {entry.status === 'pending' && (
                          <div className="flex gap-1 justify-center">
                            <Button size="sm" variant="primary" onClick={() => updateMileageEntry(entry.id, { status: 'approved', approved_by: currentEmployeeId })}>
                              Approve
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => updateMileageEntry(entry.id, { status: 'rejected', approved_by: currentEmployeeId })}>
                              Reject
                            </Button>
                          </div>
                        )}
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
      {/* TAB: ADVANCED POLICIES */}
      {/* ============================================================ */}
      {activeTab === 'advanced-policies' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard label="Active Policies" value={advancedExpensePolicies.filter((p: any) => p.is_active).length} icon={<Zap size={20} />} />
            <StatCard label="Total Rules" value={advancedExpensePolicies.reduce((a: number, p: any) => a + (p.rules?.length || 0), 0)} change="Across all policies" changeType="neutral" icon={<Shield size={20} />} />
            <StatCard label="Violations Caught" value={advancedPolicyViolationLog.length} change={`$${advancedPolicyViolationLog.reduce((a, v) => a + v.amount, 0).toLocaleString()} flagged`} changeType={advancedPolicyViolationLog.length > 0 ? 'negative' : 'positive'} icon={<AlertTriangle size={20} />} />
            <StatCard label="Blocked Amount" value={`$${advancedPolicyViolationLog.filter(v => v.action === 'block').reduce((a, v) => a + v.amount, 0).toLocaleString()}`} change="Prevented overspend" changeType="positive" icon={<XCircle size={20} />} />
          </div>

          {/* Policy Rules Builder */}
          <Card padding="none" className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Policy Rules</CardTitle>
                <Button size="sm" onClick={() => { setAdvancedPolicyForm({ name: '', is_active: true, applies_to: 'all', rules: [{ field: 'amount', operator: '>', value: 0, action: 'warn' }] }); setShowAdvancedPolicyModal(true) }}>
                  <Plus size={14} /> Add Policy
                </Button>
              </div>
            </CardHeader>
            <div className="divide-y divide-divider">
              {advancedExpensePolicies.length === 0 ? (
                <div className="px-6 py-12 text-center text-sm text-t3">No advanced policies configured</div>
              ) : advancedExpensePolicies.map((policy: any) => (
                <div key={policy.id} className="px-6 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${policy.is_active ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                      <span className="text-sm font-medium text-t1">{policy.name}</span>
                      <Badge variant={policy.is_active ? 'success' : 'default'}>{policy.is_active ? 'Active' : 'Inactive'}</Badge>
                      <Badge variant="default">Applies to: {policy.applies_to}</Badge>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => updateAdvancedExpensePolicy(policy.id, { is_active: !policy.is_active })}>
                        {policy.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setConfirmAction({ show: true, type: 'delete_advanced_policy', id: policy.id, label: policy.name })}>
                        <Trash2 size={12} />
                      </Button>
                    </div>
                  </div>
                  {policy.rules && (
                    <div className="ml-5 space-y-1">
                      {policy.rules.map((rule: any, i: number) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-t2 bg-canvas rounded px-3 py-1.5">
                          <span className="font-medium text-t1">{rule.field}</span>
                          <span className="text-t3">{rule.operator}</span>
                          <span className="font-medium text-t1">{typeof rule.value === 'number' ? `$${rule.value}` : rule.value}</span>
                          <ArrowRight size={10} className="text-t3" />
                          <Badge variant={rule.action === 'block' ? 'error' : rule.action === 'warn' ? 'warning' : 'info'}>
                            {rule.action.replace('_', ' ')}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* Policy Violation Log */}
          <Card padding="none" className="mb-6">
            <CardHeader><CardTitle>Violation Log</CardTitle></CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-divider bg-canvas">
                    <th className="tempo-th text-left px-6 py-3">Employee</th>
                    <th className="tempo-th text-left px-4 py-3">Expense</th>
                    <th className="tempo-th text-left px-4 py-3">Policy</th>
                    <th className="tempo-th text-left px-4 py-3">Rule Violated</th>
                    <th className="tempo-th text-right px-4 py-3">Amount</th>
                    <th className="tempo-th text-center px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {advancedPolicyViolationLog.length === 0 ? (
                    <tr><td colSpan={6} className="px-6 py-12 text-center text-xs text-t3">
                      <CheckCircle2 size={20} className="inline text-emerald-500 mb-1" /><br />No policy violations detected
                    </td></tr>
                  ) : advancedPolicyViolationLog.map(v => (
                    <tr key={v.id} className="hover:bg-canvas/50">
                      <td className="px-6 py-3 text-xs font-medium text-t1">{v.employee}</td>
                      <td className="px-4 py-3 text-xs text-t2">{v.expense}</td>
                      <td className="px-4 py-3 text-xs text-t1 font-medium">{v.policy}</td>
                      <td className="px-4 py-3 text-xs text-t3">{v.rule}</td>
                      <td className="px-4 py-3 text-xs text-t1 text-right font-semibold">${v.amount.toLocaleString()}</td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={v.action === 'block' ? 'error' : v.action === 'warn' ? 'warning' : 'info'}>
                          {v.action.replace('_', ' ')}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Policy Effectiveness */}
          <Card>
            <h3 className="text-sm font-semibold text-t1 mb-3">Policy Effectiveness</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-canvas rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-t1">{advancedPolicyViolationLog.length}</p>
                <p className="text-xs text-t3 mt-1">Violations Caught</p>
              </div>
              <div className="bg-canvas rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-red-600">${advancedPolicyViolationLog.filter(v => v.action === 'block').reduce((a, v) => a + v.amount, 0).toLocaleString()}</p>
                <p className="text-xs text-t3 mt-1">Blocked Amount</p>
              </div>
              <div className="bg-canvas rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-amber-600">{advancedPolicyViolationLog.filter(v => v.action === 'warn').length}</p>
                <p className="text-xs text-t3 mt-1">Warnings Issued</p>
              </div>
            </div>
          </Card>

          {/* ---- Conditional Approval Rules ---- */}
          <Card padding="none" className="mt-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ArrowRight size={16} className="text-tempo-600" />
                  <CardTitle>Approval Rules</CardTitle>
                  <Badge variant="default">{approvalRules.filter(r => r.enabled).length} active</Badge>
                </div>
                <Button size="sm" onClick={() => setShowApprovalRuleBuilder(true)}>
                  <Plus size={14} /> Add Rule
                </Button>
              </div>
            </CardHeader>

            <div className="p-6 space-y-3">
              {approvalRules.length === 0 && (
                <div className="text-center py-8 text-sm text-t3">No approval rules configured. Add a rule to automate expense routing.</div>
              )}
              {approvalRules.map(rule => (
                <div
                  key={rule.id}
                  className={cn(
                    'border-l-4 rounded-lg bg-canvas border border-border p-4 transition-opacity',
                    approvalRuleActionColors[rule.action] || 'border-l-gray-400',
                    !rule.enabled && 'opacity-50'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      {/* Condition */}
                      <div className="bg-white dark:bg-gray-800 rounded-lg px-3 py-2 border border-border">
                        <p className="text-[10px] uppercase text-t3 font-medium mb-0.5">If</p>
                        <p className="text-xs font-semibold text-t1">{formatCondition(rule)}</p>
                      </div>

                      {/* Arrow */}
                      <ArrowRight size={16} className="text-t3 shrink-0" />

                      {/* Action */}
                      <div className="bg-white dark:bg-gray-800 rounded-lg px-3 py-2 border border-border">
                        <p className="text-[10px] uppercase text-t3 font-medium mb-0.5">Then</p>
                        <p className="text-xs font-semibold text-t1">{approvalRuleActionLabels[rule.action]}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-4">
                      {/* Toggle */}
                      <button
                        onClick={() => toggleApprovalRule(rule.id)}
                        className={cn(
                          'relative w-9 h-5 rounded-full transition-colors',
                          rule.enabled ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'
                        )}
                      >
                        <div className={cn(
                          'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform',
                          rule.enabled ? 'translate-x-4' : 'translate-x-0.5'
                        )} />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => deleteApprovalRule(rule.id)}
                        className="p-1.5 text-t3 hover:text-error hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Add Approval Rule Builder Modal */}
          <Modal open={showApprovalRuleBuilder} onClose={() => setShowApprovalRuleBuilder(false)} title="Add Approval Rule" size="md">
            <div className="space-y-5">
              {/* Condition Section */}
              <div>
                <p className="text-xs font-semibold text-t1 mb-3 uppercase tracking-wider">Condition</p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-t3 mb-1">Type</label>
                    <Select
                      value={newApprovalRule.conditionType}
                      onChange={e => setNewApprovalRule(prev => ({ ...prev, conditionType: e.target.value as any, conditionValue: e.target.value === 'amount' ? 0 : '' }))}
                      options={[{ value: 'amount', label: 'Amount' }, { value: 'category', label: 'Category' }, { value: 'department', label: 'Department' }]}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-t3 mb-1">Operator</label>
                    <Select
                      value={newApprovalRule.conditionOperator}
                      onChange={e => setNewApprovalRule(prev => ({ ...prev, conditionOperator: e.target.value as any }))}
                      options={[{ value: '>', label: 'Greater than' }, { value: '<', label: 'Less than' }, { value: '=', label: 'Equals' }]}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-t3 mb-1">Value</label>
                    {newApprovalRule.conditionType === 'amount' ? (
                      <Input
                        type="number"
                        placeholder="1000"
                        value={newApprovalRule.conditionValue}
                        onChange={e => setNewApprovalRule(prev => ({ ...prev, conditionValue: Number(e.target.value) }))}
                      />
                    ) : newApprovalRule.conditionType === 'category' ? (
                      <Select
                        value={String(newApprovalRule.conditionValue)}
                        onChange={e => setNewApprovalRule(prev => ({ ...prev, conditionValue: e.target.value }))}
                        options={[{ value: '', label: 'Select...' }, { value: 'travel', label: 'Travel' }, { value: 'meals', label: 'Meals' }, { value: 'supplies', label: 'Supplies' }, { value: 'equipment', label: 'Equipment' }, { value: 'accommodation', label: 'Accommodation' }, { value: 'transport', label: 'Transport' }, { value: 'other', label: 'Other' }]}
                      />
                    ) : (
                      <Select
                        value={String(newApprovalRule.conditionValue)}
                        onChange={e => setNewApprovalRule(prev => ({ ...prev, conditionValue: e.target.value }))}
                        options={[{ value: '', label: 'Select...' }, ...departments.map((d: any) => ({ value: d.name, label: d.name }))]}
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="flex items-center gap-3 p-3 bg-canvas rounded-lg border border-border">
                <div className="bg-white dark:bg-gray-800 rounded px-2.5 py-1.5 border border-border">
                  <p className="text-xs font-medium text-t1">
                    {newApprovalRule.conditionType === 'amount'
                      ? `Amount ${newApprovalRule.conditionOperator} $${Number(newApprovalRule.conditionValue || 0).toLocaleString()}`
                      : newApprovalRule.conditionType === 'category'
                        ? `Category = ${String(newApprovalRule.conditionValue || '...').charAt(0).toUpperCase() + String(newApprovalRule.conditionValue || '...').slice(1)}`
                        : `Department = ${newApprovalRule.conditionValue || '...'}`
                    }
                  </p>
                </div>
                <ArrowRight size={14} className="text-t3 shrink-0" />
                <div className="bg-white dark:bg-gray-800 rounded px-2.5 py-1.5 border border-border">
                  <p className="text-xs font-medium text-t1">{approvalRuleActionLabels[newApprovalRule.action]}</p>
                </div>
              </div>

              {/* Action Section */}
              <div>
                <p className="text-xs font-semibold text-t1 mb-3 uppercase tracking-wider">Action</p>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.entries(approvalRuleActionLabels) as Array<[string, string]>).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setNewApprovalRule(prev => ({ ...prev, action: key as any }))}
                      className={cn(
                        'text-left px-3 py-2.5 rounded-lg border text-xs font-medium transition-all',
                        newApprovalRule.action === key
                          ? 'border-tempo-500 bg-tempo-50 dark:bg-tempo-900/20 text-tempo-700 dark:text-tempo-300 ring-1 ring-tempo-500/30'
                          : 'border-border bg-canvas text-t2 hover:border-tempo-300 hover:text-t1'
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <Button variant="secondary" onClick={() => setShowApprovalRuleBuilder(false)}>Cancel</Button>
                <Button onClick={addApprovalRule}>
                  <Plus size={14} /> Add Rule
                </Button>
              </div>
            </div>
          </Modal>
        </>
      )}

      {/* ============================================================ */}
      {/* TAB: REIMBURSEMENT */}
      {/* ============================================================ */}
      {activeTab === 'reimbursement' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard label="Total Batches" value={reimbursementStats.totalBatches} icon={<Layers size={20} />} />
            <StatCard label="Completed" value={reimbursementStats.completedBatches} change={`$${reimbursementStats.totalReimbursed.toLocaleString()}`} changeType="positive" icon={<CheckCircle2 size={20} />} />
            <StatCard label="Pending" value={reimbursementStats.pendingBatches} change={`$${reimbursementStats.pendingAmount.toLocaleString()}`} changeType={reimbursementStats.pendingBatches > 0 ? 'negative' : 'positive'} icon={<Clock size={20} />} />
            <StatCard label="Awaiting Batch" value={approvedForReimbursement.length} change="Approved expenses" changeType="neutral" icon={<Banknote size={20} />} />
          </div>

          {/* Pending Reimbursements */}
          {approvedForReimbursement.length > 0 && (
            <Card padding="none" className="mb-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Pending Reimbursements</CardTitle>
                  <Button size="sm" onClick={() => setShowReimbursementModal(true)}>
                    <Plus size={14} /> Create Batch
                  </Button>
                </div>
              </CardHeader>
              <div className="divide-y divide-divider">
                {approvedForReimbursement.map((report: any) => (
                  <div key={report.id} className="px-6 py-3 flex items-center gap-4">
                    <Avatar name={getEmployeeName(report.employee_id)} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-t1">{report.title}</p>
                      <p className="text-xs text-t3">{getEmployeeName(report.employee_id)} - Approved {report.approved_at ? new Date(report.approved_at).toLocaleDateString() : 'recently'}</p>
                    </div>
                    <p className="text-sm font-semibold text-t1">${report.total_amount.toLocaleString()}</p>
                    <Badge variant="success">Approved</Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Reimbursement Batches */}
          <Card padding="none" className="mb-6">
            <CardHeader><CardTitle>Reimbursement Batches</CardTitle></CardHeader>
            <div className="divide-y divide-divider">
              {reimbursementBatches.length === 0 ? (
                <div className="px-6 py-12 text-center text-sm text-t3">No reimbursement batches</div>
              ) : reimbursementBatches.map((batch: any) => (
                <div key={batch.id} className="px-6 py-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Badge variant={batch.status === 'completed' ? 'success' : batch.status === 'processing' ? 'info' : batch.status === 'failed' ? 'error' : 'warning'}>
                        {batch.status}
                      </Badge>
                      <span className="text-sm font-semibold text-t1">${batch.total_amount.toLocaleString()}</span>
                      <span className="text-xs text-t3">{batch.employee_count} employee{batch.employee_count !== 1 ? 's' : ''}</span>
                      <Badge variant="default">{batch.method?.replace('_', ' ')}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      {batch.processed_at && <span className="text-xs text-t3">Processed {new Date(batch.processed_at).toLocaleDateString()}</span>}
                      {batch.status === 'pending' && (
                        <Button size="sm" variant="primary" onClick={() => updateReimbursementBatch(batch.id, { status: 'processing' })}>
                          Process
                        </Button>
                      )}
                      {batch.status === 'processing' && (
                        <Button size="sm" variant="primary" onClick={() => updateReimbursementBatch(batch.id, { status: 'completed', processed_at: new Date().toISOString() })}>
                          Mark Complete
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Batch Items */}
                  {batch.items && batch.items.length > 0 && (
                    <div className="ml-4 space-y-1">
                      {batch.items.map((item: any) => (
                        <div key={item.id} className="flex items-center gap-3 bg-canvas rounded-lg px-3 py-2">
                          <Avatar name={getEmployeeName(item.employee_id)} size="xs" />
                          <span className="text-xs text-t1 flex-1">{getEmployeeName(item.employee_id)}</span>
                          <span className="text-xs text-t3">{item.notes}</span>
                          <span className="text-xs font-semibold text-t1">${item.amount.toLocaleString()}</span>
                          <Badge variant={item.status === 'processed' ? 'success' : item.status === 'failed' ? 'error' : 'warning'} >{item.status}</Badge>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Processing Progress */}
                  {batch.status === 'processing' && (
                    <div className="mt-3">
                      <div className="flex items-center gap-2 mb-1">
                        <RotateCcw size={12} className="text-tempo-500 animate-spin" />
                        <span className="text-xs text-t2">Processing reimbursement...</span>
                      </div>
                      <Progress value={65} color="orange" size="sm" />
                    </div>
                  )}

                  {/* Payroll Sync Indicator */}
                  {batch.method === 'payroll' && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-tempo-600">
                      <Banknote size={12} />
                      <span>{batch.payroll_run_id ? 'Linked to payroll run' : 'Will sync with next payroll run'}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* Historical Summary */}
          <Card>
            <h3 className="text-sm font-semibold text-t1 mb-3">Historical Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-canvas rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-t1">{reimbursementStats.totalBatches}</p>
                <p className="text-xs text-t3 mt-1">Total Batches</p>
              </div>
              <div className="bg-canvas rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-emerald-600">${reimbursementStats.totalReimbursed.toLocaleString()}</p>
                <p className="text-xs text-t3 mt-1">Total Reimbursed</p>
              </div>
              <div className="bg-canvas rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-amber-600">${reimbursementStats.pendingAmount.toLocaleString()}</p>
                <p className="text-xs text-t3 mt-1">Pending Amount</p>
              </div>
              <div className="bg-canvas rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-t1">
                  {reimbursementBatches.reduce((a: number, b: any) => a + (b.employee_count || 0), 0)}
                </p>
                <p className="text-xs text-t3 mt-1">Employees Reimbursed</p>
              </div>
            </div>
          </Card>
        </>
      )}

      {/* ============================================================ */}
      {/* MODALS */}
      {/* ============================================================ */}

      {/* New Expense Report Modal */}
      {/* T5 #35: Duplicate Expense Warning */}
      <Modal open={showDuplicateWarning} onClose={() => setShowDuplicateWarning(false)} title="Possible Duplicate Expense">
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
            <AlertTriangle size={16} className="text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800">You submitted a similar expense recently</p>
              {duplicateMatch && (
                <p className="text-xs text-amber-700 mt-1">
                  &quot;{duplicateMatch.title}&quot; for {duplicateMatch.currency} {(duplicateMatch.totalAmount || duplicateMatch.total_amount)?.toLocaleString()} on {(duplicateMatch.submittedAt || duplicateMatch.submitted_at)?.split('T')[0]}
                </p>
              )}
              <p className="text-xs text-amber-700 mt-1">Are you sure this is a different expense?</p>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => { setShowDuplicateWarning(false); setDuplicateConfirmed(false) }}>Cancel</Button>
            <Button onClick={() => { setShowDuplicateWarning(false); setDuplicateConfirmed(true); submitReport() }}>Yes, Submit Anyway</Button>
          </div>
        </div>
      </Modal>

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
          <DatePicker label={t('startDate')} value={mileageForm.date}
            onChange={d => setMileageForm({ ...mileageForm, date: d.toISOString().split('T')[0] })} />
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

      {/* Mileage Entry Modal */}
      <Modal open={showMileageEntryModal} onClose={() => setShowMileageEntryModal(false)} title="New Mileage Entry" size="lg">
        <div className="space-y-4">
          <Select label="Employee" value={mileageEntryForm.employee_id}
            onChange={e => setMileageEntryForm({ ...mileageEntryForm, employee_id: e.target.value })}
            options={employees.slice(0, 20).map(emp => ({ value: emp.id, label: emp.profile.full_name }))} />
          <DatePicker label="Date" value={mileageEntryForm.date}
            onChange={d => setMileageEntryForm({ ...mileageEntryForm, date: d.toISOString().split('T')[0] })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Start Location" value={mileageEntryForm.start_location} placeholder="e.g., Lagos Office"
              onChange={e => setMileageEntryForm({ ...mileageEntryForm, start_location: e.target.value })} />
            <Input label="End Location" value={mileageEntryForm.end_location} placeholder="e.g., Client Site"
              onChange={e => setMileageEntryForm({ ...mileageEntryForm, end_location: e.target.value })} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Input label="Distance (miles)" type="number" value={mileageEntryForm.distance_miles || ''}
              onChange={e => setMileageEntryForm({ ...mileageEntryForm, distance_miles: Number(e.target.value) })} />
            <Input label="Rate ($/mile)" type="number" value={mileageEntryForm.rate}
              onChange={e => setMileageEntryForm({ ...mileageEntryForm, rate: Number(e.target.value) })} />
            <div>
              <label className="block text-xs font-medium text-t2 mb-1">Calculated Amount</label>
              <p className="px-3 py-2 text-sm font-semibold text-t1 bg-canvas rounded-lg border border-border">
                ${(mileageEntryForm.distance_miles * mileageEntryForm.rate).toFixed(2)}
              </p>
            </div>
          </div>
          <Textarea label="Purpose" value={mileageEntryForm.purpose} placeholder="Business purpose for the trip"
            onChange={e => setMileageEntryForm({ ...mileageEntryForm, purpose: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Vehicle Type" value={mileageEntryForm.vehicle_type}
              onChange={e => setMileageEntryForm({ ...mileageEntryForm, vehicle_type: e.target.value })}
              options={[{ value: 'personal', label: 'Personal Vehicle' }, { value: 'company', label: 'Company Vehicle' }]} />
            <Select label="Trip Type" value={mileageEntryForm.trip_type}
              onChange={e => setMileageEntryForm({ ...mileageEntryForm, trip_type: e.target.value })}
              options={[{ value: 'one_way', label: 'One Way' }, { value: 'round_trip', label: 'Round Trip' }]} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowMileageEntryModal(false)}>Cancel</Button>
            <Button onClick={submitMileageEntry}>Add Entry</Button>
          </div>
        </div>
      </Modal>

      {/* Advanced Policy Modal */}
      <Modal open={showAdvancedPolicyModal} onClose={() => setShowAdvancedPolicyModal(false)} title="New Expense Policy" size="lg">
        <div className="space-y-4">
          <Input label="Policy Name" value={advancedPolicyForm.name} placeholder="e.g., Maximum Meal Expense"
            onChange={e => setAdvancedPolicyForm({ ...advancedPolicyForm, name: e.target.value })} />
          <Select label="Applies To" value={advancedPolicyForm.applies_to}
            onChange={e => setAdvancedPolicyForm({ ...advancedPolicyForm, applies_to: e.target.value })}
            options={[
              { value: 'all', label: 'All Employees' },
              { value: 'department', label: 'Specific Department' },
              { value: 'role', label: 'Specific Role' },
              { value: 'level', label: 'Specific Level' },
            ]} />

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-medium text-t1">Rules</label>
              <Button size="sm" variant="secondary" onClick={() => setAdvancedPolicyForm({
                ...advancedPolicyForm,
                rules: [...advancedPolicyForm.rules, { field: 'amount', operator: '>', value: 0, action: 'warn' }]
              })}>
                <Plus size={12} /> Add Rule
              </Button>
            </div>
            <div className="space-y-2">
              {advancedPolicyForm.rules.map((rule, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-3">
                    <Select label={index === 0 ? 'Field' : undefined} value={rule.field}
                      onChange={e => {
                        const updated = [...advancedPolicyForm.rules]
                        updated[index] = { ...rule, field: e.target.value }
                        setAdvancedPolicyForm({ ...advancedPolicyForm, rules: updated })
                      }}
                      options={[
                        { value: 'amount', label: 'Amount' },
                        { value: 'category', label: 'Category' },
                        { value: 'vendor', label: 'Vendor' },
                      ]} />
                  </div>
                  <div className="col-span-2">
                    <Select label={index === 0 ? 'Operator' : undefined} value={rule.operator}
                      onChange={e => {
                        const updated = [...advancedPolicyForm.rules]
                        updated[index] = { ...rule, operator: e.target.value }
                        setAdvancedPolicyForm({ ...advancedPolicyForm, rules: updated })
                      }}
                      options={[
                        { value: '>', label: '>' },
                        { value: '<', label: '<' },
                        { value: '=', label: '=' },
                        { value: 'contains', label: 'contains' },
                      ]} />
                  </div>
                  <div className="col-span-3">
                    <Input label={index === 0 ? 'Value' : undefined} type={rule.field === 'amount' ? 'number' : 'text'}
                      value={rule.value}
                      onChange={e => {
                        const updated = [...advancedPolicyForm.rules]
                        updated[index] = { ...rule, value: rule.field === 'amount' ? Number(e.target.value) : e.target.value }
                        setAdvancedPolicyForm({ ...advancedPolicyForm, rules: updated })
                      }} />
                  </div>
                  <div className="col-span-3">
                    <Select label={index === 0 ? 'Action' : undefined} value={rule.action}
                      onChange={e => {
                        const updated = [...advancedPolicyForm.rules]
                        updated[index] = { ...rule, action: e.target.value }
                        setAdvancedPolicyForm({ ...advancedPolicyForm, rules: updated })
                      }}
                      options={[
                        { value: 'block', label: 'Block' },
                        { value: 'warn', label: 'Warn' },
                        { value: 'require_approval', label: 'Require Approval' },
                      ]} />
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <button
                      onClick={() => {
                        if (advancedPolicyForm.rules.length <= 1) return
                        setAdvancedPolicyForm({ ...advancedPolicyForm, rules: advancedPolicyForm.rules.filter((_, i) => i !== index) })
                      }}
                      disabled={advancedPolicyForm.rules.length <= 1}
                      className="p-1.5 text-t3 hover:text-error hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowAdvancedPolicyModal(false)}>Cancel</Button>
            <Button onClick={submitAdvancedPolicy}>Create Policy</Button>
          </div>
        </div>
      </Modal>

      {/* Reimbursement Batch Modal */}
      <Modal open={showReimbursementModal} onClose={() => { setShowReimbursementModal(false); setSelectedReimbursementIds(new Set()) }} title="Create Reimbursement Batch" size="lg">
        <div className="space-y-4">
          <Select label="Reimbursement Method" value={reimbursementMethod}
            onChange={e => setReimbursementMethod(e.target.value as 'payroll' | 'direct_deposit' | 'manual')}
            options={[
              { value: 'payroll', label: 'Payroll Sync' },
              { value: 'direct_deposit', label: 'Direct Deposit' },
              { value: 'manual', label: 'Manual' },
            ]} />

          {reimbursementMethod === 'payroll' && (
            <div className="flex items-center gap-2 p-3 bg-tempo-50/50 dark:bg-tempo-950/20 rounded-lg border border-tempo-200 dark:border-tempo-800/30">
              <Banknote size={14} className="text-tempo-600" />
              <span className="text-xs text-tempo-700">Reimbursement will be included in the next payroll run</span>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-medium text-t1">Select Approved Expenses ({selectedReimbursementIds.size} selected)</label>
              {approvedForReimbursement.length > 0 && (
                <button
                  onClick={() => {
                    if (selectedReimbursementIds.size === approvedForReimbursement.length) {
                      setSelectedReimbursementIds(new Set())
                    } else {
                      setSelectedReimbursementIds(new Set(approvedForReimbursement.map((r: any) => r.id)))
                    }
                  }}
                  className="text-xs text-tempo-600 hover:text-tempo-700 font-medium"
                >
                  {selectedReimbursementIds.size === approvedForReimbursement.length ? 'Deselect All' : 'Select All'}
                </button>
              )}
            </div>
            <div className="max-h-[280px] overflow-y-auto border border-border rounded-lg divide-y divide-divider">
              {approvedForReimbursement.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-t3">No approved expenses awaiting reimbursement</div>
              ) : approvedForReimbursement.map((report: any) => {
                const isSelected = selectedReimbursementIds.has(report.id)
                return (
                  <div
                    key={report.id}
                    onClick={() => {
                      const next = new Set(selectedReimbursementIds)
                      if (next.has(report.id)) next.delete(report.id)
                      else next.add(report.id)
                      setSelectedReimbursementIds(next)
                    }}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-canvas transition-colors',
                      isSelected ? 'bg-tempo-50/50' : ''
                    )}
                  >
                    <div className={cn(
                      'w-4 h-4 rounded border flex items-center justify-center shrink-0',
                      isSelected ? 'bg-tempo-600 border-tempo-600' : 'border-border'
                    )}>
                      {isSelected && <CheckCircle size={12} className="text-white" />}
                    </div>
                    <Avatar name={getEmployeeName(report.employee_id)} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-t1 truncate">{report.title}</p>
                      <p className="text-xs text-t3">{getEmployeeName(report.employee_id)}</p>
                    </div>
                    <p className="text-sm font-semibold text-t1 shrink-0">${report.total_amount.toLocaleString()}</p>
                  </div>
                )
              })}
            </div>
          </div>

          {selectedReimbursementIds.size > 0 && (
            <div className="rounded-lg p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/30">
              <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                {selectedReimbursementIds.size} expense{selectedReimbursementIds.size !== 1 ? 's' : ''} selected for reimbursement
              </p>
              <p className="text-xs mt-1 text-emerald-700 dark:text-emerald-400">
                Total: ${approvedForReimbursement.filter((r: any) => selectedReimbursementIds.has(r.id)).reduce((a: number, r: any) => a + r.total_amount, 0).toLocaleString()} via {reimbursementMethod.replace('_', ' ')}
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button variant="secondary" onClick={() => { setShowReimbursementModal(false); setSelectedReimbursementIds(new Set()) }}>Cancel</Button>
            <Button onClick={submitReimbursementBatch} disabled={selectedReimbursementIds.size === 0}>
              <Banknote size={14} /> Create Batch
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirmation Modal for Destructive Actions */}
      <Modal open={!!confirmAction?.show} onClose={() => setConfirmAction(null)} title="Confirm Action" size="sm">
        <p className="text-sm text-t2 mb-4">
          {confirmAction?.type === 'reject_report' && `Are you sure you want to reject "${confirmAction.label}"? This action cannot be undone.`}
          {confirmAction?.type === 'delete_advanced_policy' && `Are you sure you want to delete the policy "${confirmAction?.label}"? This action cannot be undone.`}
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setConfirmAction(null)}>{tc('cancel')}</Button>
          <Button variant="danger" onClick={executeConfirmAction} disabled={saving}>
            {confirmAction?.type === 'reject_report' ? 'Reject' : 'Delete'}
          </Button>
        </div>
      </Modal>
    </>
  )
}
