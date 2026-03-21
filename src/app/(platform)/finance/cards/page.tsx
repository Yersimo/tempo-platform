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
import { Input, Select } from '@/components/ui/input'
import {
  CreditCard, Plus, DollarSign, TrendingUp, Snowflake, PlayCircle, Eye,
  ShieldCheck, AlertTriangle, Tag, Search, XCircle, BarChart3, Link2,
  CheckCircle, Clock, Ban, RefreshCw, Settings,
} from 'lucide-react'
import { useTempo, useOrgCurrency } from '@/lib/store'
import { formatCurrency } from '@/lib/utils/format-currency'
import { PageSkeleton } from '@/components/ui/page-skeleton'
import { EmptyState } from '@/components/ui/empty-state'

type TabKey = 'cards' | 'transactions' | 'spend-limits' | 'reconciliation' | 'analytics'

const MERCHANT_CATEGORIES = [
  { value: 'travel', label: 'Travel' },
  { value: 'software', label: 'Software' },
  { value: 'office_supplies', label: 'Office Supplies' },
  { value: 'cloud_services', label: 'Cloud Services' },
  { value: 'books', label: 'Books & Education' },
  { value: 'recruiting', label: 'Recruiting' },
  { value: 'meals', label: 'Meals & Entertainment' },
  { value: 'marketing', label: 'Marketing' },
]

// Demo spend limit rules (cardSpendLimits not yet in store)
const DEMO_SPEND_LIMITS = [
  { id: 'sl-1', card_id: '', card_label: 'All Virtual Cards', category: 'travel', daily_limit: 50000, weekly_limit: 200000, monthly_limit: 500000, per_transaction_limit: 25000, is_active: true },
  { id: 'sl-2', card_id: '', card_label: 'All Virtual Cards', category: 'software', daily_limit: 100000, weekly_limit: 300000, monthly_limit: 800000, per_transaction_limit: 50000, is_active: true },
  { id: 'sl-3', card_id: '', card_label: 'Manager Cards', category: 'meals', daily_limit: 20000, weekly_limit: 75000, monthly_limit: 200000, per_transaction_limit: 15000, is_active: true },
  { id: 'sl-4', card_id: '', card_label: 'Engineering Cards', category: 'cloud_services', daily_limit: 200000, weekly_limit: 500000, monthly_limit: 1500000, per_transaction_limit: 100000, is_active: true },
  { id: 'sl-5', card_id: '', card_label: 'All Cards', category: 'marketing', daily_limit: 0, weekly_limit: 0, monthly_limit: 0, per_transaction_limit: 0, is_active: false },
]

export default function CorporateCardsPage() {
  const tc = useTranslations('common')
  const defaultCurrency = useOrgCurrency()
  const {
    org,
    corporateCards,
    cardTransactions,
    employees,
    expenseReports,
    addCorporateCard,
    updateCorporateCard,
    addToast,
    ensureModulesLoaded,
  } = useTempo()

  async function cardsAPI(action: string, data: Record<string, any> = {}) {
    const res = await fetch('/api/corporate-cards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-org-id': org.id },
      body: JSON.stringify({ action, ...data }),
    })
    if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || 'Request failed') }
    return res.json()
  }

  const [pageLoading, setPageLoading] = useState(true)

  useEffect(() => {
    ensureModulesLoaded?.(['corporateCards', 'cardTransactions', 'expenseReports', 'employees'])?.then?.(() => setPageLoading(false))?.catch?.(() => setPageLoading(false))
    const t = setTimeout(() => setPageLoading(false), 2000)
    return () => clearTimeout(t)
  }, [ensureModulesLoaded])

  const [saving, setSaving] = useState(false)
  const [confirmAction, setConfirmAction] = useState<{show:boolean, type:string, id:string, label:string}|null>(null)

  const [activeTab, setActiveTab] = useState<TabKey>('cards')
  const [searchQuery, setSearchQuery] = useState('')
  const [showIssueModal, setShowIssueModal] = useState(false)
  const [showLimitModal, setShowLimitModal] = useState(false)
  const [txnCardFilter, setTxnCardFilter] = useState('all')
  const [txnCategoryFilter, setTxnCategoryFilter] = useState('all')
  const [cardForm, setCardForm] = useState({
    employee_id: '',
    card_type: 'virtual' as 'virtual' | 'physical',
    spend_limit: '',
    monthly_limit: '',
    currency: defaultCurrency,
    merchant_categories: [] as string[],
  })
  const [limitForm, setLimitForm] = useState({
    card_label: '',
    category: '',
    daily_limit: '',
    weekly_limit: '',
    monthly_limit: '',
    per_transaction_limit: '',
  })
  const [spendLimits, setSpendLimits] = useState(DEMO_SPEND_LIMITS)

  // ── Computed stats ──

  const activeCards = useMemo(
    () => corporateCards.filter((c: any) => c.status === 'active'),
    [corporateCards]
  )

  const totalMonthlySpend = useMemo(
    () => corporateCards.reduce((sum: number, c: any) => sum + (c.spent_this_month || 0), 0),
    [corporateCards]
  )

  const avgUtilization = useMemo(() => {
    const cardsWithLimits = corporateCards.filter((c: any) => c.spend_limit > 0)
    if (cardsWithLimits.length === 0) return 0
    const totalUtil = cardsWithLimits.reduce(
      (sum: number, c: any) => sum + ((c.spent_this_month || 0) / c.spend_limit) * 100,
      0
    )
    return Math.round(totalUtil / cardsWithLimits.length)
  }, [corporateCards])

  const pendingTransactions = useMemo(
    () => cardTransactions.filter((t: any) => t.status === 'pending'),
    [cardTransactions]
  )

  const filteredCards = useMemo(() => {
    if (!searchQuery.trim()) return corporateCards
    const q = searchQuery.toLowerCase()
    return corporateCards.filter((card: any) => {
      const name = employees.find((e: any) => e.id === card.employee_id)?.profile?.full_name || ''
      return name.toLowerCase().includes(q) || (card.last_four || '').includes(q)
    })
  }, [corporateCards, employees, searchQuery])

  const filteredTransactions = useMemo(() => {
    let txns = cardTransactions as any[]
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      txns = txns.filter((t: any) =>
        (t.merchant || t.merchant_name || '').toLowerCase().includes(q) || (t.category || t.merchant_category || '').toLowerCase().includes(q)
      )
    }
    if (txnCardFilter !== 'all') {
      txns = txns.filter((t: any) => t.card_id === txnCardFilter)
    }
    if (txnCategoryFilter !== 'all') {
      txns = txns.filter((t: any) => (t.category || t.merchant_category) === txnCategoryFilter)
    }
    return txns
  }, [cardTransactions, searchQuery, txnCardFilter, txnCategoryFilter])

  // Reconciliation data
  const unreconciledTxns = useMemo(
    () => cardTransactions.filter((t: any) => !t.expense_report_id && t.status !== 'declined' && t.status !== 'refunded'),
    [cardTransactions]
  )
  const reconciledTxns = useMemo(
    () => cardTransactions.filter((t: any) => t.expense_report_id),
    [cardTransactions]
  )

  // Analytics data
  const spendByCategory = useMemo(() => {
    const map: Record<string, number> = {}
    cardTransactions.forEach((t: any) => {
      const cat = t.category || t.merchant_category || 'other'
      map[cat] = (map[cat] || 0) + (t.amount || 0)
    })
    return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([category, amount]) => ({ category, amount }))
  }, [cardTransactions])

  const spendByEmployee = useMemo(() => {
    const cardEmployeeMap: Record<string, string> = {}
    corporateCards.forEach((c: any) => { cardEmployeeMap[c.id] = c.employee_id })
    const map: Record<string, { name: string; amount: number; txnCount: number }> = {}
    cardTransactions.forEach((t: any) => {
      const empId = cardEmployeeMap[t.card_id] || 'unknown'
      const emp = employees.find((e: any) => e.id === empId)
      const name = emp?.profile?.full_name || (emp as any)?.fullName || 'Unknown'
      if (!map[empId]) map[empId] = { name, amount: 0, txnCount: 0 }
      map[empId].amount += t.amount || 0
      map[empId].txnCount += 1
    })
    return Object.values(map).sort((a, b) => b.amount - a.amount)
  }, [cardTransactions, corporateCards, employees])

  const spendByMerchant = useMemo(() => {
    const map: Record<string, { name: string; amount: number; count: number }> = {}
    cardTransactions.forEach((t: any) => {
      const name = t.merchant || t.merchant_name || 'Unknown'
      if (!map[name]) map[name] = { name, amount: 0, count: 0 }
      map[name].amount += t.amount || 0
      map[name].count += 1
    })
    return Object.values(map).sort((a, b) => b.amount - a.amount).slice(0, 10)
  }, [cardTransactions])

  const policyViolationCount = useMemo(() => {
    return cardTransactions.filter((t: any) => t.status === 'declined' || t.flagged).length
  }, [cardTransactions])

  // Suspicious transaction detection
  const suspiciousTxns = useMemo(() => {
    return cardTransactions.filter((t: any) => {
      const amount = t.amount || 0
      if (amount > 100000) return true // > $1000
      if (t.status === 'declined') return true
      if (t.merchant_category === 'marketing' || t.category === 'marketing') return true
      return false
    })
  }, [cardTransactions])

  // ── Helpers ──

  function getEmployeeName(employeeId: string): string {
    const emp = employees.find((e: any) => e.id === employeeId)
    return emp?.profile?.full_name || (emp as any)?.fullName || tc('unknown')
  }

  function getCardLastFour(cardId: string): string {
    const card = corporateCards.find((c: any) => c.id === cardId)
    return card?.last_four || '----'
  }

  function formatAmount(cents: number): string {
    return formatCurrency(cents, defaultCurrency, { cents: true })
  }

  function formatDate(dateStr: string): string {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  function formatCategoryLabel(cat: string): string {
    if (!cat) return 'Other'
    return cat
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')
  }

  // ── Card actions ──

  async function freezeCard(id: string) {
    setSaving(true)
    try {
      const result = await cardsAPI('freeze', { cardId: id })
      updateCorporateCard(id, result.card ?? { status: 'frozen' })
      addToast('Card frozen successfully')
    } catch {
      updateCorporateCard(id, { status: 'frozen' })
      addToast('Card frozen (offline)', 'info')
    } finally {
      setSaving(false)
    }
  }

  async function unfreezeCard(id: string) {
    setSaving(true)
    try {
      const result = await cardsAPI('activate', { cardId: id })
      updateCorporateCard(id, result.card ?? { status: 'active' })
      addToast('Card activated successfully')
    } catch {
      updateCorporateCard(id, { status: 'active' })
      addToast('Card activated (offline)', 'info')
    } finally {
      setSaving(false)
    }
  }

  async function cancelCard(id: string) {
    setSaving(true)
    try {
      await cardsAPI('cancel', { cardId: id })
      updateCorporateCard(id, { status: 'cancelled' })
      addToast('Card cancelled successfully')
    } catch {
      updateCorporateCard(id, { status: 'cancelled' })
      addToast('Card cancelled (offline)', 'info')
    } finally {
      setSaving(false)
    }
  }

  async function executeConfirmAction() {
    if (!confirmAction) return
    const { type, id } = confirmAction
    setConfirmAction(null)
    if (type === 'freeze') await freezeCard(id)
    else if (type === 'unfreeze') await unfreezeCard(id)
    else if (type === 'cancel') await cancelCard(id)
  }

  function flagTransaction(txnId: string) {
    addToast('Transaction flagged for review', 'info')
  }

  function autoReconcile() {
    addToast(`Auto-reconciliation started for ${unreconciledTxns.length} transactions`, 'info')
  }

  // ── Issue card modal ──

  function openIssueCard() {
    setCardForm({
      employee_id: employees[0]?.id || '',
      card_type: 'virtual',
      spend_limit: '',
      monthly_limit: '',
      currency: defaultCurrency,
      merchant_categories: [],
    })
    setShowIssueModal(true)
  }

  function toggleCategory(cat: string) {
    setCardForm((prev) => {
      const cats = prev.merchant_categories.includes(cat)
        ? prev.merchant_categories.filter((c) => c !== cat)
        : [...prev.merchant_categories, cat]
      return { ...prev, merchant_categories: cats }
    })
  }

  async function submitIssueCard() {
    if (!cardForm.employee_id) { addToast('Please select an employee', 'error'); return }
    if (!cardForm.spend_limit || Number(cardForm.spend_limit) <= 0) { addToast('Please enter a valid spend limit', 'error'); return }
    setSaving(true)
    const allowedCategories =
      cardForm.merchant_categories.length > 0
        ? cardForm.merchant_categories
        : MERCHANT_CATEGORIES.map((c) => c.value)
    try {
      const result = await cardsAPI('issue', {
        employeeId: cardForm.employee_id,
        cardType: cardForm.card_type,
        spendLimit: Number(cardForm.spend_limit) * 100,
        monthlyLimit: cardForm.monthly_limit ? Number(cardForm.monthly_limit) * 100 : undefined,
        currency: cardForm.currency,
        allowedCategories,
      })
      addCorporateCard(result.card ?? {
        employee_id: cardForm.employee_id,
        card_type: cardForm.card_type,
        last_four: String(Math.floor(1000 + Math.random() * 9000)),
        status: 'active',
        spend_limit: Number(cardForm.spend_limit) * 100,
        monthly_limit: cardForm.monthly_limit ? Number(cardForm.monthly_limit) * 100 : null,
        spent_this_month: 0,
        currency: cardForm.currency,
        issued_at: new Date().toISOString(),
        merchant_categories: allowedCategories,
      })
      addToast('Card issued successfully')
    } catch {
      addCorporateCard({
        employee_id: cardForm.employee_id,
        card_type: cardForm.card_type,
        last_four: String(Math.floor(1000 + Math.random() * 9000)),
        status: 'active',
        spend_limit: Number(cardForm.spend_limit) * 100,
        monthly_limit: cardForm.monthly_limit ? Number(cardForm.monthly_limit) * 100 : null,
        spent_this_month: 0,
        currency: cardForm.currency,
        issued_at: new Date().toISOString(),
        merchant_categories: allowedCategories,
      })
      addToast('Card issued (offline)', 'info')
    } finally {
      setSaving(false)
    }
    setShowIssueModal(false)
  }

  // ── Spend Limit modal ──

  function openAddLimit() {
    setLimitForm({ card_label: '', category: '', daily_limit: '', weekly_limit: '', monthly_limit: '', per_transaction_limit: '' })
    setShowLimitModal(true)
  }

  function submitSpendLimit() {
    if (!limitForm.card_label || !limitForm.category) { addToast('Card scope and category are required', 'error'); return }
    setSpendLimits(prev => [...prev, {
      id: `sl-${Date.now()}`,
      card_id: '',
      card_label: limitForm.card_label,
      category: limitForm.category,
      daily_limit: Number(limitForm.daily_limit || 0) * 100,
      weekly_limit: Number(limitForm.weekly_limit || 0) * 100,
      monthly_limit: Number(limitForm.monthly_limit || 0) * 100,
      per_transaction_limit: Number(limitForm.per_transaction_limit || 0) * 100,
      is_active: true,
    }])
    addToast('Spend limit rule created', 'success')
    setShowLimitModal(false)
  }

  // ── Tab buttons ──

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'cards', label: 'Cards' },
    { key: 'transactions', label: 'Transactions' },
    { key: 'spend-limits', label: 'Spend Limits' },
    { key: 'reconciliation', label: 'Reconciliation' },
    { key: 'analytics', label: 'Analytics' },
  ]

  if (pageLoading) {
    return (
      <>
        <Header
          title="Corporate Cards"
          subtitle="Manage corporate card program"
          actions={<Button size="sm" disabled><Plus size={14} /> Issue Card</Button>}
        />
        <div className="p-6"><PageSkeleton /></div>
      </>
    )
  }

  return (
    <>
      <Header
        title="Corporate Cards"
        subtitle="Manage corporate card program"
        actions={
          <Button size="sm" onClick={openIssueCard}>
            <Plus size={14} /> Issue Card
          </Button>
        }
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Active Cards"
          value={activeCards.length}
          icon={<CreditCard size={20} />}
        />
        <StatCard
          label="Monthly Spend"
          value={formatAmount(totalMonthlySpend)}
          icon={<DollarSign size={20} />}
        />
        <StatCard
          label="Avg Utilization"
          value={`${avgUtilization}%`}
          icon={<TrendingUp size={20} />}
          change={avgUtilization > 80 ? 'High usage' : 'Healthy'}
          changeType={avgUtilization > 80 ? 'negative' : 'positive'}
        />
        <StatCard
          label="Pending Transactions"
          value={pendingTransactions.length}
          icon={<AlertTriangle size={20} />}
          change={pendingTransactions.length > 0 ? 'Requires review' : 'All clear'}
          changeType={pendingTransactions.length > 0 ? 'negative' : 'positive'}
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-divider overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.key
                ? 'border-accent text-accent'
                : 'border-transparent text-t3 hover:text-t1'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search Bar (cards + transactions tabs) */}
      {(activeTab === 'cards' || activeTab === 'transactions') && (
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-t3" />
            <Input
              placeholder={activeTab === 'cards' ? 'Search by cardholder name...' : 'Search by merchant or category...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          {activeTab === 'transactions' && (
            <>
              <Select
                value={txnCardFilter}
                onChange={(e) => setTxnCardFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'All Cards' },
                  ...corporateCards.map((c: any) => ({
                    value: c.id,
                    label: `••••${c.last_four || '----'} — ${getEmployeeName(c.employee_id)}`,
                  })),
                ]}
              />
              <Select
                value={txnCategoryFilter}
                onChange={(e) => setTxnCategoryFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'All Categories' },
                  ...MERCHANT_CATEGORIES.map(c => ({ value: c.value, label: c.label })),
                ]}
              />
            </>
          )}
        </div>
      )}

      {/* ── Cards Tab ── */}
      {activeTab === 'cards' && (
        <Card padding="none">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>All Cards</CardTitle>
              <Badge variant="info">{filteredCards.length} total</Badge>
            </div>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-divider bg-canvas">
                  <th className="tempo-th text-left px-6 py-3">Cardholder</th>
                  <th className="tempo-th text-left px-4 py-3">Card Number</th>
                  <th className="tempo-th text-center px-4 py-3">Type</th>
                  <th className="tempo-th text-right px-4 py-3">Spend Limit</th>
                  <th className="tempo-th text-right px-4 py-3">Monthly Limit</th>
                  <th className="tempo-th text-right px-4 py-3">Monthly Spend</th>
                  <th className="tempo-th text-left px-4 py-3">Utilization</th>
                  <th className="tempo-th text-center px-4 py-3">{tc('status')}</th>
                  <th className="tempo-th text-center px-4 py-3">{tc('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredCards.map((card: any) => {
                  const utilization =
                    card.spend_limit > 0
                      ? Math.round(((card.spent_this_month || 0) / card.spend_limit) * 100)
                      : 0
                  return (
                    <tr key={card.id} className="hover:bg-canvas/50">
                      <td className="px-6 py-3">
                        <div>
                          <p className="text-xs font-medium text-t1">
                            {getEmployeeName(card.employee_id)}
                          </p>
                          <p className="text-xs text-t3">
                            Issued {formatDate(card.issued_at)}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs font-mono font-medium text-t1">
                        ••••{card.last_four}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={card.card_type === 'virtual' ? 'info' : 'default'}>
                          {card.card_type}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold text-t1 text-right">
                        {formatAmount(card.spend_limit)}
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold text-t1 text-right">
                        {card.monthly_limit ? formatAmount(card.monthly_limit) : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold text-t1 text-right">
                        {formatAmount(card.spent_this_month || 0)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="min-w-[120px]">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-t2">{utilization}%</span>
                          </div>
                          <Progress
                            value={utilization}
                            color={
                              utilization > 90
                                ? 'error'
                                : utilization > 70
                                  ? 'warning'
                                  : 'orange'
                            }
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge
                          variant={
                            card.status === 'active'
                              ? 'success'
                              : card.status === 'frozen'
                                ? 'warning'
                                : 'error'
                          }
                        >
                          {card.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex gap-1 justify-center">
                          {card.status === 'active' && (
                            <>
                              <Button
                                size="sm"
                                variant="secondary"
                                disabled={saving}
                                onClick={() => setConfirmAction({ show: true, type: 'freeze', id: card.id, label: `Freeze card ••••${card.last_four}?` })}
                              >
                                <Snowflake size={12} /> Freeze
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={saving}
                                onClick={() => setConfirmAction({ show: true, type: 'cancel', id: card.id, label: `Cancel card ••••${card.last_four}? This cannot be undone.` })}
                              >
                                <Ban size={12} />
                              </Button>
                            </>
                          )}
                          {card.status === 'frozen' && (
                            <>
                              <Button
                                size="sm"
                                variant="primary"
                                disabled={saving}
                                onClick={() => setConfirmAction({ show: true, type: 'unfreeze', id: card.id, label: `Unfreeze card ••••${card.last_four}?` })}
                              >
                                <PlayCircle size={12} /> Unfreeze
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={saving}
                                onClick={() => setConfirmAction({ show: true, type: 'cancel', id: card.id, label: `Cancel card ••••${card.last_four}? This cannot be undone.` })}
                              >
                                <Ban size={12} />
                              </Button>
                            </>
                          )}
                          {card.status === 'cancelled' && (
                            <span className="text-xs text-t3">Cancelled</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {filteredCards.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-6 py-12">
                      <EmptyState
                        icon={<CreditCard size={32} />}
                        title="No corporate cards issued yet"
                        description="Issue your first corporate card to start managing spend."
                        action={<Button size="sm" onClick={openIssueCard}><Plus size={14} /> Issue Card</Button>}
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ── Transactions Tab ── */}
      {activeTab === 'transactions' && (
        <div className="space-y-4">
          {/* Suspicious transactions banner */}
          {suspiciousTxns.length > 0 && (
            <div className="p-3 rounded-lg bg-warning/10 border border-warning/20 flex items-center gap-3">
              <AlertTriangle size={16} className="text-warning flex-shrink-0" />
              <p className="text-xs text-t1"><span className="font-semibold">{suspiciousTxns.length} suspicious transaction{suspiciousTxns.length !== 1 ? 's' : ''}</span> detected. High-value or policy-violating transactions flagged for review.</p>
            </div>
          )}

          <Card padding="none">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Card Transactions</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant={filteredTransactions.filter((t: any) => !t.receipt_url && !t.receipt_matched).length > 0 ? 'warning' : 'success'}>
                    {filteredTransactions.filter((t: any) => !t.receipt_url && !t.receipt_matched).length} missing receipts
                  </Badge>
                  <Badge variant="info">{filteredTransactions.length} total</Badge>
                </div>
              </div>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-divider bg-canvas">
                    <th className="tempo-th text-left px-6 py-3">Date</th>
                    <th className="tempo-th text-left px-4 py-3">Merchant</th>
                    <th className="tempo-th text-left px-4 py-3">Card</th>
                    <th className="tempo-th text-right px-4 py-3">{tc('amount')}</th>
                    <th className="tempo-th text-center px-4 py-3">MCC Category</th>
                    <th className="tempo-th text-center px-4 py-3">{tc('status')}</th>
                    <th className="tempo-th text-center px-4 py-3">Receipt</th>
                    <th className="tempo-th text-center px-4 py-3">{tc('actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredTransactions.map((txn: any) => {
                    const isSuspicious = (txn.amount || 0) > 100000 || txn.status === 'declined'
                    return (
                      <tr key={txn.id} className={`hover:bg-canvas/50 ${isSuspicious ? 'bg-warning/5' : ''}`}>
                        <td className="px-6 py-3 text-xs text-t2">
                          {formatDate(txn.transaction_date || txn.transacted_at)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-medium text-t1">{txn.merchant || txn.merchant_name}</p>
                            {isSuspicious && <AlertTriangle size={12} className="text-warning" />}
                          </div>
                          {txn.mcc && <p className="text-xs text-t3">MCC: {txn.mcc}</p>}
                        </td>
                        <td className="px-4 py-3 text-xs font-mono text-t2">
                          ••••{getCardLastFour(txn.card_id)}
                        </td>
                        <td className="px-4 py-3 text-xs font-semibold text-t1 text-right">
                          {formatAmount(txn.amount)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant="default">
                            {formatCategoryLabel(txn.category || txn.merchant_category)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge
                            variant={
                              txn.status === 'posted' || txn.status === 'settled'
                                ? 'success'
                                : txn.status === 'pending'
                                  ? 'warning'
                                  : 'error'
                            }
                          >
                            {txn.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {txn.receipt_url || txn.receipt_matched ? (
                            <Badge variant="success">Matched</Badge>
                          ) : (
                            <Badge variant="warning">Missing</Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Button size="sm" variant="ghost" onClick={() => flagTransaction(txn.id)}>
                            <AlertTriangle size={12} /> Flag
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                  {filteredTransactions.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-6 py-12">
                        <EmptyState
                          icon={<DollarSign size={32} />}
                          title="No transactions recorded yet"
                          description="Transactions will appear here once cards are used for purchases."
                        />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ── Spend Limits Tab ── */}
      {activeTab === 'spend-limits' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-t1 flex items-center gap-2">
              <Settings size={16} /> Per-Card Spend Controls
            </h2>
            <Button size="sm" onClick={openAddLimit}><Plus size={14} /> Add Rule</Button>
          </div>

          <Card padding="none">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Spend Limit Rules</CardTitle>
                <Badge variant="info">{spendLimits.length} rules</Badge>
              </div>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-divider bg-canvas">
                    <th className="tempo-th text-left px-6 py-3">Scope</th>
                    <th className="tempo-th text-left px-4 py-3">Category</th>
                    <th className="tempo-th text-right px-4 py-3">Daily Limit</th>
                    <th className="tempo-th text-right px-4 py-3">Weekly Limit</th>
                    <th className="tempo-th text-right px-4 py-3">Monthly Limit</th>
                    <th className="tempo-th text-right px-4 py-3">Per-Txn Limit</th>
                    <th className="tempo-th text-center px-4 py-3">{tc('status')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {spendLimits.map(limit => (
                    <tr key={limit.id} className="hover:bg-canvas/50">
                      <td className="px-6 py-3 text-xs font-medium text-t1">{limit.card_label}</td>
                      <td className="px-4 py-3">
                        <Badge variant="default">{formatCategoryLabel(limit.category)}</Badge>
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold text-t1 text-right">
                        {limit.daily_limit > 0 ? formatAmount(limit.daily_limit) : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold text-t1 text-right">
                        {limit.weekly_limit > 0 ? formatAmount(limit.weekly_limit) : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold text-t1 text-right">
                        {limit.monthly_limit > 0 ? formatAmount(limit.monthly_limit) : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold text-t1 text-right">
                        {limit.per_transaction_limit > 0 ? formatAmount(limit.per_transaction_limit) : '—'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={limit.is_active ? 'success' : 'error'}>
                          {limit.is_active ? 'Active' : 'Disabled'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ── Reconciliation Tab ── */}
      {activeTab === 'reconciliation' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <StatCard label="Unreconciled" value={unreconciledTxns.length} icon={<Clock size={20} />} change="Needs matching" changeType="negative" />
            <StatCard label="Reconciled" value={reconciledTxns.length} icon={<CheckCircle size={20} />} change="Matched to reports" changeType="positive" />
            <StatCard label="Total Unmatched" value={formatAmount(unreconciledTxns.reduce((s: number, t: any) => s + (t.amount || 0), 0))} icon={<DollarSign size={20} />} />
          </div>

          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-t1 flex items-center gap-2">
              <Link2 size={16} /> Match Transactions to Expense Reports
            </h2>
            <Button size="sm" onClick={autoReconcile}>
              <RefreshCw size={14} /> Auto-Reconcile
            </Button>
          </div>

          <Card padding="none">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Unreconciled Transactions</CardTitle>
                <Badge variant="warning">{unreconciledTxns.length} pending</Badge>
              </div>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-divider bg-canvas">
                    <th className="tempo-th text-left px-6 py-3">Date</th>
                    <th className="tempo-th text-left px-4 py-3">Merchant</th>
                    <th className="tempo-th text-left px-4 py-3">Card</th>
                    <th className="tempo-th text-right px-4 py-3">{tc('amount')}</th>
                    <th className="tempo-th text-center px-4 py-3">Category</th>
                    <th className="tempo-th text-center px-4 py-3">Expense Report</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {unreconciledTxns.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12">
                        <EmptyState
                          icon={<CheckCircle size={32} />}
                          title="All transactions reconciled"
                          description="No unmatched transactions remaining."
                        />
                      </td>
                    </tr>
                  ) : unreconciledTxns.map((txn: any) => (
                    <tr key={txn.id} className="hover:bg-canvas/50">
                      <td className="px-6 py-3 text-xs text-t2">{formatDate(txn.transaction_date || txn.transacted_at)}</td>
                      <td className="px-4 py-3 text-xs font-medium text-t1">{txn.merchant || txn.merchant_name}</td>
                      <td className="px-4 py-3 text-xs font-mono text-t2">••••{getCardLastFour(txn.card_id)}</td>
                      <td className="px-4 py-3 text-xs font-semibold text-t1 text-right">{formatAmount(txn.amount)}</td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant="default">{formatCategoryLabel(txn.category || txn.merchant_category)}</Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant="warning">Unmatched</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ── Analytics Tab ── */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Total Spend" value={formatAmount(cardTransactions.reduce((s: number, t: any) => s + (t.amount || 0), 0))} icon={<DollarSign size={20} />} />
            <StatCard label="Transactions" value={cardTransactions.length} icon={<BarChart3 size={20} />} />
            <StatCard label="Top Merchants" value={spendByMerchant.length} icon={<Tag size={20} />} />
            <StatCard label="Policy Violations" value={policyViolationCount} icon={<ShieldCheck size={20} />} change={policyViolationCount > 0 ? 'Requires attention' : 'None'} changeType={policyViolationCount > 0 ? 'negative' : 'positive'} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Spend by Category */}
            <Card>
              <h3 className="text-sm font-semibold text-t1 mb-4">Spend by Category</h3>
              <div className="space-y-3">
                {spendByCategory.length === 0 ? (
                  <p className="text-xs text-t3">No transaction data available</p>
                ) : spendByCategory.map(item => {
                  const totalSpend = spendByCategory.reduce((a, c) => a + c.amount, 0)
                  const pct = totalSpend > 0 ? Math.round((item.amount / totalSpend) * 100) : 0
                  return (
                    <div key={item.category}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-t2">{formatCategoryLabel(item.category)}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-t1">{formatAmount(item.amount)}</span>
                          <span className="text-t3">({pct}%)</span>
                        </div>
                      </div>
                      <Progress value={pct} color="orange" />
                    </div>
                  )
                })}
              </div>
            </Card>

            {/* Spend by Employee */}
            <Card>
              <h3 className="text-sm font-semibold text-t1 mb-4">Spend by Employee</h3>
              <div className="space-y-3">
                {spendByEmployee.length === 0 ? (
                  <p className="text-xs text-t3">No transaction data available</p>
                ) : spendByEmployee.slice(0, 8).map((item, idx) => {
                  const totalSpend = spendByEmployee.reduce((a, c) => a + c.amount, 0)
                  const pct = totalSpend > 0 ? Math.round((item.amount / totalSpend) * 100) : 0
                  return (
                    <div key={idx} className="flex items-center justify-between py-1.5 border-b border-divider last:border-0">
                      <div>
                        <span className="text-xs font-medium text-t1">{item.name}</span>
                        <span className="text-xs text-t3 ml-2">{item.txnCount} txns</span>
                      </div>
                      <span className="text-xs font-semibold text-t1">{formatAmount(item.amount)}</span>
                    </div>
                  )
                })}
              </div>
            </Card>
          </div>

          {/* Top Merchants */}
          <Card>
            <h3 className="text-sm font-semibold text-t1 mb-4">Top Merchants by Spend</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {spendByMerchant.length === 0 ? (
                <p className="text-xs text-t3 col-span-5">No transaction data available</p>
              ) : spendByMerchant.map((item, idx) => (
                <div key={idx} className="p-3 bg-canvas rounded-lg">
                  <p className="text-xs font-medium text-t1 truncate">{item.name}</p>
                  <p className="text-sm font-semibold text-t1 mt-1">{formatAmount(item.amount)}</p>
                  <p className="text-xs text-t3 mt-0.5">{item.count} transaction{item.count !== 1 ? 's' : ''}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ── Issue Card Modal ── */}
      <Modal
        open={showIssueModal}
        onClose={() => setShowIssueModal(false)}
        title="Issue New Card"
      >
        <div className="space-y-4">
          <Select
            label="Employee"
            value={cardForm.employee_id}
            onChange={(e) =>
              setCardForm({ ...cardForm, employee_id: e.target.value })
            }
            options={employees.map((emp: any) => ({
              value: emp.id,
              label: emp.profile?.full_name || emp.fullName || emp.id,
            }))}
          />

          <Select
            label="Card Type"
            value={cardForm.card_type}
            onChange={(e) =>
              setCardForm({
                ...cardForm,
                card_type: e.target.value as 'virtual' | 'physical',
              })
            }
            options={[
              { value: 'virtual', label: 'Virtual Card' },
              { value: 'physical', label: 'Physical Card' },
            ]}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Spend Limit ($)"
              type="number"
              placeholder="5000"
              value={cardForm.spend_limit}
              onChange={(e) =>
                setCardForm({ ...cardForm, spend_limit: e.target.value })
              }
            />
            <Input
              label="Monthly Limit ($)"
              type="number"
              placeholder="10000"
              value={cardForm.monthly_limit}
              onChange={(e) =>
                setCardForm({ ...cardForm, monthly_limit: e.target.value })
              }
            />
          </div>

          <Select
            label={tc('currency')}
            value={cardForm.currency}
            onChange={(e) =>
              setCardForm({ ...cardForm, currency: e.target.value })
            }
            options={[
              { value: 'USD', label: 'USD' },
              { value: 'EUR', label: 'EUR' },
              { value: 'GBP', label: 'GBP' },
              { value: 'XOF', label: 'XOF' },
              { value: 'NGN', label: 'NGN' },
            ]}
          />

          <div>
            <label className="block text-sm font-medium text-t1 mb-2">
              Allowed Merchant Categories
            </label>
            <div className="grid grid-cols-2 gap-2">
              {MERCHANT_CATEGORIES.map((cat) => (
                <label
                  key={cat.value}
                  className="flex items-center gap-2 p-2 rounded-lg bg-canvas cursor-pointer hover:bg-canvas/80 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={cardForm.merchant_categories.includes(cat.value)}
                    onChange={() => toggleCategory(cat.value)}
                    className="rounded border-divider text-accent focus:ring-accent"
                  />
                  <span className="text-xs text-t1">{cat.label}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-t3 mt-1">
              Leave unchecked to allow all categories.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowIssueModal(false)}>
              {tc('cancel')}
            </Button>
            <Button onClick={submitIssueCard} disabled={saving}>
              <CreditCard size={14} /> {saving ? 'Issuing...' : 'Issue Card'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Add Spend Limit Modal ── */}
      <Modal
        open={showLimitModal}
        onClose={() => setShowLimitModal(false)}
        title="Add Spend Limit Rule"
      >
        <div className="space-y-4">
          <Input
            label="Card Scope"
            placeholder="e.g. All Virtual Cards, Engineering Cards"
            value={limitForm.card_label}
            onChange={(e) => setLimitForm({ ...limitForm, card_label: e.target.value })}
          />
          <Select
            label="Category"
            value={limitForm.category}
            onChange={(e) => setLimitForm({ ...limitForm, category: e.target.value })}
            options={[
              { value: '', label: 'Select category...' },
              ...MERCHANT_CATEGORIES.map(c => ({ value: c.value, label: c.label })),
            ]}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Daily Limit ($)" type="number" placeholder="500" value={limitForm.daily_limit} onChange={(e) => setLimitForm({ ...limitForm, daily_limit: e.target.value })} />
            <Input label="Weekly Limit ($)" type="number" placeholder="2000" value={limitForm.weekly_limit} onChange={(e) => setLimitForm({ ...limitForm, weekly_limit: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Monthly Limit ($)" type="number" placeholder="5000" value={limitForm.monthly_limit} onChange={(e) => setLimitForm({ ...limitForm, monthly_limit: e.target.value })} />
            <Input label="Per-Transaction Limit ($)" type="number" placeholder="1000" value={limitForm.per_transaction_limit} onChange={(e) => setLimitForm({ ...limitForm, per_transaction_limit: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowLimitModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitSpendLimit} disabled={saving}>Create Rule</Button>
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
              <p className="text-xs text-t3 mt-1">
                {confirmAction?.type === 'cancel' ? 'This action is permanent and cannot be undone.' : 'This action can be reversed later.'}
              </p>
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
