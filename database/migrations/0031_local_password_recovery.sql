CREATE TABLE "local_auth_password_resets" (
  "account_id" varchar(36) PRIMARY KEY REFERENCES "local_auth_accounts"("id") ON DELETE CASCADE,
  "token_hash" varchar(64) NOT NULL UNIQUE,
  "expires_at" timestamp with time zone NOT NULL
);
