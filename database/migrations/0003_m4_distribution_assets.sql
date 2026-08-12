CREATE TABLE IF NOT EXISTS "distribution_assets" (
  "offering_id" varchar(128) PRIMARY KEY NOT NULL,
  "public_url" varchar(2048) NOT NULL,
  "state" varchar(32) DEFAULT 'generated' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
