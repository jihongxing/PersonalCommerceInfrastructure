CREATE TABLE "external_platform_accounts" (
  "external_platform_account_id" varchar(128) PRIMARY KEY NOT NULL,
  "platform" varchar(64) NOT NULL,
  "platform_account_id" varchar(256) NOT NULL,
  "lifecycle" varchar(32) DEFAULT 'ACTIVE' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "external_platform_accounts_platform_platform_account_id_unique"
    UNIQUE ("platform", "platform_account_id"),
  CONSTRAINT "external_platform_accounts_lifecycle_check"
    CHECK ("lifecycle" IN ('ACTIVE', 'SUSPENDED', 'REVOKED'))
);
