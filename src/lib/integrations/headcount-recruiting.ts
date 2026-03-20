/**
 * Headcount → Recruiting Integration
 *
 * When a headcount position is approved:
 * - Auto-create a job posting with the position details
 * - Set salary range from the approved budget
 * - Pre-fill department, level, location from headcount plan
 * - Link the posting back to the headcount position for traceability
 *
 * All integrations are event-driven via the cross-module event bus.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Headcount position as stored in the store */
export interface HeadcountPosition {
  id: string
  org_id: string
  plan_id: string
  department_id: string
  job_title: string
  level: string
  location?: string
  status: 'draft' | 'pending_approval' | 'approved' | 'filled' | 'cancelled'
  justification?: string
  hiring_manager_id?: string
  target_start_date?: string
  budget_amount?: number // cents
  currency?: string
  employment_type?: 'full_time' | 'part_time' | 'contract' | 'intern'
  created_at: string
  updated_at: string
}

/** Job posting input expected by addJobPosting */
export interface JobPostingInput {
  title: string
  department_id: string
  level: string
  location: string
  employment_type: string
  status: 'draft' | 'open' | 'closed' | 'on_hold'
  description: string
  requirements: string
  salary_min?: number // cents
  salary_max?: number // cents
  currency: string
  headcount_position_id?: string
  hiring_manager_id?: string
  target_start_date?: string
  metadata?: Record<string, unknown>
}

/** Result of generating a job posting from a headcount position */
export interface HeadcountJobPostingResult {
  positionId: string
  jobPosting: JobPostingInput
  salaryRange: {
    min: number // cents
    max: number // cents
    currency: string
  }
  metadata: {
    departmentName: string
    level: string
    location: string
    generatedAt: string
  }
}

/** Store slice needed for headcount→recruiting operations */
export interface HeadcountRecruitingStoreSlice {
  departments: Array<{ id: string; name: string }>
  headcountPositions: Array<Record<string, unknown>>
  jobPostings: Array<Record<string, unknown>>
  addJobPosting?: (data: Record<string, unknown>) => void
  updateHeadcountPosition?: (id: string, data: Record<string, unknown>) => void
  addToast?: (toast: { type: string; title: string; description?: string }) => void
}

// ---------------------------------------------------------------------------
// Salary Range Calculation
// ---------------------------------------------------------------------------

/**
 * Default salary band spread percentages by level.
 * The approved budget is treated as the midpoint; we derive min/max from it.
 */
const LEVEL_BAND_SPREAD: Record<string, { minPct: number; maxPct: number }> = {
  intern:     { minPct: 0.90, maxPct: 1.10 },
  junior:     { minPct: 0.85, maxPct: 1.10 },
  mid:        { minPct: 0.85, maxPct: 1.15 },
  senior:     { minPct: 0.80, maxPct: 1.15 },
  lead:       { minPct: 0.80, maxPct: 1.20 },
  staff:      { minPct: 0.80, maxPct: 1.20 },
  principal:  { minPct: 0.80, maxPct: 1.25 },
  manager:    { minPct: 0.80, maxPct: 1.20 },
  director:   { minPct: 0.75, maxPct: 1.25 },
  vp:         { minPct: 0.75, maxPct: 1.30 },
  'c-level':  { minPct: 0.70, maxPct: 1.30 },
}

const DEFAULT_BAND = { minPct: 0.85, maxPct: 1.15 }

// ---------------------------------------------------------------------------
// Job Description Templates
// ---------------------------------------------------------------------------

/**
 * Generate a basic job description from position details.
 * In production this would likely be AI-generated or use templates from the org.
 */
function generateJobDescription(
  jobTitle: string,
  departmentName: string,
  level: string,
  location: string,
  justification?: string,
): string {
  const lines = [
    `We are looking for a ${level} ${jobTitle} to join our ${departmentName} team.`,
    '',
    location ? `Location: ${location}` : 'Location: Flexible',
    '',
    'This role will be instrumental in driving our team forward.',
  ]

  if (justification) {
    lines.push('', `About this role: ${justification}`)
  }

  lines.push(
    '',
    'What you will do:',
    `- Contribute to the ${departmentName} team goals`,
    `- Collaborate across teams to deliver impactful results`,
    `- Grow your skills in a supportive environment`,
  )

  return lines.join('\n')
}

/**
 * Generate basic requirements text.
 */
function generateRequirements(level: string, jobTitle: string): string {
  const lines = ['Requirements:', '']

  const levelLower = level.toLowerCase()
  if (levelLower.includes('senior') || levelLower.includes('lead') || levelLower.includes('staff') || levelLower.includes('principal')) {
    lines.push('- 5+ years of relevant experience')
  } else if (levelLower.includes('mid')) {
    lines.push('- 2-5 years of relevant experience')
  } else if (levelLower.includes('junior')) {
    lines.push('- 0-2 years of relevant experience')
  } else if (levelLower.includes('intern')) {
    lines.push('- Currently enrolled in or recently graduated from a relevant program')
  } else {
    lines.push('- Relevant professional experience')
  }

  lines.push(
    `- Strong skills relevant to the ${jobTitle} role`,
    '- Excellent communication and collaboration abilities',
    '- Passion for learning and professional growth',
  )

  return lines.join('\n')
}

// ---------------------------------------------------------------------------
// Core Functions
// ---------------------------------------------------------------------------

/**
 * Generate a job posting from an approved headcount position.
 *
 * @param position      - The approved headcount position
 * @param departmentName - Name of the department (resolved from ID)
 * @returns A structured result with the job posting ready for creation
 */
export function generateJobPostingFromHeadcount(
  position: HeadcountPosition,
  departmentName: string,
): HeadcountJobPostingResult {
  const budgetCents = position.budget_amount || 0
  const currency = position.currency || 'USD'
  const levelKey = (position.level || 'mid').toLowerCase().replace(/[^a-z-]/g, '')
  const band = LEVEL_BAND_SPREAD[levelKey] || DEFAULT_BAND

  const salaryMin = Math.round(budgetCents * band.minPct)
  const salaryMax = Math.round(budgetCents * band.maxPct)

  const location = position.location || 'Flexible'

  const jobPosting: JobPostingInput = {
    title: position.job_title,
    department_id: position.department_id,
    level: position.level,
    location,
    employment_type: position.employment_type || 'full_time',
    status: 'draft',
    description: generateJobDescription(
      position.job_title,
      departmentName,
      position.level,
      location,
      position.justification,
    ),
    requirements: generateRequirements(position.level, position.job_title),
    salary_min: salaryMin,
    salary_max: salaryMax,
    currency,
    headcount_position_id: position.id,
    hiring_manager_id: position.hiring_manager_id,
    target_start_date: position.target_start_date,
    metadata: {
      auto_generated: true,
      source: 'headcount-recruiting-integration',
      headcount_plan_id: position.plan_id,
      headcount_position_id: position.id,
      budget_amount: budgetCents,
      generated_at: new Date().toISOString(),
    },
  }

  return {
    positionId: position.id,
    jobPosting,
    salaryRange: { min: salaryMin, max: salaryMax, currency },
    metadata: {
      departmentName,
      level: position.level,
      location,
      generatedAt: new Date().toISOString(),
    },
  }
}

/**
 * Apply the generated job posting to the store.
 *
 * @param result - Output from generateJobPostingFromHeadcount
 * @param store  - Store actions for persisting
 * @returns True if the posting was created
 */
export function applyJobPostingFromHeadcount(
  result: HeadcountJobPostingResult,
  store: HeadcountRecruitingStoreSlice,
): boolean {
  if (!store.addJobPosting) return false

  store.addJobPosting(result.jobPosting as unknown as Record<string, unknown>)

  // Update the headcount position to reflect that a posting was created
  if (store.updateHeadcountPosition) {
    store.updateHeadcountPosition(result.positionId, {
      has_job_posting: true,
      job_posting_created_at: new Date().toISOString(),
    })
  }

  return true
}
