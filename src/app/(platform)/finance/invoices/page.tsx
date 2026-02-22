'use client'

import { useState, useMemo } from 'react'
import { Header } from '@/components/layout/header'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/ui/stat-card'
import { Modal } from '@/components/ui/modal'
import { Input, Select, Textarea } from '@/components/ui/input'
import { FileText, Plus, DollarSign, AlertTriangle, Send, CreditCard } from 'lucide-react'
import { useTempo } from '@/lib/store'
import { AIInsightCard } from '@/components/ai'
import { forecastCashFlow, assessVendorConcentration } from '@/lib/ai-engine'

export default function InvoicesPage() {
  const { invoices, vendors, addInvoice, updateInvoice } = useTempo()

  const cashFlowInsight = useMemo(() => forecastCashFlow(invoices, []), [invoices])
  const vendorInsights = useMemo(() => assessVendorConcentration(invoices, vendors), [invoices, vendors])

  const totalAmount = invoices.reduce((a, i) => a + i.amount, 0)
  const paidAmount = invoices.filter(i => i.status === 'paid').reduce((a, i) => a + i.amount, 0)
  const overdueAmount = invoices.filter(i => i.status === 'overdue').reduce((a, i) => a + i.amount, 0)

  // New Invoice modal
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [invoiceForm, setInvoiceForm] = useState({
    invoice_number: '',
    vendor_id: '',
    amount: '',
    description: '',
    due_date: '',
    issued_date: '',
    currency: 'USD',
  })

  function openNewInvoice() {
    setInvoiceForm({
      invoice_number: `INV-${Date.now().toString().slice(-6)}`,
      vendor_id: vendors[0]?.id || '',
      amount: '',
      description: '',
      due_date: '',
      issued_date: new Date().toISOString().split('T')[0],
      currency: 'USD',
    })
    setShowInvoiceModal(true)
  }

  function submitInvoice() {
    if (!invoiceForm.invoice_number || !invoiceForm.vendor_id || !invoiceForm.amount) return
    addInvoice({
      invoice_number: invoiceForm.invoice_number,
      vendor_id: invoiceForm.vendor_id,
      amount: Number(invoiceForm.amount),
      description: invoiceForm.description,
      due_date: invoiceForm.due_date || '2026-12-31',
      issued_date: invoiceForm.issued_date || new Date().toISOString().split('T')[0],
      status: 'draft',
      currency: invoiceForm.currency,
    })
    setShowInvoiceModal(false)
  }

  function sendInvoice(id: string) {
    updateInvoice(id, { status: 'sent' })
  }

  function payInvoice(id: string) {
    updateInvoice(id, { status: 'paid', paid_date: new Date().toISOString().split('T')[0] })
  }

  function markOverdue(id: string) {
    updateInvoice(id, { status: 'overdue' })
  }

  function getVendorName(vendorId: string) {
    const vendor = vendors.find(v => v.id === vendorId)
    return vendor?.name || 'Unknown'
  }

  return (
    <>
      <Header
        title="Invoices"
        subtitle="Invoice management and tracking"
        actions={<Button size="sm" onClick={openNewInvoice}><Plus size={14} /> New Invoice</Button>}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Invoices" value={invoices.length} icon={<FileText size={20} />} />
        <StatCard label="Total Amount" value={`$${totalAmount.toLocaleString()}`} icon={<DollarSign size={20} />} />
        <StatCard label="Paid" value={`$${paidAmount.toLocaleString()}`} change="Settled" changeType="positive" />
        <StatCard label="Overdue" value={`$${overdueAmount.toLocaleString()}`} change="Requires attention" changeType="negative" icon={<AlertTriangle size={20} />} />
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

      <Card padding="none">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Invoices</CardTitle>
            <Button variant="secondary" size="sm">Export</Button>
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-divider bg-canvas">
                <th className="tempo-th text-left px-6 py-3">Invoice #</th>
                <th className="tempo-th text-left px-4 py-3">Vendor</th>
                <th className="tempo-th text-left px-4 py-3">Description</th>
                <th className="tempo-th text-right px-4 py-3">Amount</th>
                <th className="tempo-th text-left px-4 py-3">Due Date</th>
                <th className="tempo-th text-center px-4 py-3">Status</th>
                <th className="tempo-th text-center px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {invoices.map(inv => (
                <tr key={inv.id} className="hover:bg-canvas/50">
                  <td className="px-6 py-3 text-sm font-mono font-medium text-t1">{inv.invoice_number}</td>
                  <td className="px-4 py-3 text-sm text-t2">{getVendorName(inv.vendor_id)}</td>
                  <td className="px-4 py-3 text-sm text-t2 max-w-[200px] truncate">{inv.description}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-t1 text-right">${inv.amount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-t2">{inv.due_date}</td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={
                      inv.status === 'paid' ? 'success' :
                      inv.status === 'overdue' ? 'error' :
                      inv.status === 'sent' ? 'info' : 'default'
                    }>
                      {inv.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex gap-1 justify-center">
                      {inv.status === 'draft' && (
                        <Button size="sm" variant="secondary" onClick={() => sendInvoice(inv.id)}>
                          <Send size={12} /> Send
                        </Button>
                      )}
                      {inv.status === 'sent' && (
                        <>
                          <Button size="sm" variant="primary" onClick={() => payInvoice(inv.id)}>
                            <CreditCard size={12} /> Pay
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => markOverdue(inv.id)}>
                            Overdue
                          </Button>
                        </>
                      )}
                      {inv.status === 'overdue' && (
                        <Button size="sm" variant="primary" onClick={() => payInvoice(inv.id)}>
                          <CreditCard size={12} /> Pay
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* New Invoice Modal */}
      <Modal open={showInvoiceModal} onClose={() => setShowInvoiceModal(false)} title="Create New Invoice">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Invoice Number" placeholder="INV-XXXXX" value={invoiceForm.invoice_number} onChange={(e) => setInvoiceForm({ ...invoiceForm, invoice_number: e.target.value })} />
            <Select label="Vendor" value={invoiceForm.vendor_id} onChange={(e) => setInvoiceForm({ ...invoiceForm, vendor_id: e.target.value })} options={vendors.map(v => ({ value: v.id, label: v.name }))} />
          </div>
          <Textarea label="Description" placeholder="Invoice description..." rows={2} value={invoiceForm.description} onChange={(e) => setInvoiceForm({ ...invoiceForm, description: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Amount" type="number" placeholder="10000" value={invoiceForm.amount} onChange={(e) => setInvoiceForm({ ...invoiceForm, amount: e.target.value })} />
            <Select label="Currency" value={invoiceForm.currency} onChange={(e) => setInvoiceForm({ ...invoiceForm, currency: e.target.value })} options={[
              { value: 'USD', label: 'USD' },
              { value: 'EUR', label: 'EUR' },
              { value: 'GBP', label: 'GBP' },
              { value: 'XOF', label: 'XOF' },
              { value: 'NGN', label: 'NGN' },
            ]} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Issue Date" type="date" value={invoiceForm.issued_date} onChange={(e) => setInvoiceForm({ ...invoiceForm, issued_date: e.target.value })} />
            <Input label="Due Date" type="date" value={invoiceForm.due_date} onChange={(e) => setInvoiceForm({ ...invoiceForm, due_date: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowInvoiceModal(false)}>Cancel</Button>
            <Button onClick={submitInvoice}>Create Invoice</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
