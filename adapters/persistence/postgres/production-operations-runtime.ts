import type { Sql } from 'postgres';

export const operationsRuntimeRole = 'pci_ops_runtime';

export function productionOperationsDatabaseUrl(
  environment: NodeJS.ProcessEnv,
): string | undefined {
  const enabled = environment.OPERATIONS_HUMAN_ENABLED;
  if (enabled === undefined || enabled === '' || enabled === 'false') return undefined;
  if (enabled !== 'true') throw new Error('OPERATIONS_HUMAN_ENABLED must be true or false.');

  const value = environment.OPERATIONS_DATABASE_URL;
  try {
    const url = new URL(value ?? '');
    if (
      value &&
      ['postgres:', 'postgresql:'].includes(url.protocol) &&
      url.hostname === 'postgres' &&
      url.port === '5432' &&
      url.pathname === '/personal_commerce' &&
      url.username === operationsRuntimeRole &&
      decodeURIComponent(url.password).length > 0 &&
      !url.search &&
      !url.hash
    )
      return value;
  } catch {
    throw new Error('OPERATIONS_DATABASE_URL is missing or invalid.');
  }
  throw new Error('OPERATIONS_DATABASE_URL must use the dedicated internal Operations runtime.');
}

export async function verifyProductionOperationsRuntime(connection: Sql): Promise<void> {
  try {
    const [result] = await connection<{ valid: boolean }[]>`
      WITH expected_select (name, lock_only) AS (VALUES ('operations_human_principals', true), ('operations_accounts', true),
        ('operations_credentials', true), ('operations_sessions', false),
        ('operations_human_principal_activation_histories', false), ('operations_account_activation_histories', false)),
      session_access (privilege, columns) AS (VALUES
        ('INSERT', ARRAY['session_id','principal_id','account_id','credential_digest','status','credential_version',
          'principal_security_epoch','session_version','created_at','last_activity_at','idle_expires_at',
          'absolute_expires_at','mfa_verified_at']),
        ('UPDATE', ARRAY['credential_digest','status','session_version','last_activity_at','idle_expires_at','revoked_at']))
      SELECT current_user=${operationsRuntimeRole} AND session_user=${operationsRuntimeRole}
        AND current_database()='personal_commerce'
        AND r.rolcanlogin AND NOT (r.rolinherit OR r.rolsuper OR r.rolcreaterole OR r.rolcreatedb
          OR r.rolreplication OR r.rolbypassrls)
        AND NOT EXISTS (SELECT 1 FROM pg_catalog.pg_auth_members WHERE member=r.oid)
        AND NOT EXISTS (SELECT 1 FROM pg_catalog.pg_shdepend WHERE refclassid='pg_catalog.pg_authid'::regclass
          AND refobjid=r.oid AND deptype='o')
        AND NOT has_database_privilege(current_database(), 'CREATE,TEMP')
        AND has_schema_privilege('public', 'USAGE')
        AND NOT EXISTS (SELECT 1 FROM pg_catalog.pg_namespace WHERE has_schema_privilege(oid, 'CREATE'))
        AND NOT has_schema_privilege('operations_private', 'USAGE')
        AND NOT has_schema_privilege('drizzle', 'USAGE')
        AND NOT has_function_privilege('operations_api.initialize_first_admin(text,text,text,text,text,text,text,text,text)'::regprocedure, 'EXECUTE')
        AND NOT EXISTS (SELECT 1 FROM expected_select WHERE NOT has_table_privilege('public.' || name, 'SELECT'))
        AND NOT EXISTS (SELECT 1 FROM expected_select WHERE lock_only
          AND NOT has_column_privilege('public.' || name, 'updated_at', 'UPDATE'))
        AND NOT EXISTS (SELECT 1 FROM session_access CROSS JOIN LATERAL unnest(columns) column_name
          WHERE NOT has_column_privilege('public.operations_sessions', column_name, privilege))
        AND NOT EXISTS (SELECT 1 FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
          LEFT JOIN expected_select e ON n.nspname='public' AND e.name=c.relname
          WHERE n.nspname NOT IN ('information_schema', 'pg_catalog') AND n.nspname !~ '^pg_'
            AND c.relkind IN ('r','p','v','m','f')
            AND (has_table_privilege(c.oid, 'INSERT,UPDATE,DELETE,TRUNCATE,TRIGGER,MAINTAIN')
              OR has_any_column_privilege(c.oid, 'REFERENCES')
              OR (e.name IS NULL AND has_any_column_privilege(c.oid, 'SELECT,INSERT,UPDATE'))
              OR (e.name IS NOT NULL AND EXISTS (
                SELECT 1 FROM pg_catalog.pg_attribute a CROSS JOIN (VALUES ('INSERT'), ('UPDATE')) p(privilege)
                WHERE a.attrelid=c.oid AND a.attnum>0 AND NOT a.attisdropped
                  AND has_column_privilege(c.oid, a.attnum, p.privilege)
                  AND NOT (e.lock_only AND p.privilege='UPDATE' AND a.attname='updated_at')
                  AND NOT (e.name='operations_sessions' AND EXISTS (
                    SELECT 1 FROM session_access s WHERE s.privilege=p.privilege AND a.attname=ANY(s.columns)))
              ))))
        AS valid FROM pg_catalog.pg_roles r WHERE r.rolname=current_user`;
    if (result?.valid === true) return;
  } catch {
    throw new Error('Operations runtime database connection or privilege verification failed.');
  }
  throw new Error(
    'Operations runtime database identity or privileges do not match the production contract.',
  );
}
