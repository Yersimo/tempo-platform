'use client'

// ---------------------------------------------------------------------------
// Per-module data loading utility
// Replaces the monolithic GET /api/data with lazy per-module fetches
// Uses the existing paginated endpoint at /api/data/[module]
// ---------------------------------------------------------------------------

/** Map store key (camelCase) → API module slug (kebab-case) */
export const MODULE_SLUGS: Record<string, string> = {
  employees: 'employees',
  departments: 'departments',
  goals: 'goals',
  reviewCycles: 'review-cycles',
  reviews: 'reviews',
  feedback: 'feedback',
  compBands: 'comp-bands',
  salaryReviews: 'salary-reviews',
  courses: 'courses',
  enrollments: 'enrollments',
  surveys: 'surveys',
  engagementScores: 'engagement-scores',
  mentoringPrograms: 'mentoring-programs',
  mentoringPairs: 'mentoring-pairs',
  payrollRuns: 'payroll-runs',
  leaveRequests: 'leave-requests',
  benefitPlans: 'benefit-plans',
  benefitEnrollments: 'benefit-enrollments',
  expenseReports: 'expense-reports',
  jobPostings: 'job-postings',
  applications: 'applications',
  devices: 'devices',
  softwareLicenses: 'software-licenses',
  itRequests: 'it-requests',
  invoices: 'invoices',
  budgets: 'budgets',
  vendors: 'vendors',
  projects: 'projects',
  milestones: 'milestones',
  tasks: 'tasks',
  strategicObjectives: 'strategic-objectives',
  keyResults: 'key-results',
  initiatives: 'initiatives',
  kpiDefinitions: 'kpi-definitions',
  workflows: 'workflows',
  workflowTemplates: 'workflow-templates',
  auditLog: 'audit-log',
  // Identity & Access
  idpConfigurations: 'idp-configurations',
  samlApps: 'saml-apps',
  mfaPolicies: 'mfa-policies',
  // Chat
  chatChannels: 'chat-channels',
  chatMessages: 'chat-messages',
  // Procurement
  purchaseOrders: 'purchase-orders',
  purchaseOrderItems: 'purchase-order-items',
  procurementRequests: 'procurement-requests',
  // Finance
  corporateCards: 'corporate-cards',
  cardTransactions: 'card-transactions',
  billPayments: 'bill-payments',
  currencyAccounts: 'currency-accounts',
  fxTransactions: 'fx-transactions',
  // Travel
  travelRequests: 'travel-requests',
  travelBookings: 'travel-bookings',
  // Documents
  signatureDocuments: 'signature-documents',
  signatureTemplates: 'signature-templates',
  // Equity Grants
  equityGrants: 'equity-grants',
  // Workers' Compensation
  workersCompPolicies: 'workers-comp-policies',
  workersCompClaims: 'workers-comp-claims',
  workersCompClassCodes: 'workers-comp-class-codes',
  workersCompAudits: 'workers-comp-audits',
  // Groups
  groups: 'dynamic-groups',
  // Password Manager
  passwordVaults: 'password-vaults',
  vaultItems: 'vault-items',
  // Bill Pay Schedules & Travel Policies
  billPaySchedules: 'bill-pay-schedules',
  travelPolicies: 'travel-policies',
  // Payroll
  employeePayrollEntries: 'employee-payroll-entries',
  contractorPayments: 'contractor-payments',
  payrollSchedules: 'payroll-schedules',
  taxConfigs: 'tax-configs',
  taxFilings: 'tax-filings',
  payrollApprovals: 'payroll-approvals',
  payrollApprovalConfig: 'payroll-approval-config',
  payrollAuditLog: 'payroll-audit-log',
  // Benefits (extended)
  benefitDependents: 'benefit-dependents',
  lifeEvents: 'life-events',
  openEnrollmentPeriods: 'open-enrollment-periods',
  cobraEvents: 'cobra-events',
  acaTracking: 'aca-tracking',
  flexBenefitAccounts: 'flex-benefit-accounts',
  flexBenefitTransactions: 'flex-benefit-transactions',
  // Compliance
  complianceRequirements: 'compliance-requirements',
  complianceDocuments: 'compliance-documents',
  complianceAlerts: 'compliance-alerts',
  // Offboarding
  offboardingChecklists: 'offboarding-checklists',
  offboardingProcesses: 'offboarding-processes',
  offboardingTasks: 'offboarding-tasks',
  exitSurveys: 'exit-surveys',
  // Time & Attendance
  timeEntries: 'time-entries',
  timeOffPolicies: 'time-off-policies',
  timeOffBalances: 'time-off-balances',
  overtimeRules: 'overtime-rules',
  shifts: 'shifts',
  // Engagement (extended)
  actionPlans: 'action-plans',
  surveyResponses: 'survey-responses',
  surveyTemplates: 'survey-templates',
  surveySchedules: 'survey-schedules',
  surveyTriggers: 'survey-triggers',
  openEndedResponses: 'open-ended-responses',
  // Headcount Planning
  headcountPlans: 'headcount-plans',
  headcountPositions: 'headcount-positions',
  headcountBudgetItems: 'headcount-budget-items',
  // Onboarding
  buddyAssignments: 'buddy-assignments',
  preboardingTasks: 'preboarding-tasks',
  // Compensation Planning
  compPlanningCycles: 'comp-planning-cycles',
  // Mentoring (extended)
  mentoringSessions: 'mentoring-sessions',
  mentoringGoals: 'mentoring-goals',
  // IT Devices (extended)
  deviceActions: 'device-actions',
  appCatalog: 'app-catalog',
  appAssignments: 'app-assignments',
  deviceInventory: 'device-inventory',
  deviceStoreCatalog: 'device-store-catalog',
  deviceOrders: 'device-orders',
  // KPI Measurements
  kpiMeasurements: 'kpi-measurements',
  // Offboarding (extended)
  offboardingChecklistItems: 'offboarding-checklist-items',
  // Identity (extended)
  scimProviders: 'scim-providers',
  // IT Cloud (extended)
  managedDevices: 'managed-devices',
  securityPoliciesIT: 'security-policies',
  provisioningRules: 'provisioning-rules',
  encryptionPolicies: 'encryption-policies',
  // Expense (extended)
  expensePolicies: 'expense-policies',
  mileageLogs: 'mileage-logs',
  mileageEntries: 'mileage-entries',
  receiptMatches: 'receipt-matches',
  advancedExpensePolicies: 'advanced-expense-policies',
  reimbursementBatches: 'reimbursement-batches',
  duplicateDetections: 'duplicate-detections',
  // Global Workforce (EOR/COR/PEO)
  eorEntities: 'eor-entities',
  eorEmployees: 'eor-employees',
  eorContracts: 'eor-contracts',
  corContractors: 'cor-contractors',
  corContracts: 'cor-contracts',
  corPayments: 'cor-payments',
  peoConfigurations: 'peo-configurations',
  coEmploymentRecords: 'co-employment-records',
  globalBenefitPlans: 'global-benefit-plans',
  countryBenefitConfigs: 'country-benefit-configs',
  // Workflow Studio (extended)
  workflowSteps: 'workflow-steps',
  workflowRuns: 'workflow-runs',
  // Automation Workflows
  automationWorkflows: 'automation-workflows',
  automationWorkflowSteps: 'automation-workflow-steps',
  automationWorkflowRuns: 'automation-workflow-runs',
  automationWorkflowRunSteps: 'automation-workflow-run-steps',
  // Learning (extended)
  courseBlocks: 'course-content',
  coursePrerequisites: 'course-prerequisites',
  scormPackages: 'scorm-packages',
  scormTracking: 'scorm-tracking',
  contentLibrary: 'content-library',
  learnerBadges: 'learner-badges',
  learnerPoints: 'learner-points',
  // Recruiting (extended)
  backgroundChecks: 'background-checks',
  referrals: 'referrals',
  knockoutQuestions: 'knockout-questions',
  candidateScheduling: 'candidate-scheduling',
  // App Studio
  customApps: 'custom-apps',
  appPages: 'app-pages',
  appComponents: 'app-components',
  appDataSources: 'app-data-sources',
  // Sandbox
  sandboxEnvironments: 'sandbox-environments',
  // Academies
  academies: 'academies',
  academyCohorts: 'academy-cohorts',
  academyParticipants: 'academy-participants',
  academyCourses: 'academy-courses',
  academyParticipantProgress: 'academy-participant-progress',
  academySessions: 'academy-sessions',
  academySessionRsvps: 'academy-session-rsvps',
  academyAssignments: 'academy-assignments',
  academyAssignmentSubmissions: 'academy-assignment-submissions',
  academyDiscussions: 'academy-discussions',
  academyResources: 'academy-resources',
  academyCertificates: 'academy-certificates',
  academyCommunications: 'academy-communications',
  academyCommTriggers: 'academy-comm-triggers',
  // Journal Entries (GL)
  journalEntries: 'journal-entries',
  journalEntryLines: 'journal-entry-lines',
  // Bank Feed / Plaid
  bankConnections: 'bank-connections',
  bankAccounts: 'bank-accounts',
  bankTransactions: 'bank-transactions',
  reconciliationRules: 'reconciliation-rules',
  // Multi-Entity Consolidation
  entityGroups: 'entity-groups',
  entityGroupMembers: 'entity-group-members',
  intercompanyTransactions: 'intercompany-transactions',
  consolidationReports: 'consolidation-reports',
  fxRateHistory: 'fx-rate-history',
  // SOC 2 Compliance
  auditHashChain: 'audit-hash-chain',
  retentionPolicies: 'retention-policies',
  complianceFindings: 'compliance-findings',
  // Import History
  importHistory: 'import-history',
}

// ---------------------------------------------------------------------------
// camelCase → snake_case transform (matches monolithic endpoint output)
// ---------------------------------------------------------------------------

function camelToSnake(key: string): string {
  return key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function keysToSnake(obj: Record<string, any>): Record<string, any> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const out: Record<string, any> = {}
  for (const [key, value] of Object.entries(obj)) {
    out[camelToSnake(key)] = value
  }
  return out
}

/**
 * Transform a Drizzle camelCase row into the snake_case shape the store/UI expects.
 * Special handling for employees (profile nesting) and auditLog (field rename).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformRow(module: string, row: Record<string, any>): Record<string, any> {
  if (module === 'employees') {
    return {
      id: row.id,
      org_id: row.orgId,
      department_id: row.departmentId,
      job_title: row.jobTitle,
      level: row.level,
      country: row.country,
      role: row.role,
      manager_id: row.managerId,
      hire_date: row.hireDate,
      is_active: row.isActive,
      created_at: row.createdAt,
      updated_at: row.updatedAt,
      profile: {
        full_name: row.fullName,
        email: row.email,
        avatar_url: row.avatarUrl,
        phone: row.phone,
      },
    }
  }

  if (module === 'auditLog') {
    return {
      id: row.id,
      user: row.userId || '',
      action: row.action,
      entity_type: row.entityType,
      entity_id: row.entityId || '',
      details: row.details || '',
      timestamp: row.timestamp,
    }
  }

  return keysToSnake(row)
}

// ---------------------------------------------------------------------------
// In-memory cache with TTL
// ---------------------------------------------------------------------------

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface ModuleDataResult<T = any> {
  data: T[]
  pagination: PaginationMeta
}

const cache = new Map<string, { data: ModuleDataResult; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

function getCacheKey(module: string, page: number, limit: number): string {
  return `${module}:${page}:${limit}`
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Fetch a single module from the per-module API endpoint */
export async function fetchModuleData(
  storeKey: string,
  options: { page?: number; limit?: number; bustCache?: boolean } = {},
): Promise<ModuleDataResult | null> {
  const slug = MODULE_SLUGS[storeKey]
  if (!slug) return null

  const page = options.page || 1
  const limit = options.limit || 200 // Max to get all data in one page
  const cacheKey = getCacheKey(storeKey, page, limit)

  // Check cache first
  if (!options.bustCache) {
    const cached = cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data
    }
  }

  try {
    const res = await fetch(`/api/data/${slug}?page=${page}&limit=${limit}`)
    if (!res.ok) return null

    const json = await res.json()
    const transformed: ModuleDataResult = {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: json.data.map((row: any) => transformRow(storeKey, row)),
      pagination: json.pagination,
    }

    cache.set(cacheKey, { data: transformed, timestamp: Date.now() })
    return transformed
  } catch {
    return null
  }
}

/** Fetch multiple modules in parallel */
export async function fetchModules(
  storeKeys: string[],
  options: { limit?: number; bustCache?: boolean } = {},
): Promise<Record<string, ModuleDataResult>> {
  const results: Record<string, ModuleDataResult> = {}

  const promises = storeKeys.map(async (key) => {
    const result = await fetchModuleData(key, options)
    if (result) results[key] = result
  })

  await Promise.all(promises)
  return results
}

/** Clear module data cache */
export function clearModuleCache(storeKey?: string) {
  if (storeKey) {
    for (const key of cache.keys()) {
      if (key.startsWith(storeKey + ':')) cache.delete(key)
    }
  } else {
    cache.clear()
  }
}
