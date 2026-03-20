/**
 * Onboarding → Learning Integration
 *
 * When onboarding is initiated for a new hire, auto-enroll them in:
 * - Mandatory compliance courses (anti-harassment, data privacy, workplace safety)
 * - Department-specific training
 * - Company culture/orientation course
 * - Set deadlines based on probation period
 *
 * All integrations are event-driven via the cross-module event bus.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Learning enrollment to be created */
export interface OnboardingEnrollment {
  courseId: string
  courseTitle: string
  category: 'compliance' | 'department' | 'orientation' | 'role_specific'
  priority: 'mandatory' | 'recommended' | 'optional'
  deadlineDaysFromStart: number
  reason: string
}

/** Result of generating onboarding learning enrollments */
export interface OnboardingLearningResult {
  employeeId: string
  employeeName: string
  enrollments: OnboardingEnrollment[]
  totalEnrollments: number
  mandatoryCount: number
  byCategory: Record<string, number>
}

/** Course from the LMS catalog (subset of fields needed) */
export interface LMSCourse {
  id: string
  title: string
  category: string
  is_mandatory?: boolean
  duration_hours?: number
  format?: string
  level?: string
}

/** Store slice needed for onboarding→learning operations */
export interface OnboardingLearningStoreSlice {
  courses: LMSCourse[]
  enrollments: Array<Record<string, unknown>>
  departments: Array<{ id: string; name: string }>
  addEnrollment?: (data: Record<string, unknown>) => void
  addToast?: (toast: { type: string; title: string; description?: string }) => void
}

// ---------------------------------------------------------------------------
// Mandatory compliance course mappings
// ---------------------------------------------------------------------------

/** Course categories that are mandatory for all new hires */
const MANDATORY_CATEGORIES = [
  'compliance',
  'anti-harassment',
  'data-privacy',
  'workplace-safety',
  'security',
  'code-of-conduct',
]

/** Department-specific course category mappings */
const DEPARTMENT_COURSE_CATEGORIES: Record<string, string[]> = {
  engineering: ['technical', 'software', 'cybersecurity', 'agile'],
  product: ['analytics', 'design-thinking', 'strategy'],
  sales: ['sales', 'customer-service', 'negotiation'],
  finance: ['finance', 'compliance', 'risk'],
  hr: ['management', 'compliance', 'communication'],
  marketing: ['communication', 'analytics', 'writing'],
  legal: ['compliance', 'regulatory', 'risk'],
  operations: ['management', 'problem-solving', 'agile'],
}

/** Orientation/culture course categories */
const ORIENTATION_CATEGORIES = ['orientation', 'culture', 'onboarding']

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Default probation period in days (used for deadline calculations) */
const DEFAULT_PROBATION_DAYS = 90

/** Compliance course deadline (days from start) */
const COMPLIANCE_DEADLINE_DAYS = 14

/** Department training deadline (days from start) */
const DEPARTMENT_DEADLINE_DAYS = 30

/** Orientation deadline (days from start) */
const ORIENTATION_DEADLINE_DAYS = 7

// ---------------------------------------------------------------------------
// Core Functions
// ---------------------------------------------------------------------------

/**
 * Determine which courses a new hire should be auto-enrolled in based on
 * their department and role.
 *
 * @param employeeId    - ID of the new employee
 * @param employeeName  - Name of the new employee
 * @param departmentId  - Department ID
 * @param departmentName - Department name (for matching)
 * @param courses       - Available courses from the LMS catalog
 * @param existingEnrollments - Existing enrollments to avoid duplicates
 * @param options       - Optional configuration
 * @returns Structured enrollment result
 */
export function determineOnboardingEnrollments(
  employeeId: string,
  employeeName: string,
  departmentId: string,
  departmentName: string,
  courses: LMSCourse[],
  existingEnrollments: Array<Record<string, unknown>>,
  options: {
    probationDays?: number
    maxEnrollments?: number
  } = {},
): OnboardingLearningResult {
  const probationDays = options.probationDays ?? DEFAULT_PROBATION_DAYS
  const maxEnrollments = options.maxEnrollments ?? 20

  // Build set of already-enrolled course IDs for this employee
  const alreadyEnrolled = new Set(
    existingEnrollments
      .filter(e => (e as Record<string, unknown>).employee_id === employeeId)
      .map(e => (e as Record<string, unknown>).course_id as string),
  )

  const enrollments: OnboardingEnrollment[] = []
  const usedCourseIds = new Set<string>()

  // 1. Mandatory compliance courses
  for (const course of courses) {
    if (usedCourseIds.has(course.id) || alreadyEnrolled.has(course.id)) continue
    const cat = (course.category || '').toLowerCase().replace(/\s+/g, '-')
    const isMandatory = course.is_mandatory || MANDATORY_CATEGORIES.some(mc => cat.includes(mc))

    if (isMandatory) {
      enrollments.push({
        courseId: course.id,
        courseTitle: course.title,
        category: 'compliance',
        priority: 'mandatory',
        deadlineDaysFromStart: COMPLIANCE_DEADLINE_DAYS,
        reason: 'Mandatory compliance training for all new hires',
      })
      usedCourseIds.add(course.id)
    }
  }

  // 2. Company orientation/culture courses
  for (const course of courses) {
    if (usedCourseIds.has(course.id) || alreadyEnrolled.has(course.id)) continue
    const cat = (course.category || '').toLowerCase().replace(/\s+/g, '-')
    const isOrientation = ORIENTATION_CATEGORIES.some(oc => cat.includes(oc))

    if (isOrientation) {
      enrollments.push({
        courseId: course.id,
        courseTitle: course.title,
        category: 'orientation',
        priority: 'mandatory',
        deadlineDaysFromStart: ORIENTATION_DEADLINE_DAYS,
        reason: 'Company orientation and culture onboarding',
      })
      usedCourseIds.add(course.id)
    }
  }

  // 3. Department-specific training
  const deptKey = departmentName.toLowerCase().replace(/[^a-z]/g, '')
  const deptCategories = DEPARTMENT_COURSE_CATEGORIES[deptKey] || []

  for (const course of courses) {
    if (usedCourseIds.has(course.id) || alreadyEnrolled.has(course.id)) continue
    if (enrollments.length >= maxEnrollments) break

    const cat = (course.category || '').toLowerCase().replace(/\s+/g, '-')
    const isDeptRelevant = deptCategories.some(dc => cat.includes(dc))

    if (isDeptRelevant) {
      // Only take beginner/intermediate courses for onboarding
      const level = (course.level || 'beginner').toLowerCase()
      if (level === 'advanced') continue

      enrollments.push({
        courseId: course.id,
        courseTitle: course.title,
        category: 'department',
        priority: 'recommended',
        deadlineDaysFromStart: DEPARTMENT_DEADLINE_DAYS,
        reason: `Department-specific training for ${departmentName}`,
      })
      usedCourseIds.add(course.id)
    }
  }

  // Respect max enrollments
  const finalEnrollments = enrollments.slice(0, maxEnrollments)

  // Count by category
  const byCategory: Record<string, number> = {}
  for (const e of finalEnrollments) {
    byCategory[e.category] = (byCategory[e.category] || 0) + 1
  }

  return {
    employeeId,
    employeeName,
    enrollments: finalEnrollments,
    totalEnrollments: finalEnrollments.length,
    mandatoryCount: finalEnrollments.filter(e => e.priority === 'mandatory').length,
    byCategory,
  }
}

/**
 * Apply onboarding learning enrollments to the store.
 *
 * @param result - Output from determineOnboardingEnrollments
 * @param startDate - Employee start date (for deadline calculation)
 * @param store - Store actions for persisting enrollments
 * @returns Number of enrollments created
 */
export function applyOnboardingEnrollments(
  result: OnboardingLearningResult,
  startDate: string,
  store: OnboardingLearningStoreSlice,
): number {
  let created = 0

  for (const enrollment of result.enrollments) {
    // Calculate deadline
    const deadline = new Date(startDate)
    deadline.setDate(deadline.getDate() + enrollment.deadlineDaysFromStart)
    const deadlineStr = deadline.toISOString().split('T')[0]

    if (store.addEnrollment) {
      store.addEnrollment({
        employee_id: result.employeeId,
        course_id: enrollment.courseId,
        status: 'enrolled',
        progress: 0,
        enrolled_at: new Date().toISOString(),
        due_date: deadlineStr,
        reason: enrollment.reason,
        auto_enrolled: true,
        source: 'onboarding-learning-integration',
      })
      created++
    }
  }

  return created
}
