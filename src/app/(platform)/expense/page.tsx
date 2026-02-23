'use client'

import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { Header } from '@/components/layout/header'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/ui/stat-card'
import { Modal } from '@/components/ui/modal'
import { Input, Select, Textarea } from '@/components/ui/input'
import { Receipt, Plus, DollarSign, Clock, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useTempo } from '@/lib/store'
import { AIScoreBadge, AIInsightCard } from '@/components/ai'
import { checkPolicyCompliance, calculateFraudRiskScore, analyzeSpendingTrends } from '@/lib/ai-engine'

export default function ExpensePage() {
  const t = useTranslations('expense')
  const tc = useTranslations('common')
  const {
    expenseReports, employees,
    addExpenseReport, updateExpenseReport, deleteExpenseReport,
    getEmployeeName, currentEmployeeId,
  } = useTempo()

  // New report modal
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportForm, setReportForm] = useState({
    employee_id: '',
    title: '',
    currency: 'USD',
    items: [{ description: '', category: 'travel', amount: 0 }] as Array<{ description: string; category: string; amount: number }>,
  })

  // Delete confirm
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  // Expanded report
  const [expandedReport, setExpandedReport] = useState<string | null>(null)

  const pendingReports = expenseReports.filter(e => e.status === 'submitted' || e.status === 'pending_approval')
  const totalPending = pendingReports.reduce((a, e) => a + e.total_amount, 0)
  const approvedReports = expenseReports.filter(e => e.status === 'approved' || e.status === 'reimbursed')
  const totalApproved = approvedReports.reduce((a, e) => a + e.total_amount, 0)

  const spendingInsights = useMemo(() => analyzeSpendingTrends(expenseReports), [expenseReports])

  // ---- Expense Report CRUD ----
  function openNewReport() {
    setReportForm({
      employee_id: employees[0]?.id || '',
      title: '',
      currency: 'USD',
      items: [{ description: '', category: 'travel', amount: 0 }],
    })
    setShowReportModal(true)
  }

  function addLineItem() {
    setReportForm({
      ...reportForm,
      items: [...reportForm.items, { description: '', category: 'travel', amount: 0 }],
    })
  }

  function updateLineItem(index: number, field: string, value: string | number) {
    const updated = reportForm.items.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    )
    setReportForm({ ...reportForm, items: updated })
  }

  function removeLineItem(index: number) {
    if (reportForm.items.length <= 1) return
    setReportForm({
      ...reportForm,
      items: reportForm.items.filter((_, i) => i !== index),
    })
  }

  function submitReport() {
    if (!reportForm.employee_id || !reportForm.title || reportForm.items.length === 0) return
    const validItems = reportForm.items.filter(item => item.description && item.amount > 0)
    if (validItems.length === 0) return

    const totalAmount = validItems.reduce((a, item) => a + Number(item.amount), 0)
    addExpenseReport({
      employee_id: reportForm.employee_id,
      title: reportForm.title,
      total_amount: totalAmount,
      currency: reportForm.currency,
      status: 'submitted',
      submitted_at: new Date().toISOString(),
      items: validItems.map((item, i) => ({
        id: `item-${Date.now()}-${i}`,
        description: item.description,
        category: item.category,
        amount: Number(item.amount),
        date: new Date().toISOString().split('T')[0],
      })),
    })
    setShowReportModal(false)
  }

  function approveReport(id: string) {
    updateExpenseReport(id, { status: 'approved', approved_by: currentEmployeeId, approved_at: new Date().toISOString() })
  }

  function rejectReport(id: string) {
    updateExpenseReport(id, { status: 'rejected', approved_by: currentEmployeeId, approved_at: new Date().toISOString() })
  }

  function reimburseReport(id: string) {
    updateExpenseReport(id, { status: 'reimbursed', reimbursed_at: new Date().toISOString() })
  }

  function confirmDelete() {
    if (deleteConfirm) {
      deleteExpenseReport(deleteConfirm)
      setDeleteConfirm(null)
    }
  }

  return (
    <>
      <Header
        title={t('title')}
        subtitle={t('subtitle')}
        actions={
          <Button size="sm" onClick={openNewReport}>
            <Plus size={14} /> {t('newReport')}
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label={t('pendingReview')} value={pendingReports.length} icon={<Clock size={20} />} />
        <StatCard label={t('pendingAmount')} value={`$${totalPending.toLocaleString()}`} change="Awaiting approval" changeType="neutral" icon={<DollarSign size={20} />} />
        <StatCard label={t('approvedReimbursed')} value={`$${totalApproved.toLocaleString()}`} change={tc('thisQuarter')} changeType="positive" />
        <StatCard label={t('totalReports')} value={expenseReports.length} icon={<Receipt size={20} />} />
      </div>

      {/* AI Spending Trends */}
      {spendingInsights.length > 0 && (
        <div className="mb-4 space-y-2">
          {spendingInsights.map(insight => (
            <AIInsightCard key={insight.id} insight={insight} compact />
          ))}
        </div>
      )}

      {/* Expense Reports List */}
      <Card padding="none">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t('expenseReportsTitle')}</CardTitle>
            <Button variant="secondary" size="sm" onClick={openNewReport}>
              <Plus size={14} /> {t('newReport')}
            </Button>
          </div>
        </CardHeader>
        <div className="divide-y divide-divider">
          {expenseReports.length === 0 && (
            <div className="px-6 py-12 text-center text-sm text-t3">
              {t('noExpenseReports')}
            </div>
          )}
          {expenseReports.map(report => {
            const isExpanded = expandedReport === report.id
            return (
              <div key={report.id} className="px-6 py-4">
                <div className="flex items-center gap-4 mb-1">
                  <Avatar name={getEmployeeName(report.employee_id)} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-t1">{report.title}</p>
                      <button
                        onClick={() => setExpandedReport(isExpanded ? null : report.id)}
                        className="p-0.5 text-t3 hover:text-t1 transition-colors"
                      >
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    </div>
                    <p className="text-xs text-t3">
                      {getEmployeeName(report.employee_id)} - {t('submittedDate', { date: new Date(report.submitted_at).toLocaleDateString() })}
                    </p>
                  </div>
                  <p className="text-lg font-semibold text-t1">${report.total_amount.toLocaleString()}</p>
                  <AIScoreBadge score={calculateFraudRiskScore(report, expenseReports)} size="sm" />
                  <Badge variant={
                    report.status === 'approved' ? 'success' :
                    report.status === 'reimbursed' ? 'info' :
                    report.status === 'rejected' ? 'error' :
                    report.status === 'submitted' || report.status === 'pending_approval' ? 'warning' : 'default'
                  }>
                    {report.status.replace(/_/g, ' ')}
                  </Badge>
                  <div className="flex gap-1">
                    {(report.status === 'submitted' || report.status === 'pending_approval') && (
                      <>
                        <Button size="sm" variant="primary" onClick={() => approveReport(report.id)}>{tc('approve')}</Button>
                        <Button size="sm" variant="ghost" onClick={() => rejectReport(report.id)}>{tc('reject')}</Button>
                      </>
                    )}
                    {report.status === 'approved' && (
                      <Button size="sm" variant="primary" onClick={() => reimburseReport(report.id)}>{tc('reimburse')}</Button>
                    )}
                    <button
                      onClick={() => setDeleteConfirm(report.id)}
                      className="p-1.5 text-t3 hover:text-error hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Expanded line items */}
                {isExpanded && report.items && report.items.length > 0 && (
                  <div className="ml-12 mt-3 grid grid-cols-1 md:grid-cols-3 gap-2">
                    {report.items.map((item: { id: string; description: string; category: string; amount: number }) => (
                      <div key={item.id} className="bg-canvas rounded-lg px-3 py-2 flex justify-between">
                        <div>
                          <p className="text-xs font-medium text-t1">{item.description}</p>
                          <p className="text-[0.6rem] text-t3">{item.category}</p>
                        </div>
                        <p className="text-xs font-semibold text-t1">${item.amount}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Always show items summary when collapsed */}
                {!isExpanded && report.items && report.items.length > 0 && (
                  <p className="ml-12 text-xs text-t3 mt-1">
                    {report.items.length !== 1 ? t('lineItemCountPlural', { count: report.items.length }) : t('lineItemCount', { count: report.items.length })}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </Card>

      {/* ---- MODALS ---- */}

      {/* New Expense Report Modal */}
      <Modal open={showReportModal} onClose={() => setShowReportModal(false)} title={t('newReportModal')} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Select
              label={tc('employee')}
              value={reportForm.employee_id}
              onChange={(e) => setReportForm({ ...reportForm, employee_id: e.target.value })}
              options={employees.map(e => ({ value: e.id, label: e.profile?.full_name || '' }))}
            />
            <Select
              label={tc('currency')}
              value={reportForm.currency}
              onChange={(e) => setReportForm({ ...reportForm, currency: e.target.value })}
              options={[
                { value: 'USD', label: tc('currencyUSD') },
                { value: 'NGN', label: tc('currencyNGN') },
                { value: 'GHS', label: tc('currencyGHS') },
                { value: 'KES', label: tc('currencyKES') },
                { value: 'XOF', label: tc('currencyXOF') },
              ]}
            />
          </div>
          <Input
            label={t('reportTitle')}
            placeholder={t('reportTitlePlaceholder')}
            value={reportForm.title}
            onChange={(e) => setReportForm({ ...reportForm, title: e.target.value })}
          />

          {/* Line Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-medium text-t1">{tc('lineItems')}</label>
              <Button size="sm" variant="secondary" onClick={addLineItem}>
                <Plus size={12} /> {tc('addItem')}
              </Button>
            </div>
            <div className="space-y-2">
              {reportForm.items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-5">
                    <Input
                      placeholder={t('descriptionPlaceholder')}
                      value={item.description}
                      onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                    />
                  </div>
                  <div className="col-span-3">
                    <Select
                      value={item.category}
                      onChange={(e) => updateLineItem(index, 'category', e.target.value)}
                      options={[
                        { value: 'travel', label: t('categoryTravel') },
                        { value: 'meals', label: t('categoryMeals') },
                        { value: 'accommodation', label: t('categoryAccommodation') },
                        { value: 'transport', label: t('categoryTransport') },
                        { value: 'supplies', label: t('categorySupplies') },
                        { value: 'equipment', label: t('categoryEquipment') },
                        { value: 'other', label: t('categoryOther') },
                      ]}
                    />
                  </div>
                  <div className="col-span-3">
                    <Input
                      type="number"
                      min={0}
                      placeholder={t('amountPlaceholder')}
                      value={item.amount || ''}
                      onChange={(e) => updateLineItem(index, 'amount', Number(e.target.value))}
                    />
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <button
                      onClick={() => removeLineItem(index)}
                      disabled={reportForm.items.length <= 1}
                      className="p-1.5 text-t3 hover:text-error hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-2">
              <p className="text-sm font-semibold text-t1">
                {tc('total')}: ${reportForm.items.reduce((a, item) => a + (Number(item.amount) || 0), 0).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowReportModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitReport}>{t('submitReport')}</Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title={t('deleteReportModal')} size="sm">
        <p className="text-sm text-t2 mb-4">{t('deleteReportConfirm')}</p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>{tc('cancel')}</Button>
          <Button variant="danger" onClick={confirmDelete}>{tc('delete')}</Button>
        </div>
      </Modal>
    </>
  )
}
