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
import {
  Users, TrendingUp, Banknote, GraduationCap, Briefcase,
  Receipt, UserCheck, ArrowDownRight, Clock
} from 'lucide-react'
import { useTempo } from '@/lib/store'
import { AIInsightCard, AIRecommendationList, AIAlertBanner, AIEnhancingIndicator } from '@/components/ai'
import { generateExecutiveSummary, identifyNextBestActions, detectCrossModuleAnomalies } from '@/lib/ai-engine'
import Link from 'next/link'

export default function DashboardPage() {
  const {
    employees, goals, feedback, leaveRequests, jobPostings,
    enrollments, mentoringPairs, expenseReports, payrollRuns,
    reviews, auditLog, getEmployeeName,
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
      />

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label={t('headcount')} value={headcount} change={`${activeGoals} ${t('activeGoals').toLowerCase()}`} changeType="neutral" icon={<Users size={24} />} />
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
