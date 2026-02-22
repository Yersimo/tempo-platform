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
import { Modal } from '@/components/ui/modal'
import { Input, Textarea, Select } from '@/components/ui/input'
import { Plus, Target, Star, MessageSquare, Grid3x3 } from 'lucide-react'
import { demoGoals, demoReviewCycles, demoReviews, demoFeedback, demoEmployees } from '@/lib/demo-data'

export default function PerformancePage() {
  const [activeTab, setActiveTab] = useState('goals')
  const [showGoalModal, setShowGoalModal] = useState(false)

  const tabs = [
    { id: 'goals', label: 'Goals', count: demoGoals.length },
    { id: 'reviews', label: 'Reviews', count: demoReviews.length },
    { id: 'calibration', label: 'Calibration' },
    { id: 'feedback', label: 'Feedback', count: demoFeedback.length },
  ]

  const completedReviews = demoReviews.filter(r => r.status === 'submitted').length
  const avgRating = demoReviews.filter(r => r.overall_rating).reduce((a, r) => a + (r.overall_rating || 0), 0) / demoReviews.filter(r => r.overall_rating).length

  return (
    <>
      <Header
        title="Performance"
        subtitle="Goals, reviews, calibration, and feedback"
        actions={<Button size="sm" onClick={() => setShowGoalModal(true)}><Plus size={14} /> New Goal</Button>}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Active Goals" value={demoGoals.filter(g => g.status === 'on_track' || g.status === 'at_risk').length} icon={<Target size={20} />} />
        <StatCard label="Avg Progress" value={`${Math.round(demoGoals.reduce((a, g) => a + g.progress, 0) / demoGoals.length)}%`} change="On track" changeType="positive" />
        <StatCard label="Reviews Completed" value={`${completedReviews}/${demoReviews.length}`} icon={<Star size={20} />} />
        <StatCard label="Avg Rating" value={avgRating.toFixed(1)} change="Out of 5.0" changeType="neutral" />
      </div>

      <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} className="mb-6" />

      {/* Goals Tab */}
      {activeTab === 'goals' && (
        <Card padding="none">
          <div className="divide-y divide-divider">
            {demoGoals.map((goal) => {
              const emp = demoEmployees.find(e => e.id === goal.employee_id)
              return (
                <div key={goal.id} className="px-6 py-4 hover:bg-canvas/50 transition-colors">
                  <div className="flex items-start gap-4">
                    <Avatar name={emp?.profile?.full_name || ''} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-t1">{goal.title}</p>
                        <Badge variant={goal.category === 'business' ? 'info' : 'orange'}>{goal.category}</Badge>
                      </div>
                      <p className="text-xs text-t3 mb-2">{emp?.profile?.full_name}</p>
                      {goal.description && <p className="text-xs text-t2 mb-2">{goal.description}</p>}
                      <div className="flex items-center gap-4">
                        <div className="flex-1 max-w-xs">
                          <Progress value={goal.progress} showLabel />
                        </div>
                        <span className="text-xs text-t3">Due: {goal.due_date}</span>
                      </div>
                    </div>
                    <Badge variant={goal.progress >= 75 ? 'success' : goal.progress >= 50 ? 'warning' : 'error'}>
                      {goal.progress >= 75 ? 'On track' : goal.progress >= 50 ? 'At risk' : 'Behind'}
                    </Badge>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Reviews Tab */}
      {activeTab === 'reviews' && (
        <div className="space-y-4">
          {/* Review Cycles */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {demoReviewCycles.map(cycle => (
              <Card key={cycle.id}>
                <div className="flex items-center justify-between mb-2">
                  <Badge variant={cycle.status === 'active' ? 'success' : 'orange'}>
                    {cycle.status}
                  </Badge>
                  <span className="text-xs text-t3">{cycle.type}</span>
                </div>
                <h3 className="text-sm font-medium text-t1 mb-1">{cycle.title}</h3>
                <p className="text-xs text-t3">{cycle.start_date} to {cycle.end_date}</p>
              </Card>
            ))}
          </div>

          {/* Reviews List */}
          <Card padding="none">
            <CardHeader>
              <CardTitle>Individual Reviews</CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-divider bg-canvas">
                    <th className="tempo-th text-left px-6 py-3">Employee</th>
                    <th className="tempo-th text-left px-4 py-3">Reviewer</th>
                    <th className="tempo-th text-left px-4 py-3">Type</th>
                    <th className="tempo-th text-center px-4 py-3">Rating</th>
                    <th className="tempo-th text-left px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {demoReviews.map(review => {
                    const emp = demoEmployees.find(e => e.id === review.employee_id)
                    const rev = demoEmployees.find(e => e.id === review.reviewer_id)
                    return (
                      <tr key={review.id} className="hover:bg-canvas/50">
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-2">
                            <Avatar name={emp?.profile?.full_name || ''} size="sm" />
                            <span className="text-sm text-t1">{emp?.profile?.full_name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-t2">{rev?.profile?.full_name}</td>
                        <td className="px-4 py-3"><Badge>{review.type}</Badge></td>
                        <td className="px-4 py-3 text-center">
                          {review.overall_rating ? (
                            <span className="tempo-stat text-lg text-tempo-600">{review.overall_rating}</span>
                          ) : (
                            <span className="text-xs text-t3">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={review.status === 'submitted' ? 'success' : review.status === 'in_progress' ? 'warning' : 'default'}>
                            {review.status.replace('_', ' ')}
                          </Badge>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Calibration Tab - 9-Box Grid */}
      {activeTab === 'calibration' && (
        <Card>
          <h3 className="text-sm font-semibold text-t1 mb-4">9-Box Talent Grid</h3>
          <div className="grid grid-cols-3 gap-1 max-w-2xl">
            {[
              { label: 'Enigma', bg: 'bg-amber-50', pos: 'High Potential / Low Performance' },
              { label: 'Growth Employee', bg: 'bg-blue-50', pos: 'High Potential / Moderate Performance' },
              { label: 'Star', bg: 'bg-green-50', pos: 'High Potential / High Performance' },
              { label: 'Underperformer', bg: 'bg-red-50', pos: 'Moderate Potential / Low Performance' },
              { label: 'Core Player', bg: 'bg-gray-50', pos: 'Moderate Potential / Moderate Performance' },
              { label: 'High Performer', bg: 'bg-green-50', pos: 'Moderate Potential / High Performance' },
              { label: 'Risk', bg: 'bg-red-100', pos: 'Low Potential / Low Performance' },
              { label: 'Average Performer', bg: 'bg-amber-50', pos: 'Low Potential / Moderate Performance' },
              { label: 'Workhorse', bg: 'bg-blue-50', pos: 'Low Potential / High Performance' },
            ].map((box, i) => {
              const emps = demoEmployees.slice(i * 3, i * 3 + 3)
              return (
                <div key={i} className={`${box.bg} rounded-lg p-4 min-h-[120px]`}>
                  <p className="text-xs font-semibold text-t1 mb-1">{box.label}</p>
                  <p className="text-[0.6rem] text-t3 mb-2">{box.pos}</p>
                  <div className="flex flex-wrap gap-1">
                    {emps.map(e => (
                      <Avatar key={e.id} name={e.profile?.full_name || ''} size="xs" />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
          <div className="flex mt-4 gap-4 text-xs text-t3">
            <span>Y-axis: Potential (Low to High, bottom to top)</span>
            <span>X-axis: Performance (Low to High, left to right)</span>
          </div>
        </Card>
      )}

      {/* Feedback Tab */}
      {activeTab === 'feedback' && (
        <Card padding="none">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recognition & Feedback Feed</CardTitle>
              <Button size="sm"><MessageSquare size={14} /> Give Feedback</Button>
            </div>
          </CardHeader>
          <div className="divide-y divide-divider">
            {demoFeedback.map(fb => {
              const from = demoEmployees.find(e => e.id === fb.from_id)
              const to = demoEmployees.find(e => e.id === fb.to_id)
              return (
                <div key={fb.id} className="px-6 py-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Avatar name={from?.profile?.full_name || ''} size="sm" />
                    <div>
                      <span className="text-sm font-medium text-t1">{from?.profile?.full_name}</span>
                      <span className="text-xs text-t3 mx-1">
                        {fb.type === 'recognition' ? 'recognized' : fb.type === 'feedback' ? 'gave feedback to' : 'checked in with'}
                      </span>
                      <span className="text-sm font-medium text-t1">{to?.profile?.full_name}</span>
                    </div>
                    <Badge variant={fb.type === 'recognition' ? 'success' : fb.type === 'feedback' ? 'info' : 'default'}>
                      {fb.type}
                    </Badge>
                  </div>
                  <p className="text-sm text-t2 ml-11">{fb.content}</p>
                  <p className="text-xs text-t3 ml-11 mt-1">{new Date(fb.created_at).toLocaleDateString()}</p>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Create Goal Modal */}
      <Modal open={showGoalModal} onClose={() => setShowGoalModal(false)} title="Create New Goal">
        <div className="space-y-4">
          <Input label="Goal Title" placeholder="e.g., Increase customer satisfaction by 15%" />
          <Textarea label="Description" placeholder="Describe the goal, expected outcomes, and key metrics..." rows={3} />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Type" options={[{ value: 'kpi', label: 'KPI' }, { value: 'okr', label: 'OKR' }]} />
            <Input label="Weight (%)" type="number" placeholder="25" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Due Date" type="date" />
            <Select label="Assign To" options={demoEmployees.map(e => ({ value: e.id, label: e.profile?.full_name || '' }))} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowGoalModal(false)}>Cancel</Button>
            <Button onClick={() => setShowGoalModal(false)}>Create Goal</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
