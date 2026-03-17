-- 0008: Academy webhook tables for event-driven integrations
-- 2 new tables, 1 new enum for webhook subscriptions and delivery logs

-- ============================================================
-- ENUMS
-- ============================================================

DO $$ BEGIN
  CREATE TYPE "academy_webhook_status" AS ENUM ('active', 'inactive', 'failed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS "academy_webhooks" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "org_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "academy_id" uuid NOT NULL REFERENCES "academies"("id") ON DELETE CASCADE,
  "url" text NOT NULL,
  "secret" varchar(500) NOT NULL,
  "events" jsonb DEFAULT '[]' NOT NULL,
  "status" "academy_webhook_status" DEFAULT 'active' NOT NULL,
  "last_triggered_at" timestamp,
  "fail_count" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "academy_webhook_logs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "org_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "webhook_id" uuid NOT NULL REFERENCES "academy_webhooks"("id") ON DELETE CASCADE,
  "event" varchar(100) NOT NULL,
  "payload" jsonb,
  "response_status" integer,
  "response_body" text,
  "success" boolean DEFAULT false NOT NULL,
  "attempt_number" integer DEFAULT 1 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS "idx_academy_webhooks_org" ON "academy_webhooks"("org_id");
CREATE INDEX IF NOT EXISTS "idx_academy_webhooks_academy" ON "academy_webhooks"("academy_id");
CREATE INDEX IF NOT EXISTS "idx_academy_webhooks_status" ON "academy_webhooks"("status");
CREATE INDEX IF NOT EXISTS "idx_academy_webhook_logs_webhook" ON "academy_webhook_logs"("webhook_id");
CREATE INDEX IF NOT EXISTS "idx_academy_webhook_logs_event" ON "academy_webhook_logs"("event");
CREATE INDEX IF NOT EXISTS "idx_academy_webhook_logs_created" ON "academy_webhook_logs"("created_at");

-- ============================================================
-- RLS POLICIES
-- ============================================================

ALTER TABLE "academy_webhooks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "academy_webhook_logs" ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['academy_webhooks', 'academy_webhook_logs'] LOOP
    EXECUTE format('
      CREATE POLICY IF NOT EXISTS %I ON %I
        USING (org_id = current_setting(''app.current_org_id'')::uuid)
        WITH CHECK (org_id = current_setting(''app.current_org_id'')::uuid)',
      'rls_' || t || '_org', t
    );
  END LOOP;
END $$;
