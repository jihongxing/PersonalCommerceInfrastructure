-- PCI-ENG-018-B-R1: bounded initial Human Operations activation and runtime column ACL.
-- Legacy Owner retains existing table ownership. This private, parameterless guard
-- lends only two fixed transaction locks, never general SQL or MAINTAIN authority.
CREATE FUNCTION public.operations_first_bootstrap_guard() RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, pg_temp AS $$
BEGIN
  LOCK TABLE public.operations_human_principals IN SHARE ROW EXCLUSIVE MODE;
  LOCK TABLE public.operations_accounts IN SHARE ROW EXCLUSIVE MODE;
END;
$$;
REVOKE ALL ON FUNCTION public.operations_first_bootstrap_guard() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.operations_first_bootstrap_guard() TO pci_ops_function_owner;
GRANT UPDATE (status) ON public.operations_accounts TO pci_ops_function_owner;
GRANT INSERT ON public.operations_credentials TO pci_ops_function_owner;
GRANT SELECT ON public.operations_credentials TO pci_ops_function_owner;
--> statement-breakpoint
ALTER TABLE public.operations_identity_lifecycle_audits DROP CONSTRAINT operations_identity_lifecycle_audits_operation_type_check;
ALTER TABLE public.operations_identity_lifecycle_audits ADD CONSTRAINT operations_identity_lifecycle_audits_operation_type_check CHECK (operation_type IN ('principal_created','account_created','legacy_history_initialized','principal_first_activated','account_first_activated'));
GRANT UPDATE (activation_history, last_history_audit_id) ON public.operations_human_principal_activation_histories, public.operations_account_activation_histories TO pci_ops_function_owner;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION operations_private.validate_identity_lifecycle_audit() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, pg_temp AS $$
DECLARE p_status text; p_epoch integer; a_status text; a_principal varchar(128);
BEGIN
  IF TG_OP <> 'INSERT' THEN RAISE EXCEPTION 'Lifecycle audit is append-only' USING ERRCODE = '23514'; END IF;
  NEW.recorded_at := clock_timestamp();
  IF NEW.event_occurred_at > clock_timestamp() THEN RAISE EXCEPTION 'Audit event cannot be in the future' USING ERRCODE = '23514'; END IF;
  IF NEW.subject_type = 'human_principal' THEN
    IF NEW.operation_type NOT IN ('principal_created','legacy_history_initialized','principal_first_activated') OR NEW.principal_id IS DISTINCT FROM NEW.subject_id OR NEW.account_id IS NOT NULL THEN RAISE EXCEPTION 'Invalid principal audit association' USING ERRCODE = '23514'; END IF;
    SELECT status, security_epoch INTO p_status, p_epoch FROM public.operations_human_principals WHERE principal_id = NEW.principal_id;
    IF NOT FOUND OR p_status IS DISTINCT FROM NEW.after_status OR p_epoch IS DISTINCT FROM NEW.after_principal_epoch THEN RAISE EXCEPTION 'Principal audit does not describe persisted subject' USING ERRCODE = '23514'; END IF;
  ELSIF NEW.subject_type = 'operations_account' THEN
    IF NEW.operation_type NOT IN ('account_created','legacy_history_initialized','account_first_activated') OR NEW.account_id IS DISTINCT FROM NEW.subject_id OR NEW.principal_id IS NULL THEN RAISE EXCEPTION 'Invalid account audit association' USING ERRCODE = '23514'; END IF;
    SELECT status, principal_id INTO a_status, a_principal FROM public.operations_accounts WHERE account_id = NEW.account_id;
    IF NOT FOUND OR a_status IS DISTINCT FROM NEW.after_status OR a_principal IS DISTINCT FROM NEW.principal_id THEN RAISE EXCEPTION 'Account audit does not describe persisted subject' USING ERRCODE = '23514'; END IF;
    SELECT security_epoch INTO p_epoch FROM public.operations_human_principals WHERE principal_id = a_principal;
    IF NEW.after_principal_epoch IS DISTINCT FROM p_epoch THEN RAISE EXCEPTION 'Account audit Principal Epoch is inconsistent' USING ERRCODE = '23514'; END IF;
  ELSE RAISE EXCEPTION 'Invalid lifecycle audit subject type' USING ERRCODE = '23514'; END IF;
  IF NEW.operation_type IN ('principal_first_activated','account_first_activated') THEN
    IF NEW.before_status IS DISTINCT FROM (CASE WHEN NEW.subject_type = 'human_principal' THEN 'pending' ELSE 'invited' END)
      OR NEW.after_status IS DISTINCT FROM 'active'
      OR NEW.before_activation_history IS DISTINCT FROM 'never_activated'
      OR NEW.after_activation_history IS DISTINCT FROM 'previously_activated'
      OR NEW.before_principal_epoch IS DISTINCT FROM 0 OR NEW.after_principal_epoch IS DISTINCT FROM 0
      OR NULLIF(btrim(NEW.evidence_ref), '') IS NULL OR NULLIF(btrim(NEW.decision_ref), '') IS NULL THEN
      RAISE EXCEPTION 'Invalid first activation audit' USING ERRCODE = '23514';
    END IF;
    IF NEW.subject_type = 'human_principal' THEN
      IF NOT EXISTS (SELECT 1 FROM public.operations_human_principal_activation_histories WHERE principal_id=NEW.subject_id AND activation_history='never_activated' AND origin='new_subject') THEN
        RAISE EXCEPTION 'First activation requires never activated history' USING ERRCODE = '23514';
      END IF;
    ELSE
      IF NOT EXISTS (SELECT 1 FROM public.operations_account_activation_histories WHERE account_id=NEW.subject_id AND activation_history='never_activated' AND origin='new_subject')
        OR NOT EXISTS (SELECT 1 FROM public.operations_human_principals p JOIN public.operations_human_principal_activation_histories h USING(principal_id) WHERE p.principal_id=NEW.principal_id AND p.status='active' AND p.security_epoch=0 AND h.activation_history='previously_activated') THEN
        RAISE EXCEPTION 'Account first activation requires active Principal' USING ERRCODE = '23514';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
GRANT EXECUTE ON FUNCTION operations_private.validate_identity_lifecycle_audit() TO pci_ops_table_owner, pci_ops_function_owner;
--> statement-breakpoint
CREATE FUNCTION operations_api.initialize_first_admin(
  p_principal_id text, p_account_id text, p_credential_id text, p_login text,
  p_verifier text, p_operation_id text, p_correlation_id text, p_evidence_ref text, p_decision_ref text
) RETURNS text
-- The accepted 0037 INSERT trigger resolves its tables through public. Only a
-- trusted public schema may participate; every object in this function remains
-- qualified, and pg_temp is last so temporary relations cannot shadow it.
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public, pg_temp AS $$
DECLARE
  pa text := 'first-principal-' || md5(p_operation_id || ':' || p_principal_id);
  aa text := 'first-account-' || md5(p_operation_id || ':' || p_account_id);
BEGIN
  IF session_user <> 'pci_ops_migration' THEN RAISE EXCEPTION 'Unauthorized initializer' USING ERRCODE='42501'; END IF;
  IF EXISTS (
    SELECT 1 FROM pg_catalog.pg_roles r
    WHERE NOT r.rolsuper
      AND r.rolname NOT IN ('pg_database_owner', 'pci_ops_legacy_owner', 'pci_ops_table_owner', 'pci_ops_function_owner')
      AND r.oid <> (SELECT datdba FROM pg_catalog.pg_database WHERE datname = current_database())
      AND pg_catalog.has_schema_privilege(r.oid, 'public', 'CREATE')
  ) OR EXISTS (
    SELECT 1 FROM pg_catalog.pg_namespace n,
      LATERAL pg_catalog.aclexplode(COALESCE(n.nspacl, pg_catalog.acldefault('n', n.nspowner))) a
    WHERE n.nspname = 'public' AND a.grantee = 0 AND a.privilege_type = 'CREATE'
  ) THEN
    RAISE EXCEPTION 'Bootstrap requires a trusted public schema' USING ERRCODE='42501';
  END IF;
  IF p_principal_id IS NULL OR length(btrim(p_principal_id)) NOT BETWEEN 1 AND 128
    OR p_account_id IS NULL OR length(btrim(p_account_id)) NOT BETWEEN 1 AND 128
    OR p_credential_id IS NULL OR length(btrim(p_credential_id)) NOT BETWEEN 1 AND 128
    OR p_operation_id IS NULL OR length(btrim(p_operation_id)) NOT BETWEEN 1 AND 100
    OR p_correlation_id IS NULL OR length(btrim(p_correlation_id)) NOT BETWEEN 1 AND 128
    OR p_login IS NULL OR length(p_login) NOT BETWEEN 1 AND 320
    OR p_login IS DISTINCT FROM normalize(btrim(p_login), NFC)
    OR p_verifier IS NULL OR p_verifier !~ '^\$argon2id\$v=19\$m=19456,t=2,p=1\$[A-Za-z0-9+/]{22}\$[A-Za-z0-9+/]{43}$'
    OR p_evidence_ref IS NULL OR length(btrim(p_evidence_ref)) NOT BETWEEN 1 AND 256
    OR p_decision_ref IS NULL OR length(btrim(p_decision_ref)) NOT BETWEEN 1 AND 256 THEN
    RAISE EXCEPTION 'Invalid initial admin parameters' USING ERRCODE='22023';
  END IF;
  PERFORM public.operations_first_bootstrap_guard();
  IF EXISTS (SELECT 1 FROM public.operations_human_principals) OR EXISTS (SELECT 1 FROM public.operations_accounts) THEN
    RETURN 'ALREADY_INITIALIZED';
  END IF;
  PERFORM operations_api.create_principal_with_account(p_principal_id::varchar, p_account_id::varchar, p_login::varchar,
    (p_operation_id || '-create')::varchar, p_correlation_id::varchar, 'first_admin_creation'::varchar,
    p_evidence_ref::varchar, p_decision_ref::varchar);
  UPDATE public.operations_human_principals SET status='active' WHERE principal_id=p_principal_id AND status='pending' AND security_epoch=0;
  IF NOT FOUND THEN RAISE EXCEPTION 'Initial Principal state invalid' USING ERRCODE='23514'; END IF;
  INSERT INTO public.operations_identity_lifecycle_audits
    (audit_id,operation_id,correlation_id,principal_id,subject_type,subject_id,operation_type,before_status,after_status,before_activation_history,after_activation_history,before_principal_epoch,after_principal_epoch,result,reason_code,event_occurred_at,evidence_ref,decision_ref)
    VALUES(pa,p_operation_id,p_correlation_id,p_principal_id,'human_principal',p_principal_id,'principal_first_activated','pending','active','never_activated','previously_activated',0,0,'success','first_admin_activation',clock_timestamp(),p_evidence_ref,p_decision_ref);
  UPDATE public.operations_human_principal_activation_histories SET activation_history='previously_activated',last_history_audit_id=pa WHERE principal_id=p_principal_id AND activation_history='never_activated';
  IF NOT FOUND THEN RAISE EXCEPTION 'Initial Principal history invalid' USING ERRCODE='23514'; END IF;
  UPDATE public.operations_accounts SET status='active' WHERE account_id=p_account_id AND status='invited';
  IF NOT FOUND THEN RAISE EXCEPTION 'Initial Account state invalid' USING ERRCODE='23514'; END IF;
  INSERT INTO public.operations_identity_lifecycle_audits
    (audit_id,operation_id,correlation_id,principal_id,account_id,subject_type,subject_id,operation_type,before_status,after_status,before_activation_history,after_activation_history,before_principal_epoch,after_principal_epoch,result,reason_code,event_occurred_at,evidence_ref,decision_ref)
    VALUES(aa,p_operation_id,p_correlation_id,p_principal_id,p_account_id,'operations_account',p_account_id,'account_first_activated','invited','active','never_activated','previously_activated',0,0,'success','first_admin_activation',clock_timestamp(),p_evidence_ref,p_decision_ref);
  UPDATE public.operations_account_activation_histories SET activation_history='previously_activated',last_history_audit_id=aa WHERE account_id=p_account_id AND activation_history='never_activated';
  IF NOT FOUND THEN RAISE EXCEPTION 'Initial Account history invalid' USING ERRCODE='23514'; END IF;
  INSERT INTO public.operations_credentials (credential_id,account_id,kind,status,verifier,version)
    VALUES(p_credential_id,p_account_id,'password','active',p_verifier,1);
  IF NOT EXISTS (SELECT 1 FROM public.operations_human_principals WHERE principal_id=p_principal_id AND status='active' AND security_epoch=0)
    OR NOT EXISTS (SELECT 1 FROM public.operations_accounts WHERE account_id=p_account_id AND principal_id=p_principal_id AND status='active')
    OR NOT EXISTS (SELECT 1 FROM public.operations_human_principal_activation_histories WHERE principal_id=p_principal_id AND activation_history='previously_activated' AND last_history_audit_id=pa)
    OR NOT EXISTS (SELECT 1 FROM public.operations_account_activation_histories WHERE account_id=p_account_id AND activation_history='previously_activated' AND last_history_audit_id=aa)
    OR NOT EXISTS (SELECT 1 FROM public.operations_credentials WHERE credential_id=p_credential_id AND account_id=p_account_id AND version=1 AND status='active') THEN
    RAISE EXCEPTION 'Initial admin verification failed' USING ERRCODE='23514';
  END IF;
  RETURN 'INITIALIZED';
END;
$$;
REVOKE ALL ON FUNCTION operations_api.initialize_first_admin(text,text,text,text,text,text,text,text,text) FROM PUBLIC;
GRANT USAGE ON SCHEMA operations_api TO pci_ops_migration;
GRANT EXECUTE ON FUNCTION operations_api.initialize_first_admin(text,text,text,text,text,text,text,text,text) TO pci_ops_migration;
--> statement-breakpoint
-- Runtime cannot insert/update Principal, Account or Credential lifecycle data.
-- Any column UPDATE suffices for SELECT FOR UPDATE in the accepted repository.
GRANT SELECT ON public.operations_human_principals, public.operations_accounts,
  public.operations_credentials TO pci_ops_runtime;
GRANT UPDATE (updated_at) ON public.operations_human_principals, public.operations_accounts,
  public.operations_credentials TO pci_ops_runtime;
GRANT SELECT ON public.operations_sessions TO pci_ops_runtime;
GRANT INSERT (session_id,principal_id,account_id,credential_digest,status,credential_version,
  principal_security_epoch,session_version,created_at,last_activity_at,idle_expires_at,
  absolute_expires_at,mfa_verified_at) ON public.operations_sessions TO pci_ops_runtime;
GRANT UPDATE (credential_digest,status,session_version,last_activity_at,idle_expires_at,revoked_at)
  ON public.operations_sessions TO pci_ops_runtime;
--> statement-breakpoint
GRANT SELECT ON public.operations_human_principal_activation_histories, public.operations_account_activation_histories TO pci_ops_runtime;
