'use client'

import { useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { useTempo } from '@/lib/store'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { StatCard } from '@/components/ui/stat-card'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import {
  Users, Target, CalendarCheck, TrendingUp,
  ChevronRight, CheckCircle2, AlertTriangle, Clock,
  Star, Briefcase
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils/cn'

export function MyTeamTab() {
  const {
    currentUser,
    currentEmployeeId,
    employees,
    departments,
    goals,
    reviews,
    leaveRequests,
    enrollments,
    getEmployeeName,
    updateLeaveRequest,
  } = useTempo()

  const router = useRouter()
  const t = useTranslations('dashboard')
  const tc = useTranslations('common')

  // Team members = same department as current user
  const teamMembers = useMemo(() => {
    if (!currentUser?.department_id) return []
    return employees.filter(
      emp => emp.department_id === currentUser.department_id && emp.id !== currentEmployeeId
    )
  }, [employees, currentUser, currentEmployeeId])

  const teamMemberIds = useMemo(
    () => new Set(teamMembers.map(m => m.id)),
    [teamMembers]
  )

  const currentDepartment = useMemo(
    () => departments.find(d => d.id === currentUser?.department_id),
    [departments, currentUser]
  )

  // Team stats
  const teamPendingLeave = useMemo(
    () => leaveRequests.filter(l => teamMemberIds.has(l.employee_id) && l.status === 'pending'),
    [leaveRequests, teamMemberIds]
  )

  const teamGoals = useMemo(
    () => goals.filter(g => teamMemberIds.has(g.employee_id)),
    [goals, teamMemberIds]
  )

  const teamGoalsAtRisk = teamGoals.filter(g => g.status === 'at_risk' || g.status === 'behind')

  const teamReviews = useMemo(
    () => reviews.filter(r => teamMemberIds.has(r.employee_id)),
    [reviews, teamMemberIds]
  )

  const teamReviewCompletion = teamReviews.length > 0
    ? Math.round((teamReviews.filter(r => r.status === 'submitted').length / teamReviews.length) * 100)
    : 0

  const teamEnrollments = useMemo(
    () => enrollments.filter(e => teamMemberIds.has(e.employee_id)),
    [enrollments, teamMemberIds]
  )

  // Per-member status for direct reports list
  const memberDetails = useMemo(() => {
    return teamMembers.map(member => {
      const memberGoals = goals.filter(g => g.employee_id === member.id)
      const memberReviews = reviews.filter(r => r.employee_id === member.id)
      const memberLeave = leaveRequests.filter(l => l.employee_id === member.id && l.status === 'pending')
      const atRiskGoals = memberGoals.filter(g => g.status === 'at_risk' || g.status === 'behind').length
      const activeGoals = memberGoals.filter(g => g.status === 'on_track' || g.status === 'at_risk' || g.status === 'behind').length
      const avgProgress = memberGoals.length > 0
        ? Math.round(memberGoals.reduce((sum, g) => sum + g.progress, 0) / memberGoals.length)
        : 0

      return {
        ...member,
        activeGoals,
        atRiskGoals,
        avgProgress,
        pendingLeave: memberLeave.length,
        pendingReviews: memberReviews.filter(r => r.status === 'pending' || r.status === 'in_progress').length,
      }
    })
  }, [teamMembers, goals, reviews, leaveRequests])

  return (
    <div className="space-y-6">
      {/* Team Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Team Size"
          value={teamMembers.length}
          change={currentDepartment?.name || 'Department'}
          changeType="neutral"
          icon={<Users size={20} />}
          href="/people"
        />
        <StatCard
          label="Pending Leave"
          value={teamPendingLeave.length}
          change={teamPendingLeave.length > 0 ? 'Needs approval' : 'No pending requests'}
          changeType={teamPendingLeave.length > 0 ? 'negative' : 'positive'}
          icon={<CalendarCheck size={20} />}
          href="/time-attendance"
        />
        <StatCard
          label="Goals at Risk"
          value={teamGoalsAtRisk.length}
          change={`${teamGoals.length} total team goals`}
          changeType={teamGoalsAtRisk.length > 0 ? 'negative' : 'positive'}
          icon={<Target size={20} />}
          href="/performance"
        />
        <StatCard
          label="Review Completion"
          value={`${teamReviewCompletion}%`}
          change={`${teamReviews.filter(r => r.status === 'submitted').length}/${teamReviews.length} submitted`}
          changeType={teamReviewCompletion >= 80 ? 'positive' : teamReviewCompletion >= 50 ? 'neutral' : 'negative'}
          icon={<TrendingUp size={20} />}
          href="/performance"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Direct Reports */}
        <Card padding="none" className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Direct Reports</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => router.push('/people')}>{tc('viewAll')}</Button>
            </div>
          </CardHeader>
          <div className="divide-y divide-divider">
            {memberDetails.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <Users size={24} className="mx-auto text-t3 mb-2" />
                <p className="text-sm text-t3">No team members found</p>
              </div>
            ) : (
              memberDetails.map(member => (
                <div
                  key={member.id}
                  onClick={() => router.push('/people')}
                  role="link"
                  className="px-6 py-4 flex items-center gap-4 hover:bg-canvas/50 transition-colors cursor-pointer"
                >
                  <Avatar name={member.profile?.full_name || member.id} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-t1">{member.profile?.full_name}</p>
                    <p className="text-xs text-t3">{member.job_title || 'Team Member'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {member.pendingLeave > 0 && (
                      <Badge variant="warning">{member.pendingLeave} leave</Badge>
                    )}
                    {member.atRiskGoals > 0 && (
                      <Badge variant="error">{member.atRiskGoals} at risk</Badge>
                    )}
                    {member.pendingReviews > 0 && (
                      <Badge variant="info">{member.pendingReviews} review{member.pendingReviews > 1 ? 's' : ''}</Badge>
                    )}
                    {member.pendingLeave === 0 && member.atRiskGoals === 0 && member.pendingReviews === 0 && (
                      <Badge variant="success">On track</Badge>
                    )}
                  </div>
                  <ChevronRight size={14} className="text-t3 flex-shrink-0" />
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Team Leave Requests */}
        <Card padding="none">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Team Leave Requests</CardTitle>
              <Badge variant="warning">{teamPendingLeave.length}</Badge>
            </div>
          </CardHeader>
          <div className="divide-y divide-divider">
            {teamPendingLeave.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <CalendarCheck size={24} className="mx-auto text-t3 mb-2" />
                <p className="text-sm text-t3">No pending leave requests</p>
              </div>
            ) : (
              teamPendingLeave.map(lr => (
                <div key={lr.id} className="px-6 py-3">
                  <div className="flex items-center gap-3 mb-2">
                    <Avatar name={getEmployeeName(lr.employee_id)} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-t1">{getEmployeeName(lr.employee_id)}</p>
                      <p className="text-[0.65rem] text-t3">{lr.type} - {lr.days} days ({lr.start_date})</p>
                    </div>
                  </div>
                  <div className="flex gap-1 ml-11">
                    <Button variant="primary" size="sm" onClick={() => updateLeaveRequest(lr.id, { status: 'approved', approved_by: currentEmployeeId })}>{tc('approve')}</Button>
                    <Button variant="ghost" size="sm" onClick={() => updateLeaveRequest(lr.id, { status: 'rejected' })}>{tc('deny')}</Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Team Goals */}
      <Card padding="none">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Team Goals Progress</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => router.push('/performance')}>{tc('viewAll')}</Button>
          </div>
        </CardHeader>
        <div className="divide-y divide-divider">
          {teamGoals.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <Target size={24} className="mx-auto text-t3 mb-2" />
              <p className="text-sm text-t3">No team goals found</p>
            </div>
          ) : (
            teamGoals.slice(0, 8).map(goal => (
              <div
                key={goal.id}
                onClick={() => router.push('/performance')}
                role="link"
                className="px-6 py-3 flex items-center gap-4 hover:bg-canvas/50 transition-colors cursor-pointer"
              >
                <Avatar name={getEmployeeName(goal.employee_id)} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-t1 truncate">{goal.title}</p>
                  <p className="text-[0.65rem] text-t3">{getEmployeeName(goal.employee_id)}</p>
                </div>
                <div className="w-32">
                  <Progress value={goal.progress} showLabel />
                </div>
                <Badge variant={
                  goal.status === 'on_track' ? 'success' :
                  goal.status === 'at_risk' ? 'warning' :
                  goal.status === 'behind' ? 'error' :
                  goal.status === 'completed' ? 'success' : 'default'
                }>
                  {goal.status.replace(/_/g, ' ')}
                </Badge>
                <ChevronRight size={14} className="text-t3 flex-shrink-0" />
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Team Learning & Development */}
      <Card padding="none">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Team Learning</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => router.push('/learning')}>{tc('viewAll')}</Button>
          </div>
        </CardHeader>
        <div className="divide-y divide-divider">
          {teamEnrollments.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <Star size={24} className="mx-auto text-t3 mb-2" />
              <p className="text-sm text-t3">No team enrollments</p>
            </div>
          ) : (
            <>
              <div className="px-6 py-3 bg-canvas/50">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-lg font-semibold text-t1">{teamEnrollments.filter(e => e.status === 'in_progress' || e.status === 'enrolled').length}</p>
                    <p className="text-xs text-t3">In Progress</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-t1">{teamEnrollments.filter(e => e.status === 'completed').length}</p>
                    <p className="text-xs text-t3">Completed</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-t1">
                      {teamEnrollments.length > 0
                        ? Math.round(teamEnrollments.reduce((sum, e) => sum + e.progress, 0) / teamEnrollments.length)
                        : 0}%
                    </p>
                    <p className="text-xs text-t3">Avg Progress</p>
                  </div>
                </div>
              </div>
              {teamEnrollments
                .filter(e => e.status === 'in_progress' || e.status === 'enrolled')
                .slice(0, 5)
                .map(enrollment => (
                  <div key={enrollment.id} className="px-6 py-3 flex items-center gap-3">
                    <Avatar name={getEmployeeName(enrollment.employee_id)} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-t1 truncate">{getEmployeeName(enrollment.employee_id)}</p>
                      <div className="w-full mt-1">
                        <Progress value={enrollment.progress} showLabel size="sm" />
                      </div>
                    </div>
                  </div>
                ))}
            </>
          )}
        </div>
      </Card>
    </div>
  )
}
