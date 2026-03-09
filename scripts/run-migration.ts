import { neon } from '@neondatabase/serverless'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const sql = neon(process.env.DATABASE_URL as string)

async function run() {
  // Create each table individually using tagged template literals
  await sql`CREATE TABLE IF NOT EXISTS "contractor_payments" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "org_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
    "contractor_name" varchar(255) NOT NULL,
    "company" varchar(255),
    "service_type" varchar(255),
    "invoice_number" varchar(100),
    "amount" integer NOT NULL,
    "currency" varchar(10) DEFAULT 'USD' NOT NULL,
    "status" varchar(50) DEFAULT 'pending' NOT NULL,
    "due_date" date,
    "paid_date" date,
    "payment_method" varchar(50),
    "tax_form" varchar(50),
    "country" varchar(100),
    "created_at" timestamp DEFAULT now() NOT NULL
  )`
  console.log('Created: contractor_payments')

  await sql`CREATE TABLE IF NOT EXISTS "payroll_schedules" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "org_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
    "name" varchar(255) NOT NULL,
    "frequency" varchar(50) NOT NULL,
    "next_run_date" date,
    "employee_group" varchar(255),
    "auto_approve" boolean DEFAULT false NOT NULL,
    "currency" varchar(10) DEFAULT 'USD' NOT NULL,
    "status" varchar(50) DEFAULT 'active' NOT NULL,
    "last_run_date" date,
    "created_at" timestamp DEFAULT now() NOT NULL
  )`
  console.log('Created: payroll_schedules')

  await sql`CREATE TABLE IF NOT EXISTS "tax_configs" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "org_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
    "country" varchar(100) NOT NULL,
    "tax_type" varchar(255) NOT NULL,
    "rate" real NOT NULL,
    "description" text,
    "employer_contribution" real DEFAULT 0,
    "employee_contribution" real DEFAULT 0,
    "effective_date" date,
    "status" varchar(50) DEFAULT 'active' NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL
  )`
  console.log('Created: tax_configs')

  await sql`CREATE TABLE IF NOT EXISTS "tax_filings" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "org_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
    "country" varchar(100) NOT NULL,
    "form_name" varchar(255) NOT NULL,
    "description" text,
    "deadline" date,
    "frequency" varchar(50),
    "status" varchar(50) DEFAULT 'upcoming' NOT NULL,
    "filed_date" date,
    "filing_period" varchar(100),
    "created_at" timestamp DEFAULT now() NOT NULL
  )`
  console.log('Created: tax_filings')

  await sql`CREATE TABLE IF NOT EXISTS "benefit_dependents" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "org_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
    "employee_id" uuid NOT NULL REFERENCES "employees"("id") ON DELETE CASCADE,
    "first_name" varchar(255) NOT NULL,
    "last_name" varchar(255) NOT NULL,
    "relationship" varchar(50) NOT NULL,
    "date_of_birth" date,
    "gender" varchar(20),
    "plan_ids" jsonb,
    "created_at" timestamp DEFAULT now() NOT NULL
  )`
  console.log('Created: benefit_dependents')

  await sql`CREATE TABLE IF NOT EXISTS "life_events" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "org_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
    "employee_id" uuid NOT NULL REFERENCES "employees"("id") ON DELETE CASCADE,
    "type" varchar(50) NOT NULL,
    "event_date" date NOT NULL,
    "reported_date" date,
    "deadline" date,
    "status" varchar(50) DEFAULT 'pending' NOT NULL,
    "notes" text,
    "benefit_changes" jsonb,
    "created_at" timestamp DEFAULT now() NOT NULL
  )`
  console.log('Created: life_events')

  console.log('All 6 tables created successfully!')
}

run().catch(e => console.error('Fatal:', e))
