'use client'

import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { Header } from '@/components/layout/header'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/ui/stat-card'
import { Progress } from '@/components/ui/progress'
import { Modal } from '@/components/ui/modal'
import { Input, Select, Textarea } from '@/components/ui/input'
import { Tabs } from '@/components/ui/tabs'
import { MiniBarChart, MiniDonutChart } from '@/components/ui/mini-chart'
import {
  Shield, Heart, Eye, Wallet, Plus, Pencil, Users, Baby, Calendar,
  BarChart3, Calculator, ArrowRightLeft, Clock, CheckCircle2, AlertTriangle,
  UserPlus, HeartHandshake, Scale,
} from 'lucide-react'
import { useTempo } from '@/lib/store'
import { AIInsightCard, AIAlertBanner, AIScoreBadge, AIRecommendationList } from '@/components/ai'
import {
  recommendBenefitPlan, optimizeBenefitsCost,
  analyzeBenefitEnrollmentTrends, predictLifeEventImpact, scoreBenefitsCompetitiveness,
} from '@/lib/ai-engine'

const iconMap: Record<string, React.ReactNode> = {
  medical: <Heart size={20} />,
  vision: <Eye size={20} />,
  retirement: <Wallet size={20} />,
  life: <Shield size={20} />,
  dental: <Heart size={20} />,
}

// Coverage level labels are defined inside the component to use translations

const coverageLevelMultiplier: Record<string, number> = {
  employee_only: 1,
  employee_spouse: 1.6,
  employee_child: 1.4,
  family: 2.2,
}

const lifeEventIcons: Record<string, React.ReactNode> = {
  marriage: <HeartHandshake size={16} />,
  birth: <Baby size={16} />,
  adoption: <UserPlus size={16} />,
  divorce: <Scale size={16} />,
  death: <Shield size={16} />,
}

export default function BenefitsPage() {
  const t = useTranslations('benefits')
  const tc = useTranslations('common')
  const {
    benefitPlans, employees, departments,
    addBenefitPlan, updateBenefitPlan,
    benefitEnrollments, addBenefitEnrollment, updateBenefitEnrollment,
    benefitDependents, addBenefitDependent, updateBenefitDependent,
    lifeEvents, addLifeEvent, updateLifeEvent,
    getEmployeeName, getDepartmentName,
  } = useTempo()

  const coverageLevelLabels: Record<string, string> = {
    employee_only: t('coverageEmployeeOnly'),
    employee_spouse: t('coverageEmployeeSpouse'),
    employee_child: t('coverageEmployeeChild'),
    family: t('coverageFamily'),
  }

  // ---- Tab State ----
  const [activeTab, setActiveTab] = useState('plans')
  const tabDefs = [
    { id: 'plans', label: t('tabPlans'), count: benefitPlans.length },
    { id: 'enrollment', label: t('tabEnrollment'), count: benefitEnrollments.filter(e => (e as any).status === 'active').length },
    { id: 'dependents', label: t('tabDependents'), count: benefitDependents.length },
    { id: 'analytics', label: t('tabAnalytics') },
    { id: 'life-events', label: t('tabLifeEvents'), count: lifeEvents.filter(e => (e as any).status === 'pending').length },
    { id: 'cost-calculator', label: t('tabCostCalculator') },
  ]

  // ---- Modals ----
  const [showPlanModal, setShowPlanModal] = useState(false)
  const [editingPlan, setEditingPlan] = useState<string | null>(null)
  const [showEnrollmentModal, setShowEnrollmentModal] = useState(false)
  const [showDependentModal, setShowDependentModal] = useState(false)
  const [showLifeEventModal, setShowLifeEventModal] = useState(false)
  const [comparePlans, setComparePlans] = useState<string[]>([])

  // ---- Forms ----
  const [planForm, setPlanForm] = useState({
    name: '', type: 'medical' as string, provider: '',
    cost_employee: 0, cost_employer: 0, description: '',
    is_active: true, currency: 'USD',
  })
  const [enrollForm, setEnrollForm] = useState({
    employee_id: '', plan_id: '', coverage_level: 'employee_only',
  })
  const [depForm, setDepForm] = useState({
    employee_id: '', first_name: '', last_name: '',
    relationship: 'spouse' as string, date_of_birth: '',
    gender: 'male' as string, plan_ids: [] as string[],
  })
  const [lifeEventForm, setLifeEventForm] = useState({
    employee_id: '', type: 'marriage' as string,
    event_date: '', notes: '',
  })

  // ---- Cost Calculator State ----
  const [calcPlanId, setCalcPlanId] = useState('')
  const [calcCoverage, setCalcCoverage] = useState('employee_only')
  const [calcDependents, setCalcDependents] = useState(0)

  // ---- Computed Data ----
  const activePlans = benefitPlans.filter(p => p.is_active)
  const totalEmployerCost = benefitPlans.reduce((a, p) => a + p.cost_employer, 0)
  const uniqueProviders = [...new Set(benefitPlans.map(p => p.provider))].length
  const activeEnrollments = benefitEnrollments.filter(e => (e as any).status === 'active')
  const enrolledEmployeeIds = [...new Set(activeEnrollments.map(e => (e as any).employee_id))]
  const enrollmentRate = employees.length > 0 ? Math.round((enrolledEmployeeIds.length / employees.length) * 100) : 0
  const pendingLifeEvents = lifeEvents.filter(e => (e as any).status === 'pending')

  // ---- AI ----
  const benefitRecs = useMemo(() => recommendBenefitPlan(benefitPlans, employees), [benefitPlans, employees])
  const costInsight = useMemo(() => optimizeBenefitsCost(benefitPlans, employees), [benefitPlans, employees])
  const enrollTrends = useMemo(() => analyzeBenefitEnrollmentTrends(benefitEnrollments, benefitPlans, employees), [benefitEnrollments, benefitPlans, employees])
  const lifeEventInsights = useMemo(() => predictLifeEventImpact(lifeEvents, benefitEnrollments), [lifeEvents, benefitEnrollments])
  const competitivenessScore = useMemo(() => scoreBenefitsCompetitiveness(benefitPlans, employees), [benefitPlans, employees])

  // ---- Plan CRUD ----
  function openNewPlan() {
    setEditingPlan(null)
    setPlanForm({ name: '', type: 'medical', provider: '', cost_employee: 0, cost_employer: 0, description: '', is_active: true, currency: 'USD' })
    setShowPlanModal(true)
  }

  function openEditPlan(id: string) {
    const plan = benefitPlans.find(p => p.id === id)
    if (!plan) return
    setEditingPlan(id)
    setPlanForm({
      name: plan.name, type: plan.type, provider: plan.provider,
      cost_employee: plan.cost_employee, cost_employer: plan.cost_employer,
      description: plan.description || '', is_active: plan.is_active,
      currency: plan.currency || 'USD',
    })
    setShowPlanModal(true)
  }

  function submitPlan() {
    if (!planForm.name || !planForm.provider) return
    const data = {
      name: planForm.name, type: planForm.type, provider: planForm.provider,
      cost_employee: Number(planForm.cost_employee) || 0, cost_employer: Number(planForm.cost_employer) || 0,
      description: planForm.description, is_active: planForm.is_active, currency: planForm.currency,
    }
    if (editingPlan) { updateBenefitPlan(editingPlan, data) } else { addBenefitPlan(data) }
    setShowPlanModal(false)
  }

  function togglePlanStatus(id: string, currentStatus: boolean) {
    updateBenefitPlan(id, { is_active: !currentStatus })
  }

  function toggleCompare(planId: string) {
    setComparePlans(prev =>
      prev.includes(planId)
        ? prev.filter(id => id !== planId)
        : prev.length < 2 ? [...prev, planId] : [prev[1], planId]
    )
  }

  // ---- Enrollment CRUD ----
  function submitEnrollment() {
    if (!enrollForm.employee_id || !enrollForm.plan_id) return
    addBenefitEnrollment({
      employee_id: enrollForm.employee_id, plan_id: enrollForm.plan_id,
      coverage_level: enrollForm.coverage_level, status: 'active',
      enrolled_date: new Date().toISOString().split('T')[0],
      effective_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    })
    setShowEnrollmentModal(false)
    setEnrollForm({ employee_id: '', plan_id: '', coverage_level: 'employee_only' })
  }

  // ---- Dependent CRUD ----
  function submitDependent() {
    if (!depForm.employee_id || !depForm.first_name || !depForm.last_name) return
    addBenefitDependent({ ...depForm })
    setShowDependentModal(false)
    setDepForm({ employee_id: '', first_name: '', last_name: '', relationship: 'spouse', date_of_birth: '', gender: 'male', plan_ids: [] })
  }

  // ---- Life Event CRUD ----
  function submitLifeEvent() {
    if (!lifeEventForm.employee_id || !lifeEventForm.event_date) return
    const deadline = new Date(new Date(lifeEventForm.event_date).getTime() + 30 * 86400000).toISOString().split('T')[0]
    addLifeEvent({
      employee_id: lifeEventForm.employee_id, type: lifeEventForm.type,
      event_date: lifeEventForm.event_date, reported_date: new Date().toISOString().split('T')[0],
      deadline, status: 'pending', notes: lifeEventForm.notes, benefit_changes: [],
    })
    setShowLifeEventModal(false)
    setLifeEventForm({ employee_id: '', type: 'marriage', event_date: '', notes: '' })
  }

  // ---- Cost Calculator ----
  const calcPlan = benefitPlans.find(p => p.id === calcPlanId)
  const calcResult = useMemo(() => {
    if (!calcPlan) return null
    const multiplier = coverageLevelMultiplier[calcCoverage] || 1
    const depAdj = calcDependents > 0 ? 1 + (calcDependents * 0.15) : 1
    const empMonthly = Math.round(calcPlan.cost_employee * multiplier * depAdj)
    const erMonthly = Math.round(calcPlan.cost_employer * multiplier * depAdj)
    return {
      empMonthly, erMonthly, totalMonthly: empMonthly + erMonthly,
      empAnnual: empMonthly * 12, erAnnual: erMonthly * 12, totalAnnual: (empMonthly + erMonthly) * 12,
    }
  }, [calcPlan, calcCoverage, calcDependents])

  // ---- Helper: get plan enrollment count ----
  function getPlanEnrollCount(planId: string) {
    return benefitEnrollments.filter(e => (e as any).plan_id === planId && (e as any).status === 'active').length
  }

  // ---- Helper: dependents per employee ----
  function getEmployeeDependentCount(empId: string) {
    return benefitDependents.filter(d => (d as any).employee_id === empId).length
  }

  return (
    <>
      <Header
        title={t('title')}
        subtitle={t('subtitle')}
        actions={
          <Button size="sm" onClick={openNewPlan}>
            <Plus size={14} /> {t('addPlan')}
          </Button>
        }
      />

      {/* Tabs */}
      <Tabs tabs={tabDefs} active={activeTab} onChange={setActiveTab} className="mb-6" />

      {/* ============================================================ */}
      {/* TAB 1: PLANS */}
      {/* ============================================================ */}
      {activeTab === 'plans' && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard label={t('activePlans')} value={activePlans.length} icon={<Shield size={20} />} />
            <StatCard label={t('enrollmentRate')} value={`${enrollmentRate}%`} change={enrollmentRate >= 85 ? t('aboveTarget') : t('belowTarget')} changeType={enrollmentRate >= 85 ? 'positive' : 'negative'} />
            <StatCard label={t('monthlyEmployerCost')} value={`$${totalEmployerCost.toLocaleString()}`} change={tc('perEmployee')} changeType="neutral" />
            <StatCard label={t('providers')} value={uniqueProviders} change={t('activePartnerships')} changeType="neutral" />
          </div>

          {/* AI Insights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <AIInsightCard insight={costInsight} />
            <AIRecommendationList title={t('benefitRecommendations')} recommendations={benefitRecs} />
          </div>

          {/* Plan Comparison (when 2 plans selected) */}
          {comparePlans.length === 2 && (() => {
            const planA = benefitPlans.find(p => p.id === comparePlans[0])
            const planB = benefitPlans.find(p => p.id === comparePlans[1])
            if (!planA || !planB) return null
            return (
              <Card className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-t1 flex items-center gap-2">
                    <ArrowRightLeft size={16} className="text-tempo-600" />
                    {t('planComparison')}
                  </h3>
                  <Button size="sm" variant="ghost" onClick={() => setComparePlans([])}>{tc('close')}</Button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-divider">
                        <th className="text-left px-4 py-2 text-t3 font-medium">{t('compareFeature')}</th>
                        <th className="text-center px-4 py-2 text-t1 font-semibold">{planA.name}</th>
                        <th className="text-center px-4 py-2 text-t1 font-semibold">{planB.name}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {[
                        { label: tc('type'), a: planA.type, b: planB.type },
                        { label: t('provider'), a: planA.provider, b: planB.provider },
                        { label: t('employeeCost'), a: `$${planA.cost_employee}/mo`, b: `$${planB.cost_employee}/mo` },
                        { label: t('employerCost'), a: `$${planA.cost_employer}/mo`, b: `$${planB.cost_employer}/mo` },
                        { label: t('totalCost'), a: `$${planA.cost_employee + planA.cost_employer}/mo`, b: `$${planB.cost_employee + planB.cost_employer}/mo` },
                        { label: t('annualTotal'), a: `$${((planA.cost_employee + planA.cost_employer) * 12).toLocaleString()}`, b: `$${((planB.cost_employee + planB.cost_employer) * 12).toLocaleString()}` },
                        { label: t('enrolled'), a: String(getPlanEnrollCount(planA.id)), b: String(getPlanEnrollCount(planB.id)) },
                        { label: tc('status'), a: planA.is_active ? tc('active') : tc('inactive'), b: planB.is_active ? tc('active') : tc('inactive') },
                      ].map(row => (
                        <tr key={row.label}>
                          <td className="px-4 py-2 text-t2">{row.label}</td>
                          <td className="px-4 py-2 text-center text-t1 font-medium">{row.a}</td>
                          <td className="px-4 py-2 text-center text-t1 font-medium">{row.b}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )
          })()}

          {/* Benefit Plan Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {benefitPlans.length === 0 && (
              <div className="col-span-2 text-center py-12 text-sm text-t3">{t('noBenefitPlans')}</div>
            )}
            {benefitPlans.map(plan => {
              const enrolledCount = getPlanEnrollCount(plan.id)
              const enrollPct = employees.length > 0 ? Math.round((enrolledCount / employees.length) * 100) : 0
              const isComparing = comparePlans.includes(plan.id)
              return (
                <Card key={plan.id} className={isComparing ? 'ring-2 ring-tempo-500' : ''}>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-tempo-50 flex items-center justify-center text-tempo-600">
                      {iconMap[plan.type] || <Shield size={20} />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-sm font-semibold text-t1">{plan.name}</h3>
                        <div className="flex items-center gap-2">
                          <Badge variant={plan.is_active ? 'success' : 'default'}>
                            {plan.is_active ? tc('active') : tc('inactive')}
                          </Badge>
                          <button
                            onClick={() => toggleCompare(plan.id)}
                            className={`p-1.5 rounded-lg transition-colors ${isComparing ? 'bg-tempo-100 text-tempo-600' : 'text-t3 hover:text-t1 hover:bg-canvas'}`}
                            title={t('comparePlan')}
                          >
                            <ArrowRightLeft size={14} />
                          </button>
                          <button onClick={() => openEditPlan(plan.id)} className="p-1.5 text-t3 hover:text-t1 hover:bg-canvas rounded-lg transition-colors" title={t('editPlanModal')} aria-label={t('editPlanModal')}>
                            <Pencil size={14} />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-t3 mb-3">{plan.description}</p>
                      <div className="grid grid-cols-3 gap-3 mb-3">
                        <div>
                          <p className="text-[0.6rem] text-t3 uppercase">{t('provider')}</p>
                          <p className="text-xs font-medium text-t1">{plan.provider}</p>
                        </div>
                        <div>
                          <p className="text-[0.6rem] text-t3 uppercase">{t('employeeCost')}</p>
                          <p className="text-xs font-medium text-t1">${plan.cost_employee}/mo</p>
                        </div>
                        <div>
                          <p className="text-[0.6rem] text-t3 uppercase">{t('employerCost')}</p>
                          <p className="text-xs font-medium text-t1">${plan.cost_employer}/mo</p>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-t3">{t('enrollment')}</span>
                          <span className="text-t2">{t('enrollmentCount', { enrolled: enrolledCount, total: employees.length })}</span>
                        </div>
                        <Progress value={enrollPct} color="success" />
                      </div>
                      <div className="flex justify-end mt-3">
                        <Button size="sm" variant={plan.is_active ? 'ghost' : 'primary'} onClick={() => togglePlanStatus(plan.id, plan.is_active)}>
                          {plan.is_active ? tc('deactivate') : tc('activate')}
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>

          {/* Benefit Cost Summary Table */}
          <Card padding="none">
            <CardHeader><CardTitle>{t('benefitCostSummary')}</CardTitle></CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-divider bg-canvas">
                    <th className="tempo-th text-left px-6 py-3">{t('tablePlan')}</th>
                    <th className="tempo-th text-left px-4 py-3">{t('tableType')}</th>
                    <th className="tempo-th text-center px-4 py-3">{t('tableStatus')}</th>
                    <th className="tempo-th text-right px-4 py-3">{t('enrolled')}</th>
                    <th className="tempo-th text-right px-4 py-3">{t('tableEmployeeMo')}</th>
                    <th className="tempo-th text-right px-4 py-3">{t('tableEmployerMo')}</th>
                    <th className="tempo-th text-right px-4 py-3">{t('tableTotalMo')}</th>
                    <th className="tempo-th text-right px-4 py-3">{t('tableAnnualCost')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {benefitPlans.map(plan => (
                    <tr key={plan.id} className="hover:bg-canvas/50">
                      <td className="px-6 py-3 text-sm font-medium text-t1">{plan.name}</td>
                      <td className="px-4 py-3"><Badge>{plan.type}</Badge></td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={plan.is_active ? 'success' : 'default'}>{plan.is_active ? tc('active') : tc('inactive')}</Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-t2 text-right">{getPlanEnrollCount(plan.id)}</td>
                      <td className="px-4 py-3 text-sm text-t2 text-right">${plan.cost_employee}</td>
                      <td className="px-4 py-3 text-sm text-t2 text-right">${plan.cost_employer}</td>
                      <td className="px-4 py-3 text-sm font-medium text-t1 text-right">${plan.cost_employee + plan.cost_employer}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-t1 text-right">
                        ${((plan.cost_employee + plan.cost_employer) * getPlanEnrollCount(plan.id) * 12).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  {benefitPlans.length > 0 && (
                    <tr className="bg-canvas font-semibold">
                      <td className="px-6 py-3 text-sm text-t1" colSpan={4}>{tc('total')}</td>
                      <td className="px-4 py-3 text-sm text-t1 text-right">${benefitPlans.reduce((a, p) => a + p.cost_employee, 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-t1 text-right">${benefitPlans.reduce((a, p) => a + p.cost_employer, 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-t1 text-right">${benefitPlans.reduce((a, p) => a + p.cost_employee + p.cost_employer, 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-t1 text-right">
                        ${benefitPlans.reduce((a, p) => a + (p.cost_employee + p.cost_employer) * getPlanEnrollCount(p.id) * 12, 0).toLocaleString()}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {/* ============================================================ */}
      {/* TAB 2: ENROLLMENT */}
      {/* ============================================================ */}
      {activeTab === 'enrollment' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard label={t('totalEnrollments')} value={activeEnrollments.length} icon={<Users size={20} />} />
            <StatCard label={t('enrollmentRate')} value={`${enrollmentRate}%`} change={enrollmentRate >= 85 ? t('aboveTarget') : t('belowTarget')} changeType={enrollmentRate >= 85 ? 'positive' : 'negative'} icon={<BarChart3 size={20} />} />
            <StatCard label={t('enrolledEmployees')} value={enrolledEmployeeIds.length} change={`${employees.length - enrolledEmployeeIds.length} ${t('notEnrolled')}`} changeType="neutral" icon={<Users size={20} />} />
            <StatCard label={t('waivedEnrollments')} value={benefitEnrollments.filter(e => (e as any).status === 'waived').length} change={t('optedOut')} changeType="neutral" icon={<Shield size={20} />} />
          </div>

          {enrollTrends.insights.length > 0 && <AIAlertBanner insights={enrollTrends.insights} className="mb-4" />}

          <Card padding="none" className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t('enrollmentRecords')}</CardTitle>
                <Button size="sm" onClick={() => setShowEnrollmentModal(true)}><Plus size={14} /> {t('newEnrollment')}</Button>
              </div>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-divider bg-canvas">
                    <th className="tempo-th text-left px-6 py-3">{t('employeeName')}</th>
                    <th className="tempo-th text-left px-4 py-3">{t('tablePlan')}</th>
                    <th className="tempo-th text-center px-4 py-3">{t('coverageLevel')}</th>
                    <th className="tempo-th text-center px-4 py-3">{t('effectiveDate')}</th>
                    <th className="tempo-th text-center px-4 py-3">{tc('status')}</th>
                    <th className="tempo-th text-center px-4 py-3">{tc('actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {benefitEnrollments.length === 0 ? (
                    <tr><td colSpan={6} className="px-6 py-12 text-center text-sm text-t3">{t('noEnrollments')}</td></tr>
                  ) : benefitEnrollments.map(enr => {
                    const e = enr as any
                    const plan = benefitPlans.find(p => p.id === e.plan_id)
                    return (
                      <tr key={e.id} className="hover:bg-canvas/50">
                        <td className="px-6 py-3">
                          <p className="text-sm font-medium text-t1">{getEmployeeName(e.employee_id)}</p>
                          <p className="text-xs text-t3">{e.employee_id}</p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-tempo-600">{plan ? (iconMap[plan.type] || <Shield size={14} />) : null}</span>
                            <span className="text-sm text-t1">{plan?.name || e.plan_id}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant="info">{coverageLevelLabels[e.coverage_level] || e.coverage_level}</Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-t2 text-center">{e.effective_date}</td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant={e.status === 'active' ? 'success' : e.status === 'waived' ? 'default' : 'warning'}>
                            {e.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {e.status === 'active' && (
                            <Button size="sm" variant="ghost" onClick={() => updateBenefitEnrollment(e.id, { status: 'waived' })}>
                              {t('waive')}
                            </Button>
                          )}
                          {e.status === 'waived' && (
                            <Button size="sm" variant="ghost" onClick={() => updateBenefitEnrollment(e.id, { status: 'active' })}>
                              {t('reactivate')}
                            </Button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Enrollment by Plan Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <h3 className="text-sm font-semibold text-t1 mb-4">{t('enrollmentByPlan')}</h3>
              {benefitPlans.length > 0 ? (
                <MiniBarChart
                  data={benefitPlans.map(p => ({
                    label: p.name.length > 12 ? p.name.substring(0, 12) + '...' : p.name,
                    value: getPlanEnrollCount(p.id),
                  }))}
                  showLabels
                  height={140}
                />
              ) : <p className="text-sm text-t3">{t('noBenefitPlans')}</p>}
            </Card>
            <Card>
              <h3 className="text-sm font-semibold text-t1 mb-4">{t('coverageLevelBreakdown')}</h3>
              {(() => {
                const levelMap: Record<string, number> = {}
                activeEnrollments.forEach(e => {
                  const lvl = (e as any).coverage_level || 'employee_only'
                  levelMap[lvl] = (levelMap[lvl] || 0) + 1
                })
                const items = Object.entries(levelMap).sort((a, b) => b[1] - a[1])
                const colors = ['bg-tempo-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500']
                return items.length > 0 ? (
                  <MiniDonutChart data={items.map(([label, value], i) => ({
                    label: coverageLevelLabels[label] || label,
                    value,
                    color: colors[i % colors.length],
                  }))} />
                ) : <p className="text-sm text-t3">{t('noEnrollments')}</p>
              })()}
            </Card>
          </div>
        </>
      )}

      {/* ============================================================ */}
      {/* TAB 3: DEPENDENTS */}
      {/* ============================================================ */}
      {activeTab === 'dependents' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard label={t('totalDependents')} value={benefitDependents.length} icon={<Users size={20} />} />
            <StatCard label={t('spouses')} value={benefitDependents.filter(d => (d as any).relationship === 'spouse').length} icon={<HeartHandshake size={20} />} />
            <StatCard label={t('children')} value={benefitDependents.filter(d => (d as any).relationship === 'child').length} icon={<Baby size={20} />} />
            <StatCard
              label={t('employeesWithDependents')}
              value={[...new Set(benefitDependents.map(d => (d as any).employee_id))].length}
              change={`${Math.round(([...new Set(benefitDependents.map(d => (d as any).employee_id))].length / Math.max(employees.length, 1)) * 100)}%`}
              changeType="neutral"
              icon={<UserPlus size={20} />}
            />
          </div>

          <Card padding="none">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t('dependentDirectory')}</CardTitle>
                <Button size="sm" onClick={() => setShowDependentModal(true)}><Plus size={14} /> {t('addDependent')}</Button>
              </div>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-divider bg-canvas">
                    <th className="tempo-th text-left px-6 py-3">{t('dependentName')}</th>
                    <th className="tempo-th text-left px-4 py-3">{t('employeeName')}</th>
                    <th className="tempo-th text-center px-4 py-3">{t('relationship')}</th>
                    <th className="tempo-th text-center px-4 py-3">{t('dateOfBirth')}</th>
                    <th className="tempo-th text-left px-4 py-3">{t('coveredPlans')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {benefitDependents.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-12 text-center text-sm text-t3">{t('noDependents')}</td></tr>
                  ) : benefitDependents.map(dep => {
                    const d = dep as any
                    return (
                      <tr key={d.id} className="hover:bg-canvas/50">
                        <td className="px-6 py-3">
                          <p className="text-sm font-medium text-t1">{d.first_name} {d.last_name}</p>
                          <p className="text-xs text-t3 capitalize">{d.gender}</p>
                        </td>
                        <td className="px-4 py-3 text-sm text-t2">{getEmployeeName(d.employee_id)}</td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant={d.relationship === 'spouse' ? 'info' : d.relationship === 'child' ? 'success' : 'default'}>
                            {d.relationship}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-t2 text-center">{d.date_of_birth}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {(d.plan_ids || []).map((pid: string) => {
                              const plan = benefitPlans.find(p => p.id === pid)
                              return (
                                <Badge key={pid} variant="default">
                                  {plan?.name || pid}
                                </Badge>
                              )
                            })}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Dependents per Employee Summary */}
          <Card className="mt-6">
            <h3 className="text-sm font-semibold text-t1 mb-4">{t('dependentsPerEmployee')}</h3>
            <div className="space-y-2">
              {[...new Set(benefitDependents.map(d => (d as any).employee_id))].map(empId => {
                const count = getEmployeeDependentCount(empId)
                const deps = benefitDependents.filter(d => (d as any).employee_id === empId)
                return (
                  <div key={empId} className="flex items-center justify-between py-2 border-b border-divider last:border-0">
                    <div>
                      <p className="text-sm font-medium text-t1">{getEmployeeName(empId)}</p>
                      <p className="text-xs text-t3">
                        {deps.map(d => `${(d as any).first_name} (${(d as any).relationship})`).join(', ')}
                      </p>
                    </div>
                    <Badge variant="info">{count} {count === 1 ? t('dependent') : t('dependentsLabel')}</Badge>
                  </div>
                )
              })}
            </div>
          </Card>
        </>
      )}

      {/* ============================================================ */}
      {/* TAB 4: ANALYTICS */}
      {/* ============================================================ */}
      {activeTab === 'analytics' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="text-center py-4">
              <p className="text-xs text-t3 mb-2">{t('competitivenessScore')}</p>
              <AIScoreBadge score={competitivenessScore} size="lg" showBreakdown />
            </Card>
            <StatCard label={t('enrollmentRate')} value={`${enrollmentRate}%`} change={enrollmentRate >= 85 ? t('aboveTarget') : t('belowTarget')} changeType={enrollmentRate >= 85 ? 'positive' : 'negative'} icon={<BarChart3 size={20} />} />
            <StatCard label={t('monthlyEmployerCost')} value={`$${totalEmployerCost.toLocaleString()}`} change={`$${(totalEmployerCost * 12).toLocaleString()} / ${t('year')}`} changeType="neutral" icon={<Wallet size={20} />} />
            <StatCard label={t('totalDependents')} value={benefitDependents.length} change={`${[...new Set(benefitDependents.map(d => (d as any).employee_id))].length} ${t('employeesLabel')}`} changeType="neutral" icon={<Users size={20} />} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Enrollment by Plan Type */}
            <Card>
              <h3 className="text-sm font-semibold text-t1 mb-4">{t('enrollmentByPlanType')}</h3>
              {enrollTrends.byType.length > 0 ? (
                <>
                  <MiniBarChart
                    data={enrollTrends.byType.map(item => ({
                      label: item.type.charAt(0).toUpperCase() + item.type.slice(1),
                      value: item.count,
                    }))}
                    showLabels
                    height={140}
                  />
                  <div className="mt-3 space-y-1">
                    {enrollTrends.byType.map(item => (
                      <div key={item.type} className="flex justify-between text-xs">
                        <span className="text-t2 capitalize">{item.type}</span>
                        <span className="text-t1 font-medium">{item.count} {t('enrollmentsLabel')}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : <p className="text-sm text-t3">{t('noEnrollments')}</p>}
            </Card>

            {/* Cost Breakdown by Plan Type */}
            <Card>
              <h3 className="text-sm font-semibold text-t1 mb-4">{t('costBreakdownByType')}</h3>
              {(() => {
                const typeMap: Record<string, { employer: number; employee: number }> = {}
                benefitPlans.forEach(p => {
                  if (!typeMap[p.type]) typeMap[p.type] = { employer: 0, employee: 0 }
                  const enrolled = getPlanEnrollCount(p.id)
                  typeMap[p.type].employer += p.cost_employer * enrolled
                  typeMap[p.type].employee += p.cost_employee * enrolled
                })
                const items = Object.entries(typeMap).sort((a, b) => (b[1].employer + b[1].employee) - (a[1].employer + a[1].employee))
                const colors = ['bg-tempo-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500']
                return items.length > 0 ? (
                  <>
                    <MiniDonutChart data={items.map(([label, d], i) => ({
                      label: label.charAt(0).toUpperCase() + label.slice(1),
                      value: d.employer + d.employee,
                      color: colors[i % colors.length],
                    }))} />
                    <div className="mt-3 space-y-1">
                      {items.map(([type, d]) => (
                        <div key={type} className="flex justify-between text-xs">
                          <span className="text-t2 capitalize">{type}</span>
                          <span className="text-t1 font-medium">${(d.employer + d.employee).toLocaleString()}/mo</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : <p className="text-sm text-t3">{t('noBenefitPlans')}</p>
              })()}
            </Card>
          </div>

          {/* Employer vs Employee Cost Comparison */}
          <Card className="mb-6">
            <h3 className="text-sm font-semibold text-t1 mb-4">{t('employerVsEmployeeCost')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-t2">{t('employerShare')}</span>
                  <span className="text-sm font-semibold text-t1">
                    ${benefitPlans.reduce((a, p) => a + p.cost_employer * getPlanEnrollCount(p.id), 0).toLocaleString()}/mo
                  </span>
                </div>
                <Progress
                  value={benefitPlans.reduce((a, p) => a + p.cost_employer, 0) / Math.max(benefitPlans.reduce((a, p) => a + p.cost_employer + p.cost_employee, 0), 1) * 100}
                  color="success"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-t2">{t('employeeShare')}</span>
                  <span className="text-sm font-semibold text-t1">
                    ${benefitPlans.reduce((a, p) => a + p.cost_employee * getPlanEnrollCount(p.id), 0).toLocaleString()}/mo
                  </span>
                </div>
                <Progress
                  value={benefitPlans.reduce((a, p) => a + p.cost_employee, 0) / Math.max(benefitPlans.reduce((a, p) => a + p.cost_employer + p.cost_employee, 0), 1) * 100}
                  color="warning"
                />
              </div>
            </div>
          </Card>

          {/* AI Recommendations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AIInsightCard insight={costInsight} />
            <AIRecommendationList title={t('benefitRecommendations')} recommendations={benefitRecs} />
          </div>
        </>
      )}

      {/* ============================================================ */}
      {/* TAB 5: LIFE EVENTS */}
      {/* ============================================================ */}
      {activeTab === 'life-events' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard label={t('totalLifeEvents')} value={lifeEvents.length} icon={<Calendar size={20} />} />
            <StatCard label={t('pendingEvents')} value={pendingLifeEvents.length} change={pendingLifeEvents.length > 0 ? t('requiresAction') : t('allProcessed')} changeType={pendingLifeEvents.length > 0 ? 'negative' : 'positive'} icon={<Clock size={20} />} />
            <StatCard label={t('processedEvents')} value={lifeEvents.filter(e => (e as any).status === 'processed').length} icon={<CheckCircle2 size={20} />} />
            <StatCard label={t('thisYear')} value={lifeEvents.filter(e => new Date((e as any).event_date).getFullYear() >= 2026).length} icon={<Calendar size={20} />} />
          </div>

          {lifeEventInsights.length > 0 && <AIAlertBanner insights={lifeEventInsights} className="mb-4" />}

          <Card padding="none" className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t('lifeEventsLog')}</CardTitle>
                <Button size="sm" onClick={() => setShowLifeEventModal(true)}><Plus size={14} /> {t('reportLifeEvent')}</Button>
              </div>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-divider bg-canvas">
                    <th className="tempo-th text-left px-6 py-3">{t('eventType')}</th>
                    <th className="tempo-th text-left px-4 py-3">{t('employeeName')}</th>
                    <th className="tempo-th text-center px-4 py-3">{t('eventDate')}</th>
                    <th className="tempo-th text-center px-4 py-3">{t('enrollmentDeadline')}</th>
                    <th className="tempo-th text-left px-4 py-3">{t('benefitChanges')}</th>
                    <th className="tempo-th text-center px-4 py-3">{tc('status')}</th>
                    <th className="tempo-th text-center px-4 py-3">{tc('actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {lifeEvents.length === 0 ? (
                    <tr><td colSpan={7} className="px-6 py-12 text-center text-sm text-t3">{t('noLifeEvents')}</td></tr>
                  ) : lifeEvents.map(event => {
                    const ev = event as any
                    const isOverdue = ev.status === 'pending' && new Date(ev.deadline) < new Date()
                    return (
                      <tr key={ev.id} className="hover:bg-canvas/50">
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-tempo-600">{lifeEventIcons[ev.type] || <Calendar size={16} />}</span>
                            <div>
                              <p className="text-sm font-medium text-t1 capitalize">{ev.type}</p>
                              {ev.notes && <p className="text-xs text-t3">{ev.notes}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-t2">{getEmployeeName(ev.employee_id)}</td>
                        <td className="px-4 py-3 text-sm text-t2 text-center">{ev.event_date}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-sm ${isOverdue ? 'text-error font-semibold' : 'text-t2'}`}>
                            {ev.deadline}
                          </span>
                          {isOverdue && (
                            <div className="flex items-center justify-center gap-1 text-xs text-error mt-0.5">
                              <AlertTriangle size={10} /> {t('overdue')}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {ev.benefit_changes && ev.benefit_changes.length > 0 ? (
                            <div className="space-y-0.5">
                              {ev.benefit_changes.map((change: string, i: number) => (
                                <p key={i} className="text-xs text-t2">{change}</p>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-t3">{t('noChangesYet')}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant={ev.status === 'processed' ? 'success' : isOverdue ? 'error' : 'warning'}>
                            {isOverdue ? t('overdue') : ev.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {ev.status === 'pending' && (
                            <Button size="sm" variant="ghost" onClick={() => updateLifeEvent(ev.id, { status: 'processed' })}>
                              {t('markProcessed')}
                            </Button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Life Event Type Summary */}
          <Card>
            <h3 className="text-sm font-semibold text-t1 mb-4">{t('eventTypeSummary')}</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['marriage', 'birth', 'adoption', 'divorce'].map(type => {
                const count = lifeEvents.filter(e => (e as any).type === type).length
                const pending = lifeEvents.filter(e => (e as any).type === type && (e as any).status === 'pending').length
                return (
                  <div key={type} className="bg-canvas rounded-lg p-4 text-center">
                    <div className="text-tempo-600 flex justify-center mb-2">{lifeEventIcons[type]}</div>
                    <p className="text-lg font-bold text-t1">{count}</p>
                    <p className="text-xs text-t3 capitalize">{type}</p>
                    {pending > 0 && (
                      <Badge variant="warning" className="mt-2">{pending} {t('pendingLabel')}</Badge>
                    )}
                  </div>
                )
              })}
            </div>
          </Card>
        </>
      )}

      {/* ============================================================ */}
      {/* TAB 6: COST CALCULATOR */}
      {/* ============================================================ */}
      {activeTab === 'cost-calculator' && (
        <>
          <Card className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Calculator size={18} className="text-tempo-600" />
              <h3 className="text-sm font-semibold text-t1">{t('benefitsCostCalculator')}</h3>
            </div>
            <p className="text-xs text-t3 mb-4">{t('costCalculatorDescription')}</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Select
                label={t('selectPlan')}
                value={calcPlanId}
                onChange={e => setCalcPlanId(e.target.value)}
                options={[
                  { value: '', label: t('choosePlan') },
                  ...activePlans.map(p => ({ value: p.id, label: `${p.name} (${p.type})` })),
                ]}
              />
              <Select
                label={t('coverageLevel')}
                value={calcCoverage}
                onChange={e => setCalcCoverage(e.target.value)}
                options={[
                  { value: 'employee_only', label: coverageLevelLabels.employee_only },
                  { value: 'employee_spouse', label: coverageLevelLabels.employee_spouse },
                  { value: 'employee_child', label: coverageLevelLabels.employee_child },
                  { value: 'family', label: coverageLevelLabels.family },
                ]}
              />
              <Input
                label={t('numberOfDependents')}
                type="number"
                min={0}
                max={10}
                value={calcDependents}
                onChange={e => setCalcDependents(Number(e.target.value))}
              />
            </div>

            {calcResult && calcPlan && (
              <div className="bg-canvas rounded-lg p-6">
                <h4 className="text-sm font-semibold text-t1 mb-1">{calcPlan.name}</h4>
                <p className="text-xs text-t3 mb-4">{calcPlan.provider} &middot; {coverageLevelLabels[calcCoverage]} &middot; {calcDependents} {t('dependentsLabel')}</p>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-white rounded-lg p-4 border border-border">
                    <p className="text-xs text-t3 mb-1">{t('employeeMonthly')}</p>
                    <p className="text-xl font-bold text-t1">${calcResult.empMonthly.toLocaleString()}</p>
                    <p className="text-xs text-t3">${calcResult.empAnnual.toLocaleString()}/{t('year')}</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-border">
                    <p className="text-xs text-t3 mb-1">{t('employerMonthly')}</p>
                    <p className="text-xl font-bold text-tempo-600">${calcResult.erMonthly.toLocaleString()}</p>
                    <p className="text-xs text-t3">${calcResult.erAnnual.toLocaleString()}/{t('year')}</p>
                  </div>
                  <div className="bg-tempo-50 rounded-lg p-4 border border-tempo-200">
                    <p className="text-xs text-tempo-600 mb-1">{t('totalMonthly')}</p>
                    <p className="text-xl font-bold text-tempo-700">${calcResult.totalMonthly.toLocaleString()}</p>
                    <p className="text-xs text-tempo-500">${calcResult.totalAnnual.toLocaleString()}/{t('year')}</p>
                  </div>
                </div>

                {/* Cost Split Visualization */}
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-t3">{t('costSplit')}</span>
                    <span className="text-xs text-t3">
                      {t('employerPays')} {Math.round((calcResult.erMonthly / calcResult.totalMonthly) * 100)}%
                    </span>
                  </div>
                  <div className="flex h-3 rounded-full overflow-hidden">
                    <div
                      className="bg-tempo-500 transition-all"
                      style={{ width: `${(calcResult.erMonthly / calcResult.totalMonthly) * 100}%` }}
                    />
                    <div
                      className="bg-amber-400 transition-all"
                      style={{ width: `${(calcResult.empMonthly / calcResult.totalMonthly) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[0.6rem] text-tempo-600">{t('employerLabel')}</span>
                    <span className="text-[0.6rem] text-amber-600">{t('employeeLabel')}</span>
                  </div>
                </div>
              </div>
            )}

            {!calcPlanId && (
              <div className="text-center py-8 text-sm text-t3">
                {t('selectPlanToCalculate')}
              </div>
            )}
          </Card>

          {/* Quick Comparison Table */}
          <Card padding="none">
            <CardHeader><CardTitle>{t('allPlansCostOverview')}</CardTitle></CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-divider bg-canvas">
                    <th className="tempo-th text-left px-6 py-3">{t('tablePlan')}</th>
                    <th className="tempo-th text-left px-4 py-3">{t('tableType')}</th>
                    <th className="tempo-th text-right px-4 py-3">{t('employeeOnly')}</th>
                    <th className="tempo-th text-right px-4 py-3">{t('withSpouse')}</th>
                    <th className="tempo-th text-right px-4 py-3">{t('familyCoverage')}</th>
                    <th className="tempo-th text-right px-4 py-3">{t('employerContrib')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {activePlans.map(plan => (
                    <tr key={plan.id} className="hover:bg-canvas/50">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-tempo-600">{iconMap[plan.type] || <Shield size={14} />}</span>
                          <span className="text-sm font-medium text-t1">{plan.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3"><Badge>{plan.type}</Badge></td>
                      <td className="px-4 py-3 text-sm text-t2 text-right">${plan.cost_employee}/mo</td>
                      <td className="px-4 py-3 text-sm text-t2 text-right">${Math.round(plan.cost_employee * 1.6)}/mo</td>
                      <td className="px-4 py-3 text-sm text-t2 text-right">${Math.round(plan.cost_employee * 2.2)}/mo</td>
                      <td className="px-4 py-3 text-sm text-tempo-600 text-right font-medium">${plan.cost_employer}/mo</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {/* ============================================================ */}
      {/* MODALS */}
      {/* ============================================================ */}

      {/* Add/Edit Plan Modal */}
      <Modal open={showPlanModal} onClose={() => setShowPlanModal(false)} title={editingPlan ? t('editPlanModal') : t('addPlanModal')}>
        <div className="space-y-4">
          <Input
            label={t('planName')} placeholder={t('planNamePlaceholder')}
            value={planForm.name} onChange={e => setPlanForm({ ...planForm, name: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label={tc('type')} value={planForm.type}
              onChange={e => setPlanForm({ ...planForm, type: e.target.value })}
              options={[
                { value: 'medical', label: t('typeMedical') },
                { value: 'dental', label: t('typeDental') },
                { value: 'vision', label: t('typeVision') },
                { value: 'life', label: t('typeLife') },
                { value: 'retirement', label: t('typeRetirement') },
              ]}
            />
            <Input
              label={t('providerLabel')} placeholder={t('providerPlaceholder')}
              value={planForm.provider} onChange={e => setPlanForm({ ...planForm, provider: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Input
              label={t('employeeCostMo')} type="number" min={0}
              value={planForm.cost_employee} onChange={e => setPlanForm({ ...planForm, cost_employee: Number(e.target.value) })}
            />
            <Input
              label={t('employerCostMo')} type="number" min={0}
              value={planForm.cost_employer} onChange={e => setPlanForm({ ...planForm, cost_employer: Number(e.target.value) })}
            />
            <Select
              label={tc('currency')} value={planForm.currency}
              onChange={e => setPlanForm({ ...planForm, currency: e.target.value })}
              options={[
                { value: 'USD', label: tc('currencyUSD') },
                { value: 'NGN', label: tc('currencyNGN') },
                { value: 'GHS', label: tc('currencyGHS') },
                { value: 'KES', label: tc('currencyKES') },
                { value: 'XOF', label: tc('currencyXOF') },
              ]}
            />
          </div>
          <Textarea
            label={tc('description')} placeholder={t('descriptionPlaceholder')} rows={3}
            value={planForm.description} onChange={e => setPlanForm({ ...planForm, description: e.target.value })}
          />
          <label className="flex items-center gap-2 text-sm text-t2">
            <input type="checkbox" checked={planForm.is_active} onChange={e => setPlanForm({ ...planForm, is_active: e.target.checked })} className="rounded border-divider" />
            {t('planIsActive')}
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowPlanModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitPlan}>{editingPlan ? tc('saveChanges') : t('addPlan')}</Button>
          </div>
        </div>
      </Modal>

      {/* New Enrollment Modal */}
      <Modal open={showEnrollmentModal} onClose={() => setShowEnrollmentModal(false)} title={t('newEnrollment')}>
        <div className="space-y-4">
          <Select
            label={t('employeeName')} value={enrollForm.employee_id}
            onChange={e => setEnrollForm({ ...enrollForm, employee_id: e.target.value })}
            options={[
              { value: '', label: t('selectEmployee') },
              ...employees.slice(0, 30).map(emp => ({ value: emp.id, label: emp.profile.full_name })),
            ]}
          />
          <Select
            label={t('tablePlan')} value={enrollForm.plan_id}
            onChange={e => setEnrollForm({ ...enrollForm, plan_id: e.target.value })}
            options={[
              { value: '', label: t('selectPlanOption') },
              ...activePlans.map(p => ({ value: p.id, label: `${p.name} — $${p.cost_employee + p.cost_employer}/mo` })),
            ]}
          />
          <Select
            label={t('coverageLevel')} value={enrollForm.coverage_level}
            onChange={e => setEnrollForm({ ...enrollForm, coverage_level: e.target.value })}
            options={[
              { value: 'employee_only', label: coverageLevelLabels.employee_only },
              { value: 'employee_spouse', label: coverageLevelLabels.employee_spouse },
              { value: 'employee_child', label: coverageLevelLabels.employee_child },
              { value: 'family', label: coverageLevelLabels.family },
            ]}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowEnrollmentModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitEnrollment}>{t('enrollEmployee')}</Button>
          </div>
        </div>
      </Modal>

      {/* Add Dependent Modal */}
      <Modal open={showDependentModal} onClose={() => setShowDependentModal(false)} title={t('addDependent')}>
        <div className="space-y-4">
          <Select
            label={t('employeeName')} value={depForm.employee_id}
            onChange={e => setDepForm({ ...depForm, employee_id: e.target.value })}
            options={[
              { value: '', label: t('selectEmployee') },
              ...employees.slice(0, 30).map(emp => ({ value: emp.id, label: emp.profile.full_name })),
            ]}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t('firstName')} value={depForm.first_name}
              onChange={e => setDepForm({ ...depForm, first_name: e.target.value })}
            />
            <Input
              label={t('lastName')} value={depForm.last_name}
              onChange={e => setDepForm({ ...depForm, last_name: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Select
              label={t('relationship')} value={depForm.relationship}
              onChange={e => setDepForm({ ...depForm, relationship: e.target.value })}
              options={[
                { value: 'spouse', label: t('relationSpouse') },
                { value: 'child', label: t('relationChild') },
                { value: 'domestic_partner', label: t('relationDomesticPartner') },
              ]}
            />
            <Input
              label={t('dateOfBirth')} type="date" value={depForm.date_of_birth}
              onChange={e => setDepForm({ ...depForm, date_of_birth: e.target.value })}
            />
            <Select
              label={t('gender')} value={depForm.gender}
              onChange={e => setDepForm({ ...depForm, gender: e.target.value })}
              options={[
                { value: 'male', label: t('genderMale') },
                { value: 'female', label: t('genderFemale') },
              ]}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowDependentModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitDependent}>{t('addDependent')}</Button>
          </div>
        </div>
      </Modal>

      {/* Report Life Event Modal */}
      <Modal open={showLifeEventModal} onClose={() => setShowLifeEventModal(false)} title={t('reportLifeEvent')}>
        <div className="space-y-4">
          <Select
            label={t('employeeName')} value={lifeEventForm.employee_id}
            onChange={e => setLifeEventForm({ ...lifeEventForm, employee_id: e.target.value })}
            options={[
              { value: '', label: t('selectEmployee') },
              ...employees.slice(0, 30).map(emp => ({ value: emp.id, label: emp.profile.full_name })),
            ]}
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label={t('eventType')} value={lifeEventForm.type}
              onChange={e => setLifeEventForm({ ...lifeEventForm, type: e.target.value })}
              options={[
                { value: 'marriage', label: t('eventMarriage') },
                { value: 'birth', label: t('eventBirth') },
                { value: 'adoption', label: t('eventAdoption') },
                { value: 'divorce', label: t('eventDivorce') },
                { value: 'death', label: t('eventDeath') },
              ]}
            />
            <Input
              label={t('eventDate')} type="date" value={lifeEventForm.event_date}
              onChange={e => setLifeEventForm({ ...lifeEventForm, event_date: e.target.value })}
            />
          </div>
          <Textarea
            label={t('notes')} placeholder={t('lifeEventNotesPlaceholder')} rows={3}
            value={lifeEventForm.notes} onChange={e => setLifeEventForm({ ...lifeEventForm, notes: e.target.value })}
          />
          <div className="bg-canvas rounded-lg p-3">
            <p className="text-xs text-t3">{t('lifeEventDeadlineNote')}</p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowLifeEventModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitLifeEvent}>{t('submitLifeEvent')}</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
