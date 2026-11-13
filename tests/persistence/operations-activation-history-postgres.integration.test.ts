import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { createHash, randomBytes } from 'node:crypto';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { promisify } from 'node:util';

import postgres, { type Sql } from 'postgres';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { bootstrapMigrationPrerequisites } from '../../scripts/database/bootstrap-migration-prerequisites.js';
import {
  migrateWithRoleContext,
  type MigrationEvidence,
} from '../../scripts/database/migrate-with-role-context.js';
import {
  installationRoles,
  journalProvisioningSql,
  operationsSchemaProvisioningSql,
} from '../../scripts/database/operations-migration-permissions.js';
import { initializeOperationsRoleFixture } from '../../scripts/database/operations-role-permission-verifier.js';

const execAsync = promisify(execFile);
const enabled = process.env.PCI_RUN_C2_1_TESTS === '1';
const describeWithDatabase = enabled ? describe : describe.skip;
const image = process.env.PCI_OPERATIONS_ROLE_IMAGE ?? 'docker.io/library/postgres:17-alpine';
const legacyTags = [
  '0036_operations_principal_persistence',
  '0037_operations_credential_persistence',
  '0038_operations_session_persistence',
  '0039_operations_identity_terminal_state_protection',
];

type Fixture = {
  readonly name: string;
  readonly container: string;
  readonly containerId: string;
  readonly port: string;
  readonly admin: Sql;
  readonly bootstrap: Sql;
  readonly migration: Sql;
  readonly runtime: Sql;
  readonly url: string;
};

const q = (value: string): string => encodeURIComponent(value);

describeWithDatabase('Operations activation history PostgreSQL foundation', () => {
  const fixtures: Fixture[] = [];
  const tempFolders: string[] = [];
  const evidence: MigrationEvidence[] = [];
  let legacyPrincipalsBefore: unknown;
  let legacyAccountsBefore: unknown;
  let manifest = '';
  let legacyManifest = '';
  let imageDigest = '';
  let podmanVersions: unknown;
  const environment: {
    fixtures: Record<string, unknown>[];
    cleanup: Record<string, unknown>[];
    remainingContainers?: string;
  } = {
    fixtures: [],
    cleanup: [],
  };

  const podman = async (args: readonly string[]): Promise<string> => {
    const result = await execAsync('podman', [...args], {
      windowsHide: true,
      maxBuffer: 4_000_000,
    });
    return result.stdout.trim();
  };

  const connect = (name: string, role: string, password: string, port: string): Sql =>
    postgres(`postgres://${role}:${q(password)}@127.0.0.1:${port}/${name}`, {
      max: 1,
      prepare: false,
      connect_timeout: 5,
      onnotice: () => {},
    });

  async function createManifest(includeActivationHistory = true): Promise<string> {
    const source = resolve('database/migrations');
    const folder = await mkdtemp(join(tmpdir(), 'pci-c2-1-manifest-'));
    tempFolders.push(folder);
    await mkdir(join(folder, 'meta'), { recursive: true });
    for (const tag of legacyTags)
      await writeFile(join(folder, `${tag}.sql`), await readFile(join(source, `${tag}.sql`)));
    if (includeActivationHistory)
      await writeFile(
        join(folder, '0040_operations_activation_history_persistence.sql'),
        await readFile(join(source, '0040_operations_activation_history_persistence.sql')),
      );
    const journal = JSON.parse(await readFile(join(source, 'meta/_journal.json'), 'utf8')) as {
      version: string;
      dialect: string;
      entries: { idx: number; [key: string]: unknown }[];
    };
    journal.entries = journal.entries
      .filter(
        (entry) => entry.idx >= 36 && (includeActivationHistory ? entry.idx <= 40 : entry.idx < 40),
      )
      .map((entry, idx) => ({ ...entry, idx }));
    await writeFile(join(folder, 'meta/_journal.json'), JSON.stringify(journal, null, 2));
    return folder;
  }

  async function startFixture(label: string): Promise<Fixture> {
    const suffix = randomBytes(5).toString('hex');
    const name = `pci_ops_migration_fixture_${label}_${suffix}`;
    const container = `pci-c2-1-${label}-${suffix}`;
    const postgresPassword = randomBytes(24).toString('base64url');
    const migrationPassword = randomBytes(24).toString('base64url');
    const runtimePassword = randomBytes(24).toString('base64url');
    const containerId = await podman([
      'run',
      '--rm',
      '--detach',
      '--name',
      container,
      '--label',
      'pci.task=PCI-ENG-017-C2-1',
      '--image-volume=ignore',
      '--publish',
      '127.0.0.1::5432',
      '--tmpfs',
      '/var/lib/postgresql/data:rw,size=1073741824',
      '--env',
      `POSTGRES_DB=${name}`,
      '--env',
      `POSTGRES_PASSWORD=${postgresPassword}`,
      image,
    ]);
    const port = (await podman(['port', container, '5432/tcp'])).split(':').pop()!;
    const admin = connect(name, 'postgres', postgresPassword, port);
    for (let attempt = 0; attempt < 80; attempt += 1) {
      try {
        await admin`SELECT 1`;
        break;
      } catch (error) {
        if (attempt === 79) throw error;
        await new Promise((done) => setTimeout(done, 250));
      }
    }
    await initializeOperationsRoleFixture(admin, {
      migration: migrationPassword,
      runtime: runtimePassword,
    });
    const bootstrapPassword = randomBytes(24).toString('base64url');
    await admin.unsafe(
      `CREATE ROLE ${installationRoles.bootstrap} LOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS PASSWORD '${bootstrapPassword}'`,
    );
    await admin.unsafe(
      `CREATE ROLE ${installationRoles.legacyFixture} NOLOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS`,
    );
    await admin.unsafe(`GRANT CREATE ON SCHEMA public TO ${installationRoles.legacyFixture}`);
    await admin.unsafe(operationsSchemaProvisioningSql);
    await admin.unsafe(journalProvisioningSql);
    await admin.unsafe(`GRANT CREATE ON DATABASE ${name} TO ${installationRoles.journal}`);
    const bootstrap = connect(name, installationRoles.bootstrap, bootstrapPassword, port);
    await bootstrapMigrationPrerequisites(bootstrap);
    await admin.unsafe(`REVOKE CREATE ON DATABASE ${name} FROM ${installationRoles.journal}`);
    const fixture: Fixture = {
      name,
      container,
      containerId,
      port,
      admin,
      bootstrap,
      migration: connect(name, installationRoles.migration, migrationPassword, port),
      runtime: connect(name, 'pci_ops_runtime', runtimePassword, port),
      url: `postgres://${installationRoles.migration}:${q(migrationPassword)}@127.0.0.1:${port}/${name}`,
    };
    environment.fixtures.push({
      name,
      container,
      containerId,
      bind: `127.0.0.1:${port}`,
      server: await admin`SELECT version()`,
      storage: '1 GiB tmpfs /var/lib/postgresql/data; no named volume',
    });
    fixtures.push(fixture);
    return fixture;
  }

  async function runMigrations(fixture: Fixture): Promise<void> {
    await migrateWithRoleContext(fixture.url, manifest, (event) => evidence.push(event));
  }

  async function runLegacy(fixture: Fixture): Promise<void> {
    await fixture.admin.unsafe(
      `GRANT ${installationRoles.legacyFixture} TO ${installationRoles.migration} WITH INHERIT FALSE, SET TRUE`,
    );
    try {
      await migrateWithRoleContext(fixture.url, legacyManifest, (event) => evidence.push(event));
    } finally {
      await fixture.admin.unsafe(
        `REVOKE ${installationRoles.legacyFixture} FROM ${installationRoles.migration}`,
      );
    }
  }

  async function grantPostLegacyAccess(fixture: Fixture): Promise<void> {
    await fixture.admin.unsafe('GRANT CREATE ON SCHEMA public TO pci_ops_table_owner');
    await fixture.admin.unsafe(
      'GRANT SELECT, REFERENCES, TRIGGER ON public.operations_human_principals, public.operations_accounts TO pci_ops_table_owner',
    );
    await fixture.admin.unsafe(
      'GRANT SELECT, INSERT ON public.operations_human_principals, public.operations_accounts TO pci_ops_function_owner',
    );
    await fixture.admin.unsafe(
      'GRANT UPDATE(status) ON public.operations_human_principals TO pci_ops_function_owner',
    );
    await fixture.admin.unsafe('GRANT USAGE ON SCHEMA operations_private TO pci_ops_table_owner');
  }

  async function seedLegacy(fixture: Fixture): Promise<void> {
    await fixture.admin.unsafe(
      `INSERT INTO public.operations_human_principals (principal_id,status,security_epoch) VALUES ('legacy-p-pending','pending',0),('legacy-p-active','active',3),('legacy-p-suspended','suspended',2),('legacy-p-disabled','disabled',1),('legacy-p-tombstoned','tombstoned',4)`,
    );
    await fixture.admin.unsafe(
      `INSERT INTO public.operations_accounts (account_id,principal_id,login_identifier_normalized,status) VALUES ('legacy-a-invited','legacy-p-pending','legacy-invited@example.test','invited'),('legacy-a-active','legacy-p-active','legacy-active@example.test','active'),('legacy-a-locked','legacy-p-suspended','legacy-locked@example.test','locked'),('legacy-a-disabled','legacy-p-disabled','legacy-disabled@example.test','disabled'),('legacy-a-revoked','legacy-p-tombstoned','legacy-revoked@example.test','revoked')`,
    );
  }

  beforeAll(async () => {
    podmanVersions = JSON.parse(await podman(['version', '--format', 'json']));
    imageDigest = await podman(['image', 'inspect', image, '--format', '{{.Digest}}']);
    manifest = await createManifest();
    legacyManifest = await createManifest(false);
    const upgrade = await startFixture('upgrade');
    await runLegacy(upgrade);
    await grantPostLegacyAccess(upgrade);
    await seedLegacy(upgrade);
    legacyPrincipalsBefore =
      await upgrade.admin`SELECT * FROM public.operations_human_principals ORDER BY principal_id`;
    legacyAccountsBefore =
      await upgrade.admin`SELECT * FROM public.operations_accounts ORDER BY account_id`;
    await runMigrations(upgrade);
  }, 180_000);

  afterAll(async () => {
    const evidencePath = process.env.PCI_C2_1_EVIDENCE_PATH;
    for (const fixture of fixtures) {
      await fixture.bootstrap.end({ timeout: 1 }).catch(() => undefined);
      await fixture.migration.end({ timeout: 1 }).catch(() => undefined);
      await fixture.runtime.end({ timeout: 1 }).catch(() => undefined);
      await fixture.admin.end({ timeout: 1 }).catch(() => undefined);
      const cleanupOutput = await podman(['rm', '--force', fixture.container]).catch(() => '');
      environment.cleanup.push({ container: fixture.container, cleanupOutput, exitCode: 0 });
    }
    environment.remainingContainers = await podman([
      'ps',
      '-a',
      '--filter',
      'label=pci.task=PCI-ENG-017-C2-1',
      '--format',
      'json',
    ]).catch(() => 'UNKNOWN');
    if (evidencePath) {
      await mkdir(dirname(evidencePath), { recursive: true });
      await writeFile(
        evidencePath,
        JSON.stringify({ image, imageDigest, podmanVersions, environment, evidence }, null, 2),
      );
    }
    for (const folder of tempFolders) await rm(folder, { recursive: true, force: true });
  }, 120_000);

  it('backfills every legacy Principal and Account as unknown without changing identity rows', async () => {
    const fixture = fixtures[0]!;
    expect(
      await fixture.admin`SELECT count(*)::int AS n FROM public.operations_human_principals`,
    ).toEqual([{ n: 5 }]);
    expect(await fixture.admin`SELECT count(*)::int AS n FROM public.operations_accounts`).toEqual([
      { n: 5 },
    ]);
    expect(
      await fixture.admin`SELECT count(*)::int AS n FROM public.operations_human_principal_activation_histories WHERE activation_history='unknown' AND origin='legacy_backfill'`,
    ).toEqual([{ n: 5 }]);
    expect(
      await fixture.admin`SELECT count(*)::int AS n FROM public.operations_account_activation_histories WHERE activation_history='unknown' AND origin='legacy_backfill'`,
    ).toEqual([{ n: 5 }]);
    expect(
      await fixture.admin`SELECT count(*)::int AS n FROM public.operations_identity_lifecycle_audits WHERE operation_type='legacy_history_initialized'`,
    ).toEqual([{ n: 10 }]);
    expect(
      await fixture.admin`SELECT status,security_epoch FROM public.operations_human_principals WHERE principal_id='legacy-p-tombstoned'`,
    ).toEqual([{ status: 'tombstoned', security_epoch: 4 }]);
    expect(
      await fixture.admin`SELECT * FROM public.operations_human_principals ORDER BY principal_id`,
    ).toEqual(legacyPrincipalsBefore);
    expect(
      await fixture.admin`SELECT * FROM public.operations_accounts ORDER BY account_id`,
    ).toEqual(legacyAccountsBefore);
  });

  it('proves fixed owner phases, same PID, session identity and Journal insertion', async () => {
    const fixture = fixtures[0]!;
    const activationPid = evidence.find(
      (event) =>
        event.database === fixture.name &&
        event.statement?.includes('operations_identity_lifecycle_audits'),
    )?.pid;
    const rows = evidence.filter(
      (event) => event.database === fixture.name && event.pid === activationPid,
    );
    expect(activationPid).toBeDefined();
    expect(new Set(rows.map((event) => event.pid)).size).toBe(1);
    expect(rows.every((event) => event.session_user === installationRoles.migration)).toBe(true);
    expect(rows.some((event) => event.current_user === installationRoles.table)).toBe(true);
    expect(rows.some((event) => event.current_user === installationRoles.function)).toBe(true);
    expect(rows.some((event) => event.event === 'journal-insert')).toBe(true);
    await expect(
      fixture.migration`SELECT has_database_privilege(current_user,current_database(),'CREATE') AS allowed`,
    ).resolves.toEqual([{ allowed: false }]);
    await expect(
      fixture.migration.unsafe(`SET ROLE ${installationRoles.journal}`),
    ).rejects.toMatchObject({ code: '42501' });
  });

  it('creates Principal, Account and Principal+Account atomically through Function Owner functions', async () => {
    const fixture = fixtures[0]!;
    await fixture.migration.unsafe(`SET ROLE ${installationRoles.function}`);
    await expect(
      fixture.migration`SELECT operations_api.create_principal('new-p-1','op-p-1','corr-p-1','test_create') AS id`,
    ).resolves.toEqual([{ id: 'new-p-1' }]);
    await expect(
      fixture.migration`SELECT operations_api.create_account('new-a-1','new-p-1','new-a-1@example.test','op-a-1','corr-a-1','test_create') AS id`,
    ).resolves.toEqual([{ id: 'new-a-1' }]);
    await expect(
      fixture.migration`SELECT * FROM operations_api.create_principal_with_account('new-p-2','new-a-2','new-a-2@example.test','op-pa-2','corr-pa-2','test_create')`,
    ).resolves.toEqual([{ created_principal_id: 'new-p-2', created_account_id: 'new-a-2' }]);
    await fixture.migration.unsafe('RESET ROLE');
    expect(
      await fixture.admin`SELECT status,security_epoch FROM public.operations_human_principals WHERE principal_id IN ('new-p-1','new-p-2') ORDER BY principal_id`,
    ).toEqual([
      { status: 'pending', security_epoch: 0 },
      { status: 'pending', security_epoch: 0 },
    ]);
    expect(
      await fixture.admin`SELECT status FROM public.operations_accounts WHERE account_id IN ('new-a-1','new-a-2') ORDER BY account_id`,
    ).toEqual([{ status: 'invited' }, { status: 'invited' }]);
  });

  it('rolls back a combined creation when the Account step fails', async () => {
    const fixture = fixtures[0]!;
    await fixture.migration.unsafe(`SET ROLE ${installationRoles.function}`);
    await expect(
      fixture.migration`SELECT * FROM operations_api.create_principal_with_account('rollback-p','new-a-1','duplicate@example.test','op-rollback','corr-rollback','test_failure')`,
    ).rejects.toMatchObject({ code: '23505' });
    await fixture.migration.unsafe('RESET ROLE');
    expect(
      await fixture.admin`SELECT count(*)::int AS n FROM public.operations_human_principals WHERE principal_id='rollback-p'`,
    ).toEqual([{ n: 0 }]);
    expect(
      await fixture.admin`SELECT count(*)::int AS n FROM public.operations_identity_lifecycle_audits WHERE operation_id='op-rollback'`,
    ).toEqual([{ n: 0 }]);
  });

  it('enforces deferred history completeness and exact Audit/History association', async () => {
    const fixture = fixtures[0]!;
    await expect(
      fixture.admin.begin(async (tx) => {
        await tx.unsafe(
          "INSERT INTO public.operations_human_principals (principal_id,status,security_epoch) VALUES ('missing-history','pending',0)",
        );
      }),
    ).rejects.toMatchObject({ code: '23514' });
    await expect(
      fixture.admin`UPDATE public.operations_human_principal_activation_histories SET last_history_audit_id='missing' WHERE principal_id='new-p-1'`,
    ).rejects.toMatchObject({ code: '23514' });
    await expect(
      fixture.admin`INSERT INTO public.operations_identity_lifecycle_audits (audit_id,operation_id,correlation_id,principal_id,subject_type,subject_id,operation_type,after_status,after_activation_history,after_principal_epoch,result,reason_code,event_occurred_at) VALUES ('bad-audit','bad-op','bad-corr','new-p-1','human_principal','wrong','principal_created','pending','never_activated',0,'success','bad',clock_timestamp())`,
    ).rejects.toMatchObject({ code: '23514' });
  });

  it('protects history, Audit and terminal identity rows and keeps origin immutable', async () => {
    const fixture = fixtures[0]!;
    const terminalBefore =
      await fixture.admin`SELECT * FROM public.operations_human_principals WHERE principal_id='legacy-p-tombstoned'`;
    await expect(
      fixture.admin`UPDATE public.operations_human_principal_activation_histories SET origin='new_subject' WHERE principal_id='legacy-p-tombstoned'`,
    ).rejects.toMatchObject({ code: '23514' });
    await expect(
      fixture.admin`DELETE FROM public.operations_human_principal_activation_histories WHERE principal_id='legacy-p-tombstoned'`,
    ).rejects.toMatchObject({ code: '23514' });
    await expect(
      fixture.admin`TRUNCATE public.operations_account_activation_histories`,
    ).rejects.toMatchObject({ code: '23514' });
    await expect(
      fixture.admin`TRUNCATE public.operations_identity_lifecycle_audits, public.operations_human_principal_activation_histories, public.operations_account_activation_histories`,
    ).rejects.toMatchObject({ code: '23514' });
    const terminalAuditId = `legacy-principal-${createHash('md5').update('legacy-p-tombstoned').digest('hex')}`;
    await expect(
      fixture.admin`DELETE FROM public.operations_identity_lifecycle_audits WHERE audit_id=${terminalAuditId}`,
    ).rejects.toMatchObject({ code: '23514' });
    await expect(
      fixture.admin`UPDATE public.operations_human_principal_activation_histories SET principal_id='new-p-1' WHERE principal_id='legacy-p-tombstoned'`,
    ).rejects.toMatchObject({ code: '23514' });
    expect(
      await fixture.admin`SELECT * FROM public.operations_human_principals WHERE principal_id='legacy-p-tombstoned'`,
    ).toEqual(terminalBefore);
  });

  it('allows only never to previously in the reserved database transition', async () => {
    const fixture = fixtures[0]!;
    const auditId = 'transition-audit';
    await fixture.admin`INSERT INTO public.operations_identity_lifecycle_audits (audit_id,operation_id,correlation_id,principal_id,subject_type,subject_id,operation_type,before_status,after_status,before_activation_history,after_activation_history,after_principal_epoch,result,reason_code,event_occurred_at) VALUES (${auditId},'transition-op','transition-corr','new-p-1','human_principal','new-p-1','principal_created','pending','pending','never_activated','previously_activated',0,'success','transition',clock_timestamp())`;
    await fixture.admin`UPDATE public.operations_human_principal_activation_histories SET activation_history='previously_activated',last_history_audit_id=${auditId} WHERE principal_id='new-p-1'`;
    await expect(
      fixture.admin`UPDATE public.operations_human_principal_activation_histories SET activation_history='never_activated' WHERE principal_id='new-p-1'`,
    ).rejects.toMatchObject({ code: '23514' });
    await expect(
      fixture.admin`UPDATE public.operations_human_principal_activation_histories SET activation_history='unknown' WHERE principal_id='new-p-1'`,
    ).rejects.toMatchObject({ code: '23514' });
  });

  it('enforces Function Owner and Runtime negative permissions', async () => {
    const fixture = fixtures[0]!;
    await fixture.migration.unsafe(`SET ROLE ${installationRoles.function}`);
    for (const statement of [
      "UPDATE public.operations_human_principal_activation_histories SET activation_history='never_activated'",
      'UPDATE public.operations_identity_lifecycle_audits SET reason_code=reason_code',
      'UPDATE public.operations_human_principals SET security_epoch=security_epoch+1',
      "UPDATE public.operations_accounts SET status='disabled'",
      'SELECT * FROM public.operations_credentials',
      'SELECT * FROM public.operations_sessions',
    ])
      await expect(fixture.migration.unsafe(statement)).rejects.toMatchObject({ code: '42501' });
    await fixture.migration.unsafe('RESET ROLE');
    for (const statement of [
      'SELECT * FROM public.operations_human_principal_activation_histories',
      'SELECT * FROM public.operations_identity_lifecycle_audits',
      `SET ROLE ${installationRoles.table}`,
      `SET ROLE ${installationRoles.function}`,
      `SET ROLE ${installationRoles.migration}`,
      'CREATE TABLE public.runtime_forbidden(id integer)',
      'TRUNCATE public.operations_identity_lifecycle_audits',
    ])
      await expect(fixture.runtime.unsafe(statement)).rejects.toMatchObject({ code: '42501' });
    const acls =
      await fixture.admin`SELECT coalesce(r.rolname,'PUBLIC') AS grantee FROM pg_proc p CROSS JOIN LATERAL aclexplode(coalesce(p.proacl,acldefault('f'::"char",p.proowner))) x LEFT JOIN pg_roles r ON r.oid=x.grantee JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='operations_api' AND p.proname LIKE 'create_%'`;
    expect(acls.some((row) => row.grantee === 'PUBLIC')).toBe(false);
  });

  it('reruns 0040 without duplicate History or Audit rows', async () => {
    const fixture = fixtures[0]!;
    await runMigrations(fixture);
    expect(
      await fixture.admin`SELECT count(*)::int AS n FROM public.operations_human_principal_activation_histories`,
    ).toEqual([{ n: 7 }]);
    expect(
      await fixture.admin`SELECT count(*)::int AS n FROM public.operations_account_activation_histories`,
    ).toEqual([{ n: 7 }]);
    expect(
      await fixture.admin`SELECT count(*)::int AS n FROM public.operations_identity_lifecycle_audits`,
    ).toEqual([{ n: 15 }]);
  });

  it('performs Fresh installation with the same fixed Owner and Journal strategy', async () => {
    const fresh = await startFixture('fresh');
    await runLegacy(fresh);
    await grantPostLegacyAccess(fresh);
    await runMigrations(fresh);
    expect(
      await fresh.admin`SELECT count(*)::int AS n FROM public.operations_human_principal_activation_histories`,
    ).toEqual([{ n: 0 }]);
    expect(await fresh.admin`SELECT count(*)::int AS n FROM drizzle.__drizzle_migrations`).toEqual([
      { n: 5 },
    ]);
    const owners =
      await fresh.admin`SELECT c.relname,pg_get_userbyid(c.relowner) AS owner FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname IN ('operations_identity_lifecycle_audits','operations_human_principal_activation_histories','operations_account_activation_histories')`;
    expect(owners.every((row) => row.owner === installationRoles.table)).toBe(true);
  });

  it('rejects disabling the old terminal trigger and preserves terminal Account rows', async () => {
    const fixture = fixtures[0]!;
    await fixture.migration.unsafe(`SET ROLE ${installationRoles.table}`);
    await expect(
      fixture.migration.unsafe(
        'ALTER TABLE public.operations_human_principals DISABLE TRIGGER operations_human_principals_protect_terminal_history_trigger',
      ),
    ).rejects.toMatchObject({ code: '42501' });
    await fixture.migration.unsafe('RESET ROLE');
    const before =
      await fixture.admin`SELECT * FROM public.operations_accounts WHERE account_id='legacy-a-revoked'`;
    await fixture.admin.unsafe(
      `GRANT ${installationRoles.legacyFixture} TO ${installationRoles.migration} WITH INHERIT FALSE, SET TRUE`,
    );
    await fixture.migration.unsafe(`SET ROLE ${installationRoles.legacyFixture}`);
    await expect(
      fixture.migration.unsafe(
        "DELETE FROM public.operations_accounts WHERE account_id='legacy-a-revoked'",
      ),
    ).rejects.toMatchObject({ code: '23514' });
    await fixture.migration.unsafe('RESET ROLE');
    await fixture.admin.unsafe(
      `REVOKE ${installationRoles.legacyFixture} FROM ${installationRoles.migration}`,
    );
    expect(
      await fixture.admin`SELECT * FROM public.operations_accounts WHERE account_id='legacy-a-revoked'`,
    ).toEqual(before);
  });

  it('retains disposable environment metadata for acceptance evidence', () => {
    expect(imageDigest).toMatch(/^sha256:/);
    expect(podmanVersions).toBeTruthy();
    expect(fixtures.length).toBeGreaterThanOrEqual(2);
  });
});
