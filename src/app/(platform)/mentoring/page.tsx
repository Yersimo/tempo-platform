'use client'

import { useState } from 'react'
import { Header } from '@/components/layout/header'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/ui/stat-card'
import { Progress } from '@/components/ui/progress'
import { Tabs } from '@/components/ui/tabs'
import { UserCheck, Users, Plus, Sparkles } from 'lucide-react'
import { demoMentoringPrograms, demoMentoringPairs, demoEmployees } from '@/lib/demo-data'

export default function MentoringPage() {
  const [activeTab, setActiveTab] = useState('programs')
  const tabs = [
    { id: 'programs', label: 'Programs', count: demoMentoringPrograms.length },
    { id: 'pairs', label: 'Mentoring Pairs', count: demoMentoringPairs.length },
    { id: 'matching', label: 'AI Matching' },
  ]

  return (
    <>
      <Header title="Mentoring" subtitle="Programs, matching, and session tracking" actions={<Button size="sm"><Plus size={14} /> New Program</Button>} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Active Programs" value={demoMentoringPrograms.filter(p => p.status === 'active').length} icon={<Users size={20} />} />
        <StatCard label="Active Pairs" value={demoMentoringPairs.filter(p => p.status === 'active').length} icon={<UserCheck size={20} />} />
        <StatCard label="Avg Match Score" value={`${Math.round(demoMentoringPairs.reduce((a, p) => a + p.match_score, 0) / demoMentoringPairs.length)}%`} change="AI-powered" changeType="positive" />
        <StatCard label="Sessions This Month" value={12} change="+4 vs last month" changeType="positive" />
      </div>
      <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} className="mb-6" />

      {activeTab === 'programs' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {demoMentoringPrograms.map(program => {
            const pairs = demoMentoringPairs.filter(p => p.program_id === program.id)
            return (
              <Card key={program.id}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-t1">{program.title}</h3>
                    <p className="text-xs text-t3">{program.duration_months} months - Started {program.start_date}</p>
                  </div>
                  <Badge variant={program.status === 'active' ? 'success' : 'default'}>{program.status}</Badge>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="info">{program.type.replace('_', ' ')}</Badge>
                  <span className="text-xs text-t3">{pairs.length} pairs</span>
                </div>
                <div className="space-y-2">
                  {pairs.map(pair => {
                    const mentor = demoEmployees.find(e => e.id === pair.mentor_id)
                    const mentee = demoEmployees.find(e => e.id === pair.mentee_id)
                    return (
                      <div key={pair.id} className="flex items-center gap-2 bg-canvas rounded-lg p-2">
                        <Avatar name={mentor?.profile?.full_name || ''} size="sm" />
                        <span className="text-xs text-t3">&#8594;</span>
                        <Avatar name={mentee?.profile?.full_name || ''} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-t1 truncate">{mentor?.profile?.full_name} & {mentee?.profile?.full_name}</p>
                        </div>
                        <span className="text-xs font-medium text-tempo-600">{pair.match_score}%</span>
                      </div>
                    )
                  })}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {activeTab === 'pairs' && (
        <Card padding="none">
          <CardHeader><CardTitle>All Mentoring Pairs</CardTitle></CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-divider bg-canvas">
                  <th className="tempo-th text-left px-6 py-3">Mentor</th>
                  <th className="tempo-th text-left px-4 py-3">Mentee</th>
                  <th className="tempo-th text-left px-4 py-3">Program</th>
                  <th className="tempo-th text-right px-4 py-3">Match Score</th>
                  <th className="tempo-th text-center px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {demoMentoringPairs.map(pair => {
                  const mentor = demoEmployees.find(e => e.id === pair.mentor_id)
                  const mentee = demoEmployees.find(e => e.id === pair.mentee_id)
                  const program = demoMentoringPrograms.find(p => p.id === pair.program_id)
                  return (
                    <tr key={pair.id} className="hover:bg-canvas/50">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar name={mentor?.profile?.full_name || ''} size="sm" />
                          <div>
                            <p className="text-sm font-medium text-t1">{mentor?.profile?.full_name}</p>
                            <p className="text-xs text-t3">{mentor?.job_title}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar name={mentee?.profile?.full_name || ''} size="sm" />
                          <div>
                            <p className="text-sm font-medium text-t1">{mentee?.profile?.full_name}</p>
                            <p className="text-xs text-t3">{mentee?.job_title}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-t2">{program?.title}</td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm font-semibold text-tempo-600">{pair.match_score}%</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={pair.status === 'active' ? 'success' : 'default'}>{pair.status}</Badge>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === 'matching' && (
        <Card>
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-tempo-50 flex items-center justify-center text-tempo-600 mx-auto mb-4">
              <Sparkles size={28} />
            </div>
            <h3 className="text-sm font-semibold text-t1 mb-2">AI-Powered Mentor Matching</h3>
            <p className="text-xs text-t3 max-w-md mx-auto mb-4">Our AI analyzes skills, goals, experience, and personality traits to create optimal mentor-mentee pairings with high match scores.</p>
            <Button>Run Matching Algorithm</Button>
          </div>
        </Card>
      )}
    </>
  )
}
