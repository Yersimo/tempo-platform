'use client'

import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { Header } from '@/components/layout/header'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/ui/stat-card'
import { Progress } from '@/components/ui/progress'
import { Modal } from '@/components/ui/modal'
import { Input, Select, Textarea } from '@/components/ui/input'
import { FileText, Plus, DollarSign, AlertTriangle, Send, CreditCard, Star, TrendingUp, TrendingDown, Minus, Building2, Brain, PieChart } from 'lucide-react'
import { useTempo } from '@/lib/store'
import { exportToCSV } from '@/lib/export-import'
import { AIInsightCard } from '@/components/ai'
import { forecastCashFlow, assessVendorConcentration, detectDuplicateSubscriptions, analyzeSavingsOpportunities } from '@/lib/ai-engine'
import { demoVendorContracts, demoSpendByCategory } from '@/lib/demo-data'

export default function InvoicesPage() {
  const t = useTranslations('invoices')
  const tc = useTranslations('common')
  const { invoices, vendors, softwareLicenses, addInvoice, updateInvoice } = useTempo()

  const cashFlowInsight = useMemo(() => forecastCashFlow(invoices, []), [invoices])
  const vendorInsights = useMemo(() => assessVendorConcentration(invoices, vendors), [invoices, vendors])
  const duplicateInsights = useMemo(() => detectDuplicateSubscriptions(softwareLicenses), [softwareLicenses])
  const savingsInsights = useMemo(() => analyzeSavingsOpportunities(invoices, softwareLicenses), [invoices, softwareLicenses])

  const totalAmount = invoices.reduce((a, i) => a + i.amount, 0)
  const paidAmount = invoices.filter(i => i.status === 'paid').reduce((a, i) => a + i.amount, 0)
  const overdueAmount = invoices.filter(i => i.status === 'overdue').reduce((a, i) => a + i.amount, 0)

  // Vendor spend aggregation
  const vendorSpendMap = useMemo(() => {
    const map: Record<string, number> = {}
    invoices.forEach(inv => {
      map[inv.vendor_id] = (map[inv.vendor_id] || 0) + inv.amount
    })
    return map
  }, [invoices])

  const totalVendorSpend = Object.values(vendorSpendMap).reduce((a, b) => a + b, 0)

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
      due_date: invoiceForm.due_date || `${new Date().getFullYear()}-12-31`,
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
    return vendor?.name || tc('unknown')
  }

  return (
    <>
      <Header
        title={t('title')}
        subtitle={t('subtitle')}
        actions={<Button size="sm" onClick={openNewInvoice}><Plus size={14} /> {t('newInvoice')}</Button>}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label={t('totalInvoices')} value={invoices.length} icon={<FileText size={20} />} />
        <StatCard label={t('totalAmount')} value={`$${totalAmount.toLocaleString()}`} icon={<DollarSign size={20} />} />
        <StatCard label={t('paidLabel')} value={`$${paidAmount.toLocaleString()}`} change={t('settled')} changeType="positive" />
        <StatCard label={t('overdueLabel')} value={`$${overdueAmount.toLocaleString()}`} change={t('requiresAttention')} changeType="negative" icon={<AlertTriangle size={20} />} href="/finance/budgets" />
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
                <th className="tempo-th text-center px-4 py-3">{tc('status')}</th>
                <th className="tempo-th text-center px-4 py-3">{tc('actions')}</th>
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
                          <Send size={12} /> {tc('send')}
                        </Button>
                      )}
                      {inv.status === 'sent' && (
                        <>
                          <Button size="sm" variant="primary" onClick={() => payInvoice(inv.id)}>
                            <CreditCard size={12} /> {tc('process')}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => markOverdue(inv.id)}>
                            {tc('overdue')}
                          </Button>
                        </>
                      )}
                      {inv.status === 'overdue' && (
                        <Button size="sm" variant="primary" onClick={() => payInvoice(inv.id)}>
                          <CreditCard size={12} /> {tc('process')}
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

      {/* ── Section 1: Vendor Management ── */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-t1 mb-4 flex items-center gap-2">
          <Building2 size={20} /> {t('vendorDirectory')}
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <StatCard label={t('totalVendorSpend')} value={`$${totalVendorSpend.toLocaleString()}`} icon={<DollarSign size={20} />} />
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
                  const vendor = vendors.find(v => v.id === contract.vendor_id)
                  const vendorSpend = vendorSpendMap[contract.vendor_id] || 0
                  const spendPct = totalVendorSpend > 0 ? Math.round((vendorSpend / totalVendorSpend) * 100) : 0
                  return (
                    <tr key={contract.id} className="hover:bg-canvas/50">
                      <td className="px-6 py-3">
                        <div>
                          <p className="text-sm font-medium text-t1">{vendor?.name || contract.contract_number}</p>
                          <p className="text-xs text-t3">{vendor?.category}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-t2">{contract.start_date}</td>
                      <td className="px-4 py-3 text-sm text-t2">{contract.end_date}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-t1 text-right">${contract.annual_value.toLocaleString()}</td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={contract.renewal_type === 'auto' ? 'info' : 'default'}>
                          {contract.renewal_type === 'auto' ? t('autoRenewal') : t('manualRenewal')}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Star size={12} className="text-warning fill-warning" />
                          <span className="text-sm font-medium text-t1">{contract.performance_rating}</span>
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
        <h2 className="text-lg font-semibold text-t1 mb-4 flex items-center gap-2">
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
                        <span className="font-medium text-t1">${(cat.amount / 1000).toFixed(0)}K</span>
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
                      <span className="text-sm font-medium text-t1">${(cat.amount / 1000).toFixed(0)}K</span>
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
            {vendors.map(vendor => {
              const spend = vendorSpendMap[vendor.id] || 0
              const pctVal = totalVendorSpend > 0 ? Math.round((spend / totalVendorSpend) * 100) : 0
              return (
                <div key={vendor.id} className="p-3 bg-canvas rounded-lg">
                  <p className="text-sm font-medium text-t1 truncate">{vendor.name}</p>
                  <p className="text-xs text-t3 mb-2">{vendor.category}</p>
                  <p className="text-lg font-semibold text-t1">${spend.toLocaleString()}</p>
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
        <h2 className="text-lg font-semibold text-t1 mb-4 flex items-center gap-2">
          <Brain size={20} /> {t('aiSavingsInsights')}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Savings opportunities from AI */}
          {savingsInsights.map(insight => (
            <AIInsightCard key={insight.id} insight={insight} />
          ))}
          {/* Duplicate subscriptions from AI */}
          {duplicateInsights.map(insight => (
            <AIInsightCard key={insight.id} insight={insight} />
          ))}
          {/* Static insight cards for features not yet in data */}
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
            <Select label={t('tableVendor')} value={invoiceForm.vendor_id} onChange={(e) => setInvoiceForm({ ...invoiceForm, vendor_id: e.target.value })} options={vendors.map(v => ({ value: v.id, label: v.name }))} />
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
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('issueDate')} type="date" value={invoiceForm.issued_date} onChange={(e) => setInvoiceForm({ ...invoiceForm, issued_date: e.target.value })} />
            <Input label={t('dueDate')} type="date" value={invoiceForm.due_date} onChange={(e) => setInvoiceForm({ ...invoiceForm, due_date: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowInvoiceModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitInvoice}>{t('createInvoice')}</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
