/**
 * Seed script for NextLend — real UUID-based org for E2E persistence testing.
 *
 * Usage:
 *   npx tsx scripts/seed-nextlend.ts
 *
 * Creates:
 *   - Organization: "NextLend" (professional plan, fintech industry)
 *   - 3 departments: Engineering, Risk & Compliance, Operations
 *   - 1 admin user: admin@nextlend.io / NextLend2026!
 *   - 1 department head (manager role)
 *   - 1 regular employee
 *
 * All IDs are real UUIDs so the full persistence chain works:
 *   store → apiPost → POST /api/data → Drizzle → Neon PostgreSQL → GET → UI
 */

import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { eq } from 'drizzle-orm'
import * as schema from '../src/lib/db/schema'
import * as fs from 'fs'
import * as path from 'path'

// Load .env.local manually (no dotenv dependency needed)
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
  console.error('❌ DATABASE_URL not found in .env.local')
  process.exit(1)
}

const sql = neon(process.env.DATABASE_URL!)
const db = drizzle(sql, { schema })

// ─── Password Hashing (PBKDF2 — mirrors src/lib/auth.ts) ──────────────
async function deriveKey(password: string, salt: Uint8Array): Promise<ArrayBuffer> {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  )
  return crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt: salt as unknown as BufferSource,
      iterations: 100_000,
    },
    keyMaterial,
    256
  )
}

function toHex(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer)
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(32))
  const derived = await deriveKey(password, salt)
  return `pbkdf2:${toHex(salt)}:${toHex(derived)}`
}

// ─── Main Seed ─────────────────────────────────────────────────────────
async function main() {
  console.log('🏦 Seeding NextLend test organization...\n')

  // Always clean up any existing NextLend org (idempotent)
  // CASCADE on org_id FK will remove all related records
  try {
    const deleted = await sql`DELETE FROM organizations WHERE slug = 'nextlend' RETURNING id`
    if (deleted.length > 0) {
      console.log(`⚠️  Cleaned up existing NextLend org (id: ${deleted[0].id})\n`)
    }
  } catch (cleanupErr) {
    console.log('   (No existing NextLend org to clean up)')
  }

  // ─── 1. Create Organization ──────────────────────────────────────────
  const [org] = await db.insert(schema.organizations).values({
    name: 'NextLend',
    slug: 'nextlend',
    plan: 'professional',
    industry: 'Financial Services',
    size: '51-200',
    country: 'United States',
    isActive: true,
    onboardingCompleted: true,
    enabledModules: JSON.stringify([
      'people', 'performance', 'compensation', 'learning', 'engagement',
      'payroll', 'time', 'benefits', 'expenses', 'recruiting', 'it',
      'finance', 'travel', 'documents', 'compliance', 'workers-comp',
      'identity', 'chat', 'groups', 'app-studio', 'sandbox', 'headcount',
    ]),
  }).returning()

  console.log(`✅ Organization: "${org.name}" (${org.id})`)

  // ─── 2. Create Departments ───────────────────────────────────────────
  const [engDept] = await db.insert(schema.departments).values({
    orgId: org.id,
    name: 'Engineering',
  }).returning()

  const [riskDept] = await db.insert(schema.departments).values({
    orgId: org.id,
    name: 'Risk & Compliance',
  }).returning()

  const [opsDept] = await db.insert(schema.departments).values({
    orgId: org.id,
    name: 'Operations',
  }).returning()

  console.log(`✅ Departments: Engineering (${engDept.id}), Risk (${riskDept.id}), Ops (${opsDept.id})`)

  // ─── 3. Create Employees ─────────────────────────────────────────────
  const adminPasswordHash = await hashPassword('NextLend2026!')
  const managerPasswordHash = await hashPassword('NextLend2026!')
  const employeePasswordHash = await hashPassword('NextLend2026!')

  // Admin user (owner role — full permissions)
  const [admin] = await db.insert(schema.employees).values({
    orgId: org.id,
    departmentId: opsDept.id,
    fullName: 'Alex Chen',
    firstName: 'Alex',
    lastName: 'Chen',
    email: 'admin@nextlend.io',
    phone: '+1-555-0100',
    jobTitle: 'Chief Technology Officer',
    level: 'C-Suite',
    country: 'United States',
    role: 'owner',
    hireDate: '2024-01-15',
    passwordHash: adminPasswordHash,
    isActive: true,
    emailVerified: true,
  }).returning()

  // Engineering Manager
  const [manager] = await db.insert(schema.employees).values({
    orgId: org.id,
    departmentId: engDept.id,
    fullName: 'Jordan Park',
    firstName: 'Jordan',
    lastName: 'Park',
    email: 'jordan@nextlend.io',
    phone: '+1-555-0101',
    jobTitle: 'VP of Engineering',
    level: 'VP',
    country: 'United States',
    role: 'manager',
    managerId: admin.id,
    hireDate: '2024-03-01',
    passwordHash: managerPasswordHash,
    isActive: true,
    emailVerified: true,
  }).returning()

  // Regular employee
  const [employee] = await db.insert(schema.employees).values({
    orgId: org.id,
    departmentId: engDept.id,
    fullName: 'Sam Rivera',
    firstName: 'Sam',
    lastName: 'Rivera',
    email: 'sam@nextlend.io',
    phone: '+1-555-0102',
    jobTitle: 'Senior Software Engineer',
    level: 'Senior',
    country: 'United States',
    role: 'employee',
    managerId: manager.id,
    hireDate: '2024-06-01',
    passwordHash: employeePasswordHash,
    isActive: true,
    emailVerified: true,
  }).returning()

  // Update department heads
  await db.update(schema.departments)
    .set({ headId: manager.id })
    .where(eq(schema.departments.id, engDept.id))

  await db.update(schema.departments)
    .set({ headId: admin.id })
    .where(eq(schema.departments.id, opsDept.id))

  console.log(`✅ Employees:`)
  console.log(`   Admin:   Alex Chen   (${admin.id}) - owner`)
  console.log(`   Manager: Jordan Park (${manager.id}) - manager`)
  console.log(`   IC:      Sam Rivera  (${employee.id}) - employee`)

  // ─── 4. Create Comp Band (needed for Compensation E2E test) ──────────
  const [compBand] = await db.insert(schema.compBands).values({
    orgId: org.id,
    roleTitle: 'Senior Engineer',
    level: 'Senior',
    country: 'United States',
    currency: 'USD',
    minSalary: 14000000, // $140,000
    midSalary: 17000000, // $170,000
    maxSalary: 20000000, // $200,000
  }).returning()

  console.log(`✅ Comp Band: Senior Engineer (${compBand.id})`)

  // ─── 5. Verify Records ──────────────────────────────────────────────
  console.log('\n─── Verification ───────────────────────────────────────')

  const orgCheck = await sql`SELECT id, name, slug, plan FROM organizations WHERE id = ${org.id}`
  console.log(`  Org in DB:       ${orgCheck.length > 0 ? '✅' : '❌'} ${JSON.stringify(orgCheck[0])}`)

  const deptCheck = await sql`SELECT id, name FROM departments WHERE org_id = ${org.id}`
  console.log(`  Departments:     ${deptCheck.length === 3 ? '✅' : '❌'} ${deptCheck.length} departments`)

  const empCheck = await sql`SELECT id, full_name, role, email FROM employees WHERE org_id = ${org.id}`
  console.log(`  Employees:       ${empCheck.length === 3 ? '✅' : '❌'} ${empCheck.length} employees`)

  const sessionCheck = await sql`SELECT COUNT(*) FROM sessions WHERE employee_id = ${admin.id}`
  console.log(`  Sessions:        (clean — ${sessionCheck[0].count} existing)`)

  // ─── Summary ─────────────────────────────────────────────────────────
  console.log('\n═══════════════════════════════════════════════════════')
  console.log('  NextLend E2E Test Org — Ready!')
  console.log('═══════════════════════════════════════════════════════')
  console.log(`  Org ID:      ${org.id}`)
  console.log(`  Admin ID:    ${admin.id}`)
  console.log(`  Login Email: admin@nextlend.io`)
  console.log(`  Password:    NextLend2026!`)
  console.log(`  Role:        owner (full permissions)`)
  console.log('═══════════════════════════════════════════════════════')
  console.log('\n  To test: Go to /login → enter admin@nextlend.io / NextLend2026!')
  console.log('  JWT will carry real UUIDs → full DB persistence chain active')
  console.log('')
}

main().catch((err) => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})
