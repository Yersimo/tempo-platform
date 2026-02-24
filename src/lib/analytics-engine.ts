// Advanced Analytics Engine
// Cross-module reports, custom report builder, formula support, dynamic dashboards

import { db, schema } from '@/lib/db'
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
}

export interface ReportColumn {
  field: string
  label: string
  module: string
  type: 'string' | 'number' | 'date' | 'boolean'
  aggregation?: 'count' | 'sum' | 'avg' | 'min' | 'max'
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

export async function executeReport(orgId: string, reportId: string): Promise<ReportResult> {
  const start = Date.now()
  const template = REPORT_TEMPLATES.find(t => t.id === reportId)
  if (!template) throw new Error(`Unknown report: ${reportId}`)

  const primaryModule = template.modules[0]
  const table = TABLE_MAP[primaryModule]
  if (!table) throw new Error(`Unknown module: ${primaryModule}`)

  // Execute query
  const rows = await db.select().from(table)
    .where(table.orgId ? eq(table.orgId, orgId) : undefined)

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
        try {
          let expr = formula.expression
          for (const [key, value] of Object.entries(row)) {
            expr = expr.replace(new RegExp(key, 'g'), String(Number(value) || 0))
          }
          // Safe eval for simple arithmetic
          const result = Function(`"use strict"; return (${expr})`)()
          row[formula.name] = typeof result === 'number' ? Math.round(result * 100) / 100 : 0
        } catch {
          row[formula.name] = 0
        }
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

// Cross-module report (joins data from multiple modules)
export async function executeCrossModuleReport(orgId: string): Promise<ReportResult> {
  const start = Date.now()

  const [employees, jobPostings, engagementScores, enrollments, leaveRequests, reviews] = await Promise.all([
    db.select().from(schema.employees).where(and(eq(schema.employees.orgId, orgId), eq(schema.employees.isActive, true))),
    db.select().from(schema.jobPostings).where(and(eq(schema.jobPostings.orgId, orgId), eq(schema.jobPostings.status, 'open'))),
    db.select().from(schema.engagementScores).where(eq(schema.engagementScores.orgId, orgId)),
    db.select().from(schema.enrollments).where(eq(schema.enrollments.orgId, orgId)),
    db.select().from(schema.leaveRequests).where(eq(schema.leaveRequests.orgId, orgId)),
    db.select().from(schema.reviews).where(eq(schema.reviews.orgId, orgId)),
  ])

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
