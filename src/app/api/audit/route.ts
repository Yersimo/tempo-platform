import { NextRequest, NextResponse } from 'next/server'
import { db, schema } from '@/lib/db'
import { eq, and, desc, sql, gte, lte } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const action = url.searchParams.get('action')         // filter by action type
    const entityType = url.searchParams.get('entityType')   // filter by entity type
    const userId = url.searchParams.get('userId')           // filter by user
    const startDate = url.searchParams.get('startDate')     // ISO date string
    const endDate = url.searchParams.get('endDate')         // ISO date string
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100)
    const offset = (page - 1) * limit

    // Build query conditions
    const conditions = [eq(schema.auditLog.orgId, orgId)]
    
    if (action) {
      conditions.push(eq(schema.auditLog.action, action as any))
    }
    if (entityType) {
      conditions.push(eq(schema.auditLog.entityType, entityType))
    }
    if (userId) {
      conditions.push(eq(schema.auditLog.userId, userId))
    }
    if (startDate) {
      conditions.push(gte(schema.auditLog.timestamp, new Date(startDate)))
    }
    if (endDate) {
      conditions.push(lte(schema.auditLog.timestamp, new Date(endDate)))
    }

    // Get total count
    const [countResult] = await db.select({ count: sql<number>`count(*)` })
      .from(schema.auditLog)
      .where(and(...conditions))

    // Get paginated results
    const logs = await db.select()
      .from(schema.auditLog)
      .where(and(...conditions))
      .orderBy(desc(schema.auditLog.timestamp))
      .limit(limit)
      .offset(offset)

    // Enrich with user names
    const userIds = [...new Set(logs.map(l => l.userId).filter(Boolean))]
    const users = userIds.length > 0
      ? await Promise.all(
          userIds.map(id =>
            db.select({ id: schema.employees.id, fullName: schema.employees.fullName })
              .from(schema.employees)
              .where(eq(schema.employees.id, id!))
              .then(r => r[0])
          )
        )
      : []
    const nameMap = new Map(users.filter(Boolean).map(u => [u!.id, u!.fullName]))

    const enrichedLogs = logs.map(log => ({
      ...log,
      userName: log.userId ? nameMap.get(log.userId) || 'Unknown' : 'System',
    }))

    return NextResponse.json({
      logs: enrichedLogs,
      pagination: {
        page,
        limit,
        total: Number(countResult?.count || 0),
        totalPages: Math.ceil(Number(countResult?.count || 0) / limit),
      },
    })
  } catch (error) {
    console.error('[Audit] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 })
  }
}
