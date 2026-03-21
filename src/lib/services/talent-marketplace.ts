// ---------------------------------------------------------------------------
// Talent Marketplace Service
// Handles internal gigs, skill matching, career paths, and analytics
// ---------------------------------------------------------------------------

// ---- Types ----

export interface InternalGig {
  id: string
  org_id: string
  title: string
  description: string
  gig_type: string
  department_id?: string
  posted_by: string
  status: string
  commitment: string
  hours_per_week?: number
  duration?: string
  start_date?: string
  end_date?: string
  max_participants: number
  required_skills?: string
  preferred_level?: string
  is_remote: boolean
  compensation_type: string
  compensation_amount?: number
  created_at: string
  updated_at: string
}

export interface GigApplication {
  id: string
  gig_id: string
  employee_id: string
  status: string
  cover_letter?: string | null
  manager_approved?: boolean | null
  match_score?: number
  created_at: string
  updated_at: string
}

export interface CareerPath {
  id: string
  org_id: string
  name: string
  description?: string
  steps: string // JSON
  department_id?: string
  created_at: string
}

export interface CareerInterest {
  id: string
  employee_id: string
  org_id: string
  target_role?: string
  target_department?: string
  career_path_id?: string
  interested_in_mentoring: boolean
  interested_in_gigs: boolean
  open_to_transfer: boolean
  skills?: string // JSON
  updated_at: string
}

export interface CareerPathStep {
  title: string
  level: string
  skills: string[]
  typicalTenure: string
}

export interface SkillMatch {
  score: number
  matchedSkills: string[]
  missingSkills: string[]
}

export interface MarketplaceStats {
  openGigs: number
  applications: number
  fillRate: number
  avgTimeToFill: number
  topSkillsInDemand: string[]
  gigsByType: Record<string, number>
  applicationsByStatus: Record<string, number>
}

// ---- Constants ----

export const GIG_TYPES = [
  { value: 'stretch_assignment', label: 'Stretch Assignment', icon: 'target', color: 'text-orange-400', bg: 'bg-orange-500/10' },
  { value: 'project', label: 'Cross-Functional Project', icon: 'layers', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  { value: 'mentoring', label: 'Mentoring', icon: 'users', color: 'text-purple-400', bg: 'bg-purple-500/10' },
  { value: 'job_rotation', label: 'Job Rotation', icon: 'refresh', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  { value: 'shadow', label: 'Job Shadow', icon: 'eye', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { value: 'internal_transfer', label: 'Internal Transfer', icon: 'move', color: 'text-pink-400', bg: 'bg-pink-500/10' },
]

export const GIG_STATUS = [
  { value: 'draft', label: 'Draft', color: 'default' as const },
  { value: 'open', label: 'Open', color: 'success' as const },
  { value: 'in_progress', label: 'In Progress', color: 'info' as const },
  { value: 'filled', label: 'Filled', color: 'warning' as const },
  { value: 'completed', label: 'Completed', color: 'success' as const },
  { value: 'cancelled', label: 'Cancelled', color: 'error' as const },
]

export const APPLICATION_STATUS = [
  { value: 'applied', label: 'Applied', color: 'info' as const },
  { value: 'shortlisted', label: 'Shortlisted', color: 'warning' as const },
  { value: 'selected', label: 'Selected', color: 'success' as const },
  { value: 'rejected', label: 'Rejected', color: 'error' as const },
  { value: 'withdrawn', label: 'Withdrawn', color: 'default' as const },
]

export const COMMITMENT_OPTIONS = [
  { value: 'full_time', label: 'Full-Time' },
  { value: 'part_time', label: 'Part-Time' },
  { value: 'hours_per_week', label: 'Hours/Week' },
]

export const COMPENSATION_OPTIONS = [
  { value: 'none', label: 'No Compensation' },
  { value: 'stipend', label: 'Stipend' },
  { value: 'bonus', label: 'Bonus' },
]

// ---- Skill Matching ----

export function calculateSkillMatch(
  employeeSkills: Array<{ skill_id: string; current_level: number }>,
  requiredSkillIds: string[]
): SkillMatch {
  if (!requiredSkillIds.length) return { score: 100, matchedSkills: [], missingSkills: [] }

  const empSkillMap = new Map(employeeSkills.map((s) => [s.skill_id, s.current_level]))
  const matchedSkills: string[] = []
  const missingSkills: string[] = []

  for (const skillId of requiredSkillIds) {
    if (empSkillMap.has(skillId) && (empSkillMap.get(skillId) || 0) >= 2) {
      matchedSkills.push(skillId)
    } else {
      missingSkills.push(skillId)
    }
  }

  const score = Math.round((matchedSkills.length / requiredSkillIds.length) * 100)
  return { score, matchedSkills, missingSkills }
}

export function getRecommendedGigs(
  gigs: InternalGig[],
  employeeSkills: Array<{ skill_id: string; current_level: number }>,
  employeeLevel?: string
): Array<{ gig: InternalGig; matchScore: number }> {
  return gigs
    .filter((g) => g.status === 'open')
    .map((gig) => {
      let requiredSkillIds: string[] = []
      try { requiredSkillIds = JSON.parse(gig.required_skills || '[]') } catch { /* empty */ }
      const match = calculateSkillMatch(employeeSkills, requiredSkillIds)
      return { gig, matchScore: match.score }
    })
    .sort((a, b) => b.matchScore - a.matchScore)
}

export function getRecommendedCandidates(
  gig: InternalGig,
  allEmployeeSkills: Array<{ employee_id: string; skill_id: string; current_level: number }>,
  employees: Array<{ id: string; level?: string }>
): Array<{ employeeId: string; score: number; matchedSkills: string[]; missingSkills: string[] }> {
  let requiredSkillIds: string[] = []
  try { requiredSkillIds = JSON.parse(gig.required_skills || '[]') } catch { /* empty */ }

  const byEmployee = new Map<string, Array<{ skill_id: string; current_level: number }>>()
  for (const es of allEmployeeSkills) {
    if (!byEmployee.has(es.employee_id)) byEmployee.set(es.employee_id, [])
    byEmployee.get(es.employee_id)!.push(es)
  }

  return employees
    .map((emp) => {
      const empSkills = byEmployee.get(emp.id) || []
      const match = calculateSkillMatch(empSkills, requiredSkillIds)
      return { employeeId: emp.id, ...match }
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
}

// ---- Career Path Helpers ----

export function parseCareerPathSteps(stepsJson: string): CareerPathStep[] {
  try { return JSON.parse(stepsJson) } catch { return [] }
}

export function getCareerPathProgress(
  steps: CareerPathStep[],
  employeeLevel: string,
  employeeSkills: Array<{ skill_id: string; current_level: number }>
): { currentStep: number; totalSteps: number; skillsCompleted: number; skillsRemaining: number } {
  const empSkillMap = new Map(employeeSkills.map((s) => [s.skill_id, s.current_level]))
  let currentStep = 0

  for (let i = 0; i < steps.length; i++) {
    if (steps[i].level === employeeLevel) {
      currentStep = i
      break
    }
  }

  let skillsCompleted = 0
  let skillsRemaining = 0

  for (const step of steps) {
    for (const skillId of step.skills) {
      if (empSkillMap.has(skillId) && (empSkillMap.get(skillId) || 0) >= 3) {
        skillsCompleted++
      } else {
        skillsRemaining++
      }
    }
  }

  return { currentStep, totalSteps: steps.length, skillsCompleted, skillsRemaining }
}

// ---- Analytics ----

export function computeMarketplaceStats(
  gigs: InternalGig[],
  applications: GigApplication[]
): MarketplaceStats {
  const openGigs = gigs.filter((g) => g.status === 'open').length
  const completedGigs = gigs.filter((g) => g.status === 'completed' || g.status === 'filled')
  const fillRate = gigs.length > 0 ? Math.round((completedGigs.length / gigs.length) * 100) : 0

  // Avg time to fill (days)
  let totalDays = 0
  let filledCount = 0
  for (const g of completedGigs) {
    if (g.created_at && g.updated_at) {
      const days = Math.ceil((new Date(g.updated_at).getTime() - new Date(g.created_at).getTime()) / (1000 * 60 * 60 * 24))
      totalDays += days
      filledCount++
    }
  }

  // Top skills in demand
  const skillCount = new Map<string, number>()
  for (const g of gigs.filter((g) => g.status === 'open')) {
    try {
      const skills: string[] = JSON.parse(g.required_skills || '[]')
      for (const s of skills) {
        skillCount.set(s, (skillCount.get(s) || 0) + 1)
      }
    } catch { /* empty */ }
  }
  const topSkillsInDemand = [...skillCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => id)

  // By type
  const gigsByType: Record<string, number> = {}
  for (const g of gigs) {
    gigsByType[g.gig_type] = (gigsByType[g.gig_type] || 0) + 1
  }

  // Applications by status
  const applicationsByStatus: Record<string, number> = {}
  for (const a of applications) {
    applicationsByStatus[a.status] = (applicationsByStatus[a.status] || 0) + 1
  }

  return {
    openGigs,
    applications: applications.length,
    fillRate,
    avgTimeToFill: filledCount > 0 ? Math.round(totalDays / filledCount) : 0,
    topSkillsInDemand,
    gigsByType,
    applicationsByStatus,
  }
}
