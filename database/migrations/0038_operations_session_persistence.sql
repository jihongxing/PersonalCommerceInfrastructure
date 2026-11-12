ALTER TABLE "operations_accounts" ADD CONSTRAINT "operations_accounts_account_principal_unique" UNIQUE("account_id","principal_id");
--> statement-breakpoint
CREATE TABLE "operations_sessions" (
	"session_id" varchar(128) PRIMARY KEY NOT NULL,
	"principal_id" varchar(128) NOT NULL,
	"account_id" varchar(128) NOT NULL,
	"credential_digest" "bytea" NOT NULL,
	"status" varchar(16) DEFAULT 'active' NOT NULL,
	"credential_version" integer NOT NULL,
	"principal_security_epoch" integer NOT NULL,
	"session_version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"last_activity_at" timestamp with time zone NOT NULL,
	"idle_expires_at" timestamp with time zone NOT NULL,
	"absolute_expires_at" timestamp with time zone NOT NULL,
	"mfa_verified_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	CONSTRAINT "operations_sessions_credential_digest_unique" UNIQUE("credential_digest"),
	CONSTRAINT "operations_sessions_digest_length_check" CHECK (octet_length("operations_sessions"."credential_digest") = 32),
	CONSTRAINT "operations_sessions_status_check" CHECK ("operations_sessions"."status" in ('active', 'revoked')),
	CONSTRAINT "operations_sessions_credential_version_check" CHECK ("operations_sessions"."credential_version" >= 1),
	CONSTRAINT "operations_sessions_security_epoch_check" CHECK ("operations_sessions"."principal_security_epoch" >= 0),
	CONSTRAINT "operations_sessions_session_version_check" CHECK ("operations_sessions"."session_version" >= 1),
	CONSTRAINT "operations_sessions_lifecycle_check" CHECK (("operations_sessions"."status" = 'active' and "operations_sessions"."revoked_at" is null) or ("operations_sessions"."status" = 'revoked' and "operations_sessions"."revoked_at" is not null)),
	CONSTRAINT "operations_sessions_time_order_check" CHECK ("operations_sessions"."created_at" <= "operations_sessions"."last_activity_at" and "operations_sessions"."last_activity_at" <= "operations_sessions"."idle_expires_at" and "operations_sessions"."idle_expires_at" <= "operations_sessions"."absolute_expires_at" and "operations_sessions"."absolute_expires_at" > "operations_sessions"."created_at")
);
--> statement-breakpoint
ALTER TABLE "operations_sessions" ADD CONSTRAINT "operations_sessions_principal_id_operations_human_principals_principal_id_fk" FOREIGN KEY ("principal_id") REFERENCES "public"."operations_human_principals"("principal_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operations_sessions" ADD CONSTRAINT "operations_sessions_account_principal_fk" FOREIGN KEY ("account_id","principal_id") REFERENCES "public"."operations_accounts"("account_id","principal_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "operations_sessions_account_id_idx" ON "operations_sessions" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "operations_sessions_principal_id_idx" ON "operations_sessions" USING btree ("principal_id");
--> statement-breakpoint
-- INSERT has no pre-existing Session tuple lock. Acquire parent locks in the same
-- Principal -> Account -> Credential order as the repository before inserting.
CREATE FUNCTION operations_sessions_validate_insert() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  principal_status text;
  current_epoch integer;
  account_status text;
  account_principal varchar(128);
  current_version integer;
BEGIN
  SELECT status, security_epoch INTO principal_status, current_epoch
  FROM operations_human_principals WHERE principal_id = NEW.principal_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Operations Session owner does not exist.' USING ERRCODE = '23503';
  END IF;

  SELECT status, principal_id INTO account_status, account_principal
  FROM operations_accounts WHERE account_id = NEW.account_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Operations Session account does not exist.' USING ERRCODE = '23503';
  END IF;
  IF account_principal IS DISTINCT FROM NEW.principal_id THEN
    -- Let the composite FK reject the association, including ordinary SQL writes.
    RETURN NEW;
  END IF;

  SELECT version INTO current_version FROM operations_credentials
  WHERE account_id = NEW.account_id AND kind = 'password' AND status = 'active'
  FOR UPDATE;
  IF NOT FOUND OR principal_status <> 'active' OR account_status <> 'active'
    OR current_version IS DISTINCT FROM NEW.credential_version
    OR current_epoch IS DISTINCT FROM NEW.principal_security_epoch
    OR NEW.status IS DISTINCT FROM 'active' OR NEW.revoked_at IS NOT NULL
    OR NEW.session_version IS DISTINCT FROM 1
    OR NEW.idle_expires_at <= clock_timestamp()
    OR NEW.absolute_expires_at <= clock_timestamp() THEN
    RAISE EXCEPTION 'Operations Session initial state or security snapshot is invalid.'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER operations_sessions_validate_insert_trigger
BEFORE INSERT ON operations_sessions FOR EACH ROW
EXECUTE FUNCTION operations_sessions_validate_insert();
--> statement-breakpoint
-- PostgreSQL already owns the Session tuple lock when a row UPDATE trigger runs.
-- This trigger never locks a parent row, so it cannot invert the repository order.
-- Live ownership/snapshot checks for reads and updates are performed by the adapter
-- while holding Principal -> Account -> Credential -> Session locks.
CREATE FUNCTION operations_sessions_validate_update() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status = 'revoked' THEN
    RAISE EXCEPTION 'Revoked Operations Session history cannot be modified.';
  END IF;
  IF NEW.session_id IS DISTINCT FROM OLD.session_id
    OR NEW.principal_id IS DISTINCT FROM OLD.principal_id
    OR NEW.account_id IS DISTINCT FROM OLD.account_id
    OR NEW.credential_version IS DISTINCT FROM OLD.credential_version
    OR NEW.principal_security_epoch IS DISTINCT FROM OLD.principal_security_epoch
    OR NEW.created_at IS DISTINCT FROM OLD.created_at
    OR NEW.absolute_expires_at IS DISTINCT FROM OLD.absolute_expires_at
    OR NEW.mfa_verified_at IS DISTINCT FROM OLD.mfa_verified_at THEN
    RAISE EXCEPTION 'Operations Session identity and security snapshots are immutable.';
  END IF;
  IF NEW.status = 'revoked' THEN
    IF NEW.revoked_at IS NULL OR NEW.revoked_at < OLD.created_at
      OR NEW.credential_digest IS DISTINCT FROM OLD.credential_digest
      OR NEW.session_version IS DISTINCT FROM OLD.session_version
      OR NEW.last_activity_at IS DISTINCT FROM OLD.last_activity_at
      OR NEW.idle_expires_at IS DISTINCT FROM OLD.idle_expires_at THEN
      RAISE EXCEPTION 'Operations Session revocation cannot rewrite history.';
    END IF;
    RETURN NEW;
  END IF;
  IF OLD.idle_expires_at <= clock_timestamp() OR OLD.absolute_expires_at <= clock_timestamp() THEN
    RAISE EXCEPTION 'Expired Operations Sessions cannot be touched or rotated.';
  END IF;
  IF NEW.status IS DISTINCT FROM 'active' OR NEW.revoked_at IS NOT NULL
    OR NEW.last_activity_at < OLD.last_activity_at
    OR NEW.idle_expires_at < OLD.idle_expires_at THEN
    RAISE EXCEPTION 'Operations Session update is invalid.';
  END IF;
  IF NEW.credential_digest IS NOT DISTINCT FROM OLD.credential_digest THEN
    IF NEW.session_version IS DISTINCT FROM OLD.session_version THEN
      RAISE EXCEPTION 'Operations Session Touch cannot change CAS Version.';
    END IF;
  ELSIF NEW.session_version::bigint IS DISTINCT FROM OLD.session_version::bigint + 1 THEN
    RAISE EXCEPTION 'Operations Session Rotation must advance CAS Version by one.';
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER operations_sessions_validate_update_trigger
BEFORE UPDATE ON operations_sessions FOR EACH ROW
EXECUTE FUNCTION operations_sessions_validate_update();
--> statement-breakpoint
CREATE FUNCTION operations_sessions_reject_delete() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Operations Session history cannot be deleted.';
END;
$$;
--> statement-breakpoint
CREATE TRIGGER operations_sessions_reject_delete_trigger
BEFORE DELETE ON operations_sessions FOR EACH ROW
EXECUTE FUNCTION operations_sessions_reject_delete();
--> statement-breakpoint
CREATE FUNCTION operations_sessions_reject_truncate() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Operations Session history cannot be truncated.';
END;
$$;
--> statement-breakpoint
CREATE TRIGGER operations_sessions_reject_truncate_trigger
BEFORE TRUNCATE ON operations_sessions FOR EACH STATEMENT
EXECUTE FUNCTION operations_sessions_reject_truncate();
--> statement-breakpoint
CREATE FUNCTION operations_principal_guard_security_epoch() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.security_epoch IS DISTINCT FROM OLD.security_epoch
    AND NEW.security_epoch::bigint IS DISTINCT FROM OLD.security_epoch::bigint + 1 THEN
    RAISE EXCEPTION 'Operations Principal Security Epoch must increase by one.'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER operations_principal_guard_security_epoch_trigger
BEFORE UPDATE ON operations_human_principals FOR EACH ROW
EXECUTE FUNCTION operations_principal_guard_security_epoch();
