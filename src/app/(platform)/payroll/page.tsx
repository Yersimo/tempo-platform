'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Header } from '@/components/layout/header'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/ui/stat-card'
import { Modal } from '@/components/ui/modal'
import { Input, Select, Textarea } from '@/components/ui/input'
import { TempoBarChart, TempoDonutChart, TempoAreaChart, CHART_COLORS, CHART_SERIES } from '@/components/ui/charts'
import { Wallet, DollarSign, Users, Plus, FileText, BarChart3, Shield, Briefcase, Settings, Search, Calculator, Calendar, AlertTriangle, CheckCircle2, Clock, ChevronDown, ChevronUp, Eye, Zap, Globe, Download, XCircle, Send, UserCheck, Building2, Smartphone, Ban } from 'lucide-react'
import { useTempo } from '@/lib/store'
import { exportToCSV, PAYROLL_EXPORT_COLUMNS } from '@/lib/export-import'
import { AIInsightCard, AIAlertBanner, AIScoreBadge, AIRecommendationList } from '@/components/ai'
import { detectPayrollAnomalies, forecastAnnualPayroll, scorePayrollHealth, recommendTaxOptimizations, analyzePayrollTrends, predictComplianceRisks, scoreContractorRisk } from '@/lib/ai-engine'
import { calculateTax } from '@/lib/tax-calculator'
import type { SupportedCountry } from '@/lib/tax-calculator'

/** Currency symbol map for African + global currencies */
const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$', GHS: 'GH\u20B5', NGN: '\u20A6', KES: 'KSh', ZAR: 'R', TZS: 'TSh',
  UGX: 'USh', RWF: 'RF', ETB: 'Br', EGP: 'E\u00A3', MAD: 'MAD', GBP: '\u00A3',
  EUR: '\u20AC', CAD: 'C$', AUD: 'A$', XOF: 'CFA', XAF: 'FCFA', CDF: 'FC',
}

/** Format a cents integer as a currency string, e.g. 1250000 → "GH₵12,500.00" */
function fmtCents(cents: number | null | undefined, currency?: string): string {
  if (cents == null) return '$0.00'
  const symbol = currency ? (CURRENCY_SYMBOLS[currency] || currency + ' ') : '$'
  return symbol + (cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// Country name → code resolver (client-side mirror of server resolveCountryCode)
const COUNTRY_NAME_TO_CODE: Record<string, string> = {
  'United States': 'US', 'Kenya': 'KE', 'Ghana': 'GH', 'Nigeria': 'NG',
  'South Africa': 'ZA', 'Tanzania': 'TZ', 'Uganda': 'UG', 'Rwanda': 'RW',
  'Ethiopia': 'ET', 'Egypt': 'EG', 'Morocco': 'MA', 'United Kingdom': 'UK',
  'Germany': 'DE', 'France': 'FR', 'Canada': 'CA', 'Australia': 'AU',
  'Ivory Coast': 'CI', "Côte d'Ivoire": 'CI', 'Senegal': 'SN', 'Cameroon': 'CM',
  'Gabon': 'GA', 'Congo': 'CD', 'Togo': 'TG', 'Benin': 'BJ', 'Burkina Faso': 'BF',
  'Niger': 'NE', 'Mali': 'ML',
}
function resolveCountryCode(input: string): string {
  if (!input) return input
  if (input.length <= 3) return input.toUpperCase()
  return COUNTRY_NAME_TO_CODE[input] || input
}

// Reverse map: code → full name for display
const COUNTRY_CODE_TO_NAME: Record<string, string> = Object.fromEntries(
  Object.entries(COUNTRY_NAME_TO_CODE).map(([name, code]) => [code, name])
)

function displayCountry(value: string): string {
  if (!value) return '—'
  if (value.length <= 3) return COUNTRY_CODE_TO_NAME[value.toUpperCase()] || value
  return value
}

/** Defensive date formatter: handles ISO strings, epoch numbers, and nulls */
function fmtDate(value: string | number | null | undefined): string {
  if (!value) return '—'
  const d = typeof value === 'number' ? new Date(value) : new Date(value)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

// Fix 6: Country → Currency map (client-side mirror)
const COUNTRY_CURRENCY_MAP: Record<string, string> = {
  GH: 'GHS', NG: 'NGN', KE: 'KES', ZA: 'ZAR', TZ: 'TZS', UG: 'UGX', RW: 'RWF',
  ET: 'ETB', EG: 'EGP', MA: 'MAD', US: 'USD', UK: 'GBP', DE: 'EUR', FR: 'EUR',
  CA: 'CAD', AU: 'AUD', CI: 'XOF', SN: 'XOF', CM: 'XAF', GA: 'XAF',
  CD: 'CDF', TG: 'XOF', BJ: 'XOF', BF: 'XOF', NE: 'XOF', ML: 'XOF',
}

// Resolve employee name from store (DB rows don't have employee_name)
function resolveEmployeeName(employees: any[], employeeId: string, fallbackName?: string): string {
  const emp = employees.find((e: any) => e.id === employeeId)
  return emp?.profile?.full_name || emp?.fullName || fallbackName || 'Unknown Employee'
}

// Status display config
const STATUS_CONFIG: Record<string, { variant: 'success' | 'info' | 'warning' | 'error' | 'default'; label: string }> = {
  draft: { variant: 'default', label: 'Draft' },
  pending_hr: { variant: 'warning', label: 'Pending HR' },
  pending_finance: { variant: 'info', label: 'Pending Finance' },
  approved: { variant: 'success', label: 'Approved' },
  processing: { variant: 'info', label: 'Processing' },
  paid: { variant: 'success', label: 'Paid' },
  cancelled: { variant: 'error', label: 'Cancelled' },
}

export default function PayrollPage() {
  const router = useRouter()
  const t = useTranslations('payroll')
  const tc = useTranslations('common')
  const {
    payrollRuns, employees, addPayrollRun, updatePayrollRun,
    employeePayrollEntries, contractorPayments, payrollSchedules, taxConfigs, complianceIssues, taxFilings,
    addContractorPayment, updateContractorPayment, addPayrollSchedule, updatePayrollSchedule,
    addTaxConfig, updateTaxConfig, resolveComplianceIssue, updateTaxFiling, addEmployeePayrollEntry,
    addToast, currentUser, currentEmployeeId,
    ensureModulesLoaded,
    setPayrollRuns, setEmployeePayrollEntries,
    leaveRequests,
  } = useTempo()

  const role = currentUser?.role
  const isReadOnly = role === 'manager'

  // Employees should use /payslips instead
  useEffect(() => {
    if (role === 'employee') {
      router.push('/payslips')
    }
  }, [role, router])

  useEffect(() => {
    ensureModulesLoaded?.(['payrollRuns', 'leaveRequests', 'employeePayrollEntries', 'contractorPayments', 'payrollSchedules', 'taxConfigs', 'taxFilings'])
  }, [ensureModulesLoaded])

  // ---- Tab State ----
  const allTabs = [
    { id: 'pay-runs', label: t('payRuns'), icon: Wallet },
    { id: 'employee-payroll', label: t('employeePayroll'), icon: Users },
    { id: 'approvals', label: 'Approval Queue', icon: UserCheck },
    { id: 'reconciliation', label: 'Reconciliation', icon: Calculator },
    { id: 'year-end', label: 'Year-End Reports', icon: FileText },
    { id: 'analytics', label: t('analytics'), icon: BarChart3 },
    { id: 'compliance', label: t('compliance'), icon: Shield },
    { id: 'contractors', label: t('contractors'), icon: Briefcase },
    { id: 'tax-config', label: 'Tax Configuration', icon: Globe },
    { id: 'settings', label: t('payrollSettings'), icon: Settings },
  ]
  // Managers: hide Approval Queue and Settings tabs
  const tabs = isReadOnly ? allTabs.filter(t => t.id !== 'approvals' && t.id !== 'settings') : allTabs
  const [activeTab, setActiveTab] = useState('pay-runs')

  // ---- Modals ----
  const [showPayRunModal, setShowPayRunModal] = useState(false)
  const [showPayStubModal, setShowPayStubModal] = useState<string | null>(null)
  const [showContractorModal, setShowContractorModal] = useState(false)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false)
  const [showTaxConfigModal, setShowTaxConfigModal] = useState<string | null>(null)
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null)
  const [showValidationWarning, setShowValidationWarning] = useState(false)
  const [validationResult, setValidationResult] = useState<{
    eligible: { id: string; name: string; salary: number; currency: string }[]
    ineligible: { id: string; name: string; reason: string }[]
  } | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processError, setProcessError] = useState<string | null>(null)
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null)
  const [showBankExportWarning, setShowBankExportWarning] = useState(false)
  const [bankExportPreview, setBankExportPreview] = useState<{
    included: { name: string; amount: number }[]
    excluded: { name: string; reason: string }[]
  } | null>(null)
  const [pendingBankExportRunId, setPendingBankExportRunId] = useState<string | null>(null)
  // Audit trail state
  const [auditTrailRunId, setAuditTrailRunId] = useState<string | null>(null)
  const [auditTrail, setAuditTrail] = useState<Array<{
    id: string; action: string; actorName: string; reason: string | null
    oldValue: any; newValue: any; createdAt: string
  }>>([])
  const [auditTrailLoading, setAuditTrailLoading] = useState(false)
  // Reconciliation state
  const [reconPrevRunId, setReconPrevRunId] = useState('')
  const [reconCurrRunId, setReconCurrRunId] = useState('')
  const [reconData, setReconData] = useState<any>(null)
  const [reconLoading, setReconLoading] = useState(false)
  const [reconError, setReconError] = useState<string | null>(null)
  // Year-end reports state
  const [yearEndYear, setYearEndYear] = useState(new Date().getFullYear())
  const [yearEndCountry, setYearEndCountry] = useState('KE')
  const [yearEndEmployees, setYearEndEmployees] = useState<any[]>([])
  const [yearEndLoading, setYearEndLoading] = useState(false)
  // Tax config state
  const [taxConfigData, setTaxConfigData] = useState<Record<string, any[]>>({})
  const [taxConfigLoading, setTaxConfigLoading] = useState(false)
  const [taxConfigCountry, setTaxConfigCountry] = useState('')
  const [showTaxEditModal, setShowTaxEditModal] = useState<any>(null)
  const [taxEditForm, setTaxEditForm] = useState({ rate: 0, employeeContribution: 0, employerContribution: 0, effectiveDate: '' })

  // ---- Forms ----
  const [payRunForm, setPayRunForm] = useState({ period: '', country: '', total_gross: 0, total_net: 0, total_deductions: 0, currency: 'USD', employee_count: 30, run_date: '' })
  const [contractorForm, setContractorForm] = useState({ contractor_name: '', company: '', service_type: '', invoice_number: '', amount: 0, currency: 'USD', due_date: '', payment_method: 'bank_transfer', tax_form: 'invoice', country: '' })
  const [scheduleForm, setScheduleForm] = useState({ name: '', frequency: 'monthly', next_run_date: '', employee_group: '', auto_approve: false, currency: 'USD' })
  const [adjustmentForm, setAdjustmentForm] = useState({ employee_id: '', type: 'bonus', amount: 0, reason: '' })
  const [rejectReason, setRejectReason] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // T5: Maternity leave detection for payroll
  const maternityLeaves = useMemo(() => {
    if (!leaveRequests) return []
    return (leaveRequests as any[]).filter(lr =>
      (lr.type === 'maternity' || lr.type === 'paternity') && lr.status === 'approved'
    )
  }, [leaveRequests])

  // T5: Missing bank details preflight
  const [showBankDetailWarning, setShowBankDetailWarning] = useState(false)
  const [missingBankEmployees, setMissingBankEmployees] = useState<any[]>([])

  // T5: Escalation tracking — count rejections per payroll run
  const [showEscalationModal, setShowEscalationModal] = useState(false)
  const [escalationRunId, setEscalationRunId] = useState<string | null>(null)
  const [escalationNote, setEscalationNote] = useState('')
  const [filterDept, setFilterDept] = useState('')
  const [filterCountry, setFilterCountry] = useState('')

  // ---- Tax Simulator ----
  const [simCountry, setSimCountry] = useState<SupportedCountry>('US')
  const [simSalary, setSimSalary] = useState(80000)
  const simResult = useMemo(() => {
    try { return calculateTax(simCountry, simSalary, { isAnnual: true }) } catch { return null }
  }, [simCountry, simSalary])

  // Fix 5: Derive available countries from active employees
  const availableCountries = useMemo(() => {
    return [...new Set(employees.map(e => e.country).filter(Boolean))] as string[]
  }, [employees])

  // Fix 6: Auto-set currency when country changes
  const handleCountryChange = useCallback((country: string) => {
    const code = resolveCountryCode(country)
    const currency = COUNTRY_CURRENCY_MAP[code] || 'USD'
    setPayRunForm(prev => ({ ...prev, country, currency }))
  }, [])

  // Fetch audit trail for a payroll run
  const loadAuditTrail = useCallback(async (runId: string) => {
    if (auditTrailRunId === runId) {
      setAuditTrailRunId(null) // toggle off
      return
    }
    setAuditTrailRunId(runId)
    setAuditTrailLoading(true)
    try {
      const res = await fetch(`/api/payroll?action=audit-trail&payrollRunId=${runId}`)
      if (res.ok) {
        const data = await res.json()
        setAuditTrail(data.trail || [])
      }
    } catch { /* ignore */ }
    setAuditTrailLoading(false)
  }, [auditTrailRunId])

  // ---- Computed Data ----
  const totalPayroll = payrollRuns.reduce((a, r) => a + r.total_gross, 0)
  const lastRun = payrollRuns.length > 0 ? payrollRuns[payrollRuns.length - 1] : null
  const totalDeductions = lastRun ? lastRun.total_deductions : 0

  const payrollInsights = useMemo(() => detectPayrollAnomalies(payrollRuns), [payrollRuns])
  const forecast = useMemo(() => forecastAnnualPayroll(payrollRuns), [payrollRuns])
  const healthScore = useMemo(() => scorePayrollHealth(payrollRuns as any, complianceIssues as any, taxFilings as any), [payrollRuns, complianceIssues, taxFilings])
  const taxOpts = useMemo(() => recommendTaxOptimizations(taxConfigs as any, employees as any), [taxConfigs, employees])
  const trends = useMemo(() => analyzePayrollTrends(payrollRuns as any, employeePayrollEntries as any), [payrollRuns, employeePayrollEntries])
  const complianceRisks = useMemo(() => predictComplianceRisks(complianceIssues as any, taxFilings as any), [complianceIssues, taxFilings])
  const contractorRisk = useMemo(() => scoreContractorRisk(contractorPayments as any), [contractorPayments])

  const forecastInsight = useMemo(() => ({
    id: 'ai-payroll-forecast', category: 'prediction' as const, severity: 'info' as const,
    title: t('annualPayrollForecast'),
    description: `Projected annual payroll: $${(forecast.projected / 100_000_000).toFixed(2)}M based on ${payrollRuns.length} pay run(s). Confidence: ${forecast.confidence}.`,
    confidence: forecast.confidence, confidenceScore: forecast.confidence === 'high' ? 88 : forecast.confidence === 'medium' ? 65 : 40,
    suggestedAction: 'Review budget allocation for upcoming quarters', module: 'payroll',
  }), [forecast, payrollRuns.length, t])

  // Filtered employee entries
  const filteredEntries = useMemo(() => {
    let entries = [...employeePayrollEntries]
    if (searchQuery) entries = entries.filter(e => resolveEmployeeName(employees, (e as any).employee_id, (e as any).employee_name).toLowerCase().includes(searchQuery.toLowerCase()))
    if (filterDept) entries = entries.filter(e => (e as any).department === filterDept)
    if (filterCountry) entries = entries.filter(e => (e as any).country === filterCountry)
    return entries
  }, [employeePayrollEntries, searchQuery, filterDept, filterCountry])

  const departments = useMemo(() => [...new Set(employeePayrollEntries.map(e => (e as any).department).filter(Boolean))], [employeePayrollEntries])
  const countries = useMemo(() => [...new Set(employeePayrollEntries.map(e => (e as any).country).filter(Boolean))], [employeePayrollEntries])

  // Fix 2: Pending approval runs
  const pendingHRRuns = useMemo(() => payrollRuns.filter(r => r.status === 'pending_hr'), [payrollRuns])
  const pendingFinanceRuns = useMemo(() => payrollRuns.filter(r => r.status === 'pending_finance'), [payrollRuns])
  const pendingCount = pendingHRRuns.length + pendingFinanceRuns.length

  // ---- Handlers ----
  async function submitPayRun() {
    if (!payRunForm.period || !payRunForm.country) {
      addToast('Please select a country and period')
      return
    }

    // T5 #37: Bank details preflight check
    const countryEmps = employees.filter(e => {
      const empCountry = (e.country || '').toLowerCase()
      const formCountry = payRunForm.country.toLowerCase()
      return empCountry.includes(formCountry) || formCountry.includes(empCountry)
    })
    const noBankDetails = countryEmps.filter(e => {
      const bank = (e as any).bank_account_number || (e as any).bankAccountNumber || (e as any).bank_details
      return !bank
    })
    if (noBankDetails.length > 0 && !showBankDetailWarning) {
      setMissingBankEmployees(noBankDetails)
      setShowBankDetailWarning(true)
      return
    }

    setIsProcessing(true)
    setProcessError(null)
    try {
      // First validate
      const countryCode = resolveCountryCode(payRunForm.country)
      const valRes = await fetch(`/api/payroll?action=validate-run&country=${countryCode}`)
      if (valRes.ok) {
        const validation = await valRes.json()
        if (validation.ineligible?.length > 0) {
          setValidationResult(validation)
          setShowValidationWarning(true)
          setIsProcessing(false)
          return
        }
      }
      await executePayRun()
    } catch (err: any) {
      setProcessError(err.message || 'Validation failed')
      setIsProcessing(false)
    }
  }

  async function executePayRun() {
    setIsProcessing(true)
    setProcessError(null)
    try {
      const countryCode = resolveCountryCode(payRunForm.country)
      const res = await fetch('/api/payroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'process',
          period: payRunForm.period,
          country: countryCode,
        }),
      })
      const result = await res.json()
      if (!res.ok) {
        setProcessError(result.error || 'Failed to process payroll')
        setIsProcessing(false)
        return
      }
      // Add the engine-created run to local state (values are in cents from DB)
      if (setPayrollRuns) {
        setPayrollRuns((prev: any[]) => [...prev, {
          id: result.payrollRunId,
          org_id: result.orgId,
          period: result.period,
          status: result.status,
          country: result.country,
          total_gross: result.totalGross,
          total_net: result.totalNet,
          total_deductions: result.totalDeductions,
          currency: result.currency,
          employee_count: result.employeeCount,
          run_date: new Date().toISOString(),
          created_at: result.createdAt,
        }])
      } else {
        addPayrollRun({
          period: result.period,
          status: result.status,
          country: result.country,
          total_gross: result.totalGross,
          total_net: result.totalNet,
          total_deductions: result.totalDeductions,
          currency: result.currency,
          employee_count: result.employeeCount,
          run_date: new Date().toISOString(),
        })
      }
      setShowPayRunModal(false)
      setShowValidationWarning(false)
      setValidationResult(null)
      setPayRunForm({ period: '', country: '', total_gross: 0, total_net: 0, total_deductions: 0, currency: 'USD', employee_count: 30, run_date: '' })
      addToast(`Payroll processed: ${result.employeeCount} employees, ${fmtCents(result.totalNet)} net pay`)
    } catch (err: any) {
      setProcessError(err.message || 'Network error')
    } finally {
      setIsProcessing(false)
    }
  }

  // Fix 2: Multi-level status transitions via API
  const STATUS_ACTION_MAP: Record<string, string> = {
    submit: 'pending_hr',
    'approve-hr': 'pending_finance',
    'approve-finance': 'approved',
    process: 'processing',
    'mark-paid': 'paid',
  }

  async function handleStatusAction(runId: string, currentStatus: string, action: 'submit' | 'approve-hr' | 'approve-finance' | 'process' | 'mark-paid') {
    try {
      const apiAction = action === 'process' ? 'mark-processing' : action
      const body: any = { action: apiAction, payrollRunId: runId }
      if (action === 'submit') body.submitterId = currentEmployeeId || currentUser?.id
      if (action === 'approve-hr' || action === 'approve-finance') body.approverId = currentEmployeeId || currentUser?.id
      if (action === 'mark-paid') body.paymentReference = `PAY-${Date.now()}`

      const res = await fetch('/api/payroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const result = await res.json()
      if (!res.ok) {
        // Fallback: update local state optimistically for demo mode
        const targetStatus = STATUS_ACTION_MAP[action]
        if (targetStatus) {
          updatePayrollRun(runId, { status: targetStatus })
          addToast(`Payroll ${action.replace(/-/g, ' ')} (local)`)
        } else {
          addToast(result.error || `${action} failed`)
        }
        return
      }
      // Update local state with the new status from DB
      updatePayrollRun(runId, { status: result.status })
      addToast('Payroll run updated')
    } catch (err) {
      // Fallback for network errors: update local state optimistically
      const targetStatus = STATUS_ACTION_MAP[action]
      if (targetStatus) {
        updatePayrollRun(runId, { status: targetStatus })
        addToast(`Payroll ${action.replace(/-/g, ' ')} (offline)`)
      } else {
        addToast('Network error')
      }
    }
  }

  async function handleReject(runId: string) {
    if (!rejectReason.trim()) { addToast('Please provide a rejection reason'); return }
    try {
      const res = await fetch('/api/payroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject',
          payrollRunId: runId,
          rejectorId: currentEmployeeId || currentUser?.id,
          rejectorRole: 'finance',
          reason: rejectReason,
        }),
      })
      const result = await res.json()
      if (!res.ok) {
        addToast(result.error || 'Rejection failed')
        return
      }

      // T5 #45: Track rejection count and escalate after 3
      const run = payrollRuns.find(r => r.id === runId) as any
      const prevCount = (run?.rejection_count || 0) + 1
      if (prevCount >= 3) {
        updatePayrollRun(runId, { status: 'escalated', rejection_reason: rejectReason, rejection_count: prevCount, escalated_at: new Date().toISOString() })
        setEscalationRunId(runId)
        setShowEscalationModal(true)
        addToast('Payroll rejected 3 times — escalated to CEO/CFO', 'error')
      } else {
        updatePayrollRun(runId, { status: 'draft', rejection_reason: rejectReason, rejection_count: prevCount })
        addToast(`Payroll run rejected (${prevCount}/3 before escalation)`)
      }

      setShowRejectModal(null)
      setRejectReason('')
    } catch (err) {
      addToast('Network error')
    }
  }

  // T5 #45: Resolve escalation
  function resolveEscalation() {
    if (!escalationRunId || !escalationNote.trim()) {
      addToast('Resolution note required')
      return
    }
    updatePayrollRun(escalationRunId, { status: 'draft', escalation_resolved_at: new Date().toISOString(), escalation_note: escalationNote, rejection_count: 0 })
    setShowEscalationModal(false)
    setEscalationRunId(null)
    setEscalationNote('')
    addToast('Escalation resolved — payroll returned to draft')
  }

  // Bank file export — two-phase: preview first, warn if employees excluded, then download
  async function handleExportBankFile(runId: string) {
    try {
      // Phase 1: Preview — check which employees will be included/excluded
      const previewRes = await fetch(`/api/payroll?action=bank-file-preview&payrollRunId=${runId}`)
      if (!previewRes.ok) {
        addToast('Failed to preview bank file')
        return
      }
      const preview = await previewRes.json()

      if (preview.excluded?.length > 0) {
        // Show warning modal with excluded employees
        setBankExportPreview(preview)
        setPendingBankExportRunId(runId)
        setShowBankExportWarning(true)
        return
      }

      // No exclusions — download directly
      await executeBankFileDownload(runId)
    } catch (e) {
      addToast('Failed to export bank file')
    }
  }

  async function executeBankFileDownload(runId: string) {
    try {
      const res = await fetch(`/api/payroll?action=bank-file&payrollRunId=${runId}`)
      if (!res.ok) {
        const err = await res.json()
        addToast(err.error || 'Export failed')
        return
      }
      const blob = await res.blob()
      const disposition = res.headers.get('content-disposition') || ''
      const match = disposition.match(/filename="?([^"]+)"?/)
      const filename = match?.[1] || `payment-file-${runId.substring(0, 8)}.csv`
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
      addToast('Payment file exported')
      setShowBankExportWarning(false)
      setBankExportPreview(null)
      setPendingBankExportRunId(null)
    } catch (e) {
      addToast('Failed to export bank file')
    }
  }

  function submitContractorPayment() {
    if (!contractorForm.contractor_name || !contractorForm.amount) return
    addContractorPayment({ ...contractorForm, status: 'pending', paid_date: null })
    setShowContractorModal(false)
    setContractorForm({ contractor_name: '', company: '', service_type: '', invoice_number: '', amount: 0, currency: 'USD', due_date: '', payment_method: 'bank_transfer', tax_form: 'invoice', country: '' })
  }

  function submitSchedule() {
    if (!scheduleForm.name || !scheduleForm.next_run_date) return
    addPayrollSchedule({ ...scheduleForm, status: 'active', last_run_date: null })
    setShowScheduleModal(false)
    setScheduleForm({ name: '', frequency: 'monthly', next_run_date: '', employee_group: '', auto_approve: false, currency: 'USD' })
  }

  const selectedStub = showPayStubModal ? employeePayrollEntries.find(e => e.id === showPayStubModal) : null

  // Status-specific action buttons for each payroll run
  function renderRunActions(run: any) {
    const status = run.status
    return (
      <div className="flex gap-1 justify-center flex-wrap">
        {!isReadOnly && status === 'draft' && (
          <Button size="sm" variant="primary" onClick={() => handleStatusAction(run.id, status, 'submit')}>
            <Send size={12} /> Submit
          </Button>
        )}
        {!isReadOnly && status === 'pending_hr' && (
          <>
            <Button size="sm" variant="primary" onClick={() => handleStatusAction(run.id, status, 'approve-hr')}>
              <CheckCircle2 size={12} /> HR Approve
            </Button>
            <Button size="sm" variant="ghost" className="text-error" onClick={() => { setShowRejectModal(run.id); setRejectReason('') }}>
              <XCircle size={12} /> Reject
            </Button>
          </>
        )}
        {!isReadOnly && status === 'pending_finance' && (
          <>
            <Button size="sm" variant="primary" onClick={() => handleStatusAction(run.id, status, 'approve-finance')}>
              <CheckCircle2 size={12} /> Finance Approve
            </Button>
            <Button size="sm" variant="ghost" className="text-error" onClick={() => { setShowRejectModal(run.id); setRejectReason('') }}>
              <XCircle size={12} /> Reject
            </Button>
          </>
        )}
        {!isReadOnly && status === 'approved' && (
          <>
            <Button size="sm" variant="primary" onClick={() => handleStatusAction(run.id, status, 'process')}>
              {tc('process')}
            </Button>
            <Button size="sm" variant="secondary" onClick={() => handleExportBankFile(run.id)}>
              <Download size={12} /> Export Payment File
            </Button>
          </>
        )}
        {!isReadOnly && status === 'processing' && (
          <Button size="sm" variant="primary" onClick={() => handleStatusAction(run.id, status, 'mark-paid')}>
            <DollarSign size={12} /> Mark Paid
          </Button>
        )}
        {status === 'paid' && (
          <Button size="sm" variant="ghost" onClick={() => addToast(`Pay stubs generated for ${run.period}`)}>
            {t('generatePayStubs')}
          </Button>
        )}
        {status === 'escalated' && (
          <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white" onClick={() => { setEscalationRunId(run.id); setShowEscalationModal(true) }}>
            <AlertTriangle size={12} /> Resolve Escalation
          </Button>
        )}
      </div>
    )
  }

  // Employee redirect is handled by useEffect above — show nothing while redirecting
  if (role === 'employee') return null

  return (
    <>
      <Header title={t('title')} subtitle={t('subtitle')}
        actions={!isReadOnly ? <Button size="sm" onClick={() => setShowPayRunModal(true)}><Plus size={14} /> {t('newPayRun')}</Button> : undefined}
      />

      {/* Tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto border-b border-divider">
        {tabs.map(tab => {
          const Icon = tab.icon
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === tab.id ? 'border-tempo-600 text-tempo-600' : 'border-transparent text-t3 hover:text-t1 hover:border-border'}`}>
              <Icon size={16} /> {tab.label}
              {tab.id === 'approvals' && pendingCount > 0 && (
                <span className="ml-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold bg-amber-500 text-white rounded-full">{pendingCount}</span>
              )}
            </button>
          )
        })}
      </div>

      {/* ============================================================ */}
      {/* TAB 1: PAY RUNS */}
      {/* ============================================================ */}
      {activeTab === 'pay-runs' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard label={t('totalPayroll')} value={`$${(totalPayroll / 100_000_000).toFixed(1)}M`} change={t('allRuns')} changeType="neutral" icon={<Wallet size={20} />} />
            <StatCard label={t('lastPayRun')} value={lastRun ? `$${(lastRun.total_gross / 100_000_000).toFixed(2)}M` : '-'} change={lastRun?.period || t('noRunsYet')} changeType="neutral" icon={<DollarSign size={20} />} />
            <StatCard label={tc('employees')} value={lastRun?.employee_count || employees.length} change={t('onPayroll')} changeType="neutral" icon={<Users size={20} />} href="/people" />
            <StatCard label={t('deductions')} value={`$${(totalDeductions / 100_000).toFixed(0)}K`} change={t('lastRun')} changeType="neutral" icon={<FileText size={20} />} />
          </div>

          {/* Currency Breakdown */}
          {payrollRuns.length > 0 && (() => {
            const currencyMap: Record<string, { count: number; totalNet: number }> = {}
            payrollRuns.forEach(run => {
              const cur = (run as any).currency || 'USD'
              if (!currencyMap[cur]) currencyMap[cur] = { count: 0, totalNet: 0 }
              currencyMap[cur].count += 1
              currencyMap[cur].totalNet += run.total_net
            })
            const currencies = Object.entries(currencyMap)
            return currencies.length > 0 ? (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Globe size={16} className="text-tempo-600" />
                  <h3 className="text-sm font-semibold text-t1">Currency Breakdown</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {currencies.map(([currency, data]) => (
                    <Card key={currency} className="!p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-tempo-600">{currency}</span>
                        <Badge variant="default">{data.count} {data.count === 1 ? 'run' : 'runs'}</Badge>
                      </div>
                      <p className="text-lg font-bold text-t1">{fmtCents(data.totalNet)}</p>
                      <p className="text-xs text-t3">Total net pay</p>
                    </Card>
                  ))}
                </div>
              </div>
            ) : null
          })()}

          {payrollInsights.length > 0 && <AIAlertBanner insights={payrollInsights} className="mb-4" />}
          {payrollRuns.length > 0 && <div className="mb-6"><AIInsightCard insight={forecastInsight} compact /></div>}

          <Card padding="none">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t('payRunHistory')}</CardTitle>
                <Button variant="secondary" size="sm" onClick={() => exportToCSV(payrollRuns, PAYROLL_EXPORT_COLUMNS, 'payroll-runs')}>{tc('exportAll')}</Button>
              </div>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-divider bg-canvas">
                    <th className="tempo-th text-left px-6 py-3">{t('tablePeriod')}</th>
                    <th className="tempo-th text-left px-4 py-3">Country</th>
                    <th className="tempo-th text-right px-4 py-3">{t('tableGross')}</th>
                    <th className="tempo-th text-right px-4 py-3">{t('tableDeductions')}</th>
                    <th className="tempo-th text-right px-4 py-3">{t('tableNet')}</th>
                    <th className="tempo-th text-right px-4 py-3">{t('tableEmployees')}</th>
                    <th className="tempo-th text-center px-4 py-3">{tc('status')}</th>
                    <th className="tempo-th text-center px-4 py-3">{tc('actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {payrollRuns.length === 0 ? (
                    <tr><td colSpan={8} className="px-6 py-12 text-center text-xs text-t3">{t('noPayRuns')}</td></tr>
                  ) : payrollRuns.map(run => {
                    const runEntries = employeePayrollEntries.filter(e => (e as any).payroll_run_id === run.id)
                    const isExpanded = expandedRunId === run.id
                    const rejection = (run as any).rejection_reason
                    const statusCfg = STATUS_CONFIG[run.status] || STATUS_CONFIG.draft
                    return (
                      <tr key={run.id} className={`hover:bg-canvas/50 cursor-pointer ${rejection ? 'bg-red-50/50' : ''}`} onClick={() => setExpandedRunId(isExpanded ? null : run.id)}>
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-2">
                            {isExpanded ? <ChevronUp size={14} className="text-t3" /> : <ChevronDown size={14} className="text-t3" />}
                            <div>
                              <p className="text-xs font-medium text-t1">{run.period}</p>
                              <p className="text-xs text-t3">{t('run', { date: fmtDate(run.run_date) })} · {runEntries.length} {t('employeeBreakdown').toLowerCase()}</p>
                              {rejection && (
                                <p className="text-xs text-red-600 mt-0.5 flex items-center gap-1">
                                  <AlertTriangle size={10} /> Rejected: {rejection}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-t2">{displayCountry((run as any).country || '')}</td>
                        <td className="px-4 py-3 text-xs text-t1 text-right font-medium">{fmtCents(run.total_gross, COUNTRY_CURRENCY_MAP[(run as any).country] || undefined)}</td>
                        <td className="px-4 py-3 text-xs text-error text-right">-{fmtCents(run.total_deductions, COUNTRY_CURRENCY_MAP[(run as any).country] || undefined)}</td>
                        <td className="px-4 py-3 text-xs text-t1 text-right font-semibold">{fmtCents(run.total_net, COUNTRY_CURRENCY_MAP[(run as any).country] || undefined)}</td>
                        <td className="px-4 py-3 text-xs text-t2 text-right">{run.employee_count}</td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
                        </td>
                        <td className="px-4 py-3 text-center" onClick={e => e.stopPropagation()}>
                          {renderRunActions(run)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {/* Expanded Pay Run Detail */}
            {expandedRunId && (() => {
              const runEntries = employeePayrollEntries.filter(e => (e as any).payroll_run_id === expandedRunId)
              if (runEntries.length === 0) return null
              // T5 #31: Detect maternity leaves overlapping this pay period
              const expandedRun = payrollRuns.find(r => r.id === expandedRunId) as any
              const runPeriod = expandedRun?.period || ''
              const maternityInPeriod = maternityLeaves.filter((lr: any) => {
                if (!lr.start_date || !lr.end_date || !runPeriod) return false
                return lr.start_date <= runPeriod + '-31' && lr.end_date >= runPeriod + '-01'
              })
              // T5 #32: Detect mid-month salary changes (pro-rata)
              const proRataEntries = runEntries.filter((e: any) => e.pay_type === 'pro_rata_new' || (e as any).notes?.includes?.('pro-rata'))
              return (
                <div className="border-t border-divider bg-canvas/50 p-4">
                  {/* T5 #31: Maternity Leave Banner */}
                  {maternityInPeriod.length > 0 && (
                    <div className="bg-pink-50 border border-pink-200 rounded-lg p-3 mb-4 flex items-start gap-2">
                      <span className="text-pink-600 mt-0.5 shrink-0 text-sm">&#x1F930;</span>
                      <div>
                        <p className="text-sm font-medium text-pink-800">{maternityInPeriod.length} employee(s) on maternity/paternity leave this period</p>
                        <div className="mt-1 space-y-0.5">
                          {maternityInPeriod.map((lr: any) => {
                            const empName = employees.find(e => e.id === lr.employee_id)?.profile?.full_name || lr.employee_id
                            const country = employees.find(e => e.id === lr.employee_id)?.country || ''
                            const maternityRate = country === 'Ghana' ? '100% (12 weeks)' : country === 'Nigeria' ? '50% (12 weeks)' : country === 'Kenya' ? '100% (3 months)' : country === 'South Africa' ? 'UIF rate (4 months)' : '100%'
                            return <p key={lr.id} className="text-xs text-pink-700">{empName}: {lr.type} leave ({lr.start_date} to {lr.end_date}) — Statutory pay: {maternityRate}</p>
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                  {/* T5 #32: Pro-Rata Salary Change Banner */}
                  {proRataEntries.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 flex items-start gap-2">
                      <AlertTriangle size={16} className="text-blue-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-blue-800">{proRataEntries.length} employee(s) with mid-month salary changes (pro-rata split applied)</p>
                        <p className="text-xs text-blue-700 mt-1">Days at old salary and days at new salary have been calculated separately.</p>
                      </div>
                    </div>
                  )}
                  <h4 className="text-sm font-semibold text-t1 mb-3">{t('employeeBreakdown')} ({runEntries.length})</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-divider">
                          <th className="text-left px-3 py-2 font-medium text-t3">{t('employeeName')}</th>
                          <th className="text-left px-3 py-2 font-medium text-t3">{t('department')}</th>
                          <th className="text-left px-3 py-2 font-medium text-t3">Pay Type</th>
                          <th className="text-left px-3 py-2 font-medium text-t3">Bank</th>
                          <th className="text-right px-3 py-2 font-medium text-t3">{t('grossPay')}</th>
                          <th className="text-right px-3 py-2 font-medium text-t3">{t('federalTax')}</th>
                          <th className="text-right px-3 py-2 font-medium text-t3">{t('pension')}</th>
                          <th className="text-right px-3 py-2 font-medium text-t3">{t('totalDeductionsLabel')}</th>
                          <th className="text-right px-3 py-2 font-medium text-t3">{t('netPay')}</th>
                          <th className="text-center px-3 py-2 font-medium text-t3">{t('payStub')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {runEntries.map(entry => {
                          const e = entry as any
                          // Fix 1: Flag missing bank details
                          const emp = employees.find(emp => emp.id === e.employee_id)
                          const hasBankDetails = emp && (emp as any).bank_account_number
                          return (
                            <tr key={e.id} className="hover:bg-white/50">
                              <td className="px-3 py-2 text-t1 font-medium">{resolveEmployeeName(employees, e.employee_id, e.employee_name)}</td>
                              <td className="px-3 py-2 text-t2">{e.department}</td>
                              <td className="px-3 py-2">
                                {(() => {
                                  const pt = e.pay_type || 'full_month'
                                  const payTypeCfg: Record<string, { label: string; cls: string }> = {
                                    full_month: { label: 'Regular', cls: 'bg-gray-100 text-gray-600' },
                                    pro_rata_new: { label: 'Pro-Rata (New)', cls: 'bg-blue-100 text-blue-700' },
                                    pro_rata_exit: { label: 'Pro-Rata (Exit)', cls: 'bg-amber-100 text-amber-700' },
                                    final_pay: { label: 'Final Pay', cls: 'bg-red-100 text-red-700' },
                                    maternity: { label: 'Maternity', cls: 'bg-pink-100 text-pink-700' },
                                    paternity: { label: 'Paternity', cls: 'bg-purple-100 text-purple-700' },
                                  }
                                  const cfg = payTypeCfg[pt] || { label: pt, cls: 'bg-gray-100 text-gray-600' }
                                  return <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${cfg.cls}`}>{cfg.label}</span>
                                })()}
                              </td>
                              <td className="px-3 py-2">
                                {hasBankDetails
                                  ? <Badge variant="success"><CheckCircle2 size={10} /></Badge>
                                  : <Badge variant="error"><AlertTriangle size={10} /> Missing</Badge>
                                }
                              </td>
                              <td className="px-3 py-2 text-t1 text-right">{fmtCents(e.gross_pay)}</td>
                              <td className="px-3 py-2 text-t2 text-right">{fmtCents(e.federal_tax)}</td>
                              <td className="px-3 py-2 text-t2 text-right">{fmtCents(e.pension)}</td>
                              <td className="px-3 py-2 text-error text-right">-{fmtCents(e.total_deductions)}</td>
                              <td className="px-3 py-2 text-t1 text-right font-semibold">{fmtCents(e.net_pay)}</td>
                              <td className="px-3 py-2 text-center">
                                <Button size="sm" variant="ghost" onClick={() => setShowPayStubModal(e.id)}><Eye size={12} /></Button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                  {/* Audit Trail Toggle */}
                  <div className="mt-4 border-t border-divider pt-3">
                    <button
                      className="flex items-center gap-2 text-xs font-medium text-t2 hover:text-t1 transition-colors"
                      onClick={(ev) => { ev.stopPropagation(); loadAuditTrail(expandedRunId!) }}
                    >
                      <Shield size={14} />
                      Audit Trail
                      {auditTrailRunId === expandedRunId ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                    {auditTrailRunId === expandedRunId && (
                      <div className="mt-3 ml-4 border-l-2 border-tempo-200 pl-4 space-y-3">
                        {auditTrailLoading ? (
                          <p className="text-xs text-t3 animate-pulse">Loading audit trail...</p>
                        ) : auditTrail.length === 0 ? (
                          <p className="text-xs text-t3">No audit trail entries yet.</p>
                        ) : (
                          auditTrail.map((entry) => {
                            const actionLabels: Record<string, { label: string; color: string }> = {
                              created: { label: 'Created', color: 'bg-blue-100 text-blue-700' },
                              submitted: { label: 'Submitted for Approval', color: 'bg-amber-100 text-amber-700' },
                              approved_hr: { label: 'HR Approved', color: 'bg-emerald-100 text-emerald-700' },
                              approved_finance: { label: 'Finance Approved', color: 'bg-green-100 text-green-700' },
                              rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700' },
                              processing: { label: 'Processing', color: 'bg-indigo-100 text-indigo-700' },
                              paid: { label: 'Paid', color: 'bg-green-100 text-green-800' },
                              cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-700' },
                              entry_modified: { label: 'Entry Modified', color: 'bg-orange-100 text-orange-700' },
                            }
                            const cfg = actionLabels[entry.action] || { label: entry.action, color: 'bg-gray-100 text-gray-600' }
                            const ts = new Date(entry.createdAt)
                            return (
                              <div key={entry.id} className="relative">
                                <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-tempo-500 border-2 border-white" />
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg.color}`}>{cfg.label}</span>
                                  <span className="text-[10px] text-t3">{ts.toLocaleDateString()} {ts.toLocaleTimeString()}</span>
                                </div>
                                <p className="text-xs text-t2 mt-0.5">
                                  by <span className="font-medium text-t1">{entry.actorName}</span>
                                </p>
                                {entry.reason && (
                                  <p className="text-xs text-t3 mt-0.5 italic">&ldquo;{entry.reason}&rdquo;</p>
                                )}
                                {entry.newValue && typeof entry.newValue === 'object' && (entry.newValue as any).paymentReference && (
                                  <p className="text-xs text-t3 mt-0.5">Ref: <span className="font-mono">{(entry.newValue as any).paymentReference}</span></p>
                                )}
                              </div>
                            )
                          })
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })()}
          </Card>
        </>
      )}

      {/* ============================================================ */}
      {/* TAB 2: EMPLOYEE PAYROLL */}
      {/* ============================================================ */}
      {activeTab === 'employee-payroll' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard label={t('totalLaborCost')} value={`$${(employeePayrollEntries.reduce((s, e) => s + ((e as any).gross_pay || 0), 0) / 100_000).toFixed(0)}K`} change={t('lastRun')} changeType="neutral" icon={<DollarSign size={20} />} />
            <StatCard label={t('avgSalary')} value={`$${employeePayrollEntries.length > 0 ? (employeePayrollEntries.reduce((s, e) => s + ((e as any).gross_pay || 0), 0) / employeePayrollEntries.length / 100_000).toFixed(1) : '0'}K`} change={t('monthOverMonth')} changeType="neutral" icon={<Users size={20} />} />
            <StatCard label={t('taxBurden')} value={`${employeePayrollEntries.length > 0 ? Math.round(employeePayrollEntries.reduce((s, e) => s + ((e as any).total_deductions || 0), 0) / employeePayrollEntries.reduce((s, e) => s + ((e as any).gross_pay || 0), 0) * 100) : 0}%`} change={t('allDepartments')} changeType="neutral" icon={<FileText size={20} />} />
            <StatCard label={tc('employees')} value={employeePayrollEntries.length} change={t('onPayroll')} changeType="neutral" icon={<Users size={20} />} />
          </div>

          {/* Search & Filters */}
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-t3" />
              <input className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-lg bg-surface text-t1 focus:outline-none focus:ring-2 focus:ring-tempo-500/30"
                placeholder={t('searchEmployees')} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>
            <select className="px-3 py-2 text-sm border border-border rounded-lg bg-surface text-t1" value={filterDept} onChange={e => setFilterDept(e.target.value)}>
              <option value="">{t('allDepartments')}</option>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <select className="px-3 py-2 text-sm border border-border rounded-lg bg-surface text-t1" value={filterCountry} onChange={e => setFilterCountry(e.target.value)}>
              <option value="">{t('allCountries')}</option>
              {countries.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <Button size="sm" onClick={() => setShowAdjustmentModal(true)}><Plus size={14} /> {t('addAdjustment')}</Button>
          </div>

          <Card padding="none">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-divider bg-canvas">
                    <th className="tempo-th text-left px-6 py-3">{t('employeeName')}</th>
                    <th className="tempo-th text-left px-4 py-3">{t('department')}</th>
                    <th className="tempo-th text-left px-4 py-3">{t('country')}</th>
                    <th className="tempo-th text-right px-4 py-3">{t('grossPay')}</th>
                    <th className="tempo-th text-right px-4 py-3">{t('totalDeductionsLabel')}</th>
                    <th className="tempo-th text-right px-4 py-3">{t('netPay')}</th>
                    <th className="tempo-th text-center px-4 py-3">{t('payStub')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredEntries.length === 0 ? (
                    <tr><td colSpan={7} className="px-6 py-12 text-center text-xs text-t3">{t('noEntries')}</td></tr>
                  ) : filteredEntries.map(entry => {
                    const e = entry as any
                    return (
                      <tr key={e.id} className="hover:bg-canvas/50">
                        <td className="px-6 py-3">
                          <p className="text-xs font-medium text-t1">{resolveEmployeeName(employees, e.employee_id, e.employee_name)}</p>
                          <p className="text-xs text-t3">{e.employee_id}</p>
                        </td>
                        <td className="px-4 py-3 text-xs text-t2">{e.department}</td>
                        <td className="px-4 py-3 text-xs text-t2">{e.country}</td>
                        <td className="px-4 py-3 text-xs text-t1 text-right font-medium">{fmtCents(e.gross_pay)}</td>
                        <td className="px-4 py-3 text-xs text-error text-right">-{fmtCents(e.total_deductions)}</td>
                        <td className="px-4 py-3 text-xs text-t1 text-right font-semibold">{fmtCents(e.net_pay)}</td>
                        <td className="px-4 py-3 text-center">
                          <Button size="sm" variant="ghost" onClick={() => setShowPayStubModal(e.id)}>{t('viewStub')}</Button>
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
      {/* TAB 3: APPROVAL QUEUE (Fix 2) */}
      {/* ============================================================ */}
      {activeTab === 'approvals' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard label="Pending HR" value={pendingHRRuns.length} change="Awaiting HR review" changeType={pendingHRRuns.length > 0 ? 'negative' : 'positive'} icon={<UserCheck size={20} />} />
            <StatCard label="Pending Finance" value={pendingFinanceRuns.length} change="Awaiting Finance review" changeType={pendingFinanceRuns.length > 0 ? 'negative' : 'positive'} icon={<Building2 size={20} />} />
            <StatCard label="Approved" value={payrollRuns.filter(r => r.status === 'approved').length} change="Ready for processing" changeType="neutral" icon={<CheckCircle2 size={20} />} />
            <StatCard label="Total Runs" value={payrollRuns.length} change="All statuses" changeType="neutral" icon={<Wallet size={20} />} />
          </div>

          {pendingCount === 0 ? (
            <Card className="text-center py-12">
              <CheckCircle2 size={40} className="text-emerald-400 mx-auto mb-3" />
              <p className="text-sm font-medium text-t1 mb-1">No pending approvals</p>
              <p className="text-xs text-t3">All payroll runs have been reviewed.</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {pendingHRRuns.length > 0 && (
                <Card padding="none">
                  <CardHeader><CardTitle className="flex items-center gap-2"><UserCheck size={18} className="text-amber-500" /> Pending HR Approval</CardTitle></CardHeader>
                  <div className="divide-y divide-border">
                    {pendingHRRuns.map(run => (
                      <div key={run.id} className="flex items-center justify-between px-6 py-4 hover:bg-canvas/50">
                        <div>
                          <p className="text-sm font-medium text-t1">{run.period} <Badge variant="warning" className="ml-2">Pending HR</Badge></p>
                          <p className="text-xs text-t3">{run.employee_count} employees · {fmtCents(run.total_gross, COUNTRY_CURRENCY_MAP[(run as any).country] || undefined)} gross · {displayCountry((run as any).country || 'All')}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="primary" onClick={() => handleStatusAction(run.id, run.status, 'approve-hr')}>
                            <CheckCircle2 size={12} /> Approve
                          </Button>
                          <Button size="sm" variant="ghost" className="text-error" onClick={() => { setShowRejectModal(run.id); setRejectReason('') }}>
                            <XCircle size={12} /> Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {pendingFinanceRuns.length > 0 && (
                <Card padding="none">
                  <CardHeader><CardTitle className="flex items-center gap-2"><Building2 size={18} className="text-blue-500" /> Pending Finance Approval</CardTitle></CardHeader>
                  <div className="divide-y divide-border">
                    {pendingFinanceRuns.map(run => (
                      <div key={run.id} className="flex items-center justify-between px-6 py-4 hover:bg-canvas/50">
                        <div>
                          <p className="text-sm font-medium text-t1">{run.period} <Badge variant="info" className="ml-2">Pending Finance</Badge></p>
                          <p className="text-xs text-t3">{run.employee_count} employees · {fmtCents(run.total_gross, COUNTRY_CURRENCY_MAP[(run as any).country] || undefined)} gross · {displayCountry((run as any).country || 'All')}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="primary" onClick={() => handleStatusAction(run.id, run.status, 'approve-finance')}>
                            <CheckCircle2 size={12} /> Approve
                          </Button>
                          <Button size="sm" variant="ghost" className="text-error" onClick={() => { setShowRejectModal(run.id); setRejectReason('') }}>
                            <XCircle size={12} /> Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          )}
        </>
      )}

      {/* ============================================================ */}
      {/* TAB: RECONCILIATION */}
      {/* ============================================================ */}
      {activeTab === 'reconciliation' && (() => {
        const paidRuns = payrollRuns.filter(r => r.status === 'paid').sort((a: any, b: any) => (b.period || '').localeCompare(a.period || ''))
        const handleCompare = async () => {
          if (!reconPrevRunId || !reconCurrRunId) return
          setReconLoading(true)
          setReconError(null)
          try {
            const res = await fetch(`/api/payroll?action=reconciliation&previousRunId=${reconPrevRunId}&currentRunId=${reconCurrRunId}`)
            if (!res.ok) {
              const err = await res.json()
              throw new Error(err.error || 'Failed to generate reconciliation')
            }
            setReconData(await res.json())
          } catch (e: any) {
            setReconError(e.message)
          }
          setReconLoading(false)
        }
        const exportReconCSV = () => {
          if (!reconData?.rows) return
          const headers = ['Employee Name', 'Country', 'Previous Gross', 'Current Gross', 'Variance ($)', 'Variance (%)', 'Status']
          const csvRows = reconData.rows.map((r: any) => [
            r.employeeName,
            r.country,
            r.previousGross !== null ? (r.previousGross / 100).toFixed(2) : '',
            r.currentGross !== null ? (r.currentGross / 100).toFixed(2) : '',
            (r.variance / 100).toFixed(2),
            (r.variancePercent * 100).toFixed(1) + '%',
            r.status,
          ])
          const csv = [headers, ...csvRows].map(row => row.join(',')).join('\n')
          const blob = new Blob([csv], { type: 'text/csv' })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `reconciliation_${reconData.previousPeriod}_vs_${reconData.currentPeriod}.csv`
          a.click()
          URL.revokeObjectURL(url)
        }
        const statusBadge = (status: string) => {
          const cfg: Record<string, { label: string; cls: string }> = {
            new: { label: 'New', cls: 'bg-green-100 text-green-700' },
            exited: { label: 'Exited', cls: 'bg-red-100 text-red-700' },
            increase_significant: { label: 'Increase >20%', cls: 'bg-amber-100 text-amber-700' },
            decrease_significant: { label: 'Decrease >20%', cls: 'bg-amber-100 text-amber-700' },
            stable: { label: 'Stable', cls: 'bg-gray-100 text-gray-500' },
          }
          const c = cfg[status] || { label: status, cls: 'bg-gray-100 text-gray-500' }
          return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${c.cls}`}>{c.label}</span>
        }

        return (
          <>
            {/* Controls */}
            <Card className="mb-6 p-4">
              <div className="flex flex-wrap items-end gap-4">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-xs font-medium text-t3 mb-1">Previous Period</label>
                  <select className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-surface text-t1"
                    value={reconPrevRunId} onChange={e => setReconPrevRunId(e.target.value)}>
                    <option value="">Select a paid run...</option>
                    {paidRuns.map((r: any) => (
                      <option key={r.id} value={r.id}>{r.period} — {r.country || 'All'} ({fmtCents(r.total_gross)})</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-xs font-medium text-t3 mb-1">Current Period</label>
                  <select className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-surface text-t1"
                    value={reconCurrRunId} onChange={e => setReconCurrRunId(e.target.value)}>
                    <option value="">Select a paid run...</option>
                    {paidRuns.map((r: any) => (
                      <option key={r.id} value={r.id}>{r.period} — {r.country || 'All'} ({fmtCents(r.total_gross)})</option>
                    ))}
                  </select>
                </div>
                <Button onClick={handleCompare} disabled={!reconPrevRunId || !reconCurrRunId || reconLoading}>
                  {reconLoading ? 'Comparing...' : 'Compare'}
                </Button>
              </div>
              {reconError && <p className="mt-2 text-xs text-error">{reconError}</p>}
            </Card>

            {/* Results */}
            {reconData && (
              <>
                {/* Summary cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <StatCard label="Previous Total Gross" value={fmtCents(reconData.totalPreviousGross)} change={reconData.previousPeriod} changeType="neutral" icon={<DollarSign size={20} />} />
                  <StatCard label="Current Total Gross" value={fmtCents(reconData.totalCurrentGross)} change={reconData.currentPeriod} changeType="neutral" icon={<DollarSign size={20} />} />
                  <StatCard label="Total Variance" value={fmtCents(reconData.totalVariance)} change={`${(reconData.totalVariancePercent * 100).toFixed(1)}%`} changeType={reconData.totalVariance > 0 ? 'negative' : reconData.totalVariance < 0 ? 'positive' : 'neutral'} icon={<BarChart3 size={20} />} />
                  <StatCard label="Significant Changes" value={reconData.significantVarianceCount + reconData.newEmployeeCount + reconData.exitedEmployeeCount} change={`${reconData.newEmployeeCount} new, ${reconData.exitedEmployeeCount} exited`} changeType={reconData.significantVarianceCount > 0 ? 'negative' : 'neutral'} icon={<AlertTriangle size={20} />} />
                </div>

                {/* Export button */}
                <div className="flex justify-end mb-3">
                  <Button size="sm" variant="secondary" onClick={exportReconCSV}>
                    <Download size={14} /> Export CSV
                  </Button>
                </div>

                {/* Comparison table */}
                <Card padding="none">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-divider bg-canvas">
                          <th className="tempo-th text-left px-6 py-3">Employee</th>
                          <th className="tempo-th text-left px-4 py-3">Country</th>
                          <th className="tempo-th text-right px-4 py-3">Previous Gross</th>
                          <th className="tempo-th text-right px-4 py-3">Current Gross</th>
                          <th className="tempo-th text-right px-4 py-3">Variance ($)</th>
                          <th className="tempo-th text-right px-4 py-3">Variance (%)</th>
                          <th className="tempo-th text-center px-4 py-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {reconData.rows.map((row: any) => (
                          <tr key={row.employeeId} className="hover:bg-canvas/50">
                            <td className="px-6 py-3 text-sm font-medium text-t1">{row.employeeName}</td>
                            <td className="px-4 py-3 text-sm text-t2">{row.country}</td>
                            <td className="px-4 py-3 text-sm text-t2 text-right">{row.previousGross !== null ? fmtCents(row.previousGross) : '-'}</td>
                            <td className="px-4 py-3 text-sm text-t1 text-right font-medium">{row.currentGross !== null ? fmtCents(row.currentGross) : '-'}</td>
                            <td className={`px-4 py-3 text-sm text-right font-medium ${row.variance > 0 ? 'text-error' : row.variance < 0 ? 'text-success' : 'text-t2'}`}>
                              {row.variance > 0 ? '+' : ''}{fmtCents(row.variance)}
                            </td>
                            <td className={`px-4 py-3 text-sm text-right ${Math.abs(row.variancePercent) >= 0.2 ? 'font-semibold text-amber-600' : 'text-t2'}`}>
                              {row.previousGross !== null ? `${row.variancePercent > 0 ? '+' : ''}${(row.variancePercent * 100).toFixed(1)}%` : '-'}
                            </td>
                            <td className="px-4 py-3 text-center">{statusBadge(row.status)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </>
            )}
          </>
        )
      })()}

      {/* ============================================================ */}
      {/* TAB: YEAR-END REPORTS */}
      {/* ============================================================ */}
      {activeTab === 'year-end' && (role === 'admin' || role === 'owner') && (() => {
        const loadYearEnd = async () => {
          setYearEndLoading(true)
          try {
            const res = await fetch(`/api/payroll?action=year-end-summary&year=${yearEndYear}&country=${yearEndCountry}`)
            if (res.ok) {
              const data = await res.json()
              setYearEndEmployees(data.employees || [])
            }
          } catch { /* ignore */ }
          setYearEndLoading(false)
        }
        const downloadPDF = (employeeId: string) => {
          window.open(`/api/payroll?action=year-end-form&employeeId=${employeeId}&year=${yearEndYear}&country=${yearEndCountry}`, '_blank')
        }
        const downloadAllZip = () => {
          window.open(`/api/payroll?action=year-end-forms-bulk&year=${yearEndYear}&country=${yearEndCountry}`, '_blank')
        }
        const countryFormNames: Record<string, string> = { KE: 'Kenya P9A', NG: 'Nigeria Form H1', GH: 'Ghana PAYE' }

        return (
          <>
            <Card className="mb-6 p-4">
              <div className="flex flex-wrap items-end gap-4">
                <div>
                  <label className="block text-xs font-medium text-t3 mb-1">Year</label>
                  <select className="px-3 py-2 text-sm border border-border rounded-lg bg-surface text-t1"
                    value={yearEndYear} onChange={e => setYearEndYear(Number(e.target.value))}>
                    {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-t3 mb-1">Country</label>
                  <select className="px-3 py-2 text-sm border border-border rounded-lg bg-surface text-t1"
                    value={yearEndCountry} onChange={e => setYearEndCountry(e.target.value)}>
                    <option value="KE">Kenya (P9A)</option>
                    <option value="NG">Nigeria (Form H1)</option>
                    <option value="GH">Ghana (PAYE Return)</option>
                  </select>
                </div>
                <Button onClick={loadYearEnd} disabled={yearEndLoading}>
                  {yearEndLoading ? 'Loading...' : 'Load Employees'}
                </Button>
                {yearEndEmployees.length > 0 && (
                  <Button variant="secondary" onClick={downloadAllZip}>
                    <Download size={14} /> Generate All (ZIP)
                  </Button>
                )}
              </div>
            </Card>

            {yearEndEmployees.length > 0 && (
              <Card padding="none">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-divider bg-canvas">
                        <th className="tempo-th text-left px-6 py-3">Employee</th>
                        <th className="tempo-th text-left px-4 py-3">TIN</th>
                        <th className="tempo-th text-left px-4 py-3">Country</th>
                        <th className="tempo-th text-right px-4 py-3">Total Gross (YTD)</th>
                        <th className="tempo-th text-right px-4 py-3">Total Tax (YTD)</th>
                        <th className="tempo-th text-right px-4 py-3">Periods</th>
                        <th className="tempo-th text-center px-4 py-3">{countryFormNames[yearEndCountry] || 'PDF'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {yearEndEmployees.map((emp: any) => (
                        <tr key={emp.employeeId} className="hover:bg-canvas/50">
                          <td className="px-6 py-3 text-sm font-medium text-t1">{emp.employeeName}</td>
                          <td className="px-4 py-3 text-sm text-t2 font-mono">{emp.taxIdNumber || '-'}</td>
                          <td className="px-4 py-3 text-sm text-t2">{emp.country}</td>
                          <td className="px-4 py-3 text-sm text-t1 text-right font-medium">{fmtCents(emp.totalGross)}</td>
                          <td className="px-4 py-3 text-sm text-error text-right">{fmtCents(emp.totalTax)}</td>
                          <td className="px-4 py-3 text-sm text-t2 text-right">{emp.payPeriods}</td>
                          <td className="px-4 py-3 text-center">
                            <Button size="sm" variant="ghost" onClick={() => downloadPDF(emp.employeeId)}>
                              <Download size={12} /> PDF
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {yearEndEmployees.length === 0 && !yearEndLoading && (
              <Card className="p-8 text-center text-t3">
                <FileText size={40} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">Select a year and country, then click &ldquo;Load Employees&rdquo; to view year-end tax summaries.</p>
              </Card>
            )}
          </>
        )
      })()}

      {/* ============================================================ */}
      {/* TAB 4: ANALYTICS */}
      {/* ============================================================ */}
      {activeTab === 'analytics' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard label={t('totalLaborCost')} value={`$${(totalPayroll / 100_000_000).toFixed(2)}M`} change={t('allRuns')} changeType="neutral" icon={<DollarSign size={20} />} />
            <StatCard label={t('avgSalary')} value={`$${employeePayrollEntries.length > 0 ? (employeePayrollEntries.reduce((s, e) => s + ((e as any).gross_pay || 0), 0) / employeePayrollEntries.length / 100_000).toFixed(1) : '0'}K`} change={t('monthOverMonth')} changeType="neutral" icon={<Users size={20} />} />
            <StatCard label={t('taxBurden')} value={`${employeePayrollEntries.length > 0 ? Math.round(employeePayrollEntries.reduce((s, e) => s + ((e as any).total_deductions || 0), 0) / Math.max(1, employeePayrollEntries.reduce((s, e) => s + ((e as any).gross_pay || 0), 0)) * 100) : 0}%`} change={t('allDepartments')} changeType="neutral" icon={<FileText size={20} />} />
            <StatCard label={t('monthOverMonth')} value={`${trends.monthOverMonth > 0 ? '+' : ''}${trends.monthOverMonth}%`} change={payrollRuns.length >= 2 ? `${payrollRuns.length} ${t('payRuns').toLowerCase()}` : ''} changeType={trends.monthOverMonth > 3 ? 'negative' : trends.monthOverMonth < 0 ? 'positive' : 'neutral'} icon={<BarChart3 size={20} />} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Card>
              <h3 className="text-sm font-semibold text-t1 mb-4">{t('costByDepartment')}</h3>
              {trends.departmentTrends.length > 0 ? (
                <TempoBarChart
                  data={trends.departmentTrends.slice(0, 6).map(d => ({ name: d.department, cost: Math.round(d.totalCost / 100_000) }))}
                  bars={[{ dataKey: 'cost', name: 'Cost ($K)', color: CHART_COLORS.primary }]}
                  xKey="name" layout="horizontal" height={trends.departmentTrends.length * 36}
                  formatter={(v) => `$${v}K`} showGrid={false}
                />
              ) : <p className="text-sm text-t3">{t('noEntries')}</p>}
            </Card>
            <Card>
              <h3 className="text-sm font-semibold text-t1 mb-4">{t('costByCountry')}</h3>
              {(() => {
                const countryMap: Record<string, { total: number; count: number }> = {}
                employeePayrollEntries.forEach(e => {
                  const c = (e as any).country || 'Other'
                  if (!countryMap[c]) countryMap[c] = { total: 0, count: 0 }
                  countryMap[c].total += (e as any).gross_pay || 0
                  countryMap[c].count += 1
                })
                const items = Object.entries(countryMap).sort((a, b) => b[1].total - a[1].total)
                return items.length > 0 ? (
                  <>
                    <TempoDonutChart
                      data={items.map(([name, d]) => ({ name, value: Math.round(d.total / 100_000) }))}
                      colors={items.map((_, i) => CHART_SERIES[i % CHART_SERIES.length])}
                      centerLabel={`$${Math.round(items.reduce((s, [, d]) => s + d.total, 0) / 100_000_000)}M`}
                      centerSub="Total" height={180}
                    />
                    <div className="mt-3 space-y-1">
                      {items.map(([c, d]) => (
                        <div key={c} className="flex justify-between text-xs">
                          <span className="text-t2">{c}</span>
                          <span className="text-t1 font-medium">${(d.total / 100_000).toFixed(0)}K · {d.count} employees</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : <p className="text-sm text-t3">{t('noEntries')}</p>
              })()}
            </Card>
          </div>

          {payrollRuns.length > 0 && (
            <Card className="mb-6">
              <h3 className="text-sm font-semibold text-t1 mb-4">{t('laborCostTrend')}</h3>
              <TempoAreaChart
                data={payrollRuns.map(r => ({ name: r.period, gross: r.total_gross / 100_000, net: r.total_net / 100_000 }))}
                areas={[
                  { dataKey: 'gross', name: 'Gross ($K)', color: CHART_COLORS.primary },
                  { dataKey: 'net', name: 'Net ($K)', color: CHART_COLORS.emerald },
                ]}
                xKey="name" height={200} showLegend formatter={(v) => `$${v.toFixed(0)}K`}
              />
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {trends.projections.map(p => <AIInsightCard key={p.id} insight={p} compact />)}
            {taxOpts.recommendations.length > 0 && (
              <Card>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-t1">{t('taxOptimizations')}</h3>
                  <Badge variant="success">{t('estimatedSavings')}: ${(taxOpts.estimatedSavings / 100_000).toFixed(0)}K</Badge>
                </div>
                <AIRecommendationList recommendations={taxOpts.recommendations} />
              </Card>
            )}
          </div>
        </>
      )}

      {/* ============================================================ */}
      {/* TAB 5: COMPLIANCE */}
      {/* ============================================================ */}
      {activeTab === 'compliance' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="col-span-1">
              <Card className="text-center py-4">
                <p className="text-xs text-t3 mb-2">{t('complianceScore')}</p>
                <AIScoreBadge score={healthScore} size="lg" showBreakdown />
              </Card>
            </div>
            <StatCard label={t('openIssues')} value={complianceIssues.filter(i => (i as any).status !== 'resolved').length} change={`${complianceIssues.filter(i => (i as any).severity === 'critical' && (i as any).status !== 'resolved').length} ${t('critical').toLowerCase()}`} changeType={complianceIssues.filter(i => (i as any).severity === 'critical' && (i as any).status !== 'resolved').length > 0 ? 'negative' : 'positive'} icon={<AlertTriangle size={20} />} />
            <StatCard label={t('urgentItems')} value={complianceRisks.urgentCount} change={complianceRisks.nextDeadline ? `${t('nextDeadline')}: ${complianceRisks.nextDeadline}` : ''} changeType={complianceRisks.urgentCount > 0 ? 'negative' : 'positive'} icon={<Clock size={20} />} />
            <StatCard label={t('taxFilings')} value={`${taxFilings.filter(f => (f as any).status === 'filed').length}/${taxFilings.length}`} change={`${taxFilings.filter(f => (f as any).status === 'overdue').length} ${t('overdue').toLowerCase()}`} changeType={taxFilings.filter(f => (f as any).status === 'overdue').length > 0 ? 'negative' : 'neutral'} icon={<FileText size={20} />} />
          </div>

          <Card padding="none" className="mb-6">
            <CardHeader><CardTitle>{t('complianceIssues')}</CardTitle></CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-divider bg-canvas">
                    <th className="tempo-th text-left px-6 py-3">{t('severity')}</th>
                    <th className="tempo-th text-left px-4 py-3">{t('complianceType')}</th>
                    <th className="tempo-th text-left px-4 py-3">{t('country')}</th>
                    <th className="tempo-th text-left px-4 py-3">{t('description')}</th>
                    <th className="tempo-th text-center px-4 py-3">{t('filingDeadline')}</th>
                    <th className="tempo-th text-center px-4 py-3">{tc('status')}</th>
                    <th className="tempo-th text-center px-4 py-3">{tc('actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {complianceIssues.filter(i => (i as any).status !== 'resolved').length === 0 ? (
                    <tr><td colSpan={7} className="px-6 py-12 text-center text-xs text-t3"><CheckCircle2 className="inline mr-2" size={16} />{t('noComplianceIssues')}</td></tr>
                  ) : complianceIssues.filter(i => (i as any).status !== 'resolved').map(issue => {
                    const ci = issue as any
                    return (
                      <tr key={ci.id} className="hover:bg-canvas/50">
                        <td className="px-6 py-3"><Badge variant={ci.severity === 'critical' ? 'error' : ci.severity === 'warning' ? 'warning' : 'info'}>{ci.severity}</Badge></td>
                        <td className="px-4 py-3 text-xs text-t1">{ci.type?.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}</td>
                        <td className="px-4 py-3 text-xs text-t2">{ci.country}</td>
                        <td className="px-4 py-3 text-xs text-t2 max-w-xs truncate">{ci.description}</td>
                        <td className="px-4 py-3 text-xs text-t2 text-center">{ci.deadline}</td>
                        <td className="px-4 py-3 text-center"><Badge variant={ci.status === 'open' ? 'warning' : 'info'}>{ci.status}</Badge></td>
                        <td className="px-4 py-3 text-center">
                          <Button size="sm" variant="ghost" onClick={() => resolveComplianceIssue(ci.id)}>{t('resolveIssue')}</Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          <Card padding="none" className="mb-6">
            <CardHeader><CardTitle>{t('taxFilings')}</CardTitle></CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-divider bg-canvas">
                    <th className="tempo-th text-left px-6 py-3">{t('formName')}</th>
                    <th className="tempo-th text-left px-4 py-3">{t('country')}</th>
                    <th className="tempo-th text-left px-4 py-3">{t('filingPeriod')}</th>
                    <th className="tempo-th text-center px-4 py-3">{t('filingFrequency')}</th>
                    <th className="tempo-th text-center px-4 py-3">{t('filingDeadline')}</th>
                    <th className="tempo-th text-center px-4 py-3">{tc('status')}</th>
                    <th className="tempo-th text-center px-4 py-3">{tc('actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {taxFilings.map(filing => {
                    const tf = filing as any
                    return (
                      <tr key={tf.id} className="hover:bg-canvas/50">
                        <td className="px-6 py-3">
                          <p className="text-sm font-medium text-t1">{tf.form_name}</p>
                          <p className="text-xs text-t3">{tf.description}</p>
                        </td>
                        <td className="px-4 py-3 text-xs text-t2">{tf.country}</td>
                        <td className="px-4 py-3 text-xs text-t2">{tf.filing_period}</td>
                        <td className="px-4 py-3 text-xs text-t2 text-center capitalize">{tf.frequency}</td>
                        <td className="px-4 py-3 text-xs text-t2 text-center">{tf.deadline}</td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant={tf.status === 'filed' ? 'success' : tf.status === 'overdue' ? 'error' : 'warning'}>{tf.status}</Badge>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {tf.status !== 'filed' && (
                            <Button size="sm" variant="ghost" onClick={() => updateTaxFiling(tf.id, { status: 'filed', filed_date: new Date().toISOString().split('T')[0] })}>{t('markFiled')}</Button>
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
      {/* TAB 6: CONTRACTORS */}
      {/* ============================================================ */}
      {activeTab === 'contractors' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard label={t('totalContractors')} value={contractorPayments.length} change={t('allCountries')} changeType="neutral" icon={<Briefcase size={20} />} />
            <StatCard label={t('pendingPayments')} value={contractorPayments.filter(cp => (cp as any).status === 'pending' || (cp as any).status === 'approved').length} change={`$${(contractorPayments.filter(cp => (cp as any).status !== 'paid').reduce((s, cp) => s + ((cp as any).amount || 0), 0) / 100_000).toFixed(0)}K`} changeType="neutral" icon={<Clock size={20} />} />
            <StatCard label={t('totalPaidThisMonth')} value={`$${(contractorPayments.filter(cp => (cp as any).status === 'paid').reduce((s, cp) => s + ((cp as any).amount || 0), 0) / 100_000).toFixed(0)}K`} change={t('lastRun')} changeType="neutral" icon={<DollarSign size={20} />} />
            <Card className="text-center py-3">
              <p className="text-xs text-t3 mb-1">{t('contractorRiskScore')}</p>
              <p className={`text-2xl font-bold ${contractorRisk.riskScore > 50 ? 'text-error' : contractorRisk.riskScore > 30 ? 'text-amber-500' : 'text-emerald-500'}`}>{contractorRisk.riskScore}/100</p>
            </Card>
          </div>

          <Card padding="none" className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t('contractorPayments')}</CardTitle>
                <Button size="sm" onClick={() => setShowContractorModal(true)}><Plus size={14} /> {t('addPayment')}</Button>
              </div>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-divider bg-canvas">
                    <th className="tempo-th text-left px-6 py-3">{t('contractorName')}</th>
                    <th className="tempo-th text-left px-4 py-3">{t('serviceType')}</th>
                    <th className="tempo-th text-right px-4 py-3">{t('amount')}</th>
                    <th className="tempo-th text-center px-4 py-3">{t('dueDate')}</th>
                    <th className="tempo-th text-center px-4 py-3">{tc('status')}</th>
                    <th className="tempo-th text-center px-4 py-3">{tc('actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {contractorPayments.length === 0 ? (
                    <tr><td colSpan={6} className="px-6 py-12 text-center text-xs text-t3">{t('noContractorPayments')}</td></tr>
                  ) : contractorPayments.map(payment => {
                    const cp = payment as any
                    return (
                      <tr key={cp.id} className="hover:bg-canvas/50">
                        <td className="px-6 py-3">
                          <p className="text-sm font-medium text-t1">{cp.contractor_name}</p>
                          <p className="text-xs text-t3">{cp.company} · {cp.country}</p>
                        </td>
                        <td className="px-4 py-3 text-xs text-t2">{cp.service_type}</td>
                        <td className="px-4 py-3 text-xs text-t1 text-right font-medium">{fmtCents(cp.amount)}</td>
                        <td className="px-4 py-3 text-xs text-t2 text-center">{cp.due_date}</td>
                        <td className="px-4 py-3 text-center"><Badge variant={cp.status === 'paid' ? 'success' : cp.status === 'approved' ? 'info' : 'warning'}>{cp.status}</Badge></td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex gap-1 justify-center">
                            {cp.status === 'pending' && <Button size="sm" variant="ghost" onClick={() => updateContractorPayment(cp.id, { status: 'approved' })}>{t('approvePayment')}</Button>}
                            {cp.status === 'approved' && <Button size="sm" variant="ghost" onClick={() => updateContractorPayment(cp.id, { status: 'paid', paid_date: new Date().toISOString().split('T')[0] })}>{t('markPaid')}</Button>}
                          </div>
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
      {/* TAB: TAX CONFIGURATION */}
      {/* ============================================================ */}
      {activeTab === 'tax-config' && (role === 'admin' || role === 'owner') && (() => {
        const loadTaxConfigs = async () => {
          setTaxConfigLoading(true)
          try {
            const res = await fetch('/api/payroll?action=tax-configs-grouped')
            if (res.ok) {
              const data = await res.json()
              setTaxConfigData(data.configs || {})
            }
          } catch { /* ignore */ }
          setTaxConfigLoading(false)
        }
        const handleUpdateRate = async () => {
          if (!showTaxEditModal) return
          try {
            await fetch('/api/payroll', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'update-tax-config',
                configId: showTaxEditModal.id,
                country: showTaxEditModal.country,
                taxType: showTaxEditModal.taxType,
                rate: taxEditForm.rate,
                description: showTaxEditModal.description,
                employerContribution: taxEditForm.employerContribution,
                employeeContribution: taxEditForm.employeeContribution,
                effectiveDate: taxEditForm.effectiveDate || new Date().toISOString().split('T')[0],
              }),
            })
            addToast?.('Tax rate updated — old rate superseded')
            setShowTaxEditModal(null)
            loadTaxConfigs()
          } catch {
            addToast?.('Failed to update tax rate')
          }
        }
        const allCountries = Object.keys(taxConfigData).sort()
        const filteredConfigs = taxConfigCountry
          ? { [taxConfigCountry]: taxConfigData[taxConfigCountry] || [] }
          : taxConfigData

        return (
          <>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
              <p className="text-xs text-amber-700 font-medium">Changes apply to future payroll runs only. Existing runs are not affected.</p>
            </div>

            <Card className="mb-4 p-4">
              <div className="flex flex-wrap items-end gap-4">
                <div>
                  <label className="block text-xs font-medium text-t3 mb-1">Country</label>
                  <select className="px-3 py-2 text-sm border border-border rounded-lg bg-surface text-t1"
                    value={taxConfigCountry} onChange={e => setTaxConfigCountry(e.target.value)}>
                    <option value="">All Countries</option>
                    {allCountries.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <Button onClick={loadTaxConfigs} disabled={taxConfigLoading}>
                  {taxConfigLoading ? 'Loading...' : 'Load Tax Configs'}
                </Button>
              </div>
            </Card>

            {Object.keys(filteredConfigs).length > 0 ? (
              Object.entries(filteredConfigs).map(([country, configs]) => (
                <Card key={country} padding="none" className="mb-4">
                  <div className="px-6 py-3 bg-canvas border-b border-divider">
                    <h3 className="text-sm font-semibold text-t1">{country}</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-divider">
                          <th className="text-left px-6 py-2 font-medium text-t3 text-xs">Tax Name</th>
                          <th className="text-left px-4 py-2 font-medium text-t3 text-xs">Type</th>
                          <th className="text-right px-4 py-2 font-medium text-t3 text-xs">Employee %</th>
                          <th className="text-right px-4 py-2 font-medium text-t3 text-xs">Employer %</th>
                          <th className="text-left px-4 py-2 font-medium text-t3 text-xs">Effective Date</th>
                          <th className="text-center px-4 py-2 font-medium text-t3 text-xs">Status</th>
                          <th className="text-center px-4 py-2 font-medium text-t3 text-xs">Edit</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {(configs as any[]).map((cfg: any) => (
                          <tr key={cfg.id} className="hover:bg-canvas/50">
                            <td className="px-6 py-2 text-t1 font-medium">{cfg.description || cfg.taxType}</td>
                            <td className="px-4 py-2 text-t2">{cfg.taxType}</td>
                            <td className="px-4 py-2 text-t1 text-right">{(cfg.employeeContribution * 100).toFixed(1)}%</td>
                            <td className="px-4 py-2 text-t1 text-right">{(cfg.employerContribution * 100).toFixed(1)}%</td>
                            <td className="px-4 py-2 text-t2">{cfg.effectiveDate || '-'}</td>
                            <td className="px-4 py-2 text-center">
                              <Badge variant={cfg.status === 'active' ? 'success' : 'default'}>{cfg.status}</Badge>
                            </td>
                            <td className="px-4 py-2 text-center">
                              <Button size="sm" variant="ghost" onClick={() => {
                                setShowTaxEditModal(cfg)
                                setTaxEditForm({
                                  rate: cfg.rate,
                                  employeeContribution: cfg.employeeContribution,
                                  employerContribution: cfg.employerContribution,
                                  effectiveDate: new Date().toISOString().split('T')[0],
                                })
                              }}>
                                <Settings size={12} />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              ))
            ) : (
              <Card className="p-8 text-center text-t3">
                <Globe size={40} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">Click &ldquo;Load Tax Configs&rdquo; to view and manage tax rates.</p>
                <p className="text-xs mt-1">If no configs exist, the system uses built-in statutory rates.</p>
              </Card>
            )}

            {/* Edit modal */}
            {showTaxEditModal && (
              <Modal open={!!showTaxEditModal} title={`Edit: ${showTaxEditModal.description || showTaxEditModal.taxType}`} onClose={() => setShowTaxEditModal(null)}>
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded p-2">
                    <p className="text-xs text-blue-700">Current rate: <strong>{(showTaxEditModal.rate * 100).toFixed(2)}%</strong></p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-t3 mb-1">Employee Rate (%)</label>
                      <input type="number" step="0.01" className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-surface text-t1"
                        value={(taxEditForm.employeeContribution * 100).toFixed(2)}
                        onChange={e => setTaxEditForm(p => ({ ...p, employeeContribution: Number(e.target.value) / 100 }))} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-t3 mb-1">Employer Rate (%)</label>
                      <input type="number" step="0.01" className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-surface text-t1"
                        value={(taxEditForm.employerContribution * 100).toFixed(2)}
                        onChange={e => setTaxEditForm(p => ({ ...p, employerContribution: Number(e.target.value) / 100 }))} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-t3 mb-1">Effective Date</label>
                    <input type="date" className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-surface text-t1"
                      value={taxEditForm.effectiveDate}
                      onChange={e => setTaxEditForm(p => ({ ...p, effectiveDate: e.target.value }))} />
                  </div>
                  {/* T5 #40: Impact warning for tax rate change */}
                  {taxEditForm.effectiveDate && (taxEditForm.employeeContribution !== showTaxEditModal.employeeContribution || taxEditForm.employerContribution !== showTaxEditModal.employerContribution) && (() => {
                    const affectedCount = employees.filter(e => {
                      const empCountry = (e.country || '').toLowerCase()
                      return taxConfigCountry ? empCountry.includes(taxConfigCountry.toLowerCase()) : true
                    }).length
                    return (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <AlertTriangle size={14} className="text-amber-600 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-xs font-medium text-amber-800">This change will affect ~{affectedCount} employee(s) in the next payroll run.</p>
                            <p className="text-xs text-amber-700 mt-1">Payroll runs already completed will not be recalculated. Change takes effect from {taxEditForm.effectiveDate}.</p>
                            <p className="text-xs text-amber-700 mt-1">Estimated change: Employee rate {showTaxEditModal.employeeContribution !== taxEditForm.employeeContribution ? `${(showTaxEditModal.employeeContribution * 100).toFixed(1)}% → ${(taxEditForm.employeeContribution * 100).toFixed(1)}%` : 'no change'}, Employer rate {showTaxEditModal.employerContribution !== taxEditForm.employerContribution ? `${(showTaxEditModal.employerContribution * 100).toFixed(1)}% → ${(taxEditForm.employerContribution * 100).toFixed(1)}%` : 'no change'}.</p>
                          </div>
                        </div>
                      </div>
                    )
                  })()}
                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="secondary" onClick={() => setShowTaxEditModal(null)}>Cancel</Button>
                    <Button onClick={handleUpdateRate}>Save &amp; Supersede Old Rate</Button>
                  </div>
                </div>
              </Modal>
            )}
          </>
        )
      })()}

      {/* ============================================================ */}
      {/* TAB 7: SETTINGS */}
      {/* ============================================================ */}
      {activeTab === 'settings' && (
        <>
          <Card padding="none" className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t('payrollSchedules')}</CardTitle>
                <Button size="sm" onClick={() => setShowScheduleModal(true)}><Plus size={14} /> {t('createSchedule')}</Button>
              </div>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-divider bg-canvas">
                    <th className="tempo-th text-left px-6 py-3">{t('scheduleName')}</th>
                    <th className="tempo-th text-center px-4 py-3">{t('frequency')}</th>
                    <th className="tempo-th text-left px-4 py-3">{t('employeeGroup')}</th>
                    <th className="tempo-th text-center px-4 py-3">{t('nextRun')}</th>
                    <th className="tempo-th text-center px-4 py-3">{t('autoApprove')}</th>
                    <th className="tempo-th text-center px-4 py-3">{t('scheduleStatus')}</th>
                    <th className="tempo-th text-center px-4 py-3">{tc('actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {payrollSchedules.length === 0 ? (
                    <tr><td colSpan={7} className="px-6 py-12 text-center text-xs text-t3">{t('noSchedules')}</td></tr>
                  ) : payrollSchedules.map(schedule => {
                    const ps = schedule as any
                    return (
                      <tr key={ps.id} className="hover:bg-canvas/50">
                        <td className="px-6 py-3 text-xs font-medium text-t1">{ps.name}</td>
                        <td className="px-4 py-3 text-xs text-t2 text-center capitalize">{ps.frequency}</td>
                        <td className="px-4 py-3 text-xs text-t2">{ps.employee_group}</td>
                        <td className="px-4 py-3 text-xs text-t2 text-center">{ps.next_run_date}</td>
                        <td className="px-4 py-3 text-center">{ps.auto_approve ? <CheckCircle2 size={16} className="inline text-emerald-500" /> : <span className="text-t3">-</span>}</td>
                        <td className="px-4 py-3 text-center"><Badge variant={ps.status === 'active' ? 'success' : 'default'}>{ps.status}</Badge></td>
                        <td className="px-4 py-3 text-center">
                          <Button size="sm" variant="ghost" onClick={() => updatePayrollSchedule(ps.id, { status: ps.status === 'active' ? 'paused' : 'active' })}>
                            {ps.status === 'active' ? t('paused') : t('active')}
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          <Card padding="none" className="mb-6">
            <CardHeader><CardTitle>{t('taxConfiguration')}</CardTitle></CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-divider bg-canvas">
                    <th className="tempo-th text-left px-6 py-3">{t('country')}</th>
                    <th className="tempo-th text-left px-4 py-3">{t('description')}</th>
                    <th className="tempo-th text-center px-4 py-3">{t('taxRate')}</th>
                    <th className="tempo-th text-center px-4 py-3">{t('employerContribution')}</th>
                    <th className="tempo-th text-center px-4 py-3">{t('employeeContribution')}</th>
                    <th className="tempo-th text-center px-4 py-3">{tc('status')}</th>
                    <th className="tempo-th text-center px-4 py-3">{tc('actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {taxConfigs.map(config => {
                    const tc2 = config as any
                    return (
                      <tr key={tc2.id} className="hover:bg-canvas/50">
                        <td className="px-6 py-3">
                          <p className="text-sm font-medium text-t1">{tc2.country}</p>
                          <p className="text-xs text-t3">{tc2.tax_type}</p>
                        </td>
                        <td className="px-4 py-3 text-xs text-t2 max-w-xs truncate">{tc2.description}</td>
                        <td className="px-4 py-3 text-xs text-t1 text-center font-semibold">{tc2.rate}%</td>
                        <td className="px-4 py-3 text-xs text-t2 text-center">{tc2.employer_contribution}%</td>
                        <td className="px-4 py-3 text-xs text-t2 text-center">{tc2.employee_contribution}%</td>
                        <td className="px-4 py-3 text-center"><Badge variant={tc2.status === 'active' ? 'success' : 'warning'}>{tc2.status}</Badge></td>
                        <td className="px-4 py-3 text-center">
                          <Button size="sm" variant="ghost" onClick={() => setShowTaxConfigModal(tc2.id)}>{t('edit')}</Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Tax Simulator */}
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Calculator size={18} className="text-tempo-600" />
              <h3 className="text-sm font-semibold text-t1">{t('taxSimulator')}</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium text-t2 mb-1 block">{t('selectCountry')}</label>
                <select className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-surface text-t1" value={simCountry} onChange={e => setSimCountry(e.target.value as SupportedCountry)}>
                  {(['US', 'UK', 'DE', 'FR', 'CA', 'AU'] as const).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-t2 mb-1 block">{t('enterGrossSalary')}</label>
                <input className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-surface text-t1" type="number" value={simSalary} onChange={e => setSimSalary(Number(e.target.value))} />
              </div>
              <div className="flex items-end">
                <Button size="sm" onClick={() => addToast('Tax simulation refreshed')}><Calculator size={14} /> {t('simulateTax')}</Button>
              </div>
            </div>
            {simResult && (
              <div className="mt-4 bg-canvas rounded-lg p-4">
                <h4 className="text-sm font-semibold text-t1 mb-3">{t('simulationResult')} — {simCountry}</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: t('grossPay'), value: `$${simResult.grossSalary.toLocaleString()}`, color: 'text-t1' },
                    { label: t('federalTax'), value: `-$${simResult.federalTax.toLocaleString()}`, color: 'text-error' },
                    { label: t('socialSecurity'), value: `-$${simResult.socialSecurity.toLocaleString()}`, color: 'text-error' },
                    { label: t('pension'), value: `-$${simResult.pension.toLocaleString()}`, color: 'text-error' },
                    { label: t('totalDeductionsLabel'), value: `-$${simResult.totalTax.toLocaleString()}`, color: 'text-error font-semibold' },
                    { label: t('netPay'), value: `$${simResult.netPay.toLocaleString()}`, color: 'text-t1 font-bold' },
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
        </>
      )}

      {/* ============================================================ */}
      {/* MODALS */}
      {/* ============================================================ */}

      {/* New Pay Run Modal — Simplified: only country + period, engine handles calculation */}
      <Modal open={showPayRunModal} onClose={() => setShowPayRunModal(false)} title={t('createPayRunModal')}>
        <div className="space-y-4">
          {/* Country selector */}
          <div>
            <label className="text-xs font-medium text-t2 mb-1 block">Country *</label>
            <select
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-surface text-t1"
              value={payRunForm.country}
              onChange={e => handleCountryChange(e.target.value)}
            >
              <option value="">Select country...</option>
              {availableCountries.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {payRunForm.country && (
              <p className="text-xs text-t3 mt-1">
                {employees.filter(e => e.country === payRunForm.country && (e as any).is_active !== false).length} active employees in {payRunForm.country} · Currency: {payRunForm.currency}
              </p>
            )}
          </div>
          {/* Period selector (month picker) */}
          <div>
            <label className="text-xs font-medium text-t2 mb-1 block">{t('payPeriod')} *</label>
            <input
              type="month"
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-surface text-t1 focus:outline-none focus:ring-2 focus:ring-tempo-500/30"
              value={payRunForm.period}
              onChange={e => setPayRunForm({ ...payRunForm, period: e.target.value })}
            />
          </div>
          {processError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">{processError}</p>
            </div>
          )}
          <div className="bg-canvas rounded-lg p-3">
            <p className="text-xs text-t3">The payroll engine will automatically calculate gross pay, deductions, and net pay for all eligible employees in the selected country.</p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowPayRunModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitPayRun} disabled={!payRunForm.country || !payRunForm.period || isProcessing}>
              {isProcessing ? 'Processing...' : t('createPayRun')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Pay Stub Preview Modal */}
      <Modal open={!!showPayStubModal} onClose={() => setShowPayStubModal(null)} title={t('payStubPreview')}>
        {selectedStub && (() => {
          const s = selectedStub as any
          return (
            <div className="space-y-4">
              <div className="bg-canvas rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-sm font-semibold text-t1">{resolveEmployeeName(employees, s.employee_id, s.employee_name)}</p>
                    <p className="text-xs text-t3">{s.department} · {s.country}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-t3">{t('payDate')}</p>
                    <p className="text-sm font-medium text-t1">{s.pay_date}</p>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-t2 uppercase mb-2">{t('earnings')}</h4>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm"><span className="text-t2">{t('baseSalary')}</span><span className="text-t1">{fmtCents(s.gross_pay)}</span></div>
                  {s.bonus > 0 && <div className="flex justify-between text-sm"><span className="text-t2">{t('bonus')}</span><span className="text-t1">{fmtCents(s.bonus)}</span></div>}
                  {s.overtime > 0 && <div className="flex justify-between text-sm"><span className="text-t2">{t('overtime')}</span><span className="text-t1">{fmtCents(s.overtime)}</span></div>}
                  <div className="flex justify-between text-sm font-semibold border-t border-divider pt-1"><span className="text-t1">{t('grossPay')}</span><span className="text-t1">{fmtCents(s.gross_pay)}</span></div>
                </div>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-t2 uppercase mb-2">{t('deductions')}</h4>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm"><span className="text-t2">{t('federalTax')}</span><span className="text-error">-{fmtCents(s.federal_tax)}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-t2">{t('socialSecurity')}</span><span className="text-error">-{fmtCents(s.social_security)}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-t2">{t('pension')}</span><span className="text-error">-{fmtCents(s.pension)}</span></div>
                  <div className="flex justify-between text-sm font-semibold border-t border-divider pt-1"><span className="text-t1">{t('totalDeductionsLabel')}</span><span className="text-error">-{fmtCents(s.total_deductions)}</span></div>
                </div>
              </div>
              <div className="bg-tempo-50 rounded-lg p-4 flex justify-between items-center">
                <span className="text-sm font-semibold text-t1">{t('netPay')}</span>
                <span className="text-xl font-bold text-tempo-700">{fmtCents(s.net_pay)}</span>
              </div>
            </div>
          )
        })()}
      </Modal>

      {/* Fix 2: Reject Modal */}
      <Modal open={!!showRejectModal} onClose={() => setShowRejectModal(null)} title="Reject Payroll Run">
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-800">This will return the payroll run to Draft status. The payroll officer will see your rejection reason.</p>
          </div>
          <div>
            <label className="text-xs font-medium text-t2 mb-1 block">Rejection Reason *</label>
            <textarea
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-surface text-t1 focus:outline-none focus:ring-2 focus:ring-red-500/30"
              rows={3}
              placeholder="Explain why this payroll run is being rejected..."
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowRejectModal(null)}>{tc('cancel')}</Button>
            <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={() => showRejectModal && handleReject(showRejectModal)}>
              <XCircle size={14} /> Reject
            </Button>
          </div>
        </div>
      </Modal>

      {/* Validation Warning Modal */}
      <Modal open={showValidationWarning} onClose={() => { setShowValidationWarning(false); setIsProcessing(false) }} title="Payroll Validation Warning">
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
            <AlertTriangle size={16} className="text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800">Some employees are ineligible for this pay run</p>
              <p className="text-xs text-amber-700 mt-1">The following employees will be excluded if you proceed.</p>
            </div>
          </div>
          {validationResult?.ineligible && validationResult.ineligible.length > 0 && (
            <div className="overflow-x-auto max-h-48 overflow-y-auto border border-border rounded-lg">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-divider bg-canvas sticky top-0">
                    <th className="text-left px-3 py-2 font-medium text-t3">Employee</th>
                    <th className="text-left px-3 py-2 font-medium text-t3">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {validationResult.ineligible.map(emp => (
                    <tr key={emp.id} className="hover:bg-canvas/50">
                      <td className="px-3 py-2 text-t1 font-medium">{emp.name}</td>
                      <td className="px-3 py-2 text-amber-700">{emp.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {validationResult?.eligible && (
            <p className="text-xs text-t3">
              {validationResult.eligible.length} eligible employee{validationResult.eligible.length !== 1 ? 's' : ''} will be included in this pay run.
            </p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => { setShowValidationWarning(false); setIsProcessing(false) }}>{tc('cancel')}</Button>
            <Button className="bg-amber-600 hover:bg-amber-700 text-white" onClick={() => executePayRun()}>
              Proceed Anyway
            </Button>
          </div>
        </div>
      </Modal>

      {/* Bank Export Warning Modal */}
      <Modal open={showBankExportWarning} onClose={() => { setShowBankExportWarning(false); setBankExportPreview(null); setPendingBankExportRunId(null) }} title="Bank File Export Warning">
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
            <AlertTriangle size={16} className="text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800">
                {bankExportPreview?.excluded.length} employee{bankExportPreview?.excluded.length !== 1 ? 's' : ''} will be excluded from the payment file
              </p>
              <p className="text-xs text-amber-700 mt-1">These employees are missing bank details and will not receive payment via this file.</p>
            </div>
          </div>
          {bankExportPreview?.excluded && bankExportPreview.excluded.length > 0 && (
            <div className="overflow-x-auto max-h-48 overflow-y-auto border border-border rounded-lg">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-divider bg-canvas sticky top-0">
                    <th className="text-left px-3 py-2 font-medium text-t3">Employee</th>
                    <th className="text-left px-3 py-2 font-medium text-t3">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {bankExportPreview.excluded.map((emp, i) => (
                    <tr key={i} className="hover:bg-canvas/50">
                      <td className="px-3 py-2 text-t1 font-medium">{emp.name}</td>
                      <td className="px-3 py-2 text-amber-700">{emp.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {bankExportPreview?.included && (
            <p className="text-xs text-t3">
              {bankExportPreview.included.length} employee{bankExportPreview.included.length !== 1 ? 's' : ''} will be included in the payment file.
            </p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => { setShowBankExportWarning(false); setBankExportPreview(null); setPendingBankExportRunId(null) }}>{tc('cancel')}</Button>
            <Button className="bg-amber-600 hover:bg-amber-700 text-white" onClick={() => pendingBankExportRunId && executeBankFileDownload(pendingBankExportRunId)}>
              <Download size={14} /> Download Anyway
            </Button>
          </div>
        </div>
      </Modal>

      {/* T5 #37: Missing Bank Details Warning Modal */}
      <Modal open={showBankDetailWarning} onClose={() => setShowBankDetailWarning(false)} title="Missing Bank Details">
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
            <AlertTriangle size={16} className="text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800">{missingBankEmployees.length} employee(s) are missing bank account details</p>
              <p className="text-xs text-amber-700 mt-1">These employees will be excluded from the bank payment file.</p>
            </div>
          </div>
          <div className="overflow-x-auto max-h-48 overflow-y-auto border border-border rounded-lg">
            <table className="w-full text-xs">
              <thead><tr className="border-b border-divider bg-canvas sticky top-0">
                <th className="text-left px-3 py-2 font-medium text-t3">Employee</th>
                <th className="text-left px-3 py-2 font-medium text-t3">Department</th>
              </tr></thead>
              <tbody className="divide-y divide-border">
                {missingBankEmployees.map(emp => (
                  <tr key={emp.id}><td className="px-3 py-2 text-t1">{emp.profile?.full_name || emp.id}</td>
                  <td className="px-3 py-2 text-t3">{emp.department_id}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowBankDetailWarning(false)}>Pause &amp; Collect Details</Button>
            <Button className="bg-amber-600 hover:bg-amber-700 text-white" onClick={() => { setShowBankDetailWarning(false); submitPayRun() }}>Proceed Anyway</Button>
          </div>
        </div>
      </Modal>

      {/* T5 #45: Escalation Modal */}
      <Modal open={showEscalationModal} onClose={() => setShowEscalationModal(false)} title="Payroll Escalated — CEO/CFO Review Required">
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
            <AlertTriangle size={16} className="text-red-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-800">This payroll run has been rejected 3 times by Finance</p>
              <p className="text-xs text-red-700 mt-1">CEO and Group CFO have been notified. A written resolution note is required before resubmission.</p>
            </div>
          </div>
          <Textarea label="Resolution Note (required)" value={escalationNote} onChange={e => setEscalationNote(e.target.value)} placeholder="Describe the resolution agreed upon by CEO/CFO..." />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowEscalationModal(false)}>Close</Button>
            <Button onClick={resolveEscalation} disabled={!escalationNote.trim()}>Resolve &amp; Return to Draft</Button>
          </div>
        </div>
      </Modal>

      {/* Add Contractor Payment Modal */}
      <Modal open={showContractorModal} onClose={() => setShowContractorModal(false)} title={t('addPayment')}>
        <div className="space-y-4">
          <Input label={t('contractorName')} value={contractorForm.contractor_name} onChange={e => setContractorForm({ ...contractorForm, contractor_name: e.target.value })} />
          <Input label={t('company')} value={contractorForm.company} onChange={e => setContractorForm({ ...contractorForm, company: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('serviceType')} value={contractorForm.service_type} onChange={e => setContractorForm({ ...contractorForm, service_type: e.target.value })} />
            <Input label={t('amount')} type="number" value={contractorForm.amount || ''} onChange={e => setContractorForm({ ...contractorForm, amount: Number(e.target.value) })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('dueDate')} type="date" value={contractorForm.due_date} onChange={e => setContractorForm({ ...contractorForm, due_date: e.target.value })} />
            <Input label={t('country')} value={contractorForm.country} onChange={e => setContractorForm({ ...contractorForm, country: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowContractorModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitContractorPayment}>{t('addPayment')}</Button>
          </div>
        </div>
      </Modal>

      {/* Create Schedule Modal */}
      <Modal open={showScheduleModal} onClose={() => setShowScheduleModal(false)} title={t('createSchedule')}>
        <div className="space-y-4">
          <Input label={t('scheduleName')} value={scheduleForm.name} onChange={e => setScheduleForm({ ...scheduleForm, name: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Select label={t('frequency')} value={scheduleForm.frequency} onChange={e => setScheduleForm({ ...scheduleForm, frequency: e.target.value })} options={[
              { value: 'weekly', label: t('weekly') }, { value: 'biweekly', label: t('biweekly') }, { value: 'semi_monthly', label: t('semiMonthly') }, { value: 'monthly', label: t('monthly') },
            ]} />
            <Input label={t('nextRun')} type="date" value={scheduleForm.next_run_date} onChange={e => setScheduleForm({ ...scheduleForm, next_run_date: e.target.value })} />
          </div>
          <Input label={t('employeeGroup')} value={scheduleForm.employee_group} onChange={e => setScheduleForm({ ...scheduleForm, employee_group: e.target.value })} placeholder="e.g. All Employees" />
          <label className="flex items-center gap-2 text-sm text-t1">
            <input type="checkbox" checked={scheduleForm.auto_approve} onChange={e => setScheduleForm({ ...scheduleForm, auto_approve: e.target.checked })} className="rounded border-border" />
            {t('autoApprove')}
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowScheduleModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitSchedule}>{t('createSchedule')}</Button>
          </div>
        </div>
      </Modal>

      {/* Add Adjustment Modal */}
      <Modal open={showAdjustmentModal} onClose={() => setShowAdjustmentModal(false)} title={t('addAdjustment')}>
        <div className="space-y-4">
          <Select label={t('adjustmentType')} value={adjustmentForm.type} onChange={e => setAdjustmentForm({ ...adjustmentForm, type: e.target.value })} options={[
            { value: 'bonus', label: t('bonus') }, { value: 'overtime', label: t('overtime') }, { value: 'deduction', label: t('oneTimeDeduction') },
          ]} />
          <Select label={t('employeeName')} value={adjustmentForm.employee_id} onChange={e => setAdjustmentForm({ ...adjustmentForm, employee_id: e.target.value })} options={employees.slice(0, 20).map(emp => ({ value: emp.id, label: emp.profile.full_name }))} />
          <Input label={t('adjustmentAmount')} type="number" value={adjustmentForm.amount || ''} onChange={e => setAdjustmentForm({ ...adjustmentForm, amount: Number(e.target.value) })} />
          <Input label={t('adjustmentReason')} value={adjustmentForm.reason} onChange={e => setAdjustmentForm({ ...adjustmentForm, reason: e.target.value })} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowAdjustmentModal(false)}>{tc('cancel')}</Button>
            <Button onClick={() => {
              if (!adjustmentForm.employee_id || !adjustmentForm.amount) return
              const emp = employees.find(e => e.id === adjustmentForm.employee_id)
              if (!emp) return
              addEmployeePayrollEntry({
                payroll_run_id: lastRun?.id || '', employee_id: emp.id, employee_name: emp.profile.full_name,
                department: '', country: emp.country, gross_pay: adjustmentForm.type === 'deduction' ? 0 : adjustmentForm.amount,
                federal_tax: 0, state_tax: 0, social_security: 0, medicare: 0, pension: 0, health_insurance: 0,
                bonus: adjustmentForm.type === 'bonus' ? adjustmentForm.amount : 0,
                overtime: adjustmentForm.type === 'overtime' ? adjustmentForm.amount : 0,
                other_deductions: adjustmentForm.type === 'deduction' ? adjustmentForm.amount : 0,
                total_deductions: adjustmentForm.type === 'deduction' ? adjustmentForm.amount : 0,
                net_pay: adjustmentForm.type === 'deduction' ? -adjustmentForm.amount : adjustmentForm.amount,
                currency: 'USD', pay_date: new Date().toISOString().split('T')[0],
              })
              setShowAdjustmentModal(false)
              setAdjustmentForm({ employee_id: '', type: 'bonus', amount: 0, reason: '' })
            }}>{t('saveAdjustment')}</Button>
          </div>
        </div>
      </Modal>

      {/* Tax Config Edit Modal */}
      <Modal open={!!showTaxConfigModal} onClose={() => setShowTaxConfigModal(null)} title={t('editTaxConfig')}>
        {showTaxConfigModal && (() => {
          const config = taxConfigs.find(tc2 => tc2.id === showTaxConfigModal) as any
          if (!config) return null
          return (
            <div className="space-y-4">
              <div className="bg-canvas rounded-lg p-3">
                <p className="text-sm font-medium text-t1">{config.country}</p>
                <p className="text-xs text-t3">{config.tax_type}</p>
              </div>
              <Input label={t('taxRate')} type="number" defaultValue={config.rate} onChange={e => { config._rate = Number(e.target.value) }} />
              <div className="grid grid-cols-2 gap-4">
                <Input label={t('employerContribution')} type="number" defaultValue={config.employer_contribution} onChange={e => { config._employer = Number(e.target.value) }} />
                <Input label={t('employeeContribution')} type="number" defaultValue={config.employee_contribution} onChange={e => { config._employee = Number(e.target.value) }} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="secondary" onClick={() => setShowTaxConfigModal(null)}>{tc('cancel')}</Button>
                <Button onClick={() => {
                  updateTaxConfig(config.id, {
                    rate: config._rate ?? config.rate,
                    employer_contribution: config._employer ?? config.employer_contribution,
                    employee_contribution: config._employee ?? config.employee_contribution,
                  })
                  setShowTaxConfigModal(null)
                }}>{t('save')}</Button>
              </div>
            </div>
          )
        })()}
      </Modal>
    </>
  )
}
