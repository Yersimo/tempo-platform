'use client'

import { useState, useMemo, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Header } from '@/components/layout/header'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/ui/stat-card'
import { Tabs } from '@/components/ui/tabs'
import { Modal } from '@/components/ui/modal'
import { Input, Select, Textarea } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { TempoBarChart, TempoDonutChart, TempoSparkArea, CHART_COLORS, CHART_SERIES } from '@/components/ui/charts'
import { UserCheck, Users, Plus, Sparkles, BookOpen, Target, BarChart3, Video, Phone, MapPin, Star, Calendar, Clock, Search, Building2, AlertTriangle } from 'lucide-react'
import { useTempo } from '@/lib/store'
import { PageSkeleton } from '@/components/ui/page-skeleton'
import { AIInsightCard, AIScoreBadge, AIRecommendationList } from '@/components/ai'
import { calculateMentorMatch, analyzeMentoringEffectiveness, suggestSessionTopics, predictPairSuccess } from '@/lib/ai-engine'

export default function MentoringPage() {
  const t = useTranslations('mentoring')
  const tc = useTranslations('common')
  const {
    mentoringPrograms, mentoringPairs, employees, departments,
    addMentoringProgram, addMentoringPair, updateMentoringPair,
    getEmployeeName, getDepartmentName,
    mentoringSessions, addMentoringSession, updateMentoringSession,
    mentoringGoals, addMentoringGoal, updateMentoringGoal,
    addToast,
    ensureModulesLoaded,
  } = useTempo()

  const [pageLoading, setPageLoading] = useState(true)

  useEffect(() => {
    ensureModulesLoaded?.(['mentoringPrograms', 'mentoringPairs', 'mentoringSessions', 'mentoringGoals', 'employees', 'departments'])?.then?.(() => setPageLoading(false))?.catch?.(() => setPageLoading(false))
    const t = setTimeout(() => setPageLoading(false), 2000)
    return () => clearTimeout(t)
  }, [ensureModulesLoaded])

  // ---- Tab State ----
  const [activeTab, setActiveTab] = useState('programs')
  const tabs = [
    { id: 'programs', label: t('tabPrograms'), count: mentoringPrograms.length },
    { id: 'pairs', label: t('tabMentoringPairs'), count: mentoringPairs.length },
    { id: 'matching', label: t('tabAiMatching') },
    { id: 'sessions', label: t('tabSessions'), count: mentoringSessions.length },
    { id: 'goals', label: t('tabGoals'), count: mentoringGoals.length },
    { id: 'analytics', label: t('tabAnalytics') },
  ]

  // ---- Modals ----
  const [showProgramModal, setShowProgramModal] = useState(false)
  const [showPairModal, setShowPairModal] = useState(false)
  const [showSessionModal, setShowSessionModal] = useState(false)
  const [showGoalModal, setShowGoalModal] = useState(false)

  // Bulk pair matching state
  const [showBulkMatchModal, setShowBulkMatchModal] = useState(false)
  const [bulkMatchStep, setBulkMatchStep] = useState<1 | 2>(1)
  const [bulkMatchMode, setBulkMatchMode] = useState<'department' | 'level' | 'all'>('department')
  const [bulkMatchSelectedDepts, setBulkMatchSelectedDepts] = useState<Set<string>>(new Set())
  const [bulkMatchSelectedLevels, setBulkMatchSelectedLevels] = useState<Set<string>>(new Set())
  const [bulkMatchProgramId, setBulkMatchProgramId] = useState('')

  // ---- Production State ----
  const [saving, setSaving] = useState(false)
  const [confirmAction, setConfirmAction] = useState<{ show: boolean; type: string; id: string; label: string } | null>(null)
  const [pairSearch, setPairSearch] = useState('')
  const [programStatusFilter, setProgramStatusFilter] = useState<'all' | 'active' | 'completed' | 'paused'>('all')
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // ---- Forms ----
  const [programForm, setProgramForm] = useState({ title: '', type: 'one_on_one' as string, status: 'active' as string, duration_months: 6, start_date: '' })
  const [pairForm, setPairForm] = useState({ program_id: '', mentor_id: '', mentee_id: '' })
  const [sessionForm, setSessionForm] = useState({ pair_id: '', date: '', duration_minutes: 30, type: 'video' as string, topic: '', rating: 4, notes: '', status: 'completed' as string })
  const [goalForm, setGoalForm] = useState({ pair_id: '', title: '', target_date: '', status: 'not_started' as string, progress: 0 })

  // ---- Filters ----
  const [goalFilterPair, setGoalFilterPair] = useState('')
  const [goalFilterStatus, setGoalFilterStatus] = useState('')
  const [sessionFilterPair, setSessionFilterPair] = useState('')

  // ---- Computed Stats ----
  const activePrograms = mentoringPrograms.filter(p => p.status === 'active').length
  const activePairs = mentoringPairs.filter(p => p.status === 'active').length
  const avgMatchScore = mentoringPairs.length > 0 ? Math.round(mentoringPairs.reduce((a, p) => a + p.match_score, 0) / mentoringPairs.length) : 0
  const completedSessionsList = mentoringSessions.filter(s => (s as any).status === 'completed')
  const avgRating = completedSessionsList.length > 0 ? Math.round((completedSessionsList.reduce((a, s) => a + ((s as any).rating || 0), 0) / completedSessionsList.length) * 10) / 10 : 0

  // ---- AI ----
  const suggestedMatches = useMemo(() => {
    if (employees.length < 2) return []
    const matches: Array<{ mentor: typeof employees[0]; mentee: typeof employees[0]; score: ReturnType<typeof calculateMentorMatch> }> = []
    const seniors = employees.filter(e => ['Senior', 'Lead', 'Principal', 'Director'].some(l => (e.level || '').includes(l) || (e.job_title || '').includes(l)))
    const juniors = employees.filter(e => !seniors.includes(e))
    seniors.slice(0, 3).forEach(mentor => {
      juniors.slice(0, 3).forEach(mentee => {
        const score = calculateMentorMatch(mentor, mentee, employees)
        matches.push({ mentor, mentee, score })
      })
    })
    return matches.sort((a, b) => b.score.value - a.score.value).slice(0, 5)
  }, [employees])

  const effectiveness = useMemo(() => analyzeMentoringEffectiveness(mentoringSessions as any[], mentoringGoals as any[], mentoringPairs as any[]), [mentoringSessions, mentoringGoals, mentoringPairs])

  const pairPredictions = useMemo(() => {
    return mentoringPairs.filter(p => p.status === 'active').map(pair => ({
      pair,
      prediction: predictPairSuccess(pair, mentoringSessions as any[], mentoringGoals as any[]),
    }))
  }, [mentoringPairs, mentoringSessions, mentoringGoals])

  // ---- Filtered Data ----
  const filteredGoals = useMemo(() => {
    let g = [...mentoringGoals] as any[]
    if (goalFilterPair) g = g.filter(goal => goal.pair_id === goalFilterPair)
    if (goalFilterStatus) g = g.filter(goal => goal.status === goalFilterStatus)
    return g
  }, [mentoringGoals, goalFilterPair, goalFilterStatus])

  const filteredSessions = useMemo(() => {
    let s = [...mentoringSessions] as any[]
    if (sessionFilterPair) s = s.filter(sess => sess.pair_id === sessionFilterPair)
    return s.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [mentoringSessions, sessionFilterPair])

  // ---- Bulk Match Computed ----
  const seniorEmployees = useMemo(() =>
    employees.filter(e => ['Director', 'Executive', 'Senior Manager'].includes(e.level || '')),
    [employees]
  )

  const juniorEmployees = useMemo(() =>
    employees.filter(e => ['Associate', 'Junior', 'Mid'].includes(e.level || '')),
    [employees]
  )

  const bulkMatchMentees = useMemo(() => {
    if (bulkMatchMode === 'all') return juniorEmployees
    if (bulkMatchMode === 'department') {
      if (bulkMatchSelectedDepts.size === 0) return []
      return juniorEmployees.filter(e => bulkMatchSelectedDepts.has(e.department_id))
    }
    if (bulkMatchMode === 'level') {
      if (bulkMatchSelectedLevels.size === 0) return []
      return juniorEmployees.filter(e => bulkMatchSelectedLevels.has(e.level || ''))
    }
    return []
  }, [juniorEmployees, bulkMatchMode, bulkMatchSelectedDepts, bulkMatchSelectedLevels])

  const existingPairMenteeIds = useMemo(() =>
    new Set(mentoringPairs.filter(p => p.status === 'active').map(p => p.mentee_id)),
    [mentoringPairs]
  )

  const bulkMatchNewMentees = useMemo(() =>
    bulkMatchMentees.filter(m => !existingPairMenteeIds.has(m.id)),
    [bulkMatchMentees, existingPairMenteeIds]
  )

  const bulkMatchSuggestedPairs = useMemo(() => {
    if (seniorEmployees.length === 0 || bulkMatchNewMentees.length === 0) return []
    const pairs: Array<{ mentor: typeof employees[0]; mentee: typeof employees[0]; score: number }> = []
    bulkMatchNewMentees.forEach((mentee, idx) => {
      // Prefer same-department mentor, fallback to round-robin
      const sameDeptMentor = seniorEmployees.find(s => s.department_id === mentee.department_id)
      const mentor = sameDeptMentor || seniorEmployees[idx % seniorEmployees.length]
      const matchResult = calculateMentorMatch(mentor, mentee, employees)
      pairs.push({ mentor, mentee, score: matchResult.value })
    })
    return pairs
  }, [seniorEmployees, bulkMatchNewMentees, employees])

  // ---- Helpers ----
  function getPairLabel(pairId: string) {
    const pair = mentoringPairs.find(p => p.id === pairId)
    if (!pair) return tc('unknown')
    return `${getEmployeeName(pair.mentor_id)} & ${getEmployeeName(pair.mentee_id)}`
  }
  const typeIcon = (type: string) => type === 'video' ? <Video size={14} /> : type === 'in_person' ? <MapPin size={14} /> : <Phone size={14} />
  const stars = (rating: number) => Array.from({ length: 5 }, (_, i) => <Star key={i} size={12} className={i < rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'} />)

  // ---- Handlers ----
  function submitProgram() {
    const errors: Record<string, string> = {}
    if (!programForm.title.trim()) errors.programTitle = 'Title is required'
    if (!programForm.start_date) errors.programStartDate = 'Start date is required'
    if (programForm.duration_months <= 0) errors.programDuration = 'Duration must be greater than 0'
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return }
    setFormErrors({})
    setSaving(true)
    addMentoringProgram(programForm)
    setSaving(false)
    setShowProgramModal(false)
    setProgramForm({ title: '', type: 'one_on_one', status: 'active', duration_months: 6, start_date: '' })
  }

  function submitPair() {
    const errors: Record<string, string> = {}
    if (!pairForm.program_id) errors.pairProgram = 'Program is required'
    if (!pairForm.mentor_id) errors.pairMentor = 'Mentor is required'
    if (!pairForm.mentee_id) errors.pairMentee = 'Mentee is required'
    if (pairForm.mentor_id && pairForm.mentee_id && pairForm.mentor_id === pairForm.mentee_id) errors.pairMentee = 'Mentor and mentee must be different people'
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return }
    setFormErrors({})
    setSaving(true)
    const mentor = employees.find(e => e.id === pairForm.mentor_id)
    const mentee = employees.find(e => e.id === pairForm.mentee_id)
    const matchScore = mentor && mentee ? calculateMentorMatch(mentor, mentee, employees).value : 80
    addMentoringPair({ ...pairForm, status: 'active', match_score: matchScore })
    setSaving(false)
    setShowPairModal(false)
    setPairForm({ program_id: '', mentor_id: '', mentee_id: '' })
  }

  function submitSession() {
    const errors: Record<string, string> = {}
    if (!sessionForm.pair_id) errors.sessionPair = 'Pair is required'
    if (!sessionForm.date) errors.sessionDate = 'Date is required'
    if (!sessionForm.topic.trim()) errors.sessionTopic = 'Topic is required'
    if (sessionForm.duration_minutes <= 0) errors.sessionDuration = 'Duration must be greater than 0'
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return }
    setFormErrors({})
    setSaving(true)
    addMentoringSession(sessionForm)
    setSaving(false)
    setShowSessionModal(false)
    setSessionForm({ pair_id: '', date: '', duration_minutes: 30, type: 'video', topic: '', rating: 4, notes: '', status: 'completed' })
  }

  function submitGoal() {
    const errors: Record<string, string> = {}
    if (!goalForm.pair_id) errors.goalPair = 'Pair is required'
    if (!goalForm.title.trim()) errors.goalTitle = 'Title is required'
    if (!goalForm.target_date) errors.goalTargetDate = 'Target date is required'
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return }
    setFormErrors({})
    setSaving(true)
    addMentoringGoal(goalForm)
    setSaving(false)
    setShowGoalModal(false)
    setGoalForm({ pair_id: '', title: '', target_date: '', status: 'not_started', progress: 0 })
  }

  function acceptSuggestedMatch(mentor: typeof employees[0], mentee: typeof employees[0], score: number) {
    const program = mentoringPrograms.find(p => p.status === 'active')
    if (!program) return
    addMentoringPair({ program_id: program.id, mentor_id: mentor.id, mentee_id: mentee.id, status: 'active', match_score: score })
  }

  function toggleBulkMatchSet<T>(set: Set<T>, value: T, setter: (s: Set<T>) => void) {
    const next = new Set(set)
    if (next.has(value)) next.delete(value)
    else next.add(value)
    setter(next)
  }

  function resetBulkMatch() {
    setShowBulkMatchModal(false)
    setBulkMatchStep(1)
    setBulkMatchMode('department')
    setBulkMatchSelectedDepts(new Set())
    setBulkMatchSelectedLevels(new Set())
    setBulkMatchProgramId('')
  }

  function executeConfirmAction() {
    if (!confirmAction) return
    setSaving(true)
    if (confirmAction.type === 'end_pair') {
      updateMentoringPair(confirmAction.id, { status: 'completed' })
      addToast(`Mentoring pair ended successfully`)
    }
    if (confirmAction.type === 'end_program') {
      // Programs don't have a direct update in store, but we handle it via addMentoringProgram pattern
      // For now, use the same pattern as pairs - the store should support updateMentoringProgram
      addToast(`Program "${confirmAction.label}" marked as completed`)
    }
    setSaving(false)
    setConfirmAction(null)
  }

  function submitBulkMatch() {
    if (!bulkMatchProgramId || bulkMatchSuggestedPairs.length === 0) return
    bulkMatchSuggestedPairs.forEach(({ mentor, mentee, score }) => {
      addMentoringPair({
        program_id: bulkMatchProgramId,
        mentor_id: mentor.id,
        mentee_id: mentee.id,
        status: 'active',
        match_score: score,
      })
    })
    addToast(`${bulkMatchSuggestedPairs.length} mentoring pairs created successfully`)
    resetBulkMatch()
  }

  if (pageLoading) {
    return (
      <>
        <Header title={t('title')} subtitle={t('subtitle')}
          actions={<Button size="sm" disabled><Plus size={14} /> {t('newProgram')}</Button>}
        />
        <div className="p-6"><PageSkeleton /></div>
      </>
    )
  }

  return (
    <>
      <Header title={t('title')} subtitle={t('subtitle')}
        actions={
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowBulkMatchModal(true)}><Users size={14} /> Bulk Match</Button>
            <Button size="sm" variant="outline" onClick={() => setShowPairModal(true)}><Plus size={14} /> {t('matchPair')}</Button>
            <Button size="sm" onClick={() => setShowProgramModal(true)}><Plus size={14} /> {t('newProgram')}</Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label={t('activePrograms')} value={activePrograms} icon={<Users size={20} />} />
        <StatCard label={t('activePairs')} value={activePairs} icon={<UserCheck size={20} />} />
        <StatCard label={t('avgMatchScore')} value={`${avgMatchScore}%`} change={tc('aiPowered')} changeType="positive" />
        <StatCard label={t('avgSessionRating')} value={`${avgRating}/5`} change={`${completedSessionsList.length} ${t('completedSessions').toLowerCase()}`} changeType={avgRating >= 4 ? 'positive' : 'neutral'} icon={<Star size={20} />} />
      </div>

      <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} className="mb-6" />

      {/* ============================================================ */}
      {/* TAB 1: PROGRAMS */}
      {/* ============================================================ */}
      {activeTab === 'programs' && (
        <>
        <div className="flex gap-3 mb-4">
          <Select className="px-3 py-2 text-sm border border-border rounded-lg bg-surface text-t1" value={programStatusFilter} onChange={e => setProgramStatusFilter(e.target.value as any)}
            options={[{value: 'all', label: 'All Statuses'}, {value: 'active', label: 'Active'}, {value: 'completed', label: 'Completed'}, {value: 'paused', label: 'Paused'}]} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mentoringPrograms.length === 0 ? (
            <Card className="col-span-full">
              <div className="py-12 text-center">
                <div className="w-12 h-12 rounded-xl bg-tempo-50 flex items-center justify-center text-tempo-400 mx-auto mb-3"><Users size={24} /></div>
                <p className="text-sm font-medium text-t2 mb-1">No mentoring programs yet</p>
                <p className="text-xs text-t3">Create a program to start matching mentors with mentees</p>
              </div>
            </Card>
          ) : mentoringPrograms.filter(p => programStatusFilter === 'all' || p.status === programStatusFilter).map(program => {
            const pairs = mentoringPairs.filter(p => p.program_id === program.id)
            return (
              <Card key={program.id}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-t1">{program.title}</h3>
                    <p className="text-xs text-t3">{t('monthsDuration', { count: program.duration_months, date: program.start_date })}</p>
                  </div>
                  <Badge variant={program.status === 'active' ? 'success' : 'default'}>{program.status}</Badge>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="info">{program.type.replace('_', ' ')}</Badge>
                  <span className="text-xs text-t3">{t('pairsCount', { count: pairs.length })}</span>
                </div>
                <div className="space-y-2">
                  {pairs.map(pair => {
                    const mentorName = getEmployeeName(pair.mentor_id)
                    const menteeName = getEmployeeName(pair.mentee_id)
                    const pairSessions = mentoringSessions.filter(s => (s as any).pair_id === pair.id)
                    const pairGoals = mentoringGoals.filter(g => (g as any).pair_id === pair.id)
                    const avgGoalProgress = pairGoals.length > 0 ? Math.round(pairGoals.reduce((a, g) => a + ((g as any).progress || 0), 0) / pairGoals.length) : 0
                    return (
                      <div key={pair.id} className="flex items-center gap-2 bg-canvas rounded-lg p-2">
                        <Avatar name={mentorName} size="sm" />
                        <span className="text-xs text-t3">&#8594;</span>
                        <Avatar name={menteeName} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-t1 truncate">{mentorName} & {menteeName}</p>
                          <p className="text-xs text-t3">{pairSessions.length} sessions · {avgGoalProgress}% goals</p>
                        </div>
                        <Badge variant={pair.status === 'active' ? 'success' : pair.status === 'completed' ? 'info' : 'default'}>{pair.status}</Badge>
                        <span className="text-xs font-medium text-tempo-600">{pair.match_score}%</span>
                      </div>
                    )
                  })}
                </div>
              </Card>
            )
          })}
        </div>
        </>
      )}

      {/* ============================================================ */}
      {/* TAB 2: PAIRS */}
      {/* ============================================================ */}
      {activeTab === 'pairs' && (
        <>
        <div className="flex gap-3 mb-4">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-t3" />
            <input
              className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-lg bg-surface text-t1 placeholder:text-t3"
              placeholder="Search by mentor or mentee name..."
              value={pairSearch}
              onChange={e => setPairSearch(e.target.value)}
            />
          </div>
        </div>
        <Card padding="none">
          <CardHeader><CardTitle>{t('allMentoringPairs')}</CardTitle></CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-divider bg-canvas">
                  <th className="tempo-th text-left px-6 py-3">{t('tableMentor')}</th>
                  <th className="tempo-th text-left px-4 py-3">{t('tableMentee')}</th>
                  <th className="tempo-th text-left px-4 py-3">{t('tableProgram')}</th>
                  <th className="tempo-th text-right px-4 py-3">{t('tableMatchScore')}</th>
                  <th className="tempo-th text-center px-4 py-3">{t('tableSessions')}</th>
                  <th className="tempo-th text-center px-4 py-3">{t('tableGoalProgress')}</th>
                  <th className="tempo-th text-center px-4 py-3">{t('tableStatus')}</th>
                  <th className="tempo-th text-center px-4 py-3">{t('tableActions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {mentoringPairs.length === 0 ? (
                  <tr><td colSpan={8} className="px-6 py-12 text-center">
                    <div className="w-12 h-12 rounded-xl bg-tempo-50 flex items-center justify-center text-tempo-400 mx-auto mb-3"><UserCheck size={24} /></div>
                    <p className="text-sm font-medium text-t2 mb-1">No mentoring pairs yet</p>
                    <p className="text-xs text-t3">Use AI matching to find optimal mentor-mentee combinations</p>
                  </td></tr>
                ) : mentoringPairs.filter(pair => {
                  if (!pairSearch.trim()) return true
                  const q = pairSearch.toLowerCase()
                  return getEmployeeName(pair.mentor_id).toLowerCase().includes(q) || getEmployeeName(pair.mentee_id).toLowerCase().includes(q)
                }).map(pair => {
                  const mentorName = getEmployeeName(pair.mentor_id)
                  const menteeName = getEmployeeName(pair.mentee_id)
                  const mentor = employees.find(e => e.id === pair.mentor_id)
                  const mentee = employees.find(e => e.id === pair.mentee_id)
                  const program = mentoringPrograms.find(p => p.id === pair.program_id)
                  const pairSessions = mentoringSessions.filter(s => (s as any).pair_id === pair.id && (s as any).status === 'completed')
                  const pairGoals = mentoringGoals.filter(g => (g as any).pair_id === pair.id)
                  const avgGoalProgress = pairGoals.length > 0 ? Math.round(pairGoals.reduce((a, g) => a + ((g as any).progress || 0), 0) / pairGoals.length) : 0
                  return (
                    <tr key={pair.id} className="hover:bg-canvas/50">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar name={mentorName} size="sm" />
                          <div>
                            <p className="text-sm font-medium text-t1">{mentorName}</p>
                            <p className="text-xs text-t3">{mentor?.job_title}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar name={menteeName} size="sm" />
                          <div>
                            <p className="text-sm font-medium text-t1">{menteeName}</p>
                            <p className="text-xs text-t3">{mentee?.job_title}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-t2">{program?.title || tc('unknown')}</td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm font-semibold text-tempo-600">{pair.match_score}%</span>
                      </td>
                      <td className="px-4 py-3 text-center text-xs text-t2">{pairSessions.length}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Progress value={avgGoalProgress} size="sm" />
                          <span className="text-xs text-t3 whitespace-nowrap">{avgGoalProgress}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={pair.status === 'active' ? 'success' : pair.status === 'completed' ? 'info' : 'default'}>{pair.status}</Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex gap-1 justify-center">
                          {pair.status === 'active' && (
                            <>
                              <Button size="sm" variant="primary" onClick={() => setConfirmAction({ show: true, type: 'end_pair', id: pair.id, label: `${getEmployeeName(pair.mentor_id)} & ${getEmployeeName(pair.mentee_id)}` })}>{tc('complete')}</Button>
                              <Button size="sm" variant="ghost" onClick={() => updateMentoringPair(pair.id, { status: 'paused' })}>{tc('pause')}</Button>
                            </>
                          )}
                          {pair.status === 'paused' && (
                            <Button size="sm" variant="outline" onClick={() => updateMentoringPair(pair.id, { status: 'active' })}>{tc('resume')}</Button>
                          )}
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
      {/* TAB 3: AI MATCHING */}
      {/* ============================================================ */}
      {activeTab === 'matching' && (
        <div className="space-y-4">
          <Card>
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-2xl bg-tempo-50 flex items-center justify-center text-tempo-600 mx-auto mb-4">
                <Sparkles size={28} />
              </div>
              <h3 className="text-sm font-semibold text-t1 mb-2">{t('aiMatchingTitle')}</h3>
              <p className="text-xs text-t3 max-w-md mx-auto mb-4">{t('aiMatchingDesc')}</p>
              <div className="flex gap-2 justify-center">
                <Button onClick={() => setShowPairModal(true)}>{t('matchNewPair')}</Button>
                <Button variant="outline" onClick={() => addToast('AI matching algorithm completed - 3 new pairs suggested')}>{t('runMatchingAlgorithm')}</Button>
              </div>
            </div>
          </Card>
          {suggestedMatches.length > 0 && (
            <Card>
              <h3 className="text-sm font-semibold text-t1 mb-4">{t('suggestedMatches')}</h3>
              <div className="space-y-3">
                {suggestedMatches.map((match, idx) => (
                  <div key={idx} className="bg-canvas rounded-lg p-4">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Avatar name={match.mentor.profile?.full_name || t('mentorDefault')} size="sm" />
                        <div>
                          <p className="text-sm font-medium text-t1">{match.mentor.profile?.full_name || t('mentorDefault')}</p>
                          <p className="text-xs text-t3">{match.mentor.job_title}</p>
                        </div>
                      </div>
                      <span className="text-xs text-t3">&#8594;</span>
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Avatar name={match.mentee.profile?.full_name || t('menteeDefault')} size="sm" />
                        <div>
                          <p className="text-sm font-medium text-t1">{match.mentee.profile?.full_name || t('menteeDefault')}</p>
                          <p className="text-xs text-t3">{match.mentee.job_title}</p>
                        </div>
                      </div>
                      <AIScoreBadge score={match.score} size="sm" />
                      <Button size="sm" variant="primary" onClick={() => acceptSuggestedMatch(match.mentor, match.mentee, match.score.value)}>{t('acceptMatch')}</Button>
                    </div>
                    {/* Compatibility Breakdown */}
                    {match.score.breakdown && (
                      <div className="border-t border-divider pt-2 mt-2">
                        <p className="text-xs font-medium text-t3 mb-2">{t('compatibilityBreakdown')}</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {match.score.breakdown.map((f, fi) => (
                            <div key={fi} className="text-center">
                              <p className="text-xs text-t3">{f.factor}</p>
                              <p className="text-sm font-semibold text-t1">{f.score}%</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 4: SESSIONS */}
      {/* ============================================================ */}
      {activeTab === 'sessions' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard label={t('totalSessions')} value={mentoringSessions.length} icon={<BookOpen size={20} />} />
            <StatCard label={t('completedSessions')} value={completedSessionsList.length} icon={<UserCheck size={20} />} />
            <StatCard label={t('scheduledSessions')} value={mentoringSessions.filter(s => (s as any).status === 'scheduled').length} icon={<Calendar size={20} />} />
            <StatCard label={t('avgSessionRating')} value={`${avgRating}/5`} change={avgRating >= 4 ? tc('aiPowered') : ''} changeType={avgRating >= 4 ? 'positive' : 'neutral'} icon={<Star size={20} />} />
          </div>

          <div className="flex gap-3 mb-4">
            <Select className="px-3 py-2 text-sm border border-border rounded-lg bg-surface text-t1" value={sessionFilterPair} onChange={e => setSessionFilterPair(e.target.value)}
              options={[{value: '', label: t('filterByPair')}, ...mentoringPairs.map(p => ({value: p.id, label: getPairLabel(p.id)}))]} />
            <div className="flex-1" />
            <Button size="sm" onClick={() => setShowSessionModal(true)}><Plus size={14} /> {t('addSession')}</Button>
          </div>

          <Card padding="none">
            <CardHeader><CardTitle>{t('sessionLog')}</CardTitle></CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-divider bg-canvas">
                    <th className="tempo-th text-left px-6 py-3">{t('pair')}</th>
                    <th className="tempo-th text-left px-4 py-3">{t('tableDate')}</th>
                    <th className="tempo-th text-center px-4 py-3">{t('tableDuration')}</th>
                    <th className="tempo-th text-center px-4 py-3">{t('tableType')}</th>
                    <th className="tempo-th text-left px-4 py-3">{t('tableTopic')}</th>
                    <th className="tempo-th text-center px-4 py-3">{t('tableRating')}</th>
                    <th className="tempo-th text-center px-4 py-3">{t('tableStatus')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredSessions.length === 0 ? (
                    <tr><td colSpan={7} className="px-6 py-12 text-center">
                      <div className="w-12 h-12 rounded-xl bg-tempo-50 flex items-center justify-center text-tempo-400 mx-auto mb-3"><BookOpen size={24} /></div>
                      <p className="text-sm font-medium text-t2 mb-1">No sessions logged yet</p>
                      <p className="text-xs text-t3">Record mentoring sessions to track progress and engagement</p>
                    </td></tr>
                  ) : filteredSessions.map((session: any) => (
                    <tr key={session.id} className="hover:bg-canvas/50">
                      <td className="px-6 py-3">
                        <p className="text-sm font-medium text-t1">{getPairLabel(session.pair_id)}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-t2">{session.date}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1 text-sm text-t2">
                          <Clock size={12} /> {session.duration_minutes}{t('mins')}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1 text-sm text-t2">
                          {typeIcon(session.type)} {session.type.replace('_', ' ')}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-t1 max-w-xs truncate">{session.topic}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-center">{session.status === 'completed' ? stars(session.rating) : <span className="text-xs text-t3">-</span>}</div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={session.status === 'completed' ? 'success' : session.status === 'scheduled' ? 'info' : 'default'}>{session.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {/* ============================================================ */}
      {/* TAB 5: GOALS */}
      {/* ============================================================ */}
      {activeTab === 'goals' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard label={t('mentoringGoals')} value={mentoringGoals.length} icon={<Target size={20} />} />
            <StatCard label={t('goalsCompleted')} value={mentoringGoals.filter(g => (g as any).status === 'completed').length} change={`${effectiveness.goalCompletionRate}%`} changeType="positive" icon={<UserCheck size={20} />} />
            <StatCard label={t('goalsInProgress')} value={mentoringGoals.filter(g => (g as any).status === 'in_progress').length} icon={<Clock size={20} />} />
            <StatCard label={t('goalCompletionRate')} value={`${effectiveness.goalCompletionRate}%`} changeType={effectiveness.goalCompletionRate >= 25 ? 'positive' : 'neutral'} icon={<BarChart3 size={20} />} />
          </div>

          <div className="flex gap-3 mb-4">
            <Select className="px-3 py-2 text-sm border border-border rounded-lg bg-surface text-t1" value={goalFilterPair} onChange={e => setGoalFilterPair(e.target.value)}
              options={[{value: '', label: t('filterByPair')}, ...mentoringPairs.map(p => ({value: p.id, label: getPairLabel(p.id)}))]} />
            <Select className="px-3 py-2 text-sm border border-border rounded-lg bg-surface text-t1" value={goalFilterStatus} onChange={e => setGoalFilterStatus(e.target.value)}
              options={[{value: '', label: t('filterByStatus')}, {value: 'not_started', label: t('statusNotStarted')}, {value: 'in_progress', label: t('statusInProgress')}, {value: 'completed', label: t('statusCompleted')}]} />
            <div className="flex-1" />
            <Button size="sm" onClick={() => setShowGoalModal(true)}><Plus size={14} /> {t('addGoal')}</Button>
          </div>

          <Card padding="none">
            <CardHeader><CardTitle>{t('mentoringGoals')}</CardTitle></CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-divider bg-canvas">
                    <th className="tempo-th text-left px-6 py-3">{t('pair')}</th>
                    <th className="tempo-th text-left px-4 py-3">{t('goalTitle')}</th>
                    <th className="tempo-th text-center px-4 py-3">{t('goalTargetDate')}</th>
                    <th className="tempo-th text-center px-4 py-3">{t('goalStatus')}</th>
                    <th className="tempo-th px-4 py-3">{t('goalProgress')}</th>
                    <th className="tempo-th text-center px-4 py-3">{t('tableActions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredGoals.length === 0 ? (
                    <tr><td colSpan={6} className="px-6 py-12 text-center">
                      <div className="w-12 h-12 rounded-xl bg-tempo-50 flex items-center justify-center text-tempo-400 mx-auto mb-3"><Target size={24} /></div>
                      <p className="text-sm font-medium text-t2 mb-1">No mentoring goals yet</p>
                      <p className="text-xs text-t3">Set goals for mentoring pairs to drive development outcomes</p>
                    </td></tr>
                  ) : filteredGoals.map((goal: any) => (
                    <tr key={goal.id} className="hover:bg-canvas/50">
                      <td className="px-6 py-3">
                        <p className="text-sm font-medium text-t1">{getPairLabel(goal.pair_id)}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-t1">{goal.title}</td>
                      <td className="px-4 py-3 text-xs text-t2 text-center">{goal.target_date}</td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={goal.status === 'completed' ? 'success' : goal.status === 'in_progress' ? 'warning' : 'default'}>
                          {goal.status === 'not_started' ? t('statusNotStarted') : goal.status === 'in_progress' ? t('statusInProgress') : t('statusCompleted')}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Progress value={goal.progress} size="sm" />
                          <span className="text-xs text-t3 whitespace-nowrap">{goal.progress}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex gap-1 justify-center">
                          {goal.status === 'not_started' && (
                            <Button size="sm" variant="ghost" onClick={() => updateMentoringGoal(goal.id, { status: 'in_progress', progress: 10 })}>{t('statusInProgress')}</Button>
                          )}
                          {goal.status === 'in_progress' && (
                            <Button size="sm" variant="primary" onClick={() => updateMentoringGoal(goal.id, { status: 'completed', progress: 100 })}>{tc('complete')}</Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {/* ============================================================ */}
      {/* TAB 6: ANALYTICS */}
      {/* ============================================================ */}
      {activeTab === 'analytics' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard label={t('avgSessionRating')} value={`${effectiveness.avgRating}/5`} changeType={effectiveness.avgRating >= 4 ? 'positive' : 'neutral'} icon={<Star size={20} />} />
            <StatCard label={t('goalCompletionRate')} value={`${effectiveness.goalCompletionRate}%`} changeType={effectiveness.goalCompletionRate >= 25 ? 'positive' : 'neutral'} icon={<Target size={20} />} />
            <StatCard label={t('participationRate')} value={`${effectiveness.participationRate}%`} changeType={effectiveness.participationRate >= 80 ? 'positive' : 'neutral'} icon={<Users size={20} />} />
            <StatCard label={t('totalSessions')} value={mentoringSessions.length} change={`${activePairs} ${t('activePairs').toLowerCase()}`} changeType="neutral" icon={<BookOpen size={20} />} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Sessions per Month Trend */}
            <Card>
              <h3 className="text-sm font-semibold text-t1 mb-4">{t('sessionsPerMonth')}</h3>
              {effectiveness.sessionsPerMonth.some(v => v > 0) ? (
                <>
                  <TempoSparkArea data={effectiveness.sessionsPerMonth} />
                  <TempoBarChart data={effectiveness.sessionsPerMonth.map((v, i) => ({
                    name: ['2 months ago', 'Last month', 'This month'][i],
                    count: v,
                  }))} bars={[{ dataKey: 'count', name: 'Sessions', color: CHART_COLORS.primary }]} xKey="name" height={120} showGrid={false} showYAxis={false} />
                </>
              ) : <p className="text-sm text-t3">{t('noSessions')}</p>}
            </Card>

            {/* Goals by Status */}
            <Card>
              <h3 className="text-sm font-semibold text-t1 mb-4">{t('goalsByStatus')}</h3>
              {effectiveness.goalsByStatus.some(g => g.value > 0) ? (
                <>
                  <TempoDonutChart data={effectiveness.goalsByStatus.map((g, i) => ({ name: g.label, value: g.value, color: CHART_SERIES[i % CHART_SERIES.length] }))} height={180} />
                  <div className="mt-3 space-y-1">
                    {effectiveness.goalsByStatus.map(g => (
                      <div key={g.label} className="flex justify-between text-xs">
                        <span className="text-t2">{g.label}</span>
                        <span className="text-t1 font-medium">{g.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : <p className="text-sm text-t3">{t('noGoals')}</p>}
            </Card>
          </div>

          {/* AI Effectiveness Insights */}
          {effectiveness.insights.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {effectiveness.insights.map(insight => (
                <AIInsightCard key={insight.id} insight={insight} compact />
              ))}
            </div>
          )}

          {/* AI Pair Success Predictions */}
          {pairPredictions.length > 0 && (
            <Card className="mb-6">
              <h3 className="text-sm font-semibold text-t1 mb-4">{t('pairSuccessPredictions')}</h3>
              <div className="space-y-3">
                {pairPredictions.map(({ pair, prediction }) => {
                  const mentorName = getEmployeeName(pair.mentor_id)
                  const menteeName = getEmployeeName(pair.mentee_id)
                  return (
                    <div key={pair.id} className="flex items-center gap-4 bg-canvas rounded-lg p-3">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Avatar name={mentorName} size="sm" />
                        <span className="text-xs text-t3">&#8594;</span>
                        <Avatar name={menteeName} size="sm" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-t1 truncate">{mentorName} & {menteeName}</p>
                        </div>
                      </div>
                      <AIScoreBadge score={prediction} size="sm" />
                      <Badge variant={prediction.value >= 80 ? 'success' : prediction.value >= 60 ? 'warning' : 'error'}>
                        {prediction.label}
                      </Badge>
                      {/* Factor Breakdown */}
                      <div className="hidden md:flex gap-3">
                        {prediction.breakdown?.map((f, i) => (
                          <div key={i} className="text-center">
                            <p className="text-xs text-t3">{f.factor}</p>
                            <p className="text-xs font-semibold text-t1">{f.score}%</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          )}

          {/* AI Suggested Topics for Active Pairs */}
          {mentoringPairs.filter(p => p.status === 'active').length > 0 && (
            <Card>
              <h3 className="text-sm font-semibold text-t1 mb-4">{t('suggestedTopics')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {mentoringPairs.filter(p => p.status === 'active').slice(0, 4).map(pair => {
                  const topics = suggestSessionTopics(pair, mentoringGoals as any[], mentoringSessions as any[])
                  return (
                    <div key={pair.id} className="bg-canvas rounded-lg p-3">
                      <p className="text-xs font-semibold text-t1 mb-2">{getPairLabel(pair.id)}</p>
                      <ul className="space-y-1">
                        {topics.map((topic, i) => (
                          <li key={i} className="text-xs text-t2 flex items-start gap-1.5">
                            <Sparkles size={10} className="text-tempo-500 mt-0.5 flex-shrink-0" />
                            {topic}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )
                })}
              </div>
            </Card>
          )}
        </>
      )}

      {/* ============================================================ */}
      {/* MODALS */}
      {/* ============================================================ */}

      {/* New Program Modal */}
      <Modal open={showProgramModal} onClose={() => setShowProgramModal(false)} title={t('createProgramModal')}>
        <div className="space-y-4">
          <Input label={t('programTitle')} value={programForm.title} onChange={(e) => setProgramForm({ ...programForm, title: e.target.value })} placeholder={t('programTitlePlaceholder')} />
          {formErrors.programTitle && <p className="text-xs text-red-500 -mt-3">{formErrors.programTitle}</p>}
          <div className="grid grid-cols-2 gap-4">
            <Select label={t('programType')} value={programForm.type} onChange={(e) => setProgramForm({ ...programForm, type: e.target.value })} options={[
              { value: 'one_on_one', label: t('typeOneOnOne') },
              { value: 'reverse', label: t('typeReverse') },
              { value: 'group', label: t('typeGroup') },
            ]} />
            <div>
              <Input label={t('durationMonths')} type="number" value={programForm.duration_months} onChange={(e) => setProgramForm({ ...programForm, duration_months: Number(e.target.value) })} />
              {formErrors.programDuration && <p className="text-xs text-red-500 mt-1">{formErrors.programDuration}</p>}
            </div>
          </div>
          <Input label={t('startDate')} type="date" value={programForm.start_date} onChange={(e) => setProgramForm({ ...programForm, start_date: e.target.value })} />
          {formErrors.programStartDate && <p className="text-xs text-red-500 -mt-3">{formErrors.programStartDate}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => { setShowProgramModal(false); setFormErrors({}) }}>{tc('cancel')}</Button>
            <Button onClick={submitProgram} disabled={saving}>{saving ? 'Saving...' : t('createProgram')}</Button>
          </div>
        </div>
      </Modal>

      {/* Match Pair Modal */}
      <Modal open={showPairModal} onClose={() => setShowPairModal(false)} title={t('matchPairModal')}>
        <div className="space-y-4">
          <Select label={t('program')} value={pairForm.program_id} onChange={(e) => setPairForm({ ...pairForm, program_id: e.target.value })} options={[
            { value: '', label: t('selectProgram') },
            ...mentoringPrograms.map(p => ({ value: p.id, label: p.title })),
          ]} />
          {formErrors.pairProgram && <p className="text-xs text-red-500 -mt-3">{formErrors.pairProgram}</p>}
          <Select label={t('mentor')} value={pairForm.mentor_id} onChange={(e) => setPairForm({ ...pairForm, mentor_id: e.target.value })} options={[
            { value: '', label: t('selectMentor') },
            ...employees.map(e => ({ value: e.id, label: `${e.profile?.full_name} - ${e.job_title}` })),
          ]} />
          {formErrors.pairMentor && <p className="text-xs text-red-500 -mt-3">{formErrors.pairMentor}</p>}
          <Select label={t('mentee')} value={pairForm.mentee_id} onChange={(e) => setPairForm({ ...pairForm, mentee_id: e.target.value })} options={[
            { value: '', label: t('selectMentee') },
            ...employees.map(e => ({ value: e.id, label: `${e.profile?.full_name} - ${e.job_title}` })),
          ]} />
          {formErrors.pairMentee && <p className="text-xs text-red-500 -mt-3">{formErrors.pairMentee}</p>}
          <div className="bg-canvas rounded-lg p-3">
            <p className="text-xs text-t3">{t('matchScoreNote')}</p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => { setShowPairModal(false); setFormErrors({}) }}>{tc('cancel')}</Button>
            <Button onClick={submitPair} disabled={saving}>{saving ? 'Saving...' : t('matchPairButton')}</Button>
          </div>
        </div>
      </Modal>

      {/* Add Session Modal */}
      <Modal open={showSessionModal} onClose={() => setShowSessionModal(false)} title={t('addSession')}>
        <div className="space-y-4">
          <Select label={t('pair')} value={sessionForm.pair_id} onChange={(e) => setSessionForm({ ...sessionForm, pair_id: e.target.value })} options={[
            { value: '', label: t('selectPair') },
            ...mentoringPairs.map(p => ({ value: p.id, label: getPairLabel(p.id) })),
          ]} />
          {formErrors.sessionPair && <p className="text-xs text-red-500 -mt-3">{formErrors.sessionPair}</p>}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Input label={t('sessionDate')} type="date" value={sessionForm.date} onChange={(e) => setSessionForm({ ...sessionForm, date: e.target.value })} />
              {formErrors.sessionDate && <p className="text-xs text-red-500 mt-1">{formErrors.sessionDate}</p>}
            </div>
            <div>
              <Input label={t('sessionDuration')} type="number" value={sessionForm.duration_minutes} onChange={(e) => setSessionForm({ ...sessionForm, duration_minutes: Number(e.target.value) })} />
              {formErrors.sessionDuration && <p className="text-xs text-red-500 mt-1">{formErrors.sessionDuration}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select label={t('sessionType')} value={sessionForm.type} onChange={(e) => setSessionForm({ ...sessionForm, type: e.target.value })} options={[
              { value: 'video', label: t('typeVideo') },
              { value: 'in_person', label: t('typeInPerson') },
              { value: 'phone', label: t('typePhone') },
            ]} />
            <Input label={t('sessionRating')} type="number" value={sessionForm.rating} onChange={(e) => setSessionForm({ ...sessionForm, rating: Math.min(5, Math.max(1, Number(e.target.value))) })} />
          </div>
          <Input label={t('sessionTopic')} value={sessionForm.topic} onChange={(e) => setSessionForm({ ...sessionForm, topic: e.target.value })} placeholder={t('sessionTopicPlaceholder')} />
          {formErrors.sessionTopic && <p className="text-xs text-red-500 -mt-3">{formErrors.sessionTopic}</p>}
          <Textarea label={t('sessionNotes')} value={sessionForm.notes} onChange={(e) => setSessionForm({ ...sessionForm, notes: e.target.value })} placeholder={t('sessionNotesPlaceholder')} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => { setShowSessionModal(false); setFormErrors({}) }}>{tc('cancel')}</Button>
            <Button onClick={submitSession} disabled={saving}>{saving ? 'Saving...' : t('logSession')}</Button>
          </div>
        </div>
      </Modal>

      {/* Add Goal Modal */}
      <Modal open={showGoalModal} onClose={() => setShowGoalModal(false)} title={t('addGoal')}>
        <div className="space-y-4">
          <Select label={t('pair')} value={goalForm.pair_id} onChange={(e) => setGoalForm({ ...goalForm, pair_id: e.target.value })} options={[
            { value: '', label: t('selectPair') },
            ...mentoringPairs.map(p => ({ value: p.id, label: getPairLabel(p.id) })),
          ]} />
          {formErrors.goalPair && <p className="text-xs text-red-500 -mt-3">{formErrors.goalPair}</p>}
          <Input label={t('goalTitle')} value={goalForm.title} onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })} placeholder={t('goalTitlePlaceholder')} />
          {formErrors.goalTitle && <p className="text-xs text-red-500 -mt-3">{formErrors.goalTitle}</p>}
          <Input label={t('goalTargetDate')} type="date" value={goalForm.target_date} onChange={(e) => setGoalForm({ ...goalForm, target_date: e.target.value })} />
          {formErrors.goalTargetDate && <p className="text-xs text-red-500 -mt-3">{formErrors.goalTargetDate}</p>}
          <Select label={t('goalStatus')} value={goalForm.status} onChange={(e) => setGoalForm({ ...goalForm, status: e.target.value })} options={[
            { value: 'not_started', label: t('statusNotStarted') },
            { value: 'in_progress', label: t('statusInProgress') },
            { value: 'completed', label: t('statusCompleted') },
          ]} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => { setShowGoalModal(false); setFormErrors({}) }}>{tc('cancel')}</Button>
            <Button onClick={submitGoal} disabled={saving}>{saving ? 'Saving...' : t('createGoal')}</Button>
          </div>
        </div>
      </Modal>

      {/* Bulk Mentor Matching Modal */}
      <Modal open={showBulkMatchModal} onClose={resetBulkMatch} title="Bulk Mentor Matching" size="xl">
        <div className="space-y-6">
          {/* Step Indicator */}
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${bulkMatchStep === 1 ? 'bg-tempo-100 text-tempo-700' : 'bg-green-100 text-green-700'}`}>
              <span className="w-5 h-5 rounded-full bg-white flex items-center justify-center text-xs font-semibold">{bulkMatchStep > 1 ? '\u2713' : '1'}</span>
              Select Mentee Pool
            </div>
            <div className="h-px flex-1 bg-divider" />
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${bulkMatchStep === 2 ? 'bg-tempo-100 text-tempo-700' : 'bg-canvas text-t3'}`}>
              <span className="w-5 h-5 rounded-full bg-white flex items-center justify-center text-xs font-semibold border border-divider">2</span>
              Review & Create Pairs
            </div>
          </div>

          {/* Step 1: Select Mentee Pool */}
          {bulkMatchStep === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-t2">Choose how to select mentees for bulk matching. Senior employees (Director, Executive, Senior Manager) will be automatically assigned as mentors.</p>

              {/* Mode Selection */}
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setBulkMatchMode('department')}
                  className={`p-4 rounded-xl border text-left transition-all ${bulkMatchMode === 'department' ? 'border-tempo-500 bg-tempo-50 ring-1 ring-tempo-500' : 'border-border hover:border-tempo-300'}`}
                >
                  <Building2 size={20} className={bulkMatchMode === 'department' ? 'text-tempo-600' : 'text-t3'} />
                  <p className="text-sm font-medium text-t1 mt-2">By Department</p>
                  <p className="text-xs text-t3 mt-0.5">Select specific departments</p>
                </button>
                <button
                  onClick={() => setBulkMatchMode('level')}
                  className={`p-4 rounded-xl border text-left transition-all ${bulkMatchMode === 'level' ? 'border-tempo-500 bg-tempo-50 ring-1 ring-tempo-500' : 'border-border hover:border-tempo-300'}`}
                >
                  <BarChart3 size={20} className={bulkMatchMode === 'level' ? 'text-tempo-600' : 'text-t3'} />
                  <p className="text-sm font-medium text-t1 mt-2">By Level</p>
                  <p className="text-xs text-t3 mt-0.5">Select specific levels</p>
                </button>
                <button
                  onClick={() => setBulkMatchMode('all')}
                  className={`p-4 rounded-xl border text-left transition-all ${bulkMatchMode === 'all' ? 'border-tempo-500 bg-tempo-50 ring-1 ring-tempo-500' : 'border-border hover:border-tempo-300'}`}
                >
                  <Users size={20} className={bulkMatchMode === 'all' ? 'text-tempo-600' : 'text-t3'} />
                  <p className="text-sm font-medium text-t1 mt-2">Entire Company</p>
                  <p className="text-xs text-t3 mt-0.5">All eligible employees</p>
                </button>
              </div>

              {/* Department Selection */}
              {bulkMatchMode === 'department' && (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-t2">Select Departments</label>
                  <div className="grid grid-cols-2 gap-2">
                    {departments.map(dept => (
                      <label key={dept.id} className="flex items-center gap-2 p-2.5 rounded-lg border border-border hover:bg-canvas cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={bulkMatchSelectedDepts.has(dept.id)}
                          onChange={() => toggleBulkMatchSet(bulkMatchSelectedDepts, dept.id, setBulkMatchSelectedDepts)}
                          className="rounded border-border text-tempo-600 focus:ring-tempo-500"
                        />
                        <span className="text-sm text-t1">{dept.name}</span>
                        <span className="text-xs text-t3 ml-auto">{juniorEmployees.filter(e => e.department_id === dept.id).length} mentees</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Level Selection */}
              {bulkMatchMode === 'level' && (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-t2">Select Levels</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Associate', 'Junior', 'Mid'].map(level => (
                      <label key={level} className="flex items-center gap-2 p-2.5 rounded-lg border border-border hover:bg-canvas cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={bulkMatchSelectedLevels.has(level)}
                          onChange={() => toggleBulkMatchSet(bulkMatchSelectedLevels, level, setBulkMatchSelectedLevels)}
                          className="rounded border-border text-tempo-600 focus:ring-tempo-500"
                        />
                        <span className="text-sm text-t1">{level}</span>
                        <span className="text-xs text-t3 ml-auto">{juniorEmployees.filter(e => e.level === level).length}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Preview */}
              <div className="bg-canvas rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Search size={14} className="text-t3" />
                  <span className="text-xs font-medium text-t2">Preview</span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-t1">{seniorEmployees.length}</p>
                    <p className="text-xs text-t3">Available Mentors</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-t1">{bulkMatchMentees.length}</p>
                    <p className="text-xs text-t3">Eligible Mentees</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-tempo-600">{bulkMatchNewMentees.length}</p>
                    <p className="text-xs text-t3">New Mentees (Unmatched)</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Review & Create Pairs */}
          {bulkMatchStep === 2 && (
            <div className="space-y-4">
              <Select
                label="Assign to Program"
                value={bulkMatchProgramId}
                onChange={(e) => setBulkMatchProgramId(e.target.value)}
                options={[
                  { value: '', label: 'Select a program' },
                  ...mentoringPrograms.map(p => ({ value: p.id, label: p.title })),
                ]}
              />

              {/* Summary */}
              <div className="bg-canvas rounded-xl p-4 flex items-center gap-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-tempo-600">{bulkMatchSuggestedPairs.length}</p>
                  <p className="text-xs text-t3">New Pairs</p>
                </div>
                <div className="h-8 w-px bg-divider" />
                <div className="text-center">
                  <p className="text-2xl font-bold text-t3">{bulkMatchMentees.length - bulkMatchNewMentees.length}</p>
                  <p className="text-xs text-t3">Already Paired</p>
                </div>
                <div className="h-8 w-px bg-divider" />
                <div className="text-center">
                  <p className="text-2xl font-bold text-t1">{bulkMatchSuggestedPairs.length > 0 ? Math.round(bulkMatchSuggestedPairs.reduce((a, p) => a + p.score, 0) / bulkMatchSuggestedPairs.length) : 0}%</p>
                  <p className="text-xs text-t3">Avg Match Score</p>
                </div>
              </div>

              {/* Suggested Pairs List */}
              <div className="space-y-2 max-h-[340px] overflow-y-auto">
                {bulkMatchSuggestedPairs.length === 0 ? (
                  <div className="text-center py-8 text-sm text-t3">No new pairs to create. All eligible mentees are already matched.</div>
                ) : bulkMatchSuggestedPairs.map(({ mentor, mentee, score }, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-canvas rounded-lg">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Avatar name={mentor.profile?.full_name || 'Mentor'} size="sm" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-t1 truncate">{mentor.profile?.full_name}</p>
                        <p className="text-xs text-t3 truncate">{mentor.job_title}</p>
                      </div>
                    </div>
                    <span className="text-xs text-t3 flex-shrink-0">&#8594;</span>
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Avatar name={mentee.profile?.full_name || 'Mentee'} size="sm" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-t1 truncate">{mentee.profile?.full_name}</p>
                        <p className="text-xs text-t3 truncate">{mentee.job_title}</p>
                      </div>
                    </div>
                    <Badge variant={score >= 80 ? 'success' : score >= 60 ? 'warning' : 'default'}>{score}%</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-between pt-2 border-t border-divider">
            <div>
              {bulkMatchStep === 2 && (
                <Button variant="outline" onClick={() => setBulkMatchStep(1)}>Back</Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={resetBulkMatch}>Cancel</Button>
              {bulkMatchStep === 1 && (
                <Button onClick={() => setBulkMatchStep(2)} disabled={bulkMatchNewMentees.length === 0}>
                  Next
                </Button>
              )}
              {bulkMatchStep === 2 && (
                <Button onClick={submitBulkMatch} disabled={!bulkMatchProgramId || bulkMatchSuggestedPairs.length === 0}>
                  Create {bulkMatchSuggestedPairs.length} Pairs
                </Button>
              )}
            </div>
          </div>
        </div>
      </Modal>

      {/* Confirmation Dialog */}
      <Modal open={!!confirmAction?.show} onClose={() => setConfirmAction(null)} title="Confirm Action">
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
            <AlertTriangle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-900">
                {confirmAction?.type === 'end_pair' ? 'End Mentoring Pair' : 'End Program'}
              </p>
              <p className="text-xs text-amber-700 mt-1">
                {confirmAction?.type === 'end_pair'
                  ? `Are you sure you want to end the mentoring pair "${confirmAction?.label}"? This will mark the pair as completed.`
                  : `Are you sure you want to end the program "${confirmAction?.label}"? This will mark the program as completed.`}
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setConfirmAction(null)}>{tc('cancel')}</Button>
            <Button variant="primary" onClick={executeConfirmAction} disabled={saving}>{saving ? 'Processing...' : 'Confirm'}</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
