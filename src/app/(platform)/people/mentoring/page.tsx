'use client'

import { useState, useMemo, useEffect } from 'react'
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
import { TempoBarChart, TempoDonutChart, CHART_COLORS, CHART_SERIES } from '@/components/ui/charts'
import { PageSkeleton } from '@/components/ui/page-skeleton'
import { useTempo } from '@/lib/store'
import {
  UserCheck, Users, Plus, Target, BarChart3, Calendar, Clock,
  Search, Star, Sparkles, CheckCircle, XCircle, MessageSquare,
  TrendingUp, Award, ArrowRightLeft, BookOpen, Zap,
} from 'lucide-react'

// ---- Demo Data ----

const DEMO_PROGRAMS = [
  { id: 'mp-1', name: 'Leadership Development', program_type: 'leadership', description: 'Develop the next generation of leaders through structured 1:1 mentoring', max_pairs: 25, duration_weeks: 24, status: 'active', start_date: '2025-09-01', end_date: '2026-03-01' },
  { id: 'mp-2', name: 'DEI Champions', program_type: 'dei', description: 'Cross-functional mentoring to promote diversity and inclusion', max_pairs: 30, duration_weeks: 16, status: 'active', start_date: '2025-10-01', end_date: '2026-02-01' },
  { id: 'mp-3', name: 'Technical Excellence', program_type: 'technical', description: 'Senior engineers mentor rising talent on architecture and system design', max_pairs: 20, duration_weeks: 12, status: 'registration_open', start_date: '2026-04-01', end_date: '2026-07-01' },
  { id: 'mp-4', name: 'Onboarding Buddy', program_type: 'buddy', description: 'Every new hire gets a buddy for their first 90 days', max_pairs: 50, duration_weeks: 12, status: 'active', start_date: '2025-01-01', end_date: null },
  { id: 'mp-5', name: 'Reverse Mentoring', program_type: 'reverse', description: 'Junior employees mentor senior leaders on new technologies and perspectives', max_pairs: 15, duration_weeks: 16, status: 'completed', start_date: '2025-04-01', end_date: '2025-08-01' },
  { id: 'mp-6', name: 'Peer Learning Circles', program_type: 'peer_circle', description: 'Small groups of peers learn and grow together', max_pairs: 40, duration_weeks: 8, status: 'draft', start_date: null, end_date: null },
]

const PROGRAM_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  leadership: { label: 'Leadership', color: 'blue' },
  dei: { label: 'DEI', color: 'purple' },
  technical: { label: 'Technical', color: 'emerald' },
  buddy: { label: 'Onboarding Buddy', color: 'amber' },
  reverse: { label: 'Reverse', color: 'pink' },
  peer_circle: { label: 'Peer Circle', color: 'cyan' },
}

const PROGRAM_STATUS_LABELS: Record<string, { label: string; variant: string }> = {
  draft: { label: 'Draft', variant: 'default' },
  registration_open: { label: 'Registration Open', variant: 'info' },
  matching: { label: 'Matching', variant: 'warning' },
  active: { label: 'Active', variant: 'success' },
  completed: { label: 'Completed', variant: 'default' },
}

export default function PeopleMentoringPage() {
  const store = useTempo()
  const { employees, departments, ensureModulesLoaded, getEmployeeName, getDepartmentName, addToast } = store

  const [pageLoading, setPageLoading] = useState(true)
  useEffect(() => {
    ensureModulesLoaded?.(['employees', 'departments', 'mentoringPrograms', 'mentoringPairs', 'mentoringSessions', 'mentoringGoals'])
      ?.then?.(() => setPageLoading(false))?.catch?.(() => setPageLoading(false))
    const t = setTimeout(() => setPageLoading(false), 2000)
    return () => clearTimeout(t)
  }, [ensureModulesLoaded])

  // ---- Tab State ----
  const [activeTab, setActiveTab] = useState('programs')
  const tabs = [
    { id: 'programs', label: 'Programs', count: DEMO_PROGRAMS.length },
    { id: 'matching', label: 'Matching' },
    { id: 'my-mentoring', label: 'My Mentoring' },
    { id: 'check-ins', label: 'Check-ins' },
    { id: 'impact', label: 'Impact' },
  ]

  // ---- Modal State ----
  const [showProgramModal, setShowProgramModal] = useState(false)
  const [showMatchModal, setShowMatchModal] = useState(false)
  const [showCheckInModal, setShowCheckInModal] = useState(false)
  const [programSearch, setProgramSearch] = useState('')
  const [programStatusFilter, setProgramStatusFilter] = useState('all')

  const [programForm, setProgramForm] = useState({
    name: '', program_type: 'leadership', description: '', max_pairs: 25,
    duration_weeks: 12, status: 'draft', start_date: '', end_date: '',
  })

  // ---- Demo Pairs ----
  const demoPairs = useMemo(() => {
    const pairs: any[] = []
    const sample = employees.slice(0, 12)
    for (let i = 0; i < Math.min(6, Math.floor(sample.length / 2)); i++) {
      const mentor = sample[i * 2]
      const mentee = sample[i * 2 + 1]
      if (!mentor || !mentee) continue
      pairs.push({
        id: `pair-${i}`, program_id: DEMO_PROGRAMS[i % 3]?.id,
        mentor_id: mentor.id, mentee_id: mentee.id,
        match_score: 70 + Math.floor(Math.random() * 25),
        status: i < 5 ? 'active' : 'proposed',
        start_date: '2025-10-01', end_date: null,
      })
    }
    return pairs
  }, [employees])

  // ---- Demo Check-Ins ----
  const demoCheckIns = useMemo(() => {
    return demoPairs.slice(0, 4).flatMap((pair: any, pi: number) => {
      return Array.from({ length: 3 }, (_, ci) => ({
        id: `ci-${pi}-${ci}`,
        pair_id: pair.id,
        mentor_id: pair.mentor_id,
        mentee_id: pair.mentee_id,
        date: `2026-0${1 + ci}-${10 + pi * 3}`,
        duration: 30 + ci * 15,
        topics: ['Career goals', 'Skill development', 'Project challenges', 'Leadership tactics'][ci % 4],
        action_items: ci === 0 ? 'Complete online course, shadow senior meeting' : ci === 1 ? 'Prepare presentation for team review' : 'Draft development plan for Q2',
        completed: ci < 2,
      }))
    })
  }, [demoPairs])

  // ---- Demo Goals ----
  const demoGoals = useMemo(() => {
    return demoPairs.slice(0, 4).flatMap((pair: any, pi: number) => ([
      { id: `goal-${pi}-1`, pair_id: pair.id, title: 'Complete leadership assessment', status: pi < 2 ? 'completed' : 'in_progress', target_date: '2026-03-01', progress: pi < 2 ? 100 : 60 },
      { id: `goal-${pi}-2`, pair_id: pair.id, title: 'Present at team all-hands', status: 'in_progress', target_date: '2026-04-15', progress: 30 + pi * 15 },
      { id: `goal-${pi}-3`, pair_id: pair.id, title: 'Build cross-functional network', status: 'in_progress', target_date: '2026-06-01', progress: 20 + pi * 10 },
    ]))
  }, [demoPairs])

  // ---- Matching Algorithm ----
  const [matchResults, setMatchResults] = useState<any[]>([])
  const [matchingProgram, setMatchingProgram] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  const generateMatches = () => {
    setIsGenerating(true)
    setTimeout(() => {
      const mentors = employees.filter((_, i) => i % 3 === 0).slice(0, 5)
      const mentees = employees.filter((_, i) => i % 3 === 1).slice(0, 5)
      const results = mentors.map((mentor, i) => {
        const mentee = mentees[i]
        if (!mentee) return null
        const score = 65 + Math.floor(Math.random() * 30)
        return {
          id: `match-${i}`,
          mentor_id: mentor.id,
          mentee_id: mentee.id,
          match_score: score,
          reasons: [
            score > 85 ? 'Excellent skills alignment' : 'Good skills overlap',
            'Cross-functional (preferred)',
            `${Math.abs(2)} level seniority gap`,
          ],
        }
      }).filter(Boolean)
      setMatchResults(results)
      setIsGenerating(false)
    }, 1500)
  }

  // ---- Filtered Programs ----
  const filteredPrograms = useMemo(() => {
    let data = DEMO_PROGRAMS
    if (programSearch) {
      const q = programSearch.toLowerCase()
      data = data.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q))
    }
    if (programStatusFilter !== 'all') data = data.filter(p => p.status === programStatusFilter)
    return data
  }, [programSearch, programStatusFilter])

  // ---- Impact Metrics ----
  const impactMetrics = useMemo(() => ({
    participationRate: 68,
    menteePromotionRate: 34,
    nonParticipantPromotionRate: 18,
    retentionMentored: 94,
    retentionNonMentored: 81,
    avgSatisfaction: 4.3,
    skillsImproved: 156,
    totalPairs: demoPairs.length,
    activePairs: demoPairs.filter((p: any) => p.status === 'active').length,
    goalsCompleted: demoGoals.filter(g => g.status === 'completed').length,
    totalGoals: demoGoals.length,
    checkInsCompleted: demoCheckIns.filter(c => c.completed).length,
    totalCheckIns: demoCheckIns.length,
  }), [demoPairs, demoGoals, demoCheckIns])

  if (pageLoading) {
    return (
      <>
        <Header title="Mentoring Programs" subtitle="Manage organizational mentoring programs" />
        <div className="p-6"><PageSkeleton /></div>
      </>
    )
  }

  return (
    <>
      <Header
        title="Mentoring Programs"
        subtitle={`${DEMO_PROGRAMS.filter(p => p.status === 'active').length} active programs, ${demoPairs.filter((p: any) => p.status === 'active').length} active pairs`}
        actions={
          <Button onClick={() => setShowProgramModal(true)}>
            <Plus size={14} /> New Program
          </Button>
        }
      />

      <div className="p-6 space-y-6">
        <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

        {/* ============================================================ */}
        {/* PROGRAMS TAB */}
        {/* ============================================================ */}
        {activeTab === 'programs' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard label="Active Programs" value={DEMO_PROGRAMS.filter(p => p.status === 'active').length} icon={<BookOpen size={16} />} />
              <StatCard label="Total Pairs" value={demoPairs.length} icon={<Users size={16} />} />
              <StatCard label="Avg Match Score" value={`${Math.round(demoPairs.reduce((s: number, p: any) => s + (p.match_score || 0), 0) / Math.max(demoPairs.length, 1))}%`} icon={<Sparkles size={16} />} />
              <StatCard label="Completion Rate" value="78%" icon={<Target size={16} />} />
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative flex-1 max-w-xs">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-t3" />
                <input type="text" placeholder="Search programs..." value={programSearch} onChange={(e) => setProgramSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-chrome border border-divider rounded-lg text-t1 placeholder:text-t3 focus:border-tempo-500 focus:outline-none" />
              </div>
              <Select value={programStatusFilter} onChange={(e) => setProgramStatusFilter(e.target.value)} options={[
                { value: 'all', label: 'All Statuses' }, { value: 'active', label: 'Active' },
                { value: 'draft', label: 'Draft' }, { value: 'registration_open', label: 'Registration Open' },
                { value: 'completed', label: 'Completed' },
              ]} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPrograms.map(program => {
                const typeInfo = PROGRAM_TYPE_LABELS[program.program_type] || { label: program.program_type, color: 'zinc' }
                const statusInfo = PROGRAM_STATUS_LABELS[program.status] || { label: program.status, variant: 'default' }
                const pairsInProgram = demoPairs.filter((p: any) => p.program_id === program.id)
                return (
                  <Card key={program.id} className="hover:border-tempo-500/30 transition-colors cursor-pointer">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-sm font-semibold text-t1">{program.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={
                            typeInfo.color === 'blue' ? 'info' :
                            typeInfo.color === 'emerald' ? 'success' :
                            typeInfo.color === 'amber' ? 'warning' :
                            typeInfo.color === 'purple' ? 'info' : 'default'
                          }>{typeInfo.label}</Badge>
                          <Badge variant={statusInfo.variant as any}>{statusInfo.label}</Badge>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-t3 mb-3 line-clamp-2">{program.description}</p>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-canvas rounded-lg p-2">
                        <p className="text-sm font-semibold text-t1">{pairsInProgram.length}</p>
                        <p className="text-[0.6rem] text-t3">Pairs</p>
                      </div>
                      <div className="bg-canvas rounded-lg p-2">
                        <p className="text-sm font-semibold text-t1">{program.max_pairs}</p>
                        <p className="text-[0.6rem] text-t3">Max Pairs</p>
                      </div>
                      <div className="bg-canvas rounded-lg p-2">
                        <p className="text-sm font-semibold text-t1">{program.duration_weeks}w</p>
                        <p className="text-[0.6rem] text-t3">Duration</p>
                      </div>
                    </div>
                    {program.start_date && (
                      <div className="flex items-center gap-1 mt-3 text-[0.65rem] text-t3">
                        <Calendar size={10} />
                        {program.start_date} {program.end_date ? `- ${program.end_date}` : '(ongoing)'}
                      </div>
                    )}
                  </Card>
                )
              })}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* MATCHING TAB */}
        {/* ============================================================ */}
        {activeTab === 'matching' && (
          <div className="space-y-4">
            <Card>
              <h3 className="text-sm font-semibold text-t1 mb-2">AI-Powered Mentor Matching</h3>
              <p className="text-xs text-t3 mb-4">
                Auto-match algorithm considers: skills alignment, department diversity (cross-functional preferred), seniority gap, career interests, and availability
              </p>
              <div className="flex items-center gap-4">
                <Select
                  value={matchingProgram}
                  onChange={(e) => setMatchingProgram(e.target.value)}
                  options={[
                    { value: '', label: 'Select a program...' },
                    ...DEMO_PROGRAMS.filter(p => p.status === 'active' || p.status === 'registration_open')
                      .map(p => ({ value: p.id, label: p.name }))
                  ]}
                />
                <Button onClick={generateMatches} disabled={isGenerating || !matchingProgram}>
                  <Zap size={14} /> {isGenerating ? 'Generating...' : 'Generate Matches'}
                </Button>
              </div>
            </Card>

            {matchResults.length > 0 && (
              <Card padding="none">
                <div className="px-4 py-3 border-b border-divider flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-t3 uppercase">Proposed Matches ({matchResults.length})</h4>
                  <Button size="sm" variant="secondary" onClick={() => {
                    addToast?.(`${matchResults.length} matches approved and activated`)
                    setMatchResults([])
                  }}>
                    <CheckCircle size={14} /> Approve All
                  </Button>
                </div>
                <div className="divide-y divide-divider">
                  {matchResults.map((match: any) => (
                    <div key={match.id} className="px-4 py-3 flex items-center gap-4">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Avatar name={getEmployeeName(match.mentor_id)} size="sm" />
                        <div>
                          <p className="text-sm font-medium text-t1">{getEmployeeName(match.mentor_id)}</p>
                          <p className="text-[0.65rem] text-t3">Mentor</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <ArrowRightLeft size={14} className="text-t3" />
                        <Badge variant={match.match_score > 85 ? 'success' : match.match_score > 70 ? 'info' : 'warning'}>
                          {match.match_score}% match
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Avatar name={getEmployeeName(match.mentee_id)} size="sm" />
                        <div>
                          <p className="text-sm font-medium text-t1">{getEmployeeName(match.mentee_id)}</p>
                          <p className="text-[0.65rem] text-t3">Mentee</p>
                        </div>
                      </div>
                      <div className="hidden md:block flex-1 text-xs text-t3">
                        {match.reasons?.map((r: string, ri: number) => (
                          <span key={ri} className="inline-block mr-2">
                            <CheckCircle size={10} className="inline text-green-400 mr-0.5" />{r}
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-1">
                        <button className="p-1.5 rounded hover:bg-green-500/10 text-green-400" onClick={() => addToast?.('Match approved')}>
                          <CheckCircle size={16} />
                        </button>
                        <button className="p-1.5 rounded hover:bg-red-500/10 text-red-400" onClick={() => addToast?.('Match rejected')}>
                          <XCircle size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {matchResults.length === 0 && !isGenerating && (
              <Card>
                <div className="text-center py-8">
                  <Sparkles size={32} className="mx-auto text-t3 mb-3" />
                  <p className="text-sm text-t2">Select a program and click "Generate Matches" to run the AI matching algorithm</p>
                  <p className="text-xs text-t3 mt-1">Matches are scored 0-100 based on skills, department diversity, seniority gap, and career interests</p>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* MY MENTORING TAB */}
        {/* ============================================================ */}
        {activeTab === 'my-mentoring' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {demoPairs.slice(0, 4).map((pair: any) => {
                const pairGoals = demoGoals.filter(g => g.pair_id === pair.id)
                const pairCheckIns = demoCheckIns.filter(c => c.pair_id === pair.id)
                const completedGoals = pairGoals.filter(g => g.status === 'completed').length
                const avgProgress = Math.round(pairGoals.reduce((s, g) => s + g.progress, 0) / Math.max(pairGoals.length, 1))
                return (
                  <Card key={pair.id}>
                    <div className="flex items-center gap-3 mb-4">
                      <Avatar name={getEmployeeName(pair.mentor_id)} size="md" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-t1">{getEmployeeName(pair.mentor_id)}</span>
                          <Badge variant="default">Mentor</Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <ArrowRightLeft size={10} className="text-t3" />
                          <span className="text-xs text-t2">{getEmployeeName(pair.mentee_id)}</span>
                          <Badge variant="default">Mentee</Badge>
                        </div>
                      </div>
                      <Badge variant={pair.status === 'active' ? 'success' : 'warning'}>{pair.status}</Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <div className="bg-canvas rounded-lg p-2 text-center">
                        <p className="text-sm font-semibold text-t1">{pair.match_score}%</p>
                        <p className="text-[0.6rem] text-t3">Match</p>
                      </div>
                      <div className="bg-canvas rounded-lg p-2 text-center">
                        <p className="text-sm font-semibold text-t1">{completedGoals}/{pairGoals.length}</p>
                        <p className="text-[0.6rem] text-t3">Goals</p>
                      </div>
                      <div className="bg-canvas rounded-lg p-2 text-center">
                        <p className="text-sm font-semibold text-t1">{pairCheckIns.length}</p>
                        <p className="text-[0.6rem] text-t3">Check-ins</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-t3">Overall Progress</span>
                        <span className="text-t1 font-medium">{avgProgress}%</span>
                      </div>
                      <Progress value={avgProgress} />
                    </div>

                    {pairGoals.length > 0 && (
                      <div className="mt-3 space-y-1.5">
                        {pairGoals.map(goal => (
                          <div key={goal.id} className="flex items-center gap-2 text-xs">
                            {goal.status === 'completed' ? (
                              <CheckCircle size={12} className="text-green-400 shrink-0" />
                            ) : (
                              <div className="w-3 h-3 rounded-full border-2 border-amber-400 shrink-0" />
                            )}
                            <span className={goal.status === 'completed' ? 'text-t3 line-through' : 'text-t1'}>{goal.title}</span>
                            <span className="text-t3 ml-auto">{goal.progress}%</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                )
              })}
            </div>
            {demoPairs.length === 0 && (
              <Card>
                <div className="text-center py-8">
                  <UserCheck size={32} className="mx-auto text-t3 mb-3" />
                  <p className="text-sm text-t2">No mentoring relationships yet</p>
                  <p className="text-xs text-t3 mt-1">Enroll in a program to get started</p>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* CHECK-INS TAB */}
        {/* ============================================================ */}
        {activeTab === 'check-ins' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-t1">Check-in Tracking</h3>
                <p className="text-xs text-t3 mt-1">Track scheduled check-ins between mentors and mentees</p>
              </div>
              <Button size="sm" onClick={() => setShowCheckInModal(true)}>
                <Plus size={14} /> Log Check-in
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard label="Total Check-ins" value={demoCheckIns.length} icon={<MessageSquare size={16} />} />
              <StatCard label="Completed" value={demoCheckIns.filter(c => c.completed).length} icon={<CheckCircle size={16} />} />
              <StatCard label="Avg Duration" value={`${Math.round(demoCheckIns.reduce((s, c) => s + c.duration, 0) / Math.max(demoCheckIns.length, 1))}m`} icon={<Clock size={16} />} />
              <StatCard label="Completion Rate" value={`${Math.round(demoCheckIns.filter(c => c.completed).length / Math.max(demoCheckIns.length, 1) * 100)}%`} icon={<Target size={16} />} />
            </div>

            <Card padding="none">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-divider text-t3 font-medium">
                      <th className="text-left px-4 py-3">Date</th>
                      <th className="text-left px-4 py-3">Mentor</th>
                      <th className="text-left px-4 py-3">Mentee</th>
                      <th className="text-left px-4 py-3">Duration</th>
                      <th className="text-left px-4 py-3">Topics</th>
                      <th className="text-left px-4 py-3">Action Items</th>
                      <th className="text-left px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-divider">
                    {demoCheckIns.map(ci => (
                      <tr key={ci.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-3 text-t2">{ci.date}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Avatar name={getEmployeeName(ci.mentor_id)} size="xs" />
                            <span className="text-t1">{getEmployeeName(ci.mentor_id)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Avatar name={getEmployeeName(ci.mentee_id)} size="xs" />
                            <span className="text-t1">{getEmployeeName(ci.mentee_id)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-t2">{ci.duration}m</td>
                        <td className="px-4 py-3 text-t2 max-w-[150px] truncate">{ci.topics}</td>
                        <td className="px-4 py-3 text-t2 max-w-[200px] truncate">{ci.action_items}</td>
                        <td className="px-4 py-3">
                          {ci.completed ? (
                            <Badge variant="success">Completed</Badge>
                          ) : (
                            <Badge variant="warning">Scheduled</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {demoCheckIns.length === 0 && (
                <div className="px-6 py-8 text-center">
                  <Calendar size={32} className="mx-auto text-t3 mb-3" />
                  <p className="text-xs text-t3">No check-ins recorded yet</p>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* ============================================================ */}
        {/* IMPACT TAB */}
        {/* ============================================================ */}
        {activeTab === 'impact' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard label="Participation Rate" value={`${impactMetrics.participationRate}%`} icon={<Users size={16} />} change="+8% vs last quarter" changeType="positive" />
              <StatCard label="Avg Satisfaction" value={`${impactMetrics.avgSatisfaction}/5`} icon={<Star size={16} />} change="+0.3 pts" changeType="positive" />
              <StatCard label="Goals Completed" value={`${impactMetrics.goalsCompleted}/${impactMetrics.totalGoals}`} icon={<Target size={16} />} />
              <StatCard label="Skills Improved" value={impactMetrics.skillsImproved} icon={<TrendingUp size={16} />} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Promotion Rate Comparison</CardTitle>
                </CardHeader>
                <TempoBarChart
                  data={[
                    { label: 'Mentored', value: impactMetrics.menteePromotionRate },
                    { label: 'Non-Mentored', value: impactMetrics.nonParticipantPromotionRate },
                  ]}
                  xKey="label"
                  bars={[{ dataKey: 'value', name: 'Promotion Rate %', color: CHART_COLORS.primary }]}
                  height={200}
                />
                <p className="text-xs text-t3 mt-2 text-center">
                  Mentored employees are {Math.round(impactMetrics.menteePromotionRate / impactMetrics.nonParticipantPromotionRate * 100 - 100)}% more likely to be promoted
                </p>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Retention Comparison</CardTitle>
                </CardHeader>
                <TempoBarChart
                  data={[
                    { label: 'Mentored', value: impactMetrics.retentionMentored },
                    { label: 'Non-Mentored', value: impactMetrics.retentionNonMentored },
                  ]}
                  xKey="label"
                  bars={[{ dataKey: 'value', name: 'Retention Rate %', color: CHART_COLORS.blue }]}
                  height={200}
                />
                <p className="text-xs text-t3 mt-2 text-center">
                  {impactMetrics.retentionMentored - impactMetrics.retentionNonMentored} percentage point retention advantage
                </p>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Program Participation</CardTitle>
                </CardHeader>
                <TempoDonutChart
                  data={DEMO_PROGRAMS.map(p => ({
                    name: p.name,
                    value: demoPairs.filter((pair: any) => pair.program_id === p.id).length || 1,
                  }))}
                  height={200}
                />
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Check-in Cadence</CardTitle>
                </CardHeader>
                <div className="space-y-3">
                  {demoPairs.slice(0, 4).map((pair: any) => {
                    const pairCheckIns = demoCheckIns.filter(c => c.pair_id === pair.id)
                    const completed = pairCheckIns.filter(c => c.completed).length
                    const total = pairCheckIns.length
                    const rate = total > 0 ? Math.round(completed / total * 100) : 0
                    return (
                      <div key={pair.id}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-t1">{getEmployeeName(pair.mentor_id)} / {getEmployeeName(pair.mentee_id)}</span>
                          <span className="text-t3">{completed}/{total} ({rate}%)</span>
                        </div>
                        <Progress value={rate} />
                      </div>
                    )
                  })}
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* MODALS */}
      {/* ============================================================ */}

      {/* Create Program Modal */}
      <Modal open={showProgramModal} onClose={() => setShowProgramModal(false)} title="Create Mentoring Program" size="lg">
        <div className="space-y-4">
          <Input label="Program Name" placeholder="e.g., Leadership Development" value={programForm.name} onChange={(e) => setProgramForm({ ...programForm, name: e.target.value })} required />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Program Type" value={programForm.program_type} onChange={(e) => setProgramForm({ ...programForm, program_type: e.target.value })} options={[
              { value: 'leadership', label: 'Leadership' }, { value: 'dei', label: 'DEI' },
              { value: 'technical', label: 'Technical' }, { value: 'buddy', label: 'Onboarding Buddy' },
              { value: 'reverse', label: 'Reverse Mentoring' }, { value: 'peer_circle', label: 'Peer Circle' },
            ]} />
            <Select label="Status" value={programForm.status} onChange={(e) => setProgramForm({ ...programForm, status: e.target.value })} options={[
              { value: 'draft', label: 'Draft' }, { value: 'registration_open', label: 'Registration Open' },
              { value: 'active', label: 'Active' },
            ]} />
          </div>
          <Textarea label="Description" placeholder="Describe the program goals and eligibility..." value={programForm.description} onChange={(e) => setProgramForm({ ...programForm, description: e.target.value })} />
          <div className="grid grid-cols-3 gap-4">
            <Input label="Max Pairs" type="number" value={programForm.max_pairs} onChange={(e) => setProgramForm({ ...programForm, max_pairs: Number(e.target.value) })} />
            <Input label="Duration (weeks)" type="number" value={programForm.duration_weeks} onChange={(e) => setProgramForm({ ...programForm, duration_weeks: Number(e.target.value) })} />
            <Input label="Start Date" type="date" value={programForm.start_date} onChange={(e) => setProgramForm({ ...programForm, start_date: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowProgramModal(false)}>Cancel</Button>
            <Button onClick={() => {
              if (!programForm.name) { addToast?.('Program name is required', 'error'); return }
              addToast?.('Program created successfully')
              setShowProgramModal(false)
              setProgramForm({ name: '', program_type: 'leadership', description: '', max_pairs: 25, duration_weeks: 12, status: 'draft', start_date: '', end_date: '' })
            }}>Create Program</Button>
          </div>
        </div>
      </Modal>

      {/* Log Check-In Modal */}
      <Modal open={showCheckInModal} onClose={() => setShowCheckInModal(false)} title="Log Check-in">
        <div className="space-y-4">
          <Select label="Mentoring Pair" value="" onChange={() => {}} options={[
            { value: '', label: 'Select pair...' },
            ...demoPairs.slice(0, 6).map((p: any) => ({
              value: p.id,
              label: `${getEmployeeName(p.mentor_id)} / ${getEmployeeName(p.mentee_id)}`,
            }))
          ]} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Date" type="date" value="" onChange={() => {}} />
            <Input label="Duration (minutes)" type="number" value="30" onChange={() => {}} />
          </div>
          <Input label="Topics Discussed" placeholder="Career goals, project challenges..." value="" onChange={() => {}} />
          <Textarea label="Action Items" placeholder="List follow-up actions..." value="" onChange={() => {}} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowCheckInModal(false)}>Cancel</Button>
            <Button onClick={() => {
              addToast?.('Check-in logged successfully')
              setShowCheckInModal(false)
            }}>Log Check-in</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
