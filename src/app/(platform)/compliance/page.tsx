'use client'

import { useState, useMemo, useEffect } from 'react'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
  high: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
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
    ensureModulesLoaded, addToast,
    courses, enrollments, signatureDocuments, payrollRuns,
  } = useTempo()

  useEffect(() => {
    ensureModulesLoaded?.(['complianceRequirements', 'complianceDocuments', 'complianceAlerts', 'employees', 'courses', 'enrollments', 'signatureDocuments', 'payrollRuns'])
  }, [ensureModulesLoaded])

  // Compliance Audit Report Export
  function exportAuditReport() {
    const now = new Date().toISOString().split('T')[0]
    const sections: string[] = []

    // Section 1: Executive Summary
    sections.push('COMPLIANCE AUDIT REPORT')
    sections.push(`Generated: ${now}`)
    sections.push(`Organization: Africa Bank Group`)
    sections.push('')
    sections.push('=== EXECUTIVE SUMMARY ===')
    sections.push(`Total Requirements: ${complianceRequirements.length}`)
    sections.push(`Compliant: ${complianceRequirements.filter(r => r.status === 'compliant').length}`)
    sections.push(`At Risk: ${complianceRequirements.filter(r => r.status === 'at_risk').length}`)
    sections.push(`Non-Compliant: ${complianceRequirements.filter(r => r.status === 'non_compliant').length}`)
    sections.push(`Compliance Score: ${totalReqs > 0 ? Math.round((compliantCount / totalReqs) * 100) : 0}%`)
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
    addAutoDetectionScan({
      scan_date: new Date().toISOString().split('T')[0],
      module: modules[Math.floor(Math.random() * modules.length)],
      rule_violated: rules[Math.floor(Math.random() * rules.length)],
      severity: severities[Math.floor(Math.random() * severities.length)],
      employee: names[Math.floor(Math.random() * names.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
    })
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

  function submitRequirement() {
    addComplianceRequirement({
      ...reqForm,
      last_checked: new Date().toISOString().split('T')[0],
      next_due: reqForm.due_date,
      evidence: null,
    })
    setShowAddReqModal(false)
    setReqForm({ name: '', category: 'labor_law', country: '', description: '', frequency: 'annually', due_date: '', assigned_to: '', status: 'compliant' })
  }

  function submitDocument() {
    addComplianceDocument({
      ...docForm,
      uploaded_by: 'emp-17',
      status: 'valid',
    })
    setShowAddDocModal(false)
    setDocForm({ requirement_id: '', name: '', file_url: '', expires_at: '' })
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
            <Download size={14} /> Export Report
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setShowAddDocModal(true)}>
            <Upload size={14} /> Upload Document
          </Button>
          <Button size="sm" onClick={() => setShowAddReqModal(true)}>
            <Plus size={14} /> Add Requirement
          </Button>
        </div>
      </div>

      {/* Critical Alerts Banner */}
      {criticalAlerts.length > 0 && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
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

      <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Requirements" value={totalReqs} icon={<ShieldCheck size={20} />} />
            <StatCard label="Compliance Score" value={`${complianceScore}%`} icon={<CheckCircle size={20} />} change={`${complianceScore}%`} changeType={complianceScore >= 80 ? 'positive' : 'negative'} />
            <StatCard label="At Risk" value={atRiskCount} icon={<AlertTriangle size={20} />} />
            <StatCard label="Non-Compliant" value={nonCompliantCount} icon={<XCircle size={20} />} />
          </div>

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
                          <Calendar size={14} className={daysLeft <= 7 ? 'text-red-400' : daysLeft <= 14 ? 'text-yellow-400' : 'text-blue-400'} />
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
        </div>
      )}

      {/* Requirements Tab */}
      {activeTab === 'requirements' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-t3" />
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
                        <Badge variant={STATUS_VARIANTS[req.status]}>{req.status.replace(/_/g, ' ')}</Badge>
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
                            <CheckCircle size={14} />
                          </button>
                          <button
                            onClick={() => updateComplianceRequirement(req.id, { status: 'at_risk' })}
                            className="p-1 rounded hover:bg-yellow-500/10 text-t3 hover:text-yellow-400 transition-colors"
                            title="Flag At Risk"
                          >
                            <AlertTriangle size={14} />
                          </button>
                          <button
                            onClick={() => updateComplianceRequirement(req.id, { status: 'non_compliant' })}
                            className="p-1 rounded hover:bg-red-500/10 text-t3 hover:text-red-400 transition-colors"
                            title="Mark Non-Compliant"
                          >
                            <XCircle size={14} />
                          </button>
                          <button
                            onClick={() => setShowReqDetail(req.id)}
                            className="p-1 rounded hover:bg-white/10 text-t3 hover:text-t1 transition-colors"
                            title="View Details"
                          >
                            <Eye size={14} />
                          </button>
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
            <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-3">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-orange-400" />
                <span className="text-xs font-medium text-orange-400">
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
                            <FileText size={14} className="text-t3" />
                            <span className="text-t1 font-medium">{doc.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-t2">{req?.name || '-'}</td>
                        <td className="px-4 py-3 text-t2">{doc.uploaded_by ? getEmployeeName(doc.uploaded_by) : '-'}</td>
                        <td className="px-4 py-3 text-t2">{new Date(doc.uploaded_at).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          {doc.expires_at ? (
                            <span className={isExpiringSoon ? 'text-orange-400 font-medium' : 'text-t2'}>{doc.expires_at}</span>
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
                              <Download size={14} />
                            </button>
                            <button
                              onClick={() => deleteComplianceDocument(doc.id)}
                              className="p-1 rounded hover:bg-red-500/10 text-t3 hover:text-red-400 transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={14} />
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
                  <Upload size={14} /> Upload Document
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
                       alert.severity === 'high' ? <AlertTriangle size={16} className="text-orange-400" /> :
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
                      <Badge variant={STATUS_VARIANTS[req.status]} className="text-[0.6rem]">{req.status.replace(/_/g, ' ')}</Badge>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Scans" value={adTotalScans} icon={<Radar size={20} />} />
            <StatCard label="Issues Found" value={adIssuesFound} icon={<AlertTriangle size={20} />} />
            <StatCard label="Auto-Resolved" value={adAutoResolved} icon={<CheckCircle size={20} />} change={adTotalScans > 0 ? `${Math.round((adAutoResolved / adTotalScans) * 100)}%` : '0%'} changeType="positive" />
            <StatCard label="Pending Review" value={adPendingReview} icon={<Clock size={20} />} change={adPendingReview > 0 ? `${adPendingReview} items` : 'Clear'} changeType={adPendingReview > 0 ? 'negative' : 'positive'} />
          </div>

          {/* Run Scan Button */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-t3">Automated compliance scans detect policy violations across all platform modules.</p>
            <Button size="sm" onClick={runNewScan}>
              <Play size={14} /> Run Scan
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
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[0.65rem] font-medium border ${SEVERITY_COLORS[scan.severity]}`}>
                          {scan.severity}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-t2">{scan.employee}</td>
                      <td className="px-4 py-3">
                        <Badge variant={AD_STATUS_VARIANTS[scan.status]}>{scan.status.replace(/_/g, ' ')}</Badge>
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
                                <CheckCircle size={14} />
                              </button>
                              <button
                                onClick={() => updateAutoDetectionScan(scan.id, { status: 'escalated' })}
                                className="p-1 rounded hover:bg-red-500/10 text-t3 hover:text-red-400 transition-colors"
                                title="Escalate"
                              >
                                <ArrowUpRight size={14} />
                              </button>
                              <button
                                onClick={() => updateAutoDetectionScan(scan.id, { status: 'dismissed' })}
                                className="p-1 rounded hover:bg-white/10 text-t3 hover:text-t1 transition-colors"
                                title="Dismiss"
                              >
                                <XCircle size={14} />
                              </button>
                            </>
                          )}
                          {scan.status !== 'pending_review' && (
                            <button
                              onClick={() => updateAutoDetectionScan(scan.id, { status: 'pending_review' })}
                              className="p-1 rounded hover:bg-white/10 text-t3 hover:text-t1 transition-colors"
                              title="Reopen"
                            >
                              <RotateCcw size={14} />
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
            <Button onClick={submitRequirement} disabled={!reqForm.name}>Add Requirement</Button>
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
            <Button onClick={submitDocument} disabled={!docForm.name || !docForm.requirement_id}>Upload Document</Button>
          </div>
        </div>
      </Modal>

      {/* Requirement Detail Modal */}
      <Modal open={!!showReqDetail} onClose={() => setShowReqDetail(null)} title="Requirement Details" size="lg">
        {detailReq && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-t1">{detailReq.name}</h3>
              <Badge variant={STATUS_VARIANTS[detailReq.status]}>{detailReq.status.replace(/_/g, ' ')}</Badge>
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
                    <FileText size={14} className="text-t3" />
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
                  <CheckCircle size={14} /> Mark Compliant
                </Button>
                <Button size="sm" variant="secondary" onClick={() => { updateComplianceRequirement(detailReq.id, { status: 'at_risk' }); setShowReqDetail(null) }}>
                  <AlertTriangle size={14} /> Flag At Risk
                </Button>
              </div>
              <Button size="sm" variant="secondary" onClick={() => { deleteComplianceRequirement(detailReq.id); setShowReqDetail(null) }}>
                <Trash2 size={14} /> Delete
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
