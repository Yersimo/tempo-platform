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
import { Select } from '@/components/ui/input'
import { TempoBarChart, TempoDonutChart, TempoGauge, ChartLegend, CHART_COLORS, STATUS_COLORS } from '@/components/ui/charts'
import { BarChart3, TrendingUp, Users, DollarSign, AlertTriangle, FileText, Search } from 'lucide-react'
import { useTempo } from '@/lib/store'
import { PageSkeleton } from '@/components/ui/page-skeleton'
import { AIQueryBar, AIInsightPanel, AIEnhancingIndicator } from '@/components/ai'
import { parseNaturalLanguageQuery, generateBoardNarrative, calculateFlightRisk } from '@/lib/ai-engine'
import { exportToPrint } from '@/lib/export-import'

export default function AnalyticsPage() {
  const t = useTranslations('analytics')
  const tc = useTranslations('common')
  const {
    employees, departments, goals, reviews, enrollments,
    engagementScores, mentoringPairs, expenseReports,
    jobPostings, leaveRequests, payrollRuns, salaryReviews,
    compBands, courses, getDepartmentName, ensureModulesLoaded,
  } = useTempo()

  const [pageLoading, setPageLoading] = useState(true)

  useEffect(() => { ensureModulesLoaded?.(['employees', 'departments', 'goals', 'reviews', 'enrollments', 'engagementScores', 'mentoringPairs', 'expenseReports', 'jobPostings', 'leaveRequests', 'payrollRuns', 'salaryReviews', 'compBands', 'courses'])?.then?.(() => setPageLoading(false))?.catch?.(() => setPageLoading(false)) }, [])

  useEffect(() => { const t = setTimeout(() => setPageLoading(false), 2000); return () => clearTimeout(t) }, [])

  const [activeTab, setActiveTab] = useState('workforce')
  const [deptFilter, setDeptFilter] = useState('all')
  const [queryResults, setQueryResults] = useState<{ results: any[]; description: string } | null>(null)
  const [queryFollowUps, setQueryFollowUps] = useState<string[]>([])
  const [queryLoading, setQueryLoading] = useState(false)
  const [queryHighlight, setQueryHighlight] = useState('')

  // AI-powered analytics
  const boardNarrative = useMemo(() => generateBoardNarrative({ employees: employees || [], goals: goals || [], reviews: reviews || [], engagementScores: engagementScores || [], jobPostings: jobPostings || [], payrollRuns: payrollRuns || [], salaryReviews: salaryReviews || [] }), [employees, goals, reviews, salaryReviews])

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
    { id: 'executive', label: 'Executive' },
  ]

  // Filter employees by department selection
  const filteredEmployees = useMemo(() => {
    if (deptFilter === 'all') return employees
    return employees.filter(e => e.department_id === deptFilter)
  }, [employees, deptFilter])

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
        actions={<Button size="sm" onClick={() => exportToPrint(
          employees.map(e => ({ name: e.profile?.full_name || '', dept: getDepartmentName(e.department_id), country: e.country, level: e.level })),
          [
            { header: 'Name', accessor: (r: any) => r.name },
            { header: 'Department', accessor: (r: any) => r.dept },
            { header: 'Country', accessor: (r: any) => r.country },
            { header: 'Level', accessor: (r: any) => r.level },
          ],
          'Analytics Report - Workforce Overview'
        )}><FileText size={14} /> {t('generateReport')}</Button>} />

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
        <StatCard label={t('staffCost')} value={lastPayroll ? `$${(lastPayroll.total_gross / 1000).toFixed(0)}K/mo` : '-'} icon={<DollarSign size={20} />} href="/payroll" />
        <StatCard label={t('openPositions')} value={openPositions} icon={<BarChart3 size={20} />} href="/recruiting" />
      </div>

      {/* AI Board Narrative */}
      {enhancedNarrative && (
        <div className="relative">
          {narrativeLoading && <AIEnhancingIndicator isLoading />}
          <AIInsightPanel title={t('boardNarrative')} narrative={enhancedNarrative} className="mb-6" />
        </div>
      )}

      <div className="flex items-center gap-4 mb-6">
        <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />
        <Select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} options={[{ value: 'all', label: tc('all') + ' ' + tc('department') }, ...departments.map(d => ({ value: d.id, label: d.name }))]} className="w-48" />
      </div>

      {activeTab === 'workforce' && (
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

      {activeTab === 'performance' && (
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

      {activeTab === 'engagement' && (
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

      {activeTab === 'flight_risk' && (
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
                  { label: 'Total Payroll Cost', value: `$${(totalComp / 1000000).toFixed(2)}M`, sub: 'Annual' },
                  { label: 'Average Salary', value: `$${(avgSalary / 1000).toFixed(0)}K`, sub: 'Per employee' },
                  { label: 'Median Salary', value: `$${(medianSalary / 1000).toFixed(0)}K`, sub: 'Mid-point' },
                  { label: 'Salary Range', value: `$${(Math.min(...salaries.filter(s => s > 0)) / 1000).toFixed(0)}K — $${(Math.max(...salaries) / 1000).toFixed(0)}K`, sub: 'Min to max' },
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
                formatter={(v) => `$${(v / 1000).toFixed(0)}K`}
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
                    <span className="text-sm font-bold text-t1">${(l.avg / 1000).toFixed(0)}K</span>
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
      {activeTab === 'recruiting' && (() => {
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
                  { label: 'Revenue/Employee', value: `$${(revenuePerEmployee / 1000).toFixed(0)}K`, sub: 'Annual' },
                  { label: 'Total Payroll Cost', value: `$${(totalPayroll / 1000000).toFixed(1)}M`, sub: 'Year to date' },
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
    </>
  )
}
