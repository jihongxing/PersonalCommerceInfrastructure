CREATE TABLE "account_identity_memberships" (
  "membership_id" varchar(128) PRIMARY KEY NOT NULL,
  "account_id" varchar(256) NOT NULL,
  "identity_id" varchar(128) NOT NULL,
  "authority" varchar(32) DEFAULT 'OWNER' NOT NULL,
  "state" varchar(32) DEFAULT 'ACTIVE' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "revoked_at" timestamp with time zone,
  CONSTRAINT "account_identity_memberships_identity_id_identities_identity_id_fk"
    FOREIGN KEY ("identity_id") REFERENCES "public"."identities"("identity_id")
    ON DELETE RESTRICT ON UPDATE NO ACTION,
  CONSTRAINT "account_identity_memberships_authority_check"
    CHECK ("authority" = 'OWNER'),
  CONSTRAINT "account_identity_memberships_state_check"
    CHECK ("state" IN ('ACTIVE', 'SUSPENDED', 'REVOKED', 'HISTORICAL')),
  CONSTRAINT "account_identity_memberships_revocation_check"
    CHECK (
      ("state" IN ('REVOKED', 'HISTORICAL') AND "revoked_at" IS NOT NULL)
      OR ("state" NOT IN ('REVOKED', 'HISTORICAL') AND "revoked_at" IS NULL)
    )
);
--> statement-breakpoint
CREATE UNIQUE INDEX "account_identity_memberships_active_owner_account_unique"
  ON "account_identity_memberships" USING btree ("account_id")
  WHERE "state" = 'ACTIVE';
