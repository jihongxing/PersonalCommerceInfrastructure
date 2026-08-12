CREATE TABLE "product_events" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"name" varchar(64) NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"actor_id" varchar(128) NOT NULL,
	"object_id" varchar(128) NOT NULL,
	"correlation_id" varchar(128) NOT NULL,
	"source" varchar(32) NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_events_name_check" CHECK (name in ('creator_registered', 'creator_qualified', 'creator_activated', 'creator_published', 'creator_distributed', 'storefront_viewed', 'commerce_action_submitted', 'commerce_confirmed', 'commerce_declined', 'external_paid_verified', 'fulfillment_observed')),
	CONSTRAINT "product_events_source_check" CHECK (source in ('system', 'creator', 'customer', 'pilot_operations'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX "product_events_correlation_event_object_unique" ON "product_events" USING btree ("correlation_id","name","object_id");--> statement-breakpoint
CREATE INDEX "product_events_object_occurred_at_idx" ON "product_events" USING btree ("object_id","occurred_at");--> statement-breakpoint
CREATE INDEX "product_events_actor_occurred_at_idx" ON "product_events" USING btree ("actor_id","occurred_at");