-- 0009: Academy SCORM packages, attempt tracking, and multi-language translations
-- 3 new tables for SCORM import and i18n content systems

-- ============================================================
-- SCORM PACKAGES
-- ============================================================

CREATE TABLE IF NOT EXISTS "academy_scorm_packages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "org_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "academy_id" uuid NOT NULL REFERENCES "academies"("id") ON DELETE CASCADE,
  "academy_course_id" uuid REFERENCES "academy_courses"("id"),
  "title" varchar(500) NOT NULL,
  "version" varchar(50) NOT NULL DEFAULT '1.2',
  "package_url" text NOT NULL,
  "launch_url" text,
  "manifest_data" jsonb,
  "status" varchar(50) NOT NULL DEFAULT 'processing',
  "created_at" timestamp NOT NULL DEFAULT now()
);

-- ============================================================
-- SCORM ATTEMPTS
-- ============================================================

CREATE TABLE IF NOT EXISTS "academy_scorm_attempts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "org_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "package_id" uuid NOT NULL REFERENCES "academy_scorm_packages"("id") ON DELETE CASCADE,
  "participant_id" uuid NOT NULL REFERENCES "academy_participants"("id") ON DELETE CASCADE,
  "cmi_data" jsonb NOT NULL DEFAULT '{}',
  "score" integer,
  "status" varchar(50) NOT NULL DEFAULT 'not attempted',
  "time_spent" integer NOT NULL DEFAULT 0,
  "started_at" timestamp,
  "completed_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

-- ============================================================
-- TRANSLATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS "academy_translations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "org_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "academy_id" uuid NOT NULL REFERENCES "academies"("id") ON DELETE CASCADE,
  "entity_type" varchar(50) NOT NULL,
  "entity_id" uuid NOT NULL,
  "field" varchar(100) NOT NULL,
  "language" varchar(10) NOT NULL,
  "value" text NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================

-- SCORM packages: lookup by academy
CREATE INDEX IF NOT EXISTS "idx_scorm_packages_academy"
  ON "academy_scorm_packages" ("org_id", "academy_id");

-- SCORM packages: lookup by course
CREATE INDEX IF NOT EXISTS "idx_scorm_packages_course"
  ON "academy_scorm_packages" ("academy_course_id")
  WHERE "academy_course_id" IS NOT NULL;

-- SCORM attempts: lookup by package + participant
CREATE INDEX IF NOT EXISTS "idx_scorm_attempts_package_participant"
  ON "academy_scorm_attempts" ("org_id", "package_id", "participant_id");

-- SCORM attempts: lookup by participant across packages
CREATE INDEX IF NOT EXISTS "idx_scorm_attempts_participant"
  ON "academy_scorm_attempts" ("org_id", "participant_id");

-- Translations: unique constraint on entity+field+language per org/academy
CREATE UNIQUE INDEX IF NOT EXISTS "idx_translations_unique"
  ON "academy_translations" ("org_id", "academy_id", "entity_type", "entity_id", "field", "language");

-- Translations: lookup all translations for an entity
CREATE INDEX IF NOT EXISTS "idx_translations_entity"
  ON "academy_translations" ("org_id", "academy_id", "entity_type", "entity_id");

-- Translations: lookup by language (for bulk export)
CREATE INDEX IF NOT EXISTS "idx_translations_language"
  ON "academy_translations" ("org_id", "academy_id", "language");

-- ============================================================
-- ROW-LEVEL SECURITY
-- ============================================================

ALTER TABLE "academy_scorm_packages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "academy_scorm_attempts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "academy_translations" ENABLE ROW LEVEL SECURITY;

-- SCORM packages: org-scoped access
DO $$ BEGIN
  CREATE POLICY "academy_scorm_packages_org_isolation" ON "academy_scorm_packages"
    USING (org_id::text = current_setting('app.current_org_id', true));
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- SCORM attempts: org-scoped access
DO $$ BEGIN
  CREATE POLICY "academy_scorm_attempts_org_isolation" ON "academy_scorm_attempts"
    USING (org_id::text = current_setting('app.current_org_id', true));
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Translations: org-scoped access
DO $$ BEGIN
  CREATE POLICY "academy_translations_org_isolation" ON "academy_translations"
    USING (org_id::text = current_setting('app.current_org_id', true));
EXCEPTION WHEN duplicate_object THEN null; END $$;
