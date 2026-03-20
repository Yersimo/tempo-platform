/**
 * Recruiting → Compensation Integration
 *
 * When an offer is being extended to a candidate, validates the proposed
 * salary against the role's compensation bands:
 * - Look up the role's salary band from compensation data
 * - Compare proposed offer to min/median/max
 * - Flag if outside band (under = retention risk, over = budget concern)
 * - Return recommendation with percentile position
 *
 * All amounts are in CENTS (e.g. 500000 = $5,000).
 * All integrations are event-driven via the cross-module event bus.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Compensation band as stored in the store */
export interface CompensationBand {
  id: string
  org_id: string
  job_title?: string
  level?: string
  department_id?: string
  min_salary: number // cents
  mid_salary: number // cents (median)
  max_salary: number // cents
  currency: string
}

/** Result of validating an offer against compensation bands */
export interface OfferValidationResult {
  candidateName: string
  jobTitle: string
  level: string | undefined
  proposedSalaryCents: number
  bandFound: boolean
  band: {
    min: number
    mid: number
    max: number
    currency: string
  } | null
  percentile: number // 0-100, where 50 = at median
  status: 'within_band' | 'below_band' | 'above_band'
  riskLevel: 'none' | 'low' | 'medium' | 'high'
  recommendation: string
}

/** Store slice needed for recruiting→compensation operations */
export interface RecruitingCompensationStoreSlice {
  compBands: CompensationBand[]
  employees: Array<{ id: string; job_title?: string; level?: string; department_id?: string }>
  departments: Array<{ id: string; name: string }>
  addToast?: (toast: { type: string; title: string; description?: string }) => void
}

// ---------------------------------------------------------------------------
// Core Functions
// ---------------------------------------------------------------------------

/**
 * Look up the compensation band for a given role (job title + level).
 * Falls back to title-only match if level-specific band not found.
 */
export function getCompensationBandForRole(
  jobTitle: string,
  level: string | undefined,
  departmentId: string | undefined,
  compBands: CompensationBand[],
): CompensationBand | null {
  // Try exact match: title + level + department
  if (level && departmentId) {
    const exact = compBands.find(
      b =>
        b.job_title?.toLowerCase() === jobTitle.toLowerCase() &&
        b.level?.toLowerCase() === level.toLowerCase() &&
        b.department_id === departmentId,
    )
    if (exact) return exact
  }

  // Try title + level match
  if (level) {
    const titleLevel = compBands.find(
      b =>
        b.job_title?.toLowerCase() === jobTitle.toLowerCase() &&
        b.level?.toLowerCase() === level.toLowerCase(),
    )
    if (titleLevel) return titleLevel
  }

  // Try title-only match
  const titleOnly = compBands.find(
    b => b.job_title?.toLowerCase() === jobTitle.toLowerCase(),
  )
  if (titleOnly) return titleOnly

  // Try level-only match (generic bands by level)
  if (level) {
    const levelOnly = compBands.find(
      b => b.level?.toLowerCase() === level.toLowerCase() && !b.job_title,
    )
    if (levelOnly) return levelOnly
  }

  return null
}

/**
 * Calculate where a proposed salary falls within a compensation band.
 * Returns a percentile (0-100) where 0 = at min, 50 = at median, 100 = at max.
 */
function calculatePercentile(
  proposedCents: number,
  minCents: number,
  maxCents: number,
): number {
  if (maxCents <= minCents) return 50
  const range = maxCents - minCents
  const position = proposedCents - minCents
  const raw = (position / range) * 100
  return Math.round(Math.max(0, Math.min(100, raw)))
}

/**
 * Validate a proposed offer salary against the role's compensation bands.
 *
 * @param candidateName      - Name of the candidate receiving the offer
 * @param jobTitle           - Job title for the position
 * @param level              - Job level (e.g. 'senior', 'mid', 'junior')
 * @param departmentId       - Department ID for band lookup
 * @param proposedSalaryCents - Proposed salary in cents
 * @param compBands          - Available compensation bands
 * @returns Validation result with recommendation
 */
export function validateOfferAgainstBands(
  candidateName: string,
  jobTitle: string,
  level: string | undefined,
  departmentId: string | undefined,
  proposedSalaryCents: number,
  compBands: CompensationBand[],
): OfferValidationResult {
  const band = getCompensationBandForRole(jobTitle, level, departmentId, compBands)

  if (!band) {
    return {
      candidateName,
      jobTitle,
      level,
      proposedSalaryCents,
      bandFound: false,
      band: null,
      percentile: -1,
      status: 'within_band',
      riskLevel: 'low',
      recommendation: `No compensation band found for "${jobTitle}"${level ? ` (${level})` : ''}. Consider creating one before extending the offer.`,
    }
  }

  const percentile = calculatePercentile(proposedSalaryCents, band.min_salary, band.max_salary)
  const proposedFormatted = (proposedSalaryCents / 100).toFixed(0)
  const minFormatted = (band.min_salary / 100).toFixed(0)
  const maxFormatted = (band.max_salary / 100).toFixed(0)
  const midFormatted = (band.mid_salary / 100).toFixed(0)

  let status: OfferValidationResult['status']
  let riskLevel: OfferValidationResult['riskLevel']
  let recommendation: string

  if (proposedSalaryCents < band.min_salary) {
    status = 'below_band'
    const deficit = band.min_salary - proposedSalaryCents
    const deficitPercent = Math.round((deficit / band.min_salary) * 100)
    riskLevel = deficitPercent > 15 ? 'high' : deficitPercent > 5 ? 'medium' : 'low'
    recommendation = `Offer of ${proposedFormatted} ${band.currency} is ${deficitPercent}% below the band minimum (${minFormatted}). ` +
      `Retention risk: candidates may leave quickly if they discover market rates. ` +
      `Recommend adjusting to at least ${minFormatted} ${band.currency}.`
  } else if (proposedSalaryCents > band.max_salary) {
    status = 'above_band'
    const excess = proposedSalaryCents - band.max_salary
    const excessPercent = Math.round((excess / band.max_salary) * 100)
    riskLevel = excessPercent > 15 ? 'high' : excessPercent > 5 ? 'medium' : 'low'
    recommendation = `Offer of ${proposedFormatted} ${band.currency} is ${excessPercent}% above the band maximum (${maxFormatted}). ` +
      `Budget concern: may create internal equity issues with existing employees. ` +
      `Recommend capping at ${maxFormatted} ${band.currency} or adjusting the band.`
  } else {
    status = 'within_band'
    riskLevel = 'none'
    recommendation = `Offer of ${proposedFormatted} ${band.currency} is within band (${minFormatted}-${maxFormatted}). ` +
      `Positioned at the ${percentile}th percentile (median: ${midFormatted}). ` +
      (percentile < 30
        ? 'Consider increasing to improve competitiveness.'
        : percentile > 70
          ? 'Strong offer — positioned in the upper range.'
          : 'Well-positioned near the median.')
  }

  return {
    candidateName,
    jobTitle,
    level,
    proposedSalaryCents,
    bandFound: true,
    band: {
      min: band.min_salary,
      mid: band.mid_salary,
      max: band.max_salary,
      currency: band.currency,
    },
    percentile,
    status,
    riskLevel,
    recommendation,
  }
}
