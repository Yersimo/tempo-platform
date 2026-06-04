type LooseRecord = Record<string, any>

export type SkillGapPriority = 'critical' | 'high' | 'medium' | 'low'

export interface LearningSkillGap {
  skillId: string
  skillName: string
  category: string
  currentLevel: number
  requiredLevel: number
  gap: number
  importance: string
  priority: SkillGapPriority
}

export interface LearningRecommendation {
  id: string
  title: string
  type: 'course' | 'path'
  reason: string
  matchedSkillIds: string[]
  matchedSkillNames: string[]
  estimatedHours: number
  priority: SkillGapPriority
  evidence: string[]
}

export interface LearningComplianceNeed {
  courseId: string
  title: string
  status: string
  reason: string
}

export interface EmployeeLearningPlan {
  employeeId: string
  targetRole: {
    jobTitle: string
    level: string
  }
  readinessScore: number
  requiredSkillCount: number
  coveredSkillCount: number
  strengths: Array<{
    skillId: string
    skillName: string
    currentLevel: number
    requiredLevel: number
  }>
  gaps: LearningSkillGap[]
  recommendedCourses: LearningRecommendation[]
  recommendedPaths: LearningRecommendation[]
  complianceNeeds: LearningComplianceNeed[]
  safeNextActions: string[]
  evidence: string[]
}

export interface LearningSkillsGraph {
  skillCount: number
  courseCount: number
  pathCount: number
  mappedCourseCount: number
  coverageScore: number
  skillCoverage: Array<{
    skillId: string
    skillName: string
    category: string
    courseIds: string[]
    pathIds: string[]
  }>
  evidence: string[]
}

export interface LearningSkillsGraphInput {
  skills?: LooseRecord[]
  employeeSkills?: LooseRecord[]
  roleRequirements?: LooseRecord[]
  courses?: LooseRecord[]
  learningPaths?: LooseRecord[]
  enrollments?: LooseRecord[]
  employee?: LooseRecord | null
  employeeId?: string
  targetRole?: {
    jobTitle?: string
    level?: string
  }
}

const REQUIRED_IMPORTANCE = new Set(['required', 'critical', 'must_have', 'must-have'])
const COMPLETED_STATUSES = new Set(['completed', 'complete', 'passed', 'certified'])
const ACTIVE_STATUSES = new Set(['enrolled', 'in_progress', 'in-progress', 'started'])

function pick<T = any>(record: LooseRecord | null | undefined, ...keys: string[]): T | undefined {
  if (!record) return undefined
  for (const key of keys) {
    const value = record[key]
    if (value !== undefined && value !== null) return value as T
  }
  return undefined
}

function asArray(value: any): string[] {
  if (Array.isArray(value)) return value.map(String)
  if (typeof value === 'string') {
    return value.split(',').map(item => item.trim()).filter(Boolean)
  }
  return []
}

function normalizeId(value: any): string {
  return String(value ?? '').trim()
}

function normalizeText(value: any): string {
  return String(value ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

function words(value: any): Set<string> {
  return new Set(normalizeText(value).split(' ').filter(word => word.length > 2))
}

function numericLevel(value: any, fallback = 0): number {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function isPresent<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined
}

function priorityForGap(gap: number, importance: string): SkillGapPriority {
  if (gap >= 2 && REQUIRED_IMPORTANCE.has(normalizeText(importance).replace(/\s+/g, '_'))) return 'critical'
  if (gap >= 2) return 'high'
  if (gap === 1 && REQUIRED_IMPORTANCE.has(normalizeText(importance).replace(/\s+/g, '_'))) return 'high'
  if (gap === 1) return 'medium'
  return 'low'
}

function priorityRank(priority: SkillGapPriority): number {
  return { critical: 4, high: 3, medium: 2, low: 1 }[priority]
}

function getSkillId(record: LooseRecord): string {
  return normalizeId(pick(record, 'skillId', 'skill_id', 'competencyId', 'competency_id', 'id'))
}

function getEmployeeId(record: LooseRecord): string {
  return normalizeId(pick(record, 'employeeId', 'employee_id', 'personId', 'person_id', 'id'))
}

function courseMatchesSkill(course: LooseRecord, skill: LooseRecord): boolean {
  const skillName = normalizeText(pick(skill, 'name', 'title', 'label'))
  const skillCategory = normalizeText(pick(skill, 'category', 'type'))
  const searchText = normalizeText([
    pick(course, 'title', 'name'),
    pick(course, 'description'),
    pick(course, 'category'),
    asArray(pick(course, 'tags', 'skillTags', 'skill_tags')).join(' '),
  ].join(' '))
  const explicitSkillIds = new Set(asArray(pick(course, 'skillIds', 'skill_ids', 'skills')))

  if (explicitSkillIds.has(getSkillId(skill))) return true
  if (skillName && searchText.includes(skillName)) return true
  if (skillCategory && searchText.includes(skillCategory)) return true

  const skillWords = words(skillName)
  const courseWords = words(searchText)
  let overlap = 0
  for (const word of skillWords) {
    if (courseWords.has(word)) overlap += 1
  }
  return overlap >= Math.min(2, skillWords.size)
}

function isMandatory(course: LooseRecord): boolean {
  return Boolean(pick(course, 'isMandatory', 'is_mandatory', 'mandatory', 'required'))
}

function enrollmentStatus(enrollment: LooseRecord | undefined): string {
  return normalizeText(pick(enrollment, 'status') ?? 'not_enrolled').replace(/\s+/g, '_')
}

function getCourseIdsFromPath(path: LooseRecord): string[] {
  return asArray(pick(path, 'courseIds', 'course_ids', 'courses'))
}

function roleRequirementMatches(requirement: LooseRecord, targetJobTitle: string, targetLevel: string): boolean {
  const reqJobTitle = normalizeText(pick(requirement, 'jobTitle', 'job_title', 'roleTitle', 'role_title', 'role'))
  const reqLevel = normalizeText(pick(requirement, 'level', 'jobLevel', 'job_level'))
  const normalizedTargetTitle = normalizeText(targetJobTitle)
  const normalizedTargetLevel = normalizeText(targetLevel)

  if (!normalizedTargetTitle) return true
  const titleMatches = reqJobTitle === normalizedTargetTitle || reqJobTitle.includes(normalizedTargetTitle) || normalizedTargetTitle.includes(reqJobTitle)
  const levelMatches = !reqLevel || !normalizedTargetLevel || reqLevel === normalizedTargetLevel
  return titleMatches && levelMatches
}

function inferTargetRole(input: LearningSkillsGraphInput): { jobTitle: string; level: string } {
  const employee = input.employee ?? {}
  return {
    jobTitle: input.targetRole?.jobTitle ?? pick(employee, 'jobTitle', 'job_title', 'title', 'role') ?? '',
    level: input.targetRole?.level ?? pick(employee, 'level', 'jobLevel', 'job_level') ?? '',
  }
}

export function buildLearningSkillsGraph(input: LearningSkillsGraphInput): LearningSkillsGraph {
  const skills = input.skills ?? []
  const courses = input.courses ?? []
  const learningPaths = input.learningPaths ?? []

  const skillCoverage = skills.map(skill => {
    const skillId = getSkillId(skill)
    const matchingCourses = courses.filter(course => courseMatchesSkill(course, skill))
    const matchingCourseIds = new Set(matchingCourses.map(course => normalizeId(pick(course, 'id'))))
    const matchingPaths = learningPaths.filter(path => getCourseIdsFromPath(path).some(courseId => matchingCourseIds.has(courseId)))

    return {
      skillId,
      skillName: String(pick(skill, 'name', 'title', 'label') ?? skillId),
      category: String(pick(skill, 'category', 'type') ?? 'General'),
      courseIds: matchingCourses.map(course => normalizeId(pick(course, 'id'))),
      pathIds: matchingPaths.map(path => normalizeId(pick(path, 'id'))),
    }
  })

  const mappedCourseIds = new Set(skillCoverage.flatMap(coverage => coverage.courseIds))
  const coveredSkills = skillCoverage.filter(coverage => coverage.courseIds.length > 0 || coverage.pathIds.length > 0).length
  const coverageScore = skills.length > 0 ? Math.round((coveredSkills / skills.length) * 100) : 0

  return {
    skillCount: skills.length,
    courseCount: courses.length,
    pathCount: learningPaths.length,
    mappedCourseCount: mappedCourseIds.size,
    coverageScore,
    skillCoverage,
    evidence: [
      `${coveredSkills}/${skills.length} skills have course or path coverage.`,
      `${mappedCourseIds.size}/${courses.length} courses map to at least one skill.`,
    ],
  }
}

export function recommendLearningForEmployee(input: LearningSkillsGraphInput): EmployeeLearningPlan {
  const skills = input.skills ?? []
  const employeeSkills = input.employeeSkills ?? []
  const roleRequirements = input.roleRequirements ?? []
  const courses = input.courses ?? []
  const learningPaths = input.learningPaths ?? []
  const enrollments = input.enrollments ?? []
  const employeeId = normalizeId(input.employeeId ?? pick(input.employee ?? {}, 'id', 'employeeId', 'employee_id'))
  const targetRole = inferTargetRole(input)

  const skillsById = new Map(skills.map(skill => [getSkillId(skill), skill]))
  const employeeSkillBySkillId = new Map(
    employeeSkills
      .filter(skill => getEmployeeId(skill) === employeeId)
      .map(skill => [getSkillId(skill), skill])
  )
  const enrollmentByCourseId = new Map(
    enrollments
      .filter(enrollment => getEmployeeId(enrollment) === employeeId)
      .map(enrollment => [normalizeId(pick(enrollment, 'courseId', 'course_id')), enrollment])
  )

  const matchedRequirements = roleRequirements.filter(requirement =>
    roleRequirementMatches(requirement, targetRole.jobTitle, targetRole.level)
  )

  const strengths: EmployeeLearningPlan['strengths'] = []
  const gaps: LearningSkillGap[] = []
  let coveredPoints = 0
  let requiredPoints = 0

  for (const requirement of matchedRequirements) {
    const skillId = getSkillId(requirement)
    const skill = skillsById.get(skillId) ?? requirement
    const employeeSkill = employeeSkillBySkillId.get(skillId)
    const currentLevel = numericLevel(pick(employeeSkill, 'currentLevel', 'current_level', 'rating'), 0)
    const requiredLevel = numericLevel(pick(requirement, 'requiredLevel', 'required_level', 'targetLevel', 'target_level'), 1)
    const importance = String(pick(requirement, 'importance', 'priority') ?? 'required')
    const skillName = String(pick(skill, 'name', 'title', 'label') ?? skillId)
    const category = String(pick(skill, 'category', 'type') ?? 'General')
    const gap = Math.max(0, requiredLevel - currentLevel)

    requiredPoints += requiredLevel
    coveredPoints += Math.min(currentLevel, requiredLevel)

    if (gap === 0) {
      strengths.push({ skillId, skillName, currentLevel, requiredLevel })
    } else {
      gaps.push({
        skillId,
        skillName,
        category,
        currentLevel,
        requiredLevel,
        gap,
        importance,
        priority: priorityForGap(gap, importance),
      })
    }
  }

  const readinessScore = requiredPoints > 0 ? Math.round((coveredPoints / requiredPoints) * 100) : 0
  const gapSkillIds = new Set(gaps.map(gap => gap.skillId))
  const gapSkills = gaps.map(gap => skillsById.get(gap.skillId) ?? { id: gap.skillId, name: gap.skillName, category: gap.category })

  const recommendedCourses = courses
    .map(course => {
      const courseId = normalizeId(pick(course, 'id'))
      const enrollment = enrollmentByCourseId.get(courseId)
      const status = enrollmentStatus(enrollment)
      if (COMPLETED_STATUSES.has(status)) return null

      const matchedSkills = gapSkills.filter(skill => courseMatchesSkill(course, skill))
      if (matchedSkills.length === 0) return null

      const matchedGaps = gaps.filter(gap => matchedSkills.some(skill => getSkillId(skill) === gap.skillId))
      const topPriority = matchedGaps.sort((a, b) => priorityRank(b.priority) - priorityRank(a.priority))[0]?.priority ?? 'medium'
      const activeLabel = ACTIVE_STATUSES.has(status) ? 'Continue active enrollment' : 'Enroll next'

      return {
        id: courseId,
        title: String(pick(course, 'title', 'name') ?? courseId),
        type: 'course' as const,
        reason: `${activeLabel} to close ${matchedSkills.length} skill gap${matchedSkills.length === 1 ? '' : 's'}.`,
        matchedSkillIds: matchedSkills.map(getSkillId),
        matchedSkillNames: matchedSkills.map(skill => String(pick(skill, 'name', 'title', 'label') ?? getSkillId(skill))),
        estimatedHours: numericLevel(pick(course, 'durationHours', 'duration_hours', 'estimatedHours', 'estimated_hours'), 0),
        priority: topPriority,
        evidence: [
          `Matches: ${matchedSkills.map(skill => String(pick(skill, 'name', 'title', 'label') ?? getSkillId(skill))).join(', ')}.`,
          `Enrollment status: ${status}.`,
        ],
      } satisfies LearningRecommendation
    })
    .filter(isPresent)
    .sort((a, b) => priorityRank(b.priority) - priorityRank(a.priority) || b.matchedSkillIds.length - a.matchedSkillIds.length)
    .slice(0, 6)

  const recommendedPaths = learningPaths
    .map(path => {
      const pathCourseIds = getCourseIdsFromPath(path)
      const pathCourses = courses.filter(course => pathCourseIds.includes(normalizeId(pick(course, 'id'))))
      const matchedSkillIds = new Set<string>()
      const matchedSkillNames = new Set<string>()

      for (const course of pathCourses) {
        for (const skill of gapSkills) {
          if (courseMatchesSkill(course, skill)) {
            matchedSkillIds.add(getSkillId(skill))
            matchedSkillNames.add(String(pick(skill, 'name', 'title', 'label') ?? getSkillId(skill)))
          }
        }
      }

      if (matchedSkillIds.size === 0) return null

      const pathGapPriorities = gaps.filter(gap => matchedSkillIds.has(gap.skillId)).map(gap => gap.priority)
      const topPriority = pathGapPriorities.sort((a, b) => priorityRank(b) - priorityRank(a))[0] ?? 'medium'

      return {
        id: normalizeId(pick(path, 'id')),
        title: String(pick(path, 'title', 'name') ?? pick(path, 'id')),
        type: 'path' as const,
        reason: `Assign as a guided path for ${matchedSkillIds.size} role-readiness gap${matchedSkillIds.size === 1 ? '' : 's'}.`,
        matchedSkillIds: [...matchedSkillIds],
        matchedSkillNames: [...matchedSkillNames],
        estimatedHours: numericLevel(pick(path, 'estimatedHours', 'estimated_hours'), pathCourses.reduce((sum, course) => sum + numericLevel(pick(course, 'durationHours', 'duration_hours'), 0), 0)),
        priority: topPriority,
        evidence: [`Includes ${pathCourseIds.length} course${pathCourseIds.length === 1 ? '' : 's'} with ${matchedSkillIds.size} skill match${matchedSkillIds.size === 1 ? '' : 'es'}.`],
      } satisfies LearningRecommendation
    })
    .filter(isPresent)
    .sort((a, b) => priorityRank(b.priority) - priorityRank(a.priority) || b.matchedSkillIds.length - a.matchedSkillIds.length)
    .slice(0, 4)

  const complianceNeeds = courses
    .filter(isMandatory)
    .map(course => {
      const courseId = normalizeId(pick(course, 'id'))
      const status = enrollmentStatus(enrollmentByCourseId.get(courseId))
      if (COMPLETED_STATUSES.has(status)) return null

      return {
        courseId,
        title: String(pick(course, 'title', 'name') ?? courseId),
        status,
        reason: ACTIVE_STATUSES.has(status) ? 'Mandatory course is started but not complete.' : 'Mandatory course has no completed enrollment.',
      } satisfies LearningComplianceNeed
    })
    .filter(isPresent)

  const safeNextActions = [
    gaps.length > 0 ? `Review ${gaps.length} role-readiness gap${gaps.length === 1 ? '' : 's'} with the manager.` : 'Confirm the employee is ready for this role path.',
    recommendedCourses.length > 0 ? `Queue ${recommendedCourses[0].title} as the next best course.` : 'Audit the catalog for missing role-specific courses.',
    complianceNeeds.length > 0 ? `Resolve ${complianceNeeds.length} mandatory learning item${complianceNeeds.length === 1 ? '' : 's'} before marking the plan ready.` : 'Keep compliance status attached to the role plan.',
  ]

  return {
    employeeId,
    targetRole,
    readinessScore: clamp(readinessScore, 0, 100),
    requiredSkillCount: matchedRequirements.length,
    coveredSkillCount: strengths.length,
    strengths,
    gaps,
    recommendedCourses,
    recommendedPaths,
    complianceNeeds,
    safeNextActions,
    evidence: [
      `${matchedRequirements.length} role requirements matched ${targetRole.jobTitle || 'the selected role'}.`,
      `${gaps.length} gaps, ${strengths.length} strengths, ${recommendedCourses.length} course recommendations, ${recommendedPaths.length} path recommendations.`,
    ],
  }
}
