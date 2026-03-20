/**
 * Expense → Payroll Integration
 *
 * When expense reports are approved:
 * - Calculate total reimbursement amount
 * - Group by employee for the next payroll run
 * - Create payroll adjustment entries
 * - Mark expenses as "queued for payroll"
 *
 * All amounts are in CENTS (e.g. 500000 = $5,000).
 * All integrations are event-driven via the cross-module event bus.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Expense report as stored in the store */
export interface ExpenseReport {
  id: string
  org_id: string
  employee_id: string
  title: string
  total_amount: number // cents
  currency: string
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'reimbursed' | 'queued_for_payroll'
  approved_by?: string
  approved_at?: string
  items?: Array<Record<string, unknown>>
  created_at: string
}

/** Payroll reimbursement entry to be created */
export interface PayrollReimbursementEntry {
  employee_id: string
  type: 'expense_reimbursement'
  amount: number // cents
  currency: string
  description: string
  expense_report_ids: string[]
  period: string
  status: 'pending'
  metadata: Record<string, unknown>
}

/** Result of processing approved expenses for payroll */
export interface ExpensePayrollResult {
  /** Grouped reimbursement entries by employee */
  reimbursementEntries: PayrollReimbursementEntry[]
  /** Total reimbursement amount across all employees in cents */
  totalReimbursementCents: number
  /** Number of expense reports processed */
  reportsProcessed: number
  /** Number of employees affected */
  employeeCount: number
  /** Reports that were skipped (already processed, etc.) */
  skipped: Array<{ reportId: string; reason: string }>
}

/** Store slice needed for expense→payroll operations */
export interface ExpensePayrollStoreSlice {
  expenseReports: ExpenseReport[]
  employees: Array<{ id: string; profile?: { full_name: string } }>
  addEmployeePayrollEntry?: (data: Record<string, unknown>) => void
  updateExpenseReport?: (id: string, data: Record<string, unknown>) => void
  addToast?: (toast: { type: string; title: string; description?: string }) => void
}

// ---------------------------------------------------------------------------
// Core Functions
// ---------------------------------------------------------------------------

/**
 * Process a single approved expense report for payroll reimbursement.
 *
 * @param reportId   - The ID of the approved expense report
 * @param store      - Store slice with expense and employee data
 * @returns Reimbursement entry or null if the report is ineligible
 */
export function processApprovedExpenseForPayroll(
  reportId: string,
  store: ExpensePayrollStoreSlice,
): PayrollReimbursementEntry | null {
  const report = store.expenseReports.find(r => r.id === reportId)
  if (!report) return null

  // Only process approved reports
  if (report.status !== 'approved') return null

  // Skip if already queued
  if ((report as unknown as Record<string, unknown>).payroll_queued) return null

  const employee = store.employees.find(e => e.id === report.employee_id)
  const employeeName = employee?.profile?.full_name || report.employee_id

  const period = new Date().toISOString().slice(0, 7) // YYYY-MM

  return {
    employee_id: report.employee_id,
    type: 'expense_reimbursement',
    amount: report.total_amount,
    currency: report.currency,
    description: `Expense reimbursement: ${report.title} (${employeeName})`,
    expense_report_ids: [report.id],
    period,
    status: 'pending',
    metadata: {
      source: 'expense-payroll-integration',
      auto_generated: true,
      expense_report_id: report.id,
      approved_by: report.approved_by,
      approved_at: report.approved_at,
      generated_at: new Date().toISOString(),
    },
  }
}

/**
 * Batch process all approved expense reports that haven't been queued for payroll yet.
 * Groups reimbursements by employee to create consolidated payroll entries.
 *
 * @param store - Store slice with expense, employee, and payroll data
 * @returns Processing result with grouped reimbursement entries
 */
export function batchProcessExpensesForPayroll(
  store: ExpensePayrollStoreSlice,
): ExpensePayrollResult {
  const approvedReports = store.expenseReports.filter(
    r => r.status === 'approved' && !(r as unknown as Record<string, unknown>).payroll_queued,
  )

  const skipped: ExpensePayrollResult['skipped'] = []

  // Group by employee
  const byEmployee = new Map<string, ExpenseReport[]>()
  for (const report of approvedReports) {
    if (report.total_amount <= 0) {
      skipped.push({ reportId: report.id, reason: 'Zero or negative amount' })
      continue
    }

    const existing = byEmployee.get(report.employee_id) || []
    existing.push(report)
    byEmployee.set(report.employee_id, existing)
  }

  const period = new Date().toISOString().slice(0, 7)
  const reimbursementEntries: PayrollReimbursementEntry[] = []
  let totalReimbursementCents = 0
  let reportsProcessed = 0

  for (const [employeeId, reports] of byEmployee) {
    const employee = store.employees.find(e => e.id === employeeId)
    const employeeName = employee?.profile?.full_name || employeeId
    const totalAmount = reports.reduce((sum, r) => sum + r.total_amount, 0)
    const currency = reports[0].currency || 'USD'

    reimbursementEntries.push({
      employee_id: employeeId,
      type: 'expense_reimbursement',
      amount: totalAmount,
      currency,
      description: `Expense reimbursement for ${employeeName}: ${reports.length} report(s) totaling ${(totalAmount / 100).toFixed(2)} ${currency}`,
      expense_report_ids: reports.map(r => r.id),
      period,
      status: 'pending',
      metadata: {
        source: 'expense-payroll-integration',
        auto_generated: true,
        report_count: reports.length,
        individual_amounts: reports.map(r => ({ id: r.id, title: r.title, amount: r.total_amount })),
        generated_at: new Date().toISOString(),
      },
    })

    totalReimbursementCents += totalAmount
    reportsProcessed += reports.length
  }

  return {
    reimbursementEntries,
    totalReimbursementCents,
    reportsProcessed,
    employeeCount: byEmployee.size,
    skipped,
  }
}

/**
 * Apply expense reimbursement entries to the payroll system via the store.
 *
 * @param result - Output from batchProcessExpensesForPayroll
 * @param store  - Store actions for persisting
 * @returns Number of payroll entries created
 */
export function applyExpenseReimbursements(
  result: ExpensePayrollResult,
  store: ExpensePayrollStoreSlice,
): number {
  let created = 0

  for (const entry of result.reimbursementEntries) {
    // Create the payroll entry
    if (store.addEmployeePayrollEntry) {
      store.addEmployeePayrollEntry(entry as unknown as Record<string, unknown>)
      created++
    }

    // Mark the expense reports as queued for payroll
    if (store.updateExpenseReport) {
      for (const reportId of entry.expense_report_ids) {
        store.updateExpenseReport(reportId, {
          status: 'queued_for_payroll' as any,
          payroll_queued: true,
          payroll_queued_at: new Date().toISOString(),
        })
      }
    }
  }

  return created
}
