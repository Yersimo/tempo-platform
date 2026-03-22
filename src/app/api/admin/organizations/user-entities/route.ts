import { NextRequest, NextResponse } from 'next/server'
import { db, schema } from '@/lib/db'
import { eq } from 'drizzle-orm'

// POST /api/admin/organizations/user-entities
// Save user-entity assignments for a multi-entity org
export async function POST(request: NextRequest) {
  const adminRole = request.headers.get('x-admin-role')
  if (!adminRole) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { userId, assignments } = body

    if (!userId || !Array.isArray(assignments)) {
      return NextResponse.json({ error: 'userId and assignments array required' }, { status: 400 })
    }

    // Delete existing assignments for this user
    await db.delete(schema.userEntityAssignments)
      .where(eq(schema.userEntityAssignments.userId, userId))

    // Insert new assignments
    if (assignments.length > 0) {
      await db.insert(schema.userEntityAssignments).values(
        assignments.map((a: { orgId: string; role: string; accessLevel: string }, idx: number) => ({
          userId,
          orgId: a.orgId,
          role: a.role || 'Employee',
          accessLevel: a.accessLevel || 'full',
          isPrimary: idx === 0,
        }))
      )
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Save user entity assignments error:', error)
    return NextResponse.json({ error: 'Failed to save assignments' }, { status: 500 })
  }
}

// GET /api/admin/organizations/user-entities?userId=xxx
// Fetch entity assignments for a specific user
export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId')
  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 })
  }

  try {
    const assignments = await db.select()
      .from(schema.userEntityAssignments)
      .where(eq(schema.userEntityAssignments.userId, userId))

    return NextResponse.json({ assignments })
  } catch {
    return NextResponse.json({ assignments: [] })
  }
}
