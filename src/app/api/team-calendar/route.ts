import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import { eq, and, gte, lte, or } from 'drizzle-orm'

// GET /api/team-calendar?month=2026-03&department=xxx
// Returns leave requests overlapping the given month, plus employees for context
export async function GET(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) {
      return NextResponse.json({ error: 'Unauthorized: no org context' }, { status: 401 })
    }

    const UUID_FORMAT = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!UUID_FORMAT.test(orgId)) {
      return NextResponse.json({ leaveRequests: [], employees: [], departments: [] })
    }

    const url = new URL(request.url)
    const monthParam = url.searchParams.get('month') // e.g. "2026-03"
    const departmentId = url.searchParams.get('department')

    // Calculate month boundaries
    let year: number, month: number
    if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
      const [y, m] = monthParam.split('-').map(Number)
      year = y
      month = m
    } else {
      const now = new Date()
      year = now.getFullYear()
      month = now.getMonth() + 1
    }

    const startOfMonth = `${year}-${String(month).padStart(2, '0')}-01`
    const lastDay = new Date(year, month, 0).getDate()
    const endOfMonth = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

    // Fetch leave requests that overlap with the month range
    // A leave overlaps if its startDate <= endOfMonth AND endDate >= startOfMonth
    const conditions = [
      eq(schema.leaveRequests.orgId, orgId),
      lte(schema.leaveRequests.startDate, endOfMonth),
      gte(schema.leaveRequests.endDate, startOfMonth),
    ]

    const leaveRequests = await db
      .select({
        id: schema.leaveRequests.id,
        employeeId: schema.leaveRequests.employeeId,
        type: schema.leaveRequests.type,
        startDate: schema.leaveRequests.startDate,
        endDate: schema.leaveRequests.endDate,
        days: schema.leaveRequests.days,
        status: schema.leaveRequests.status,
        reason: schema.leaveRequests.reason,
      })
      .from(schema.leaveRequests)
      .where(and(...conditions))

    // Fetch employees (with department filter if provided)
    const empConditions = [eq(schema.employees.orgId, orgId), eq(schema.employees.isActive, true)]
    if (departmentId) {
      empConditions.push(eq(schema.employees.departmentId, departmentId))
    }

    const employees = await db
      .select({
        id: schema.employees.id,
        fullName: schema.employees.fullName,
        avatarUrl: schema.employees.avatarUrl,
        jobTitle: schema.employees.jobTitle,
        departmentId: schema.employees.departmentId,
        managerId: schema.employees.managerId,
        country: schema.employees.country,
      })
      .from(schema.employees)
      .where(and(...empConditions))

    const departments = await db
      .select({
        id: schema.departments.id,
        name: schema.departments.name,
      })
      .from(schema.departments)
      .where(eq(schema.departments.orgId, orgId))

    return NextResponse.json({
      leaveRequests,
      employees,
      departments,
      month: { year, month, startOfMonth, endOfMonth },
    })
  } catch (error) {
    console.error('[team-calendar] GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
