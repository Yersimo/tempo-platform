/**
 * PEO / Co-Employment Service
 *
 * Professional Employer Organization (PEO) management engine for
 * co-employment arrangements. Handles:
 * - PEO configuration and contract management
 * - Employee enrollment and termination from PEO
 * - Workers compensation classification management
 * - Multi-state/country PEO support with FEIN tracking
 * - State unemployment insurance (SUI) rate management
 * - Admin fee calculation and invoicing
 * - Data synchronization between PEO and client company
 * - Compliance status monitoring
 * - Reporting and analytics
 */

import { db, schema } from '@/lib/db'
import { eq, and, desc, asc, inArray, gte, lte } from 'drizzle-orm'

// ============================================================
// Types & Interfaces
// ============================================================

export type PeoStatus = 'active' | 'inactive' | 'pending' | 'terminated'
export type PeoServiceType = 'full_peo' | 'aso' | 'payroll_only' | 'benefits_only' | 'compliance_only'
export type CoEmploymentStatus = 'pending' | 'active' | 'terminated' | 'transferred'

export interface PeoConfigurationInput {
  peoProviderName: string
  serviceType?: PeoServiceType
  contractStartDate: string
  contractEndDate?: string
  fein?: string
  stateRegistrations?: StateRegistration[]
  services?: string[]
  adminFeeStructure?: AdminFeeStructure
  workersCompPolicy?: WorkersCompPolicy
  payrollSchedule?: string
  primaryContactName?: string
  primaryContactEmail?: string
  primaryContactPhone?: string
  notes?: string
}

export interface StateRegistration {
  state: string
  registrationNumber: string
  suiRate: number
}

export interface AdminFeeStructure {
  type: 'per_employee' | 'percentage' | 'flat_rate'
  amount: number
  minimumFee?: number
  maximumFee?: number
}

export interface WorkersCompPolicy {
  policyNumber: string
  carrier: string
  expirationDate: string
  premiumRate?: number
}

export interface EmployeeEnrollmentInput {
  employeeId: string
  workState: string
  workCountry?: string
  workersCompCode?: string
  workersCompDescription?: string
}

export interface WorkersCompCodeInput {
  classCode: string
  description: string
  state: string
  rate: number
  effectiveDate?: string
  expirationDate?: string
}

export interface PeoComplianceStatus {
  overall: 'compliant' | 'at_risk' | 'non_compliant'
  contractStatus: string
  workersCompValid: boolean
  stateRegistrationsCurrent: boolean
  enrolledEmployeeCount: number
  pendingEnrollments: number
  issues: ComplianceIssue[]
}

export interface ComplianceIssue {
  type: 'critical' | 'warning' | 'info'
  category: string
  message: string
  actionRequired: string
}

export interface PeoReport {
  configId: string
  providerName: string
  period: string
  enrolledEmployees: number
  stateBreakdown: { state: string; count: number; suiRate: number }[]
  workersCompBreakdown: { code: string; description: string; count: number; rate: number }[]
  totalAdminFees: number
  totalWorkersCompPremium: number
  totalPayrollTaxes: number
  totalCost: number
}

// ============================================================
// Error Classes
// ============================================================

export class PeoServiceError extends Error {
  constructor(message: string, public code: string) {
    super(message)
    this.name = 'PeoServiceError'
  }
}

// ============================================================
// PEO Configuration
// ============================================================

/**
 * Set up a new PEO configuration for an organization.
 * Validates contract dates, FEIN format, and state registrations.
 */
export async function setupPeoConfiguration(
  orgId: string,
  input: PeoConfigurationInput
) {
  // Validate required fields
  if (!input.peoProviderName?.trim()) {
    throw new PeoServiceError('PEO provider name is required', 'MISSING_PROVIDER_NAME')
  }
  if (!input.contractStartDate) {
    throw new PeoServiceError('Contract start date is required', 'MISSING_START_DATE')
  }

  // Validate FEIN format (XX-XXXXXXX)
  if (input.fein && !/^\d{2}-\d{7}$/.test(input.fein)) {
    throw new PeoServiceError(
      'FEIN must be in XX-XXXXXXX format',
      'INVALID_FEIN_FORMAT'
    )
  }

  // Validate contract dates
  if (input.contractEndDate && input.contractEndDate <= input.contractStartDate) {
    throw new PeoServiceError(
      'Contract end date must be after start date',
      'INVALID_DATE_RANGE'
    )
  }

  // Validate state registrations
  if (input.stateRegistrations) {
    for (const reg of input.stateRegistrations) {
      if (!reg.state || !reg.registrationNumber) {
        throw new PeoServiceError(
          'Each state registration requires state and registration number',
          'INVALID_STATE_REGISTRATION'
        )
      }
      if (reg.suiRate < 0 || reg.suiRate > 100) {
        throw new PeoServiceError(
          `Invalid SUI rate for ${reg.state}: must be between 0 and 100`,
          'INVALID_SUI_RATE'
        )
      }
    }
  }

  // Validate admin fee structure
  if (input.adminFeeStructure) {
    const { type, amount } = input.adminFeeStructure
    if (!['per_employee', 'percentage', 'flat_rate'].includes(type)) {
      throw new PeoServiceError('Invalid admin fee type', 'INVALID_FEE_TYPE')
    }
    if (amount < 0) {
      throw new PeoServiceError('Admin fee amount cannot be negative', 'INVALID_FEE_AMOUNT')
    }
    if (type === 'percentage' && amount > 100) {
      throw new PeoServiceError('Percentage fee cannot exceed 100%', 'INVALID_FEE_PERCENTAGE')
    }
  }

  const [config] = await db.insert(schema.peoConfigurations).values({
    orgId,
    peoProviderName: input.peoProviderName.trim(),
    serviceType: input.serviceType || 'full_peo',
    contractStartDate: input.contractStartDate,
    contractEndDate: input.contractEndDate || null,
    fein: input.fein || null,
    stateRegistrations: input.stateRegistrations || null,
    services: input.services || null,
    adminFeeStructure: input.adminFeeStructure || null,
    workersCompPolicy: input.workersCompPolicy || null,
    payrollSchedule: input.payrollSchedule || null,
    primaryContactName: input.primaryContactName || null,
    primaryContactEmail: input.primaryContactEmail || null,
    primaryContactPhone: input.primaryContactPhone || null,
    notes: input.notes || null,
    status: 'pending',
  }).returning()

  return config
}

/**
 * Enroll an employee in the PEO co-employment arrangement.
 * Validates workers comp classification and state eligibility.
 */
export async function enrollEmployee(
  orgId: string,
  peoConfigId: string,
  input: EmployeeEnrollmentInput
) {
  // Validate PEO config exists and is active
  const configs = await db.select()
    .from(schema.peoConfigurations)
    .where(and(
      eq(schema.peoConfigurations.id, peoConfigId),
      eq(schema.peoConfigurations.orgId, orgId)
    ))

  const config = configs[0]
  if (!config) {
    throw new PeoServiceError('PEO configuration not found', 'CONFIG_NOT_FOUND')
  }
  if (config.status !== 'active' && config.status !== 'pending') {
    throw new PeoServiceError(
      `Cannot enroll employees when PEO is in ${config.status} status`,
      'PEO_NOT_ACTIVE'
    )
  }

  // Check if employee exists
  const employees = await db.select()
    .from(schema.employees)
    .where(and(
      eq(schema.employees.id, input.employeeId),
      eq(schema.employees.orgId, orgId)
    ))

  if (!employees.length) {
    throw new PeoServiceError('Employee not found', 'EMPLOYEE_NOT_FOUND')
  }

  // Check for existing active enrollment
  const existingEnrollment = await db.select()
    .from(schema.peoEmployeeEnrollments)
    .where(and(
      eq(schema.peoEmployeeEnrollments.employeeId, input.employeeId),
      eq(schema.peoEmployeeEnrollments.orgId, orgId),
      eq(schema.peoEmployeeEnrollments.status, 'active')
    ))

  if (existingEnrollment.length > 0) {
    throw new PeoServiceError(
      'Employee is already enrolled in a PEO arrangement',
      'ALREADY_ENROLLED'
    )
  }

  // Validate state registration
  const stateRegistrations = (config.stateRegistrations as StateRegistration[]) || []
  if (input.workState && stateRegistrations.length > 0) {
    const hasStateReg = stateRegistrations.some(
      reg => reg.state.toUpperCase() === input.workState.toUpperCase()
    )
    if (!hasStateReg) {
      throw new PeoServiceError(
        `PEO is not registered in state: ${input.workState}`,
        'STATE_NOT_REGISTERED'
      )
    }
  }

  // Validate workers comp code if provided
  if (input.workersCompCode) {
    const wcCodes = await db.select()
      .from(schema.peoWorkersCompCodes)
      .where(and(
        eq(schema.peoWorkersCompCodes.peoConfigId, peoConfigId),
        eq(schema.peoWorkersCompCodes.classCode, input.workersCompCode),
        eq(schema.peoWorkersCompCodes.isActive, true)
      ))

    if (wcCodes.length === 0) {
      throw new PeoServiceError(
        `Workers comp code ${input.workersCompCode} not found or inactive`,
        'INVALID_WC_CODE'
      )
    }
  }

  // Generate PEO employee ID
  const peoEmployeeId = `PEO-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`

  const [enrollment] = await db.insert(schema.peoEmployeeEnrollments).values({
    orgId,
    peoConfigId,
    employeeId: input.employeeId,
    status: 'active',
    workState: input.workState || null,
    workCountry: input.workCountry || 'US',
    workersCompCode: input.workersCompCode || null,
    workersCompDescription: input.workersCompDescription || null,
    enrolledAt: new Date(),
    peoEmployeeId,
    syncStatus: 'pending',
  }).returning()

  return enrollment
}

/**
 * Terminate co-employment for an employee.
 * Records termination reason and date.
 */
export async function terminateCoEmployment(
  orgId: string,
  enrollmentId: string,
  reason: string
) {
  if (!reason?.trim()) {
    throw new PeoServiceError('Termination reason is required', 'MISSING_REASON')
  }

  const enrollments = await db.select()
    .from(schema.peoEmployeeEnrollments)
    .where(and(
      eq(schema.peoEmployeeEnrollments.id, enrollmentId),
      eq(schema.peoEmployeeEnrollments.orgId, orgId)
    ))

  const enrollment = enrollments[0]
  if (!enrollment) {
    throw new PeoServiceError('Enrollment not found', 'ENROLLMENT_NOT_FOUND')
  }
  if (enrollment.status === 'terminated') {
    throw new PeoServiceError('Enrollment is already terminated', 'ALREADY_TERMINATED')
  }

  const now = new Date()
  const [updated] = await db.update(schema.peoEmployeeEnrollments)
    .set({
      status: 'terminated',
      terminatedAt: now,
      terminationReason: reason.trim(),
      updatedAt: now,
    })
    .where(eq(schema.peoEmployeeEnrollments.id, enrollmentId))
    .returning()

  return updated
}

/**
 * Sync employee data between the client company and PEO.
 * Updates sync status and timestamps.
 */
export async function syncPeoData(
  orgId: string,
  peoConfigId: string,
  syncType: 'full' | 'incremental' = 'incremental'
) {
  // Get the PEO config
  const configs = await db.select()
    .from(schema.peoConfigurations)
    .where(and(
      eq(schema.peoConfigurations.id, peoConfigId),
      eq(schema.peoConfigurations.orgId, orgId)
    ))

  const config = configs[0]
  if (!config) {
    throw new PeoServiceError('PEO configuration not found', 'CONFIG_NOT_FOUND')
  }

  // Get all active enrollments for this PEO
  const enrollments = await db.select({
    enrollment: schema.peoEmployeeEnrollments,
    employee: schema.employees,
  })
    .from(schema.peoEmployeeEnrollments)
    .leftJoin(schema.employees, eq(schema.peoEmployeeEnrollments.employeeId, schema.employees.id))
    .where(and(
      eq(schema.peoEmployeeEnrollments.peoConfigId, peoConfigId),
      eq(schema.peoEmployeeEnrollments.orgId, orgId),
      eq(schema.peoEmployeeEnrollments.status, 'active')
    ))

  const now = new Date()
  const syncResults = {
    totalRecords: enrollments.length,
    synced: 0,
    failed: 0,
    errors: [] as string[],
  }

  // Process each enrollment
  for (const { enrollment, employee } of enrollments) {
    try {
      // In production, this would call the PEO provider's API
      // For now, we simulate the sync by updating sync status
      const needsSync = syncType === 'full' ||
        !enrollment.lastSyncAt ||
        (employee?.updatedAt && employee.updatedAt > (enrollment.lastSyncAt || new Date(0)))

      if (needsSync) {
        await db.update(schema.peoEmployeeEnrollments)
          .set({
            syncStatus: 'synced',
            lastSyncAt: now,
            updatedAt: now,
            metadata: {
              ...(enrollment.metadata as Record<string, unknown> || {}),
              lastSyncType: syncType,
              lastSyncFields: ['demographics', 'compensation', 'benefits', 'tax_info'],
            },
          })
          .where(eq(schema.peoEmployeeEnrollments.id, enrollment.id))

        syncResults.synced++
      }
    } catch (err) {
      syncResults.failed++
      syncResults.errors.push(
        `Failed to sync employee ${enrollment.employeeId}: ${err instanceof Error ? err.message : 'Unknown error'}`
      )
    }
  }

  return {
    configId: peoConfigId,
    syncType,
    syncedAt: now.toISOString(),
    results: syncResults,
  }
}

/**
 * Get all workers compensation codes for a PEO configuration.
 * Optionally filter by state.
 */
export async function getWorkersCompCodes(
  orgId: string,
  peoConfigId: string,
  state?: string
) {
  const conditions = [
    eq(schema.peoWorkersCompCodes.peoConfigId, peoConfigId),
    eq(schema.peoWorkersCompCodes.orgId, orgId),
  ]

  if (state) {
    conditions.push(eq(schema.peoWorkersCompCodes.state, state.toUpperCase()))
  }

  const codes = await db.select()
    .from(schema.peoWorkersCompCodes)
    .where(and(...conditions))
    .orderBy(asc(schema.peoWorkersCompCodes.classCode))

  return { codes, total: codes.length }
}

/**
 * Get comprehensive PEO compliance status.
 * Checks contract validity, workers comp coverage, and state registrations.
 */
export async function getPeoComplianceStatus(
  orgId: string,
  peoConfigId: string
): Promise<PeoComplianceStatus> {
  const configs = await db.select()
    .from(schema.peoConfigurations)
    .where(and(
      eq(schema.peoConfigurations.id, peoConfigId),
      eq(schema.peoConfigurations.orgId, orgId)
    ))

  const config = configs[0]
  if (!config) {
    throw new PeoServiceError('PEO configuration not found', 'CONFIG_NOT_FOUND')
  }

  const today = new Date().toISOString().split('T')[0]
  const issues: ComplianceIssue[] = []

  // Check contract status
  let contractStatus = 'active'
  if (config.contractEndDate && config.contractEndDate < today) {
    contractStatus = 'expired'
    issues.push({
      type: 'critical',
      category: 'contract',
      message: `PEO contract expired on ${config.contractEndDate}`,
      actionRequired: 'Renew the PEO contract immediately',
    })
  } else if (config.contractEndDate) {
    const daysUntilExpiry = Math.floor(
      (new Date(config.contractEndDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    )
    if (daysUntilExpiry <= 30) {
      issues.push({
        type: 'warning',
        category: 'contract',
        message: `PEO contract expires in ${daysUntilExpiry} days`,
        actionRequired: 'Begin contract renewal process',
      })
    }
  }

  // Check workers comp policy
  const wcPolicy = config.workersCompPolicy as WorkersCompPolicy | null
  let workersCompValid = true
  if (!wcPolicy) {
    workersCompValid = false
    issues.push({
      type: 'critical',
      category: 'workers_comp',
      message: 'No workers compensation policy configured',
      actionRequired: 'Configure workers compensation policy',
    })
  } else if (wcPolicy.expirationDate && wcPolicy.expirationDate < today) {
    workersCompValid = false
    issues.push({
      type: 'critical',
      category: 'workers_comp',
      message: `Workers comp policy expired on ${wcPolicy.expirationDate}`,
      actionRequired: 'Renew workers compensation policy',
    })
  }

  // Check FEIN
  if (!config.fein) {
    issues.push({
      type: 'warning',
      category: 'tax',
      message: 'No FEIN (Federal Employer Identification Number) configured',
      actionRequired: 'Add FEIN to PEO configuration',
    })
  }

  // Check state registrations coverage
  const stateRegs = (config.stateRegistrations as StateRegistration[]) || []
  const stateRegistrationsCurrent = stateRegs.length > 0

  if (!stateRegistrationsCurrent) {
    issues.push({
      type: 'warning',
      category: 'state_registration',
      message: 'No state registrations configured',
      actionRequired: 'Add state registrations for all operating states',
    })
  }

  // Get enrollment counts
  const enrollments = await db.select()
    .from(schema.peoEmployeeEnrollments)
    .where(and(
      eq(schema.peoEmployeeEnrollments.peoConfigId, peoConfigId),
      eq(schema.peoEmployeeEnrollments.orgId, orgId)
    ))

  const activeEnrollments = enrollments.filter(e => e.status === 'active')
  const pendingEnrollments = enrollments.filter(e => e.status === 'pending')

  // Check for employees in unregistered states
  for (const enrollment of activeEnrollments) {
    if (enrollment.workState && stateRegs.length > 0) {
      const hasReg = stateRegs.some(
        r => r.state.toUpperCase() === (enrollment.workState || '').toUpperCase()
      )
      if (!hasReg) {
        issues.push({
          type: 'critical',
          category: 'state_registration',
          message: `Employee enrolled in unregistered state: ${enrollment.workState}`,
          actionRequired: `Register PEO in ${enrollment.workState} or transfer employee`,
        })
      }
    }
  }

  // Determine overall compliance level
  const hasCritical = issues.some(i => i.type === 'critical')
  const hasWarning = issues.some(i => i.type === 'warning')
  const overall = hasCritical ? 'non_compliant' : hasWarning ? 'at_risk' : 'compliant'

  return {
    overall,
    contractStatus,
    workersCompValid,
    stateRegistrationsCurrent,
    enrolledEmployeeCount: activeEnrollments.length,
    pendingEnrollments: pendingEnrollments.length,
    issues,
  }
}

/**
 * Generate a comprehensive PEO report for a given period.
 * Includes employee counts, cost breakdowns, and state/WC distributions.
 */
export async function generatePeoReport(
  orgId: string,
  peoConfigId: string,
  period: string
): Promise<PeoReport> {
  const configs = await db.select()
    .from(schema.peoConfigurations)
    .where(and(
      eq(schema.peoConfigurations.id, peoConfigId),
      eq(schema.peoConfigurations.orgId, orgId)
    ))

  const config = configs[0]
  if (!config) {
    throw new PeoServiceError('PEO configuration not found', 'CONFIG_NOT_FOUND')
  }

  // Get active enrollments with employee data
  const enrollments = await db.select({
    enrollment: schema.peoEmployeeEnrollments,
    employee: schema.employees,
  })
    .from(schema.peoEmployeeEnrollments)
    .leftJoin(schema.employees, eq(schema.peoEmployeeEnrollments.employeeId, schema.employees.id))
    .where(and(
      eq(schema.peoEmployeeEnrollments.peoConfigId, peoConfigId),
      eq(schema.peoEmployeeEnrollments.orgId, orgId),
      eq(schema.peoEmployeeEnrollments.status, 'active')
    ))

  // State breakdown
  const stateMap = new Map<string, { count: number; suiRate: number }>()
  const stateRegistrations = (config.stateRegistrations as StateRegistration[]) || []

  for (const { enrollment } of enrollments) {
    const state = enrollment.workState || 'Unknown'
    const existing = stateMap.get(state) || { count: 0, suiRate: 0 }
    existing.count++

    // Find SUI rate for this state
    const reg = stateRegistrations.find(r => r.state.toUpperCase() === state.toUpperCase())
    if (reg) existing.suiRate = reg.suiRate

    stateMap.set(state, existing)
  }

  const stateBreakdown = Array.from(stateMap.entries()).map(([state, data]) => ({
    state,
    count: data.count,
    suiRate: data.suiRate,
  }))

  // Workers comp breakdown
  const wcCodes = await db.select()
    .from(schema.peoWorkersCompCodes)
    .where(and(
      eq(schema.peoWorkersCompCodes.peoConfigId, peoConfigId),
      eq(schema.peoWorkersCompCodes.isActive, true)
    ))

  const wcMap = new Map<string, { code: string; description: string; count: number; rate: number }>()
  for (const { enrollment } of enrollments) {
    const code = enrollment.workersCompCode || 'Unclassified'
    const wcCode = wcCodes.find(wc => wc.classCode === code)
    const existing = wcMap.get(code) || {
      code,
      description: wcCode?.description || enrollment.workersCompDescription || 'N/A',
      count: 0,
      rate: wcCode?.rate || 0,
    }
    existing.count++
    wcMap.set(code, existing)
  }

  const workersCompBreakdown = Array.from(wcMap.values())

  // Calculate costs
  const adminFee = config.adminFeeStructure as AdminFeeStructure | null
  let totalAdminFees = 0
  if (adminFee) {
    if (adminFee.type === 'per_employee') {
      totalAdminFees = adminFee.amount * enrollments.length
    } else if (adminFee.type === 'flat_rate') {
      totalAdminFees = adminFee.amount
    }
    // Apply min/max
    if (adminFee.minimumFee && totalAdminFees < adminFee.minimumFee) {
      totalAdminFees = adminFee.minimumFee
    }
    if (adminFee.maximumFee && totalAdminFees > adminFee.maximumFee) {
      totalAdminFees = adminFee.maximumFee
    }
  }

  // Estimate workers comp premium (simplified)
  const totalWorkersCompPremium = workersCompBreakdown.reduce((sum, wc) => {
    return sum + (wc.rate * wc.count * 100) // simplified per-employee premium estimate
  }, 0)

  // Estimate payroll taxes
  const totalPayrollTaxes = enrollments.length * 500 // simplified estimate

  return {
    configId: peoConfigId,
    providerName: config.peoProviderName,
    period,
    enrolledEmployees: enrollments.length,
    stateBreakdown,
    workersCompBreakdown,
    totalAdminFees: Math.round(totalAdminFees * 100) / 100,
    totalWorkersCompPremium: Math.round(totalWorkersCompPremium * 100) / 100,
    totalPayrollTaxes,
    totalCost: Math.round((totalAdminFees + totalWorkersCompPremium + totalPayrollTaxes) * 100) / 100,
  }
}

/**
 * Manage PEO services - activate, deactivate, or update enabled services.
 */
export async function managePeoServices(
  orgId: string,
  peoConfigId: string,
  action: 'activate' | 'deactivate' | 'update_services',
  services?: string[]
) {
  const configs = await db.select()
    .from(schema.peoConfigurations)
    .where(and(
      eq(schema.peoConfigurations.id, peoConfigId),
      eq(schema.peoConfigurations.orgId, orgId)
    ))

  const config = configs[0]
  if (!config) {
    throw new PeoServiceError('PEO configuration not found', 'CONFIG_NOT_FOUND')
  }

  const now = new Date()
  let updates: Record<string, unknown> = { updatedAt: now }

  switch (action) {
    case 'activate':
      if (config.status === 'terminated') {
        throw new PeoServiceError('Cannot activate a terminated PEO', 'PEO_TERMINATED')
      }
      updates.status = 'active'
      break

    case 'deactivate':
      updates.status = 'inactive'
      break

    case 'update_services':
      if (!services) {
        throw new PeoServiceError('Services list is required for update_services action', 'MISSING_SERVICES')
      }
      updates.services = services
      break
  }

  const [updated] = await db.update(schema.peoConfigurations)
    .set(updates)
    .where(eq(schema.peoConfigurations.id, peoConfigId))
    .returning()

  return updated
}

/**
 * Calculate admin fees for a PEO configuration based on the current enrollment.
 */
export async function calculateAdminFees(
  orgId: string,
  peoConfigId: string,
  period: string
) {
  const configs = await db.select()
    .from(schema.peoConfigurations)
    .where(and(
      eq(schema.peoConfigurations.id, peoConfigId),
      eq(schema.peoConfigurations.orgId, orgId)
    ))

  const config = configs[0]
  if (!config) {
    throw new PeoServiceError('PEO configuration not found', 'CONFIG_NOT_FOUND')
  }

  const adminFee = config.adminFeeStructure as AdminFeeStructure | null
  if (!adminFee) {
    return {
      configId: peoConfigId,
      period,
      feeType: 'none',
      enrolledCount: 0,
      calculatedFee: 0,
      message: 'No admin fee structure configured',
    }
  }

  // Count active enrollments
  const enrollments = await db.select()
    .from(schema.peoEmployeeEnrollments)
    .where(and(
      eq(schema.peoEmployeeEnrollments.peoConfigId, peoConfigId),
      eq(schema.peoEmployeeEnrollments.orgId, orgId),
      eq(schema.peoEmployeeEnrollments.status, 'active')
    ))

  const enrolledCount = enrollments.length
  let calculatedFee = 0

  switch (adminFee.type) {
    case 'per_employee':
      calculatedFee = adminFee.amount * enrolledCount
      break
    case 'flat_rate':
      calculatedFee = adminFee.amount
      break
    case 'percentage':
      // Would need payroll total to calculate; use estimate
      calculatedFee = adminFee.amount // placeholder
      break
  }

  // Apply min/max
  if (adminFee.minimumFee && calculatedFee < adminFee.minimumFee) {
    calculatedFee = adminFee.minimumFee
  }
  if (adminFee.maximumFee && calculatedFee > adminFee.maximumFee) {
    calculatedFee = adminFee.maximumFee
  }

  return {
    configId: peoConfigId,
    period,
    feeType: adminFee.type,
    feeRate: adminFee.amount,
    enrolledCount,
    calculatedFee: Math.round(calculatedFee * 100) / 100,
    minimumFee: adminFee.minimumFee || null,
    maximumFee: adminFee.maximumFee || null,
  }
}

/**
 * List PEO configurations for an organization.
 */
export async function listPeoConfigurations(
  orgId: string,
  filters?: { status?: PeoStatus }
) {
  const conditions = [eq(schema.peoConfigurations.orgId, orgId)]
  if (filters?.status) {
    conditions.push(eq(schema.peoConfigurations.status, filters.status))
  }

  const configs = await db.select()
    .from(schema.peoConfigurations)
    .where(and(...conditions))
    .orderBy(desc(schema.peoConfigurations.createdAt))

  // Get enrollment counts for each config
  const configsWithCounts = await Promise.all(
    configs.map(async config => {
      const enrollments = await db.select()
        .from(schema.peoEmployeeEnrollments)
        .where(and(
          eq(schema.peoEmployeeEnrollments.peoConfigId, config.id),
          eq(schema.peoEmployeeEnrollments.status, 'active')
        ))

      return {
        ...config,
        activeEnrollments: enrollments.length,
      }
    })
  )

  return { configurations: configsWithCounts, total: configs.length }
}

/**
 * Add a workers compensation code to a PEO configuration.
 */
export async function addWorkersCompCode(
  orgId: string,
  peoConfigId: string,
  input: WorkersCompCodeInput
) {
  if (!input.classCode?.trim() || !input.description?.trim()) {
    throw new PeoServiceError(
      'Class code and description are required',
      'MISSING_WC_FIELDS'
    )
  }

  const [code] = await db.insert(schema.peoWorkersCompCodes).values({
    orgId,
    peoConfigId,
    classCode: input.classCode.trim(),
    description: input.description.trim(),
    state: input.state.toUpperCase(),
    rate: input.rate,
    effectiveDate: input.effectiveDate || null,
    expirationDate: input.expirationDate || null,
    isActive: true,
  }).returning()

  return code
}
