type LooseRecord = Record<string, any>

export type ExpenseRouteStage =
  | 'employee_follow_up'
  | 'manager_approval'
  | 'policy_review'
  | 'finance_approval'
  | 'finance_risk_review'
  | 'budget_owner_review'
  | 'reimbursement_queue'
  | 'finance_posting_review'
  | 'complete'

export type ExpenseRouteSeverity = 'blocker' | 'warning' | 'info'

export interface ExpenseRouteSignal {
  id: string
  stage: ExpenseRouteStage
  severity: ExpenseRouteSeverity
  label: string
  detail: string
  evidence: string[]
}

export interface ExpenseApprovalRoutePlan {
  reportId: string
  title: string
  employeeId: string
  amount: number
  currency: string
  status: string
  recommendedStage: ExpenseRouteStage
  routeLabel: string
  confidenceScore: number
  riskScore: number
  policySignals: ExpenseRouteSignal[]
  budgetSignals: ExpenseRouteSignal[]
  reimbursementSignals: ExpenseRouteSignal[]
  postingSignals: ExpenseRouteSignal[]
  blockers: ExpenseRouteSignal[]
  warnings: ExpenseRouteSignal[]
  evidence: string[]
  safeNextActions: string[]
}

export interface ExpenseApprovalQueue {
  totalReports: number
  readyCount: number
  blockedCount: number
  reviewCount: number
  plans: ExpenseApprovalRoutePlan[]
  evidence: string[]
}

export interface ExpenseApprovalRouteInput {
  report: LooseRecord
  allReports?: LooseRecord[]
  employees?: LooseRecord[]
  expensePolicies?: LooseRecord[]
  budgets?: LooseRecord[]
  receiptMatches?: LooseRecord[]
  reimbursementBatches?: LooseRecord[]
  duplicateDetections?: LooseRecord[]
  highValueThreshold?: number
  budgetWarningThreshold?: number
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

function normalizeText(value: any): string {
  return String(value ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

function money(value: any): number {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : 0
}

function getReportItems(report: LooseRecord): LooseRecord[] {
  const items = pick(report, 'items', 'expenseItems', 'expense_items')
  return Array.isArray(items) ? items : []
}

function itemCategory(item: LooseRecord): string {
  return normalizeText(pick(item, 'category', 'expenseCategory', 'expense_category'))
}

function reportAmount(report: LooseRecord): number {
  const explicit = pick(report, 'totalAmount', 'total_amount', 'amount')
  if (explicit !== undefined) return money(explicit)
  return getReportItems(report).reduce((sum, item) => sum + money(pick(item, 'amount', 'total')), 0)
}

function getPolicyForItem(item: LooseRecord, policies: LooseRecord[]): LooseRecord | undefined {
  const category = itemCategory(item)
  return policies.find(policy =>
    normalizeStatus(pick(policy, 'status')) === 'active' &&
    normalizeText(pick(policy, 'category', 'name')) === category
  )
}

function hasAnyReceiptEvidence(report: LooseRecord, receiptMatches: LooseRecord[]): boolean {
  const receiptCount = money(pick(report, 'receiptCount', 'receipt_count'))
  if (receiptCount > 0) return true
  const itemIds = new Set(getReportItems(report).map(item => normalizeId(pick(item, 'id'))))
  return receiptMatches.some(match => itemIds.has(normalizeId(pick(match, 'expenseItemId', 'expense_item_id'))))
}

function receiptSignals(report: LooseRecord, receiptMatches: LooseRecord[]): ExpenseRouteSignal[] {
  const items = getReportItems(report)
  const itemIds = new Set(items.map(item => normalizeId(pick(item, 'id'))))
  const matches = receiptMatches.filter(match => itemIds.has(normalizeId(pick(match, 'expenseItemId', 'expense_item_id'))))
  const mismatchMatches = matches.filter(match => ['mismatch_amount', 'mismatch_vendor', 'mismatch_date', 'no_receipt'].includes(normalizeStatus(pick(match, 'matchStatus', 'match_status'))))

  const signals: ExpenseRouteSignal[] = mismatchMatches.map(match => ({
    id: `receipt-${normalizeId(pick(match, 'id'))}`,
    stage: 'finance_risk_review' as const,
    severity: 'blocker' as const,
    label: 'Receipt mismatch',
    detail: String(pick(match, 'discrepancyNotes', 'discrepancy_notes') ?? 'Receipt evidence does not match the submitted expense.'),
    evidence: [`Match status: ${normalizeStatus(pick(match, 'matchStatus', 'match_status'))}.`],
  }))

  if (items.length > 0 && !hasAnyReceiptEvidence(report, receiptMatches)) {
    signals.push({
      id: 'receipt-missing',
      stage: 'employee_follow_up',
      severity: 'blocker',
      label: 'Missing receipt evidence',
      detail: 'No receipt count or receipt match evidence is attached to this report.',
      evidence: [`${items.length} line item${items.length === 1 ? '' : 's'} need evidence before reimbursement.`],
    })
  }

  return signals
}

function policySignals(report: LooseRecord, policies: LooseRecord[], receiptMatches: LooseRecord[]): ExpenseRouteSignal[] {
  const signals: ExpenseRouteSignal[] = []

  for (const item of getReportItems(report)) {
    const policy = getPolicyForItem(item, policies)
    const amount = money(pick(item, 'amount', 'total'))
    const label = String(pick(item, 'description', 'category') ?? 'Expense item')

    if (!policy) {
      signals.push({
        id: `policy-missing-${normalizeId(pick(item, 'id', 'category'))}`,
        stage: 'policy_review',
        severity: 'warning',
        label: 'No active policy match',
        detail: `${label} does not map to an active expense policy.`,
        evidence: [`Category: ${pick(item, 'category') ?? 'Uncategorized'}.`],
      })
      continue
    }

    const dailyLimit = money(pick(policy, 'dailyLimit', 'daily_limit'))
    const receiptThreshold = money(pick(policy, 'receiptThreshold', 'receipt_threshold'))
    const autoApproveLimit = money(pick(policy, 'autoApproveLimit', 'auto_approve_limit'))

    if (dailyLimit > 0 && amount > dailyLimit) {
      signals.push({
        id: `policy-limit-${normalizeId(pick(item, 'id'))}`,
        stage: 'policy_review',
        severity: 'blocker',
        label: 'Policy limit exceeded',
        detail: `${label} is ${amount}, above the ${policy.category ?? 'category'} limit of ${dailyLimit}.`,
        evidence: [`Policy: ${pick(policy, 'id', 'name') ?? 'active policy'}.`],
      })
    }

    if (receiptThreshold > 0 && amount > receiptThreshold && !hasAnyReceiptEvidence(report, receiptMatches)) {
      signals.push({
        id: `policy-receipt-${normalizeId(pick(item, 'id'))}`,
        stage: 'employee_follow_up',
        severity: 'blocker',
        label: 'Receipt required by policy',
        detail: `${label} is above the receipt threshold of ${receiptThreshold}.`,
        evidence: [`Policy: ${pick(policy, 'id', 'name') ?? 'active policy'}.`],
      })
    }

    if (autoApproveLimit > 0 && amount > autoApproveLimit) {
      signals.push({
        id: `policy-auto-approve-${normalizeId(pick(item, 'id'))}`,
        stage: 'manager_approval',
        severity: 'info',
        label: 'Manual approval required',
        detail: `${label} is above the auto-approve limit of ${autoApproveLimit}.`,
        evidence: [`Amount: ${amount}.`],
      })
    }
  }

  return signals
}

function findEmployee(report: LooseRecord, employees: LooseRecord[]): LooseRecord | undefined {
  const employeeId = normalizeId(pick(report, 'employeeId', 'employee_id'))
  return employees.find(employee => normalizeId(pick(employee, 'id', 'employeeId', 'employee_id')) === employeeId)
}

function budgetSignals(report: LooseRecord, employees: LooseRecord[], budgets: LooseRecord[], threshold: number): ExpenseRouteSignal[] {
  const activeBudgets = budgets.filter(budget => normalizeStatus(pick(budget, 'status')) === 'active')
  if (activeBudgets.length === 0) {
    return [{
      id: 'budget-missing',
      stage: 'budget_owner_review',
      severity: 'warning',
      label: 'No active budget evidence',
      detail: 'No active budget was available to test this expense against.',
      evidence: ['Budget guardrail could not be evaluated.'],
    }]
  }

  const employee = findEmployee(report, employees)
  const firstCategory = normalizeText(pick(getReportItems(report)[0], 'category'))
  const employeeId = normalizeId(pick(report, 'employeeId', 'employee_id'))
  const matchingBudget = activeBudgets.find(budget =>
    normalizeId(pick(budget, 'departmentId', 'department_id')) === normalizeId(pick(employee, 'departmentId', 'department_id')) ||
    normalizeId(pick(budget, 'ownerId', 'owner_id')) === employeeId ||
    normalizeText(pick(budget, 'name')).includes(firstCategory)
  ) ?? activeBudgets[0]

  const total = money(pick(matchingBudget, 'totalAmount', 'total_amount'))
  const spent = money(pick(matchingBudget, 'spentAmount', 'spent_amount'))
  if (total <= 0) return []

  const projected = Math.round(((spent + reportAmount(report)) / total) * 100)
  if (projected <= threshold) return []

  return [{
    id: `budget-${normalizeId(pick(matchingBudget, 'id'))}`,
    stage: 'budget_owner_review',
    severity: projected > 100 ? 'blocker' : 'warning',
    label: projected > 100 ? 'Budget would be exceeded' : 'Budget guardrail reached',
    detail: `${pick(matchingBudget, 'name') ?? 'Active budget'} would reach ${projected}% after this report.`,
    evidence: [`Current spend ${spent}; report amount ${reportAmount(report)}; budget total ${total}.`],
  }]
}

function reimbursementSignals(report: LooseRecord, reimbursementBatches: LooseRecord[]): ExpenseRouteSignal[] {
  const reportId = normalizeId(pick(report, 'id'))
  const status = normalizeStatus(pick(report, 'status'))
  const batch = reimbursementBatches.find(candidate =>
    Array.isArray(candidate.items) &&
    candidate.items.some((item: LooseRecord) => normalizeId(pick(item, 'expenseReportId', 'expense_report_id')) === reportId)
  )

  if (status === 'approved' && !batch) {
    return [{
      id: 'reimbursement-awaiting-batch',
      stage: 'reimbursement_queue',
      severity: 'warning',
      label: 'Awaiting reimbursement batch',
      detail: 'Report is approved but has not been queued for reimbursement.',
      evidence: ['Finance needs to place the report into a reimbursement batch.'],
    }]
  }

  if (batch && normalizeStatus(pick(batch, 'status')) !== 'completed') {
    return [{
      id: `reimbursement-${normalizeId(pick(batch, 'id'))}`,
      stage: 'reimbursement_queue',
      severity: 'info',
      label: 'Reimbursement in progress',
      detail: `Report is in a ${normalizeStatus(pick(batch, 'status')) || 'pending'} reimbursement batch.`,
      evidence: [`Batch: ${pick(batch, 'id')}.`],
    }]
  }

  return []
}

function postingSignals(report: LooseRecord, reimbursementBatches: LooseRecord[]): ExpenseRouteSignal[] {
  const reportId = normalizeId(pick(report, 'id'))
  const status = normalizeStatus(pick(report, 'status'))
  const batch = reimbursementBatches.find(candidate =>
    Array.isArray(candidate.items) &&
    candidate.items.some((item: LooseRecord) => normalizeId(pick(item, 'expenseReportId', 'expense_report_id')) === reportId)
  )
  const batchComplete = batch && normalizeStatus(pick(batch, 'status')) === 'completed'
  const postedAt = pick(report, 'postedAt', 'posted_at', 'glPostedAt', 'gl_posted_at')
  const journalId = pick(report, 'journalEntryId', 'journal_entry_id', 'glEntryId', 'gl_entry_id')

  if ((status === 'reimbursed' || batchComplete) && !postedAt && !journalId) {
    return [{
      id: 'posting-missing',
      stage: 'finance_posting_review',
      severity: 'warning',
      label: 'GL posting evidence missing',
      detail: 'Expense appears reimbursed or paid, but no journal/posting evidence is attached.',
      evidence: batch ? [`Completed batch: ${pick(batch, 'id')}.`] : [`Report status: ${status}.`],
    }]
  }

  return []
}

function duplicateSignals(report: LooseRecord, duplicateDetections: LooseRecord[]): ExpenseRouteSignal[] {
  const reportId = normalizeId(pick(report, 'id'))
  return duplicateDetections
    .filter(detection =>
      normalizeId(pick(detection, 'expenseReportId', 'expense_report_id', 'originalExpenseReportId', 'original_expense_report_id')) === reportId &&
      ['flagged', 'confirmed_duplicate'].includes(normalizeStatus(pick(detection, 'status')))
    )
    .map(detection => ({
      id: `duplicate-${normalizeId(pick(detection, 'id'))}`,
      stage: 'finance_risk_review' as const,
      severity: normalizeStatus(pick(detection, 'status')) === 'confirmed_duplicate' ? 'blocker' as const : 'warning' as const,
      label: 'Duplicate risk',
      detail: 'Duplicate detection has flagged this report for review.',
      evidence: [`Status: ${normalizeStatus(pick(detection, 'status'))}.`],
    }))
}

function riskScore(signals: ExpenseRouteSignal[], amount: number, highValueThreshold: number): number {
  const signalScore = signals.reduce((score, signal) => {
    if (signal.severity === 'blocker') return score + 25
    if (signal.severity === 'warning') return score + 12
    return score + 4
  }, 0)
  const valueScore = amount > highValueThreshold ? 18 : amount > highValueThreshold / 2 ? 8 : 0
  return Math.min(100, signalScore + valueScore)
}

function chooseStage(status: string, signals: ExpenseRouteSignal[], risk: number, amount: number, highValueThreshold: number): ExpenseRouteStage {
  const blockers = signals.filter(signal => signal.severity === 'blocker')
  if (blockers.length > 0) return blockers.sort((a, b) => stageRank(a.stage) - stageRank(b.stage))[0].stage
  if (risk >= 70) return 'finance_risk_review'
  const budgetSignal = signals.find(signal => signal.stage === 'budget_owner_review')
  if (budgetSignal) return 'budget_owner_review'
  const policySignal = signals.find(signal => signal.stage === 'policy_review')
  if (policySignal) return 'policy_review'
  const reimbursementSignal = signals.find(signal => signal.stage === 'reimbursement_queue')
  if (reimbursementSignal) return 'reimbursement_queue'
  const postingSignal = signals.find(signal => signal.stage === 'finance_posting_review')
  if (postingSignal) return 'finance_posting_review'
  if (['reimbursed', 'paid', 'posted'].includes(status)) return 'complete'
  if (amount > highValueThreshold) return 'finance_approval'
  return 'manager_approval'
}

function stageRank(stage: ExpenseRouteStage): number {
  return {
    employee_follow_up: 1,
    finance_risk_review: 2,
    policy_review: 3,
    budget_owner_review: 4,
    manager_approval: 5,
    finance_approval: 6,
    reimbursement_queue: 7,
    finance_posting_review: 8,
    complete: 9,
  }[stage]
}

function routeLabel(stage: ExpenseRouteStage): string {
  return {
    employee_follow_up: 'Employee follow-up',
    manager_approval: 'Manager approval',
    policy_review: 'Policy review',
    finance_approval: 'Finance approval',
    finance_risk_review: 'Finance risk review',
    budget_owner_review: 'Budget owner review',
    reimbursement_queue: 'Reimbursement queue',
    finance_posting_review: 'Finance posting review',
    complete: 'Complete',
  }[stage]
}

function nextActions(stage: ExpenseRouteStage, blockers: ExpenseRouteSignal[], warnings: ExpenseRouteSignal[]): string[] {
  const primary = blockers[0] ?? warnings[0]
  return [
    primary ? `Resolve: ${primary.label}.` : 'Confirm evidence and keep normal approval moving.',
    stage === 'reimbursement_queue' ? 'Add the report to the next reimbursement batch or confirm existing batch status.' : `Route to ${routeLabel(stage).toLowerCase()}.`,
    stage === 'finance_posting_review' ? 'Attach journal entry or GL posting evidence before closing the finance loop.' : 'Preserve audit evidence before changing report status.',
  ]
}

export function buildExpenseApprovalRoutePlan(input: ExpenseApprovalRouteInput): ExpenseApprovalRoutePlan {
  const highValueThreshold = input.highValueThreshold ?? 1000
  const budgetWarningThreshold = input.budgetWarningThreshold ?? 85
  const report = input.report
  const amount = reportAmount(report)
  const status = normalizeStatus(pick(report, 'status'))

  const policy = policySignals(report, input.expensePolicies ?? [], input.receiptMatches ?? [])
  const receipts = receiptSignals(report, input.receiptMatches ?? [])
  const budgets = budgetSignals(report, input.employees ?? [], input.budgets ?? [], budgetWarningThreshold)
  const reimbursements = reimbursementSignals(report, input.reimbursementBatches ?? [])
  const postings = postingSignals(report, input.reimbursementBatches ?? [])
  const duplicates = duplicateSignals(report, input.duplicateDetections ?? [])
  const highValueSignal: ExpenseRouteSignal[] = amount > highValueThreshold ? [{
    id: 'high-value',
    stage: 'finance_approval',
    severity: 'warning',
    label: 'High-value approval',
    detail: `Report amount ${amount} is above the high-value threshold of ${highValueThreshold}.`,
    evidence: ['Finance should verify approval authority before reimbursement.'],
  }] : []

  const allSignals = [...receipts, ...policy, ...budgets, ...reimbursements, ...postings, ...duplicates, ...highValueSignal]
  const risk = riskScore(allSignals, amount, highValueThreshold)
  const recommendedStage = chooseStage(status, allSignals, risk, amount, highValueThreshold)
  const blockers = allSignals.filter(signal => signal.severity === 'blocker')
  const warnings = allSignals.filter(signal => signal.severity === 'warning')

  return {
    reportId: normalizeId(pick(report, 'id')),
    title: String(pick(report, 'title', 'name', 'description') ?? 'Expense report'),
    employeeId: normalizeId(pick(report, 'employeeId', 'employee_id')),
    amount,
    currency: String(pick(report, 'currency') ?? 'USD'),
    status,
    recommendedStage,
    routeLabel: routeLabel(recommendedStage),
    confidenceScore: Math.max(0, 100 - risk),
    riskScore: risk,
    policySignals: policy,
    budgetSignals: budgets,
    reimbursementSignals: reimbursements,
    postingSignals: postings,
    blockers,
    warnings,
    evidence: [
      `${allSignals.length} routing signal${allSignals.length === 1 ? '' : 's'} evaluated.`,
      `${blockers.length} blocker${blockers.length === 1 ? '' : 's'} and ${warnings.length} warning${warnings.length === 1 ? '' : 's'} found.`,
    ],
    safeNextActions: nextActions(recommendedStage, blockers, warnings),
  }
}

export function buildExpenseApprovalQueue(input: Omit<ExpenseApprovalRouteInput, 'report'> & { reports: LooseRecord[] }): ExpenseApprovalQueue {
  const plans = input.reports
    .map(report => buildExpenseApprovalRoutePlan({ ...input, report }))
    .sort((a, b) => b.riskScore - a.riskScore || b.amount - a.amount)
  const blockedCount = plans.filter(plan => plan.blockers.length > 0).length
  const reviewCount = plans.filter(plan => plan.blockers.length === 0 && plan.warnings.length > 0).length
  const readyCount = plans.length - blockedCount - reviewCount

  return {
    totalReports: plans.length,
    readyCount,
    blockedCount,
    reviewCount,
    plans,
    evidence: [
      `${blockedCount} blocked, ${reviewCount} need review, ${readyCount} ready for the next normal step.`,
    ],
  }
}
