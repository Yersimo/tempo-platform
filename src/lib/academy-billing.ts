/**
 * Academy Billing — Per-academy usage metering for Stripe.
 *
 * Reports participant counts to Stripe as usage events, checks plan limits,
 * and provides usage summaries for billing dashboards.
 *
 * Gracefully no-ops if STRIPE_SECRET_KEY is not configured.
 */

import { db, schema } from '@/lib/db'
import { eq, and, sql } from 'drizzle-orm'

// ============================================================
// TYPES
// ============================================================

interface AcademyUsageSummary {
  orgId: string
  plan: string
  totalAcademies: number
  totalParticipants: number
  totalCertificatesIssued: number
  academies: Array<{
    academyId: string
    name: string
    status: string
    participantCount: number
    activeParticipantCount: number
    certificatesIssued: number
  }>
}

interface AcademyPlanLimits {
  maxAcademies: number
  maxParticipantsPerAcademy: number
  maxTotalParticipants: number
  certificatesEnabled: boolean
  analyticsEnabled: boolean
  customBrandingEnabled: boolean
}

interface LimitCheckResult {
  withinLimits: boolean
  currentAcademies: number
  maxAcademies: number
  currentTotalParticipants: number
  maxTotalParticipants: number
  warnings: string[]
}

// ============================================================
// PLAN LIMITS (keyed by org plan tier)
// ============================================================

const PLAN_LIMITS: Record<string, AcademyPlanLimits> = {
  free: {
    maxAcademies: 1,
    maxParticipantsPerAcademy: 25,
    maxTotalParticipants: 25,
    certificatesEnabled: false,
    analyticsEnabled: false,
    customBrandingEnabled: false,
  },
  starter: {
    maxAcademies: 3,
    maxParticipantsPerAcademy: 100,
    maxTotalParticipants: 200,
    certificatesEnabled: true,
    analyticsEnabled: false,
    customBrandingEnabled: false,
  },
  professional: {
    maxAcademies: 10,
    maxParticipantsPerAcademy: 500,
    maxTotalParticipants: 2000,
    certificatesEnabled: true,
    analyticsEnabled: true,
    customBrandingEnabled: true,
  },
  enterprise: {
    maxAcademies: -1, // unlimited
    maxParticipantsPerAcademy: -1,
    maxTotalParticipants: -1,
    certificatesEnabled: true,
    analyticsEnabled: true,
    customBrandingEnabled: true,
  },
}

// ============================================================
// STRIPE CLIENT (lazy, matches billing.ts pattern)
// ============================================================

let stripeInstance: any = null

async function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) return null
  if (!stripeInstance) {
    const Stripe = (await import('stripe')).default
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-01-27.acacia' as any,
      typescript: true,
    })
  }
  return stripeInstance
}

// ============================================================
// 1. REPORT ACADEMY USAGE TO STRIPE
// ============================================================

/**
 * Report current participant count for a specific academy to Stripe.
 * Creates a usage record event for metered billing.
 * No-ops if Stripe is not configured.
 */
export async function reportAcademyUsage(
  orgId: string,
  academyId: string,
): Promise<{ reported: boolean; participantCount: number }> {
  // Get current participant count
  const [countResult] = await db.select({ count: sql<number>`count(*)::int` })
    .from(schema.academyParticipants)
    .where(and(
      eq(schema.academyParticipants.orgId, orgId),
      eq(schema.academyParticipants.academyId, academyId),
      eq(schema.academyParticipants.status, 'active'),
    ))

  const participantCount = countResult?.count || 0

  const stripe = await getStripe()
  if (!stripe) {
    return { reported: false, participantCount }
  }

  // Find org's Stripe customer
  const [org] = await db.select()
    .from(schema.organizations)
    .where(eq(schema.organizations.id, orgId))

  if (!org?.stripeCustomerId) {
    return { reported: false, participantCount }
  }

  try {
    // Find active subscription
    const subscriptions = await stripe.subscriptions.list({
      customer: org.stripeCustomerId,
      limit: 1,
      status: 'active',
    })

    if (subscriptions.data.length === 0) {
      return { reported: false, participantCount }
    }

    const subscriptionItem = subscriptions.data[0].items.data[0]
    if (!subscriptionItem) {
      return { reported: false, participantCount }
    }

    // Report usage event for academy participants
    await stripe.subscriptionItems.createUsageRecord(subscriptionItem.id, {
      quantity: participantCount,
      timestamp: Math.floor(Date.now() / 1000),
      action: 'set',
    })

    console.log(`[Academy Billing] Reported usage for academy ${academyId}: ${participantCount} participants`)
    return { reported: true, participantCount }
  } catch (error) {
    console.error(`[Academy Billing] Failed to report usage:`, error)
    return { reported: false, participantCount }
  }
}

// ============================================================
// 2. USAGE SUMMARY (for billing dashboard)
// ============================================================

/**
 * Get usage summary across all academies for an org.
 * Used by the billing dashboard to show current consumption.
 */
export async function getAcademyUsageSummary(orgId: string): Promise<AcademyUsageSummary> {
  const [org] = await db.select()
    .from(schema.organizations)
    .where(eq(schema.organizations.id, orgId))

  const plan = org?.plan || 'free'

  // Get all academies with participant counts
  const academyData = await db.select({
    academyId: schema.academies.id,
    name: schema.academies.name,
    status: schema.academies.status,
    participantCount: sql<number>`(
      SELECT count(*)::int FROM academy_participants
      WHERE academy_id = ${schema.academies.id} AND org_id = ${orgId}
    )`,
    activeParticipantCount: sql<number>`(
      SELECT count(*)::int FROM academy_participants
      WHERE academy_id = ${schema.academies.id} AND org_id = ${orgId} AND status = 'active'
    )`,
    certificatesIssued: sql<number>`(
      SELECT count(*)::int FROM academy_certificates
      WHERE academy_id = ${schema.academies.id} AND org_id = ${orgId} AND status = 'earned'
    )`,
  })
    .from(schema.academies)
    .where(eq(schema.academies.orgId, orgId))

  const totalParticipants = academyData.reduce((sum, a) => sum + a.participantCount, 0)
  const totalCerts = academyData.reduce((sum, a) => sum + a.certificatesIssued, 0)

  return {
    orgId,
    plan,
    totalAcademies: academyData.length,
    totalParticipants,
    totalCertificatesIssued: totalCerts,
    academies: academyData.map(a => ({
      academyId: a.academyId,
      name: a.name,
      status: a.status,
      participantCount: a.participantCount,
      activeParticipantCount: a.activeParticipantCount,
      certificatesIssued: a.certificatesIssued,
    })),
  }
}

// ============================================================
// 3. CHECK ACADEMY LIMITS
// ============================================================

/**
 * Check if the org has exceeded plan limits for academies.
 * Returns limit check result with warnings.
 */
export async function checkAcademyLimits(orgId: string): Promise<LimitCheckResult> {
  const [org] = await db.select()
    .from(schema.organizations)
    .where(eq(schema.organizations.id, orgId))

  const plan = org?.plan || 'free'
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free

  const [academyCount, totalParticipants] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` })
      .from(schema.academies)
      .where(eq(schema.academies.orgId, orgId)),
    db.select({ count: sql<number>`count(*)::int` })
      .from(schema.academyParticipants)
      .where(eq(schema.academyParticipants.orgId, orgId)),
  ])

  const currentAcademies = academyCount[0]?.count || 0
  const currentParticipants = totalParticipants[0]?.count || 0
  const warnings: string[] = []
  let withinLimits = true

  // Check academy count (-1 means unlimited)
  if (limits.maxAcademies > 0 && currentAcademies >= limits.maxAcademies) {
    warnings.push(`Academy limit reached: ${currentAcademies}/${limits.maxAcademies}`)
    withinLimits = false
  } else if (limits.maxAcademies > 0 && currentAcademies >= limits.maxAcademies * 0.8) {
    warnings.push(`Approaching academy limit: ${currentAcademies}/${limits.maxAcademies}`)
  }

  // Check total participant count
  if (limits.maxTotalParticipants > 0 && currentParticipants >= limits.maxTotalParticipants) {
    warnings.push(`Total participant limit reached: ${currentParticipants}/${limits.maxTotalParticipants}`)
    withinLimits = false
  } else if (limits.maxTotalParticipants > 0 && currentParticipants >= limits.maxTotalParticipants * 0.8) {
    warnings.push(`Approaching participant limit: ${currentParticipants}/${limits.maxTotalParticipants}`)
  }

  return {
    withinLimits,
    currentAcademies,
    maxAcademies: limits.maxAcademies,
    currentTotalParticipants: currentParticipants,
    maxTotalParticipants: limits.maxTotalParticipants,
    warnings,
  }
}

// ============================================================
// 4. GET PLAN LIMITS
// ============================================================

/**
 * Get the academy plan limits for an org based on their current plan.
 */
export async function getAcademyPlanLimits(orgId: string): Promise<AcademyPlanLimits & { plan: string }> {
  const [org] = await db.select()
    .from(schema.organizations)
    .where(eq(schema.organizations.id, orgId))

  const plan = org?.plan || 'free'
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free

  return { ...limits, plan }
}
