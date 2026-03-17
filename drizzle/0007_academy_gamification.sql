-- 0007: Academy Gamification — Badges, Points, Leaderboard
-- 3 new tables for the gamification system

-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS "academy_badges" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "org_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "academy_id" uuid NOT NULL REFERENCES "academies"("id") ON DELETE CASCADE,
  "name" varchar(255) NOT NULL,
  "description" text,
  "icon_url" text,
  "icon_emoji" varchar(10),
  "criteria" jsonb,
  "points_awarded" integer DEFAULT 0 NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "academy_participant_badges" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "org_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "participant_id" uuid NOT NULL REFERENCES "academy_participants"("id") ON DELETE CASCADE,
  "badge_id" uuid NOT NULL REFERENCES "academy_badges"("id") ON DELETE CASCADE,
  "earned_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "academy_points" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "org_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "participant_id" uuid NOT NULL REFERENCES "academy_participants"("id") ON DELETE CASCADE,
  "academy_id" uuid NOT NULL REFERENCES "academies"("id") ON DELETE CASCADE,
  "points" integer NOT NULL,
  "reason" varchar(255) NOT NULL,
  "entity_id" uuid,
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS "idx_academy_badges_academy" ON "academy_badges"("academy_id");
CREATE INDEX IF NOT EXISTS "idx_academy_badges_org" ON "academy_badges"("org_id");
CREATE INDEX IF NOT EXISTS "idx_academy_participant_badges_participant" ON "academy_participant_badges"("participant_id");
CREATE INDEX IF NOT EXISTS "idx_academy_participant_badges_badge" ON "academy_participant_badges"("badge_id");
CREATE INDEX IF NOT EXISTS "idx_academy_points_participant" ON "academy_points"("participant_id");
CREATE INDEX IF NOT EXISTS "idx_academy_points_academy" ON "academy_points"("academy_id");
CREATE INDEX IF NOT EXISTS "idx_academy_points_participant_academy" ON "academy_points"("participant_id", "academy_id");

-- Unique constraint: a participant can only earn a badge once
CREATE UNIQUE INDEX IF NOT EXISTS "idx_academy_participant_badges_unique"
  ON "academy_participant_badges"("participant_id", "badge_id");

-- ============================================================
-- RLS POLICIES
-- ============================================================

ALTER TABLE "academy_badges" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "academy_participant_badges" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "academy_points" ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'academy_badges', 'academy_participant_badges', 'academy_points'
  ] LOOP
    EXECUTE format('
      CREATE POLICY IF NOT EXISTS %I ON %I
        USING (org_id = current_setting(''app.current_org_id'')::uuid)
        WITH CHECK (org_id = current_setting(''app.current_org_id'')::uuid)',
      'rls_' || t || '_org', t
    );
  END LOOP;
END $$;
