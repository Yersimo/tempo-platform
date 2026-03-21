'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { Header } from '@/components/layout/header'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/ui/stat-card'
import { Modal } from '@/components/ui/modal'
import { Input, Select, Textarea } from '@/components/ui/input'
import { PageSkeleton } from '@/components/ui/page-skeleton'
import {
  Building2, Plus, DollarSign, GitBranch, ArrowRightLeft,
  FileText, Globe, TrendingUp, Check, X, Download,
  ChevronDown, ChevronRight, RefreshCw, AlertTriangle, Search,
} from 'lucide-react'
import { useTempo, useOrgCurrency } from '@/lib/store'
import { formatCurrency } from '@/lib/utils/format-currency'
import { exportToCSV } from '@/lib/export-import'

// ---- Types ----
type EntityGroup = {
  id: string
  name: string
  description?: string
  parentOrgId: string
  consolidationCurrency: string
  fiscalYearEnd: string
  createdAt: string
}

type EntityMember = {
  id: string
  groupId: string
  orgId: string
  entityName: string
  entityType: string
  country: string
  localCurrency: string
  ownershipPercent: number
  consolidationMethod: string
  isActive: boolean
}

type ICTransaction = {
  id: string
  groupId: string
  fromOrgId: string
  toOrgId: string
  transactionType: string
  description: string
  amount: number
  currency: string
  date: string
  status: string
  referenceNumber: string
  fromEntityConfirmed: boolean
  toEntityConfirmed: boolean
}

type FxRate = {
  id: string
  groupId: string
  fromCurrency: string
  toCurrency: string
  rate: string
  rateType: string
  effectiveDate: string
  source: string
}

type ConsolidationReport = {
  id: string
  groupId: string
  reportType: string
  periodStart: string
  periodEnd: string
  status: string
  reportData?: string
  eliminationEntries?: string
  fxRates?: string
}

type ConsolidatedData = {
  groupName: string
  consolidationCurrency: string
  lineItems: { label: string; entities: Record<string, number>; eliminations: number; consolidated: number }[]
  eliminationEntries: { description: string; debit: number; credit: number; fromEntity: string; toEntity: string }[]
  totals: { revenue: number; payrollCosts: number; operatingExpenses: number; intercompanyEliminations: number; netIncome: number; headcount: number }
  entityBreakdown: { orgId: string; entityName: string; revenue: number; payrollCosts: number; operatingExpenses: number; headcount: number }[]
}

// ---- Helpers ----
const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR', 'BRL', 'MXN', 'SGD', 'HKD', 'KRW', 'SEK', 'NOK', 'DKK', 'ZAR', 'NZD', 'PLN']
const ENTITY_TYPES = [
  { value: 'parent', label: 'Parent / HQ' },
  { value: 'subsidiary', label: 'Subsidiary' },
  { value: 'branch', label: 'Branch' },
  { value: 'joint_venture', label: 'Joint Venture' },
]
const CONSOLIDATION_METHODS = [
  { value: 'full', label: 'Full Consolidation' },
  { value: 'proportional', label: 'Proportional' },
  { value: 'equity', label: 'Equity Method' },
]
const IC_TYPES = [
  { value: 'service_fee', label: 'Service Fee' },
  { value: 'loan', label: 'Intercompany Loan' },
  { value: 'dividend', label: 'Dividend' },
  { value: 'transfer_pricing', label: 'Transfer Pricing' },
  { value: 'cost_allocation', label: 'Cost Allocation' },
]
const REPORT_TYPES = [
  { value: 'income_statement', label: 'Income Statement (P&L)' },
  { value: 'balance_sheet', label: 'Balance Sheet' },
  { value: 'cash_flow', label: 'Cash Flow Statement' },
  { value: 'headcount', label: 'Headcount Report' },
]

function statusBadge(status: string) {
  const colors: Record<string, 'warning' | 'info' | 'success' | 'default' | 'error'> = {
    pending: 'warning', confirmed: 'info', eliminated: 'success', draft: 'default', in_review: 'warning', approved: 'success', published: 'info',
  }
  return <Badge variant={colors[status] || 'default'}>{status.replace(/_/g, ' ')}</Badge>
}

async function apiGet(action: string, params: Record<string, string> = {}) {
  const qs = new URLSearchParams({ action, ...params }).toString()
  const res = await fetch(`/api/consolidation?${qs}`)
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'API error')
  return json.data
}

async function apiPost(body: Record<string, unknown>) {
  const res = await fetch('/api/consolidation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'API error')
  return json.data
}

// ---- Main Page ----

export default function ConsolidationPage() {
  const defaultCurrency = useOrgCurrency()
  const { addToast } = useTempo()

  const [pageLoading, setPageLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'entities' | 'intercompany' | 'reports' | 'fx-rates' | 'eliminations'>('overview')

  // Data
  const [groups, setGroups] = useState<EntityGroup[]>([])
  const [selectedGroupId, setSelectedGroupId] = useState<string>('')
  const [members, setMembers] = useState<EntityMember[]>([])
  const [icTransactions, setIcTransactions] = useState<ICTransaction[]>([])
  const [fxRates, setFxRates] = useState<FxRate[]>([])
  const [reports, setReports] = useState<ConsolidationReport[]>([])
  const [consolidatedData, setConsolidatedData] = useState<ConsolidatedData | null>(null)

  // Modals
  const [showGroupModal, setShowGroupModal] = useState(false)
  const [showMemberModal, setShowMemberModal] = useState(false)
  const [showICModal, setShowICModal] = useState(false)
  const [showFxModal, setShowFxModal] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [saving, setSaving] = useState(false)

  // Forms
  const [groupForm, setGroupForm] = useState({ name: '', description: '', consolidationCurrency: 'USD', fiscalYearEnd: '12-31' })
  const [memberForm, setMemberForm] = useState({ orgId: '', entityName: '', entityType: 'subsidiary', country: '', localCurrency: 'USD', ownershipPercent: '100', consolidationMethod: 'full' })
  const [icForm, setIcForm] = useState({ fromOrgId: '', toOrgId: '', transactionType: 'service_fee', description: '', amount: '', currency: 'USD', date: '' })
  const [fxForm, setFxForm] = useState({ fromCurrency: '', toCurrency: 'USD', rate: '', rateType: 'closing', effectiveDate: '' })
  const [reportForm, setReportForm] = useState({ reportType: 'income_statement', periodStart: '', periodEnd: '' })

  // Search
  const [searchQuery, setSearchQuery] = useState('')

  // Expanded entity tree items
  const [expandedEntities, setExpandedEntities] = useState<Set<string>>(new Set())

  // Load groups on mount
  useEffect(() => {
    loadGroups()
    const t = setTimeout(() => setPageLoading(false), 2000)
    return () => clearTimeout(t)
  }, [])

  // When group changes, reload associated data
  useEffect(() => {
    if (selectedGroupId) {
      loadGroupData(selectedGroupId)
    }
  }, [selectedGroupId])

  async function loadGroups() {
    try {
      const data = await apiGet('list-groups')
      setGroups(data || [])
      if (data?.length > 0 && !selectedGroupId) {
        setSelectedGroupId(data[0].id)
      }
    } catch {
      // Demo mode: no real DB
      setGroups([])
    } finally {
      setPageLoading(false)
    }
  }

  async function loadGroupData(groupId: string) {
    try {
      const [membersData, icData, fxData, reportsData] = await Promise.all([
        apiGet('list-members', { groupId }),
        apiGet('list-ic-transactions', { groupId }),
        apiGet('list-fx-rates', { groupId }),
        apiGet('list-reports', { groupId }),
      ])
      setMembers(membersData || [])
      setIcTransactions(icData || [])
      setFxRates(fxData || [])
      setReports(reportsData || [])
    } catch {
      // Silently fail for demo
    }
  }

  // ---- CRUD handlers ----

  async function createGroup() {
    if (!groupForm.name.trim()) { addToast('Group name is required', 'error'); return }
    setSaving(true)
    try {
      const group = await apiPost({ action: 'create-group', ...groupForm })
      setGroups(prev => [...prev, group])
      setSelectedGroupId(group.id)
      setShowGroupModal(false)
      addToast('Entity group created', 'success')
    } catch (err: any) {
      addToast(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  async function addMember() {
    if (!memberForm.entityName.trim() || !memberForm.country.trim()) {
      addToast('Entity name and country are required', 'error'); return
    }
    setSaving(true)
    try {
      const member = await apiPost({
        action: 'add-member',
        groupId: selectedGroupId,
        ...memberForm,
        ownershipPercent: parseInt(memberForm.ownershipPercent) || 100,
      })
      setMembers(prev => [...prev, member])
      setShowMemberModal(false)
      addToast('Entity added to group', 'success')
    } catch (err: any) {
      addToast(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  async function removeMember(memberId: string) {
    try {
      await apiPost({ action: 'remove-member', memberId })
      setMembers(prev => prev.filter(m => m.id !== memberId))
      addToast('Entity removed', 'success')
    } catch (err: any) {
      addToast(err.message, 'error')
    }
  }

  async function recordIC() {
    if (!icForm.description.trim() || !icForm.amount || !icForm.date) {
      addToast('Description, amount, and date are required', 'error'); return
    }
    setSaving(true)
    try {
      const txn = await apiPost({
        action: 'record-ic-transaction',
        groupId: selectedGroupId,
        ...icForm,
        amount: Math.round(parseFloat(icForm.amount) * 100), // convert to cents
      })
      setIcTransactions(prev => [...prev, txn])
      setShowICModal(false)
      addToast('Intercompany transaction recorded', 'success')
    } catch (err: any) {
      addToast(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  async function confirmIC(txnId: string, side: 'from' | 'to') {
    try {
      const txn = await apiPost({ action: 'confirm-ic-transaction', txnId, side })
      setIcTransactions(prev => prev.map(t => t.id === txnId ? { ...t, ...txn } : t))
      addToast(`${side === 'from' ? 'Sender' : 'Receiver'} confirmed`, 'success')
    } catch (err: any) {
      addToast(err.message, 'error')
    }
  }

  async function addFxRate() {
    if (!fxForm.fromCurrency || !fxForm.rate || !fxForm.effectiveDate) {
      addToast('Currency, rate, and date are required', 'error'); return
    }
    setSaving(true)
    try {
      const rate = await apiPost({
        action: 'set-fx-rate',
        groupId: selectedGroupId,
        ...fxForm,
      })
      setFxRates(prev => [rate, ...prev])
      setShowFxModal(false)
      addToast('FX rate added', 'success')
    } catch (err: any) {
      addToast(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  async function generateReport() {
    if (!reportForm.periodStart || !reportForm.periodEnd) {
      addToast('Period start and end dates are required', 'error'); return
    }
    setSaving(true)
    try {
      const report = await apiPost({
        action: 'generate-report',
        groupId: selectedGroupId,
        ...reportForm,
      })
      setConsolidatedData(report)
      setReports(prev => [{ id: report.id || '', groupId: selectedGroupId, ...reportForm, status: 'draft' }, ...prev])
      setShowReportModal(false)
      setActiveTab('reports')
      addToast('Consolidation report generated', 'success')
    } catch (err: any) {
      addToast(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  async function viewReport(report: ConsolidationReport) {
    if (report.reportData) {
      try {
        setConsolidatedData(JSON.parse(report.reportData))
      } catch {
        addToast('Failed to parse report data', 'error')
      }
    } else {
      try {
        const full = await apiGet('get-report', { reportId: report.id })
        if (full?.reportData) {
          setConsolidatedData(JSON.parse(full.reportData))
        }
      } catch (err: any) {
        addToast(err.message, 'error')
      }
    }
  }

  async function eliminateIC() {
    if (!reportForm.periodStart || !reportForm.periodEnd) {
      addToast('Set period dates first', 'error'); return
    }
    try {
      const result = await apiPost({
        action: 'eliminate-ic-transactions',
        groupId: selectedGroupId,
        periodStart: reportForm.periodStart,
        periodEnd: reportForm.periodEnd,
      })
      addToast(`${result.eliminatedCount} transactions eliminated`, 'success')
      loadGroupData(selectedGroupId)
    } catch (err: any) {
      addToast(err.message, 'error')
    }
  }

  // Export consolidated report to CSV
  function exportReport() {
    if (!consolidatedData) return
    const rows = consolidatedData.lineItems.map(item => ({
      'Line Item': item.label,
      'Consolidated': item.consolidated / 100,
      'Eliminations': item.eliminations / 100,
    }))
    const columns = Object.keys(rows[0] || {}).map(key => ({
      header: key,
      accessor: (row: Record<string, unknown>) => row[key] as string | number,
    }))
    exportToCSV(rows, columns, `consolidation-report-${new Date().toISOString().split('T')[0]}`)
    addToast('Report exported to CSV', 'success')
  }

  // ---- Computed ----
  const selectedGroup = groups.find(g => g.id === selectedGroupId)
  const parentEntity = members.find(m => m.entityType === 'parent')
  const subsidiaries = members.filter(m => m.entityType !== 'parent')
  const pendingICCount = icTransactions.filter(t => t.status === 'pending').length
  const confirmedICCount = icTransactions.filter(t => t.status === 'confirmed').length
  const totalICAmount = icTransactions.reduce((sum, t) => sum + t.amount, 0)

  const filteredICTransactions = useMemo(() => {
    if (!searchQuery) return icTransactions
    const q = searchQuery.toLowerCase()
    return icTransactions.filter(t =>
      t.description.toLowerCase().includes(q) ||
      t.referenceNumber?.toLowerCase().includes(q) ||
      t.transactionType.toLowerCase().includes(q)
    )
  }, [icTransactions, searchQuery])

  function getMemberName(orgId: string) {
    return members.find(m => m.orgId === orgId)?.entityName || orgId
  }

  // Toggle tree expansion
  function toggleEntity(id: string) {
    setExpandedEntities(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (pageLoading) {
    return (
      <>
        <Header title="Entity Consolidation" subtitle="Multi-entity financial consolidation" actions={<Button size="sm" disabled><Plus size={14} /> New Group</Button>} />
        <div className="p-6"><PageSkeleton /></div>
      </>
    )
  }

  const TABS = [
    { key: 'overview' as const, label: 'Overview', icon: Building2 },
    { key: 'entities' as const, label: 'Entities', icon: GitBranch },
    { key: 'intercompany' as const, label: 'Intercompany', icon: ArrowRightLeft },
    { key: 'reports' as const, label: 'Reports', icon: FileText },
    { key: 'fx-rates' as const, label: 'FX Rates', icon: Globe },
    { key: 'eliminations' as const, label: 'Eliminations', icon: X },
  ]

  return (
    <>
      <Header
        title="Entity Consolidation"
        subtitle="Multi-entity financial consolidation and reporting"
        actions={
          <div className="flex items-center gap-2">
            {selectedGroupId && (
              <Button size="sm" variant="secondary" onClick={() => { setReportForm({ reportType: 'income_statement', periodStart: '', periodEnd: '' }); setShowReportModal(true) }}>
                <FileText size={14} /> Generate Report
              </Button>
            )}
            <Button size="sm" onClick={() => { setGroupForm({ name: '', description: '', consolidationCurrency: 'USD', fiscalYearEnd: '12-31' }); setShowGroupModal(true) }}>
              <Plus size={14} /> New Group
            </Button>
          </div>
        }
      />

      {/* Group selector */}
      {groups.length > 0 && (
        <div className="flex items-center gap-3 mb-6">
          <span className="text-sm text-t2 font-medium">Entity Group:</span>
          <select
            value={selectedGroupId}
            onChange={e => setSelectedGroupId(e.target.value)}
            className="text-sm rounded-lg border border-border bg-surface text-t1 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-accent/30"
          >
            {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
          {selectedGroup && (
            <Badge variant="info">{selectedGroup.consolidationCurrency}</Badge>
          )}
        </div>
      )}

      {groups.length === 0 && (
        <Card className="p-12 text-center">
          <Building2 size={48} className="mx-auto text-t3 mb-4" />
          <h3 className="text-lg font-semibold text-t1 mb-2">No Entity Groups</h3>
          <p className="text-sm text-t3 mb-4">Create an entity group to begin consolidating financials across your subsidiaries.</p>
          <Button onClick={() => { setGroupForm({ name: '', description: '', consolidationCurrency: 'USD', fiscalYearEnd: '12-31' }); setShowGroupModal(true) }}>
            <Plus size={14} /> Create Entity Group
          </Button>
        </Card>
      )}

      {selectedGroupId && (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard label="Total Entities" value={members.length} icon={<Building2 size={20} />} />
            <StatCard label="IC Transactions" value={icTransactions.length} icon={<ArrowRightLeft size={20} />} />
            <StatCard label="Pending Confirmations" value={pendingICCount} icon={<AlertTriangle size={20} />} change={pendingICCount > 0 ? 'Action needed' : 'All clear'} changeType={pendingICCount > 0 ? 'negative' : 'positive'} />
            <StatCard label="Total IC Volume" value={formatCurrency(totalICAmount, selectedGroup?.consolidationCurrency || 'USD')} icon={<DollarSign size={20} />} />
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 border-b border-border mb-6 overflow-x-auto">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'border-accent text-accent'
                    : 'border-transparent text-t3 hover:text-t1 hover:border-border'
                }`}
              >
                <tab.icon size={14} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* ===== Overview Tab ===== */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Entity Tree */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><GitBranch size={16} /> Organization Structure</CardTitle>
                </CardHeader>
                <div className="px-4 pb-4">
                  {parentEntity ? (
                    <div className="space-y-1">
                      <button
                        onClick={() => toggleEntity(parentEntity.id)}
                        className="flex items-center gap-2 w-full text-left p-2 rounded-lg hover:bg-surface-hover"
                      >
                        {expandedEntities.has(parentEntity.id) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        <Building2 size={16} className="text-accent" />
                        <span className="font-medium text-t1">{parentEntity.entityName}</span>
                        <Badge variant="info" className="ml-auto">Parent</Badge>
                        <span className="text-xs text-t3">{parentEntity.country} / {parentEntity.localCurrency}</span>
                      </button>
                      {expandedEntities.has(parentEntity.id) && subsidiaries.map(sub => (
                        <div key={sub.id} className="ml-8 flex items-center gap-2 p-2 rounded-lg hover:bg-surface-hover">
                          <div className="w-4 border-l-2 border-b-2 border-border h-4 mr-1" />
                          <Building2 size={14} className="text-t2" />
                          <span className="text-sm text-t1">{sub.entityName}</span>
                          <Badge variant="default" className="text-xs">{sub.entityType.replace('_', ' ')}</Badge>
                          <span className="text-xs text-t3 ml-auto">{sub.country} / {sub.localCurrency}</span>
                          <span className="text-xs text-t3">{sub.ownershipPercent}%</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-t3 py-4 text-center">Add entities to see the org structure tree.</p>
                  )}
                </div>
              </Card>

              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><TrendingUp size={16} /> Consolidation Summary</CardTitle>
                </CardHeader>
                <div className="px-4 pb-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-t2">Consolidation Currency</span>
                    <span className="text-t1 font-medium">{selectedGroup?.consolidationCurrency}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-t2">Fiscal Year End</span>
                    <span className="text-t1 font-medium">{selectedGroup?.fiscalYearEnd}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-t2">Local Currencies</span>
                    <span className="text-t1 font-medium">{[...new Set(members.map(m => m.localCurrency))].join(', ') || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-t2">Countries</span>
                    <span className="text-t1 font-medium">{[...new Set(members.map(m => m.country))].join(', ') || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-t2">FX Rates Configured</span>
                    <span className="text-t1 font-medium">{fxRates.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-t2">Reports Generated</span>
                    <span className="text-t1 font-medium">{reports.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-t2">Confirmed IC Txns</span>
                    <span className="text-t1 font-medium">{confirmedICCount} / {icTransactions.length}</span>
                  </div>
                </div>
              </Card>

              {/* Consolidated P&L Preview */}
              {consolidatedData && (
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <div className="flex items-center justify-between w-full">
                      <CardTitle className="flex items-center gap-2"><DollarSign size={16} /> Consolidated P&L</CardTitle>
                      <Button size="sm" variant="secondary" onClick={exportReport}><Download size={14} /> Export CSV</Button>
                    </div>
                  </CardHeader>
                  <div className="px-4 pb-4 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 text-t2 font-medium">Line Item</th>
                          {consolidatedData.entityBreakdown.map(e => (
                            <th key={e.orgId} className="text-right py-2 text-t2 font-medium">{e.entityName}</th>
                          ))}
                          <th className="text-right py-2 text-t2 font-medium">Eliminations</th>
                          <th className="text-right py-2 text-t1 font-semibold">Consolidated</th>
                        </tr>
                      </thead>
                      <tbody>
                        {consolidatedData.lineItems.map((item, i) => (
                          <tr key={i} className={`border-b border-border/50 ${item.label === 'Net Income' ? 'font-semibold bg-surface-hover' : ''}`}>
                            <td className="py-2 text-t1">{item.label}</td>
                            {consolidatedData.entityBreakdown.map(e => (
                              <td key={e.orgId} className="text-right py-2 text-t1">
                                {item.entities[e.orgId] !== undefined ? formatCurrency(item.entities[e.orgId], consolidatedData.consolidationCurrency) : '-'}
                              </td>
                            ))}
                            <td className="text-right py-2 text-red-500">
                              {item.eliminations !== 0 ? formatCurrency(item.eliminations, consolidatedData.consolidationCurrency) : '-'}
                            </td>
                            <td className="text-right py-2 text-t1 font-medium">
                              {formatCurrency(item.consolidated, consolidatedData.consolidationCurrency)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* ===== Entities Tab ===== */}
          {activeTab === 'entities' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-t1">Group Entities ({members.length})</h3>
                <Button size="sm" onClick={() => {
                  setMemberForm({ orgId: '', entityName: '', entityType: 'subsidiary', country: '', localCurrency: 'USD', ownershipPercent: '100', consolidationMethod: 'full' })
                  setShowMemberModal(true)
                }}><Plus size={14} /> Add Entity</Button>
              </div>
              <Card>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-surface-hover">
                        <th className="text-left px-4 py-3 text-t2 font-medium">Entity Name</th>
                        <th className="text-left px-4 py-3 text-t2 font-medium">Type</th>
                        <th className="text-left px-4 py-3 text-t2 font-medium">Country</th>
                        <th className="text-left px-4 py-3 text-t2 font-medium">Currency</th>
                        <th className="text-right px-4 py-3 text-t2 font-medium">Ownership %</th>
                        <th className="text-left px-4 py-3 text-t2 font-medium">Method</th>
                        <th className="text-right px-4 py-3 text-t2 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {members.map(m => (
                        <tr key={m.id} className="border-b border-border/50 hover:bg-surface-hover">
                          <td className="px-4 py-3 text-t1 font-medium">{m.entityName}</td>
                          <td className="px-4 py-3">
                            <Badge variant={m.entityType === 'parent' ? 'info' : 'default'}>
                              {m.entityType.replace('_', ' ')}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-t1">{m.country}</td>
                          <td className="px-4 py-3 text-t1">{m.localCurrency}</td>
                          <td className="px-4 py-3 text-right text-t1">{m.ownershipPercent}%</td>
                          <td className="px-4 py-3 text-t2">{m.consolidationMethod}</td>
                          <td className="px-4 py-3 text-right">
                            {m.entityType !== 'parent' && (
                              <Button size="sm" variant="danger" onClick={() => removeMember(m.id)}>
                                <X size={12} />
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                      {members.length === 0 && (
                        <tr><td colSpan={7} className="px-4 py-8 text-center text-t3">No entities added yet</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* ===== Intercompany Tab ===== */}
          {activeTab === 'intercompany' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h3 className="text-sm font-medium text-t1">Intercompany Transactions ({icTransactions.length})</h3>
                  <div className="relative max-w-xs">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-t3" />
                    <input
                      type="text"
                      placeholder="Search transactions..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 text-sm rounded-lg border border-border bg-surface text-t1 placeholder:text-t3 focus:outline-none focus:ring-2 focus:ring-accent/30"
                    />
                  </div>
                </div>
                <Button size="sm" onClick={() => {
                  setIcForm({ fromOrgId: members[0]?.orgId || '', toOrgId: members[1]?.orgId || '', transactionType: 'service_fee', description: '', amount: '', currency: selectedGroup?.consolidationCurrency || 'USD', date: new Date().toISOString().split('T')[0] })
                  setShowICModal(true)
                }}><Plus size={14} /> Record IC Transaction</Button>
              </div>
              <Card>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-surface-hover">
                        <th className="text-left px-4 py-3 text-t2 font-medium">Ref #</th>
                        <th className="text-left px-4 py-3 text-t2 font-medium">Date</th>
                        <th className="text-left px-4 py-3 text-t2 font-medium">From</th>
                        <th className="text-left px-4 py-3 text-t2 font-medium">To</th>
                        <th className="text-left px-4 py-3 text-t2 font-medium">Type</th>
                        <th className="text-left px-4 py-3 text-t2 font-medium">Description</th>
                        <th className="text-right px-4 py-3 text-t2 font-medium">Amount</th>
                        <th className="text-center px-4 py-3 text-t2 font-medium">Status</th>
                        <th className="text-center px-4 py-3 text-t2 font-medium">Confirm</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredICTransactions.map(txn => (
                        <tr key={txn.id} className="border-b border-border/50 hover:bg-surface-hover">
                          <td className="px-4 py-3 text-t2 font-mono text-xs">{txn.referenceNumber}</td>
                          <td className="px-4 py-3 text-t1">{txn.date}</td>
                          <td className="px-4 py-3 text-t1">{getMemberName(txn.fromOrgId)}</td>
                          <td className="px-4 py-3 text-t1">{getMemberName(txn.toOrgId)}</td>
                          <td className="px-4 py-3"><Badge variant="default">{txn.transactionType.replace(/_/g, ' ')}</Badge></td>
                          <td className="px-4 py-3 text-t1 max-w-[200px] truncate">{txn.description}</td>
                          <td className="px-4 py-3 text-right text-t1 font-medium">{formatCurrency(txn.amount, txn.currency)}</td>
                          <td className="px-4 py-3 text-center">{statusBadge(txn.status)}</td>
                          <td className="px-4 py-3 text-center">
                            {txn.status === 'pending' && (
                              <div className="flex items-center justify-center gap-1">
                                {!txn.fromEntityConfirmed && (
                                  <Button size="sm" variant="secondary" onClick={() => confirmIC(txn.id, 'from')} title="Confirm as sender">
                                    <Check size={12} /> S
                                  </Button>
                                )}
                                {!txn.toEntityConfirmed && (
                                  <Button size="sm" variant="secondary" onClick={() => confirmIC(txn.id, 'to')} title="Confirm as receiver">
                                    <Check size={12} /> R
                                  </Button>
                                )}
                              </div>
                            )}
                            {txn.status === 'confirmed' && <Badge variant="success">Ready</Badge>}
                            {txn.status === 'eliminated' && <Badge variant="info">Eliminated</Badge>}
                          </td>
                        </tr>
                      ))}
                      {filteredICTransactions.length === 0 && (
                        <tr><td colSpan={9} className="px-4 py-8 text-center text-t3">No intercompany transactions</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* ===== Reports Tab ===== */}
          {activeTab === 'reports' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-t1">Consolidation Reports ({reports.length})</h3>
                <Button size="sm" onClick={() => {
                  setReportForm({ reportType: 'income_statement', periodStart: '', periodEnd: '' })
                  setShowReportModal(true)
                }}><Plus size={14} /> Generate Report</Button>
              </div>

              {/* Report list */}
              <Card>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-surface-hover">
                        <th className="text-left px-4 py-3 text-t2 font-medium">Report Type</th>
                        <th className="text-left px-4 py-3 text-t2 font-medium">Period</th>
                        <th className="text-center px-4 py-3 text-t2 font-medium">Status</th>
                        <th className="text-right px-4 py-3 text-t2 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reports.map(r => (
                        <tr key={r.id} className="border-b border-border/50 hover:bg-surface-hover">
                          <td className="px-4 py-3 text-t1 font-medium">{r.reportType.replace(/_/g, ' ')}</td>
                          <td className="px-4 py-3 text-t1">{r.periodStart} to {r.periodEnd}</td>
                          <td className="px-4 py-3 text-center">{statusBadge(r.status)}</td>
                          <td className="px-4 py-3 text-right">
                            <Button size="sm" variant="secondary" onClick={() => viewReport(r)}>View</Button>
                          </td>
                        </tr>
                      ))}
                      {reports.length === 0 && (
                        <tr><td colSpan={4} className="px-4 py-8 text-center text-t3">No reports generated yet</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* Consolidated view */}
              {consolidatedData && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between w-full">
                      <CardTitle className="flex items-center gap-2">
                        <DollarSign size={16} />
                        Consolidated {consolidatedData.groupName || ''} - {consolidatedData.consolidationCurrency}
                      </CardTitle>
                      <Button size="sm" variant="secondary" onClick={exportReport}><Download size={14} /> Export</Button>
                    </div>
                  </CardHeader>
                  <div className="px-4 pb-4">
                    {/* Totals */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                      <div className="text-center p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                        <div className="text-xs text-t3 mb-1">Revenue</div>
                        <div className="text-sm font-semibold text-green-600">{formatCurrency(consolidatedData.totals.revenue, consolidatedData.consolidationCurrency)}</div>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-red-50 dark:bg-red-900/20">
                        <div className="text-xs text-t3 mb-1">Payroll</div>
                        <div className="text-sm font-semibold text-red-600">{formatCurrency(consolidatedData.totals.payrollCosts, consolidatedData.consolidationCurrency)}</div>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20">
                        <div className="text-xs text-t3 mb-1">OpEx</div>
                        <div className="text-sm font-semibold text-orange-600">{formatCurrency(consolidatedData.totals.operatingExpenses, consolidatedData.consolidationCurrency)}</div>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                        <div className="text-xs text-t3 mb-1">IC Eliminations</div>
                        <div className="text-sm font-semibold text-purple-600">{formatCurrency(consolidatedData.totals.intercompanyEliminations, consolidatedData.consolidationCurrency)}</div>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                        <div className="text-xs text-t3 mb-1">Net Income</div>
                        <div className="text-sm font-semibold text-blue-600">{formatCurrency(consolidatedData.totals.netIncome, consolidatedData.consolidationCurrency)}</div>
                      </div>
                    </div>

                    {/* Full P&L table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-2 text-t2 font-medium">Line Item</th>
                            {consolidatedData.entityBreakdown.map(e => (
                              <th key={e.orgId} className="text-right py-2 text-t2 font-medium">{e.entityName}</th>
                            ))}
                            <th className="text-right py-2 text-t2 font-medium">Eliminations</th>
                            <th className="text-right py-2 text-t1 font-semibold">Consolidated</th>
                          </tr>
                        </thead>
                        <tbody>
                          {consolidatedData.lineItems.map((item, i) => (
                            <tr key={i} className={`border-b border-border/50 ${item.label === 'Net Income' ? 'font-semibold bg-surface-hover' : ''}`}>
                              <td className="py-2 text-t1">{item.label}</td>
                              {consolidatedData.entityBreakdown.map(e => (
                                <td key={e.orgId} className="text-right py-2 text-t1">
                                  {item.entities[e.orgId] !== undefined ? formatCurrency(item.entities[e.orgId], consolidatedData.consolidationCurrency) : '-'}
                                </td>
                              ))}
                              <td className="text-right py-2 text-red-500">
                                {item.eliminations !== 0 ? formatCurrency(item.eliminations, consolidatedData.consolidationCurrency) : '-'}
                              </td>
                              <td className="text-right py-2 text-t1 font-medium">
                                {formatCurrency(item.consolidated, consolidatedData.consolidationCurrency)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* ===== FX Rates Tab ===== */}
          {activeTab === 'fx-rates' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-t1">Exchange Rates ({fxRates.length})</h3>
                <Button size="sm" onClick={() => {
                  setFxForm({ fromCurrency: '', toCurrency: selectedGroup?.consolidationCurrency || 'USD', rate: '', rateType: 'closing', effectiveDate: new Date().toISOString().split('T')[0] })
                  setShowFxModal(true)
                }}><Plus size={14} /> Add FX Rate</Button>
              </div>
              <Card>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-surface-hover">
                        <th className="text-left px-4 py-3 text-t2 font-medium">From</th>
                        <th className="text-left px-4 py-3 text-t2 font-medium">To</th>
                        <th className="text-right px-4 py-3 text-t2 font-medium">Rate</th>
                        <th className="text-left px-4 py-3 text-t2 font-medium">Type</th>
                        <th className="text-left px-4 py-3 text-t2 font-medium">Effective Date</th>
                        <th className="text-left px-4 py-3 text-t2 font-medium">Source</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fxRates.map(r => (
                        <tr key={r.id} className="border-b border-border/50 hover:bg-surface-hover">
                          <td className="px-4 py-3 text-t1 font-medium">{r.fromCurrency}</td>
                          <td className="px-4 py-3 text-t1 font-medium">{r.toCurrency}</td>
                          <td className="px-4 py-3 text-right text-t1 font-mono">{r.rate}</td>
                          <td className="px-4 py-3"><Badge variant="default">{r.rateType}</Badge></td>
                          <td className="px-4 py-3 text-t1">{r.effectiveDate}</td>
                          <td className="px-4 py-3 text-t2">{r.source}</td>
                        </tr>
                      ))}
                      {fxRates.length === 0 && (
                        <tr><td colSpan={6} className="px-4 py-8 text-center text-t3">No FX rates configured. Add rates for accurate currency conversion.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* ===== Eliminations Tab ===== */}
          {activeTab === 'eliminations' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-t1">Elimination Entries</h3>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Period start"
                    type="date"
                    value={reportForm.periodStart}
                    onChange={e => setReportForm(f => ({ ...f, periodStart: e.target.value }))}
                  />
                  <Input
                    placeholder="Period end"
                    type="date"
                    value={reportForm.periodEnd}
                    onChange={e => setReportForm(f => ({ ...f, periodEnd: e.target.value }))}
                  />
                  <Button size="sm" variant="secondary" onClick={eliminateIC}>
                    <RefreshCw size={14} /> Auto-Eliminate
                  </Button>
                </div>
              </div>

              <Card>
                <div className="px-4 py-4">
                  <p className="text-sm text-t2 mb-4">
                    Confirmed intercompany transactions are eliminated during consolidation to avoid double-counting.
                    Use the auto-eliminate button to mark all confirmed IC transactions in the selected period.
                  </p>
                  {consolidatedData?.eliminationEntries && consolidatedData.eliminationEntries.length > 0 ? (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 text-t2 font-medium">Description</th>
                          <th className="text-left py-2 text-t2 font-medium">From</th>
                          <th className="text-left py-2 text-t2 font-medium">To</th>
                          <th className="text-right py-2 text-t2 font-medium">Debit</th>
                          <th className="text-right py-2 text-t2 font-medium">Credit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {consolidatedData.eliminationEntries.map((entry, i) => (
                          <tr key={i} className="border-b border-border/50">
                            <td className="py-2 text-t1">{entry.description}</td>
                            <td className="py-2 text-t1">{entry.fromEntity}</td>
                            <td className="py-2 text-t1">{entry.toEntity}</td>
                            <td className="py-2 text-right text-t1">{formatCurrency(entry.debit, consolidatedData.consolidationCurrency)}</td>
                            <td className="py-2 text-right text-t1">{formatCurrency(entry.credit, consolidatedData.consolidationCurrency)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-sm text-t3 text-center py-8">
                      No elimination entries yet. Generate a consolidation report to see elimination journal entries.
                    </p>
                  )}
                </div>
              </Card>

              {/* Eliminated IC transactions */}
              <Card>
                <CardHeader>
                  <CardTitle>Eliminated Transactions</CardTitle>
                </CardHeader>
                <div className="px-4 pb-4">
                  {icTransactions.filter(t => t.status === 'eliminated').length > 0 ? (
                    <div className="space-y-2">
                      {icTransactions.filter(t => t.status === 'eliminated').map(txn => (
                        <div key={txn.id} className="flex items-center justify-between p-2 rounded-lg bg-surface-hover text-sm">
                          <span className="text-t2">{txn.referenceNumber}</span>
                          <span className="text-t1">{getMemberName(txn.fromOrgId)} → {getMemberName(txn.toOrgId)}</span>
                          <span className="text-t1 font-medium">{formatCurrency(txn.amount, txn.currency)}</span>
                          <Badge variant="success">Eliminated</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-t3 text-center py-4">No eliminated transactions</p>
                  )}
                </div>
              </Card>
            </div>
          )}
        </>
      )}

      {/* ===== Modals ===== */}

      {/* Create Group Modal */}
      {showGroupModal && (
        <Modal open={showGroupModal} title="Create Entity Group" onClose={() => setShowGroupModal(false)}>
          <div className="space-y-4">
            <Input label="Group Name" value={groupForm.name} onChange={e => setGroupForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g., Acme Global Holdings" />
            <Textarea label="Description" value={groupForm.description} onChange={e => setGroupForm(f => ({ ...f, description: e.target.value }))} placeholder="Description of the entity group" />
            <Select
              label="Consolidation Currency"
              value={groupForm.consolidationCurrency}
              onChange={e => setGroupForm(f => ({ ...f, consolidationCurrency: e.target.value }))}
              options={CURRENCIES.map(c => ({ value: c, label: c }))}
            />
            <Input label="Fiscal Year End (MM-DD)" value={groupForm.fiscalYearEnd} onChange={e => setGroupForm(f => ({ ...f, fiscalYearEnd: e.target.value }))} placeholder="12-31" />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setShowGroupModal(false)}>Cancel</Button>
              <Button onClick={createGroup} disabled={saving}>{saving ? 'Creating...' : 'Create Group'}</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Entity Modal */}
      {showMemberModal && (
        <Modal open={showMemberModal} title="Add Entity to Group" onClose={() => setShowMemberModal(false)}>
          <div className="space-y-4">
            <Input label="Entity Name" value={memberForm.entityName} onChange={e => setMemberForm(f => ({ ...f, entityName: e.target.value }))} placeholder="e.g., Acme UK Ltd" />
            <Input label="Org ID" value={memberForm.orgId} onChange={e => setMemberForm(f => ({ ...f, orgId: e.target.value }))} placeholder="UUID of the organization" />
            <Select
              label="Entity Type"
              value={memberForm.entityType}
              onChange={e => setMemberForm(f => ({ ...f, entityType: e.target.value }))}
              options={ENTITY_TYPES}
            />
            <Input label="Country" value={memberForm.country} onChange={e => setMemberForm(f => ({ ...f, country: e.target.value }))} placeholder="e.g., United Kingdom" />
            <Select
              label="Local Currency"
              value={memberForm.localCurrency}
              onChange={e => setMemberForm(f => ({ ...f, localCurrency: e.target.value }))}
              options={CURRENCIES.map(c => ({ value: c, label: c }))}
            />
            <Input label="Ownership %" type="number" value={memberForm.ownershipPercent} onChange={e => setMemberForm(f => ({ ...f, ownershipPercent: e.target.value }))} placeholder="100" />
            <Select
              label="Consolidation Method"
              value={memberForm.consolidationMethod}
              onChange={e => setMemberForm(f => ({ ...f, consolidationMethod: e.target.value }))}
              options={CONSOLIDATION_METHODS}
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setShowMemberModal(false)}>Cancel</Button>
              <Button onClick={addMember} disabled={saving}>{saving ? 'Adding...' : 'Add Entity'}</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* IC Transaction Modal */}
      {showICModal && (
        <Modal open={showICModal} title="Record Intercompany Transaction" onClose={() => setShowICModal(false)}>
          <div className="space-y-4">
            <Select
              label="From Entity"
              value={icForm.fromOrgId}
              onChange={e => setIcForm(f => ({ ...f, fromOrgId: e.target.value }))}
              options={members.map(m => ({ value: m.orgId, label: m.entityName }))}
            />
            <Select
              label="To Entity"
              value={icForm.toOrgId}
              onChange={e => setIcForm(f => ({ ...f, toOrgId: e.target.value }))}
              options={members.map(m => ({ value: m.orgId, label: m.entityName }))}
            />
            <Select
              label="Transaction Type"
              value={icForm.transactionType}
              onChange={e => setIcForm(f => ({ ...f, transactionType: e.target.value }))}
              options={IC_TYPES}
            />
            <Input label="Description" value={icForm.description} onChange={e => setIcForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe the transaction" />
            <Input label="Amount" type="number" value={icForm.amount} onChange={e => setIcForm(f => ({ ...f, amount: e.target.value }))} placeholder="0.00" />
            <Select
              label="Currency"
              value={icForm.currency}
              onChange={e => setIcForm(f => ({ ...f, currency: e.target.value }))}
              options={CURRENCIES.map(c => ({ value: c, label: c }))}
            />
            <Input label="Date" type="date" value={icForm.date} onChange={e => setIcForm(f => ({ ...f, date: e.target.value }))} />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setShowICModal(false)}>Cancel</Button>
              <Button onClick={recordIC} disabled={saving}>{saving ? 'Recording...' : 'Record Transaction'}</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* FX Rate Modal */}
      {showFxModal && (
        <Modal open={showFxModal} title="Add FX Rate" onClose={() => setShowFxModal(false)}>
          <div className="space-y-4">
            <Select
              label="From Currency"
              value={fxForm.fromCurrency}
              onChange={e => setFxForm(f => ({ ...f, fromCurrency: e.target.value }))}
              options={CURRENCIES.map(c => ({ value: c, label: c }))}
            />
            <Select
              label="To Currency"
              value={fxForm.toCurrency}
              onChange={e => setFxForm(f => ({ ...f, toCurrency: e.target.value }))}
              options={CURRENCIES.map(c => ({ value: c, label: c }))}
            />
            <Input label="Rate" type="number" step="0.000001" value={fxForm.rate} onChange={e => setFxForm(f => ({ ...f, rate: e.target.value }))} placeholder="e.g., 1.085" />
            <Select
              label="Rate Type"
              value={fxForm.rateType}
              onChange={e => setFxForm(f => ({ ...f, rateType: e.target.value }))}
              options={[
                { value: 'spot', label: 'Spot Rate' },
                { value: 'average', label: 'Average Rate' },
                { value: 'closing', label: 'Closing Rate' },
              ]}
            />
            <Input label="Effective Date" type="date" value={fxForm.effectiveDate} onChange={e => setFxForm(f => ({ ...f, effectiveDate: e.target.value }))} />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setShowFxModal(false)}>Cancel</Button>
              <Button onClick={addFxRate} disabled={saving}>{saving ? 'Saving...' : 'Add Rate'}</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Generate Report Modal */}
      {showReportModal && (
        <Modal open={showReportModal} title="Generate Consolidation Report" onClose={() => setShowReportModal(false)}>
          <div className="space-y-4">
            <Select
              label="Report Type"
              value={reportForm.reportType}
              onChange={e => setReportForm(f => ({ ...f, reportType: e.target.value }))}
              options={REPORT_TYPES}
            />
            <Input label="Period Start" type="date" value={reportForm.periodStart} onChange={e => setReportForm(f => ({ ...f, periodStart: e.target.value }))} />
            <Input label="Period End" type="date" value={reportForm.periodEnd} onChange={e => setReportForm(f => ({ ...f, periodEnd: e.target.value }))} />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setShowReportModal(false)}>Cancel</Button>
              <Button onClick={generateReport} disabled={saving}>{saving ? 'Generating...' : 'Generate Report'}</Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}
