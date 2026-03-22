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
      parentOrgId: schema.organizations.parentOrgId,
      entityType: schema.organizations.entityType,
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

function slugifyName(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

// POST /api/admin/organizations — create a new organization (single or multi-entity)
export async function POST(request: NextRequest) {
  const adminRole = request.headers.get('x-admin-role')
  if (adminRole !== 'super_admin') {
    return NextResponse.json({ error: 'Super admin required' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { name, slug, industry, country, plan, size, structureType, entities, accessControl } = body

    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 })
    }

    if (structureType === 'multi_entity') {
      // --- Multi-Entity Creation ---
      // 1. Create parent organization
      const [parentOrg] = await db.insert(schema.organizations).values({
        name,
        slug,
        industry: industry || null,
        country: country || null,
        plan: plan || 'free',
        size: size || null,
        crossEntityAnalytics: accessControl?.crossEntityAnalytics ?? false,
        crossEntityUserAssignment: accessControl?.crossEntityUserAssignment ?? false,
        financialConsolidation: accessControl?.financialConsolidation ?? false,
        sharedEmployeeDirectory: accessControl?.sharedEmployeeDirectory ?? false,
      }).returning()

      // 2. Create entity group for consolidation
      const consolidationCurrency = country
        ? getCurrencyForCountry(country) || 'USD'
        : 'USD'

      const [entityGroup] = await db.insert(schema.entityGroups).values({
        name: `${name} Group`,
        description: `Multi-entity group for ${name}`,
        parentOrgId: parentOrg.id,
        consolidationCurrency,
      }).returning()

      // 3. Add parent as first member of entity group
      await db.insert(schema.entityGroupMembers).values({
        groupId: entityGroup.id,
        orgId: parentOrg.id,
        entityName: name,
        entityType: 'parent',
        country: country || 'Unknown',
        localCurrency: consolidationCurrency,
        ownershipPercent: 100,
        consolidationMethod: 'full',
      })

      // 4. Create each subsidiary as a linked entity
      const childOrgs: Array<{ id: string; name: string; country: string }> = []
      if (Array.isArray(entities)) {
        for (const entity of entities) {
          if (!entity.name || !entity.country) continue

          const childSlug = slugifyName(entity.name)
          const [childOrg] = await db.insert(schema.organizations).values({
            name: entity.name,
            slug: `${slug}-${childSlug}`,
            country: entity.country,
            currency: entity.currency || null,
            parentOrgId: parentOrg.id,
            entityType: entity.type || 'subsidiary',
            registrationNumber: entity.registrationNumber || null,
            plan: plan || 'free', // inherit parent plan
            industry: industry || null,
          }).returning()

          childOrgs.push({ id: childOrg.id, name: entity.name, country: entity.country })

          // Link in entity group for consolidation
          await db.insert(schema.entityGroupMembers).values({
            groupId: entityGroup.id,
            orgId: childOrg.id,
            entityName: entity.name,
            entityType: entity.type || 'subsidiary',
            country: entity.country,
            localCurrency: entity.currency || 'USD',
            ownershipPercent: 100,
            consolidationMethod: entity.type === 'joint_venture' ? 'proportional' : 'full',
          })
        }
      }

      return NextResponse.json({
        ok: true,
        organization: parentOrg,
        entityGroup,
        childOrganizations: childOrgs,
      })
    } else {
      // --- Single Entity Creation (original behavior) ---
      const [org] = await db.insert(schema.organizations).values({
        name,
        slug,
        industry: industry || null,
        country: country || null,
        plan: plan || 'free',
        size: size || null,
      }).returning()

      return NextResponse.json({ ok: true, organization: org })
    }
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

// Simple country-to-currency mapping for the API side
const COUNTRY_CURRENCIES: Record<string, string> = {
  'Ghana': 'GHS', 'Nigeria': 'NGN', 'Kenya': 'KES', 'South Africa': 'ZAR',
  'Tanzania': 'TZS', 'Rwanda': 'RWF', 'Morocco': 'MAD', 'Egypt': 'EGP',
  'United States': 'USD', 'Canada': 'CAD', 'Mexico': 'MXN', 'Brazil': 'BRL',
  'United Kingdom': 'GBP', 'Germany': 'EUR', 'France': 'EUR', 'Netherlands': 'EUR',
  'Spain': 'EUR', 'Italy': 'EUR', 'Ireland': 'EUR', 'Switzerland': 'CHF',
  'India': 'INR', 'Singapore': 'SGD', 'UAE': 'AED', 'Saudi Arabia': 'SAR',
  'Japan': 'JPY', 'China': 'CNY', 'Australia': 'AUD', 'New Zealand': 'NZD',
}

function getCurrencyForCountry(country: string): string | null {
  return COUNTRY_CURRENCIES[country] || null
}
