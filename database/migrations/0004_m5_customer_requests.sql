CREATE TABLE IF NOT EXISTS "customers" (
  "id" varchar(128) PRIMARY KEY NOT NULL,
  "contact_name" varchar(160) NOT NULL,
  "contact_method" varchar(320) NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "customers_contact_method_idx" ON "customers" ("contact_method");

CREATE TABLE IF NOT EXISTS "commerce_actions" (
  "id" varchar(128) PRIMARY KEY NOT NULL,
  "customer_id" varchar(128) NOT NULL,
  "creator_id" varchar(128) NOT NULL,
  "offering_id" varchar(128) NOT NULL,
  "request_message" varchar(2000) NOT NULL,
  "state" varchar(32) DEFAULT 'draft' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "commerce_actions_customer_offering_state_idx"
  ON "commerce_actions" ("customer_id", "offering_id", "state");

CREATE UNIQUE INDEX IF NOT EXISTS "commerce_actions_unique_submitted_request_idx"
  ON "commerce_actions" ("customer_id", "offering_id")
  WHERE "state" = 'submitted';
