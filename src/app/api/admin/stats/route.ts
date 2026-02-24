import { NextRequest, NextResponse } from 'next/server'
import { db, schema } from '@/lib/db'
import { sql } from 'drizzle-orm'
import { getDemoDataForOrg } from '@/lib/demo-data'

// Platform modules available for licensing (not exported — Next.js routes can only export route handlers)
const PLATFORM_MODULES = [
  { id: 'core', name: 'Core HR', description: 'People directory, departments, org chart', alwaysOn: true },
  { id: 'recruiting', name: 'Recruiting', description: 'Job postings, applications, pipeline' },
  { id: 'performance', name: 'Performance', description: 'Goals, reviews, feedback cycles' },
  { id: 'compensation', name: 'Compensation', description: 'Bands, salary reviews, equity' },
  { id: 'learning', name: 'Learning & Development', description: 'Courses, enrollments, certifications' },
  { id: 'engagement', name: 'Engagement', description: 'Surveys, eNPS, pulse checks' },
  { id: 'mentoring', name: 'Mentoring', description: 'Programs, pairs, matching' },
  { id: 'payroll', name: 'Payroll', description: 'Runs, deductions, tax, net pay' },
  { id: 'time', name: 'Time & Attendance', description: 'Leave requests, attendance tracking' },
  { id: 'benefits', name: 'Benefits', description: 'Plans, enrollment, dependents' },
  { id: 'expense', name: 'Expense Management', description: 'Reports, approvals, reimbursement' },
  { id: 'devices', name: 'IT — Devices', description: 'Asset tracking, assignments, lifecycle' },
  { id: 'apps', name: 'IT — Apps', description: 'License management, provisioning' },
  { id: 'finance', name: 'Finance', description: 'Invoices, budgets, vendors' },
  { id: 'projects', name: 'Projects', description: 'Tasks, milestones, kanban' },
  { id: 'strategy', name: 'Strategy', description: 'OKRs, KPIs, initiatives' },
  { id: 'workflows', name: 'Workflow Studio', description: 'Custom workflows, automations' },
  { id: 'analytics', name: 'Analytics', description: 'Reports, dashboards, insights' },
]

// GET /api/admin/stats — platform-wide statistics
export async function GET(request: NextRequest) {
  const adminRole = request.headers.get('x-admin-role')
  if (!adminRole) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Always include demo data in totals
  const org1 = getDemoDataForOrg('org-1')
  const org2 = getDemoDataForOrg('org-2')
  const demoEmployeeCount = org1.employees.length + org2.employees.length
  const demoOrgCount = 2

  try {
    // Also get DB stats
    const [orgStats] = await db.select({
      totalOrgs: sql<number>`count(*)::int`,
      activeOrgs: sql<number>`count(*) filter (where ${schema.organizations.isActive} = true)::int`,
    }).from(schema.organizations)

    const [empStats] = await db.select({
      totalEmployees: sql<number>`count(*)::int`,
      activeEmployees: sql<number>`count(*) filter (where ${schema.employees.isActive} = true)::int`,
    }).from(schema.employees)

    const planBreakdown = await db.select({
      plan: schema.organizations.plan,
      count: sql<number>`count(*)::int`,
    })
      .from(schema.organizations)
      .groupBy(schema.organizations.plan)

    // Merge demo + DB plan counts
    const dbPlanMap = Object.fromEntries(planBreakdown.map(p => [p.plan, p.count]))
    dbPlanMap['enterprise'] = (dbPlanMap['enterprise'] || 0) + 1 // Ecobank demo
    dbPlanMap['professional'] = (dbPlanMap['professional'] || 0) + 1 // Kash & Co demo

    return NextResponse.json({
      ok: true,
      stats: {
        totalOrgs: orgStats.totalOrgs + demoOrgCount,
        activeOrgs: orgStats.activeOrgs + demoOrgCount,
        totalEmployees: empStats.totalEmployees + demoEmployeeCount,
        activeEmployees: empStats.activeEmployees + demoEmployeeCount,
        orgsByPlan: dbPlanMap,
      },
      modules: PLATFORM_MODULES,
    })
  } catch {
    // DB unavailable
    return NextResponse.json({
      ok: true,
      stats: {
        totalOrgs: demoOrgCount,
        activeOrgs: demoOrgCount,
        totalEmployees: demoEmployeeCount,
        activeEmployees: demoEmployeeCount,
        orgsByPlan: { enterprise: 1, professional: 1 },
      },
      modules: PLATFORM_MODULES,
    })
  }
}
