'use client'

import { useState, useMemo, useEffect } from 'react'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/ui/status-badge'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/ui/stat-card'
import { Modal } from '@/components/ui/modal'
import { Input, Select, Textarea } from '@/components/ui/input'
import { Tabs } from '@/components/ui/tabs'
import { TempoBarChart, TempoDonutChart, CHART_COLORS } from '@/components/ui/charts'
import { Pagination } from '@/components/ui/pagination'
import {
  ShieldCheck, AlertTriangle, CheckCircle, XCircle, Clock, Plus, Filter,
  FileText, Upload, Bell, Globe, Trash2, Eye, Calendar, Search,
  ChevronRight, Download, Star, ArrowUpRight, Radar, Play, RotateCcw,
} from 'lucide-react'
import { useTempo } from '@/lib/store'
import { Header } from '@/components/layout/header'
import { PageSkeleton } from '@/components/ui/page-skeleton'
import { ExpandableStats } from '@/components/ui/expandable-stats'
import { STAT_ICON, HEADER_ICON, TABLE_ICON, ICON_SIZE } from '@/lib/design-tokens'

const ITEMS_PER_PAGE = 8

const CATEGORY_LABELS: Record<string, string> = {
  labor_law: 'Labor Law',
  data_privacy: 'Data Privacy',
  safety: 'Safety',
  financial: 'Financial',
  immigration: 'Immigration',
  licensing: 'Licensing',
}

const STATUS_VARIANTS: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
  compliant: 'success',
  at_risk: 'warning',
  non_compliant: 'error',
  not_applicable: 'default',
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: 'bg-red-500/10 text-red-400 border-red-500/20',
  high: 'bg-teal-700/10 text-teal-400 border-teal-700/20',
  medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  low: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
}

export default function CompliancePage() {
  const {
    complianceRequirements, complianceDocuments, complianceAlerts,
    addComplianceRequirement, updateComplianceRequirement, deleteComplianceRequirement,
    addComplianceDocument, updateComplianceDocument, deleteComplianceDocument,
    dismissComplianceAlert,
    autoDetectionScans, addAutoDetectionScan, updateAutoDetectionScan,
    employees, getEmployeeName,
    ensureModulesLoaded, addToast, org,
    courses, enrollments, signatureDocuments, payrollRuns,
    addPlatformEvent,
  } = useTempo()

  const [pageLoading, setPageLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [confirmAction, setConfirmAction] = useState<{show:boolean, type:string, id:string, label:string}|null>(null)

  useEffect(() => {
    ensureModulesLoaded?.(['complianceRequirements', 'complianceDocuments', 'complianceAlerts', 'employees', 'courses', 'enrollments', 'signatureDocuments', 'payrollRuns'])?.then?.(() => setPageLoading(false))?.catch?.(() => setPageLoading(false))
  }, [ensureModulesLoaded])

  useEffect(() => { const t = setTimeout(() => setPageLoading(false), 2000); return () => clearTimeout(t) }, [])

  // Compliance Audit Report Export
  function exportAuditReport() {
    const now = new Date().toISOString().split('T')[0]
    const sections: string[] = []

    // Section 1: Executive Summary
    sections.push('COMPLIANCE AUDIT REPORT')
    sections.push(`Generated: ${now}`)
    sections.push(`Organization: ${org?.name || 'Organization'}`)
    sections.push('')
    sections.push('=== EXECUTIVE SUMMARY ===')
    sections.push(`Total Requirements: ${complianceRequirements.length}`)
    sections.push(`Compliant: ${complianceRequirements.filter(r => r.status === 'compliant').length}`)
    sections.push(`At Risk: ${complianceRequirements.filter(r => r.status === 'at_risk').length}`)
    sections.push(`Non-Compliant: ${complianceRequirements.filter(r => r.status === 'non_compliant').length}`)
    const _totalReqs = complianceRequirements.length
    const _compliantCount = complianceRequirements.filter(r => r.status === 'compliant').length
    sections.push(`Compliance Score: ${_totalReqs > 0 ? Math.round((_compliantCount / _totalReqs) * 100) : 0}%`)
    sections.push(`Active Alerts: ${complianceAlerts.filter(a => !a.is_read).length}`)
    sections.push(`Critical Alerts: ${complianceAlerts.filter(a => a.severity === 'critical' && !a.is_read).length}`)
    sections.push('')

    // Section 2: Training Completion
    sections.push('=== TRAINING COMPLETION ===')
    const mandatoryCourses = (courses || []).filter((c: any) => c.is_mandatory)
    sections.push(`Total Courses: ${(courses || []).length}`)
    sections.push(`Mandatory Courses: ${mandatoryCourses.length}`)
    const completedEnrollments = (enrollments || []).filter((e: any) => e.status === 'completed')
    sections.push(`Completed Enrollments: ${completedEnrollments.length}`)
    sections.push(`Total Enrollments: ${(enrollments || []).length}`)
    const completionRate = (enrollments || []).length > 0 ? Math.round((completedEnrollments.length / (enrollments || []).length) * 100) : 0
    sections.push(`Completion Rate: ${completionRate}%`)
    // Overdue employees
    const overdueEnrollments = (enrollments || []).filter((e: any) => e.status !== 'completed' && e.due_date && new Date(e.due_date) < new Date())
    sections.push(`Overdue Enrollments: ${overdueEnrollments.length}`)
    if (overdueEnrollments.length > 0) {
      sections.push('Overdue Details:')
      overdueEnrollments.slice(0, 20).forEach((e: any) => {
        const name = getEmployeeName(e.employee_id) || e.employee_id
        const course = (courses || []).find((c: any) => c.id === e.course_id)
        sections.push(`  - ${name}: ${course?.title || 'Unknown course'} (due: ${e.due_date})`)
      })
    }
    sections.push('')

    // Section 3: Policy Acknowledgment
    sections.push('=== POLICY ACKNOWLEDGMENT ===')
    const totalPolicies = (signatureDocuments || []).length
    const completedPolicies = (signatureDocuments || []).filter((d: any) => d.status === 'completed').length
    const pendingPolicies = (signatureDocuments || []).filter((d: any) => d.status === 'pending' || d.status === 'in_progress').length
    sections.push(`Total Documents Sent: ${totalPolicies}`)
    sections.push(`Fully Signed: ${completedPolicies}`)
    sections.push(`Pending Signatures: ${pendingPolicies}`)
    sections.push(`Acknowledgment Rate: ${totalPolicies > 0 ? Math.round((completedPolicies / totalPolicies) * 100) : 0}%`)
    sections.push('')

    // Section 4: Payroll Audit
    sections.push('=== PAYROLL AUDIT ===')
    const recentRuns = (payrollRuns || []).slice(0, 12)
    sections.push(`Payroll Runs (recent): ${recentRuns.length}`)
    recentRuns.forEach((run: any) => {
      sections.push(`  - Period: ${run.period || 'N/A'} | Status: ${run.status || 'N/A'} | Employees: ${run.employee_count || 0} | Gross: ${((run.total_gross || 0) / 100).toFixed(2)}`)
    })
    sections.push('')

    // Section 5: Compliance Requirements Detail
    sections.push('=== REQUIREMENTS DETAIL ===')
    sections.push('Category,Requirement,Country,Status,Frequency,Next Due')
    complianceRequirements.forEach(r => {
      sections.push(`${CATEGORY_LABELS[r.category] || r.category},${r.name},${r.country || 'Global'},${r.status},${r.frequency || ''},${r.next_due || ''}`)
    })
    sections.push('')

    // Section 6: Active Alerts
    sections.push('=== ACTIVE ALERTS ===')
    complianceAlerts.filter(a => !a.is_read).forEach(a => {
      sections.push(`[${(a.severity || '').toUpperCase()}] ${(a as any).title || a.message || 'Alert'} — ${a.type || ''} (${a.created_at?.split('T')[0] || ''})`)
    })

    const content = sections.join('\n')
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `compliance-audit-report-${now}.txt`
    a.click()
    URL.revokeObjectURL(url)
    addToast('Compliance audit report exported')
  }

  const [activeTab, setActiveTab] = useState('overview')
  const [reqPage, setReqPage] = useState(1)
  const [docPage, setDocPage] = useState(1)
  const [alertPage, setAlertPage] = useState(1)

  // Filters
  const [reqCategoryFilter, setReqCategoryFilter] = useState('')
  const [reqStatusFilter, setReqStatusFilter] = useState('')
  const [reqCountryFilter, setReqCountryFilter] = useState('')
  const [alertSeverityFilter, setAlertSeverityFilter] = useState('')
  const [alertTypeFilter, setAlertTypeFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // Modals
  const [showAddReqModal, setShowAddReqModal] = useState(false)
  const [showAddDocModal, setShowAddDocModal] = useState(false)
  const [showReqDetail, setShowReqDetail] = useState<string | null>(null)
  const [reqForm, setReqForm] = useState({
    name: '', category: 'labor_law', country: '', description: '', frequency: 'annually',
    due_date: '', assigned_to: '', status: 'compliant',
  })
  const [docForm, setDocForm] = useState({
    requirement_id: '', name: '', file_url: '', expires_at: '',
  })

  // Remediation Actions state
  const [remediationActions, setRemediationActions] = useState<any[]>([])
  const [showRemediationModal, setShowRemediationModal] = useState(false)
  const [remediationForm, setRemediationForm] = useState({ requirement_id: '', title: '', assignee: '', due_date: '', priority: 'medium', notes: '' })

  // Auto-Detection state
  const [scanPage, setScanPage] = useState(1)

  const adTotalScans = autoDetectionScans.length
  const adIssuesFound = autoDetectionScans.length
  const adAutoResolved = autoDetectionScans.filter(s => s.status === 'auto_resolved').length
  const adPendingReview = autoDetectionScans.filter(s => s.status === 'pending_review').length

  const AD_STATUS_VARIANTS: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
    auto_resolved: 'success',
    pending_review: 'warning',
    dismissed: 'default',
    escalated: 'error',
  }

  function runNewScan() {
    const modules = ['Payroll', 'Leave', 'Benefits', 'Time Tracking', 'Data Privacy', 'Expenses', 'Safety', 'Immigration', 'Onboarding']
    const rules = [
      'Overtime limit exceeded (>48h/week)',
      'Negative leave balance detected',
      'PII exported without encryption',
      'Dependent age limit exceeded',
      'Clock-in outside geofence radius',
      'Receipt missing for claim > $50',
      'Minimum wage threshold not met',
      'Background check expired',
      'Certification lapsed for equipment operation',
      'Work permit expiring within 30 days',
      'Mandatory training overdue',
      'Policy acknowledgment missing',
    ]
    const names = ['Adaeze Okonkwo', 'Kwame Mensah', 'Fatou Diallo', 'Emeka Nwosu', 'Amina Bello', 'Kofi Asante', 'Chinelo Eze', 'Yaw Boateng']
    const severities: Array<'critical' | 'high' | 'medium' | 'low'> = ['critical', 'high', 'medium', 'low']
    const statuses: Array<'auto_resolved' | 'pending_review'> = ['auto_resolved', 'pending_review']
    const scanModule = modules[Math.floor(Math.random() * modules.length)]
    const scanRule = rules[Math.floor(Math.random() * rules.length)]
    const scanSeverity = severities[Math.floor(Math.random() * severities.length)]
    const scanEmployee = names[Math.floor(Math.random() * names.length)]
    const scanStatus = statuses[Math.floor(Math.random() * statuses.length)]
    addAutoDetectionScan({
      scan_date: new Date().toISOString().split('T')[0],
      module: scanModule,
      rule_violated: scanRule,
      severity: scanSeverity,
      employee: scanEmployee,
      status: scanStatus,
    })

    // Cross-module notification: compliance alert
    if (scanStatus === 'pending_review') {
      addPlatformEvent?.({ type: 'compliance.alert', title: 'Compliance Alert', data: { count: 1, summary: `${scanRule} (${scanEmployee})`, deadline: '14' } })
    }
    setScanPage(1)
  }

  // Stats
  const totalReqs = complianceRequirements.length
  const compliantCount = complianceRequirements.filter(r => r.status === 'compliant').length
  const atRiskCount = complianceRequirements.filter(r => r.status === 'at_risk').length
  const nonCompliantCount = complianceRequirements.filter(r => r.status === 'non_compliant').length
  const complianceScore = totalReqs > 0 ? Math.round((compliantCount / totalReqs) * 100) : 0
  const criticalAlerts = complianceAlerts.filter(a => a.severity === 'critical' && !a.is_read)

  // Category breakdown for charts
  const categoryBreakdown = useMemo(() => {
    const cats: Record<string, { compliant: number; at_risk: number; non_compliant: number }> = {}
    complianceRequirements.forEach(r => {
      if (!cats[r.category]) cats[r.category] = { compliant: 0, at_risk: 0, non_compliant: 0 }
      if (r.status === 'compliant') cats[r.category].compliant++
      else if (r.status === 'at_risk') cats[r.category].at_risk++
      else if (r.status === 'non_compliant') cats[r.category].non_compliant++
    })
    return Object.entries(cats).map(([cat, counts]) => ({
      name: CATEGORY_LABELS[cat] || cat,
      compliant: counts.compliant,
      at_risk: counts.at_risk,
      non_compliant: counts.non_compliant,
    }))
  }, [complianceRequirements])

  // Status donut chart data
  const statusDonut = useMemo(() => [
    { name: 'Compliant', value: compliantCount },
    { name: 'At Risk', value: atRiskCount },
    { name: 'Non-Compliant', value: nonCompliantCount },
    { name: 'N/A', value: complianceRequirements.filter(r => r.status === 'not_applicable').length },
  ], [compliantCount, atRiskCount, nonCompliantCount, complianceRequirements])

  // Upcoming deadlines (next 30 days)
  const upcomingDeadlines = useMemo(() => {
    const now = new Date()
    const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    return complianceRequirements
      .filter(r => r.next_due && new Date(r.next_due) >= now && new Date(r.next_due) <= thirtyDays)
      .sort((a, b) => new Date(a.next_due!).getTime() - new Date(b.next_due!).getTime())
  }, [complianceRequirements])

  // Filtered requirements
  const filteredReqs = useMemo(() => {
    return complianceRequirements.filter(r => {
      if (reqCategoryFilter && r.category !== reqCategoryFilter) return false
      if (reqStatusFilter && r.status !== reqStatusFilter) return false
      if (reqCountryFilter && r.country !== reqCountryFilter) return false
      if (searchQuery && !r.name.toLowerCase().includes(searchQuery.toLowerCase())) return false
      return true
    })
  }, [complianceRequirements, reqCategoryFilter, reqStatusFilter, reqCountryFilter, searchQuery])

  // Filtered alerts
  const filteredAlerts = useMemo(() => {
    return complianceAlerts
      .filter(a => {
        if (alertSeverityFilter && a.severity !== alertSeverityFilter) return false
        if (alertTypeFilter && a.type !== alertTypeFilter) return false
        return true
      })
      .sort((a, b) => {
        const sevOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 }
        const sevDiff = (sevOrder[a.severity] || 4) - (sevOrder[b.severity] || 4)
        if (sevDiff !== 0) return sevDiff
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })
  }, [complianceAlerts, alertSeverityFilter, alertTypeFilter])

  // Expiring documents (within 30 days)
  const expiringDocs = useMemo(() => {
    const now = new Date()
    const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    return complianceDocuments.filter(d =>
      d.expires_at && new Date(d.expires_at) <= thirtyDays
    )
  }, [complianceDocuments])

  // Country compliance data
  const countryCompliance = useMemo(() => {
    const countries: Record<string, { total: number; compliant: number; reqs: typeof complianceRequirements }> = {}
    complianceRequirements.forEach(r => {
      const country = r.country || 'Global'
      if (!countries[country]) countries[country] = { total: 0, compliant: 0, reqs: [] }
      countries[country].total++
      if (r.status === 'compliant') countries[country].compliant++
      countries[country].reqs.push(r)
    })
    return Object.entries(countries).map(([name, data]) => ({
      name,
      total: data.total,
      compliant: data.compliant,
      score: data.total > 0 ? Math.round((data.compliant / data.total) * 100) : 0,
      reqs: data.reqs,
    })).sort((a, b) => b.total - a.total)
  }, [complianceRequirements])

  // Unique countries for filtering
  const countries = useMemo(() => {
    const set = new Set(complianceRequirements.map(r => r.country).filter(Boolean) as string[])
    return Array.from(set).sort()
  }, [complianceRequirements])

  async function submitRequirement() {
    if (!reqForm.name) { addToast('Requirement name is required', 'error'); return }
    if (!reqForm.due_date) { addToast('Due date is required', 'error'); return }
    setSaving(true)
    try {
      addComplianceRequirement({
        ...reqForm,
        last_checked: new Date().toISOString().split('T')[0],
        next_due: reqForm.due_date,
        evidence: null,
      })
      setShowAddReqModal(false)
      setReqForm({ name: '', category: 'labor_law', country: '', description: '', frequency: 'annually', due_date: '', assigned_to: '', status: 'compliant' })
      addToast('Requirement added successfully')
    } finally { setSaving(false) }
  }

  async function submitDocument() {
    if (!docForm.name) { addToast('Document name is required', 'error'); return }
    if (!docForm.requirement_id) { addToast('Linked requirement is required', 'error'); return }
    setSaving(true)
    try {
      addComplianceDocument({
        ...docForm,
        uploaded_by: 'emp-17',
        status: 'valid',
      })
      setShowAddDocModal(false)
      setDocForm({ requirement_id: '', name: '', file_url: '', expires_at: '' })
      addToast('Document uploaded successfully')
    } finally { setSaving(false) }
  }

  async function submitRemediation() {
    if (!remediationForm.title) { addToast('Title is required', 'error'); return }
    if (!remediationForm.due_date) { addToast('Due date is required', 'error'); return }
    setSaving(true)
    try {
      setRemediationActions(prev => [...prev, {
        id: crypto.randomUUID(),
        ...remediationForm,
        status: 'open',
        created_at: new Date().toISOString(),
      }])
      setShowRemediationModal(false)
      setRemediationForm({ requirement_id: '', title: '', assignee: '', due_date: '', priority: 'medium', notes: '' })
      addToast('Remediation action created')
    } finally { setSaving(false) }
  }

  function executeConfirmAction() {
    if (!confirmAction) return
    setSaving(true)
    try {
      if (confirmAction.type === 'delete_requirement') {
        deleteComplianceRequirement(confirmAction.id)
        setShowReqDetail(null)
        addToast('Requirement deleted')
      } else if (confirmAction.type === 'delete_document') {
        deleteComplianceDocument(confirmAction.id)
        addToast('Document deleted')
      } else if (confirmAction.type === 'dismiss_alert') {
        dismissComplianceAlert(confirmAction.id)
        addToast('Alert dismissed')
      }
    } finally {
      setSaving(false)
      setConfirmAction(null)
    }
  }

  const detailReq = showReqDetail ? complianceRequirements.find(r => r.id === showReqDetail) : null
  const detailDocs = showReqDetail ? complianceDocuments.filter(d => d.requirement_id === showReqDetail) : []

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'requirements', label: 'Requirements', count: totalReqs },
    { id: 'documents', label: 'Documents', count: complianceDocuments.length },
    { id: 'alerts', label: 'Alerts', count: complianceAlerts.filter(a => !a.is_read).length },
    { id: 'countries', label: 'Countries', count: countries.length },
    { id: 'auto_detection', label: 'Auto-Detection', count: adPendingReview },
  ]

  if (pageLoading) {
    return (
      <>
        <Header
          title="Compliance Dashboard"
          subtitle="Monitor regulatory compliance across all regions"
          actions={<div className="flex gap-2"><Button variant="secondary" size="sm" disabled><Download size={HEADER_ICON} /> Export Report</Button><Button variant="secondary" size="sm" disabled><Upload size={HEADER_ICON} /> Upload Document</Button><Button size="sm" disabled><Plus size={HEADER_ICON} /> Add Requirement</Button></div>}
        />
        <div className="p-6"><PageSkeleton /></div>
      </>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-t1">Compliance Dashboard</h1>
          <p className="text-sm text-t3 mt-1">Monitor regulatory compliance across all regions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={exportAuditReport}>
            <Download size={HEADER_ICON} /> Export Report
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setShowAddDocModal(true)}>
            <Upload size={HEADER_ICON} /> Upload Document
          </Button>
          <Button size="sm" onClick={() => setShowAddReqModal(true)}>
            <Plus size={HEADER_ICON} /> Add Requirement
          </Button>
        </div>
      </div>

      {/* Critical Alerts Banner */}
      {criticalAlerts.length > 0 && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle size={STAT_ICON} className="text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-red-400">
                {criticalAlerts.length} Critical Alert{criticalAlerts.length !== 1 ? 's' : ''} Requiring Immediate Action
              </h3>
              <div className="mt-2 space-y-1">
                {criticalAlerts.map(alert => (
                  <p key={alert.id} className="text-xs text-red-300/80">{alert.message}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stat Cards */}
      <ExpandableStats>
        <StatCard label="Total Requirements" value={totalReqs} icon={<ShieldCheck size={STAT_ICON} />} />
        <StatCard label="Compliance Score" value={`${complianceScore}%`} icon={<CheckCircle size={STAT_ICON} />} change={`${complianceScore}%`} changeType={complianceScore >= 80 ? 'positive' : 'negative'} />
        <StatCard label="At Risk" value={atRiskCount} icon={<AlertTriangle size={STAT_ICON} />} />
        <StatCard label="Non-Compliant" value={nonCompliantCount} icon={<XCircle size={STAT_ICON} />} />
      </ExpandableStats>

      {/* Global Compliance Score */}
      <Card className="mb-6 border-emerald-200 bg-gradient-to-r from-emerald-50/50 to-blue-50/50">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white rounded-xl shadow-sm border border-emerald-100">
            <Globe size={24} className="text-emerald-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-t1">Global Compliance Score</h3>
            <p className="text-xs text-t3 mt-0.5">Aggregated across all operating countries</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-emerald-600">{complianceScore}%</p>
              <p className="text-xs text-t3">Overall</p>
            </div>
            <div className="h-12 w-px bg-divider" />
            {(() => {
              const countries = [...new Set(complianceRequirements.map((r: any) => r.country || r.jurisdiction || 'Global').filter(Boolean))]
              return countries.slice(0, 4).map((country: any) => {
                const countryReqs = complianceRequirements.filter((r: any) => (r.country || r.jurisdiction || 'Global') === country)
                const countryCompliant = countryReqs.filter((r: any) => r.status === 'compliant').length
                const countryScore = countryReqs.length > 0 ? Math.round((countryCompliant / countryReqs.length) * 100) : 100
                return (
                  <div key={country} className="text-center min-w-[60px]">
                    <p className={`text-lg font-bold ${countryScore >= 80 ? 'text-emerald-600' : countryScore >= 60 ? 'text-amber-600' : 'text-red-600'}`}>{countryScore}%</p>
                    <p className="text-[10px] text-t3 truncate">{country}</p>
                  </div>
                )
              })
            })()}
          </div>
        </div>
      </Card>

      <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Compliance Score Gauge */}
            <Card>
              <h3 className="text-sm font-semibold text-t1 mb-4">Compliance Status</h3>
              <TempoDonutChart
                data={statusDonut}
                colors={['#22c55e', '#f59e0b', '#ef4444', '#64748b']}
                height={220}
              />
              <div className="mt-4 grid grid-cols-2 gap-2">
                {statusDonut.map((s, i) => (
                  <div key={s.name} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ['#22c55e', '#f59e0b', '#ef4444', '#64748b'][i] }} />
                    <span className="text-xs text-t2">{s.name}: {s.value}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Category Breakdown */}
            <Card className="lg:col-span-2">
              <h3 className="text-sm font-semibold text-t1 mb-4">Compliance by Category</h3>
              <TempoBarChart
                data={categoryBreakdown}
                bars={[
                  { dataKey: 'compliant', name: 'Compliant', color: '#22c55e', stackId: 'stack' },
                  { dataKey: 'at_risk', name: 'At Risk', color: '#f59e0b', stackId: 'stack' },
                  { dataKey: 'non_compliant', name: 'Non-Compliant', color: '#ef4444', stackId: 'stack' },
                ]}
                xKey="name"
                height={280}
                showLegend
              />
            </Card>
          </div>

          {/* Upcoming Deadlines */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-t1">Upcoming Deadlines (Next 30 Days)</h3>
              <Badge variant="warning">{upcomingDeadlines.length} items</Badge>
            </div>
            {upcomingDeadlines.length > 0 ? (
              <div className="divide-y divide-divider">
                {upcomingDeadlines.map(req => {
                  const daysLeft = Math.ceil((new Date(req.next_due!).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                  return (
                    <div key={req.id} className="py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded ${daysLeft <= 7 ? 'bg-red-500/10' : daysLeft <= 14 ? 'bg-yellow-500/10' : 'bg-blue-500/10'}`}>
                          <Calendar size={TABLE_ICON} className={daysLeft <= 7 ? 'text-red-400' : daysLeft <= 14 ? 'text-yellow-400' : 'text-blue-400'} />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-t1">{req.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge variant="default">{CATEGORY_LABELS[req.category]}</Badge>
                            {req.country && <span className="text-[0.65rem] text-t3">{req.country}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-xs font-medium ${daysLeft <= 7 ? 'text-red-400' : daysLeft <= 14 ? 'text-yellow-400' : 'text-t2'}`}>
                          {daysLeft} day{daysLeft !== 1 ? 's' : ''} left
                        </p>
                        <p className="text-[0.65rem] text-t3">Due: {req.next_due}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-xs text-t3 text-center py-4">No upcoming deadlines in the next 30 days</p>
            )}
          </Card>

          {/* Remediation Actions Section */}
          {remediationActions.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Remediation Actions</CardTitle>
              </CardHeader>
              <div className="px-6 pb-4 space-y-2">
                {remediationActions.map(action => (
                  <div key={action.id} className="flex items-center justify-between p-3 rounded-lg border border-divider">
                    <div>
                      <p className="text-sm font-medium text-t1">{action.title}</p>
                      <p className="text-xs text-t3">Due: {action.due_date} | Priority: {action.priority}{action.assignee ? ` | Assignee: ${action.assignee}` : ''}</p>
                    </div>
                    <div className="flex gap-2 items-center">
                      {action.status === 'open' && (
                        <Button size="sm" variant="ghost" onClick={() => {
                          setRemediationActions(prev => prev.map(a => a.id === action.id ? { ...a, status: 'completed', completed_at: new Date().toISOString() } : a))
                          addToast('Action marked complete')
                        }}>Complete</Button>
                      )}
                      <Badge variant={action.status === 'completed' ? 'success' : 'warning'}>{action.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Requirements Tab */}
      {activeTab === 'requirements' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search size={TABLE_ICON} className="absolute left-3 top-1/2 -translate-y-1/2 text-t3" />
              <input
                type="text"
                placeholder="Search requirements..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setReqPage(1) }}
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-white/10 bg-white/5 text-xs text-t1 focus:outline-none focus:ring-1 focus:ring-tempo-500"
              />
            </div>
            <Select
              label=""
              value={reqCategoryFilter}
              onChange={(e) => { setReqCategoryFilter(e.target.value); setReqPage(1) }}
              options={[{ value: '', label: 'All Categories' }, ...Object.entries(CATEGORY_LABELS).map(([v, l]) => ({ value: v, label: l }))]}
            />
            <Select
              label=""
              value={reqStatusFilter}
              onChange={(e) => { setReqStatusFilter(e.target.value); setReqPage(1) }}
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'compliant', label: 'Compliant' },
                { value: 'at_risk', label: 'At Risk' },
                { value: 'non_compliant', label: 'Non-Compliant' },
                { value: 'not_applicable', label: 'N/A' },
              ]}
            />
            <Select
              label=""
              value={reqCountryFilter}
              onChange={(e) => { setReqCountryFilter(e.target.value); setReqPage(1) }}
              options={[{ value: '', label: 'All Countries' }, ...countries.map(c => ({ value: c, label: c }))]}
            />
          </div>

          {/* Requirements Table */}
          <Card padding="none">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-divider text-t3 font-medium">
                    <th className="text-left px-4 py-3">Name</th>
                    <th className="text-left px-4 py-3">Category</th>
                    <th className="text-left px-4 py-3">Country</th>
                    <th className="text-left px-4 py-3">Frequency</th>
                    <th className="text-left px-4 py-3">Status</th>
                    <th className="text-left px-4 py-3">Assigned To</th>
                    <th className="text-left px-4 py-3">Next Due</th>
                    <th className="text-left px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-divider">
                  {filteredReqs.slice((reqPage - 1) * ITEMS_PER_PAGE, reqPage * ITEMS_PER_PAGE).map(req => (
                    <tr key={req.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setShowReqDetail(req.id)}
                          className="text-xs font-medium text-t1 hover:text-tempo-400 transition-colors text-left"
                        >
                          {req.name}
                        </button>
                      </td>
                      <td className="px-4 py-3"><Badge variant="default">{CATEGORY_LABELS[req.category]}</Badge></td>
                      <td className="px-4 py-3 text-t2">{req.country || 'Global'}</td>
                      <td className="px-4 py-3 text-t2 capitalize">{req.frequency.replace(/_/g, ' ')}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={req.status} />
                      </td>
                      <td className="px-4 py-3 text-t2">{req.assigned_to ? getEmployeeName(req.assigned_to) : '-'}</td>
                      <td className="px-4 py-3 text-t2">{req.next_due || '-'}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button
                            onClick={() => updateComplianceRequirement(req.id, { status: 'compliant', last_checked: new Date().toISOString().split('T')[0] })}
                            className="p-1 rounded hover:bg-green-500/10 text-t3 hover:text-green-400 transition-colors"
                            title="Mark Compliant"
                          >
                            <CheckCircle size={TABLE_ICON} />
                          </button>
                          <button
                            onClick={() => updateComplianceRequirement(req.id, { status: 'at_risk' })}
                            className="p-1 rounded hover:bg-yellow-500/10 text-t3 hover:text-yellow-400 transition-colors"
                            title="Flag At Risk"
                          >
                            <AlertTriangle size={TABLE_ICON} />
                          </button>
                          <button
                            onClick={() => updateComplianceRequirement(req.id, { status: 'non_compliant' })}
                            className="p-1 rounded hover:bg-red-500/10 text-t3 hover:text-red-400 transition-colors"
                            title="Mark Non-Compliant"
                          >
                            <XCircle size={TABLE_ICON} />
                          </button>
                          <button
                            onClick={() => setShowReqDetail(req.id)}
                            className="p-1 rounded hover:bg-white/10 text-t3 hover:text-t1 transition-colors"
                            title="View Details"
                          >
                            <Eye size={TABLE_ICON} />
                          </button>
                          {(req.status === 'non_compliant' || req.status === 'at_risk') && (
                            <Button size="sm" variant="ghost" onClick={() => {
                              setRemediationForm(f => ({ ...f, requirement_id: req.id, title: `Remediate: ${req.name}` }))
                              setShowRemediationModal(true)
                            }}>
                              Create Action
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredReqs.length > ITEMS_PER_PAGE && (
              <div className="px-4 py-3 border-t border-divider">
                <Pagination
                  totalPages={Math.ceil(filteredReqs.length / ITEMS_PER_PAGE)}
                  currentPage={reqPage}
                  onPageChange={setReqPage}
                />
              </div>
            )}
            {filteredReqs.length === 0 && (
              <div className="px-6 py-8 text-center text-xs text-t3">No requirements match your filters</div>
            )}
          </Card>
        </div>
      )}

      {/* Documents Tab */}
      {activeTab === 'documents' && (
        <div className="space-y-4">
          {/* Expiring documents alert */}
          {expiringDocs.length > 0 && (
            <div className="rounded-xl border border-teal-700/20 bg-teal-700/5 p-3">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-teal-400" />
                <span className="text-xs font-medium text-teal-400">
                  {expiringDocs.length} document{expiringDocs.length !== 1 ? 's' : ''} expiring within 30 days
                </span>
              </div>
            </div>
          )}

          <Card padding="none">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-divider text-t3 font-medium">
                    <th className="text-left px-4 py-3">Document Name</th>
                    <th className="text-left px-4 py-3">Requirement</th>
                    <th className="text-left px-4 py-3">Uploaded By</th>
                    <th className="text-left px-4 py-3">Uploaded At</th>
                    <th className="text-left px-4 py-3">Expires</th>
                    <th className="text-left px-4 py-3">Status</th>
                    <th className="text-left px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-divider">
                  {complianceDocuments.slice((docPage - 1) * ITEMS_PER_PAGE, docPage * ITEMS_PER_PAGE).map(doc => {
                    const req = complianceRequirements.find(r => r.id === doc.requirement_id)
                    const isExpiringSoon = doc.expires_at && new Date(doc.expires_at) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                    return (
                      <tr key={doc.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <FileText size={TABLE_ICON} className="text-t3" />
                            <span className="text-t1 font-medium">{doc.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-t2">{req?.name || '-'}</td>
                        <td className="px-4 py-3 text-t2">{doc.uploaded_by ? getEmployeeName(doc.uploaded_by) : '-'}</td>
                        <td className="px-4 py-3 text-t2">{new Date(doc.uploaded_at).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          {doc.expires_at ? (
                            <span className={isExpiringSoon ? 'text-teal-400 font-medium' : 'text-t2'}>{doc.expires_at}</span>
                          ) : (
                            <span className="text-t3">No expiry</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={doc.status === 'valid' ? 'success' : doc.status === 'expired' ? 'error' : 'warning'}>
                            {doc.status.replace(/_/g, ' ')}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <button className="p-1 rounded hover:bg-white/10 text-t3 hover:text-t1 transition-colors" title="Download">
                              <Download size={TABLE_ICON} />
                            </button>
                            <button
                              onClick={() => setConfirmAction({ show: true, type: 'delete_document', id: doc.id, label: doc.name })}
                              className="p-1 rounded hover:bg-red-500/10 text-t3 hover:text-red-400 transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={TABLE_ICON} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {complianceDocuments.length > ITEMS_PER_PAGE && (
              <div className="px-4 py-3 border-t border-divider">
                <Pagination
                  totalPages={Math.ceil(complianceDocuments.length / ITEMS_PER_PAGE)}
                  currentPage={docPage}
                  onPageChange={setDocPage}
                />
              </div>
            )}
            {complianceDocuments.length === 0 && (
              <div className="px-6 py-8 text-center">
                <FileText size={32} className="mx-auto text-t3 mb-3" />
                <p className="text-xs text-t3">No compliance documents uploaded yet</p>
                <Button size="sm" className="mt-3" onClick={() => setShowAddDocModal(true)}>
                  <Upload size={TABLE_ICON} /> Upload Document
                </Button>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Alerts Tab */}
      {activeTab === 'alerts' && (
        <div className="space-y-4">
          <div className="flex gap-3 items-center">
            <Select
              label=""
              value={alertSeverityFilter}
              onChange={(e) => { setAlertSeverityFilter(e.target.value); setAlertPage(1) }}
              options={[
                { value: '', label: 'All Severities' },
                { value: 'critical', label: 'Critical' },
                { value: 'high', label: 'High' },
                { value: 'medium', label: 'Medium' },
                { value: 'low', label: 'Low' },
              ]}
            />
            <Select
              label=""
              value={alertTypeFilter}
              onChange={(e) => { setAlertTypeFilter(e.target.value); setAlertPage(1) }}
              options={[
                { value: '', label: 'All Types' },
                { value: 'upcoming_deadline', label: 'Upcoming Deadline' },
                { value: 'expiring_document', label: 'Expiring Document' },
                { value: 'violation', label: 'Violation' },
                { value: 'reminder', label: 'Reminder' },
              ]}
            />
          </div>

          <div className="space-y-3">
            {filteredAlerts.slice((alertPage - 1) * ITEMS_PER_PAGE, alertPage * ITEMS_PER_PAGE).map(alert => {
              const req = alert.requirement_id ? complianceRequirements.find(r => r.id === alert.requirement_id) : null
              return (
                <div
                  key={alert.id}
                  className={`rounded-xl border p-4 transition-colors ${
                    alert.is_read ? 'border-white/5 bg-white/[0.01] opacity-60' : SEVERITY_COLORS[alert.severity]
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {alert.severity === 'critical' ? <XCircle size={16} className="text-red-400" /> :
                       alert.severity === 'high' ? <AlertTriangle size={16} className="text-teal-400" /> :
                       alert.severity === 'medium' ? <Clock size={16} className="text-yellow-400" /> :
                       <Bell size={16} className="text-blue-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={alert.severity === 'critical' ? 'error' : alert.severity === 'high' ? 'warning' : 'default'}>
                          {alert.severity}
                        </Badge>
                        <Badge variant="default">{alert.type.replace(/_/g, ' ')}</Badge>
                        {!alert.is_read && <span className="w-2 h-2 rounded-full bg-tempo-500" />}
                      </div>
                      <p className="text-xs text-t1">{alert.message}</p>
                      <div className="flex items-center gap-3 mt-2">
                        {req && <span className="text-[0.65rem] text-t3">Requirement: {req.name}</span>}
                        {alert.due_date && <span className="text-[0.65rem] text-t3">Due: {alert.due_date}</span>}
                        <span className="text-[0.65rem] text-t3">Created: {new Date(alert.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    {!alert.is_read && (
                      <button
                        onClick={() => dismissComplianceAlert(alert.id)}
                        className="text-xs text-t3 hover:text-t1 transition-colors whitespace-nowrap"
                      >
                        Dismiss
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
            {filteredAlerts.length === 0 && (
              <Card>
                <div className="text-center py-8">
                  <Bell size={32} className="mx-auto text-t3 mb-3" />
                  <p className="text-xs text-t3">No alerts match your filters</p>
                </div>
              </Card>
            )}
          </div>

          {filteredAlerts.length > ITEMS_PER_PAGE && (
            <Pagination
              totalPages={Math.ceil(filteredAlerts.length / ITEMS_PER_PAGE)}
              currentPage={alertPage}
              onPageChange={setAlertPage}
            />
          )}
        </div>
      )}

      {/* Countries Tab */}
      {activeTab === 'countries' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {countryCompliance.map(country => (
              <Card key={country.name}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Globe size={16} className="text-t3" />
                    <h3 className="text-sm font-semibold text-t1">{country.name}</h3>
                  </div>
                  <div className={`text-lg font-bold ${country.score >= 80 ? 'text-green-400' : country.score >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {country.score}%
                  </div>
                </div>
                <div className="mb-3">
                  <div className="w-full h-2 rounded-full bg-white/5">
                    <div
                      className={`h-full rounded-full transition-all ${country.score >= 80 ? 'bg-green-500' : country.score >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${country.score}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-t3 mb-3">
                  <span>{country.compliant} of {country.total} compliant</span>
                  <Badge variant={country.score >= 80 ? 'success' : country.score >= 50 ? 'warning' : 'error'}>
                    {country.score >= 80 ? 'Good' : country.score >= 50 ? 'Needs Attention' : 'Critical'}
                  </Badge>
                </div>
                <div className="space-y-2 border-t border-divider pt-3">
                  {country.reqs.map(req => (
                    <div key={req.id} className="flex items-center justify-between">
                      <span className="text-xs text-t2 truncate max-w-[60%]">{req.name}</span>
                      <StatusBadge status={req.status} />
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Auto-Detection Tab */}
      {activeTab === 'auto_detection' && (
        <div className="space-y-6">
          {/* Stat Cards */}
          <ExpandableStats>
            <StatCard label="Total Scans" value={adTotalScans} icon={<Radar size={STAT_ICON} />} />
            <StatCard label="Issues Found" value={adIssuesFound} icon={<AlertTriangle size={STAT_ICON} />} />
            <StatCard label="Auto-Resolved" value={adAutoResolved} icon={<CheckCircle size={STAT_ICON} />} change={adTotalScans > 0 ? `${Math.round((adAutoResolved / adTotalScans) * 100)}%` : '0%'} changeType="positive" />
            <StatCard label="Pending Review" value={adPendingReview} icon={<Clock size={STAT_ICON} />} change={adPendingReview > 0 ? `${adPendingReview} items` : 'Clear'} changeType={adPendingReview > 0 ? 'negative' : 'positive'} />
          </ExpandableStats>

          {/* Run Scan Button */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-t3">Automated compliance scans detect policy violations across all platform modules.</p>
            <Button size="sm" onClick={runNewScan}>
              <Play size={TABLE_ICON} /> Run Scan
            </Button>
          </div>

          {/* Auto-Detection Scans Table */}
          <Card padding="none">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-divider text-t3 font-medium">
                    <th className="text-left px-4 py-3">Scan Date</th>
                    <th className="text-left px-4 py-3">Module</th>
                    <th className="text-left px-4 py-3">Rule Violated</th>
                    <th className="text-left px-4 py-3">Severity</th>
                    <th className="text-left px-4 py-3">Employee</th>
                    <th className="text-left px-4 py-3">Status</th>
                    <th className="text-left px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-divider">
                  {autoDetectionScans.slice((scanPage - 1) * ITEMS_PER_PAGE, scanPage * ITEMS_PER_PAGE).map(scan => (
                    <tr key={scan.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3 text-t2">{scan.scan_date}</td>
                      <td className="px-4 py-3">
                        <Badge variant="default">{scan.module}</Badge>
                      </td>
                      <td className="px-4 py-3 text-t1 max-w-[240px] truncate">{scan.rule_violated}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={scan.severity} />
                      </td>
                      <td className="px-4 py-3 text-t2">{scan.employee}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={scan.status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {scan.status === 'pending_review' && (
                            <>
                              <button
                                onClick={() => updateAutoDetectionScan(scan.id, { status: 'auto_resolved' })}
                                className="p-1 rounded hover:bg-green-500/10 text-t3 hover:text-green-400 transition-colors"
                                title="Resolve"
                              >
                                <CheckCircle size={TABLE_ICON} />
                              </button>
                              <button
                                onClick={() => updateAutoDetectionScan(scan.id, { status: 'escalated' })}
                                className="p-1 rounded hover:bg-red-500/10 text-t3 hover:text-red-400 transition-colors"
                                title="Escalate"
                              >
                                <ArrowUpRight size={TABLE_ICON} />
                              </button>
                              <button
                                onClick={() => updateAutoDetectionScan(scan.id, { status: 'dismissed' })}
                                className="p-1 rounded hover:bg-white/10 text-t3 hover:text-t1 transition-colors"
                                title="Dismiss"
                              >
                                <XCircle size={TABLE_ICON} />
                              </button>
                            </>
                          )}
                          {scan.status !== 'pending_review' && (
                            <button
                              onClick={() => updateAutoDetectionScan(scan.id, { status: 'pending_review' })}
                              className="p-1 rounded hover:bg-white/10 text-t3 hover:text-t1 transition-colors"
                              title="Reopen"
                            >
                              <RotateCcw size={TABLE_ICON} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {autoDetectionScans.length > ITEMS_PER_PAGE && (
              <div className="px-4 py-3 border-t border-divider">
                <Pagination
                  totalPages={Math.ceil(autoDetectionScans.length / ITEMS_PER_PAGE)}
                  currentPage={scanPage}
                  onPageChange={setScanPage}
                />
              </div>
            )}
            {autoDetectionScans.length === 0 && (
              <div className="px-6 py-8 text-center">
                <Radar size={32} className="mx-auto text-t3 mb-3" />
                <p className="text-xs text-t3">No auto-detection scans yet. Click "Run Scan" to start.</p>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Add Requirement Modal */}
      <Modal open={showAddReqModal} onClose={() => setShowAddReqModal(false)} title="Add Compliance Requirement" size="lg">
        <div className="space-y-4">
          <Input label="Requirement Name" value={reqForm.name} onChange={(e) => setReqForm({ ...reqForm, name: e.target.value })} required />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Category" value={reqForm.category} onChange={(e) => setReqForm({ ...reqForm, category: e.target.value })} options={Object.entries(CATEGORY_LABELS).map(([v, l]) => ({ value: v, label: l }))} />
            <Select label="Frequency" value={reqForm.frequency} onChange={(e) => setReqForm({ ...reqForm, frequency: e.target.value })} options={[
              { value: 'one_time', label: 'One Time' },
              { value: 'monthly', label: 'Monthly' },
              { value: 'quarterly', label: 'Quarterly' },
              { value: 'annually', label: 'Annually' },
            ]} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select label="Country" value={reqForm.country} onChange={(e) => setReqForm({ ...reqForm, country: e.target.value })} options={[
              { value: '', label: 'Global (All)' },
              { value: 'Nigeria', label: 'Nigeria' },
              { value: 'Ghana', label: 'Ghana' },
              { value: "Cote d'Ivoire", label: "Cote d'Ivoire" },
              { value: 'Kenya', label: 'Kenya' },
              { value: 'Senegal', label: 'Senegal' },
            ]} />
            <Input label="Due Date" type="date" value={reqForm.due_date} onChange={(e) => setReqForm({ ...reqForm, due_date: e.target.value })} />
          </div>
          <Select label="Assigned To" value={reqForm.assigned_to} onChange={(e) => setReqForm({ ...reqForm, assigned_to: e.target.value })} options={[
            { value: '', label: 'Select assignee...' },
            ...employees.map(e => ({ value: e.id, label: e.profile?.full_name || e.id })),
          ]} />
          <Textarea label="Description" value={reqForm.description} onChange={(e) => setReqForm({ ...reqForm, description: e.target.value })} rows={3} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowAddReqModal(false)}>Cancel</Button>
            <Button onClick={submitRequirement} disabled={!reqForm.name || saving}>{saving ? 'Saving...' : 'Add Requirement'}</Button>
          </div>
        </div>
      </Modal>

      {/* Add Document Modal */}
      <Modal open={showAddDocModal} onClose={() => setShowAddDocModal(false)} title="Upload Compliance Document" size="lg">
        <div className="space-y-4">
          <Input label="Document Name" value={docForm.name} onChange={(e) => setDocForm({ ...docForm, name: e.target.value })} required />
          <Select label="Linked Requirement" value={docForm.requirement_id} onChange={(e) => setDocForm({ ...docForm, requirement_id: e.target.value })} options={[
            { value: '', label: 'Select requirement...' },
            ...complianceRequirements.map(r => ({ value: r.id, label: r.name })),
          ]} />
          <Input label="File URL" value={docForm.file_url} onChange={(e) => setDocForm({ ...docForm, file_url: e.target.value })} placeholder="/documents/..." />
          <Input label="Expires At" type="date" value={docForm.expires_at} onChange={(e) => setDocForm({ ...docForm, expires_at: e.target.value })} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowAddDocModal(false)}>Cancel</Button>
            <Button onClick={submitDocument} disabled={!docForm.name || !docForm.requirement_id || saving}>{saving ? 'Uploading...' : 'Upload Document'}</Button>
          </div>
        </div>
      </Modal>

      {/* Requirement Detail Modal */}
      <Modal open={!!showReqDetail} onClose={() => setShowReqDetail(null)} title="Requirement Details" size="lg">
        {detailReq && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-t1">{detailReq.name}</h3>
              <StatusBadge status={detailReq.status} />
            </div>
            {detailReq.description && <p className="text-xs text-t2">{detailReq.description}</p>}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-t3">Category:</span>
                <span className="text-t1 ml-2">{CATEGORY_LABELS[detailReq.category]}</span>
              </div>
              <div>
                <span className="text-t3">Country:</span>
                <span className="text-t1 ml-2">{detailReq.country || 'Global'}</span>
              </div>
              <div>
                <span className="text-t3">Frequency:</span>
                <span className="text-t1 ml-2 capitalize">{detailReq.frequency.replace(/_/g, ' ')}</span>
              </div>
              <div>
                <span className="text-t3">Assigned To:</span>
                <span className="text-t1 ml-2">{detailReq.assigned_to ? getEmployeeName(detailReq.assigned_to) : 'Unassigned'}</span>
              </div>
              <div>
                <span className="text-t3">Last Checked:</span>
                <span className="text-t1 ml-2">{detailReq.last_checked || 'Never'}</span>
              </div>
              <div>
                <span className="text-t3">Next Due:</span>
                <span className="text-t1 ml-2">{detailReq.next_due || 'N/A'}</span>
              </div>
            </div>
            {detailReq.evidence && (
              <div>
                <span className="text-xs text-t3">Evidence:</span>
                <p className="text-xs text-t1 mt-1 bg-white/5 rounded p-2">{detailReq.evidence}</p>
              </div>
            )}

            {/* Linked Documents */}
            <div className="border-t border-divider pt-4">
              <h4 className="text-xs font-semibold text-t3 uppercase mb-3">Linked Documents ({detailDocs.length})</h4>
              {detailDocs.length > 0 ? detailDocs.map(doc => (
                <div key={doc.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <div className="flex items-center gap-2">
                    <FileText size={TABLE_ICON} className="text-t3" />
                    <div>
                      <p className="text-xs font-medium text-t1">{doc.name}</p>
                      <p className="text-[0.6rem] text-t3">Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <Badge variant={doc.status === 'valid' ? 'success' : doc.status === 'expired' ? 'error' : 'warning'}>{doc.status}</Badge>
                </div>
              )) : (
                <p className="text-xs text-t3">No documents linked to this requirement</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-between pt-2 border-t border-divider">
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => { updateComplianceRequirement(detailReq.id, { status: 'compliant', last_checked: new Date().toISOString().split('T')[0] }); setShowReqDetail(null) }}>
                  <CheckCircle size={TABLE_ICON} /> Mark Compliant
                </Button>
                <Button size="sm" variant="secondary" onClick={() => { updateComplianceRequirement(detailReq.id, { status: 'at_risk' }); setShowReqDetail(null) }}>
                  <AlertTriangle size={TABLE_ICON} /> Flag At Risk
                </Button>
              </div>
              <Button size="sm" variant="secondary" onClick={() => setConfirmAction({ show: true, type: 'delete_requirement', id: detailReq.id, label: detailReq.name })}>
                <Trash2 size={TABLE_ICON} /> Delete
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Confirmation Modal */}
      <Modal open={!!confirmAction?.show} onClose={() => setConfirmAction(null)} title="Confirm Action">
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-red-500/5 border border-red-500/20 rounded-lg">
            <AlertTriangle size={20} className="text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-t1">Are you sure?</p>
              <p className="text-xs text-t3 mt-1">
                {confirmAction?.type === 'delete_requirement' && `This will permanently delete the requirement "${confirmAction.label}". This action cannot be undone.`}
                {confirmAction?.type === 'delete_document' && `This will permanently delete the document "${confirmAction.label}". This action cannot be undone.`}
                {confirmAction?.type === 'dismiss_alert' && `This will dismiss the alert "${confirmAction.label}".`}
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setConfirmAction(null)}>Cancel</Button>
            <Button size="sm" onClick={executeConfirmAction} disabled={saving} className="bg-red-600 hover:bg-red-700">
              {saving ? 'Processing...' : 'Confirm'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Remediation Action Modal */}
      <Modal open={showRemediationModal} onClose={() => setShowRemediationModal(false)} title="Create Remediation Action">
        <div className="space-y-4">
          <Input
            label="Title"
            value={remediationForm.title}
            onChange={(e) => setRemediationForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Remediation action title"
          />
          <Input
            label="Assignee"
            value={remediationForm.assignee}
            onChange={(e) => setRemediationForm(f => ({ ...f, assignee: e.target.value }))}
            placeholder="Person responsible"
          />
          <Input
            label="Due Date"
            type="date"
            value={remediationForm.due_date}
            onChange={(e) => setRemediationForm(f => ({ ...f, due_date: e.target.value }))}
          />
          <Select
            label="Priority"
            value={remediationForm.priority}
            onChange={(e) => setRemediationForm(f => ({ ...f, priority: e.target.value }))}
            options={[
              { value: 'low', label: 'Low' },
              { value: 'medium', label: 'Medium' },
              { value: 'high', label: 'High' },
              { value: 'critical', label: 'Critical' },
            ]}
          />
          <Textarea
            label="Notes"
            value={remediationForm.notes}
            onChange={(e) => setRemediationForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="Additional notes or context"
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" size="sm" onClick={() => setShowRemediationModal(false)}>Cancel</Button>
            <Button size="sm" onClick={submitRemediation} disabled={saving}>{saving ? 'Creating...' : 'Create Action'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
