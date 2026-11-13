-- PCI-ENG-017-C2-1: activation history and lifecycle technical audit foundation.
-- Existing identity rows are classified as unknown; no identity row is updated.
CREATE TABLE public.operations_identity_lifecycle_audits (
  audit_id varchar(128) PRIMARY KEY NOT NULL,
  operation_id varchar(128) NOT NULL,
  correlation_id varchar(128) NOT NULL,
  principal_id varchar(128),
  account_id varchar(128),
  subject_type varchar(32) NOT NULL,
  subject_id varchar(128) NOT NULL,
  operation_type varchar(64) NOT NULL,
  before_status varchar(32),
  after_status varchar(32) NOT NULL,
  before_activation_history varchar(32),
  after_activation_history varchar(32) NOT NULL,
  before_principal_epoch integer,
  after_principal_epoch integer,
  credential_id varchar(128),
  credential_version integer,
  session_version integer,
  revoked_credential_count integer DEFAULT 0 NOT NULL,
  revoked_session_count integer DEFAULT 0 NOT NULL,
  result varchar(16) NOT NULL,
  reason_code varchar(128) NOT NULL,
  event_occurred_at timestamptz NOT NULL,
  recorded_at timestamptz DEFAULT now() NOT NULL,
  evidence_ref varchar(256),
  decision_ref varchar(256),
  CONSTRAINT operations_identity_lifecycle_audits_operation_subject_unique UNIQUE (operation_id, subject_type, subject_id),
  CONSTRAINT operations_identity_lifecycle_audits_subject_type_check CHECK (subject_type IN ('human_principal', 'operations_account')),
  CONSTRAINT operations_identity_lifecycle_audits_operation_type_check CHECK (operation_type IN ('principal_created', 'account_created', 'legacy_history_initialized')),
  CONSTRAINT operations_identity_lifecycle_audits_history_check CHECK (after_activation_history IN ('never_activated', 'previously_activated', 'unknown') AND (before_activation_history IS NULL OR before_activation_history IN ('never_activated', 'previously_activated', 'unknown'))),
  CONSTRAINT operations_identity_lifecycle_audits_result_check CHECK (result = 'success'),
  CONSTRAINT operations_identity_lifecycle_audits_epoch_check CHECK ((before_principal_epoch IS NULL OR before_principal_epoch >= 0) AND (after_principal_epoch IS NULL OR after_principal_epoch >= 0)),
  CONSTRAINT operations_identity_lifecycle_audits_count_check CHECK (revoked_credential_count >= 0 AND revoked_session_count >= 0),
  CONSTRAINT operations_identity_lifecycle_audits_reason_check CHECK (length(btrim(reason_code)) BETWEEN 1 AND 128)
);
--> statement-breakpoint
ALTER TABLE public.operations_identity_lifecycle_audits ADD CONSTRAINT operations_identity_lifecycle_audits_principal_fk FOREIGN KEY (principal_id) REFERENCES public.operations_human_principals(principal_id) ON DELETE RESTRICT;
ALTER TABLE public.operations_identity_lifecycle_audits ADD CONSTRAINT operations_identity_lifecycle_audits_account_fk FOREIGN KEY (account_id) REFERENCES public.operations_accounts(account_id) ON DELETE RESTRICT;
CREATE INDEX operations_identity_lifecycle_audits_principal_idx ON public.operations_identity_lifecycle_audits (principal_id, event_occurred_at);
CREATE INDEX operations_identity_lifecycle_audits_account_idx ON public.operations_identity_lifecycle_audits (account_id, event_occurred_at);
--> statement-breakpoint
CREATE TABLE public.operations_human_principal_activation_histories (
  principal_id varchar(128) PRIMARY KEY NOT NULL,
  activation_history varchar(32) NOT NULL,
  origin varchar(32) NOT NULL,
  recorded_at timestamptz DEFAULT now() NOT NULL,
  changed_at timestamptz DEFAULT now() NOT NULL,
  last_history_audit_id varchar(128) NOT NULL,
  CONSTRAINT operations_human_principal_activation_histories_history_check CHECK (activation_history IN ('never_activated', 'previously_activated', 'unknown')),
  CONSTRAINT operations_human_principal_activation_histories_origin_check CHECK (origin IN ('new_subject', 'legacy_backfill'))
);
--> statement-breakpoint
ALTER TABLE public.operations_human_principal_activation_histories ADD CONSTRAINT operations_human_principal_activation_histories_principal_fk FOREIGN KEY (principal_id) REFERENCES public.operations_human_principals(principal_id) ON DELETE RESTRICT;
ALTER TABLE public.operations_human_principal_activation_histories ADD CONSTRAINT operations_human_principal_activation_histories_audit_fk FOREIGN KEY (last_history_audit_id) REFERENCES public.operations_identity_lifecycle_audits(audit_id) ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED;
--> statement-breakpoint
CREATE TABLE public.operations_account_activation_histories (
  account_id varchar(128) PRIMARY KEY NOT NULL,
  activation_history varchar(32) NOT NULL,
  origin varchar(32) NOT NULL,
  recorded_at timestamptz DEFAULT now() NOT NULL,
  changed_at timestamptz DEFAULT now() NOT NULL,
  last_history_audit_id varchar(128) NOT NULL,
  CONSTRAINT operations_account_activation_histories_history_check CHECK (activation_history IN ('never_activated', 'previously_activated', 'unknown')),
  CONSTRAINT operations_account_activation_histories_origin_check CHECK (origin IN ('new_subject', 'legacy_backfill'))
);
--> statement-breakpoint
ALTER TABLE public.operations_account_activation_histories ADD CONSTRAINT operations_account_activation_histories_account_fk FOREIGN KEY (account_id) REFERENCES public.operations_accounts(account_id) ON DELETE RESTRICT;
ALTER TABLE public.operations_account_activation_histories ADD CONSTRAINT operations_account_activation_histories_audit_fk FOREIGN KEY (last_history_audit_id) REFERENCES public.operations_identity_lifecycle_audits(audit_id) ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION operations_private.validate_identity_lifecycle_audit() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, pg_temp AS $$
DECLARE p_status text; p_epoch integer; a_status text; a_principal varchar(128);
BEGIN
  IF TG_OP <> 'INSERT' THEN RAISE EXCEPTION 'Lifecycle audit is append-only' USING ERRCODE = '23514'; END IF;
  NEW.recorded_at := clock_timestamp();
  IF NEW.event_occurred_at > clock_timestamp() THEN RAISE EXCEPTION 'Audit event cannot be in the future' USING ERRCODE = '23514'; END IF;
  IF NEW.subject_type = 'human_principal' THEN
    IF NEW.operation_type NOT IN ('principal_created','legacy_history_initialized') OR NEW.principal_id IS DISTINCT FROM NEW.subject_id OR NEW.account_id IS NOT NULL THEN RAISE EXCEPTION 'Invalid principal audit association' USING ERRCODE = '23514'; END IF;
    SELECT status, security_epoch INTO p_status, p_epoch FROM public.operations_human_principals WHERE principal_id = NEW.principal_id;
    IF NOT FOUND OR p_status IS DISTINCT FROM NEW.after_status OR p_epoch IS DISTINCT FROM NEW.after_principal_epoch THEN RAISE EXCEPTION 'Principal audit does not describe persisted subject' USING ERRCODE = '23514'; END IF;
  ELSIF NEW.subject_type = 'operations_account' THEN
    IF NEW.operation_type NOT IN ('account_created','legacy_history_initialized') OR NEW.account_id IS DISTINCT FROM NEW.subject_id OR NEW.principal_id IS NULL THEN RAISE EXCEPTION 'Invalid account audit association' USING ERRCODE = '23514'; END IF;
    SELECT status, principal_id INTO a_status, a_principal FROM public.operations_accounts WHERE account_id = NEW.account_id;
    IF NOT FOUND OR a_status IS DISTINCT FROM NEW.after_status OR a_principal IS DISTINCT FROM NEW.principal_id THEN RAISE EXCEPTION 'Account audit does not describe persisted subject' USING ERRCODE = '23514'; END IF;
    SELECT security_epoch INTO p_epoch FROM public.operations_human_principals WHERE principal_id = a_principal;
    IF NEW.after_principal_epoch IS DISTINCT FROM p_epoch THEN RAISE EXCEPTION 'Account audit Principal Epoch is inconsistent' USING ERRCODE = '23514'; END IF;
  ELSE RAISE EXCEPTION 'Invalid lifecycle audit subject type' USING ERRCODE = '23514'; END IF;
  RETURN NEW;
END;
$$;
GRANT EXECUTE ON FUNCTION operations_private.validate_identity_lifecycle_audit() TO pci_ops_table_owner, pci_ops_function_owner;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION operations_private.reject_lifecycle_audit_truncate() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, pg_temp AS $$
BEGIN RAISE EXCEPTION 'Lifecycle audit cannot be truncated' USING ERRCODE = '23514'; END;
$$;
GRANT EXECUTE ON FUNCTION operations_private.reject_lifecycle_audit_truncate() TO pci_ops_table_owner;
--> statement-breakpoint
CREATE TRIGGER operations_identity_lifecycle_audit_validate_trigger BEFORE INSERT OR UPDATE OR DELETE ON public.operations_identity_lifecycle_audits FOR EACH ROW EXECUTE FUNCTION operations_private.validate_identity_lifecycle_audit();
CREATE TRIGGER operations_identity_lifecycle_audits_reject_truncate_trigger BEFORE TRUNCATE ON public.operations_identity_lifecycle_audits FOR EACH STATEMENT EXECUTE FUNCTION operations_private.reject_lifecycle_audit_truncate();
--> statement-breakpoint
CREATE OR REPLACE FUNCTION operations_private.reject_activation_history_truncate() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, pg_temp AS $$
BEGIN RAISE EXCEPTION 'Activation history cannot be truncated' USING ERRCODE = '23514'; END;
$$;
GRANT EXECUTE ON FUNCTION operations_private.reject_activation_history_truncate() TO pci_ops_table_owner;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION operations_private.validate_principal_activation_history() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, pg_temp AS $$
DECLARE t text; s text; h text;
BEGIN
  IF TG_OP = 'DELETE' THEN RAISE EXCEPTION 'Activation history cannot be deleted' USING ERRCODE = '23514'; END IF;
  IF TG_OP = 'INSERT' THEN NEW.recorded_at := clock_timestamp(); NEW.changed_at := NEW.recorded_at;
  ELSE
    IF NEW.principal_id IS DISTINCT FROM OLD.principal_id THEN RAISE EXCEPTION 'Principal history subject is immutable' USING ERRCODE = '23514'; END IF;
    IF NEW.recorded_at IS DISTINCT FROM OLD.recorded_at OR NEW.origin IS DISTINCT FROM OLD.origin THEN RAISE EXCEPTION 'History origin and recorded_at are immutable' USING ERRCODE = '23514'; END IF;
    IF NEW.activation_history IS DISTINCT FROM OLD.activation_history AND (OLD.activation_history <> 'never_activated' OR NEW.activation_history <> 'previously_activated') THEN RAISE EXCEPTION 'History transition is not permitted' USING ERRCODE = '23514'; END IF;
    NEW.changed_at := clock_timestamp();
  END IF;
  SELECT subject_type, subject_id, after_activation_history INTO t, s, h FROM public.operations_identity_lifecycle_audits WHERE audit_id = NEW.last_history_audit_id;
  IF NOT FOUND OR t <> 'human_principal' OR s IS DISTINCT FROM NEW.principal_id OR h IS DISTINCT FROM NEW.activation_history THEN RAISE EXCEPTION 'Principal history audit association is invalid' USING ERRCODE = '23514'; END IF;
  RETURN NEW;
END;
$$;
GRANT EXECUTE ON FUNCTION operations_private.validate_principal_activation_history() TO pci_ops_table_owner, pci_ops_function_owner;
--> statement-breakpoint
CREATE TRIGGER operations_human_principal_activation_history_validate_trigger BEFORE INSERT OR UPDATE OR DELETE ON public.operations_human_principal_activation_histories FOR EACH ROW EXECUTE FUNCTION operations_private.validate_principal_activation_history();
--> statement-breakpoint
CREATE OR REPLACE FUNCTION operations_private.validate_account_activation_history() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, pg_temp AS $$
DECLARE t text; s text; h text;
BEGIN
  IF TG_OP = 'DELETE' THEN RAISE EXCEPTION 'Activation history cannot be deleted' USING ERRCODE = '23514'; END IF;
  IF TG_OP = 'INSERT' THEN NEW.recorded_at := clock_timestamp(); NEW.changed_at := NEW.recorded_at;
  ELSE
    IF NEW.account_id IS DISTINCT FROM OLD.account_id THEN RAISE EXCEPTION 'Account history subject is immutable' USING ERRCODE = '23514'; END IF;
    IF NEW.recorded_at IS DISTINCT FROM OLD.recorded_at OR NEW.origin IS DISTINCT FROM OLD.origin THEN RAISE EXCEPTION 'History origin and recorded_at are immutable' USING ERRCODE = '23514'; END IF;
    IF NEW.activation_history IS DISTINCT FROM OLD.activation_history AND (OLD.activation_history <> 'never_activated' OR NEW.activation_history <> 'previously_activated') THEN RAISE EXCEPTION 'History transition is not permitted' USING ERRCODE = '23514'; END IF;
    NEW.changed_at := clock_timestamp();
  END IF;
  SELECT subject_type, subject_id, after_activation_history INTO t, s, h FROM public.operations_identity_lifecycle_audits WHERE audit_id = NEW.last_history_audit_id;
  IF NOT FOUND OR t <> 'operations_account' OR s IS DISTINCT FROM NEW.account_id OR h IS DISTINCT FROM NEW.activation_history THEN RAISE EXCEPTION 'Account history audit association is invalid' USING ERRCODE = '23514'; END IF;
  RETURN NEW;
END;
$$;
GRANT EXECUTE ON FUNCTION operations_private.validate_account_activation_history() TO pci_ops_table_owner, pci_ops_function_owner;
--> statement-breakpoint
CREATE TRIGGER operations_account_activation_history_validate_trigger BEFORE INSERT OR UPDATE OR DELETE ON public.operations_account_activation_histories FOR EACH ROW EXECUTE FUNCTION operations_private.validate_account_activation_history();
CREATE TRIGGER operations_human_principal_activation_history_reject_truncate_trigger BEFORE TRUNCATE ON public.operations_human_principal_activation_histories FOR EACH STATEMENT EXECUTE FUNCTION operations_private.reject_activation_history_truncate();
CREATE TRIGGER operations_account_activation_history_reject_truncate_trigger BEFORE TRUNCATE ON public.operations_account_activation_histories FOR EACH STATEMENT EXECUTE FUNCTION operations_private.reject_activation_history_truncate();
--> statement-breakpoint
CREATE OR REPLACE FUNCTION operations_private.require_principal_history() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, pg_temp AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.operations_human_principal_activation_histories WHERE principal_id = NEW.principal_id) THEN RAISE EXCEPTION 'Principal activation history is required' USING ERRCODE = '23514'; END IF;
  RETURN NULL;
END;
$$;
GRANT EXECUTE ON FUNCTION operations_private.require_principal_history() TO pci_ops_table_owner, pci_ops_function_owner;
CREATE OR REPLACE FUNCTION operations_private.require_account_history() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, pg_temp AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.operations_account_activation_histories WHERE account_id = NEW.account_id) THEN RAISE EXCEPTION 'Account activation history is required' USING ERRCODE = '23514'; END IF;
  RETURN NULL;
END;
$$;
GRANT EXECUTE ON FUNCTION operations_private.require_account_history() TO pci_ops_table_owner, pci_ops_function_owner;
--> statement-breakpoint
CREATE CONSTRAINT TRIGGER operations_human_principal_history_required AFTER INSERT ON public.operations_human_principals DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION operations_private.require_principal_history();
CREATE CONSTRAINT TRIGGER operations_account_history_required AFTER INSERT ON public.operations_accounts DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION operations_private.require_account_history();
--> statement-breakpoint
GRANT SELECT, INSERT ON public.operations_identity_lifecycle_audits, public.operations_human_principal_activation_histories, public.operations_account_activation_histories TO pci_ops_function_owner;
--> statement-breakpoint
INSERT INTO public.operations_identity_lifecycle_audits (audit_id, operation_id, correlation_id, principal_id, subject_type, subject_id, operation_type, before_status, after_status, before_activation_history, after_activation_history, before_principal_epoch, after_principal_epoch, result, reason_code, event_occurred_at)
SELECT 'legacy-principal-' || md5(p.principal_id), 'legacy-principal-' || md5(p.principal_id), 'legacy-principal-' || md5(p.principal_id), p.principal_id, 'human_principal', p.principal_id, 'legacy_history_initialized', NULL, p.status, NULL, 'unknown', NULL, p.security_epoch, 'success', 'legacy_history_initialized', clock_timestamp() FROM public.operations_human_principals p;
--> statement-breakpoint
INSERT INTO public.operations_identity_lifecycle_audits (audit_id, operation_id, correlation_id, principal_id, account_id, subject_type, subject_id, operation_type, before_status, after_status, before_activation_history, after_activation_history, before_principal_epoch, after_principal_epoch, result, reason_code, event_occurred_at)
SELECT 'legacy-account-' || md5(a.account_id), 'legacy-account-' || md5(a.account_id), 'legacy-account-' || md5(a.account_id), a.principal_id, a.account_id, 'operations_account', a.account_id, 'legacy_history_initialized', NULL, a.status, NULL, 'unknown', NULL, p.security_epoch, 'success', 'legacy_history_initialized', clock_timestamp() FROM public.operations_accounts a JOIN public.operations_human_principals p ON p.principal_id = a.principal_id;
--> statement-breakpoint
INSERT INTO public.operations_human_principal_activation_histories (principal_id, activation_history, origin, recorded_at, changed_at, last_history_audit_id)
SELECT p.principal_id, 'unknown', 'legacy_backfill', clock_timestamp(), clock_timestamp(), 'legacy-principal-' || md5(p.principal_id) FROM public.operations_human_principals p;
--> statement-breakpoint
INSERT INTO public.operations_account_activation_histories (account_id, activation_history, origin, recorded_at, changed_at, last_history_audit_id)
SELECT a.account_id, 'unknown', 'legacy_backfill', clock_timestamp(), clock_timestamp(), 'legacy-account-' || md5(a.account_id) FROM public.operations_accounts a;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'operations_api')
    OR NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'operations_private') THEN
    RAISE EXCEPTION 'Operations function schemas must be provisioned before Migration 0040' USING ERRCODE = '42501';
  END IF;
END;
$$;
--> statement-breakpoint
ALTER SCHEMA operations_api OWNER TO pci_ops_function_owner;
ALTER SCHEMA operations_private OWNER TO pci_ops_function_owner;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION operations_api.create_principal(p_principal_id varchar(128), p_operation_id varchar(128), p_correlation_id varchar(128), p_reason_code varchar(128), p_evidence_ref varchar(256) DEFAULT NULL, p_decision_ref varchar(256) DEFAULT NULL, p_event_occurred_at timestamptz DEFAULT clock_timestamp()) RETURNS varchar(128)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, pg_temp AS $$
DECLARE aid varchar(128) := 'principal-create-' || md5(p_operation_id || ':' || p_principal_id);
BEGIN
  INSERT INTO public.operations_human_principals (principal_id, status, security_epoch) VALUES (p_principal_id, 'pending', 0);
  INSERT INTO public.operations_identity_lifecycle_audits (audit_id, operation_id, correlation_id, principal_id, subject_type, subject_id, operation_type, before_status, after_status, before_activation_history, after_activation_history, after_principal_epoch, result, reason_code, event_occurred_at, evidence_ref, decision_ref) VALUES (aid, p_operation_id, p_correlation_id, p_principal_id, 'human_principal', p_principal_id, 'principal_created', NULL, 'pending', NULL, 'never_activated', 0, 'success', p_reason_code, p_event_occurred_at, p_evidence_ref, p_decision_ref);
  INSERT INTO public.operations_human_principal_activation_histories (principal_id, activation_history, origin, recorded_at, changed_at, last_history_audit_id) VALUES (p_principal_id, 'never_activated', 'new_subject', clock_timestamp(), clock_timestamp(), aid);
  RETURN p_principal_id;
END;
$$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION operations_api.create_account(p_account_id varchar(128), p_principal_id varchar(128), p_login_identifier_normalized varchar(320), p_operation_id varchar(128), p_correlation_id varchar(128), p_reason_code varchar(128), p_evidence_ref varchar(256) DEFAULT NULL, p_decision_ref varchar(256) DEFAULT NULL, p_event_occurred_at timestamptz DEFAULT clock_timestamp()) RETURNS varchar(128)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, pg_temp AS $$
DECLARE p_status text; p_history text; p_epoch integer; aid varchar(128) := 'account-create-' || md5(p_operation_id || ':' || p_account_id);
BEGIN
  SELECT status, security_epoch INTO p_status, p_epoch FROM public.operations_human_principals WHERE principal_id = p_principal_id FOR UPDATE;
  IF NOT FOUND OR p_status = 'tombstoned' THEN RAISE EXCEPTION 'Operations Account owner is not eligible' USING ERRCODE = '23514'; END IF;
  SELECT activation_history INTO p_history FROM public.operations_human_principal_activation_histories WHERE principal_id = p_principal_id;
  IF NOT FOUND OR (p_history <> 'unknown' AND ((p_status = 'pending' AND p_history <> 'never_activated') OR (p_status IN ('active','suspended','disabled') AND p_history <> 'previously_activated'))) THEN RAISE EXCEPTION 'Operations Account owner history is inconsistent' USING ERRCODE = '23514'; END IF;
  INSERT INTO public.operations_accounts (account_id, principal_id, login_identifier_normalized, status) VALUES (p_account_id, p_principal_id, p_login_identifier_normalized, 'invited');
  INSERT INTO public.operations_identity_lifecycle_audits (audit_id, operation_id, correlation_id, principal_id, account_id, subject_type, subject_id, operation_type, before_status, after_status, before_activation_history, after_activation_history, after_principal_epoch, result, reason_code, event_occurred_at, evidence_ref, decision_ref) VALUES (aid, p_operation_id, p_correlation_id, p_principal_id, p_account_id, 'operations_account', p_account_id, 'account_created', NULL, 'invited', NULL, 'never_activated', p_epoch, 'success', p_reason_code, p_event_occurred_at, p_evidence_ref, p_decision_ref);
  INSERT INTO public.operations_account_activation_histories (account_id, activation_history, origin, recorded_at, changed_at, last_history_audit_id) VALUES (p_account_id, 'never_activated', 'new_subject', clock_timestamp(), clock_timestamp(), aid);
  RETURN p_account_id;
END;
$$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION operations_api.create_principal_with_account(p_principal_id varchar(128), p_account_id varchar(128), p_login_identifier_normalized varchar(320), p_operation_id varchar(128), p_correlation_id varchar(128), p_reason_code varchar(128), p_evidence_ref varchar(256) DEFAULT NULL, p_decision_ref varchar(256) DEFAULT NULL, p_event_occurred_at timestamptz DEFAULT clock_timestamp()) RETURNS TABLE(created_principal_id varchar(128), created_account_id varchar(128))
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, pg_temp AS $$
DECLARE paid varchar(128) := 'principal-create-' || md5(p_operation_id || ':' || p_principal_id); aaid varchar(128) := 'account-create-' || md5(p_operation_id || ':' || p_account_id);
BEGIN
  INSERT INTO public.operations_human_principals (principal_id, status, security_epoch) VALUES (p_principal_id, 'pending', 0);
  INSERT INTO public.operations_identity_lifecycle_audits (audit_id, operation_id, correlation_id, principal_id, subject_type, subject_id, operation_type, before_status, after_status, before_activation_history, after_activation_history, after_principal_epoch, result, reason_code, event_occurred_at, evidence_ref, decision_ref) VALUES (paid, p_operation_id, p_correlation_id, p_principal_id, 'human_principal', p_principal_id, 'principal_created', NULL, 'pending', NULL, 'never_activated', 0, 'success', p_reason_code, p_event_occurred_at, p_evidence_ref, p_decision_ref);
  INSERT INTO public.operations_human_principal_activation_histories (principal_id, activation_history, origin, recorded_at, changed_at, last_history_audit_id) VALUES (p_principal_id, 'never_activated', 'new_subject', clock_timestamp(), clock_timestamp(), paid);
  INSERT INTO public.operations_accounts (account_id, principal_id, login_identifier_normalized, status) VALUES (p_account_id, p_principal_id, p_login_identifier_normalized, 'invited');
  INSERT INTO public.operations_identity_lifecycle_audits (audit_id, operation_id, correlation_id, principal_id, account_id, subject_type, subject_id, operation_type, before_status, after_status, before_activation_history, after_activation_history, after_principal_epoch, result, reason_code, event_occurred_at, evidence_ref, decision_ref) VALUES (aaid, p_operation_id, p_correlation_id, p_principal_id, p_account_id, 'operations_account', p_account_id, 'account_created', NULL, 'invited', NULL, 'never_activated', 0, 'success', p_reason_code, p_event_occurred_at, p_evidence_ref, p_decision_ref);
  INSERT INTO public.operations_account_activation_histories (account_id, activation_history, origin, recorded_at, changed_at, last_history_audit_id) VALUES (p_account_id, 'never_activated', 'new_subject', clock_timestamp(), clock_timestamp(), aaid);
  RETURN QUERY SELECT p_principal_id, p_account_id;
END;
$$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION operations_api.create_principal(varchar, varchar, varchar, varchar, varchar, varchar, timestamptz) FROM PUBLIC;
REVOKE ALL ON FUNCTION operations_api.create_account(varchar, varchar, varchar, varchar, varchar, varchar, varchar, varchar, timestamptz) FROM PUBLIC;
REVOKE ALL ON FUNCTION operations_api.create_principal_with_account(varchar, varchar, varchar, varchar, varchar, varchar, varchar, varchar, timestamptz) FROM PUBLIC;
