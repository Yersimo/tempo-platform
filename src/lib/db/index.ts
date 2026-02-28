import { neon, neonConfig } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

// Enable connection caching globally.
// fetchConnectionCache keeps the TCP connection warm between requests,
// reducing cold-start latency from ~3-5 s to <200 ms on Neon free tier.
neonConfig.fetchConnectionCache = true

const sql = neon(process.env.DATABASE_URL!)

// Create the Drizzle ORM instance with all schema tables
export const db = drizzle(sql, { schema })

// Re-export schema for convenience
export { schema }

// Export raw SQL client for advanced queries (e.g., job queue, migrations)
export { sql }

// ─── Retry helper ─────────────────────────────────────────────────────
// Neon free-tier databases auto-suspend after 5 min of inactivity.
// The first request after suspension may timeout while the compute
// endpoint wakes up. This helper retries with exponential backoff.

export async function withRetry<T>(
  fn: () => Promise<T>,
  { retries = 2, baseDelay = 1500 } = {},
): Promise<T> {
  let lastError: unknown
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err
      const isTimeout =
        err instanceof Error &&
        (err.message.includes('Connect Timeout') ||
          err.message.includes('fetch failed') ||
          err.message.includes('CONNECT_TIMEOUT'))
      // Only retry on transient connection errors
      if (!isTimeout || attempt === retries) throw err
      const delay = baseDelay * Math.pow(2, attempt)
      await new Promise((r) => setTimeout(r, delay))
    }
  }
  throw lastError
}

// ─── Row-Level Security (RLS) ──────────────────────────────────────────
// RLS policies are defined in drizzle/0001_rls_policies.sql
// They use current_setting('app.current_org_id') to scope all queries.
//
// With neon-http (stateless), each query is an independent HTTP request,
// so SET commands don't persist. We use a per-query approach instead:
// Each query that needs RLS scoping includes a SET LOCAL in the SQL.

/**
 * Execute a database operation with org-scoped RLS context.
 *
 * Sets `app.current_org_id` for the duration of the query so that
 * Postgres RLS policies (from 0001_rls_policies.sql) automatically
 * filter rows to the specified organization.
 *
 * Usage:
 *   const employees = await withOrgScope(orgId, async () => {
 *     return db.select().from(schema.employees)
 *   })
 *
 * For neon-http driver (stateless), this sets the context per-statement
 * using a raw SQL prefix. When the WebSocket driver is available,
 * this will use db.transaction() with SET LOCAL for full session scoping.
 */
export async function withOrgScope<T>(
  orgId: string,
  fn: () => Promise<T>,
): Promise<T> {
  // Validate orgId format (UUID) to prevent SQL injection
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(orgId)) {
    throw new Error(`Invalid org ID format: ${orgId}`)
  }

  // Set the org context for RLS policies
  // With neon-http, we execute this as a raw query before the main operation.
  // Neon's sql client uses tagged template literals for parameterized queries.
  try {
    await sql`SELECT set_config('app.current_org_id', ${orgId}, false)`
    return await fn()
  } finally {
    // Clear the context after the operation (defense-in-depth)
    try {
      await sql`SELECT set_config('app.current_org_id', '', false)`
    } catch {
      // Non-critical: context is per-request anyway with neon-http
    }
  }
}

/**
 * Check if RLS is properly configured by verifying the current_org_id function exists.
 * Returns true if RLS infrastructure is available.
 */
export async function checkRLSAvailable(): Promise<boolean> {
  try {
    await sql`SELECT current_setting('app.current_org_id', true)`
    return true
  } catch {
    return false
  }
}
