import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

// Create the Neon SQL client
const sql = neon(process.env.DATABASE_URL!)

// Create the Drizzle ORM instance with all schema tables
export const db = drizzle(sql, { schema })

// Re-export schema for convenience
export { schema }

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
