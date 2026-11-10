CREATE TABLE "local_auth_password_recovery_requests" (
  "id" varchar(36) PRIMARY KEY,
  "email" varchar(255) NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "expires_at" timestamp with time zone NOT NULL,
  "available_at" timestamp with time zone NOT NULL DEFAULT now(),
  "lease_id" varchar(36),
  "lease_until" timestamp with time zone,
  "attempts" integer NOT NULL DEFAULT 0,
  "issued" boolean NOT NULL DEFAULT false
);
CREATE INDEX "local_auth_password_recovery_available_idx"
  ON "local_auth_password_recovery_requests" (available_at, created_at);
