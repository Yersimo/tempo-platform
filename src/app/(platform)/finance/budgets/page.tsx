'use client'

import { useState, useMemo, Fragment } from 'react'
import { useTranslations } from 'next-intl'
import { Header } from '@/components/layout/header'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/ui/stat-card'
import { Progress } from '@/components/ui/progress'
import { Modal } from '@/components/ui/modal'
import { Input, Select } from '@/components/ui/input'
import { TempoBarChart, ChartLegend, CHART_COLORS } from '@/components/ui/charts'
import { PieChart, Plus, DollarSign, Pencil, BarChart3, TrendingUp, TrendingDown, Minus, Users, Building2, ArrowRightLeft, Lightbulb, Calendar, Target, Layers } from 'lucide-react'
import { useTempo } from '@/lib/store'
import { AIAlertBanner, AIScoreBadge, AIInsightCard } from '@/components/ai'
import { calculateBurnRate, calculateForecastAccuracy, analyzeVarianceByDepartment } from '@/lib/ai-engine'
import { demoBudgetForecast, demoRollingForecast, demoMultiYearPlan } from '@/lib/demo-data'

export default function BudgetsPage() {
  const t = useTranslations('budgets')
  const tc = useTranslations('common')
  const { budgets, departments, addBudget, updateBudget, getDepartmentName } = useTempo()

  const burnRateInsights = useMemo(() => calculateBurnRate(budgets), [budgets])

  const totalBudget = budgets.reduce((a, b) => a + b.total_amount, 0)
  const totalSpent = budgets.reduce((a, b) => a + b.spent_amount, 0)
  const utilization = totalBudget > 0 ? Math.round(totalSpent / totalBudget * 100) : 0
  const activeBudgets = budgets.filter(b => b.status === 'active').length

  // Forecast vs Actual aggregation
  const forecastByDept = useMemo(() => {
    const deptMap: Record<string, { department: string; months: Array<{ month: string; planned: number; actual: number }> }> = {}
    demoBudgetForecast.forEach(entry => {
      if (!deptMap[entry.department_id]) {
        deptMap[entry.department_id] = { department: entry.department, months: [] }
      }
      deptMap[entry.department_id].months.push({ month: entry.month, planned: entry.planned, actual: entry.actual })
    })
    return Object.entries(deptMap).map(([deptId, data]) => {
      const totalPlanned = data.months.reduce((s, m) => s + m.planned, 0)
      const totalActual = data.months.reduce((s, m) => s + m.actual, 0)
      const variance = totalActual - totalPlanned
      const variancePct = totalPlanned > 0 ? Math.round((variance / totalPlanned) * 100) : 0
      return { deptId, ...data, totalPlanned, totalActual, variance, variancePct }
    })
  }, [])

  // Rolling Forecast data aggregated by department
  const rollingByDept = useMemo(() => {
    const deptMap: Record<string, { department: string; months: typeof demoRollingForecast }> = {}
    demoRollingForecast.forEach(entry => {
      if (!deptMap[entry.department_id]) {
        deptMap[entry.department_id] = { department: entry.department, months: [] }
      }
      deptMap[entry.department_id].months.push(entry)
    })
    return Object.entries(deptMap).map(([deptId, data]) => ({ deptId, ...data }))
  }, [])

  // AI Forecast Accuracy
  const forecastAccuracy = useMemo(() => calculateForecastAccuracy(demoRollingForecast), [])

  // AI Variance insights
  const varianceInsights = useMemo(() => analyzeVarianceByDepartment(demoRollingForecast), [])

  // Multi-Year scenario selector
  const [activeScenario, setActiveScenario] = useState<'conservative' | 'base' | 'aggressive'>('base')
  const scenarioMultiplier = demoMultiYearPlan.scenarios[activeScenario]

  // New Budget modal
  const [showBudgetModal, setShowBudgetModal] = useState(false)
  const [editingBudget, setEditingBudget] = useState<string | null>(null)
  const [budgetForm, setBudgetForm] = useState({
    name: '',
    department_id: '',
    total_amount: '',
    spent_amount: '',
    fiscal_year: '2026',
    currency: 'USD',
  })

  function openNewBudget() {
    setEditingBudget(null)
    setBudgetForm({
      name: '',
      department_id: departments[0]?.id || '',
      total_amount: '',
      spent_amount: '',
      fiscal_year: '2026',
      currency: 'USD',
    })
    setShowBudgetModal(true)
  }

  function openEditBudget(id: string) {
    const b = budgets.find(x => x.id === id)
    if (!b) return
    setEditingBudget(id)
    setBudgetForm({
      name: b.name,
      department_id: b.department_id,
      total_amount: String(b.total_amount),
      spent_amount: String(b.spent_amount),
      fiscal_year: String(b.fiscal_year),
      currency: b.currency || 'USD',
    })
    setShowBudgetModal(true)
  }

  function submitBudget() {
    if (!budgetForm.name || !budgetForm.department_id || !budgetForm.total_amount) return
    const data = {
      name: budgetForm.name,
      department_id: budgetForm.department_id,
      total_amount: Number(budgetForm.total_amount),
      spent_amount: Number(budgetForm.spent_amount) || 0,
      fiscal_year: Number(budgetForm.fiscal_year) || 2026,
      status: 'active' as string,
      currency: budgetForm.currency,
    }
    if (editingBudget) {
      updateBudget(editingBudget, data)
    } else {
      addBudget(data)
    }
    setShowBudgetModal(false)
  }

  function closeBudget(id: string) {
    updateBudget(id, { status: 'closed' })
  }

  function reactivateBudget(id: string) {
    updateBudget(id, { status: 'active' })
  }

  return (
    <>
      <Header
        title={t('title')}
        subtitle={t('subtitle')}
        actions={<Button size="sm" onClick={openNewBudget}><Plus size={14} /> {t('newBudget')}</Button>}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label={t('totalBudget')} value={`$${(totalBudget / 1000000).toFixed(1)}M`} change={`FY 2026`} changeType="neutral" icon={<PieChart size={20} />} />
        <StatCard label={t('spent')} value={`$${(totalSpent / 1000000).toFixed(1)}M`} change={t('utilized', { percent: utilization })} changeType="neutral" icon={<DollarSign size={20} />} href="/expense" />
        <StatCard label={t('remaining')} value={`$${((totalBudget - totalSpent) / 1000000).toFixed(1)}M`} change={t('availableLabel')} changeType="positive" />
        <StatCard label={t('activeBudgets')} value={activeBudgets} />
      </div>

      {/* AI Insights */}
      <AIAlertBanner insights={burnRateInsights} className="mb-6" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {budgets.map(budget => {
          const pct = budget.total_amount > 0 ? Math.round(budget.spent_amount / budget.total_amount * 100) : 0
          return (
            <Card key={budget.id}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-t1">{budget.name}</h3>
                  <p className="text-xs text-t3">{getDepartmentName(budget.department_id)} - FY {budget.fiscal_year}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={budget.status === 'active' ? 'success' : 'default'}>{budget.status}</Badge>
                  <button onClick={() => openEditBudget(budget.id)} className="p-1.5 text-t3 hover:text-t1 hover:bg-canvas rounded-lg transition-colors">
                    <Pencil size={14} />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div>
                  <p className="text-[0.6rem] text-t3 uppercase">{t('budget')}</p>
                  <p className="text-sm font-semibold text-t1">${(budget.total_amount / 1000000).toFixed(1)}M</p>
                </div>
                <div>
                  <p className="text-[0.6rem] text-t3 uppercase">{t('spentLabel')}</p>
                  <p className="text-sm font-semibold text-tempo-600">${(budget.spent_amount / 1000).toFixed(0)}K</p>
                </div>
                <div>
                  <p className="text-[0.6rem] text-t3 uppercase">{t('remainingLabel')}</p>
                  <p className="text-sm font-semibold text-success">${((budget.total_amount - budget.spent_amount) / 1000000).toFixed(1)}M</p>
                </div>
              </div>
              <Progress value={pct} showLabel color={pct > 80 ? 'error' : pct > 50 ? 'warning' : 'success'} />
              <div className="flex justify-end mt-3 gap-2">
                {budget.status === 'active' && (
                  <Button size="sm" variant="ghost" onClick={() => closeBudget(budget.id)}>{t('closeBudget')}</Button>
                )}
                {budget.status === 'closed' && (
                  <Button size="sm" variant="secondary" onClick={() => reactivateBudget(budget.id)}>{t('reactivate')}</Button>
                )}
              </div>
            </Card>
          )
        })}
      </div>

      {/* ── Section 1: Forecast vs Actual ── */}
      <div className="mt-8">
        <h2 className="text-sm font-semibold text-t1 mb-2 flex items-center gap-2">
          <BarChart3 size={20} /> {t('forecastVsActual')}
        </h2>
        <p className="text-sm text-t3 mb-4">{t('forecastDesc')}</p>

        <div className="space-y-4">
          {forecastByDept.map(dept => (
            <Card key={dept.deptId}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-t1">{dept.department}</h3>
                  <p className="text-xs text-t3">Q{Math.ceil((new Date().getMonth() + 1) / 3)} {new Date().getFullYear()} - 3 months</p>
                </div>
                <Badge variant={dept.variancePct > 5 ? 'error' : dept.variancePct < -5 ? 'success' : 'default'}>
                  {dept.variancePct > 5 ? t('overBudget') : dept.variancePct < -5 ? t('underBudget') : t('onBudget')}
                </Badge>
              </div>

              {/* Monthly breakdown */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                {dept.months.map(month => {
                  const variance = month.actual - month.planned
                  const varPct = month.planned > 0 ? Math.round((variance / month.planned) * 100) : 0
                  return (
                    <div key={month.month} className="p-3 bg-canvas rounded-lg">
                      <p className="text-xs font-medium text-t3 uppercase mb-2">{month.month}</p>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-t3">{t('planned')}</span>
                          <span className="text-t1 font-medium">${(month.planned / 1000).toFixed(0)}K</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-t3">{t('actual')}</span>
                          <span className="text-t1 font-medium">${(month.actual / 1000).toFixed(0)}K</span>
                        </div>
                        <div className="flex justify-between text-xs border-t border-divider pt-1">
                          <span className="text-t3">{t('variance')}</span>
                          <span className={`font-medium flex items-center gap-0.5 ${variance > 0 ? 'text-error' : 'text-success'}`}>
                            {variance > 0 ? <TrendingUp size={10} /> : variance < 0 ? <TrendingDown size={10} /> : <Minus size={10} />}
                            {varPct > 0 ? '+' : ''}{varPct}%
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Summary bar */}
              <div className="flex items-center justify-between py-2 px-3 bg-canvas rounded-lg">
                <div className="text-xs text-t3">
                  {t('planned')}: <span className="font-medium text-t1">${(dept.totalPlanned / 1000).toFixed(0)}K</span>
                </div>
                <div className="text-xs text-t3">
                  {t('actual')}: <span className="font-medium text-t1">${(dept.totalActual / 1000).toFixed(0)}K</span>
                </div>
                <div className={`text-xs font-medium flex items-center gap-0.5 ${dept.variance > 0 ? 'text-error' : 'text-success'}`}>
                  {t('variance')}: {dept.variancePct > 0 ? '+' : ''}{dept.variancePct}% (${Math.abs(Math.round(dept.variance / 1000))}K)
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* ── Section 2: Financial Planning / Scenario Modeling ── */}
      <div className="mt-8 mb-6">
        <h2 className="text-sm font-semibold text-t1 mb-2 flex items-center gap-2">
          <Lightbulb size={20} /> {t('financialPlanning')}
        </h2>
        <p className="text-sm text-t3 mb-4">{t('whatIfAnalysis')}</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Scenario 1: Headcount Change */}
          <Card>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-tempo-100 dark:bg-tempo-900/30 flex items-center justify-center">
                <Users size={18} className="text-tempo-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-t1">{t('headcountChange')}</h3>
                <p className="text-xs text-t3">{t('scenarioModeling')}</p>
              </div>
            </div>
            <div className="p-3 bg-canvas rounded-lg mb-3">
              <p className="text-sm font-medium text-tempo-600">{t('addHeadcount')}</p>
            </div>
            <div className="border-l-2 border-tempo-400 pl-3">
              <p className="text-[0.6rem] uppercase text-t3 font-medium">{t('scenarioImpact')}</p>
              <p className="text-sm text-t1 mt-1">{t('addHeadcountImpact')}</p>
            </div>
          </Card>

          {/* Scenario 2: New Vendor Contract */}
          <Card>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800/30 flex items-center justify-center">
                <Building2 size={18} className="text-gray-500" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-t1">{t('newVendorContract')}</h3>
                <p className="text-xs text-t3">{t('scenarioModeling')}</p>
              </div>
            </div>
            <div className="p-3 bg-canvas rounded-lg mb-3">
              <p className="text-sm font-medium text-gray-600">{t('newVendor')}</p>
            </div>
            <div className="border-l-2 border-gray-300 pl-3">
              <p className="text-[0.6rem] uppercase text-t3 font-medium">{t('scenarioImpact')}</p>
              <p className="text-sm text-t1 mt-1">{t('newVendorImpact')}</p>
            </div>
          </Card>

          {/* Scenario 3: Budget Reallocation */}
          <Card>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800/30 flex items-center justify-center">
                <ArrowRightLeft size={18} className="text-gray-500" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-t1">{t('budgetReallocation')}</h3>
                <p className="text-xs text-t3">{t('scenarioModeling')}</p>
              </div>
            </div>
            <div className="p-3 bg-canvas rounded-lg mb-3">
              <p className="text-sm font-medium text-gray-600">{t('reallocate')}</p>
            </div>
            <div className="border-l-2 border-gray-300 pl-3">
              <p className="text-[0.6rem] uppercase text-t3 font-medium">{t('scenarioImpact')}</p>
              <p className="text-sm text-t1 mt-1">{t('reallocateImpact')}</p>
            </div>
          </Card>
        </div>
      </div>

      {/* ── Section 3: Rolling 12-Month Forecast ── */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-t1 flex items-center gap-2">
            <Calendar size={20} /> {t('rollingForecast')}
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-t3">{t('forecastAccuracy')}</span>
            <AIScoreBadge score={forecastAccuracy} />
          </div>
        </div>
        <p className="text-sm text-t3 mb-4">{t('rollingForecastDesc')}</p>

        {/* AI Variance Insights */}
        {varianceInsights.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
            {varianceInsights.map(insight => (
              <AIInsightCard key={insight.id} insight={insight} />
            ))}
          </div>
        )}

        <div className="space-y-4">
          {rollingByDept.map(dept => {
            const totalBdg = dept.months.reduce((s, m) => s + m.budget, 0)
            const totalAct = dept.months.filter(m => m.actual !== null).reduce((s, m) => s + (m.actual ?? 0), 0)
            const totalForecast = dept.months.reduce((s, m) => s + m.forecast, 0)
            const budgetVsForecast = totalBdg > 0 ? Math.round(((totalForecast - totalBdg) / totalBdg) * 100) : 0

            return (
              <Card key={dept.deptId}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-t1">{dept.department}</h3>
                    <p className="text-xs text-t3">12-month rolling view</p>
                  </div>
                  <Badge variant={budgetVsForecast > 5 ? 'error' : budgetVsForecast < -3 ? 'success' : 'default'}>
                    Forecast: {budgetVsForecast > 0 ? '+' : ''}{budgetVsForecast}% vs budget
                  </Badge>
                </div>

                {/* Grouped bar chart */}
                <TempoBarChart
                  data={dept.months.map(m => ({
                    name: m.month,
                    budget: m.budget,
                    forecast: m.forecast,
                    ...(m.actual !== null ? { actual: m.actual } : {}),
                  }))}
                  bars={[
                    { dataKey: 'budget', name: t('budgetLine'), color: CHART_COLORS.slate },
                    { dataKey: 'forecast', name: t('forecastLine'), color: CHART_COLORS.primary },
                    { dataKey: 'actual', name: t('actualLine'), color: CHART_COLORS.emerald },
                  ]}
                  xKey="name"
                  height={140}
                  showLegend
                  formatter={(v) => `$${(v / 1000).toFixed(0)}K`}
                  className="mb-3"
                />

                {/* Summary */}
                <div className="grid grid-cols-3 gap-3 py-2 px-3 bg-canvas rounded-lg">
                  <div className="text-center">
                    <p className="text-[0.6rem] text-t3 uppercase">{t('budgetLine')}</p>
                    <p className="text-sm font-semibold text-t1">${(totalBdg / 1000000).toFixed(2)}M</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[0.6rem] text-t3 uppercase">{t('actualLine')}</p>
                    <p className="text-sm font-semibold text-green-600">${(totalAct / 1000000).toFixed(2)}M</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[0.6rem] text-t3 uppercase">{t('forecastLine')}</p>
                    <p className="text-sm font-semibold text-tempo-600">${(totalForecast / 1000000).toFixed(2)}M</p>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      </div>

      {/* ── Section 4: Multi-Year Strategic Planning ── */}
      <div className="mt-8 mb-6">
        <h2 className="text-sm font-semibold text-t1 mb-2 flex items-center gap-2">
          <Layers size={20} /> {t('multiYearPlanning')}
        </h2>
        <p className="text-sm text-t3 mb-4">{t('multiYearDesc')}</p>

        {/* Scenario Selector */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-medium text-t1">{t('scenarioComparison')}:</span>
          {(['conservative', 'base', 'aggressive'] as const).map(scenario => (
            <button
              key={scenario}
              onClick={() => setActiveScenario(scenario)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                activeScenario === scenario
                  ? 'bg-tempo-600 text-white'
                  : 'bg-canvas border border-border text-t2 hover:text-t1 hover:border-tempo-200'
              }`}
            >
              {t(scenario)}
            </button>
          ))}
        </div>

        {/* Year-over-Year Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {demoMultiYearPlan.years.map((yr, idx) => {
            const adjRevenue = Math.round(yr.revenue * scenarioMultiplier.revenueMultiplier)
            const adjOpex = Math.round(yr.opex * scenarioMultiplier.opexMultiplier)
            const adjCapex = yr.capex
            const adjHeadcount = Math.round(yr.headcount * scenarioMultiplier.headcountMultiplier)
            const prevYear = idx > 0 ? demoMultiYearPlan.years[idx - 1] : null
            const revenueGrowth = prevYear ? Math.round(((adjRevenue - prevYear.revenue * scenarioMultiplier.revenueMultiplier) / (prevYear.revenue * scenarioMultiplier.revenueMultiplier)) * 100) : yr.growthAssumption

            return (
              <Card key={yr.year}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-t1">{yr.label}</h3>
                  <Badge variant={idx === 0 ? 'success' : 'default'}>
                    {idx === 0 ? 'Current' : `+${idx}y`}
                  </Badge>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-t3">{t('revenue')}</span>
                    <span className="font-semibold text-t1">${(adjRevenue / 1000000).toFixed(0)}M</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-t3">{t('opex')}</span>
                    <span className="font-semibold text-t1">${(adjOpex / 1000000).toFixed(0)}M</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-t3">{t('capex')}</span>
                    <span className="font-semibold text-t1">${(adjCapex / 1000000).toFixed(0)}M</span>
                  </div>
                  <div className="flex justify-between text-xs border-t border-divider pt-2">
                    <span className="text-t3">{t('headcount')}</span>
                    <span className="font-semibold text-t1">{adjHeadcount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-t3">{t('growthRate')}</span>
                    <span className={`font-semibold flex items-center gap-0.5 ${revenueGrowth > 0 ? 'text-success' : 'text-error'}`}>
                      <TrendingUp size={10} /> {revenueGrowth}%
                    </span>
                  </div>
                </div>

                {/* CapEx vs OpEx bar */}
                <div className="mt-3 pt-3 border-t border-divider">
                  <p className="text-[0.6rem] text-t3 uppercase mb-1">{t('capexVsOpex')}</p>
                  <div className="w-full h-3 bg-canvas rounded-full overflow-hidden flex">
                    <div className="h-full bg-tempo-500 transition-all" style={{ width: `${Math.round((adjOpex / (adjOpex + adjCapex)) * 100)}%` }} />
                    <div className="h-full bg-gray-400 transition-all" style={{ width: `${Math.round((adjCapex / (adjOpex + adjCapex)) * 100)}%` }} />
                  </div>
                  <div className="flex justify-between text-[0.55rem] text-t3 mt-0.5">
                    <span>{t('opex')} {Math.round((adjOpex / (adjOpex + adjCapex)) * 100)}%</span>
                    <span>{t('capex')} {Math.round((adjCapex / (adjOpex + adjCapex)) * 100)}%</span>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>

        {/* Department Breakdown Table */}
        <Card padding="none">
          <div className="px-6 py-4 border-b border-divider flex items-center justify-between">
            <h3 className="text-sm font-semibold text-t1">{t('departmentBreakdown')}</h3>
            <Badge>{activeScenario} scenario</Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-divider bg-canvas">
                  <th className="px-6 py-2 text-left text-t3 font-medium">Department</th>
                  {demoMultiYearPlan.years.map(yr => (
                    <th key={yr.year} className="px-4 py-2 text-right text-t3 font-medium" colSpan={3}>
                      {yr.label}
                    </th>
                  ))}
                </tr>
                <tr className="border-b border-divider bg-canvas/50">
                  <th className="px-6 py-1" />
                  {demoMultiYearPlan.years.map(yr => (
                    <Fragment key={yr.year}>
                      <th className="px-2 py-1 text-right text-[0.6rem] text-t3">{t('opex')}</th>
                      <th className="px-2 py-1 text-right text-[0.6rem] text-t3">{t('capex')}</th>
                      <th className="px-2 py-1 text-right text-[0.6rem] text-t3">{t('headcount')}</th>
                    </Fragment>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-divider">
                {demoMultiYearPlan.years[0].departments.map(dept => (
                  <tr key={dept.department_id} className="hover:bg-canvas/30 transition-colors">
                    <td className="px-6 py-2.5 font-medium text-t1">{dept.name}</td>
                    {demoMultiYearPlan.years.map(yr => {
                      const yrDept = yr.departments.find(d => d.department_id === dept.department_id)
                      if (!yrDept) return <td key={yr.year} colSpan={3} />
                      const adjOpex = Math.round(yrDept.opex * scenarioMultiplier.opexMultiplier)
                      const adjHC = Math.round(yrDept.headcount * scenarioMultiplier.headcountMultiplier)
                      return (
                        <Fragment key={yr.year}>
                          <td className="px-2 py-2.5 text-right text-t1">${(adjOpex / 1000000).toFixed(1)}M</td>
                          <td className="px-2 py-2.5 text-right text-t2">${(yrDept.capex / 1000000).toFixed(1)}M</td>
                          <td className="px-2 py-2.5 text-right text-t2">{adjHC}</td>
                        </Fragment>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-divider bg-canvas/50 font-semibold">
                  <td className="px-6 py-2.5 text-t1">{t('totalExpense')}</td>
                  {demoMultiYearPlan.years.map(yr => {
                    const totalOpex = Math.round(yr.departments.reduce((s, d) => s + d.opex, 0) * scenarioMultiplier.opexMultiplier)
                    const totalCapex = yr.departments.reduce((s, d) => s + d.capex, 0)
                    const totalHC = Math.round(yr.departments.reduce((s, d) => s + d.headcount, 0) * scenarioMultiplier.headcountMultiplier)
                    return (
                      <Fragment key={yr.year}>
                        <td className="px-2 py-2.5 text-right text-t1">${(totalOpex / 1000000).toFixed(1)}M</td>
                        <td className="px-2 py-2.5 text-right text-t1">${(totalCapex / 1000000).toFixed(1)}M</td>
                        <td className="px-2 py-2.5 text-right text-t1">{totalHC}</td>
                      </Fragment>
                    )
                  })}
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      </div>

      {/* New/Edit Budget Modal */}
      <Modal open={showBudgetModal} onClose={() => setShowBudgetModal(false)} title={editingBudget ? t('editBudgetModal') : t('createBudgetModal')}>
        <div className="space-y-4">
          <Input label={t('budgetName')} placeholder={t('budgetNamePlaceholder')} value={budgetForm.name} onChange={(e) => setBudgetForm({ ...budgetForm, name: e.target.value })} />
          <Select label={tc('department')} value={budgetForm.department_id} onChange={(e) => setBudgetForm({ ...budgetForm, department_id: e.target.value })} options={departments.map(d => ({ value: d.id, label: d.name }))} />
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('totalAmountLabel')} type="number" placeholder={t('totalAmountPlaceholder')} value={budgetForm.total_amount} onChange={(e) => setBudgetForm({ ...budgetForm, total_amount: e.target.value })} />
            {editingBudget && (
              <Input label={t('spentAmount')} type="number" placeholder={t('spentAmountPlaceholder')} value={budgetForm.spent_amount} onChange={(e) => setBudgetForm({ ...budgetForm, spent_amount: e.target.value })} />
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select label={t('fiscalYear')} value={budgetForm.fiscal_year} onChange={(e) => setBudgetForm({ ...budgetForm, fiscal_year: e.target.value })} options={[
              { value: '2025', label: '2025' },
              { value: '2026', label: '2026' },
              { value: '2027', label: '2027' },
            ]} />
            <Select label={tc('currency')} value={budgetForm.currency} onChange={(e) => setBudgetForm({ ...budgetForm, currency: e.target.value })} options={[
              { value: 'USD', label: 'USD' },
              { value: 'EUR', label: 'EUR' },
              { value: 'GBP', label: 'GBP' },
              { value: 'XOF', label: 'XOF' },
              { value: 'NGN', label: 'NGN' },
            ]} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowBudgetModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitBudget}>{editingBudget ? tc('saveChanges') : t('createBudget')}</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
