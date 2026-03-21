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
import { Input, Textarea, Select } from '@/components/ui/input'
import { PageSkeleton } from '@/components/ui/page-skeleton'
import { useTempo } from '@/lib/store'
import {
  calculateNineBoxPosition,
  NINE_BOX_DISPLAY,
  calculateBenchStrength,
  READINESS_DISPLAY,
  CRITICALITY_DISPLAY,
  type BenchStrengthResult,
} from '@/lib/services/succession-engine'
import {
  Shield, Users, Target, TrendingUp, Plus, AlertTriangle,
  ChevronRight, UserCheck, BarChart3, Eye, ArrowUpDown,
  Search, Grid3X3, Layers, Star, Award, Clock,
} from 'lucide-react'

// ---- Demo Data for Succession Planning ----
const DEMO_SUCCESSION_PLANS = [
  { id: 'sp-1', org_id: 'org-1', position_title: 'Chief Technology Officer', incumbent_id: 'emp-1', department_id: 'dep-1', criticality: 'critical', risk_of_vacancy: 'high', status: 'active', notes: 'Key leadership role with high market demand', last_reviewed_at: '2026-02-15', created_at: '2025-06-01' },
  { id: 'sp-2', org_id: 'org-1', position_title: 'VP of Engineering', incumbent_id: 'emp-2', department_id: 'dep-1', criticality: 'high', risk_of_vacancy: 'medium', status: 'active', notes: 'Critical for engineering org stability', last_reviewed_at: '2026-02-15', created_at: '2025-06-01' },
  { id: 'sp-3', org_id: 'org-1', position_title: 'Head of Product', incumbent_id: 'emp-5', department_id: 'dep-2', criticality: 'high', risk_of_vacancy: 'low', status: 'active', notes: '', last_reviewed_at: '2026-01-10', created_at: '2025-07-01' },
  { id: 'sp-4', org_id: 'org-1', position_title: 'Director of Data Science', incumbent_id: 'emp-8', department_id: 'dep-1', criticality: 'medium', risk_of_vacancy: 'medium', status: 'active', notes: '', last_reviewed_at: '2026-01-10', created_at: '2025-08-01' },
  { id: 'sp-5', org_id: 'org-1', position_title: 'CFO', incumbent_id: 'emp-10', department_id: 'dep-3', criticality: 'critical', risk_of_vacancy: 'low', status: 'active', notes: 'Board-level position', last_reviewed_at: '2026-03-01', created_at: '2025-06-01' },
  { id: 'sp-6', org_id: 'org-1', position_title: 'Head of People Operations', incumbent_id: 'emp-12', department_id: 'dep-4', criticality: 'medium', risk_of_vacancy: 'high', status: 'active', notes: '', last_reviewed_at: '2026-01-10', created_at: '2025-09-01' },
]

const DEMO_CANDIDATES = [
  { id: 'sc-1', plan_id: 'sp-1', employee_id: 'emp-3', readiness: 'ready_1_year', performance_rating: 4, potential_rating: 5, strength_notes: 'Strong technical vision', gap_notes: 'Needs board-level experience', ranking: 1 },
  { id: 'sc-2', plan_id: 'sp-1', employee_id: 'emp-4', readiness: 'ready_2_years', performance_rating: 4, potential_rating: 4, strength_notes: 'Deep domain expertise', gap_notes: 'Needs broader business acumen', ranking: 2 },
  { id: 'sc-3', plan_id: 'sp-2', employee_id: 'emp-6', readiness: 'ready_now', performance_rating: 5, potential_rating: 4, strength_notes: 'Proven team leader', gap_notes: '', ranking: 1 },
  { id: 'sc-4', plan_id: 'sp-2', employee_id: 'emp-7', readiness: 'ready_1_year', performance_rating: 4, potential_rating: 4, strength_notes: 'Strong execution', gap_notes: 'Needs cross-functional exposure', ranking: 2 },
  { id: 'sc-5', plan_id: 'sp-3', employee_id: 'emp-9', readiness: 'ready_now', performance_rating: 5, potential_rating: 5, strength_notes: 'Exceptional product sense', gap_notes: '', ranking: 1 },
  { id: 'sc-6', plan_id: 'sp-3', employee_id: 'emp-11', readiness: 'developing', performance_rating: 3, potential_rating: 4, strength_notes: 'Creative thinker', gap_notes: 'Needs more strategic experience', ranking: 3 },
  { id: 'sc-7', plan_id: 'sp-4', employee_id: 'emp-13', readiness: 'ready_1_year', performance_rating: 4, potential_rating: 5, strength_notes: 'ML expertise', gap_notes: 'People management experience', ranking: 1 },
  { id: 'sc-8', plan_id: 'sp-5', employee_id: 'emp-14', readiness: 'ready_2_years', performance_rating: 4, potential_rating: 4, strength_notes: 'Strong financial acumen', gap_notes: 'Needs investor relations experience', ranking: 1 },
  { id: 'sc-9', plan_id: 'sp-6', employee_id: 'emp-15', readiness: 'ready_now', performance_rating: 4, potential_rating: 4, strength_notes: 'Great with people', gap_notes: '', ranking: 1 },
  { id: 'sc-10', plan_id: 'sp-6', employee_id: 'emp-16', readiness: 'developing', performance_rating: 3, potential_rating: 5, strength_notes: 'High potential', gap_notes: 'Needs more HR domain experience', ranking: 2 },
]

const DEMO_TALENT_REVIEW_ENTRIES = [
  { id: 'tre-1', review_id: 'tr-1', employee_id: 'emp-1', performance_score: 5, potential_score: 4, nine_box_position: 'consistent_star', retention_risk: 'low', key_strengths: 'Technical vision, team building', development_areas: 'Delegation' },
  { id: 'tre-2', review_id: 'tr-1', employee_id: 'emp-2', performance_score: 4, potential_score: 5, nine_box_position: 'star', retention_risk: 'medium', key_strengths: 'Innovation, strategic thinking', development_areas: 'Stakeholder management' },
  { id: 'tre-3', review_id: 'tr-1', employee_id: 'emp-3', performance_score: 5, potential_score: 5, nine_box_position: 'star', retention_risk: 'low', key_strengths: 'Execution, mentoring', development_areas: 'Public speaking' },
  { id: 'tre-4', review_id: 'tr-1', employee_id: 'emp-4', performance_score: 4, potential_score: 4, nine_box_position: 'consistent_star', retention_risk: 'low', key_strengths: 'Deep expertise', development_areas: 'Cross-team collaboration' },
  { id: 'tre-5', review_id: 'tr-1', employee_id: 'emp-5', performance_score: 3, potential_score: 5, nine_box_position: 'high_potential', retention_risk: 'medium', key_strengths: 'Creative problem solving', development_areas: 'Time management' },
  { id: 'tre-6', review_id: 'tr-1', employee_id: 'emp-6', performance_score: 5, potential_score: 3, nine_box_position: 'solid_performer', retention_risk: 'low', key_strengths: 'Reliable, consistent delivery', development_areas: 'Strategic thinking' },
  { id: 'tre-7', review_id: 'tr-1', employee_id: 'emp-7', performance_score: 3, potential_score: 3, nine_box_position: 'core_player', retention_risk: 'low', key_strengths: 'Team player, stable performer', development_areas: 'Leadership initiative' },
  { id: 'tre-8', review_id: 'tr-1', employee_id: 'emp-8', performance_score: 2, potential_score: 4, nine_box_position: 'rough_diamond', retention_risk: 'high', key_strengths: 'Raw talent, fast learner', development_areas: 'Consistency, focus' },
  { id: 'tre-9', review_id: 'tr-1', employee_id: 'emp-9', performance_score: 4, potential_score: 3, nine_box_position: 'solid_performer', retention_risk: 'low', key_strengths: 'Domain expertise', development_areas: 'Innovation mindset' },
  { id: 'tre-10', review_id: 'tr-1', employee_id: 'emp-10', performance_score: 2, potential_score: 2, nine_box_position: 'average_performer', retention_risk: 'medium', key_strengths: 'Process oriented', development_areas: 'Proactiveness, ownership' },
  { id: 'tre-11', review_id: 'tr-1', employee_id: 'emp-11', performance_score: 3, potential_score: 4, nine_box_position: 'high_potential', retention_risk: 'medium', key_strengths: 'Ambitious, quick learner', development_areas: 'Executive presence' },
  { id: 'tre-12', review_id: 'tr-1', employee_id: 'emp-12', performance_score: 1, potential_score: 2, nine_box_position: 'risk', retention_risk: 'critical', key_strengths: 'Experience', development_areas: 'Performance, engagement' },
]

export default function SuccessionPlanningPage() {
  const store = useTempo()
  const { employees, departments, ensureModulesLoaded, isLoading } = store

  const [activeTab, setActiveTab] = useState('plans')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [showNewPlanModal, setShowNewPlanModal] = useState(false)
  const [criticalityFilter, setCriticalityFilter] = useState('')

  // New Plan form state
  const [newPlan, setNewPlan] = useState({ positionTitle: '', incumbentId: '', departmentId: '', criticality: 'medium', riskOfVacancy: 'medium', notes: '' })

  useEffect(() => {
    ensureModulesLoaded?.(['employees', 'departments', 'successionPlans', 'successionCandidates', 'talentReviews', 'talentReviewEntries'])
  }, [ensureModulesLoaded])

  // Use store data, fallback to demo
  const plans = (store.successionPlans?.length > 0 ? store.successionPlans : DEMO_SUCCESSION_PLANS) as any[]
  const candidates = (store.successionCandidates?.length > 0 ? store.successionCandidates : DEMO_CANDIDATES) as any[]
  const reviewEntries = (store.talentReviewEntries?.length > 0 ? store.talentReviewEntries : DEMO_TALENT_REVIEW_ENTRIES) as any[]

  const getEmployeeName = (id: string) => {
    const emp = employees.find((e: any) => e.id === id)
    return emp?.profile?.full_name || (emp as any)?.full_name || `Employee ${id.slice(-4)}`
  }

  const getDeptName = (id: string) => {
    const dept = departments.find((d: any) => d.id === id)
    return dept?.name || 'Unknown'
  }

  // Compute bench strength
  const benchStrength = useMemo(() => {
    return plans.map(plan => calculateBenchStrength(
      { id: plan.id, position_title: plan.position_title, criticality: plan.criticality },
      candidates
    ))
  }, [plans, candidates])

  // Filter plans
  const filteredPlans = useMemo(() => {
    return plans.filter(p => {
      if (criticalityFilter && p.criticality !== criticalityFilter) return false
      if (searchQuery && !p.position_title.toLowerCase().includes(searchQuery.toLowerCase())) return false
      return true
    })
  }, [plans, criticalityFilter, searchQuery])

  const selectedPlanData = plans.find(p => p.id === selectedPlan)
  const selectedCandidates = candidates.filter(c => c.plan_id === selectedPlan).sort((a: any, b: any) => (a.ranking || 0) - (b.ranking || 0))

  // Stats
  const criticalPositions = plans.filter(p => p.criticality === 'critical').length
  const noSuccessor = benchStrength.filter(b => b.score === 'none').length
  const readyNowCount = candidates.filter(c => c.readiness === 'ready_now').length
  const highRiskVacancy = plans.filter(p => p.risk_of_vacancy === 'high').length

  // 9-Box Grid data
  const nineBoxGrid = useMemo(() => {
    const grid: Record<string, any[]> = {}
    // Initialize all 9 cells
    for (let perf = 1; perf <= 3; perf++) {
      for (let pot = 1; pot <= 3; pot++) {
        grid[`${perf}-${pot}`] = []
      }
    }
    reviewEntries.forEach((entry: any) => {
      const perfBucket = entry.performance_score <= 2 ? 1 : entry.performance_score <= 3 ? 2 : 3
      const potBucket = entry.potential_score <= 2 ? 1 : entry.potential_score <= 3 ? 2 : 3
      const key = `${perfBucket}-${potBucket}`
      if (grid[key]) grid[key].push(entry)
    })
    return grid
  }, [reviewEntries])

  if (isLoading) return <PageSkeleton />

  const tabs = [
    { id: 'plans', label: 'Succession Plans', count: plans.length },
    { id: 'nine-box', label: '9-Box Grid', count: reviewEntries.length },
    { id: 'bench', label: 'Bench Strength' },
    { id: 'risk', label: 'Flight Risk' },
  ]

  return (
    <>
      <Header title="Succession Planning" subtitle="Plan leadership pipeline and identify future leaders" />
      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Critical Positions" value={criticalPositions} icon={<Shield size={20} />} change={`${plans.length} total plans`} changeType="neutral" />
          <StatCard label="No Successor" value={noSuccessor} icon={<AlertTriangle size={20} />} change={noSuccessor > 0 ? 'Needs attention' : 'All covered'} changeType={noSuccessor > 0 ? 'negative' : 'positive'} />
          <StatCard label="Ready Now" value={readyNowCount} icon={<UserCheck size={20} />} change={`${candidates.length} total candidates`} changeType="neutral" />
          <StatCard label="High Vacancy Risk" value={highRiskVacancy} icon={<TrendingUp size={20} />} change={`${plans.filter(p => p.risk_of_vacancy === 'low').length} low risk`} changeType="neutral" />
        </div>

        <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

        {/* Succession Plans Tab */}
        {activeTab === 'plans' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <Input placeholder="Search positions..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} icon={<Search size={16} />} />
              </div>
              <Select value={criticalityFilter} onChange={(e: any) => setCriticalityFilter(e.target.value)} options={[{ value: '', label: 'All Criticality' }, { value: 'critical', label: 'Critical' }, { value: 'high', label: 'High' }, { value: 'medium', label: 'Medium' }, { value: 'low', label: 'Low' }]} />
              <Button onClick={() => setShowNewPlanModal(true)}><Plus size={16} className="mr-1" /> New Plan</Button>
            </div>

            {selectedPlan ? (
              // Plan Detail View
              <div className="space-y-4">
                <button onClick={() => setSelectedPlan(null)} className="text-sm text-tempo-600 hover:text-tempo-700 flex items-center gap-1">
                  &larr; Back to Plans
                </button>
                {selectedPlanData && (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between flex-wrap gap-3">
                        <div>
                          <CardTitle>{selectedPlanData.position_title}</CardTitle>
                          <p className="text-xs text-t3 mt-1">
                            Incumbent: <span className="text-t1 font-medium">{getEmployeeName(selectedPlanData.incumbent_id)}</span>
                            {selectedPlanData.department_id && <> &middot; {getDeptName(selectedPlanData.department_id)}</>}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={(CRITICALITY_DISPLAY[selectedPlanData.criticality]?.variant || 'default') as any}>
                            {CRITICALITY_DISPLAY[selectedPlanData.criticality]?.label || selectedPlanData.criticality}
                          </Badge>
                          <Badge variant={selectedPlanData.risk_of_vacancy === 'high' ? 'error' : selectedPlanData.risk_of_vacancy === 'medium' ? 'warning' : 'success'}>
                            {selectedPlanData.risk_of_vacancy} vacancy risk
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    {selectedPlanData.notes && <p className="px-6 pb-4 text-xs text-t3">{selectedPlanData.notes}</p>}
                  </Card>
                )}

                {/* Candidates Pipeline */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Users size={16} /> Candidate Pipeline ({selectedCandidates.length})</CardTitle>
                  </CardHeader>
                  <div className="px-6 pb-6">
                    {selectedCandidates.length === 0 ? (
                      <p className="text-sm text-t3 py-4 text-center">No candidates identified yet</p>
                    ) : (
                      <div className="space-y-3">
                        {selectedCandidates.map((candidate: any, idx: number) => (
                          <div key={candidate.id} className="flex items-center gap-4 p-3 rounded-xl border border-border hover:bg-canvas/50 transition-colors">
                            <span className="text-xs font-bold text-t3 w-6">#{idx + 1}</span>
                            <Avatar name={getEmployeeName(candidate.employee_id)} size="sm" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-t1 truncate">{getEmployeeName(candidate.employee_id)}</p>
                              <div className="flex items-center gap-3 mt-0.5">
                                <span className="text-xs text-t3">Perf: {candidate.performance_rating}/5</span>
                                <span className="text-xs text-t3">Potential: {candidate.potential_rating}/5</span>
                              </div>
                            </div>
                            <Badge variant={(READINESS_DISPLAY[candidate.readiness]?.variant || 'default') as any}>
                              {READINESS_DISPLAY[candidate.readiness]?.label || candidate.readiness}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>

                {/* Candidate Details */}
                {selectedCandidates.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedCandidates.map((candidate: any) => (
                      <Card key={candidate.id}>
                        <div className="p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <Avatar name={getEmployeeName(candidate.employee_id)} size="sm" />
                            <div>
                              <p className="text-sm font-semibold text-t1">{getEmployeeName(candidate.employee_id)}</p>
                              <Badge variant={(READINESS_DISPLAY[candidate.readiness]?.variant || 'default') as any} className="mt-0.5">
                                {READINESS_DISPLAY[candidate.readiness]?.label}
                              </Badge>
                            </div>
                          </div>
                          {candidate.strength_notes && (
                            <div className="mb-2">
                              <p className="text-[0.65rem] font-medium text-t3 uppercase tracking-wide mb-0.5">Strengths</p>
                              <p className="text-xs text-t2">{candidate.strength_notes}</p>
                            </div>
                          )}
                          {candidate.gap_notes && (
                            <div>
                              <p className="text-[0.65rem] font-medium text-t3 uppercase tracking-wide mb-0.5">Development Gaps</p>
                              <p className="text-xs text-t2">{candidate.gap_notes}</p>
                            </div>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              // Plans List
              <div className="space-y-3">
                {filteredPlans.map(plan => {
                  const bench = benchStrength.find(b => b.planId === plan.id)
                  const planCandidates = candidates.filter((c: any) => c.plan_id === plan.id)
                  return (
                    <Card key={plan.id} className="cursor-pointer hover:border-tempo-200 transition-colors" onClick={() => setSelectedPlan(plan.id)}>
                      <div className="p-4 flex items-center gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-semibold text-t1">{plan.position_title}</p>
                            <Badge variant={(CRITICALITY_DISPLAY[plan.criticality]?.variant || 'default') as any}>
                              {CRITICALITY_DISPLAY[plan.criticality]?.label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-t3">
                            <span>Incumbent: {getEmployeeName(plan.incumbent_id)}</span>
                            {plan.department_id && <span>&middot; {getDeptName(plan.department_id)}</span>}
                            <span>&middot; {planCandidates.length} candidate{planCandidates.length !== 1 ? 's' : ''}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={plan.risk_of_vacancy === 'high' ? 'error' : plan.risk_of_vacancy === 'medium' ? 'warning' : 'success'}>
                            {plan.risk_of_vacancy} risk
                          </Badge>
                          {bench && (
                            <Badge variant={bench.score === 'strong' ? 'success' : bench.score === 'adequate' ? 'info' : bench.score === 'weak' ? 'warning' : 'error'}>
                              {bench.score === 'none' ? 'No bench' : bench.score} bench
                            </Badge>
                          )}
                          <ChevronRight size={16} className="text-t3" />
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* 9-Box Grid Tab */}
        {activeTab === 'nine-box' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Grid3X3 size={16} /> 9-Box Talent Grid</CardTitle>
            </CardHeader>
            <div className="px-6 pb-6">
              <div className="grid grid-cols-3 gap-1">
                {/* Top row headers */}
                <div className="col-span-3 grid grid-cols-[60px_1fr_1fr_1fr] gap-1 mb-1">
                  <div />
                  <p className="text-[0.6rem] text-center text-t3 font-medium uppercase">Low Potential</p>
                  <p className="text-[0.6rem] text-center text-t3 font-medium uppercase">Medium Potential</p>
                  <p className="text-[0.6rem] text-center text-t3 font-medium uppercase">High Potential</p>
                </div>

                {/* Grid rows (performance high to low) */}
                {[3, 2, 1].map(perfBucket => (
                  <div key={perfBucket} className="col-span-3 grid grid-cols-[60px_1fr_1fr_1fr] gap-1">
                    <div className="flex items-center justify-center">
                      <p className="text-[0.6rem] text-t3 font-medium uppercase writing-mode-vertical" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                        {perfBucket === 3 ? 'High Perf' : perfBucket === 2 ? 'Med Perf' : 'Low Perf'}
                      </p>
                    </div>
                    {[1, 2, 3].map(potBucket => {
                      const key = `${perfBucket}-${potBucket}`
                      const entries = nineBoxGrid[key] || []
                      const position = calculateNineBoxPosition(
                        perfBucket === 1 ? 1 : perfBucket === 2 ? 3 : 5,
                        potBucket === 1 ? 1 : potBucket === 2 ? 3 : 5
                      )
                      const display = NINE_BOX_DISPLAY[position]
                      return (
                        <div
                          key={key}
                          className="min-h-[100px] rounded-lg border border-border p-2 transition-colors hover:border-tempo-200"
                          style={{ backgroundColor: `${display?.color}10` }}
                        >
                          <p className="text-[0.6rem] font-semibold mb-1.5" style={{ color: display?.color }}>{display?.label}</p>
                          <div className="flex flex-wrap gap-1">
                            {entries.map((entry: any) => (
                              <div key={entry.id} className="group relative">
                                <Avatar name={getEmployeeName(entry.employee_id)} size="xs" />
                                <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-gray-900 text-white text-[0.6rem] px-2 py-1 rounded whitespace-nowrap z-10">
                                  {getEmployeeName(entry.employee_id)}
                                  <br />P:{entry.performance_score} / Pot:{entry.potential_score}
                                </div>
                              </div>
                            ))}
                          </div>
                          {entries.length === 0 && <p className="text-[0.55rem] text-t3 italic">No employees</p>}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>

              {/* Retention Risk Summary */}
              <div className="mt-6 pt-4 border-t border-divider">
                <p className="text-xs font-semibold text-t1 mb-3">Retention Risk Distribution</p>
                <div className="flex gap-4">
                  {['low', 'medium', 'high', 'critical'].map(risk => {
                    const count = reviewEntries.filter((e: any) => e.retention_risk === risk).length
                    return (
                      <div key={risk} className="flex items-center gap-2">
                        <Badge variant={risk === 'critical' ? 'error' : risk === 'high' ? 'warning' : risk === 'medium' ? 'orange' : 'success'}>
                          {risk}
                        </Badge>
                        <span className="text-xs text-t2 font-medium">{count}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Bench Strength Tab */}
        {activeTab === 'bench' && (
          <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <StatCard label="Strong Bench" value={benchStrength.filter(b => b.score === 'strong').length} icon={<Star size={20} />} changeType="positive" change={`${Math.round(benchStrength.filter(b => b.score === 'strong').length / Math.max(benchStrength.length, 1) * 100)}% of positions`} />
              <StatCard label="Adequate" value={benchStrength.filter(b => b.score === 'adequate').length} icon={<Award size={20} />} changeType="neutral" />
              <StatCard label="Weak Bench" value={benchStrength.filter(b => b.score === 'weak').length} icon={<Clock size={20} />} changeType="negative" />
              <StatCard label="No Bench" value={benchStrength.filter(b => b.score === 'none').length} icon={<AlertTriangle size={20} />} changeType="negative" change="Immediate attention needed" />
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Layers size={16} /> Bench Strength by Position</CardTitle>
              </CardHeader>
              <div className="px-6 pb-6">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-divider text-left">
                      <th className="pb-2 text-xs font-medium text-t3 uppercase">Position</th>
                      <th className="pb-2 text-xs font-medium text-t3 uppercase">Criticality</th>
                      <th className="pb-2 text-xs font-medium text-t3 uppercase text-center">Ready Now</th>
                      <th className="pb-2 text-xs font-medium text-t3 uppercase text-center">1 Year</th>
                      <th className="pb-2 text-xs font-medium text-t3 uppercase text-center">2 Years</th>
                      <th className="pb-2 text-xs font-medium text-t3 uppercase text-center">Developing</th>
                      <th className="pb-2 text-xs font-medium text-t3 uppercase">Strength</th>
                    </tr>
                  </thead>
                  <tbody>
                    {benchStrength.map(b => (
                      <tr key={b.planId} className="border-b border-divider/50 hover:bg-canvas/50">
                        <td className="py-3 text-t1 font-medium">{b.positionTitle}</td>
                        <td className="py-3">
                          <Badge variant={(CRITICALITY_DISPLAY[b.criticality]?.variant || 'default') as any}>
                            {CRITICALITY_DISPLAY[b.criticality]?.label}
                          </Badge>
                        </td>
                        <td className="py-3 text-center">
                          <span className={`font-semibold ${b.readyNow > 0 ? 'text-green-600' : 'text-t3'}`}>{b.readyNow}</span>
                        </td>
                        <td className="py-3 text-center text-t2">{b.readyOneYear}</td>
                        <td className="py-3 text-center text-t2">{b.readyTwoYears}</td>
                        <td className="py-3 text-center text-t2">{b.developing}</td>
                        <td className="py-3">
                          <Badge variant={b.score === 'strong' ? 'success' : b.score === 'adequate' ? 'info' : b.score === 'weak' ? 'warning' : 'error'}>
                            {b.score === 'none' ? 'No Bench' : b.score.charAt(0).toUpperCase() + b.score.slice(1)}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* Flight Risk Tab */}
        {activeTab === 'risk' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><AlertTriangle size={16} /> Flight Risk Assessment</CardTitle>
            </CardHeader>
            <div className="px-6 pb-6">
              <div className="space-y-3">
                {reviewEntries
                  .filter((e: any) => e.retention_risk === 'critical' || e.retention_risk === 'high')
                  .map((entry: any) => (
                    <div key={entry.id} className="flex items-center gap-4 p-3 rounded-xl border border-border">
                      <Avatar name={getEmployeeName(entry.employee_id)} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-t1">{getEmployeeName(entry.employee_id)}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-t3">Performance: {entry.performance_score}/5</span>
                          <span className="text-xs text-t3">Potential: {entry.potential_score}/5</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={entry.retention_risk === 'critical' ? 'error' : 'warning'}>
                          {entry.retention_risk} risk
                        </Badge>
                        {entry.development_areas && (
                          <p className="text-[0.6rem] text-t3 mt-1">{entry.development_areas}</p>
                        )}
                      </div>
                    </div>
                  ))}
                {reviewEntries.filter((e: any) => e.retention_risk === 'critical' || e.retention_risk === 'high').length === 0 && (
                  <p className="text-sm text-t3 text-center py-8">No high-risk employees identified</p>
                )}
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* New Plan Modal */}
      <Modal open={showNewPlanModal} onClose={() => setShowNewPlanModal(false)} title="Create Succession Plan" size="lg">
        <div className="space-y-4">
          <Input label="Position Title" value={newPlan.positionTitle} onChange={e => setNewPlan(prev => ({ ...prev, positionTitle: e.target.value }))} placeholder="e.g. VP of Engineering" />
          <Select label="Department" value={newPlan.departmentId} onChange={(e: any) => setNewPlan(prev => ({ ...prev, departmentId: e.target.value }))} options={[{ value: '', label: 'Select Department' }, ...departments.map((d: any) => ({ value: d.id, label: d.name }))]} />
          <Select label="Incumbent" value={newPlan.incumbentId} onChange={(e: any) => setNewPlan(prev => ({ ...prev, incumbentId: e.target.value }))} options={[{ value: '', label: 'Select Current Holder' }, ...employees.slice(0, 50).map((e: any) => ({ value: e.id, label: e.profile?.full_name || 'Unknown' }))]} />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Criticality" value={newPlan.criticality} onChange={(e: any) => setNewPlan(prev => ({ ...prev, criticality: e.target.value }))} options={[{ value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }, { value: 'critical', label: 'Critical' }]} />
            <Select label="Risk of Vacancy" value={newPlan.riskOfVacancy} onChange={(e: any) => setNewPlan(prev => ({ ...prev, riskOfVacancy: e.target.value }))} options={[{ value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }]} />
          </div>
          <Textarea label="Notes" value={newPlan.notes} onChange={e => setNewPlan(prev => ({ ...prev, notes: e.target.value }))} placeholder="Additional context..." />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowNewPlanModal(false)}>Cancel</Button>
            <Button onClick={() => setShowNewPlanModal(false)}>Create Plan</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
