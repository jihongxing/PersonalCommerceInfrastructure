CREATE TABLE "paid_service_orders" (
  "id" varchar(128) PRIMARY KEY NOT NULL,
  "commerce_action_id" varchar(128) NOT NULL,
  "creator_id" varchar(128) NOT NULL,
  "customer_id" varchar(128) NOT NULL,
  "offering_id" varchar(128) NOT NULL,
  "offering_title" varchar(160) NOT NULL,
  "offering_description" varchar(2000) NOT NULL,
  "service_terms" varchar(2000) NOT NULL,
  "currency" varchar(3) NOT NULL,
  "gross_price_minor" bigint NOT NULL,
  "state" varchar(32) NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "paid_service_orders_commerce_action_unique" ON "paid_service_orders" USING btree ("commerce_action_id");
--> statement-breakpoint
CREATE INDEX "paid_service_orders_creator_created_at_idx" ON "paid_service_orders" USING btree ("creator_id","created_at");
--> statement-breakpoint
CREATE INDEX "paid_service_orders_customer_created_at_idx" ON "paid_service_orders" USING btree ("customer_id","created_at");
--> statement-breakpoint
CREATE TABLE "paid_commerce_payments" (
  "id" varchar(128) PRIMARY KEY NOT NULL,
  "order_id" varchar(128) NOT NULL,
  "currency" varchar(3) NOT NULL,
  "amount_minor" bigint NOT NULL,
  "state" varchar(32) NOT NULL,
  "correlation_id" varchar(128) NOT NULL,
  "provider_reference" varchar(512),
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "paid_commerce_payments_order_unique" ON "paid_commerce_payments" USING btree ("order_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "paid_commerce_payments_correlation_unique" ON "paid_commerce_payments" USING btree ("correlation_id");
--> statement-breakpoint
CREATE TABLE "paid_commerce_fulfillments" (
  "id" varchar(128) PRIMARY KEY NOT NULL,
  "order_id" varchar(128) NOT NULL,
  "creator_id" varchar(128) NOT NULL,
  "state" varchar(32) NOT NULL,
  "evidence_reference" varchar(512) NOT NULL,
  "fulfilled_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "paid_commerce_fulfillments_order_unique" ON "paid_commerce_fulfillments" USING btree ("order_id");
--> statement-breakpoint
CREATE TABLE "paid_commerce_settlements" (
  "id" varchar(128) PRIMARY KEY NOT NULL,
  "order_id" varchar(128) NOT NULL,
  "payment_id" varchar(128) NOT NULL,
  "fulfillment_id" varchar(128) NOT NULL,
  "creator_id" varchar(128) NOT NULL,
  "currency" varchar(3) NOT NULL,
  "gross_minor" bigint NOT NULL,
  "provider_fee_minor" bigint NOT NULL,
  "platform_fee_minor" bigint NOT NULL,
  "deductions_minor" bigint NOT NULL,
  "creator_net_minor" bigint NOT NULL,
  "state" varchar(32) NOT NULL,
  "calculation_version" varchar(128) NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "paid_commerce_settlements_order_unique" ON "paid_commerce_settlements" USING btree ("order_id");
--> statement-breakpoint
CREATE TABLE "creator_earnings_ledger_entries" (
  "id" varchar(128) PRIMARY KEY NOT NULL,
  "creator_id" varchar(128) NOT NULL,
  "currency" varchar(3) NOT NULL,
  "amount_minor" bigint NOT NULL,
  "type" varchar(64) NOT NULL,
  "effective_at" timestamp with time zone NOT NULL,
  "order_id" varchar(128) NOT NULL,
  "payment_id" varchar(128),
  "settlement_id" varchar(128),
  "withdrawal_id" varchar(128),
  "correlation_id" varchar(128) NOT NULL,
  "audit_context" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "recorded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "creator_earnings_ledger_creator_effective_at_idx" ON "creator_earnings_ledger_entries" USING btree ("creator_id","effective_at");
--> statement-breakpoint
CREATE UNIQUE INDEX "creator_earnings_ledger_correlation_type_unique" ON "creator_earnings_ledger_entries" USING btree ("correlation_id","type");
--> statement-breakpoint
CREATE TABLE "paid_commerce_withdrawals" (
  "id" varchar(128) PRIMARY KEY NOT NULL,
  "creator_id" varchar(128) NOT NULL,
  "currency" varchar(3) NOT NULL,
  "amount_minor" bigint NOT NULL,
  "destination_reference" varchar(512) NOT NULL,
  "idempotency_key" varchar(256) NOT NULL,
  "state" varchar(32) NOT NULL,
  "correlation_id" varchar(128) NOT NULL,
  "provider_reference" varchar(512),
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "paid_commerce_withdrawals_creator_idempotency_unique" ON "paid_commerce_withdrawals" USING btree ("creator_id","idempotency_key");
