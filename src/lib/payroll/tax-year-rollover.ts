/**
 * Tax Year Rollover Wizard
 *
 * Handles end-of-tax-year processing including:
 * - Generating final submissions
 * - Updating tax rates for the new year
 * - Rolling over leave balances
 * - Archiving completed pay runs
 * - Resetting cumulative counters
 */

export interface TaxYearConfig {
  country: string
  currentTaxYear: string      // e.g., "2025/2026"
  newTaxYear: string          // e.g., "2026/2027"
  taxYearStartMonth: number   // 1 = January, 4 = April (UK), etc.
  taxYearEndMonth: number     // 12 = December, 3 = March (UK)
}

export interface RolloverChecklist {
  id: string
  label: string
  description: string
  status: 'pending' | 'completed' | 'skipped' | 'error'
  required: boolean
  category: 'pre_rollover' | 'rollover' | 'post_rollover'
  action?: string
  errorMessage?: string
}

export interface RolloverPreview {
  country: string
  currentTaxYear: string
  newTaxYear: string
  employeeCount: number
  completedPayRuns: number
  pendingPayRuns: number
  taxCertificatesGenerated: number
  leaveBalancesToRollOver: number
  rateChanges: RateChange[]
  checklist: RolloverChecklist[]
  readyToRollOver: boolean
  blockingIssues: string[]
}

export interface RateChange {
  name: string
  type: string
  currentRate: number
  newRate: number
  effectiveDate: string
  source: string
}

export interface RolloverResult {
  success: boolean
  country: string
  newTaxYear: string
  employeesProcessed: number
  taxCertificatesGenerated: number
  leaveBalancesRolledOver: number
  ratesUpdated: number
  archiveId: string
  completedAt: string
  errors: string[]
}

/**
 * Tax year configurations by country
 */
const TAX_YEAR_CONFIGS: Record<string, { startMonth: number; endMonth: number; name: string }> = {
  GH: { startMonth: 1, endMonth: 12, name: 'Calendar Year' },
  NG: { startMonth: 1, endMonth: 12, name: 'Calendar Year' },
  KE: { startMonth: 1, endMonth: 12, name: 'Calendar Year' },
  ZA: { startMonth: 3, endMonth: 2, name: 'March-February' },
  CI: { startMonth: 1, endMonth: 12, name: 'Calendar Year' },
  SN: { startMonth: 1, endMonth: 12, name: 'Calendar Year' },
  UK: { startMonth: 4, endMonth: 3, name: 'April-March' },
  US: { startMonth: 1, endMonth: 12, name: 'Calendar Year' },
}

/**
 * Get tax year labels
 */
export function getTaxYearLabel(country: string, year: number): string {
  const config = TAX_YEAR_CONFIGS[country]
  if (!config) return `${year}`

  if (config.startMonth === 1) {
    return `${year}`
  }

  return `${year}/${year + 1}`
}

/**
 * Get current and next tax year for a country
 */
export function getTaxYears(country: string, asOfDate: string = new Date().toISOString().split('T')[0]): TaxYearConfig {
  const config = TAX_YEAR_CONFIGS[country] || TAX_YEAR_CONFIGS.GH
  const d = new Date(asOfDate)
  const currentMonth = d.getMonth() + 1
  const currentYear = d.getFullYear()

  let taxYearStart: number
  if (config.startMonth === 1) {
    taxYearStart = currentYear
  } else {
    taxYearStart = currentMonth >= config.startMonth ? currentYear : currentYear - 1
  }

  const currentTaxYear = getTaxYearLabel(country, taxYearStart)
  const newTaxYear = getTaxYearLabel(country, taxYearStart + 1)

  return {
    country,
    currentTaxYear,
    newTaxYear,
    taxYearStartMonth: config.startMonth,
    taxYearEndMonth: config.endMonth,
  }
}

/**
 * Generate rollover preview with checklist
 */
export function generateRolloverPreview(
  country: string,
  employeeCount: number,
  completedPayRuns: number,
  pendingPayRuns: number,
  taxCertificatesGenerated: number,
  leaveBalances: number,
  rateChanges: RateChange[] = [],
): RolloverPreview {
  const taxYears = getTaxYears(country)
  const blockingIssues: string[] = []

  // Build checklist
  const checklist: RolloverChecklist[] = [
    // Pre-rollover checks
    {
      id: 'final-pay-run',
      label: 'Process final pay run',
      description: `Ensure the final pay run for ${taxYears.currentTaxYear} is completed and marked as paid.`,
      status: pendingPayRuns === 0 ? 'completed' : 'pending',
      required: true,
      category: 'pre_rollover',
    },
    {
      id: 'reconcile-all',
      label: 'Reconcile all pay periods',
      description: 'Review period-over-period reconciliation for any discrepancies.',
      status: 'pending',
      required: true,
      category: 'pre_rollover',
    },
    {
      id: 'tax-certificates',
      label: 'Generate tax certificates',
      description: `Generate year-end tax certificates for all ${employeeCount} employees.`,
      status: taxCertificatesGenerated >= employeeCount ? 'completed' : 'pending',
      required: true,
      category: 'pre_rollover',
    },
    {
      id: 'distribute-certs',
      label: 'Distribute tax certificates',
      description: 'Send tax certificates to employees (via self-service portal or email).',
      status: 'pending',
      required: true,
      category: 'pre_rollover',
    },
    {
      id: 'verify-statutory',
      label: 'Verify statutory submissions',
      description: 'Confirm all statutory returns (SSNIT, PAYE, etc.) have been filed.',
      status: 'pending',
      required: true,
      category: 'pre_rollover',
    },

    // Rollover actions
    {
      id: 'update-rates',
      label: 'Update tax rates & thresholds',
      description: `Apply new tax year rates for ${taxYears.newTaxYear}. ${rateChanges.length} rate changes detected.`,
      status: 'pending',
      required: true,
      category: 'rollover',
      action: 'update-rates',
    },
    {
      id: 'rollover-leave',
      label: 'Roll over leave balances',
      description: `Carry forward unused leave for ${leaveBalances} employees per company policy.`,
      status: 'pending',
      required: false,
      category: 'rollover',
      action: 'rollover-leave',
    },
    {
      id: 'reset-cumulative',
      label: 'Reset cumulative pay counters',
      description: 'Reset year-to-date gross, tax, and pension totals to zero.',
      status: 'pending',
      required: true,
      category: 'rollover',
      action: 'reset-counters',
    },
    {
      id: 'archive-runs',
      label: 'Archive completed pay runs',
      description: `Archive ${completedPayRuns} completed pay runs for ${taxYears.currentTaxYear}.`,
      status: 'pending',
      required: false,
      category: 'rollover',
      action: 'archive',
    },

    // Post-rollover
    {
      id: 'verify-setup',
      label: 'Verify new year setup',
      description: `Confirm all settings are correct for ${taxYears.newTaxYear}.`,
      status: 'pending',
      required: true,
      category: 'post_rollover',
    },
    {
      id: 'test-pay-run',
      label: 'Run test payroll',
      description: 'Process a test pay run to verify new rates are applied correctly.',
      status: 'pending',
      required: false,
      category: 'post_rollover',
    },
  ]

  // Determine blocking issues
  if (pendingPayRuns > 0) {
    blockingIssues.push(`${pendingPayRuns} pay run(s) still pending — complete or cancel before rollover`)
  }
  if (taxCertificatesGenerated < employeeCount) {
    blockingIssues.push(`Tax certificates generated for ${taxCertificatesGenerated}/${employeeCount} employees`)
  }

  return {
    country,
    currentTaxYear: taxYears.currentTaxYear,
    newTaxYear: taxYears.newTaxYear,
    employeeCount,
    completedPayRuns,
    pendingPayRuns,
    taxCertificatesGenerated,
    leaveBalancesToRollOver: leaveBalances,
    rateChanges,
    checklist,
    readyToRollOver: blockingIssues.length === 0,
    blockingIssues,
  }
}

/**
 * Get common rate changes for a new tax year (sample data)
 */
export function getExpectedRateChanges(country: string, newYear: number): RateChange[] {
  // These would normally come from official gazette announcements
  // For now, return empty — admin would configure manually
  const changes: RateChange[] = []

  // Example: Ghana might update PAYE brackets
  if (country === 'GH') {
    changes.push(
      { name: 'PAYE Band 1 Threshold', type: 'income_tax', currentRate: 4380, newRate: 4824, effectiveDate: `${newYear}-01-01`, source: 'GRA Annual Budget' },
      { name: 'SSNIT Employer Rate', type: 'pension', currentRate: 13.0, newRate: 13.0, effectiveDate: `${newYear}-01-01`, source: 'SSNIT — No change' },
    )
  }

  return changes
}
