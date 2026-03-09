-- 0003: Create 6 missing tables for Payroll/Benefits persistence
-- contractorPayments, payrollSchedules, taxConfigs, taxFilings, benefitDependents, lifeEvents

CREATE TABLE IF NOT EXISTS "contractor_payments" (
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
);

CREATE TABLE IF NOT EXISTS "payroll_schedules" (
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
);

CREATE TABLE IF NOT EXISTS "tax_configs" (
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
);

CREATE TABLE IF NOT EXISTS "tax_filings" (
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
);

CREATE TABLE IF NOT EXISTS "benefit_dependents" (
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
);

CREATE TABLE IF NOT EXISTS "life_events" (
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
);
