// @ts-nocheck
'use client'

import { useState, useEffect, useMemo } from 'react'
import { Header } from '@/components/layout/header'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/ui/stat-card'
import { Modal } from '@/components/ui/modal'
import { Input, Select, Textarea } from '@/components/ui/input'
import { PageSkeleton } from '@/components/ui/page-skeleton'
import {
  FileText, Plus, BarChart3, Users, DollarSign, ShieldCheck,
  TrendingUp, Download, Eye, Check, Clock, Send, Pencil,
  Search, RefreshCw, ChevronDown, ChevronRight, Target,
  PieChart, BookOpen, Briefcase,
} from 'lucide-react'
import { useTempo } from '@/lib/store'

// ---- Types ----

type BoardReport = {
  id: string
  orgId: string
  title: string
  reportType: string
  period: string
  status: string
  sections: string
  generatedData: string | null
  presentedAt: string | null
  presentedBy: string | null
  createdAt: string
  updatedAt: string
}

type Section = {
  id: string
  title: string
  type: string
  data: Record<string, unknown>
}

// ---- Constants ----

const REPORT_TEMPLATES = [
  { value: 'quarterly_board_pack', label: 'Quarterly Board Pack', icon: <BarChart3 size={20} />, description: 'Executive summary, financials, headcount, compensation, compliance, and strategic initiatives' },
  { value: 'annual_review', label: 'Annual Review', icon: <BookOpen size={20} />, description: 'Year-in-review, financial performance, talent overview, strategic goals, outlook' },
  { value: 'kpi_dashboard', label: 'KPI Dashboard', icon: <Target size={20} />, description: 'People, financial, and operational KPIs with targets and actuals' },
  { value: 'compensation_review', label: 'Compensation Review', icon: <DollarSign size={20} />, description: 'Comp overview by level and department, equity, market comparison' },
]

const QUARTERS = [
  { value: 'Q1', label: 'Q1' },
  { value: 'Q2', label: 'Q2' },
  { value: 'Q3', label: 'Q3' },
  { value: 'Q4', label: 'Q4' },
]

function statusBadge(status: string) {
  const colors: Record<string, 'warning' | 'info' | 'success' | 'default' | 'error'> = {
    draft: 'default', in_review: 'warning', approved: 'success', presented: 'info',
  }
  return <Badge variant={colors[status] || 'default'}>{status.replace(/_/g, ' ')}</Badge>
}

function statusIcon(status: string) {
  switch (status) {
    case 'draft': return <Pencil size={14} />
    case 'in_review': return <Clock size={14} />
    case 'approved': return <Check size={14} />
    case 'presented': return <Send size={14} />
    default: return <FileText size={14} />
  }
}

// ---- API helpers ----

async function apiGet(action: string, params: Record<string, string> = {}) {
  const qs = new URLSearchParams({ action, ...params }).toString()
  const res = await fetch(`/api/board-reports?${qs}`)
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'API error')
  return json.data
}

async function apiPost(body: Record<string, unknown>) {
  const res = await fetch('/api/board-reports', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'API error')
  return json.data
}

// ---- Main Page ----

export default function BoardReportsPage() {
  const { addToast } = useTempo()

  const [pageLoading, setPageLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'gallery' | 'reports' | 'viewer'>('gallery')

  // Data
  const [reports, setReports] = useState<BoardReport[]>([])
  const [selectedReport, setSelectedReport] = useState<BoardReport | null>(null)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())

  // Modals
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [showCommentaryModal, setShowCommentaryModal] = useState(false)
  const [saving, setSaving] = useState(false)

  // Forms
  const [generateForm, setGenerateForm] = useState({ template: 'quarterly_board_pack', quarter: 'Q1', year: '2026', period: '' })
  const [editingSectionId, setEditingSectionId] = useState('')
  const [commentary, setCommentary] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // Load data
  useEffect(() => {
    loadReports()
    const t = setTimeout(() => setPageLoading(false), 1500)
    return () => clearTimeout(t)
  }, [])

  async function loadReports() {
    try {
      const r = await apiGet('list')
      setReports(r || [])
    } catch { /* demo fallback */ }
  }

  // Demo data
  const demoReports: BoardReport[] = useMemo(() => reports.length > 0 ? [] : [
    {
      id: '1', orgId: '', title: 'Q4 2025 Board Pack', reportType: 'quarterly_board_pack', period: 'Q4 2025', status: 'presented',
      sections: JSON.stringify([
        { id: 'executive_summary', title: 'Executive Summary', type: 'summary', data: { headcount: 847, departments: 12, revenuePerEmployee: 185000, turnoverRate: 8.2, commentary: 'Strong quarter with headcount growth and declining attrition.' } },
        { id: 'financial_overview', title: 'Financial Overview', type: 'financial', data: { totalPayrollCost: 425000000, budgetVsActual: { budget: 440000000, actual: 425000000, variance: -15000000, variancePct: -3.4 }, cashPosition: 125000000, commentary: 'Under budget by 3.4% — favorable variance from delayed hires.' } },
        { id: 'headcount_hiring', title: 'Headcount & Hiring', type: 'headcount', data: { totalHeadcount: 847, newHires: 42, departures: 18, openPositions: 23, timeToHire: 34, commentary: '42 new hires in Q4, exceeding plan by 8.' } },
        { id: 'compensation', title: 'Compensation', type: 'compensation', data: { totalCompSpend: 510000000, avgSalaryByLevel: { IC1: 7500000, IC2: 9500000, IC3: 12000000, M1: 14000000, M2: 17500000, Director: 22000000 }, equityGrants: 45, commentary: '45 equity refreshes granted in Q4.' } },
        { id: 'compliance', title: 'Compliance', type: 'compliance', data: { soc2Status: 'compliant', auditFindings: 2, policyViolations: 0, commentary: 'SOC 2 Type II audit completed successfully. 2 minor findings addressed.' } },
        { id: 'strategic_initiatives', title: 'Strategic Initiatives', type: 'strategic', data: { learningCompletion: 82, engagementScore: 78, diversityMetrics: { gender: { male: 54, female: 43, nonBinary: 3 }, ethnicity: { white: 42, asian: 28, black: 15, hispanic: 10, other: 5 } }, commentary: 'Engagement score improved 4 points YoY.' } },
      ]),
      generatedData: null, presentedAt: '2026-01-15', presentedBy: null, createdAt: '2025-12-20', updatedAt: '2026-01-15',
    },
    {
      id: '2', orgId: '', title: 'Q1 2026 Board Pack', reportType: 'quarterly_board_pack', period: 'Q1 2026', status: 'in_review',
      sections: JSON.stringify([
        { id: 'executive_summary', title: 'Executive Summary', type: 'summary', data: { headcount: 876, departments: 12, revenuePerEmployee: 192000, turnoverRate: 7.8, commentary: '' } },
        { id: 'financial_overview', title: 'Financial Overview', type: 'financial', data: { totalPayrollCost: 438000000, budgetVsActual: { budget: 450000000, actual: 438000000, variance: -12000000, variancePct: -2.7 }, cashPosition: 118000000, commentary: '' } },
        { id: 'headcount_hiring', title: 'Headcount & Hiring', type: 'headcount', data: { totalHeadcount: 876, newHires: 47, departures: 18, openPositions: 31, timeToHire: 32, commentary: '' } },
      ]),
      generatedData: null, presentedAt: null, presentedBy: null, createdAt: '2026-03-10', updatedAt: '2026-03-18',
    },
    {
      id: '3', orgId: '', title: 'FY 2025 Annual Review', reportType: 'annual_review', period: 'FY 2025', status: 'approved',
      sections: JSON.stringify([
        { id: 'year_in_review', title: 'Year in Review', type: 'summary', data: { headcount: 847, departments: 12, commentary: 'Exceptional year of growth — headcount grew 28% while maintaining culture.' } },
        { id: 'financial_performance', title: 'Financial Performance', type: 'financial', data: { totalRevenue: 1560000000, totalExpenses: 1380000000, netIncome: 180000000, yoyGrowth: 22, commentary: '' } },
      ]),
      generatedData: null, presentedAt: '2026-02-05', presentedBy: null, createdAt: '2026-01-20', updatedAt: '2026-02-05',
    },
    {
      id: '4', orgId: '', title: 'KPI Dashboard — March 2026', reportType: 'kpi_dashboard', period: 'March 2026', status: 'draft',
      sections: JSON.stringify([
        { id: 'people_kpis', title: 'People KPIs', type: 'kpi', data: { metrics: [{ name: 'Headcount', current: 876, target: 900, unit: 'people' }, { name: 'Turnover Rate', current: 7.8, target: 10, unit: '%' }, { name: 'Time to Hire', current: 32, target: 30, unit: 'days' }, { name: 'Engagement Score', current: 78, target: 80, unit: '%' }], commentary: '' } },
      ]),
      generatedData: null, presentedAt: null, presentedBy: null, createdAt: '2026-03-15', updatedAt: '2026-03-15',
    },
  ], [reports])

  const displayReports = reports.length > 0 ? reports : demoReports

  const filteredReports = useMemo(() => {
    if (!searchQuery) return displayReports
    const q = searchQuery.toLowerCase()
    return displayReports.filter(r => r.title.toLowerCase().includes(q) || r.period.toLowerCase().includes(q))
  }, [displayReports, searchQuery])

  // Actions
  async function handleGenerate() {
    setSaving(true)
    try {
      const actionMap: Record<string, string> = {
        quarterly_board_pack: 'generate-quarterly',
        annual_review: 'generate-annual',
        kpi_dashboard: 'generate-kpi',
        compensation_review: 'generate-compensation',
      }
      const period = generateForm.template === 'quarterly_board_pack'
        ? `${generateForm.quarter} ${generateForm.year}`
        : generateForm.template === 'kpi_dashboard'
        ? generateForm.period || `March ${generateForm.year}`
        : generateForm.year

      await apiPost({
        action: actionMap[generateForm.template],
        quarter: generateForm.quarter,
        year: generateForm.year,
        period,
      })
      addToast?.('Report generated successfully', 'success')
      setShowGenerateModal(false)
      loadReports()
    } catch (e: any) {
      addToast?.(e.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleStatusChange(reportId: string, newStatus: string) {
    try {
      await apiPost({ action: 'update', reportId, status: newStatus })
      addToast?.(`Status updated to ${newStatus.replace(/_/g, ' ')}`, 'success')
      loadReports()
    } catch (e: any) {
      addToast?.(e.message, 'error')
    }
  }

  function viewReport(report: BoardReport) {
    setSelectedReport(report)
    setActiveTab('viewer')
    setExpandedSections(new Set())
  }

  function saveSectionCommentary() {
    if (!selectedReport || !editingSectionId) return
    const sections: Section[] = JSON.parse(selectedReport.sections)
    const section = sections.find(s => s.id === editingSectionId)
    if (section) {
      section.data.commentary = commentary
      setSelectedReport({ ...selectedReport, sections: JSON.stringify(sections) })
    }
    setShowCommentaryModal(false)
  }

  function toggleSection(sectionId: string) {
    setExpandedSections(prev => {
      const next = new Set(prev)
      if (next.has(sectionId)) next.delete(sectionId)
      else next.add(sectionId)
      return next
    })
  }

  function formatValue(value: unknown, unit?: string): string {
    if (typeof value === 'number') {
      if (unit === 'currency' || (!unit && value > 100000)) return `$${(value / 100).toLocaleString()}`
      if (unit === '%') return `${value}%`
      if (unit === 'days') return `${value} days`
      if (unit === 'hours') return `${value}h`
      return value.toLocaleString()
    }
    return String(value || '--')
  }

  if (pageLoading) return <PageSkeleton />

  const tabs = [
    { key: 'gallery' as const, label: 'Templates', icon: <PieChart size={16} /> },
    { key: 'reports' as const, label: 'Reports', icon: <FileText size={16} /> },
    ...(selectedReport ? [{ key: 'viewer' as const, label: 'Report Viewer', icon: <Eye size={16} /> }] : []),
  ]

  return (
    <div className="flex flex-col h-full">
      <Header title="Board Reports" subtitle="Pre-built report templates for board meetings and executive reviews" />

      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard label="Total Reports" value={displayReports.length} icon={<FileText size={20} />} />
          <StatCard label="Drafts" value={displayReports.filter(r => r.status === 'draft').length} icon={<Pencil size={20} />} />
          <StatCard label="In Review" value={displayReports.filter(r => r.status === 'in_review').length} icon={<Clock size={20} />} />
          <StatCard label="Presented" value={displayReports.filter(r => r.status === 'presented').length} icon={<Send size={20} />} />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-zinc-500 hover:text-zinc-700'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Template Gallery */}
        {activeTab === 'gallery' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Report Templates</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {REPORT_TEMPLATES.map(tpl => (
                <Card key={tpl.value} className="p-5 hover:border-blue-300 cursor-pointer transition-colors" onClick={() => { setGenerateForm(f => ({ ...f, template: tpl.value })); setShowGenerateModal(true) }}>
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600">
                      {tpl.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold">{tpl.label}</h4>
                      <p className="text-sm text-zinc-500 mt-1">{tpl.description}</p>
                      <Button variant="outline" size="sm" className="mt-3">
                        <Plus size={12} className="mr-1" /> Generate
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Reports List */}
        {activeTab === 'reports' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Generated Reports</h3>
            <div className="space-y-3">
              {filteredReports.map(report => {
                const sections: Section[] = JSON.parse(report.sections)
                const template = REPORT_TEMPLATES.find(t => t.value === report.reportType)
                return (
                  <Card key={report.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                          {template?.icon || <FileText size={20} />}
                        </div>
                        <div>
                          <h4 className="font-semibold">{report.title}</h4>
                          <div className="flex items-center gap-2 mt-1 text-sm text-zinc-500">
                            <span>{report.period}</span>
                            <span className="text-zinc-300">|</span>
                            <span>{sections.length} sections</span>
                            <span className="text-zinc-300">|</span>
                            <span>Created {new Date(report.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {statusBadge(report.status)}
                        <Button variant="outline" size="sm" onClick={() => viewReport(report)}>
                          <Eye size={14} className="mr-1" /> View
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download size={14} className="mr-1" /> Export
                        </Button>
                      </div>
                    </div>
                    {/* Status workflow */}
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                      <span className="text-xs text-zinc-500">Workflow:</span>
                      {['draft', 'in_review', 'approved', 'presented'].map((s, i) => (
                        <button
                          key={s}
                          onClick={() => handleStatusChange(report.id, s)}
                          className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                            report.status === s
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30'
                              : 'text-zinc-400 hover:text-zinc-600'
                          }`}
                        >
                          {statusIcon(s)} {s.replace(/_/g, ' ')}
                        </button>
                      ))}
                    </div>
                  </Card>
                )
              })}
              {filteredReports.length === 0 && (
                <div className="text-center py-12 text-zinc-400">No reports found. Generate one from the Templates tab.</div>
              )}
            </div>
          </div>
        )}

        {/* Report Viewer */}
        {activeTab === 'viewer' && selectedReport && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">{selectedReport.title}</h3>
                <div className="flex items-center gap-2 text-sm text-zinc-500">
                  <span>{selectedReport.period}</span>
                  {statusBadge(selectedReport.status)}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => { setActiveTab('reports'); setSelectedReport(null) }}>
                  Back to Reports
                </Button>
                <Button variant="outline" size="sm">
                  <Download size={14} className="mr-1" /> Export
                </Button>
              </div>
            </div>

            {/* Sections */}
            {(JSON.parse(selectedReport.sections) as Section[]).map(section => {
              const isExpanded = expandedSections.has(section.id)
              return (
                <Card key={section.id} className="overflow-hidden">
                  <button
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                    onClick={() => toggleSection(section.id)}
                  >
                    <div className="flex items-center gap-2">
                      {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      <h4 className="font-semibold">{section.title}</h4>
                    </div>
                    <Button variant="outline" size="sm" onClick={e => { e.stopPropagation(); setEditingSectionId(section.id); setCommentary((section.data.commentary as string) || ''); setShowCommentaryModal(true) }}>
                      <Pencil size={12} className="mr-1" /> Edit Commentary
                    </Button>
                  </button>
                  {isExpanded && (
                    <div className="p-4 pt-0 border-t">
                      {/* Render section data */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        {Object.entries(section.data).filter(([k]) => k !== 'commentary' && k !== 'metrics' && k !== 'levels' && k !== 'departments' && typeof section.data[k] !== 'object').map(([key, value]) => (
                          <div key={key} className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                            <div className="text-xs text-zinc-500 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                            <div className="text-lg font-semibold mt-1">{formatValue(value)}</div>
                          </div>
                        ))}
                      </div>

                      {/* KPI metrics */}
                      {section.type === 'kpi' && Array.isArray(section.data.metrics) && (
                        <div className="space-y-3">
                          {(section.data.metrics as { name: string; current: number; target: number; unit: string }[]).map((metric, i) => {
                            const pct = metric.target > 0 ? Math.min((metric.current / metric.target) * 100, 100) : 0
                            const onTrack = metric.unit === '%'
                              ? (metric.name.includes('Turnover') ? metric.current <= metric.target : metric.current >= metric.target)
                              : metric.current <= metric.target
                            return (
                              <div key={i} className="flex items-center gap-4">
                                <div className="w-40 text-sm font-medium">{metric.name}</div>
                                <div className="flex-1">
                                  <div className="h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full">
                                    <div className={`h-full rounded-full ${onTrack ? 'bg-green-500' : 'bg-amber-500'}`} style={{ width: `${pct}%` }} />
                                  </div>
                                </div>
                                <div className="text-sm w-24 text-right">
                                  <span className="font-medium">{metric.current}</span>
                                  <span className="text-zinc-400"> / {metric.target}</span>
                                  <span className="text-xs ml-1 text-zinc-400">{metric.unit}</span>
                                </div>
                                <Badge variant={onTrack ? 'success' : 'warning'} className="w-20 justify-center">
                                  {onTrack ? 'On Track' : 'Behind'}
                                </Badge>
                              </div>
                            )
                          })}
                        </div>
                      )}

                      {/* Budget vs Actual */}
                      {section.data.budgetVsActual && typeof section.data.budgetVsActual === 'object' && (
                        <div className="mt-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                          <h5 className="text-sm font-medium mb-2">Budget vs Actual</h5>
                          <div className="grid grid-cols-4 gap-4 text-sm">
                            <div>
                              <div className="text-zinc-500">Budget</div>
                              <div className="font-semibold">{formatValue((section.data.budgetVsActual as Record<string, number>).budget)}</div>
                            </div>
                            <div>
                              <div className="text-zinc-500">Actual</div>
                              <div className="font-semibold">{formatValue((section.data.budgetVsActual as Record<string, number>).actual)}</div>
                            </div>
                            <div>
                              <div className="text-zinc-500">Variance</div>
                              <div className={`font-semibold ${(section.data.budgetVsActual as Record<string, number>).variance < 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatValue((section.data.budgetVsActual as Record<string, number>).variance)}
                              </div>
                            </div>
                            <div>
                              <div className="text-zinc-500">Variance %</div>
                              <div className={`font-semibold ${(section.data.budgetVsActual as Record<string, number>).variancePct < 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {(section.data.budgetVsActual as Record<string, number>).variancePct}%
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Commentary */}
                      {section.data.commentary && (
                        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800">
                          <div className="text-xs text-blue-600 font-medium mb-1">Commentary</div>
                          <p className="text-sm">{section.data.commentary as string}</p>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Generate Modal */}
      <Modal open={showGenerateModal} onClose={() => setShowGenerateModal(false)} title="Generate Board Report">
        <div className="space-y-4 p-4">
          <Select
            label="Report Template"
            value={generateForm.template}
            onChange={e => setGenerateForm(f => ({ ...f, template: e.target.value }))}
            options={REPORT_TEMPLATES.map(t => ({ value: t.value, label: t.label }))}
          />
          {generateForm.template === 'quarterly_board_pack' && (
            <div className="grid grid-cols-2 gap-4">
              <Select label="Quarter" value={generateForm.quarter} onChange={e => setGenerateForm(f => ({ ...f, quarter: e.target.value }))} options={QUARTERS} />
              <Input label="Year" value={generateForm.year} onChange={e => setGenerateForm(f => ({ ...f, year: e.target.value }))} />
            </div>
          )}
          {(generateForm.template === 'annual_review' || generateForm.template === 'compensation_review') && (
            <Input label="Year" value={generateForm.year} onChange={e => setGenerateForm(f => ({ ...f, year: e.target.value }))} />
          )}
          {generateForm.template === 'kpi_dashboard' && (
            <Input label="Period" value={generateForm.period} onChange={e => setGenerateForm(f => ({ ...f, period: e.target.value }))} placeholder="e.g. March 2026" />
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowGenerateModal(false)}>Cancel</Button>
            <Button onClick={handleGenerate} disabled={saving}>
              {saving ? 'Generating...' : 'Generate Report'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Commentary Modal */}
      <Modal open={showCommentaryModal} onClose={() => setShowCommentaryModal(false)} title="Edit Section Commentary">
        <div className="space-y-4 p-4">
          <Textarea
            label="Commentary"
            value={commentary}
            onChange={e => setCommentary(e.target.value)}
            rows={5}
            placeholder="Add commentary for this section..."
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowCommentaryModal(false)}>Cancel</Button>
            <Button onClick={saveSectionCommentary}>Save Commentary</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
