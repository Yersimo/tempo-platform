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
import {
  ShieldCheck, FileText, DollarSign, Plus, AlertTriangle, CheckCircle,
  Clock, Calculator, Users, Briefcase, Search, ClipboardList, Edit3,
  Activity, ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown,
  BarChart3, FileWarning, Clipboard, HeartPulse, RefreshCw, Target,
} from 'lucide-react'
import { useTempo, useOrgCurrency } from '@/lib/store'
import { formatCurrency } from '@/lib/utils/format-currency'
import { PageSkeleton } from '@/components/ui/page-skeleton'

// ── Constants ─────────────────────────────────────────────────────────────

const INJURY_TYPES = [
  { value: 'sprain_strain', label: 'Sprain/Strain' },
  { value: 'laceration', label: 'Laceration' },
  { value: 'fracture', label: 'Fracture' },
  { value: 'rsi', label: 'RSI (Repetitive Strain)' },
  { value: 'contusion', label: 'Contusion/Bruise' },
  { value: 'burn', label: 'Burn' },
  { value: 'amputation', label: 'Amputation' },
  { value: 'hearing_loss', label: 'Hearing Loss' },
  { value: 'respiratory', label: 'Respiratory Condition' },
  { value: 'poisoning', label: 'Poisoning' },
  { value: 'other', label: 'Other' },
]

const BODY_PARTS = [
  'Head', 'Neck', 'Upper Back', 'Lower Back', 'Shoulder', 'Upper Arm',
  'Elbow', 'Forearm', 'Wrist', 'Hand', 'Finger(s)', 'Hip', 'Thigh',
  'Knee', 'Lower Leg', 'Ankle', 'Foot', 'Toe(s)', 'Chest', 'Abdomen',
  'Eye(s)', 'Ear(s)', 'Multiple Body Parts', 'Body Systems',
]

const SEVERITY_OPTIONS = [
  { value: 'first_aid', label: 'First Aid Only' },
  { value: 'medical', label: 'Medical Treatment' },
  { value: 'restricted', label: 'Restricted Work/Transfer' },
  { value: 'lost_time', label: 'Days Away From Work' },
  { value: 'fatality', label: 'Fatality' },
]

const OSHA_CLASSIFICATIONS = [
  { value: 'death', label: 'Death' },
  { value: 'days_away', label: 'Days Away from Work' },
  { value: 'job_transfer', label: 'Job Transfer/Restriction' },
  { value: 'other_recordable', label: 'Other Recordable Case' },
]

const RTW_PHASES = [
  { value: 'off_work', label: 'Off Work', percent: 0, color: 'error' },
  { value: 'modified_duty', label: 'Modified Duty', percent: 25, color: 'warning' },
  { value: 'graduated', label: 'Graduated Return', percent: 50, color: 'info' },
  { value: 'full_duty', label: 'Full Duty', percent: 100, color: 'success' },
]

// ── Helpers ───────────────────────────────────────────────────────────────

function isOshaRecordable(severity: string): boolean {
  return ['medical', 'restricted', 'lost_time', 'fatality'].includes(severity)
}

function autoClassify(severity: string): string {
  if (severity === 'fatality') return 'death'
  if (severity === 'lost_time') return 'days_away'
  if (severity === 'restricted') return 'job_transfer'
  if (severity === 'medical') return 'other_recordable'
  return ''
}

// ── Page Component ────────────────────────────────────────────────────────

export default function WorkersCompPage() {
  const tc = useTranslations('common')
  const {
    employees,
    workersCompPolicies, workersCompClaims, workersCompClassCodes, workersCompAudits,
    incidentReports, rtwPlans,
    addWorkersCompPolicy, updateWorkersCompPolicy,
    addWorkersCompClaim, updateWorkersCompClaim,
    addWorkersCompClassCode, updateWorkersCompClassCode,
    addWorkersCompAudit, updateWorkersCompAudit,
    addIncidentReport, updateIncidentReport,
    addRtwPlan, updateRtwPlan,
    getEmployeeName,
    ensureModulesLoaded,
    addToast,
  } = useTempo()
  const defaultCurrency = useOrgCurrency()

  const [pageLoading, setPageLoading] = useState(true)
  useEffect(() => {
    ensureModulesLoaded?.([
      'workersCompPolicies', 'workersCompClaims', 'workersCompClassCodes', 'workersCompAudits',
      'incidentReports', 'rtwPlans', 'employees',
    ])?.then?.(() => setPageLoading(false))?.catch?.(() => setPageLoading(false))
  }, [ensureModulesLoaded])
  useEffect(() => { const t = setTimeout(() => setPageLoading(false), 2000); return () => clearTimeout(t) }, [])

  const [saving, setSaving] = useState(false)
  const [confirmAction, setConfirmAction] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null)

  const [activeTab, setActiveTab] = useState('incidents')
  const [searchQuery, setSearchQuery] = useState('')

  // ── Incident Modal ──
  const [showIncidentModal, setShowIncidentModal] = useState(false)
  const [incidentForm, setIncidentForm] = useState({
    employee_id: '', incident_date: '', incident_time: '', location: '',
    description: '', injury_type: '', body_part: '', severity: 'first_aid',
    witnesses: '',
  })

  // ── Policy modal ──
  const [showPolicyModal, setShowPolicyModal] = useState(false)
  const [editingPolicy, setEditingPolicy] = useState<any>(null)
  const [policyForm, setPolicyForm] = useState({
    name: '', carrier: '', policy_number: '', effective_date: '',
    expiration_date: '', premium: '', status: 'active',
  })

  // ── Claim Status modal ──
  const [showClaimStatusModal, setShowClaimStatusModal] = useState(false)
  const [editingClaim, setEditingClaim] = useState<any>(null)
  const [claimStatusForm, setClaimStatusForm] = useState({ status: '' })

  // ── Class code modal ──
  const [showClassCodeModal, setShowClassCodeModal] = useState(false)
  const [editingClassCode, setEditingClassCode] = useState<any>(null)
  const [classCodeForm, setClassCodeForm] = useState({ code: '', description: '', rate: '', industry: '' })

  // ── Audit modal ──
  const [showAuditModal, setShowAuditModal] = useState(false)
  const [auditForm, setAuditForm] = useState({ audit_type: 'annual', scheduled_date: '', auditor: '', status: 'scheduled' })
  const [showAuditStatusModal, setShowAuditStatusModal] = useState(false)
  const [editingAudit, setEditingAudit] = useState<any>(null)
  const [auditStatusForm, setAuditStatusForm] = useState({ status: '' })

  // ── RTW Plan modal ──
  const [showRtwModal, setShowRtwModal] = useState(false)
  const [editingRtw, setEditingRtw] = useState<any>(null)
  const [rtwForm, setRtwForm] = useState({
    claim_id: '', employee_id: '', start_date: '', target_full_duty_date: '',
    current_phase: 'modified_duty', restrictions: '',
  })

  // ── Premium calculator ──
  const [calcClassCode, setCalcClassCode] = useState('')
  const [calcPayroll, setCalcPayroll] = useState('')
  const [calcEMR, setCalcEMR] = useState('1.00')
  const [calcResult, setCalcResult] = useState<number | null>(null)

  // ── Incident detail view ──
  const [viewingIncident, setViewingIncident] = useState<any>(null)

  // ── Computed ──────────────────────────────────────────────────────────

  const activePolicies = workersCompPolicies.filter((p: any) => p.status === 'active').length
  const openClaims = workersCompClaims.filter((c: any) => c.status === 'open').length
  const totalReserves = workersCompClaims.reduce((sum: number, c: any) => sum + (c.reserve_amount || 0), 0)
  const ytdPaid = workersCompClaims.reduce((sum: number, c: any) => sum + (c.paid_amount || 0), 0)

  const recordableIncidents = incidentReports.filter((i: any) => i.is_osha_recordable)
  const totalHoursWorked = employees.length * 2080 // estimate per year
  const trir = totalHoursWorked > 0 ? ((recordableIncidents.length * 200000) / totalHoursWorked) : 0
  const dartCases = recordableIncidents.filter((i: any) =>
    i.osha_classification === 'days_away' || i.osha_classification === 'job_transfer'
  )
  const dartRate = totalHoursWorked > 0 ? ((dartCases.length * 200000) / totalHoursWorked) : 0

  // EMR data (simulated 3-year trend)
  const currentEMR = 0.92
  const emrHistory = [
    { year: 2024, emr: 1.05, premium_impact: '+5%' },
    { year: 2025, emr: 0.98, premium_impact: '-2%' },
    { year: 2026, emr: currentEMR, premium_impact: `${currentEMR < 1 ? '-' : '+'}${Math.abs(Math.round((currentEMR - 1) * 100))}%` },
  ]

  const tabs = [
    { id: 'incidents', label: 'Incidents', count: incidentReports.length },
    { id: 'osha-logs', label: 'OSHA Logs', count: recordableIncidents.length },
    { id: 'claims', label: 'Claims', count: workersCompClaims.length },
    { id: 'rtw', label: 'Return to Work', count: rtwPlans.length },
    { id: 'emr', label: 'Experience Mod' },
    { id: 'policies', label: 'Policies', count: workersCompPolicies.length },
    { id: 'class-codes', label: 'Class Codes', count: workersCompClassCodes.length },
    { id: 'calculator', label: 'Premium Calculator' },
    { id: 'audits', label: 'Audits', count: workersCompAudits.length },
  ]

  const filteredIncidents = useMemo(() => {
    if (!searchQuery.trim()) return incidentReports
    const q = searchQuery.toLowerCase()
    return incidentReports.filter((i: any) =>
      (i.description || '').toLowerCase().includes(q) ||
      (i.injury_type || '').toLowerCase().includes(q) ||
      (i.location || '').toLowerCase().includes(q) ||
      (getEmployeeName(i.employee_id) || '').toLowerCase().includes(q)
    )
  }, [incidentReports, searchQuery, getEmployeeName])

  const filteredClaims = useMemo(() => {
    if (!searchQuery.trim()) return workersCompClaims
    const q = searchQuery.toLowerCase()
    return workersCompClaims.filter((c: any) =>
      (c.employee_name || '').toLowerCase().includes(q) ||
      (c.description || '').toLowerCase().includes(q) ||
      (c.injury_type || '').toLowerCase().includes(q)
    )
  }, [workersCompClaims, searchQuery])

  const filteredPolicies = useMemo(() => {
    if (!searchQuery.trim()) return workersCompPolicies
    const q = searchQuery.toLowerCase()
    return workersCompPolicies.filter((p: any) =>
      (p.name || '').toLowerCase().includes(q) ||
      (p.carrier || '').toLowerCase().includes(q) ||
      (p.policy_number || '').toLowerCase().includes(q)
    )
  }, [workersCompPolicies, searchQuery])

  // ── Formatters ────────────────────────────────────────────────────────

  function formatCents(cents: number): string {
    return formatCurrency(cents, defaultCurrency, { cents: true })
  }

  function getSeverityVariant(s: string): 'success' | 'warning' | 'error' | 'info' | 'default' {
    switch (s) {
      case 'first_aid': return 'success'
      case 'medical': return 'warning'
      case 'restricted': return 'warning'
      case 'lost_time': return 'error'
      case 'fatality': return 'error'
      default: return 'default'
    }
  }

  function getStatusVariant(s: string): 'success' | 'warning' | 'error' | 'info' | 'default' {
    switch (s) {
      case 'reported': return 'info'
      case 'under_review': return 'warning'
      case 'filed': return 'default'
      case 'closed': return 'success'
      case 'open': return 'warning'
      case 'approved': return 'success'
      case 'denied': return 'error'
      case 'active': return 'success'
      case 'expired': return 'error'
      case 'pending': return 'warning'
      default: return 'default'
    }
  }

  // ── Handlers ──────────────────────────────────────────────────────────

  function openIncidentModal() {
    setIncidentForm({
      employee_id: '', incident_date: new Date().toISOString().split('T')[0],
      incident_time: '', location: '', description: '', injury_type: '',
      body_part: '', severity: 'first_aid', witnesses: '',
    })
    setShowIncidentModal(true)
  }

  function submitIncident() {
    if (!incidentForm.employee_id) { addToast('Employee is required', 'error'); return }
    if (!incidentForm.incident_date) { addToast('Incident date is required', 'error'); return }
    if (!incidentForm.location) { addToast('Location is required', 'error'); return }
    if (!incidentForm.description) { addToast('Description is required', 'error'); return }
    if (!incidentForm.injury_type) { addToast('Injury type is required', 'error'); return }
    if (!incidentForm.body_part) { addToast('Body part is required', 'error'); return }
    setSaving(true)
    try {
      const recordable = isOshaRecordable(incidentForm.severity)
      const classification = autoClassify(incidentForm.severity)
      addIncidentReport({
        employee_id: incidentForm.employee_id,
        incident_date: incidentForm.incident_date,
        incident_time: incidentForm.incident_time,
        location: incidentForm.location,
        description: incidentForm.description,
        injury_type: incidentForm.injury_type,
        body_part: incidentForm.body_part,
        severity: incidentForm.severity,
        witnesses: incidentForm.witnesses,
        is_osha_recordable: recordable,
        osha_classification: classification,
        days_away: 0,
        days_restricted: 0,
        status: 'reported',
      })
      setShowIncidentModal(false)
      if (recordable) {
        addToast('OSHA recordable incident reported - added to OSHA 300 Log', 'info')
      }
    } finally { setSaving(false) }
  }

  function openAddPolicyModal() {
    setEditingPolicy(null)
    setPolicyForm({
      name: '', carrier: '', policy_number: '',
      effective_date: new Date().toISOString().split('T')[0],
      expiration_date: '', premium: '', status: 'active',
    })
    setShowPolicyModal(true)
  }

  function openEditPolicyModal(policy: any) {
    setEditingPolicy(policy)
    setPolicyForm({
      name: policy.name || '', carrier: policy.carrier || '',
      policy_number: policy.policy_number || '',
      effective_date: policy.effective_date || '',
      expiration_date: policy.expiry_date || policy.expiration_date || '',
      premium: String((policy.premium || 0) / 100), status: policy.status || 'active',
    })
    setShowPolicyModal(true)
  }

  function submitPolicy() {
    if (!policyForm.name) { addToast('Policy name is required', 'error'); return }
    if (!policyForm.carrier) { addToast('Carrier is required', 'error'); return }
    setSaving(true)
    try {
      const payload = {
        name: policyForm.name, carrier: policyForm.carrier, policy_number: policyForm.policy_number,
        effective_date: policyForm.effective_date, expiry_date: policyForm.expiration_date,
        premium: Number(policyForm.premium) * 100 || 0, status: policyForm.status,
        covered_employees: employees.length,
      }
      if (editingPolicy) {
        updateWorkersCompPolicy(editingPolicy.id, payload)
        addToast('Policy updated')
      } else {
        addWorkersCompPolicy(payload)
        addToast('Policy added')
      }
      setShowPolicyModal(false)
    } finally { setSaving(false) }
  }

  function openClaimStatusModal(claim: any) {
    setEditingClaim(claim)
    setClaimStatusForm({ status: claim.status })
    setShowClaimStatusModal(true)
  }

  function submitClaimStatus() {
    if (!editingClaim || !claimStatusForm.status) { addToast('Select a status', 'error'); return }
    setSaving(true)
    try {
      updateWorkersCompClaim(editingClaim.id, { status: claimStatusForm.status })
      setShowClaimStatusModal(false)
    } finally { setSaving(false) }
  }

  function openFileClaimFromIncident(incident: any) {
    const activePolicyId = workersCompPolicies.find((p: any) => p.status === 'active')?.id || ''
    addWorkersCompClaim({
      policy_id: activePolicyId,
      employee_name: getEmployeeName(incident.employee_id) || 'Unknown',
      incident_date: incident.incident_date,
      description: incident.description,
      injury_type: incident.injury_type,
      body_part: incident.body_part,
      reserve_amount: 0, paid_amount: 0,
    })
    updateIncidentReport(incident.id, { status: 'filed' })
    addToast('Claim filed from incident report')
  }

  function openAddClassCodeModal() {
    setEditingClassCode(null)
    setClassCodeForm({ code: '', description: '', rate: '', industry: '' })
    setShowClassCodeModal(true)
  }

  function openEditClassCodeModal(cc: any) {
    setEditingClassCode(cc)
    setClassCodeForm({ code: cc.code || '', description: cc.description || '', rate: String(cc.rate || ''), industry: cc.industry || '' })
    setShowClassCodeModal(true)
  }

  function submitClassCode() {
    if (!classCodeForm.code) { addToast('Code is required', 'error'); return }
    if (!classCodeForm.description) { addToast('Description is required', 'error'); return }
    if (!classCodeForm.rate || Number(classCodeForm.rate) <= 0) { addToast('Valid rate is required', 'error'); return }
    setSaving(true)
    try {
      const payload = { code: classCodeForm.code, description: classCodeForm.description, rate: Number(classCodeForm.rate), industry: classCodeForm.industry, employee_count: 0 }
      if (editingClassCode) {
        updateWorkersCompClassCode(editingClassCode.id, payload)
      } else {
        addWorkersCompClassCode(payload)
      }
      setShowClassCodeModal(false)
    } finally { setSaving(false) }
  }

  function openScheduleAuditModal() {
    setAuditForm({ audit_type: 'annual', scheduled_date: '', auditor: '', status: 'scheduled' })
    setShowAuditModal(true)
  }

  function submitAudit() {
    if (!auditForm.scheduled_date) { addToast('Date is required', 'error'); return }
    if (!auditForm.auditor) { addToast('Auditor is required', 'error'); return }
    setSaving(true)
    try {
      addWorkersCompAudit({
        audit_type: auditForm.audit_type, audit_date: auditForm.scheduled_date,
        period: `${new Date().getFullYear()}`, auditor: auditForm.auditor,
        status: auditForm.status, findings: '', adjustment_amount: 0,
      })
      setShowAuditModal(false)
    } finally { setSaving(false) }
  }

  function openAuditStatusModal(audit: any) {
    setEditingAudit(audit)
    setAuditStatusForm({ status: audit.status })
    setShowAuditStatusModal(true)
  }

  function submitAuditStatus() {
    if (!editingAudit || !auditStatusForm.status) return
    setSaving(true)
    try {
      updateWorkersCompAudit(editingAudit.id, { status: auditStatusForm.status })
      setShowAuditStatusModal(false)
    } finally { setSaving(false) }
  }

  function openRtwModal(claimId?: string, employeeId?: string) {
    setEditingRtw(null)
    setRtwForm({
      claim_id: claimId || '', employee_id: employeeId || '',
      start_date: new Date().toISOString().split('T')[0],
      target_full_duty_date: '', current_phase: 'modified_duty', restrictions: '',
    })
    setShowRtwModal(true)
  }

  function openEditRtwModal(plan: any) {
    setEditingRtw(plan)
    setRtwForm({
      claim_id: plan.claim_id || '', employee_id: plan.employee_id || '',
      start_date: plan.start_date || '', target_full_duty_date: plan.target_full_duty_date || '',
      current_phase: plan.current_phase || 'modified_duty', restrictions: plan.restrictions || '',
    })
    setShowRtwModal(true)
  }

  function submitRtwPlan() {
    if (!rtwForm.start_date) { addToast('Start date is required', 'error'); return }
    setSaving(true)
    try {
      const payload = {
        claim_id: rtwForm.claim_id, employee_id: rtwForm.employee_id,
        start_date: rtwForm.start_date, target_full_duty_date: rtwForm.target_full_duty_date,
        current_phase: rtwForm.current_phase, restrictions: rtwForm.restrictions,
        medical_clearance: rtwForm.current_phase === 'full_duty',
        clearance_date: rtwForm.current_phase === 'full_duty' ? new Date().toISOString().split('T')[0] : null,
      }
      if (editingRtw) {
        updateRtwPlan(editingRtw.id, payload)
      } else {
        addRtwPlan(payload)
      }
      setShowRtwModal(false)
    } finally { setSaving(false) }
  }

  function calculatePremium() {
    const selectedCode = workersCompClassCodes.find((c: any) => c.code === calcClassCode)
    if (!selectedCode || !calcPayroll) return
    const payrollNum = Number(calcPayroll)
    const emr = Number(calcEMR) || 1
    const premium = (payrollNum / 100) * selectedCode.rate * emr
    setCalcResult(Math.round(premium * 100))
  }

  // ── OSHA 300 Log ──

  const osha300Entries = useMemo(() => {
    return recordableIncidents.map((inc: any, idx: number) => ({
      caseNumber: `${new Date().getFullYear()}-${String(idx + 1).padStart(3, '0')}`,
      employeeName: getEmployeeName(inc.employee_id) || 'Unknown',
      jobTitle: employees.find((e: any) => e.id === inc.employee_id)?.job_title || 'N/A',
      dateOfInjury: inc.incident_date,
      location: inc.location,
      description: inc.description,
      classification: inc.osha_classification,
      daysAway: inc.days_away || 0,
      daysRestricted: inc.days_restricted || 0,
      injuryType: inc.injury_type,
      ...inc,
    }))
  }, [recordableIncidents, getEmployeeName, employees])

  // ── OSHA 300A Summary ──

  const osha300ASummary = useMemo(() => {
    const totalCases = recordableIncidents.length
    const deathCases = recordableIncidents.filter((i: any) => i.osha_classification === 'death').length
    const daysAwayCases = recordableIncidents.filter((i: any) => i.osha_classification === 'days_away').length
    const transferCases = recordableIncidents.filter((i: any) => i.osha_classification === 'job_transfer').length
    const otherCases = recordableIncidents.filter((i: any) => i.osha_classification === 'other_recordable').length
    const totalDaysAway = recordableIncidents.reduce((s: number, i: any) => s + (i.days_away || 0), 0)
    const totalDaysRestricted = recordableIncidents.reduce((s: number, i: any) => s + (i.days_restricted || 0), 0)

    const injuryTypeCounts: Record<string, number> = {}
    recordableIncidents.forEach((i: any) => {
      injuryTypeCounts[i.injury_type] = (injuryTypeCounts[i.injury_type] || 0) + 1
    })

    return {
      totalCases, deathCases, daysAwayCases, transferCases, otherCases,
      totalDaysAway, totalDaysRestricted, injuryTypeCounts,
      avgEmployees: employees.length,
      totalHoursWorked,
    }
  }, [recordableIncidents, employees, totalHoursWorked])

  // ── Render ──────────────────────────────────────────────────────────────

  if (pageLoading) {
    return (
      <>
        <Header
          title="Workers' Compensation"
          subtitle="OSHA compliance, incident management & claims"
          actions={<Button size="sm" disabled><Plus size={14} /> Report Incident</Button>}
        />
        <div className="p-6"><PageSkeleton /></div>
      </>
    )
  }

  return (
    <>
      <Header
        title="Workers' Compensation"
        subtitle="OSHA compliance, incident management & claims"
        actions={
          <Button size="sm" onClick={openIncidentModal}>
            <Plus size={14} /> Report Incident
          </Button>
        }
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <StatCard label="TRIR" value={trir.toFixed(2)} icon={<Activity size={20} />} change={trir < 3 ? 'Below avg' : 'Above avg'} changeType={trir < 3 ? 'positive' : 'negative'} />
        <StatCard label="DART Rate" value={dartRate.toFixed(2)} icon={<Target size={20} />} />
        <StatCard label="Open Claims" value={openClaims} icon={<AlertTriangle size={20} />} change={`${openClaims} pending`} changeType="negative" />
        <StatCard label="Total Reserves" value={formatCents(totalReserves)} icon={<DollarSign size={20} />} />
        <StatCard label="EMR" value={currentEMR.toFixed(2)} icon={<BarChart3 size={20} />} change={currentEMR < 1 ? 'Below 1.0' : 'Above 1.0'} changeType={currentEMR < 1 ? 'positive' : 'negative'} />
      </div>

      <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} className="mb-6" />

      {/* Search */}
      {['incidents', 'claims', 'policies'].includes(activeTab) && (
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-t3" />
          <Input
            placeholder={
              activeTab === 'incidents' ? 'Search incidents by employee, location, injury type...' :
              activeTab === 'claims' ? 'Search claims...' : 'Search policies...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      )}

      {/* ══════════════════════════ INCIDENTS TAB ══════════════════════════ */}
      {activeTab === 'incidents' && (
        <Card padding="none">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Incident Reports</CardTitle>
              <Button variant="secondary" size="sm" onClick={openIncidentModal}><Plus size={14} /> Report Incident</Button>
            </div>
          </CardHeader>
          {filteredIncidents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 rounded-lg bg-canvas flex items-center justify-center mb-3">
                <FileWarning size={24} className="text-t3" />
              </div>
              <p className="text-sm font-medium text-t1 mb-1">{searchQuery ? 'No matching incidents' : 'No incidents reported'}</p>
              <p className="text-xs text-t3 mb-4 max-w-xs">Report workplace incidents to track OSHA recordability and generate required forms.</p>
              {!searchQuery && <Button size="sm" onClick={openIncidentModal}><Plus size={14} /> Report Incident</Button>}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-divider bg-canvas">
                    <th className="tempo-th text-left px-6 py-3">Employee</th>
                    <th className="tempo-th text-left px-4 py-3">Date / Time</th>
                    <th className="tempo-th text-left px-4 py-3">Location</th>
                    <th className="tempo-th text-left px-4 py-3">Injury</th>
                    <th className="tempo-th text-center px-4 py-3">Severity</th>
                    <th className="tempo-th text-center px-4 py-3">OSHA</th>
                    <th className="tempo-th text-center px-4 py-3">{tc('status')}</th>
                    <th className="tempo-th text-center px-4 py-3">{tc('actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredIncidents.map((inc: any) => (
                    <tr key={inc.id} className="hover:bg-canvas/50 cursor-pointer" onClick={() => setViewingIncident(inc)}>
                      <td className="px-6 py-3">
                        <p className="text-xs font-medium text-t1">{getEmployeeName(inc.employee_id) || 'Unknown'}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-t2">{inc.incident_date}{inc.incident_time ? ` ${inc.incident_time}` : ''}</td>
                      <td className="px-4 py-3 text-xs text-t2">{inc.location}</td>
                      <td className="px-4 py-3">
                        <p className="text-xs text-t1">{inc.injury_type?.replace(/_/g, ' ')}</p>
                        <p className="text-xs text-t3">{inc.body_part}</p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={getSeverityVariant(inc.severity)}>{inc.severity?.replace(/_/g, ' ')}</Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {inc.is_osha_recordable ? (
                          <Badge variant="error">Recordable</Badge>
                        ) : (
                          <Badge variant="default">Non-recordable</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={getStatusVariant(inc.status)}>{inc.status?.replace(/_/g, ' ')}</Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex gap-1 justify-center" onClick={(e) => e.stopPropagation()}>
                          {inc.status === 'reported' && (
                            <>
                              <Button size="sm" variant="secondary" onClick={() => updateIncidentReport(inc.id, { status: 'under_review' })}>
                                Review
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => openFileClaimFromIncident(inc)}>
                                File Claim
                              </Button>
                            </>
                          )}
                          {inc.status === 'under_review' && (
                            <Button size="sm" variant="secondary" onClick={() => openFileClaimFromIncident(inc)}>
                              <FileText size={12} /> File Claim
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* ══════════════════════════ OSHA LOGS TAB ══════════════════════════ */}
      {activeTab === 'osha-logs' && (
        <div className="space-y-6">
          {/* OSHA 300 Log */}
          <Card padding="none">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>OSHA Form 300 - Log of Work-Related Injuries and Illnesses</CardTitle>
                  <p className="text-xs text-t3 mt-1">Year: {new Date().getFullYear()} | Establishment: Your Organization</p>
                </div>
                <Button size="sm" variant="secondary"><FileText size={14} /> Export</Button>
              </div>
            </CardHeader>
            {osha300Entries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-12 h-12 rounded-lg bg-canvas flex items-center justify-center mb-3">
                  <Clipboard size={24} className="text-t3" />
                </div>
                <p className="text-sm font-medium text-t1 mb-1">No OSHA recordable incidents</p>
                <p className="text-xs text-t3 max-w-xs">Only incidents that meet OSHA recordability criteria appear here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-divider bg-canvas">
                      <th className="tempo-th text-left px-4 py-2">Case #</th>
                      <th className="tempo-th text-left px-4 py-2">Employee</th>
                      <th className="tempo-th text-left px-4 py-2">Job Title</th>
                      <th className="tempo-th text-left px-4 py-2">Date</th>
                      <th className="tempo-th text-left px-4 py-2">Where</th>
                      <th className="tempo-th text-left px-4 py-2">Description</th>
                      <th className="tempo-th text-center px-4 py-2">Classification</th>
                      <th className="tempo-th text-center px-4 py-2">Days Away</th>
                      <th className="tempo-th text-center px-4 py-2">Days Restricted</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {osha300Entries.map((entry: any) => (
                      <tr key={entry.id} className="hover:bg-canvas/50">
                        <td className="px-4 py-2 font-mono font-semibold text-t1">{entry.caseNumber}</td>
                        <td className="px-4 py-2 text-t1">{entry.employeeName}</td>
                        <td className="px-4 py-2 text-t2">{entry.jobTitle}</td>
                        <td className="px-4 py-2 text-t2">{entry.dateOfInjury}</td>
                        <td className="px-4 py-2 text-t2">{entry.location}</td>
                        <td className="px-4 py-2 text-t2 max-w-[200px] truncate">{entry.description}</td>
                        <td className="px-4 py-2 text-center">
                          <Badge variant={entry.classification === 'death' ? 'error' : entry.classification === 'days_away' ? 'warning' : 'info'}>
                            {entry.classification?.replace(/_/g, ' ')}
                          </Badge>
                        </td>
                        <td className="px-4 py-2 text-center font-semibold text-t1">{entry.daysAway}</td>
                        <td className="px-4 py-2 text-center font-semibold text-t1">{entry.daysRestricted}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* OSHA 300A Summary */}
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Clipboard size={20} className="text-tempo-600" />
              <h3 className="text-sm font-semibold text-t1">OSHA Form 300A - Summary of Work-Related Injuries and Illnesses</h3>
            </div>
            <p className="text-xs text-t3 mb-4">Calendar year {new Date().getFullYear()} | Must be posted Feb 1 - Apr 30 of following year</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="p-3 bg-canvas rounded-lg text-center border border-divider">
                <p className="text-xs text-t3">Total Cases</p>
                <p className="text-2xl font-bold text-t1">{osha300ASummary.totalCases}</p>
              </div>
              <div className="p-3 bg-canvas rounded-lg text-center border border-divider">
                <p className="text-xs text-t3">Deaths</p>
                <p className="text-2xl font-bold text-error">{osha300ASummary.deathCases}</p>
              </div>
              <div className="p-3 bg-canvas rounded-lg text-center border border-divider">
                <p className="text-xs text-t3">Days Away</p>
                <p className="text-2xl font-bold text-warning">{osha300ASummary.daysAwayCases}</p>
              </div>
              <div className="p-3 bg-canvas rounded-lg text-center border border-divider">
                <p className="text-xs text-t3">Job Transfer/Restriction</p>
                <p className="text-2xl font-bold text-info">{osha300ASummary.transferCases}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="p-3 bg-canvas rounded-lg text-center border border-divider">
                <p className="text-xs text-t3">Other Recordable</p>
                <p className="text-lg font-bold text-t1">{osha300ASummary.otherCases}</p>
              </div>
              <div className="p-3 bg-canvas rounded-lg text-center border border-divider">
                <p className="text-xs text-t3">Total Days Away</p>
                <p className="text-lg font-bold text-t1">{osha300ASummary.totalDaysAway}</p>
              </div>
              <div className="p-3 bg-canvas rounded-lg text-center border border-divider">
                <p className="text-xs text-t3">Total Days Restricted</p>
                <p className="text-lg font-bold text-t1">{osha300ASummary.totalDaysRestricted}</p>
              </div>
              <div className="p-3 bg-canvas rounded-lg text-center border border-divider">
                <p className="text-xs text-t3">Avg Employees</p>
                <p className="text-lg font-bold text-t1">{osha300ASummary.avgEmployees}</p>
              </div>
            </div>

            {/* TRIR and DART */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-4 bg-canvas rounded-lg border border-divider">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-t1">TRIR (Total Recordable Incident Rate)</p>
                  <Badge variant={trir < 3 ? 'success' : 'error'}>{trir < 3 ? 'Good' : 'High'}</Badge>
                </div>
                <p className="text-2xl font-bold text-t1">{trir.toFixed(2)}</p>
                <p className="text-xs text-t3 mt-1">({recordableIncidents.length} recordable x 200,000) / {totalHoursWorked.toLocaleString()} hrs</p>
              </div>
              <div className="p-4 bg-canvas rounded-lg border border-divider">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-t1">DART Rate</p>
                  <Badge variant={dartRate < 2 ? 'success' : 'error'}>{dartRate < 2 ? 'Good' : 'High'}</Badge>
                </div>
                <p className="text-2xl font-bold text-t1">{dartRate.toFixed(2)}</p>
                <p className="text-xs text-t3 mt-1">({dartCases.length} DART cases x 200,000) / {totalHoursWorked.toLocaleString()} hrs</p>
              </div>
            </div>

            {/* Injury type breakdown */}
            {Object.keys(osha300ASummary.injuryTypeCounts).length > 0 && (
              <div>
                <p className="text-xs font-semibold text-t1 mb-2">Injury Types</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(osha300ASummary.injuryTypeCounts).map(([type, count]) => (
                    <Badge key={type} variant="default">{type.replace(/_/g, ' ')}: {count as number}</Badge>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ══════════════════════════ CLAIMS TAB ══════════════════════════ */}
      {activeTab === 'claims' && (
        <Card padding="none">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>All Claims</CardTitle>
            </div>
          </CardHeader>
          {filteredClaims.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 rounded-lg bg-canvas flex items-center justify-center mb-3">
                <FileText size={24} className="text-t3" />
              </div>
              <p className="text-sm font-medium text-t1 mb-1">No claims filed</p>
              <p className="text-xs text-t3 max-w-xs">Claims are generated from incident reports.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-divider bg-canvas">
                    <th className="tempo-th text-left px-6 py-3">Employee</th>
                    <th className="tempo-th text-left px-4 py-3">Incident Date</th>
                    <th className="tempo-th text-left px-4 py-3">Injury</th>
                    <th className="tempo-th text-center px-4 py-3">{tc('status')}</th>
                    <th className="tempo-th text-right px-4 py-3">Reserve</th>
                    <th className="tempo-th text-right px-4 py-3">Paid</th>
                    <th className="tempo-th text-center px-4 py-3">{tc('actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredClaims.map((claim: any) => {
                    const paidPct = claim.reserve_amount > 0 ? Math.round((claim.paid_amount / claim.reserve_amount) * 100) : 0
                    return (
                      <tr key={claim.id} className="hover:bg-canvas/50">
                        <td className="px-6 py-3">
                          <p className="text-xs font-medium text-t1">{claim.employee_name}</p>
                          <p className="text-xs text-t3 max-w-[180px] truncate">{claim.description}</p>
                        </td>
                        <td className="px-4 py-3 text-xs text-t2">{claim.incident_date}</td>
                        <td className="px-4 py-3 text-xs text-t2">{claim.injury_type} / {claim.body_part}</td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant={getStatusVariant(claim.status)}>{claim.status}</Badge>
                        </td>
                        <td className="px-4 py-3 text-xs font-semibold text-t1 text-right">{formatCents(claim.reserve_amount)}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="min-w-[100px]">
                            <p className="text-xs font-semibold text-t1">{formatCents(claim.paid_amount)}</p>
                            <Progress value={paidPct} color={paidPct > 80 ? 'warning' : 'orange'} className="mt-1" />
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex gap-1 justify-center">
                            <Button size="sm" variant="secondary" onClick={() => openClaimStatusModal(claim)}>
                              <Edit3 size={12} /> Update
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => openRtwModal(claim.id, '')}>
                              <HeartPulse size={12} /> RTW
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* ══════════════════════════ RETURN TO WORK TAB ══════════════════════════ */}
      {activeTab === 'rtw' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-t1 flex items-center gap-2">
              <HeartPulse size={18} /> Return-to-Work Plans
            </h3>
            <Button variant="secondary" size="sm" onClick={() => openRtwModal()}>
              <Plus size={14} /> Create RTW Plan
            </Button>
          </div>

          {rtwPlans.length === 0 ? (
            <Card className="py-16 text-center">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-lg bg-canvas flex items-center justify-center mb-3">
                  <HeartPulse size={24} className="text-t3" />
                </div>
                <p className="text-sm font-medium text-t1 mb-1">No return-to-work plans</p>
                <p className="text-xs text-t3 mb-4 max-w-xs">Create plans for employees recovering from workplace injuries to track their graduated return.</p>
                <Button size="sm" onClick={() => openRtwModal()}><Plus size={14} /> Create RTW Plan</Button>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {rtwPlans.map((plan: any) => {
                const phaseInfo = RTW_PHASES.find(p => p.value === plan.current_phase) || RTW_PHASES[1]
                const empName = getEmployeeName(plan.employee_id) || 'Unknown'
                return (
                  <Card key={plan.id}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="text-sm font-semibold text-t1">{empName}</h4>
                        <p className="text-xs text-t3">Start: {plan.start_date} | Target: {plan.target_full_duty_date || 'TBD'}</p>
                      </div>
                      <Badge variant={getStatusVariant(plan.status || 'active')}>{plan.status || 'active'}</Badge>
                    </div>

                    {/* Phase Progress */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-t3">Recovery Phase</span>
                        <Badge variant={phaseInfo.color as any}>{phaseInfo.label}</Badge>
                      </div>
                      <Progress value={phaseInfo.percent} color={phaseInfo.color === 'error' ? 'warning' : phaseInfo.color as any} />
                    </div>

                    {/* Phase Schedule Visual */}
                    <div className="flex gap-1 mb-3">
                      {RTW_PHASES.map((phase) => (
                        <div
                          key={phase.value}
                          className={`flex-1 h-8 rounded flex items-center justify-center text-[0.6rem] font-medium border ${
                            phase.value === plan.current_phase
                              ? 'bg-tempo-600/20 border-tempo-600/40 text-tempo-400'
                              : phase.percent <= phaseInfo.percent
                                ? 'bg-success/10 border-success/20 text-success'
                                : 'bg-canvas border-divider text-t3'
                          }`}
                        >
                          {phase.percent}%
                        </div>
                      ))}
                    </div>

                    {plan.restrictions && (
                      <div className="p-2 bg-canvas rounded border border-divider mb-3">
                        <p className="text-xs text-t3">Restrictions:</p>
                        <p className="text-xs text-t2">{plan.restrictions}</p>
                      </div>
                    )}

                    {/* Medical Clearance */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs">
                        {plan.medical_clearance ? (
                          <>
                            <CheckCircle size={14} className="text-success" />
                            <span className="text-success">Cleared {plan.clearance_date}</span>
                          </>
                        ) : (
                          <>
                            <Clock size={14} className="text-t3" />
                            <span className="text-t3">Awaiting clearance</span>
                          </>
                        )}
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => openEditRtwModal(plan)}>
                        <Edit3 size={12} /> Update
                      </Button>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}

          {/* ODG Benchmark */}
          <Card>
            <h4 className="text-sm font-semibold text-t1 mb-3 flex items-center gap-2">
              <TrendingUp size={16} /> ODG Benchmark Comparison
            </h4>
            <p className="text-xs text-t3 mb-3">Compare your return-to-work timelines against Official Disability Guidelines (ODG) benchmarks.</p>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 bg-canvas rounded-lg text-center border border-divider">
                <p className="text-xs text-t3">Avg Days to Modified Duty</p>
                <p className="text-lg font-bold text-t1">{rtwPlans.length > 0 ? '5.2' : '--'}</p>
                <p className="text-xs text-t3">ODG Benchmark: 3-7 days</p>
              </div>
              <div className="p-3 bg-canvas rounded-lg text-center border border-divider">
                <p className="text-xs text-t3">Avg Days to Full Duty</p>
                <p className="text-lg font-bold text-t1">{rtwPlans.length > 0 ? '28' : '--'}</p>
                <p className="text-xs text-t3">ODG Benchmark: 21-35 days</p>
              </div>
              <div className="p-3 bg-canvas rounded-lg text-center border border-divider">
                <p className="text-xs text-t3">RTW Success Rate</p>
                <p className="text-lg font-bold text-success">{rtwPlans.length > 0 ? '94%' : '--'}</p>
                <p className="text-xs text-t3">Industry Avg: 87%</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ══════════════════════════ EXPERIENCE MOD TAB ══════════════════════════ */}
      {activeTab === 'emr' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <div className="text-center">
                <p className="text-xs text-t3 mb-2">Current EMR</p>
                <p className={`text-4xl font-bold ${currentEMR < 1 ? 'text-success' : 'text-error'}`}>
                  {currentEMR.toFixed(2)}
                </p>
                <p className="text-xs text-t3 mt-2">
                  {currentEMR < 1 ? (
                    <span className="flex items-center justify-center gap-1 text-success"><ArrowDownRight size={14} /> Below industry average</span>
                  ) : (
                    <span className="flex items-center justify-center gap-1 text-error"><ArrowUpRight size={14} /> Above industry average</span>
                  )}
                </p>
              </div>
            </Card>

            <Card>
              <div className="text-center">
                <p className="text-xs text-t3 mb-2">Premium Impact</p>
                <p className={`text-4xl font-bold ${currentEMR < 1 ? 'text-success' : 'text-error'}`}>
                  {currentEMR < 1 ? '-' : '+'}{Math.abs(Math.round((currentEMR - 1) * 100))}%
                </p>
                <p className="text-xs text-t3 mt-2">
                  {currentEMR < 1 ? 'Saving on premiums' : 'Paying above manual rate'}
                </p>
              </div>
            </Card>

            <Card>
              <div className="text-center">
                <p className="text-xs text-t3 mb-2">Open Claims Impact</p>
                <p className="text-4xl font-bold text-warning">{openClaims}</p>
                <p className="text-xs text-t3 mt-2">
                  Claims affecting next year EMR
                </p>
              </div>
            </Card>
          </div>

          {/* EMR Trend */}
          <Card>
            <h4 className="text-sm font-semibold text-t1 mb-4 flex items-center gap-2">
              <TrendingDown size={16} /> 3-Year EMR Trend
            </h4>
            <div className="space-y-3">
              {emrHistory.map((entry) => (
                <div key={entry.year} className="flex items-center gap-4">
                  <p className="text-sm font-medium text-t1 w-12">{entry.year}</p>
                  <div className="flex-1">
                    <div className="h-8 bg-canvas rounded-lg overflow-hidden border border-divider relative">
                      <div
                        className={`h-full rounded-lg transition-all ${entry.emr <= 1 ? 'bg-success/30' : 'bg-error/30'}`}
                        style={{ width: `${Math.min(entry.emr * 50, 100)}%` }}
                      />
                      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-divider" title="1.0 baseline" />
                    </div>
                  </div>
                  <p className={`text-sm font-bold w-12 text-right ${entry.emr <= 1 ? 'text-success' : 'text-error'}`}>
                    {entry.emr.toFixed(2)}
                  </p>
                  <Badge variant={entry.emr <= 1 ? 'success' : 'error'}>{entry.premium_impact}</Badge>
                </div>
              ))}
            </div>
          </Card>

          {/* Premium Impact Calculator */}
          <Card>
            <h4 className="text-sm font-semibold text-t1 mb-4 flex items-center gap-2">
              <Calculator size={16} /> Premium Impact Calculator
            </h4>
            <p className="text-xs text-t3 mb-4">
              Premium = Payroll x Class Rate x EMR. See how your EMR affects costs.
            </p>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 bg-canvas rounded-lg text-center border border-divider">
                <p className="text-xs text-t3">EMR = 0.80</p>
                <p className="text-lg font-bold text-success">20% savings</p>
              </div>
              <div className="p-3 bg-canvas rounded-lg text-center border border-divider">
                <p className="text-xs text-t3">EMR = 1.00</p>
                <p className="text-lg font-bold text-t1">Base rate</p>
              </div>
              <div className="p-3 bg-canvas rounded-lg text-center border border-divider">
                <p className="text-xs text-t3">EMR = 1.20</p>
                <p className="text-lg font-bold text-error">20% surcharge</p>
              </div>
            </div>
          </Card>

          {/* Industry Benchmarks */}
          <Card>
            <h4 className="text-sm font-semibold text-t1 mb-4">Industry EMR Benchmarks</h4>
            <div className="space-y-2">
              {[
                { industry: 'Technology', emr: 0.85 },
                { industry: 'Healthcare', emr: 1.05 },
                { industry: 'Manufacturing', emr: 1.15 },
                { industry: 'Construction', emr: 1.25 },
                { industry: 'Your Organization', emr: currentEMR },
              ].map((row) => (
                <div key={row.industry} className={`flex items-center justify-between p-2 rounded ${row.industry === 'Your Organization' ? 'bg-tempo-600/10 border border-tempo-600/20' : ''}`}>
                  <p className={`text-xs ${row.industry === 'Your Organization' ? 'font-bold text-tempo-400' : 'text-t2'}`}>{row.industry}</p>
                  <Badge variant={row.emr <= 1 ? 'success' : 'error'}>{row.emr.toFixed(2)}</Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ══════════════════════════ POLICIES TAB ══════════════════════════ */}
      {activeTab === 'policies' && (
        <Card padding="none">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>All Policies</CardTitle>
              <Button variant="secondary" size="sm" onClick={openAddPolicyModal}><Plus size={14} /> Add Policy</Button>
            </div>
          </CardHeader>
          {filteredPolicies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 rounded-lg bg-canvas flex items-center justify-center mb-3">
                <ShieldCheck size={24} className="text-t3" />
              </div>
              <p className="text-sm font-medium text-t1 mb-1">No policies yet</p>
              <p className="text-xs text-t3 mb-4 max-w-xs">Add your first policy to track coverage and premiums.</p>
              <Button size="sm" onClick={openAddPolicyModal}><Plus size={14} /> Add Policy</Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-divider bg-canvas">
                    <th className="tempo-th text-left px-6 py-3">Policy #</th>
                    <th className="tempo-th text-left px-4 py-3">Name</th>
                    <th className="tempo-th text-left px-4 py-3">Carrier</th>
                    <th className="tempo-th text-left px-4 py-3">Effective</th>
                    <th className="tempo-th text-left px-4 py-3">Expiry</th>
                    <th className="tempo-th text-right px-4 py-3">Premium</th>
                    <th className="tempo-th text-center px-4 py-3">{tc('status')}</th>
                    <th className="tempo-th text-center px-4 py-3">{tc('actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredPolicies.map((policy: any) => (
                    <tr key={policy.id} className="hover:bg-canvas/50">
                      <td className="px-6 py-3 text-xs font-mono font-medium text-t1">{policy.policy_number}</td>
                      <td className="px-4 py-3 text-xs text-t1 font-medium">{policy.name}</td>
                      <td className="px-4 py-3 text-xs text-t2">{policy.carrier}</td>
                      <td className="px-4 py-3 text-xs text-t2">{policy.effective_date}</td>
                      <td className="px-4 py-3 text-xs text-t2">{policy.expiry_date}</td>
                      <td className="px-4 py-3 text-xs font-semibold text-t1 text-right">{formatCents(policy.premium)}</td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={getStatusVariant(policy.status)}>{policy.status}</Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Button size="sm" variant="ghost" onClick={() => openEditPolicyModal(policy)}>
                          <Edit3 size={12} /> Edit
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* ══════════════════════════ CLASS CODES TAB ══════════════════════════ */}
      {activeTab === 'class-codes' && (
        <Card padding="none">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>NCCI Class Codes</CardTitle>
              <Button variant="secondary" size="sm" onClick={openAddClassCodeModal}><Plus size={14} /> Add Class Code</Button>
            </div>
          </CardHeader>
          {workersCompClassCodes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 rounded-lg bg-canvas flex items-center justify-center mb-3">
                <Briefcase size={24} className="text-t3" />
              </div>
              <p className="text-sm font-medium text-t1 mb-1">No class codes</p>
              <p className="text-xs text-t3 mb-4 max-w-xs">Add NCCI class codes to classify employees and calculate premiums.</p>
              <Button size="sm" onClick={openAddClassCodeModal}><Plus size={14} /> Add Class Code</Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-divider bg-canvas">
                    <th className="tempo-th text-left px-6 py-3">Code</th>
                    <th className="tempo-th text-left px-4 py-3">Description</th>
                    <th className="tempo-th text-right px-4 py-3">Rate/$100</th>
                    <th className="tempo-th text-center px-4 py-3">Employees</th>
                    <th className="tempo-th text-left px-4 py-3">Risk</th>
                    <th className="tempo-th text-center px-4 py-3">{tc('actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {workersCompClassCodes.map((cc: any) => {
                    const riskLevel = cc.rate < 0.5 ? 'Low' : cc.rate < 2.0 ? 'Medium' : 'High'
                    const riskVariant = cc.rate < 0.5 ? 'success' : cc.rate < 2.0 ? 'warning' : 'error'
                    return (
                      <tr key={cc.id || cc.code} className="hover:bg-canvas/50">
                        <td className="px-6 py-3 text-xs font-mono font-semibold text-t1">{cc.code}</td>
                        <td className="px-4 py-3 text-xs text-t1">{cc.description}</td>
                        <td className="px-4 py-3 text-xs font-semibold text-t1 text-right">${cc.rate?.toFixed(2)}</td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Users size={12} className="text-t3" />
                            <span className="text-xs text-t1">{cc.employee_count}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={riskVariant as any}>{riskLevel}</Badge>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Button size="sm" variant="ghost" onClick={() => openEditClassCodeModal(cc)}>
                            <Edit3 size={12} /> Edit
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* ══════════════════════════ PREMIUM CALCULATOR TAB ══════════════════════════ */}
      {activeTab === 'calculator' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Calculator size={20} className="text-tempo-600" />
              <h3 className="text-sm font-semibold text-t1">Premium Calculator</h3>
            </div>
            <p className="text-xs text-t3 mb-4">
              Premium = (Payroll / 100) x Class Rate x EMR
            </p>
            <div className="space-y-4">
              <Select
                label="Class Code"
                value={calcClassCode}
                onChange={(e) => { setCalcClassCode(e.target.value); setCalcResult(null) }}
                options={[
                  { value: '', label: 'Select a class code...' },
                  ...workersCompClassCodes.map((cc: any) => ({
                    value: cc.code,
                    label: `${cc.code} - ${cc.description} ($${cc.rate?.toFixed(2)}/$100)`,
                  })),
                ]}
              />
              <Input
                label="Annual Payroll ($)"
                type="number"
                placeholder="e.g. 500000"
                value={calcPayroll}
                onChange={(e) => { setCalcPayroll(e.target.value); setCalcResult(null) }}
              />
              <Input
                label="Experience Modification Rate (EMR)"
                type="number"
                step="0.01"
                placeholder="e.g. 1.00"
                value={calcEMR}
                onChange={(e) => { setCalcEMR(e.target.value); setCalcResult(null) }}
              />
              <Button onClick={calculatePremium} className="w-full">
                <Calculator size={14} /> Calculate Premium
              </Button>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-2 mb-4">
              <DollarSign size={20} className="text-tempo-600" />
              <h3 className="text-sm font-semibold text-t1">Result</h3>
            </div>
            {calcResult !== null ? (
              <div className="space-y-4">
                <div className="p-4 bg-canvas rounded-lg border border-divider">
                  <p className="text-xs text-t3 mb-1">Estimated Annual Premium</p>
                  <p className="text-2xl font-bold text-tempo-600">{formatCents(calcResult)}</p>
                </div>
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-t1">Breakdown</h4>
                  <div className="p-3 bg-canvas rounded-lg font-mono text-xs space-y-1">
                    <p className="text-t2">Payroll: <span className="text-t1 font-semibold">${Number(calcPayroll).toLocaleString()}</span></p>
                    <p className="text-t2">Rate: <span className="text-t1 font-semibold">${workersCompClassCodes.find((c: any) => c.code === calcClassCode)?.rate?.toFixed(2)} / $100</span></p>
                    <p className="text-t2">EMR: <span className="text-t1 font-semibold">{calcEMR}</span></p>
                    <div className="border-t border-divider my-2" />
                    <p className="text-t1 font-semibold">= {formatCents(calcResult)}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Calculator size={24} className="text-t3 mb-2" />
                <p className="text-xs text-t3">Select a class code and enter payroll to calculate.</p>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ══════════════════════════ AUDITS TAB ══════════════════════════ */}
      {activeTab === 'audits' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-t1 flex items-center gap-2">
              <ClipboardList size={18} /> Audit History
            </h3>
            <Button variant="secondary" size="sm" onClick={openScheduleAuditModal}><Plus size={14} /> Schedule Audit</Button>
          </div>
          {workersCompAudits.length === 0 ? (
            <Card className="py-16 text-center">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-lg bg-canvas flex items-center justify-center mb-3">
                  <ClipboardList size={24} className="text-t3" />
                </div>
                <p className="text-sm font-medium text-t1 mb-1">No audits scheduled</p>
                <p className="text-xs text-t3 mb-4 max-w-xs">Schedule premium audits to verify payroll and classification accuracy.</p>
                <Button size="sm" onClick={openScheduleAuditModal}><Plus size={14} /> Schedule Audit</Button>
              </div>
            </Card>
          ) : (
            <>
              {workersCompAudits.map((audit: any) => (
                <Card key={audit.id}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        audit.status === 'completed' ? 'bg-success/10' : 'bg-info/10'
                      }`}>
                        {audit.status === 'completed' ? <CheckCircle size={20} className="text-success" /> : <Clock size={20} className="text-info" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-semibold text-t1">Premium Audit</p>
                          <Badge variant={getStatusVariant(audit.status)}>{audit.status}</Badge>
                        </div>
                        <p className="text-xs text-t3">
                          Period: {audit.period} | Auditor: {audit.auditor} | Date: {audit.audit_date}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {audit.adjustment_amount !== 0 && (
                        <span className={`text-sm font-semibold ${audit.adjustment_amount < 0 ? 'text-success' : 'text-error'}`}>
                          {audit.adjustment_amount < 0 ? '-' : '+'}{formatCents(Math.abs(audit.adjustment_amount))}
                        </span>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => openAuditStatusModal(audit)}>
                        <Edit3 size={12} /> Update
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </>
          )}
        </div>
      )}

      {/* ══════════════════════════ INCIDENT DETAIL MODAL ══════════════════════════ */}
      <Modal open={!!viewingIncident} onClose={() => setViewingIncident(null)} title="Incident Report Detail" size="lg">
        {viewingIncident && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-t3">Employee</p>
                <p className="text-sm font-medium text-t1">{getEmployeeName(viewingIncident.employee_id) || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-xs text-t3">Status</p>
                <Badge variant={getStatusVariant(viewingIncident.status)}>{viewingIncident.status?.replace(/_/g, ' ')}</Badge>
              </div>
              <div>
                <p className="text-xs text-t3">Date / Time</p>
                <p className="text-sm text-t1">{viewingIncident.incident_date} {viewingIncident.incident_time}</p>
              </div>
              <div>
                <p className="text-xs text-t3">Location</p>
                <p className="text-sm text-t1">{viewingIncident.location}</p>
              </div>
              <div>
                <p className="text-xs text-t3">Injury Type</p>
                <p className="text-sm text-t1">{viewingIncident.injury_type?.replace(/_/g, ' ')}</p>
              </div>
              <div>
                <p className="text-xs text-t3">Body Part</p>
                <p className="text-sm text-t1">{viewingIncident.body_part}</p>
              </div>
              <div>
                <p className="text-xs text-t3">Severity</p>
                <Badge variant={getSeverityVariant(viewingIncident.severity)}>{viewingIncident.severity?.replace(/_/g, ' ')}</Badge>
              </div>
              <div>
                <p className="text-xs text-t3">OSHA Recordable</p>
                <Badge variant={viewingIncident.is_osha_recordable ? 'error' : 'default'}>
                  {viewingIncident.is_osha_recordable ? 'Yes - Recordable' : 'No'}
                </Badge>
              </div>
            </div>
            <div>
              <p className="text-xs text-t3 mb-1">Description</p>
              <p className="text-sm text-t2 bg-canvas p-3 rounded border border-divider">{viewingIncident.description}</p>
            </div>
            {viewingIncident.witnesses && (
              <div>
                <p className="text-xs text-t3 mb-1">Witnesses</p>
                <p className="text-sm text-t2">{viewingIncident.witnesses}</p>
              </div>
            )}
            {viewingIncident.is_osha_recordable && (
              <div className="p-3 bg-warning/5 border border-warning/20 rounded-lg">
                <p className="text-xs font-semibold text-warning mb-1">OSHA Classification</p>
                <p className="text-sm text-t1">{viewingIncident.osha_classification?.replace(/_/g, ' ')}</p>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <p className="text-xs text-t3">Days Away</p>
                    <p className="text-sm font-bold text-t1">{viewingIncident.days_away || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-t3">Days Restricted</p>
                    <p className="text-sm font-bold text-t1">{viewingIncident.days_restricted || 0}</p>
                  </div>
                </div>
              </div>
            )}

            {/* FROI Summary */}
            <div className="p-3 bg-canvas rounded-lg border border-divider">
              <p className="text-xs font-semibold text-t1 mb-2">First Report of Injury (FROI)</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <p className="text-t3">Employer Name: <span className="text-t1">Your Organization</span></p>
                <p className="text-t3">Date of Injury: <span className="text-t1">{viewingIncident.incident_date}</span></p>
                <p className="text-t3">Employee: <span className="text-t1">{getEmployeeName(viewingIncident.employee_id)}</span></p>
                <p className="text-t3">Nature of Injury: <span className="text-t1">{viewingIncident.injury_type?.replace(/_/g, ' ')}</span></p>
                <p className="text-t3">Body Part: <span className="text-t1">{viewingIncident.body_part}</span></p>
                <p className="text-t3">Cause: <span className="text-t1">{viewingIncident.description?.slice(0, 50)}</span></p>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              {viewingIncident.status === 'reported' && (
                <Button size="sm" variant="secondary" onClick={() => { updateIncidentReport(viewingIncident.id, { status: 'under_review' }); setViewingIncident({ ...viewingIncident, status: 'under_review' }) }}>
                  <RefreshCw size={12} /> Mark Under Review
                </Button>
              )}
              {(viewingIncident.status === 'reported' || viewingIncident.status === 'under_review') && (
                <Button size="sm" onClick={() => { openFileClaimFromIncident(viewingIncident); setViewingIncident(null) }}>
                  <FileText size={12} /> File Claim
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* ══════════════════════════ INCIDENT REPORT MODAL ══════════════════════════ */}
      <Modal open={showIncidentModal} onClose={() => setShowIncidentModal(false)} title="Report Workplace Incident">
        <div className="space-y-4">
          <Select
            label="Employee"
            value={incidentForm.employee_id}
            onChange={(e) => setIncidentForm({ ...incidentForm, employee_id: e.target.value })}
            options={[
              { value: '', label: 'Select employee...' },
              ...employees.slice(0, 50).map((emp: any) => ({
                value: emp.id,
                label: emp.profile?.full_name || emp.full_name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || emp.id,
              })),
            ]}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Incident Date" type="date" value={incidentForm.incident_date} onChange={(e) => setIncidentForm({ ...incidentForm, incident_date: e.target.value })} />
            <Input label="Time" type="time" value={incidentForm.incident_time} onChange={(e) => setIncidentForm({ ...incidentForm, incident_time: e.target.value })} />
          </div>
          <Input label="Location" placeholder="e.g. Warehouse floor, Office 301" value={incidentForm.location} onChange={(e) => setIncidentForm({ ...incidentForm, location: e.target.value })} />
          <Textarea label="Description" placeholder="Describe what happened, how the injury occurred..." rows={3} value={incidentForm.description} onChange={(e) => setIncidentForm({ ...incidentForm, description: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Injury Type"
              value={incidentForm.injury_type}
              onChange={(e) => setIncidentForm({ ...incidentForm, injury_type: e.target.value })}
              options={[{ value: '', label: 'Select...' }, ...INJURY_TYPES]}
            />
            <Select
              label="Body Part"
              value={incidentForm.body_part}
              onChange={(e) => setIncidentForm({ ...incidentForm, body_part: e.target.value })}
              options={[{ value: '', label: 'Select...' }, ...BODY_PARTS.map(bp => ({ value: bp, label: bp }))]}
            />
          </div>
          <Select
            label="Severity"
            value={incidentForm.severity}
            onChange={(e) => setIncidentForm({ ...incidentForm, severity: e.target.value })}
            options={SEVERITY_OPTIONS}
          />
          {isOshaRecordable(incidentForm.severity) && (
            <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle size={14} className="text-warning" />
                <p className="text-xs font-semibold text-warning">OSHA Recordable</p>
              </div>
              <p className="text-xs text-t2">
                This incident meets OSHA recordability criteria and will be added to the OSHA 300 Log.
                Classification: <strong>{autoClassify(incidentForm.severity).replace(/_/g, ' ')}</strong>
              </p>
            </div>
          )}
          <Input label="Witnesses" placeholder="Names of witnesses (optional)" value={incidentForm.witnesses} onChange={(e) => setIncidentForm({ ...incidentForm, witnesses: e.target.value })} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowIncidentModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitIncident} disabled={saving}>
              <FileWarning size={14} /> {saving ? 'Saving...' : 'Submit Report'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Policy Modal ── */}
      <Modal open={showPolicyModal} onClose={() => setShowPolicyModal(false)} title={editingPolicy ? 'Edit Policy' : 'Add Policy'}>
        <div className="space-y-4">
          <Input label="Policy Name" value={policyForm.name} onChange={(e) => setPolicyForm({ ...policyForm, name: e.target.value })} />
          <Input label="Carrier" value={policyForm.carrier} onChange={(e) => setPolicyForm({ ...policyForm, carrier: e.target.value })} />
          <Input label="Policy Number" value={policyForm.policy_number} onChange={(e) => setPolicyForm({ ...policyForm, policy_number: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Effective Date" type="date" value={policyForm.effective_date} onChange={(e) => setPolicyForm({ ...policyForm, effective_date: e.target.value })} />
            <Input label="Expiration Date" type="date" value={policyForm.expiration_date} onChange={(e) => setPolicyForm({ ...policyForm, expiration_date: e.target.value })} />
          </div>
          <Input label="Annual Premium ($)" type="number" value={policyForm.premium} onChange={(e) => setPolicyForm({ ...policyForm, premium: e.target.value })} />
          <Select label="Status" value={policyForm.status} onChange={(e) => setPolicyForm({ ...policyForm, status: e.target.value })} options={[
            { value: 'active', label: 'Active' }, { value: 'pending', label: 'Pending' },
            { value: 'expired', label: 'Expired' }, { value: 'cancelled', label: 'Cancelled' },
          ]} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowPolicyModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitPolicy} disabled={saving}>{saving ? 'Saving...' : editingPolicy ? 'Update' : 'Add Policy'}</Button>
          </div>
        </div>
      </Modal>

      {/* ── Claim Status Modal ── */}
      <Modal open={showClaimStatusModal} onClose={() => setShowClaimStatusModal(false)} title="Update Claim Status">
        <div className="space-y-4">
          {editingClaim && (
            <div className="p-3 bg-canvas rounded-lg border border-divider">
              <p className="text-sm font-semibold text-t1">{editingClaim.employee_name}</p>
              <p className="text-xs text-t3">Incident: {editingClaim.incident_date}</p>
            </div>
          )}
          <Select label="New Status" value={claimStatusForm.status} onChange={(e) => setClaimStatusForm({ status: e.target.value })} options={[
            { value: 'open', label: 'Open' }, { value: 'investigating', label: 'Investigating' },
            { value: 'approved', label: 'Approved' }, { value: 'denied', label: 'Denied' }, { value: 'closed', label: 'Closed' },
          ]} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowClaimStatusModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitClaimStatus} disabled={saving}>{saving ? 'Saving...' : 'Update'}</Button>
          </div>
        </div>
      </Modal>

      {/* ── Class Code Modal ── */}
      <Modal open={showClassCodeModal} onClose={() => setShowClassCodeModal(false)} title={editingClassCode ? 'Edit Class Code' : 'Add Class Code'}>
        <div className="space-y-4">
          <Input label="Code" placeholder="e.g. 8810" value={classCodeForm.code} onChange={(e) => setClassCodeForm({ ...classCodeForm, code: e.target.value })} />
          <Input label="Description" placeholder="e.g. Clerical Office Employees" value={classCodeForm.description} onChange={(e) => setClassCodeForm({ ...classCodeForm, description: e.target.value })} />
          <Input label="Rate per $100" type="number" step="0.01" value={classCodeForm.rate} onChange={(e) => setClassCodeForm({ ...classCodeForm, rate: e.target.value })} />
          <Input label="Industry" placeholder="e.g. Office/Clerical" value={classCodeForm.industry} onChange={(e) => setClassCodeForm({ ...classCodeForm, industry: e.target.value })} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowClassCodeModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitClassCode} disabled={saving}>{saving ? 'Saving...' : editingClassCode ? 'Update' : 'Add'}</Button>
          </div>
        </div>
      </Modal>

      {/* ── Audit Modal ── */}
      <Modal open={showAuditModal} onClose={() => setShowAuditModal(false)} title="Schedule Audit">
        <div className="space-y-4">
          <Select label="Type" value={auditForm.audit_type} onChange={(e) => setAuditForm({ ...auditForm, audit_type: e.target.value })} options={[
            { value: 'annual', label: 'Annual' }, { value: 'interim', label: 'Interim' },
            { value: 'final', label: 'Final' }, { value: 'payroll', label: 'Payroll Verification' },
          ]} />
          <Input label="Date" type="date" value={auditForm.scheduled_date} onChange={(e) => setAuditForm({ ...auditForm, scheduled_date: e.target.value })} />
          <Input label="Auditor" value={auditForm.auditor} onChange={(e) => setAuditForm({ ...auditForm, auditor: e.target.value })} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowAuditModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitAudit} disabled={saving}>{saving ? 'Saving...' : 'Schedule'}</Button>
          </div>
        </div>
      </Modal>

      {/* ── Audit Status Modal ── */}
      <Modal open={showAuditStatusModal} onClose={() => setShowAuditStatusModal(false)} title="Update Audit Status">
        <div className="space-y-4">
          <Select label="Status" value={auditStatusForm.status} onChange={(e) => setAuditStatusForm({ status: e.target.value })} options={[
            { value: 'scheduled', label: 'Scheduled' }, { value: 'in_progress', label: 'In Progress' },
            { value: 'completed', label: 'Completed' }, { value: 'cancelled', label: 'Cancelled' },
          ]} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowAuditStatusModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitAuditStatus} disabled={saving}>{saving ? 'Saving...' : 'Update'}</Button>
          </div>
        </div>
      </Modal>

      {/* ── RTW Plan Modal ── */}
      <Modal open={showRtwModal} onClose={() => setShowRtwModal(false)} title={editingRtw ? 'Update Return-to-Work Plan' : 'Create Return-to-Work Plan'}>
        <div className="space-y-4">
          <Select
            label="Employee"
            value={rtwForm.employee_id}
            onChange={(e) => setRtwForm({ ...rtwForm, employee_id: e.target.value })}
            options={[
              { value: '', label: 'Select employee...' },
              ...employees.slice(0, 50).map((emp: any) => ({
                value: emp.id,
                label: emp.profile?.full_name || emp.full_name || emp.id,
              })),
            ]}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Start Date" type="date" value={rtwForm.start_date} onChange={(e) => setRtwForm({ ...rtwForm, start_date: e.target.value })} />
            <Input label="Target Full Duty Date" type="date" value={rtwForm.target_full_duty_date} onChange={(e) => setRtwForm({ ...rtwForm, target_full_duty_date: e.target.value })} />
          </div>
          <Select
            label="Current Phase"
            value={rtwForm.current_phase}
            onChange={(e) => setRtwForm({ ...rtwForm, current_phase: e.target.value })}
            options={RTW_PHASES.map(p => ({ value: p.value, label: `${p.label} (${p.percent}%)` }))}
          />
          <Textarea label="Restrictions" placeholder="e.g. No lifting over 10 lbs, seated work only..." rows={3} value={rtwForm.restrictions} onChange={(e) => setRtwForm({ ...rtwForm, restrictions: e.target.value })} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowRtwModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitRtwPlan} disabled={saving}>
              <HeartPulse size={14} /> {saving ? 'Saving...' : editingRtw ? 'Update Plan' : 'Create Plan'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Confirmation Modal ── */}
      <Modal open={!!confirmAction} onClose={() => setConfirmAction(null)} title={confirmAction?.title || 'Confirm'}>
        <div className="space-y-4">
          <p className="text-sm text-t2">{confirmAction?.message}</p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setConfirmAction(null)}>{tc('cancel')}</Button>
            <Button variant="danger" onClick={() => { confirmAction?.onConfirm(); setConfirmAction(null) }}>
              <AlertTriangle size={14} /> Confirm
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
