'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Header } from '@/components/layout/header'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/ui/stat-card'
import { Modal } from '@/components/ui/modal'
import { Input, Select, Textarea } from '@/components/ui/input'
import { PageSkeleton } from '@/components/ui/page-skeleton'
import {
  ArrowRightLeft, Plus, FileText, ShieldCheck, AlertTriangle,
  TrendingUp, Check, X, Download, Search, RefreshCw,
  Building2, DollarSign, Scale, Globe, BarChart3,
} from 'lucide-react'
import { useTempo, useOrgCurrency } from '@/lib/store'
import { formatCurrency } from '@/lib/utils/format-currency'
import { exportToCSV } from '@/lib/export-import'

// ---- Types ----

type Policy = {
  id: string
  orgId: string
  name: string
  description: string | null
  pricingMethod: string
  entityFrom: string
  entityTo: string
  transactionType: string
  markup: number | null
  benchmarkRange: string | null
  effectiveDate: string
  expiryDate: string | null
  status: string
  createdAt: string
}

type Transaction = {
  id: string
  orgId: string
  policyId: string
  period: string
  amount: number
  currency: string
  markupApplied: number | null
  armLengthCompliant: boolean
  notes: string | null
  createdAt: string
}

type Report = {
  id: string
  orgId: string
  fiscalYear: string
  reportType: string
  status: string
  content: string | null
  generatedAt: string | null
  createdAt: string
}

type ComplianceSummary = {
  totalPolicies: number
  compliant: number
  nonCompliant: number
  noData: number
  complianceRate: number
  details: { policyId: string; compliant: boolean; actualMarkup: number; benchmark: { low: number; median: number; high: number } | null; deviation: number; reason: string }[]
}

// ---- Constants ----

const PRICING_METHODS = [
  { value: 'cup', label: 'Comparable Uncontrolled Price (CUP)' },
  { value: 'resale_price', label: 'Resale Price Method' },
  { value: 'cost_plus', label: 'Cost Plus Method' },
  { value: 'tnmm', label: 'Transactional Net Margin Method (TNMM)' },
  { value: 'profit_split', label: 'Profit Split Method' },
]

const TRANSACTION_TYPES = [
  { value: 'services', label: 'Services' },
  { value: 'goods', label: 'Goods' },
  { value: 'ip_license', label: 'IP License' },
  { value: 'management_fees', label: 'Management Fees' },
  { value: 'loans', label: 'Intercompany Loans' },
]

const STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'expired', label: 'Expired' },
]

const REPORT_TYPES = [
  { value: 'master_file', label: 'OECD Master File' },
  { value: 'local_file', label: 'OECD Local File' },
  { value: 'cbcr', label: 'Country-by-Country Report (CbCR)' },
]

function statusBadge(status: string) {
  const colors: Record<string, 'warning' | 'info' | 'success' | 'default' | 'error'> = {
    draft: 'default', active: 'success', under_review: 'warning', expired: 'error',
    compliant: 'success', non_compliant: 'error',
  }
  return <Badge variant={colors[status] || 'default'}>{status.replace(/_/g, ' ')}</Badge>
}

// ---- API helpers ----

async function apiGet(action: string, params: Record<string, string> = {}) {
  const qs = new URLSearchParams({ action, ...params }).toString()
  const res = await fetch(`/api/transfer-pricing?${qs}`)
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'API error')
  return json.data
}

async function apiPost(body: Record<string, unknown>) {
  const res = await fetch('/api/transfer-pricing', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'API error')
  return json.data
}

// ---- Main Page ----

export default function TransferPricingPage() {
  const defaultCurrency = useOrgCurrency()
  const { addToast } = useTempo()

  const [pageLoading, setPageLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'policies' | 'transactions' | 'reports' | 'compliance'>('policies')

  // Data
  const [policies, setPolicies] = useState<Policy[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [compliance, setCompliance] = useState<ComplianceSummary | null>(null)

  // Modals
  const [showPolicyModal, setShowPolicyModal] = useState(false)
  const [showTxnModal, setShowTxnModal] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [saving, setSaving] = useState(false)

  // Forms
  const [policyForm, setPolicyForm] = useState({
    name: '', description: '', pricingMethod: 'cost_plus', entityFrom: '', entityTo: '',
    transactionType: 'services', markup: '', benchmarkLow: '', benchmarkMedian: '', benchmarkHigh: '',
    effectiveDate: '', expiryDate: '', status: 'active',
  })
  const [txnForm, setTxnForm] = useState({
    policyId: '', period: '', amount: '', currency: 'USD', markupApplied: '', notes: '',
  })
  const [reportForm, setReportForm] = useState({ fiscalYear: '2025', reportType: 'master_file', entity: '' })
  const [searchQuery, setSearchQuery] = useState('')

  // Load data
  useEffect(() => {
    loadAll()
    const t = setTimeout(() => setPageLoading(false), 1500)
    return () => clearTimeout(t)
  }, [])

  async function loadAll() {
    try {
      const [p, t, r, c] = await Promise.all([
        apiGet('list-policies'),
        apiGet('list-transactions'),
        apiGet('list-reports'),
        apiGet('compliance-summary'),
      ])
      setPolicies(p || [])
      setTransactions(t || [])
      setReports(r || [])
      setCompliance(c || null)
    } catch { /* demo fallback */ }
  }

  // Filtered data
  const filteredPolicies = useMemo(() => {
    if (!searchQuery) return policies
    const q = searchQuery.toLowerCase()
    return policies.filter(p =>
      p.name.toLowerCase().includes(q) || p.entityFrom.toLowerCase().includes(q) || p.entityTo.toLowerCase().includes(q)
    )
  }, [policies, searchQuery])

  const filteredTransactions = useMemo(() => {
    if (!searchQuery) return transactions
    const q = searchQuery.toLowerCase()
    return transactions.filter(t => t.period.includes(q) || t.currency.toLowerCase().includes(q))
  }, [transactions, searchQuery])

  // Actions
  async function handleCreatePolicy() {
    setSaving(true)
    try {
      const benchmarkRange = policyForm.benchmarkLow || policyForm.benchmarkHigh
        ? JSON.stringify({ low: parseFloat(policyForm.benchmarkLow) || 0, median: parseFloat(policyForm.benchmarkMedian) || 0, high: parseFloat(policyForm.benchmarkHigh) || 0 })
        : undefined
      await apiPost({
        action: 'create-policy',
        name: policyForm.name,
        description: policyForm.description,
        pricingMethod: policyForm.pricingMethod,
        entityFrom: policyForm.entityFrom,
        entityTo: policyForm.entityTo,
        transactionType: policyForm.transactionType,
        markup: policyForm.markup ? parseFloat(policyForm.markup) : undefined,
        benchmarkRange,
        effectiveDate: policyForm.effectiveDate,
        expiryDate: policyForm.expiryDate || undefined,
        status: policyForm.status,
      })
      addToast?.('Policy created', 'success')
      setShowPolicyModal(false)
      setPolicyForm({ name: '', description: '', pricingMethod: 'cost_plus', entityFrom: '', entityTo: '', transactionType: 'services', markup: '', benchmarkLow: '', benchmarkMedian: '', benchmarkHigh: '', effectiveDate: '', expiryDate: '', status: 'active' })
      loadAll()
    } catch (e: any) {
      addToast?.(e.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleCreateTransaction() {
    setSaving(true)
    try {
      await apiPost({
        action: 'create-transaction',
        policyId: txnForm.policyId,
        period: txnForm.period,
        amount: Math.round(parseFloat(txnForm.amount) * 100),
        currency: txnForm.currency,
        markupApplied: txnForm.markupApplied ? parseFloat(txnForm.markupApplied) : undefined,
        notes: txnForm.notes,
      })
      addToast?.('Transaction recorded', 'success')
      setShowTxnModal(false)
      setTxnForm({ policyId: '', period: '', amount: '', currency: 'USD', markupApplied: '', notes: '' })
      loadAll()
    } catch (e: any) {
      addToast?.(e.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleGenerateReport() {
    setSaving(true)
    try {
      const actionMap: Record<string, string> = {
        master_file: 'generate-master-file',
        local_file: 'generate-local-file',
        cbcr: 'generate-cbcr',
      }
      await apiPost({
        action: actionMap[reportForm.reportType],
        fiscalYear: reportForm.fiscalYear,
        entity: reportForm.entity,
      })
      addToast?.('Report generated', 'success')
      setShowReportModal(false)
      loadAll()
    } catch (e: any) {
      addToast?.(e.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  // Demo data for display when DB is empty
  const demoPolicies: Policy[] = useMemo(() => policies.length > 0 ? [] : [
    { id: '1', orgId: '', name: 'US-UK Services Agreement', description: 'Management consulting services from US HQ to UK subsidiary', pricingMethod: 'cost_plus', entityFrom: 'Acme Corp (US)', entityTo: 'Acme UK Ltd', transactionType: 'services', markup: 8, benchmarkRange: JSON.stringify({ low: 5, median: 8, high: 12 }), effectiveDate: '2025-01-01', expiryDate: '2025-12-31', status: 'active', createdAt: '2025-01-01' },
    { id: '2', orgId: '', name: 'US-Germany IP License', description: 'Software license from US to Germany', pricingMethod: 'tnmm', entityFrom: 'Acme Corp (US)', entityTo: 'Acme GmbH', transactionType: 'ip_license', markup: 15, benchmarkRange: JSON.stringify({ low: 10, median: 14, high: 18 }), effectiveDate: '2025-01-01', expiryDate: null, status: 'active', createdAt: '2025-01-15' },
    { id: '3', orgId: '', name: 'Singapore-India Management Fees', description: 'Regional HQ management fees', pricingMethod: 'cost_plus', entityFrom: 'Acme SG Pte Ltd', entityTo: 'Acme India Pvt Ltd', transactionType: 'management_fees', markup: 6, benchmarkRange: JSON.stringify({ low: 3, median: 6, high: 9 }), effectiveDate: '2025-04-01', expiryDate: null, status: 'under_review', createdAt: '2025-04-01' },
    { id: '4', orgId: '', name: 'US-Brazil Goods Transfer', description: 'Manufactured components from US to Brazil', pricingMethod: 'resale_price', entityFrom: 'Acme Corp (US)', entityTo: 'Acme Brasil Ltda', transactionType: 'goods', markup: 22, benchmarkRange: JSON.stringify({ low: 15, median: 20, high: 25 }), effectiveDate: '2025-01-01', expiryDate: null, status: 'active', createdAt: '2025-02-01' },
  ], [policies])

  const demoTransactions: Transaction[] = useMemo(() => transactions.length > 0 ? [] : [
    { id: '1', orgId: '', policyId: '1', period: '2025-01', amount: 15000000, currency: 'USD', markupApplied: 8, armLengthCompliant: true, notes: null, createdAt: '2025-02-01' },
    { id: '2', orgId: '', policyId: '1', period: '2025-02', amount: 12500000, currency: 'USD', markupApplied: 8, armLengthCompliant: true, notes: null, createdAt: '2025-03-01' },
    { id: '3', orgId: '', policyId: '2', period: '2025-01', amount: 50000000, currency: 'EUR', markupApplied: 15, armLengthCompliant: true, notes: null, createdAt: '2025-02-01' },
    { id: '4', orgId: '', policyId: '3', period: '2025-04', amount: 8000000, currency: 'USD', markupApplied: 6, armLengthCompliant: true, notes: null, createdAt: '2025-05-01' },
    { id: '5', orgId: '', policyId: '4', period: '2025-03', amount: 25000000, currency: 'USD', markupApplied: 22, armLengthCompliant: true, notes: 'Q1 shipment', createdAt: '2025-04-01' },
  ], [transactions])

  const demoReports: Report[] = useMemo(() => reports.length > 0 ? [] : [
    { id: '1', orgId: '', fiscalYear: '2024', reportType: 'master_file', status: 'approved', content: null, generatedAt: '2025-03-15', createdAt: '2025-03-15' },
    { id: '2', orgId: '', fiscalYear: '2024', reportType: 'cbcr', status: 'draft', content: null, generatedAt: '2025-04-01', createdAt: '2025-04-01' },
    { id: '3', orgId: '', fiscalYear: '2025', reportType: 'master_file', status: 'draft', content: null, generatedAt: null, createdAt: '2025-06-01' },
  ], [reports])

  const demoCompliance: ComplianceSummary = useMemo(() => compliance || {
    totalPolicies: 4, compliant: 3, nonCompliant: 1, noData: 0, complianceRate: 75,
    details: [
      { policyId: '1', compliant: true, actualMarkup: 8, benchmark: { low: 5, median: 8, high: 12 }, deviation: 0, reason: "Markup of 8% is within the arm's length range [5%-12%]" },
      { policyId: '2', compliant: true, actualMarkup: 15, benchmark: { low: 10, median: 14, high: 18 }, deviation: 0, reason: "Markup of 15% is within the arm's length range [10%-18%]" },
      { policyId: '3', compliant: true, actualMarkup: 6, benchmark: { low: 3, median: 6, high: 9 }, deviation: 0, reason: "Markup of 6% is within the arm's length range [3%-9%]" },
      { policyId: '4', compliant: false, actualMarkup: 22, benchmark: { low: 15, median: 20, high: 25 }, deviation: 0, reason: "Markup of 22% is within range but near high end — recommend review" },
    ],
  }, [compliance])

  const displayPolicies = filteredPolicies.length > 0 ? filteredPolicies : demoPolicies
  const displayTransactions = filteredTransactions.length > 0 ? filteredTransactions : demoTransactions
  const displayReports = reports.length > 0 ? reports : demoReports
  const displayCompliance = demoCompliance

  const totalVolume = (displayTransactions).reduce((s, t) => s + t.amount, 0)
  const entities = new Set([...displayPolicies.flatMap(p => [p.entityFrom, p.entityTo])])

  if (pageLoading) return <PageSkeleton />

  const tabs = [
    { key: 'policies' as const, label: 'Policies', icon: <Scale size={16} /> },
    { key: 'transactions' as const, label: 'Transactions', icon: <ArrowRightLeft size={16} /> },
    { key: 'reports' as const, label: 'Reports', icon: <FileText size={16} /> },
    { key: 'compliance' as const, label: 'Compliance Dashboard', icon: <ShieldCheck size={16} /> },
  ]

  return (
    <div className="flex flex-col h-full">
      <Header title="Transfer Pricing Documentation" subtitle="OECD-compliant intercompany transfer pricing management" actions={
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-sm border rounded-lg bg-white dark:bg-zinc-900 w-56"
            />
          </div>
          <Button variant="outline" size="sm" onClick={() => loadAll()}>
            <RefreshCw size={14} className="mr-1" /> Refresh
          </Button>
        </div>
      } />

      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard label="Active Policies" value={displayPolicies.filter(p => p.status === 'active').length} icon={<Scale size={20} />} />
          <StatCard label="Intercompany Entities" value={entities.size} icon={<Building2 size={20} />} />
          <StatCard label="Total Volume (YTD)" value={formatCurrency(totalVolume, defaultCurrency)} icon={<DollarSign size={20} />} />
          <StatCard label="Compliance Rate" value={`${displayCompliance.complianceRate}%`} icon={<ShieldCheck size={20} />} />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-zinc-500 hover:text-zinc-700'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Policies Tab */}
        {activeTab === 'policies' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Transfer Pricing Policies</h3>
              <Button size="sm" onClick={() => setShowPolicyModal(true)}>
                <Plus size={14} className="mr-1" /> New Policy
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-zinc-500">
                    <th className="pb-2 font-medium">Policy Name</th>
                    <th className="pb-2 font-medium">From</th>
                    <th className="pb-2 font-medium">To</th>
                    <th className="pb-2 font-medium">Method</th>
                    <th className="pb-2 font-medium">Type</th>
                    <th className="pb-2 font-medium">Markup</th>
                    <th className="pb-2 font-medium">Benchmark</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium">Effective</th>
                  </tr>
                </thead>
                <tbody>
                  {displayPolicies.map(policy => {
                    const benchmark = policy.benchmarkRange ? JSON.parse(policy.benchmarkRange) : null
                    return (
                      <tr key={policy.id} className="border-b hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                        <td className="py-3">
                          <div className="font-medium">{policy.name}</div>
                          {policy.description && <div className="text-xs text-zinc-500 mt-0.5">{policy.description}</div>}
                        </td>
                        <td className="py-3">{policy.entityFrom}</td>
                        <td className="py-3">{policy.entityTo}</td>
                        <td className="py-3"><Badge variant="info">{policy.pricingMethod.replace(/_/g, ' ').toUpperCase()}</Badge></td>
                        <td className="py-3 capitalize">{policy.transactionType.replace(/_/g, ' ')}</td>
                        <td className="py-3">{policy.markup != null ? `${policy.markup}%` : '--'}</td>
                        <td className="py-3 text-xs">
                          {benchmark ? `${benchmark.low}% - ${benchmark.high}% (med: ${benchmark.median}%)` : '--'}
                        </td>
                        <td className="py-3">{statusBadge(policy.status)}</td>
                        <td className="py-3 text-zinc-500">{policy.effectiveDate}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {displayPolicies.length === 0 && (
                <div className="text-center py-12 text-zinc-400">No policies found</div>
              )}
            </div>
          </div>
        )}

        {/* Transactions Tab */}
        {activeTab === 'transactions' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Intercompany Transactions</h3>
              <Button size="sm" onClick={() => setShowTxnModal(true)}>
                <Plus size={14} className="mr-1" /> Record Transaction
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-zinc-500">
                    <th className="pb-2 font-medium">Period</th>
                    <th className="pb-2 font-medium">Policy</th>
                    <th className="pb-2 font-medium">Amount</th>
                    <th className="pb-2 font-medium">Currency</th>
                    <th className="pb-2 font-medium">Markup Applied</th>
                    <th className="pb-2 font-medium">Arm&apos;s Length</th>
                    <th className="pb-2 font-medium">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {displayTransactions.map(txn => {
                    const policy = displayPolicies.find(p => p.id === txn.policyId)
                    return (
                      <tr key={txn.id} className="border-b hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                        <td className="py-3 font-medium">{txn.period}</td>
                        <td className="py-3">{policy?.name || txn.policyId}</td>
                        <td className="py-3">{formatCurrency(txn.amount, txn.currency)}</td>
                        <td className="py-3">{txn.currency}</td>
                        <td className="py-3">{txn.markupApplied != null ? `${txn.markupApplied}%` : '--'}</td>
                        <td className="py-3">
                          {txn.armLengthCompliant ? (
                            <Badge variant="success"><Check size={12} className="mr-1" />Compliant</Badge>
                          ) : (
                            <Badge variant="error"><X size={12} className="mr-1" />Non-compliant</Badge>
                          )}
                        </td>
                        <td className="py-3 text-zinc-500">{txn.notes || '--'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {displayTransactions.length === 0 && (
                <div className="text-center py-12 text-zinc-400">No transactions recorded</div>
              )}
            </div>
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">TP Documentation Reports</h3>
              <Button size="sm" onClick={() => setShowReportModal(true)}>
                <Plus size={14} className="mr-1" /> Generate Report
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {displayReports.map(report => (
                <Card key={report.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <FileText size={16} className="text-blue-500" />
                        <span className="font-medium capitalize">{report.reportType.replace(/_/g, ' ')}</span>
                      </div>
                      <div className="text-sm text-zinc-500 mt-1">FY {report.fiscalYear}</div>
                    </div>
                    {statusBadge(report.status)}
                  </div>
                  <div className="mt-3 text-xs text-zinc-400">
                    {report.generatedAt ? `Generated: ${new Date(report.generatedAt).toLocaleDateString()}` : 'Not yet generated'}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button variant="outline" size="sm" className="text-xs">
                      <Download size={12} className="mr-1" /> Export
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
            {displayReports.length === 0 && (
              <div className="text-center py-12 text-zinc-400">No reports generated</div>
            )}
          </div>
        )}

        {/* Compliance Dashboard Tab */}
        {activeTab === 'compliance' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Compliance Dashboard</h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="p-4 text-center">
                <div className="text-3xl font-bold text-green-600">{displayCompliance.compliant}</div>
                <div className="text-sm text-zinc-500 mt-1">Compliant</div>
              </Card>
              <Card className="p-4 text-center">
                <div className="text-3xl font-bold text-red-600">{displayCompliance.nonCompliant}</div>
                <div className="text-sm text-zinc-500 mt-1">Non-Compliant</div>
              </Card>
              <Card className="p-4 text-center">
                <div className="text-3xl font-bold text-zinc-400">{displayCompliance.noData}</div>
                <div className="text-sm text-zinc-500 mt-1">No Data</div>
              </Card>
              <Card className="p-4 text-center">
                <div className={`text-3xl font-bold ${displayCompliance.complianceRate >= 80 ? 'text-green-600' : 'text-amber-500'}`}>
                  {displayCompliance.complianceRate}%
                </div>
                <div className="text-sm text-zinc-500 mt-1">Overall Compliance</div>
              </Card>
            </div>

            <Card className="p-4">
              <h4 className="font-medium mb-3">Policy Compliance Details</h4>
              <div className="space-y-3">
                {displayCompliance.details.map((detail, i) => {
                  const policy = displayPolicies.find(p => p.id === detail.policyId)
                  return (
                    <div key={i} className={`p-3 rounded-lg border ${detail.compliant ? 'border-green-200 bg-green-50 dark:bg-green-900/10' : 'border-red-200 bg-red-50 dark:bg-red-900/10'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {detail.compliant ? <Check size={16} className="text-green-600" /> : <AlertTriangle size={16} className="text-red-600" />}
                          <span className="font-medium">{policy?.name || `Policy ${detail.policyId}`}</span>
                        </div>
                        <Badge variant={detail.compliant ? 'success' : 'error'}>
                          {detail.compliant ? 'Compliant' : 'Non-Compliant'}
                        </Badge>
                      </div>
                      <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{detail.reason}</div>
                      {detail.benchmark && (
                        <div className="mt-2 flex items-center gap-4 text-xs text-zinc-500">
                          <span>Actual: <strong>{detail.actualMarkup}%</strong></span>
                          <span>Range: {detail.benchmark.low}% - {detail.benchmark.high}%</span>
                          <span>Median: {detail.benchmark.median}%</span>
                        </div>
                      )}
                      {detail.benchmark && (
                        <div className="mt-2 h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full relative">
                          <div
                            className="absolute h-full bg-blue-200 rounded-full"
                            style={{
                              left: `${(detail.benchmark.low / 30) * 100}%`,
                              width: `${((detail.benchmark.high - detail.benchmark.low) / 30) * 100}%`,
                            }}
                          />
                          <div
                            className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white ${detail.compliant ? 'bg-green-500' : 'bg-red-500'}`}
                            style={{ left: `${(detail.actualMarkup / 30) * 100}%` }}
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Policy Modal */}
      <Modal open={showPolicyModal} onClose={() => setShowPolicyModal(false)} title="New Transfer Pricing Policy">
        <div className="space-y-4 p-4">
          <Input label="Policy Name" value={policyForm.name} onChange={e => setPolicyForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. US-UK Services Agreement" />
          <Textarea label="Description" value={policyForm.description} onChange={e => setPolicyForm(f => ({ ...f, description: e.target.value }))} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Entity From" value={policyForm.entityFrom} onChange={e => setPolicyForm(f => ({ ...f, entityFrom: e.target.value }))} placeholder="e.g. Acme Corp (US)" />
            <Input label="Entity To" value={policyForm.entityTo} onChange={e => setPolicyForm(f => ({ ...f, entityTo: e.target.value }))} placeholder="e.g. Acme UK Ltd" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select label="Pricing Method" value={policyForm.pricingMethod} onChange={e => setPolicyForm(f => ({ ...f, pricingMethod: e.target.value }))} options={PRICING_METHODS} />
            <Select label="Transaction Type" value={policyForm.transactionType} onChange={e => setPolicyForm(f => ({ ...f, transactionType: e.target.value }))} options={TRANSACTION_TYPES} />
          </div>
          <Input label="Markup (%)" type="number" value={policyForm.markup} onChange={e => setPolicyForm(f => ({ ...f, markup: e.target.value }))} placeholder="e.g. 8" />
          <div className="grid grid-cols-3 gap-4">
            <Input label="Benchmark Low (%)" type="number" value={policyForm.benchmarkLow} onChange={e => setPolicyForm(f => ({ ...f, benchmarkLow: e.target.value }))} />
            <Input label="Benchmark Median (%)" type="number" value={policyForm.benchmarkMedian} onChange={e => setPolicyForm(f => ({ ...f, benchmarkMedian: e.target.value }))} />
            <Input label="Benchmark High (%)" type="number" value={policyForm.benchmarkHigh} onChange={e => setPolicyForm(f => ({ ...f, benchmarkHigh: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Effective Date" type="date" value={policyForm.effectiveDate} onChange={e => setPolicyForm(f => ({ ...f, effectiveDate: e.target.value }))} />
            <Input label="Expiry Date" type="date" value={policyForm.expiryDate} onChange={e => setPolicyForm(f => ({ ...f, expiryDate: e.target.value }))} />
          </div>
          <Select label="Status" value={policyForm.status} onChange={e => setPolicyForm(f => ({ ...f, status: e.target.value }))} options={STATUSES} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowPolicyModal(false)}>Cancel</Button>
            <Button onClick={handleCreatePolicy} disabled={saving || !policyForm.name || !policyForm.entityFrom || !policyForm.entityTo}>
              {saving ? 'Creating...' : 'Create Policy'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Transaction Modal */}
      <Modal open={showTxnModal} onClose={() => setShowTxnModal(false)} title="Record Transaction">
        <div className="space-y-4 p-4">
          <Select label="Policy" value={txnForm.policyId} onChange={e => setTxnForm(f => ({ ...f, policyId: e.target.value }))} options={displayPolicies.map(p => ({ value: p.id, label: p.name }))} />
          <Input label="Period (YYYY-MM)" value={txnForm.period} onChange={e => setTxnForm(f => ({ ...f, period: e.target.value }))} placeholder="2025-01" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Amount" type="number" value={txnForm.amount} onChange={e => setTxnForm(f => ({ ...f, amount: e.target.value }))} placeholder="150000" />
            <Input label="Currency" value={txnForm.currency} onChange={e => setTxnForm(f => ({ ...f, currency: e.target.value }))} />
          </div>
          <Input label="Markup Applied (%)" type="number" value={txnForm.markupApplied} onChange={e => setTxnForm(f => ({ ...f, markupApplied: e.target.value }))} />
          <Textarea label="Notes" value={txnForm.notes} onChange={e => setTxnForm(f => ({ ...f, notes: e.target.value }))} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowTxnModal(false)}>Cancel</Button>
            <Button onClick={handleCreateTransaction} disabled={saving || !txnForm.policyId || !txnForm.period || !txnForm.amount}>
              {saving ? 'Saving...' : 'Record Transaction'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Report Generation Modal */}
      <Modal open={showReportModal} onClose={() => setShowReportModal(false)} title="Generate TP Report">
        <div className="space-y-4 p-4">
          <Select label="Report Type" value={reportForm.reportType} onChange={e => setReportForm(f => ({ ...f, reportType: e.target.value }))} options={REPORT_TYPES} />
          <Input label="Fiscal Year" value={reportForm.fiscalYear} onChange={e => setReportForm(f => ({ ...f, fiscalYear: e.target.value }))} placeholder="2025" />
          {reportForm.reportType === 'local_file' && (
            <Input label="Entity Name" value={reportForm.entity} onChange={e => setReportForm(f => ({ ...f, entity: e.target.value }))} placeholder="e.g. Acme UK Ltd" />
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowReportModal(false)}>Cancel</Button>
            <Button onClick={handleGenerateReport} disabled={saving || !reportForm.fiscalYear}>
              {saving ? 'Generating...' : 'Generate Report'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
