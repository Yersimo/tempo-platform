import { neon } from '@neondatabase/serverless'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const sql = neon(process.env.DATABASE_URL as string)

async function run() {
  // Add missing columns to payroll_runs
  const alterations = [
    sql`ALTER TABLE "payroll_runs" ADD COLUMN IF NOT EXISTS "approved_by" uuid REFERENCES "employees"("id")`,
    sql`ALTER TABLE "payroll_runs" ADD COLUMN IF NOT EXISTS "approved_at" timestamp`,
    sql`ALTER TABLE "payroll_runs" ADD COLUMN IF NOT EXISTS "payment_reference" varchar(255)`,
    sql`ALTER TABLE "payroll_runs" ADD COLUMN IF NOT EXISTS "cancellation_reason" text`,
    sql`ALTER TABLE "payroll_runs" ADD COLUMN IF NOT EXISTS "run_date" timestamp`,
  ]

  for (const alt of alterations) {
    try {
      await alt
      console.log('OK')
    } catch (e: any) {
      console.error('Error:', e.message?.slice(0, 150))
    }
  }
  console.log('payroll_runs columns fixed')

  // Check benefit_enrollments for missing columns too
  const benefitCols = [
    sql`ALTER TABLE "benefit_enrollments" ADD COLUMN IF NOT EXISTS "enrolled_date" date`,
    sql`ALTER TABLE "benefit_enrollments" ADD COLUMN IF NOT EXISTS "effective_date" date`,
  ]
  for (const alt of benefitCols) {
    try {
      await alt
      console.log('OK')
    } catch (e: any) {
      console.error('Error:', e.message?.slice(0, 150))
    }
  }

  console.log('Done')
}

run().catch(e => console.error('Fatal:', e))
