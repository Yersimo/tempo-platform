type LooseRecord = Record<string, any>

export type EmployeeConciergeDomain =
  | 'profile'
  | 'payroll'
  | 'expense'
  | 'learning'
  | 'documents'
  | 'benefits'
  | 'time'
  | 'support'

export type EmployeeConciergeSeverity = 'urgent' | 'high' | 'medium' | 'low'

export interface EmployeeConciergeItem {
  id: string
  domain: EmployeeConciergeDomain
  title: string
  detail: string
  severity: EmployeeConciergeSeverity
  score: number
  route: string
  whyThisMatters: string
  safeNextAction: string
  evidence: string[]
}

export interface EmployeeConciergeBrief {
  employeeId: string
  employeeName: string
  totalItems: number
  urgentCount: number
  highCount: number
  mediumCount: number
  lowCount: number
  topFocus: EmployeeConciergeItem | null
  items: EmployeeConciergeItem[]
  evidence: string[]
}

export interface EmployeeConciergeInput {
  employeeId: string
  now?: string | Date
  maxItems?: number
  employees?: LooseRecord[]
  payrollRuns?: LooseRecord[]
  payslips?: LooseRecord[]
  expenseReports?: LooseRecord[]
  learningEnrollments?: LooseRecord[]
  courses?: LooseRecord[]
  documents?: LooseRecord[]
  benefitEnrollments?: LooseRecord[]
  benefitPlans?: LooseRecord[]
  timeOffRequests?: LooseRecord[]
  supportTickets?: LooseRecord[]
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

function numeric(value: any): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
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

function severity(score: number): EmployeeConciergeSeverity {
  if (score >= 85) return 'urgent'
  if (score >= 70) return 'high'
  if (score >= 45) return 'medium'
  return 'low'
}

function item(input: Omit<EmployeeConciergeItem, 'severity'>): EmployeeConciergeItem {
  return { ...input, severity: severity(input.score) }
}

function employeeId(record: LooseRecord): string {
  return normalizeId(pick(record, 'employeeId', 'employee_id', 'personId', 'person_id', 'submittedBy', 'submitted_by'))
}

function employeeName(employee: LooseRecord | undefined, id: string): string {
  if (!employee) return id ? `Employee ${id}` : 'Employee'
  return String(
    pick(employee, 'fullName', 'full_name', 'name') ??
    pick(pick(employee, 'profile'), 'fullName', 'full_name', 'name') ??
    id
  )
}

function isEmployeeRecord(record: LooseRecord, targetEmployeeId: string): boolean {
  return employeeId(record) === targetEmployeeId || normalizeId(pick(record, 'id')) === targetEmployeeId
}

function buildProfileItems(employee: LooseRecord | undefined, employeeId: string): EmployeeConciergeItem[] {
  if (!employee) return []
  const missing: string[] = []
  const profile = pick<LooseRecord>(employee, 'profile') ?? {}
  if (!pick(employee, 'phone', 'phone_number') && !pick(profile, 'phone', 'phone_number')) missing.push('phone')
  if (!pick(employee, 'country') && !pick(profile, 'country')) missing.push('country')
  if (!pick(employee, 'bankAccountLast4', 'bank_account_last4', 'bankDetailsComplete', 'bank_details_complete')) missing.push('bank details')
  if (!pick(employee, 'taxIdLast4', 'tax_id_last4', 'taxDetailsComplete', 'tax_details_complete')) missing.push('tax details')

  if (missing.length === 0) return []
  return [item({
    id: `profile-${employeeId}`,
    domain: 'profile',
    title: 'Complete profile details',
    detail: `Missing ${missing.join(', ')}.`,
    score: missing.includes('bank details') || missing.includes('tax details') ? 78 : 48,
    route: '/profile',
    whyThisMatters: 'Incomplete profile, bank, or tax details can block payroll, benefits, and HR support.',
    safeNextAction: 'Open your profile and update the missing details before payroll or HR deadlines.',
    evidence: [`Missing fields: ${missing.join(', ')}.`],
  })]
}

function buildPayrollItems(input: EmployeeConciergeInput): EmployeeConciergeItem[] {
  const payslipItems = (input.payslips ?? [])
    .filter(payslip => employeeId(payslip) === input.employeeId && ['available', 'generated', 'unviewed'].includes(normalizeStatus(pick(payslip, 'status'))))
    .map(payslip => item({
      id: `payslip-${normalizeId(pick(payslip, 'id'))}`,
      domain: 'payroll',
      title: 'Payslip is ready to view',
      detail: `${pick(payslip, 'period', 'title') ?? 'Latest payslip'} is available.`,
      score: 42,
      route: '/payslips',
      whyThisMatters: 'Payslip review helps employees spot pay, tax, or benefit deduction issues early.',
      safeNextAction: 'Open payslips and verify gross pay, deductions, net pay, and bank deposit details.',
      evidence: [`Status: ${normalizeStatus(pick(payslip, 'status'))}.`],
    }))

  const payrollItems = (input.payrollRuns ?? [])
    .filter(run => ['paid', 'processing'].includes(normalizeStatus(pick(run, 'status'))) && Array.isArray(pick(run, 'employeeIds', 'employee_ids')) && (pick<any[]>(run, 'employeeIds', 'employee_ids') ?? []).map(normalizeId).includes(input.employeeId))
    .map(run => item({
      id: `payroll-${normalizeId(pick(run, 'id'))}`,
      domain: 'payroll',
      title: normalizeStatus(pick(run, 'status')) === 'paid' ? 'Payroll payment posted' : 'Payroll payment is processing',
      detail: `${pick(run, 'period', 'name') ?? 'Payroll run'} is ${normalizeStatus(pick(run, 'status'))}.`,
      score: normalizeStatus(pick(run, 'status')) === 'processing' ? 52 : 38,
      route: '/payslips',
      whyThisMatters: 'Payroll status gives employees confidence about pay timing and issue escalation.',
      safeNextAction: 'Check payslip availability and contact payroll only if the payment details look wrong.',
      evidence: [`Payroll status: ${normalizeStatus(pick(run, 'status'))}.`],
    }))

  return [...payslipItems, ...payrollItems]
}

function buildExpenseItems(input: EmployeeConciergeInput): EmployeeConciergeItem[] {
  return (input.expenseReports ?? [])
    .filter(report => employeeId(report) === input.employeeId)
    .filter(report => ['draft', 'rejected', 'submitted', 'pending_approval', 'approved'].includes(normalizeStatus(pick(report, 'status'))))
    .map(report => {
      const status = normalizeStatus(pick(report, 'status'))
      const rejected = status === 'rejected'
      const draft = status === 'draft'
      const approved = status === 'approved'
      return item({
        id: `expense-${normalizeId(pick(report, 'id'))}`,
        domain: 'expense',
        title: rejected ? 'Expense report needs correction' : draft ? 'Draft expense is not submitted' : approved ? 'Expense approved, awaiting reimbursement' : 'Expense report is in review',
        detail: `${pick(report, 'title', 'description') ?? 'Expense report'} is ${status.replace(/_/g, ' ')} for ${numeric(pick(report, 'totalAmount', 'total_amount', 'amount'))}.`,
        score: rejected ? 82 : draft ? 58 : approved ? 48 : 36,
        route: approved ? '/expense?tab=reimbursement' : '/expense?tab=reports',
        whyThisMatters: rejected || draft ? 'Expense issues delay reimbursement.' : 'Expense visibility reduces uncertainty while approvals and reimbursement move.',
        safeNextAction: rejected ? 'Open the report, read the rejection reason, fix evidence, and resubmit.' : draft ? 'Add missing receipts or line items, then submit the report.' : approved ? 'Check reimbursement timing and batch status.' : 'Monitor status and respond quickly if finance asks for evidence.',
        evidence: [`Status: ${status}.`],
      })
    })
}

function buildLearningItems(input: EmployeeConciergeInput): EmployeeConciergeItem[] {
  const coursesById = new Map((input.courses ?? []).map(course => [normalizeId(pick(course, 'id')), course]))
  return (input.learningEnrollments ?? [])
    .filter(enrollment => employeeId(enrollment) === input.employeeId && normalizeStatus(pick(enrollment, 'status')) !== 'completed')
    .map(enrollment => {
      const course = coursesById.get(normalizeId(pick(enrollment, 'courseId', 'course_id')))
      const mandatory = Boolean(pick(course, 'isMandatory', 'is_mandatory', 'mandatory'))
      const progress = numeric(pick(enrollment, 'progress'))
      return item({
        id: `learning-${normalizeId(pick(enrollment, 'id'))}`,
        domain: 'learning',
        title: mandatory ? 'Mandatory learning still open' : 'Learning course in progress',
        detail: `${pick(course, 'title', 'name') ?? 'Course'} is at ${progress}% progress.`,
        score: mandatory && progress === 0 ? 76 : mandatory ? 60 : 34,
        route: '/learning',
        whyThisMatters: mandatory ? 'Mandatory learning can affect compliance and role readiness.' : 'Learning progress helps keep career development moving.',
        safeNextAction: mandatory ? 'Resume the course and complete required checks before the deadline.' : 'Resume or intentionally defer the course so your plan stays accurate.',
        evidence: [`Enrollment status: ${normalizeStatus(pick(enrollment, 'status'))}.`, `Progress: ${progress}%.`],
      })
    })
}

function buildDocumentItems(input: EmployeeConciergeInput, now: Date): EmployeeConciergeItem[] {
  return (input.documents ?? [])
    .filter(document => {
      const signers = pick<any[]>(document, 'signers') ?? []
      const signerMatch = signers.some(signer => employeeId(signer) === input.employeeId && ['pending', 'sent', 'needs_signature'].includes(normalizeStatus(pick(signer, 'status'))))
      return employeeId(document) === input.employeeId || signerMatch
    })
    .filter(document => ['pending', 'sent', 'needs_signature', 'awaiting_signature'].includes(normalizeStatus(pick(document, 'status'))) || (pick<any[]>(document, 'signers') ?? []).some(signer => employeeId(signer) === input.employeeId && ['pending', 'sent', 'needs_signature'].includes(normalizeStatus(pick(signer, 'status')))))
    .map(document => {
      const dueDays = daysUntil(pick(document, 'dueDate', 'due_date', 'expiresAt', 'expires_at'), now)
      return item({
        id: `document-${normalizeId(pick(document, 'id'))}`,
        domain: 'documents',
        title: dueDays !== null && dueDays <= 2 ? 'Document signature due soon' : 'Document needs signature',
        detail: `${pick(document, 'title', 'name', 'documentName', 'document_name') ?? 'Document'} needs your review.`,
        score: dueDays !== null && dueDays <= 1 ? 86 : 66,
        route: '/documents',
        whyThisMatters: 'Unsigned documents can block onboarding, policy acknowledgement, payroll, or compliance evidence.',
        safeNextAction: 'Open documents, review the content, and sign or decline with a reason.',
        evidence: [`Document status: ${normalizeStatus(pick(document, 'status')) || 'pending'}.`],
      })
    })
}

function buildBenefitItems(input: EmployeeConciergeInput, now: Date): EmployeeConciergeItem[] {
  const openEnrollmentPlans = (input.benefitPlans ?? [])
    .filter(plan => normalizeStatus(pick(plan, 'status')) === 'active' && Boolean(pick(plan, 'isOpenEnrollment', 'is_open_enrollment', 'openEnrollment', 'open_enrollment')))
  const enrolledPlanIds = new Set((input.benefitEnrollments ?? []).filter(enrollment => employeeId(enrollment) === input.employeeId).map(enrollment => normalizeId(pick(enrollment, 'planId', 'plan_id'))))

  const enrollmentItems = openEnrollmentPlans
    .filter(plan => !enrolledPlanIds.has(normalizeId(pick(plan, 'id'))))
    .map(plan => {
      const dueDays = daysUntil(pick(plan, 'enrollmentDeadline', 'enrollment_deadline', 'deadline'), now)
      return item({
        id: `benefit-plan-${normalizeId(pick(plan, 'id'))}`,
        domain: 'benefits',
        title: 'Benefit enrollment needs attention',
        detail: `${pick(plan, 'name', 'title') ?? 'Benefit plan'} is available for enrollment${dueDays !== null ? ` for ${dueDays} more day${dueDays === 1 ? '' : 's'}` : ''}.`,
        score: dueDays !== null && dueDays <= 3 ? 82 : 58,
        route: '/benefits',
        whyThisMatters: 'Missing enrollment windows can leave employees without intended coverage.',
        safeNextAction: 'Open benefits, compare coverage, and enroll or waive with evidence.',
        evidence: [`Plan is open for enrollment.`],
      })
    })

  const pendingEnrollmentItems = (input.benefitEnrollments ?? [])
    .filter(enrollment => employeeId(enrollment) === input.employeeId && ['pending', 'submitted', 'needs_evidence'].includes(normalizeStatus(pick(enrollment, 'status'))))
    .map(enrollment => item({
      id: `benefit-enrollment-${normalizeId(pick(enrollment, 'id'))}`,
      domain: 'benefits',
      title: 'Benefit enrollment is not complete',
      detail: `Enrollment is ${normalizeStatus(pick(enrollment, 'status')).replace(/_/g, ' ')}.`,
      score: normalizeStatus(pick(enrollment, 'status')) === 'needs_evidence' ? 74 : 50,
      route: '/benefits',
      whyThisMatters: 'Incomplete benefit elections can delay coverage or payroll deductions.',
      safeNextAction: 'Open benefits and provide missing evidence or confirm election status.',
      evidence: [`Enrollment status: ${normalizeStatus(pick(enrollment, 'status'))}.`],
    }))

  return [...enrollmentItems, ...pendingEnrollmentItems]
}

function buildTimeItems(input: EmployeeConciergeInput): EmployeeConciergeItem[] {
  return (input.timeOffRequests ?? [])
    .filter(request => employeeId(request) === input.employeeId && ['pending', 'submitted', 'approved', 'rejected'].includes(normalizeStatus(pick(request, 'status'))))
    .map(request => {
      const status = normalizeStatus(pick(request, 'status'))
      return item({
        id: `time-off-${normalizeId(pick(request, 'id'))}`,
        domain: 'time',
        title: status === 'rejected' ? 'Time-off request needs revision' : status === 'approved' ? 'Time off approved' : 'Time-off request is pending',
        detail: `${pick(request, 'type', 'leaveType', 'leave_type') ?? 'Time off'} is ${status}.`,
        score: status === 'rejected' ? 64 : status === 'pending' || status === 'submitted' ? 42 : 24,
        route: '/time-attendance',
        whyThisMatters: 'Clear time-off status helps employees plan handoffs and coverage.',
        safeNextAction: status === 'rejected' ? 'Review the reason and resubmit with adjusted dates or coverage.' : 'Check approval status and coverage notes.',
        evidence: [`Request status: ${status}.`],
      })
    })
}

function buildSupportItems(input: EmployeeConciergeInput): EmployeeConciergeItem[] {
  return (input.supportTickets ?? [])
    .filter(ticket => isEmployeeRecord(ticket, input.employeeId) && ['open', 'in_progress', 'waiting_on_customer', 'needs_response'].includes(normalizeStatus(pick(ticket, 'status'))))
    .map(ticket => {
      const status = normalizeStatus(pick(ticket, 'status'))
      const waitingOnEmployee = ['waiting_on_customer', 'needs_response'].includes(status)
      return item({
        id: `support-${normalizeId(pick(ticket, 'id'))}`,
        domain: 'support',
        title: waitingOnEmployee ? 'Support ticket needs your response' : 'Support ticket is still open',
        detail: `${pick(ticket, 'subject', 'title') ?? 'Support ticket'} is ${status.replace(/_/g, ' ')}.`,
        score: waitingOnEmployee ? 72 : 36,
        route: '/support',
        whyThisMatters: 'Support requests move faster when employees respond with the missing detail or evidence.',
        safeNextAction: waitingOnEmployee ? 'Open support and reply with the requested information.' : 'Check the ticket status and add context if the issue changed.',
        evidence: [`Ticket status: ${status}.`],
      })
    })
}

export function buildEmployeeConciergeBrief(input: EmployeeConciergeInput): EmployeeConciergeBrief {
  const now = input.now instanceof Date ? input.now : new Date(input.now ?? Date.now())
  const employee = (input.employees ?? []).find(candidate => normalizeId(pick(candidate, 'id', 'employeeId', 'employee_id')) === input.employeeId)
  const maxItems = input.maxItems ?? 10
  const items = [
    ...buildProfileItems(employee, input.employeeId),
    ...buildPayrollItems(input),
    ...buildExpenseItems(input),
    ...buildLearningItems(input),
    ...buildDocumentItems(input, now),
    ...buildBenefitItems(input, now),
    ...buildTimeItems(input),
    ...buildSupportItems(input),
  ].sort((a, b) => b.score - a.score || a.domain.localeCompare(b.domain)).slice(0, maxItems)

  const counts = items.reduce((acc, current) => {
    acc[current.severity] += 1
    return acc
  }, { urgent: 0, high: 0, medium: 0, low: 0 })

  return {
    employeeId: input.employeeId,
    employeeName: employeeName(employee, input.employeeId),
    totalItems: items.length,
    urgentCount: counts.urgent,
    highCount: counts.high,
    mediumCount: counts.medium,
    lowCount: counts.low,
    topFocus: items[0] ?? null,
    items,
    evidence: [
      `${items.length} employee self-service item${items.length === 1 ? '' : 's'} returned.`,
      `${counts.urgent} urgent, ${counts.high} high, ${counts.medium} medium, ${counts.low} low.`,
    ],
  }
}

