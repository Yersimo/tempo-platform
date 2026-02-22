'use client'

import { Header } from '@/components/layout/header'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/ui/stat-card'
import { FileText, Plus, DollarSign, AlertTriangle } from 'lucide-react'
import { demoInvoices, demoVendors } from '@/lib/demo-data'

export default function InvoicesPage() {
  const totalAmount = demoInvoices.reduce((a, i) => a + i.amount, 0)
  const overdueAmount = demoInvoices.filter(i => i.status === 'overdue').reduce((a, i) => a + i.amount, 0)
  const paidAmount = demoInvoices.filter(i => i.status === 'paid').reduce((a, i) => a + i.amount, 0)

  return (
    <>
      <Header title="Invoices" subtitle="Invoice management and tracking" actions={<Button size="sm"><Plus size={14} /> New Invoice</Button>} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Invoices" value={demoInvoices.length} icon={<FileText size={20} />} />
        <StatCard label="Total Amount" value={`$${totalAmount.toLocaleString()}`} icon={<DollarSign size={20} />} />
        <StatCard label="Paid" value={`$${paidAmount.toLocaleString()}`} change="Settled" changeType="positive" />
        <StatCard label="Overdue" value={`$${overdueAmount.toLocaleString()}`} change="Requires attention" changeType="negative" icon={<AlertTriangle size={20} />} />
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
              {demoInvoices.map(inv => {
                const vendor = demoVendors.find(v => v.id === inv.vendor_id)
                return (
                  <tr key={inv.id} className="hover:bg-canvas/50">
                    <td className="px-6 py-3 text-sm font-mono font-medium text-t1">{inv.invoice_number}</td>
                    <td className="px-4 py-3 text-sm text-t2">{vendor?.name}</td>
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
                        <Button size="sm" variant="ghost">View</Button>
                        {inv.status === 'sent' && <Button size="sm" variant="primary">Pay</Button>}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  )
}
