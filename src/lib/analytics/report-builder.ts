/* eslint-disable @typescript-eslint/no-explicit-any */

// ────────────────────────────────────────────────────────────
//  Report Builder Engine
//  Executes ad-hoc reports against client-side store data
// ────────────────────────────────────────────────────────────

// ── Data source definitions ──

export interface FieldDef {
  key: string
  label: string
  type: 'text' | 'number' | 'currency' | 'date'
  lookup?: string
}

export interface DataSourceDef {
  label: string
  icon: string
  fields: FieldDef[]
  aggregations: string[]
}

export const REPORT_DATA_SOURCES: Record<string, DataSourceDef> = {
  employees: {
    label: 'Employees',
    icon: 'Users',
    fields: [
      { key: 'full_name', label: 'Full Name', type: 'text' },
      { key: 'email', label: 'Email', type: 'text' },
      { key: 'job_title', label: 'Job Title', type: 'text' },
      { key: 'department', label: 'Department', type: 'text', lookup: 'departments' },
      { key: 'level', label: 'Level', type: 'text' },
      { key: 'country', label: 'Country', type: 'text' },
      { key: 'role', label: 'Role', type: 'text' },
      { key: 'salary', label: 'Salary', type: 'currency' },
      { key: 'hire_date', label: 'Hire Date', type: 'date' },
      { key: 'status', label: 'Status', type: 'text' },
      { key: 'manager', label: 'Manager', type: 'text', lookup: 'employees' },
    ],
    aggregations: ['count', 'avg_salary', 'sum_salary', 'min_salary', 'max_salary'],
  },
  payrollRuns: {
    label: 'Payroll',
    icon: 'DollarSign',
    fields: [
      { key: 'pay_period_start', label: 'Period Start', type: 'date' },
      { key: 'pay_period_end', label: 'Period End', type: 'date' },
      { key: 'total_gross', label: 'Total Gross', type: 'currency' },
      { key: 'total_net', label: 'Total Net', type: 'currency' },
      { key: 'total_deductions', label: 'Total Deductions', type: 'currency' },
      { key: 'employee_count', label: 'Employee Count', type: 'number' },
      { key: 'status', label: 'Status', type: 'text' },
      { key: 'currency', label: 'Currency', type: 'text' },
    ],
    aggregations: ['count', 'sum_gross', 'sum_net', 'avg_gross'],
  },
  leaveRequests: {
    label: 'Leave Requests',
    icon: 'Calendar',
    fields: [
      { key: 'employee_name', label: 'Employee', type: 'text', lookup: 'employees' },
      { key: 'leave_type', label: 'Leave Type', type: 'text' },
      { key: 'start_date', label: 'Start Date', type: 'date' },
      { key: 'end_date', label: 'End Date', type: 'date' },
      { key: 'days', label: 'Days', type: 'number' },
      { key: 'status', label: 'Status', type: 'text' },
      { key: 'department', label: 'Department', type: 'text' },
    ],
    aggregations: ['count', 'sum_days', 'avg_days'],
  },
  expenseReports: {
    label: 'Expenses',
    icon: 'Receipt',
    fields: [
      { key: 'employee_name', label: 'Employee', type: 'text' },
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'total_amount', label: 'Amount', type: 'currency' },
      { key: 'category', label: 'Category', type: 'text' },
      { key: 'status', label: 'Status', type: 'text' },
      { key: 'submitted_date', label: 'Submitted', type: 'date' },
      { key: 'department', label: 'Department', type: 'text' },
    ],
    aggregations: ['count', 'sum_amount', 'avg_amount', 'max_amount'],
  },
  jobPostings: {
    label: 'Recruiting',
    icon: 'Briefcase',
    fields: [
      { key: 'title', label: 'Job Title', type: 'text' },
      { key: 'department', label: 'Department', type: 'text' },
      { key: 'location', label: 'Location', type: 'text' },
      { key: 'status', label: 'Status', type: 'text' },
      { key: 'salary_min', label: 'Salary Min', type: 'currency' },
      { key: 'salary_max', label: 'Salary Max', type: 'currency' },
      { key: 'applications_count', label: 'Applications', type: 'number' },
      { key: 'created_at', label: 'Posted Date', type: 'date' },
    ],
    aggregations: ['count', 'avg_salary_min', 'avg_salary_max'],
  },
  reviews: {
    label: 'Performance Reviews',
    icon: 'Star',
    fields: [
      { key: 'employee_name', label: 'Employee', type: 'text' },
      { key: 'reviewer_name', label: 'Reviewer', type: 'text' },
      { key: 'overall_rating', label: 'Rating', type: 'number' },
      { key: 'type', label: 'Review Type', type: 'text' },
      { key: 'status', label: 'Status', type: 'text' },
      { key: 'department', label: 'Department', type: 'text' },
    ],
    aggregations: ['count', 'avg_rating', 'min_rating', 'max_rating'],
  },
  enrollments: {
    label: 'Learning',
    icon: 'BookOpen',
    fields: [
      { key: 'employee_name', label: 'Employee', type: 'text' },
      { key: 'course_name', label: 'Course', type: 'text' },
      { key: 'status', label: 'Status', type: 'text' },
      { key: 'progress', label: 'Progress %', type: 'number' },
      { key: 'enrolled_at', label: 'Enrolled Date', type: 'date' },
      { key: 'completed_at', label: 'Completed Date', type: 'date' },
    ],
    aggregations: ['count', 'avg_progress', 'completion_rate'],
  },
}

// ── Types ──

export interface ReportConfig {
  dataSource: string
  columns: string[]
  filters?: ReportFilter[]
  groupBy?: string
  sortBy?: string // field:asc or field:desc
  chartType?: 'table' | 'bar' | 'line' | 'pie'
}

export interface ReportFilter {
  field: string
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'is_empty' | 'is_not_empty'
  value: string
}

export interface ReportResult {
  columns: string[]
  rows: Record<string, any>[]
  totalRows: number
  aggregations: Record<string, number>
}

// ── Execution Engine ──

export function executeReport(config: ReportConfig, store: any): ReportResult {
  const source = REPORT_DATA_SOURCES[config.dataSource as keyof typeof REPORT_DATA_SOURCES]
  if (!source) return { columns: [], rows: [], totalRows: 0, aggregations: {} }

  // Get raw data from store
  const rawData: any[] = store[config.dataSource] || []

  // Resolve lookups (employee names, department names)
  const resolvedData = rawData.map((row: any) => {
    const resolved = { ...row }
    // Resolve employee name
    if (row.employee_id) {
      const emp = (store.employees || []).find((e: any) => e.id === row.employee_id)
      resolved.employee_name = emp?.profile?.full_name || emp?.full_name || 'Unknown'
    }
    // Resolve department
    if (row.department_id) {
      const dept = (store.departments || []).find((d: any) => d.id === row.department_id)
      resolved.department = dept?.name || 'Unknown'
    }
    // For employees, resolve full_name from profile
    if (config.dataSource === 'employees') {
      resolved.full_name = row.profile?.full_name || row.full_name || 'Unknown'
      resolved.email = row.profile?.email || row.email || ''
      const dept = (store.departments || []).find((d: any) => d.id === row.department_id)
      resolved.department = dept?.name || 'Unassigned'
      const mgr = (store.employees || []).find((e: any) => e.id === row.manager_id)
      resolved.manager = mgr?.profile?.full_name || mgr?.full_name || ''
      resolved.status = row.is_active === false ? 'Inactive' : 'Active'
    }
    // For reviews, resolve reviewer
    if (config.dataSource === 'reviews' && row.reviewer_id) {
      const reviewer = (store.employees || []).find((e: any) => e.id === row.reviewer_id)
      resolved.reviewer_name = reviewer?.profile?.full_name || reviewer?.full_name || 'Unknown'
    }
    // For enrollments, resolve course
    if (config.dataSource === 'enrollments' && row.course_id) {
      const course = (store.courses || []).find((c: any) => c.id === row.course_id)
      resolved.course_name = course?.title || course?.name || 'Unknown'
    }
    return resolved
  })

  // Apply filters
  let filtered = resolvedData
  if (config.filters?.length) {
    filtered = resolvedData.filter((row: any) => {
      return config.filters!.every(filter => {
        const val = String(row[filter.field] ?? '').toLowerCase()
        const target = String(filter.value ?? '').toLowerCase()
        switch (filter.operator) {
          case 'equals': return val === target
          case 'contains': return val.includes(target)
          case 'not_equals': return val !== target
          case 'greater_than': return Number(row[filter.field]) > Number(filter.value)
          case 'less_than': return Number(row[filter.field]) < Number(filter.value)
          case 'is_empty': return !row[filter.field]
          case 'is_not_empty': return !!row[filter.field]
          default: return true
        }
      })
    })
  }

  // Apply grouping
  if (config.groupBy) {
    const groups: Record<string, any[]> = {}
    filtered.forEach((row: any) => {
      const key = String(row[config.groupBy!] ?? 'Unknown')
      if (!groups[key]) groups[key] = []
      groups[key].push(row)
    })

    filtered = Object.entries(groups).map(([key, rows]) => {
      const result: any = { [config.groupBy!]: key, _count: rows.length }
      // Compute aggregations for numeric fields
      config.columns.forEach(col => {
        const field = source.fields.find(f => f.key === col)
        if (field?.type === 'currency' || field?.type === 'number') {
          result[`${col}_sum`] = rows.reduce((s, r) => s + (Number(r[col]) || 0), 0)
          result[`${col}_avg`] = rows.length > 0 ? Math.round(result[`${col}_sum`] / rows.length) : 0
        }
      })
      return result
    })
  }

  // Apply sorting
  if (config.sortBy) {
    const [field, direction] = config.sortBy.split(':')
    filtered.sort((a: any, b: any) => {
      const aVal = a[field] ?? ''
      const bVal = b[field] ?? ''
      const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true })
      return direction === 'desc' ? -cmp : cmp
    })
  }

  // Select only requested columns
  const rows = filtered.map((row: any) => {
    const selected: Record<string, any> = {}
    config.columns.forEach(col => { selected[col] = row[col] })
    if (config.groupBy) {
      selected._count = row._count
      config.columns.forEach(col => {
        if (row[`${col}_sum`] !== undefined) selected[`${col}_sum`] = row[`${col}_sum`]
        if (row[`${col}_avg`] !== undefined) selected[`${col}_avg`] = row[`${col}_avg`]
      })
    }
    return selected
  })

  // Compute aggregations
  const aggregations: Record<string, number> = { total_rows: rows.length }

  return { columns: config.columns, rows, totalRows: rows.length, aggregations }
}

// ── CSV Export ──

export function exportReportToCSV(result: ReportResult, reportName: string): void {
  const headers = result.columns.join(',')
  const csvRows = result.rows.map(row =>
    result.columns.map(col => {
      const val = row[col]
      return `"${String(val ?? '').replace(/"/g, '""')}"`
    }).join(',')
  )
  const csv = [headers, ...csvRows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${reportName.replace(/[^a-zA-Z0-9-_]/g, '_')}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
