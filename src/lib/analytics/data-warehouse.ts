import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'

// ---------------------------------------------------------------------------
// Server-Side Analytics Data Warehouse
// ---------------------------------------------------------------------------
// Runs heavy analytics queries directly against the Neon PostgreSQL database,
// replacing client-side ML/analytics for large-scale reporting.
// ---------------------------------------------------------------------------

export interface AnalyticsQuery {
  metric: string
  dimensions: string[]
  filters: Record<string, unknown>
  dateRange: { start: string; end: string }
  granularity: 'day' | 'week' | 'month' | 'quarter' | 'year'
}

export interface AnalyticsResult {
  metric: string
  data: { period: string; value: number; dimensions?: Record<string, string> }[]
  aggregations: { total: number; avg: number; min: number; max: number; count: number }
  computedAt: string
  queryTimeMs: number
}

// ─── Headcount Analytics ────────────────────────────────────────────────────

export async function computeHeadcountAnalytics(
  orgId: string,
  dateRange: { start: string; end: string },
): Promise<AnalyticsResult> {
  const start = Date.now()
  const result = await db.execute(sql`
    SELECT
      TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') AS period,
      COUNT(*)::int AS headcount,
      COUNT(CASE WHEN is_active = true THEN 1 END)::int AS active,
      COUNT(CASE WHEN termination_date IS NOT NULL THEN 1 END)::int AS terminated
    FROM employees
    WHERE org_id = ${orgId}
      AND created_at >= ${dateRange.start}::timestamp
      AND created_at <= ${dateRange.end}::timestamp
    GROUP BY DATE_TRUNC('month', created_at)
    ORDER BY DATE_TRUNC('month', created_at)
  `)
  const rows = (result as any).rows ?? result ?? []
  return {
    metric: 'headcount',
    data: rows.map((r: any) => ({
      period: r.period,
      value: Number(r.headcount),
      dimensions: { active: String(r.active), terminated: String(r.terminated) },
    })),
    aggregations: computeAggregations(rows.map((r: any) => Number(r.headcount))),
    computedAt: new Date().toISOString(),
    queryTimeMs: Date.now() - start,
  }
}

// ─── Payroll Analytics ──────────────────────────────────────────────────────

export async function computePayrollAnalytics(
  orgId: string,
  dateRange: { start: string; end: string },
): Promise<AnalyticsResult> {
  const start = Date.now()
  const result = await db.execute(sql`
    SELECT
      TO_CHAR(DATE_TRUNC('month', pr.created_at), 'YYYY-MM') AS period,
      SUM(epe.gross_pay)::bigint AS total_gross,
      SUM(epe.net_pay)::bigint AS total_net,
      COUNT(DISTINCT epe.employee_id)::int AS employee_count,
      AVG(epe.gross_pay)::int AS avg_gross
    FROM employee_payroll_entries epe
    JOIN payroll_runs pr ON pr.id = epe.payroll_run_id
    WHERE epe.org_id = ${orgId}
      AND pr.created_at >= ${dateRange.start}::timestamp
      AND pr.created_at <= ${dateRange.end}::timestamp
    GROUP BY DATE_TRUNC('month', pr.created_at)
    ORDER BY DATE_TRUNC('month', pr.created_at)
  `)
  const rows = (result as any).rows ?? result ?? []
  return {
    metric: 'payroll_cost',
    data: rows.map((r: any) => ({
      period: r.period,
      value: Number(r.total_gross),
      dimensions: {
        total_net: String(r.total_net),
        employee_count: String(r.employee_count),
        avg_gross: String(r.avg_gross),
      },
    })),
    aggregations: computeAggregations(rows.map((r: any) => Number(r.total_gross))),
    computedAt: new Date().toISOString(),
    queryTimeMs: Date.now() - start,
  }
}

// ─── Turnover Analytics ─────────────────────────────────────────────────────

export async function computeTurnoverAnalytics(
  orgId: string,
  dateRange: { start: string; end: string },
): Promise<AnalyticsResult> {
  const start = Date.now()
  const result = await db.execute(sql`
    SELECT
      TO_CHAR(DATE_TRUNC('quarter', termination_date::timestamp), 'YYYY-"Q"Q') AS period,
      COUNT(*)::int AS terminations,
      (SELECT COUNT(*)::int FROM employees WHERE org_id = ${orgId} AND is_active = true) AS total_active
    FROM employees
    WHERE org_id = ${orgId}
      AND termination_date IS NOT NULL
      AND termination_date::timestamp >= ${dateRange.start}::timestamp
      AND termination_date::timestamp <= ${dateRange.end}::timestamp
    GROUP BY DATE_TRUNC('quarter', termination_date::timestamp)
    ORDER BY DATE_TRUNC('quarter', termination_date::timestamp)
  `)
  const rows = (result as any).rows ?? result ?? []
  return {
    metric: 'turnover_rate',
    data: rows.map((r: any) => ({
      period: r.period,
      value:
        Number(r.total_active) > 0
          ? Math.round((Number(r.terminations) / Number(r.total_active)) * 10000) / 100
          : 0,
      dimensions: {
        terminations: String(r.terminations),
        total_active: String(r.total_active),
      },
    })),
    aggregations: computeAggregations(rows.map((r: any) => Number(r.terminations))),
    computedAt: new Date().toISOString(),
    queryTimeMs: Date.now() - start,
  }
}

// ─── Recruiting Analytics ───────────────────────────────────────────────────

export async function computeRecruitingAnalytics(orgId: string): Promise<AnalyticsResult> {
  const start = Date.now()
  const result = await db.execute(sql`
    SELECT
      jp.department_id,
      COUNT(a.id)::int AS applications,
      COUNT(CASE WHEN a.stage = 'hired' THEN 1 END)::int AS hired,
      AVG(
        CASE
          WHEN a.stage = 'hired' THEN EXTRACT(DAY FROM a.applied_at - jp.created_at)
          ELSE NULL
        END
      )::int AS avg_days_to_hire
    FROM job_postings jp
    LEFT JOIN applications a ON a.job_id = jp.id
    WHERE jp.org_id = ${orgId}
    GROUP BY jp.department_id
  `)
  const rows = (result as any).rows ?? result ?? []
  return {
    metric: 'recruiting',
    data: rows.map((r: any) => ({
      period: r.department_id || 'unassigned',
      value: Number(r.applications),
      dimensions: {
        hired: String(r.hired ?? 0),
        avg_days_to_hire: String(r.avg_days_to_hire ?? 0),
      },
    })),
    aggregations: computeAggregations(rows.map((r: any) => Number(r.applications))),
    computedAt: new Date().toISOString(),
    queryTimeMs: Date.now() - start,
  }
}

// ─── Compensation Analytics ─────────────────────────────────────────────────

export async function computeCompensationAnalytics(orgId: string): Promise<AnalyticsResult> {
  const start = Date.now()
  const result = await db.execute(sql`
    SELECT
      e.level,
      COUNT(*)::int AS count,
      AVG(sr.current_salary)::int AS avg_salary,
      MIN(sr.current_salary)::int AS min_salary,
      MAX(sr.current_salary)::int AS max_salary,
      PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY sr.current_salary)::int AS median_salary
    FROM employees e
    JOIN salary_reviews sr ON sr.employee_id = e.id
    WHERE e.org_id = ${orgId}
      AND e.is_active = true
      AND sr.current_salary > 0
      AND sr.status = 'approved'
    GROUP BY e.level
    ORDER BY e.level NULLS LAST
  `)
  const rows = (result as any).rows ?? result ?? []
  return {
    metric: 'compensation',
    data: rows.map((r: any) => ({
      period: r.level || 'unspecified',
      value: Number(r.avg_salary),
      dimensions: {
        count: String(r.count),
        min_salary: String(r.min_salary),
        max_salary: String(r.max_salary),
        median_salary: String(r.median_salary),
      },
    })),
    aggregations: computeAggregations(rows.map((r: any) => Number(r.avg_salary))),
    computedAt: new Date().toISOString(),
    queryTimeMs: Date.now() - start,
  }
}

// ─── Combined Dashboard ─────────────────────────────────────────────────────

export async function computeAllAnalytics(
  orgId: string,
  dateRange: { start: string; end: string },
): Promise<Record<string, AnalyticsResult>> {
  const [headcount, payroll, turnover, recruiting, compensation] = await Promise.all([
    computeHeadcountAnalytics(orgId, dateRange),
    computePayrollAnalytics(orgId, dateRange),
    computeTurnoverAnalytics(orgId, dateRange),
    computeRecruitingAnalytics(orgId),
    computeCompensationAnalytics(orgId),
  ])
  return { headcount, payroll, turnover, recruiting, compensation }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function computeAggregations(values: number[]): {
  total: number
  avg: number
  min: number
  max: number
  count: number
} {
  if (values.length === 0) return { total: 0, avg: 0, min: 0, max: 0, count: 0 }
  const nums = values.filter((v) => !isNaN(v))
  if (nums.length === 0) return { total: 0, avg: 0, min: 0, max: 0, count: 0 }
  const total = nums.reduce((a, b) => a + b, 0)
  return {
    total,
    avg: Math.round(total / nums.length),
    min: Math.min(...nums),
    max: Math.max(...nums),
    count: nums.length,
  }
}
