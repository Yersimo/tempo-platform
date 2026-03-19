/**
 * Seed script for Eco Ghana — real UUID-based org for full payroll E2E testing.
 *
 * Usage:
 *   npx tsx scripts/seed-eco-ghana.ts
 *
 * Creates:
 *   - Organization: "Eco Ghana" (professional plan, banking industry, Ghana)
 *   - 8 departments with heads assigned
 *   - 12 employees with Ghanaian bank details, salaries, roles
 *   - Approved salary records so payroll engine can calculate
 *   - Compensation bands for all levels
 *
 * All amounts are in CENTS (e.g. 4500000 = GHS 45,000)
 */

import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { eq } from 'drizzle-orm'
import * as schema from '../src/lib/db/schema'
import * as fs from 'fs'
import * as path from 'path'

// Load .env.local manually
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
    'raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']
  )
  return crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: salt as unknown as BufferSource, iterations: 100_000 },
    keyMaterial, 256
  )
}

function toHex(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer)
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}

async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(32))
  const derived = await deriveKey(password, salt)
  return `pbkdf2:${toHex(salt)}:${toHex(derived)}`
}

// ─── Employee Data ─────────────────────────────────────────────────────
const PASSWORD = 'EcoGhana2026!'

interface EmployeeData {
  fullName: string
  firstName: string
  lastName: string
  email: string
  phone: string
  jobTitle: string
  level: string
  role: 'owner' | 'admin' | 'hrbp' | 'manager' | 'employee'
  dept: string
  monthlySalaryGHS: number // in whole GHS (will be converted to cents)
  bankName: string
  bankCode: string
  bankAccountNumber: string
  taxId: string
  capabilities?: string
}

const EMPLOYEES: EmployeeData[] = [
  { fullName: 'Simon Rey', firstName: 'Simon', lastName: 'Rey', email: 'simon@ecoghana.com', phone: '+233-20-100-0001', jobTitle: 'Chief Executive Officer', level: 'C-Suite', role: 'owner', dept: 'Executive', monthlySalaryGHS: 45000, bankName: 'GCB Bank', bankCode: 'GCB', bankAccountNumber: '1200034567890', taxId: 'GHA-TIN-001' },
  { fullName: 'Abena Mensah', firstName: 'Abena', lastName: 'Mensah', email: 'abena@ecoghana.com', phone: '+233-20-100-0002', jobTitle: 'HR Director', level: 'Director', role: 'hrbp', dept: 'Human Resources', monthlySalaryGHS: 28000, bankName: 'Ecobank Ghana', bankCode: 'ECO', bankAccountNumber: '6200045678901', taxId: 'GHA-TIN-002', capabilities: 'payroll_officer' },
  { fullName: 'Kofi Asante', firstName: 'Kofi', lastName: 'Asante', email: 'kofi@ecoghana.com', phone: '+233-20-100-0003', jobTitle: 'Chief Financial Officer', level: 'C-Suite', role: 'admin', dept: 'Finance', monthlySalaryGHS: 38000, bankName: 'Stanbic Bank Ghana', bankCode: 'STB', bankAccountNumber: '0400056789012', taxId: 'GHA-TIN-003', capabilities: 'finance_approver,payroll_officer' },
  { fullName: 'Esi Owusu', firstName: 'Esi', lastName: 'Owusu', email: 'esi@ecoghana.com', phone: '+233-20-100-0004', jobTitle: 'Head of Internal Control', level: 'Director', role: 'admin', dept: 'Internal Control', monthlySalaryGHS: 32000, bankName: 'Absa Bank Ghana', bankCode: 'ABS', bankAccountNumber: '0700067890123', taxId: 'GHA-TIN-004', capabilities: 'payroll_officer' },
  { fullName: 'Kwame Boateng', firstName: 'Kwame', lastName: 'Boateng', email: 'kwame@ecoghana.com', phone: '+233-20-100-0005', jobTitle: 'Head of Retail Banking', level: 'Director', role: 'manager', dept: 'Retail Banking', monthlySalaryGHS: 30000, bankName: 'GCB Bank', bankCode: 'GCB', bankAccountNumber: '1200078901234', taxId: 'GHA-TIN-005' },
  { fullName: 'Yaw Darko', firstName: 'Yaw', lastName: 'Darko', email: 'yaw@ecoghana.com', phone: '+233-20-100-0006', jobTitle: 'Head of Corporate Banking', level: 'Director', role: 'manager', dept: 'Corporate Banking', monthlySalaryGHS: 30000, bankName: 'Ecobank Ghana', bankCode: 'ECO', bankAccountNumber: '6200089012345', taxId: 'GHA-TIN-006' },
  { fullName: 'Akua Frimpong', firstName: 'Akua', lastName: 'Frimpong', email: 'akua@ecoghana.com', phone: '+233-20-100-0007', jobTitle: 'Chief Technology Officer', level: 'C-Suite', role: 'manager', dept: 'Technology', monthlySalaryGHS: 35000, bankName: 'Stanbic Bank Ghana', bankCode: 'STB', bankAccountNumber: '0400090123456', taxId: 'GHA-TIN-007' },
  { fullName: 'Nana Agyeman', firstName: 'Nana', lastName: 'Agyeman', email: 'nana@ecoghana.com', phone: '+233-20-100-0008', jobTitle: 'Operations Lead', level: 'Senior', role: 'employee', dept: 'Operations', monthlySalaryGHS: 22000, bankName: 'Absa Bank Ghana', bankCode: 'ABS', bankAccountNumber: '0700001234567', taxId: 'GHA-TIN-008' },
  { fullName: 'Ama Osei', firstName: 'Ama', lastName: 'Osei', email: 'ama@ecoghana.com', phone: '+233-20-100-0009', jobTitle: 'Relationship Manager', level: 'Mid', role: 'employee', dept: 'Retail Banking', monthlySalaryGHS: 18000, bankName: 'GCB Bank', bankCode: 'GCB', bankAccountNumber: '1200012345678', taxId: 'GHA-TIN-009' },
  { fullName: 'Kwesi Appiah', firstName: 'Kwesi', lastName: 'Appiah', email: 'kwesi@ecoghana.com', phone: '+233-20-100-0010', jobTitle: 'Software Engineer', level: 'Mid', role: 'employee', dept: 'Technology', monthlySalaryGHS: 20000, bankName: 'Ecobank Ghana', bankCode: 'ECO', bankAccountNumber: '6200023456789', taxId: 'GHA-TIN-010' },
  { fullName: 'Efua Asare', firstName: 'Efua', lastName: 'Asare', email: 'efua@ecoghana.com', phone: '+233-20-100-0011', jobTitle: 'Finance Analyst', level: 'Junior', role: 'employee', dept: 'Finance', monthlySalaryGHS: 16000, bankName: 'Stanbic Bank Ghana', bankCode: 'STB', bankAccountNumber: '0400034567890', taxId: 'GHA-TIN-011' },
  { fullName: 'Yaa Boadu', firstName: 'Yaa', lastName: 'Boadu', email: 'yaa@ecoghana.com', phone: '+233-20-100-0012', jobTitle: 'HR Coordinator', level: 'Junior', role: 'employee', dept: 'Human Resources', monthlySalaryGHS: 14000, bankName: 'Absa Bank Ghana', bankCode: 'ABS', bankAccountNumber: '0700045678901', taxId: 'GHA-TIN-012' },
]

// ─── Main Seed ─────────────────────────────────────────────────────────
async function main() {
  console.log('🏦 Seeding Eco Ghana organization...\n')

  // Idempotent: clean up existing
  try {
    const deleted = await sql`DELETE FROM organizations WHERE slug = 'eco-ghana' RETURNING id`
    if (deleted.length > 0) {
      console.log(`⚠️  Cleaned up existing Eco Ghana org (id: ${deleted[0].id})\n`)
    }
  } catch {
    console.log('   (No existing Eco Ghana org to clean up)')
  }

  // ─── 1. Create Organization ──────────────────────────────────────────
  const [org] = await db.insert(schema.organizations).values({
    name: 'Eco Ghana',
    slug: 'eco-ghana',
    plan: 'professional',
    industry: 'Banking',
    size: '51-200',
    country: 'Ghana',
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
  const deptNames = ['Executive', 'Human Resources', 'Finance', 'Internal Control', 'Retail Banking', 'Corporate Banking', 'Technology', 'Operations']
  const depts: Record<string, { id: string }> = {}

  for (const name of deptNames) {
    const [dept] = await db.insert(schema.departments).values({
      orgId: org.id,
      name,
    }).returning()
    depts[name] = dept
  }

  console.log(`✅ Departments: ${deptNames.length} created`)

  // ─── 3. Create Employees ─────────────────────────────────────────────
  const passwordHash = await hashPassword(PASSWORD)
  const employeeRecords: Record<string, { id: string }> = {}

  for (const emp of EMPLOYEES) {
    const [record] = await db.insert(schema.employees).values({
      orgId: org.id,
      departmentId: depts[emp.dept]?.id,
      fullName: emp.fullName,
      firstName: emp.firstName,
      lastName: emp.lastName,
      email: emp.email,
      phone: emp.phone,
      jobTitle: emp.jobTitle,
      level: emp.level,
      country: 'Ghana',
      role: emp.role,
      hireDate: '2024-01-15',
      passwordHash,
      isActive: true,
      emailVerified: true,
      // Bank Details
      bankName: emp.bankName,
      bankCode: emp.bankCode,
      bankAccountNumber: emp.bankAccountNumber,
      bankAccountName: emp.fullName,
      bankCountry: 'Ghana',
      // Tax
      taxIdNumber: emp.taxId,
      // Capabilities
      ...(emp.capabilities ? { capabilities: emp.capabilities } : {}),
    }).returning()

    employeeRecords[emp.email] = record
    console.log(`   👤 ${emp.fullName.padEnd(20)} ${emp.role.padEnd(10)} ${emp.email}`)
  }

  // Set manager relationships
  const simonId = employeeRecords['simon@ecoghana.com'].id
  for (const emp of EMPLOYEES) {
    if (emp.email !== 'simon@ecoghana.com') {
      // Directors report to CEO
      const isDirect = ['abena@ecoghana.com', 'kofi@ecoghana.com', 'esi@ecoghana.com', 'kwame@ecoghana.com', 'yaw@ecoghana.com', 'akua@ecoghana.com'].includes(emp.email)
      const managerId = isDirect ? simonId :
        emp.dept === 'Retail Banking' ? employeeRecords['kwame@ecoghana.com'].id :
        emp.dept === 'Technology' ? employeeRecords['akua@ecoghana.com'].id :
        emp.dept === 'Finance' ? employeeRecords['kofi@ecoghana.com'].id :
        emp.dept === 'Human Resources' ? employeeRecords['abena@ecoghana.com'].id :
        emp.dept === 'Operations' ? simonId : simonId

      await db.update(schema.employees)
        .set({ managerId })
        .where(eq(schema.employees.id, employeeRecords[emp.email].id))
    }
  }

  // Set department heads
  const headMapping: Record<string, string> = {
    'Executive': 'simon@ecoghana.com',
    'Human Resources': 'abena@ecoghana.com',
    'Finance': 'kofi@ecoghana.com',
    'Internal Control': 'esi@ecoghana.com',
    'Retail Banking': 'kwame@ecoghana.com',
    'Corporate Banking': 'yaw@ecoghana.com',
    'Technology': 'akua@ecoghana.com',
    'Operations': 'nana@ecoghana.com',
  }
  for (const [deptName, email] of Object.entries(headMapping)) {
    await db.update(schema.departments)
      .set({ headId: employeeRecords[email].id })
      .where(eq(schema.departments.id, depts[deptName].id))
  }

  console.log(`\n✅ ${EMPLOYEES.length} employees created with bank details`)

  // ─── 4. Create Salary Records (approved — needed for payroll engine) ─
  for (const emp of EMPLOYEES) {
    const annualSalaryCents = emp.monthlySalaryGHS * 12 * 100 // Annual in cents

    await db.insert(schema.salaryReviews).values({
      orgId: org.id,
      employeeId: employeeRecords[emp.email].id,
      proposedBy: simonId,
      currentSalary: annualSalaryCents,
      proposedSalary: annualSalaryCents,
      currency: 'GHS',
      justification: 'Initial salary on hire',
      status: 'approved',
      approvedBy: simonId,
    })
  }

  console.log(`✅ ${EMPLOYEES.length} salary records created (approved)`)

  // ─── 5. Create Comp Bands ────────────────────────────────────────────
  const bands = [
    { roleTitle: 'CEO', level: 'C-Suite', min: 40000, mid: 45000, max: 55000 },
    { roleTitle: 'CFO / CTO', level: 'C-Suite', min: 32000, mid: 38000, max: 45000 },
    { roleTitle: 'Director', level: 'Director', min: 25000, mid: 30000, max: 38000 },
    { roleTitle: 'Senior', level: 'Senior', min: 18000, mid: 22000, max: 28000 },
    { roleTitle: 'Mid-Level', level: 'Mid', min: 14000, mid: 18000, max: 22000 },
    { roleTitle: 'Junior', level: 'Junior', min: 10000, mid: 14000, max: 18000 },
  ]

  for (const band of bands) {
    await db.insert(schema.compBands).values({
      orgId: org.id,
      roleTitle: band.roleTitle,
      level: band.level,
      country: 'Ghana',
      currency: 'GHS',
      minSalary: band.min * 12 * 100, // Annual in cents
      midSalary: band.mid * 12 * 100,
      maxSalary: band.max * 12 * 100,
    })
  }

  console.log(`✅ ${bands.length} compensation bands created`)

  // ─── 6. Verify Records ──────────────────────────────────────────────
  console.log('\n─── Verification ───────────────────────────────────────')

  const orgCheck = await sql`SELECT id, name, slug, plan FROM organizations WHERE id = ${org.id}`
  console.log(`  Org in DB:       ${orgCheck.length > 0 ? '✅' : '❌'} ${orgCheck[0]?.name} (${orgCheck[0]?.plan})`)

  const deptCheck = await sql`SELECT COUNT(*) FROM departments WHERE org_id = ${org.id}`
  console.log(`  Departments:     ${Number(deptCheck[0].count) === 8 ? '✅' : '❌'} ${deptCheck[0].count} departments`)

  const empCheck = await sql`SELECT COUNT(*) FROM employees WHERE org_id = ${org.id}`
  console.log(`  Employees:       ${Number(empCheck[0].count) === 12 ? '✅' : '❌'} ${empCheck[0].count} employees`)

  const salaryCheck = await sql`SELECT COUNT(*) FROM salary_reviews WHERE org_id = ${org.id}`
  console.log(`  Salary Records:  ${Number(salaryCheck[0].count) === 12 ? '✅' : '❌'} ${salaryCheck[0].count} records`)

  const bankCheck = await sql`SELECT COUNT(*) FROM employees WHERE org_id = ${org.id} AND bank_account_number IS NOT NULL`
  console.log(`  Bank Details:    ${Number(bankCheck[0].count) === 12 ? '✅' : '❌'} ${bankCheck[0].count} with bank info`)

  // ─── Summary ─────────────────────────────────────────────────────────
  console.log('\n═══════════════════════════════════════════════════════════')
  console.log('  🏦 Eco Ghana — Ready for Payroll Testing!')
  console.log('═══════════════════════════════════════════════════════════')
  console.log(`  Org ID:     ${org.id}`)
  console.log(`  Country:    Ghana | Currency: GHS`)
  console.log(`  Employees:  12 (all with bank details + salaries)`)
  console.log('')
  console.log('  ┌─────────────────────────────────────────────────────┐')
  console.log('  │  LOGIN CREDENTIALS (all use password: EcoGhana2026!)│')
  console.log('  ├─────────────────────────────────────────────────────┤')
  console.log('  │  CEO (Owner):    simon@ecoghana.com                │')
  console.log('  │  HR Director:    abena@ecoghana.com                │')
  console.log('  │  CFO (Admin):    kofi@ecoghana.com                 │')
  console.log('  │  Internal Ctrl:  esi@ecoghana.com                  │')
  console.log('  │  Retail Mgr:     kwame@ecoghana.com                │')
  console.log('  │  Corp Mgr:       yaw@ecoghana.com                  │')
  console.log('  │  CTO:            akua@ecoghana.com                 │')
  console.log('  │  Ops Lead:       nana@ecoghana.com                 │')
  console.log('  │  Rel. Manager:   ama@ecoghana.com                  │')
  console.log('  │  Sw. Engineer:   kwesi@ecoghana.com                │')
  console.log('  │  Fin. Analyst:   efua@ecoghana.com                 │')
  console.log('  │  HR Coord:       yaa@ecoghana.com                  │')
  console.log('  └─────────────────────────────────────────────────────┘')
  console.log('')
  console.log('  Monthly Payroll Total: GHS 328,000')
  console.log('  Annual Payroll Total:  GHS 3,936,000')
  console.log('')
  console.log('  To test: /login → simon@ecoghana.com / EcoGhana2026!')
  console.log('═══════════════════════════════════════════════════════════\n')
}

main().catch((err) => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})
