import { db } from '@/lib/db'
import { tenantUsageMetrics } from '@/lib/db/schema'
import { sql } from 'drizzle-orm'

/**
 * Lightweight usage tracking utility.
 * Upserts per-tenant daily usage counters using ON CONFLICT to increment.
 */
export async function trackUsage(
  orgId: string,
  metric: 'api_calls' | 'login_count' | 'emails_sent' | 'active_users' | 'payroll_runs_processed'
) {
  const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD

  try {
    // Use raw SQL for upsert with ON CONFLICT increment
    await db.execute(sql`
      INSERT INTO tenant_usage_metrics (id, org_id, metric_date, ${sql.raw(metric)})
      VALUES (gen_random_uuid(), ${orgId}, ${today}, 1)
      ON CONFLICT (org_id, metric_date)
      DO UPDATE SET ${sql.raw(metric)} = tenant_usage_metrics.${sql.raw(metric)} + 1
    `)
  } catch (error) {
    // Usage tracking should never block the main request
    console.error('[usage-tracker] Failed to track usage:', error)
  }
}

/**
 * Track storage usage (absolute value, not increment)
 */
export async function trackStorageUsage(orgId: string, storageBytes: number) {
  const today = new Date().toISOString().slice(0, 10)

  try {
    await db.execute(sql`
      INSERT INTO tenant_usage_metrics (id, org_id, metric_date, storage_bytes)
      VALUES (gen_random_uuid(), ${orgId}, ${today}, ${storageBytes})
      ON CONFLICT (org_id, metric_date)
      DO UPDATE SET storage_bytes = ${storageBytes}
    `)
  } catch (error) {
    console.error('[usage-tracker] Failed to track storage:', error)
  }
}
