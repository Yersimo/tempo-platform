'use client'

import { useState, useMemo, useEffect } from 'react'
import { Header } from '@/components/layout/header'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/ui/stat-card'
import { Tabs } from '@/components/ui/tabs'
import { Modal } from '@/components/ui/modal'
import { Input, Select } from '@/components/ui/input'
import { TempoDonutChart, CHART_SERIES } from '@/components/ui/charts'
import { Progress } from '@/components/ui/progress'
import { Banknote, TrendingUp, AlertTriangle, Plus, Printer, Award, PieChart, Target, Layers, BarChart3, CalendarRange, Globe, MapPin, ArrowUpDown, Building2, Search, Users } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useTempo } from '@/lib/store'
import { PageSkeleton } from '@/components/ui/page-skeleton'
import { AIInsightPanel, AIAlertBanner } from '@/components/ai'
import { AIInsightsCard } from '@/components/ui/ai-insights-card'
import { detectPayEquityGaps, detectCompAnomalies, modelBudgetImpact, generateTotalRewardsBreakdown, modelCompScenario, analyzeEquityDistribution, analyzeMarketPosition } from '@/lib/ai-engine'

export default function CompensationPage() {
  const {
    compBands, salaryReviews, employees, benefitPlans, departments,
    addCompBand, deleteCompBand, addSalaryReview, updateSalaryReview, currentEmployeeId,
    getEmployeeName, getDepartmentName, addToast,
    equityGrants, addEquityGrant, updateEquityGrant,
    compPlanningCycles, addCompPlanningCycle, updateCompPlanningCycle,
    marketBenchmarks,
    ensureModulesLoaded,
  } = useTempo()

  const [pageLoading, setPageLoading] = useState(true)

  useEffect(() => { ensureModulesLoaded?.(['compBands', 'salaryReviews', 'equityGrants', 'compPlanningCycles', 'employees'])?.then?.(() => setPageLoading(false))?.catch?.(() => setPageLoading(false)) }, [ensureModulesLoaded])

  useEffect(() => { const t = setTimeout(() => setPageLoading(false), 2000); return () => clearTimeout(t) }, [])

  const t = useTranslations('compensation')
  const tc = useTranslations('common')

  // ---- Tab State ----
  const [activeTab, setActiveTab] = useState('benchmarking')
  const tabs = [
    { id: 'benchmarking', label: t('tabBenchmarking'), count: compBands.length },
    { id: 'salary-reviews', label: t('tabSalaryReviews'), count: salaryReviews.length },
    { id: 'stip', label: t('tabStipCalculator') },
    { id: 'bands', label: t('tabCompBands') },
    { id: 'total-rewards', label: t('tabTotalRewards') },
    { id: 'equity', label: t('tabEquity'), count: equityGrants.length },
    { id: 'planning', label: t('tabPlanning') },
    { id: 'market-data', label: t('tabMarketData'), count: marketBenchmarks.length },
  ]

  // ---- Modals ----
  const [showBandModal, setShowBandModal] = useState(false)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [showGrantModal, setShowGrantModal] = useState(false)
  const [showCycleModal, setShowCycleModal] = useState(false)

  // Bulk salary review state
  const [showBulkSalaryModal, setShowBulkSalaryModal] = useState(false)
  const [bulkSalStep, setBulkSalStep] = useState<1 | 2>(1)
  const [bulkSalMode, setBulkSalMode] = useState<'individual' | 'department' | 'country' | 'level' | 'all'>('individual')
  const [bulkSalSearch, setBulkSalSearch] = useState('')
  const [bulkSalSelectedEmpIds, setBulkSalSelectedEmpIds] = useState<Set<string>>(new Set())
  const [bulkSalSelectedDepts, setBulkSalSelectedDepts] = useState<Set<string>>(new Set())
  const [bulkSalSelectedCountries, setBulkSalSelectedCountries] = useState<Set<string>>(new Set())
  const [bulkSalSelectedLevels, setBulkSalSelectedLevels] = useState<Set<string>>(new Set())
  const [bulkSalAdjustType, setBulkSalAdjustType] = useState<'percentage' | 'fixed'>('percentage')
  const [bulkSalAdjustValue, setBulkSalAdjustValue] = useState(5)
  const [bulkSalJustification, setBulkSalJustification] = useState('Annual merit increase')

  // ---- Forms ----
  const [bandForm, setBandForm] = useState({ role_title: '', level: 'Mid', country: '', min_salary: 0, mid_salary: 0, max_salary: 0, currency: 'USD', p25: 0, p50: 0, p75: 0, effective_date: `${new Date().getFullYear()}-01-01` })
  const [reviewForm, setReviewForm] = useState({ employee_id: '', current_salary: 0, proposed_salary: 0, justification: '', cycle: `${new Date().getFullYear()} Annual` })
  const [stipForm, setStipForm] = useState({ base: 72000, multiplier: 1.2, raroc: 0.95, target: 20 })
  const [grantForm, setGrantForm] = useState({ employee_id: '', grant_type: 'RSU', shares: 0, strike_price: 0, vesting_schedule: '4-year with 1-year cliff', grant_date: `${new Date().getFullYear()}-03-01` })
  const [cycleForm, setCycleForm] = useState({ name: '', budget_percent: 4.0, start_date: '', end_date: '' })
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(employees[0]?.id || '')
  const [scenarioAdjustPct, setScenarioAdjustPct] = useState(5)

  // ---- AI Insights ----
  const equityInsights = useMemo(() => detectPayEquityGaps(employees, compBands), [employees, compBands])
  const compAnomaliesRaw = useMemo(() => detectCompAnomalies(salaryReviews, compBands), [salaryReviews, compBands])
  const compAnomalies = useMemo(() => compAnomaliesRaw.map(a => ({
    id: a.id, category: 'anomaly' as const, severity: a.severity,
    title: a.metric, description: a.explanation, confidence: 'high' as const, confidenceScore: 80,
    suggestedAction: `Expected ${a.expectedValue}, got ${a.currentValue} (${a.deviationPercent}% deviation)`, module: 'compensation',
  })), [compAnomaliesRaw])
  const budgetImpact = useMemo(() => modelBudgetImpact(salaryReviews), [salaryReviews])
  const equityDistResult = useMemo(() => analyzeEquityDistribution(equityGrants, employees), [equityGrants, employees])
  const equityDistInsights = equityDistResult.insights || []

  // ---- Computed ----
  const pendingReviews = salaryReviews.filter(s => s.status === 'pending_approval').length
  const belowMarket = compBands.filter(b => b.p50 && b.mid_salary / b.p50 < 0.95).length

  // STIP
  const targetBonus = stipForm.base * (stipForm.target / 100)
  const adjustedBonus = targetBonus * stipForm.multiplier * stipForm.raroc
  const perfImpact = targetBonus * (stipForm.multiplier - 1)
  const rarocAdj = targetBonus * stipForm.multiplier * (1 - stipForm.raroc)

  // Total Rewards
  const selectedEmp = employees.find(e => e.id === selectedEmployeeId)
  const totalRewardsRaw = useMemo(() => generateTotalRewardsBreakdown(selectedEmp, compBands, equityGrants, benefitPlans), [selectedEmp, compBands, equityGrants, benefitPlans])
  const totalRewards = { base: totalRewardsRaw.baseSalary, bonus: totalRewardsRaw.bonus, equity: totalRewardsRaw.equity, benefits: totalRewardsRaw.benefits, total: totalRewardsRaw.total }

  // Equity
  const totalEquityValue = equityGrants.reduce((s, g) => s + (g.current_value || 0), 0)
  const totalShares = equityGrants.reduce((s, g) => s + (g.shares || 0), 0)
  const totalVested = equityGrants.reduce((s, g) => s + (g.vested_shares || 0), 0)
  const vestedPct = totalShares > 0 ? Math.round((totalVested / totalShares) * 100) : 0

  // Planning scenario
  const scenarioRaw = useMemo(() => modelCompScenario(employees, compBands, scenarioAdjustPct), [employees, compBands, scenarioAdjustPct])
  const scenario = { totalCurrentCost: scenarioRaw.affectedCount > 0 ? Math.round(scenarioRaw.newAvgSalary * scenarioRaw.affectedCount / (1 + scenarioAdjustPct / 100)) : employees.length * 72000, totalNewCost: scenarioRaw.newAvgSalary * scenarioRaw.affectedCount || 0, delta: scenarioRaw.totalImpact, avgNewSalary: scenarioRaw.newAvgSalary }

  // Dept budget allocation
  const deptAllocation = useMemo(() => {
    const deptMap: Record<string, { id: string; name: string; headcount: number; cost: number }> = {}
    employees.forEach(e => {
      const deptId = e.department_id
      if (!deptMap[deptId]) deptMap[deptId] = { id: deptId, name: getDepartmentName(deptId), headcount: 0, cost: 0 }
      deptMap[deptId].headcount += 1
      deptMap[deptId].cost += (e as any).base_salary || 72000
    })
    return Object.values(deptMap).sort((a, b) => b.cost - a.cost)
  }, [employees, getDepartmentName])

  // ---- Bulk Salary Review Computed ----
  const uniqueCountries = useMemo(() => [...new Set(employees.map(e => e.country).filter(Boolean))].sort(), [employees])
  const uniqueLevels = useMemo(() => [...new Set(employees.map(e => e.level).filter(Boolean))].sort(), [employees])

  const bulkSalTargetEmployees = useMemo(() => {
    if (bulkSalMode === 'all') return employees
    if (bulkSalMode === 'department') return employees.filter(e => bulkSalSelectedDepts.has(e.department_id))
    if (bulkSalMode === 'country') return employees.filter(e => bulkSalSelectedCountries.has(e.country))
    if (bulkSalMode === 'level') return employees.filter(e => bulkSalSelectedLevels.has(e.level))
    return employees.filter(e => bulkSalSelectedEmpIds.has(e.id))
  }, [employees, bulkSalMode, bulkSalSelectedEmpIds, bulkSalSelectedDepts, bulkSalSelectedCountries, bulkSalSelectedLevels])

  const bulkSalSelectedEmployees = useMemo(() => {
    if (bulkSalMode === 'individual') {
      const q = bulkSalSearch.toLowerCase()
      if (!q) return bulkSalTargetEmployees
      return employees.filter(e => bulkSalSelectedEmpIds.has(e.id) || (e.profile?.full_name || '').toLowerCase().includes(q) || (e.job_title || '').toLowerCase().includes(q))
    }
    return bulkSalTargetEmployees
  }, [bulkSalTargetEmployees, bulkSalMode, bulkSalSearch, employees, bulkSalSelectedEmpIds])

  const bulkSalAlreadyReviewedIds = useMemo(() => {
    const pendingIds = new Set(salaryReviews.filter(r => r.status === 'pending_approval').map(r => r.employee_id))
    return new Set(bulkSalTargetEmployees.filter(e => pendingIds.has(e.id)).map(e => e.id))
  }, [bulkSalTargetEmployees, salaryReviews])

  const bulkSalNewReviewees = useMemo(() => bulkSalTargetEmployees.filter(e => !bulkSalAlreadyReviewedIds.has(e.id)), [bulkSalTargetEmployees, bulkSalAlreadyReviewedIds])
  const bulkSalSkipped = useMemo(() => bulkSalTargetEmployees.filter(e => bulkSalAlreadyReviewedIds.has(e.id)), [bulkSalTargetEmployees, bulkSalAlreadyReviewedIds])

  const bulkSalTotalImpact = useMemo(() => {
    let totalCurrent = 0
    let totalNew = 0
    bulkSalNewReviewees.forEach(emp => {
      const band = compBands.find(b => b.level === emp.level)
      const currentSalary = (emp as any).salary || (emp as any).base_salary || band?.mid_salary || 72000
      const proposed = bulkSalAdjustType === 'percentage'
        ? Math.round(currentSalary * (1 + bulkSalAdjustValue / 100))
        : currentSalary + bulkSalAdjustValue
      totalCurrent += currentSalary
      totalNew += proposed
    })
    return { totalCurrent, totalNew, delta: totalNew - totalCurrent }
  }, [bulkSalNewReviewees, compBands, bulkSalAdjustType, bulkSalAdjustValue])

  // ---- Handlers ----
  function submitBand() {
    if (!bandForm.role_title) return
    addCompBand(bandForm)
    setShowBandModal(false)
    setBandForm({ role_title: '', level: 'Mid', country: '', min_salary: 0, mid_salary: 0, max_salary: 0, currency: 'USD', p25: 0, p50: 0, p75: 0, effective_date: '2026-01-01' })
  }

  function submitReview() {
    if (!reviewForm.employee_id || !reviewForm.proposed_salary) return
    addSalaryReview({ ...reviewForm, proposed_by: currentEmployeeId, status: 'pending_approval', approved_by: null, currency: 'USD' })
    setShowReviewModal(false)
    setReviewForm({ employee_id: '', current_salary: 0, proposed_salary: 0, justification: '', cycle: '2026 Annual' })
  }

  function submitGrant() {
    if (!grantForm.employee_id || !grantForm.shares) return
    addEquityGrant({ ...grantForm, vested_shares: 0, current_value: grantForm.shares * (grantForm.strike_price || 25), status: 'active' })
    setShowGrantModal(false)
    setGrantForm({ employee_id: '', grant_type: 'RSU', shares: 0, strike_price: 0, vesting_schedule: '4-year with 1-year cliff', grant_date: '2026-03-01' })
  }

  function submitCycle() {
    if (!cycleForm.name || !cycleForm.start_date) return
    addCompPlanningCycle({ ...cycleForm, status: 'active', employees_reviewed: 0, total_employees: employees.length, avg_increase: 0, total_budget: Math.round(scenario.totalCurrentCost * (cycleForm.budget_percent / 100)) })
    setShowCycleModal(false)
    setCycleForm({ name: '', budget_percent: 4.0, start_date: '', end_date: '' })
  }

  function toggleBulkSalSet<T>(set: Set<T>, value: T, setter: (s: Set<T>) => void) {
    const next = new Set(set)
    if (next.has(value)) next.delete(value)
    else next.add(value)
    setter(next)
  }

  function resetBulkSalary() {
    setShowBulkSalaryModal(false)
    setBulkSalStep(1)
    setBulkSalMode('individual')
    setBulkSalSearch('')
    setBulkSalSelectedEmpIds(new Set())
    setBulkSalSelectedDepts(new Set())
    setBulkSalSelectedCountries(new Set())
    setBulkSalSelectedLevels(new Set())
    setBulkSalAdjustType('percentage')
    setBulkSalAdjustValue(5)
    setBulkSalJustification('Annual merit increase')
  }

  function submitBulkSalary() {
    let created = 0
    bulkSalNewReviewees.forEach(emp => {
      const band = compBands.find(b => b.level === emp.level)
      const currentSalary = (emp as any).salary || (emp as any).base_salary || band?.mid_salary || 72000
      const proposedSalary = bulkSalAdjustType === 'percentage'
        ? Math.round(currentSalary * (1 + bulkSalAdjustValue / 100))
        : currentSalary + bulkSalAdjustValue
      addSalaryReview({
        employee_id: emp.id,
        current_salary: currentSalary,
        proposed_salary: proposedSalary,
        justification: bulkSalJustification,
        status: 'pending_approval',
        cycle: 'annual',
        proposed_by: currentEmployeeId,
        approved_by: null,
        currency: 'USD',
      })
      created++
    })
    addToast(`Created ${created} salary review${created !== 1 ? 's' : ''} successfully`)
    resetBulkSalary()
  }

  if (pageLoading) {
    return (
      <>
        <Header title={t('title')} subtitle={t('subtitle')}
          actions={<div className="flex gap-2"><Button size="sm" variant="outline" disabled><Plus size={14} /> {t('addBand')}</Button><Button size="sm" variant="outline" disabled><Users size={14} /> Bulk Review</Button><Button size="sm" disabled><Plus size={14} /> {t('proposeReview')}</Button></div>}
        />
        <div className="p-6"><PageSkeleton /></div>
      </>
    )
  }

  return (
    <>
      <Header title={t('title')} subtitle={t('subtitle')}
        actions={
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowBandModal(true)}><Plus size={14} /> {t('addBand')}</Button>
            <Button size="sm" variant="outline" onClick={() => setShowBulkSalaryModal(true)}><Users size={14} /> Bulk Review</Button>
            <Button size="sm" onClick={() => setShowReviewModal(true)}><Plus size={14} /> {t('proposeReview')}</Button>
          </div>
        }
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label={t('avgCompaRatio')} value={compBands.length > 0 ? (compBands.reduce((a, b) => a + (b.p50 ? b.mid_salary / b.p50 : 1), 0) / compBands.length).toFixed(2) : '-'} change={t('atMarket')} changeType="neutral" icon={<TrendingUp size={20} />} />
        <StatCard label={t('belowMarket')} value={belowMarket} change={t('rolesBelowP50')} changeType={belowMarket > 0 ? 'negative' : 'positive'} icon={<AlertTriangle size={20} />} href="/people" />
        <StatCard label={t('pendingReviews')} value={pendingReviews} />
        <StatCard label={t('totalStaffCost')} value={`$${(employees.length * 72000 / 1000000).toFixed(1)}M`} change={tc('annual')} changeType="neutral" icon={<Banknote size={20} />} href="/payroll" />
      </div>

      {/* AI Insights */}
      {compAnomalies.length > 0 && <AIAlertBanner insights={compAnomalies} className="mb-4" />}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <AIInsightPanel title={t('payEquityAnalysis')} insights={equityInsights} />
        <AIInsightPanel title={t('budgetImpactModeling')} narrative={{ summary: t('budgetImpactSummary', { count: budgetImpact.count, totalImpact: Math.round(budgetImpact.totalAnnualImpact).toLocaleString(), avgIncrease: Math.round(budgetImpact.avgIncrease).toLocaleString() }), bulletPoints: [t('budgetImpactReviewCount', { count: budgetImpact.count }), t('budgetImpactTotal', { amount: Math.round(budgetImpact.totalAnnualImpact).toLocaleString() }), t('budgetImpactAvg', { amount: Math.round(budgetImpact.avgIncrease).toLocaleString() })] }} />
      </div>

      <AIInsightsCard
        insights={equityInsights}
        anomalies={compAnomaliesRaw}
        title="Tempo AI — Compensation Intelligence"
        maxVisible={3}
        className="mb-6"
      />

      <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} className="mb-6" />

      {/* ============================================================ */}
      {/* TAB 1: BENCHMARKING */}
      {/* ============================================================ */}
      {activeTab === 'benchmarking' && (
        <Card padding="none">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{t('benchmarkingTitle')}</CardTitle>
                <p className="text-xs text-t3 mt-0.5">{t('benchmarkingRegion')}</p>
              </div>
              <Badge variant="ai">{t('compAnalysis')}</Badge>
            </div>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-divider bg-canvas">
                  <th className="tempo-th text-left px-6 py-3">{t('tableRole')}</th>
                  <th className="tempo-th text-left px-4 py-3">{t('tableLevel')}</th>
                  <th className="tempo-th text-right px-4 py-3">{t('tableP50Internal')}</th>
                  <th className="tempo-th text-right px-4 py-3">{t('tableP50Market')}</th>
                  <th className="tempo-th text-right px-4 py-3">{t('tableCR')}</th>
                  <th className="tempo-th text-center px-4 py-3">{t('tableStatus')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {compBands.map(band => {
                  const cr = band.p50 ? (band.mid_salary / band.p50).toFixed(2) : tc('notAvailable')
                  const crNum = parseFloat(cr as string)
                  return (
                    <tr key={band.id} className="hover:bg-canvas/50">
                      <td className="px-6 py-3 text-xs font-medium text-t1">{band.role_title}</td>
                      <td className="px-4 py-3"><Badge variant="default">{band.level}</Badge></td>
                      <td className="px-4 py-3 text-xs text-t2 text-right">${band.mid_salary.toLocaleString()}</td>
                      <td className="px-4 py-3 text-xs text-t2 text-right">${(band.p50 || 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`text-sm font-semibold ${crNum >= 1 ? 'text-success' : crNum >= 0.95 ? 'text-warning' : 'text-error'}`}>
                          {cr}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={crNum >= 1 ? 'success' : crNum >= 0.95 ? 'warning' : 'error'}>
                          {crNum >= 1 ? t('atMarketBadge') : crNum >= 0.95 ? t('belowMarketBadge') : t('belowP25Badge')}
                        </Badge>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ============================================================ */}
      {/* TAB 2: SALARY REVIEWS */}
      {/* ============================================================ */}
      {activeTab === 'salary-reviews' && (
        <Card padding="none">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t('salaryReviewProposals')}</CardTitle>
              <div className="flex gap-2 text-xs text-t3">
                <Badge variant="success">{salaryReviews.filter(s => s.status === 'approved').length} approved</Badge>
                <Badge variant="warning">{pendingReviews} pending</Badge>
              </div>
            </div>
          </CardHeader>
          <div className="divide-y divide-divider">
            {salaryReviews.length === 0 ? (
              <div className="px-6 py-12 text-center text-sm text-t3">{t('noSalaryReviews')}</div>
            ) : salaryReviews.map(sr => {
              const emp = employees.find(e => e.id === sr.employee_id)
              const increase = ((sr.proposed_salary - sr.current_salary) / sr.current_salary * 100).toFixed(1)
              return (
                <div key={sr.id} className="px-6 py-4 flex items-center gap-4">
                  <Avatar name={emp?.profile?.full_name || ''} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-t1">{emp?.profile?.full_name || tc('unknown')}</p>
                    <p className="text-xs text-t3">{emp?.job_title} &middot; {sr.cycle}</p>
                    {sr.justification && <p className="text-xs text-t3 mt-0.5 truncate">{sr.justification}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-t3">${sr.current_salary.toLocaleString()} &rarr; ${sr.proposed_salary.toLocaleString()}</p>
                    <p className="text-xs font-medium text-success">+{increase}%</p>
                  </div>
                  <Badge variant={sr.status === 'approved' ? 'success' : sr.status === 'pending_approval' ? 'warning' : 'error'}>
                    {sr.status.replace('_', ' ')}
                  </Badge>
                  {sr.status === 'pending_approval' && (
                    <div className="flex gap-1 shrink-0">
                      <Button size="sm" variant="primary" onClick={() => updateSalaryReview(sr.id, { status: 'approved', approved_by: currentEmployeeId })}>{tc('approve')}</Button>
                      <Button size="sm" variant="ghost" onClick={() => updateSalaryReview(sr.id, { status: 'rejected' })}>{tc('reject')}</Button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* ============================================================ */}
      {/* TAB 3: STIP CALCULATOR */}
      {/* ============================================================ */}
      {activeTab === 'stip' && (
        <Card>
          <h3 className="text-sm font-semibold text-t1 mb-4">{t('stipTitle')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <Input label={t('baseSalary')} type="number" value={stipForm.base} onChange={(e) => setStipForm({ ...stipForm, base: Number(e.target.value) })} />
              <Input label={t('performanceMultiplier')} type="number" step="0.1" value={stipForm.multiplier} onChange={(e) => setStipForm({ ...stipForm, multiplier: Number(e.target.value) })} />
              <Input label={t('rarocFactor')} type="number" step="0.01" value={stipForm.raroc} onChange={(e) => setStipForm({ ...stipForm, raroc: Number(e.target.value) })} />
              <Input label={t('targetBonusPct')} type="number" value={stipForm.target} onChange={(e) => setStipForm({ ...stipForm, target: Number(e.target.value) })} />
            </div>
            <div className="md:col-span-2 bg-canvas rounded-xl p-6">
              <h4 className="text-xs font-semibold text-t3 uppercase tracking-wider mb-4">{t('calculationResult')}</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-t3">{t('targetBonus')}</p>
                  <p className="tempo-stat text-2xl text-t1">${targetBonus.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-t3">{t('adjustedBonus')}</p>
                  <p className="tempo-stat text-2xl text-tempo-600">${Math.round(adjustedBonus).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-t3">{t('performanceImpact')}</p>
                  <p className={`text-sm font-medium ${perfImpact >= 0 ? 'text-success' : 'text-error'}`}>
                    {perfImpact >= 0 ? '+' : ''}${Math.round(perfImpact).toLocaleString()} ({perfImpact >= 0 ? '+' : ''}{((stipForm.multiplier - 1) * 100).toFixed(0)}%)
                  </p>
                </div>
                <div>
                  <p className="text-xs text-t3">{t('rarocAdjustment')}</p>
                  <p className="text-sm font-medium text-warning">-${Math.round(rarocAdj).toLocaleString()} (-{((1 - stipForm.raroc) * 100).toFixed(0)}%)</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* ============================================================ */}
      {/* TAB 4: COMP BANDS (enhanced with visual range bars) */}
      {/* ============================================================ */}
      {activeTab === 'bands' && (
        <>
          <Card padding="none" className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t('compBandsTitle')}</CardTitle>
                <Button size="sm" onClick={() => setShowBandModal(true)}><Plus size={14} /> {t('addBand')}</Button>
              </div>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-divider bg-canvas">
                    <th className="tempo-th text-left px-6 py-3">{t('tableRole')}</th>
                    <th className="tempo-th text-left px-4 py-3">{t('tableLevel')}</th>
                    <th className="tempo-th text-left px-4 py-3">{t('tableCountry')}</th>
                    <th className="tempo-th text-right px-4 py-3">{t('tableMin')}</th>
                    <th className="tempo-th text-right px-4 py-3">{t('tableMid')}</th>
                    <th className="tempo-th text-right px-4 py-3">{t('tableMax')}</th>
                    <th className="tempo-th text-center px-4 py-3">{t('tableActions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {compBands.map(band => (
                    <tr key={band.id} className="hover:bg-canvas/50">
                      <td className="px-6 py-3 text-xs font-medium text-t1">{band.role_title}</td>
                      <td className="px-4 py-3"><Badge variant="default">{band.level}</Badge></td>
                      <td className="px-4 py-3 text-xs text-t2">{band.country || t('global')}</td>
                      <td className="px-4 py-3 text-xs text-t2 text-right">${band.min_salary.toLocaleString()}</td>
                      <td className="px-4 py-3 text-xs font-medium text-t1 text-right">${band.mid_salary.toLocaleString()}</td>
                      <td className="px-4 py-3 text-xs text-t2 text-right">${band.max_salary.toLocaleString()}</td>
                      <td className="px-4 py-3 text-center">
                        <Button size="sm" variant="ghost" onClick={() => deleteCompBand(band.id)}>{tc('remove')}</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Visual Range Bars */}
          <Card>
            <h3 className="text-sm font-semibold text-t1 mb-4">{t('rangeVisualization')}</h3>
            <div className="space-y-4">
              {compBands.map(band => {
                const range = band.max_salary - band.min_salary
                const midPct = range > 0 ? ((band.mid_salary - band.min_salary) / range) * 100 : 50
                const matchingEmps = employees.filter(e => e.level === band.level || e.job_title?.includes(band.role_title.split(' ')[0]))
                return (
                  <div key={band.id} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-t1">{band.role_title} <span className="text-t3 font-normal">({band.level})</span></span>
                      <span className="text-xs text-t3">${band.min_salary.toLocaleString()} &mdash; ${band.max_salary.toLocaleString()}</span>
                    </div>
                    <div className="relative h-6 bg-canvas rounded-full overflow-hidden border border-border">
                      {/* Min-Max bar */}
                      <div className="absolute inset-0 bg-tempo-100 rounded-full" />
                      {/* Mid marker */}
                      <div className="absolute top-0 bottom-0 w-0.5 bg-tempo-600" style={{ left: `${midPct}%` }} />
                      {/* Employee dots */}
                      {matchingEmps.slice(0, 8).map((emp, i) => {
                        const salary = (emp as any).base_salary || band.mid_salary
                        const empPct = range > 0 ? Math.max(0, Math.min(100, ((salary - band.min_salary) / range) * 100)) : 50
                        return (
                          <div key={emp.id} className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-tempo-500 border-2 border-white shadow-sm" style={{ left: `calc(${empPct}% - 6px)` }} title={`${emp.profile?.full_name}: $${salary.toLocaleString()}`} />
                        )
                      })}
                    </div>
                    <div className="flex justify-between text-xs text-t3">
                      <span>{t('tableMin')}: ${band.min_salary.toLocaleString()}</span>
                      <span className="text-tempo-600 font-medium">{t('tableMid')}: ${band.mid_salary.toLocaleString()}</span>
                      <span>{t('tableMax')}: ${band.max_salary.toLocaleString()}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        </>
      )}

      {/* ============================================================ */}
      {/* TAB 5: TOTAL REWARDS */}
      {/* ============================================================ */}
      {activeTab === 'total-rewards' && (
        <>
          <div className="flex items-center gap-4 mb-6">
            <Select label="" value={selectedEmployeeId} onChange={(e) => setSelectedEmployeeId(e.target.value)}
              options={employees.map(e => ({ value: e.id, label: e.profile?.full_name || '' }))} />
            <Button size="sm" variant="outline" onClick={() => window.print()}>
              <Printer size={14} /> {t('printStatement')}
            </Button>
          </div>

          {selectedEmp ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left: statement */}
              <div className="lg:col-span-2 space-y-4">
                <Card>
                  <div className="flex items-center gap-3 mb-6">
                    <Avatar name={selectedEmp.profile?.full_name || ''} size="lg" />
                    <div>
                      <h3 className="text-lg font-semibold text-t1">{selectedEmp.profile?.full_name}</h3>
                      <p className="text-sm text-t3">{selectedEmp.job_title} &middot; {getDepartmentName(selectedEmp.department_id)}</p>
                    </div>
                  </div>

                  <h4 className="text-xs font-semibold text-t3 uppercase tracking-wider mb-4">{t('totalRewardsTitle')}</h4>
                  <div className="space-y-3">
                    {[
                      { label: t('annualBaseSalary'), value: totalRewards.base, icon: <Banknote size={16} />, color: 'text-t1' },
                      { label: t('annualBonus'), value: totalRewards.bonus, icon: <Award size={16} />, color: 'text-tempo-600' },
                      { label: t('equityValue'), value: totalRewards.equity, icon: <Layers size={16} />, color: 'text-gray-500' },
                      { label: t('benefitsValue'), value: totalRewards.benefits, icon: <Target size={16} />, color: 'text-gray-500' },
                    ].map(item => (
                      <div key={item.label} className="flex items-center justify-between py-2 border-b border-divider last:border-0">
                        <div className="flex items-center gap-2 text-sm text-t2">
                          <span className={item.color}>{item.icon}</span> {item.label}
                        </div>
                        <span className={`text-sm font-medium ${item.color}`}>${item.value.toLocaleString()}</span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between py-3 bg-tempo-50 rounded-lg px-4 -mx-1">
                      <span className="text-sm font-bold text-t1">{t('totalCompensation')}</span>
                      <span className="text-xl font-bold text-tempo-700">${totalRewards.total.toLocaleString()}</span>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Right: donut chart */}
              <div>
                <Card>
                  <h4 className="text-sm font-semibold text-t1 mb-4">{t('rewardsBreakdown')}</h4>
                  <TempoDonutChart data={[
                    { name: t('annualBaseSalary'), value: totalRewards.base, color: CHART_SERIES[0] },
                    { name: t('annualBonus'), value: totalRewards.bonus, color: CHART_SERIES[1] },
                    { name: t('equityValue'), value: totalRewards.equity, color: CHART_SERIES[2] },
                    { name: t('benefitsValue'), value: totalRewards.benefits, color: CHART_SERIES[3] },
                  ]} height={180} />
                  <div className="mt-4 space-y-2">
                    {[
                      { label: t('annualBaseSalary'), value: totalRewards.base, pct: Math.round((totalRewards.base / totalRewards.total) * 100), color: 'bg-slate-500' },
                      { label: t('annualBonus'), value: totalRewards.bonus, pct: Math.round((totalRewards.bonus / totalRewards.total) * 100), color: 'bg-tempo-500' },
                      { label: t('equityValue'), value: totalRewards.equity, pct: Math.round((totalRewards.equity / totalRewards.total) * 100), color: 'bg-gray-400' },
                      { label: t('benefitsValue'), value: totalRewards.benefits, pct: Math.round((totalRewards.benefits / totalRewards.total) * 100), color: 'bg-gray-300' },
                    ].map(item => (
                      <div key={item.label} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${item.color}`} />
                          <span className="text-t2">{item.label}</span>
                        </div>
                        <span className="text-t1 font-medium">{item.pct}%</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          ) : (
            <Card><p className="text-sm text-t3 text-center py-8">{t('selectEmployeeToView')}</p></Card>
          )}
        </>
      )}

      {/* ============================================================ */}
      {/* TAB 6: EQUITY */}
      {/* ============================================================ */}
      {activeTab === 'equity' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard label={t('totalEquityValue')} value={`$${(totalEquityValue / 1000).toFixed(0)}K`} icon={<Layers size={20} />} />
            <StatCard label={t('totalShares')} value={totalShares.toLocaleString()} icon={<PieChart size={20} />} />
            <StatCard label={t('vestedPct')} value={`${vestedPct}%`} icon={<BarChart3 size={20} />} />
            <StatCard label={t('activeGrants')} value={equityGrants.filter(g => g.status === 'active').length} icon={<Award size={20} />} />
          </div>

          {/* Equity insights */}
          {equityDistInsights.length > 0 && (
            <AIInsightPanel title={t('equityInsights')} insights={equityDistInsights} className="mb-4" />
          )}

          <Card padding="none" className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t('equityTitle')}</CardTitle>
                <Button size="sm" onClick={() => setShowGrantModal(true)}><Plus size={14} /> {t('addGrant')}</Button>
              </div>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-divider bg-canvas">
                    <th className="tempo-th text-left px-6 py-3">{tc('employee')}</th>
                    <th className="tempo-th text-center px-4 py-3">{t('grantType')}</th>
                    <th className="tempo-th text-right px-4 py-3">{t('shares')}</th>
                    <th className="tempo-th text-right px-4 py-3">{t('strikePrice')}</th>
                    <th className="tempo-th text-left px-4 py-3">{t('vestingSchedule')}</th>
                    <th className="tempo-th text-right px-4 py-3">{t('vestedShares')}</th>
                    <th className="tempo-th text-right px-4 py-3">{t('currentValue')}</th>
                    <th className="tempo-th text-center px-4 py-3">{tc('status')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {equityGrants.length === 0 ? (
                    <tr><td colSpan={8} className="px-6 py-12 text-center text-xs text-t3">{t('noEquityGrants')}</td></tr>
                  ) : equityGrants.map(grant => {
                    const vestPct = grant.shares > 0 ? Math.round((grant.vested_shares / grant.shares) * 100) : 0
                    return (
                      <tr key={grant.id} className="hover:bg-canvas/50">
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-2">
                            <Avatar name={getEmployeeName(grant.employee_id)} size="sm" />
                            <div>
                              <p className="text-sm font-medium text-t1">{getEmployeeName(grant.employee_id)}</p>
                              <p className="text-xs text-t3">{t('grantDate')}: {grant.grant_date}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant={grant.grant_type === 'RSU' ? 'info' : grant.grant_type === 'stock_option' ? 'warning' : 'orange'}>
                            {grant.grant_type === 'stock_option' ? 'Stock Option' : grant.grant_type === 'phantom' ? 'Phantom' : grant.grant_type}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-xs text-t1 text-right font-medium">{grant.shares.toLocaleString()}</td>
                        <td className="px-4 py-3 text-xs text-t2 text-right">{grant.strike_price > 0 ? `$${grant.strike_price.toFixed(2)}` : '-'}</td>
                        <td className="px-4 py-3 text-xs text-t2">{grant.vesting_schedule}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-sm text-t1">{grant.vested_shares.toLocaleString()}</span>
                            <Progress value={vestPct} size="sm" color="orange" className="w-16" />
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-t1 text-right font-semibold">${grant.current_value.toLocaleString()}</td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant={grant.status === 'active' ? 'success' : grant.status === 'fully_vested' ? 'info' : 'default'}>
                            {grant.status === 'fully_vested' ? 'Fully Vested' : grant.status}
                          </Badge>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Vesting Timeline */}
          <Card>
            <h3 className="text-sm font-semibold text-t1 mb-4">{t('vestingTimeline')}</h3>
            <div className="space-y-3">
              {equityGrants.filter(g => g.status === 'active').map(grant => {
                const vestPct = grant.shares > 0 ? Math.round((grant.vested_shares / grant.shares) * 100) : 0
                return (
                  <div key={grant.id} className="flex items-center gap-4">
                    <div className="w-40 shrink-0">
                      <p className="text-sm font-medium text-t1 truncate">{getEmployeeName(grant.employee_id)}</p>
                      <p className="text-xs text-t3">{grant.grant_type} &middot; {grant.shares.toLocaleString()} shares</p>
                    </div>
                    <div className="flex-1">
                      <Progress value={vestPct} size="md" color={vestPct >= 75 ? 'success' : vestPct >= 50 ? 'orange' : 'warning'} showLabel />
                    </div>
                    <div className="w-24 text-right shrink-0">
                      <p className="text-sm font-medium text-t1">${grant.current_value.toLocaleString()}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        </>
      )}

      {/* ============================================================ */}
      {/* TAB 7: PLANNING */}
      {/* ============================================================ */}
      {activeTab === 'planning' && (
        <>
          {/* Planning Cycles */}
          <Card padding="none" className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t('planningCycles')}</CardTitle>
                <Button size="sm" onClick={() => setShowCycleModal(true)}><Plus size={14} /> {t('newCycle')}</Button>
              </div>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-divider bg-canvas">
                    <th className="tempo-th text-left px-6 py-3">{t('cycleName')}</th>
                    <th className="tempo-th text-center px-4 py-3">{tc('status')}</th>
                    <th className="tempo-th text-right px-4 py-3">{t('budgetPct')}</th>
                    <th className="tempo-th text-right px-4 py-3">{t('employeesReviewed')}</th>
                    <th className="tempo-th text-right px-4 py-3">{t('avgIncreasePct')}</th>
                    <th className="tempo-th text-right px-4 py-3">{t('totalBudget')}</th>
                    <th className="tempo-th text-center px-4 py-3">{t('startDate')}</th>
                    <th className="tempo-th text-center px-4 py-3">{t('endDate')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {compPlanningCycles.map(cycle => (
                    <tr key={cycle.id} className="hover:bg-canvas/50">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <CalendarRange size={16} className="text-tempo-500" />
                          <span className="text-sm font-medium text-t1">{cycle.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={cycle.status === 'active' ? 'success' : cycle.status === 'completed' ? 'info' : 'default'}>
                          {cycle.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-t1 text-right font-medium">{cycle.budget_percent}%</td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm text-t1">{cycle.employees_reviewed}/{cycle.total_employees}</span>
                        <Progress value={cycle.employees_reviewed} max={cycle.total_employees} size="sm" color="orange" className="mt-1" />
                      </td>
                      <td className="px-4 py-3 text-xs text-t1 text-right">{cycle.avg_increase}%</td>
                      <td className="px-4 py-3 text-xs text-t1 text-right font-semibold">${cycle.total_budget.toLocaleString()}</td>
                      <td className="px-4 py-3 text-xs text-t2 text-center">{cycle.start_date}</td>
                      <td className="px-4 py-3 text-xs text-t2 text-center">{cycle.end_date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Scenario Modeling */}
          <Card className="mb-6">
            <h3 className="text-sm font-semibold text-t1 mb-4">{t('scenarioModeling')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-medium text-t2 mb-2 block">{t('adjustmentPct')}: {scenarioAdjustPct}%</label>
                <input
                  type="range" min="0" max="15" step="0.5" value={scenarioAdjustPct}
                  onChange={(e) => setScenarioAdjustPct(Number(e.target.value))}
                  className="w-full h-2 bg-canvas rounded-lg appearance-none cursor-pointer accent-tempo-600"
                />
                <div className="flex justify-between text-xs text-t3 mt-1">
                  <span>0%</span>
                  <span>5%</span>
                  <span>10%</span>
                  <span>15%</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-canvas rounded-lg p-4">
                  <p className="text-xs text-t3 mb-1">{t('currentTotalCost')}</p>
                  <p className="text-sm font-semibold text-t1">${(scenario.totalCurrentCost / 1000000).toFixed(2)}M</p>
                </div>
                <div className="bg-canvas rounded-lg p-4">
                  <p className="text-xs text-t3 mb-1">{t('projectedTotalCost')}</p>
                  <p className="text-sm font-semibold text-tempo-600">${(scenario.totalNewCost / 1000000).toFixed(2)}M</p>
                </div>
                <div className="bg-canvas rounded-lg p-4">
                  <p className="text-xs text-t3 mb-1">{t('budgetDelta')}</p>
                  <p className={`text-sm font-semibold ${scenario.delta > 0 ? 'text-error' : 'text-success'}`}>
                    +${(scenario.delta / 1000).toFixed(0)}K
                  </p>
                </div>
                <div className="bg-canvas rounded-lg p-4">
                  <p className="text-xs text-t3 mb-1">{t('avgNewSalary')}</p>
                  <p className="text-sm font-semibold text-t1">${scenario.avgNewSalary.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Department Budget Allocation */}
          <Card padding="none">
            <CardHeader><CardTitle>{t('deptBudgetAllocation')}</CardTitle></CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-divider bg-canvas">
                    <th className="tempo-th text-left px-6 py-3">{t('deptName')}</th>
                    <th className="tempo-th text-right px-4 py-3">{t('headcount')}</th>
                    <th className="tempo-th text-right px-4 py-3">{t('currentCost')}</th>
                    <th className="tempo-th text-right px-4 py-3">{t('allocatedBudget')}</th>
                    <th className="tempo-th text-left px-4 py-3">{t('bandRange')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {deptAllocation.map(dept => {
                    const budgetAlloc = Math.round(dept.cost * (scenarioAdjustPct / 100))
                    const sharePct = scenario.totalCurrentCost > 0 ? Math.round((dept.cost / scenario.totalCurrentCost) * 100) : 0
                    return (
                      <tr key={dept.id} className="hover:bg-canvas/50">
                        <td className="px-6 py-3 text-xs font-medium text-t1">{dept.name}</td>
                        <td className="px-4 py-3 text-xs text-t2 text-right">{dept.headcount}</td>
                        <td className="px-4 py-3 text-xs text-t1 text-right font-medium">${(dept.cost / 1000).toFixed(0)}K</td>
                        <td className="px-4 py-3 text-xs text-right">
                          <span className="text-tempo-600 font-semibold">+${(budgetAlloc / 1000).toFixed(0)}K</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Progress value={sharePct} size="sm" color="orange" className="w-24" />
                            <span className="text-xs text-t3">{sharePct}%</span>
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
      )}

      {/* ---- MARKET DATA TAB ---- */}
      {activeTab === 'market-data' && (() => {
        const marketAnalysis = analyzeMarketPosition(employees, compBands, marketBenchmarks)
        return (
          <div className="space-y-6">
            {/* Overview Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                label={t('overallPosition')}
                value={`${marketAnalysis.overallCompaRatio}x`}
                change={marketAnalysis.positionLabel}
                changeType={marketAnalysis.overallCompaRatio >= 0.95 ? 'positive' : 'negative'}
                icon={<TrendingUp size={24} />}
              />
              <StatCard
                label={t('roleComparison')}
                value={marketBenchmarks.length}
                change={`${marketAnalysis.roleAnalysis.filter(r => r.status === 'above' || r.status === 'at').length} competitive`}
                changeType="positive"
                icon={<BarChart3 size={24} />}
              />
              <StatCard
                label={t('geographicView')}
                value={marketAnalysis.geoAnalysis.length}
                change={`${marketAnalysis.geoAnalysis.length} countries`}
                changeType="neutral"
                icon={<Globe size={24} />}
              />
              <StatCard
                label={t('marketPositionInsights')}
                value={marketAnalysis.insights.length}
                change={`${marketAnalysis.insights.filter(i => i.severity === 'critical' || i.severity === 'warning').length} alerts`}
                changeType={marketAnalysis.insights.some(i => i.severity === 'critical') ? 'negative' : 'neutral'}
                icon={<AlertTriangle size={24} />}
              />
            </div>

            {/* AI Insights */}
            {marketAnalysis.insights.length > 0 && (
              <AIAlertBanner insights={marketAnalysis.insights} />
            )}

            {/* Role Comparison Cards */}
            <Card>
              <CardHeader><CardTitle>{t('roleComparison')}</CardTitle></CardHeader>
              <div className="space-y-3">
                {marketAnalysis.roleAnalysis.map((role, idx) => {
                  const bm = marketBenchmarks[idx]
                  const statusColor = role.status === 'above' ? 'text-green-600' : role.status === 'at' ? 'text-blue-600' : role.status === 'below' ? 'text-amber-600' : 'text-red-600'
                  const statusLabel = role.status === 'above' ? t('aboveMarket') : role.status === 'at' ? t('atMarketLabel') : role.status === 'below' ? t('belowMarketLabel') : t('criticallyBelow')
                  const statusBadge = role.status === 'above' ? 'success' : role.status === 'at' ? 'info' : role.status === 'below' ? 'warning' : 'error'
                  const maxVal = bm ? Math.max(bm.p90, role.internalAvg) * 1.05 : role.internalAvg * 1.2
                  return (
                    <div key={role.role} className="p-4 rounded-lg bg-surface-secondary border border-divider">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="text-sm font-semibold text-t1">{role.role}</h4>
                          {bm && <p className="text-xs text-t3">{bm.country} · {bm.industry} · {bm.source}</p>}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={statusBadge as any}>{statusLabel}</Badge>
                          <span className={`text-sm font-bold ${statusColor}`}>{role.compaRatio}x</span>
                        </div>
                      </div>
                      {/* Visual bar comparison */}
                      {bm && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-t3 w-20">{t('marketP25Label')}</span>
                            <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-gray-300 rounded-full" style={{ width: `${(bm.p25 / maxVal) * 100}%` }} />
                            </div>
                            <span className="text-xs text-t2 w-16 text-right">${(bm.p25 / 1000).toFixed(0)}K</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-t3 w-20">{t('marketP50Label')}</span>
                            <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-gray-300 rounded-full" style={{ width: `${(bm.p50 / maxVal) * 100}%` }} />
                            </div>
                            <span className="text-xs text-t2 w-16 text-right">${(bm.p50 / 1000).toFixed(0)}K</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-medium text-tempo-600 w-20">{t('internalAvg')}</span>
                            <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-tempo-500 rounded-full" style={{ width: `${(role.internalAvg / maxVal) * 100}%` }} />
                            </div>
                            <span className="text-xs font-semibold text-tempo-600 w-16 text-right">${(role.internalAvg / 1000).toFixed(0)}K</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-t3 w-20">{t('marketP75Label')}</span>
                            <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-gray-400 rounded-full" style={{ width: `${(bm.p75 / maxVal) * 100}%` }} />
                            </div>
                            <span className="text-xs text-t2 w-16 text-right">${(bm.p75 / 1000).toFixed(0)}K</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-t3 w-20">{t('marketP90Label')}</span>
                            <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-gray-500 rounded-full" style={{ width: `${(bm.p90 / maxVal) * 100}%` }} />
                            </div>
                            <span className="text-xs text-t2 w-16 text-right">${(bm.p90 / 1000).toFixed(0)}K</span>
                          </div>
                        </div>
                      )}
                      {bm && (
                        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-divider text-xs text-t3">
                          <span>{t('sampleSize')}: {bm.sample_size.toLocaleString()}</span>
                          <span>{t('lastUpdated')}: {bm.updated_at}</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </Card>

            {/* Geographic Analysis */}
            <Card>
              <CardHeader><CardTitle>{t('geographicView')}</CardTitle></CardHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {marketAnalysis.geoAnalysis.map(geo => {
                  const geoStatus = geo.avgCompaRatio >= 1.05 ? 'above' : geo.avgCompaRatio >= 0.95 ? 'at' : 'below'
                  const geoColor = 'bg-gray-50 border-gray-200'
                  const geoTextColor = 'text-gray-500'
                  return (
                    <div key={geo.country} className={`p-4 rounded-lg border ${geoColor}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin size={16} className={geoTextColor} />
                        <h4 className="text-sm font-semibold text-t1">{geo.country}</h4>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-t3">{t('compaRatio')}</p>
                          <p className={`text-sm font-bold ${geoTextColor}`}>{geo.avgCompaRatio}x</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-t3">{t('roleComparison')}</p>
                          <p className="text-sm font-bold text-t1">{geo.roleCount}</p>
                        </div>
                      </div>
                      <div className="mt-2">
                        <Progress value={Math.min(geo.avgCompaRatio * 100, 150) / 1.5} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>

            {/* Detailed Benchmark Table */}
            <Card padding="none">
              <CardHeader><CardTitle>{t('industryBenchmark')}</CardTitle></CardHeader>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-divider bg-canvas">
                      <th className="tempo-th text-left px-6 py-3">{t('roleComparison')}</th>
                      <th className="tempo-th text-left px-4 py-3">{tc('country')}</th>
                      <th className="tempo-th text-right px-4 py-3">{t('internalAvg')}</th>
                      <th className="tempo-th text-right px-4 py-3">{t('marketP50Label')}</th>
                      <th className="tempo-th text-right px-4 py-3">{t('marketP75Label')}</th>
                      <th className="tempo-th text-right px-4 py-3">{t('compaRatio')}</th>
                      <th className="tempo-th text-left px-4 py-3">{tc('status')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {marketBenchmarks.map((bm, idx) => {
                      const ra = marketAnalysis.roleAnalysis[idx]
                      const statusBadge = ra?.status === 'above' ? 'success' : ra?.status === 'at' ? 'info' : ra?.status === 'below' ? 'warning' : 'error'
                      const statusLabel = ra?.status === 'above' ? t('aboveMarket') : ra?.status === 'at' ? t('atMarketLabel') : ra?.status === 'below' ? t('belowMarketLabel') : t('criticallyBelow')
                      return (
                        <tr key={bm.id} className="hover:bg-canvas/50">
                          <td className="px-6 py-3">
                            <p className="text-sm font-medium text-t1">{bm.role}</p>
                            <p className="text-xs text-t3">{bm.level} · {bm.industry}</p>
                          </td>
                          <td className="px-4 py-3 text-xs text-t2">{bm.country}</td>
                          <td className="px-4 py-3 text-xs text-t1 text-right font-semibold">${bm.internal_avg.toLocaleString()}</td>
                          <td className="px-4 py-3 text-xs text-t2 text-right">${bm.p50.toLocaleString()}</td>
                          <td className="px-4 py-3 text-xs text-t2 text-right">${bm.p75.toLocaleString()}</td>
                          <td className="px-4 py-3 text-xs text-right font-bold">{ra?.compaRatio || '-'}x</td>
                          <td className="px-4 py-3"><Badge variant={statusBadge as any}>{statusLabel}</Badge></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )
      })()}

      {/* ============================================================ */}
      {/* MODALS */}
      {/* ============================================================ */}

      {/* Add Band Modal */}
      <Modal open={showBandModal} onClose={() => setShowBandModal(false)} title={t('addBandModal')}>
        <div className="space-y-4">
          <Input label={t('roleTitle')} value={bandForm.role_title} onChange={(e) => setBandForm({ ...bandForm, role_title: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Select label={t('tableLevel')} value={bandForm.level} onChange={(e) => setBandForm({ ...bandForm, level: e.target.value })} options={['Associate', 'Mid', 'Senior', 'Manager', 'Senior Manager', 'Director', 'Executive'].map(l => ({ value: l, label: l }))} />
            <Input label={t('tableCountry')} value={bandForm.country} onChange={(e) => setBandForm({ ...bandForm, country: e.target.value })} placeholder={t('countryPlaceholder')} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Input label={t('minSalary')} type="number" value={bandForm.min_salary || ''} onChange={(e) => setBandForm({ ...bandForm, min_salary: Number(e.target.value) })} />
            <Input label={t('midSalary')} type="number" value={bandForm.mid_salary || ''} onChange={(e) => setBandForm({ ...bandForm, mid_salary: Number(e.target.value) })} />
            <Input label={t('maxSalary')} type="number" value={bandForm.max_salary || ''} onChange={(e) => setBandForm({ ...bandForm, max_salary: Number(e.target.value) })} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Input label={t('p25Market')} type="number" value={bandForm.p25 || ''} onChange={(e) => setBandForm({ ...bandForm, p25: Number(e.target.value) })} />
            <Input label={t('p50Market')} type="number" value={bandForm.p50 || ''} onChange={(e) => setBandForm({ ...bandForm, p50: Number(e.target.value) })} />
            <Input label={t('p75Market')} type="number" value={bandForm.p75 || ''} onChange={(e) => setBandForm({ ...bandForm, p75: Number(e.target.value) })} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowBandModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitBand}>{t('addBandButton')}</Button>
          </div>
        </div>
      </Modal>

      {/* Propose Review Modal */}
      <Modal open={showReviewModal} onClose={() => setShowReviewModal(false)} title={t('proposeSalaryReview')}>
        <div className="space-y-4">
          <Select label={tc('employee')} value={reviewForm.employee_id} onChange={(e) => {
            const emp = employees.find(em => em.id === e.target.value)
            const band = compBands.find(b => b.level === emp?.level)
            setReviewForm({ ...reviewForm, employee_id: e.target.value, current_salary: band?.mid_salary || 60000 })
          }} options={[{ value: '', label: t('selectEmployee') }, ...employees.map(e => ({ value: e.id, label: e.profile?.full_name || '' }))]} />
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('currentSalary')} type="number" value={reviewForm.current_salary || ''} onChange={(e) => setReviewForm({ ...reviewForm, current_salary: Number(e.target.value) })} />
            <Input label={t('proposedSalary')} type="number" value={reviewForm.proposed_salary || ''} onChange={(e) => setReviewForm({ ...reviewForm, proposed_salary: Number(e.target.value) })} />
          </div>
          <Input label={t('justification')} value={reviewForm.justification} onChange={(e) => setReviewForm({ ...reviewForm, justification: e.target.value })} placeholder={t('justificationPlaceholder')} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowReviewModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitReview}>{t('submitProposal')}</Button>
          </div>
        </div>
      </Modal>

      {/* Add Equity Grant Modal */}
      <Modal open={showGrantModal} onClose={() => setShowGrantModal(false)} title={t('addGrantModal')}>
        <div className="space-y-4">
          <Select label={tc('employee')} value={grantForm.employee_id} onChange={(e) => setGrantForm({ ...grantForm, employee_id: e.target.value })}
            options={[{ value: '', label: t('selectEmployee') }, ...employees.map(e => ({ value: e.id, label: e.profile?.full_name || '' }))]} />
          <div className="grid grid-cols-2 gap-4">
            <Select label={t('grantType')} value={grantForm.grant_type} onChange={(e) => setGrantForm({ ...grantForm, grant_type: e.target.value })}
              options={[{ value: 'RSU', label: 'RSU' }, { value: 'stock_option', label: 'Stock Option' }, { value: 'phantom', label: 'Phantom Stock' }]} />
            <Input label={t('shares')} type="number" value={grantForm.shares || ''} onChange={(e) => setGrantForm({ ...grantForm, shares: Number(e.target.value) })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('strikePrice')} type="number" step="0.01" value={grantForm.strike_price || ''} onChange={(e) => setGrantForm({ ...grantForm, strike_price: Number(e.target.value) })} />
            <Input label={t('grantDate')} type="date" value={grantForm.grant_date} onChange={(e) => setGrantForm({ ...grantForm, grant_date: e.target.value })} />
          </div>
          <Select label={t('vestingSchedule')} value={grantForm.vesting_schedule} onChange={(e) => setGrantForm({ ...grantForm, vesting_schedule: e.target.value })}
            options={[
              { value: '4-year with 1-year cliff', label: '4-year with 1-year cliff' },
              { value: '4-year monthly', label: '4-year monthly vesting' },
              { value: '3-year annual', label: '3-year annual vesting' },
              { value: '2-year quarterly', label: '2-year quarterly vesting' },
            ]} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowGrantModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitGrant}>{t('addGrant')}</Button>
          </div>
        </div>
      </Modal>

      {/* New Cycle Modal */}
      <Modal open={showCycleModal} onClose={() => setShowCycleModal(false)} title={t('newCycle')}>
        <div className="space-y-4">
          <Input label={t('cycleName')} value={cycleForm.name} onChange={(e) => setCycleForm({ ...cycleForm, name: e.target.value })} placeholder="e.g. 2026 Annual Review" />
          <Input label={t('budgetPct')} type="number" step="0.5" value={cycleForm.budget_percent} onChange={(e) => setCycleForm({ ...cycleForm, budget_percent: Number(e.target.value) })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('startDate')} type="date" value={cycleForm.start_date} onChange={(e) => setCycleForm({ ...cycleForm, start_date: e.target.value })} />
            <Input label={t('endDate')} type="date" value={cycleForm.end_date} onChange={(e) => setCycleForm({ ...cycleForm, end_date: e.target.value })} />
          </div>
          <div className="bg-canvas rounded-lg p-3">
            <p className="text-xs text-t3">Estimated budget: <span className="font-medium text-t1">${Math.round(scenario.totalCurrentCost * (cycleForm.budget_percent / 100)).toLocaleString()}</span> for {employees.length} employees</p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowCycleModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitCycle}>{t('createCycle')}</Button>
          </div>
        </div>
      </Modal>

      {/* Bulk Salary Review Modal */}
      <Modal open={showBulkSalaryModal} onClose={resetBulkSalary} title="Bulk Salary Review" size="xl">
        {bulkSalStep === 1 ? (
          <div className="space-y-4">
            {/* Mode selector */}
            <div>
              <label className="text-xs font-medium text-t2 mb-2 block">Select employees by</label>
              <div className="flex gap-2 flex-wrap">
                {([
                  { value: 'individual' as const, label: 'Individual', icon: <Users size={14} /> },
                  { value: 'department' as const, label: 'Department', icon: <Building2 size={14} /> },
                  { value: 'country' as const, label: 'Country', icon: <Globe size={14} /> },
                  { value: 'level' as const, label: 'Level', icon: <Layers size={14} /> },
                  { value: 'all' as const, label: 'All Employees', icon: <Users size={14} /> },
                ] as const).map(mode => (
                  <button
                    key={mode.value}
                    onClick={() => setBulkSalMode(mode.value)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      bulkSalMode === mode.value
                        ? 'bg-tempo-50 border-tempo-300 text-tempo-700'
                        : 'bg-canvas border-border text-t2 hover:border-tempo-200'
                    }`}
                  >
                    {mode.icon} {mode.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Individual mode: search + employee list */}
            {bulkSalMode === 'individual' && (
              <div className="space-y-3">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-t3" />
                  <input
                    type="text"
                    placeholder="Search employees by name or title..."
                    value={bulkSalSearch}
                    onChange={e => setBulkSalSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-tempo-500/20 focus:border-tempo-400"
                  />
                </div>
                <div className="max-h-60 overflow-y-auto divide-y divide-divider border border-border rounded-lg">
                  {bulkSalSelectedEmployees.map(emp => (
                    <label key={emp.id} className="flex items-center gap-3 px-3 py-2 hover:bg-canvas cursor-pointer">
                      <input
                        type="checkbox"
                        checked={bulkSalSelectedEmpIds.has(emp.id)}
                        onChange={() => toggleBulkSalSet(bulkSalSelectedEmpIds, emp.id, setBulkSalSelectedEmpIds)}
                        className="accent-tempo-600"
                      />
                      <Avatar name={emp.profile?.full_name || ''} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-t1 truncate">{emp.profile?.full_name}</p>
                        <p className="text-xs text-t3 truncate">{emp.job_title} &middot; {emp.level} &middot; {emp.country}</p>
                      </div>
                      {bulkSalAlreadyReviewedIds.has(emp.id) && (
                        <Badge variant="warning">Pending review</Badge>
                      )}
                    </label>
                  ))}
                  {bulkSalSelectedEmployees.length === 0 && (
                    <p className="px-3 py-6 text-center text-xs text-t3">No employees found</p>
                  )}
                </div>
                <p className="text-xs text-t3">{bulkSalSelectedEmpIds.size} employee{bulkSalSelectedEmpIds.size !== 1 ? 's' : ''} selected</p>
              </div>
            )}

            {/* Department mode */}
            {bulkSalMode === 'department' && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-t2">Select departments</label>
                <div className="max-h-60 overflow-y-auto divide-y divide-divider border border-border rounded-lg">
                  {departments.map(dept => {
                    const count = employees.filter(e => e.department_id === dept.id).length
                    return (
                      <label key={dept.id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-canvas cursor-pointer">
                        <input
                          type="checkbox"
                          checked={bulkSalSelectedDepts.has(dept.id)}
                          onChange={() => toggleBulkSalSet(bulkSalSelectedDepts, dept.id, setBulkSalSelectedDepts)}
                          className="accent-tempo-600"
                        />
                        <Building2 size={14} className="text-t3" />
                        <span className="text-sm font-medium text-t1 flex-1">{dept.name}</span>
                        <Badge variant="default">{count} employees</Badge>
                      </label>
                    )
                  })}
                </div>
                <p className="text-xs text-t3">{bulkSalSelectedDepts.size} department{bulkSalSelectedDepts.size !== 1 ? 's' : ''} selected ({bulkSalTargetEmployees.length} employees)</p>
              </div>
            )}

            {/* Country mode */}
            {bulkSalMode === 'country' && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-t2">Select countries</label>
                <div className="max-h-60 overflow-y-auto divide-y divide-divider border border-border rounded-lg">
                  {uniqueCountries.map(country => {
                    const count = employees.filter(e => e.country === country).length
                    return (
                      <label key={country} className="flex items-center gap-3 px-3 py-2.5 hover:bg-canvas cursor-pointer">
                        <input
                          type="checkbox"
                          checked={bulkSalSelectedCountries.has(country)}
                          onChange={() => toggleBulkSalSet(bulkSalSelectedCountries, country, setBulkSalSelectedCountries)}
                          className="accent-tempo-600"
                        />
                        <Globe size={14} className="text-t3" />
                        <span className="text-sm font-medium text-t1 flex-1">{country}</span>
                        <Badge variant="default">{count} employees</Badge>
                      </label>
                    )
                  })}
                </div>
                <p className="text-xs text-t3">{bulkSalSelectedCountries.size} countr{bulkSalSelectedCountries.size !== 1 ? 'ies' : 'y'} selected ({bulkSalTargetEmployees.length} employees)</p>
              </div>
            )}

            {/* Level mode */}
            {bulkSalMode === 'level' && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-t2">Select levels</label>
                <div className="max-h-60 overflow-y-auto divide-y divide-divider border border-border rounded-lg">
                  {uniqueLevels.map(level => {
                    const count = employees.filter(e => e.level === level).length
                    return (
                      <label key={level} className="flex items-center gap-3 px-3 py-2.5 hover:bg-canvas cursor-pointer">
                        <input
                          type="checkbox"
                          checked={bulkSalSelectedLevels.has(level)}
                          onChange={() => toggleBulkSalSet(bulkSalSelectedLevels, level, setBulkSalSelectedLevels)}
                          className="accent-tempo-600"
                        />
                        <Layers size={14} className="text-t3" />
                        <span className="text-sm font-medium text-t1 flex-1">{level}</span>
                        <Badge variant="default">{count} employees</Badge>
                      </label>
                    )
                  })}
                </div>
                <p className="text-xs text-t3">{bulkSalSelectedLevels.size} level{bulkSalSelectedLevels.size !== 1 ? 's' : ''} selected ({bulkSalTargetEmployees.length} employees)</p>
              </div>
            )}

            {/* All mode */}
            {bulkSalMode === 'all' && (
              <div className="bg-canvas rounded-lg p-4 border border-border">
                <div className="flex items-center gap-2 text-sm text-t1">
                  <Users size={16} className="text-tempo-500" />
                  <span className="font-medium">All {employees.length} employees</span> will be included in this review.
                </div>
                {bulkSalAlreadyReviewedIds.size > 0 && (
                  <p className="text-xs text-warning mt-2">{bulkSalAlreadyReviewedIds.size} employee{bulkSalAlreadyReviewedIds.size !== 1 ? 's' : ''} already have a pending review and will be skipped.</p>
                )}
              </div>
            )}

            {/* Footer */}
            <div className="flex justify-end gap-2 pt-2 border-t border-divider">
              <Button variant="secondary" onClick={resetBulkSalary}>Cancel</Button>
              <Button
                disabled={
                  (bulkSalMode === 'individual' && bulkSalSelectedEmpIds.size === 0) ||
                  (bulkSalMode === 'department' && bulkSalSelectedDepts.size === 0) ||
                  (bulkSalMode === 'country' && bulkSalSelectedCountries.size === 0) ||
                  (bulkSalMode === 'level' && bulkSalSelectedLevels.size === 0)
                }
                onClick={() => setBulkSalStep(2)}
              >
                Next
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Adjustment configuration */}
            <div>
              <label className="text-xs font-medium text-t2 mb-2 block">Adjustment type</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setBulkSalAdjustType('percentage')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    bulkSalAdjustType === 'percentage'
                      ? 'bg-tempo-50 border-tempo-300 text-tempo-700'
                      : 'bg-canvas border-border text-t2 hover:border-tempo-200'
                  }`}
                >
                  Percentage increase
                </button>
                <button
                  onClick={() => setBulkSalAdjustType('fixed')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    bulkSalAdjustType === 'fixed'
                      ? 'bg-tempo-50 border-tempo-300 text-tempo-700'
                      : 'bg-canvas border-border text-t2 hover:border-tempo-200'
                  }`}
                >
                  Fixed amount
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label={bulkSalAdjustType === 'percentage' ? 'Increase (%)' : 'Increase amount ($)'}
                type="number"
                step={bulkSalAdjustType === 'percentage' ? '0.5' : '1000'}
                value={bulkSalAdjustValue}
                onChange={e => setBulkSalAdjustValue(Number(e.target.value))}
              />
              <Input
                label="Justification"
                value={bulkSalJustification}
                onChange={e => setBulkSalJustification(e.target.value)}
                placeholder="e.g. Annual merit increase"
              />
            </div>

            {/* Preview */}
            <div className="bg-canvas rounded-xl p-4 border border-border space-y-3">
              <h4 className="text-xs font-semibold text-t3 uppercase tracking-wider">Review Summary</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-t3">Total employees</p>
                  <p className="text-lg font-semibold text-t1">{bulkSalTargetEmployees.length}</p>
                </div>
                <div>
                  <p className="text-xs text-t3">New reviews</p>
                  <p className="text-lg font-semibold text-success">{bulkSalNewReviewees.length}</p>
                </div>
                <div>
                  <p className="text-xs text-t3">Already reviewed (skipped)</p>
                  <p className="text-lg font-semibold text-warning">{bulkSalSkipped.length}</p>
                </div>
                <div>
                  <p className="text-xs text-t3">Budget impact</p>
                  <p className="text-lg font-semibold text-tempo-600">+${bulkSalTotalImpact.delta.toLocaleString()}</p>
                </div>
              </div>
              {bulkSalNewReviewees.length > 0 && (
                <div className="text-xs text-t3 pt-2 border-t border-divider">
                  <p>Current total: ${bulkSalTotalImpact.totalCurrent.toLocaleString()} &rarr; New total: ${bulkSalTotalImpact.totalNew.toLocaleString()}</p>
                  <p className="mt-0.5">
                    Adjustment: {bulkSalAdjustType === 'percentage' ? `+${bulkSalAdjustValue}%` : `+$${bulkSalAdjustValue.toLocaleString()}`} per employee
                  </p>
                </div>
              )}
            </div>

            {/* Employee preview list */}
            {bulkSalNewReviewees.length > 0 && (
              <div>
                <label className="text-xs font-medium text-t2 mb-2 block">Employees to be reviewed ({bulkSalNewReviewees.length})</label>
                <div className="max-h-48 overflow-y-auto divide-y divide-divider border border-border rounded-lg">
                  {bulkSalNewReviewees.slice(0, 50).map(emp => {
                    const band = compBands.find(b => b.level === emp.level)
                    const currentSalary = (emp as any).salary || (emp as any).base_salary || band?.mid_salary || 72000
                    const proposed = bulkSalAdjustType === 'percentage'
                      ? Math.round(currentSalary * (1 + bulkSalAdjustValue / 100))
                      : currentSalary + bulkSalAdjustValue
                    return (
                      <div key={emp.id} className="flex items-center gap-3 px-3 py-2">
                        <Avatar name={emp.profile?.full_name || ''} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-t1 truncate">{emp.profile?.full_name}</p>
                          <p className="text-xs text-t3">{emp.job_title} &middot; {emp.level}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs text-t3">${currentSalary.toLocaleString()} &rarr; ${proposed.toLocaleString()}</p>
                          <p className="text-xs font-medium text-success">+{bulkSalAdjustType === 'percentage' ? `${bulkSalAdjustValue}%` : `$${bulkSalAdjustValue.toLocaleString()}`}</p>
                        </div>
                      </div>
                    )
                  })}
                  {bulkSalNewReviewees.length > 50 && (
                    <p className="px-3 py-2 text-xs text-t3 text-center">...and {bulkSalNewReviewees.length - 50} more</p>
                  )}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex justify-between gap-2 pt-2 border-t border-divider">
              <Button variant="secondary" onClick={() => setBulkSalStep(1)}>Back</Button>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={resetBulkSalary}>Cancel</Button>
                <Button
                  disabled={bulkSalNewReviewees.length === 0}
                  onClick={submitBulkSalary}
                >
                  Submit {bulkSalNewReviewees.length} Review{bulkSalNewReviewees.length !== 1 ? 's' : ''}
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
