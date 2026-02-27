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
import { Plus, Target, Star, MessageSquare, Pencil, Trash2, Calendar, Heart, Award, BarChart3, CheckCircle2, Clock, MapPin, Users, TrendingUp, ArrowRight, Code, Lightbulb, Settings } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useTempo } from '@/lib/store'
import { AIScoreBadge, AIAlertBanner, AIInsightCard, AIEnhancingIndicator } from '@/components/ai'
import { scoreGoalQuality, detectRatingBias, analyzeFeedbackSentiment, suggestOneOnOneTopics, analyzeRecognitionPatterns, identifyCompetencyGaps, analyzeCareerPathDetailed } from '@/lib/ai-engine'

export default function PerformancePage() {
  const {
    goals, employees, reviewCycles, reviews, feedback,
    oneOnOnes, recognitions, competencyFramework, competencyRatings,
    addGoal, updateGoal, deleteGoal,
    addReviewCycle, addReview, updateReview,
    addFeedback, getEmployeeName, currentEmployeeId,
    addOneOnOne, updateOneOnOne, addRecognition, addCompetencyRating, updateCompetencyRating,
    careerTracks,
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

  // 1:1 Meeting modal
  const [show1on1Modal, setShow1on1Modal] = useState(false)
  const [ooForm, setOoForm] = useState({ employee_id: '', manager_id: currentEmployeeId, scheduled_date: '', duration_minutes: 30, recurring: 'weekly' as string, location: '', agenda: [] as string[] })
  const [newAgendaItem, setNewAgendaItem] = useState('')

  // Kudos modal
  const [showKudosModal, setShowKudosModal] = useState(false)
  const [kudosForm, setKudosForm] = useState({ to_id: '', value: 'Excellence' as string, message: '' })

  // Competency rating modal
  const [showCompRatingModal, setShowCompRatingModal] = useState(false)
  const [compRatingForm, setCompRatingForm] = useState({ employee_id: '', competency_id: '', rating: 3, target: 3 })

  // Competency filter
  const [compEmployeeFilter, setCompEmployeeFilter] = useState('')

  // Career path state
  const [selectedCareerTrack, setSelectedCareerTrack] = useState('')
  const [careerEmployeeId, setCareerEmployeeId] = useState('')

  const tabs = [
    { id: 'goals', label: t('tabGoals'), count: goals.length },
    { id: 'reviews', label: t('tabReviews'), count: reviews.length },
    { id: 'calibration', label: t('tabCalibration') },
    { id: 'feedback', label: t('tabFeedback'), count: feedback.length },
    { id: 'one-on-ones', label: t('tabOneOnOnes'), count: oneOnOnes.length },
    { id: 'recognition', label: t('tabRecognition'), count: recognitions.length },
    { id: 'competencies', label: t('tabCompetencies') },
    { id: 'career-paths', label: t('tabCareerPaths') },
  ]

  const completedReviews = reviews.filter(r => r.status === 'submitted').length
  const ratedReviews = reviews.filter(r => r.overall_rating)
  const avgRating = ratedReviews.length > 0 ? ratedReviews.reduce((a, r) => a + (r.overall_rating || 0), 0) / ratedReviews.length : 0

  // AI-powered insights
  const biasInsights = useMemo(() => detectRatingBias(reviews, employees), [reviews, employees])
  const feedbackSentiment = useMemo(() => analyzeFeedbackSentiment(feedback), [feedback])
  const recognitionInsights = useMemo(() => analyzeRecognitionPatterns(recognitions, employees), [recognitions, employees])
  const competencyGapInsights = useMemo(() => identifyCompetencyGaps(competencyRatings, competencyFramework, employees), [competencyRatings, competencyFramework, employees])

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

  // 1:1 Meeting computed data
  const upcomingMeetings = useMemo(() => oneOnOnes.filter(o => o.status === 'upcoming').sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime()), [oneOnOnes])
  const pastMeetings = useMemo(() => oneOnOnes.filter(o => o.status === 'completed').sort((a, b) => new Date(b.scheduled_date).getTime() - new Date(a.scheduled_date).getTime()), [oneOnOnes])
  const openActionItems = useMemo(() => oneOnOnes.flatMap(o => (o.action_items || []).filter(ai => !ai.done)), [oneOnOnes])

  // Recognition computed data
  const recognitionLeaderboard = useMemo(() => {
    const counts: Record<string, number> = {}
    recognitions.forEach(r => { counts[r.to_id] = (counts[r.to_id] || 0) + 1 })
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id, count]) => ({ id, name: getEmployeeName(id), count }))
  }, [recognitions, getEmployeeName])

  const valueBreakdown = useMemo(() => {
    const counts: Record<string, number> = {}
    recognitions.forEach(r => { counts[r.value] = (counts[r.value] || 0) + 1 })
    return Object.entries(counts).sort((a, b) => b[1] - a[1])
  }, [recognitions])

  // Competency computed data
  const filteredRatings = useMemo(() => {
    if (!compEmployeeFilter) return competencyRatings
    return competencyRatings.filter(r => r.employee_id === compEmployeeFilter)
  }, [competencyRatings, compEmployeeFilter])

  const competencyStats = useMemo(() => {
    const assessedEmployees = new Set(competencyRatings.map(r => r.employee_id)).size
    const gaps = competencyRatings.filter(r => r.rating < r.target).length
    const strengths = competencyRatings.filter(r => r.rating > r.target).length
    const avgRating = competencyRatings.length > 0 ? competencyRatings.reduce((a, r) => a + r.rating, 0) / competencyRatings.length : 0
    return { assessedEmployees, gaps, strengths, avgRating }
  }, [competencyRatings])

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
      due_date: goalForm.due_date || `${new Date().getFullYear()}-12-31`,
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
      end_date: cycleForm.end_date || `${new Date().getFullYear()}-12-31`,
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

  // ---- 1:1 Meeting ----
  function submit1on1() {
    if (!ooForm.employee_id || !ooForm.scheduled_date) return
    addOneOnOne({
      manager_id: ooForm.manager_id || currentEmployeeId,
      employee_id: ooForm.employee_id,
      scheduled_date: new Date(ooForm.scheduled_date).toISOString(),
      status: 'upcoming',
      agenda: ooForm.agenda,
      notes: null,
      action_items: [],
      duration_minutes: Number(ooForm.duration_minutes) || 30,
      recurring: ooForm.recurring,
      location: ooForm.location || 'Virtual - Teams',
    })
    setShow1on1Modal(false)
    setOoForm({ employee_id: '', manager_id: currentEmployeeId, scheduled_date: '', duration_minutes: 30, recurring: 'weekly', location: '', agenda: [] })
    setNewAgendaItem('')
  }

  // ---- Recognition ----
  function submitKudos() {
    if (!kudosForm.to_id || !kudosForm.message) return
    addRecognition({
      from_id: currentEmployeeId,
      to_id: kudosForm.to_id,
      value: kudosForm.value,
      message: kudosForm.message,
      is_public: true,
    })
    setShowKudosModal(false)
    setKudosForm({ to_id: '', value: 'Excellence', message: '' })
  }

  // ---- Competency Rating ----
  function submitCompRating() {
    if (!compRatingForm.employee_id || !compRatingForm.competency_id) return
    // Check if rating already exists
    const existing = competencyRatings.find(r => r.employee_id === compRatingForm.employee_id && r.competency_id === compRatingForm.competency_id)
    if (existing) {
      updateCompetencyRating(existing.id, { rating: compRatingForm.rating, target: compRatingForm.target, assessed_date: new Date().toISOString().split('T')[0], assessor_id: currentEmployeeId })
    } else {
      addCompetencyRating({
        employee_id: compRatingForm.employee_id,
        competency_id: compRatingForm.competency_id,
        rating: compRatingForm.rating,
        target: compRatingForm.target,
        assessed_date: new Date().toISOString().split('T')[0],
        assessor_id: currentEmployeeId,
      })
    }
    setShowCompRatingModal(false)
    setCompRatingForm({ employee_id: '', competency_id: '', rating: 3, target: 3 })
  }

  const valueColors: Record<string, string> = {
    'Innovation': 'info',
    'Teamwork': 'success',
    'Integrity': 'warning',
    'Excellence': 'orange',
    'Customer Focus': 'default',
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
            {activeTab === 'one-on-ones' && <Button size="sm" onClick={() => { setOoForm({ employee_id: '', manager_id: currentEmployeeId, scheduled_date: '', duration_minutes: 30, recurring: 'weekly', location: '', agenda: [] }); setShow1on1Modal(true) }}><Calendar size={14} /> {t('schedule1on1')}</Button>}
            {activeTab === 'recognition' && <Button size="sm" onClick={() => setShowKudosModal(true)}><Heart size={14} /> {t('giveKudos')}</Button>}
            {activeTab === 'competencies' && <Button size="sm" onClick={() => setShowCompRatingModal(true)}><BarChart3 size={14} /> {t('rateCompetency')}</Button>}
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
                      <td className="px-4 py-3 text-xs text-t2">{getEmployeeName(review.reviewer_id)}</td>
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
        const boxes = [
          { label: t('enigma'), bg: 'bg-gray-50', pos: t('highPotLowPerf') },
          { label: t('growthEmployee'), bg: 'bg-gray-50', pos: t('highPotModPerf') },
          { label: t('star'), bg: 'bg-gray-100', pos: t('highPotHighPerf') },
          { label: t('underperformer'), bg: 'bg-gray-50', pos: t('modPotLowPerf') },
          { label: t('corePlayer'), bg: 'bg-gray-50', pos: t('modPotModPerf') },
          { label: t('highPerformer'), bg: 'bg-gray-100', pos: t('modPotHighPerf') },
          { label: t('risk'), bg: 'bg-gray-100', pos: t('lowPotLowPerf') },
          { label: t('averagePerformer'), bg: 'bg-gray-50', pos: t('lowPotModPerf') },
          { label: t('workhorse'), bg: 'bg-gray-50', pos: t('lowPotHighPerf') },
        ]
        const boxAssignments: Record<number, typeof employees> = {}
        boxes.forEach((_, i) => { boxAssignments[i] = [] })
        employees.forEach(emp => {
          const empReviews = reviews.filter(r => r.employee_id === emp.id)
          const avgRating = empReviews.length > 0 ? empReviews.reduce((a, r) => a + (r.overall_rating || 3), 0) / empReviews.length : 3
          const empGoals = goals.filter(g => g.employee_id === emp.id)
          const avgProgress = empGoals.length > 0 ? empGoals.reduce((a, g) => a + g.progress, 0) / empGoals.length : 50
          const perfCol = avgRating < 3 ? 0 : avgRating <= 4 ? 1 : 2
          const levelScore = ['Executive', 'Director', 'Principal'].some(l => (emp.level || '').includes(l)) ? 2
            : ['Senior', 'Lead'].some(l => (emp.level || '').includes(l)) ? (avgProgress > 60 ? 2 : 1)
            : avgProgress > 70 ? 1 : 0
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

      {/* 1:1 Meetings Tab */}
      {activeTab === 'one-on-ones' && (
        <div className="space-y-6">
          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <StatCard label={t('scheduledMeetings')} value={upcomingMeetings.length} icon={<Calendar size={20} />} />
            <StatCard label={t('openActionItems')} value={openActionItems.length} icon={<CheckCircle2 size={20} />} />
            <StatCard label={t('past1on1s')} value={pastMeetings.length} icon={<Clock size={20} />} />
          </div>

          {/* AI Suggested Topics for next meeting */}
          {upcomingMeetings.length > 0 && (() => {
            const nextMeeting = upcomingMeetings[0]
            const emp = employees.find(e => e.id === nextMeeting.employee_id)
            const topics = emp ? suggestOneOnOneTopics(emp, goals, feedback) : []
            if (topics.length === 0) return null
            return (
              <Card>
                <h3 className="text-sm font-semibold text-t1 mb-2">{t('suggestedTopics')} - {getEmployeeName(nextMeeting.employee_id)}</h3>
                <ul className="space-y-1">
                  {topics.map((topic, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-t2">
                      <span className="text-tempo-500 mt-0.5">*</span>
                      <span>{topic}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )
          })()}

          {/* Upcoming meetings */}
          <Card padding="none">
            <CardHeader><CardTitle>{t('upcoming1on1s')}</CardTitle></CardHeader>
            <div className="divide-y divide-divider">
              {upcomingMeetings.length === 0 && <div className="px-6 py-12 text-center text-sm text-t3">{t('noUpcoming1on1s')}</div>}
              {upcomingMeetings.map(meeting => (
                <div key={meeting.id} className="px-6 py-4 hover:bg-canvas/50 transition-colors">
                  <div className="flex items-start gap-4">
                    <Avatar name={getEmployeeName(meeting.employee_id)} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-t1">{t('meetingWith')} {getEmployeeName(meeting.employee_id)}</p>
                        <Badge variant="info">{meeting.recurring}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-t3 mb-2">
                        <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(meeting.scheduled_date).toLocaleDateString()} {new Date(meeting.scheduled_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span className="flex items-center gap-1"><Clock size={12} /> {t('meetingDuration', { minutes: meeting.duration_minutes })}</span>
                        <span className="flex items-center gap-1"><MapPin size={12} /> {meeting.location}</span>
                      </div>
                      {meeting.agenda.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-medium text-t2 mb-1">{t('agenda')}:</p>
                          <ul className="space-y-0.5">
                            {meeting.agenda.map((item, i) => (
                              <li key={i} className="text-xs text-t3 flex items-start gap-1.5">
                                <span className="text-tempo-500 mt-0.5">-</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    <Button size="sm" variant="secondary" onClick={() => updateOneOnOne(meeting.id, { status: 'completed', notes: 'Meeting completed.' })}>
                      {t('completeMeeting')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Past meetings */}
          <Card padding="none">
            <CardHeader><CardTitle>{t('past1on1s')}</CardTitle></CardHeader>
            <div className="divide-y divide-divider">
              {pastMeetings.length === 0 && <div className="px-6 py-12 text-center text-sm text-t3">{t('noPast1on1s')}</div>}
              {pastMeetings.map(meeting => (
                <div key={meeting.id} className="px-6 py-4">
                  <div className="flex items-start gap-4">
                    <Avatar name={getEmployeeName(meeting.employee_id)} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-t1">{t('meetingWith')} {getEmployeeName(meeting.employee_id)}</p>
                        <Badge variant="success">completed</Badge>
                      </div>
                      <p className="text-xs text-t3 mb-2">{new Date(meeting.scheduled_date).toLocaleDateString()}</p>
                      {meeting.notes && (
                        <div className="mb-2">
                          <p className="text-xs font-medium text-t2 mb-0.5">{t('sharedNotes')}:</p>
                          <p className="text-xs text-t3 bg-canvas rounded p-2">{meeting.notes}</p>
                        </div>
                      )}
                      {meeting.action_items.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-t2 mb-1">{t('actionItems')}:</p>
                          <ul className="space-y-1">
                            {meeting.action_items.map((item, i) => (
                              <li key={i} className={`text-xs flex items-center gap-2 ${item.done ? 'text-t3 line-through' : 'text-t1'}`}>
                                <CheckCircle2 size={12} className={item.done ? 'text-green-500' : 'text-t3'} />
                                <span>{item.text}</span>
                                <span className="text-t3">({getEmployeeName(item.assignee)})</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Recognition Tab */}
      {activeTab === 'recognition' && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label={t('totalKudos')} value={recognitions.length} icon={<Heart size={20} />} />
            <StatCard label={t('uniqueReceivers')} value={new Set(recognitions.map(r => r.to_id)).size} icon={<Users size={20} />} />
            <StatCard label={t('topValue')} value={valueBreakdown[0]?.[0] || '-'} icon={<Award size={20} />} />
            <StatCard label={t('thisMonth')} value={recognitions.filter(r => new Date(r.created_at).getMonth() === new Date().getMonth()).length} change={t('totalRecognitions')} changeType="positive" />
          </div>

          {/* AI Insights */}
          {recognitionInsights.length > 0 && (
            <div className="space-y-2">
              {recognitionInsights.map(insight => (
                <AIInsightCard key={insight.id} insight={insight} />
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Kudos Wall */}
            <div className="md:col-span-2">
              <Card padding="none">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{t('kudosWall')}</CardTitle>
                    <Button size="sm" onClick={() => setShowKudosModal(true)}><Heart size={14} /> {t('giveKudos')}</Button>
                  </div>
                </CardHeader>
                <div className="divide-y divide-divider">
                  {recognitions.length === 0 && <div className="px-6 py-12 text-center text-sm text-t3">{t('noRecognitions')}</div>}
                  {recognitions.map(rec => (
                    <div key={rec.id} className="px-6 py-4">
                      <div className="flex items-center gap-3 mb-2">
                        <Avatar name={getEmployeeName(rec.from_id)} size="sm" />
                        <div className="flex-1">
                          <span className="text-sm font-medium text-t1">{getEmployeeName(rec.from_id)}</span>
                          <span className="text-xs text-t3 mx-1">{t('recognizedFor')}</span>
                          <Badge variant={(valueColors[rec.value] || 'default') as 'info' | 'success' | 'warning' | 'orange' | 'default'}>{rec.value}</Badge>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-t3">
                          <Heart size={12} className="text-red-400" /> {rec.likes}
                        </div>
                      </div>
                      <div className="ml-11">
                        <div className="flex items-center gap-2 mb-1">
                          <Avatar name={getEmployeeName(rec.to_id)} size="xs" />
                          <span className="text-sm font-medium text-t1">{getEmployeeName(rec.to_id)}</span>
                        </div>
                        <p className="text-sm text-t2">{rec.message}</p>
                        <p className="text-xs text-t3 mt-1">{new Date(rec.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Sidebar: Leaderboard + Value Breakdown */}
            <div className="space-y-4">
              <Card>
                <h3 className="text-sm font-semibold text-t1 mb-3">{t('leaderboard')}</h3>
                <div className="space-y-3">
                  {recognitionLeaderboard.map((entry, i) => (
                    <div key={entry.id} className="flex items-center gap-3">
                      <span className="text-xs font-bold text-t3 w-4">{i + 1}</span>
                      <Avatar name={entry.name} size="sm" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-t1">{entry.name}</p>
                        <p className="text-xs text-t3">{entry.count} {t('kudosReceived')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
              <Card>
                <h3 className="text-sm font-semibold text-t1 mb-3">{t('valueBreakdown')}</h3>
                <div className="space-y-2">
                  {valueBreakdown.map(([value, count]) => (
                    <div key={value} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant={(valueColors[value] || 'default') as 'info' | 'success' | 'warning' | 'orange' | 'default'}>{value}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-24">
                          <Progress value={Math.round((count / recognitions.length) * 100)} />
                        </div>
                        <span className="text-xs text-t3 w-6 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* Competencies Tab */}
      {activeTab === 'competencies' && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label={t('avgRatingLabel')} value={competencyStats.avgRating > 0 ? competencyStats.avgRating.toFixed(1) : '-'} change={t('outOf5')} changeType="neutral" />
            <StatCard label={t('employeesAssessed')} value={competencyStats.assessedEmployees} icon={<Users size={20} />} />
            <StatCard label={t('gapsIdentified')} value={competencyStats.gaps} changeType="negative" />
            <StatCard label={t('strengthsIdentified')} value={competencyStats.strengths} changeType="positive" />
          </div>

          {/* AI Gap Analysis Insights */}
          {competencyGapInsights.length > 0 && (
            <div className="space-y-2">
              {competencyGapInsights.map(insight => (
                <AIInsightCard key={insight.id} insight={insight} />
              ))}
            </div>
          )}

          {/* Employee filter */}
          <div className="flex items-center gap-4">
            <Select label={t('selectEmployeeFilter')} value={compEmployeeFilter} onChange={(e) => setCompEmployeeFilter(e.target.value)} options={[{ value: '', label: t('allEmployees') }, ...employees.map(e => ({ value: e.id, label: e.profile?.full_name || '' }))]} />
          </div>

          {/* Competency Matrix */}
          <Card padding="none">
            <CardHeader><CardTitle>{t('competencyMatrix')}</CardTitle></CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-divider bg-canvas">
                    <th className="tempo-th text-left px-6 py-3">{t('tableEmployee')}</th>
                    {competencyFramework.map(comp => (
                      <th key={comp.id} className="tempo-th text-center px-3 py-3">
                        <span className="text-[0.65rem]">{comp.name}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {(() => {
                    const employeeIds = [...new Set(filteredRatings.map(r => r.employee_id))]
                    return employeeIds.map(empId => (
                      <tr key={empId} className="hover:bg-canvas/50">
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-2">
                            <Avatar name={getEmployeeName(empId)} size="sm" />
                            <span className="text-sm text-t1">{getEmployeeName(empId)}</span>
                          </div>
                        </td>
                        {competencyFramework.map(comp => {
                          const rating = filteredRatings.find(r => r.employee_id === empId && r.competency_id === comp.id)
                          if (!rating) return <td key={comp.id} className="px-3 py-3 text-center text-xs text-t3">-</td>
                          const gap = rating.rating - rating.target
                          const bgColor = gap > 0 ? 'bg-green-50' : gap < 0 ? 'bg-red-50' : 'bg-gray-50'
                          const textColor = gap > 0 ? 'text-green-700' : gap < 0 ? 'text-red-700' : 'text-gray-700'
                          return (
                            <td key={comp.id} className="px-3 py-3 text-center">
                              <div className={`inline-flex flex-col items-center rounded-lg px-2 py-1 ${bgColor}`}>
                                <span className={`text-sm font-semibold ${textColor}`}>{rating.rating}</span>
                                <span className="text-[0.6rem] text-t3">{t('target')}: {rating.target}</span>
                              </div>
                            </td>
                          )
                        })}
                      </tr>
                    ))
                  })()}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Competency Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {competencyFramework.map(comp => {
              const ratings = competencyRatings.filter(r => r.competency_id === comp.id)
              const avg = ratings.length > 0 ? ratings.reduce((a, r) => a + r.rating, 0) / ratings.length : 0
              const gapCount = ratings.filter(r => r.rating < r.target).length
              return (
                <Card key={comp.id}>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-t1">{comp.name}</h4>
                    <Badge variant={comp.category === 'leadership' ? 'warning' : 'info'}>{comp.category}</Badge>
                  </div>
                  <p className="text-xs text-t3 mb-3">{comp.description}</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="tempo-stat text-xl text-tempo-600">{avg > 0 ? avg.toFixed(1) : '-'}</span>
                      <span className="text-xs text-t3 ml-1">/ 5</span>
                    </div>
                    {gapCount > 0 && (
                      <Badge variant="error">{gapCount} {t('gap')}{gapCount > 1 ? 's' : ''}</Badge>
                    )}
                  </div>
                  <div className="mt-2">
                    <Progress value={avg * 20} />
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* ---- CAREER PATHS TAB ---- */}
      {activeTab === 'career-paths' && (
        <div className="space-y-6">
          {/* Track selector */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {careerTracks.map(track => {
              const IconMap: Record<string, typeof Code> = { Code, Users, Lightbulb, Settings }
              const TrackIcon = IconMap[track.icon] || Code
              return (
                <Card
                  key={track.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${selectedCareerTrack === track.id ? 'ring-2 ring-tempo-500' : ''}`}
                  onClick={() => setSelectedCareerTrack(selectedCareerTrack === track.id ? '' : track.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${selectedCareerTrack === track.id ? 'bg-tempo-100 text-tempo-600' : 'bg-surface-secondary text-t3'}`}>
                      <TrackIcon size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-t1">{track.name}</h3>
                      <p className="text-xs text-t3">{track.levels.length} {t('levelRequirements').toLowerCase()}</p>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>

          {!selectedCareerTrack && !careerEmployeeId && (
            <Card>
              <div className="text-center py-12 text-t3">
                <TrendingUp size={48} className="mx-auto mb-4 opacity-40" />
                <p className="text-sm">{t('selectTrack')}</p>
              </div>
            </Card>
          )}

          {/* Career Ladder Visualization */}
          {selectedCareerTrack && (() => {
            const track = careerTracks.find(t => t.id === selectedCareerTrack)
            if (!track) return null
            return (
              <Card>
                <CardHeader>
                  <CardTitle>{track.name} — {t('levelRequirements')}</CardTitle>
                </CardHeader>
                <div className="space-y-4">
                  {track.levels.map((lvl, idx) => (
                    <div key={lvl.level} className="relative">
                      {idx < track.levels.length - 1 && (
                        <div className="absolute left-5 top-12 w-px h-full bg-divider" />
                      )}
                      <div className="flex gap-4 items-start">
                        <div className="w-10 h-10 rounded-full bg-tempo-50 text-tempo-600 flex items-center justify-center shrink-0 font-bold text-sm border-2 border-tempo-200 z-10">
                          L{lvl.level}
                        </div>
                        <div className="flex-1 p-4 rounded-lg bg-surface-secondary border border-divider">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-sm text-t1">{lvl.title}</h4>
                            <div className="flex gap-2">
                              <Badge variant="default">{lvl.min_experience}</Badge>
                              <Badge variant="info">{lvl.salary_range}</Badge>
                            </div>
                          </div>
                          <div className="mb-2">
                            <span className="text-xs font-medium text-t2">{t('requiredSkills')}:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {lvl.skills.map(s => (
                                <Badge key={s} variant="default">{s}</Badge>
                              ))}
                            </div>
                          </div>
                          <div>
                            <span className="text-xs font-medium text-t2">{t('requiredCompetencies')}:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {Object.entries(lvl.competencies).map(([compId, req]) => {
                                const comp = competencyFramework.find(c => c.id === compId)
                                return (
                                  <Badge key={compId} variant="warning">
                                    {comp?.name || compId}: {req as number}/5
                                  </Badge>
                                )
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )
          })()}

          {/* Employee Career View */}
          <Card>
            <CardHeader>
              <CardTitle>{t('employeeCareerView')}</CardTitle>
            </CardHeader>
            <Select
              label=""
              value={careerEmployeeId}
              onChange={(e) => setCareerEmployeeId(e.target.value)}
              options={[{ value: '', label: t('selectEmployeeCareer') }, ...employees.map(e => ({ value: e.id, label: e.profile?.full_name || e.id }))]}
            />

            {careerEmployeeId && (() => {
              const emp = employees.find(e => e.id === careerEmployeeId)
              if (!emp) return null
              const analysis = analyzeCareerPathDetailed(emp, goals, competencyRatings, careerTracks, competencyFramework)
              return (
                <div className="mt-4 space-y-4">
                  {/* Summary stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 rounded-lg bg-surface-secondary text-center">
                      <p className="text-xs text-t3 mb-1">{t('careerTracks')}</p>
                      <p className="text-lg font-bold text-tempo-600">{analysis.suggestedTrack}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-surface-secondary text-center">
                      <p className="text-xs text-t3 mb-1">{t('currentLevel')}</p>
                      <p className="text-lg font-bold text-t1">L{analysis.currentLevel}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-surface-secondary text-center">
                      <p className="text-xs text-t3 mb-1">{t('nextRole')}</p>
                      <p className="text-lg font-bold text-t1">{analysis.nextRole}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-surface-secondary text-center">
                      <p className="text-xs text-t3 mb-1">{t('readiness')}</p>
                      <p className={`text-lg font-bold ${analysis.readiness >= 80 ? 'text-green-600' : analysis.readiness >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>{analysis.readiness}%</p>
                    </div>
                  </div>

                  {/* Readiness bar */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-t1">{t('readiness')}</span>
                      <span className="text-sm text-t3">{analysis.readiness}%</span>
                    </div>
                    <Progress value={analysis.readiness} />
                  </div>

                  {/* Gap Analysis */}
                  {analysis.gaps.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-t1 mb-3 flex items-center gap-2">
                        <BarChart3 size={16} /> {t('gapAnalysis')}
                      </h4>
                      <div className="space-y-3">
                        {analysis.gaps.map((gap, i) => (
                          <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-surface-secondary">
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium text-t1">{gap.competency}</span>
                                <Badge variant="error">-{gap.gap}</Badge>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-t3">{t('currentRating')}: {gap.current}</span>
                                <ArrowRight size={12} className="text-t3" />
                                <span className="text-xs text-t3">{t('requiredRating')}: {gap.required}</span>
                              </div>
                              <div className="mt-2 flex gap-1">
                                {Array.from({ length: 5 }).map((_, si) => (
                                  <div
                                    key={si}
                                    className={`h-2 flex-1 rounded ${si < gap.current ? 'bg-tempo-500' : si < gap.required ? 'bg-red-300' : 'bg-gray-200'}`}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {analysis.gaps.length === 0 && (
                    <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50 border border-green-200">
                      <CheckCircle2 size={20} className="text-green-600" />
                      <p className="text-sm text-green-700">{t('readiness')}: 100% — {emp.profile?.full_name} {tc('status')}</p>
                    </div>
                  )}

                  {/* Development Plan */}
                  {analysis.developmentPlan.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-t1 mb-3 flex items-center gap-2">
                        <Lightbulb size={16} /> {t('developmentPlan')}
                      </h4>
                      <div className="space-y-2">
                        {analysis.developmentPlan.map((item, i) => (
                          <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-surface-secondary">
                            <div className="w-6 h-6 rounded-full bg-tempo-100 text-tempo-600 flex items-center justify-center shrink-0 text-xs font-bold">
                              {i + 1}
                            </div>
                            <p className="text-sm text-t2">{item}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })()}
          </Card>
        </div>
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

      {/* Schedule 1:1 Meeting */}
      <Modal open={show1on1Modal} onClose={() => setShow1on1Modal(false)} title={t('schedule1on1Modal')}>
        <div className="space-y-4">
          <Select label={t('selectEmployee')} value={ooForm.employee_id} onChange={(e) => setOoForm({ ...ooForm, employee_id: e.target.value })} options={employees.map(e => ({ value: e.id, label: e.profile?.full_name || '' }))} />
          <Input label={t('meetingDate')} type="datetime-local" value={ooForm.scheduled_date} onChange={(e) => setOoForm({ ...ooForm, scheduled_date: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('durationMinutes')} type="number" min={15} max={120} value={ooForm.duration_minutes} onChange={(e) => setOoForm({ ...ooForm, duration_minutes: Number(e.target.value) })} />
            <Select label={t('recurringFrequency')} value={ooForm.recurring} onChange={(e) => setOoForm({ ...ooForm, recurring: e.target.value })} options={[
              { value: 'weekly', label: t('frequencyWeekly') },
              { value: 'biweekly', label: t('frequencyBiweekly') },
              { value: 'monthly', label: t('frequencyMonthly') },
              { value: 'none', label: t('frequencyNone') },
            ]} />
          </div>
          <Input label={t('meetingLocation')} placeholder={t('locationPlaceholder')} value={ooForm.location} onChange={(e) => setOoForm({ ...ooForm, location: e.target.value })} />
          <div>
            <label className="block text-sm font-medium text-t1 mb-1">{t('agendaItems')}</label>
            {ooForm.agenda.length > 0 && (
              <ul className="space-y-1 mb-2">
                {ooForm.agenda.map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-t2">
                    <span>- {item}</span>
                    <button className="text-xs text-t3 hover:text-error" onClick={() => setOoForm({ ...ooForm, agenda: ooForm.agenda.filter((_, j) => j !== i) })}>x</button>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex gap-2">
              <Input placeholder={t('agendaPlaceholder')} value={newAgendaItem} onChange={(e) => setNewAgendaItem(e.target.value)} />
              <Button size="sm" variant="secondary" onClick={() => { if (newAgendaItem.trim()) { setOoForm({ ...ooForm, agenda: [...ooForm.agenda, newAgendaItem.trim()] }); setNewAgendaItem('') } }}>
                {t('addAgendaItem')}
              </Button>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShow1on1Modal(false)}>{tc('cancel')}</Button>
            <Button onClick={submit1on1}>{t('create1on1')}</Button>
          </div>
        </div>
      </Modal>

      {/* Give Kudos */}
      <Modal open={showKudosModal} onClose={() => setShowKudosModal(false)} title={t('giveKudosModal')}>
        <div className="space-y-4">
          <Select label={t('kudosTo')} value={kudosForm.to_id} onChange={(e) => setKudosForm({ ...kudosForm, to_id: e.target.value })} options={employees.map(e => ({ value: e.id, label: e.profile?.full_name || '' }))} />
          <Select label={t('kudosValue')} value={kudosForm.value} onChange={(e) => setKudosForm({ ...kudosForm, value: e.target.value })} options={[
            { value: 'Innovation', label: t('valueInnovation') },
            { value: 'Teamwork', label: t('valueTeamwork') },
            { value: 'Integrity', label: t('valueIntegrity') },
            { value: 'Excellence', label: t('valueExcellence') },
            { value: 'Customer Focus', label: t('valueCustomerFocus') },
          ]} />
          <Textarea label={t('kudosMessage')} placeholder={t('kudosMessagePlaceholder')} rows={4} value={kudosForm.message} onChange={(e) => setKudosForm({ ...kudosForm, message: e.target.value })} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowKudosModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitKudos}>{t('sendKudos')}</Button>
          </div>
        </div>
      </Modal>

      {/* Rate Competency */}
      <Modal open={showCompRatingModal} onClose={() => setShowCompRatingModal(false)} title={t('rateCompetencyModal')}>
        <div className="space-y-4">
          <Select label={tc('employee')} value={compRatingForm.employee_id} onChange={(e) => setCompRatingForm({ ...compRatingForm, employee_id: e.target.value })} options={employees.map(e => ({ value: e.id, label: e.profile?.full_name || '' }))} />
          <Select label={t('selectCompetency')} value={compRatingForm.competency_id} onChange={(e) => setCompRatingForm({ ...compRatingForm, competency_id: e.target.value })} options={competencyFramework.map(c => ({ value: c.id, label: c.name }))} />
          <div className="grid grid-cols-2 gap-4">
            <Select label={t('ratingValue')} value={String(compRatingForm.rating)} onChange={(e) => setCompRatingForm({ ...compRatingForm, rating: Number(e.target.value) })} options={[
              { value: '1', label: '1 - Foundational' },
              { value: '2', label: '2 - Developing' },
              { value: '3', label: '3 - Proficient' },
              { value: '4', label: '4 - Advanced' },
              { value: '5', label: '5 - Mastery' },
            ]} />
            <Select label={t('targetValue')} value={String(compRatingForm.target)} onChange={(e) => setCompRatingForm({ ...compRatingForm, target: Number(e.target.value) })} options={[
              { value: '1', label: '1 - Foundational' },
              { value: '2', label: '2 - Developing' },
              { value: '3', label: '3 - Proficient' },
              { value: '4', label: '4 - Advanced' },
              { value: '5', label: '5 - Mastery' },
            ]} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowCompRatingModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitCompRating}>{t('submitRating')}</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
