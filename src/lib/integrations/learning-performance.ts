/**
 * Learning → Performance Integration
 *
 * Bridges the Learning Management System with Performance Management by:
 * 1. Updating competency scores when relevant courses are completed
 * 2. Advancing development goal progress when linked courses are finished
 * 3. Generating learning-driven performance insights (skill gap closure)
 * 4. Auto-creating learning assignments from performance review recommendations
 *
 * All integrations are event-driven via the cross-module event bus.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Course record (subset of LMS fields needed here) */
export interface Course {
  id: string
  org_id: string
  title: string
  description?: string
  category: string
  duration_hours?: number
  format?: 'online' | 'classroom' | 'blended'
  level?: 'beginner' | 'intermediate' | 'advanced'
  is_mandatory?: boolean
}

/** Enrollment record */
export interface Enrollment {
  id: string
  org_id: string
  employee_id: string
  course_id: string
  status: 'enrolled' | 'in_progress' | 'completed' | 'dropped'
  progress: number
  enrolled_at: string
  completed_at?: string | null
}

/** Competency framework definition */
export interface CompetencyDefinition {
  id: string
  name: string
  description?: string
  category?: string
  levels?: Array<{ level: number; label: string; description: string }>
}

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
  parent_goal_id?: string | null
  created_at: string
  updated_at?: string
}

/** Learning assignment linking a course to a review */
export interface LearningAssignment {
  id: string
  org_id: string
  employee_id: string
  assigned_by: string
  course_id: string
  linked_review_id?: string | null
  linked_goal_id?: string | null
  reason?: string
  due_date?: string
  status: 'assigned' | 'in_progress' | 'completed' | 'overdue'
  created_at: string
}

/** Store slice needed for learning→performance operations */
export interface LearningPerformanceStoreSlice {
  // Learning
  courses: Course[]
  enrollments: Enrollment[]
  learningAssignments?: LearningAssignment[]

  // Performance
  goals: Goal[]
  competencyFramework: CompetencyDefinition[]
  competencyRatings: CompetencyRating[]

  // Mutators
  updateGoal?: (id: string, data: Record<string, unknown>) => void
  addCompetencyRating?: (data: Record<string, unknown>) => void
  updateCompetencyRating?: (id: string, data: Record<string, unknown>) => void
  updateEnrollment?: (id: string, data: Record<string, unknown>) => void
  updateLearningAssignment?: (id: string, data: Record<string, unknown>) => void
  addToast?: (toast: { type: string; title: string; description?: string }) => void
}

// ---------------------------------------------------------------------------
// Course → Competency Mapping
// ---------------------------------------------------------------------------

/**
 * Maps course categories to the competency IDs they develop.
 *
 * This mapping enables automatic competency score updates when an employee
 * completes a course in a relevant category. In production, this would
 * be configurable per org — here we use sensible defaults.
 */
const CATEGORY_TO_COMPETENCY: Record<string, string[]> = {
  // Technical / Engineering
  'technical':            ['comp-tech', 'comp-prob'],
  'technology':           ['comp-tech', 'comp-prob'],
  'engineering':          ['comp-tech', 'comp-prob'],
  'software':             ['comp-tech'],
  'data':                 ['comp-tech', 'comp-prob'],
  'cybersecurity':        ['comp-tech'],
  'cloud':                ['comp-tech'],

  // Leadership & Management
  'leadership':           ['comp-lead', 'comp-strat'],
  'management':           ['comp-lead', 'comp-collab'],
  'strategy':             ['comp-strat', 'comp-lead'],
  'executive':            ['comp-lead', 'comp-strat'],

  // Communication & Soft Skills
  'communication':        ['comp-comm', 'comp-collab'],
  'presentation':         ['comp-comm'],
  'negotiation':          ['comp-comm', 'comp-cust'],
  'writing':              ['comp-comm'],

  // Customer / Client Skills
  'customer-service':     ['comp-cust', 'comp-comm'],
  'sales':                ['comp-cust', 'comp-comm'],
  'relationship-management': ['comp-cust', 'comp-collab'],

  // Problem Solving / Innovation
  'problem-solving':      ['comp-prob', 'comp-adapt'],
  'innovation':           ['comp-prob', 'comp-adapt'],
  'design-thinking':      ['comp-prob', 'comp-adapt'],
  'analytics':            ['comp-prob', 'comp-tech'],

  // Collaboration & Teamwork
  'teamwork':             ['comp-collab', 'comp-comm'],
  'collaboration':        ['comp-collab'],
  'diversity':            ['comp-collab', 'comp-adapt'],

  // Adaptability & Change
  'change-management':    ['comp-adapt', 'comp-lead'],
  'agile':                ['comp-adapt', 'comp-collab'],
  'resilience':           ['comp-adapt'],

  // Compliance & Regulatory
  'compliance':           ['comp-tech'],
  'regulatory':           ['comp-tech'],
  'risk':                 ['comp-prob', 'comp-strat'],

  // Finance & Banking
  'finance':              ['comp-tech', 'comp-prob'],
  'credit':               ['comp-tech', 'comp-prob'],
  'banking':              ['comp-cust', 'comp-tech'],
}

/**
 * Competency boost rules based on course level.
 * Higher-level courses provide a larger competency score boost.
 */
const LEVEL_BOOST: Record<string, number> = {
  beginner:     0.1,
  intermediate: 0.2,
  advanced:     0.3,
}

// ---------------------------------------------------------------------------
// 1. Course Completion → Competency Update
// ---------------------------------------------------------------------------

export interface CompetencyUpdateResult {
  employeeId: string
  courseId: string
  courseTitle: string
  updatedCompetencies: Array<{
    competencyId: string
    competencyName: string
    previousRating: number
    newRating: number
    boost: number
    target: number
    gapClosed: boolean
  }>
  skippedCompetencies: string[]
}

/**
 * When an employee completes a course, calculate competency score improvements.
 *
 * Rules:
 * - Course category maps to one or more competencies
 * - Boost amount depends on course level (beginner=0.1, intermediate=0.2, advanced=0.3)
 * - Rating is capped at the target (no overshooting)
 * - Rating is capped at 5 (max scale)
 * - If the employee already meets/exceeds target for a competency, it's skipped
 */
export function calculateCompetencyBoostFromCourse(
  employeeId: string,
  course: Course,
  competencyRatings: CompetencyRating[],
  competencyFramework: CompetencyDefinition[],
): CompetencyUpdateResult {
  const category = (course.category || '').toLowerCase().replace(/\s+/g, '-')
  const competencyIds = CATEGORY_TO_COMPETENCY[category] || []

  const boost = LEVEL_BOOST[course.level || 'intermediate'] || 0.2

  const employeeRatings = competencyRatings.filter(r => r.employee_id === employeeId)
  const updatedCompetencies: CompetencyUpdateResult['updatedCompetencies'] = []
  const skippedCompetencies: string[] = []

  for (const compId of competencyIds) {
    const existing = employeeRatings.find(r => r.competency_id === compId)
    const framework = competencyFramework.find(f => f.id === compId)
    const compName = framework?.name || compId

    if (!existing) {
      // No existing rating — create a new one starting at the boost value
      updatedCompetencies.push({
        competencyId: compId,
        competencyName: compName,
        previousRating: 0,
        newRating: Math.min(boost, 5),
        boost,
        target: 4, // default target
        gapClosed: false,
      })
      continue
    }

    // Already at or above target — skip
    if (existing.rating >= existing.target) {
      skippedCompetencies.push(compId)
      continue
    }

    // Calculate new rating (capped at target and 5)
    const newRating = Math.min(
      Math.round((existing.rating + boost) * 10) / 10,
      existing.target,
      5,
    )

    if (newRating <= existing.rating) {
      skippedCompetencies.push(compId)
      continue
    }

    updatedCompetencies.push({
      competencyId: compId,
      competencyName: compName,
      previousRating: existing.rating,
      newRating,
      boost: Math.round((newRating - existing.rating) * 10) / 10,
      target: existing.target,
      gapClosed: newRating >= existing.target,
    })
  }

  return {
    employeeId,
    courseId: course.id,
    courseTitle: course.title,
    updatedCompetencies,
    skippedCompetencies,
  }
}

// ---------------------------------------------------------------------------
// 2. Course Completion → Goal Progress Update
// ---------------------------------------------------------------------------

export interface GoalProgressUpdate {
  goalId: string
  goalTitle: string
  previousProgress: number
  newProgress: number
  progressIncrement: number
  completed: boolean
}

/**
 * Find and advance development goals that are related to a completed course.
 *
 * Matching logic:
 * 1. Only goals with category='development' are eligible
 * 2. The goal title or description must mention the course title, category, or
 *    contain keywords that overlap with the course
 * 3. Progress is incremented based on a configurable step (default 15%)
 * 4. Goals reaching 100% are auto-marked as 'completed'
 */
export function calculateGoalProgressFromCourse(
  employeeId: string,
  course: Course,
  goals: Goal[],
  options: { progressIncrement?: number } = {},
): GoalProgressUpdate[] {
  const increment = options.progressIncrement ?? 15

  // Only look at the employee's active development goals
  const employeeGoals = goals.filter(
    g => g.employee_id === employeeId &&
         g.category === 'development' &&
         g.status !== 'completed' &&
         g.progress < 100,
  )

  if (employeeGoals.length === 0) return []

  // Build search terms from the course
  const courseTerms = buildSearchTerms(course.title, course.description, course.category)

  const updates: GoalProgressUpdate[] = []

  for (const goal of employeeGoals) {
    const goalTerms = buildSearchTerms(goal.title, goal.description)

    // Check for meaningful overlap
    const overlap = calculateTermOverlap(courseTerms, goalTerms)
    if (overlap < 0.15) continue // Less than 15% term overlap = not related

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
// 3. Learning-Driven Performance Insights
// ---------------------------------------------------------------------------

export interface SkillGapAnalysis {
  employeeId: string
  totalCompetencies: number
  atTarget: number
  belowTarget: number
  gaps: Array<{
    competencyId: string
    competencyName: string
    currentRating: number
    target: number
    gap: number
    recommendedCourseCategories: string[]
  }>
  overallGapScore: number    // 0-100 where 0 = all at target, 100 = all at 0
  improvementFromLearning: number  // % of gaps closed by completed courses
}

/**
 * Analyze an employee's competency gaps and determine which could be
 * addressed through the learning catalog.
 */
export function analyzeSkillGaps(
  employeeId: string,
  competencyRatings: CompetencyRating[],
  competencyFramework: CompetencyDefinition[],
  completedCourses: Course[],
): SkillGapAnalysis {
  const employeeRatings = competencyRatings.filter(r => r.employee_id === employeeId)

  const gaps: SkillGapAnalysis['gaps'] = []
  let atTarget = 0
  let belowTarget = 0
  let totalGapPoints = 0
  let totalPossibleGap = 0

  for (const rating of employeeRatings) {
    const framework = competencyFramework.find(f => f.id === rating.competency_id)
    const compName = framework?.name || rating.competency_id
    totalPossibleGap += rating.target

    if (rating.rating >= rating.target) {
      atTarget++
    } else {
      belowTarget++
      const gap = rating.target - rating.rating
      totalGapPoints += gap

      // Find course categories that map to this competency
      const recommendedCategories: string[] = []
      for (const [category, compIds] of Object.entries(CATEGORY_TO_COMPETENCY)) {
        if (compIds.includes(rating.competency_id)) {
          recommendedCategories.push(category)
        }
      }

      gaps.push({
        competencyId: rating.competency_id,
        competencyName: compName,
        currentRating: rating.rating,
        target: rating.target,
        gap,
        recommendedCourseCategories: recommendedCategories.slice(0, 5),
      })
    }
  }

  // Calculate how many gaps were partially/fully closed by completed courses
  let gapsAddressed = 0
  for (const course of completedCourses) {
    const category = (course.category || '').toLowerCase().replace(/\s+/g, '-')
    const compIds = CATEGORY_TO_COMPETENCY[category] || []
    for (const compId of compIds) {
      if (gaps.some(g => g.competencyId === compId)) {
        gapsAddressed++
        break // count each course once
      }
    }
  }

  const overallGapScore = totalPossibleGap > 0
    ? Math.round((totalGapPoints / totalPossibleGap) * 100)
    : 0

  const improvementFromLearning = gaps.length > 0
    ? Math.round((gapsAddressed / gaps.length) * 100)
    : 100

  return {
    employeeId,
    totalCompetencies: employeeRatings.length,
    atTarget,
    belowTarget,
    gaps: gaps.sort((a, b) => b.gap - a.gap), // largest gaps first
    overallGapScore,
    improvementFromLearning,
  }
}

// ---------------------------------------------------------------------------
// 4. Review Recommendations → Learning Assignments
// ---------------------------------------------------------------------------

export interface ReviewLearningRecommendation {
  employeeId: string
  reviewId: string
  reviewRating: number
  lowCompetencies: Array<{
    competencyName: string
    rating: number
    suggestedCourseIds: string[]
  }>
  suggestedAssignments: Array<{
    courseId: string
    courseTitle: string
    reason: string
    priority: 'high' | 'medium' | 'low'
  }>
}

/**
 * Given a completed performance review with competency ratings,
 * recommend learning assignments to address weak areas.
 *
 * Rules:
 * - Competency ratings ≤ 2 → high priority learning
 * - Competency ratings = 3 → medium priority
 * - Competency ratings ≥ 4 → no recommendation needed
 * - Matches courses from the catalog by category→competency mapping
 */
export function generateLearningRecommendationsFromReview(
  review: {
    id: string
    employee_id: string
    overall_rating: number | null
    ratings: Record<string, number> | null
  },
  courses: Course[],
  enrollments: Enrollment[],
): ReviewLearningRecommendation {
  const lowCompetencies: ReviewLearningRecommendation['lowCompetencies'] = []
  const suggestedAssignments: ReviewLearningRecommendation['suggestedAssignments'] = []
  const alreadyEnrolled = new Set(
    enrollments
      .filter(e => e.employee_id === review.employee_id && e.status !== 'dropped')
      .map(e => e.course_id),
  )

  if (review.ratings) {
    // Map review rating dimensions to competency IDs
    const DIMENSION_TO_COMPETENCY: Record<string, string> = {
      leadership:    'comp-lead',
      execution:     'comp-tech',
      collaboration: 'comp-collab',
      innovation:    'comp-prob',
      communication: 'comp-comm',
      strategy:      'comp-strat',
      adaptability:  'comp-adapt',
      customer:      'comp-cust',
    }

    for (const [dimension, rating] of Object.entries(review.ratings)) {
      if (rating >= 4) continue // Strong area — no recommendation

      const competencyId = DIMENSION_TO_COMPETENCY[dimension.toLowerCase()] || null
      const priority: 'high' | 'medium' | 'low' = rating <= 2 ? 'high' : 'medium'

      // Find courses that develop this competency
      const matchingCourseIds: string[] = []
      if (competencyId) {
        for (const course of courses) {
          const category = (course.category || '').toLowerCase().replace(/\s+/g, '-')
          const mappedComps = CATEGORY_TO_COMPETENCY[category] || []
          if (mappedComps.includes(competencyId) && !alreadyEnrolled.has(course.id)) {
            matchingCourseIds.push(course.id)
          }
        }
      }

      lowCompetencies.push({
        competencyName: dimension,
        rating,
        suggestedCourseIds: matchingCourseIds,
      })

      // Add course assignments
      for (const courseId of matchingCourseIds.slice(0, 2)) {
        const course = courses.find(c => c.id === courseId)
        if (!course) continue
        // Don't duplicate suggestions
        if (suggestedAssignments.some(a => a.courseId === courseId)) continue

        suggestedAssignments.push({
          courseId,
          courseTitle: course.title,
          reason: `${dimension} rated ${rating}/5 in performance review — development recommended`,
          priority,
        })
      }
    }
  }

  return {
    employeeId: review.employee_id,
    reviewId: review.id,
    reviewRating: review.overall_rating || 0,
    lowCompetencies,
    suggestedAssignments,
  }
}

// ---------------------------------------------------------------------------
// 5. Apply Updates to Store (mutation helpers)
// ---------------------------------------------------------------------------

/**
 * Apply competency boosts to the store after a course completion.
 * Creates new ratings where none exist, updates existing ones.
 */
export function applyCompetencyUpdates(
  result: CompetencyUpdateResult,
  store: LearningPerformanceStoreSlice,
): void {
  for (const update of result.updatedCompetencies) {
    const existing = store.competencyRatings.find(
      r => r.employee_id === result.employeeId && r.competency_id === update.competencyId,
    )

    if (existing && store.updateCompetencyRating) {
      store.updateCompetencyRating(existing.id, {
        rating: update.newRating,
        assessed_date: new Date().toISOString().split('T')[0],
        assessor_id: 'system-learning-integration',
      })
    } else if (!existing && store.addCompetencyRating) {
      store.addCompetencyRating({
        employee_id: result.employeeId,
        competency_id: update.competencyId,
        rating: update.newRating,
        target: update.target,
        assessed_date: new Date().toISOString().split('T')[0],
        assessor_id: 'system-learning-integration',
      })
    }
  }
}

/**
 * Apply goal progress updates to the store.
 */
export function applyGoalProgressUpdates(
  updates: GoalProgressUpdate[],
  store: LearningPerformanceStoreSlice,
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

/**
 * Mark learning assignments as completed when their linked course is done.
 */
export function completeLearningAssignments(
  employeeId: string,
  courseId: string,
  store: LearningPerformanceStoreSlice,
): number {
  const assignments = (store.learningAssignments || []).filter(
    a => a.employee_id === employeeId &&
         a.course_id === courseId &&
         a.status !== 'completed',
  )

  let completed = 0
  for (const assignment of assignments) {
    if (store.updateLearningAssignment) {
      store.updateLearningAssignment(assignment.id, {
        status: 'completed',
      })
      completed++
    }
  }

  return completed
}

// ---------------------------------------------------------------------------
// Internal Helpers
// ---------------------------------------------------------------------------

/** Tokenize text into lowercase terms, removing stopwords */
function buildSearchTerms(...texts: (string | undefined | null)[]): Set<string> {
  const STOPWORDS = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
    'has', 'have', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'can', 'this', 'that', 'it', 'its',
  ])

  const terms = new Set<string>()
  for (const text of texts) {
    if (!text) continue
    const words = text.toLowerCase().replace(/[^a-z0-9\s-]/g, '').split(/\s+/)
    for (const word of words) {
      if (word.length >= 3 && !STOPWORDS.has(word)) {
        terms.add(word)
      }
    }
  }
  return terms
}

/** Calculate Jaccard-like overlap between two term sets */
function calculateTermOverlap(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0
  let intersection = 0
  for (const term of a) {
    if (b.has(term)) intersection++
  }
  const union = a.size + b.size - intersection
  return union > 0 ? intersection / union : 0
}
