import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { employeeHistory } from '@/lib/db/schema'
import { eq, and, lte, gte, desc } from 'drizzle-orm'

const UUID_FORMAT = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Demo orgs -> return empty
    if (!UUID_FORMAT.test(orgId)) {
      return NextResponse.json({ data: [] })
    }

    const url = new URL(request.url)
    const employeeId = url.searchParams.get('employeeId')
    const fieldName = url.searchParams.get('fieldName')
    const startDate = url.searchParams.get('startDate')
    const endDate = url.searchParams.get('endDate')
    const asOfDate = url.searchParams.get('asOf')

    // Build conditions
    const conditions = [eq(employeeHistory.orgId, orgId)]
    if (employeeId) conditions.push(eq(employeeHistory.employeeId, employeeId))
    if (fieldName) conditions.push(eq(employeeHistory.fieldName, fieldName))
    if (startDate) conditions.push(gte(employeeHistory.effectiveDate, startDate))
    if (endDate) conditions.push(lte(employeeHistory.effectiveDate, endDate))
    if (asOfDate) conditions.push(lte(employeeHistory.effectiveDate, asOfDate))

    const rows = await db
      .select()
      .from(employeeHistory)
      .where(and(...conditions))
      .orderBy(desc(employeeHistory.effectiveDate), desc(employeeHistory.createdAt))
      .limit(200)

    return NextResponse.json({ data: rows })
  } catch (error) {
    console.error('[GET /api/employee-history] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!UUID_FORMAT.test(orgId)) {
      return NextResponse.json({ error: 'Demo org' }, { status: 400 })
    }

    const body = await request.json()
    const { employeeId, fieldName, oldValue, newValue, effectiveDate, changedBy, changeReason, changeType } = body

    if (!employeeId || !fieldName || !effectiveDate || !changeType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const [inserted] = await db.insert(employeeHistory).values({
      orgId,
      employeeId,
      fieldName,
      oldValue: oldValue || null,
      newValue: newValue || null,
      effectiveDate,
      changedBy: changedBy || null,
      changeReason: changeReason || null,
      changeType,
    }).returning()

    return NextResponse.json({ data: inserted }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/employee-history] Error:', error)
    return NextResponse.json({ error: 'Failed to record change' }, { status: 500 })
  }
}
