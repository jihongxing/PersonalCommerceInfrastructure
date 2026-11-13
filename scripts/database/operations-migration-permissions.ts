import type { Sql, TransactionSql } from 'postgres';

export type InstallationSql = Sql | TransactionSql;
export const installationRoles = {
  bootstrap: 'pci_ops_bootstrap',
  journal: 'pci_ops_journal_owner',
  migration: 'pci_ops_migration',
  table: 'pci_ops_table_owner',
  function: 'pci_ops_function_owner',
  runtime: 'pci_ops_runtime',
  legacyFixture: 'pci_ops_legacy_owner',
} as const;

// Provisioning is deliberately separate from Bootstrap and the migration executor.
// A disposable administrator must first provision pci_ops_bootstrap without embedding credentials.
export const journalProvisioningSql = `
CREATE ROLE pci_ops_journal_owner NOLOGIN NOINHERIT NOSUPERUSER NOCREATEDB
  NOCREATEROLE NOREPLICATION NOBYPASSRLS;
GRANT pci_ops_journal_owner TO pci_ops_bootstrap WITH INHERIT FALSE, SET TRUE;
DO $$ BEGIN
  EXECUTE format('GRANT CREATE ON DATABASE %I TO pci_ops_journal_owner', current_database());
END $$;`;

export const journalProvisioningCleanupSql = `
DO $$ BEGIN
  EXECUTE format('REVOKE CREATE ON DATABASE %I FROM pci_ops_journal_owner', current_database());
END $$;
REVOKE pci_ops_journal_owner FROM pci_ops_bootstrap;
ALTER ROLE pci_ops_bootstrap NOLOGIN;`;

// A separately reviewed installer/DBA window prepares the two function-owned schemas. The
// Migration Role never receives Database CREATE and the Bootstrap identity never gains Function
// Owner membership; this SQL is intentionally fixed and contains no caller-selected identifiers.
export const operationsSchemaProvisioningSql = `
CREATE SCHEMA IF NOT EXISTS operations_api;
CREATE SCHEMA IF NOT EXISTS operations_private;
ALTER SCHEMA operations_api OWNER TO pci_ops_function_owner;
ALTER SCHEMA operations_private OWNER TO pci_ops_function_owner;
REVOKE ALL ON SCHEMA operations_api, operations_private FROM PUBLIC;
GRANT USAGE ON SCHEMA operations_api TO pci_ops_runtime;
GRANT USAGE ON SCHEMA operations_private TO pci_ops_table_owner;
ALTER DEFAULT PRIVILEGES FOR ROLE pci_ops_function_owner IN SCHEMA operations_api REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
ALTER DEFAULT PRIVILEGES FOR ROLE pci_ops_function_owner IN SCHEMA operations_private REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;`;

export class InstallationContractError extends Error {
  constructor(readonly rule: string) {
    super(`Operations installation contract rejected: ${rule}`);
    this.name = 'InstallationContractError';
  }
}

export function requireInstallation(condition: unknown, rule: string): asserts condition {
  if (!condition) throw new InstallationContractError(rule);
}

export async function installationIdentity(sql: InstallationSql) {
  const rows = await sql<
    {
      pid: number;
      session_user: string;
      current_user: string;
      database: string;
    }[]
  >`SELECT pg_backend_pid() AS pid, session_user, current_user, current_database() AS database`;
  return rows[0]!;
}

export async function requireInstallationIdentity(sql: InstallationSql, role: string) {
  const identity = await installationIdentity(sql);
  requireInstallation(
    identity.session_user === role && identity.current_user === role,
    'independent session identity',
  );
  requireInstallation(
    /^pci_ops_migration_fixture_[a-z0-9_]+$/.test(identity.database),
    'disposable database only; deployed migration identity is not approved',
  );
  return identity;
}

export async function verifyInstallationRoles(sql: InstallationSql): Promise<void> {
  const rows = await sql<
    {
      rolname: string;
      rolcanlogin: boolean;
      unsafe: boolean;
    }[]
  >`SELECT rolname, rolcanlogin,
      (rolsuper OR rolcreatedb OR rolcreaterole OR rolreplication OR rolbypassrls OR rolinherit) AS unsafe
    FROM pg_roles WHERE rolname IN (
      'pci_ops_journal_owner','pci_ops_table_owner','pci_ops_function_owner',
      'pci_ops_migration','pci_ops_runtime','pci_ops_audit_reader')`;
  requireInstallation(
    rows.length === 6 && rows.every((r) => !r.unsafe),
    'restricted role attributes',
  );
  for (const row of rows) {
    requireInstallation(
      row.rolcanlogin === ['pci_ops_migration', 'pci_ops_runtime'].includes(row.rolname),
      'owner NOLOGIN and independent runtime/migration LOGIN',
    );
  }
  const membership = await sql<{ invalid: boolean }[]>`SELECT
    pg_has_role('pci_ops_migration','pci_ops_journal_owner','MEMBER') OR
    EXISTS (SELECT 1 FROM pg_roles r WHERE r.rolname LIKE 'pci_ops_%'
      AND r.rolname <> 'pci_ops_runtime' AND pg_has_role('pci_ops_runtime',r.oid,'MEMBER'))
    AS invalid`;
  requireInstallation(!membership[0]!.invalid, 'Journal/Runtime membership isolation');
}

/**
 * Migration 0040 is the only reviewed migration that needs temporary table
 * maintenance authority. The authority is provisioned outside the wrapper;
 * this check only proves that the expected, disposable grant is already in
 * place and that Runtime has not inherited it.
 */
export async function verifyActivationHistoryPrerequisites(sql: InstallationSql): Promise<void> {
  await verifyInstallationRoles(sql);
  const tables = await sql<{ relname: string; owner: string | null }[]>`
    SELECT expected.relname::text,
      pg_get_userbyid(c.relowner) AS owner
    FROM (VALUES
      ('operations_human_principals'::name),
      ('operations_accounts'::name)
    ) AS expected(relname)
    LEFT JOIN pg_class c
      ON c.relname = expected.relname
    JOIN pg_namespace n
      ON n.oid = c.relnamespace
     AND n.nspname = 'public'
    ORDER BY expected.relname`;
  requireInstallation(
    tables.length === 2 && tables.every((table) => table.owner === installationRoles.legacyFixture),
    'activation-history target table existence and fixed legacy owner',
  );

  const roles = await sql<
    {
      rolname: string;
      rolcanlogin: boolean;
      rolinherit: boolean;
      rolsuper: boolean;
      rolcreatedb: boolean;
      rolcreaterole: boolean;
      rolreplication: boolean;
      rolbypassrls: boolean;
    }[]
  >`SELECT rolname, rolcanlogin, rolinherit, rolsuper, rolcreatedb, rolcreaterole,
      rolreplication, rolbypassrls
    FROM pg_roles
    WHERE rolname IN (
      ${installationRoles.legacyFixture},
      ${installationRoles.table},
      ${installationRoles.function},
      ${installationRoles.migration},
      ${installationRoles.runtime}
    )`;
  requireInstallation(roles.length === 5, 'activation-history fixed roles exist');
  const roleByName = new Map(roles.map((role) => [role.rolname, role]));
  const tableOwner = roleByName.get(installationRoles.table);
  const functionOwner = roleByName.get(installationRoles.function);
  const migration = roleByName.get(installationRoles.migration);
  const runtime = roleByName.get(installationRoles.runtime);
  requireInstallation(
    tableOwner &&
      !tableOwner.rolcanlogin &&
      !tableOwner.rolinherit &&
      !tableOwner.rolsuper &&
      !tableOwner.rolcreatedb &&
      !tableOwner.rolcreaterole &&
      !tableOwner.rolreplication &&
      !tableOwner.rolbypassrls,
    'Table Owner restricted NOLOGIN role',
  );
  requireInstallation(
    functionOwner &&
      !functionOwner.rolcanlogin &&
      !functionOwner.rolinherit &&
      !functionOwner.rolsuper &&
      !functionOwner.rolcreatedb &&
      !functionOwner.rolcreaterole &&
      !functionOwner.rolreplication &&
      !functionOwner.rolbypassrls,
    'Function Owner restricted NOLOGIN role',
  );
  requireInstallation(
    migration?.rolcanlogin &&
      !migration.rolinherit &&
      !migration.rolsuper &&
      !migration.rolcreatedb &&
      !migration.rolcreaterole &&
      !migration.rolreplication &&
      !migration.rolbypassrls,
    'Migration independent restricted LOGIN role',
  );
  requireInstallation(
    runtime?.rolcanlogin &&
      !runtime.rolinherit &&
      !runtime.rolsuper &&
      !runtime.rolcreatedb &&
      !runtime.rolcreaterole &&
      !runtime.rolreplication &&
      !runtime.rolbypassrls,
    'Runtime independent restricted LOGIN role',
  );

  const privileges = await sql<
    {
      table_owner_principal: boolean;
      table_owner_account: boolean;
      runtime_principal: boolean;
      runtime_account: boolean;
      function_principal: boolean;
      function_account: boolean;
      migration_table_membership: boolean;
      runtime_table_membership: boolean;
      runtime_legacy_membership: boolean;
      runtime_function_membership: boolean;
      table_maintain_membership: boolean;
      migration_maintain_membership: boolean;
      runtime_maintain_membership: boolean;
      function_maintain_membership: boolean;
    }[]
  >`SELECT
      has_table_privilege(${installationRoles.table}, 'public.operations_human_principals', 'MAINTAIN') AS table_owner_principal,
      has_table_privilege(${installationRoles.table}, 'public.operations_accounts', 'MAINTAIN') AS table_owner_account,
      has_table_privilege(${installationRoles.runtime}, 'public.operations_human_principals', 'MAINTAIN') AS runtime_principal,
      has_table_privilege(${installationRoles.runtime}, 'public.operations_accounts', 'MAINTAIN') AS runtime_account,
      has_table_privilege(${installationRoles.function}, 'public.operations_human_principals', 'MAINTAIN') AS function_principal,
      has_table_privilege(${installationRoles.function}, 'public.operations_accounts', 'MAINTAIN') AS function_account,
      pg_has_role(${installationRoles.migration}, ${installationRoles.table}, 'MEMBER') AS migration_table_membership,
      pg_has_role(${installationRoles.runtime}, ${installationRoles.table}, 'MEMBER') AS runtime_table_membership,
      pg_has_role(${installationRoles.runtime}, ${installationRoles.legacyFixture}, 'MEMBER') AS runtime_legacy_membership,
      pg_has_role(${installationRoles.runtime}, ${installationRoles.function}, 'MEMBER') AS runtime_function_membership,
      pg_has_role(${installationRoles.table}, 'pg_maintain', 'MEMBER') AS table_maintain_membership,
      pg_has_role(${installationRoles.migration}, 'pg_maintain', 'MEMBER') AS migration_maintain_membership,
      pg_has_role(${installationRoles.runtime}, 'pg_maintain', 'MEMBER') AS runtime_maintain_membership,
      pg_has_role(${installationRoles.function}, 'pg_maintain', 'MEMBER') AS function_maintain_membership`;
  const privilege = privileges[0];
  requireInstallation(
    privilege?.table_owner_principal && privilege.table_owner_account,
    'temporary MAINTAIN exists for both activation-history tables',
  );
  requireInstallation(
    !privilege.runtime_principal &&
      !privilege.runtime_account &&
      !privilege.function_principal &&
      !privilege.function_account,
    'Runtime and Function Owner have no temporary MAINTAIN',
  );
  requireInstallation(
    privilege.migration_table_membership &&
      !privilege.runtime_table_membership &&
      !privilege.runtime_legacy_membership &&
      !privilege.runtime_function_membership &&
      !privilege.table_maintain_membership &&
      !privilege.migration_maintain_membership &&
      !privilege.runtime_maintain_membership &&
      !privilege.function_maintain_membership,
    'fixed SET membership, pg_maintain isolation and Runtime isolation',
  );
}

export async function verifyJournal(
  sql: InstallationSql,
  approvedHashes: readonly string[],
): Promise<void> {
  await verifyInstallationRoles(sql);
  const schema = await sql<{ owner: string; acl: unknown }[]>`
    SELECT pg_get_userbyid(nspowner) AS owner, nspacl AS acl FROM pg_namespace WHERE nspname='drizzle'`;
  requireInstallation(
    schema.length === 1 && schema[0]!.owner === installationRoles.journal,
    'Journal schema owner',
  );
  const table = await sql<{ owner: string; valid: boolean }[]>`
    SELECT pg_get_userbyid(c.relowner) AS owner,
      c.relkind='r' AND c.relpersistence='p' AND NOT c.relrowsecurity AS valid
    FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='drizzle' AND c.relname='__drizzle_migrations'`;
  requireInstallation(
    table.length === 1 && table[0]!.owner === installationRoles.journal && table[0]!.valid,
    'Journal table owner/kind',
  );
  const columns = await sql<
    {
      name: string;
      type: string;
      not_null: boolean;
      default_value: string | null;
      identity: string;
      generated: string;
    }[]
  >`
    SELECT a.attname AS name, format_type(a.atttypid,a.atttypmod) AS type,
      a.attnotnull AS not_null, pg_get_expr(d.adbin,d.adrelid) AS default_value,
      a.attidentity AS identity, a.attgenerated AS generated
    FROM pg_attribute a LEFT JOIN pg_attrdef d ON d.adrelid=a.attrelid AND d.adnum=a.attnum
    WHERE a.attrelid='drizzle.__drizzle_migrations'::regclass AND a.attnum>0 AND NOT a.attisdropped
    ORDER BY a.attnum`;
  requireInstallation(
    columns.length === 3 &&
      columns[0]!.name === 'id' &&
      columns[0]!.type === 'integer' &&
      columns[0]!.not_null &&
      columns[0]!.default_value === "nextval('drizzle.__drizzle_migrations_id_seq'::regclass)" &&
      columns[1]!.name === 'hash' &&
      columns[1]!.type === 'text' &&
      columns[1]!.not_null &&
      columns[1]!.default_value === null &&
      columns[2]!.name === 'created_at' &&
      columns[2]!.type === 'bigint' &&
      !columns[2]!.not_null &&
      columns[2]!.default_value === null &&
      columns.every((c) => c.identity === '' && c.generated === ''),
    'Drizzle-compatible Journal columns/defaults',
  );
  const primary = await sql<
    { valid: boolean }[]
  >`SELECT count(*)=1 AND bool_and(contype='p' AND conkey=ARRAY[1]::smallint[]) AS valid
    FROM pg_constraint WHERE conrelid='drizzle.__drizzle_migrations'::regclass`;
  requireInstallation(primary[0]!.valid, 'Journal primary key');
  const sequence = await sql<{ valid: boolean }[]>`SELECT
    pg_get_serial_sequence('drizzle.__drizzle_migrations','id')='drizzle.__drizzle_migrations_id_seq'
    AND pg_get_userbyid(c.relowner)='pci_ops_journal_owner'
    AND s.seqtypid='integer'::regtype AND s.seqincrement=1 AND s.seqmin=1
    AND s.seqstart=1 AND s.seqmax=2147483647 AND s.seqcache=1 AND NOT s.seqcycle AS valid
    FROM pg_class c JOIN pg_sequence s ON s.seqrelid=c.oid
    WHERE c.oid=to_regclass('drizzle.__drizzle_migrations_id_seq')`;
  requireInstallation(
    sequence.length === 1 && sequence[0]!.valid,
    'Journal serial sequence ownership/dependency',
  );
  const acl = await sql<
    { source: string; grantee: string; privilege_type: string; is_grantable: boolean }[]
  >`
    SELECT 'schema' AS source, coalesce(r.rolname,'PUBLIC') AS grantee, x.privilege_type, x.is_grantable
    FROM pg_namespace n CROSS JOIN LATERAL aclexplode(coalesce(n.nspacl,acldefault('n',n.nspowner))) x
    LEFT JOIN pg_roles r ON r.oid=x.grantee WHERE n.nspname='drizzle'
    UNION ALL
    SELECT c.relkind::text, coalesce(r.rolname,'PUBLIC'), x.privilege_type, x.is_grantable
    FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    CROSS JOIN LATERAL aclexplode(coalesce(c.relacl,acldefault(CASE WHEN c.relkind='S' THEN 'S'::"char" ELSE 'r'::"char" END,c.relowner))) x
    LEFT JOIN pg_roles r ON r.oid=x.grantee
    WHERE n.nspname='drizzle' AND c.relname IN ('__drizzle_migrations','__drizzle_migrations_id_seq')`;
  const grants = acl.filter((r) => r.grantee !== installationRoles.journal);
  const actual = grants
    .map((r) => `${r.source}:${r.grantee}:${r.privilege_type}:${r.is_grantable}`)
    .sort();
  const expected = [
    'schema:pci_ops_migration:USAGE:false',
    'r:pci_ops_migration:SELECT:false',
    'r:pci_ops_migration:INSERT:false',
    'S:pci_ops_migration:USAGE:false',
  ].sort();
  requireInstallation(
    JSON.stringify(actual) === JSON.stringify(expected),
    'exact Journal ACL; no implicit PUBLIC grants',
  );
  const privileges = await sql<{ valid: boolean }[]>`SELECT
    has_schema_privilege('pci_ops_migration','drizzle','USAGE') AND
    NOT has_schema_privilege('pci_ops_migration','drizzle','CREATE') AND
    has_table_privilege('pci_ops_migration','drizzle.__drizzle_migrations','SELECT, INSERT') AND
    NOT has_table_privilege('pci_ops_migration','drizzle.__drizzle_migrations','UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER') AND
    has_sequence_privilege('pci_ops_migration','drizzle.__drizzle_migrations_id_seq','USAGE') AND
    NOT has_sequence_privilege('pci_ops_migration','drizzle.__drizzle_migrations_id_seq','SELECT, UPDATE') AND
    NOT has_database_privilege('pci_ops_migration',current_database(),'CREATE') AND
    NOT EXISTS(SELECT 1 FROM pg_attribute WHERE attrelid='drizzle.__drizzle_migrations'::regclass AND attacl IS NOT NULL)
    AS valid`;
  requireInstallation(privileges[0]!.valid, 'effective Journal privileges');
  const invalid = await sql<{ invalid: boolean }[]>`SELECT EXISTS(
    SELECT 1 FROM drizzle.__drizzle_migrations WHERE hash !~ '^[0-9a-f]{64}$' OR created_at IS NULL OR created_at<0
    UNION ALL SELECT 1 FROM drizzle.__drizzle_migrations GROUP BY created_at HAVING count(*)>1
    UNION ALL SELECT 1 FROM drizzle.__drizzle_migrations GROUP BY hash HAVING count(*)>1
  ) AS invalid`;
  requireInstallation(!invalid[0]!.invalid, 'Journal history is identifiable and unique');
  const history = await sql<
    { hash: string; created_at: string }[]
  >`SELECT hash, created_at FROM drizzle.__drizzle_migrations ORDER BY id`;
  requireInstallation(
    history.every(
      (r, i) =>
        approvedHashes.includes(r.hash) &&
        (i === 0 || Number(r.created_at) > Number(history[i - 1]!.created_at)),
    ),
    'unknown or unordered Journal history',
  );
  const unexpectedOwner = await sql<{ invalid: boolean }[]>`SELECT
    EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
      WHERE c.relowner=(SELECT oid FROM pg_roles WHERE rolname='pci_ops_journal_owner')
        AND (n.nspname NOT IN ('drizzle','pg_toast') OR
          (n.nspname='drizzle' AND c.relname NOT IN ('__drizzle_migrations','__drizzle_migrations_id_seq','__drizzle_migrations_pkey')))) OR
    EXISTS(SELECT 1 FROM pg_namespace WHERE nspowner=(SELECT oid FROM pg_roles WHERE rolname='pci_ops_journal_owner') AND nspname<>'drizzle') OR
    EXISTS(SELECT 1 FROM pg_database WHERE datdba=(SELECT oid FROM pg_roles WHERE rolname='pci_ops_journal_owner')) OR
    EXISTS(SELECT 1 FROM pg_proc WHERE proowner=(SELECT oid FROM pg_roles WHERE rolname='pci_ops_journal_owner')) AS invalid`;
  requireInstallation(
    !unexpectedOwner[0]!.invalid,
    'Journal Owner owns no business/database/function objects',
  );
}
