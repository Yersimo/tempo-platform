import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'
import * as schema from '@/lib/db/schema'
import { eq, desc, count, and, isNull } from 'drizzle-orm'

// ---------------------------------------------------------------------------
// Platform Admin API — Cross-tenant operations for Tempo platform operators
// Auth: PLATFORM_ADMIN_SECRET via x-platform-admin-token header
// ---------------------------------------------------------------------------

function verifyPlatformAdmin(req: NextRequest): boolean {
  const secret = process.env.PLATFORM_ADMIN_SECRET
  if (!secret) return false
  const token = req.headers.get('x-platform-admin-token')
  return token === secret
}

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

// ---------------------------------------------------------------------------
// GET — Read operations
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  if (!verifyPlatformAdmin(req)) return unauthorized()

  const { searchParams } = new URL(req.url)
  const action = searchParams.get('action')

  try {
    switch (action) {
      case 'dashboard': {
        const [orgsResult] = await db.select({ count: count() }).from(schema.organizations)
        const [empsResult] = await db.select({ count: count() }).from(schema.employees)
        const [activeOrgsResult] = await db
          .select({ count: count() })
          .from(schema.organizations)
          .where(eq(schema.organizations.isActive, true))

        // Revenue approximation from plan distribution
        const planCounts = await db
          .select({
            plan: schema.organizations.plan,
            count: count(),
          })
          .from(schema.organizations)
          .where(eq(schema.organizations.isActive, true))
          .groupBy(schema.organizations.plan)

        const planPricing: Record<string, number> = {
          free: 0,
          starter: 4900,
          professional: 14900,
          enterprise: 49900,
        }
        const mrr = planCounts.reduce((sum, p) => sum + (planPricing[p.plan] || 0) * p.count, 0)

        // Alerts count
        const [unresolvedAlerts] = await db
          .select({ count: count() })
          .from(schema.platformAlerts)
          .where(eq(schema.platformAlerts.isResolved, false))

        // Open tickets
        const [openTickets] = await db
          .select({ count: count() })
          .from(schema.supportTickets)
          .where(eq(schema.supportTickets.status, 'open'))

        // Health check
        let healthStatus: 'ok' | 'degraded' | 'down' = 'ok'
        try {
          await db.execute(sql`SELECT 1`)
        } catch {
          healthStatus = 'down'
        }

        return NextResponse.json({
          totalOrgs: orgsResult.count,
          totalEmployees: empsResult.count,
          activeOrgs: activeOrgsResult.count,
          mrr,
          planDistribution: planCounts,
          unresolvedAlerts: unresolvedAlerts.count,
          openTickets: openTickets.count,
          healthStatus,
        })
      }

      case 'tenants': {
        const orgs = await db
          .select({
            id: schema.organizations.id,
            name: schema.organizations.name,
            slug: schema.organizations.slug,
            plan: schema.organizations.plan,
            industry: schema.organizations.industry,
            country: schema.organizations.country,
            isActive: schema.organizations.isActive,
            stripeCustomerId: schema.organizations.stripeCustomerId,
            createdAt: schema.organizations.createdAt,
            updatedAt: schema.organizations.updatedAt,
          })
          .from(schema.organizations)
          .orderBy(desc(schema.organizations.createdAt))

        // Get employee counts per org
        const empCounts = await db
          .select({
            orgId: schema.employees.orgId,
            count: count(),
          })
          .from(schema.employees)
          .where(eq(schema.employees.isActive, true))
          .groupBy(schema.employees.orgId)

        const empCountMap = new Map(empCounts.map(e => [e.orgId, e.count]))

        const tenantsWithCounts = orgs.map(org => ({
          ...org,
          employeeCount: empCountMap.get(org.id) || 0,
        }))

        return NextResponse.json({ tenants: tenantsWithCounts })
      }

      case 'tenant-detail': {
        const orgId = searchParams.get('orgId')
        if (!orgId) return NextResponse.json({ error: 'orgId required' }, { status: 400 })

        const [org] = await db
          .select()
          .from(schema.organizations)
          .where(eq(schema.organizations.id, orgId))

        if (!org) return NextResponse.json({ error: 'Org not found' }, { status: 404 })

        const employees = await db
          .select({
            id: schema.employees.id,
            fullName: schema.employees.fullName,
            email: schema.employees.email,
            jobTitle: schema.employees.jobTitle,
            role: schema.employees.role,
            isActive: schema.employees.isActive,
            hireDate: schema.employees.hireDate,
          })
          .from(schema.employees)
          .where(eq(schema.employees.orgId, orgId))
          .orderBy(desc(schema.employees.createdAt))

        const usage = await db
          .select()
          .from(schema.tenantUsageMetrics)
          .where(eq(schema.tenantUsageMetrics.orgId, orgId))
          .orderBy(desc(schema.tenantUsageMetrics.metricDate))
          .limit(30)

        const tickets = await db
          .select()
          .from(schema.supportTickets)
          .where(eq(schema.supportTickets.orgId, orgId))
          .orderBy(desc(schema.supportTickets.createdAt))
          .limit(20)

        return NextResponse.json({ org, employees, usage, tickets })
      }

      case 'usage-metrics': {
        const orgId = searchParams.get('orgId')
        const query = orgId
          ? db.select().from(schema.tenantUsageMetrics).where(eq(schema.tenantUsageMetrics.orgId, orgId))
          : db.select().from(schema.tenantUsageMetrics)

        const metrics = await query.orderBy(desc(schema.tenantUsageMetrics.metricDate)).limit(90)
        return NextResponse.json({ metrics })
      }

      case 'alerts': {
        const alerts = await db
          .select()
          .from(schema.platformAlerts)
          .orderBy(desc(schema.platformAlerts.createdAt))
          .limit(100)
        return NextResponse.json({ alerts })
      }

      case 'tickets': {
        const tickets = await db
          .select()
          .from(schema.supportTickets)
          .orderBy(desc(schema.supportTickets.createdAt))
          .limit(100)

        return NextResponse.json({ tickets })
      }

      case 'ticket-detail': {
        const ticketId = searchParams.get('ticketId')
        if (!ticketId) return NextResponse.json({ error: 'ticketId required' }, { status: 400 })

        const [ticket] = await db
          .select()
          .from(schema.supportTickets)
          .where(eq(schema.supportTickets.id, ticketId))

        if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })

        const messages = await db
          .select()
          .from(schema.supportTicketMessages)
          .where(eq(schema.supportTicketMessages.ticketId, ticketId))
          .orderBy(schema.supportTicketMessages.createdAt)

        return NextResponse.json({ ticket, messages })
      }

      case 'system-health': {
        const start = Date.now()
        let dbStatus: 'ok' | 'degraded' | 'down' = 'ok'
        let dbLatency = 0

        try {
          const dbStart = Date.now()
          await db.execute(sql`SELECT 1`)
          dbLatency = Date.now() - dbStart
        } catch {
          dbStatus = 'down'
        }

        // DB stats
        let tableCount = 0
        let dbSize = '0'
        try {
          const tcResult = await db.execute(sql`SELECT count(*) as cnt FROM information_schema.tables WHERE table_schema = 'public'`)
          const tcRows = tcResult as unknown as Record<string, unknown>[]
          if (tcRows.length > 0) tableCount = Number((tcRows[0] as any).cnt) || 0

          const dsResult = await db.execute(sql`SELECT pg_size_pretty(pg_database_size(current_database())) as size`)
          const dsRows = dsResult as unknown as Record<string, unknown>[]
          if (dsRows.length > 0) dbSize = (dsRows[0] as any).size || '0'
        } catch { /* ignore */ }

        return NextResponse.json({
          status: dbStatus,
          latencyMs: Date.now() - start,
          database: { status: dbStatus, latencyMs: dbLatency, tableCount, size: dbSize },
          uptime: process.uptime?.() || 0,
          nodeVersion: process.version,
          env: process.env.NODE_ENV || 'development',
        })
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }
  } catch (error: any) {
    console.error('[platform-admin] GET error:', error)
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}

// ---------------------------------------------------------------------------
// POST — Write operations
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  if (!verifyPlatformAdmin(req)) return unauthorized()

  try {
    const body = await req.json()
    const { action } = body

    switch (action) {
      case 'disable-tenant': {
        const { orgId } = body
        if (!orgId) return NextResponse.json({ error: 'orgId required' }, { status: 400 })

        await db
          .update(schema.organizations)
          .set({ isActive: false, updatedAt: new Date() })
          .where(eq(schema.organizations.id, orgId))

        return NextResponse.json({ ok: true })
      }

      case 'enable-tenant': {
        const { orgId } = body
        if (!orgId) return NextResponse.json({ error: 'orgId required' }, { status: 400 })

        await db
          .update(schema.organizations)
          .set({ isActive: true, updatedAt: new Date() })
          .where(eq(schema.organizations.id, orgId))

        return NextResponse.json({ ok: true })
      }

      case 'update-plan': {
        const { orgId, plan } = body
        if (!orgId || !plan) return NextResponse.json({ error: 'orgId and plan required' }, { status: 400 })

        const validPlans = ['free', 'starter', 'professional', 'enterprise']
        if (!validPlans.includes(plan)) {
          return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
        }

        await db
          .update(schema.organizations)
          .set({ plan, updatedAt: new Date() })
          .where(eq(schema.organizations.id, orgId))

        return NextResponse.json({ ok: true })
      }

      case 'resolve-alert': {
        const { alertId, resolvedBy } = body
        if (!alertId) return NextResponse.json({ error: 'alertId required' }, { status: 400 })

        await db
          .update(schema.platformAlerts)
          .set({
            isResolved: true,
            resolvedAt: new Date(),
            resolvedBy: resolvedBy || null,
          })
          .where(eq(schema.platformAlerts.id, alertId))

        return NextResponse.json({ ok: true })
      }

      case 'respond-ticket': {
        const { ticketId, message, senderId } = body
        if (!ticketId || !message) {
          return NextResponse.json({ error: 'ticketId and message required' }, { status: 400 })
        }

        await db.insert(schema.supportTicketMessages).values({
          ticketId,
          senderType: 'support',
          senderId: senderId || '00000000-0000-0000-0000-000000000000',
          message,
        })

        // Auto-update ticket status to in_progress if it was open
        await db
          .update(schema.supportTickets)
          .set({ status: 'in_progress', updatedAt: new Date() })
          .where(and(eq(schema.supportTickets.id, ticketId), eq(schema.supportTickets.status, 'open')))

        return NextResponse.json({ ok: true })
      }

      case 'update-ticket-status': {
        const { ticketId, status, resolution } = body
        if (!ticketId || !status) {
          return NextResponse.json({ error: 'ticketId and status required' }, { status: 400 })
        }

        const updateData: Record<string, any> = { status, updatedAt: new Date() }
        if (status === 'resolved' || status === 'closed') {
          updateData.resolvedAt = new Date()
          if (resolution) updateData.resolution = resolution
        }

        await db
          .update(schema.supportTickets)
          .set(updateData)
          .where(eq(schema.supportTickets.id, ticketId))

        return NextResponse.json({ ok: true })
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }
  } catch (error: any) {
    console.error('[platform-admin] POST error:', error)
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}
