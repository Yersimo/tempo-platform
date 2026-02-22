'use client'

import { useState } from 'react'
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

export default function AnalyticsPage() {
  const {
    employees, departments, goals, reviews, enrollments,
    engagementScores, mentoringPairs, expenseReports,
    jobPostings, leaveRequests, payrollRuns,
    getDepartmentName,
  } = useTempo()

  const [activeTab, setActiveTab] = useState('workforce')
  const [deptFilter, setDeptFilter] = useState('all')

  const tabs = [
    { id: 'workforce', label: 'Workforce' },
    { id: 'performance', label: 'Performance' },
    { id: 'engagement', label: 'Engagement' },
    { id: 'flight_risk', label: 'Flight Risk' },
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
      <Header title="Analytics" subtitle="Workforce insights, modeling, and reporting"
        actions={<Button size="sm"><FileText size={14} /> Generate Report</Button>} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Headcount" value={headcount} icon={<Users size={20} />} />
        <StatCard label="Review Completion" value={`${reviewCompletion}%`} icon={<TrendingUp size={20} />} />
        <StatCard label="Staff Cost" value={lastPayroll ? `$${(lastPayroll.total_gross / 1000).toFixed(0)}K/mo` : '-'} icon={<DollarSign size={20} />} />
        <StatCard label="Open Positions" value={openPositions} icon={<BarChart3 size={20} />} />
      </div>

      <div className="flex items-center gap-4 mb-6">
        <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />
        <Select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} options={[{ value: 'all', label: 'All Departments' }, ...departments.map(d => ({ value: d.id, label: d.name }))]} className="w-48" />
      </div>

      {activeTab === 'workforce' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <h3 className="text-sm font-semibold text-t1 mb-4">Headcount by Department</h3>
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
            <h3 className="text-sm font-semibold text-t1 mb-4">Headcount by Country</h3>
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
            <h3 className="text-sm font-semibold text-t1 mb-3">Key Metrics</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-t2">Review Completion</span>
                <span className="text-sm font-semibold text-t1">{reviewCompletion}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-t2">Active Learners</span>
                <span className="text-sm font-semibold text-t1">{activeLearners}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-t2">Mentoring Pairs</span>
                <span className="text-sm font-semibold text-t1">{mentoringPairs.filter(p => p.status === 'active').length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-t2">Pending Leave</span>
                <span className="text-sm font-semibold text-warning">{leaveRequests.filter(l => l.status === 'pending').length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-t2">Pending Expenses</span>
                <span className="text-sm font-semibold text-warning">{pendingExpenses}</span>
              </div>
            </div>
          </Card>
          <Card>
            <h3 className="text-sm font-semibold text-t1 mb-3">Role Distribution</h3>
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
            <h3 className="text-sm font-semibold text-t1 mb-4">Goal Status Distribution</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-success font-medium">On Track</span>
                  <span className="text-t2">{goalsByStatus.on_track}</span>
                </div>
                <Progress value={goals.length > 0 ? (goalsByStatus.on_track / goals.length * 100) : 0} color="success" />
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-warning font-medium">At Risk</span>
                  <span className="text-t2">{goalsByStatus.at_risk}</span>
                </div>
                <Progress value={goals.length > 0 ? (goalsByStatus.at_risk / goals.length * 100) : 0} color="warning" />
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-error font-medium">Behind</span>
                  <span className="text-t2">{goalsByStatus.behind}</span>
                </div>
                <Progress value={goals.length > 0 ? (goalsByStatus.behind / goals.length * 100) : 0} color="error" />
              </div>
            </div>
          </Card>
          <Card>
            <h3 className="text-sm font-semibold text-t1 mb-4">Average Goal Progress</h3>
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="tempo-stat text-5xl text-tempo-600">{avgProgress}%</div>
                <p className="text-xs text-t3 mt-2">across {goals.length} goals</p>
              </div>
            </div>
          </Card>
          <Card className="md:col-span-2">
            <h3 className="text-sm font-semibold text-t1 mb-4">Review Ratings Distribution</h3>
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
            <h3 className="text-sm font-semibold text-t1 mb-4">Engagement by Department</h3>
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
            <h3 className="text-sm font-semibold text-t1 mb-4">eNPS by Department</h3>
            <div className="space-y-3">
              {engagementScores.map(score => (
                <div key={score.id} className="flex items-center justify-between bg-canvas rounded-lg px-4 py-3">
                  <span className="text-xs text-t1 font-medium">{getDepartmentName(score.department_id)}</span>
                  <div className="flex items-center gap-2">
                    <span className={`tempo-stat text-lg ${score.enps_score >= 40 ? 'text-success' : score.enps_score >= 20 ? 'text-warning' : 'text-error'}`}>
                      {score.enps_score > 0 ? '+' : ''}{score.enps_score}
                    </span>
                    <Badge variant={score.enps_score >= 40 ? 'success' : score.enps_score >= 20 ? 'warning' : 'error'}>
                      {score.response_rate}% response
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>
          <Card className="md:col-span-2">
            <h3 className="text-sm font-semibold text-t1 mb-4">Top Engagement Themes</h3>
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
            <h3 className="text-sm font-semibold text-t1 mb-3">High Flight Risk Employees</h3>
            <p className="text-xs text-t3 mb-4">Based on engagement, tenure, compensation, and performance signals</p>
            <div className="space-y-2">
              {employees.slice(13, 16).map((emp, i) => {
                const risk = [85, 62, 58][i]
                return (
                  <div key={emp.id} className="flex items-center gap-3 bg-canvas rounded-lg px-3 py-2">
                    <AlertTriangle size={14} className={risk >= 70 ? 'text-error' : 'text-warning'} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-t1 truncate">{emp.profile?.full_name}</p>
                      <p className="text-[0.6rem] text-t3">{getDepartmentName(emp.department_id)}</p>
                    </div>
                    <Badge variant={risk >= 70 ? 'error' : 'warning'}>{risk}%</Badge>
                  </div>
                )
              })}
            </div>
          </Card>
          <Card>
            <h3 className="text-sm font-semibold text-t1 mb-3">Risk Factors</h3>
            <div className="space-y-3">
              {[
                { factor: 'Below-market compensation', count: 4, severity: 'high' },
                { factor: 'No recent promotion', count: 7, severity: 'medium' },
                { factor: 'Low engagement score', count: 3, severity: 'high' },
                { factor: 'No mentor assigned', count: 12, severity: 'low' },
                { factor: 'Overdue performance review', count: 2, severity: 'medium' },
              ].map(item => (
                <div key={item.factor} className="flex items-center justify-between">
                  <span className="text-xs text-t1">{item.factor}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-t3">{item.count} employees</span>
                    <Badge variant={item.severity === 'high' ? 'error' : item.severity === 'medium' ? 'warning' : 'default'}>{item.severity}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </>
  )
}
