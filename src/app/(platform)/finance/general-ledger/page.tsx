'use client'

import React, { useState, useMemo, useEffect } from 'react'
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
} from 'lucide-react'
import { useTempo, useOrgCurrency } from '@/lib/store'
import { formatCurrency } from '@/lib/utils/format-currency'
import { exportToCSV } from '@/lib/export-import'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface JournalLine {
  account_code: string
  account_name: string
  cost_center?: string
  department_id?: string
  debit_cents: number
  credit_cents: number
  description: string
}

interface JournalEntry {
  id: string
  type: 'payroll' | 'expense_reimbursement' | 'manual'
  date: string
  description: string
  reference: string
  lines: JournalLine[]
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

const DEMO_JOURNAL_ENTRIES: JournalEntry[] = [
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
    description: 'Expense reimbursement for employee EMP-042 — Report #ER-2026-087',
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
    description: 'Expense reimbursement for employee EMP-015 — Report #ER-2026-091',
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
    description: 'Month-end accrual for office rent — March 2026',
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
    description: 'Depreciation expense — February 2026',
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
    description: 'Expense reimbursement for employee EMP-008 — Report #ER-2026-074',
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

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function GeneralLedgerPage() {
  const defaultCurrency = useOrgCurrency()
  const { ensureModulesLoaded, addToast } = useTempo()

  const [pageLoading, setPageLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'entries' | 'accounts' | 'trial-balance' | 'period-close'>('entries')
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

  // Use demo data as fallback (store doesn't have journalEntries yet)
  const journalEntries: JournalEntry[] = DEMO_JOURNAL_ENTRIES

  useEffect(() => { ensureModulesLoaded?.(['invoices'])?.then?.(() => setPageLoading(false))?.catch?.(() => setPageLoading(false)) }, [])
  useEffect(() => { const t = setTimeout(() => setPageLoading(false), 2000); return () => clearTimeout(t) }, [])

  // ── Filtered Entries ──
  const filteredEntries = useMemo(() => {
    return journalEntries.filter(je => {
      const matchesSearch = !searchQuery ||
        je.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
        je.description.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesType = typeFilter === 'all' || je.type === typeFilter
      const matchesStatus = statusFilter === 'all' || je.status === statusFilter
      const matchesDateFrom = !dateFrom || je.date >= dateFrom
      const matchesDateTo = !dateTo || je.date <= dateTo
      return matchesSearch && matchesType && matchesStatus && matchesDateFrom && matchesDateTo
    })
  }, [journalEntries, searchQuery, typeFilter, statusFilter, dateFrom, dateTo])

  // ── Stats ──
  const totalEntries = filteredEntries.length
  const totalDebits = filteredEntries.reduce((sum, je) => sum + je.totalDebitCents, 0)
  const totalCredits = filteredEntries.reduce((sum, je) => sum + je.totalCreditCents, 0)
  const balanceCheck = totalDebits - totalCredits

  // ── Account Summary (Tab 2) ──
  const accountSummary = useMemo(() => {
    const map: Record<string, { code: string; name: string; totalDebitCents: number; totalCreditCents: number; entryCount: number }> = {}
    filteredEntries.forEach(je => {
      je.lines.forEach(line => {
        const key = line.account_code
        if (!map[key]) {
          map[key] = { code: line.account_code, name: line.account_name, totalDebitCents: 0, totalCreditCents: 0, entryCount: 0 }
        }
        map[key].totalDebitCents += line.debit_cents
        map[key].totalCreditCents += line.credit_cents
        map[key].entryCount += 1
      })
    })
    return Object.values(map).sort((a, b) => a.code.localeCompare(b.code))
  }, [filteredEntries])

  // ── Trial Balance (Tab 3) ──
  const trialBalance = useMemo(() => {
    return accountSummary.map(acct => ({
      ...acct,
      balanceCents: acct.totalDebitCents - acct.totalCreditCents,
    }))
  }, [accountSummary])

  const trialBalanceTotalDebits = trialBalance.reduce((s, a) => s + a.totalDebitCents, 0)
  const trialBalanceTotalCredits = trialBalance.reduce((s, a) => s + a.totalCreditCents, 0)

  // ── Period Close Helpers ──

  function runPreCloseValidation(period: PeriodState): { passed: boolean; errors: string[] } {
    const errors: string[] = []
    const periodEntries = journalEntries.filter(je => je.date >= period.startDate && je.date <= period.endDate)
    const draftCount = periodEntries.filter(je => je.status === 'draft').length
    if (draftCount > 0) errors.push(`${draftCount} unposted journal entries in this period`)
    const debits = periodEntries.reduce((s, je) => s + je.totalDebitCents, 0)
    const credits = periodEntries.reduce((s, je) => s + je.totalCreditCents, 0)
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
    const now = new Date().toISOString()
    setPeriods(prev => prev.map(p =>
      p.id === periodId ? { ...p, status: 'closed', closedBy: 'Current User', closedAt: now } : p
    ))
    setCloseHistory(prev => [{
      id: `h-${Date.now()}`,
      periodId,
      periodLabel: period.label,
      action: 'close',
      performedBy: 'Current User',
      performedAt: now,
      notes: 'Period closed after all validations passed.',
    }, ...prev])
    addToast(`${period.label} closed successfully`, 'success')
  }

  function lockPeriod(periodId: string) {
    const period = periods.find(p => p.id === periodId)
    if (!period || period.status !== 'closed') return
    const now = new Date().toISOString()
    setPeriods(prev => prev.map(p =>
      p.id === periodId ? { ...p, status: 'locked' } : p
    ))
    setCloseHistory(prev => [{
      id: `h-${Date.now()}`,
      periodId,
      periodLabel: period.label,
      action: 'lock',
      performedBy: 'Current User',
      performedAt: now,
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
    const now = new Date().toISOString()
    setPeriods(prev => prev.map(p =>
      p.id === reopenTarget ? { ...p, status: 'open', closedBy: null, closedAt: null } : p
    ))
    setCloseHistory(prev => [{
      id: `h-${Date.now()}`,
      periodId: reopenTarget,
      periodLabel: period.label,
      action: 'reopen',
      performedBy: 'Current User',
      performedAt: now,
      notes: reopenReason,
    }, ...prev])
    addToast(`${period.label} reopened`, 'info')
    setShowReopenModal(false)
  }

  function getTypeBadge(type: string) {
    switch (type) {
      case 'payroll': return <Badge variant="info">Payroll</Badge>
      case 'expense_reimbursement': return <Badge variant="warning">Expense</Badge>
      case 'manual': return <Badge variant="default">Manual</Badge>
      default: return <Badge variant="default">{type}</Badge>
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
        <Header title="General Ledger" subtitle="Journal entries and account balances" />
        <div className="p-6"><PageSkeleton /></div>
      </>
    )
  }

  return (
    <>
      <Header
        title="General Ledger"
        subtitle="Journal entries and account balances"
        actions={
          <Button size="sm" variant="secondary" onClick={() => exportToCSV(
            filteredEntries.map(je => ({
              date: je.date,
              reference: je.reference,
              type: je.type,
              description: je.description,
              total_debit: je.totalDebitCents / 100,
              total_credit: je.totalCreditCents / 100,
              status: je.status,
            })),
            [
              { header: 'Date', accessor: (r: any) => r.date },
              { header: 'Reference', accessor: (r: any) => r.reference },
              { header: 'Type', accessor: (r: any) => r.type },
              { header: 'Description', accessor: (r: any) => r.description },
              { header: 'Total Debit', accessor: (r: any) => r.total_debit },
              { header: 'Total Credit', accessor: (r: any) => r.total_credit },
              { header: 'Status', accessor: (r: any) => r.status },
            ],
            'general-ledger-export'
          )}>Export</Button>
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
        {[
          { key: 'entries' as const, label: 'Journal Entries' },
          { key: 'accounts' as const, label: 'Account Summary' },
          { key: 'trial-balance' as const, label: 'Trial Balance' },
          { key: 'period-close' as const, label: 'Period Close' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.key
                ? 'border-accent text-accent'
                : 'border-transparent text-t3 hover:text-t1'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters (for entries/accounts/trial-balance) */}
      {activeTab !== 'period-close' && (
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-t3" />
            <input
              type="text"
              placeholder="Search by reference or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-border bg-surface text-t1 placeholder:text-t3 focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
          </div>
          <Select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Types' },
              { value: 'payroll', label: 'Payroll' },
              { value: 'expense_reimbursement', label: 'Expense' },
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
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-3 py-2 text-sm rounded-lg border border-border bg-surface text-t1 focus:outline-none focus:ring-2 focus:ring-accent/30"
            placeholder="From"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-3 py-2 text-sm rounded-lg border border-border bg-surface text-t1 focus:outline-none focus:ring-2 focus:ring-accent/30"
            placeholder="To"
          />
        </div>
      )}

      {/* ── Tab 1: Journal Entries ── */}
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
                  <th className="tempo-th text-left px-4 py-3">Reference</th>
                  <th className="tempo-th text-center px-4 py-3">Type</th>
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
                    <td colSpan={8}>
                      <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="w-12 h-12 rounded-xl bg-canvas flex items-center justify-center mb-3">
                          <BookOpen size={24} className="text-t3" />
                        </div>
                        <p className="text-sm font-medium text-t1 mb-1">No journal entries found</p>
                        <p className="text-xs text-t3">Try adjusting your search or filters</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredEntries.map(je => (
                  <React.Fragment key={je.id}>
                    <tr
                      className="hover:bg-canvas/50 cursor-pointer"
                      onClick={() => setExpandedEntry(expandedEntry === je.id ? null : je.id)}
                    >
                      <td className="px-6 py-3 text-xs text-t2">{je.date}</td>
                      <td className="px-4 py-3 text-xs font-mono font-medium text-t1">{je.reference}</td>
                      <td className="px-4 py-3 text-center">{getTypeBadge(je.type)}</td>
                      <td className="px-4 py-3 text-xs text-t2 max-w-[280px] truncate">{je.description}</td>
                      <td className="px-4 py-3 text-xs font-semibold text-t1 text-right">{formatCurrency(je.totalDebitCents, defaultCurrency, { cents: true })}</td>
                      <td className="px-4 py-3 text-xs font-semibold text-t1 text-right">{formatCurrency(je.totalCreditCents, defaultCurrency, { cents: true })}</td>
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
                        <td colSpan={8} className="px-6 py-3 bg-canvas/50">
                          <div className="mb-2">
                            <p className="text-xs font-medium text-t1 mb-2">Journal Lines</p>
                          </div>
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
                                    <span className="font-mono text-t3">{line.account_code}</span>
                                    <span className="ml-2">{line.account_name}</span>
                                  </td>
                                  <td className="px-3 py-1.5 text-xs text-t2">{line.description}</td>
                                  <td className="px-3 py-1.5 text-xs text-t3">{line.cost_center || '—'}</td>
                                  <td className="px-3 py-1.5 text-xs font-medium text-right">
                                    {line.debit_cents > 0 ? formatCurrency(line.debit_cents, defaultCurrency, { cents: true }) : '—'}
                                  </td>
                                  <td className="px-3 py-1.5 text-xs font-medium text-right">
                                    {line.credit_cents > 0 ? formatCurrency(line.credit_cents, defaultCurrency, { cents: true }) : '—'}
                                  </td>
                                </tr>
                              ))}
                              <tr className="border-t-2 border-divider font-semibold">
                                <td colSpan={3} className="px-3 py-1.5 text-xs text-t1">Total</td>
                                <td className="px-3 py-1.5 text-xs text-right">{formatCurrency(je.totalDebitCents, defaultCurrency, { cents: true })}</td>
                                <td className="px-3 py-1.5 text-xs text-right">{formatCurrency(je.totalCreditCents, defaultCurrency, { cents: true })}</td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ── Tab 2: Account Summary ── */}
      {activeTab === 'accounts' && (
        <Card padding="none">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Account Summary</CardTitle>
              <span className="text-xs text-t3">{accountSummary.length} accounts</span>
            </div>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-divider bg-canvas">
                  <th className="tempo-th text-left px-6 py-3">Account Code</th>
                  <th className="tempo-th text-left px-4 py-3">Account Name</th>
                  <th className="tempo-th text-right px-4 py-3">Total Debits</th>
                  <th className="tempo-th text-right px-4 py-3">Total Credits</th>
                  <th className="tempo-th text-right px-4 py-3">Net Balance</th>
                  <th className="tempo-th text-center px-4 py-3">Line Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {accountSummary.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="w-12 h-12 rounded-xl bg-canvas flex items-center justify-center mb-3">
                          <BookOpen size={24} className="text-t3" />
                        </div>
                        <p className="text-sm font-medium text-t1 mb-1">No account data</p>
                        <p className="text-xs text-t3">Adjust filters to see account summaries</p>
                      </div>
                    </td>
                  </tr>
                ) : accountSummary.map(acct => {
                  const netBalance = acct.totalDebitCents - acct.totalCreditCents
                  return (
                    <tr key={acct.code} className="hover:bg-canvas/50">
                      <td className="px-6 py-3 text-xs font-mono font-medium text-t1">{acct.code}</td>
                      <td className="px-4 py-3 text-xs text-t2">{acct.name}</td>
                      <td className="px-4 py-3 text-xs font-semibold text-t1 text-right">{formatCurrency(acct.totalDebitCents, defaultCurrency, { cents: true })}</td>
                      <td className="px-4 py-3 text-xs font-semibold text-t1 text-right">{formatCurrency(acct.totalCreditCents, defaultCurrency, { cents: true })}</td>
                      <td className={`px-4 py-3 text-xs font-semibold text-right ${netBalance >= 0 ? 'text-t1' : 'text-error'}`}>
                        {formatCurrency(Math.abs(netBalance), defaultCurrency, { cents: true })}
                        {netBalance < 0 && <span className="text-t3 ml-1">(Cr)</span>}
                        {netBalance > 0 && <span className="text-t3 ml-1">(Dr)</span>}
                      </td>
                      <td className="px-4 py-3 text-xs text-t3 text-center">{acct.entryCount}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ── Tab 3: Trial Balance ── */}
      {activeTab === 'trial-balance' && (
        <Card padding="none">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Trial Balance</CardTitle>
              <div className="flex items-center gap-2">
                {trialBalanceTotalDebits === trialBalanceTotalCredits ? (
                  <Badge variant="success">Balanced</Badge>
                ) : (
                  <Badge variant="error">Out of Balance</Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-divider bg-canvas">
                  <th className="tempo-th text-left px-6 py-3">Account Code</th>
                  <th className="tempo-th text-left px-4 py-3">Account Name</th>
                  <th className="tempo-th text-right px-4 py-3">Debit Balance</th>
                  <th className="tempo-th text-right px-4 py-3">Credit Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {trialBalance.length === 0 ? (
                  <tr>
                    <td colSpan={4}>
                      <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="w-12 h-12 rounded-xl bg-canvas flex items-center justify-center mb-3">
                          <BookOpen size={24} className="text-t3" />
                        </div>
                        <p className="text-sm font-medium text-t1 mb-1">No trial balance data</p>
                        <p className="text-xs text-t3">Adjust filters to see the trial balance</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <>
                    {trialBalance.map(acct => (
                      <tr key={acct.code} className="hover:bg-canvas/50">
                        <td className="px-6 py-3 text-xs font-mono font-medium text-t1">{acct.code}</td>
                        <td className="px-4 py-3 text-xs text-t2">{acct.name}</td>
                        <td className="px-4 py-3 text-xs font-semibold text-t1 text-right">
                          {acct.balanceCents >= 0 ? formatCurrency(acct.balanceCents, defaultCurrency, { cents: true }) : '—'}
                        </td>
                        <td className="px-4 py-3 text-xs font-semibold text-t1 text-right">
                          {acct.balanceCents < 0 ? formatCurrency(Math.abs(acct.balanceCents), defaultCurrency, { cents: true }) : '—'}
                        </td>
                      </tr>
                    ))}
                    {/* Totals row */}
                    <tr className="border-t-2 border-divider bg-canvas font-semibold">
                      <td colSpan={2} className="px-6 py-3 text-xs text-t1">Total</td>
                      <td className="px-4 py-3 text-xs font-semibold text-t1 text-right">
                        {formatCurrency(
                          trialBalance.filter(a => a.balanceCents >= 0).reduce((s, a) => s + a.balanceCents, 0),
                          defaultCurrency,
                          { cents: true }
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold text-t1 text-right">
                        {formatCurrency(
                          trialBalance.filter(a => a.balanceCents < 0).reduce((s, a) => s + Math.abs(a.balanceCents), 0),
                          defaultCurrency,
                          { cents: true }
                        )}
                      </td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ── Tab 4: Period Close ── */}
      {activeTab === 'period-close' && (
        <div className="space-y-6">
          {/* Period overview stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Open Periods" value={periods.filter(p => p.status === 'open').length} icon={<Unlock size={20} />} />
            <StatCard label="Closed Periods" value={periods.filter(p => p.status === 'closed').length} icon={<CheckCircle size={20} />} />
            <StatCard label="Locked Periods" value={periods.filter(p => p.status === 'locked').length} icon={<Lock size={20} />} />
            <StatCard label="Close Actions" value={closeHistory.length} icon={<Clock size={20} />} />
          </div>

          {/* Period cards */}
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
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => closePeriod(period.id)}
                        disabled={!allComplete}
                      >
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

                {/* Close Checklist */}
                {(period.status === 'open' || period.status === 'closing') && (
                  <div className="mb-4">
                    <p className="text-xs font-medium text-t1 mb-2 flex items-center gap-1">
                      <ListChecks size={14} /> Close Checklist ({completedCount}/{checklistKeys.length})
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {checklistKeys.map(key => (
                        <label
                          key={key}
                          className="flex items-center gap-2 p-2 rounded-lg bg-canvas cursor-pointer hover:bg-canvas/80 transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={period.checklist[key]}
                            onChange={() => toggleChecklistItem(period.id, key)}
                            className="rounded border-divider text-accent focus:ring-accent"
                          />
                          <span className={`text-xs ${period.checklist[key] ? 'text-success line-through' : 'text-t1'}`}>
                            {checklistLabels[key]}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pre-close validation errors */}
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

                {/* All checks passed banner */}
                {period.status === 'open' && validation && validation.passed && allComplete && (
                  <div className="p-3 rounded-lg bg-success/10 border border-success/20 flex items-center gap-2">
                    <CheckCircle size={14} className="text-success flex-shrink-0" />
                    <p className="text-xs text-t1">All pre-close validations passed. Ready to close.</p>
                  </div>
                )}
              </Card>
            )
          })}

          {/* Close History */}
          <Card>
            <h3 className="text-sm font-semibold text-t1 mb-3 flex items-center gap-2">
              <Clock size={16} /> Close History
            </h3>
            <div className="space-y-0 divide-y divide-divider">
              {closeHistory.map(entry => (
                <div key={entry.id} className="flex items-center gap-3 py-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    entry.action === 'close' ? 'bg-success/10' :
                    entry.action === 'lock' ? 'bg-error/10' :
                    'bg-info/10'
                  }`}>
                    {entry.action === 'close' ? <CheckCircle size={14} className="text-success" /> :
                     entry.action === 'lock' ? <Lock size={14} className="text-error" /> :
                     <Unlock size={14} className="text-accent" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-t1">
                      {entry.periodLabel} — <span className="capitalize">{entry.action === 'close' ? 'Closed' : entry.action === 'lock' ? 'Locked' : 'Reopened'}</span>
                    </p>
                    <p className="text-xs text-t3">
                      by {entry.performedBy} on {new Date(entry.performedAt).toLocaleString()}
                    </p>
                    {entry.notes && <p className="text-xs text-t2 mt-0.5 italic">{entry.notes}</p>}
                  </div>
                  <Badge variant={
                    entry.action === 'close' ? 'success' :
                    entry.action === 'lock' ? 'error' :
                    'info'
                  }>
                    {entry.action}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ── Reopen Period Modal ── */}
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
