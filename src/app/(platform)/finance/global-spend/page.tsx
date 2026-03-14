'use client'

import { useState, useMemo, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Header } from '@/components/layout/header'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/ui/stat-card'
import { Progress } from '@/components/ui/progress'
import { Modal } from '@/components/ui/modal'
import { Input, Select, Textarea } from '@/components/ui/input'
import { PageSkeleton } from '@/components/ui/page-skeleton'
import { Globe, DollarSign, TrendingUp, ArrowRightLeft, Building2, Plus, Landmark, MapPin, Wallet, CheckCircle, Clock, Users, AlertTriangle } from 'lucide-react'
import { useTempo } from '@/lib/store'

// ─── Currency formatting helper ───
const currencySymbols: Record<string, string> = {
  USD: '$', NGN: '\u20A6', GHS: '\u20B5', KES: 'KSh', EUR: '\u20AC', GBP: '\u00A3',
}

function formatCurrency(amount: number, currency: string): string {
  const symbol = currencySymbols[currency] || ''
  return `${currency} ${symbol}${amount.toLocaleString()}`
}

function formatCurrencyCents(amountCents: number, currency: string): string {
  const value = amountCents / 100
  return formatCurrency(value, currency)
}

// Rough USD conversion rates for overview totals (cents-based balances)
const usdRates: Record<string, number> = {
  USD: 1, NGN: 0.000641, GHS: 0.0645, KES: 0.0065, EUR: 1.08, GBP: 1.26,
}

function toUSD(amountCents: number, currency: string): number {
  const rate = usdRates[currency] || 1
  return (amountCents / 100) * rate
}

type TabKey = 'overview' | 'accounts' | 'transactions' | 'region'

export default function GlobalSpendPage() {
  const tc = useTranslations('common')
  const { currencyAccounts, fxTransactions, invoices, billPayments, employees, ensureModulesLoaded, org, addToast, addFxTransaction } = useTempo()

  const [pageLoading, setPageLoading] = useState(true)

  useEffect(() => {
    ensureModulesLoaded?.(['currencyAccounts', 'fxTransactions', 'invoices', 'billPayments'])?.then?.(() => setPageLoading(false))?.catch?.(() => setPageLoading(false))
  }, [ensureModulesLoaded])
  useEffect(() => { const t = setTimeout(() => setPageLoading(false), 2000); return () => clearTimeout(t) }, [])

  const [saving, setSaving] = useState(false)
  const [confirmAction, setConfirmAction] = useState<{show:boolean, type:string, id:string, label:string}|null>(null)

  const [activeTab, setActiveTab] = useState<TabKey>('overview')
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [transferForm, setTransferForm] = useState({
    from_currency: '',
    to_currency: '',
    amount: '',
    memo: '',
  })

  // ─── Computed stats ───
  const totalBalanceUSD = useMemo(() =>
    currencyAccounts.reduce((sum, acct) => sum + toUSD(acct.balance, acct.currency), 0),
    [currencyAccounts]
  )

  const uniqueCurrencies = useMemo(() =>
    [...new Set(currencyAccounts.map((a: any) => a.currency))],
    [currencyAccounts]
  )

  const fxVolume = useMemo(() =>
    fxTransactions.reduce((sum, tx) => sum + (tx.from_amount / 100), 0),
    [fxTransactions]
  )

  const entityCount = currencyAccounts.length

  // ─── Region aggregation ───
  const regionData = useMemo(() => {
    const regionMap: Record<string, { headcount: number; invoiceSpend: number; paymentSpend: number }> = {}
    employees.forEach((emp: any) => {
      const country = emp.country || 'Unknown'
      if (!regionMap[country]) regionMap[country] = { headcount: 0, invoiceSpend: 0, paymentSpend: 0 }
      regionMap[country].headcount += 1
    })
    invoices.forEach((inv: any) => {
      // Distribute invoice spend proportionally across regions (simplified: assign to largest region)
      const topRegion = Object.keys(regionMap).sort((a, b) => regionMap[b].headcount - regionMap[a].headcount)[0]
      if (topRegion) regionMap[topRegion].invoiceSpend += inv.amount
    })
    billPayments.forEach((bp: any) => {
      const topRegion = Object.keys(regionMap).sort((a, b) => regionMap[b].headcount - regionMap[a].headcount)[0]
      if (topRegion) regionMap[topRegion].paymentSpend += bp.amount / 100
    })
    return Object.entries(regionMap).map(([country, data]) => ({
      country,
      ...data,
      totalSpend: data.invoiceSpend + data.paymentSpend,
    })).sort((a, b) => b.totalSpend - a.totalSpend)
  }, [employees, invoices, billPayments])

  const totalRegionSpend = regionData.reduce((sum, r) => sum + r.totalSpend, 0)

  // ─── API helper ───
  async function fxAPI(method: 'GET' | 'POST', action: string, data: Record<string, any> = {}) {
    const url = method === 'GET'
      ? `/api/multi-currency?action=${action}&${new URLSearchParams(data as any).toString()}`
      : '/api/multi-currency'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', 'x-org-id': org.id },
      ...(method !== 'GET' ? { body: JSON.stringify({ action, ...data }) } : {}),
    })
    if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || 'Request failed') }
    return res.json()
  }

  // ─── Modal helpers ───
  function openTransferModal() {
    setTransferForm({
      from_currency: currencyAccounts[0]?.currency || 'USD',
      to_currency: currencyAccounts[1]?.currency || 'NGN',
      amount: '',
      memo: '',
    })
    setShowTransferModal(true)
  }

  function validateTransferForm(): boolean {
    if (!transferForm.from_currency) { addToast('Please select a source currency', 'error'); return false }
    if (!transferForm.to_currency) { addToast('Please select a destination currency', 'error'); return false }
    if (transferForm.from_currency === transferForm.to_currency) { addToast('Source and destination currencies must differ', 'error'); return false }
    if (!transferForm.amount || Number(transferForm.amount) <= 0) { addToast('Please enter a valid amount', 'error'); return false }
    return true
  }

  async function executeConfirmAction() {
    if (!confirmAction) return
    const { type } = confirmAction
    setConfirmAction(null)
    if (type === 'transfer') await submitTransferConfirmed()
  }

  async function submitTransferConfirmed() {
    if (!transferForm.from_currency || !transferForm.to_currency || !transferForm.amount) return
    setSaving(true)
    const fromAccount = currencyAccounts.find((a: any) => a.currency === transferForm.from_currency)
    const toAccount = currencyAccounts.find((a: any) => a.currency === transferForm.to_currency)
    const amountCents = Math.round(Number(transferForm.amount) * 100)
    try {
      const result = await fxAPI('POST', 'convert', {
        fromAccountId: fromAccount?.id,
        toAccountId: toAccount?.id,
        fromCurrency: transferForm.from_currency,
        toCurrency: transferForm.to_currency,
        fromAmount: amountCents,
      })
      addFxTransaction({
        from_currency: transferForm.from_currency,
        to_currency: transferForm.to_currency,
        from_amount: amountCents,
        to_amount: result.toAmount ?? Math.round(amountCents * ((usdRates[transferForm.to_currency] || 1) / (usdRates[transferForm.from_currency] || 1))),
        exchange_rate: result.exchangeRate ?? ((usdRates[transferForm.to_currency] || 1) / (usdRates[transferForm.from_currency] || 1)),
        fee: result.fee ?? 0,
        status: 'completed',
        memo: transferForm.memo,
      })
      addToast('FX transfer executed successfully', 'success')
      setShowTransferModal(false)
    } catch (e: any) {
      const rate = (usdRates[transferForm.to_currency] || 1) / (usdRates[transferForm.from_currency] || 1)
      addFxTransaction({
        from_currency: transferForm.from_currency,
        to_currency: transferForm.to_currency,
        from_amount: amountCents,
        to_amount: Math.round(amountCents * rate),
        exchange_rate: rate,
        fee: 0,
        status: 'completed',
        memo: transferForm.memo,
      })
      addToast(e.message || 'API error — updated locally', 'info')
      setShowTransferModal(false)
    } finally {
      setSaving(false)
    }
  }

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'accounts', label: 'Currency Accounts' },
    { key: 'transactions', label: 'FX Transactions' },
    { key: 'region', label: 'By Region' },
  ]

  if (pageLoading) {
    return (
      <>
        <Header title="Global Spend" subtitle="Multi-entity spend overview across currencies" actions={<Button size="sm" disabled><Plus size={14} /> New FX Transfer</Button>} />
        <div className="p-6"><PageSkeleton /></div>
      </>
    )
  }

  return (
    <>
      <Header
        title="Global Spend"
        subtitle="Multi-entity spend overview across currencies"
        actions={<Button size="sm" onClick={openTransferModal}><Plus size={14} /> New FX Transfer</Button>}
      />

      {/* ─── Stat Cards ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Balance (USD)" value={`$${Math.round(totalBalanceUSD).toLocaleString()}`} icon={<DollarSign size={20} />} />
        <StatCard label="Currencies" value={uniqueCurrencies.length} icon={<Globe size={20} />} />
        <StatCard label="FX Volume" value={`$${Math.round(fxVolume).toLocaleString()}`} icon={<ArrowRightLeft size={20} />} change="All time" changeType="positive" />
        <StatCard label="Entities" value={entityCount} icon={<Building2 size={20} />} />
      </div>

      {/* ─── Tabs ─── */}
      <div className="flex gap-1 mb-6 border-b border-divider">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-tempo-600 text-tempo-600'
                : 'border-transparent text-t3 hover:text-t1'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── Overview Tab ─── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Currency Account Cards */}
          <div>
            <h2 className="text-sm font-semibold text-t1 mb-4 flex items-center gap-2">
              <Wallet size={20} /> Currency Accounts
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {currencyAccounts.map((acct: any) => (
                <Card key={acct.id}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-tempo-600/10 flex items-center justify-center">
                        <Landmark size={16} className="text-tempo-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-t1">{acct.currency}</p>
                        <p className="text-xs text-t3">{acct.bank_name}</p>
                      </div>
                    </div>
                    {acct.is_primary && <Badge variant="success">Primary</Badge>}
                  </div>
                  <p className="text-lg font-bold text-t1">{formatCurrencyCents(acct.balance, acct.currency)}</p>
                  <p className="text-xs text-t3 mt-1">{acct.account_number}</p>
                  <p className="text-xs text-t3 mt-0.5">~ ${Math.round(toUSD(acct.balance, acct.currency)).toLocaleString()} USD</p>
                </Card>
              ))}
              {currencyAccounts.length === 0 && (
                <Card>
                  <p className="text-sm text-t3">No currency accounts configured</p>
                </Card>
              )}
            </div>
          </div>

          {/* Recent FX Activity */}
          <div>
            <h2 className="text-sm font-semibold text-t1 mb-4 flex items-center gap-2">
              <ArrowRightLeft size={20} /> Recent FX Activity
            </h2>
            <Card padding="none">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-divider bg-canvas">
                      <th className="tempo-th text-left px-6 py-3">Date</th>
                      <th className="tempo-th text-left px-4 py-3">From</th>
                      <th className="tempo-th text-left px-4 py-3">To</th>
                      <th className="tempo-th text-right px-4 py-3">Rate</th>
                      <th className="tempo-th text-center px-4 py-3">{tc('status')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {fxTransactions.slice(0, 5).map((tx: any) => (
                      <tr key={tx.id} className="hover:bg-canvas/50">
                        <td className="px-6 py-3 text-xs text-t2">{new Date(tx.executed_at).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-xs font-medium text-t1">{formatCurrencyCents(tx.from_amount, tx.from_currency)}</td>
                        <td className="px-4 py-3 text-xs font-medium text-t1">{formatCurrencyCents(tx.to_amount, tx.to_currency)}</td>
                        <td className="px-4 py-3 text-xs text-t2 text-right">{tx.exchange_rate}</td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant={tx.status === 'completed' ? 'success' : tx.status === 'pending' ? 'warning' : 'default'}>
                            {tx.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                    {fxTransactions.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-sm text-t3">No FX transactions yet</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ─── Currency Accounts Tab ─── */}
      {activeTab === 'accounts' && (
        <Card padding="none">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>All Currency Accounts</CardTitle>
              <Badge variant="info">{currencyAccounts.length} accounts</Badge>
            </div>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-divider bg-canvas">
                  <th className="tempo-th text-left px-6 py-3">{tc('currency')}</th>
                  <th className="tempo-th text-left px-4 py-3">Bank</th>
                  <th className="tempo-th text-left px-4 py-3">Account</th>
                  <th className="tempo-th text-right px-4 py-3">Balance</th>
                  <th className="tempo-th text-center px-4 py-3">Primary</th>
                  <th className="tempo-th text-center px-4 py-3">{tc('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {currencyAccounts.map((acct: any) => {
                  const usdEquiv = toUSD(acct.balance, acct.currency)
                  const totalUSD = totalBalanceUSD || 1
                  return (
                    <tr key={acct.id} className="hover:bg-canvas/50">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-md bg-tempo-600/10 flex items-center justify-center">
                            <span className="text-xs font-bold text-tempo-600">{acct.currency}</span>
                          </div>
                          <span className="text-xs font-medium text-t1">{acct.currency}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-t2">{acct.bank_name}</td>
                      <td className="px-4 py-3 text-xs font-mono text-t2">{acct.account_number}</td>
                      <td className="px-4 py-3 text-right">
                        <p className="text-xs font-semibold text-t1">{formatCurrencyCents(acct.balance, acct.currency)}</p>
                        <p className="text-xs text-t3">~ ${Math.round(usdEquiv).toLocaleString()} USD</p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {acct.is_primary ? (
                          <Badge variant="success">Primary</Badge>
                        ) : (
                          <span className="text-xs text-t3">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex gap-1 justify-center">
                          <Button size="sm" variant="secondary">
                            <ArrowRightLeft size={12} /> Transfer
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Balance Distribution */}
          <div className="p-6 border-t border-divider">
            <h3 className="text-sm font-semibold text-t1 mb-4">Balance Distribution</h3>
            <div className="space-y-3">
              {currencyAccounts.map((acct: any) => {
                const usdEquiv = toUSD(acct.balance, acct.currency)
                const pct = totalBalanceUSD > 0 ? Math.round((usdEquiv / totalBalanceUSD) * 100) : 0
                return (
                  <div key={acct.id}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-t2">{acct.currency} - {acct.bank_name}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-t1">${Math.round(usdEquiv).toLocaleString()}</span>
                        <span className="text-xs text-t3">({pct}%)</span>
                      </div>
                    </div>
                    <Progress value={pct} color="orange" />
                  </div>
                )
              })}
            </div>
          </div>
        </Card>
      )}

      {/* ─── FX Transactions Tab ─── */}
      {activeTab === 'transactions' && (
        <Card padding="none">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>FX Transactions</CardTitle>
              <div className="flex gap-2">
                <Badge variant="info">{fxTransactions.length} transactions</Badge>
                <Button size="sm" variant="secondary" onClick={openTransferModal}>
                  <Plus size={12} /> New Transfer
                </Button>
              </div>
            </div>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-divider bg-canvas">
                  <th className="tempo-th text-left px-6 py-3">Date</th>
                  <th className="tempo-th text-left px-4 py-3">From</th>
                  <th className="tempo-th text-left px-4 py-3">To</th>
                  <th className="tempo-th text-right px-4 py-3">Rate</th>
                  <th className="tempo-th text-right px-4 py-3">Fee</th>
                  <th className="tempo-th text-center px-4 py-3">{tc('status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {fxTransactions.map((tx: any) => (
                  <tr key={tx.id} className="hover:bg-canvas/50">
                    <td className="px-6 py-3 text-xs text-t2">{new Date(tx.executed_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-xs font-semibold text-t1">{formatCurrencyCents(tx.from_amount, tx.from_currency)}</p>
                        <p className="text-xs text-t3">{tx.from_currency}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-xs font-semibold text-t1">{formatCurrencyCents(tx.to_amount, tx.to_currency)}</p>
                        <p className="text-xs text-t3">{tx.to_currency}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-t2 text-right">{tx.exchange_rate.toFixed(4)}</td>
                    <td className="px-4 py-3 text-xs text-t2 text-right">{formatCurrencyCents(tx.fee, tx.from_currency)}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={
                        tx.status === 'completed' ? 'success' :
                        tx.status === 'pending' ? 'warning' :
                        tx.status === 'failed' ? 'error' : 'default'
                      }>
                        {tx.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {fxTransactions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-sm text-t3">No FX transactions yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* FX Summary Stats */}
          <div className="p-6 border-t border-divider">
            <h3 className="text-sm font-semibold text-t1 mb-4">Transaction Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-canvas rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle size={14} className="text-success" />
                  <span className="text-xs text-t3">Completed</span>
                </div>
                <p className="text-sm font-semibold text-t1">
                  {fxTransactions.filter((tx: any) => tx.status === 'completed').length}
                </p>
              </div>
              <div className="p-3 bg-canvas rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Clock size={14} className="text-warning" />
                  <span className="text-xs text-t3">Pending</span>
                </div>
                <p className="text-sm font-semibold text-t1">
                  {fxTransactions.filter((tx: any) => tx.status === 'pending').length}
                </p>
              </div>
              <div className="p-3 bg-canvas rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign size={14} className="text-tempo-600" />
                  <span className="text-xs text-t3">Total Volume</span>
                </div>
                <p className="text-sm font-semibold text-t1">${Math.round(fxVolume).toLocaleString()}</p>
              </div>
              <div className="p-3 bg-canvas rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp size={14} className="text-info" />
                  <span className="text-xs text-t3">Total Fees</span>
                </div>
                <p className="text-sm font-semibold text-t1">
                  ${(fxTransactions.reduce((sum, tx: any) => sum + (tx.fee / 100), 0)).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* ─── By Region Tab ─── */}
      {activeTab === 'region' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-sm font-semibold text-t1 mb-4 flex items-center gap-2">
              <MapPin size={20} /> Spend by Region
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {regionData.map(region => {
                const pct = totalRegionSpend > 0 ? Math.round((region.totalSpend / totalRegionSpend) * 100) : 0
                return (
                  <Card key={region.country}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-tempo-600/10 flex items-center justify-center">
                          <Globe size={16} className="text-tempo-600" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-t1">{region.country}</p>
                          <p className="text-xs text-t3">{region.headcount} employees</p>
                        </div>
                      </div>
                      <Badge variant="default">{pct}%</Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-t3">Invoice Spend</span>
                        <span className="font-medium text-t1">${region.invoiceSpend.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-t3">Payment Spend</span>
                        <span className="font-medium text-t1">${Math.round(region.paymentSpend).toLocaleString()}</span>
                      </div>
                      <div className="pt-2 border-t border-divider flex justify-between text-xs">
                        <span className="font-medium text-t2">Total Spend</span>
                        <span className="font-semibold text-t1">${Math.round(region.totalSpend).toLocaleString()}</span>
                      </div>
                      <Progress value={pct} color="orange" />
                    </div>
                  </Card>
                )
              })}
              {regionData.length === 0 && (
                <Card>
                  <p className="text-sm text-t3">No region data available</p>
                </Card>
              )}
            </div>
          </div>

          {/* Headcount Summary */}
          <Card>
            <h3 className="text-sm font-semibold text-t1 mb-4 flex items-center gap-2">
              <Users size={16} /> Headcount by Region
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-divider bg-canvas">
                    <th className="tempo-th text-left px-6 py-3">Country</th>
                    <th className="tempo-th text-right px-4 py-3">Headcount</th>
                    <th className="tempo-th text-right px-4 py-3">Total Spend</th>
                    <th className="tempo-th text-right px-4 py-3">Spend / Employee</th>
                    <th className="tempo-th text-left px-4 py-3">Distribution</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {regionData.map(region => {
                    const perEmployee = region.headcount > 0 ? Math.round(region.totalSpend / region.headcount) : 0
                    const pct = totalRegionSpend > 0 ? Math.round((region.totalSpend / totalRegionSpend) * 100) : 0
                    return (
                      <tr key={region.country} className="hover:bg-canvas/50">
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-2">
                            <MapPin size={14} className="text-t3" />
                            <span className="text-xs font-medium text-t1">{region.country}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs font-semibold text-t1 text-right">{region.headcount}</td>
                        <td className="px-4 py-3 text-xs font-semibold text-t1 text-right">${Math.round(region.totalSpend).toLocaleString()}</td>
                        <td className="px-4 py-3 text-xs text-t2 text-right">${perEmployee.toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <div className="min-w-[120px]">
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-t3">{pct}%</span>
                            </div>
                            <Progress value={pct} color="orange" />
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ─── New FX Transfer Modal ─── */}
      <Modal open={showTransferModal} onClose={() => setShowTransferModal(false)} title="New FX Transfer">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="From Currency"
              value={transferForm.from_currency}
              onChange={(e) => setTransferForm({ ...transferForm, from_currency: e.target.value })}
              options={currencyAccounts.map((a: any) => ({
                value: a.currency,
                label: `${a.currency} - ${a.bank_name}`,
              }))}
            />
            <Select
              label="To Currency"
              value={transferForm.to_currency}
              onChange={(e) => setTransferForm({ ...transferForm, to_currency: e.target.value })}
              options={currencyAccounts.map((a: any) => ({
                value: a.currency,
                label: `${a.currency} - ${a.bank_name}`,
              }))}
            />
          </div>
          <Input
            label={tc('amount')}
            type="number"
            placeholder="10000"
            value={transferForm.amount}
            onChange={(e) => setTransferForm({ ...transferForm, amount: e.target.value })}
          />
          <Textarea
            label="Purpose / Memo"
            placeholder="Payroll funding, vendor payment, etc."
            rows={2}
            value={transferForm.memo}
            onChange={(e) => setTransferForm({ ...transferForm, memo: e.target.value })}
          />
          {transferForm.from_currency && transferForm.to_currency && transferForm.from_currency !== transferForm.to_currency && (
            <div className="p-3 bg-canvas rounded-lg">
              <p className="text-xs text-t3 mb-1">Estimated Rate</p>
              <p className="text-sm font-medium text-t1">
                1 {transferForm.from_currency} = {
                  ((usdRates[transferForm.to_currency] || 1) / (usdRates[transferForm.from_currency] || 1)).toFixed(4)
                } {transferForm.to_currency}
              </p>
              {transferForm.amount && (
                <p className="text-xs text-t3 mt-1">
                  Estimated: {formatCurrency(
                    Number(transferForm.amount) * ((usdRates[transferForm.to_currency] || 1) / (usdRates[transferForm.from_currency] || 1)),
                    transferForm.to_currency
                  )}
                </p>
              )}
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowTransferModal(false)}>{tc('cancel')}</Button>
            <Button onClick={() => { if (validateTransferForm()) setConfirmAction({ show: true, type: 'transfer', id: '', label: `Execute FX transfer of ${transferForm.amount} ${transferForm.from_currency} to ${transferForm.to_currency}?` }) }} disabled={saving}>
              <ArrowRightLeft size={14} /> {saving ? 'Executing...' : 'Execute Transfer'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Confirmation Modal ── */}
      <Modal open={!!confirmAction?.show} onClose={() => setConfirmAction(null)} title="Confirm Action">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center flex-shrink-0">
              <AlertTriangle size={20} className="text-warning" />
            </div>
            <div>
              <p className="text-sm font-medium text-t1">{confirmAction?.label}</p>
              <p className="text-xs text-t3 mt-1">This action will be executed immediately.</p>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setConfirmAction(null)}>{tc('cancel')}</Button>
            <Button onClick={executeConfirmAction} disabled={saving}>
              {saving ? 'Processing...' : 'Confirm'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
