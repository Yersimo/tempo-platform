/**
 * Geofencing → Time Integration
 *
 * When geofence events occur:
 * - Auto clock-in when employee enters office geofence
 * - Auto clock-out when leaving
 * - Handle edge cases (quick exits, lunch breaks)
 * - Calculate time from geofence events
 *
 * All integrations are event-driven via the cross-module event bus.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Geofence event as received */
export interface GeofenceEvent {
  employee_id: string
  zone_id: string
  zone_name: string
  event_type: 'enter' | 'exit'
  timestamp: string
}

/** Time entry generated from geofence events */
export interface GeofenceTimeEntry {
  employee_id: string
  date: string
  clock_in: string
  clock_out: string | null
  total_hours: number
  source: 'geofence'
  zone_id: string
  zone_name: string
  auto_generated: boolean
  needs_review: boolean
  review_reason?: string
}

/** Result of processing a geofence event */
export interface GeofenceProcessResult {
  action: 'clock_in' | 'clock_out' | 'ignored'
  reason: string
  timeEntry?: GeofenceTimeEntry
  hoursLogged?: number
}

/** Result of reconciling geofence with time entries */
export interface GeofenceReconciliationResult {
  employeeId: string
  date: string
  geofenceHours: number
  manualHours: number
  discrepancyHours: number
  status: 'matched' | 'discrepancy' | 'missing_geofence' | 'missing_manual'
  recommendation: string
}

/** Store slice needed for geofencing→time operations */
export interface GeofencingTimeStoreSlice {
  employees: Array<{ id: string; profile?: { full_name: string } }>
  timeEntries: Array<Record<string, unknown>>
  geofenceEvents: Array<Record<string, unknown>>
  geofenceZones: Array<Record<string, unknown>>
  addTimeEntry?: (data: Record<string, unknown>) => void
  updateTimeEntry?: (id: string, data: Record<string, unknown>) => void
  addGeofenceEvent?: (data: Record<string, unknown>) => void
  addToast?: (toast: { type: string; title: string; description?: string }) => void
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Minimum minutes to consider a valid clock-in (avoids quick pass-throughs) */
const MIN_VISIT_MINUTES = 5

/** Maximum hours in a single shift (flag for review if exceeded) */
const MAX_SHIFT_HOURS = 14

/** Lunch break threshold — exit/re-enter within this window counts as lunch */
const LUNCH_BREAK_MAX_MINUTES = 90

// ---------------------------------------------------------------------------
// Core Functions
// ---------------------------------------------------------------------------

/**
 * Process a geofence event (enter/exit) and generate clock-in/out actions.
 *
 * @param event          - The geofence event to process
 * @param recentEvents   - Recent geofence events for this employee (same day)
 * @param existingEntries - Existing time entries for this employee (same day)
 * @returns Processing result with action taken
 */
export function processGeofenceEvent(
  event: GeofenceEvent,
  recentEvents: GeofenceEvent[],
  existingEntries: GeofenceTimeEntry[],
): GeofenceProcessResult {
  const eventDate = event.timestamp.split('T')[0]

  if (event.event_type === 'enter') {
    // Check if there's already an active (unclosed) time entry for today
    const activeEntry = existingEntries.find(
      e => e.date === eventDate && e.clock_out === null && e.source === 'geofence',
    )

    if (activeEntry) {
      // Check if this is a return from lunch break
      const lastExit = [...recentEvents]
        .filter(e => e.event_type === 'exit')
        .sort((a, b) => b.timestamp.localeCompare(a.timestamp))[0]

      if (lastExit) {
        const exitTime = new Date(lastExit.timestamp).getTime()
        const enterTime = new Date(event.timestamp).getTime()
        const minutesAway = (enterTime - exitTime) / (1000 * 60)

        if (minutesAway <= LUNCH_BREAK_MAX_MINUTES) {
          return {
            action: 'ignored',
            reason: `Returned after ${Math.round(minutesAway)} minutes (lunch break). Active entry maintained.`,
          }
        }
      }

      return {
        action: 'ignored',
        reason: 'Active time entry already exists. Ignoring duplicate entry.',
      }
    }

    // Create clock-in
    const timeEntry: GeofenceTimeEntry = {
      employee_id: event.employee_id,
      date: eventDate,
      clock_in: event.timestamp,
      clock_out: null,
      total_hours: 0,
      source: 'geofence',
      zone_id: event.zone_id,
      zone_name: event.zone_name,
      auto_generated: true,
      needs_review: false,
    }

    return {
      action: 'clock_in',
      reason: `Auto clock-in at ${event.zone_name}`,
      timeEntry,
    }
  }

  // Exit event — find the active entry to clock out
  const activeEntry = existingEntries.find(
    e => e.date === eventDate && e.clock_out === null && e.source === 'geofence',
  )

  if (!activeEntry) {
    return {
      action: 'ignored',
      reason: 'No active clock-in found. Exit event ignored.',
    }
  }

  // Calculate duration
  const clockInTime = new Date(activeEntry.clock_in).getTime()
  const clockOutTime = new Date(event.timestamp).getTime()
  const durationMinutes = (clockOutTime - clockInTime) / (1000 * 60)
  const durationHours = Math.round((durationMinutes / 60) * 100) / 100

  // Check for quick exit (less than minimum visit)
  if (durationMinutes < MIN_VISIT_MINUTES) {
    return {
      action: 'ignored',
      reason: `Visit less than ${MIN_VISIT_MINUTES} minutes (${Math.round(durationMinutes)}m). Likely a pass-through.`,
    }
  }

  // Flag long shifts for review
  let needsReview = false
  let reviewReason: string | undefined

  if (durationHours > MAX_SHIFT_HOURS) {
    needsReview = true
    reviewReason = `Shift exceeds ${MAX_SHIFT_HOURS} hours (${durationHours}h). May indicate forgotten clock-out.`
  }

  const completedEntry: GeofenceTimeEntry = {
    ...activeEntry,
    clock_out: event.timestamp,
    total_hours: durationHours,
    needs_review: needsReview,
    review_reason: reviewReason,
  }

  return {
    action: 'clock_out',
    reason: `Auto clock-out at ${event.zone_name} after ${durationHours}h`,
    timeEntry: completedEntry,
    hoursLogged: durationHours,
  }
}

/**
 * Reconcile geofence-derived time entries with manually-entered time entries.
 *
 * @param employeeId     - Employee to reconcile
 * @param date           - Date to reconcile
 * @param geofenceEntries - Time entries derived from geofence
 * @param manualEntries  - Manually-entered time entries
 * @returns Reconciliation result
 */
export function reconcileGeofenceWithTimeEntries(
  employeeId: string,
  date: string,
  geofenceEntries: GeofenceTimeEntry[],
  manualEntries: Array<Record<string, unknown>>,
): GeofenceReconciliationResult {
  const geofenceHours = geofenceEntries.reduce((sum, e) => sum + e.total_hours, 0)
  const manualHours = manualEntries.reduce((sum, e) => {
    const hours = typeof (e as Record<string, unknown>).hours === 'number'
      ? (e as Record<string, unknown>).hours as number
      : typeof (e as Record<string, unknown>).total_hours === 'number'
        ? (e as Record<string, unknown>).total_hours as number
        : 0
    return sum + hours
  }, 0)

  const discrepancy = Math.abs(geofenceHours - manualHours)
  const roundedDiscrepancy = Math.round(discrepancy * 100) / 100

  if (geofenceEntries.length === 0 && manualEntries.length === 0) {
    return {
      employeeId,
      date,
      geofenceHours: 0,
      manualHours: 0,
      discrepancyHours: 0,
      status: 'matched',
      recommendation: 'No entries for this date.',
    }
  }

  if (geofenceEntries.length === 0) {
    return {
      employeeId,
      date,
      geofenceHours: 0,
      manualHours,
      discrepancyHours: manualHours,
      status: 'missing_geofence',
      recommendation: `Employee logged ${manualHours}h manually but no geofence data detected. May be working remotely.`,
    }
  }

  if (manualEntries.length === 0) {
    return {
      employeeId,
      date,
      geofenceHours,
      manualHours: 0,
      discrepancyHours: geofenceHours,
      status: 'missing_manual',
      recommendation: `Geofence detected ${geofenceHours}h on-site but no manual time entries. Consider auto-creating entries.`,
    }
  }

  if (roundedDiscrepancy <= 0.5) {
    return {
      employeeId,
      date,
      geofenceHours,
      manualHours,
      discrepancyHours: roundedDiscrepancy,
      status: 'matched',
      recommendation: 'Geofence and manual time entries are aligned.',
    }
  }

  return {
    employeeId,
    date,
    geofenceHours,
    manualHours,
    discrepancyHours: roundedDiscrepancy,
    status: 'discrepancy',
    recommendation: `Discrepancy of ${roundedDiscrepancy}h between geofence (${geofenceHours}h) and manual (${manualHours}h) entries. Review required.`,
  }
}
