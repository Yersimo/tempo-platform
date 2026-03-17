-- 0010: Academy custom domains for white-label support
-- Allows organizations to map custom domains (e.g., academy.ecobank.com) to their academies

-- Enum for domain verification status
DO $$ BEGIN
  CREATE TYPE "academy_domain_status" AS ENUM ('pending', 'verifying', 'active', 'failed', 'expired');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Custom domains table
CREATE TABLE IF NOT EXISTS "academy_custom_domains" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "org_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "academy_id" uuid NOT NULL REFERENCES "academies"("id") ON DELETE CASCADE,
  "domain" varchar(500) NOT NULL,
  "status" "academy_domain_status" DEFAULT 'pending' NOT NULL,
  "ssl_status" varchar(50) DEFAULT 'pending' NOT NULL,
  "verification_token" varchar(500),
  "verification_method" varchar(50) DEFAULT 'cname' NOT NULL,
  "verified_at" timestamp,
  "ssl_issued_at" timestamp,
  "ssl_expires_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Unique constraint: one registration per domain globally
CREATE UNIQUE INDEX IF NOT EXISTS "academy_custom_domains_domain_unique" ON "academy_custom_domains" ("domain");

-- Index for hostname lookups (middleware routing)
CREATE INDEX IF NOT EXISTS "academy_custom_domains_domain_status_idx" ON "academy_custom_domains" ("domain", "status");

-- Index for listing domains by academy
CREATE INDEX IF NOT EXISTS "academy_custom_domains_org_academy_idx" ON "academy_custom_domains" ("org_id", "academy_id");

-- RLS policy: restrict to rows matching current org
ALTER TABLE "academy_custom_domains" ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "academy_custom_domains_org_isolation" ON "academy_custom_domains";
  CREATE POLICY "academy_custom_domains_org_isolation" ON "academy_custom_domains"
    USING (org_id = current_setting('app.current_org_id', true)::uuid);
EXCEPTION WHEN OTHERS THEN null; END $$;
