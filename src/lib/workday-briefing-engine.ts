type LooseRecord = Record<string, any>

export type BriefingDomain =
  | 'people'
  | 'expense'
  | 'payroll'
  | 'learning'
  | 'performance'
  | 'it'
  | 'compliance'
  | 'finance'
  | 'workflow'

export type BriefingSeverity = 'critical' | 'high' | 'medium' | 'low'

export interface WorkdayBriefingItem {
  id: string
  domain: BriefingDomain
  title: string
  detail: string
  severity: BriefingSeverity
  score: number
  route: string
  ownerHint: string
  whyThisMatters: string
  safeNextAction: string
  evidence: string[]
}

export interface WorkdayBriefing {
  generatedAt: string
  persona: string
  totalSignals: number
  criticalCount: number
  highCount: number
  mediumCount: number
  lowCount: number
  items: WorkdayBriefingItem[]
  topFocus: WorkdayBriefingItem | null
  evidence: string[]
}

export interface WorkdayBriefingInput {
  persona?: string
  now?: string | Date
  maxItems?: number
  employees?: LooseRecord[]
  expenseReports?: LooseRecord[]
  payrollRuns?: LooseRecord[]
  learningEnrollments?: LooseRecord[]
  courses?: LooseRecord[]
  goals?: LooseRecord[]
  performanceReviews?: LooseRecord[]
  oneOnOnes?: LooseRecord[]
  devices?: LooseRecord[]
  appAssignments?: LooseRecord[]
  complianceRequirements?: LooseRecord[]
  invoices?: LooseRecord[]
  workflows?: LooseRecord[]
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

function money(value: any): number {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : 0
}

function dateValue(value: any): number | null {
  if (!value) return null
  const date = new Date(value)
  const time = date.getTime()
  return Number.isFinite(time) ? time : null
}

function daysUntil(value: any, now: Date): number | null {
  const time = dateValue(value)
  if (time === null) return null
  return Math.ceil((time - now.getTime()) / (1000 * 60 * 60 * 24))
}

function severityFromScore(score: number): BriefingSeverity {
  if (score >= 85) return 'critical'
  if (score >= 70) return 'high'
  if (score >= 45) return 'medium'
  return 'low'
}

function item(input: Omit<WorkdayBriefingItem, 'severity'>): WorkdayBriefingItem {
  return {
    ...input,
    severity: severityFromScore(input.score),
  }
}

function employeeName(employee: LooseRecord | undefined, employeeId: string): string {
  if (!employee) return employeeId ? `Employee ${employeeId}` : 'Employee'
  return String(
    pick(employee, 'fullName', 'full_name', 'name') ??
    pick(pick(employee, 'profile'), 'fullName', 'full_name', 'name') ??
    employeeId
  )
}

function employeeById(employees: LooseRecord[]): Map<string, LooseRecord> {
  return new Map(employees.map(employee => [normalizeId(pick(employee, 'id', 'employeeId', 'employee_id')), employee]))
}

function buildPeopleSignals(input: WorkdayBriefingInput, now: Date): WorkdayBriefingItem[] {
  const signals: WorkdayBriefingItem[] = []
  for (const employee of input.employees ?? []) {
    const id = normalizeId(pick(employee, 'id', 'employeeId', 'employee_id'))
    const startDays = daysUntil(pick(employee, 'startDate', 'start_date', 'hireDate', 'hire_date'), now)
    const terminationDays = daysUntil(pick(employee, 'terminationDate', 'termination_date', 'lastDay', 'last_day'), now)
    const isActive = pick(employee, 'isActive', 'is_active') !== false

    if (startDays !== null && startDays >= 0 && startDays <= 7) {
      signals.push(item({
        id: `people-joiner-${id}`,
        domain: 'people',
        title: `${employeeName(employee, id)} starts in ${startDays} day${startDays === 1 ? '' : 's'}`,
        detail: 'New hire readiness should be checked across HR, IT, payroll, learning, and buddy setup.',
        score: startDays <= 1 ? 86 : 72,
        route: '/onboarding',
        ownerHint: 'People Ops',
        whyThisMatters: 'A late joiner handoff creates a bad first day and spills into IT, payroll, and compliance.',
        safeNextAction: 'Open onboarding and confirm documents, access, equipment, payroll setup, learning, and buddy coverage.',
        evidence: [`Start date is ${pick(employee, 'startDate', 'start_date', 'hireDate', 'hire_date')}.`],
      }))
    }

    if (isActive && terminationDays !== null && terminationDays >= 0 && terminationDays <= 14) {
      signals.push(item({
        id: `people-leaver-${id}`,
        domain: 'people',
        title: `${employeeName(employee, id)} leaves in ${terminationDays} day${terminationDays === 1 ? '' : 's'}`,
        detail: 'Leaver closure should be coordinated across access, devices, final pay, benefits, documents, and knowledge transfer.',
        score: terminationDays <= 3 ? 90 : 78,
        route: '/offboarding',
        ownerHint: 'People Ops + IT',
        whyThisMatters: 'Missed leaver steps increase security, payroll, and compliance risk.',
        safeNextAction: 'Open offboarding and verify access revoke, device return, final pay, benefits, knowledge transfer, and archive tasks.',
        evidence: [`Termination date is ${pick(employee, 'terminationDate', 'termination_date', 'lastDay', 'last_day')}.`],
      }))
    }
  }
  return signals
}

function buildExpenseSignals(input: WorkdayBriefingInput): WorkdayBriefingItem[] {
  return (input.expenseReports ?? [])
    .filter(report => ['pending', 'submitted', 'pending_approval', 'approved'].includes(normalizeStatus(pick(report, 'status'))))
    .map(report => {
      const amount = money(pick(report, 'totalAmount', 'total_amount', 'amount'))
      const status = normalizeStatus(pick(report, 'status'))
      const approvedAwaitingPayment = status === 'approved'
      const score = approvedAwaitingPayment ? 58 : amount > 2500 ? 82 : amount > 1000 ? 72 : 50
      return item({
        id: `expense-${normalizeId(pick(report, 'id'))}`,
        domain: 'expense',
        title: approvedAwaitingPayment ? 'Approved expense awaiting reimbursement' : 'Expense report needs review',
        detail: `${pick(report, 'title', 'description') ?? 'Expense report'} is ${status.replace(/_/g, ' ')} for ${amount}.`,
        score,
        route: approvedAwaitingPayment ? '/expense?tab=reimbursement' : '/expense?tab=reports',
        ownerHint: approvedAwaitingPayment ? 'Finance' : 'Manager or Finance',
        whyThisMatters: 'Expense delays frustrate employees and weak policy evidence can create finance leakage.',
        safeNextAction: approvedAwaitingPayment ? 'Move the report into the next reimbursement batch or confirm payment timing.' : 'Review receipt, policy, budget, and approval evidence before changing status.',
        evidence: [`Status: ${status}.`, `Amount: ${amount}.`],
      })
    })
}

function buildPayrollSignals(input: WorkdayBriefingInput): WorkdayBriefingItem[] {
  return (input.payrollRuns ?? [])
    .filter(run => ['draft', 'pending_hr', 'pending_finance', 'approved', 'processing'].includes(normalizeStatus(pick(run, 'status'))))
    .map(run => {
      const status = normalizeStatus(pick(run, 'status'))
      const pendingApproval = ['pending_hr', 'pending_finance'].includes(status)
      return item({
        id: `payroll-${normalizeId(pick(run, 'id'))}`,
        domain: 'payroll',
        title: pendingApproval ? 'Payroll run is waiting for approval' : 'Payroll run needs operational attention',
        detail: `${pick(run, 'period', 'name') ?? 'Payroll run'} is ${status.replace(/_/g, ' ')}.`,
        score: pendingApproval ? 88 : status === 'processing' ? 74 : 56,
        route: '/payroll',
        ownerHint: status === 'pending_finance' ? 'Finance' : 'HR Payroll',
        whyThisMatters: 'Payroll blockers are high-trust issues because they affect employee pay and statutory deadlines.',
        safeNextAction: 'Open payroll, review variance, statutory, bank-detail, and approval evidence before advancing the run.',
        evidence: [`Status: ${status}.`],
      })
    })
}

function buildLearningSignals(input: WorkdayBriefingInput): WorkdayBriefingItem[] {
  const coursesById = new Map((input.courses ?? []).map(course => [normalizeId(pick(course, 'id')), course]))
  return (input.learningEnrollments ?? [])
    .filter(enrollment => {
      const status = normalizeStatus(pick(enrollment, 'status'))
      const course = coursesById.get(normalizeId(pick(enrollment, 'courseId', 'course_id')))
      return status !== 'completed' && Boolean(pick(course, 'isMandatory', 'is_mandatory', 'mandatory'))
    })
    .map(enrollment => {
      const course = coursesById.get(normalizeId(pick(enrollment, 'courseId', 'course_id')))
      const progress = money(pick(enrollment, 'progress'))
      return item({
        id: `learning-${normalizeId(pick(enrollment, 'id'))}`,
        domain: 'learning',
        title: 'Mandatory learning is not complete',
        detail: `${pick(course, 'title', 'name') ?? 'Mandatory course'} is at ${progress}% progress.`,
        score: progress === 0 ? 70 : 54,
        route: '/learning',
        ownerHint: 'Employee + Manager',
        whyThisMatters: 'Compliance learning gaps can block audit readiness and role readiness.',
        safeNextAction: 'Nudge the learner or manager and confirm the course is still assigned to the right audience.',
        evidence: [`Enrollment status: ${normalizeStatus(pick(enrollment, 'status'))}.`, `Progress: ${progress}%.`],
      })
    })
}

function buildPerformanceSignals(input: WorkdayBriefingInput, now: Date): WorkdayBriefingItem[] {
  const reviewSignals = (input.performanceReviews ?? [])
    .filter(review => ['pending', 'in_progress', 'draft'].includes(normalizeStatus(pick(review, 'status'))))
    .map(review => {
      const dueDays = daysUntil(pick(review, 'dueDate', 'due_date', 'reviewDate', 'review_date'), now)
      return item({
        id: `performance-review-${normalizeId(pick(review, 'id'))}`,
        domain: 'performance' as const,
        title: 'Performance review needs completion',
        detail: `${pick(review, 'title', 'cycle', 'type') ?? 'Review'} is ${normalizeStatus(pick(review, 'status')).replace(/_/g, ' ')}${dueDays !== null ? ` and due in ${dueDays} day${dueDays === 1 ? '' : 's'}` : ''}.`,
        score: dueDays !== null && dueDays <= 2 ? 78 : 55,
        route: '/performance?tab=reviews',
        ownerHint: 'Manager',
        whyThisMatters: 'Late reviews weaken calibration, growth planning, and compensation decisions.',
        safeNextAction: 'Open reviews and complete ratings, feedback, calibration evidence, and growth follow-ups.',
        evidence: [`Status: ${normalizeStatus(pick(review, 'status'))}.`],
      })
    })

  const goalSignals = (input.goals ?? [])
    .filter(goal => {
      const progress = money(pick(goal, 'progress', 'completion', 'completion_percent'))
      const dueDays = daysUntil(pick(goal, 'dueDate', 'due_date', 'targetDate', 'target_date'), now)
      return dueDays !== null && dueDays <= 14 && progress < 60
    })
    .map(goal => item({
      id: `performance-goal-${normalizeId(pick(goal, 'id'))}`,
      domain: 'performance',
      title: 'Goal is at risk before deadline',
      detail: `${pick(goal, 'title', 'name') ?? 'Goal'} is at ${money(pick(goal, 'progress', 'completion', 'completion_percent'))}% progress.`,
      score: 65,
      route: '/performance?tab=goals',
      ownerHint: 'Manager',
      whyThisMatters: 'At-risk goals should trigger coaching or reprioritization before the review cycle closes.',
      safeNextAction: 'Open goals, confirm blockers, and schedule the next manager follow-up.',
      evidence: [`Due date: ${pick(goal, 'dueDate', 'due_date', 'targetDate', 'target_date')}.`],
    }))

  return [...reviewSignals, ...goalSignals]
}

function buildItSignals(input: WorkdayBriefingInput): WorkdayBriefingItem[] {
  const deviceSignals = (input.devices ?? [])
    .filter(device => ['lost', 'overdue', 'unhealthy', 'non_compliant', 'needs_repair'].includes(normalizeStatus(pick(device, 'status', 'healthStatus', 'health_status'))))
    .map(device => item({
      id: `it-device-${normalizeId(pick(device, 'id'))}`,
      domain: 'it',
      title: 'Device needs IT attention',
      detail: `${pick(device, 'name', 'assetTag', 'asset_tag') ?? 'Device'} is ${normalizeStatus(pick(device, 'status', 'healthStatus', 'health_status')).replace(/_/g, ' ')}.`,
      score: 80,
      route: '/it/devices',
      ownerHint: 'IT',
      whyThisMatters: 'Device gaps can block work, weaken endpoint security, and affect joiner/leaver readiness.',
      safeNextAction: 'Open devices and confirm owner, status, evidence, and remediation path.',
      evidence: [`Device status: ${normalizeStatus(pick(device, 'status', 'healthStatus', 'health_status'))}.`],
    }))

  const accessSignals = (input.appAssignments ?? [])
    .filter(assignment => ['pending', 'failed', 'revocation_pending', 'overdue'].includes(normalizeStatus(pick(assignment, 'status'))))
    .map(assignment => item({
      id: `it-access-${normalizeId(pick(assignment, 'id'))}`,
      domain: 'it',
      title: 'App access task needs attention',
      detail: `${pick(assignment, 'appName', 'app_name', 'app') ?? 'Application access'} is ${normalizeStatus(pick(assignment, 'status')).replace(/_/g, ' ')}.`,
      score: normalizeStatus(pick(assignment, 'status')) === 'failed' ? 84 : 62,
      route: '/it/apps',
      ownerHint: 'IT',
      whyThisMatters: 'Access delays or revocation misses affect productivity and security posture.',
      safeNextAction: 'Open app access and verify approval, provisioning, revocation, and audit evidence.',
      evidence: [`Assignment status: ${normalizeStatus(pick(assignment, 'status'))}.`],
    }))

  return [...deviceSignals, ...accessSignals]
}

function buildComplianceSignals(input: WorkdayBriefingInput, now: Date): WorkdayBriefingItem[] {
  return (input.complianceRequirements ?? [])
    .filter(requirement => {
      const status = normalizeStatus(pick(requirement, 'status'))
      const dueDays = daysUntil(pick(requirement, 'dueDate', 'due_date', 'deadline'), now)
      return ['pending', 'at_risk', 'overdue', 'failed'].includes(status) || (dueDays !== null && dueDays <= 14 && status !== 'completed')
    })
    .map(requirement => {
      const status = normalizeStatus(pick(requirement, 'status'))
      const dueDays = daysUntil(pick(requirement, 'dueDate', 'due_date', 'deadline'), now)
      return item({
        id: `compliance-${normalizeId(pick(requirement, 'id'))}`,
        domain: 'compliance',
        title: status === 'overdue' ? 'Compliance requirement is overdue' : 'Compliance requirement needs follow-up',
        detail: `${pick(requirement, 'title', 'requirement', 'name') ?? 'Requirement'} is ${status || 'pending'}${dueDays !== null ? ` and due in ${dueDays} day${dueDays === 1 ? '' : 's'}` : ''}.`,
        score: status === 'overdue' || status === 'failed' ? 92 : dueDays !== null && dueDays <= 3 ? 82 : 64,
        route: '/compliance',
        ownerHint: 'Compliance',
        whyThisMatters: 'Compliance misses can become regulatory, payroll, access, or audit risk.',
        safeNextAction: 'Open compliance and attach evidence, owner, deadline, and remediation status.',
        evidence: [`Status: ${status || 'pending'}.`],
      })
    })
}

function buildFinanceSignals(input: WorkdayBriefingInput, now: Date): WorkdayBriefingItem[] {
  return (input.invoices ?? [])
    .filter(invoice => {
      const status = normalizeStatus(pick(invoice, 'status'))
      const dueDays = daysUntil(pick(invoice, 'dueDate', 'due_date'), now)
      return ['overdue', 'sent', 'pending_approval'].includes(status) || (dueDays !== null && dueDays <= 7 && status !== 'paid')
    })
    .map(invoice => {
      const status = normalizeStatus(pick(invoice, 'status'))
      const dueDays = daysUntil(pick(invoice, 'dueDate', 'due_date'), now)
      return item({
        id: `finance-invoice-${normalizeId(pick(invoice, 'id'))}`,
        domain: 'finance',
        title: status === 'overdue' ? 'Invoice is overdue' : 'Invoice needs finance follow-up',
        detail: `${pick(invoice, 'invoiceNumber', 'invoice_number', 'description') ?? 'Invoice'} is ${status} for ${money(pick(invoice, 'amount'))}.`,
        score: status === 'overdue' ? 82 : dueDays !== null && dueDays <= 2 ? 66 : 48,
        route: '/invoices',
        ownerHint: 'Finance',
        whyThisMatters: 'Invoice delays affect vendor trust, close readiness, and spend visibility.',
        safeNextAction: 'Open invoices and confirm approval, payment timing, or dispute status.',
        evidence: [`Due date: ${pick(invoice, 'dueDate', 'due_date') ?? 'unknown'}.`],
      })
    })
}

function buildWorkflowSignals(input: WorkdayBriefingInput): WorkdayBriefingItem[] {
  return (input.workflows ?? [])
    .filter(workflow => ['failed', 'paused', 'error', 'needs_review'].includes(normalizeStatus(pick(workflow, 'status'))))
    .map(workflow => item({
      id: `workflow-${normalizeId(pick(workflow, 'id'))}`,
      domain: 'workflow',
      title: 'Workflow automation needs review',
      detail: `${pick(workflow, 'name', 'title') ?? 'Workflow'} is ${normalizeStatus(pick(workflow, 'status')).replace(/_/g, ' ')}.`,
      score: normalizeStatus(pick(workflow, 'status')) === 'failed' ? 76 : 54,
      route: '/workflows',
      ownerHint: 'Ops Automation',
      whyThisMatters: 'Failed automations silently break cross-module handoffs.',
      safeNextAction: 'Open workflows and inspect recent runs, owner, retry path, and affected entities.',
      evidence: [`Status: ${normalizeStatus(pick(workflow, 'status'))}.`],
    }))
}

export function buildWorkdayBriefing(input: WorkdayBriefingInput): WorkdayBriefing {
  const now = input.now instanceof Date ? input.now : new Date(input.now ?? Date.now())
  const maxItems = input.maxItems ?? 10
  const items = [
    ...buildPeopleSignals(input, now),
    ...buildExpenseSignals(input),
    ...buildPayrollSignals(input),
    ...buildLearningSignals(input),
    ...buildPerformanceSignals(input, now),
    ...buildItSignals(input),
    ...buildComplianceSignals(input, now),
    ...buildFinanceSignals(input, now),
    ...buildWorkflowSignals(input),
  ].sort((a, b) => b.score - a.score || a.domain.localeCompare(b.domain)).slice(0, maxItems)

  const counts = items.reduce((acc, current) => {
    acc[current.severity] += 1
    return acc
  }, { critical: 0, high: 0, medium: 0, low: 0 })

  return {
    generatedAt: now.toISOString(),
    persona: input.persona ?? 'operator',
    totalSignals: items.length,
    criticalCount: counts.critical,
    highCount: counts.high,
    mediumCount: counts.medium,
    lowCount: counts.low,
    items,
    topFocus: items[0] ?? null,
    evidence: [
      `${items.length} prioritized workday signal${items.length === 1 ? '' : 's'} returned.`,
      `${counts.critical} critical, ${counts.high} high, ${counts.medium} medium, ${counts.low} low.`,
    ],
  }
}

