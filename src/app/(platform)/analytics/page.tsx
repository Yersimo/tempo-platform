'use client'

import { Header } from '@/components/layout/header'
import { Card } from '@/components/ui/card'
import { StatCard } from '@/components/ui/stat-card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BarChart3, TrendingUp, Users, DollarSign, AlertTriangle, FileText } from 'lucide-react'
import { demoDashboardMetrics, demoEmployees, demoDepartments, demoEngagementScores } from '@/lib/demo-data'

export default function AnalyticsPage() {
  return (
    <>
      <Header title="Analytics" subtitle="Workforce insights, modeling, and reporting" actions={<Button size="sm"><FileText size={14} /> Generate Report</Button>} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Headcount" value={demoDashboardMetrics.headcount.toLocaleString()} change={`+${demoDashboardMetrics.new_hires_this_month} this month`} changeType="positive" icon={<Users size={20} />} />
        <StatCard label="Attrition Rate" value={`${demoDashboardMetrics.attrition_rate}%`} change="Below 10% target" changeType="positive" icon={<TrendingUp size={20} />} />
        <StatCard label="Staff Cost" value={`$${(demoDashboardMetrics.total_payroll / 1000000).toFixed(1)}M`} change="Annual" changeType="neutral" icon={<DollarSign size={20} />} />
        <StatCard label="Avg Compa Ratio" value={demoDashboardMetrics.avg_compa_ratio} change="At market" changeType="neutral" icon={<BarChart3 size={20} />} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card>
          <h3 className="text-sm font-semibold text-t1 mb-4">Headcount by Department</h3>
          <div className="space-y-3">
            {demoDepartments.map(dept => {
              const count = demoEmployees.filter(e => e.department_id === dept.id).length
              const pct = Math.round(count / demoEmployees.length * 100)
              return (
                <div key={dept.id}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-t1 font-medium">{dept.name}</span>
                    <span className="text-t2">{count} ({pct}%)</span>
                  </div>
                  <Progress value={pct * 2.5} />
                </div>
              )
            })}
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-t1 mb-4">Headcount by Country</h3>
          <div className="space-y-3">
            {[
              { country: 'Nigeria', count: 10, pct: 33 },
              { country: 'Ghana', count: 7, pct: 23 },
              { country: "Cote d'Ivoire", count: 5, pct: 17 },
              { country: 'Kenya', count: 5, pct: 17 },
              { country: 'Senegal', count: 3, pct: 10 },
            ].map(item => (
              <div key={item.country}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-t1 font-medium">{item.country}</span>
                  <span className="text-t2">{item.count} ({item.pct}%)</span>
                </div>
                <Progress value={item.pct * 2.5} />
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <h3 className="text-sm font-semibold text-t1 mb-3">Flight Risk</h3>
          <div className="space-y-2">
            {[
              { name: 'Yaw Frimpong', dept: 'Technology', risk: 'High', score: 85 },
              { name: 'Fatou Ndiaye', dept: 'Corporate Banking', risk: 'Medium', score: 62 },
              { name: 'Brian Otieno', dept: 'Technology', risk: 'Medium', score: 58 },
            ].map(item => (
              <div key={item.name} className="flex items-center gap-3 bg-canvas rounded-lg px-3 py-2">
                <AlertTriangle size={14} className={item.risk === 'High' ? 'text-error' : 'text-warning'} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-t1 truncate">{item.name}</p>
                  <p className="text-[0.6rem] text-t3">{item.dept}</p>
                </div>
                <Badge variant={item.risk === 'High' ? 'error' : 'warning'}>{item.score}%</Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-t1 mb-3">Engagement Trends</h3>
          <div className="space-y-2">
            {demoEngagementScores.map(score => {
              const dept = demoDepartments.find(d => d.id === score.department_id)
              return (
                <div key={score.id} className="flex items-center justify-between">
                  <span className="text-xs text-t1">{dept?.name}</span>
                  <div className="flex items-center gap-2">
                    <Progress value={score.overall_score} className="w-20" />
                    <span className="text-xs font-medium text-t1 w-8 text-right">{score.overall_score}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-t1 mb-3">Key Metrics</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-t2">Review Completion</span>
              <span className="text-sm font-semibold text-t1">{demoDashboardMetrics.review_completion}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-t2">eNPS Score</span>
              <span className="text-sm font-semibold text-success">+{demoDashboardMetrics.enps_score}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-t2">Active Learners</span>
              <span className="text-sm font-semibold text-t1">{demoDashboardMetrics.active_learners.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-t2">Open Positions</span>
              <span className="text-sm font-semibold text-t1">{demoDashboardMetrics.open_positions}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-t2">Mentoring Pairs</span>
              <span className="text-sm font-semibold text-t1">{demoDashboardMetrics.active_mentoring_pairs}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-t2">Pending Expenses</span>
              <span className="text-sm font-semibold text-warning">{demoDashboardMetrics.pending_expenses}</span>
            </div>
          </div>
        </Card>
      </div>
    </>
  )
}
