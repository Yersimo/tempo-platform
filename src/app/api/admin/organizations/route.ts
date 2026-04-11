import { NextRequest, NextResponse } from 'next/server'
import { db, schema } from '@/lib/db'
import { eq, sql } from 'drizzle-orm'
import { getDemoDataForOrg } from '@/lib/demo-data'
import { hashPassword } from '@/lib/auth'
import { sendEmail } from '@/lib/email'

function generateTempPassword(): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const lower = 'abcdefghjkmnpqrstuvwxyz'
  const digits = '23456789'
  const special = '!@#$%&*'
  const all = upper + lower + digits + special

  // Guarantee at least one of each required character class
  let password = ''
  password += upper[Math.floor(Math.random() * upper.length)]
  password += lower[Math.floor(Math.random() * lower.length)]
  password += digits[Math.floor(Math.random() * digits.length)]
  password += special[Math.floor(Math.random() * special.length)]

  // Fill remaining 12 chars from the full set (total = 16)
  for (let i = 0; i < 12; i++) {
    password += all[Math.floor(Math.random() * all.length)]
  }

  // Shuffle the password so required chars aren't always at the start
  return password.split('').sort(() => Math.random() - 0.5).join('')
}

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
    const { name, slug, industry, country, plan, size, structureType, entities, accessControl, adminUser } = body

    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 })
    }

    // Validate admin user fields if provided
    if (adminUser?.email && !adminUser?.fullName) {
      return NextResponse.json({ error: 'Admin full name is required when email is provided' }, { status: 400 })
    }

    let createdOrg: { id: string; name: string; slug: string }
    let entityGroup = null
    let childOrganizations: Array<{ id: string; name: string; country: string }> = []

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

      createdOrg = parentOrg

      // 2. Create entity group for consolidation
      const consolidationCurrency = country
        ? getCurrencyForCountry(country) || 'USD'
        : 'USD'

      const [eg] = await db.insert(schema.entityGroups).values({
        name: `${name} Group`,
        description: `Multi-entity group for ${name}`,
        parentOrgId: parentOrg.id,
        consolidationCurrency,
      }).returning()

      entityGroup = eg

      // 3. Add parent as first member of entity group
      await db.insert(schema.entityGroupMembers).values({
        groupId: eg.id,
        orgId: parentOrg.id,
        entityName: name,
        entityType: 'parent',
        country: country || 'Unknown',
        localCurrency: consolidationCurrency,
        ownershipPercent: 100,
        consolidationMethod: 'full',
      })

      // 4. Create each subsidiary as a linked entity
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

          childOrganizations.push({ id: childOrg.id, name: entity.name, country: entity.country })

          // Link in entity group for consolidation
          await db.insert(schema.entityGroupMembers).values({
            groupId: eg.id,
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

      createdOrg = org
    }

    // --- Create first admin user if provided ---
    let welcomeEmailSent = false
    if (adminUser?.email) {
      const tempPassword = generateTempPassword()
      const passwordHash = await hashPassword(tempPassword)

      const [employee] = await db.insert(schema.employees).values({
        orgId: createdOrg.id,
        fullName: adminUser.fullName,
        email: adminUser.email,
        passwordHash,
        role: 'owner',
        jobTitle: adminUser.jobTitle || 'Administrator',
        isActive: true,
      }).returning()

      // Send welcome email with temporary password
      if (adminUser.sendWelcomeEmail) {
        const emailHtml = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f5f5f7;margin:0;padding:40px 20px">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
    <div style="background:#0f1117;padding:24px 32px">
      <span style="color:#004D40;font-size:20px;font-weight:500;letter-spacing:-0.035em">tempo</span>
    </div>
    <div style="padding:32px">
      <h2 style="margin:0 0 12px;font-size:20px;font-weight:600;color:#111">Welcome to Tempo, ${adminUser.fullName}!</h2>
      <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#555">
        Your organization <strong>${createdOrg.name}</strong> has been set up on the Tempo platform.
        You have been assigned as the organization owner.
      </p>
      <div style="background:#f9fafb;border:1px solid #eee;border-radius:8px;padding:20px;margin-bottom:20px">
        <p style="margin:0 0 12px;font-size:13px;font-weight:600;color:#333">Your Login Details</p>
        <table style="width:100%;font-size:13px;color:#555">
          <tr><td style="padding:4px 0;font-weight:500;width:120px">Login URL</td><td><a href="https://theworktempo.com/login" style="color:#004D40">https://theworktempo.com/login</a></td></tr>
          <tr><td style="padding:4px 0;font-weight:500">Email</td><td>${adminUser.email}</td></tr>
          <tr><td style="padding:4px 0;font-weight:500">Temp Password</td><td style="font-family:monospace;background:#fff3e0;padding:2px 8px;border-radius:4px;font-size:14px">${tempPassword}</td></tr>
        </table>
      </div>
      <p style="margin:0 0 20px;font-size:13px;color:#888">
        You'll be asked to change your password on first login.
        After logging in, you'll be guided through a quick setup wizard to configure your organization.
      </p>
      <a href="https://theworktempo.com/login" style="display:inline-block;padding:12px 28px;background:#004D40;color:#fff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600">Sign In to Tempo</a>
    </div>
    <div style="padding:16px 32px;background:#f9fafb;border-top:1px solid #eee">
      <p style="margin:0;font-size:12px;color:#999">Tempo - Unified Workforce Platform</p>
      <p style="margin:4px 0 0;font-size:11px;color:#bbb">This is an automated message. If you didn't expect this email, please contact your platform administrator.</p>
    </div>
  </div>
</body>
</html>`

        welcomeEmailSent = await sendEmail(adminUser.email, `Welcome to Tempo \u2014 ${createdOrg.name} is ready`, emailHtml)
      }

      // Audit log entry
      try {
        await db.insert(schema.auditLog).values({
          orgId: createdOrg.id,
          userId: employee.id,
          action: 'create',
          entityType: 'employee',
          entityId: employee.id,
          details: 'First admin created by platform admin',
        })
      } catch {
        // Audit log failure should not break org creation
        console.warn('[Admin] Failed to write audit log for first admin creation')
      }
    }

    // --- Build response ---
    const response: Record<string, unknown> = {
      ok: true,
      organization: createdOrg,
      welcomeEmailSent,
    }

    if (entityGroup) {
      response.entityGroup = entityGroup
      response.childOrganizations = childOrganizations
    }

    return NextResponse.json(response)
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
