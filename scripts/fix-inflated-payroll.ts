import { neon } from '@neondatabase/serverless'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const sql = neon(process.env.DATABASE_URL as string)

async function run() {
  console.log('=== Fix Inflated Payroll Data ===')

  // 1. Check current state of employee_payroll_entries
  const before = await sql`
    SELECT id, employee_id, gross_pay, net_pay, base_pay, federal_tax, total_deductions
    FROM employee_payroll_entries
    WHERE gross_pay > 50000000
    ORDER BY gross_pay DESC
  `
  console.log(`\nFound ${before.length} inflated employee_payroll_entries rows:`)
  for (const row of before) {
    console.log(`  ${row.employee_id}: gross=$${(row.gross_pay / 100).toLocaleString()} (should be $${(row.gross_pay / 10000).toLocaleString()})`)
  }

  if (before.length === 0) {
    console.log('No inflated rows found. Nothing to fix.')
    return
  }

  // 2. Fix employee_payroll_entries — divide all integer amount columns by 100
  // Skip jsonb columns: additional_taxes, garnishments, bonus_details
  await sql`
    UPDATE employee_payroll_entries
    SET gross_pay = gross_pay / 100,
        net_pay = net_pay / 100,
        base_pay = base_pay / 100,
        overtime_pay = overtime_pay / 100,
        bonus_pay = bonus_pay / 100,
        federal_tax = federal_tax / 100,
        state_tax = state_tax / 100,
        social_security = social_security / 100,
        medicare = medicare / 100,
        pension = pension / 100,
        garnishment_total = garnishment_total / 100,
        benefit_deductions = benefit_deductions / 100,
        total_deductions = total_deductions / 100
    WHERE gross_pay > 50000000
  `
  console.log(`\nFixed ${before.length} employee_payroll_entries rows (divided by 100)`)

  // 3. Fix payroll_runs — divide totals by 100 for matching runs
  const inflatedRuns = await sql`
    SELECT id, period, total_gross, total_deductions, total_net
    FROM payroll_runs
    WHERE total_gross > 50000000
  `
  console.log(`\nFound ${inflatedRuns.length} inflated payroll_runs:`)
  for (const run of inflatedRuns) {
    console.log(`  ${run.period}: gross=$${(run.total_gross / 100).toLocaleString()} (should be $${(run.total_gross / 10000).toLocaleString()})`)
  }

  if (inflatedRuns.length > 0) {
    await sql`
      UPDATE payroll_runs
      SET total_gross = total_gross / 100,
          total_deductions = total_deductions / 100,
          total_net = total_net / 100
      WHERE total_gross > 50000000
    `
    console.log(`Fixed ${inflatedRuns.length} payroll_runs rows (divided by 100)`)
  }

  // 4. Verify
  const afterEntries = await sql`
    SELECT employee_id, gross_pay, net_pay FROM employee_payroll_entries ORDER BY gross_pay DESC LIMIT 10
  `
  console.log('\n=== Verification (top 10 entries by gross_pay) ===')
  for (const row of afterEntries) {
    console.log(`  ${row.employee_id}: gross=${(row.gross_pay / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}, net=${(row.net_pay / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}`)
  }

  const afterRuns = await sql`
    SELECT period, total_gross, total_net FROM payroll_runs ORDER BY total_gross DESC LIMIT 5
  `
  console.log('\n=== Verification (top 5 runs by total_gross) ===')
  for (const run of afterRuns) {
    console.log(`  ${run.period}: gross=${(run.total_gross / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}, net=${(run.total_net / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}`)
  }

  console.log('\n✅ Done!')
}

run().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
