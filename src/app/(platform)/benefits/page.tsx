'use client'

import { useState, useMemo, useEffect } from 'react'
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
import { TempoBarChart, TempoDonutChart, CHART_COLORS, CHART_SERIES } from '@/components/ui/charts'
import {
  Shield, Heart, Eye, Wallet, Plus, Pencil, Users, Baby, Calendar,
  BarChart3, Calculator, ArrowRightLeft, Clock, CheckCircle2, AlertTriangle,
  UserPlus, HeartHandshake, Scale, Globe, Building2, Search, Layers, UserCheck, ArrowRight, CheckCircle,
  FileText, Bell, DollarSign, Landmark, CreditCard, Receipt, Timer, Send,
  Stethoscope, Car, ParkingCircle, TrendingUp, CircleDollarSign,
} from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import { useTempo } from '@/lib/store'
import { cn } from '@/lib/utils/cn'
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
  dental: <Stethoscope size={20} />,
  hsa: <Landmark size={20} />,
  fsa: <CreditCard size={20} />,
  commuter: <Car size={20} />,
  disability: <Shield size={20} />,
  voluntary: <Heart size={20} />,
  wellness: <Heart size={20} />,
}

const flexAccountLabels: Record<string, string> = {
  hsa: 'Health Savings Account (HSA)',
  fsa_health: 'Healthcare FSA',
  fsa_dependent: 'Dependent Care FSA',
  commuter_transit: 'Commuter Transit',
  commuter_parking: 'Commuter Parking',
}

const flexAccountIcons: Record<string, React.ReactNode> = {
  hsa: <Landmark size={20} />,
  fsa_health: <CreditCard size={20} />,
  fsa_dependent: <Baby size={20} />,
  commuter_transit: <Car size={20} />,
  commuter_parking: <ParkingCircle size={20} />,
}

const irsLimits2026: Record<string, number> = {
  hsa: 4300, // individual
  hsa_family: 8550,
  fsa_health: 3300,
  fsa_dependent: 5000,
  commuter_transit: 325,
  commuter_parking: 325,
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
    org,
    benefitPlans, employees, departments,
    addBenefitPlan, updateBenefitPlan,
    benefitEnrollments, addBenefitEnrollment, updateBenefitEnrollment,
    benefitDependents, addBenefitDependent, updateBenefitDependent,
    lifeEvents, addLifeEvent, updateLifeEvent,
    openEnrollmentPeriods, addOpenEnrollmentPeriod, updateOpenEnrollmentPeriod,
    cobraEvents, addCobraEvent, updateCobraEvent,
    acaTracking, addAcaTracking, updateAcaTracking,
    flexBenefitAccounts, addFlexBenefitAccount, updateFlexBenefitAccount,
    flexBenefitTransactions, addFlexBenefitTransaction, updateFlexBenefitTransaction,
    getEmployeeName, getDepartmentName, addToast,
    ensureModulesLoaded,
  } = useTempo()

  useEffect(() => {
    ensureModulesLoaded?.(['benefitPlans', 'benefitEnrollments', 'benefitDependents', 'lifeEvents', 'openEnrollmentPeriods', 'cobraEvents', 'acaTracking', 'flexBenefitAccounts', 'flexBenefitTransactions', 'employees', 'departments'])
  }, [ensureModulesLoaded])

  async function carrierAPI(action: string, data: Record<string, any> = {}) {
    const res = await fetch('/api/carrier-integrations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-org-id': org.id },
      body: JSON.stringify({ action, ...data }),
    })
    if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || 'Request failed') }
    return res.json()
  }

  async function benefitsAPI(action: string, data: Record<string, any> = {}) {
    const res = await fetch('/api/benefits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-org-id': org.id },
      body: JSON.stringify({ action, ...data }),
    })
    if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || 'Request failed') }
    return res.json()
  }

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
    { id: 'open-enrollment', label: 'Open Enrollment', count: openEnrollmentPeriods.filter(p => (p as any).status === 'active').length },
    { id: 'flex-benefits', label: 'Flex Benefits', count: flexBenefitAccounts.length },
    { id: 'cobra', label: 'COBRA', count: cobraEvents.filter(e => (e as any).status !== 'declined' && (e as any).status !== 'expired').length },
    { id: 'aca-compliance', label: 'ACA Compliance', count: acaTracking.filter(a => (a as any).form_1095_status === 'pending').length },
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
  const [showOEPModal, setShowOEPModal] = useState(false)
  const [showCobraModal, setShowCobraModal] = useState(false)
  const [showFlexAccountModal, setShowFlexAccountModal] = useState(false)
  const [showFlexExpenseModal, setShowFlexExpenseModal] = useState(false)
  const [acaTaxYearFilter, setAcaTaxYearFilter] = useState<number | 'all'>('all')

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
  const [oepForm, setOepForm] = useState({
    name: '', start_date: '', end_date: '', plan_ids: [] as string[],
  })
  const [cobraForm, setCobraForm] = useState({
    employee_id: '', qualifying_event: 'termination' as string,
    event_date: '', notification_date: '', coverage_end_date: '',
    monthly_premium: 0,
  })
  const [flexAccountForm, setFlexAccountForm] = useState({
    employee_id: '', account_type: 'hsa' as string,
    annual_election: 0,
  })
  const [flexExpenseForm, setFlexExpenseForm] = useState({
    account_id: '', amount: 0, description: '', receipt_date: '',
  })

  // Bulk enrollment state
  const [showBulkEnrollModal, setShowBulkEnrollModal] = useState(false)
  const [bulkEnrollStep, setBulkEnrollStep] = useState<1 | 2>(1)
  const [bulkEnrollMode, setBulkEnrollMode] = useState<'individual' | 'department' | 'country' | 'level' | 'all'>('individual')
  const [bulkEnrollSearch, setBulkEnrollSearch] = useState('')
  const [bulkSelectedEmpIds, setBulkSelectedEmpIds] = useState<Set<string>>(new Set())
  const [bulkSelectedDepts, setBulkSelectedDepts] = useState<Set<string>>(new Set())
  const [bulkSelectedCountries, setBulkSelectedCountries] = useState<Set<string>>(new Set())
  const [bulkSelectedLevels, setBulkSelectedLevels] = useState<Set<string>>(new Set())
  const [bulkPlanId, setBulkPlanId] = useState('')
  const [bulkCoverage, setBulkCoverage] = useState('employee_only')
  const [bulkPlanSearch, setBulkPlanSearch] = useState('')

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

  const uniqueCountries = useMemo(() => [...new Set(employees.map(e => e.country))].filter(Boolean).sort(), [employees])
  const uniqueLevels = useMemo(() => [...new Set(employees.map(e => e.level))].filter(Boolean), [employees])

  const bulkTargetEmployees = useMemo(() => {
    switch (bulkEnrollMode) {
      case 'individual':
        return employees.filter(emp => {
          if (!bulkEnrollSearch) return true
          const q = bulkEnrollSearch.toLowerCase()
          const name = emp.profile?.full_name?.toLowerCase() || ''
          const email = emp.profile?.email?.toLowerCase() || ''
          return name.includes(q) || email.includes(q)
        })
      case 'department':
        return bulkSelectedDepts.size > 0 ? employees.filter(e => bulkSelectedDepts.has(e.department_id)) : []
      case 'country':
        return bulkSelectedCountries.size > 0 ? employees.filter(e => bulkSelectedCountries.has(e.country)) : []
      case 'level':
        return bulkSelectedLevels.size > 0 ? employees.filter(e => bulkSelectedLevels.has(e.level)) : []
      case 'all':
        return employees
      default: return []
    }
  }, [employees, bulkEnrollMode, bulkEnrollSearch, bulkSelectedDepts, bulkSelectedCountries, bulkSelectedLevels])

  const bulkSelectedEmployees = useMemo(() => {
    if (bulkEnrollMode === 'individual') return employees.filter(e => bulkSelectedEmpIds.has(e.id))
    return bulkTargetEmployees
  }, [bulkEnrollMode, employees, bulkSelectedEmpIds, bulkTargetEmployees])

  const bulkAlreadyEnrolledIds = useMemo(() => {
    if (!bulkPlanId) return new Set<string>()
    return new Set(benefitEnrollments.filter(e => (e as any).plan_id === bulkPlanId && (e as any).status === 'active').map(e => (e as any).employee_id))
  }, [benefitEnrollments, bulkPlanId])

  const bulkNewEnrollees = useMemo(() => bulkSelectedEmployees.filter(e => !bulkAlreadyEnrolledIds.has(e.id)), [bulkSelectedEmployees, bulkAlreadyEnrolledIds])
  const bulkSkippedEnrollees = useMemo(() => bulkSelectedEmployees.filter(e => bulkAlreadyEnrolledIds.has(e.id)), [bulkSelectedEmployees, bulkAlreadyEnrolledIds])

  const filteredBulkPlans = useMemo(() => {
    if (!bulkPlanSearch) return activePlans
    const q = bulkPlanSearch.toLowerCase()
    return activePlans.filter(p => p.name.toLowerCase().includes(q) || p.type.toLowerCase().includes(q))
  }, [activePlans, bulkPlanSearch])

  const bulkCostImpact = useMemo(() => {
    if (!bulkPlanId) return null
    const plan = benefitPlans.find(p => p.id === bulkPlanId)
    if (!plan) return null
    const multiplier = coverageLevelMultiplier[bulkCoverage] || 1
    const monthlyPerEmp = Math.round(plan.cost_employer * multiplier)
    return { monthlyPerEmp, totalMonthly: monthlyPerEmp * bulkNewEnrollees.length, totalAnnual: monthlyPerEmp * bulkNewEnrollees.length * 12 }
  }, [bulkPlanId, benefitPlans, bulkCoverage, bulkNewEnrollees])

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

  async function submitPlan() {
    if (!planForm.name || !planForm.provider) return
    const data = {
      name: planForm.name, type: planForm.type, provider: planForm.provider,
      cost_employee: Number(planForm.cost_employee) || 0, cost_employer: Number(planForm.cost_employer) || 0,
      description: planForm.description, is_active: planForm.is_active, currency: planForm.currency,
    }
    try {
      await benefitsAPI(editingPlan ? 'update-plan' : 'create-plan', editingPlan ? { id: editingPlan, ...data } : data)
    } catch { /* fallback to store-only */ }
    if (editingPlan) { updateBenefitPlan(editingPlan, data) } else { addBenefitPlan(data) }
    setShowPlanModal(false)
  }

  async function togglePlanStatus(id: string, currentStatus: boolean) {
    try {
      await benefitsAPI('update-plan', { id, is_active: !currentStatus })
    } catch { /* fallback to store-only */ }
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
  async function submitEnrollment() {
    if (!enrollForm.employee_id || !enrollForm.plan_id) return
    const data = {
      employee_id: enrollForm.employee_id, plan_id: enrollForm.plan_id,
      coverage_level: enrollForm.coverage_level, status: 'active',
      enrolled_date: new Date().toISOString().split('T')[0],
      effective_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    }
    try {
      await carrierAPI('enroll', data)
    } catch { /* fallback to store-only */ }
    addBenefitEnrollment(data)
    setShowEnrollmentModal(false)
    setEnrollForm({ employee_id: '', plan_id: '', coverage_level: 'employee_only' })
  }

  // ---- Dependent CRUD ----
  async function submitDependent() {
    if (!depForm.employee_id || !depForm.first_name || !depForm.last_name) return
    try {
      await benefitsAPI('add-dependent', { ...depForm })
    } catch { /* fallback to store-only */ }
    addBenefitDependent({ ...depForm })
    setShowDependentModal(false)
    setDepForm({ employee_id: '', first_name: '', last_name: '', relationship: 'spouse', date_of_birth: '', gender: 'male', plan_ids: [] })
  }

  // ---- Life Event CRUD ----
  async function submitLifeEvent() {
    if (!lifeEventForm.employee_id || !lifeEventForm.event_date) return
    const deadline = new Date(new Date(lifeEventForm.event_date).getTime() + 30 * 86400000).toISOString().split('T')[0]
    const data = {
      employee_id: lifeEventForm.employee_id, type: lifeEventForm.type,
      event_date: lifeEventForm.event_date, reported_date: new Date().toISOString().split('T')[0],
      deadline, status: 'pending', notes: lifeEventForm.notes, benefit_changes: [],
    }
    try {
      await benefitsAPI('add-life-event', data)
    } catch { /* fallback to store-only */ }
    addLifeEvent(data)
    setShowLifeEventModal(false)
    setLifeEventForm({ employee_id: '', type: 'marriage', event_date: '', notes: '' })
  }

  // ---- Open Enrollment CRUD ----
  async function submitOEP() {
    if (!oepForm.name || !oepForm.start_date || !oepForm.end_date) return
    const data = {
      name: oepForm.name,
      start_date: oepForm.start_date,
      end_date: oepForm.end_date,
      status: new Date(oepForm.start_date) <= new Date() && new Date(oepForm.end_date) >= new Date() ? 'active' : 'upcoming',
      eligible_plan_ids: oepForm.plan_ids,
      enrolled_count: 0,
      eligible_count: employees.length,
    }
    try {
      await benefitsAPI('create-open-enrollment', data)
    } catch { /* fallback to store-only */ }
    addOpenEnrollmentPeriod(data)
    setShowOEPModal(false)
    setOepForm({ name: '', start_date: '', end_date: '', plan_ids: [] })
  }

  // ---- COBRA CRUD ----
  async function submitCobra() {
    if (!cobraForm.employee_id || !cobraForm.event_date) return
    const notifDeadline = new Date(new Date(cobraForm.event_date).getTime() + 14 * 86400000).toISOString().split('T')[0]
    const electionDeadline = new Date(new Date(cobraForm.event_date).getTime() + 60 * 86400000).toISOString().split('T')[0]
    const coverageEnd = cobraForm.coverage_end_date || new Date(new Date(cobraForm.event_date).getTime() + 547 * 86400000).toISOString().split('T')[0]
    const data = {
      employee_id: cobraForm.employee_id,
      qualifying_event: cobraForm.qualifying_event,
      event_date: cobraForm.event_date,
      notification_date: cobraForm.notification_date || new Date().toISOString().split('T')[0],
      notification_deadline: notifDeadline,
      election_deadline: electionDeadline,
      coverage_end_date: coverageEnd,
      monthly_premium: Number(cobraForm.monthly_premium) || 0,
      status: 'pending_notification',
    }
    try {
      await carrierAPI('cobra-notify', data)
    } catch { /* fallback to store-only */ }
    addCobraEvent(data)
    setShowCobraModal(false)
    setCobraForm({ employee_id: '', qualifying_event: 'termination', event_date: '', notification_date: '', coverage_end_date: '', monthly_premium: 0 })
  }

  // ---- Flex Account CRUD ----
  async function submitFlexAccount() {
    if (!flexAccountForm.employee_id || !flexAccountForm.account_type) return
    const limit = irsLimits2026[flexAccountForm.account_type] || 3300
    const data = {
      employee_id: flexAccountForm.employee_id,
      account_type: flexAccountForm.account_type,
      annual_election: Math.min(Number(flexAccountForm.annual_election) || 0, limit),
      current_balance: 0,
      ytd_contributions: 0,
      ytd_expenses: 0,
      status: 'active',
    }
    try {
      await benefitsAPI('create-flex-account', data)
    } catch { /* fallback to store-only */ }
    addFlexBenefitAccount(data)
    setShowFlexAccountModal(false)
    setFlexAccountForm({ employee_id: '', account_type: 'hsa', annual_election: 0 })
  }

  // ---- Flex Expense CRUD ----
  async function submitFlexExpense() {
    if (!flexExpenseForm.account_id || !flexExpenseForm.amount) return
    const data = {
      account_id: flexExpenseForm.account_id,
      type: 'expense',
      amount: Number(flexExpenseForm.amount) || 0,
      description: flexExpenseForm.description,
      transaction_date: flexExpenseForm.receipt_date || new Date().toISOString().split('T')[0],
      status: 'pending',
    }
    try {
      await benefitsAPI('submit-flex-expense', data)
    } catch { /* fallback to store-only */ }
    addFlexBenefitTransaction(data)
    setShowFlexExpenseModal(false)
    setFlexExpenseForm({ account_id: '', amount: 0, description: '', receipt_date: '' })
  }

  // ---- Bulk Enrollment ----
  function toggleBulkSet<T>(set: Set<T>, setter: React.Dispatch<React.SetStateAction<Set<T>>>, item: T) {
    setter(prev => { const next = new Set(prev); if (next.has(item)) next.delete(item); else next.add(item); return next })
  }

  function resetBulkEnroll() {
    setShowBulkEnrollModal(false); setBulkEnrollStep(1); setBulkEnrollMode('individual')
    setBulkEnrollSearch(''); setBulkSelectedEmpIds(new Set()); setBulkSelectedDepts(new Set())
    setBulkSelectedCountries(new Set()); setBulkSelectedLevels(new Set())
    setBulkPlanId(''); setBulkCoverage('employee_only'); setBulkPlanSearch('')
  }

  async function submitBulkEnroll() {
    if (!bulkPlanId || bulkNewEnrollees.length === 0) return
    const enrollments = bulkNewEnrollees.map(emp => ({
      employee_id: emp.id, plan_id: bulkPlanId,
      coverage_level: bulkCoverage, status: 'active',
      enrolled_date: new Date().toISOString().split('T')[0],
      effective_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    }))
    try {
      await carrierAPI('bulk-enroll', { enrollments })
    } catch { /* fallback to store-only */ }
    enrollments.forEach(data => addBenefitEnrollment(data))
    const planName = benefitPlans.find(p => p.id === bulkPlanId)?.name || ''
    addToast(`Successfully enrolled ${bulkNewEnrollees.length} employees in ${planName}`)
    resetBulkEnroll()
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
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => setShowBulkEnrollModal(true)}>
              <Users size={14} /> Bulk Enroll
            </Button>
            <Button size="sm" onClick={openNewPlan}>
              <Plus size={14} /> {t('addPlan')}
            </Button>
          </div>
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
                      <td className="px-6 py-3 text-xs font-medium text-t1">{plan.name}</td>
                      <td className="px-4 py-3"><Badge>{plan.type}</Badge></td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={plan.is_active ? 'success' : 'default'}>{plan.is_active ? tc('active') : tc('inactive')}</Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-t2 text-right">{getPlanEnrollCount(plan.id)}</td>
                      <td className="px-4 py-3 text-xs text-t2 text-right">${plan.cost_employee}</td>
                      <td className="px-4 py-3 text-xs text-t2 text-right">${plan.cost_employer}</td>
                      <td className="px-4 py-3 text-xs font-medium text-t1 text-right">${plan.cost_employee + plan.cost_employer}</td>
                      <td className="px-4 py-3 text-xs font-semibold text-t1 text-right">
                        ${((plan.cost_employee + plan.cost_employer) * getPlanEnrollCount(plan.id) * 12).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  {benefitPlans.length > 0 && (
                    <tr className="bg-canvas font-semibold">
                      <td className="px-6 py-3 text-xs text-t1" colSpan={4}>{tc('total')}</td>
                      <td className="px-4 py-3 text-xs text-t1 text-right">${benefitPlans.reduce((a, p) => a + p.cost_employee, 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-xs text-t1 text-right">${benefitPlans.reduce((a, p) => a + p.cost_employer, 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-xs text-t1 text-right">${benefitPlans.reduce((a, p) => a + p.cost_employee + p.cost_employer, 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-xs text-t1 text-right">
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
                    <tr><td colSpan={6} className="px-6 py-12 text-center text-xs text-t3">{t('noEnrollments')}</td></tr>
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
                        <td className="px-4 py-3 text-xs text-t2 text-center">{e.effective_date}</td>
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
                <TempoBarChart
                  data={benefitPlans.map(p => ({
                    name: p.name.length > 12 ? p.name.substring(0, 12) + '...' : p.name,
                    count: getPlanEnrollCount(p.id),
                  }))}
                  bars={[{ dataKey: 'count', name: 'Enrolled', color: CHART_COLORS.primary }]}
                  xKey="name"
                  height={140}
                  showGrid={false}
                  showYAxis={false}
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
                return items.length > 0 ? (
                  <TempoDonutChart data={items.map(([label, value], i) => ({
                    name: coverageLevelLabels[label] || label,
                    value,
                    color: CHART_SERIES[i % CHART_SERIES.length],
                  }))} height={180} />
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
                    <tr><td colSpan={5} className="px-6 py-12 text-center text-xs text-t3">{t('noDependents')}</td></tr>
                  ) : benefitDependents.map(dep => {
                    const d = dep as any
                    return (
                      <tr key={d.id} className="hover:bg-canvas/50">
                        <td className="px-6 py-3">
                          <p className="text-sm font-medium text-t1">{d.first_name} {d.last_name}</p>
                          <p className="text-xs text-t3 capitalize">{d.gender}</p>
                        </td>
                        <td className="px-4 py-3 text-xs text-t2">{getEmployeeName(d.employee_id)}</td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant={d.relationship === 'spouse' ? 'info' : d.relationship === 'child' ? 'success' : 'default'}>
                            {d.relationship}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-xs text-t2 text-center">{d.date_of_birth}</td>
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
                  <TempoBarChart
                    data={enrollTrends.byType.map(item => ({
                      name: item.type.charAt(0).toUpperCase() + item.type.slice(1),
                      count: item.count,
                    }))}
                    bars={[{ dataKey: 'count', name: 'Enrollments', color: CHART_COLORS.primary }]}
                    xKey="name"
                    height={140}
                    showGrid={false}
                    showYAxis={false}
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
                return items.length > 0 ? (
                  <>
                    <TempoDonutChart data={items.map(([label, d], i) => ({
                      name: label.charAt(0).toUpperCase() + label.slice(1),
                      value: d.employer + d.employee,
                      color: CHART_SERIES[i % CHART_SERIES.length],
                    }))} height={180} />
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
                    <tr><td colSpan={7} className="px-6 py-12 text-center text-xs text-t3">{t('noLifeEvents')}</td></tr>
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
                        <td className="px-4 py-3 text-xs text-t2">{getEmployeeName(ev.employee_id)}</td>
                        <td className="px-4 py-3 text-xs text-t2 text-center">{ev.event_date}</td>
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
                      className="bg-gray-400 transition-all"
                      style={{ width: `${(calcResult.empMonthly / calcResult.totalMonthly) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[0.6rem] text-tempo-600">{t('employerLabel')}</span>
                    <span className="text-[0.6rem] text-gray-500">{t('employeeLabel')}</span>
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
                      <td className="px-4 py-3 text-xs text-t2 text-right">${plan.cost_employee}/mo</td>
                      <td className="px-4 py-3 text-xs text-t2 text-right">${Math.round(plan.cost_employee * 1.6)}/mo</td>
                      <td className="px-4 py-3 text-xs text-t2 text-right">${Math.round(plan.cost_employee * 2.2)}/mo</td>
                      <td className="px-4 py-3 text-xs text-tempo-600 text-right font-medium">${plan.cost_employer}/mo</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {/* ============================================================ */}
      {/* TAB: OPEN ENROLLMENT */}
      {/* ============================================================ */}
      {activeTab === 'open-enrollment' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard label="Active Periods" value={openEnrollmentPeriods.filter(p => (p as any).status === 'active').length} icon={<Calendar size={20} />} />
            <StatCard label="Upcoming Periods" value={openEnrollmentPeriods.filter(p => (p as any).status === 'upcoming').length} icon={<Clock size={20} />} />
            <StatCard label="Total Eligible" value={employees.length} icon={<Users size={20} />} />
            <StatCard
              label="Enrollment Progress"
              value={`${openEnrollmentPeriods.filter(p => (p as any).status === 'active').reduce((a, p) => a + ((p as any).enrolled_count || 0), 0)}/${openEnrollmentPeriods.filter(p => (p as any).status === 'active').reduce((a, p) => a + ((p as any).eligible_count || employees.length), 0)}`}
              icon={<CheckCircle2 size={20} />}
            />
          </div>

          {/* Active / Upcoming Enrollment Periods */}
          {openEnrollmentPeriods.length === 0 ? (
            <Card className="text-center py-12">
              <Calendar size={32} className="mx-auto text-t3 mb-3" />
              <p className="text-sm text-t3 mb-4">No enrollment periods configured</p>
              <Button size="sm" onClick={() => setShowOEPModal(true)}><Plus size={14} /> Create Enrollment Period</Button>
            </Card>
          ) : (
            <div className="space-y-4 mb-6">
              {openEnrollmentPeriods.map(period => {
                const p = period as any
                const startDate = new Date(p.start_date)
                const endDate = new Date(p.end_date)
                const now = new Date()
                const isActive = p.status === 'active'
                const isUpcoming = p.status === 'upcoming'
                const daysRemaining = isActive ? Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / 86400000)) : isUpcoming ? Math.ceil((startDate.getTime() - now.getTime()) / 86400000) : 0
                const progressPct = p.eligible_count > 0 ? Math.round(((p.enrolled_count || 0) / p.eligible_count) * 100) : 0
                return (
                  <Card key={p.id}>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-semibold text-t1">{p.name}</h3>
                          <Badge variant={isActive ? 'success' : isUpcoming ? 'info' : 'default'}>{p.status}</Badge>
                        </div>
                        <p className="text-xs text-t3">{p.start_date} to {p.end_date}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {isActive && (
                          <div className="flex items-center gap-1.5 bg-amber-50 text-amber-700 px-3 py-1.5 rounded-lg">
                            <Timer size={14} />
                            <span className="text-xs font-semibold">{daysRemaining} days remaining</span>
                          </div>
                        )}
                        {isUpcoming && (
                          <div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg">
                            <Clock size={14} />
                            <span className="text-xs font-semibold">Starts in {daysRemaining} days</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {isActive && (
                      <>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-t3">Enrollment Progress</span>
                          <span className="text-t2 font-medium">{p.enrolled_count || 0} / {p.eligible_count || employees.length} ({progressPct}%)</span>
                        </div>
                        <Progress value={progressPct} color={progressPct >= 80 ? 'success' : progressPct >= 50 ? 'warning' : 'error'} />
                        <div className="flex justify-between mt-4">
                          <Button size="sm" variant="secondary" onClick={() => {
                            addToast(`Reminder sent to ${(p.eligible_count || employees.length) - (p.enrolled_count || 0)} employees`)
                          }}>
                            <Send size={14} /> Send Reminder
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => updateOpenEnrollmentPeriod(p.id, { status: 'closed' })}>
                            Close Enrollment
                          </Button>
                        </div>
                      </>
                    )}

                    {/* Eligible Plans */}
                    {(p.eligible_plan_ids || []).length > 0 && (
                      <div className="mt-4 pt-4 border-t border-divider">
                        <p className="text-xs text-t3 mb-2">Eligible Plans</p>
                        <div className="flex flex-wrap gap-2">
                          {(p.eligible_plan_ids || []).map((pid: string) => {
                            const plan = benefitPlans.find(pl => pl.id === pid)
                            return plan ? (
                              <div key={pid} className="flex items-center gap-1.5 bg-canvas rounded-lg px-2.5 py-1.5">
                                <span className="text-tempo-600">{iconMap[plan.type] || <Shield size={14} />}</span>
                                <span className="text-xs font-medium text-t1">{plan.name}</span>
                              </div>
                            ) : null
                          })}
                        </div>
                      </div>
                    )}
                  </Card>
                )
              })}
            </div>
          )}

          {/* Employee Enrollment Status Table */}
          <Card padding="none">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Employee Enrollment Status</CardTitle>
                <Button size="sm" onClick={() => setShowOEPModal(true)}><Plus size={14} /> New Period</Button>
              </div>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-divider bg-canvas">
                    <th className="tempo-th text-left px-6 py-3">Employee</th>
                    <th className="tempo-th text-center px-4 py-3">Active Plans</th>
                    <th className="tempo-th text-center px-4 py-3">Dependents</th>
                    <th className="tempo-th text-center px-4 py-3">Coverage</th>
                    <th className="tempo-th text-center px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {employees.slice(0, 20).map(emp => {
                    const empEnrollments = benefitEnrollments.filter(e => (e as any).employee_id === emp.id && (e as any).status === 'active')
                    const depCount = getEmployeeDependentCount(emp.id)
                    const isEnrolled = empEnrollments.length > 0
                    return (
                      <tr key={emp.id} className="hover:bg-canvas/50">
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar name={emp.profile?.full_name || ''} size="sm" />
                            <div>
                              <p className="text-sm font-medium text-t1">{emp.profile?.full_name}</p>
                              <p className="text-xs text-t3">{getDepartmentName(emp.department_id)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-t2 text-center">{empEnrollments.length}</td>
                        <td className="px-4 py-3 text-xs text-t2 text-center">{depCount}</td>
                        <td className="px-4 py-3 text-center">
                          {empEnrollments.length > 0 ? (
                            <div className="flex flex-wrap gap-1 justify-center">
                              {empEnrollments.slice(0, 2).map(e => {
                                const plan = benefitPlans.find(p => p.id === (e as any).plan_id)
                                return <Badge key={(e as any).id} variant="default">{plan?.name || 'Plan'}</Badge>
                              })}
                              {empEnrollments.length > 2 && <Badge variant="default">+{empEnrollments.length - 2}</Badge>}
                            </div>
                          ) : <span className="text-xs text-t3">None</span>}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant={isEnrolled ? 'success' : 'warning'}>
                            {isEnrolled ? 'Enrolled' : 'Not Enrolled'}
                          </Badge>
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
      {/* TAB: FLEX BENEFITS (HSA/FSA/COMMUTER) */}
      {/* ============================================================ */}
      {activeTab === 'flex-benefits' && (
        <>
          {/* Account Overview Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard label="Active Accounts" value={flexBenefitAccounts.filter(a => (a as any).status === 'active').length} icon={<Landmark size={20} />} />
            <StatCard
              label="Total Balance"
              value={`$${flexBenefitAccounts.reduce((a, acc) => a + ((acc as any).current_balance || 0), 0).toLocaleString()}`}
              icon={<DollarSign size={20} />}
            />
            <StatCard
              label="YTD Contributions"
              value={`$${flexBenefitAccounts.reduce((a, acc) => a + ((acc as any).ytd_contributions || 0), 0).toLocaleString()}`}
              icon={<TrendingUp size={20} />}
              changeType="positive"
            />
            <StatCard
              label="Pending Expenses"
              value={flexBenefitTransactions.filter(t => (t as any).type === 'expense' && (t as any).status === 'pending').length}
              icon={<Receipt size={20} />}
              change="Awaiting approval"
              changeType="neutral"
            />
          </div>

          {/* Account Cards by Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {(['hsa', 'fsa_health', 'fsa_dependent', 'commuter_transit', 'commuter_parking'] as const).map(type => {
              const accounts = flexBenefitAccounts.filter(a => (a as any).account_type === type && (a as any).status === 'active')
              if (accounts.length === 0) return null
              const totalBalance = accounts.reduce((a, acc) => a + ((acc as any).current_balance || 0), 0)
              const totalElection = accounts.reduce((a, acc) => a + ((acc as any).annual_election || 0), 0)
              const totalContrib = accounts.reduce((a, acc) => a + ((acc as any).ytd_contributions || 0), 0)
              const totalExpenses = accounts.reduce((a, acc) => a + ((acc as any).ytd_expenses || 0), 0)
              const limit = irsLimits2026[type] || 0
              return (
                <Card key={type}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-tempo-50 flex items-center justify-center text-tempo-600">
                      {flexAccountIcons[type]}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-t1">{flexAccountLabels[type]}</h3>
                      <p className="text-xs text-t3">{accounts.length} active account{accounts.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="bg-canvas rounded-lg p-3">
                      <p className="text-[0.6rem] text-t3 uppercase">Total Balance</p>
                      <p className="text-lg font-bold text-t1">${totalBalance.toLocaleString()}</p>
                    </div>
                    <div className="bg-canvas rounded-lg p-3">
                      <p className="text-[0.6rem] text-t3 uppercase">Annual Election</p>
                      <p className="text-lg font-bold text-t1">${totalElection.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-t3">YTD Contributions</span>
                      <span className="text-green-600 font-medium">${totalContrib.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-t3">YTD Expenses</span>
                      <span className="text-red-500 font-medium">${totalExpenses.toLocaleString()}</span>
                    </div>
                  </div>
                  {limit > 0 && (
                    <div className="mt-3 pt-3 border-t border-divider">
                      <p className="text-[0.6rem] text-t3 uppercase mb-1">2026 IRS Limit: ${limit.toLocaleString()}/yr</p>
                      <Progress value={Math.min(100, Math.round((totalContrib / (limit * accounts.length)) * 100))} color="success" />
                    </div>
                  )}
                </Card>
              )
            })}
          </div>

          {/* IRS Contribution Limits */}
          <Card className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <CircleDollarSign size={18} className="text-tempo-600" />
              <h3 className="text-sm font-semibold text-t1">2026 IRS Contribution Limits</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {Object.entries(irsLimits2026).map(([key, limit]) => (
                <div key={key} className="bg-canvas rounded-lg p-3 text-center">
                  <p className="text-xs text-t3 mb-1">{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                  <p className="text-lg font-bold text-t1">${limit.toLocaleString()}</p>
                  <p className="text-[0.6rem] text-t3">per year</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Transaction Log */}
          <Card padding="none">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Transaction History</CardTitle>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => setShowFlexAccountModal(true)}>
                    <Plus size={14} /> New Account
                  </Button>
                  <Button size="sm" onClick={() => setShowFlexExpenseModal(true)}>
                    <Receipt size={14} /> Submit Expense
                  </Button>
                </div>
              </div>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-divider bg-canvas">
                    <th className="tempo-th text-left px-6 py-3">Date</th>
                    <th className="tempo-th text-left px-4 py-3">Employee</th>
                    <th className="tempo-th text-left px-4 py-3">Account</th>
                    <th className="tempo-th text-center px-4 py-3">Type</th>
                    <th className="tempo-th text-right px-4 py-3">Amount</th>
                    <th className="tempo-th text-left px-4 py-3">Description</th>
                    <th className="tempo-th text-center px-4 py-3">Status</th>
                    <th className="tempo-th text-center px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {flexBenefitTransactions.length === 0 ? (
                    <tr><td colSpan={8} className="px-6 py-12 text-center text-xs text-t3">No transactions yet</td></tr>
                  ) : flexBenefitTransactions.map(txn => {
                    const tx = txn as any
                    const account = flexBenefitAccounts.find(a => (a as any).id === tx.account_id) as any
                    return (
                      <tr key={tx.id} className="hover:bg-canvas/50">
                        <td className="px-6 py-3 text-xs text-t2">{tx.transaction_date}</td>
                        <td className="px-4 py-3 text-xs text-t1 font-medium">{account ? getEmployeeName(account.employee_id) : '-'}</td>
                        <td className="px-4 py-3">
                          <Badge variant="default">{account ? flexAccountLabels[account.account_type] || account.account_type : tx.account_id}</Badge>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant={tx.type === 'contribution' ? 'success' : tx.type === 'expense' ? 'warning' : tx.type === 'reimbursement' ? 'info' : 'default'}>
                            {tx.type}
                          </Badge>
                        </td>
                        <td className={cn('px-4 py-3 text-xs font-medium text-right', tx.type === 'contribution' || tx.type === 'rollover' ? 'text-green-600' : 'text-red-500')}>
                          {tx.type === 'contribution' || tx.type === 'rollover' ? '+' : '-'}${(tx.amount || 0).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-xs text-t2">{tx.description || '-'}</td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant={tx.status === 'approved' ? 'success' : tx.status === 'denied' ? 'error' : 'warning'}>
                            {tx.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {tx.status === 'pending' && tx.type === 'expense' && (
                            <div className="flex items-center gap-1 justify-center">
                              <Button size="sm" variant="ghost" onClick={() => updateFlexBenefitTransaction(tx.id, { status: 'approved' })}>
                                <CheckCircle2 size={14} className="text-green-600" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => updateFlexBenefitTransaction(tx.id, { status: 'denied' })}>
                                <AlertTriangle size={14} className="text-red-500" />
                              </Button>
                            </div>
                          )}
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
      {/* TAB: COBRA ADMINISTRATION */}
      {/* ============================================================ */}
      {activeTab === 'cobra' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard label="Active COBRA" value={cobraEvents.filter(e => (e as any).status === 'elected').length} icon={<Shield size={20} />} />
            <StatCard label="Pending Notification" value={cobraEvents.filter(e => (e as any).status === 'pending_notification').length} icon={<Bell size={20} />} change="Requires action" changeType={cobraEvents.filter(e => (e as any).status === 'pending_notification').length > 0 ? 'negative' : 'positive'} />
            <StatCard label="Election Pending" value={cobraEvents.filter(e => (e as any).status === 'notified').length} icon={<Clock size={20} />} />
            <StatCard
              label="Monthly Premiums"
              value={`$${cobraEvents.filter(e => (e as any).status === 'elected').reduce((a, e) => a + ((e as any).monthly_premium || 0), 0).toLocaleString()}`}
              icon={<DollarSign size={20} />}
            />
          </div>

          {/* Election Deadline Alerts */}
          {(() => {
            const now = new Date()
            const urgentEvents = cobraEvents.filter(e => {
              const ev = e as any
              if (ev.status !== 'notified' && ev.status !== 'pending_notification') return false
              const deadline = new Date(ev.election_deadline)
              const daysUntil = Math.ceil((deadline.getTime() - now.getTime()) / 86400000)
              return daysUntil <= 7
            })
            if (urgentEvents.length === 0) return null
            const overdueCount = urgentEvents.filter(e => new Date((e as any).election_deadline) < now).length
            const soonCount = urgentEvents.length - overdueCount
            return (
              <div className={cn('border rounded-lg p-4 mb-6', overdueCount > 0 ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200')}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={16} className={overdueCount > 0 ? 'text-red-600' : 'text-amber-600'} />
                    <h3 className={cn('text-sm font-semibold', overdueCount > 0 ? 'text-red-800' : 'text-amber-800')}>
                      Election Deadline Alerts ({urgentEvents.length})
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {overdueCount > 0 && <Badge variant="error">{overdueCount} Overdue</Badge>}
                    {soonCount > 0 && <Badge variant="warning">{soonCount} Due Soon</Badge>}
                  </div>
                </div>
                <div className="space-y-2">
                  {urgentEvents.map(e => {
                    const ev = e as any
                    const deadline = new Date(ev.election_deadline)
                    const daysUntil = Math.ceil((deadline.getTime() - now.getTime()) / 86400000)
                    const isOverdue = daysUntil < 0
                    return (
                      <div key={ev.id} className={cn('flex items-center justify-between text-xs rounded-lg px-3 py-2', isOverdue ? 'bg-red-100' : 'bg-amber-100')}>
                        <span className={cn('font-medium', isOverdue ? 'text-red-800' : 'text-amber-800')}>{getEmployeeName(ev.employee_id)}</span>
                        <span className={isOverdue ? 'text-red-700' : 'text-amber-700'}>
                          {isOverdue ? `Overdue by ${Math.abs(daysUntil)} days` : `${daysUntil} day${daysUntil !== 1 ? 's' : ''} remaining`} ({ev.election_deadline})
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })()}

          {/* Bulk Notification Button */}
          {(() => {
            const pendingNotif = cobraEvents.filter(e => (e as any).status === 'pending_notification')
            if (pendingNotif.length === 0) return null
            return (
              <div className="flex items-center justify-between bg-surface border border-divider rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2">
                  <Send size={16} className="text-t2" />
                  <span className="text-sm text-t1 font-medium">{pendingNotif.length} event{pendingNotif.length !== 1 ? 's' : ''} awaiting notification</span>
                </div>
                <Button size="sm" onClick={() => {
                  pendingNotif.forEach(e => updateCobraEvent((e as any).id, { status: 'notified', notification_date: new Date().toISOString().split('T')[0] }))
                  addToast(`Sent notifications for ${pendingNotif.length} COBRA event${pendingNotif.length !== 1 ? 's' : ''}`)
                }}>
                  <Send size={14} /> Send All Pending Notifications
                </Button>
              </div>
            )
          })()}

          {/* Expiring COBRA Alerts */}
          {(() => {
            const expiringEvents = cobraEvents.filter(e => {
              const ev = e as any
              if (ev.status !== 'elected') return false
              const endDate = new Date(ev.coverage_end_date)
              const now = new Date()
              const daysUntil = Math.ceil((endDate.getTime() - now.getTime()) / 86400000)
              return daysUntil <= 30 && daysUntil > 0
            })
            return expiringEvents.length > 0 ? (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle size={16} className="text-amber-600" />
                  <h3 className="text-sm font-semibold text-amber-800">Expiring COBRA Coverage</h3>
                </div>
                <div className="space-y-2">
                  {expiringEvents.map(e => {
                    const ev = e as any
                    const daysLeft = Math.ceil((new Date(ev.coverage_end_date).getTime() - new Date().getTime()) / 86400000)
                    return (
                      <div key={ev.id} className="flex items-center justify-between text-xs">
                        <span className="text-amber-700 font-medium">{getEmployeeName(ev.employee_id)}</span>
                        <span className="text-amber-600">Expires in {daysLeft} days ({ev.coverage_end_date})</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : null
          })()}

          {/* COBRA Events Table */}
          <Card padding="none" className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>COBRA Events</CardTitle>
                <Button size="sm" onClick={() => setShowCobraModal(true)}><Plus size={14} /> New COBRA Event</Button>
              </div>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-divider bg-canvas">
                    <th className="tempo-th text-left px-6 py-3">Employee</th>
                    <th className="tempo-th text-left px-4 py-3">Qualifying Event</th>
                    <th className="tempo-th text-center px-4 py-3">Event Date</th>
                    <th className="tempo-th text-center px-4 py-3">Election Deadline</th>
                    <th className="tempo-th text-center px-4 py-3">Coverage End</th>
                    <th className="tempo-th text-right px-4 py-3">Premium</th>
                    <th className="tempo-th text-center px-4 py-3">Status</th>
                    <th className="tempo-th text-center px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {cobraEvents.length === 0 ? (
                    <tr><td colSpan={8} className="px-6 py-12 text-center text-xs text-t3">No COBRA events</td></tr>
                  ) : cobraEvents.map(event => {
                    const ev = event as any
                    const isOverdue = ev.status === 'pending_notification' && new Date(ev.notification_deadline) < new Date()
                    return (
                      <tr key={ev.id} className="hover:bg-canvas/50">
                        <td className="px-6 py-3">
                          <p className="text-sm font-medium text-t1">{getEmployeeName(ev.employee_id)}</p>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="info">{(ev.qualifying_event || '').replace(/_/g, ' ')}</Badge>
                        </td>
                        <td className="px-4 py-3 text-xs text-t2 text-center">{ev.event_date}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={cn('text-xs', isOverdue ? 'text-error font-semibold' : 'text-t2')}>
                            {ev.election_deadline}
                          </span>
                          {isOverdue && (
                            <div className="flex items-center justify-center gap-1 text-xs text-error mt-0.5">
                              <AlertTriangle size={10} /> Overdue
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-t2 text-center">{ev.coverage_end_date}</td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-xs text-t1 font-medium">${(ev.monthly_premium || 0).toLocaleString()}/mo</span>
                          {ev.subsidy_percent > 0 && (
                            <div className="mt-1">
                              <Badge variant="success">{ev.subsidy_percent}% Subsidy</Badge>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant={
                            ev.status === 'elected' ? 'success' :
                            ev.status === 'declined' ? 'default' :
                            ev.status === 'expired' ? 'default' :
                            ev.status === 'notified' ? 'info' : 'warning'
                          }>
                            {(ev.status || '').replace(/_/g, ' ')}
                          </Badge>
                          {ev.coverage_plans && Array.isArray(ev.coverage_plans) && ev.coverage_plans.length > 0 && (
                            <div className="flex flex-wrap gap-1 justify-center mt-1">
                              {ev.coverage_plans.map((plan: any, idx: number) => (
                                <Badge key={idx} variant="info" className="text-[0.6rem]">{plan.name || plan.plan_id}</Badge>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center gap-1 justify-center">
                            {ev.status === 'pending_notification' && (
                              <Button size="sm" variant="ghost" onClick={() => updateCobraEvent(ev.id, { status: 'notified', notification_date: new Date().toISOString().split('T')[0] })}>
                                <Send size={14} /> Notify
                              </Button>
                            )}
                            {ev.status === 'notified' && (
                              <>
                                <Button size="sm" variant="ghost" onClick={() => updateCobraEvent(ev.id, { status: 'elected' })}>
                                  Elect
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => updateCobraEvent(ev.id, { status: 'declined' })}>
                                  Decline
                                </Button>
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
          </Card>

          {/* COBRA Timeline */}
          <Card>
            <h3 className="text-sm font-semibold text-t1 mb-4">COBRA Event Timeline</h3>
            <div className="space-y-4">
              {cobraEvents.map(event => {
                const ev = event as any
                const steps = [
                  { label: 'Qualifying Event', date: ev.event_date, done: true },
                  { label: 'Notification Sent', date: ev.notification_date, done: ev.status !== 'pending_notification' },
                  { label: 'Election Deadline', date: ev.election_deadline, done: ev.status === 'elected' || ev.status === 'declined' || ev.status === 'expired' },
                  { label: 'Coverage End', date: ev.coverage_end_date, done: ev.status === 'expired' },
                ]
                return (
                  <div key={ev.id} className="border border-divider rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-medium text-t1">{getEmployeeName(ev.employee_id)}</p>
                      <Badge variant={ev.status === 'elected' ? 'success' : ev.status === 'declined' ? 'default' : 'warning'}>
                        {(ev.status || '').replace(/_/g, ' ')}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      {steps.map((step, i) => (
                        <div key={i} className="flex items-center gap-2 flex-1">
                          <div className={cn('w-6 h-6 rounded-full flex items-center justify-center text-[0.6rem] font-bold',
                            step.done ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-t3')}>
                            {step.done ? <CheckCircle2 size={12} /> : i + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[0.6rem] font-medium text-t2 truncate">{step.label}</p>
                            <p className="text-[0.55rem] text-t3">{step.date || '-'}</p>
                          </div>
                          {i < steps.length - 1 && <div className={cn('h-px flex-1', step.done ? 'bg-green-300' : 'bg-divider')} />}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
              {cobraEvents.length === 0 && (
                <div className="text-center py-8 text-sm text-t3">No COBRA events to display</div>
              )}
            </div>
          </Card>
        </>
      )}

      {/* ============================================================ */}
      {/* TAB: ACA COMPLIANCE */}
      {/* ============================================================ */}
      {activeTab === 'aca-compliance' && (
        <>
          {/* Tax Year Selector */}
          {(() => {
            const availableYears = [...new Set(acaTracking.map(a => (a as any).tax_year).filter(Boolean))].sort((a, b) => b - a)
            return (
              <div className="flex items-center gap-3 mb-6">
                <label className="text-sm font-medium text-t2">Tax Year</label>
                <select
                  className="border border-divider rounded-lg px-3 py-1.5 text-sm bg-surface text-t1 focus:outline-none focus:ring-2 focus:ring-tempo-600"
                  value={acaTaxYearFilter === 'all' ? 'all' : String(acaTaxYearFilter)}
                  onChange={e => setAcaTaxYearFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                >
                  <option value="all">All Years</option>
                  {availableYears.map(year => (
                    <option key={year} value={String(year)}>{year}</option>
                  ))}
                </select>
              </div>
            )
          })()}

          {/* Filtered ACA data used below */}
          {(() => {
            const filteredAca = acaTaxYearFilter === 'all'
              ? acaTracking
              : acaTracking.filter(a => (a as any).tax_year === acaTaxYearFilter)

            const totalTracked = filteredAca.length
            const fullTimeCount = filteredAca.filter(a => (a as any).aca_status === 'full_time').length
            const offeredCount = filteredAca.filter(a => (a as any).offered_coverage).length
            const offerRate = totalTracked > 0 ? Math.round((offeredCount / totalTracked) * 100) : 0
            const pendingCount = filteredAca.filter(a => (a as any).form_1095_status === 'pending').length
            const generatedCount = filteredAca.filter(a => (a as any).form_1095_status === 'generated').length
            const filedCount = filteredAca.filter(a => (a as any).form_1095_status === 'filed').length
            const correctedCount = filteredAca.filter(a => (a as any).form_1095_status === 'corrected').length
            const allFteOffered = fullTimeCount > 0 && filteredAca.filter(a => (a as any).aca_status === 'full_time' && !(a as any).offered_coverage).length === 0

            return (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <StatCard label="Tracked Employees" value={totalTracked} icon={<Users size={20} />} />
                  <StatCard label="Full-Time Eligible" value={fullTimeCount} icon={<UserCheck size={20} />} />
                  <StatCard
                    label="1095-C Pending"
                    value={pendingCount}
                    icon={<FileText size={20} />}
                    change={pendingCount > 0 ? 'Action needed' : 'All filed'}
                    changeType={pendingCount > 0 ? 'negative' : 'positive'}
                  />
                  <StatCard
                    label="Offer Rate"
                    value={`${offerRate}%`}
                    icon={<Shield size={20} />}
                    change={offeredCount > 0 ? 'Compliant' : 'Review needed'}
                    changeType={filteredAca.filter(a => !(a as any).offered_coverage && (a as any).aca_status === 'full_time').length === 0 ? 'positive' : 'negative'}
                  />
                </div>

                {/* 1094-C Summary Card */}
                <Card className="mb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <FileText size={18} className="text-tempo-600" />
                    <h3 className="text-sm font-semibold text-t1">1094-C Transmittal Summary</h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-canvas rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-t1">{totalTracked}</p>
                      <p className="text-xs text-t3">Total Employees</p>
                    </div>
                    <div className="bg-canvas rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-t1">{fullTimeCount}</p>
                      <p className="text-xs text-t3">Full-Time Count</p>
                    </div>
                    <div className="bg-canvas rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-tempo-600">{offerRate}%</p>
                      <p className="text-xs text-t3">Coverage Offer Rate</p>
                    </div>
                    <div className="bg-canvas rounded-lg p-3">
                      <p className="text-xs font-medium text-t1 mb-1">Filing Summary</p>
                      <div className="space-y-1">
                        {pendingCount > 0 && <div className="flex items-center justify-between text-xs"><span className="text-t3">Pending</span><Badge variant="default">{pendingCount}</Badge></div>}
                        {generatedCount > 0 && <div className="flex items-center justify-between text-xs"><span className="text-t3">Generated</span><Badge variant="info">{generatedCount}</Badge></div>}
                        {filedCount > 0 && <div className="flex items-center justify-between text-xs"><span className="text-t3">Filed</span><Badge variant="success">{filedCount}</Badge></div>}
                        {correctedCount > 0 && <div className="flex items-center justify-between text-xs"><span className="text-t3">Corrected</span><Badge variant="warning">{correctedCount}</Badge></div>}
                        {totalTracked === 0 && <p className="text-xs text-t3">No records</p>}
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Safe Harbor Compliance */}
                <Card className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Scale size={18} className="text-tempo-600" />
                      <h3 className="text-sm font-semibold text-t1">Affordability Safe Harbor</h3>
                    </div>
                    <Badge variant={allFteOffered ? 'success' : 'error'}>{allFteOffered ? 'Compliant' : 'Non-Compliant'}</Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="border border-divider rounded-lg p-3">
                      <p className="text-xs text-t3 mb-1">Safe Harbor Method</p>
                      <p className="text-sm font-medium text-t1">Federal Poverty Line (FPL) 2025</p>
                    </div>
                    <div className="border border-divider rounded-lg p-3">
                      <p className="text-xs text-t3 mb-1">Affordability Threshold</p>
                      <p className="text-sm font-medium text-t1">9.12% of FPL</p>
                    </div>
                    <div className="border border-divider rounded-lg p-3">
                      <p className="text-xs text-t3 mb-1">FTE Coverage Status</p>
                      {allFteOffered ? (
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 size={14} className="text-green-600" />
                          <span className="text-sm font-medium text-green-700">All FTE offered coverage</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <AlertTriangle size={14} className="text-red-500" />
                          <span className="text-sm font-medium text-red-700">
                            {filteredAca.filter(a => (a as any).aca_status === 'full_time' && !(a as any).offered_coverage).length} FTE missing coverage offer
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>

          {/* ACA Dashboard Summary */}
          {(() => {
            const nonCompliant = filteredAca.filter(a => {
              const t = a as any
              return t.aca_status === 'full_time' && !t.offered_coverage
            })
            return nonCompliant.length > 0 ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle size={16} className="text-red-600" />
                  <h3 className="text-sm font-semibold text-red-800">Non-Compliant Employees ({nonCompliant.length})</h3>
                </div>
                <p className="text-xs text-red-700 mb-3">The following full-time employees have not been offered coverage, which may result in ACA penalties.</p>
                <div className="space-y-2">
                  {nonCompliant.map(a => {
                    const t = a as any
                    return (
                      <div key={t.id} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-red-100">
                        <div>
                          <span className="text-sm font-medium text-t1">{getEmployeeName(t.employee_id)}</span>
                          <span className="text-xs text-t3 ml-2">Avg {(t.average_hours || 0).toFixed(1)} hrs/week</span>
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => updateAcaTracking(t.id, { offered_coverage: true })}>
                          Mark Offered
                        </Button>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-green-600" />
                  <h3 className="text-sm font-semibold text-green-800">All full-time employees have been offered coverage</h3>
                </div>
              </div>
            )
          })()}

          {/* ACA Tracking Table */}
          <Card padding="none" className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Employee Eligibility Tracking</CardTitle>
                <Button size="sm" variant="secondary" onClick={() => {
                  const pending = filteredAca.filter(a => (a as any).form_1095_status === 'pending')
                  pending.forEach(a => updateAcaTracking((a as any).id, { form_1095_status: 'generated' }))
                  if (pending.length > 0) addToast(`Generated ${pending.length} 1095-C forms`)
                  else addToast('No pending forms to generate')
                }}>
                  <FileText size={14} /> Generate 1095-C Forms
                </Button>
              </div>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-divider bg-canvas">
                    <th className="tempo-th text-left px-6 py-3">Employee</th>
                    <th className="tempo-th text-center px-4 py-3">ACA Status</th>
                    <th className="tempo-th text-center px-4 py-3">Avg Hours/Week</th>
                    <th className="tempo-th text-center px-4 py-3">Measurement Period</th>
                    <th className="tempo-th text-center px-4 py-3">Offered Coverage</th>
                    <th className="tempo-th text-center px-4 py-3">Enrolled</th>
                    <th className="tempo-th text-center px-4 py-3">1095-C Status</th>
                    <th className="tempo-th text-center px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredAca.length === 0 ? (
                    <tr><td colSpan={8} className="px-6 py-12 text-center text-xs text-t3">No ACA tracking records</td></tr>
                  ) : filteredAca.map(record => {
                    const r = record as any
                    const isNonCompliant = r.aca_status === 'full_time' && !r.offered_coverage
                    return (
                      <tr key={r.id} className={cn('hover:bg-canvas/50', isNonCompliant && 'bg-red-50/50')}>
                        <td className="px-6 py-3">
                          <p className="text-sm font-medium text-t1">{getEmployeeName(r.employee_id)}</p>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant={r.aca_status === 'full_time' ? 'success' : r.aca_status === 'part_time' ? 'warning' : 'default'}>
                            {(r.aca_status || '').replace(/_/g, ' ')}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-xs text-t2 text-center">{(r.average_hours || 0).toFixed(1)}</td>
                        <td className="px-4 py-3 text-xs text-t2 text-center">
                          {r.measurement_start && r.measurement_end ? `${r.measurement_start} - ${r.measurement_end}` : '-'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {r.offered_coverage ? (
                            <CheckCircle2 size={16} className="text-green-600 mx-auto" />
                          ) : (
                            <AlertTriangle size={16} className={cn('mx-auto', r.aca_status === 'full_time' ? 'text-red-500' : 'text-t3')} />
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {r.enrolled_in_coverage ? (
                            <CheckCircle2 size={16} className="text-green-600 mx-auto" />
                          ) : (
                            <span className="text-xs text-t3">No</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant={
                            r.form_1095_status === 'filed' ? 'success' :
                            r.form_1095_status === 'generated' ? 'info' :
                            r.form_1095_status === 'corrected' ? 'warning' : 'default'
                          }>
                            {r.form_1095_status || 'pending'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center gap-1 justify-center">
                            {!r.offered_coverage && r.aca_status === 'full_time' && (
                              <Button size="sm" variant="ghost" onClick={() => updateAcaTracking(r.id, { offered_coverage: true })}>
                                Offer
                              </Button>
                            )}
                            {r.form_1095_status === 'pending' && (
                              <Button size="sm" variant="ghost" onClick={() => updateAcaTracking(r.id, { form_1095_status: 'generated' })}>
                                <FileText size={14} />
                              </Button>
                            )}
                            {r.form_1095_status === 'generated' && (
                              <Button size="sm" variant="ghost" onClick={() => updateAcaTracking(r.id, { form_1095_status: 'filed' })}>
                                File
                              </Button>
                            )}
                            {r.form_1095_status === 'filed' && (
                              <Button size="sm" variant="ghost" onClick={() => {
                                updateAcaTracking(r.id, { form_1095_status: 'corrected' })
                                addToast(`Filed correction for ${getEmployeeName(r.employee_id)}`)
                              }}>
                                <Pencil size={14} /> Correct
                              </Button>
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

          {/* ACA Compliance Summary Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <h3 className="text-sm font-semibold text-t1 mb-4">Workforce ACA Status</h3>
              {(() => {
                const statusMap: Record<string, number> = {}
                filteredAca.forEach(a => {
                  const status = (a as any).aca_status || 'unknown'
                  statusMap[status] = (statusMap[status] || 0) + 1
                })
                const items = Object.entries(statusMap)
                return items.length > 0 ? (
                  <TempoDonutChart data={items.map(([label, value], i) => ({
                    name: label.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                    value,
                    color: CHART_SERIES[i % CHART_SERIES.length],
                  }))} height={180} />
                ) : <p className="text-sm text-t3">No data</p>
              })()}
            </Card>
            <Card>
              <h3 className="text-sm font-semibold text-t1 mb-4">1095-C Filing Status</h3>
              {(() => {
                const formMap: Record<string, number> = {}
                filteredAca.forEach(a => {
                  const status = (a as any).form_1095_status || 'pending'
                  formMap[status] = (formMap[status] || 0) + 1
                })
                const items = Object.entries(formMap)
                return items.length > 0 ? (
                  <TempoDonutChart data={items.map(([label, value], i) => ({
                    name: label.replace(/\b\w/g, l => l.toUpperCase()),
                    value,
                    color: CHART_SERIES[i % CHART_SERIES.length],
                  }))} height={180} />
                ) : <p className="text-sm text-t3">No data</p>
              })()}
            </Card>
          </div>
              </>
            )
          })()}
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
                { value: 'hsa', label: 'HSA' },
                { value: 'fsa', label: 'FSA' },
                { value: 'commuter', label: 'Commuter' },
                { value: 'disability', label: 'Disability' },
                { value: 'voluntary', label: 'Voluntary' },
                { value: 'wellness', label: 'Wellness' },
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

      {/* Bulk Benefits Enrollment Modal */}
      <Modal open={showBulkEnrollModal} onClose={resetBulkEnroll} title="Bulk Benefits Enrollment" description="Enroll employees in a benefit plan" size="xl">
        <div className="space-y-4">
          {/* Step Indicator */}
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center gap-2">
              <div className={cn('w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold', bulkEnrollStep >= 1 ? 'bg-tempo-600 text-white' : 'bg-gray-200 text-t3')}>
                {bulkEnrollStep > 1 ? <CheckCircle size={14} /> : '1'}
              </div>
              <span className={cn('text-xs font-medium', bulkEnrollStep >= 1 ? 'text-t1' : 'text-t3')}>Select Employees</span>
            </div>
            <div className="flex-1 h-px bg-divider" />
            <div className="flex items-center gap-2">
              <div className={cn('w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold', bulkEnrollStep >= 2 ? 'bg-tempo-600 text-white' : 'bg-gray-200 text-t3')}>2</div>
              <span className={cn('text-xs font-medium', bulkEnrollStep >= 2 ? 'text-t1' : 'text-t3')}>Select Plan &amp; Confirm</span>
            </div>
          </div>

          {bulkEnrollStep === 1 && (
            <>
              {/* Mode Toggle Pills */}
              <div className="flex gap-1 bg-canvas rounded-lg p-1">
                {([
                  { id: 'individual' as const, label: 'Individual', icon: UserCheck },
                  { id: 'department' as const, label: 'Department', icon: Building2 },
                  { id: 'country' as const, label: 'Country', icon: Globe },
                  { id: 'level' as const, label: 'Level', icon: Layers },
                  { id: 'all' as const, label: 'Entire Company', icon: Users },
                ]).map(mode => (
                  <button key={mode.id} onClick={() => { setBulkEnrollMode(mode.id); setBulkEnrollSearch(''); setBulkSelectedEmpIds(new Set()); setBulkSelectedDepts(new Set()); setBulkSelectedCountries(new Set()); setBulkSelectedLevels(new Set()) }}
                    className={cn('flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex-1 justify-center',
                      bulkEnrollMode === mode.id ? 'bg-white text-tempo-700 shadow-sm' : 'text-t3 hover:text-t1')}>
                    <mode.icon size={13} />
                    {mode.label}
                  </button>
                ))}
              </div>

              {/* Individual Mode: Search + Checkbox List */}
              {bulkEnrollMode === 'individual' && (
                <>
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-t3" />
                    <input type="text" placeholder="Search employees..." value={bulkEnrollSearch} onChange={(e) => setBulkEnrollSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-divider rounded-lg text-t1 placeholder:text-t3 focus:outline-none focus:ring-2 focus:ring-tempo-600/20 focus:border-tempo-600" />
                  </div>
                  <div className="max-h-64 overflow-y-auto border border-divider rounded-lg divide-y divide-divider">
                    <label className="flex items-center gap-3 px-4 py-2.5 bg-canvas cursor-pointer sticky top-0 z-10 border-b border-divider">
                      <input type="checkbox" className="rounded border-border accent-[var(--color-tempo-600)]"
                        checked={bulkTargetEmployees.length > 0 && bulkTargetEmployees.every(e => bulkSelectedEmpIds.has(e.id))}
                        onChange={(e) => { if (e.target.checked) setBulkSelectedEmpIds(new Set(bulkTargetEmployees.map(emp => emp.id))); else setBulkSelectedEmpIds(new Set()) }} />
                      <span className="text-xs font-medium text-t2">Select All ({bulkTargetEmployees.length})</span>
                    </label>
                    {bulkTargetEmployees.map(emp => (
                      <label key={emp.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-canvas/50 cursor-pointer">
                        <input type="checkbox" className="rounded border-border accent-[var(--color-tempo-600)]" checked={bulkSelectedEmpIds.has(emp.id)} onChange={() => toggleBulkSet(bulkSelectedEmpIds, setBulkSelectedEmpIds, emp.id)} />
                        <Avatar name={emp.profile?.full_name || ''} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-t1 truncate">{emp.profile?.full_name}</p>
                          <p className="text-[0.65rem] text-t3 truncate">{emp.profile?.email}</p>
                        </div>
                        <div className="text-right hidden sm:block">
                          <p className="text-xs text-t2">{emp.job_title}</p>
                          <p className="text-[0.65rem] text-t3">{getDepartmentName(emp.department_id)} &middot; {emp.country}</p>
                        </div>
                      </label>
                    ))}
                    {bulkTargetEmployees.length === 0 && (
                      <div className="px-4 py-8 text-center text-xs text-t3">No employees match your search</div>
                    )}
                  </div>
                </>
              )}

              {/* Department Mode: Toggle Chips + Preview List */}
              {bulkEnrollMode === 'department' && (
                <>
                  <div className="flex flex-wrap gap-2">
                    {departments.map(dept => {
                      const count = employees.filter(e => e.department_id === dept.id).length
                      return (
                        <button key={dept.id} onClick={() => toggleBulkSet(bulkSelectedDepts, setBulkSelectedDepts, dept.id)}
                          className={cn('px-3 py-1.5 text-xs rounded-lg border transition-colors',
                            bulkSelectedDepts.has(dept.id) ? 'bg-tempo-100 border-tempo-300 text-tempo-700 font-medium' : 'border-divider text-t3 hover:text-t1 hover:border-gray-300')}>
                          {dept.name} <span className="text-[0.6rem] ml-1">({count})</span>
                        </button>
                      )
                    })}
                  </div>
                  {bulkTargetEmployees.length > 0 && (
                    <div className="max-h-48 overflow-y-auto border border-divider rounded-lg divide-y divide-divider">
                      {bulkTargetEmployees.map(emp => (
                        <div key={emp.id} className="flex items-center gap-3 px-4 py-2">
                          <Avatar name={emp.profile?.full_name || ''} size="xs" />
                          <span className="text-xs font-medium text-t1">{emp.profile?.full_name}</span>
                          <span className="text-xs text-t3 ml-auto">{emp.job_title} &middot; {emp.country}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Country Mode: Toggle Chips + Preview List */}
              {bulkEnrollMode === 'country' && (
                <>
                  <div className="flex flex-wrap gap-2">
                    {uniqueCountries.map(country => {
                      const count = employees.filter(e => e.country === country).length
                      return (
                        <button key={country} onClick={() => toggleBulkSet(bulkSelectedCountries, setBulkSelectedCountries, country)}
                          className={cn('px-3 py-1.5 text-xs rounded-lg border transition-colors',
                            bulkSelectedCountries.has(country) ? 'bg-tempo-100 border-tempo-300 text-tempo-700 font-medium' : 'border-divider text-t3 hover:text-t1 hover:border-gray-300')}>
                          {country} <span className="text-[0.6rem] ml-1">({count})</span>
                        </button>
                      )
                    })}
                  </div>
                  {bulkTargetEmployees.length > 0 && (
                    <div className="max-h-48 overflow-y-auto border border-divider rounded-lg divide-y divide-divider">
                      {bulkTargetEmployees.map(emp => (
                        <div key={emp.id} className="flex items-center gap-3 px-4 py-2">
                          <Avatar name={emp.profile?.full_name || ''} size="xs" />
                          <span className="text-xs font-medium text-t1">{emp.profile?.full_name}</span>
                          <span className="text-xs text-t3 ml-auto">{getDepartmentName(emp.department_id)} &middot; {emp.level}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Level Mode: Toggle Chips + Preview List */}
              {bulkEnrollMode === 'level' && (
                <>
                  <div className="flex flex-wrap gap-2">
                    {uniqueLevels.map(level => {
                      const count = employees.filter(e => e.level === level).length
                      return (
                        <button key={level} onClick={() => toggleBulkSet(bulkSelectedLevels, setBulkSelectedLevels, level)}
                          className={cn('px-3 py-1.5 text-xs rounded-lg border transition-colors',
                            bulkSelectedLevels.has(level) ? 'bg-tempo-100 border-tempo-300 text-tempo-700 font-medium' : 'border-divider text-t3 hover:text-t1 hover:border-gray-300')}>
                          {level} <span className="text-[0.6rem] ml-1">({count})</span>
                        </button>
                      )
                    })}
                  </div>
                  {bulkTargetEmployees.length > 0 && (
                    <div className="max-h-48 overflow-y-auto border border-divider rounded-lg divide-y divide-divider">
                      {bulkTargetEmployees.map(emp => (
                        <div key={emp.id} className="flex items-center gap-3 px-4 py-2">
                          <Avatar name={emp.profile?.full_name || ''} size="xs" />
                          <span className="text-xs font-medium text-t1">{emp.profile?.full_name}</span>
                          <span className="text-xs text-t3 ml-auto">{getDepartmentName(emp.department_id)} &middot; {emp.country}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Entire Company Mode */}
              {bulkEnrollMode === 'all' && (
                <div className="bg-canvas rounded-lg p-6 text-center">
                  <Users size={32} className="mx-auto text-tempo-600 mb-2" />
                  <p className="text-sm font-semibold text-t1">Entire Company Selected</p>
                  <p className="text-xs text-t3 mt-1">All {employees.length} employees will be enrolled</p>
                </div>
              )}

              {/* Footer Step 1 */}
              <div className="flex items-center justify-between pt-2 border-t border-divider">
                <p className="text-xs text-t2 font-medium">
                  {bulkSelectedEmployees.length > 0 ? `${bulkSelectedEmployees.length} employee(s) selected` : 'No employees selected'}
                </p>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={resetBulkEnroll}>{tc('cancel')}</Button>
                  <Button onClick={() => setBulkEnrollStep(2)} disabled={bulkSelectedEmployees.length === 0}>
                    {'Next: Select Plan \u2192'}
                  </Button>
                </div>
              </div>
            </>
          )}

          {bulkEnrollStep === 2 && (
            <>
              {/* Plan Search */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-t3" />
                <input type="text" placeholder="Search plans..." value={bulkPlanSearch} onChange={(e) => setBulkPlanSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-divider rounded-lg text-t1 placeholder:text-t3 focus:outline-none focus:ring-2 focus:ring-tempo-600/20 focus:border-tempo-600" />
              </div>

              {/* Plan Radio List */}
              <div className="max-h-56 overflow-y-auto border border-divider rounded-lg divide-y divide-divider">
                {filteredBulkPlans.map(plan => (
                  <label key={plan.id} className={cn('flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors',
                    bulkPlanId === plan.id ? 'bg-tempo-50' : 'hover:bg-canvas/50')}>
                    <input type="radio" name="bulk-plan" className="accent-[var(--color-tempo-600)]" checked={bulkPlanId === plan.id} onChange={() => setBulkPlanId(plan.id)} />
                    <div className="w-8 h-8 rounded-lg bg-tempo-50 flex items-center justify-center text-tempo-600">
                      {iconMap[plan.type] || <Shield size={16} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-t1">{plan.name}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Badge>{plan.type}</Badge>
                        <span className="text-[0.6rem] text-t3">${plan.cost_employee}/mo employee &middot; ${plan.cost_employer}/mo employer</span>
                      </div>
                    </div>
                  </label>
                ))}
                {filteredBulkPlans.length === 0 && (
                  <div className="px-4 py-8 text-center text-xs text-t3">No plans match your search</div>
                )}
              </div>

              {/* Coverage Level Selector */}
              <div>
                <label className="block text-xs font-medium text-t2 mb-1.5">Coverage Level</label>
                <select className="w-full px-3 py-2 text-sm bg-white border border-divider rounded-lg text-t1 focus:outline-none focus:ring-2 focus:ring-tempo-600/20 focus:border-tempo-600"
                  value={bulkCoverage} onChange={(e) => setBulkCoverage(e.target.value)}>
                  <option value="employee_only">Employee Only</option>
                  <option value="employee_spouse">Employee + Spouse</option>
                  <option value="employee_child">Employee + Child</option>
                  <option value="family">Family</option>
                </select>
              </div>

              {/* Enrollment Summary */}
              {bulkPlanId && (
                <div className="space-y-3">
                  <h4 className="text-[0.65rem] font-semibold text-t2 uppercase tracking-wider">Enrollment Summary</h4>
                  <div className="bg-canvas rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-medium text-t1">{benefitPlans.find(p => p.id === bulkPlanId)?.name}</span>
                      <Badge variant="info">{benefitPlans.find(p => p.id === bulkPlanId)?.type}</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-3 pt-3 border-t border-divider">
                      <div className="text-center">
                        <p className="text-xl font-bold text-t1">{bulkSelectedEmployees.length}</p>
                        <p className="text-[0.6rem] text-t3">Total Selected</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xl font-bold text-green-600">{bulkNewEnrollees.length}</p>
                        <p className="text-[0.6rem] text-t3">New Enrollments</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xl font-bold text-amber-500">{bulkSkippedEnrollees.length}</p>
                        <p className="text-[0.6rem] text-t3">Already Enrolled</p>
                      </div>
                    </div>
                    {bulkSkippedEnrollees.length > 0 && (
                      <div className="pt-3 mt-3 border-t border-divider">
                        <p className="text-[0.6rem] text-t3 mb-1.5">Already enrolled (will be skipped):</p>
                        <div className="flex flex-wrap gap-1">
                          {bulkSkippedEnrollees.map(emp => <Badge key={emp.id} variant="warning">{emp.profile?.full_name}</Badge>)}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Cost Impact */}
                  {bulkCostImpact && bulkNewEnrollees.length > 0 && (
                    <div className="bg-canvas rounded-lg p-4">
                      <h4 className="text-[0.65rem] font-semibold text-t2 uppercase tracking-wider mb-3">Cost Impact</h4>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="text-center">
                          <p className="text-lg font-bold text-t1">${bulkCostImpact.monthlyPerEmp.toLocaleString()}</p>
                          <p className="text-[0.6rem] text-t3">Monthly / Employee</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-tempo-600">${bulkCostImpact.totalMonthly.toLocaleString()}</p>
                          <p className="text-[0.6rem] text-t3">Total Monthly</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-tempo-700">${bulkCostImpact.totalAnnual.toLocaleString()}</p>
                          <p className="text-[0.6rem] text-t3">Total Annual</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Footer Step 2 */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-divider">
                <Button variant="secondary" onClick={() => setBulkEnrollStep(1)}>{tc('back')}</Button>
                <Button variant="secondary" onClick={resetBulkEnroll}>{tc('cancel')}</Button>
                <Button onClick={submitBulkEnroll} disabled={!bulkPlanId || bulkNewEnrollees.length === 0}>
                  Enroll {bulkNewEnrollees.length} People
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Create Enrollment Period Modal */}
      <Modal open={showOEPModal} onClose={() => setShowOEPModal(false)} title="Create Enrollment Period">
        <div className="space-y-4">
          <Input
            label="Period Name" placeholder="e.g. 2026 Annual Open Enrollment"
            value={oepForm.name} onChange={e => setOepForm({ ...oepForm, name: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Date" type="date"
              value={oepForm.start_date} onChange={e => setOepForm({ ...oepForm, start_date: e.target.value })}
            />
            <Input
              label="End Date" type="date"
              value={oepForm.end_date} onChange={e => setOepForm({ ...oepForm, end_date: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-t2 mb-2">Eligible Plans</label>
            <div className="space-y-2 max-h-48 overflow-y-auto border border-divider rounded-lg p-3">
              {activePlans.map(plan => (
                <label key={plan.id} className="flex items-center gap-2 text-sm text-t1 cursor-pointer">
                  <input
                    type="checkbox"
                    className="rounded border-border accent-[var(--color-tempo-600)]"
                    checked={oepForm.plan_ids.includes(plan.id)}
                    onChange={e => {
                      if (e.target.checked) setOepForm({ ...oepForm, plan_ids: [...oepForm.plan_ids, plan.id] })
                      else setOepForm({ ...oepForm, plan_ids: oepForm.plan_ids.filter(id => id !== plan.id) })
                    }}
                  />
                  <span className="text-tempo-600">{iconMap[plan.type] || <Shield size={14} />}</span>
                  {plan.name}
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowOEPModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitOEP}>Create Period</Button>
          </div>
        </div>
      </Modal>

      {/* Create COBRA Event Modal */}
      <Modal open={showCobraModal} onClose={() => setShowCobraModal(false)} title="Create COBRA Event">
        <div className="space-y-4">
          <Select
            label="Employee" value={cobraForm.employee_id}
            onChange={e => setCobraForm({ ...cobraForm, employee_id: e.target.value })}
            options={[
              { value: '', label: 'Select employee...' },
              ...employees.slice(0, 30).map(emp => ({ value: emp.id, label: emp.profile.full_name })),
            ]}
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Qualifying Event" value={cobraForm.qualifying_event}
              onChange={e => setCobraForm({ ...cobraForm, qualifying_event: e.target.value })}
              options={[
                { value: 'termination', label: 'Termination' },
                { value: 'hours_reduction', label: 'Hours Reduction' },
                { value: 'divorce', label: 'Divorce' },
                { value: 'dependent_aging_out', label: 'Dependent Aging Out' },
                { value: 'death', label: 'Death' },
              ]}
            />
            <Input
              label="Event Date" type="date"
              value={cobraForm.event_date} onChange={e => setCobraForm({ ...cobraForm, event_date: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Notification Date" type="date"
              value={cobraForm.notification_date} onChange={e => setCobraForm({ ...cobraForm, notification_date: e.target.value })}
            />
            <Input
              label="Coverage End Date" type="date"
              value={cobraForm.coverage_end_date} onChange={e => setCobraForm({ ...cobraForm, coverage_end_date: e.target.value })}
            />
          </div>
          <Input
            label="Monthly Premium ($)" type="number" min={0}
            value={cobraForm.monthly_premium} onChange={e => setCobraForm({ ...cobraForm, monthly_premium: Number(e.target.value) })}
          />
          <div className="bg-canvas rounded-lg p-3">
            <p className="text-xs text-t3">Notification must be sent within 14 days of the qualifying event. The employee has 60 days from notification to elect COBRA coverage. Coverage may last up to 18 months (36 months for certain events).</p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowCobraModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitCobra}>Create COBRA Event</Button>
          </div>
        </div>
      </Modal>

      {/* Create Flex Benefit Account Modal */}
      <Modal open={showFlexAccountModal} onClose={() => setShowFlexAccountModal(false)} title="Create Flex Benefit Account">
        <div className="space-y-4">
          <Select
            label="Employee" value={flexAccountForm.employee_id}
            onChange={e => setFlexAccountForm({ ...flexAccountForm, employee_id: e.target.value })}
            options={[
              { value: '', label: 'Select employee...' },
              ...employees.slice(0, 30).map(emp => ({ value: emp.id, label: emp.profile.full_name })),
            ]}
          />
          <Select
            label="Account Type" value={flexAccountForm.account_type}
            onChange={e => setFlexAccountForm({ ...flexAccountForm, account_type: e.target.value })}
            options={[
              { value: 'hsa', label: 'Health Savings Account (HSA)' },
              { value: 'fsa_health', label: 'Healthcare FSA' },
              { value: 'fsa_dependent', label: 'Dependent Care FSA' },
              { value: 'commuter_transit', label: 'Commuter Transit' },
              { value: 'commuter_parking', label: 'Commuter Parking' },
            ]}
          />
          <Input
            label={`Annual Election ($) — IRS Limit: $${(irsLimits2026[flexAccountForm.account_type] || 0).toLocaleString()}/yr`}
            type="number" min={0} max={irsLimits2026[flexAccountForm.account_type] || 99999}
            value={flexAccountForm.annual_election}
            onChange={e => setFlexAccountForm({ ...flexAccountForm, annual_election: Number(e.target.value) })}
          />
          {flexAccountForm.annual_election > (irsLimits2026[flexAccountForm.account_type] || 99999) && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-xs text-red-700">Election exceeds the IRS limit of ${(irsLimits2026[flexAccountForm.account_type] || 0).toLocaleString()} for this account type.</p>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowFlexAccountModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitFlexAccount}>Create Account</Button>
          </div>
        </div>
      </Modal>

      {/* Submit Flex Expense Modal */}
      <Modal open={showFlexExpenseModal} onClose={() => setShowFlexExpenseModal(false)} title="Submit Expense">
        <div className="space-y-4">
          <Select
            label="Account" value={flexExpenseForm.account_id}
            onChange={e => setFlexExpenseForm({ ...flexExpenseForm, account_id: e.target.value })}
            options={[
              { value: '', label: 'Select account...' },
              ...flexBenefitAccounts.filter(a => (a as any).status === 'active').map(a => {
                const acc = a as any
                return { value: acc.id, label: `${getEmployeeName(acc.employee_id)} — ${flexAccountLabels[acc.account_type] || acc.account_type} ($${(acc.current_balance || 0).toLocaleString()} balance)` }
              }),
            ]}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Amount ($)" type="number" min={0}
              value={flexExpenseForm.amount}
              onChange={e => setFlexExpenseForm({ ...flexExpenseForm, amount: Number(e.target.value) })}
            />
            <Input
              label="Receipt Date" type="date"
              value={flexExpenseForm.receipt_date}
              onChange={e => setFlexExpenseForm({ ...flexExpenseForm, receipt_date: e.target.value })}
            />
          </div>
          <Textarea
            label="Description" placeholder="e.g. Prescription medication, dental visit..." rows={3}
            value={flexExpenseForm.description}
            onChange={e => setFlexExpenseForm({ ...flexExpenseForm, description: e.target.value })}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowFlexExpenseModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitFlexExpense}>Submit Expense</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
