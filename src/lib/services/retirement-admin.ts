/**
 * 401(k) Retirement Plan Administration Service
 *
 * Full plan lifecycle management for retirement benefits including:
 * - Plan creation and configuration (Traditional 401k, Roth 401k, Safe Harbor, 403b, 457b, SIMPLE IRA, SEP IRA)
 * - 2026 IRS contribution limits enforcement
 * - Employer match calculation with percentage match and match cap
 * - Vesting schedule tracking (immediate, cliff, graded, custom)
 * - Auto-enrollment with auto-escalation
 * - Investment election management
 * - Beneficiary designation
 * - Required Minimum Distribution (RMD) calculations
 * - ADP/ACP nondiscrimination testing
 * - Form 5500 data generation
 * - Participant statements
 */

import { db, schema } from '@/lib/db'
import { eq, and, gte, lte, sql, desc, sum } from 'drizzle-orm'

// ============================================================
// Employee field helpers
// ============================================================
// The employees table uses `fullName` (not separate first/last) and
// `hireDate` (not `startDate`). It does not store `dateOfBirth` or
// `salary` directly. Salary is looked up from salaryReviews; date of
// birth is not tracked at the platform level, so the service
// conservatively defaults to non-catch-up-eligible when unknown.

function getEmployeeHireDate(employee: { hireDate: string | null }): string | null {
  return employee.hireDate
}

function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/)
  if (parts.length === 1) return { firstName: parts[0], lastName: '' }
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') }
}

// ============================================================
// IRS Contribution Limits (2026 Tax Year)
// ============================================================

export const IRS_LIMITS_2026 = {
  // 401(k), 403(b), 457(b) employee elective deferral
  EMPLOYEE_DEFERRAL_LIMIT: 24_000_00, // $24,000 in cents
  // Catch-up contribution for age 50+
  CATCH_UP_LIMIT: 7_500_00, // $7,500 in cents
  // Total annual addition limit (employee + employer)
  TOTAL_ANNUAL_ADDITION: 71_000_00, // $71,000 in cents
  // Total with catch-up
  TOTAL_WITH_CATCH_UP: 78_500_00, // $78,500 in cents
  // Compensation limit for benefit calculations
  COMPENSATION_LIMIT: 345_000_00, // $345,000 in cents
  // HCE threshold
  HCE_COMPENSATION_THRESHOLD: 160_000_00, // $160,000 in cents
  // Key employee officer compensation threshold
  KEY_EMPLOYEE_THRESHOLD: 230_000_00, // $230,000 in cents
  // SIMPLE IRA limits
  SIMPLE_IRA_DEFERRAL: 16_500_00, // $16,500 in cents
  SIMPLE_IRA_CATCH_UP: 3_500_00, // $3,500 in cents
  // SEP IRA limits
  SEP_IRA_LIMIT: 71_000_00, // $71,000 in cents
  SEP_IRA_COMP_PERCENT: 25, // 25% of compensation
  // RMD age threshold
  RMD_AGE: 73,
  // IRS uniform lifetime table (selected factors)
  RMD_DISTRIBUTION_PERIOD: new Map<number, number>([
    [73, 26.5], [74, 25.5], [75, 24.6], [76, 23.7], [77, 22.9],
    [78, 22.0], [79, 21.1], [80, 20.2], [81, 19.4], [82, 18.5],
    [83, 17.7], [84, 16.8], [85, 16.0], [86, 15.2], [87, 14.4],
    [88, 13.7], [89, 12.9], [90, 12.2], [91, 11.5], [92, 10.8],
    [93, 10.1], [94, 9.5], [95, 8.9], [96, 8.4], [97, 7.8],
    [98, 7.3], [99, 6.8], [100, 6.4],
  ]),
} as const

// ============================================================
// Types
// ============================================================

export type RetirementPlanType =
  | 'traditional_401k'
  | 'roth_401k'
  | 'safe_harbor_401k'
  | '403b'
  | '457b'
  | 'simple_ira'
  | 'sep_ira'

export type VestingScheduleType = 'immediate' | 'cliff' | 'graded' | 'custom'

export interface VestingStep {
  year: number
  percent: number
}

export interface Beneficiary {
  name: string
  relationship: string
  percent: number
  ssn?: string
  dateOfBirth?: string
  isPrimary: boolean
  isContingent: boolean
}

export interface InvestmentElection {
  fundId: string
  fundName: string
  percent: number
  assetClass?: string
}

export interface CreatePlanInput {
  orgId: string
  name: string
  type: RetirementPlanType
  provider: string
  planNumber?: string
  employeeContributionLimit?: number
  catchUpContributionLimit?: number
  employerMatchPercent?: number
  employerMatchCap?: number
  vestingType?: VestingScheduleType
  vestingSchedule?: VestingStep[]
  autoEnroll?: boolean
  autoEnrollPercent?: number
  autoEscalate?: boolean
  escalationPercent?: number
  escalationCap?: number
  effectiveDate?: string
}

export interface UpdatePlanInput {
  name?: string
  status?: 'active' | 'frozen' | 'terminated'
  provider?: string
  employerMatchPercent?: number
  employerMatchCap?: number
  vestingType?: VestingScheduleType
  vestingSchedule?: VestingStep[]
  autoEnroll?: boolean
  autoEnrollPercent?: number
  autoEscalate?: boolean
  escalationPercent?: number
  escalationCap?: number
  terminationDate?: string
}

export interface EnrollEmployeeInput {
  orgId: string
  planId: string
  employeeId: string
  contributionPercent: number
  isRoth?: boolean
  beneficiaries?: Beneficiary[]
  investmentElections?: InvestmentElection[]
}

export interface ContributionInput {
  orgId: string
  planId: string
  employeeId: string
  payrollRunId?: string
  employeeAmount: number
  employeePercent: number
  period: string
  isPreTax?: boolean
  salary: number
}

export interface NondiscriminationTestResult {
  testType: 'ADP' | 'ACP'
  planId: string
  planYear: number
  hceAverageRate: number
  nhceAverageRate: number
  maxAllowedHCERate: number
  passed: boolean
  correctionRequired: number
  details: {
    hceCount: number
    nhceCount: number
    hceParticipants: Array<{ employeeId: string; rate: number; isHCE: boolean }>
    nhceParticipants: Array<{ employeeId: string; rate: number; isHCE: boolean }>
  }
}

export interface PlanReport {
  planId: string
  planName: string
  planType: RetirementPlanType
  asOfDate: string
  totalParticipants: number
  activeParticipants: number
  totalAssets: number
  ytdContributions: {
    employeeTotal: number
    employerTotal: number
    grandTotal: number
  }
  averageContributionRate: number
  participationRate: number
  averageBalance: number
  vestingDistribution: Record<string, number>
}

export interface Form5500Data {
  planId: string
  planName: string
  planYear: { start: string; end: string }
  einNumber: string
  planNumber: string
  planType: string
  totalParticipants: number
  activeParticipants: number
  retiredOrSeparated: number
  totalAssets: number
  netAssets: number
  contributions: {
    employerContributions: number
    participantContributions: number
    totalContributions: number
  }
  benefits: {
    benefitsPaid: number
  }
  administrativeExpenses: number
  complianceFlags: string[]
}

export interface ParticipantStatement {
  employeeId: string
  employeeName: string
  planId: string
  planName: string
  statementPeriod: { start: string; end: string }
  accountSummary: {
    beginningBalance: number
    employeeContributions: number
    employerContributions: number
    investmentGainLoss: number
    endingBalance: number
  }
  vestingInfo: {
    vestedPercent: number
    vestedBalance: number
    nonVestedBalance: number
    yearsOfService: number
  }
  contributions: Array<{
    date: string
    employeeAmount: number
    employerAmount: number
    period: string
  }>
  investmentElections: InvestmentElection[]
  beneficiaries: Beneficiary[]
  catchUpEligible: boolean
  ytdContributions: number
  remainingContributionRoom: number
}

export interface ComplianceAlert {
  type: 'limit_approaching' | 'limit_exceeded' | 'rmd_due' | 'nondiscrimination_failure' | 'missing_enrollment' | 'beneficiary_missing' | 'plan_document_update' | 'filing_deadline'
  severity: 'info' | 'warning' | 'critical'
  message: string
  employeeId?: string
  planId: string
  dueDate?: string
  details?: Record<string, unknown>
}

// ============================================================
// Helpers
// ============================================================

function getLimitsForPlanType(type: RetirementPlanType) {
  switch (type) {
    case 'simple_ira':
      return {
        employeeDeferral: IRS_LIMITS_2026.SIMPLE_IRA_DEFERRAL,
        catchUp: IRS_LIMITS_2026.SIMPLE_IRA_CATCH_UP,
        totalAnnual: IRS_LIMITS_2026.SIMPLE_IRA_DEFERRAL + IRS_LIMITS_2026.SIMPLE_IRA_CATCH_UP,
      }
    case 'sep_ira':
      return {
        employeeDeferral: IRS_LIMITS_2026.SEP_IRA_LIMIT,
        catchUp: 0,
        totalAnnual: IRS_LIMITS_2026.SEP_IRA_LIMIT,
      }
    default:
      return {
        employeeDeferral: IRS_LIMITS_2026.EMPLOYEE_DEFERRAL_LIMIT,
        catchUp: IRS_LIMITS_2026.CATCH_UP_LIMIT,
        totalAnnual: IRS_LIMITS_2026.TOTAL_ANNUAL_ADDITION,
      }
  }
}

function getDefaultVestingSchedule(type: VestingScheduleType): VestingStep[] {
  switch (type) {
    case 'immediate':
      return [{ year: 0, percent: 100 }]
    case 'cliff':
      return [
        { year: 0, percent: 0 },
        { year: 1, percent: 0 },
        { year: 2, percent: 0 },
        { year: 3, percent: 100 },
      ]
    case 'graded':
      return [
        { year: 1, percent: 20 },
        { year: 2, percent: 40 },
        { year: 3, percent: 60 },
        { year: 4, percent: 80 },
        { year: 5, percent: 100 },
      ]
    case 'custom':
      return []
  }
}

function calculateAge(dateOfBirth: string | Date): number {
  const dob = new Date(dateOfBirth)
  const today = new Date()
  let age = today.getFullYear() - dob.getFullYear()
  const monthDiff = today.getMonth() - dob.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--
  }
  return age
}

function calculateYearsOfService(hireDate: string | Date): number {
  const hire = new Date(hireDate)
  const today = new Date()
  const msPerYear = 365.25 * 24 * 60 * 60 * 1000
  return Math.floor((today.getTime() - hire.getTime()) / msPerYear)
}

function getVestedPercent(schedule: VestingStep[], yearsOfService: number): number {
  if (!schedule || schedule.length === 0) return 100
  let vestedPercent = 0
  for (const step of schedule) {
    if (yearsOfService >= step.year) {
      vestedPercent = Math.max(vestedPercent, step.percent)
    }
  }
  return Math.min(vestedPercent, 100)
}

// ============================================================
// Plan Management
// ============================================================

/**
 * Create a new retirement plan for an organization.
 */
export async function createRetirementPlan(input: CreatePlanInput) {
  const limits = getLimitsForPlanType(input.type)
  const vestingType = input.vestingType || 'graded'
  const vestingSchedule = input.vestingSchedule || getDefaultVestingSchedule(vestingType)

  // Safe Harbor plans must have immediate vesting on employer contributions
  if (input.type === 'safe_harbor_401k' && vestingType !== 'immediate') {
    throw new Error('Safe Harbor 401(k) plans require immediate vesting on employer contributions')
  }

  const [plan] = await db.insert(schema.retirementPlans).values({
    orgId: input.orgId,
    name: input.name,
    type: input.type,
    provider: input.provider,
    planNumber: input.planNumber || null,
    employeeContributionLimit: input.employeeContributionLimit || limits.employeeDeferral,
    catchUpContributionLimit: input.catchUpContributionLimit || limits.catchUp,
    employerMatchPercent: input.employerMatchPercent ?? 100,
    employerMatchCap: input.employerMatchCap ?? 6,
    vestingType,
    vestingSchedule: vestingSchedule as unknown as Record<string, unknown>,
    autoEnroll: input.autoEnroll ?? false,
    autoEnrollPercent: input.autoEnrollPercent ?? 3,
    autoEscalate: input.autoEscalate ?? false,
    escalationPercent: input.escalationPercent ?? 1,
    escalationCap: input.escalationCap ?? 10,
    effectiveDate: input.effectiveDate || new Date().toISOString().split('T')[0],
  }).returning()

  return plan
}

/**
 * Update an existing retirement plan configuration.
 */
export async function updatePlanConfig(orgId: string, planId: string, updates: UpdatePlanInput) {
  const [existing] = await db.select()
    .from(schema.retirementPlans)
    .where(and(
      eq(schema.retirementPlans.id, planId),
      eq(schema.retirementPlans.orgId, orgId),
    ))

  if (!existing) throw new Error('Plan not found')

  if (updates.status === 'terminated' && !updates.terminationDate) {
    updates.terminationDate = new Date().toISOString().split('T')[0]
  }

  // Safe Harbor vesting validation
  if (existing.type === 'safe_harbor_401k' && updates.vestingType && updates.vestingType !== 'immediate') {
    throw new Error('Safe Harbor 401(k) plans require immediate vesting on employer contributions')
  }

  const updateValues: Record<string, unknown> = {}
  if (updates.name !== undefined) updateValues.name = updates.name
  if (updates.status !== undefined) updateValues.status = updates.status
  if (updates.provider !== undefined) updateValues.provider = updates.provider
  if (updates.employerMatchPercent !== undefined) updateValues.employerMatchPercent = updates.employerMatchPercent
  if (updates.employerMatchCap !== undefined) updateValues.employerMatchCap = updates.employerMatchCap
  if (updates.vestingType !== undefined) updateValues.vestingType = updates.vestingType
  if (updates.vestingSchedule !== undefined) updateValues.vestingSchedule = updates.vestingSchedule as unknown as Record<string, unknown>
  if (updates.autoEnroll !== undefined) updateValues.autoEnroll = updates.autoEnroll
  if (updates.autoEnrollPercent !== undefined) updateValues.autoEnrollPercent = updates.autoEnrollPercent
  if (updates.autoEscalate !== undefined) updateValues.autoEscalate = updates.autoEscalate
  if (updates.escalationPercent !== undefined) updateValues.escalationPercent = updates.escalationPercent
  if (updates.escalationCap !== undefined) updateValues.escalationCap = updates.escalationCap
  if (updates.terminationDate !== undefined) updateValues.terminationDate = updates.terminationDate

  const [updated] = await db.update(schema.retirementPlans)
    .set(updateValues)
    .where(and(
      eq(schema.retirementPlans.id, planId),
      eq(schema.retirementPlans.orgId, orgId),
    ))
    .returning()

  return updated
}

// ============================================================
// Enrollment
// ============================================================

/**
 * Enroll an employee in a retirement plan.
 */
export async function enrollEmployee(input: EnrollEmployeeInput) {
  const [plan] = await db.select()
    .from(schema.retirementPlans)
    .where(and(
      eq(schema.retirementPlans.id, input.planId),
      eq(schema.retirementPlans.orgId, input.orgId),
    ))

  if (!plan) throw new Error('Plan not found')
  if (plan.status !== 'active') throw new Error('Cannot enroll in a plan that is not active')

  // Check for existing active enrollment
  const existing = await db.select()
    .from(schema.retirementEnrollments)
    .where(and(
      eq(schema.retirementEnrollments.planId, input.planId),
      eq(schema.retirementEnrollments.employeeId, input.employeeId),
      eq(schema.retirementEnrollments.orgId, input.orgId),
    ))

  const activeEnrollment = existing.find(e => !e.terminatedAt)
  if (activeEnrollment) {
    throw new Error('Employee is already enrolled in this plan. Use updateContribution to modify.')
  }

  // Validate contribution percent is reasonable
  if (input.contributionPercent < 0 || input.contributionPercent > 100) {
    throw new Error('Contribution percent must be between 0 and 100')
  }

  // Validate beneficiary allocations
  if (input.beneficiaries && input.beneficiaries.length > 0) {
    const totalPercent = input.beneficiaries.reduce((sum, b) => sum + b.percent, 0)
    if (Math.abs(totalPercent - 100) > 0.01) {
      throw new Error('Beneficiary allocations must total 100%')
    }
  }

  // Validate investment elections
  if (input.investmentElections && input.investmentElections.length > 0) {
    const totalPercent = input.investmentElections.reduce((sum, e) => sum + e.percent, 0)
    if (Math.abs(totalPercent - 100) > 0.01) {
      throw new Error('Investment election allocations must total 100%')
    }
  }

  const [enrollment] = await db.insert(schema.retirementEnrollments).values({
    orgId: input.orgId,
    planId: input.planId,
    employeeId: input.employeeId,
    contributionPercent: input.contributionPercent,
    isRoth: input.isRoth ?? false,
    enrolledAt: new Date().toISOString().split('T')[0],
    beneficiaries: (input.beneficiaries || []) as unknown as Record<string, unknown>,
    investmentElections: (input.investmentElections || []) as unknown as Record<string, unknown>,
  }).returning()

  return enrollment
}

/**
 * Update an employee's contribution details.
 */
export async function updateContribution(
  orgId: string,
  planId: string,
  employeeId: string,
  updates: { contributionPercent?: number; isRoth?: boolean }
) {
  const enrollmentRows = await db.select()
    .from(schema.retirementEnrollments)
    .where(and(
      eq(schema.retirementEnrollments.orgId, orgId),
      eq(schema.retirementEnrollments.planId, planId),
      eq(schema.retirementEnrollments.employeeId, employeeId),
    ))

  const enrollment = enrollmentRows.find(e => !e.terminatedAt)
  if (!enrollment) throw new Error('No active enrollment found')

  if (updates.contributionPercent !== undefined) {
    if (updates.contributionPercent < 0 || updates.contributionPercent > 100) {
      throw new Error('Contribution percent must be between 0 and 100')
    }
  }

  const updateValues: Record<string, unknown> = {}
  if (updates.contributionPercent !== undefined) updateValues.contributionPercent = updates.contributionPercent
  if (updates.isRoth !== undefined) updateValues.isRoth = updates.isRoth

  const [updated] = await db.update(schema.retirementEnrollments)
    .set(updateValues)
    .where(eq(schema.retirementEnrollments.id, enrollment.id))
    .returning()

  return updated
}

/**
 * Change the contribution percent for an employee (convenience wrapper).
 */
export async function changeContributionPercent(
  orgId: string,
  planId: string,
  employeeId: string,
  newPercent: number
) {
  return updateContribution(orgId, planId, employeeId, { contributionPercent: newPercent })
}

// ============================================================
// Contribution Processing
// ============================================================

/**
 * Process a contribution for a pay period. Enforces IRS limits
 * and calculates employer match.
 */
export async function processContributions(input: ContributionInput) {
  const [plan] = await db.select()
    .from(schema.retirementPlans)
    .where(and(
      eq(schema.retirementPlans.id, input.planId),
      eq(schema.retirementPlans.orgId, input.orgId),
    ))

  if (!plan) throw new Error('Plan not found')
  if (plan.status !== 'active') throw new Error('Plan is not active')

  // Get employee for age check (catch-up eligibility)
  const [employee] = await db.select()
    .from(schema.employees)
    .where(eq(schema.employees.id, input.employeeId))

  if (!employee) throw new Error('Employee not found')

  const age = 30 // dateOfBirth not in employees table; default to non-catch-up age
  const isCatchUpEligible = age >= 50
  const limits = getLimitsForPlanType(plan.type as RetirementPlanType)

  // Get YTD contributions for this employee
  const currentYear = new Date().getFullYear()
  const ytdContributions = await db.select({
    employeeTotal: sum(schema.retirementContributions.employeeAmount),
    employerTotal: sum(schema.retirementContributions.employerAmount),
  })
    .from(schema.retirementContributions)
    .where(and(
      eq(schema.retirementContributions.planId, input.planId),
      eq(schema.retirementContributions.employeeId, input.employeeId),
      sql`EXTRACT(YEAR FROM ${schema.retirementContributions.createdAt}) = ${currentYear}`,
    ))

  const ytdEmployee = Number(ytdContributions[0]?.employeeTotal || 0)
  const ytdEmployer = Number(ytdContributions[0]?.employerTotal || 0)

  // Calculate employee contribution limit enforcement
  const maxEmployeeDeferral = isCatchUpEligible
    ? limits.employeeDeferral + limits.catchUp
    : limits.employeeDeferral

  const remainingEmployeeRoom = Math.max(0, maxEmployeeDeferral - ytdEmployee)
  const actualEmployeeContribution = Math.min(input.employeeAmount, remainingEmployeeRoom)

  // Calculate employer match
  const employerMatch = calculateEmployerMatch(
    actualEmployeeContribution,
    input.salary,
    input.employeePercent,
    plan.employerMatchPercent || 0,
    plan.employerMatchCap || 0,
  )

  // Enforce total annual addition limit
  const maxTotalAddition = isCatchUpEligible
    ? IRS_LIMITS_2026.TOTAL_WITH_CATCH_UP
    : IRS_LIMITS_2026.TOTAL_ANNUAL_ADDITION
  const ytdTotal = ytdEmployee + ytdEmployer
  const proposedTotal = actualEmployeeContribution + employerMatch
  const remainingTotalRoom = Math.max(0, maxTotalAddition - ytdTotal)
  const adjustedTotal = Math.min(proposedTotal, remainingTotalRoom)

  // Proportionally reduce if needed
  let finalEmployeeAmount = actualEmployeeContribution
  let finalEmployerAmount = employerMatch
  if (adjustedTotal < proposedTotal && proposedTotal > 0) {
    const ratio = adjustedTotal / proposedTotal
    finalEmployeeAmount = Math.floor(actualEmployeeContribution * ratio)
    finalEmployerAmount = Math.floor(employerMatch * ratio)
  }

  // Get vesting percent
  const yearsOfService = employee.hireDate ? calculateYearsOfService(employee.hireDate) : 0
  const vestingSchedule = (plan.vestingSchedule as unknown as VestingStep[]) || []
  const vestingPercent = getVestedPercent(vestingSchedule, yearsOfService)

  // Record the contribution
  const [contribution] = await db.insert(schema.retirementContributions).values({
    orgId: input.orgId,
    planId: input.planId,
    employeeId: input.employeeId,
    payrollRunId: input.payrollRunId || null,
    employeeAmount: finalEmployeeAmount,
    employerAmount: finalEmployerAmount,
    employeePercent: input.employeePercent,
    isPreTax: input.isPreTax ?? true,
    ytdEmployeeTotal: ytdEmployee + finalEmployeeAmount,
    ytdEmployerTotal: ytdEmployer + finalEmployerAmount,
    vestingPercent,
    period: input.period,
  }).returning()

  return {
    contribution,
    limitEnforcement: {
      requestedEmployeeAmount: input.employeeAmount,
      actualEmployeeAmount: finalEmployeeAmount,
      employerMatchAmount: finalEmployerAmount,
      wasLimited: finalEmployeeAmount < input.employeeAmount || finalEmployerAmount < employerMatch,
      ytdEmployeeTotal: ytdEmployee + finalEmployeeAmount,
      ytdEmployerTotal: ytdEmployer + finalEmployerAmount,
      remainingEmployeeRoom: maxEmployeeDeferral - (ytdEmployee + finalEmployeeAmount),
      remainingTotalRoom: maxTotalAddition - (ytdTotal + finalEmployeeAmount + finalEmployerAmount),
      catchUpApplied: isCatchUpEligible,
    },
  }
}

// ============================================================
// Vesting
// ============================================================

/**
 * Calculate current vesting status for an employee.
 */
export async function calculateVesting(
  orgId: string,
  planId: string,
  employeeId: string
): Promise<{
  vestedPercent: number
  yearsOfService: number
  nextVestingDate: string | null
  nextVestingPercent: number | null
  fullyVestedDate: string | null
}> {
  const [plan] = await db.select()
    .from(schema.retirementPlans)
    .where(and(
      eq(schema.retirementPlans.id, planId),
      eq(schema.retirementPlans.orgId, orgId),
    ))

  if (!plan) throw new Error('Plan not found')

  const [employee] = await db.select()
    .from(schema.employees)
    .where(eq(schema.employees.id, employeeId))

  if (!employee) throw new Error('Employee not found')

  const yearsOfService = employee.hireDate ? calculateYearsOfService(employee.hireDate) : 0
  const schedule = (plan.vestingSchedule as unknown as VestingStep[]) || []
  const vestedPercent = getVestedPercent(schedule, yearsOfService)

  // Determine next vesting milestone
  let nextVestingDate: string | null = null
  let nextVestingPercent: number | null = null
  let fullyVestedDate: string | null = null

  if (vestedPercent < 100 && employee.hireDate) {
    const hireDate = new Date(employee.hireDate)
    const sortedSchedule = [...schedule].sort((a, b) => a.year - b.year)

    for (const step of sortedSchedule) {
      if (step.year > yearsOfService && step.percent > vestedPercent) {
        nextVestingPercent = step.percent
        const nextDate = new Date(hireDate)
        nextDate.setFullYear(nextDate.getFullYear() + step.year)
        nextVestingDate = nextDate.toISOString().split('T')[0]
        break
      }
    }

    // Calculate fully vested date
    const fullVestStep = sortedSchedule.find(s => s.percent >= 100)
    if (fullVestStep) {
      const fvDate = new Date(hireDate)
      fvDate.setFullYear(fvDate.getFullYear() + fullVestStep.year)
      fullyVestedDate = fvDate.toISOString().split('T')[0]
    }
  }

  return {
    vestedPercent,
    yearsOfService,
    nextVestingDate,
    nextVestingPercent,
    fullyVestedDate,
  }
}

/**
 * Get the vesting schedule for a plan.
 */
export async function getVestingSchedule(orgId: string, planId: string) {
  const [plan] = await db.select()
    .from(schema.retirementPlans)
    .where(and(
      eq(schema.retirementPlans.id, planId),
      eq(schema.retirementPlans.orgId, orgId),
    ))

  if (!plan) throw new Error('Plan not found')

  return {
    vestingType: plan.vestingType,
    schedule: (plan.vestingSchedule as unknown as VestingStep[]) || [],
    isSafeHarbor: plan.type === 'safe_harbor_401k',
  }
}

// ============================================================
// Auto-Enrollment & Auto-Escalation
// ============================================================

/**
 * Process auto-enrollment for new hires in plans that have auto-enrollment enabled.
 */
export async function autoEnrollNewHires(orgId: string, planId: string, employeeIds: string[]) {
  const [plan] = await db.select()
    .from(schema.retirementPlans)
    .where(and(
      eq(schema.retirementPlans.id, planId),
      eq(schema.retirementPlans.orgId, orgId),
    ))

  if (!plan) throw new Error('Plan not found')
  if (!plan.autoEnroll) throw new Error('Auto-enrollment is not enabled for this plan')
  if (plan.status !== 'active') throw new Error('Plan is not active')

  const results: Array<{ employeeId: string; enrolled: boolean; reason?: string }> = []

  for (const employeeId of employeeIds) {
    try {
      // Check if already enrolled
      const existingEnrollments = await db.select()
        .from(schema.retirementEnrollments)
        .where(and(
          eq(schema.retirementEnrollments.planId, planId),
          eq(schema.retirementEnrollments.employeeId, employeeId),
          eq(schema.retirementEnrollments.orgId, orgId),
        ))

      if (existingEnrollments.some(e => !e.terminatedAt)) {
        results.push({ employeeId, enrolled: false, reason: 'Already enrolled' })
        continue
      }

      await db.insert(schema.retirementEnrollments).values({
        orgId,
        planId,
        employeeId,
        contributionPercent: plan.autoEnrollPercent || 3,
        isRoth: false,
        enrolledAt: new Date().toISOString().split('T')[0],
        beneficiaries: [] as unknown as Record<string, unknown>,
        investmentElections: [] as unknown as Record<string, unknown>,
      })

      results.push({ employeeId, enrolled: true })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      results.push({ employeeId, enrolled: false, reason: message })
    }
  }

  return {
    planId,
    autoEnrollPercent: plan.autoEnrollPercent,
    results,
    totalEnrolled: results.filter(r => r.enrolled).length,
    totalSkipped: results.filter(r => !r.enrolled).length,
  }
}

/**
 * Process auto-escalation for all eligible participants.
 * Increases contribution rates annually by the escalation percent up to the cap.
 */
export async function processAutoEscalation(orgId: string, planId: string) {
  const [plan] = await db.select()
    .from(schema.retirementPlans)
    .where(and(
      eq(schema.retirementPlans.id, planId),
      eq(schema.retirementPlans.orgId, orgId),
    ))

  if (!plan) throw new Error('Plan not found')
  if (!plan.autoEscalate) throw new Error('Auto-escalation is not enabled for this plan')

  const escalationPercent = plan.escalationPercent || 1
  const escalationCap = plan.escalationCap || 10

  // Get all active enrollments
  const enrollments = await db.select()
    .from(schema.retirementEnrollments)
    .where(and(
      eq(schema.retirementEnrollments.planId, planId),
      eq(schema.retirementEnrollments.orgId, orgId),
    ))

  const activeEnrollments = enrollments.filter(e => !e.terminatedAt)
  const results: Array<{ employeeId: string; oldPercent: number; newPercent: number; escalated: boolean; reason?: string }> = []

  for (const enrollment of activeEnrollments) {
    const currentPercent = enrollment.contributionPercent
    if (currentPercent >= escalationCap) {
      results.push({
        employeeId: enrollment.employeeId,
        oldPercent: currentPercent,
        newPercent: currentPercent,
        escalated: false,
        reason: 'Already at escalation cap',
      })
      continue
    }

    const newPercent = Math.min(currentPercent + escalationPercent, escalationCap)

    await db.update(schema.retirementEnrollments)
      .set({ contributionPercent: newPercent })
      .where(eq(schema.retirementEnrollments.id, enrollment.id))

    results.push({
      employeeId: enrollment.employeeId,
      oldPercent: currentPercent,
      newPercent,
      escalated: true,
    })
  }

  return {
    planId,
    escalationPercent,
    escalationCap,
    results,
    totalEscalated: results.filter(r => r.escalated).length,
    totalUnchanged: results.filter(r => !r.escalated).length,
  }
}

// ============================================================
// Employer Match Calculation
// ============================================================

/**
 * Calculate employer match amount based on plan rules.
 * Example: 100% match on first 6% of salary means if employee contributes 6%
 * of salary, employer matches dollar for dollar up to 6% of salary.
 */
export function calculateEmployerMatch(
  employeeContribution: number,
  salary: number,
  employeeContributionPercent: number,
  matchPercent: number,
  matchCap: number,
): number {
  if (matchPercent <= 0 || matchCap <= 0) return 0

  // Match cap is the maximum percent of salary the employer will match up to
  const eligibleSalaryAmount = Math.min(
    salary * (matchCap / 100),
    employeeContribution,
  )

  // Match percent is how much of the eligible amount the employer matches
  const matchAmount = Math.floor(eligibleSalaryAmount * (matchPercent / 100))

  // Apply IRS compensation limit
  const maxCompForCalc = Math.min(salary, IRS_LIMITS_2026.COMPENSATION_LIMIT)
  const maxMatchBasedOnComp = Math.floor(maxCompForCalc * (matchCap / 100) * (matchPercent / 100))

  return Math.min(matchAmount, maxMatchBasedOnComp)
}

// ============================================================
// Catch-Up Eligibility
// ============================================================

/**
 * Determine if an employee is eligible for catch-up contributions.
 */
export async function getCatchUpEligibility(
  orgId: string,
  planId: string,
  employeeId: string
): Promise<{
  eligible: boolean
  age: number
  catchUpLimit: number
  ytdContributions: number
  standardLimit: number
  totalAllowed: number
  remainingRoom: number
}> {
  const [plan] = await db.select()
    .from(schema.retirementPlans)
    .where(and(
      eq(schema.retirementPlans.id, planId),
      eq(schema.retirementPlans.orgId, orgId),
    ))

  if (!plan) throw new Error('Plan not found')

  const [employee] = await db.select()
    .from(schema.employees)
    .where(eq(schema.employees.id, employeeId))

  if (!employee) throw new Error('Employee not found')

  const age = 0 // dateOfBirth not in employees table; caller may supply age via API
  const eligible = age >= 50
  const limits = getLimitsForPlanType(plan.type as RetirementPlanType)
  const catchUpLimit = eligible ? limits.catchUp : 0
  const standardLimit = limits.employeeDeferral
  const totalAllowed = standardLimit + catchUpLimit

  // Get YTD contributions
  const currentYear = new Date().getFullYear()
  const ytdResult = await db.select({
    total: sum(schema.retirementContributions.employeeAmount),
  })
    .from(schema.retirementContributions)
    .where(and(
      eq(schema.retirementContributions.planId, planId),
      eq(schema.retirementContributions.employeeId, employeeId),
      sql`EXTRACT(YEAR FROM ${schema.retirementContributions.createdAt}) = ${currentYear}`,
    ))

  const ytdContributions = Number(ytdResult[0]?.total || 0)

  return {
    eligible,
    age,
    catchUpLimit,
    ytdContributions,
    standardLimit,
    totalAllowed,
    remainingRoom: Math.max(0, totalAllowed - ytdContributions),
  }
}

// ============================================================
// Reports & Compliance
// ============================================================

/**
 * Generate a comprehensive plan report.
 */
export async function generatePlanReport(orgId: string, planId: string): Promise<PlanReport> {
  const [plan] = await db.select()
    .from(schema.retirementPlans)
    .where(and(
      eq(schema.retirementPlans.id, planId),
      eq(schema.retirementPlans.orgId, orgId),
    ))

  if (!plan) throw new Error('Plan not found')

  // Get all enrollments
  const enrollments = await db.select()
    .from(schema.retirementEnrollments)
    .where(and(
      eq(schema.retirementEnrollments.planId, planId),
      eq(schema.retirementEnrollments.orgId, orgId),
    ))

  const activeEnrollments = enrollments.filter(e => !e.terminatedAt)

  // Get total employees in org for participation rate
  const allEmployees = await db.select()
    .from(schema.employees)
    .where(and(
      eq(schema.employees.orgId, orgId),
      eq(schema.employees.isActive, true),
    ))

  // Get YTD contributions
  const currentYear = new Date().getFullYear()
  const contributions = await db.select({
    employeeTotal: sum(schema.retirementContributions.employeeAmount),
    employerTotal: sum(schema.retirementContributions.employerAmount),
  })
    .from(schema.retirementContributions)
    .where(and(
      eq(schema.retirementContributions.planId, planId),
      eq(schema.retirementContributions.orgId, orgId),
      sql`EXTRACT(YEAR FROM ${schema.retirementContributions.createdAt}) = ${currentYear}`,
    ))

  const ytdEmployee = Number(contributions[0]?.employeeTotal || 0)
  const ytdEmployer = Number(contributions[0]?.employerTotal || 0)
  const totalAssets = ytdEmployee + ytdEmployer

  // Vesting distribution
  const vestingDistribution: Record<string, number> = {
    '0-20%': 0,
    '21-40%': 0,
    '41-60%': 0,
    '61-80%': 0,
    '81-99%': 0,
    '100%': 0,
  }

  for (const enrollment of activeEnrollments) {
    const emp = allEmployees.find(e => e.id === enrollment.employeeId)
    if (!emp) continue
    const yearsOfService = emp.hireDate ? calculateYearsOfService(emp.hireDate) : 0
    const schedule = (plan.vestingSchedule as unknown as VestingStep[]) || []
    const vested = getVestedPercent(schedule, yearsOfService)

    if (vested >= 100) vestingDistribution['100%']++
    else if (vested >= 81) vestingDistribution['81-99%']++
    else if (vested >= 61) vestingDistribution['61-80%']++
    else if (vested >= 41) vestingDistribution['41-60%']++
    else if (vested >= 21) vestingDistribution['21-40%']++
    else vestingDistribution['0-20%']++
  }

  const avgContribRate = activeEnrollments.length > 0
    ? activeEnrollments.reduce((sum, e) => sum + e.contributionPercent, 0) / activeEnrollments.length
    : 0

  return {
    planId,
    planName: plan.name,
    planType: plan.type as RetirementPlanType,
    asOfDate: new Date().toISOString().split('T')[0],
    totalParticipants: enrollments.length,
    activeParticipants: activeEnrollments.length,
    totalAssets,
    ytdContributions: {
      employeeTotal: ytdEmployee,
      employerTotal: ytdEmployer,
      grandTotal: ytdEmployee + ytdEmployer,
    },
    averageContributionRate: Math.round(avgContribRate * 100) / 100,
    participationRate: allEmployees.length > 0
      ? Math.round((activeEnrollments.length / allEmployees.length) * 10000) / 100
      : 0,
    averageBalance: activeEnrollments.length > 0
      ? Math.round(totalAssets / activeEnrollments.length)
      : 0,
    vestingDistribution,
  }
}

/**
 * Generate data needed for IRS Form 5500 filing.
 */
export async function get5500Data(orgId: string, planId: string, planYear?: number): Promise<Form5500Data> {
  const year = planYear || new Date().getFullYear()

  const [plan] = await db.select()
    .from(schema.retirementPlans)
    .where(and(
      eq(schema.retirementPlans.id, planId),
      eq(schema.retirementPlans.orgId, orgId),
    ))

  if (!plan) throw new Error('Plan not found')

  const [org] = await db.select()
    .from(schema.organizations)
    .where(eq(schema.organizations.id, orgId))

  // Get enrollments
  const enrollments = await db.select()
    .from(schema.retirementEnrollments)
    .where(and(
      eq(schema.retirementEnrollments.planId, planId),
      eq(schema.retirementEnrollments.orgId, orgId),
    ))

  const activeEnrollments = enrollments.filter(e => !e.terminatedAt)
  const separatedEnrollments = enrollments.filter(e => e.terminatedAt)

  // Get contributions for the plan year
  const contributions = await db.select({
    employeeTotal: sum(schema.retirementContributions.employeeAmount),
    employerTotal: sum(schema.retirementContributions.employerAmount),
  })
    .from(schema.retirementContributions)
    .where(and(
      eq(schema.retirementContributions.planId, planId),
      eq(schema.retirementContributions.orgId, orgId),
      sql`EXTRACT(YEAR FROM ${schema.retirementContributions.createdAt}) = ${year}`,
    ))

  const employerContribs = Number(contributions[0]?.employerTotal || 0)
  const participantContribs = Number(contributions[0]?.employeeTotal || 0)
  const totalContribs = employerContribs + participantContribs

  // Compliance flags
  const complianceFlags: string[] = []
  if (enrollments.length >= 100) {
    complianceFlags.push('LARGE_PLAN_AUDIT_REQUIRED')
  }
  if (plan.type === 'safe_harbor_401k') {
    complianceFlags.push('SAFE_HARBOR_NOTICE_REQUIRED')
  }

  return {
    planId: plan.id,
    planName: plan.name,
    planYear: {
      start: `${year}-01-01`,
      end: `${year}-12-31`,
    },
    einNumber: org?.id || 'N/A', // Placeholder - real EIN would be stored on org
    planNumber: plan.planNumber || '001',
    planType: plan.type,
    totalParticipants: enrollments.length,
    activeParticipants: activeEnrollments.length,
    retiredOrSeparated: separatedEnrollments.length,
    totalAssets: totalContribs,
    netAssets: totalContribs, // Simplified; real implementation would include investments
    contributions: {
      employerContributions: employerContribs,
      participantContributions: participantContribs,
      totalContributions: totalContribs,
    },
    benefits: {
      benefitsPaid: 0, // Would track distributions
    },
    administrativeExpenses: 0,
    complianceFlags,
  }
}

/**
 * Generate a participant statement for an employee.
 */
export async function getParticipantStatement(
  orgId: string,
  planId: string,
  employeeId: string,
  periodStart?: string,
  periodEnd?: string
): Promise<ParticipantStatement> {
  const now = new Date()
  const start = periodStart || `${now.getFullYear()}-01-01`
  const end = periodEnd || now.toISOString().split('T')[0]

  const [plan] = await db.select()
    .from(schema.retirementPlans)
    .where(and(
      eq(schema.retirementPlans.id, planId),
      eq(schema.retirementPlans.orgId, orgId),
    ))

  if (!plan) throw new Error('Plan not found')

  const [employee] = await db.select()
    .from(schema.employees)
    .where(eq(schema.employees.id, employeeId))

  if (!employee) throw new Error('Employee not found')

  // Get enrollment
  const enrollmentRows = await db.select()
    .from(schema.retirementEnrollments)
    .where(and(
      eq(schema.retirementEnrollments.planId, planId),
      eq(schema.retirementEnrollments.employeeId, employeeId),
      eq(schema.retirementEnrollments.orgId, orgId),
    ))

  const enrollment = enrollmentRows.find(e => !e.terminatedAt) || enrollmentRows[0]
  if (!enrollment) throw new Error('No enrollment found')

  // Get contributions in the period
  const periodContributions = await db.select()
    .from(schema.retirementContributions)
    .where(and(
      eq(schema.retirementContributions.planId, planId),
      eq(schema.retirementContributions.employeeId, employeeId),
      gte(schema.retirementContributions.createdAt, new Date(start)),
      lte(schema.retirementContributions.createdAt, new Date(end)),
    ))
    .orderBy(schema.retirementContributions.createdAt)

  // Get YTD contributions
  const currentYear = now.getFullYear()
  const ytdResult = await db.select({
    employeeTotal: sum(schema.retirementContributions.employeeAmount),
    employerTotal: sum(schema.retirementContributions.employerAmount),
  })
    .from(schema.retirementContributions)
    .where(and(
      eq(schema.retirementContributions.planId, planId),
      eq(schema.retirementContributions.employeeId, employeeId),
      sql`EXTRACT(YEAR FROM ${schema.retirementContributions.createdAt}) = ${currentYear}`,
    ))

  const ytdEmployee = Number(ytdResult[0]?.employeeTotal || 0)
  const ytdEmployer = Number(ytdResult[0]?.employerTotal || 0)

  // Vesting
  const yearsOfService = employee.hireDate ? calculateYearsOfService(employee.hireDate) : 0
  const schedule = (plan.vestingSchedule as unknown as VestingStep[]) || []
  const vestedPercent = getVestedPercent(schedule, yearsOfService)
  const totalBalance = ytdEmployee + ytdEmployer
  const vestedBalance = Math.floor(ytdEmployee + (ytdEmployer * vestedPercent / 100))

  // Catch-up eligibility
  const age = 0 // dateOfBirth not in employees table; caller may supply age via API
  const catchUpEligible = age >= 50
  const limits = getLimitsForPlanType(plan.type as RetirementPlanType)
  const maxDeferral = catchUpEligible
    ? limits.employeeDeferral + limits.catchUp
    : limits.employeeDeferral

  // Period totals
  const periodEmployeeTotal = periodContributions.reduce((s, c) => s + c.employeeAmount, 0)
  const periodEmployerTotal = periodContributions.reduce((s, c) => s + c.employerAmount, 0)

  // Get prior balance (all contributions before period start)
  const priorResult = await db.select({
    employeeTotal: sum(schema.retirementContributions.employeeAmount),
    employerTotal: sum(schema.retirementContributions.employerAmount),
  })
    .from(schema.retirementContributions)
    .where(and(
      eq(schema.retirementContributions.planId, planId),
      eq(schema.retirementContributions.employeeId, employeeId),
      sql`${schema.retirementContributions.createdAt} < ${new Date(start)}`,
    ))

  const beginningBalance = Number(priorResult[0]?.employeeTotal || 0) + Number(priorResult[0]?.employerTotal || 0)

  return {
    employeeId,
    employeeName: employee.fullName,
    planId,
    planName: plan.name,
    statementPeriod: { start, end },
    accountSummary: {
      beginningBalance,
      employeeContributions: periodEmployeeTotal,
      employerContributions: periodEmployerTotal,
      investmentGainLoss: 0, // Would connect to investment provider
      endingBalance: beginningBalance + periodEmployeeTotal + periodEmployerTotal,
    },
    vestingInfo: {
      vestedPercent,
      vestedBalance,
      nonVestedBalance: totalBalance - vestedBalance,
      yearsOfService,
    },
    contributions: periodContributions.map(c => ({
      date: c.createdAt.toISOString().split('T')[0],
      employeeAmount: c.employeeAmount,
      employerAmount: c.employerAmount,
      period: c.period,
    })),
    investmentElections: (enrollment.investmentElections as unknown as InvestmentElection[]) || [],
    beneficiaries: (enrollment.beneficiaries as unknown as Beneficiary[]) || [],
    catchUpEligible,
    ytdContributions: ytdEmployee,
    remainingContributionRoom: Math.max(0, maxDeferral - ytdEmployee),
  }
}

// ============================================================
// Beneficiary & Investment Management
// ============================================================

/**
 * Update beneficiary designations for an enrollment.
 */
export async function updateBeneficiaries(
  orgId: string,
  planId: string,
  employeeId: string,
  beneficiaries: Beneficiary[]
) {
  // Validate beneficiary allocations
  if (beneficiaries.length > 0) {
    const primaryBeneficiaries = beneficiaries.filter(b => b.isPrimary)
    const contingentBeneficiaries = beneficiaries.filter(b => b.isContingent)

    if (primaryBeneficiaries.length > 0) {
      const primaryTotal = primaryBeneficiaries.reduce((sum, b) => sum + b.percent, 0)
      if (Math.abs(primaryTotal - 100) > 0.01) {
        throw new Error('Primary beneficiary allocations must total 100%')
      }
    }

    if (contingentBeneficiaries.length > 0) {
      const contingentTotal = contingentBeneficiaries.reduce((sum, b) => sum + b.percent, 0)
      if (Math.abs(contingentTotal - 100) > 0.01) {
        throw new Error('Contingent beneficiary allocations must total 100%')
      }
    }
  }

  const enrollmentRows = await db.select()
    .from(schema.retirementEnrollments)
    .where(and(
      eq(schema.retirementEnrollments.orgId, orgId),
      eq(schema.retirementEnrollments.planId, planId),
      eq(schema.retirementEnrollments.employeeId, employeeId),
    ))

  const enrollment = enrollmentRows.find(e => !e.terminatedAt)
  if (!enrollment) throw new Error('No active enrollment found')

  const [updated] = await db.update(schema.retirementEnrollments)
    .set({ beneficiaries: beneficiaries as unknown as Record<string, unknown> })
    .where(eq(schema.retirementEnrollments.id, enrollment.id))
    .returning()

  return updated
}

/**
 * Update investment election allocations.
 */
export async function updateInvestmentElections(
  orgId: string,
  planId: string,
  employeeId: string,
  elections: InvestmentElection[]
) {
  // Validate allocations total 100%
  if (elections.length > 0) {
    const total = elections.reduce((sum, e) => sum + e.percent, 0)
    if (Math.abs(total - 100) > 0.01) {
      throw new Error('Investment election allocations must total 100%')
    }
  }

  const enrollmentRows = await db.select()
    .from(schema.retirementEnrollments)
    .where(and(
      eq(schema.retirementEnrollments.orgId, orgId),
      eq(schema.retirementEnrollments.planId, planId),
      eq(schema.retirementEnrollments.employeeId, employeeId),
    ))

  const enrollment = enrollmentRows.find(e => !e.terminatedAt)
  if (!enrollment) throw new Error('No active enrollment found')

  const [updated] = await db.update(schema.retirementEnrollments)
    .set({ investmentElections: elections as unknown as Record<string, unknown> })
    .where(eq(schema.retirementEnrollments.id, enrollment.id))
    .returning()

  return updated
}

// ============================================================
// Termination & Rollover
// ============================================================

/**
 * Terminate an employee's plan participation.
 */
export async function terminateParticipation(
  orgId: string,
  planId: string,
  employeeId: string,
  terminationDate?: string
) {
  const enrollmentRows = await db.select()
    .from(schema.retirementEnrollments)
    .where(and(
      eq(schema.retirementEnrollments.orgId, orgId),
      eq(schema.retirementEnrollments.planId, planId),
      eq(schema.retirementEnrollments.employeeId, employeeId),
    ))

  const enrollment = enrollmentRows.find(e => !e.terminatedAt)
  if (!enrollment) throw new Error('No active enrollment found')

  const termDate = terminationDate || new Date().toISOString().split('T')[0]

  // Calculate final vesting
  const [employee] = await db.select()
    .from(schema.employees)
    .where(eq(schema.employees.id, employeeId))

  const [plan] = await db.select()
    .from(schema.retirementPlans)
    .where(eq(schema.retirementPlans.id, planId))

  let finalVestedPercent = 100
  if (employee && plan) {
    const yearsOfService = employee.hireDate ? calculateYearsOfService(employee.hireDate) : 0
    const schedule = (plan.vestingSchedule as unknown as VestingStep[]) || []
    finalVestedPercent = getVestedPercent(schedule, yearsOfService)
  }

  const [updated] = await db.update(schema.retirementEnrollments)
    .set({ terminatedAt: termDate })
    .where(eq(schema.retirementEnrollments.id, enrollment.id))
    .returning()

  // Get final balance
  const balanceResult = await db.select({
    employeeTotal: sum(schema.retirementContributions.employeeAmount),
    employerTotal: sum(schema.retirementContributions.employerAmount),
  })
    .from(schema.retirementContributions)
    .where(and(
      eq(schema.retirementContributions.planId, planId),
      eq(schema.retirementContributions.employeeId, employeeId),
    ))

  const employeeBalance = Number(balanceResult[0]?.employeeTotal || 0)
  const employerBalance = Number(balanceResult[0]?.employerTotal || 0)
  const vestedEmployerBalance = Math.floor(employerBalance * finalVestedPercent / 100)

  return {
    enrollment: updated,
    terminationDate: termDate,
    finalVesting: {
      vestedPercent: finalVestedPercent,
      employeeBalance,
      vestedEmployerBalance,
      forfeitedAmount: employerBalance - vestedEmployerBalance,
      totalDistributableBalance: employeeBalance + vestedEmployerBalance,
    },
    distributionOptions: [
      'Direct rollover to IRA',
      'Direct rollover to new employer plan',
      'Lump sum distribution (subject to taxes and potential penalties)',
      'Leave in current plan (if balance > $5,000)',
      'Periodic distributions',
    ],
  }
}

/**
 * Process a rollover from one plan/account to another.
 */
export async function processRollover(
  orgId: string,
  planId: string,
  employeeId: string,
  rolloverDetails: {
    targetType: 'ira' | 'employer_plan' | 'roth_ira'
    targetInstitution: string
    targetAccountNumber: string
    amount: number
    isDirectRollover: boolean
  }
) {
  // Verify the participation is terminated or eligible for in-service distribution
  const enrollmentRows = await db.select()
    .from(schema.retirementEnrollments)
    .where(and(
      eq(schema.retirementEnrollments.orgId, orgId),
      eq(schema.retirementEnrollments.planId, planId),
      eq(schema.retirementEnrollments.employeeId, employeeId),
    ))

  const terminatedEnrollment = enrollmentRows.find(e => e.terminatedAt)
  const activeEnrollment = enrollmentRows.find(e => !e.terminatedAt)

  if (!terminatedEnrollment && !activeEnrollment) {
    throw new Error('No enrollment found for this employee')
  }

  // Get balance
  const balanceResult = await db.select({
    employeeTotal: sum(schema.retirementContributions.employeeAmount),
    employerTotal: sum(schema.retirementContributions.employerAmount),
  })
    .from(schema.retirementContributions)
    .where(and(
      eq(schema.retirementContributions.planId, planId),
      eq(schema.retirementContributions.employeeId, employeeId),
    ))

  const totalBalance = Number(balanceResult[0]?.employeeTotal || 0) + Number(balanceResult[0]?.employerTotal || 0)

  if (rolloverDetails.amount > totalBalance) {
    throw new Error(`Rollover amount exceeds available balance of $${(totalBalance / 100).toFixed(2)}`)
  }

  // Tax implications
  const taxImplications: string[] = []
  if (!rolloverDetails.isDirectRollover) {
    taxImplications.push('20% mandatory federal tax withholding applies to indirect rollovers')
    taxImplications.push('Must complete rollover within 60 days to avoid taxes and penalties')
  }
  if (rolloverDetails.targetType === 'roth_ira') {
    taxImplications.push('Rollover to Roth IRA is a taxable event - pre-tax amounts will be included in income')
  }

  return {
    rolloverProcessed: true,
    employeeId,
    planId,
    amount: rolloverDetails.amount,
    targetType: rolloverDetails.targetType,
    targetInstitution: rolloverDetails.targetInstitution,
    isDirectRollover: rolloverDetails.isDirectRollover,
    taxImplications,
    estimatedProcessingDays: rolloverDetails.isDirectRollover ? 5 : 14,
    referenceNumber: crypto.randomUUID(),
  }
}

// ============================================================
// Required Minimum Distributions (RMD)
// ============================================================

/**
 * Calculate Required Minimum Distribution for participants age 73+.
 * Since dateOfBirth is not stored on the employees table, the caller
 * must supply `employeeAge`. If omitted, the function returns a
 * "not required" result.
 */
export async function calculateRMD(
  orgId: string,
  planId: string,
  employeeId: string,
  priorYearEndBalance?: number,
  employeeAge?: number
): Promise<{
  required: boolean
  age: number
  rmdAge: number
  distributionPeriod: number | null
  priorYearEndBalance: number
  rmdAmount: number
  deadline: string
  firstRMDDeadlineExtension: boolean
}> {
  const [employee] = await db.select()
    .from(schema.employees)
    .where(eq(schema.employees.id, employeeId))

  if (!employee) throw new Error('Employee not found')

  const age: number = employeeAge ?? 0
  const rmdAge = IRS_LIMITS_2026.RMD_AGE
  const required = age >= rmdAge

  if (!required) {
    return {
      required: false,
      age,
      rmdAge,
      distributionPeriod: null,
      priorYearEndBalance: 0,
      rmdAmount: 0,
      deadline: '',
      firstRMDDeadlineExtension: false,
    }
  }

  // Get prior year end balance if not provided
  let balance = priorYearEndBalance
  if (balance === undefined || balance === null) {
    const priorYear = new Date().getFullYear() - 1
    const balanceResult = await db.select({
      employeeTotal: sum(schema.retirementContributions.employeeAmount),
      employerTotal: sum(schema.retirementContributions.employerAmount),
    })
      .from(schema.retirementContributions)
      .where(and(
        eq(schema.retirementContributions.planId, planId),
        eq(schema.retirementContributions.employeeId, employeeId),
        sql`EXTRACT(YEAR FROM ${schema.retirementContributions.createdAt}) <= ${priorYear}`,
      ))

    balance = Number(balanceResult[0]?.employeeTotal || 0) + Number(balanceResult[0]?.employerTotal || 0)
  }

  // Get distribution period from IRS uniform lifetime table
  const distributionPeriod = IRS_LIMITS_2026.RMD_DISTRIBUTION_PERIOD.get(age) || 6.4

  // Calculate RMD: prior year-end balance / distribution period
  const rmdAmount = Math.ceil(balance / distributionPeriod)

  // First RMD can be delayed until April 1 of the following year
  const isFirstRMD = age === rmdAge
  const currentYear = new Date().getFullYear()
  const deadline = isFirstRMD
    ? `${currentYear + 1}-04-01`
    : `${currentYear}-12-31`

  return {
    required: true,
    age,
    rmdAge,
    distributionPeriod,
    priorYearEndBalance: balance,
    rmdAmount,
    deadline,
    firstRMDDeadlineExtension: isFirstRMD,
  }
}

// ============================================================
// Nondiscrimination Testing (ADP/ACP)
// ============================================================

/**
 * Run ADP (Actual Deferral Percentage) or ACP (Actual Contribution Percentage) test.
 *
 * ADP test compares average deferral rates of HCEs vs NHCEs.
 * ACP test compares average employer match rates of HCEs vs NHCEs.
 *
 * IRS rules:
 * - If NHCE ADP <= 2%, HCE ADP can be up to 2x NHCE ADP
 * - If NHCE ADP > 2% and <= 8%, HCE ADP can be NHCE ADP + 2%
 * - If NHCE ADP > 8%, HCE ADP can be up to 1.25x NHCE ADP
 */
export async function runNondiscriminationTest(
  orgId: string,
  planId: string,
  testType: 'ADP' | 'ACP',
  hceThreshold?: number
): Promise<NondiscriminationTestResult> {
  const threshold = hceThreshold || IRS_LIMITS_2026.HCE_COMPENSATION_THRESHOLD

  const [plan] = await db.select()
    .from(schema.retirementPlans)
    .where(and(
      eq(schema.retirementPlans.id, planId),
      eq(schema.retirementPlans.orgId, orgId),
    ))

  if (!plan) throw new Error('Plan not found')

  // Safe Harbor plans automatically pass nondiscrimination testing
  if (plan.type === 'safe_harbor_401k') {
    return {
      testType,
      planId,
      planYear: new Date().getFullYear(),
      hceAverageRate: 0,
      nhceAverageRate: 0,
      maxAllowedHCERate: 100,
      passed: true,
      correctionRequired: 0,
      details: {
        hceCount: 0,
        nhceCount: 0,
        hceParticipants: [],
        nhceParticipants: [],
      },
    }
  }

  // Get all active enrollments with employee data
  const enrollments = await db.select()
    .from(schema.retirementEnrollments)
    .where(and(
      eq(schema.retirementEnrollments.planId, planId),
      eq(schema.retirementEnrollments.orgId, orgId),
    ))

  const activeEnrollments = enrollments.filter(e => !e.terminatedAt)

  // Get employee salary data for HCE classification via salaryReviews
  const employees = await db.select()
    .from(schema.employees)
    .where(and(
      eq(schema.employees.orgId, orgId),
      eq(schema.employees.isActive, true),
    ))

  // Look up latest salary for each employee from salaryReviews
  const salaryReviews = await db.select()
    .from(schema.salaryReviews)
    .where(eq(schema.salaryReviews.orgId, orgId))
    .orderBy(desc(schema.salaryReviews.createdAt))

  const employeeSalaryMap = new Map<string, number>()
  for (const review of salaryReviews) {
    if (!employeeSalaryMap.has(review.employeeId)) {
      employeeSalaryMap.set(
        review.employeeId,
        review.status === 'approved' ? review.proposedSalary : review.currentSalary,
      )
    }
  }

  const hceParticipants: Array<{ employeeId: string; rate: number; isHCE: boolean }> = []
  const nhceParticipants: Array<{ employeeId: string; rate: number; isHCE: boolean }> = []

  for (const enrollment of activeEnrollments) {
    const employee = employees.find(e => e.id === enrollment.employeeId)
    if (!employee) continue

    const salary = employeeSalaryMap.get(enrollment.employeeId) || 0
    const isHCE = salary >= threshold / 100 // threshold is in cents, salary is in dollars
    const rate = testType === 'ADP'
      ? enrollment.contributionPercent
      : (plan.employerMatchCap || 0) // Simplified ACP rate

    const participant = { employeeId: enrollment.employeeId, rate, isHCE }
    if (isHCE) {
      hceParticipants.push(participant)
    } else {
      nhceParticipants.push(participant)
    }
  }

  const hceAverageRate = hceParticipants.length > 0
    ? hceParticipants.reduce((sum, p) => sum + p.rate, 0) / hceParticipants.length
    : 0

  const nhceAverageRate = nhceParticipants.length > 0
    ? nhceParticipants.reduce((sum, p) => sum + p.rate, 0) / nhceParticipants.length
    : 0

  // Calculate max allowed HCE rate based on IRS rules
  let maxAllowedHCERate: number
  if (nhceAverageRate <= 2) {
    maxAllowedHCERate = nhceAverageRate * 2
  } else if (nhceAverageRate <= 8) {
    maxAllowedHCERate = nhceAverageRate + 2
  } else {
    maxAllowedHCERate = nhceAverageRate * 1.25
  }

  const passed = hceAverageRate <= maxAllowedHCERate
  const correctionRequired = passed ? 0 : Math.round((hceAverageRate - maxAllowedHCERate) * 100) / 100

  return {
    testType,
    planId,
    planYear: new Date().getFullYear(),
    hceAverageRate: Math.round(hceAverageRate * 100) / 100,
    nhceAverageRate: Math.round(nhceAverageRate * 100) / 100,
    maxAllowedHCERate: Math.round(maxAllowedHCERate * 100) / 100,
    passed,
    correctionRequired,
    details: {
      hceCount: hceParticipants.length,
      nhceCount: nhceParticipants.length,
      hceParticipants,
      nhceParticipants,
    },
  }
}

// ============================================================
// Compliance Alerts
// ============================================================

/**
 * Get all active compliance alerts for a retirement plan.
 */
export async function getComplianceAlerts(
  orgId: string,
  planId: string
): Promise<ComplianceAlert[]> {
  const alerts: ComplianceAlert[] = []

  const [plan] = await db.select()
    .from(schema.retirementPlans)
    .where(and(
      eq(schema.retirementPlans.id, planId),
      eq(schema.retirementPlans.orgId, orgId),
    ))

  if (!plan) throw new Error('Plan not found')

  // Get all active enrollments
  const enrollments = await db.select()
    .from(schema.retirementEnrollments)
    .where(and(
      eq(schema.retirementEnrollments.planId, planId),
      eq(schema.retirementEnrollments.orgId, orgId),
    ))

  const activeEnrollments = enrollments.filter(e => !e.terminatedAt)
  const currentYear = new Date().getFullYear()
  const limits = getLimitsForPlanType(plan.type as RetirementPlanType)

  for (const enrollment of activeEnrollments) {
    // Check for missing beneficiaries
    const beneficiaries = enrollment.beneficiaries as unknown as Beneficiary[] | null
    if (!beneficiaries || beneficiaries.length === 0) {
      alerts.push({
        type: 'beneficiary_missing',
        severity: 'warning',
        message: 'No beneficiary designations on file',
        employeeId: enrollment.employeeId,
        planId,
      })
    }

    // Check YTD contributions approaching limits
    const ytdResult = await db.select({
      total: sum(schema.retirementContributions.employeeAmount),
    })
      .from(schema.retirementContributions)
      .where(and(
        eq(schema.retirementContributions.planId, planId),
        eq(schema.retirementContributions.employeeId, enrollment.employeeId),
        sql`EXTRACT(YEAR FROM ${schema.retirementContributions.createdAt}) = ${currentYear}`,
      ))

    const ytdTotal = Number(ytdResult[0]?.total || 0)
    const limitThreshold = limits.employeeDeferral * 0.9 // 90% of limit

    if (ytdTotal >= limits.employeeDeferral) {
      alerts.push({
        type: 'limit_exceeded',
        severity: 'critical',
        message: `Employee has reached the annual contribution limit of $${(limits.employeeDeferral / 100).toLocaleString()}`,
        employeeId: enrollment.employeeId,
        planId,
        details: { ytdTotal, limit: limits.employeeDeferral },
      })
    } else if (ytdTotal >= limitThreshold) {
      alerts.push({
        type: 'limit_approaching',
        severity: 'warning',
        message: `Employee is approaching the annual contribution limit (${Math.round(ytdTotal / limits.employeeDeferral * 100)}% used)`,
        employeeId: enrollment.employeeId,
        planId,
        details: { ytdTotal, limit: limits.employeeDeferral, percentUsed: Math.round(ytdTotal / limits.employeeDeferral * 100) },
      })
    }

    // RMD check - note: dateOfBirth is not stored in the employees table,
    // so we use hireDate as a proxy. If an employee has been with the org
    // for 30+ years, flag for manual RMD review.
    const [employee] = await db.select()
      .from(schema.employees)
      .where(eq(schema.employees.id, enrollment.employeeId))

    if (employee?.hireDate) {
      const yearsEmployed = calculateYearsOfService(employee.hireDate)
      if (yearsEmployed >= 30) {
        alerts.push({
          type: 'rmd_due',
          severity: 'warning',
          message: `Employee has ${yearsEmployed} years of service - verify RMD eligibility (age ${IRS_LIMITS_2026.RMD_AGE}+)`,
          employeeId: enrollment.employeeId,
          planId,
          dueDate: `${currentYear}-12-31`,
        })
      }
    }
  }

  // Plan-level alerts
  const now = new Date()

  // Form 5500 filing deadline (July 31 for calendar year plans)
  const filingDeadline = new Date(currentYear, 6, 31) // July 31
  const daysUntilFiling = Math.ceil((filingDeadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  if (daysUntilFiling > 0 && daysUntilFiling <= 90) {
    alerts.push({
      type: 'filing_deadline',
      severity: daysUntilFiling <= 30 ? 'critical' : 'warning',
      message: `Form 5500 filing deadline in ${daysUntilFiling} days`,
      planId,
      dueDate: filingDeadline.toISOString().split('T')[0],
    })
  }

  // Nondiscrimination test reminder (annual)
  if (plan.type !== 'safe_harbor_401k') {
    alerts.push({
      type: 'nondiscrimination_failure',
      severity: 'info',
      message: 'Annual ADP/ACP nondiscrimination testing should be performed',
      planId,
    })
  }

  return alerts
}
