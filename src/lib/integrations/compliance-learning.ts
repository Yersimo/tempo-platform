/**
 * Compliance → Learning Integration
 *
 * When compliance requirements change or new regulations are detected:
 * - Identify affected employees by department/role/location
 * - Auto-assign mandatory training courses
 * - Set completion deadlines based on regulatory timeline
 * - Track completion status for audit
 *
 * All integrations are event-driven via the cross-module event bus.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Training assignment to be created */
export interface ComplianceTrainingAssignment {
  employee_id: string
  employee_name: string
  course_id: string
  course_name: string
  requirement_id: string
  deadline: string
  priority: 'critical' | 'high' | 'medium'
  mandatory: boolean
}

/** Result of assigning compliance training */
export interface ComplianceTrainingResult {
  requirementId: string
  requirementTitle: string
  regulationType: string
  totalAssignments: number
  affectedEmployees: number
  coursesMapped: number
  assignments: ComplianceTrainingAssignment[]
  unmappedDepartments: string[]
  deadline: string
}

/** Compliance training status for audit */
export interface ComplianceTrainingStatus {
  requirementId: string
  totalRequired: number
  completed: number
  inProgress: number
  notStarted: number
  overdue: number
  completionRate: number // 0-100
  complianceStatus: 'compliant' | 'at_risk' | 'non_compliant'
}

/** Store slice needed for compliance→learning operations */
export interface ComplianceLearningStoreSlice {
  employees: Array<{ id: string; department_id?: string; job_title?: string; country?: string; role?: string; profile?: { full_name: string; email?: string } }>
  departments: Array<{ id: string; name: string }>
  courses: Array<Record<string, unknown>>
  learningAssignments: Array<Record<string, unknown>>
  complianceRequirements: Array<Record<string, unknown>>
  addLearningAssignment?: (data: Record<string, unknown>) => void
  addComplianceAlert?: (data: Record<string, unknown>) => void
  addToast?: (toast: { type: string; title: string; description?: string }) => void
}

// ---------------------------------------------------------------------------
// Regulation → Course mapping
// ---------------------------------------------------------------------------

const REGULATION_COURSE_KEYWORDS: Record<string, string[]> = {
  'gdpr': ['gdpr', 'data privacy', 'data protection', 'privacy'],
  'hipaa': ['hipaa', 'health data', 'phi', 'patient privacy'],
  'sox': ['sox', 'sarbanes', 'financial compliance', 'internal controls'],
  'osha': ['osha', 'workplace safety', 'health and safety', 'safety training'],
  'pci': ['pci', 'payment card', 'card security', 'pci-dss'],
  'anti_harassment': ['harassment', 'anti-harassment', 'workplace conduct', 'dei'],
  'aml': ['aml', 'anti-money laundering', 'money laundering', 'kyc'],
  'security': ['security awareness', 'cybersecurity', 'information security', 'phishing'],
  'general': ['compliance', 'regulatory', 'corporate policy'],
}

// ---------------------------------------------------------------------------
// Core Functions
// ---------------------------------------------------------------------------

/**
 * Assign compliance training to affected employees based on a regulation change.
 *
 * @param requirementId      - ID of the compliance requirement
 * @param requirementTitle   - Title of the requirement
 * @param regulationType     - Type of regulation (e.g. 'gdpr', 'hipaa')
 * @param affectedDepartments - Department IDs affected (empty = all)
 * @param affectedLocations  - Country codes affected (empty = all)
 * @param deadlineDate       - Deadline for training completion
 * @param store              - Store slice with employee, course, and assignment data
 * @returns Training assignment result
 */
export function assignComplianceTraining(
  requirementId: string,
  requirementTitle: string,
  regulationType: string,
  affectedDepartments: string[],
  affectedLocations: string[],
  deadlineDate: string,
  store: ComplianceLearningStoreSlice,
): ComplianceTrainingResult {
  // 1. Identify affected employees
  let affectedEmployees = [...store.employees]

  if (affectedDepartments.length > 0) {
    affectedEmployees = affectedEmployees.filter(
      e => e.department_id && affectedDepartments.includes(e.department_id),
    )
  }

  if (affectedLocations.length > 0) {
    affectedEmployees = affectedEmployees.filter(
      e => e.country && affectedLocations.includes(e.country),
    )
  }

  // 2. Find matching courses by regulation type
  const keywords = REGULATION_COURSE_KEYWORDS[regulationType.toLowerCase()] ||
    REGULATION_COURSE_KEYWORDS['general']

  const matchingCourses = store.courses.filter(course => {
    const c = course as Record<string, unknown>
    const title = ((c.title as string) || '').toLowerCase()
    const category = ((c.category as string) || '').toLowerCase()
    const tags = Array.isArray(c.tags) ? (c.tags as string[]).map(t => t.toLowerCase()) : []

    return keywords.some(kw =>
      title.includes(kw) || category.includes(kw) || tags.some(t => t.includes(kw)),
    )
  })

  // 3. Create assignments
  const assignments: ComplianceTrainingAssignment[] = []
  const unmappedDepartments: string[] = []

  for (const employee of affectedEmployees) {
    for (const course of matchingCourses) {
      const c = course as Record<string, unknown>
      const courseId = c.id as string
      const courseName = (c.title as string) || 'Compliance Training'

      // Skip if already assigned
      const alreadyAssigned = store.learningAssignments.some(a => {
        const assignment = a as Record<string, unknown>
        return assignment.employee_id === employee.id &&
          assignment.course_id === courseId &&
          assignment.status !== 'cancelled'
      })

      if (alreadyAssigned) continue

      assignments.push({
        employee_id: employee.id,
        employee_name: employee.profile?.full_name || employee.id,
        course_id: courseId,
        course_name: courseName,
        requirement_id: requirementId,
        deadline: deadlineDate,
        priority: 'high',
        mandatory: true,
      })
    }
  }

  // Track departments with no matching courses
  if (matchingCourses.length === 0) {
    const deptIds = new Set(affectedEmployees.map(e => e.department_id).filter(Boolean) as string[])
    for (const deptId of deptIds) {
      const dept = store.departments.find(d => d.id === deptId)
      unmappedDepartments.push(dept?.name || deptId)
    }
  }

  return {
    requirementId,
    requirementTitle,
    regulationType,
    totalAssignments: assignments.length,
    affectedEmployees: affectedEmployees.length,
    coursesMapped: matchingCourses.length,
    assignments,
    unmappedDepartments,
    deadline: deadlineDate,
  }
}

/**
 * Check compliance training completion status for a given requirement.
 *
 * @param requirementId - ID of the compliance requirement
 * @param store         - Store slice with assignment data
 * @returns Training completion status
 */
export function checkComplianceTrainingStatus(
  requirementId: string,
  store: ComplianceLearningStoreSlice,
): ComplianceTrainingStatus {
  const assignments = store.learningAssignments.filter(a => {
    const assignment = a as Record<string, unknown>
    return assignment.requirement_id === requirementId ||
      assignment.compliance_requirement_id === requirementId
  })

  const now = new Date()
  let completed = 0
  let inProgress = 0
  let notStarted = 0
  let overdue = 0

  for (const a of assignments) {
    const assignment = a as Record<string, unknown>
    const status = assignment.status as string
    const deadline = assignment.deadline as string

    if (status === 'completed') {
      completed++
    } else if (status === 'in_progress') {
      inProgress++
      if (deadline && new Date(deadline) < now) overdue++
    } else {
      notStarted++
      if (deadline && new Date(deadline) < now) overdue++
    }
  }

  const totalRequired = assignments.length
  const completionRate = totalRequired > 0 ? Math.round((completed / totalRequired) * 100) : 100

  let complianceStatus: ComplianceTrainingStatus['complianceStatus']
  if (completionRate >= 95 && overdue === 0) {
    complianceStatus = 'compliant'
  } else if (completionRate >= 70 && overdue <= 2) {
    complianceStatus = 'at_risk'
  } else {
    complianceStatus = 'non_compliant'
  }

  return {
    requirementId,
    totalRequired,
    completed,
    inProgress,
    notStarted,
    overdue,
    completionRate,
    complianceStatus,
  }
}
