/**
 * Load Test Seed Script — inserts 1,200 employees and related data into the DB.
 *
 * Usage:
 *   npx tsx scripts/seed-load-test.ts
 *
 * Reads DATABASE_URL from .env.local (no dotenv dependency).
 * Inserts in batches of 100 to avoid timeouts on Neon Serverless.
 */

import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from '../src/lib/db/schema'
import * as fs from 'fs'
import * as path from 'path'
import { generateLoadTestData } from '../src/lib/seed/generate-load-test-data'

// ── Load .env.local ─────────────────────────────────────────
const envPath = path.resolve(__dirname, '../.env.local')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const value = trimmed.slice(eqIdx + 1).trim()
    if (!process.env[key]) {
      process.env[key] = value
    }
  }
}

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL not found in .env.local')
  process.exit(1)
}

const sql = neon(process.env.DATABASE_URL!)
const db = drizzle(sql, { schema })

const BATCH_SIZE = 100

// ── Batch Insert Helper ─────────────────────────────────────
async function batchInsert(
  table: Parameters<typeof db.insert>[0],
  rows: Record<string, any>[],
  label: string,
) {
  if (rows.length === 0) {
    console.log(`  [${label}] 0 rows — skipped`)
    return
  }
  const total = rows.length
  let inserted = 0
  const startTime = Date.now()

  for (let i = 0; i < total; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE)
    try {
      await (db.insert(table) as any).values(batch as any).onConflictDoNothing()
    } catch (err: any) {
      console.error(`  [${label}] Batch ${Math.floor(i / BATCH_SIZE) + 1} failed: ${err.message}`)
      // Continue with remaining batches
      continue
    }
    inserted += batch.length
    const pct = Math.round((inserted / total) * 100)
    process.stdout.write(`\r  [${label}] ${inserted}/${total} (${pct}%)`)
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
  console.log(`\r  [${label}] ${inserted}/${total} done in ${elapsed}s`)
}

// ── Strip internal fields ───────────────────────────────────
function stripInternal(rows: Record<string, any>[]): Record<string, any>[] {
  return rows.map(({ _monthlySalaryCents, ...rest }) => rest)
}

// ── Main ────────────────────────────────────────────────────
async function main() {
  console.log('=== Tempo Load Test Seeder ===\n')
  console.log('Generating data...')

  const data = generateLoadTestData(1200)

  console.log('\nInserting into database...\n')
  const t0 = Date.now()

  // 1. Organization
  await batchInsert(schema.organizations, [data.organization], 'organizations')

  // 2. Departments
  await batchInsert(schema.departments, data.departments, 'departments')

  // 3. Employees (strip _monthlySalaryCents)
  await batchInsert(schema.employees, stripInternal(data.employees), 'employees')

  // 4. Payroll runs
  await batchInsert(schema.payrollRuns, data.payrollRuns, 'payroll_runs')

  // 5. Payroll entries (largest table: ~14,400 rows)
  await batchInsert(schema.employeePayrollEntries, data.payrollEntries, 'payroll_entries')

  // 6. Leave requests
  await batchInsert(schema.leaveRequests, data.leaveRequests, 'leave_requests')

  // 7. Expense reports
  await batchInsert(schema.expenseReports, data.expenseReports, 'expense_reports')

  // 8. Expense items
  await batchInsert(schema.expenseItems, data.expenseItems, 'expense_items')

  // 9. Goals
  await batchInsert(schema.goals, data.goals, 'goals')

  // 10. Review cycles
  await batchInsert(schema.reviewCycles, data.reviewCycles, 'review_cycles')

  // 11. Reviews
  await batchInsert(schema.reviews, data.reviews, 'reviews')

  // 12. Benefit plans
  await batchInsert(schema.benefitPlans, data.benefitPlans, 'benefit_plans')

  // 13. Benefit enrollments
  await batchInsert(schema.benefitEnrollments, data.benefitEnrollments, 'benefit_enrollments')

  const totalTime = ((Date.now() - t0) / 1000).toFixed(1)
  console.log(`\n=== Seeding complete in ${totalTime}s ===`)
  console.log(`Organization ID: ${data.organization.id}`)
  console.log(`Organization slug: ${data.organization.slug}`)
}

main().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
