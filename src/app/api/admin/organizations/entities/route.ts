import { NextRequest, NextResponse } from 'next/server'
import { db, schema } from '@/lib/db'
import { eq, or } from 'drizzle-orm'

// GET /api/admin/organizations/entities?parentId=xxx
// Returns all entities (parent + children) for a multi-entity org
export async function GET(request: NextRequest) {
  const parentId = request.nextUrl.searchParams.get('parentId')
  if (!parentId) {
    return NextResponse.json({ error: 'parentId is required' }, { status: 400 })
  }

  try {
    // Fetch the parent org and all orgs that have this as parentOrgId
    const orgs = await db.select({
      id: schema.organizations.id,
      name: schema.organizations.name,
      country: schema.organizations.country,
      entityType: schema.organizations.entityType,
      parentOrgId: schema.organizations.parentOrgId,
      currency: schema.organizations.currency,
    })
      .from(schema.organizations)
      .where(
        or(
          eq(schema.organizations.id, parentId),
          eq(schema.organizations.parentOrgId, parentId)
        )
      )

    if (orgs.length <= 1) {
      // Not a multi-entity org (no children)
      return NextResponse.json({ entities: [] })
    }

    const entities = orgs.map(o => ({
      id: o.id,
      name: o.name,
      country: o.country,
      entityType: o.entityType,
      currency: o.currency,
      isParent: o.id === parentId,
    }))

    // Sort: parent first, then alphabetical
    entities.sort((a, b) => {
      if (a.isParent) return -1
      if (b.isParent) return 1
      return a.name.localeCompare(b.name)
    })

    return NextResponse.json({ entities })
  } catch {
    return NextResponse.json({ entities: [] })
  }
}
