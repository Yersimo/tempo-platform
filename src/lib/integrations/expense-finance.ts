/**
 * Expense -> Finance Integration
 *
 * When expenses are approved:
 * 1. Create journal entries in the finance/GL module
 * 2. Categorize by cost center and GL account
 *
 * All amounts are in CENTS (e.g. 500000 = $5,000).
 * All integrations are event-driven via the cross-module event bus.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Journal entry to be created in the GL */
export interface GLJournalEntry {
  type: 'expense_reimbursement'
  date: string
  description: string
  reference: string
  lines: GLJournalLine[]
  totalDebitCents: number
  totalCreditCents: number
  currency: string
  status: 'draft' | 'posted'
  metadata: Record<string, unknown>
}

/** Individual line in a journal entry */
export interface GLJournalLine {
  account_code: string
  account_name: string
  cost_center?: string
  department_id?: string
  debit_cents: number
  credit_cents: number
  description: string
}

/** Expense report as read from the store */
export interface ExpenseReport {
  id: string
  employee_id: string
  department_id?: string
  total_amount: number  // cents
  currency: string
  status: string
  items?: ExpenseItem[]
  approved_at?: string
  approved_by?: string
}

/** Individual expense line item */
export interface ExpenseItem {
  id: string
  category: string
  amount: number  // cents
  description?: string
  merchant?: string
}

/** Result of creating GL journal entries from an expense */
export interface ExpenseFinanceResult {
  reportId: string
  employeeId: string
  journalEntry: GLJournalEntry
  costCenterBreakdown: Array<{
    costCenter: string
    totalCents: number
  }>
}

/** Store slice needed for expense->finance operations */
export interface ExpenseFinanceStoreSlice {
  expenseReports: Array<Record<string, unknown>>
  employees: Array<{ id: string; department_id: string }>
  departments: Array<{ id: string; name: string }>
  addJournalEntry?: (data: Record<string, unknown>) => void
  addToast?: (toast: { type: string; title: string; description?: string }) => void
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Expense category to GL account mapping */
const EXPENSE_GL_ACCOUNTS: Record<string, { code: string; name: string }> = {
  travel: { code: '6200', name: 'Travel Expenses' },
  meals: { code: '6210', name: 'Meals & Entertainment' },
  transportation: { code: '6220', name: 'Transportation' },
  lodging: { code: '6230', name: 'Lodging' },
  supplies: { code: '6300', name: 'Office Supplies' },
  equipment: { code: '6400', name: 'Equipment & Tools' },
  software: { code: '6410', name: 'Software & Subscriptions' },
  professional: { code: '6500', name: 'Professional Development' },
  training: { code: '6510', name: 'Training & Education' },
  communication: { code: '6600', name: 'Communication' },
  miscellaneous: { code: '6900', name: 'Miscellaneous Expenses' },
}

const AP_ACCOUNT = { code: '2100', name: 'Accounts Payable - Employee Reimbursements' }

// ---------------------------------------------------------------------------
// Core Functions
// ---------------------------------------------------------------------------

/**
 * Generate GL journal entries from an approved expense report.
 *
 * Creates a balanced double-entry journal entry:
 * - Debit: Expense accounts (categorized by expense type)
 * - Credit: Accounts Payable (employee reimbursement)
 *
 * @param reportId      - The expense report ID
 * @param employeeId    - Employee who submitted the expense
 * @param totalAmountCents - Total approved amount in cents
 * @param currency      - Currency code
 * @param store         - Store slice for looking up details
 * @returns Finance journal entry result
 */
export function generateExpenseJournalEntry(
  reportId: string,
  employeeId: string,
  totalAmountCents: number,
  currency: string,
  store: ExpenseFinanceStoreSlice,
): ExpenseFinanceResult {
  const now = new Date()
  const lines: GLJournalLine[] = []
  const costCenterMap = new Map<string, number>()

  // Find employee department for cost center
  const employee = store.employees.find(e => e.id === employeeId)
  const departmentId = employee?.department_id || 'unknown'
  const dept = store.departments.find(d => d.id === departmentId)
  const costCenter = dept?.name || departmentId

  // Find the expense report for item-level detail
  const report = store.expenseReports.find(
    r => (r as Record<string, unknown>).id === reportId,
  ) as unknown as ExpenseReport | undefined

  if (report?.items && report.items.length > 0) {
    // Create a debit line per expense category
    const categoryTotals = new Map<string, number>()
    for (const item of report.items) {
      const category = (item.category || 'miscellaneous').toLowerCase()
      categoryTotals.set(category, (categoryTotals.get(category) || 0) + item.amount)
    }

    for (const [category, amount] of categoryTotals) {
      const glAccount = EXPENSE_GL_ACCOUNTS[category] || EXPENSE_GL_ACCOUNTS.miscellaneous
      lines.push({
        account_code: glAccount.code,
        account_name: glAccount.name,
        cost_center: costCenter,
        department_id: departmentId,
        debit_cents: amount,
        credit_cents: 0,
        description: `Expense reimbursement: ${category} (Report #${reportId})`,
      })
    }
  } else {
    // No item breakdown — single debit line to miscellaneous
    const glAccount = EXPENSE_GL_ACCOUNTS.miscellaneous
    lines.push({
      account_code: glAccount.code,
      account_name: glAccount.name,
      cost_center: costCenter,
      department_id: departmentId,
      debit_cents: totalAmountCents,
      credit_cents: 0,
      description: `Expense reimbursement (Report #${reportId})`,
    })
  }

  // Credit line: Accounts Payable
  lines.push({
    account_code: AP_ACCOUNT.code,
    account_name: AP_ACCOUNT.name,
    cost_center: costCenter,
    department_id: departmentId,
    debit_cents: 0,
    credit_cents: totalAmountCents,
    description: `Employee reimbursement payable (Report #${reportId})`,
  })

  // Track cost center breakdown
  costCenterMap.set(costCenter, (costCenterMap.get(costCenter) || 0) + totalAmountCents)

  const journalEntry: GLJournalEntry = {
    type: 'expense_reimbursement',
    date: now.toISOString().split('T')[0],
    description: `Expense reimbursement for employee ${employeeId} — Report #${reportId}`,
    reference: `EXP-${reportId}`,
    lines,
    totalDebitCents: totalAmountCents,
    totalCreditCents: totalAmountCents,
    currency,
    status: 'draft',
    metadata: {
      source: 'expense-finance-integration',
      auto_generated: true,
      report_id: reportId,
      employee_id: employeeId,
      created_at: now.toISOString(),
    },
  }

  return {
    reportId,
    employeeId,
    journalEntry,
    costCenterBreakdown: Array.from(costCenterMap.entries()).map(([cc, total]) => ({
      costCenter: cc,
      totalCents: total,
    })),
  }
}

/**
 * Apply expense journal entry to the store.
 *
 * @param result - Output from generateExpenseJournalEntry
 * @param store  - Store actions for persisting
 * @returns Whether the journal entry was created
 */
export function applyExpenseJournalEntry(
  result: ExpenseFinanceResult,
  store: ExpenseFinanceStoreSlice,
): boolean {
  if (store.addJournalEntry) {
    store.addJournalEntry(result.journalEntry as unknown as Record<string, unknown>)
    return true
  }
  return false
}
