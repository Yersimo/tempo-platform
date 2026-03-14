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
import { ShieldCheck, FileText, DollarSign, Plus, AlertTriangle, CheckCircle, Clock, Calculator, Users, Briefcase, Search, ClipboardList, Edit3, Inbox } from 'lucide-react'
import { useTempo } from '@/lib/store'
import { PageSkeleton } from '@/components/ui/page-skeleton'

const INJURY_TYPES = [
  { value: 'sprain_strain', label: 'Sprain/Strain' },
  { value: 'laceration', label: 'Laceration' },
  { value: 'fracture', label: 'Fracture' },
  { value: 'rsi', label: 'RSI (Repetitive Strain)' },
  { value: 'contusion', label: 'Contusion/Bruise' },
  { value: 'burn', label: 'Burn' },
  { value: 'other', label: 'Other' },
]

// ── Page Component ────────────────────────────────────────────────────────────

export default function WorkersCompPage() {
  const tc = useTranslations('common')
  const {
    employees,
    workersCompPolicies, workersCompClaims, workersCompClassCodes, workersCompAudits,
    addWorkersCompPolicy, updateWorkersCompPolicy,
    addWorkersCompClaim, updateWorkersCompClaim,
    addWorkersCompClassCode, updateWorkersCompClassCode,
    addWorkersCompAudit, updateWorkersCompAudit,
    ensureModulesLoaded,
    addToast,
  } = useTempo()

  const [pageLoading, setPageLoading] = useState(true)

  useEffect(() => {
    ensureModulesLoaded?.(['workersCompPolicies', 'workersCompClaims', 'workersCompClassCodes', 'workersCompAudits'])?.then?.(() => setPageLoading(false))?.catch?.(() => setPageLoading(false))
  }, [ensureModulesLoaded])

  useEffect(() => { const t = setTimeout(() => setPageLoading(false), 2000); return () => clearTimeout(t) }, [])

  const [saving, setSaving] = useState(false)
  const [confirmAction, setConfirmAction] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null)

  const [activeTab, setActiveTab] = useState('policies')
  const [showClaimModal, setShowClaimModal] = useState(false)
  const [claimForm, setClaimForm] = useState({
    employee_name: '',
    incident_date: '',
    description: '',
    injury_type: '',
    body_part: '',
    reserve_amount: '',
  })

  // Policy modal state
  const [showPolicyModal, setShowPolicyModal] = useState(false)
  const [editingPolicy, setEditingPolicy] = useState<any>(null)
  const [policyForm, setPolicyForm] = useState({
    name: '',
    carrier: '',
    policy_number: '',
    effective_date: '',
    expiration_date: '',
    premium: '',
    status: 'active',
  })

  // Claim status update modal state
  const [showClaimStatusModal, setShowClaimStatusModal] = useState(false)
  const [editingClaim, setEditingClaim] = useState<any>(null)
  const [claimStatusForm, setClaimStatusForm] = useState({ status: '' })

  // Class code modal state
  const [showClassCodeModal, setShowClassCodeModal] = useState(false)
  const [editingClassCode, setEditingClassCode] = useState<any>(null)
  const [classCodeForm, setClassCodeForm] = useState({
    code: '',
    description: '',
    rate: '',
    industry: '',
  })

  // Audit modal state
  const [showAuditModal, setShowAuditModal] = useState(false)
  const [showAuditStatusModal, setShowAuditStatusModal] = useState(false)
  const [editingAudit, setEditingAudit] = useState<any>(null)
  const [auditForm, setAuditForm] = useState({
    audit_type: 'annual',
    scheduled_date: '',
    auditor: '',
    status: 'scheduled',
  })
  const [auditStatusForm, setAuditStatusForm] = useState({ status: '' })

  // Premium calculator state
  const [calcClassCode, setCalcClassCode] = useState('')
  const [calcPayroll, setCalcPayroll] = useState('')
  const [calcResult, setCalcResult] = useState<number | null>(null)

  // ── Computed Stats ──

  const activePolicies = workersCompPolicies.filter(p => p.status === 'active').length
  const openClaims = workersCompClaims.filter(c => c.status === 'open').length
  const totalReserves = workersCompClaims.reduce((sum, c) => sum + c.reserve_amount, 0)
  const ytdPaid = workersCompClaims.reduce((sum, c) => sum + c.paid_amount, 0)

  const tabs = [
    { id: 'policies', label: 'Policies', count: workersCompPolicies.length },
    { id: 'claims', label: 'Claims', count: workersCompClaims.length },
    { id: 'class-codes', label: 'Class Codes', count: workersCompClassCodes.length },
    { id: 'calculator', label: 'Premium Calculator' },
    { id: 'audits', label: 'Audits', count: workersCompAudits.length },
  ]

  // ── Handlers ──

  function openFileClaimModal() {
    setClaimForm({
      employee_name: '',
      incident_date: new Date().toISOString().split('T')[0],
      description: '',
      injury_type: '',
      body_part: '',
      reserve_amount: '',
    })
    setShowClaimModal(true)
  }

  async function submitClaim() {
    if (!claimForm.employee_name) { addToast('Employee name is required', 'error'); return }
    if (!claimForm.incident_date) { addToast('Incident date is required', 'error'); return }
    if (!claimForm.injury_type) { addToast('Injury type is required', 'error'); return }
    if (!claimForm.description) { addToast('Incident description is required', 'error'); return }
    setSaving(true)
    try {
      const activePolicyId = workersCompPolicies.find((p: any) => p.status === 'active')?.id || ''
      addWorkersCompClaim({
        policy_id: activePolicyId,
        employee_name: claimForm.employee_name,
        incident_date: claimForm.incident_date,
        description: claimForm.description,
        injury_type: claimForm.injury_type,
        body_part: claimForm.body_part,
        reserve_amount: Number(claimForm.reserve_amount) * 100 || 0,
        paid_amount: 0,
      })
      setShowClaimModal(false)
      addToast('Claim filed successfully')
    } finally { setSaving(false) }
  }

  // ── Policy Handlers ──

  function openAddPolicyModal() {
    setEditingPolicy(null)
    setPolicyForm({
      name: '',
      carrier: '',
      policy_number: '',
      effective_date: new Date().toISOString().split('T')[0],
      expiration_date: '',
      premium: '',
      status: 'active',
    })
    setShowPolicyModal(true)
  }

  function openEditPolicyModal(policy: any) {
    setEditingPolicy(policy)
    setPolicyForm({
      name: policy.name || '',
      carrier: policy.carrier || '',
      policy_number: policy.policy_number || '',
      effective_date: policy.effective_date || '',
      expiration_date: policy.expiry_date || policy.expiration_date || '',
      premium: String((policy.premium || 0) / 100),
      status: policy.status || 'active',
    })
    setShowPolicyModal(true)
  }

  async function submitPolicy() {
    if (!policyForm.name) { addToast('Policy name is required', 'error'); return }
    if (!policyForm.carrier) { addToast('Carrier is required', 'error'); return }
    if (!policyForm.policy_number) { addToast('Policy number is required', 'error'); return }
    if (!policyForm.effective_date) { addToast('Effective date is required', 'error'); return }
    setSaving(true)
    try {
      const payload = {
        name: policyForm.name,
        carrier: policyForm.carrier,
        policy_number: policyForm.policy_number,
        effective_date: policyForm.effective_date,
        expiry_date: policyForm.expiration_date,
        premium: Number(policyForm.premium) * 100 || 0,
        status: policyForm.status,
        covered_employees: employees.length,
      }
      if (editingPolicy) {
        updateWorkersCompPolicy(editingPolicy.id, payload)
        addToast('Policy updated successfully')
      } else {
        addWorkersCompPolicy(payload)
        addToast('Policy added successfully')
      }
      setShowPolicyModal(false)
    } finally { setSaving(false) }
  }

  // ── Claim Status Handlers ──

  function openClaimStatusModal(claim: any) {
    setEditingClaim(claim)
    setClaimStatusForm({ status: claim.status })
    setShowClaimStatusModal(true)
  }

  function submitClaimStatus() {
    if (!editingClaim || !claimStatusForm.status) { addToast('Please select a status', 'error'); return }
    const destructive = claimStatusForm.status === 'denied' || claimStatusForm.status === 'closed'
    const doUpdate = () => {
      setSaving(true)
      try {
        updateWorkersCompClaim(editingClaim.id, { status: claimStatusForm.status })
        setShowClaimStatusModal(false)
        addToast('Claim status updated')
      } finally { setSaving(false) }
    }
    if (destructive) {
      setConfirmAction({
        title: claimStatusForm.status === 'denied' ? 'Deny Claim' : 'Close Claim',
        message: `Are you sure you want to ${claimStatusForm.status === 'denied' ? 'deny' : 'close'} the claim for ${editingClaim.employee_name}? This action cannot be easily undone.`,
        onConfirm: doUpdate,
      })
    } else {
      doUpdate()
    }
  }

  // ── Class Code Handlers ──

  function openAddClassCodeModal() {
    setEditingClassCode(null)
    setClassCodeForm({ code: '', description: '', rate: '', industry: '' })
    setShowClassCodeModal(true)
  }

  function openEditClassCodeModal(cc: any) {
    setEditingClassCode(cc)
    setClassCodeForm({
      code: cc.code || '',
      description: cc.description || '',
      rate: String(cc.rate || ''),
      industry: cc.industry || '',
    })
    setShowClassCodeModal(true)
  }

  async function submitClassCode() {
    if (!classCodeForm.code) { addToast('Class code is required', 'error'); return }
    if (!classCodeForm.description) { addToast('Description is required', 'error'); return }
    if (!classCodeForm.rate || Number(classCodeForm.rate) <= 0) { addToast('A valid rate is required', 'error'); return }
    setSaving(true)
    try {
      const payload = {
        code: classCodeForm.code,
        description: classCodeForm.description,
        rate: Number(classCodeForm.rate),
        industry: classCodeForm.industry,
        employee_count: 0,
      }
      if (editingClassCode) {
        updateWorkersCompClassCode(editingClassCode.id, payload)
        addToast('Class code updated')
      } else {
        addWorkersCompClassCode(payload)
        addToast('Class code added')
      }
      setShowClassCodeModal(false)
    } finally { setSaving(false) }
  }

  // ── Audit Handlers ──

  function openScheduleAuditModal() {
    setEditingAudit(null)
    setAuditForm({
      audit_type: 'annual',
      scheduled_date: '',
      auditor: '',
      status: 'scheduled',
    })
    setShowAuditModal(true)
  }

  async function submitAudit() {
    if (!auditForm.scheduled_date) { addToast('Scheduled date is required', 'error'); return }
    if (!auditForm.auditor) { addToast('Auditor name is required', 'error'); return }
    setSaving(true)
    try {
      addWorkersCompAudit({
        audit_type: auditForm.audit_type,
        audit_date: auditForm.scheduled_date,
        period: `${new Date().getFullYear()}`,
        auditor: auditForm.auditor,
        status: auditForm.status,
        findings: '',
        adjustment_amount: 0,
      })
      setShowAuditModal(false)
      addToast('Audit scheduled successfully')
    } finally { setSaving(false) }
  }

  function openAuditStatusModal(audit: any) {
    setEditingAudit(audit)
    setAuditStatusForm({ status: audit.status })
    setShowAuditStatusModal(true)
  }

  function submitAuditStatus() {
    if (!editingAudit || !auditStatusForm.status) { addToast('Please select a status', 'error'); return }
    const destructive = auditStatusForm.status === 'cancelled'
    const doUpdate = () => {
      setSaving(true)
      try {
        updateWorkersCompAudit(editingAudit.id, { status: auditStatusForm.status })
        setShowAuditStatusModal(false)
        addToast('Audit status updated')
      } finally { setSaving(false) }
    }
    if (destructive) {
      setConfirmAction({
        title: 'Cancel Audit',
        message: `Are you sure you want to cancel the audit by ${editingAudit.auditor}? This action cannot be easily undone.`,
        onConfirm: doUpdate,
      })
    } else {
      doUpdate()
    }
  }

  function calculatePremium() {
    const selectedCode = workersCompClassCodes.find(c => c.code === calcClassCode)
    if (!selectedCode || !calcPayroll) return
    const payrollNum = Number(calcPayroll)
    const premium = (payrollNum / 100) * selectedCode.rate
    setCalcResult(Math.round(premium * 100)) // store in cents
  }

  function formatCents(cents: number): string {
    return `$${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  function getClaimStatusVariant(status: string): 'success' | 'error' | 'warning' | 'info' | 'default' {
    switch (status) {
      case 'open': return 'warning'
      case 'closed': return 'success'
      case 'denied': return 'error'
      default: return 'default'
    }
  }

  function getPolicyStatusVariant(status: string): 'success' | 'error' | 'warning' | 'info' | 'default' {
    switch (status) {
      case 'active': return 'success'
      case 'expired': return 'error'
      case 'pending': return 'warning'
      default: return 'default'
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  if (pageLoading) {
    return (
      <>
        <Header
          title="Workers' Compensation"
          subtitle="Policies, claims & class codes"
          actions={<Button size="sm" disabled><Plus size={14} /> File Claim</Button>}
        />
        <div className="p-6"><PageSkeleton /></div>
      </>
    )
  }

  return (
    <>
      <Header
        title="Workers' Compensation"
        subtitle="Policies, claims & class codes"
        actions={
          <Button size="sm" onClick={openFileClaimModal}>
            <Plus size={14} /> File Claim
          </Button>
        }
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Active Policies"
          value={activePolicies}
          icon={<ShieldCheck size={20} />}
        />
        <StatCard
          label="Open Claims"
          value={openClaims}
          icon={<AlertTriangle size={20} />}
          change={`${openClaims} pending`}
          changeType="negative"
        />
        <StatCard
          label="Total Reserves"
          value={formatCents(totalReserves)}
          icon={<DollarSign size={20} />}
        />
        <StatCard
          label="YTD Paid"
          value={formatCents(ytdPaid)}
          icon={<FileText size={20} />}
          change="All claims"
          changeType="neutral"
        />
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} className="mb-6" />

      {/* ── Policies Tab ── */}
      {activeTab === 'policies' && (
        <Card padding="none">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>All Policies</CardTitle>
              <Button variant="secondary" size="sm" onClick={openAddPolicyModal}>
                <Plus size={14} /> Add Policy
              </Button>
            </div>
          </CardHeader>
          {workersCompPolicies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 rounded-lg bg-canvas flex items-center justify-center mb-3">
                <ShieldCheck size={24} className="text-t3" />
              </div>
              <p className="text-sm font-medium text-t1 mb-1">No policies yet</p>
              <p className="text-xs text-t3 mb-4 max-w-xs">Add your first workers&apos; compensation policy to start tracking coverage and premiums.</p>
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
                  <th className="tempo-th text-center px-4 py-3">Covered Employees</th>
                  <th className="tempo-th text-center px-4 py-3">{tc('status')}</th>
                  <th className="tempo-th text-center px-4 py-3">{tc('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {workersCompPolicies.map(policy => (
                  <tr key={policy.id} className="hover:bg-canvas/50">
                    <td className="px-6 py-3 text-xs font-mono font-medium text-t1">{policy.policy_number}</td>
                    <td className="px-4 py-3 text-xs text-t1 font-medium">{policy.name}</td>
                    <td className="px-4 py-3 text-xs text-t2">{policy.carrier}</td>
                    <td className="px-4 py-3 text-xs text-t2">{policy.effective_date}</td>
                    <td className="px-4 py-3 text-xs text-t2">{policy.expiry_date}</td>
                    <td className="px-4 py-3 text-xs font-semibold text-t1 text-right">{formatCents(policy.premium)}</td>
                    <td className="px-4 py-3 text-xs text-t2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Users size={12} className="text-t3" />
                        {policy.covered_employees}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={getPolicyStatusVariant(policy.status)}>
                        {policy.status}
                      </Badge>
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

      {/* ── Claims Tab ── */}
      {activeTab === 'claims' && (
        <Card padding="none">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>All Claims</CardTitle>
              <Button variant="secondary" size="sm" onClick={openFileClaimModal}>
                <Plus size={14} /> File Claim
              </Button>
            </div>
          </CardHeader>
          {workersCompClaims.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 rounded-lg bg-canvas flex items-center justify-center mb-3">
                <FileText size={24} className="text-t3" />
              </div>
              <p className="text-sm font-medium text-t1 mb-1">No claims filed</p>
              <p className="text-xs text-t3 mb-4 max-w-xs">No workers&apos; compensation claims have been filed yet. Use the button above to file a new claim.</p>
              <Button size="sm" onClick={openFileClaimModal}><Plus size={14} /> File Claim</Button>
            </div>
          ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-divider bg-canvas">
                  <th className="tempo-th text-left px-6 py-3">Employee</th>
                  <th className="tempo-th text-left px-4 py-3">Incident Date</th>
                  <th className="tempo-th text-left px-4 py-3">Injury Type</th>
                  <th className="tempo-th text-left px-4 py-3">Body Part</th>
                  <th className="tempo-th text-center px-4 py-3">{tc('status')}</th>
                  <th className="tempo-th text-right px-4 py-3">Reserve</th>
                  <th className="tempo-th text-right px-4 py-3">Paid</th>
                  <th className="tempo-th text-left px-4 py-3">Filed Date</th>
                  <th className="tempo-th text-center px-4 py-3">{tc('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {workersCompClaims.map(claim => {
                  const paidPct = claim.reserve_amount > 0 ? Math.round((claim.paid_amount / claim.reserve_amount) * 100) : 0
                  return (
                    <tr key={claim.id} className="hover:bg-canvas/50">
                      <td className="px-6 py-3">
                        <div>
                          <p className="text-xs font-medium text-t1">{claim.employee_name}</p>
                          <p className="text-xs text-t3 max-w-[180px] truncate">{claim.description}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-t2">{claim.incident_date}</td>
                      <td className="px-4 py-3 text-xs text-t2">{claim.injury_type}</td>
                      <td className="px-4 py-3 text-xs text-t2">{claim.body_part}</td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={getClaimStatusVariant(claim.status)}>
                          {claim.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold text-t1 text-right">{formatCents(claim.reserve_amount)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="min-w-[100px]">
                          <p className="text-xs font-semibold text-t1">{formatCents(claim.paid_amount)}</p>
                          <Progress value={paidPct} color={paidPct > 80 ? 'warning' : 'orange'} className="mt-1" />
                          <p className="text-[0.6rem] text-t3 mt-0.5">{paidPct}% of reserve</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-t2">{claim.filed_date}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex gap-1 justify-center">
                          <Button size="sm" variant="secondary" onClick={() => openClaimStatusModal(claim)}>
                            <Edit3 size={12} /> Update Status
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

      {/* ── Class Codes Tab ── */}
      {activeTab === 'class-codes' && (
        <Card padding="none">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>NCCI Class Codes</CardTitle>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-2 text-xs text-t3">
                  <Briefcase size={14} />
                  {workersCompClassCodes.reduce((sum, c) => sum + c.employee_count, 0)} total employees classified
                </span>
                <Button variant="secondary" size="sm" onClick={openAddClassCodeModal}>
                  <Plus size={14} /> Add Class Code
                </Button>
              </div>
            </div>
          </CardHeader>
          {workersCompClassCodes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 rounded-lg bg-canvas flex items-center justify-center mb-3">
                <Briefcase size={24} className="text-t3" />
              </div>
              <p className="text-sm font-medium text-t1 mb-1">No class codes configured</p>
              <p className="text-xs text-t3 mb-4 max-w-xs">Add NCCI class codes to classify employees by occupation and calculate premiums.</p>
              <Button size="sm" onClick={openAddClassCodeModal}><Plus size={14} /> Add Class Code</Button>
            </div>
          ) : (
          <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-divider bg-canvas">
                  <th className="tempo-th text-left px-6 py-3">Code</th>
                  <th className="tempo-th text-left px-4 py-3">Description</th>
                  <th className="tempo-th text-right px-4 py-3">Rate per $100</th>
                  <th className="tempo-th text-center px-4 py-3">Employee Count</th>
                  <th className="tempo-th text-right px-4 py-3">Est. Annual Premium</th>
                  <th className="tempo-th text-left px-4 py-3">Risk Level</th>
                  <th className="tempo-th text-center px-4 py-3">{tc('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {workersCompClassCodes.map(cc => {
                  const avgSalary = 6000000 // $60,000 in cents
                  const estPayroll = avgSalary * cc.employee_count
                  const estPremium = Math.round((estPayroll / 10000) * cc.rate) // (payroll_cents / 100 / 100) * rate * 100 for cents
                  const riskLevel = cc.rate < 0.5 ? 'Low' : cc.rate < 2.0 ? 'Medium' : 'High'
                  const riskVariant = cc.rate < 0.5 ? 'success' : cc.rate < 2.0 ? 'warning' : 'error'
                  return (
                    <tr key={cc.code} className="hover:bg-canvas/50">
                      <td className="px-6 py-3 text-xs font-mono font-semibold text-t1">{cc.code}</td>
                      <td className="px-4 py-3 text-xs text-t1">{cc.description}</td>
                      <td className="px-4 py-3 text-xs font-semibold text-t1 text-right">${cc.rate.toFixed(2)}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Users size={12} className="text-t3" />
                          <span className="text-xs text-t1">{cc.employee_count}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold text-t1 text-right">{formatCents(estPremium)}</td>
                      <td className="px-4 py-3">
                        <Badge variant={riskVariant as any}>
                          {riskLevel}
                        </Badge>
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
          <div className="px-6 py-3 border-t border-divider bg-canvas">
            <div className="flex items-center justify-between text-xs">
              <span className="text-t3">Rates based on NCCI manual classifications. Actual rates may vary by state and experience modification.</span>
              <span className="font-medium text-t1">
                Total Est. Premium: {formatCents(
                  workersCompClassCodes.reduce((sum, cc) => {
                    const estPayroll = 6000000 * cc.employee_count
                    return sum + Math.round((estPayroll / 10000) * cc.rate)
                  }, 0)
                )}
              </span>
            </div>
          </div>
          </>
          )}
        </Card>
      )}

      {/* ── Premium Calculator Tab ── */}
      {activeTab === 'calculator' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Calculator size={20} className="text-tempo-600" />
              <h3 className="text-sm font-semibold text-t1">Premium Calculator</h3>
            </div>
            <p className="text-xs text-t3 mb-4">
              Estimate your workers&apos; compensation premium based on class code and annual payroll.
            </p>
            <div className="space-y-4">
              <Select
                label="Class Code"
                value={calcClassCode}
                onChange={(e) => {
                  setCalcClassCode(e.target.value)
                  setCalcResult(null)
                }}
                options={[
                  { value: '', label: 'Select a class code...' },
                  ...workersCompClassCodes.map(cc => ({
                    value: cc.code,
                    label: `${cc.code} - ${cc.description} ($${cc.rate.toFixed(2)}/$100)`,
                  })),
                ]}
              />
              <Input
                label="Annual Payroll ($)"
                type="number"
                placeholder="e.g. 500000"
                value={calcPayroll}
                onChange={(e) => {
                  setCalcPayroll(e.target.value)
                  setCalcResult(null)
                }}
              />
              <Button onClick={calculatePremium} className="w-full">
                <Calculator size={14} /> Calculate Premium
              </Button>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-2 mb-4">
              <DollarSign size={20} className="text-tempo-600" />
              <h3 className="text-sm font-semibold text-t1">Calculation Result</h3>
            </div>

            {calcResult !== null ? (
              <div className="space-y-4">
                <div className="p-4 bg-canvas rounded-lg border border-divider">
                  <p className="text-xs text-t3 mb-1">Estimated Annual Premium</p>
                  <p className="text-2xl font-bold text-tempo-600">{formatCents(calcResult)}</p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-t1">Formula Breakdown</h4>
                  <div className="p-3 bg-canvas rounded-lg font-mono text-xs space-y-1">
                    <p className="text-t2">Annual Payroll: <span className="text-t1 font-semibold">${Number(calcPayroll).toLocaleString()}</span></p>
                    <p className="text-t2">Class Code Rate: <span className="text-t1 font-semibold">${workersCompClassCodes.find(c => c.code === calcClassCode)?.rate.toFixed(2)} per $100</span></p>
                    <div className="border-t border-divider my-2" />
                    <p className="text-t3">(Payroll / 100) x Rate = Premium</p>
                    <p className="text-t1">
                      (${Number(calcPayroll).toLocaleString()} / 100) x {workersCompClassCodes.find(c => c.code === calcClassCode)?.rate.toFixed(2)} = <span className="font-semibold text-tempo-600">{formatCents(calcResult)}</span>
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-warning/5 border border-warning/20 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle size={14} className="text-warning mt-0.5" />
                    <p className="text-xs text-t2">
                      This is an estimate only. Actual premiums are affected by experience modification rate (EMR), state factors, deductibles, and carrier-specific pricing.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-12 h-12 rounded-lg bg-canvas flex items-center justify-center mb-3">
                  <Calculator size={24} className="text-t3" />
                </div>
                <p className="text-sm text-t2 mb-1">No calculation yet</p>
                <p className="text-xs text-t3">Select a class code and enter payroll to estimate your premium.</p>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ── Audits Tab ── */}
      {activeTab === 'audits' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-t1 flex items-center gap-2">
              <ClipboardList size={18} /> Audit History
            </h3>
            <Button variant="secondary" size="sm" onClick={openScheduleAuditModal}>
              <Plus size={14} /> Schedule Audit
            </Button>
          </div>

          {workersCompAudits.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 rounded-lg bg-canvas flex items-center justify-center mb-3">
                <ClipboardList size={24} className="text-t3" />
              </div>
              <p className="text-sm font-medium text-t1 mb-1">No audits scheduled</p>
              <p className="text-xs text-t3 mb-4 max-w-xs">Schedule your first premium audit to verify payroll records and ensure accurate classification rates.</p>
              <Button size="sm" onClick={openScheduleAuditModal}><Plus size={14} /> Schedule Audit</Button>
            </div>
          ) : (
          <>
          {workersCompAudits.map(audit => (
            <Card key={audit.id}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    audit.status === 'completed' ? 'bg-success/10' :
                    audit.status === 'scheduled' ? 'bg-info/10' : 'bg-warning/10'
                  }`}>
                    {audit.status === 'completed' ? (
                      <CheckCircle size={20} className="text-success" />
                    ) : (
                      <Clock size={20} className="text-info" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-t1">Annual Premium Audit</p>
                      <Badge variant={audit.status === 'completed' ? 'success' : 'info'}>
                        {audit.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-t3 mb-2">
                      Period: {audit.period} | Auditor: {audit.auditor} | Date: {audit.audit_date}
                    </p>
                    {audit.findings && (
                      <p className="text-xs text-t2 bg-canvas p-2 rounded border border-divider">
                        {audit.findings}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="text-right">
                    {audit.adjustment_amount !== 0 && (
                      <div>
                        <p className="text-xs text-t3">Adjustment</p>
                        <p className={`text-sm font-semibold ${audit.adjustment_amount < 0 ? 'text-success' : 'text-error'}`}>
                          {audit.adjustment_amount < 0 ? '-' : '+'}{formatCents(Math.abs(audit.adjustment_amount))}
                        </p>
                      </div>
                    )}
                    {audit.adjustment_amount === 0 && audit.status === 'completed' && (
                      <div>
                        <p className="text-xs text-t3">Adjustment</p>
                        <p className="text-sm font-semibold text-success">No adjustment</p>
                      </div>
                    )}
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => openAuditStatusModal(audit)}>
                    <Edit3 size={12} /> Update
                  </Button>
                </div>
              </div>
            </Card>
          ))}

          {/* Summary Card */}
          {workersCompAudits.length > 0 && (
          <Card>
            <h4 className="text-sm font-semibold text-t1 mb-3">Audit Summary</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-canvas rounded-lg text-center">
                <p className="text-xs text-t3">Total Audits</p>
                <p className="text-lg font-bold text-t1">{workersCompAudits.length}</p>
              </div>
              <div className="p-3 bg-canvas rounded-lg text-center">
                <p className="text-xs text-t3">Completed</p>
                <p className="text-lg font-bold text-success">{workersCompAudits.filter(a => a.status === 'completed').length}</p>
              </div>
              <div className="p-3 bg-canvas rounded-lg text-center">
                <p className="text-xs text-t3">Scheduled</p>
                <p className="text-lg font-bold text-info">{workersCompAudits.filter(a => a.status === 'scheduled').length}</p>
              </div>
              <div className="p-3 bg-canvas rounded-lg text-center">
                <p className="text-xs text-t3">Net Adjustments</p>
                <p className={`text-lg font-bold ${workersCompAudits.reduce((s, a) => s + a.adjustment_amount, 0) <= 0 ? 'text-success' : 'text-error'}`}>
                  {formatCents(Math.abs(workersCompAudits.reduce((s, a) => s + a.adjustment_amount, 0)))}
                </p>
              </div>
            </div>
          </Card>
          )}
          </>
          )}
        </div>
      )}

      {/* ── File Claim Modal ── */}
      <Modal open={showClaimModal} onClose={() => setShowClaimModal(false)} title="File Workers' Compensation Claim">
        <div className="space-y-4">
          <Input
            label="Employee Name"
            placeholder="Full name of injured employee"
            value={claimForm.employee_name}
            onChange={(e) => setClaimForm({ ...claimForm, employee_name: e.target.value })}
          />
          <Input
            label="Incident Date"
            type="date"
            value={claimForm.incident_date}
            onChange={(e) => setClaimForm({ ...claimForm, incident_date: e.target.value })}
          />
          <Textarea
            label="Description of Incident"
            placeholder="Describe what happened, where, and how the injury occurred..."
            rows={3}
            value={claimForm.description}
            onChange={(e) => setClaimForm({ ...claimForm, description: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Injury Type"
              value={claimForm.injury_type}
              onChange={(e) => setClaimForm({ ...claimForm, injury_type: e.target.value })}
              options={[
                { value: '', label: 'Select injury type...' },
                ...INJURY_TYPES,
              ]}
            />
            <Input
              label="Body Part"
              placeholder="e.g. Lower back, Left wrist"
              value={claimForm.body_part}
              onChange={(e) => setClaimForm({ ...claimForm, body_part: e.target.value })}
            />
          </div>
          <Input
            label="Initial Reserve Estimate ($)"
            type="number"
            placeholder="e.g. 5000"
            value={claimForm.reserve_amount}
            onChange={(e) => setClaimForm({ ...claimForm, reserve_amount: e.target.value })}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowClaimModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitClaim} disabled={saving}>
              <ShieldCheck size={14} /> {saving ? 'Saving...' : 'Submit Claim'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Policy Modal (Add / Edit) ── */}
      <Modal open={showPolicyModal} onClose={() => setShowPolicyModal(false)} title={editingPolicy ? 'Edit Policy' : 'Add Policy'}>
        <div className="space-y-4">
          <Input
            label="Policy Name"
            placeholder="e.g. General Liability - 2026"
            value={policyForm.name}
            onChange={(e) => setPolicyForm({ ...policyForm, name: e.target.value })}
          />
          <Input
            label="Carrier"
            placeholder="e.g. Hartford, Travelers"
            value={policyForm.carrier}
            onChange={(e) => setPolicyForm({ ...policyForm, carrier: e.target.value })}
          />
          <Input
            label="Policy Number"
            placeholder="e.g. WC-2026-001"
            value={policyForm.policy_number}
            onChange={(e) => setPolicyForm({ ...policyForm, policy_number: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Effective Date"
              type="date"
              value={policyForm.effective_date}
              onChange={(e) => setPolicyForm({ ...policyForm, effective_date: e.target.value })}
            />
            <Input
              label="Expiration Date"
              type="date"
              value={policyForm.expiration_date}
              onChange={(e) => setPolicyForm({ ...policyForm, expiration_date: e.target.value })}
            />
          </div>
          <Input
            label="Annual Premium ($)"
            type="number"
            placeholder="e.g. 25000"
            value={policyForm.premium}
            onChange={(e) => setPolicyForm({ ...policyForm, premium: e.target.value })}
          />
          <Select
            label="Status"
            value={policyForm.status}
            onChange={(e) => setPolicyForm({ ...policyForm, status: e.target.value })}
            options={[
              { value: 'active', label: 'Active' },
              { value: 'pending', label: 'Pending' },
              { value: 'expired', label: 'Expired' },
              { value: 'cancelled', label: 'Cancelled' },
            ]}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowPolicyModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitPolicy} disabled={saving}>
              <ShieldCheck size={14} /> {saving ? 'Saving...' : editingPolicy ? 'Update Policy' : 'Add Policy'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Claim Status Update Modal ── */}
      <Modal open={showClaimStatusModal} onClose={() => setShowClaimStatusModal(false)} title="Update Claim Status">
        <div className="space-y-4">
          {editingClaim && (
            <div className="p-3 bg-canvas rounded-lg border border-divider">
              <p className="text-xs text-t3 mb-1">Claim for</p>
              <p className="text-sm font-semibold text-t1">{editingClaim.employee_name}</p>
              <p className="text-xs text-t3 mt-1">Incident: {editingClaim.incident_date}</p>
            </div>
          )}
          <Select
            label="New Status"
            value={claimStatusForm.status}
            onChange={(e) => setClaimStatusForm({ status: e.target.value })}
            options={[
              { value: 'open', label: 'Open' },
              { value: 'investigating', label: 'Investigating' },
              { value: 'approved', label: 'Approved' },
              { value: 'denied', label: 'Denied' },
              { value: 'closed', label: 'Closed' },
            ]}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowClaimStatusModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitClaimStatus} disabled={saving}>
              <CheckCircle size={14} /> {saving ? 'Saving...' : 'Update Status'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Class Code Modal (Add / Edit) ── */}
      <Modal open={showClassCodeModal} onClose={() => setShowClassCodeModal(false)} title={editingClassCode ? 'Edit Class Code' : 'Add Class Code'}>
        <div className="space-y-4">
          <Input
            label="Code"
            placeholder="e.g. 8810"
            value={classCodeForm.code}
            onChange={(e) => setClassCodeForm({ ...classCodeForm, code: e.target.value })}
          />
          <Input
            label="Description"
            placeholder="e.g. Clerical Office Employees"
            value={classCodeForm.description}
            onChange={(e) => setClassCodeForm({ ...classCodeForm, description: e.target.value })}
          />
          <Input
            label="Rate per $100 Payroll"
            type="number"
            step="0.01"
            placeholder="e.g. 0.25"
            value={classCodeForm.rate}
            onChange={(e) => setClassCodeForm({ ...classCodeForm, rate: e.target.value })}
          />
          <Input
            label="Industry"
            placeholder="e.g. Office/Clerical, Construction, Healthcare"
            value={classCodeForm.industry}
            onChange={(e) => setClassCodeForm({ ...classCodeForm, industry: e.target.value })}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowClassCodeModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitClassCode} disabled={saving}>
              <Plus size={14} /> {saving ? 'Saving...' : editingClassCode ? 'Update Class Code' : 'Add Class Code'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Schedule Audit Modal ── */}
      <Modal open={showAuditModal} onClose={() => setShowAuditModal(false)} title="Schedule Audit">
        <div className="space-y-4">
          <Select
            label="Audit Type"
            value={auditForm.audit_type}
            onChange={(e) => setAuditForm({ ...auditForm, audit_type: e.target.value })}
            options={[
              { value: 'annual', label: 'Annual Premium Audit' },
              { value: 'interim', label: 'Interim Audit' },
              { value: 'final', label: 'Final Audit' },
              { value: 'payroll', label: 'Payroll Verification' },
            ]}
          />
          <Input
            label="Scheduled Date"
            type="date"
            value={auditForm.scheduled_date}
            onChange={(e) => setAuditForm({ ...auditForm, scheduled_date: e.target.value })}
          />
          <Input
            label="Auditor"
            placeholder="e.g. Smith & Associates"
            value={auditForm.auditor}
            onChange={(e) => setAuditForm({ ...auditForm, auditor: e.target.value })}
          />
          <Select
            label="Status"
            value={auditForm.status}
            onChange={(e) => setAuditForm({ ...auditForm, status: e.target.value })}
            options={[
              { value: 'scheduled', label: 'Scheduled' },
              { value: 'in_progress', label: 'In Progress' },
            ]}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowAuditModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitAudit} disabled={saving}>
              <ClipboardList size={14} /> {saving ? 'Saving...' : 'Schedule Audit'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Audit Status Update Modal ── */}
      <Modal open={showAuditStatusModal} onClose={() => setShowAuditStatusModal(false)} title="Update Audit Status">
        <div className="space-y-4">
          {editingAudit && (
            <div className="p-3 bg-canvas rounded-lg border border-divider">
              <p className="text-xs text-t3 mb-1">Audit</p>
              <p className="text-sm font-semibold text-t1">Annual Premium Audit</p>
              <p className="text-xs text-t3 mt-1">Auditor: {editingAudit.auditor} | Date: {editingAudit.audit_date}</p>
            </div>
          )}
          <Select
            label="New Status"
            value={auditStatusForm.status}
            onChange={(e) => setAuditStatusForm({ status: e.target.value })}
            options={[
              { value: 'scheduled', label: 'Scheduled' },
              { value: 'in_progress', label: 'In Progress' },
              { value: 'completed', label: 'Completed' },
              { value: 'cancelled', label: 'Cancelled' },
            ]}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowAuditStatusModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitAuditStatus} disabled={saving}>
              <CheckCircle size={14} /> {saving ? 'Saving...' : 'Update Status'}
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
