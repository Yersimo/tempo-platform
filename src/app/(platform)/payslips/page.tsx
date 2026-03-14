'use client'

import { useState, useEffect, useMemo } from 'react'
import { Header } from '@/components/layout/header'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { StatCard } from '@/components/ui/stat-card'
import { FileText, Download, Eye, Wallet, DollarSign, Calendar, AlertTriangle, Search } from 'lucide-react'
import { useTempo } from '@/lib/store'
import { isEvaluatorAccount, getEvaluatorConfig, evaluatorPayslips } from '@/lib/evaluator-demo-data'

/** Format a cents integer (from DB) as a dollar string */
function fmtCents(cents: number | null | undefined): string {
  if (cents == null) return '$0.00'
  return '$' + (cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/** Format a currency amount with proper symbol */
function fmtCurrency(amount: number | null | undefined, currency: string = 'USD'): string {
  if (amount == null) return currency === 'GHS' ? 'GH₵0.00' : '$0.00'
  const prefix = currency === 'GHS' ? 'GH₵' : '$'
  return prefix + amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

interface Payslip {
  entryId: string
  payrollRunId: string
  netPay: number
  grossPay: number
  totalDeductions: number
  currency: string
  period: string
  status: string
  runDate: string
  /** When true, amounts are in actual currency (not cents) */
  _rawAmounts?: boolean
}

interface PayStubDetail {
  employeeName: string
  period: string
  country: string
  currency: string
  earnings: {
    baseSalary: number
    overtime: number
    bonuses: number
    totalEarnings: number
  }
  deductions: {
    federalTax: number
    federalTaxLabel?: string
    stateOrProvincialTax: number
    socialSecurity: number
    socialSecurityLabel?: string
    medicare: number
    pension: number
    healthInsurance: number
    otherDeductions: number
    totalDeductions: number
  }
  netPay: number
}

/** Format a dollar amount from the engine (already in dollars, not cents) */
function fmtDollars(amount: number | null | undefined): string {
  if (amount == null || amount === 0) return '$0.00'
  return '$' + amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function PayslipsPage() {
  const { currentUser, currentEmployeeId, addToast } = useTempo()

  const [payslips, setPayslips] = useState<Payslip[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedStub, setSelectedStub] = useState<PayStubDetail | null>(null)
  const [showStubModal, setShowStubModal] = useState(false)
  const [loadingStub, setLoadingStub] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [downloading, setDownloading] = useState<string | null>(null)

  const employeeId = currentEmployeeId || currentUser?.id
  const userEmail = currentUser?.email || ''
  const isEvaluator = isEvaluatorAccount(userEmail)
  const evaluatorConfig = isEvaluator ? getEvaluatorConfig(userEmail) : null

  // Determine which evaluator payslip data to use
  const evalPayslip = evaluatorConfig?.email === 's.mireku@ecobank-demo.com'
    ? evaluatorPayslips.samuel
    : evaluatorConfig?.email === 'm.fall@ecobank-demo.com'
      ? evaluatorPayslips.meissa
      : null

  // Fetch payslips on mount — evaluators get demo data, others fetch from API
  useEffect(() => {
    if (!employeeId) return
    setLoading(true)

    // Check evaluator status inline using the email
    const email = userEmail
    const isEval = email ? isEvaluatorAccount(email) : false
    const evalCfg = isEval ? getEvaluatorConfig(email) : null
    const evalSlip = evalCfg?.email === 's.mireku@ecobank-demo.com'
      ? evaluatorPayslips.samuel
      : evalCfg?.email === 'm.fall@ecobank-demo.com'
        ? evaluatorPayslips.meissa
        : null

    if (isEval && evalSlip) {
      // Evaluator: use demo payslip data directly (no API call)
      const demoPayslip: Payslip = {
        entryId: evalSlip.id,
        payrollRunId: evalSlip.payroll_run_id,
        netPay: evalSlip.net_pay,
        grossPay: evalSlip.gross_pay,
        totalDeductions: evalSlip.total_deductions,
        currency: evalSlip.currency,
        period: evalSlip.pay_period,
        status: 'paid',
        runDate: evalSlip.pay_date,
        _rawAmounts: true,
      }
      setPayslips([demoPayslip])
      setError(null)
      setLoading(false)
      return
    }

    fetch(`/api/payroll?action=my-payslips&employeeId=${employeeId}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to load payslips')
        return res.json()
      })
      .then(data => {
        setPayslips(data.payslips || [])
        setError(null)
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [employeeId, userEmail])

  // View pay stub detail
  async function viewPayStub(payslip: Payslip) {
    // Evaluator: build stub from demo data directly
    if (isEvaluator && evalPayslip) {
      const stub: PayStubDetail = {
        employeeName: evalPayslip.employee_name,
        period: evalPayslip.pay_period,
        country: evalPayslip.country,
        currency: evalPayslip.currency,
        earnings: {
          baseSalary: evalPayslip.base_pay,
          overtime: evalPayslip.overtime || 0,
          bonuses: evalPayslip.bonus || 0,
          totalEarnings: evalPayslip.gross_pay,
        },
        deductions: {
          federalTax: evalPayslip.paye,
          federalTaxLabel: 'PAYE (Income Tax)',
          stateOrProvincialTax: 0,
          socialSecurity: evalPayslip.ssnit_employee,
          socialSecurityLabel: 'SSNIT (Employee 5.5%)',
          medicare: 0,
          pension: 0,
          healthInsurance: 0,
          otherDeductions: evalPayslip.loan_deduction || 0,
          totalDeductions: evalPayslip.total_deductions,
        },
        netPay: evalPayslip.net_pay,
      }
      setSelectedStub(stub)
      setShowStubModal(true)
      return
    }

    setLoadingStub(true)
    try {
      const res = await fetch('/api/payroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'pay-stub',
          employeeId,
          payrollRunId: payslip.payrollRunId,
        }),
      })
      if (!res.ok) throw new Error('Failed to load pay stub')
      const stub = await res.json()
      setSelectedStub(stub)
      setShowStubModal(true)
    } catch (err: any) {
      addToast(err.message || 'Failed to load pay stub')
    } finally {
      setLoadingStub(false)
    }
  }

  // Download pay stub PDF
  async function downloadPDF(payslip: Payslip) {
    setDownloading(payslip.entryId)
    try {
      const res = await fetch(`/api/payroll/pay-stub-pdf?employeeId=${employeeId}&payrollRunId=${payslip.payrollRunId}`)
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Download failed' }))
        addToast(err.error || 'Failed to download PDF')
        return
      }
      const blob = await res.blob()
      const disposition = res.headers.get('content-disposition') || ''
      const match = disposition.match(/filename="?([^"]+)"?/)
      const filename = match?.[1] || `payslip-${payslip.period}.pdf`
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
      addToast('Payslip downloaded')
    } catch {
      addToast('Failed to download payslip')
    } finally {
      setDownloading(null)
    }
  }

  // Stats
  const totalEarnings = payslips.reduce((sum, p) => sum + (p.grossPay || 0), 0)
  const totalNet = payslips.reduce((sum, p) => sum + (p.netPay || 0), 0)
  const totalDeductions = payslips.reduce((sum, p) => sum + (p.totalDeductions || 0), 0)

  // Determine format function — evaluators use raw GHS, others use cents
  const hasRawAmounts = payslips.some(p => p._rawAmounts)
  const payslipCurrency = payslips[0]?.currency || 'USD'
  const fmtAmount = hasRawAmounts
    ? (amount: number | null | undefined) => fmtCurrency(amount, payslipCurrency)
    : fmtCents

  const filteredPayslips = useMemo(() => {
    if (!searchQuery.trim()) return payslips
    const q = searchQuery.toLowerCase()
    return payslips.filter(p => p.period.toLowerCase().includes(q))
  }, [payslips, searchQuery])

  // Stub formatting — currency-aware
  const stubCurrency = selectedStub?.currency || 'USD'
  const fmtStubAmount = (amount: number | null | undefined) => {
    if (amount == null || amount === 0) return stubCurrency === 'GHS' ? 'GH₵0.00' : '$0.00'
    const prefix = stubCurrency === 'GHS' ? 'GH₵' : '$'
    return prefix + amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  return (
    <>
      <Header title="My Payslips" subtitle="View and download your pay stubs" />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Payslips" value={payslips.length} change="Paid periods" changeType="neutral" icon={<FileText size={20} />} />
        <StatCard label="Total Gross" value={fmtAmount(totalEarnings)} change="All time" changeType="neutral" icon={<DollarSign size={20} />} />
        <StatCard label="Total Net" value={fmtAmount(totalNet)} change="Take home" changeType="neutral" icon={<Wallet size={20} />} />
        <StatCard label="Total Deductions" value={fmtAmount(totalDeductions)} change="Taxes & benefits" changeType="neutral" icon={<Calendar size={20} />} />
      </div>

      {/* Loading / Error states */}
      {loading && (
        <Card className="text-center py-12">
          <p className="text-sm text-t3">Loading your payslips...</p>
        </Card>
      )}

      {error && (
        <Card className="text-center py-12">
          <AlertTriangle size={32} className="text-amber-400 mx-auto mb-3" />
          <p className="text-sm text-t1 font-medium mb-1">Unable to load payslips</p>
          <p className="text-xs text-t3">{error}</p>
        </Card>
      )}

      {/* Payslips Table */}
      {!loading && !error && (
        <Card padding="none">
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <FileText size={18} className="text-tempo-600" />
                Pay History
              </CardTitle>
              <div className="relative w-64">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-t3" />
                <input
                  type="text"
                  placeholder="Search by period..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-md border border-divider bg-canvas text-t1 placeholder:text-t3 focus:outline-none focus:ring-1 focus:ring-tempo-500"
                />
              </div>
            </div>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-divider bg-canvas">
                  <th className="tempo-th text-left px-6 py-3">Period</th>
                  <th className="tempo-th text-left px-4 py-3">Currency</th>
                  <th className="tempo-th text-right px-4 py-3">Gross Pay</th>
                  <th className="tempo-th text-right px-4 py-3">Deductions</th>
                  <th className="tempo-th text-right px-4 py-3">Net Pay</th>
                  <th className="tempo-th text-center px-4 py-3">Status</th>
                  <th className="tempo-th text-center px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredPayslips.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center">
                      <FileText size={36} className="mx-auto mb-3 text-t3/40" />
                      <p className="text-sm font-medium text-t1 mb-1">
                        {searchQuery.trim() ? 'No matching payslips' : 'No payslips available yet'}
                      </p>
                      <p className="text-xs text-t3 max-w-xs mx-auto">
                        {searchQuery.trim()
                          ? `No payslips match "${searchQuery}". Try a different search term.`
                          : 'Payslips will appear here once your payroll has been processed and paid by your employer.'}
                      </p>
                    </td>
                  </tr>
                ) : filteredPayslips.map(payslip => (
                  <tr key={payslip.entryId} className="hover:bg-canvas/50">
                    <td className="px-6 py-3">
                      <p className="text-xs font-medium text-t1">{payslip.period}</p>
                      {payslip.runDate && (
                        <p className="text-xs text-t3">Paid {new Date(payslip.runDate).toLocaleDateString()}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-t2">{payslip.currency || 'USD'}</td>
                    <td className="px-4 py-3 text-xs text-t1 text-right font-medium">{payslip._rawAmounts ? fmtCurrency(payslip.grossPay, payslip.currency) : fmtCents(payslip.grossPay)}</td>
                    <td className="px-4 py-3 text-xs text-error text-right">-{payslip._rawAmounts ? fmtCurrency(payslip.totalDeductions, payslip.currency) : fmtCents(payslip.totalDeductions)}</td>
                    <td className="px-4 py-3 text-xs text-t1 text-right font-semibold">{payslip._rawAmounts ? fmtCurrency(payslip.netPay, payslip.currency) : fmtCents(payslip.netPay)}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant="success">Paid</Badge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex gap-1 justify-center">
                        <Button size="sm" variant="ghost" onClick={() => viewPayStub(payslip)} disabled={loadingStub}>
                          <Eye size={12} /> View
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => downloadPDF(payslip)} disabled={downloading === payslip.entryId}>
                          <Download size={12} /> {downloading === payslip.entryId ? 'Downloading...' : 'PDF'}
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

      {/* Pay Stub Detail Modal */}
      <Modal open={showStubModal} onClose={() => { setShowStubModal(false); setSelectedStub(null) }} title="Pay Stub">
        {selectedStub && (
          <div className="space-y-4">
            <div className="bg-canvas rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-sm font-semibold text-t1">{selectedStub.employeeName}</p>
                  <p className="text-xs text-t3">{selectedStub.country} · {selectedStub.currency}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-t3">Period</p>
                  <p className="text-sm font-medium text-t1">{selectedStub.period}</p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-t2 uppercase mb-2">Earnings</h4>
              <div className="space-y-1">
                <div className="flex justify-between text-sm"><span className="text-t2">Base Salary</span><span className="text-t1">{fmtStubAmount(selectedStub.earnings.baseSalary)}</span></div>
                {selectedStub.earnings.overtime > 0 && <div className="flex justify-between text-sm"><span className="text-t2">Overtime</span><span className="text-t1">{fmtStubAmount(selectedStub.earnings.overtime)}</span></div>}
                {selectedStub.earnings.bonuses > 0 && <div className="flex justify-between text-sm"><span className="text-t2">Bonus</span><span className="text-t1">{fmtStubAmount(selectedStub.earnings.bonuses)}</span></div>}
                <div className="flex justify-between text-sm font-semibold border-t border-divider pt-1"><span className="text-t1">Gross Pay</span><span className="text-t1">{fmtStubAmount(selectedStub.earnings.totalEarnings)}</span></div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-t2 uppercase mb-2">Deductions</h4>
              <div className="space-y-1">
                <div className="flex justify-between text-sm"><span className="text-t2">{selectedStub.deductions.federalTaxLabel || 'Federal Tax'}</span><span className="text-error">-{fmtStubAmount(selectedStub.deductions.federalTax)}</span></div>
                {selectedStub.deductions.stateOrProvincialTax > 0 && <div className="flex justify-between text-sm"><span className="text-t2">State Tax</span><span className="text-error">-{fmtStubAmount(selectedStub.deductions.stateOrProvincialTax)}</span></div>}
                <div className="flex justify-between text-sm"><span className="text-t2">{selectedStub.deductions.socialSecurityLabel || 'Social Security'}</span><span className="text-error">-{fmtStubAmount(selectedStub.deductions.socialSecurity)}</span></div>
                {selectedStub.deductions.medicare > 0 && <div className="flex justify-between text-sm"><span className="text-t2">Medicare</span><span className="text-error">-{fmtStubAmount(selectedStub.deductions.medicare)}</span></div>}
                {selectedStub.deductions.pension > 0 && <div className="flex justify-between text-sm"><span className="text-t2">Pension</span><span className="text-error">-{fmtStubAmount(selectedStub.deductions.pension)}</span></div>}
                {selectedStub.deductions.healthInsurance > 0 && <div className="flex justify-between text-sm"><span className="text-t2">Health Insurance</span><span className="text-error">-{fmtStubAmount(selectedStub.deductions.healthInsurance)}</span></div>}
                {(selectedStub.deductions.otherDeductions || 0) > 0 && <div className="flex justify-between text-sm"><span className="text-t2">Other Deductions</span><span className="text-error">-{fmtStubAmount(selectedStub.deductions.otherDeductions)}</span></div>}
                <div className="flex justify-between text-sm font-semibold border-t border-divider pt-1"><span className="text-t1">Total Deductions</span><span className="text-error">-{fmtStubAmount(selectedStub.deductions.totalDeductions)}</span></div>
              </div>
            </div>

            <div className="bg-tempo-50 rounded-lg p-4 flex justify-between items-center">
              <span className="text-sm font-semibold text-t1">Net Pay</span>
              <span className="text-xl font-bold text-tempo-700">{fmtStubAmount(selectedStub.netPay)}</span>
            </div>

            {/* SSNIT employer contribution note for Ghana payslips */}
            {selectedStub.currency === 'GHS' && isEvaluator && evalPayslip && (
              <div className="bg-gray-50 rounded-lg p-3 text-xs text-t3 space-y-1">
                <p className="font-medium text-t2">Employer Contributions (not deducted from pay)</p>
                <div className="flex justify-between"><span>SSNIT Employer (13%)</span><span className="text-t2">GH₵{(evalPayslip.ssnit_employer).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  )
}
