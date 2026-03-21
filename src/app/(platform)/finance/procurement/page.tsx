'use client'

import { useState, useMemo, useEffect } from 'react'
import { Header } from '@/components/layout/header'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/ui/stat-card'
import { Modal } from '@/components/ui/modal'
import { Input, Select, Textarea } from '@/components/ui/input'
import { PageSkeleton } from '@/components/ui/page-skeleton'
import {
  Package, Plus, FileText, CheckCircle2, AlertTriangle, ArrowRight,
  ClipboardCheck, Truck, Search, XCircle, ShieldCheck, Link2,
} from 'lucide-react'
import { useTempo, useOrgCurrency } from '@/lib/store'
import { formatCurrency } from '@/lib/utils/format-currency'

type Tab = 'purchase-orders' | 'goods-receipts' | 'three-way-match' | 'exceptions'

const statusBadge = (status: string) => {
  const map: Record<string, { variant: 'default' | 'success' | 'warning' | 'error' | 'info' | 'orange'; label: string }> = {
    draft: { variant: 'default', label: 'Draft' },
    pending_approval: { variant: 'warning', label: 'Pending Approval' },
    approved: { variant: 'success', label: 'Approved' },
    sent_to_vendor: { variant: 'info', label: 'Sent to Vendor' },
    partially_received: { variant: 'orange', label: 'Partially Received' },
    received: { variant: 'success', label: 'Fully Received' },
    closed: { variant: 'default', label: 'Closed' },
    cancelled: { variant: 'error', label: 'Cancelled' },
    pending: { variant: 'warning', label: 'Pending' },
    inspected: { variant: 'info', label: 'Inspected' },
    accepted: { variant: 'success', label: 'Accepted' },
    rejected: { variant: 'error', label: 'Rejected' },
    full_match: { variant: 'success', label: 'Full Match' },
    partial_match: { variant: 'warning', label: 'Partial Match' },
    mismatch: { variant: 'error', label: 'Mismatch' },
    exception: { variant: 'error', label: 'Exception' },
  }
  const cfg = map[status] || { variant: 'default' as const, label: status }
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>
}

export default function ProcurementPage() {
  const defaultCurrency = useOrgCurrency()
  const {
    purchaseOrders, purchaseOrderItems, vendors, invoices,
    goodsReceipts, threeWayMatches,
    addPurchaseOrder, updatePurchaseOrder,
    addGoodsReceipt, addThreeWayMatch, updateThreeWayMatch,
    ensureModulesLoaded, addToast,
  } = useTempo()

  const [pageLoading, setPageLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('purchase-orders')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    ensureModulesLoaded?.(['purchaseOrders', 'purchaseOrderItems', 'vendors', 'invoices', 'goodsReceipts', 'threeWayMatches'])
      ?.then?.(() => setPageLoading(false))
      ?.catch?.(() => setPageLoading(false))
  }, [])
  useEffect(() => { const t = setTimeout(() => setPageLoading(false), 2000); return () => clearTimeout(t) }, [])

  // ---- Stats ----
  const totalPOs = purchaseOrders.length
  const openPOs = purchaseOrders.filter(p => !['closed', 'cancelled'].includes(p.status)).length
  const totalPOValue = purchaseOrders.reduce((s: number, p: any) => s + (p.total_amount || 0), 0)
  const totalReceipts = goodsReceipts.length
  const totalMatches = threeWayMatches.length
  const fullMatches = threeWayMatches.filter((m: any) => m.match_status === 'full_match').length
  const exceptions = threeWayMatches.filter((m: any) => m.match_status === 'exception').length
  const matchRate = totalMatches > 0 ? Math.round((fullMatches / totalMatches) * 100) : 0

  // ---- Create PO Modal ----
  const [showPOModal, setShowPOModal] = useState(false)
  const [poForm, setPOForm] = useState({ vendor_id: '', notes: '', delivery_date: '', items: [{ description: '', quantity: '', unit_price: '' }] })

  function openNewPO() {
    setPOForm({ vendor_id: vendors[0]?.id || '', notes: '', delivery_date: '', items: [{ description: '', quantity: '', unit_price: '' }] })
    setShowPOModal(true)
  }

  function addPOLine() {
    setPOForm(prev => ({ ...prev, items: [...prev.items, { description: '', quantity: '', unit_price: '' }] }))
  }

  function updatePOLine(idx: number, field: string, value: string) {
    setPOForm(prev => ({
      ...prev,
      items: prev.items.map((item, i) => i === idx ? { ...item, [field]: value } : item),
    }))
  }

  function removePOLine(idx: number) {
    if (poForm.items.length <= 1) return
    setPOForm(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }))
  }

  function submitPO() {
    if (!poForm.vendor_id) { addToast('Please select a vendor', 'error'); return }
    const validItems = poForm.items.filter(item => item.description && Number(item.quantity) > 0 && Number(item.unit_price) > 0)
    if (validItems.length === 0) { addToast('Add at least one line item', 'error'); return }
    const totalAmount = validItems.reduce((s, item) => s + Number(item.quantity) * Math.round(Number(item.unit_price) * 100), 0)
    addPurchaseOrder({
      po_number: `PO-${Date.now().toString().slice(-6)}`,
      vendor_id: poForm.vendor_id,
      total_amount: totalAmount,
      currency: defaultCurrency,
      notes: poForm.notes,
      delivery_date: poForm.delivery_date,
      status: 'draft',
    })
    setShowPOModal(false)
  }

  // ---- Create Receipt Modal ----
  const [showReceiptModal, setShowReceiptModal] = useState(false)
  const [receiptForm, setReceiptForm] = useState({ po_id: '', received_date: new Date().toISOString().split('T')[0], notes: '' })

  function submitReceipt() {
    if (!receiptForm.po_id) { addToast('Please select a purchase order', 'error'); return }
    addGoodsReceipt({
      po_id: receiptForm.po_id,
      receipt_number: `GR-${Date.now().toString().slice(-6)}`,
      received_by: 'current_user',
      received_date: receiptForm.received_date,
      notes: receiptForm.notes,
      status: 'pending',
    })
    setShowReceiptModal(false)
    addToast('Goods receipt recorded', 'success')
  }

  // ---- Match Modal ----
  const [showMatchModal, setShowMatchModal] = useState(false)
  const [matchForm, setMatchForm] = useState({ po_id: '', receipt_id: '', invoice_id: '' })

  function submitMatch() {
    if (!matchForm.po_id || !matchForm.receipt_id || !matchForm.invoice_id) {
      addToast('All three documents are required for matching', 'error')
      return
    }
    const po = purchaseOrders.find((p: any) => p.id === matchForm.po_id)
    const inv = invoices.find((i: any) => i.id === matchForm.invoice_id)
    if (!po || !inv) { addToast('Invalid selection', 'error'); return }

    const priceVariance = Math.abs((po.total_amount || 0) - (inv.amount || 0))
    const variancePercentage = po.total_amount > 0 ? (priceVariance / po.total_amount) * 100 : 0
    const autoApproved = variancePercentage <= 2
    const matchStatus = autoApproved ? 'full_match' : variancePercentage <= 5 ? 'partial_match' : 'exception'

    addThreeWayMatch({
      po_id: matchForm.po_id,
      receipt_id: matchForm.receipt_id,
      invoice_id: matchForm.invoice_id,
      match_status: matchStatus,
      price_variance: priceVariance,
      quantity_variance: 0,
      variance_percentage: Math.round(variancePercentage * 100) / 100,
      tolerance_threshold: 2,
      auto_approved: autoApproved,
    })
    setShowMatchModal(false)
    if (autoApproved) {
      addToast('Match auto-approved within tolerance', 'success')
    } else {
      addToast(`Match flagged as ${matchStatus.replace('_', ' ')}`, 'info')
    }
  }

  // ---- Filtered lists ----
  const filteredPOs = useMemo(() => {
    if (!searchQuery) return purchaseOrders
    const q = searchQuery.toLowerCase()
    return purchaseOrders.filter((p: any) =>
      p.po_number?.toLowerCase().includes(q) ||
      vendors.find((v: any) => v.id === p.vendor_id)?.name?.toLowerCase().includes(q)
    )
  }, [purchaseOrders, searchQuery, vendors])

  const filteredReceipts = useMemo(() => {
    if (!searchQuery) return goodsReceipts
    const q = searchQuery.toLowerCase()
    return goodsReceipts.filter((r: any) =>
      r.receipt_number?.toLowerCase().includes(q) ||
      purchaseOrders.find((p: any) => p.id === r.po_id)?.po_number?.toLowerCase().includes(q)
    )
  }, [goodsReceipts, searchQuery, purchaseOrders])

  const exceptionMatches = useMemo(() => {
    return threeWayMatches.filter((m: any) => m.match_status === 'exception' || m.match_status === 'partial_match')
  }, [threeWayMatches])

  function getVendorName(vendorId: string) {
    return vendors.find((v: any) => v.id === vendorId)?.name || 'Unknown'
  }

  function getPONumber(poId: string) {
    return purchaseOrders.find((p: any) => p.id === poId)?.po_number || 'N/A'
  }

  function getInvoiceNumber(invoiceId: string) {
    return invoices.find((i: any) => i.id === invoiceId)?.invoice_number || 'N/A'
  }

  if (pageLoading) return <PageSkeleton />

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'purchase-orders', label: 'Purchase Orders', icon: <FileText size={16} /> },
    { key: 'goods-receipts', label: 'Goods Receipts', icon: <Truck size={16} /> },
    { key: 'three-way-match', label: 'Three-Way Match', icon: <Link2 size={16} /> },
    { key: 'exceptions', label: 'Exceptions', icon: <AlertTriangle size={16} /> },
  ]

  return (
    <>
      <Header title="Procurement & PO Matching" subtitle="Three-way matching: PO, Goods Receipt, Invoice" />

      <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Open POs" value={openPOs} change={`${totalPOs} total`} icon={<FileText size={20} />} />
          <StatCard label="PO Value" value={formatCurrency(totalPOValue, defaultCurrency)} change="All POs" icon={<Package size={20} />} />
          <StatCard label="Match Rate" value={`${matchRate}%`} change={`${fullMatches}/${totalMatches} matches`} icon={<CheckCircle2 size={20} />} />
          <StatCard label="Exceptions" value={exceptions} change="Pending review" icon={<AlertTriangle size={20} />} />
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-gray-200">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-tempo-600 text-tempo-700'
                  : 'border-transparent text-t3 hover:text-t1 hover:border-gray-300'
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.key === 'exceptions' && exceptions > 0 && (
                <span className="ml-1 bg-red-100 text-red-700 text-xs px-1.5 py-0.5 rounded-full">{exceptions}</span>
              )}
            </button>
          ))}
        </div>

        {/* Search + Action Bar */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-t3" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 h-9 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-tempo-500/20 focus:border-tempo-500"
            />
          </div>
          <div className="flex gap-2">
            {activeTab === 'purchase-orders' && (
              <Button onClick={openNewPO}><Plus size={16} className="mr-1" /> New PO</Button>
            )}
            {activeTab === 'goods-receipts' && (
              <Button onClick={() => { setReceiptForm({ po_id: purchaseOrders[0]?.id || '', received_date: new Date().toISOString().split('T')[0], notes: '' }); setShowReceiptModal(true) }}>
                <Plus size={16} className="mr-1" /> Record Receipt
              </Button>
            )}
            {activeTab === 'three-way-match' && (
              <Button onClick={() => { setMatchForm({ po_id: '', receipt_id: '', invoice_id: '' }); setShowMatchModal(true) }}>
                <Link2 size={16} className="mr-1" /> New Match
              </Button>
            )}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'purchase-orders' && (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left p-3 font-medium text-t3">PO Number</th>
                    <th className="text-left p-3 font-medium text-t3">Vendor</th>
                    <th className="text-left p-3 font-medium text-t3">Amount</th>
                    <th className="text-left p-3 font-medium text-t3">Status</th>
                    <th className="text-left p-3 font-medium text-t3">Delivery Date</th>
                    <th className="text-left p-3 font-medium text-t3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPOs.length === 0 ? (
                    <tr><td colSpan={6} className="p-8 text-center text-t3">No purchase orders found</td></tr>
                  ) : filteredPOs.map((po: any) => (
                    <tr key={po.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="p-3 font-medium">{po.po_number}</td>
                      <td className="p-3">{getVendorName(po.vendor_id)}</td>
                      <td className="p-3">{formatCurrency(po.total_amount || 0, po.currency || defaultCurrency)}</td>
                      <td className="p-3">{statusBadge(po.status)}</td>
                      <td className="p-3 text-t3">{po.delivery_date || '-'}</td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          {po.status === 'draft' && (
                            <button onClick={() => updatePurchaseOrder(po.id, { status: 'pending_approval' })} className="text-xs text-tempo-600 hover:underline">
                              Submit
                            </button>
                          )}
                          {po.status === 'pending_approval' && (
                            <button onClick={() => updatePurchaseOrder(po.id, { status: 'approved' })} className="text-xs text-green-600 hover:underline">
                              Approve
                            </button>
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

        {activeTab === 'goods-receipts' && (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left p-3 font-medium text-t3">Receipt #</th>
                    <th className="text-left p-3 font-medium text-t3">PO Number</th>
                    <th className="text-left p-3 font-medium text-t3">Received Date</th>
                    <th className="text-left p-3 font-medium text-t3">Status</th>
                    <th className="text-left p-3 font-medium text-t3">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReceipts.length === 0 ? (
                    <tr><td colSpan={5} className="p-8 text-center text-t3">No goods receipts found</td></tr>
                  ) : filteredReceipts.map((r: any) => (
                    <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="p-3 font-medium">{r.receipt_number}</td>
                      <td className="p-3">{getPONumber(r.po_id)}</td>
                      <td className="p-3">{r.received_date}</td>
                      <td className="p-3">{statusBadge(r.status)}</td>
                      <td className="p-3 text-t3 truncate max-w-[200px]">{r.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {activeTab === 'three-way-match' && (
          <div className="space-y-4">
            {threeWayMatches.length === 0 ? (
              <Card>
                <div className="p-12 text-center">
                  <Link2 size={40} className="mx-auto mb-3 text-t3" />
                  <h3 className="text-lg font-semibold mb-1">No matches yet</h3>
                  <p className="text-sm text-t3 mb-4">Create a three-way match to compare PO, goods receipt, and invoice.</p>
                  <Button onClick={() => { setMatchForm({ po_id: '', receipt_id: '', invoice_id: '' }); setShowMatchModal(true) }}>
                    <Link2 size={16} className="mr-1" /> Create Match
                  </Button>
                </div>
              </Card>
            ) : (
              threeWayMatches.map((match: any) => (
                <Card key={match.id}>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {statusBadge(match.match_status)}
                        {match.auto_approved && <Badge variant="success">Auto-Approved</Badge>}
                      </div>
                      <span className="text-xs text-t3">{match.created_at ? new Date(match.created_at).toLocaleDateString() : ''}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-blue-50 rounded-lg p-3">
                        <div className="text-xs font-medium text-blue-600 mb-1">Purchase Order</div>
                        <div className="text-sm font-semibold">{getPONumber(match.po_id)}</div>
                      </div>
                      <div className="flex items-center justify-center">
                        <ArrowRight size={20} className="text-t3" />
                      </div>
                      <div className="bg-green-50 rounded-lg p-3">
                        <div className="text-xs font-medium text-green-600 mb-1">Invoice</div>
                        <div className="text-sm font-semibold">{getInvoiceNumber(match.invoice_id)}</div>
                      </div>
                    </div>
                    {(match.price_variance > 0 || match.quantity_variance > 0) && (
                      <div className="mt-3 flex gap-4 text-xs">
                        <span className="text-t3">Price Variance: <span className={match.price_variance > 0 ? 'text-red-600 font-medium' : 'text-green-600'}>{formatCurrency(match.price_variance || 0, defaultCurrency)}</span></span>
                        <span className="text-t3">Qty Variance: <span className={match.quantity_variance > 0 ? 'text-red-600 font-medium' : 'text-green-600'}>{match.quantity_variance || 0}</span></span>
                        <span className="text-t3">Variance: <span className={match.variance_percentage > 2 ? 'text-red-600 font-medium' : 'text-green-600'}>{match.variance_percentage?.toFixed(2) || 0}%</span></span>
                      </div>
                    )}
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {activeTab === 'exceptions' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle size={18} className="text-error" />
                Exceptions Requiring Manual Review
              </CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left p-3 font-medium text-t3">PO</th>
                    <th className="text-left p-3 font-medium text-t3">Invoice</th>
                    <th className="text-left p-3 font-medium text-t3">Status</th>
                    <th className="text-left p-3 font-medium text-t3">Variance</th>
                    <th className="text-left p-3 font-medium text-t3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {exceptionMatches.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-t3">
                        <ShieldCheck size={32} className="mx-auto mb-2 text-green-500" />
                        No exceptions pending review
                      </td>
                    </tr>
                  ) : exceptionMatches.map((match: any) => (
                    <tr key={match.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="p-3 font-medium">{getPONumber(match.po_id)}</td>
                      <td className="p-3">{getInvoiceNumber(match.invoice_id)}</td>
                      <td className="p-3">{statusBadge(match.match_status)}</td>
                      <td className="p-3">
                        <span className="text-red-600 font-medium">{match.variance_percentage?.toFixed(2) || 0}%</span>
                        <span className="text-t3 ml-1">({formatCurrency(match.price_variance || 0, defaultCurrency)})</span>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => updateThreeWayMatch(match.id, { match_status: 'full_match', auto_approved: false })}
                            className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded hover:bg-green-100 transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => updateThreeWayMatch(match.id, { match_status: 'mismatch' })}
                            className="text-xs px-2 py-1 bg-red-50 text-red-700 rounded hover:bg-red-100 transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      {/* Create PO Modal */}
      <Modal open={showPOModal} onClose={() => setShowPOModal(false)} title="Create Purchase Order" size="lg">
        <div className="space-y-4">
          <Select
            label="Vendor"
            options={vendors.map((v: any) => ({ value: v.id, label: v.name }))}
            value={poForm.vendor_id}
            onChange={e => setPOForm(prev => ({ ...prev, vendor_id: e.target.value }))}
            placeholder="Select vendor"
          />
          <Input
            label="Delivery Date"
            type="date"
            value={poForm.delivery_date}
            onChange={e => setPOForm(prev => ({ ...prev, delivery_date: e.target.value }))}
          />
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-medium text-t2 tracking-wide uppercase">Line Items</label>
              <button onClick={addPOLine} className="text-xs text-tempo-600 hover:underline">+ Add Line</button>
            </div>
            {poForm.items.map((item, idx) => (
              <div key={idx} className="flex gap-2 mb-2">
                <Input
                  placeholder="Description"
                  value={item.description}
                  onChange={e => updatePOLine(idx, 'description', e.target.value)}
                  className="flex-1"
                />
                <Input
                  type="number"
                  placeholder="Qty"
                  value={item.quantity}
                  onChange={e => updatePOLine(idx, 'quantity', e.target.value)}
                  className="w-20"
                />
                <Input
                  type="number"
                  placeholder="Unit Price"
                  value={item.unit_price}
                  onChange={e => updatePOLine(idx, 'unit_price', e.target.value)}
                  className="w-28"
                />
                {poForm.items.length > 1 && (
                  <button onClick={() => removePOLine(idx)} className="text-red-400 hover:text-red-600">
                    <XCircle size={18} />
                  </button>
                )}
              </div>
            ))}
            <div className="text-right text-sm font-medium text-t2 mt-2">
              Total: {formatCurrency(
                poForm.items.reduce((s, item) => s + Number(item.quantity || 0) * Math.round(Number(item.unit_price || 0) * 100), 0),
                defaultCurrency
              )}
            </div>
          </div>
          <Textarea
            label="Notes"
            value={poForm.notes}
            onChange={e => setPOForm(prev => ({ ...prev, notes: e.target.value }))}
            rows={2}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowPOModal(false)}>Cancel</Button>
            <Button onClick={submitPO}>Create PO</Button>
          </div>
        </div>
      </Modal>

      {/* Create Receipt Modal */}
      <Modal open={showReceiptModal} onClose={() => setShowReceiptModal(false)} title="Record Goods Receipt">
        <div className="space-y-4">
          <Select
            label="Purchase Order"
            options={purchaseOrders.filter((p: any) => ['approved', 'sent_to_vendor', 'partially_received'].includes(p.status)).map((p: any) => ({ value: p.id, label: `${p.po_number} - ${getVendorName(p.vendor_id)}` }))}
            value={receiptForm.po_id}
            onChange={e => setReceiptForm(prev => ({ ...prev, po_id: e.target.value }))}
            placeholder="Select PO"
          />
          <Input
            label="Received Date"
            type="date"
            value={receiptForm.received_date}
            onChange={e => setReceiptForm(prev => ({ ...prev, received_date: e.target.value }))}
          />
          <Textarea
            label="Notes"
            value={receiptForm.notes}
            onChange={e => setReceiptForm(prev => ({ ...prev, notes: e.target.value }))}
            rows={2}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowReceiptModal(false)}>Cancel</Button>
            <Button onClick={submitReceipt}>Record Receipt</Button>
          </div>
        </div>
      </Modal>

      {/* Three-Way Match Modal */}
      <Modal open={showMatchModal} onClose={() => setShowMatchModal(false)} title="Create Three-Way Match" size="lg">
        <div className="space-y-4">
          <p className="text-sm text-t3">Select a Purchase Order, Goods Receipt, and Invoice to perform a three-way match.</p>
          <Select
            label="Purchase Order"
            options={purchaseOrders.map((p: any) => ({ value: p.id, label: `${p.po_number} - ${formatCurrency(p.total_amount || 0, defaultCurrency)}` }))}
            value={matchForm.po_id}
            onChange={e => setMatchForm(prev => ({ ...prev, po_id: e.target.value }))}
            placeholder="Select PO"
          />
          <Select
            label="Goods Receipt"
            options={goodsReceipts.map((r: any) => ({ value: r.id, label: `${r.receipt_number} - ${r.received_date}` }))}
            value={matchForm.receipt_id}
            onChange={e => setMatchForm(prev => ({ ...prev, receipt_id: e.target.value }))}
            placeholder="Select Receipt"
          />
          <Select
            label="Invoice"
            options={invoices.map((i: any) => ({ value: i.id, label: `${i.invoice_number} - ${formatCurrency(i.amount || 0, defaultCurrency)}` }))}
            value={matchForm.invoice_id}
            onChange={e => setMatchForm(prev => ({ ...prev, invoice_id: e.target.value }))}
            placeholder="Select Invoice"
          />

          {matchForm.po_id && matchForm.invoice_id && (
            <div className="bg-gray-50 rounded-lg p-3 text-sm">
              <div className="font-medium mb-2">Preview</div>
              <div className="grid grid-cols-2 gap-2 text-t3">
                <span>PO Amount:</span>
                <span className="font-medium text-t1">{formatCurrency(purchaseOrders.find((p: any) => p.id === matchForm.po_id)?.total_amount || 0, defaultCurrency)}</span>
                <span>Invoice Amount:</span>
                <span className="font-medium text-t1">{formatCurrency(invoices.find((i: any) => i.id === matchForm.invoice_id)?.amount || 0, defaultCurrency)}</span>
                <span>Variance:</span>
                {(() => {
                  const poAmt = purchaseOrders.find((p: any) => p.id === matchForm.po_id)?.total_amount || 0
                  const invAmt = invoices.find((i: any) => i.id === matchForm.invoice_id)?.amount || 0
                  const variance = Math.abs(poAmt - invAmt)
                  const pct = poAmt > 0 ? (variance / poAmt) * 100 : 0
                  return (
                    <span className={pct > 2 ? 'font-medium text-red-600' : 'font-medium text-green-600'}>
                      {formatCurrency(variance, defaultCurrency)} ({pct.toFixed(2)}%)
                    </span>
                  )
                })()}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowMatchModal(false)}>Cancel</Button>
            <Button onClick={submitMatch}>Perform Match</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
