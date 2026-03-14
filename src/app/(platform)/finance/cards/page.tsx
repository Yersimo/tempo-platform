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
import { CreditCard, Plus, DollarSign, TrendingUp, Snowflake, PlayCircle, Eye, ShieldCheck, AlertTriangle, Tag } from 'lucide-react'
import { useTempo } from '@/lib/store'
import { PageSkeleton } from '@/components/ui/page-skeleton'
import { EmptyState } from '@/components/ui/empty-state'

type TabKey = 'cards' | 'transactions' | 'policies'

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

const SPEND_POLICIES = [
  {
    id: 'pol-1',
    name: 'Standard Employee Card',
    description: 'Default policy for employee-issued corporate cards',
    daily_limit: 50000,
    monthly_limit: 300000,
    allowed_categories: ['software', 'office_supplies', 'books', 'meals'],
    blocked_categories: ['travel', 'marketing'],
    requires_receipt_above: 5000,
    auto_freeze_threshold: 90,
  },
  {
    id: 'pol-2',
    name: 'Manager Travel Card',
    description: 'Extended policy for managers with travel privileges',
    daily_limit: 150000,
    monthly_limit: 500000,
    allowed_categories: ['travel', 'software', 'office_supplies', 'cloud_services', 'meals'],
    blocked_categories: [],
    requires_receipt_above: 10000,
    auto_freeze_threshold: 95,
  },
  {
    id: 'pol-3',
    name: 'Engineering Services',
    description: 'Policy for engineering team cloud and software purchases',
    daily_limit: 200000,
    monthly_limit: 800000,
    allowed_categories: ['software', 'cloud_services', 'books'],
    blocked_categories: ['travel', 'meals', 'marketing', 'recruiting'],
    requires_receipt_above: 2500,
    auto_freeze_threshold: 85,
  },
]

export default function CorporateCardsPage() {
  const tc = useTranslations('common')
  const {
    org,
    corporateCards,
    cardTransactions,
    employees,
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
    ensureModulesLoaded?.(['corporateCards', 'cardTransactions'])?.then?.(() => setPageLoading(false))?.catch?.(() => setPageLoading(false))
    const t = setTimeout(() => setPageLoading(false), 2000)
    return () => clearTimeout(t)
  }, [ensureModulesLoaded])

  const [saving, setSaving] = useState(false)
  const [confirmAction, setConfirmAction] = useState<{show:boolean, type:string, id:string, label:string}|null>(null)

  const [activeTab, setActiveTab] = useState<TabKey>('cards')
  const [showIssueModal, setShowIssueModal] = useState(false)
  const [cardForm, setCardForm] = useState({
    employee_id: '',
    card_type: 'virtual' as 'virtual' | 'physical',
    spend_limit: '',
    currency: 'USD',
    merchant_categories: [] as string[],
  })

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
      (sum: number, c: any) => sum + (c.spent_this_month / c.spend_limit) * 100,
      0
    )
    return Math.round(totalUtil / cardsWithLimits.length)
  }, [corporateCards])

  const pendingTransactions = useMemo(
    () => cardTransactions.filter((t: any) => t.status === 'pending'),
    [cardTransactions]
  )

  // ── Helpers ──

  function getEmployeeName(employeeId: string): string {
    const emp = employees.find((e: any) => e.id === employeeId)
    return emp?.profile?.full_name || tc('unknown')
  }

  function getCardLastFour(cardId: string): string {
    const card = corporateCards.find((c: any) => c.id === cardId)
    return card?.last_four || '----'
  }

  function formatAmount(cents: number): string {
    return `$${(cents / 100).toLocaleString()}`
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  function formatCategoryLabel(cat: string): string {
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

  async function executeConfirmAction() {
    if (!confirmAction) return
    const { type, id } = confirmAction
    setConfirmAction(null)
    if (type === 'freeze') await freezeCard(id)
    else if (type === 'unfreeze') await unfreezeCard(id)
  }

  // ── Issue card modal ──

  function openIssueCard() {
    setCardForm({
      employee_id: employees[0]?.id || '',
      card_type: 'virtual',
      spend_limit: '',
      currency: 'USD',
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
        currency: cardForm.currency,
        allowedCategories,
      })
      addCorporateCard(result.card ?? {
        employee_id: cardForm.employee_id,
        card_type: cardForm.card_type,
        last_four: String(Math.floor(1000 + Math.random() * 9000)),
        status: 'active',
        spend_limit: Number(cardForm.spend_limit) * 100,
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

  // ── Tab buttons ──

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'cards', label: 'Cards' },
    { key: 'transactions', label: 'Transactions' },
    { key: 'policies', label: 'Policies' },
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

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Cards"
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

      {/* ── Tabs ── */}
      <div className="flex gap-1 mb-6 border-b border-divider">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-accent text-accent'
                : 'border-transparent text-t3 hover:text-t1'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Cards Tab ── */}
      {activeTab === 'cards' && (
        <Card padding="none">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>All Cards</CardTitle>
              <Badge variant="info">{corporateCards.length} total</Badge>
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
                  <th className="tempo-th text-right px-4 py-3">Monthly Spend</th>
                  <th className="tempo-th text-left px-4 py-3">Utilization</th>
                  <th className="tempo-th text-center px-4 py-3">{tc('status')}</th>
                  <th className="tempo-th text-center px-4 py-3">{tc('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {corporateCards.map((card: any) => {
                  const utilization =
                    card.spend_limit > 0
                      ? Math.round((card.spent_this_month / card.spend_limit) * 100)
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
                        {formatAmount(card.spent_this_month)}
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
                            <Button
                              size="sm"
                              variant="secondary"
                              disabled={saving}
                              onClick={() => setConfirmAction({ show: true, type: 'freeze', id: card.id, label: `Freeze card ••••${card.last_four}?` })}
                            >
                              <Snowflake size={12} /> Freeze
                            </Button>
                          )}
                          {card.status === 'frozen' && (
                            <Button
                              size="sm"
                              variant="primary"
                              disabled={saving}
                              onClick={() => setConfirmAction({ show: true, type: 'unfreeze', id: card.id, label: `Unfreeze card ••••${card.last_four}?` })}
                            >
                              <PlayCircle size={12} /> Unfreeze
                            </Button>
                          )}
                          {card.status === 'cancelled' && (
                            <span className="text-xs text-t3">Cancelled</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {corporateCards.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-12">
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
        <Card padding="none">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Card Transactions</CardTitle>
              <Badge variant="info">{cardTransactions.length} total</Badge>
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
                  <th className="tempo-th text-center px-4 py-3">{tc('status')}</th>
                  <th className="tempo-th text-center px-4 py-3">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {cardTransactions.map((txn: any) => (
                  <tr key={txn.id} className="hover:bg-canvas/50">
                    <td className="px-6 py-3 text-xs text-t2">
                      {formatDate(txn.transaction_date)}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs font-medium text-t1">{txn.merchant}</p>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-t2">
                      ••••{getCardLastFour(txn.card_id)}
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-t1 text-right">
                      {formatAmount(txn.amount)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant="default">
                        {formatCategoryLabel(txn.category)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge
                        variant={
                          txn.status === 'settled'
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
                      {txn.receipt_url ? (
                        <Button size="sm" variant="ghost">
                          <Eye size={12} /> View
                        </Button>
                      ) : (
                        <span className="text-xs text-t3">None</span>
                      )}
                    </td>
                  </tr>
                ))}
                {cardTransactions.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12">
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
      )}

      {/* ── Policies Tab ── */}
      {activeTab === 'policies' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-t1 flex items-center gap-2">
              <ShieldCheck size={20} /> Spend Policies
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {SPEND_POLICIES.map((policy) => (
              <Card key={policy.id}>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-t1">{policy.name}</h3>
                    <p className="text-xs text-t3 mt-1">{policy.description}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-t3">Daily Limit</span>
                      <span className="font-medium text-t1">
                        {formatAmount(policy.daily_limit)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-t3">Monthly Limit</span>
                      <span className="font-medium text-t1">
                        {formatAmount(policy.monthly_limit)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-t3">Receipt Required Above</span>
                      <span className="font-medium text-t1">
                        {formatAmount(policy.requires_receipt_above)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-t3">Auto-freeze at</span>
                      <span className="font-medium text-t1">
                        {policy.auto_freeze_threshold}% utilization
                      </span>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-t3 mb-2">Allowed Categories</p>
                    <div className="flex flex-wrap gap-1">
                      {policy.allowed_categories.map((cat) => (
                        <Badge key={cat} variant="success">
                          {formatCategoryLabel(cat)}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {policy.blocked_categories.length > 0 && (
                    <div>
                      <p className="text-xs text-t3 mb-2">Blocked Categories</p>
                      <div className="flex flex-wrap gap-1">
                        {policy.blocked_categories.map((cat) => (
                          <Badge key={cat} variant="error">
                            {formatCategoryLabel(cat)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>

          {/* Spending Controls Summary */}
          <Card>
            <h3 className="text-sm font-semibold text-t1 mb-4 flex items-center gap-2">
              <Tag size={16} /> Merchant Category Overview
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {MERCHANT_CATEGORIES.map((cat) => {
                const txnCount = cardTransactions.filter(
                  (t: any) => t.category === cat.value
                ).length
                const txnTotal = cardTransactions
                  .filter((t: any) => t.category === cat.value)
                  .reduce((sum: number, t: any) => sum + t.amount, 0)
                return (
                  <div key={cat.value} className="p-3 bg-canvas rounded-lg">
                    <p className="text-xs font-medium text-t1">{cat.label}</p>
                    <p className="text-sm font-semibold text-t1 mt-1">
                      {formatAmount(txnTotal)}
                    </p>
                    <p className="text-xs text-t3 mt-0.5">
                      {txnCount} transaction{txnCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                )
              })}
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
              label: emp.profile?.full_name || emp.id,
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
          </div>

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

      {/* ── Confirmation Modal ── */}
      <Modal open={!!confirmAction?.show} onClose={() => setConfirmAction(null)} title="Confirm Action">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center flex-shrink-0">
              <AlertTriangle size={20} className="text-warning" />
            </div>
            <div>
              <p className="text-sm font-medium text-t1">{confirmAction?.label}</p>
              <p className="text-xs text-t3 mt-1">This action can be reversed later.</p>
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
