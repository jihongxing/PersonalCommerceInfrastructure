CREATE TABLE "legacy_subject_mappings" (
  "mapping_id" varchar(128) PRIMARY KEY NOT NULL,
  "legacy_subject_reference" varchar(128) NOT NULL,
  "identity_id" varchar(128) NOT NULL,
  "initial_commerce_profile_id" varchar(128) NOT NULL,
  "state" varchar(32) DEFAULT 'ACTIVE' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "verified_at" timestamp with time zone,
  "mapping_failure_code" varchar(64),
  CONSTRAINT "legacy_subject_mappings_identity_id_identities_identity_id_fk"
    FOREIGN KEY ("identity_id") REFERENCES "public"."identities"("identity_id")
    ON DELETE RESTRICT ON UPDATE NO ACTION,
  CONSTRAINT "legacy_subject_mappings_initial_commerce_profile_id_commerce_profiles_commerce_profile_id_fk"
    FOREIGN KEY ("initial_commerce_profile_id") REFERENCES "public"."commerce_profiles"("commerce_profile_id")
    ON DELETE RESTRICT ON UPDATE NO ACTION,
  CONSTRAINT "legacy_subject_mappings_state_check"
    CHECK ("state" IN ('ACTIVE', 'VERIFIED', 'AMBIGUOUS', 'FAILED', 'RETIRED')),
  CONSTRAINT "legacy_subject_mappings_failure_code_check"
    CHECK (
      ("state" IN ('AMBIGUOUS', 'FAILED') AND "mapping_failure_code" IS NOT NULL)
      OR ("state" NOT IN ('AMBIGUOUS', 'FAILED') AND "mapping_failure_code" IS NULL)
    ),
  CONSTRAINT "legacy_subject_mappings_verified_at_check"
    CHECK (
      ("state" = 'VERIFIED' AND "verified_at" IS NOT NULL)
      OR ("state" <> 'VERIFIED' AND "verified_at" IS NULL)
    )
);
CREATE UNIQUE INDEX "legacy_subject_mappings_legacy_subject_reference_unique"
  ON "legacy_subject_mappings" USING btree ("legacy_subject_reference");
CREATE UNIQUE INDEX "legacy_subject_mappings_initial_commerce_profile_unique"
  ON "legacy_subject_mappings" USING btree ("initial_commerce_profile_id");
CREATE UNIQUE INDEX "legacy_subject_mappings_identity_profile_unique"
  ON "legacy_subject_mappings" USING btree ("identity_id", "initial_commerce_profile_id");
