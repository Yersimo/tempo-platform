'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { Header } from '@/components/layout/header'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/ui/stat-card'
import { Modal } from '@/components/ui/modal'
import { Input, Select } from '@/components/ui/input'
import { PageSkeleton } from '@/components/ui/page-skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import {
  Landmark, RefreshCw, Plus, Check, X, Link2, ArrowDownUp, FileUp,
  CheckCircle2, AlertCircle, MinusCircle, CircleDot, Zap, TrendingUp, TrendingDown, Search,
} from 'lucide-react'
import { useTempo, useOrgCurrency } from '@/lib/store'
import { formatCurrency } from '@/lib/utils/format-currency'

type TabKey = 'overview' | 'transactions' | 'rules'

const MATCH_STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  matched: { label: 'Matched', color: 'bg-blue-100 text-blue-800', icon: CircleDot },
  confirmed: { label: 'Confirmed', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
  unmatched: { label: 'Unmatched', color: 'bg-red-100 text-red-800', icon: AlertCircle },
  excluded: { label: 'Excluded', color: 'bg-gray-100 text-gray-600', icon: MinusCircle },
}

export default function BankFeedsPage() {
  const defaultCurrency = useOrgCurrency()
  const { org, bankConnections, bankAccounts, bankTransactions, reconciliationRules, invoices, expenseReports, ensureModulesLoaded, addToast } = useTempo()

  const [pageLoading, setPageLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabKey>('overview')
  const [saving, setSaving] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedAccountId, setSelectedAccountId] = useState('all')
  const [showConnectModal, setShowConnectModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [showMatchModal, setShowMatchModal] = useState<{ txnId: string; txnName: string; txnAmount: number } | null>(null)
  const [showRuleModal, setShowRuleModal] = useState(false)
  const [connectForm, setConnectForm] = useState({ institutionName: '', institutionId: '' })
  const [csvText, setCsvText] = useState('')
  const [selectedImportAccount, setSelectedImportAccount] = useState('')
  const [matchForm, setMatchForm] = useState({ entityType: 'invoice', entityId: '' })
  const [ruleForm, setRuleForm] = useState({ name: '', description: '', matchField: 'merchant', matchOperator: 'contains', matchValue: '', targetEntityType: 'invoice', priority: 0 })
  const [summary, setSummary] = useState<any>(null)

  useEffect(() => {
    ensureModulesLoaded?.(['bankConnections', 'bankAccounts', 'bankTransactions', 'reconciliationRules', 'invoices', 'expenseReports'])?.then?.(() => setPageLoading(false))?.catch?.(() => setPageLoading(false))
    const t = setTimeout(() => setPageLoading(false), 2000)
    return () => clearTimeout(t)
  }, [ensureModulesLoaded])

  const fetchSummary = useCallback(async () => {
    try {
      const ap = selectedAccountId !== 'all' ? `&accountId=${selectedAccountId}` : ''
      const res = await fetch(`/api/bank-feed?action=summary${ap}`, { headers: { 'x-org-id': org.id } })
      if (res.ok) setSummary(await res.json())
    } catch { /* use local */ }
  }, [org.id, selectedAccountId])

  useEffect(() => { if (!pageLoading) fetchSummary() }, [pageLoading, fetchSummary])

  async function bankFeedAPI(action: string, data: Record<string, any> = {}) {
    const res = await fetch('/api/bank-feed', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-org-id': org.id }, body: JSON.stringify({ action, ...data }) })
    if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || 'Request failed') }
    return res.json()
  }
  async function plaidAPI(action: string, data: Record<string, any> = {}) {
    const res = await fetch('/api/bank-feed/plaid', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-org-id': org.id }, body: JSON.stringify({ action, ...data }) })
    if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || 'Request failed') }
    return res.json()
  }

  async function handleConnectBank() {
    if (!connectForm.institutionName) return
    setSaving(true)
    try {
      await plaidAPI('exchange', { publicToken: `public-sandbox-${Date.now()}`, institutionId: connectForm.institutionId || `ins_${Date.now()}`, institutionName: connectForm.institutionName })
      addToast(`Connected to ${connectForm.institutionName}`)
      setShowConnectModal(false)
      setConnectForm({ institutionName: '', institutionId: '' })
      window.location.reload()
    } catch (e: any) { addToast(e.message || 'Failed to connect bank', 'error') } finally { setSaving(false) }
  }
  async function handleSync(connectionId: string) {
    setSyncing(true)
    try { const r = await plaidAPI('sync', { connectionId }); addToast(`Synced: ${r.added} new, ${r.modified} updated, ${r.removed} removed`); fetchSummary() }
    catch (e: any) { addToast(e.message || 'Sync failed', 'error') } finally { setSyncing(false) }
  }
  async function handleAutoMatch() {
    setSaving(true)
    try { const aid = selectedAccountId !== 'all' ? selectedAccountId : undefined; const r = await bankFeedAPI('auto-match', { accountId: aid }); addToast(`Matched ${r.matched} of ${r.total} transactions`); fetchSummary() }
    catch (e: any) { addToast(e.message || 'Auto-match failed', 'error') } finally { setSaving(false) }
  }
  async function handleConfirmMatch(txnId: string) {
    try { const txn = bankTransactions.find((t: any) => t.id === txnId); if (!txn) return; await bankFeedAPI('confirm-match', { transactionId: txnId, entityType: (txn as any).matched_entity_type || (txn as any).matchedEntityType, entityId: (txn as any).matched_entity_id || (txn as any).matchedEntityId }); addToast('Match confirmed'); fetchSummary() }
    catch (e: any) { addToast(e.message || 'Failed to confirm', 'error') }
  }
  async function handleExclude(txnId: string) {
    try { await bankFeedAPI('exclude', { transactionId: txnId }); addToast('Transaction excluded'); fetchSummary() }
    catch (e: any) { addToast(e.message || 'Failed to exclude', 'error') }
  }
  async function handleManualMatch() {
    if (!showMatchModal || !matchForm.entityId) return
    setSaving(true)
    try { await bankFeedAPI('confirm-match', { transactionId: showMatchModal.txnId, entityType: matchForm.entityType, entityId: matchForm.entityId }); addToast('Match confirmed'); setShowMatchModal(null); setMatchForm({ entityType: 'invoice', entityId: '' }); fetchSummary() }
    catch (e: any) { addToast(e.message || 'Failed to match', 'error') } finally { setSaving(false) }
  }
  async function handleImportCSV() {
    if (!csvText.trim() || !selectedImportAccount) return
    setSaving(true)
    try {
      const lines = csvText.trim().split('\n').slice(1)
      const transactions = lines.map(line => { const [date, amount, description, merchant, category] = line.split(',').map(s => s.trim()); return { date, amount: Math.round(parseFloat(amount) * 100), description, merchant: merchant || undefined, category: category || undefined } }).filter(t => t.date && !isNaN(t.amount) && t.description)
      const r = await bankFeedAPI('import-csv', { accountId: selectedImportAccount, transactions })
      addToast(`Imported ${r.imported} transactions (${r.skipped} skipped)`); setShowImportModal(false); setCsvText('')
    } catch (e: any) { addToast(e.message || 'Import failed', 'error') } finally { setSaving(false) }
  }
  async function handleCreateRule() {
    if (!ruleForm.name || !ruleForm.matchValue) return
    setSaving(true)
    try { await bankFeedAPI('create-rule', ruleForm); addToast('Matching rule created'); setShowRuleModal(false); setRuleForm({ name: '', description: '', matchField: 'merchant', matchOperator: 'contains', matchValue: '', targetEntityType: 'invoice', priority: 0 }) }
    catch (e: any) { addToast(e.message || 'Failed to create rule', 'error') } finally { setSaving(false) }
  }
  async function handleDisconnect(connectionId: string) {
    try { await bankFeedAPI('disconnect', { connectionId }); addToast('Bank disconnected') }
    catch (e: any) { addToast(e.message || 'Failed to disconnect', 'error') }
  }

  const filteredTransactions = useMemo(() => {
    let txns = bankTransactions || []
    if (selectedAccountId !== 'all') txns = txns.filter((t: any) => (t.account_id || t.accountId) === selectedAccountId)
    if (statusFilter !== 'all') txns = txns.filter((t: any) => (t.match_status || t.matchStatus) === statusFilter)
    if (searchQuery.trim()) { const q = searchQuery.toLowerCase(); txns = txns.filter((t: any) => (t.name || '').toLowerCase().includes(q) || (t.merchant_name || t.merchantName || '').toLowerCase().includes(q) || (t.category || '').toLowerCase().includes(q)) }
    return txns
  }, [bankTransactions, selectedAccountId, statusFilter, searchQuery])

  const localSummary = useMemo(() => {
    const txns = bankTransactions || []
    const matched = txns.filter((t: any) => (t.match_status || t.matchStatus) === 'matched').length
    const confirmed = txns.filter((t: any) => (t.match_status || t.matchStatus) === 'confirmed').length
    const unmatched = txns.filter((t: any) => (t.match_status || t.matchStatus) === 'unmatched').length
    const excluded = txns.filter((t: any) => (t.match_status || t.matchStatus) === 'excluded').length
    const active = txns.length - excluded
    const totalInflow = txns.filter((t: any) => t.amount > 0).reduce((s: number, t: any) => s + t.amount, 0)
    const totalOutflow = txns.filter((t: any) => t.amount < 0).reduce((s: number, t: any) => s + t.amount, 0)
    return { totalTransactions: txns.length, matched, confirmed, unmatched, excluded, matchedPercent: active > 0 ? Math.round(((matched + confirmed) / active) * 100) : 0, totalInflow, totalOutflow, netAmount: totalInflow + totalOutflow }
  }, [bankTransactions])

  const stats = summary || localSummary
  const fmtAmt = (cents: number) => formatCurrency(Math.abs(cents), defaultCurrency, { cents: true })
  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '-'
  const getAcctName = (id: string) => { const a = (bankAccounts || []).find((x: any) => x.id === id); return a ? `${(a as any).name} (${(a as any).mask || '****'})` : 'Unknown' }

  const accountOptions = [{ value: 'all', label: 'All Accounts' }, ...(bankAccounts || []).map((a: any) => ({ value: a.id, label: `${a.name}${a.mask ? ` (****${a.mask})` : ''}` }))]
  const statusOptions = [{ value: 'all', label: 'All Statuses' }, { value: 'unmatched', label: 'Unmatched' }, { value: 'matched', label: 'Matched' }, { value: 'confirmed', label: 'Confirmed' }, { value: 'excluded', label: 'Excluded' }]
  const entityTypeOptions = [{ value: 'invoice', label: 'Invoice' }, { value: 'expense', label: 'Expense Report' }, { value: 'payroll', label: 'Payroll Run' }, { value: 'bill', label: 'Bill Payment' }]
  const matchFieldOptions = [{ value: 'merchant', label: 'Merchant Name' }, { value: 'description', label: 'Description' }, { value: 'amount', label: 'Amount' }]
  const matchOperatorOptions = [{ value: 'contains', label: 'Contains' }, { value: 'exact', label: 'Exact Match' }, { value: 'regex', label: 'Regex' }, { value: 'range', label: 'Range (min,max)' }]

  const entityMatchOptions = useMemo(() => {
    if (matchForm.entityType === 'invoice') return (invoices || []).map((inv: any) => ({ value: inv.id, label: `${inv.client_name || inv.clientName || 'Invoice'} - ${fmtAmt(inv.amount || inv.totalCents || 0)}` }))
    if (matchForm.entityType === 'expense') return (expenseReports || []).map((exp: any) => ({ value: exp.id, label: `${exp.title || 'Expense'} - ${fmtAmt(exp.total || exp.totalCents || exp.amount || 0)}` }))
    return []
  }, [matchForm.entityType, invoices, expenseReports, defaultCurrency])

  if (pageLoading) return <PageSkeleton />

  return (
    <>
      <Header title="Bank Feeds" subtitle="Automated bank statement reconciliation with Plaid integration" />
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {(['overview', 'transactions', 'rules'] as TabKey[]).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === tab ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50 border'}`}>
                {tab === 'overview' ? 'Overview' : tab === 'transactions' ? 'Transactions' : 'Matching Rules'}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowImportModal(true)}><FileUp className="h-4 w-4 mr-1" /> Import CSV</Button>
            <Button variant="outline" size="sm" onClick={handleAutoMatch} disabled={saving}><Zap className="h-4 w-4 mr-1" /> Auto-Match</Button>
            <Button size="sm" onClick={() => setShowConnectModal(true)}><Plus className="h-4 w-4 mr-1" /> Connect Bank</Button>
          </div>
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Reconciliation Rate" value={`${stats.matchedPercent || 0}%`} icon={<CheckCircle2 className="h-5 w-5 text-green-600" />} changeType={stats.matchedPercent >= 80 ? 'positive' : stats.matchedPercent >= 50 ? 'neutral' : 'negative'} />
              <StatCard label="Total Inflow" value={fmtAmt(stats.totalInflow || 0)} icon={<TrendingUp className="h-5 w-5 text-green-600" />} />
              <StatCard label="Total Outflow" value={fmtAmt(Math.abs(stats.totalOutflow || 0))} icon={<TrendingDown className="h-5 w-5 text-red-600" />} />
              <StatCard label="Unmatched" value={String(stats.unmatched || 0)} icon={<AlertCircle className="h-5 w-5 text-amber-600" />} />
            </div>
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Landmark className="h-5 w-5" /> Connected Banks</CardTitle></CardHeader>
              <div className="p-4">
                {(bankConnections || []).length === 0 ? (
                  <EmptyState icon={<Landmark className="h-12 w-12" />} title="No bank connections" description="Connect your bank account via Plaid or import transactions manually." action={<Button onClick={() => setShowConnectModal(true)}><Plus className="h-4 w-4 mr-1" /> Connect Bank</Button>} />
                ) : (
                  <div className="divide-y">
                    {(bankConnections || []).map((conn: any) => {
                      const ca = (bankAccounts || []).filter((a: any) => (a.connection_id || a.connectionId) === conn.id)
                      return (
                        <div key={conn.id} className="py-4 first:pt-0 last:pb-0">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center"><Landmark className="h-5 w-5 text-blue-600" /></div>
                              <div>
                                <h4 className="font-medium text-gray-900">{conn.institution_name || conn.institutionName}</h4>
                                <p className="text-sm text-gray-500">Last synced: {conn.last_sync_at || conn.lastSyncAt ? fmtDate(conn.last_sync_at || conn.lastSyncAt) : 'Never'}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={conn.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>{conn.status}</Badge>
                              <Button variant="outline" size="sm" onClick={() => handleSync(conn.id)} disabled={syncing || conn.status !== 'active'}><RefreshCw className={`h-3.5 w-3.5 mr-1 ${syncing ? 'animate-spin' : ''}`} /> Sync</Button>
                              <Button variant="outline" size="sm" onClick={() => handleDisconnect(conn.id)}><X className="h-3.5 w-3.5" /></Button>
                            </div>
                          </div>
                          {ca.length > 0 && (
                            <div className="ml-13 grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {ca.map((acct: any) => (
                                <div key={acct.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                                  <div><p className="text-sm font-medium text-gray-900">{acct.name} {acct.mask ? `(****${acct.mask})` : ''}</p><p className="text-xs text-gray-500 capitalize">{acct.subtype || acct.type}</p></div>
                                  <div className="text-right"><p className="text-sm font-semibold text-gray-900">{fmtAmt(acct.current_balance || acct.currentBalance || 0)}</p><p className="text-xs text-gray-500">Avail: {fmtAmt(acct.available_balance || acct.availableBalance || 0)}</p></div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </Card>
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><ArrowDownUp className="h-5 w-5" /> Reconciliation Breakdown</CardTitle></CardHeader>
              <div className="p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(MATCH_STATUS_CONFIG).map(([s, cfg]) => {
                    const count = s === 'matched' ? (stats.matched || 0) : s === 'confirmed' ? (stats.confirmed || 0) : s === 'unmatched' ? (stats.unmatched || 0) : (stats.excluded || 0)
                    const Icon = cfg.icon
                    return (<div key={s} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50"><Icon className="h-5 w-5 text-gray-600" /><div><p className="text-lg font-semibold text-gray-900">{count}</p><p className="text-xs text-gray-500">{cfg.label}</p></div></div>)
                  })}
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="space-y-4">
            <Card>
              <div className="p-4 flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-[200px]"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><input type="text" placeholder="Search transactions..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm" /></div></div>
                <Select value={selectedAccountId} onChange={e => setSelectedAccountId(e.target.value)} options={accountOptions} />
                <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} options={statusOptions} />
              </div>
            </Card>
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b bg-gray-50">
                    <th className="text-left p-3 font-medium text-gray-600">Date</th><th className="text-left p-3 font-medium text-gray-600">Description</th><th className="text-left p-3 font-medium text-gray-600">Account</th><th className="text-left p-3 font-medium text-gray-600">Category</th><th className="text-right p-3 font-medium text-gray-600">Amount</th><th className="text-center p-3 font-medium text-gray-600">Status</th><th className="text-center p-3 font-medium text-gray-600">Confidence</th><th className="text-right p-3 font-medium text-gray-600">Actions</th>
                  </tr></thead>
                  <tbody className="divide-y">
                    {filteredTransactions.length === 0 ? (
                      <tr><td colSpan={8} className="p-8 text-center text-gray-500">No transactions found. Connect a bank or import CSV to get started.</td></tr>
                    ) : filteredTransactions.map((txn: any) => {
                      const st = txn.match_status || txn.matchStatus || 'unmatched'
                      const sc = MATCH_STATUS_CONFIG[st] || MATCH_STATUS_CONFIG.unmatched
                      const conf = txn.match_confidence || txn.matchConfidence || 0
                      const amt = txn.amount || 0
                      const out = amt < 0
                      const SI = sc.icon
                      return (
                        <tr key={txn.id} className="hover:bg-gray-50">
                          <td className="p-3 text-gray-900 whitespace-nowrap">{fmtDate(txn.date)}{txn.pending && <span className="ml-1 text-xs text-amber-600">(pending)</span>}</td>
                          <td className="p-3"><div className="font-medium text-gray-900">{txn.name}</div>{(txn.merchant_name || txn.merchantName) && <div className="text-xs text-gray-500">{txn.merchant_name || txn.merchantName}</div>}</td>
                          <td className="p-3 text-gray-600 text-xs">{getAcctName(txn.account_id || txn.accountId)}</td>
                          <td className="p-3">{txn.category && <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">{txn.category}</span>}</td>
                          <td className={`p-3 text-right font-medium whitespace-nowrap ${out ? 'text-red-600' : 'text-green-600'}`}>{out ? '-' : '+'}{fmtAmt(amt)}</td>
                          <td className="p-3 text-center"><span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${sc.color}`}><SI className="h-3 w-3" /> {sc.label}</span></td>
                          <td className="p-3 text-center">{(st === 'matched' || st === 'confirmed') && conf > 0 && <span className={`text-xs font-medium ${conf >= 80 ? 'text-green-600' : conf >= 50 ? 'text-amber-600' : 'text-red-600'}`}>{conf}%</span>}</td>
                          <td className="p-3 text-right"><div className="flex items-center justify-end gap-1">
                            {st === 'matched' && <button onClick={() => handleConfirmMatch(txn.id)} className="p-1 rounded hover:bg-green-50 text-green-600" title="Confirm"><Check className="h-4 w-4" /></button>}
                            {(st === 'unmatched' || st === 'matched') && <button onClick={() => setShowMatchModal({ txnId: txn.id, txnName: txn.name, txnAmount: amt })} className="p-1 rounded hover:bg-blue-50 text-blue-600" title="Manual match"><Link2 className="h-4 w-4" /></button>}
                            {st !== 'excluded' && <button onClick={() => handleExclude(txn.id)} className="p-1 rounded hover:bg-gray-100 text-gray-400" title="Exclude"><MinusCircle className="h-4 w-4" /></button>}
                          </div></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'rules' && (
          <div className="space-y-4">
            <div className="flex justify-end"><Button size="sm" onClick={() => setShowRuleModal(true)}><Plus className="h-4 w-4 mr-1" /> Create Rule</Button></div>
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b bg-gray-50">
                    <th className="text-left p-3 font-medium text-gray-600">Name</th><th className="text-left p-3 font-medium text-gray-600">Match Field</th><th className="text-left p-3 font-medium text-gray-600">Operator</th><th className="text-left p-3 font-medium text-gray-600">Value</th><th className="text-left p-3 font-medium text-gray-600">Target</th><th className="text-center p-3 font-medium text-gray-600">Priority</th><th className="text-center p-3 font-medium text-gray-600">Active</th>
                  </tr></thead>
                  <tbody className="divide-y">
                    {(reconciliationRules || []).length === 0 ? (
                      <tr><td colSpan={7} className="p-8 text-center text-gray-500">No matching rules defined yet.</td></tr>
                    ) : (reconciliationRules || []).map((rule: any) => (
                      <tr key={rule.id} className="hover:bg-gray-50">
                        <td className="p-3"><div className="font-medium text-gray-900">{rule.name}</div>{rule.description && <div className="text-xs text-gray-500">{rule.description}</div>}</td>
                        <td className="p-3 text-gray-600 capitalize">{rule.match_field || rule.matchField}</td>
                        <td className="p-3"><Badge>{rule.match_operator || rule.matchOperator}</Badge></td>
                        <td className="p-3 text-gray-600 font-mono text-xs">{rule.match_value || rule.matchValue}</td>
                        <td className="p-3 text-gray-600 capitalize">{rule.target_entity_type || rule.targetEntityType}</td>
                        <td className="p-3 text-center text-gray-600">{rule.priority || 0}</td>
                        <td className="p-3 text-center"><Badge className={(rule.is_active ?? rule.isActive) !== false ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}>{(rule.is_active ?? rule.isActive) !== false ? 'Active' : 'Inactive'}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}
      </div>

      <Modal open={showConnectModal} onClose={() => setShowConnectModal(false)} title="Connect Bank Account">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">In production, this opens Plaid Link for secure bank authentication. For development, enter bank details below.</p>
          <Input label="Institution Name" value={connectForm.institutionName} onChange={e => setConnectForm(f => ({ ...f, institutionName: e.target.value }))} placeholder="e.g., Chase, Bank of America" />
          <Input label="Institution ID (optional)" value={connectForm.institutionId} onChange={e => setConnectForm(f => ({ ...f, institutionId: e.target.value }))} placeholder="e.g., ins_3" />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowConnectModal(false)}>Cancel</Button>
            <Button onClick={handleConnectBank} disabled={saving || !connectForm.institutionName}>{saving ? 'Connecting...' : 'Connect'}</Button>
          </div>
        </div>
      </Modal>

      <Modal open={showImportModal} onClose={() => setShowImportModal(false)} title="Import Transactions from CSV">
        <div className="space-y-4">
          <Select label="Target Account" value={selectedImportAccount} onChange={e => setSelectedImportAccount(e.target.value)} options={[{ value: '', label: 'Select account...' }, ...(bankAccounts || []).map((a: any) => ({ value: a.id, label: `${a.name}${a.mask ? ` (****${a.mask})` : ''}` }))]} />
          <div>
            <label className="block text-xs font-medium text-t2 tracking-wide uppercase mb-1.5">CSV Data</label>
            <textarea rows={8} value={csvText} onChange={e => setCsvText(e.target.value)} placeholder={`date,amount,description,merchant,category\n2026-03-01,-250.00,AWS Monthly,AWS,Cloud`} className="w-full border rounded-lg p-3 text-sm font-mono" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowImportModal(false)}>Cancel</Button>
            <Button onClick={handleImportCSV} disabled={saving || !csvText.trim() || !selectedImportAccount}>{saving ? 'Importing...' : 'Import'}</Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!showMatchModal} onClose={() => setShowMatchModal(null)} title="Manual Match">
        <div className="space-y-4">
          {showMatchModal && (<>
            <div className="p-3 bg-gray-50 rounded-lg"><p className="text-sm font-medium text-gray-900">{showMatchModal.txnName}</p><p className="text-sm text-gray-600">Amount: <span className="font-mono">{fmtAmt(showMatchModal.txnAmount)}</span></p></div>
            <Select label="Entity Type" value={matchForm.entityType} onChange={e => setMatchForm(f => ({ ...f, entityType: e.target.value, entityId: '' }))} options={entityTypeOptions} />
            <Select label="Entity" value={matchForm.entityId} onChange={e => setMatchForm(f => ({ ...f, entityId: e.target.value }))} options={[{ value: '', label: 'Select...' }, ...entityMatchOptions]} />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowMatchModal(null)}>Cancel</Button>
              <Button onClick={handleManualMatch} disabled={saving || !matchForm.entityId}>{saving ? 'Matching...' : 'Confirm Match'}</Button>
            </div>
          </>)}
        </div>
      </Modal>

      <Modal open={showRuleModal} onClose={() => setShowRuleModal(false)} title="Create Matching Rule">
        <div className="space-y-4">
          <Input label="Rule Name" value={ruleForm.name} onChange={e => setRuleForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g., AWS Monthly Charges" />
          <Input label="Description" value={ruleForm.description} onChange={e => setRuleForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional" />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Match Field" value={ruleForm.matchField} onChange={e => setRuleForm(f => ({ ...f, matchField: e.target.value }))} options={matchFieldOptions} />
            <Select label="Operator" value={ruleForm.matchOperator} onChange={e => setRuleForm(f => ({ ...f, matchOperator: e.target.value }))} options={matchOperatorOptions} />
          </div>
          <Input label="Match Value" value={ruleForm.matchValue} onChange={e => setRuleForm(f => ({ ...f, matchValue: e.target.value }))} placeholder="e.g., AWS" />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Target Entity Type" value={ruleForm.targetEntityType} onChange={e => setRuleForm(f => ({ ...f, targetEntityType: e.target.value }))} options={entityTypeOptions} />
            <Input label="Priority" type="number" value={String(ruleForm.priority)} onChange={e => setRuleForm(f => ({ ...f, priority: parseInt(e.target.value) || 0 }))} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowRuleModal(false)}>Cancel</Button>
            <Button onClick={handleCreateRule} disabled={saving || !ruleForm.name || !ruleForm.matchValue}>{saving ? 'Creating...' : 'Create Rule'}</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
