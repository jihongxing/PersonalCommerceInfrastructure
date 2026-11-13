import { execFile } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { promisify } from 'node:util';
import { randomBytes } from 'node:crypto';

import postgres, { type Sql } from 'postgres';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  collectMembershipSummary,
  collectRoleSummary,
  createFunctionOwnerFixture,
  createTableOwnerFixtures,
  grantFunctionOwnerFixtureAccess,
  inspectPublicSchemaPrivileges,
  initializeOperationsRoleFixture,
  operationsRoleNames,
} from '../../scripts/database/operations-role-permission-verifier.js';

const execFileAsync = promisify(execFile);
const runIsolatedTests = process.env.PCI_RUN_ISOLATED_ROLE_TESTS === '1';
const describeWithContainer = runIsolatedTests ? describe : describe.skip;
const image = process.env.PCI_OPERATIONS_ROLE_IMAGE ?? 'docker.io/library/postgres:17-alpine';

type CaseEvidence = {
  readonly name: string;
  readonly sql: string;
  readonly sqlState: string;
  readonly outcome: 'PASS' | 'FAIL';
};

const quotePassword = (value: string): string => encodeURIComponent(value);

describeWithContainer('isolated Operations PostgreSQL role permissions', () => {
  let containerName = '';
  let admin: Sql | undefined;
  let migration: Sql | undefined;
  let runtime: Sql | undefined;
  let migrationPassword = '';
  let runtimePassword = '';
  let databaseUrl = '';
  let hostPort = '';
  let containerId = '';
  let imageDigest = '';
  let serverVersion = '';
  let podmanVersion = '';
  let podmanServerVersion = '';
  let roleSummary: readonly Record<string, unknown>[] = [];
  let membershipSummary: readonly Record<string, unknown>[] = [];
  let publicSchemaBefore: readonly Record<string, unknown>[] = [];
  let schemaSummary: readonly Record<string, unknown>[] = [];
  let functionAcl: readonly Record<string, unknown>[] = [];
  const evidence: CaseEvidence[] = [];

  const command = async (
    args: readonly string[],
    envOverrides?: Readonly<Record<string, string>>,
  ): Promise<string> => {
    const result = await execFileAsync('podman', [...args], {
      windowsHide: true,
      maxBuffer: 2_000_000,
      env: envOverrides === undefined ? process.env : { ...process.env, ...envOverrides },
    });
    return result.stdout.trim();
  };

  const roleUrl = (role: string, password: string): string =>
    `postgres://${role}:${quotePassword(password)}@127.0.0.1:${hostPort}/pci_ops_roles`;

  const expectDenied = async (
    client: Sql,
    name: string,
    statement: string,
    expectedCode = '42501',
  ): Promise<void> => {
    let actualCode = 'NO_ERROR';
    try {
      await client.unsafe(statement);
    } catch (error) {
      actualCode =
        typeof error === 'object' && error !== null && 'code' in error
          ? String((error as { code?: unknown }).code)
          : 'UNKNOWN_ERROR';
    }
    evidence.push({
      name,
      sql: statement,
      sqlState: actualCode,
      outcome: actualCode === expectedCode ? 'PASS' : 'FAIL',
    });
    expect(actualCode, `${name} SQLSTATE`).toBe(expectedCode);
  };

  beforeAll(async () => {
    const suffix = randomBytes(6).toString('hex');
    containerName = `pci-ops-role-${suffix}`;
    const adminPassword = randomBytes(24).toString('base64url');
    migrationPassword = randomBytes(24).toString('base64url');
    runtimePassword = randomBytes(24).toString('base64url');

    const podmanVersionJson = await command(['version', '--format', 'json']);
    const podmanVersionInfo = JSON.parse(podmanVersionJson) as {
      readonly Client?: { readonly Version?: string };
      readonly Server?: { readonly Version?: string };
    };
    podmanVersion = podmanVersionInfo.Client?.Version ?? 'UNKNOWN';
    podmanServerVersion = podmanVersionInfo.Server?.Version ?? 'UNKNOWN';
    imageDigest = await command(['image', 'inspect', image, '--format', '{{.Digest}}']);

    containerId = await command(
      [
        'run',
        '--rm',
        '--detach',
        '--name',
        containerName,
        '--label',
        'pci.task=PCI-ENG-017-C3-1P',
        '--publish',
        '127.0.0.1::5432',
        '--tmpfs',
        '/var/lib/postgresql/data:rw,size=1073741824',
        '--env',
        'POSTGRES_USER=postgres',
        '--env',
        'POSTGRES_DB=pci_ops_roles',
        '--env',
        'POSTGRES_PASSWORD',
        image,
      ],
      { POSTGRES_PASSWORD: adminPassword },
    );

    let port = '';
    for (let attempt = 0; attempt < 60; attempt += 1) {
      try {
        port = (await command(['port', containerName, '5432/tcp'])).split(':').pop() ?? '';
        const probe = postgres(
          `postgres://postgres:${quotePassword(adminPassword)}@127.0.0.1:${port}/pci_ops_roles`,
          { max: 1, prepare: false },
        );
        await probe`SELECT 1`;
        await probe.end({ timeout: 5 });
        break;
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }
    expect(port).toMatch(/^\d+$/);
    hostPort = port;
    databaseUrl = `postgres://postgres:${quotePassword(adminPassword)}@127.0.0.1:${port}/pci_ops_roles`;
    admin = postgres(databaseUrl, { max: 1, prepare: false });
    const versionRows = await admin<{ readonly serverVersion: string }[]>`
      SELECT current_setting('server_version') AS "serverVersion"
    `;
    serverVersion = versionRows[0]?.serverVersion ?? 'UNKNOWN';
    publicSchemaBefore = await inspectPublicSchemaPrivileges(admin);
    await initializeOperationsRoleFixture(admin, {
      migration: migrationPassword,
      runtime: runtimePassword,
    });
    migration = postgres(roleUrl(operationsRoleNames.migration, migrationPassword), {
      max: 1,
      prepare: false,
    });
    runtime = postgres(roleUrl(operationsRoleNames.runtime, runtimePassword), {
      max: 1,
      prepare: false,
    });
    await createTableOwnerFixtures(migration);
    await createFunctionOwnerFixture(migration);
    await grantFunctionOwnerFixtureAccess(admin);
  }, 120_000);

  afterAll(async () => {
    if (migration !== undefined) await migration.end({ timeout: 5 });
    if (runtime !== undefined) await runtime.end({ timeout: 5 });
    if (admin !== undefined) await admin.end({ timeout: 5 });
    let cleanupResult = 'NOT_ATTEMPTED';
    if (containerName !== '') {
      await execFileAsync('podman', ['rm', '--force', containerName], { windowsHide: true })
        .then(() => {
          cleanupResult = 'PASS';
        })
        .catch(() => {
          cleanupResult = 'ALREADY_REMOVED_OR_FAILED';
        });
    }
    // Sanitized case evidence is printed for the governance execution ledger.
    for (const item of evidence) console.log(`ROLE_PERMISSION_CASE ${JSON.stringify(item)}`);
    const evidencePath = process.env.PCI_ROLE_EVIDENCE_PATH;
    if (evidencePath !== undefined) {
      await mkdir(dirname(evidencePath), { recursive: true });
      await writeFile(
        evidencePath,
        JSON.stringify(
          {
            task: 'PCI-ENG-017-C3-1P',
            image,
            imageDigest,
            containerId,
            containerName,
            database: 'pci_ops_roles',
            bindAddress: '127.0.0.1',
            dynamicPort: hostPort,
            storageMode: 'tmpfs /var/lib/postgresql/data (1 GiB), no volume',
            serverVersion,
            podmanClientVersion: podmanVersion,
            podmanServerVersion,
            independentConnections: [operationsRoleNames.migration, operationsRoleNames.runtime],
            roleSummary,
            membershipSummary,
            publicSchemaBefore,
            schemaSummary,
            functionAcl,
            migrationCommands: ['none — fixture-only role test; no repository migration executed'],
            testCommand:
              'PCI_RUN_ISOLATED_ROLE_TESTS=1 node node_modules/vitest/vitest.mjs run tests/integration/operations-role-permissions-postgres.integration.test.ts',
            evidence,
            cleanup: { command: `podman rm --force ${containerName}`, result: cleanupResult },
          },
          null,
          2,
        ),
        'utf8',
      );
    }
  }, 120_000);

  it('verifies role attributes, memberships, owners and default privileges', async () => {
    const [roles, memberships, schemas, functions] = await Promise.all([
      collectRoleSummary(admin!),
      collectMembershipSummary(admin!),
      admin!`
        SELECT nspname, pg_get_userbyid(nspowner) AS owner, has_schema_privilege(${operationsRoleNames.runtime}, oid, 'USAGE') AS runtime_usage, has_schema_privilege(${operationsRoleNames.runtime}, oid, 'CREATE') AS runtime_create
        FROM pg_catalog.pg_namespace WHERE nspname IN ('operations_api', 'operations_private', 'business_fixture') ORDER BY nspname
      `,
      admin!`
        SELECT n.nspname, p.proname, has_function_privilege(${operationsRoleNames.runtime}, p.oid, 'EXECUTE') AS runtime_execute,
               coalesce(p.proacl::text, '') AS acl,
               coalesce(p.proconfig::text, '') AS config
        FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname IN ('operations_api', 'operations_private') ORDER BY n.nspname, p.proname
      `,
    ]);
    roleSummary = roles;
    membershipSummary = memberships;
    schemaSummary = schemas;
    functionAcl = functions;
    expect(roles).toHaveLength(5);
    expect(roles).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          rolname: operationsRoleNames.tableOwner,
          rolcanlogin: false,
          rolsuper: false,
          rolcreatedb: false,
          rolcreaterole: false,
          rolinherit: false,
          rolreplication: false,
          rolbypassrls: false,
        }),
        expect.objectContaining({
          rolname: operationsRoleNames.functionOwner,
          rolcanlogin: false,
          rolsuper: false,
          rolcreatedb: false,
          rolcreaterole: false,
          rolinherit: false,
          rolreplication: false,
          rolbypassrls: false,
        }),
        expect.objectContaining({
          rolname: operationsRoleNames.migration,
          rolcanlogin: true,
          rolsuper: false,
          rolcreatedb: false,
          rolcreaterole: false,
          rolinherit: false,
          rolreplication: false,
          rolbypassrls: false,
        }),
        expect.objectContaining({
          rolname: operationsRoleNames.runtime,
          rolcanlogin: true,
          rolsuper: false,
          rolcreatedb: false,
          rolcreaterole: false,
          rolinherit: false,
          rolreplication: false,
          rolbypassrls: false,
        }),
      ]),
    );
    expect(memberships).toEqual([
      {
        member: operationsRoleNames.migration,
        granted_role: operationsRoleNames.functionOwner,
        inherit_option: false,
        set_option: true,
      },
      {
        member: operationsRoleNames.migration,
        granted_role: operationsRoleNames.tableOwner,
        inherit_option: false,
        set_option: true,
      },
    ]);
    expect(schemas).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          nspname: 'operations_api',
          owner: operationsRoleNames.functionOwner,
          runtime_usage: true,
          runtime_create: false,
        }),
        expect.objectContaining({
          nspname: 'operations_private',
          owner: operationsRoleNames.functionOwner,
          runtime_usage: false,
          runtime_create: false,
        }),
      ]),
    );
    expect(functionAcl).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          nspname: 'operations_api',
          proname: 'fixture_function',
          runtime_execute: false,
          config: '{"search_path=pg_catalog, pg_temp"}',
        }),
        expect.objectContaining({
          nspname: 'operations_private',
          proname: 'private_fixture_function',
          runtime_execute: false,
          config: '{"search_path=pg_catalog, pg_temp"}',
        }),
      ]),
    );
    expect(await migration!`SELECT current_user`).toEqual([
      { current_user: operationsRoleNames.migration },
    ]);
  });

  it('proves Migration explicit SET ROLE and bounded owner capabilities', async () => {
    await expect(migration!`SELECT * FROM business_fixture.principals`).rejects.toMatchObject({
      code: '42501',
    });
    await migration!.unsafe(`SET ROLE ${operationsRoleNames.tableOwner}`);
    await migration!.unsafe(
      'CREATE TABLE business_fixture.migration_owned (id integer PRIMARY KEY)',
    );
    await migration!.unsafe('RESET ROLE');
    expect(await migration!`SELECT current_user`).toEqual([
      { current_user: operationsRoleNames.migration },
    ]);
    await migration!.unsafe(`SET ROLE ${operationsRoleNames.functionOwner}`);
    await migration!.unsafe('SELECT * FROM business_fixture.function_dml_fixture');
    await migration!.unsafe('RESET ROLE');
    await expectDenied(
      migration!,
      'Migration SET ROLE runtime',
      `SET ROLE ${operationsRoleNames.runtime}`,
    );
    await expectDenied(migration!, 'Migration SET ROLE postgres', 'SET ROLE postgres');
    await expectDenied(migration!, 'Migration CREATE ROLE', 'CREATE ROLE pci_ops_forbidden');
    await expectDenied(
      migration!,
      'Migration CREATE DATABASE',
      'CREATE DATABASE pci_ops_forbidden',
    );
  });

  it('proves Runtime independent connection denial and search_path isolation', async () => {
    const denied: readonly [string, string][] = [
      ['Runtime SELECT principals', 'SELECT * FROM business_fixture.principals'],
      ['Runtime SELECT accounts', 'SELECT * FROM business_fixture.accounts'],
      [
        'Runtime INSERT principal',
        "INSERT INTO business_fixture.principals (id, status) VALUES (1, 'pending')",
      ],
      [
        'Runtime INSERT account',
        "INSERT INTO business_fixture.accounts (id, principal_id, status) VALUES (1, 1, 'invited')",
      ],
      [
        'Runtime UPDATE principal status',
        "UPDATE business_fixture.principals SET status = 'active'",
      ],
      ['Runtime UPDATE account status', "UPDATE business_fixture.accounts SET status = 'active'"],
      [
        'Runtime UPDATE security epoch',
        'UPDATE business_fixture.principals SET security_epoch = security_epoch + 1',
      ],
      [
        'Runtime INSERT activation history',
        "INSERT INTO business_fixture.activation_history (id, entity_kind, status) VALUES (1, 'principal', 'active')",
      ],
      [
        'Runtime UPDATE activation history',
        "UPDATE business_fixture.activation_history SET status = 'disabled'",
      ],
      ['Runtime DELETE activation history', 'DELETE FROM business_fixture.activation_history'],
      ['Runtime UPDATE audit', "UPDATE business_fixture.lifecycle_audit SET event_name = 'x'"],
      ['Runtime DELETE audit', 'DELETE FROM business_fixture.lifecycle_audit'],
      ['Runtime TRUNCATE principals', 'TRUNCATE business_fixture.principals'],
      [
        'Runtime DISABLE TRIGGER',
        'ALTER TABLE business_fixture.principals DISABLE TRIGGER principals_fixture_trigger',
      ],
      ['Runtime ALTER TABLE', 'ALTER TABLE business_fixture.principals ADD COLUMN forbidden text'],
      [
        'Runtime CREATE FUNCTION',
        "CREATE FUNCTION operations_api.runtime_function() RETURNS integer LANGUAGE sql AS 'SELECT 1'",
      ],
      [
        'Runtime REPLACE FUNCTION',
        "CREATE OR REPLACE FUNCTION operations_api.fixture_function() RETURNS integer LANGUAGE sql AS 'SELECT 1'",
      ],
      ['Runtime CREATE SCHEMA', 'CREATE SCHEMA runtime_forbidden'],
      ['Runtime GRANT', 'GRANT SELECT ON business_fixture.principals TO pci_ops_runtime'],
      ['Runtime REVOKE', 'REVOKE SELECT ON business_fixture.principals FROM PUBLIC'],
      ['Runtime SET ROLE table owner', `SET ROLE ${operationsRoleNames.tableOwner}`],
      ['Runtime SET ROLE function owner', `SET ROLE ${operationsRoleNames.functionOwner}`],
      ['Runtime SET ROLE migration', `SET ROLE ${operationsRoleNames.migration}`],
    ];
    for (const [name, statement] of denied) await expectDenied(runtime!, name, statement);
    await runtime!.unsafe(
      'SET search_path TO operations_api, business_fixture, pg_catalog, pg_temp',
    );
    await expectDenied(
      runtime!,
      'Runtime shadow schema object',
      'CREATE TABLE operations_api.runtime_shadow (id integer)',
    );
    await runtime!.unsafe('CREATE TEMP TABLE shadow_probe (id integer)');
    await expectDenied(
      runtime!,
      'Runtime execute non-whitelisted function',
      'SELECT operations_api.fixture_function()',
    );
    await expectDenied(
      runtime!,
      'Runtime private schema access',
      'SELECT operations_private.private_fixture_function()',
    );
    expect(await runtime!`SELECT session_user, current_user`).toEqual([
      { session_user: operationsRoleNames.runtime, current_user: operationsRoleNames.runtime },
    ]);
  });

  it('confirms Function Owner has only explicit fixture DML and no table ownership', async () => {
    await migration!.unsafe(`SET ROLE ${operationsRoleNames.functionOwner}`);
    await expect(
      migration!`SELECT * FROM business_fixture.function_dml_fixture`,
    ).resolves.toHaveLength(0);
    await expect(migration!`SELECT * FROM business_fixture.principals`).rejects.toMatchObject({
      code: '42501',
    });
    await migration!.unsafe('RESET ROLE');
  });
});
