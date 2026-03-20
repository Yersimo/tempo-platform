/**
 * Academy -> Learning Integration
 *
 * When an academy course is published:
 * 1. Auto-create entries in the learning catalog
 * 2. Suggest enrollments for relevant departments
 *
 * All integrations are event-driven via the cross-module event bus.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Learning catalog entry to be created */
export interface LearningCatalogEntry {
  title: string
  description: string
  category: string
  duration_hours: number
  format: 'online' | 'classroom' | 'blended'
  level: 'beginner' | 'intermediate' | 'advanced'
  source: 'academy'
  academy_course_id: string
  is_mandatory: boolean
  status: 'active'
  metadata: Record<string, unknown>
}

/** Enrollment suggestion for a department */
export interface DepartmentEnrollmentSuggestion {
  departmentId: string
  departmentName: string
  reason: string
  priority: 'high' | 'medium' | 'low'
  estimatedEnrollees: number
}

/** Result of processing an academy course publication */
export interface AcademyLearningResult {
  academyCourseId: string
  catalogEntry: LearningCatalogEntry
  enrollmentSuggestions: DepartmentEnrollmentSuggestion[]
  summary: {
    catalogEntryCreated: boolean
    departmentsSuggested: number
    totalEstimatedEnrollees: number
  }
}

/** Store slice needed for academy->learning operations */
export interface AcademyLearningStoreSlice {
  departments: Array<{ id: string; name: string }>
  employees: Array<{ id: string; department_id: string }>
  courses?: Array<Record<string, unknown>>
  addCourse?: (data: Record<string, unknown>) => void
  addToast?: (toast: { type: string; title: string; description?: string }) => void
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Category to department relevance mapping */
const CATEGORY_DEPARTMENT_RELEVANCE: Record<string, string[]> = {
  technical: ['engineering', 'technology', 'it', 'data'],
  engineering: ['engineering', 'technology'],
  leadership: ['all'],
  management: ['all'],
  compliance: ['all'],
  sales: ['sales', 'business development', 'revenue'],
  marketing: ['marketing', 'communications', 'growth'],
  finance: ['finance', 'accounting'],
  hr: ['human resources', 'hr', 'people'],
  product: ['product', 'engineering', 'design'],
  design: ['design', 'product', 'marketing'],
  security: ['engineering', 'it', 'technology', 'security'],
  'customer-service': ['customer success', 'support', 'customer service'],
  analytics: ['data', 'analytics', 'product', 'marketing'],
  communication: ['all'],
  diversity: ['all'],
}

// ---------------------------------------------------------------------------
// Core Functions
// ---------------------------------------------------------------------------

/**
 * Process an academy course publication into a learning catalog entry
 * and department enrollment suggestions.
 *
 * @param courseId           - Academy course ID
 * @param title              - Course title
 * @param description        - Course description
 * @param category           - Course category
 * @param store              - Store slice for department/employee lookups
 * @param options            - Optional fields
 * @returns Processing result with catalog entry and suggestions
 */
export function processAcademyCoursePublication(
  courseId: string,
  title: string,
  description: string | undefined,
  category: string,
  store: AcademyLearningStoreSlice,
  options: {
    durationHours?: number
    format?: 'online' | 'classroom' | 'blended'
    level?: 'beginner' | 'intermediate' | 'advanced'
    targetDepartments?: string[]
    targetRoles?: string[]
    publishedBy?: string
  } = {},
): AcademyLearningResult {
  const now = new Date()

  // 1. Create learning catalog entry
  const catalogEntry: LearningCatalogEntry = {
    title,
    description: description || `Academy course: ${title}`,
    category: category.toLowerCase(),
    duration_hours: options.durationHours || 1,
    format: options.format || 'online',
    level: options.level || 'intermediate',
    source: 'academy',
    academy_course_id: courseId,
    is_mandatory: false,
    status: 'active',
    metadata: {
      auto_created: true,
      source_integration: 'academy-learning',
      published_by: options.publishedBy,
      created_at: now.toISOString(),
    },
  }

  // 2. Generate enrollment suggestions
  const suggestions: DepartmentEnrollmentSuggestion[] = []
  const normalizedCategory = category.toLowerCase().replace(/\s+/g, '-')

  if (options.targetDepartments && options.targetDepartments.length > 0) {
    // Explicit targets from the academy course
    for (const deptId of options.targetDepartments) {
      const dept = store.departments.find(d => d.id === deptId)
      if (!dept) continue

      const headcount = store.employees.filter(e => e.department_id === deptId).length

      suggestions.push({
        departmentId: deptId,
        departmentName: dept.name,
        reason: `Explicitly targeted by course publisher`,
        priority: 'high',
        estimatedEnrollees: headcount,
      })
    }
  } else {
    // Auto-suggest based on category-department relevance
    const relevantDeptNames = CATEGORY_DEPARTMENT_RELEVANCE[normalizedCategory] || []
    const isAll = relevantDeptNames.includes('all')

    for (const dept of store.departments) {
      const deptNameLower = dept.name.toLowerCase()
      const isRelevant = isAll || relevantDeptNames.some(r => deptNameLower.includes(r))

      if (!isRelevant) continue

      const headcount = store.employees.filter(e => e.department_id === dept.id).length
      if (headcount === 0) continue

      suggestions.push({
        departmentId: dept.id,
        departmentName: dept.name,
        reason: isAll
          ? `${category} courses are relevant to all departments`
          : `${category} courses are relevant to ${dept.name}`,
        priority: isAll ? 'medium' : 'high',
        estimatedEnrollees: headcount,
      })
    }
  }

  const totalEstimatedEnrollees = suggestions.reduce((sum, s) => sum + s.estimatedEnrollees, 0)

  return {
    academyCourseId: courseId,
    catalogEntry,
    enrollmentSuggestions: suggestions,
    summary: {
      catalogEntryCreated: true,
      departmentsSuggested: suggestions.length,
      totalEstimatedEnrollees,
    },
  }
}

/**
 * Apply academy learning results to the store.
 *
 * @param result - Output from processAcademyCoursePublication
 * @param store  - Store actions for persisting
 * @returns Whether the catalog entry was created
 */
export function applyAcademyCatalogEntry(
  result: AcademyLearningResult,
  store: AcademyLearningStoreSlice,
): boolean {
  if (store.addCourse) {
    store.addCourse(result.catalogEntry as unknown as Record<string, unknown>)
    return true
  }
  return false
}
