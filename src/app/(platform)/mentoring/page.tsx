'use client'

import { useState, useMemo } from 'react'
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
import { UserCheck, Users, Plus, Sparkles, BookOpen, Target, BarChart3, Video, Phone, MapPin, Star, Calendar, Clock } from 'lucide-react'
import { useTempo } from '@/lib/store'
import { AIInsightCard, AIScoreBadge, AIRecommendationList } from '@/components/ai'
import { calculateMentorMatch, analyzeMentoringEffectiveness, suggestSessionTopics, predictPairSuccess } from '@/lib/ai-engine'

export default function MentoringPage() {
  const t = useTranslations('mentoring')
  const tc = useTranslations('common')
  const {
    mentoringPrograms, mentoringPairs, employees,
    addMentoringProgram, addMentoringPair, updateMentoringPair,
    getEmployeeName, getDepartmentName,
    mentoringSessions, addMentoringSession, updateMentoringSession,
    mentoringGoals, addMentoringGoal, updateMentoringGoal,
    addToast,
  } = useTempo()

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
    if (!programForm.title || !programForm.start_date) return
    addMentoringProgram(programForm)
    setShowProgramModal(false)
    setProgramForm({ title: '', type: 'one_on_one', status: 'active', duration_months: 6, start_date: '' })
  }

  function submitPair() {
    if (!pairForm.program_id || !pairForm.mentor_id || !pairForm.mentee_id) return
    const mentor = employees.find(e => e.id === pairForm.mentor_id)
    const mentee = employees.find(e => e.id === pairForm.mentee_id)
    const matchScore = mentor && mentee ? calculateMentorMatch(mentor, mentee, employees).value : 80
    addMentoringPair({ ...pairForm, status: 'active', match_score: matchScore })
    setShowPairModal(false)
    setPairForm({ program_id: '', mentor_id: '', mentee_id: '' })
  }

  function submitSession() {
    if (!sessionForm.pair_id || !sessionForm.date || !sessionForm.topic) return
    addMentoringSession(sessionForm)
    setShowSessionModal(false)
    setSessionForm({ pair_id: '', date: '', duration_minutes: 30, type: 'video', topic: '', rating: 4, notes: '', status: 'completed' })
  }

  function submitGoal() {
    if (!goalForm.pair_id || !goalForm.title || !goalForm.target_date) return
    addMentoringGoal(goalForm)
    setShowGoalModal(false)
    setGoalForm({ pair_id: '', title: '', target_date: '', status: 'not_started', progress: 0 })
  }

  function acceptSuggestedMatch(mentor: typeof employees[0], mentee: typeof employees[0], score: number) {
    const program = mentoringPrograms.find(p => p.status === 'active')
    if (!program) return
    addMentoringPair({ program_id: program.id, mentor_id: mentor.id, mentee_id: mentee.id, status: 'active', match_score: score })
  }

  return (
    <>
      <Header title={t('title')} subtitle={t('subtitle')}
        actions={
          <div className="flex gap-2">
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mentoringPrograms.length === 0 ? (
            <Card><div className="py-8 text-center text-sm text-t3">{t('noPrograms')}</div></Card>
          ) : mentoringPrograms.map(program => {
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
      )}

      {/* ============================================================ */}
      {/* TAB 2: PAIRS */}
      {/* ============================================================ */}
      {activeTab === 'pairs' && (
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
                  <tr><td colSpan={8} className="px-6 py-12 text-center text-xs text-t3">{t('noPairs')}</td></tr>
                ) : mentoringPairs.map(pair => {
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
                              <Button size="sm" variant="primary" onClick={() => updateMentoringPair(pair.id, { status: 'completed' })}>{tc('complete')}</Button>
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
            <select className="px-3 py-2 text-sm border border-border rounded-lg bg-surface text-t1" value={sessionFilterPair} onChange={e => setSessionFilterPair(e.target.value)}>
              <option value="">{t('filterByPair')}</option>
              {mentoringPairs.map(p => <option key={p.id} value={p.id}>{getPairLabel(p.id)}</option>)}
            </select>
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
                    <tr><td colSpan={7} className="px-6 py-12 text-center text-xs text-t3">{t('noSessions')}</td></tr>
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
            <select className="px-3 py-2 text-sm border border-border rounded-lg bg-surface text-t1" value={goalFilterPair} onChange={e => setGoalFilterPair(e.target.value)}>
              <option value="">{t('filterByPair')}</option>
              {mentoringPairs.map(p => <option key={p.id} value={p.id}>{getPairLabel(p.id)}</option>)}
            </select>
            <select className="px-3 py-2 text-sm border border-border rounded-lg bg-surface text-t1" value={goalFilterStatus} onChange={e => setGoalFilterStatus(e.target.value)}>
              <option value="">{t('filterByStatus')}</option>
              <option value="not_started">{t('statusNotStarted')}</option>
              <option value="in_progress">{t('statusInProgress')}</option>
              <option value="completed">{t('statusCompleted')}</option>
            </select>
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
                    <tr><td colSpan={6} className="px-6 py-12 text-center text-xs text-t3">{t('noGoals')}</td></tr>
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
          <div className="grid grid-cols-2 gap-4">
            <Select label={t('programType')} value={programForm.type} onChange={(e) => setProgramForm({ ...programForm, type: e.target.value })} options={[
              { value: 'one_on_one', label: t('typeOneOnOne') },
              { value: 'reverse', label: t('typeReverse') },
              { value: 'group', label: t('typeGroup') },
            ]} />
            <Input label={t('durationMonths')} type="number" value={programForm.duration_months} onChange={(e) => setProgramForm({ ...programForm, duration_months: Number(e.target.value) })} />
          </div>
          <Input label={t('startDate')} type="date" value={programForm.start_date} onChange={(e) => setProgramForm({ ...programForm, start_date: e.target.value })} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowProgramModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitProgram}>{t('createProgram')}</Button>
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
          <Select label={t('mentor')} value={pairForm.mentor_id} onChange={(e) => setPairForm({ ...pairForm, mentor_id: e.target.value })} options={[
            { value: '', label: t('selectMentor') },
            ...employees.map(e => ({ value: e.id, label: `${e.profile?.full_name} - ${e.job_title}` })),
          ]} />
          <Select label={t('mentee')} value={pairForm.mentee_id} onChange={(e) => setPairForm({ ...pairForm, mentee_id: e.target.value })} options={[
            { value: '', label: t('selectMentee') },
            ...employees.map(e => ({ value: e.id, label: `${e.profile?.full_name} - ${e.job_title}` })),
          ]} />
          <div className="bg-canvas rounded-lg p-3">
            <p className="text-xs text-t3">{t('matchScoreNote')}</p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowPairModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitPair}>{t('matchPairButton')}</Button>
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
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('sessionDate')} type="date" value={sessionForm.date} onChange={(e) => setSessionForm({ ...sessionForm, date: e.target.value })} />
            <Input label={t('sessionDuration')} type="number" value={sessionForm.duration_minutes} onChange={(e) => setSessionForm({ ...sessionForm, duration_minutes: Number(e.target.value) })} />
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
          <Textarea label={t('sessionNotes')} value={sessionForm.notes} onChange={(e) => setSessionForm({ ...sessionForm, notes: e.target.value })} placeholder={t('sessionNotesPlaceholder')} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowSessionModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitSession}>{t('logSession')}</Button>
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
          <Input label={t('goalTitle')} value={goalForm.title} onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })} placeholder={t('goalTitlePlaceholder')} />
          <Input label={t('goalTargetDate')} type="date" value={goalForm.target_date} onChange={(e) => setGoalForm({ ...goalForm, target_date: e.target.value })} />
          <Select label={t('goalStatus')} value={goalForm.status} onChange={(e) => setGoalForm({ ...goalForm, status: e.target.value })} options={[
            { value: 'not_started', label: t('statusNotStarted') },
            { value: 'in_progress', label: t('statusInProgress') },
            { value: 'completed', label: t('statusCompleted') },
          ]} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowGoalModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitGoal}>{t('createGoal')}</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
