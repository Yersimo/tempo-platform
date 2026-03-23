// ---------------------------------------------------------------------------
// Double-Entry Accounting Engine
// ---------------------------------------------------------------------------
// Enforces debits = credits, auto-generates journal entries from payroll,
// invoicing, expenses, and billing events, and produces financial statements.
// All monetary amounts are in CENTS.
// ---------------------------------------------------------------------------

// ---- Types ----------------------------------------------------------------

export interface JournalEntry {
  id: string
  orgId: string
  entryNumber: string // auto-generated: JE-2026-0001
  date: string
  description: string
  reference?: string // source document (INV-001, PAY-2026-03, EXP-001)
  sourceModule: 'manual' | 'payroll' | 'invoicing' | 'expenses' | 'billing' | 'banking' | 'depreciation'
  status: 'draft' | 'posted' | 'reversed'
  lines: JournalEntryLine[]
  createdBy: string
  createdAt: string
  postedAt?: string
  reversedAt?: string
  reversalOfId?: string // if this is a reversing entry
}

export interface JournalEntryLine {
  id: string
  entryId: string
  accountCode: string // from chart of accounts
  accountName: string
  debit: number // in cents
  credit: number // in cents
  description?: string
  department?: string
  costCenter?: string
  currency: string
}

export interface ChartOfAccountsEntry {
  code: string
  name: string
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'
  category: string
}

// ---- Validation -----------------------------------------------------------

/**
 * CRITICAL: Enforce debits = credits (fundamental double-entry rule).
 */
export function validateJournalEntry(entry: Pick<JournalEntry, 'lines'>): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!entry.lines || entry.lines.length < 2) {
    errors.push('Journal entry must have at least 2 lines')
  }

  const totalDebits = entry.lines.reduce((sum, l) => sum + (l.debit || 0), 0)
  const totalCredits = entry.lines.reduce((sum, l) => sum + (l.credit || 0), 0)

  if (totalDebits !== totalCredits) {
    errors.push(
      `Debits (${totalDebits}) must equal credits (${totalCredits}). Difference: ${Math.abs(totalDebits - totalCredits)}`,
    )
  }

  if (totalDebits === 0) errors.push('Entry cannot have zero total')

  // Each line must have either debit or credit, not both
  entry.lines.forEach((line, i) => {
    if (line.debit > 0 && line.credit > 0) errors.push(`Line ${i + 1}: Cannot have both debit and credit`)
    if (line.debit === 0 && line.credit === 0) errors.push(`Line ${i + 1}: Must have either debit or credit`)
    if (!line.accountCode) errors.push(`Line ${i + 1}: Account code is required`)
  })

  return { valid: errors.length === 0, errors }
}

// ---- Entry Number Generator -----------------------------------------------

let _entryCounter = 0

export function generateEntryNumber(prefix: string = 'JE'): string {
  _entryCounter += 1
  const year = new Date().getFullYear()
  return `${prefix}-${year}-${String(_entryCounter).padStart(4, '0')}`
}

export function resetEntryCounter(value: number = 0): void {
  _entryCounter = value
}

// ---- Helpers --------------------------------------------------------------

function uuid(): string {
  return crypto.randomUUID()
}

function today(): string {
  return new Date().toISOString().split('T')[0]
}

function now(): string {
  return new Date().toISOString()
}

function makeLine(
  accountCode: string,
  accountName: string,
  debit: number,
  credit: number,
  currency: string,
  description?: string,
  costCenter?: string,
): JournalEntryLine {
  return {
    id: uuid(),
    entryId: '', // filled in by caller
    accountCode,
    accountName,
    debit,
    credit,
    description,
    costCenter,
    currency,
  }
}

// ---- Auto-JE Generators --------------------------------------------------

/**
 * Generate a journal entry from a completed payroll run.
 * Dr Salary Expense (gross)
 * Cr PAYE Tax Payable (estimated 60% of deductions)
 * Cr SSNIT Payable (estimated 40% of deductions)
 * Cr Cash / Bank (net pay)
 */
export function generatePayrollJournalEntry(payrollRun: Record<string, any>): JournalEntry {
  const grossPay = payrollRun.total_gross || payrollRun.totalGross || payrollRun.totalGrossCents || 0
  const netPay = payrollRun.total_net || payrollRun.totalNet || payrollRun.totalNetCents || 0
  const deductions = grossPay - netPay
  const currency = payrollRun.currency || 'GHS'
  const periodStart = payrollRun.pay_period_start || payrollRun.period_start || payrollRun.periodStart || ''
  const periodEnd = payrollRun.pay_period_end || payrollRun.period_end || payrollRun.periodEnd || ''

  const taxPortion = Math.round(deductions * 0.6)
  const ssnitPortion = deductions - taxPortion // avoid rounding loss

  const entry: JournalEntry = {
    id: uuid(),
    orgId: payrollRun.org_id || payrollRun.orgId || '',
    entryNumber: generateEntryNumber('JE-PAY'),
    date: today(),
    description: `Payroll for period ${periodStart} to ${periodEnd}`,
    reference: `PAY-${(payrollRun.id || '').substring(0, 8)}`,
    sourceModule: 'payroll',
    status: 'posted',
    lines: [
      makeLine('5100', 'Salary Expense', grossPay, 0, currency, 'Gross salary'),
      makeLine('2100', 'PAYE Tax Payable', 0, taxPortion, currency, 'Income tax withholding'),
      makeLine('2110', 'SSNIT Payable', 0, ssnitPortion, currency, 'Social security contribution'),
      makeLine('1000', 'Cash / Bank', 0, netPay, currency, 'Net pay disbursement'),
    ],
    createdBy: 'system',
    createdAt: now(),
    postedAt: now(),
  }
  return entry
}

/**
 * Generate a journal entry when an invoice is marked as paid.
 * Dr Cash / Bank
 * Cr Accounts Receivable
 */
export function generateInvoicePaymentJE(invoice: Record<string, any>): JournalEntry {
  const amount = invoice.amount || invoice.total_amount || invoice.totalAmount || 0
  const currency = invoice.currency || 'GHS'

  return {
    id: uuid(),
    orgId: invoice.org_id || invoice.orgId || '',
    entryNumber: generateEntryNumber('JE-INV'),
    date: today(),
    description: `Payment received for invoice ${invoice.invoice_number || invoice.invoiceNumber || ''}`,
    reference: invoice.invoice_number || invoice.invoiceNumber || undefined,
    sourceModule: 'invoicing',
    status: 'posted',
    lines: [
      makeLine('1000', 'Cash / Bank', amount, 0, currency, 'Payment received'),
      makeLine('1200', 'Accounts Receivable', 0, amount, currency, 'AR cleared'),
    ],
    createdBy: 'system',
    createdAt: now(),
    postedAt: now(),
  }
}

/**
 * Generate a journal entry when an expense report is approved.
 * Dr Expense account (Travel & Entertainment by default)
 * Cr Accounts Payable
 */
export function generateExpenseJE(expense: Record<string, any>): JournalEntry {
  const amount = expense.total_amount || expense.totalAmount || expense.amount || 0
  const currency = expense.currency || 'GHS'
  const expenseAccount = expense.category === 'software' ? '6400' :
    expense.category === 'office' ? '6100' :
    expense.category === 'professional' ? '6300' : '6200'
  const expenseName = expense.category === 'software' ? 'Software & Subscriptions' :
    expense.category === 'office' ? 'Office Supplies' :
    expense.category === 'professional' ? 'Professional Services' : 'Travel & Entertainment'

  return {
    id: uuid(),
    orgId: expense.org_id || expense.orgId || '',
    entryNumber: generateEntryNumber('JE-EXP'),
    date: today(),
    description: `Expense reimbursement: ${expense.description || expense.title || ''}`,
    reference: `EXP-${(expense.id || '').substring(0, 8)}`,
    sourceModule: 'expenses',
    status: 'posted',
    lines: [
      makeLine(expenseAccount, expenseName, amount, 0, currency, expense.category || 'Expense'),
      makeLine('2000', 'Accounts Payable', 0, amount, currency, 'Reimbursement due'),
    ],
    createdBy: 'system',
    createdAt: now(),
    postedAt: now(),
  }
}

/**
 * Generate a journal entry when a bill is paid.
 * Dr Accounts Payable
 * Cr Cash / Bank
 */
export function generateBillPaymentJE(bill: Record<string, any>): JournalEntry {
  const amount = bill.amount || bill.total_amount || 0
  const currency = bill.currency || 'GHS'

  return {
    id: uuid(),
    orgId: bill.org_id || bill.orgId || '',
    entryNumber: generateEntryNumber('JE-BILL'),
    date: today(),
    description: `Bill payment to ${bill.vendor_name || bill.vendorName || 'vendor'}`,
    reference: bill.reference_number || bill.referenceNumber || undefined,
    sourceModule: 'billing',
    status: 'posted',
    lines: [
      makeLine('2000', 'Accounts Payable', amount, 0, currency, 'AP settled'),
      makeLine('1000', 'Cash / Bank', 0, amount, currency, 'Payment made'),
    ],
    createdBy: 'system',
    createdAt: now(),
    postedAt: now(),
  }
}

// ---- Chart of Accounts (Standard Template) --------------------------------

export const STANDARD_CHART_OF_ACCOUNTS: ChartOfAccountsEntry[] = [
  // Assets (1xxx)
  { code: '1000', name: 'Cash and Bank', type: 'asset', category: 'current_asset' },
  { code: '1100', name: 'Petty Cash', type: 'asset', category: 'current_asset' },
  { code: '1200', name: 'Accounts Receivable', type: 'asset', category: 'current_asset' },
  { code: '1300', name: 'Prepaid Expenses', type: 'asset', category: 'current_asset' },
  { code: '1400', name: 'Inventory', type: 'asset', category: 'current_asset' },
  { code: '1500', name: 'Fixed Assets', type: 'asset', category: 'non_current_asset' },
  { code: '1510', name: 'Accumulated Depreciation', type: 'asset', category: 'non_current_asset' },
  { code: '1600', name: 'Intangible Assets', type: 'asset', category: 'non_current_asset' },
  // Liabilities (2xxx)
  { code: '2000', name: 'Accounts Payable', type: 'liability', category: 'current_liability' },
  { code: '2100', name: 'PAYE Tax Payable', type: 'liability', category: 'current_liability' },
  { code: '2110', name: 'SSNIT Payable', type: 'liability', category: 'current_liability' },
  { code: '2120', name: 'VAT Payable', type: 'liability', category: 'current_liability' },
  { code: '2200', name: 'Accrued Expenses', type: 'liability', category: 'current_liability' },
  { code: '2300', name: 'Deferred Revenue', type: 'liability', category: 'current_liability' },
  { code: '2400', name: 'Short-term Loans', type: 'liability', category: 'current_liability' },
  { code: '2500', name: 'Long-term Loans', type: 'liability', category: 'non_current_liability' },
  // Equity (3xxx)
  { code: '3000', name: 'Share Capital', type: 'equity', category: 'equity' },
  { code: '3100', name: 'Retained Earnings', type: 'equity', category: 'equity' },
  { code: '3200', name: 'Current Year Earnings', type: 'equity', category: 'equity' },
  // Revenue (4xxx)
  { code: '4000', name: 'Sales Revenue', type: 'revenue', category: 'operating_revenue' },
  { code: '4100', name: 'Service Revenue', type: 'revenue', category: 'operating_revenue' },
  { code: '4200', name: 'Interest Income', type: 'revenue', category: 'other_revenue' },
  { code: '4300', name: 'Other Income', type: 'revenue', category: 'other_revenue' },
  // Expenses (5xxx-6xxx)
  { code: '5100', name: 'Salary Expense', type: 'expense', category: 'operating_expense' },
  { code: '5200', name: 'Employee Benefits', type: 'expense', category: 'operating_expense' },
  { code: '5300', name: 'Contractor Payments', type: 'expense', category: 'operating_expense' },
  { code: '5400', name: 'Training & Development', type: 'expense', category: 'operating_expense' },
  { code: '5500', name: 'Recruitment Costs', type: 'expense', category: 'operating_expense' },
  { code: '6000', name: 'Rent & Utilities', type: 'expense', category: 'operating_expense' },
  { code: '6100', name: 'Office Supplies', type: 'expense', category: 'operating_expense' },
  { code: '6200', name: 'Travel & Entertainment', type: 'expense', category: 'operating_expense' },
  { code: '6300', name: 'Professional Services', type: 'expense', category: 'operating_expense' },
  { code: '6400', name: 'Software & Subscriptions', type: 'expense', category: 'operating_expense' },
  { code: '6500', name: 'Insurance', type: 'expense', category: 'operating_expense' },
  { code: '6600', name: 'Depreciation', type: 'expense', category: 'operating_expense' },
  { code: '6700', name: 'Bank Charges', type: 'expense', category: 'operating_expense' },
  { code: '6800', name: 'Marketing & Advertising', type: 'expense', category: 'operating_expense' },
  { code: '6900', name: 'Miscellaneous Expenses', type: 'expense', category: 'operating_expense' },
]

// ---- Financial Statement Generators ---------------------------------------

export interface TrialBalanceResult {
  accounts: { code: string; name: string; debit: number; credit: number; balance: number }[]
  totalDebits: number
  totalCredits: number
  isBalanced: boolean
}

export function generateTrialBalance(journalEntries: JournalEntry[]): TrialBalanceResult {
  const accountBalances: Record<string, { name: string; debit: number; credit: number }> = {}

  for (const entry of journalEntries) {
    if (entry.status !== 'posted') continue
    for (const line of entry.lines) {
      if (!accountBalances[line.accountCode]) {
        accountBalances[line.accountCode] = { name: line.accountName, debit: 0, credit: 0 }
      }
      accountBalances[line.accountCode].debit += line.debit || 0
      accountBalances[line.accountCode].credit += line.credit || 0
    }
  }

  const accounts = Object.entries(accountBalances)
    .map(([code, data]) => ({
      code,
      name: data.name,
      debit: data.debit,
      credit: data.credit,
      balance: data.debit - data.credit,
    }))
    .sort((a, b) => a.code.localeCompare(b.code))

  const totalDebits = accounts.reduce((sum, a) => sum + a.debit, 0)
  const totalCredits = accounts.reduce((sum, a) => sum + a.credit, 0)

  return { accounts, totalDebits, totalCredits, isBalanced: totalDebits === totalCredits }
}

export interface IncomeStatementResult {
  revenue: { account: string; amount: number }[]
  expenses: { account: string; amount: number }[]
  totalRevenue: number
  totalExpenses: number
  netIncome: number
  period: { start: string; end: string }
}

export function generateIncomeStatement(
  journalEntries: JournalEntry[],
  period: { start: string; end: string },
): IncomeStatementResult {
  const periodEntries = journalEntries.filter(
    (e) => e.status === 'posted' && e.date >= period.start && e.date <= period.end,
  )

  const revenue: Record<string, number> = {}
  const expenses: Record<string, number> = {}

  for (const entry of periodEntries) {
    for (const line of entry.lines) {
      if (line.accountCode.startsWith('4')) {
        // Revenue: credit increases revenue
        revenue[line.accountName] = (revenue[line.accountName] || 0) + (line.credit - line.debit)
      } else if (line.accountCode.startsWith('5') || line.accountCode.startsWith('6')) {
        // Expenses: debit increases expense
        expenses[line.accountName] = (expenses[line.accountName] || 0) + (line.debit - line.credit)
      }
    }
  }

  const revenueItems = Object.entries(revenue)
    .map(([account, amount]) => ({ account, amount }))
    .sort((a, b) => b.amount - a.amount)
  const expenseItems = Object.entries(expenses)
    .map(([account, amount]) => ({ account, amount }))
    .sort((a, b) => b.amount - a.amount)
  const totalRevenue = revenueItems.reduce((sum, r) => sum + r.amount, 0)
  const totalExpenses = expenseItems.reduce((sum, e) => sum + e.amount, 0)

  return {
    revenue: revenueItems,
    expenses: expenseItems,
    totalRevenue,
    totalExpenses,
    netIncome: totalRevenue - totalExpenses,
    period,
  }
}

export interface BalanceSheetResult {
  assets: {
    current: { account: string; amount: number }[]
    nonCurrent: { account: string; amount: number }[]
  }
  liabilities: {
    current: { account: string; amount: number }[]
    nonCurrent: { account: string; amount: number }[]
  }
  equity: { account: string; amount: number }[]
  totalAssets: number
  totalLiabilities: number
  totalEquity: number
  isBalanced: boolean // assets = liabilities + equity
}

export function generateBalanceSheet(journalEntries: JournalEntry[], asOfDate: string): BalanceSheetResult {
  const entries = journalEntries.filter((e) => e.status === 'posted' && e.date <= asOfDate)
  const balances: Record<string, { name: string; balance: number }> = {}

  for (const entry of entries) {
    for (const line of entry.lines) {
      if (!balances[line.accountCode]) balances[line.accountCode] = { name: line.accountName, balance: 0 }
      balances[line.accountCode].balance += (line.debit || 0) - (line.credit || 0)
    }
  }

  const currentAssets = Object.entries(balances)
    .filter(([code]) => code >= '1000' && code < '1500')
    .map(([, data]) => ({ account: data.name, amount: data.balance }))
  const nonCurrentAssets = Object.entries(balances)
    .filter(([code]) => code >= '1500' && code < '2000')
    .map(([, data]) => ({ account: data.name, amount: data.balance }))
  const currentLiabilities = Object.entries(balances)
    .filter(([code]) => code >= '2000' && code < '2500')
    .map(([, data]) => ({ account: data.name, amount: Math.abs(data.balance) }))
  const nonCurrentLiabilities = Object.entries(balances)
    .filter(([code]) => code >= '2500' && code < '3000')
    .map(([, data]) => ({ account: data.name, amount: Math.abs(data.balance) }))
  const equity = Object.entries(balances)
    .filter(([code]) => code >= '3000' && code < '4000')
    .map(([, data]) => ({ account: data.name, amount: Math.abs(data.balance) }))

  const totalAssets = [...currentAssets, ...nonCurrentAssets].reduce((sum, a) => sum + a.amount, 0)
  const totalLiabilities = [...currentLiabilities, ...nonCurrentLiabilities].reduce((sum, l) => sum + l.amount, 0)
  const totalEquity = equity.reduce((sum, e) => sum + e.amount, 0)

  return {
    assets: { current: currentAssets, nonCurrent: nonCurrentAssets },
    liabilities: { current: currentLiabilities, nonCurrent: nonCurrentLiabilities },
    equity,
    totalAssets,
    totalLiabilities,
    totalEquity,
    isBalanced: Math.abs(totalAssets - totalLiabilities - totalEquity) < 1, // within 1 cent
  }
}

// ---- Convert legacy GL format to accounting engine format -----------------

/**
 * Converts the existing page-level JournalEntry format (with account_code,
 * debit_cents, credit_cents) to the accounting engine JournalEntry format.
 */
export function convertLegacyEntry(legacy: {
  id: string
  type: string
  date: string
  description: string
  reference: string
  lines: {
    account_code: string
    account_name: string
    cost_center?: string
    department_id?: string
    debit_cents: number
    credit_cents: number
    description: string
  }[]
  totalDebitCents: number
  totalCreditCents: number
  currency: string
  status: string
}): JournalEntry {
  const sourceMap: Record<string, JournalEntry['sourceModule']> = {
    payroll: 'payroll',
    expense_reimbursement: 'expenses',
    manual: 'manual',
    invoicing: 'invoicing',
    billing: 'billing',
    banking: 'banking',
    depreciation: 'depreciation',
  }
  return {
    id: legacy.id,
    orgId: '',
    entryNumber: legacy.reference,
    date: legacy.date,
    description: legacy.description,
    reference: legacy.reference,
    sourceModule: sourceMap[legacy.type] || 'manual',
    status: legacy.status as JournalEntry['status'],
    lines: legacy.lines.map((l) => ({
      id: crypto.randomUUID(),
      entryId: legacy.id,
      accountCode: l.account_code,
      accountName: l.account_name,
      debit: l.debit_cents,
      credit: l.credit_cents,
      description: l.description,
      costCenter: l.cost_center,
      department: l.department_id,
      currency: legacy.currency,
    })),
    createdBy: 'system',
    createdAt: new Date().toISOString(),
    postedAt: legacy.status === 'posted' ? new Date().toISOString() : undefined,
  }
}
