'use client'

import { useState, useMemo } from 'react'
import { Header } from '@/components/layout/header'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/ui/stat-card'
import { Modal } from '@/components/ui/modal'
import { Input, Select } from '@/components/ui/input'
import { Wallet, DollarSign, Users, Plus, FileText } from 'lucide-react'
import { useTempo } from '@/lib/store'
import { AIInsightCard, AIAlertBanner } from '@/components/ai'
import { detectPayrollAnomalies, forecastAnnualPayroll } from '@/lib/ai-engine'

export default function PayrollPage() {
  const { payrollRuns, employees, addPayrollRun, updatePayrollRun } = useTempo()
  const [showPayRunModal, setShowPayRunModal] = useState(false)
  const [payRunForm, setPayRunForm] = useState({
    period: '',
    total_gross: 0,
    total_net: 0,
    total_deductions: 0,
    currency: 'USD',
    employee_count: 30,
    run_date: '',
  })

  const totalPayroll = payrollRuns.reduce((a, r) => a + r.total_gross, 0)
  const lastRun = payrollRuns.length > 0 ? payrollRuns[payrollRuns.length - 1] : null
  const totalDeductions = lastRun ? lastRun.total_deductions : 0

  const payrollInsights = useMemo(() => detectPayrollAnomalies(payrollRuns), [payrollRuns])

  const forecast = useMemo(() => forecastAnnualPayroll(payrollRuns), [payrollRuns])

  const forecastInsight = useMemo(() => ({
    id: 'ai-payroll-forecast',
    category: 'prediction' as const,
    severity: 'info' as const,
    title: 'Annual Payroll Forecast',
    description: `Projected annual payroll: $${(forecast.projected / 1000000).toFixed(2)}M based on ${payrollRuns.length} pay run(s). Confidence: ${forecast.confidence}.`,
    confidence: forecast.confidence,
    confidenceScore: forecast.confidence === 'high' ? 88 : forecast.confidence === 'medium' ? 65 : 40,
    suggestedAction: 'Review budget allocation for upcoming quarters',
    module: 'payroll',
  }), [forecast, payrollRuns.length])

  function submitPayRun() {
    if (!payRunForm.period || !payRunForm.run_date) return
    const gross = payRunForm.total_gross || 2450000
    const deductions = payRunForm.total_deductions || Math.round(gross * 0.23)
    const net = gross - deductions
    addPayrollRun({
      ...payRunForm,
      total_gross: gross,
      total_deductions: deductions,
      total_net: net,
      status: 'draft',
      employee_count: payRunForm.employee_count || employees.length,
    })
    setShowPayRunModal(false)
    setPayRunForm({ period: '', total_gross: 0, total_net: 0, total_deductions: 0, currency: 'USD', employee_count: 30, run_date: '' })
  }

  function processPayRun(runId: string, currentStatus: string) {
    const nextStatus = currentStatus === 'draft' ? 'approved' : currentStatus === 'approved' ? 'paid' : currentStatus
    updatePayrollRun(runId, { status: nextStatus })
  }

  return (
    <>
      <Header title="Payroll" subtitle="Pay runs, payslips, and tax configuration"
        actions={<Button size="sm" onClick={() => setShowPayRunModal(true)}><Plus size={14} /> New Pay Run</Button>}
      />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Payroll" value={`$${(totalPayroll / 1000000).toFixed(1)}M`} change="All runs" changeType="neutral" icon={<Wallet size={20} />} />
        <StatCard label="Last Pay Run" value={lastRun ? `$${(lastRun.total_gross / 1000000).toFixed(2)}M` : '-'} change={lastRun?.period || 'No runs yet'} changeType="neutral" icon={<DollarSign size={20} />} />
        <StatCard label="Employees" value={lastRun?.employee_count || employees.length} change="On payroll" changeType="neutral" icon={<Users size={20} />} />
        <StatCard label="Deductions" value={`$${(totalDeductions / 1000).toFixed(0)}K`} change="Last run" changeType="neutral" icon={<FileText size={20} />} />
      </div>

      {/* AI Payroll Alerts */}
      {payrollInsights.length > 0 && (
        <AIAlertBanner insights={payrollInsights} className="mb-4" />
      )}

      {/* AI Annual Forecast */}
      {payrollRuns.length > 0 && (
        <div className="mb-6">
          <AIInsightCard insight={forecastInsight} compact />
        </div>
      )}

      <Card padding="none">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Pay Run History</CardTitle>
            <Button variant="secondary" size="sm">Export All</Button>
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-divider bg-canvas">
                <th className="tempo-th text-left px-6 py-3">Period</th>
                <th className="tempo-th text-right px-4 py-3">Gross</th>
                <th className="tempo-th text-right px-4 py-3">Deductions</th>
                <th className="tempo-th text-right px-4 py-3">Net</th>
                <th className="tempo-th text-right px-4 py-3">Employees</th>
                <th className="tempo-th text-center px-4 py-3">Status</th>
                <th className="tempo-th text-center px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {payrollRuns.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-sm text-t3">No pay runs yet. Click &quot;New Pay Run&quot; to create one.</td></tr>
              ) : payrollRuns.map(run => (
                <tr key={run.id} className="hover:bg-canvas/50">
                  <td className="px-6 py-3">
                    <p className="text-sm font-medium text-t1">{run.period}</p>
                    <p className="text-xs text-t3">Run: {new Date(run.run_date).toLocaleDateString()}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-t1 text-right font-medium">${run.total_gross.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-error text-right">-${run.total_deductions.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-t1 text-right font-semibold">${run.total_net.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-t2 text-right">{run.employee_count}</td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={run.status === 'paid' ? 'success' : run.status === 'approved' ? 'info' : run.status === 'draft' ? 'default' : 'warning'}>
                      {run.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex gap-1 justify-center">
                      <Button size="sm" variant="ghost">View</Button>
                      {run.status === 'draft' && (
                        <Button size="sm" variant="primary" onClick={() => processPayRun(run.id, run.status)}>Approve</Button>
                      )}
                      {run.status === 'approved' && (
                        <Button size="sm" variant="primary" onClick={() => processPayRun(run.id, run.status)}>Process</Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <Card>
          <h3 className="text-sm font-semibold text-t1 mb-4">Payroll by Country</h3>
          <div className="space-y-3">
            {[
              { country: 'Nigeria', amount: 1250000, pct: 50 },
              { country: 'Ghana', amount: 480000, pct: 19 },
              { country: "Cote d'Ivoire", amount: 380000, pct: 15 },
              { country: 'Kenya', amount: 250000, pct: 10 },
              { country: 'Senegal', amount: 120000, pct: 6 },
            ].map(item => (
              <div key={item.country}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-t1 font-medium">{item.country}</span>
                  <span className="text-t2">${(item.amount / 1000).toFixed(0)}K ({item.pct}%)</span>
                </div>
                <div className="w-full h-2 bg-canvas rounded-full overflow-hidden">
                  <div className="h-full bg-tempo-600 rounded-full" style={{ width: `${item.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <h3 className="text-sm font-semibold text-t1 mb-4">Tax Configuration</h3>
          <div className="space-y-2">
            {[
              { country: 'Nigeria', rate: '24%', type: 'PAYE + NHF + Pension' },
              { country: 'Ghana', rate: '25%', type: 'PAYE + SSNIT + Tier 2' },
              { country: "Cote d'Ivoire", rate: '22%', type: 'IRPP + CNPS' },
              { country: 'Kenya', rate: '30%', type: 'PAYE + NSSF + NHIF' },
              { country: 'Senegal', rate: '20%', type: 'IR + CSS' },
            ].map(item => (
              <div key={item.country} className="flex items-center justify-between bg-canvas rounded-lg px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-t1">{item.country}</p>
                  <p className="text-xs text-t3">{item.type}</p>
                </div>
                <Badge variant="default">{item.rate}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* New Pay Run Modal */}
      <Modal open={showPayRunModal} onClose={() => setShowPayRunModal(false)} title="Create New Pay Run">
        <div className="space-y-4">
          <Input label="Pay Period" value={payRunForm.period} onChange={(e) => setPayRunForm({ ...payRunForm, period: e.target.value })} placeholder="e.g. March 2026" />
          <Input label="Run Date" type="date" value={payRunForm.run_date} onChange={(e) => setPayRunForm({ ...payRunForm, run_date: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Total Gross" type="number" value={payRunForm.total_gross || ''} onChange={(e) => setPayRunForm({ ...payRunForm, total_gross: Number(e.target.value) })} placeholder="2450000" />
            <Input label="Total Deductions" type="number" value={payRunForm.total_deductions || ''} onChange={(e) => setPayRunForm({ ...payRunForm, total_deductions: Number(e.target.value) })} placeholder="Auto-calculated if empty" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Employee Count" type="number" value={payRunForm.employee_count} onChange={(e) => setPayRunForm({ ...payRunForm, employee_count: Number(e.target.value) })} />
            <Select label="Currency" value={payRunForm.currency} onChange={(e) => setPayRunForm({ ...payRunForm, currency: e.target.value })} options={[
              { value: 'USD', label: 'USD' },
              { value: 'NGN', label: 'NGN' },
              { value: 'GHS', label: 'GHS' },
              { value: 'XOF', label: 'XOF' },
              { value: 'KES', label: 'KES' },
            ]} />
          </div>
          <div className="bg-canvas rounded-lg p-3">
            <p className="text-xs text-t3">Net pay will be automatically calculated as Gross minus Deductions. If deductions are left empty, they will default to 23% of gross.</p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowPayRunModal(false)}>Cancel</Button>
            <Button onClick={submitPayRun}>Create Pay Run</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
