import type { Sql } from 'postgres';

export const operationsRoleNames = {
  tableOwner: 'pci_ops_table_owner',
  functionOwner: 'pci_ops_function_owner',
  migration: 'pci_ops_migration',
  runtime: 'pci_ops_runtime',
  auditReader: 'pci_ops_audit_reader',
} as const;

export type OperationsRoleName = (typeof operationsRoleNames)[keyof typeof operationsRoleNames];

const ownerRoleOptions =
  'NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOREPLICATION NOBYPASSRLS NOLOGIN';

const quoteLiteral = (value: string): string => `'${value.replaceAll("'", "''")}'`;

export async function initializeOperationsRoleFixture(
  admin: Sql,
  passwords: Readonly<{ migration: string; runtime: string }>,
): Promise<void> {
  await admin`CREATE ROLE ${admin.unsafe(operationsRoleNames.tableOwner)} ${admin.unsafe(ownerRoleOptions)}`;
  await admin`CREATE ROLE ${admin.unsafe(operationsRoleNames.functionOwner)} ${admin.unsafe(ownerRoleOptions)}`;
  await admin`CREATE ROLE ${admin.unsafe(operationsRoleNames.auditReader)} ${admin.unsafe(ownerRoleOptions)}`;
  await admin.unsafe(
    `CREATE ROLE ${operationsRoleNames.migration} LOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS PASSWORD ${quoteLiteral(passwords.migration)}`,
  );
  await admin.unsafe(
    `CREATE ROLE ${operationsRoleNames.runtime} LOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS PASSWORD ${quoteLiteral(passwords.runtime)}`,
  );

  await admin.unsafe(
    `GRANT ${operationsRoleNames.tableOwner} TO ${operationsRoleNames.migration} WITH INHERIT FALSE, SET TRUE`,
  );
  await admin.unsafe(
    `GRANT ${operationsRoleNames.functionOwner} TO ${operationsRoleNames.migration} WITH INHERIT FALSE, SET TRUE`,
  );

  await admin.unsafe('CREATE SCHEMA business_fixture');
  await admin.unsafe(`ALTER SCHEMA business_fixture OWNER TO ${operationsRoleNames.tableOwner}`);
  await admin.unsafe('CREATE SCHEMA operations_api');
  await admin.unsafe(`ALTER SCHEMA operations_api OWNER TO ${operationsRoleNames.functionOwner}`);
  await admin.unsafe('CREATE SCHEMA operations_private');
  await admin.unsafe(
    `ALTER SCHEMA operations_private OWNER TO ${operationsRoleNames.functionOwner}`,
  );
  await admin.unsafe(
    `ALTER ROLE ${operationsRoleNames.functionOwner} SET search_path = pg_catalog, pg_temp`,
  );

  await admin.unsafe('REVOKE ALL ON SCHEMA business_fixture FROM PUBLIC');
  await admin.unsafe('REVOKE ALL ON SCHEMA operations_api FROM PUBLIC');
  await admin.unsafe('REVOKE ALL ON SCHEMA operations_private FROM PUBLIC');
  await admin.unsafe(
    `GRANT USAGE ON SCHEMA business_fixture TO ${operationsRoleNames.functionOwner}`,
  );
  await admin.unsafe(`GRANT USAGE ON SCHEMA operations_api TO ${operationsRoleNames.runtime}`);
  await admin.unsafe(
    `ALTER DEFAULT PRIVILEGES FOR ROLE ${operationsRoleNames.functionOwner} IN SCHEMA operations_api REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC`,
  );
  await admin.unsafe(
    `ALTER DEFAULT PRIVILEGES FOR ROLE ${operationsRoleNames.functionOwner} IN SCHEMA operations_private REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC`,
  );
}

export async function createTableOwnerFixtures(migration: Sql): Promise<void> {
  await migration.unsafe(`SET ROLE ${operationsRoleNames.tableOwner}`);
  await migration.unsafe(`
    CREATE TABLE business_fixture.principals (
      id integer PRIMARY KEY,
      status text NOT NULL,
      security_epoch integer NOT NULL DEFAULT 0
    )
  `);
  await migration.unsafe(`
    CREATE TABLE business_fixture.accounts (
      id integer PRIMARY KEY,
      principal_id integer NOT NULL REFERENCES business_fixture.principals(id),
      status text NOT NULL
    )
  `);
  await migration.unsafe(`
    CREATE TABLE business_fixture.activation_history (
      id integer PRIMARY KEY,
      entity_kind text NOT NULL,
      status text NOT NULL
    )
  `);
  await migration.unsafe(`
    CREATE TABLE business_fixture.lifecycle_audit (
      id integer PRIMARY KEY,
      event_name text NOT NULL
    )
  `);
  await migration.unsafe(`
    CREATE TABLE business_fixture.function_dml_fixture (
      id integer PRIMARY KEY,
      value text NOT NULL
    )
  `);
  await migration.unsafe(`
    CREATE OR REPLACE FUNCTION business_fixture.fixture_trigger()
    RETURNS trigger
    LANGUAGE plpgsql
    AS $$ BEGIN RETURN NEW; END $$
  `);
  await migration.unsafe(`
    CREATE TRIGGER principals_fixture_trigger
    BEFORE UPDATE ON business_fixture.principals
    FOR EACH ROW EXECUTE FUNCTION business_fixture.fixture_trigger()
  `);
  await migration.unsafe('RESET ROLE');
}

export async function createFunctionOwnerFixture(migration: Sql): Promise<void> {
  await migration.unsafe(`SET ROLE ${operationsRoleNames.functionOwner}`);
  await migration.unsafe(`
    CREATE FUNCTION operations_api.fixture_function()
    RETURNS integer
    LANGUAGE sql
    SECURITY DEFINER
    SET search_path = pg_catalog, pg_temp
    AS 'SELECT 42'
  `);
  await migration.unsafe(`
    CREATE FUNCTION operations_private.private_fixture_function()
    RETURNS integer
    LANGUAGE sql
    SECURITY DEFINER
    SET search_path = pg_catalog, pg_temp
    AS 'SELECT 7'
  `);
  await migration.unsafe('RESET ROLE');
}

export async function grantFunctionOwnerFixtureAccess(admin: Sql): Promise<void> {
  await admin.unsafe(
    `GRANT SELECT ON business_fixture.function_dml_fixture TO ${operationsRoleNames.functionOwner}`,
  );
  await admin.unsafe('REVOKE EXECUTE ON FUNCTION operations_api.fixture_function() FROM PUBLIC');
  await admin.unsafe(
    'REVOKE EXECUTE ON FUNCTION operations_private.private_fixture_function() FROM PUBLIC',
  );
}

export async function collectRoleSummary(admin: Sql): Promise<readonly Record<string, unknown>[]> {
  return admin<readonly Record<string, unknown>[]>`
    SELECT
      rolname,
      rolcanlogin,
      rolsuper,
      rolcreatedb,
      rolcreaterole,
      rolinherit,
      rolreplication,
      rolbypassrls,
      COALESCE(rolconfig, ARRAY[]::text[]) AS rolconfig
    FROM pg_catalog.pg_roles
    WHERE rolname IN (
      ${operationsRoleNames.tableOwner},
      ${operationsRoleNames.functionOwner},
      ${operationsRoleNames.migration},
      ${operationsRoleNames.runtime},
      ${operationsRoleNames.auditReader}
    )
    ORDER BY rolname
  `;
}

export async function inspectPublicSchemaPrivileges(
  admin: Sql,
): Promise<readonly Record<string, unknown>[]> {
  return admin<readonly Record<string, unknown>[]>`
    SELECT nspname,
      has_schema_privilege('public', oid, 'USAGE') AS public_usage,
      has_schema_privilege('public', oid, 'CREATE') AS public_create
    FROM pg_catalog.pg_namespace
    WHERE nspname = 'public'
    ORDER BY nspname
  `;
}

export async function collectMembershipSummary(
  admin: Sql,
): Promise<readonly Record<string, unknown>[]> {
  return admin<readonly Record<string, unknown>[]>`
    SELECT
      member.rolname AS member,
      granted.rolname AS granted_role,
      membership.inherit_option,
      membership.set_option
    FROM pg_catalog.pg_auth_members AS membership
    JOIN pg_catalog.pg_roles AS member ON member.oid = membership.member
    JOIN pg_catalog.pg_roles AS granted ON granted.oid = membership.roleid
    WHERE member.rolname IN (${operationsRoleNames.migration}, ${operationsRoleNames.runtime})
    ORDER BY member.rolname, granted.rolname
  `;
}
