/**
 * Create missing tables required for E2E persistence:
 * - workers_comp_policies
 * - workers_comp_claims
 * - workers_comp_class_codes
 * - workers_comp_audits
 * - equity_grants (new table)
 *
 * Usage: npx tsx scripts/migrate-missing-tables.ts
 */

import { neon } from '@neondatabase/serverless'
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

async function main() {
  console.log('Creating missing tables...\n')

  // ─── Workers' Comp Policies ─────────────────────────────────────────
  console.log('1. workers_comp_policies...')
  await sql`
    CREATE TABLE IF NOT EXISTS workers_comp_policies (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      carrier VARCHAR(255),
      policy_number VARCHAR(100),
      status VARCHAR(20) NOT NULL DEFAULT 'active',
      effective_date DATE,
      expiry_date DATE,
      premium INTEGER,
      covered_employees INTEGER,
      class_codes JSONB,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `
  console.log('   ✅ Created')

  // ─── Workers' Comp Claims ──────────────────────────────────────────
  console.log('2. workers_comp_claims...')
  await sql`
    CREATE TABLE IF NOT EXISTS workers_comp_claims (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      policy_id UUID REFERENCES workers_comp_policies(id) ON DELETE CASCADE,
      employee_name VARCHAR(255),
      incident_date DATE,
      description TEXT,
      injury_type VARCHAR(100),
      body_part VARCHAR(100),
      status VARCHAR(20) NOT NULL DEFAULT 'open',
      reserve_amount INTEGER,
      paid_amount INTEGER DEFAULT 0,
      filed_date DATE,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `
  console.log('   ✅ Created')

  // ─── Workers' Comp Class Codes ─────────────────────────────────────
  console.log('3. workers_comp_class_codes...')
  await sql`
    CREATE TABLE IF NOT EXISTS workers_comp_class_codes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      code VARCHAR(20) NOT NULL,
      description VARCHAR(500),
      rate REAL,
      employee_count INTEGER,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `
  console.log('   ✅ Created')

  // ─── Workers' Comp Audits ──────────────────────────────────────────
  console.log('4. workers_comp_audits...')
  await sql`
    CREATE TABLE IF NOT EXISTS workers_comp_audits (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      audit_date DATE,
      period VARCHAR(100),
      auditor VARCHAR(255),
      status VARCHAR(20) NOT NULL DEFAULT 'pending',
      findings TEXT,
      adjustment_amount INTEGER,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `
  console.log('   ✅ Created')

  // ─── Dynamic Groups ──────────────────────────────────────────────
  console.log('5. dynamic_groups...')
  await sql`
    CREATE TABLE IF NOT EXISTS dynamic_groups (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      type VARCHAR(20) NOT NULL DEFAULT 'dynamic',
      rule JSONB,
      member_count INTEGER DEFAULT 0,
      created_by UUID REFERENCES employees(id),
      last_synced_at TIMESTAMP,
      modules JSONB,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `
  console.log('   ✅ Created')

  // ─── Equity Grants (NEW table for Compensation E2E test) ─────────
  console.log('6. equity_grants...')
  await sql`
    DO $$ BEGIN
      CREATE TYPE equity_grant_type AS ENUM ('RSU', 'stock_option', 'phantom', 'SAR', 'ESPP');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$
  `
  await sql`
    DO $$ BEGIN
      CREATE TYPE equity_grant_status AS ENUM ('active', 'fully_vested', 'cancelled', 'expired');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$
  `
  await sql`
    CREATE TABLE IF NOT EXISTS equity_grants (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
      grant_type equity_grant_type NOT NULL DEFAULT 'RSU',
      shares INTEGER NOT NULL DEFAULT 0,
      strike_price REAL DEFAULT 0,
      vesting_schedule VARCHAR(255),
      vested_shares INTEGER DEFAULT 0,
      current_value INTEGER DEFAULT 0,
      grant_date DATE,
      status equity_grant_status NOT NULL DEFAULT 'active',
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `
  console.log('   ✅ Created')

  // ─── Verify ────────────────────────────────────────────────────────
  console.log('\nVerifying tables exist...')
  const tables = await sql`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name IN (
      'workers_comp_policies',
      'workers_comp_claims',
      'workers_comp_class_codes',
      'workers_comp_audits',
      'dynamic_groups',
      'equity_grants'
    )
    ORDER BY table_name
  `
  for (const t of tables) {
    console.log(`  ✅ ${t.table_name}`)
  }
  console.log(`\n${tables.length}/6 tables created successfully`)

  if (tables.length < 6) {
    const missing = ['workers_comp_policies', 'workers_comp_claims', 'workers_comp_class_codes', 'workers_comp_audits', 'dynamic_groups', 'equity_grants']
      .filter(name => !tables.some(t => t.table_name === name))
    console.log(`❌ Missing: ${missing.join(', ')}`)
  }
}

main().catch(err => {
  console.error('Migration failed:', err)
  process.exit(1)
})
