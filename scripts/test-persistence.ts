/**
 * NextLend E2E Persistence Test
 *
 * Tests 5 modules: Workers Comp, People, Recruiting, Learning, Compensation
 * For each: POST → verify DB → simulate hard refresh (GET) → check record returns
 *
 * Usage: npx tsx scripts/test-persistence.ts
 */

import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { eq, and } from 'drizzle-orm'
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

const sqlClient = neon(process.env.DATABASE_URL!)
const db = drizzle(sqlClient, { schema })

const BASE_URL = 'http://localhost:3002'

// ─── Test Results ─────────────────────────────────────────────────────────
interface TestResult {
  module: string
  postStatus: number | null
  postBody: any
  recordInDB: boolean
  dbRecord: any
  getStatus: number | null
  getReturnsRecord: boolean
  uiWouldRender: boolean
  pass: boolean
  failurePoint: string | null
}

const results: TestResult[] = []

// ─── Step 1: Login and get session cookie ─────────────────────────────────
async function login(): Promise<string> {
  console.log('🔐 Logging in as admin@nextlend.io...')
  const res = await fetch(`${BASE_URL}/api/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'login',
      email: 'admin@nextlend.io',
      password: 'NextLend2026!',
    }),
  })

  if (!res.ok) {
    throw new Error(`Login failed: ${res.status} ${await res.text()}`)
  }

  const setCookie = res.headers.getSetCookie?.() || []
  const sessionCookie = setCookie.find(c => c.startsWith('tempo_session='))
  if (!sessionCookie) {
    throw new Error('No session cookie returned')
  }

  const token = sessionCookie.split('=')[1].split(';')[0]
  console.log(`   ✅ Logged in. Session cookie obtained.\n`)
  return `tempo_session=${token}`
}

// ─── Helper: POST to /api/data ─────────────────────────────────────────
async function apiPost(cookie: string, entity: string, data: Record<string, any>): Promise<{ status: number; body: any }> {
  const res = await fetch(`${BASE_URL}/api/data`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookie,
    },
    body: JSON.stringify({ action: 'create', entity, data }),
  })
  const body = await res.json()
  return { status: res.status, body }
}

// ─── Helper: GET from /api/data/[module] (simulates hard refresh) ──────
async function apiGet(cookie: string, moduleSlug: string): Promise<{ status: number; body: any }> {
  const res = await fetch(`${BASE_URL}/api/data/${moduleSlug}?limit=200`, {
    method: 'GET',
    headers: { 'Cookie': cookie },
  })
  const body = await res.json()
  return { status: res.status, body }
}

// ─── Test 1: Workers' Comp — Create a Policy ──────────────────────────
async function testWorkersComp(cookie: string) {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('TEST 1: Workers\' Comp — Create a Policy')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  const result: TestResult = {
    module: 'Workers Comp (workersCompPolicies)',
    postStatus: null, postBody: null,
    recordInDB: false, dbRecord: null,
    getStatus: null, getReturnsRecord: false,
    uiWouldRender: false, pass: false, failurePoint: null,
  }

  // POST
  const { status, body } = await apiPost(cookie, 'workersCompPolicies', {
    name: 'NextLend General WC Policy',
    carrier: 'State Fund Insurance',
    policy_number: 'WC-NL-2026-001',
    status: 'active',
    effective_date: '2026-01-01',
    expiry_date: '2026-12-31',
    premium: 2500000, // $25,000
    covered_employees: 50,
  })
  result.postStatus = status
  result.postBody = body
  console.log(`  POST status: ${status}`)
  console.log(`  POST body:`, JSON.stringify(body).slice(0, 200))

  if (status !== 201) {
    result.failurePoint = `POST returned ${status} instead of 201`
    results.push(result)
    return
  }

  const createdId = body.id
  console.log(`  Created ID: ${createdId}`)

  // Verify in DB directly
  const dbRows = await db.select().from(schema.workersCompPolicies)
    .where(eq(schema.workersCompPolicies.id, createdId))
  result.recordInDB = dbRows.length > 0
  result.dbRecord = dbRows[0] || null
  console.log(`  Record in DB: ${result.recordInDB ? '✅' : '❌'}`)

  if (!result.recordInDB) {
    result.failurePoint = 'Record not found in DB after POST'
    results.push(result)
    return
  }

  // GET (simulating hard refresh)
  const getResult = await apiGet(cookie, 'workers-comp-policies')
  result.getStatus = getResult.status
  console.log(`  GET status: ${getResult.status}`)

  const getData = getResult.body.data || getResult.body
  const found = Array.isArray(getData) && getData.some((r: any) => r.id === createdId)
  result.getReturnsRecord = found
  result.uiWouldRender = found
  console.log(`  GET returns record: ${found ? '✅' : '❌'}`)

  if (!found) {
    result.failurePoint = 'GET /api/data/workers-comp-policies does not return the created record'
    console.log(`  GET data sample:`, JSON.stringify(getData).slice(0, 300))
  }

  result.pass = result.recordInDB && found
  results.push(result)
  console.log(`  RESULT: ${result.pass ? '✅ PASS' : '❌ FAIL — ' + result.failurePoint}\n`)
}

// ─── Test 2: People — Create an Employee ──────────────────────────────
async function testPeople(cookie: string) {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('TEST 2: People — Create an Employee')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  const result: TestResult = {
    module: 'People (employees)',
    postStatus: null, postBody: null,
    recordInDB: false, dbRecord: null,
    getStatus: null, getReturnsRecord: false,
    uiWouldRender: false, pass: false, failurePoint: null,
  }

  // POST — employees use nested profile object
  const { status, body } = await apiPost(cookie, 'employees', {
    department_id: null, // will be set by UI normally
    job_title: 'QA Engineer',
    level: 'Mid',
    country: 'United States',
    role: 'employee',
    hire_date: '2026-03-08',
    profile: {
      full_name: 'Test Persistence User',
      email: 'test.persistence@nextlend.io',
    },
  })
  result.postStatus = status
  result.postBody = body
  console.log(`  POST status: ${status}`)
  console.log(`  POST body:`, JSON.stringify(body).slice(0, 200))

  if (status !== 201) {
    result.failurePoint = `POST returned ${status} instead of 201`
    results.push(result)
    return
  }

  const createdId = body.id
  console.log(`  Created ID: ${createdId}`)

  // Verify in DB
  const dbRows = await db.select().from(schema.employees)
    .where(eq(schema.employees.id, createdId))
  result.recordInDB = dbRows.length > 0
  result.dbRecord = dbRows[0] || null
  console.log(`  Record in DB: ${result.recordInDB ? '✅' : '❌'}`)
  if (result.recordInDB) {
    console.log(`    fullName: ${dbRows[0].fullName}, email: ${dbRows[0].email}`)
  }

  if (!result.recordInDB) {
    result.failurePoint = 'Record not found in DB after POST'
    results.push(result)
    return
  }

  // GET (simulating hard refresh)
  const getResult = await apiGet(cookie, 'employees')
  result.getStatus = getResult.status
  console.log(`  GET status: ${getResult.status}`)

  const getData = getResult.body.data || getResult.body
  const found = Array.isArray(getData) && getData.some((r: any) => r.id === createdId)
  result.getReturnsRecord = found
  result.uiWouldRender = found
  console.log(`  GET returns record: ${found ? '✅' : '❌'}`)

  if (!found) {
    result.failurePoint = 'GET /api/data/employees does not return the created record'
    console.log(`  Total employees returned: ${Array.isArray(getData) ? getData.length : 'N/A'}`)
  }

  result.pass = result.recordInDB && found
  results.push(result)
  console.log(`  RESULT: ${result.pass ? '✅ PASS' : '❌ FAIL — ' + result.failurePoint}\n`)
}

// ─── Test 3: Recruiting — Create a Job Requisition ────────────────────
async function testRecruiting(cookie: string) {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('TEST 3: Recruiting — Create a Job Requisition')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  const result: TestResult = {
    module: 'Recruiting (jobPostings)',
    postStatus: null, postBody: null,
    recordInDB: false, dbRecord: null,
    getStatus: null, getReturnsRecord: false,
    uiWouldRender: false, pass: false, failurePoint: null,
  }

  const { status, body } = await apiPost(cookie, 'jobPostings', {
    title: 'Senior Risk Analyst',
    department: 'Risk & Compliance',
    location: 'Lagos, Nigeria',
    type: 'full_time',
    status: 'open',
    salary_min: 12000000, // $120,000
    salary_max: 16000000, // $160,000
    description: 'E2E persistence test job requisition',
    requirements: 'Testing persistence across page refresh',
  })
  result.postStatus = status
  result.postBody = body
  console.log(`  POST status: ${status}`)
  console.log(`  POST body:`, JSON.stringify(body).slice(0, 200))

  if (status !== 201) {
    result.failurePoint = `POST returned ${status} instead of 201`
    results.push(result)
    return
  }

  const createdId = body.id
  console.log(`  Created ID: ${createdId}`)

  // Verify in DB
  const dbRows = await db.select().from(schema.jobPostings)
    .where(eq(schema.jobPostings.id, createdId))
  result.recordInDB = dbRows.length > 0
  result.dbRecord = dbRows[0] || null
  console.log(`  Record in DB: ${result.recordInDB ? '✅' : '❌'}`)

  if (!result.recordInDB) {
    result.failurePoint = 'Record not found in DB after POST'
    results.push(result)
    return
  }

  // GET
  const getResult = await apiGet(cookie, 'job-postings')
  result.getStatus = getResult.status
  console.log(`  GET status: ${getResult.status}`)

  const getData = getResult.body.data || getResult.body
  const found = Array.isArray(getData) && getData.some((r: any) => r.id === createdId)
  result.getReturnsRecord = found
  result.uiWouldRender = found
  console.log(`  GET returns record: ${found ? '✅' : '❌'}`)

  if (!found) {
    result.failurePoint = 'GET /api/data/job-postings does not return the created record'
  }

  result.pass = result.recordInDB && found
  results.push(result)
  console.log(`  RESULT: ${result.pass ? '✅ PASS' : '❌ FAIL — ' + result.failurePoint}\n`)
}

// ─── Test 4: Learning — Create a Course ───────────────────────────────
async function testLearning(cookie: string) {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('TEST 4: Learning — Create a Course')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  const result: TestResult = {
    module: 'Learning (courses)',
    postStatus: null, postBody: null,
    recordInDB: false, dbRecord: null,
    getStatus: null, getReturnsRecord: false,
    uiWouldRender: false, pass: false, failurePoint: null,
  }

  const { status, body } = await apiPost(cookie, 'courses', {
    title: 'NextLend Credit Risk Fundamentals',
    description: 'E2E persistence test course for credit risk',
    category: 'Risk',
    duration_hours: 8,
    format: 'online',
    level: 'intermediate',
    is_mandatory: false,
  })
  result.postStatus = status
  result.postBody = body
  console.log(`  POST status: ${status}`)
  console.log(`  POST body:`, JSON.stringify(body).slice(0, 200))

  if (status !== 201) {
    result.failurePoint = `POST returned ${status} instead of 201`
    results.push(result)
    return
  }

  const createdId = body.id
  console.log(`  Created ID: ${createdId}`)

  // Verify in DB
  const dbRows = await db.select().from(schema.courses)
    .where(eq(schema.courses.id, createdId))
  result.recordInDB = dbRows.length > 0
  result.dbRecord = dbRows[0] || null
  console.log(`  Record in DB: ${result.recordInDB ? '✅' : '❌'}`)

  if (!result.recordInDB) {
    result.failurePoint = 'Record not found in DB after POST'
    results.push(result)
    return
  }

  // GET
  const getResult = await apiGet(cookie, 'courses')
  result.getStatus = getResult.status
  console.log(`  GET status: ${getResult.status}`)

  const getData = getResult.body.data || getResult.body
  const found = Array.isArray(getData) && getData.some((r: any) => r.id === createdId)
  result.getReturnsRecord = found
  result.uiWouldRender = found
  console.log(`  GET returns record: ${found ? '✅' : '❌'}`)

  if (!found) {
    result.failurePoint = 'GET /api/data/courses does not return the created record'
  }

  result.pass = result.recordInDB && found
  results.push(result)
  console.log(`  RESULT: ${result.pass ? '✅ PASS' : '❌ FAIL — ' + result.failurePoint}\n`)
}

// ─── Test 5: Compensation — Create an Equity Grant ────────────────────
async function testCompensation(cookie: string) {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('TEST 5: Compensation — Create an Equity Grant')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  const result: TestResult = {
    module: 'Compensation (equityGrants)',
    postStatus: null, postBody: null,
    recordInDB: false, dbRecord: null,
    getStatus: null, getReturnsRecord: false,
    uiWouldRender: false, pass: false, failurePoint: null,
  }

  // Get a real employee ID for the grant
  const empRows = await db.select({ id: schema.employees.id }).from(schema.employees).limit(1)
  const employeeId = empRows[0]?.id || null
  console.log(`  Using employee_id: ${employeeId}`)

  const { status, body } = await apiPost(cookie, 'equityGrants', {
    employee_id: employeeId,
    grant_type: 'RSU',
    shares: 5000,
    strike_price: 0,
    vesting_schedule: '4-year with 1-year cliff',
    vested_shares: 0,
    current_value: 125000,
    grant_date: '2026-03-01',
    status: 'active',
  })
  result.postStatus = status
  result.postBody = body
  console.log(`  POST status: ${status}`)
  console.log(`  POST body:`, JSON.stringify(body).slice(0, 300))

  if (status !== 201) {
    result.failurePoint = `POST returned ${status} instead of 201. Entity 'equityGrants' maps to salaryReviews table which has incompatible schema.`
    results.push(result)

    // Diagnose: check what table equityGrants maps to
    console.log(`  ⚠️  KNOWN ISSUE: 'equityGrants' entity maps to schema.salaryReviews in POST route`)
    console.log(`     salaryReviews requires: employeeId, currentSalary, proposedSalary (all NOT NULL)`)
    console.log(`     But equity grant data has: grant_type, shares, strike_price, vesting_schedule`)
    console.log(`     → Schema mismatch: no dedicated equityGrants table exists`)
    console.log(`  ⚠️  Also: equityGrants has NO MODULE_SLUGS entry → GET will never fetch from DB`)
    console.log()
    return
  }

  const createdId = body.id
  console.log(`  Created ID: ${createdId}`)

  // Check if record exists in equity_grants table
  const dbRows = await sqlClient`SELECT * FROM equity_grants WHERE id = ${createdId}`
  result.recordInDB = dbRows.length > 0
  result.dbRecord = dbRows[0] || null
  console.log(`  Record in DB (equity_grants): ${result.recordInDB ? '✅' : '❌'}`)

  if (!result.recordInDB) {
    result.failurePoint = 'Record not found in equity_grants table after POST'
    results.push(result)
    return
  }

  // GET — use the new equity-grants module slug
  const getResult = await apiGet(cookie, 'equity-grants')
  result.getStatus = getResult.status
  console.log(`  GET /api/data/equity-grants status: ${getResult.status}`)

  const getData = getResult.body.data || getResult.body
  const found = Array.isArray(getData) && getData.some((r: any) => r.id === createdId)
  result.getReturnsRecord = found
  result.uiWouldRender = found
  console.log(`  GET returns record: ${found ? '✅' : '❌'}`)

  if (!found) {
    result.failurePoint = 'GET /api/data/equity-grants does not return the created record'
  }

  result.pass = result.recordInDB && found
  results.push(result)
  console.log(`  RESULT: ${result.pass ? '✅ PASS' : '❌ FAIL — ' + result.failurePoint}\n`)
}

// ─── Main ─────────────────────────────────────────────────────────────────
async function main() {
  console.log('╔══════════════════════════════════════════════════════╗')
  console.log('║  NextLend E2E Persistence Test Suite                ║')
  console.log('║  Tests: POST → DB → Hard Refresh (GET) → UI        ║')
  console.log('╚══════════════════════════════════════════════════════╝\n')

  const cookie = await login()

  await testWorkersComp(cookie)
  await testPeople(cookie)
  await testRecruiting(cookie)
  await testLearning(cookie)
  await testCompensation(cookie)

  // ─── Summary ─────────────────────────────────────────────────────────
  console.log('╔══════════════════════════════════════════════════════╗')
  console.log('║  PERSISTENCE TEST RESULTS                          ║')
  console.log('╚══════════════════════════════════════════════════════╝')
  console.log()

  const tableHeader = `${'Module'.padEnd(40)} ${'POST'.padEnd(6)} ${'DB'.padEnd(4)} ${'GET'.padEnd(5)} ${'Result'.padEnd(8)} Failure Point`
  console.log(tableHeader)
  console.log('─'.repeat(100))

  for (const r of results) {
    const post = r.postStatus === 201 ? '201✅' : `${r.postStatus}❌`
    const db = r.recordInDB ? '✅' : '❌'
    const get = r.getReturnsRecord ? '✅' : '❌'
    const pass = r.pass ? 'PASS ✅' : 'FAIL ❌'
    const failure = r.failurePoint || ''
    console.log(`${r.module.padEnd(40)} ${post.padEnd(6)} ${db.padEnd(4)} ${get.padEnd(5)} ${pass.padEnd(8)} ${failure}`)
  }

  console.log()
  const passed = results.filter(r => r.pass).length
  const total = results.length
  console.log(`Overall: ${passed}/${total} modules passing`)

  if (passed < total) {
    console.log('\n⚠️  Failing modules need fixes before persistence can be trusted.')
  }
}

main().catch(err => {
  console.error('❌ Test suite failed:', err)
  process.exit(1)
})
