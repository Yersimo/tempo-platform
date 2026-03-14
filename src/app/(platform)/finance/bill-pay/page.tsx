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
import { CircleDollarSign, Plus, Calendar, Clock, CheckCircle, XCircle, Send, Repeat, Pause, Play, AlertTriangle, CreditCard, Ban, Search } from 'lucide-react'
import { useTempo } from '@/lib/store'
import { PageSkeleton } from '@/components/ui/page-skeleton'
import { EmptyState } from '@/components/ui/empty-state'

type TabKey = 'payments' | 'scheduled' | 'recurring' | 'approval'

export default function BillPayPage() {
  const tc = useTranslations('common')
  const { billPayments, billPaySchedules, vendors, addBillPayment, updateBillPayment, addBillPaySchedule, updateBillPaySchedule, ensureModulesLoaded, org, currentUser, addToast } = useTempo()

  const [pageLoading, setPageLoading] = useState(true)

  useEffect(() => {
    ensureModulesLoaded?.(['billPayments', 'billPaySchedules', 'vendors'])?.then?.(() => setPageLoading(false))?.catch?.(() => setPageLoading(false))
    const t = setTimeout(() => setPageLoading(false), 2000)
    return () => clearTimeout(t)
  }, [ensureModulesLoaded])

  const [saving, setSaving] = useState(false)
  const [confirmAction, setConfirmAction] = useState<{show:boolean, type:string, id:string, label:string}|null>(null)

  const [activeTab, setActiveTab] = useState<TabKey>('payments')
  const [searchQuery, setSearchQuery] = useState('')
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentForm, setPaymentForm] = useState({
    vendor_id: '',
    amount: '',
    currency: 'USD',
    method: 'ach',
    scheduled_date: '',
    memo: '',
  })

  // ── Computed Stats ──
  const totalPaid = useMemo(
    () => billPayments.filter((p: any) => p.status === 'paid').reduce((sum: number, p: any) => sum + p.amount, 0),
    [billPayments]
  )
  const totalScheduled = useMemo(
    () => billPayments.filter((p: any) => p.status === 'scheduled').reduce((sum: number, p: any) => sum + p.amount, 0),
    [billPayments]
  )
  const pendingCount = useMemo(
    () => billPayments.filter((p: any) => p.status === 'pending').length,
    [billPayments]
  )
  const activeSchedules = useMemo(
    () => billPaySchedules.filter((s: any) => s.is_active).length,
    [billPaySchedules]
  )

  // ── Filtered Lists ──
  const scheduledPayments = useMemo(
    () => [...billPayments]
      .filter((p: any) => p.status === 'scheduled')
      .sort((a: any, b: any) => (a.scheduled_date || '').localeCompare(b.scheduled_date || '')),
    [billPayments]
  )
  const pendingPayments = useMemo(
    () => billPayments.filter((p: any) => p.status === 'pending'),
    [billPayments]
  )

  const filteredPayments = useMemo(() => {
    if (!searchQuery.trim()) return billPayments
    const q = searchQuery.toLowerCase()
    return billPayments.filter((p: any) => {
      const vendorName = vendors.find((v: any) => v.id === p.vendor_id)?.name || ''
      return vendorName.toLowerCase().includes(q) || (p.memo || '').toLowerCase().includes(q) || (p.reference_number || '').toLowerCase().includes(q)
    })
  }, [billPayments, vendors, searchQuery])

  // ── Helpers ──
  function getVendorName(vendorId: string) {
    const vendor = vendors.find((v: any) => v.id === vendorId)
    return vendor?.name || tc('unknown')
  }

  function formatAmount(cents: number) {
    return (cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  function getMethodBadge(method: string) {
    const variants: Record<string, 'info' | 'warning' | 'default'> = {
      ach: 'info',
      wire: 'warning',
      check: 'default',
    }
    return (
      <Badge variant={variants[method] || 'default'}>
        {method.toUpperCase()}
      </Badge>
    )
  }

  function getStatusBadge(status: string) {
    const variants: Record<string, 'success' | 'info' | 'warning' | 'error' | 'default'> = {
      paid: 'success',
      scheduled: 'info',
      pending: 'warning',
      failed: 'error',
    }
    return (
      <Badge variant={variants[status] || 'default'}>
        {status}
      </Badge>
    )
  }

  // ── API Helper ──
  async function billPayAPI(action: string, data: Record<string, any> = {}) {
    const res = await fetch('/api/bill-pay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-org-id': org.id },
      body: JSON.stringify({ action, ...data }),
    })
    if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || 'Request failed') }
    return res.json()
  }

  // ── Actions ──
  async function markAsPaid(id: string) {
    setSaving(true)
    try {
      await billPayAPI('approve', { paymentId: id, approverId: currentUser?.id })
      updateBillPayment(id, { status: 'paid', paid_date: new Date().toISOString().split('T')[0] })
      addToast('Payment marked as paid', 'success')
    } catch (e: any) {
      updateBillPayment(id, { status: 'paid', paid_date: new Date().toISOString().split('T')[0] })
      addToast(e.message || 'API error — updated locally', 'info')
    } finally {
      setSaving(false)
    }
  }

  async function cancelPayment(id: string) {
    setSaving(true)
    try {
      await billPayAPI('cancel', { paymentId: id })
      updateBillPayment(id, { status: 'failed' })
      addToast('Payment cancelled', 'success')
    } catch (e: any) {
      updateBillPayment(id, { status: 'failed' })
      addToast(e.message || 'API error — updated locally', 'info')
    } finally {
      setSaving(false)
    }
  }

  async function approvePayment(id: string) {
    setSaving(true)
    try {
      await billPayAPI('approve', { paymentId: id, approverId: currentUser?.id })
      updateBillPayment(id, { status: 'scheduled' })
      addToast('Payment approved', 'success')
    } catch (e: any) {
      updateBillPayment(id, { status: 'scheduled' })
      addToast(e.message || 'API error — updated locally', 'info')
    } finally {
      setSaving(false)
    }
  }

  function rejectPayment(id: string) {
    setSaving(true)
    updateBillPayment(id, { status: 'failed' })
    addToast('Payment rejected', 'success')
    setSaving(false)
  }

  async function toggleSchedule(id: string, currentActive: boolean) {
    setSaving(true)
    try {
      await billPayAPI('update-recurring', { scheduleId: id, isActive: !currentActive })
      updateBillPaySchedule(id, { is_active: !currentActive })
      addToast(currentActive ? 'Schedule paused' : 'Schedule resumed', 'success')
    } catch (e: any) {
      updateBillPaySchedule(id, { is_active: !currentActive })
      addToast(e.message || 'API error — updated locally', 'info')
    } finally {
      setSaving(false)
    }
  }

  async function executeConfirmAction() {
    if (!confirmAction) return
    const { type, id } = confirmAction
    setConfirmAction(null)
    if (type === 'cancel') await cancelPayment(id)
    else if (type === 'reject') rejectPayment(id)
  }

  // ── New Payment Modal ──
  function openNewPayment() {
    setPaymentForm({
      vendor_id: vendors[0]?.id || '',
      amount: '',
      currency: 'USD',
      method: 'ach',
      scheduled_date: '',
      memo: '',
    })
    setShowPaymentModal(true)
  }

  async function submitPayment() {
    if (!paymentForm.vendor_id) { addToast('Please select a vendor', 'error'); return }
    if (!paymentForm.amount || Number(paymentForm.amount) <= 0) { addToast('Please enter a valid amount', 'error'); return }
    setSaving(true)
    const paymentData = {
      vendor_id: paymentForm.vendor_id,
      amount: Math.round(Number(paymentForm.amount) * 100),
      currency: paymentForm.currency,
      method: paymentForm.method,
      status: 'pending' as const,
      scheduled_date: paymentForm.scheduled_date || new Date().toISOString().split('T')[0],
      paid_date: null,
      reference_number: `BP-${Date.now().toString().slice(-6)}`,
      memo: paymentForm.memo,
      created_by: 'current-user',
    }
    try {
      await billPayAPI('create', {
        vendorId: paymentData.vendor_id,
        amount: paymentData.amount,
        method: paymentData.method,
        dueDate: paymentData.scheduled_date,
        description: paymentData.memo,
        invoiceNumber: paymentData.reference_number,
        currency: paymentData.currency,
      })
      addBillPayment(paymentData)
      addToast('Payment created', 'success')
    } catch (e: any) {
      addBillPayment(paymentData)
      addToast(e.message || 'API error — created locally', 'info')
    } finally {
      setSaving(false)
    }
    setShowPaymentModal(false)
  }

  // ── Tab Config ──
  const tabs: { key: TabKey; label: string; count?: number }[] = [
    { key: 'payments', label: 'Payments', count: billPayments.length },
    { key: 'scheduled', label: 'Scheduled', count: scheduledPayments.length },
    { key: 'recurring', label: 'Recurring', count: billPaySchedules.length },
    { key: 'approval', label: 'Approval Queue', count: pendingCount },
  ]

  if (pageLoading) {
    return (
      <>
        <Header
          title="Bill Pay"
          subtitle="Accounts payable automation"
          actions={<Button size="sm" disabled><Plus size={14} /> New Payment</Button>}
        />
        <div className="p-6"><PageSkeleton /></div>
      </>
    )
  }

  return (
    <>
      <Header
        title="Bill Pay"
        subtitle="Accounts payable automation"
        actions={<Button size="sm" onClick={openNewPayment}><Plus size={14} /> New Payment</Button>}
      />

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Paid"
          value={`$${formatAmount(totalPaid)}`}
          icon={<CheckCircle size={20} />}
          change="Settled"
          changeType="positive"
        />
        <StatCard
          label="Scheduled"
          value={`$${formatAmount(totalScheduled)}`}
          icon={<Calendar size={20} />}
        />
        <StatCard
          label="Pending Approval"
          value={pendingCount}
          icon={<Clock size={20} />}
          change={pendingCount > 0 ? 'Requires attention' : undefined}
          changeType={pendingCount > 0 ? 'negative' : undefined}
        />
        <StatCard
          label="Recurring"
          value={activeSchedules}
          icon={<Repeat size={20} />}
        />
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 mb-4 border-b border-divider">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-brand text-brand'
                : 'border-transparent text-t3 hover:text-t1'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="ml-1.5 px-1.5 py-0.5 text-[10px] rounded-full bg-canvas text-t3">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Search Bar ── */}
      {activeTab === 'payments' && (
        <div className="mb-4">
          <div className="relative max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-t3" />
            <Input
              placeholder="Search by vendor or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      )}

      {/* ── Payments Tab ── */}
      {activeTab === 'payments' && (
        <Card padding="none">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>All Payments</CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-xs text-t3">{filteredPayments.length} total</span>
              </div>
            </div>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-divider bg-canvas">
                  <th className="tempo-th text-left px-6 py-3">Reference #</th>
                  <th className="tempo-th text-left px-4 py-3">Vendor</th>
                  <th className="tempo-th text-right px-4 py-3">{tc('amount')}</th>
                  <th className="tempo-th text-center px-4 py-3">Method</th>
                  <th className="tempo-th text-left px-4 py-3">Date</th>
                  <th className="tempo-th text-center px-4 py-3">{tc('status')}</th>
                  <th className="tempo-th text-center px-4 py-3">{tc('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredPayments.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12">
                      <EmptyState
                        icon={<CircleDollarSign size={32} />}
                        title={searchQuery ? 'No matching payments' : 'No payments yet'}
                        description={searchQuery ? 'Try adjusting your search terms.' : 'Create your first payment to start managing accounts payable.'}
                        action={!searchQuery ? <Button size="sm" onClick={openNewPayment}><Plus size={14} /> New Payment</Button> : undefined}
                      />
                    </td>
                  </tr>
                )}
                {filteredPayments.map((payment: any) => (
                  <tr key={payment.id} className="hover:bg-canvas/50">
                    <td className="px-6 py-3 text-xs font-mono font-medium text-t1">{payment.reference_number}</td>
                    <td className="px-4 py-3 text-xs text-t2">{getVendorName(payment.vendor_id)}</td>
                    <td className="px-4 py-3 text-xs font-semibold text-t1 text-right">${formatAmount(payment.amount)}</td>
                    <td className="px-4 py-3 text-center">{getMethodBadge(payment.method)}</td>
                    <td className="px-4 py-3 text-xs text-t2">{payment.paid_date || payment.scheduled_date}</td>
                    <td className="px-4 py-3 text-center">{getStatusBadge(payment.status)}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex gap-1 justify-center">
                        {(payment.status === 'scheduled' || payment.status === 'pending') && (
                          <>
                            <Button size="sm" variant="primary" disabled={saving} onClick={() => markAsPaid(payment.id)}>
                              <CheckCircle size={12} /> Mark Paid
                            </Button>
                            <Button size="sm" variant="ghost" disabled={saving} onClick={() => setConfirmAction({ show: true, type: 'cancel', id: payment.id, label: `Cancel payment ${payment.reference_number}?` })}>
                              <Ban size={12} /> Cancel
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ── Scheduled Tab ── */}
      {activeTab === 'scheduled' && (
        <Card padding="none">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Upcoming Scheduled Payments</CardTitle>
              <span className="text-xs text-t3">{scheduledPayments.length} upcoming</span>
            </div>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-divider bg-canvas">
                  <th className="tempo-th text-left px-6 py-3">Scheduled Date</th>
                  <th className="tempo-th text-left px-4 py-3">Reference #</th>
                  <th className="tempo-th text-left px-4 py-3">Vendor</th>
                  <th className="tempo-th text-right px-4 py-3">{tc('amount')}</th>
                  <th className="tempo-th text-center px-4 py-3">Method</th>
                  <th className="tempo-th text-left px-4 py-3">Memo</th>
                  <th className="tempo-th text-center px-4 py-3">{tc('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {scheduledPayments.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-sm text-t3">
                      No scheduled payments.
                    </td>
                  </tr>
                )}
                {scheduledPayments.map((payment: any) => {
                  const isOverdue = payment.scheduled_date && new Date(payment.scheduled_date) < new Date()
                  return (
                    <tr key={payment.id} className="hover:bg-canvas/50">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className={isOverdue ? 'text-error' : 'text-t3'} />
                          <span className={`text-xs font-medium ${isOverdue ? 'text-error' : 'text-t1'}`}>
                            {payment.scheduled_date}
                          </span>
                          {isOverdue && <Badge variant="error">Overdue</Badge>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-t2">{payment.reference_number}</td>
                      <td className="px-4 py-3 text-xs text-t2">{getVendorName(payment.vendor_id)}</td>
                      <td className="px-4 py-3 text-xs font-semibold text-t1 text-right">${formatAmount(payment.amount)}</td>
                      <td className="px-4 py-3 text-center">{getMethodBadge(payment.method)}</td>
                      <td className="px-4 py-3 text-xs text-t2 max-w-[200px] truncate">{payment.memo}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex gap-1 justify-center">
                          <Button size="sm" variant="primary" disabled={saving} onClick={() => markAsPaid(payment.id)}>
                            <Send size={12} /> Process Now
                          </Button>
                          <Button size="sm" variant="ghost" disabled={saving} onClick={() => setConfirmAction({ show: true, type: 'cancel', id: payment.id, label: `Cancel scheduled payment ${payment.reference_number}?` })}>
                            <Ban size={12} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ── Recurring Tab ── */}
      {activeTab === 'recurring' && (
        <Card padding="none">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recurring Payment Schedules</CardTitle>
              <span className="text-xs text-t3">{billPaySchedules.length} schedules</span>
            </div>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-divider bg-canvas">
                  <th className="tempo-th text-left px-6 py-3">Vendor</th>
                  <th className="tempo-th text-right px-4 py-3">{tc('amount')}</th>
                  <th className="tempo-th text-center px-4 py-3">Method</th>
                  <th className="tempo-th text-center px-4 py-3">Frequency</th>
                  <th className="tempo-th text-left px-4 py-3">Next Payment</th>
                  <th className="tempo-th text-left px-4 py-3">End Date</th>
                  <th className="tempo-th text-center px-4 py-3">{tc('status')}</th>
                  <th className="tempo-th text-center px-4 py-3">{tc('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {billPaySchedules.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-sm text-t3">
                      No recurring payment schedules.
                    </td>
                  </tr>
                )}
                {billPaySchedules.map((schedule: any) => (
                  <tr key={schedule.id} className="hover:bg-canvas/50">
                    <td className="px-6 py-3">
                      <div>
                        <p className="text-xs font-medium text-t1">{getVendorName(schedule.vendor_id)}</p>
                        <p className="text-xs text-t3">{schedule.currency}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-t1 text-right">${formatAmount(schedule.amount)}</td>
                    <td className="px-4 py-3 text-center">{getMethodBadge(schedule.method)}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={
                        schedule.frequency === 'monthly' ? 'info' :
                        schedule.frequency === 'weekly' ? 'warning' : 'default'
                      }>
                        {schedule.frequency}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-t3" />
                        <span className="text-xs text-t2">{schedule.next_payment_date}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-t2">{schedule.end_date || 'No end date'}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={schedule.is_active ? 'success' : 'default'}>
                        {schedule.is_active ? 'Active' : 'Paused'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Button
                        size="sm"
                        variant={schedule.is_active ? 'ghost' : 'secondary'}
                        disabled={saving}
                        onClick={() => toggleSchedule(schedule.id, schedule.is_active)}
                      >
                        {schedule.is_active ? (
                          <><Pause size={12} /> Pause</>
                        ) : (
                          <><Play size={12} /> Resume</>
                        )}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ── Approval Queue Tab ── */}
      {activeTab === 'approval' && (
        <Card padding="none">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Payments Pending Approval</CardTitle>
              {pendingCount > 0 && (
                <Badge variant="warning">{pendingCount} pending</Badge>
              )}
            </div>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-divider bg-canvas">
                  <th className="tempo-th text-left px-6 py-3">Reference #</th>
                  <th className="tempo-th text-left px-4 py-3">Vendor</th>
                  <th className="tempo-th text-right px-4 py-3">{tc('amount')}</th>
                  <th className="tempo-th text-center px-4 py-3">Method</th>
                  <th className="tempo-th text-left px-4 py-3">Scheduled Date</th>
                  <th className="tempo-th text-left px-4 py-3">Memo</th>
                  <th className="tempo-th text-center px-4 py-3">{tc('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pendingPayments.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-sm text-t3">
                      <div className="flex flex-col items-center gap-2">
                        <CheckCircle size={24} className="text-success" />
                        <span>All caught up! No payments awaiting approval.</span>
                      </div>
                    </td>
                  </tr>
                )}
                {pendingPayments.map((payment: any) => (
                  <tr key={payment.id} className="hover:bg-canvas/50">
                    <td className="px-6 py-3 text-xs font-mono font-medium text-t1">{payment.reference_number}</td>
                    <td className="px-4 py-3 text-xs text-t2">{getVendorName(payment.vendor_id)}</td>
                    <td className="px-4 py-3 text-xs font-semibold text-t1 text-right">${formatAmount(payment.amount)}</td>
                    <td className="px-4 py-3 text-center">{getMethodBadge(payment.method)}</td>
                    <td className="px-4 py-3 text-xs text-t2">{payment.scheduled_date}</td>
                    <td className="px-4 py-3 text-xs text-t2 max-w-[200px] truncate">{payment.memo}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex gap-1 justify-center">
                        <Button size="sm" variant="primary" disabled={saving} onClick={() => approvePayment(payment.id)}>
                          <CheckCircle size={12} /> Approve
                        </Button>
                        <Button size="sm" variant="ghost" disabled={saving} onClick={() => setConfirmAction({ show: true, type: 'reject', id: payment.id, label: `Reject payment ${payment.reference_number}?` })}>
                          <XCircle size={12} /> Reject
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ── New Payment Modal ── */}
      <Modal open={showPaymentModal} onClose={() => setShowPaymentModal(false)} title="Create New Payment">
        <div className="space-y-4">
          <Select
            label="Vendor"
            value={paymentForm.vendor_id}
            onChange={(e) => setPaymentForm({ ...paymentForm, vendor_id: e.target.value })}
            options={vendors.map((v: any) => ({ value: v.id, label: v.name }))}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label={tc('amount')}
              type="number"
              placeholder="1000.00"
              value={paymentForm.amount}
              onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
            />
            <Select
              label={tc('currency')}
              value={paymentForm.currency}
              onChange={(e) => setPaymentForm({ ...paymentForm, currency: e.target.value })}
              options={[
                { value: 'USD', label: 'USD' },
                { value: 'EUR', label: 'EUR' },
                { value: 'GBP', label: 'GBP' },
                { value: 'XOF', label: 'XOF' },
                { value: 'NGN', label: 'NGN' },
              ]}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Payment Method"
              value={paymentForm.method}
              onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}
              options={[
                { value: 'ach', label: 'ACH Transfer' },
                { value: 'wire', label: 'Wire Transfer' },
                { value: 'check', label: 'Check' },
              ]}
            />
            <Input
              label="Scheduled Date"
              type="date"
              value={paymentForm.scheduled_date}
              onChange={(e) => setPaymentForm({ ...paymentForm, scheduled_date: e.target.value })}
            />
          </div>
          <Textarea
            label="Memo"
            placeholder="Payment description or notes..."
            rows={2}
            value={paymentForm.memo}
            onChange={(e) => setPaymentForm({ ...paymentForm, memo: e.target.value })}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowPaymentModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitPayment} disabled={saving}>{saving ? 'Creating...' : 'Create Payment'}</Button>
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
              <p className="text-xs text-t3 mt-1">This action cannot be undone.</p>
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
