'use client'

import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
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
  const t = useTranslations('payroll')
  const tc = useTranslations('common')
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
    title: t('annualPayrollForecast'),
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
      <Header title={t('title')} subtitle={t('subtitle')}
        actions={<Button size="sm" onClick={() => setShowPayRunModal(true)}><Plus size={14} /> {t('newPayRun')}</Button>}
      />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label={t('totalPayroll')} value={`$${(totalPayroll / 1000000).toFixed(1)}M`} change={t('allRuns')} changeType="neutral" icon={<Wallet size={20} />} />
        <StatCard label={t('lastPayRun')} value={lastRun ? `$${(lastRun.total_gross / 1000000).toFixed(2)}M` : '-'} change={lastRun?.period || t('noRunsYet')} changeType="neutral" icon={<DollarSign size={20} />} />
        <StatCard label={tc('employees')} value={lastRun?.employee_count || employees.length} change={t('onPayroll')} changeType="neutral" icon={<Users size={20} />} />
        <StatCard label={t('deductions')} value={`$${(totalDeductions / 1000).toFixed(0)}K`} change={t('lastRun')} changeType="neutral" icon={<FileText size={20} />} />
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
            <CardTitle>{t('payRunHistory')}</CardTitle>
            <Button variant="secondary" size="sm">{tc('exportAll')}</Button>
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-divider bg-canvas">
                <th className="tempo-th text-left px-6 py-3">{t('tablePeriod')}</th>
                <th className="tempo-th text-right px-4 py-3">{t('tableGross')}</th>
                <th className="tempo-th text-right px-4 py-3">{t('tableDeductions')}</th>
                <th className="tempo-th text-right px-4 py-3">{t('tableNet')}</th>
                <th className="tempo-th text-right px-4 py-3">{t('tableEmployees')}</th>
                <th className="tempo-th text-center px-4 py-3">{tc('status')}</th>
                <th className="tempo-th text-center px-4 py-3">{tc('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {payrollRuns.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-sm text-t3">{t('noPayRuns')}</td></tr>
              ) : payrollRuns.map(run => (
                <tr key={run.id} className="hover:bg-canvas/50">
                  <td className="px-6 py-3">
                    <p className="text-sm font-medium text-t1">{run.period}</p>
                    <p className="text-xs text-t3">{t('run', { date: new Date(run.run_date).toLocaleDateString() })}</p>
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
                      <Button size="sm" variant="ghost">{tc('view')}</Button>
                      {run.status === 'draft' && (
                        <Button size="sm" variant="primary" onClick={() => processPayRun(run.id, run.status)}>{tc('approve')}</Button>
                      )}
                      {run.status === 'approved' && (
                        <Button size="sm" variant="primary" onClick={() => processPayRun(run.id, run.status)}>{tc('process')}</Button>
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
          <h3 className="text-sm font-semibold text-t1 mb-4">{t('payrollByCountry')}</h3>
          <div className="space-y-3">
            {(() => {
              // Calculate payroll distribution from employee countries
              const countryMap: Record<string, number> = {}
              employees.forEach(emp => {
                const country = emp.country || 'Other'
                countryMap[country] = (countryMap[country] || 0) + 1
              })
              const totalEmp = employees.length || 1
              // Estimate monthly cost per employee based on headcount proportion
              const totalMonthly = totalPayroll > 0 ? totalPayroll : 2480000
              return Object.entries(countryMap)
                .sort((a, b) => b[1] - a[1])
                .map(([country, count]) => {
                  const pct = Math.round((count / totalEmp) * 100)
                  const amount = Math.round((count / totalEmp) * totalMonthly)
                  return { country, amount, pct }
                })
            })().map(item => (
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
          <h3 className="text-sm font-semibold text-t1 mb-4">{t('taxConfiguration')}</h3>
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
      <Modal open={showPayRunModal} onClose={() => setShowPayRunModal(false)} title={t('createPayRunModal')}>
        <div className="space-y-4">
          <Input label={t('payPeriod')} value={payRunForm.period} onChange={(e) => setPayRunForm({ ...payRunForm, period: e.target.value })} placeholder={t('payPeriodPlaceholder')} />
          <Input label={t('runDate')} type="date" value={payRunForm.run_date} onChange={(e) => setPayRunForm({ ...payRunForm, run_date: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('totalGross')} type="number" value={payRunForm.total_gross || ''} onChange={(e) => setPayRunForm({ ...payRunForm, total_gross: Number(e.target.value) })} placeholder={t('totalGrossPlaceholder')} />
            <Input label={t('totalDeductions')} type="number" value={payRunForm.total_deductions || ''} onChange={(e) => setPayRunForm({ ...payRunForm, total_deductions: Number(e.target.value) })} placeholder={t('totalDeductionsPlaceholder')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('employeeCount')} type="number" value={payRunForm.employee_count} onChange={(e) => setPayRunForm({ ...payRunForm, employee_count: Number(e.target.value) })} />
            <Select label={tc('currency')} value={payRunForm.currency} onChange={(e) => setPayRunForm({ ...payRunForm, currency: e.target.value })} options={[
              { value: 'USD', label: tc('currencyUSD') },
              { value: 'NGN', label: tc('currencyNGN') },
              { value: 'GHS', label: tc('currencyGHS') },
              { value: 'XOF', label: tc('currencyXOF') },
              { value: 'KES', label: tc('currencyKES') },
            ]} />
          </div>
          <div className="bg-canvas rounded-lg p-3">
            <p className="text-xs text-t3">{t('netPayNote')}</p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowPayRunModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitPayRun}>{t('createPayRun')}</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
