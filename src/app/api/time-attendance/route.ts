import { NextRequest, NextResponse } from 'next/server'

// GET /api/time-attendance - Retrieve time entries, policies, shifts, overtime data
export async function GET(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(request.url)
    const action = url.searchParams.get('action') || 'summary'

    switch (action) {
      case 'summary': {
        // Return aggregated time & attendance summary
        return NextResponse.json({
          totalEmployees: 30,
          clockedInToday: 24,
          onLeave: 3,
          averageHoursThisWeek: 41.2,
          overtimeThisWeek: 12.5,
          pendingApprovals: 8,
        })
      }

      case 'time-entries': {
        const employeeId = url.searchParams.get('employeeId')
        const startDate = url.searchParams.get('startDate')
        const endDate = url.searchParams.get('endDate')
        const status = url.searchParams.get('status')
        // In production, would query DB with filters
        return NextResponse.json({
          entries: [],
          filters: { employeeId, startDate, endDate, status },
        })
      }

      case 'overtime-summary': {
        const department = url.searchParams.get('department')
        return NextResponse.json({
          totalOvertimeHours: 45.5,
          totalOvertimeCost: 12500,
          byDepartment: [
            { department: 'Technology', hours: 18.5, cost: 5200 },
            { department: 'Operations', hours: 12.0, cost: 3100 },
            { department: 'Corporate Banking', hours: 8.0, cost: 2400 },
            { department: 'Risk & Compliance', hours: 7.0, cost: 1800 },
          ],
          filter: department,
        })
      }

      case 'pto-balances': {
        const employeeId = url.searchParams.get('employeeId')
        return NextResponse.json({
          balances: [],
          filter: employeeId,
        })
      }

      case 'scheduling': {
        const weekStart = url.searchParams.get('weekStart')
        return NextResponse.json({
          shifts: [],
          coverageGaps: [],
          weekStart,
        })
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Time attendance GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/time-attendance - Clock in/out, create entries, manage shifts
export async function POST(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'clock-in': {
        const { employeeId, location } = body
        if (!employeeId) {
          return NextResponse.json({ error: 'employeeId is required' }, { status: 400 })
        }
        const entry = {
          id: `te-${Date.now()}`,
          org_id: orgId,
          employee_id: employeeId,
          date: new Date().toISOString().split('T')[0],
          clock_in: new Date().toISOString(),
          clock_out: null,
          break_minutes: 0,
          total_hours: null,
          overtime_hours: 0,
          status: 'pending',
          approved_by: null,
          location: location || 'Office',
          notes: null,
          created_at: new Date().toISOString(),
        }
        return NextResponse.json({ entry })
      }

      case 'clock-out': {
        const { entryId, breakMinutes } = body
        if (!entryId) {
          return NextResponse.json({ error: 'entryId is required' }, { status: 400 })
        }
        return NextResponse.json({
          id: entryId,
          clock_out: new Date().toISOString(),
          break_minutes: breakMinutes || 0,
          status: 'pending',
        })
      }

      case 'approve-timesheet': {
        const { entryIds, approvedBy } = body
        if (!entryIds?.length) {
          return NextResponse.json({ error: 'entryIds is required' }, { status: 400 })
        }
        return NextResponse.json({
          approved: entryIds.length,
          approvedBy,
        })
      }

      case 'create-shift': {
        const { employeeId, date, startTime, endTime, role, location: loc } = body
        if (!employeeId || !date) {
          return NextResponse.json({ error: 'employeeId and date are required' }, { status: 400 })
        }
        const shift = {
          id: `sh-${Date.now()}`,
          org_id: orgId,
          employee_id: employeeId,
          date,
          start_time: startTime || '09:00',
          end_time: endTime || '17:00',
          break_duration: 60,
          role: role || null,
          location: loc || null,
          status: 'scheduled',
          swapped_with: null,
          notes: null,
          created_at: new Date().toISOString(),
        }
        return NextResponse.json({ shift })
      }

      case 'create-overtime-rule': {
        const { name, country, dailyThresholdHours, weeklyThresholdHours, multiplier } = body
        if (!name || !country) {
          return NextResponse.json({ error: 'name and country are required' }, { status: 400 })
        }
        const rule = {
          id: `otr-${Date.now()}`,
          org_id: orgId,
          name,
          country,
          daily_threshold_hours: dailyThresholdHours || 8,
          weekly_threshold_hours: weeklyThresholdHours || 40,
          multiplier: multiplier || 1.5,
          double_overtime_threshold: null,
          double_overtime_multiplier: null,
          is_active: true,
          created_at: new Date().toISOString(),
        }
        return NextResponse.json({ rule })
      }

      case 'create-pto-policy': {
        const { name, type, accrualRate, maxBalance } = body
        if (!name || !type) {
          return NextResponse.json({ error: 'name and type are required' }, { status: 400 })
        }
        const policy = {
          id: `top-${Date.now()}`,
          org_id: orgId,
          name,
          type,
          accrual_rate: accrualRate || 0,
          accrual_period: 'monthly',
          max_balance: maxBalance || 0,
          carryover_limit: 0,
          waiting_period_days: 0,
          is_active: true,
          created_at: new Date().toISOString(),
        }
        return NextResponse.json({ policy })
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Time attendance POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
