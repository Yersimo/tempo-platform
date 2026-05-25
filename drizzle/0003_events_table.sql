-- ============================================================
-- Migration: events table — canonical change-data-capture log
-- ============================================================
-- Foundation for Tempo's data moat (Stays Current + Travels Through Time).
-- Every meaningful state change emits a typed event into this table.

CREATE TABLE IF NOT EXISTS "events" (
    "id"                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "org_id"              uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
    "event_type"          varchar(80) NOT NULL,
    "event_version"       integer NOT NULL DEFAULT 1,
    "entity_type"         varchar(50) NOT NULL,
    "entity_id"           varchar(64) NOT NULL,
    "actor_id"            uuid REFERENCES "employees"("id"),
    "payload"             jsonb NOT NULL,
    "before"              jsonb,
    "after"               jsonb,
    "correlation_id"      varchar(64),
    "caused_by_event_id"  uuid,
    "occurred_at"         timestamp NOT NULL,
    "recorded_at"         timestamp NOT NULL DEFAULT now()
);

-- Indexes for the common query patterns
CREATE INDEX IF NOT EXISTS "events_org_id_idx"          ON "events"("org_id");
CREATE INDEX IF NOT EXISTS "events_event_type_idx"      ON "events"("event_type");
CREATE INDEX IF NOT EXISTS "events_entity_idx"          ON "events"("entity_type", "entity_id");
CREATE INDEX IF NOT EXISTS "events_actor_idx"           ON "events"("actor_id");
CREATE INDEX IF NOT EXISTS "events_correlation_id_idx"  ON "events"("correlation_id");
CREATE INDEX IF NOT EXISTS "events_occurred_at_idx"     ON "events"("occurred_at" DESC);

-- RLS policy — events are scoped to the organization that emitted them
ALTER TABLE "events" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "events_org_isolation" ON "events"
    USING ("org_id" = current_setting('app.current_org_id', true)::uuid);

COMMENT ON TABLE "events" IS
    'Canonical change-data-capture log. Every meaningful state change emits a typed event. '
    'Foundation for cross-module fan-out, bi-temporal queries, audit trail, and outbound webhooks.';

COMMENT ON COLUMN "events"."event_type" IS 'Dotted type — e.g., expense.submitted, employee.role_changed';
COMMENT ON COLUMN "events"."payload" IS 'Typed JSON; schema varies per event_type. Versioned via event_version.';
COMMENT ON COLUMN "events"."before" IS 'Optional before-state for field-level diff (Travels Through Time).';
COMMENT ON COLUMN "events"."after" IS 'Optional after-state for field-level diff (Travels Through Time).';
COMMENT ON COLUMN "events"."correlation_id" IS 'Groups related events from one logical action.';
COMMENT ON COLUMN "events"."caused_by_event_id" IS 'Parent event that caused this one — for cascading.';
