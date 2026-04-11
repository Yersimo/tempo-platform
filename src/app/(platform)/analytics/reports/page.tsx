/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Header } from '@/components/layout/header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PageSkeleton } from '@/components/ui/page-skeleton'
import { BarChart } from '@/components/charts'
import { useTempo } from '@/lib/store'
import {
  REPORT_DATA_SOURCES,
  executeReport,
  exportReportToCSV,
  type ReportConfig,
  type ReportFilter,
  type ReportResult,
  type FieldDef,
} from '@/lib/analytics/report-builder'
import {
  Users, DollarSign, Calendar, Receipt, Briefcase, Star, BookOpen,
  Plus, X, Play, Download, Save, Trash2, Share2, ChevronRight,
  ArrowUpDown, Filter, Columns3, BarChart3, Table, PieChart, TrendingUp,
  FileText, GripVertical, Check, Clock,
} from 'lucide-react'

// ── Icon lookup ──
const ICON_MAP: Record<string, React.ReactNode> = {
  Users: <Users size={20} />,
  DollarSign: <DollarSign size={20} />,
  Calendar: <Calendar size={20} />,
  Receipt: <Receipt size={20} />,
  Briefcase: <Briefcase size={20} />,
  Star: <Star size={20} />,
  BookOpen: <BookOpen size={20} />,
}

const CHART_ICONS: Record<string, React.ReactNode> = {
  table: <Table size={18} />,
  bar: <BarChart3 size={18} />,
  line: <TrendingUp size={18} />,
  pie: <PieChart size={18} />,
}

const OPERATORS = [
  { value: 'equals', label: 'Equals' },
  { value: 'not_equals', label: 'Not equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'greater_than', label: 'Greater than' },
  { value: 'less_than', label: 'Less than' },
  { value: 'is_empty', label: 'Is empty' },
  { value: 'is_not_empty', label: 'Is not empty' },
]

// ── Pie chart (simple SVG) ──
function SimplePieChart({ data, height = 240 }: { data: { label: string; value: number }[]; height?: number }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  if (total === 0) return <div className="text-t3 text-sm text-center py-8">No data</div>
  const colors = ['#004D40', '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#64748b']
  let cumulative = 0
  const slices = data.map((d, i) => {
    const startAngle = (cumulative / total) * 2 * Math.PI - Math.PI / 2
    cumulative += d.value
    const endAngle = (cumulative / total) * 2 * Math.PI - Math.PI / 2
    const largeArc = d.value / total > 0.5 ? 1 : 0
    const x1 = 100 + 80 * Math.cos(startAngle)
    const y1 = 100 + 80 * Math.sin(startAngle)
    const x2 = 100 + 80 * Math.cos(endAngle)
    const y2 = 100 + 80 * Math.sin(endAngle)
    return { ...d, path: `M100,100 L${x1},${y1} A80,80 0 ${largeArc},1 ${x2},${y2} Z`, color: colors[i % colors.length] }
  })

  return (
    <div className="flex items-center gap-6">
      <svg viewBox="0 0 200 200" width={height} height={height}>
        {slices.map((s, i) => (
          <path key={i} d={s.path} fill={s.color} stroke="white" strokeWidth={2} />
        ))}
      </svg>
      <div className="flex flex-col gap-1.5">
        {slices.map((s, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: s.color }} />
            <span className="text-t2">{s.label}</span>
            <span className="text-t3">({s.value})</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Simple line chart (SVG) ──
function SimpleLineChart({ data, height = 200 }: { data: { label: string; value: number }[]; height?: number }) {
  if (data.length === 0) return <div className="text-t3 text-sm text-center py-8">No data</div>
  const maxVal = Math.max(...data.map(d => d.value), 1)
  const w = 560
  const pad = { top: 15, right: 15, bottom: 30, left: 50 }
  const innerW = w - pad.left - pad.right
  const innerH = height - pad.top - pad.bottom
  const xStep = data.length > 1 ? innerW / (data.length - 1) : innerW / 2
  const points = data.map((d, i) => ({
    x: pad.left + i * xStep,
    y: pad.top + innerH - (d.value / maxVal) * innerH,
  }))
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')

  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full" preserveAspectRatio="xMidYMid meet">
      {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
        const y = pad.top + innerH * (1 - pct)
        return (
          <g key={i}>
            <line x1={pad.left} y1={y} x2={w - pad.right} y2={y} stroke="#e2e8f0" strokeDasharray="3,3" strokeOpacity={0.5} />
            <text x={pad.left - 8} y={y + 4} textAnchor="end" className="fill-slate-400" fontSize={9}>{Math.round(maxVal * pct)}</text>
          </g>
        )
      })}
      <path d={pathD} fill="none" stroke="#004D40" strokeWidth={2} />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3} fill="#004D40" />
      ))}
      {data.map((d, i) => {
        const show = data.length <= 12 || i % Math.ceil(data.length / 12) === 0
        if (!show) return null
        return <text key={i} x={pad.left + i * xStep} y={height - 6} textAnchor="middle" className="fill-slate-400" fontSize={8}>{d.label}</text>
      })}
    </svg>
  )
}

// ── Main Page ──

export default function ReportBuilderPage() {
  const store = useTempo()
  const {
    employees, departments, savedReports,
    addSavedReport, updateSavedReport, deleteSavedReport,
    ensureModulesLoaded,
  } = store

  const [pageLoading, setPageLoading] = useState(true)
  const [step, setStep] = useState(0) // 0 = list/choose source, 1-5 = builder steps
  const [showSaved, setShowSaved] = useState(true)

  // Report builder state
  const [selectedSource, setSelectedSource] = useState<string>('')
  const [selectedColumns, setSelectedColumns] = useState<string[]>([])
  const [filters, setFilters] = useState<ReportFilter[]>([])
  const [groupBy, setGroupBy] = useState<string>('')
  const [sortBy, setSortBy] = useState<string>('')
  const [chartType, setChartType] = useState<'table' | 'bar' | 'line' | 'pie'>('table')
  const [result, setResult] = useState<ReportResult | null>(null)
  const [reportName, setReportName] = useState('')
  const [reportDescription, setReportDescription] = useState('')
  const [editingReportId, setEditingReportId] = useState<string | null>(null)

  // Load modules
  useEffect(() => {
    ensureModulesLoaded?.([
      'employees', 'departments', 'payrollRuns', 'leaveRequests',
      'expenseReports', 'jobPostings', 'reviews', 'enrollments',
      'courses', 'savedReports',
    ])?.then?.(() => setPageLoading(false))?.catch?.(() => setPageLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { const t = setTimeout(() => setPageLoading(false), 2000); return () => clearTimeout(t) }, [])

  const currentSource = REPORT_DATA_SOURCES[selectedSource]

  // Reset builder
  const resetBuilder = useCallback(() => {
    setSelectedSource('')
    setSelectedColumns([])
    setFilters([])
    setGroupBy('')
    setSortBy('')
    setChartType('table')
    setResult(null)
    setReportName('')
    setReportDescription('')
    setEditingReportId(null)
    setStep(0)
  }, [])

  // Select data source
  const handleSelectSource = useCallback((key: string) => {
    setSelectedSource(key)
    setSelectedColumns([])
    setFilters([])
    setGroupBy('')
    setSortBy('')
    setResult(null)
    setStep(1)
  }, [])

  // Toggle column
  const toggleColumn = useCallback((key: string) => {
    setSelectedColumns(prev =>
      prev.includes(key) ? prev.filter(c => c !== key) : [...prev, key]
    )
  }, [])

  // Add filter
  const addFilter = useCallback(() => {
    if (!currentSource) return
    setFilters(prev => [...prev, { field: currentSource.fields[0].key, operator: 'contains', value: '' }])
  }, [currentSource])

  // Update filter
  const updateFilter = useCallback((idx: number, updates: Partial<ReportFilter>) => {
    setFilters(prev => prev.map((f, i) => i === idx ? { ...f, ...updates } : f))
  }, [])

  // Remove filter
  const removeFilter = useCallback((idx: number) => {
    setFilters(prev => prev.filter((_, i) => i !== idx))
  }, [])

  // Run report
  const runReport = useCallback(() => {
    if (!selectedSource || selectedColumns.length === 0) return
    const config: ReportConfig = {
      dataSource: selectedSource,
      columns: selectedColumns,
      filters: filters.length > 0 ? filters : undefined,
      groupBy: groupBy || undefined,
      sortBy: sortBy || undefined,
      chartType,
    }
    const res = executeReport(config, store)
    setResult(res)
    setStep(5)
  }, [selectedSource, selectedColumns, filters, groupBy, sortBy, chartType, store])

  // Save report
  const saveReport = useCallback(() => {
    const data = {
      name: reportName || 'Untitled Report',
      description: reportDescription,
      data_source: selectedSource,
      columns: JSON.stringify(selectedColumns),
      filters: JSON.stringify(filters),
      group_by: groupBy || null,
      sort_by: sortBy || null,
      chart_type: chartType,
    }
    if (editingReportId) {
      updateSavedReport(editingReportId, data)
    } else {
      addSavedReport(data)
    }
    resetBuilder()
  }, [reportName, reportDescription, selectedSource, selectedColumns, filters, groupBy, sortBy, chartType, editingReportId, addSavedReport, updateSavedReport, resetBuilder])

  // Load saved report
  const loadReport = useCallback((report: any) => {
    setSelectedSource(report.data_source)
    setSelectedColumns(JSON.parse(report.columns || '[]'))
    setFilters(JSON.parse(report.filters || '[]'))
    setGroupBy(report.group_by || '')
    setSortBy(report.sort_by || '')
    setChartType(report.chart_type || 'table')
    setReportName(report.name || '')
    setReportDescription(report.description || '')
    setEditingReportId(report.id)
    setStep(1)
    // Auto-run
    setTimeout(() => {
      const config: ReportConfig = {
        dataSource: report.data_source,
        columns: JSON.parse(report.columns || '[]'),
        filters: JSON.parse(report.filters || '[]').length > 0 ? JSON.parse(report.filters || '[]') : undefined,
        groupBy: report.group_by || undefined,
        sortBy: report.sort_by || undefined,
        chartType: report.chart_type || 'table',
      }
      const res = executeReport(config, store)
      setResult(res)
      setStep(5)
    }, 100)
  }, [store])

  // Export CSV
  const handleExportCSV = useCallback(() => {
    if (!result) return
    exportReportToCSV(result, reportName || 'report')
  }, [result, reportName])

  // Chart data for visualization
  const chartData = useMemo(() => {
    if (!result || result.rows.length === 0) return null
    // For grouped data, use group key + count
    if (groupBy && result.rows.length > 0) {
      return result.rows.map(row => ({
        label: String(row[groupBy] ?? 'Unknown'),
        value: row._count ?? 0,
      }))
    }
    // For ungrouped, try to find a numeric field
    const numericCol = selectedColumns.find(c => {
      const f = currentSource?.fields.find(ff => ff.key === c)
      return f?.type === 'number' || f?.type === 'currency'
    })
    const labelCol = selectedColumns.find(c => {
      const f = currentSource?.fields.find(ff => ff.key === c)
      return f?.type === 'text'
    })
    if (numericCol && labelCol) {
      return result.rows.slice(0, 20).map(row => ({
        label: String(row[labelCol] ?? ''),
        value: Number(row[numericCol]) || 0,
      }))
    }
    return null
  }, [result, groupBy, selectedColumns, currentSource])

  if (pageLoading) return <PageSkeleton />

  return (
    <>
      <Header title="Report Builder" subtitle="Create ad-hoc reports with custom data sources, fields, filters, and visualizations" />
      <main className="p-6 max-lg:p-4 space-y-6">

        {/* ── Back button when in builder ── */}
        {step > 0 && (
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={resetBuilder}>
              <X size={16} className="mr-1" /> Back to Reports
            </Button>
            <div className="flex items-center gap-1 text-xs text-t3">
              {['Source', 'Columns', 'Filters', 'Group & Sort', 'Visualization', 'Results'].map((label, i) => (
                <span key={i} className="flex items-center gap-1">
                  {i > 0 && <ChevronRight size={12} />}
                  <button
                    onClick={() => { if (i <= step) setStep(i === 0 ? 1 : i) }}
                    className={`px-2 py-0.5 rounded-lg transition-colors ${
                      i === step || (i === 0 && step >= 1) ? 'bg-tempo-100 text-tempo-700 font-medium' : 'hover:bg-surface-hover'
                    }`}
                  >
                    {label}
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════
            STEP 0: Saved Reports + Choose Data Source
           ════════════════════════════════════════════════════════ */}
        {step === 0 && (
          <>
            {/* Saved Reports */}
            {(savedReports?.length ?? 0) > 0 && (
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-t1 flex items-center gap-2">
                    <FileText size={20} /> Saved Reports
                  </h2>
                  <Button variant="ghost" size="sm" onClick={() => setShowSaved(!showSaved)}>
                    {showSaved ? 'Hide' : 'Show'}
                  </Button>
                </div>
                {showSaved && (
                  <div className="space-y-2">
                    {savedReports.map((report: any) => (
                      <div
                        key={report.id}
                        className="flex items-center justify-between p-3 rounded-xl border border-border hover:bg-surface-hover transition-colors group"
                      >
                        <div className="flex items-center gap-3 cursor-pointer flex-1" onClick={() => loadReport(report)}>
                          <div className="w-8 h-8 rounded-lg bg-tempo-50 flex items-center justify-center text-tempo-600">
                            {ICON_MAP[REPORT_DATA_SOURCES[report.data_source]?.icon] || <FileText size={16} />}
                          </div>
                          <div>
                            <div className="font-medium text-t1 text-sm">{report.name}</div>
                            <div className="text-xs text-t3">{REPORT_DATA_SOURCES[report.data_source]?.label || report.data_source} &middot; {report.chart_type || 'table'}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Badge>{report.is_public ? 'Shared' : 'Private'}</Badge>
                          <Button variant="ghost" size="sm" onClick={() => loadReport(report)}>
                            <Play size={14} className="mr-1" /> Run
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => deleteSavedReport(report.id)}>
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {/* Choose Data Source */}
            <Card>
              <h2 className="text-lg font-semibold text-t1 mb-4 flex items-center gap-2">
                <Plus size={20} /> New Report &mdash; Choose Data Source
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {Object.entries(REPORT_DATA_SOURCES).map(([key, source]) => (
                  <button
                    key={key}
                    onClick={() => handleSelectSource(key)}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border hover:border-tempo-300 hover:bg-tempo-50/50 transition-all text-center group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-tempo-50 flex items-center justify-center text-tempo-600 group-hover:bg-tempo-100 transition-colors">
                      {ICON_MAP[source.icon]}
                    </div>
                    <span className="text-sm font-medium text-t1">{source.label}</span>
                    <span className="text-xs text-t3">{source.fields.length} fields</span>
                  </button>
                ))}
              </div>
            </Card>
          </>
        )}

        {/* ════════════════════════════════════════════════════════
            STEP 1: Select Columns
           ════════════════════════════════════════════════════════ */}
        {step === 1 && currentSource && (
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-t1 flex items-center gap-2">
                <Columns3 size={20} /> Select Columns
              </h2>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setSelectedColumns(currentSource.fields.map(f => f.key))}>
                  Select All
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setSelectedColumns([])}>
                  Clear
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {currentSource.fields.map((field: FieldDef) => {
                const isSelected = selectedColumns.includes(field.key)
                return (
                  <button
                    key={field.key}
                    onClick={() => toggleColumn(field.key)}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                      isSelected
                        ? 'border-tempo-300 bg-tempo-50/80 text-tempo-700'
                        : 'border-border hover:border-tempo-200 hover:bg-surface-hover'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                      isSelected ? 'bg-tempo-500 border-tempo-500' : 'border-border'
                    }`}>
                      {isSelected && <Check size={12} className="text-white" />}
                    </div>
                    <div>
                      <div className="text-sm font-medium">{field.label}</div>
                      <div className="text-xs text-t3 capitalize">{field.type}</div>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Selected columns order */}
            {selectedColumns.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border">
                <div className="text-xs text-t3 mb-2 font-medium">Column Order ({selectedColumns.length} selected)</div>
                <div className="flex flex-wrap gap-2">
                  {selectedColumns.map((key) => {
                    const f = currentSource.fields.find(ff => ff.key === key)
                    return (
                      <span key={key} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-tempo-50 text-tempo-700 text-xs font-medium">
                        <GripVertical size={12} className="text-tempo-400" />
                        {f?.label || key}
                        <button onClick={() => toggleColumn(key)} className="ml-0.5 hover:text-red-500"><X size={12} /></button>
                      </span>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <Button size="sm" disabled={selectedColumns.length === 0} onClick={() => setStep(2)}>
                Next: Filters <ChevronRight size={14} className="ml-1" />
              </Button>
            </div>
          </Card>
        )}

        {/* ════════════════════════════════════════════════════════
            STEP 2: Add Filters
           ════════════════════════════════════════════════════════ */}
        {step === 2 && currentSource && (
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-t1 flex items-center gap-2">
                <Filter size={20} /> Filters
              </h2>
              <Button variant="ghost" size="sm" onClick={addFilter}>
                <Plus size={14} className="mr-1" /> Add Filter
              </Button>
            </div>

            {filters.length === 0 && (
              <div className="text-center py-8 text-t3 text-sm">
                No filters applied. Click &ldquo;Add Filter&rdquo; to narrow results, or skip this step.
              </div>
            )}

            <div className="space-y-3">
              {filters.map((filter, idx) => (
                <div key={idx} className="flex items-center gap-2 flex-wrap">
                  {/* Field */}
                  <select
                    value={filter.field}
                    onChange={e => updateFilter(idx, { field: e.target.value })}
                    className="px-3 py-2 rounded-lg border border-border bg-surface text-sm text-t1 min-w-[140px]"
                  >
                    {currentSource.fields.map(f => (
                      <option key={f.key} value={f.key}>{f.label}</option>
                    ))}
                  </select>
                  {/* Operator */}
                  <select
                    value={filter.operator}
                    onChange={e => updateFilter(idx, { operator: e.target.value as ReportFilter['operator'] })}
                    className="px-3 py-2 rounded-lg border border-border bg-surface text-sm text-t1 min-w-[130px]"
                  >
                    {OPERATORS.map(op => (
                      <option key={op.value} value={op.value}>{op.label}</option>
                    ))}
                  </select>
                  {/* Value */}
                  {filter.operator !== 'is_empty' && filter.operator !== 'is_not_empty' && (
                    <input
                      type="text"
                      value={filter.value}
                      onChange={e => updateFilter(idx, { value: e.target.value })}
                      placeholder="Value..."
                      className="px-3 py-2 rounded-lg border border-border bg-surface text-sm text-t1 min-w-[160px]"
                    />
                  )}
                  {/* Remove */}
                  <button onClick={() => removeFilter(idx)} className="p-2 text-t3 hover:text-red-500 transition-colors">
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-between">
              <Button variant="ghost" size="sm" onClick={() => setStep(1)}>Back</Button>
              <Button size="sm" onClick={() => setStep(3)}>
                Next: Group &amp; Sort <ChevronRight size={14} className="ml-1" />
              </Button>
            </div>
          </Card>
        )}

        {/* ════════════════════════════════════════════════════════
            STEP 3: Group & Sort
           ════════════════════════════════════════════════════════ */}
        {step === 3 && currentSource && (
          <Card>
            <h2 className="text-lg font-semibold text-t1 mb-4 flex items-center gap-2">
              <ArrowUpDown size={20} /> Group &amp; Sort
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-t2 mb-2">Group By (optional)</label>
                <select
                  value={groupBy}
                  onChange={e => setGroupBy(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm text-t1"
                >
                  <option value="">No grouping</option>
                  {currentSource.fields.filter(f => f.type === 'text').map(f => (
                    <option key={f.key} value={f.key}>{f.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-t2 mb-2">Sort By</label>
                <div className="flex gap-2">
                  <select
                    value={sortBy ? sortBy.split(':')[0] : ''}
                    onChange={e => {
                      const dir = sortBy?.split(':')[1] || 'asc'
                      setSortBy(e.target.value ? `${e.target.value}:${dir}` : '')
                    }}
                    className="flex-1 px-3 py-2 rounded-lg border border-border bg-surface text-sm text-t1"
                  >
                    <option value="">Default order</option>
                    {currentSource.fields.map(f => (
                      <option key={f.key} value={f.key}>{f.label}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => {
                      if (!sortBy) return
                      const [field, dir] = sortBy.split(':')
                      setSortBy(`${field}:${dir === 'asc' ? 'desc' : 'asc'}`)
                    }}
                    className="px-3 py-2 rounded-lg border border-border bg-surface text-sm text-t1 hover:bg-surface-hover transition-colors"
                  >
                    {sortBy?.endsWith(':desc') ? 'DESC' : 'ASC'}
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-between">
              <Button variant="ghost" size="sm" onClick={() => setStep(2)}>Back</Button>
              <Button size="sm" onClick={() => setStep(4)}>
                Next: Visualization <ChevronRight size={14} className="ml-1" />
              </Button>
            </div>
          </Card>
        )}

        {/* ════════════════════════════════════════════════════════
            STEP 4: Choose Visualization
           ════════════════════════════════════════════════════════ */}
        {step === 4 && (
          <Card>
            <h2 className="text-lg font-semibold text-t1 mb-4 flex items-center gap-2">
              <BarChart3 size={20} /> Choose Visualization
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {(['table', 'bar', 'line', 'pie'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setChartType(type)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                    chartType === type
                      ? 'border-tempo-300 bg-tempo-50/80 text-tempo-700'
                      : 'border-border hover:border-tempo-200 hover:bg-surface-hover'
                  }`}
                >
                  {CHART_ICONS[type]}
                  <span className="text-sm font-medium capitalize">{type === 'bar' ? 'Bar Chart' : type === 'line' ? 'Line Chart' : type === 'pie' ? 'Pie Chart' : 'Data Table'}</span>
                </button>
              ))}
            </div>

            <div className="mt-6 flex justify-between">
              <Button variant="ghost" size="sm" onClick={() => setStep(3)}>Back</Button>
              <Button size="sm" onClick={runReport}>
                <Play size={14} className="mr-1" /> Run Report
              </Button>
            </div>
          </Card>
        )}

        {/* ════════════════════════════════════════════════════════
            STEP 5: Results
           ════════════════════════════════════════════════════════ */}
        {step === 5 && result && (
          <>
            {/* Actions bar */}
            <Card>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-t1">Report Results</h2>
                    <Badge>{result.totalRows} rows</Badge>
                  </div>
                  {currentSource && (
                    <div className="text-xs text-t3 mt-0.5">
                      Source: {currentSource.label} &middot; {selectedColumns.length} columns
                      {groupBy ? ` \u00b7 Grouped by ${currentSource.fields.find(f => f.key === groupBy)?.label || groupBy}` : ''}
                      {filters.length > 0 ? ` \u00b7 ${filters.length} filter(s)` : ''}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setStep(4)}>
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleExportCSV}>
                    <Download size={14} className="mr-1" /> Export CSV
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => {
                    // Show save dialog inline
                    const name = reportName || prompt('Report name:')
                    if (name) {
                      setReportName(name)
                      setTimeout(() => saveReport(), 0)
                    }
                  }}>
                    <Save size={14} className="mr-1" /> Save
                  </Button>
                  <Button size="sm" onClick={runReport}>
                    <Play size={14} className="mr-1" /> Re-run
                  </Button>
                </div>
              </div>
            </Card>

            {/* Chart visualization */}
            {chartType !== 'table' && chartData && chartData.length > 0 && (
              <Card>
                <h3 className="text-sm font-medium text-t2 mb-4">
                  {chartType === 'bar' ? 'Bar Chart' : chartType === 'line' ? 'Line Chart' : 'Pie Chart'}
                </h3>
                {chartType === 'bar' && (
                  <BarChart
                    labels={chartData.map(d => d.label)}
                    values={chartData.map(d => d.value)}
                  />
                )}
                {chartType === 'line' && (
                  <SimpleLineChart data={chartData} />
                )}
                {chartType === 'pie' && (
                  <SimplePieChart data={chartData} />
                )}
              </Card>
            )}

            {/* Data table */}
            <Card padding="none">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-surface">
                      {result.columns.map(col => {
                        const field = currentSource?.fields.find(f => f.key === col)
                        return (
                          <th key={col} className="px-4 py-3 text-left text-xs font-semibold text-t2 uppercase tracking-wider whitespace-nowrap">
                            {field?.label || col}
                          </th>
                        )
                      })}
                      {groupBy && <th className="px-4 py-3 text-left text-xs font-semibold text-t2 uppercase tracking-wider">Count</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {result.rows.length === 0 ? (
                      <tr>
                        <td colSpan={result.columns.length + (groupBy ? 1 : 0)} className="px-4 py-12 text-center text-t3">
                          No data matches your criteria
                        </td>
                      </tr>
                    ) : (
                      result.rows.slice(0, 200).map((row, i) => (
                        <tr key={i} className="border-b border-border last:border-0 hover:bg-surface-hover transition-colors">
                          {result.columns.map(col => {
                            const field = currentSource?.fields.find(f => f.key === col)
                            let val = row[col]
                            // Format currency (in cents)
                            if (field?.type === 'currency' && typeof val === 'number') {
                              val = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(val / 100)
                            }
                            // Format date
                            if (field?.type === 'date' && val) {
                              try { val = new Date(val).toLocaleDateString() } catch { /* keep original */ }
                            }
                            return (
                              <td key={col} className="px-4 py-3 text-t1 whitespace-nowrap max-w-[240px] truncate">
                                {val ?? <span className="text-t3">--</span>}
                              </td>
                            )
                          })}
                          {groupBy && (
                            <td className="px-4 py-3 text-t1 font-medium">{row._count}</td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {result.rows.length > 200 && (
                <div className="px-4 py-3 border-t border-border text-xs text-t3 text-center">
                  Showing first 200 of {result.totalRows} rows. Export to CSV for the full dataset.
                </div>
              )}
            </Card>

            {/* Save form (when editing or naming) */}
            {editingReportId && (
              <Card>
                <h3 className="text-sm font-medium text-t2 mb-3">Save Report</h3>
                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-t3 mb-1">Report Name</label>
                    <input
                      type="text"
                      value={reportName}
                      onChange={e => setReportName(e.target.value)}
                      placeholder="My Custom Report"
                      className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm text-t1"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-t3 mb-1">Description</label>
                    <input
                      type="text"
                      value={reportDescription}
                      onChange={e => setReportDescription(e.target.value)}
                      placeholder="Optional description..."
                      className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm text-t1"
                    />
                  </div>
                </div>
                <div className="mt-3 flex justify-end">
                  <Button size="sm" onClick={saveReport}>
                    <Save size={14} className="mr-1" /> Update Report
                  </Button>
                </div>
              </Card>
            )}
          </>
        )}
      </main>
    </>
  )
}
