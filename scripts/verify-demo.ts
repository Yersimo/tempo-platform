import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from '../src/lib/db/schema'
import { eq, count } from 'drizzle-orm'
import * as fs from 'fs'
import * as path from 'path'

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
    if (!process.env[key]) process.env[key] = value
  }
}

const sql = neon(process.env.DATABASE_URL!)
const db = drizzle(sql, { schema })

async function main() {
  // 1. Find the org
  const [org] = await db.select().from(schema.organizations).where(eq(schema.organizations.slug, 'africa-bank-group'))
  if (!org) { console.log('No org found'); return }
  console.log(`Org: ${org.name} (${org.id})`)

  const orgId = org.id

  // 2. Count employees
  const [empCount] = await db.select({ count: count() }).from(schema.employees).where(eq(schema.employees.orgId, orgId))
  console.log(`Employees: ${empCount.count}`)

  // 3. Count by country
  const emps = await db.select({ country: schema.employees.country }).from(schema.employees).where(eq(schema.employees.orgId, orgId))
  const byCo: Record<string, number> = {}
  for (const e of emps) { byCo[e.country || 'null'] = (byCo[e.country || 'null'] || 0) + 1 }
  console.log(`  By country:`, byCo)

  // 4. Admin check
  const [admin] = await db.select({ id: schema.employees.id, fullName: schema.employees.fullName, email: schema.employees.email, passwordHash: schema.employees.passwordHash })
    .from(schema.employees).where(eq(schema.employees.email, 'admin@africabankgroup.com'))
  console.log(`Admin: ${admin?.fullName} (${admin?.email}) hash prefix: ${admin?.passwordHash?.substring(0, 10)}...`)

  // 5. Payroll runs
  const runs = await db.select({ period: schema.payrollRuns.period, status: schema.payrollRuns.status, country: schema.payrollRuns.country, empCount: schema.payrollRuns.employeeCount })
    .from(schema.payrollRuns).where(eq(schema.payrollRuns.orgId, orgId))
  console.log(`\nPayroll Runs: ${runs.length}`)
  for (const r of runs) console.log(`  ${r.period} ${r.country} — ${r.status} (${r.empCount} employees)`)

  // 6. Reviews
  const [revCount] = await db.select({ count: count() }).from(schema.reviews).where(eq(schema.reviews.orgId, orgId))
  console.log(`\nReviews: ${revCount.count}`)

  // 7. Goals
  const [goalCount] = await db.select({ count: count() }).from(schema.goals).where(eq(schema.goals.orgId, orgId))
  console.log(`Goals: ${goalCount.count}`)

  // 8. Job Postings
  const [jpCount] = await db.select({ count: count() }).from(schema.jobPostings).where(eq(schema.jobPostings.orgId, orgId))
  console.log(`Job Postings: ${jpCount.count}`)

  // 9. Sample employee names
  const sample = await db.select({ fullName: schema.employees.fullName, jobTitle: schema.employees.jobTitle, country: schema.employees.country, level: schema.employees.level })
    .from(schema.employees).where(eq(schema.employees.orgId, orgId))
  const shuffled = sample.sort(() => Math.random() - 0.5).slice(0, 10)
  console.log(`\nSample Employees:`)
  for (const e of shuffled) console.log(`  ${e.fullName} — ${e.jobTitle} (${e.country}, ${e.level})`)
}

main().catch(console.error)
