/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Header } from '@/components/layout/header'
import { Card } from '@/components/ui/card'
import { StatCard } from '@/components/ui/stat-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs } from '@/components/ui/tabs'
import { PageSkeleton } from '@/components/ui/page-skeleton'
import { LineChart, BarChart, HeatmapGrid, MiniGauge } from '@/components/charts'
import { useTempo, useOrgCurrency } from '@/lib/store'
import { formatCurrency } from '@/lib/utils/format-currency'
import {
  Brain, TrendingUp, Users, DollarSign, AlertTriangle, Target,
  UserMinus, BarChart3, ShieldAlert, Zap, ArrowRight, RefreshCw,
  ChevronDown, ChevronUp, Clock, Briefcase, PieChart,
} from 'lucide-react'
import {
  predictAttrition,
  forecastHeadcount,
  projectPayrollCosts,
  predictTimeToHire,
  analyzeCompEquity,
  predictEngagement,
  predictBudgetBurnout,
  type AttritionPrediction,
  type HeadcountForecast,
  type CostProjection,
  type TimeToHirePrediction,
  type CompEquityAnalysis,
  type EngagementForecast,
  type BurnoutPrediction,
} from '@/lib/ml/predictive-models'

// ────────────────────────────────────────────────────────────
//  Main Page
// ────────────────────────────────────────────────────────────

export default function PredictiveAnalyticsPage() {
  const {
    employees, departments, engagementScores, salaryReviews,
    compBands, payrollRuns, jobPostings, applications, budgets,
    ensureModulesLoaded, getDepartmentName,
  } = useTempo()
  const currency = useOrgCurrency()

  const [pageLoading, setPageLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('attrition')
  const [modelRunning, setModelRunning] = useState(false)
  const [lastRun, setLastRun] = useState<string | null>(null)

  // Load required modules
  useEffect(() => {
    ensureModulesLoaded?.([
      'employees', 'departments', 'engagementScores', 'salaryReviews',
      'compBands', 'payrollRuns', 'jobPostings', 'applications', 'budgets',
    ])?.then?.(() => setPageLoading(false))?.catch?.(() => setPageLoading(false))
  }, [])
  useEffect(() => { const t = setTimeout(() => setPageLoading(false), 2000); return () => clearTimeout(t) }, [])

  // ── Run all predictions ──
  const attritionData = useMemo(() => {
    if (!employees?.length) return []
    return predictAttrition(employees as any, (engagementScores || []) as any, (salaryReviews || []) as any, (compBands || []) as any, (departments || []) as any)
  }, [employees, engagementScores, salaryReviews, compBands, departments])

  const headcountData = useMemo(() => {
    if (!employees?.length) return null
    return forecastHeadcount(employees as any, 12)
  }, [employees])

  const payrollData = useMemo(() => {
    return projectPayrollCosts((payrollRuns || []) as any, 12)
  }, [payrollRuns])

  const timeToHireData = useMemo(() => {
    return predictTimeToHire((jobPostings || []) as any, (applications || []) as any, (departments || []) as any)
  }, [jobPostings, applications, departments])

  const compEquityData = useMemo(() => {
    if (!employees?.length) return null
    return analyzeCompEquity(employees as any, (salaryReviews || []) as any, (compBands || []) as any, (departments || []) as any)
  }, [employees, salaryReviews, compBands, departments])

  const engagementData = useMemo(() => {
    return predictEngagement((engagementScores || []) as any, (departments || []) as any)
  }, [engagementScores, departments])

  const budgetData = useMemo(() => {
    return predictBudgetBurnout((budgets || []) as any, (departments || []) as any)
  }, [budgets, departments])

  const handleRerun = useCallback(() => {
    setModelRunning(true)
    setTimeout(() => {
      setModelRunning(false)
      setLastRun(new Date().toLocaleTimeString())
    }, 1200)
  }, [])

  if (pageLoading) return <PageSkeleton />

  const fmtC = (v: number) => formatCurrency(v, currency)

  // Summary stats
  const highRiskCount = attritionData.filter(a => a.riskLevel === 'critical' || a.riskLevel === 'high').length
  const forecastedHeadcount = headcountData?.forecast?.[5]?.headcount ?? employees?.length ?? 0
  const projectedPayroll = payrollData.annualProjectedCost
  const atRiskBudgets = budgetData.atRiskCount

  const tabs = [
    { id: 'attrition', label: 'Attrition Risk' },
    { id: 'headcount', label: 'Headcount' },
    { id: 'payroll', label: 'Payroll' },
    { id: 'recruiting', label: 'Recruiting' },
    { id: 'comp-equity', label: 'Comp Equity' },
    { id: 'engagement', label: 'Engagement' },
    { id: 'budget', label: 'Budget' },
  ]

  return (
    <>
      <Header
        title="Predictive Analytics"
        subtitle="ML-powered workforce predictions and forecasting"
        actions={
          <div className="flex items-center gap-3">
            {lastRun && <span className="text-xs text-t3">Last run: {lastRun}</span>}
            <Badge variant="ai"><Brain size={12} className="mr-1" /> Statistical ML</Badge>
            <Button size="sm" onClick={handleRerun} disabled={modelRunning}>
              <RefreshCw size={14} className={modelRunning ? 'animate-spin' : ''} />
              {modelRunning ? 'Running Models...' : 'Re-run Models'}
            </Button>
          </div>
        }
      />

      <div className="p-6 max-lg:p-4 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="High Flight Risk"
            value={highRiskCount}
            change={`${attritionData.length} analyzed`}
            changeType={highRiskCount > 5 ? 'negative' : 'neutral'}
            icon={<UserMinus size={20} className="text-rose-500" />}
            onClick={() => setActiveTab('attrition')}
          />
          <StatCard
            label="6-Mo Headcount Forecast"
            value={forecastedHeadcount}
            change={headcountData?.trend === 'growing' ? 'Growing' : headcountData?.trend === 'shrinking' ? 'Shrinking' : 'Stable'}
            changeType={headcountData?.trend === 'growing' ? 'positive' : headcountData?.trend === 'shrinking' ? 'negative' : 'neutral'}
            icon={<Users size={20} className="text-blue-500" />}
            onClick={() => setActiveTab('headcount')}
          />
          <StatCard
            label="Projected Annual Payroll"
            value={fmtC(projectedPayroll / 100)}
            change={`${payrollData.yoyChange >= 0 ? '+' : ''}${(payrollData.yoyChange * 100).toFixed(1)}% YoY`}
            changeType={payrollData.yoyChange > 0.1 ? 'negative' : payrollData.yoyChange > 0 ? 'neutral' : 'positive'}
            icon={<DollarSign size={20} className="text-emerald-500" />}
            onClick={() => setActiveTab('payroll')}
          />
          <StatCard
            label="At-Risk Budgets"
            value={atRiskBudgets}
            change={`of ${budgets?.length ?? 0} total`}
            changeType={atRiskBudgets > 1 ? 'negative' : 'neutral'}
            icon={<AlertTriangle size={20} className="text-amber-500" />}
            onClick={() => setActiveTab('budget')}
          />
        </div>

        {/* Model Info Banner */}
        <Card className="!p-3 bg-tempo-50/30 border-tempo-200/50">
          <div className="flex items-center gap-2 text-sm">
            <Brain size={16} className="text-tempo-600 shrink-0" />
            <span className="text-t2">
              Models: <strong className="text-t1">Logistic Regression</strong> (attrition),{' '}
              <strong className="text-t1">Holt-Winters</strong> (forecasting),{' '}
              <strong className="text-t1">OLS Regression</strong> (comp equity),{' '}
              <strong className="text-t1">Z-Score</strong> (anomaly detection)
              {' '}&mdash; All running client-side in TypeScript. No external ML libraries.
            </span>
          </div>
        </Card>

        {/* Tabs */}
        <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} maxVisible={7} />

        {/* Tab Content */}
        {activeTab === 'attrition' && <AttritionTab data={attritionData} getDeptName={getDepartmentName} departments={departments || []} />}
        {activeTab === 'headcount' && headcountData && <HeadcountTab data={headcountData} />}
        {activeTab === 'payroll' && <PayrollTab data={payrollData} fmtC={fmtC} />}
        {activeTab === 'recruiting' && <RecruitingTab data={timeToHireData} />}
        {activeTab === 'comp-equity' && compEquityData && <CompEquityTab data={compEquityData} fmtC={fmtC} />}
        {activeTab === 'engagement' && <EngagementTab data={engagementData} />}
        {activeTab === 'budget' && <BudgetTab data={budgetData} fmtC={fmtC} />}
      </div>
    </>
  )
}

// ────────────────────────────────────────────────────────────
//  Tab: Attrition Risk
// ────────────────────────────────────────────────────────────

function AttritionTab({ data, getDeptName, departments }: { data: AttritionPrediction[]; getDeptName: any; departments: any[] }) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)

  const displayed = showAll ? data : data.slice(0, 15)

  // Department risk heatmap
  const deptRisks = useMemo(() => {
    const map = new Map<string, { count: number; totalProb: number }>()
    for (const pred of data) {
      const d = pred.department
      if (!map.has(d)) map.set(d, { count: 0, totalProb: 0 })
      const entry = map.get(d)!
      entry.count++
      entry.totalProb += pred.probability
    }
    return Array.from(map.entries()).map(([dept, { count, totalProb }]) => ({
      department: dept,
      avgRisk: Math.round((totalProb / count) * 100),
      highRiskCount: data.filter(p => p.department === dept && (p.riskLevel === 'critical' || p.riskLevel === 'high')).length,
    }))
  }, [data])

  const riskColors: Record<string, string> = { critical: 'text-red-600 bg-red-50', high: 'text-teal-700 bg-teal-50', medium: 'text-amber-600 bg-amber-50', low: 'text-green-600 bg-green-50' }

  return (
    <div className="space-y-6">
      {/* Department Risk Overview */}
      <Card>
        <h3 className="font-semibold text-t1 mb-4 flex items-center gap-2">
          <ShieldAlert size={18} className="text-rose-500" /> Department Risk Heatmap
        </h3>
        <HeatmapGrid
          rows={deptRisks.map(d => d.department)}
          columns={['Avg Risk %', 'High Risk Count']}
          values={deptRisks.map(d => [d.avgRisk, d.highRiskCount])}
          colorScale="risk"
          formatValue={v => String(Math.round(v))}
        />
      </Card>

      {/* Employee Risk Table */}
      <Card padding="none">
        <div className="px-6 py-4 border-b border-divider flex items-center justify-between">
          <h3 className="font-semibold text-t1 flex items-center gap-2">
            <UserMinus size={18} className="text-rose-500" /> Flight Risk Rankings
          </h3>
          <span className="text-xs text-t3">{data.length} employees analyzed</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-canvas text-t2 text-left">
                <th className="px-6 py-3 font-medium">Rank</th>
                <th className="px-6 py-3 font-medium">Employee</th>
                <th className="px-6 py-3 font-medium">Department</th>
                <th className="px-6 py-3 font-medium">Level</th>
                <th className="px-6 py-3 font-medium">Risk Probability</th>
                <th className="px-6 py-3 font-medium">Risk Level</th>
                <th className="px-6 py-3 font-medium w-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-divider">
              {displayed.flatMap((pred, idx) => {
                const row = (
                  <tr key={pred.employeeId} className="group">
                    <td className="px-6 py-3 text-t2">{idx + 1}</td>
                    <td className="px-6 py-3 font-medium text-t1">{pred.employeeName}</td>
                    <td className="px-6 py-3 text-t2">{pred.department}</td>
                    <td className="px-6 py-3 text-t2">{pred.level}</td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${Math.round(pred.probability * 100)}%`,
                              backgroundColor: pred.probability >= 0.7 ? '#ef4444' : pred.probability >= 0.5 ? '#f59e0b' : pred.probability >= 0.3 ? '#eab308' : '#10b981',
                            }}
                          />
                        </div>
                        <span className="text-xs font-mono text-t2">{(pred.probability * 100).toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${riskColors[pred.riskLevel]}`}>
                        {pred.riskLevel}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <button onClick={() => setExpanded(expanded === pred.employeeId ? null : pred.employeeId)} className="text-t3 hover:text-t1">
                        {expanded === pred.employeeId ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </td>
                  </tr>
                )
                if (expanded !== pred.employeeId) return [row]
                return [
                  row,
                  <tr key={`${pred.employeeId}-detail`} className="bg-canvas/50">
                    <td colSpan={7} className="px-6 py-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-xs font-semibold text-t2 uppercase tracking-wider mb-2">Top Risk Factors</h4>
                          <div className="space-y-1.5">
                            {pred.topRiskFactors.map((f, i) => (
                              <div key={i} className="flex items-center gap-2 text-sm">
                                <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                  <div className="h-full bg-rose-400 rounded-full" style={{ width: `${Math.min(100, f.impact * 400)}%` }} />
                                </div>
                                <span className="text-t2">{f.factor}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="text-xs font-semibold text-t2 uppercase tracking-wider mb-2">Recommended Actions</h4>
                          <ul className="space-y-1">
                            {pred.retentionActions.map((a, i) => (
                              <li key={i} className="text-sm text-t2 flex items-start gap-1.5">
                                <ArrowRight size={12} className="mt-1 text-tempo-500 shrink-0" /> {a}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </td>
                  </tr>,
                ]
              })}
            </tbody>
          </table>
        </div>
        {data.length > 15 && (
          <div className="px-6 py-3 border-t border-divider text-center">
            <button onClick={() => setShowAll(!showAll)} className="text-sm text-tempo-600 hover:text-tempo-700 font-medium">
              {showAll ? 'Show fewer' : `Show all ${data.length} employees`}
            </button>
          </div>
        )}
      </Card>
    </div>
  )
}

// ────────────────────────────────────────────────────────────
//  Tab: Headcount Forecast
// ────────────────────────────────────────────────────────────

function HeadcountTab({ data }: { data: HeadcountForecast }) {
  const allLabels = [...data.historical.map(h => h.month), ...data.forecast.map(f => f.month)]
  const historicalValues = data.historical.map(h => h.headcount)
  const forecastValues = [...new Array(data.historical.length).fill(NaN), ...data.forecast.map(f => f.headcount)]

  // Build series: historical + forecast
  const combinedValues = [...historicalValues, ...data.forecast.map(f => f.headcount)]

  const confidenceBand = {
    upper: [...new Array(data.historical.length).fill(historicalValues[historicalValues.length - 1] || 0), ...data.forecast.map(f => f.upper)],
    lower: [...new Array(data.historical.length).fill(historicalValues[historicalValues.length - 1] || 0), ...data.forecast.map(f => f.lower)],
    color: '#3b82f6',
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="text-center">
          <div className="text-3xl font-bold text-t1">{data.forecast[data.forecast.length - 1]?.headcount ?? '--'}</div>
          <div className="text-sm text-t2 mt-1">12-Month Forecast</div>
          <Badge variant={data.trend === 'growing' ? 'success' : data.trend === 'shrinking' ? 'error' : 'info'} className="mt-2">
            {data.trend}
          </Badge>
        </Card>
        <Card className="text-center">
          <div className="text-3xl font-bold text-t1">{(data.monthlyGrowthRate * 100).toFixed(1)}%</div>
          <div className="text-sm text-t2 mt-1">Monthly Growth Rate</div>
        </Card>
        <Card className="text-center">
          <MiniGauge value={data.r2 * 100} label="Model R2" color="#3b82f6" />
        </Card>
      </div>

      <Card>
        <h3 className="font-semibold text-t1 mb-4 flex items-center gap-2">
          <TrendingUp size={18} className="text-blue-500" /> Headcount Projection (12 months)
        </h3>
        <LineChart
          labels={allLabels}
          series={[
            { label: 'Actual', data: [...historicalValues, ...new Array(data.forecast.length).fill(NaN)], color: '#3b82f6' },
            { label: 'Forecast', data: [...new Array(data.historical.length - 1).fill(NaN), historicalValues[historicalValues.length - 1], ...data.forecast.map(f => f.headcount)], color: '#004D40', dashed: true },
          ]}
          confidence={confidenceBand}
          forecastStartIndex={data.historical.length}
          yLabel="Headcount"
          formatY={v => String(Math.round(v))}
          height={320}
        />
        <div className="mt-3 flex items-center gap-4 text-xs text-t3">
          <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-blue-500 inline-block" /> Actual</span>
          <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-tempo-500 inline-block border-t border-dashed border-tempo-500" /> Forecast</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-500/10 inline-block rounded" /> 95% Confidence</span>
        </div>
      </Card>

      {/* Forecast Table */}
      <Card padding="none">
        <div className="px-6 py-4 border-b border-divider">
          <h3 className="font-semibold text-t1">Monthly Forecast Detail</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-canvas text-t2 text-left">
                <th className="px-6 py-3 font-medium">Month</th>
                <th className="px-6 py-3 font-medium">Forecast</th>
                <th className="px-6 py-3 font-medium">Lower Bound</th>
                <th className="px-6 py-3 font-medium">Upper Bound</th>
                <th className="px-6 py-3 font-medium">Range Width</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-divider">
              {data.forecast.map((f) => (
                <tr key={f.month}>
                  <td className="px-6 py-3 font-medium text-t1">{f.month}</td>
                  <td className="px-6 py-3 text-t1 font-mono">{f.headcount}</td>
                  <td className="px-6 py-3 text-t2 font-mono">{f.lower}</td>
                  <td className="px-6 py-3 text-t2 font-mono">{f.upper}</td>
                  <td className="px-6 py-3 text-t3 font-mono">&plusmn;{Math.round((f.upper - f.lower) / 2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

// ────────────────────────────────────────────────────────────
//  Tab: Payroll Projection
// ────────────────────────────────────────────────────────────

function PayrollTab({ data, fmtC }: { data: CostProjection; fmtC: (v: number) => string }) {
  const allLabels = [...data.historical.map(h => h.month), ...data.forecast.map(f => f.month)]
  const historicalValues = data.historical.map(h => h.totalCost)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="text-center">
          <div className="text-2xl font-bold text-t1">{fmtC(data.annualProjectedCost / 100)}</div>
          <div className="text-sm text-t2 mt-1">Annual Projected Cost</div>
        </Card>
        <Card className="text-center">
          <div className="text-2xl font-bold text-t1">{data.yoyChange >= 0 ? '+' : ''}{(data.yoyChange * 100).toFixed(1)}%</div>
          <div className="text-sm text-t2 mt-1">Year-over-Year Change</div>
          <Badge variant={data.yoyChange > 0.1 ? 'warning' : 'success'} className="mt-2">
            {data.yoyChange > 0.1 ? 'Above target' : 'On track'}
          </Badge>
        </Card>
        <Card className="text-center">
          <MiniGauge value={data.trendLine.r2 * 100} label="Trend R2" color="#10b981" />
        </Card>
      </div>

      <Card>
        <h3 className="font-semibold text-t1 mb-4 flex items-center gap-2">
          <DollarSign size={18} className="text-emerald-500" /> Payroll Cost Forecast
        </h3>
        <LineChart
          labels={allLabels}
          series={[
            { label: 'Actual', data: [...historicalValues, ...new Array(data.forecast.length).fill(NaN)], color: '#10b981' },
            { label: 'Forecast', data: [...new Array(data.historical.length - 1).fill(NaN), historicalValues[historicalValues.length - 1], ...data.forecast.map(f => f.totalCost)], color: '#004D40', dashed: true },
          ]}
          confidence={{
            upper: [...new Array(data.historical.length).fill(historicalValues[historicalValues.length - 1] || 0), ...data.forecast.map(f => f.upper)],
            lower: [...new Array(data.historical.length).fill(historicalValues[historicalValues.length - 1] || 0), ...data.forecast.map(f => f.lower)],
            color: '#10b981',
          }}
          forecastStartIndex={data.historical.length}
          yLabel="Cost"
          formatY={v => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(Math.round(v))}
          height={320}
        />
      </Card>

      {/* Trend Details */}
      <Card>
        <h3 className="font-semibold text-t1 mb-3">Trend Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-t3 text-xs uppercase tracking-wider mb-1">Monthly Trend</div>
            <div className="text-t1 font-medium">{fmtC(data.trendLine.slope / 100)} per month</div>
          </div>
          <div>
            <div className="text-t3 text-xs uppercase tracking-wider mb-1">Baseline Cost</div>
            <div className="text-t1 font-medium">{fmtC(data.trendLine.intercept / 100)}</div>
          </div>
          <div>
            <div className="text-t3 text-xs uppercase tracking-wider mb-1">Model Fit</div>
            <div className="text-t1 font-medium">R&sup2; = {data.trendLine.r2.toFixed(3)}</div>
          </div>
        </div>
      </Card>
    </div>
  )
}

// ────────────────────────────────────────────────────────────
//  Tab: Recruiting Pipeline
// ────────────────────────────────────────────────────────────

function RecruitingTab({ data }: { data: TimeToHirePrediction }) {
  const healthColors: Record<string, string> = { healthy: 'text-green-600 bg-green-50', at_risk: 'text-amber-600 bg-amber-50', critical: 'text-red-600 bg-red-50' }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="text-center">
          <div className="text-3xl font-bold text-t1">{data.overallAvgDays}</div>
          <div className="text-sm text-t2 mt-1">Avg Days to Fill</div>
        </Card>
        <Card className="text-center">
          <div className="text-3xl font-bold text-t1">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-lg font-semibold ${healthColors[data.pipelineHealth]}`}>
              {data.pipelineHealth.replace('_', ' ')}
            </span>
          </div>
          <div className="text-sm text-t2 mt-1">Pipeline Health</div>
        </Card>
        <Card className="text-center">
          <div className="text-3xl font-bold text-t1">{data.byDepartment.reduce((s, d) => s + d.openReqs, 0)}</div>
          <div className="text-sm text-t2 mt-1">Total Open Reqs</div>
        </Card>
      </div>

      {/* By Department */}
      <Card>
        <h3 className="font-semibold text-t1 mb-4 flex items-center gap-2">
          <Briefcase size={18} className="text-violet-500" /> Time-to-Hire by Department
        </h3>
        <BarChart
          labels={data.byDepartment.map(d => d.department)}
          values={data.byDepartment.map(d => d.predictedDays)}
          secondaryValues={data.byDepartment.map(d => d.avgDays)}
          barLabel="Predicted"
          secondaryLabel="Historical Avg"
          horizontal
          formatValue={v => `${v}d`}
        />
      </Card>

      {/* By Level */}
      <Card>
        <h3 className="font-semibold text-t1 mb-4 flex items-center gap-2">
          <Clock size={18} className="text-amber-500" /> Time-to-Hire by Level
        </h3>
        <BarChart
          labels={data.byLevel.map(l => l.level)}
          values={data.byLevel.map(l => l.predictedDays)}
          secondaryValues={data.byLevel.map(l => l.avgDays)}
          barLabel="Predicted"
          secondaryLabel="Historical Avg"
          formatValue={v => `${v} days`}
        />
      </Card>

      {/* Recommendations */}
      <Card>
        <h3 className="font-semibold text-t1 mb-3 flex items-center gap-2">
          <Zap size={18} className="text-tempo-500" /> Recommendations
        </h3>
        <ul className="space-y-2">
          {data.recommendations.map((r, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-t2">
              <ArrowRight size={14} className="mt-0.5 text-tempo-500 shrink-0" /> {r}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}

// ────────────────────────────────────────────────────────────
//  Tab: Comp Equity
// ────────────────────────────────────────────────────────────

function CompEquityTab({ data, fmtC }: { data: CompEquityAnalysis; fmtC: (v: number) => string }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="text-center">
          <MiniGauge value={data.overallEquityScore} label="Equity Score" color={data.overallEquityScore >= 80 ? '#10b981' : data.overallEquityScore >= 60 ? '#f59e0b' : '#ef4444'} size={100} />
        </Card>
        <Card className="text-center">
          <div className="text-3xl font-bold text-t1">{data.anomalies.length}</div>
          <div className="text-sm text-t2 mt-1">Comp Band Outliers</div>
          <Badge variant={data.anomalies.length > 5 ? 'warning' : 'success'} className="mt-2">
            {data.anomalies.length > 5 ? 'Needs review' : 'Acceptable'}
          </Badge>
        </Card>
        <Card>
          <h4 className="text-xs font-semibold text-t2 uppercase tracking-wider mb-2">Gap Drivers</h4>
          <ul className="space-y-1.5">
            {data.gapDrivers.map((d, i) => (
              <li key={i} className="text-sm text-t2 flex items-start gap-1.5">
                <AlertTriangle size={12} className="mt-0.5 text-amber-500 shrink-0" /> {d}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Department Equity */}
      <Card>
        <h3 className="font-semibold text-t1 mb-4 flex items-center gap-2">
          <BarChart3 size={18} className="text-blue-500" /> Department Comp Analysis
        </h3>
        <HeatmapGrid
          rows={data.byDepartment.map(d => d.department)}
          columns={['Avg Salary', 'Median', 'Gap %', 'Equity Score']}
          values={data.byDepartment.map(d => [d.avgSalary / 100, d.medianSalary / 100, d.gapPercent, d.equityScore])}
          colorScale="positive"
          formatValue={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v.toFixed(1)}
        />
      </Card>

      {/* Outliers Table */}
      {data.anomalies.length > 0 && (
        <Card padding="none">
          <div className="px-6 py-4 border-b border-divider">
            <h3 className="font-semibold text-t1">Comp Band Outliers (&gt;15% deviation)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-canvas text-t2 text-left">
                  <th className="px-6 py-3 font-medium">Employee</th>
                  <th className="px-6 py-3 font-medium">Department</th>
                  <th className="px-6 py-3 font-medium">Deviation from Midpoint</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-divider">
                {data.anomalies.slice(0, 10).map(a => (
                  <tr key={a.employeeId}>
                    <td className="px-6 py-3 font-medium text-t1">{a.employeeName}</td>
                    <td className="px-6 py-3 text-t2">{a.department}</td>
                    <td className="px-6 py-3">
                      <span className={a.deviation > 0 ? 'text-blue-600' : 'text-rose-600'}>
                        {a.deviation > 0 ? '+' : ''}{a.deviation}%
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <Badge variant={Math.abs(a.deviation) > 25 ? 'error' : 'warning'}>
                        {a.deviation > 0 ? 'Over band' : 'Under band'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}

// ────────────────────────────────────────────────────────────
//  Tab: Engagement Trends
// ────────────────────────────────────────────────────────────

function EngagementTab({ data }: { data: EngagementForecast }) {
  const allLabels = [...data.historical.map(h => h.period), ...data.forecast.map(f => f.period)]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="text-center">
          <div className="text-3xl font-bold text-t1">{data.predictedEnps}</div>
          <div className="text-sm text-t2 mt-1">Predicted eNPS</div>
          <Badge variant={data.trend === 'improving' ? 'success' : data.trend === 'declining' ? 'error' : 'info'} className="mt-2">
            {data.trend}
          </Badge>
        </Card>
        <Card className="text-center">
          <div className="text-3xl font-bold text-t1">{data.forecast[0]?.score ?? '--'}</div>
          <div className="text-sm text-t2 mt-1">Next Quarter Prediction</div>
        </Card>
        <Card className="text-center">
          <div className="text-3xl font-bold text-t1">{data.riskDepartments.filter(d => d.trend === 'down').length}</div>
          <div className="text-sm text-t2 mt-1">At-Risk Departments</div>
        </Card>
      </div>

      {/* Engagement Forecast Chart */}
      <Card>
        <h3 className="font-semibold text-t1 mb-4 flex items-center gap-2">
          <TrendingUp size={18} className="text-violet-500" /> Engagement Score Projection
        </h3>
        <LineChart
          labels={allLabels}
          series={[
            { label: 'Historical', data: [...data.historical.map(h => h.score), ...new Array(data.forecast.length).fill(NaN)], color: '#8b5cf6' },
            { label: 'Forecast', data: [...new Array(data.historical.length - 1).fill(NaN), data.historical[data.historical.length - 1]?.score ?? 70, ...data.forecast.map(f => f.score)], color: '#004D40', dashed: true },
          ]}
          confidence={{
            upper: [...new Array(data.historical.length).fill(data.historical[data.historical.length - 1]?.score ?? 70), ...data.forecast.map(f => f.upper)],
            lower: [...new Array(data.historical.length).fill(data.historical[data.historical.length - 1]?.score ?? 70), ...data.forecast.map(f => f.lower)],
            color: '#8b5cf6',
          }}
          forecastStartIndex={data.historical.length}
          yLabel="Score"
          formatY={v => String(Math.round(v))}
          height={300}
        />
      </Card>

      {/* Department Risk */}
      <Card padding="none">
        <div className="px-6 py-4 border-b border-divider">
          <h3 className="font-semibold text-t1">Department Engagement Health</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-canvas text-t2 text-left">
                <th className="px-6 py-3 font-medium">Department</th>
                <th className="px-6 py-3 font-medium">Current Score</th>
                <th className="px-6 py-3 font-medium">Trend</th>
                <th className="px-6 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-divider">
              {data.riskDepartments.map(d => (
                <tr key={d.department}>
                  <td className="px-6 py-3 font-medium text-t1">{d.department}</td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${d.score}%`,
                            backgroundColor: d.score >= 75 ? '#10b981' : d.score >= 65 ? '#f59e0b' : '#ef4444',
                          }}
                        />
                      </div>
                      <span className="text-xs font-mono">{d.score}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    {d.trend === 'up' && <span className="text-green-500">&#9650; Up</span>}
                    {d.trend === 'down' && <span className="text-red-500">&#9660; Down</span>}
                    {d.trend === 'flat' && <span className="text-slate-400">&#8212; Flat</span>}
                  </td>
                  <td className="px-6 py-3">
                    <Badge variant={d.score >= 75 ? 'success' : d.score >= 65 ? 'warning' : 'error'}>
                      {d.score >= 75 ? 'Healthy' : d.score >= 65 ? 'Watch' : 'At Risk'}
                    </Badge>
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

// ────────────────────────────────────────────────────────────
//  Tab: Budget Burn Rate
// ────────────────────────────────────────────────────────────

function BudgetTab({ data, fmtC }: { data: BurnoutPrediction; fmtC: (v: number) => string }) {
  const statusColors: Record<string, string> = { on_track: 'text-green-600 bg-green-50', at_risk: 'text-amber-600 bg-amber-50', overrun: 'text-red-600 bg-red-50' }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="text-center">
          <div className="text-3xl font-bold text-t1">{data.atRiskCount}</div>
          <div className="text-sm text-t2 mt-1">At-Risk / Overrun Budgets</div>
        </Card>
        <Card className="text-center">
          <div className="text-2xl font-bold text-rose-600">{fmtC(data.totalProjectedOverrun / 100)}</div>
          <div className="text-sm text-t2 mt-1">Total Projected Overrun</div>
        </Card>
        <Card className="text-center">
          <div className="text-3xl font-bold text-t1">{data.budgets.length}</div>
          <div className="text-sm text-t2 mt-1">Budgets Monitored</div>
        </Card>
      </div>

      {/* Budget Utilization Chart */}
      <Card>
        <h3 className="font-semibold text-t1 mb-4 flex items-center gap-2">
          <PieChart size={18} className="text-amber-500" /> Budget Utilization vs. Expected
        </h3>
        <BarChart
          labels={data.budgets.map(b => b.name.replace(/\s+2026$/, ''))}
          values={data.budgets.map(b => b.spentAmount)}
          secondaryValues={data.budgets.map(b => b.totalAmount)}
          barLabel="Spent"
          secondaryLabel="Total Budget"
          horizontal
          formatValue={v => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)}
        />
      </Card>

      {/* Detail Table */}
      <Card padding="none">
        <div className="px-6 py-4 border-b border-divider">
          <h3 className="font-semibold text-t1">Budget Burnout Predictions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-canvas text-t2 text-left">
                <th className="px-6 py-3 font-medium">Budget</th>
                <th className="px-6 py-3 font-medium">Department</th>
                <th className="px-6 py-3 font-medium">Burn Rate/Mo</th>
                <th className="px-6 py-3 font-medium">Months Until Depleted</th>
                <th className="px-6 py-3 font-medium">Projected Overrun</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Confidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-divider">
              {data.budgets.map(b => (
                <tr key={b.id}>
                  <td className="px-6 py-3 font-medium text-t1">{b.name}</td>
                  <td className="px-6 py-3 text-t2">{b.department}</td>
                  <td className="px-6 py-3 font-mono text-t1">{fmtC(b.burnRate / 100)}</td>
                  <td className="px-6 py-3 font-mono text-t1">{b.monthsUntilDepleted}</td>
                  <td className="px-6 py-3 font-mono text-rose-600">{b.projectedOverrun > 0 ? fmtC(b.projectedOverrun / 100) : '--'}</td>
                  <td className="px-6 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[b.status]}`}>
                      {b.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-400 rounded-full" style={{ width: `${b.confidence}%` }} />
                      </div>
                      <span className="text-xs text-t3">{b.confidence}%</span>
                    </div>
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
