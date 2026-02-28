// LMS (Learning Management System) Engine
// Course library, auto-enrollment, learning paths, progress tracking,
// compliance training, recommendations, and learning analytics.

import { db, schema } from '@/lib/db'
import { eq, and, desc, asc, sql, count, avg, inArray, isNull, isNotNull, ne, lt, gte } from 'drizzle-orm'

// ============================================================
// Types & Interfaces
// ============================================================

export interface CourseLibraryFilters {
  category?: string
  level?: 'beginner' | 'intermediate' | 'advanced'
  format?: 'online' | 'classroom' | 'blended'
  isMandatory?: boolean
  search?: string
  limit?: number
  offset?: number
}

export interface CourseWithStats {
  id: string
  title: string
  description: string | null
  category: string | null
  durationHours: number | null
  format: string
  level: string
  isMandatory: boolean
  createdAt: Date
  enrollmentCount: number
  completionCount: number
  averageProgress: number
  completionRate: number
}

export interface CourseLibraryResult {
  courses: CourseWithStats[]
  total: number
  filters: CourseLibraryFilters
}

export interface AutoEnrollRule {
  id?: string
  name: string
  description?: string
  departmentId?: string | null
  role?: string | null
  jobTitle?: string | null
  courseIds: string[]
  triggerEvent: 'new_hire' | 'role_change' | 'department_change' | 'manual'
  isActive: boolean
}

export interface AutoEnrollRuleRecord extends AutoEnrollRule {
  id: string
  orgId: string
  createdAt: string
}

export interface AutoEnrollmentResult {
  ruleId: string
  ruleName: string
  enrollmentsCreated: number
  employeesProcessed: number
  errors: string[]
}

export interface LearningPath {
  id?: string
  name: string
  description?: string
  courseIds: string[]
  targetRoles?: string[]
  estimatedHours?: number
  isPublished?: boolean
}

export interface LearningPathRecord extends LearningPath {
  id: string
  orgId: string
  createdAt: string
  courses: LearningPathCourse[]
}

export interface LearningPathCourse {
  courseId: string
  title: string
  order: number
  durationHours: number | null
  level: string
  isCompleted?: boolean
  progress?: number
}

export interface EmployeeLearningProfile {
  employeeId: string
  employeeName: string
  email: string
  departmentId: string | null
  activeCourses: EnrollmentDetail[]
  completedCourses: EnrollmentDetail[]
  droppedCourses: EnrollmentDetail[]
  totalCoursesCompleted: number
  totalCoursesActive: number
  totalHoursCompleted: number
  totalHoursInProgress: number
  averageProgress: number
  certificationsEarned: CertificationRecord[]
  complianceStatus: 'compliant' | 'at_risk' | 'non_compliant'
  learningStreak: number
}

export interface EnrollmentDetail {
  enrollmentId: string
  courseId: string
  courseTitle: string
  category: string | null
  format: string
  level: string
  isMandatory: boolean
  durationHours: number | null
  status: string
  progress: number
  enrolledAt: Date
  completedAt: Date | null
}

export interface CertificationRecord {
  courseId: string
  courseTitle: string
  completedAt: Date
  category: string | null
}

export interface ComplianceDepartmentStatus {
  departmentId: string | null
  departmentName: string
  totalEmployees: number
  mandatoryCourses: ComplianceCourseStatus[]
  overallCompletionRate: number
  overdueCount: number
}

export interface ComplianceCourseStatus {
  courseId: string
  courseTitle: string
  totalRequired: number
  completed: number
  inProgress: number
  notStarted: number
  overdue: number
  completionRate: number
}

export interface ComplianceTrainingResult {
  orgId: string
  generatedAt: string
  totalMandatoryCourses: number
  overallCompletionRate: number
  totalOverdue: number
  departmentBreakdown: ComplianceDepartmentStatus[]
  overdueEmployees: OverdueEmployee[]
}

export interface OverdueEmployee {
  employeeId: string
  employeeName: string
  email: string
  departmentId: string | null
  overdueCourses: { courseId: string; courseTitle: string; enrolledAt: Date }[]
}

export interface CourseRecommendation {
  courseId: string
  courseTitle: string
  description: string | null
  category: string | null
  level: string
  format: string
  durationHours: number | null
  reason: string
  score: number
}

export interface LearningMetrics {
  orgId: string
  generatedAt: string
  overview: {
    totalCourses: number
    totalEnrollments: number
    totalCompletions: number
    totalActiveEnrollments: number
    overallCompletionRate: number
    averageTimeToCompleteHours: number
  }
  popularCourses: {
    courseId: string
    courseTitle: string
    enrollmentCount: number
    completionCount: number
    completionRate: number
    averageProgress: number
  }[]
  departmentEngagement: {
    departmentId: string | null
    departmentName: string
    totalEmployees: number
    enrolledEmployees: number
    enrollmentRate: number
    completionRate: number
    averageProgress: number
  }[]
  completionTrends: {
    month: string
    completions: number
    enrollments: number
  }[]
  formatBreakdown: {
    format: string
    count: number
    completionRate: number
  }[]
  levelBreakdown: {
    level: string
    count: number
    completionRate: number
  }[]
}

// ============================================================
// In-memory stores for rules and learning paths
// (Not in schema; stored as application-level config)
// ============================================================

const autoEnrollRulesStore = new Map<string, AutoEnrollRuleRecord[]>()
const learningPathsStore = new Map<string, LearningPathRecord[]>()

function generateId(): string {
  return crypto.randomUUID()
}

// ============================================================
// 1. Course Library
// ============================================================

export async function getCourseLibrary(
  orgId: string,
  filters: CourseLibraryFilters = {}
): Promise<CourseLibraryResult> {
  try {
    const conditions = [eq(schema.courses.orgId, orgId)]

    if (filters.category) {
      conditions.push(eq(schema.courses.category, filters.category))
    }
    if (filters.level) {
      conditions.push(eq(schema.courses.level, filters.level))
    }
    if (filters.format) {
      conditions.push(eq(schema.courses.format, filters.format))
    }
    if (filters.isMandatory !== undefined) {
      conditions.push(eq(schema.courses.isMandatory, filters.isMandatory))
    }

    // Fetch courses matching filters
    let coursesQuery = db
      .select()
      .from(schema.courses)
      .where(and(...conditions))
      .orderBy(desc(schema.courses.createdAt))

    const allCourses = await coursesQuery

    // Apply text search filter in application layer
    let filteredCourses = allCourses
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filteredCourses = allCourses.filter(
        (c) =>
          c.title.toLowerCase().includes(searchLower) ||
          (c.description && c.description.toLowerCase().includes(searchLower)) ||
          (c.category && c.category.toLowerCase().includes(searchLower))
      )
    }

    const total = filteredCourses.length

    // Apply pagination
    const offset = filters.offset ?? 0
    const limit = filters.limit ?? 50
    const paginatedCourses = filteredCourses.slice(offset, offset + limit)

    if (paginatedCourses.length === 0) {
      return { courses: [], total, filters }
    }

    // Fetch enrollment stats for the paginated courses
    const courseIds = paginatedCourses.map((c) => c.id)
    const enrollments = await db
      .select()
      .from(schema.enrollments)
      .where(
        and(
          eq(schema.enrollments.orgId, orgId),
          inArray(schema.enrollments.courseId, courseIds)
        )
      )

    // Build stats per course
    const statsMap = new Map<
      string,
      { enrollmentCount: number; completionCount: number; totalProgress: number }
    >()

    for (const enrollment of enrollments) {
      const stats = statsMap.get(enrollment.courseId) ?? {
        enrollmentCount: 0,
        completionCount: 0,
        totalProgress: 0,
      }
      stats.enrollmentCount++
      if (enrollment.status === 'completed') {
        stats.completionCount++
      }
      stats.totalProgress += enrollment.progress
      statsMap.set(enrollment.courseId, stats)
    }

    const coursesWithStats: CourseWithStats[] = paginatedCourses.map((course) => {
      const stats = statsMap.get(course.id) ?? {
        enrollmentCount: 0,
        completionCount: 0,
        totalProgress: 0,
      }
      return {
        id: course.id,
        title: course.title,
        description: course.description,
        category: course.category,
        durationHours: course.durationHours,
        format: course.format,
        level: course.level,
        isMandatory: course.isMandatory,
        createdAt: course.createdAt,
        enrollmentCount: stats.enrollmentCount,
        completionCount: stats.completionCount,
        averageProgress:
          stats.enrollmentCount > 0
            ? Math.round(stats.totalProgress / stats.enrollmentCount)
            : 0,
        completionRate:
          stats.enrollmentCount > 0
            ? Math.round((stats.completionCount / stats.enrollmentCount) * 100)
            : 0,
      }
    })

    return { courses: coursesWithStats, total, filters }
  } catch (error) {
    console.error('[LMS] Failed to fetch course library:', error)
    return { courses: [], total: 0, filters }
  }
}

// ============================================================
// 2. Auto-Enrollment Rules
// ============================================================

export async function createAutoEnrollRule(
  orgId: string,
  rule: AutoEnrollRule
): Promise<AutoEnrollRuleRecord> {
  try {
    const record: AutoEnrollRuleRecord = {
      ...rule,
      id: rule.id ?? generateId(),
      orgId,
      createdAt: new Date().toISOString(),
    }

    const existing = autoEnrollRulesStore.get(orgId) ?? []
    existing.push(record)
    autoEnrollRulesStore.set(orgId, existing)

    return record
  } catch (error) {
    console.error('[LMS] Failed to create auto-enroll rule:', error)
    throw new Error('Failed to create auto-enrollment rule')
  }
}

export async function getAutoEnrollRules(orgId: string): Promise<AutoEnrollRuleRecord[]> {
  return autoEnrollRulesStore.get(orgId) ?? []
}

export async function deleteAutoEnrollRule(orgId: string, ruleId: string): Promise<boolean> {
  const rules = autoEnrollRulesStore.get(orgId) ?? []
  const filtered = rules.filter((r) => r.id !== ruleId)
  if (filtered.length === rules.length) return false
  autoEnrollRulesStore.set(orgId, filtered)
  return true
}

export async function processAutoEnrollments(
  orgId: string
): Promise<AutoEnrollmentResult[]> {
  const results: AutoEnrollmentResult[] = []

  try {
    const rules = autoEnrollRulesStore.get(orgId) ?? []
    const activeRules = rules.filter((r) => r.isActive)

    if (activeRules.length === 0) {
      return results
    }

    // Fetch all active employees for the org
    const employees = await db
      .select()
      .from(schema.employees)
      .where(and(eq(schema.employees.orgId, orgId), eq(schema.employees.isActive, true)))

    // Fetch all existing enrollments for the org
    const existingEnrollments = await db
      .select()
      .from(schema.enrollments)
      .where(eq(schema.enrollments.orgId, orgId))

    const enrollmentSet = new Set(
      existingEnrollments.map((e) => `${e.employeeId}:${e.courseId}`)
    )

    for (const rule of activeRules) {
      const ruleResult: AutoEnrollmentResult = {
        ruleId: rule.id,
        ruleName: rule.name,
        enrollmentsCreated: 0,
        employeesProcessed: 0,
        errors: [],
      }

      // Filter employees matching the rule criteria
      const matchingEmployees = employees.filter((emp) => {
        if (rule.departmentId && emp.departmentId !== rule.departmentId) return false
        if (rule.role && emp.role !== rule.role) return false
        if (rule.jobTitle && emp.jobTitle !== rule.jobTitle) return false
        return true
      })

      ruleResult.employeesProcessed = matchingEmployees.length

      for (const employee of matchingEmployees) {
        for (const courseId of rule.courseIds) {
          const key = `${employee.id}:${courseId}`
          if (enrollmentSet.has(key)) continue // Already enrolled

          try {
            await db.insert(schema.enrollments).values({
              orgId,
              employeeId: employee.id,
              courseId,
              status: 'enrolled',
              progress: 0,
            })
            enrollmentSet.add(key)
            ruleResult.enrollmentsCreated++
          } catch (err) {
            ruleResult.errors.push(
              `Failed to enroll employee ${employee.id} in course ${courseId}: ${err instanceof Error ? err.message : String(err)}`
            )
          }
        }
      }

      results.push(ruleResult)
    }

    return results
  } catch (error) {
    console.error('[LMS] Failed to process auto-enrollments:', error)
    throw new Error('Failed to process auto-enrollments')
  }
}

// ============================================================
// 3. Learning Paths
// ============================================================

export async function createLearningPath(
  orgId: string,
  path: LearningPath
): Promise<LearningPathRecord> {
  try {
    // Validate that the referenced courses exist
    const courses = await db
      .select()
      .from(schema.courses)
      .where(
        and(
          eq(schema.courses.orgId, orgId),
          inArray(schema.courses.id, path.courseIds)
        )
      )

    const courseMap = new Map(courses.map((c) => [c.id, c]))
    const pathCourses: LearningPathCourse[] = path.courseIds.map((courseId, index) => {
      const course = courseMap.get(courseId)
      return {
        courseId,
        title: course?.title ?? 'Unknown Course',
        order: index + 1,
        durationHours: course?.durationHours ?? null,
        level: course?.level ?? 'beginner',
      }
    })

    const estimatedHours =
      path.estimatedHours ??
      pathCourses.reduce((sum, c) => sum + (c.durationHours ?? 0), 0)

    const record: LearningPathRecord = {
      ...path,
      id: path.id ?? generateId(),
      orgId,
      estimatedHours,
      isPublished: path.isPublished ?? false,
      createdAt: new Date().toISOString(),
      courses: pathCourses,
    }

    const existing = learningPathsStore.get(orgId) ?? []
    existing.push(record)
    learningPathsStore.set(orgId, existing)

    return record
  } catch (error) {
    console.error('[LMS] Failed to create learning path:', error)
    throw new Error('Failed to create learning path')
  }
}

export async function getLearningPaths(orgId: string): Promise<LearningPathRecord[]> {
  try {
    const paths = learningPathsStore.get(orgId) ?? []

    // Refresh course data in case titles or details changed
    if (paths.length === 0) return paths

    const allCourseIds = [...new Set(paths.flatMap((p) => p.courseIds))]
    if (allCourseIds.length === 0) return paths

    const courses = await db
      .select()
      .from(schema.courses)
      .where(
        and(
          eq(schema.courses.orgId, orgId),
          inArray(schema.courses.id, allCourseIds)
        )
      )

    const courseMap = new Map(courses.map((c) => [c.id, c]))

    return paths.map((path) => ({
      ...path,
      courses: path.courseIds.map((courseId, index) => {
        const course = courseMap.get(courseId)
        return {
          courseId,
          title: course?.title ?? 'Unknown Course',
          order: index + 1,
          durationHours: course?.durationHours ?? null,
          level: course?.level ?? 'beginner',
        }
      }),
    }))
  } catch (error) {
    console.error('[LMS] Failed to fetch learning paths:', error)
    return []
  }
}

export async function getLearningPathProgress(
  orgId: string,
  pathId: string,
  employeeId: string
): Promise<LearningPathRecord | null> {
  try {
    const paths = learningPathsStore.get(orgId) ?? []
    const path = paths.find((p) => p.id === pathId)
    if (!path) return null

    // Get employee enrollments for the path's courses
    const enrollments = await db
      .select()
      .from(schema.enrollments)
      .where(
        and(
          eq(schema.enrollments.orgId, orgId),
          eq(schema.enrollments.employeeId, employeeId),
          inArray(schema.enrollments.courseId, path.courseIds)
        )
      )

    const enrollmentMap = new Map(enrollments.map((e) => [e.courseId, e]))

    const courses = await db
      .select()
      .from(schema.courses)
      .where(
        and(
          eq(schema.courses.orgId, orgId),
          inArray(schema.courses.id, path.courseIds)
        )
      )

    const courseMap = new Map(courses.map((c) => [c.id, c]))

    const pathCourses: LearningPathCourse[] = path.courseIds.map((courseId, index) => {
      const course = courseMap.get(courseId)
      const enrollment = enrollmentMap.get(courseId)
      return {
        courseId,
        title: course?.title ?? 'Unknown Course',
        order: index + 1,
        durationHours: course?.durationHours ?? null,
        level: course?.level ?? 'beginner',
        isCompleted: enrollment?.status === 'completed',
        progress: enrollment?.progress ?? 0,
      }
    })

    return { ...path, courses: pathCourses }
  } catch (error) {
    console.error('[LMS] Failed to get learning path progress:', error)
    return null
  }
}

// ============================================================
// 4. Progress Tracking
// ============================================================

export async function updateProgress(
  orgId: string,
  enrollmentId: string,
  progress: number
): Promise<EnrollmentDetail | null> {
  try {
    const clampedProgress = Math.max(0, Math.min(100, Math.round(progress)))

    const newStatus =
      clampedProgress >= 100 ? 'completed' : clampedProgress > 0 ? 'in_progress' : 'enrolled'

    const updateValues: Record<string, unknown> = {
      progress: clampedProgress,
      status: newStatus,
    }

    if (clampedProgress >= 100) {
      updateValues.completedAt = new Date()
    }

    await db
      .update(schema.enrollments)
      .set(updateValues)
      .where(
        and(
          eq(schema.enrollments.id, enrollmentId),
          eq(schema.enrollments.orgId, orgId)
        )
      )

    // Fetch the updated enrollment with course details
    const enrollments = await db
      .select()
      .from(schema.enrollments)
      .where(
        and(
          eq(schema.enrollments.id, enrollmentId),
          eq(schema.enrollments.orgId, orgId)
        )
      )

    if (enrollments.length === 0) return null

    const enrollment = enrollments[0]
    const courses = await db
      .select()
      .from(schema.courses)
      .where(eq(schema.courses.id, enrollment.courseId))

    const course = courses[0]

    return {
      enrollmentId: enrollment.id,
      courseId: enrollment.courseId,
      courseTitle: course?.title ?? 'Unknown',
      category: course?.category ?? null,
      format: course?.format ?? 'online',
      level: course?.level ?? 'beginner',
      isMandatory: course?.isMandatory ?? false,
      durationHours: course?.durationHours ?? null,
      status: enrollment.status,
      progress: enrollment.progress,
      enrolledAt: enrollment.enrolledAt,
      completedAt: enrollment.completedAt,
    }
  } catch (error) {
    console.error('[LMS] Failed to update progress:', error)
    return null
  }
}

export async function getEmployeeLearningProfile(
  orgId: string,
  employeeId: string
): Promise<EmployeeLearningProfile | null> {
  try {
    // Fetch employee
    const employees = await db
      .select()
      .from(schema.employees)
      .where(
        and(
          eq(schema.employees.id, employeeId),
          eq(schema.employees.orgId, orgId)
        )
      )

    if (employees.length === 0) return null
    const employee = employees[0]

    // Fetch all enrollments for this employee
    const enrollments = await db
      .select()
      .from(schema.enrollments)
      .where(
        and(
          eq(schema.enrollments.orgId, orgId),
          eq(schema.enrollments.employeeId, employeeId)
        )
      )
      .orderBy(desc(schema.enrollments.enrolledAt))

    // Fetch all related courses
    const courseIds = [...new Set(enrollments.map((e) => e.courseId))]

    let courseMap = new Map<string, (typeof schema.courses.$inferSelect)>()
    if (courseIds.length > 0) {
      const courses = await db
        .select()
        .from(schema.courses)
        .where(inArray(schema.courses.id, courseIds))

      courseMap = new Map(courses.map((c) => [c.id, c]))
    }

    // Build enrollment details
    const toDetail = (enrollment: typeof enrollments[number]): EnrollmentDetail => {
      const course = courseMap.get(enrollment.courseId)
      return {
        enrollmentId: enrollment.id,
        courseId: enrollment.courseId,
        courseTitle: course?.title ?? 'Unknown',
        category: course?.category ?? null,
        format: course?.format ?? 'online',
        level: course?.level ?? 'beginner',
        isMandatory: course?.isMandatory ?? false,
        durationHours: course?.durationHours ?? null,
        status: enrollment.status,
        progress: enrollment.progress,
        enrolledAt: enrollment.enrolledAt,
        completedAt: enrollment.completedAt,
      }
    }

    const activeCourses = enrollments
      .filter((e) => e.status === 'enrolled' || e.status === 'in_progress')
      .map(toDetail)

    const completedCourses = enrollments
      .filter((e) => e.status === 'completed')
      .map(toDetail)

    const droppedCourses = enrollments
      .filter((e) => e.status === 'dropped')
      .map(toDetail)

    // Calculate totals
    const totalHoursCompleted = completedCourses.reduce(
      (sum, c) => sum + (c.durationHours ?? 0),
      0
    )
    const totalHoursInProgress = activeCourses.reduce(
      (sum, c) => sum + (c.durationHours ?? 0),
      0
    )
    const allActiveProgress = activeCourses.map((c) => c.progress)
    const averageProgress =
      allActiveProgress.length > 0
        ? Math.round(
            allActiveProgress.reduce((a, b) => a + b, 0) / allActiveProgress.length
          )
        : 0

    // Build certifications from completed mandatory courses
    const certificationsEarned: CertificationRecord[] = completedCourses
      .filter((c) => c.isMandatory || c.status === 'completed')
      .map((c) => ({
        courseId: c.courseId,
        courseTitle: c.courseTitle,
        completedAt: c.completedAt ?? c.enrolledAt,
        category: c.category,
      }))

    // Check mandatory course compliance
    const mandatoryCourses = await db
      .select()
      .from(schema.courses)
      .where(
        and(
          eq(schema.courses.orgId, orgId),
          eq(schema.courses.isMandatory, true)
        )
      )

    const completedCourseIds = new Set(completedCourses.map((c) => c.courseId))
    const activeCourseIds = new Set(activeCourses.map((c) => c.courseId))
    const mandatoryNotCompleted = mandatoryCourses.filter(
      (c) => !completedCourseIds.has(c.id)
    )
    const mandatoryInProgress = mandatoryNotCompleted.filter((c) =>
      activeCourseIds.has(c.id)
    )

    let complianceStatus: 'compliant' | 'at_risk' | 'non_compliant' = 'compliant'
    if (mandatoryNotCompleted.length > 0) {
      complianceStatus =
        mandatoryInProgress.length === mandatoryNotCompleted.length
          ? 'at_risk'
          : 'non_compliant'
    }

    // Simple learning streak: count consecutive months with a completion
    let learningStreak = 0
    if (completedCourses.length > 0) {
      const now = new Date()
      const completedDates = completedCourses
        .map((c) => c.completedAt ?? c.enrolledAt)
        .sort((a, b) => b.getTime() - a.getTime())

      let currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      for (const completedDate of completedDates) {
        const completionMonth = new Date(
          completedDate.getFullYear(),
          completedDate.getMonth(),
          1
        )
        if (completionMonth.getTime() === currentMonth.getTime()) {
          learningStreak++
          currentMonth = new Date(
            currentMonth.getFullYear(),
            currentMonth.getMonth() - 1,
            1
          )
        } else if (completionMonth < currentMonth) {
          break
        }
      }
    }

    return {
      employeeId: employee.id,
      employeeName: employee.fullName,
      email: employee.email,
      departmentId: employee.departmentId,
      activeCourses,
      completedCourses,
      droppedCourses,
      totalCoursesCompleted: completedCourses.length,
      totalCoursesActive: activeCourses.length,
      totalHoursCompleted,
      totalHoursInProgress,
      averageProgress,
      certificationsEarned,
      complianceStatus,
      learningStreak,
    }
  } catch (error) {
    console.error('[LMS] Failed to get employee learning profile:', error)
    return null
  }
}

// ============================================================
// 5. Compliance Training
// ============================================================

export async function getComplianceTrainingStatus(
  orgId: string
): Promise<ComplianceTrainingResult> {
  try {
    // Fetch mandatory courses
    const mandatoryCourses = await db
      .select()
      .from(schema.courses)
      .where(
        and(eq(schema.courses.orgId, orgId), eq(schema.courses.isMandatory, true))
      )

    if (mandatoryCourses.length === 0) {
      return {
        orgId,
        generatedAt: new Date().toISOString(),
        totalMandatoryCourses: 0,
        overallCompletionRate: 100,
        totalOverdue: 0,
        departmentBreakdown: [],
        overdueEmployees: [],
      }
    }

    const mandatoryCourseIds = mandatoryCourses.map((c) => c.id)
    const courseMap = new Map(mandatoryCourses.map((c) => [c.id, c]))

    // Fetch all active employees
    const employees = await db
      .select()
      .from(schema.employees)
      .where(and(eq(schema.employees.orgId, orgId), eq(schema.employees.isActive, true)))

    // Fetch departments
    const departments = await db
      .select()
      .from(schema.departments)
      .where(eq(schema.departments.orgId, orgId))

    const deptMap = new Map(departments.map((d) => [d.id, d]))

    // Fetch enrollments for mandatory courses
    const enrollments = await db
      .select()
      .from(schema.enrollments)
      .where(
        and(
          eq(schema.enrollments.orgId, orgId),
          inArray(schema.enrollments.courseId, mandatoryCourseIds)
        )
      )

    // Build enrollment lookup: employeeId:courseId -> enrollment
    const enrollmentLookup = new Map<string, typeof enrollments[number]>()
    for (const e of enrollments) {
      enrollmentLookup.set(`${e.employeeId}:${e.courseId}`, e)
    }

    // 30 days threshold for overdue (enrolled but not completed within 30 days)
    const overdueThreshold = new Date()
    overdueThreshold.setDate(overdueThreshold.getDate() - 30)

    // Calculate department-level compliance
    const deptEmployees = new Map<string, typeof employees>()
    for (const emp of employees) {
      const deptKey = emp.departmentId ?? '__no_dept__'
      const list = deptEmployees.get(deptKey) ?? []
      list.push(emp)
      deptEmployees.set(deptKey, list)
    }

    const departmentBreakdown: ComplianceDepartmentStatus[] = []
    const overdueEmployeeMap = new Map<
      string,
      { employee: typeof employees[number]; courses: { courseId: string; courseTitle: string; enrolledAt: Date }[] }
    >()

    let totalRequired = 0
    let totalCompleted = 0
    let totalOverdue = 0

    for (const [deptKey, deptEmps] of deptEmployees) {
      const deptName =
        deptKey === '__no_dept__'
          ? 'Unassigned'
          : deptMap.get(deptKey)?.name ?? 'Unknown'

      const mandatoryCourseStatuses: ComplianceCourseStatus[] = []
      let deptTotalReq = 0
      let deptTotalComp = 0
      let deptOverdue = 0

      for (const course of mandatoryCourses) {
        let completed = 0
        let inProgress = 0
        let notStarted = 0
        let overdue = 0

        for (const emp of deptEmps) {
          const enrollment = enrollmentLookup.get(`${emp.id}:${course.id}`)

          if (!enrollment) {
            notStarted++
            // Not enrolled in a mandatory course counts as overdue
            overdue++
          } else if (enrollment.status === 'completed') {
            completed++
          } else if (
            enrollment.status === 'in_progress' ||
            enrollment.status === 'enrolled'
          ) {
            inProgress++
            // Check if overdue based on enrollment date
            if (enrollment.enrolledAt < overdueThreshold) {
              overdue++
              // Track overdue employee
              const existing = overdueEmployeeMap.get(emp.id) ?? {
                employee: emp,
                courses: [],
              }
              existing.courses.push({
                courseId: course.id,
                courseTitle: course.title,
                enrolledAt: enrollment.enrolledAt,
              })
              overdueEmployeeMap.set(emp.id, existing)
            }
          } else if (enrollment.status === 'dropped') {
            notStarted++
            overdue++
          }
        }

        const totalReq = deptEmps.length
        const completionRate =
          totalReq > 0 ? Math.round((completed / totalReq) * 100) : 0

        mandatoryCourseStatuses.push({
          courseId: course.id,
          courseTitle: course.title,
          totalRequired: totalReq,
          completed,
          inProgress,
          notStarted,
          overdue,
          completionRate,
        })

        deptTotalReq += totalReq
        deptTotalComp += completed
        deptOverdue += overdue
      }

      totalRequired += deptTotalReq
      totalCompleted += deptTotalComp
      totalOverdue += deptOverdue

      departmentBreakdown.push({
        departmentId: deptKey === '__no_dept__' ? null : deptKey,
        departmentName: deptName,
        totalEmployees: deptEmps.length,
        mandatoryCourses: mandatoryCourseStatuses,
        overallCompletionRate:
          deptTotalReq > 0 ? Math.round((deptTotalComp / deptTotalReq) * 100) : 0,
        overdueCount: deptOverdue,
      })
    }

    // Also track employees not enrolled in mandatory courses at all as overdue
    for (const emp of employees) {
      for (const course of mandatoryCourses) {
        const enrollment = enrollmentLookup.get(`${emp.id}:${course.id}`)
        if (!enrollment) {
          const existing = overdueEmployeeMap.get(emp.id) ?? {
            employee: emp,
            courses: [],
          }
          // Avoid duplicate entries
          if (!existing.courses.find((c) => c.courseId === course.id)) {
            existing.courses.push({
              courseId: course.id,
              courseTitle: course.title,
              enrolledAt: new Date(), // placeholder: not enrolled
            })
          }
          overdueEmployeeMap.set(emp.id, existing)
        }
      }
    }

    const overdueEmployees: OverdueEmployee[] = Array.from(
      overdueEmployeeMap.values()
    ).map(({ employee, courses }) => ({
      employeeId: employee.id,
      employeeName: employee.fullName,
      email: employee.email,
      departmentId: employee.departmentId,
      overdueCourses: courses,
    }))

    return {
      orgId,
      generatedAt: new Date().toISOString(),
      totalMandatoryCourses: mandatoryCourses.length,
      overallCompletionRate:
        totalRequired > 0 ? Math.round((totalCompleted / totalRequired) * 100) : 100,
      totalOverdue,
      departmentBreakdown,
      overdueEmployees,
    }
  } catch (error) {
    console.error('[LMS] Failed to get compliance training status:', error)
    return {
      orgId,
      generatedAt: new Date().toISOString(),
      totalMandatoryCourses: 0,
      overallCompletionRate: 0,
      totalOverdue: 0,
      departmentBreakdown: [],
      overdueEmployees: [],
    }
  }
}

// ============================================================
// 6. Course Recommendations
// ============================================================

export async function recommendCourses(
  orgId: string,
  employeeId: string
): Promise<CourseRecommendation[]> {
  try {
    // Fetch the employee
    const employees = await db
      .select()
      .from(schema.employees)
      .where(
        and(eq(schema.employees.id, employeeId), eq(schema.employees.orgId, orgId))
      )

    if (employees.length === 0) return []
    const employee = employees[0]

    // Fetch all courses in the org
    const allCourses = await db
      .select()
      .from(schema.courses)
      .where(eq(schema.courses.orgId, orgId))

    // Fetch employee's enrollments
    const enrollments = await db
      .select()
      .from(schema.enrollments)
      .where(
        and(
          eq(schema.enrollments.orgId, orgId),
          eq(schema.enrollments.employeeId, employeeId)
        )
      )

    const enrolledCourseIds = new Set(enrollments.map((e) => e.courseId))
    const completedCourseIds = new Set(
      enrollments.filter((e) => e.status === 'completed').map((e) => e.courseId)
    )

    // Fetch enrollment popularity across the org
    const allEnrollments = await db
      .select()
      .from(schema.enrollments)
      .where(eq(schema.enrollments.orgId, orgId))

    const coursePopularity = new Map<string, number>()
    for (const e of allEnrollments) {
      coursePopularity.set(e.courseId, (coursePopularity.get(e.courseId) ?? 0) + 1)
    }

    // Fetch peers in same department for collaborative filtering
    let peerCompletedCourses = new Set<string>()
    if (employee.departmentId) {
      const peers = await db
        .select()
        .from(schema.employees)
        .where(
          and(
            eq(schema.employees.orgId, orgId),
            eq(schema.employees.departmentId, employee.departmentId),
            eq(schema.employees.isActive, true),
            ne(schema.employees.id, employeeId)
          )
        )

      const peerIds = peers.map((p) => p.id)
      if (peerIds.length > 0) {
        const peerEnrollments = await db
          .select()
          .from(schema.enrollments)
          .where(
            and(
              eq(schema.enrollments.orgId, orgId),
              inArray(schema.enrollments.employeeId, peerIds),
              eq(schema.enrollments.status, 'completed')
            )
          )

        peerCompletedCourses = new Set(peerEnrollments.map((e) => e.courseId))
      }
    }

    // Build completed categories and levels for the employee
    const completedCourseDetails = allCourses.filter((c) =>
      completedCourseIds.has(c.id)
    )
    const completedCategories = new Set(
      completedCourseDetails.map((c) => c.category).filter(Boolean)
    )
    const completedLevels = new Set(
      completedCourseDetails.map((c) => c.level)
    )

    // Score each unenrolled course
    const recommendations: CourseRecommendation[] = []

    for (const course of allCourses) {
      // Skip already enrolled courses
      if (enrolledCourseIds.has(course.id)) continue

      let score = 0
      const reasons: string[] = []

      // Mandatory courses get highest priority
      if (course.isMandatory) {
        score += 50
        reasons.push('Required compliance training')
      }

      // Peers in the same department completed this course
      if (peerCompletedCourses.has(course.id)) {
        score += 30
        reasons.push('Popular with your team')
      }

      // Same category as completed courses (skill development path)
      if (course.category && completedCategories.has(course.category)) {
        score += 20
        reasons.push(`Builds on your ${course.category} skills`)
      }

      // Level progression: suggest next level up
      if (completedLevels.has('beginner') && course.level === 'intermediate') {
        score += 15
        reasons.push('Next skill level')
      } else if (
        completedLevels.has('intermediate') &&
        course.level === 'advanced'
      ) {
        score += 15
        reasons.push('Advanced level for your experience')
      }

      // Course popularity boost
      const popularity = coursePopularity.get(course.id) ?? 0
      if (popularity >= 10) {
        score += 10
        reasons.push('Highly popular across the organization')
      } else if (popularity >= 5) {
        score += 5
        reasons.push('Popular course')
      }

      // Beginner courses for employees with no completions in a category
      if (
        completedCourseDetails.length === 0 &&
        course.level === 'beginner'
      ) {
        score += 10
        reasons.push('Great starting point')
      }

      // Only include courses with a meaningful score
      if (score > 0) {
        recommendations.push({
          courseId: course.id,
          courseTitle: course.title,
          description: course.description,
          category: course.category,
          level: course.level,
          format: course.format,
          durationHours: course.durationHours,
          reason: reasons[0] ?? 'Recommended for you',
          score,
        })
      }
    }

    // Sort by score descending and return top results
    recommendations.sort((a, b) => b.score - a.score)
    return recommendations.slice(0, 10)
  } catch (error) {
    console.error('[LMS] Failed to generate course recommendations:', error)
    return []
  }
}

// ============================================================
// 7. Learning Analytics
// ============================================================

export async function getLearningMetrics(orgId: string): Promise<LearningMetrics> {
  try {
    // Fetch all courses and enrollments
    const [allCourses, allEnrollments, allEmployees, allDepartments] =
      await Promise.all([
        db
          .select()
          .from(schema.courses)
          .where(eq(schema.courses.orgId, orgId)),
        db
          .select()
          .from(schema.enrollments)
          .where(eq(schema.enrollments.orgId, orgId)),
        db
          .select()
          .from(schema.employees)
          .where(
            and(
              eq(schema.employees.orgId, orgId),
              eq(schema.employees.isActive, true)
            )
          ),
        db
          .select()
          .from(schema.departments)
          .where(eq(schema.departments.orgId, orgId)),
      ])

    const courseMap = new Map(allCourses.map((c) => [c.id, c]))
    const deptMap = new Map(allDepartments.map((d) => [d.id, d]))

    // Overview metrics
    const totalCourses = allCourses.length
    const totalEnrollments = allEnrollments.length
    const completedEnrollments = allEnrollments.filter(
      (e) => e.status === 'completed'
    )
    const activeEnrollments = allEnrollments.filter(
      (e) => e.status === 'enrolled' || e.status === 'in_progress'
    )
    const totalCompletions = completedEnrollments.length
    const overallCompletionRate =
      totalEnrollments > 0
        ? Math.round((totalCompletions / totalEnrollments) * 100)
        : 0

    // Average time to complete (in hours, based on course duration for completed enrollments)
    let totalCompletionHours = 0
    let completionHoursCount = 0
    for (const enrollment of completedEnrollments) {
      const course = courseMap.get(enrollment.courseId)
      if (course?.durationHours) {
        totalCompletionHours += course.durationHours
        completionHoursCount++
      }
    }
    const averageTimeToCompleteHours =
      completionHoursCount > 0
        ? Math.round((totalCompletionHours / completionHoursCount) * 10) / 10
        : 0

    // Popular courses
    const courseEnrollmentCounts = new Map<
      string,
      { enrollments: number; completions: number; totalProgress: number }
    >()

    for (const enrollment of allEnrollments) {
      const stats = courseEnrollmentCounts.get(enrollment.courseId) ?? {
        enrollments: 0,
        completions: 0,
        totalProgress: 0,
      }
      stats.enrollments++
      if (enrollment.status === 'completed') stats.completions++
      stats.totalProgress += enrollment.progress
      courseEnrollmentCounts.set(enrollment.courseId, stats)
    }

    const popularCourses = Array.from(courseEnrollmentCounts.entries())
      .map(([courseId, stats]) => {
        const course = courseMap.get(courseId)
        return {
          courseId,
          courseTitle: course?.title ?? 'Unknown',
          enrollmentCount: stats.enrollments,
          completionCount: stats.completions,
          completionRate:
            stats.enrollments > 0
              ? Math.round((stats.completions / stats.enrollments) * 100)
              : 0,
          averageProgress:
            stats.enrollments > 0
              ? Math.round(stats.totalProgress / stats.enrollments)
              : 0,
        }
      })
      .sort((a, b) => b.enrollmentCount - a.enrollmentCount)
      .slice(0, 10)

    // Department engagement
    const deptEmployeesMap = new Map<string, string[]>()
    for (const emp of allEmployees) {
      const deptKey = emp.departmentId ?? '__no_dept__'
      const list = deptEmployeesMap.get(deptKey) ?? []
      list.push(emp.id)
      deptEmployeesMap.set(deptKey, list)
    }

    const enrollmentsByEmployee = new Map<string, typeof allEnrollments>()
    for (const enrollment of allEnrollments) {
      const list = enrollmentsByEmployee.get(enrollment.employeeId) ?? []
      list.push(enrollment)
      enrollmentsByEmployee.set(enrollment.employeeId, list)
    }

    const departmentEngagement = Array.from(deptEmployeesMap.entries()).map(
      ([deptKey, empIds]) => {
        const deptName =
          deptKey === '__no_dept__'
            ? 'Unassigned'
            : deptMap.get(deptKey)?.name ?? 'Unknown'

        let enrolledCount = 0
        let totalDeptEnrollments = 0
        let totalDeptCompletions = 0
        let totalDeptProgress = 0

        for (const empId of empIds) {
          const empEnrollments = enrollmentsByEmployee.get(empId) ?? []
          if (empEnrollments.length > 0) enrolledCount++
          totalDeptEnrollments += empEnrollments.length
          totalDeptCompletions += empEnrollments.filter(
            (e) => e.status === 'completed'
          ).length
          totalDeptProgress += empEnrollments.reduce(
            (sum, e) => sum + e.progress,
            0
          )
        }

        return {
          departmentId: deptKey === '__no_dept__' ? null : deptKey,
          departmentName: deptName,
          totalEmployees: empIds.length,
          enrolledEmployees: enrolledCount,
          enrollmentRate:
            empIds.length > 0
              ? Math.round((enrolledCount / empIds.length) * 100)
              : 0,
          completionRate:
            totalDeptEnrollments > 0
              ? Math.round((totalDeptCompletions / totalDeptEnrollments) * 100)
              : 0,
          averageProgress:
            totalDeptEnrollments > 0
              ? Math.round(totalDeptProgress / totalDeptEnrollments)
              : 0,
        }
      }
    )

    // Completion trends (last 12 months)
    const completionTrends: { month: string; completions: number; enrollments: number }[] =
      []
    const now = new Date()

    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59)
      const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`

      const monthCompletions = completedEnrollments.filter((e) => {
        if (!e.completedAt) return false
        return e.completedAt >= monthDate && e.completedAt <= monthEnd
      }).length

      const monthEnrollments = allEnrollments.filter((e) => {
        return e.enrolledAt >= monthDate && e.enrolledAt <= monthEnd
      }).length

      completionTrends.push({
        month: monthKey,
        completions: monthCompletions,
        enrollments: monthEnrollments,
      })
    }

    // Format breakdown
    const formatCounts = new Map<
      string,
      { total: number; completed: number }
    >()
    for (const enrollment of allEnrollments) {
      const course = courseMap.get(enrollment.courseId)
      if (!course) continue
      const stats = formatCounts.get(course.format) ?? { total: 0, completed: 0 }
      stats.total++
      if (enrollment.status === 'completed') stats.completed++
      formatCounts.set(course.format, stats)
    }

    const formatBreakdown = Array.from(formatCounts.entries()).map(
      ([format, stats]) => ({
        format,
        count: stats.total,
        completionRate:
          stats.total > 0
            ? Math.round((stats.completed / stats.total) * 100)
            : 0,
      })
    )

    // Level breakdown
    const levelCounts = new Map<
      string,
      { total: number; completed: number }
    >()
    for (const enrollment of allEnrollments) {
      const course = courseMap.get(enrollment.courseId)
      if (!course) continue
      const stats = levelCounts.get(course.level) ?? { total: 0, completed: 0 }
      stats.total++
      if (enrollment.status === 'completed') stats.completed++
      levelCounts.set(course.level, stats)
    }

    const levelBreakdown = Array.from(levelCounts.entries()).map(
      ([level, stats]) => ({
        level,
        count: stats.total,
        completionRate:
          stats.total > 0
            ? Math.round((stats.completed / stats.total) * 100)
            : 0,
      })
    )

    return {
      orgId,
      generatedAt: new Date().toISOString(),
      overview: {
        totalCourses,
        totalEnrollments,
        totalCompletions,
        totalActiveEnrollments: activeEnrollments.length,
        overallCompletionRate,
        averageTimeToCompleteHours,
      },
      popularCourses,
      departmentEngagement,
      completionTrends,
      formatBreakdown,
      levelBreakdown,
    }
  } catch (error) {
    console.error('[LMS] Failed to get learning metrics:', error)
    return {
      orgId,
      generatedAt: new Date().toISOString(),
      overview: {
        totalCourses: 0,
        totalEnrollments: 0,
        totalCompletions: 0,
        totalActiveEnrollments: 0,
        overallCompletionRate: 0,
        averageTimeToCompleteHours: 0,
      },
      popularCourses: [],
      departmentEngagement: [],
      completionTrends: [],
      formatBreakdown: [],
      levelBreakdown: [],
    }
  }
}

// ============================================================
// Utility: Enroll an employee in a course
// ============================================================

export async function enrollEmployee(
  orgId: string,
  employeeId: string,
  courseId: string
): Promise<{ enrollmentId: string } | null> {
  try {
    // Check if already enrolled
    const existing = await db
      .select()
      .from(schema.enrollments)
      .where(
        and(
          eq(schema.enrollments.orgId, orgId),
          eq(schema.enrollments.employeeId, employeeId),
          eq(schema.enrollments.courseId, courseId)
        )
      )

    if (existing.length > 0) {
      return { enrollmentId: existing[0].id }
    }

    const result = await db
      .insert(schema.enrollments)
      .values({
        orgId,
        employeeId,
        courseId,
        status: 'enrolled',
        progress: 0,
      })
      .returning({ id: schema.enrollments.id })

    return result.length > 0 ? { enrollmentId: result[0].id } : null
  } catch (error) {
    console.error('[LMS] Failed to enroll employee:', error)
    return null
  }
}

// ============================================================
// Utility: Drop an enrollment
// ============================================================

export async function dropEnrollment(
  orgId: string,
  enrollmentId: string
): Promise<boolean> {
  try {
    await db
      .update(schema.enrollments)
      .set({ status: 'dropped' })
      .where(
        and(
          eq(schema.enrollments.id, enrollmentId),
          eq(schema.enrollments.orgId, orgId)
        )
      )
    return true
  } catch (error) {
    console.error('[LMS] Failed to drop enrollment:', error)
    return false
  }
}

// ============================================================
// Prerequisites Check
// ============================================================

export interface PrerequisiteCheckResult {
  canEnroll: boolean
  missing: { courseId: string; courseTitle: string; type: string; minimumScore: number | null }[]
  recommended: { courseId: string; courseTitle: string }[]
}

export async function checkPrerequisites(
  orgId: string,
  courseId: string,
  employeeId: string
): Promise<PrerequisiteCheckResult> {
  try {
    const prerequisites = await db
      .select()
      .from(schema.coursePrerequisites)
      .where(
        and(
          eq(schema.coursePrerequisites.orgId, orgId),
          eq(schema.coursePrerequisites.courseId, courseId)
        )
      )

    if (prerequisites.length === 0) {
      return { canEnroll: true, missing: [], recommended: [] }
    }

    const prereqCourseIds = prerequisites.map(p => p.prerequisiteCourseId)
    const prereqCourses = await db
      .select()
      .from(schema.courses)
      .where(inArray(schema.courses.id, prereqCourseIds))

    const completedEnrollments = await db
      .select()
      .from(schema.enrollments)
      .where(
        and(
          eq(schema.enrollments.orgId, orgId),
          eq(schema.enrollments.employeeId, employeeId),
          eq(schema.enrollments.status, 'completed'),
          inArray(schema.enrollments.courseId, prereqCourseIds)
        )
      )

    const completedCourseIds = new Set(completedEnrollments.map(e => e.courseId))
    const courseMap = new Map(prereqCourses.map(c => [c.id, c]))

    const missing: PrerequisiteCheckResult['missing'] = []
    const recommended: PrerequisiteCheckResult['recommended'] = []

    for (const prereq of prerequisites) {
      const course = courseMap.get(prereq.prerequisiteCourseId)
      if (!course) continue

      if (prereq.type === 'recommended') {
        if (!completedCourseIds.has(prereq.prerequisiteCourseId)) {
          recommended.push({ courseId: course.id, courseTitle: course.title })
        }
      } else {
        if (!completedCourseIds.has(prereq.prerequisiteCourseId)) {
          missing.push({
            courseId: course.id,
            courseTitle: course.title,
            type: prereq.type,
            minimumScore: prereq.minimumScore,
          })
        }
      }
    }

    return {
      canEnroll: missing.length === 0,
      missing,
      recommended,
    }
  } catch (error) {
    console.error('[LMS] Failed to check prerequisites:', error)
    return { canEnroll: true, missing: [], recommended: [] }
  }
}

// ============================================================
// Content Library Search
// ============================================================

export interface ContentLibraryFilters {
  search?: string
  provider?: string
  category?: string
  level?: string
  language?: string
  isFeatured?: boolean
  limit?: number
  offset?: number
}

export interface ContentLibraryResult {
  items: typeof schema.contentLibrary.$inferSelect[]
  total: number
}

export async function getContentLibrary(
  orgId: string,
  filters: ContentLibraryFilters = {}
): Promise<ContentLibraryResult> {
  try {
    const conditions = [eq(schema.contentLibrary.orgId, orgId)]

    if (filters.provider) {
      conditions.push(eq(schema.contentLibrary.provider, filters.provider))
    }
    if (filters.category) {
      conditions.push(eq(schema.contentLibrary.category, filters.category))
    }
    if (filters.level) {
      conditions.push(eq(schema.contentLibrary.level, filters.level))
    }
    if (filters.language) {
      conditions.push(eq(schema.contentLibrary.language, filters.language))
    }
    if (filters.isFeatured) {
      conditions.push(eq(schema.contentLibrary.isFeatured, true))
    }

    const items = await db
      .select()
      .from(schema.contentLibrary)
      .where(and(...conditions))
      .orderBy(desc(schema.contentLibrary.addedAt))

    let filtered = items
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = items.filter(
        i => i.title.toLowerCase().includes(searchLower) ||
             (i.category && i.category.toLowerCase().includes(searchLower))
      )
    }

    const total = filtered.length
    const offset = filters.offset ?? 0
    const limit = filters.limit ?? 50
    const paginated = filtered.slice(offset, offset + limit)

    return { items: paginated, total }
  } catch (error) {
    console.error('[LMS] Failed to get content library:', error)
    return { items: [], total: 0 }
  }
}

// ============================================================
// Badge System
// ============================================================

export async function awardBadge(
  orgId: string,
  employeeId: string,
  badgeType: string,
  badgeName: string,
  badgeIcon: string,
  description: string,
  courseId?: string,
  metadata?: Record<string, unknown>
): Promise<{ id: string } | null> {
  try {
    const result = await db
      .insert(schema.learnerBadges)
      .values({
        orgId,
        employeeId,
        badgeType,
        badgeName,
        badgeIcon,
        description,
        courseId: courseId ?? null,
        metadata: metadata ?? null,
      })
      .returning({ id: schema.learnerBadges.id })

    return result.length > 0 ? { id: result[0].id } : null
  } catch (error) {
    console.error('[LMS] Failed to award badge:', error)
    return null
  }
}

// ============================================================
// Points & Leaderboard
// ============================================================

export async function calculatePoints(
  orgId: string,
  employeeId: string
): Promise<{ total: number; breakdown: { source: string; points: number }[] }> {
  try {
    const points = await db
      .select()
      .from(schema.learnerPoints)
      .where(
        and(
          eq(schema.learnerPoints.orgId, orgId),
          eq(schema.learnerPoints.employeeId, employeeId)
        )
      )

    const breakdown = new Map<string, number>()
    let total = 0
    for (const p of points) {
      total += p.points
      breakdown.set(p.source, (breakdown.get(p.source) ?? 0) + p.points)
    }

    return {
      total,
      breakdown: Array.from(breakdown.entries()).map(([source, points]) => ({ source, points })),
    }
  } catch (error) {
    console.error('[LMS] Failed to calculate points:', error)
    return { total: 0, breakdown: [] }
  }
}

export interface LeaderboardEntry {
  employeeId: string
  employeeName: string
  totalPoints: number
  badgeCount: number
  coursesCompleted: number
}

export async function getLeaderboard(
  orgId: string,
  limit: number = 10
): Promise<LeaderboardEntry[]> {
  try {
    const allPoints = await db
      .select()
      .from(schema.learnerPoints)
      .where(eq(schema.learnerPoints.orgId, orgId))

    const pointsByEmployee = new Map<string, number>()
    for (const p of allPoints) {
      pointsByEmployee.set(p.employeeId, (pointsByEmployee.get(p.employeeId) ?? 0) + p.points)
    }

    const allBadges = await db
      .select()
      .from(schema.learnerBadges)
      .where(eq(schema.learnerBadges.orgId, orgId))

    const badgesByEmployee = new Map<string, number>()
    for (const b of allBadges) {
      badgesByEmployee.set(b.employeeId, (badgesByEmployee.get(b.employeeId) ?? 0) + 1)
    }

    const completedEnrollments = await db
      .select()
      .from(schema.enrollments)
      .where(
        and(
          eq(schema.enrollments.orgId, orgId),
          eq(schema.enrollments.status, 'completed')
        )
      )

    const completionsByEmployee = new Map<string, number>()
    for (const e of completedEnrollments) {
      completionsByEmployee.set(e.employeeId, (completionsByEmployee.get(e.employeeId) ?? 0) + 1)
    }

    const employeeIds = [...new Set([...pointsByEmployee.keys(), ...badgesByEmployee.keys()])]
    const employees = await db
      .select({ id: schema.employees.id, fullName: schema.employees.fullName })
      .from(schema.employees)
      .where(inArray(schema.employees.id, employeeIds))

    const employeeMap = new Map(employees.map(e => [e.id, e.fullName]))

    const leaderboard: LeaderboardEntry[] = employeeIds.map(empId => ({
      employeeId: empId,
      employeeName: employeeMap.get(empId) ?? 'Unknown',
      totalPoints: pointsByEmployee.get(empId) ?? 0,
      badgeCount: badgesByEmployee.get(empId) ?? 0,
      coursesCompleted: completionsByEmployee.get(empId) ?? 0,
    }))

    leaderboard.sort((a, b) => b.totalPoints - a.totalPoints)
    return leaderboard.slice(0, limit)
  } catch (error) {
    console.error('[LMS] Failed to get leaderboard:', error)
    return []
  }
}

// ============================================================
// Learner Transcript
// ============================================================

export interface TranscriptEntry {
  courseId: string
  courseTitle: string
  category: string | null
  completedAt: Date
  durationHours: number | null
  score: number | null
  format: string
  level: string
}

export interface LearnerTranscript {
  employeeId: string
  employeeName: string
  entries: TranscriptEntry[]
  totalHours: number
  totalCourses: number
  totalCertificates: number
}

export async function getLearnerTranscript(
  orgId: string,
  employeeId: string
): Promise<LearnerTranscript> {
  try {
    const employee = await db
      .select({ id: schema.employees.id, fullName: schema.employees.fullName })
      .from(schema.employees)
      .where(
        and(
          eq(schema.employees.id, employeeId),
          eq(schema.employees.orgId, orgId)
        )
      )

    const completedEnrollments = await db
      .select()
      .from(schema.enrollments)
      .where(
        and(
          eq(schema.enrollments.orgId, orgId),
          eq(schema.enrollments.employeeId, employeeId),
          eq(schema.enrollments.status, 'completed')
        )
      )

    if (completedEnrollments.length === 0) {
      return {
        employeeId,
        employeeName: employee[0]?.fullName ?? 'Unknown',
        entries: [],
        totalHours: 0,
        totalCourses: 0,
        totalCertificates: 0,
      }
    }

    const courseIds = completedEnrollments.map(e => e.courseId)
    const courses = await db
      .select()
      .from(schema.courses)
      .where(inArray(schema.courses.id, courseIds))

    const courseMap = new Map(courses.map(c => [c.id, c]))

    const entries: TranscriptEntry[] = completedEnrollments
      .filter(e => e.completedAt)
      .map(e => {
        const course = courseMap.get(e.courseId)
        return {
          courseId: e.courseId,
          courseTitle: course?.title ?? 'Unknown Course',
          category: course?.category ?? null,
          completedAt: e.completedAt!,
          durationHours: course?.durationHours ?? null,
          score: null, // Would come from assessment attempts
          format: course?.format ?? 'online',
          level: course?.level ?? 'beginner',
        }
      })
      .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())

    const totalHours = entries.reduce((a, e) => a + (e.durationHours ?? 0), 0)

    return {
      employeeId,
      employeeName: employee[0]?.fullName ?? 'Unknown',
      entries,
      totalHours,
      totalCourses: entries.length,
      totalCertificates: entries.length, // Each completed course earns a certificate
    }
  } catch (error) {
    console.error('[LMS] Failed to get learner transcript:', error)
    return {
      employeeId,
      employeeName: 'Unknown',
      entries: [],
      totalHours: 0,
      totalCourses: 0,
      totalCertificates: 0,
    }
  }
}

// ─── Additional LMS Functions ───────────────────────────────────────────

export async function getCourseContent(courseId: string) {
  const blocks = await db.select().from(schema.courseContent).where(eq(schema.courseContent.courseId, courseId)).orderBy(asc(schema.courseContent.position))
  return blocks
}

export async function getEmployeeCertificates(orgId: string, employeeId: string) {
  const enrollmentRows = await db.select().from(schema.enrollments).where(eq(schema.enrollments.employeeId, employeeId))
  return enrollmentRows.filter(e => e.status === 'completed').map(e => ({
    enrollmentId: e.id,
    courseId: e.courseId,
    completedAt: e.completedAt,
  }))
}

export async function submitQuiz(orgId: string, employeeId: string, courseContentId: string, answers: Record<string, string> | Array<{questionId: string; answer: string}>) {
  const questions = await db.select().from(schema.quizQuestions).where(eq(schema.quizQuestions.courseContentId, courseContentId))
  let correct = 0
  const answerMap: Record<string, string> = Array.isArray(answers)
    ? Object.fromEntries(answers.map(a => [a.questionId, a.answer]))
    : answers
  for (const q of questions) {
    if (answerMap[q.id] === q.correctAnswer) correct++
  }
  const score = questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0
  return { score, total: questions.length, correct, passed: score >= 70 }
}

export async function issueCertificate(orgId: string, employeeId: string, courseId: string, enrollmentId: string) {
  await db.update(schema.enrollments).set({ status: 'completed', progress: 100, completedAt: new Date() }).where(eq(schema.enrollments.id, enrollmentId))
  return { certificateId: `cert-${enrollmentId}`, issuedAt: new Date().toISOString() }
}

export async function trackBlockProgress(orgId: string, enrollmentId: string, blockId: string, data: Record<string, unknown>) {
  return { enrollmentId, blockId, tracked: true }
}

export async function getDetailedProgress(orgId: string, enrollmentId: string) {
  const enrollment = await db.select().from(schema.enrollments).where(eq(schema.enrollments.id, enrollmentId))
  if (!enrollment.length) return null
  return { enrollmentId, progress: enrollment[0].progress, status: enrollment[0].status }
}

export async function getContentAnalytics(orgId: string, courseId: string) {
  const enrollments = await db.select().from(schema.enrollments).where(eq(schema.enrollments.courseId, courseId))
  const completed = enrollments.filter(e => e.status === 'completed').length
  return { courseId, totalEnrollments: enrollments.length, completedCount: completed, completionRate: enrollments.length > 0 ? Math.round((completed / enrollments.length) * 100) : 0 }
}

export async function getLearnerHeatmap(orgId: string, employeeId: string) {
  const enrollments = await db.select().from(schema.enrollments).where(eq(schema.enrollments.employeeId, employeeId))
  return { employeeId, activityDays: enrollments.length, heatmap: [] }
}

export async function getCourseCompletionFunnel(orgId: string, courseId: string) {
  const enrollments = await db.select().from(schema.enrollments).where(eq(schema.enrollments.courseId, courseId))
  return {
    courseId,
    enrolled: enrollments.length,
    started: enrollments.filter(e => (e.progress ?? 0) > 0).length,
    halfway: enrollments.filter(e => (e.progress ?? 0) >= 50).length,
    completed: enrollments.filter(e => e.status === 'completed').length,
  }
}
