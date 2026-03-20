/**
 * Workers' Comp → Time Integration
 *
 * When a workers' comp claim is filed:
 * - Flag employee's schedule for restricted/modified duty
 * - Create time entry restrictions (max hours, no overtime)
 * - Set return-to-work date tracking
 *
 * All integrations are event-driven via the cross-module event bus.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Work restriction to apply to time entries */
export interface WorkRestriction {
  employee_id: string
  claim_id: string
  restriction_type: 'light_duty' | 'modified_schedule' | 'no_work'
  max_hours_per_day: number
  max_hours_per_week: number
  overtime_allowed: boolean
  start_date: string
  expected_end_date: string | null
  notes: string
}

/** Modified schedule entry */
export interface ModifiedScheduleEntry {
  employee_id: string
  date: string
  max_hours: number
  restriction_type: 'light_duty' | 'modified_schedule' | 'no_work'
  notes: string
}

/** Result of applying work restrictions */
export interface WorkRestrictionResult {
  employeeId: string
  claimId: string
  restriction: WorkRestriction
  scheduleEntries: ModifiedScheduleEntry[]
  daysAffected: number
  originalMaxHours: number
  newMaxHours: number
}

/** Store slice needed for workers' comp → time operations */
export interface WorkersCompTimeStoreSlice {
  employees: Array<{ id: string; profile?: { full_name: string } }>
  timeEntries: Array<Record<string, unknown>>
  workersCompClaims: Array<Record<string, unknown>>
  addTimeEntry?: (data: Record<string, unknown>) => void
  updateTimeEntry?: (id: string, data: Record<string, unknown>) => void
  addToast?: (toast: { type: string; title: string; description?: string }) => void
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_WORK_HOURS_PER_DAY = 8
const DEFAULT_WORK_HOURS_PER_WEEK = 40
const DEFAULT_RESTRICTION_WEEKS = 4 // default restriction period if no return date

const RESTRICTION_HOURS: Record<string, { daily: number; weekly: number }> = {
  light_duty: { daily: 6, weekly: 30 },
  modified_schedule: { daily: 4, weekly: 20 },
  no_work: { daily: 0, weekly: 0 },
}

// ---------------------------------------------------------------------------
// Core Functions
// ---------------------------------------------------------------------------

/**
 * Apply work restrictions based on a workers' comp claim.
 *
 * @param employeeId       - Employee with the claim
 * @param claimId          - Workers' comp claim ID
 * @param injuryDate       - Date of the injury
 * @param restrictionType  - Type of work restriction
 * @param maxHoursPerDay   - Optional max hours per day override
 * @param expectedReturnDate - Expected return-to-work date
 * @returns Work restriction result with schedule entries
 */
export function applyWorkRestrictions(
  employeeId: string,
  claimId: string,
  injuryDate: string,
  restrictionType: 'light_duty' | 'modified_schedule' | 'no_work' = 'light_duty',
  maxHoursPerDay?: number,
  expectedReturnDate?: string,
): WorkRestrictionResult {
  const hours = RESTRICTION_HOURS[restrictionType]
  const dailyMax = maxHoursPerDay ?? hours.daily
  const weeklyMax = Math.min(dailyMax * 5, hours.weekly)

  // Calculate restriction period
  const startDate = injuryDate
  let endDate: string | null = expectedReturnDate || null
  if (!endDate) {
    const end = new Date(injuryDate)
    end.setDate(end.getDate() + DEFAULT_RESTRICTION_WEEKS * 7)
    endDate = end.toISOString().split('T')[0]
  }

  const restriction: WorkRestriction = {
    employee_id: employeeId,
    claim_id: claimId,
    restriction_type: restrictionType,
    max_hours_per_day: dailyMax,
    max_hours_per_week: weeklyMax,
    overtime_allowed: false,
    start_date: startDate,
    expected_end_date: endDate,
    notes: `Work restriction applied due to workers' comp claim ${claimId}. ` +
      `Type: ${restrictionType}, max ${dailyMax}h/day, ${weeklyMax}h/week. ` +
      `No overtime allowed.`,
  }

  // Generate modified schedule entries for the restriction period
  const scheduleEntries = generateModifiedSchedule(
    employeeId,
    startDate,
    endDate,
    dailyMax,
    restrictionType,
  )

  return {
    employeeId,
    claimId,
    restriction,
    scheduleEntries,
    daysAffected: scheduleEntries.length,
    originalMaxHours: DEFAULT_WORK_HOURS_PER_DAY,
    newMaxHours: dailyMax,
  }
}

/**
 * Generate a modified schedule for an employee during a restriction period.
 * Only includes weekdays (Mon-Fri).
 *
 * @param employeeId     - Employee ID
 * @param startDate      - Start of restriction period
 * @param endDate        - End of restriction period
 * @param maxHoursPerDay - Max hours allowed per day
 * @param restrictionType - Type of restriction
 * @returns Array of modified schedule entries
 */
export function generateModifiedSchedule(
  employeeId: string,
  startDate: string,
  endDate: string,
  maxHoursPerDay: number,
  restrictionType: 'light_duty' | 'modified_schedule' | 'no_work',
): ModifiedScheduleEntry[] {
  const entries: ModifiedScheduleEntry[] = []
  const start = new Date(startDate)
  const end = new Date(endDate)

  // Cap at 90 days to prevent excessive entries
  const maxDays = 90
  let dayCount = 0

  const current = new Date(start)
  while (current <= end && dayCount < maxDays) {
    const dayOfWeek = current.getDay()
    // Only weekdays (Mon=1 to Fri=5)
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      entries.push({
        employee_id: employeeId,
        date: current.toISOString().split('T')[0],
        max_hours: maxHoursPerDay,
        restriction_type: restrictionType,
        notes: restrictionType === 'no_work'
          ? 'Employee on workers\' comp leave — no work allowed'
          : `Modified duty: max ${maxHoursPerDay} hours`,
      })
    }
    current.setDate(current.getDate() + 1)
    dayCount++
  }

  return entries
}
