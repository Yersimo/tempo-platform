import { db, schema } from '@/lib/db'
import { eq, and, count } from 'drizzle-orm'

export interface PlanLimits {
  maxEmployees: number
  modules: string[]
  features: string[]
  maxAdmins: number
  maxIntegrations: number
  apiRateLimit: number  // requests per minute
  storageGB: number
  supportLevel: 'community' | 'email' | 'priority' | 'dedicated'
}

// Plan definitions
export const PLAN_CONFIGS: Record<string, PlanLimits> = {
  free: {
    maxEmployees: 10,
    modules: ['payroll', 'time-attendance', 'performance'],
    features: ['basic-reports'],
    maxAdmins: 1,
    maxIntegrations: 1,
    apiRateLimit: 30,
    storageGB: 1,
    supportLevel: 'community',
  },
  starter: {
    maxEmployees: 50,
    modules: ['payroll', 'expenses', 'time-attendance', 'performance', 'learning', 'benefits'],
    features: ['basic-reports', 'csv-export', 'email-notifications'],
    maxAdmins: 3,
    maxIntegrations: 3,
    apiRateLimit: 60,
    storageGB: 10,
    supportLevel: 'email',
  },
  professional: {
    maxEmployees: 500,
    modules: ['payroll', 'expenses', 'learning', 'performance', 'recruiting', 'time-attendance', 'benefits', 'engagement', 'projects', 'finance'],
    features: ['basic-reports', 'advanced-reports', 'csv-export', 'pdf-export', 'email-notifications', 'slack-integration', 'api-access', 'sso', 'audit-trail'],
    maxAdmins: 10,
    maxIntegrations: 10,
    apiRateLimit: 100,
    storageGB: 50,
    supportLevel: 'priority',
  },
  enterprise: {
    maxEmployees: Infinity,
    modules: ['payroll', 'expenses', 'learning', 'performance', 'recruiting', 'time-attendance', 'benefits', 'engagement', 'projects', 'strategy', 'it-assets', 'finance', 'workflow-studio'],
    features: ['basic-reports', 'advanced-reports', 'csv-export', 'pdf-export', 'email-notifications', 'slack-integration', 'api-access', 'sso', 'audit-trail', 'custom-fields', 'white-label', 'dedicated-support', 'custom-integrations', 'multi-country-payroll', 'bank-file-generation'],
    maxAdmins: Infinity,
    maxIntegrations: Infinity,
    apiRateLimit: 500,
    storageGB: 500,
    supportLevel: 'dedicated',
  },
}

export interface PlanCheckResult {
  allowed: boolean
  reason?: string
  currentUsage?: number
  limit?: number
  upgradeRequired?: string  // recommended plan to upgrade to
}

/**
 * Check if an org can add more employees.
 */
export async function checkEmployeeLimit(orgId: string): Promise<PlanCheckResult> {
  const [org] = await db.select()
    .from(schema.organizations)
    .where(eq(schema.organizations.id, orgId))

  if (!org) return { allowed: false, reason: 'Organization not found' }

  const plan = PLAN_CONFIGS[org.plan] || PLAN_CONFIGS.free
  
  const [result] = await db.select({ count: count() })
    .from(schema.employees)
    .where(and(
      eq(schema.employees.orgId, orgId),
      eq(schema.employees.isActive, true)
    ))

  const currentCount = Number(result?.count || 0)

  if (currentCount >= plan.maxEmployees) {
    const nextPlan = getNextPlan(org.plan)
    return {
      allowed: false,
      reason: `Employee limit reached (${currentCount}/${plan.maxEmployees})`,
      currentUsage: currentCount,
      limit: plan.maxEmployees,
      upgradeRequired: nextPlan,
    }
  }

  return { allowed: true, currentUsage: currentCount, limit: plan.maxEmployees }
}

/**
 * Check if an org has access to a specific module.
 */
export async function checkModuleAccess(orgId: string, module: string): Promise<PlanCheckResult> {
  const [org] = await db.select()
    .from(schema.organizations)
    .where(eq(schema.organizations.id, orgId))

  if (!org) return { allowed: false, reason: 'Organization not found' }

  const plan = PLAN_CONFIGS[org.plan] || PLAN_CONFIGS.free

  if (!plan.modules.includes(module)) {
    const requiredPlan = Object.entries(PLAN_CONFIGS).find(([, config]) => config.modules.includes(module))
    return {
      allowed: false,
      reason: `Module '${module}' is not available on the ${org.plan} plan`,
      upgradeRequired: requiredPlan?.[0],
    }
  }

  return { allowed: true }
}

/**
 * Check if an org has access to a specific feature.
 */
export async function checkFeatureAccess(orgId: string, feature: string): Promise<PlanCheckResult> {
  const [org] = await db.select()
    .from(schema.organizations)
    .where(eq(schema.organizations.id, orgId))

  if (!org) return { allowed: false, reason: 'Organization not found' }

  const plan = PLAN_CONFIGS[org.plan] || PLAN_CONFIGS.free

  if (!plan.features.includes(feature)) {
    const requiredPlan = Object.entries(PLAN_CONFIGS).find(([, config]) => config.features.includes(feature))
    return {
      allowed: false,
      reason: `Feature '${feature}' requires ${requiredPlan?.[0] || 'a higher'} plan`,
      upgradeRequired: requiredPlan?.[0],
    }
  }

  return { allowed: true }
}

/**
 * Get the full plan info for an org.
 */
export async function getOrgPlanInfo(orgId: string): Promise<{
  plan: string
  limits: PlanLimits
  usage: {
    employees: number
    admins: number
    integrations: number
  }
} | null> {
  const [org] = await db.select()
    .from(schema.organizations)
    .where(eq(schema.organizations.id, orgId))

  if (!org) return null

  const plan = PLAN_CONFIGS[org.plan] || PLAN_CONFIGS.free

  const [empCount] = await db.select({ count: count() })
    .from(schema.employees)
    .where(and(eq(schema.employees.orgId, orgId), eq(schema.employees.isActive, true)))

  const [adminCount] = await db.select({ count: count() })
    .from(schema.employees)
    .where(and(
      eq(schema.employees.orgId, orgId),
      eq(schema.employees.isActive, true),
    ))

  const [intCount] = await db.select({ count: count() })
    .from(schema.integrations)
    .where(eq(schema.integrations.orgId, orgId))

  return {
    plan: org.plan,
    limits: plan,
    usage: {
      employees: Number(empCount?.count || 0),
      admins: Number(adminCount?.count || 0),
      integrations: Number(intCount?.count || 0),
    },
  }
}

function getNextPlan(current: string): string {
  const order = ['free', 'starter', 'professional', 'enterprise']
  const idx = order.indexOf(current)
  return idx < order.length - 1 ? order[idx + 1] : current
}
