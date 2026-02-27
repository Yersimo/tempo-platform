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
// With neon-http (stateless), SET commands don't persist across queries.
// For production multi-tenant deployment:
// 1. Switch to @neondatabase/serverless WebSocket driver
// 2. Use db.transaction() to SET app.current_org_id per-request
// 3. Enable FORCE ROW LEVEL SECURITY on all tables
//
// Current enforcement is at the application layer (middleware + API routes).
// RLS provides defense-in-depth when activated with the WebSocket driver.
