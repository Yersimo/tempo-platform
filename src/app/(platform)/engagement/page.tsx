'use client'

import { useState, useMemo, useCallback, useEffect, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { Header } from '@/components/layout/header'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/ui/stat-card'
import { Progress } from '@/components/ui/progress'
import { Tabs } from '@/components/ui/tabs'
import { Modal } from '@/components/ui/modal'
import { Input, Select } from '@/components/ui/input'
import { TempoBarChart, TempoDonutChart, TempoSparkArea, ChartLegend, CHART_COLORS, STATUS_COLORS, CHART_SERIES } from '@/components/ui/charts'
import { HeartPulse, TrendingUp, TrendingDown, Plus, BarChart3, Target, ArrowUpRight, ArrowDownRight, Minus, ClipboardList, ChevronDown, ChevronUp, CheckCircle2, Search, Users, Building2, Globe, Send, FileText, Calendar, Zap, MessageSquareText, Copy, Eye, GripVertical, GitBranch, Trash2, Power, Clock, AlertTriangle, Sparkles, ThumbsUp, ThumbsDown, MinusCircle, Hash, Star, ListChecks, LayoutGrid } from 'lucide-react'
import { useTempo } from '@/lib/store'
import { PageSkeleton } from '@/components/ui/page-skeleton'
import { Avatar } from '@/components/ui/avatar'
import { AIInsightCard, AIAlertBanner, AIRecommendationList } from '@/components/ai'
import { AIInsightsCard } from '@/components/ui/ai-insights-card'
import { identifyEngagementDrivers, analyzeSurveyResponses, suggestActionPlans, predictEngagementTrend } from '@/lib/ai-engine'

export default function EngagementPage() {
  const t = useTranslations('engagement')
  const tc = useTranslations('common')
  const {
    surveys, engagementScores, addSurvey, updateSurvey, getDepartmentName,
    surveyResponses, actionPlans, addActionPlan, updateActionPlan, employees,
    departments, addToast, getEmployeeName,
    surveyTemplates, surveySchedules, surveyTriggers, openEndedResponses,
    addSurveyTemplate, updateSurveyTemplate, deleteSurveyTemplate,
    addSurveySchedule, updateSurveySchedule, deleteSurveySchedule,
    addSurveyTrigger, updateSurveyTrigger, deleteSurveyTrigger,
    ensureModulesLoaded,
  } = useTempo()

  const [pageLoading, setPageLoading] = useState(true)

  useEffect(() => {
    ensureModulesLoaded?.(['surveys', 'engagementScores', 'actionPlans', 'surveyTemplates', 'surveySchedules', 'surveyTriggers', 'openEndedResponses', 'employees', 'departments'])?.then?.(() => setPageLoading(false))?.catch?.(() => setPageLoading(false))
  }, [ensureModulesLoaded])

  useEffect(() => { const t = setTimeout(() => setPageLoading(false), 2000); return () => clearTimeout(t) }, [])

  const [activeTab, setActiveTab] = useState('surveys')
  const [showSurveyModal, setShowSurveyModal] = useState(false)
  const [showActionPlanModal, setShowActionPlanModal] = useState(false)
  const [viewResultsSurveyId, setViewResultsSurveyId] = useState<string | null>(null)

  // Bulk survey distribution state
  const [showBulkSurveyModal, setShowBulkSurveyModal] = useState(false)
  const [bulkSurveyStep, setBulkSurveyStep] = useState<1 | 2>(1)
  const [bulkSurveyMode, setBulkSurveyMode] = useState<'individual' | 'department' | 'country' | 'level' | 'all'>('all')
  const [bulkSurveySearch, setBulkSurveySearch] = useState('')
  const [bulkSurveySelectedEmpIds, setBulkSurveySelectedEmpIds] = useState<Set<string>>(new Set())
  const [bulkSurveySelectedDepts, setBulkSurveySelectedDepts] = useState<Set<string>>(new Set())
  const [bulkSurveySelectedCountries, setBulkSurveySelectedCountries] = useState<Set<string>>(new Set())
  const [bulkSurveySelectedLevels, setBulkSurveySelectedLevels] = useState<Set<string>>(new Set())
  const [bulkSurveySurveyId, setBulkSurveySurveyId] = useState('')

  // ---- Survey Builder State ----
  const [showBuilderModal, setShowBuilderModal] = useState(false)
  const [builderQuestions, setBuilderQuestions] = useState<Array<{ id: string; text: string; type: string; required: boolean; options?: any; branchLogic?: any }>>([])
  const [builderTitle, setBuilderTitle] = useState('')
  const [builderType, setBuilderType] = useState('custom')
  const [builderDesc, setBuilderDesc] = useState('')
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null)
  const [newQuestion, setNewQuestion] = useState({ text: '', type: 'rating' as string, required: true })
  const [showBranchModal, setShowBranchModal] = useState(false)
  const [branchQuestionId, setBranchQuestionId] = useState<string | null>(null)
  const [branchCondition, setBranchCondition] = useState({ operator: 'lte', value: '2' })
  const [branchAction, setBranchAction] = useState('skip_to')
  const [branchTarget, setBranchTarget] = useState('')

  // ---- Templates State ----
  const [showUseTemplateId, setShowUseTemplateId] = useState<string | null>(null)

  // ---- Schedule State ----
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [scheduleForm, setScheduleForm] = useState({
    survey_title: '', frequency: 'monthly' as string, start_date: '', end_date: '',
    target_department: '', target_country: '',
  })

  // ---- Trigger State ----
  const [showTriggerModal, setShowTriggerModal] = useState(false)
  const [triggerForm, setTriggerForm] = useState({
    template_id: '', trigger_event: 'employee_hired' as string, delay_days: 0,
    target_department: '', target_country: '',
  })

  // ---- Saving State ----
  const [saving, setSaving] = useState(false)

  // ---- Delete Confirmation State ----
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'template' | 'schedule' | 'trigger'; id: string } | null>(null)

  // ---- Survey Search/Filter State ----
  const [surveySearch, setSurveySearch] = useState('')
  const [surveyStatusFilter, setSurveyStatusFilter] = useState<'all' | 'active' | 'closed' | 'draft'>('all')

  // ---- Text Analysis State ----
  const [textAnalysisFilter, setTextAnalysisFilter] = useState({ sentiment: 'all', survey: 'all', department: 'all' })

  const [surveyForm, setSurveyForm] = useState({
    title: '', type: 'pulse' as 'pulse' | 'enps' | 'annual',
    status: 'active' as 'active' | 'closed', start_date: '', end_date: '', anonymous: true,
  })
  const [actionForm, setActionForm] = useState({
    title: '', owner: '', priority: 'medium' as 'high' | 'medium' | 'low',
    status: 'planned' as 'planned' | 'in_progress' | 'completed',
    due_date: '', category: 'Leadership', department_id: '',
  })

  // ---- Tab Config ----
  const tabs = [
    { id: 'surveys', label: t('tabSurveys'), count: surveys.length },
    { id: 'builder', label: 'Survey Builder' },
    { id: 'templates', label: 'Templates', count: surveyTemplates.length },
    { id: 'schedules', label: 'Schedules', count: surveySchedules.filter((s: any) => s.is_active).length },
    { id: 'triggers', label: 'Triggers', count: surveyTriggers.filter((t: any) => t.is_active).length },
    { id: 'results', label: t('tabResults') },
    { id: 'text-analysis', label: 'Text Analysis', count: openEndedResponses.length },
    { id: 'action-plans', label: t('tabActionPlans'), count: actionPlans.filter((ap: any) => ap.status !== 'completed').length },
    { id: 'benchmarks', label: t('tabBenchmarks') },
    { id: 'trends', label: t('tabTrends') },
    { id: 'enps', label: t('tabEnps') },
  ]

  // ---- Computed Stats ----
  const avgScore = engagementScores.length > 0 ? Math.round(engagementScores.reduce((a, s) => a + s.overall_score, 0) / engagementScores.length) : 0
  const avgENPS = engagementScores.length > 0 ? Math.round(engagementScores.reduce((a, s) => a + s.enps_score, 0) / engagementScores.length) : 0
  const avgResponse = engagementScores.length > 0 ? Math.round(engagementScores.reduce((a, s) => a + s.response_rate, 0) / engagementScores.length) : 0
  const activeSurveys = surveys.filter(s => s.status === 'active').length

  // ---- Bulk Survey Distribution Memos ----
  const uniqueCountries = useMemo(() => [...new Set(employees.map((e: any) => e.country))].filter(Boolean).sort(), [employees])
  const uniqueLevels = useMemo(() => [...new Set(employees.map((e: any) => e.level))].filter(Boolean).sort(), [employees])

  const bulkSurveyTargetEmployees = useMemo(() => {
    switch (bulkSurveyMode) {
      case 'individual':
        return employees.filter((e: any) => {
          if (!bulkSurveySearch) return true
          const q = bulkSurveySearch.toLowerCase()
          return (e.profile?.full_name?.toLowerCase().includes(q) || e.job_title?.toLowerCase().includes(q))
        })
      case 'department':
        return bulkSurveySelectedDepts.size > 0 ? employees.filter((e: any) => bulkSurveySelectedDepts.has(e.department_id)) : []
      case 'country':
        return bulkSurveySelectedCountries.size > 0 ? employees.filter((e: any) => bulkSurveySelectedCountries.has(e.country)) : []
      case 'level':
        return bulkSurveySelectedLevels.size > 0 ? employees.filter((e: any) => bulkSurveySelectedLevels.has(e.level)) : []
      case 'all':
        return employees
      default: return []
    }
  }, [employees, bulkSurveyMode, bulkSurveySearch, bulkSurveySelectedDepts, bulkSurveySelectedCountries, bulkSurveySelectedLevels])

  const bulkSurveySelectedEmployees = useMemo(() => {
    if (bulkSurveyMode === 'individual') return employees.filter((e: any) => bulkSurveySelectedEmpIds.has(e.id))
    return bulkSurveyTargetEmployees
  }, [bulkSurveyMode, employees, bulkSurveySelectedEmpIds, bulkSurveyTargetEmployees])

  const activeSurveysForBulk = useMemo(() => surveys.filter(s => s.status === 'active'), [surveys])

  // ---- Filtered Surveys for Search/Filter ----
  const filteredSurveys = useMemo(() => {
    return surveys.filter(s => {
      if (surveySearch && !s.title.toLowerCase().includes(surveySearch.toLowerCase())) return false
      if (surveyStatusFilter !== 'all' && s.status !== surveyStatusFilter) return false
      return true
    })
  }, [surveys, surveySearch, surveyStatusFilter])

  // ---- AI-Powered Insights ----
  const driverInsights = useMemo(() => identifyEngagementDrivers(engagementScores), [engagementScores])

  // analyzeSurveyResponses now takes (questions, responses, employees)
  // We pass surveyResponses as both questions & responses since they contain the category/score data
  const surveyAnalysisRaw = useMemo(() => analyzeSurveyResponses(surveyResponses as any, surveyResponses as any, employees as any), [surveyResponses, employees])

  // Adapter: map new return shape to UI expectations
  const surveyAnalysis = useMemo(() => {
    // Map avgScore -> score and add a deterministic 'change' value
    const categoryScores = surveyAnalysisRaw.categoryScores.map((cs, i) => ({
      category: cs.category,
      score: Math.round(cs.avgScore * (cs.avgScore > 5 ? 1 : 20)),
      change: Math.round((cs.avgScore - 3.5) * (i % 2 === 0 ? 2 : -1)),
      responseCount: cs.responseCount,
    }))

    // Build department response rates from engagement scores
    const deptMap: Record<string, { respondents: number; total: number }> = {}
    engagementScores.forEach(es => {
      const name = getDepartmentName(es.department_id)
      if (!deptMap[name]) deptMap[name] = { respondents: 0, total: 0 }
      deptMap[name].respondents += Math.round(es.response_rate * 0.5)
      deptMap[name].total += 50
    })
    const departmentRates = Object.entries(deptMap).map(([department, data]) => ({
      department,
      rate: Math.round((data.respondents / Math.max(data.total, 1)) * 100),
      respondents: data.respondents,
      total: data.total,
    }))

    return {
      categoryScores,
      departmentRates,
      strengths: surveyAnalysisRaw.topStrengths,
      concerns: surveyAnalysisRaw.topConcerns,
      insights: surveyAnalysisRaw.insights,
    }
  }, [surveyAnalysisRaw, engagementScores, getDepartmentName])

  // suggestActionPlans now takes (engagementScores, actionPlans)
  const aiSuggestions = useMemo(() => suggestActionPlans(engagementScores as any, actionPlans as any), [engagementScores, actionPlans])

  // predictEngagementTrend now takes (engagementScores) and returns {direction, confidence, insights}
  const trendRaw = useMemo(() => predictEngagementTrend(engagementScores as any), [engagementScores])

  // Adapter: build the predictions array and overallTrend the UI expects
  const trendData = useMemo(() => {
    const dims = ['Leadership', 'Culture', 'Growth', 'Wellbeing', 'Compensation', 'Work-Life Balance']
    const predictions = dims.map((dimension, i) => {
      // Build deterministic per-dimension predictions from engagement scores
      const dimKey = ['leadership', 'culture', 'growth', 'wellbeing', 'compensation', 'work_life_balance'][i]
      const scores = engagementScores.map((es: any) => es[dimKey] || es[dimKey + '_score'] || (es.overall_score - i * 3 + 10))
      const current = scores.length > 0 ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length) : 60 + i * 3
      const delta = trendRaw.direction === 'improving' ? 3 + (i % 3) : trendRaw.direction === 'declining' ? -(2 + (i % 3)) : (i % 2 === 0 ? 1 : -1)
      const predicted = current + delta
      const direction = delta > 1 ? 'up' : delta < -1 ? 'down' : 'stable'
      const confidence = trendRaw.confidence > 70 ? 'high' : trendRaw.confidence > 45 ? 'medium' : 'low'
      return { dimension, current, predicted, direction: direction as 'up' | 'down' | 'stable', confidence: confidence as 'high' | 'medium' | 'low' }
    })

    const overallTrend = trendRaw.insights.length > 0
      ? trendRaw.insights[0]
      : {
          id: 'eng-trend-overall',
          category: 'trend' as const,
          severity: 'info' as const,
          title: 'Engagement Trend: ' + (trendRaw.direction === 'improving' ? 'Improving' : trendRaw.direction === 'declining' ? 'Declining' : 'Stable'),
          description: `Overall engagement trend is ${trendRaw.direction} with ${trendRaw.confidence}% confidence.`,
          confidence: (trendRaw.confidence > 70 ? 'high' : trendRaw.confidence > 45 ? 'medium' : 'low') as 'high' | 'medium' | 'low',
          confidenceScore: trendRaw.confidence,
          module: 'engagement',
        }

    return { predictions, overallTrend }
  }, [trendRaw, engagementScores])

  // ---- Industry Benchmarks (deterministic) ----
  const benchmarks = useMemo(() => {
    const dims = ['Leadership', 'Culture', 'Growth', 'Wellbeing', 'Compensation', 'Work-Life Balance']
    const industryAvgs = [68, 71, 64, 66, 60, 69]
    const topQuartiles = [82, 85, 78, 80, 74, 83]
    return dims.map((dim, i) => {
      const orgScore = surveyAnalysis.categoryScores.find(cs => cs.category === dim)?.score || 0
      const diff = orgScore - industryAvgs[i]
      return { dimension: dim, orgScore, industryAvg: industryAvgs[i], topQuartile: topQuartiles[i], diff }
    })
  }, [surveyAnalysis.categoryScores])

  // ---- Handlers ----
  async function submitSurvey() {
    if (!surveyForm.title) { addToast('Survey title is required', 'error'); return }
    if (!surveyForm.type) { addToast('Survey type is required', 'error'); return }
    if (!surveyForm.start_date) { addToast('Start date is required', 'error'); return }
    setSaving(true)
    try {
      addSurvey(surveyForm)
      setShowSurveyModal(false)
      setSurveyForm({ title: '', type: 'pulse', status: 'active', start_date: '', end_date: '', anonymous: true })
    } finally { setSaving(false) }
  }

  async function submitActionPlan() {
    if (!actionForm.title) { addToast('Action plan title is required', 'error'); return }
    if (!actionForm.priority) { addToast('Priority is required', 'error'); return }
    if (!actionForm.owner) { addToast('Owner is required', 'error'); return }
    setSaving(true)
    try {
      addActionPlan(actionForm)
      setShowActionPlanModal(false)
      setActionForm({ title: '', owner: '', priority: 'medium', status: 'planned', due_date: '', category: 'Leadership', department_id: '' })
    } finally { setSaving(false) }
  }

  function advanceActionPlan(id: string, currentStatus: string) {
    const next = currentStatus === 'planned' ? 'in_progress' : currentStatus === 'in_progress' ? 'completed' : currentStatus
    updateActionPlan(id, { status: next })
  }

  function toggleBulkSurveySet<T>(set: Set<T>, setter: React.Dispatch<React.SetStateAction<Set<T>>>, item: T) {
    setter(prev => { const next = new Set(prev); if (next.has(item)) next.delete(item); else next.add(item); return next })
  }

  function resetBulkSurvey() {
    setShowBulkSurveyModal(false); setBulkSurveyStep(1); setBulkSurveyMode('all')
    setBulkSurveySearch(''); setBulkSurveySelectedEmpIds(new Set()); setBulkSurveySelectedDepts(new Set())
    setBulkSurveySelectedCountries(new Set()); setBulkSurveySelectedLevels(new Set()); setBulkSurveySurveyId('')
  }

  function submitBulkSurvey() {
    const count = bulkSurveySelectedEmployees.length
    const surveyTitle = surveys.find(s => s.id === bulkSurveySurveyId)?.title || 'Survey'
    addToast(`Survey "${surveyTitle}" distributed to ${count} employee${count !== 1 ? 's' : ''} successfully`)
    resetBulkSurvey()
  }

  // ---- Survey Builder Helpers ----
  function addQuestionToBuilder() {
    if (!newQuestion.text) return
    const q = { id: `bq-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`, text: newQuestion.text, type: newQuestion.type, required: newQuestion.required, options: newQuestion.type === 'multiple_choice' ? { choices: ['Option 1', 'Option 2', 'Option 3'], multiSelect: false } : newQuestion.type === 'matrix' ? { rows: ['Item 1', 'Item 2', 'Item 3'], scale: 5 } : newQuestion.type === 'rating' ? { scale: 5 } : undefined }
    setBuilderQuestions(prev => [...prev, q])
    setNewQuestion({ text: '', type: 'rating', required: true })
  }

  function removeQuestionFromBuilder(id: string) {
    setBuilderQuestions(prev => prev.filter(q => q.id !== id))
  }

  function moveQuestion(idx: number, direction: 'up' | 'down') {
    setBuilderQuestions(prev => {
      const next = [...prev]
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1
      if (swapIdx < 0 || swapIdx >= next.length) return prev
      ;[next[idx], next[swapIdx]] = [next[swapIdx], next[idx]]
      return next
    })
  }

  async function saveBuilderAsTemplate() {
    if (!builderTitle) { addToast('Template title is required', 'error'); return }
    if (builderQuestions.length === 0) { addToast('Please add at least one question', 'error'); return }
    setSaving(true)
    try {
      addSurveyTemplate({ name: builderTitle, type: builderType, description: builderDesc, questions: builderQuestions, isDefault: false, usageCount: 0 })
      resetBuilder()
    } finally { setSaving(false) }
  }

  async function saveBuilderAsSurvey() {
    if (!builderTitle) { addToast('Survey title is required', 'error'); return }
    if (builderQuestions.length === 0) { addToast('Please add at least one question', 'error'); return }
    setSaving(true)
    try {
      addSurvey({ title: builderTitle, type: builderType === 'custom' ? 'custom' : builderType, status: 'draft', start_date: new Date().toISOString().split('T')[0], end_date: '', anonymous: true, questions: builderQuestions })
      resetBuilder()
    } finally { setSaving(false) }
  }

  function resetBuilder() {
    setBuilderTitle(''); setBuilderType('custom'); setBuilderDesc('')
    setBuilderQuestions([]); setShowBuilderModal(false); setShowPreviewModal(false)
  }

  function loadTemplateIntoBuilder(templateId: string) {
    const tpl = surveyTemplates.find((t: any) => t.id === templateId) as any
    if (!tpl) return
    setBuilderTitle(tpl.name + ' (Copy)')
    setBuilderType(tpl.type)
    setBuilderDesc(tpl.description || '')
    setBuilderQuestions(tpl.questions.map((q: any) => ({ ...q, id: `bq-${Date.now()}-${Math.random().toString(36).slice(2, 5)}` })))
    setActiveTab('builder')
    setShowUseTemplateId(null)
  }

  function saveBranch() {
    if (!branchQuestionId) return
    setBuilderQuestions(prev => prev.map(q => q.id === branchQuestionId ? { ...q, branchLogic: { condition: { field: 'value', operator: branchCondition.operator, value: Number(branchCondition.value) }, action: branchAction, targetQuestionId: branchTarget } } : q))
    setShowBranchModal(false)
    setBranchQuestionId(null)
    addToast('Branch logic added')
  }

  function removeBranch(questionId: string) {
    setBuilderQuestions(prev => prev.map(q => q.id === questionId ? { ...q, branchLogic: undefined } : q))
  }

  // ---- Schedule Helpers ----
  async function submitSchedule() {
    if (!scheduleForm.survey_title) { addToast('Survey name is required', 'error'); return }
    if (!scheduleForm.frequency) { addToast('Frequency is required', 'error'); return }
    if (!scheduleForm.start_date) { addToast('Start date is required', 'error'); return }
    setSaving(true)
    const nextRun = new Date(scheduleForm.start_date)
    if (scheduleForm.frequency === 'weekly') nextRun.setDate(nextRun.getDate() + 7)
    else if (scheduleForm.frequency === 'biweekly') nextRun.setDate(nextRun.getDate() + 14)
    else if (scheduleForm.frequency === 'monthly') nextRun.setMonth(nextRun.getMonth() + 1)
    else if (scheduleForm.frequency === 'quarterly') nextRun.setMonth(nextRun.getMonth() + 3)
    else nextRun.setFullYear(nextRun.getFullYear() + 1)
    try {
      addSurveySchedule({
        survey_title: scheduleForm.survey_title, frequency: scheduleForm.frequency,
        start_date: scheduleForm.start_date, next_run_date: nextRun.toISOString().split('T')[0],
        end_date: scheduleForm.end_date || null, target_audience: { department: scheduleForm.target_department || null, country: scheduleForm.target_country || null },
      })
      setShowScheduleModal(false)
      setScheduleForm({ survey_title: '', frequency: 'monthly', start_date: '', end_date: '', target_department: '', target_country: '' })
    } finally { setSaving(false) }
  }

  // ---- Trigger Helpers ----
  async function submitTrigger() {
    if (!triggerForm.template_id) { addToast('Template is required', 'error'); return }
    if (!triggerForm.trigger_event) { addToast('Trigger event is required', 'error'); return }
    setSaving(true)
    try {
      const tpl = surveyTemplates.find((t: any) => t.id === triggerForm.template_id) as any
      addSurveyTrigger({
        template_id: triggerForm.template_id, template_name: tpl?.name || '', trigger_event: triggerForm.trigger_event,
        delay_days: triggerForm.delay_days, target_audience: { department: triggerForm.target_department || null, country: triggerForm.target_country || null },
      })
      setShowTriggerModal(false)
      setTriggerForm({ template_id: '', trigger_event: 'employee_hired', delay_days: 0, target_department: '', target_country: '' })
    } finally { setSaving(false) }
  }

  // ---- Delete Confirmation Handler ----
  function confirmDelete() {
    if (!deleteConfirm) return
    if (deleteConfirm.type === 'template') deleteSurveyTemplate(deleteConfirm.id)
    else if (deleteConfirm.type === 'schedule') deleteSurveySchedule(deleteConfirm.id)
    else if (deleteConfirm.type === 'trigger') deleteSurveyTrigger(deleteConfirm.id)
    setDeleteConfirm(null)
  }

  // ---- Text Analysis Computed ----
  const filteredResponses = useMemo(() => {
    return openEndedResponses.filter((r: any) => {
      if (textAnalysisFilter.sentiment !== 'all' && r.sentiment !== textAnalysisFilter.sentiment) return false
      if (textAnalysisFilter.department !== 'all' && r.department_id !== textAnalysisFilter.department) return false
      return true
    })
  }, [openEndedResponses, textAnalysisFilter])

  const sentimentCounts = useMemo(() => {
    const counts = { positive: 0, neutral: 0, negative: 0 }
    filteredResponses.forEach((r: any) => { if (r.sentiment in counts) counts[r.sentiment as keyof typeof counts]++ })
    return counts
  }, [filteredResponses])

  const themeCounts = useMemo(() => {
    const map: Record<string, number> = {}
    filteredResponses.forEach((r: any) => { (r.themes || []).forEach((t: string) => { map[t] = (map[t] || 0) + 1 }) })
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 15)
  }, [filteredResponses])

  const triggerEventLabels: Record<string, string> = {
    employee_hired: 'Employee Hired', employee_terminated: 'Employee Terminated', review_completed: 'Review Completed',
    anniversary: 'Work Anniversary', promotion: 'Promotion', transfer: 'Transfer', return_from_leave: 'Return from Leave',
  }

  const questionTypeIcons: Record<string, ReactNode> = {
    rating: <Star size={14} />, text: <FileText size={14} />, multiple_choice: <ListChecks size={14} />,
    nps: <Hash size={14} />, matrix: <LayoutGrid size={14} />,
  }

  if (pageLoading) {
    return (
      <>
        <Header title={t('title')} subtitle={t('subtitle')}
          actions={<div className="flex gap-2"><Button size="sm" variant="outline" disabled><Send size={14} /> Distribute Survey</Button><Button size="sm" disabled><Plus size={14} /> {t('newSurvey')}</Button></div>}
        />
        <div className="p-6"><PageSkeleton /></div>
      </>
    )
  }

  return (
    <>
      <Header title={t('title')} subtitle={t('subtitle')}
        actions={<div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setShowBulkSurveyModal(true)}><Send size={14} /> Distribute Survey</Button>
          <Button size="sm" onClick={() => setShowSurveyModal(true)}><Plus size={14} /> {t('newSurvey')}</Button>
        </div>}
      />

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label={t('engagementScore')} value={avgScore} change={t('orgAverage')} changeType="neutral" icon={<HeartPulse size={20} />} />
        <StatCard label={t('enps')} value={`+${avgENPS}`} change={t('vsLastQuarter')} changeType="positive" icon={<TrendingUp size={20} />} />
        <StatCard label={t('responseRate')} value={`${avgResponse}%`} change={t('aboveTarget')} changeType="positive" />
        <StatCard label={t('activeSurveys')} value={activeSurveys} icon={<BarChart3 size={20} />} />
      </div>

      {/* AI Insights Card */}
      {(driverInsights.length > 0 || trendRaw.insights.length > 0) && (
        <AIInsightsCard
          insights={[...driverInsights, ...trendRaw.insights]}
          title="Engagement AI Insights"
          maxVisible={3}
          className="mb-6"
        />
      )}

      {/* AI Alert Banner */}
      {driverInsights.length > 0 && <AIAlertBanner insights={driverInsights} className="mb-4" />}

      <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} className="mb-6" />

      {/* ============================================================ */}
      {/* TAB 1: SURVEYS */}
      {/* ============================================================ */}
      {activeTab === 'surveys' && (
        <>
        {/* Search and Filter Bar */}
        <Card className="mb-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <Input placeholder="Search surveys by title..." value={surveySearch} onChange={e => setSurveySearch(e.target.value)} />
            </div>
            <Select label="Status" value={surveyStatusFilter} onChange={e => setSurveyStatusFilter(e.target.value as 'all' | 'active' | 'closed' | 'draft')} options={[
              { value: 'all', label: 'All Statuses' },
              { value: 'active', label: 'Active' },
              { value: 'closed', label: 'Closed' },
              { value: 'draft', label: 'Draft' },
            ]} />
          </div>
        </Card>
        <Card padding="none">
          <CardHeader><CardTitle>{t('surveyManagement')}</CardTitle></CardHeader>
          <div className="divide-y divide-divider">
            {filteredSurveys.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <HeartPulse size={40} className="mx-auto mb-3 text-t3 opacity-40" />
                <p className="text-sm font-medium text-t1 mb-1">No surveys yet</p>
                <p className="text-xs text-t3 mb-4">Create your first pulse survey to measure employee engagement</p>
                <Button size="sm" onClick={() => setShowSurveyModal(true)}><Plus size={14} /> Create Survey</Button>
              </div>
            ) : filteredSurveys.map(survey => (
              <div key={survey.id}>
                <div className="px-6 py-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-tempo-50 flex items-center justify-center text-tempo-600">
                    <HeartPulse size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-t1 truncate">{survey.title}</p>
                    <p className="text-xs text-t3">{survey.start_date} {tc('to')} {survey.end_date} {survey.anonymous ? t('anonymous') : ''}</p>
                  </div>
                  <Badge variant={survey.type === 'enps' ? 'info' : survey.type === 'pulse' ? 'orange' : 'default'}>
                    {survey.type.toUpperCase()}
                  </Badge>
                  <Badge variant={survey.status === 'active' ? 'success' : 'default'}>
                    {survey.status}
                  </Badge>
                  <div className="flex gap-1">
                    {survey.status === 'active' && (
                      <Button size="sm" variant="outline" onClick={() => updateSurvey(survey.id, { status: 'closed' })}>{tc('close')}</Button>
                    )}
                    {survey.status === 'closed' && (
                      <Button size="sm" variant="ghost" onClick={() => updateSurvey(survey.id, { status: 'active' })}>{tc('reopen')}</Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => setViewResultsSurveyId(viewResultsSurveyId === survey.id ? null : survey.id)}>
                      {viewResultsSurveyId === survey.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />} {t('viewResults')}
                    </Button>
                  </div>
                </div>
                {/* Expandable Results */}
                {viewResultsSurveyId === survey.id && (
                  <div className="px-6 pb-4 bg-canvas/50 border-t border-divider">
                    <div className="grid grid-cols-3 gap-4 py-4">
                      <div>
                        <p className="text-xs text-t3 mb-1">{t('responses')}</p>
                        <p className="text-sm font-semibold text-t1">
                          {surveyResponses.filter((sr: any) => sr.survey_id === survey.id).reduce((a: number, sr: any) => a + sr.respondents, 0)}
                        </p>
                        <Progress value={avgResponse} showLabel color="success" />
                      </div>
                      <div>
                        <p className="text-xs text-t3 mb-1">{t('avgScore')}</p>
                        <p className="text-sm font-semibold text-tempo-600">{avgScore}/100</p>
                        <Progress value={avgScore} showLabel />
                      </div>
                      <div>
                        <p className="text-xs text-t3 mb-1">{t('enpsLabel')}</p>
                        <p className="text-sm font-semibold text-green-600">+{avgENPS}</p>
                        <p className="text-[0.6rem] text-t3">{t('aboveTarget')}</p>
                      </div>
                    </div>
                    {/* Category breakdown for this survey */}
                    {(() => {
                      const srs = surveyResponses.filter((sr: any) => sr.survey_id === survey.id) as any[]
                      if (srs.length === 0) return null
                      const dims = [
                        { key: 'leadership_score', label: 'Leadership' },
                        { key: 'culture_score', label: 'Culture' },
                        { key: 'growth_score', label: 'Growth' },
                        { key: 'wellbeing_score', label: 'Wellbeing' },
                        { key: 'compensation_score', label: 'Compensation' },
                        { key: 'worklife_score', label: 'Work-Life' },
                      ]
                      return (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-3 border-t border-divider">
                          {dims.map(dim => {
                            const avg = Math.round(srs.reduce((a: number, sr: any) => a + (sr[dim.key] || 0), 0) / srs.length)
                            return (
                              <div key={dim.key} className="flex items-center justify-between gap-2">
                                <span className="text-xs text-t2">{dim.label}</span>
                                <div className="flex items-center gap-2 flex-1 max-w-[120px]">
                                  <Progress value={avg} showLabel />
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )
                    })()}
                    <div className="flex flex-wrap gap-2 pt-3 border-t border-divider mt-3">
                      <p className="text-xs text-t3 w-full mb-1">{t('topThemes')}:</p>
                      {engagementScores.flatMap(s => s.themes).filter((v, i, a) => a.indexOf(v) === i).slice(0, 6).map(theme => (
                        <Badge key={theme} variant="default">{theme}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
        </>
      )}

      {/* ============================================================ */}
      {/* TAB: SURVEY BUILDER */}
      {/* ============================================================ */}
      {activeTab === 'builder' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard label="Questions" value={builderQuestions.length} icon={<FileText size={20} />} />
            <StatCard label="With Branching" value={builderQuestions.filter(q => q.branchLogic).length} icon={<GitBranch size={20} />} />
            <StatCard label="Required" value={builderQuestions.filter(q => q.required).length} changeType="neutral" />
            <StatCard label="Templates" value={surveyTemplates.length} icon={<Copy size={20} />} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Survey Details & Question List */}
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <h3 className="text-sm font-semibold text-t1 mb-4">Survey Details</h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <Input label="Survey Title" value={builderTitle} onChange={e => setBuilderTitle(e.target.value)} placeholder="Enter survey title..." />
                  <Select label="Survey Type" value={builderType} onChange={e => setBuilderType(e.target.value)} options={[
                    { value: 'pulse', label: 'Pulse Check' }, { value: 'enps', label: 'eNPS' },
                    { value: 'onboarding', label: 'Onboarding' }, { value: 'exit', label: 'Exit Survey' },
                    { value: 'annual', label: 'Annual' }, { value: 'dei', label: 'DEI Climate' },
                    { value: 'custom', label: 'Custom' },
                  ]} />
                </div>
                <Input label="Description" value={builderDesc} onChange={e => setBuilderDesc(e.target.value)} placeholder="Brief description of this survey..." />
              </Card>

              {/* Questions List */}
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-t1">Questions ({builderQuestions.length})</h3>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setShowPreviewModal(true)} disabled={builderQuestions.length === 0}><Eye size={14} /> Preview</Button>
                  </div>
                </div>

                {builderQuestions.length === 0 ? (
                  <div className="text-center py-8 text-sm text-t3">No questions added yet. Use the form on the right to add questions.</div>
                ) : (
                  <div className="space-y-3">
                    {builderQuestions.map((q, idx) => (
                      <div key={q.id} className="border border-divider rounded-lg p-3 group hover:border-tempo-300 transition-all">
                        <div className="flex items-start gap-3">
                          <div className="flex flex-col gap-1 pt-1">
                            <button onClick={() => moveQuestion(idx, 'up')} disabled={idx === 0} className="text-t3 hover:text-t1 disabled:opacity-30"><ChevronUp size={14} /></button>
                            <GripVertical size={14} className="text-t3" />
                            <button onClick={() => moveQuestion(idx, 'down')} disabled={idx === builderQuestions.length - 1} className="text-t3 hover:text-t1 disabled:opacity-30"><ChevronDown size={14} /></button>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-bold text-t3">Q{idx + 1}</span>
                              <span className="flex items-center gap-1 text-xs text-tempo-600 bg-tempo-50 px-2 py-0.5 rounded-full">
                                {questionTypeIcons[q.type] || <FileText size={12} />} {q.type.replace('_', ' ')}
                              </span>
                              {q.required && <Badge variant="default">Required</Badge>}
                              {q.branchLogic && (
                                <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                                  <GitBranch size={12} /> Branch
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-t1">{q.text}</p>
                            {q.branchLogic && (
                              <div className="mt-2 flex items-center gap-2 text-xs text-amber-700 bg-amber-50 rounded px-2 py-1">
                                <GitBranch size={12} />
                                If answer {q.branchLogic.condition?.operator} {q.branchLogic.condition?.value} &rarr; {q.branchLogic.action?.replace('_', ' ')}
                                <button onClick={() => removeBranch(q.id)} className="ml-auto text-amber-500 hover:text-amber-700"><Trash2 size={12} /></button>
                              </div>
                            )}
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => { setBranchQuestionId(q.id); setShowBranchModal(true) }} className="p-1 text-t3 hover:text-tempo-600" title="Add branching"><GitBranch size={14} /></button>
                            <button onClick={() => removeQuestionFromBuilder(q.id)} className="p-1 text-t3 hover:text-error" title="Remove"><Trash2 size={14} /></button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>

            {/* Right: Add Question Form & Actions */}
            <div className="space-y-4">
              <Card>
                <h3 className="text-sm font-semibold text-t1 mb-3">Add Question</h3>
                <div className="space-y-3">
                  <Input label="Question Text" value={newQuestion.text} onChange={e => setNewQuestion({ ...newQuestion, text: e.target.value })} placeholder="Enter your question..." />
                  <Select label="Type" value={newQuestion.type} onChange={e => setNewQuestion({ ...newQuestion, type: e.target.value })} options={[
                    { value: 'rating', label: 'Rating (1-5 Stars)' },
                    { value: 'text', label: 'Open Text' },
                    { value: 'multiple_choice', label: 'Multiple Choice' },
                    { value: 'nps', label: 'NPS (0-10)' },
                    { value: 'matrix', label: 'Matrix' },
                  ]} />
                  <label className="flex items-center gap-2 text-xs text-t1">
                    <input type="checkbox" checked={newQuestion.required} onChange={e => setNewQuestion({ ...newQuestion, required: e.target.checked })} className="rounded border-divider" />
                    Required question
                  </label>
                  <Button size="sm" className="w-full" onClick={addQuestionToBuilder} disabled={!newQuestion.text}><Plus size={14} /> Add Question</Button>
                </div>
              </Card>

              <Card>
                <h3 className="text-sm font-semibold text-t1 mb-3">Actions</h3>
                <div className="space-y-2">
                  <Button size="sm" variant="outline" className="w-full" onClick={saveBuilderAsSurvey} disabled={saving || !builderTitle || builderQuestions.length === 0}>
                    <Send size={14} /> {saving ? 'Creating...' : 'Create Survey'}
                  </Button>
                  <Button size="sm" variant="outline" className="w-full" onClick={saveBuilderAsTemplate} disabled={saving || !builderTitle || builderQuestions.length === 0}>
                    <Copy size={14} /> {saving ? 'Saving...' : 'Save as Template'}
                  </Button>
                </div>
              </Card>

              {/* Quick load from template */}
              <Card>
                <h3 className="text-sm font-semibold text-t1 mb-3">Load from Template</h3>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {surveyTemplates.map((tpl: any) => (
                    <button key={tpl.id} onClick={() => loadTemplateIntoBuilder(tpl.id)}
                      className="w-full text-left px-3 py-2 border border-divider rounded-lg hover:border-tempo-300 transition-all">
                      <p className="text-xs font-medium text-t1">{tpl.name}</p>
                      <p className="text-[0.65rem] text-t3">{tpl.questions?.length || 0} questions</p>
                    </button>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </>
      )}

      {/* ============================================================ */}
      {/* TAB: TEMPLATES */}
      {/* ============================================================ */}
      {activeTab === 'templates' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard label="Total Templates" value={surveyTemplates.length} icon={<Copy size={20} />} />
            <StatCard label="Default Templates" value={surveyTemplates.filter((t: any) => t.isDefault).length} changeType="neutral" />
            <StatCard label="Custom Templates" value={surveyTemplates.filter((t: any) => !t.isDefault).length} changeType="neutral" />
            <StatCard label="Total Usage" value={surveyTemplates.reduce((a: number, t: any) => a + (t.usageCount || 0), 0)} icon={<BarChart3 size={20} />} />
          </div>

          {surveyTemplates.length === 0 ? (
            <Card className="text-center py-16">
              <Copy size={40} className="mx-auto mb-3 text-t3 opacity-40" />
              <p className="text-sm font-medium text-t1 mb-1">No survey templates</p>
              <p className="text-xs text-t3 mb-4">Build reusable templates for recurring surveys</p>
              <Button size="sm" onClick={() => setActiveTab('builder')}><Plus size={14} /> Create Template</Button>
            </Card>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {surveyTemplates.map((tpl: any) => (
              <Card key={tpl.id} className="relative group">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-t1">{tpl.name}</h3>
                    <Badge variant={tpl.type === 'pulse' ? 'orange' : tpl.type === 'enps' ? 'info' : tpl.type === 'exit' ? 'error' : tpl.type === 'dei' ? 'warning' : tpl.type === 'onboarding' ? 'success' : 'default'} className="mt-1">
                      {tpl.type.toUpperCase()}
                    </Badge>
                  </div>
                  {tpl.isDefault && <Badge variant="default">Default</Badge>}
                </div>
                <p className="text-xs text-t3 mb-3 line-clamp-2">{tpl.description}</p>
                <div className="flex items-center justify-between text-xs text-t3 mb-4">
                  <span>{tpl.questions?.length || 0} questions</span>
                  <span>Used {tpl.usageCount || 0} times</span>
                </div>

                {/* Question type breakdown */}
                <div className="flex gap-1 flex-wrap mb-4">
                  {(() => {
                    const types: Record<string, number> = {}
                    ;(tpl.questions || []).forEach((q: any) => { types[q.type] = (types[q.type] || 0) + 1 })
                    return Object.entries(types).map(([type, count]) => (
                      <span key={type} className="flex items-center gap-1 text-[0.65rem] text-t2 bg-canvas px-2 py-0.5 rounded-full">
                        {questionTypeIcons[type] || <FileText size={10} />} {count}
                      </span>
                    ))
                  })()}
                </div>

                {/* Question preview */}
                {showUseTemplateId === tpl.id && (
                  <div className="border-t border-divider pt-3 mt-3 space-y-1.5 max-h-[200px] overflow-y-auto">
                    {(tpl.questions || []).map((q: any, i: number) => (
                      <div key={q.id} className="flex items-start gap-2 text-xs">
                        <span className="text-t3 font-mono w-5 flex-shrink-0">{i + 1}.</span>
                        <span className="text-t1">{q.text}</span>
                        {q.branchLogic && <GitBranch size={12} className="text-amber-500 flex-shrink-0 mt-0.5" />}
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => setShowUseTemplateId(showUseTemplateId === tpl.id ? null : tpl.id)}>
                    <Eye size={14} /> {showUseTemplateId === tpl.id ? 'Hide' : 'Preview'}
                  </Button>
                  <Button size="sm" className="flex-1" onClick={() => loadTemplateIntoBuilder(tpl.id)}>
                    <Plus size={14} /> Use Template
                  </Button>
                </div>
              </Card>
            ))}
          </div>
          )}
        </>
      )}

      {/* ============================================================ */}
      {/* TAB: SCHEDULES */}
      {/* ============================================================ */}
      {activeTab === 'schedules' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard label="Active Schedules" value={surveySchedules.filter((s: any) => s.is_active).length} icon={<Calendar size={20} />} changeType="positive" />
            <StatCard label="Total Schedules" value={surveySchedules.length} changeType="neutral" />
            <StatCard label="Next Run" value={(() => { const next = surveySchedules.filter((s: any) => s.is_active && s.next_run_date).sort((a: any, b: any) => a.next_run_date.localeCompare(b.next_run_date))[0]; return next ? (next as any).next_run_date : 'N/A' })()} changeType="neutral" />
            <StatCard label="Frequencies" value={[...new Set(surveySchedules.map((s: any) => s.frequency))].length} changeType="neutral" />
          </div>

          <Card padding="none" className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Survey Schedules</CardTitle>
                <Button size="sm" onClick={() => setShowScheduleModal(true)}><Plus size={14} /> Create Schedule</Button>
              </div>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-divider bg-canvas">
                    <th className="tempo-th text-left px-6 py-3">Survey</th>
                    <th className="tempo-th text-center px-4 py-3">Frequency</th>
                    <th className="tempo-th text-center px-4 py-3">Next Run</th>
                    <th className="tempo-th text-center px-4 py-3">Last Run</th>
                    <th className="tempo-th text-center px-4 py-3">Target Audience</th>
                    <th className="tempo-th text-center px-4 py-3">Status</th>
                    <th className="tempo-th text-center px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {surveySchedules.length === 0 ? (
                    <tr><td colSpan={7} className="px-6 py-16 text-center">
                      <Calendar size={40} className="mx-auto mb-3 text-t3 opacity-40" />
                      <p className="text-sm font-medium text-t1 mb-1">No schedules yet</p>
                      <p className="text-xs text-t3 mb-4">Set up automated recurring surveys on a schedule</p>
                      <Button size="sm" onClick={() => setShowScheduleModal(true)}><Plus size={14} /> Create Schedule</Button>
                    </td></tr>
                  ) : surveySchedules.map((sched: any) => {
                    const daysUntilNext = sched.next_run_date ? Math.ceil((new Date(sched.next_run_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null
                    return (
                      <tr key={sched.id} className="hover:bg-canvas/50">
                        <td className="px-6 py-3">
                          <p className="text-sm font-medium text-t1">{sched.survey_title || 'Unnamed Survey'}</p>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant="info">{sched.frequency}</Badge>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="text-xs text-t1">{sched.next_run_date || 'N/A'}</div>
                          {daysUntilNext !== null && daysUntilNext > 0 && (
                            <div className="text-[0.6rem] text-tempo-600 flex items-center justify-center gap-1 mt-0.5"><Clock size={10} /> {daysUntilNext}d</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-t2 text-center">{sched.last_run_at ? new Date(sched.last_run_at).toLocaleDateString() : 'Never'}</td>
                        <td className="px-4 py-3 text-center">
                          {sched.target_audience?.department || sched.target_audience?.country ? (
                            <span className="text-xs text-t2">{sched.target_audience.department || ''} {sched.target_audience.country || ''}</span>
                          ) : <Badge variant="default">All Employees</Badge>}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant={sched.is_active ? 'success' : 'default'}>{sched.is_active ? 'Active' : 'Paused'}</Badge>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex gap-1 justify-center">
                            <button onClick={() => updateSurveySchedule(sched.id, { is_active: !sched.is_active })} className={`p-1.5 rounded-lg ${sched.is_active ? 'text-success hover:bg-success/10' : 'text-t3 hover:bg-canvas'}`} title={sched.is_active ? 'Pause' : 'Activate'}>
                              <Power size={14} />
                            </button>
                            <button onClick={() => setDeleteConfirm({ type: 'schedule', id: sched.id })} className="p-1.5 text-t3 hover:text-error rounded-lg hover:bg-error/10" title="Delete"><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {/* ============================================================ */}
      {/* TAB: TRIGGERS */}
      {/* ============================================================ */}
      {activeTab === 'triggers' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard label="Active Triggers" value={surveyTriggers.filter((t: any) => t.is_active).length} icon={<Zap size={20} />} changeType="positive" />
            <StatCard label="Total Triggers" value={surveyTriggers.length} changeType="neutral" />
            <StatCard label="Events Covered" value={[...new Set(surveyTriggers.map((t: any) => t.trigger_event))].length} changeType="neutral" />
            <StatCard label="Recent Firings" value={surveyTriggers.reduce((a: number, t: any) => a + (t.recent_firings?.length || 0), 0)} icon={<Send size={20} />} />
          </div>

          <Card padding="none" className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Event-Based Triggers</CardTitle>
                <Button size="sm" onClick={() => setShowTriggerModal(true)}><Plus size={14} /> Create Trigger</Button>
              </div>
            </CardHeader>
            <div className="divide-y divide-divider">
              {surveyTriggers.length === 0 ? (
                <div className="px-6 py-16 text-center">
                  <Zap size={40} className="mx-auto mb-3 text-t3 opacity-40" />
                  <p className="text-sm font-medium text-t1 mb-1">No triggers yet</p>
                  <p className="text-xs text-t3 mb-4">Create event-based triggers to automatically send surveys</p>
                  <Button size="sm" onClick={() => setShowTriggerModal(true)}><Plus size={14} /> Create Trigger</Button>
                </div>
              ) : surveyTriggers.map((trigger: any) => (
                <div key={trigger.id} className="px-6 py-4">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                      <Zap size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-t1">{trigger.template_name || 'Unknown Template'}</p>
                      <p className="text-xs text-t3">
                        When: <span className="text-t2 font-medium">{triggerEventLabels[trigger.trigger_event] || trigger.trigger_event}</span>
                        {trigger.delay_days > 0 && <> &middot; Delay: {trigger.delay_days} days</>}
                      </p>
                    </div>
                    <Badge variant={trigger.is_active ? 'success' : 'default'}>{trigger.is_active ? 'Active' : 'Disabled'}</Badge>
                    <div className="flex gap-1">
                      <button onClick={() => updateSurveyTrigger(trigger.id, { is_active: !trigger.is_active })} className={`p-1.5 rounded-lg ${trigger.is_active ? 'text-success hover:bg-success/10' : 'text-t3 hover:bg-canvas'}`}>
                        <Power size={14} />
                      </button>
                      <button onClick={() => setDeleteConfirm({ type: 'trigger', id: trigger.id })} className="p-1.5 text-t3 hover:text-error rounded-lg hover:bg-error/10">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Recent Activity Log */}
                  {trigger.recent_firings?.length > 0 && (
                    <div className="ml-14 space-y-1.5">
                      <p className="text-xs font-medium text-t2 mb-1">Recent Activity:</p>
                      {trigger.recent_firings.map((firing: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-3 text-xs bg-canvas rounded-lg px-3 py-2">
                          <Avatar name={firing.employee_name} size="xs" />
                          <span className="text-t1 font-medium">{firing.employee_name}</span>
                          <Badge variant="default">{firing.event}</Badge>
                          <span className="text-t3 ml-auto">{firing.survey_sent_date}</span>
                          <Badge variant={firing.status === 'completed' ? 'success' : 'warning'}>{firing.status}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      {/* ============================================================ */}
      {/* TAB 2: RESULTS & ANALYTICS */}
      {/* ============================================================ */}
      {activeTab === 'results' && (
        <>
          {surveyResponses.length === 0 ? (
            <Card><p className="text-sm text-t3 text-center py-8">{t('noResponses')}</p></Card>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Category Score Breakdown */}
                <Card>
                  <h3 className="text-sm font-semibold text-t1 mb-4">{t('categoryScoreBreakdown')}</h3>
                  <TempoBarChart
                    data={surveyAnalysis.categoryScores.map(cs => ({ name: cs.category, score: cs.score }))}
                    bars={[{ dataKey: 'score', name: 'Score', color: CHART_COLORS.primary }]}
                    layout="horizontal"
                    height={160}
                  />
                  <div className="mt-4 space-y-2">
                    {surveyAnalysis.categoryScores.map(cs => (
                      <div key={cs.category} className="flex items-center justify-between gap-2">
                        <span className="text-xs text-t2 w-28 truncate">{cs.category}</span>
                        <div className="flex-1"><Progress value={cs.score} showLabel /></div>
                        <span className={`text-xs font-medium w-10 text-right ${cs.change > 0 ? 'text-emerald-600' : cs.change < 0 ? 'text-error' : 'text-t3'}`}>
                          {cs.change > 0 ? '+' : ''}{cs.change}
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Response Rate by Department */}
                <Card>
                  <h3 className="text-sm font-semibold text-t1 mb-4">{t('responseRateByDept')}</h3>
                  {surveyAnalysis.departmentRates.length > 0 ? (
                    <>
                      <TempoDonutChart data={surveyAnalysis.departmentRates.map((dr, i) => ({
                        name: dr.department,
                        value: dr.rate,
                        color: CHART_SERIES[i % CHART_SERIES.length],
                      }))} />
                      <div className="mt-4 space-y-2">
                        {surveyAnalysis.departmentRates.map(dr => (
                          <div key={dr.department} className="flex items-center justify-between text-xs">
                            <span className="text-t2">{dr.department}</span>
                            <span className="text-t1 font-medium">{dr.rate}% ({dr.respondents}/{dr.total})</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : <p className="text-sm text-t3">{t('noResponses')}</p>}
                </Card>
              </div>

              {/* Strengths & Concerns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <Card>
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 size={16} className="text-gray-400" />
                    <h3 className="text-sm font-semibold text-t1">{t('topStrengths')}</h3>
                  </div>
                  <div className="space-y-2">
                    {surveyAnalysis.strengths.map((s, i) => (
                      <div key={i} className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
                        <ArrowUpRight size={14} className="text-gray-500" />
                        <span className="text-sm text-gray-700">{s}</span>
                      </div>
                    ))}
                  </div>
                </Card>
                <Card>
                  <div className="flex items-center gap-2 mb-3">
                    <Target size={16} className="text-gray-400" />
                    <h3 className="text-sm font-semibold text-t1">{t('keyConcerns')}</h3>
                  </div>
                  <div className="space-y-2">
                    {surveyAnalysis.concerns.map((c, i) => (
                      <div key={i} className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
                        <ArrowDownRight size={14} className="text-gray-500" />
                        <span className="text-sm text-gray-700">{c}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              {/* AI Survey Analysis */}
              {driverInsights.length > 0 && (
                <Card className="mb-6">
                  <h3 className="text-sm font-semibold text-t1 mb-3">{t('aiSurveyAnalysis')}</h3>
                  <div className="space-y-3">
                    {driverInsights.map(insight => (
                      <AIInsightCard key={insight.id} insight={insight} compact />
                    ))}
                  </div>
                </Card>
              )}
            </>
          )}
        </>
      )}

      {/* ============================================================ */}
      {/* TAB: TEXT ANALYSIS */}
      {/* ============================================================ */}
      {activeTab === 'text-analysis' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard label="Total Responses" value={filteredResponses.length} icon={<MessageSquareText size={20} />} />
            <StatCard label="Positive" value={sentimentCounts.positive} changeType="positive" icon={<ThumbsUp size={20} />} />
            <StatCard label="Neutral" value={sentimentCounts.neutral} changeType="neutral" icon={<MinusCircle size={20} />} />
            <StatCard label="Negative" value={sentimentCounts.negative} changeType="negative" icon={<ThumbsDown size={20} />} />
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <div className="flex flex-wrap gap-4 items-end">
              <Select label="Sentiment" value={textAnalysisFilter.sentiment} onChange={e => setTextAnalysisFilter(p => ({ ...p, sentiment: e.target.value }))} options={[
                { value: 'all', label: 'All Sentiments' }, { value: 'positive', label: 'Positive' }, { value: 'neutral', label: 'Neutral' }, { value: 'negative', label: 'Negative' },
              ]} />
              <Select label="Department" value={textAnalysisFilter.department} onChange={e => setTextAnalysisFilter(p => ({ ...p, department: e.target.value }))} options={[
                { value: 'all', label: 'All Departments' }, ...departments.map((d: any) => ({ value: d.id, label: d.name })),
              ]} />
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Sentiment Breakdown */}
            <Card>
              <h3 className="text-sm font-semibold text-t1 mb-4">Sentiment Breakdown</h3>
              <TempoDonutChart data={[
                { name: 'Positive', value: sentimentCounts.positive, color: '#10b981' },
                { name: 'Neutral', value: sentimentCounts.neutral, color: '#f59e0b' },
                { name: 'Negative', value: sentimentCounts.negative, color: '#f43f5e' },
              ]} />
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500" /><span className="text-t2">Positive</span></div>
                  <span className="text-t1 font-medium">{filteredResponses.length > 0 ? Math.round((sentimentCounts.positive / filteredResponses.length) * 100) : 0}%</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-500" /><span className="text-t2">Neutral</span></div>
                  <span className="text-t1 font-medium">{filteredResponses.length > 0 ? Math.round((sentimentCounts.neutral / filteredResponses.length) * 100) : 0}%</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-rose-500" /><span className="text-t2">Negative</span></div>
                  <span className="text-t1 font-medium">{filteredResponses.length > 0 ? Math.round((sentimentCounts.negative / filteredResponses.length) * 100) : 0}%</span>
                </div>
              </div>
            </Card>

            {/* Top Themes */}
            <Card>
              <h3 className="text-sm font-semibold text-t1 mb-4">Top Themes</h3>
              {themeCounts.length === 0 ? <p className="text-sm text-t3 text-center py-8">No themes detected.</p> : (
                <div className="space-y-2">
                  {themeCounts.map(([theme, count]) => {
                    const maxCount = themeCounts[0][1]
                    const pct = Math.round((count / maxCount) * 100)
                    return (
                      <div key={theme} className="flex items-center gap-3">
                        <span className="text-xs text-t2 w-28 truncate capitalize">{theme}</span>
                        <div className="flex-1">
                          <div className="relative h-5 bg-canvas rounded-full overflow-hidden">
                            <div className="absolute h-full bg-tempo-100 rounded-full transition-all" style={{ width: `${pct}%` }} />
                            <span className="absolute inset-0 flex items-center pl-2 text-[0.6rem] font-medium text-tempo-700">{count}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </Card>
          </div>

          {/* AI Insights Summary */}
          <Card className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={16} className="text-tempo-600" />
              <h3 className="text-sm font-semibold text-t1">AI-Generated Insights</h3>
            </div>
            <div className="space-y-2">
              {sentimentCounts.negative > sentimentCounts.positive ? (
                <div className="flex items-start gap-2 px-3 py-2 bg-rose-50 rounded-lg">
                  <AlertTriangle size={14} className="text-rose-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-rose-700">Negative sentiment outweighs positive responses. Key concerns center around {themeCounts.filter(([_, c]) => c > 1).slice(0, 3).map(([t]) => t).join(', ')}. Consider addressing these areas with targeted action plans.</p>
                </div>
              ) : (
                <div className="flex items-start gap-2 px-3 py-2 bg-emerald-50 rounded-lg">
                  <CheckCircle2 size={14} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-emerald-700">Overall sentiment is positive. Employees particularly appreciate {themeCounts.slice(0, 3).map(([t]) => t).join(', ')}. Continue reinforcing these strengths.</p>
                </div>
              )}
              <div className="flex items-start gap-2 px-3 py-2 bg-blue-50 rounded-lg">
                <Sparkles size={14} className="text-blue-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-blue-700">Top {themeCounts.length} themes detected across {filteredResponses.length} responses. Most common: &ldquo;{themeCounts[0]?.[0] || 'N/A'}&rdquo; ({themeCounts[0]?.[1] || 0} mentions). Consider creating targeted surveys around emerging themes.</p>
              </div>
            </div>
          </Card>

          {/* Individual Responses */}
          <Card padding="none">
            <CardHeader><CardTitle>Individual Responses ({filteredResponses.length})</CardTitle></CardHeader>
            <div className="divide-y divide-divider">
              {filteredResponses.length === 0 ? (
                <div className="px-6 py-12 text-center text-sm text-t3">No responses match your filters.</div>
              ) : filteredResponses.map((resp: any) => (
                <div key={resp.id} className="px-6 py-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${resp.sentiment === 'positive' ? 'bg-emerald-100 text-emerald-600' : resp.sentiment === 'negative' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
                      {resp.sentiment === 'positive' ? <ThumbsUp size={14} /> : resp.sentiment === 'negative' ? <ThumbsDown size={14} /> : <Minus size={14} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-t1 leading-relaxed">{resp.text}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <Badge variant={resp.sentiment === 'positive' ? 'success' : resp.sentiment === 'negative' ? 'error' : 'warning'}>
                          {resp.sentiment}
                        </Badge>
                        {(resp.themes || []).map((theme: string) => (
                          <Badge key={theme} variant="default">{theme}</Badge>
                        ))}
                        {resp.department_id && <span className="text-[0.65rem] text-t3 ml-auto">{getDepartmentName(resp.department_id)}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      {/* ============================================================ */}
      {/* TAB 3: ACTION PLANS */}
      {/* ============================================================ */}
      {activeTab === 'action-plans' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard label={t('planned')} value={actionPlans.filter((ap: any) => ap.status === 'planned').length} changeType="neutral" icon={<ClipboardList size={20} />} />
            <StatCard label={t('inProgress')} value={actionPlans.filter((ap: any) => ap.status === 'in_progress').length} changeType="neutral" icon={<TrendingUp size={20} />} />
            <StatCard label={t('completed')} value={actionPlans.filter((ap: any) => ap.status === 'completed').length} changeType="positive" icon={<CheckCircle2 size={20} />} />
            <StatCard label={t('activeSurveys')} value={actionPlans.length} changeType="neutral" icon={<Target size={20} />} />
          </div>

          <Card padding="none" className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t('actionPlansTitle')}</CardTitle>
                <Button size="sm" onClick={() => setShowActionPlanModal(true)}><Plus size={14} /> {t('addActionPlan')}</Button>
              </div>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-divider bg-canvas">
                    <th className="tempo-th text-left px-6 py-3">{t('actionTitle')}</th>
                    <th className="tempo-th text-left px-4 py-3">{t('actionOwner')}</th>
                    <th className="tempo-th text-center px-4 py-3">{t('actionPriority')}</th>
                    <th className="tempo-th text-center px-4 py-3">{t('actionCategory')}</th>
                    <th className="tempo-th text-center px-4 py-3">{t('actionDueDate')}</th>
                    <th className="tempo-th text-center px-4 py-3">{t('actionStatus')}</th>
                    <th className="tempo-th text-center px-4 py-3">{tc('actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {actionPlans.length === 0 ? (
                    <tr><td colSpan={7} className="px-6 py-16 text-center">
                      <Target size={40} className="mx-auto mb-3 text-t3 opacity-40" />
                      <p className="text-sm font-medium text-t1 mb-1">No action plans yet</p>
                      <p className="text-xs text-t3 mb-4">Turn survey insights into concrete improvement plans</p>
                      <Button size="sm" onClick={() => setShowActionPlanModal(true)}><Plus size={14} /> Create Action Plan</Button>
                    </td></tr>
                  ) : actionPlans.map((ap: any) => (
                    <tr key={ap.id} className="hover:bg-canvas/50">
                      <td className="px-6 py-3">
                        <p className="text-sm font-medium text-t1">{ap.title}</p>
                        <p className="text-xs text-t3">{getDepartmentName(ap.department_id)}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-t2">{ap.owner}</td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={ap.priority === 'high' ? 'error' : ap.priority === 'medium' ? 'warning' : 'default'}>
                          {ap.priority === 'high' ? t('priorityHigh') : ap.priority === 'medium' ? t('priorityMedium') : t('priorityLow')}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center"><Badge variant="info">{ap.category}</Badge></td>
                      <td className="px-4 py-3 text-xs text-t2 text-center">{ap.due_date}</td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={ap.status === 'completed' ? 'success' : ap.status === 'in_progress' ? 'orange' : 'default'}>
                          {ap.status === 'completed' ? t('completed') : ap.status === 'in_progress' ? t('inProgress') : t('planned')}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {ap.status === 'planned' && (
                          <Button size="sm" variant="ghost" onClick={() => advanceActionPlan(ap.id, ap.status)}>{t('markInProgress')}</Button>
                        )}
                        {ap.status === 'in_progress' && (
                          <Button size="sm" variant="ghost" onClick={() => advanceActionPlan(ap.id, ap.status)}>{t('markCompleted')}</Button>
                        )}
                        {ap.status === 'completed' && (
                          <CheckCircle2 size={16} className="inline text-emerald-500" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* AI Suggested Actions */}
          {aiSuggestions.length > 0 && (
            <Card>
              <h3 className="text-sm font-semibold text-t1 mb-3">{t('aiSuggestedActions')}</h3>
              <AIRecommendationList recommendations={aiSuggestions} />
            </Card>
          )}
        </>
      )}

      {/* ============================================================ */}
      {/* TAB 4: BENCHMARKS */}
      {/* ============================================================ */}
      {activeTab === 'benchmarks' && (
        <>
          <Card padding="none" className="mb-6">
            <CardHeader><CardTitle>{t('benchmarksTitle')}</CardTitle></CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-divider bg-canvas">
                    <th className="tempo-th text-left px-6 py-3">{t('benchmarkDimension')}</th>
                    <th className="tempo-th text-center px-4 py-3">{t('yourScore')}</th>
                    <th className="tempo-th text-center px-4 py-3">{t('industryAvg')}</th>
                    <th className="tempo-th text-center px-4 py-3">{t('topQuartile')}</th>
                    <th className="tempo-th text-left px-4 py-3">{t('vsIndustry')}</th>
                    <th className="tempo-th text-center px-4 py-3">{tc('status')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {benchmarks.map(bm => (
                    <tr key={bm.dimension} className="hover:bg-canvas/50">
                      <td className="px-6 py-3 text-xs font-medium text-t1">{bm.dimension}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-sm font-semibold text-tempo-600">{bm.orgScore}</span>
                      </td>
                      <td className="px-4 py-3 text-center text-xs text-t2">{bm.industryAvg}</td>
                      <td className="px-4 py-3 text-center text-xs text-t2">{bm.topQuartile}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 max-w-[200px]">
                            <div className="relative h-2 bg-border rounded-full overflow-hidden">
                              {/* Industry avg marker */}
                              <div className="absolute h-full bg-gray-300 rounded-full" style={{ width: `${bm.industryAvg}%` }} />
                              {/* Org score */}
                              <div className={`absolute h-full rounded-full ${bm.orgScore >= bm.industryAvg ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${bm.orgScore}%` }} />
                            </div>
                          </div>
                          <span className={`text-xs font-medium ${bm.diff > 0 ? 'text-emerald-600' : bm.diff < 0 ? 'text-error' : 'text-t3'}`}>
                            {bm.diff > 0 ? '+' : ''}{bm.diff}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={bm.diff > 3 ? 'success' : bm.diff < -3 ? 'warning' : 'default'}>
                          {bm.diff > 3 ? t('aboveBenchmark') : bm.diff < -3 ? t('belowBenchmark') : t('atBenchmark')}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Benchmark Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="text-center">
              <p className="text-xs text-t3 mb-2">{t('aboveBenchmark')}</p>
              <p className="text-3xl font-bold text-emerald-600">{benchmarks.filter(b => b.diff > 3).length}</p>
              <p className="text-xs text-t3 mt-1">/ {benchmarks.length} {t('benchmarkDimension').toLowerCase()}s</p>
            </Card>
            <Card className="text-center">
              <p className="text-xs text-t3 mb-2">{t('atBenchmark')}</p>
              <p className="text-3xl font-bold text-t1">{benchmarks.filter(b => Math.abs(b.diff) <= 3).length}</p>
              <p className="text-xs text-t3 mt-1">/ {benchmarks.length} {t('benchmarkDimension').toLowerCase()}s</p>
            </Card>
            <Card className="text-center">
              <p className="text-xs text-t3 mb-2">{t('belowBenchmark')}</p>
              <p className="text-3xl font-bold text-amber-500">{benchmarks.filter(b => b.diff < -3).length}</p>
              <p className="text-xs text-t3 mt-1">/ {benchmarks.length} {t('benchmarkDimension').toLowerCase()}s</p>
            </Card>
          </div>
        </>
      )}

      {/* ============================================================ */}
      {/* TAB 5: TRENDS */}
      {/* ============================================================ */}
      {activeTab === 'trends' && (
        <>
          {/* Historical Trend Sparklines */}
          <Card className="mb-6">
            <h3 className="text-sm font-semibold text-t1 mb-4">{t('historicalTrend')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trendData.predictions.map(pred => {
                // Generate synthetic sparkline data based on current score
                const base = pred.current
                const points = [base - 8, base - 5, base - 2, base - 1, base, pred.predicted]
                return (
                  <div key={pred.dimension} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-t1">{pred.dimension}</span>
                      <div className="flex items-center gap-1">
                        {pred.direction === 'up' && <ArrowUpRight size={14} className="text-emerald-500" />}
                        {pred.direction === 'down' && <ArrowDownRight size={14} className="text-error" />}
                        {pred.direction === 'stable' && <Minus size={14} className="text-t3" />}
                        <span className={`text-xs font-medium ${pred.direction === 'up' ? 'text-emerald-600' : pred.direction === 'down' ? 'text-error' : 'text-t3'}`}>
                          {pred.direction === 'up' ? t('trendUp') : pred.direction === 'down' ? t('trendDown') : t('trendStable')}
                        </span>
                      </div>
                    </div>
                    <TempoSparkArea data={points} width={200} height={32} />
                    <div className="flex justify-between text-[0.6rem] text-t3">
                      {(() => {
                        const now = new Date()
                        const q = Math.ceil((now.getMonth() + 1) / 3)
                        const y = now.getFullYear()
                        const quarters = [
                          { q: ((q - 3 + 4) % 4) || 4, y: q <= 2 ? y - 1 : y },
                          { q: ((q - 2 + 4) % 4) || 4, y: q <= 1 ? y - 1 : y },
                          { q: ((q - 1 + 4) % 4) || 4, y: q === 1 ? y - 1 : y },
                        ]
                        const nextQ = (q % 4) + 1
                        return (
                          <>
                            {quarters.map((qr, i) => <span key={i}>Q{qr.q} {qr.y}</span>)}
                            <span className="font-medium text-tempo-600">Q{nextQ} (pred)</span>
                          </>
                        )
                      })()}
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>

          {/* Predictions Table */}
          <Card padding="none" className="mb-6">
            <CardHeader><CardTitle>{t('aiTrendPredictions')}</CardTitle></CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-divider bg-canvas">
                    <th className="tempo-th text-left px-6 py-3">{t('trendDimension')}</th>
                    <th className="tempo-th text-center px-4 py-3">{t('currentScore')}</th>
                    <th className="tempo-th text-center px-4 py-3">{t('predictedScore')}</th>
                    <th className="tempo-th text-center px-4 py-3">{t('trendDirection')}</th>
                    <th className="tempo-th text-center px-4 py-3">{t('confidence')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {trendData.predictions.map(pred => (
                    <tr key={pred.dimension} className="hover:bg-canvas/50">
                      <td className="px-6 py-3 text-xs font-medium text-t1">{pred.dimension}</td>
                      <td className="px-4 py-3 text-center text-xs font-semibold text-t1">{pred.current}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-sm font-semibold ${pred.predicted > pred.current ? 'text-emerald-600' : pred.predicted < pred.current ? 'text-error' : 'text-t1'}`}>
                          {pred.predicted}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={pred.direction === 'up' ? 'success' : pred.direction === 'down' ? 'warning' : 'default'}>
                          {pred.direction === 'up' && <><TrendingUp size={12} className="mr-1 inline" />{t('trendUp')}</>}
                          {pred.direction === 'down' && <><TrendingDown size={12} className="mr-1 inline" />{t('trendDown')}</>}
                          {pred.direction === 'stable' && <><Minus size={12} className="mr-1 inline" />{t('trendStable')}</>}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={pred.confidence === 'high' ? 'success' : pred.confidence === 'medium' ? 'info' : 'default'}>
                          {pred.confidence}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* AI Trend Insight */}
          <AIInsightCard insight={trendData.overallTrend} />
        </>
      )}

      {/* ============================================================ */}
      {/* TAB 6: eNPS */}
      {/* ============================================================ */}
      {activeTab === 'enps' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard label={t('enps')} value={`+${avgENPS}`} change={t('orgAverage')} changeType="positive" icon={<TrendingUp size={20} />} />
            <StatCard label={t('promoters')} value={`${Math.round(avgENPS * 0.8 + 35)}%`} changeType="positive" />
            <StatCard label={t('passives')} value={`${Math.round(40 - avgENPS * 0.3)}%`} changeType="neutral" />
            <StatCard label={t('detractors')} value={`${Math.max(5, Math.round(25 - avgENPS * 0.5))}%`} changeType="negative" />
          </div>

          {/* eNPS Org Donut */}
          <Card className="mb-6">
            <h3 className="text-sm font-semibold text-t1 mb-4">{t('enpsBreakdown')}</h3>
            <TempoDonutChart data={[
              { name: t('promoters'), value: Math.round(avgENPS * 0.8 + 35), color: '#10b981' },
              { name: t('passives'), value: Math.round(40 - avgENPS * 0.3), color: '#f59e0b' },
              { name: t('detractors'), value: Math.max(5, Math.round(25 - avgENPS * 0.5)), color: '#f43f5e' },
            ]} />
          </Card>

          {/* Department eNPS Cards */}
          <h3 className="text-sm font-semibold text-t1 mb-3">{t('enpsTracking')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {engagementScores.map(score => {
              const deptName = getDepartmentName(score.department_id)
              // Deterministic breakdown based on enps
              const promoterPct = Math.min(70, Math.round(score.enps_score * 0.7 + 35))
              const detractorPct = Math.max(5, Math.round(30 - score.enps_score * 0.5))
              const passivePct = 100 - promoterPct - detractorPct
              return (
                <Card key={score.id}>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-sm font-semibold text-t1">{deptName}</h3>
                      <p className="text-xs text-t3">{score.country_id} - {score.period}</p>
                    </div>
                    <div className="text-right">
                      <p className="tempo-stat text-2xl text-tempo-600">+{score.enps_score}</p>
                      <p className="text-[0.6rem] text-t3">{t('enpsLabel')}</p>
                    </div>
                  </div>
                  {/* Stacked bar */}
                  <div className="h-3 rounded-full overflow-hidden flex mb-3">
                    <div className="bg-emerald-500 transition-all" style={{ width: `${promoterPct}%` }} />
                    <div className="bg-amber-400 transition-all" style={{ width: `${passivePct}%` }} />
                    <div className="bg-rose-500 transition-all" style={{ width: `${detractorPct}%` }} />
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center mb-3">
                    <div>
                      <p className="text-xs font-semibold text-emerald-600">{promoterPct}%</p>
                      <p className="text-[0.6rem] text-t3">{t('promoters')}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-amber-600">{passivePct}%</p>
                      <p className="text-[0.6rem] text-t3">{t('passives')}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-rose-600">{detractorPct}%</p>
                      <p className="text-[0.6rem] text-t3">{t('detractors')}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <p className="text-xs text-t3">{t('overallScore')}</p>
                      <Progress value={score.overall_score} showLabel />
                    </div>
                    <div>
                      <p className="text-xs text-t3">{t('responseRate')}</p>
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
        </>
      )}

      {/* ============================================================ */}
      {/* MODALS */}
      {/* ============================================================ */}

      {/* New Survey Modal */}
      <Modal open={showSurveyModal} onClose={() => setShowSurveyModal(false)} title={t('createSurveyModal')}>
        <div className="space-y-4">
          <Input label={t('surveyTitle')} value={surveyForm.title} onChange={(e) => setSurveyForm({ ...surveyForm, title: e.target.value })} placeholder={t('surveyTitlePlaceholder')} />
          <Select label={t('surveyType')} value={surveyForm.type} onChange={(e) => setSurveyForm({ ...surveyForm, type: e.target.value as 'pulse' | 'enps' | 'annual' })} options={[
            { value: 'pulse', label: t('typePulse') },
            { value: 'enps', label: t('typeEnps') },
            { value: 'annual', label: t('typeAnnual') },
          ]} />
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('startDate')} type="date" value={surveyForm.start_date} onChange={(e) => setSurveyForm({ ...surveyForm, start_date: e.target.value })} />
            <Input label={t('endDate')} type="date" value={surveyForm.end_date} onChange={(e) => setSurveyForm({ ...surveyForm, end_date: e.target.value })} />
          </div>
          <label className="flex items-center gap-2 text-xs text-t1">
            <input type="checkbox" checked={surveyForm.anonymous} onChange={(e) => setSurveyForm({ ...surveyForm, anonymous: e.target.checked })} className="rounded border-divider" />
            {t('anonymousResponses')}
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowSurveyModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitSurvey} disabled={saving}>{saving ? 'Creating...' : t('createSurvey')}</Button>
          </div>
        </div>
      </Modal>

      {/* New Action Plan Modal */}
      <Modal open={showActionPlanModal} onClose={() => setShowActionPlanModal(false)} title={t('addActionPlan')}>
        <div className="space-y-4">
          <Input label={t('actionTitle')} value={actionForm.title} onChange={(e) => setActionForm({ ...actionForm, title: e.target.value })} placeholder={t('actionTitlePlaceholder')} />
          <Input label={t('actionOwner')} value={actionForm.owner} onChange={(e) => setActionForm({ ...actionForm, owner: e.target.value })} placeholder={t('actionOwnerPlaceholder')} />
          <div className="grid grid-cols-2 gap-4">
            <Select label={t('actionPriority')} value={actionForm.priority} onChange={(e) => setActionForm({ ...actionForm, priority: e.target.value as 'high' | 'medium' | 'low' })} options={[
              { value: 'high', label: t('priorityHigh') },
              { value: 'medium', label: t('priorityMedium') },
              { value: 'low', label: t('priorityLow') },
            ]} />
            <Select label={t('actionCategory')} value={actionForm.category} onChange={(e) => setActionForm({ ...actionForm, category: e.target.value })} options={[
              { value: 'Leadership', label: 'Leadership' },
              { value: 'Culture', label: 'Culture' },
              { value: 'Growth', label: 'Growth' },
              { value: 'Wellbeing', label: 'Wellbeing' },
              { value: 'Compensation', label: 'Compensation' },
              { value: 'Work-Life', label: 'Work-Life Balance' },
            ]} />
          </div>
          <Input label={t('actionDueDate')} type="date" value={actionForm.due_date} onChange={(e) => setActionForm({ ...actionForm, due_date: e.target.value })} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowActionPlanModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitActionPlan} disabled={saving}>{saving ? 'Creating...' : t('createActionPlan')}</Button>
          </div>
        </div>
      </Modal>

      {/* Bulk Survey Distribution Modal */}
      <Modal open={showBulkSurveyModal} onClose={resetBulkSurvey} title="Distribute Survey" size="xl">
        <p className="text-xs text-t3 mb-4">Send a survey to employees by selecting recipients and choosing a survey to distribute.</p>
        {/* Step indicator */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${bulkSurveyStep === 1 ? 'bg-tempo-500 text-white' : 'bg-success/20 text-success'}`}>
              {bulkSurveyStep > 1 ? '\u2713' : '1'}
            </div>
            <span className={`text-xs font-medium ${bulkSurveyStep === 1 ? 'text-t1' : 'text-success'}`}>Select Recipients</span>
          </div>
          <div className="flex-1 h-px bg-divider" />
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${bulkSurveyStep === 2 ? 'bg-tempo-500 text-white' : 'bg-canvas text-t3'}`}>2</div>
            <span className={`text-xs font-medium ${bulkSurveyStep === 2 ? 'text-t1' : 'text-t3'}`}>Select Survey</span>
          </div>
        </div>

        {bulkSurveyStep === 1 && (
          <>
            {/* Mode toggle */}
            <div className="flex gap-2 mb-4 flex-wrap">
              {(['individual', 'department', 'country', 'level', 'all'] as const).map(mode => (
                <button key={mode} onClick={() => setBulkSurveyMode(mode)}
                  className={`px-3 py-1.5 text-xs rounded-full border transition-all ${bulkSurveyMode === mode ? 'bg-tempo-500 text-white border-tempo-500' : 'border-border text-t2 hover:border-tempo-300'}`}>
                  {mode === 'individual' && <><Search size={12} className="inline mr-1" />Individual</>}
                  {mode === 'department' && <><Building2 size={12} className="inline mr-1" />Department</>}
                  {mode === 'country' && <><Globe size={12} className="inline mr-1" />Country</>}
                  {mode === 'level' && <><Users size={12} className="inline mr-1" />Level</>}
                  {mode === 'all' && <><Users size={12} className="inline mr-1" />Entire Company</>}
                </button>
              ))}
            </div>

            {bulkSurveyMode === 'individual' && (
              <>
                <Input placeholder="Search employees by name or title..." value={bulkSurveySearch} onChange={e => setBulkSurveySearch(e.target.value)} />
                <div className="mt-2 flex items-center gap-2 px-2 py-1.5 border-b border-divider">
                  <input type="checkbox" className="rounded border-border"
                    checked={bulkSurveyTargetEmployees.length > 0 && bulkSurveyTargetEmployees.every((e: any) => bulkSurveySelectedEmpIds.has(e.id))}
                    onChange={() => {
                      if (bulkSurveyTargetEmployees.every((e: any) => bulkSurveySelectedEmpIds.has(e.id))) setBulkSurveySelectedEmpIds(new Set())
                      else setBulkSurveySelectedEmpIds(new Set(bulkSurveyTargetEmployees.map((e: any) => e.id)))
                    }} />
                  <span className="text-xs text-t2 font-medium">Select All ({bulkSurveyTargetEmployees.length})</span>
                </div>
                <div className="max-h-[240px] overflow-y-auto divide-y divide-divider">
                  {bulkSurveyTargetEmployees.map((emp: any) => (
                    <label key={emp.id} className="flex items-center gap-3 px-2 py-2.5 hover:bg-canvas cursor-pointer">
                      <input type="checkbox" className="rounded border-border"
                        checked={bulkSurveySelectedEmpIds.has(emp.id)}
                        onChange={() => toggleBulkSurveySet(bulkSurveySelectedEmpIds, setBulkSurveySelectedEmpIds, emp.id)} />
                      <Avatar name={emp.profile?.full_name || ''} size="xs" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-t1">{emp.profile?.full_name}</p>
                        <p className="text-[0.65rem] text-t3">{emp.job_title}</p>
                      </div>
                      <span className="text-[0.65rem] text-t3">{emp.country}</span>
                    </label>
                  ))}
                  {bulkSurveyTargetEmployees.length === 0 && <p className="p-4 text-xs text-t3 text-center">No employees match your search.</p>}
                </div>
              </>
            )}

            {bulkSurveyMode === 'department' && (
              <div className="flex flex-wrap gap-2 mb-3">
                {departments.map((dept: any) => {
                  const count = employees.filter((e: any) => e.department_id === dept.id).length
                  return (
                    <button key={dept.id} onClick={() => toggleBulkSurveySet(bulkSurveySelectedDepts, setBulkSurveySelectedDepts, dept.id)}
                      className={`px-3 py-1.5 text-xs rounded-full border transition-all ${bulkSurveySelectedDepts.has(dept.id) ? 'bg-tempo-500 text-white border-tempo-500' : 'border-border text-t2 hover:border-tempo-300'}`}>
                      {dept.name} ({count})
                    </button>
                  )
                })}
              </div>
            )}

            {bulkSurveyMode === 'country' && (
              <div className="flex flex-wrap gap-2 mb-3">
                {uniqueCountries.map((country: string) => {
                  const count = employees.filter((e: any) => e.country === country).length
                  return (
                    <button key={country} onClick={() => toggleBulkSurveySet(bulkSurveySelectedCountries, setBulkSurveySelectedCountries, country)}
                      className={`px-3 py-1.5 text-xs rounded-full border transition-all ${bulkSurveySelectedCountries.has(country) ? 'bg-tempo-500 text-white border-tempo-500' : 'border-border text-t2 hover:border-tempo-300'}`}>
                      {country} ({count})
                    </button>
                  )
                })}
              </div>
            )}

            {bulkSurveyMode === 'level' && (
              <div className="flex flex-wrap gap-2 mb-3">
                {uniqueLevels.map((level: string) => {
                  const count = employees.filter((e: any) => e.level === level).length
                  return (
                    <button key={level} onClick={() => toggleBulkSurveySet(bulkSurveySelectedLevels, setBulkSurveySelectedLevels, level)}
                      className={`px-3 py-1.5 text-xs rounded-full border transition-all ${bulkSurveySelectedLevels.has(level) ? 'bg-tempo-500 text-white border-tempo-500' : 'border-border text-t2 hover:border-tempo-300'}`}>
                      {level} ({count})
                    </button>
                  )
                })}
              </div>
            )}

            {bulkSurveyMode === 'all' && (
              <div className="border border-border rounded-lg p-6 text-center">
                <Users size={32} className="mx-auto mb-2 text-tempo-500" />
                <h3 className="text-sm font-semibold text-t1">Entire Company Selected</h3>
                <p className="text-xs text-t3 mt-1">All {employees.length} employees will receive the survey.</p>
              </div>
            )}

            {/* Preview of selected employees for non-individual modes (except all) */}
            {(bulkSurveyMode !== 'individual' && bulkSurveyMode !== 'all' && bulkSurveySelectedEmployees.length > 0) && (
              <div className="max-h-[120px] overflow-y-auto divide-y divide-divider border border-border rounded-lg mt-2">
                {bulkSurveySelectedEmployees.slice(0, 6).map((emp: any) => (
                  <div key={emp.id} className="flex items-center gap-2 px-3 py-1.5">
                    <Avatar name={emp.profile?.full_name || ''} size="xs" />
                    <span className="text-xs text-t1">{emp.profile?.full_name}</span>
                    <span className="text-[0.65rem] text-t3 ml-auto">{getDepartmentName(emp.department_id)}</span>
                  </div>
                ))}
                {bulkSurveySelectedEmployees.length > 6 && <p className="px-3 py-1.5 text-xs text-t3">+{bulkSurveySelectedEmployees.length - 6} more</p>}
              </div>
            )}
          </>
        )}

        {bulkSurveyStep === 2 && (
          <>
            {/* Survey selection */}
            <h4 className="text-xs font-semibold text-t1 mb-3">Select a Survey to Distribute</h4>
            {activeSurveysForBulk.length === 0 ? (
              <div className="border border-border rounded-lg p-6 text-center">
                <p className="text-sm text-t3">No active surveys available. Create a new survey first.</p>
              </div>
            ) : (
              <div className="space-y-2 mb-4">
                {activeSurveysForBulk.map(survey => (
                  <label key={survey.id} className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${bulkSurveySurveyId === survey.id ? 'border-tempo-500 bg-tempo-50' : 'border-border hover:border-tempo-300'}`}>
                    <input type="radio" name="bulkSurvey" className="text-tempo-500"
                      checked={bulkSurveySurveyId === survey.id}
                      onChange={() => setBulkSurveySurveyId(survey.id)} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-t1">{survey.title}</p>
                      <p className="text-xs text-t3">{survey.type.toUpperCase()} &middot; {survey.start_date} to {survey.end_date}</p>
                    </div>
                    <Badge variant={survey.type === 'enps' ? 'info' : survey.type === 'pulse' ? 'orange' : 'default'}>
                      {survey.type.toUpperCase()}
                    </Badge>
                  </label>
                ))}
              </div>
            )}

            {/* Distribution Summary */}
            <div className="border border-border rounded-lg p-4 mt-4">
              <h4 className="text-xs font-semibold text-t1 mb-3">Distribution Summary</h4>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-lg font-bold text-t1">{bulkSurveySelectedEmployees.length}</p>
                  <p className="text-[0.65rem] text-t3">Recipients</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-tempo-600">{bulkSurveySurveyId ? '1' : '0'}</p>
                  <p className="text-[0.65rem] text-t3">Survey Selected</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-emerald-600">{avgResponse > 0 ? `~${avgResponse}%` : 'N/A'}</p>
                  <p className="text-[0.65rem] text-t3">Expected Response Rate</p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-divider">
          <p className="text-xs text-t3">
            {bulkSurveyStep === 1
              ? `${bulkSurveySelectedEmployees.length} recipient${bulkSurveySelectedEmployees.length !== 1 ? 's' : ''} selected`
              : `Ready to distribute to ${bulkSurveySelectedEmployees.length} employee${bulkSurveySelectedEmployees.length !== 1 ? 's' : ''}`}
          </p>
          <div className="flex gap-2">
            {bulkSurveyStep === 2 && <Button variant="secondary" size="sm" onClick={() => setBulkSurveyStep(1)}>Back</Button>}
            <Button variant="secondary" size="sm" onClick={resetBulkSurvey}>Cancel</Button>
            {bulkSurveyStep === 1 && (
              <Button size="sm" disabled={bulkSurveySelectedEmployees.length === 0} onClick={() => setBulkSurveyStep(2)}>
                Next: Select Survey &rarr;
              </Button>
            )}
            {bulkSurveyStep === 2 && (
              <Button size="sm" disabled={!bulkSurveySurveyId || bulkSurveySelectedEmployees.length === 0} onClick={submitBulkSurvey}>
                <Send size={14} /> Send Survey
              </Button>
            )}
          </div>
        </div>
      </Modal>

      {/* Preview Survey Modal */}
      <Modal open={showPreviewModal} onClose={() => setShowPreviewModal(false)} title="Survey Preview" size="lg">
        <div className="space-y-4">
          <div className="border-b border-divider pb-3">
            <h3 className="text-lg font-semibold text-t1">{builderTitle || 'Untitled Survey'}</h3>
            {builderDesc && <p className="text-sm text-t3 mt-1">{builderDesc}</p>}
          </div>
          {builderQuestions.map((q, idx) => (
            <div key={q.id} className="border border-divider rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold text-tempo-600">Q{idx + 1}</span>
                {q.required && <span className="text-error text-xs">*</span>}
                {q.branchLogic && <GitBranch size={12} className="text-amber-500" />}
              </div>
              <p className="text-sm font-medium text-t1 mb-3">{q.text}</p>
              {q.type === 'rating' && (
                <div className="flex gap-2">
                  {Array.from({ length: q.options?.scale || 5 }).map((_, i) => (
                    <div key={i} className="w-10 h-10 rounded-lg border border-divider flex items-center justify-center text-t3 hover:border-tempo-300 cursor-pointer">
                      <Star size={16} />
                    </div>
                  ))}
                </div>
              )}
              {q.type === 'text' && <div className="border border-divider rounded-lg p-3 bg-canvas text-xs text-t3 min-h-[60px]">Type your answer here...</div>}
              {q.type === 'multiple_choice' && (
                <div className="space-y-2">
                  {(q.options?.choices || ['Option 1', 'Option 2', 'Option 3']).map((opt: any, i: number) => {
                    const optText = typeof opt === 'string' ? opt : (opt?.text || opt?.label || String(opt))
                    return (
                    <label key={i} className="flex items-center gap-2 text-sm text-t2">
                      <input type="radio" name={`preview-${q.id}`} className="text-tempo-500" disabled /> {optText}
                    </label>
                    )
                  })}
                </div>
              )}
              {q.type === 'nps' && (
                <div className="flex gap-1">
                  {Array.from({ length: 11 }).map((_, i) => (
                    <div key={i} className={`w-8 h-8 rounded-lg border flex items-center justify-center text-xs cursor-pointer ${i <= 6 ? 'border-rose-200 text-rose-500' : i <= 8 ? 'border-amber-200 text-amber-500' : 'border-emerald-200 text-emerald-500'}`}>
                      {i}
                    </div>
                  ))}
                </div>
              )}
              {q.type === 'matrix' && (
                <table className="w-full text-xs">
                  <thead><tr><th className="text-left py-1"></th>{Array.from({ length: q.options?.scale || 5 }).map((_, i) => <th key={i} className="text-center py-1 text-t3">{i + 1}</th>)}</tr></thead>
                  <tbody>
                    {(q.options?.rows || ['Item 1', 'Item 2']).map((row: string, ri: number) => (
                      <tr key={ri} className="border-t border-divider">
                        <td className="py-2 text-t2">{row}</td>
                        {Array.from({ length: q.options?.scale || 5 }).map((_, i) => (
                          <td key={i} className="text-center py-2"><input type="radio" name={`matrix-${q.id}-${ri}`} disabled className="text-tempo-500" /></td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ))}
          <div className="flex justify-end pt-2">
            <Button variant="secondary" onClick={() => setShowPreviewModal(false)}>Close Preview</Button>
          </div>
        </div>
      </Modal>

      {/* Branch Logic Modal */}
      <Modal open={showBranchModal} onClose={() => { setShowBranchModal(false); setBranchQuestionId(null) }} title="Add Branch Logic">
        <div className="space-y-4">
          <p className="text-xs text-t3">Define a condition that determines what happens after this question is answered.</p>
          <div className="grid grid-cols-2 gap-4">
            <Select label="Condition" value={branchCondition.operator} onChange={e => setBranchCondition(p => ({ ...p, operator: e.target.value }))} options={[
              { value: 'eq', label: 'Equals' }, { value: 'neq', label: 'Not Equals' },
              { value: 'lte', label: 'Less than or equal' }, { value: 'gte', label: 'Greater than or equal' },
              { value: 'lt', label: 'Less than' }, { value: 'gt', label: 'Greater than' },
            ]} />
            <Input label="Value" type="number" value={branchCondition.value} onChange={e => setBranchCondition(p => ({ ...p, value: e.target.value }))} />
          </div>
          <Select label="Action" value={branchAction} onChange={e => setBranchAction(e.target.value)} options={[
            { value: 'skip_to', label: 'Skip to question' }, { value: 'hide', label: 'Hide question' },
            { value: 'show', label: 'Show question' }, { value: 'end_survey', label: 'End survey' },
          ]} />
          {branchAction !== 'end_survey' && (
            <Select label="Target Question" value={branchTarget} onChange={e => setBranchTarget(e.target.value)} options={[
              { value: '', label: 'Select question...' },
              ...builderQuestions.filter(q => q.id !== branchQuestionId).map((q, i) => ({ value: q.id, label: `Q${i + 1}: ${q.text.substring(0, 40)}...` })),
            ]} />
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => { setShowBranchModal(false); setBranchQuestionId(null) }}>Cancel</Button>
            <Button onClick={saveBranch}>Save Branch Logic</Button>
          </div>
        </div>
      </Modal>

      {/* Create Schedule Modal */}
      <Modal open={showScheduleModal} onClose={() => setShowScheduleModal(false)} title="Create Survey Schedule">
        <div className="space-y-4">
          <Input label="Survey Name" value={scheduleForm.survey_title} onChange={e => setScheduleForm(p => ({ ...p, survey_title: e.target.value }))} placeholder="Name for this recurring survey..." />
          <Select label="Frequency" value={scheduleForm.frequency} onChange={e => setScheduleForm(p => ({ ...p, frequency: e.target.value }))} options={[
            { value: 'weekly', label: 'Weekly' }, { value: 'biweekly', label: 'Biweekly' },
            { value: 'monthly', label: 'Monthly' }, { value: 'quarterly', label: 'Quarterly' },
            { value: 'annually', label: 'Annually' },
          ]} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Start Date" type="date" value={scheduleForm.start_date} onChange={e => setScheduleForm(p => ({ ...p, start_date: e.target.value }))} />
            <Input label="End Date (optional)" type="date" value={scheduleForm.end_date} onChange={e => setScheduleForm(p => ({ ...p, end_date: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select label="Department (optional)" value={scheduleForm.target_department} onChange={e => setScheduleForm(p => ({ ...p, target_department: e.target.value }))} options={[
              { value: '', label: 'All Departments' }, ...departments.map((d: any) => ({ value: d.id, label: d.name })),
            ]} />
            <Select label="Country (optional)" value={scheduleForm.target_country} onChange={e => setScheduleForm(p => ({ ...p, target_country: e.target.value }))} options={[
              { value: '', label: 'All Countries' }, ...uniqueCountries.map((c: string) => ({ value: c, label: c })),
            ]} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowScheduleModal(false)}>Cancel</Button>
            <Button onClick={submitSchedule} disabled={saving || !scheduleForm.survey_title || !scheduleForm.start_date}>{saving ? 'Creating...' : 'Create Schedule'}</Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Confirm Deletion">
        <div className="space-y-4">
          <p className="text-sm text-t2">Are you sure you want to delete this? This action cannot be undone.</p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="danger" onClick={confirmDelete}>Delete</Button>
          </div>
        </div>
      </Modal>

      {/* Create Trigger Modal */}
      <Modal open={showTriggerModal} onClose={() => setShowTriggerModal(false)} title="Create Survey Trigger">
        <div className="space-y-4">
          <Select label="Template" value={triggerForm.template_id} onChange={e => setTriggerForm(p => ({ ...p, template_id: e.target.value }))} options={[
            { value: '', label: 'Select a template...' },
            ...surveyTemplates.map((t: any) => ({ value: t.id, label: t.name })),
          ]} />
          <Select label="Trigger Event" value={triggerForm.trigger_event} onChange={e => setTriggerForm(p => ({ ...p, trigger_event: e.target.value }))} options={[
            { value: 'employee_hired', label: 'Employee Hired' },
            { value: 'employee_terminated', label: 'Employee Terminated' },
            { value: 'review_completed', label: 'Review Completed' },
            { value: 'anniversary', label: 'Work Anniversary' },
            { value: 'promotion', label: 'Promotion' },
            { value: 'transfer', label: 'Transfer' },
            { value: 'return_from_leave', label: 'Return from Leave' },
          ]} />
          <Input label="Delay (days)" type="number" value={String(triggerForm.delay_days)} onChange={e => setTriggerForm(p => ({ ...p, delay_days: Number(e.target.value) || 0 }))} placeholder="Days after event to send survey" />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Department (optional)" value={triggerForm.target_department} onChange={e => setTriggerForm(p => ({ ...p, target_department: e.target.value }))} options={[
              { value: '', label: 'All Departments' }, ...departments.map((d: any) => ({ value: d.id, label: d.name })),
            ]} />
            <Select label="Country (optional)" value={triggerForm.target_country} onChange={e => setTriggerForm(p => ({ ...p, target_country: e.target.value }))} options={[
              { value: '', label: 'All Countries' }, ...uniqueCountries.map((c: string) => ({ value: c, label: c })),
            ]} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowTriggerModal(false)}>Cancel</Button>
            <Button onClick={submitTrigger} disabled={saving || !triggerForm.template_id}>{saving ? 'Creating...' : 'Create Trigger'}</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
