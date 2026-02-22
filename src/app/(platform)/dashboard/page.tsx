'use client'

import { Header } from '@/components/layout/header'
import { StatCard } from '@/components/ui/stat-card'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import {
  Users, TrendingUp, Banknote, GraduationCap, Briefcase,
  Receipt, UserCheck, Clock, ArrowUpRight, ArrowDownRight
} from 'lucide-react'
import { demoDashboardMetrics, demoGoals, demoFeedback, demoEmployees, demoLeaveRequests, demoJobPostings } from '@/lib/demo-data'

export default function DashboardPage() {
  const m = demoDashboardMetrics

  return (
    <>
      <Header
        title="Dashboard"
        subtitle="Welcome back, Amara. Here is your organization overview."
      />

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Headcount"
          value={m.headcount.toLocaleString()}
          change="+47 this month"
          changeType="positive"
          icon={<Users size={24} />}
        />
        <StatCard
          label="Review Completion"
          value={`${m.review_completion}%`}
          change="+12% vs last quarter"
          changeType="positive"
          icon={<TrendingUp size={24} />}
        />
        <StatCard
          label="Avg Compa Ratio"
          value={m.avg_compa_ratio.toFixed(2)}
          change="At market"
          changeType="neutral"
          icon={<Banknote size={24} />}
        />
        <StatCard
          label="eNPS Score"
          value={m.enps_score}
          change="+5 vs Q4"
          changeType="positive"
        />
        <StatCard
          label="Active Learners"
          value={m.active_learners.toLocaleString()}
          change="28% of workforce"
          changeType="neutral"
          icon={<GraduationCap size={24} />}
        />
        <StatCard
          label="Open Positions"
          value={m.open_positions}
          change="5 urgent"
          changeType="negative"
          icon={<Briefcase size={24} />}
        />
        <StatCard
          label="Pending Expenses"
          value={m.pending_expenses}
          change="$5,300 total"
          changeType="neutral"
          icon={<Receipt size={24} />}
        />
        <StatCard
          label="Mentoring Pairs"
          value={m.active_mentoring_pairs}
          change="+23 this quarter"
          changeType="positive"
          icon={<UserCheck size={24} />}
        />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Goals Progress */}
        <Card padding="none" className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Active Goals</CardTitle>
              <Button variant="ghost" size="sm">View all</Button>
            </div>
          </CardHeader>
          <div className="divide-y divide-divider">
            {demoGoals.slice(0, 5).map((goal) => {
              const emp = demoEmployees.find(e => e.id === goal.employee_id)
              return (
                <div key={goal.id} className="px-6 py-3 flex items-center gap-4">
                  <Avatar name={emp?.profile?.full_name || ''} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-t1 truncate">{goal.title}</p>
                    <p className="text-[0.65rem] text-t3">{emp?.profile?.full_name}</p>
                  </div>
                  <div className="w-32">
                    <Progress value={goal.progress} showLabel />
                  </div>
                  <Badge variant={goal.status === 'on_track' ? 'success' : goal.status === 'at_risk' ? 'warning' : 'error'}>
                    {goal.status.replace('_', ' ')}
                  </Badge>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Activity Feed */}
        <Card padding="none">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <div className="divide-y divide-divider">
            {demoFeedback.map((fb) => {
              const from = demoEmployees.find(e => e.id === fb.from_id)
              const to = demoEmployees.find(e => e.id === fb.to_id)
              return (
                <div key={fb.id} className="px-6 py-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Avatar name={from?.profile?.full_name || ''} size="xs" />
                    <span className="text-xs font-medium text-t1">{from?.profile?.full_name}</span>
                    <span className="text-[0.65rem] text-t3">
                      {fb.type === 'recognition' ? 'recognized' : fb.type === 'feedback' ? 'gave feedback to' : 'checked in with'}
                    </span>
                    <span className="text-xs font-medium text-t1">{to?.profile?.full_name}</span>
                  </div>
                  <p className="text-[0.7rem] text-t2 line-clamp-2 ml-8">{fb.content}</p>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Leave Requests */}
        <Card padding="none">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Pending Leave Requests</CardTitle>
              <Badge variant="warning">{demoLeaveRequests.filter(l => l.status === 'pending').length}</Badge>
            </div>
          </CardHeader>
          <div className="divide-y divide-divider">
            {demoLeaveRequests.filter(l => l.status === 'pending').map((lr) => {
              const emp = demoEmployees.find(e => e.id === lr.employee_id)
              return (
                <div key={lr.id} className="px-6 py-3 flex items-center gap-3">
                  <Avatar name={emp?.profile?.full_name || ''} size="sm" />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-t1">{emp?.profile?.full_name}</p>
                    <p className="text-[0.65rem] text-t3">{lr.type} - {lr.days} days ({lr.start_date})</p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="primary" size="sm">Approve</Button>
                    <Button variant="ghost" size="sm">Deny</Button>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Open Positions */}
        <Card padding="none" className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Open Positions</CardTitle>
              <Button variant="ghost" size="sm">View all</Button>
            </div>
          </CardHeader>
          <div className="divide-y divide-divider">
            {demoJobPostings.filter(j => j.status === 'open').map((job) => (
              <div key={job.id} className="px-6 py-3 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-tempo-50 flex items-center justify-center text-tempo-600">
                  <Briefcase size={18} />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-t1">{job.title}</p>
                  <p className="text-[0.65rem] text-t3">{job.location}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-t1">{job.application_count} applicants</p>
                  <p className="text-[0.65rem] text-t3">{job.type.replace('_', ' ')}</p>
                </div>
                <Badge variant="orange">Open</Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* Payroll Summary */}
        <Card>
          <div className="tempo-th text-t3 mb-2">Total Staff Cost (Monthly)</div>
          <div className="tempo-stat text-3xl text-t1 mb-1">
            ${(m.total_payroll / 12 / 1000000).toFixed(1)}M
          </div>
          <p className="text-xs text-success flex items-center gap-1">
            <ArrowDownRight size={12} /> 2.1% vs budget
          </p>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-t3">Attrition Rate</span>
              <span className="text-t1 font-medium">{m.attrition_rate}%</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-t3">Active Employees</span>
              <span className="text-t1 font-medium">{m.active_employees.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-t3">New Hires (Month)</span>
              <span className="text-success font-medium">+{m.new_hires_this_month}</span>
            </div>
          </div>
        </Card>
      </div>
    </>
  )
}
