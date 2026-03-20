/**
 * Mentoring -> Performance Integration
 *
 * When a mentoring relationship milestone is reached or session completed:
 * 1. Update mentee's competency ratings for soft skills
 * 2. Add progress toward development goals related to mentoring
 *
 * All integrations are event-driven via the cross-module event bus.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Competency rating for an employee */
export interface CompetencyRating {
  id: string
  employee_id: string
  competency_id: string
  rating: number
  target: number
  assessed_date: string
  assessor_id?: string
}

/** Performance goal */
export interface Goal {
  id: string
  org_id: string
  employee_id: string
  title: string
  description?: string
  category: 'business' | 'project' | 'development' | 'compliance'
  status: 'not_started' | 'on_track' | 'at_risk' | 'behind' | 'completed'
  progress: number
  start_date?: string
  due_date?: string
  created_at: string
  updated_at?: string
}

/** Competency boost result from a mentoring session */
export interface MentoringCompetencyResult {
  menteeId: string
  sessionId: string
  updatedCompetencies: Array<{
    competencyId: string
    competencyName: string
    previousRating: number
    newRating: number
    boost: number
  }>
  skippedCompetencies: string[]
}

/** Goal progress update from a mentoring session */
export interface MentoringGoalUpdate {
  goalId: string
  goalTitle: string
  previousProgress: number
  newProgress: number
  progressIncrement: number
  completed: boolean
}

/** Store slice needed for mentoring->performance operations */
export interface MentoringPerformanceStoreSlice {
  competencyRatings: CompetencyRating[]
  goals: Goal[]
  updateGoal?: (id: string, data: Record<string, unknown>) => void
  addCompetencyRating?: (data: Record<string, unknown>) => void
  updateCompetencyRating?: (id: string, data: Record<string, unknown>) => void
  addToast?: (toast: { type: string; title: string; description?: string }) => void
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Mentoring sessions develop these soft-skill competencies.
 * Regular sessions provide a smaller boost; milestone sessions provide more.
 */
const MENTORING_COMPETENCY_IDS = [
  'comp-comm',    // Communication
  'comp-lead',    // Leadership
  'comp-collab',  // Collaboration
  'comp-adapt',   // Adaptability
]

const SESSION_TYPE_BOOST: Record<string, number> = {
  regular: 0.05,
  milestone: 0.15,
  final: 0.2,
}

/** Keywords that indicate a goal is related to mentoring */
const MENTORING_GOAL_KEYWORDS = [
  'mentor', 'mentoring', 'mentorship', 'coaching', 'leadership development',
  'soft skills', 'communication skills', 'professional development',
  'career growth', 'networking', 'relationship building',
]

// ---------------------------------------------------------------------------
// Core Functions
// ---------------------------------------------------------------------------

/**
 * Calculate competency boosts for a mentee after a mentoring session.
 *
 * Rules:
 * - Regular sessions boost soft-skill competencies by 0.05
 * - Milestone sessions boost by 0.15
 * - Final sessions boost by 0.2
 * - Rating is capped at target and 5
 * - If the mentee already meets/exceeds target, the competency is skipped
 */
export function calculateMentoringCompetencyBoost(
  menteeId: string,
  sessionId: string,
  sessionType: 'regular' | 'milestone' | 'final',
  competencyRatings: CompetencyRating[],
): MentoringCompetencyResult {
  const boost = SESSION_TYPE_BOOST[sessionType] || 0.05
  const menteeRatings = competencyRatings.filter(r => r.employee_id === menteeId)

  const updatedCompetencies: MentoringCompetencyResult['updatedCompetencies'] = []
  const skippedCompetencies: string[] = []

  const COMP_NAMES: Record<string, string> = {
    'comp-comm': 'Communication',
    'comp-lead': 'Leadership',
    'comp-collab': 'Collaboration',
    'comp-adapt': 'Adaptability',
  }

  for (const compId of MENTORING_COMPETENCY_IDS) {
    const existing = menteeRatings.find(r => r.competency_id === compId)

    if (!existing) {
      // No existing rating — create starting from the boost value
      updatedCompetencies.push({
        competencyId: compId,
        competencyName: COMP_NAMES[compId] || compId,
        previousRating: 0,
        newRating: Math.min(boost, 5),
        boost,
      })
      continue
    }

    // Already at or above target — skip
    if (existing.rating >= existing.target) {
      skippedCompetencies.push(compId)
      continue
    }

    const newRating = Math.min(
      Math.round((existing.rating + boost) * 100) / 100,
      existing.target,
      5,
    )

    if (newRating <= existing.rating) {
      skippedCompetencies.push(compId)
      continue
    }

    updatedCompetencies.push({
      competencyId: compId,
      competencyName: COMP_NAMES[compId] || compId,
      previousRating: existing.rating,
      newRating,
      boost: Math.round((newRating - existing.rating) * 100) / 100,
    })
  }

  return {
    menteeId,
    sessionId,
    updatedCompetencies,
    skippedCompetencies,
  }
}

/**
 * Find and advance development goals related to mentoring.
 *
 * Matching logic:
 * - Only goals with category='development' are eligible
 * - Goal title or description must contain mentoring-related keywords
 * - Regular sessions increment by 5%, milestones by 15%
 * - Goals reaching 100% are auto-marked as 'completed'
 */
export function calculateMentoringGoalProgress(
  menteeId: string,
  sessionType: 'regular' | 'milestone' | 'final',
  goals: Goal[],
): MentoringGoalUpdate[] {
  const increment = sessionType === 'regular' ? 5 : sessionType === 'milestone' ? 15 : 20

  const employeeGoals = goals.filter(
    g => g.employee_id === menteeId &&
         g.category === 'development' &&
         g.status !== 'completed' &&
         g.progress < 100,
  )

  const updates: MentoringGoalUpdate[] = []

  for (const goal of employeeGoals) {
    const searchText = `${goal.title} ${goal.description || ''}`.toLowerCase()
    const matches = MENTORING_GOAL_KEYWORDS.some(kw => searchText.includes(kw))
    if (!matches) continue

    const newProgress = Math.min(goal.progress + increment, 100)
    const completed = newProgress >= 100

    updates.push({
      goalId: goal.id,
      goalTitle: goal.title,
      previousProgress: goal.progress,
      newProgress,
      progressIncrement: newProgress - goal.progress,
      completed,
    })
  }

  return updates
}

// ---------------------------------------------------------------------------
// Store Mutation Helpers
// ---------------------------------------------------------------------------

/**
 * Apply competency boosts to the store after a mentoring session.
 */
export function applyMentoringCompetencyUpdates(
  result: MentoringCompetencyResult,
  store: MentoringPerformanceStoreSlice,
): void {
  for (const update of result.updatedCompetencies) {
    const existing = store.competencyRatings.find(
      r => r.employee_id === result.menteeId && r.competency_id === update.competencyId,
    )

    if (existing && store.updateCompetencyRating) {
      store.updateCompetencyRating(existing.id, {
        rating: update.newRating,
        assessed_date: new Date().toISOString().split('T')[0],
        assessor_id: 'system-mentoring-integration',
      })
    } else if (!existing && store.addCompetencyRating) {
      store.addCompetencyRating({
        employee_id: result.menteeId,
        competency_id: update.competencyId,
        rating: update.newRating,
        target: 4,
        assessed_date: new Date().toISOString().split('T')[0],
        assessor_id: 'system-mentoring-integration',
      })
    }
  }
}

/**
 * Apply mentoring goal progress updates to the store.
 */
export function applyMentoringGoalUpdates(
  updates: MentoringGoalUpdate[],
  store: MentoringPerformanceStoreSlice,
): void {
  for (const update of updates) {
    if (store.updateGoal) {
      store.updateGoal(update.goalId, {
        progress: update.newProgress,
        status: update.completed ? 'completed' : 'on_track',
        updated_at: new Date().toISOString(),
      })
    }
  }
}
