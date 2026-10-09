CREATE TABLE "identities" (
  "identity_id" varchar(128) PRIMARY KEY NOT NULL,
  "lifecycle" varchar(32) DEFAULT 'ACTIVE' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "identities_lifecycle_check"
    CHECK ("lifecycle" IN ('ACTIVE', 'SUSPENDED', 'ARCHIVED'))
);
