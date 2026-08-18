CREATE TABLE IF NOT EXISTS "provider_fact_observations" (
  "id" bigserial PRIMARY KEY NOT NULL,
  "provider_id" varchar(128) NOT NULL,
  "provider_event_id" varchar(256) NOT NULL,
  "provider_reference" varchar(512) NOT NULL,
  "kind" varchar(64) NOT NULL,
  "resource_type" varchar(32) NOT NULL,
  "internal_reference" varchar(128) NOT NULL,
  "occurred_at" timestamp with time zone NOT NULL,
  "status" varchar(32) NOT NULL,
  "reason" varchar(256),
  "recorded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "provider_fact_observations_resource_idx"
  ON "provider_fact_observations" USING btree
  ("provider_id","resource_type","internal_reference","recorded_at");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "operations_action_audits" (
  "id" varchar(128) PRIMARY KEY NOT NULL,
  "actor_id" varchar(128) NOT NULL,
  "action" varchar(64) NOT NULL,
  "target_type" varchar(32) NOT NULL,
  "target_id" varchar(128) NOT NULL,
  "before_state" jsonb NOT NULL,
  "after_state" jsonb NOT NULL,
  "reason" varchar(1024) NOT NULL,
  "occurred_at" timestamp with time zone NOT NULL,
  "correlation_id" varchar(128) NOT NULL,
  "recorded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "operations_action_audits_target_idx"
  ON "operations_action_audits" USING btree ("target_type","target_id","occurred_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "operations_action_audits_actor_idx"
  ON "operations_action_audits" USING btree ("actor_id","occurred_at");
