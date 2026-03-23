'use client'

import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { Header } from '@/components/layout/header'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/ui/stat-card'
import { Select, Textarea } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { PageSkeleton } from '@/components/ui/page-skeleton'
import {
  BookOpen, DollarSign, Search, CheckCircle, AlertTriangle, ArrowUpDown,
  Hash, Lock, Unlock, Clock, ShieldCheck, ListChecks, RotateCcw,
  Plus, FileText, BarChart3, Download, Trash2, Zap, CreditCard, Receipt, Banknote,
} from 'lucide-react'
import { useTempo, useOrgCurrency } from '@/lib/store'
import { formatCurrency } from '@/lib/utils/format-currency'
import { exportToCSV } from '@/lib/export-import'
import {
  type JournalEntry,
  type JournalEntryLine,
  type ChartOfAccountsEntry,
  validateJournalEntry,
  generateEntryNumber,
  generateTrialBalance,
  generateIncomeStatement,
  generateBalanceSheet,
  convertLegacyEntry,
  STANDARD_CHART_OF_ACCOUNTS,
} from '@/lib/services/accounting-engine'

// ---------------------------------------------------------------------------
// Legacy Types (kept for period close)
// ---------------------------------------------------------------------------

interface LegacyJournalLine {
  account_code: string
  account_name: string
  cost_center?: string
  department_id?: string
  debit_cents: number
  credit_cents: number
  description: string
}

interface LegacyJournalEntry {
  id: string
  type: 'payroll' | 'expense_reimbursement' | 'manual' | 'invoicing' | 'billing'
  date: string
  description: string
  reference: string
  lines: LegacyJournalLine[]
  totalDebitCents: number
  totalCreditCents: number
  currency: string
  status: 'draft' | 'posted' | 'reversed'
  metadata?: Record<string, unknown>
}

interface PeriodState {
  id: string
  label: string
  startDate: string
  endDate: string
  status: 'open' | 'closing' | 'closed' | 'locked'
  closedBy: string | null
  closedAt: string | null
  checklist: {
    accruals_posted: boolean
    reconciliations_complete: boolean
    ic_eliminations_done: boolean
    trial_balance_balanced: boolean
    no_unposted_batches: boolean
    no_unapproved_jes: boolean
  }
}

interface PeriodCloseHistory {
  id: string
  periodId: string
  periodLabel: string
  action: 'close' | 'lock' | 'reopen'
  performedBy: string
  performedAt: string
  notes: string
}

// ---------------------------------------------------------------------------
// Demo Data Fallback
// ---------------------------------------------------------------------------

const DEMO_JOURNAL_ENTRIES: LegacyJournalEntry[] = [
  {
    id: 'je-001',
    type: 'payroll',
    date: '2026-03-15',
    description: 'Payroll journal entry for period 2026-03-01 to 2026-03-15',
    reference: 'PAY-PR-2026-03-A',
    lines: [
      { account_code: '5100', account_name: 'Salaries & Wages Expense', cost_center: 'Engineering', debit_cents: 2850000, credit_cents: 0, description: 'Payroll expense: Engineering (12 employees)' },
      { account_code: '5100', account_name: 'Salaries & Wages Expense', cost_center: 'Sales', debit_cents: 1420000, credit_cents: 0, description: 'Payroll expense: Sales (8 employees)' },
      { account_code: '5100', account_name: 'Salaries & Wages Expense', cost_center: 'Operations', debit_cents: 980000, credit_cents: 0, description: 'Payroll expense: Operations (5 employees)' },
      { account_code: '5200', account_name: 'Payroll Tax Expense', debit_cents: 394500, credit_cents: 0, description: 'Payroll tax expense' },
      { account_code: '2200', account_name: 'Salaries & Wages Payable', debit_cents: 0, credit_cents: 3937500, description: 'Net salaries payable' },
      { account_code: '2300', account_name: 'Tax Withholding Payable', debit_cents: 0, credit_cents: 1312500, description: 'Tax withholding payable' },
      { account_code: '2400', account_name: 'Benefit Deductions Payable', debit_cents: 0, credit_cents: 394500, description: 'Benefit deductions payable' },
    ],
    totalDebitCents: 5644500,
    totalCreditCents: 5644500,
    currency: 'USD',
    status: 'posted',
  },
  {
    id: 'je-002',
    type: 'payroll',
    date: '2026-03-01',
    description: 'Payroll journal entry for period 2026-02-16 to 2026-02-28',
    reference: 'PAY-PR-2026-02-B',
    lines: [
      { account_code: '5100', account_name: 'Salaries & Wages Expense', cost_center: 'Engineering', debit_cents: 2850000, credit_cents: 0, description: 'Payroll expense: Engineering (12 employees)' },
      { account_code: '5100', account_name: 'Salaries & Wages Expense', cost_center: 'Sales', debit_cents: 1420000, credit_cents: 0, description: 'Payroll expense: Sales (8 employees)' },
      { account_code: '5200', account_name: 'Payroll Tax Expense', debit_cents: 320250, credit_cents: 0, description: 'Payroll tax expense' },
      { account_code: '2200', account_name: 'Salaries & Wages Payable', debit_cents: 0, credit_cents: 3217500, description: 'Net salaries payable' },
      { account_code: '2300', account_name: 'Tax Withholding Payable', debit_cents: 0, credit_cents: 1052500, description: 'Tax withholding payable' },
      { account_code: '2400', account_name: 'Benefit Deductions Payable', debit_cents: 0, credit_cents: 320250, description: 'Benefit deductions payable' },
    ],
    totalDebitCents: 4590250,
    totalCreditCents: 4590250,
    currency: 'USD',
    status: 'posted',
  },
  {
    id: 'je-003',
    type: 'expense_reimbursement',
    date: '2026-03-12',
    description: 'Expense reimbursement for employee EMP-042 -- Report #ER-2026-087',
    reference: 'EXP-ER-2026-087',
    lines: [
      { account_code: '6200', account_name: 'Travel Expenses', cost_center: 'Sales', debit_cents: 245000, credit_cents: 0, description: 'Expense reimbursement: travel' },
      { account_code: '6210', account_name: 'Meals & Entertainment', cost_center: 'Sales', debit_cents: 87500, credit_cents: 0, description: 'Expense reimbursement: meals' },
      { account_code: '6230', account_name: 'Lodging', cost_center: 'Sales', debit_cents: 185000, credit_cents: 0, description: 'Expense reimbursement: lodging' },
      { account_code: '2100', account_name: 'Accounts Payable - Employee Reimbursements', debit_cents: 0, credit_cents: 517500, description: 'Employee reimbursement payable' },
    ],
    totalDebitCents: 517500,
    totalCreditCents: 517500,
    currency: 'USD',
    status: 'posted',
  },
  {
    id: 'je-004',
    type: 'expense_reimbursement',
    date: '2026-03-18',
    description: 'Expense reimbursement for employee EMP-015 -- Report #ER-2026-091',
    reference: 'EXP-ER-2026-091',
    lines: [
      { account_code: '6300', account_name: 'Office Supplies', cost_center: 'Operations', debit_cents: 45000, credit_cents: 0, description: 'Expense reimbursement: supplies' },
      { account_code: '6410', account_name: 'Software & Subscriptions', cost_center: 'Engineering', debit_cents: 129900, credit_cents: 0, description: 'Expense reimbursement: software' },
      { account_code: '2100', account_name: 'Accounts Payable - Employee Reimbursements', debit_cents: 0, credit_cents: 174900, description: 'Employee reimbursement payable' },
    ],
    totalDebitCents: 174900,
    totalCreditCents: 174900,
    currency: 'USD',
    status: 'draft',
  },
  {
    id: 'je-005',
    type: 'manual',
    date: '2026-03-10',
    description: 'Month-end accrual for office rent -- March 2026',
    reference: 'MAN-2026-03-001',
    lines: [
      { account_code: '6100', account_name: 'Rent Expense', debit_cents: 850000, credit_cents: 0, description: 'Office rent accrual' },
      { account_code: '2500', account_name: 'Accrued Liabilities', debit_cents: 0, credit_cents: 850000, description: 'Rent payable accrual' },
    ],
    totalDebitCents: 850000,
    totalCreditCents: 850000,
    currency: 'USD',
    status: 'posted',
  },
  {
    id: 'je-006',
    type: 'manual',
    date: '2026-02-28',
    description: 'Depreciation expense -- February 2026',
    reference: 'MAN-2026-02-DEP',
    lines: [
      { account_code: '6700', account_name: 'Depreciation Expense', debit_cents: 125000, credit_cents: 0, description: 'Monthly depreciation' },
      { account_code: '1500', account_name: 'Accumulated Depreciation', debit_cents: 0, credit_cents: 125000, description: 'Contra asset - accumulated depreciation' },
    ],
    totalDebitCents: 125000,
    totalCreditCents: 125000,
    currency: 'USD',
    status: 'posted',
  },
  {
    id: 'je-007',
    type: 'expense_reimbursement',
    date: '2026-02-20',
    description: 'Expense reimbursement for employee EMP-008 -- Report #ER-2026-074',
    reference: 'EXP-ER-2026-074',
    lines: [
      { account_code: '6500', account_name: 'Professional Development', cost_center: 'Engineering', debit_cents: 350000, credit_cents: 0, description: 'Conference attendance' },
      { account_code: '6200', account_name: 'Travel Expenses', cost_center: 'Engineering', debit_cents: 180000, credit_cents: 0, description: 'Conference travel' },
      { account_code: '2100', account_name: 'Accounts Payable - Employee Reimbursements', debit_cents: 0, credit_cents: 530000, description: 'Employee reimbursement payable' },
    ],
    totalDebitCents: 530000,
    totalCreditCents: 530000,
    currency: 'USD',
    status: 'posted',
  },
  {
    id: 'je-008',
    type: 'payroll',
    date: '2026-02-15',
    description: 'Payroll journal entry for period 2026-02-01 to 2026-02-15',
    reference: 'PAY-PR-2026-02-A',
    lines: [
      { account_code: '5100', account_name: 'Salaries & Wages Expense', cost_center: 'Engineering', debit_cents: 2850000, credit_cents: 0, description: 'Payroll expense: Engineering' },
      { account_code: '5100', account_name: 'Salaries & Wages Expense', cost_center: 'Sales', debit_cents: 1420000, credit_cents: 0, description: 'Payroll expense: Sales' },
      { account_code: '5100', account_name: 'Salaries & Wages Expense', cost_center: 'Operations', debit_cents: 980000, credit_cents: 0, description: 'Payroll expense: Operations' },
      { account_code: '5200', account_name: 'Payroll Tax Expense', debit_cents: 394500, credit_cents: 0, description: 'Payroll tax expense' },
      { account_code: '2200', account_name: 'Salaries & Wages Payable', debit_cents: 0, credit_cents: 3937500, description: 'Net salaries payable' },
      { account_code: '2300', account_name: 'Tax Withholding Payable', debit_cents: 0, credit_cents: 1312500, description: 'Tax withholding payable' },
      { account_code: '2400', account_name: 'Benefit Deductions Payable', debit_cents: 0, credit_cents: 394500, description: 'Benefit deductions payable' },
    ],
    totalDebitCents: 5644500,
    totalCreditCents: 5644500,
    currency: 'USD',
    status: 'posted',
  },
  // Invoice payment demo entry
  {
    id: 'je-009',
    type: 'invoicing',
    date: '2026-03-20',
    description: 'Payment received for invoice INV-2026-0042',
    reference: 'INV-2026-0042',
    lines: [
      { account_code: '1000', account_name: 'Cash and Bank', debit_cents: 1250000, credit_cents: 0, description: 'Payment received' },
      { account_code: '1200', account_name: 'Accounts Receivable', debit_cents: 0, credit_cents: 1250000, description: 'AR cleared' },
    ],
    totalDebitCents: 1250000,
    totalCreditCents: 1250000,
    currency: 'USD',
    status: 'posted',
  },
  // Bill payment demo entry
  {
    id: 'je-010',
    type: 'billing',
    date: '2026-03-22',
    description: 'Bill payment to Cloud Hosting Inc.',
    reference: 'BILL-2026-015',
    lines: [
      { account_code: '2000', account_name: 'Accounts Payable', debit_cents: 450000, credit_cents: 0, description: 'AP settled' },
      { account_code: '1000', account_name: 'Cash and Bank', debit_cents: 0, credit_cents: 450000, description: 'Payment made' },
    ],
    totalDebitCents: 450000,
    totalCreditCents: 450000,
    currency: 'USD',
    status: 'posted',
  },
]

const INITIAL_PERIODS: PeriodState[] = [
  {
    id: 'p-2026-03', label: 'March 2026', startDate: '2026-03-01', endDate: '2026-03-31',
    status: 'open', closedBy: null, closedAt: null,
    checklist: { accruals_posted: false, reconciliations_complete: false, ic_eliminations_done: false, trial_balance_balanced: false, no_unposted_batches: false, no_unapproved_jes: false },
  },
  {
    id: 'p-2026-02', label: 'February 2026', startDate: '2026-02-01', endDate: '2026-02-28',
    status: 'closed', closedBy: 'Sarah Kim (Finance)', closedAt: '2026-03-05T14:30:00Z',
    checklist: { accruals_posted: true, reconciliations_complete: true, ic_eliminations_done: true, trial_balance_balanced: true, no_unposted_batches: true, no_unapproved_jes: true },
  },
  {
    id: 'p-2026-01', label: 'January 2026', startDate: '2026-01-01', endDate: '2026-01-31',
    status: 'locked', closedBy: 'Sarah Kim (Finance)', closedAt: '2026-02-04T10:15:00Z',
    checklist: { accruals_posted: true, reconciliations_complete: true, ic_eliminations_done: true, trial_balance_balanced: true, no_unposted_batches: true, no_unapproved_jes: true },
  },
  {
    id: 'p-2025-12', label: 'December 2025', startDate: '2025-12-01', endDate: '2025-12-31',
    status: 'locked', closedBy: 'David Chen (CFO)', closedAt: '2026-01-08T16:00:00Z',
    checklist: { accruals_posted: true, reconciliations_complete: true, ic_eliminations_done: true, trial_balance_balanced: true, no_unposted_batches: true, no_unapproved_jes: true },
  },
]

const INITIAL_CLOSE_HISTORY: PeriodCloseHistory[] = [
  { id: 'h-1', periodId: 'p-2026-02', periodLabel: 'February 2026', action: 'close', performedBy: 'Sarah Kim', performedAt: '2026-03-05T14:30:00Z', notes: 'All reconciliations complete. Trial balance balanced.' },
  { id: 'h-2', periodId: 'p-2026-01', periodLabel: 'January 2026', action: 'close', performedBy: 'Sarah Kim', performedAt: '2026-02-04T10:15:00Z', notes: '' },
  { id: 'h-3', periodId: 'p-2026-01', periodLabel: 'January 2026', action: 'lock', performedBy: 'David Chen', performedAt: '2026-02-15T09:00:00Z', notes: 'Locked after external audit review.' },
  { id: 'h-4', periodId: 'p-2025-12', periodLabel: 'December 2025', action: 'close', performedBy: 'Sarah Kim', performedAt: '2026-01-06T11:00:00Z', notes: 'Year-end close.' },
  { id: 'h-5', periodId: 'p-2025-12', periodLabel: 'December 2025', action: 'lock', performedBy: 'David Chen', performedAt: '2026-01-08T16:00:00Z', notes: 'Locked for FY2025 annual filing.' },
]

type TabKey = 'entries' | 'chart-of-accounts' | 'financial-statements' | 'auto-je-log' | 'period-close'
type FinStmtView = 'income-statement' | 'balance-sheet' | 'trial-balance'

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function GeneralLedgerPage() {
  const defaultCurrency = useOrgCurrency()
  const { ensureModulesLoaded, addToast, glJournalEntries: storeJEs, glChartOfAccounts: storeCOA,
    addGLJournalEntry, setGLJournalEntries, setGLChartOfAccounts } = useTempo()

  const [pageLoading, setPageLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabKey>('entries')
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null)

  // Period close state
  const [periods, setPeriods] = useState<PeriodState[]>(INITIAL_PERIODS)
  const [closeHistory, setCloseHistory] = useState<PeriodCloseHistory[]>(INITIAL_CLOSE_HISTORY)
  const [showReopenModal, setShowReopenModal] = useState(false)
  const [reopenTarget, setReopenTarget] = useState<string | null>(null)
  const [reopenReason, setReopenReason] = useState('')

  // Create JE modal
  const [showCreateJE, setShowCreateJE] = useState(false)
  const [newJEDescription, setNewJEDescription] = useState('')
  const [newJEDate, setNewJEDate] = useState(new Date().toISOString().split('T')[0])
  const [newJEReference, setNewJEReference] = useState('')
  const [newJELines, setNewJELines] = useState<{ accountCode: string; accountName: string; debit: string; credit: string; description: string }[]>([
    { accountCode: '', accountName: '', debit: '', credit: '', description: '' },
    { accountCode: '', accountName: '', debit: '', credit: '', description: '' },
  ])

  // Financial statement state
  const [finStmtView, setFinStmtView] = useState<FinStmtView>('trial-balance')
  const [plPeriodType, setPlPeriodType] = useState<string>('this-month')
  const [plCustomStart, setPlCustomStart] = useState('2026-01-01')
  const [plCustomEnd, setPlCustomEnd] = useState('2026-03-31')
  const [bsAsOfDate, setBsAsOfDate] = useState(new Date().toISOString().split('T')[0])

  // Chart of accounts state
  const [showAddAccount, setShowAddAccount] = useState(false)
  const [newAcctCode, setNewAcctCode] = useState('')
  const [newAcctName, setNewAcctName] = useState('')
  const [newAcctType, setNewAcctType] = useState<string>('asset')

  // Convert demo data to accounting engine format and merge with store JEs
  const allJournalEntries: JournalEntry[] = useMemo(() => {
    const legacy = DEMO_JOURNAL_ENTRIES.map(convertLegacyEntry)
    const store = (storeJEs || []) as JournalEntry[]
    return [...legacy, ...store]
  }, [storeJEs])

  // Chart of Accounts -- merge standard with any added accounts
  const chartOfAccounts: ChartOfAccountsEntry[] = useMemo(() => {
    const base = STANDARD_CHART_OF_ACCOUNTS
    const custom = (storeCOA || []) as ChartOfAccountsEntry[]
    const allCodes = new Set(base.map(a => a.code))
    return [...base, ...custom.filter(a => !allCodes.has(a.code))].sort((a, b) => a.code.localeCompare(b.code))
  }, [storeCOA])

  useEffect(() => { ensureModulesLoaded?.(['invoices'])?.then?.(() => setPageLoading(false))?.catch?.(() => setPageLoading(false)) }, [])
  useEffect(() => { const t = setTimeout(() => setPageLoading(false), 2000); return () => clearTimeout(t) }, [])

  // ---- Filtered Entries ----
  const filteredEntries = useMemo(() => {
    return allJournalEntries.filter(je => {
      const matchesSearch = !searchQuery ||
        (je.reference || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        je.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        je.entryNumber.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesType = typeFilter === 'all' || je.sourceModule === typeFilter
      const matchesStatus = statusFilter === 'all' || je.status === statusFilter
      const matchesDateFrom = !dateFrom || je.date >= dateFrom
      const matchesDateTo = !dateTo || je.date <= dateTo
      return matchesSearch && matchesType && matchesStatus && matchesDateFrom && matchesDateTo
    })
  }, [allJournalEntries, searchQuery, typeFilter, statusFilter, dateFrom, dateTo])

  // ---- Stats ----
  const totalEntries = filteredEntries.length
  const totalDebits = filteredEntries.reduce((sum, je) => sum + je.lines.reduce((s, l) => s + l.debit, 0), 0)
  const totalCredits = filteredEntries.reduce((sum, je) => sum + je.lines.reduce((s, l) => s + l.credit, 0), 0)
  const balanceCheck = totalDebits - totalCredits

  // ---- Auto-JE entries (system-generated) ----
  const autoJEEntries = useMemo(() => {
    return allJournalEntries.filter(je => je.sourceModule !== 'manual')
  }, [allJournalEntries])

  // ---- P&L Period computation ----
  const plPeriod = useMemo(() => {
    const now = new Date()
    switch (plPeriodType) {
      case 'this-month': return { start: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`, end: now.toISOString().split('T')[0] }
      case 'this-quarter': {
        const q = Math.floor(now.getMonth() / 3)
        return { start: `${now.getFullYear()}-${String(q * 3 + 1).padStart(2, '0')}-01`, end: now.toISOString().split('T')[0] }
      }
      case 'this-year': return { start: `${now.getFullYear()}-01-01`, end: now.toISOString().split('T')[0] }
      case 'custom': return { start: plCustomStart, end: plCustomEnd }
      default: return { start: `${now.getFullYear()}-01-01`, end: now.toISOString().split('T')[0] }
    }
  }, [plPeriodType, plCustomStart, plCustomEnd])

  // ---- New JE validation ----
  const newJEValidation = useMemo(() => {
    const lines: JournalEntryLine[] = newJELines.map((l, i) => ({
      id: String(i),
      entryId: '',
      accountCode: l.accountCode,
      accountName: l.accountName,
      debit: Math.round(parseFloat(l.debit || '0') * 100),
      credit: Math.round(parseFloat(l.credit || '0') * 100),
      description: l.description,
      currency: defaultCurrency,
    }))
    return validateJournalEntry({ lines })
  }, [newJELines, defaultCurrency])

  const newJETotalDebits = newJELines.reduce((s, l) => s + (parseFloat(l.debit || '0') * 100), 0)
  const newJETotalCredits = newJELines.reduce((s, l) => s + (parseFloat(l.credit || '0') * 100), 0)

  // ---- Create JE handler ----
  const handleCreateJE = useCallback(() => {
    if (!newJEValidation.valid) {
      addToast(newJEValidation.errors[0], 'error')
      return
    }
    const entry: JournalEntry = {
      id: crypto.randomUUID(),
      orgId: '',
      entryNumber: generateEntryNumber('JE-MAN'),
      date: newJEDate,
      description: newJEDescription,
      reference: newJEReference || undefined,
      sourceModule: 'manual',
      status: 'draft',
      lines: newJELines.map(l => ({
        id: crypto.randomUUID(),
        entryId: '',
        accountCode: l.accountCode,
        accountName: l.accountName,
        debit: Math.round(parseFloat(l.debit || '0') * 100),
        credit: Math.round(parseFloat(l.credit || '0') * 100),
        description: l.description,
        currency: defaultCurrency,
      })),
      createdBy: 'user',
      createdAt: new Date().toISOString(),
    }
    addGLJournalEntry?.(entry)
    addToast('Journal entry created', 'success')
    setShowCreateJE(false)
    setNewJEDescription('')
    setNewJEReference('')
    setNewJELines([
      { accountCode: '', accountName: '', debit: '', credit: '', description: '' },
      { accountCode: '', accountName: '', debit: '', credit: '', description: '' },
    ])
  }, [newJEValidation, newJEDate, newJEDescription, newJEReference, newJELines, defaultCurrency, addGLJournalEntry, addToast])

  // ---- Post draft JE handler ----
  const handlePostJE = useCallback((entryId: string) => {
    setGLJournalEntries?.((prev: any[]) => prev.map((e: any) => e.id === entryId ? { ...e, status: 'posted', postedAt: new Date().toISOString() } : e))
    addToast('Journal entry posted', 'success')
  }, [setGLJournalEntries, addToast])

  // ---- Reverse JE handler ----
  const handleReverseJE = useCallback((entry: JournalEntry) => {
    const reversing: JournalEntry = {
      id: crypto.randomUUID(),
      orgId: entry.orgId,
      entryNumber: generateEntryNumber('JE-REV'),
      date: new Date().toISOString().split('T')[0],
      description: `Reversal of ${entry.entryNumber}: ${entry.description}`,
      reference: entry.reference,
      sourceModule: entry.sourceModule,
      status: 'posted',
      lines: entry.lines.map(l => ({
        ...l,
        id: crypto.randomUUID(),
        debit: l.credit,
        credit: l.debit,
      })),
      createdBy: 'user',
      createdAt: new Date().toISOString(),
      postedAt: new Date().toISOString(),
      reversalOfId: entry.id,
    }
    addGLJournalEntry?.(reversing)
    // Mark original as reversed
    setGLJournalEntries?.((prev: any[]) => prev.map((e: any) => e.id === entry.id ? { ...e, status: 'reversed', reversedAt: new Date().toISOString() } : e))
    addToast('Journal entry reversed', 'success')
  }, [addGLJournalEntry, setGLJournalEntries, addToast])

  // ---- Load Standard Chart of Accounts ----
  const handleLoadStandardCOA = useCallback(() => {
    setGLChartOfAccounts?.(() => [...STANDARD_CHART_OF_ACCOUNTS])
    addToast('Standard chart of accounts loaded', 'success')
  }, [setGLChartOfAccounts, addToast])

  // ---- Add custom account ----
  const handleAddAccount = useCallback(() => {
    if (!newAcctCode || !newAcctName) {
      addToast('Account code and name are required', 'error')
      return
    }
    const existing = chartOfAccounts.find(a => a.code === newAcctCode)
    if (existing) {
      addToast('Account code already exists', 'error')
      return
    }
    const categoryMap: Record<string, string> = {
      asset: newAcctCode < '1500' ? 'current_asset' : 'non_current_asset',
      liability: newAcctCode < '2500' ? 'current_liability' : 'non_current_liability',
      equity: 'equity',
      revenue: 'operating_revenue',
      expense: 'operating_expense',
    }
    setGLChartOfAccounts?.((prev: any[]) => [...prev, { code: newAcctCode, name: newAcctName, type: newAcctType, category: categoryMap[newAcctType] || 'other' }])
    addToast('Account added', 'success')
    setShowAddAccount(false)
    setNewAcctCode('')
    setNewAcctName('')
  }, [newAcctCode, newAcctName, newAcctType, chartOfAccounts, setGLChartOfAccounts, addToast])

  // ---- Period Close Helpers ----

  function runPreCloseValidation(period: PeriodState): { passed: boolean; errors: string[] } {
    const errors: string[] = []
    const periodEntries = allJournalEntries.filter(je => je.date >= period.startDate && je.date <= period.endDate)
    const draftCount = periodEntries.filter(je => je.status === 'draft').length
    if (draftCount > 0) errors.push(`${draftCount} unposted journal entries in this period`)
    const debits = periodEntries.reduce((s, je) => s + je.lines.reduce((ss, l) => ss + l.debit, 0), 0)
    const credits = periodEntries.reduce((s, je) => s + je.lines.reduce((ss, l) => ss + l.credit, 0), 0)
    if (debits !== credits) errors.push(`Debits (${formatCurrency(debits, defaultCurrency, { cents: true })}) do not equal credits (${formatCurrency(credits, defaultCurrency, { cents: true })})`)
    if (!period.checklist.accruals_posted) errors.push('Accruals have not been posted')
    if (!period.checklist.reconciliations_complete) errors.push('Reconciliations are incomplete')
    if (!period.checklist.trial_balance_balanced) errors.push('Trial balance is not marked as balanced')
    return { passed: errors.length === 0, errors }
  }

  function toggleChecklistItem(periodId: string, item: keyof PeriodState['checklist']) {
    setPeriods(prev => prev.map(p => {
      if (p.id !== periodId || p.status === 'locked') return p
      return { ...p, checklist: { ...p.checklist, [item]: !p.checklist[item] } }
    }))
  }

  function closePeriod(periodId: string) {
    const period = periods.find(p => p.id === periodId)
    if (!period) return
    const validation = runPreCloseValidation(period)
    if (!validation.passed) {
      addToast(`Cannot close: ${validation.errors[0]}`, 'error')
      return
    }
    const allChecked = Object.values(period.checklist).every(Boolean)
    if (!allChecked) {
      addToast('All checklist items must be completed before closing', 'error')
      return
    }
    const nowStr = new Date().toISOString()
    setPeriods(prev => prev.map(p =>
      p.id === periodId ? { ...p, status: 'closed', closedBy: 'Current User', closedAt: nowStr } : p
    ))
    setCloseHistory(prev => [{
      id: `h-${Date.now()}`,
      periodId,
      periodLabel: period.label,
      action: 'close',
      performedBy: 'Current User',
      performedAt: nowStr,
      notes: 'Period closed after all validations passed.',
    }, ...prev])
    addToast(`${period.label} closed successfully`, 'success')
  }

  function lockPeriod(periodId: string) {
    const period = periods.find(p => p.id === periodId)
    if (!period || period.status !== 'closed') return
    const nowStr = new Date().toISOString()
    setPeriods(prev => prev.map(p =>
      p.id === periodId ? { ...p, status: 'locked' } : p
    ))
    setCloseHistory(prev => [{
      id: `h-${Date.now()}`,
      periodId,
      periodLabel: period.label,
      action: 'lock',
      performedBy: 'Current User',
      performedAt: nowStr,
      notes: 'Period locked to prevent modifications.',
    }, ...prev])
    addToast(`${period.label} locked`, 'success')
  }

  function openReopenModal(periodId: string) {
    setReopenTarget(periodId)
    setReopenReason('')
    setShowReopenModal(true)
  }

  function confirmReopen() {
    if (!reopenTarget) return
    const period = periods.find(p => p.id === reopenTarget)
    if (!period) return
    if (!reopenReason.trim()) {
      addToast('A reason is required to reopen a period', 'error')
      return
    }
    const nowStr = new Date().toISOString()
    setPeriods(prev => prev.map(p =>
      p.id === reopenTarget ? { ...p, status: 'open', closedBy: null, closedAt: null } : p
    ))
    setCloseHistory(prev => [{
      id: `h-${Date.now()}`,
      periodId: reopenTarget,
      periodLabel: period.label,
      action: 'reopen',
      performedBy: 'Current User',
      performedAt: nowStr,
      notes: reopenReason,
    }, ...prev])
    addToast(`${period.label} reopened`, 'info')
    setShowReopenModal(false)
  }

  // ---- Badge helpers ----

  function getSourceBadge(sourceModule: string) {
    switch (sourceModule) {
      case 'payroll': return <Badge variant="success">Payroll</Badge>
      case 'invoicing': return <Badge variant="info">Invoicing</Badge>
      case 'expenses': return <Badge variant="warning">Expenses</Badge>
      case 'billing': return <Badge variant="default">Billing</Badge>
      case 'manual': return <Badge variant="default">Manual</Badge>
      case 'banking': return <Badge variant="info">Banking</Badge>
      case 'depreciation': return <Badge variant="default">Depreciation</Badge>
      default: return <Badge variant="default">{sourceModule}</Badge>
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'posted': return <Badge variant="success">Posted</Badge>
      case 'draft': return <Badge variant="default">Draft</Badge>
      case 'reversed': return <Badge variant="error">Reversed</Badge>
      default: return <Badge variant="default">{status}</Badge>
    }
  }

  function getAccountTypeBadge(type: string) {
    switch (type) {
      case 'asset': return <Badge variant="info">Asset</Badge>
      case 'liability': return <Badge variant="warning">Liability</Badge>
      case 'equity': return <Badge variant="success">Equity</Badge>
      case 'revenue': return <Badge variant="info">Revenue</Badge>
      case 'expense': return <Badge variant="error">Expense</Badge>
      default: return <Badge variant="default">{type}</Badge>
    }
  }

  function getPeriodStatusBadge(status: string) {
    switch (status) {
      case 'open': return <Badge variant="info">Open</Badge>
      case 'closing': return <Badge variant="warning">Closing</Badge>
      case 'closed': return <Badge variant="success">Closed</Badge>
      case 'locked': return <Badge variant="error">Locked</Badge>
      default: return <Badge variant="default">{status}</Badge>
    }
  }

  if (pageLoading) {
    return (
      <>
        <Header title="General Ledger" subtitle="Double-entry accounting, journal entries, and financial statements" />
        <div className="p-6"><PageSkeleton /></div>
      </>
    )
  }

  return (
    <>
      <Header
        title="General Ledger"
        subtitle="Double-entry accounting, journal entries, and financial statements"
        actions={
          <div className="flex items-center gap-2">
            <Button size="sm" variant="primary" onClick={() => setShowCreateJE(true)}>
              <Plus size={14} /> New Journal Entry
            </Button>
            <Button size="sm" variant="secondary" onClick={() => exportToCSV(
              filteredEntries.map(je => ({
                date: je.date,
                entry_number: je.entryNumber,
                reference: je.reference || '',
                source: je.sourceModule,
                description: je.description,
                total_debit: je.lines.reduce((s, l) => s + l.debit, 0) / 100,
                total_credit: je.lines.reduce((s, l) => s + l.credit, 0) / 100,
                status: je.status,
              })),
              [
                { header: 'Date', accessor: (r: any) => r.date },
                { header: 'Entry #', accessor: (r: any) => r.entry_number },
                { header: 'Reference', accessor: (r: any) => r.reference },
                { header: 'Source', accessor: (r: any) => r.source },
                { header: 'Description', accessor: (r: any) => r.description },
                { header: 'Total Debit', accessor: (r: any) => r.total_debit },
                { header: 'Total Credit', accessor: (r: any) => r.total_credit },
                { header: 'Status', accessor: (r: any) => r.status },
              ],
              'general-ledger-export'
            )}>
              <Download size={14} /> Export
            </Button>
          </div>
        }
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Entries" value={totalEntries} icon={<Hash size={20} />} />
        <StatCard label="Total Debits" value={formatCurrency(totalDebits, defaultCurrency, { cents: true })} icon={<DollarSign size={20} />} />
        <StatCard label="Total Credits" value={formatCurrency(totalCredits, defaultCurrency, { cents: true })} icon={<DollarSign size={20} />} />
        <StatCard
          label="Balance Check"
          value={formatCurrency(balanceCheck, defaultCurrency, { cents: true })}
          change={balanceCheck === 0 ? 'Balanced' : 'Out of balance'}
          changeType={balanceCheck === 0 ? 'positive' : 'negative'}
          icon={balanceCheck === 0 ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
        />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-4 border-b border-divider overflow-x-auto">
        {([
          { key: 'entries' as const, label: 'Journal Entries', icon: <BookOpen size={14} /> },
          { key: 'chart-of-accounts' as const, label: 'Chart of Accounts', icon: <ListChecks size={14} /> },
          { key: 'financial-statements' as const, label: 'Financial Statements', icon: <BarChart3 size={14} /> },
          { key: 'auto-je-log' as const, label: 'Auto-JE Log', icon: <Zap size={14} /> },
          { key: 'period-close' as const, label: 'Period Close', icon: <Lock size={14} /> },
        ]).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.key
                ? 'border-accent text-accent'
                : 'border-transparent text-t3 hover:text-t1'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters (for entries tab) */}
      {activeTab === 'entries' && (
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-t3" />
            <input
              type="text"
              placeholder="Search by reference, entry # or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-border bg-surface text-t1 placeholder:text-t3 focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
          </div>
          <Select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Sources' },
              { value: 'payroll', label: 'Payroll' },
              { value: 'expenses', label: 'Expenses' },
              { value: 'invoicing', label: 'Invoicing' },
              { value: 'billing', label: 'Billing' },
              { value: 'manual', label: 'Manual' },
            ]}
          />
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Statuses' },
              { value: 'draft', label: 'Draft' },
              { value: 'posted', label: 'Posted' },
              { value: 'reversed', label: 'Reversed' },
            ]}
          />
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="px-3 py-2 text-sm rounded-lg border border-border bg-surface text-t1 focus:outline-none focus:ring-2 focus:ring-accent/30" />
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="px-3 py-2 text-sm rounded-lg border border-border bg-surface text-t1 focus:outline-none focus:ring-2 focus:ring-accent/30" />
        </div>
      )}

      {/* ================================================================== */}
      {/* TAB 1: Journal Entries                                             */}
      {/* ================================================================== */}
      {activeTab === 'entries' && (
        <Card padding="none">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>All Journal Entries</CardTitle>
              <span className="text-xs text-t3">{filteredEntries.length} entries</span>
            </div>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-divider bg-canvas">
                  <th className="tempo-th text-left px-6 py-3">Date</th>
                  <th className="tempo-th text-left px-4 py-3">Entry #</th>
                  <th className="tempo-th text-left px-4 py-3">Reference</th>
                  <th className="tempo-th text-center px-4 py-3">Source</th>
                  <th className="tempo-th text-left px-4 py-3">Description</th>
                  <th className="tempo-th text-right px-4 py-3">Total Debit</th>
                  <th className="tempo-th text-right px-4 py-3">Total Credit</th>
                  <th className="tempo-th text-center px-4 py-3">Status</th>
                  <th className="tempo-th text-center px-4 py-3">Lines</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredEntries.length === 0 ? (
                  <tr>
                    <td colSpan={9}>
                      <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="w-12 h-12 rounded-xl bg-canvas flex items-center justify-center mb-3">
                          <BookOpen size={24} className="text-t3" />
                        </div>
                        <p className="text-sm font-medium text-t1 mb-1">No journal entries found</p>
                        <p className="text-xs text-t3">Try adjusting your search or filters</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredEntries.map(je => {
                  const jeDebits = je.lines.reduce((s, l) => s + l.debit, 0)
                  const jeCredits = je.lines.reduce((s, l) => s + l.credit, 0)
                  return (
                    <React.Fragment key={je.id}>
                      <tr
                        className="hover:bg-canvas/50 cursor-pointer"
                        onClick={() => setExpandedEntry(expandedEntry === je.id ? null : je.id)}
                      >
                        <td className="px-6 py-3 text-xs text-t2">{je.date}</td>
                        <td className="px-4 py-3 text-xs font-mono font-medium text-t1">{je.entryNumber}</td>
                        <td className="px-4 py-3 text-xs font-mono text-t3">{je.reference || '--'}</td>
                        <td className="px-4 py-3 text-center">{getSourceBadge(je.sourceModule)}</td>
                        <td className="px-4 py-3 text-xs text-t2 max-w-[280px] truncate">{je.description}</td>
                        <td className="px-4 py-3 text-xs font-semibold text-t1 text-right">{formatCurrency(jeDebits, defaultCurrency, { cents: true })}</td>
                        <td className="px-4 py-3 text-xs font-semibold text-t1 text-right">{formatCurrency(jeCredits, defaultCurrency, { cents: true })}</td>
                        <td className="px-4 py-3 text-center">{getStatusBadge(je.status)}</td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <ArrowUpDown size={12} className="text-t3" />
                            <span className="text-xs text-t3">{je.lines.length}</span>
                          </div>
                        </td>
                      </tr>
                      {expandedEntry === je.id && (
                        <tr key={`${je.id}-lines`}>
                          <td colSpan={9} className="px-6 py-3 bg-canvas/50">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-xs font-medium text-t1">Journal Lines</p>
                              <div className="flex gap-2">
                                {je.status === 'draft' && je.sourceModule === 'manual' && (
                                  <Button size="sm" variant="primary" onClick={(e) => { e.stopPropagation(); handlePostJE(je.id) }}>
                                    <CheckCircle size={12} /> Post
                                  </Button>
                                )}
                                {je.status === 'posted' && (
                                  <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); handleReverseJE(je) }}>
                                    <RotateCcw size={12} /> Reverse
                                  </Button>
                                )}
                              </div>
                            </div>
                            {je.reversalOfId && (
                              <p className="text-xs text-warning mb-2">This is a reversing entry</p>
                            )}
                            <table className="w-full">
                              <thead>
                                <tr className="border-b border-divider">
                                  <th className="text-left text-xs font-medium text-t3 px-3 py-1.5">Account</th>
                                  <th className="text-left text-xs font-medium text-t3 px-3 py-1.5">Description</th>
                                  <th className="text-left text-xs font-medium text-t3 px-3 py-1.5">Cost Center</th>
                                  <th className="text-right text-xs font-medium text-t3 px-3 py-1.5">Debit</th>
                                  <th className="text-right text-xs font-medium text-t3 px-3 py-1.5">Credit</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-divider">
                                {je.lines.map((line, idx) => (
                                  <tr key={idx} className="hover:bg-surface/50">
                                    <td className="px-3 py-1.5 text-xs text-t1">
                                      <span className="font-mono text-t3">{line.accountCode}</span>
                                      <span className="ml-2">{line.accountName}</span>
                                    </td>
                                    <td className="px-3 py-1.5 text-xs text-t2">{line.description || '--'}</td>
                                    <td className="px-3 py-1.5 text-xs text-t3">{line.costCenter || '--'}</td>
                                    <td className="px-3 py-1.5 text-xs font-medium text-right">
                                      {line.debit > 0 ? formatCurrency(line.debit, defaultCurrency, { cents: true }) : '--'}
                                    </td>
                                    <td className="px-3 py-1.5 text-xs font-medium text-right">
                                      {line.credit > 0 ? formatCurrency(line.credit, defaultCurrency, { cents: true }) : '--'}
                                    </td>
                                  </tr>
                                ))}
                                <tr className="border-t-2 border-divider font-semibold">
                                  <td colSpan={3} className="px-3 py-1.5 text-xs text-t1">Total</td>
                                  <td className="px-3 py-1.5 text-xs text-right">{formatCurrency(jeDebits, defaultCurrency, { cents: true })}</td>
                                  <td className="px-3 py-1.5 text-xs text-right">{formatCurrency(jeCredits, defaultCurrency, { cents: true })}</td>
                                </tr>
                              </tbody>
                            </table>
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
      )}

      {/* ================================================================== */}
      {/* TAB 2: Chart of Accounts                                           */}
      {/* ================================================================== */}
      {activeTab === 'chart-of-accounts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-t2">{chartOfAccounts.length} accounts</p>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={handleLoadStandardCOA}>
                <Download size={14} /> Load Standard Chart
              </Button>
              <Button size="sm" variant="primary" onClick={() => setShowAddAccount(true)}>
                <Plus size={14} /> Add Account
              </Button>
            </div>
          </div>
          <Card padding="none">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-divider bg-canvas">
                    <th className="tempo-th text-left px-6 py-3">Code</th>
                    <th className="tempo-th text-left px-4 py-3">Account Name</th>
                    <th className="tempo-th text-center px-4 py-3">Type</th>
                    <th className="tempo-th text-left px-4 py-3">Category</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {chartOfAccounts.map(acct => (
                    <tr key={acct.code} className="hover:bg-canvas/50">
                      <td className="px-6 py-3 text-xs font-mono font-medium text-t1">{acct.code}</td>
                      <td className="px-4 py-3 text-xs text-t2">{acct.name}</td>
                      <td className="px-4 py-3 text-center">{getAccountTypeBadge(acct.type)}</td>
                      <td className="px-4 py-3 text-xs text-t3 capitalize">{acct.category.replace(/_/g, ' ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ================================================================== */}
      {/* TAB 3: Financial Statements                                        */}
      {/* ================================================================== */}
      {activeTab === 'financial-statements' && (
        <div className="space-y-4">
          {/* Sub-nav */}
          <div className="flex items-center gap-1 border-b border-divider">
            {([
              { key: 'trial-balance' as const, label: 'Trial Balance' },
              { key: 'income-statement' as const, label: 'Income Statement (P&L)' },
              { key: 'balance-sheet' as const, label: 'Balance Sheet' },
            ]).map(sub => (
              <button
                key={sub.key}
                onClick={() => setFinStmtView(sub.key)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  finStmtView === sub.key ? 'border-accent text-accent' : 'border-transparent text-t3 hover:text-t1'
                }`}
              >
                {sub.label}
              </button>
            ))}
          </div>

          {/* ---------- Trial Balance ---------- */}
          {finStmtView === 'trial-balance' && (() => {
            const tb = generateTrialBalance(allJournalEntries)
            return (
              <Card padding="none">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CardTitle>Trial Balance</CardTitle>
                      {tb.isBalanced ? (
                        <Badge variant="success">Balanced</Badge>
                      ) : (
                        <Badge variant="error">Out of Balance</Badge>
                      )}
                    </div>
                    <Button size="sm" variant="secondary" onClick={() => exportToCSV(
                      tb.accounts.map(a => ({ code: a.code, name: a.name, debit: a.balance >= 0 ? a.balance / 100 : 0, credit: a.balance < 0 ? Math.abs(a.balance) / 100 : 0 })),
                      [
                        { header: 'Code', accessor: (r: any) => r.code },
                        { header: 'Account', accessor: (r: any) => r.name },
                        { header: 'Debit', accessor: (r: any) => r.debit },
                        { header: 'Credit', accessor: (r: any) => r.credit },
                      ],
                      'trial-balance-export'
                    )}>
                      <Download size={14} /> Export CSV
                    </Button>
                  </div>
                </CardHeader>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-divider bg-canvas">
                        <th className="tempo-th text-left px-6 py-3">Code</th>
                        <th className="tempo-th text-left px-4 py-3">Account</th>
                        <th className="tempo-th text-right px-4 py-3">Debit Balance</th>
                        <th className="tempo-th text-right px-4 py-3">Credit Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {tb.accounts.map(acct => (
                        <tr key={acct.code} className="hover:bg-canvas/50">
                          <td className="px-6 py-3 text-xs font-mono font-medium text-t1">{acct.code}</td>
                          <td className="px-4 py-3 text-xs text-t2">{acct.name}</td>
                          <td className="px-4 py-3 text-xs font-semibold text-t1 text-right">
                            {acct.balance >= 0 ? formatCurrency(acct.balance, defaultCurrency, { cents: true }) : '--'}
                          </td>
                          <td className="px-4 py-3 text-xs font-semibold text-t1 text-right">
                            {acct.balance < 0 ? formatCurrency(Math.abs(acct.balance), defaultCurrency, { cents: true }) : '--'}
                          </td>
                        </tr>
                      ))}
                      <tr className="border-t-2 border-divider bg-canvas font-semibold">
                        <td colSpan={2} className="px-6 py-3 text-xs text-t1">Total</td>
                        <td className="px-4 py-3 text-xs font-semibold text-t1 text-right">
                          {formatCurrency(tb.accounts.filter(a => a.balance >= 0).reduce((s, a) => s + a.balance, 0), defaultCurrency, { cents: true })}
                        </td>
                        <td className="px-4 py-3 text-xs font-semibold text-t1 text-right">
                          {formatCurrency(tb.accounts.filter(a => a.balance < 0).reduce((s, a) => s + Math.abs(a.balance), 0), defaultCurrency, { cents: true })}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Card>
            )
          })()}

          {/* ---------- Income Statement ---------- */}
          {finStmtView === 'income-statement' && (() => {
            const pl = generateIncomeStatement(allJournalEntries, plPeriod)
            return (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Select
                    value={plPeriodType}
                    onChange={(e) => setPlPeriodType(e.target.value)}
                    options={[
                      { value: 'this-month', label: 'This Month' },
                      { value: 'this-quarter', label: 'This Quarter' },
                      { value: 'this-year', label: 'Year to Date' },
                      { value: 'custom', label: 'Custom Range' },
                    ]}
                  />
                  {plPeriodType === 'custom' && (
                    <>
                      <input type="date" value={plCustomStart} onChange={(e) => setPlCustomStart(e.target.value)} className="px-3 py-2 text-sm rounded-lg border border-border bg-surface text-t1" />
                      <span className="text-xs text-t3">to</span>
                      <input type="date" value={plCustomEnd} onChange={(e) => setPlCustomEnd(e.target.value)} className="px-3 py-2 text-sm rounded-lg border border-border bg-surface text-t1" />
                    </>
                  )}
                  <Button size="sm" variant="secondary" onClick={() => exportToCSV(
                    [...pl.revenue.map(r => ({ type: 'Revenue', account: r.account, amount: r.amount / 100 })), ...pl.expenses.map(e => ({ type: 'Expense', account: e.account, amount: e.amount / 100 }))],
                    [
                      { header: 'Type', accessor: (r: any) => r.type },
                      { header: 'Account', accessor: (r: any) => r.account },
                      { header: 'Amount', accessor: (r: any) => r.amount },
                    ],
                    'income-statement-export'
                  )}>
                    <Download size={14} /> Export CSV
                  </Button>
                </div>

                <Card>
                  <h3 className="text-sm font-semibold text-t1 mb-1">Income Statement</h3>
                  <p className="text-xs text-t3 mb-4">{plPeriod.start} to {plPeriod.end}</p>

                  {/* Revenue section */}
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-t1 mb-2 uppercase tracking-wide">Revenue</p>
                    {pl.revenue.length === 0 ? (
                      <p className="text-xs text-t3 pl-4">No revenue entries in this period</p>
                    ) : (
                      <div className="space-y-1 pl-4">
                        {pl.revenue.map((r, i) => (
                          <div key={i} className="flex items-center justify-between">
                            <span className="text-xs text-t2">{r.account}</span>
                            <span className="text-xs font-semibold text-t1">{formatCurrency(r.amount, defaultCurrency, { cents: true })}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-divider">
                      <span className="text-xs font-semibold text-t1">Total Revenue</span>
                      <span className="text-xs font-bold text-success">{formatCurrency(pl.totalRevenue, defaultCurrency, { cents: true })}</span>
                    </div>
                  </div>

                  {/* Expenses section */}
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-t1 mb-2 uppercase tracking-wide">Expenses</p>
                    {pl.expenses.length === 0 ? (
                      <p className="text-xs text-t3 pl-4">No expense entries in this period</p>
                    ) : (
                      <div className="space-y-1 pl-4">
                        {pl.expenses.map((e, i) => (
                          <div key={i} className="flex items-center justify-between">
                            <span className="text-xs text-t2">{e.account}</span>
                            <span className="text-xs font-semibold text-t1">{formatCurrency(e.amount, defaultCurrency, { cents: true })}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-divider">
                      <span className="text-xs font-semibold text-t1">Total Expenses</span>
                      <span className="text-xs font-bold text-error">{formatCurrency(pl.totalExpenses, defaultCurrency, { cents: true })}</span>
                    </div>
                  </div>

                  {/* Net Income */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-canvas border border-divider">
                    <span className="text-sm font-bold text-t1">Net Income</span>
                    <span className={`text-sm font-bold ${pl.netIncome >= 0 ? 'text-success' : 'text-error'}`}>
                      {formatCurrency(Math.abs(pl.netIncome), defaultCurrency, { cents: true })}
                      {pl.netIncome < 0 && ' (Loss)'}
                    </span>
                  </div>
                </Card>
              </div>
            )
          })()}

          {/* ---------- Balance Sheet ---------- */}
          {finStmtView === 'balance-sheet' && (() => {
            const bs = generateBalanceSheet(allJournalEntries, bsAsOfDate)
            return (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-t3">As of:</span>
                  <input type="date" value={bsAsOfDate} onChange={(e) => setBsAsOfDate(e.target.value)} className="px-3 py-2 text-sm rounded-lg border border-border bg-surface text-t1" />
                  <Button size="sm" variant="secondary" onClick={() => exportToCSV(
                    [
                      ...bs.assets.current.map(a => ({ section: 'Current Assets', account: a.account, amount: a.amount / 100 })),
                      ...bs.assets.nonCurrent.map(a => ({ section: 'Non-Current Assets', account: a.account, amount: a.amount / 100 })),
                      ...bs.liabilities.current.map(l => ({ section: 'Current Liabilities', account: l.account, amount: l.amount / 100 })),
                      ...bs.liabilities.nonCurrent.map(l => ({ section: 'Non-Current Liabilities', account: l.account, amount: l.amount / 100 })),
                      ...bs.equity.map(e => ({ section: 'Equity', account: e.account, amount: e.amount / 100 })),
                    ],
                    [
                      { header: 'Section', accessor: (r: any) => r.section },
                      { header: 'Account', accessor: (r: any) => r.account },
                      { header: 'Amount', accessor: (r: any) => r.amount },
                    ],
                    'balance-sheet-export'
                  )}>
                    <Download size={14} /> Export CSV
                  </Button>
                </div>

                {/* Balance equation check */}
                <div className={`p-3 rounded-lg border flex items-center justify-between ${
                  bs.isBalanced ? 'bg-success/10 border-success/20' : 'bg-error/10 border-error/20'
                }`}>
                  <div className="flex items-center gap-2">
                    {bs.isBalanced ? <CheckCircle size={16} className="text-success" /> : <AlertTriangle size={16} className="text-error" />}
                    <span className="text-sm font-medium text-t1">
                      Assets = Liabilities + Equity
                    </span>
                  </div>
                  <span className="text-xs text-t2">
                    {formatCurrency(bs.totalAssets, defaultCurrency, { cents: true })} = {formatCurrency(bs.totalLiabilities, defaultCurrency, { cents: true })} + {formatCurrency(bs.totalEquity, defaultCurrency, { cents: true })}
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Assets */}
                  <Card>
                    <h3 className="text-sm font-semibold text-t1 mb-3">Assets</h3>
                    {bs.assets.current.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs font-medium text-t3 mb-1 uppercase tracking-wide">Current Assets</p>
                        <div className="space-y-1 pl-3">
                          {bs.assets.current.map((a, i) => (
                            <div key={i} className="flex items-center justify-between">
                              <span className="text-xs text-t2">{a.account}</span>
                              <span className="text-xs font-semibold text-t1">{formatCurrency(a.amount, defaultCurrency, { cents: true })}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {bs.assets.nonCurrent.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs font-medium text-t3 mb-1 uppercase tracking-wide">Non-Current Assets</p>
                        <div className="space-y-1 pl-3">
                          {bs.assets.nonCurrent.map((a, i) => (
                            <div key={i} className="flex items-center justify-between">
                              <span className="text-xs text-t2">{a.account}</span>
                              <span className="text-xs font-semibold text-t1">{formatCurrency(a.amount, defaultCurrency, { cents: true })}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-2 border-t border-divider">
                      <span className="text-xs font-bold text-t1">Total Assets</span>
                      <span className="text-xs font-bold text-accent">{formatCurrency(bs.totalAssets, defaultCurrency, { cents: true })}</span>
                    </div>
                  </Card>

                  {/* Liabilities + Equity */}
                  <Card>
                    <h3 className="text-sm font-semibold text-t1 mb-3">Liabilities & Equity</h3>
                    {bs.liabilities.current.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs font-medium text-t3 mb-1 uppercase tracking-wide">Current Liabilities</p>
                        <div className="space-y-1 pl-3">
                          {bs.liabilities.current.map((l, i) => (
                            <div key={i} className="flex items-center justify-between">
                              <span className="text-xs text-t2">{l.account}</span>
                              <span className="text-xs font-semibold text-t1">{formatCurrency(l.amount, defaultCurrency, { cents: true })}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {bs.liabilities.nonCurrent.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs font-medium text-t3 mb-1 uppercase tracking-wide">Non-Current Liabilities</p>
                        <div className="space-y-1 pl-3">
                          {bs.liabilities.nonCurrent.map((l, i) => (
                            <div key={i} className="flex items-center justify-between">
                              <span className="text-xs text-t2">{l.account}</span>
                              <span className="text-xs font-semibold text-t1">{formatCurrency(l.amount, defaultCurrency, { cents: true })}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-2 border-t border-divider mb-3">
                      <span className="text-xs font-bold text-t1">Total Liabilities</span>
                      <span className="text-xs font-bold text-warning">{formatCurrency(bs.totalLiabilities, defaultCurrency, { cents: true })}</span>
                    </div>
                    {bs.equity.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs font-medium text-t3 mb-1 uppercase tracking-wide">Equity</p>
                        <div className="space-y-1 pl-3">
                          {bs.equity.map((e, i) => (
                            <div key={i} className="flex items-center justify-between">
                              <span className="text-xs text-t2">{e.account}</span>
                              <span className="text-xs font-semibold text-t1">{formatCurrency(e.amount, defaultCurrency, { cents: true })}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-2 border-t border-divider">
                      <span className="text-xs font-bold text-t1">Total Equity</span>
                      <span className="text-xs font-bold text-success">{formatCurrency(bs.totalEquity, defaultCurrency, { cents: true })}</span>
                    </div>
                  </Card>
                </div>
              </div>
            )
          })()}
        </div>
      )}

      {/* ================================================================== */}
      {/* TAB 4: Auto-JE Log                                                 */}
      {/* ================================================================== */}
      {activeTab === 'auto-je-log' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Auto Entries" value={autoJEEntries.length} icon={<Zap size={20} />} />
            <StatCard label="Payroll JEs" value={autoJEEntries.filter(e => e.sourceModule === 'payroll').length} icon={<Banknote size={20} />} />
            <StatCard label="Invoice JEs" value={autoJEEntries.filter(e => e.sourceModule === 'invoicing').length} icon={<Receipt size={20} />} />
            <StatCard label="Expense JEs" value={autoJEEntries.filter(e => e.sourceModule === 'expenses').length} icon={<CreditCard size={20} />} />
          </div>

          <Card padding="none">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>System-Generated Journal Entries</CardTitle>
                <span className="text-xs text-t3">{autoJEEntries.length} entries (read-only)</span>
              </div>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-divider bg-canvas">
                    <th className="tempo-th text-left px-6 py-3">Date</th>
                    <th className="tempo-th text-left px-4 py-3">Entry #</th>
                    <th className="tempo-th text-center px-4 py-3">Source</th>
                    <th className="tempo-th text-left px-4 py-3">Reference</th>
                    <th className="tempo-th text-left px-4 py-3">Description</th>
                    <th className="tempo-th text-right px-4 py-3">Amount</th>
                    <th className="tempo-th text-center px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {autoJEEntries.length === 0 ? (
                    <tr>
                      <td colSpan={7}>
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                          <div className="w-12 h-12 rounded-xl bg-canvas flex items-center justify-center mb-3">
                            <Zap size={24} className="text-t3" />
                          </div>
                          <p className="text-sm font-medium text-t1 mb-1">No auto-generated entries yet</p>
                          <p className="text-xs text-t3">Journal entries will appear here when payroll runs, invoices are paid, expenses are approved, or bills are paid</p>
                        </div>
                      </td>
                    </tr>
                  ) : autoJEEntries.map(je => {
                    const jeTotal = je.lines.reduce((s: number, l: JournalEntryLine) => s + l.debit, 0)
                    return (
                      <tr key={je.id} className="hover:bg-canvas/50">
                        <td className="px-6 py-3 text-xs text-t2">{je.date}</td>
                        <td className="px-4 py-3 text-xs font-mono font-medium text-t1">{je.entryNumber}</td>
                        <td className="px-4 py-3 text-center">{getSourceBadge(je.sourceModule)}</td>
                        <td className="px-4 py-3 text-xs font-mono text-t3">{je.reference || '--'}</td>
                        <td className="px-4 py-3 text-xs text-t2 max-w-[300px] truncate">{je.description}</td>
                        <td className="px-4 py-3 text-xs font-semibold text-t1 text-right">{formatCurrency(jeTotal, defaultCurrency, { cents: true })}</td>
                        <td className="px-4 py-3 text-center">{getStatusBadge(je.status)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ================================================================== */}
      {/* TAB 5: Period Close (preserved from original)                      */}
      {/* ================================================================== */}
      {activeTab === 'period-close' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Open Periods" value={periods.filter(p => p.status === 'open').length} icon={<Unlock size={20} />} />
            <StatCard label="Closed Periods" value={periods.filter(p => p.status === 'closed').length} icon={<CheckCircle size={20} />} />
            <StatCard label="Locked Periods" value={periods.filter(p => p.status === 'locked').length} icon={<Lock size={20} />} />
            <StatCard label="Close Actions" value={closeHistory.length} icon={<Clock size={20} />} />
          </div>

          {periods.map(period => {
            const checklistKeys: (keyof PeriodState['checklist'])[] = [
              'accruals_posted', 'reconciliations_complete', 'ic_eliminations_done',
              'trial_balance_balanced', 'no_unposted_batches', 'no_unapproved_jes',
            ]
            const checklistLabels: Record<string, string> = {
              accruals_posted: 'Accruals posted',
              reconciliations_complete: 'Reconciliations complete',
              ic_eliminations_done: 'IC eliminations done',
              trial_balance_balanced: 'Trial balance balanced',
              no_unposted_batches: 'No unposted batches',
              no_unapproved_jes: 'No unapproved journal entries',
            }
            const completedCount = checklistKeys.filter(k => period.checklist[k]).length
            const allComplete = completedCount === checklistKeys.length
            const validation = period.status === 'open' ? runPreCloseValidation(period) : null

            return (
              <Card key={period.id}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-sm font-semibold text-t1">{period.label}</h3>
                      {getPeriodStatusBadge(period.status)}
                    </div>
                    <p className="text-xs text-t3 mt-1">{period.startDate} to {period.endDate}</p>
                    {period.closedBy && (
                      <p className="text-xs text-t3 mt-0.5">
                        Closed by {period.closedBy} on {new Date(period.closedAt!).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {period.status === 'open' && (
                      <Button size="sm" variant="primary" onClick={() => closePeriod(period.id)} disabled={!allComplete}>
                        <Lock size={12} /> Close Period
                      </Button>
                    )}
                    {period.status === 'closed' && (
                      <>
                        <Button size="sm" variant="secondary" onClick={() => lockPeriod(period.id)}>
                          <Lock size={12} /> Lock
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => openReopenModal(period.id)}>
                          <Unlock size={12} /> Reopen
                        </Button>
                      </>
                    )}
                    {period.status === 'locked' && (
                      <Button size="sm" variant="ghost" onClick={() => openReopenModal(period.id)}>
                        <RotateCcw size={12} /> Reopen (Approval Required)
                      </Button>
                    )}
                  </div>
                </div>

                {(period.status === 'open' || period.status === 'closing') && (
                  <div className="mb-4">
                    <p className="text-xs font-medium text-t1 mb-2 flex items-center gap-1">
                      <ListChecks size={14} /> Close Checklist ({completedCount}/{checklistKeys.length})
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {checklistKeys.map(key => (
                        <label key={key} className="flex items-center gap-2 p-2 rounded-lg bg-canvas cursor-pointer hover:bg-canvas/80 transition-colors">
                          <input type="checkbox" checked={period.checklist[key]} onChange={() => toggleChecklistItem(period.id, key)} className="rounded border-divider text-accent focus:ring-accent" />
                          <span className={`text-xs ${period.checklist[key] ? 'text-success line-through' : 'text-t1'}`}>{checklistLabels[key]}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {period.status === 'open' && validation && !validation.passed && (
                  <div className="p-3 rounded-lg bg-error/10 border border-error/20">
                    <p className="text-xs font-medium text-error mb-1 flex items-center gap-1">
                      <AlertTriangle size={12} /> Pre-Close Validation Errors
                    </p>
                    <ul className="space-y-1">
                      {validation.errors.map((err, i) => (
                        <li key={i} className="text-xs text-t2 flex items-center gap-1">
                          <span className="w-1 h-1 rounded-full bg-error flex-shrink-0" />
                          {err}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {period.status === 'open' && validation && validation.passed && allComplete && (
                  <div className="p-3 rounded-lg bg-success/10 border border-success/20 flex items-center gap-2">
                    <CheckCircle size={14} className="text-success flex-shrink-0" />
                    <p className="text-xs text-t1">All pre-close validations passed. Ready to close.</p>
                  </div>
                )}
              </Card>
            )
          })}

          <Card>
            <h3 className="text-sm font-semibold text-t1 mb-3 flex items-center gap-2">
              <Clock size={16} /> Close History
            </h3>
            <div className="space-y-0 divide-y divide-divider">
              {closeHistory.map(entry => (
                <div key={entry.id} className="flex items-center gap-3 py-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    entry.action === 'close' ? 'bg-success/10' : entry.action === 'lock' ? 'bg-error/10' : 'bg-info/10'
                  }`}>
                    {entry.action === 'close' ? <CheckCircle size={14} className="text-success" /> :
                     entry.action === 'lock' ? <Lock size={14} className="text-error" /> :
                     <Unlock size={14} className="text-accent" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-t1">
                      {entry.periodLabel} -- <span className="capitalize">{entry.action === 'close' ? 'Closed' : entry.action === 'lock' ? 'Locked' : 'Reopened'}</span>
                    </p>
                    <p className="text-xs text-t3">by {entry.performedBy} on {new Date(entry.performedAt).toLocaleString()}</p>
                    {entry.notes && <p className="text-xs text-t2 mt-0.5 italic">{entry.notes}</p>}
                  </div>
                  <Badge variant={entry.action === 'close' ? 'success' : entry.action === 'lock' ? 'error' : 'info'}>
                    {entry.action}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ================================================================== */}
      {/* MODAL: Create Journal Entry                                        */}
      {/* ================================================================== */}
      <Modal open={showCreateJE} onClose={() => setShowCreateJE(false)} title="Create Journal Entry">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-t1 mb-1">Date</label>
              <input type="date" value={newJEDate} onChange={(e) => setNewJEDate(e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-surface text-t1" />
            </div>
            <div>
              <label className="block text-xs font-medium text-t1 mb-1">Reference</label>
              <input type="text" value={newJEReference} onChange={(e) => setNewJEReference(e.target.value)} placeholder="e.g. INV-001" className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-surface text-t1 placeholder:text-t3" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-t1 mb-1">Description</label>
            <input type="text" value={newJEDescription} onChange={(e) => setNewJEDescription(e.target.value)} placeholder="Description of journal entry..." className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-surface text-t1 placeholder:text-t3" />
          </div>

          {/* Lines */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-medium text-t1">Journal Lines</label>
              <Button size="sm" variant="ghost" onClick={() => setNewJELines(prev => [...prev, { accountCode: '', accountName: '', debit: '', credit: '', description: '' }])}>
                <Plus size={12} /> Add Line
              </Button>
            </div>
            <div className="space-y-2">
              {newJELines.map((line, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                  <input type="text" value={line.accountCode} onChange={(e) => { const arr = [...newJELines]; arr[idx] = { ...arr[idx], accountCode: e.target.value }; setNewJELines(arr) }} placeholder="Code" className="col-span-2 px-2 py-1.5 text-xs rounded-lg border border-border bg-surface text-t1 placeholder:text-t3 font-mono" />
                  <input type="text" value={line.accountName} onChange={(e) => { const arr = [...newJELines]; arr[idx] = { ...arr[idx], accountName: e.target.value }; setNewJELines(arr) }} placeholder="Account name" className="col-span-3 px-2 py-1.5 text-xs rounded-lg border border-border bg-surface text-t1 placeholder:text-t3" />
                  <input type="number" step="0.01" min="0" value={line.debit} onChange={(e) => { const arr = [...newJELines]; arr[idx] = { ...arr[idx], debit: e.target.value, credit: e.target.value ? '' : arr[idx].credit }; setNewJELines(arr) }} placeholder="Debit" className="col-span-2 px-2 py-1.5 text-xs rounded-lg border border-border bg-surface text-t1 placeholder:text-t3 text-right" />
                  <input type="number" step="0.01" min="0" value={line.credit} onChange={(e) => { const arr = [...newJELines]; arr[idx] = { ...arr[idx], credit: e.target.value, debit: e.target.value ? '' : arr[idx].debit }; setNewJELines(arr) }} placeholder="Credit" className="col-span-2 px-2 py-1.5 text-xs rounded-lg border border-border bg-surface text-t1 placeholder:text-t3 text-right" />
                  <input type="text" value={line.description} onChange={(e) => { const arr = [...newJELines]; arr[idx] = { ...arr[idx], description: e.target.value }; setNewJELines(arr) }} placeholder="Note" className="col-span-2 px-2 py-1.5 text-xs rounded-lg border border-border bg-surface text-t1 placeholder:text-t3" />
                  {newJELines.length > 2 && (
                    <button onClick={() => setNewJELines(prev => prev.filter((_, i) => i !== idx))} className="col-span-1 text-t3 hover:text-error">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Running totals */}
          <div className={`p-3 rounded-lg border ${Math.round(newJETotalDebits) === Math.round(newJETotalCredits) && newJETotalDebits > 0 ? 'bg-success/10 border-success/20' : 'bg-canvas border-divider'}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-t1">Total Debits: {formatCurrency(Math.round(newJETotalDebits), defaultCurrency, { cents: true })}</span>
              <span className="text-xs font-medium text-t1">Total Credits: {formatCurrency(Math.round(newJETotalCredits), defaultCurrency, { cents: true })}</span>
            </div>
            {Math.round(newJETotalDebits) !== Math.round(newJETotalCredits) && newJETotalDebits > 0 && (
              <p className="text-xs text-error mt-1 flex items-center gap-1">
                <AlertTriangle size={12} /> Out of balance by {formatCurrency(Math.abs(Math.round(newJETotalDebits) - Math.round(newJETotalCredits)), defaultCurrency, { cents: true })}
              </p>
            )}
            {Math.round(newJETotalDebits) === Math.round(newJETotalCredits) && newJETotalDebits > 0 && (
              <p className="text-xs text-success mt-1 flex items-center gap-1">
                <CheckCircle size={12} /> Entry is balanced
              </p>
            )}
          </div>

          {/* Validation errors */}
          {!newJEValidation.valid && newJETotalDebits > 0 && (
            <div className="p-2 rounded-lg bg-error/10 border border-error/20">
              {newJEValidation.errors.map((err, i) => (
                <p key={i} className="text-xs text-error">{err}</p>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowCreateJE(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleCreateJE} disabled={!newJEValidation.valid}>
              Create Entry (Draft)
            </Button>
          </div>
        </div>
      </Modal>

      {/* ================================================================== */}
      {/* MODAL: Add Chart of Accounts Entry                                 */}
      {/* ================================================================== */}
      <Modal open={showAddAccount} onClose={() => setShowAddAccount(false)} title="Add Account">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-t1 mb-1">Account Code</label>
              <input type="text" value={newAcctCode} onChange={(e) => setNewAcctCode(e.target.value)} placeholder="e.g. 1150" className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-surface text-t1 placeholder:text-t3 font-mono" />
            </div>
            <div>
              <label className="block text-xs font-medium text-t1 mb-1">Account Type</label>
              <Select value={newAcctType} onChange={(e) => setNewAcctType(e.target.value)} options={[
                { value: 'asset', label: 'Asset' },
                { value: 'liability', label: 'Liability' },
                { value: 'equity', label: 'Equity' },
                { value: 'revenue', label: 'Revenue' },
                { value: 'expense', label: 'Expense' },
              ]} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-t1 mb-1">Account Name</label>
            <input type="text" value={newAcctName} onChange={(e) => setNewAcctName(e.target.value)} placeholder="e.g. Short-term Investments" className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-surface text-t1 placeholder:text-t3" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowAddAccount(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleAddAccount}>Add Account</Button>
          </div>
        </div>
      </Modal>

      {/* ================================================================== */}
      {/* MODAL: Reopen Period                                               */}
      {/* ================================================================== */}
      <Modal open={showReopenModal} onClose={() => setShowReopenModal(false)} title="Reopen Period">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center flex-shrink-0">
              <AlertTriangle size={20} className="text-warning" />
            </div>
            <div>
              <p className="text-sm font-medium text-t1">Reopen this period?</p>
              <p className="text-xs text-t3 mt-1">
                Reopening will allow new journal entries and modifications. This action will be logged in the audit trail.
              </p>
            </div>
          </div>
          <Textarea
            label="Reason for reopening (required)"
            placeholder="Explain why this period needs to be reopened..."
            rows={3}
            value={reopenReason}
            onChange={(e) => setReopenReason(e.target.value)}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowReopenModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={confirmReopen}>Reopen Period</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
