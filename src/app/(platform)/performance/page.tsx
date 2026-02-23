'use client'

import { useState, useMemo } from 'react'
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
import { Plus, Target, Star, MessageSquare, Pencil, Trash2 } from 'lucide-react'
import { useTempo } from '@/lib/store'
import { AIScoreBadge, AIAlertBanner, AIInsightCard } from '@/components/ai'
import { scoreGoalQuality, detectRatingBias, analyzeFeedbackSentiment } from '@/lib/ai-engine'

export default function PerformancePage() {
  const {
    goals, employees, reviewCycles, reviews, feedback,
    addGoal, updateGoal, deleteGoal,
    addReviewCycle, addReview, updateReview,
    addFeedback, getEmployeeName, currentEmployeeId,
  } = useTempo()

  const [activeTab, setActiveTab] = useState('goals')

  // Goal modal
  const [showGoalModal, setShowGoalModal] = useState(false)
  const [editingGoal, setEditingGoal] = useState<string | null>(null)
  const [goalForm, setGoalForm] = useState({ title: '', description: '', category: 'business' as string, employee_id: '', due_date: '', start_date: '', progress: 0 })

  // Feedback modal
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [fbForm, setFbForm] = useState({ to_id: '', type: 'recognition' as string, content: '', is_public: true })

  // Review cycle modal
  const [showCycleModal, setShowCycleModal] = useState(false)
  const [cycleForm, setCycleForm] = useState({ title: '', type: 'mid_year' as string, start_date: '', end_date: '' })

  // Review modal
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [reviewForm, setReviewForm] = useState({ employee_id: '', cycle_id: '', overall_rating: 0, comments: '' })

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const tabs = [
    { id: 'goals', label: 'Goals', count: goals.length },
    { id: 'reviews', label: 'Reviews', count: reviews.length },
    { id: 'calibration', label: 'Calibration' },
    { id: 'feedback', label: 'Feedback', count: feedback.length },
  ]

  const completedReviews = reviews.filter(r => r.status === 'submitted').length
  const ratedReviews = reviews.filter(r => r.overall_rating)
  const avgRating = ratedReviews.length > 0 ? ratedReviews.reduce((a, r) => a + (r.overall_rating || 0), 0) / ratedReviews.length : 0

  // AI-powered insights
  const biasInsights = useMemo(() => detectRatingBias(reviews, employees), [reviews, employees])
  const feedbackSentiment = useMemo(() => analyzeFeedbackSentiment(feedback), [feedback])

  // ---- Goal CRUD ----
  function openNewGoal() {
    setEditingGoal(null)
    setGoalForm({ title: '', description: '', category: 'business', employee_id: employees[0]?.id || '', due_date: '', start_date: '', progress: 0 })
    setShowGoalModal(true)
  }

  function openEditGoal(id: string) {
    const g = goals.find(x => x.id === id)
    if (!g) return
    setEditingGoal(id)
    setGoalForm({
      title: g.title, description: g.description || '', category: g.category,
      employee_id: g.employee_id, due_date: g.due_date, start_date: g.start_date,
      progress: g.progress,
    })
    setShowGoalModal(true)
  }

  function submitGoal() {
    if (!goalForm.title || !goalForm.employee_id) return
    const data = {
      title: goalForm.title,
      description: goalForm.description || null,
      category: goalForm.category,
      employee_id: goalForm.employee_id,
      due_date: goalForm.due_date || '2026-12-31',
      start_date: goalForm.start_date || new Date().toISOString().split('T')[0],
      progress: Number(goalForm.progress) || 0,
      status: Number(goalForm.progress) >= 75 ? 'on_track' : Number(goalForm.progress) >= 40 ? 'at_risk' : 'behind',
    }
    if (editingGoal) {
      updateGoal(editingGoal, data)
    } else {
      addGoal(data)
    }
    setShowGoalModal(false)
  }

  function confirmDeleteGoal() {
    if (deleteConfirm) {
      deleteGoal(deleteConfirm)
      setDeleteConfirm(null)
    }
  }

  // ---- Feedback ----
  function submitFeedback() {
    if (!fbForm.to_id || !fbForm.content) return
    addFeedback({
      from_id: currentEmployeeId,
      to_id: fbForm.to_id,
      type: fbForm.type,
      content: fbForm.content,
      is_public: fbForm.is_public,
    })
    setShowFeedbackModal(false)
    setFbForm({ to_id: '', type: 'recognition', content: '', is_public: true })
  }

  // ---- Review Cycle ----
  function submitCycle() {
    if (!cycleForm.title) return
    addReviewCycle({
      title: cycleForm.title,
      type: cycleForm.type,
      status: 'active',
      start_date: cycleForm.start_date || new Date().toISOString().split('T')[0],
      end_date: cycleForm.end_date || '2026-12-31',
    })
    setShowCycleModal(false)
    setCycleForm({ title: '', type: 'mid_year', start_date: '', end_date: '' })
  }

  // ---- Review ----
  function submitReview() {
    if (!reviewForm.employee_id || !reviewForm.cycle_id) return
    addReview({
      cycle_id: reviewForm.cycle_id,
      employee_id: reviewForm.employee_id,
      reviewer_id: currentEmployeeId,
      type: 'manager',
      status: reviewForm.overall_rating ? 'submitted' : 'in_progress',
      overall_rating: reviewForm.overall_rating || null,
      ratings: reviewForm.overall_rating ? { leadership: reviewForm.overall_rating, execution: reviewForm.overall_rating, collaboration: reviewForm.overall_rating, innovation: reviewForm.overall_rating } : null,
      comments: reviewForm.comments || null,
      submitted_at: reviewForm.overall_rating ? new Date().toISOString() : null,
    })
    setShowReviewModal(false)
    setReviewForm({ employee_id: '', cycle_id: '', overall_rating: 0, comments: '' })
  }

  return (
    <>
      <Header
        title="Performance"
        subtitle="Goals, reviews, calibration, and feedback"
        actions={
          <div className="flex gap-2">
            {activeTab === 'goals' && <Button size="sm" onClick={openNewGoal}><Plus size={14} /> New Goal</Button>}
            {activeTab === 'reviews' && (
              <>
                <Button size="sm" variant="secondary" onClick={() => setShowCycleModal(true)}><Plus size={14} /> New Cycle</Button>
                <Button size="sm" onClick={() => { setReviewForm({ employee_id: '', cycle_id: reviewCycles[0]?.id || '', overall_rating: 0, comments: '' }); setShowReviewModal(true) }}><Plus size={14} /> New Review</Button>
              </>
            )}
            {activeTab === 'feedback' && <Button size="sm" onClick={() => setShowFeedbackModal(true)}><MessageSquare size={14} /> Give Feedback</Button>}
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Active Goals" value={goals.filter(g => g.status === 'on_track' || g.status === 'at_risk').length} icon={<Target size={20} />} />
        <StatCard label="Avg Progress" value={goals.length > 0 ? `${Math.round(goals.reduce((a, g) => a + g.progress, 0) / goals.length)}%` : '0%'} change="On track" changeType="positive" />
        <StatCard label="Reviews Completed" value={`${completedReviews}/${reviews.length}`} icon={<Star size={20} />} />
        <StatCard label="Avg Rating" value={avgRating > 0 ? avgRating.toFixed(1) : '-'} change="Out of 5.0" changeType="neutral" />
      </div>

      {/* AI Bias Detection Alerts */}
      {biasInsights.length > 0 && (
        <AIAlertBanner insights={biasInsights} className="mb-4" />
      )}
      {feedbackSentiment && (
        <AIInsightCard insight={{ id: 'ai-feedback-sentiment', category: 'trend', severity: 'info', title: 'Feedback Sentiment Analysis', description: `Positive: ${feedbackSentiment.positive}% | Neutral: ${feedbackSentiment.neutral}% | Negative: ${feedbackSentiment.negative}%`, confidence: 'high', confidenceScore: 85, suggestedAction: feedbackSentiment.negative > 30 ? 'Review negative feedback trends for coaching opportunities' : 'Sentiment is healthy, continue current practices', module: 'performance' }} className="mb-4" />
      )}

      <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} className="mb-6" />

      {/* Goals Tab */}
      {activeTab === 'goals' && (
        <Card padding="none">
          <div className="divide-y divide-divider">
            {goals.length === 0 && (
              <div className="px-6 py-12 text-center text-sm text-t3">No goals yet. Click "New Goal" to create one.</div>
            )}
            {goals.map((goal) => (
              <div key={goal.id} className="px-6 py-4 hover:bg-canvas/50 transition-colors">
                <div className="flex items-start gap-4">
                  <Avatar name={getEmployeeName(goal.employee_id)} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-t1">{goal.title}</p>
                      <Badge variant={goal.category === 'business' ? 'info' : goal.category === 'compliance' ? 'warning' : 'orange'}>{goal.category}</Badge>
                    </div>
                    <p className="text-xs text-t3 mb-1">{getEmployeeName(goal.employee_id)}</p>
                    {goal.description && <p className="text-xs text-t2 mb-2">{goal.description}</p>}
                    <div className="flex items-center gap-4">
                      <div className="flex-1 max-w-xs">
                        <Progress value={goal.progress} showLabel />
                      </div>
                      <span className="text-xs text-t3">Due: {goal.due_date}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <AIScoreBadge score={scoreGoalQuality(goal)} />
                    <Badge variant={goal.status === 'on_track' ? 'success' : goal.status === 'at_risk' ? 'warning' : 'error'}>
                      {goal.status.replace(/_/g, ' ')}
                    </Badge>
                    <button onClick={() => openEditGoal(goal.id)} className="p-1.5 text-t3 hover:text-t1 hover:bg-canvas rounded-lg transition-colors"><Pencil size={14} /></button>
                    <button onClick={() => setDeleteConfirm(goal.id)} className="p-1.5 text-t3 hover:text-error hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Reviews Tab */}
      {activeTab === 'reviews' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {reviewCycles.map(cycle => (
              <Card key={cycle.id}>
                <div className="flex items-center justify-between mb-2">
                  <Badge variant={cycle.status === 'active' ? 'success' : 'orange'}>{cycle.status}</Badge>
                  <span className="text-xs text-t3">{cycle.type}</span>
                </div>
                <h3 className="text-sm font-medium text-t1 mb-1">{cycle.title}</h3>
                <p className="text-xs text-t3">{cycle.start_date} to {cycle.end_date}</p>
              </Card>
            ))}
          </div>
          <Card padding="none">
            <CardHeader><CardTitle>Individual Reviews</CardTitle></CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-divider bg-canvas">
                    <th className="tempo-th text-left px-6 py-3">Employee</th>
                    <th className="tempo-th text-left px-4 py-3">Reviewer</th>
                    <th className="tempo-th text-left px-4 py-3">Type</th>
                    <th className="tempo-th text-center px-4 py-3">Rating</th>
                    <th className="tempo-th text-left px-4 py-3">Status</th>
                    <th className="tempo-th text-left px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {reviews.map(review => (
                    <tr key={review.id} className="hover:bg-canvas/50">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar name={getEmployeeName(review.employee_id)} size="sm" />
                          <span className="text-sm text-t1">{getEmployeeName(review.employee_id)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-t2">{getEmployeeName(review.reviewer_id)}</td>
                      <td className="px-4 py-3"><Badge>{review.type}</Badge></td>
                      <td className="px-4 py-3 text-center">
                        {review.overall_rating ? <span className="tempo-stat text-lg text-tempo-600">{review.overall_rating}</span> : <span className="text-xs text-t3">-</span>}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={review.status === 'submitted' ? 'success' : review.status === 'in_progress' ? 'warning' : 'default'}>
                          {review.status.replace(/_/g, ' ')}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {review.status !== 'submitted' && (
                          <Button size="sm" variant="secondary" onClick={() => updateReview(review.id, { status: 'submitted', overall_rating: 4, submitted_at: new Date().toISOString(), ratings: { leadership: 4, execution: 4, collaboration: 4, innovation: 4 }, comments: 'Good performance this cycle.' })}>
                            Complete
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Calibration Tab */}
      {activeTab === 'calibration' && (() => {
        // Compute 9-box placement from review ratings + goal progress
        const boxes = [
          { label: 'Enigma', bg: 'bg-amber-50', pos: 'High Potential / Low Performance' },
          { label: 'Growth Employee', bg: 'bg-blue-50', pos: 'High Potential / Moderate Performance' },
          { label: 'Star', bg: 'bg-green-50', pos: 'High Potential / High Performance' },
          { label: 'Underperformer', bg: 'bg-red-50', pos: 'Moderate Potential / Low Performance' },
          { label: 'Core Player', bg: 'bg-gray-50', pos: 'Moderate Potential / Moderate Performance' },
          { label: 'High Performer', bg: 'bg-green-50', pos: 'Moderate Potential / High Performance' },
          { label: 'Risk', bg: 'bg-red-100', pos: 'Low Potential / Low Performance' },
          { label: 'Average Performer', bg: 'bg-amber-50', pos: 'Low Potential / Moderate Performance' },
          { label: 'Workhorse', bg: 'bg-blue-50', pos: 'Low Potential / High Performance' },
        ]
        // Calculate performance (from reviews) and potential (from level + goals)
        const boxAssignments: Record<number, typeof employees> = {}
        boxes.forEach((_, i) => { boxAssignments[i] = [] })
        employees.forEach(emp => {
          const empReviews = reviews.filter(r => r.employee_id === emp.id)
          const avgRating = empReviews.length > 0 ? empReviews.reduce((a, r) => a + (r.overall_rating || 3), 0) / empReviews.length : 3
          const empGoals = goals.filter(g => g.employee_id === emp.id)
          const avgProgress = empGoals.length > 0 ? empGoals.reduce((a, g) => a + g.progress, 0) / empGoals.length : 50
          // Performance: Low(<3), Moderate(3-4), High(>4)
          const perfCol = avgRating < 3 ? 0 : avgRating <= 4 ? 1 : 2
          // Potential: based on level + goal progress
          const levelScore = ['Executive', 'Director', 'Principal'].some(l => (emp.level || '').includes(l)) ? 2
            : ['Senior', 'Lead'].some(l => (emp.level || '').includes(l)) ? (avgProgress > 60 ? 2 : 1)
            : avgProgress > 70 ? 1 : 0
          // Row: 0=high potential, 1=moderate, 2=low
          const potRow = levelScore >= 2 ? 0 : levelScore === 1 ? 1 : 2
          const boxIdx = potRow * 3 + perfCol
          boxAssignments[boxIdx].push(emp)
        })
        return (
          <Card>
            <h3 className="text-sm font-semibold text-t1 mb-4">9-Box Talent Grid</h3>
            <div className="grid grid-cols-3 gap-1 max-w-2xl">
              {boxes.map((box, i) => (
                <div key={i} className={`${box.bg} rounded-lg p-4 min-h-[120px]`}>
                  <p className="text-xs font-semibold text-t1 mb-1">{box.label}</p>
                  <p className="text-[0.6rem] text-t3 mb-2">{box.pos}</p>
                  <div className="flex flex-wrap gap-1">
                    {boxAssignments[i].map(e => <Avatar key={e.id} name={e.profile?.full_name || ''} size="xs" />)}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex mt-4 gap-4 text-xs text-t3">
              <span>Y-axis: Potential (Low to High, bottom to top)</span>
              <span>X-axis: Performance (Low to High, left to right)</span>
            </div>
          </Card>
        )
      })()}

      {/* Feedback Tab */}
      {activeTab === 'feedback' && (
        <Card padding="none">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recognition & Feedback Feed</CardTitle>
              <Button size="sm" onClick={() => setShowFeedbackModal(true)}><MessageSquare size={14} /> Give Feedback</Button>
            </div>
          </CardHeader>
          <div className="divide-y divide-divider">
            {feedback.length === 0 && <div className="px-6 py-12 text-center text-sm text-t3">No feedback yet.</div>}
            {feedback.map(fb => (
              <div key={fb.id} className="px-6 py-4">
                <div className="flex items-center gap-3 mb-2">
                  <Avatar name={getEmployeeName(fb.from_id)} size="sm" />
                  <div>
                    <span className="text-sm font-medium text-t1">{getEmployeeName(fb.from_id)}</span>
                    <span className="text-xs text-t3 mx-1">
                      {fb.type === 'recognition' ? 'recognized' : fb.type === 'feedback' ? 'gave feedback to' : 'checked in with'}
                    </span>
                    <span className="text-sm font-medium text-t1">{getEmployeeName(fb.to_id)}</span>
                  </div>
                  <Badge variant={fb.type === 'recognition' ? 'success' : fb.type === 'feedback' ? 'info' : 'default'}>{fb.type}</Badge>
                </div>
                <p className="text-sm text-t2 ml-11">{fb.content}</p>
                <p className="text-xs text-t3 ml-11 mt-1">{new Date(fb.created_at).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ---- MODALS ---- */}

      {/* Create/Edit Goal */}
      <Modal open={showGoalModal} onClose={() => setShowGoalModal(false)} title={editingGoal ? 'Edit Goal' : 'Create New Goal'}>
        <div className="space-y-4">
          <Input label="Goal Title" placeholder="e.g., Increase customer satisfaction by 15%" value={goalForm.title} onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })} />
          <Textarea label="Description" placeholder="Describe the goal, expected outcomes, and key metrics..." rows={3} value={goalForm.description} onChange={(e) => setGoalForm({ ...goalForm, description: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Category" value={goalForm.category} onChange={(e) => setGoalForm({ ...goalForm, category: e.target.value })} options={[
              { value: 'business', label: 'Business' },
              { value: 'project', label: 'Project' },
              { value: 'development', label: 'Development' },
              { value: 'compliance', label: 'Compliance' },
            ]} />
            <Select label="Assign To" value={goalForm.employee_id} onChange={(e) => setGoalForm({ ...goalForm, employee_id: e.target.value })} options={employees.map(e => ({ value: e.id, label: e.profile?.full_name || '' }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Start Date" type="date" value={goalForm.start_date} onChange={(e) => setGoalForm({ ...goalForm, start_date: e.target.value })} />
            <Input label="Due Date" type="date" value={goalForm.due_date} onChange={(e) => setGoalForm({ ...goalForm, due_date: e.target.value })} />
          </div>
          {editingGoal && (
            <Input label="Progress (%)" type="number" min={0} max={100} value={goalForm.progress} onChange={(e) => setGoalForm({ ...goalForm, progress: Number(e.target.value) })} />
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowGoalModal(false)}>Cancel</Button>
            <Button onClick={submitGoal}>{editingGoal ? 'Save Changes' : 'Create Goal'}</Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Goal" size="sm">
        <p className="text-sm text-t2 mb-4">Are you sure you want to delete this goal? This action cannot be undone.</p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button variant="danger" onClick={confirmDeleteGoal}>Delete</Button>
        </div>
      </Modal>

      {/* Give Feedback */}
      <Modal open={showFeedbackModal} onClose={() => setShowFeedbackModal(false)} title="Give Feedback">
        <div className="space-y-4">
          <Select label="To" value={fbForm.to_id} onChange={(e) => setFbForm({ ...fbForm, to_id: e.target.value })} options={employees.map(e => ({ value: e.id, label: e.profile?.full_name || '' }))} />
          <Select label="Type" value={fbForm.type} onChange={(e) => setFbForm({ ...fbForm, type: e.target.value })} options={[
            { value: 'recognition', label: 'Recognition' },
            { value: 'feedback', label: 'Feedback' },
            { value: 'checkin', label: 'Check-in' },
          ]} />
          <Textarea label="Message" placeholder="Share your feedback..." rows={4} value={fbForm.content} onChange={(e) => setFbForm({ ...fbForm, content: e.target.value })} />
          <label className="flex items-center gap-2 text-sm text-t2">
            <input type="checkbox" checked={fbForm.is_public} onChange={(e) => setFbForm({ ...fbForm, is_public: e.target.checked })} className="rounded border-divider" />
            Make this visible to everyone
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowFeedbackModal(false)}>Cancel</Button>
            <Button onClick={submitFeedback}>Send Feedback</Button>
          </div>
        </div>
      </Modal>

      {/* New Review Cycle */}
      <Modal open={showCycleModal} onClose={() => setShowCycleModal(false)} title="Create Review Cycle">
        <div className="space-y-4">
          <Input label="Cycle Name" placeholder="e.g., H2 2026 Performance Review" value={cycleForm.title} onChange={(e) => setCycleForm({ ...cycleForm, title: e.target.value })} />
          <Select label="Type" value={cycleForm.type} onChange={(e) => setCycleForm({ ...cycleForm, type: e.target.value })} options={[
            { value: 'mid_year', label: 'Mid-Year' },
            { value: 'annual', label: 'Annual' },
            { value: 'probation', label: 'Probation' },
          ]} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Start Date" type="date" value={cycleForm.start_date} onChange={(e) => setCycleForm({ ...cycleForm, start_date: e.target.value })} />
            <Input label="End Date" type="date" value={cycleForm.end_date} onChange={(e) => setCycleForm({ ...cycleForm, end_date: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowCycleModal(false)}>Cancel</Button>
            <Button onClick={submitCycle}>Create Cycle</Button>
          </div>
        </div>
      </Modal>

      {/* New Review */}
      <Modal open={showReviewModal} onClose={() => setShowReviewModal(false)} title="Create Review">
        <div className="space-y-4">
          <Select label="Review Cycle" value={reviewForm.cycle_id} onChange={(e) => setReviewForm({ ...reviewForm, cycle_id: e.target.value })} options={reviewCycles.map(c => ({ value: c.id, label: c.title }))} />
          <Select label="Employee" value={reviewForm.employee_id} onChange={(e) => setReviewForm({ ...reviewForm, employee_id: e.target.value })} options={employees.map(e => ({ value: e.id, label: e.profile?.full_name || '' }))} />
          <Select label="Rating (optional)" value={String(reviewForm.overall_rating)} onChange={(e) => setReviewForm({ ...reviewForm, overall_rating: Number(e.target.value) })} options={[
            { value: '0', label: 'Not yet rated' },
            { value: '1', label: '1 - Needs Improvement' },
            { value: '2', label: '2 - Below Expectations' },
            { value: '3', label: '3 - Meets Expectations' },
            { value: '4', label: '4 - Exceeds Expectations' },
            { value: '5', label: '5 - Outstanding' },
          ]} />
          <Textarea label="Comments" placeholder="Performance notes..." rows={3} value={reviewForm.comments} onChange={(e) => setReviewForm({ ...reviewForm, comments: e.target.value })} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowReviewModal(false)}>Cancel</Button>
            <Button onClick={submitReview}>Create Review</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
