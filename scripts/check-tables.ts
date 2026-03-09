import { neon } from '@neondatabase/serverless'
import * as fs from 'fs'
import * as path from 'path'

// Load .env.local
const envPath = path.resolve(__dirname, '../.env.local')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim()
    if (trimmed.length === 0 || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const value = trimmed.slice(eqIdx + 1).trim()
    if (process.env[key] === undefined) {
      process.env[key] = value
    }
  }
}

const sql = neon(process.env.DATABASE_URL as string)

async function main() {
  const rows = await sql`SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`
  console.log(`Tables in DB (${rows.length}):`)
  rows.forEach(r => console.log(`  ${r.tablename}`))

  // Check for specific newer tables
  const newerTables = [
    'workers_comp_policies', 'workers_comp_claims', 'workers_comp_class_codes', 'workers_comp_audits',
    'headcount_plans', 'headcount_positions', 'headcount_budget_items',
    'travel_requests', 'travel_bookings', 'travel_policies',
    'managed_devices', 'device_actions', 'app_catalog',
    'custom_field_definitions', 'custom_field_values',
    'automation_workflows', 'automation_workflow_steps',
    'sandbox_environments',
    'custom_apps', 'app_pages', 'app_components',
    'eor_entities', 'eor_employees', 'eor_contracts',
    'compliance_requirements', 'compliance_documents', 'compliance_alerts',
  ]

  const existingNames = new Set(rows.map(r => r.tablename))
  console.log('\n--- Missing tables ---')
  const missing = newerTables.filter(t => !existingNames.has(t))
  if (missing.length === 0) {
    console.log('  (none missing)')
  } else {
    missing.forEach(t => console.log(`  ❌ ${t}`))
  }

  console.log('\n--- Existing newer tables ---')
  const existing = newerTables.filter(t => existingNames.has(t))
  existing.forEach(t => console.log(`  ✅ ${t}`))
}

main().catch(e => { console.error(e); process.exit(1) })
