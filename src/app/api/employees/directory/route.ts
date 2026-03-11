import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { employees } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

// ---------------------------------------------------------------------------
// GET /api/employees/directory
// Lightweight endpoint returning ONLY {id, name} pairs for ALL org employees.
// No pagination cap — this is ~30KB for 1000 employees (just IDs + names).
// Used by store's getEmployeeName() to resolve any employee without loading full records.
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rows = await db
      .select({
        id: employees.id,
        fullName: employees.fullName,
      })
      .from(employees)
      .where(eq(employees.orgId, orgId))

    const directory = rows.map(r => ({
      id: r.id,
      name: r.fullName || 'Unknown',
    }))

    return NextResponse.json(
      { data: directory },
      {
        headers: {
          'Cache-Control': 'private, max-age=300, stale-while-revalidate=600',
        },
      }
    )
  } catch (error) {
    console.error('[GET /api/employees/directory] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch directory' }, { status: 500 })
  }
}
