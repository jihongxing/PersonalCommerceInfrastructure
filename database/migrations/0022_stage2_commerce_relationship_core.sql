CREATE TABLE "commerce_relationships" (
  "commerce_relationship_id" varchar(128) PRIMARY KEY NOT NULL,
  "external_platform_account_id" varchar(128) NOT NULL,
  "commerce_profile_id" varchar(128) NOT NULL,
  "role" varchar(32) NOT NULL,
  "lifecycle" varchar(32) DEFAULT 'PROPOSED' NOT NULL,
  "effective_at" timestamp with time zone NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "commerce_relationships_external_platform_account_id_external_platform_accounts_external_platform_account_id_fk"
    FOREIGN KEY ("external_platform_account_id")
    REFERENCES "public"."external_platform_accounts"("external_platform_account_id")
    ON DELETE RESTRICT ON UPDATE NO ACTION,
  CONSTRAINT "commerce_relationships_commerce_profile_id_commerce_profiles_commerce_profile_id_fk"
    FOREIGN KEY ("commerce_profile_id")
    REFERENCES "public"."commerce_profiles"("commerce_profile_id")
    ON DELETE RESTRICT ON UPDATE NO ACTION,
  CONSTRAINT "commerce_relationships_role_check"
    CHECK ("role" IN ('OWNER', 'MANAGER', 'DELEGATED_MANAGER')),
  CONSTRAINT "commerce_relationships_lifecycle_check"
    CHECK ("lifecycle" IN ('PROPOSED', 'VERIFIED', 'ACTIVE', 'SUSPENDED', 'REVOKED', 'HISTORICAL'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX "commerce_relationships_one_active_account_unique"
  ON "commerce_relationships" ("external_platform_account_id")
  WHERE "lifecycle" = 'ACTIVE';
