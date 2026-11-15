-- PCI-ENG-020-B1: Creator Web BFF sessions are revocable and shared across
-- application instances. API credentials are encrypted before persistence.
CREATE TABLE "creator_web_sessions" (
  "id_hash" varchar(128) PRIMARY KEY NOT NULL,
  "account_id" varchar(128) NOT NULL,
  "user_email" varchar(320) NOT NULL,
  "access_token_ciphertext" text NOT NULL,
  "refresh_token_ciphertext" text NOT NULL,
  "refresh_token_hash" varchar(128) NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "revoked_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "creator_web_sessions_account_id_idx" ON "creator_web_sessions" USING btree ("account_id");
--> statement-breakpoint
CREATE INDEX "creator_web_sessions_expires_at_idx" ON "creator_web_sessions" USING btree ("expires_at");
