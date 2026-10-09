CREATE TABLE "commerce_profiles" (
  "commerce_profile_id" varchar(128) PRIMARY KEY NOT NULL,
  "owning_identity_id" varchar(128) NOT NULL,
  "lifecycle" varchar(32) DEFAULT 'ACTIVE' NOT NULL,
  "display_name" varchar(256) NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "commerce_profiles_owning_identity_id_identities_identity_id_fk"
    FOREIGN KEY ("owning_identity_id") REFERENCES "public"."identities"("identity_id")
    ON DELETE RESTRICT ON UPDATE NO ACTION,
  CONSTRAINT "commerce_profiles_lifecycle_check"
    CHECK ("lifecycle" IN ('ACTIVE', 'SUSPENDED', 'ARCHIVED'))
);
