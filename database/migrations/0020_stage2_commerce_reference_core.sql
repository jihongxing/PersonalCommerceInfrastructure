CREATE TABLE "commerce_references" (
  "commerce_reference" varchar(18) PRIMARY KEY NOT NULL,
  "commerce_profile_id" varchar(128) NOT NULL,
  "lifecycle" varchar(32) DEFAULT 'ASSIGNED' NOT NULL,
  "assigned_at" timestamp with time zone NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "commerce_references_commerce_profile_id_unique"
    UNIQUE ("commerce_profile_id"),
  CONSTRAINT "commerce_references_commerce_profile_id_commerce_profiles_commerce_profile_id_fk"
    FOREIGN KEY ("commerce_profile_id") REFERENCES "public"."commerce_profiles"("commerce_profile_id")
    ON DELETE RESTRICT ON UPDATE NO ACTION,
  CONSTRAINT "commerce_references_lifecycle_check"
    CHECK ("lifecycle" IN ('ASSIGNED', 'PERMANENTLY_RESERVED'))
);
