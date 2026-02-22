'use client'

import { useState } from 'react'
import { Header } from '@/components/layout/header'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/ui/stat-card'
import { Progress } from '@/components/ui/progress'
import { Tabs } from '@/components/ui/tabs'
import { HeartPulse, TrendingUp, Plus, BarChart3 } from 'lucide-react'
import { demoSurveys, demoEngagementScores, demoDepartments } from '@/lib/demo-data'

export default function EngagementPage() {
  const [activeTab, setActiveTab] = useState('surveys')
  const tabs = [
    { id: 'surveys', label: 'Surveys', count: demoSurveys.length },
    { id: 'enps', label: 'eNPS Tracking' },
    { id: 'heatmap', label: 'Engagement Heatmap' },
  ]

  const avgScore = Math.round(demoEngagementScores.reduce((a, s) => a + s.overall_score, 0) / demoEngagementScores.length)
  const avgENPS = Math.round(demoEngagementScores.reduce((a, s) => a + s.enps_score, 0) / demoEngagementScores.length)
  const avgResponse = Math.round(demoEngagementScores.reduce((a, s) => a + s.response_rate, 0) / demoEngagementScores.length)

  return (
    <>
      <Header title="Engagement" subtitle="Surveys, eNPS tracking, and action planning" actions={<Button size="sm"><Plus size={14} /> New Survey</Button>} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Engagement Score" value={avgScore} change="Org average" changeType="neutral" icon={<HeartPulse size={20} />} />
        <StatCard label="eNPS" value={`+${avgENPS}`} change="vs +32 last quarter" changeType="positive" icon={<TrendingUp size={20} />} />
        <StatCard label="Response Rate" value={`${avgResponse}%`} change="Above target" changeType="positive" />
        <StatCard label="Active Surveys" value={demoSurveys.filter(s => s.status === 'active').length} icon={<BarChart3 size={20} />} />
      </div>
      <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} className="mb-6" />

      {activeTab === 'surveys' && (
        <Card padding="none">
          <CardHeader><CardTitle>Survey Management</CardTitle></CardHeader>
          <div className="divide-y divide-divider">
            {demoSurveys.map(survey => (
              <div key={survey.id} className="px-6 py-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-tempo-50 flex items-center justify-center text-tempo-600">
                  <HeartPulse size={18} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-t1">{survey.title}</p>
                  <p className="text-xs text-t3">{survey.start_date} to {survey.end_date} {survey.anonymous ? '(Anonymous)' : ''}</p>
                </div>
                <Badge variant={survey.type === 'enps' ? 'info' : survey.type === 'pulse' ? 'orange' : 'default'}>
                  {survey.type.toUpperCase()}
                </Badge>
                <Badge variant={survey.status === 'active' ? 'success' : 'default'}>
                  {survey.status}
                </Badge>
                <Button size="sm" variant="outline">View Results</Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {activeTab === 'enps' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {demoEngagementScores.map(score => {
            const dept = demoDepartments.find(d => d.id === score.department_id)
            return (
              <Card key={score.id}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-t1">{dept?.name}</h3>
                    <p className="text-xs text-t3">{score.country_id} - {score.period}</p>
                  </div>
                  <div className="text-right">
                    <p className="tempo-stat text-2xl text-tempo-600">+{score.enps_score}</p>
                    <p className="text-[0.6rem] text-t3">eNPS</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <p className="text-xs text-t3">Overall Score</p>
                    <Progress value={score.overall_score} showLabel />
                  </div>
                  <div>
                    <p className="text-xs text-t3">Response Rate</p>
                    <Progress value={score.response_rate} showLabel color="success" />
                  </div>
                </div>
                <div className="flex gap-1 flex-wrap">
                  {score.themes.map(theme => (
                    <Badge key={theme} variant="default">{theme}</Badge>
                  ))}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {activeTab === 'heatmap' && (
        <Card>
          <h3 className="text-sm font-semibold text-t1 mb-4">Engagement Heatmap by Department</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-divider">
                  <th className="tempo-th text-left px-4 py-3">Department</th>
                  <th className="tempo-th text-center px-4 py-3">Overall</th>
                  <th className="tempo-th text-center px-4 py-3">eNPS</th>
                  <th className="tempo-th text-center px-4 py-3">Response</th>
                  <th className="tempo-th text-left px-4 py-3">Top Themes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {demoEngagementScores.map(score => {
                  const dept = demoDepartments.find(d => d.id === score.department_id)
                  const color = score.overall_score >= 80 ? 'bg-success/10 text-success' : score.overall_score >= 70 ? 'bg-warning/10 text-warning' : 'bg-error/10 text-error'
                  return (
                    <tr key={score.id}>
                      <td className="px-4 py-3 text-sm font-medium text-t1">{dept?.name}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${color}`}>{score.overall_score}</span>
                      </td>
                      <td className="px-4 py-3 text-center text-sm font-semibold text-t1">+{score.enps_score}</td>
                      <td className="px-4 py-3 text-center text-sm text-t2">{score.response_rate}%</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {score.themes.map(t => <Badge key={t} variant="default">{t}</Badge>)}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </>
  )
}
