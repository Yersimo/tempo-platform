'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Header } from '@/components/layout/header'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/ui/stat-card'
import { Tabs } from '@/components/ui/tabs'
import { Modal } from '@/components/ui/modal'
import { Input, Select } from '@/components/ui/input'
import {
  TempoLineChart,
  TempoBarChart,
  TempoAreaChart,
  CHART_COLORS,
  CHART_SERIES,
} from '@/components/ui/charts'
import {
  TrendingUp, Users, DollarSign, BarChart3, Target,
  Calendar, ArrowRight, Plus, Save, CheckCircle2,
  AlertTriangle, RefreshCw, Layers, GitCompare, Library,
  ChevronDown,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { useTempo } from '@/lib/store'
import { PageSkeleton } from '@/components/ui/page-skeleton'
import {
  computeDailySnapshot,
  generateRollingForecast,
  compareScenarios,
  ASSUMPTION_PRESETS,
  formatCents,
  type ForecastAssumptions,
  type MonthlyForecast,
  type DailySnapshot,
} from '@/lib/analytics/aggregation-engine'

// ═══════════════════════════════════════════════════════════════
// Workforce Planning & Rolling Forecast Page
// ═══════════════════════════════════════════════════════════════

const TABS = [
  { id: 'forecast', label: 'Rolling Forecast' },
  { id: 'compare', label: 'Scenario Comparison' },
  { id: 'actuals', label: 'Actuals vs Forecast' },
  { id: 'library', label: 'Assumptions Library' },
]

function shortPeriod(period: string): string {
  const [y, m] = period.split('-')
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${months[parseInt(m, 10) - 1]} '${y.slice(2)}`
}

export default function WorkforcePlanningPage() {
  const {
    employees, departments, payrollRuns, jobPostings, applications,
    enrollments, complianceRequirements, ensureModulesLoaded,
  } = useTempo()

  const [pageLoading, setPageLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('forecast')

  useEffect(() => {
    ensureModulesLoaded?.([
      'employees', 'departments', 'payrollRuns', 'jobPostings',
      'applications', 'enrollments', 'complianceRequirements',
      'analyticsSnapshots', 'planningScenarios', 'forecastEntries',
    ])?.then?.(() => setPageLoading(false))?.catch?.(() => setPageLoading(false))
    const t = setTimeout(() => setPageLoading(false), 2000)
    return () => clearTimeout(t)
  }, [ensureModulesLoaded])

  // Build store-like object for snapshot computation
  const storeData = useMemo(() => ({
    employees, departments, payrollRuns, jobPostings,
    applications, enrollments, complianceRequirements,
  }), [employees, departments, payrollRuns, jobPostings, applications, enrollments, complianceRequirements])

  const snapshot = useMemo(() => computeDailySnapshot(storeData), [storeData])

  // ─── Forecast assumptions state ──────────────────────────────
  const [assumptions, setAssumptions] = useState<ForecastAssumptions>(
    ASSUMPTION_PRESETS.base.assumptions,
  )
  const forecast = useMemo(
    () => generateRollingForecast(snapshot, assumptions),
    [snapshot, assumptions],
  )

  // ─── Scenario comparison state ───────────────────────────────
  const [scenarioAKey, setScenarioAKey] = useState('base')
  const [scenarioBKey, setScenarioBKey] = useState('aggressive')

  const scenarioComparison = useMemo(() => {
    const presetA = ASSUMPTION_PRESETS[scenarioAKey] || ASSUMPTION_PRESETS.base
    const presetB = ASSUMPTION_PRESETS[scenarioBKey] || ASSUMPTION_PRESETS.aggressive
    const fA = generateRollingForecast(snapshot, presetA.assumptions)
    const fB = generateRollingForecast(snapshot, presetB.assumptions)
    return { forecastA: fA, forecastB: fB, comparison: compareScenarios(fA, fB) }
  }, [snapshot, scenarioAKey, scenarioBKey])

  // ─── Saved scenarios state ───────────────────────────────────
  const [savedScenarios, setSavedScenarios] = useState<{ name: string; assumptions: ForecastAssumptions }[]>([])
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [scenarioName, setScenarioName] = useState('')

  const handleSaveScenario = useCallback(() => {
    if (!scenarioName.trim()) return
    setSavedScenarios((prev) => [...prev, { name: scenarioName.trim(), assumptions: { ...assumptions } }])
    setScenarioName('')
    setShowSaveModal(false)
  }, [scenarioName, assumptions])

  // ─── Stats from forecast ─────────────────────────────────────
  const totalCost12Mo = forecast.reduce((s, m) => s + m.totalCost, 0)
  const endingHeadcount = forecast[forecast.length - 1]?.headcount || 0
  const totalHires = forecast.reduce((s, m) => s + m.hires, 0)
  const totalAttrition = forecast.reduce((s, m) => s + m.attrition, 0)

  if (pageLoading) return <PageSkeleton />

  return (
    <>
      <Header title="Workforce Planning" subtitle="Rolling forecasts, scenario analysis & budget planning" />

      <div className="p-6 space-y-6">
        {/* KPI Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Current Headcount"
            value={snapshot.headcount.total}
            icon={<Users size={20} />}
            change={`${snapshot.attrition.turnoverRate}% turnover`}
            changeType="neutral"
          />
          <StatCard
            label="12-Mo Projected Cost"
            value={formatCents(totalCost12Mo)}
            icon={<DollarSign size={20} />}
            change={`${totalHires} hires projected`}
            changeType="positive"
          />
          <StatCard
            label="Ending Headcount"
            value={endingHeadcount}
            icon={<Target size={20} />}
            change={`${endingHeadcount - snapshot.headcount.total >= 0 ? '+' : ''}${endingHeadcount - snapshot.headcount.total} net`}
            changeType={endingHeadcount >= snapshot.headcount.total ? 'positive' : 'negative'}
          />
          <StatCard
            label="Avg Monthly Cost"
            value={formatCents(Math.round(totalCost12Mo / 12))}
            icon={<BarChart3 size={20} />}
            change={`${totalAttrition} departures`}
            changeType="neutral"
          />
        </div>

        <Tabs tabs={TABS} active={activeTab} onChange={setActiveTab} />

        {/* ════════════════════════════════════════════════════════ */}
        {/* Tab 1: Rolling Forecast                                 */}
        {/* ════════════════════════════════════════════════════════ */}
        {activeTab === 'forecast' && (
          <div className="space-y-6">
            {/* Assumptions Panel */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers size={18} /> Forecast Assumptions
                </CardTitle>
              </CardHeader>
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <SliderInput
                    label="Monthly Hiring Rate"
                    value={assumptions.monthlyHiringRate * 100}
                    min={0} max={10} step={0.5}
                    unit="%"
                    onChange={(v) => setAssumptions((a) => ({ ...a, monthlyHiringRate: v / 100 }))}
                  />
                  <SliderInput
                    label="Annual Attrition Rate"
                    value={assumptions.annualAttritionRate * 100}
                    min={0} max={30} step={1}
                    unit="%"
                    onChange={(v) => setAssumptions((a) => ({ ...a, annualAttritionRate: v / 100 }))}
                  />
                  <SliderInput
                    label="Annual Salary Increase"
                    value={assumptions.annualSalaryIncrease}
                    min={0} max={15} step={0.5}
                    unit="%"
                    onChange={(v) => setAssumptions((a) => ({ ...a, annualSalaryIncrease: v }))}
                  />
                  <SliderInput
                    label="Benefits (% of Salary)"
                    value={assumptions.benefitsAsPercentOfSalary}
                    min={10} max={40} step={1}
                    unit="%"
                    onChange={(v) => setAssumptions((a) => ({ ...a, benefitsAsPercentOfSalary: v }))}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <SliderInput
                    label="Equipment Cost / Hire"
                    value={assumptions.equipmentCostPerHire / 100}
                    min={0} max={5000} step={100}
                    unit="$"
                    onChange={(v) => setAssumptions((a) => ({ ...a, equipmentCostPerHire: v * 100 }))}
                  />
                  <SliderInput
                    label="Recruiting Cost / Hire"
                    value={assumptions.recruitingCostPerHire / 100}
                    min={0} max={10000} step={250}
                    unit="$"
                    onChange={(v) => setAssumptions((a) => ({ ...a, recruitingCostPerHire: v * 100 }))}
                  />
                  <SliderInput
                    label="Training Cost / Hire"
                    value={assumptions.trainingCostPerHire / 100}
                    min={0} max={5000} step={100}
                    unit="$"
                    onChange={(v) => setAssumptions((a) => ({ ...a, trainingCostPerHire: v * 100 }))}
                  />
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <Button size="sm" variant="outline" onClick={() => setAssumptions(ASSUMPTION_PRESETS.base.assumptions)}>
                    <RefreshCw size={14} className="mr-1" /> Reset to Default
                  </Button>
                  <Button size="sm" variant="primary" onClick={() => setShowSaveModal(true)}>
                    <Save size={14} className="mr-1" /> Save Scenario
                  </Button>
                </div>
              </div>
            </Card>

            {/* Headcount Line Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Projected Headcount (12-Month)</CardTitle>
              </CardHeader>
              <div className="p-4">
                <TempoLineChart
                  data={forecast.map((m) => ({
                    name: shortPeriod(m.period),
                    headcount: m.headcount,
                    hires: m.hires,
                    attrition: m.attrition,
                  }))}
                  lines={[
                    { dataKey:'headcount', name: 'Headcount', color: CHART_COLORS.primary },
                    { dataKey:'hires', name: 'Hires', color: CHART_COLORS.emerald },
                    { dataKey:'attrition', name: 'Attrition', color: CHART_COLORS.rose },
                  ]}
                  height={300}
                  showLegend
                  showDots
                />
              </div>
            </Card>

            {/* Cost Stacked Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Projected Cost Breakdown (12-Month)</CardTitle>
              </CardHeader>
              <div className="p-4">
                <TempoBarChart
                  data={forecast.map((m) => ({
                    name: shortPeriod(m.period),
                    Salary: m.salaryCost / 100,
                    Benefits: m.benefitsCost / 100,
                    Equipment: m.equipmentCost / 100,
                    Recruiting: m.recruitingCost / 100,
                    Training: m.trainingCost / 100,
                  }))}
                  bars={[
                    { dataKey:'Salary', name: 'Salary', color: CHART_COLORS.primary, stackId: 'cost' },
                    { dataKey:'Benefits', name: 'Benefits', color: CHART_COLORS.blue, stackId: 'cost' },
                    { dataKey:'Equipment', name: 'Equipment', color: CHART_COLORS.emerald, stackId: 'cost' },
                    { dataKey:'Recruiting', name: 'Recruiting', color: CHART_COLORS.violet, stackId: 'cost' },
                    { dataKey:'Training', name: 'Training', color: CHART_COLORS.amber, stackId: 'cost' },
                  ]}
                  height={320}
                  showLegend
                  formatter={(v) => `$${v.toLocaleString()}`}
                />
              </div>
            </Card>

            {/* Summary Table */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Detail</CardTitle>
              </CardHeader>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-700 text-left">
                      <th className="p-3 font-medium text-zinc-500">Period</th>
                      <th className="p-3 font-medium text-zinc-500 text-right">Headcount</th>
                      <th className="p-3 font-medium text-zinc-500 text-right">Hires</th>
                      <th className="p-3 font-medium text-zinc-500 text-right">Attrition</th>
                      <th className="p-3 font-medium text-zinc-500 text-right">Salary</th>
                      <th className="p-3 font-medium text-zinc-500 text-right">Benefits</th>
                      <th className="p-3 font-medium text-zinc-500 text-right">Total Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {forecast.map((m) => (
                      <tr key={m.period} className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                        <td className="p-3 font-medium">{shortPeriod(m.period)}</td>
                        <td className="p-3 text-right">{m.headcount}</td>
                        <td className="p-3 text-right text-emerald-600">+{m.hires}</td>
                        <td className="p-3 text-right text-red-500">-{m.attrition}</td>
                        <td className="p-3 text-right">{formatCents(m.salaryCost)}</td>
                        <td className="p-3 text-right">{formatCents(m.benefitsCost)}</td>
                        <td className="p-3 text-right font-semibold">{formatCents(m.totalCost)}</td>
                      </tr>
                    ))}
                    <tr className="bg-zinc-50 dark:bg-zinc-900 font-semibold">
                      <td className="p-3">Total (12-Mo)</td>
                      <td className="p-3 text-right">{endingHeadcount}</td>
                      <td className="p-3 text-right text-emerald-600">+{totalHires}</td>
                      <td className="p-3 text-right text-red-500">-{totalAttrition}</td>
                      <td className="p-3 text-right">{formatCents(forecast.reduce((s, m) => s + m.salaryCost, 0))}</td>
                      <td className="p-3 text-right">{formatCents(forecast.reduce((s, m) => s + m.benefitsCost, 0))}</td>
                      <td className="p-3 text-right">{formatCents(totalCost12Mo)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════ */}
        {/* Tab 2: Scenario Comparison                              */}
        {/* ════════════════════════════════════════════════════════ */}
        {activeTab === 'compare' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GitCompare size={18} /> Compare Scenarios
                </CardTitle>
              </CardHeader>
              <div className="p-4 space-y-4">
                <div className="flex flex-wrap items-center gap-4">
                  <div>
                    <label className="text-xs font-medium text-zinc-500 block mb-1">Scenario A</label>
                    <select
                      className="px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
                      value={scenarioAKey}
                      onChange={(e) => setScenarioAKey(e.target.value)}
                    >
                      {Object.entries(ASSUMPTION_PRESETS).map(([key, p]) => (
                        <option key={key} value={key}>{p.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center pt-5">
                    <ArrowRight size={20} className="text-zinc-400" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-zinc-500 block mb-1">Scenario B</label>
                    <select
                      className="px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
                      value={scenarioBKey}
                      onChange={(e) => setScenarioBKey(e.target.value)}
                    >
                      {Object.entries(ASSUMPTION_PRESETS).map(([key, p]) => (
                        <option key={key} value={key}>{p.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Difference summary */}
                <div className="flex flex-wrap gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg px-4 py-3">
                    <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">Headcount Difference (End)</div>
                    <div className="text-xl font-bold text-blue-700 dark:text-blue-300">
                      {scenarioComparison.comparison.headcountDiff[11] >= 0 ? '+' : ''}
                      {scenarioComparison.comparison.headcountDiff[11]} people
                    </div>
                  </div>
                  <div className="bg-teal-50 dark:bg-teal-900/20 rounded-lg px-4 py-3">
                    <div className="text-xs text-teal-700 dark:text-teal-400 font-medium">Total Cost Difference (12-Mo)</div>
                    <div className="text-xl font-bold text-teal-800 dark:text-teal-300">
                      {scenarioComparison.comparison.totalDifference >= 0 ? '+' : ''}
                      {formatCents(scenarioComparison.comparison.totalDifference)}
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Headcount comparison */}
            <Card>
              <CardHeader>
                <CardTitle>Headcount: {ASSUMPTION_PRESETS[scenarioAKey]?.label} vs {ASSUMPTION_PRESETS[scenarioBKey]?.label}</CardTitle>
              </CardHeader>
              <div className="p-4">
                <TempoLineChart
                  data={scenarioComparison.forecastA.map((m, i) => ({
                    name: shortPeriod(m.period),
                    [ASSUMPTION_PRESETS[scenarioAKey]?.label || 'A']: m.headcount,
                    [ASSUMPTION_PRESETS[scenarioBKey]?.label || 'B']: scenarioComparison.forecastB[i]?.headcount || 0,
                  }))}
                  lines={[
                    { dataKey:ASSUMPTION_PRESETS[scenarioAKey]?.label || 'A', name: ASSUMPTION_PRESETS[scenarioAKey]?.label || 'A', color: CHART_COLORS.primary },
                    { dataKey:ASSUMPTION_PRESETS[scenarioBKey]?.label || 'B', name: ASSUMPTION_PRESETS[scenarioBKey]?.label || 'B', color: CHART_COLORS.blue },
                  ]}
                  height={300}
                  showLegend
                  showDots
                />
              </div>
            </Card>

            {/* Cost comparison */}
            <Card>
              <CardHeader>
                <CardTitle>Total Monthly Cost Comparison</CardTitle>
              </CardHeader>
              <div className="p-4">
                <TempoBarChart
                  data={scenarioComparison.forecastA.map((m, i) => ({
                    name: shortPeriod(m.period),
                    [ASSUMPTION_PRESETS[scenarioAKey]?.label || 'A']: m.totalCost / 100,
                    [ASSUMPTION_PRESETS[scenarioBKey]?.label || 'B']: (scenarioComparison.forecastB[i]?.totalCost || 0) / 100,
                  }))}
                  bars={[
                    { dataKey:ASSUMPTION_PRESETS[scenarioAKey]?.label || 'A', name: ASSUMPTION_PRESETS[scenarioAKey]?.label || 'A', color: CHART_COLORS.primary },
                    { dataKey:ASSUMPTION_PRESETS[scenarioBKey]?.label || 'B', name: ASSUMPTION_PRESETS[scenarioBKey]?.label || 'B', color: CHART_COLORS.blue },
                  ]}
                  height={320}
                  showLegend
                  formatter={(v) => `$${v.toLocaleString()}`}
                />
              </div>
            </Card>

            {/* Side-by-side table */}
            <Card>
              <CardHeader><CardTitle>Period-by-Period Comparison</CardTitle></CardHeader>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-700 text-left">
                      <th className="p-3 font-medium text-zinc-500">Period</th>
                      <th className="p-3 font-medium text-zinc-500 text-right">HC (A)</th>
                      <th className="p-3 font-medium text-zinc-500 text-right">HC (B)</th>
                      <th className="p-3 font-medium text-zinc-500 text-right">HC Diff</th>
                      <th className="p-3 font-medium text-zinc-500 text-right">Cost (A)</th>
                      <th className="p-3 font-medium text-zinc-500 text-right">Cost (B)</th>
                      <th className="p-3 font-medium text-zinc-500 text-right">Cost Diff</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scenarioComparison.forecastA.map((a, i) => {
                      const b = scenarioComparison.forecastB[i]
                      const hcDiff = a.headcount - (b?.headcount || 0)
                      const costDiff = a.totalCost - (b?.totalCost || 0)
                      return (
                        <tr key={a.period} className="border-b border-zinc-100 dark:border-zinc-800">
                          <td className="p-3">{shortPeriod(a.period)}</td>
                          <td className="p-3 text-right">{a.headcount}</td>
                          <td className="p-3 text-right">{b?.headcount || 0}</td>
                          <td className={cn('p-3 text-right font-medium', hcDiff > 0 ? 'text-emerald-600' : hcDiff < 0 ? 'text-red-500' : '')}>
                            {hcDiff > 0 ? '+' : ''}{hcDiff}
                          </td>
                          <td className="p-3 text-right">{formatCents(a.totalCost)}</td>
                          <td className="p-3 text-right">{formatCents(b?.totalCost || 0)}</td>
                          <td className={cn('p-3 text-right font-medium', costDiff > 0 ? 'text-red-500' : costDiff < 0 ? 'text-emerald-600' : '')}>
                            {costDiff > 0 ? '+' : ''}{formatCents(costDiff)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════ */}
        {/* Tab 3: Actuals vs Forecast                              */}
        {/* ════════════════════════════════════════════════════════ */}
        {activeTab === 'actuals' && (
          <ActualsVsForecast forecast={forecast} snapshot={snapshot} />
        )}

        {/* ════════════════════════════════════════════════════════ */}
        {/* Tab 4: Assumptions Library                              */}
        {/* ════════════════════════════════════════════════════════ */}
        {activeTab === 'library' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Library size={18} /> Preset Assumption Sets
                </CardTitle>
              </CardHeader>
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(ASSUMPTION_PRESETS).map(([key, preset]) => (
                  <div
                    key={key}
                    className="border border-zinc-200 dark:border-zinc-700 rounded-lg p-4 hover:border-teal-300 dark:hover:border-teal-800 transition cursor-pointer"
                    onClick={() => {
                      setAssumptions(preset.assumptions)
                      setActiveTab('forecast')
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">{preset.label}</h3>
                      <Badge variant="info">{key}</Badge>
                    </div>
                    <p className="text-sm text-zinc-500 mb-3">{preset.description}</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-zinc-400">Hiring:</span>{' '}
                        <span className="font-medium">{(preset.assumptions.monthlyHiringRate * 100).toFixed(1)}%/mo</span>
                      </div>
                      <div>
                        <span className="text-zinc-400">Attrition:</span>{' '}
                        <span className="font-medium">{(preset.assumptions.annualAttritionRate * 100).toFixed(0)}%/yr</span>
                      </div>
                      <div>
                        <span className="text-zinc-400">Salary Inc:</span>{' '}
                        <span className="font-medium">{preset.assumptions.annualSalaryIncrease}%/yr</span>
                      </div>
                      <div>
                        <span className="text-zinc-400">Benefits:</span>{' '}
                        <span className="font-medium">{preset.assumptions.benefitsAsPercentOfSalary}% of salary</span>
                      </div>
                      <div>
                        <span className="text-zinc-400">Equipment:</span>{' '}
                        <span className="font-medium">${(preset.assumptions.equipmentCostPerHire / 100).toLocaleString()}/hire</span>
                      </div>
                      <div>
                        <span className="text-zinc-400">Recruiting:</span>{' '}
                        <span className="font-medium">${(preset.assumptions.recruitingCostPerHire / 100).toLocaleString()}/hire</span>
                      </div>
                    </div>
                    <div className="mt-3 flex justify-end">
                      <Button size="sm" variant="outline">
                        Apply <ArrowRight size={14} className="ml-1" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Saved custom scenarios */}
            {savedScenarios.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Custom Saved Scenarios</CardTitle>
                </CardHeader>
                <div className="p-4 space-y-3">
                  {savedScenarios.map((sc, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between border border-zinc-200 dark:border-zinc-700 rounded-lg p-3 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                      onClick={() => {
                        setAssumptions(sc.assumptions)
                        setActiveTab('forecast')
                      }}
                    >
                      <div>
                        <span className="font-medium">{sc.name}</span>
                        <span className="text-xs text-zinc-400 ml-2">
                          {(sc.assumptions.monthlyHiringRate * 100).toFixed(1)}% hiring, {(sc.assumptions.annualAttritionRate * 100).toFixed(0)}% attrition
                        </span>
                      </div>
                      <Button size="sm" variant="outline">Apply</Button>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Save Scenario Modal */}
      <Modal open={showSaveModal} title="Save Scenario" onClose={() => setShowSaveModal(false)}>
          <div className="space-y-4">
            <Input
              label="Scenario Name"
              value={scenarioName}
              onChange={(e) => setScenarioName(e.target.value)}
              placeholder="e.g., Q2 Growth Plan"
            />
            <div className="text-sm text-zinc-500">
              This will save current assumptions: {(assumptions.monthlyHiringRate * 100).toFixed(1)}% hiring,{' '}
              {(assumptions.annualAttritionRate * 100).toFixed(0)}% attrition,{' '}
              {assumptions.annualSalaryIncrease}% salary increase
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowSaveModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleSaveScenario} disabled={!scenarioName.trim()}>
                <Save size={14} className="mr-1" /> Save
              </Button>
            </div>
          </div>
      </Modal>
    </>
  )
}

// ═══════════════════════════════════════════════════════════════
// Sub-components
// ═══════════════════════════════════════════════════════════════

function SliderInput({
  label, value, min, max, step, unit, onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  unit: string
  onChange: (v: number) => void
}) {
  return (
    <div>
      <label className="text-xs font-medium text-zinc-500 block mb-1">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="flex-1 h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-teal-700"
        />
        <span className="text-sm font-mono font-medium w-16 text-right">
          {unit === '$' ? `$${value.toLocaleString()}` : `${value}${unit}`}
        </span>
      </div>
    </div>
  )
}

function ActualsVsForecast({
  forecast,
  snapshot,
}: {
  forecast: MonthlyForecast[]
  snapshot: DailySnapshot
}) {
  // Generate mock actuals for past months (demo: first 3 months with slight variance)
  const now = new Date()
  const actualsData = forecast.map((m, i) => {
    const forecastMonth = new Date(m.period + '-01')
    const isPast = forecastMonth < now
    if (!isPast || i >= 3) {
      return {
        period: m.period,
        forecastHC: m.headcount,
        actualHC: null as number | null,
        hcVariance: null as number | null,
        forecastCost: m.totalCost,
        actualCost: null as number | null,
        costVariance: null as number | null,
        costVariancePct: null as number | null,
      }
    }
    // Simulate actuals with +/- 5% variance
    const hcVariance = Math.round((Math.random() - 0.5) * 0.1 * m.headcount)
    const costVariance = Math.round((Math.random() - 0.5) * 0.08 * m.totalCost)
    const actualHC = m.headcount + hcVariance
    const actualCost = m.totalCost + costVariance
    return {
      period: m.period,
      forecastHC: m.headcount,
      actualHC,
      hcVariance,
      forecastCost: m.totalCost,
      actualCost,
      costVariance,
      costVariancePct: m.totalCost > 0 ? Math.round((costVariance / m.totalCost) * 100) : 0,
    }
  })

  const withActuals = actualsData.filter((a) => a.actualHC !== null)
  const accuracyScores = withActuals.map((a) => {
    const hcAccuracy = a.forecastHC > 0 ? 100 - Math.abs((a.hcVariance! / a.forecastHC) * 100) : 100
    const costAccuracy = a.forecastCost > 0 ? 100 - Math.abs((a.costVariance! / a.forecastCost) * 100) : 100
    return (hcAccuracy + costAccuracy) / 2
  })
  const avgAccuracy = accuracyScores.length > 0 ? Math.round(accuracyScores.reduce((s, v) => s + v, 0) / accuracyScores.length) : 0

  return (
    <div className="space-y-6">
      {/* Accuracy score */}
      <Card>
        <div className="p-4 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full border-4 border-emerald-500 flex items-center justify-center">
            <span className="text-xl font-bold text-emerald-600">{avgAccuracy}%</span>
          </div>
          <div>
            <h3 className="font-semibold text-lg">Forecasting Accuracy</h3>
            <p className="text-sm text-zinc-500">Based on {withActuals.length} month(s) of actuals data</p>
          </div>
        </div>
      </Card>

      {/* Actuals chart */}
      {withActuals.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Actuals vs Forecast (Cost)</CardTitle></CardHeader>
          <div className="p-4">
            <TempoBarChart
              data={actualsData.filter((a) => a.actualCost !== null).map((a) => ({
                name: shortPeriod(a.period),
                Forecast: a.forecastCost / 100,
                Actual: (a.actualCost || 0) / 100,
              }))}
              bars={[
                { dataKey:'Forecast', name: 'Forecast', color: CHART_COLORS.slate },
                { dataKey:'Actual', name: 'Actual', color: CHART_COLORS.primary },
              ]}
              height={280}
              showLegend
              formatter={(v) => `$${v.toLocaleString()}`}
            />
          </div>
        </Card>
      )}

      {/* Table */}
      <Card>
        <CardHeader><CardTitle>Monthly Actuals vs Forecast</CardTitle></CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-700 text-left">
                <th className="p-3 font-medium text-zinc-500">Period</th>
                <th className="p-3 font-medium text-zinc-500 text-right">Forecast HC</th>
                <th className="p-3 font-medium text-zinc-500 text-right">Actual HC</th>
                <th className="p-3 font-medium text-zinc-500 text-right">Variance</th>
                <th className="p-3 font-medium text-zinc-500 text-right">Forecast Cost</th>
                <th className="p-3 font-medium text-zinc-500 text-right">Actual Cost</th>
                <th className="p-3 font-medium text-zinc-500 text-right">Variance</th>
                <th className="p-3 font-medium text-zinc-500 text-right">Var %</th>
              </tr>
            </thead>
            <tbody>
              {actualsData.map((a) => (
                <tr key={a.period} className="border-b border-zinc-100 dark:border-zinc-800">
                  <td className="p-3 font-medium">{shortPeriod(a.period)}</td>
                  <td className="p-3 text-right">{a.forecastHC}</td>
                  <td className="p-3 text-right">{a.actualHC ?? <span className="text-zinc-300">--</span>}</td>
                  <td className={cn('p-3 text-right', a.hcVariance !== null && (a.hcVariance > 0 ? 'text-red-500' : a.hcVariance < 0 ? 'text-emerald-600' : ''))}>
                    {a.hcVariance !== null ? (a.hcVariance > 0 ? `+${a.hcVariance}` : a.hcVariance) : <span className="text-zinc-300">--</span>}
                  </td>
                  <td className="p-3 text-right">{formatCents(a.forecastCost)}</td>
                  <td className="p-3 text-right">
                    {a.actualCost !== null ? formatCents(a.actualCost) : <span className="text-zinc-300">--</span>}
                  </td>
                  <td className={cn('p-3 text-right font-medium', a.costVariance !== null && (a.costVariance > 0 ? 'text-red-500' : a.costVariance < 0 ? 'text-emerald-600' : ''))}>
                    {a.costVariance !== null ? (a.costVariance > 0 ? `+${formatCents(a.costVariance)}` : formatCents(a.costVariance)) : <span className="text-zinc-300">--</span>}
                  </td>
                  <td className={cn('p-3 text-right', a.costVariancePct !== null && (a.costVariancePct > 0 ? 'text-red-500' : a.costVariancePct < 0 ? 'text-emerald-600' : ''))}>
                    {a.costVariancePct !== null ? `${a.costVariancePct > 0 ? '+' : ''}${a.costVariancePct}%` : <span className="text-zinc-300">--</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
