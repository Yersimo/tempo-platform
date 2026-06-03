type LooseRecord = Record<string, any>

export type ManagerMissionDomain = 'expense' | 'time' | 'performance' | 'learning' | 'people'
export type ManagerMissionSeverity = 'critical' | 'high' | 'medium' | 'low'

export interface ManagerMissionItem {
  id: string
  domain: ManagerMissionDomain
  title: string
  detail: string
  employeeId: string
  employeeName: string
  severity: ManagerMissionSeverity
  score: number
  route: string
  whyThisMatters: string
  safeNextAction: string
  evidence: string[]
}

export interface ManagerMissionControl {
  managerId: string
  teamSize: number
  totalItems: number
  criticalCount: number
  highCount: number
  mediumCount: number
  lowCount: number
  topFocus: ManagerMissionItem | null
  items: ManagerMissionItem[]
  evidence: string[]
}

export interface ManagerMissionControlInput {
  managerId: string
  now?: string | Date
  maxItems?: number
  employees?: LooseRecord[]
  expenseReports?: LooseRecord[]
  timeEntries?: LooseRecord[]
  timeOffRequests?: LooseRecord[]
  performanceReviews?: LooseRecord[]
  goals?: LooseRecord[]
  learningEnrollments?: LooseRecord[]
  courses?: LooseRecord[]
  oneOnOnes?: LooseRecord[]
}

function pick<T = any>(record: LooseRecord | null | undefined, ...keys: string[]): T | undefined {
  if (!record) return undefined
  for (const key of keys) {
    const value = record[key]
    if (value !== undefined && value !== null) return value as T
  }
  return undefined
}

function normalizeId(value: any): string {
  return String(value ?? '').trim()
}

function normalizeStatus(value: any): string {
  return String(value ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
}

function amount(value: any): number {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : 0
}

function dateValue(value: any): number | null {
  if (!value) return null
  const time = new Date(value).getTime()
  return Number.isFinite(time) ? time : null
}

function daysUntil(value: any, now: Date): number | null {
  const time = dateValue(value)
  if (time === null) return null
  return Math.ceil((time - now.getTime()) / (1000 * 60 * 60 * 24))
}

function severity(score: number): ManagerMissionSeverity {
  if (score >= 85) return 'critical'
  if (score >= 70) return 'high'
  if (score >= 45) return 'medium'
  return 'low'
}

function item(input: Omit<ManagerMissionItem, 'severity'>): ManagerMissionItem {
  return { ...input, severity: severity(input.score) }
}

function employeeId(record: LooseRecord): string {
  return normalizeId(pick(record, 'employeeId', 'employee_id', 'personId', 'person_id'))
}

function managerId(record: LooseRecord): string {
  return normalizeId(pick(record, 'managerId', 'manager_id'))
}

function employeeName(employee: LooseRecord | undefined, id: string): string {
  if (!employee) return id ? `Employee ${id}` : 'Employee'
  return String(
    pick(employee, 'fullName', 'full_name', 'name') ??
    pick(pick(employee, 'profile'), 'fullName', 'full_name', 'name') ??
    id
  )
}

function getTeam(input: ManagerMissionControlInput): { team: LooseRecord[], teamIds: Set<string>, employeesById: Map<string, LooseRecord> } {
  const employees = input.employees ?? []
  const employeesById = new Map(employees.map(employee => [normalizeId(pick(employee, 'id', 'employeeId', 'employee_id')), employee]))
  const team = employees.filter(employee => managerId(employee) === input.managerId)
  return {
    team,
    teamIds: new Set(team.map(employee => normalizeId(pick(employee, 'id', 'employeeId', 'employee_id')))),
    employeesById,
  }
}

function buildExpenseItems(input: ManagerMissionControlInput, teamIds: Set<string>, employeesById: Map<string, LooseRecord>): ManagerMissionItem[] {
  return (input.expenseReports ?? [])
    .filter(report => teamIds.has(employeeId(report)) && ['pending', 'submitted', 'pending_approval'].includes(normalizeStatus(pick(report, 'status'))))
    .map(report => {
      const id = employeeId(report)
      const total = amount(pick(report, 'totalAmount', 'total_amount', 'amount'))
      return item({
        id: `manager-expense-${normalizeId(pick(report, 'id'))}`,
        domain: 'expense',
        title: 'Expense report needs approval',
        detail: `${pick(report, 'title', 'description') ?? 'Expense report'} is waiting on review for ${total}.`,
        employeeId: id,
        employeeName: employeeName(employeesById.get(id), id),
        score: total > 2500 ? 78 : total > 1000 ? 66 : 48,
        route: '/expense?tab=reports',
        whyThisMatters: 'Late expense approvals slow reimbursement and can hide policy or budget issues.',
        safeNextAction: 'Review receipt, policy, budget, and reimbursement evidence before approving or rejecting.',
        evidence: [`Status: ${normalizeStatus(pick(report, 'status'))}.`, `Amount: ${total}.`],
      })
    })
}

function buildTimeItems(input: ManagerMissionControlInput, teamIds: Set<string>, employeesById: Map<string, LooseRecord>): ManagerMissionItem[] {
  const timeEntries = (input.timeEntries ?? [])
    .filter(entry => teamIds.has(employeeId(entry)) && ['pending', 'submitted'].includes(normalizeStatus(pick(entry, 'status'))))
    .map(entry => {
      const id = employeeId(entry)
      const overtime = amount(pick(entry, 'overtimeHours', 'overtime_hours'))
      return item({
        id: `manager-time-${normalizeId(pick(entry, 'id'))}`,
        domain: 'time',
        title: overtime > 0 ? 'Timesheet with overtime needs approval' : 'Timesheet needs approval',
        detail: `${employeeName(employeesById.get(id), id)} has a submitted time record.`,
        employeeId: id,
        employeeName: employeeName(employeesById.get(id), id),
        score: overtime >= 4 ? 76 : overtime > 0 ? 62 : 44,
        route: '/time-attendance',
        whyThisMatters: 'Time approvals affect payroll accuracy, overtime cost, and employee trust.',
        safeNextAction: 'Open time and verify hours, overtime, leave overlaps, and payroll readiness.',
        evidence: [`Status: ${normalizeStatus(pick(entry, 'status'))}.`, `Overtime hours: ${overtime}.`],
      })
    })

  const timeOff = (input.timeOffRequests ?? [])
    .filter(request => teamIds.has(employeeId(request)) && ['pending', 'submitted'].includes(normalizeStatus(pick(request, 'status'))))
    .map(request => {
      const id = employeeId(request)
      return item({
        id: `manager-timeoff-${normalizeId(pick(request, 'id'))}`,
        domain: 'time',
        title: 'Time-off request needs decision',
        detail: `${employeeName(employeesById.get(id), id)} requested ${pick(request, 'type', 'leaveType', 'leave_type') ?? 'time off'}.`,
        employeeId: id,
        employeeName: employeeName(employeesById.get(id), id),
        score: 56,
        route: '/time-attendance',
        whyThisMatters: 'Time-off decisions affect staffing coverage and employee planning.',
        safeNextAction: 'Check team coverage, balance, and handoff plan before deciding.',
        evidence: [`Status: ${normalizeStatus(pick(request, 'status'))}.`],
      })
    })

  return [...timeEntries, ...timeOff]
}

function buildPerformanceItems(input: ManagerMissionControlInput, now: Date, teamIds: Set<string>, employeesById: Map<string, LooseRecord>): ManagerMissionItem[] {
  const reviews = (input.performanceReviews ?? [])
    .filter(review => {
      const revieweeId = employeeId(review)
      const reviewerId = normalizeId(pick(review, 'reviewerId', 'reviewer_id', 'managerId', 'manager_id'))
      return (teamIds.has(revieweeId) || reviewerId === input.managerId) && ['pending', 'in_progress', 'draft'].includes(normalizeStatus(pick(review, 'status')))
    })
    .map(review => {
      const id = employeeId(review)
      const dueDays = daysUntil(pick(review, 'dueDate', 'due_date', 'reviewDate', 'review_date'), now)
      return item({
        id: `manager-review-${normalizeId(pick(review, 'id'))}`,
        domain: 'performance',
        title: dueDays !== null && dueDays <= 2 ? 'Performance review due soon' : 'Performance review needs progress',
        detail: `${employeeName(employeesById.get(id), id)} has a review ${normalizeStatus(pick(review, 'status')).replace(/_/g, ' ')}${dueDays !== null ? ` due in ${dueDays} day${dueDays === 1 ? '' : 's'}` : ''}.`,
        employeeId: id,
        employeeName: employeeName(employeesById.get(id), id),
        score: dueDays !== null && dueDays <= 1 ? 84 : dueDays !== null && dueDays <= 7 ? 68 : 48,
        route: '/performance?tab=reviews',
        whyThisMatters: 'Manager review delays weaken calibration, feedback quality, and compensation decisions.',
        safeNextAction: 'Complete ratings, feedback, calibration evidence, and growth follow-ups.',
        evidence: [`Status: ${normalizeStatus(pick(review, 'status'))}.`],
      })
    })

  const goals = (input.goals ?? [])
    .filter(goal => {
      const id = employeeId(goal)
      const progress = amount(pick(goal, 'progress', 'completion', 'completion_percent'))
      const dueDays = daysUntil(pick(goal, 'dueDate', 'due_date', 'targetDate', 'target_date'), now)
      return teamIds.has(id) && dueDays !== null && dueDays <= 14 && progress < 60
    })
    .map(goal => {
      const id = employeeId(goal)
      return item({
        id: `manager-goal-${normalizeId(pick(goal, 'id'))}`,
        domain: 'performance',
        title: 'Direct report goal is at risk',
        detail: `${pick(goal, 'title', 'name') ?? 'Goal'} is at ${amount(pick(goal, 'progress', 'completion', 'completion_percent'))}% progress.`,
        employeeId: id,
        employeeName: employeeName(employeesById.get(id), id),
        score: 64,
        route: '/performance?tab=goals',
        whyThisMatters: 'At-risk goals need coaching or reprioritization before the cycle closes.',
        safeNextAction: 'Confirm blockers and schedule a focused 1:1 follow-up.',
        evidence: [`Due date: ${pick(goal, 'dueDate', 'due_date', 'targetDate', 'target_date')}.`],
      })
    })

  const oneOnOnes = (input.oneOnOnes ?? [])
    .filter(meeting => {
      const id = employeeId(meeting)
      const status = normalizeStatus(pick(meeting, 'status'))
      const actionItems = pick<any[]>(meeting, 'actionItems', 'action_items') ?? []
      return teamIds.has(id) && (status === 'missed' || actionItems.some(action => ['open', 'pending', 'overdue'].includes(normalizeStatus(pick(action, 'status')))))
    })
    .map(meeting => {
      const id = employeeId(meeting)
      return item({
        id: `manager-one-on-one-${normalizeId(pick(meeting, 'id'))}`,
        domain: 'performance',
        title: '1:1 follow-up needs attention',
        detail: `${employeeName(employeesById.get(id), id)} has unresolved 1:1 follow-up.`,
        employeeId: id,
        employeeName: employeeName(employeesById.get(id), id),
        score: normalizeStatus(pick(meeting, 'status')) === 'missed' ? 70 : 52,
        route: '/performance?tab=one-on-ones',
        whyThisMatters: 'Unresolved 1:1 actions erode manager trust and leave blockers invisible.',
        safeNextAction: 'Open 1:1s and close, reschedule, or assign the next action.',
        evidence: [`Meeting status: ${normalizeStatus(pick(meeting, 'status'))}.`],
      })
    })

  return [...reviews, ...goals, ...oneOnOnes]
}

function buildLearningItems(input: ManagerMissionControlInput, teamIds: Set<string>, employeesById: Map<string, LooseRecord>): ManagerMissionItem[] {
  const coursesById = new Map((input.courses ?? []).map(course => [normalizeId(pick(course, 'id')), course]))
  return (input.learningEnrollments ?? [])
    .filter(enrollment => {
      const id = employeeId(enrollment)
      const course = coursesById.get(normalizeId(pick(enrollment, 'courseId', 'course_id')))
      return teamIds.has(id) &&
        normalizeStatus(pick(enrollment, 'status')) !== 'completed' &&
        Boolean(pick(course, 'isMandatory', 'is_mandatory', 'mandatory'))
    })
    .map(enrollment => {
      const id = employeeId(enrollment)
      const course = coursesById.get(normalizeId(pick(enrollment, 'courseId', 'course_id')))
      const progress = amount(pick(enrollment, 'progress'))
      return item({
        id: `manager-learning-${normalizeId(pick(enrollment, 'id'))}`,
        domain: 'learning',
        title: 'Mandatory learning gap on team',
        detail: `${employeeName(employeesById.get(id), id)} is at ${progress}% on ${pick(course, 'title', 'name') ?? 'mandatory learning'}.`,
        employeeId: id,
        employeeName: employeeName(employeesById.get(id), id),
        score: progress === 0 ? 68 : 50,
        route: '/learning',
        whyThisMatters: 'Mandatory learning gaps can become audit, compliance, or role-readiness issues.',
        safeNextAction: 'Nudge the learner and confirm the assignment still matches their role.',
        evidence: [`Enrollment status: ${normalizeStatus(pick(enrollment, 'status'))}.`, `Progress: ${progress}%.`],
      })
    })
}

export function buildManagerMissionControl(input: ManagerMissionControlInput): ManagerMissionControl {
  const now = input.now instanceof Date ? input.now : new Date(input.now ?? Date.now())
  const { team, teamIds, employeesById } = getTeam(input)
  const maxItems = input.maxItems ?? 12
  const items = [
    ...buildExpenseItems(input, teamIds, employeesById),
    ...buildTimeItems(input, teamIds, employeesById),
    ...buildPerformanceItems(input, now, teamIds, employeesById),
    ...buildLearningItems(input, teamIds, employeesById),
  ].sort((a, b) => b.score - a.score || a.employeeName.localeCompare(b.employeeName)).slice(0, maxItems)

  const counts = items.reduce((acc, current) => {
    acc[current.severity] += 1
    return acc
  }, { critical: 0, high: 0, medium: 0, low: 0 })

  return {
    managerId: input.managerId,
    teamSize: team.length,
    totalItems: items.length,
    criticalCount: counts.critical,
    highCount: counts.high,
    mediumCount: counts.medium,
    lowCount: counts.low,
    topFocus: items[0] ?? null,
    items,
    evidence: [
      `${team.length} direct report${team.length === 1 ? '' : 's'} evaluated.`,
      `${items.length} manager mission item${items.length === 1 ? '' : 's'} returned.`,
    ],
  }
}

