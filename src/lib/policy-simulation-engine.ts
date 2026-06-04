type LooseRecord = Record<string, any>

export type PolicySimulationDomain = 'expense' | 'payroll' | 'travel' | 'workforce'
export type PolicySimulationSeverity = 'critical' | 'high' | 'medium' | 'low'

export interface PolicyChangeProposal {
  id: string
  domain: PolicySimulationDomain
  title: string
  change: Record<string, any>
}

export interface PolicySimulationImpact {
  id: string
  domain: PolicySimulationDomain
  title: string
  severity: PolicySimulationSeverity
  score: number
  projectedImpact: string
  requiredApprovals: string[]
  safetyChecks: string[]
  affectedEntityIds: string[]
  evidence: string[]
}

export interface PolicySimulationReport {
  totalImpacts: number
  criticalCount: number
  highCount: number
  mediumCount: number
  lowCount: number
  impacts: PolicySimulationImpact[]
  decisionSummary: string
  evidence: string[]
}

export interface PolicySimulationInput {
  proposals: PolicyChangeProposal[]
  employees?: LooseRecord[]
  expenseReports?: LooseRecord[]
  expensePolicies?: LooseRecord[]
  mileageLogs?: LooseRecord[]
  payrollRuns?: LooseRecord[]
  payrollEntries?: LooseRecord[]
  headcountPlans?: LooseRecord[]
  budgets?: LooseRecord[]
  maxImpacts?: number
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

function numeric(value: any): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function severity(score: number): PolicySimulationSeverity {
  if (score >= 85) return 'critical'
  if (score >= 70) return 'high'
  if (score >= 45) return 'medium'
  return 'low'
}

function impact(input: Omit<PolicySimulationImpact, 'severity'>): PolicySimulationImpact {
  return { ...input, severity: severity(input.score) }
}

function employeeCountry(employee: LooseRecord): string {
  return String(pick(employee, 'country') ?? pick(pick(employee, 'profile'), 'country') ?? '').trim()
}

function reportItems(report: LooseRecord): LooseRecord[] {
  const items = pick(report, 'items', 'expenseItems', 'expense_items')
  return Array.isArray(items) ? items : []
}

function simulateExpensePolicy(proposal: PolicyChangeProposal, input: PolicySimulationInput): PolicySimulationImpact | null {
  const category = normalizeText(pick(proposal.change, 'category'))
  const newLimit = numeric(pick(proposal.change, 'dailyLimit', 'daily_limit', 'limit'))
  const newReceiptThreshold = numeric(pick(proposal.change, 'receiptThreshold', 'receipt_threshold'))
  const matchingReports = (input.expenseReports ?? []).filter(report =>
    reportItems(report).some(item => !category || normalizeText(pick(item, 'category')) === category)
  )
  const reportsAboveLimit = newLimit > 0
    ? matchingReports.filter(report => reportItems(report).some(item => (!category || normalizeText(pick(item, 'category')) === category) && numeric(pick(item, 'amount')) > newLimit))
    : []
  const reportsNeedingReceipts = newReceiptThreshold > 0
    ? matchingReports.filter(report => reportItems(report).some(item => (!category || normalizeText(pick(item, 'category')) === category) && numeric(pick(item, 'amount')) > newReceiptThreshold))
    : []
  if (matchingReports.length === 0 && newLimit === 0 && newReceiptThreshold === 0) return null

  return impact({
    id: `policy-expense-${proposal.id}`,
    domain: 'expense',
    title: `Expense policy simulation: ${proposal.title}`,
    score: reportsAboveLimit.length > 0 ? 78 : reportsNeedingReceipts.length > 0 ? 58 : 34,
    projectedImpact: `${reportsAboveLimit.length} report${reportsAboveLimit.length === 1 ? '' : 's'} would breach the new limit and ${reportsNeedingReceipts.length} would require receipt evidence.`,
    requiredApprovals: ['Finance owner', 'Policy owner'],
    safetyChecks: ['Run against last 90 days of reports before publishing', 'Confirm receipt evidence path before enforcing threshold', 'Do not auto-reject existing submitted reports'],
    affectedEntityIds: [...new Set([...reportsAboveLimit, ...reportsNeedingReceipts].map(report => normalizeId(pick(report, 'id'))))],
    evidence: [`Matched reports: ${matchingReports.length}.`, `New limit: ${newLimit || 'unchanged'}.`, `New receipt threshold: ${newReceiptThreshold || 'unchanged'}.`],
  })
}

function simulateTravelPolicy(proposal: PolicyChangeProposal, input: PolicySimulationInput): PolicySimulationImpact | null {
  const newRate = numeric(pick(proposal.change, 'ratePerKm', 'rate_per_km', 'mileageRate', 'mileage_rate'))
  const logs = input.mileageLogs ?? []
  if (newRate <= 0 || logs.length === 0) return null
  const currentTotal = logs.reduce((sum, log) => sum + numeric(pick(log, 'amount')), 0)
  const simulatedTotal = logs.reduce((sum, log) => sum + numeric(pick(log, 'distanceKm', 'distance_km', 'distanceMiles', 'distance_miles')) * newRate, 0)
  const delta = Math.round((simulatedTotal - currentTotal) * 100) / 100

  return impact({
    id: `policy-travel-${proposal.id}`,
    domain: 'travel',
    title: `Travel policy simulation: ${proposal.title}`,
    score: Math.abs(delta) > 10000 ? 76 : Math.abs(delta) > 1000 ? 56 : 32,
    projectedImpact: `Mileage reimbursement would change by ${delta} across ${logs.length} mileage log${logs.length === 1 ? '' : 's'}.`,
    requiredApprovals: ['Finance owner', 'HR policy owner'],
    safetyChecks: ['Confirm distance unit before applying rate', 'Preview employee reimbursement deltas', 'Do not recalculate already reimbursed mileage without approval'],
    affectedEntityIds: logs.map(log => normalizeId(pick(log, 'id'))),
    evidence: [`Current total: ${currentTotal}.`, `Simulated total: ${Math.round(simulatedTotal * 100) / 100}.`, `New rate: ${newRate}.`],
  })
}

function simulatePayrollPolicy(proposal: PolicyChangeProposal, input: PolicySimulationInput): PolicySimulationImpact | null {
  const employerCostPct = numeric(pick(proposal.change, 'employerCostPct', 'employer_cost_pct', 'contributionPct', 'contribution_pct'))
  const payrollEntries = input.payrollEntries ?? []
  const activeEmployees = (input.employees ?? []).filter(employee => pick(employee, 'isActive', 'is_active') !== false)
  const baseRecords = payrollEntries.length > 0 ? payrollEntries : activeEmployees
  if (employerCostPct <= 0 || baseRecords.length === 0) return null
  const salaryTotal = baseRecords.reduce((sum, record) => sum + numeric(pick(record, 'grossPay', 'gross_pay', 'salary', 'annualSalary', 'annual_salary', 'baseSalary', 'base_salary')), 0)
  const projectedEmployerCost = Math.round(salaryTotal * (employerCostPct / 100))
  const countries = new Set(activeEmployees.map(employeeCountry).filter(Boolean))

  return impact({
    id: `policy-payroll-${proposal.id}`,
    domain: 'payroll',
    title: `Payroll policy simulation: ${proposal.title}`,
    score: projectedEmployerCost > 100000 ? 82 : projectedEmployerCost > 25000 ? 64 : 42,
    projectedImpact: `Employer payroll cost would increase by approximately ${projectedEmployerCost} at ${employerCostPct}% across ${baseRecords.length} record${baseRecords.length === 1 ? '' : 's'}.`,
    requiredApprovals: ['Payroll owner', 'Finance owner', countries.size > 1 ? 'Country compliance owner' : 'HR policy owner'],
    safetyChecks: ['Validate country statutory rules before activation', 'Preview employee-level pay impact', 'Do not apply to closed payroll runs'],
    affectedEntityIds: baseRecords.map(record => normalizeId(pick(record, 'id', 'employeeId', 'employee_id'))),
    evidence: [`Salary/gross total: ${salaryTotal}.`, `Countries represented: ${countries.size}.`, `Employer cost percent: ${employerCostPct}.`],
  })
}

function simulateWorkforcePolicy(proposal: PolicyChangeProposal, input: PolicySimulationInput): PolicySimulationImpact | null {
  const hiringFreeze = Boolean(pick(proposal.change, 'hiringFreeze', 'hiring_freeze'))
  const maxBudgetUtilization = numeric(pick(proposal.change, 'maxBudgetUtilization', 'max_budget_utilization'))
  const openPlans = (input.headcountPlans ?? []).filter(plan => ['pending', 'pending_approval', 'open', 'planned'].includes(normalizeStatus(pick(plan, 'status'))))
  const constrainedBudgets = maxBudgetUtilization > 0
    ? (input.budgets ?? []).filter(budget => {
      const total = numeric(pick(budget, 'totalAmount', 'total_amount'))
      return total > 0 && Math.round((numeric(pick(budget, 'spentAmount', 'spent_amount')) / total) * 100) >= maxBudgetUtilization
    })
    : []
  if (!hiringFreeze && maxBudgetUtilization <= 0) return null

  return impact({
    id: `policy-workforce-${proposal.id}`,
    domain: 'workforce',
    title: `Workforce policy simulation: ${proposal.title}`,
    score: openPlans.length >= 5 || constrainedBudgets.length > 0 ? 74 : 46,
    projectedImpact: `${openPlans.length} open headcount plan${openPlans.length === 1 ? '' : 's'} would need review and ${constrainedBudgets.length} budget${constrainedBudgets.length === 1 ? '' : 's'} would be constrained.`,
    requiredApprovals: ['People Ops owner', 'Finance owner', 'Executive sponsor'],
    safetyChecks: ['Do not cancel open roles automatically', 'Preview offer and start-date exceptions', 'Attach budget-owner signoff before enforcing'],
    affectedEntityIds: [...openPlans.map(plan => normalizeId(pick(plan, 'id'))), ...constrainedBudgets.map(budget => normalizeId(pick(budget, 'id')))],
    evidence: [`Hiring freeze: ${hiringFreeze}.`, `Open headcount plans: ${openPlans.length}.`, `Constrained budgets: ${constrainedBudgets.length}.`],
  })
}

export function simulatePolicyChanges(input: PolicySimulationInput): PolicySimulationReport {
  const maxImpacts = input.maxImpacts ?? 10
  const impacts = input.proposals
    .map(proposal => {
      if (proposal.domain === 'expense') return simulateExpensePolicy(proposal, input)
      if (proposal.domain === 'travel') return simulateTravelPolicy(proposal, input)
      if (proposal.domain === 'payroll') return simulatePayrollPolicy(proposal, input)
      if (proposal.domain === 'workforce') return simulateWorkforcePolicy(proposal, input)
      return null
    })
    .filter((impact): impact is PolicySimulationImpact => Boolean(impact))
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
    .slice(0, maxImpacts)

  const counts = impacts.reduce((acc, current) => {
    acc[current.severity] += 1
    return acc
  }, { critical: 0, high: 0, medium: 0, low: 0 })

  return {
    totalImpacts: impacts.length,
    criticalCount: counts.critical,
    highCount: counts.high,
    mediumCount: counts.medium,
    lowCount: counts.low,
    impacts,
    decisionSummary: impacts.length > 0
      ? `${impacts.length} policy simulation${impacts.length === 1 ? '' : 's'} need review; highest impact is ${impacts[0].title}.`
      : 'No material policy simulation impact found.',
    evidence: [
      `${input.proposals.length} proposal${input.proposals.length === 1 ? '' : 's'} evaluated.`,
      `${counts.critical} critical, ${counts.high} high, ${counts.medium} medium, ${counts.low} low.`,
    ],
  }
}
