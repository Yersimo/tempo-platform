/**
 * Seed script for Africa Bank Group — premium demo environment for client presentations.
 *
 * Usage:
 *   npx tsx scripts/seed-africa-bank.ts
 *
 * Creates:
 *   - Organization: "Africa Bank Group" (enterprise plan, banking industry)
 *   - 12 departments across 3 countries (GH, NG, KE)
 *   - 1,000 employees with realistic African names, titles, levels, salaries
 *   - 1 completed payroll cycle (Feb 2026 — paid) + 1 draft (Mar 2026)
 *   - Active performance review cycle with reviews at various stages
 *   - 15 open job postings with 60+ applications
 *   - Goals, feedback, leave requests, courses, enrollments, surveys
 *   - Comp bands for all 3 countries
 *
 * Login credentials:
 *   admin@africabankgroup.com / AfricaBank2026!
 */

import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { eq } from 'drizzle-orm'
import * as schema from '../src/lib/db/schema'
import * as fs from 'fs'
import * as path from 'path'

// ─── Load .env.local ──────────────────────────────────────────────────
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
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in .env.local')
  process.exit(1)
}

const sql = neon(process.env.DATABASE_URL!)
const db = drizzle(sql, { schema })

// ─── Password Hashing (PBKDF2 — mirrors src/lib/auth.ts) ──────────────
async function deriveKey(password: string, salt: Uint8Array): Promise<ArrayBuffer> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits'])
  return crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: salt as unknown as BufferSource, iterations: 100_000 }, key, 256)
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

// ═══════════════════════════════════════════════════════════════════════
// NAME DATA — Authentic names from Ghana, Nigeria, Kenya
// ═══════════════════════════════════════════════════════════════════════

const NAMES: Record<string, { male: string[]; female: string[]; surnames: string[] }> = {
  GH: {
    male: [
      'Kwadwo','Kwabena','Kwaku','Yaw','Kofi','Kwame','Kwasi','Kojo','Kweku','Kwesi',
      'Akwasi','Osei','Opoku','Obeng','Mensah','Frimpong','Antwi','Kodzo','Komla','Edem',
      'Selorm','Mawuli','Senyo','Delali','Ebo','Kafui','Nii','Tetteh','Nortey','Ayitey',
      'Ebenezer','Ekow','Ato','Asamoah','Sarpong','Agyemang','Danso','Boakye','Addo','Emmanuel',
      'Joseph','Daniel','Samuel','Benjamin','Michael','Francis','Patrick','George','Richard','Stephen',
    ],
    female: [
      'Adwoa','Abenaa','Akua','Yaa','Afua','Ama','Akosua','Afia','Araba','Kukua',
      'Serwaah','Adoma','Asantewaa','Afi','Abla','Dzifa','Mawusi','Eyram','Sena','Esinam',
      'Naa','Dede','Korkor','Mansa','Gifty','Mavis','Faustina','Vida','Comfort','Abigail',
      'Priscilla','Emelia','Ernestina','Millicent','Felicia','Portia','Leticia','Doreen','Naomi','Grace',
      'Esther','Joyce','Linda','Beatrice','Eunice','Agnes','Lydia','Gladys','Sarah','Rebecca',
    ],
    surnames: [
      'Mensah','Owusu','Osei','Boateng','Appiah','Asare','Tetteh','Adjei','Yeboah','Asante',
      'Opoku','Addo','Ofori','Arthur','Adu','Amoah','Asamoah','Obeng','Frimpong','Antwi',
      'Boakye','Oppong','Acheampong','Ansah','Asiedu','Amponsah','Acquah','Nyarko','Sarpong','Agyemang',
      'Quaye','Darko','Donkor','Sackey','Annan','Danso','Nartey','Aboagye','Lamptey','Lartey',
      'Amoako','Agyei','Oduro','Okyere','Aidoo','Otoo','Eshun','Ankrah','Quarshie','Bortey',
    ],
  },
  NG: {
    male: [
      'Adebayo','Oluwafemi','Olatunde','Adewale','Ayodeji','Olajide','Babatunde','Adekunle','Oluwaseun','Ademola',
      'Olalekan','Temitayo','Femi','Kayode','Adeyemi','Segun','Bolaji','Chukwuemeka','Chinedu','Obinna',
      'Ikechukwu','Uchenna','Emeka','Nnamdi','Chijioke','Chidi','Ndubuisi','Chibueze','Uche','Obiora',
      'Ebuka','Kelechi','Tochukwu','Abubakar','Ibrahim','Musa','Sani','Usman','Aminu','Yusuf',
      'Haruna','Abdullahi','Garba','Kabiru','Aliyu','Shehu','Nuhu','Hamza','Danladi','Bala',
    ],
    female: [
      'Folasade','Titilayo','Abosede','Modupe','Yetunde','Omolara','Bukola','Jumoke','Adenike','Adeola',
      'Funke','Toyin','Bose','Iyabo','Mojisola','Damilola','Oluwakemi','Ngozi','Chioma','Ijeoma',
      'Chinyere','Ifeoma','Oluchi','Nneka','Amarachi','Amaka','Adaeze','Chiamaka','Chidinma','Ebere',
      'Nkiruka','Uju','Chinelo','Amina','Aisha','Fatima','Zainab','Hadiza','Hauwa','Halima',
      'Maryam','Habiba','Jamila','Safiya','Khadija','Binta','Salamatu','Nafisa','Rahinatu','Bilkisu',
    ],
    surnames: [
      'Adeyemi','Ogunleye','Afolabi','Oladele','Olatunji','Babatunde','Adekunle','Oluwole','Ayodele','Adebisi',
      'Olusola','Akinyemi','Ojo','Ajayi','Adeleke','Olayinka','Balogun','Adeniyi','Okafor','Okonkwo',
      'Nwankwo','Nwosu','Eze','Okechukwu','Nnadi','Nwachukwu','Anyanwu','Obi','Igwe','Okoro',
      'Uzoma','Onyeka','Nwogu','Chukwu','Ibrahim','Abubakar','Abdullahi','Bello','Adamu','Usman',
      'Suleiman','Mohammed','Aliyu','Yusuf','Garba','Musa','Lawal','Yakubu','Danjuma','Sanusi',
    ],
  },
  KE: {
    male: [
      'Kamau','Mwangi','Kariuki','Maina','Njoroge','Kimani','Gitau','Ngugi','Macharia','Chege',
      'Mbugua','Ndungu','Muriithi','Waweru','Gicheru','Otieno','Odhiambo','Ochieng','Omondi','Onyango',
      'Ouma','Okoth','Owino','Oginga','Odongo','Kipchoge','Kibet','Koech','Kipruto','Kiplagat',
      'Kiprotich','Kiplimo','Kimutai','Kiptoo','Cheruiyot','Juma','Hassan','Bakari','Hamisi','Rashid',
      'Peter','John','James','David','Brian','Kevin','Dennis','Robert','Martin','Philip',
    ],
    female: [
      'Wanjiku','Muthoni','Njeri','Nyambura','Wairimu','Wangui','Makena','Mumbi','Wangari','Mukami',
      'Wambui','Wacera','Nyokabi','Gathoni','Akinyi','Atieno','Adhiambo','Anyango','Achieng','Awino',
      'Akoth','Aoko','Apiyo','Chebet','Chepkoech','Chemutai','Cherono','Cheptoo','Chelimo','Cheruto',
      'Amani','Zawadi','Rehema','Zuri','Hadiya','Faith','Mercy','Lucy','Mary','Nancy',
      'Diana','Catherine','Alice','Rose','Grace','Esther','Joy','Irene','Agnes','Winnie',
    ],
    surnames: [
      'Mwangi','Kamau','Kariuki','Njoroge','Kimani','Macharia','Chege','Mbugua','Waweru','Ngugi',
      'Ndungu','Mungai','Mwaura','Mburu','Muriuki','Kinyanjui','Githinji','Otieno','Odhiambo','Ochieng',
      'Omondi','Onyango','Ouma','Okoth','Owino','Odongo','Owuor','Opiyo','Okello','Cheruiyot',
      'Kibet','Koech','Kiplagat','Rotich','Korir','Kiptoo','Kipruto','Kimutai','Mutua','Musyoka',
      'Wafula','Simiyu','Barasa','Wanjala','Wambua','Ndegwa','Gitonga','Gacheru','Njenga','Kirui',
    ],
  },
}

// ─── Deterministic random with seed ───────────────────────────────────
let _seed = 42
function seededRandom(): number {
  _seed = (_seed * 16807 + 0) % 2147483647
  return (_seed - 1) / 2147483646
}
function pick<T>(arr: readonly T[] | T[]): T {
  return arr[Math.floor(seededRandom() * arr.length)]
}
function pickN<T>(arr: readonly T[] | T[], n: number): T[] {
  const shuffled = [...arr].sort(() => seededRandom() - 0.5)
  return shuffled.slice(0, n)
}
function randomInt(min: number, max: number): number {
  return Math.floor(seededRandom() * (max - min + 1)) + min
}
function randomDate(start: string, end: string): string {
  const s = new Date(start).getTime()
  const e = new Date(end).getTime()
  return new Date(s + seededRandom() * (e - s)).toISOString().split('T')[0]
}

// ═══════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════

const ORG_SLUG = 'africa-bank-group'
const ORG_NAME = 'Africa Bank Group'
const ADMIN_EMAIL = 'admin@africabankgroup.com'
const ADMIN_PASSWORD = 'AfricaBank2026!'

const COUNTRIES = ['GH', 'NG', 'KE'] as const
type Country = typeof COUNTRIES[number]

const COUNTRY_FULL: Record<Country, string> = { GH: 'Ghana', NG: 'Nigeria', KE: 'Kenya' }
const COUNTRY_CURRENCY: Record<Country, string> = { GH: 'GHS', NG: 'NGN', KE: 'KES' }
const COUNTRY_PHONE_PREFIX: Record<Country, string> = { GH: '+233', NG: '+234', KE: '+254' }

// Employee distribution: 400 GH, 350 NG, 250 KE = 1000
const COUNTRY_HEADCOUNT: Record<Country, number> = { GH: 400, NG: 350, KE: 250 }

const DEPARTMENTS = [
  { name: 'Executive Leadership', headcountPct: 0.01 },
  { name: 'Retail Banking', headcountPct: 0.18 },
  { name: 'Corporate Banking', headcountPct: 0.12 },
  { name: 'Risk & Compliance', headcountPct: 0.10 },
  { name: 'Technology & Digital', headcountPct: 0.14 },
  { name: 'Human Resources', headcountPct: 0.06 },
  { name: 'Finance & Treasury', headcountPct: 0.10 },
  { name: 'Operations', headcountPct: 0.12 },
  { name: 'Legal & Governance', headcountPct: 0.04 },
  { name: 'Marketing & Communications', headcountPct: 0.05 },
  { name: 'Internal Audit', headcountPct: 0.04 },
  { name: 'Customer Experience', headcountPct: 0.04 },
]

const LEVELS = ['C-Suite', 'SVP', 'VP', 'Director', 'Senior Manager', 'Manager', 'Senior Analyst', 'Analyst', 'Associate', 'Officer']
const LEVEL_DISTRIBUTION = [0.005, 0.01, 0.03, 0.06, 0.10, 0.15, 0.18, 0.22, 0.15, 0.095] // sums to 1.0

const JOB_TITLES: Record<string, Record<string, string[]>> = {
  'Retail Banking': {
    'Director': ['Director of Retail Banking', 'Head of Branch Operations'],
    'Senior Manager': ['Senior Branch Manager', 'Senior Relationship Manager'],
    'Manager': ['Branch Manager', 'Relationship Manager', 'Credit Manager'],
    'Senior Analyst': ['Senior Credit Analyst', 'Senior Account Officer'],
    'Analyst': ['Credit Analyst', 'Loan Officer', 'Account Officer'],
    'Associate': ['Banking Associate', 'Customer Service Associate'],
    'Officer': ['Teller', 'Banking Officer', 'Loan Processing Officer'],
  },
  'Corporate Banking': {
    'Director': ['Director of Corporate Banking', 'Head of Trade Finance'],
    'Senior Manager': ['Senior Corporate Relationship Manager'],
    'Manager': ['Corporate Relationship Manager', 'Trade Finance Manager'],
    'Senior Analyst': ['Senior Corporate Analyst'],
    'Analyst': ['Corporate Analyst', 'Trade Finance Analyst'],
    'Associate': ['Corporate Banking Associate'],
    'Officer': ['Trade Finance Officer', 'Documentation Officer'],
  },
  'Technology & Digital': {
    'Director': ['Chief Technology Officer', 'Director of Engineering', 'Head of Digital Banking'],
    'Senior Manager': ['Engineering Manager', 'Platform Lead', 'Head of Cybersecurity'],
    'Manager': ['Software Development Manager', 'DevOps Manager', 'Data Engineering Manager'],
    'Senior Analyst': ['Senior Software Engineer', 'Senior Data Engineer', 'Senior Security Engineer'],
    'Analyst': ['Software Engineer', 'Data Engineer', 'Cloud Engineer', 'QA Engineer'],
    'Associate': ['Junior Developer', 'IT Support Associate'],
    'Officer': ['IT Support Officer', 'Helpdesk Officer'],
  },
  'Risk & Compliance': {
    'Director': ['Chief Risk Officer', 'Director of Compliance'],
    'Senior Manager': ['Senior Risk Manager', 'AML Manager'],
    'Manager': ['Risk Manager', 'Compliance Manager', 'Fraud Prevention Manager'],
    'Senior Analyst': ['Senior Risk Analyst', 'Senior Compliance Analyst'],
    'Analyst': ['Risk Analyst', 'Compliance Analyst', 'AML Analyst'],
    'Associate': ['Compliance Associate', 'Risk Associate'],
    'Officer': ['KYC Officer', 'Compliance Officer'],
  },
  'Human Resources': {
    'Director': ['Chief People Officer', 'Director of HR'],
    'Senior Manager': ['Head of Talent Acquisition', 'Head of L&D'],
    'Manager': ['HR Business Partner', 'Compensation & Benefits Manager', 'Talent Acquisition Manager'],
    'Senior Analyst': ['Senior HR Analyst', 'Senior Recruiter'],
    'Analyst': ['HR Analyst', 'Recruiter', 'L&D Specialist'],
    'Associate': ['HR Associate', 'Onboarding Coordinator'],
    'Officer': ['HR Officer', 'Payroll Officer'],
  },
  'Finance & Treasury': {
    'Director': ['Chief Financial Officer', 'Director of Treasury'],
    'Senior Manager': ['Head of Financial Planning', 'Head of Treasury Operations'],
    'Manager': ['Finance Manager', 'Treasury Manager', 'Tax Manager'],
    'Senior Analyst': ['Senior Financial Analyst', 'Senior Treasury Analyst'],
    'Analyst': ['Financial Analyst', 'Treasury Analyst', 'Tax Analyst'],
    'Associate': ['Accounting Associate', 'Finance Associate'],
    'Officer': ['Accounts Officer', 'Revenue Assurance Officer'],
  },
  'Operations': {
    'Director': ['Chief Operations Officer', 'Director of Operations'],
    'Senior Manager': ['Head of Payments', 'Head of Card Operations'],
    'Manager': ['Operations Manager', 'Payments Manager', 'Settlements Manager'],
    'Senior Analyst': ['Senior Operations Analyst'],
    'Analyst': ['Operations Analyst', 'Settlements Analyst'],
    'Associate': ['Operations Associate', 'Clearing Associate'],
    'Officer': ['Operations Officer', 'Back Office Officer'],
  },
  'Legal & Governance': {
    'Director': ['General Counsel', 'Head of Legal'],
    'Senior Manager': ['Senior Legal Counsel'],
    'Manager': ['Legal Manager', 'Company Secretary'],
    'Senior Analyst': ['Senior Legal Advisor'],
    'Analyst': ['Legal Analyst', 'Governance Analyst'],
    'Associate': ['Legal Associate', 'Paralegal'],
    'Officer': ['Legal Officer', 'Board Affairs Officer'],
  },
  'Marketing & Communications': {
    'Director': ['Chief Marketing Officer', 'Head of Communications'],
    'Manager': ['Marketing Manager', 'Brand Manager', 'Digital Marketing Manager'],
    'Senior Analyst': ['Senior Marketing Analyst'],
    'Analyst': ['Marketing Analyst', 'Social Media Specialist', 'Content Creator'],
    'Associate': ['Marketing Associate'],
    'Officer': ['Communications Officer', 'PR Officer'],
  },
  'Internal Audit': {
    'Director': ['Chief Audit Executive', 'Head of Internal Audit'],
    'Manager': ['Audit Manager', 'IT Audit Manager'],
    'Senior Analyst': ['Senior Internal Auditor'],
    'Analyst': ['Internal Auditor', 'IT Auditor'],
    'Associate': ['Audit Associate'],
    'Officer': ['Audit Officer'],
  },
  'Customer Experience': {
    'Director': ['Director of Customer Experience'],
    'Manager': ['Customer Experience Manager', 'Contact Centre Manager'],
    'Senior Analyst': ['Senior CX Analyst'],
    'Analyst': ['CX Analyst', 'Quality Assurance Analyst'],
    'Associate': ['CX Associate', 'Contact Centre Agent'],
    'Officer': ['Customer Service Officer'],
  },
  'Executive Leadership': {
    'C-Suite': ['Group CEO', 'Group CFO', 'Group COO', 'Group CRO', 'Group CTO', 'Group CHRO', 'Group General Counsel', 'Group Head of Audit', 'Group CMO', 'Group CDO'],
    'SVP': ['SVP Strategy', 'SVP Transformation'],
  },
}

// Annual salary ranges in local currency (whole units, not cents — NGN/KES values
// would overflow int32 if stored as cents). Comp bands & payroll entries use these directly.
const SALARY_RANGES: Record<Country, Record<string, [number, number]>> = {
  GH: { // GHS — Ghana Cedis
    'C-Suite': [120000, 250000], 'SVP': [90000, 150000], 'VP': [72000, 110000],
    'Director': [60000, 96000], 'Senior Manager': [48000, 72000], 'Manager': [36000, 54000],
    'Senior Analyst': [28000, 42000], 'Analyst': [20000, 32000], 'Associate': [15000, 24000],
    'Officer': [12000, 18000],
  },
  NG: { // NGN — Nigerian Naira
    'C-Suite': [45000000, 90000000], 'SVP': [30000000, 50000000], 'VP': [22000000, 38000000],
    'Director': [18000000, 28000000], 'Senior Manager': [12000000, 20000000], 'Manager': [8000000, 14000000],
    'Senior Analyst': [5500000, 9000000], 'Analyst': [3500000, 6500000], 'Associate': [2500000, 4500000],
    'Officer': [1800000, 3000000],
  },
  KE: { // KES — Kenyan Shillings
    'C-Suite': [18000000, 36000000], 'SVP': [12000000, 20000000], 'VP': [9000000, 15000000],
    'Director': [7200000, 12000000], 'Senior Manager': [5400000, 8400000], 'Manager': [3600000, 6000000],
    'Senior Analyst': [2400000, 4200000], 'Analyst': [1500000, 3000000], 'Associate': [960000, 1800000],
    'Officer': [600000, 1200000],
  },
}

const BANK_NAMES: Record<Country, string[]> = {
  GH: ['Ghana Commercial Bank', 'Ecobank Ghana', 'Stanbic Bank Ghana', 'CalBank', 'Fidelity Bank Ghana'],
  NG: ['Zenith Bank', 'First Bank of Nigeria', 'GTBank', 'Access Bank', 'UBA'],
  KE: ['Equity Bank', 'KCB Bank', 'Co-operative Bank', 'Stanbic Bank Kenya', 'NCBA'],
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN SEED FUNCTION
// ═══════════════════════════════════════════════════════════════════════

async function main() {
  console.log('🏦 Seeding Africa Bank Group demo environment...\n')

  // ─── 1. Clean up existing org ────────────────────────────────────────
  const existing = await db.select().from(schema.organizations).where(eq(schema.organizations.slug, ORG_SLUG))
  if (existing.length > 0) {
    console.log('🗑️  Removing existing Africa Bank Group data...')
    const oldOrgId = existing[0].id
    // payroll_audit_log has immutable rules (no delete/update) — must drop BEFORE cascade
    await sql`DROP RULE IF EXISTS payroll_audit_no_delete ON payroll_audit_log`
    await sql`DROP RULE IF EXISTS payroll_audit_no_update ON payroll_audit_log`
    await sql`DELETE FROM payroll_audit_log WHERE org_id = ${oldOrgId}`
    await db.delete(schema.organizations).where(eq(schema.organizations.slug, ORG_SLUG))
    // Restore immutable rules after cleanup
    await sql`CREATE RULE payroll_audit_no_delete AS ON DELETE TO payroll_audit_log DO INSTEAD NOTHING`
    await sql`CREATE RULE payroll_audit_no_update AS ON UPDATE TO payroll_audit_log DO INSTEAD NOTHING`
    console.log('   Done.\n')
  }

  // ─── 2. Create organization ─────────────────────────────────────────
  console.log('📋 Creating organization...')
  const [org] = await db.insert(schema.organizations).values({
    name: ORG_NAME,
    slug: ORG_SLUG,
    plan: 'enterprise',
    industry: 'Banking & Financial Services',
    size: '1001-5000',
    country: 'Pan-African',
    isActive: true,
    onboardingCompleted: true,
    enabledModules: JSON.stringify([
      'people', 'departments', 'performance', 'compensation', 'payroll', 'recruiting',
      'learning', 'surveys', 'mentoring', 'onboarding', 'offboarding', 'leave',
      'time-attendance', 'benefits', 'headcount', 'comp-planning', 'travel', 'expense',
      'it-cloud', 'identity', 'compliance', 'analytics', 'strategy', 'projects',
      'workflow-studio', 'chat', 'documents', 'global-workforce',
    ]),
  }).returning()
  const orgId = org.id
  console.log(`   ✅ ${ORG_NAME} (${orgId})\n`)

  // ─── 3. Create departments ──────────────────────────────────────────
  console.log('🏢 Creating departments...')
  const deptIds: Record<string, string> = {}
  for (const dept of DEPARTMENTS) {
    const [d] = await db.insert(schema.departments).values({
      orgId,
      name: dept.name,
    }).returning()
    deptIds[dept.name] = d.id
    console.log(`   ✅ ${dept.name}`)
  }
  console.log()

  // ─── 4. Generate 1,000 employees ───────────────────────────────────
  console.log('👥 Generating 1,000 employees...')
  const passwordHash = await hashPassword(ADMIN_PASSWORD)

  interface EmployeeRecord {
    id: string
    country: Country
    departmentId: string
    deptName: string
    level: string
    managerId: string | null
    annualSalary: number
    fullName: string
    jobTitle: string
    role: 'owner' | 'admin' | 'hrbp' | 'manager' | 'employee'
  }
  const allEmployees: EmployeeRecord[] = []
  const emailSet = new Set<string>()

  function makeEmail(firstName: string, lastName: string): string {
    let base = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@africabankgroup.com`
    if (emailSet.has(base)) {
      let i = 2
      while (emailSet.has(`${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@africabankgroup.com`)) i++
      base = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@africabankgroup.com`
    }
    emailSet.add(base)
    return base
  }

  // Build employee list per country
  for (const country of COUNTRIES) {
    const count = COUNTRY_HEADCOUNT[country]
    const nameData = NAMES[country]

    for (let i = 0; i < count; i++) {
      // Assign level based on distribution
      const rand = seededRandom()
      let cumulative = 0
      let level = 'Analyst'
      for (let l = 0; l < LEVELS.length; l++) {
        cumulative += LEVEL_DISTRIBUTION[l]
        if (rand <= cumulative) { level = LEVELS[l]; break }
      }

      // Assign department
      const deptRand = seededRandom()
      let deptCum = 0
      let deptName = DEPARTMENTS[0].name
      for (const dept of DEPARTMENTS) {
        deptCum += dept.headcountPct
        if (deptRand <= deptCum) { deptName = dept.name; break }
      }

      // Gender
      const isFemale = seededRandom() > 0.52 // ~48% female in banking
      const firstName = isFemale ? pick(nameData.female) : pick(nameData.male)
      const lastName = pick(nameData.surnames)
      const fullName = `${firstName} ${lastName}`

      // Job title
      const deptTitles = JOB_TITLES[deptName]
      let jobTitle = `${level} — ${deptName}`
      if (deptTitles) {
        const levelTitles = deptTitles[level]
        if (levelTitles && levelTitles.length > 0) {
          jobTitle = pick(levelTitles)
        } else {
          // Find closest level
          const fallbackLevels = Object.keys(deptTitles)
          if (fallbackLevels.length > 0) {
            jobTitle = pick(deptTitles[fallbackLevels[fallbackLevels.length - 1]]!)
          }
        }
      }

      // Salary
      const range = SALARY_RANGES[country][level] || SALARY_RANGES[country]['Analyst']
      const annualSalary = randomInt(range[0], range[1])

      // Role
      let role: 'owner' | 'admin' | 'hrbp' | 'manager' | 'employee' = 'employee'
      if (level === 'C-Suite') role = 'admin'
      else if (level === 'SVP' || level === 'VP') role = 'admin'
      else if (level === 'Director' || level === 'Senior Manager') role = 'manager'
      else if (deptName === 'Human Resources' && (level === 'Manager' || level === 'Senior Analyst')) role = 'hrbp'

      allEmployees.push({
        id: '', // will be filled after insert
        country,
        departmentId: deptIds[deptName],
        deptName,
        level,
        managerId: null,
        annualSalary,
        fullName,
        jobTitle,
        role,
      })
    }
  }

  // Insert in batches of 50
  const insertedEmployees: EmployeeRecord[] = []
  let adminId: string | null = null

  // Insert admin first
  const [adminEmp] = await db.insert(schema.employees).values({
    orgId,
    departmentId: deptIds['Executive Leadership'],
    fullName: 'Kwame Asante-Mensah',
    firstName: 'Kwame',
    lastName: 'Asante-Mensah',
    email: ADMIN_EMAIL,
    phone: '+233 24 000 0001',
    jobTitle: 'Group CEO',
    level: 'C-Suite',
    country: 'GH',
    role: 'owner',
    hireDate: '2018-03-15',
    passwordHash,
    isActive: true,
    emailVerified: true,
    bankName: 'Ecobank Ghana',
    bankCode: '130100',
    bankAccountNumber: '1301000000001',
    bankAccountName: 'Kwame Asante-Mensah',
    bankCountry: 'GH',
    taxIdNumber: 'GH-TIN-000001',
  }).returning()
  adminId = adminEmp.id
  console.log(`   ✅ Admin: ${adminEmp.fullName} (${ADMIN_EMAIL})`)

  // Now insert the 999 remaining employees
  const BATCH_SIZE = 50
  for (let batch = 0; batch < allEmployees.length; batch += BATCH_SIZE) {
    const batchItems = allEmployees.slice(batch, batch + BATCH_SIZE)
    const values = batchItems.map((emp, idx) => {
      const globalIdx = batch + idx
      const nameData = NAMES[emp.country]
      const isFemale = seededRandom() > 0.5
      const firstName = emp.fullName.split(' ')[0]
      const lastName = emp.fullName.split(' ').slice(1).join(' ')

      return {
        orgId,
        departmentId: emp.departmentId,
        fullName: emp.fullName,
        firstName,
        lastName,
        email: makeEmail(firstName, lastName),
        phone: `${COUNTRY_PHONE_PREFIX[emp.country]} ${randomInt(20, 99)} ${randomInt(100, 999)} ${randomInt(1000, 9999)}`,
        jobTitle: emp.jobTitle,
        level: emp.level,
        country: emp.country,
        role: emp.role,
        hireDate: randomDate('2015-01-01', '2025-12-31'),
        isActive: seededRandom() > 0.03, // 97% active
        emailVerified: true,
        bankName: pick(BANK_NAMES[emp.country]),
        bankCode: `${randomInt(100, 999)}${randomInt(100, 999)}`,
        bankAccountNumber: `${randomInt(1000000000, 9999999999)}`,
        bankAccountName: emp.fullName,
        bankCountry: emp.country,
        taxIdNumber: `${emp.country}-TIN-${String(globalIdx + 2).padStart(6, '0')}`,
      }
    })

    const inserted = await db.insert(schema.employees).values(values).returning()
    for (let i = 0; i < inserted.length; i++) {
      const emp = allEmployees[batch + i]
      emp.id = inserted[i].id
      insertedEmployees.push(emp)
    }
    process.stdout.write(`   📊 ${Math.min(batch + BATCH_SIZE, allEmployees.length)}/${allEmployees.length}\r`)
  }
  insertedEmployees.unshift({
    id: adminId,
    country: 'GH',
    departmentId: deptIds['Executive Leadership'],
    deptName: 'Executive Leadership',
    level: 'C-Suite',
    managerId: null,
    annualSalary: SALARY_RANGES.GH['C-Suite'][1],
    fullName: 'Kwame Asante-Mensah',
    jobTitle: 'Group CEO',
    role: 'owner',
  })
  console.log(`\n   ✅ 1,000 employees created across GH (${COUNTRY_HEADCOUNT.GH}), NG (${COUNTRY_HEADCOUNT.NG}), KE (${COUNTRY_HEADCOUNT.KE})\n`)

  // ─── 5. Set manager relationships ──────────────────────────────────
  console.log('🔗 Setting manager relationships...')
  // Group by department, assign directors as managers of their department
  const byDept = new Map<string, EmployeeRecord[]>()
  for (const emp of insertedEmployees) {
    const key = emp.deptName
    if (!byDept.has(key)) byDept.set(key, [])
    byDept.get(key)!.push(emp)
  }

  const levelOrder = ['C-Suite', 'SVP', 'VP', 'Director', 'Senior Manager', 'Manager', 'Senior Analyst', 'Analyst', 'Associate', 'Officer']
  for (const [deptName, members] of byDept.entries()) {
    members.sort((a, b) => levelOrder.indexOf(a.level) - levelOrder.indexOf(b.level))
    const deptHead = members[0]
    // CEO manages department heads
    if (deptHead.id !== adminId) {
      await db.update(schema.employees).set({ managerId: adminId }).where(eq(schema.employees.id, deptHead.id))
    }
    // Department head manages everyone else in the department
    for (let i = 1; i < members.length; i++) {
      // Find the most senior person above this employee's level
      let mgr = deptHead
      for (let j = i - 1; j >= 0; j--) {
        if (levelOrder.indexOf(members[j].level) < levelOrder.indexOf(members[i].level)) {
          mgr = members[j]
          break
        }
      }
      if (mgr.id !== members[i].id) {
        members[i].managerId = mgr.id
      }
    }
  }

  // Batch update managers (only update non-null managers)
  const mgrUpdates = insertedEmployees.filter(e => e.managerId && e.id !== adminId)
  for (let i = 0; i < mgrUpdates.length; i += BATCH_SIZE) {
    const batch = mgrUpdates.slice(i, i + BATCH_SIZE)
    await Promise.all(batch.map(emp =>
      db.update(schema.employees).set({ managerId: emp.managerId }).where(eq(schema.employees.id, emp.id))
    ))
  }
  // Set department heads
  for (const [deptName, members] of byDept.entries()) {
    const head = members[0]
    await db.update(schema.departments).set({ headId: head.id }).where(eq(schema.departments.id, deptIds[deptName]))
  }
  console.log('   ✅ Manager hierarchy set\n')

  // ─── 6. Comp Bands ────────────────────────────────────────────────
  console.log('💰 Creating compensation bands...')
  const compBandValues: Array<{
    orgId: string; roleTitle: string; level: string; country: string;
    minSalary: number; midSalary: number; maxSalary: number; currency: string;
    effectiveDate: string;
  }> = []
  for (const country of COUNTRIES) {
    for (const level of LEVELS) {
      const range = SALARY_RANGES[country][level]
      if (!range) continue
      compBandValues.push({
        orgId,
        roleTitle: `${level} — Banking`,
        level,
        country,
        minSalary: range[0],
        midSalary: Math.round((range[0] + range[1]) / 2),
        maxSalary: range[1],
        currency: COUNTRY_CURRENCY[country],
        effectiveDate: '2026-01-01',
      })
    }
  }
  await db.insert(schema.compBands).values(compBandValues)
  console.log(`   ✅ ${compBandValues.length} comp bands\n`)

  // ─── 7. Completed Payroll Cycle (Feb 2026) ──────────────────────────
  console.log('💵 Creating completed payroll cycle (Feb 2026)...')

  for (const country of COUNTRIES) {
    const countryEmployees = insertedEmployees.filter(e => e.country === country && e.id !== adminId)
    const totalGross = countryEmployees.reduce((sum, e) => sum + Math.round(e.annualSalary / 12), 0)
    // Approximate deductions at ~25% of gross
    const totalDeductions = Math.round(totalGross * 0.25)
    const totalNet = totalGross - totalDeductions

    const [payRun] = await db.insert(schema.payrollRuns).values({
      orgId,
      period: '2026-02',
      status: 'paid',
      country,
      totalGross,
      totalNet,
      totalDeductions,
      currency: COUNTRY_CURRENCY[country],
      employeeCount: countryEmployees.length,
      approvedBy: adminId,
      approvedAt: new Date('2026-02-25T10:00:00Z'),
      paymentReference: `ABG-${country}-2026-02-${randomInt(10000, 99999)}`,
      runDate: new Date('2026-02-28T08:00:00Z'),
    }).returning()

    // Insert employee payroll entries in batches
    for (let batch = 0; batch < countryEmployees.length; batch += BATCH_SIZE) {
      const batchEmps = countryEmployees.slice(batch, batch + BATCH_SIZE)
      const entries = batchEmps.map(emp => {
        const monthlyGross = Math.round(emp.annualSalary / 12)
        const tax = Math.round(monthlyGross * 0.15)
        const pension = Math.round(monthlyGross * 0.055)
        const social = Math.round(monthlyGross * 0.025)
        const totalDed = tax + pension + social
        return {
          orgId,
          payrollRunId: payRun.id,
          employeeId: emp.id,
          grossPay: monthlyGross,
          basePay: monthlyGross,
          federalTax: tax,
          pension,
          socialSecurity: social,
          totalDeductions: totalDed,
          netPay: monthlyGross - totalDed,
          currency: COUNTRY_CURRENCY[country],
          country,
          payType: 'full_month',
        }
      })
      await db.insert(schema.employeePayrollEntries).values(entries)
    }
    console.log(`   ✅ ${country} Feb 2026: ${countryEmployees.length} entries (${payRun.status})`)
  }

  // Draft payroll for March 2026
  for (const country of COUNTRIES) {
    const countryEmployees = insertedEmployees.filter(e => e.country === country)
    const totalGross = countryEmployees.reduce((sum, e) => sum + Math.round(e.annualSalary / 12), 0)
    await db.insert(schema.payrollRuns).values({
      orgId,
      period: '2026-03',
      status: 'draft',
      country,
      totalGross,
      totalNet: 0,
      totalDeductions: 0,
      currency: COUNTRY_CURRENCY[country],
      employeeCount: countryEmployees.length,
    })
    console.log(`   📝 ${country} Mar 2026: draft`)
  }
  console.log()

  // ─── 8. Performance Review Cycle ────────────────────────────────────
  console.log('📊 Creating performance review cycle...')
  const [reviewCycle] = await db.insert(schema.reviewCycles).values({
    orgId,
    title: 'H1 2026 Performance Review',
    type: 'mid_year',
    status: 'active',
    startDate: '2026-01-15',
    endDate: '2026-06-30',
  }).returning()

  // Create reviews for ~60% of employees (varied statuses)
  const reviewEmployees = insertedEmployees.filter(() => seededRandom() > 0.4)
  const reviewStatuses: Array<'pending' | 'in_progress' | 'submitted' | 'completed'> = ['pending', 'in_progress', 'submitted', 'completed']
  const statusWeights = [0.15, 0.30, 0.35, 0.20]

  const reviewValues: Array<{
    orgId: string; cycleId: string; employeeId: string; reviewerId: string | null;
    type: 'annual' | 'mid_year' | 'quarterly' | 'probation' | 'manager' | 'peer' | 'self';
    status: 'pending' | 'in_progress' | 'submitted' | 'completed';
    overallRating: number | null; comments: string | null;
  }> = []

  for (const emp of reviewEmployees) {
    if (emp.id === adminId) continue
    // Find a manager/senior to be reviewer
    const deptMembers = byDept.get(emp.deptName) || []
    const possibleReviewers = deptMembers.filter(m =>
      levelOrder.indexOf(m.level) < levelOrder.indexOf(emp.level) && m.id !== emp.id
    )
    const reviewer = possibleReviewers.length > 0 ? pick(possibleReviewers) : null

    const rand = seededRandom()
    let cum = 0
    let status: 'pending' | 'in_progress' | 'submitted' | 'completed' = 'pending'
    for (let s = 0; s < reviewStatuses.length; s++) {
      cum += statusWeights[s]
      if (rand <= cum) { status = reviewStatuses[s]; break }
    }

    const rating = (status === 'submitted' || status === 'completed') ? randomInt(2, 5) : null
    const comments = (status === 'submitted' || status === 'completed')
      ? pick([
        'Consistently exceeds expectations in client relationship management.',
        'Strong technical skills, needs improvement in stakeholder communication.',
        'Excellent team player, delivers quality work on time.',
        'Shows great initiative and leadership potential.',
        'Good performer, needs to develop strategic thinking skills.',
        'Outstanding contribution to the digital transformation initiative.',
        'Meets expectations, recommend for advanced training programme.',
        'Exceptional problem-solving abilities and attention to detail.',
        'Demonstrates strong understanding of regulatory requirements.',
        'Great mentor to junior team members, drives team performance.',
      ])
      : null

    reviewValues.push({
      orgId,
      cycleId: reviewCycle.id,
      employeeId: emp.id,
      reviewerId: reviewer?.id || null,
      type: 'mid_year',
      status,
      overallRating: rating,
      comments,
    })
  }

  // Insert reviews in batches
  for (let i = 0; i < reviewValues.length; i += BATCH_SIZE) {
    await db.insert(schema.reviews).values(reviewValues.slice(i, i + BATCH_SIZE))
  }
  console.log(`   ✅ ${reviewValues.length} reviews (${reviewCycle.title})\n`)

  // ─── 9. Goals ──────────────────────────────────────────────────────
  console.log('🎯 Creating goals...')
  const goalTemplates = [
    { title: 'Increase retail deposit portfolio by 15%', category: 'business' as const },
    { title: 'Achieve 95% KYC compliance score', category: 'compliance' as const },
    { title: 'Complete AML certification programme', category: 'development' as const },
    { title: 'Reduce loan processing time by 20%', category: 'project' as const },
    { title: 'Launch mobile banking 2.0 in all markets', category: 'project' as const },
    { title: 'Achieve Net Promoter Score of 60+', category: 'business' as const },
    { title: 'Complete ISO 27001 audit preparation', category: 'compliance' as const },
    { title: 'Implement real-time fraud detection system', category: 'project' as const },
    { title: 'Develop 3 high-potential direct reports', category: 'development' as const },
    { title: 'Reduce operational costs by 10%', category: 'business' as const },
    { title: 'Achieve 99.9% core banking uptime', category: 'project' as const },
    { title: 'Complete leadership development programme', category: 'development' as const },
    { title: 'Onboard 5 new corporate clients (>$10M AUM)', category: 'business' as const },
    { title: 'Implement automated regulatory reporting', category: 'project' as const },
    { title: 'Achieve zero critical audit findings', category: 'compliance' as const },
  ]

  const goalStatuses: Array<'not_started' | 'on_track' | 'at_risk' | 'behind' | 'completed'> = ['not_started', 'on_track', 'at_risk', 'behind', 'completed']
  const goalStatusWeights = [0.10, 0.40, 0.15, 0.10, 0.25]

  // Give ~70% of employees 1-3 goals each
  const goalEmployees = insertedEmployees.filter(() => seededRandom() > 0.3)
  const goalValues: Array<{
    orgId: string; employeeId: string; title: string; category: 'business' | 'project' | 'development' | 'compliance';
    status: 'not_started' | 'on_track' | 'at_risk' | 'behind' | 'completed';
    progress: number; startDate: string; dueDate: string;
  }> = []

  for (const emp of goalEmployees) {
    const numGoals = randomInt(1, 3)
    const empGoals = pickN(goalTemplates, numGoals)
    for (const goalTpl of empGoals) {
      const rand = seededRandom()
      let cum = 0
      let status: typeof goalStatuses[number] = 'on_track'
      for (let s = 0; s < goalStatuses.length; s++) {
        cum += goalStatusWeights[s]
        if (rand <= cum) { status = goalStatuses[s]; break }
      }
      const progress = status === 'completed' ? 100 : status === 'not_started' ? 0 : randomInt(10, 90)

      goalValues.push({
        orgId,
        employeeId: emp.id,
        title: goalTpl.title,
        category: goalTpl.category,
        status,
        progress,
        startDate: '2026-01-01',
        dueDate: '2026-06-30',
      })
    }
  }

  for (let i = 0; i < goalValues.length; i += BATCH_SIZE) {
    await db.insert(schema.goals).values(goalValues.slice(i, i + BATCH_SIZE))
  }
  console.log(`   ✅ ${goalValues.length} goals\n`)

  // ─── 10. Job Postings & Applications ───────────────────────────────
  console.log('📢 Creating job postings & applications...')
  const postings = [
    { title: 'Senior Software Engineer — Digital Banking', dept: 'Technology & Digital', loc: 'Accra, Ghana', min: 4200000, max: 6000000, cur: 'GHS' },
    { title: 'Risk Analyst', dept: 'Risk & Compliance', loc: 'Lagos, Nigeria', min: 550000000, max: 900000000, cur: 'NGN' },
    { title: 'Corporate Relationship Manager', dept: 'Corporate Banking', loc: 'Nairobi, Kenya', min: 360000000, max: 600000000, cur: 'KES' },
    { title: 'Branch Manager', dept: 'Retail Banking', loc: 'Kumasi, Ghana', min: 3600000, max: 5400000, cur: 'GHS' },
    { title: 'Head of Cybersecurity', dept: 'Technology & Digital', loc: 'Lagos, Nigeria', min: 1200000000, max: 2000000000, cur: 'NGN' },
    { title: 'Internal Auditor', dept: 'Internal Audit', loc: 'Nairobi, Kenya', min: 150000000, max: 300000000, cur: 'KES' },
    { title: 'AML Compliance Officer', dept: 'Risk & Compliance', loc: 'Accra, Ghana', min: 2800000, max: 4200000, cur: 'GHS' },
    { title: 'Data Engineer', dept: 'Technology & Digital', loc: 'Lagos, Nigeria', min: 550000000, max: 900000000, cur: 'NGN' },
    { title: 'HR Business Partner', dept: 'Human Resources', loc: 'Nairobi, Kenya', min: 360000000, max: 600000000, cur: 'KES' },
    { title: 'Treasury Analyst', dept: 'Finance & Treasury', loc: 'Accra, Ghana', min: 2000000, max: 3200000, cur: 'GHS' },
    { title: 'DevOps Engineer', dept: 'Technology & Digital', loc: 'Lagos, Nigeria', min: 550000000, max: 900000000, cur: 'NGN' },
    { title: 'Credit Analyst — SME Lending', dept: 'Retail Banking', loc: 'Mombasa, Kenya', min: 150000000, max: 300000000, cur: 'KES' },
    { title: 'Legal Counsel — Banking Regulation', dept: 'Legal & Governance', loc: 'Accra, Ghana', min: 4800000, max: 7200000, cur: 'GHS' },
    { title: 'Marketing Manager — Digital Channels', dept: 'Marketing & Communications', loc: 'Lagos, Nigeria', min: 800000000, max: 1400000000, cur: 'NGN' },
    { title: 'Customer Experience Lead', dept: 'Customer Experience', loc: 'Nairobi, Kenya', min: 360000000, max: 600000000, cur: 'KES' },
  ]

  const postingIds: string[] = []
  for (const p of postings) {
    const [posting] = await db.insert(schema.jobPostings).values({
      orgId,
      title: p.title,
      departmentId: deptIds[p.dept],
      location: p.loc,
      type: 'full_time',
      description: `Africa Bank Group is seeking a talented ${p.title} to join our ${p.dept} team in ${p.loc}.`,
      requirements: 'Minimum 3+ years relevant experience. Strong analytical skills. Banking sector experience preferred.',
      salaryMin: p.min,
      salaryMax: p.max,
      currency: p.cur,
      status: 'open',
      applicationCount: 0,
    }).returning()
    postingIds.push(posting.id)
  }

  // Create 4-8 applications per posting
  const appStatuses: Array<'new' | 'screening' | 'phone_screen' | 'technical' | 'onsite' | 'offer' | 'hired' | 'rejected'> =
    ['new', 'screening', 'phone_screen', 'technical', 'onsite', 'offer', 'hired', 'rejected']
  let totalApps = 0
  for (const postingId of postingIds) {
    const numApps = randomInt(4, 8)
    const apps: Array<{
      orgId: string; jobId: string; candidateName: string; candidateEmail: string;
      status: 'new' | 'screening' | 'phone_screen' | 'technical' | 'onsite' | 'offer' | 'hired' | 'rejected';
      rating: number | null; notes: string | null;
    }> = []

    for (let a = 0; a < numApps; a++) {
      const country = pick(COUNTRIES)
      const nd = NAMES[country]
      const isFemale = seededRandom() > 0.5
      const fn = isFemale ? pick(nd.female) : pick(nd.male)
      const ln = pick(nd.surnames)

      apps.push({
        orgId,
        jobId: postingId,
        candidateName: `${fn} ${ln}`,
        candidateEmail: `${fn.toLowerCase()}.${ln.toLowerCase()}@${pick(['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'])}`,
        status: pick(appStatuses),
        rating: seededRandom() > 0.4 ? randomInt(1, 5) : null,
        notes: seededRandom() > 0.6 ? pick([
          'Strong candidate with relevant banking experience.',
          'Excellent technical skills, schedule second round.',
          'Good cultural fit, needs more domain knowledge.',
          'Impressive leadership qualities for this level.',
          'References check pending.',
        ]) : null,
      })
    }
    await db.insert(schema.applications).values(apps)
    // Update application count
    await db.update(schema.jobPostings).set({ applicationCount: numApps }).where(eq(schema.jobPostings.id, postingId))
    totalApps += numApps
  }
  console.log(`   ✅ ${postings.length} job postings, ${totalApps} applications\n`)

  // ─── 11. Feedback & Recognition ────────────────────────────────────
  console.log('💬 Creating feedback & recognition...')
  const feedbackTypes: Array<'recognition' | 'feedback' | 'checkin'> = ['recognition', 'feedback', 'checkin']
  const feedbackContents = [
    'Excellent presentation to the board on our digital strategy. Very well prepared.',
    'Thank you for staying late to resolve the payment gateway issue. True team spirit.',
    'Your mentorship of the junior analysts has been invaluable this quarter.',
    'Great job leading the branch audit. Zero findings is a remarkable achievement.',
    'Your cross-border payments solution saved the team weeks of manual work.',
    'Appreciate your calm leadership during the system migration last weekend.',
    'The new customer onboarding flow you designed reduced drop-off by 30%.',
    'Thank you for organizing the staff wellness programme. Morale is noticeably higher.',
    'Your fraud detection model caught 12 suspicious transactions this month. Outstanding.',
    'Great initiative taking ownership of the regulatory filing when the team was short-staffed.',
  ]
  const feedbackValues: Array<{
    orgId: string; fromId: string; toId: string; type: 'recognition' | 'feedback' | 'checkin'; content: string; isPublic: boolean;
  }> = []
  for (let i = 0; i < 200; i++) {
    const from = pick(insertedEmployees)
    let to = pick(insertedEmployees)
    while (to.id === from.id) to = pick(insertedEmployees)
    feedbackValues.push({
      orgId,
      fromId: from.id,
      toId: to.id,
      type: pick(feedbackTypes),
      content: pick(feedbackContents),
      isPublic: seededRandom() > 0.3,
    })
  }
  for (let i = 0; i < feedbackValues.length; i += BATCH_SIZE) {
    await db.insert(schema.feedback).values(feedbackValues.slice(i, i + BATCH_SIZE))
  }
  console.log(`   ✅ ${feedbackValues.length} feedback entries\n`)

  // ─── 12. Leave Requests ────────────────────────────────────────────
  console.log('🏖️  Creating leave requests...')
  const leaveTypes: Array<'annual' | 'sick' | 'personal' | 'maternity' | 'paternity' | 'compassionate'> =
    ['annual', 'sick', 'personal', 'maternity', 'paternity', 'compassionate']
  const leaveWeights = [0.45, 0.20, 0.15, 0.08, 0.07, 0.05]
  const leaveValues: Array<{
    orgId: string; employeeId: string; type: 'annual' | 'sick' | 'personal' | 'maternity' | 'paternity' | 'unpaid' | 'compassionate';
    startDate: string; endDate: string; days: number;
    status: 'pending' | 'approved' | 'rejected'; reason: string;
  }> = []

  const leaveEmployees = insertedEmployees.filter(() => seededRandom() > 0.6)
  for (const emp of leaveEmployees) {
    const rand = seededRandom()
    let cum = 0
    let leaveType: typeof leaveTypes[number] = 'annual'
    for (let t = 0; t < leaveTypes.length; t++) {
      cum += leaveWeights[t]
      if (rand <= cum) { leaveType = leaveTypes[t]; break }
    }
    const days = leaveType === 'maternity' ? 90 : leaveType === 'paternity' ? 14 : randomInt(1, 15)
    const startDate = randomDate('2026-01-01', '2026-06-30')
    const end = new Date(startDate)
    end.setDate(end.getDate() + days)
    const endDate = end.toISOString().split('T')[0]

    leaveValues.push({
      orgId,
      employeeId: emp.id,
      type: leaveType,
      startDate,
      endDate,
      days,
      status: pick(['pending', 'approved', 'approved', 'approved', 'rejected']),
      reason: pick([
        'Family vacation', 'Medical appointment', 'Personal matters',
        'Wedding ceremony', 'Child care', 'Home relocation', 'Study leave',
        'Religious observance', 'Bereavement', 'Rest and recovery',
      ]),
    })
  }

  for (let i = 0; i < leaveValues.length; i += BATCH_SIZE) {
    await db.insert(schema.leaveRequests).values(leaveValues.slice(i, i + BATCH_SIZE))
  }
  console.log(`   ✅ ${leaveValues.length} leave requests\n`)

  // ─── 13. Courses & Enrollments ─────────────────────────────────────
  console.log('📚 Creating courses & enrollments...')
  const courseData = [
    { title: 'Anti-Money Laundering Fundamentals', category: 'Compliance', hours: 8, format: 'online' as const, level: 'beginner' as const, mandatory: true },
    { title: 'Credit Risk Assessment & Management', category: 'Risk', hours: 16, format: 'blended' as const, level: 'intermediate' as const, mandatory: false },
    { title: 'Digital Banking Transformation', category: 'Technology', hours: 12, format: 'online' as const, level: 'intermediate' as const, mandatory: false },
    { title: 'Leadership in Financial Services', category: 'Leadership', hours: 24, format: 'classroom' as const, level: 'advanced' as const, mandatory: false },
    { title: 'Data Privacy & GDPR for Banking', category: 'Compliance', hours: 6, format: 'online' as const, level: 'beginner' as const, mandatory: true },
    { title: 'Python for Financial Analysis', category: 'Technology', hours: 20, format: 'online' as const, level: 'intermediate' as const, mandatory: false },
    { title: 'Customer Relationship Excellence', category: 'Sales', hours: 8, format: 'classroom' as const, level: 'beginner' as const, mandatory: false },
    { title: 'Treasury & Cash Management', category: 'Finance', hours: 16, format: 'blended' as const, level: 'advanced' as const, mandatory: false },
    { title: 'Fraud Detection & Prevention', category: 'Risk', hours: 10, format: 'online' as const, level: 'intermediate' as const, mandatory: true },
    { title: 'Effective People Management', category: 'Leadership', hours: 12, format: 'classroom' as const, level: 'intermediate' as const, mandatory: false },
    { title: 'Islamic Banking Principles', category: 'Banking', hours: 8, format: 'online' as const, level: 'beginner' as const, mandatory: false },
    { title: 'Advanced Excel for Finance Professionals', category: 'Technology', hours: 12, format: 'online' as const, level: 'beginner' as const, mandatory: false },
  ]

  const courseIds: string[] = []
  for (const c of courseData) {
    const [course] = await db.insert(schema.courses).values({
      orgId,
      title: c.title,
      description: `Comprehensive ${c.category.toLowerCase()} training designed for Africa Bank Group professionals.`,
      category: c.category,
      durationHours: c.hours,
      format: c.format,
      level: c.level,
      isMandatory: c.mandatory,
    }).returning()
    courseIds.push(course.id)
  }

  // Enroll ~40% of employees in 1-3 courses each
  const enrollEmployees = insertedEmployees.filter(() => seededRandom() > 0.6)
  const enrollValues: Array<{
    orgId: string; employeeId: string; courseId: string;
    status: 'enrolled' | 'in_progress' | 'completed'; progress: number;
  }> = []
  for (const emp of enrollEmployees) {
    const numCourses = randomInt(1, 3)
    const empCourses = pickN(courseIds, numCourses)
    for (const courseId of empCourses) {
      const status = pick(['enrolled', 'in_progress', 'in_progress', 'completed', 'completed']) as 'enrolled' | 'in_progress' | 'completed'
      enrollValues.push({
        orgId,
        employeeId: emp.id,
        courseId,
        status,
        progress: status === 'completed' ? 100 : status === 'in_progress' ? randomInt(20, 80) : 0,
      })
    }
  }
  for (let i = 0; i < enrollValues.length; i += BATCH_SIZE) {
    await db.insert(schema.enrollments).values(enrollValues.slice(i, i + BATCH_SIZE))
  }
  console.log(`   ✅ ${courseData.length} courses, ${enrollValues.length} enrollments\n`)

  // ─── 14. Surveys & Engagement Scores ──────────────────────────────
  console.log('📋 Creating surveys & engagement scores...')
  const [survey] = await db.insert(schema.surveys).values({
    orgId,
    title: 'Q1 2026 Employee Pulse Survey',
    type: 'pulse',
    status: 'closed',
    startDate: '2026-01-15',
    endDate: '2026-02-15',
    anonymous: true,
  }).returning()
  await db.insert(schema.surveys).values({
    orgId,
    title: 'H1 2026 Engagement Survey',
    type: 'annual',
    status: 'active',
    startDate: '2026-03-01',
    endDate: '2026-03-31',
    anonymous: true,
  })

  // Engagement scores per department per quarter
  const engScoreValues: Array<{
    orgId: string; departmentId: string; period: string; overallScore: number; enpsScore: number; responseRate: number;
  }> = []
  for (const [deptName, deptId] of Object.entries(deptIds)) {
    engScoreValues.push({
      orgId,
      departmentId: deptId,
      period: '2026-Q1',
      overallScore: randomInt(65, 92),
      enpsScore: randomInt(20, 65),
      responseRate: randomInt(70, 98),
    })
  }
  await db.insert(schema.engagementScores).values(engScoreValues)
  console.log(`   ✅ 2 surveys, ${engScoreValues.length} engagement scores\n`)

  // ─── 15. Salary Reviews ───────────────────────────────────────────
  console.log('💹 Creating salary reviews...')
  const salaryReviewEmployees = insertedEmployees.filter(() => seededRandom() > 0.75)
  const salaryReviewValues: Array<{
    orgId: string; employeeId: string; currentSalary: number; proposedSalary: number;
    currency: string; justification: string;
    status: 'draft' | 'pending_approval' | 'approved' | 'rejected';
    cycle: string;
  }> = []
  for (const emp of salaryReviewEmployees) {
    const currentAnnual = emp.annualSalary
    const increasePercent = randomInt(5, 20) / 100
    const proposed = Math.round(currentAnnual * (1 + increasePercent))
    salaryReviewValues.push({
      orgId,
      employeeId: emp.id,
      currentSalary: currentAnnual,
      proposedSalary: proposed,
      currency: COUNTRY_CURRENCY[emp.country],
      justification: pick([
        'Exceptional performance in H2 2025. Consistently exceeds targets.',
        'Market adjustment — current compensation below P50 for role and location.',
        'Promotion from Analyst to Senior Analyst. Increased scope of responsibilities.',
        'Retention risk — received competing offer. Critical to retain.',
        'Annual merit increase aligned with performance rating of 4/5.',
        'Completed advanced certification programme. New skills justify uplift.',
      ]),
      status: pick(['draft', 'pending_approval', 'pending_approval', 'approved', 'approved', 'approved']),
      cycle: 'H1 2026',
    })
  }
  for (let i = 0; i < salaryReviewValues.length; i += BATCH_SIZE) {
    await db.insert(schema.salaryReviews).values(salaryReviewValues.slice(i, i + BATCH_SIZE))
  }
  console.log(`   ✅ ${salaryReviewValues.length} salary reviews\n`)

  // ─── Summary ──────────────────────────────────────────────────────
  console.log('═══════════════════════════════════════════════════════')
  console.log('🎉 Africa Bank Group demo environment ready!\n')
  console.log(`   Organization:  ${ORG_NAME}`)
  console.log(`   Org ID:        ${orgId}`)
  console.log(`   Employees:     1,000 across GH (400), NG (350), KE (250)`)
  console.log(`   Departments:   ${DEPARTMENTS.length}`)
  console.log(`   Comp Bands:    ${compBandValues.length}`)
  console.log(`   Payroll Runs:  6 (3 paid Feb + 3 draft Mar)`)
  console.log(`   Reviews:       ${reviewValues.length}`)
  console.log(`   Goals:         ${goalValues.length}`)
  console.log(`   Job Postings:  ${postings.length} (${totalApps} applications)`)
  console.log(`   Feedback:      ${feedbackValues.length}`)
  console.log(`   Leave:         ${leaveValues.length}`)
  console.log(`   Courses:       ${courseData.length} (${enrollValues.length} enrollments)`)
  console.log(`   Surveys:       2`)
  console.log(`   Engagement:    ${engScoreValues.length} scores`)
  console.log(`   Salary Reviews: ${salaryReviewValues.length}\n`)
  console.log(`   Login:  ${ADMIN_EMAIL}`)
  console.log(`   Pass:   ${ADMIN_PASSWORD}\n`)
  console.log('═══════════════════════════════════════════════════════')
}

main().catch(err => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})
