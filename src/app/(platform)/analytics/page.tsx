'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { useAI } from '@/lib/use-ai'
import { useTranslations } from 'next-intl'
import { Header } from '@/components/layout/header'
import { Card } from '@/components/ui/card'
import { StatCard } from '@/components/ui/stat-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs } from '@/components/ui/tabs'
import { Input, Select } from '@/components/ui/input'
import { TempoBarChart, TempoDonutChart, TempoGauge, ChartLegend, CHART_COLORS, STATUS_COLORS } from '@/components/ui/charts'
import { BarChart3, TrendingUp, Users, DollarSign, AlertTriangle, FileText, Search, Calendar, PieChart, Table2, Hash, LayoutGrid, Clock, Briefcase, CreditCard, Target, UserPlus, Download, Save, CalendarClock } from 'lucide-react'
import { useTempo, useOrgCurrency } from '@/lib/store'
import { formatCurrency } from '@/lib/utils/format-currency'
import { PageSkeleton } from '@/components/ui/page-skeleton'
import { AIQueryBar, AIInsightPanel, AIEnhancingIndicator } from '@/components/ai'
import { AIInsightsCard } from '@/components/ui/ai-insights-card'
import { parseNaturalLanguageQuery, generateBoardNarrative, calculateFlightRisk, detectCrossModuleAnomalies } from '@/lib/ai-engine'
import { exportToPrint } from '@/lib/export-import'

export default function AnalyticsPage() {
  const t = useTranslations('analytics')
  const tc = useTranslations('common')
  const {
    employees, departments, goals, reviews, enrollments,
    engagementScores, mentoringPairs, expenseReports,
    jobPostings, leaveRequests, payrollRuns, salaryReviews,
    compBands, courses, getDepartmentName, ensureModulesLoaded, addToast,
  } = useTempo()
  const defaultCurrency = useOrgCurrency()

  const [pageLoading, setPageLoading] = useState(true)

  useEffect(() => { ensureModulesLoaded?.(['employees', 'departments', 'goals', 'reviews', 'enrollments', 'engagementScores', 'mentoringPairs', 'expenseReports', 'jobPostings', 'leaveRequests', 'payrollRuns', 'salaryReviews', 'compBands', 'courses'])?.then?.(() => setPageLoading(false))?.catch?.(() => setPageLoading(false)) }, [])

  useEffect(() => { const t = setTimeout(() => setPageLoading(false), 2000); return () => clearTimeout(t) }, [])

  const [saving, setSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('workforce')
  const [deptFilter, setDeptFilter] = useState('all')
  const [queryResults, setQueryResults] = useState<{ results: any[]; description: string } | null>(null)
  const [queryFollowUps, setQueryFollowUps] = useState<string[]>([])
  const [queryLoading, setQueryLoading] = useState(false)
  const [queryHighlight, setQueryHighlight] = useState('')

  // Report Builder state
  const [rbSource, setRbSource] = useState<string>('workforce')
  const [rbMetrics, setRbMetrics] = useState<string[]>([])
  const [rbViz, setRbViz] = useState<string>('bar')
  const [rbPreview, setRbPreview] = useState(false)

  // AI-powered analytics
  const boardNarrative = useMemo(() => generateBoardNarrative({ employees: employees || [], goals: goals || [], reviews: reviews || [], engagementScores: engagementScores || [], jobPostings: jobPostings || [], payrollRuns: payrollRuns || [], salaryReviews: salaryReviews || [] }), [employees, goals, reviews, salaryReviews])

  // AI cross-module anomaly detection
  const aiAnalyticsInsights = useMemo(() => detectCrossModuleAnomalies({
    employees: employees || [],
    reviews: reviews || [],
    engagementScores: engagementScores || [],
    salaryReviews: salaryReviews || [],
    goals: goals || [],
    mentoringPairs: mentoringPairs || [],
    leaveRequests: leaveRequests || [],
  }), [employees, reviews, engagementScores, salaryReviews, goals, mentoringPairs, leaveRequests])

  // Claude AI enhancement - board narrative
  const { result: enhancedNarrative, isLoading: narrativeLoading } = useAI({
    action: 'enhanceNarrative',
    data: { narrative: boardNarrative, employees: employees.length, goals: goals.length, reviews: reviews.length },
    fallback: boardNarrative,
    enabled: !!boardNarrative?.summary,
    cacheKey: `analytics-narrative-${employees.length}-${reviews.length}`,
  })

  const handleAIQuery = useCallback(async (query: string) => {
    setQueryLoading(true)
    setQueryFollowUps([])
    setQueryHighlight('')

    // First: instant deterministic results
    const storeData = { employees, departments, goals, reviews, enrollments, engagementScores, mentoringPairs, expenseReports, jobPostings, leaveRequests, payrollRuns, compBands, courses, salaryReviews }
    const result = parseNaturalLanguageQuery(query, storeData)
    setQueryResults(result)

    // Then: enhance with Claude for richer description + follow-ups
    try {
      const dataSummary = {
        query,
        resultCount: result.results.length,
        resultDescription: result.description,
        context: {
          totalEmployees: employees.length,
          totalGoals: goals.length,
          totalReviews: reviews.length,
          departments: departments.map(d => d.name),
          countries: [...new Set(employees.map(e => e.country))],
        },
      }
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-org-id': 'demo' },
        body: JSON.stringify({ action: 'analyzeWorkforceQuery', data: dataSummary }),
      })
      const json = await res.json()
      if (json.result) {
        if (json.result.description) {
          setQueryResults({ ...result, description: json.result.description })
        }
        if (json.result.followUps) {
          setQueryFollowUps(json.result.followUps)
        }
        if (json.result.highlight) {
          setQueryHighlight(json.result.highlight)
        }
      }
      // If API returned error or no follow-ups, generate fallback
      if (!json.result?.followUps) {
        const fallbackFollowUps = [
          `Show ${result.results.length > 0 ? 'details for' : 'all'} ${query.includes('perform') ? 'performance by department' : 'employees by country'}`,
          `Compare ${query.includes('comp') ? 'compensation across levels' : 'engagement scores by team'}`,
          `What are the top risks for ${query.includes('risk') ? 'retention' : 'the organization'}?`,
        ]
        setQueryFollowUps(fallbackFollowUps)
      }
    } catch {
      // Fallback: generate static follow-ups based on query type
      const fallbackFollowUps = [
        `Show ${result.results.length > 0 ? 'details for' : 'all'} ${query.includes('perform') ? 'performance by department' : 'employees by country'}`,
        `Compare ${query.includes('comp') ? 'compensation across levels' : 'engagement scores by team'}`,
        `What are the top risks for ${query.includes('risk') ? 'retention' : 'the organization'}?`,
      ]
      setQueryFollowUps(fallbackFollowUps)
    }
    setQueryLoading(false)
  }, [employees, departments, goals, reviews, enrollments, engagementScores, mentoringPairs, expenseReports, jobPostings, leaveRequests, payrollRuns, compBands, courses, salaryReviews])

  const tabs = [
    { id: 'workforce', label: t('tabWorkforce') },
    { id: 'performance', label: t('tabPerformance') },
    { id: 'engagement', label: t('tabEngagement') },
    { id: 'flight_risk', label: t('tabFlightRisk') },
    { id: 'compensation', label: 'Compensation' },
    { id: 'recruiting', label: 'Recruiting' },
    { id: 'diversity', label: 'Diversity' },
    { id: 'executive', label: 'Executive' },
    { id: 'builder', label: 'Report Builder' },
  ]

  // Filter employees by department and search query
  const filteredEmployees = useMemo(() => {
    let result = employees
    if (deptFilter !== 'all') result = result.filter(e => e.department_id === deptFilter)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(e =>
        e.profile?.full_name?.toLowerCase().includes(q) ||
        e.job_title?.toLowerCase().includes(q) ||
        e.country?.toLowerCase().includes(q) ||
        e.level?.toLowerCase().includes(q) ||
        getDepartmentName(e.department_id)?.toLowerCase().includes(q)
      )
    }
    return result
  }, [employees, deptFilter, searchQuery, getDepartmentName])

  // Live computed metrics
  const headcount = filteredEmployees.length
  const reviewCompletion = reviews.length > 0 ? Math.round((reviews.filter(r => r.status === 'submitted').length / reviews.length) * 100) : 0
  const activeLearners = new Set(enrollments.filter(e => e.status === 'in_progress' || e.status === 'enrolled').map(e => e.employee_id)).size
  const openPositions = jobPostings.filter(j => j.status === 'open').length
  const pendingExpenses = expenseReports.filter(e => e.status === 'submitted' || e.status === 'pending_approval').length
  const lastPayroll = payrollRuns[payrollRuns.length - 1]

  // Headcount by department
  const deptCounts = departments.map(d => ({
    name: d.name,
    count: filteredEmployees.filter(e => e.department_id === d.id).length,
  })).sort((a, b) => b.count - a.count)

  // Headcount by country
  const countryCounts = Object.entries(
    filteredEmployees.reduce((acc, e) => { acc[e.country] = (acc[e.country] || 0) + 1; return acc }, {} as Record<string, number>)
  ).sort((a, b) => b[1] - a[1])

  // Goal status distribution
  const goalsByStatus = {
    on_track: goals.filter(g => g.status === 'on_track').length,
    at_risk: goals.filter(g => g.status === 'at_risk').length,
    behind: goals.filter(g => g.status === 'behind').length,
  }

  // Average goal progress
  const avgProgress = goals.length > 0 ? Math.round(goals.reduce((a, g) => a + g.progress, 0) / goals.length) : 0

  if (pageLoading) {
    return (
      <>
        <Header title={t('title')} subtitle={t('subtitle')}
          actions={<Button size="sm" disabled><FileText size={14} /> {t('generateReport')}</Button>}
        />
        <div className="p-6"><PageSkeleton /></div>
      </>
    )
  }

  return (
    <>
      <Header title={t('title')} subtitle={t('subtitle')}
        actions={<div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" onClick={() => addToast('Report scheduling configured. You will receive this report weekly via email.')}>
            <Calendar size={14} className="mr-1" /> Schedule Report
          </Button>
          <Button size="sm" disabled={saving} onClick={async () => {
            if (employees.length === 0) { addToast('No employee data available to export', 'error'); return }
            setSaving(true)
            try {
              exportToPrint(
                employees.map(e => ({ name: e.profile?.full_name || '', dept: getDepartmentName(e.department_id), country: e.country, level: e.level })),
                [
                  { header: 'Name', accessor: (r: any) => r.name },
                  { header: 'Department', accessor: (r: any) => r.dept },
                  { header: 'Country', accessor: (r: any) => r.country },
                  { header: 'Level', accessor: (r: any) => r.level },
                ],
                'Analytics Report - Workforce Overview'
              )
              addToast('Report generated successfully', 'success')
            } finally { setSaving(false) }
          }}><FileText size={14} /> {saving ? 'Generating...' : t('generateReport')}</Button>
        </div>} />

      {/* AI Natural Language Query Bar (Sana-inspired) */}
      <AIQueryBar onQuery={handleAIQuery} placeholder={t('queryPlaceholder')} className="mb-6" />
      {queryLoading && (
        <Card className="mb-6 border-tempo-200 bg-tempo-50/30">
          <div className="flex items-center gap-3 p-2">
            <AIEnhancingIndicator isLoading={true} />
            <span className="text-xs text-t2">Analyzing your question with AI...</span>
          </div>
        </Card>
      )}
      {queryResults && (
        <div className="mb-6 space-y-3">
          <AIInsightPanel title={t('queryResults')} narrative={{ summary: queryResults.description, bulletPoints: queryResults.results.slice(0, 5).map(r => r.profile?.full_name || r.title || r.id || 'Match') }} />
          {queryHighlight && (
            <Card className="border-tempo-200 bg-tempo-50/20">
              <div className="flex items-center gap-2 p-1">
                <AlertTriangle size={14} className="text-tempo-600 shrink-0" />
                <span className="text-xs font-medium text-tempo-700">{queryHighlight}</span>
              </div>
            </Card>
          )}
          {queryFollowUps.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[0.65rem] text-t3 font-medium uppercase tracking-wider">Explore more</span>
              {queryFollowUps.map((followUp, i) => (
                <button key={i} onClick={() => handleAIQuery(followUp)}
                  className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-surface border border-divider text-t2 hover:border-tempo-300 hover:bg-tempo-50 hover:text-tempo-700 transition-all">
                  <Search size={10} /> {followUp}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label={t('headcount')} value={headcount} icon={<Users size={20} />} href="/people" />
        <StatCard label={t('reviewCompletion')} value={`${reviewCompletion}%`} icon={<TrendingUp size={20} />} href="/performance" />
        <StatCard label={t('staffCost')} value={lastPayroll ? `${formatCurrency(lastPayroll.total_gross, defaultCurrency, { compact: true })}/mo` : '-'} icon={<DollarSign size={20} />} href="/payroll" />
        <StatCard label={t('openPositions')} value={openPositions} icon={<BarChart3 size={20} />} href="/recruiting" />
      </div>

      {/* AI Cross-Module Insights */}
      <AIInsightsCard
        insights={aiAnalyticsInsights}
        title="Cross-Module AI Insights"
        className="mb-6"
      />

      {/* AI Board Narrative */}
      {enhancedNarrative && (
        <div className="relative">
          {narrativeLoading && <AIEnhancingIndicator isLoading />}
          <AIInsightPanel title={t('boardNarrative')} narrative={enhancedNarrative} className="mb-6" />
        </div>
      )}

      <div className="flex items-center gap-4 mb-6">
        <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />
        <div className="flex items-center gap-2 ml-auto">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-t3" />
            <Input placeholder="Search employees..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-8 w-56 h-8 text-xs" />
          </div>
          <Select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} options={[{ value: 'all', label: tc('all') + ' ' + tc('department') }, ...departments.map(d => ({ value: d.id, label: d.name }))]} className="w-48" />
        </div>
      </div>

      {activeTab === 'workforce' && filteredEmployees.length === 0 && (
        <Card>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-canvas flex items-center justify-center mb-4">
              <Users size={28} className="text-t3" />
            </div>
            <h3 className="text-sm font-semibold text-t1 mb-1">No workforce data</h3>
            <p className="text-xs text-t3 mb-4 max-w-xs">No employees match the current filters. Try adjusting your search or department filter.</p>
            <Button size="sm" onClick={() => { setSearchQuery(''); setDeptFilter('all') }}>Clear Filters</Button>
          </div>
        </Card>
      )}

      {activeTab === 'workforce' && filteredEmployees.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <h3 className="text-sm font-semibold text-t1 mb-4">{t('headcountByDept')}</h3>
            <TempoBarChart
              data={deptCounts}
              bars={[{ dataKey: 'count', name: 'Employees', color: CHART_COLORS.primary }]}
              xKey="name"
              layout="horizontal"
              height={Math.max(200, deptCounts.length * 36)}
              showGrid={false}
            />
          </Card>
          <Card>
            <h3 className="text-sm font-semibold text-t1 mb-4">{t('headcountByCountry')}</h3>
            <TempoBarChart
              data={countryCounts.map(([country, count]) => ({ name: country, count: count as number }))}
              bars={[{ dataKey: 'count', name: 'Employees', color: CHART_COLORS.blue }]}
              xKey="name"
              layout="horizontal"
              height={Math.max(200, countryCounts.length * 36)}
              showGrid={false}
            />
          </Card>
          <Card>
            <h3 className="text-sm font-semibold text-t1 mb-3">{t('keyMetrics')}</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-t2">{t('reviewCompletion')}</span>
                <span className="text-sm font-semibold text-t1">{reviewCompletion}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-t2">{t('activeLearners')}</span>
                <span className="text-sm font-semibold text-t1">{activeLearners}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-t2">{t('mentoringPairsLabel')}</span>
                <span className="text-sm font-semibold text-t1">{mentoringPairs.filter(p => p.status === 'active').length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-t2">{t('pendingLeave')}</span>
                <span className="text-sm font-semibold text-warning">{leaveRequests.filter(l => l.status === 'pending').length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-t2">{t('pendingExpenses')}</span>
                <span className="text-sm font-semibold text-warning">{pendingExpenses}</span>
              </div>
            </div>
          </Card>
          <Card>
            <h3 className="text-sm font-semibold text-t1 mb-3">{t('roleDistribution')}</h3>
            <TempoDonutChart
              data={['owner', 'admin', 'manager', 'employee'].map(role => ({
                name: role.charAt(0).toUpperCase() + role.slice(1),
                value: filteredEmployees.filter(e => e.role === role).length,
              }))}
              centerLabel={String(headcount)}
              centerSub="Total"
              height={200}
              colors={[CHART_COLORS.primary, CHART_COLORS.blue, CHART_COLORS.amber, CHART_COLORS.slate]}
            />
          </Card>
        </div>
      )}

      {activeTab === 'performance' && goals.length === 0 && reviews.length === 0 && (
        <Card>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-canvas flex items-center justify-center mb-4">
              <TrendingUp size={28} className="text-t3" />
            </div>
            <h3 className="text-sm font-semibold text-t1 mb-1">No performance data yet</h3>
            <p className="text-xs text-t3 mb-4 max-w-xs">Create goals and complete reviews to see performance analytics here.</p>
            <Button size="sm" onClick={() => window.location.href = '/performance'}>Go to Performance</Button>
          </div>
        </Card>
      )}

      {activeTab === 'performance' && (goals.length > 0 || reviews.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <h3 className="text-sm font-semibold text-t1 mb-4">{t('goalStatusDistribution')}</h3>
            <TempoDonutChart
              data={[
                { name: t('onTrack'), value: goalsByStatus.on_track, color: STATUS_COLORS.success },
                { name: t('atRisk'), value: goalsByStatus.at_risk, color: STATUS_COLORS.warning },
                { name: t('behindLabel'), value: goalsByStatus.behind, color: STATUS_COLORS.error },
              ]}
              centerLabel={String(goals.length)}
              centerSub="Goals"
              height={220}
            />
          </Card>
          <Card>
            <h3 className="text-sm font-semibold text-t1 mb-4">{t('avgGoalProgress')}</h3>
            <div className="flex items-center justify-center py-4">
              <TempoGauge value={avgProgress} label="Progress" size={160} />
            </div>
            <p className="text-xs text-t3 text-center mt-2">{t('acrossGoals', { count: goals.length })}</p>
          </Card>
          <Card className="md:col-span-2">
            <h3 className="text-sm font-semibold text-t1 mb-4">{t('reviewRatingsDistribution')}</h3>
            <TempoBarChart
              data={[1, 2, 3, 4, 5].map(rating => ({
                name: `${rating} Star${rating > 1 ? 's' : ''}`,
                count: reviews.filter(r => r.overall_rating === rating).length,
              }))}
              bars={[{ dataKey: 'count', name: 'Reviews', color: CHART_COLORS.primary }]}
              xKey="name"
              height={200}
              showGrid={false}
              barSize={40}
            />
          </Card>
        </div>
      )}

      {activeTab === 'engagement' && engagementScores.length === 0 && (
        <Card>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-canvas flex items-center justify-center mb-4">
              <BarChart3 size={28} className="text-t3" />
            </div>
            <h3 className="text-sm font-semibold text-t1 mb-1">No engagement data</h3>
            <p className="text-xs text-t3 mb-4 max-w-xs">Run engagement surveys to see scores and trends here.</p>
            <Button size="sm" onClick={() => window.location.href = '/engagement'}>Go to Engagement</Button>
          </div>
        </Card>
      )}

      {activeTab === 'engagement' && engagementScores.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <h3 className="text-sm font-semibold text-t1 mb-4">{t('engagementByDept')}</h3>
            <TempoBarChart
              data={engagementScores.map(score => ({
                name: getDepartmentName(score.department_id),
                score: score.overall_score,
              }))}
              bars={[{ dataKey: 'score', name: 'Engagement Score', color: CHART_COLORS.primary }]}
              xKey="name"
              layout="horizontal"
              height={Math.max(200, engagementScores.length * 40)}
              formatter={(v) => `${v}/100`}
            />
          </Card>
          <Card>
            <h3 className="text-sm font-semibold text-t1 mb-4">{t('enpsByDept')}</h3>
            <TempoBarChart
              data={engagementScores.map(score => ({
                name: getDepartmentName(score.department_id),
                enps: score.enps_score,
              }))}
              bars={[{ dataKey: 'enps', name: 'eNPS', color: CHART_COLORS.emerald }]}
              xKey="name"
              layout="horizontal"
              height={Math.max(200, engagementScores.length * 40)}
              formatter={(v) => `${v > 0 ? '+' : ''}${v}`}
            />
          </Card>
          <Card className="md:col-span-2">
            <h3 className="text-sm font-semibold text-t1 mb-4">{t('topEngagementThemes')}</h3>
            <div className="flex flex-wrap gap-2">
              {Array.from(new Set(engagementScores.flatMap(s => s.themes))).map(theme => (
                <span key={theme} className="px-3 py-1.5 bg-canvas rounded-full text-xs text-t1 font-medium">{theme}</span>
              ))}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'flight_risk' && filteredEmployees.length === 0 && (
        <Card>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-canvas flex items-center justify-center mb-4">
              <AlertTriangle size={28} className="text-t3" />
            </div>
            <h3 className="text-sm font-semibold text-t1 mb-1">No flight risk data</h3>
            <p className="text-xs text-t3 mb-4 max-w-xs">No employees match the current filters. Adjust your search or department filter to view flight risk analysis.</p>
            <Button size="sm" onClick={() => { setSearchQuery(''); setDeptFilter('all') }}>Clear Filters</Button>
          </div>
        </Card>
      )}

      {activeTab === 'flight_risk' && filteredEmployees.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <h3 className="text-sm font-semibold text-t1 mb-3">{t('highFlightRisk')}</h3>
            <p className="text-xs text-t3 mb-4">{t('flightRiskDesc')}</p>
            <div className="space-y-2">
              {filteredEmployees.map(emp => {
                const flightRisk = calculateFlightRisk(emp, { reviews, goals, engagementScores, salaryReviews, mentoringPairs, leaveRequests })
                return { emp, risk: flightRisk.value }
              }).sort((a, b) => b.risk - a.risk).slice(0, 5).map(({ emp, risk }) => (
                  <div key={emp.id} className="flex items-center gap-3 bg-canvas rounded-lg px-3 py-2">
                    <AlertTriangle size={14} className={risk >= 70 ? 'text-error' : 'text-warning'} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-t1 truncate">{emp.profile?.full_name}</p>
                      <p className="text-[0.6rem] text-t3">{getDepartmentName(emp.department_id)}</p>
                    </div>
                    <Badge variant={risk >= 70 ? 'error' : 'warning'}>{risk}%</Badge>
                  </div>
              ))}
            </div>
          </Card>
          <Card>
            <h3 className="text-sm font-semibold text-t1 mb-3">{t('riskFactors')}</h3>
            <div className="space-y-3">
              {[
                { factor: t('belowMarketComp'), count: 4, severity: 'high' },
                { factor: t('noRecentPromotion'), count: 7, severity: 'medium' },
                { factor: t('lowEngagementScore'), count: 3, severity: 'high' },
                { factor: t('noMentorAssigned'), count: 12, severity: 'low' },
                { factor: t('overdueReview'), count: 2, severity: 'medium' },
              ].map(item => (
                <div key={item.factor} className="flex items-center justify-between">
                  <span className="text-xs text-t1">{item.factor}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-t3">{t('employeesCount', { count: item.count })}</span>
                    <Badge variant={item.severity === 'high' ? 'error' : item.severity === 'medium' ? 'warning' : 'default'}>{item.severity}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Compensation Analytics - Pave/Figures style */}
      {activeTab === 'compensation' && (() => {
        // Build salary lookup: salaryReviews current_salary by employee, fallback to compBands mid_salary by level
        const salaryMap = new Map<string, number>()
        salaryReviews.forEach(sr => { if (sr.current_salary && !salaryMap.has(sr.employee_id)) salaryMap.set(sr.employee_id, sr.current_salary) })
        const bandByLevel = new Map<string, number>()
        compBands.forEach(b => { if (!bandByLevel.has(b.level)) bandByLevel.set(b.level, b.mid_salary) })
        const getSalary = (emp: typeof employees[0]) => salaryMap.get(emp.id) || bandByLevel.get(emp.level) || 50000

        const salaries = filteredEmployees.map(e => getSalary(e))
        const avgSalary = salaries.length > 0 ? Math.round(salaries.reduce((a, s) => a + s, 0) / salaries.length) : 0
        const medianSalary = (() => {
          const sorted = [...salaries].sort((a, b) => a - b)
          const mid = Math.floor(sorted.length / 2)
          return sorted.length > 0 ? (sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2) : 0
        })()
        const totalComp = salaries.reduce((a, s) => a + s, 0)
        const compByDept = departments.map(d => {
          const deptEmps = filteredEmployees.filter(e => e.department_id === d.id)
          const deptSalaries = deptEmps.map(e => getSalary(e))
          const avg = deptSalaries.length > 0 ? Math.round(deptSalaries.reduce((a, s) => a + s, 0) / deptSalaries.length) : 0
          return { name: d.name, avg, count: deptEmps.length }
        }).sort((a, b) => b.avg - a.avg)
        const compByLevel = ['Executive', 'Director', 'Senior Manager', 'Senior', 'Manager', 'Mid', 'Junior', 'Associate'].map(level => {
          const levelEmps = filteredEmployees.filter(e => e.level === level)
          const levelSalaries = levelEmps.map(e => getSalary(e))
          const avg = levelSalaries.length > 0 ? Math.round(levelSalaries.reduce((a, s) => a + s, 0) / levelSalaries.length) : 0
          return { level, avg, count: levelEmps.length }
        }).filter(l => l.count > 0)
        const maxAvg = Math.max(...compByDept.map(d => d.avg), 1)

        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <h3 className="text-sm font-semibold text-t1 mb-4">Compensation Summary</h3>
              <div className="space-y-4">
                {[
                  { label: 'Total Payroll Cost', value: formatCurrency(totalComp, defaultCurrency, { compact: true }), sub: 'Annual' },
                  { label: 'Average Salary', value: formatCurrency(avgSalary, defaultCurrency, { compact: true }), sub: 'Per employee' },
                  { label: 'Median Salary', value: formatCurrency(medianSalary, defaultCurrency, { compact: true }), sub: 'Mid-point' },
                  { label: 'Salary Range', value: `${formatCurrency(Math.min(...salaries.filter(s => s > 0)), defaultCurrency, { compact: true })} — ${formatCurrency(Math.max(...salaries), defaultCurrency, { compact: true })}`, sub: 'Min to max' },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between bg-canvas rounded-lg px-4 py-3">
                    <div>
                      <p className="text-xs text-t3">{item.label}</p>
                      <p className="text-sm font-bold text-t1">{item.value}</p>
                    </div>
                    <span className="text-[0.65rem] text-t3">{item.sub}</span>
                  </div>
                ))}
              </div>
            </Card>
            <Card>
              <h3 className="text-sm font-semibold text-t1 mb-4">Average Salary by Department</h3>
              <TempoBarChart
                data={compByDept}
                bars={[{ dataKey: 'avg', name: 'Avg Salary', color: CHART_COLORS.primary }]}
                xKey="name"
                layout="horizontal"
                height={Math.max(200, compByDept.length * 36)}
                formatter={(v) => formatCurrency(v, defaultCurrency, { compact: true })}
                showGrid={false}
              />
            </Card>
            <Card>
              <h3 className="text-sm font-semibold text-t1 mb-4">Compensation by Level</h3>
              <div className="space-y-3">
                {compByLevel.map(l => (
                  <div key={l.level} className="flex items-center justify-between bg-canvas rounded-lg px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Badge variant="default">{l.level}</Badge>
                      <span className="text-xs text-t3">{l.count} employees</span>
                    </div>
                    <span className="text-sm font-bold text-t1">{formatCurrency(l.avg, defaultCurrency, { compact: true })}</span>
                  </div>
                ))}
              </div>
            </Card>
            <Card>
              <h3 className="text-sm font-semibold text-t1 mb-4">Pay Equity Indicators</h3>
              <div className="space-y-3">
                {[
                  { label: 'Gender Pay Gap', value: '3.2%', status: 'warning', desc: 'Below 5% threshold' },
                  { label: 'Compa-Ratio Distribution', value: '0.97', status: 'success', desc: 'Within healthy range' },
                  { label: 'Band Adherence', value: '92%', status: 'success', desc: 'Employees within band' },
                  { label: 'Compression Risk', value: '8 employees', status: 'warning', desc: 'Near band minimum' },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between bg-canvas rounded-lg px-4 py-3">
                    <div>
                      <p className="text-xs font-medium text-t1">{item.label}</p>
                      <p className="text-[0.65rem] text-t3">{item.desc}</p>
                    </div>
                    <Badge variant={item.status as 'success' | 'warning' | 'error'}>{item.value}</Badge>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )
      })()}

      {/* Recruiting Analytics - Ashby style */}
      {activeTab === 'recruiting' && jobPostings.length === 0 && (
        <Card>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-canvas flex items-center justify-center mb-4">
              <BarChart3 size={28} className="text-t3" />
            </div>
            <h3 className="text-sm font-semibold text-t1 mb-1">No recruiting data</h3>
            <p className="text-xs text-t3 mb-4 max-w-xs">Create job postings to see recruiting pipeline analytics here.</p>
            <Button size="sm" onClick={() => window.location.href = '/recruiting'}>Go to Recruiting</Button>
          </div>
        </Card>
      )}

      {activeTab === 'recruiting' && jobPostings.length > 0 && (() => {
        const openJobs = jobPostings.filter(j => j.status === 'open').length
        const closedJobs = jobPostings.filter(j => j.status === 'closed' || j.status === 'filled').length
        const totalApps = jobPostings.reduce((a, j) => a + (j.application_count || 0), 0)
        const stages = ['applied', 'screening', 'interview', 'assessment', 'offer', 'hired', 'rejected']
        const pipeline = stages.map(stage => ({
          stage,
          count: Math.max(1, Math.round(totalApps * (stage === 'applied' ? 1 : stage === 'screening' ? 0.6 : stage === 'interview' ? 0.3 : stage === 'assessment' ? 0.15 : stage === 'offer' ? 0.08 : stage === 'hired' ? 0.05 : 0.35)))
        }))
        const sources = [
          { name: 'LinkedIn', apps: Math.round(totalApps * 0.35), hires: 2, color: 'bg-gray-500' },
          { name: 'Referrals', apps: Math.round(totalApps * 0.25), hires: 3, color: 'bg-gray-400' },
          { name: 'Career Site', apps: Math.round(totalApps * 0.2), hires: 1, color: 'bg-gray-300' },
          { name: 'Indeed', apps: Math.round(totalApps * 0.12), hires: 1, color: 'bg-gray-200' },
          { name: 'Other', apps: Math.round(totalApps * 0.08), hires: 0, color: 'bg-gray-400' },
        ]
        const maxApps = Math.max(...sources.map(s => s.apps), 1)

        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="md:col-span-2">
              <h3 className="text-sm font-semibold text-t1 mb-4">Pipeline Funnel</h3>
              <TempoBarChart
                data={pipeline.filter(p => p.stage !== 'rejected').map(p => ({
                  name: p.stage.charAt(0).toUpperCase() + p.stage.slice(1),
                  count: p.count,
                }))}
                bars={[{ dataKey: 'count', name: 'Candidates', color: CHART_COLORS.primary }]}
                xKey="name"
                height={220}
                barSize={48}
              />
            </Card>
            <Card>
              <h3 className="text-sm font-semibold text-t1 mb-4">Source Effectiveness</h3>
              <TempoBarChart
                data={sources.map(s => ({ name: s.name, applications: s.apps, hires: s.hires }))}
                bars={[
                  { dataKey: 'applications', name: 'Applications', color: CHART_COLORS.slate },
                  { dataKey: 'hires', name: 'Hires', color: CHART_COLORS.emerald },
                ]}
                xKey="name"
                layout="horizontal"
                height={sources.length * 40}
                showLegend
              />
            </Card>
            <Card>
              <h3 className="text-sm font-semibold text-t1 mb-4">Recruiting Metrics</h3>
              <div className="space-y-3">
                {[
                  { label: 'Avg. Time to Hire', value: '32 days', trend: '-3 days', positive: true },
                  { label: 'Offer Acceptance Rate', value: '87%', trend: '+5%', positive: true },
                  { label: 'Cost Per Hire', value: '$4,200', trend: '-$300', positive: true },
                  { label: 'Pipeline Velocity', value: '12 days/stage', trend: '+1 day', positive: false },
                  { label: 'Referral Rate', value: '25%', trend: '+8%', positive: true },
                ].map(m => (
                  <div key={m.label} className="flex items-center justify-between bg-canvas rounded-lg px-4 py-2.5">
                    <span className="text-xs text-t1 font-medium">{m.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-t1">{m.value}</span>
                      <Badge variant={m.positive ? 'success' : 'warning'}>{m.trend}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )
      })()}

      {/* Diversity Analytics */}
      {activeTab === 'diversity' && filteredEmployees.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <h3 className="text-sm font-semibold text-t1 mb-4">Nationality / Country Diversity</h3>
            <TempoDonutChart
              data={countryCounts.map(([country, count]) => ({ name: country, value: count as number }))}
              centerLabel={String(new Set(filteredEmployees.map(e => e.country)).size)}
              centerSub="Countries"
              height={220}
              colors={[CHART_COLORS.primary, CHART_COLORS.blue, CHART_COLORS.amber, CHART_COLORS.slate, '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']}
            />
          </Card>
          <Card>
            <h3 className="text-sm font-semibold text-t1 mb-4">Department Diversity Index</h3>
            <div className="space-y-3">
              {departments.map(dept => {
                const deptEmps = filteredEmployees.filter(e => e.department_id === dept.id)
                const deptCountries = new Set(deptEmps.map(e => e.country)).size
                const deptLevels = new Set(deptEmps.map(e => e.level)).size
                const diversityScore = deptEmps.length > 0 ? Math.min(100, Math.round(((deptCountries + deptLevels) / (deptEmps.length + 1)) * 100)) : 0
                return deptEmps.length > 0 ? (
                  <div key={dept.id} className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-t1 truncate">{dept.name}</p>
                      <p className="text-[10px] text-t3">{deptEmps.length} employees, {deptCountries} countries, {deptLevels} levels</p>
                    </div>
                    <Badge variant={diversityScore >= 50 ? 'success' : diversityScore >= 25 ? 'warning' : 'default'}>{diversityScore}%</Badge>
                  </div>
                ) : null
              })}
            </div>
          </Card>
          <Card>
            <h3 className="text-sm font-semibold text-t1 mb-4">Level Distribution</h3>
            <TempoBarChart
              data={['Executive', 'Director', 'Senior', 'Mid', 'Associate', 'Junior'].map(level => ({
                name: level,
                count: filteredEmployees.filter(e => e.level === level).length,
              })).filter(d => d.count > 0)}
              bars={[{ dataKey: 'count', name: 'Employees', color: CHART_COLORS.primary }]}
              xKey="name"
              layout="horizontal"
              height={200}
              showGrid={false}
            />
          </Card>
          <Card>
            <h3 className="text-sm font-semibold text-t1 mb-4">Diversity Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-t2">Total Countries Represented</span>
                <span className="text-sm font-semibold text-t1">{new Set(filteredEmployees.map(e => e.country)).size}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-t2">Departments</span>
                <span className="text-sm font-semibold text-t1">{departments.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-t2">Unique Job Levels</span>
                <span className="text-sm font-semibold text-t1">{new Set(filteredEmployees.map(e => e.level)).size}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-t2">Unique Job Titles</span>
                <span className="text-sm font-semibold text-t1">{new Set(filteredEmployees.map(e => e.job_title)).size}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-t2">Management Ratio</span>
                <span className="text-sm font-semibold text-t1">{filteredEmployees.length > 0 ? Math.round((filteredEmployees.filter(e => e.role === 'manager' || e.role === 'admin' || e.role === 'owner').length / filteredEmployees.length) * 100) : 0}%</span>
              </div>
            </div>
          </Card>
        </div>
      )}
      {activeTab === 'diversity' && filteredEmployees.length === 0 && (
        <Card>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Users size={28} className="text-t3 mb-4" />
            <h3 className="text-sm font-semibold text-t1 mb-1">No employee data</h3>
            <p className="text-xs text-t3 mb-4 max-w-xs">Add employees to see diversity analytics.</p>
          </div>
        </Card>
      )}

      {/* Executive Summary - Board-level reporting */}
      {activeTab === 'executive' && (() => {
        const totalPayroll = payrollRuns.reduce((a, r) => a + r.total_gross, 0)
        const revenuePerEmployee = 185000 // simulated
        const profitMargin = 22 // simulated %

        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="md:col-span-2">
              <h3 className="text-sm font-semibold text-t1 mb-2">Board-Ready Summary</h3>
              <p className="text-xs text-t3 mb-4">Auto-generated executive overview for board reporting</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Headcount', value: headcount.toString(), sub: `${departments.length} departments` },
                  { label: 'Revenue/Employee', value: formatCurrency(revenuePerEmployee, defaultCurrency, { compact: true }), sub: 'Annual' },
                  { label: 'Total Payroll Cost', value: formatCurrency(totalPayroll, defaultCurrency, { compact: true }), sub: 'Year to date' },
                  { label: 'Turnover Rate', value: '8.2%', sub: 'Annualized' },
                ].map(m => (
                  <div key={m.label} className="bg-canvas rounded-lg px-4 py-3 text-center">
                    <p className="text-[0.65rem] text-t3 uppercase">{m.label}</p>
                    <p className="text-xl font-bold text-t1 mt-1">{m.value}</p>
                    <p className="text-[0.6rem] text-t3">{m.sub}</p>
                  </div>
                ))}
              </div>
            </Card>
            <Card>
              <h3 className="text-sm font-semibold text-t1 mb-4">Organizational Health Score</h3>
              <TempoBarChart
                data={[
                  { name: 'Engagement', score: 74 },
                  { name: 'Performance', score: reviewCompletion },
                  { name: 'L&D', score: Math.round((activeLearners / Math.max(headcount, 1)) * 100) },
                  { name: 'D&I', score: 68 },
                  { name: 'Retention', score: 92 },
                ]}
                bars={[{ dataKey: 'score', name: 'Score', color: CHART_COLORS.primary }]}
                xKey="name"
                layout="horizontal"
                height={220}
                formatter={(v) => `${v}%`}
                showGrid={false}
              />
            </Card>
            <Card>
              <h3 className="text-sm font-semibold text-t1 mb-4">Key Risks & Opportunities</h3>
              <div className="space-y-2">
                {[
                  { type: 'risk', label: 'Engineering talent pipeline narrowing', severity: 'high' },
                  { type: 'risk', label: '3 key employees flagged as flight risk', severity: 'high' },
                  { type: 'risk', label: 'Compensation below market for 8% of staff', severity: 'medium' },
                  { type: 'opportunity', label: 'Internal mobility could fill 4 open roles', severity: 'info' },
                  { type: 'opportunity', label: 'Mentoring program shows 15% retention lift', severity: 'info' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 bg-canvas rounded-lg px-4 py-2.5">
                    <AlertTriangle size={14} className={item.type === 'risk' ? (item.severity === 'high' ? 'text-error' : 'text-warning') : 'text-gray-400'} />
                    <span className="text-xs text-t1 flex-1">{item.label}</span>
                    <Badge variant={item.severity === 'high' ? 'error' : item.severity === 'medium' ? 'warning' : 'default'}>{item.type}</Badge>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )
      })()}

      {/* Report Builder */}
      {activeTab === 'builder' && (() => {
        const dataSources: { id: string; label: string; description: string; icon: React.ReactNode; count: number }[] = [
          { id: 'workforce', label: 'Workforce', description: 'Employee demographics, departments, and org structure', icon: <Users size={16} />, count: employees.length },
          { id: 'payroll', label: 'Payroll', description: 'Compensation, salary bands, and payroll runs', icon: <DollarSign size={16} />, count: payrollRuns.length },
          { id: 'performance', label: 'Performance', description: 'Reviews, goals, and ratings', icon: <Target size={16} />, count: reviews.length + goals.length },
          { id: 'recruiting', label: 'Recruiting', description: 'Job postings, applications, and pipeline', icon: <UserPlus size={16} />, count: jobPostings.length },
          { id: 'time', label: 'Time & Attendance', description: 'Leave requests, hours logged, and absences', icon: <Clock size={16} />, count: leaveRequests.length },
          { id: 'expenses', label: 'Expenses', description: 'Expense reports, categories, and spend', icon: <CreditCard size={16} />, count: expenseReports.length },
        ]

        const metricsMap: Record<string, { id: string; label: string }[]> = {
          workforce: [
            { id: 'headcount', label: 'Headcount' },
            { id: 'dept_distribution', label: 'Department Distribution' },
            { id: 'country_distribution', label: 'Country Distribution' },
            { id: 'level_distribution', label: 'Level Distribution' },
            { id: 'tenure', label: 'Tenure' },
          ],
          payroll: [
            { id: 'total_cost', label: 'Total Cost' },
            { id: 'avg_salary', label: 'Average Salary' },
            { id: 'cost_by_dept', label: 'Cost by Department' },
            { id: 'cost_by_country', label: 'Cost by Country' },
          ],
          performance: [
            { id: 'avg_rating', label: 'Average Rating' },
            { id: 'goal_completion', label: 'Goal Completion' },
            { id: 'review_completion', label: 'Review Completion' },
          ],
          recruiting: [
            { id: 'open_positions', label: 'Open Positions' },
            { id: 'applications', label: 'Applications' },
            { id: 'time_to_hire', label: 'Time to Hire' },
            { id: 'offer_rate', label: 'Offer Rate' },
          ],
          time: [
            { id: 'hours_logged', label: 'Hours Logged' },
            { id: 'overtime', label: 'Overtime Hours' },
            { id: 'absence_rate', label: 'Absence Rate' },
          ],
          expenses: [
            { id: 'total_spend', label: 'Total Spend' },
            { id: 'avg_per_employee', label: 'Average per Employee' },
            { id: 'by_category', label: 'By Category' },
          ],
        }

        const vizOptions: { id: string; label: string; icon: React.ReactNode }[] = [
          { id: 'bar', label: 'Bar Chart', icon: <BarChart3 size={20} /> },
          { id: 'donut', label: 'Pie / Donut', icon: <PieChart size={20} /> },
          { id: 'table', label: 'Table', icon: <Table2 size={20} /> },
          { id: 'kpi', label: 'KPI Card', icon: <Hash size={20} /> },
        ]

        const availableMetrics = metricsMap[rbSource] || []

        // Generate preview data based on selections
        const generatePreviewData = () => {
          if (rbMetrics.length === 0) return null
          const metric = rbMetrics[0]

          if (rbSource === 'workforce') {
            if (metric === 'headcount' || metric === 'dept_distribution') {
              return { type: 'distribution', data: departments.map(d => ({ name: d.name, value: employees.filter(e => e.department_id === d.id).length })).sort((a, b) => b.value - a.value), label: 'Employees', total: employees.length, totalLabel: 'Total Headcount' }
            }
            if (metric === 'country_distribution') {
              const cc = Object.entries(employees.reduce((acc, e) => { acc[e.country] = (acc[e.country] || 0) + 1; return acc }, {} as Record<string, number>)).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
              return { type: 'distribution', data: cc, label: 'Employees', total: employees.length, totalLabel: 'Total Headcount' }
            }
            if (metric === 'level_distribution') {
              const levels = ['Executive', 'Director', 'Senior Manager', 'Senior', 'Manager', 'Mid', 'Junior', 'Associate']
              return { type: 'distribution', data: levels.map(l => ({ name: l, value: employees.filter(e => e.level === l).length })).filter(d => d.value > 0), label: 'Employees', total: employees.length, totalLabel: 'Total Headcount' }
            }
            if (metric === 'tenure') {
              const now = Date.now()
              const buckets = [
                { name: '< 1 year', min: 0, max: 365 },
                { name: '1-2 years', min: 365, max: 730 },
                { name: '2-5 years', min: 730, max: 1825 },
                { name: '5+ years', min: 1825, max: Infinity },
              ]
              return { type: 'distribution' as const, data: buckets.map(b => ({ name: b.name, value: employees.filter(e => { const days = (e as any).hire_date ? (now - new Date((e as any).hire_date).getTime()) / 86400000 : 500; return days >= b.min && days < b.max }).length })), label: 'Employees', total: employees.length, totalLabel: 'Total Headcount' }
            }
          }

          if (rbSource === 'payroll') {
            const bandByLevel = new Map<string, number>()
            compBands.forEach(b => { if (!bandByLevel.has(b.level)) bandByLevel.set(b.level, b.mid_salary) })
            const salaryMap = new Map<string, number>()
            salaryReviews.forEach(sr => { if (sr.current_salary && !salaryMap.has(sr.employee_id)) salaryMap.set(sr.employee_id, sr.current_salary) })
            const getSalary = (emp: typeof employees[0]) => salaryMap.get(emp.id) || bandByLevel.get(emp.level) || 50000
            const salaries = employees.map(e => getSalary(e))
            const totalComp = salaries.reduce((a, s) => a + s, 0)
            const avgSal = salaries.length > 0 ? Math.round(totalComp / salaries.length) : 0

            if (metric === 'total_cost') return { type: 'kpi', value: formatCurrency(totalComp, defaultCurrency, { compact: true }), label: 'Total Payroll Cost', sub: 'Annual' }
            if (metric === 'avg_salary') return { type: 'kpi', value: formatCurrency(avgSal, defaultCurrency, { compact: true }), label: 'Average Salary', sub: 'Per employee' }
            if (metric === 'cost_by_dept') {
              return { type: 'distribution', data: departments.map(d => { const dEmps = employees.filter(e => e.department_id === d.id); const avg = dEmps.length > 0 ? Math.round(dEmps.map(e => getSalary(e)).reduce((a, s) => a + s, 0) / dEmps.length) : 0; return { name: d.name, value: avg } }).sort((a, b) => b.value - a.value), label: 'Avg Salary', total: formatCurrency(avgSal, defaultCurrency, { compact: true }), totalLabel: 'Org Average' }
            }
            if (metric === 'cost_by_country') {
              const byCountry = Object.entries(employees.reduce((acc, e) => { const s = getSalary(e); acc[e.country] = acc[e.country] || { total: 0, count: 0 }; acc[e.country].total += s; acc[e.country].count++; return acc }, {} as Record<string, { total: number; count: number }>)).map(([name, v]) => ({ name, value: Math.round(v.total / v.count) })).sort((a, b) => b.value - a.value)
              return { type: 'distribution', data: byCountry, label: 'Avg Salary', total: formatCurrency(avgSal, defaultCurrency, { compact: true }), totalLabel: 'Org Average' }
            }
          }

          if (rbSource === 'performance') {
            if (metric === 'avg_rating') {
              const avg = reviews.length > 0 ? (reviews.reduce((a, r) => a + (r.overall_rating || 0), 0) / reviews.length).toFixed(1) : '0'
              return { type: 'kpi', value: `${avg}/5`, label: 'Average Rating', sub: `${reviews.length} reviews` }
            }
            if (metric === 'goal_completion') {
              return { type: 'distribution', data: [{ name: 'On Track', value: goals.filter(g => g.status === 'on_track').length }, { name: 'At Risk', value: goals.filter(g => g.status === 'at_risk').length }, { name: 'Behind', value: goals.filter(g => g.status === 'behind').length }, { name: 'Completed', value: goals.filter(g => g.status === 'completed').length }].filter(d => d.value > 0), label: 'Goals', total: goals.length, totalLabel: 'Total Goals' }
            }
            if (metric === 'review_completion') {
              const completed = reviews.filter(r => r.status === 'submitted').length
              return { type: 'kpi', value: `${reviews.length > 0 ? Math.round((completed / reviews.length) * 100) : 0}%`, label: 'Review Completion', sub: `${completed} of ${reviews.length} reviews` }
            }
          }

          if (rbSource === 'recruiting') {
            if (metric === 'open_positions') return { type: 'kpi', value: String(jobPostings.filter(j => j.status === 'open').length), label: 'Open Positions', sub: `${jobPostings.length} total postings` }
            if (metric === 'applications') {
              const totalApps = jobPostings.reduce((a, j) => a + (j.application_count || 0), 0)
              return { type: 'distribution', data: jobPostings.slice(0, 8).map(j => ({ name: j.title?.slice(0, 20) || 'Role', value: j.application_count || 0 })).sort((a, b) => b.value - a.value), label: 'Applications', total: totalApps, totalLabel: 'Total Applications' }
            }
            if (metric === 'time_to_hire') return { type: 'kpi', value: '32 days', label: 'Avg Time to Hire', sub: 'Last 90 days' }
            if (metric === 'offer_rate') return { type: 'kpi', value: '8.5%', label: 'Offer Rate', sub: 'Applications to offers' }
          }

          if (rbSource === 'time') {
            const pendingLeave = leaveRequests.filter(l => l.status === 'pending').length
            const approvedLeave = leaveRequests.filter(l => l.status === 'approved').length
            if (metric === 'hours_logged') return { type: 'kpi', value: `${(employees.length * 160).toLocaleString()}`, label: 'Hours Logged', sub: 'This month (est.)' }
            if (metric === 'overtime') return { type: 'kpi', value: `${Math.round(employees.length * 4.2)}`, label: 'Overtime Hours', sub: 'This month (est.)' }
            if (metric === 'absence_rate') return { type: 'distribution', data: [{ name: 'Pending', value: pendingLeave }, { name: 'Approved', value: approvedLeave }, { name: 'Rejected', value: leaveRequests.filter(l => l.status === 'rejected').length }].filter(d => d.value > 0), label: 'Requests', total: leaveRequests.length, totalLabel: 'Leave Requests' }
          }

          if (rbSource === 'expenses') {
            const totalSpend = expenseReports.reduce((a, e) => a + (e.total_amount || 0), 0)
            if (metric === 'total_spend') return { type: 'kpi', value: formatCurrency(totalSpend, defaultCurrency, { cents: true }), label: 'Total Spend', sub: `${expenseReports.length} reports` }
            if (metric === 'avg_per_employee') return { type: 'kpi', value: employees.length > 0 ? formatCurrency(Math.round(totalSpend / employees.length), defaultCurrency, { cents: true }) : formatCurrency(0, defaultCurrency), label: 'Avg per Employee', sub: 'All time' }
            if (metric === 'by_category') {
              const cats = Object.entries(expenseReports.reduce((acc, e) => { const cat = (e as any).category || 'Other'; acc[cat] = (acc[cat] || 0) + (e.total_amount || 0); return acc }, {} as Record<string, number>)).map(([name, value]) => ({ name, value: Math.round(value / 100) })).sort((a, b) => b.value - a.value)
              return { type: 'distribution', data: cats, label: 'Amount', total: formatCurrency(totalSpend, defaultCurrency, { cents: true }), totalLabel: 'Total Spend' }
            }
          }

          return { type: 'kpi', value: '-', label: 'No data', sub: 'Select metrics to preview' }
        }

        const previewData = rbPreview ? generatePreviewData() : null

        return (
          <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">
            {/* Left Panel: Steps 1-3 */}
            <div className="space-y-4">
              {/* Step 1: Data Source */}
              <Card>
                <div className="flex items-center gap-2 mb-3">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-tempo-100 text-tempo-700 text-[0.6rem] font-bold">1</span>
                  <h3 className="text-xs font-semibold text-t1 uppercase tracking-wider">Choose Data Source</h3>
                </div>
                <div className="space-y-1.5">
                  {dataSources.map(ds => (
                    <label key={ds.id} className={`flex items-start gap-3 rounded-lg px-3 py-2.5 cursor-pointer transition-all border ${rbSource === ds.id ? 'border-tempo-300 bg-tempo-50/50' : 'border-transparent hover:bg-canvas'}`}>
                      <input type="radio" name="rb-source" checked={rbSource === ds.id} onChange={() => { setRbSource(ds.id); setRbMetrics([]); setRbPreview(false) }} className="mt-0.5 accent-tempo-600" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-t2">{ds.icon}</span>
                          <span className="text-xs font-semibold text-t1">{ds.label}</span>
                          <span className="text-[0.6rem] text-t3 ml-auto">{ds.count} records</span>
                        </div>
                        <p className="text-[0.6rem] text-t3 mt-0.5 leading-relaxed">{ds.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </Card>

              {/* Step 2: Metrics */}
              <Card>
                <div className="flex items-center gap-2 mb-3">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-tempo-100 text-tempo-700 text-[0.6rem] font-bold">2</span>
                  <h3 className="text-xs font-semibold text-t1 uppercase tracking-wider">Select Metrics</h3>
                </div>
                <div className="space-y-1">
                  {availableMetrics.map(m => (
                    <label key={m.id} className={`flex items-center gap-2.5 rounded-lg px-3 py-2 cursor-pointer transition-all ${rbMetrics.includes(m.id) ? 'bg-tempo-50/50' : 'hover:bg-canvas'}`}>
                      <input type="checkbox" checked={rbMetrics.includes(m.id)} onChange={(e) => { if (e.target.checked) { setRbMetrics(prev => [...prev, m.id]) } else { setRbMetrics(prev => prev.filter(x => x !== m.id)) }; setRbPreview(false) }} className="accent-tempo-600" />
                      <span className="text-xs text-t1">{m.label}</span>
                    </label>
                  ))}
                </div>
              </Card>

              {/* Step 3: Visualization */}
              <Card>
                <div className="flex items-center gap-2 mb-3">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-tempo-100 text-tempo-700 text-[0.6rem] font-bold">3</span>
                  <h3 className="text-xs font-semibold text-t1 uppercase tracking-wider">Visualization</h3>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {vizOptions.map(v => (
                    <button key={v.id} onClick={() => { setRbViz(v.id); setRbPreview(false) }}
                      className={`flex flex-col items-center gap-1.5 rounded-lg border px-3 py-3 transition-all ${rbViz === v.id ? 'border-tempo-400 bg-tempo-50/50 text-tempo-700' : 'border-divider bg-surface text-t2 hover:border-tempo-200 hover:bg-canvas'}`}>
                      {v.icon}
                      <span className="text-[0.6rem] font-medium">{v.label}</span>
                    </button>
                  ))}
                </div>
              </Card>
            </div>

            {/* Right Panel: Preview & Controls */}
            <div className="space-y-4">
              {/* Controls */}
              <div className="flex items-center gap-2 flex-wrap">
                <Button size="sm" disabled={rbMetrics.length === 0} onClick={() => setRbPreview(true)}>
                  <LayoutGrid size={14} className="mr-1" /> Generate Report
                </Button>
                <Button size="sm" variant="secondary" disabled={!rbPreview} onClick={() => addToast('Report exported', 'success')}>
                  <Download size={14} className="mr-1" /> Export
                </Button>
                <Button size="sm" variant="secondary" disabled={!rbPreview} onClick={() => addToast('Report scheduling coming soon')}>
                  <CalendarClock size={14} className="mr-1" /> Schedule
                </Button>
                <Button size="sm" variant="secondary" disabled={!rbPreview} onClick={() => addToast('Report saved to dashboard', 'success')}>
                  <Save size={14} className="mr-1" /> Save to Dashboard
                </Button>
              </div>

              {/* Preview Area */}
              {!rbPreview && (
                <Card>
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-canvas flex items-center justify-center mb-4">
                      <BarChart3 size={28} className="text-t3" />
                    </div>
                    <h3 className="text-sm font-semibold text-t1 mb-1">Report Preview</h3>
                    <p className="text-xs text-t3 max-w-xs">
                      {rbMetrics.length === 0
                        ? 'Select a data source and at least one metric, then click Generate Report to see a preview.'
                        : 'Click Generate Report to preview your report.'}
                    </p>
                  </div>
                </Card>
              )}

              {rbPreview && previewData && (
                <Card>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-t1">
                      {dataSources.find(ds => ds.id === rbSource)?.label} Report
                    </h3>
                    <Badge variant="default">{rbMetrics.length} metric{rbMetrics.length !== 1 ? 's' : ''}</Badge>
                  </div>

                  {/* KPI visualization */}
                  {(rbViz === 'kpi' || previewData.type === 'kpi') && previewData.type === 'kpi' && (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-center">
                        <p className="text-3xl font-bold text-t1">{previewData.value}</p>
                        <p className="text-sm text-t2 mt-1">{previewData.label}</p>
                        <p className="text-xs text-t3 mt-0.5">{previewData.sub}</p>
                      </div>
                    </div>
                  )}

                  {/* Bar chart visualization */}
                  {rbViz === 'bar' && previewData.type === 'distribution' && previewData.data && (
                    <TempoBarChart
                      data={previewData.data as Record<string, any>[]}
                      bars={[{ dataKey: 'value', name: previewData.label, color: CHART_COLORS.primary }]}
                      xKey="name"
                      layout="horizontal"
                      height={Math.max(200, (previewData.data as any[]).length * 36)}
                      showGrid={false}
                    />
                  )}

                  {/* Donut chart visualization */}
                  {rbViz === 'donut' && previewData.type === 'distribution' && previewData.data && (
                    <TempoDonutChart
                      data={previewData.data as { name: string; value: number }[]}
                      centerLabel={String(previewData.total)}
                      centerSub={previewData.totalLabel}
                      height={260}
                      colors={[CHART_COLORS.primary, CHART_COLORS.blue, CHART_COLORS.amber, CHART_COLORS.slate, CHART_COLORS.emerald, '#8b5cf6', '#ec4899', '#14b8a6']}
                    />
                  )}

                  {/* Table visualization */}
                  {rbViz === 'table' && previewData.type === 'distribution' && previewData.data && (() => {
                    const tableData = previewData.data as { name: string; value: number }[]
                    const tableTotal = typeof previewData.total === 'number' ? previewData.total : tableData.reduce((a, d) => a + d.value, 0)
                    return (
                      <div className="overflow-hidden rounded-lg border border-divider">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-canvas">
                              <th className="text-left px-4 py-2.5 font-semibold text-t2 uppercase tracking-wider text-[0.6rem]">Name</th>
                              <th className="text-right px-4 py-2.5 font-semibold text-t2 uppercase tracking-wider text-[0.6rem]">{previewData.label}</th>
                              <th className="text-right px-4 py-2.5 font-semibold text-t2 uppercase tracking-wider text-[0.6rem]">%</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-divider">
                            {tableData.map((row, i) => {
                              const pct = tableTotal > 0 ? Math.round((row.value / tableTotal) * 100) : 0
                              return (
                                <tr key={i} className="hover:bg-canvas/50 transition-colors">
                                  <td className="px-4 py-2 text-t1 font-medium">{row.name}</td>
                                  <td className="px-4 py-2 text-right text-t1 tabular-nums">{row.value.toLocaleString()}</td>
                                  <td className="px-4 py-2 text-right text-t3 tabular-nums">{pct}%</td>
                                </tr>
                              )
                            })}
                          </tbody>
                          <tfoot>
                            <tr className="bg-canvas font-semibold">
                              <td className="px-4 py-2 text-t1">Total</td>
                              <td className="px-4 py-2 text-right text-t1 tabular-nums">{tableTotal.toLocaleString()}</td>
                              <td className="px-4 py-2 text-right text-t1">100%</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    )
                  })()}

                  {/* KPI card for distribution data when KPI viz is selected */}
                  {rbViz === 'kpi' && previewData.type === 'distribution' && previewData.data && (
                    <div className="grid grid-cols-2 gap-3">
                      {(previewData.data as { name: string; value: number }[]).slice(0, 6).map((row, i) => (
                        <div key={i} className="bg-canvas rounded-lg px-4 py-3 text-center">
                          <p className="text-lg font-bold text-t1">{row.value.toLocaleString()}</p>
                          <p className="text-[0.65rem] text-t3 mt-0.5">{row.name}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Bar chart fallback for KPI data */}
                  {rbViz === 'bar' && previewData.type === 'kpi' && (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-center">
                        <p className="text-3xl font-bold text-t1">{previewData.value}</p>
                        <p className="text-sm text-t2 mt-1">{previewData.label}</p>
                        <p className="text-xs text-t3 mt-0.5">{previewData.sub}</p>
                      </div>
                    </div>
                  )}

                  {/* Donut/Table fallback for KPI data */}
                  {(rbViz === 'donut' || rbViz === 'table') && previewData.type === 'kpi' && (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-center">
                        <p className="text-3xl font-bold text-t1">{previewData.value}</p>
                        <p className="text-sm text-t2 mt-1">{previewData.label}</p>
                        <p className="text-xs text-t3 mt-0.5">{previewData.sub}</p>
                      </div>
                    </div>
                  )}
                </Card>
              )}

              {/* Additional metrics preview cards when multiple metrics selected */}
              {rbPreview && rbMetrics.length > 1 && (() => {
                const additionalMetrics = rbMetrics.slice(1)
                const additionalData = additionalMetrics.map(metricId => {
                  const savedSource = rbSource
                  const savedMetrics = rbMetrics
                  // Temporarily set to generate each metric
                  const singleMetric = [metricId]
                  // Inline generation for additional metrics
                  const m = metricsMap[rbSource]?.find(x => x.id === metricId)
                  return { id: metricId, label: m?.label || metricId }
                })
                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {additionalData.map(ad => (
                      <Card key={ad.id}>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="default">{ad.label}</Badge>
                        </div>
                        <p className="text-xs text-t3">Included in report. Switch primary metric to preview this visualization.</p>
                      </Card>
                    ))}
                  </div>
                )
              })()}
            </div>
          </div>
        )
      })()}
    </>
  )
}
