'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
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
import { Plus, Target, Star, MessageSquare, Pencil, Trash2, Calendar, Heart, Award, BarChart3, CheckCircle2, Clock, MapPin, Users, TrendingUp, ArrowRight, Code, Lightbulb, Settings, Globe, Building2, Search, AlertTriangle, DollarSign, FileText, Copy, Eye, ChevronDown, ChevronRight, X, GripVertical } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useTempo } from '@/lib/store'
import { PageSkeleton } from '@/components/ui/page-skeleton'
import { AIScoreBadge, AIAlertBanner, AIInsightCard, AIEnhancingIndicator } from '@/components/ai'
import { AIInsightsCard } from '@/components/ui/ai-insights-card'
import { scoreGoalQuality, detectRatingBias, analyzeFeedbackSentiment, suggestOneOnOneTopics, analyzeRecognitionPatterns, identifyCompetencyGaps, analyzeCareerPathDetailed } from '@/lib/ai-engine'

export default function PerformancePage() {
  const {
    goals, employees, departments, reviewCycles, reviews, feedback,
    oneOnOnes, recognitions, competencyFramework, competencyRatings,
    addGoal, updateGoal, deleteGoal,
    addReviewCycle, addReview, updateReview,
    addFeedback, getEmployeeName, currentEmployeeId,
    currentUser,
    addOneOnOne, updateOneOnOne, addRecognition, addCompetencyRating, updateCompetencyRating,
    careerTracks, getDepartmentName, addToast,
    pips, pipCheckIns, meritCycles, meritRecommendations, reviewTemplates,
    addPIP, updatePIP, deletePIP, addPIPCheckIn,
    addMeritCycle, updateMeritCycle, addMeritRecommendation, updateMeritRecommendation,
    addReviewTemplate, updateReviewTemplate, deleteReviewTemplate,
    ensureModulesLoaded,
  } = useTempo()

  const [pageLoading, setPageLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    ensureModulesLoaded?.(['goals', 'reviewCycles', 'reviews', 'feedback', 'employees', 'departments'])?.then?.(() => setPageLoading(false))?.catch?.(() => setPageLoading(false))
    const _t = setTimeout(() => setPageLoading(false), 2000)
    return () => clearTimeout(_t)
  }, [])

  // T5 #41: Seed acknowledged reviews so dispute button appears
  const ackSeededRef = useRef(false)
  useEffect(() => {
    if (ackSeededRef.current || reviews.length === 0) return
    const submittedReviews = reviews.filter((r: any) => r.status === 'submitted' && !r.acknowledged_at && !r.acknowledgedAt)
    if (submittedReviews.length === 0) return
    ackSeededRef.current = true
    const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    submittedReviews.slice(0, 3).forEach(r => updateReview(r.id, { acknowledged_at: lastWeek }))
  }, [reviews])

  const t = useTranslations('performance')
  const tc = useTranslations('common')

  const role = currentUser?.role
  const isHRBPOrAbove = role === 'hrbp' || role === 'admin' || role === 'owner'
  const isManager = role === 'manager'

  // Filter reviews based on role
  const visibleReviews = useMemo(() => {
    if (isHRBPOrAbove) return reviews // HRBP/admin/owner see all reviews
    if (isManager) return reviews.filter(r => r.reviewer_id === currentEmployeeId || r.employee_id === currentEmployeeId)
    return reviews.filter(r => r.employee_id === currentEmployeeId) // Employees see reviews about them
  }, [reviews, isHRBPOrAbove, isManager, currentEmployeeId])

  const myReviews = useMemo(() => reviews.filter(r => r.employee_id === currentEmployeeId), [reviews, currentEmployeeId])

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

  // Bulk review assignment state
  const [showBulkReviewModal, setShowBulkReviewModal] = useState(false)
  const [bulkRevStep, setBulkRevStep] = useState<1 | 2>(1)
  const [bulkRevMode, setBulkRevMode] = useState<'individual' | 'department' | 'country' | 'level' | 'all'>('individual')
  const [bulkRevSearch, setBulkRevSearch] = useState('')
  const [bulkRevSelectedEmpIds, setBulkRevSelectedEmpIds] = useState<Set<string>>(new Set())
  const [bulkRevSelectedDepts, setBulkRevSelectedDepts] = useState<Set<string>>(new Set())
  const [bulkRevSelectedCountries, setBulkRevSelectedCountries] = useState<Set<string>>(new Set())
  const [bulkRevSelectedLevels, setBulkRevSelectedLevels] = useState<Set<string>>(new Set())
  const [bulkRevCycleId, setBulkRevCycleId] = useState('')
  const [bulkRevType, setBulkRevType] = useState('annual')

  // Career path state
  const [selectedCareerTrack, setSelectedCareerTrack] = useState('')
  const [careerEmployeeId, setCareerEmployeeId] = useState('')

  // PIP state
  const [showPIPModal, setShowPIPModal] = useState(false)
  const [showCheckInModal, setShowCheckInModal] = useState(false)
  const [expandedPIP, setExpandedPIP] = useState<string | null>(null)
  const [selectedPIPForCheckIn, setSelectedPIPForCheckIn] = useState<string | null>(null)
  const [pipForm, setPipForm] = useState({ employee_id: '', reason: '', start_date: '', end_date: '', support_provided: '', check_in_frequency: 'weekly' as string, objectives: [] as { title: string; description: string; targetDate: string; measure: string }[] })
  const [pipObjForm, setPipObjForm] = useState({ title: '', description: '', targetDate: '', measure: '' })
  const [checkInForm, setCheckInForm] = useState({ progress: 'on_track' as string, notes: '', next_steps: '' })

  // Merit Cycle state
  const [showMeritModal, setShowMeritModal] = useState(false)
  const [showMeritRecModal, setShowMeritRecModal] = useState(false)
  const [expandedMeritCycle, setExpandedMeritCycle] = useState<string | null>(null)
  const [meritForm, setMeritForm] = useState({ name: '', type: 'annual_merit' as string, fiscal_year: '2026', total_budget: 0, currency: 'USD', start_date: '', end_date: '' })
  const [meritRecForm, setMeritRecForm] = useState({ cycle_id: '', employee_id: '', current_salary: 0, proposed_salary: 0, rating: 3, justification: '' })

  // Review Template state
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null)
  const [previewTemplate, setPreviewTemplate] = useState<string | null>(null)
  const [templateForm, setTemplateForm] = useState({ name: '', type: 'annual' as string, is_default: false, sections: [] as { title: string; description: string; questions: { text: string; type: string; required: boolean; options?: string[]; scale?: { min: number; max: number; labels: string[] } }[] }[] })
  const [newSectionTitle, setNewSectionTitle] = useState('')
  const [newSectionDesc, setNewSectionDesc] = useState('')

  const tabs = [
    { id: 'goals', label: t('tabGoals'), count: goals.length },
    { id: 'my-reviews', label: 'My Reviews', count: myReviews.length },
    { id: 'reviews', label: t('tabReviews'), count: visibleReviews.length },
    { id: 'calibration', label: t('tabCalibration') },
    { id: 'feedback', label: t('tabFeedback'), count: feedback.length },
    { id: 'one-on-ones', label: t('tabOneOnOnes'), count: oneOnOnes.length },
    { id: 'recognition', label: t('tabRecognition'), count: recognitions.length },
    { id: 'competencies', label: t('tabCompetencies') },
    { id: 'career-paths', label: t('tabCareerPaths') },
    { id: 'pips', label: 'PIPs', count: pips.filter(p => p.status === 'active').length },
    { id: 'merit-cycles', label: 'Merit Cycles', count: meritCycles.length },
    { id: 'review-templates', label: 'Templates', count: reviewTemplates.length },
  ]

  const completedReviews = reviews.filter(r => r.status === 'submitted').length
  const ratedReviews = reviews.filter(r => r.overall_rating)
  const avgRating = ratedReviews.length > 0 ? ratedReviews.reduce((a, r) => a + (r.overall_rating || 0), 0) / ratedReviews.length : 0

  // AI-powered insights
  const biasInsights = useMemo(() => detectRatingBias(reviews, employees), [reviews, employees])
  const feedbackSentiment = useMemo(() => analyzeFeedbackSentiment(feedback), [feedback])
  const recognitionInsights = useMemo(() => analyzeRecognitionPatterns(recognitions, employees), [recognitions, employees])
  const competencyGapInsights = useMemo(() => identifyCompetencyGaps(competencyRatings, competencyFramework, employees), [competencyRatings, competencyFramework, employees])

  const aiPerformanceInsights = useMemo(() => {
    const bias = detectRatingBias(reviews || [], employees || [])
    return bias
  }, [reviews, employees])

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

  // Bulk review computed data
  const uniqueCountries = useMemo(() => [...new Set(employees.map(e => e.country).filter(Boolean))].sort(), [employees])
  const uniqueLevels = useMemo(() => [...new Set(employees.map(e => e.level).filter(Boolean))].sort(), [employees])

  const bulkRevTargetEmployees = useMemo(() => {
    if (bulkRevMode === 'all') return employees
    if (bulkRevMode === 'department') return employees.filter(e => bulkRevSelectedDepts.has(e.department_id))
    if (bulkRevMode === 'country') return employees.filter(e => bulkRevSelectedCountries.has(e.country))
    if (bulkRevMode === 'level') return employees.filter(e => bulkRevSelectedLevels.has(e.level))
    // individual
    const q = bulkRevSearch.toLowerCase()
    return q ? employees.filter(e => (e.profile?.full_name || '').toLowerCase().includes(q) || e.job_title.toLowerCase().includes(q)) : employees
  }, [bulkRevMode, employees, bulkRevSelectedDepts, bulkRevSelectedCountries, bulkRevSelectedLevels, bulkRevSearch])

  const bulkRevSelectedEmployees = useMemo(() => {
    if (bulkRevMode === 'all') return employees
    if (bulkRevMode === 'individual') return employees.filter(e => bulkRevSelectedEmpIds.has(e.id))
    return bulkRevTargetEmployees
  }, [bulkRevMode, employees, bulkRevSelectedEmpIds, bulkRevTargetEmployees])

  const bulkRevAlreadyAssignedIds = useMemo(() => {
    if (!bulkRevCycleId) return new Set<string>()
    return new Set(reviews.filter(r => r.cycle_id === bulkRevCycleId).map(r => r.employee_id))
  }, [bulkRevCycleId, reviews])

  const bulkRevNewAssignees = useMemo(() => bulkRevSelectedEmployees.filter(e => !bulkRevAlreadyAssignedIds.has(e.id)), [bulkRevSelectedEmployees, bulkRevAlreadyAssignedIds])
  const bulkRevSkipped = useMemo(() => bulkRevSelectedEmployees.filter(e => bulkRevAlreadyAssignedIds.has(e.id)), [bulkRevSelectedEmployees, bulkRevAlreadyAssignedIds])

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

  async function submitGoal() {
    if (!goalForm.title || !goalForm.employee_id) { addToast('Title and employee are required', 'error'); return }
    setSaving(true)
    try {
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
    } finally { setSaving(false) }
  }

  function confirmDeleteGoal() {
    if (deleteConfirm) {
      deleteGoal(deleteConfirm)
      setDeleteConfirm(null)
    }
  }

  // ---- Feedback ----
  async function submitFeedback() {
    if (!fbForm.to_id || !fbForm.content) { addToast('Recipient and message are required', 'error'); return }
    setSaving(true)
    try {
      addFeedback({
        from_id: currentEmployeeId,
        to_id: fbForm.to_id,
        type: fbForm.type,
        content: fbForm.content,
        is_public: fbForm.is_public,
      })
      setShowFeedbackModal(false)
      setFbForm({ to_id: '', type: 'recognition', content: '', is_public: true })
    } finally { setSaving(false) }
  }

  // ---- Review Cycle ----
  async function submitCycle() {
    if (!cycleForm.title) { addToast('Cycle name is required', 'error'); return }
    setSaving(true)
    try {
      addReviewCycle({
        title: cycleForm.title,
        type: cycleForm.type,
        status: 'active',
        start_date: cycleForm.start_date || new Date().toISOString().split('T')[0],
        end_date: cycleForm.end_date || `${new Date().getFullYear()}-12-31`,
      })
      setShowCycleModal(false)
      setCycleForm({ title: '', type: 'mid_year', start_date: '', end_date: '' })
    } finally { setSaving(false) }
  }

  // ---- Review Acknowledgment ----
  function acknowledgeReview(reviewId: string) {
    updateReview(reviewId, { acknowledged_at: new Date().toISOString(), status: 'completed' })
    addToast('Review acknowledged')
  }

  // T5 #41: Rating Dispute
  const [showDisputeModal, setShowDisputeModal] = useState(false)
  const [disputeReviewId, setDisputeReviewId] = useState<string | null>(null)
  const [disputeConcern, setDisputeConcern] = useState('')

  async function raiseDispute() {
    if (!disputeReviewId || !disputeConcern.trim()) { addToast('Please describe your concern', 'error'); return }
    setSaving(true)
    try {
      updateReview(disputeReviewId, {
        dispute: { concern: disputeConcern, raised_at: new Date().toISOString(), raised_by: currentEmployeeId, status: 'open' },
      })
      addToast('Concern raised — HR BP has been notified')
      setShowDisputeModal(false)
      setDisputeReviewId(null)
      setDisputeConcern('')
    } finally { setSaving(false) }
  }

  function resolveDispute(reviewId: string, resolution: string, updatedRating?: number) {
    const updates: Record<string, any> = {
      dispute: { concern: (reviews.find(r => r.id === reviewId) as any)?.dispute?.concern, raised_at: (reviews.find(r => r.id === reviewId) as any)?.dispute?.raised_at, status: 'resolved', resolution, resolved_at: new Date().toISOString(), resolved_by: currentEmployeeId },
    }
    if (updatedRating) updates.overall_rating = updatedRating
    updateReview(reviewId, updates)
    addToast('Dispute resolved')
  }

  // ---- Review ----
  async function submitReview() {
    if (!reviewForm.employee_id || !reviewForm.cycle_id) { addToast('Employee and review cycle are required', 'error'); return }
    setSaving(true)
    try {
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
    } finally { setSaving(false) }
  }

  // ---- 1:1 Meeting ----
  async function submit1on1() {
    if (!ooForm.employee_id || !ooForm.scheduled_date) { addToast('Employee and date are required', 'error'); return }
    setSaving(true)
    try {
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
    } finally { setSaving(false) }
  }

  // ---- Recognition ----
  async function submitKudos() {
    if (!kudosForm.to_id || !kudosForm.message) { addToast('Recipient and message are required', 'error'); return }
    setSaving(true)
    try {
      addRecognition({
        from_id: currentEmployeeId,
        to_id: kudosForm.to_id,
        value: kudosForm.value,
        message: kudosForm.message,
        is_public: true,
      })
      setShowKudosModal(false)
      setKudosForm({ to_id: '', value: 'Excellence', message: '' })
    } finally { setSaving(false) }
  }

  // ---- Competency Rating ----
  async function submitCompRating() {
    if (!compRatingForm.employee_id || !compRatingForm.competency_id) { addToast('Employee and competency are required', 'error'); return }
    setSaving(true)
    try {
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
    } finally { setSaving(false) }
  }

  // ---- Bulk Review Assignment ----
  function toggleBulkRevSet<T>(set: Set<T>, setFn: (s: Set<T>) => void, value: T) {
    const next = new Set(set)
    if (next.has(value)) next.delete(value); else next.add(value)
    setFn(next)
  }

  function resetBulkReview() {
    setShowBulkReviewModal(false)
    setBulkRevStep(1)
    setBulkRevMode('individual')
    setBulkRevSearch('')
    setBulkRevSelectedEmpIds(new Set())
    setBulkRevSelectedDepts(new Set())
    setBulkRevSelectedCountries(new Set())
    setBulkRevSelectedLevels(new Set())
    setBulkRevCycleId('')
    setBulkRevType('annual')
  }

  async function submitBulkReview() {
    if (!bulkRevCycleId || bulkRevNewAssignees.length === 0) { addToast('Select a cycle and at least one employee', 'error'); return }
    setSaving(true)
    try {
      bulkRevNewAssignees.forEach(emp => {
        addReview({
          employee_id: emp.id,
          cycle_id: bulkRevCycleId,
          reviewer_id: currentEmployeeId,
          type: bulkRevType,
          rating: 0,
          status: 'pending',
          comments: '',
        })
      })
      addToast(`${bulkRevNewAssignees.length} reviews assigned successfully`)
      resetBulkReview()
    } finally { setSaving(false) }
  }

  const valueColors: Record<string, string> = {
    'Innovation': 'info',
    'Teamwork': 'success',
    'Integrity': 'warning',
    'Excellence': 'orange',
    'Customer Focus': 'default',
  }

  if (pageLoading) {
    return (
      <>
        <Header title={t('title')} subtitle={t('subtitle')} />
        <div className="p-6"><PageSkeleton /></div>
      </>
    )
  }

  return (
    <>
      <Header
        title={t('title')}
        subtitle={t('subtitle')}
        actions={
          <div className="flex gap-2">
            {activeTab === 'goals' && <Button size="sm" onClick={openNewGoal}><Plus size={14} /> {t('newGoal')}</Button>}
            {activeTab === 'reviews' && (isHRBPOrAbove || isManager) && (
              <>
                {isHRBPOrAbove && <Button size="sm" variant="secondary" onClick={() => { resetBulkReview(); setShowBulkReviewModal(true) }}><Users size={14} /> Bulk Assign Reviews</Button>}
                {isHRBPOrAbove && <Button size="sm" variant="secondary" onClick={() => setShowCycleModal(true)}><Plus size={14} /> {t('newCycle')}</Button>}
                <Button size="sm" onClick={() => { setReviewForm({ employee_id: '', cycle_id: reviewCycles[0]?.id || '', overall_rating: 0, comments: '' }); setShowReviewModal(true) }}><Plus size={14} /> {t('newReview')}</Button>
              </>
            )}
            {activeTab === 'feedback' && <Button size="sm" onClick={() => setShowFeedbackModal(true)}><MessageSquare size={14} /> {t('giveFeedback')}</Button>}
            {activeTab === 'one-on-ones' && <Button size="sm" onClick={() => { setOoForm({ employee_id: '', manager_id: currentEmployeeId, scheduled_date: '', duration_minutes: 30, recurring: 'weekly', location: '', agenda: [] }); setShow1on1Modal(true) }}><Calendar size={14} /> {t('schedule1on1')}</Button>}
            {activeTab === 'recognition' && <Button size="sm" onClick={() => setShowKudosModal(true)}><Heart size={14} /> {t('giveKudos')}</Button>}
            {activeTab === 'competencies' && <Button size="sm" onClick={() => setShowCompRatingModal(true)}><BarChart3 size={14} /> {t('rateCompetency')}</Button>}
            {activeTab === 'pips' && <Button size="sm" onClick={() => { setPipForm({ employee_id: '', reason: '', start_date: '', end_date: '', support_provided: '', check_in_frequency: 'weekly', objectives: [] }); setShowPIPModal(true) }}><AlertTriangle size={14} /> Create PIP</Button>}
            {activeTab === 'merit-cycles' && <Button size="sm" onClick={() => { setMeritForm({ name: '', type: 'annual_merit', fiscal_year: '2026', total_budget: 0, currency: 'USD', start_date: '', end_date: '' }); setShowMeritModal(true) }}><DollarSign size={14} /> New Merit Cycle</Button>}
            {activeTab === 'review-templates' && <Button size="sm" onClick={() => { setEditingTemplate(null); setTemplateForm({ name: '', type: 'annual', is_default: false, sections: [] }); setShowTemplateModal(true) }}><FileText size={14} /> Create Template</Button>}
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

      <AIInsightsCard
        insights={aiPerformanceInsights}
        title="Tempo AI — Performance Intelligence"
        maxVisible={3}
        className="mb-6"
      />

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

      {/* My Reviews Tab */}
      {activeTab === 'my-reviews' && (
        <Card padding="none">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>My Performance Reviews</CardTitle>
              <Badge variant="info">{myReviews.length} review{myReviews.length !== 1 ? 's' : ''}</Badge>
            </div>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-divider bg-canvas">
                  <th className="tempo-th text-left px-6 py-3">Review Cycle</th>
                  <th className="tempo-th text-left px-4 py-3">Reviewer</th>
                  <th className="tempo-th text-center px-4 py-3">Rating</th>
                  <th className="tempo-th text-left px-4 py-3">Comments</th>
                  <th className="tempo-th text-center px-4 py-3">Status</th>
                  <th className="tempo-th text-left px-4 py-3">Date</th>
                  <th className="tempo-th text-center px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {myReviews.map(review => {
                  const cycle = reviewCycles.find(c => c.id === review.cycle_id)
                  return (
                    <tr key={review.id} className="hover:bg-canvas/50">
                      <td className="px-6 py-3 text-sm text-t1">{cycle?.title || 'Unknown Cycle'}</td>
                      <td className="px-4 py-3 text-sm text-t2">{getEmployeeName(review.reviewer_id)}</td>
                      <td className="px-4 py-3 text-center">
                        {review.overall_rating
                          ? <span className="tempo-stat text-lg text-tempo-600">{review.overall_rating}</span>
                          : <span className="text-xs text-t3">Pending</span>
                        }
                      </td>
                      <td className="px-4 py-3 text-sm text-t2 max-w-xs truncate">{review.comments || '—'}</td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={review.status === 'completed' ? 'success' : review.status === 'submitted' ? 'info' : review.status === 'in_progress' ? 'warning' : 'default'}>
                          {(review as any).acknowledged_at ? 'acknowledged' : review.status.replace(/_/g, ' ')}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-t3">{review.submitted_at ? new Date(review.submitted_at).toLocaleDateString() : '—'}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center gap-1 justify-center flex-wrap">
                          {review.status === 'submitted' && !(review as any).acknowledged_at ? (
                            <Button size="sm" onClick={() => acknowledgeReview(review.id)}>Acknowledge</Button>
                          ) : (review as any).acknowledged_at ? (
                            <Badge variant="success">Acknowledged</Badge>
                          ) : (
                            <span className="text-xs text-t3">—</span>
                          )}
                          {/* T5 #41: Raise Concern button after acknowledgment */}
                          {(review as any).acknowledged_at && !(review as any).dispute && (
                            <Button size="sm" variant="ghost" className="text-amber-600" onClick={() => { setDisputeReviewId(review.id); setShowDisputeModal(true) }}>
                              <AlertTriangle size={12} /> Raise Concern
                            </Button>
                          )}
                          {(review as any).dispute && (
                            <Badge variant={(review as any).dispute.status === 'resolved' ? 'success' : 'warning'}>
                              {(review as any).dispute.status === 'resolved' ? 'Dispute Resolved' : 'Dispute Open'}
                            </Badge>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {myReviews.length === 0 && (
                  <tr><td colSpan={7} className="px-6 py-12 text-center text-sm text-t3">No reviews found for you yet</td></tr>
                )}
              </tbody>
            </table>
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
                  {visibleReviews.map(review => (
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
                        {review.status !== 'submitted' && (isHRBPOrAbove || isManager || review.reviewer_id === currentEmployeeId) && (
                          <Button size="sm" variant="secondary" disabled={saving} onClick={async () => { setSaving(true); try { updateReview(review.id, { status: 'submitted', overall_rating: 4, submitted_at: new Date().toISOString(), ratings: { leadership: 4, execution: 4, collaboration: 4, innovation: 4 }, comments: t('defaultReviewComment') }) } finally { setSaving(false) } }}>
                            {saving ? 'Saving...' : t('completeReview')}
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
                    {boxAssignments[i].map(e => <Avatar key={e.id} name={e.profile?.full_name || ''} size="sm" />)}
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
                          <Avatar name={getEmployeeName(rec.to_id)} size="sm" />
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

      {/* ---- PIPs TAB ---- */}
      {activeTab === 'pips' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Active PIPs" value={pips.filter(p => p.status === 'active').length} icon={<AlertTriangle size={20} />} />
            <StatCard label="Completed (Success)" value={pips.filter(p => p.status === 'completed_success').length} changeType="positive" />
            <StatCard label="Completed (Failure)" value={pips.filter(p => p.status === 'completed_failure').length} changeType="negative" />
            <StatCard label="Total Check-ins" value={pipCheckIns.length} icon={<CheckCircle2 size={20} />} />
          </div>

          <Card padding="none">
            <CardHeader><CardTitle>Performance Improvement Plans</CardTitle></CardHeader>
            <div className="divide-y divide-divider">
              {pips.length === 0 && <div className="px-6 py-12 text-center text-sm text-t3">No PIPs found. Create one to get started.</div>}
              {pips.map(pip => {
                const isExpanded = expandedPIP === pip.id
                const pipCheckInsForPIP = pipCheckIns.filter(c => c.pip_id === pip.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                const objectives = (pip.objectives || []) as { title: string; description: string; targetDate: string; status: string; measure: string }[]
                const completedObjs = objectives.filter(o => o.status === 'completed').length
                const statusColors: Record<string, string> = { active: 'warning', completed_success: 'success', completed_failure: 'error', draft: 'default', extended: 'info', cancelled: 'default' }

                return (
                  <div key={pip.id}>
                    <div className="px-6 py-4 hover:bg-canvas/50 transition-colors cursor-pointer" onClick={() => setExpandedPIP(isExpanded ? null : pip.id)}>
                      <div className="flex items-start gap-4">
                        {isExpanded ? <ChevronDown size={16} className="mt-1 text-t3" /> : <ChevronRight size={16} className="mt-1 text-t3" />}
                        <Avatar name={getEmployeeName(pip.employee_id)} size="sm" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-medium text-t1">{getEmployeeName(pip.employee_id)}</p>
                            <Badge variant={(statusColors[pip.status] || 'default') as 'warning' | 'success' | 'error' | 'default' | 'info'}>{pip.status.replace(/_/g, ' ')}</Badge>
                          </div>
                          <p className="text-xs text-t3 line-clamp-1">{pip.reason}</p>
                          <div className="flex items-center gap-4 mt-1 text-xs text-t3">
                            <span>{pip.start_date} to {pip.end_date}</span>
                            <span>{completedObjs}/{objectives.length} objectives met</span>
                            <span>Check-ins: {pip.check_in_frequency}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Progress value={objectives.length > 0 ? (completedObjs / objectives.length) * 100 : 0} className="w-24" />
                        </div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-6 pb-6 ml-6 border-l-2 border-divider space-y-4">
                        {/* Objectives */}
                        <div>
                          <h4 className="text-sm font-semibold text-t1 mb-2">Objectives</h4>
                          <div className="space-y-2">
                            {objectives.map((obj, i) => {
                              const objStatusColors: Record<string, string> = { completed: 'text-green-600', in_progress: 'text-yellow-600', not_started: 'text-gray-400', not_met: 'text-red-600', almost_done: 'text-blue-600' }
                              return (
                                <div key={i} className="p-3 rounded-lg bg-surface-secondary border border-divider">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <CheckCircle2 size={14} className={objStatusColors[obj.status] || 'text-gray-400'} />
                                        <span className="text-sm font-medium text-t1">{obj.title}</span>
                                      </div>
                                      <p className="text-xs text-t3 mt-1 ml-6">{obj.description}</p>
                                      <p className="text-xs text-t3 ml-6">Measure: {obj.measure}</p>
                                    </div>
                                    <div className="text-right">
                                      <Badge variant={obj.status === 'completed' ? 'success' : obj.status === 'not_met' ? 'error' : 'default'}>{obj.status.replace(/_/g, ' ')}</Badge>
                                      <p className="text-xs text-t3 mt-1">Due: {obj.targetDate}</p>
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>

                        {/* Support Provided */}
                        {pip.support_provided && (
                          <div>
                            <h4 className="text-sm font-semibold text-t1 mb-1">Support Provided</h4>
                            <p className="text-xs text-t2 p-3 rounded-lg bg-surface-secondary">{pip.support_provided}</p>
                          </div>
                        )}

                        {/* Check-in Timeline */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-semibold text-t1">Check-in Timeline</h4>
                            {pip.status === 'active' && (
                              <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); setSelectedPIPForCheckIn(pip.id); setCheckInForm({ progress: 'on_track', notes: '', next_steps: '' }); setShowCheckInModal(true) }}>
                                <Plus size={14} /> Add Check-in
                              </Button>
                            )}
                          </div>
                          {pipCheckInsForPIP.length === 0 && <p className="text-xs text-t3">No check-ins recorded yet.</p>}
                          <div className="space-y-3">
                            {pipCheckInsForPIP.map(ci => {
                              const progressColors: Record<string, string> = { on_track: 'success', behind: 'error', at_risk: 'warning', improved: 'info' }
                              return (
                                <div key={ci.id} className="p-3 rounded-lg bg-surface-secondary border border-divider">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-medium text-t1">{ci.date}</span>
                                    <Badge variant={(progressColors[ci.progress] || 'default') as 'success' | 'error' | 'warning' | 'info'}>{ci.progress.replace(/_/g, ' ')}</Badge>
                                    <span className="text-xs text-t3">by {getEmployeeName(ci.conducted_by)}</span>
                                  </div>
                                  <p className="text-xs text-t2">{ci.notes}</p>
                                  {ci.next_steps && <p className="text-xs text-t3 mt-1">Next steps: {ci.next_steps}</p>}
                                </div>
                              )
                            })}
                          </div>
                        </div>

                        {/* Status Actions */}
                        {pip.status === 'active' && (
                          <div className="flex gap-2 pt-2 border-t border-divider">
                            <Button size="sm" variant="secondary" onClick={() => updatePIP(pip.id, { end_date: new Date(new Date(pip.end_date).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], status: 'extended' })}>Extend PIP</Button>
                            <Button size="sm" variant="secondary" onClick={() => updatePIP(pip.id, { status: 'completed_success', outcome: 'Successfully met all improvement objectives.' })} className="text-green-600">Complete (Success)</Button>
                            <Button size="sm" variant="secondary" onClick={() => updatePIP(pip.id, { status: 'completed_failure', outcome: 'Did not meet required improvement objectives.' })} className="text-red-600">Complete (Failure)</Button>
                            <Button size="sm" variant="secondary" onClick={() => updatePIP(pip.id, { status: 'cancelled' })}>Cancel</Button>
                          </div>
                        )}

                        {/* Outcome */}
                        {pip.outcome && (
                          <div className="p-3 rounded-lg bg-surface-secondary border border-divider">
                            <h4 className="text-sm font-semibold text-t1 mb-1">Outcome</h4>
                            <p className="text-xs text-t2">{pip.outcome}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </Card>
        </div>
      )}

      {/* ---- MERIT CYCLES TAB ---- */}
      {activeTab === 'merit-cycles' && (
        <div className="space-y-4">
          {meritCycles.map(cycle => {
            const isExpanded = expandedMeritCycle === cycle.id
            const recs = meritRecommendations.filter(r => r.cycle_id === cycle.id)
            const totalAllocated = recs.reduce((sum, r) => sum + r.increase_amount, 0)
            const remaining = cycle.total_budget - totalAllocated
            const utilization = cycle.total_budget > 0 ? (totalAllocated / cycle.total_budget) * 100 : 0
            const guidelines = (cycle.guidelines_config as { rating_ranges: { rating: number; label: string; min_percent: number; max_percent: number }[] } | null)
            const statusColors: Record<string, string> = { planning: 'default', budgeting: 'info', manager_allocation: 'warning', review: 'orange', approved: 'success', completed: 'success' }
            const approvedCount = recs.filter(r => r.status === 'hr_approved' || r.status === 'final_approved').length

            return (
              <Card key={cycle.id}>
                <div className="cursor-pointer" onClick={() => setExpandedMeritCycle(isExpanded ? null : cycle.id)}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      {isExpanded ? <ChevronDown size={16} className="text-t3" /> : <ChevronRight size={16} className="text-t3" />}
                      <h3 className="text-sm font-semibold text-t1">{cycle.name}</h3>
                      <Badge variant={(statusColors[cycle.status] || 'default') as 'default' | 'info' | 'warning' | 'success' | 'orange'}>{cycle.status.replace(/_/g, ' ')}</Badge>
                    </div>
                    <span className="text-xs text-t3">{cycle.fiscal_year} | {cycle.type.replace(/_/g, ' ')}</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                    <div className="text-center p-2 bg-surface-secondary rounded-lg">
                      <p className="text-xs text-t3">Total Budget</p>
                      <p className="text-lg font-bold text-t1">${cycle.total_budget.toLocaleString()}</p>
                    </div>
                    <div className="text-center p-2 bg-surface-secondary rounded-lg">
                      <p className="text-xs text-t3">Allocated</p>
                      <p className="text-lg font-bold text-tempo-600">${totalAllocated.toLocaleString()}</p>
                    </div>
                    <div className="text-center p-2 bg-surface-secondary rounded-lg">
                      <p className="text-xs text-t3">Remaining</p>
                      <p className={`text-lg font-bold ${remaining < 0 ? 'text-red-600' : 'text-green-600'}`}>${remaining.toLocaleString()}</p>
                    </div>
                    <div className="text-center p-2 bg-surface-secondary rounded-lg">
                      <p className="text-xs text-t3">Utilization</p>
                      <p className={`text-lg font-bold ${utilization > 100 ? 'text-red-600' : 'text-t1'}`}>{utilization.toFixed(1)}%</p>
                    </div>
                  </div>
                  {utilization > 100 && (
                    <div className="mt-2 flex items-center gap-2 p-2 rounded-lg bg-red-50 border border-red-200">
                      <AlertTriangle size={14} className="text-red-600" />
                      <span className="text-xs text-red-700">Over budget by ${Math.abs(remaining).toLocaleString()}</span>
                    </div>
                  )}
                </div>

                {isExpanded && (
                  <div className="mt-4 space-y-4 border-t border-divider pt-4">
                    {/* Guidelines */}
                    {guidelines && (
                      <div>
                        <h4 className="text-sm font-semibold text-t1 mb-2">Merit Guidelines</h4>
                        <div className="grid grid-cols-5 gap-2">
                          {guidelines.rating_ranges.map(g => (
                            <div key={g.rating} className="p-2 rounded-lg bg-surface-secondary text-center">
                              <div className="flex items-center justify-center gap-1 mb-1">
                                {Array.from({ length: g.rating }).map((_, i) => <Star key={i} size={10} className="text-yellow-500 fill-yellow-500" />)}
                              </div>
                              <p className="text-xs font-medium text-t1">{g.label}</p>
                              <p className="text-xs text-t3">{g.min_percent}% - {g.max_percent}%</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Department Summary */}
                    <div>
                      <h4 className="text-sm font-semibold text-t1 mb-2">Department Allocation</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-divider bg-canvas">
                              <th className="tempo-th text-left px-4 py-2">Department</th>
                              <th className="tempo-th text-center px-4 py-2">Headcount</th>
                              <th className="tempo-th text-center px-4 py-2">Avg Rating</th>
                              <th className="tempo-th text-right px-4 py-2">Total Recommended</th>
                              <th className="tempo-th text-center px-4 py-2">Utilization</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {departments.map(dept => {
                              const deptRecs = recs.filter(r => {
                                const emp = employees.find(e => e.id === r.employee_id)
                                return emp?.department_id === dept.id
                              })
                              if (deptRecs.length === 0) return null
                              const avgRating = deptRecs.reduce((s, r) => s + (r.rating || 0), 0) / deptRecs.length
                              const totalRec = deptRecs.reduce((s, r) => s + r.increase_amount, 0)
                              return (
                                <tr key={dept.id} className="hover:bg-canvas/50">
                                  <td className="px-4 py-2 text-sm text-t1">{dept.name}</td>
                                  <td className="px-4 py-2 text-sm text-t2 text-center">{deptRecs.length}</td>
                                  <td className="px-4 py-2 text-sm text-t2 text-center">{avgRating.toFixed(1)}</td>
                                  <td className="px-4 py-2 text-sm text-t1 text-right font-medium">${totalRec.toLocaleString()}</td>
                                  <td className="px-4 py-2 text-center"><Progress value={cycle.total_budget > 0 ? (totalRec / cycle.total_budget) * 100 : 0} className="w-20 mx-auto" /></td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Individual Recommendations */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-t1">Individual Recommendations ({recs.length})</h4>
                        <div className="flex gap-2">
                          {recs.some(r => r.status === 'pending' || r.status === 'manager_approved') && (
                            <Button size="sm" variant="secondary" onClick={() => {
                              recs.filter(r => r.status === 'pending' || r.status === 'manager_approved').forEach(r => updateMeritRecommendation(r.id, { status: 'hr_approved', approved_by: currentEmployeeId, approved_at: new Date().toISOString() }))
                            }}>Bulk Approve All</Button>
                          )}
                          <Button size="sm" variant="secondary" onClick={() => { setMeritRecForm({ cycle_id: cycle.id, employee_id: '', current_salary: 0, proposed_salary: 0, rating: 3, justification: '' }); setShowMeritRecModal(true) }}>
                            <Plus size={14} /> Add Recommendation
                          </Button>
                        </div>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-divider bg-canvas">
                              <th className="tempo-th text-left px-4 py-2">Employee</th>
                              <th className="tempo-th text-left px-4 py-2">Manager</th>
                              <th className="tempo-th text-center px-4 py-2">Rating</th>
                              <th className="tempo-th text-right px-4 py-2">Current</th>
                              <th className="tempo-th text-right px-4 py-2">Proposed</th>
                              <th className="tempo-th text-center px-4 py-2">Increase %</th>
                              <th className="tempo-th text-left px-4 py-2">Status</th>
                              <th className="tempo-th text-left px-4 py-2">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {recs.map(rec => {
                              const recStatusColors: Record<string, string> = { pending: 'default', manager_approved: 'info', hr_approved: 'warning', final_approved: 'success', rejected: 'error' }
                              return (
                                <tr key={rec.id} className="hover:bg-canvas/50">
                                  <td className="px-4 py-2">
                                    <div className="flex items-center gap-2">
                                      <Avatar name={getEmployeeName(rec.employee_id)} size="sm" />
                                      <span className="text-sm text-t1">{getEmployeeName(rec.employee_id)}</span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-2 text-xs text-t2">{getEmployeeName(rec.manager_id || '')}</td>
                                  <td className="px-4 py-2 text-center">
                                    <div className="flex items-center justify-center gap-0.5">
                                      {Array.from({ length: rec.rating || 0 }).map((_, i) => <Star key={i} size={10} className="text-yellow-500 fill-yellow-500" />)}
                                    </div>
                                  </td>
                                  <td className="px-4 py-2 text-sm text-t2 text-right">${rec.current_salary.toLocaleString()}</td>
                                  <td className="px-4 py-2 text-sm text-t1 text-right font-medium">${rec.proposed_salary.toLocaleString()}</td>
                                  <td className="px-4 py-2 text-center">
                                    <span className={`text-sm font-medium ${rec.increase_percent > 8 ? 'text-green-600' : rec.increase_percent > 4 ? 'text-yellow-600' : 'text-t2'}`}>
                                      {rec.increase_percent.toFixed(1)}%
                                    </span>
                                  </td>
                                  <td className="px-4 py-2">
                                    <Badge variant={(recStatusColors[rec.status] || 'default') as 'default' | 'info' | 'warning' | 'success' | 'error'}>{rec.status.replace(/_/g, ' ')}</Badge>
                                  </td>
                                  <td className="px-4 py-2">
                                    <div className="flex gap-1">
                                      {(rec.status === 'pending' || rec.status === 'manager_approved') && (
                                        <>
                                          <Button size="sm" variant="secondary" onClick={() => updateMeritRecommendation(rec.id, { status: 'hr_approved', approved_by: currentEmployeeId, approved_at: new Date().toISOString() })}>Approve</Button>
                                          <Button size="sm" variant="secondary" onClick={() => updateMeritRecommendation(rec.id, { status: 'rejected' })} className="text-red-600">Reject</Button>
                                        </>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Push to Payroll */}
                    {cycle.status !== 'completed' && approvedCount > 0 && (
                      <div className="flex justify-end pt-2 border-t border-divider">
                        <Button onClick={() => { updateMeritCycle(cycle.id, { status: 'completed' }); addToast(`Merit cycle completed. ${approvedCount} salary adjustments ready for payroll.`) }}>
                          <DollarSign size={14} /> Push to Payroll ({approvedCount} approved)
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            )
          })}
          {meritCycles.length === 0 && (
            <Card>
              <div className="text-center py-12 text-t3">
                <DollarSign size={48} className="mx-auto mb-4 opacity-40" />
                <p className="text-sm">No merit cycles found. Create one to get started.</p>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ---- REVIEW TEMPLATES TAB ---- */}
      {activeTab === 'review-templates' && (
        <div className="space-y-4">
          {/* Templates List */}
          <Card padding="none">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Review Templates</CardTitle>
              </div>
            </CardHeader>
            <div className="divide-y divide-divider">
              {reviewTemplates.length === 0 && <div className="px-6 py-12 text-center text-sm text-t3">No templates found. Create one to get started.</div>}
              {reviewTemplates.map(template => {
                const sections = (template.sections || []) as { title: string; description: string; questions: { text: string; type: string; required: boolean }[] }[]
                const questionCount = sections.reduce((sum, s) => sum + s.questions.length, 0)
                const isPreviewing = previewTemplate === template.id

                return (
                  <div key={template.id}>
                    <div className="px-6 py-4 hover:bg-canvas/50 transition-colors">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-lg bg-tempo-50 text-tempo-600 flex items-center justify-center shrink-0">
                          <FileText size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-medium text-t1">{template.name}</p>
                            <Badge variant="info">{template.type}</Badge>
                            {template.is_default && <Badge variant="success">Default</Badge>}
                          </div>
                          <p className="text-xs text-t3">{sections.length} sections, {questionCount} questions</p>
                          <p className="text-xs text-t3">Created: {new Date(template.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => setPreviewTemplate(isPreviewing ? null : template.id)} className="p-1.5 text-t3 hover:text-t1 hover:bg-canvas rounded-lg transition-colors" title="Preview">
                            <Eye size={14} />
                          </button>
                          <button onClick={() => {
                            setEditingTemplate(template.id)
                            setTemplateForm({
                              name: template.name,
                              type: template.type,
                              is_default: template.is_default,
                              sections: sections.map(s => ({
                                title: s.title,
                                description: s.description,
                                questions: s.questions.map(q => ({
                                  text: q.text,
                                  type: q.type,
                                  required: q.required,
                                  options: (q as { options?: string[] }).options,
                                  scale: (q as { scale?: { min: number; max: number; labels: string[] } }).scale,
                                })),
                              })),
                            })
                            setShowTemplateModal(true)
                          }} className="p-1.5 text-t3 hover:text-t1 hover:bg-canvas rounded-lg transition-colors" title="Edit">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => {
                            addReviewTemplate({
                              name: `${template.name} (Copy)`,
                              type: template.type,
                              is_default: false,
                              sections: template.sections,
                              created_by: currentEmployeeId,
                            })
                          }} className="p-1.5 text-t3 hover:text-t1 hover:bg-canvas rounded-lg transition-colors" title="Duplicate">
                            <Copy size={14} />
                          </button>
                          {!template.is_default && (
                            <button onClick={() => {
                              // Set as default: unset others first
                              reviewTemplates.filter(t => t.is_default && t.type === template.type).forEach(t => updateReviewTemplate(t.id, { is_default: false }))
                              updateReviewTemplate(template.id, { is_default: true })
                            }} className="p-1.5 text-t3 hover:text-yellow-600 hover:bg-canvas rounded-lg transition-colors" title="Set as default">
                              <Star size={14} />
                            </button>
                          )}
                          <button onClick={() => deleteReviewTemplate(template.id)} className="p-1.5 text-t3 hover:text-error hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Preview */}
                    {isPreviewing && (
                      <div className="px-6 pb-6 border-t border-divider bg-canvas/50">
                        <div className="max-w-2xl mx-auto py-4 space-y-6">
                          <div className="text-center">
                            <h3 className="text-lg font-semibold text-t1">{template.name}</h3>
                            <p className="text-xs text-t3">Preview Mode</p>
                          </div>
                          {sections.map((section, si) => (
                            <div key={si} className="space-y-3">
                              <div className="border-b border-divider pb-2">
                                <h4 className="text-sm font-semibold text-t1">{section.title}</h4>
                                <p className="text-xs text-t3">{section.description}</p>
                              </div>
                              {section.questions.map((q, qi) => (
                                <div key={qi} className="p-3 rounded-lg bg-white border border-divider">
                                  <div className="flex items-start gap-2">
                                    <span className="text-xs text-t3 mt-0.5">{si + 1}.{qi + 1}</span>
                                    <div className="flex-1">
                                      <p className="text-sm text-t1">{q.text} {q.required && <span className="text-red-500">*</span>}</p>
                                      {q.type === 'rating' && (
                                        <div className="mt-2 flex gap-1">
                                          {Array.from({ length: ((q as { scale?: { max: number } }).scale?.max || 5) }).map((_, i) => (
                                            <div key={i} className="w-8 h-8 rounded border border-divider flex items-center justify-center text-xs text-t3">{i + 1}</div>
                                          ))}
                                        </div>
                                      )}
                                      {q.type === 'text' && <div className="mt-2 h-16 rounded border border-divider bg-gray-50" />}
                                      {q.type === 'multiple_choice' && (q as { options?: string[] }).options && (
                                        <div className="mt-2 space-y-1">
                                          {((q as { options?: string[] }).options || []).map((opt, oi) => (
                                            <label key={oi} className="flex items-center gap-2 text-xs text-t2">
                                              <div className="w-3.5 h-3.5 rounded-full border border-divider" />
                                              {opt}
                                            </label>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </Card>
        </div>
      )}

      {/* ---- MODALS ---- */}

      {/* T5 #41: Rating Dispute Modal */}
      <Modal open={showDisputeModal} onClose={() => { setShowDisputeModal(false); setDisputeReviewId(null); setDisputeConcern('') }} title="Raise a Concern About Your Review">
        <div className="space-y-4">
          <p className="text-sm text-t3">Your concern will be visible to HR BP. They may schedule a three-way conversation or update the rating with a documented reason.</p>
          <Textarea label="Describe Your Concern" value={disputeConcern} onChange={e => setDisputeConcern(e.target.value)} placeholder="Explain what you disagree with and why..." />
          <div className="bg-canvas rounded-lg p-3 text-xs text-t3">
            <p>What happens next:</p>
            <ul className="list-disc ml-4 mt-1 space-y-0.5">
              <li>HR BP reviews both the manager assessment and your concern</li>
              <li>A three-way conversation may be scheduled</li>
              <li>Rating may be updated with documented justification</li>
              <li>The dispute and resolution are permanently recorded</li>
            </ul>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => { setShowDisputeModal(false); setDisputeReviewId(null); setDisputeConcern('') }}>Cancel</Button>
            <Button onClick={raiseDispute} disabled={saving || !disputeConcern.trim()}>{saving ? 'Saving...' : 'Submit Concern'}</Button>
          </div>
        </div>
      </Modal>

      {/* Create PIP */}
      <Modal open={showPIPModal} onClose={() => setShowPIPModal(false)} title="Create Performance Improvement Plan" size="xl">
        <div className="space-y-4">
          <Select label="Employee" value={pipForm.employee_id} onChange={(e) => setPipForm({ ...pipForm, employee_id: e.target.value })} options={employees.map(e => ({ value: e.id, label: e.profile?.full_name || '' }))} />
          <Textarea label="Reason for PIP" placeholder="Describe the performance issues that necessitate this PIP..." rows={3} value={pipForm.reason} onChange={(e) => setPipForm({ ...pipForm, reason: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Start Date" type="date" value={pipForm.start_date} onChange={(e) => setPipForm({ ...pipForm, start_date: e.target.value })} />
            <Input label="End Date" type="date" value={pipForm.end_date} onChange={(e) => setPipForm({ ...pipForm, end_date: e.target.value })} />
          </div>
          <Select label="Check-in Frequency" value={pipForm.check_in_frequency} onChange={(e) => setPipForm({ ...pipForm, check_in_frequency: e.target.value })} options={[
            { value: 'weekly', label: 'Weekly' },
            { value: 'biweekly', label: 'Bi-weekly' },
            { value: 'monthly', label: 'Monthly' },
          ]} />
          <Textarea label="Support Provided" placeholder="Describe resources, mentoring, training, etc..." rows={2} value={pipForm.support_provided} onChange={(e) => setPipForm({ ...pipForm, support_provided: e.target.value })} />

          {/* Objectives */}
          <div>
            <label className="block text-sm font-medium text-t1 mb-2">Objectives ({pipForm.objectives.length})</label>
            {pipForm.objectives.map((obj, i) => (
              <div key={i} className="flex items-start gap-2 mb-2 p-2 rounded-lg bg-surface-secondary border border-divider">
                <div className="flex-1">
                  <p className="text-sm font-medium text-t1">{obj.title}</p>
                  <p className="text-xs text-t3">{obj.description}</p>
                  <p className="text-xs text-t3">Due: {obj.targetDate} | Measure: {obj.measure}</p>
                </div>
                <button onClick={() => setPipForm({ ...pipForm, objectives: pipForm.objectives.filter((_, j) => j !== i) })} className="text-t3 hover:text-error"><X size={14} /></button>
              </div>
            ))}
            <div className="space-y-2 p-3 rounded-lg border border-dashed border-divider">
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Objective title" value={pipObjForm.title} onChange={(e) => setPipObjForm({ ...pipObjForm, title: e.target.value })} />
                <Input placeholder="Target date" type="date" value={pipObjForm.targetDate} onChange={(e) => setPipObjForm({ ...pipObjForm, targetDate: e.target.value })} />
              </div>
              <Input placeholder="Description" value={pipObjForm.description} onChange={(e) => setPipObjForm({ ...pipObjForm, description: e.target.value })} />
              <Input placeholder="How will success be measured?" value={pipObjForm.measure} onChange={(e) => setPipObjForm({ ...pipObjForm, measure: e.target.value })} />
              <Button size="sm" variant="secondary" onClick={() => {
                if (pipObjForm.title && pipObjForm.targetDate) {
                  setPipForm({ ...pipForm, objectives: [...pipForm.objectives, { ...pipObjForm }] })
                  setPipObjForm({ title: '', description: '', targetDate: '', measure: '' })
                }
              }}><Plus size={14} /> Add Objective</Button>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowPIPModal(false)}>Cancel</Button>
            <Button disabled={saving} onClick={async () => {
              if (!pipForm.employee_id || !pipForm.reason || !pipForm.start_date || !pipForm.end_date) { addToast('Employee, reason, start and end dates are required', 'error'); return }
              setSaving(true)
              try {
                addPIP({
                  employee_id: pipForm.employee_id,
                  created_by: currentEmployeeId,
                  reason: pipForm.reason,
                  start_date: pipForm.start_date,
                  end_date: pipForm.end_date,
                  status: 'active',
                  objectives: pipForm.objectives.map(o => ({ ...o, status: 'not_started' })),
                  support_provided: pipForm.support_provided,
                  check_in_frequency: pipForm.check_in_frequency,
                  next_check_in: pipForm.start_date,
                  outcome: null,
                  notes: null,
                })
                setShowPIPModal(false)
              } finally { setSaving(false) }
            }}>{saving ? 'Saving...' : 'Create PIP'}</Button>
          </div>
        </div>
      </Modal>

      {/* PIP Check-in */}
      <Modal open={showCheckInModal} onClose={() => setShowCheckInModal(false)} title="Add PIP Check-in">
        <div className="space-y-4">
          <Select label="Progress Rating" value={checkInForm.progress} onChange={(e) => setCheckInForm({ ...checkInForm, progress: e.target.value })} options={[
            { value: 'on_track', label: 'On Track' },
            { value: 'improved', label: 'Improved' },
            { value: 'behind', label: 'Behind' },
            { value: 'at_risk', label: 'At Risk' },
          ]} />
          <Textarea label="Notes" placeholder="Describe progress observations..." rows={4} value={checkInForm.notes} onChange={(e) => setCheckInForm({ ...checkInForm, notes: e.target.value })} />
          <Textarea label="Next Steps" placeholder="What actions should be taken before the next check-in?" rows={2} value={checkInForm.next_steps} onChange={(e) => setCheckInForm({ ...checkInForm, next_steps: e.target.value })} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowCheckInModal(false)}>Cancel</Button>
            <Button disabled={saving} onClick={async () => {
              if (!selectedPIPForCheckIn || !checkInForm.notes) { addToast('Notes are required for check-in', 'error'); return }
              setSaving(true)
              try {
                addPIPCheckIn({
                  pip_id: selectedPIPForCheckIn,
                  date: new Date().toISOString().split('T')[0],
                  conducted_by: currentEmployeeId,
                  progress: checkInForm.progress,
                  notes: checkInForm.notes,
                  objectives_status: [],
                  next_steps: checkInForm.next_steps,
                })
                setShowCheckInModal(false)
              } finally { setSaving(false) }
            }}>{saving ? 'Saving...' : 'Record Check-in'}</Button>
          </div>
        </div>
      </Modal>

      {/* Create Merit Cycle */}
      <Modal open={showMeritModal} onClose={() => setShowMeritModal(false)} title="Create Merit Cycle">
        <div className="space-y-4">
          <Input label="Cycle Name" placeholder="e.g., Annual Merit Review 2026" value={meritForm.name} onChange={(e) => setMeritForm({ ...meritForm, name: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Type" value={meritForm.type} onChange={(e) => setMeritForm({ ...meritForm, type: e.target.value })} options={[
              { value: 'annual_merit', label: 'Annual Merit' },
              { value: 'promotion', label: 'Promotion' },
              { value: 'market_adjustment', label: 'Market Adjustment' },
              { value: 'bonus', label: 'Bonus' },
            ]} />
            <Input label="Fiscal Year" value={meritForm.fiscal_year} onChange={(e) => setMeritForm({ ...meritForm, fiscal_year: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Total Budget ($)" type="number" value={meritForm.total_budget} onChange={(e) => setMeritForm({ ...meritForm, total_budget: Number(e.target.value) })} />
            <Select label="Currency" value={meritForm.currency} onChange={(e) => setMeritForm({ ...meritForm, currency: e.target.value })} options={[
              { value: 'USD', label: 'USD' },
              { value: 'EUR', label: 'EUR' },
              { value: 'GBP', label: 'GBP' },
              { value: 'NGN', label: 'NGN' },
            ]} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Start Date" type="date" value={meritForm.start_date} onChange={(e) => setMeritForm({ ...meritForm, start_date: e.target.value })} />
            <Input label="End Date" type="date" value={meritForm.end_date} onChange={(e) => setMeritForm({ ...meritForm, end_date: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowMeritModal(false)}>Cancel</Button>
            <Button disabled={saving} onClick={async () => {
              if (!meritForm.name || !meritForm.total_budget) { addToast('Name and budget are required', 'error'); return }
              setSaving(true)
              try {
                addMeritCycle({
                  name: meritForm.name,
                  type: meritForm.type,
                  status: 'planning',
                  fiscal_year: meritForm.fiscal_year,
                  total_budget: meritForm.total_budget,
                  currency: meritForm.currency,
                  guidelines_config: {
                    rating_ranges: [
                      { rating: 5, label: 'Exceptional', min_percent: 8, max_percent: 12 },
                      { rating: 4, label: 'Exceeds Expectations', min_percent: 5, max_percent: 8 },
                      { rating: 3, label: 'Meets Expectations', min_percent: 2, max_percent: 4 },
                      { rating: 2, label: 'Needs Improvement', min_percent: 0, max_percent: 2 },
                      { rating: 1, label: 'Unsatisfactory', min_percent: 0, max_percent: 0 },
                    ],
                  },
                  start_date: meritForm.start_date || new Date().toISOString().split('T')[0],
                  end_date: meritForm.end_date || `${meritForm.fiscal_year}-12-31`,
                  created_by: currentEmployeeId,
                })
                setShowMeritModal(false)
              } finally { setSaving(false) }
            }}>{saving ? 'Saving...' : 'Create Merit Cycle'}</Button>
          </div>
        </div>
      </Modal>

      {/* Add Merit Recommendation */}
      <Modal open={showMeritRecModal} onClose={() => setShowMeritRecModal(false)} title="Add Merit Recommendation">
        <div className="space-y-4">
          <Select label="Employee" value={meritRecForm.employee_id} onChange={(e) => {
            const emp = employees.find(e2 => e2.id === e.target.value)
            // Try to guess current salary from existing salary reviews or comp bands
            setMeritRecForm({ ...meritRecForm, employee_id: e.target.value, current_salary: 0, proposed_salary: 0 })
          }} options={employees.map(e => ({ value: e.id, label: e.profile?.full_name || '' }))} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Current Salary ($)" type="number" value={meritRecForm.current_salary} onChange={(e) => {
              const current = Number(e.target.value)
              setMeritRecForm({ ...meritRecForm, current_salary: current })
            }} />
            <Input label="Proposed Salary ($)" type="number" value={meritRecForm.proposed_salary} onChange={(e) => {
              const proposed = Number(e.target.value)
              const increase = meritRecForm.current_salary > 0 ? ((proposed - meritRecForm.current_salary) / meritRecForm.current_salary) * 100 : 0
              setMeritRecForm({ ...meritRecForm, proposed_salary: proposed })
            }} />
          </div>
          {meritRecForm.current_salary > 0 && meritRecForm.proposed_salary > 0 && (
            <div className="p-2 rounded-lg bg-surface-secondary text-center">
              <span className="text-sm font-medium text-t1">
                Increase: {((meritRecForm.proposed_salary - meritRecForm.current_salary) / meritRecForm.current_salary * 100).toFixed(1)}%
                (${(meritRecForm.proposed_salary - meritRecForm.current_salary).toLocaleString()})
              </span>
            </div>
          )}
          <Select label="Performance Rating" value={String(meritRecForm.rating)} onChange={(e) => setMeritRecForm({ ...meritRecForm, rating: Number(e.target.value) })} options={[
            { value: '5', label: '5 - Exceptional' },
            { value: '4', label: '4 - Exceeds Expectations' },
            { value: '3', label: '3 - Meets Expectations' },
            { value: '2', label: '2 - Needs Improvement' },
            { value: '1', label: '1 - Unsatisfactory' },
          ]} />
          {/* Budget status indicator */}
          {meritRecForm.cycle_id && (() => {
            const cycle = meritCycles.find(c => c.id === meritRecForm.cycle_id)
            if (!cycle) return null
            const existingAllocated = meritRecommendations
              .filter(r => r.cycle_id === meritRecForm.cycle_id)
              .reduce((sum: number, r: any) => sum + r.increase_amount, 0)
            const increaseAmount = meritRecForm.proposed_salary > 0 && meritRecForm.current_salary > 0
              ? meritRecForm.proposed_salary - meritRecForm.current_salary : 0
            const projectedTotal = existingAllocated + increaseAmount
            const remaining = cycle.total_budget - projectedTotal
            const isOverBudget = remaining < 0
            return (
              <div className={`p-3 rounded-lg border ${isOverBudget ? 'bg-red-50 border-red-200' : 'bg-surface-secondary border-divider'}`}>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-t2">Cycle Budget: ${cycle.total_budget.toLocaleString()}</span>
                  <span className="text-t2">Already Allocated: ${existingAllocated.toLocaleString()}</span>
                  <span className={`font-medium ${isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
                    {isOverBudget ? 'Over budget' : 'Remaining'}: ${Math.abs(remaining).toLocaleString()}
                  </span>
                </div>
                {isOverBudget && (
                  <div className="flex items-center gap-1 mt-1">
                    <AlertTriangle size={12} className="text-red-600" />
                    <span className="text-xs text-red-700">This recommendation will exceed the cycle budget</span>
                  </div>
                )}
              </div>
            )
          })()}
          <Textarea label="Justification" placeholder="Provide detailed justification for this recommendation..." rows={3} value={meritRecForm.justification} onChange={(e) => setMeritRecForm({ ...meritRecForm, justification: e.target.value })} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowMeritRecModal(false)}>Cancel</Button>
            <Button disabled={saving} onClick={async () => {
              if (!meritRecForm.employee_id || !meritRecForm.current_salary || !meritRecForm.proposed_salary) { addToast('Employee and salary fields are required', 'error'); return }
              setSaving(true)
              try {
                const increaseAmount = meritRecForm.proposed_salary - meritRecForm.current_salary
                const increasePercent = (increaseAmount / meritRecForm.current_salary) * 100

                // Budget validation
                const cycle = meritCycles.find(c => c.id === meritRecForm.cycle_id)
                if (cycle) {
                  const existingAllocated = meritRecommendations
                    .filter(r => r.cycle_id === meritRecForm.cycle_id)
                    .reduce((sum: number, r: any) => sum + r.increase_amount, 0)
                  const newTotal = existingAllocated + increaseAmount
                  if (newTotal > cycle.total_budget) {
                    const overBy = newTotal - cycle.total_budget
                    addToast(`Warning: This recommendation exceeds the cycle budget by $${overBy.toLocaleString()}. Total allocated: $${newTotal.toLocaleString()} / Budget: $${cycle.total_budget.toLocaleString()}`, 'error')
                  }
                }

                addMeritRecommendation({
                  cycle_id: meritRecForm.cycle_id,
                  employee_id: meritRecForm.employee_id,
                  manager_id: currentEmployeeId,
                  current_salary: meritRecForm.current_salary,
                  proposed_salary: meritRecForm.proposed_salary,
                  increase_percent: Number(increasePercent.toFixed(1)),
                  increase_amount: increaseAmount,
                  rating: meritRecForm.rating,
                  justification: meritRecForm.justification,
                  status: 'pending',
                  approved_by: null,
                  approved_at: null,
                })
                setShowMeritRecModal(false)
              } finally { setSaving(false) }
            }}>{saving ? 'Saving...' : 'Submit Recommendation'}</Button>
          </div>
        </div>
      </Modal>

      {/* Create/Edit Review Template */}
      <Modal open={showTemplateModal} onClose={() => setShowTemplateModal(false)} title={editingTemplate ? 'Edit Review Template' : 'Create Review Template'} size="xl">
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Template Name" placeholder="e.g., Annual Performance Review" value={templateForm.name} onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })} />
            <Select label="Type" value={templateForm.type} onChange={(e) => setTemplateForm({ ...templateForm, type: e.target.value })} options={[
              { value: 'annual', label: 'Annual' },
              { value: 'mid_year', label: 'Mid-Year' },
              { value: 'quarterly', label: 'Quarterly' },
              { value: 'probation', label: 'Probation' },
              { value: '360', label: '360 Feedback' },
              { value: 'self', label: 'Self Assessment' },
              { value: 'manager', label: 'Manager Review' },
              { value: 'peer', label: 'Peer Review' },
            ]} />
          </div>
          <label className="flex items-center gap-2 text-sm text-t2">
            <input type="checkbox" checked={templateForm.is_default} onChange={(e) => setTemplateForm({ ...templateForm, is_default: e.target.checked })} className="rounded border-divider" />
            Set as default template for this type
          </label>

          {/* Sections */}
          <div>
            <label className="block text-sm font-medium text-t1 mb-2">Sections ({templateForm.sections.length})</label>
            {templateForm.sections.map((section, si) => (
              <div key={si} className="mb-4 p-4 rounded-lg border border-divider bg-surface-secondary">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <GripVertical size={14} className="text-t3" />
                    <div>
                      <Input placeholder="Section title" value={section.title} onChange={(e) => {
                        const updated = [...templateForm.sections]
                        updated[si] = { ...updated[si], title: e.target.value }
                        setTemplateForm({ ...templateForm, sections: updated })
                      }} />
                    </div>
                  </div>
                  <button onClick={() => setTemplateForm({ ...templateForm, sections: templateForm.sections.filter((_, i) => i !== si) })} className="text-t3 hover:text-error"><X size={14} /></button>
                </div>
                <Input placeholder="Section description" value={section.description} onChange={(e) => {
                  const updated = [...templateForm.sections]
                  updated[si] = { ...updated[si], description: e.target.value }
                  setTemplateForm({ ...templateForm, sections: updated })
                }} />

                {/* Questions */}
                <div className="mt-3 space-y-2">
                  {section.questions.map((q, qi) => (
                    <div key={qi} className="flex items-start gap-2 p-2 rounded bg-white border border-divider">
                      <div className="flex-1 space-y-1">
                        <Input placeholder="Question text" value={q.text} onChange={(e) => {
                          const updated = [...templateForm.sections]
                          updated[si].questions[qi] = { ...updated[si].questions[qi], text: e.target.value }
                          setTemplateForm({ ...templateForm, sections: updated })
                        }} />
                        <div className="flex items-center gap-2">
                          <Select value={q.type} onChange={(e) => {
                            const updated = [...templateForm.sections]
                            updated[si].questions[qi] = { ...updated[si].questions[qi], type: e.target.value }
                            setTemplateForm({ ...templateForm, sections: updated })
                          }} options={[
                            { value: 'rating', label: 'Rating (1-5)' },
                            { value: 'text', label: 'Text Response' },
                            { value: 'multiple_choice', label: 'Multiple Choice' },
                          ]} />
                          <label className="flex items-center gap-1 text-xs text-t2 whitespace-nowrap">
                            <input type="checkbox" checked={q.required} onChange={(e) => {
                              const updated = [...templateForm.sections]
                              updated[si].questions[qi] = { ...updated[si].questions[qi], required: e.target.checked }
                              setTemplateForm({ ...templateForm, sections: updated })
                            }} className="rounded border-divider" />
                            Required
                          </label>
                        </div>
                        {q.type === 'multiple_choice' && (
                          <div className="space-y-1">
                            {(q.options || []).map((opt, oi) => (
                              <div key={oi} className="flex items-center gap-1">
                                <Input placeholder={`Option ${oi + 1}`} value={opt} onChange={(e) => {
                                  const updated = [...templateForm.sections]
                                  const opts = [...(updated[si].questions[qi].options || [])]
                                  opts[oi] = e.target.value
                                  updated[si].questions[qi] = { ...updated[si].questions[qi], options: opts }
                                  setTemplateForm({ ...templateForm, sections: updated })
                                }} />
                                <button onClick={() => {
                                  const updated = [...templateForm.sections]
                                  const opts = [...(updated[si].questions[qi].options || [])]
                                  opts.splice(oi, 1)
                                  updated[si].questions[qi] = { ...updated[si].questions[qi], options: opts }
                                  setTemplateForm({ ...templateForm, sections: updated })
                                }} className="text-t3 hover:text-error"><X size={12} /></button>
                              </div>
                            ))}
                            <Button size="sm" variant="secondary" onClick={() => {
                              const updated = [...templateForm.sections]
                              updated[si].questions[qi] = { ...updated[si].questions[qi], options: [...(updated[si].questions[qi].options || []), ''] }
                              setTemplateForm({ ...templateForm, sections: updated })
                            }}>Add Option</Button>
                          </div>
                        )}
                      </div>
                      <button onClick={() => {
                        const updated = [...templateForm.sections]
                        updated[si] = { ...updated[si], questions: updated[si].questions.filter((_, i) => i !== qi) }
                        setTemplateForm({ ...templateForm, sections: updated })
                      }} className="text-t3 hover:text-error mt-1"><X size={14} /></button>
                    </div>
                  ))}
                  <Button size="sm" variant="secondary" onClick={() => {
                    const updated = [...templateForm.sections]
                    updated[si] = { ...updated[si], questions: [...updated[si].questions, { text: '', type: 'rating', required: true }] }
                    setTemplateForm({ ...templateForm, sections: updated })
                  }}><Plus size={14} /> Add Question</Button>
                </div>
              </div>
            ))}

            {/* Add Section */}
            <div className="p-3 rounded-lg border border-dashed border-divider space-y-2">
              <Input placeholder="New section title" value={newSectionTitle} onChange={(e) => setNewSectionTitle(e.target.value)} />
              <Input placeholder="Section description" value={newSectionDesc} onChange={(e) => setNewSectionDesc(e.target.value)} />
              <Button size="sm" variant="secondary" onClick={() => {
                if (newSectionTitle) {
                  setTemplateForm({ ...templateForm, sections: [...templateForm.sections, { title: newSectionTitle, description: newSectionDesc, questions: [] }] })
                  setNewSectionTitle('')
                  setNewSectionDesc('')
                }
              }}><Plus size={14} /> Add Section</Button>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-divider">
            <Button variant="secondary" onClick={() => setShowTemplateModal(false)}>Cancel</Button>
            <Button disabled={saving} onClick={async () => {
              if (!templateForm.name || templateForm.sections.length === 0) { addToast('Template name and at least one section are required', 'error'); return }
              setSaving(true)
              try {
                if (editingTemplate) {
                  updateReviewTemplate(editingTemplate, {
                    name: templateForm.name,
                    type: templateForm.type,
                    is_default: templateForm.is_default,
                    sections: templateForm.sections,
                  })
                } else {
                  addReviewTemplate({
                    name: templateForm.name,
                    type: templateForm.type,
                    is_default: templateForm.is_default,
                    sections: templateForm.sections,
                    created_by: currentEmployeeId,
                  })
                }
                setShowTemplateModal(false)
              } finally { setSaving(false) }
            }}>{saving ? 'Saving...' : editingTemplate ? 'Save Changes' : 'Create Template'}</Button>
          </div>
        </div>
      </Modal>

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
            <Button onClick={submitGoal} disabled={saving}>{saving ? 'Saving...' : editingGoal ? tc('saveChanges') : t('createGoal')}</Button>
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
            <Button onClick={submitFeedback} disabled={saving}>{saving ? 'Saving...' : t('sendFeedback')}</Button>
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
            <Button onClick={submitCycle} disabled={saving}>{saving ? 'Saving...' : t('createCycle')}</Button>
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
            <Button onClick={submitReview} disabled={saving}>{saving ? 'Saving...' : t('createReview')}</Button>
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
            <Button onClick={submit1on1} disabled={saving}>{saving ? 'Saving...' : t('create1on1')}</Button>
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
            <Button onClick={submitKudos} disabled={saving}>{saving ? 'Saving...' : t('sendKudos')}</Button>
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
            <Button onClick={submitCompRating} disabled={saving}>{saving ? 'Saving...' : t('submitRating')}</Button>
          </div>
        </div>
      </Modal>

      {/* Bulk Assign Reviews */}
      <Modal open={showBulkReviewModal} onClose={resetBulkReview} title="Bulk Assign Reviews" size="xl">
        {bulkRevStep === 1 && (
          <div className="space-y-4">
            <p className="text-sm text-t2">Select the employees to include in this review assignment.</p>

            {/* Mode tabs */}
            <div className="flex gap-1 p-1 bg-canvas rounded-lg">
              {([
                { key: 'individual' as const, label: 'Individual', icon: <Search size={14} /> },
                { key: 'department' as const, label: 'Department', icon: <Building2 size={14} /> },
                { key: 'country' as const, label: 'Country', icon: <Globe size={14} /> },
                { key: 'level' as const, label: 'Level', icon: <BarChart3 size={14} /> },
                { key: 'all' as const, label: 'Entire Company', icon: <Users size={14} /> },
              ]).map(m => (
                <button
                  key={m.key}
                  onClick={() => setBulkRevMode(m.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${bulkRevMode === m.key ? 'bg-white shadow text-t1' : 'text-t3 hover:text-t1'}`}
                >
                  {m.icon} {m.label}
                </button>
              ))}
            </div>

            {/* Individual mode */}
            {bulkRevMode === 'individual' && (
              <div className="space-y-3">
                <Input
                  placeholder="Search employees by name or title..."
                  value={bulkRevSearch}
                  onChange={(e) => setBulkRevSearch(e.target.value)}
                />
                <div className="border border-divider rounded-lg max-h-64 overflow-y-auto divide-y divide-divider">
                  {bulkRevTargetEmployees.map(emp => (
                    <label key={emp.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-canvas/50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={bulkRevSelectedEmpIds.has(emp.id)}
                        onChange={() => toggleBulkRevSet(bulkRevSelectedEmpIds, setBulkRevSelectedEmpIds, emp.id)}
                        className="rounded border-divider"
                      />
                      <Avatar name={emp.profile?.full_name || ''} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-t1 truncate">{emp.profile?.full_name}</p>
                        <p className="text-xs text-t3">{emp.job_title} &middot; {emp.country}</p>
                      </div>
                    </label>
                  ))}
                  {bulkRevTargetEmployees.length === 0 && (
                    <p className="px-4 py-8 text-center text-sm text-t3">No employees found.</p>
                  )}
                </div>
                <p className="text-xs text-t3">{bulkRevSelectedEmpIds.size} employee{bulkRevSelectedEmpIds.size !== 1 ? 's' : ''} selected</p>
              </div>
            )}

            {/* Department mode */}
            {bulkRevMode === 'department' && (
              <div className="space-y-3">
                <p className="text-sm text-t2">Select one or more departments:</p>
                <div className="border border-divider rounded-lg max-h-64 overflow-y-auto divide-y divide-divider">
                  {departments.map(dept => {
                    const count = employees.filter(e => e.department_id === dept.id).length
                    return (
                      <label key={dept.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-canvas/50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={bulkRevSelectedDepts.has(dept.id)}
                          onChange={() => toggleBulkRevSet(bulkRevSelectedDepts, setBulkRevSelectedDepts, dept.id)}
                          className="rounded border-divider"
                        />
                        <Building2 size={16} className="text-t3" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-t1">{dept.name}</p>
                          <p className="text-xs text-t3">{count} employee{count !== 1 ? 's' : ''}</p>
                        </div>
                      </label>
                    )
                  })}
                </div>
                <p className="text-xs text-t3">{bulkRevTargetEmployees.length} employee{bulkRevTargetEmployees.length !== 1 ? 's' : ''} in selected departments</p>
              </div>
            )}

            {/* Country mode */}
            {bulkRevMode === 'country' && (
              <div className="space-y-3">
                <p className="text-sm text-t2">Select one or more countries:</p>
                <div className="border border-divider rounded-lg max-h-64 overflow-y-auto divide-y divide-divider">
                  {uniqueCountries.map(country => {
                    const count = employees.filter(e => e.country === country).length
                    return (
                      <label key={country} className="flex items-center gap-3 px-4 py-2.5 hover:bg-canvas/50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={bulkRevSelectedCountries.has(country)}
                          onChange={() => toggleBulkRevSet(bulkRevSelectedCountries, setBulkRevSelectedCountries, country)}
                          className="rounded border-divider"
                        />
                        <Globe size={16} className="text-t3" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-t1">{country}</p>
                          <p className="text-xs text-t3">{count} employee{count !== 1 ? 's' : ''}</p>
                        </div>
                      </label>
                    )
                  })}
                </div>
                <p className="text-xs text-t3">{bulkRevTargetEmployees.length} employee{bulkRevTargetEmployees.length !== 1 ? 's' : ''} in selected countries</p>
              </div>
            )}

            {/* Level mode */}
            {bulkRevMode === 'level' && (
              <div className="space-y-3">
                <p className="text-sm text-t2">Select one or more levels:</p>
                <div className="border border-divider rounded-lg max-h-64 overflow-y-auto divide-y divide-divider">
                  {uniqueLevels.map(level => {
                    const count = employees.filter(e => e.level === level).length
                    return (
                      <label key={level} className="flex items-center gap-3 px-4 py-2.5 hover:bg-canvas/50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={bulkRevSelectedLevels.has(level)}
                          onChange={() => toggleBulkRevSet(bulkRevSelectedLevels, setBulkRevSelectedLevels, level)}
                          className="rounded border-divider"
                        />
                        <BarChart3 size={16} className="text-t3" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-t1">{level}</p>
                          <p className="text-xs text-t3">{count} employee{count !== 1 ? 's' : ''}</p>
                        </div>
                      </label>
                    )
                  })}
                </div>
                <p className="text-xs text-t3">{bulkRevTargetEmployees.length} employee{bulkRevTargetEmployees.length !== 1 ? 's' : ''} at selected levels</p>
              </div>
            )}

            {/* All mode */}
            {bulkRevMode === 'all' && (
              <div className="p-6 rounded-lg bg-canvas text-center">
                <Users size={32} className="mx-auto mb-2 text-t3" />
                <p className="text-sm font-medium text-t1">All {employees.length} employees will be included</p>
                <p className="text-xs text-t3 mt-1">Reviews will be created for every employee in the organization.</p>
              </div>
            )}

            {/* Footer */}
            <div className="flex justify-end gap-2 pt-2 border-t border-divider">
              <Button variant="secondary" onClick={resetBulkReview}>Cancel</Button>
              <Button
                onClick={() => setBulkRevStep(2)}
                disabled={bulkRevMode === 'individual' ? bulkRevSelectedEmpIds.size === 0 : bulkRevMode === 'department' ? bulkRevSelectedDepts.size === 0 : bulkRevMode === 'country' ? bulkRevSelectedCountries.size === 0 : bulkRevMode === 'level' ? bulkRevSelectedLevels.size === 0 : false}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {bulkRevStep === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-t2">Configure the review cycle and type for the selected employees.</p>

            {/* Review cycle selection */}
            <div>
              <label className="block text-sm font-medium text-t1 mb-2">Review Cycle</label>
              {reviewCycles.length === 0 && (
                <p className="text-sm text-t3">No review cycles available. Create one first.</p>
              )}
              <div className="space-y-2">
                {reviewCycles.map(cycle => (
                  <label key={cycle.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${bulkRevCycleId === cycle.id ? 'border-tempo-500 bg-tempo-50' : 'border-divider hover:bg-canvas/50'}`}>
                    <input
                      type="radio"
                      name="bulkRevCycle"
                      checked={bulkRevCycleId === cycle.id}
                      onChange={() => setBulkRevCycleId(cycle.id)}
                      className="text-tempo-500"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-t1">{cycle.title}</p>
                      <p className="text-xs text-t3">{cycle.start_date} to {cycle.end_date} &middot; <Badge variant={cycle.status === 'active' ? 'success' : 'orange'}>{cycle.status}</Badge></p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Review type selection */}
            <div>
              <label className="block text-sm font-medium text-t1 mb-2">Review Type</label>
              <div className="flex gap-2">
                {[
                  { value: 'annual', label: 'Annual' },
                  { value: 'mid-year', label: 'Mid-Year' },
                  { value: 'probation', label: 'Probation' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setBulkRevType(opt.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${bulkRevType === opt.value ? 'border-tempo-500 bg-tempo-50 text-tempo-700' : 'border-divider text-t2 hover:bg-canvas/50'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="p-4 rounded-lg bg-canvas border border-divider space-y-2">
              <h4 className="text-sm font-semibold text-t1">Assignment Summary</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-t3">Total selected:</span>
                  <span className="ml-2 font-medium text-t1">{bulkRevSelectedEmployees.length}</span>
                </div>
                <div>
                  <span className="text-t3">New assignments:</span>
                  <span className="ml-2 font-medium text-green-600">{bulkRevNewAssignees.length}</span>
                </div>
                <div>
                  <span className="text-t3">Already assigned:</span>
                  <span className="ml-2 font-medium text-yellow-600">{bulkRevSkipped.length}</span>
                </div>
                <div>
                  <span className="text-t3">Review type:</span>
                  <span className="ml-2 font-medium text-t1">{bulkRevType}</span>
                </div>
              </div>
              {bulkRevSkipped.length > 0 && (
                <p className="text-xs text-yellow-600 mt-1">
                  {bulkRevSkipped.length} employee{bulkRevSkipped.length !== 1 ? 's' : ''} already have a review in this cycle and will be skipped.
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-between gap-2 pt-2 border-t border-divider">
              <Button variant="secondary" onClick={() => setBulkRevStep(1)}>Back</Button>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={resetBulkReview}>Cancel</Button>
                <Button onClick={submitBulkReview} disabled={saving || !bulkRevCycleId || bulkRevNewAssignees.length === 0}>
                  {saving ? 'Saving...' : `Assign ${bulkRevNewAssignees.length} Review${bulkRevNewAssignees.length !== 1 ? 's' : ''}`}
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
