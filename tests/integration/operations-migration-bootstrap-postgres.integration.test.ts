import { execFile } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { createServer, connect, type Socket } from 'node:net';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { promisify } from 'node:util';

import postgres, { type Sql, type TransactionSql } from 'postgres';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { bootstrapMigrationPrerequisites } from '../../scripts/database/bootstrap-migration-prerequisites.js';
import {
  ControlledMigrationFailure,
  installationFixtureSources,
  migrateWithRoleContext,
  type MigrationEvidence,
} from '../../scripts/database/migrate-with-role-context.js';
import {
  installationIdentity,
  journalProvisioningCleanupSql,
  journalProvisioningSql,
  requireInstallationIdentity,
  verifyJournal,
} from '../../scripts/database/operations-migration-permissions.js';
import { approvedInstallationHashes } from '../../scripts/database/migrate-with-role-context.js';
import { initializeOperationsRoleFixture } from '../../scripts/database/operations-role-permission-verifier.js';

const exec = promisify(execFile);
const describePostgres =
  process.env.PCI_RUN_MIGRATION_BOOTSTRAP_TESTS === '1' ? describe : describe.skip;
const image = 'docker.io/library/postgres:17-alpine';
const legacyTags = [
  '0036_operations_principal_persistence',
  '0037_operations_credential_persistence',
  '0038_operations_session_persistence',
  '0039_operations_identity_terminal_state_protection',
];
const passwords = {
  postgres: randomBytes(24).toString('base64url'),
  pci_ops_migration: randomBytes(24).toString('base64url'),
  pci_ops_runtime: randomBytes(24).toString('base64url'),
  pci_ops_bootstrap: randomBytes(24).toString('base64url'),
};
type Login = keyof typeof passwords;
type Fixture = {
  name: string;
  admin: Sql;
  bootstrap: Sql;
  migration: Sql;
  runtime: Sql;
  url: string;
};

describePostgres('controlled disposable migration Bootstrap and role wrapper', () => {
  let container = '';
  let port = '';
  let folder = '';
  let legacyFolder = '';
  let fullFolder = '';
  let admin: Sql;
  const clients: Sql[] = [];
  const metadata: Record<string, unknown> = {};
  const sqlRecords: Record<string, unknown>[] = [];
  const wrapperRecords: MigrationEvidence[] = [];
  const fixtures: Fixture[] = [];
  const failureRecords: unknown[] = [];
  let sequence = 0;

  const podman = async (args: string[], overrides?: Record<string, string>) => {
    const result = await exec('podman', args, {
      windowsHide: true,
      maxBuffer: 4_000_000,
      env: overrides ? { ...process.env, ...overrides } : process.env,
    });
    return result.stdout.trim();
  };
  const url = (name: string, role: Login, targetPort = port) =>
    `postgres://${role}:${encodeURIComponent(passwords[role])}@127.0.0.1:${targetPort}/${name}`;
  const connection = (name: string, role: Login): Sql => {
    const sql = postgres(url(name, role), {
      max: 1,
      prepare: false,
      connect_timeout: 3,
      onnotice: () => {},
    });
    clients.push(sql);
    return sql;
  };
  const code = (error: unknown): string =>
    typeof error === 'object' && error !== null && 'code' in error
      ? String(error.code)
      : 'CLIENT_ERROR';
  async function query(sql: Sql | TransactionSql, statement: string, expected = '00000') {
    const identity = await installationIdentity(sql);
    let actual = '00000';
    let rows: unknown;
    try {
      rows = await sql.unsafe(statement);
    } catch (error) {
      actual = code(error);
    }
    sqlRecords.push({ ...identity, statement, sqlstate: actual });
    expect(actual, statement).toBe(expected);
    return rows;
  }
  async function owner(
    db: Fixture,
    role:
      | 'pci_ops_table_owner'
      | 'pci_ops_function_owner'
      | 'pci_ops_legacy_owner'
      | 'pci_ops_journal_owner',
    action: (tx: TransactionSql) => Promise<unknown>,
  ) {
    const sql = role === 'pci_ops_journal_owner' ? db.bootstrap : db.migration;
    return sql.begin(async (tx) => {
      await tx.unsafe(`SET LOCAL ROLE ${role}`);
      return action(tx);
    });
  }
  async function createFolder(name: string, source?: string, withLegacy = true) {
    const destination = join(folder, name);
    await mkdir(join(destination, 'meta'), { recursive: true });
    const entries: {
      idx: number;
      version: string;
      when: number;
      tag: string;
      breakpoints: boolean;
    }[] = [];
    if (withLegacy)
      for (let i = 0; i < legacyTags.length; i++) {
        const tag = legacyTags[i]!;
        await writeFile(
          join(destination, `${tag}.sql`),
          await readFile(resolve('database/migrations', `${tag}.sql`)),
        );
        entries.push({ idx: i, version: '7', when: 36_000 + i * 1000, tag, breakpoints: true });
      }
    if (source !== undefined) {
      const tag = 'installation_fixture';
      await writeFile(join(destination, `${tag}.sql`), source);
      entries.push({ idx: entries.length, version: '7', when: 100_000, tag, breakpoints: true });
    }
    await writeFile(
      join(destination, 'meta/_journal.json'),
      JSON.stringify({ version: '7', dialect: 'postgresql', entries }),
    );
    return destination;
  }
  async function fixture(options: { journal?: boolean; legacy?: boolean } = {}): Promise<Fixture> {
    const name = `pci_ops_migration_fixture_${++sequence}`;
    await admin.unsafe(`CREATE DATABASE ${name}`);
    const db = {
      name,
      admin: connection(name, 'postgres'),
      bootstrap: connection(name, 'pci_ops_bootstrap'),
      migration: connection(name, 'pci_ops_migration'),
      runtime: connection(name, 'pci_ops_runtime'),
      url: url(name, 'pci_ops_migration'),
    };
    fixtures.push(db);
    await db.admin.unsafe(
      'GRANT USAGE, CREATE ON SCHEMA public TO pci_ops_table_owner, pci_ops_legacy_owner',
    );
    await db.admin.unsafe('CREATE SCHEMA operations_api AUTHORIZATION pci_ops_function_owner');
    await db.admin.unsafe('CREATE SCHEMA operations_private AUTHORIZATION pci_ops_function_owner');
    await owner(db, 'pci_ops_function_owner', async (tx) => {
      await tx.unsafe('REVOKE ALL ON SCHEMA operations_api, operations_private FROM PUBLIC');
      await tx.unsafe('GRANT USAGE ON SCHEMA operations_api TO pci_ops_runtime');
      await tx.unsafe('GRANT USAGE ON SCHEMA operations_private TO pci_ops_table_owner');
      await tx.unsafe('ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC');
    });
    if (options.journal !== false) {
      await db.admin.unsafe(`GRANT CREATE ON DATABASE ${name} TO pci_ops_journal_owner`);
      await bootstrapMigrationPrerequisites(db.bootstrap);
      await db.admin.unsafe(`REVOKE CREATE ON DATABASE ${name} FROM pci_ops_journal_owner`);
    }
    if (options.legacy) {
      await admin.unsafe(
        'GRANT pci_ops_legacy_owner TO pci_ops_migration WITH INHERIT FALSE, SET TRUE',
      );
      await migrateWithRoleContext(db.url, legacyFolder, (e) => wrapperRecords.push(e));
      await owner(db, 'pci_ops_legacy_owner', async (tx) => {
        await tx.unsafe(
          'GRANT SELECT, REFERENCES, TRIGGER ON public.operations_human_principals, public.operations_accounts TO pci_ops_table_owner',
        );
        await tx.unsafe(
          'GRANT SELECT, INSERT ON public.operations_human_principals, public.operations_accounts TO pci_ops_function_owner',
        );
        await tx.unsafe(
          'GRANT UPDATE(status) ON public.operations_human_principals TO pci_ops_function_owner',
        );
        await tx.unsafe(
          "INSERT INTO public.operations_human_principals (principal_id,status) VALUES ('terminal','tombstoned'),('pending','pending')",
        );
        await tx.unsafe(
          "INSERT INTO public.operations_accounts (account_id,principal_id,login_identifier_normalized,status) VALUES ('terminal-account','terminal','fixture@example.test','revoked')",
        );
      });
      await admin.unsafe('REVOKE pci_ops_legacy_owner FROM pci_ops_migration');
    }
    return db;
  }
  async function runFailure(
    db: Fixture,
    path: string,
    expected: string,
    recorder?: (e: MigrationEvidence) => void,
  ) {
    let failure: unknown;
    try {
      await migrateWithRoleContext(db.url, path, (e) => {
        wrapperRecords.push(e);
        recorder?.(e);
      });
    } catch (error) {
      failure = error;
    }
    expect(failure).toBeInstanceOf(ControlledMigrationFailure);
    if (!(failure instanceof ControlledMigrationFailure))
      throw new Error('Missing controlled failure');
    expect(failure.sqlstate).toBe(expected);
    expect(failure.poolDestroyed).toBe(true);
    failureRecords.push({
      name: db.name,
      sqlstate: failure.sqlstate,
      outcome: failure.commitOutcome,
      roleVerified: failure.roleVerified,
    });
    return failure;
  }
  async function rollbackState(db: Fixture) {
    const rows = await db.admin<{ marker: string | null; child: string | null; count: number }[]>`
      SELECT to_regclass('public.pci_install_rollback')::text AS marker,
      to_regclass('public.pci_install_child')::text AS child,
      (SELECT count(*)::int FROM drizzle.__drizzle_migrations) AS count`;
    expect(rows[0]).toEqual({ marker: null, child: null, count: 0 });
    await requireInstallationIdentity(db.migration, 'pci_ops_migration');
  }

  beforeAll(async () => {
    metadata.startedAt = new Date().toISOString();
    folder = await mkdtemp(join(tmpdir(), 'pci-c21pr1-tests-'));
    metadata.folder = folder;
    metadata.podman = JSON.parse(await podman(['version', '--format', 'json'])) as unknown;
    metadata.digest = await podman(['image', 'inspect', image, '--format', '{{.Digest}}']);
    metadata.image = image;
    metadata.volumesBefore = (await podman(['volume', 'ls', '--format', '{{.Name}}']))
      .split('\n')
      .filter(Boolean)
      .sort();
    container = `pci-c21pr1-${randomBytes(6).toString('hex')}`;
    metadata.container = container;
    metadata.containerId = await podman(
      [
        'run',
        '--rm',
        '--detach',
        '--name',
        container,
        '--label',
        'pci.task=PCI-ENG-017-C2-1P-R1',
        '--image-volume=ignore',
        '--publish',
        '127.0.0.1::5432',
        '--tmpfs',
        '/var/lib/postgresql/data:rw,size=1073741824',
        '--env',
        'POSTGRES_DB=pci_ops_migration_fixture_control',
        '--env',
        'POSTGRES_PASSWORD',
        image,
      ],
      { POSTGRES_PASSWORD: passwords.postgres },
    );
    metadata.bind = await podman(['port', container, '5432/tcp']);
    port = String(metadata.bind).split(':').pop()!;
    admin = connection('pci_ops_migration_fixture_control', 'postgres');
    for (let i = 0; i < 60; i++) {
      try {
        await admin`SELECT 1`;
        break;
      } catch (error) {
        if (i === 59) throw error;
        await new Promise((r) => setTimeout(r, 500));
      }
    }
    metadata.server = await admin`SELECT version()`;
    await initializeOperationsRoleFixture(admin, {
      migration: passwords.pci_ops_migration,
      runtime: passwords.pci_ops_runtime,
    });
    await admin.unsafe(
      `CREATE ROLE pci_ops_bootstrap LOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS PASSWORD '${passwords.pci_ops_bootstrap}'`,
    );
    await admin.unsafe(
      'CREATE ROLE pci_ops_legacy_owner NOLOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS',
    );
    await admin.unsafe(journalProvisioningSql);
    legacyFolder = await createFolder('legacy');
    fullFolder = await createFolder('full', installationFixtureSources.foundation);
  }, 120_000);

  afterAll(async () => {
    try {
      if (admin) {
        metadata.roles =
          await admin`SELECT rolname,rolcanlogin,rolsuper,rolcreatedb,rolcreaterole,rolinherit,rolreplication,rolbypassrls FROM pg_roles WHERE rolname LIKE 'pci_ops_%' ORDER BY rolname`;
        metadata.memberships =
          await admin`SELECT member.rolname AS member,owner.rolname AS owner,m.inherit_option,m.set_option FROM pg_auth_members m JOIN pg_roles member ON member.oid=m.member JOIN pg_roles owner ON owner.oid=m.roleid WHERE member.rolname LIKE 'pci_ops_%' ORDER BY member.rolname,owner.rolname`;
      }
    } finally {
      await Promise.all(clients.map((c) => c.end({ timeout: 2 })));
      if (container) {
        metadata.cleanupCommand = `podman rm --force ${container}`;
        metadata.cleanupOutput = await podman(['rm', '--force', container]);
        metadata.cleanupExitCode = 0;
      }
      metadata.remainingContainers = JSON.parse(
        await podman([
          'ps',
          '-a',
          '--filter',
          'label=pci.task=PCI-ENG-017-C2-1P-R1',
          '--format',
          'json',
        ]),
      ) as unknown;
      const volumes = (await podman(['volume', 'ls', '--format', '{{.Name}}']))
        .split('\n')
        .filter(Boolean)
        .sort();
      metadata.volumesAfter = volumes;
      metadata.finishedAt = new Date().toISOString();
      const evidencePath = process.env.PCI_MIGRATION_EVIDENCE_PATH ?? join(folder, 'evidence.json');
      await mkdir(dirname(evidencePath), { recursive: true });
      await writeFile(
        evidencePath,
        JSON.stringify({ metadata, sqlRecords, wrapperRecords, failureRecords }, null, 2),
      );
      console.log(`Sanitized migration evidence: ${evidencePath}`);
    }
  }, 120_000);

  it('creates compatible Journal with independent Bootstrap, verifies repeat and exact ACL', async () => {
    const db = await fixture();
    await bootstrapMigrationPrerequisites(db.bootstrap);
    await verifyJournal(db.migration, approvedInstallationHashes);
    metadata.journalObjects =
      await db.admin`SELECT c.relname,c.relkind,pg_get_userbyid(c.relowner) AS owner,c.relacl::text AS acl
      FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='drizzle' ORDER BY c.relname`;
    metadata.journalSchema =
      await db.admin`SELECT nspname,pg_get_userbyid(nspowner) AS owner,nspacl::text AS acl FROM pg_namespace WHERE nspname='drizzle'`;
    const state = await query(
      db.migration,
      "SELECT has_database_privilege(current_user,current_database(),'CREATE') AS database_create, has_schema_privilege(current_user,'drizzle','CREATE') AS schema_create",
    );
    expect(state).toEqual([{ database_create: false, schema_create: false }]);
    await query(
      db.migration,
      "INSERT INTO drizzle.__drizzle_migrations(hash,created_at) VALUES ('" +
        approvedInstallationHashes[0]! +
        "',36000)",
    );
    for (const statement of [
      'UPDATE drizzle.__drizzle_migrations SET hash=hash',
      'DELETE FROM drizzle.__drizzle_migrations',
      'TRUNCATE drizzle.__drizzle_migrations',
      'CREATE TABLE drizzle.forbidden(id integer)',
      'SET ROLE pci_ops_journal_owner',
    ])
      await query(db.migration, statement, '42501');
  });

  it('fails closed for missing Journal and absent table without repairing them', async () => {
    const missing = await fixture({ journal: false });
    await runFailure(
      missing,
      await createFolder('missing', installationFixtureSources.simple, false),
      'CONTRACT_REJECTED',
    );
    await expect(bootstrapMigrationPrerequisites(missing.bootstrap)).rejects.toThrow(
      'temporary Journal Owner database CREATE',
    );
    const partial = await fixture({ journal: false });
    await partial.admin.unsafe('CREATE SCHEMA drizzle AUTHORIZATION pci_ops_journal_owner');
    await expect(bootstrapMigrationPrerequisites(partial.bootstrap)).rejects.toThrow(
      'Journal table',
    );
    expect(
      await partial.admin`SELECT to_regclass('drizzle.__drizzle_migrations')::text AS name`,
    ).toEqual([{ name: null }]);
  });

  it('rejects incorrect Owner, columns, sequence and broadened ACL without repair', async () => {
    for (const [name, mutation] of [
      ['schema-owner', 'ALTER SCHEMA drizzle OWNER TO postgres'],
      ['owner', 'ALTER TABLE drizzle.__drizzle_migrations OWNER TO postgres'],
      ['columns', 'ALTER TABLE drizzle.__drizzle_migrations ADD COLUMN extra text'],
      ['sequence', 'ALTER SEQUENCE drizzle.__drizzle_migrations_id_seq OWNED BY NONE'],
      ['missing-sequence', 'DROP SEQUENCE drizzle.__drizzle_migrations_id_seq CASCADE'],
      ['sequence-type', 'ALTER SEQUENCE drizzle.__drizzle_migrations_id_seq AS bigint'],
      [
        'extra-object',
        'SET ROLE pci_ops_journal_owner; CREATE TABLE drizzle.unexpected(id integer); RESET ROLE',
      ],
      ['acl', 'GRANT UPDATE ON drizzle.__drizzle_migrations TO pci_ops_migration'],
      [
        'sequence-acl',
        'REVOKE USAGE ON SEQUENCE drizzle.__drizzle_migrations_id_seq FROM pci_ops_migration',
      ],
    ]) {
      const db = await fixture();
      await db.admin.unsafe(mutation!);
      await expect(bootstrapMigrationPrerequisites(db.bootstrap), name).rejects.toThrow();
      await runFailure(
        db,
        await createFolder(`invalid-${name}`, installationFixtureSources.simple, false),
        'CONTRACT_REJECTED',
      );
    }
  });

  it('rejects unknown/duplicate Journal history and unreviewed Migration bytes', async () => {
    const db = await fixture();
    await db.admin`INSERT INTO drizzle.__drizzle_migrations(hash,created_at) VALUES (${'a'.repeat(64)},1)`;
    await expect(bootstrapMigrationPrerequisites(db.bootstrap)).rejects.toThrow('unknown');
    await db.admin.unsafe('DELETE FROM drizzle.__drizzle_migrations');
    await db.admin`INSERT INTO drizzle.__drizzle_migrations(hash,created_at) VALUES (${approvedInstallationHashes[0]!},36000),(${approvedInstallationHashes[0]!},36000)`;
    await expect(bootstrapMigrationPrerequisites(db.bootstrap)).rejects.toThrow('unique');
    const tamper = await createFolder('unreviewed', 'SELECT 1', false);
    await expect(migrateWithRoleContext(db.url, tamper)).rejects.toThrow('unapproved');
  });

  it('runs original 0036-0039 Fresh, then same-PID Owner phases, and repeats Upgrade preserving Legacy Owner', async () => {
    const db = await fixture({ legacy: true });
    const before = await db.admin`SELECT * FROM operations_human_principals ORDER BY principal_id`;
    const result = await migrateWithRoleContext(db.url, fullFolder, (e) => wrapperRecords.push(e));
    expect(result).toEqual({ applied: 1, skipped: 4 });
    const audit = await db.admin<
      { stage: string; pid: number; session_name: string; current_name: string }[]
    >`SELECT * FROM pci_install_fixture_audit ORDER BY stage`;
    expect(audit).toHaveLength(2);
    expect(new Set(audit.map((r) => r.pid)).size).toBe(1);
    expect(audit.every((r) => r.session_name === 'pci_ops_migration')).toBe(true);
    expect(audit.map((r) => r.current_name).sort()).toEqual([
      'pci_ops_function_owner',
      'pci_ops_table_owner',
    ]);
    const owners =
      await db.admin`SELECT c.relname,pg_get_userbyid(c.relowner) AS owner FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname IN ('operations_human_principals','operations_accounts','pci_install_fixture_history','pci_install_fixture_audit') ORDER BY c.relname`;
    expect(owners).toEqual([
      { relname: 'operations_accounts', owner: 'pci_ops_legacy_owner' },
      { relname: 'operations_human_principals', owner: 'pci_ops_legacy_owner' },
      { relname: 'pci_install_fixture_audit', owner: 'pci_ops_table_owner' },
      { relname: 'pci_install_fixture_history', owner: 'pci_ops_table_owner' },
    ]);
    metadata.ownerEvidence = owners;
    expect(await db.admin`SELECT * FROM operations_human_principals ORDER BY principal_id`).toEqual(
      before,
    );
    expect(await migrateWithRoleContext(db.url, fullFolder)).toEqual({ applied: 0, skipped: 5 });
    expect(await db.admin`SELECT count(*)::int AS n FROM drizzle.__drizzle_migrations`).toEqual([
      { n: 5 },
    ]);
    await owner(db, 'pci_ops_table_owner', (tx) =>
      query(
        tx,
        'ALTER TABLE public.operations_human_principals DISABLE TRIGGER operations_human_principals_protect_terminal_history_trigger',
        '42501',
      ),
    ).catch((error: unknown) => {
      expect(code(error)).toBe('42501');
    });
    await admin.unsafe(
      'GRANT pci_ops_legacy_owner TO pci_ops_migration WITH INHERIT FALSE, SET TRUE',
    );
    for (const statement of [
      "UPDATE operations_human_principals SET status='active' WHERE principal_id='terminal'",
      "DELETE FROM operations_accounts WHERE account_id='terminal-account'",
    ]) {
      await owner(db, 'pci_ops_legacy_owner', (tx) => query(tx, statement, '23514')).catch(
        (error: unknown) => {
          expect(code(error)).toBe('23514');
        },
      );
    }
    await admin.unsafe('REVOKE pci_ops_legacy_owner FROM pci_ops_migration');
    metadata.phaseEvidence = audit;
    const transaction = wrapperRecords.filter((e) => e.pid === audit[0]!.pid);
    expect(
      transaction.some(
        (e) => e.event === 'journal-insert' && e.current_user === 'pci_ops_migration',
      ),
    ).toBe(true);
    expect(
      transaction.some(
        (e) => e.event === 'transaction-confirmed' && e.current_user === 'pci_ops_migration',
      ),
    ).toBe(true);
    const functions =
      await db.admin`SELECT n.nspname,p.proname,pg_get_userbyid(p.proowner) AS owner,p.prosecdef,p.proacl::text AS acl
      FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE p.proname LIKE 'pci_install_fixture_%' ORDER BY p.proname`;
    expect(functions).toHaveLength(2);
    expect(functions.every((f) => f.owner === 'pci_ops_function_owner' && f.prosecdef)).toBe(true);
    metadata.functionEvidence = functions;
  });

  it('Function Owner can lock via status column only; cannot update Epoch, other columns or Account status', async () => {
    const db = await fixture({ legacy: true });
    await owner(db, 'pci_ops_function_owner', (tx) =>
      query(
        tx,
        "SELECT principal_id FROM operations_human_principals WHERE principal_id='pending' FOR UPDATE",
      ),
    );
    await owner(db, 'pci_ops_function_owner', (tx) =>
      query(
        tx,
        "UPDATE operations_human_principals SET status='pending' WHERE principal_id='pending'",
      ),
    );
    for (const statement of [
      "UPDATE operations_human_principals SET security_epoch=security_epoch+1 WHERE principal_id='pending'",
      "UPDATE operations_human_principals SET updated_at=now() WHERE principal_id='pending'",
      "UPDATE operations_accounts SET status='active' WHERE account_id='terminal-account'",
    ]) {
      await owner(db, 'pci_ops_function_owner', (tx) => query(tx, statement, '42501')).catch(
        (error: unknown) => {
          expect(code(error)).toBe('42501');
        },
      );
    }
    const acl =
      await db.admin`SELECT column_name,privilege_type FROM information_schema.column_privileges WHERE grantee='pci_ops_function_owner' AND table_name='operations_human_principals' AND privilege_type='UPDATE'`;
    expect(acl).toEqual([{ column_name: 'status', privilege_type: 'UPDATE' }]);
    metadata.columnAcl = acl;
  });

  it('Runtime has no Owner Membership, Journal access or function EXECUTE', async () => {
    const db = await fixture({ legacy: true });
    await migrateWithRoleContext(db.url, fullFolder);
    for (const statement of [
      'SET ROLE pci_ops_table_owner',
      'SET ROLE pci_ops_function_owner',
      'SET ROLE pci_ops_journal_owner',
      'SET ROLE pci_ops_migration',
      'SET ROLE pci_ops_bootstrap',
      'SET ROLE pci_ops_legacy_owner',
      'SELECT * FROM drizzle.__drizzle_migrations',
      'SELECT operations_api.pci_install_fixture_record()',
      'CREATE SCHEMA forbidden',
    ])
      await query(db.runtime, statement, '42501');
    await query(db.migration, 'SET ROLE pci_ops_journal_owner', '42501');
  });

  it('fails closed for missing Table Owner or Function Owner SET membership', async () => {
    for (const role of ['pci_ops_table_owner', 'pci_ops_function_owner']) {
      const db = await fixture({ legacy: true });
      await admin.unsafe(`REVOKE ${role} FROM pci_ops_migration`);
      try {
        await query(db.migration, `SET ROLE ${role}`, '42501');
        await runFailure(db, fullFolder, 'CONTRACT_REJECTED');
        expect(await db.admin`SELECT count(*)::int AS n FROM drizzle.__drizzle_migrations`).toEqual(
          [{ n: 4 }],
        );
        expect(
          await db.admin`SELECT to_regclass('public.pci_install_fixture_history')::text AS name`,
        ).toEqual([{ name: null }]);
      } finally {
        await admin.unsafe(`GRANT ${role} TO pci_ops_migration WITH INHERIT FALSE, SET TRUE`);
      }
    }
  });

  it('rolls back SQL failure, Journal INSERT failure and deferred COMMIT failure', async () => {
    for (const [kind, source, expected] of [
      ['sql', installationFixtureSources.sqlFailure, 'P0001'],
      ['journal', installationFixtureSources.simple, 'P0001'],
      ['commit', installationFixtureSources.commitFailure, '23503'],
    ] as const) {
      const db = await fixture();
      if (kind === 'journal') {
        await owner(db, 'pci_ops_table_owner', (tx) =>
          tx.unsafe(
            "CREATE FUNCTION public.pci_install_fail_journal() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Journal fixture failure' USING ERRCODE='P0001'; END $$",
          ),
        );
        await owner(db, 'pci_ops_journal_owner', async (tx) => {
          await tx.unsafe(
            'CREATE TRIGGER fail_journal BEFORE INSERT ON drizzle.__drizzle_migrations FOR EACH ROW EXECUTE FUNCTION public.pci_install_fail_journal()',
          );
        });
      }
      const failure = await runFailure(
        db,
        await createFolder(`failure-${kind}`, source, false),
        expected,
      );
      expect(failure.commitOutcome).toBe('not_committed');
      expect(failure.roleVerified).toBe(true);
      await rollbackState(db);
    }
  });

  it('uses one transaction per Migration: prior successful Journal remains after later failure', async () => {
    const db = await fixture();
    await admin.unsafe(
      'GRANT pci_ops_legacy_owner TO pci_ops_migration WITH INHERIT FALSE, SET TRUE',
    );
    try {
      await runFailure(
        db,
        await createFolder('atomicity', installationFixtureSources.sqlFailure),
        'P0001',
      );
    } finally {
      await admin.unsafe('REVOKE pci_ops_legacy_owner FROM pci_ops_migration');
    }
    expect(await db.admin`SELECT count(*)::int AS n FROM drizzle.__drizzle_migrations`).toEqual([
      { n: 4 },
    ]);
    expect(
      await db.admin`SELECT to_regclass('public.operations_human_principals')::text AS name`,
    ).toEqual([{ name: 'operations_human_principals' }]);
    expect(await db.admin`SELECT to_regclass('public.pci_install_rollback')::text AS name`).toEqual(
      [{ name: null }],
    );
  });

  it('rolls back callback exceptions before SET, after SET and before RESET and destroys the dedicated pool', async () => {
    for (const trigger of ['set-before', 'sql-before', 'reset-before']) {
      const db = await fixture();
      let pid = 0;
      const failure = await runFailure(
        db,
        await createFolder(`callback-${trigger}`, installationFixtureSources.simple, false),
        'CLIENT_ERROR',
        (e) => {
          pid = e.pid;
          if (e.event === trigger) throw new Error('Fixture callback injection');
        },
      );
      expect(failure.roleVerified).toBe(true);
      await rollbackState(db);
      expect(
        await db.admin`SELECT EXISTS(SELECT 1 FROM pg_stat_activity WHERE pid=${pid}) AS alive`,
      ).toEqual([{ alive: false }]);
    }
  });

  // Protocol-level fault injection uses a loopback proxy; never connects to a shared database.
  async function faultProxy(mode: 'before-reset' | 'before-journal' | 'commit-reply') {
    const sockets = new Set<Socket>();
    let dropped = false;
    const server = createServer((down) => {
      const up = connect({ host: '127.0.0.1', port: Number(port) });
      sockets.add(up);
      sockets.add(down);
      let serverBuffer = Buffer.alloc(0);
      let clientBuffer = Buffer.alloc(0);
      let startup = true;
      const abort = () => {
        dropped = true;
        up.destroy();
        down.destroy();
      };
      down.on('data', (data) => {
        clientBuffer = Buffer.concat([clientBuffer, data]);
        if (startup) {
          if (clientBuffer.length < 4) return;
          const length = clientBuffer.readInt32BE(0);
          if (clientBuffer.length < length) return;
          up.write(clientBuffer.subarray(0, length));
          clientBuffer = clientBuffer.subarray(length);
          startup = false;
        }
        while (clientBuffer.length >= 5) {
          const length = clientBuffer.readInt32BE(1) + 1;
          if (clientBuffer.length < length) return;
          const frame = clientBuffer.subarray(0, length);
          clientBuffer = clientBuffer.subarray(length);
          const text = frame.subarray(5).toString('utf8');
          if (
            !dropped &&
            ((mode === 'before-reset' && text === 'RESET ROLE\0') ||
              (mode === 'before-journal' &&
                text.includes('INSERT INTO drizzle.__drizzle_migrations')))
          ) {
            abort();
            return;
          }
          up.write(frame);
        }
      });
      up.on('data', (data) => {
        serverBuffer = Buffer.concat([serverBuffer, data]);
        while (serverBuffer.length >= 5) {
          const length = serverBuffer.readInt32BE(1) + 1;
          if (serverBuffer.length < length) return;
          const frame = serverBuffer.subarray(0, length);
          serverBuffer = serverBuffer.subarray(length);
          if (
            mode === 'commit-reply' &&
            frame[0] === 67 &&
            frame.subarray(5).toString('utf8') === 'COMMIT\0'
          ) {
            abort();
            return;
          }
          down.write(frame);
        }
      });
      up.on('error', () => down.destroy());
      down.on('error', () => up.destroy());
      up.on('close', () => {
        sockets.delete(up);
        down.destroy();
      });
      down.on('close', () => {
        sockets.delete(down);
        up.destroy();
      });
    });
    await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('No proxy port');
    return {
      port: String(address.port),
      dropped: () => dropped,
      close: async () => {
        for (const s of sockets) s.destroy();
        await new Promise<void>((r, j) => server.close((e) => (e ? j(e) : r())));
      },
    };
  }

  it('destroys sessions after RESET/network loss and reconciles a lost COMMIT reply without retry', async () => {
    for (const mode of ['before-reset', 'before-journal', 'commit-reply'] as const) {
      const db = await fixture();
      const proxy = await faultProxy(mode);
      let originalPid = 0;
      try {
        const proxyUrl = url(db.name, 'pci_ops_migration', proxy.port);
        let failure: unknown;
        try {
          await migrateWithRoleContext(
            proxyUrl,
            await createFolder(`network-${mode}`, installationFixtureSources.simple, false),
            (e) => {
              wrapperRecords.push(e);
              originalPid = e.pid;
            },
          );
        } catch (error) {
          failure = error;
        }
        expect(failure).toBeInstanceOf(ControlledMigrationFailure);
        if (!(failure instanceof ControlledMigrationFailure))
          throw new Error('Missing network failure');
        expect(failure.commitOutcome).toBe('unknown');
        expect(failure.poolDestroyed).toBe(true);
        expect(proxy.dropped()).toBe(true);
        const state =
          await db.admin`SELECT to_regclass('public.pci_install_rollback')::text AS marker,(SELECT count(*)::int FROM drizzle.__drizzle_migrations) AS journal`;
        expect(state).toEqual([
          {
            marker: mode === 'commit-reply' ? 'pci_install_rollback' : null,
            journal: mode === 'commit-reply' ? 1 : 0,
          },
        ]);
        const next = await installationIdentity(db.migration);
        expect(next.current_user).toBe('pci_ops_migration');
        expect(next.pid).not.toBe(originalPid);
        failureRecords.push({
          mode,
          pid: originalPid,
          next,
          state,
          sqlstate: failure.sqlstate,
          outcome: failure.commitOutcome,
          poolDestroyed: failure.poolDestroyed,
        });
      } finally {
        await proxy.close();
      }
    }
  }, 60_000);

  it('revokes temporary Bootstrap membership and database CREATE, disables its login, and leaves Migration inspection usable', async () => {
    for (const db of fixtures) await db.admin.unsafe(journalProvisioningCleanupSql);
    await admin.unsafe(journalProvisioningCleanupSql);
    const db = fixtures[0]!;
    await query(db.bootstrap, 'SET ROLE pci_ops_journal_owner', '42501');
    metadata.bootstrapCleanup = await admin`SELECT rolcanlogin,
      pg_has_role('pci_ops_bootstrap','pci_ops_journal_owner','MEMBER') AS journal_membership
      FROM pg_roles WHERE rolname='pci_ops_bootstrap'`;
    expect(metadata.bootstrapCleanup).toEqual([{ rolcanlogin: false, journal_membership: false }]);
    for (const f of fixtures) {
      expect(
        await f.admin`SELECT has_database_privilege('pci_ops_journal_owner',current_database(),'CREATE') AS allowed`,
      ).toEqual([{ allowed: false }]);
    }
    await verifyJournal(db.migration, approvedInstallationHashes);
  });
});
