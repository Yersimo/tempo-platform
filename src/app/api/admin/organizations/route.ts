import { NextRequest, NextResponse } from 'next/server'
import { db, schema } from '@/lib/db'
import { eq, sql } from 'drizzle-orm'
import { getDemoDataForOrg } from '@/lib/demo-data'

// GET /api/admin/organizations — list all organizations (DB + demo) with employee counts
export async function GET(request: NextRequest) {
  const adminRole = request.headers.get('x-admin-role')
  if (!adminRole) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Always include demo orgs
  const org1Data = getDemoDataForOrg('org-1')
  const org2Data = getDemoDataForOrg('org-2')
  const demoOrgs = [
    {
      id: org1Data.org.id,
      name: org1Data.org.name,
      slug: org1Data.org.slug,
      logoUrl: null,
      plan: org1Data.org.plan,
      industry: org1Data.org.industry,
      size: org1Data.org.size,
      country: org1Data.org.country,
      isActive: true,
      employeeCount: org1Data.employees.length,
      createdAt: org1Data.org.created_at,
      source: 'demo' as const,
    },
    {
      id: org2Data.org.id,
      name: org2Data.org.name,
      slug: org2Data.org.slug,
      logoUrl: null,
      plan: org2Data.org.plan,
      industry: org2Data.org.industry,
      size: org2Data.org.size,
      country: org2Data.org.country,
      isActive: true,
      employeeCount: org2Data.employees.length,
      createdAt: org2Data.org.created_at,
      source: 'demo' as const,
    },
  ]

  try {
    // Also fetch DB orgs
    const orgs = await db.select({
      id: schema.organizations.id,
      name: schema.organizations.name,
      slug: schema.organizations.slug,
      logoUrl: schema.organizations.logoUrl,
      plan: schema.organizations.plan,
      industry: schema.organizations.industry,
      size: schema.organizations.size,
      country: schema.organizations.country,
      isActive: schema.organizations.isActive,
      createdAt: schema.organizations.createdAt,
    }).from(schema.organizations)

    // Get employee counts per org
    const counts = await db.select({
      orgId: schema.employees.orgId,
      count: sql<number>`count(*)::int`,
    })
      .from(schema.employees)
      .groupBy(schema.employees.orgId)

    const countMap = new Map(counts.map(c => [c.orgId, c.count]))

    const dbOrgs = orgs.map(o => ({
      ...o,
      employeeCount: countMap.get(o.id) || 0,
      source: 'database' as const,
    }))

    // Merge: demo orgs first, then DB orgs (skip DB duplicates of demo slugs)
    const demoSlugs = new Set(demoOrgs.map(o => o.slug))
    const uniqueDbOrgs = dbOrgs.filter(o => !demoSlugs.has(o.slug))
    const allOrgs = [...demoOrgs, ...uniqueDbOrgs]

    return NextResponse.json({ ok: true, organizations: allOrgs })
  } catch {
    // DB unavailable — return demo orgs only
    return NextResponse.json({ ok: true, organizations: demoOrgs })
  }
}

// POST /api/admin/organizations — create a new organization
export async function POST(request: NextRequest) {
  const adminRole = request.headers.get('x-admin-role')
  if (adminRole !== 'super_admin') {
    return NextResponse.json({ error: 'Super admin required' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { name, slug, industry, country, plan, size } = body

    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 })
    }

    const [org] = await db.insert(schema.organizations).values({
      name,
      slug,
      industry: industry || null,
      country: country || null,
      plan: plan || 'free',
      size: size || null,
    }).returning()

    return NextResponse.json({ ok: true, organization: org })
  } catch (error) {
    console.error('Create org error:', error)
    return NextResponse.json({ error: 'Failed to create organization' }, { status: 500 })
  }
}

// PATCH /api/admin/organizations — update an organization
export async function PATCH(request: NextRequest) {
  const adminRole = request.headers.get('x-admin-role')
  if (adminRole !== 'super_admin' && adminRole !== 'support') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 })
    }

    // Only allow certain fields to be updated
    const allowed: Record<string, unknown> = {}
    if ('isActive' in updates) allowed.isActive = updates.isActive
    if ('plan' in updates) allowed.plan = updates.plan
    if ('name' in updates) allowed.name = updates.name
    if ('industry' in updates) allowed.industry = updates.industry
    if ('country' in updates) allowed.country = updates.country
    if ('size' in updates) allowed.size = updates.size

    allowed.updatedAt = new Date()

    const [org] = await db.update(schema.organizations)
      .set(allowed)
      .where(eq(schema.organizations.id, id))
      .returning()

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    return NextResponse.json({ ok: true, organization: org })
  } catch (error) {
    console.error('Update org error:', error)
    return NextResponse.json({ error: 'Failed to update organization' }, { status: 500 })
  }
}
