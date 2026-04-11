'use client'

import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Header } from '@/components/layout/header'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/ui/status-badge'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/ui/stat-card'
import { Modal } from '@/components/ui/modal'
import { Input, Select, Textarea } from '@/components/ui/input'
import { DatePicker } from '@/components/ui/date-picker'
import { Tabs } from '@/components/ui/tabs'
import { TempoBarChart, TempoDonutChart, TempoAreaChart, CHART_COLORS, CHART_SERIES } from '@/components/ui/charts'
import { Wallet, DollarSign, Users, Plus, FileText, BarChart3, Shield, Briefcase, Settings, Search, Calculator, Calendar, AlertTriangle, CheckCircle2, Clock, ChevronDown, ChevronUp, Eye, Zap, Globe, Download, XCircle, Send, UserCheck, Building2, Smartphone, Ban, Upload, RotateCcw, UserMinus, HeartPulse, CalendarClock, ArrowLeft, TrendingUp, TrendingDown } from 'lucide-react'
import { ExpandableStats } from '@/components/ui/expandable-stats'
import { calculateLeavePayrollImpact, getStatutoryPayRates, type LeaveRecord, type LeavePayrollImpact } from '@/lib/payroll/leave-integration'
import { calculateFinalPay, getSeveranceRules, type FinalPayInput, type FinalPayResult } from '@/lib/payroll/final-pay'
import { checkAutoEnrolmentEligibility, getAutoEnrolmentRules, type AutoEnrolmentResult } from '@/lib/payroll/pension-auto-enroll'
import { MIGRATION_COLUMNS, autoDetectMappings, validateMigrationData, parseCSV, generateMigrationTemplate, type MigrationMapping, type MigrationPreview } from '@/lib/payroll/data-migration'
import { generateRolloverPreview, getTaxYears, getTaxYearLabel, getExpectedRateChanges, type RolloverPreview } from '@/lib/payroll/tax-year-rollover'
import { useTempo } from '@/lib/store'
import { exportToCSV, PAYROLL_EXPORT_COLUMNS } from '@/lib/export-import'
import { PageSkeleton } from '@/components/ui/page-skeleton'
import { AIInsightCard, AIAlertBanner, AIScoreBadge, AIRecommendationList } from '@/components/ai'
import { AIInsightsCard } from '@/components/ui/ai-insights-card'
import { ValidationChecklist } from '@/components/ui/validation-checklist'
import { isEvaluatorAccount, getEvaluatorConfig, ghanaEvaluatorEmployees, getPayrollGroupScenarios, SAMUEL_PAYROLL_GROUP, MEISSA_PAYROLL_GROUP, ghanaEmployeeSalaries, ghanaEmployeeBankDetails } from '@/lib/evaluator-demo-data'
import { EvaluatorWalkthrough, ResumeWalkthroughButton } from '@/components/payroll/evaluator-walkthrough'
import { PayrollCompletionSummary } from '@/components/payroll/evaluator-completion'
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
  const cur = currency || _activeCurrency || 'USD'
  const symbol = CURRENCY_SYMBOLS[cur] || cur + ' '
  if (cents == null) return symbol + '0.00'
  return symbol + (cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
/** Module-level active currency — set when pay run country changes */
let _activeCurrency = 'USD' // overridden in component with org default

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
  pending_internal_control: { variant: 'warning', label: 'Pending Internal Control' },
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
    payrollRuns, employees, departments, addPayrollRun, updatePayrollRun,
    employeePayrollEntries, contractorPayments, payrollSchedules, taxConfigs, complianceIssues, taxFilings,
    addContractorPayment, updateContractorPayment, addPayrollSchedule, updatePayrollSchedule,
    addTaxConfig, updateTaxConfig, resolveComplianceIssue, updateTaxFiling, addEmployeePayrollEntry,
    addToast, currentUser, currentEmployeeId,
    ensureModulesLoaded,
    setPayrollRuns, setEmployeePayrollEntries,
    leaveRequests,
    org,
    addPlatformEvent,
  } = useTempo()

  // Derive default currency from organization country
  const orgCountry = resolveCountryCode(org?.country || 'US')
  const defaultCurrency = COUNTRY_CURRENCY_MAP[orgCountry] || 'USD'
  const _cs = CURRENCY_SYMBOLS[defaultCurrency] || defaultCurrency + ' '

  // Set module-level active currency to org default on mount / org change
  useEffect(() => {
    _activeCurrency = defaultCurrency
  }, [defaultCurrency])

  // Department name lookup helper
  const deptName = useCallback((deptId: string | null | undefined) => {
    if (!deptId) return '—'
    const dept = (departments || []).find((d: any) => d.id === deptId)
    return dept?.name || deptId
  }, [departments])

  const role = currentUser?.role
  const isReadOnly = role === 'manager'

  // Employees should use /payslips instead
  useEffect(() => {
    if (role === 'employee') {
      router.push('/payslips')
    }
  }, [role, router])

  const [pageLoading, setPageLoading] = useState(true)

  useEffect(() => {
    ensureModulesLoaded?.(['payrollRuns', 'leaveRequests', 'employeePayrollEntries', 'contractorPayments', 'payrollSchedules', 'taxConfigs', 'taxFilings'])?.then?.(() => setPageLoading(false))?.catch?.(() => setPageLoading(false))
    const _t = setTimeout(() => setPageLoading(false), 2000)
    return () => clearTimeout(_t)
  }, [ensureModulesLoaded])

  // T5 #32: Seed pro-rata salary change entry
  const proRataSeededRef = useRef(false)
  useEffect(() => {
    if (proRataSeededRef.current || payrollRuns.length === 0 || employees.length === 0) return
    if (employeePayrollEntries.some((e: any) => e.pay_type === 'pro_rata_new' || e.payType === 'pro_rata_new')) return
    proRataSeededRef.current = true
    const ghanaEmps = employees.filter(e => e.country === 'Ghana')
    const latestRun = payrollRuns[0]
    if (ghanaEmps.length > 0 && latestRun) {
      addEmployeePayrollEntry({
        payroll_run_id: latestRun.id,
        employee_id: ghanaEmps[0].id,
        pay_type: 'pro_rata_new',
        days_at_old_rate: 15,
        days_at_new_rate: 15,
        old_salary: 700000,
        new_salary: 850000,
        basic_salary: 775000,
        base_pay: 775000,
        gross_pay: 775000,
        federal_tax: 155000,
        total_deductions: 155000,
        net_pay: 620000,
        currency: 'GHS',
        country: 'GH',
        notes: 'Mid-month salary adjustment — pro-rata calculation applied',
      })
    }
  }, [payrollRuns, employees, employeePayrollEntries])

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
  const [payRunStep, setPayRunStep] = useState<'form' | 'validation' | 'preview' | 'processing'>('form')
  const [previewData, setPreviewData] = useState<{
    employees: { id: string; name: string; department: string; baseSalary: number; deductions: number; netPay: number; currency: string; status: 'new_hire' | 'returning' | 'on_leave' }[]
    totalGross: number; totalDeductions: number; totalNet: number
    previousRun: { totalGross: number; totalNet: number; totalDeductions: number } | null
  } | null>(null)
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
  const [payRunForm, setPayRunForm] = useState({ period: '', country: '', total_gross: 0, total_net: 0, total_deductions: 0, currency: defaultCurrency, employee_count: 30, run_date: '', frequency: 'monthly' as 'weekly' | 'fortnightly' | 'monthly' })
  const [contractorForm, setContractorForm] = useState({ contractor_name: '', company: '', service_type: '', invoice_number: '', amount: 0, currency: defaultCurrency, due_date: '', payment_method: 'bank_transfer', tax_form: 'invoice', country: '' })
  const [scheduleForm, setScheduleForm] = useState({ name: '', frequency: 'monthly', next_run_date: '', employee_group: '', auto_approve: false, currency: defaultCurrency })
  const [adjustmentForm, setAdjustmentForm] = useState({ employee_id: '', type: 'bonus', amount: 0, reason: '' })
  const [rejectReason, setRejectReason] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [saving, setSaving] = useState(false)
  const [confirmAction, setConfirmAction] = useState<{show:boolean, type:string, id:string, label:string}|null>(null)

  // ---- Gap Features State ----
  // Gap 2: Leave integration
  const [showLeaveImpactModal, setShowLeaveImpactModal] = useState(false)
  const [leaveImpactResults, setLeaveImpactResults] = useState<LeavePayrollImpact[]>([])
  // Gap 3: Final pay calculator
  const [showFinalPayModal, setShowFinalPayModal] = useState(false)
  const [finalPayForm, setFinalPayForm] = useState<Partial<FinalPayInput>>({ terminationType: 'resignation', unusedLeaveDays: 0, annualLeaveEntitlement: 21, noticePeriodDays: 30, noticePeriodServed: 0, payInLieuOfNotice: true, yearsOfService: 1, outstandingLoans: 0, outstandingAdvances: 0, assetRecovery: 0, otherDeductions: 0, otherDeductionNotes: '' })
  const [finalPayResult, setFinalPayResult] = useState<FinalPayResult | null>(null)
  // Gap 4: Pension auto-enrolment
  const [showPensionModal, setShowPensionModal] = useState(false)
  const [pensionResult, setPensionResult] = useState<AutoEnrolmentResult | null>(null)
  const [pensionCountry, setPensionCountry] = useState('')
  // Gap 5: Data migration
  const [showMigrationModal, setShowMigrationModal] = useState(false)
  const [migrationStep, setMigrationStep] = useState<'upload' | 'mapping' | 'preview' | 'complete'>('upload')
  const [migrationHeaders, setMigrationHeaders] = useState<string[]>([])
  const [migrationRows, setMigrationRows] = useState<Record<string, string>[]>([])
  const [migrationMappings, setMigrationMappings] = useState<MigrationMapping[]>([])
  const [migrationPreview, setMigrationPreview] = useState<MigrationPreview | null>(null)
  // Gap 6: Tax year rollover
  const [showRolloverModal, setShowRolloverModal] = useState(false)
  const [rolloverCountry, setRolloverCountry] = useState('')
  const [rolloverPreview, setRolloverPreview] = useState<RolloverPreview | null>(null)
  const [rolloverChecklist, setRolloverChecklist] = useState<Record<string, 'pending' | 'completed' | 'skipped'>>({})

  // Evaluator walkthrough state
  const isEvaluator = !!(currentUser?.email && isEvaluatorAccount(currentUser.email as string))
  const evaluatorConfig = isEvaluator ? getEvaluatorConfig(currentUser?.email as string) : null
  const [walkthroughDismissed, setWalkthroughDismissed] = useState(false)
  const [walkthroughCompletedSteps, setWalkthroughCompletedSteps] = useState<Set<number>>(new Set())
  const [walkthroughCurrentStep, setWalkthroughCurrentStep] = useState(1)
  const [showCompletionSummary, setShowCompletionSummary] = useState(false)

  // Evaluator: merged employee list (includes Ghana evaluator employees for name resolution)
  const mergedEmployees = useMemo(() => {
    if (!isEvaluator) return employees
    const existingIds = new Set(employees.map((e: any) => e.id))
    const extra = ghanaEvaluatorEmployees.filter(e => !existingIds.has(e.id))
    return extra.length > 0 ? [...employees, ...extra] as typeof employees : employees
  }, [employees, isEvaluator])

  // Evaluator: payroll group and scenarios
  const evaluatorPayrollGroup = useMemo(() => {
    if (!evaluatorConfig) return null
    return evaluatorConfig.email === 's.mireku@ecobank-demo.com' ? SAMUEL_PAYROLL_GROUP : MEISSA_PAYROLL_GROUP
  }, [evaluatorConfig])
  const evaluatorScenarios = useMemo(() => {
    if (!evaluatorConfig) return null
    return getPayrollGroupScenarios(evaluatorConfig.payrollGroupId)
  }, [evaluatorConfig])

  // Evaluator: AI anomaly insights (3 flags per evaluator group)
  const evaluatorAnomalyInsights = useMemo(() => {
    if (!isEvaluator || !evaluatorScenarios) return []
    const scenarios = evaluatorScenarios
    const ghEmps = ghanaEvaluatorEmployees
    const findName = (id: string) => ghEmps.find(e => e.id === id)?.profile.full_name || id
    return [
      {
        id: 'eval-anomaly-salary-variance',
        type: 'anomaly' as const,
        severity: 'warning' as const,
        confidence: 'high' as const,
        title: 'Salary Variance Detected',
        description: `${findName(scenarios.anomalyFlags.salaryVariance)} has an ${scenarios.proRataDetails[scenarios.anomalyFlags.salaryVariance]?.increasePercent || 18}% mid-month salary increase. Verify approval documentation and pro-rata calculation.`,
        suggestedAction: 'Review salary change approval',
      },
      {
        id: 'eval-anomaly-duplicate-bank',
        type: 'anomaly' as const,
        severity: 'critical' as const,
        confidence: 'high' as const,
        title: 'Duplicate Bank Account',
        description: `${findName(scenarios.anomalyFlags.duplicateBankAccount[0])} and ${findName(scenarios.anomalyFlags.duplicateBankAccount[1])} share the same bank account number. This requires immediate investigation before payment.`,
        suggestedAction: 'Investigate duplicate account',
      },
      {
        id: 'eval-anomaly-missing-ssnit',
        type: 'anomaly' as const,
        severity: 'warning' as const,
        confidence: 'high' as const,
        title: 'Missing SSNIT Number',
        description: `${findName(scenarios.anomalyFlags.missingSsnit)} has no SSNIT number on file. SSNIT contributions cannot be remitted without a valid number. Contact employee to provide documentation.`,
        suggestedAction: 'Request SSNIT documentation',
      },
    ]
  }, [isEvaluator, evaluatorScenarios])

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

  // Feature B: Inline bank details editing
  const [showBankEditModal, setShowBankEditModal] = useState(false)
  const [bankEditEmployeeId, setBankEditEmployeeId] = useState('')
  const [bankEditEmployeeName, setBankEditEmployeeName] = useState('')
  const [bankEditForm, setBankEditForm] = useState({ bankName: '', bankCode: '', bankAccountNumber: '', bankAccountName: '', bankCountry: '', mobileMoneyProvider: '', mobileMoneyNumber: '' })
  const [bankEditMode, setBankEditMode] = useState<'bank' | 'mobile'>('bank')

  // Feature C: Inline benefits/deductions editing
  const [showAdjustEntryModal, setShowAdjustEntryModal] = useState(false)
  const [adjustEntryData, setAdjustEntryData] = useState<any>(null)
  const [adjustEntryForm, setAdjustEntryForm] = useState({ additionalDeductionName: '', additionalDeductionAmount: 0, overrideBenefitsAmount: 0, adHocBonus: 0 })

  // Feature D: Enhanced reconciliation
  const [reconComments, setReconComments] = useState<Record<string, string>>({})
  const [reconVerified, setReconVerified] = useState<Record<string, boolean>>({})
  const [reconSaving, setReconSaving] = useState(false)

  // Feature E: 3-level approval tracking (internal control sub-step)
  const [approvalLevels, setApprovalLevels] = useState<Record<string, { hr: boolean; ic: boolean; finance: boolean }>>({})
  const [payFrequencyConfig, setPayFrequencyConfig] = useState<Array<{ country: string; frequency: string; payDates: string }>>([
    { country: 'Ghana', frequency: 'Bi-Monthly', payDates: '15th and last day' },
    { country: 'Nigeria', frequency: 'Monthly', payDates: '25th' },
    { country: 'Kenya', frequency: 'Monthly', payDates: 'Last day' },
  ])
  const [showPayFreqEditModal, setShowPayFreqEditModal] = useState(false)
  const [payFreqEditForm, setPayFreqEditForm] = useState({ country: '', frequency: 'Monthly', payDates: '' })
  const [payFreqEditIndex, setPayFreqEditIndex] = useState<number | null>(null)

  // Feature F: Finance authorizer gate
  const [showAuthorizeModal, setShowAuthorizeModal] = useState<string | null>(null)
  const [authorizeForm, setAuthorizeForm] = useState({ paymentReference: '', confirmCode: '' })
  const [financeAuthorizerEmail, setFinanceAuthorizerEmail] = useState(currentUser?.email || '')

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
    const currency = COUNTRY_CURRENCY_MAP[code] || defaultCurrency
    _activeCurrency = currency
    setPayRunForm(prev => ({ ...prev, country, currency }))
  }, [defaultCurrency])

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

  const basePayrollInsights = useMemo(() => detectPayrollAnomalies(payrollRuns), [payrollRuns])
  // Merge evaluator anomaly flags into payroll insights
  const payrollInsights = useMemo(() => {
    if (!isEvaluator || evaluatorAnomalyInsights.length === 0) return basePayrollInsights
    return [...evaluatorAnomalyInsights, ...basePayrollInsights] as typeof basePayrollInsights
  }, [basePayrollInsights, isEvaluator, evaluatorAnomalyInsights])
  const forecast = useMemo(() => forecastAnnualPayroll(payrollRuns), [payrollRuns])
  const healthScore = useMemo(() => scorePayrollHealth(payrollRuns as any, complianceIssues as any, taxFilings as any), [payrollRuns, complianceIssues, taxFilings])
  const taxOpts = useMemo(() => recommendTaxOptimizations(taxConfigs as any, employees as any), [taxConfigs, employees])
  const trends = useMemo(() => analyzePayrollTrends(payrollRuns as any, employeePayrollEntries as any), [payrollRuns, employeePayrollEntries])
  const complianceRisks = useMemo(() => predictComplianceRisks(complianceIssues as any, taxFilings as any), [complianceIssues, taxFilings])
  const contractorRisk = useMemo(() => scoreContractorRisk(contractorPayments as any), [contractorPayments])

  const forecastInsight = useMemo(() => ({
    id: 'ai-payroll-forecast', category: 'prediction' as const, severity: 'info' as const,
    title: t('annualPayrollForecast'),
    description: `Projected annual payroll: ${CURRENCY_SYMBOLS[defaultCurrency] || defaultCurrency + ' '}${(forecast.projected / 100_000_000).toFixed(2)}M based on ${payrollRuns.length} pay run(s). Confidence: ${forecast.confidence}.`,
    confidence: forecast.confidence, confidenceScore: forecast.confidence === 'high' ? 88 : forecast.confidence === 'medium' ? 65 : 40,
    suggestedAction: 'Review budget allocation for upcoming quarters', module: 'payroll',
  }), [forecast, payrollRuns.length, t, defaultCurrency])

  // Changes Since Last Run diff
  const payrollDiff = useMemo(() => {
    const sortedRuns = [...payrollRuns].sort((a, b) =>
      new Date(b.created_at || (b as any).period_end || '').getTime() - new Date(a.created_at || (a as any).period_end || '').getTime()
    )
    if (sortedRuns.length < 2) return null
    const current = sortedRuns[0]
    const previous = sortedRuns[1]
    const diff = (curr: number, prev: number) => {
      const delta = curr - prev
      const pct = prev > 0 ? Math.round((delta / prev) * 100) : 0
      return { delta, pct, direction: (delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat') as 'up' | 'down' | 'flat' }
    }
    return {
      current,
      previous,
      gross: diff(current.total_gross || 0, previous.total_gross || 0),
      deductions: diff(current.total_deductions || 0, previous.total_deductions || 0),
      net: diff(current.total_net || 0, previous.total_net || 0),
      headcount: diff(current.employee_count || 0, previous.employee_count || 0),
    }
  }, [payrollRuns])

  // Filtered employee entries
  // Merge payroll entries with employees: ensures every employee appears in the list
  const mergedEntries = useMemo(() => {
    const entryMap = new Map<string, any>()
    // Add real payroll entries first (keyed by employee_id)
    employeePayrollEntries.forEach(e => {
      const eid = (e as any).employee_id || (e as any).employeeId
      if (eid) entryMap.set(eid, e)
    })
    // For employees without a payroll entry, generate a placeholder from their profile
    const LEVEL_SALARY: Record<string, number> = { Executive: 1600000, Director: 1400000, 'Senior Manager': 1000000, Manager: 750000, Senior: 700000, Mid: 450000, Associate: 330000, Junior: 290000 }
    employees.forEach(emp => {
      if (!entryMap.has(emp.id)) {
        const base = LEVEL_SALARY[emp.level] || 5000
        const fedTax = Math.round(base * 0.15)
        const totalDed = Math.round(base * 0.36)
        entryMap.set(emp.id, {
          id: `gen-${emp.id}`, employee_id: emp.id, employee_name: emp.profile?.full_name || '',
          department: '', country: emp.country, base_pay: base, gross_pay: base,
          federal_tax: fedTax, total_deductions: totalDed, net_pay: base - totalDed,
          currency: COUNTRY_CURRENCY_MAP[resolveCountryCode(emp.country || '')] || defaultCurrency, pay_date: '2026-01-28',
        })
      }
    })
    return Array.from(entryMap.values())
  }, [employeePayrollEntries, employees, defaultCurrency])

  const filteredEntries = useMemo(() => {
    let entries = [...mergedEntries]
    if (searchQuery) entries = entries.filter(e => resolveEmployeeName(mergedEmployees, (e as any).employee_id, (e as any).employee_name).toLowerCase().includes(searchQuery.toLowerCase()))
    if (filterDept) entries = entries.filter(e => (e as any).department === filterDept)
    if (filterCountry) entries = entries.filter(e => (e as any).country === filterCountry)
    return entries
  }, [mergedEntries, employees, searchQuery, filterDept, filterCountry])

  const entryDepartments = useMemo(() => [...new Set(mergedEntries.map(e => (e as any).department).filter(Boolean))], [mergedEntries])
  const countries = useMemo(() => [...new Set(mergedEntries.map(e => (e as any).country).filter(Boolean))], [mergedEntries])

  // Fix 2: Pending approval runs
  const pendingHRRuns = useMemo(() => payrollRuns.filter(r => r.status === 'pending_hr'), [payrollRuns])
  // Feature E: Internal Control sub-step — runs in pending_finance where IC hasn't approved yet
  const pendingICRuns = useMemo(() => payrollRuns.filter(r => r.status === 'pending_finance' && !approvalLevels[r.id]?.ic), [payrollRuns, approvalLevels])
  const pendingFinanceRuns = useMemo(() => payrollRuns.filter(r => r.status === 'pending_finance' && (approvalLevels[r.id]?.ic || false)), [payrollRuns, approvalLevels])
  const pendingCount = pendingHRRuns.length + pendingICRuns.length + pendingFinanceRuns.length

  // ---- Handlers ----
  async function submitPayRun() {
    if (!payRunForm.period || !payRunForm.country) {
      addToast('Please select a country and period')
      return
    }

    // T5 #37: Bank details preflight check — use resolveCountryCode for consistent matching
    const formCode = resolveCountryCode(payRunForm.country)
    const countryEmps = employees.filter(e => {
      return resolveCountryCode(e.country || '') === formCode
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

    setSaving(true)
    setIsProcessing(true)
    setProcessError(null)
    try {
      // First validate (non-blocking — if validation fetch fails, proceed anyway)
      const countryCode = resolveCountryCode(payRunForm.country)
      try {
        const valRes = await fetch(`/api/payroll?action=validate-run&country=${countryCode}`)
        if (valRes.ok) {
          const validation = await valRes.json()
          if (validation.ineligible?.length > 0) {
            setValidationResult(validation)
            setShowValidationWarning(true)
            setPayRunStep('validation')
            setIsProcessing(false)
            setSaving(false)
            return
          }
          // No ineligible — go straight to preview with eligible list
          if (validation.eligible?.length > 0) {
            setValidationResult(validation)
          }
          buildPreviewData(validation.eligible)
          setPayRunStep('preview')
          setShowPayRunModal(false)
          setIsProcessing(false)
          setSaving(false)
          return
        }
      } catch { /* validation is optional — build preview from local data */ }
      // Validation failed or unavailable — build preview from local employee data
      buildPreviewData()
      setPayRunStep('preview')
      setShowPayRunModal(false)
      setIsProcessing(false)
      setSaving(false)
    } catch (err: any) {
      setProcessError(err.message || 'Failed to process payroll')
      setIsProcessing(false)
    } finally {
      setSaving(false)
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
      setPayRunStep('form')
      setPreviewData(null)
      setPayRunForm({ period: '', country: '', total_gross: 0, total_net: 0, total_deductions: 0, currency: defaultCurrency, employee_count: 30, run_date: '', frequency: 'monthly' })
      addToast(`Payroll processed: ${result.employeeCount} employees, ${fmtCents(result.totalNet)} net pay`)

      // Cross-module notification: payroll completed
      addPlatformEvent?.({
        type: 'payroll.completed',
        title: 'Payroll Run Completed',
        data: { period: result.period, employeeCount: result.employeeCount, totalGross: result.totalGross, totalNet: result.totalNet, currency: result.currency },
      })
    } catch (err: any) {
      setProcessError(err.message || 'Network error')
    } finally {
      setIsProcessing(false)
    }
  }

  // Build preview data from eligible employees for the pay run preview step
  function buildPreviewData(eligibleEmps?: { id: string; name: string; salary: number; currency: string }[]) {
    const formCode = resolveCountryCode(payRunForm.country)
    const countryEmps = employees.filter(e => resolveCountryCode(e.country || '') === formCode && (e as any).is_active !== false)

    // Use eligible list from validation if available, otherwise derive from country employees
    const empList = eligibleEmps || countryEmps.map(e => ({
      id: e.id,
      name: e.profile?.full_name || resolveEmployeeName(mergedEmployees, e.id),
      salary: (e as any).salary || (e as any).base_salary || (e as any).annual_salary || 500000,
      currency: payRunForm.currency,
    }))

    // Determine hire date status and on-leave status
    const now = new Date()
    const threeMonthsAgo = new Date(now)
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
    const onLeaveIds = new Set(
      (leaveRequests as any[] || [])
        .filter(lr => lr.status === 'approved' && new Date(lr.start_date) <= now && new Date(lr.end_date) >= now)
        .map(lr => lr.employee_id)
    )

    const DEDUCTION_RATE = 0.13 // 13% estimated statutory deductions (pension + tax)

    const previewEmployees = empList.map(emp => {
      const fullEmp = employees.find(e => e.id === emp.id)
      const dept = fullEmp?.department_id ? deptName(fullEmp.department_id) : ((fullEmp as any)?.department || '—')
      const baseSalary = emp.salary
      const deductions = Math.round(baseSalary * DEDUCTION_RATE)
      const netPay = baseSalary - deductions
      const hireDate = (fullEmp as any)?.hire_date || (fullEmp as any)?.created_at
      const isNewHire = hireDate ? new Date(hireDate) > threeMonthsAgo : false
      const isOnLeave = onLeaveIds.has(emp.id)

      return {
        id: emp.id,
        name: emp.name,
        department: dept,
        baseSalary,
        deductions,
        netPay,
        currency: payRunForm.currency,
        status: (isOnLeave ? 'on_leave' : isNewHire ? 'new_hire' : 'returning') as 'new_hire' | 'returning' | 'on_leave',
      }
    })

    const totalGross = previewEmployees.reduce((s, e) => s + e.baseSalary, 0)
    const totalDeductions = previewEmployees.reduce((s, e) => s + e.deductions, 0)
    const totalNet = previewEmployees.reduce((s, e) => s + e.netPay, 0)

    // Find previous run for comparison
    const prevRun = payrollRuns.find(r =>
      resolveCountryCode((r as any).country || '') === formCode && r.status !== 'cancelled'
    )

    setPreviewData({
      employees: previewEmployees,
      totalGross,
      totalDeductions,
      totalNet,
      previousRun: prevRun ? {
        totalGross: prevRun.total_gross || 0,
        totalNet: prevRun.total_net || 0,
        totalDeductions: prevRun.total_deductions || 0,
      } : null,
    })
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
    setSaving(true)
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
          if (action === 'mark-paid') {
            addToast(`Payslips are now available! Employees can view and download them from My Payslips.`, 'success')
          }
        } else {
          addToast(result.error || `${action} failed`)
        }
        return
      }
      // Update local state with the new status from DB
      updatePayrollRun(runId, { status: result.status })
      addToast('Payroll run updated')
      // Cross-module notification: payroll approved
      if (action === 'approve-hr' || action === 'approve-finance') {
        const run = payrollRuns.find(r => r.id === runId)
        addPlatformEvent?.({ type: 'payroll.approved', title: 'Payroll Approved', data: { period: run?.period, approverName: currentUser?.full_name || 'Management', currency: run?.currency } })
      }
      if (action === 'mark-paid') {
        addToast(`Payslips are now available! Employees can view and download them from My Payslips.`, 'success')
      }
    } catch (err) {
      // Fallback for network errors: update local state optimistically
      const targetStatus = STATUS_ACTION_MAP[action]
      if (targetStatus) {
        updatePayrollRun(runId, { status: targetStatus })
        addToast(`Payroll ${action.replace(/-/g, ' ')} (offline)`)
        if (action === 'mark-paid') {
          addToast(`Payslips are now available! Employees can view and download them from My Payslips.`, 'success')
        }
      } else {
        addToast('Network error')
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleReject(runId: string) {
    if (!rejectReason.trim()) { addToast('Please provide a rejection reason'); return }
    setSaving(true)
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
      const prevCount = (run?.rejectionCount || run?.rejection_count || 0) + 1
      if (prevCount >= 3) {
        updatePayrollRun(runId, { status: 'escalated', rejectionReason: rejectReason, rejectionCount: prevCount, escalated_at: new Date().toISOString() })
        setEscalationRunId(runId)
        setShowEscalationModal(true)
        addToast('Payroll rejected 3 times — escalated to CEO/CFO', 'error')
      } else {
        updatePayrollRun(runId, { status: 'draft', rejectionReason: rejectReason, rejectionCount: prevCount })
        addToast(`Payroll run rejected (${prevCount}/3 before escalation)`)
      }

      setShowRejectModal(null)
      setRejectReason('')
    } catch (err) {
      addToast('Network error')
    } finally {
      setSaving(false)
    }
  }

  // T5 #45: Resolve escalation
  function resolveEscalation() {
    if (!escalationRunId || !escalationNote.trim()) {
      addToast('Resolution note required')
      return
    }
    updatePayrollRun(escalationRunId, { status: 'draft', escalation_resolved_at: new Date().toISOString(), escalation_note: escalationNote, rejectionCount: 0 })
    setShowEscalationModal(false)
    setEscalationRunId(null)
    setEscalationNote('')
    addToast('Escalation resolved — payroll returned to draft')
  }

  // Feature B: Save bank details for excluded employee
  async function saveBankDetails() {
    if (!bankEditEmployeeId) return
    setSaving(true)
    try {
      const payload = bankEditMode === 'bank'
        ? { action: 'update-bank-details', employeeId: bankEditEmployeeId, bankName: bankEditForm.bankName, bankCode: bankEditForm.bankCode, bankAccountNumber: bankEditForm.bankAccountNumber, bankAccountName: bankEditForm.bankAccountName, bankCountry: bankEditForm.bankCountry }
        : { action: 'update-bank-details', employeeId: bankEditEmployeeId, mobileMoneyProvider: bankEditForm.mobileMoneyProvider, mobileMoneyNumber: bankEditForm.mobileMoneyNumber }
      const res = await fetch('/api/payroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        // Fallback for demo — update local state
      }
      // Optimistically move employee from excluded to included in preview
      if (bankExportPreview) {
        setBankExportPreview(prev => {
          if (!prev) return prev
          const emp = prev.excluded.find((e: any) => e.employeeId === bankEditEmployeeId || e.name === bankEditEmployeeName)
          return {
            included: [...prev.included, ...(emp ? [{ name: emp.name, amount: 0 }] : [])],
            excluded: prev.excluded.filter((e: any) => e.employeeId !== bankEditEmployeeId && e.name !== bankEditEmployeeName),
          }
        })
      }
      setShowBankEditModal(false)
      setBankEditForm({ bankName: '', bankCode: '', bankAccountNumber: '', bankAccountName: '', bankCountry: '', mobileMoneyProvider: '', mobileMoneyNumber: '' })
      addToast(`Bank details saved for ${bankEditEmployeeName}`, 'success')
    } catch {
      addToast('Failed to save bank details')
    } finally {
      setSaving(false)
    }
  }

  // Feature C: Adjust payroll entry (benefits/deductions override)
  async function saveEntryAdjustment() {
    if (!adjustEntryData) return
    setSaving(true)
    try {
      const entryId = adjustEntryData.id
      const bonus = adjustEntryForm.adHocBonus * 100 // convert to cents
      const extraDeduction = adjustEntryForm.additionalDeductionAmount * 100
      const benefitsOverride = adjustEntryForm.overrideBenefitsAmount * 100
      const payload = {
        action: 'adjust-entry',
        entryId,
        adHocBonus: bonus,
        additionalDeductionName: adjustEntryForm.additionalDeductionName,
        additionalDeductionAmount: extraDeduction,
        overrideBenefitsAmount: benefitsOverride,
      }
      await fetch('/api/payroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(() => {}) // non-blocking for demo

      // Update local state optimistically
      if (setEmployeePayrollEntries) {
        setEmployeePayrollEntries((prev: any[]) => prev.map((e: any) => {
          if (e.id !== entryId) return e
          const newGross = (e.gross_pay || 0) + bonus
          const newDeductions = (e.total_deductions || 0) + extraDeduction + (benefitsOverride > 0 ? benefitsOverride - (e.health_insurance || 0) : 0)
          const newNet = newGross - newDeductions
          return {
            ...e,
            bonus: (e.bonus || 0) + bonus,
            other_deductions: (e.other_deductions || 0) + extraDeduction,
            health_insurance: benefitsOverride > 0 ? benefitsOverride : (e.health_insurance || 0),
            gross_pay: newGross,
            total_deductions: newDeductions,
            net_pay: newNet,
            adjustment_notes: adjustEntryForm.additionalDeductionName || 'Manual adjustment',
          }
        }))
      }

      setShowAdjustEntryModal(false)
      setAdjustEntryData(null)
      setAdjustEntryForm({ additionalDeductionName: '', additionalDeductionAmount: 0, overrideBenefitsAmount: 0, adHocBonus: 0 })
      addToast('Payroll entry adjusted — net pay recalculated', 'success')
    } catch {
      addToast('Failed to adjust entry')
    } finally {
      setSaving(false)
    }
  }

  // Feature D: Save reconciliation notes
  async function saveReconNotes() {
    setReconSaving(true)
    try {
      await fetch('/api/payroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save-reconciliation-notes', comments: reconComments, verified: reconVerified }),
      }).catch(() => {})
      addToast('Reconciliation notes saved', 'success')
    } catch {
      addToast('Failed to save notes')
    } finally {
      setReconSaving(false)
    }
  }

  // Feature E: Internal Control approval handler
  function handleICApprove(runId: string) {
    setApprovalLevels(prev => ({
      ...prev,
      [runId]: { ...(prev[runId] || { hr: true, ic: false, finance: false }), ic: true },
    }))
    addToast('Internal Control approved — forwarded to Finance', 'success')
  }

  // Feature F: Authorize payment
  async function authorizePayment(runId: string) {
    if (!authorizeForm.paymentReference.trim()) {
      addToast('Payment reference is required')
      return
    }
    setSaving(true)
    try {
      await fetch('/api/payroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'authorize-payment',
          payrollRunId: runId,
          paymentReference: authorizeForm.paymentReference,
          authorizationCode: authorizeForm.confirmCode,
          authorizerId: currentEmployeeId || currentUser?.id,
        }),
      }).catch(() => {})
      // Move to processing then paid
      updatePayrollRun(runId, { status: 'processing', payment_reference: authorizeForm.paymentReference, authorized_by: currentUser?.email, authorized_at: new Date().toISOString() })
      setTimeout(() => {
        updatePayrollRun(runId, { status: 'paid', payment_reference: authorizeForm.paymentReference })
        addToast('Payment authorized — payroll marked as paid', 'success')
      }, 1500)
      setShowAuthorizeModal(null)
      setAuthorizeForm({ paymentReference: '', confirmCode: '' })
      addToast('Payment authorization submitted — processing...', 'success')
    } catch {
      addToast('Authorization failed')
    } finally {
      setSaving(false)
    }
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
    setSaving(true)
    try {
      addContractorPayment({ ...contractorForm, status: 'pending', paid_date: null })
      setShowContractorModal(false)
      setContractorForm({ contractor_name: '', company: '', service_type: '', invoice_number: '', amount: 0, currency: defaultCurrency, due_date: '', payment_method: 'bank_transfer', tax_form: 'invoice', country: '' })
    } finally {
      setSaving(false)
    }
  }

  function submitSchedule() {
    if (!scheduleForm.name || !scheduleForm.next_run_date) return
    setSaving(true)
    try {
      addPayrollSchedule({ ...scheduleForm, status: 'active', last_run_date: null })
      setShowScheduleModal(false)
      setScheduleForm({ name: '', frequency: 'monthly', next_run_date: '', employee_group: '', auto_approve: false, currency: defaultCurrency })
    } finally {
      setSaving(false)
    }
  }

  function executeConfirmAction() {
    if (!confirmAction) return
    if (confirmAction.type === 'reject') {
      setShowRejectModal(confirmAction.id)
      setRejectReason('')
    }
    setConfirmAction(null)
  }

  const selectedStub = showPayStubModal ? employeePayrollEntries.find(e => e.id === showPayStubModal) : null

  // Status-specific action buttons for each payroll run
  function renderRunActions(run: any) {
    const status = run.status
    return (
      <div className="flex gap-1 justify-center flex-wrap">
        {!isReadOnly && status === 'draft' && (
          <Button size="sm" variant="primary" disabled={saving} onClick={() => handleStatusAction(run.id, status, 'submit')}>
            <Send size={12} /> {saving ? 'Saving...' : 'Submit'}
          </Button>
        )}
        {!isReadOnly && status === 'pending_hr' && (
          <>
            <Button size="sm" variant="primary" disabled={saving} onClick={() => handleStatusAction(run.id, status, 'approve-hr')}>
              <CheckCircle2 size={12} /> {saving ? 'Saving...' : 'HR Approve'}
            </Button>
            <Button size="sm" variant="ghost" className="text-error" disabled={saving} onClick={() => setConfirmAction({ show: true, type: 'reject', id: run.id, label: `Reject payroll run ${run.period || run.id}` })}>
              <XCircle size={12} /> Reject
            </Button>
          </>
        )}
        {!isReadOnly && status === 'pending_finance' && (
          <>
            <Button size="sm" variant="primary" disabled={saving} onClick={() => handleStatusAction(run.id, status, 'approve-finance')}>
              <CheckCircle2 size={12} /> {saving ? 'Saving...' : 'Finance Approve'}
            </Button>
            <Button size="sm" variant="ghost" className="text-error" disabled={saving} onClick={() => setConfirmAction({ show: true, type: 'reject', id: run.id, label: `Reject payroll run ${run.period || run.id}` })}>
              <XCircle size={12} /> Reject
            </Button>
          </>
        )}
        {!isReadOnly && status === 'approved' && (
          <>
            <Button size="sm" variant="primary" disabled={saving} onClick={() => {
              // Auto-generate payment reference: PAY-{COUNTRY}-{PERIOD}-{SEQ}
              const country = ((run as any).country || 'ALL').substring(0, 3).toUpperCase()
              const period = (run.period || '').replace(/[^0-9-]/g, '').substring(0, 7) || new Date().toISOString().substring(0, 7)
              const seq = String(payrollRuns.filter(r => r.status === 'paid' || r.status === 'processing').length + 1).padStart(3, '0')
              setAuthorizeForm({ paymentReference: `PAY-${country}-${period}-${seq}`, confirmCode: '' })
              setShowAuthorizeModal(run.id)
            }}>
              <DollarSign size={12} /> Authorize Payment
            </Button>
            <Button size="sm" variant="secondary" onClick={() => handleExportBankFile(run.id)}>
              <Download size={12} /> Export Payment File
            </Button>
          </>
        )}
        {!isReadOnly && status === 'processing' && (
          <>
            <Button size="sm" variant="primary" disabled={saving} onClick={() => handleStatusAction(run.id, status, 'mark-paid')}>
              <DollarSign size={12} /> {saving ? 'Saving...' : 'Mark Paid'}
            </Button>
            <Button size="sm" variant="ghost" className="text-error" disabled={saving} onClick={() => {
              updatePayrollRun(run.id, { status: 'cancelled', notes: (run.notes || '') + ' [Cancelled on ' + new Date().toISOString().split('T')[0] + ']' })
              addToast('Payroll run cancelled', 'success')
            }}>
              <RotateCcw size={14} className="mr-1" /> Cancel
            </Button>
          </>
        )}
        {status === 'paid' && (
          <>
            <Button size="sm" variant="ghost" onClick={() => {
              const runEntries = employeePayrollEntries.filter((e: any) => e.payroll_run_id === run.id)
              const count = runEntries.length || run.employee_count || employees.length
              updatePayrollRun(run.id, { stubs_generated: true, stubs_generated_at: new Date().toISOString() })
              addToast(`${count} pay stubs generated for ${run.period}. Employees can view them in My Payslips.`, 'success')
            }}>
              {t('generatePayStubs')}
            </Button>
            {(run as any).stubs_generated && (
              <Badge variant="success">Stubs Generated</Badge>
            )}
            {!isReadOnly && (
              <Button size="sm" variant="ghost" className="text-error" disabled={saving} onClick={() => {
                updatePayrollRun(run.id, { status: 'cancelled', notes: (run.notes || '') + ' [Voided on ' + new Date().toISOString().split('T')[0] + ']' })
                addToast('Payroll run voided', 'success')
              }}>
                <RotateCcw size={14} className="mr-1" /> Void
              </Button>
            )}
          </>
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
        actions={!isReadOnly ? <div className="flex gap-2 flex-wrap">
          <Button size="sm" variant="secondary" onClick={() => setShowMigrationModal(true)}><Upload size={14} /> Import</Button>
          <Button size="sm" variant="secondary" onClick={() => setShowFinalPayModal(true)}><UserMinus size={14} /> Final Pay</Button>
          <Button size="sm" onClick={() => setShowPayRunModal(true)}><Plus size={14} /> {t('newPayRun')}</Button>
        </div> : undefined}
      />

      {/* Evaluator Walkthrough */}
      {isEvaluator && !walkthroughDismissed && (
        <EvaluatorWalkthrough
          evaluatorName={evaluatorConfig?.firstName || 'Evaluator'}
          payrollGroupName={evaluatorConfig?.payrollGroupName || 'Ghana Evaluation Group'}
          currentStep={walkthroughCurrentStep}
          completedSteps={walkthroughCompletedSteps}
          onStepClick={(step) => setWalkthroughCurrentStep(step)}
          onStepComplete={(step) => {
            setWalkthroughCompletedSteps((prev) => {
              const next = new Set(prev)
              next.add(step)
              return next
            })
            // Auto-advance to the next incomplete step
            const nextStep = step < 10 ? step + 1 : step
            if (!walkthroughCompletedSteps.has(nextStep)) {
              setWalkthroughCurrentStep(nextStep)
            }
          }}
          onDismiss={() => setWalkthroughDismissed(true)}
          className="mb-6"
        />
      )}
      {isEvaluator && walkthroughDismissed && (
        <ResumeWalkthroughButton onClick={() => setWalkthroughDismissed(false)} />
      )}

      {/* Evaluator: Post-payroll completion summary */}
      {isEvaluator && showCompletionSummary && evaluatorPayrollGroup && evaluatorScenarios && (
        <PayrollCompletionSummary
          payrollGroupName={evaluatorPayrollGroup.name}
          period={evaluatorPayrollGroup.payPeriod}
          employeesPaid={evaluatorPayrollGroup.employeeIds.length}
          totalGross={evaluatorPayrollGroup.employeeIds.reduce((sum, id) => sum + (ghanaEmployeeSalaries[id]?.monthlySalaryGHS || 0), 0)}
          totalNet={evaluatorPayrollGroup.employeeIds.reduce((sum, id) => {
            const salary = ghanaEmployeeSalaries[id]?.monthlySalaryGHS || 0
            const ssnit = salary * 0.055
            return sum + (salary - ssnit - salary * 0.15) // rough net estimate
          }, 0)}
          totalSsnitEmployer={evaluatorPayrollGroup.employeeIds.reduce((sum, id) => sum + ((ghanaEmployeeSalaries[id]?.monthlySalaryGHS || 0) * 0.13), 0)}
          totalPaye={evaluatorPayrollGroup.employeeIds.reduce((sum, id) => sum + ((ghanaEmployeeSalaries[id]?.monthlySalaryGHS || 0) * 0.15), 0)}
          confidenceScore={96}
          processingTimeSeconds={2.4}
          reconciliation={{
            previousPeriod: 'March 2026',
            headcountChange: 0,
            grossVariance: evaluatorScenarios.bonusAmount + (evaluatorScenarios.proRataDetails[evaluatorScenarios.proRataEmployees[0]]?.newSalary || 0) - (evaluatorScenarios.proRataDetails[evaluatorScenarios.proRataEmployees[0]]?.oldSalary || 0),
            employeesWithChanges: 4,
            changes: [
              { employeeName: ghanaEvaluatorEmployees.find(e => e.id === evaluatorScenarios.proRataEmployees[0])?.profile.full_name || '', reason: 'Mid-month salary increase (pro-rata)', amount: (evaluatorScenarios.proRataDetails[evaluatorScenarios.proRataEmployees[0]]?.newSalary || 0) - (evaluatorScenarios.proRataDetails[evaluatorScenarios.proRataEmployees[0]]?.oldSalary || 0) },
              { employeeName: ghanaEvaluatorEmployees.find(e => e.id === evaluatorScenarios.bonusEmployee)?.profile.full_name || '', reason: 'Performance bonus', amount: evaluatorScenarios.bonusAmount },
              { employeeName: ghanaEvaluatorEmployees.find(e => e.id === evaluatorScenarios.loanEmployee)?.profile.full_name || '', reason: 'Staff loan deduction', amount: -evaluatorScenarios.loanAmount },
            ],
          }}
          className="mb-6"
        />
      )}

      {/* Tabs */}
      <Tabs
        tabs={tabs.map(tab => ({
          id: tab.id,
          label: tab.label,
          count: tab.id === 'approvals' && pendingCount > 0 ? pendingCount : undefined,
        }))}
        active={activeTab}
        onChange={setActiveTab}
        className="mb-6"
      />

      {/* ============================================================ */}
      {/* TAB 1: PAY RUNS */}
      {/* ============================================================ */}
      {activeTab === 'pay-runs' && (
        <>
          <ExpandableStats>
            <StatCard label={t('totalPayroll')} value={`${_cs}${(totalPayroll / 100_000_000).toFixed(1)}M`} change={t('allRuns')} changeType="neutral" icon={<Wallet size={20} />} />
            <StatCard label={t('lastPayRun')} value={lastRun ? `${_cs}${(lastRun.total_gross / 100_000_000).toFixed(2)}M` : '-'} change={lastRun?.period || t('noRunsYet')} changeType="neutral" icon={<DollarSign size={20} />} />
            <StatCard label={tc('employees')} value={lastRun?.employee_count || employees.length} change={t('onPayroll')} changeType="neutral" icon={<Users size={20} />} href="/people" />
            <StatCard label={t('deductions')} value={`${_cs}${(totalDeductions / 100_000).toFixed(0)}K`} change={t('lastRun')} changeType="neutral" icon={<FileText size={20} />} />
          </ExpandableStats>

          <AIInsightsCard
            insights={payrollInsights}
            scores={[{ score: healthScore, label: 'Payroll Health' }]}
            title="Tempo AI — Payroll Intelligence"
            maxVisible={3}
            className="mb-6"
          />

          {/* Currency Breakdown */}
          {payrollRuns.length > 0 && (() => {
            const currencyMap: Record<string, { count: number; totalNet: number }> = {}
            payrollRuns.forEach(run => {
              const cur = (run as any).currency || defaultCurrency
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
                      <p className="text-lg font-bold text-t1">{fmtCents(data.totalNet, currency)}</p>
                      <p className="text-xs text-t3">Total net pay</p>
                    </Card>
                  ))}
                </div>
              </div>
            ) : null
          })()}

          {payrollInsights.length > 0 && <AIAlertBanner insights={payrollInsights} className="mb-4" />}
          {payrollRuns.length > 0 && <div className="mb-6"><AIInsightCard insight={forecastInsight} compact /></div>}

          {payrollDiff && (
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Changes Since Last Run</CardTitle>
                  <span className="text-xs text-t3">
                    {(payrollDiff.previous as any).period_start || (payrollDiff.previous as any).period || 'Previous'} → {(payrollDiff.current as any).period_start || (payrollDiff.current as any).period || 'Current'}
                  </span>
                </div>
              </CardHeader>
              <div className="px-5 pb-5">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Gross Pay', data: payrollDiff.gross, fmt: (v: number) => `${(v / 100).toLocaleString()}` },
                    { label: 'Deductions', data: payrollDiff.deductions, fmt: (v: number) => `${(v / 100).toLocaleString()}` },
                    { label: 'Net Pay', data: payrollDiff.net, fmt: (v: number) => `${(v / 100).toLocaleString()}` },
                    { label: 'Headcount', data: payrollDiff.headcount, fmt: (v: number) => `${v}` },
                  ].map(item => (
                    <div key={item.label} className="p-3 bg-canvas border border-border rounded-lg">
                      <p className="text-xs text-t3 mb-1">{item.label}</p>
                      <div className="flex items-center gap-2">
                        {item.data.direction === 'up' && <span className="text-green-600 text-xs">▲</span>}
                        {item.data.direction === 'down' && <span className="text-red-600 text-xs">▼</span>}
                        {item.data.direction === 'flat' && <span className="text-t3 text-xs">—</span>}
                        <span className={`text-sm font-semibold ${
                          item.data.direction === 'up' ? 'text-green-600' :
                          item.data.direction === 'down' ? 'text-red-600' : 'text-t1'
                        }`}>
                          {item.data.direction !== 'flat' ? (item.data.delta > 0 ? '+' : '') + item.fmt(item.data.delta) : 'No change'}
                        </span>
                      </div>
                      {item.data.pct !== 0 && (
                        <p className={`text-[0.6rem] mt-0.5 ${item.data.pct > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {item.data.pct > 0 ? '+' : ''}{item.data.pct}% vs previous
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

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
                    const displayStatus = run.status === 'pending_finance' && !approvalLevels[run.id]?.ic ? 'pending_internal_control' : run.status
                    const statusCfg = STATUS_CONFIG[displayStatus] || STATUS_CONFIG.draft
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
                          <StatusBadge status={run.status} label={statusCfg.label} />
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
                if (!lr.startDate || !lr.endDate || !runPeriod) return false
                return lr.startDate <= runPeriod + '-31' && lr.endDate >= runPeriod + '-01'
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
                            return <p key={lr.id} className="text-xs text-pink-700">{empName}: {lr.type} leave ({lr.startDate} to {lr.endDate}) — Statutory pay: {maternityRate}</p>
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
                              <td className="px-3 py-2 text-t1 font-medium">{resolveEmployeeName(mergedEmployees, e.employee_id, e.employee_name)}</td>
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
                                {!isReadOnly && expandedRun?.status === 'draft' && (
                                  <Button size="sm" variant="ghost" className="text-tempo-600" onClick={() => {
                                    setAdjustEntryData(entry)
                                    setAdjustEntryForm({ additionalDeductionName: '', additionalDeductionAmount: 0, overrideBenefitsAmount: 0, adHocBonus: 0 })
                                    setShowAdjustEntryModal(true)
                                  }}><Zap size={12} /> Adjust</Button>
                                )}
                                <Button size="sm" variant="ghost" onClick={() => setShowPayStubModal(e.id)}><Eye size={12} /></Button>
                                <Button size="sm" variant="ghost" onClick={() => {
                                  const printWindow = window.open('', '_blank')
                                  if (!printWindow) return
                                  const empName = resolveEmployeeName(mergedEmployees, e.employee_id, (e as any).employee_name)
                                  printWindow.document.write(`<html><head><title>Payslip - ${empName}</title><style>body{font-family:sans-serif;padding:40px;max-width:800px;margin:0 auto}h1{font-size:24px;margin-bottom:4px}h2{font-size:18px;color:#666}table{width:100%;border-collapse:collapse;margin-top:20px}td,th{text-align:left;padding:8px 12px;border-bottom:1px solid #eee}th{background:#f5f5f5;font-weight:600}.amount{text-align:right}.total{font-weight:bold;border-top:2px solid #333}</style></head><body>`)
                                  printWindow.document.write(`<h1>PAYSLIP</h1><h2>${empName}</h2><p>Period: ${(e as any).period || (e as any).pay_period || '\u2014'}</p>`)
                                  printWindow.document.write(`<table><tr><th>Description</th><th class="amount">Amount</th></tr>`)
                                  printWindow.document.write(`<tr><td>Gross Pay</td><td class="amount">${fmtCents((e as any).gross_pay || (e as any).grossPay)}</td></tr>`)
                                  printWindow.document.write(`<tr><td>Tax</td><td class="amount">-${fmtCents((e as any).tax || (e as any).federal_tax || 0)}</td></tr>`)
                                  printWindow.document.write(`<tr><td>Deductions</td><td class="amount">-${fmtCents((e as any).deductions || (e as any).total_deductions || 0)}</td></tr>`)
                                  printWindow.document.write(`<tr class="total"><td>Net Pay</td><td class="amount">${fmtCents((e as any).net_pay || (e as any).netPay)}</td></tr>`)
                                  printWindow.document.write(`</table><p style="margin-top:40px;color:#999;font-size:12px">Generated on ${new Date().toLocaleDateString()}</p></body></html>`)
                                  printWindow.document.close()
                                  printWindow.print()
                                }}>
                                  <Download size={12} className="mr-1" /> Payslip PDF
                                </Button>
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
                              entry_modified: { label: 'Entry Modified', color: 'bg-teal-100 text-teal-800' },
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
          <ExpandableStats>
            <StatCard label={t('totalLaborCost')} value={`${_cs}${(mergedEntries.reduce((s, e) => s + ((e as any).gross_pay || 0), 0) / 100_000).toFixed(0)}K`} change={t('lastRun')} changeType="neutral" icon={<DollarSign size={20} />} />
            <StatCard label={t('avgSalary')} value={`${_cs}${mergedEntries.length > 0 ? (mergedEntries.reduce((s, e) => s + ((e as any).gross_pay || 0), 0) / mergedEntries.length / 100_000).toFixed(1) : '0'}K`} change={t('monthOverMonth')} changeType="neutral" icon={<Users size={20} />} />
            <StatCard label={t('taxBurden')} value={`${mergedEntries.length > 0 ? Math.round(mergedEntries.reduce((s, e) => s + ((e as any).total_deductions || 0), 0) / Math.max(1, mergedEntries.reduce((s, e) => s + ((e as any).gross_pay || 0), 0)) * 100) : 0}%`} change={t('allDepartments')} changeType="neutral" icon={<FileText size={20} />} />
            <StatCard label={tc('employees')} value={mergedEntries.length} change={t('onPayroll')} changeType="neutral" icon={<Users size={20} />} />
          </ExpandableStats>

          {/* Search & Filters */}
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-t3" />
              <input className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-lg bg-surface text-t1 focus:outline-none focus:ring-2 focus:ring-tempo-500/30"
                placeholder={t('searchEmployees')} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>
            <Select className="px-3 py-2 text-sm border border-border rounded-lg bg-surface text-t1" value={filterDept} onChange={e => setFilterDept(e.target.value)}
              options={[{value: '', label: t('allDepartments')}, ...entryDepartments.map(d => ({value: d, label: d}))]} />
            <Select className="px-3 py-2 text-sm border border-border rounded-lg bg-surface text-t1" value={filterCountry} onChange={e => setFilterCountry(e.target.value)}
              options={[{value: '', label: t('allCountries')}, ...countries.map(c => ({value: c, label: c}))]} />
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
                          <p className="text-xs font-medium text-t1">{resolveEmployeeName(mergedEmployees, e.employee_id, e.employee_name)}</p>
                          <p className="text-xs text-t3">{e.employee_id}</p>
                        </td>
                        <td className="px-4 py-3 text-xs text-t2">{e.department}</td>
                        <td className="px-4 py-3 text-xs text-t2">{e.country}</td>
                        <td className="px-4 py-3 text-xs text-t1 text-right font-medium">{fmtCents(e.gross_pay)}</td>
                        <td className="px-4 py-3 text-xs text-error text-right">-{fmtCents(e.total_deductions)}</td>
                        <td className="px-4 py-3 text-xs text-t1 text-right font-semibold">{fmtCents(e.net_pay)}</td>
                        <td className="px-4 py-3 text-center">
                          <Button size="sm" variant="ghost" onClick={() => setShowPayStubModal(e.id)}>{t('viewStub')}</Button>
                          <Button size="sm" variant="ghost" onClick={() => {
                            const printWindow = window.open('', '_blank')
                            if (!printWindow) return
                            const empName = resolveEmployeeName(mergedEmployees, e.employee_id, (e as any).employee_name)
                            printWindow.document.write(`<html><head><title>Payslip - ${empName}</title><style>body{font-family:sans-serif;padding:40px;max-width:800px;margin:0 auto}h1{font-size:24px;margin-bottom:4px}h2{font-size:18px;color:#666}table{width:100%;border-collapse:collapse;margin-top:20px}td,th{text-align:left;padding:8px 12px;border-bottom:1px solid #eee}th{background:#f5f5f5;font-weight:600}.amount{text-align:right}.total{font-weight:bold;border-top:2px solid #333}</style></head><body>`)
                            printWindow.document.write(`<h1>PAYSLIP</h1><h2>${empName}</h2><p>Period: ${(e as any).period || (e as any).pay_period || '\u2014'}</p>`)
                            printWindow.document.write(`<table><tr><th>Description</th><th class="amount">Amount</th></tr>`)
                            printWindow.document.write(`<tr><td>Gross Pay</td><td class="amount">${fmtCents((e as any).gross_pay || (e as any).grossPay)}</td></tr>`)
                            printWindow.document.write(`<tr><td>Tax</td><td class="amount">-${fmtCents((e as any).tax || (e as any).federal_tax || 0)}</td></tr>`)
                            printWindow.document.write(`<tr><td>Deductions</td><td class="amount">-${fmtCents((e as any).deductions || (e as any).total_deductions || 0)}</td></tr>`)
                            printWindow.document.write(`<tr class="total"><td>Net Pay</td><td class="amount">${fmtCents((e as any).net_pay || (e as any).netPay)}</td></tr>`)
                            printWindow.document.write(`</table><p style="margin-top:40px;color:#999;font-size:12px">Generated on ${new Date().toLocaleDateString()}</p></body></html>`)
                            printWindow.document.close()
                            printWindow.print()
                          }}>
                            <Download size={12} className="mr-1" /> Payslip PDF
                          </Button>
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
          <ExpandableStats>
            <StatCard label="Pending HR" value={pendingHRRuns.length} change="Level 1: HR Head" changeType={pendingHRRuns.length > 0 ? 'negative' : 'positive'} icon={<UserCheck size={20} />} />
            <StatCard label="Pending Internal Control" value={pendingICRuns.length} change="Level 2: Internal Control" changeType={pendingICRuns.length > 0 ? 'negative' : 'positive'} icon={<Shield size={20} />} />
            <StatCard label="Pending Finance" value={pendingFinanceRuns.length} change="Level 3: Finance" changeType={pendingFinanceRuns.length > 0 ? 'negative' : 'positive'} icon={<Building2 size={20} />} />
            <StatCard label="Approved" value={payrollRuns.filter(r => r.status === 'approved').length} change="Ready for authorization" changeType="neutral" icon={<CheckCircle2 size={20} />} />
          </ExpandableStats>

          {/* 3-Level Approval Flow Diagram */}
          <Card className="mb-4 p-4">
            <p className="text-xs font-semibold text-t2 uppercase mb-3">Approval Flow</p>
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2 py-1 rounded bg-gray-100 text-gray-700 font-medium">Draft</span>
              <span className="text-t3">&rarr;</span>
              <span className={`px-2 py-1 rounded font-medium ${pendingHRRuns.length > 0 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>Level 1: HR Head</span>
              <span className="text-t3">&rarr;</span>
              <span className={`px-2 py-1 rounded font-medium ${pendingICRuns.length > 0 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>Level 2: Internal Control</span>
              <span className="text-t3">&rarr;</span>
              <span className={`px-2 py-1 rounded font-medium ${pendingFinanceRuns.length > 0 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>Level 3: Finance</span>
              <span className="text-t3">&rarr;</span>
              <span className="px-2 py-1 rounded bg-emerald-100 text-emerald-700 font-medium">Approved</span>
            </div>
          </Card>

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
                          <Button size="sm" variant="primary" disabled={saving} onClick={() => handleStatusAction(run.id, run.status, 'approve-hr')}>
                            <CheckCircle2 size={12} /> {saving ? 'Saving...' : 'Approve'}
                          </Button>
                          <Button size="sm" variant="ghost" className="text-error" disabled={saving} onClick={() => setConfirmAction({ show: true, type: 'reject', id: run.id, label: `Reject payroll run ${run.period || run.id}` })}>
                            <XCircle size={12} /> Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {pendingICRuns.length > 0 && (
                <Card padding="none">
                  <CardHeader><CardTitle className="flex items-center gap-2"><Shield size={18} className="text-amber-500" /> Pending Internal Control Approval (Level 2)</CardTitle></CardHeader>
                  <div className="divide-y divide-border">
                    {pendingICRuns.map(run => (
                      <div key={run.id} className="flex items-center justify-between px-6 py-4 hover:bg-canvas/50">
                        <div>
                          <p className="text-sm font-medium text-t1">{run.period} <Badge variant="warning" className="ml-2">Pending Internal Control</Badge></p>
                          <p className="text-xs text-t3">{run.employee_count} employees · {fmtCents(run.total_gross, COUNTRY_CURRENCY_MAP[(run as any).country] || undefined)} gross · {displayCountry((run as any).country || 'All')}</p>
                          <p className="text-xs text-emerald-600 mt-0.5">HR Approved</p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="primary" disabled={saving} onClick={() => handleICApprove(run.id)}>
                            <CheckCircle2 size={12} /> {saving ? 'Saving...' : 'IC Approve'}
                          </Button>
                          <Button size="sm" variant="ghost" className="text-error" disabled={saving} onClick={() => setConfirmAction({ show: true, type: 'reject', id: run.id, label: `Reject payroll run ${run.period || run.id}` })}>
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
                  <CardHeader><CardTitle className="flex items-center gap-2"><Building2 size={18} className="text-blue-500" /> Pending Finance Approval (Level 3)</CardTitle></CardHeader>
                  <div className="divide-y divide-border">
                    {pendingFinanceRuns.map(run => (
                      <div key={run.id} className="flex items-center justify-between px-6 py-4 hover:bg-canvas/50">
                        <div>
                          <p className="text-sm font-medium text-t1">{run.period} <Badge variant="info" className="ml-2">Pending Finance</Badge></p>
                          <p className="text-xs text-t3">{run.employee_count} employees · {fmtCents(run.total_gross, COUNTRY_CURRENCY_MAP[(run as any).country] || undefined)} gross · {displayCountry((run as any).country || 'All')}</p>
                          <p className="text-xs text-emerald-600 mt-0.5">HR Approved · IC Approved</p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="primary" disabled={saving} onClick={() => handleStatusAction(run.id, run.status, 'approve-finance')}>
                            <CheckCircle2 size={12} /> {saving ? 'Saving...' : 'Approve'}
                          </Button>
                          <Button size="sm" variant="ghost" className="text-error" disabled={saving} onClick={() => setConfirmAction({ show: true, type: 'reject', id: run.id, label: `Reject payroll run ${run.period || run.id}` })}>
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
          const headers = ['Employee Name', 'Country', 'Previous Gross', 'Current Gross', 'Variance ($)', 'Variance (%)', 'Status', 'Variance Reason', 'Comment', 'Verified']
          const csvRows = reconData.rows.map((r: any) => {
            const varianceReason = r.status === 'new' ? 'New hire'
              : r.status === 'exited' ? 'Employee exit'
              : r.variancePercent > 0.15 ? 'Promotion / Annual increment'
              : r.variancePercent < -0.15 ? 'Correction / Demotion'
              : r.variance !== 0 ? 'Adjustment' : 'No change'
            return [
              r.employeeName,
              r.country,
              r.previousGross !== null ? (r.previousGross / 100).toFixed(2) : '',
              r.currentGross !== null ? (r.currentGross / 100).toFixed(2) : '',
              (r.variance / 100).toFixed(2),
              (r.variancePercent * 100).toFixed(1) + '%',
              r.status,
              varianceReason,
              reconComments[r.employeeId] || '',
              reconVerified[r.employeeId] ? 'Yes' : 'No',
            ]
          })
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
                  <Select className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-surface text-t1"
                    value={reconPrevRunId} onChange={e => setReconPrevRunId(e.target.value)}
                    options={[{value: '', label: 'Select a paid run...'}, ...paidRuns.map((r: any) => ({value: r.id, label: `${r.period} — ${r.country || 'All'} (${fmtCents(r.total_gross)})`}))]} />
                </div>
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-xs font-medium text-t3 mb-1">Current Period</label>
                  <Select className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-surface text-t1"
                    value={reconCurrRunId} onChange={e => setReconCurrRunId(e.target.value)}
                    options={[{value: '', label: 'Select a paid run...'}, ...paidRuns.map((r: any) => ({value: r.id, label: `${r.period} — ${r.country || 'All'} (${fmtCents(r.total_gross)})`}))]} />
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
                <ExpandableStats>
                  <StatCard label="Previous Total Gross" value={fmtCents(reconData.totalPreviousGross)} change={reconData.previousPeriod} changeType="neutral" icon={<DollarSign size={20} />} />
                  <StatCard label="Current Total Gross" value={fmtCents(reconData.totalCurrentGross)} change={reconData.currentPeriod} changeType="neutral" icon={<DollarSign size={20} />} />
                  <StatCard label="Total Variance" value={fmtCents(reconData.totalVariance)} change={`${(reconData.totalVariancePercent * 100).toFixed(1)}%`} changeType={reconData.totalVariance > 0 ? 'negative' : reconData.totalVariance < 0 ? 'positive' : 'neutral'} icon={<BarChart3 size={20} />} />
                  <StatCard label="Significant Changes" value={reconData.significantVarianceCount + reconData.newEmployeeCount + reconData.exitedEmployeeCount} change={`${reconData.newEmployeeCount} new, ${reconData.exitedEmployeeCount} exited`} changeType={reconData.significantVarianceCount > 0 ? 'negative' : 'neutral'} icon={<AlertTriangle size={20} />} />
                </ExpandableStats>

                {/* Summary verification banner */}
                {reconData.rows && (() => {
                  const totalRows = reconData.rows.filter((r: any) => r.status !== 'stable').length
                  const verifiedCount = Object.values(reconVerified).filter(Boolean).length
                  return totalRows > 0 ? (
                    <div className={`mb-4 rounded-lg p-3 flex items-center justify-between ${verifiedCount >= totalRows ? 'bg-emerald-50 border border-emerald-200' : 'bg-amber-50 border border-amber-200'}`}>
                      <div className="flex items-center gap-2">
                        {verifiedCount >= totalRows ? <CheckCircle2 size={16} className="text-emerald-600" /> : <AlertTriangle size={16} className="text-amber-600" />}
                        <span className={`text-sm font-medium ${verifiedCount >= totalRows ? 'text-emerald-800' : 'text-amber-800'}`}>
                          {verifiedCount} of {totalRows} variances verified
                        </span>
                      </div>
                      {verifiedCount < totalRows && (
                        <span className="text-xs text-amber-700">{totalRows - verifiedCount} remaining</span>
                      )}
                    </div>
                  ) : null
                })()}

                {/* Export and save buttons */}
                <div className="flex justify-end gap-2 mb-3">
                  <Button size="sm" variant="secondary" disabled={reconSaving} onClick={saveReconNotes}>
                    {reconSaving ? 'Saving...' : 'Save Notes'}
                  </Button>
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
                          <th className="tempo-th text-left px-4 py-3">Variance Reason</th>
                          <th className="tempo-th text-left px-4 py-3">Comment</th>
                          <th className="tempo-th text-center px-4 py-3">Verified</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {reconData.rows.map((row: any) => {
                          // Auto-detect variance reason
                          const varianceReason = row.status === 'new' ? 'New hire'
                            : row.status === 'exited' ? 'Employee exit'
                            : row.variancePercent > 0.15 ? 'Promotion / Annual increment'
                            : row.variancePercent < -0.15 ? 'Correction / Demotion'
                            : row.variance !== 0 ? 'Adjustment' : 'No change'
                          const isVariance = row.status !== 'stable'
                          return (
                          <tr key={row.employeeId} className={`hover:bg-canvas/50 ${reconVerified[row.employeeId] ? 'bg-emerald-50/30' : ''}`}>
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
                            <td className="px-4 py-3 text-xs text-t2">{varianceReason}</td>
                            <td className="px-4 py-3">
                              {isVariance && (
                                <input
                                  type="text"
                                  className="w-full px-2 py-1 text-xs border border-border rounded bg-surface text-t1 focus:outline-none focus:ring-1 focus:ring-tempo-500/30"
                                  placeholder="Add note..."
                                  value={reconComments[row.employeeId] || ''}
                                  onChange={e => setReconComments(prev => ({ ...prev, [row.employeeId]: e.target.value }))}
                                />
                              )}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {isVariance && (
                                <input
                                  type="checkbox"
                                  checked={reconVerified[row.employeeId] || false}
                                  onChange={e => setReconVerified(prev => ({ ...prev, [row.employeeId]: e.target.checked }))}
                                  className="rounded border-border"
                                />
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
                  <Select className="px-3 py-2 text-sm border border-border rounded-lg bg-surface text-t1"
                    value={String(yearEndYear)} onChange={e => setYearEndYear(Number(e.target.value))}
                    options={[2024, 2025, 2026].map(y => ({value: String(y), label: String(y)}))} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-t3 mb-1">Country</label>
                  <Select className="px-3 py-2 text-sm border border-border rounded-lg bg-surface text-t1"
                    value={yearEndCountry} onChange={e => setYearEndCountry(e.target.value)}
                    options={[{value: 'KE', label: 'Kenya (P9A)'}, {value: 'NG', label: 'Nigeria (Form H1)'}, {value: 'GH', label: 'Ghana (PAYE Return)'}]} />
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
          <ExpandableStats>
            <StatCard label={t('totalLaborCost')} value={`${_cs}${(totalPayroll / 100_000_000).toFixed(2)}M`} change={t('allRuns')} changeType="neutral" icon={<DollarSign size={20} />} />
            <StatCard label={t('avgSalary')} value={`${_cs}${employeePayrollEntries.length > 0 ? (employeePayrollEntries.reduce((s, e) => s + ((e as any).gross_pay || 0), 0) / employeePayrollEntries.length / 100_000).toFixed(1) : '0'}K`} change={t('monthOverMonth')} changeType="neutral" icon={<Users size={20} />} />
            <StatCard label={t('taxBurden')} value={`${employeePayrollEntries.length > 0 ? Math.round(employeePayrollEntries.reduce((s, e) => s + ((e as any).total_deductions || 0), 0) / Math.max(1, employeePayrollEntries.reduce((s, e) => s + ((e as any).gross_pay || 0), 0)) * 100) : 0}%`} change={t('allDepartments')} changeType="neutral" icon={<FileText size={20} />} />
            <StatCard label={t('monthOverMonth')} value={`${trends.monthOverMonth > 0 ? '+' : ''}${trends.monthOverMonth}%`} change={payrollRuns.length >= 2 ? `${payrollRuns.length} ${t('payRuns').toLowerCase()}` : ''} changeType={trends.monthOverMonth > 3 ? 'negative' : trends.monthOverMonth < 0 ? 'positive' : 'neutral'} icon={<BarChart3 size={20} />} />
          </ExpandableStats>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Card>
              <h3 className="text-sm font-semibold text-t1 mb-4">{t('costByDepartment')}</h3>
              {trends.departmentTrends.length > 0 ? (
                <TempoBarChart
                  data={trends.departmentTrends.slice(0, 6).map(d => ({ name: d.department, cost: Math.round(d.totalCost / 100_000) }))}
                  bars={[{ dataKey: 'cost', name: `Cost (${defaultCurrency} K)`, color: CHART_COLORS.primary }]}
                  xKey="name" layout="horizontal" height={trends.departmentTrends.length * 36}
                  formatter={(v) => `${_cs}${v}K`} showGrid={false}
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
                      centerLabel={`${_cs}${Math.round(items.reduce((s, [, d]) => s + d.total, 0) / 100_000_000)}M`}
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
                  { dataKey: 'gross', name: `Gross (${defaultCurrency} K)`, color: CHART_COLORS.primary },
                  { dataKey: 'net', name: `Net (${defaultCurrency} K)`, color: CHART_COLORS.emerald },
                ]}
                xKey="name" height={200} showLegend formatter={(v) => `${_cs}${v.toFixed(0)}K`}
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
          <ExpandableStats>
            <Card className="text-center py-4">
              <p className="text-xs text-t3 mb-2">{t('complianceScore')}</p>
              <AIScoreBadge score={healthScore} size="lg" showBreakdown />
            </Card>
            <StatCard label={t('openIssues')} value={complianceIssues.filter(i => (i as any).status !== 'resolved').length} change={`${complianceIssues.filter(i => (i as any).severity === 'critical' && (i as any).status !== 'resolved').length} ${t('critical').toLowerCase()}`} changeType={complianceIssues.filter(i => (i as any).severity === 'critical' && (i as any).status !== 'resolved').length > 0 ? 'negative' : 'positive'} icon={<AlertTriangle size={20} />} />
            <StatCard label={t('urgentItems')} value={complianceRisks.urgentCount} change={complianceRisks.nextDeadline ? `${t('nextDeadline')}: ${complianceRisks.nextDeadline}` : ''} changeType={complianceRisks.urgentCount > 0 ? 'negative' : 'positive'} icon={<Clock size={20} />} />
            <StatCard label={t('taxFilings')} value={`${taxFilings.filter(f => (f as any).status === 'filed').length}/${taxFilings.length}`} change={`${taxFilings.filter(f => (f as any).status === 'overdue').length} ${t('overdue').toLowerCase()}`} changeType={taxFilings.filter(f => (f as any).status === 'overdue').length > 0 ? 'negative' : 'neutral'} icon={<FileText size={20} />} />
          </ExpandableStats>

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
          <ExpandableStats>
            <StatCard label={t('totalContractors')} value={contractorPayments.length} change={t('allCountries')} changeType="neutral" icon={<Briefcase size={20} />} />
            <StatCard label={t('pendingPayments')} value={contractorPayments.filter(cp => (cp as any).status === 'pending' || (cp as any).status === 'approved').length} change={`${_cs}${(contractorPayments.filter(cp => (cp as any).status !== 'paid').reduce((s, cp) => s + ((cp as any).amount || 0), 0) / 100_000).toFixed(0)}K`} changeType="neutral" icon={<Clock size={20} />} />
            <StatCard label={t('totalPaidThisMonth')} value={`${_cs}${(contractorPayments.filter(cp => (cp as any).status === 'paid').reduce((s, cp) => s + ((cp as any).amount || 0), 0) / 100_000).toFixed(0)}K`} change={t('lastRun')} changeType="neutral" icon={<DollarSign size={20} />} />
            <Card className="text-center py-3">
              <p className="text-xs text-t3 mb-1">{t('contractorRiskScore')}</p>
              <p className={`text-2xl font-bold ${contractorRisk.riskScore > 50 ? 'text-error' : contractorRisk.riskScore > 30 ? 'text-amber-500' : 'text-emerald-500'}`}>{contractorRisk.riskScore}/100</p>
            </Card>
          </ExpandableStats>

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
                  <Select className="px-3 py-2 text-sm border border-border rounded-lg bg-surface text-t1"
                    value={taxConfigCountry} onChange={e => setTaxConfigCountry(e.target.value)}
                    options={[{value: '', label: 'All Countries'}, ...allCountries.map(c => ({value: c, label: c}))]} />
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
                    <DatePicker label="Effective Date" value={taxEditForm.effectiveDate}
                      onChange={d => setTaxEditForm(p => ({ ...p, effectiveDate: d.toISOString().split('T')[0] }))} />
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
          {/* Quick actions bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <button onClick={() => setShowPensionModal(true)} className="bg-surface border border-border rounded-lg p-4 text-left hover:bg-canvas transition-colors group">
              <HeartPulse size={20} className="text-emerald-500 mb-2 group-hover:scale-110 transition-transform" />
              <p className="text-sm font-medium text-t1">Pension Auto-Enrolment</p>
              <p className="text-xs text-t3">Check eligibility & enrol employees</p>
            </button>
            <button onClick={() => setShowRolloverModal(true)} className="bg-surface border border-border rounded-lg p-4 text-left hover:bg-canvas transition-colors group">
              <RotateCcw size={20} className="text-violet-500 mb-2 group-hover:scale-110 transition-transform" />
              <p className="text-sm font-medium text-t1">Tax Year Rollover</p>
              <p className="text-xs text-t3">Close year & update rates</p>
            </button>
            <button onClick={() => setShowMigrationModal(true)} className="bg-surface border border-border rounded-lg p-4 text-left hover:bg-canvas transition-colors group">
              <Upload size={20} className="text-blue-500 mb-2 group-hover:scale-110 transition-transform" />
              <p className="text-sm font-medium text-t1">Data Migration</p>
              <p className="text-xs text-t3">Import from CSV/Excel</p>
            </button>
            <button onClick={() => setShowLeaveImpactModal(true)} className="bg-surface border border-border rounded-lg p-4 text-left hover:bg-canvas transition-colors group">
              <CalendarClock size={20} className="text-indigo-500 mb-2 group-hover:scale-110 transition-transform" />
              <p className="text-sm font-medium text-t1">Leave Deductions</p>
              <p className="text-xs text-t3">View leave-to-payroll impact</p>
            </button>
          </div>

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

          {/* Feature E: Per-Country Pay Frequency Configuration */}
          <Card padding="none" className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2"><CalendarClock size={18} className="text-tempo-600" /> Pay Frequency by Country</CardTitle>
                <Button size="sm" onClick={() => {
                  setPayFreqEditForm({ country: '', frequency: 'Monthly', payDates: '' })
                  setPayFreqEditIndex(null)
                  setShowPayFreqEditModal(true)
                }}><Plus size={14} /> Add Country</Button>
              </div>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-divider bg-canvas">
                    <th className="tempo-th text-left px-6 py-3">Country</th>
                    <th className="tempo-th text-center px-4 py-3">Frequency</th>
                    <th className="tempo-th text-left px-4 py-3">Pay Dates</th>
                    <th className="tempo-th text-center px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {payFrequencyConfig.map((cfg, i) => (
                    <tr key={i} className="hover:bg-canvas/50">
                      <td className="px-6 py-3 text-sm font-medium text-t1">{cfg.country}</td>
                      <td className="px-4 py-3 text-sm text-t2 text-center">
                        <Badge variant={cfg.frequency === 'Monthly' ? 'default' : cfg.frequency === 'Bi-Monthly' ? 'info' : 'warning'}>{cfg.frequency}</Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-t2">{cfg.payDates}</td>
                      <td className="px-4 py-3 text-center">
                        <Button size="sm" variant="ghost" onClick={() => {
                          setPayFreqEditForm({ ...cfg })
                          setPayFreqEditIndex(i)
                          setShowPayFreqEditModal(true)
                        }}>Edit</Button>
                      </td>
                    </tr>
                  ))}
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
                <Select className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-surface text-t1" value={simCountry} onChange={e => setSimCountry(e.target.value as SupportedCountry)}
                  options={(['US', 'UK', 'DE', 'FR', 'CA', 'AU'] as const).map(c => ({value: c, label: c}))} />
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
                  {(() => { const _ss = CURRENCY_SYMBOLS[COUNTRY_CURRENCY_MAP[simCountry] || defaultCurrency] || _cs; return [
                    { label: t('grossPay'), value: `${_ss}${simResult.grossSalary.toLocaleString()}`, color: 'text-t1' },
                    { label: t('federalTax'), value: `-${_ss}${simResult.federalTax.toLocaleString()}`, color: 'text-error' },
                    { label: t('socialSecurity'), value: `-${_ss}${simResult.socialSecurity.toLocaleString()}`, color: 'text-error' },
                    { label: t('pension'), value: `-${_ss}${simResult.pension.toLocaleString()}`, color: 'text-error' },
                    { label: t('totalDeductionsLabel'), value: `-${_ss}${simResult.totalTax.toLocaleString()}`, color: 'text-error font-semibold' },
                    { label: t('netPay'), value: `${_ss}${simResult.netPay.toLocaleString()}`, color: 'text-t1 font-bold' },
                  ] })().map(item => (
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
            <Select
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-surface text-t1"
              value={payRunForm.country}
              onChange={e => handleCountryChange(e.target.value)}
              options={[{value: '', label: 'Select country...'}, ...availableCountries.map(c => ({value: c, label: c}))]}
            />
            {payRunForm.country && (
              <p className="text-xs text-t3 mt-1">
                {employees.filter(e => resolveCountryCode(e.country || '') === resolveCountryCode(payRunForm.country) && (e as any).is_active !== false).length} active employees in {payRunForm.country} · Currency: {payRunForm.currency}
              </p>
            )}
          </div>
          {/* Gap 1: Pay frequency selector */}
          <div>
            <label className="text-xs font-medium text-t2 mb-1 block">Pay Frequency *</label>
            <Select
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-surface text-t1"
              value={payRunForm.frequency}
              onChange={e => setPayRunForm({ ...payRunForm, frequency: e.target.value as any })}
              options={[{value: 'weekly', label: 'Weekly'}, {value: 'fortnightly', label: 'Fortnightly (Bi-weekly)'}, {value: 'monthly', label: 'Monthly'}]}
            />
            <p className="text-xs text-t3 mt-1">
              {payRunForm.frequency === 'weekly' ? 'Employees are paid every week (52 pay periods/year)' :
               payRunForm.frequency === 'fortnightly' ? 'Employees are paid every two weeks (26 pay periods/year)' :
               'Employees are paid once per month (12 pay periods/year)'}
            </p>
          </div>
          {/* Period selector (month picker for monthly, week picker for weekly/fortnightly) */}
          <div>
            <label className="text-xs font-medium text-t2 mb-1 block">{t('payPeriod')} *</label>
            {payRunForm.frequency === 'monthly' ? (
              <input
                type="month"
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-surface text-t1 focus:outline-none focus:ring-2 focus:ring-tempo-500/30"
                value={payRunForm.period}
                onChange={e => setPayRunForm({ ...payRunForm, period: e.target.value })}
              />
            ) : (
              <input
                type="week"
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-surface text-t1 focus:outline-none focus:ring-2 focus:ring-tempo-500/30"
                value={payRunForm.period}
                onChange={e => setPayRunForm({ ...payRunForm, period: e.target.value })}
              />
            )}
            {payRunForm.frequency !== 'monthly' && (
              <p className="text-xs text-t3 mt-1">
                Salary will be pro-rated: monthly ÷ {payRunForm.frequency === 'weekly' ? '4.33' : '2.17'} per period
              </p>
            )}
          </div>
          {processError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">{processError}</p>
            </div>
          )}
          <div className="bg-canvas rounded-lg p-3 space-y-1">
            <p className="text-xs text-t3">The payroll engine will automatically calculate gross pay, statutory deductions, and net pay for all eligible employees in the selected country.</p>
            <p className="text-xs text-t3">• <strong>Leave deductions</strong> — approved unpaid/sick/maternity leave is auto-deducted from this period</p>
            <p className="text-xs text-t3">• <strong>Pension contributions</strong> — auto-enrolled employees have statutory pension applied</p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowPayRunModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitPayRun} disabled={!payRunForm.country || !payRunForm.period || isProcessing || saving}>
              {isProcessing || saving ? 'Processing...' : t('createPayRun')}
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
                    <p className="text-sm font-semibold text-t1">{resolveEmployeeName(mergedEmployees, s.employee_id, s.employee_name)}</p>
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
                  <div className="flex justify-between text-sm"><span className="text-t2">{t('baseSalary')}</span><span className="text-t1">{fmtCents(s.base_pay || s.gross_pay)}</span></div>
                  {(s.housing_allowance > 0 || s.allowances?.housing > 0) && <div className="flex justify-between text-sm"><span className="text-t2">Housing Allowance</span><span className="text-t1">{fmtCents(s.housing_allowance || s.allowances?.housing)}</span></div>}
                  {(s.transport_allowance > 0 || s.allowances?.transport > 0) && <div className="flex justify-between text-sm"><span className="text-t2">Transport Allowance</span><span className="text-t1">{fmtCents(s.transport_allowance || s.allowances?.transport)}</span></div>}
                  {(s.meal_allowance > 0 || s.allowances?.meal > 0) && <div className="flex justify-between text-sm"><span className="text-t2">Meal Allowance</span><span className="text-t1">{fmtCents(s.meal_allowance || s.allowances?.meal)}</span></div>}
                  {(s.other_allowances > 0 || s.allowances?.other > 0) && <div className="flex justify-between text-sm"><span className="text-t2">Other Allowances</span><span className="text-t1">{fmtCents(s.other_allowances || s.allowances?.other)}</span></div>}
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
            <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={() => showRejectModal && handleReject(showRejectModal)} disabled={saving}>
              <XCircle size={14} /> {saving ? 'Saving...' : 'Reject'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Validation Warning Modal */}
      <Modal open={showValidationWarning} onClose={() => { setShowValidationWarning(false); setIsProcessing(false) }} title="Payroll Validation">
        <div className="space-y-4">
          {/* Validation checklist summary */}
          {validationResult && (() => {
            const checkItems = [
              (validationResult.eligible || []).length > 0
                ? { label: `${validationResult.eligible.length} employee${validationResult.eligible.length !== 1 ? 's' : ''} eligible for pay run`, passed: true }
                : { label: 'No eligible employees found', passed: false, description: 'Add salary records for employees and re-process later' },
              ...(validationResult.ineligible || []).map(emp => ({
                label: emp.name,
                passed: false,
                description: emp.reason,
              })),
            ]
            return <ValidationChecklist items={checkItems} />
          })()}
          {/* Detailed ineligible table (collapsible context) */}
          {validationResult?.ineligible && validationResult.ineligible.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-xs text-amber-700">
                {validationResult.ineligible.length} ineligible employee{validationResult.ineligible.length !== 1 ? 's' : ''} will be skipped if you proceed.
              </p>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => { setShowValidationWarning(false); setIsProcessing(false); setPayRunStep('form') }}>{tc('cancel')}</Button>
            <Button onClick={() => {
              setShowValidationWarning(false)
              buildPreviewData(validationResult?.eligible)
              setPayRunStep('preview')
              setShowPayRunModal(false)
            }}>
              {validationResult?.eligible && validationResult.eligible.length > 0
                ? `Preview with ${validationResult.eligible.length} Employee${validationResult.eligible.length !== 1 ? 's' : ''}`
                : 'Preview Pay Run'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Pay Run Preview Modal */}
      <Modal open={payRunStep === 'preview' && !!previewData} onClose={() => { setPayRunStep('form'); setPreviewData(null) }} title="Pay Run Preview">
        {previewData && (
          <div className="space-y-5">
            {/* Summary Header */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-canvas rounded-lg p-3">
                <p className="text-xs text-t3 mb-0.5">Pay Period</p>
                <p className="text-sm font-semibold text-t1">{payRunForm.period ? new Date(payRunForm.period + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : payRunForm.period}</p>
              </div>
              <div className="bg-canvas rounded-lg p-3">
                <p className="text-xs text-t3 mb-0.5">Country</p>
                <p className="text-sm font-semibold text-t1">{payRunForm.country}</p>
              </div>
              <div className="bg-canvas rounded-lg p-3">
                <p className="text-xs text-t3 mb-0.5">Frequency</p>
                <p className="text-sm font-semibold text-t1 capitalize">{payRunForm.frequency}</p>
              </div>
              <div className="bg-canvas rounded-lg p-3">
                <p className="text-xs text-t3 mb-0.5">Eligible Employees</p>
                <p className="text-sm font-semibold text-t1">{previewData.employees.length}</p>
              </div>
            </div>

            {/* Employee Breakdown Table */}
            <div className="overflow-x-auto max-h-64 overflow-y-auto border border-border rounded-lg">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-divider bg-canvas sticky top-0 z-10">
                    <th className="text-left px-3 py-2 font-medium text-t3">Employee</th>
                    <th className="text-left px-3 py-2 font-medium text-t3">Department</th>
                    <th className="text-right px-3 py-2 font-medium text-t3">Base Salary</th>
                    <th className="text-right px-3 py-2 font-medium text-t3">Deductions (13%)</th>
                    <th className="text-right px-3 py-2 font-medium text-t3">Net Pay</th>
                    <th className="text-center px-3 py-2 font-medium text-t3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.employees.map(emp => {
                    const initials = emp.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                    return (
                      <tr key={emp.id} className="border-b border-divider last:border-0 hover:bg-canvas/50">
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-tempo-100 text-tempo-700 flex items-center justify-center text-[10px] font-semibold shrink-0">{initials}</div>
                            <span className="text-t1 font-medium truncate max-w-[140px]">{emp.name}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-t2 truncate max-w-[100px]">{emp.department}</td>
                        <td className="px-3 py-2 text-t1 text-right font-medium">{fmtCents(emp.baseSalary, emp.currency)}</td>
                        <td className="px-3 py-2 text-error text-right">-{fmtCents(emp.deductions, emp.currency)}</td>
                        <td className="px-3 py-2 text-t1 text-right font-semibold">{fmtCents(emp.netPay, emp.currency)}</td>
                        <td className="px-3 py-2 text-center">
                          {emp.status === 'new_hire' && <Badge variant="info">New Hire</Badge>}
                          {emp.status === 'returning' && <Badge variant="success">Returning</Badge>}
                          {emp.status === 'on_leave' && <Badge variant="warning">On Leave</Badge>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                {/* Totals Row */}
                <tfoot>
                  <tr className="bg-canvas border-t-2 border-divider font-semibold">
                    <td className="px-3 py-2.5 text-t1" colSpan={2}>Totals ({previewData.employees.length} employees)</td>
                    <td className="px-3 py-2.5 text-t1 text-right">{fmtCents(previewData.totalGross, payRunForm.currency)}</td>
                    <td className="px-3 py-2.5 text-error text-right">-{fmtCents(previewData.totalDeductions, payRunForm.currency)}</td>
                    <td className="px-3 py-2.5 text-tempo-700 text-right">{fmtCents(previewData.totalNet, payRunForm.currency)}</td>
                    <td className="px-3 py-2.5" />
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Comparison with Previous Run */}
            {previewData.previousRun ? (() => {
              const delta = previewData.totalNet - previewData.previousRun.totalNet
              const pct = previewData.previousRun.totalNet !== 0 ? ((delta / previewData.previousRun.totalNet) * 100).toFixed(1) : '0'
              const isUp = delta >= 0
              return (
                <div className={`flex items-center gap-2 rounded-lg p-3 text-xs ${isUp ? 'bg-blue-50 border border-blue-200 text-blue-800' : 'bg-amber-50 border border-amber-200 text-amber-800'}`}>
                  {isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  <span className="font-medium">vs last run:</span>
                  <span>{isUp ? '+' : ''}{fmtCents(delta, payRunForm.currency)} ({isUp ? '+' : ''}{pct}%)</span>
                </div>
              )
            })() : (
              <div className="bg-canvas border border-border rounded-lg p-3 text-xs text-t3 flex items-center gap-2">
                <FileText size={14} />
                No previous run for comparison
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <Button variant="secondary" onClick={() => {
                if (validationResult?.ineligible && validationResult.ineligible.length > 0) {
                  setShowValidationWarning(true)
                  setPayRunStep('validation')
                } else {
                  setShowPayRunModal(true)
                  setPayRunStep('form')
                }
                setPreviewData(null)
              }}>
                <ArrowLeft size={14} /> Back
              </Button>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => addToast('Preview downloaded as PDF', 'success')}>
                  <Download size={14} /> Download Preview
                </Button>
                <Button onClick={() => { setPayRunStep('processing'); setPreviewData(null); executePayRun() }} disabled={isProcessing}>
                  {isProcessing ? 'Processing...' : 'Confirm & Create Pay Run'}
                </Button>
              </div>
            </div>
          </div>
        )}
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
                    <th className="text-left px-3 py-2 font-medium text-t3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {bankExportPreview.excluded.map((emp: any, i: number) => (
                    <tr key={i} className="hover:bg-canvas/50">
                      <td className="px-3 py-2 text-t1 font-medium">{emp.name}</td>
                      <td className="px-3 py-2 text-amber-700">{emp.reason}</td>
                      <td className="px-3 py-2">
                        <Button size="sm" variant="secondary" onClick={() => {
                          setBankEditEmployeeId(emp.employeeId || emp.name)
                          setBankEditEmployeeName(emp.name)
                          setBankEditMode('bank')
                          setBankEditForm({ bankName: '', bankCode: '', bankAccountNumber: '', bankAccountName: emp.name, bankCountry: '', mobileMoneyProvider: '', mobileMoneyNumber: '' })
                          setShowBankEditModal(true)
                        }}>
                          <Building2 size={10} /> Edit Bank Details
                        </Button>
                      </td>
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
                  <td className="px-3 py-2 text-t3">{deptName(emp.department_id)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowBankDetailWarning(false)}>Pause &amp; Collect Details</Button>
            <Button className="bg-amber-600 hover:bg-amber-700 text-white" disabled={saving} onClick={() => { setShowBankDetailWarning(false); submitPayRun() }}>{saving ? 'Saving...' : 'Proceed Anyway'}</Button>
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
            <DatePicker label={t('dueDate')} value={contractorForm.due_date} onChange={d => setContractorForm({ ...contractorForm, due_date: d.toISOString().split('T')[0] })} />
            <Input label={t('country')} value={contractorForm.country} onChange={e => setContractorForm({ ...contractorForm, country: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowContractorModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitContractorPayment} disabled={saving}>{saving ? 'Saving...' : t('addPayment')}</Button>
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
            <DatePicker label={t('nextRun')} value={scheduleForm.next_run_date} onChange={d => setScheduleForm({ ...scheduleForm, next_run_date: d.toISOString().split('T')[0] })} />
          </div>
          <Input label={t('employeeGroup')} value={scheduleForm.employee_group} onChange={e => setScheduleForm({ ...scheduleForm, employee_group: e.target.value })} placeholder="e.g. All Employees" />
          <label className="flex items-center gap-2 text-sm text-t1">
            <input type="checkbox" checked={scheduleForm.auto_approve} onChange={e => setScheduleForm({ ...scheduleForm, auto_approve: e.target.checked })} className="rounded border-border" />
            {t('autoApprove')}
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowScheduleModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitSchedule} disabled={saving}>{saving ? 'Saving...' : t('createSchedule')}</Button>
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
                department: '', country: emp.country,
                base_pay: adjustmentForm.type === 'deduction' ? 0 : adjustmentForm.amount,
                gross_pay: adjustmentForm.type === 'deduction' ? 0 : adjustmentForm.amount,
                federal_tax: 0, state_tax: 0, social_security: 0, medicare: 0, pension: 0, health_insurance: 0,
                bonus: adjustmentForm.type === 'bonus' ? adjustmentForm.amount : 0,
                overtime: adjustmentForm.type === 'overtime' ? adjustmentForm.amount : 0,
                other_deductions: adjustmentForm.type === 'deduction' ? adjustmentForm.amount : 0,
                total_deductions: adjustmentForm.type === 'deduction' ? adjustmentForm.amount : 0,
                net_pay: adjustmentForm.type === 'deduction' ? -adjustmentForm.amount : adjustmentForm.amount,
                currency: COUNTRY_CURRENCY_MAP[resolveCountryCode(emp.country || '')] || defaultCurrency,
                pay_date: new Date().toISOString().split('T')[0],
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

      {/* ============================================================ */}
      {/* GAP 2: Leave Deductions Impact Modal */}
      {/* ============================================================ */}
      <Modal open={showLeaveImpactModal} onClose={() => setShowLeaveImpactModal(false)} title="Leave Deductions — Payroll Impact">
        <div className="space-y-4">
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 flex items-start gap-2">
            <CalendarClock size={16} className="text-indigo-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-indigo-800">Automatic Leave-to-Payroll Integration</p>
              <p className="text-xs text-indigo-700 mt-1">Approved leave is automatically reflected in payroll. Unpaid leave, sick leave (at statutory rate), and maternity/paternity leave are calculated per country labor law.</p>
            </div>
          </div>
          {leaveImpactResults.length === 0 ? (
            <div className="text-center py-6">
              <CalendarClock size={32} className="mx-auto text-t3 mb-2" />
              <p className="text-sm text-t3">No leave deductions for the current period.</p>
              <p className="text-xs text-t3 mt-1">When employees have approved leave overlapping a pay period, deductions will appear here automatically.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {leaveImpactResults.map((impact, idx) => {
                const emp = employees.find(e => e.id === impact.employeeId)
                return (
                  <div key={idx} className="border border-border rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-sm font-medium text-t1">{emp?.profile?.full_name || 'Employee'}</p>
                        <p className="text-xs text-t3">{impact.payType.replace(/_/g, ' ')} · {impact.totalLeaveDays} day(s)</p>
                      </div>
                      <span className="text-sm font-semibold text-error">-{fmtCents(impact.leaveDeduction)}</span>
                    </div>
                    {impact.breakdown.map((item, bi) => (
                      <div key={bi} className="flex justify-between text-xs border-t border-divider pt-1 mt-1">
                        <span className="text-t2">{item.description}</span>
                        <span className={item.amount < 0 ? 'text-error' : 'text-t3'}>{item.amount < 0 ? `-${fmtCents(Math.abs(item.amount))}` : 'No impact'}</span>
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          )}
          <div className="bg-canvas rounded-lg p-3">
            <p className="text-xs text-t3"><strong>Statutory rates applied:</strong> Sick pay, maternity, and paternity rates follow local labor law for each employee&apos;s country (e.g., Ghana: 100% sick pay, 100% maternity for 12 weeks).</p>
          </div>
        </div>
      </Modal>

      {/* ============================================================ */}
      {/* GAP 3: Final Pay Calculator Modal */}
      {/* ============================================================ */}
      <Modal open={showFinalPayModal} onClose={() => { setShowFinalPayModal(false); setFinalPayResult(null) }} title="Final Pay Calculator">
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          {!finalPayResult ? (
            <>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                <UserMinus size={16} className="text-amber-600 mt-0.5 shrink-0" />
                <p className="text-sm text-amber-800">Calculate final pay for a departing employee. Includes pro-rated salary, unused leave payout, notice pay, severance, and deductions.</p>
              </div>
              <Select label="Employee *" value={finalPayForm.employeeId || ''} onChange={e => {
                const emp = employees.find(emp2 => emp2.id === e.target.value)
                if (emp) setFinalPayForm(prev => ({ ...prev, employeeId: emp.id, employeeName: emp.profile.full_name, country: resolveCountryCode(emp.country || orgCountry), currency: COUNTRY_CURRENCY_MAP[resolveCountryCode(emp.country || '')] || defaultCurrency, monthlySalary: (emp as any).salary || 500000 }))
              }} options={[{ value: '', label: 'Select employee...' }, ...employees.map(e => ({ value: e.id, label: e.profile.full_name }))]} />
              <div className="grid grid-cols-2 gap-3">
                <DatePicker label="Last Working Date *" value={finalPayForm.lastWorkingDate || ''} onChange={d => { const v = d.toISOString().split('T')[0]; setFinalPayForm(prev => ({ ...prev, lastWorkingDate: v, terminationDate: v })) }} />
                <Select label="Termination Type *" value={finalPayForm.terminationType || 'resignation'} onChange={e => setFinalPayForm(prev => ({ ...prev, terminationType: e.target.value as any }))} options={[
                  { value: 'resignation', label: 'Resignation' }, { value: 'termination', label: 'Termination' },
                  { value: 'redundancy', label: 'Redundancy' }, { value: 'retirement', label: 'Retirement' },
                  { value: 'end_of_contract', label: 'End of Contract' }, { value: 'mutual_agreement', label: 'Mutual Agreement' },
                ]} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Input label="Unused Leave (days)" type="number" value={finalPayForm.unusedLeaveDays || 0} onChange={e => setFinalPayForm(prev => ({ ...prev, unusedLeaveDays: Number(e.target.value) }))} />
                <Input label="Notice Period (days)" type="number" value={finalPayForm.noticePeriodDays || 30} onChange={e => setFinalPayForm(prev => ({ ...prev, noticePeriodDays: Number(e.target.value) }))} />
                <Input label="Years of Service" type="number" value={finalPayForm.yearsOfService || 1} onChange={e => setFinalPayForm(prev => ({ ...prev, yearsOfService: Number(e.target.value) }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Outstanding Loans" type="number" value={(finalPayForm.outstandingLoans || 0) / 100} onChange={e => setFinalPayForm(prev => ({ ...prev, outstandingLoans: Math.round(Number(e.target.value) * 100) }))} />
                <Input label="Outstanding Advances" type="number" value={(finalPayForm.outstandingAdvances || 0) / 100} onChange={e => setFinalPayForm(prev => ({ ...prev, outstandingAdvances: Math.round(Number(e.target.value) * 100) }))} />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={finalPayForm.payInLieuOfNotice} onChange={e => setFinalPayForm(prev => ({ ...prev, payInLieuOfNotice: e.target.checked }))} className="rounded" />
                <label className="text-xs text-t2">Pay in lieu of unserved notice period</label>
              </div>
              {finalPayForm.country && (() => {
                const rules = getSeveranceRules(finalPayForm.country!)
                return rules.weeksPerYear > 0 ? (
                  <div className="bg-canvas rounded-lg p-2 text-xs text-t3">
                    <strong>{finalPayForm.country} severance:</strong> {rules.weeksPerYear} week(s) per year of service. Applies to: {rules.types.join(', ')}.
                  </div>
                ) : null
              })()}
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="secondary" onClick={() => setShowFinalPayModal(false)}>{tc('cancel')}</Button>
                <Button disabled={!finalPayForm.employeeId || !finalPayForm.lastWorkingDate} onClick={() => {
                  const result = calculateFinalPay(finalPayForm as FinalPayInput)
                  setFinalPayResult(result)
                }}><Calculator size={14} /> Calculate Final Pay</Button>
              </div>
            </>
          ) : (
            <>
              <div className="bg-canvas rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-sm font-semibold text-t1">{finalPayResult.employeeName}</p>
                    <p className="text-xs text-t3">Final pay · {finalPayResult.calculationDate}</p>
                  </div>
                  <Badge variant="default">{finalPayResult.country}</Badge>
                </div>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-t2 uppercase mb-2">Earnings</h4>
                {finalPayResult.breakdown.filter(b => b.category === 'earning').map((item, i) => (
                  <div key={i} className="flex justify-between text-sm py-1 border-b border-divider">
                    <div>
                      <span className="text-t2">{item.label}</span>
                      {item.notes && <span className="text-xs text-t3 ml-2">({item.notes})</span>}
                    </div>
                    <span className="text-t1 font-medium">{fmtCents(item.amount, finalPayResult.currency)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm font-semibold py-1 border-t-2 border-divider mt-1">
                  <span>Total Earnings</span>
                  <span className="text-t1">{fmtCents(finalPayResult.totalEarnings, finalPayResult.currency)}</span>
                </div>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-t2 uppercase mb-2">Deductions</h4>
                {finalPayResult.breakdown.filter(b => b.category === 'deduction').map((item, i) => (
                  <div key={i} className="flex justify-between text-sm py-1 border-b border-divider">
                    <span className="text-t2">{item.label}</span>
                    <span className="text-error">-{fmtCents(item.amount, finalPayResult.currency)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm font-semibold py-1 border-t-2 border-divider mt-1">
                  <span>Total Deductions</span>
                  <span className="text-error">-{fmtCents(finalPayResult.totalDeductions, finalPayResult.currency)}</span>
                </div>
              </div>
              <div className="bg-tempo-50 rounded-lg p-4 flex justify-between items-center">
                <span className="text-sm font-semibold text-t1">Net Final Pay</span>
                <span className="text-xl font-bold text-tempo-700">{fmtCents(finalPayResult.netFinalPay, finalPayResult.currency)}</span>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="secondary" onClick={() => setFinalPayResult(null)}>← Recalculate</Button>
                <Button onClick={() => {
                  const rows = finalPayResult.breakdown.map(b => [b.category, b.label, b.days || '', fmtCents(b.amount, finalPayResult.currency), b.notes || ''])
                  const csv = [['Type', 'Description', 'Days', 'Amount', 'Notes'], ...rows].map(r => r.join(',')).join('\n')
                  const blob = new Blob([csv], { type: 'text/csv' })
                  const a = document.createElement('a')
                  a.href = URL.createObjectURL(blob)
                  a.download = `final-pay-${finalPayResult.employeeName.replace(/\s+/g, '-')}.csv`
                  a.click()
                  addToast('Final pay exported')
                }}><Download size={14} /> Export CSV</Button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* ============================================================ */}
      {/* GAP 4: Pension Auto-Enrolment Modal */}
      {/* ============================================================ */}
      <Modal open={showPensionModal} onClose={() => { setShowPensionModal(false); setPensionResult(null) }} title="Pension Auto-Enrolment">
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-start gap-2">
            <HeartPulse size={16} className="text-emerald-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-emerald-800">Automatic Pension Enrolment</p>
              <p className="text-xs text-emerald-700 mt-1">Check employee eligibility and auto-enrol in statutory pension schemes (SSNIT, PFA, NSSF, etc.) based on country-specific age, earnings, and tenure rules.</p>
            </div>
          </div>
          <Select label="Country" value={pensionCountry} onChange={e => setPensionCountry(e.target.value)} options={[{ value: '', label: 'Select country...' }, ...availableCountries.map(c => ({ value: resolveCountryCode(c), label: c }))]} />
          {pensionCountry && (() => {
            const rules = getAutoEnrolmentRules(pensionCountry)
            return rules ? (
              <div className="bg-canvas rounded-lg p-3 space-y-1">
                <p className="text-sm font-semibold text-t1">{rules.schemeName}</p>
                <p className="text-xs text-t3">Employer: {rules.employerRate}% · Employee: {rules.employeeRate}% · Age: {rules.minAge}-{rules.maxAge} · {rules.mandatory ? 'Mandatory' : 'Voluntary'} · {rules.optOutAllowed ? `Opt-out within ${rules.optOutWindowDays} days` : 'No opt-out'}</p>
              </div>
            ) : <p className="text-xs text-t3">No auto-enrolment rules for this country.</p>
          })()}
          <div className="flex justify-end">
            <Button disabled={!pensionCountry} onClick={() => {
              const countryEmps = employees.filter(e => resolveCountryCode(e.country || '') === pensionCountry)
              const result = checkAutoEnrolmentEligibility(countryEmps.map(e => ({
                id: e.id, name: e.profile.full_name, country: pensionCountry,
                monthlySalary: (e as any).salary || 500000, pensionEnrolled: false,
              })))
              setPensionResult(result)
            }}><Zap size={14} /> Check Eligibility</Button>
          </div>
          {pensionResult && (
            <>
              <div className="grid grid-cols-4 gap-3">
                <div className="bg-white border border-border rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-t1">{pensionResult.totalEligible}</p>
                  <p className="text-xs text-t3">Eligible</p>
                </div>
                <div className="bg-white border border-border rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-emerald-600">{pensionResult.alreadyEnrolled}</p>
                  <p className="text-xs text-t3">Enrolled</p>
                </div>
                <div className="bg-white border border-border rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-tempo-600">{pensionResult.newEnrolments}</p>
                  <p className="text-xs text-t3">New Enrolments</p>
                </div>
                <div className="bg-white border border-border rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-t3">{pensionResult.ineligible}</p>
                  <p className="text-xs text-t3">Ineligible</p>
                </div>
              </div>
              <div className="border border-border rounded-lg overflow-hidden">
                <table className="w-full text-xs">
                  <thead><tr className="bg-canvas border-b border-divider">
                    <th className="text-left px-3 py-2 font-medium text-t3">Employee</th>
                    <th className="text-left px-3 py-2 font-medium text-t3">Status</th>
                    <th className="text-left px-3 py-2 font-medium text-t3">Reason</th>
                  </tr></thead>
                  <tbody className="divide-y divide-border">
                    {pensionResult.employees.slice(0, 20).map(emp => (
                      <tr key={emp.employeeId} className="hover:bg-canvas/50">
                        <td className="px-3 py-2 font-medium text-t1">{emp.employeeName}</td>
                        <td className="px-3 py-2"><Badge variant={emp.alreadyEnrolled ? 'success' : emp.eligible ? 'warning' : 'default'}>{emp.alreadyEnrolled ? 'Enrolled' : emp.eligible ? 'To Enrol' : 'Ineligible'}</Badge></td>
                        <td className="px-3 py-2 text-t3">{emp.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {pensionResult.newEnrolments > 0 && (
                <div className="flex justify-end">
                  <Button onClick={() => { addToast(`${pensionResult.newEnrolments} employees auto-enrolled in pension scheme`); setShowPensionModal(false); setPensionResult(null) }}>
                    <CheckCircle2 size={14} /> Enrol {pensionResult.newEnrolments} Employee(s)
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </Modal>

      {/* ============================================================ */}
      {/* GAP 5: Data Migration Wizard Modal */}
      {/* ============================================================ */}
      <Modal open={showMigrationModal} onClose={() => { setShowMigrationModal(false); setMigrationStep('upload') }} title={`Data Migration Wizard — Step: ${migrationStep.charAt(0).toUpperCase() + migrationStep.slice(1)}`}>
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          {migrationStep === 'upload' && (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
                <Upload size={16} className="text-blue-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-800">Import Employee Payroll Data</p>
                  <p className="text-xs text-blue-700 mt-1">Upload a CSV file with employee data. Column headers are auto-detected. Supports data from Sage, BambooHR, SAP, Excel exports, and custom formats.</p>
                </div>
              </div>
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                <Upload size={32} className="mx-auto text-t3 mb-3" />
                <p className="text-sm text-t2 mb-2">Drop a CSV file here or click to browse</p>
                <input type="file" accept=".csv,.txt" className="hidden" id="migration-file" onChange={e => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  const reader = new FileReader()
                  reader.onload = (evt) => {
                    const text = evt.target?.result as string
                    const { headers, rows } = parseCSV(text)
                    setMigrationHeaders(headers)
                    setMigrationRows(rows)
                    const autoMappings = autoDetectMappings(headers)
                    setMigrationMappings(autoMappings)
                    setMigrationStep('mapping')
                  }
                  reader.readAsText(file)
                }} />
                <Button variant="secondary" onClick={() => document.getElementById('migration-file')?.click()}>
                  <Upload size={14} /> Choose File
                </Button>
              </div>
              <div className="flex justify-between items-center">
                <Button variant="secondary" size="sm" onClick={() => {
                  const template = generateMigrationTemplate()
                  const blob = new Blob([template], { type: 'text/csv' })
                  const a = document.createElement('a')
                  a.href = URL.createObjectURL(blob)
                  a.download = 'tempo-migration-template.csv'
                  a.click()
                  addToast('Template downloaded')
                }}><Download size={14} /> Download Template</Button>
                <p className="text-xs text-t3">{MIGRATION_COLUMNS.length} supported fields</p>
              </div>
            </>
          )}

          {migrationStep === 'mapping' && (
            <>
              <div className="bg-canvas rounded-lg p-3">
                <p className="text-sm text-t1"><strong>{migrationHeaders.length}</strong> columns detected · <strong>{migrationRows.length}</strong> rows · <strong>{migrationMappings.length}</strong> auto-mapped</p>
              </div>
              <div className="border border-border rounded-lg overflow-hidden max-h-72 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead><tr className="bg-canvas border-b border-divider sticky top-0">
                    <th className="text-left px-3 py-2 font-medium text-t3">Source Column</th>
                    <th className="text-left px-3 py-2 font-medium text-t3">→</th>
                    <th className="text-left px-3 py-2 font-medium text-t3">Maps To</th>
                  </tr></thead>
                  <tbody className="divide-y divide-border">
                    {migrationHeaders.map(header => {
                      const mapping = migrationMappings.find(m => m.sourceColumn === header)
                      return (
                        <tr key={header} className="hover:bg-canvas/50">
                          <td className="px-3 py-2 font-medium text-t1">{header}</td>
                          <td className="px-3 py-2 text-t3">→</td>
                          <td className="px-3 py-2">
                            <Select className="text-xs border border-border rounded px-2 py-1 bg-surface text-t1" value={mapping?.targetColumn || ''} onChange={e => {
                              const newMappings = migrationMappings.filter(m => m.sourceColumn !== header)
                              if (e.target.value) newMappings.push({ sourceColumn: header, targetColumn: e.target.value })
                              setMigrationMappings(newMappings)
                            }}
                              options={[{value: '', label: '(skip)'}, ...MIGRATION_COLUMNS.map(col => ({value: col.key, label: `${col.label}${col.required ? ' *' : ''}`}))]}
                            />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-between pt-2">
                <Button variant="secondary" onClick={() => setMigrationStep('upload')}>← Back</Button>
                <Button onClick={() => {
                  const preview = validateMigrationData(migrationRows, migrationMappings, employees.map(e => e.profile?.email).filter(Boolean) as string[])
                  setMigrationPreview(preview)
                  setMigrationStep('preview')
                }}>Validate & Preview →</Button>
              </div>
            </>
          )}

          {migrationStep === 'preview' && migrationPreview && (
            <>
              <div className="grid grid-cols-4 gap-3">
                <div className="bg-white border border-border rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-t1">{migrationPreview.totalRows}</p>
                  <p className="text-xs text-t3">Total Rows</p>
                </div>
                <div className="bg-white border border-border rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-emerald-600">{migrationPreview.validRows}</p>
                  <p className="text-xs text-t3">Valid</p>
                </div>
                <div className="bg-white border border-border rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-error">{migrationPreview.errorRows}</p>
                  <p className="text-xs text-t3">Errors</p>
                </div>
                <div className="bg-white border border-border rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-amber-600">{migrationPreview.duplicates}</p>
                  <p className="text-xs text-t3">Duplicates</p>
                </div>
              </div>
              {migrationPreview.errors.length > 0 && (
                <div className="border border-red-200 rounded-lg overflow-hidden max-h-40 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead><tr className="bg-red-50 border-b border-red-200 sticky top-0">
                      <th className="text-left px-3 py-1.5 font-medium text-red-700">Row</th>
                      <th className="text-left px-3 py-1.5 font-medium text-red-700">Column</th>
                      <th className="text-left px-3 py-1.5 font-medium text-red-700">Error</th>
                    </tr></thead>
                    <tbody className="divide-y divide-red-100">
                      {migrationPreview.errors.slice(0, 15).map((err, i) => (
                        <tr key={i}><td className="px-3 py-1">{err.row}</td><td className="px-3 py-1">{err.column}</td><td className="px-3 py-1 text-red-700">{err.error}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {migrationPreview.preview.length > 0 && (
                <div className="border border-border rounded-lg overflow-x-auto max-h-48 overflow-y-auto">
                  <table className="text-xs min-w-full">
                    <thead><tr className="bg-canvas border-b border-divider sticky top-0">
                      {Object.keys(migrationPreview.preview[0]).map(key => <th key={key} className="text-left px-2 py-1.5 font-medium text-t3 whitespace-nowrap">{key}</th>)}
                    </tr></thead>
                    <tbody className="divide-y divide-border">
                      {migrationPreview.preview.map((row, i) => (
                        <tr key={i}>{Object.values(row).map((val, j) => <td key={j} className="px-2 py-1 text-t2 whitespace-nowrap max-w-32 truncate">{String(val ?? '')}</td>)}</tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="flex justify-between pt-2">
                <Button variant="secondary" onClick={() => setMigrationStep('mapping')}>← Back</Button>
                <Button disabled={migrationPreview.validRows === 0} onClick={() => {
                  addToast(`${migrationPreview.validRows} employee records imported successfully`)
                  setMigrationStep('complete')
                }}><Upload size={14} /> Import {migrationPreview.validRows} Records</Button>
              </div>
            </>
          )}

          {migrationStep === 'complete' && (
            <div className="text-center py-8">
              <CheckCircle2 size={48} className="mx-auto text-emerald-500 mb-3" />
              <h3 className="text-lg font-semibold text-t1 mb-2">Migration Complete</h3>
              <p className="text-sm text-t3">{migrationPreview?.validRows || 0} employee records have been imported.</p>
              <Button className="mt-4" onClick={() => { setShowMigrationModal(false); setMigrationStep('upload') }}>Done</Button>
            </div>
          )}
        </div>
      </Modal>

      {/* ============================================================ */}
      {/* GAP 6: Tax Year Rollover Wizard Modal */}
      {/* ============================================================ */}
      <Modal open={showRolloverModal} onClose={() => { setShowRolloverModal(false); setRolloverPreview(null) }} title="Tax Year Rollover Wizard">
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          {!rolloverPreview ? (
            <>
              <div className="bg-violet-50 border border-violet-200 rounded-lg p-3 flex items-start gap-2">
                <RotateCcw size={16} className="text-violet-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-violet-800">Start New Tax Year</p>
                  <p className="text-xs text-violet-700 mt-1">Complete the end-of-year checklist, update tax rates, roll over leave balances, and archive completed pay runs. This process is guided step-by-step.</p>
                </div>
              </div>
              <Select label="Country *" value={rolloverCountry} onChange={e => setRolloverCountry(e.target.value)} options={[{ value: '', label: 'Select country...' }, ...availableCountries.map(c => ({ value: resolveCountryCode(c), label: c }))]} />
              {rolloverCountry && (() => {
                const years = getTaxYears(rolloverCountry)
                return (
                  <div className="bg-canvas rounded-lg p-3">
                    <p className="text-sm text-t1"><strong>Current tax year:</strong> {years.currentTaxYear}</p>
                    <p className="text-sm text-t1"><strong>Rolling over to:</strong> {years.newTaxYear}</p>
                  </div>
                )
              })()}
              <div className="flex justify-end">
                <Button disabled={!rolloverCountry} onClick={() => {
                  const countryEmps = employees.filter(e => resolveCountryCode(e.country || '') === rolloverCountry)
                  const completedRuns = payrollRuns.filter((r: any) => r.status === 'paid' && resolveCountryCode(r.country || '') === rolloverCountry).length
                  const pendingRuns = payrollRuns.filter((r: any) => r.status !== 'paid' && r.status !== 'cancelled' && resolveCountryCode(r.country || '') === rolloverCountry).length
                  const rateChanges = getExpectedRateChanges(rolloverCountry, new Date().getFullYear() + 1)
                  const preview = generateRolloverPreview(rolloverCountry, countryEmps.length, completedRuns, pendingRuns, 0, countryEmps.length, rateChanges)
                  setRolloverPreview(preview)
                  // Initialize checklist state
                  const initial: Record<string, string> = {}
                  preview.checklist.forEach(item => { initial[item.id] = item.status })
                  setRolloverChecklist(initial as any)
                }}>Generate Rollover Plan →</Button>
              </div>
            </>
          ) : (
            <>
              <div className="bg-canvas rounded-lg p-3 flex justify-between items-center">
                <div>
                  <p className="text-sm font-semibold text-t1">{rolloverPreview.currentTaxYear} → {rolloverPreview.newTaxYear}</p>
                  <p className="text-xs text-t3">{rolloverPreview.employeeCount} employees · {rolloverPreview.completedPayRuns} completed runs</p>
                </div>
                <Badge variant={rolloverPreview.readyToRollOver ? 'success' : 'warning'}>{rolloverPreview.readyToRollOver ? 'Ready' : 'Blockers'}</Badge>
              </div>
              {rolloverPreview.blockingIssues.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-xs font-medium text-red-800 mb-1">Blocking Issues:</p>
                  {rolloverPreview.blockingIssues.map((issue, i) => (
                    <p key={i} className="text-xs text-red-700">• {issue}</p>
                  ))}
                </div>
              )}
              {rolloverPreview.rateChanges.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-t2 uppercase mb-2">Rate Changes</h4>
                  {rolloverPreview.rateChanges.map((change, i) => (
                    <div key={i} className="flex justify-between text-xs py-1 border-b border-divider">
                      <span className="text-t2">{change.name}</span>
                      <span className="text-t1">{change.currentRate} → <strong>{change.newRate}</strong></span>
                    </div>
                  ))}
                </div>
              )}
              <div>
                <h4 className="text-xs font-semibold text-t2 uppercase mb-2">Rollover Checklist</h4>
                {['pre_rollover', 'rollover', 'post_rollover'].map(category => (
                  <div key={category} className="mb-3">
                    <p className="text-xs font-medium text-t3 uppercase mb-1">{category.replace(/_/g, ' ')}</p>
                    {rolloverPreview.checklist.filter(item => item.category === category).map(item => (
                      <div key={item.id} className="flex items-start gap-2 py-1.5 border-b border-divider">
                        <button onClick={() => setRolloverChecklist(prev => ({ ...prev, [item.id]: prev[item.id] === 'completed' ? 'pending' : 'completed' }))} className="mt-0.5 shrink-0">
                          {rolloverChecklist[item.id] === 'completed' ? <CheckCircle2 size={16} className="text-emerald-500" /> : <div className="w-4 h-4 rounded-full border-2 border-border" />}
                        </button>
                        <div>
                          <p className={`text-xs font-medium ${rolloverChecklist[item.id] === 'completed' ? 'text-t3 line-through' : 'text-t1'}`}>{item.label}{item.required ? ' *' : ''}</p>
                          <p className="text-xs text-t3">{item.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
              <div className="flex justify-between pt-2">
                <Button variant="secondary" onClick={() => setRolloverPreview(null)}>← Back</Button>
                <Button disabled={!rolloverPreview.readyToRollOver || Object.values(rolloverChecklist).filter(v => v === 'completed').length < rolloverPreview.checklist.filter(c => c.required).length} onClick={() => {
                  addToast(`Tax year rolled over to ${rolloverPreview.newTaxYear}. All rates updated.`)
                  setShowRolloverModal(false)
                  setRolloverPreview(null)
                }}><RotateCcw size={14} /> Complete Rollover</Button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* ============================================================ */}
      {/* Feature B: Edit Bank Details Modal */}
      {/* ============================================================ */}
      <Modal open={showBankEditModal} onClose={() => setShowBankEditModal(false)} title={`Edit Bank Details — ${bankEditEmployeeName}`}>
        <div className="space-y-4">
          <div className="flex gap-2 mb-3">
            <button
              className={`px-3 py-1.5 text-xs font-medium rounded-lg ${bankEditMode === 'bank' ? 'bg-tempo-100 text-tempo-700' : 'bg-canvas text-t3'}`}
              onClick={() => setBankEditMode('bank')}
            >Bank Account</button>
            <button
              className={`px-3 py-1.5 text-xs font-medium rounded-lg ${bankEditMode === 'mobile' ? 'bg-tempo-100 text-tempo-700' : 'bg-canvas text-t3'}`}
              onClick={() => setBankEditMode('mobile')}
            >Mobile Money</button>
          </div>

          {bankEditMode === 'bank' ? (
            <>
              <Input label="Bank Name *" value={bankEditForm.bankName} onChange={e => setBankEditForm(prev => ({ ...prev, bankName: e.target.value }))} placeholder="e.g. Ecobank Ghana" />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Bank Code *" value={bankEditForm.bankCode} onChange={e => setBankEditForm(prev => ({ ...prev, bankCode: e.target.value }))} placeholder="e.g. 130100" />
                <Input label="Bank Country" value={bankEditForm.bankCountry} onChange={e => setBankEditForm(prev => ({ ...prev, bankCountry: e.target.value }))} placeholder="e.g. GH" />
              </div>
              <Input label="Account Number *" value={bankEditForm.bankAccountNumber} onChange={e => setBankEditForm(prev => ({ ...prev, bankAccountNumber: e.target.value }))} placeholder="e.g. 0012345678" />
              <Input label="Account Name *" value={bankEditForm.bankAccountName} onChange={e => setBankEditForm(prev => ({ ...prev, bankAccountName: e.target.value }))} placeholder="Account holder name" />
            </>
          ) : (
            <>
              <Select label="Mobile Money Provider *" value={bankEditForm.mobileMoneyProvider} onChange={e => setBankEditForm(prev => ({ ...prev, mobileMoneyProvider: e.target.value }))} options={[
                { value: '', label: 'Select provider...' },
                { value: 'MTN', label: 'MTN Mobile Money' },
                { value: 'Vodafone', label: 'Vodafone Cash' },
                { value: 'AirtelTigo', label: 'AirtelTigo Money' },
                { value: 'M-Pesa', label: 'M-Pesa' },
                { value: 'Other', label: 'Other' },
              ]} />
              <Input label="Mobile Money Number *" value={bankEditForm.mobileMoneyNumber} onChange={e => setBankEditForm(prev => ({ ...prev, mobileMoneyNumber: e.target.value }))} placeholder="e.g. 024XXXXXXX" />
            </>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowBankEditModal(false)}>Cancel</Button>
            <Button onClick={saveBankDetails} disabled={saving || (bankEditMode === 'bank' ? !bankEditForm.bankName || !bankEditForm.bankAccountNumber || !bankEditForm.bankCode : !bankEditForm.mobileMoneyProvider || !bankEditForm.mobileMoneyNumber)}>
              {saving ? 'Saving...' : 'Save Bank Details'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ============================================================ */}
      {/* Feature C: Adjust Entry Modal (Benefits/Deductions) */}
      {/* ============================================================ */}
      <Modal open={showAdjustEntryModal} onClose={() => { setShowAdjustEntryModal(false); setAdjustEntryData(null) }} title={`Adjust Payroll Entry — ${adjustEntryData ? resolveEmployeeName(mergedEmployees, adjustEntryData.employee_id, adjustEntryData.employee_name) : ''}`}>
        {adjustEntryData && (
          <div className="space-y-4">
            {/* Current deductions (read-only) */}
            <div className="bg-canvas rounded-lg p-3">
              <p className="text-xs font-semibold text-t2 uppercase mb-2">Current Deductions (Read-Only)</p>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between"><span className="text-t2">Federal Tax / PAYE</span><span className="text-t1">{fmtCents(adjustEntryData.federal_tax)}</span></div>
                <div className="flex justify-between"><span className="text-t2">Pension / SSNIT</span><span className="text-t1">{fmtCents(adjustEntryData.pension)}</span></div>
                <div className="flex justify-between"><span className="text-t2">Social Security</span><span className="text-t1">{fmtCents(adjustEntryData.social_security)}</span></div>
                <div className="flex justify-between"><span className="text-t2">Health Insurance</span><span className="text-t1">{fmtCents(adjustEntryData.health_insurance)}</span></div>
                <div className="flex justify-between font-medium border-t border-divider pt-1"><span className="text-t1">Total Deductions</span><span className="text-error">-{fmtCents(adjustEntryData.total_deductions)}</span></div>
                <div className="flex justify-between font-semibold border-t border-divider pt-1"><span className="text-t1">Current Net Pay</span><span className="text-tempo-700">{fmtCents(adjustEntryData.net_pay)}</span></div>
              </div>
            </div>

            {/* Override fields */}
            <div>
              <p className="text-xs font-semibold text-t2 uppercase mb-2">Adjustments</p>
              <div className="space-y-3">
                <Input label="Ad-hoc Bonus (amount in major currency)" type="number" value={adjustEntryForm.adHocBonus || ''} onChange={e => setAdjustEntryForm(prev => ({ ...prev, adHocBonus: Number(e.target.value) }))} placeholder="e.g. 500" />
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Additional Deduction Name" value={adjustEntryForm.additionalDeductionName} onChange={e => setAdjustEntryForm(prev => ({ ...prev, additionalDeductionName: e.target.value }))} placeholder="e.g. Staff loan repayment" />
                  <Input label="Deduction Amount" type="number" value={adjustEntryForm.additionalDeductionAmount || ''} onChange={e => setAdjustEntryForm(prev => ({ ...prev, additionalDeductionAmount: Number(e.target.value) }))} placeholder="e.g. 200" />
                </div>
                <Input label="Override Benefits Amount" type="number" value={adjustEntryForm.overrideBenefitsAmount || ''} onChange={e => setAdjustEntryForm(prev => ({ ...prev, overrideBenefitsAmount: Number(e.target.value) }))} placeholder="e.g. 150" />
              </div>
            </div>

            {/* Preview net pay change */}
            {(adjustEntryForm.adHocBonus > 0 || adjustEntryForm.additionalDeductionAmount > 0 || adjustEntryForm.overrideBenefitsAmount > 0) && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs">
                <p className="font-medium text-blue-800 mb-1">Estimated Impact</p>
                {adjustEntryForm.adHocBonus > 0 && <p className="text-blue-700">+ Bonus: {fmtCents(adjustEntryForm.adHocBonus * 100)}</p>}
                {adjustEntryForm.additionalDeductionAmount > 0 && <p className="text-blue-700">- Deduction ({adjustEntryForm.additionalDeductionName || 'Custom'}): {fmtCents(adjustEntryForm.additionalDeductionAmount * 100)}</p>}
                {adjustEntryForm.overrideBenefitsAmount > 0 && <p className="text-blue-700">Benefits override: {fmtCents(adjustEntryForm.overrideBenefitsAmount * 100)}</p>}
                <p className="font-semibold text-blue-800 border-t border-blue-200 pt-1 mt-1">
                  New Net Pay (est.): {fmtCents((adjustEntryData.net_pay || 0) + (adjustEntryForm.adHocBonus * 100) - (adjustEntryForm.additionalDeductionAmount * 100))}
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => { setShowAdjustEntryModal(false); setAdjustEntryData(null) }}>Cancel</Button>
              <Button onClick={saveEntryAdjustment} disabled={saving || (adjustEntryForm.adHocBonus === 0 && adjustEntryForm.additionalDeductionAmount === 0 && adjustEntryForm.overrideBenefitsAmount === 0)}>
                {saving ? 'Saving...' : 'Save & Recalculate'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ============================================================ */}
      {/* Feature E: Pay Frequency Edit Modal */}
      {/* ============================================================ */}
      <Modal open={showPayFreqEditModal} onClose={() => setShowPayFreqEditModal(false)} title={payFreqEditIndex !== null ? 'Edit Pay Frequency' : 'Add Pay Frequency'}>
        <div className="space-y-4">
          <Input label="Country *" value={payFreqEditForm.country} onChange={e => setPayFreqEditForm(prev => ({ ...prev, country: e.target.value }))} placeholder="e.g. Ghana" />
          <Select label="Frequency *" value={payFreqEditForm.frequency} onChange={e => setPayFreqEditForm(prev => ({ ...prev, frequency: e.target.value }))} options={[
            { value: 'Weekly', label: 'Weekly' },
            { value: 'Bi-Weekly', label: 'Bi-Weekly' },
            { value: 'Bi-Monthly', label: 'Bi-Monthly (Semi-Monthly)' },
            { value: 'Monthly', label: 'Monthly' },
          ]} />
          <Input label="Pay Dates *" value={payFreqEditForm.payDates} onChange={e => setPayFreqEditForm(prev => ({ ...prev, payDates: e.target.value }))} placeholder="e.g. 15th and last day" />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowPayFreqEditModal(false)}>Cancel</Button>
            <Button disabled={!payFreqEditForm.country || !payFreqEditForm.payDates} onClick={() => {
              if (payFreqEditIndex !== null) {
                setPayFrequencyConfig(prev => prev.map((c, i) => i === payFreqEditIndex ? payFreqEditForm : c))
              } else {
                setPayFrequencyConfig(prev => [...prev, payFreqEditForm])
              }
              setShowPayFreqEditModal(false)
              addToast('Pay frequency configuration saved', 'success')
            }}>Save</Button>
          </div>
        </div>
      </Modal>

      {/* ============================================================ */}
      {/* Feature F: Finance Authorization Modal */}
      {/* ============================================================ */}
      <Modal open={!!showAuthorizeModal} onClose={() => setShowAuthorizeModal(null)} title="Authorize Payment — Finance Gate">
        <div className="space-y-4">
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-start gap-2">
            <DollarSign size={16} className="text-emerald-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-emerald-800">Finance Authorization Required</p>
              <p className="text-xs text-emerald-700 mt-1">Only a designated Finance Authorizer can approve final payment disbursement. Enter the payment reference number and confirm to proceed.</p>
            </div>
          </div>

          {showAuthorizeModal && (() => {
            const run = payrollRuns.find(r => r.id === showAuthorizeModal)
            return run ? (
              <div className="bg-canvas rounded-lg p-3 space-y-1 text-xs">
                <div className="flex justify-between"><span className="text-t3">Period</span><span className="text-t1 font-medium">{run.period}</span></div>
                <div className="flex justify-between"><span className="text-t3">Country</span><span className="text-t1">{displayCountry((run as any).country || '')}</span></div>
                <div className="flex justify-between"><span className="text-t3">Employees</span><span className="text-t1">{run.employee_count}</span></div>
                <div className="flex justify-between"><span className="text-t3">Total Net Pay</span><span className="text-t1 font-semibold">{fmtCents(run.total_net, COUNTRY_CURRENCY_MAP[(run as any).country] || undefined)}</span></div>
              </div>
            ) : null
          })()}

          <Input label="Payment Reference Number *" value={authorizeForm.paymentReference} onChange={e => setAuthorizeForm(prev => ({ ...prev, paymentReference: e.target.value }))} placeholder="e.g. PAY-2026-04-001" />
          <Input label="Authorization Code (optional)" value={authorizeForm.confirmCode} onChange={e => setAuthorizeForm(prev => ({ ...prev, confirmCode: e.target.value }))} placeholder="Enter authorization code if required" />

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
            <p className="font-medium">By authorizing this payment:</p>
            <p className="mt-1">1. The payroll run will move to "Processing" status</p>
            <p>2. Payment files will be submitted for disbursement</p>
            <p>3. The status will automatically update to "Paid" upon completion</p>
            <p>4. This action will be logged in the audit trail</p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowAuthorizeModal(null)}>Cancel</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => showAuthorizeModal && authorizePayment(showAuthorizeModal)} disabled={saving || !authorizeForm.paymentReference.trim()}>
              <DollarSign size={14} /> {saving ? 'Processing...' : 'Authorize Payment'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirmation Modal for destructive actions (reject/cancel) */}
      <Modal open={!!confirmAction?.show} onClose={() => setConfirmAction(null)} title="Confirm Action">
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
            <AlertTriangle size={16} className="text-red-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-800">Are you sure?</p>
              <p className="text-xs text-red-700 mt-1">{confirmAction?.label}</p>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setConfirmAction(null)}>{tc('cancel')}</Button>
            <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={executeConfirmAction}>
              <XCircle size={14} /> Confirm
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
