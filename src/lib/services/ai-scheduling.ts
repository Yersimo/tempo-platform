import { db, schema, withRetry } from '@/lib/db'
import { eq, and, gte, lte, sql, count, sum, desc, ne, inArray } from 'drizzle-orm'

// ============================================================================
// Types
// ============================================================================

export interface DemandForecast {
  date: string
  dayOfWeek: number
  dayName: string
  predictedHeadcount: number
  predictedHours: number
  confidence: number
  departmentBreakdown: { department: string; headcount: number; hours: number }[]
}

export interface ScheduleConstraints {
  maxDailyHours?: number
  maxWeeklyHours?: number
  minRestHoursBetweenShifts?: number
  preferredShiftLength?: number
  employeeIds?: string[]
  roles?: string[]
}

export interface ProposedShift {
  employeeId: string
  employeeName: string
  date: string
  startTime: string
  endTime: string
  breakDuration: number
  role: string | null
  reasoning: string
}

export interface ScheduleConflict {
  type: 'double-booking' | 'overtime-violation' | 'leave-conflict' | 'insufficient-rest'
  severity: 'high' | 'medium' | 'low'
  shiftDate: string
  employeeId: string
  employeeName?: string
  description: string
  suggestion: string
}

export interface SwapCandidate {
  employeeId: string
  employeeName: string
  suitabilityScore: number
  reasons: string[]
  jobTitle: string | null
}

export interface ScheduleInsights {
  coverageScore: number
  costEstimate: { regularHours: number; overtimeHours: number; estimatedCost: number }
  fairnessIndex: number
  riskFactors: string[]
  employeeHoursBreakdown: { employeeId: string; employeeName: string; totalHours: number }[]
}

// ============================================================================
// Helpers
// ============================================================================

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + (m || 0)
}

function shiftDurationHours(startTime: string, endTime: string, breakMinutes: number): number {
  let startMin = parseTimeToMinutes(startTime)
  let endMin = parseTimeToMinutes(endTime)
  if (endMin <= startMin) endMin += 24 * 60 // overnight shift
  return Math.max(0, (endMin - startMin - breakMinutes) / 60)
}

function standardDeviation(values: number[]): number {
  if (values.length === 0) return 0
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const squaredDiffs = values.map((v) => (v - mean) ** 2)
  return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / values.length)
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

// ============================================================================
// 1. Demand Forecasting
// ============================================================================

export async function forecastDemand(
  orgId: string,
  startDate: string,
  endDate: string,
): Promise<DemandForecast[]> {
  // Look at past 90 days of time entries to build a model
  const lookbackStart = addDays(startDate, -90)
  const lookbackEnd = addDays(startDate, -1)

  // Get historical time entries grouped by day of week
  const historicalByDay = await withRetry(() =>
    db
      .select({
        dayOfWeek: sql<number>`EXTRACT(DOW FROM ${schema.timeEntries.date}::date)`,
        avgHours: sql<number>`COALESCE(AVG(${schema.timeEntries.totalHours}), 0)`,
        avgHeadcount: sql<number>`COUNT(DISTINCT ${schema.timeEntries.employeeId})::float / NULLIF(COUNT(DISTINCT ${schema.timeEntries.date}), 0)`,
        totalDays: sql<number>`COUNT(DISTINCT ${schema.timeEntries.date})`,
      })
      .from(schema.timeEntries)
      .where(
        and(
          eq(schema.timeEntries.orgId, orgId),
          gte(schema.timeEntries.date, lookbackStart),
          lte(schema.timeEntries.date, lookbackEnd),
          sql`${schema.timeEntries.totalHours} IS NOT NULL`,
        ),
      )
      .groupBy(sql`EXTRACT(DOW FROM ${schema.timeEntries.date}::date)`),
  )

  // Get department-level breakdown
  const historicalByDayDept = await withRetry(() =>
    db
      .select({
        dayOfWeek: sql<number>`EXTRACT(DOW FROM ${schema.timeEntries.date}::date)`,
        department: schema.departments.name,
        avgHours: sql<number>`COALESCE(AVG(${schema.timeEntries.totalHours}), 0)`,
        avgHeadcount: sql<number>`COUNT(DISTINCT ${schema.timeEntries.employeeId})::float / NULLIF(COUNT(DISTINCT ${schema.timeEntries.date}), 0)`,
      })
      .from(schema.timeEntries)
      .innerJoin(schema.employees, eq(schema.timeEntries.employeeId, schema.employees.id))
      .innerJoin(schema.departments, eq(schema.employees.departmentId, schema.departments.id))
      .where(
        and(
          eq(schema.timeEntries.orgId, orgId),
          gte(schema.timeEntries.date, lookbackStart),
          lte(schema.timeEntries.date, lookbackEnd),
          sql`${schema.timeEntries.totalHours} IS NOT NULL`,
        ),
      )
      .groupBy(sql`EXTRACT(DOW FROM ${schema.timeEntries.date}::date)`, schema.departments.name),
  )

  // Build a map of day-of-week -> stats
  const dayStatsMap = new Map<number, { avgHours: number; avgHeadcount: number; totalDays: number }>()
  for (const row of historicalByDay) {
    dayStatsMap.set(Number(row.dayOfWeek), {
      avgHours: Number(row.avgHours),
      avgHeadcount: Number(row.avgHeadcount),
      totalDays: Number(row.totalDays),
    })
  }

  // Build department breakdown map
  const deptMap = new Map<number, { department: string; headcount: number; hours: number }[]>()
  for (const row of historicalByDayDept) {
    const dow = Number(row.dayOfWeek)
    if (!deptMap.has(dow)) deptMap.set(dow, [])
    deptMap.get(dow)!.push({
      department: row.department,
      headcount: Math.round(Number(row.avgHeadcount)),
      hours: Math.round(Number(row.avgHours) * 10) / 10,
    })
  }

  // Generate forecast for each day in the requested range
  const forecasts: DemandForecast[] = []
  let current = new Date(startDate)
  const end = new Date(endDate)

  while (current <= end) {
    const dateStr = current.toISOString().split('T')[0]
    const dow = current.getDay()
    const stats = dayStatsMap.get(dow)

    // Confidence based on amount of historical data
    const sampleDays = stats?.totalDays ?? 0
    const confidence = Math.min(0.95, Math.max(0.1, sampleDays / 13)) // 13 weeks = 90 days

    forecasts.push({
      date: dateStr,
      dayOfWeek: dow,
      dayName: DAY_NAMES[dow],
      predictedHeadcount: Math.round(stats?.avgHeadcount ?? 0),
      predictedHours: Math.round((stats?.avgHours ?? 0) * 10) / 10,
      confidence: Math.round(confidence * 100) / 100,
      departmentBreakdown: deptMap.get(dow) ?? [],
    })

    current.setDate(current.getDate() + 1)
  }

  return forecasts
}

// ============================================================================
// 2. Auto-Schedule Generation
// ============================================================================

export async function generateOptimalSchedule(
  orgId: string,
  weekStart: string,
  constraints: ScheduleConstraints = {},
): Promise<{ shifts: ProposedShift[]; summary: string }> {
  const {
    maxDailyHours = 8,
    maxWeeklyHours = 40,
    minRestHoursBetweenShifts = 11,
    preferredShiftLength = 8,
    employeeIds,
  } = constraints

  const weekEnd = addDays(weekStart, 6)

  // 1. Get demand forecast for the week
  const forecast = await forecastDemand(orgId, weekStart, weekEnd)

  // 2. Get available employees
  const employeeConditions = [
    eq(schema.employees.orgId, orgId),
    eq(schema.employees.isActive, true),
  ]

  const availableEmployees = await withRetry(() =>
    db
      .select({
        id: schema.employees.id,
        fullName: schema.employees.fullName,
        jobTitle: schema.employees.jobTitle,
        departmentId: schema.employees.departmentId,
      })
      .from(schema.employees)
      .where(and(...employeeConditions)),
  )

  // Filter to requested employee IDs if provided
  const eligibleEmployees = employeeIds
    ? availableEmployees.filter((e) => employeeIds.includes(e.id))
    : availableEmployees

  // 3. Get approved leave for the week
  const leaveRecords = await withRetry(() =>
    db
      .select({
        employeeId: schema.leaveRequests.employeeId,
        startDate: schema.leaveRequests.startDate,
        endDate: schema.leaveRequests.endDate,
      })
      .from(schema.leaveRequests)
      .where(
        and(
          eq(schema.leaveRequests.orgId, orgId),
          eq(schema.leaveRequests.status, 'approved'),
          lte(schema.leaveRequests.startDate, weekEnd),
          gte(schema.leaveRequests.endDate, weekStart),
        ),
      ),
  )

  // Build set of employee+date combos on leave
  const onLeaveSet = new Set<string>()
  for (const leave of leaveRecords) {
    let d = new Date(Math.max(new Date(leave.startDate).getTime(), new Date(weekStart).getTime()))
    const end = new Date(Math.min(new Date(leave.endDate).getTime(), new Date(weekEnd).getTime()))
    while (d <= end) {
      onLeaveSet.add(`${leave.employeeId}:${d.toISOString().split('T')[0]}`)
      d.setDate(d.getDate() + 1)
    }
  }

  // 4. Get existing shifts for the week to avoid double-booking
  const existingShifts = await withRetry(() =>
    db
      .select({
        employeeId: schema.shifts.employeeId,
        date: schema.shifts.date,
        startTime: schema.shifts.startTime,
        endTime: schema.shifts.endTime,
      })
      .from(schema.shifts)
      .where(
        and(
          eq(schema.shifts.orgId, orgId),
          gte(schema.shifts.date, weekStart),
          lte(schema.shifts.date, weekEnd),
          inArray(schema.shifts.status, ['scheduled', 'completed']),
        ),
      ),
  )

  const existingShiftSet = new Set<string>()
  for (const s of existingShifts) {
    existingShiftSet.add(`${s.employeeId}:${s.date}`)
  }

  // 5. Get overtime rules
  const overtimeRules = await withRetry(() =>
    db
      .select()
      .from(schema.overtimeRules)
      .where(and(eq(schema.overtimeRules.orgId, orgId), eq(schema.overtimeRules.isActive, true)))
      .limit(1),
  )

  const dailyThreshold = overtimeRules[0]?.dailyThresholdHours ?? maxDailyHours
  const weeklyThreshold = overtimeRules[0]?.weeklyThresholdHours ?? maxWeeklyHours

  // 6. Build schedule — greedy assignment minimizing overtime
  const proposedShifts: ProposedShift[] = []
  const weeklyHoursTracker = new Map<string, number>() // employeeId -> total hours this week

  // Initialize tracker with existing shifts
  for (const s of existingShifts) {
    const hours = shiftDurationHours(s.startTime, s.endTime, 0)
    weeklyHoursTracker.set(s.employeeId, (weeklyHoursTracker.get(s.employeeId) ?? 0) + hours)
  }

  for (const day of forecast) {
    const neededHeadcount = Math.max(day.predictedHeadcount, 1)
    let assigned = 0

    // Sort employees by fewest weekly hours (fairness) then randomize ties
    const sortedEmployees = [...eligibleEmployees].sort((a, b) => {
      const hoursA = weeklyHoursTracker.get(a.id) ?? 0
      const hoursB = weeklyHoursTracker.get(b.id) ?? 0
      return hoursA - hoursB
    })

    for (const emp of sortedEmployees) {
      if (assigned >= neededHeadcount) break

      const key = `${emp.id}:${day.date}`

      // Skip if on leave
      if (onLeaveSet.has(key)) continue

      // Skip if already scheduled
      if (existingShiftSet.has(key)) continue

      // Check weekly hours cap
      const currentWeeklyHours = weeklyHoursTracker.get(emp.id) ?? 0
      if (currentWeeklyHours + preferredShiftLength > weeklyThreshold) continue

      // Check daily threshold
      const shiftHours = Math.min(preferredShiftLength, dailyThreshold)
      const startHour = 9
      const endHour = startHour + shiftHours + 1 // +1 for break
      const startTime = `${String(startHour).padStart(2, '0')}:00`
      const endTime = `${String(endHour).padStart(2, '0')}:00`

      const reasons: string[] = []
      if (currentWeeklyHours === 0) reasons.push('No hours assigned yet this week')
      else reasons.push(`Current weekly hours: ${currentWeeklyHours}h — room for more`)
      if (!onLeaveSet.has(key)) reasons.push('Not on leave')

      proposedShifts.push({
        employeeId: emp.id,
        employeeName: emp.fullName,
        date: day.date,
        startTime,
        endTime,
        breakDuration: 60,
        role: emp.jobTitle,
        reasoning: reasons.join('; '),
      })

      weeklyHoursTracker.set(emp.id, currentWeeklyHours + shiftHours)
      existingShiftSet.add(key)
      assigned++
    }
  }

  const totalShifts = proposedShifts.length
  const uniqueEmployees = new Set(proposedShifts.map((s) => s.employeeId)).size
  const summary = `Generated ${totalShifts} shifts across ${uniqueEmployees} employees for the week of ${weekStart}. ` +
    `Schedule respects ${weeklyThreshold}h weekly and ${dailyThreshold}h daily limits, ` +
    `approved leave for ${leaveRecords.length} request(s), and ${existingShifts.length} pre-existing shift(s).`

  return { shifts: proposedShifts, summary }
}

// ============================================================================
// 3. Conflict Detection
// ============================================================================

export async function detectScheduleConflicts(
  orgId: string,
  shifts: { employeeId: string; date: string; startTime: string; endTime: string }[],
): Promise<ScheduleConflict[]> {
  if (shifts.length === 0) return []

  const conflicts: ScheduleConflict[] = []

  // Gather unique employee IDs and date range
  const employeeIds = [...new Set(shifts.map((s) => s.employeeId))]
  const dates = shifts.map((s) => s.date)
  const minDate = dates.reduce((a, b) => (a < b ? a : b))
  const maxDate = dates.reduce((a, b) => (a > b ? a : b))

  // Get employee names
  const employees = await withRetry(() =>
    db
      .select({ id: schema.employees.id, fullName: schema.employees.fullName })
      .from(schema.employees)
      .where(eq(schema.employees.orgId, orgId)),
  )
  const nameMap = new Map(employees.map((e) => [e.id, e.fullName]))

  // 1. Check double-booking: existing shifts for these employees in the date range
  const existingShifts = await withRetry(() =>
    db
      .select({
        employeeId: schema.shifts.employeeId,
        date: schema.shifts.date,
        startTime: schema.shifts.startTime,
        endTime: schema.shifts.endTime,
      })
      .from(schema.shifts)
      .where(
        and(
          eq(schema.shifts.orgId, orgId),
          gte(schema.shifts.date, minDate),
          lte(schema.shifts.date, maxDate),
          inArray(schema.shifts.status, ['scheduled', 'completed']),
        ),
      ),
  )

  // Build lookup: employeeId:date -> shifts
  const existingMap = new Map<string, { startTime: string; endTime: string }[]>()
  for (const s of existingShifts) {
    const key = `${s.employeeId}:${s.date}`
    if (!existingMap.has(key)) existingMap.set(key, [])
    existingMap.get(key)!.push({ startTime: s.startTime, endTime: s.endTime })
  }

  // Also check within proposed shifts for internal double-booking
  const proposedMap = new Map<string, { startTime: string; endTime: string }[]>()
  for (const s of shifts) {
    const key = `${s.employeeId}:${s.date}`
    if (!proposedMap.has(key)) proposedMap.set(key, [])
    proposedMap.get(key)!.push({ startTime: s.startTime, endTime: s.endTime })
  }

  for (const s of shifts) {
    const key = `${s.employeeId}:${s.date}`
    const existing = existingMap.get(key) ?? []
    for (const ex of existing) {
      // Check time overlap
      const sStart = parseTimeToMinutes(s.startTime)
      const sEnd = parseTimeToMinutes(s.endTime)
      const exStart = parseTimeToMinutes(ex.startTime)
      const exEnd = parseTimeToMinutes(ex.endTime)
      if (sStart < exEnd && sEnd > exStart) {
        conflicts.push({
          type: 'double-booking',
          severity: 'high',
          shiftDate: s.date,
          employeeId: s.employeeId,
          employeeName: nameMap.get(s.employeeId),
          description: `Employee already has a shift from ${ex.startTime} to ${ex.endTime} on ${s.date}`,
          suggestion: `Reschedule to a non-overlapping time or assign a different employee`,
        })
      }
    }

    // Check internal double-booking (multiple proposed shifts same employee same day)
    const proposed = proposedMap.get(key) ?? []
    if (proposed.length > 1) {
      conflicts.push({
        type: 'double-booking',
        severity: 'high',
        shiftDate: s.date,
        employeeId: s.employeeId,
        employeeName: nameMap.get(s.employeeId),
        description: `Employee has ${proposed.length} proposed shifts on ${s.date}`,
        suggestion: `Remove duplicate shifts for this employee on this date`,
      })
    }
  }

  // 2. Check leave conflicts
  const leaveRecords = await withRetry(() =>
    db
      .select({
        employeeId: schema.leaveRequests.employeeId,
        startDate: schema.leaveRequests.startDate,
        endDate: schema.leaveRequests.endDate,
        type: schema.leaveRequests.type,
      })
      .from(schema.leaveRequests)
      .where(
        and(
          eq(schema.leaveRequests.orgId, orgId),
          eq(schema.leaveRequests.status, 'approved'),
          lte(schema.leaveRequests.startDate, maxDate),
          gte(schema.leaveRequests.endDate, minDate),
        ),
      ),
  )

  for (const s of shifts) {
    for (const leave of leaveRecords) {
      if (
        s.employeeId === leave.employeeId &&
        s.date >= leave.startDate &&
        s.date <= leave.endDate
      ) {
        conflicts.push({
          type: 'leave-conflict',
          severity: 'high',
          shiftDate: s.date,
          employeeId: s.employeeId,
          employeeName: nameMap.get(s.employeeId),
          description: `Employee is on approved ${leave.type} leave from ${leave.startDate} to ${leave.endDate}`,
          suggestion: `Remove this shift or find a replacement employee`,
        })
      }
    }
  }

  // 3. Check overtime violations
  const overtimeRulesResult = await withRetry(() =>
    db
      .select()
      .from(schema.overtimeRules)
      .where(and(eq(schema.overtimeRules.orgId, orgId), eq(schema.overtimeRules.isActive, true)))
      .limit(1),
  )

  const dailyThreshold = overtimeRulesResult[0]?.dailyThresholdHours ?? 8
  const weeklyThreshold = overtimeRulesResult[0]?.weeklyThresholdHours ?? 40

  // Calculate weekly hours per employee (existing + proposed)
  const weeklyHours = new Map<string, number>()
  for (const s of existingShifts) {
    const hours = shiftDurationHours(s.startTime, s.endTime, 0)
    weeklyHours.set(s.employeeId, (weeklyHours.get(s.employeeId) ?? 0) + hours)
  }

  for (const s of shifts) {
    const hours = shiftDurationHours(s.startTime, s.endTime, 0)

    // Daily check
    if (hours > dailyThreshold) {
      conflicts.push({
        type: 'overtime-violation',
        severity: 'medium',
        shiftDate: s.date,
        employeeId: s.employeeId,
        employeeName: nameMap.get(s.employeeId),
        description: `Shift duration (${hours.toFixed(1)}h) exceeds daily threshold of ${dailyThreshold}h`,
        suggestion: `Shorten the shift to ${dailyThreshold}h or split across two employees`,
      })
    }

    // Weekly check
    const currentWeekly = weeklyHours.get(s.employeeId) ?? 0
    const newWeekly = currentWeekly + hours
    if (newWeekly > weeklyThreshold) {
      conflicts.push({
        type: 'overtime-violation',
        severity: 'medium',
        shiftDate: s.date,
        employeeId: s.employeeId,
        employeeName: nameMap.get(s.employeeId),
        description: `Adding this shift brings weekly total to ${newWeekly.toFixed(1)}h, exceeding ${weeklyThreshold}h threshold`,
        suggestion: `Assign to an employee with fewer weekly hours`,
      })
    }
    weeklyHours.set(s.employeeId, newWeekly)
  }

  // 4. Insufficient rest between shifts
  // Combine existing and proposed shifts, sort by employee and date/time
  const allShifts = [
    ...existingShifts.map((s) => ({ ...s, source: 'existing' as const })),
    ...shifts.map((s) => ({ ...s, source: 'proposed' as const })),
  ].sort((a, b) => {
    if (a.employeeId !== b.employeeId) return a.employeeId.localeCompare(b.employeeId)
    if (a.date !== b.date) return a.date.localeCompare(b.date)
    return parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime)
  })

  for (let i = 1; i < allShifts.length; i++) {
    const prev = allShifts[i - 1]
    const curr = allShifts[i]
    if (prev.employeeId !== curr.employeeId) continue

    // Calculate gap between end of previous shift and start of current
    const prevEndDate = new Date(prev.date)
    const prevEndMin = parseTimeToMinutes(prev.endTime)
    const prevEndMs = prevEndDate.getTime() + prevEndMin * 60 * 1000

    const currStartDate = new Date(curr.date)
    const currStartMin = parseTimeToMinutes(curr.startTime)
    const currStartMs = currStartDate.getTime() + currStartMin * 60 * 1000

    const gapHours = (currStartMs - prevEndMs) / (1000 * 60 * 60)

    if (gapHours >= 0 && gapHours < 11) {
      // Only flag if the current shift is a proposed one
      if (curr.source === 'proposed') {
        conflicts.push({
          type: 'insufficient-rest',
          severity: 'medium',
          shiftDate: curr.date,
          employeeId: curr.employeeId,
          employeeName: nameMap.get(curr.employeeId),
          description: `Only ${gapHours.toFixed(1)}h rest between shifts (previous ends ${prev.endTime} on ${prev.date}, next starts ${curr.startTime} on ${curr.date})`,
          suggestion: `Ensure at least 11 hours between consecutive shifts`,
        })
      }
    }
  }

  // Deduplicate conflicts (same type + employee + date)
  const seen = new Set<string>()
  return conflicts.filter((c) => {
    const key = `${c.type}:${c.employeeId}:${c.shiftDate}:${c.description}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

// ============================================================================
// 4. Shift Swap Recommendations
// ============================================================================

export async function suggestShiftSwaps(
  orgId: string,
  shiftId: string,
): Promise<{ shift: { id: string; employeeId: string; date: string; startTime: string; endTime: string; role: string | null }; candidates: SwapCandidate[] }> {
  // Get the shift to swap
  const [targetShift] = await withRetry(() =>
    db
      .select({
        id: schema.shifts.id,
        employeeId: schema.shifts.employeeId,
        date: schema.shifts.date,
        startTime: schema.shifts.startTime,
        endTime: schema.shifts.endTime,
        role: schema.shifts.role,
        breakDuration: schema.shifts.breakDuration,
      })
      .from(schema.shifts)
      .where(and(eq(schema.shifts.id, shiftId), eq(schema.shifts.orgId, orgId)))
      .limit(1),
  )

  if (!targetShift) {
    throw new Error(`Shift ${shiftId} not found`)
  }

  // Get all active employees in the org (excluding current shift holder)
  const employees = await withRetry(() =>
    db
      .select({
        id: schema.employees.id,
        fullName: schema.employees.fullName,
        jobTitle: schema.employees.jobTitle,
        role: schema.employees.role,
      })
      .from(schema.employees)
      .where(
        and(
          eq(schema.employees.orgId, orgId),
          eq(schema.employees.isActive, true),
          ne(schema.employees.id, targetShift.employeeId),
        ),
      ),
  )

  // Get shifts on the target date (to exclude already-scheduled employees)
  const sameDayShifts = await withRetry(() =>
    db
      .select({ employeeId: schema.shifts.employeeId })
      .from(schema.shifts)
      .where(
        and(
          eq(schema.shifts.orgId, orgId),
          eq(schema.shifts.date, targetShift.date),
          inArray(schema.shifts.status, ['scheduled', 'completed']),
          ne(schema.shifts.id, shiftId),
        ),
      ),
  )
  const scheduledOnDay = new Set(sameDayShifts.map((s) => s.employeeId))

  // Get employees on leave on the target date
  const leaveOnDay = await withRetry(() =>
    db
      .select({ employeeId: schema.leaveRequests.employeeId })
      .from(schema.leaveRequests)
      .where(
        and(
          eq(schema.leaveRequests.orgId, orgId),
          eq(schema.leaveRequests.status, 'approved'),
          lte(schema.leaveRequests.startDate, targetShift.date),
          gte(schema.leaveRequests.endDate, targetShift.date),
        ),
      ),
  )
  const onLeaveSet = new Set(leaveOnDay.map((l) => l.employeeId))

  // Get weekly hours for each employee (week containing the shift date)
  const shiftDate = new Date(targetShift.date)
  const dow = shiftDate.getDay()
  const weekStartOffset = dow === 0 ? 6 : dow - 1
  const weekStartDate = addDays(targetShift.date, -weekStartOffset)
  const weekEndDate = addDays(weekStartDate, 6)

  const weeklyShifts = await withRetry(() =>
    db
      .select({
        employeeId: schema.shifts.employeeId,
        totalHours: sql<number>`SUM(
          CASE
            WHEN (${schema.shifts.endTime})::time > (${schema.shifts.startTime})::time
            THEN EXTRACT(EPOCH FROM ((${schema.shifts.endTime})::time - (${schema.shifts.startTime})::time)) / 3600 - ${schema.shifts.breakDuration} / 60.0
            ELSE EXTRACT(EPOCH FROM ((${schema.shifts.endTime})::time + interval '24 hours' - (${schema.shifts.startTime})::time)) / 3600 - ${schema.shifts.breakDuration} / 60.0
          END
        )`,
      })
      .from(schema.shifts)
      .where(
        and(
          eq(schema.shifts.orgId, orgId),
          gte(schema.shifts.date, weekStartDate),
          lte(schema.shifts.date, weekEndDate),
          inArray(schema.shifts.status, ['scheduled', 'completed']),
        ),
      )
      .groupBy(schema.shifts.employeeId),
  )

  const weeklyHoursMap = new Map(weeklyShifts.map((w) => [w.employeeId, Number(w.totalHours)]))

  // Get overtime rules
  const overtimeRulesResult = await withRetry(() =>
    db
      .select()
      .from(schema.overtimeRules)
      .where(and(eq(schema.overtimeRules.orgId, orgId), eq(schema.overtimeRules.isActive, true)))
      .limit(1),
  )
  const weeklyThreshold = overtimeRulesResult[0]?.weeklyThresholdHours ?? 40

  const shiftHours = shiftDurationHours(targetShift.startTime, targetShift.endTime, targetShift.breakDuration)

  // Score each candidate
  const candidates: SwapCandidate[] = []

  for (const emp of employees) {
    const reasons: string[] = []
    let score = 50 // base score

    // Disqualifiers
    if (scheduledOnDay.has(emp.id)) continue
    if (onLeaveSet.has(emp.id)) continue

    // Overtime check
    const currentHours = weeklyHoursMap.get(emp.id) ?? 0
    if (currentHours + shiftHours > weeklyThreshold) continue

    reasons.push('Available on this date')

    // Bonus: same role/title match
    if (targetShift.role && emp.jobTitle && emp.jobTitle.toLowerCase().includes(targetShift.role.toLowerCase())) {
      score += 25
      reasons.push(`Role match: ${emp.jobTitle}`)
    }

    // Bonus: fewer weekly hours = more capacity
    const capacityRatio = 1 - currentHours / weeklyThreshold
    score += Math.round(capacityRatio * 20)
    reasons.push(`Weekly hours: ${currentHours.toFixed(1)}h of ${weeklyThreshold}h`)

    // Small bonus for no shifts at all (fresh employee)
    if (currentHours === 0) {
      score += 5
      reasons.push('No shifts this week')
    }

    candidates.push({
      employeeId: emp.id,
      employeeName: emp.fullName,
      suitabilityScore: Math.min(100, score),
      reasons,
      jobTitle: emp.jobTitle,
    })
  }

  // Sort by suitability score descending
  candidates.sort((a, b) => b.suitabilityScore - a.suitabilityScore)

  return {
    shift: {
      id: targetShift.id,
      employeeId: targetShift.employeeId,
      date: targetShift.date,
      startTime: targetShift.startTime,
      endTime: targetShift.endTime,
      role: targetShift.role,
    },
    candidates: candidates.slice(0, 10), // top 10
  }
}

// ============================================================================
// 5. Schedule Analytics / Insights
// ============================================================================

export async function getScheduleInsights(
  orgId: string,
  weekStart: string,
): Promise<ScheduleInsights> {
  const weekEnd = addDays(weekStart, 6)

  // 1. Get all shifts for the week
  const weekShifts = await withRetry(() =>
    db
      .select({
        id: schema.shifts.id,
        employeeId: schema.shifts.employeeId,
        employeeName: schema.employees.fullName,
        date: schema.shifts.date,
        startTime: schema.shifts.startTime,
        endTime: schema.shifts.endTime,
        breakDuration: schema.shifts.breakDuration,
      })
      .from(schema.shifts)
      .innerJoin(schema.employees, eq(schema.shifts.employeeId, schema.employees.id))
      .where(
        and(
          eq(schema.shifts.orgId, orgId),
          gte(schema.shifts.date, weekStart),
          lte(schema.shifts.date, weekEnd),
          inArray(schema.shifts.status, ['scheduled', 'completed']),
        ),
      ),
  )

  // 2. Get demand forecast for coverage comparison
  const forecast = await forecastDemand(orgId, weekStart, weekEnd)

  // 3. Get overtime rules for cost calculation
  const overtimeRulesResult = await withRetry(() =>
    db
      .select()
      .from(schema.overtimeRules)
      .where(and(eq(schema.overtimeRules.orgId, orgId), eq(schema.overtimeRules.isActive, true)))
      .limit(1),
  )

  const dailyThreshold = overtimeRulesResult[0]?.dailyThresholdHours ?? 8
  const weeklyThreshold = overtimeRulesResult[0]?.weeklyThresholdHours ?? 40
  const overtimeMultiplier = overtimeRulesResult[0]?.multiplier ?? 1.5

  // 4. Calculate per-employee hours
  const employeeHoursMap = new Map<string, { name: string; totalHours: number }>()
  const dailyHoursMap = new Map<string, Map<string, number>>() // employeeId -> date -> hours

  for (const shift of weekShifts) {
    const hours = shiftDurationHours(shift.startTime, shift.endTime, shift.breakDuration)

    const existing = employeeHoursMap.get(shift.employeeId) ?? { name: shift.employeeName, totalHours: 0 }
    existing.totalHours += hours
    employeeHoursMap.set(shift.employeeId, existing)

    if (!dailyHoursMap.has(shift.employeeId)) dailyHoursMap.set(shift.employeeId, new Map())
    const empDays = dailyHoursMap.get(shift.employeeId)!
    empDays.set(shift.date, (empDays.get(shift.date) ?? 0) + hours)
  }

  // 5. Coverage score: actual headcount per day vs predicted
  let totalCoverage = 0
  let coverageDays = 0

  // Count actual headcount per day
  const dailyHeadcount = new Map<string, number>()
  for (const shift of weekShifts) {
    dailyHeadcount.set(shift.date, (dailyHeadcount.get(shift.date) ?? 0) + 1)
  }

  for (const day of forecast) {
    if (day.predictedHeadcount > 0) {
      const actual = dailyHeadcount.get(day.date) ?? 0
      totalCoverage += Math.min(1, actual / day.predictedHeadcount)
      coverageDays++
    }
  }

  const coverageScore = coverageDays > 0
    ? Math.round((totalCoverage / coverageDays) * 100)
    : 100

  // 6. Cost estimate
  let regularHours = 0
  let overtimeHours = 0
  const assumedHourlyRate = 25 // base rate in currency units

  for (const [empId, data] of employeeHoursMap) {
    if (data.totalHours <= weeklyThreshold) {
      regularHours += data.totalHours
    } else {
      regularHours += weeklyThreshold
      overtimeHours += data.totalHours - weeklyThreshold
    }

    // Also check daily overtime
    const empDays = dailyHoursMap.get(empId)
    if (empDays) {
      for (const [, dayHours] of empDays) {
        if (dayHours > dailyThreshold) {
          const dailyOT = dayHours - dailyThreshold
          // Shift from regular to overtime (avoid double counting with weekly)
          if (data.totalHours <= weeklyThreshold) {
            regularHours -= dailyOT
            overtimeHours += dailyOT
          }
        }
      }
    }
  }

  regularHours = Math.max(0, regularHours)
  const estimatedCost = Math.round(
    regularHours * assumedHourlyRate + overtimeHours * assumedHourlyRate * overtimeMultiplier,
  )

  // 7. Fairness index (lower std dev = fairer)
  const hoursValues = [...employeeHoursMap.values()].map((v) => v.totalHours)
  const stdDev = standardDeviation(hoursValues)
  const meanHours = hoursValues.length > 0 ? hoursValues.reduce((a, b) => a + b, 0) / hoursValues.length : 0
  // Fairness: 100 = perfectly fair, approaches 0 as std dev grows relative to mean
  const fairnessIndex = meanHours > 0
    ? Math.round(Math.max(0, 100 - (stdDev / meanHours) * 100))
    : 100

  // 8. Risk factors
  const riskFactors: string[] = []

  if (coverageScore < 80) {
    riskFactors.push(`Understaffed: coverage is only ${coverageScore}% of predicted demand`)
  }

  if (overtimeHours > 0) {
    riskFactors.push(`${overtimeHours.toFixed(1)} overtime hours scheduled, increasing labor costs by ${Math.round(overtimeHours * assumedHourlyRate * (overtimeMultiplier - 1))} units`)
  }

  // Check for days with zero coverage
  for (const day of forecast) {
    if (day.predictedHeadcount > 0 && !dailyHeadcount.has(day.date)) {
      riskFactors.push(`No staff scheduled on ${day.dayName} ${day.date} (predicted need: ${day.predictedHeadcount})`)
    }
  }

  if (fairnessIndex < 50) {
    riskFactors.push(`Uneven hour distribution (fairness index: ${fairnessIndex}%) — some employees have significantly more hours than others`)
  }

  // Check employees near weekly limit
  for (const [, data] of employeeHoursMap) {
    if (data.totalHours > weeklyThreshold * 0.9 && data.totalHours <= weeklyThreshold) {
      riskFactors.push(`${data.name} is at ${data.totalHours.toFixed(1)}h — near the ${weeklyThreshold}h weekly limit`)
    }
  }

  // 9. Employee hours breakdown
  const employeeHoursBreakdown = [...employeeHoursMap.entries()]
    .map(([employeeId, data]) => ({
      employeeId,
      employeeName: data.name,
      totalHours: Math.round(data.totalHours * 10) / 10,
    }))
    .sort((a, b) => b.totalHours - a.totalHours)

  return {
    coverageScore,
    costEstimate: {
      regularHours: Math.round(regularHours * 10) / 10,
      overtimeHours: Math.round(overtimeHours * 10) / 10,
      estimatedCost,
    },
    fairnessIndex,
    riskFactors,
    employeeHoursBreakdown,
  }
}
