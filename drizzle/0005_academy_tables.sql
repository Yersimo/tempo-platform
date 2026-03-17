-- 0005: Academy tables for external learning program management
-- 14 new tables, 9 new enums for the Academies module

-- ============================================================
-- ENUMS
-- ============================================================

DO $$ BEGIN
  CREATE TYPE "academy_status" AS ENUM ('draft', 'active', 'archived');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "academy_enrollment_type" AS ENUM ('public', 'private');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "cohort_status" AS ENUM ('upcoming', 'active', 'completed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "academy_participant_status" AS ENUM ('active', 'inactive', 'completed', 'dropped');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "academy_session_type" AS ENUM ('webinar', 'workshop', 'mentoring', 'lecture', 'qa');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "academy_assignment_status" AS ENUM ('pending', 'submitted', 'graded', 'overdue');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "academy_comm_type" AS ENUM ('broadcast', 'automated');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "academy_comm_status" AS ENUM ('sent', 'scheduled', 'failed', 'draft');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "academy_cert_status" AS ENUM ('earned', 'in_progress', 'revoked');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS "academies" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "org_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "name" varchar(500) NOT NULL,
  "description" text,
  "slug" varchar(200) NOT NULL,
  "logo_url" text,
  "brand_color" varchar(20) DEFAULT '#2563eb' NOT NULL,
  "welcome_message" text,
  "enrollment_type" "academy_enrollment_type" DEFAULT 'private' NOT NULL,
  "status" "academy_status" DEFAULT 'draft' NOT NULL,
  "community_enabled" boolean DEFAULT true NOT NULL,
  "languages" jsonb DEFAULT '["en"]' NOT NULL,
  "completion_rules" jsonb,
  "curriculum_course_ids" jsonb DEFAULT '[]' NOT NULL,
  "curriculum_path_ids" jsonb DEFAULT '[]' NOT NULL,
  "created_by" uuid REFERENCES "employees"("id"),
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "academy_cohorts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "org_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "academy_id" uuid NOT NULL REFERENCES "academies"("id") ON DELETE CASCADE,
  "name" varchar(255) NOT NULL,
  "start_date" date NOT NULL,
  "end_date" date NOT NULL,
  "facilitator_name" varchar(255),
  "facilitator_email" varchar(255),
  "max_participants" integer,
  "status" "cohort_status" DEFAULT 'upcoming' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "academy_participants" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "org_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "academy_id" uuid NOT NULL REFERENCES "academies"("id") ON DELETE CASCADE,
  "cohort_id" uuid REFERENCES "academy_cohorts"("id"),
  "full_name" varchar(255) NOT NULL,
  "email" varchar(255) NOT NULL,
  "phone" varchar(50),
  "avatar_url" text,
  "business_name" varchar(255),
  "country" varchar(100),
  "language" varchar(10) DEFAULT 'en' NOT NULL,
  "password_hash" text,
  "status" "academy_participant_status" DEFAULT 'active' NOT NULL,
  "progress" integer DEFAULT 0 NOT NULL,
  "enrolled_date" date DEFAULT CURRENT_DATE NOT NULL,
  "last_active_at" timestamp,
  "invitation_token" varchar(500),
  "invitation_sent_at" timestamp,
  "email_verified" boolean DEFAULT false NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "academy_courses" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "org_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "academy_id" uuid NOT NULL REFERENCES "academies"("id") ON DELETE CASCADE,
  "course_id" uuid NOT NULL REFERENCES "courses"("id") ON DELETE CASCADE,
  "module_number" integer DEFAULT 1 NOT NULL,
  "is_required" boolean DEFAULT true NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "academy_participant_progress" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "org_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "participant_id" uuid NOT NULL REFERENCES "academy_participants"("id") ON DELETE CASCADE,
  "academy_course_id" uuid NOT NULL REFERENCES "academy_courses"("id") ON DELETE CASCADE,
  "status" "block_progress_status" DEFAULT 'not_started' NOT NULL,
  "progress" integer DEFAULT 0 NOT NULL,
  "score" integer,
  "time_spent_minutes" integer DEFAULT 0 NOT NULL,
  "started_at" timestamp,
  "completed_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "academy_sessions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "org_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "academy_id" uuid NOT NULL REFERENCES "academies"("id") ON DELETE CASCADE,
  "cohort_id" uuid REFERENCES "academy_cohorts"("id"),
  "title" varchar(500) NOT NULL,
  "description" text,
  "type" "academy_session_type" DEFAULT 'webinar' NOT NULL,
  "scheduled_date" date NOT NULL,
  "scheduled_time" varchar(50),
  "duration_minutes" integer DEFAULT 60 NOT NULL,
  "instructor" varchar(255),
  "meeting_url" text,
  "recording_url" text,
  "max_attendees" integer,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "academy_session_rsvps" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "org_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "session_id" uuid NOT NULL REFERENCES "academy_sessions"("id") ON DELETE CASCADE,
  "participant_id" uuid NOT NULL REFERENCES "academy_participants"("id") ON DELETE CASCADE,
  "attended" boolean DEFAULT false NOT NULL,
  "rsvpd_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "academy_assignments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "org_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "academy_id" uuid NOT NULL REFERENCES "academies"("id") ON DELETE CASCADE,
  "academy_course_id" uuid REFERENCES "academy_courses"("id"),
  "title" varchar(500) NOT NULL,
  "description" text,
  "due_date" date,
  "max_score" integer DEFAULT 100 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "academy_assignment_submissions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "org_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "assignment_id" uuid NOT NULL REFERENCES "academy_assignments"("id") ON DELETE CASCADE,
  "participant_id" uuid NOT NULL REFERENCES "academy_participants"("id") ON DELETE CASCADE,
  "status" "academy_assignment_status" DEFAULT 'pending' NOT NULL,
  "submission_url" text,
  "submission_text" text,
  "score" integer,
  "feedback" text,
  "submitted_at" timestamp,
  "graded_at" timestamp,
  "graded_by" uuid REFERENCES "employees"("id"),
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "academy_discussions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "org_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "academy_id" uuid NOT NULL REFERENCES "academies"("id") ON DELETE CASCADE,
  "participant_id" uuid REFERENCES "academy_participants"("id") ON DELETE CASCADE,
  "parent_id" uuid,
  "content" text NOT NULL,
  "module_tag" varchar(255),
  "is_pinned" boolean DEFAULT false NOT NULL,
  "is_facilitator" boolean DEFAULT false NOT NULL,
  "facilitator_name" varchar(255),
  "reply_count" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "academy_resources" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "org_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "academy_id" uuid NOT NULL REFERENCES "academies"("id") ON DELETE CASCADE,
  "academy_course_id" uuid REFERENCES "academy_courses"("id"),
  "title" varchar(500) NOT NULL,
  "description" text,
  "type" varchar(50) DEFAULT 'pdf' NOT NULL,
  "url" text,
  "file_size" integer,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "academy_certificates" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "org_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "academy_id" uuid NOT NULL REFERENCES "academies"("id") ON DELETE CASCADE,
  "participant_id" uuid NOT NULL REFERENCES "academy_participants"("id") ON DELETE CASCADE,
  "name" varchar(500) NOT NULL,
  "certificate_number" varchar(100) NOT NULL,
  "certificate_url" text,
  "status" "academy_cert_status" DEFAULT 'in_progress' NOT NULL,
  "requirements" jsonb,
  "issued_at" timestamp,
  "expires_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "academy_communications" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "org_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "academy_id" uuid NOT NULL REFERENCES "academies"("id") ON DELETE CASCADE,
  "type" "academy_comm_type" DEFAULT 'broadcast' NOT NULL,
  "trigger_name" varchar(255),
  "subject" varchar(500) NOT NULL,
  "body" text,
  "recipient_count" integer DEFAULT 0 NOT NULL,
  "status" "academy_comm_status" DEFAULT 'draft' NOT NULL,
  "scheduled_at" timestamp,
  "sent_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "academy_comm_triggers" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "org_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "academy_id" uuid NOT NULL REFERENCES "academies"("id") ON DELETE CASCADE,
  "name" varchar(255) NOT NULL,
  "trigger_event" varchar(100) NOT NULL,
  "subject_template" varchar(500) NOT NULL,
  "body_template" text,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS "idx_academies_org" ON "academies"("org_id");
CREATE INDEX IF NOT EXISTS "idx_academies_slug" ON "academies"("org_id", "slug");
CREATE INDEX IF NOT EXISTS "idx_academy_cohorts_academy" ON "academy_cohorts"("academy_id");
CREATE INDEX IF NOT EXISTS "idx_academy_participants_academy" ON "academy_participants"("academy_id");
CREATE INDEX IF NOT EXISTS "idx_academy_participants_email" ON "academy_participants"("email");
CREATE INDEX IF NOT EXISTS "idx_academy_participants_cohort" ON "academy_participants"("cohort_id");
CREATE INDEX IF NOT EXISTS "idx_academy_courses_academy" ON "academy_courses"("academy_id");
CREATE INDEX IF NOT EXISTS "idx_academy_progress_participant" ON "academy_participant_progress"("participant_id");
CREATE INDEX IF NOT EXISTS "idx_academy_sessions_academy" ON "academy_sessions"("academy_id");
CREATE INDEX IF NOT EXISTS "idx_academy_assignments_academy" ON "academy_assignments"("academy_id");
CREATE INDEX IF NOT EXISTS "idx_academy_discussions_academy" ON "academy_discussions"("academy_id");
CREATE INDEX IF NOT EXISTS "idx_academy_discussions_parent" ON "academy_discussions"("parent_id");
CREATE INDEX IF NOT EXISTS "idx_academy_resources_academy" ON "academy_resources"("academy_id");
CREATE INDEX IF NOT EXISTS "idx_academy_certificates_participant" ON "academy_certificates"("participant_id");
CREATE INDEX IF NOT EXISTS "idx_academy_communications_academy" ON "academy_communications"("academy_id");
CREATE INDEX IF NOT EXISTS "idx_academy_session_rsvps_session" ON "academy_session_rsvps"("session_id");
CREATE INDEX IF NOT EXISTS "idx_academy_assignment_subs_assignment" ON "academy_assignment_submissions"("assignment_id");
CREATE INDEX IF NOT EXISTS "idx_academy_assignment_subs_participant" ON "academy_assignment_submissions"("participant_id");

-- Unique constraints to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS "idx_academies_org_slug" ON "academies"("org_id", "slug");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_academy_participants_email_academy" ON "academy_participants"("academy_id", "email");

-- ============================================================
-- RLS POLICIES
-- ============================================================

ALTER TABLE "academies" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "academy_cohorts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "academy_participants" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "academy_courses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "academy_participant_progress" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "academy_sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "academy_session_rsvps" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "academy_assignments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "academy_assignment_submissions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "academy_discussions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "academy_resources" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "academy_certificates" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "academy_communications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "academy_comm_triggers" ENABLE ROW LEVEL SECURITY;

-- RLS policy for org scoping (same pattern as existing tables)
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'academies', 'academy_cohorts', 'academy_participants', 'academy_courses',
    'academy_participant_progress', 'academy_sessions', 'academy_session_rsvps',
    'academy_assignments', 'academy_assignment_submissions',
    'academy_discussions', 'academy_resources', 'academy_certificates',
    'academy_communications', 'academy_comm_triggers'
  ] LOOP
    EXECUTE format('
      CREATE POLICY IF NOT EXISTS %I ON %I
        USING (org_id = current_setting(''app.current_org_id'')::uuid)
        WITH CHECK (org_id = current_setting(''app.current_org_id'')::uuid)',
      'rls_' || t || '_org', t
    );
  END LOOP;
END $$;
