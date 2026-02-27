'use client'

import { useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { useTempo } from '@/lib/store'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { StatCard } from '@/components/ui/stat-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Calendar, Clock, Target, BookOpen, Heart, DollarSign,
  FileText, ChevronRight, CheckCircle2, AlertCircle,
  Briefcase, Award, TrendingUp, Star
} from 'lucide-react'
import { useRouter } from 'next/navigation'

export function MyOverviewTab() {
  const {
    currentUser,
    currentEmployeeId,
    goals,
    reviews,
    reviewCycles,
    enrollments,
    courses,
    leaveRequests,
    employeePayrollEntries,
    payrollRuns,
    benefitPlans,
    benefitEnrollments,
    getEmployeeName,
  } = useTempo()

  const router = useRouter()
  const t = useTranslations('dashboard')
  const tc = useTranslations('common')

  // ---- Filtered data for current employee ----

  const myGoals = useMemo(
    () => goals.filter(g => g.employee_id === currentEmployeeId),
    [goals, currentEmployeeId]
  )

  const myReviews = useMemo(
    () =>
      reviews.filter(
        r =>
          r.employee_id === currentEmployeeId ||
          r.reviewer_id === currentEmployeeId
      ),
    [reviews, currentEmployeeId]
  )

  const myEnrollments = useMemo(
    () => enrollments.filter(e => e.employee_id === currentEmployeeId),
    [enrollments, currentEmployeeId]
  )

  const myLeaveRequests = useMemo(
    () => leaveRequests.filter(l => l.employee_id === currentEmployeeId),
    [leaveRequests, currentEmployeeId]
  )

  const myPayrollEntries = useMemo(
    () =>
      employeePayrollEntries
        .filter(e => e.employee_id === currentEmployeeId)
        .sort((a, b) => b.pay_date.localeCompare(a.pay_date)),
    [employeePayrollEntries, currentEmployeeId]
  )

  const myBenefitEnrollments = useMemo(
    () => benefitEnrollments.filter(e => e.employee_id === currentEmployeeId),
    [benefitEnrollments, currentEmployeeId]
  )

  // ---- Stat computations ----

  const leaveBalance = useMemo(() => {
    const annualUsed = myLeaveRequests
      .filter(l => l.type === 'annual' && (l.status === 'approved' || l.status === 'pending'))
      .reduce((sum, l) => sum + l.days, 0)
    return { annual: Math.max(0, 20 - annualUsed), sick: 10, personal: 5 }
  }, [myLeaveRequests])

  const activeGoalsCount = myGoals.filter(
    g => g.status === 'on_track' || g.status === 'at_risk' || g.status === 'behind'
  ).length

  const pendingReviewCount = myReviews.filter(
    r => r.status === 'pending' || r.status === 'in_progress' || r.status === 'draft'
  ).length

  const learningProgress = useMemo(() => {
    const active = myEnrollments.filter(
      e => e.status === 'in_progress' || e.status === 'enrolled'
    )
    if (active.length === 0) return 0
    return Math.round(
      active.reduce((sum, e) => sum + e.progress, 0) / active.length
    )
  }, [myEnrollments])

  // ---- Leave balance breakdown ----

  const leaveBreakdown = useMemo(() => {
    const annualUsed = myLeaveRequests
      .filter(l => l.type === 'annual' && l.status === 'approved')
      .reduce((sum, l) => sum + l.days, 0)
    const sickUsed = myLeaveRequests
      .filter(l => l.type === 'sick' && l.status === 'approved')
      .reduce((sum, l) => sum + l.days, 0)
    const personalUsed = myLeaveRequests
      .filter(l => l.type === 'personal' && l.status === 'approved')
      .reduce((sum, l) => sum + l.days, 0)

    return [
      { label: 'Annual', used: annualUsed, total: 20, color: 'orange' as const },
      { label: 'Sick', used: sickUsed, total: 10, color: 'warning' as const },
      { label: 'Personal', used: personalUsed, total: 5, color: 'success' as const },
    ]
  }, [myLeaveRequests])

  // ---- Quick actions ----

  const quickActions = [
    { label: 'Request Leave', icon: <Calendar size={20} />, href: '/time-attendance' },
    { label: 'Submit Expense', icon: <FileText size={20} />, href: '/expense' },
    { label: 'Clock In/Out', icon: <Clock size={20} />, href: '/time-attendance' },
    { label: 'View Pay Stubs', icon: <DollarSign size={20} />, href: '/payroll' },
    { label: 'My Goals', icon: <Target size={20} />, href: '/performance' },
    { label: 'My Learning', icon: <BookOpen size={20} />, href: '/learning' },
  ]

  // ---- Status helpers ----

  function goalStatusVariant(status: string): 'success' | 'warning' | 'error' | 'default' {
    switch (status) {
      case 'on_track': return 'success'
      case 'at_risk': return 'warning'
      case 'behind': return 'error'
      case 'completed': return 'success'
      default: return 'default'
    }
  }

  function goalStatusLabel(status: string): string {
    switch (status) {
      case 'on_track': return 'On Track'
      case 'at_risk': return 'At Risk'
      case 'behind': return 'Behind'
      case 'completed': return 'Completed'
      default: return status
    }
  }

  function reviewStatusVariant(status: string): 'success' | 'warning' | 'error' | 'info' | 'default' {
    switch (status) {
      case 'submitted': return 'success'
      case 'in_progress': return 'warning'
      case 'pending': return 'info'
      case 'draft': return 'default'
      default: return 'default'
    }
  }

  function reviewStatusLabel(status: string): string {
    switch (status) {
      case 'submitted': return 'Submitted'
      case 'in_progress': return 'In Progress'
      case 'pending': return 'Pending'
      case 'draft': return 'Draft'
      default: return status
    }
  }

  function payStatusVariant(status: string): 'success' | 'warning' | 'info' | 'default' {
    switch (status) {
      case 'paid': return 'success'
      case 'approved': return 'info'
      case 'processing': return 'warning'
      default: return 'default'
    }
  }

  function formatCurrency(amount: number): string {
    return `$${amount.toLocaleString()}`
  }

  function getCycleName(cycleId: string): string {
    const cycle = reviewCycles.find(c => c.id === cycleId)
    return cycle?.title || 'Review Cycle'
  }

  function getCourseName(courseId: string): string {
    const course = courses.find(c => c.id === courseId)
    return course?.title || 'Course'
  }

  function getCourseFormat(courseId: string): string {
    const course = courses.find(c => c.id === courseId)
    return course?.format || 'online'
  }

  function getPlanName(planId: string): string {
    const plan = benefitPlans.find(p => p.id === planId)
    return plan?.name || 'Benefit Plan'
  }

  function getPlanType(planId: string): string {
    const plan = benefitPlans.find(p => p.id === planId)
    return plan?.type || 'other'
  }

  function getPayrollPeriod(runId: string): string {
    const run = payrollRuns.find(r => r.id === runId)
    return run?.period || 'Unknown Period'
  }

  function getPayrollStatus(runId: string): string {
    const run = payrollRuns.find(r => r.id === runId)
    return run?.status || 'unknown'
  }

  return (
    <div className="space-y-6">
      {/* ---- Stat Cards ---- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Leave Balance"
          value={`${leaveBalance.annual} days`}
          change="Annual leave remaining"
          changeType="neutral"
          icon={<Calendar size={20} />}
          href="/time-attendance"
        />
        <StatCard
          label="Active Goals"
          value={activeGoalsCount}
          change={myGoals.filter(g => g.status === 'at_risk' || g.status === 'behind').length > 0
            ? `${myGoals.filter(g => g.status === 'at_risk' || g.status === 'behind').length} need attention`
            : 'All on track'}
          changeType={myGoals.some(g => g.status === 'at_risk' || g.status === 'behind') ? 'negative' : 'positive'}
          icon={<Target size={20} />}
          href="/performance"
        />
        <StatCard
          label="Pending Reviews"
          value={pendingReviewCount}
          change={pendingReviewCount > 0 ? 'Action required' : 'All complete'}
          changeType={pendingReviewCount > 0 ? 'negative' : 'positive'}
          icon={<Star size={20} />}
          href="/performance"
        />
        <StatCard
          label="Learning Progress"
          value={`${learningProgress}%`}
          change={`${myEnrollments.filter(e => e.status === 'in_progress' || e.status === 'enrolled').length} active course${myEnrollments.filter(e => e.status === 'in_progress' || e.status === 'enrolled').length !== 1 ? 's' : ''}`}
          changeType="neutral"
          icon={<BookOpen size={20} />}
          href="/learning"
        />
      </div>

      {/* ---- Main Content Grid ---- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ---- Left Column (2/3 width) ---- */}
        <div className="lg:col-span-2 space-y-6">

          {/* Quick Actions */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-t1">My Quick Actions</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {quickActions.map(action => (
                <button
                  key={action.label}
                  onClick={() => router.push(action.href)}
                  className="bg-canvas hover:bg-card border border-border rounded-xl p-4 text-left transition-all hover:shadow-sm group"
                >
                  <div className="text-tempo-600 mb-2">{action.icon}</div>
                  <span className="text-sm font-medium text-t1 group-hover:text-tempo-700 transition-colors">
                    {action.label}
                  </span>
                </button>
              ))}
            </div>
          </Card>

          {/* My Goals */}
          <Card padding="none">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>My Goals</CardTitle>
                <button
                  onClick={() => router.push('/performance')}
                  className="text-xs text-tempo-600 hover:text-tempo-700 font-medium flex items-center gap-1 transition-colors"
                >
                  View all goals <ChevronRight size={14} />
                </button>
              </div>
            </CardHeader>
            <div className="divide-y divide-divider">
              {myGoals.length === 0 ? (
                <div className="px-6 py-8 text-center">
                  <Target size={24} className="mx-auto text-t3 mb-2" />
                  <p className="text-sm text-t3">No goals assigned yet</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2"
                    onClick={() => router.push('/performance')}
                  >
                    Set a goal
                  </Button>
                </div>
              ) : (
                myGoals.slice(0, 5).map(goal => (
                  <div key={goal.id} className="px-6 py-4 hover:bg-canvas/50 transition-colors">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-t1 truncate">{goal.title}</p>
                        <p className="text-xs text-t3 mt-0.5">
                          Due {new Date(goal.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                      <Badge variant={goalStatusVariant(goal.status)}>
                        {goalStatusLabel(goal.status)}
                      </Badge>
                    </div>
                    <Progress value={goal.progress} showLabel />
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* My Upcoming Reviews */}
          <Card padding="none">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>My Upcoming Reviews</CardTitle>
                <button
                  onClick={() => router.push('/performance')}
                  className="text-xs text-tempo-600 hover:text-tempo-700 font-medium flex items-center gap-1 transition-colors"
                >
                  View all reviews <ChevronRight size={14} />
                </button>
              </div>
            </CardHeader>
            <div className="divide-y divide-divider">
              {myReviews.length === 0 ? (
                <div className="px-6 py-8 text-center">
                  <Star size={24} className="mx-auto text-t3 mb-2" />
                  <p className="text-sm text-t3">No reviews scheduled</p>
                </div>
              ) : (
                myReviews.slice(0, 5).map(review => {
                  const isReviewer = review.reviewer_id === currentEmployeeId
                  return (
                    <div key={review.id} className="px-6 py-4 hover:bg-canvas/50 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-t1">
                            {getCycleName(review.cycle_id)}
                          </p>
                          <p className="text-xs text-t3 mt-0.5">
                            {isReviewer
                              ? `Reviewing: ${getEmployeeName(review.employee_id)}`
                              : `Reviewer: ${getEmployeeName(review.reviewer_id)}`}
                          </p>
                          {review.overall_rating && (
                            <div className="flex items-center gap-1 mt-1">
                              {[1, 2, 3, 4, 5].map(star => (
                                <Star
                                  key={star}
                                  size={12}
                                  className={star <= (review.overall_rating ?? 0) ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}
                                />
                              ))}
                              <span className="text-xs text-t3 ml-1">{review.overall_rating}/5</span>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge variant={reviewStatusVariant(review.status)}>
                            {reviewStatusLabel(review.status)}
                          </Badge>
                          {isReviewer && (
                            <span className="text-[0.6rem] text-t3">As reviewer</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </Card>
        </div>

        {/* ---- Right Column (1/3 width) ---- */}
        <div className="space-y-6">

          {/* My Leave Balance */}
          <Card>
            <h3 className="text-sm font-semibold text-t1 mb-4">My Leave Balance</h3>
            <div className="space-y-4">
              {leaveBreakdown.map(item => (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium text-t2">{item.label}</span>
                    <span className="text-xs tabular-nums text-t3">
                      {item.total - item.used}/{item.total} days
                    </span>
                  </div>
                  <Progress
                    value={item.total - item.used}
                    max={item.total}
                    color={item.color}
                    size="md"
                  />
                </div>
              ))}
            </div>
            <Button
              variant="secondary"
              size="sm"
              className="w-full mt-4"
              onClick={() => router.push('/time-attendance')}
            >
              <Calendar size={14} />
              Request Leave
            </Button>
          </Card>

          {/* Recent Pay Stubs */}
          <Card padding="none">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Pay Stubs</CardTitle>
                <button
                  onClick={() => router.push('/payroll')}
                  className="text-xs text-tempo-600 hover:text-tempo-700 font-medium flex items-center gap-1 transition-colors"
                >
                  View all <ChevronRight size={14} />
                </button>
              </div>
            </CardHeader>
            <div className="divide-y divide-divider">
              {myPayrollEntries.length === 0 ? (
                <div className="px-6 py-8 text-center">
                  <DollarSign size={24} className="mx-auto text-t3 mb-2" />
                  <p className="text-sm text-t3">No pay stubs available</p>
                </div>
              ) : (
                myPayrollEntries.slice(0, 3).map(entry => (
                  <div key={entry.id} className="px-6 py-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-t1">
                        {getPayrollPeriod(entry.payroll_run_id)}
                      </span>
                      <Badge variant={payStatusVariant(getPayrollStatus(entry.payroll_run_id))}>
                        {getPayrollStatus(entry.payroll_run_id)}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs text-t3">
                      <span>Gross: {formatCurrency(entry.gross_pay)}</span>
                      <span className="font-medium text-t1">Net: {formatCurrency(entry.net_pay)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* My Benefits */}
          <Card padding="none">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>My Benefits</CardTitle>
                <button
                  onClick={() => router.push('/benefits')}
                  className="text-xs text-tempo-600 hover:text-tempo-700 font-medium flex items-center gap-1 transition-colors"
                >
                  Manage Benefits <ChevronRight size={14} />
                </button>
              </div>
            </CardHeader>
            <div className="divide-y divide-divider">
              {myBenefitEnrollments.length === 0 ? (
                <div className="px-6 py-8 text-center">
                  <Heart size={24} className="mx-auto text-t3 mb-2" />
                  <p className="text-sm text-t3">No benefit plans enrolled</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2"
                    onClick={() => router.push('/benefits')}
                  >
                    Browse plans
                  </Button>
                </div>
              ) : (
                myBenefitEnrollments.map(enrollment => (
                  <div key={enrollment.id} className="px-6 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-t1 truncate">
                          {getPlanName(enrollment.plan_id)}
                        </p>
                        <p className="text-xs text-t3 mt-0.5 capitalize">
                          {enrollment.coverage_level.replace(/_/g, ' ')}
                        </p>
                      </div>
                      <Badge variant="info">{getPlanType(enrollment.plan_id)}</Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* My Learning */}
          <Card padding="none">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>My Learning</CardTitle>
                <button
                  onClick={() => router.push('/learning')}
                  className="text-xs text-tempo-600 hover:text-tempo-700 font-medium flex items-center gap-1 transition-colors"
                >
                  Browse Courses <ChevronRight size={14} />
                </button>
              </div>
            </CardHeader>
            <div className="divide-y divide-divider">
              {myEnrollments.length === 0 ? (
                <div className="px-6 py-8 text-center">
                  <BookOpen size={24} className="mx-auto text-t3 mb-2" />
                  <p className="text-sm text-t3">No courses enrolled</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2"
                    onClick={() => router.push('/learning')}
                  >
                    Explore courses
                  </Button>
                </div>
              ) : (
                myEnrollments
                  .filter(e => e.status !== 'completed')
                  .slice(0, 4)
                  .map(enrollment => (
                    <div key={enrollment.id} className="px-6 py-3">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="text-sm font-medium text-t1 truncate flex-1 min-w-0">
                          {getCourseName(enrollment.course_id)}
                        </p>
                        <Badge variant="default" className="capitalize shrink-0">
                          {getCourseFormat(enrollment.course_id)}
                        </Badge>
                      </div>
                      <Progress value={enrollment.progress} showLabel />
                    </div>
                  ))
              )}
              {myEnrollments.filter(e => e.status === 'completed').length > 0 && (
                <div className="px-6 py-3">
                  <div className="flex items-center gap-2 text-xs text-success">
                    <CheckCircle2 size={14} />
                    <span>
                      {myEnrollments.filter(e => e.status === 'completed').length} course{myEnrollments.filter(e => e.status === 'completed').length !== 1 ? 's' : ''} completed
                    </span>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
