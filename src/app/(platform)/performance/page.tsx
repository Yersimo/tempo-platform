'use client'

import { useState, useMemo } from 'react'
import { useAI } from '@/lib/use-ai'
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
import { useTranslations } from 'next-intl'
import { useTempo } from '@/lib/store'
import { AIScoreBadge, AIAlertBanner, AIInsightCard, AIEnhancingIndicator } from '@/components/ai'
import { scoreGoalQuality, detectRatingBias, analyzeFeedbackSentiment } from '@/lib/ai-engine'

export default function PerformancePage() {
  const {
    goals, employees, reviewCycles, reviews, feedback,
    addGoal, updateGoal, deleteGoal,
    addReviewCycle, addReview, updateReview,
    addFeedback, getEmployeeName, currentEmployeeId,
  } = useTempo()

  const t = useTranslations('performance')
  const tc = useTranslations('common')

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
    { id: 'goals', label: t('tabGoals'), count: goals.length },
    { id: 'reviews', label: t('tabReviews'), count: reviews.length },
    { id: 'calibration', label: t('tabCalibration') },
    { id: 'feedback', label: t('tabFeedback'), count: feedback.length },
  ]

  const completedReviews = reviews.filter(r => r.status === 'submitted').length
  const ratedReviews = reviews.filter(r => r.overall_rating)
  const avgRating = ratedReviews.length > 0 ? ratedReviews.reduce((a, r) => a + (r.overall_rating || 0), 0) / ratedReviews.length : 0

  // AI-powered insights
  const biasInsights = useMemo(() => detectRatingBias(reviews, employees), [reviews, employees])
  const feedbackSentiment = useMemo(() => analyzeFeedbackSentiment(feedback), [feedback])

  // Claude AI enhancement - bias detection
  const { result: enhancedBias, isLoading: biasLoading } = useAI({
    action: 'enhanceBiasDetection',
    data: { reviews: reviews.slice(0, 20), employeeCount: employees.length },
    fallback: biasInsights,
    enabled: biasInsights.length > 0,
    cacheKey: `perf-bias-${reviews.length}`,
  })

  // Claude AI enhancement - sentiment analysis
  const { result: enhancedSentiment, isLoading: sentimentLoading } = useAI({
    action: 'enhanceSentiment',
    data: { feedback: feedback.slice(0, 20).map(f => ({ type: f.type, content: f.content })) },
    fallback: feedbackSentiment,
    enabled: feedback.length > 0,
    cacheKey: `perf-sentiment-${feedback.length}`,
  })

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
        title={t('title')}
        subtitle={t('subtitle')}
        actions={
          <div className="flex gap-2">
            {activeTab === 'goals' && <Button size="sm" onClick={openNewGoal}><Plus size={14} /> {t('newGoal')}</Button>}
            {activeTab === 'reviews' && (
              <>
                <Button size="sm" variant="secondary" onClick={() => setShowCycleModal(true)}><Plus size={14} /> {t('newCycle')}</Button>
                <Button size="sm" onClick={() => { setReviewForm({ employee_id: '', cycle_id: reviewCycles[0]?.id || '', overall_rating: 0, comments: '' }); setShowReviewModal(true) }}><Plus size={14} /> {t('newReview')}</Button>
              </>
            )}
            {activeTab === 'feedback' && <Button size="sm" onClick={() => setShowFeedbackModal(true)}><MessageSquare size={14} /> {t('giveFeedback')}</Button>}
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label={t('activeGoals')} value={goals.filter(g => g.status === 'on_track' || g.status === 'at_risk').length} icon={<Target size={20} />} />
        <StatCard label={t('avgProgress')} value={goals.length > 0 ? `${Math.round(goals.reduce((a, g) => a + g.progress, 0) / goals.length)}%` : '0%'} change={t('onTrackLabel')} changeType="positive" />
        <StatCard label={t('reviewsCompleted')} value={`${completedReviews}/${reviews.length}`} icon={<Star size={20} />} />
        <StatCard label={t('avgRating')} value={avgRating > 0 ? avgRating.toFixed(1) : '-'} change={t('outOf5')} changeType="neutral" />
      </div>

      {/* AI Bias Detection Alerts */}
      {enhancedBias.length > 0 && (
        <div className="relative">
          {biasLoading && <AIEnhancingIndicator isLoading />}
          <AIAlertBanner insights={enhancedBias} className="mb-4" />
        </div>
      )}
      {enhancedSentiment && (
        <div className="relative">
          {sentimentLoading && <AIEnhancingIndicator isLoading />}
          <AIInsightCard insight={{ id: 'ai-feedback-sentiment', category: 'trend', severity: 'info', title: t('feedbackSentimentTitle'), description: t('sentimentBreakdown', { positive: enhancedSentiment.positive, neutral: enhancedSentiment.neutral, negative: enhancedSentiment.negative }), confidence: 'high', confidenceScore: 85, suggestedAction: enhancedSentiment.negative > 30 ? t('sentimentNeedsReview') : t('sentimentHealthy'), module: 'performance' }} className="mb-4" />
        </div>
      )}

      <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} className="mb-6" />

      {/* Goals Tab */}
      {activeTab === 'goals' && (
        <Card padding="none">
          <div className="divide-y divide-divider">
            {goals.length === 0 && (
              <div className="px-6 py-12 text-center text-sm text-t3">{t('noGoalsEmpty')}</div>
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
                      <span className="text-xs text-t3">{t('due', { date: goal.due_date })}</span>
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
                <p className="text-xs text-t3">{cycle.start_date} {tc('to')} {cycle.end_date}</p>
              </Card>
            ))}
          </div>
          <Card padding="none">
            <CardHeader><CardTitle>{t('individualReviews')}</CardTitle></CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-divider bg-canvas">
                    <th className="tempo-th text-left px-6 py-3">{t('tableEmployee')}</th>
                    <th className="tempo-th text-left px-4 py-3">{t('tableReviewer')}</th>
                    <th className="tempo-th text-left px-4 py-3">{t('tableType')}</th>
                    <th className="tempo-th text-center px-4 py-3">{t('tableRating')}</th>
                    <th className="tempo-th text-left px-4 py-3">{t('tableStatus')}</th>
                    <th className="tempo-th text-left px-4 py-3">{t('tableActions')}</th>
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
                          <Button size="sm" variant="secondary" onClick={() => updateReview(review.id, { status: 'submitted', overall_rating: 4, submitted_at: new Date().toISOString(), ratings: { leadership: 4, execution: 4, collaboration: 4, innovation: 4 }, comments: t('defaultReviewComment') })}>
                            {t('completeReview')}
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
          { label: t('enigma'), bg: 'bg-amber-50', pos: t('highPotLowPerf') },
          { label: t('growthEmployee'), bg: 'bg-blue-50', pos: t('highPotModPerf') },
          { label: t('star'), bg: 'bg-green-50', pos: t('highPotHighPerf') },
          { label: t('underperformer'), bg: 'bg-red-50', pos: t('modPotLowPerf') },
          { label: t('corePlayer'), bg: 'bg-gray-50', pos: t('modPotModPerf') },
          { label: t('highPerformer'), bg: 'bg-green-50', pos: t('modPotHighPerf') },
          { label: t('risk'), bg: 'bg-red-100', pos: t('lowPotLowPerf') },
          { label: t('averagePerformer'), bg: 'bg-amber-50', pos: t('lowPotModPerf') },
          { label: t('workhorse'), bg: 'bg-blue-50', pos: t('lowPotHighPerf') },
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
            <h3 className="text-sm font-semibold text-t1 mb-4">{t('nineBoxTitle')}</h3>
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
              <span>{t('yAxis')}</span>
              <span>{t('xAxis')}</span>
            </div>
          </Card>
        )
      })()}

      {/* Feedback Tab */}
      {activeTab === 'feedback' && (
        <Card padding="none">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t('recognitionAndFeedback')}</CardTitle>
              <Button size="sm" onClick={() => setShowFeedbackModal(true)}><MessageSquare size={14} /> {t('giveFeedback')}</Button>
            </div>
          </CardHeader>
          <div className="divide-y divide-divider">
            {feedback.length === 0 && <div className="px-6 py-12 text-center text-sm text-t3">{t('noFeedbackYet')}</div>}
            {feedback.map(fb => (
              <div key={fb.id} className="px-6 py-4">
                <div className="flex items-center gap-3 mb-2">
                  <Avatar name={getEmployeeName(fb.from_id)} size="sm" />
                  <div>
                    <span className="text-sm font-medium text-t1">{getEmployeeName(fb.from_id)}</span>
                    <span className="text-xs text-t3 mx-1">
                      {fb.type === 'recognition' ? t('feedbackRecognized') : fb.type === 'feedback' ? t('feedbackGaveFeedbackTo') : t('feedbackCheckedInWith')}
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
      <Modal open={showGoalModal} onClose={() => setShowGoalModal(false)} title={editingGoal ? t('editGoalModal') : t('createGoalModal')}>
        <div className="space-y-4">
          <Input label={t('goalTitle')} placeholder={t('goalTitlePlaceholder')} value={goalForm.title} onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })} />
          <Textarea label={t('goalDescription')} placeholder={t('goalDescPlaceholder')} rows={3} value={goalForm.description} onChange={(e) => setGoalForm({ ...goalForm, description: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Select label={t('category')} value={goalForm.category} onChange={(e) => setGoalForm({ ...goalForm, category: e.target.value })} options={[
              { value: 'business', label: t('categoryBusiness') },
              { value: 'project', label: t('categoryProject') },
              { value: 'development', label: t('categoryDevelopment') },
              { value: 'compliance', label: t('categoryCompliance') },
            ]} />
            <Select label={t('assignTo')} value={goalForm.employee_id} onChange={(e) => setGoalForm({ ...goalForm, employee_id: e.target.value })} options={employees.map(e => ({ value: e.id, label: e.profile?.full_name || '' }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('startDate')} type="date" value={goalForm.start_date} onChange={(e) => setGoalForm({ ...goalForm, start_date: e.target.value })} />
            <Input label={t('dueDate')} type="date" value={goalForm.due_date} onChange={(e) => setGoalForm({ ...goalForm, due_date: e.target.value })} />
          </div>
          {editingGoal && (
            <Input label={t('progress')} type="number" min={0} max={100} value={goalForm.progress} onChange={(e) => setGoalForm({ ...goalForm, progress: Number(e.target.value) })} />
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowGoalModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitGoal}>{editingGoal ? tc('saveChanges') : t('createGoal')}</Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title={t('deleteGoalModal')} size="sm">
        <p className="text-sm text-t2 mb-4">{t('deleteGoalConfirm')}</p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>{tc('cancel')}</Button>
          <Button variant="danger" onClick={confirmDeleteGoal}>{tc('delete')}</Button>
        </div>
      </Modal>

      {/* Give Feedback */}
      <Modal open={showFeedbackModal} onClose={() => setShowFeedbackModal(false)} title={t('giveFeedbackModal')}>
        <div className="space-y-4">
          <Select label={t('feedbackTo')} value={fbForm.to_id} onChange={(e) => setFbForm({ ...fbForm, to_id: e.target.value })} options={employees.map(e => ({ value: e.id, label: e.profile?.full_name || '' }))} />
          <Select label={t('feedbackType')} value={fbForm.type} onChange={(e) => setFbForm({ ...fbForm, type: e.target.value })} options={[
            { value: 'recognition', label: t('feedbackRecognition') },
            { value: 'feedback', label: t('feedbackFeedback') },
            { value: 'checkin', label: t('feedbackCheckin') },
          ]} />
          <Textarea label={t('feedbackMessage')} placeholder={t('feedbackPlaceholder')} rows={4} value={fbForm.content} onChange={(e) => setFbForm({ ...fbForm, content: e.target.value })} />
          <label className="flex items-center gap-2 text-sm text-t2">
            <input type="checkbox" checked={fbForm.is_public} onChange={(e) => setFbForm({ ...fbForm, is_public: e.target.checked })} className="rounded border-divider" />
            {t('feedbackPublic')}
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowFeedbackModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitFeedback}>{t('sendFeedback')}</Button>
          </div>
        </div>
      </Modal>

      {/* New Review Cycle */}
      <Modal open={showCycleModal} onClose={() => setShowCycleModal(false)} title={t('createCycleModal')}>
        <div className="space-y-4">
          <Input label={t('cycleName')} placeholder={t('cycleNamePlaceholder')} value={cycleForm.title} onChange={(e) => setCycleForm({ ...cycleForm, title: e.target.value })} />
          <Select label={t('cycleType')} value={cycleForm.type} onChange={(e) => setCycleForm({ ...cycleForm, type: e.target.value })} options={[
            { value: 'mid_year', label: t('cycleTypeMidYear') },
            { value: 'annual', label: t('cycleTypeAnnual') },
            { value: 'probation', label: t('cycleTypeProbation') },
          ]} />
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('startDate')} type="date" value={cycleForm.start_date} onChange={(e) => setCycleForm({ ...cycleForm, start_date: e.target.value })} />
            <Input label={t('dueDate')} type="date" value={cycleForm.end_date} onChange={(e) => setCycleForm({ ...cycleForm, end_date: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowCycleModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitCycle}>{t('createCycle')}</Button>
          </div>
        </div>
      </Modal>

      {/* New Review */}
      <Modal open={showReviewModal} onClose={() => setShowReviewModal(false)} title={t('createReviewModal')}>
        <div className="space-y-4">
          <Select label={t('reviewCycle')} value={reviewForm.cycle_id} onChange={(e) => setReviewForm({ ...reviewForm, cycle_id: e.target.value })} options={reviewCycles.map(c => ({ value: c.id, label: c.title }))} />
          <Select label={tc('employee')} value={reviewForm.employee_id} onChange={(e) => setReviewForm({ ...reviewForm, employee_id: e.target.value })} options={employees.map(e => ({ value: e.id, label: e.profile?.full_name || '' }))} />
          <Select label={t('ratingOptional')} value={String(reviewForm.overall_rating)} onChange={(e) => setReviewForm({ ...reviewForm, overall_rating: Number(e.target.value) })} options={[
            { value: '0', label: t('notYetRated') },
            { value: '1', label: t('rating1') },
            { value: '2', label: t('rating2') },
            { value: '3', label: t('rating3') },
            { value: '4', label: t('rating4') },
            { value: '5', label: t('rating5') },
          ]} />
          <Textarea label={t('comments')} placeholder={t('commentsPlaceholder')} rows={3} value={reviewForm.comments} onChange={(e) => setReviewForm({ ...reviewForm, comments: e.target.value })} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowReviewModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitReview}>{t('createReview')}</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
