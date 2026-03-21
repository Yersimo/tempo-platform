// ---------------------------------------------------------------------------
// Succession Planning & Skills Framework Engine
// Handles 9-box grid, bench strength, skills gap analysis, flight risk
// ---------------------------------------------------------------------------

// ---- 9-Box Grid Calculation ----

const NINE_BOX_LABELS: Record<string, string> = {
  '1-1': 'risk', // low perf, low potential
  '1-2': 'inconsistent_player',
  '1-3': 'rough_diamond',
  '2-1': 'average_performer',
  '2-2': 'core_player',
  '2-3': 'high_potential',
  '3-1': 'solid_performer',
  '3-2': 'consistent_star',
  '3-3': 'star',
}

/**
 * Maps a 1-5 score to a 1-3 bucket for 9-box grid
 * 1-2 → 1 (low), 3 → 2 (medium), 4-5 → 3 (high)
 */
function toBucket(score: number): number {
  if (score <= 2) return 1
  if (score <= 3) return 2
  return 3
}

export function calculateNineBoxPosition(performanceScore: number, potentialScore: number): string {
  const perfBucket = toBucket(performanceScore)
  const potBucket = toBucket(potentialScore)
  return NINE_BOX_LABELS[`${perfBucket}-${potBucket}`] || 'core_player'
}

export const NINE_BOX_DISPLAY: Record<string, { label: string; color: string }> = {
  star: { label: 'Star', color: '#22c55e' },
  consistent_star: { label: 'Consistent Star', color: '#4ade80' },
  high_potential: { label: 'High Potential', color: '#3b82f6' },
  solid_performer: { label: 'Solid Performer', color: '#a3e635' },
  core_player: { label: 'Core Player', color: '#facc15' },
  inconsistent_player: { label: 'Inconsistent Player', color: '#fb923c' },
  rough_diamond: { label: 'Rough Diamond', color: '#818cf8' },
  average_performer: { label: 'Average Performer', color: '#fbbf24' },
  risk: { label: 'At Risk', color: '#ef4444' },
}

// ---- Bench Strength Scoring ----

export interface BenchStrengthResult {
  planId: string
  positionTitle: string
  criticality: string
  totalCandidates: number
  readyNow: number
  readyOneYear: number
  readyTwoYears: number
  developing: number
  score: 'strong' | 'adequate' | 'weak' | 'none'
}

export function calculateBenchStrength(
  plan: { id: string; position_title: string; criticality: string },
  candidates: Array<{ plan_id: string; readiness: string }>
): BenchStrengthResult {
  const planCandidates = candidates.filter(c => c.plan_id === plan.id)
  const readyNow = planCandidates.filter(c => c.readiness === 'ready_now').length
  const readyOneYear = planCandidates.filter(c => c.readiness === 'ready_1_year').length
  const readyTwoYears = planCandidates.filter(c => c.readiness === 'ready_2_years').length
  const developing = planCandidates.filter(c => c.readiness === 'developing').length

  let score: BenchStrengthResult['score'] = 'none'
  if (readyNow >= 2) score = 'strong'
  else if (readyNow >= 1) score = 'adequate'
  else if (readyOneYear >= 1 || readyTwoYears >= 1) score = 'weak'

  return {
    planId: plan.id,
    positionTitle: plan.position_title,
    criticality: plan.criticality,
    totalCandidates: planCandidates.length,
    readyNow,
    readyOneYear,
    readyTwoYears,
    developing,
    score,
  }
}

// ---- Skills Gap Analysis ----

export interface SkillGap {
  skillId: string
  skillName: string
  currentLevel: number
  requiredLevel: number
  gap: number
  importance: string
}

export function analyzeSkillsGap(
  employeeSkills: Array<{ skill_id: string; current_level: number }>,
  roleRequirements: Array<{ skill_id: string; required_level: number; importance: string }>,
  skillsLookup: Record<string, string> // skillId → name
): SkillGap[] {
  const gaps: SkillGap[] = []

  for (const req of roleRequirements) {
    const empSkill = employeeSkills.find(s => s.skill_id === req.skill_id)
    const currentLevel = empSkill?.current_level || 0
    const gap = req.required_level - currentLevel

    if (gap > 0) {
      gaps.push({
        skillId: req.skill_id,
        skillName: skillsLookup[req.skill_id] || 'Unknown Skill',
        currentLevel,
        requiredLevel: req.required_level,
        gap,
        importance: req.importance,
      })
    }
  }

  return gaps.sort((a, b) => {
    // Sort by importance first, then by gap size
    const importanceOrder: Record<string, number> = { required: 0, preferred: 1, nice_to_have: 2 }
    const aOrder = importanceOrder[a.importance] ?? 3
    const bOrder = importanceOrder[b.importance] ?? 3
    if (aOrder !== bOrder) return aOrder - bOrder
    return b.gap - a.gap
  })
}

// ---- Flight Risk Indicators ----

export interface FlightRiskResult {
  employeeId: string
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  riskScore: number // 0-100
  factors: string[]
}

export function calculateFlightRisk(
  employee: { id: string; hire_date?: string; salary?: number },
  compRatio?: number, // current salary / midpoint
  engagementScore?: number, // 0-100
  recentPromotion?: boolean,
  performanceRating?: number, // 1-5
): FlightRiskResult {
  const factors: string[] = []
  let riskScore = 0

  // Tenure factor: 1-2 years = higher risk
  if (employee.hire_date) {
    const tenure = (Date.now() - new Date(employee.hire_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
    if (tenure < 1) { riskScore += 10; factors.push('New hire (<1 year)') }
    else if (tenure < 2) { riskScore += 20; factors.push('Short tenure (1-2 years)') }
    else if (tenure > 7) { riskScore += 5; factors.push('Long tenure (>7 years)') }
  }

  // Comp ratio factor
  if (compRatio !== undefined) {
    if (compRatio < 0.85) { riskScore += 25; factors.push('Below market pay (<85% comp ratio)') }
    else if (compRatio < 0.95) { riskScore += 10; factors.push('Slightly below market (85-95% comp ratio)') }
  }

  // Engagement factor
  if (engagementScore !== undefined) {
    if (engagementScore < 40) { riskScore += 30; factors.push('Low engagement score') }
    else if (engagementScore < 60) { riskScore += 15; factors.push('Below-average engagement') }
  }

  // No recent promotion for high performers
  if (performanceRating && performanceRating >= 4 && !recentPromotion) {
    riskScore += 15
    factors.push('High performer without recent promotion')
  }

  // Determine risk level
  let riskLevel: FlightRiskResult['riskLevel'] = 'low'
  if (riskScore >= 60) riskLevel = 'critical'
  else if (riskScore >= 40) riskLevel = 'high'
  else if (riskScore >= 20) riskLevel = 'medium'

  return {
    employeeId: employee.id,
    riskLevel,
    riskScore: Math.min(100, riskScore),
    factors,
  }
}

// ---- Readiness Display Helpers ----

export const READINESS_DISPLAY: Record<string, { label: string; variant: string }> = {
  ready_now: { label: 'Ready Now', variant: 'success' },
  ready_1_year: { label: 'Ready in 1 Year', variant: 'info' },
  ready_2_years: { label: 'Ready in 2 Years', variant: 'warning' },
  developing: { label: 'Developing', variant: 'orange' },
  not_ready: { label: 'Not Ready', variant: 'error' },
}

export const CRITICALITY_DISPLAY: Record<string, { label: string; variant: string }> = {
  critical: { label: 'Critical', variant: 'error' },
  high: { label: 'High', variant: 'warning' },
  medium: { label: 'Medium', variant: 'info' },
  low: { label: 'Low', variant: 'default' },
}

export const SKILL_CATEGORIES = [
  { value: 'technical', label: 'Technical' },
  { value: 'leadership', label: 'Leadership' },
  { value: 'functional', label: 'Functional' },
  { value: 'behavioral', label: 'Behavioral' },
]

export const PROFICIENCY_LEVELS = [
  { level: 1, label: 'Beginner', description: 'Basic awareness and understanding' },
  { level: 2, label: 'Developing', description: 'Can apply with guidance' },
  { level: 3, label: 'Proficient', description: 'Can apply independently' },
  { level: 4, label: 'Advanced', description: 'Can lead and mentor others' },
  { level: 5, label: 'Expert', description: 'Industry-recognized authority' },
]
