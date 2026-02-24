'use client'

import { useMemo } from 'react'
import { useAI } from '@/lib/use-ai'
import { useTranslations } from 'next-intl'
import { Header } from '@/components/layout/header'
import { StatCard } from '@/components/ui/stat-card'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { MiniBarChart, MiniDonutChart, Sparkline } from '@/components/ui/mini-chart'
import {
  Users, TrendingUp, Banknote, GraduationCap, Briefcase,
  Receipt, UserCheck, Clock, ArrowRight, CheckCircle2,
  AlertTriangle, FileText, CalendarCheck, ChevronRight
} from 'lucide-react'
import { useTempo } from '@/lib/store'
import { AIInsightCard, AIRecommendationList, AIAlertBanner, AIEnhancingIndicator } from '@/components/ai'
import { generateExecutiveSummary, identifyNextBestActions, detectCrossModuleAnomalies } from '@/lib/ai-engine'
import Link from 'next/link'

export default function DashboardPage() {
  const {
    employees, goals, feedback, leaveRequests, jobPostings,
    enrollments, mentoringPairs, expenseReports, payrollRuns,
    reviews, auditLog, getEmployeeName, departments,
    updateLeaveRequest, reviewCycles, salaryReviews, surveys,
    engagementScores, applications, currentUser, currentEmployeeId,
  } = useTempo()

  const t = useTranslations('dashboard')
  const tc = useTranslations('common')

  const firstName = currentUser?.full_name?.split(' ')[0] || 'Amara'

  // Live KPIs
  const headcount = employees.length
  const activeGoals = goals.filter(g => g.status === 'on_track' || g.status === 'at_risk').length
  const ratedReviews = reviews.filter(r => r.overall_rating)
  const reviewCompletion = reviews.length > 0 ? Math.round((reviews.filter(r => r.status === 'submitted').length / reviews.length) * 100) : 0
  const activeLearners = new Set(enrollments.filter(e => e.status === 'in_progress' || e.status === 'enrolled').map(e => e.employee_id)).size
  const openPositions = jobPostings.filter(j => j.status === 'open').length
  const pendingExpenses = expenseReports.filter(e => e.status === 'submitted' || e.status === 'pending_approval').length
  const activeMentoringPairs = mentoringPairs.filter(p => p.status === 'active').length
  const pendingLeave = leaveRequests.filter(l => l.status === 'pending')
  const lastPayroll = payrollRuns[payrollRuns.length - 1]

  // Action items (Rippling-style "needs your attention")
  const actionItems = useMemo(() => {
    const items: { id: string; type: string; title: string; subtitle: string; href: string; icon: React.ReactNode; urgency: 'critical' | 'warning' | 'info' }[] = []

    if (pendingLeave.length > 0) {
      items.push({
        id: 'leave',
        type: 'Leave',
        title: `${pendingLeave.length} leave request${pendingLeave.length > 1 ? 's' : ''} pending approval`,
        subtitle: pendingLeave.map(l => getEmployeeName(l.employee_id)).slice(0, 2).join(', ') + (pendingLeave.length > 2 ? ` +${pendingLeave.length - 2} more` : ''),
        href: '/time-attendance',
        icon: <CalendarCheck size={16} />,
        urgency: 'warning',
      })
    }

    if (pendingExpenses > 0) {
      items.push({
        id: 'expenses',
        type: 'Expense',
        title: `${pendingExpenses} expense report${pendingExpenses > 1 ? 's' : ''} awaiting review`,
        subtitle: `$${expenseReports.filter(e => e.status === 'submitted' || e.status === 'pending_approval').reduce((a, e) => a + e.total_amount, 0).toLocaleString()} total`,
        href: '/expense',
        icon: <Receipt size={16} />,
        urgency: 'warning',
      })
    }

    const incompleteReviews = reviews.filter(r => r.status === 'in_progress' || r.status === 'draft')
    if (incompleteReviews.length > 0) {
      items.push({
        id: 'reviews',
        type: 'Performance',
        title: `${incompleteReviews.length} performance review${incompleteReviews.length > 1 ? 's' : ''} in progress`,
        subtitle: 'Ensure timely completion of the review cycle',
        href: '/performance',
        icon: <FileText size={16} />,
        urgency: 'info',
      })
    }

    const atRiskGoals = goals.filter(g => g.status === 'at_risk' || g.status === 'behind')
    if (atRiskGoals.length > 0) {
      items.push({
        id: 'goals',
        type: 'Goals',
        title: `${atRiskGoals.length} goal${atRiskGoals.length > 1 ? 's' : ''} at risk or behind`,
        subtitle: 'Review progress and provide support',
        href: '/performance',
        icon: <AlertTriangle size={16} />,
        urgency: atRiskGoals.some(g => g.status === 'behind') ? 'critical' : 'warning',
      })
    }

    return items
  }, [pendingLeave, pendingExpenses, reviews, goals, expenseReports, getEmployeeName])

  // Department distribution for donut chart
  const deptDistribution = useMemo(() => {
    const colors = ['#ea580c', '#2563eb', '#16a34a', '#d97706', '#7c3aed', '#ec4899', '#0891b2', '#64748b']
    const counts: Record<string, number> = {}
    employees.forEach(emp => {
      const deptId = emp.department_id
      const dept = departments.find(d => d.id === deptId)
      const name = dept?.name || 'Other'
      counts[name] = (counts[name] || 0) + 1
    })
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([label, value], i) => ({ label, value, color: colors[i % colors.length] }))
  }, [employees, departments])

  // Headcount sparkline data (simulated monthly trend)
  const headcountTrend = useMemo(() => {
    const base = Math.max(0, headcount - 12)
    return Array.from({ length: 6 }, (_, i) => base + Math.floor(Math.random() * 4) + i * 2)
  }, [headcount])

  // AI-powered insights
  const execSummary = useMemo(() => generateExecutiveSummary({ employees, goals, reviews, reviewCycles, salaryReviews, surveys, engagementScores, expenseReports, leaveRequests, jobPostings, applications, payrollRuns, mentoringPairs }), [employees, goals, reviews, payrollRuns])
  const nextActions = useMemo(() => identifyNextBestActions({ reviews, leaveRequests, expenseReports, salaryReviews, goals, jobPostings, applications }), [reviews, leaveRequests, expenseReports])
  const aiAnomalies = useMemo(() => detectCrossModuleAnomalies({ employees, reviews, engagementScores, salaryReviews, goals, mentoringPairs, leaveRequests }), [employees, reviews, goals])

  // Claude AI enhancement - executive summary
  const { result: enhancedSummary, isLoading: summaryLoading } = useAI({
    action: 'enhanceNarrative',
    data: { summary: execSummary, employees: employees.length, goals: goals.length, reviews: reviews.length },
    fallback: execSummary,
    enabled: !!execSummary.summary,
    cacheKey: `dashboard-summary-${employees.length}-${goals.length}`,
  })

  return (
    <>
      <Header
        title={t('title')}
        subtitle={t('welcomeBack', { name: firstName })}
        hideBreadcrumb
      />

      {/* Action Required Section - Rippling-style "Needs Your Attention" */}
      {actionItems.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <h2 className="text-xs font-semibold text-t1 uppercase tracking-wider">Needs Your Attention</h2>
            <Badge variant="warning">{actionItems.length}</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {actionItems.map((item) => (
              <Link key={item.id} href={item.href}>
                <div className={cn(
                  'group flex items-center gap-4 bg-card border rounded-[var(--radius-card)] px-5 py-4 hover:shadow-sm transition-all cursor-pointer',
                  item.urgency === 'critical' ? 'border-red-200 bg-red-50/30' :
                  item.urgency === 'warning' ? 'border-amber-200 bg-amber-50/30' :
                  'border-border'
                )}>
                  <div className={cn(
                    'flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center',
                    item.urgency === 'critical' ? 'bg-red-100 text-red-600' :
                    item.urgency === 'warning' ? 'bg-amber-100 text-amber-600' :
                    'bg-blue-100 text-blue-600'
                  )}>
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-t1">{item.title}</p>
                    <p className="text-xs text-t3 mt-0.5 truncate">{item.subtitle}</p>
                  </div>
                  <ChevronRight size={16} className="text-t3 group-hover:text-t1 transition-colors flex-shrink-0" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* KPI Grid with Sparklines */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
        <Card className="relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <p className="tempo-th text-t3 mb-1">{t('headcount')}</p>
              <div className="flex items-baseline gap-2">
                <p className="tempo-stat text-2xl text-t1">{headcount}</p>
                <Sparkline data={headcountTrend} height={20} width={60} />
              </div>
              <p className="text-xs mt-1 font-medium text-t3">{activeGoals} {t('activeGoals').toLowerCase()}</p>
            </div>
            <div className="text-tempo-400 opacity-50"><Users size={24} /></div>
          </div>
        </Card>
        <StatCard label={t('reviewCompletion')} value={`${reviewCompletion}%`} change={`${ratedReviews.length} ${t('rated')}`} changeType="positive" icon={<TrendingUp size={24} />} />
        <StatCard label={t('activeLearners')} value={activeLearners} change={`${enrollments.length} ${t('enrollments')}`} changeType="neutral" icon={<GraduationCap size={24} />} />
        <StatCard label={t('openPositions')} value={openPositions} change={`${jobPostings.filter(j => j.status === 'open').reduce((a, j) => a + (j.application_count || 0), 0)} ${t('totalApplicants')}`} changeType="neutral" icon={<Briefcase size={24} />} />
        <StatCard label={t('pendingExpenses')} value={pendingExpenses} change={`$${expenseReports.filter(e => e.status === 'submitted' || e.status === 'pending_approval').reduce((a, e) => a + e.total_amount, 0).toLocaleString()}`} changeType="neutral" icon={<Receipt size={24} />} />
        <StatCard label={t('mentoringPairs')} value={activeMentoringPairs} change={`${mentoringPairs.length} ${t('total')}`} changeType="positive" icon={<UserCheck size={24} />} />
        <StatCard label={t('pendingLeave')} value={pendingLeave.length} change={t('awaitingApproval')} changeType={pendingLeave.length > 0 ? 'negative' : 'neutral'} icon={<Clock size={24} />} />
        <StatCard label={t('lastPayroll')} value={lastPayroll ? `$${(lastPayroll.total_net / 1000).toFixed(0)}K` : '-'} change={lastPayroll?.period || t('noRuns')} changeType="neutral" icon={<Banknote size={24} />} />
      </div>

      {/* AI Insights Section */}
      {aiAnomalies.length > 0 && (
        <AIAlertBanner insights={aiAnomalies} className="mb-4" />
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="relative">
          {summaryLoading && <AIEnhancingIndicator isLoading />}
          <AIInsightCard insight={{ id: 'ai-exec-summary', category: 'trend', severity: 'info', title: t('executiveSummary'), description: enhancedSummary.summary, confidence: 'high', confidenceScore: 90, suggestedAction: enhancedSummary.bulletPoints[0] || '', module: 'dashboard' }} />
        </div>
        <AIRecommendationList title={t('recommendedActions')} recommendations={nextActions} />
      </div>

      {/* Analytics Row - Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {/* Department Distribution */}
        <Card padding="none">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Department Distribution</CardTitle>
              <Link href="/people"><Button variant="ghost" size="sm">{tc('viewAll')}</Button></Link>
            </div>
          </CardHeader>
          <div className="px-6 py-4 flex items-center gap-6">
            <MiniDonutChart data={deptDistribution} size={90} />
            <div className="flex-1 space-y-1.5">
              {deptDistribution.slice(0, 5).map((d) => (
                <div key={d.label} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                  <span className="text-[0.65rem] text-t2 flex-1 truncate">{d.label}</span>
                  <span className="text-[0.65rem] font-semibold text-t1">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Performance Overview */}
        <Card padding="none">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Performance Overview</CardTitle>
              <Link href="/performance"><Button variant="ghost" size="sm">{tc('viewAll')}</Button></Link>
            </div>
          </CardHeader>
          <div className="px-6 py-4">
            <MiniBarChart
              data={[
                { label: 'On Track', value: goals.filter(g => g.status === 'on_track').length, color: 'bg-green-500' },
                { label: 'At Risk', value: goals.filter(g => g.status === 'at_risk').length, color: 'bg-amber-500' },
                { label: 'Behind', value: goals.filter(g => g.status === 'behind').length, color: 'bg-red-500' },
                { label: 'Complete', value: goals.filter(g => g.status === 'completed').length, color: 'bg-blue-500' },
              ]}
              height={100}
            />
          </div>
        </Card>

        {/* Quick Stats */}
        <Card padding="none">
          <CardHeader><CardTitle>Workforce Snapshot</CardTitle></CardHeader>
          <div className="divide-y divide-divider">
            {[
              { label: 'Active Employees', value: employees.length, total: employees.length, color: 'bg-green-500' },
              { label: 'Enrolled in Learning', value: activeLearners, total: employees.length, color: 'bg-blue-500' },
              { label: 'In Mentoring', value: activeMentoringPairs * 2, total: employees.length, color: 'bg-purple-500' },
              { label: 'Open Applications', value: applications.filter(a => a.status === 'applied' || a.status === 'screening' || a.status === 'interview').length, total: applications.length, color: 'bg-tempo-500' },
            ].map((stat) => (
              <div key={stat.label} className="px-6 py-3 flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-t2">{stat.label}</span>
                    <span className="text-xs font-semibold text-t1">{stat.value}/{stat.total}</span>
                  </div>
                  <div className="w-full h-1.5 bg-canvas rounded-full overflow-hidden">
                    <div className={cn('h-full rounded-full transition-all', stat.color)} style={{ width: `${stat.total > 0 ? (stat.value / stat.total) * 100 : 0}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Goals Progress */}
        <Card padding="none" className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t('goalsTitle')}</CardTitle>
              <Link href="/performance"><Button variant="ghost" size="sm">{tc('viewAll')}</Button></Link>
            </div>
          </CardHeader>
          <div className="divide-y divide-divider">
            {goals.slice(0, 5).map((goal) => (
              <div key={goal.id} className="px-6 py-3 flex items-center gap-4">
                <Avatar name={getEmployeeName(goal.employee_id)} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-t1 truncate">{goal.title}</p>
                  <p className="text-[0.65rem] text-t3">{getEmployeeName(goal.employee_id)}</p>
                </div>
                <div className="w-32">
                  <Progress value={goal.progress} showLabel />
                </div>
                <Badge variant={goal.status === 'on_track' ? 'success' : goal.status === 'at_risk' ? 'warning' : 'error'}>
                  {goal.status.replace(/_/g, ' ')}
                </Badge>
              </div>
            ))}
            {goals.length === 0 && <div className="px-6 py-8 text-center text-xs text-t3">{t('noGoals')}</div>}
          </div>
        </Card>

        {/* Activity Feed */}
        <Card padding="none">
          <CardHeader><CardTitle>{t('recentActivity')}</CardTitle></CardHeader>
          <div className="divide-y divide-divider">
            {auditLog.length > 0 ? auditLog.slice(0, 8).map((entry) => (
              <div key={entry.id} className="px-6 py-3">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-medium text-t1">{entry.user}</span>
                  <Badge variant="default">{entry.action}</Badge>
                </div>
                <p className="text-[0.7rem] text-t2 line-clamp-1">{entry.details}</p>
                <p className="text-[0.6rem] text-t3 mt-0.5">{new Date(entry.timestamp).toLocaleString()}</p>
              </div>
            )) : feedback.slice(0, 5).map((fb) => (
              <div key={fb.id} className="px-6 py-3">
                <div className="flex items-center gap-2 mb-1">
                  <Avatar name={getEmployeeName(fb.from_id)} size="xs" />
                  <span className="text-xs font-medium text-t1">{getEmployeeName(fb.from_id)}</span>
                  <span className="text-[0.65rem] text-t3">
                    {fb.type === 'recognition' ? t('recognized') : fb.type === 'feedback' ? t('gaveFeedback') : t('checkedIn')}
                  </span>
                  <span className="text-xs font-medium text-t1">{getEmployeeName(fb.to_id)}</span>
                </div>
                <p className="text-[0.7rem] text-t2 line-clamp-2 ml-8">{fb.content}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Leave Requests */}
        <Card padding="none">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t('pendingLeaveRequests')}</CardTitle>
              <Badge variant="warning">{pendingLeave.length}</Badge>
            </div>
          </CardHeader>
          <div className="divide-y divide-divider">
            {pendingLeave.map((lr) => (
              <div key={lr.id} className="px-6 py-3 flex items-center gap-3">
                <Avatar name={getEmployeeName(lr.employee_id)} size="sm" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-t1">{getEmployeeName(lr.employee_id)}</p>
                  <p className="text-[0.65rem] text-t3">{lr.type} - {lr.days} days ({lr.start_date})</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="primary" size="sm" onClick={() => updateLeaveRequest(lr.id, { status: 'approved', approved_by: currentEmployeeId })}>{tc('approve')}</Button>
                  <Button variant="ghost" size="sm" onClick={() => updateLeaveRequest(lr.id, { status: 'rejected' })}>{tc('deny')}</Button>
                </div>
              </div>
            ))}
            {pendingLeave.length === 0 && <div className="px-6 py-8 text-center text-xs text-t3">{t('noPending')}</div>}
          </div>
        </Card>

        {/* Open Positions */}
        <Card padding="none" className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t('openPositionsTitle')}</CardTitle>
              <Link href="/recruiting"><Button variant="ghost" size="sm">{tc('viewAll')}</Button></Link>
            </div>
          </CardHeader>
          <div className="divide-y divide-divider">
            {jobPostings.filter(j => j.status === 'open').map((job) => (
              <div key={job.id} className="px-6 py-3 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-tempo-50 flex items-center justify-center text-tempo-600">
                  <Briefcase size={18} />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-t1">{job.title}</p>
                  <p className="text-[0.65rem] text-t3">{job.location}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-t1">{job.application_count} {t('applicants')}</p>
                  <p className="text-[0.65rem] text-t3">{job.type.replace(/_/g, ' ')}</p>
                </div>
                <Badge variant="orange">{tc('open')}</Badge>
              </div>
            ))}
            {jobPostings.filter(j => j.status === 'open').length === 0 && <div className="px-6 py-8 text-center text-xs text-t3">{t('noOpenPositions')}</div>}
          </div>
        </Card>
      </div>
    </>
  )
}

// Helper for cn utility in this file
function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ')
}
