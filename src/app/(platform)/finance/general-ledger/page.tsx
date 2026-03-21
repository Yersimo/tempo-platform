'use client'

import { useState, useMemo, useEffect } from 'react'
import { Header } from '@/components/layout/header'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/ui/stat-card'
import { Select } from '@/components/ui/input'
import { PageSkeleton } from '@/components/ui/page-skeleton'
import { BookOpen, DollarSign, Search, CheckCircle, AlertTriangle, ArrowUpDown, Hash } from 'lucide-react'
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

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function GeneralLedgerPage() {
  const defaultCurrency = useOrgCurrency()
  const { ensureModulesLoaded, addToast } = useTempo()

  const [pageLoading, setPageLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'entries' | 'accounts' | 'trial-balance'>('entries')
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null)

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
      <div className="flex items-center gap-1 mb-4 border-b border-divider">
        {[
          { key: 'entries' as const, label: 'Journal Entries' },
          { key: 'accounts' as const, label: 'Account Summary' },
          { key: 'trial-balance' as const, label: 'Trial Balance' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-accent text-accent'
                : 'border-transparent text-t3 hover:text-t1'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters */}
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
                  <>
                    <tr
                      key={je.id}
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
                  </>
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
    </>
  )
}
