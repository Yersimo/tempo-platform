/**
 * Policy Engine
 *
 * Takes a typed PolicyDocument (e.g. ETI_EXPENSE_POLICY_2023) and
 * resolves it against an expense + employee context to produce:
 *   - The required signature count (1, 2, or 3+)
 *   - The required category constraints (A/B/C from §3.i, named roles
 *     for §3.i.iv)
 *   - The actual approver chain (which named employees fulfill each slot)
 *   - Policy violations and warnings
 *   - Whether auto-approval is permitted (narrowing of single-sig only)
 *
 * Designed to be policy-document-agnostic: any org can have its own
 * PolicyDocument and the engine resolves the same way. This is what
 * makes Tempo capable of encoding ETI, US GAAP, EU compliance, etc.
 *
 * Returns a structured result with reasoning at every step — never
 * a black-box decision.
 */

import type { ExtractedReceipt } from './receipt-extraction'

// ─── Type definitions for the policy document ───────────────────────

export type SignatureCategory = 'A' | 'B' | 'C'

export interface CategoryConstraint {
  /** How many signatures must fulfill this constraint */
  count: number
  /** Which signing categories are acceptable */
  allowedCategories?: SignatureCategory[]
  /** Or: which named roles are acceptable (for top-tier rules) */
  allowedRoles?: string[]
  /** Signer must have approval limit ≥ expense amount */
  requireFullLimit?: boolean
}

export interface SignatureRequirement {
  id: string
  minAmountUSD: number
  /** Exclusive upper bound. null = no upper bound */
  maxAmountUSD: number | null
  requiredSignatures: number
  categoryConstraints: CategoryConstraint[]
  reasoning: string
}

export interface DepartmentRule {
  id: string
  expenseDepartment: string // or 'ANY'
  requiredApproverDepartment?: string
  requiresDepartmentHeadFirst?: boolean
  sequencing?: 'before_general_signatures' | 'after_general_signatures'
  reasoning: string
}

export interface ReimbursementRules {
  filingWindowDays: number
  lateFilingAction: 'reject' | 'warn' | 'auto_debit'
  receiptRequiredAboveUSD: number
  perDiemsAllowed: boolean
  requiresItemizedRequest: boolean
  requiredFields: string[]
  selfApprovalAllowed: boolean
}

export interface CashAdvanceRules {
  settlementWindowDays: number
  overdueAction: 'auto_debit_salary' | 'warn'
  multipleAdvancesAllowed: boolean
  returnInSameCurrency: boolean
  maxTipPercentage: number
}

export interface TravelRules {
  requirePreTripApproval: boolean
  defaultClass: 'economy' | 'business' | 'first'
  advanceBookingDays: number
  businessClassEligibility: Array<{ role: string; anyFlight?: boolean; minFlightHours?: number }>
  firstClassEligibility: Array<{ role: string }>
  spousalTravelReimbursable: boolean
  homeLeaveAdvanceNoticeMonths: number
  requiresEBSBooking: boolean
  maxPassengersPerCar: number
  lomeToAccraCotonouRoadOnly: boolean
}

export interface TelecomRules {
  roamingEligibleRoles: string[]
  obtainLocalSimWhenAway: boolean
  maxBusinessCallsUSDPerDay: number
  personalPhoneEquipmentReimbursable: boolean
}

export interface CorporateCardRules {
  settlementWindowDays: number
  overdueAction: 'auto_debit_salary' | 'warn'
  forbidsCashAdvances: boolean
  requiresReceiptsForAll: boolean
  lateFeesReimbursable: boolean
  foreignCardFXFeesReimbursable: boolean
}

export interface MeetingsAndEventsRules {
  thresholdRequireGCFOApproval: number
  thresholdRequireDetailedRationale: number
  feeAgreementLeadTimeDays: number
}

export interface ContractRules {
  minSignatures: number
  maxContractTermYears: number
  majorExpenditureProgramThresholdUSD: number
  legalReviewRequired: boolean
}

export interface ProcurementRules {
  bidsRequiredAboveUSD: number
  minBidCount: number
  tenderRequiredAboveUSD: number
  minTenderInvitees: number
  routeThroughEBS: boolean
}

export interface AutoApprovalOverlay {
  enabled: boolean
  maxAmountUSD: number
  minAIConfidence: number
  minHistoricalApprovalRate: number
  minSimilarPriorExpenses: number
  excludedCategories: string[]
}

export interface PolicyDocument {
  id: string
  name: string
  version: string
  effectiveFrom: string // ISO date
  authority: string
  appliesTo: {
    orgIds: string[]
    description: string
  }
  signatureRequirements: SignatureRequirement[]
  departmentRules: DepartmentRule[]
  reimbursementRules: ReimbursementRules
  cashAdvanceRules: CashAdvanceRules
  travelRules: TravelRules
  telecomRules: TelecomRules
  corporateCardRules: CorporateCardRules
  meetingsAndEventsRules: MeetingsAndEventsRules
  contractRules: ContractRules
  procurementRules: ProcurementRules
  paymentCategories: Record<SignatureCategory, { label: string; description?: string; maxApprovalUSD: number | null }>
  autoApprovalOverlay: AutoApprovalOverlay
}

// ─── Employee signing authority (one row per employee per org) ─────

export interface SigningAuthority {
  employeeId: string
  fullName: string
  title: string
  department: string
  /** Group A, B, or C per Policy §12 */
  paymentCategory: SignatureCategory | null
  /** Maximum amount this employee can solo-approve (in USD cents) */
  approvalLimitUSDCents: number
  /** Named roles for top-tier policy (e.g. "GCEO", "GCFO Finance") */
  namedRoles: string[]
  /** Department head of which department (used for §3.k pre-approval) */
  departmentHeadOf: string | null
  /** Delegation valid through date — per Policy §3.h.i (max 1 year) */
  delegationValidThrough: string | null
  isActive: boolean
}

// ─── Resolution input ───────────────────────────────────────────────

export interface PolicyResolutionInput {
  expense: {
    amountUSDCents: number
    currency: string
    category: string
    vendor: string | null
    date: string
    daysAgoSubmitted: number // for filing-window check
    hasReceipt: boolean
    isCashAdvance?: boolean
    isCorporateCardCharge?: boolean
    travelDetails?: {
      bookedThroughEBS: boolean
      class: 'economy' | 'business' | 'first'
      flightHours: number | null
      isHomeLeave: boolean
      isInternational: boolean
    }
  }
  employee: {
    id: string
    fullName: string
    title: string
    department: string
    role: string
    homeCountry: string
  }
  receipt: ExtractedReceipt | null
  /** All signing authorities available in the org for resolution */
  availableSigningAuthorities: SigningAuthority[]
  /** Historical pattern for auto-approve eligibility */
  historical: {
    similarExpenseCount: number
    approvalRate: number
  }
  aiConfidence: number
}

// ─── Resolution output ──────────────────────────────────────────────

export interface PolicyViolation {
  ruleId: string
  policySection: string
  severity: 'block' | 'warn' | 'info'
  message: string
}

export interface ApproverSlot {
  slotIndex: number // 1, 2, 3...
  constraint: CategoryConstraint
  /** Resolved employee for this slot (null = no eligible approver found) */
  approver: SigningAuthority | null
  /** Alternative approvers who could also fill this slot */
  alternatives: SigningAuthority[]
}

export interface PolicyResolution {
  policyId: string
  policyVersion: string

  // Required approval chain
  approvalChain: {
    requiredSignatures: number
    slots: ApproverSlot[]
    appliedRule: SignatureRequirement
    /** Department-specific pre-approvers (e.g. HR head before general signatures) */
    preApprovers: SigningAuthority[]
  }

  // Whether the engine permits auto-approval (always a narrowing, never an expansion)
  autoApprovalEligible: boolean
  autoApprovalReason: string

  // Policy compliance check
  violations: PolicyViolation[]
  passed: boolean

  // Human-readable summary suitable for approver + audit
  summary: string
}

// ─── Core engine ────────────────────────────────────────────────────

export function resolvePolicy(
  policy: PolicyDocument,
  input: PolicyResolutionInput,
): PolicyResolution {
  const violations: PolicyViolation[] = []

  // 1. Find the applicable signature requirement by amount bracket
  const amountUSD = input.expense.amountUSDCents / 100
  const sigRule = policy.signatureRequirements.find(
    (r) =>
      amountUSD >= r.minAmountUSD &&
      (r.maxAmountUSD === null || amountUSD < r.maxAmountUSD),
  )

  if (!sigRule) {
    violations.push({
      ruleId: 'no-applicable-rule',
      policySection: 'Engine',
      severity: 'block',
      message: `No signature rule matched amount $${amountUSD}`,
    })
    return failedResolution(policy, violations)
  }

  // 2. Resolve each slot in the chain
  const slots = sigRule.categoryConstraints.flatMap((constraint) => {
    const slotsForThisConstraint: ApproverSlot[] = []
    for (let i = 0; i < constraint.count; i++) {
      const candidates = findEligibleSigners(
        constraint,
        input.expense.amountUSDCents,
        input.availableSigningAuthorities,
      )
      // Exclude employees already assigned to earlier slots and self-approval
      const taken = new Set(
        slotsForThisConstraint
          .map((s) => s.approver?.employeeId)
          .filter((id): id is string => Boolean(id)),
      )
      taken.add(input.employee.id) // §1.h — no self-approval

      const available = candidates.filter((c) => !taken.has(c.employeeId))

      slotsForThisConstraint.push({
        slotIndex: slotsForThisConstraint.length + 1,
        constraint,
        approver: available[0] ?? null,
        alternatives: available.slice(1, 4),
      })
    }
    return slotsForThisConstraint
  })

  // Re-index slot indices globally
  slots.forEach((slot, i) => {
    slot.slotIndex = i + 1
  })

  // 3. Apply department rules
  const preApprovers: SigningAuthority[] = []

  for (const deptRule of policy.departmentRules) {
    if (deptRule.requiresDepartmentHeadFirst) {
      // §3.k — find the head of this employee's department
      const deptHead = input.availableSigningAuthorities.find(
        (sa) => sa.departmentHeadOf === input.employee.department,
      )
      if (deptHead && deptHead.employeeId !== input.employee.id) {
        preApprovers.push(deptHead)
      }
    }
    if (
      deptRule.expenseDepartment === input.employee.department &&
      deptRule.requiredApproverDepartment
    ) {
      // §3.j — HR expenses need an HR signatory
      const required = input.availableSigningAuthorities.find(
        (sa) => sa.department === deptRule.requiredApproverDepartment,
      )
      if (required && !preApprovers.some((p) => p.employeeId === required.employeeId)) {
        preApprovers.push(required)
      }
    }
  }

  // 4. Validate compliance rules

  // Receipt required above threshold
  if (
    amountUSD >= policy.reimbursementRules.receiptRequiredAboveUSD &&
    !input.expense.hasReceipt
  ) {
    violations.push({
      ruleId: 'receipt-required',
      policySection: '§10.d',
      severity: 'block',
      message: `Receipt required for expenses ≥ $${policy.reimbursementRules.receiptRequiredAboveUSD}`,
    })
  }

  // Filing window
  if (input.expense.daysAgoSubmitted > policy.reimbursementRules.filingWindowDays) {
    violations.push({
      ruleId: 'late-filing',
      policySection: '§10.g',
      severity:
        policy.reimbursementRules.lateFilingAction === 'reject' ? 'block' : 'warn',
      message: `Filed ${input.expense.daysAgoSubmitted} days after expense — exceeds ${policy.reimbursementRules.filingWindowDays}-day window`,
    })
  }

  // Travel: business class eligibility
  if (input.expense.travelDetails?.class === 'business') {
    const eligible = policy.travelRules.businessClassEligibility.some((rule) => {
      if (rule.anyFlight && roleMatches(input.employee.role, rule.role)) return true
      if (
        rule.minFlightHours !== undefined &&
        roleMatches(input.employee.role, rule.role) &&
        (input.expense.travelDetails?.flightHours ?? 0) >= rule.minFlightHours
      ) {
        return true
      }
      return false
    })
    if (!eligible) {
      violations.push({
        ruleId: 'business-class-ineligible',
        policySection: '§6 Air Travel (d)',
        severity: 'warn',
        message:
          'Business class booked but role does not qualify (GEC any flight, or Group Head >4hr)',
      })
    }
  }

  // Travel: EBS booking required
  if (
    input.expense.travelDetails &&
    !input.expense.travelDetails.bookedThroughEBS &&
    policy.travelRules.requiresEBSBooking
  ) {
    violations.push({
      ruleId: 'ebs-booking-required',
      policySection: '§6.c',
      severity: 'warn',
      message: 'Travel must be booked through Ecobank Business Services (Lomé)',
    })
  }

  // Self-approval blocked
  if (slots.some((s) => s.approver?.employeeId === input.employee.id)) {
    violations.push({
      ruleId: 'self-approval',
      policySection: '§1.h',
      severity: 'block',
      message: 'Employees cannot approve their own expenses',
    })
  }

  // Empty slots: no eligible approver found
  for (const slot of slots) {
    if (!slot.approver) {
      violations.push({
        ruleId: 'no-approver',
        policySection: '§3',
        severity: 'block',
        message: `Slot ${slot.slotIndex} has no eligible approver — requires ${describeConstraint(slot.constraint)}`,
      })
    }
  }

  // 5. Auto-approval overlay (narrowing only — never expands policy)
  const autoEval = evaluateAutoApproval(policy, input, sigRule, violations)

  const passed = violations.filter((v) => v.severity === 'block').length === 0

  return {
    policyId: policy.id,
    policyVersion: policy.version,
    approvalChain: {
      requiredSignatures: sigRule.requiredSignatures,
      slots,
      appliedRule: sigRule,
      preApprovers,
    },
    autoApprovalEligible: autoEval.eligible,
    autoApprovalReason: autoEval.reason,
    violations,
    passed,
    summary: composeSummary(policy, sigRule, slots, preApprovers, autoEval, violations),
  }
}

// ─── Helper: find eligible signers for a constraint ─────────────────

function findEligibleSigners(
  constraint: CategoryConstraint,
  amountCents: number,
  authorities: SigningAuthority[],
): SigningAuthority[] {
  return authorities.filter((sa) => {
    if (!sa.isActive) return false

    // Check delegation validity
    if (sa.delegationValidThrough) {
      const valid = new Date(sa.delegationValidThrough).getTime() > Date.now()
      if (!valid) return false
    }

    // Category match
    if (constraint.allowedCategories && constraint.allowedCategories.length > 0) {
      if (!sa.paymentCategory || !constraint.allowedCategories.includes(sa.paymentCategory)) {
        return false
      }
    }

    // Named role match
    if (constraint.allowedRoles && constraint.allowedRoles.length > 0) {
      const hasRole = constraint.allowedRoles.some((r) =>
        sa.namedRoles.some((nr) => roleMatches(nr, r)),
      )
      if (!hasRole) return false
    }

    // Full-limit requirement
    if (constraint.requireFullLimit) {
      if (sa.approvalLimitUSDCents < amountCents) return false
    }

    return true
  })
}

function roleMatches(actual: string, required: string): boolean {
  return actual.toLowerCase().trim() === required.toLowerCase().trim()
}

function describeConstraint(c: CategoryConstraint): string {
  const parts: string[] = []
  if (c.allowedCategories) parts.push(`category in [${c.allowedCategories.join(', ')}]`)
  if (c.allowedRoles) parts.push(`role in [${c.allowedRoles.join(', ')}]`)
  if (c.requireFullLimit) parts.push('with full approval limit')
  return parts.join(' AND ')
}

// ─── Helper: evaluate auto-approval overlay ─────────────────────────

function evaluateAutoApproval(
  policy: PolicyDocument,
  input: PolicyResolutionInput,
  sigRule: SignatureRequirement,
  violations: PolicyViolation[],
): { eligible: boolean; reason: string } {
  const overlay = policy.autoApprovalOverlay
  const amountUSD = input.expense.amountUSDCents / 100

  if (!overlay.enabled) {
    return { eligible: false, reason: 'Auto-approval disabled at policy level.' }
  }

  // Auto-approval can only apply where policy permits single-sig
  if (sigRule.requiredSignatures > 1) {
    return {
      eligible: false,
      reason: `Policy requires ${sigRule.requiredSignatures} signatures — auto-approval narrows policy, never expands it.`,
    }
  }

  // Amount ceiling
  if (amountUSD > overlay.maxAmountUSD) {
    return {
      eligible: false,
      reason: `Amount $${amountUSD} above auto-approval ceiling $${overlay.maxAmountUSD}.`,
    }
  }

  // AI confidence
  if (input.aiConfidence < overlay.minAIConfidence) {
    return {
      eligible: false,
      reason: `AI confidence ${input.aiConfidence.toFixed(2)} below threshold ${overlay.minAIConfidence}.`,
    }
  }

  // Historical pattern
  if (input.historical.similarExpenseCount < overlay.minSimilarPriorExpenses) {
    return {
      eligible: false,
      reason: `Only ${input.historical.similarExpenseCount} similar prior expenses — need ${overlay.minSimilarPriorExpenses}.`,
    }
  }
  if (input.historical.approvalRate < overlay.minHistoricalApprovalRate) {
    return {
      eligible: false,
      reason: `Historical approval rate ${Math.round(input.historical.approvalRate * 100)}% below threshold ${Math.round(overlay.minHistoricalApprovalRate * 100)}%.`,
    }
  }

  // Excluded categories
  if (overlay.excludedCategories.includes(input.expense.category)) {
    return {
      eligible: false,
      reason: `Category "${input.expense.category}" excluded from auto-approval.`,
    }
  }

  // Any blocking violation
  if (violations.some((v) => v.severity === 'block')) {
    return { eligible: false, reason: 'Policy violation present — manual review required.' }
  }

  return {
    eligible: true,
    reason: `Within single-signature threshold (<$${overlay.maxAmountUSD}), AI confidence ${input.aiConfidence.toFixed(2)}, ${input.historical.similarExpenseCount} similar approved expenses, no violations.`,
  }
}

// ─── Helper: compose human-readable summary ──────────────────────────

function composeSummary(
  policy: PolicyDocument,
  rule: SignatureRequirement,
  slots: ApproverSlot[],
  preApprovers: SigningAuthority[],
  autoEval: { eligible: boolean; reason: string },
  violations: PolicyViolation[],
): string {
  const lines: string[] = []
  lines.push(`Policy: ${policy.name} (${policy.version})`)
  lines.push(`Applied rule: ${rule.reasoning}`)

  if (autoEval.eligible) {
    lines.push(`Auto-approval: eligible — ${autoEval.reason}`)
  } else {
    lines.push(
      `Requires ${rule.requiredSignatures} signature${rule.requiredSignatures > 1 ? 's' : ''}:`,
    )
    for (const slot of slots) {
      const approverName = slot.approver?.fullName ?? '⚠ no eligible approver'
      const constraintDesc = describeConstraint(slot.constraint)
      lines.push(`  ${slot.slotIndex}. ${approverName} — ${constraintDesc}`)
    }
    if (preApprovers.length > 0) {
      lines.push(`Pre-approval required from: ${preApprovers.map((p) => p.fullName).join(', ')}`)
    }
  }

  if (violations.length > 0) {
    lines.push('Policy notes:')
    for (const v of violations) {
      lines.push(`  ${v.severity === 'block' ? '✗' : '!'} ${v.policySection}: ${v.message}`)
    }
  }

  return lines.join('\n')
}

function failedResolution(
  policy: PolicyDocument,
  violations: PolicyViolation[],
): PolicyResolution {
  return {
    policyId: policy.id,
    policyVersion: policy.version,
    approvalChain: {
      requiredSignatures: 0,
      slots: [],
      appliedRule: {} as SignatureRequirement,
      preApprovers: [],
    },
    autoApprovalEligible: false,
    autoApprovalReason: 'Policy resolution failed.',
    violations,
    passed: false,
    summary: 'Policy resolution failed — see violations.',
  }
}
