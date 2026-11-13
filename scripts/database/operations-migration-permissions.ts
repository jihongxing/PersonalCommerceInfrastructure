import type { Sql, TransactionSql } from 'postgres';

export type InstallationSql = Sql | TransactionSql;
export const installationRoles = {
  bootstrap: 'pci_ops_bootstrap',
  journal: 'pci_ops_journal_owner',
  migration: 'pci_ops_migration',
  table: 'pci_ops_table_owner',
  function: 'pci_ops_function_owner',
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
