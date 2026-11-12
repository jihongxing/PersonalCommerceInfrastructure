CREATE TABLE "operations_credentials" (
	"credential_id" varchar(128) PRIMARY KEY NOT NULL,
	"account_id" varchar(128) NOT NULL,
	"kind" varchar(32) DEFAULT 'password' NOT NULL,
	"status" varchar(16) DEFAULT 'active' NOT NULL,
	"verifier" text NOT NULL,
	"version" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone,
	CONSTRAINT "operations_credentials_account_kind_version_unique" UNIQUE("account_id","kind","version"),
	CONSTRAINT "operations_credentials_kind_check" CHECK ("operations_credentials"."kind" = 'password'),
	CONSTRAINT "operations_credentials_status_check" CHECK ("operations_credentials"."status" in ('active', 'revoked')),
	CONSTRAINT "operations_credentials_verifier_check" CHECK (length(regexp_replace("operations_credentials"."verifier", '[[:space:]]', '', 'g')) > 0),
	CONSTRAINT "operations_credentials_version_check" CHECK ("operations_credentials"."version" >= 1),
	CONSTRAINT "operations_credentials_lifecycle_check" CHECK (("operations_credentials"."status" = 'active' and "operations_credentials"."revoked_at" is null)
        or ("operations_credentials"."status" = 'revoked' and "operations_credentials"."revoked_at" is not null))
);
--> statement-breakpoint
ALTER TABLE "operations_credentials" ADD CONSTRAINT "operations_credentials_account_id_operations_accounts_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."operations_accounts"("account_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "operations_credentials_active_account_unique" ON "operations_credentials" USING btree ("account_id") WHERE "operations_credentials"."kind" = 'password' and "operations_credentials"."status" = 'active';--> statement-breakpoint
CREATE INDEX "operations_credentials_account_id_idx" ON "operations_credentials" USING btree ("account_id");--> statement-breakpoint
CREATE OR REPLACE FUNCTION operations_credentials_validate_insert() RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  latest_version integer;
BEGIN
  PERFORM account_id
  FROM operations_accounts
  WHERE account_id = NEW.account_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(MAX(version), 0)
  INTO latest_version
  FROM operations_credentials
  WHERE account_id = NEW.account_id AND kind = NEW.kind;

  IF NEW.version <> latest_version + 1 THEN
    RAISE EXCEPTION 'Operations credential version must be the next account version.'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;--> statement-breakpoint
CREATE TRIGGER operations_credentials_validate_insert_trigger
BEFORE INSERT ON operations_credentials
FOR EACH ROW EXECUTE FUNCTION operations_credentials_validate_insert();--> statement-breakpoint
CREATE OR REPLACE FUNCTION operations_credentials_protect_history() RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Operations credential history cannot be deleted.';
  END IF;

  IF OLD.status = 'revoked' THEN
    RAISE EXCEPTION 'Revoked Operations credential history cannot be modified.';
  END IF;

  IF OLD.status = 'active' AND NEW.status = 'active' THEN
    IF NEW.credential_id <> OLD.credential_id
      OR NEW.account_id <> OLD.account_id
      OR NEW.kind <> OLD.kind
      OR NEW.verifier <> OLD.verifier
      OR NEW.version <> OLD.version
      OR NEW.created_at <> OLD.created_at
      OR NEW.revoked_at IS NOT NULL
      OR NEW.updated_at < OLD.updated_at THEN
      RAISE EXCEPTION 'Active Operations credential identity and history fields cannot be changed.';
    END IF;
    RETURN NEW;
  END IF;

  IF OLD.status = 'active' AND NEW.status = 'revoked' THEN
    IF NEW.credential_id <> OLD.credential_id
      OR NEW.account_id <> OLD.account_id
      OR NEW.kind <> OLD.kind
      OR NEW.verifier <> OLD.verifier
      OR NEW.version <> OLD.version
      OR NEW.created_at <> OLD.created_at
      OR NEW.revoked_at IS NULL
      OR NEW.updated_at <> NEW.revoked_at THEN
      RAISE EXCEPTION 'Operations credential history fields cannot be changed during revocation.';
    END IF;
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'Operations credential lifecycle transition is not permitted.';
END;
$$;--> statement-breakpoint
CREATE TRIGGER operations_credentials_protect_history_trigger
BEFORE UPDATE OR DELETE ON operations_credentials
FOR EACH ROW EXECUTE FUNCTION operations_credentials_protect_history();--> statement-breakpoint
CREATE OR REPLACE FUNCTION operations_credentials_reject_truncate() RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'Operations credential history cannot be truncated.';
END;
$$;--> statement-breakpoint
CREATE TRIGGER operations_credentials_reject_truncate_trigger
BEFORE TRUNCATE ON operations_credentials
FOR EACH STATEMENT EXECUTE FUNCTION operations_credentials_reject_truncate();
