// Advanced Analytics Engine
// Cross-module reports, custom report builder, formula support, dynamic dashboards
// Embedded BI: pivot tables, trend analysis, cohort analysis, benchmarks, exports

import { db, schema, withRetry } from '@/lib/db'
import { eq, and, sql, gte, lte, count, avg, sum, min, max } from 'drizzle-orm'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ReportDefinition {
  id: string
  name: string
  description: string
  modules: string[] // data sources
  columns: ReportColumn[]
  filters?: ReportFilter[]
  groupBy?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  formulas?: ReportFormula[]
  visualization?: 'table' | 'bar' | 'line' | 'pie' | 'scatter' | 'heatmap'
  dateBucket?: 'day' | 'week' | 'month' | 'quarter' | 'year'
  dateField?: string
}

export interface ReportColumn {
  field: string
  label: string
  module: string
  type: 'string' | 'number' | 'date' | 'boolean'
  aggregation?: 'count' | 'sum' | 'avg' | 'min' | 'max' | 'count_distinct' | 'median' | 'percentile'
  percentileValue?: number // e.g. 90 for p90
}

export interface ReportFilter {
  field: string
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'in'
  value: unknown
}

export interface ReportFormula {
  name: string
  expression: string // e.g., "col1 / col2 * 100"
  type: 'number' | 'percentage' | 'currency'
}

export interface ReportResult {
  columns: string[]
  rows: Record<string, unknown>[]
  totals?: Record<string, number>
  metadata: {
    generatedAt: string
    rowCount: number
    executionMs: number
  }
}

// --- Pivot Table Types ---

export interface PivotConfig {
  source: string // module name
  rows: string[] // row dimension fields
  columns: string[] // column dimension fields
  values: { field: string; aggregation: string }[] // value aggregations
  filters?: { field: string; operator: string; value: any }[]
}

export interface PivotResult {
  rowHeaders: string[][]
  columnHeaders: string[][]
  values: number[][][]  // [rowIndex][colIndex][valueIndex]
  valueLabels: string[]
  metadata: {
    generatedAt: string
    rowCount: number
    columnCount: number
    executionMs: number
  }
}

// --- Trend Analysis Types ---

export interface TrendConfig {
  metric: string // e.g., 'headcount', 'payroll_cost', 'turnover_rate'
  startDate: string
  endDate: string
  granularity: 'day' | 'week' | 'month' | 'quarter' | 'year'
}

export interface TrendDataPoint {
  period: string
  value: number
  change?: number // absolute change from previous period
  changePercent?: number // % change from previous period
  movingAvg3?: number
  movingAvg6?: number
  isAnomaly?: boolean
}

export interface TrendResult {
  metric: string
  direction: 'growing' | 'declining' | 'stable' | 'volatile'
  dataPoints: TrendDataPoint[]
  projections: { period: string; value: number }[]
  summary: {
    startValue: number
    endValue: number
    totalChange: number
    totalChangePercent: number
    avgValue: number
    minValue: number
    maxValue: number
    stdDeviation: number
  }
  metadata: {
    generatedAt: string
    executionMs: number
  }
}

// --- Cohort Analysis Types ---

export interface CohortConfig {
  cohortType: 'monthly' | 'quarterly'
  metric: 'retention' | 'performance' | 'salary_growth'
  periodsToTrack?: number // default 12 for monthly, 8 for quarterly
}

export interface CohortResult {
  cohorts: {
    label: string // e.g., "2024-Q1" or "2024-01"
    startCount: number
    periods: {
      period: number // 0, 1, 2, ...
      value: number // rate/score depending on metric
      count: number // n in cohort at this period
    }[]
  }[]
  metadata: {
    generatedAt: string
    cohortCount: number
    executionMs: number
  }
}

// --- Benchmark Types ---

export interface BenchmarkMetric {
  name: string
  label: string
  value: number
  benchmark: number
  unit: string
  indicator: 'above' | 'below' | 'at'
  percentDiff: number
}

export interface BenchmarkResult {
  orgMetrics: BenchmarkMetric[]
  metadata: {
    generatedAt: string
    executionMs: number
    benchmarkSource: string
  }
}

// --- Scheduled Report Types ---

export interface ScheduledReport {
  id: string
  reportId: string
  schedule: 'daily' | 'weekly' | 'monthly' | 'quarterly'
  recipients: string[]
  format: 'csv' | 'pdf' | 'json'
  lastRun?: string
  nextRun: string
}

// ---------------------------------------------------------------------------
// Pre-built Report Templates
// ---------------------------------------------------------------------------

export const REPORT_TEMPLATES: ReportDefinition[] = [
  {
    id: 'headcount-by-department',
    name: 'Headcount by Department',
    description: 'Active employee count grouped by department',
    modules: ['employees', 'departments'],
    columns: [
      { field: 'department', label: 'Department', module: 'departments', type: 'string' },
      { field: 'count', label: 'Headcount', module: 'employees', type: 'number', aggregation: 'count' },
    ],
    groupBy: 'department',
    visualization: 'bar',
  },
  {
    id: 'headcount-by-country',
    name: 'Headcount by Country',
    description: 'Employee distribution across countries',
    modules: ['employees'],
    columns: [
      { field: 'country', label: 'Country', module: 'employees', type: 'string' },
      { field: 'count', label: 'Headcount', module: 'employees', type: 'number', aggregation: 'count' },
    ],
    groupBy: 'country',
    visualization: 'pie',
  },
  {
    id: 'turnover-analysis',
    name: 'Turnover Analysis',
    description: 'Inactive employees vs total (attrition proxy)',
    modules: ['employees'],
    columns: [
      { field: 'is_active', label: 'Status', module: 'employees', type: 'boolean' },
      { field: 'count', label: 'Count', module: 'employees', type: 'number', aggregation: 'count' },
    ],
    groupBy: 'is_active',
    visualization: 'pie',
  },
  {
    id: 'compensation-summary',
    name: 'Compensation Summary',
    description: 'Salary review status breakdown',
    modules: ['salaryReviews'],
    columns: [
      { field: 'status', label: 'Status', module: 'salaryReviews', type: 'string' },
      { field: 'count', label: 'Count', module: 'salaryReviews', type: 'number', aggregation: 'count' },
      { field: 'avg_proposed', label: 'Avg Proposed', module: 'salaryReviews', type: 'number', aggregation: 'avg' },
    ],
    groupBy: 'status',
    visualization: 'bar',
  },
  {
    id: 'leave-utilization',
    name: 'Leave Utilization',
    description: 'Leave requests by type and status',
    modules: ['leaveRequests'],
    columns: [
      { field: 'type', label: 'Leave Type', module: 'leaveRequests', type: 'string' },
      { field: 'status', label: 'Status', module: 'leaveRequests', type: 'string' },
      { field: 'count', label: 'Requests', module: 'leaveRequests', type: 'number', aggregation: 'count' },
      { field: 'total_days', label: 'Total Days', module: 'leaveRequests', type: 'number', aggregation: 'sum' },
    ],
    groupBy: 'type',
    visualization: 'bar',
  },
  {
    id: 'performance-ratings',
    name: 'Performance Ratings Distribution',
    description: 'Review ratings across the organization',
    modules: ['reviews'],
    columns: [
      { field: 'overall_rating', label: 'Rating', module: 'reviews', type: 'number' },
      { field: 'count', label: 'Count', module: 'reviews', type: 'number', aggregation: 'count' },
    ],
    groupBy: 'overall_rating',
    visualization: 'bar',
  },
  {
    id: 'recruiting-pipeline',
    name: 'Recruiting Pipeline',
    description: 'Applications by stage',
    modules: ['applications'],
    columns: [
      { field: 'stage', label: 'Stage', module: 'applications', type: 'string' },
      { field: 'count', label: 'Candidates', module: 'applications', type: 'number', aggregation: 'count' },
    ],
    groupBy: 'stage',
    visualization: 'bar',
  },
  {
    id: 'it-asset-inventory',
    name: 'IT Asset Inventory',
    description: 'Devices by type and status',
    modules: ['devices'],
    columns: [
      { field: 'type', label: 'Device Type', module: 'devices', type: 'string' },
      { field: 'status', label: 'Status', module: 'devices', type: 'string' },
      { field: 'count', label: 'Count', module: 'devices', type: 'number', aggregation: 'count' },
    ],
    groupBy: 'type',
    visualization: 'bar',
  },
  {
    id: 'budget-vs-actual',
    name: 'Budget vs Actual Spend',
    description: 'Department budget utilization',
    modules: ['budgets'],
    columns: [
      { field: 'name', label: 'Budget', module: 'budgets', type: 'string' },
      { field: 'total_amount', label: 'Budget', module: 'budgets', type: 'number' },
      { field: 'spent_amount', label: 'Spent', module: 'budgets', type: 'number' },
    ],
    formulas: [{ name: 'utilization', expression: 'spent_amount / total_amount * 100', type: 'percentage' }],
    visualization: 'bar',
  },
  {
    id: 'cross-module-workforce',
    name: 'Workforce Overview (Cross-Module)',
    description: 'Joined report: headcount, open positions, engagement, learning',
    modules: ['employees', 'jobPostings', 'engagementScores', 'enrollments'],
    columns: [
      { field: 'total_employees', label: 'Total Employees', module: 'employees', type: 'number', aggregation: 'count' },
      { field: 'open_positions', label: 'Open Positions', module: 'jobPostings', type: 'number', aggregation: 'count' },
      { field: 'avg_engagement', label: 'Avg Engagement', module: 'engagementScores', type: 'number', aggregation: 'avg' },
      { field: 'active_enrollments', label: 'Active Enrollments', module: 'enrollments', type: 'number', aggregation: 'count' },
    ],
    visualization: 'table',
  },
  // --- New embedded BI report templates ---
  {
    id: 'payroll-trend-monthly',
    name: 'Monthly Payroll Trend',
    description: 'Total gross payroll cost over time by month',
    modules: ['payrollRuns'],
    columns: [
      { field: 'period', label: 'Period', module: 'payrollRuns', type: 'string' },
      { field: 'totalGross', label: 'Total Gross', module: 'payrollRuns', type: 'number', aggregation: 'sum' },
      { field: 'employeeCount', label: 'Employees', module: 'payrollRuns', type: 'number', aggregation: 'sum' },
    ],
    groupBy: 'period',
    visualization: 'line',
  },
  {
    id: 'salary-distribution',
    name: 'Salary Distribution by Level',
    description: 'Current vs proposed salary statistics by employee level',
    modules: ['salaryReviews', 'employees'],
    columns: [
      { field: 'level', label: 'Level', module: 'employees', type: 'string' },
      { field: 'currentSalary', label: 'Avg Current', module: 'salaryReviews', type: 'number', aggregation: 'avg' },
      { field: 'proposedSalary', label: 'Avg Proposed', module: 'salaryReviews', type: 'number', aggregation: 'avg' },
      { field: 'count', label: 'Count', module: 'salaryReviews', type: 'number', aggregation: 'count' },
    ],
    groupBy: 'level',
    formulas: [{ name: 'avg_increase_pct', expression: '(proposedSalary - currentSalary) / currentSalary * 100', type: 'percentage' }],
    visualization: 'bar',
  },
  {
    id: 'expense-by-category',
    name: 'Expense Reports by Category',
    description: 'Total expense amounts grouped by category',
    modules: ['expenseReports'],
    columns: [
      { field: 'category', label: 'Category', module: 'expenseReports', type: 'string' },
      { field: 'amount', label: 'Total Amount', module: 'expenseReports', type: 'number', aggregation: 'sum' },
      { field: 'count', label: 'Reports', module: 'expenseReports', type: 'number', aggregation: 'count' },
    ],
    groupBy: 'category',
    visualization: 'pie',
  },
  {
    id: 'vendor-spend-analysis',
    name: 'Vendor Spend Analysis',
    description: 'Invoice totals by vendor',
    modules: ['invoices', 'vendors'],
    columns: [
      { field: 'vendorId', label: 'Vendor', module: 'invoices', type: 'string' },
      { field: 'amount', label: 'Total Invoiced', module: 'invoices', type: 'number', aggregation: 'sum' },
      { field: 'count', label: 'Invoices', module: 'invoices', type: 'number', aggregation: 'count' },
    ],
    groupBy: 'vendorId',
    visualization: 'bar',
  },
  {
    id: 'learning-completion-rate',
    name: 'Learning Completion Rate',
    description: 'Course enrollment status breakdown',
    modules: ['enrollments', 'courses'],
    columns: [
      { field: 'status', label: 'Status', module: 'enrollments', type: 'string' },
      { field: 'count', label: 'Enrollments', module: 'enrollments', type: 'number', aggregation: 'count' },
    ],
    groupBy: 'status',
    visualization: 'pie',
  },
  {
    id: 'headcount-by-level',
    name: 'Headcount by Job Level',
    description: 'Active employee count grouped by level/seniority',
    modules: ['employees'],
    columns: [
      { field: 'level', label: 'Level', module: 'employees', type: 'string' },
      { field: 'count', label: 'Headcount', module: 'employees', type: 'number', aggregation: 'count' },
    ],
    groupBy: 'level',
    visualization: 'bar',
  },
]

// ---------------------------------------------------------------------------
// Report Execution Engine
// ---------------------------------------------------------------------------

const TABLE_MAP: Record<string, any> = {
  employees: schema.employees,
  departments: schema.departments,
  goals: schema.goals,
  reviews: schema.reviews,
  feedback: schema.feedback,
  salaryReviews: schema.salaryReviews,
  compBands: schema.compBands,
  courses: schema.courses,
  enrollments: schema.enrollments,
  surveys: schema.surveys,
  engagementScores: schema.engagementScores,
  leaveRequests: schema.leaveRequests,
  payrollRuns: schema.payrollRuns,
  jobPostings: schema.jobPostings,
  applications: schema.applications,
  devices: schema.devices,
  softwareLicenses: schema.softwareLicenses,
  itRequests: schema.itRequests,
  invoices: schema.invoices,
  budgets: schema.budgets,
  vendors: schema.vendors,
  projects: schema.projects,
  expenseReports: schema.expenseReports,
}

// ---------------------------------------------------------------------------
// Utility: Apply filters to rows in memory
// ---------------------------------------------------------------------------

function applyFilters(rows: any[], filters: ReportFilter[]): any[] {
  return rows.filter(row => {
    return filters.every(f => {
      const val = row[f.field]
      switch (f.operator) {
        case 'eq': return val === f.value
        case 'neq': return val !== f.value
        case 'gt': return Number(val) > Number(f.value)
        case 'gte': return Number(val) >= Number(f.value)
        case 'lt': return Number(val) < Number(f.value)
        case 'lte': return Number(val) <= Number(f.value)
        case 'contains': return String(val).toLowerCase().includes(String(f.value).toLowerCase())
        case 'in': return Array.isArray(f.value) && f.value.includes(val)
        default: return true
      }
    })
  })
}

// ---------------------------------------------------------------------------
// Utility: Aggregation helpers
// ---------------------------------------------------------------------------

function computeAggregation(values: number[], aggregation: string, percentileValue?: number): number {
  if (values.length === 0) return 0
  switch (aggregation) {
    case 'count': return values.length
    case 'sum': return values.reduce((a, b) => a + b, 0)
    case 'avg': return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100
    case 'min': return Math.min(...values)
    case 'max': return Math.max(...values)
    case 'count_distinct': return new Set(values).size
    case 'median': {
      const sorted = [...values].sort((a, b) => a - b)
      const mid = Math.floor(sorted.length / 2)
      return sorted.length % 2 !== 0 ? sorted[mid] : Math.round(((sorted[mid - 1] + sorted[mid]) / 2) * 100) / 100
    }
    case 'percentile': {
      const p = percentileValue ?? 90
      const sorted = [...values].sort((a, b) => a - b)
      const idx = Math.ceil((p / 100) * sorted.length) - 1
      return sorted[Math.max(0, idx)]
    }
    default: return 0
  }
}

// ---------------------------------------------------------------------------
// Utility: Date bucket helpers
// ---------------------------------------------------------------------------

function getDateBucket(date: Date | string, granularity: string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return 'Unknown'
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  switch (granularity) {
    case 'day': return `${year}-${month}-${day}`
    case 'week': {
      // ISO week: Monday-based
      const jan1 = new Date(year, 0, 1)
      const dayOfYear = Math.floor((d.getTime() - jan1.getTime()) / 86400000) + 1
      const weekNum = Math.ceil(dayOfYear / 7)
      return `${year}-W${String(weekNum).padStart(2, '0')}`
    }
    case 'month': return `${year}-${month}`
    case 'quarter': {
      const q = Math.ceil((d.getMonth() + 1) / 3)
      return `${year}-Q${q}`
    }
    case 'year': return `${year}`
    default: return `${year}-${month}`
  }
}

// ---------------------------------------------------------------------------
// Utility: Math helpers for trend analysis
// ---------------------------------------------------------------------------

function standardDeviation(values: number[]): number {
  if (values.length === 0) return 0
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const squaredDiffs = values.map(v => (v - mean) ** 2)
  return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / values.length)
}

function linearRegression(values: number[]): { slope: number; intercept: number } {
  const n = values.length
  if (n < 2) return { slope: 0, intercept: values[0] || 0 }
  const xs = values.map((_, i) => i)
  const sumX = xs.reduce((a, b) => a + b, 0)
  const sumY = values.reduce((a, b) => a + b, 0)
  const sumXY = xs.reduce((acc, x, i) => acc + x * values[i], 0)
  const sumX2 = xs.reduce((acc, x) => acc + x * x, 0)
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n
  return { slope: isFinite(slope) ? slope : 0, intercept: isFinite(intercept) ? intercept : 0 }
}

function movingAverage(values: number[], window: number): (number | null)[] {
  return values.map((_, i) => {
    if (i < window - 1) return null
    const slice = values.slice(i - window + 1, i + 1)
    return Math.round((slice.reduce((a, b) => a + b, 0) / slice.length) * 100) / 100
  })
}

// ---------------------------------------------------------------------------
// Safe formula eval (arithmetic only, no arbitrary code)
// ---------------------------------------------------------------------------

function evalFormula(expression: string, variables: Record<string, number>): number {
  let expr = expression
  // Sort variable names by length (descending) to avoid partial replacements
  const keys = Object.keys(variables).sort((a, b) => b.length - a.length)
  for (const key of keys) {
    expr = expr.replace(new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), String(variables[key]))
  }
  // Only allow digits, operators, parentheses, decimals, whitespace
  if (!/^[\d\s+\-*/().]+$/.test(expr)) return 0
  try {
    const result = Function(`"use strict"; return (${expr})`)()
    return typeof result === 'number' && isFinite(result) ? Math.round(result * 100) / 100 : 0
  } catch {
    return 0
  }
}

// ---------------------------------------------------------------------------
// 1. Execute Report (existing, unchanged)
// ---------------------------------------------------------------------------

export async function executeReport(orgId: string, reportId: string): Promise<ReportResult> {
  const start = Date.now()
  const template = REPORT_TEMPLATES.find(t => t.id === reportId)
  if (!template) throw new Error(`Unknown report: ${reportId}`)

  const primaryModule = template.modules[0]
  const table = TABLE_MAP[primaryModule]
  if (!table) throw new Error(`Unknown module: ${primaryModule}`)

  // Execute query
  const rows = await withRetry(() =>
    db.select().from(table).where(table.orgId ? eq(table.orgId, orgId) : undefined)
  )

  // Group and aggregate
  let resultRows: Record<string, unknown>[] = []

  if (template.groupBy) {
    const groups = new Map<string, any[]>()
    for (const row of rows) {
      const key = String((row as any)[template.groupBy] || 'Unknown')
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(row)
    }

    for (const [key, groupRows] of groups) {
      const result: Record<string, unknown> = { [template.groupBy]: key }

      for (const col of template.columns) {
        if (col.aggregation === 'count') {
          result[col.field] = groupRows.length
        } else if (col.aggregation === 'sum' && col.field in (groupRows[0] || {})) {
          result[col.field] = groupRows.reduce((s, r) => s + (Number(r[col.field]) || 0), 0)
        } else if (col.aggregation === 'avg' && col.field in (groupRows[0] || {})) {
          const vals = groupRows.map(r => Number(r[col.field]) || 0)
          result[col.field] = vals.length > 0 ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0
        }
      }

      resultRows.push(result)
    }
  } else {
    // No grouping — return raw or aggregated
    if (template.columns.some(c => c.aggregation)) {
      // Single row aggregate
      const result: Record<string, unknown> = {}
      for (const col of template.columns) {
        if (col.aggregation === 'count') result[col.field] = rows.length
        else if (col.aggregation === 'sum') {
          result[col.field] = rows.reduce((s, r: any) => s + (Number(r[col.field]) || 0), 0)
        } else if (col.aggregation === 'avg') {
          const vals = rows.map((r: any) => Number(r[col.field]) || 0)
          result[col.field] = vals.length > 0 ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0
        }
      }
      resultRows = [result]
    } else {
      resultRows = rows.map((r: any) => {
        const result: Record<string, unknown> = {}
        for (const col of template.columns) {
          result[col.field] = r[col.field]
        }
        return result
      })
    }
  }

  // Apply formulas
  if (template.formulas) {
    for (const row of resultRows) {
      for (const formula of template.formulas) {
        const vars: Record<string, number> = {}
        for (const [key, value] of Object.entries(row)) {
          vars[key] = Number(value) || 0
        }
        row[formula.name] = evalFormula(formula.expression, vars)
      }
    }
  }

  // Calculate totals
  const totals: Record<string, number> = {}
  for (const col of template.columns) {
    if (col.type === 'number') {
      totals[col.field] = resultRows.reduce((s, r) => s + (Number(r[col.field]) || 0), 0)
    }
  }

  return {
    columns: template.columns.map(c => c.label),
    rows: resultRows,
    totals,
    metadata: {
      generatedAt: new Date().toISOString(),
      rowCount: resultRows.length,
      executionMs: Date.now() - start,
    },
  }
}

// ---------------------------------------------------------------------------
// Cross-module report (existing, unchanged)
// ---------------------------------------------------------------------------

export async function executeCrossModuleReport(orgId: string): Promise<ReportResult> {
  const start = Date.now()

  const [employees, jobPostings, engagementScores, enrollments, leaveRequests, reviews] = await withRetry(() =>
    Promise.all([
      db.select().from(schema.employees).where(and(eq(schema.employees.orgId, orgId), eq(schema.employees.isActive, true))),
      db.select().from(schema.jobPostings).where(and(eq(schema.jobPostings.orgId, orgId), eq(schema.jobPostings.status, 'open'))),
      db.select().from(schema.engagementScores).where(eq(schema.engagementScores.orgId, orgId)),
      db.select().from(schema.enrollments).where(eq(schema.enrollments.orgId, orgId)),
      db.select().from(schema.leaveRequests).where(eq(schema.leaveRequests.orgId, orgId)),
      db.select().from(schema.reviews).where(eq(schema.reviews.orgId, orgId)),
    ])
  )

  const avgEngagement = engagementScores.length > 0
    ? Math.round(engagementScores.reduce((s, e) => s + (Number(e.overallScore) || 0), 0) / engagementScores.length)
    : 0

  const avgRating = reviews.filter(r => r.overallRating).length > 0
    ? (reviews.filter(r => r.overallRating).reduce((s, r) => s + (Number(r.overallRating) || 0), 0) / reviews.filter(r => r.overallRating).length).toFixed(1)
    : 'N/A'

  const activeEnrollments = enrollments.filter(e => e.status === 'in_progress' || e.status === 'enrolled').length
  const pendingLeave = leaveRequests.filter(l => l.status === 'pending').length

  return {
    columns: ['Metric', 'Value'],
    rows: [
      { metric: 'Active Employees', value: employees.length },
      { metric: 'Open Positions', value: jobPostings.length },
      { metric: 'Avg Engagement Score', value: avgEngagement },
      { metric: 'Avg Performance Rating', value: avgRating },
      { metric: 'Active Course Enrollments', value: activeEnrollments },
      { metric: 'Pending Leave Requests', value: pendingLeave },
      { metric: 'Completed Reviews', value: reviews.filter(r => r.status === 'completed').length },
    ],
    metadata: {
      generatedAt: new Date().toISOString(),
      rowCount: 7,
      executionMs: Date.now() - start,
    },
  }
}

// ---------------------------------------------------------------------------
// 2. Custom Report Builder Engine
// ---------------------------------------------------------------------------

export async function buildCustomReport(orgId: string, definition: ReportDefinition): Promise<ReportResult> {
  const start = Date.now()

  // Validate modules
  for (const mod of definition.modules) {
    if (!TABLE_MAP[mod]) throw new Error(`Unknown module: ${mod}`)
  }

  // Fetch data from all referenced modules in parallel
  const moduleData: Record<string, any[]> = {}
  await withRetry(async () => {
    const fetches = definition.modules.map(async mod => {
      const table = TABLE_MAP[mod]
      const rows = await db.select().from(table)
        .where(table.orgId ? eq(table.orgId, orgId) : undefined)
      moduleData[mod] = rows
    })
    await Promise.all(fetches)
  })

  // For multi-module reports, attempt to join on common keys
  // Strategy: use the first module as primary, join others by employeeId/departmentId/orgId
  let combinedRows: any[]
  if (definition.modules.length === 1) {
    combinedRows = moduleData[definition.modules[0]]
  } else {
    // Build a joined dataset: start with primary module rows
    const primaryRows = moduleData[definition.modules[0]]
    combinedRows = primaryRows.map(row => {
      const combined: any = { ...row }
      // Try to join secondary tables by employeeId, departmentId, or id
      for (let i = 1; i < definition.modules.length; i++) {
        const secModule = definition.modules[i]
        const secRows = moduleData[secModule]
        // Find matching row by common keys
        const match = secRows.find((sr: any) =>
          (sr.employeeId && sr.employeeId === row.employeeId) ||
          (sr.employeeId && sr.employeeId === row.id) ||
          (sr.departmentId && sr.departmentId === row.departmentId) ||
          (sr.departmentId && sr.departmentId === row.id) ||
          (sr.id && sr.id === row.departmentId)
        )
        if (match) {
          // Prefix secondary fields to avoid collision
          for (const [k, v] of Object.entries(match)) {
            if (!(k in combined)) combined[k] = v
            combined[`${secModule}.${k}`] = v
          }
        }
      }
      return combined
    })
  }

  // Apply filters
  if (definition.filters && definition.filters.length > 0) {
    combinedRows = applyFilters(combinedRows, definition.filters)
  }

  // Date bucketing
  if (definition.dateBucket && definition.dateField) {
    for (const row of combinedRows) {
      const dateVal = row[definition.dateField]
      if (dateVal) {
        row.__dateBucket = getDateBucket(dateVal, definition.dateBucket)
      } else {
        row.__dateBucket = 'Unknown'
      }
    }
  }

  // Group
  const groupField = definition.dateBucket ? '__dateBucket' : definition.groupBy
  let resultRows: Record<string, unknown>[] = []

  if (groupField) {
    const groups = new Map<string, any[]>()
    for (const row of combinedRows) {
      const key = String(row[groupField] ?? 'Unknown')
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(row)
    }

    for (const [key, groupRows] of groups) {
      const result: Record<string, unknown> = { [definition.groupBy || '__dateBucket']: key }

      for (const col of definition.columns) {
        if (col.aggregation) {
          const vals = groupRows.map(r => Number(r[col.field] ?? r[`${col.module}.${col.field}`]) || 0)
          result[col.field] = computeAggregation(vals, col.aggregation, col.percentileValue)
        } else {
          // Take first value
          result[col.field] = groupRows[0]?.[col.field] ?? groupRows[0]?.[`${col.module}.${col.field}`]
        }
      }
      resultRows.push(result)
    }
  } else if (definition.columns.some(c => c.aggregation)) {
    // No grouping, single aggregate row
    const result: Record<string, unknown> = {}
    for (const col of definition.columns) {
      if (col.aggregation) {
        const vals = combinedRows.map(r => Number(r[col.field] ?? r[`${col.module}.${col.field}`]) || 0)
        result[col.field] = computeAggregation(vals, col.aggregation, col.percentileValue)
      }
    }
    resultRows = [result]
  } else {
    // Raw rows — extract requested columns
    resultRows = combinedRows.map(r => {
      const result: Record<string, unknown> = {}
      for (const col of definition.columns) {
        result[col.field] = r[col.field] ?? r[`${col.module}.${col.field}`]
      }
      return result
    })
  }

  // Apply formulas
  if (definition.formulas) {
    for (const row of resultRows) {
      for (const formula of definition.formulas) {
        const vars: Record<string, number> = {}
        for (const [key, value] of Object.entries(row)) {
          vars[key] = Number(value) || 0
        }
        row[formula.name] = evalFormula(formula.expression, vars)
      }
    }
  }

  // Sort
  if (definition.sortBy) {
    const dir = definition.sortOrder === 'desc' ? -1 : 1
    resultRows.sort((a, b) => {
      const av = a[definition.sortBy!]
      const bv = b[definition.sortBy!]
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir
      return String(av ?? '').localeCompare(String(bv ?? '')) * dir
    })
  }

  // Totals
  const totals: Record<string, number> = {}
  for (const col of definition.columns) {
    if (col.type === 'number') {
      totals[col.field] = resultRows.reduce((s, r) => s + (Number(r[col.field]) || 0), 0)
    }
  }

  return {
    columns: definition.columns.map(c => c.label),
    rows: resultRows,
    totals,
    metadata: {
      generatedAt: new Date().toISOString(),
      rowCount: resultRows.length,
      executionMs: Date.now() - start,
    },
  }
}

// ---------------------------------------------------------------------------
// 3. Pivot Table Engine
// ---------------------------------------------------------------------------

export async function executePivotReport(orgId: string, config: PivotConfig): Promise<PivotResult> {
  const start = Date.now()

  const table = TABLE_MAP[config.source]
  if (!table) throw new Error(`Unknown module: ${config.source}`)

  let rows: any[] = await withRetry(() =>
    db.select().from(table).where(table.orgId ? eq(table.orgId, orgId) : undefined)
  )

  // Apply filters
  if (config.filters && config.filters.length > 0) {
    rows = applyFilters(rows, config.filters as ReportFilter[])
  }

  // Build row keys and column keys
  const rowKeySet = new Map<string, string[]>() // serialized key -> parts
  const colKeySet = new Map<string, string[]>()

  for (const row of rows) {
    const rowParts = config.rows.map(f => String(row[f] ?? 'Unknown'))
    const colParts = config.columns.map(f => String(row[f] ?? 'Unknown'))
    const rowKey = rowParts.join('|')
    const colKey = colParts.join('|')
    if (!rowKeySet.has(rowKey)) rowKeySet.set(rowKey, rowParts)
    if (!colKeySet.has(colKey)) colKeySet.set(colKey, colParts)
  }

  const rowKeys = [...rowKeySet.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  const colKeys = [...colKeySet.entries()].sort((a, b) => a[0].localeCompare(b[0]))

  // Create value labels
  const valueLabels = config.values.map(v => `${v.aggregation}(${v.field})`)

  // Build the pivot data grid
  // For each (rowKey, colKey) combination, collect values and aggregate
  const cellMap = new Map<string, any[]>()
  for (const row of rows) {
    const rowParts = config.rows.map(f => String(row[f] ?? 'Unknown'))
    const colParts = config.columns.map(f => String(row[f] ?? 'Unknown'))
    const cellKey = `${rowParts.join('|')}::${colParts.join('|')}`
    if (!cellMap.has(cellKey)) cellMap.set(cellKey, [])
    cellMap.get(cellKey)!.push(row)
  }

  const values: number[][][] = rowKeys.map(([rowKey]) =>
    colKeys.map(([colKey]) => {
      const cellKey = `${rowKey}::${colKey}`
      const cellRows = cellMap.get(cellKey) || []
      return config.values.map(v => {
        const vals = cellRows.map(r => Number(r[v.field]) || 0)
        return computeAggregation(vals, v.aggregation)
      })
    })
  )

  return {
    rowHeaders: rowKeys.map(([, parts]) => parts),
    columnHeaders: colKeys.map(([, parts]) => parts),
    values,
    valueLabels,
    metadata: {
      generatedAt: new Date().toISOString(),
      rowCount: rowKeys.length,
      columnCount: colKeys.length,
      executionMs: Date.now() - start,
    },
  }
}

// ---------------------------------------------------------------------------
// 4. Trend Analysis
// ---------------------------------------------------------------------------

// Metric definitions: how to compute each metric from raw data
const TREND_METRICS: Record<string, {
  module: string
  dateField: string
  compute: (rows: any[]) => number
}> = {
  headcount: {
    module: 'employees',
    dateField: 'hireDate',
    compute: (rows) => rows.filter(r => r.isActive).length,
  },
  payroll_cost: {
    module: 'payrollRuns',
    dateField: 'runDate',
    compute: (rows) => rows.reduce((s, r) => s + (Number(r.totalGross) || 0), 0),
  },
  turnover_rate: {
    module: 'employees',
    dateField: 'hireDate',
    compute: (rows) => {
      const total = rows.length
      const inactive = rows.filter(r => !r.isActive).length
      return total > 0 ? Math.round((inactive / total) * 10000) / 100 : 0
    },
  },
  avg_engagement: {
    module: 'engagementScores',
    dateField: 'createdAt',
    compute: (rows) => {
      if (rows.length === 0) return 0
      return Math.round(rows.reduce((s, r) => s + (Number(r.overallScore) || 0), 0) / rows.length * 100) / 100
    },
  },
  leave_requests: {
    module: 'leaveRequests',
    dateField: 'createdAt',
    compute: (rows) => rows.length,
  },
  open_positions: {
    module: 'jobPostings',
    dateField: 'createdAt',
    compute: (rows) => rows.filter(r => r.status === 'open').length,
  },
  avg_performance: {
    module: 'reviews',
    dateField: 'createdAt',
    compute: (rows) => {
      const rated = rows.filter(r => r.overallRating)
      if (rated.length === 0) return 0
      return Math.round(rated.reduce((s, r) => s + Number(r.overallRating), 0) / rated.length * 100) / 100
    },
  },
  expense_total: {
    module: 'expenseReports',
    dateField: 'createdAt',
    compute: (rows) => rows.reduce((s, r) => s + (Number(r.amount) || 0), 0),
  },
}

export async function analyzeTrends(orgId: string, config: TrendConfig): Promise<TrendResult> {
  const start = Date.now()

  const metricDef = TREND_METRICS[config.metric]
  if (!metricDef) {
    throw new Error(`Unknown metric: ${config.metric}. Available: ${Object.keys(TREND_METRICS).join(', ')}`)
  }

  const table = TABLE_MAP[metricDef.module]
  if (!table) throw new Error(`Module not found: ${metricDef.module}`)

  const allRows: any[] = await withRetry(() =>
    db.select().from(table).where(table.orgId ? eq(table.orgId, orgId) : undefined)
  )

  // Generate period buckets between startDate and endDate
  const startD = new Date(config.startDate)
  const endD = new Date(config.endDate)
  const periods: string[] = []
  const current = new Date(startD)

  while (current <= endD) {
    periods.push(getDateBucket(current, config.granularity))
    // Advance to next period
    switch (config.granularity) {
      case 'day': current.setDate(current.getDate() + 1); break
      case 'week': current.setDate(current.getDate() + 7); break
      case 'month': current.setMonth(current.getMonth() + 1); break
      case 'quarter': current.setMonth(current.getMonth() + 3); break
      case 'year': current.setFullYear(current.getFullYear() + 1); break
    }
  }

  // Deduplicate periods (in case rounding causes duplicates)
  const uniquePeriods = [...new Set(periods)]

  // Group rows by period
  const periodGroups = new Map<string, any[]>()
  for (const p of uniquePeriods) periodGroups.set(p, [])

  for (const row of allRows) {
    const dateVal = row[metricDef.dateField]
    if (!dateVal) continue
    const bucket = getDateBucket(dateVal, config.granularity)
    if (periodGroups.has(bucket)) {
      periodGroups.get(bucket)!.push(row)
    }
  }

  // Compute metric for each period
  const values: number[] = uniquePeriods.map(p => metricDef.compute(periodGroups.get(p) || []))

  // Calculate moving averages
  const ma3 = movingAverage(values, 3)
  const ma6 = movingAverage(values, 6)

  // Detect anomalies
  const mean = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0
  const stdDev = standardDeviation(values)

  // Build data points
  const dataPoints: TrendDataPoint[] = uniquePeriods.map((period, i) => {
    const point: TrendDataPoint = {
      period,
      value: values[i],
    }
    if (i > 0) {
      point.change = Math.round((values[i] - values[i - 1]) * 100) / 100
      point.changePercent = values[i - 1] !== 0
        ? Math.round(((values[i] - values[i - 1]) / values[i - 1]) * 10000) / 100
        : 0
    }
    if (ma3[i] !== null) point.movingAvg3 = ma3[i]!
    if (ma6[i] !== null) point.movingAvg6 = ma6[i]!
    point.isAnomaly = stdDev > 0 && Math.abs(values[i] - mean) > 2 * stdDev
    return point
  })

  // Determine trend direction
  let direction: TrendResult['direction'] = 'stable'
  if (values.length >= 2) {
    const { slope } = linearRegression(values)
    const coeffOfVariation = mean !== 0 ? stdDev / Math.abs(mean) : 0
    if (coeffOfVariation > 0.3) {
      direction = 'volatile'
    } else if (slope > 0.01 * mean) {
      direction = 'growing'
    } else if (slope < -0.01 * mean) {
      direction = 'declining'
    }
  }

  // Project future values using linear regression
  const { slope, intercept } = linearRegression(values)
  const projectionCount = Math.min(6, uniquePeriods.length)
  const projections: { period: string; value: number }[] = []
  const lastPeriodDate = new Date(endD)
  for (let i = 1; i <= projectionCount; i++) {
    // Advance date
    switch (config.granularity) {
      case 'day': lastPeriodDate.setDate(lastPeriodDate.getDate() + 1); break
      case 'week': lastPeriodDate.setDate(lastPeriodDate.getDate() + 7); break
      case 'month': lastPeriodDate.setMonth(lastPeriodDate.getMonth() + 1); break
      case 'quarter': lastPeriodDate.setMonth(lastPeriodDate.getMonth() + 3); break
      case 'year': lastPeriodDate.setFullYear(lastPeriodDate.getFullYear() + 1); break
    }
    const projectedValue = Math.round((intercept + slope * (values.length - 1 + i)) * 100) / 100
    projections.push({
      period: getDateBucket(lastPeriodDate, config.granularity),
      value: Math.max(0, projectedValue), // Don't project negative values
    })
  }

  return {
    metric: config.metric,
    direction,
    dataPoints,
    projections,
    summary: {
      startValue: values[0] ?? 0,
      endValue: values[values.length - 1] ?? 0,
      totalChange: values.length >= 2 ? Math.round((values[values.length - 1] - values[0]) * 100) / 100 : 0,
      totalChangePercent: values.length >= 2 && values[0] !== 0
        ? Math.round(((values[values.length - 1] - values[0]) / values[0]) * 10000) / 100
        : 0,
      avgValue: Math.round(mean * 100) / 100,
      minValue: values.length > 0 ? Math.min(...values) : 0,
      maxValue: values.length > 0 ? Math.max(...values) : 0,
      stdDeviation: Math.round(stdDev * 100) / 100,
    },
    metadata: {
      generatedAt: new Date().toISOString(),
      executionMs: Date.now() - start,
    },
  }
}

// ---------------------------------------------------------------------------
// 5. Cohort Analysis
// ---------------------------------------------------------------------------

export async function analyzeCohorts(orgId: string, config: CohortConfig): Promise<CohortResult> {
  const start = Date.now()

  const employees: any[] = await withRetry(() =>
    db.select().from(schema.employees).where(eq(schema.employees.orgId, orgId))
  )

  // Build cohorts by hire date
  const cohortMap = new Map<string, any[]>()
  for (const emp of employees) {
    if (!emp.hireDate) continue
    const bucket = config.cohortType === 'monthly'
      ? getDateBucket(emp.hireDate, 'month')
      : getDateBucket(emp.hireDate, 'quarter')
    if (!cohortMap.has(bucket)) cohortMap.set(bucket, [])
    cohortMap.get(bucket)!.push(emp)
  }

  // Sort cohorts chronologically
  const sortedCohortKeys = [...cohortMap.keys()].sort()

  // Determine how many periods to track
  const periodsToTrack = config.periodsToTrack ?? (config.cohortType === 'monthly' ? 12 : 8)

  // Fetch related data for non-retention metrics
  let reviews: any[] = []
  let salaryReviews: any[] = []
  if (config.metric === 'performance') {
    reviews = await withRetry(() =>
      db.select().from(schema.reviews).where(eq(schema.reviews.orgId, orgId))
    )
  }
  if (config.metric === 'salary_growth') {
    salaryReviews = await withRetry(() =>
      db.select().from(schema.salaryReviews).where(eq(schema.salaryReviews.orgId, orgId))
    )
  }

  const now = new Date()

  const cohorts = sortedCohortKeys.map(cohortLabel => {
    const cohortEmployees = cohortMap.get(cohortLabel)!
    const startCount = cohortEmployees.length
    const employeeIds = new Set(cohortEmployees.map(e => e.id))

    const periods: CohortResult['cohorts'][0]['periods'] = []

    for (let p = 0; p < periodsToTrack; p++) {
      // Calculate the date offset for this period
      const cohortDate = new Date(cohortEmployees[0].hireDate)
      const periodDate = new Date(cohortDate)
      if (config.cohortType === 'monthly') {
        periodDate.setMonth(periodDate.getMonth() + p)
      } else {
        periodDate.setMonth(periodDate.getMonth() + p * 3)
      }

      // Don't project into the future
      if (periodDate > now) break

      let value = 0
      let periodCount = 0

      switch (config.metric) {
        case 'retention': {
          // Count how many employees from this cohort are still active
          const retained = cohortEmployees.filter(e => e.isActive).length
          // For period 0, retention is 100%. For later periods, use active status as proxy
          // (Real implementation would need termination dates for accurate per-period tracking)
          periodCount = retained
          value = startCount > 0 ? Math.round((retained / startCount) * 10000) / 100 : 0
          break
        }
        case 'performance': {
          // Average performance rating for cohort employees at this period
          const cohortReviews = reviews.filter(r =>
            employeeIds.has(r.employeeId) && r.overallRating
          )
          periodCount = cohortReviews.length
          if (cohortReviews.length > 0) {
            value = Math.round(
              cohortReviews.reduce((s, r) => s + Number(r.overallRating), 0) / cohortReviews.length * 100
            ) / 100
          }
          break
        }
        case 'salary_growth': {
          // Average salary increase % for cohort employees
          const cohortSalaryReviews = salaryReviews.filter(r =>
            employeeIds.has(r.employeeId) && r.status === 'approved'
          )
          periodCount = cohortSalaryReviews.length
          if (cohortSalaryReviews.length > 0) {
            const avgGrowth = cohortSalaryReviews.reduce((s, r) => {
              const growthPct = r.currentSalary > 0
                ? ((r.proposedSalary - r.currentSalary) / r.currentSalary) * 100
                : 0
              return s + growthPct
            }, 0) / cohortSalaryReviews.length
            value = Math.round(avgGrowth * 100) / 100
          }
          break
        }
      }

      periods.push({ period: p, value, count: periodCount })
    }

    return { label: cohortLabel, startCount, periods }
  })

  return {
    cohorts,
    metadata: {
      generatedAt: new Date().toISOString(),
      cohortCount: cohorts.length,
      executionMs: Date.now() - start,
    },
  }
}

// ---------------------------------------------------------------------------
// 6. Benchmark Comparisons
// ---------------------------------------------------------------------------

// Industry benchmark defaults (reasonable HR industry averages)
const INDUSTRY_BENCHMARKS: Record<string, { value: number; unit: string; label: string }> = {
  revenue_per_employee: { value: 250000, unit: 'USD', label: 'Revenue per Employee' },
  cost_per_hire: { value: 4700, unit: 'USD', label: 'Cost per Hire' },
  time_to_fill_days: { value: 42, unit: 'days', label: 'Time to Fill' },
  turnover_rate: { value: 15, unit: '%', label: 'Turnover Rate' },
  voluntary_turnover_rate: { value: 10, unit: '%', label: 'Voluntary Turnover Rate' },
  retention_rate: { value: 85, unit: '%', label: 'Retention Rate' },
  training_hours_per_employee: { value: 40, unit: 'hours', label: 'Training Hours per Employee' },
  promotion_rate: { value: 8, unit: '%', label: 'Promotion Rate' },
  absence_rate: { value: 3.2, unit: '%', label: 'Absence Rate' },
  overtime_ratio: { value: 5, unit: '%', label: 'Overtime Ratio' },
  compensation_ratio: { value: 100, unit: '%', label: 'Compensation Ratio' },
  engagement_score: { value: 72, unit: 'score', label: 'Engagement Score' },
  avg_performance_rating: { value: 3.5, unit: 'out of 5', label: 'Avg Performance Rating' },
}

export async function generateBenchmarks(orgId: string): Promise<BenchmarkResult> {
  const start = Date.now()

  // Fetch all needed data in parallel
  const [
    allEmployees,
    activeEmployees,
    jobPostings,
    applications,
    engagementScores,
    reviews,
    enrollments,
    leaveRequests,
    payrollRuns,
    salaryReviews,
    compBands,
  ] = await withRetry(() =>
    Promise.all([
      db.select().from(schema.employees).where(eq(schema.employees.orgId, orgId)),
      db.select().from(schema.employees).where(and(eq(schema.employees.orgId, orgId), eq(schema.employees.isActive, true))),
      db.select().from(schema.jobPostings).where(eq(schema.jobPostings.orgId, orgId)),
      db.select().from(schema.applications).where(eq(schema.applications.orgId, orgId)),
      db.select().from(schema.engagementScores).where(eq(schema.engagementScores.orgId, orgId)),
      db.select().from(schema.reviews).where(eq(schema.reviews.orgId, orgId)),
      db.select().from(schema.enrollments).where(eq(schema.enrollments.orgId, orgId)),
      db.select().from(schema.leaveRequests).where(eq(schema.leaveRequests.orgId, orgId)),
      db.select().from(schema.payrollRuns).where(eq(schema.payrollRuns.orgId, orgId)),
      db.select().from(schema.salaryReviews).where(eq(schema.salaryReviews.orgId, orgId)),
      db.select().from(schema.compBands).where(eq(schema.compBands.orgId, orgId)),
    ])
  )

  const totalEmployees = allEmployees.length
  const activeCount = activeEmployees.length
  const inactiveCount = totalEmployees - activeCount

  // Calculate org metrics
  const orgValues: Record<string, number> = {}

  // Revenue per employee — proxy from payroll: total gross / employee count
  const totalPayroll = payrollRuns.reduce((s, r) => s + (Number(r.totalGross) || 0), 0)
  orgValues.revenue_per_employee = activeCount > 0 ? Math.round(totalPayroll / activeCount) : 0

  // Cost per hire — proxy: total payroll / number of hires in period
  const recentHires = allEmployees.filter(e => {
    if (!e.hireDate) return false
    const hd = new Date(e.hireDate)
    const yearAgo = new Date()
    yearAgo.setFullYear(yearAgo.getFullYear() - 1)
    return hd >= yearAgo
  }).length
  orgValues.cost_per_hire = recentHires > 0 ? Math.round(totalPayroll * 0.02 / recentHires) : 0

  // Time to fill — proxy: avg days between job posting creation and filled status
  const filledPostings = jobPostings.filter((j: any) => j.status === 'filled' && j.createdAt)
  if (filledPostings.length > 0) {
    const avgDays = filledPostings.reduce((s: number, j: any) => {
      const created = new Date(j.createdAt)
      const updated = j.updatedAt ? new Date(j.updatedAt) : new Date()
      return s + Math.max(1, (updated.getTime() - created.getTime()) / 86400000)
    }, 0) / filledPostings.length
    orgValues.time_to_fill_days = Math.round(avgDays)
  } else {
    orgValues.time_to_fill_days = 0
  }

  // Turnover rate
  orgValues.turnover_rate = totalEmployees > 0 ? Math.round((inactiveCount / totalEmployees) * 10000) / 100 : 0

  // Voluntary turnover (proxy — assume 70% of turnover is voluntary)
  orgValues.voluntary_turnover_rate = Math.round(orgValues.turnover_rate * 0.7 * 100) / 100

  // Retention rate
  orgValues.retention_rate = totalEmployees > 0 ? Math.round((activeCount / totalEmployees) * 10000) / 100 : 0

  // Training hours per employee — proxy from enrollments
  const completedEnrollments = enrollments.filter(e => e.status === 'completed').length
  // Assume 8 hours per completed enrollment
  orgValues.training_hours_per_employee = activeCount > 0 ? Math.round((completedEnrollments * 8) / activeCount * 100) / 100 : 0

  // Promotion rate — proxy from salary reviews with > 10% increase
  const promotions = salaryReviews.filter(r =>
    r.status === 'approved' && r.currentSalary > 0 &&
    ((r.proposedSalary - r.currentSalary) / r.currentSalary) > 0.10
  ).length
  orgValues.promotion_rate = activeCount > 0 ? Math.round((promotions / activeCount) * 10000) / 100 : 0

  // Absence rate — proxy from approved leave requests
  const approvedLeave = leaveRequests.filter(l => l.status === 'approved')
  const totalLeaveDays = approvedLeave.reduce((s, l) => s + (Number(l.days) || 0), 0)
  const workingDaysPerYear = 250
  orgValues.absence_rate = activeCount > 0
    ? Math.round((totalLeaveDays / (activeCount * workingDaysPerYear)) * 10000) / 100
    : 0

  // Overtime ratio — proxy (no direct data, estimate from payroll deductions)
  const totalDeductions = payrollRuns.reduce((s, r) => s + (Number(r.totalDeductions) || 0), 0)
  orgValues.overtime_ratio = totalPayroll > 0 ? Math.round((totalDeductions / totalPayroll) * 10000) / 100 : 0

  // Compensation ratio — actual vs comp band midpoint
  if (compBands.length > 0 && salaryReviews.length > 0) {
    const avgActual = salaryReviews.reduce((s, r) => s + (Number(r.currentSalary) || 0), 0) / salaryReviews.length
    const avgMidpoint = compBands.reduce((s, b: any) => {
      const mid = ((Number(b.minSalary) || 0) + (Number(b.maxSalary) || 0)) / 2
      return s + mid
    }, 0) / compBands.length
    orgValues.compensation_ratio = avgMidpoint > 0 ? Math.round((avgActual / avgMidpoint) * 10000) / 100 : 100
  } else {
    orgValues.compensation_ratio = 100
  }

  // Engagement score
  if (engagementScores.length > 0) {
    orgValues.engagement_score = Math.round(
      engagementScores.reduce((s, e) => s + (Number(e.overallScore) || 0), 0) / engagementScores.length * 100
    ) / 100
  } else {
    orgValues.engagement_score = 0
  }

  // Avg performance rating
  const ratedReviews = reviews.filter(r => r.overallRating)
  if (ratedReviews.length > 0) {
    orgValues.avg_performance_rating = Math.round(
      ratedReviews.reduce((s, r) => s + Number(r.overallRating), 0) / ratedReviews.length * 100
    ) / 100
  } else {
    orgValues.avg_performance_rating = 0
  }

  // Build comparison
  const orgMetrics: BenchmarkMetric[] = Object.entries(INDUSTRY_BENCHMARKS).map(([key, bench]) => {
    const orgVal = orgValues[key] ?? 0
    const diff = bench.value !== 0 ? Math.round(((orgVal - bench.value) / bench.value) * 10000) / 100 : 0
    // For metrics where higher is better
    const higherIsBetter = ['revenue_per_employee', 'retention_rate', 'training_hours_per_employee', 'engagement_score', 'avg_performance_rating', 'promotion_rate']
    // For metrics where lower is better
    const lowerIsBetter = ['cost_per_hire', 'time_to_fill_days', 'turnover_rate', 'voluntary_turnover_rate', 'absence_rate', 'overtime_ratio']

    let indicator: 'above' | 'below' | 'at' = 'at'
    if (Math.abs(diff) < 5) {
      indicator = 'at'
    } else if (higherIsBetter.includes(key)) {
      indicator = diff > 0 ? 'above' : 'below'
    } else if (lowerIsBetter.includes(key)) {
      indicator = diff < 0 ? 'above' : 'below' // Lower is better, so negative diff = above benchmark
    } else {
      // compensation_ratio: closest to 100 is best
      indicator = Math.abs(orgVal - 100) < Math.abs(bench.value - 100) ? 'above' : 'below'
    }

    return {
      name: key,
      label: bench.label,
      value: orgVal,
      benchmark: bench.value,
      unit: bench.unit,
      indicator,
      percentDiff: diff,
    }
  })

  return {
    orgMetrics,
    metadata: {
      generatedAt: new Date().toISOString(),
      executionMs: Date.now() - start,
      benchmarkSource: 'Industry averages (SHRM, Mercer, Gartner composite)',
    },
  }
}

// ---------------------------------------------------------------------------
// 7. Data Export Functions
// ---------------------------------------------------------------------------

export function exportReportData(
  data: ReportResult,
  format: 'csv' | 'json' | 'table'
): string {
  switch (format) {
    case 'csv':
      return exportToCSV(data)
    case 'json':
      return JSON.stringify({
        columns: data.columns,
        rows: data.rows,
        totals: data.totals,
        metadata: data.metadata,
      }, null, 2)
    case 'table':
      return exportToTable(data)
    default:
      throw new Error(`Unsupported export format: ${format}`)
  }
}

function exportToCSV(data: ReportResult): string {
  if (data.rows.length === 0) return ''

  // Get all unique keys from rows
  const allKeys = new Set<string>()
  for (const row of data.rows) {
    for (const key of Object.keys(row)) {
      allKeys.add(key)
    }
  }
  const headers = [...allKeys]

  // CSV escape function
  const escapeCSV = (val: unknown): string => {
    if (val === null || val === undefined) return ''
    const str = String(val)
    // Wrap in quotes if contains comma, quote, newline, or leading/trailing whitespace
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r') || str !== str.trim()) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  const lines: string[] = []
  // Header row
  lines.push(headers.map(escapeCSV).join(','))
  // Data rows
  for (const row of data.rows) {
    const vals = headers.map(h => {
      const val = row[h]
      // Handle nested objects/arrays
      if (val !== null && typeof val === 'object') {
        return escapeCSV(JSON.stringify(val))
      }
      return escapeCSV(val)
    })
    lines.push(vals.join(','))
  }

  // Totals row
  if (data.totals && Object.keys(data.totals).length > 0) {
    lines.push('') // blank separator
    const totalVals = headers.map(h => {
      if (h === headers[0]) return escapeCSV('TOTAL')
      return data.totals?.[h] !== undefined ? escapeCSV(data.totals[h]) : ''
    })
    lines.push(totalVals.join(','))
  }

  return lines.join('\n')
}

function exportToTable(data: ReportResult): string {
  if (data.rows.length === 0) return '(no data)'

  const allKeys = new Set<string>()
  for (const row of data.rows) {
    for (const key of Object.keys(row)) allKeys.add(key)
  }
  const headers = [...allKeys]

  // Calculate column widths
  const widths = headers.map(h => {
    const headerLen = h.length
    const maxDataLen = data.rows.reduce((mx, row) => {
      const val = String(row[h] ?? '')
      return Math.max(mx, val.length)
    }, 0)
    return Math.max(headerLen, maxDataLen) + 2
  })

  const separator = '+' + widths.map(w => '-'.repeat(w)).join('+') + '+'
  const headerRow = '|' + headers.map((h, i) => ` ${h.padEnd(widths[i] - 1)}`).join('|') + '|'

  const lines = [separator, headerRow, separator]
  for (const row of data.rows) {
    const dataRow = '|' + headers.map((h, i) => {
      const val = String(row[h] ?? '')
      return ` ${val.padEnd(widths[i] - 1)}`
    }).join('|') + '|'
    lines.push(dataRow)
  }
  lines.push(separator)

  return lines.join('\n')
}
