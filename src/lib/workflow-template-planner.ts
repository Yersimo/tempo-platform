type LooseRecord = Record<string, any>

export type WorkflowTemplateCategory =
  | 'lifecycle'
  | 'finance'
  | 'payroll'
  | 'learning'
  | 'compliance'
  | 'support'
  | 'performance'

export type WorkflowTemplatePriority = 'critical' | 'high' | 'medium' | 'low'

export interface WorkflowTemplateStep {
  type: 'trigger' | 'condition' | 'action' | 'approval' | 'delay' | 'notification'
  label: string
  config: Record<string, any>
}

export interface WorkflowTemplateRecommendation {
  id: string
  name: string
  category: WorkflowTemplateCategory
  trigger: string
  priority: WorkflowTemplatePriority
  score: number
  whyItMatters: string
  requiredApprovals: string[]
  safetyGates: string[]
  dryRunChecks: string[]
  steps: WorkflowTemplateStep[]
  evidence: string[]
}

export interface WorkflowTemplatePlan {
  totalRecommendations: number
  criticalCount: number
  highCount: number
  mediumCount: number
  lowCount: number
  recommendations: WorkflowTemplateRecommendation[]
  reviewTable: Array<{
    template: string
    category: WorkflowTemplateCategory
    trigger: string
    priority: WorkflowTemplatePriority
    howToTest: string
    risk: string
  }>
  evidence: string[]
}

export interface WorkflowTemplatePlannerInput {
  maxRecommendations?: number
  employees?: LooseRecord[]
  onboardingTasks?: LooseRecord[]
  offboardingTasks?: LooseRecord[]
  appAssignments?: LooseRecord[]
  devices?: LooseRecord[]
  expenseReports?: LooseRecord[]
  reimbursementBatches?: LooseRecord[]
  payrollRuns?: LooseRecord[]
  learningEnrollments?: LooseRecord[]
  courses?: LooseRecord[]
  complianceRequirements?: LooseRecord[]
  supportTickets?: LooseRecord[]
  performanceReviews?: LooseRecord[]
  goals?: LooseRecord[]
  existingTemplates?: LooseRecord[]
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

function priority(score: number): WorkflowTemplatePriority {
  if (score >= 85) return 'critical'
  if (score >= 70) return 'high'
  if (score >= 45) return 'medium'
  return 'low'
}

function recommendation(input: Omit<WorkflowTemplateRecommendation, 'priority'>): WorkflowTemplateRecommendation {
  return { ...input, priority: priority(input.score) }
}

function templateExists(input: WorkflowTemplatePlannerInput, id: string, name: string): boolean {
  const normalizedId = normalizeId(id)
  const normalizedName = name.toLowerCase()
  return (input.existingTemplates ?? []).some(template =>
    normalizeId(pick(template, 'id', 'templateId', 'template_id')) === normalizedId ||
    String(pick(template, 'name', 'title') ?? '').toLowerCase() === normalizedName
  )
}

function filterNew(input: WorkflowTemplatePlannerInput, recs: WorkflowTemplateRecommendation[]): WorkflowTemplateRecommendation[] {
  return recs.filter(rec => !templateExists(input, rec.id, rec.name))
}

function pendingCount(records: LooseRecord[] | undefined): number {
  return (records ?? []).filter(record => ['pending', 'submitted', 'in_progress', 'failed', 'overdue', 'needs_review', 'pending_approval'].includes(normalizeStatus(pick(record, 'status')))).length
}

function buildLifecycleRecommendations(input: WorkflowTemplatePlannerInput): WorkflowTemplateRecommendation[] {
  const pendingOnboarding = pendingCount(input.onboardingTasks)
  const pendingOffboarding = pendingCount(input.offboardingTasks)
  const failedAccess = (input.appAssignments ?? []).filter(assignment => ['failed', 'pending', 'revocation_pending', 'overdue'].includes(normalizeStatus(pick(assignment, 'status')))).length
  const unreturnedDevices = (input.devices ?? []).filter(device => ['assigned', 'overdue', 'missing', 'lost'].includes(normalizeStatus(pick(device, 'status'))) && normalizeStatus(pick(device, 'lifecycleStatus', 'lifecycle_status')) === 'offboarding').length
  const recs: WorkflowTemplateRecommendation[] = []

  if (pendingOnboarding > 0 || failedAccess > 0) {
    recs.push(recommendation({
      id: 'tpl-joiner-launch-readiness',
      name: 'Joiner Launch Readiness',
      category: 'lifecycle',
      trigger: 'employee_hired',
      score: pendingOnboarding >= 5 || failedAccess >= 3 ? 86 : 70,
      whyItMatters: 'Joiner work should coordinate HR documents, IT access, devices, payroll, learning, and buddy setup before day one.',
      requiredApprovals: ['People Ops owner', 'IT owner'],
      safetyGates: ['Run in dry-run mode first', 'Do not provision access without an approved manager/IT task', 'Do not enroll payroll without complete bank/tax evidence'],
      dryRunChecks: ['New hire receives only preview notifications', 'All required setup modules are present', 'Missing access/device tasks are reported rather than executed'],
      steps: [
        { type: 'trigger', label: 'Employee hired', config: { event: 'employee_hired' } },
        { type: 'condition', label: 'Start date within 14 days', config: { field: 'start_date', operator: 'within_days', value: 14 } },
        { type: 'action', label: 'Create readiness checklist', config: { modules: ['documents', 'it', 'payroll', 'learning', 'buddy'] } },
        { type: 'approval', label: 'People Ops approval', config: { approverRole: 'people_ops' } },
        { type: 'notification', label: 'Notify owner queue', config: { audience: ['manager', 'it', 'payroll'] } },
      ],
      evidence: [`Pending onboarding tasks: ${pendingOnboarding}.`, `Access tasks needing attention: ${failedAccess}.`],
    }))
  }

  if (pendingOffboarding > 0 || unreturnedDevices > 0) {
    recs.push(recommendation({
      id: 'tpl-leaver-closure-control',
      name: 'Leaver Closure Control',
      category: 'lifecycle',
      trigger: 'employee_offboarding_started',
      score: pendingOffboarding >= 5 || unreturnedDevices > 0 ? 88 : 72,
      whyItMatters: 'Leaver automations must close access, devices, payroll, benefits, documents, and knowledge transfer without missing security-critical steps.',
      requiredApprovals: ['People Ops owner', 'IT security owner', 'Payroll owner'],
      safetyGates: ['Never revoke access before the approved effective date', 'Require final-pay confirmation before closure', 'Require device evidence before marking complete'],
      dryRunChecks: ['Revocation tasks are previewed only', 'Final pay task remains pending until payroll confirms', 'Device return evidence is present'],
      steps: [
        { type: 'trigger', label: 'Offboarding started', config: { event: 'employee_offboarding_started' } },
        { type: 'condition', label: 'Effective date approved', config: { field: 'termination_date', operator: 'exists' } },
        { type: 'approval', label: 'IT security approval', config: { approverRole: 'it_security' } },
        { type: 'action', label: 'Create closure checklist', config: { modules: ['access', 'devices', 'payroll', 'benefits', 'knowledge'] } },
        { type: 'notification', label: 'Notify closure owners', config: { audience: ['people_ops', 'it', 'payroll'] } },
      ],
      evidence: [`Pending offboarding tasks: ${pendingOffboarding}.`, `Unreturned offboarding devices: ${unreturnedDevices}.`],
    }))
  }

  return recs
}

function buildFinanceRecommendations(input: WorkflowTemplatePlannerInput): WorkflowTemplateRecommendation[] {
  const pendingExpenses = (input.expenseReports ?? []).filter(report => ['submitted', 'pending_approval', 'approved'].includes(normalizeStatus(pick(report, 'status'))))
  const highValueExpenseCount = pendingExpenses.filter(report => numeric(pick(report, 'totalAmount', 'total_amount', 'amount')) > 1000).length
  const pendingReimbursements = (input.reimbursementBatches ?? []).filter(batch => ['pending', 'processing'].includes(normalizeStatus(pick(batch, 'status')))).length

  if (pendingExpenses.length === 0 && pendingReimbursements === 0) return []
  return [recommendation({
    id: 'tpl-expense-reimbursement-control',
    name: 'Expense Reimbursement Control',
    category: 'finance',
    trigger: 'expense_report_submitted',
    score: highValueExpenseCount > 0 ? 82 : 64,
    whyItMatters: 'Expense automation should preserve receipt, policy, budget, approval, reimbursement, and GL posting evidence before any status change.',
    requiredApprovals: ['Manager', 'Finance owner'],
    safetyGates: ['Block automation when receipt evidence is missing', 'Require finance approval for high-value reports', 'Do not mark reimbursed without batch evidence'],
    dryRunChecks: ['Policy and budget signals are attached', 'High-value reports route to finance', 'Approved reports preview reimbursement batch placement'],
    steps: [
      { type: 'trigger', label: 'Expense report submitted', config: { event: 'expense_report_submitted' } },
      { type: 'condition', label: 'Receipt and policy evidence present', config: { field: 'evidence_status', operator: 'equals', value: 'ready' } },
      { type: 'approval', label: 'Manager approval', config: { approverRole: 'manager' } },
      { type: 'condition', label: 'High-value finance gate', config: { field: 'amount', operator: '>', value: 1000 } },
      { type: 'approval', label: 'Finance approval', config: { approverRole: 'finance' } },
    ],
    evidence: [`Pending expense reports: ${pendingExpenses.length}.`, `High-value pending reports: ${highValueExpenseCount}.`, `Pending reimbursement batches: ${pendingReimbursements}.`],
  })]
}

function buildPayrollRecommendations(input: WorkflowTemplatePlannerInput): WorkflowTemplateRecommendation[] {
  const pendingPayroll = (input.payrollRuns ?? []).filter(run => ['pending_hr', 'pending_finance', 'approved', 'processing'].includes(normalizeStatus(pick(run, 'status'))))
  if (pendingPayroll.length === 0) return []
  return [recommendation({
    id: 'tpl-payroll-preflight-approval',
    name: 'Payroll Preflight Approval',
    category: 'payroll',
    trigger: 'payroll_run_submitted',
    score: 84,
    whyItMatters: 'Payroll automation must expose variance, statutory, bank-detail, and approval evidence before pay movement.',
    requiredApprovals: ['HR payroll owner', 'Finance approver'],
    safetyGates: ['Never authorize payment from a failed preflight', 'Require variance evidence for material changes', 'Require statutory and bank-detail checks before finance approval'],
    dryRunChecks: ['Variance report exists', 'Missing bank/tax details are blocked', 'Approval chain routes HR before Finance'],
    steps: [
      { type: 'trigger', label: 'Payroll run submitted', config: { event: 'payroll_run_submitted' } },
      { type: 'action', label: 'Generate preflight evidence', config: { checks: ['variance', 'statutory', 'bank_details'] } },
      { type: 'approval', label: 'HR approval', config: { approverRole: 'hr_payroll' } },
      { type: 'approval', label: 'Finance approval', config: { approverRole: 'finance' } },
      { type: 'notification', label: 'Notify payroll owners', config: { audience: ['hr_payroll', 'finance'] } },
    ],
    evidence: [`Open payroll runs: ${pendingPayroll.length}.`],
  })]
}

function buildLearningRecommendations(input: WorkflowTemplatePlannerInput): WorkflowTemplateRecommendation[] {
  const coursesById = new Map((input.courses ?? []).map(course => [normalizeId(pick(course, 'id')), course]))
  const mandatoryOpen = (input.learningEnrollments ?? []).filter(enrollment => {
    const course = coursesById.get(normalizeId(pick(enrollment, 'courseId', 'course_id')))
    return normalizeStatus(pick(enrollment, 'status')) !== 'completed' && Boolean(pick(course, 'isMandatory', 'is_mandatory', 'mandatory'))
  })
  if (mandatoryOpen.length === 0) return []
  return [recommendation({
    id: 'tpl-mandatory-learning-nudge',
    name: 'Mandatory Learning Nudge',
    category: 'learning',
    trigger: 'learning_assignment_created',
    score: mandatoryOpen.length >= 10 ? 76 : 58,
    whyItMatters: 'Mandatory learning automation should remind learners and managers before compliance gaps become audit issues.',
    requiredApprovals: ['Learning admin'],
    safetyGates: ['Do not auto-complete learning', 'Do not notify managers until learner reminder window has passed', 'Respect assignment audience and due dates'],
    dryRunChecks: ['Learner reminders are previewed', 'Manager escalations are delayed', 'Completed enrollments are excluded'],
    steps: [
      { type: 'trigger', label: 'Learning assignment created', config: { event: 'learning_assignment_created' } },
      { type: 'delay', label: 'Wait before reminder', config: { duration: '3 days' } },
      { type: 'condition', label: 'Course incomplete', config: { field: 'status', operator: 'not_equals', value: 'completed' } },
      { type: 'notification', label: 'Notify learner', config: { audience: ['employee'] } },
      { type: 'notification', label: 'Escalate to manager', config: { audience: ['manager'], delay: '7 days' } },
    ],
    evidence: [`Incomplete mandatory enrollments: ${mandatoryOpen.length}.`],
  })]
}

function buildComplianceRecommendations(input: WorkflowTemplatePlannerInput): WorkflowTemplateRecommendation[] {
  const riskyRequirements = (input.complianceRequirements ?? []).filter(requirement => ['pending', 'at_risk', 'overdue', 'failed'].includes(normalizeStatus(pick(requirement, 'status'))))
  if (riskyRequirements.length === 0) return []
  return [recommendation({
    id: 'tpl-compliance-evidence-chase',
    name: 'Compliance Evidence Chase',
    category: 'compliance',
    trigger: 'compliance_requirement_due',
    score: riskyRequirements.some(requirement => ['overdue', 'failed'].includes(normalizeStatus(pick(requirement, 'status')))) ? 90 : 68,
    whyItMatters: 'Compliance automations should make evidence collection visible before requirements become regulatory or audit misses.',
    requiredApprovals: ['Compliance owner'],
    safetyGates: ['Never mark requirements complete without evidence', 'Escalate overdue requirements to compliance owner', 'Retain audit log for every reminder'],
    dryRunChecks: ['Evidence fields are present', 'Overdue requirements route to owner', 'Completed requirements are excluded'],
    steps: [
      { type: 'trigger', label: 'Compliance requirement due', config: { event: 'compliance_requirement_due' } },
      { type: 'condition', label: 'Evidence missing', config: { field: 'evidence_status', operator: 'not_equals', value: 'complete' } },
      { type: 'notification', label: 'Notify requirement owner', config: { audience: ['control_owner'] } },
      { type: 'approval', label: 'Compliance approval', config: { approverRole: 'compliance' } },
    ],
    evidence: [`Risky requirements: ${riskyRequirements.length}.`],
  })]
}

function buildSupportRecommendations(input: WorkflowTemplatePlannerInput): WorkflowTemplateRecommendation[] {
  const waitingTickets = (input.supportTickets ?? []).filter(ticket => ['open', 'in_progress', 'waiting_on_customer', 'needs_response'].includes(normalizeStatus(pick(ticket, 'status'))))
  if (waitingTickets.length === 0) return []
  return [recommendation({
    id: 'tpl-support-ticket-sla',
    name: 'Support Ticket SLA Guardrail',
    category: 'support',
    trigger: 'support_ticket_created',
    score: waitingTickets.length >= 10 ? 72 : 48,
    whyItMatters: 'Support automation should keep employee issues moving without losing ownership or context.',
    requiredApprovals: ['Support owner'],
    safetyGates: ['Do not close tickets automatically', 'Escalate only after SLA window', 'Preserve requester context in every notification'],
    dryRunChecks: ['Open tickets receive owner assignment', 'Waiting-on-customer tickets preview requester nudges', 'Resolved tickets are excluded'],
    steps: [
      { type: 'trigger', label: 'Support ticket created', config: { event: 'support_ticket_created' } },
      { type: 'condition', label: 'Ticket still open', config: { field: 'status', operator: 'in', value: ['open', 'in_progress', 'waiting_on_customer'] } },
      { type: 'delay', label: 'Wait for SLA window', config: { duration: '24 hours' } },
      { type: 'notification', label: 'Notify owner or requester', config: { audience: ['support_owner', 'requester'] } },
    ],
    evidence: [`Open support tickets: ${waitingTickets.length}.`],
  })]
}

function buildPerformanceRecommendations(input: WorkflowTemplatePlannerInput): WorkflowTemplateRecommendation[] {
  const pendingReviews = (input.performanceReviews ?? []).filter(review => ['pending', 'in_progress', 'draft'].includes(normalizeStatus(pick(review, 'status'))))
  const riskyGoals = (input.goals ?? []).filter(goal => numeric(pick(goal, 'progress', 'completion', 'completion_percent')) < 60 && ['active', 'at_risk', 'behind'].includes(normalizeStatus(pick(goal, 'status')) || 'active'))
  if (pendingReviews.length === 0 && riskyGoals.length === 0) return []
  return [recommendation({
    id: 'tpl-performance-manager-followup',
    name: 'Performance Manager Follow-up',
    category: 'performance',
    trigger: 'performance_review_due',
    score: pendingReviews.length >= 10 || riskyGoals.length >= 5 ? 74 : 56,
    whyItMatters: 'Performance automation should help managers complete reviews and follow up on at-risk goals before calibration suffers.',
    requiredApprovals: ['HRBP owner'],
    safetyGates: ['Do not auto-submit reviews', 'Do not change ratings', 'Escalate only missing actions and blockers'],
    dryRunChecks: ['Pending reviews are selected', 'At-risk goals include owners', 'No rating or review content is modified'],
    steps: [
      { type: 'trigger', label: 'Performance review due', config: { event: 'performance_review_due' } },
      { type: 'condition', label: 'Manager action incomplete', config: { field: 'status', operator: 'not_equals', value: 'completed' } },
      { type: 'notification', label: 'Notify manager', config: { audience: ['manager'] } },
      { type: 'approval', label: 'HRBP escalation approval', config: { approverRole: 'hrbp' } },
    ],
    evidence: [`Pending reviews: ${pendingReviews.length}.`, `Risky goals: ${riskyGoals.length}.`],
  })]
}

export function buildWorkflowTemplatePlan(input: WorkflowTemplatePlannerInput): WorkflowTemplatePlan {
  const maxRecommendations = input.maxRecommendations ?? 8
  const recommendations = filterNew(input, [
    ...buildLifecycleRecommendations(input),
    ...buildFinanceRecommendations(input),
    ...buildPayrollRecommendations(input),
    ...buildLearningRecommendations(input),
    ...buildComplianceRecommendations(input),
    ...buildSupportRecommendations(input),
    ...buildPerformanceRecommendations(input),
  ]).sort((a, b) => b.score - a.score || a.name.localeCompare(b.name)).slice(0, maxRecommendations)

  const counts = recommendations.reduce((acc, current) => {
    acc[current.priority] += 1
    return acc
  }, { critical: 0, high: 0, medium: 0, low: 0 })

  return {
    totalRecommendations: recommendations.length,
    criticalCount: counts.critical,
    highCount: counts.high,
    mediumCount: counts.medium,
    lowCount: counts.low,
    recommendations,
    reviewTable: recommendations.map(rec => ({
      template: rec.name,
      category: rec.category,
      trigger: rec.trigger,
      priority: rec.priority,
      howToTest: rec.dryRunChecks.join('; '),
      risk: rec.safetyGates.join('; '),
    })),
    evidence: [
      `${recommendations.length} workflow template recommendation${recommendations.length === 1 ? '' : 's'} returned.`,
      `${counts.critical} critical, ${counts.high} high, ${counts.medium} medium, ${counts.low} low.`,
    ],
  }
}

