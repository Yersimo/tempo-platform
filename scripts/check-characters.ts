import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from '../src/lib/db/schema'
import { eq, and, or } from 'drizzle-orm'
import * as fs from 'fs'
import * as path from 'path'
import * as crypto from 'crypto'

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

// Password hashing (same as auth.ts)
async function deriveKey(password: string, salt: Uint8Array): Promise<ArrayBuffer> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits'])
  return crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: salt as any, iterations: 100_000 }, key, 256)
}
function toHex(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf)
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}
async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(32))
  const hash = await deriveKey(password, salt)
  return `pbkdf2:${toHex(salt)}:${toHex(hash)}`
}

async function main() {
  const emails = [
    'amara@africabankgroup.com',
    'kofi@africabankgroup.com',
    'abena@africabankgroup.com',
    'admin@africabankgroup.com',
  ]

  const [org] = await db.select().from(schema.organizations).where(eq(schema.organizations.slug, 'africa-bank-group'))
  if (!org) { console.log('No org found'); return }
  const orgId = org.id
  console.log('Org:', org.name, '(' + orgId + ')\n')

  // Get departments
  const depts = await db.select().from(schema.departments).where(eq(schema.departments.orgId, orgId))
  const deptMap: Record<string, string> = {}
  for (const d of depts) deptMap[d.name] = d.id

  // Check which characters exist
  const missing: string[] = []
  for (const email of emails) {
    const rows = await db.select({
      id: schema.employees.id,
      fullName: schema.employees.fullName,
      email: schema.employees.email,
      role: schema.employees.role,
      level: schema.employees.level,
      jobTitle: schema.employees.jobTitle,
      country: schema.employees.country,
      departmentId: schema.employees.departmentId,
      managerId: schema.employees.managerId,
      passwordHash: schema.employees.passwordHash,
    }).from(schema.employees).where(eq(schema.employees.email, email))

    if (rows.length) {
      const r = rows[0]
      const hasPassword = r.passwordHash ? r.passwordHash.substring(0, 10) + '...' : 'NO PASSWORD'
      console.log(`✅ ${r.fullName} | ${r.email} | ${r.role} | ${r.level} | ${r.jobTitle} | ${r.country} | ${hasPassword}`)
    } else {
      console.log(`❌ MISSING: ${email}`)
      missing.push(email)
    }
  }

  // Create missing characters
  if (missing.length > 0) {
    console.log('\n--- Creating missing characters ---')
    const pw = await hashPassword('AfricaBank2026!')

    // Find Kwame (admin) to use as reference for manager IDs
    const [admin] = await db.select({ id: schema.employees.id }).from(schema.employees)
      .where(eq(schema.employees.email, 'admin@africabankgroup.com'))
    const adminId = admin?.id

    // Find a manager-level person in Risk & Compliance or Retail Banking to be Kofi's manager
    const directors = await db.select({ id: schema.employees.id, fullName: schema.employees.fullName, level: schema.employees.level, departmentId: schema.employees.departmentId })
      .from(schema.employees)
      .where(and(eq(schema.employees.orgId, orgId), eq(schema.employees.level, 'Director')))

    for (const email of missing) {
      if (email === 'amara@africabankgroup.com') {
        // Need Kofi first to set as manager — check if Kofi exists or will be created
        const [kofi] = await db.select({ id: schema.employees.id }).from(schema.employees)
          .where(eq(schema.employees.email, 'kofi@africabankgroup.com'))

        const [amara] = await db.insert(schema.employees).values({
          orgId,
          departmentId: deptMap['Retail Banking'],
          fullName: 'Amara Mensah',
          firstName: 'Amara',
          lastName: 'Mensah',
          email: 'amara@africabankgroup.com',
          phone: '+233 24 555 1001',
          jobTitle: 'Credit Analyst',
          level: 'Analyst',
          country: 'GH',
          role: 'employee',
          managerId: kofi?.id || adminId,
          hireDate: '2024-06-15',
          passwordHash: pw,
          isActive: true,
          emailVerified: true,
          bankName: 'Ecobank Ghana',
          bankCode: '130100',
          bankAccountNumber: '1301005551001',
          bankAccountName: 'Amara Mensah',
          bankCountry: 'GH',
          taxIdNumber: 'GH-TIN-AMARA01',
        }).returning()
        console.log(`  Created: ${amara.fullName} (${amara.id})`)

        // If Kofi was already created, update Amara's managerId
        if (kofi) {
          await db.update(schema.employees).set({ managerId: kofi.id }).where(eq(schema.employees.id, amara.id))
        }
      }

      if (email === 'kofi@africabankgroup.com') {
        const retailDirector = directors.find(d => d.departmentId === deptMap['Retail Banking'])
        const [kofi] = await db.insert(schema.employees).values({
          orgId,
          departmentId: deptMap['Retail Banking'],
          fullName: 'Kofi Acheampong',
          firstName: 'Kofi',
          lastName: 'Acheampong',
          email: 'kofi@africabankgroup.com',
          phone: '+233 24 555 2001',
          jobTitle: 'Branch Manager',
          level: 'Manager',
          country: 'GH',
          role: 'manager',
          managerId: retailDirector?.id || adminId,
          hireDate: '2020-03-01',
          passwordHash: pw,
          isActive: true,
          emailVerified: true,
          bankName: 'Ghana Commercial Bank',
          bankCode: '040100',
          bankAccountNumber: '0401005552001',
          bankAccountName: 'Kofi Acheampong',
          bankCountry: 'GH',
          taxIdNumber: 'GH-TIN-KOFI01',
        }).returning()
        console.log(`  Created: ${kofi.fullName} (${kofi.id})`)

        // Update Amara's managerId to Kofi
        const [amara] = await db.select({ id: schema.employees.id }).from(schema.employees)
          .where(eq(schema.employees.email, 'amara@africabankgroup.com'))
        if (amara) {
          await db.update(schema.employees).set({ managerId: kofi.id }).where(eq(schema.employees.id, amara.id))
          console.log(`  Updated Amara's manager to Kofi`)
        }
      }

      if (email === 'abena@africabankgroup.com') {
        const [abena] = await db.insert(schema.employees).values({
          orgId,
          departmentId: deptMap['Human Resources'],
          fullName: 'Abena Osei',
          firstName: 'Abena',
          lastName: 'Osei',
          email: 'abena@africabankgroup.com',
          phone: '+233 24 555 3001',
          jobTitle: 'HR Business Partner',
          level: 'Manager',
          country: 'GH',
          role: 'hrbp',
          managerId: adminId,
          hireDate: '2019-09-01',
          passwordHash: pw,
          isActive: true,
          emailVerified: true,
          bankName: 'Stanbic Bank Ghana',
          bankCode: '190100',
          bankAccountNumber: '1901005553001',
          bankAccountName: 'Abena Osei',
          bankCountry: 'GH',
          taxIdNumber: 'GH-TIN-ABENA01',
        }).returning()
        console.log(`  Created: ${abena.fullName} (${abena.id})`)
      }
    }
  }

  // Final check
  console.log('\n--- Final Character Sheet ---')
  for (const email of emails) {
    const rows = await db.select({
      id: schema.employees.id,
      fullName: schema.employees.fullName,
      email: schema.employees.email,
      role: schema.employees.role,
      level: schema.employees.level,
      jobTitle: schema.employees.jobTitle,
      country: schema.employees.country,
      managerId: schema.employees.managerId,
    }).from(schema.employees).where(eq(schema.employees.email, email))
    if (rows.length) {
      const r = rows[0]
      // Look up manager name
      let mgrName = 'none'
      if (r.managerId) {
        const [mgr] = await db.select({ fullName: schema.employees.fullName }).from(schema.employees).where(eq(schema.employees.id, r.managerId))
        mgrName = mgr?.fullName || 'unknown'
      }
      console.log(`${r.fullName} | ${r.email} | ${r.role} | ${r.level} | ${r.jobTitle} | ${r.country} | manager: ${mgrName}`)
    }
  }
}

main().catch(console.error)
