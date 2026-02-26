'use client'

import { useState, useMemo } from 'react'
import { Header } from '@/components/layout/header'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/ui/stat-card'
import { Tabs } from '@/components/ui/tabs'
import { Modal } from '@/components/ui/modal'
import { Input, Select } from '@/components/ui/input'
import { MiniDonutChart } from '@/components/ui/mini-chart'
import { Progress } from '@/components/ui/progress'
import { Banknote, TrendingUp, AlertTriangle, Plus, Printer, Award, PieChart, Target, Layers, BarChart3, CalendarRange, Globe, MapPin, ArrowUpDown } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useTempo } from '@/lib/store'
import { AIInsightPanel, AIAlertBanner } from '@/components/ai'
import { detectPayEquityGaps, detectCompAnomalies, modelBudgetImpact, generateTotalRewardsBreakdown, modelCompScenario, analyzeEquityDistribution, analyzeMarketPosition } from '@/lib/ai-engine'

export default function CompensationPage() {
  const {
    compBands, salaryReviews, employees, benefitPlans,
    addCompBand, deleteCompBand, addSalaryReview, updateSalaryReview, currentEmployeeId,
    getEmployeeName, getDepartmentName,
    equityGrants, addEquityGrant, updateEquityGrant,
    compPlanningCycles, addCompPlanningCycle, updateCompPlanningCycle,
    marketBenchmarks,
  } = useTempo()
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

  return (
    <>
      <Header title={t('title')} subtitle={t('subtitle')}
        actions={
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowBandModal(true)}><Plus size={14} /> {t('addBand')}</Button>
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
                      <td className="px-6 py-3 text-sm font-medium text-t1">{band.role_title}</td>
                      <td className="px-4 py-3"><Badge variant="default">{band.level}</Badge></td>
                      <td className="px-4 py-3 text-sm text-t2 text-right">${band.mid_salary.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-t2 text-right">${(band.p50 || 0).toLocaleString()}</td>
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
                      <td className="px-6 py-3 text-sm font-medium text-t1">{band.role_title}</td>
                      <td className="px-4 py-3"><Badge variant="default">{band.level}</Badge></td>
                      <td className="px-4 py-3 text-sm text-t2">{band.country || t('global')}</td>
                      <td className="px-4 py-3 text-sm text-t2 text-right">${band.min_salary.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm font-medium text-t1 text-right">${band.mid_salary.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-t2 text-right">${band.max_salary.toLocaleString()}</td>
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
                      { label: t('equityValue'), value: totalRewards.equity, icon: <Layers size={16} />, color: 'text-blue-600' },
                      { label: t('benefitsValue'), value: totalRewards.benefits, icon: <Target size={16} />, color: 'text-emerald-600' },
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
                  <MiniDonutChart data={[
                    { label: t('annualBaseSalary'), value: totalRewards.base, color: 'bg-slate-500' },
                    { label: t('annualBonus'), value: totalRewards.bonus, color: 'bg-tempo-500' },
                    { label: t('equityValue'), value: totalRewards.equity, color: 'bg-blue-500' },
                    { label: t('benefitsValue'), value: totalRewards.benefits, color: 'bg-emerald-500' },
                  ]} />
                  <div className="mt-4 space-y-2">
                    {[
                      { label: t('annualBaseSalary'), value: totalRewards.base, pct: Math.round((totalRewards.base / totalRewards.total) * 100), color: 'bg-slate-500' },
                      { label: t('annualBonus'), value: totalRewards.bonus, pct: Math.round((totalRewards.bonus / totalRewards.total) * 100), color: 'bg-tempo-500' },
                      { label: t('equityValue'), value: totalRewards.equity, pct: Math.round((totalRewards.equity / totalRewards.total) * 100), color: 'bg-blue-500' },
                      { label: t('benefitsValue'), value: totalRewards.benefits, pct: Math.round((totalRewards.benefits / totalRewards.total) * 100), color: 'bg-emerald-500' },
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
                    <tr><td colSpan={8} className="px-6 py-12 text-center text-sm text-t3">{t('noEquityGrants')}</td></tr>
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
                        <td className="px-4 py-3 text-sm text-t1 text-right font-medium">{grant.shares.toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm text-t2 text-right">{grant.strike_price > 0 ? `$${grant.strike_price.toFixed(2)}` : '-'}</td>
                        <td className="px-4 py-3 text-sm text-t2">{grant.vesting_schedule}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-sm text-t1">{grant.vested_shares.toLocaleString()}</span>
                            <Progress value={vestPct} size="sm" color="orange" className="w-16" />
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-t1 text-right font-semibold">${grant.current_value.toLocaleString()}</td>
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
                      <td className="px-4 py-3 text-sm text-t1 text-right font-medium">{cycle.budget_percent}%</td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm text-t1">{cycle.employees_reviewed}/{cycle.total_employees}</span>
                        <Progress value={cycle.employees_reviewed} max={cycle.total_employees} size="sm" color="orange" className="mt-1" />
                      </td>
                      <td className="px-4 py-3 text-sm text-t1 text-right">{cycle.avg_increase}%</td>
                      <td className="px-4 py-3 text-sm text-t1 text-right font-semibold">${cycle.total_budget.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-t2 text-center">{cycle.start_date}</td>
                      <td className="px-4 py-3 text-sm text-t2 text-center">{cycle.end_date}</td>
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
                  <p className="text-lg font-semibold text-t1">${(scenario.totalCurrentCost / 1000000).toFixed(2)}M</p>
                </div>
                <div className="bg-canvas rounded-lg p-4">
                  <p className="text-xs text-t3 mb-1">{t('projectedTotalCost')}</p>
                  <p className="text-lg font-semibold text-tempo-600">${(scenario.totalNewCost / 1000000).toFixed(2)}M</p>
                </div>
                <div className="bg-canvas rounded-lg p-4">
                  <p className="text-xs text-t3 mb-1">{t('budgetDelta')}</p>
                  <p className={`text-lg font-semibold ${scenario.delta > 0 ? 'text-error' : 'text-success'}`}>
                    +${(scenario.delta / 1000).toFixed(0)}K
                  </p>
                </div>
                <div className="bg-canvas rounded-lg p-4">
                  <p className="text-xs text-t3 mb-1">{t('avgNewSalary')}</p>
                  <p className="text-lg font-semibold text-t1">${scenario.avgNewSalary.toLocaleString()}</p>
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
                        <td className="px-6 py-3 text-sm font-medium text-t1">{dept.name}</td>
                        <td className="px-4 py-3 text-sm text-t2 text-right">{dept.headcount}</td>
                        <td className="px-4 py-3 text-sm text-t1 text-right font-medium">${(dept.cost / 1000).toFixed(0)}K</td>
                        <td className="px-4 py-3 text-sm text-right">
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
                              <div className="h-full bg-blue-300 rounded-full" style={{ width: `${(bm.p50 / maxVal) * 100}%` }} />
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
                              <div className="h-full bg-green-300 rounded-full" style={{ width: `${(bm.p75 / maxVal) * 100}%` }} />
                            </div>
                            <span className="text-xs text-t2 w-16 text-right">${(bm.p75 / 1000).toFixed(0)}K</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-t3 w-20">{t('marketP90Label')}</span>
                            <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-purple-300 rounded-full" style={{ width: `${(bm.p90 / maxVal) * 100}%` }} />
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
                  const geoColor = geoStatus === 'above' ? 'bg-green-50 border-green-200' : geoStatus === 'at' ? 'bg-blue-50 border-blue-200' : 'bg-amber-50 border-amber-200'
                  const geoTextColor = geoStatus === 'above' ? 'text-green-600' : geoStatus === 'at' ? 'text-blue-600' : 'text-amber-600'
                  return (
                    <div key={geo.country} className={`p-4 rounded-lg border ${geoColor}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin size={16} className={geoTextColor} />
                        <h4 className="text-sm font-semibold text-t1">{geo.country}</h4>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-t3">{t('compaRatio')}</p>
                          <p className={`text-lg font-bold ${geoTextColor}`}>{geo.avgCompaRatio}x</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-t3">{t('roleComparison')}</p>
                          <p className="text-lg font-bold text-t1">{geo.roleCount}</p>
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
                          <td className="px-4 py-3 text-sm text-t2">{bm.country}</td>
                          <td className="px-4 py-3 text-sm text-t1 text-right font-semibold">${bm.internal_avg.toLocaleString()}</td>
                          <td className="px-4 py-3 text-sm text-t2 text-right">${bm.p50.toLocaleString()}</td>
                          <td className="px-4 py-3 text-sm text-t2 text-right">${bm.p75.toLocaleString()}</td>
                          <td className="px-4 py-3 text-sm text-right font-bold">{ra?.compaRatio || '-'}x</td>
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
    </>
  )
}
