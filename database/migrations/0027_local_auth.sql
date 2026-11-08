CREATE TABLE "local_auth_accounts" (
  "id" varchar(36) PRIMARY KEY,
  "email" varchar(255) NOT NULL UNIQUE,
  "password_hash" varchar(255) NOT NULL,
  "name" varchar(120),
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "local_auth_sessions" (
  "id" varchar(36) PRIMARY KEY,
  "account_id" varchar(36) NOT NULL REFERENCES "local_auth_accounts"("id") ON DELETE CASCADE,
  "refresh_hash" varchar(64) NOT NULL UNIQUE,
  "expires_at" timestamptz NOT NULL,
  "revoked_at" timestamptz
);
--> statement-breakpoint
CREATE INDEX "local_auth_sessions_account_idx" ON "local_auth_sessions" ("account_id");
--> statement-breakpoint
CREATE TABLE "local_creator_mappings" (
  "account_id" varchar(36) PRIMARY KEY REFERENCES "local_auth_accounts"("id") ON DELETE CASCADE,
  "creator_id" varchar(128) NOT NULL UNIQUE
);
