type LooseRecord = Record<string, any>

export type BoardroomDomain = 'workforce' | 'finance' | 'performance' | 'learning' | 'expense' | 'compliance' | 'execution'
export type BoardroomSeverity = 'critical' | 'high' | 'medium' | 'low'

export interface BoardroomSignal {
  id: string
  domain: BoardroomDomain
  title: string
  narrative: string
  severity: BoardroomSeverity
  score: number
  decisionAsk: string
  drillThroughRoute: string
  operationalFollowUp: string
  evidence: string[]
}

export interface BoardroomSection {
  domain: BoardroomDomain
  headline: string
  signalCount: number
  topSignal: BoardroomSignal | null
  signals: BoardroomSignal[]
}

export interface ExecutiveBoardroomPack {
  generatedAt: string
  period: string
  totalSignals: number
  criticalCount: number
  highCount: number
  mediumCount: number
  lowCount: number
  executiveSummary: string
  decisionAsks: string[]
  sections: BoardroomSection[]
  topRisks: BoardroomSignal[]
  evidence: string[]
}

export interface ExecutiveBoardroomInput {
  now?: string | Date
  period?: string
  maxSignalsPerSection?: number
  employees?: LooseRecord[]
  headcountPlans?: LooseRecord[]
  budgets?: LooseRecord[]
  invoices?: LooseRecord[]
  expenseReports?: LooseRecord[]
  payrollRuns?: LooseRecord[]
  performanceReviews?: LooseRecord[]
  goals?: LooseRecord[]
  learningEnrollments?: LooseRecord[]
  courses?: LooseRecord[]
  complianceRequirements?: LooseRecord[]
  projects?: LooseRecord[]
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

function severity(score: number): BoardroomSeverity {
  if (score >= 85) return 'critical'
  if (score >= 70) return 'high'
  if (score >= 45) return 'medium'
  return 'low'
}

function signal(input: Omit<BoardroomSignal, 'severity'>): BoardroomSignal {
  return { ...input, severity: severity(input.score) }
}

function percent(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0
  return Math.round((numerator / denominator) * 100)
}

function buildWorkforceSignals(input: ExecutiveBoardroomInput): BoardroomSignal[] {
  const employees = input.employees ?? []
  const active = employees.filter(employee => pick(employee, 'isActive', 'is_active') !== false)
  const attritionRisk = active.filter(employee => {
    const risk = normalizeStatus(pick(employee, 'attritionRisk', 'attrition_risk', 'riskLevel', 'risk_level'))
    return ['high', 'critical'].includes(risk)
  })
  const openPlans = (input.headcountPlans ?? []).filter(plan => ['pending', 'pending_approval', 'open'].includes(normalizeStatus(pick(plan, 'status'))))
  const signals: BoardroomSignal[] = []

  if (attritionRisk.length > 0) {
    const rate = percent(attritionRisk.length, Math.max(active.length, 1))
    signals.push(signal({
      id: 'workforce-attrition-risk',
      domain: 'workforce',
      title: 'High attrition risk concentration',
      narrative: `${attritionRisk.length} active employee${attritionRisk.length === 1 ? '' : 's'} are marked high or critical attrition risk (${rate}% of active headcount).`,
      score: rate >= 10 ? 82 : 64,
      decisionAsk: 'Decide whether to fund retention, manager intervention, or succession coverage for at-risk roles.',
      drillThroughRoute: '/analytics?tab=workforce',
      operationalFollowUp: 'Open People and Performance to confirm risk drivers, manager actions, and replacement coverage.',
      evidence: [`Active headcount: ${active.length}.`, `At-risk employees: ${attritionRisk.length}.`],
    }))
  }

  if (openPlans.length > 0) {
    signals.push(signal({
      id: 'workforce-headcount-approvals',
      domain: 'workforce',
      title: 'Headcount plan decisions pending',
      narrative: `${openPlans.length} headcount plan${openPlans.length === 1 ? '' : 's'} need executive or finance decisioning.`,
      score: openPlans.length >= 3 ? 68 : 48,
      decisionAsk: 'Approve, defer, or re-scope open headcount plans based on budget and execution priority.',
      drillThroughRoute: '/headcount',
      operationalFollowUp: 'Review open positions, budget usage, and start-date dependency before approving.',
      evidence: [`Pending headcount plans: ${openPlans.length}.`],
    }))
  }

  return signals
}

function buildFinanceSignals(input: ExecutiveBoardroomInput, now: Date): BoardroomSignal[] {
  const signals: BoardroomSignal[] = []
  const budgets = (input.budgets ?? []).filter(budget => normalizeStatus(pick(budget, 'status')) === 'active')
  const overBudget = budgets.filter(budget => numeric(pick(budget, 'spentAmount', 'spent_amount')) > numeric(pick(budget, 'totalAmount', 'total_amount')))
  const nearBudget = budgets.filter(budget => {
    const total = numeric(pick(budget, 'totalAmount', 'total_amount'))
    return total > 0 && percent(numeric(pick(budget, 'spentAmount', 'spent_amount')), total) >= 85
  })
  const overdueInvoices = (input.invoices ?? []).filter(invoice => normalizeStatus(pick(invoice, 'status')) === 'overdue' || (daysUntil(pick(invoice, 'dueDate', 'due_date'), now) ?? 99) < 0 && normalizeStatus(pick(invoice, 'status')) !== 'paid')
  const payrollPending = (input.payrollRuns ?? []).filter(run => ['pending_hr', 'pending_finance', 'approved', 'processing'].includes(normalizeStatus(pick(run, 'status'))))

  if (overBudget.length > 0 || nearBudget.length > 0) {
    signals.push(signal({
      id: 'finance-budget-pressure',
      domain: 'finance',
      title: 'Budget pressure needs decision',
      narrative: `${overBudget.length} budget${overBudget.length === 1 ? '' : 's'} are over plan and ${nearBudget.length} are at or above 85% utilization.`,
      score: overBudget.length > 0 ? 86 : 66,
      decisionAsk: 'Decide whether to reallocate budget, freeze discretionary spend, or approve variance.',
      drillThroughRoute: '/budgets',
      operationalFollowUp: 'Open Budgets and review spend drivers, owners, and linked expense/procurement activity.',
      evidence: [`Over budget: ${overBudget.length}.`, `Near budget: ${nearBudget.length}.`],
    }))
  }

  if (overdueInvoices.length > 0) {
    const amount = overdueInvoices.reduce((sum, invoice) => sum + numeric(pick(invoice, 'amount')), 0)
    signals.push(signal({
      id: 'finance-overdue-invoices',
      domain: 'finance',
      title: 'Overdue invoice exposure',
      narrative: `${overdueInvoices.length} invoice${overdueInvoices.length === 1 ? '' : 's'} are overdue with ${amount} total exposure.`,
      score: amount > 50000 ? 76 : 58,
      decisionAsk: 'Decide whether overdue vendors require payment acceleration, dispute handling, or cash-plan changes.',
      drillThroughRoute: '/invoices',
      operationalFollowUp: 'Open Invoices and confirm approval state, payment plan, owner, and vendor risk.',
      evidence: [`Overdue invoice amount: ${amount}.`],
    }))
  }

  if (payrollPending.length > 0) {
    signals.push(signal({
      id: 'finance-payroll-trust',
      domain: 'finance',
      title: 'Payroll approval or processing risk',
      narrative: `${payrollPending.length} payroll run${payrollPending.length === 1 ? '' : 's'} still need approval or processing evidence.`,
      score: 80,
      decisionAsk: 'Confirm payroll control owners and escalation path before pay timing is at risk.',
      drillThroughRoute: '/payroll',
      operationalFollowUp: 'Open Payroll and review variance, statutory, bank-detail, and approval evidence.',
      evidence: [`Open payroll runs: ${payrollPending.length}.`],
    }))
  }

  return signals
}

function buildPerformanceSignals(input: ExecutiveBoardroomInput, now: Date): BoardroomSignal[] {
  const reviews = input.performanceReviews ?? []
  const incomplete = reviews.filter(review => ['pending', 'in_progress', 'draft'].includes(normalizeStatus(pick(review, 'status'))))
  const dueSoon = incomplete.filter(review => {
    const dueDays = daysUntil(pick(review, 'dueDate', 'due_date', 'reviewDate', 'review_date'), now)
    return dueDays !== null && dueDays <= 7
  })
  const goals = input.goals ?? []
  const atRiskGoals = goals.filter(goal => {
    const progress = numeric(pick(goal, 'progress', 'completion', 'completion_percent'))
    const dueDays = daysUntil(pick(goal, 'dueDate', 'due_date', 'targetDate', 'target_date'), now)
    return dueDays !== null && dueDays <= 30 && progress < 60
  })
  const signals: BoardroomSignal[] = []

  if (dueSoon.length > 0) {
    signals.push(signal({
      id: 'performance-review-completion',
      domain: 'performance',
      title: 'Review cycle completion at risk',
      narrative: `${dueSoon.length} review${dueSoon.length === 1 ? '' : 's'} are incomplete within 7 days of deadline.`,
      score: dueSoon.length >= 10 ? 78 : 62,
      decisionAsk: 'Decide whether to extend the cycle, escalate managers, or freeze downstream calibration.',
      drillThroughRoute: '/performance?tab=reviews',
      operationalFollowUp: 'Open Performance and push manager review completion, calibration readiness, and feedback quality checks.',
      evidence: [`Incomplete reviews: ${incomplete.length}.`, `Due within 7 days: ${dueSoon.length}.`],
    }))
  }

  if (atRiskGoals.length > 0) {
    signals.push(signal({
      id: 'performance-goal-risk',
      domain: 'performance',
      title: 'Strategic goals need intervention',
      narrative: `${atRiskGoals.length} goal${atRiskGoals.length === 1 ? '' : 's'} are below 60% progress within 30 days of deadline.`,
      score: atRiskGoals.length >= 5 ? 70 : 52,
      decisionAsk: 'Decide whether to re-scope goals, increase resourcing, or move blockers to executive review.',
      drillThroughRoute: '/performance?tab=goals',
      operationalFollowUp: 'Open Goals and confirm owners, blockers, and next executive operating review.',
      evidence: [`At-risk goals: ${atRiskGoals.length}.`],
    }))
  }

  return signals
}

function buildLearningSignals(input: ExecutiveBoardroomInput): BoardroomSignal[] {
  const coursesById = new Map((input.courses ?? []).map(course => [normalizeId(pick(course, 'id')), course]))
  const mandatoryOpen = (input.learningEnrollments ?? []).filter(enrollment => {
    const course = coursesById.get(normalizeId(pick(enrollment, 'courseId', 'course_id')))
    return normalizeStatus(pick(enrollment, 'status')) !== 'completed' && Boolean(pick(course, 'isMandatory', 'is_mandatory', 'mandatory'))
  })

  if (mandatoryOpen.length === 0) return []
  return [signal({
    id: 'learning-mandatory-gap',
    domain: 'learning',
    title: 'Mandatory learning completion gap',
    narrative: `${mandatoryOpen.length} mandatory learning enrollment${mandatoryOpen.length === 1 ? '' : 's'} remain incomplete.`,
    score: mandatoryOpen.length >= 25 ? 72 : 50,
    decisionAsk: 'Decide whether compliance learning needs executive escalation or manager nudges.',
    drillThroughRoute: '/learning',
    operationalFollowUp: 'Open Learning and review mandatory enrollment gaps by team, country, and role.',
    evidence: [`Incomplete mandatory enrollments: ${mandatoryOpen.length}.`],
  })]
}

function buildExpenseSignals(input: ExecutiveBoardroomInput): BoardroomSignal[] {
  const pending = (input.expenseReports ?? []).filter(report => ['submitted', 'pending_approval', 'approved'].includes(normalizeStatus(pick(report, 'status'))))
  const pendingAmount = pending.reduce((sum, report) => sum + numeric(pick(report, 'totalAmount', 'total_amount', 'amount')), 0)
  if (pending.length === 0) return []
  return [signal({
    id: 'expense-pending-exposure',
    domain: 'expense',
    title: 'Expense approval and reimbursement exposure',
    narrative: `${pending.length} expense report${pending.length === 1 ? '' : 's'} are pending approval or reimbursement with ${pendingAmount} total exposure.`,
    score: pendingAmount > 50000 ? 76 : pendingAmount > 10000 ? 64 : 42,
    decisionAsk: 'Decide whether finance should accelerate reimbursement, tighten policy checks, or review budget exposure.',
    drillThroughRoute: '/expense',
    operationalFollowUp: 'Open Expense and inspect policy confidence, receipt evidence, budget impact, and reimbursement batches.',
    evidence: [`Pending reports: ${pending.length}.`, `Pending amount: ${pendingAmount}.`],
  })]
}

function buildComplianceSignals(input: ExecutiveBoardroomInput, now: Date): BoardroomSignal[] {
  const risky = (input.complianceRequirements ?? []).filter(requirement => {
    const status = normalizeStatus(pick(requirement, 'status'))
    const dueDays = daysUntil(pick(requirement, 'dueDate', 'due_date', 'deadline'), now)
    return ['overdue', 'failed', 'at_risk'].includes(status) || (dueDays !== null && dueDays <= 14 && status !== 'completed')
  })

  if (risky.length === 0) return []
  return [signal({
    id: 'compliance-risk',
    domain: 'compliance',
    title: 'Compliance evidence needs executive attention',
    narrative: `${risky.length} compliance requirement${risky.length === 1 ? '' : 's'} are overdue, failed, at risk, or due within 14 days.`,
    score: risky.some(requirement => ['overdue', 'failed'].includes(normalizeStatus(pick(requirement, 'status')))) ? 88 : 66,
    decisionAsk: 'Decide whether remediation needs executive owner, deadline extension, or external counsel support.',
    drillThroughRoute: '/compliance',
    operationalFollowUp: 'Open Compliance and attach owner, evidence, deadline, and remediation status.',
    evidence: [`Risky requirements: ${risky.length}.`],
  })]
}

function buildExecutionSignals(input: ExecutiveBoardroomInput, now: Date): BoardroomSignal[] {
  const delayed = (input.projects ?? []).filter(project => {
    const status = normalizeStatus(pick(project, 'status'))
    const progress = numeric(pick(project, 'progress', 'completion', 'completion_percent'))
    const dueDays = daysUntil(pick(project, 'dueDate', 'due_date', 'targetDate', 'target_date'), now)
    return ['blocked', 'at_risk', 'delayed'].includes(status) || (dueDays !== null && dueDays <= 30 && progress < 60)
  })

  if (delayed.length === 0) return []
  return [signal({
    id: 'execution-project-risk',
    domain: 'execution',
    title: 'Execution portfolio has delayed work',
    narrative: `${delayed.length} project${delayed.length === 1 ? '' : 's'} are blocked, delayed, at risk, or under 60% progress near deadline.`,
    score: delayed.length >= 5 ? 72 : 56,
    decisionAsk: 'Decide whether to unblock, re-prioritize, or defer execution commitments.',
    drillThroughRoute: '/projects',
    operationalFollowUp: 'Open Projects and review blockers, owners, capacity, and automation follow-ups.',
    evidence: [`At-risk projects: ${delayed.length}.`],
  })]
}

function sectionHeadline(domain: BoardroomDomain, topSignal: BoardroomSignal | null): string {
  if (!topSignal) return `${domain[0].toUpperCase()}${domain.slice(1)} has no material signal`
  return topSignal.title
}

export function buildExecutiveBoardroomPack(input: ExecutiveBoardroomInput): ExecutiveBoardroomPack {
  const now = input.now instanceof Date ? input.now : new Date(input.now ?? Date.now())
  const period = input.period ?? now.toISOString().slice(0, 10)
  const maxSignalsPerSection = input.maxSignalsPerSection ?? 3
  const signals = [
    ...buildWorkforceSignals(input),
    ...buildFinanceSignals(input, now),
    ...buildPerformanceSignals(input, now),
    ...buildLearningSignals(input),
    ...buildExpenseSignals(input),
    ...buildComplianceSignals(input, now),
    ...buildExecutionSignals(input, now),
  ].sort((a, b) => b.score - a.score || a.domain.localeCompare(b.domain))

  const domains: BoardroomDomain[] = ['workforce', 'finance', 'performance', 'learning', 'expense', 'compliance', 'execution']
  const sections = domains
    .map(domain => {
      const domainSignals = signals.filter(signal => signal.domain === domain).slice(0, maxSignalsPerSection)
      return {
        domain,
        headline: sectionHeadline(domain, domainSignals[0] ?? null),
        signalCount: domainSignals.length,
        topSignal: domainSignals[0] ?? null,
        signals: domainSignals,
      } satisfies BoardroomSection
    })
    .filter(section => section.signalCount > 0)

  const counts = signals.reduce((acc, current) => {
    acc[current.severity] += 1
    return acc
  }, { critical: 0, high: 0, medium: 0, low: 0 })
  const topRisks = signals.slice(0, 5)
  const decisionAsks = [...new Set(topRisks.map(signal => signal.decisionAsk))].slice(0, 5)

  return {
    generatedAt: now.toISOString(),
    period,
    totalSignals: signals.length,
    criticalCount: counts.critical,
    highCount: counts.high,
    mediumCount: counts.medium,
    lowCount: counts.low,
    executiveSummary: signals.length > 0
      ? `${signals.length} board-room signal${signals.length === 1 ? '' : 's'} need review across ${sections.length} domain${sections.length === 1 ? '' : 's'}; top risk is ${topRisks[0]?.title}.`
      : 'No material board-room signals were found for this period.',
    decisionAsks,
    sections,
    topRisks,
    evidence: [
      `${signals.length} total signal${signals.length === 1 ? '' : 's'} evaluated.`,
      `${counts.critical} critical, ${counts.high} high, ${counts.medium} medium, ${counts.low} low.`,
    ],
  }
}

