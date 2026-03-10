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
  // Equity Grants
  'equity-grants':         { table: schema.equityGrants, hasOrgId: true, defaultLimit: 50 },
  // Groups
  'dynamic-groups':        { table: schema.dynamicGroups, hasOrgId: true, defaultLimit: 50 },
  // Password Manager
  'password-vaults':       { table: schema.passwordVaults, hasOrgId: true, defaultLimit: 20 },
  'vault-items':           { table: schema.vaultItems, hasOrgId: true, defaultLimit: 100 },
  // Bill Pay Schedules
  'bill-pay-schedules':    { table: schema.billPaySchedules, hasOrgId: true, defaultLimit: 20 },
  // Travel Policies
  'travel-policies':       { table: schema.travelPolicies, hasOrgId: true, defaultLimit: 10 },
  // Payroll
  'employee-payroll-entries': { table: schema.employeePayrollEntries, hasOrgId: true, defaultLimit: 100 },
  'contractor-payments':   { table: schema.contractorPayments, hasOrgId: true, defaultLimit: 50 },
  'payroll-schedules':     { table: schema.payrollSchedules, hasOrgId: true, defaultLimit: 20 },
  'tax-configs':           { table: schema.taxConfigs, hasOrgId: true, defaultLimit: 20 },
  'tax-filings':           { table: schema.taxFilings, hasOrgId: true, defaultLimit: 50 },
  'payroll-approvals':     { table: schema.payrollApprovals, hasOrgId: false, defaultLimit: 50 },
  'payroll-approval-config': { table: schema.payrollApprovalConfig, hasOrgId: true, defaultLimit: 10 },
  'payroll-audit-log':     { table: schema.payrollAuditLog, hasOrgId: true, defaultLimit: 100 },
  // Benefits (extended)
  'benefit-dependents':    { table: schema.benefitDependents, hasOrgId: true, defaultLimit: 50 },
  'life-events':           { table: schema.lifeEvents, hasOrgId: true, defaultLimit: 50 },
  'open-enrollment-periods': { table: schema.openEnrollmentPeriods, hasOrgId: true, defaultLimit: 20 },
  'cobra-events':          { table: schema.cobraEvents, hasOrgId: true, defaultLimit: 50 },
  'aca-tracking':          { table: schema.acaTracking, hasOrgId: true, defaultLimit: 50 },
  'flex-benefit-accounts': { table: schema.flexBenefitAccounts, hasOrgId: true, defaultLimit: 50 },
  'flex-benefit-transactions': { table: schema.flexBenefitTransactions, hasOrgId: true, defaultLimit: 100 },
  // Compliance
  'compliance-requirements': { table: schema.complianceRequirements, hasOrgId: true, defaultLimit: 50 },
  'compliance-documents':  { table: schema.complianceDocuments, hasOrgId: true, defaultLimit: 50 },
  'compliance-alerts':     { table: schema.complianceAlerts, hasOrgId: true, defaultLimit: 50 },
  // Offboarding
  'offboarding-checklists': { table: schema.offboardingChecklists, hasOrgId: true, defaultLimit: 20 },
  'offboarding-processes': { table: schema.offboardingProcesses, hasOrgId: true, defaultLimit: 50 },
  'offboarding-tasks':     { table: schema.offboardingTasks, hasOrgId: false, defaultLimit: 100 },
  'exit-surveys':          { table: schema.exitSurveys, hasOrgId: true, defaultLimit: 50 },
  // Time & Attendance
  'time-entries':          { table: schema.timeEntries, hasOrgId: true, defaultLimit: 100 },
  'time-off-policies':     { table: schema.timeOffPolicies, hasOrgId: true, defaultLimit: 20 },
  'time-off-balances':     { table: schema.timeOffBalances, hasOrgId: true, defaultLimit: 100 },
  'overtime-rules':        { table: schema.overtimeRules, hasOrgId: true, defaultLimit: 20 },
  'shifts':                { table: schema.shifts, hasOrgId: true, defaultLimit: 100 },
  // Engagement (extended)
  'action-plans':          { table: schema.initiatives, hasOrgId: true, defaultLimit: 50 },
  'survey-templates':      { table: schema.surveyTemplates, hasOrgId: true, defaultLimit: 20 },
  'survey-schedules':      { table: schema.surveySchedules, hasOrgId: true, defaultLimit: 20 },
  'survey-triggers':       { table: schema.surveyTriggers, hasOrgId: true, defaultLimit: 20 },
  'open-ended-responses':  { table: schema.openEndedResponses, hasOrgId: true, defaultLimit: 100 },
  // Headcount Planning
  'headcount-plans':       { table: schema.headcountPlans, hasOrgId: true, defaultLimit: 20 },
  'headcount-positions':   { table: schema.headcountPositions, hasOrgId: true, defaultLimit: 50 },
  'headcount-budget-items':{ table: schema.headcountBudgetItems, hasOrgId: true, defaultLimit: 100 },
  // Onboarding
  'buddy-assignments':     { table: schema.buddyAssignments, hasOrgId: true, defaultLimit: 50 },
  'preboarding-tasks':     { table: schema.preboardingTasks, hasOrgId: true, defaultLimit: 50 },
  // Compensation Planning
  'comp-planning-cycles':  { table: schema.meritCycles, hasOrgId: true, defaultLimit: 20 },
  // Offboarding (extended)
  'offboarding-checklist-items': { table: schema.offboardingChecklistItems, hasOrgId: false, defaultLimit: 100 },
  // Mentoring (extended)
  'mentoring-sessions':    { table: schema.mentoringSessions, hasOrgId: true, defaultLimit: 50 },
  'mentoring-goals':       { table: schema.mentoringGoals, hasOrgId: true, defaultLimit: 50 },
  // IT Devices (extended)
  'device-actions':        { table: schema.deviceActions, hasOrgId: true, defaultLimit: 50 },
  'app-catalog':           { table: schema.appCatalog, hasOrgId: true, defaultLimit: 50 },
  'app-assignments':       { table: schema.appAssignments, hasOrgId: true, defaultLimit: 50 },
  'device-inventory':      { table: schema.deviceInventory, hasOrgId: true, defaultLimit: 50 },
  'device-store-catalog':  { table: schema.deviceStoreCatalog, hasOrgId: true, defaultLimit: 50 },
  'device-orders':         { table: schema.deviceOrders, hasOrgId: true, defaultLimit: 50 },
  // KPI Measurements
  'kpi-measurements':      { table: schema.kpiMeasurements, hasOrgId: true, defaultLimit: 100 },
  // Identity (extended)
  'scim-providers':        { table: schema.idpConfigurations, hasOrgId: true, defaultLimit: 20 },
  // IT Cloud (extended)
  'managed-devices':       { table: schema.managedDevices, hasOrgId: true, defaultLimit: 50 },
  'security-policies':     { table: schema.securityPolicies, hasOrgId: true, defaultLimit: 20 },
  'provisioning-rules':    { table: schema.idpConfigurations, hasOrgId: true, defaultLimit: 20 },
  'encryption-policies':   { table: schema.mfaPolicies, hasOrgId: true, defaultLimit: 20 },
  // Expense (extended)
  'expense-policies':      { table: schema.expensePolicies, hasOrgId: true, defaultLimit: 20 },
  'mileage-logs':          { table: schema.mileageEntries, hasOrgId: true, defaultLimit: 50 },
  'mileage-entries':       { table: schema.mileageEntries, hasOrgId: true, defaultLimit: 50 },
  'receipt-matches':       { table: schema.receiptMatching, hasOrgId: true, defaultLimit: 50 },
  'advanced-expense-policies': { table: schema.advancedExpensePolicies, hasOrgId: true, defaultLimit: 20 },
  'reimbursement-batches': { table: schema.reimbursementBatches, hasOrgId: true, defaultLimit: 50 },
  'duplicate-detections':  { table: schema.duplicateDetection, hasOrgId: true, defaultLimit: 50 },
  // Global Workforce (EOR/COR/PEO)
  'eor-entities':          { table: schema.eorEntities, hasOrgId: true, defaultLimit: 20 },
  'eor-employees':         { table: schema.eorEmployees, hasOrgId: true, defaultLimit: 50 },
  'eor-contracts':         { table: schema.eorContracts, hasOrgId: true, defaultLimit: 50 },
  'cor-contractors':       { table: schema.corContractors, hasOrgId: true, defaultLimit: 50 },
  'cor-contracts':         { table: schema.corContracts, hasOrgId: true, defaultLimit: 50 },
  'cor-payments':          { table: schema.corPayments, hasOrgId: true, defaultLimit: 50 },
  'peo-configurations':    { table: schema.peoConfigurations, hasOrgId: true, defaultLimit: 20 },
  'co-employment-records': { table: schema.coEmploymentRecords, hasOrgId: true, defaultLimit: 50 },
  'global-benefit-plans':  { table: schema.globalBenefitPlans, hasOrgId: true, defaultLimit: 20 },
  'country-benefit-configs': { table: schema.countryBenefitConfigs, hasOrgId: true, defaultLimit: 50 },
  // Workflow Studio (extended)
  'workflow-steps':        { table: schema.workflowSteps, hasOrgId: false, defaultLimit: 100 },
  'workflow-runs':         { table: schema.workflowRuns, hasOrgId: true, defaultLimit: 50 },
  // Automation Workflows
  'automation-workflows':       { table: schema.automationWorkflows, hasOrgId: true, defaultLimit: 20 },
  'automation-workflow-steps':  { table: schema.automationWorkflowSteps, hasOrgId: false, defaultLimit: 100 },
  'automation-workflow-runs':   { table: schema.automationWorkflowRuns, hasOrgId: true, defaultLimit: 50 },
  // App Studio
  'custom-apps':           { table: schema.customApps, hasOrgId: true, defaultLimit: 20 },
  'app-pages':             { table: schema.appPages, hasOrgId: false, defaultLimit: 50 },
  'app-components':        { table: schema.appComponents, hasOrgId: false, defaultLimit: 50 },
  'app-data-sources':      { table: schema.appDataSources, hasOrgId: false, defaultLimit: 50 },
  // Sandbox
  'sandbox-environments':  { table: schema.sandboxEnvironments, hasOrgId: true, defaultLimit: 20 },
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
    const cacheableModules = ['departments', 'comp-bands', 'courses']
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
