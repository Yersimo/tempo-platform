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
import {
  FileText, Plus, DollarSign, AlertTriangle, Send, CreditCard, Star,
  TrendingUp, TrendingDown, Minus, Building2, Brain, PieChart, Search,
  XCircle, CheckCircle, Clock, ShieldCheck, MessageSquare, UserCheck,
} from 'lucide-react'
import { useTempo, useOrgCurrency } from '@/lib/store'
import { formatCurrency } from '@/lib/utils/format-currency'
import { exportToCSV } from '@/lib/export-import'
import { AIInsightCard } from '@/components/ai'
import { forecastCashFlow, assessVendorConcentration, detectDuplicateSubscriptions, analyzeSavingsOpportunities } from '@/lib/ai-engine'
import { demoVendorContracts, demoSpendByCategory } from '@/lib/demo-data'

// ── Approval types ──
interface ApprovalEntry {
  id: string
  invoice_id: string
  level: number
  approver_name: string
  status: 'pending' | 'approved' | 'rejected'
  comment: string
  decided_at: string | null
}

const APPROVAL_THRESHOLD = 5000 // $5,000 — requires manager approval
const DIRECTOR_THRESHOLD = 10000 // $10,000 — requires finance director

export default function InvoicesPage() {
  const t = useTranslations('invoices')
  const tc = useTranslations('common')
  const defaultCurrency = useOrgCurrency()
  const { invoices, vendors, softwareLicenses, addInvoice, updateInvoice, ensureModulesLoaded, addToast } = useTempo()

  const [pageLoading, setPageLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [confirmAction, setConfirmAction] = useState<{ show: boolean; type: string; id: string; label: string } | null>(null)

  // Approval state
  const [approvalLog, setApprovalLog] = useState<ApprovalEntry[]>([])
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [approvalTarget, setApprovalTarget] = useState<{ id: string; action: 'approve' | 'reject' } | null>(null)
  const [approvalComment, setApprovalComment] = useState('')
  const [showApprovalHistory, setShowApprovalHistory] = useState<string | null>(null)

  useEffect(() => { ensureModulesLoaded?.(['invoices', 'vendors', 'softwareLicenses'])?.then?.(() => setPageLoading(false))?.catch?.(() => setPageLoading(false)) }, [])
  useEffect(() => { const t = setTimeout(() => setPageLoading(false), 2000); return () => clearTimeout(t) }, [])

  const cashFlowInsight = useMemo(() => forecastCashFlow(invoices, []), [invoices])
  const vendorInsights = useMemo(() => assessVendorConcentration(invoices, vendors), [invoices, vendors])
  const duplicateInsights = useMemo(() => detectDuplicateSubscriptions(softwareLicenses), [softwareLicenses])
  const savingsInsights = useMemo(() => analyzeSavingsOpportunities(invoices, softwareLicenses), [invoices, softwareLicenses])

  const totalAmount = invoices.reduce((a: number, i: any) => a + i.amount, 0)
  const paidAmount = invoices.filter((i: any) => i.status === 'paid').reduce((a: number, i: any) => a + i.amount, 0)
  const overdueAmount = invoices.filter((i: any) => i.status === 'overdue').reduce((a: number, i: any) => a + i.amount, 0)
  const pendingApprovalAmount = invoices.filter((i: any) => i.status === 'pending_approval').reduce((a: number, i: any) => a + i.amount, 0)

  // ── AR Aging Buckets ──
  const agingBuckets = useMemo(() => {
    const today = new Date()
    const buckets = { current: 0, days30: 0, days60: 0, days90: 0, days120: 0 }
    invoices.filter((i: any) => i.status === 'sent' || i.status === 'overdue').forEach((inv: any) => {
      const dueDate = new Date(inv.due_date)
      const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
      if (daysOverdue <= 0) buckets.current += inv.amount
      else if (daysOverdue <= 30) buckets.days30 += inv.amount
      else if (daysOverdue <= 60) buckets.days60 += inv.amount
      else if (daysOverdue <= 90) buckets.days90 += inv.amount
      else buckets.days120 += inv.amount
    })
    return buckets
  }, [invoices])

  const totalAR = agingBuckets.current + agingBuckets.days30 + agingBuckets.days60 + agingBuckets.days90 + agingBuckets.days120

  // ── Dunning: compute days overdue for each invoice ──
  function getDaysOverdue(inv: any): number {
    if (inv.status !== 'overdue' && inv.status !== 'sent') return 0
    const today = new Date()
    const dueDate = new Date(inv.due_date)
    const days = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
    return days > 0 ? days : 0
  }

  // Vendor spend aggregation
  const vendorSpendMap = useMemo(() => {
    const map: Record<string, number> = {}
    invoices.forEach((inv: any) => {
      map[inv.vendor_id] = (map[inv.vendor_id] || 0) + inv.amount
    })
    return map
  }, [invoices])

  const totalVendorSpend = Object.values(vendorSpendMap).reduce((a, b) => a + b, 0)

  function getVendorName(vendorId: string) {
    const vendor = vendors.find((v: any) => v.id === vendorId)
    return vendor?.name || tc('unknown')
  }

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv: any) => {
      const matchesSearch = !searchQuery ||
        inv.invoice_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        getVendorName(inv.vendor_id).toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = statusFilter === 'all' || inv.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [invoices, searchQuery, statusFilter, vendors])

  // New Invoice modal
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [invoiceForm, setInvoiceForm] = useState({
    invoice_number: '',
    vendor_id: '',
    amount: '',
    description: '',
    due_date: '',
    issued_date: '',
    currency: defaultCurrency,
  })

  function openNewInvoice() {
    setInvoiceForm({
      invoice_number: `INV-${Date.now().toString().slice(-6)}`,
      vendor_id: vendors[0]?.id || '',
      amount: '',
      description: '',
      due_date: '',
      issued_date: new Date().toISOString().split('T')[0],
      currency: defaultCurrency,
    })
    setShowInvoiceModal(true)
  }

  // ── Approval Logic ──
  function needsApproval(amount: number): boolean {
    return amount >= APPROVAL_THRESHOLD
  }

  function getApprovalLevel(amount: number): number {
    if (amount >= DIRECTOR_THRESHOLD) return 2 // needs manager + finance director
    if (amount >= APPROVAL_THRESHOLD) return 1 // needs manager only
    return 0
  }

  function getInvoiceApprovals(invoiceId: string): ApprovalEntry[] {
    return approvalLog.filter(a => a.invoice_id === invoiceId)
  }

  async function submitInvoice() {
    if (!invoiceForm.invoice_number.trim()) { addToast('Invoice number is required', 'error'); return }
    if (!invoiceForm.vendor_id) { addToast('Please select a vendor', 'error'); return }
    if (!invoiceForm.amount || Number(invoiceForm.amount) <= 0) { addToast('Amount must be greater than zero', 'error'); return }
    if (!invoiceForm.due_date) { addToast('Due date is required', 'error'); return }
    setSaving(true)
    try {
      const amount = Number(invoiceForm.amount)
      const requiresApproval = needsApproval(amount)
      const invData: any = {
        invoice_number: invoiceForm.invoice_number,
        vendor_id: invoiceForm.vendor_id,
        amount,
        description: invoiceForm.description,
        due_date: invoiceForm.due_date,
        issued_date: invoiceForm.issued_date || new Date().toISOString().split('T')[0],
        status: requiresApproval ? 'pending_approval' : 'draft',
        currency: invoiceForm.currency,
      }
      addInvoice(invData)

      if (requiresApproval) {
        const levels = getApprovalLevel(amount)
        const newApprovals: ApprovalEntry[] = [
          {
            id: `appr-${Date.now()}-1`,
            invoice_id: invData.invoice_number,
            level: 1,
            approver_name: 'Manager',
            status: 'pending',
            comment: '',
            decided_at: null,
          },
        ]
        if (levels >= 2) {
          newApprovals.push({
            id: `appr-${Date.now()}-2`,
            invoice_id: invData.invoice_number,
            level: 2,
            approver_name: 'Finance Director',
            status: 'pending',
            comment: '',
            decided_at: null,
          })
        }
        setApprovalLog(prev => [...prev, ...newApprovals])
        addToast(`Invoice requires ${levels >= 2 ? 'multi-level' : 'manager'} approval (amount >= ${formatCurrency(levels >= 2 ? DIRECTOR_THRESHOLD : APPROVAL_THRESHOLD, defaultCurrency)})`, 'info')
      } else {
        addToast('Invoice created successfully', 'success')
      }
      setShowInvoiceModal(false)
    } finally {
      setSaving(false)
    }
  }

  function openApprovalAction(invoiceId: string, action: 'approve' | 'reject') {
    setApprovalTarget({ id: invoiceId, action })
    setApprovalComment('')
    setShowApprovalModal(true)
  }

  function submitApprovalAction() {
    if (!approvalTarget) return
    const { id, action } = approvalTarget
    const inv = invoices.find((i: any) => i.id === id)
    if (!inv) return

    // Find the first pending approval for this invoice
    const invApprovals = approvalLog.filter(a => a.invoice_id === inv.invoice_number || a.invoice_id === id)
    const pendingApproval = invApprovals.find(a => a.status === 'pending')

    if (pendingApproval) {
      setApprovalLog(prev => prev.map(a =>
        a.id === pendingApproval.id
          ? { ...a, status: action === 'approve' ? 'approved' : 'rejected', comment: approvalComment, decided_at: new Date().toISOString() }
          : a
      ))
    }

    if (action === 'reject') {
      updateInvoice(id, { status: 'draft' })
      addToast('Invoice rejected and returned to draft', 'info')
    } else {
      // Check if all levels approved
      const remainingPending = invApprovals.filter(a => a.status === 'pending' && a.id !== pendingApproval?.id)
      if (remainingPending.length === 0) {
        updateInvoice(id, { status: 'draft' })
        addToast('Invoice fully approved and ready to send', 'success')
      } else {
        addToast(`Level ${pendingApproval?.level} approved. Awaiting next approval.`, 'info')
      }
    }
    setShowApprovalModal(false)
  }

  async function sendInvoice(id: string) {
    const inv = invoices.find((i: any) => i.id === id)
    if (inv && needsApproval(inv.amount) && inv.status !== 'draft') {
      addToast('This invoice requires approval before sending', 'error')
      return
    }
    setSaving(true)
    try { updateInvoice(id, { status: 'sent' }); addToast('Invoice sent', 'success') } finally { setSaving(false) }
  }

  async function payInvoice(id: string) {
    setSaving(true)
    try { updateInvoice(id, { status: 'paid', paid_date: new Date().toISOString().split('T')[0] }); addToast('Invoice marked as paid', 'success') } finally { setSaving(false) }
  }

  function markOverdue(id: string) {
    updateInvoice(id, { status: 'overdue' })
  }

  function voidInvoice(id: string) {
    setSaving(true)
    try { updateInvoice(id, { status: 'void' }); addToast('Invoice voided', 'success') } finally { setSaving(false) }
  }

  function handleConfirmAction() {
    if (!confirmAction) return
    if (confirmAction.type === 'void') voidInvoice(confirmAction.id)
    if (confirmAction.type === 'delete') { updateInvoice(confirmAction.id, { status: 'deleted' }); addToast('Invoice deleted', 'success') }
    setConfirmAction(null)
  }

  if (pageLoading) {
    return (
      <>
        <Header title={t('title')} subtitle={t('subtitle')} actions={<Button size="sm" disabled><Plus size={14} /> {t('newInvoice')}</Button>} />
        <div className="p-6"><PageSkeleton /></div>
      </>
    )
  }

  return (
    <>
      <Header
        title={t('title')}
        subtitle={t('subtitle')}
        actions={<Button size="sm" onClick={openNewInvoice}><Plus size={14} /> {t('newInvoice')}</Button>}
      />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <StatCard label={t('totalInvoices')} value={invoices.length} icon={<FileText size={20} />} />
        <StatCard label={t('totalAmount')} value={formatCurrency(totalAmount, defaultCurrency)} icon={<DollarSign size={20} />} />
        <StatCard label={t('paidLabel')} value={formatCurrency(paidAmount, defaultCurrency)} change={t('settled')} changeType="positive" />
        <StatCard label={t('overdueLabel')} value={formatCurrency(overdueAmount, defaultCurrency)} change={t('requiresAttention')} changeType="negative" icon={<AlertTriangle size={20} />} />
        <StatCard label="Pending Approval" value={formatCurrency(pendingApprovalAmount, defaultCurrency)} icon={<Clock size={20} />} change={invoices.filter((i: any) => i.status === 'pending_approval').length + ' invoices'} changeType="negative" />
      </div>

      {/* ── AR Aging Dashboard ── */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-t1 mb-3 flex items-center gap-2">
          <Clock size={16} /> Accounts Receivable Aging
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <Card className="text-center">
            <p className="text-xs text-t3 mb-1">Current</p>
            <p className="text-lg font-bold text-success">{formatCurrency(agingBuckets.current, defaultCurrency)}</p>
          </Card>
          <Card className="text-center">
            <p className="text-xs text-t3 mb-1">1-30 Days</p>
            <p className="text-lg font-bold text-t1">{formatCurrency(agingBuckets.days30, defaultCurrency)}</p>
          </Card>
          <Card className="text-center">
            <p className="text-xs text-t3 mb-1">31-60 Days</p>
            <p className="text-lg font-bold text-warning">{formatCurrency(agingBuckets.days60, defaultCurrency)}</p>
          </Card>
          <Card className="text-center">
            <p className="text-xs text-t3 mb-1">61-90 Days</p>
            <p className="text-lg font-bold text-teal-700">{formatCurrency(agingBuckets.days90, defaultCurrency)}</p>
          </Card>
          <Card className="text-center">
            <p className="text-xs text-t3 mb-1">90+ Days</p>
            <p className="text-lg font-bold text-error">{formatCurrency(agingBuckets.days120, defaultCurrency)}</p>
          </Card>
          <Card className="text-center">
            <p className="text-xs text-t3 mb-1">Total AR</p>
            <p className="text-lg font-bold text-t1">{formatCurrency(totalAR, defaultCurrency)}</p>
          </Card>
        </div>
        {totalAR > 0 && (
          <div className="mt-2">
            <div className="flex h-3 rounded-full overflow-hidden bg-canvas">
              {agingBuckets.current > 0 && <div className="bg-success" style={{ width: `${(agingBuckets.current / totalAR) * 100}%` }} />}
              {agingBuckets.days30 > 0 && <div className="bg-accent" style={{ width: `${(agingBuckets.days30 / totalAR) * 100}%` }} />}
              {agingBuckets.days60 > 0 && <div className="bg-warning" style={{ width: `${(agingBuckets.days60 / totalAR) * 100}%` }} />}
              {agingBuckets.days90 > 0 && <div className="bg-teal-700" style={{ width: `${(agingBuckets.days90 / totalAR) * 100}%` }} />}
              {agingBuckets.days120 > 0 && <div className="bg-error" style={{ width: `${(agingBuckets.days120 / totalAR) * 100}%` }} />}
            </div>
          </div>
        )}
      </div>

      {/* AI Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <AIInsightCard
          insight={cashFlowInsight}
        />
        {vendorInsights[0] && <AIInsightCard
          insight={vendorInsights[0]}
        />}
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-t3" />
          <input
            type="text"
            placeholder="Search invoices..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-border bg-surface text-t1 placeholder:text-t3 focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
        </div>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={[
            { value: 'all', label: 'All Statuses' },
            { value: 'draft', label: 'Draft' },
            { value: 'pending_approval', label: 'Pending Approval' },
            { value: 'sent', label: 'Sent' },
            { value: 'paid', label: 'Paid' },
            { value: 'overdue', label: 'Overdue' },
          ]}
        />
      </div>

      <Card padding="none">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t('allInvoices')}</CardTitle>
            <Button variant="secondary" size="sm" onClick={() => exportToCSV(
              invoices,
              [
                { header: 'Vendor', accessor: (i: any) => i.vendor_name || '' },
                { header: 'Amount', accessor: (i: any) => i.amount || 0 },
                { header: 'Status', accessor: (i: any) => i.status || '' },
                { header: 'Due Date', accessor: (i: any) => i.due_date || '' },
                { header: 'Invoice #', accessor: (i: any) => i.invoice_number || '' },
              ],
              'invoices-export'
            )}>{tc('export')}</Button>
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-divider bg-canvas">
                <th className="tempo-th text-left px-6 py-3">{t('tableInvoiceNumber')}</th>
                <th className="tempo-th text-left px-4 py-3">{t('tableVendor')}</th>
                <th className="tempo-th text-left px-4 py-3">{t('tableDescription')}</th>
                <th className="tempo-th text-right px-4 py-3">{t('tableAmount')}</th>
                <th className="tempo-th text-left px-4 py-3">{t('tableDueDate')}</th>
                <th className="tempo-th text-center px-4 py-3">Dunning</th>
                <th className="tempo-th text-center px-4 py-3">{tc('status')}</th>
                <th className="tempo-th text-center px-4 py-3">{tc('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="w-12 h-12 rounded-xl bg-canvas flex items-center justify-center mb-3">
                        <FileText size={24} className="text-t3" />
                      </div>
                      <p className="text-sm font-medium text-t1 mb-1">No invoices found</p>
                      <p className="text-xs text-t3 mb-4">{searchQuery || statusFilter !== 'all' ? 'Try adjusting your search or filters' : 'Create your first invoice to get started'}</p>
                      {!searchQuery && statusFilter === 'all' && (
                        <Button size="sm" onClick={openNewInvoice}><Plus size={14} /> {t('newInvoice')}</Button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : filteredInvoices.map((inv: any) => {
                const daysOverdue = getDaysOverdue(inv)
                return (
                  <tr key={inv.id} className={`hover:bg-canvas/50 ${daysOverdue > 60 ? 'bg-error/5' : daysOverdue > 30 ? 'bg-warning/5' : ''}`}>
                    <td className="px-6 py-3">
                      <div>
                        <p className="text-xs font-mono font-medium text-t1">{inv.invoice_number}</p>
                        {needsApproval(inv.amount) && (
                          <button
                            className="text-xs text-accent hover:underline mt-0.5"
                            onClick={() => setShowApprovalHistory(showApprovalHistory === inv.id ? null : inv.id)}
                          >
                            <ShieldCheck size={10} className="inline mr-1" />Approval history
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-t2">{getVendorName(inv.vendor_id)}</td>
                    <td className="px-4 py-3 text-xs text-t2 max-w-[200px] truncate">{inv.description}</td>
                    <td className="px-4 py-3 text-xs font-semibold text-t1 text-right">${inv.amount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-xs text-t2">{inv.due_date}</td>
                    <td className="px-4 py-3 text-center">
                      {daysOverdue > 0 ? (
                        <Badge variant={daysOverdue > 60 ? 'error' : daysOverdue > 30 ? 'warning' : 'orange'}>
                          {daysOverdue}d overdue
                        </Badge>
                      ) : inv.status === 'paid' ? (
                        <span className="text-xs text-t3">—</span>
                      ) : (
                        <Badge variant="success">Current</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={
                        inv.status === 'paid' ? 'success' :
                        inv.status === 'overdue' ? 'error' :
                        inv.status === 'sent' ? 'info' :
                        inv.status === 'pending_approval' ? 'warning' :
                        inv.status === 'void' ? 'default' : 'default'
                      }>
                        {inv.status === 'pending_approval' ? 'Pending Approval' : inv.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex gap-1 justify-center">
                        {inv.status === 'pending_approval' && (
                          <>
                            <Button size="sm" variant="primary" onClick={() => openApprovalAction(inv.id, 'approve')} disabled={saving}>
                              <CheckCircle size={12} /> Approve
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => openApprovalAction(inv.id, 'reject')} disabled={saving}>
                              <XCircle size={12} /> Reject
                            </Button>
                          </>
                        )}
                        {inv.status === 'draft' && (
                          <>
                            <Button size="sm" variant="secondary" onClick={() => sendInvoice(inv.id)} disabled={saving}>
                              <Send size={12} /> {tc('send')}
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setConfirmAction({ show: true, type: 'delete', id: inv.id, label: inv.invoice_number })} disabled={saving}>
                              <XCircle size={12} />
                            </Button>
                          </>
                        )}
                        {inv.status === 'sent' && (
                          <>
                            <Button size="sm" variant="primary" onClick={() => payInvoice(inv.id)} disabled={saving}>
                              <CreditCard size={12} /> {tc('process')}
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => markOverdue(inv.id)} disabled={saving}>
                              {tc('overdue')}
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setConfirmAction({ show: true, type: 'void', id: inv.id, label: inv.invoice_number })} disabled={saving}>
                              Void
                            </Button>
                          </>
                        )}
                        {inv.status === 'overdue' && (
                          <>
                            <Button size="sm" variant="primary" onClick={() => payInvoice(inv.id)} disabled={saving}>
                              <CreditCard size={12} /> {tc('process')}
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setConfirmAction({ show: true, type: 'void', id: inv.id, label: inv.invoice_number })} disabled={saving}>
                              Void
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── Approval History Inline (shown when clicked) ── */}
      {showApprovalHistory && (
        <Card className="mt-4">
          <h3 className="text-sm font-semibold text-t1 mb-3 flex items-center gap-2">
            <UserCheck size={16} /> Approval History for {invoices.find((i: any) => i.id === showApprovalHistory)?.invoice_number || 'Invoice'}
          </h3>
          {(() => {
            const inv = invoices.find((i: any) => i.id === showApprovalHistory)
            const approvals = approvalLog.filter(a => a.invoice_id === inv?.invoice_number || a.invoice_id === showApprovalHistory)
            if (approvals.length === 0) {
              const level = inv ? getApprovalLevel(inv.amount) : 0
              return (
                <div className="space-y-2">
                  <p className="text-xs text-t3">
                    {level === 0
                      ? 'This invoice does not require approval.'
                      : `Requires ${level >= 2 ? 'multi-level approval (Manager + Finance Director)' : 'manager approval'}. No approval actions recorded yet.`}
                  </p>
                  {level > 0 && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs">
                        <div className="w-2 h-2 rounded-full bg-warning" />
                        <span className="text-t2">Level 1: Manager — Pending</span>
                      </div>
                      {level >= 2 && (
                        <div className="flex items-center gap-2 text-xs">
                          <div className="w-2 h-2 rounded-full bg-t3" />
                          <span className="text-t3">Level 2: Finance Director — Waiting</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            }
            return (
              <div className="space-y-2">
                {approvals.map(a => (
                  <div key={a.id} className="flex items-center gap-3 py-2 border-b border-divider last:border-0">
                    <div className={`w-2 h-2 rounded-full ${a.status === 'approved' ? 'bg-success' : a.status === 'rejected' ? 'bg-error' : 'bg-warning'}`} />
                    <div className="flex-1">
                      <p className="text-xs font-medium text-t1">Level {a.level}: {a.approver_name}</p>
                      <p className="text-xs text-t3">
                        {a.status === 'pending' ? 'Awaiting decision' : `${a.status.charAt(0).toUpperCase() + a.status.slice(1)} on ${new Date(a.decided_at!).toLocaleDateString()}`}
                      </p>
                      {a.comment && <p className="text-xs text-t2 mt-0.5 italic">{a.comment}</p>}
                    </div>
                    <Badge variant={a.status === 'approved' ? 'success' : a.status === 'rejected' ? 'error' : 'warning'}>
                      {a.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )
          })()}
          <div className="mt-3">
            <Button variant="secondary" size="sm" onClick={() => setShowApprovalHistory(null)}>Close</Button>
          </div>
        </Card>
      )}

      {/* ── Section 1: Vendor Management ── */}
      <div className="mt-8">
        <h2 className="text-sm font-semibold text-t1 mb-4 flex items-center gap-2">
          <Building2 size={20} /> {t('vendorDirectory')}
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <StatCard label={t('totalVendorSpend')} value={formatCurrency(totalVendorSpend, defaultCurrency)} icon={<DollarSign size={20} />} />
          <StatCard label={t('activeContracts')} value={demoVendorContracts.filter(c => c.status === 'active').length} />
          <StatCard label={t('contractExpiring')} value={demoVendorContracts.filter(c => c.status === 'expiring_soon').length} change={t('requiresAttention')} changeType="negative" />
          <StatCard label={t('performanceRating')} value="4.1 / 5" />
        </div>

        <Card padding="none">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t('vendorContracts')}</CardTitle>
              <Button variant="secondary" size="sm" onClick={() => exportToCSV(
                vendors,
                [
                  { header: 'Name', accessor: (v: any) => v.name || '' },
                  { header: 'Category', accessor: (v: any) => v.category || '' },
                  { header: 'Status', accessor: (v: any) => v.status || '' },
                  { header: 'Contract Value', accessor: (v: any) => v.contract_value || 0 },
                ],
                'vendors-export'
              )}>{tc('export')}</Button>
            </div>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-divider bg-canvas">
                  <th className="tempo-th text-left px-6 py-3">{t('tableVendor')}</th>
                  <th className="tempo-th text-left px-4 py-3">{t('contractStart')}</th>
                  <th className="tempo-th text-left px-4 py-3">{t('contractEnd')}</th>
                  <th className="tempo-th text-right px-4 py-3">{t('annualValue')}</th>
                  <th className="tempo-th text-center px-4 py-3">{t('renewalType')}</th>
                  <th className="tempo-th text-center px-4 py-3">{t('performanceRating')}</th>
                  <th className="tempo-th text-center px-4 py-3">{tc('status')}</th>
                  <th className="tempo-th text-left px-4 py-3">{t('spendPerVendor')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {demoVendorContracts.map(contract => {
                  const vendor = vendors.find((v: any) => v.id === contract.vendor_id)
                  const vendorSpend = vendorSpendMap[contract.vendor_id] || 0
                  const spendPct = totalVendorSpend > 0 ? Math.round((vendorSpend / totalVendorSpend) * 100) : 0
                  return (
                    <tr key={contract.id} className="hover:bg-canvas/50">
                      <td className="px-6 py-3">
                        <div>
                          <p className="text-xs font-medium text-t1">{vendor?.name || contract.contract_number}</p>
                          <p className="text-xs text-t3">{vendor?.category}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-t2">{contract.start_date}</td>
                      <td className="px-4 py-3 text-xs text-t2">{contract.end_date}</td>
                      <td className="px-4 py-3 text-xs font-semibold text-t1 text-right">${contract.annual_value.toLocaleString()}</td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={contract.renewal_type === 'auto' ? 'info' : 'default'}>
                          {contract.renewal_type === 'auto' ? t('autoRenewal') : t('manualRenewal')}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Star size={12} className="text-warning fill-warning" />
                          <span className="text-xs font-medium text-t1">{contract.performance_rating}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={contract.status === 'active' ? 'success' : 'warning'}>
                          {contract.status === 'expiring_soon' ? t('contractExpiring') : contract.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="min-w-[120px]">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-t2">${vendorSpend.toLocaleString()}</span>
                            <span className="text-t3">{spendPct}%</span>
                          </div>
                          <Progress value={spendPct} color={spendPct > 40 ? 'warning' : 'orange'} />
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

      {/* ── Section 2: Spend Analytics ── */}
      <div className="mt-8">
        <h2 className="text-sm font-semibold text-t1 mb-4 flex items-center gap-2">
          <PieChart size={20} /> {t('spendAnalytics')}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Spend by Category */}
          <Card>
            <h3 className="text-sm font-semibold text-t1 mb-4">{t('spendByCategory')}</h3>
            <div className="space-y-3">
              {demoSpendByCategory.map(cat => {
                const totalSpend = demoSpendByCategory.reduce((a, c) => a + c.amount, 0)
                const pctVal = totalSpend > 0 ? Math.round((cat.amount / totalSpend) * 100) : 0
                return (
                  <div key={cat.category}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-t2">{cat.category}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-t1">{formatCurrency(cat.amount, defaultCurrency, { compact: true })}</span>
                        <span className="text-xs text-t3">({pctVal}%)</span>
                      </div>
                    </div>
                    <Progress value={pctVal} color="orange" />
                  </div>
                )
              })}
            </div>
          </Card>

          {/* Month-over-Month Trend */}
          <Card>
            <h3 className="text-sm font-semibold text-t1 mb-4">{t('monthOverMonth')}</h3>
            <div className="space-y-3">
              {demoSpendByCategory.map(cat => {
                const change = cat.amount - cat.previousAmount
                const changePct = cat.previousAmount > 0 ? Math.round((change / cat.previousAmount) * 100) : 0
                return (
                  <div key={cat.category} className="flex items-center justify-between py-1.5 border-b border-divider last:border-0">
                    <span className="text-sm text-t2">{cat.category}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-t1">{formatCurrency(cat.amount, defaultCurrency, { compact: true })}</span>
                      <div className={`flex items-center gap-0.5 text-xs ${cat.trend === 'up' ? 'text-error' : 'text-success'}`}>
                        {cat.trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {changePct > 0 ? '+' : ''}{changePct}%
                      </div>
                    </div>
                  </div>
                )
              })}
              <p className="text-xs text-t3 mt-2">{t('previousPeriod')}</p>
            </div>
          </Card>
        </div>

        {/* Top Vendors by Spend */}
        <Card>
          <h3 className="text-sm font-semibold text-t1 mb-4">{t('topVendorsBySpend')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {vendors.map((vendor: any) => {
              const spend = vendorSpendMap[vendor.id] || 0
              const pctVal = totalVendorSpend > 0 ? Math.round((spend / totalVendorSpend) * 100) : 0
              return (
                <div key={vendor.id} className="p-3 bg-canvas rounded-lg">
                  <p className="text-sm font-medium text-t1 truncate">{vendor.name}</p>
                  <p className="text-xs text-t3 mb-2">{vendor.category}</p>
                  <p className="text-sm font-semibold text-t1">${spend.toLocaleString()}</p>
                  <Progress value={pctVal} color="orange" className="mt-1" />
                  <p className="text-xs text-t3 mt-1">{pctVal}% of total spend</p>
                </div>
              )
            })}
          </div>
        </Card>
      </div>

      {/* ── Section 3: AI Savings Insights ── */}
      <div className="mt-8 mb-6">
        <h2 className="text-sm font-semibold text-t1 mb-4 flex items-center gap-2">
          <Brain size={20} /> {t('aiSavingsInsights')}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {savingsInsights.map(insight => (
            <AIInsightCard key={insight.id} insight={insight} />
          ))}
          {duplicateInsights.map(insight => (
            <AIInsightCard key={insight.id} insight={insight} />
          ))}
          {savingsInsights.length === 0 && duplicateInsights.length === 0 && (
            <Card>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
                  <Minus size={16} className="text-success" />
                </div>
                <div>
                  <p className="text-sm font-medium text-t1">{t('savingsOpportunities')}</p>
                  <p className="text-xs text-t3 mt-1">{t('duplicateDetection')}</p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* New Invoice Modal */}
      <Modal open={showInvoiceModal} onClose={() => setShowInvoiceModal(false)} title={t('createInvoiceModal')}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('invoiceNumber')} placeholder={t('invoicePlaceholder')} value={invoiceForm.invoice_number} onChange={(e) => setInvoiceForm({ ...invoiceForm, invoice_number: e.target.value })} />
            <Select label={t('tableVendor')} value={invoiceForm.vendor_id} onChange={(e) => setInvoiceForm({ ...invoiceForm, vendor_id: e.target.value })} options={vendors.map((v: any) => ({ value: v.id, label: v.name }))} />
          </div>
          <Textarea label={t('invoiceDescription')} placeholder={t('invoiceDescPlaceholder')} rows={2} value={invoiceForm.description} onChange={(e) => setInvoiceForm({ ...invoiceForm, description: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label={tc('amount')} type="number" placeholder="10000" value={invoiceForm.amount} onChange={(e) => setInvoiceForm({ ...invoiceForm, amount: e.target.value })} />
            <Select label={tc('currency')} value={invoiceForm.currency} onChange={(e) => setInvoiceForm({ ...invoiceForm, currency: e.target.value })} options={[
              { value: 'USD', label: 'USD' },
              { value: 'EUR', label: 'EUR' },
              { value: 'GBP', label: 'GBP' },
              { value: 'XOF', label: 'XOF' },
              { value: 'NGN', label: 'NGN' },
            ]} />
          </div>
          {invoiceForm.amount && Number(invoiceForm.amount) >= APPROVAL_THRESHOLD && (
            <div className="p-3 rounded-lg bg-warning/10 border border-warning/20 flex items-center gap-2">
              <ShieldCheck size={14} className="text-warning flex-shrink-0" />
              <p className="text-xs text-t1">
                Amount exceeds {formatCurrency(APPROVAL_THRESHOLD, defaultCurrency)} threshold.
                {Number(invoiceForm.amount) >= DIRECTOR_THRESHOLD
                  ? ' Requires manager + finance director approval.'
                  : ' Requires manager approval before sending.'}
              </p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('issueDate')} type="date" value={invoiceForm.issued_date} onChange={(e) => setInvoiceForm({ ...invoiceForm, issued_date: e.target.value })} />
            <Input label={t('dueDate')} type="date" value={invoiceForm.due_date} onChange={(e) => setInvoiceForm({ ...invoiceForm, due_date: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowInvoiceModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitInvoice} disabled={saving}>{saving ? 'Creating...' : t('createInvoice')}</Button>
          </div>
        </div>
      </Modal>

      {/* Approval Action Modal */}
      <Modal open={showApprovalModal} onClose={() => setShowApprovalModal(false)} title={approvalTarget?.action === 'approve' ? 'Approve Invoice' : 'Reject Invoice'}>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-lg ${approvalTarget?.action === 'approve' ? 'bg-success/10' : 'bg-error/10'} flex items-center justify-center flex-shrink-0`}>
              {approvalTarget?.action === 'approve' ? <CheckCircle size={20} className="text-success" /> : <XCircle size={20} className="text-error" />}
            </div>
            <div>
              <p className="text-sm font-medium text-t1">
                {approvalTarget?.action === 'approve' ? 'Approve this invoice?' : 'Reject this invoice?'}
              </p>
              <p className="text-xs text-t3 mt-1">
                {approvalTarget?.action === 'approve'
                  ? 'The invoice will proceed to the next approval level or become ready to send.'
                  : 'The invoice will be returned to draft status.'}
              </p>
            </div>
          </div>
          <Textarea
            label="Comment (optional)"
            placeholder="Add a note for the audit trail..."
            rows={2}
            value={approvalComment}
            onChange={(e) => setApprovalComment(e.target.value)}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowApprovalModal(false)}>{tc('cancel')}</Button>
            <Button
              variant={approvalTarget?.action === 'approve' ? 'primary' : 'primary'}
              onClick={submitApprovalAction}
              disabled={saving}
            >
              {approvalTarget?.action === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirmation Modal */}
      <Modal open={!!confirmAction?.show} onClose={() => setConfirmAction(null)} title="Confirm Action">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-error/10 flex items-center justify-center flex-shrink-0">
              <AlertTriangle size={20} className="text-error" />
            </div>
            <div>
              <p className="text-sm font-medium text-t1">
                {confirmAction?.type === 'void' ? 'Void this invoice?' : 'Delete this invoice?'}
              </p>
              <p className="text-xs text-t3 mt-1">
                {confirmAction?.type === 'void'
                  ? `Invoice ${confirmAction?.label} will be marked as void. This cannot be undone.`
                  : `Invoice ${confirmAction?.label} will be permanently deleted.`}
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setConfirmAction(null)}>{tc('cancel')}</Button>
            <Button variant="primary" onClick={handleConfirmAction} disabled={saving}>
              {confirmAction?.type === 'void' ? 'Void Invoice' : 'Delete Invoice'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
