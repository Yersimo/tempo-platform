import { db } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import { eq, and, sql } from 'drizzle-orm'

// ---------------------------------------------------------------------------
// Board Reporting Templates Service
// Pre-built report templates that auto-pull data from across the platform
// ---------------------------------------------------------------------------

export type BoardReportInput = {
  title: string
  reportType: string
  period: string
  sections?: string // JSON
  generatedData?: string // JSON
  status?: string
  presentedBy?: string
}

// ---- CRUD ----

export async function createBoardReport(orgId: string, input: BoardReportInput) {
  const [report] = await db.insert(schema.boardReports).values({
    orgId,
    title: input.title,
    reportType: input.reportType,
    period: input.period,
    sections: input.sections || '[]',
    generatedData: input.generatedData || null,
    status: input.status || 'draft',
    presentedBy: input.presentedBy || null,
  }).returning()
  return report
}

export async function updateBoardReport(reportId: string, input: Partial<BoardReportInput>) {
  const updates: Record<string, unknown> = { updatedAt: new Date() }
  if (input.title !== undefined) updates.title = input.title
  if (input.reportType !== undefined) updates.reportType = input.reportType
  if (input.period !== undefined) updates.period = input.period
  if (input.sections !== undefined) updates.sections = input.sections
  if (input.generatedData !== undefined) updates.generatedData = input.generatedData
  if (input.status !== undefined) updates.status = input.status
  if (input.presentedBy !== undefined) updates.presentedBy = input.presentedBy

  const [report] = await db.update(schema.boardReports)
    .set(updates)
    .where(eq(schema.boardReports.id, reportId))
    .returning()
  return report
}

export async function listBoardReports(orgId: string) {
  return db.select().from(schema.boardReports)
    .where(eq(schema.boardReports.orgId, orgId))
}

export async function getBoardReport(reportId: string) {
  const [report] = await db.select().from(schema.boardReports)
    .where(eq(schema.boardReports.id, reportId))
  return report || null
}

export async function deleteBoardReport(reportId: string) {
  await db.delete(schema.boardReports)
    .where(eq(schema.boardReports.id, reportId))
}

// ---- Report Generation Templates ----

async function getOrgMetrics(orgId: string) {
  // Aggregate data across platform tables for board report content
  const [empCount] = await db.select({ count: sql<number>`count(*)` })
    .from(schema.employees).where(eq(schema.employees.orgId, orgId))
  const [deptCount] = await db.select({ count: sql<number>`count(*)` })
    .from(schema.departments).where(eq(schema.departments.orgId, orgId))

  return {
    headcount: Number(empCount?.count || 0),
    departments: Number(deptCount?.count || 0),
  }
}

export async function generateQuarterlyBoardPack(orgId: string, quarter: string, year: string) {
  const metrics = await getOrgMetrics(orgId)

  const sections = [
    {
      id: 'executive_summary',
      title: 'Executive Summary',
      type: 'summary',
      data: {
        headcount: metrics.headcount,
        departments: metrics.departments,
        revenuePerEmployee: 0,
        turnoverRate: 0,
        commentary: '',
      },
    },
    {
      id: 'financial_overview',
      title: 'Financial Overview',
      type: 'financial',
      data: {
        totalPayrollCost: 0,
        budgetVsActual: { budget: 0, actual: 0, variance: 0, variancePct: 0 },
        cashPosition: 0,
        commentary: '',
      },
    },
    {
      id: 'headcount_hiring',
      title: 'Headcount & Hiring',
      type: 'headcount',
      data: {
        totalHeadcount: metrics.headcount,
        newHires: 0,
        departures: 0,
        openPositions: 0,
        timeToHire: 0,
        commentary: '',
      },
    },
    {
      id: 'compensation',
      title: 'Compensation',
      type: 'compensation',
      data: {
        totalCompSpend: 0,
        avgSalaryByLevel: {},
        equityGrants: 0,
        commentary: '',
      },
    },
    {
      id: 'compliance',
      title: 'Compliance',
      type: 'compliance',
      data: {
        soc2Status: 'on_track',
        auditFindings: 0,
        policyViolations: 0,
        commentary: '',
      },
    },
    {
      id: 'strategic_initiatives',
      title: 'Strategic Initiatives',
      type: 'strategic',
      data: {
        learningCompletion: 0,
        engagementScore: 0,
        diversityMetrics: {},
        commentary: '',
      },
    },
  ]

  const generatedData = JSON.stringify({
    type: 'quarterly_board_pack',
    quarter,
    year,
    generatedAt: new Date().toISOString(),
    metrics,
    riskFlags: [],
  })

  return createBoardReport(orgId, {
    title: `${quarter} ${year} Board Pack`,
    reportType: 'quarterly_board_pack',
    period: `${quarter} ${year}`,
    sections: JSON.stringify(sections),
    generatedData,
    status: 'draft',
  })
}

export async function generateAnnualReview(orgId: string, year: string) {
  const metrics = await getOrgMetrics(orgId)

  const sections = [
    {
      id: 'year_in_review',
      title: 'Year in Review',
      type: 'summary',
      data: { headcount: metrics.headcount, departments: metrics.departments, commentary: '' },
    },
    {
      id: 'financial_performance',
      title: 'Financial Performance',
      type: 'financial',
      data: { totalRevenue: 0, totalExpenses: 0, netIncome: 0, yoyGrowth: 0, commentary: '' },
    },
    {
      id: 'talent_overview',
      title: 'Talent Overview',
      type: 'talent',
      data: { hires: 0, departures: 0, retentionRate: 0, promotions: 0, commentary: '' },
    },
    {
      id: 'strategic_goals',
      title: 'Strategic Goals Progress',
      type: 'strategic',
      data: { goalsCompleted: 0, goalsInProgress: 0, goalsBehind: 0, commentary: '' },
    },
    {
      id: 'next_year_outlook',
      title: 'Next Year Outlook',
      type: 'outlook',
      data: { plannedHeadcount: 0, budgetProjection: 0, keyInitiatives: [], commentary: '' },
    },
  ]

  return createBoardReport(orgId, {
    title: `FY ${year} Annual Review`,
    reportType: 'annual_review',
    period: `FY ${year}`,
    sections: JSON.stringify(sections),
    generatedData: JSON.stringify({ type: 'annual_review', year, metrics, generatedAt: new Date().toISOString() }),
    status: 'draft',
  })
}

export async function generateKPIDashboard(orgId: string, period: string) {
  const metrics = await getOrgMetrics(orgId)

  const sections = [
    {
      id: 'people_kpis',
      title: 'People KPIs',
      type: 'kpi',
      data: {
        metrics: [
          { name: 'Headcount', current: metrics.headcount, target: 0, unit: 'people' },
          { name: 'Turnover Rate', current: 0, target: 15, unit: '%' },
          { name: 'Time to Hire', current: 0, target: 30, unit: 'days' },
          { name: 'Engagement Score', current: 0, target: 80, unit: '%' },
        ],
        commentary: '',
      },
    },
    {
      id: 'financial_kpis',
      title: 'Financial KPIs',
      type: 'kpi',
      data: {
        metrics: [
          { name: 'Revenue per Employee', current: 0, target: 0, unit: 'currency' },
          { name: 'Cost per Hire', current: 0, target: 0, unit: 'currency' },
          { name: 'Payroll-to-Revenue Ratio', current: 0, target: 0, unit: '%' },
        ],
        commentary: '',
      },
    },
    {
      id: 'operational_kpis',
      title: 'Operational KPIs',
      type: 'kpi',
      data: {
        metrics: [
          { name: 'Training Completion', current: 0, target: 90, unit: '%' },
          { name: 'Policy Compliance', current: 0, target: 100, unit: '%' },
          { name: 'IT Ticket Resolution', current: 0, target: 24, unit: 'hours' },
        ],
        commentary: '',
      },
    },
  ]

  return createBoardReport(orgId, {
    title: `KPI Dashboard — ${period}`,
    reportType: 'kpi_dashboard',
    period,
    sections: JSON.stringify(sections),
    generatedData: JSON.stringify({ type: 'kpi_dashboard', period, metrics, generatedAt: new Date().toISOString() }),
    status: 'draft',
  })
}

export async function generateCompensationReview(orgId: string, year: string) {
  const metrics = await getOrgMetrics(orgId)

  const sections = [
    {
      id: 'comp_overview',
      title: 'Compensation Overview',
      type: 'compensation',
      data: { totalCompSpend: 0, avgSalary: 0, medianSalary: 0, salaryRange: { min: 0, max: 0 }, commentary: '' },
    },
    {
      id: 'by_level',
      title: 'Compensation by Level',
      type: 'breakdown',
      data: { levels: [], commentary: '' },
    },
    {
      id: 'by_department',
      title: 'Compensation by Department',
      type: 'breakdown',
      data: { departments: [], commentary: '' },
    },
    {
      id: 'equity',
      title: 'Equity & Long-Term Incentives',
      type: 'equity',
      data: { totalEquityGrants: 0, vestedValue: 0, unvestedValue: 0, commentary: '' },
    },
    {
      id: 'market_comparison',
      title: 'Market Comparison',
      type: 'market',
      data: { benchmarkData: [], compRatio: 0, commentary: '' },
    },
  ]

  return createBoardReport(orgId, {
    title: `Compensation Review — FY ${year}`,
    reportType: 'compensation_review',
    period: `FY ${year}`,
    sections: JSON.stringify(sections),
    generatedData: JSON.stringify({ type: 'compensation_review', year, metrics, generatedAt: new Date().toISOString() }),
    status: 'draft',
  })
}
