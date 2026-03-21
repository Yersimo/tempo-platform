import { NextRequest, NextResponse } from 'next/server'
import { db, schema, withRetry } from '@/lib/db'
import { eq, and, desc, sql, gte, lte, count, sum } from 'drizzle-orm'
import {
  forecastDemand,
  generateOptimalSchedule,
  detectScheduleConflicts,
  suggestShiftSwaps,
  getScheduleInsights,
} from '@/lib/services/ai-scheduling'

// ---------------------------------------------------------------------------
// GET /api/time-attendance — query time entries, policies, shifts, overtime
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) {
      return NextResponse.json({ error: 'Unauthorized: no org context' }, { status: 401 })
    }

    const url = new URL(request.url)
    const action = url.searchParams.get('action') || 'summary'

    switch (action) {
      // ── 1. summary ─────────────────────────────────────────────────────
      case 'summary': {
        const today = new Date().toISOString().split('T')[0]
        const startOfWeek = getStartOfWeek(new Date()).toISOString().split('T')[0]

        // Employees clocked in today (have clock_in but no clock_out)
        const [clockedInResult] = await withRetry(() =>
          db
            .select({ count: count() })
            .from(schema.timeEntries)
            .where(
              and(
                eq(schema.timeEntries.orgId, orgId),
                eq(schema.timeEntries.date, today),
                sql`${schema.timeEntries.clockOut} IS NULL`,
              ),
            ),
        )

        // Employees on leave today
        const [onLeaveResult] = await withRetry(() =>
          db
            .select({ count: count() })
            .from(schema.leaveRequests)
            .where(
              and(
                eq(schema.leaveRequests.orgId, orgId),
                eq(schema.leaveRequests.status, 'approved'),
                lte(schema.leaveRequests.startDate, today),
                gte(schema.leaveRequests.endDate, today),
              ),
            ),
        )

        // Average hours this week and total overtime
        const weeklyStats = await withRetry(() =>
          db
            .select({
              avgHours: sql<number>`COALESCE(AVG(${schema.timeEntries.totalHours}), 0)`,
              totalOvertime: sql<number>`COALESCE(SUM(${schema.timeEntries.overtimeHours}), 0)`,
            })
            .from(schema.timeEntries)
            .where(
              and(
                eq(schema.timeEntries.orgId, orgId),
                gte(schema.timeEntries.date, startOfWeek),
                sql`${schema.timeEntries.totalHours} IS NOT NULL`,
              ),
            ),
        )

        // Pending approvals
        const [pendingResult] = await withRetry(() =>
          db
            .select({ count: count() })
            .from(schema.timeEntries)
            .where(
              and(
                eq(schema.timeEntries.orgId, orgId),
                eq(schema.timeEntries.status, 'pending'),
              ),
            ),
        )

        return NextResponse.json({
          clockedInToday: clockedInResult?.count ?? 0,
          onLeave: onLeaveResult?.count ?? 0,
          averageHoursThisWeek: Number(weeklyStats[0]?.avgHours ?? 0),
          overtimeThisWeek: Number(weeklyStats[0]?.totalOvertime ?? 0),
          pendingApprovals: pendingResult?.count ?? 0,
        })
      }

      // ── 2. time-entries ────────────────────────────────────────────────
      case 'time-entries': {
        const employeeId = url.searchParams.get('employeeId')
        const startDate = url.searchParams.get('startDate')
        const endDate = url.searchParams.get('endDate')
        const status = url.searchParams.get('status')

        const conditions = [eq(schema.timeEntries.orgId, orgId)]

        if (employeeId) {
          conditions.push(eq(schema.timeEntries.employeeId, employeeId))
        }
        if (startDate) {
          conditions.push(gte(schema.timeEntries.date, startDate))
        }
        if (endDate) {
          conditions.push(lte(schema.timeEntries.date, endDate))
        }
        if (status) {
          conditions.push(eq(schema.timeEntries.status, status as 'pending' | 'approved' | 'rejected'))
        }

        const entries = await withRetry(() =>
          db
            .select({
              id: schema.timeEntries.id,
              employeeId: schema.timeEntries.employeeId,
              employeeName: schema.employees.fullName,
              date: schema.timeEntries.date,
              clockIn: schema.timeEntries.clockIn,
              clockOut: schema.timeEntries.clockOut,
              breakMinutes: schema.timeEntries.breakMinutes,
              totalHours: schema.timeEntries.totalHours,
              overtimeHours: schema.timeEntries.overtimeHours,
              status: schema.timeEntries.status,
              approvedBy: schema.timeEntries.approvedBy,
              location: schema.timeEntries.location,
              notes: schema.timeEntries.notes,
              createdAt: schema.timeEntries.createdAt,
            })
            .from(schema.timeEntries)
            .innerJoin(
              schema.employees,
              eq(schema.timeEntries.employeeId, schema.employees.id),
            )
            .where(and(...conditions))
            .orderBy(desc(schema.timeEntries.date), desc(schema.timeEntries.clockIn))
            .limit(500),
        )

        return NextResponse.json({ entries })
      }

      // ── 3. overtime-summary ────────────────────────────────────────────
      case 'overtime-summary': {
        const department = url.searchParams.get('department')
        const startDate = url.searchParams.get('startDate')
        const endDate = url.searchParams.get('endDate')

        const conditions = [
          eq(schema.timeEntries.orgId, orgId),
          sql`${schema.timeEntries.overtimeHours} > 0`,
        ]

        if (startDate) {
          conditions.push(gte(schema.timeEntries.date, startDate))
        }
        if (endDate) {
          conditions.push(lte(schema.timeEntries.date, endDate))
        }
        if (department) {
          conditions.push(eq(schema.departments.name, department))
        }

        const byDepartment = await withRetry(() =>
          db
            .select({
              department: schema.departments.name,
              hours: sql<number>`COALESCE(SUM(${schema.timeEntries.overtimeHours}), 0)`,
              entryCount: count(),
            })
            .from(schema.timeEntries)
            .innerJoin(
              schema.employees,
              eq(schema.timeEntries.employeeId, schema.employees.id),
            )
            .innerJoin(
              schema.departments,
              eq(schema.employees.departmentId, schema.departments.id),
            )
            .where(and(...conditions))
            .groupBy(schema.departments.name)
            .orderBy(sql`SUM(${schema.timeEntries.overtimeHours}) DESC`),
        )

        const totalOvertimeHours = byDepartment.reduce(
          (sum, d) => sum + Number(d.hours),
          0,
        )

        return NextResponse.json({
          totalOvertimeHours,
          byDepartment,
        })
      }

      // ── 4. pto-balances ────────────────────────────────────────────────
      case 'pto-balances': {
        const employeeId = url.searchParams.get('employeeId')
        if (!employeeId) {
          return NextResponse.json({ error: 'Missing required query param: employeeId' }, { status: 400 })
        }

        const balances = await withRetry(() =>
          db
            .select({
              id: schema.timeOffBalances.id,
              policyId: schema.timeOffBalances.policyId,
              policyName: schema.timeOffPolicies.name,
              policyType: schema.timeOffPolicies.type,
              balance: schema.timeOffBalances.balance,
              used: schema.timeOffBalances.used,
              pending: schema.timeOffBalances.pending,
              carryover: schema.timeOffBalances.carryover,
              asOfDate: schema.timeOffBalances.asOfDate,
              accrualRate: schema.timeOffPolicies.accrualRate,
              accrualPeriod: schema.timeOffPolicies.accrualPeriod,
              maxBalance: schema.timeOffPolicies.maxBalance,
            })
            .from(schema.timeOffBalances)
            .innerJoin(
              schema.timeOffPolicies,
              eq(schema.timeOffBalances.policyId, schema.timeOffPolicies.id),
            )
            .where(
              and(
                eq(schema.timeOffBalances.orgId, orgId),
                eq(schema.timeOffBalances.employeeId, employeeId),
              ),
            ),
        )

        return NextResponse.json({ balances })
      }

      // ── 5. scheduling ─────────────────────────────────────────────────
      case 'scheduling': {
        const weekStart = url.searchParams.get('weekStart')
        if (!weekStart) {
          return NextResponse.json({ error: 'Missing required query param: weekStart' }, { status: 400 })
        }

        // Calculate the end of the week (7 days from weekStart)
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekEnd.getDate() + 6)
        const weekEndStr = weekEnd.toISOString().split('T')[0]

        const shiftsResult = await withRetry(() =>
          db
            .select({
              id: schema.shifts.id,
              employeeId: schema.shifts.employeeId,
              employeeName: schema.employees.fullName,
              date: schema.shifts.date,
              startTime: schema.shifts.startTime,
              endTime: schema.shifts.endTime,
              breakDuration: schema.shifts.breakDuration,
              role: schema.shifts.role,
              location: schema.shifts.location,
              status: schema.shifts.status,
              swappedWith: schema.shifts.swappedWith,
              notes: schema.shifts.notes,
            })
            .from(schema.shifts)
            .innerJoin(
              schema.employees,
              eq(schema.shifts.employeeId, schema.employees.id),
            )
            .where(
              and(
                eq(schema.shifts.orgId, orgId),
                gte(schema.shifts.date, weekStart),
                lte(schema.shifts.date, weekEndStr),
              ),
            )
            .orderBy(schema.shifts.date, schema.shifts.startTime),
        )

        return NextResponse.json({
          shifts: shiftsResult,
          weekStart,
          weekEnd: weekEndStr,
        })
      }

      // ── 6. overtime-rules ──────────────────────────────────────────────
      case 'overtime-rules': {
        const rules = await withRetry(() =>
          db
            .select()
            .from(schema.overtimeRules)
            .where(eq(schema.overtimeRules.orgId, orgId))
            .orderBy(schema.overtimeRules.name),
        )

        return NextResponse.json({ rules })
      }

      // ── 7. time-off-policies ───────────────────────────────────────────
      case 'time-off-policies': {
        const activeOnly = url.searchParams.get('activeOnly') !== 'false'

        const conditions = [eq(schema.timeOffPolicies.orgId, orgId)]
        if (activeOnly) {
          conditions.push(eq(schema.timeOffPolicies.isActive, true))
        }

        const policies = await withRetry(() =>
          db
            .select()
            .from(schema.timeOffPolicies)
            .where(and(...conditions))
            .orderBy(schema.timeOffPolicies.name),
        )

        return NextResponse.json({ policies })
      }

      // ── 8. forecast ──────────────────────────────────────────────────
      case 'forecast': {
        const startDate = url.searchParams.get('startDate')
        const endDate = url.searchParams.get('endDate')
        if (!startDate || !endDate) {
          return NextResponse.json({ error: 'Missing required query params: startDate, endDate' }, { status: 400 })
        }

        const forecast = await forecastDemand(orgId, startDate, endDate)
        return NextResponse.json({ forecast })
      }

      // ── 9. schedule-insights ─────────────────────────────────────────
      case 'schedule-insights': {
        const weekStart = url.searchParams.get('weekStart')
        if (!weekStart) {
          return NextResponse.json({ error: 'Missing required query param: weekStart' }, { status: 400 })
        }

        const insights = await getScheduleInsights(orgId, weekStart)
        return NextResponse.json({ insights })
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error) {
    console.error('[GET /api/time-attendance] Error:', error)
    return NextResponse.json({ error: 'Time attendance query failed' }, { status: 500 })
  }
}

// ---------------------------------------------------------------------------
// POST /api/time-attendance — clock in/out, create entries, manage shifts
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) {
      return NextResponse.json({ error: 'Unauthorized: no org context' }, { status: 401 })
    }

    const body = await request.json()
    const { action } = body

    switch (action) {
      // ── 1. clock-in ─────────────────────────────────────────────────────
      case 'clock-in': {
        const { employeeId, location, notes } = body
        if (!employeeId) {
          return NextResponse.json({ error: 'employeeId is required' }, { status: 400 })
        }

        // Verify employee belongs to org
        const [employee] = await withRetry(() =>
          db
            .select({ id: schema.employees.id })
            .from(schema.employees)
            .where(
              and(
                eq(schema.employees.id, employeeId),
                eq(schema.employees.orgId, orgId),
              ),
            )
            .limit(1),
        )

        if (!employee) {
          return NextResponse.json({ error: 'Employee not found in this organization' }, { status: 404 })
        }

        // Check if already clocked in today (no clock-out)
        const today = new Date().toISOString().split('T')[0]
        const [existing] = await withRetry(() =>
          db
            .select({ id: schema.timeEntries.id })
            .from(schema.timeEntries)
            .where(
              and(
                eq(schema.timeEntries.orgId, orgId),
                eq(schema.timeEntries.employeeId, employeeId),
                eq(schema.timeEntries.date, today),
                sql`${schema.timeEntries.clockOut} IS NULL`,
              ),
            )
            .limit(1),
        )

        if (existing) {
          return NextResponse.json(
            { error: 'Employee is already clocked in today. Clock out first.' },
            { status: 400 },
          )
        }

        const [entry] = await withRetry(() =>
          db
            .insert(schema.timeEntries)
            .values({
              orgId,
              employeeId,
              date: today,
              clockIn: new Date(),
              breakMinutes: 0,
              overtimeHours: 0,
              status: 'pending',
              location: location || null,
              notes: notes || null,
            })
            .returning(),
        )

        return NextResponse.json({ entry }, { status: 201 })
      }

      // ── 2. clock-out ────────────────────────────────────────────────────
      case 'clock-out': {
        const { entryId, breakMinutes } = body
        if (!entryId) {
          return NextResponse.json({ error: 'entryId is required' }, { status: 400 })
        }

        // Find the time entry
        const [entry] = await withRetry(() =>
          db
            .select()
            .from(schema.timeEntries)
            .where(
              and(
                eq(schema.timeEntries.id, entryId),
                eq(schema.timeEntries.orgId, orgId),
              ),
            )
            .limit(1),
        )

        if (!entry) {
          return NextResponse.json({ error: 'Time entry not found' }, { status: 404 })
        }

        if (entry.clockOut) {
          return NextResponse.json({ error: 'This entry is already clocked out' }, { status: 400 })
        }

        const clockOut = new Date()
        const clockIn = new Date(entry.clockIn)
        const effectiveBreak = breakMinutes ?? entry.breakMinutes ?? 0

        // Calculate total hours worked
        const diffMs = clockOut.getTime() - clockIn.getTime()
        const totalHours = Math.max(0, (diffMs / (1000 * 60 * 60)) - (effectiveBreak / 60))

        // Look up overtime rules for this org to calculate overtime
        let overtimeHours = 0
        const rules = await withRetry(() =>
          db
            .select()
            .from(schema.overtimeRules)
            .where(
              and(
                eq(schema.overtimeRules.orgId, orgId),
                eq(schema.overtimeRules.isActive, true),
              ),
            )
            .limit(1),
        )

        if (rules.length > 0) {
          const rule = rules[0]
          if (totalHours > rule.dailyThresholdHours) {
            overtimeHours = totalHours - rule.dailyThresholdHours
          }
        } else {
          // Default: overtime after 8 hours
          if (totalHours > 8) {
            overtimeHours = totalHours - 8
          }
        }

        const [updatedEntry] = await withRetry(() =>
          db
            .update(schema.timeEntries)
            .set({
              clockOut,
              breakMinutes: effectiveBreak,
              totalHours: Math.round(totalHours * 100) / 100,
              overtimeHours: Math.round(overtimeHours * 100) / 100,
            })
            .where(eq(schema.timeEntries.id, entryId))
            .returning(),
        )

        return NextResponse.json({ entry: updatedEntry })
      }

      // ── 3. approve-timesheet ────────────────────────────────────────────
      case 'approve-timesheet': {
        const { entryIds, approvedBy } = body
        if (!entryIds?.length) {
          return NextResponse.json({ error: 'entryIds is required' }, { status: 400 })
        }
        if (!approvedBy) {
          return NextResponse.json({ error: 'approvedBy is required' }, { status: 400 })
        }

        // Verify approver belongs to org
        const [approver] = await withRetry(() =>
          db
            .select({ id: schema.employees.id, role: schema.employees.role })
            .from(schema.employees)
            .where(
              and(
                eq(schema.employees.id, approvedBy),
                eq(schema.employees.orgId, orgId),
              ),
            )
            .limit(1),
        )

        if (!approver) {
          return NextResponse.json({ error: 'Approver not found in this organization' }, { status: 404 })
        }

        // Batch update all entries
        const updated = await withRetry(() =>
          db
            .update(schema.timeEntries)
            .set({
              status: 'approved',
              approvedBy,
            })
            .where(
              and(
                eq(schema.timeEntries.orgId, orgId),
                eq(schema.timeEntries.status, 'pending'),
                sql`${schema.timeEntries.id} IN ${entryIds}`,
              ),
            )
            .returning({ id: schema.timeEntries.id }),
        )

        return NextResponse.json({
          approved: updated.length,
          approvedBy,
          entryIds: updated.map((e) => e.id),
        })
      }

      // ── 4. create-shift ─────────────────────────────────────────────────
      case 'create-shift': {
        const { employeeId, date, startTime, endTime, breakDuration, role, location: loc, notes } = body
        if (!employeeId || !date) {
          return NextResponse.json({ error: 'employeeId and date are required' }, { status: 400 })
        }

        // Verify employee belongs to org
        const [employee] = await withRetry(() =>
          db
            .select({ id: schema.employees.id })
            .from(schema.employees)
            .where(
              and(
                eq(schema.employees.id, employeeId),
                eq(schema.employees.orgId, orgId),
              ),
            )
            .limit(1),
        )

        if (!employee) {
          return NextResponse.json({ error: 'Employee not found in this organization' }, { status: 404 })
        }

        const [shift] = await withRetry(() =>
          db
            .insert(schema.shifts)
            .values({
              orgId,
              employeeId,
              date,
              startTime: startTime || '09:00',
              endTime: endTime || '17:00',
              breakDuration: breakDuration ?? 60,
              role: role || null,
              location: loc || null,
              status: 'scheduled',
              notes: notes || null,
            })
            .returning(),
        )

        return NextResponse.json({ shift }, { status: 201 })
      }

      // ── 5. create-overtime-rule ─────────────────────────────────────────
      case 'create-overtime-rule': {
        const {
          name,
          country,
          dailyThresholdHours,
          weeklyThresholdHours,
          multiplier,
          doubleOvertimeThreshold,
          doubleOvertimeMultiplier,
        } = body
        if (!name || !country) {
          return NextResponse.json({ error: 'name and country are required' }, { status: 400 })
        }

        const [rule] = await withRetry(() =>
          db
            .insert(schema.overtimeRules)
            .values({
              orgId,
              name,
              country,
              dailyThresholdHours: dailyThresholdHours ?? 8,
              weeklyThresholdHours: weeklyThresholdHours ?? 40,
              multiplier: multiplier ?? 1.5,
              doubleOvertimeThreshold: doubleOvertimeThreshold ?? null,
              doubleOvertimeMultiplier: doubleOvertimeMultiplier ?? null,
              isActive: true,
            })
            .returning(),
        )

        return NextResponse.json({ rule }, { status: 201 })
      }

      // ── 6. create-pto-policy ────────────────────────────────────────────
      case 'create-pto-policy': {
        const {
          name,
          type,
          accrualRate,
          accrualPeriod,
          maxBalance,
          carryoverLimit,
          waitingPeriodDays,
        } = body
        if (!name || !type) {
          return NextResponse.json({ error: 'name and type are required' }, { status: 400 })
        }

        const [policy] = await withRetry(() =>
          db
            .insert(schema.timeOffPolicies)
            .values({
              orgId,
              name,
              type,
              accrualRate: accrualRate ?? 0,
              accrualPeriod: accrualPeriod ?? 'monthly',
              maxBalance: maxBalance ?? 0,
              carryoverLimit: carryoverLimit ?? 0,
              waitingPeriodDays: waitingPeriodDays ?? 0,
              isActive: true,
            })
            .returning(),
        )

        return NextResponse.json({ policy }, { status: 201 })
      }

      // ── 7. request-time-off ─────────────────────────────────────────────
      case 'request-time-off': {
        const { employeeId, type, startDate, endDate, days, reason } = body
        if (!employeeId || !type || !startDate || !endDate || !days) {
          return NextResponse.json(
            { error: 'employeeId, type, startDate, endDate, and days are required' },
            { status: 400 },
          )
        }

        // Verify employee belongs to org
        const [employee] = await withRetry(() =>
          db
            .select({ id: schema.employees.id })
            .from(schema.employees)
            .where(
              and(
                eq(schema.employees.id, employeeId),
                eq(schema.employees.orgId, orgId),
              ),
            )
            .limit(1),
        )

        if (!employee) {
          return NextResponse.json({ error: 'Employee not found in this organization' }, { status: 404 })
        }

        const [leaveRequest] = await withRetry(() =>
          db
            .insert(schema.leaveRequests)
            .values({
              orgId,
              employeeId,
              type,
              startDate,
              endDate,
              days,
              status: 'pending',
              reason: reason || null,
            })
            .returning(),
        )

        // Update pending balance if a matching policy exists
        const matchingBalances = await withRetry(() =>
          db
            .select({
              id: schema.timeOffBalances.id,
              pending: schema.timeOffBalances.pending,
            })
            .from(schema.timeOffBalances)
            .innerJoin(
              schema.timeOffPolicies,
              eq(schema.timeOffBalances.policyId, schema.timeOffPolicies.id),
            )
            .where(
              and(
                eq(schema.timeOffBalances.orgId, orgId),
                eq(schema.timeOffBalances.employeeId, employeeId),
                eq(schema.timeOffPolicies.type, type),
              ),
            )
            .limit(1),
        )

        if (matchingBalances.length > 0) {
          const bal = matchingBalances[0]
          await withRetry(() =>
            db
              .update(schema.timeOffBalances)
              .set({ pending: bal.pending + days })
              .where(eq(schema.timeOffBalances.id, bal.id)),
          )
        }

        return NextResponse.json({ leaveRequest }, { status: 201 })
      }

      // ── 8. update-balance ───────────────────────────────────────────────
      case 'update-balance': {
        const { balanceId, balance, used, pending, carryover, asOfDate } = body
        if (!balanceId) {
          return NextResponse.json({ error: 'balanceId is required' }, { status: 400 })
        }

        // Verify balance belongs to this org
        const [existing] = await withRetry(() =>
          db
            .select({ id: schema.timeOffBalances.id })
            .from(schema.timeOffBalances)
            .where(
              and(
                eq(schema.timeOffBalances.id, balanceId),
                eq(schema.timeOffBalances.orgId, orgId),
              ),
            )
            .limit(1),
        )

        if (!existing) {
          return NextResponse.json({ error: 'Balance record not found' }, { status: 404 })
        }

        const updateData: Record<string, unknown> = {}
        if (balance !== undefined) updateData.balance = balance
        if (used !== undefined) updateData.used = used
        if (pending !== undefined) updateData.pending = pending
        if (carryover !== undefined) updateData.carryover = carryover
        if (asOfDate !== undefined) updateData.asOfDate = asOfDate

        if (Object.keys(updateData).length === 0) {
          return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
        }

        const [updated] = await withRetry(() =>
          db
            .update(schema.timeOffBalances)
            .set(updateData)
            .where(eq(schema.timeOffBalances.id, balanceId))
            .returning(),
        )

        return NextResponse.json({ balance: updated })
      }

      // ── 9. auto-schedule ─────────────────────────────────────────────
      case 'auto-schedule': {
        const { weekStart, constraints } = body
        if (!weekStart) {
          return NextResponse.json({ error: 'weekStart is required' }, { status: 400 })
        }

        const result = await generateOptimalSchedule(orgId, weekStart, constraints ?? {})
        return NextResponse.json(result)
      }

      // ── 10. detect-conflicts ──────────────────────────────────────────
      case 'detect-conflicts': {
        const { shifts: proposedShifts } = body
        if (!proposedShifts?.length) {
          return NextResponse.json({ error: 'shifts array is required' }, { status: 400 })
        }

        const conflicts = await detectScheduleConflicts(orgId, proposedShifts)
        return NextResponse.json({ conflicts })
      }

      // ── 11. suggest-swaps ─────────────────────────────────────────────
      case 'suggest-swaps': {
        const { shiftId } = body
        if (!shiftId) {
          return NextResponse.json({ error: 'shiftId is required' }, { status: 400 })
        }

        const result = await suggestShiftSwaps(orgId, shiftId)
        return NextResponse.json(result)
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error: any) {
    console.error('[POST /api/time-attendance] Error:', error)
    return NextResponse.json(
      { error: error?.message || 'Time attendance operation failed' },
      { status: 500 },
    )
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns the Monday of the current week (ISO week) */
function getStartOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  // Adjust to Monday (day 1). If Sunday (0), go back 6 days.
  const diff = day === 0 ? 6 : day - 1
  d.setDate(d.getDate() - diff)
  d.setHours(0, 0, 0, 0)
  return d
}
