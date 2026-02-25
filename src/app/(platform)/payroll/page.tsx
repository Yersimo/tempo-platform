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
import { MiniBarChart, MiniDonutChart, Sparkline } from '@/components/ui/mini-chart'
import { Wallet, DollarSign, Users, Plus, FileText, BarChart3, Shield, Briefcase, Settings, Search, Calculator, Calendar, AlertTriangle, CheckCircle2, Clock, ChevronDown, ChevronUp, Eye } from 'lucide-react'
import { useTempo } from '@/lib/store'
import { AIInsightCard, AIAlertBanner, AIScoreBadge, AIRecommendationList } from '@/components/ai'
import { detectPayrollAnomalies, forecastAnnualPayroll, scorePayrollHealth, recommendTaxOptimizations, analyzePayrollTrends, predictComplianceRisks, scoreContractorRisk } from '@/lib/ai-engine'
import { calculateTax } from '@/lib/tax-calculator'
import type { SupportedCountry } from '@/lib/tax-calculator'

export default function PayrollPage() {
  const t = useTranslations('payroll')
  const tc = useTranslations('common')
  const {
    payrollRuns, employees, addPayrollRun, updatePayrollRun,
    employeePayrollEntries, contractorPayments, payrollSchedules, taxConfigs, complianceIssues, taxFilings,
    addContractorPayment, updateContractorPayment, addPayrollSchedule, updatePayrollSchedule,
    addTaxConfig, updateTaxConfig, resolveComplianceIssue, updateTaxFiling, addEmployeePayrollEntry,
  } = useTempo()

  // ---- Tab State ----
  const tabs = [
    { id: 'pay-runs', label: t('payRuns'), icon: Wallet },
    { id: 'employee-payroll', label: t('employeePayroll'), icon: Users },
    { id: 'analytics', label: t('analytics'), icon: BarChart3 },
    { id: 'compliance', label: t('compliance'), icon: Shield },
    { id: 'contractors', label: t('contractors'), icon: Briefcase },
    { id: 'settings', label: t('payrollSettings'), icon: Settings },
  ]
  const [activeTab, setActiveTab] = useState('pay-runs')

  // ---- Modals ----
  const [showPayRunModal, setShowPayRunModal] = useState(false)
  const [showPayStubModal, setShowPayStubModal] = useState<string | null>(null)
  const [showContractorModal, setShowContractorModal] = useState(false)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false)
  const [showTaxConfigModal, setShowTaxConfigModal] = useState<string | null>(null)
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null)

  // ---- Forms ----
  const [payRunForm, setPayRunForm] = useState({ period: '', total_gross: 0, total_net: 0, total_deductions: 0, currency: 'USD', employee_count: 30, run_date: '' })
  const [contractorForm, setContractorForm] = useState({ contractor_name: '', company: '', service_type: '', invoice_number: '', amount: 0, currency: 'USD', due_date: '', payment_method: 'bank_transfer', tax_form: 'invoice', country: '' })
  const [scheduleForm, setScheduleForm] = useState({ name: '', frequency: 'monthly', next_run_date: '', employee_group: '', auto_approve: false, currency: 'USD' })
  const [adjustmentForm, setAdjustmentForm] = useState({ employee_id: '', type: 'bonus', amount: 0, reason: '' })
  const [searchQuery, setSearchQuery] = useState('')
  const [filterDept, setFilterDept] = useState('')
  const [filterCountry, setFilterCountry] = useState('')

  // ---- Tax Simulator ----
  const [simCountry, setSimCountry] = useState<SupportedCountry>('US')
  const [simSalary, setSimSalary] = useState(80000)
  const simResult = useMemo(() => {
    try { return calculateTax(simCountry, simSalary, { isAnnual: true }) } catch { return null }
  }, [simCountry, simSalary])

  // ---- Computed Data ----
  const totalPayroll = payrollRuns.reduce((a, r) => a + r.total_gross, 0)
  const lastRun = payrollRuns.length > 0 ? payrollRuns[payrollRuns.length - 1] : null
  const totalDeductions = lastRun ? lastRun.total_deductions : 0

  const payrollInsights = useMemo(() => detectPayrollAnomalies(payrollRuns), [payrollRuns])
  const forecast = useMemo(() => forecastAnnualPayroll(payrollRuns), [payrollRuns])
  const healthScore = useMemo(() => scorePayrollHealth(payrollRuns as any, complianceIssues as any, taxFilings as any), [payrollRuns, complianceIssues, taxFilings])
  const taxOpts = useMemo(() => recommendTaxOptimizations(taxConfigs as any, employees as any), [taxConfigs, employees])
  const trends = useMemo(() => analyzePayrollTrends(payrollRuns as any, employeePayrollEntries as any), [payrollRuns, employeePayrollEntries])
  const complianceRisks = useMemo(() => predictComplianceRisks(complianceIssues as any, taxFilings as any), [complianceIssues, taxFilings])
  const contractorRisk = useMemo(() => scoreContractorRisk(contractorPayments as any), [contractorPayments])

  const forecastInsight = useMemo(() => ({
    id: 'ai-payroll-forecast', category: 'prediction' as const, severity: 'info' as const,
    title: t('annualPayrollForecast'),
    description: `Projected annual payroll: $${(forecast.projected / 1000000).toFixed(2)}M based on ${payrollRuns.length} pay run(s). Confidence: ${forecast.confidence}.`,
    confidence: forecast.confidence, confidenceScore: forecast.confidence === 'high' ? 88 : forecast.confidence === 'medium' ? 65 : 40,
    suggestedAction: 'Review budget allocation for upcoming quarters', module: 'payroll',
  }), [forecast, payrollRuns.length, t])

  // Filtered employee entries
  const filteredEntries = useMemo(() => {
    let entries = [...employeePayrollEntries]
    if (searchQuery) entries = entries.filter(e => (e as any).employee_name?.toLowerCase().includes(searchQuery.toLowerCase()))
    if (filterDept) entries = entries.filter(e => (e as any).department === filterDept)
    if (filterCountry) entries = entries.filter(e => (e as any).country === filterCountry)
    return entries
  }, [employeePayrollEntries, searchQuery, filterDept, filterCountry])

  const departments = useMemo(() => [...new Set(employeePayrollEntries.map(e => (e as any).department).filter(Boolean))], [employeePayrollEntries])
  const countries = useMemo(() => [...new Set(employeePayrollEntries.map(e => (e as any).country).filter(Boolean))], [employeePayrollEntries])

  // ---- Handlers ----
  function submitPayRun() {
    if (!payRunForm.period || !payRunForm.run_date) return
    const gross = payRunForm.total_gross || 2450000
    const deductions = payRunForm.total_deductions || Math.round(gross * 0.23)
    addPayrollRun({ ...payRunForm, total_gross: gross, total_deductions: deductions, total_net: gross - deductions, status: 'draft', employee_count: payRunForm.employee_count || employees.length })
    setShowPayRunModal(false)
    setPayRunForm({ period: '', total_gross: 0, total_net: 0, total_deductions: 0, currency: 'USD', employee_count: 30, run_date: '' })
  }

  function processPayRun(runId: string, currentStatus: string) {
    const nextStatus = currentStatus === 'draft' ? 'approved' : currentStatus === 'approved' ? 'paid' : currentStatus
    updatePayrollRun(runId, { status: nextStatus })
  }

  function submitContractorPayment() {
    if (!contractorForm.contractor_name || !contractorForm.amount) return
    addContractorPayment({ ...contractorForm, status: 'pending', paid_date: null })
    setShowContractorModal(false)
    setContractorForm({ contractor_name: '', company: '', service_type: '', invoice_number: '', amount: 0, currency: 'USD', due_date: '', payment_method: 'bank_transfer', tax_form: 'invoice', country: '' })
  }

  function submitSchedule() {
    if (!scheduleForm.name || !scheduleForm.next_run_date) return
    addPayrollSchedule({ ...scheduleForm, status: 'active', last_run_date: null })
    setShowScheduleModal(false)
    setScheduleForm({ name: '', frequency: 'monthly', next_run_date: '', employee_group: '', auto_approve: false, currency: 'USD' })
  }

  const selectedStub = showPayStubModal ? employeePayrollEntries.find(e => e.id === showPayStubModal) : null

  return (
    <>
      <Header title={t('title')} subtitle={t('subtitle')}
        actions={<Button size="sm" onClick={() => setShowPayRunModal(true)}><Plus size={14} /> {t('newPayRun')}</Button>}
      />

      {/* Tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto border-b border-divider">
        {tabs.map(tab => {
          const Icon = tab.icon
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === tab.id ? 'border-tempo-600 text-tempo-600' : 'border-transparent text-t3 hover:text-t1 hover:border-border'}`}>
              <Icon size={16} /> {tab.label}
            </button>
          )
        })}
      </div>

      {/* ============================================================ */}
      {/* TAB 1: PAY RUNS */}
      {/* ============================================================ */}
      {activeTab === 'pay-runs' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard label={t('totalPayroll')} value={`$${(totalPayroll / 1000000).toFixed(1)}M`} change={t('allRuns')} changeType="neutral" icon={<Wallet size={20} />} />
            <StatCard label={t('lastPayRun')} value={lastRun ? `$${(lastRun.total_gross / 1000000).toFixed(2)}M` : '-'} change={lastRun?.period || t('noRunsYet')} changeType="neutral" icon={<DollarSign size={20} />} />
            <StatCard label={tc('employees')} value={lastRun?.employee_count || employees.length} change={t('onPayroll')} changeType="neutral" icon={<Users size={20} />} href="/people" />
            <StatCard label={t('deductions')} value={`$${(totalDeductions / 1000).toFixed(0)}K`} change={t('lastRun')} changeType="neutral" icon={<FileText size={20} />} />
          </div>

          {payrollInsights.length > 0 && <AIAlertBanner insights={payrollInsights} className="mb-4" />}
          {payrollRuns.length > 0 && <div className="mb-6"><AIInsightCard insight={forecastInsight} compact /></div>}

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
                  ) : payrollRuns.map(run => {
                    const runEntries = employeePayrollEntries.filter(e => (e as any).payroll_run_id === run.id)
                    const isExpanded = expandedRunId === run.id
                    return (
                      <tr key={run.id} className="hover:bg-canvas/50 cursor-pointer" onClick={() => setExpandedRunId(isExpanded ? null : run.id)}>
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-2">
                            {isExpanded ? <ChevronUp size={14} className="text-t3" /> : <ChevronDown size={14} className="text-t3" />}
                            <div>
                              <p className="text-sm font-medium text-t1">{run.period}</p>
                              <p className="text-xs text-t3">{t('run', { date: new Date(run.run_date).toLocaleDateString() })} · {runEntries.length} {t('employeeBreakdown').toLowerCase()}</p>
                            </div>
                          </div>
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
                        <td className="px-4 py-3 text-center" onClick={e => e.stopPropagation()}>
                          <div className="flex gap-1 justify-center">
                            {run.status === 'draft' && <Button size="sm" variant="primary" onClick={() => processPayRun(run.id, run.status)}>{tc('approve')}</Button>}
                            {run.status === 'approved' && <Button size="sm" variant="primary" onClick={() => processPayRun(run.id, run.status)}>{tc('process')}</Button>}
                            {run.status === 'paid' && <Button size="sm" variant="ghost">{t('generatePayStubs')}</Button>}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {/* Expanded Pay Run Detail */}
            {expandedRunId && (() => {
              const runEntries = employeePayrollEntries.filter(e => (e as any).payroll_run_id === expandedRunId)
              if (runEntries.length === 0) return null
              return (
                <div className="border-t border-divider bg-canvas/50 p-4">
                  <h4 className="text-sm font-semibold text-t1 mb-3">{t('employeeBreakdown')} ({runEntries.length})</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-divider">
                          <th className="text-left px-3 py-2 font-medium text-t3">{t('employeeName')}</th>
                          <th className="text-left px-3 py-2 font-medium text-t3">{t('department')}</th>
                          <th className="text-right px-3 py-2 font-medium text-t3">{t('grossPay')}</th>
                          <th className="text-right px-3 py-2 font-medium text-t3">{t('federalTax')}</th>
                          <th className="text-right px-3 py-2 font-medium text-t3">{t('pension')}</th>
                          <th className="text-right px-3 py-2 font-medium text-t3">{t('totalDeductionsLabel')}</th>
                          <th className="text-right px-3 py-2 font-medium text-t3">{t('netPay')}</th>
                          <th className="text-center px-3 py-2 font-medium text-t3">{t('payStub')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {runEntries.map(entry => {
                          const e = entry as any
                          return (
                            <tr key={e.id} className="hover:bg-white/50">
                              <td className="px-3 py-2 text-t1 font-medium">{e.employee_name}</td>
                              <td className="px-3 py-2 text-t2">{e.department}</td>
                              <td className="px-3 py-2 text-t1 text-right">${e.gross_pay?.toLocaleString()}</td>
                              <td className="px-3 py-2 text-t2 text-right">${e.federal_tax?.toLocaleString()}</td>
                              <td className="px-3 py-2 text-t2 text-right">${e.pension?.toLocaleString()}</td>
                              <td className="px-3 py-2 text-error text-right">-${e.total_deductions?.toLocaleString()}</td>
                              <td className="px-3 py-2 text-t1 text-right font-semibold">${e.net_pay?.toLocaleString()}</td>
                              <td className="px-3 py-2 text-center">
                                <Button size="sm" variant="ghost" onClick={() => setShowPayStubModal(e.id)}><Eye size={12} /></Button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            })()}
          </Card>
        </>
      )}

      {/* ============================================================ */}
      {/* TAB 2: EMPLOYEE PAYROLL */}
      {/* ============================================================ */}
      {activeTab === 'employee-payroll' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard label={t('totalLaborCost')} value={`$${(employeePayrollEntries.reduce((s, e) => s + ((e as any).gross_pay || 0), 0) / 1000).toFixed(0)}K`} change={t('lastRun')} changeType="neutral" icon={<DollarSign size={20} />} />
            <StatCard label={t('avgSalary')} value={`$${employeePayrollEntries.length > 0 ? (employeePayrollEntries.reduce((s, e) => s + ((e as any).gross_pay || 0), 0) / employeePayrollEntries.length / 1000).toFixed(1) : '0'}K`} change={t('monthOverMonth')} changeType="neutral" icon={<Users size={20} />} />
            <StatCard label={t('taxBurden')} value={`${employeePayrollEntries.length > 0 ? Math.round(employeePayrollEntries.reduce((s, e) => s + ((e as any).total_deductions || 0), 0) / employeePayrollEntries.reduce((s, e) => s + ((e as any).gross_pay || 0), 0) * 100) : 0}%`} change={t('allDepartments')} changeType="neutral" icon={<FileText size={20} />} />
            <StatCard label={tc('employees')} value={employeePayrollEntries.length} change={t('onPayroll')} changeType="neutral" icon={<Users size={20} />} />
          </div>

          {/* Search & Filters */}
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-t3" />
              <input className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-lg bg-surface text-t1 focus:outline-none focus:ring-2 focus:ring-tempo-500/30"
                placeholder={t('searchEmployees')} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>
            <select className="px-3 py-2 text-sm border border-border rounded-lg bg-surface text-t1" value={filterDept} onChange={e => setFilterDept(e.target.value)}>
              <option value="">{t('allDepartments')}</option>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <select className="px-3 py-2 text-sm border border-border rounded-lg bg-surface text-t1" value={filterCountry} onChange={e => setFilterCountry(e.target.value)}>
              <option value="">{t('allCountries')}</option>
              {countries.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <Button size="sm" onClick={() => setShowAdjustmentModal(true)}><Plus size={14} /> {t('addAdjustment')}</Button>
          </div>

          <Card padding="none">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-divider bg-canvas">
                    <th className="tempo-th text-left px-6 py-3">{t('employeeName')}</th>
                    <th className="tempo-th text-left px-4 py-3">{t('department')}</th>
                    <th className="tempo-th text-left px-4 py-3">{t('country')}</th>
                    <th className="tempo-th text-right px-4 py-3">{t('grossPay')}</th>
                    <th className="tempo-th text-right px-4 py-3">{t('totalDeductionsLabel')}</th>
                    <th className="tempo-th text-right px-4 py-3">{t('netPay')}</th>
                    <th className="tempo-th text-center px-4 py-3">{t('payStub')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredEntries.length === 0 ? (
                    <tr><td colSpan={7} className="px-6 py-12 text-center text-sm text-t3">{t('noEntries')}</td></tr>
                  ) : filteredEntries.map(entry => {
                    const e = entry as any
                    return (
                      <tr key={e.id} className="hover:bg-canvas/50">
                        <td className="px-6 py-3">
                          <p className="text-sm font-medium text-t1">{e.employee_name}</p>
                          <p className="text-xs text-t3">{e.employee_id}</p>
                        </td>
                        <td className="px-4 py-3 text-sm text-t2">{e.department}</td>
                        <td className="px-4 py-3 text-sm text-t2">{e.country}</td>
                        <td className="px-4 py-3 text-sm text-t1 text-right font-medium">${e.gross_pay?.toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm text-error text-right">-${e.total_deductions?.toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm text-t1 text-right font-semibold">${e.net_pay?.toLocaleString()}</td>
                        <td className="px-4 py-3 text-center">
                          <Button size="sm" variant="ghost" onClick={() => setShowPayStubModal(e.id)}>{t('viewStub')}</Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {/* ============================================================ */}
      {/* TAB 3: ANALYTICS */}
      {/* ============================================================ */}
      {activeTab === 'analytics' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard label={t('totalLaborCost')} value={`$${(totalPayroll / 1000000).toFixed(2)}M`} change={t('allRuns')} changeType="neutral" icon={<DollarSign size={20} />} />
            <StatCard label={t('avgSalary')} value={`$${employeePayrollEntries.length > 0 ? (employeePayrollEntries.reduce((s, e) => s + ((e as any).gross_pay || 0), 0) / employeePayrollEntries.length / 1000).toFixed(1) : '0'}K`} change={t('monthOverMonth')} changeType="neutral" icon={<Users size={20} />} />
            <StatCard label={t('taxBurden')} value={`${employeePayrollEntries.length > 0 ? Math.round(employeePayrollEntries.reduce((s, e) => s + ((e as any).total_deductions || 0), 0) / Math.max(1, employeePayrollEntries.reduce((s, e) => s + ((e as any).gross_pay || 0), 0)) * 100) : 0}%`} change={t('allDepartments')} changeType="neutral" icon={<FileText size={20} />} />
            <StatCard label={t('monthOverMonth')} value={`${trends.monthOverMonth > 0 ? '+' : ''}${trends.monthOverMonth}%`} change={payrollRuns.length >= 2 ? `${payrollRuns.length} ${t('payRuns').toLowerCase()}` : ''} changeType={trends.monthOverMonth > 3 ? 'negative' : trends.monthOverMonth < 0 ? 'positive' : 'neutral'} icon={<BarChart3 size={20} />} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Cost by Department */}
            <Card>
              <h3 className="text-sm font-semibold text-t1 mb-4">{t('costByDepartment')}</h3>
              {trends.departmentTrends.length > 0 ? (
                <MiniBarChart data={trends.departmentTrends.slice(0, 6).map(d => ({
                  label: d.department.length > 10 ? d.department.substring(0, 10) + '…' : d.department,
                  value: Math.round(d.totalCost / 1000),
                }))} showLabels height={140} />
              ) : <p className="text-sm text-t3">{t('noEntries')}</p>}
              {trends.departmentTrends.length > 0 && (
                <div className="mt-3 space-y-1">
                  {trends.departmentTrends.map(d => (
                    <div key={d.department} className="flex justify-between text-xs">
                      <span className="text-t2">{d.department}</span>
                      <span className="text-t1 font-medium">${(d.totalCost / 1000).toFixed(0)}K · {d.headcount} {t('headcount').toLowerCase()}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Cost by Country */}
            <Card>
              <h3 className="text-sm font-semibold text-t1 mb-4">{t('costByCountry')}</h3>
              {(() => {
                const countryMap: Record<string, { total: number; count: number }> = {}
                employeePayrollEntries.forEach(e => {
                  const c = (e as any).country || 'Other'
                  if (!countryMap[c]) countryMap[c] = { total: 0, count: 0 }
                  countryMap[c].total += (e as any).gross_pay || 0
                  countryMap[c].count += 1
                })
                const items = Object.entries(countryMap).sort((a, b) => b[1].total - a[1].total)
                const colors = ['bg-tempo-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500']
                return items.length > 0 ? (
                  <>
                    <MiniDonutChart data={items.map(([label, d], i) => ({ label, value: Math.round(d.total / 1000), color: colors[i % colors.length] }))} />
                    <div className="mt-3 space-y-1">
                      {items.map(([c, d]) => (
                        <div key={c} className="flex justify-between text-xs">
                          <span className="text-t2">{c}</span>
                          <span className="text-t1 font-medium">${(d.total / 1000).toFixed(0)}K · {d.count} employees</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : <p className="text-sm text-t3">{t('noEntries')}</p>
              })()}
            </Card>
          </div>

          {/* Payroll Cost Trend */}
          {payrollRuns.length > 0 && (
            <Card className="mb-6">
              <h3 className="text-sm font-semibold text-t1 mb-4">{t('laborCostTrend')}</h3>
              <Sparkline data={payrollRuns.map(r => r.total_gross / 1000)} />
              <div className="flex gap-4 mt-3 text-xs text-t3">
                {payrollRuns.map(r => <span key={r.id}>{r.period}</span>)}
              </div>
            </Card>
          )}

          {/* AI Insights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {trends.projections.map(p => <AIInsightCard key={p.id} insight={p} compact />)}
            {taxOpts.recommendations.length > 0 && (
              <Card>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-t1">{t('taxOptimizations')}</h3>
                  <Badge variant="success">{t('estimatedSavings')}: ${(taxOpts.estimatedSavings / 1000).toFixed(0)}K</Badge>
                </div>
                <AIRecommendationList recommendations={taxOpts.recommendations} />
              </Card>
            )}
          </div>
        </>
      )}

      {/* ============================================================ */}
      {/* TAB 4: COMPLIANCE */}
      {/* ============================================================ */}
      {activeTab === 'compliance' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="col-span-1">
              <Card className="text-center py-4">
                <p className="text-xs text-t3 mb-2">{t('complianceScore')}</p>
                <AIScoreBadge score={healthScore} size="lg" showBreakdown />
              </Card>
            </div>
            <StatCard label={t('openIssues')} value={complianceIssues.filter(i => (i as any).status !== 'resolved').length} change={`${complianceIssues.filter(i => (i as any).severity === 'critical' && (i as any).status !== 'resolved').length} ${t('critical').toLowerCase()}`} changeType={complianceIssues.filter(i => (i as any).severity === 'critical' && (i as any).status !== 'resolved').length > 0 ? 'negative' : 'positive'} icon={<AlertTriangle size={20} />} />
            <StatCard label={t('urgentItems')} value={complianceRisks.urgentCount} change={complianceRisks.nextDeadline ? `${t('nextDeadline')}: ${complianceRisks.nextDeadline}` : ''} changeType={complianceRisks.urgentCount > 0 ? 'negative' : 'positive'} icon={<Clock size={20} />} />
            <StatCard label={t('taxFilings')} value={`${taxFilings.filter(f => (f as any).status === 'filed').length}/${taxFilings.length}`} change={`${taxFilings.filter(f => (f as any).status === 'overdue').length} ${t('overdue').toLowerCase()}`} changeType={taxFilings.filter(f => (f as any).status === 'overdue').length > 0 ? 'negative' : 'neutral'} icon={<FileText size={20} />} />
          </div>

          {/* Compliance Issues */}
          <Card padding="none" className="mb-6">
            <CardHeader><CardTitle>{t('complianceIssues')}</CardTitle></CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-divider bg-canvas">
                    <th className="tempo-th text-left px-6 py-3">{t('severity')}</th>
                    <th className="tempo-th text-left px-4 py-3">{t('complianceType')}</th>
                    <th className="tempo-th text-left px-4 py-3">{t('country')}</th>
                    <th className="tempo-th text-left px-4 py-3">{t('description')}</th>
                    <th className="tempo-th text-center px-4 py-3">{t('filingDeadline')}</th>
                    <th className="tempo-th text-center px-4 py-3">{tc('status')}</th>
                    <th className="tempo-th text-center px-4 py-3">{tc('actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {complianceIssues.filter(i => (i as any).status !== 'resolved').length === 0 ? (
                    <tr><td colSpan={7} className="px-6 py-12 text-center text-sm text-t3"><CheckCircle2 className="inline mr-2" size={16} />{t('noComplianceIssues')}</td></tr>
                  ) : complianceIssues.filter(i => (i as any).status !== 'resolved').map(issue => {
                    const ci = issue as any
                    return (
                      <tr key={ci.id} className="hover:bg-canvas/50">
                        <td className="px-6 py-3"><Badge variant={ci.severity === 'critical' ? 'error' : ci.severity === 'warning' ? 'warning' : 'info'}>{ci.severity}</Badge></td>
                        <td className="px-4 py-3 text-sm text-t1">{ci.type?.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}</td>
                        <td className="px-4 py-3 text-sm text-t2">{ci.country}</td>
                        <td className="px-4 py-3 text-sm text-t2 max-w-xs truncate">{ci.description}</td>
                        <td className="px-4 py-3 text-sm text-t2 text-center">{ci.deadline}</td>
                        <td className="px-4 py-3 text-center"><Badge variant={ci.status === 'open' ? 'warning' : 'info'}>{ci.status}</Badge></td>
                        <td className="px-4 py-3 text-center">
                          <Button size="sm" variant="ghost" onClick={() => resolveComplianceIssue(ci.id)}>{t('resolveIssue')}</Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Tax Filings */}
          <Card padding="none" className="mb-6">
            <CardHeader><CardTitle>{t('taxFilings')}</CardTitle></CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-divider bg-canvas">
                    <th className="tempo-th text-left px-6 py-3">{t('formName')}</th>
                    <th className="tempo-th text-left px-4 py-3">{t('country')}</th>
                    <th className="tempo-th text-left px-4 py-3">{t('filingPeriod')}</th>
                    <th className="tempo-th text-center px-4 py-3">{t('filingFrequency')}</th>
                    <th className="tempo-th text-center px-4 py-3">{t('filingDeadline')}</th>
                    <th className="tempo-th text-center px-4 py-3">{tc('status')}</th>
                    <th className="tempo-th text-center px-4 py-3">{tc('actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {taxFilings.map(filing => {
                    const tf = filing as any
                    return (
                      <tr key={tf.id} className="hover:bg-canvas/50">
                        <td className="px-6 py-3">
                          <p className="text-sm font-medium text-t1">{tf.form_name}</p>
                          <p className="text-xs text-t3">{tf.description}</p>
                        </td>
                        <td className="px-4 py-3 text-sm text-t2">{tf.country}</td>
                        <td className="px-4 py-3 text-sm text-t2">{tf.filing_period}</td>
                        <td className="px-4 py-3 text-sm text-t2 text-center capitalize">{tf.frequency}</td>
                        <td className="px-4 py-3 text-sm text-t2 text-center">{tf.deadline}</td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant={tf.status === 'filed' ? 'success' : tf.status === 'overdue' ? 'error' : 'warning'}>{tf.status}</Badge>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {tf.status !== 'filed' && (
                            <Button size="sm" variant="ghost" onClick={() => updateTaxFiling(tf.id, { status: 'filed', filed_date: new Date().toISOString().split('T')[0] })}>{t('markFiled')}</Button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* AI Compliance Risks */}
          {complianceRisks.risks.length > 0 && (
            <Card>
              <h3 className="text-sm font-semibold text-t1 mb-3">{t('complianceRisks')}</h3>
              <div className="space-y-2">
                {complianceRisks.risks.map(risk => <AIInsightCard key={risk.id} insight={risk} compact />)}
              </div>
            </Card>
          )}
        </>
      )}

      {/* ============================================================ */}
      {/* TAB 5: CONTRACTORS */}
      {/* ============================================================ */}
      {activeTab === 'contractors' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard label={t('totalContractors')} value={contractorPayments.length} change={t('allCountries')} changeType="neutral" icon={<Briefcase size={20} />} />
            <StatCard label={t('pendingPayments')} value={contractorPayments.filter(cp => (cp as any).status === 'pending' || (cp as any).status === 'approved').length} change={`$${(contractorPayments.filter(cp => (cp as any).status !== 'paid').reduce((s, cp) => s + ((cp as any).amount || 0), 0) / 1000).toFixed(0)}K`} changeType="neutral" icon={<Clock size={20} />} />
            <StatCard label={t('totalPaidThisMonth')} value={`$${(contractorPayments.filter(cp => (cp as any).status === 'paid').reduce((s, cp) => s + ((cp as any).amount || 0), 0) / 1000).toFixed(0)}K`} change={t('lastRun')} changeType="neutral" icon={<DollarSign size={20} />} />
            <Card className="text-center py-3">
              <p className="text-xs text-t3 mb-1">{t('contractorRiskScore')}</p>
              <p className={`text-2xl font-bold ${contractorRisk.riskScore > 50 ? 'text-error' : contractorRisk.riskScore > 30 ? 'text-amber-500' : 'text-emerald-500'}`}>{contractorRisk.riskScore}/100</p>
              <p className="text-xs text-t3">{contractorRisk.riskScore > 50 ? t('critical') : contractorRisk.riskScore > 30 ? t('warning') : t('info')}</p>
            </Card>
          </div>

          {/* Misclassification flags */}
          {contractorRisk.misclassificationFlags.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
              <h4 className="text-sm font-semibold text-amber-800 mb-2"><AlertTriangle size={14} className="inline mr-1" />{t('misclassificationRisk')}</h4>
              <ul className="text-xs text-amber-700 space-y-1">
                {contractorRisk.misclassificationFlags.map((f, i) => <li key={i}>• {f}</li>)}
              </ul>
            </div>
          )}

          <Card padding="none" className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t('contractorPayments')}</CardTitle>
                <Button size="sm" onClick={() => setShowContractorModal(true)}><Plus size={14} /> {t('addPayment')}</Button>
              </div>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-divider bg-canvas">
                    <th className="tempo-th text-left px-6 py-3">{t('contractorName')}</th>
                    <th className="tempo-th text-left px-4 py-3">{t('serviceType')}</th>
                    <th className="tempo-th text-left px-4 py-3">{t('invoiceNumber')}</th>
                    <th className="tempo-th text-right px-4 py-3">{t('amount')}</th>
                    <th className="tempo-th text-center px-4 py-3">{t('dueDate')}</th>
                    <th className="tempo-th text-center px-4 py-3">{t('taxForm')}</th>
                    <th className="tempo-th text-center px-4 py-3">{tc('status')}</th>
                    <th className="tempo-th text-center px-4 py-3">{tc('actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {contractorPayments.length === 0 ? (
                    <tr><td colSpan={8} className="px-6 py-12 text-center text-sm text-t3">{t('noContractorPayments')}</td></tr>
                  ) : contractorPayments.map(payment => {
                    const cp = payment as any
                    return (
                      <tr key={cp.id} className="hover:bg-canvas/50">
                        <td className="px-6 py-3">
                          <p className="text-sm font-medium text-t1">{cp.contractor_name}</p>
                          <p className="text-xs text-t3">{cp.company} · {cp.country}</p>
                        </td>
                        <td className="px-4 py-3 text-sm text-t2">{cp.service_type}</td>
                        <td className="px-4 py-3 text-sm text-t2 font-mono">{cp.invoice_number}</td>
                        <td className="px-4 py-3 text-sm text-t1 text-right font-medium">${cp.amount?.toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm text-t2 text-center">{cp.due_date}</td>
                        <td className="px-4 py-3 text-center"><Badge variant="default">{cp.tax_form}</Badge></td>
                        <td className="px-4 py-3 text-center"><Badge variant={cp.status === 'paid' ? 'success' : cp.status === 'approved' ? 'info' : 'warning'}>{cp.status}</Badge></td>
                        <td className="px-4 py-3 text-center">
                          {cp.status === 'pending' && <Button size="sm" variant="ghost" onClick={() => updateContractorPayment(cp.id, { status: 'approved' })}>{t('approvePayment')}</Button>}
                          {cp.status === 'approved' && <Button size="sm" variant="ghost" onClick={() => updateContractorPayment(cp.id, { status: 'paid', paid_date: new Date().toISOString().split('T')[0] })}>{t('markPaid')}</Button>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* AI Recommendations */}
          {contractorRisk.recommendations.length > 0 && (
            <Card>
              <h3 className="text-sm font-semibold text-t1 mb-3">{t('recommendations')}</h3>
              <AIRecommendationList recommendations={contractorRisk.recommendations} />
            </Card>
          )}
        </>
      )}

      {/* ============================================================ */}
      {/* TAB 6: SETTINGS */}
      {/* ============================================================ */}
      {activeTab === 'settings' && (
        <>
          {/* Payroll Schedules */}
          <Card padding="none" className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t('payrollSchedules')}</CardTitle>
                <Button size="sm" onClick={() => setShowScheduleModal(true)}><Plus size={14} /> {t('createSchedule')}</Button>
              </div>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-divider bg-canvas">
                    <th className="tempo-th text-left px-6 py-3">{t('scheduleName')}</th>
                    <th className="tempo-th text-center px-4 py-3">{t('frequency')}</th>
                    <th className="tempo-th text-left px-4 py-3">{t('employeeGroup')}</th>
                    <th className="tempo-th text-center px-4 py-3">{t('nextRun')}</th>
                    <th className="tempo-th text-center px-4 py-3">{t('lastRunDate')}</th>
                    <th className="tempo-th text-center px-4 py-3">{t('autoApprove')}</th>
                    <th className="tempo-th text-center px-4 py-3">{t('scheduleStatus')}</th>
                    <th className="tempo-th text-center px-4 py-3">{tc('actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {payrollSchedules.length === 0 ? (
                    <tr><td colSpan={8} className="px-6 py-12 text-center text-sm text-t3">{t('noSchedules')}</td></tr>
                  ) : payrollSchedules.map(schedule => {
                    const ps = schedule as any
                    return (
                      <tr key={ps.id} className="hover:bg-canvas/50">
                        <td className="px-6 py-3 text-sm font-medium text-t1">{ps.name}</td>
                        <td className="px-4 py-3 text-sm text-t2 text-center capitalize">{ps.frequency === 'biweekly' ? t('biweekly') : ps.frequency === 'semi_monthly' ? t('semiMonthly') : t(ps.frequency)}</td>
                        <td className="px-4 py-3 text-sm text-t2">{ps.employee_group}</td>
                        <td className="px-4 py-3 text-sm text-t2 text-center">{ps.next_run_date}</td>
                        <td className="px-4 py-3 text-sm text-t2 text-center">{ps.last_run_date || '-'}</td>
                        <td className="px-4 py-3 text-center">{ps.auto_approve ? <CheckCircle2 size={16} className="inline text-emerald-500" /> : <span className="text-t3">-</span>}</td>
                        <td className="px-4 py-3 text-center"><Badge variant={ps.status === 'active' ? 'success' : 'default'}>{ps.status === 'active' ? t('active') : t('paused')}</Badge></td>
                        <td className="px-4 py-3 text-center">
                          <Button size="sm" variant="ghost" onClick={() => updatePayrollSchedule(ps.id, { status: ps.status === 'active' ? 'paused' : 'active' })}>
                            {ps.status === 'active' ? t('paused') : t('active')}
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Tax Configuration */}
          <Card padding="none" className="mb-6">
            <CardHeader><CardTitle>{t('taxConfiguration')}</CardTitle></CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-divider bg-canvas">
                    <th className="tempo-th text-left px-6 py-3">{t('country')}</th>
                    <th className="tempo-th text-left px-4 py-3">{t('description')}</th>
                    <th className="tempo-th text-center px-4 py-3">{t('taxRate')}</th>
                    <th className="tempo-th text-center px-4 py-3">{t('employerContribution')}</th>
                    <th className="tempo-th text-center px-4 py-3">{t('employeeContribution')}</th>
                    <th className="tempo-th text-center px-4 py-3">{t('effectiveDate')}</th>
                    <th className="tempo-th text-center px-4 py-3">{tc('status')}</th>
                    <th className="tempo-th text-center px-4 py-3">{tc('actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {taxConfigs.map(config => {
                    const tc2 = config as any
                    return (
                      <tr key={tc2.id} className="hover:bg-canvas/50">
                        <td className="px-6 py-3">
                          <p className="text-sm font-medium text-t1">{tc2.country}</p>
                          <p className="text-xs text-t3">{tc2.tax_type}</p>
                        </td>
                        <td className="px-4 py-3 text-sm text-t2 max-w-xs truncate">{tc2.description}</td>
                        <td className="px-4 py-3 text-sm text-t1 text-center font-semibold">{tc2.rate}%</td>
                        <td className="px-4 py-3 text-sm text-t2 text-center">{tc2.employer_contribution}%</td>
                        <td className="px-4 py-3 text-sm text-t2 text-center">{tc2.employee_contribution}%</td>
                        <td className="px-4 py-3 text-sm text-t2 text-center">{tc2.effective_date}</td>
                        <td className="px-4 py-3 text-center"><Badge variant={tc2.status === 'active' ? 'success' : 'warning'}>{tc2.status}</Badge></td>
                        <td className="px-4 py-3 text-center">
                          <Button size="sm" variant="ghost" onClick={() => setShowTaxConfigModal(tc2.id)}>{t('edit')}</Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Tax Simulator */}
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Calculator size={18} className="text-tempo-600" />
              <h3 className="text-sm font-semibold text-t1">{t('taxSimulator')}</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium text-t2 mb-1 block">{t('selectCountry')}</label>
                <select className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-surface text-t1" value={simCountry} onChange={e => setSimCountry(e.target.value as SupportedCountry)}>
                  {(['US', 'UK', 'DE', 'FR', 'CA', 'AU'] as const).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-t2 mb-1 block">{t('enterGrossSalary')}</label>
                <input className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-surface text-t1" type="number" value={simSalary} onChange={e => setSimSalary(Number(e.target.value))} />
              </div>
              <div className="flex items-end">
                <Button size="sm" onClick={() => {}}><Calculator size={14} /> {t('simulateTax')}</Button>
              </div>
            </div>
            {simResult && (
              <div className="mt-4 bg-canvas rounded-lg p-4">
                <h4 className="text-sm font-semibold text-t1 mb-3">{t('simulationResult')} — {simCountry}</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: t('grossPay'), value: `$${simResult.grossSalary.toLocaleString()}`, color: 'text-t1' },
                    { label: t('federalTax'), value: `-$${simResult.federalTax.toLocaleString()}`, color: 'text-error' },
                    { label: t('socialSecurity'), value: `-$${simResult.socialSecurity.toLocaleString()}`, color: 'text-error' },
                    { label: t('medicare'), value: `-$${simResult.medicare.toLocaleString()}`, color: 'text-error' },
                    { label: t('pension'), value: `-$${simResult.pension.toLocaleString()}`, color: 'text-error' },
                    { label: t('stateTax'), value: `-$${simResult.stateOrProvincialTax.toLocaleString()}`, color: 'text-error' },
                    { label: t('totalDeductionsLabel'), value: `-$${simResult.totalTax.toLocaleString()}`, color: 'text-error font-semibold' },
                    { label: t('netPay'), value: `$${simResult.netPay.toLocaleString()}`, color: 'text-emerald-600 font-bold' },
                  ].map(item => (
                    <div key={item.label} className="bg-white rounded-lg p-3 border border-border">
                      <p className="text-xs text-t3 mb-1">{item.label}</p>
                      <p className={`text-sm ${item.color}`}>{item.value}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-t3 mt-3">Effective tax rate: {simResult.effectiveTaxRate.toFixed(1)}%</p>
              </div>
            )}
          </Card>
        </>
      )}

      {/* ============================================================ */}
      {/* MODALS */}
      {/* ============================================================ */}

      {/* New Pay Run Modal */}
      <Modal open={showPayRunModal} onClose={() => setShowPayRunModal(false)} title={t('createPayRunModal')}>
        <div className="space-y-4">
          <Input label={t('payPeriod')} value={payRunForm.period} onChange={e => setPayRunForm({ ...payRunForm, period: e.target.value })} placeholder={t('payPeriodPlaceholder')} />
          <Input label={t('runDate')} type="date" value={payRunForm.run_date} onChange={e => setPayRunForm({ ...payRunForm, run_date: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('totalGross')} type="number" value={payRunForm.total_gross || ''} onChange={e => setPayRunForm({ ...payRunForm, total_gross: Number(e.target.value) })} placeholder={t('totalGrossPlaceholder')} />
            <Input label={t('totalDeductions')} type="number" value={payRunForm.total_deductions || ''} onChange={e => setPayRunForm({ ...payRunForm, total_deductions: Number(e.target.value) })} placeholder={t('totalDeductionsPlaceholder')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('employeeCount')} type="number" value={payRunForm.employee_count} onChange={e => setPayRunForm({ ...payRunForm, employee_count: Number(e.target.value) })} />
            <Select label={tc('currency')} value={payRunForm.currency} onChange={e => setPayRunForm({ ...payRunForm, currency: e.target.value })} options={[
              { value: 'USD', label: tc('currencyUSD') }, { value: 'NGN', label: tc('currencyNGN') }, { value: 'GHS', label: tc('currencyGHS') }, { value: 'XOF', label: tc('currencyXOF') }, { value: 'KES', label: tc('currencyKES') },
            ]} />
          </div>
          <div className="bg-canvas rounded-lg p-3"><p className="text-xs text-t3">{t('netPayNote')}</p></div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowPayRunModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitPayRun}>{t('createPayRun')}</Button>
          </div>
        </div>
      </Modal>

      {/* Pay Stub Preview Modal */}
      <Modal open={!!showPayStubModal} onClose={() => setShowPayStubModal(null)} title={t('payStubPreview')}>
        {selectedStub && (() => {
          const s = selectedStub as any
          return (
            <div className="space-y-4">
              <div className="bg-canvas rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-sm font-semibold text-t1">{s.employee_name}</p>
                    <p className="text-xs text-t3">{s.department} · {s.country}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-t3">{t('payDate')}</p>
                    <p className="text-sm font-medium text-t1">{s.pay_date}</p>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-t2 uppercase mb-2">{t('earnings')}</h4>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm"><span className="text-t2">{t('baseSalary')}</span><span className="text-t1">${s.gross_pay?.toLocaleString()}</span></div>
                  {s.bonus > 0 && <div className="flex justify-between text-sm"><span className="text-t2">{t('bonus')}</span><span className="text-t1">${s.bonus?.toLocaleString()}</span></div>}
                  {s.overtime > 0 && <div className="flex justify-between text-sm"><span className="text-t2">{t('overtime')}</span><span className="text-t1">${s.overtime?.toLocaleString()}</span></div>}
                  <div className="flex justify-between text-sm font-semibold border-t border-divider pt-1"><span className="text-t1">{t('grossPay')}</span><span className="text-t1">${s.gross_pay?.toLocaleString()}</span></div>
                </div>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-t2 uppercase mb-2">{t('deductions')}</h4>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm"><span className="text-t2">{t('federalTax')}</span><span className="text-error">-${s.federal_tax?.toLocaleString()}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-t2">{t('stateTax')}</span><span className="text-error">-${s.state_tax?.toLocaleString()}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-t2">{t('socialSecurity')}</span><span className="text-error">-${s.social_security?.toLocaleString()}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-t2">{t('medicare')}</span><span className="text-error">-${s.medicare?.toLocaleString()}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-t2">{t('pension')}</span><span className="text-error">-${s.pension?.toLocaleString()}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-t2">{t('healthInsurance')}</span><span className="text-error">-${s.health_insurance?.toLocaleString()}</span></div>
                  <div className="flex justify-between text-sm font-semibold border-t border-divider pt-1"><span className="text-t1">{t('totalDeductionsLabel')}</span><span className="text-error">-${s.total_deductions?.toLocaleString()}</span></div>
                </div>
              </div>
              <div className="bg-tempo-50 rounded-lg p-4 flex justify-between items-center">
                <span className="text-sm font-semibold text-t1">{t('netPay')}</span>
                <span className="text-xl font-bold text-tempo-700">${s.net_pay?.toLocaleString()}</span>
              </div>
            </div>
          )
        })()}
      </Modal>

      {/* Add Contractor Payment Modal */}
      <Modal open={showContractorModal} onClose={() => setShowContractorModal(false)} title={t('addPayment')}>
        <div className="space-y-4">
          <Input label={t('contractorName')} value={contractorForm.contractor_name} onChange={e => setContractorForm({ ...contractorForm, contractor_name: e.target.value })} />
          <Input label={t('company')} value={contractorForm.company} onChange={e => setContractorForm({ ...contractorForm, company: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('serviceType')} value={contractorForm.service_type} onChange={e => setContractorForm({ ...contractorForm, service_type: e.target.value })} />
            <Input label={t('invoiceNumber')} value={contractorForm.invoice_number} onChange={e => setContractorForm({ ...contractorForm, invoice_number: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('amount')} type="number" value={contractorForm.amount || ''} onChange={e => setContractorForm({ ...contractorForm, amount: Number(e.target.value) })} />
            <Input label={t('dueDate')} type="date" value={contractorForm.due_date} onChange={e => setContractorForm({ ...contractorForm, due_date: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select label={t('paymentMethod')} value={contractorForm.payment_method} onChange={e => setContractorForm({ ...contractorForm, payment_method: e.target.value })} options={[
              { value: 'bank_transfer', label: t('bankTransfer') }, { value: 'wire_transfer', label: t('wireTransfer') },
            ]} />
            <Input label={t('country')} value={contractorForm.country} onChange={e => setContractorForm({ ...contractorForm, country: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowContractorModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitContractorPayment}>{t('addPayment')}</Button>
          </div>
        </div>
      </Modal>

      {/* Create Schedule Modal */}
      <Modal open={showScheduleModal} onClose={() => setShowScheduleModal(false)} title={t('createSchedule')}>
        <div className="space-y-4">
          <Input label={t('scheduleName')} value={scheduleForm.name} onChange={e => setScheduleForm({ ...scheduleForm, name: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Select label={t('frequency')} value={scheduleForm.frequency} onChange={e => setScheduleForm({ ...scheduleForm, frequency: e.target.value })} options={[
              { value: 'weekly', label: t('weekly') }, { value: 'biweekly', label: t('biweekly') }, { value: 'semi_monthly', label: t('semiMonthly') }, { value: 'monthly', label: t('monthly') },
            ]} />
            <Input label={t('nextRun')} type="date" value={scheduleForm.next_run_date} onChange={e => setScheduleForm({ ...scheduleForm, next_run_date: e.target.value })} />
          </div>
          <Input label={t('employeeGroup')} value={scheduleForm.employee_group} onChange={e => setScheduleForm({ ...scheduleForm, employee_group: e.target.value })} placeholder="e.g. All Employees" />
          <label className="flex items-center gap-2 text-sm text-t1">
            <input type="checkbox" checked={scheduleForm.auto_approve} onChange={e => setScheduleForm({ ...scheduleForm, auto_approve: e.target.checked })} className="rounded border-border" />
            {t('autoApprove')}
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowScheduleModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitSchedule}>{t('createSchedule')}</Button>
          </div>
        </div>
      </Modal>

      {/* Add Adjustment Modal */}
      <Modal open={showAdjustmentModal} onClose={() => setShowAdjustmentModal(false)} title={t('addAdjustment')}>
        <div className="space-y-4">
          <Select label={t('adjustmentType')} value={adjustmentForm.type} onChange={e => setAdjustmentForm({ ...adjustmentForm, type: e.target.value })} options={[
            { value: 'bonus', label: t('bonus') }, { value: 'overtime', label: t('overtime') }, { value: 'deduction', label: t('oneTimeDeduction') },
          ]} />
          <Select label={t('employeeName')} value={adjustmentForm.employee_id} onChange={e => setAdjustmentForm({ ...adjustmentForm, employee_id: e.target.value })} options={employees.slice(0, 20).map(emp => ({ value: emp.id, label: emp.profile.full_name }))} />
          <Input label={t('adjustmentAmount')} type="number" value={adjustmentForm.amount || ''} onChange={e => setAdjustmentForm({ ...adjustmentForm, amount: Number(e.target.value) })} />
          <Input label={t('adjustmentReason')} value={adjustmentForm.reason} onChange={e => setAdjustmentForm({ ...adjustmentForm, reason: e.target.value })} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowAdjustmentModal(false)}>{tc('cancel')}</Button>
            <Button onClick={() => {
              if (!adjustmentForm.employee_id || !adjustmentForm.amount) return
              const emp = employees.find(e => e.id === adjustmentForm.employee_id)
              if (!emp) return
              addEmployeePayrollEntry({
                payroll_run_id: lastRun?.id || '', employee_id: emp.id, employee_name: emp.profile.full_name,
                department: '', country: emp.country, gross_pay: adjustmentForm.type === 'deduction' ? 0 : adjustmentForm.amount,
                federal_tax: 0, state_tax: 0, social_security: 0, medicare: 0, pension: 0, health_insurance: 0,
                bonus: adjustmentForm.type === 'bonus' ? adjustmentForm.amount : 0,
                overtime: adjustmentForm.type === 'overtime' ? adjustmentForm.amount : 0,
                other_deductions: adjustmentForm.type === 'deduction' ? adjustmentForm.amount : 0,
                total_deductions: adjustmentForm.type === 'deduction' ? adjustmentForm.amount : 0,
                net_pay: adjustmentForm.type === 'deduction' ? -adjustmentForm.amount : adjustmentForm.amount,
                currency: 'USD', pay_date: new Date().toISOString().split('T')[0],
              })
              setShowAdjustmentModal(false)
              setAdjustmentForm({ employee_id: '', type: 'bonus', amount: 0, reason: '' })
            }}>{t('saveAdjustment')}</Button>
          </div>
        </div>
      </Modal>

      {/* Tax Config Edit Modal */}
      <Modal open={!!showTaxConfigModal} onClose={() => setShowTaxConfigModal(null)} title={t('editTaxConfig')}>
        {showTaxConfigModal && (() => {
          const config = taxConfigs.find(tc2 => tc2.id === showTaxConfigModal) as any
          if (!config) return null
          return (
            <div className="space-y-4">
              <div className="bg-canvas rounded-lg p-3">
                <p className="text-sm font-medium text-t1">{config.country}</p>
                <p className="text-xs text-t3">{config.tax_type}</p>
              </div>
              <Input label={t('taxRate')} type="number" defaultValue={config.rate} onChange={e => { config._rate = Number(e.target.value) }} />
              <div className="grid grid-cols-2 gap-4">
                <Input label={t('employerContribution')} type="number" defaultValue={config.employer_contribution} onChange={e => { config._employer = Number(e.target.value) }} />
                <Input label={t('employeeContribution')} type="number" defaultValue={config.employee_contribution} onChange={e => { config._employee = Number(e.target.value) }} />
              </div>
              <Input label={t('effectiveDate')} type="date" defaultValue={config.effective_date} onChange={e => { config._date = e.target.value }} />
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="secondary" onClick={() => setShowTaxConfigModal(null)}>{tc('cancel')}</Button>
                <Button onClick={() => {
                  updateTaxConfig(config.id, {
                    rate: config._rate ?? config.rate,
                    employer_contribution: config._employer ?? config.employer_contribution,
                    employee_contribution: config._employee ?? config.employee_contribution,
                    effective_date: config._date ?? config.effective_date,
                  })
                  setShowTaxConfigModal(null)
                }}>{t('save')}</Button>
              </div>
            </div>
          )
        })()}
      </Modal>
    </>
  )
}
