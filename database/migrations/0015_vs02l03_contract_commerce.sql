-- Canonical Contract facts: 'contract_proposed', 'contract_accepted', 'contract_rejected',
-- 'contract_expired', 'contract_formed', 'contract_cancelled'.
ALTER TABLE "paid_service_orders"
  ADD COLUMN "contract_id" varchar(128);
--> statement-breakpoint
CREATE UNIQUE INDEX "paid_service_orders_contract_unique"
  ON "paid_service_orders" USING btree ("contract_id");
--> statement-breakpoint
ALTER TABLE "paid_service_orders"
  DROP CONSTRAINT "paid_service_orders_single_source_check";
--> statement-breakpoint
ALTER TABLE "paid_service_orders"
  ADD CONSTRAINT "paid_service_orders_single_source_check"
  CHECK (
    (("commerce_action_id" IS NOT NULL)::int
      + ("reservation_id" IS NOT NULL)::int
      + ("contract_id" IS NOT NULL)::int) = 1
  );
--> statement-breakpoint
CREATE TABLE "commercial_contracts" (
  "id" varchar(128) PRIMARY KEY NOT NULL,
  "commerce_action_id" varchar(128) NOT NULL,
  "creator_id" varchar(128) NOT NULL,
  "buyer_id" varchar(128) NOT NULL,
  "offering_id" varchar(128) NOT NULL,
  "result_access_token" varchar(128) NOT NULL,
  "state" varchar(32) NOT NULL,
  "current_scope_version_id" varchar(128),
  "proposed_at" timestamp with time zone,
  "proposal_expires_at" timestamp with time zone,
  "accepted_at" timestamp with time zone,
  "accepted_by" varchar(128),
  "contracted_at" timestamp with time zone,
  "order_id" varchar(128),
  "rejected_at" timestamp with time zone,
  "cancelled_at" timestamp with time zone,
  "cancelled_by" varchar(32),
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "commercial_contracts_proposal_expiry_check"
    CHECK ("proposal_expires_at" IS NULL OR "proposed_at" IS NULL OR "proposal_expires_at" > "proposed_at")
);
--> statement-breakpoint
CREATE UNIQUE INDEX "commercial_contracts_commerce_action_unique"
  ON "commercial_contracts" USING btree ("commerce_action_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "commercial_contracts_result_access_token_unique"
  ON "commercial_contracts" USING btree ("result_access_token");
--> statement-breakpoint
CREATE UNIQUE INDEX "commercial_contracts_order_unique"
  ON "commercial_contracts" USING btree ("order_id");
--> statement-breakpoint
CREATE INDEX "commercial_contracts_creator_created_at_idx"
  ON "commercial_contracts" USING btree ("creator_id", "created_at");
--> statement-breakpoint
CREATE TABLE "commercial_contract_scope_versions" (
  "id" varchar(128) PRIMARY KEY NOT NULL,
  "contract_id" varchar(128) NOT NULL,
  "version" bigint NOT NULL,
  "performance_type" varchar(512) NOT NULL,
  "performance_date" timestamp with time zone NOT NULL,
  "location" varchar(1000) NOT NULL,
  "duration_minutes" bigint NOT NULL,
  "creator_headcount" bigint NOT NULL,
  "deliverables" varchar(4000) NOT NULL,
  "price_minor" bigint NOT NULL,
  "currency" varchar(3) NOT NULL,
  "cancellation_terms" varchar(4000) NOT NULL,
  "fulfillment_criteria" varchar(4000) NOT NULL,
  "created_at" timestamp with time zone NOT NULL,
  "created_by" varchar(128) NOT NULL,
  CONSTRAINT "commercial_contract_scope_versions_duration_check" CHECK ("duration_minutes" > 0),
  CONSTRAINT "commercial_contract_scope_versions_headcount_check" CHECK ("creator_headcount" > 0),
  CONSTRAINT "commercial_contract_scope_versions_price_check" CHECK ("price_minor" > 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX "commercial_contract_scope_versions_contract_version_unique"
  ON "commercial_contract_scope_versions" USING btree ("contract_id", "version");
--> statement-breakpoint
CREATE INDEX "commercial_contract_scope_versions_contract_idx"
  ON "commercial_contract_scope_versions" USING btree ("contract_id");
--> statement-breakpoint
CREATE TABLE "commercial_contract_acceptance_facts" (
  "id" varchar(256) PRIMARY KEY NOT NULL,
  "contract_id" varchar(128) NOT NULL,
  "scope_version_id" varchar(128) NOT NULL,
  "actor_id" varchar(128) NOT NULL,
  "actor_kind" varchar(32) NOT NULL,
  "accepted_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "commercial_contract_acceptance_facts_contract_buyer_unique"
  ON "commercial_contract_acceptance_facts" USING btree ("contract_id", "actor_id", "scope_version_id");
--> statement-breakpoint
CREATE INDEX "commercial_contract_acceptance_facts_contract_idx"
  ON "commercial_contract_acceptance_facts" USING btree ("contract_id");
--> statement-breakpoint
CREATE FUNCTION "prevent_commercial_contract_scope_version_mutation"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'commercial_contract_scope_versions are append-only';
END;
$$;
--> statement-breakpoint
CREATE TRIGGER "commercial_contract_scope_version_append_only"
BEFORE UPDATE OR DELETE ON "commercial_contract_scope_versions"
FOR EACH ROW
EXECUTE FUNCTION "prevent_commercial_contract_scope_version_mutation"();
