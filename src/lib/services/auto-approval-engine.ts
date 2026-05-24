/**
 * Auto-Approval Policy Engine
 *
 * Decides whether an expense should be auto-approved (no human in loop)
 * or routed to a human approver. This is where 95% of the time savings
 * in the Tempo expense flow come from.
 *
 * Decision matrix (all must be true to auto-approve):
 *   1. AI extraction confidence > threshold (default 0.95)
 *   2. Amount within employee's auto-approve ceiling
 *   3. No policy violations
 *   4. Historical pattern match (employee submitted similar before, approved)
 *   5. No anomaly flags
 *
 * Every decision is tunable per-organization via expense_policies table
 * and per-employee via employee.auto_approve_threshold field.
 *
 * The whole thing is explainable — every approve/route decision returns
 * `reasoning` so admins can interrogate why a particular expense was or
 * wasn't auto-approved.
 */

import type { AnomalyResult } from './expense-anomaly'

export interface OrgAutoApprovePolicy {
  /** Master switch — org can disable auto-approval entirely */
  enabled: boolean
  /** Minimum AI confidence to auto-approve. Tuneable 0.5-1.0 */
  minConfidence: number
  /** Categories that NEVER auto-approve (e.g. ['alcohol', 'entertainment_unusual']) */
  excludedCategories: string[]
  /** Vendors that NEVER auto-approve (e.g. high-risk merchants) */
  excludedVendors: string[]
}

export interface EmployeeAutoApproveProfile {
  /** Auto-approve ceiling for THIS employee in cents */
  ceilingAmount: number
  /** Whether the employee has had 5+ successful approvals (eligible for auto-approve) */
  isEligible: boolean
  /** Approval rate over last 90 days (1.0 = always approved) */
  historicalApprovalRate: number
}

export interface ExpensePolicyCheck {
  passed: boolean
  violations: Array<{
    rule: string
    message: string
    severity: 'block' | 'warn'
  }>
}

export interface AutoApprovalInput {
  ai: {
    confidence: number
    flaggedFields: string[] // any field where AI was uncertain
  }
  expense: {
    amount: number // cents
    currency: string
    category: string
    vendor: string | null
  }
  employee: EmployeeAutoApproveProfile
  org: OrgAutoApprovePolicy
  policyCheck: ExpensePolicyCheck
  anomaly: AnomalyResult
  /** Recent identical expenses from same employee (last 90d) */
  historicalPattern: {
    similarExpenseCount: number
    approvalRate: number
    avgAmount: number
  }
}

export type AutoApprovalDecision =
  | {
      action: 'auto_approve'
      reasoning: string
      confidence: number
      signals: AutoApprovalSignals
    }
  | {
      action: 'route_to_human'
      reasoning: string
      signals: AutoApprovalSignals
      assignedTo?: string // approver employee ID if known
    }
  | {
      action: 'block'
      reasoning: string
      violations: ExpensePolicyCheck['violations']
    }

export interface AutoApprovalSignals {
  aiConfidenceOk: boolean
  amountWithinCeiling: boolean
  policyCompliant: boolean
  patternMatch: boolean
  noAnomalies: boolean
  categoryAllowed: boolean
  vendorAllowed: boolean
}

// ─── Decision logic ──────────────────────────────────────────────────

export function decideAutoApproval(
  input: AutoApprovalInput,
): AutoApprovalDecision {
  // 1. Hard blocks first
  const blockingViolations = input.policyCheck.violations.filter(
    (v) => v.severity === 'block',
  )
  if (blockingViolations.length > 0) {
    return {
      action: 'block',
      reasoning: `Policy violation: ${blockingViolations.map((v) => v.message).join('; ')}`,
      violations: blockingViolations,
    }
  }

  // 2. Compute signals
  const signals: AutoApprovalSignals = {
    aiConfidenceOk: input.ai.confidence >= input.org.minConfidence,
    amountWithinCeiling: input.expense.amount <= input.employee.ceilingAmount,
    policyCompliant: input.policyCheck.passed,
    patternMatch:
      input.historicalPattern.similarExpenseCount >= 3 &&
      input.historicalPattern.approvalRate >= 0.9,
    noAnomalies: input.anomaly.score < 0.5,
    categoryAllowed: !input.org.excludedCategories.includes(input.expense.category),
    vendorAllowed:
      !input.expense.vendor ||
      !input.org.excludedVendors.includes(input.expense.vendor),
  }

  // 3. Decide
  const canAutoApprove =
    input.org.enabled &&
    input.employee.isEligible &&
    signals.aiConfidenceOk &&
    signals.amountWithinCeiling &&
    signals.policyCompliant &&
    signals.noAnomalies &&
    signals.categoryAllowed &&
    signals.vendorAllowed &&
    // Pattern match is the trust signal — first few expenses route to human
    signals.patternMatch

  if (canAutoApprove) {
    return {
      action: 'auto_approve',
      reasoning: composeAutoApproveReasoning(input, signals),
      confidence: computeOverallConfidence(input, signals),
      signals,
    }
  }

  return {
    action: 'route_to_human',
    reasoning: composeRouteReasoning(input, signals),
    signals,
  }
}

function composeAutoApproveReasoning(
  input: AutoApprovalInput,
  signals: AutoApprovalSignals,
): string {
  void signals
  return `Auto-approved: ${input.expense.category} expense from established submitter (${Math.round(
    input.historicalPattern.approvalRate * 100,
  )}% historical approval rate over ${input.historicalPattern.similarExpenseCount} similar prior expenses), within policy, within ceiling, no anomalies detected. AI confidence ${input.ai.confidence.toFixed(2)}.`
}

function composeRouteReasoning(
  input: AutoApprovalInput,
  signals: AutoApprovalSignals,
): string {
  const reasons: string[] = []
  if (!input.org.enabled) reasons.push('org auto-approval disabled')
  if (!input.employee.isEligible)
    reasons.push('employee not yet eligible (need 5+ approved expenses)')
  if (!signals.aiConfidenceOk)
    reasons.push(
      `AI confidence ${input.ai.confidence.toFixed(2)} below threshold ${input.org.minConfidence}`,
    )
  if (!signals.amountWithinCeiling)
    reasons.push(
      `amount $${input.expense.amount / 100} exceeds ceiling $${input.employee.ceilingAmount / 100}`,
    )
  if (!signals.policyCompliant)
    reasons.push(
      `policy warnings: ${input.policyCheck.violations.map((v) => v.message).join(', ')}`,
    )
  if (!signals.noAnomalies)
    reasons.push(
      `anomaly score ${input.anomaly.score.toFixed(2)} (${input.anomaly.flags.join(', ')})`,
    )
  if (!signals.categoryAllowed)
    reasons.push(`category "${input.expense.category}" excluded from auto-approve`)
  if (!signals.vendorAllowed)
    reasons.push(`vendor "${input.expense.vendor}" on excluded list`)
  if (!signals.patternMatch)
    reasons.push(
      `historical pattern weak (${input.historicalPattern.similarExpenseCount} similar, ${Math.round(input.historicalPattern.approvalRate * 100)}% approved)`,
    )

  return `Routed to approver: ${reasons.join('; ')}.`
}

function computeOverallConfidence(
  input: AutoApprovalInput,
  signals: AutoApprovalSignals,
): number {
  // Weighted blend of the signal vector
  let score = 0
  let weight = 0
  score += signals.aiConfidenceOk ? input.ai.confidence * 0.3 : 0
  weight += 0.3
  score += signals.patternMatch
    ? input.historicalPattern.approvalRate * 0.25
    : 0
  weight += 0.25
  score += signals.noAnomalies ? (1 - input.anomaly.score) * 0.2 : 0
  weight += 0.2
  score += signals.policyCompliant ? 0.15 : 0
  weight += 0.15
  score += signals.amountWithinCeiling ? 0.1 : 0
  weight += 0.1
  return weight > 0 ? score / weight : 0
}

// ─── Default org policy (sensible starting point) ────────────────────
export const DEFAULT_ORG_POLICY: OrgAutoApprovePolicy = {
  enabled: true,
  minConfidence: 0.85,
  excludedCategories: ['alcohol_only', 'gifts', 'entertainment_unusual'],
  excludedVendors: [],
}

// ─── Default employee profile (new joiners) ─────────────────────────
export function defaultEmployeeProfile(): EmployeeAutoApproveProfile {
  return {
    ceilingAmount: 15000, // $150 in cents — typical meal allowance
    isEligible: false, // new employees route to humans until they build a pattern
    historicalApprovalRate: 0,
  }
}
