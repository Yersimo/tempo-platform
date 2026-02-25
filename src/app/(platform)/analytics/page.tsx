'use client'

import { useState, useMemo, useCallback } from 'react'
import { useAI } from '@/lib/use-ai'
import { useTranslations } from 'next-intl'
import { Header } from '@/components/layout/header'
import { Card } from '@/components/ui/card'
import { StatCard } from '@/components/ui/stat-card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs } from '@/components/ui/tabs'
import { Select } from '@/components/ui/input'
import { BarChart3, TrendingUp, Users, DollarSign, AlertTriangle, FileText } from 'lucide-react'
import { useTempo } from '@/lib/store'
import { AIQueryBar, AIInsightPanel, AIEnhancingIndicator } from '@/components/ai'
import { parseNaturalLanguageQuery, generateBoardNarrative, calculateFlightRisk } from '@/lib/ai-engine'

export default function AnalyticsPage() {
  const t = useTranslations('analytics')
  const tc = useTranslations('common')
  const {
    employees, departments, goals, reviews, enrollments,
    engagementScores, mentoringPairs, expenseReports,
    jobPostings, leaveRequests, payrollRuns, salaryReviews,
    compBands, courses, getDepartmentName,
  } = useTempo()

  const [activeTab, setActiveTab] = useState('workforce')
  const [deptFilter, setDeptFilter] = useState('all')
  const [queryResults, setQueryResults] = useState<{ results: any[]; description: string } | null>(null)

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

  const handleAIQuery = useCallback((query: string) => {
    const storeData = { employees, departments, goals, reviews, enrollments, engagementScores, mentoringPairs, expenseReports, jobPostings, leaveRequests, payrollRuns, compBands, courses, salaryReviews }
    const result = parseNaturalLanguageQuery(query, storeData)
    setQueryResults(result)
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

  // Live computed metrics
  const headcount = employees.length
  const reviewCompletion = reviews.length > 0 ? Math.round((reviews.filter(r => r.status === 'submitted').length / reviews.length) * 100) : 0
  const activeLearners = new Set(enrollments.filter(e => e.status === 'in_progress' || e.status === 'enrolled').map(e => e.employee_id)).size
  const openPositions = jobPostings.filter(j => j.status === 'open').length
  const pendingExpenses = expenseReports.filter(e => e.status === 'submitted' || e.status === 'pending_approval').length
  const lastPayroll = payrollRuns[payrollRuns.length - 1]

  // Headcount by department
  const deptCounts = departments.map(d => ({
    name: d.name,
    count: employees.filter(e => e.department_id === d.id).length,
  })).sort((a, b) => b.count - a.count)

  // Headcount by country
  const countryCounts = Object.entries(
    employees.reduce((acc, e) => { acc[e.country] = (acc[e.country] || 0) + 1; return acc }, {} as Record<string, number>)
  ).sort((a, b) => b[1] - a[1])

  // Goal status distribution
  const goalsByStatus = {
    on_track: goals.filter(g => g.status === 'on_track').length,
    at_risk: goals.filter(g => g.status === 'at_risk').length,
    behind: goals.filter(g => g.status === 'behind').length,
  }

  // Average goal progress
  const avgProgress = goals.length > 0 ? Math.round(goals.reduce((a, g) => a + g.progress, 0) / goals.length) : 0

  return (
    <>
      <Header title={t('title')} subtitle={t('subtitle')}
        actions={<Button size="sm"><FileText size={14} /> {t('generateReport')}</Button>} />

      {/* AI Natural Language Query Bar */}
      <AIQueryBar onQuery={handleAIQuery} placeholder={t('queryPlaceholder')} className="mb-6" />
      {queryResults && (
        <AIInsightPanel title={t('queryResults')} narrative={{ summary: queryResults.description, bulletPoints: queryResults.results.slice(0, 5).map(r => r.profile?.full_name || r.title || r.id || 'Match') }} className="mb-6" />
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
            <div className="space-y-3">
              {deptCounts.map(d => (
                <div key={d.name}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-t1 font-medium">{d.name}</span>
                    <span className="text-t2">{d.count} ({headcount > 0 ? Math.round(d.count / headcount * 100) : 0}%)</span>
                  </div>
                  <Progress value={headcount > 0 ? (d.count / headcount * 100) : 0} />
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <h3 className="text-sm font-semibold text-t1 mb-4">{t('headcountByCountry')}</h3>
            <div className="space-y-3">
              {countryCounts.map(([country, count]) => (
                <div key={country}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-t1 font-medium">{country}</span>
                    <span className="text-t2">{count} ({headcount > 0 ? Math.round((count as number) / headcount * 100) : 0}%)</span>
                  </div>
                  <Progress value={headcount > 0 ? ((count as number) / headcount * 100) : 0} />
                </div>
              ))}
            </div>
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
            <div className="space-y-3">
              {['owner', 'admin', 'manager', 'employee'].map(role => {
                const count = employees.filter(e => e.role === role).length
                return (
                  <div key={role}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-t1 font-medium capitalize">{role}</span>
                      <span className="text-t2">{count}</span>
                    </div>
                    <Progress value={headcount > 0 ? (count / headcount * 100) : 0} />
                  </div>
                )
              })}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'performance' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <h3 className="text-sm font-semibold text-t1 mb-4">{t('goalStatusDistribution')}</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-success font-medium">{t('onTrack')}</span>
                  <span className="text-t2">{goalsByStatus.on_track}</span>
                </div>
                <Progress value={goals.length > 0 ? (goalsByStatus.on_track / goals.length * 100) : 0} color="success" />
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-warning font-medium">{t('atRisk')}</span>
                  <span className="text-t2">{goalsByStatus.at_risk}</span>
                </div>
                <Progress value={goals.length > 0 ? (goalsByStatus.at_risk / goals.length * 100) : 0} color="warning" />
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-error font-medium">{t('behindLabel')}</span>
                  <span className="text-t2">{goalsByStatus.behind}</span>
                </div>
                <Progress value={goals.length > 0 ? (goalsByStatus.behind / goals.length * 100) : 0} color="error" />
              </div>
            </div>
          </Card>
          <Card>
            <h3 className="text-sm font-semibold text-t1 mb-4">{t('avgGoalProgress')}</h3>
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="tempo-stat text-5xl text-tempo-600">{avgProgress}%</div>
                <p className="text-xs text-t3 mt-2">{t('acrossGoals', { count: goals.length })}</p>
              </div>
            </div>
          </Card>
          <Card className="md:col-span-2">
            <h3 className="text-sm font-semibold text-t1 mb-4">{t('reviewRatingsDistribution')}</h3>
            <div className="flex items-end gap-4 h-40 justify-center">
              {[1, 2, 3, 4, 5].map(rating => {
                const count = reviews.filter(r => r.overall_rating === rating).length
                const maxCount = Math.max(...[1, 2, 3, 4, 5].map(r => reviews.filter(rv => rv.overall_rating === r).length), 1)
                return (
                  <div key={rating} className="flex flex-col items-center gap-2">
                    <div className="bg-tempo-600 rounded-t w-12" style={{ height: `${(count / maxCount) * 120}px`, minHeight: count > 0 ? '8px' : '0' }} />
                    <span className="text-xs text-t3">{rating}</span>
                    <span className="text-xs font-medium text-t1">{count}</span>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'engagement' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <h3 className="text-sm font-semibold text-t1 mb-4">{t('engagementByDept')}</h3>
            <div className="space-y-3">
              {engagementScores.map(score => (
                <div key={score.id}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-t1 font-medium">{getDepartmentName(score.department_id)}</span>
                    <span className="text-t2">{score.overall_score}/100</span>
                  </div>
                  <Progress value={score.overall_score} color={score.overall_score >= 75 ? 'success' : score.overall_score >= 60 ? 'warning' : 'error'} />
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <h3 className="text-sm font-semibold text-t1 mb-4">{t('enpsByDept')}</h3>
            <div className="space-y-3">
              {engagementScores.map(score => (
                <div key={score.id} className="flex items-center justify-between bg-canvas rounded-lg px-4 py-3">
                  <span className="text-xs text-t1 font-medium">{getDepartmentName(score.department_id)}</span>
                  <div className="flex items-center gap-2">
                    <span className={`tempo-stat text-lg ${score.enps_score >= 40 ? 'text-success' : score.enps_score >= 20 ? 'text-warning' : 'text-error'}`}>
                      {score.enps_score > 0 ? '+' : ''}{score.enps_score}
                    </span>
                    <Badge variant={score.enps_score >= 40 ? 'success' : score.enps_score >= 20 ? 'warning' : 'error'}>
                      {t('responseLabel', { rate: score.response_rate })}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
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
              {employees.map(emp => {
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

        const salaries = employees.map(e => getSalary(e))
        const avgSalary = salaries.length > 0 ? Math.round(salaries.reduce((a, s) => a + s, 0) / salaries.length) : 0
        const medianSalary = (() => {
          const sorted = [...salaries].sort((a, b) => a - b)
          const mid = Math.floor(sorted.length / 2)
          return sorted.length > 0 ? (sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2) : 0
        })()
        const totalComp = salaries.reduce((a, s) => a + s, 0)
        const compByDept = departments.map(d => {
          const deptEmps = employees.filter(e => e.department_id === d.id)
          const deptSalaries = deptEmps.map(e => getSalary(e))
          const avg = deptSalaries.length > 0 ? Math.round(deptSalaries.reduce((a, s) => a + s, 0) / deptSalaries.length) : 0
          return { name: d.name, avg, count: deptEmps.length }
        }).sort((a, b) => b.avg - a.avg)
        const compByLevel = ['Executive', 'Director', 'Senior Manager', 'Senior', 'Manager', 'Mid', 'Junior', 'Associate'].map(level => {
          const levelEmps = employees.filter(e => e.level === level)
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
              <div className="space-y-3">
                {compByDept.map(d => (
                  <div key={d.name}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-t1 font-medium">{d.name}</span>
                      <span className="text-t2">${(d.avg / 1000).toFixed(0)}K · {d.count} emp</span>
                    </div>
                    <Progress value={maxAvg > 0 ? (d.avg / maxAvg) * 100 : 0} />
                  </div>
                ))}
              </div>
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
          { name: 'LinkedIn', apps: Math.round(totalApps * 0.35), hires: 2, color: 'bg-blue-500' },
          { name: 'Referrals', apps: Math.round(totalApps * 0.25), hires: 3, color: 'bg-green-500' },
          { name: 'Career Site', apps: Math.round(totalApps * 0.2), hires: 1, color: 'bg-purple-500' },
          { name: 'Indeed', apps: Math.round(totalApps * 0.12), hires: 1, color: 'bg-amber-500' },
          { name: 'Other', apps: Math.round(totalApps * 0.08), hires: 0, color: 'bg-gray-400' },
        ]
        const maxApps = Math.max(...sources.map(s => s.apps), 1)

        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="md:col-span-2">
              <h3 className="text-sm font-semibold text-t1 mb-4">Pipeline Funnel</h3>
              <div className="flex items-end gap-1 justify-center h-40">
                {pipeline.filter(p => p.stage !== 'rejected').map((p, i) => {
                  const maxCount = pipeline[0].count || 1
                  return (
                    <div key={p.stage} className="flex flex-col items-center gap-1 flex-1">
                      <span className="text-xs font-bold text-t1">{p.count}</span>
                      <div className="w-full bg-tempo-500 rounded-t" style={{ height: `${(p.count / maxCount) * 120}px`, opacity: 1 - i * 0.12 }} />
                      <span className="text-[0.6rem] text-t3 capitalize">{p.stage}</span>
                    </div>
                  )
                })}
              </div>
            </Card>
            <Card>
              <h3 className="text-sm font-semibold text-t1 mb-4">Source Effectiveness</h3>
              <div className="space-y-3">
                {sources.map(s => (
                  <div key={s.name}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-t1 font-medium">{s.name}</span>
                      <span className="text-t2">{s.apps} apps · {s.hires} hires</span>
                    </div>
                    <div className="w-full h-2 bg-canvas rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${s.color}`} style={{ width: `${(s.apps / maxApps) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
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
              <div className="space-y-3">
                {[
                  { label: 'Employee Engagement', score: 74, max: 100 },
                  { label: 'Performance Management', score: reviewCompletion, max: 100 },
                  { label: 'Learning & Development', score: Math.round((activeLearners / Math.max(headcount, 1)) * 100), max: 100 },
                  { label: 'Diversity & Inclusion', score: 68, max: 100 },
                  { label: 'Retention', score: 92, max: 100 },
                ].map(item => (
                  <div key={item.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-t1 font-medium">{item.label}</span>
                      <span className="text-t2">{item.score}%</span>
                    </div>
                    <Progress value={item.score} color={item.score >= 75 ? 'success' : item.score >= 50 ? 'warning' : 'error'} />
                  </div>
                ))}
              </div>
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
                    <AlertTriangle size={14} className={item.type === 'risk' ? (item.severity === 'high' ? 'text-error' : 'text-warning') : 'text-blue-500'} />
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
