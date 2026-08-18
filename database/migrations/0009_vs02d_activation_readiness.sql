CREATE TABLE "provider_webhook_receipts" (
  "provider_id" varchar(128) NOT NULL,
  "provider_event_id" varchar(256) NOT NULL,
  "payload_sha256" varchar(64) NOT NULL,
  "received_at" timestamp with time zone NOT NULL,
  "processed" boolean DEFAULT false NOT NULL,
  "processed_at" timestamp with time zone,
  "recorded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "provider_webhook_receipts_event_unique" ON "provider_webhook_receipts" USING btree ("provider_id","provider_event_id");
--> statement-breakpoint
CREATE INDEX "provider_webhook_receipts_received_at_idx" ON "provider_webhook_receipts" USING btree ("received_at");
--> statement-breakpoint
CREATE TABLE "provider_fact_receipts" (
  "provider_id" varchar(128) NOT NULL,
  "provider_event_id" varchar(256) NOT NULL,
  "provider_reference" varchar(512) NOT NULL,
  "kind" varchar(64) NOT NULL,
  "resource_type" varchar(32) NOT NULL,
  "internal_reference" varchar(128) NOT NULL,
  "amount_minor" bigint NOT NULL,
  "currency" varchar(3) NOT NULL,
  "sequence" bigint NOT NULL,
  "occurred_at" timestamp with time zone NOT NULL,
  "recorded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "provider_fact_receipts_event_unique" ON "provider_fact_receipts" USING btree ("provider_id","provider_event_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "provider_fact_receipts_resource_unique" ON "provider_fact_receipts" USING btree ("provider_id","resource_type","internal_reference");
