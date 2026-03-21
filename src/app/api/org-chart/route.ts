import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

// GET /api/org-chart — Returns flat employee list with managerId references
// Frontend builds the tree from the flat list
export async function GET(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) {
      return NextResponse.json({ error: 'Unauthorized: no org context' }, { status: 401 })
    }

    // Demo orgs (non-UUID IDs like 'org-1') → return empty results
    const UUID_FORMAT = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!UUID_FORMAT.test(orgId)) {
      return NextResponse.json({ employees: [], departments: [] })
    }

    const [employees, departments] = await Promise.all([
      db
        .select({
          id: schema.employees.id,
          fullName: schema.employees.fullName,
          email: schema.employees.email,
          avatarUrl: schema.employees.avatarUrl,
          jobTitle: schema.employees.jobTitle,
          level: schema.employees.level,
          country: schema.employees.country,
          role: schema.employees.role,
          departmentId: schema.employees.departmentId,
          managerId: schema.employees.managerId,
          isActive: schema.employees.isActive,
        })
        .from(schema.employees)
        .where(eq(schema.employees.orgId, orgId)),
      db
        .select({
          id: schema.departments.id,
          name: schema.departments.name,
          headId: schema.departments.headId,
          parentId: schema.departments.parentId,
        })
        .from(schema.departments)
        .where(eq(schema.departments.orgId, orgId)),
    ])

    return NextResponse.json({ employees, departments })
  } catch (error) {
    console.error('[org-chart] GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
