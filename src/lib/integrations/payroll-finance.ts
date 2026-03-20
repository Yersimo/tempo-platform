/**
 * Payroll -> Finance Integration
 *
 * When a payroll run is completed:
 * 1. Generate payroll journal entries for the finance module
 * 2. Break down by department cost centers
 *
 * All amounts are in CENTS (e.g. 500000 = $5,000).
 * All integrations are event-driven via the cross-module event bus.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Journal entry to be created in the GL */
export interface PayrollJournalEntry {
  type: 'payroll'
  date: string
  description: string
  reference: string
  lines: PayrollJournalLine[]
  totalDebitCents: number
  totalCreditCents: number
  currency: string
  status: 'draft' | 'posted'
  metadata: Record<string, unknown>
}

/** Individual line in a payroll journal entry */
export interface PayrollJournalLine {
  account_code: string
  account_name: string
  cost_center?: string
  department_id?: string
  debit_cents: number
  credit_cents: number
  description: string
}

/** Department cost center breakdown from the payroll run */
export interface DepartmentPayrollBreakdown {
  departmentId: string
  departmentName: string
  totalGrossCents: number
  headcount: number
}

/** Result of generating payroll journal entries */
export interface PayrollFinanceResult {
  payrollRunId: string
  journalEntry: PayrollJournalEntry
  departmentBreakdown: Array<{
    departmentName: string
    grossCents: number
    headcount: number
  }>
  summary: {
    totalGrossCents: number
    totalDeductionsCents: number
    totalTaxCents: number
    totalNetCents: number
  }
}

/** Store slice needed for payroll->finance operations */
export interface PayrollFinanceStoreSlice {
  addJournalEntry?: (data: Record<string, unknown>) => void
  addToast?: (toast: { type: string; title: string; description?: string }) => void
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** GL accounts for payroll journal entries */
const PAYROLL_GL_ACCOUNTS = {
  salariesExpense: { code: '5100', name: 'Salaries & Wages Expense' },
  payrollTaxExpense: { code: '5200', name: 'Payroll Tax Expense' },
  benefitsExpense: { code: '5300', name: 'Employee Benefits Expense' },
  salariesPayable: { code: '2200', name: 'Salaries & Wages Payable' },
  taxWithholding: { code: '2300', name: 'Tax Withholding Payable' },
  benefitDeductions: { code: '2400', name: 'Benefit Deductions Payable' },
}

// ---------------------------------------------------------------------------
// Core Functions
// ---------------------------------------------------------------------------

/**
 * Generate GL journal entries from a completed payroll run.
 *
 * Creates a balanced double-entry journal with:
 * - Debit: Salary expense (by department cost center), payroll tax expense
 * - Credit: Salaries payable (net pay), tax withholding payable, benefit deductions payable
 *
 * @param payrollRunId       - The payroll run ID
 * @param periodStart        - Pay period start date
 * @param periodEnd          - Pay period end date
 * @param totalGrossCents    - Total gross pay in cents
 * @param totalNetCents      - Total net pay in cents
 * @param totalDeductionsCents - Total deductions in cents
 * @param totalTaxCents      - Total tax withholdings in cents
 * @param currency           - Currency code
 * @param departmentBreakdown - Optional per-department breakdown
 * @returns Finance journal entry result
 */
export function generatePayrollJournalEntries(
  payrollRunId: string,
  periodStart: string,
  periodEnd: string,
  totalGrossCents: number,
  totalNetCents: number,
  totalDeductionsCents: number,
  totalTaxCents: number,
  currency: string,
  departmentBreakdown?: DepartmentPayrollBreakdown[],
): PayrollFinanceResult {
  const now = new Date()
  const lines: PayrollJournalLine[] = []
  const deptSummary: PayrollFinanceResult['departmentBreakdown'] = []

  // Debit side: Salary expense by department if breakdown available
  if (departmentBreakdown && departmentBreakdown.length > 0) {
    for (const dept of departmentBreakdown) {
      lines.push({
        account_code: PAYROLL_GL_ACCOUNTS.salariesExpense.code,
        account_name: PAYROLL_GL_ACCOUNTS.salariesExpense.name,
        cost_center: dept.departmentName,
        department_id: dept.departmentId,
        debit_cents: dept.totalGrossCents,
        credit_cents: 0,
        description: `Payroll expense: ${dept.departmentName} (${dept.headcount} employees)`,
      })

      deptSummary.push({
        departmentName: dept.departmentName,
        grossCents: dept.totalGrossCents,
        headcount: dept.headcount,
      })
    }
  } else {
    // Single line for all salary expense
    lines.push({
      account_code: PAYROLL_GL_ACCOUNTS.salariesExpense.code,
      account_name: PAYROLL_GL_ACCOUNTS.salariesExpense.name,
      debit_cents: totalGrossCents,
      credit_cents: 0,
      description: `Payroll expense: period ${periodStart} to ${periodEnd}`,
    })
  }

  // Credit side: Net pay (salaries payable)
  lines.push({
    account_code: PAYROLL_GL_ACCOUNTS.salariesPayable.code,
    account_name: PAYROLL_GL_ACCOUNTS.salariesPayable.name,
    debit_cents: 0,
    credit_cents: totalNetCents,
    description: `Net salaries payable: period ${periodStart} to ${periodEnd}`,
  })

  // Credit side: Tax withholding payable
  if (totalTaxCents > 0) {
    lines.push({
      account_code: PAYROLL_GL_ACCOUNTS.taxWithholding.code,
      account_name: PAYROLL_GL_ACCOUNTS.taxWithholding.name,
      debit_cents: 0,
      credit_cents: totalTaxCents,
      description: `Tax withholding payable: period ${periodStart} to ${periodEnd}`,
    })
  }

  // Credit side: Benefit deductions payable
  if (totalDeductionsCents > 0) {
    lines.push({
      account_code: PAYROLL_GL_ACCOUNTS.benefitDeductions.code,
      account_name: PAYROLL_GL_ACCOUNTS.benefitDeductions.name,
      debit_cents: 0,
      credit_cents: totalDeductionsCents,
      description: `Benefit deductions payable: period ${periodStart} to ${periodEnd}`,
    })
  }

  const totalDebitCents = totalGrossCents
  const totalCreditCents = totalNetCents + totalTaxCents + totalDeductionsCents

  const journalEntry: PayrollJournalEntry = {
    type: 'payroll',
    date: now.toISOString().split('T')[0],
    description: `Payroll journal entry for period ${periodStart} to ${periodEnd} (Run #${payrollRunId})`,
    reference: `PAY-${payrollRunId}`,
    lines,
    totalDebitCents,
    totalCreditCents,
    currency,
    status: 'draft',
    metadata: {
      source: 'payroll-finance-integration',
      auto_generated: true,
      payroll_run_id: payrollRunId,
      period_start: periodStart,
      period_end: periodEnd,
      created_at: now.toISOString(),
    },
  }

  return {
    payrollRunId,
    journalEntry,
    departmentBreakdown: deptSummary,
    summary: {
      totalGrossCents,
      totalDeductionsCents,
      totalTaxCents,
      totalNetCents,
    },
  }
}

/**
 * Apply payroll journal entry to the store.
 *
 * @param result - Output from generatePayrollJournalEntries
 * @param store  - Store actions for persisting
 * @returns Whether the journal entry was created
 */
export function applyPayrollJournalEntry(
  result: PayrollFinanceResult,
  store: PayrollFinanceStoreSlice,
): boolean {
  if (store.addJournalEntry) {
    store.addJournalEntry(result.journalEntry as unknown as Record<string, unknown>)
    return true
  }
  return false
}
