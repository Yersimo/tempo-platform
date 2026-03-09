/**
 * Seed Tax Configs
 *
 * One-time migration script that reads hardcoded statutory deduction rates
 * from statutory-deductions.ts and inserts them into the tax_configs table.
 *
 * Usage: npx tsx scripts/seed-tax-configs.ts
 *
 * Requires:
 *   - DATABASE_URL env var
 *   - ORG_ID env var (organization to seed for)
 */

import { neon } from '@neondatabase/serverless'

const DATABASE_URL = process.env.DATABASE_URL
const ORG_ID = process.env.ORG_ID || '07c5d8a5-51a2-467c-adf8-1b2424d3c10b' // NextLend default

if (!DATABASE_URL) {
  console.error('DATABASE_URL is required')
  process.exit(1)
}

const sql = neon(DATABASE_URL)

// Inline copy of STATUTORY_REGISTRY for seeding (avoids import path issues)
const STATUTORY_REGISTRY: Record<string, Array<{
  name: string; type: string; employeeRate: number; employerRate: number; currency: string
}>> = {
  NG: [
    { name: 'Pension (PFA)', type: 'pension', employeeRate: 0.08, employerRate: 0.10, currency: 'NGN' },
    { name: 'NHF', type: 'housing', employeeRate: 0.025, employerRate: 0, currency: 'NGN' },
    { name: 'NHIS', type: 'health', employeeRate: 0.05, employerRate: 0.10, currency: 'NGN' },
    { name: 'ITF', type: 'training_levy', employeeRate: 0, employerRate: 0.01, currency: 'NGN' },
    { name: 'NSITF', type: 'social_insurance', employeeRate: 0, employerRate: 0.01, currency: 'NGN' },
  ],
  KE: [
    { name: 'NSSF', type: 'pension', employeeRate: 0.06, employerRate: 0.06, currency: 'KES' },
    { name: 'NHIF', type: 'health', employeeRate: 0.015, employerRate: 0, currency: 'KES' },
    { name: 'Housing Levy', type: 'housing', employeeRate: 0.015, employerRate: 0.015, currency: 'KES' },
  ],
  GH: [
    { name: 'SSNIT (Tier 1)', type: 'pension', employeeRate: 0.055, employerRate: 0.13, currency: 'GHS' },
    { name: 'SSNIT (Tier 2)', type: 'pension', employeeRate: 0.05, employerRate: 0, currency: 'GHS' },
    { name: 'NHIL', type: 'health', employeeRate: 0.025, employerRate: 0, currency: 'GHS' },
  ],
  ZA: [
    { name: 'UIF', type: 'social_insurance', employeeRate: 0.01, employerRate: 0.01, currency: 'ZAR' },
    { name: 'SDL', type: 'training_levy', employeeRate: 0, employerRate: 0.01, currency: 'ZAR' },
  ],
  TZ: [
    { name: 'NSSF', type: 'pension', employeeRate: 0.10, employerRate: 0.10, currency: 'TZS' },
    { name: 'NHIF', type: 'health', employeeRate: 0.03, employerRate: 0.03, currency: 'TZS' },
    { name: 'WCF', type: 'social_insurance', employeeRate: 0, employerRate: 0.005, currency: 'TZS' },
    { name: 'SDL', type: 'training_levy', employeeRate: 0, employerRate: 0.045, currency: 'TZS' },
  ],
  UG: [
    { name: 'NSSF', type: 'pension', employeeRate: 0.05, employerRate: 0.10, currency: 'UGX' },
  ],
  RW: [
    { name: 'RSSB Pension', type: 'pension', employeeRate: 0.03, employerRate: 0.05, currency: 'RWF' },
    { name: 'RSSB Maternity', type: 'social_insurance', employeeRate: 0, employerRate: 0.003, currency: 'RWF' },
    { name: 'CBHI', type: 'health', employeeRate: 0, employerRate: 0.005, currency: 'RWF' },
  ],
  ET: [
    { name: 'Pension', type: 'pension', employeeRate: 0.07, employerRate: 0.11, currency: 'ETB' },
  ],
  EG: [
    { name: 'Social Insurance', type: 'social_insurance', employeeRate: 0.11, employerRate: 0.1875, currency: 'EGP' },
    { name: 'Health Insurance', type: 'health', employeeRate: 0.01, employerRate: 0.04, currency: 'EGP' },
  ],
  CM: [
    { name: 'CNPS', type: 'pension', employeeRate: 0.042, employerRate: 0.042, currency: 'XAF' },
    { name: 'Family Allowance', type: 'social_insurance', employeeRate: 0, employerRate: 0.07, currency: 'XAF' },
  ],
  CI: [
    { name: 'CNPS Pension', type: 'pension', employeeRate: 0.063, employerRate: 0.077, currency: 'XOF' },
    { name: 'AMU Health', type: 'health', employeeRate: 0.028, employerRate: 0.037, currency: 'XOF' },
  ],
  SN: [
    { name: 'IPRES Pension', type: 'pension', employeeRate: 0.056, employerRate: 0.084, currency: 'XOF' },
    { name: 'CSS', type: 'social_insurance', employeeRate: 0, employerRate: 0.07, currency: 'XOF' },
    { name: 'IPM Health', type: 'health', employeeRate: 0.03, employerRate: 0.03, currency: 'XOF' },
  ],
}

async function main() {
  console.log('Seeding tax configs for org:', ORG_ID)

  let inserted = 0
  for (const [country, deductions] of Object.entries(STATUTORY_REGISTRY)) {
    for (const ded of deductions) {
      const totalRate = ded.employeeRate + ded.employerRate
      await sql`
        INSERT INTO tax_configs (id, org_id, country, tax_type, rate, description, employer_contribution, employee_contribution, effective_date, status)
        VALUES (gen_random_uuid(), ${ORG_ID}, ${country}, ${ded.type}, ${totalRate}, ${ded.name}, ${ded.employerRate}, ${ded.employeeRate}, '2024-01-01', 'active')
        ON CONFLICT DO NOTHING
      `
      inserted++
      console.log(`  ${country}: ${ded.name} (employee: ${(ded.employeeRate * 100).toFixed(1)}%, employer: ${(ded.employerRate * 100).toFixed(1)}%)`)
    }
  }

  console.log(`\nDone! Inserted ${inserted} tax config rows.`)
}

main().catch(console.error)
