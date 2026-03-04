import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import { eq, desc, sql, and, gte, lte } from 'drizzle-orm'

// ---------------------------------------------------------------------------
// GET /api/data/[module] -- Lazy per-module data loading with pagination
// Replaces the monolithic GET /api/data for scalability (14K+ employees)
// ---------------------------------------------------------------------------

// Module → table mapping with transform functions
const MODULE_CONFIG: Record<string, {
  table: any
  hasOrgId: boolean
  defaultLimit: number
  sortBy?: string
}> = {
  employees:          { table: schema.employees, hasOrgId: true, defaultLimit: 50 },
  departments:        { table: schema.departments, hasOrgId: true, defaultLimit: 100 },
  goals:              { table: schema.goals, hasOrgId: true, defaultLimit: 50 },
  'review-cycles':    { table: schema.reviewCycles, hasOrgId: true, defaultLimit: 20 },
  reviews:            { table: schema.reviews, hasOrgId: true, defaultLimit: 50 },
  feedback:           { table: schema.feedback, hasOrgId: true, defaultLimit: 50 },
  'comp-bands':       { table: schema.compBands, hasOrgId: true, defaultLimit: 50 },
  'salary-reviews':   { table: schema.salaryReviews, hasOrgId: true, defaultLimit: 50 },
  courses:            { table: schema.courses, hasOrgId: true, defaultLimit: 50 },
  enrollments:        { table: schema.enrollments, hasOrgId: true, defaultLimit: 50 },
  surveys:            { table: schema.surveys, hasOrgId: true, defaultLimit: 20 },
  'engagement-scores':{ table: schema.engagementScores, hasOrgId: true, defaultLimit: 50 },
  'mentoring-programs':{ table: schema.mentoringPrograms, hasOrgId: true, defaultLimit: 20 },
  'mentoring-pairs':  { table: schema.mentoringPairs, hasOrgId: true, defaultLimit: 50 },
  'payroll-runs':     { table: schema.payrollRuns, hasOrgId: true, defaultLimit: 20 },
  'leave-requests':   { table: schema.leaveRequests, hasOrgId: true, defaultLimit: 50 },
  'benefit-plans':    { table: schema.benefitPlans, hasOrgId: true, defaultLimit: 20 },
  'benefit-enrollments':{ table: schema.benefitEnrollments, hasOrgId: true, defaultLimit: 50 },
  'expense-reports':  { table: schema.expenseReports, hasOrgId: true, defaultLimit: 50 },
  'job-postings':     { table: schema.jobPostings, hasOrgId: true, defaultLimit: 20 },
  applications:       { table: schema.applications, hasOrgId: true, defaultLimit: 50 },
  devices:            { table: schema.devices, hasOrgId: true, defaultLimit: 50 },
  'software-licenses':{ table: schema.softwareLicenses, hasOrgId: true, defaultLimit: 50 },
  'it-requests':      { table: schema.itRequests, hasOrgId: true, defaultLimit: 50 },
  invoices:           { table: schema.invoices, hasOrgId: true, defaultLimit: 50 },
  budgets:            { table: schema.budgets, hasOrgId: true, defaultLimit: 20 },
  vendors:            { table: schema.vendors, hasOrgId: true, defaultLimit: 50 },
  projects:           { table: schema.projects, hasOrgId: true, defaultLimit: 20 },
  milestones:         { table: schema.milestones, hasOrgId: true, defaultLimit: 50 },
  tasks:              { table: schema.tasks, hasOrgId: true, defaultLimit: 50 },
  'strategic-objectives': { table: schema.strategicObjectives, hasOrgId: true, defaultLimit: 20 },
  'key-results':      { table: schema.keyResults, hasOrgId: true, defaultLimit: 50 },
  initiatives:        { table: schema.initiatives, hasOrgId: true, defaultLimit: 50 },
  'kpi-definitions':  { table: schema.kpiDefinitions, hasOrgId: true, defaultLimit: 50 },
  workflows:          { table: schema.workflows, hasOrgId: true, defaultLimit: 20 },
  'workflow-templates':{ table: schema.workflowTemplates, hasOrgId: true, defaultLimit: 20 },
  'audit-log':        { table: schema.auditLog, hasOrgId: true, defaultLimit: 100 },
  // Identity & Access
  'idp-configurations': { table: schema.idpConfigurations, hasOrgId: true, defaultLimit: 20 },
  'saml-apps':        { table: schema.samlApps, hasOrgId: true, defaultLimit: 50 },
  'mfa-policies':     { table: schema.mfaPolicies, hasOrgId: true, defaultLimit: 20 },
  // Chat
  'chat-channels':    { table: schema.chatChannels, hasOrgId: true, defaultLimit: 50 },
  'chat-messages':    { table: schema.chatMessages, hasOrgId: true, defaultLimit: 100 },
  // Finance
  'corporate-cards':  { table: schema.corporateCards, hasOrgId: true, defaultLimit: 50 },
  'card-transactions':{ table: schema.cardTransactions, hasOrgId: true, defaultLimit: 100 },
  'bill-payments':    { table: schema.billPayments, hasOrgId: true, defaultLimit: 50 },
  'currency-accounts':{ table: schema.currencyAccounts, hasOrgId: true, defaultLimit: 20 },
  'fx-transactions':  { table: schema.fxTransactions, hasOrgId: true, defaultLimit: 50 },
  // Travel
  'travel-requests':  { table: schema.travelRequests, hasOrgId: true, defaultLimit: 50 },
  'travel-bookings':  { table: schema.travelBookings, hasOrgId: true, defaultLimit: 50 },
  // Documents / E-Signature
  'signature-documents': { table: schema.signatureDocuments, hasOrgId: true, defaultLimit: 50 },
  'signature-templates': { table: schema.signatureTemplates, hasOrgId: true, defaultLimit: 20 },
  // Workers' Compensation
  'workers-comp-policies': { table: schema.workersCompPolicies, hasOrgId: true, defaultLimit: 20 },
  'workers-comp-claims':   { table: schema.workersCompClaims, hasOrgId: true, defaultLimit: 50 },
  'workers-comp-class-codes': { table: schema.workersCompClassCodes, hasOrgId: true, defaultLimit: 50 },
  'workers-comp-audits':   { table: schema.workersCompAudits, hasOrgId: true, defaultLimit: 20 },
  // Groups
  'dynamic-groups':        { table: schema.dynamicGroups, hasOrgId: true, defaultLimit: 50 },
  // Password Manager
  'password-vaults':       { table: schema.passwordVaults, hasOrgId: true, defaultLimit: 20 },
  'vault-items':           { table: schema.vaultItems, hasOrgId: true, defaultLimit: 100 },
  // Bill Pay Schedules
  'bill-pay-schedules':    { table: schema.billPaySchedules, hasOrgId: true, defaultLimit: 20 },
  // Travel Policies
  'travel-policies':       { table: schema.travelPolicies, hasOrgId: true, defaultLimit: 10 },
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ module: string }> }
) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) {
      return NextResponse.json({ error: 'Unauthorized: no org context' }, { status: 401 })
    }

    const { module } = await params
    const config = MODULE_CONFIG[module]
    if (!config) {
      return NextResponse.json({ error: `Unknown module: ${module}` }, { status: 404 })
    }

    // Parse pagination params
    const url = new URL(request.url)
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'))
    const limit = Math.min(200, Math.max(1, parseInt(url.searchParams.get('limit') || String(config.defaultLimit))))
    const offset = (page - 1) * limit
    const search = url.searchParams.get('search') || ''

    // Build query with org scoping
    const whereCondition = config.hasOrgId
      ? eq(config.table.orgId, orgId)
      : undefined

    // Get total count for pagination metadata
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(config.table)
      .where(whereCondition as any)

    const total = Number(countResult[0]?.count || 0)

    // Fetch paginated data
    let query = db.select().from(config.table)
    if (whereCondition) {
      query = query.where(whereCondition) as any
    }

    const rows = await (query as any)
      .limit(limit)
      .offset(offset)
      .then((r: any[]) => r)

    // Set cache headers for immutable data modules
    const cacheableModules = ['departments', 'comp-bands', 'benefit-plans', 'courses']
    const cacheControl = cacheableModules.includes(module)
      ? 'private, max-age=60, stale-while-revalidate=300'
      : 'private, no-cache'

    return NextResponse.json(
      {
        data: rows,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
      },
      {
        headers: {
          'Cache-Control': cacheControl,
          'X-Total-Count': String(total),
        },
      }
    )
  } catch (error) {
    console.error('[GET /api/data/[module]] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch module data' }, { status: 500 })
  }
}
