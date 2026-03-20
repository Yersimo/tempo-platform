/**
 * Timesheet Integration for Payroll
 *
 * Links Time & Attendance time entry data to payroll calculations.
 * Calculates regular hours, overtime hours (1.5x), double-time hours (2x),
 * computes overtime pay amounts based on employee hourly rates, and validates
 * timesheet completeness for payroll processing.
 */

import { getOvertimeRules } from '@/lib/payroll/labor-law-registry'

// ============================================================
// TYPES & INTERFACES
// ============================================================

/** Shape of a time entry from the store / DB */
export interface TimeEntry {
  id: string
  employee_id: string
  date: string               // YYYY-MM-DD
  clock_in: string           // ISO timestamp
  clock_out: string | null   // ISO timestamp (null if still clocked in)
  break_minutes: number
  total_hours: number | null
  overtime_hours: number | null
  status: 'pending' | 'approved' | 'rejected'
  approved_by: string | null
  location: string | null
  notes: string | null
}

/** Country-level overtime rule from the store / DB */
export interface OvertimeRule {
  id: string
  name: string
  country: string
  daily_threshold_hours: number
  weekly_threshold_hours: number
  multiplier: number               // e.g. 1.5
  double_overtime_threshold: number | null
  double_overtime_multiplier: number | null
  is_active: boolean
}

/** Breakdown of hours for a single time entry */
export interface TimeEntryBreakdownItem {
  date: string
  regularHours: number
  overtimeHours: number          // hours at standard OT multiplier
  doubleTimeHours: number        // hours at double-time multiplier
  totalHours: number
  status: 'pending' | 'approved' | 'rejected'
  description: string
}

/** Payroll impact data for one employee's timesheets in a pay period */
export interface TimesheetPayrollImpact {
  employeeId: string
  periodStart: string
  periodEnd: string
  totalRegularHours: number
  totalOvertimeHours: number
  totalDoubleTimeHours: number
  totalHours: number
  regularPay: number             // cents
  overtimePay: number            // cents (at OT multiplier)
  doubleTimePay: number          // cents (at double-time multiplier)
  totalTimesheetPay: number      // cents (regular + OT + double-time)
  overtimeMultiplier: number
  doubleTimeMultiplier: number
  daysWorked: number
  daysInPeriod: number
  attendanceRate: number         // 0-1
  approvedEntries: number
  pendingEntries: number
  rejectedEntries: number
  breakdown: TimeEntryBreakdownItem[]
}

/** Per-employee aggregated time summary */
export interface EmployeeTimeSummary {
  employeeId: string
  totalHours: number
  regularHours: number
  overtimeHours: number
  doubleTimeHours: number
  daysWorked: number
  daysInPeriod: number
  attendanceRate: number         // 0-1
  averageDailyHours: number
  approvedEntries: number
  pendingEntries: number
  rejectedEntries: number
  latestEntry: string | null     // ISO date of most recent entry
}

/** Validation result for timesheet completeness */
export interface TimesheetValidationResult {
  isValid: boolean
  employeeResults: EmployeeValidationResult[]
  totalErrors: number
  totalWarnings: number
  summary: string
}

export interface EmployeeValidationResult {
  employeeId: string
  isValid: boolean
  errors: TimesheetValidationIssue[]
  warnings: TimesheetValidationIssue[]
}

export interface TimesheetValidationIssue {
  type: 'missing_timesheet' | 'unapproved_entry' | 'incomplete_entry' | 'excessive_hours' | 'no_entries' | 'gap_detected'
  severity: 'error' | 'warning'
  date?: string
  description: string
}

// ============================================================
// CONSTANTS
// ============================================================

/**
 * Standard working hours per day by country (used for attendance rate calculations)
 */
const STANDARD_DAILY_HOURS: Record<string, number> = {
  GH: 8, NG: 8, KE: 8, ZA: 9, CI: 8, SN: 8, CM: 8,
  TZ: 8, UG: 8, RW: 8, ET: 8, EG: 8, MA: 8,
  US: 8, UK: 8, DE: 8, FR: 7, CA: 8, AU: 7.6,
}

/**
 * Standard working days per month by country
 */
const WORKING_DAYS_PER_MONTH: Record<string, number> = {
  GH: 22, NG: 22, KE: 22, ZA: 21.67, CI: 22, SN: 22, CM: 22,
  TZ: 22, UG: 22, RW: 22, ET: 22, EG: 22, MA: 22,
  US: 21.67, UK: 21.67, DE: 21, FR: 21, CA: 21.67, AU: 21.67,
}

/**
 * Default overtime thresholds (fallback when no rule is configured)
 */
const DEFAULT_DAILY_THRESHOLD = 8
const DEFAULT_WEEKLY_THRESHOLD = 40
const DEFAULT_OT_MULTIPLIER = 1.5
const DEFAULT_DOUBLE_OT_MULTIPLIER = 2.0

/**
 * Maximum hours per day considered valid (safety check)
 */
const MAX_VALID_DAILY_HOURS = 24

// ============================================================
// CORE FUNCTIONS
// ============================================================

/**
 * Calculate the payroll impact of timesheet entries for a given employee and period.
 *
 * Processes time entries to split hours into regular, overtime, and double-time
 * buckets, then computes pay amounts based on the employee's hourly rate and
 * applicable overtime multipliers.
 *
 * @param entries - Time entries for a single employee within the pay period
 * @param hourlyRate - Employee's base hourly rate in cents
 * @param countryCode - ISO country code for overtime rule lookup
 * @param periodStart - Start of pay period (YYYY-MM-DD)
 * @param periodEnd - End of pay period (YYYY-MM-DD)
 * @param overtimeRule - Optional explicit overtime rule (overrides country lookup)
 */
export function calculateTimesheetPayrollImpact(
  entries: TimeEntry[],
  hourlyRate: number,
  countryCode: string,
  periodStart: string,
  periodEnd: string,
  overtimeRule?: OvertimeRule | null,
): TimesheetPayrollImpact {
  // Resolve overtime thresholds
  const { dailyThreshold, otMultiplier, doubleOtThreshold, doubleOtMultiplier } =
    resolveOvertimeConfig(countryCode, overtimeRule)

  const breakdown: TimeEntryBreakdownItem[] = []
  let totalRegularHours = 0
  let totalOvertimeHours = 0
  let totalDoubleTimeHours = 0
  let approvedEntries = 0
  let pendingEntries = 0
  let rejectedEntries = 0

  // Only process entries that fall within the pay period
  const periodEntries = filterEntriesForPeriod(entries, periodStart, periodEnd)

  // Track unique dates worked
  const datesWorked = new Set<string>()

  for (const entry of periodEntries) {
    // Count by status
    if (entry.status === 'approved') approvedEntries++
    else if (entry.status === 'pending') pendingEntries++
    else if (entry.status === 'rejected') rejectedEntries++

    // Skip rejected entries from pay calculations
    if (entry.status === 'rejected') {
      breakdown.push({
        date: entry.date,
        regularHours: 0,
        overtimeHours: 0,
        doubleTimeHours: 0,
        totalHours: entry.total_hours || 0,
        status: 'rejected',
        description: 'Rejected — excluded from payroll',
      })
      continue
    }

    const totalHours = entry.total_hours || 0
    if (totalHours <= 0) continue

    datesWorked.add(entry.date)

    // Split hours into buckets based on daily threshold
    const { regular, overtime, doubleTime } = splitHoursBuckets(
      totalHours,
      dailyThreshold,
      doubleOtThreshold,
    )

    totalRegularHours += regular
    totalOvertimeHours += overtime
    totalDoubleTimeHours += doubleTime

    // Build description
    const parts: string[] = [`${regular.toFixed(1)}h regular`]
    if (overtime > 0) parts.push(`${overtime.toFixed(1)}h OT @${otMultiplier}x`)
    if (doubleTime > 0) parts.push(`${doubleTime.toFixed(1)}h DT @${doubleOtMultiplier}x`)

    breakdown.push({
      date: entry.date,
      regularHours: regular,
      overtimeHours: overtime,
      doubleTimeHours: doubleTime,
      totalHours,
      status: entry.status,
      description: parts.join(' + '),
    })
  }

  // Calculate pay amounts (all in cents)
  const regularPay = Math.round(totalRegularHours * hourlyRate)
  const overtimePay = Math.round(totalOvertimeHours * hourlyRate * otMultiplier)
  const doubleTimePay = Math.round(totalDoubleTimeHours * hourlyRate * doubleOtMultiplier)
  const totalTimesheetPay = regularPay + overtimePay + doubleTimePay

  // Compute working days in period for attendance rate
  const daysInPeriod = countBusinessDays(periodStart, periodEnd)
  const daysWorked = datesWorked.size
  const attendanceRate = daysInPeriod > 0 ? Math.min(1, daysWorked / daysInPeriod) : 0

  return {
    employeeId: entries[0]?.employee_id || '',
    periodStart,
    periodEnd,
    totalRegularHours: round2(totalRegularHours),
    totalOvertimeHours: round2(totalOvertimeHours),
    totalDoubleTimeHours: round2(totalDoubleTimeHours),
    totalHours: round2(totalRegularHours + totalOvertimeHours + totalDoubleTimeHours),
    regularPay,
    overtimePay,
    doubleTimePay,
    totalTimesheetPay,
    overtimeMultiplier: otMultiplier,
    doubleTimeMultiplier: doubleOtMultiplier,
    daysWorked,
    daysInPeriod,
    attendanceRate: round2(attendanceRate),
    approvedEntries,
    pendingEntries,
    rejectedEntries,
    breakdown,
  }
}

/**
 * Aggregate time entries by employee for a given pay period.
 *
 * Groups all time entries by employee ID, calculates totals for each employee,
 * and returns a per-employee summary suitable for payroll review.
 *
 * @param entries - All time entries for the period (across all employees)
 * @param periodStart - Start of pay period (YYYY-MM-DD)
 * @param periodEnd - End of pay period (YYYY-MM-DD)
 * @param countryCode - ISO country code for overtime threshold lookup
 * @param overtimeRule - Optional explicit overtime rule
 */
export function aggregateTimesheetsByEmployee(
  entries: TimeEntry[],
  periodStart: string,
  periodEnd: string,
  countryCode: string,
  overtimeRule?: OvertimeRule | null,
): EmployeeTimeSummary[] {
  const { dailyThreshold, doubleOtThreshold } =
    resolveOvertimeConfig(countryCode, overtimeRule)

  // Filter to period
  const periodEntries = filterEntriesForPeriod(entries, periodStart, periodEnd)

  // Group by employee
  const grouped = new Map<string, TimeEntry[]>()
  for (const entry of periodEntries) {
    const existing = grouped.get(entry.employee_id) || []
    existing.push(entry)
    grouped.set(entry.employee_id, existing)
  }

  const daysInPeriod = countBusinessDays(periodStart, periodEnd)
  const summaries: EmployeeTimeSummary[] = []

  for (const [employeeId, empEntries] of grouped) {
    let totalHours = 0
    let regularHours = 0
    let overtimeHours = 0
    let doubleTimeHours = 0
    let approvedEntries = 0
    let pendingEntries = 0
    let rejectedEntries = 0
    let latestEntry: string | null = null
    const datesWorked = new Set<string>()

    for (const entry of empEntries) {
      if (entry.status === 'approved') approvedEntries++
      else if (entry.status === 'pending') pendingEntries++
      else if (entry.status === 'rejected') rejectedEntries++

      // Skip rejected from hour totals
      if (entry.status === 'rejected') continue

      const hours = entry.total_hours || 0
      if (hours <= 0) continue

      totalHours += hours
      datesWorked.add(entry.date)

      const buckets = splitHoursBuckets(hours, dailyThreshold, doubleOtThreshold)
      regularHours += buckets.regular
      overtimeHours += buckets.overtime
      doubleTimeHours += buckets.doubleTime

      if (!latestEntry || entry.date > latestEntry) {
        latestEntry = entry.date
      }
    }

    const daysWorkedCount = datesWorked.size
    const attendanceRate = daysInPeriod > 0 ? Math.min(1, daysWorkedCount / daysInPeriod) : 0
    const averageDailyHours = daysWorkedCount > 0 ? totalHours / daysWorkedCount : 0

    summaries.push({
      employeeId,
      totalHours: round2(totalHours),
      regularHours: round2(regularHours),
      overtimeHours: round2(overtimeHours),
      doubleTimeHours: round2(doubleTimeHours),
      daysWorked: daysWorkedCount,
      daysInPeriod,
      attendanceRate: round2(attendanceRate),
      averageDailyHours: round2(averageDailyHours),
      approvedEntries,
      pendingEntries,
      rejectedEntries,
      latestEntry,
    })
  }

  // Sort by employee ID for deterministic output
  summaries.sort((a, b) => a.employeeId.localeCompare(b.employeeId))

  return summaries
}

/**
 * Validate that timesheets are complete and approved for payroll processing.
 *
 * Checks all listed employees have time entries for each business day in the
 * pay period, flags unapproved entries, identifies gaps and anomalies.
 *
 * @param entries - All time entries for the period
 * @param employeeIds - List of employee IDs expected to have timesheets
 * @param periodStart - Start of pay period (YYYY-MM-DD)
 * @param periodEnd - End of pay period (YYYY-MM-DD)
 * @param countryCode - ISO country code (for max-hours checks)
 */
export function validateTimesheetsForPayroll(
  entries: TimeEntry[],
  employeeIds: string[],
  periodStart: string,
  periodEnd: string,
  countryCode?: string,
): TimesheetValidationResult {
  const periodEntries = filterEntriesForPeriod(entries, periodStart, periodEnd)
  const businessDays = getBusinessDaysInRange(periodStart, periodEnd)
  const maxDailyHours = STANDARD_DAILY_HOURS[countryCode || ''] || DEFAULT_DAILY_THRESHOLD
  const employeeResults: EmployeeValidationResult[] = []
  let totalErrors = 0
  let totalWarnings = 0

  // Group entries by employee
  const grouped = new Map<string, TimeEntry[]>()
  for (const entry of periodEntries) {
    const existing = grouped.get(entry.employee_id) || []
    existing.push(entry)
    grouped.set(entry.employee_id, existing)
  }

  for (const employeeId of employeeIds) {
    const empEntries = grouped.get(employeeId) || []
    const errors: TimesheetValidationIssue[] = []
    const warnings: TimesheetValidationIssue[] = []

    if (empEntries.length === 0) {
      errors.push({
        type: 'no_entries',
        severity: 'error',
        description: `No time entries found for employee ${employeeId} in period ${periodStart} to ${periodEnd}`,
      })
    } else {
      // Check for unapproved entries
      const unapproved = empEntries.filter(e => e.status === 'pending')
      if (unapproved.length > 0) {
        errors.push({
          type: 'unapproved_entry',
          severity: 'error',
          description: `${unapproved.length} unapproved time ${unapproved.length === 1 ? 'entry' : 'entries'} — all entries must be approved before payroll`,
        })
      }

      // Check for incomplete entries (no clock-out)
      const incomplete = empEntries.filter(e => !e.clock_out && e.status !== 'rejected')
      for (const entry of incomplete) {
        warnings.push({
          type: 'incomplete_entry',
          severity: 'warning',
          date: entry.date,
          description: `Missing clock-out on ${entry.date}`,
        })
      }

      // Check for missing days (gaps)
      const entryDates = new Set(empEntries.filter(e => e.status !== 'rejected').map(e => e.date))
      const missingDays = businessDays.filter(d => !entryDates.has(d))
      if (missingDays.length > 0 && missingDays.length <= 5) {
        // Individual missing day warnings
        for (const day of missingDays) {
          warnings.push({
            type: 'missing_timesheet',
            severity: 'warning',
            date: day,
            description: `No time entry for ${day} — may be leave or missing clock-in`,
          })
        }
      } else if (missingDays.length > 5) {
        // Summarize if too many gaps
        warnings.push({
          type: 'gap_detected',
          severity: 'warning',
          description: `${missingDays.length} business days without time entries — verify against leave records`,
        })
      }

      // Check for excessive hours
      for (const entry of empEntries) {
        if (entry.status === 'rejected') continue
        const hours = entry.total_hours || 0
        if (hours > MAX_VALID_DAILY_HOURS) {
          errors.push({
            type: 'excessive_hours',
            severity: 'error',
            date: entry.date,
            description: `${hours.toFixed(1)}h recorded on ${entry.date} exceeds maximum valid daily hours (${MAX_VALID_DAILY_HOURS}h)`,
          })
        } else if (hours > maxDailyHours * 1.5) {
          warnings.push({
            type: 'excessive_hours',
            severity: 'warning',
            date: entry.date,
            description: `${hours.toFixed(1)}h recorded on ${entry.date} is unusually high (standard: ${maxDailyHours}h)`,
          })
        }
      }
    }

    totalErrors += errors.length
    totalWarnings += warnings.length

    employeeResults.push({
      employeeId,
      isValid: errors.length === 0,
      errors,
      warnings,
    })
  }

  const isValid = totalErrors === 0
  const summary = isValid
    ? `All ${employeeIds.length} employees have valid timesheets for ${periodStart} to ${periodEnd}`
    : `${totalErrors} error${totalErrors === 1 ? '' : 's'} and ${totalWarnings} warning${totalWarnings === 1 ? '' : 's'} found across ${employeeIds.length} employees`

  return {
    isValid,
    employeeResults,
    totalErrors,
    totalWarnings,
    summary,
  }
}

// ============================================================
// UTILITY / HELPER FUNCTIONS
// ============================================================

/**
 * Derive hourly rate from monthly gross salary in cents.
 *
 * @param monthlyGross - Monthly gross salary in cents
 * @param countryCode - ISO country code
 * @returns Hourly rate in cents
 */
export function deriveHourlyRate(monthlyGross: number, countryCode: string): number {
  const workingDays = WORKING_DAYS_PER_MONTH[countryCode] || 22
  const dailyHours = STANDARD_DAILY_HOURS[countryCode] || 8
  return Math.round(monthlyGross / (workingDays * dailyHours))
}

/**
 * Get standard daily hours for a country.
 */
export function getStandardDailyHours(countryCode: string): number {
  return STANDARD_DAILY_HOURS[countryCode] || 8
}

/**
 * Get working days per month for a country.
 */
export function getWorkingDaysPerMonth(countryCode: string): number {
  return WORKING_DAYS_PER_MONTH[countryCode] || 22
}

// ============================================================
// INTERNAL HELPERS
// ============================================================

/**
 * Resolve overtime configuration from an explicit rule or country defaults.
 */
function resolveOvertimeConfig(
  countryCode: string,
  overtimeRule?: OvertimeRule | null,
): {
  dailyThreshold: number
  weeklyThreshold: number
  otMultiplier: number
  doubleOtThreshold: number | null
  doubleOtMultiplier: number
} {
  if (overtimeRule && overtimeRule.is_active) {
    return {
      dailyThreshold: overtimeRule.daily_threshold_hours,
      weeklyThreshold: overtimeRule.weekly_threshold_hours,
      otMultiplier: overtimeRule.multiplier,
      doubleOtThreshold: overtimeRule.double_overtime_threshold,
      doubleOtMultiplier: overtimeRule.double_overtime_multiplier || DEFAULT_DOUBLE_OT_MULTIPLIER,
    }
  }

  // Fall back to labor law registry
  const laborRules = getOvertimeRules(countryCode)
  if (laborRules) {
    return {
      dailyThreshold: laborRules.standardWeeklyHours / 5, // derive daily from weekly
      weeklyThreshold: laborRules.standardWeeklyHours,
      otMultiplier: laborRules.overtimeMultiplier,
      doubleOtThreshold: laborRules.tier2ThresholdHours
        ? laborRules.tier2ThresholdHours / 5 // derive daily threshold for tier 2
        : null,
      doubleOtMultiplier: laborRules.overtimeMultiplierTier2 || DEFAULT_DOUBLE_OT_MULTIPLIER,
    }
  }

  // Absolute fallback
  return {
    dailyThreshold: DEFAULT_DAILY_THRESHOLD,
    weeklyThreshold: DEFAULT_WEEKLY_THRESHOLD,
    otMultiplier: DEFAULT_OT_MULTIPLIER,
    doubleOtThreshold: null,
    doubleOtMultiplier: DEFAULT_DOUBLE_OT_MULTIPLIER,
  }
}

/**
 * Split total daily hours into regular, overtime, and double-time buckets.
 */
function splitHoursBuckets(
  totalHours: number,
  dailyThreshold: number,
  doubleOtThreshold: number | null,
): { regular: number; overtime: number; doubleTime: number } {
  if (totalHours <= dailyThreshold) {
    return { regular: totalHours, overtime: 0, doubleTime: 0 }
  }

  const regular = dailyThreshold
  const excessHours = totalHours - dailyThreshold

  if (doubleOtThreshold != null && totalHours > doubleOtThreshold) {
    // Hours beyond double-time threshold are at 2x, remaining excess at 1.5x
    const doubleTime = totalHours - doubleOtThreshold
    const overtime = doubleOtThreshold - dailyThreshold
    return { regular, overtime: Math.max(0, overtime), doubleTime: Math.max(0, doubleTime) }
  }

  return { regular, overtime: excessHours, doubleTime: 0 }
}

/**
 * Filter entries to only those whose date falls within [periodStart, periodEnd].
 */
function filterEntriesForPeriod(
  entries: TimeEntry[],
  periodStart: string,
  periodEnd: string,
): TimeEntry[] {
  return entries.filter(e => e.date >= periodStart && e.date <= periodEnd)
}

/**
 * Count business days (Mon-Fri) between two dates inclusive.
 */
function countBusinessDays(startDate: string, endDate: string): number {
  const days = getBusinessDaysInRange(startDate, endDate)
  return days.length
}

/**
 * Get all business day dates (Mon-Fri) in a date range as YYYY-MM-DD strings.
 */
function getBusinessDaysInRange(startDate: string, endDate: string): string[] {
  const result: string[] = []
  const current = new Date(startDate + 'T00:00:00')
  const end = new Date(endDate + 'T00:00:00')

  while (current <= end) {
    const dayOfWeek = current.getDay()
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      result.push(current.toISOString().split('T')[0])
    }
    current.setDate(current.getDate() + 1)
  }

  return result
}

/**
 * Round a number to 2 decimal places.
 */
function round2(n: number): number {
  return Math.round(n * 100) / 100
}
