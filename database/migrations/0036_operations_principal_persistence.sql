CREATE TABLE "operations_human_principals" (
  "principal_id" varchar(128) PRIMARY KEY NOT NULL,
  "status" varchar(32) DEFAULT 'pending' NOT NULL,
  "security_epoch" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "operations_human_principals_status_check" CHECK ("operations_human_principals"."status" IN ('pending', 'active', 'suspended', 'disabled', 'tombstoned')),
  CONSTRAINT "operations_human_principals_security_epoch_check" CHECK ("operations_human_principals"."security_epoch" >= 0)
);
--> statement-breakpoint
CREATE TABLE "operations_accounts" (
  "account_id" varchar(128) PRIMARY KEY NOT NULL,
  "principal_id" varchar(128) NOT NULL,
  "login_identifier_normalized" varchar(320) NOT NULL,
  "status" varchar(32) DEFAULT 'invited' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "operations_accounts_principal_id_unique" UNIQUE("principal_id"),
  CONSTRAINT "operations_accounts_login_identifier_normalized_unique" UNIQUE("login_identifier_normalized"),
  CONSTRAINT "operations_accounts_status_check" CHECK ("operations_accounts"."status" IN ('invited', 'active', 'locked', 'disabled', 'revoked'))
);
--> statement-breakpoint
CREATE TABLE "service_principals" (
  "service_principal_id" varchar(128) PRIMARY KEY NOT NULL,
  "kind" varchar(32) NOT NULL,
  "provider_id" varchar(128),
  "system_id" varchar(128),
  "status" varchar(32) DEFAULT 'active' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "service_principals_provider_id_unique" UNIQUE("provider_id"),
  CONSTRAINT "service_principals_system_id_unique" UNIQUE("system_id"),
  CONSTRAINT "service_principals_status_check" CHECK ("service_principals"."status" IN ('active', 'suspended', 'disabled', 'revoked')),
  CONSTRAINT "service_principals_kind_discriminator_check" CHECK ((
    ("service_principals"."kind" = 'provider_service' AND "service_principals"."provider_id" IS NOT NULL AND "service_principals"."system_id" IS NULL)
    OR
    ("service_principals"."kind" = 'platform_system' AND "service_principals"."provider_id" IS NULL AND "service_principals"."system_id" IS NOT NULL)
  ))
);
--> statement-breakpoint
ALTER TABLE "operations_accounts" ADD CONSTRAINT "operations_accounts_principal_id_operations_human_principals_principal_id_fk" FOREIGN KEY ("principal_id") REFERENCES "public"."operations_human_principals"("principal_id") ON DELETE restrict ON UPDATE no action;