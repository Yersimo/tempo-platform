'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/layout/header'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { StatCard } from '@/components/ui/stat-card'
import { FileText, Download, Eye, Wallet, DollarSign, Calendar, AlertTriangle } from 'lucide-react'
import { useTempo } from '@/lib/store'

/** Format a cents integer (from DB) as a dollar string */
function fmtCents(cents: number | null | undefined): string {
  if (cents == null) return '$0.00'
  return '$' + (cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
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
    stateOrProvincialTax: number
    socialSecurity: number
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

  const employeeId = currentEmployeeId || currentUser?.id

  // Fetch payslips on mount
  useEffect(() => {
    if (!employeeId) return
    setLoading(true)
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
  }, [employeeId])

  // View pay stub detail
  async function viewPayStub(payslip: Payslip) {
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
    }
  }

  // Stats
  const totalEarnings = payslips.reduce((sum, p) => sum + (p.grossPay || 0), 0)
  const totalNet = payslips.reduce((sum, p) => sum + (p.netPay || 0), 0)
  const totalDeductions = payslips.reduce((sum, p) => sum + (p.totalDeductions || 0), 0)

  return (
    <>
      <Header title="My Payslips" subtitle="View and download your pay stubs" />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Payslips" value={payslips.length} change="Paid periods" changeType="neutral" icon={<FileText size={20} />} />
        <StatCard label="Total Gross" value={fmtCents(totalEarnings)} change="All time" changeType="neutral" icon={<DollarSign size={20} />} />
        <StatCard label="Total Net" value={fmtCents(totalNet)} change="Take home" changeType="neutral" icon={<Wallet size={20} />} />
        <StatCard label="Total Deductions" value={fmtCents(totalDeductions)} change="Taxes & benefits" changeType="neutral" icon={<Calendar size={20} />} />
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
            <CardTitle className="flex items-center gap-2">
              <FileText size={18} className="text-tempo-600" />
              Pay History
            </CardTitle>
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
                {payslips.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-xs text-t3">
                      No payslips available yet. Payslips appear here after your payroll has been processed and paid.
                    </td>
                  </tr>
                ) : payslips.map(payslip => (
                  <tr key={payslip.entryId} className="hover:bg-canvas/50">
                    <td className="px-6 py-3">
                      <p className="text-xs font-medium text-t1">{payslip.period}</p>
                      {payslip.runDate && (
                        <p className="text-xs text-t3">Paid {new Date(payslip.runDate).toLocaleDateString()}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-t2">{payslip.currency || 'USD'}</td>
                    <td className="px-4 py-3 text-xs text-t1 text-right font-medium">{fmtCents(payslip.grossPay)}</td>
                    <td className="px-4 py-3 text-xs text-error text-right">-{fmtCents(payslip.totalDeductions)}</td>
                    <td className="px-4 py-3 text-xs text-t1 text-right font-semibold">{fmtCents(payslip.netPay)}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant="success">Paid</Badge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex gap-1 justify-center">
                        <Button size="sm" variant="ghost" onClick={() => viewPayStub(payslip)} disabled={loadingStub}>
                          <Eye size={12} /> View
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => downloadPDF(payslip)}>
                          <Download size={12} /> PDF
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
                <div className="flex justify-between text-sm"><span className="text-t2">Base Salary</span><span className="text-t1">{fmtDollars(selectedStub.earnings.baseSalary)}</span></div>
                {selectedStub.earnings.overtime > 0 && <div className="flex justify-between text-sm"><span className="text-t2">Overtime</span><span className="text-t1">{fmtDollars(selectedStub.earnings.overtime)}</span></div>}
                {selectedStub.earnings.bonuses > 0 && <div className="flex justify-between text-sm"><span className="text-t2">Bonus</span><span className="text-t1">{fmtDollars(selectedStub.earnings.bonuses)}</span></div>}
                <div className="flex justify-between text-sm font-semibold border-t border-divider pt-1"><span className="text-t1">Gross Pay</span><span className="text-t1">{fmtDollars(selectedStub.earnings.totalEarnings)}</span></div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-t2 uppercase mb-2">Deductions</h4>
              <div className="space-y-1">
                <div className="flex justify-between text-sm"><span className="text-t2">Federal Tax</span><span className="text-error">-{fmtDollars(selectedStub.deductions.federalTax)}</span></div>
                {selectedStub.deductions.stateOrProvincialTax > 0 && <div className="flex justify-between text-sm"><span className="text-t2">State Tax</span><span className="text-error">-{fmtDollars(selectedStub.deductions.stateOrProvincialTax)}</span></div>}
                <div className="flex justify-between text-sm"><span className="text-t2">Social Security</span><span className="text-error">-{fmtDollars(selectedStub.deductions.socialSecurity)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-t2">Medicare</span><span className="text-error">-{fmtDollars(selectedStub.deductions.medicare)}</span></div>
                {selectedStub.deductions.pension > 0 && <div className="flex justify-between text-sm"><span className="text-t2">Pension</span><span className="text-error">-{fmtDollars(selectedStub.deductions.pension)}</span></div>}
                {selectedStub.deductions.healthInsurance > 0 && <div className="flex justify-between text-sm"><span className="text-t2">Health Insurance</span><span className="text-error">-{fmtDollars(selectedStub.deductions.healthInsurance)}</span></div>}
                <div className="flex justify-between text-sm font-semibold border-t border-divider pt-1"><span className="text-t1">Total Deductions</span><span className="text-error">-{fmtDollars(selectedStub.deductions.totalDeductions)}</span></div>
              </div>
            </div>

            <div className="bg-tempo-50 rounded-lg p-4 flex justify-between items-center">
              <span className="text-sm font-semibold text-t1">Net Pay</span>
              <span className="text-xl font-bold text-tempo-700">{fmtDollars(selectedStub.netPay)}</span>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
