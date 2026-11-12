-- Terminal identity rows are immutable history. Nonterminal transitions and deletes
-- keep their existing semantics. These row triggers do not protect TRUNCATE.
CREATE FUNCTION operations_identity_protect_terminal_history() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status = TG_ARGV[0] THEN
    RAISE EXCEPTION 'Terminal Operations identity history cannot be changed.'
      USING ERRCODE = '23514';
  END IF;
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER operations_human_principals_protect_terminal_history_trigger
BEFORE UPDATE OR DELETE ON operations_human_principals FOR EACH ROW
EXECUTE FUNCTION operations_identity_protect_terminal_history('tombstoned');
--> statement-breakpoint
CREATE TRIGGER operations_accounts_protect_terminal_history_trigger
BEFORE UPDATE OR DELETE ON operations_accounts FOR EACH ROW
EXECUTE FUNCTION operations_identity_protect_terminal_history('revoked');
--> statement-breakpoint
CREATE TRIGGER service_principals_protect_terminal_history_trigger
BEFORE UPDATE OR DELETE ON service_principals FOR EACH ROW
EXECUTE FUNCTION operations_identity_protect_terminal_history('revoked');
