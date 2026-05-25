/**
 * Ecobank Compensation Policy — encoding
 *
 * Captures the comp-cycle rules ETI applies for merit increases,
 * promotion-bands, equity grants, and off-cycle adjustments. Built on
 * the same Policy Engine shape as eti-expense-policy.
 *
 * Source: ETI Compensation Manual (composite from public Group HR
 * guidance + the expense policy's authority/signature framework, since
 * the same approval matrix governs comp decisions per §3.j).
 */

import type {
  PolicyDocument,
  SignatureRequirement,
} from '@/lib/services/policy-engine'

export interface CompPolicyDocument {
  id: string
  name: string
  version: string
  effectiveFrom: string
  authority: string
  /** Annual merit increase guardrails per band */
  meritIncreaseBands: Array<{
    band: 'Junior' | 'Mid' | 'Senior' | 'Manager' | 'Director' | 'Executive'
    minIncreasePct: number
    maxIncreasePct: number
    targetIncreasePct: number
    requiresGCFOFinanceAbovePct: number
  }>
  /** Promotion approval rules */
  promotionRules: {
    requiresWrittenCase: boolean
    requiresPerformanceRating: 'meets' | 'exceeds' | 'top'
    requiresTenureMonths: number
    cooldownMonths: number // can't be promoted twice within
    minIncreasePct: number
    maxIncreasePct: number
  }
  /** Equity grant rules — for executives and GEC */
  equityRules: {
    eligibleLevels: string[]
    requiresBoardApproval: boolean
    vestingMonths: number
    cliffMonths: number
  }
  /** Off-cycle adjustments — flight risk, market correction, role change */
  offCycleRules: {
    requiresWrittenJustification: boolean
    maxAdjustmentPct: number
    cooldownMonths: number
    requiresGCFOFinanceAbovePct: number
    flightRiskAllowed: boolean
    marketCorrectionAllowed: boolean
  }
  /** Equity-check rules — pay equity audit */
  equityAuditRules: {
    runFrequencyMonths: number
    flagThresholdPct: number // flag if pay gap > this %
    correctionDeadlineMonths: number
  }
  /** Same signature matrix as expense policy (delegated authority) */
  signatureRequirements: SignatureRequirement[]
}

// ─── ETI Compensation Policy 2026 ───────────────────────────────────

export const ETI_COMP_POLICY_2026: CompPolicyDocument = {
  id: 'eti-comp-2026',
  name: 'ETI Compensation Policy',
  version: '2026-final',
  effectiveFrom: '2026-01-01',
  authority: 'Group HR + Group Finance',

  // Annual merit bands
  meritIncreaseBands: [
    { band: 'Junior',    minIncreasePct: 0, maxIncreasePct: 12, targetIncreasePct: 5,  requiresGCFOFinanceAbovePct: 10 },
    { band: 'Mid',       minIncreasePct: 0, maxIncreasePct: 12, targetIncreasePct: 5,  requiresGCFOFinanceAbovePct: 10 },
    { band: 'Senior',    minIncreasePct: 0, maxIncreasePct: 10, targetIncreasePct: 4,  requiresGCFOFinanceAbovePct: 8  },
    { band: 'Manager',   minIncreasePct: 0, maxIncreasePct: 10, targetIncreasePct: 4,  requiresGCFOFinanceAbovePct: 8  },
    { band: 'Director',  minIncreasePct: 0, maxIncreasePct: 8,  targetIncreasePct: 3.5, requiresGCFOFinanceAbovePct: 6  },
    { band: 'Executive', minIncreasePct: 0, maxIncreasePct: 6,  targetIncreasePct: 3,   requiresGCFOFinanceAbovePct: 5  },
  ],

  promotionRules: {
    requiresWrittenCase: true,
    requiresPerformanceRating: 'exceeds',
    requiresTenureMonths: 12,
    cooldownMonths: 18,
    minIncreasePct: 5,
    maxIncreasePct: 25,
  },

  equityRules: {
    eligibleLevels: ['Director', 'Executive'],
    requiresBoardApproval: true,
    vestingMonths: 48,
    cliffMonths: 12,
  },

  offCycleRules: {
    requiresWrittenJustification: true,
    maxAdjustmentPct: 15,
    cooldownMonths: 12,
    requiresGCFOFinanceAbovePct: 10,
    flightRiskAllowed: true,
    marketCorrectionAllowed: true,
  },

  equityAuditRules: {
    runFrequencyMonths: 6,
    flagThresholdPct: 5,
    correctionDeadlineMonths: 3,
  },

  // Mirrors the expense policy signature matrix exactly — same delegated authority
  signatureRequirements: [
    {
      id: 'comp-single-sig-below-5pct',
      minAmountUSD: 0,
      maxAmountUSD: 0, // not amount-based; applied conceptually
      requiredSignatures: 1,
      categoryConstraints: [{ count: 1, allowedCategories: ['A', 'B'] }],
      reasoning: 'Comp Policy §2.a — Manager can approve target merit (≤5%) for own direct reports.',
    },
    {
      id: 'comp-two-sig-above-target',
      minAmountUSD: 0,
      maxAmountUSD: 0,
      requiredSignatures: 2,
      categoryConstraints: [
        { count: 1, allowedRoles: ['GE Human Resources'] },
        { count: 1, allowedCategories: ['A'] },
      ],
      reasoning: 'Comp Policy §2.b — Above-target merit (>5%) requires GE HR + line manager Group Head.',
    },
    {
      id: 'comp-promotion',
      minAmountUSD: 0,
      maxAmountUSD: 0,
      requiredSignatures: 3,
      categoryConstraints: [
        { count: 1, allowedRoles: ['GE Human Resources'] },
        { count: 1, allowedRoles: ['GCFO Finance'] },
        { count: 1, allowedCategories: ['A'] },
      ],
      reasoning: 'Comp Policy §3 — Promotions require GE HR + GCFO Finance + dept head Group Head.',
    },
  ],
}

// ─── Helper: classify a proposed comp change → applicable rule ──────

export type CompChangeType =
  | 'merit'
  | 'promotion'
  | 'off_cycle'
  | 'equity_grant'
  | 'market_correction'
  | 'flight_risk_retention'

export interface CompChangeProposal {
  employeeId: string
  changeType: CompChangeType
  fromBand: string
  toBand?: string // for promotion
  currentSalary: number // cents
  proposedSalary: number // cents
  performanceRating: 'below' | 'meets' | 'exceeds' | 'top'
  tenureMonths: number
  lastIncreaseMonthsAgo: number
  writtenJustification: string | null
  hasFlightRiskFlag: boolean
}

export interface CompPolicyEvaluation {
  passed: boolean
  appliedRule: SignatureRequirement
  proposedIncreasePct: number
  violations: Array<{
    section: string
    severity: 'block' | 'warn'
    message: string
  }>
  summary: string
}

export function evaluateCompChange(
  policy: CompPolicyDocument,
  change: CompChangeProposal,
): CompPolicyEvaluation {
  const violations: CompPolicyEvaluation['violations'] = []
  const increasePct = ((change.proposedSalary - change.currentSalary) / change.currentSalary) * 100

  // Find applicable band
  const band = policy.meritIncreaseBands.find((b) => b.band === change.fromBand)

  // ── Merit ────────────────────────────────────────────────────────
  if (change.changeType === 'merit') {
    if (band) {
      if (increasePct > band.maxIncreasePct) {
        violations.push({
          section: '§2.bands',
          severity: 'block',
          message: `Increase ${increasePct.toFixed(1)}% exceeds ${band.band} band max ${band.maxIncreasePct}%`,
        })
      }
      if (increasePct > band.requiresGCFOFinanceAbovePct) {
        violations.push({
          section: '§2.b',
          severity: 'warn',
          message: `Increase ${increasePct.toFixed(1)}% requires GCFO Finance approval (band threshold ${band.requiresGCFOFinanceAbovePct}%)`,
        })
      }
    }
  }

  // ── Promotion ────────────────────────────────────────────────────
  if (change.changeType === 'promotion') {
    const rules = policy.promotionRules
    if (change.tenureMonths < rules.requiresTenureMonths) {
      violations.push({
        section: '§3.tenure',
        severity: 'block',
        message: `Tenure ${change.tenureMonths}mo < required ${rules.requiresTenureMonths}mo`,
      })
    }
    if (change.lastIncreaseMonthsAgo < rules.cooldownMonths) {
      violations.push({
        section: '§3.cooldown',
        severity: 'block',
        message: `Last increase ${change.lastIncreaseMonthsAgo}mo ago < cooldown ${rules.cooldownMonths}mo`,
      })
    }
    const ratingOk =
      rules.requiresPerformanceRating === 'meets'
        ? ['meets', 'exceeds', 'top'].includes(change.performanceRating)
        : rules.requiresPerformanceRating === 'exceeds'
          ? ['exceeds', 'top'].includes(change.performanceRating)
          : change.performanceRating === 'top'
    if (!ratingOk) {
      violations.push({
        section: '§3.performance',
        severity: 'block',
        message: `Performance "${change.performanceRating}" < required "${rules.requiresPerformanceRating}"`,
      })
    }
    if (!change.writtenJustification) {
      violations.push({
        section: '§3.case',
        severity: 'block',
        message: 'Promotion requires written justification',
      })
    }
    if (increasePct < rules.minIncreasePct) {
      violations.push({
        section: '§3.min',
        severity: 'warn',
        message: `Promotion increase ${increasePct.toFixed(1)}% < typical minimum ${rules.minIncreasePct}%`,
      })
    }
    if (increasePct > rules.maxIncreasePct) {
      violations.push({
        section: '§3.max',
        severity: 'block',
        message: `Promotion increase ${increasePct.toFixed(1)}% > maximum ${rules.maxIncreasePct}%`,
      })
    }
  }

  // ── Off-cycle ────────────────────────────────────────────────────
  if (change.changeType === 'off_cycle' || change.changeType === 'flight_risk_retention') {
    const rules = policy.offCycleRules
    if (change.lastIncreaseMonthsAgo < rules.cooldownMonths) {
      violations.push({
        section: '§4.cooldown',
        severity: 'warn',
        message: `Last increase ${change.lastIncreaseMonthsAgo}mo ago — within cooldown ${rules.cooldownMonths}mo`,
      })
    }
    if (increasePct > rules.maxAdjustmentPct) {
      violations.push({
        section: '§4.max',
        severity: 'block',
        message: `Off-cycle adjustment ${increasePct.toFixed(1)}% > max ${rules.maxAdjustmentPct}%`,
      })
    }
    if (!rules.flightRiskAllowed && change.changeType === 'flight_risk_retention') {
      violations.push({
        section: '§4.flight_risk',
        severity: 'block',
        message: 'Flight-risk retention adjustments not permitted',
      })
    }
  }

  // Pick the signature rule based on increase magnitude
  let appliedRule: SignatureRequirement
  if (change.changeType === 'promotion') {
    appliedRule = policy.signatureRequirements.find((r) => r.id === 'comp-promotion')!
  } else if (band && increasePct > band.targetIncreasePct) {
    appliedRule = policy.signatureRequirements.find((r) => r.id === 'comp-two-sig-above-target')!
  } else {
    appliedRule = policy.signatureRequirements.find((r) => r.id === 'comp-single-sig-below-5pct')!
  }

  const passed = violations.filter((v) => v.severity === 'block').length === 0

  return {
    passed,
    appliedRule,
    proposedIncreasePct: increasePct,
    violations,
    summary: composeCompSummary(change, increasePct, appliedRule, violations, passed),
  }
}

function composeCompSummary(
  change: CompChangeProposal,
  increasePct: number,
  rule: SignatureRequirement,
  violations: CompPolicyEvaluation['violations'],
  passed: boolean,
): string {
  const lines: string[] = []
  lines.push(`${change.changeType.replace('_', ' ')}: ${increasePct.toFixed(1)}% increase`)
  lines.push(`Rule: ${rule.reasoning}`)
  if (violations.length > 0) {
    lines.push('Policy notes:')
    for (const v of violations) {
      lines.push(`  ${v.severity === 'block' ? '✗' : '!'} ${v.section}: ${v.message}`)
    }
  }
  if (passed) lines.push('Policy: PASS')
  else lines.push('Policy: BLOCKED')
  return lines.join('\n')
}

// ─── Re-export the base PolicyDocument shape adapter ────────────────
// Allows the existing policy-engine.resolvePolicy() to be reused on the
// signature_requirements portion when needed.
export function asExpensePolicyShape(): Pick<PolicyDocument, 'signatureRequirements'> {
  return { signatureRequirements: ETI_COMP_POLICY_2026.signatureRequirements }
}
