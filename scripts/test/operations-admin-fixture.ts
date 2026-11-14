import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import postgres, { type Sql } from 'postgres';
import { initializeOperationsRoleFixture } from '../database/operations-role-permission-verifier.js';
import { bootstrapMigrationPrerequisites } from '../database/bootstrap-migration-prerequisites.js';
import { installationFixtureSources } from '../database/migrate-with-role-context.js';
import { journalProvisioningSql } from '../database/operations-migration-permissions.js';

export type ProcessEvidence = {
  command: string[];
  exitCode: number | null;
  signal: string | null;
  stdout: string;
  stderr: string;
};
export async function runProcess(
  command: string,
  args: string[],
  env = process.env,
): Promise<ProcessEvidence> {
  return new Promise((resolveResult, reject) => {
    const child = spawn(command, args, { env, windowsHide: true });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString();
    });
    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    child.on('error', reject);
    child.on('close', (exitCode, signal) =>
      resolveResult({ command: [command, ...args], exitCode, signal, stdout, stderr }),
    );
  });
}
const tags = [
  '0036_operations_principal_persistence',
  '0037_operations_credential_persistence',
  '0038_operations_session_persistence',
  '0039_operations_identity_terminal_state_protection',
  '0040_operations_activation_history_persistence',
  '0041_operations_initial_admin_bootstrap',
];
export class OperationsAdminFixture {
  readonly image = 'docker.m.daocloud.io/library/postgres:17.10-alpine';
  readonly name: string;
  readonly taskLabel: string;
  readonly includeCatalogFixture: boolean;
  readonly secrets = {
    postgres: randomBytes(24).toString('base64url'),
    migration: randomBytes(24).toString('base64url'),
    runtime: randomBytes(24).toString('base64url'),
    bootstrap: randomBytes(24).toString('base64url'),
  };
  readonly evidence: Record<string, unknown> = {
    startedAt: new Date().toISOString(),
    commands: [],
    databases: [],
    wrapper: [],
    failures: [],
  };
  private readonly clients: Sql[] = [];
  private port = '';
  private sequence = 0;
  folder = '';
  admin!: Sql;
  private created = false;
  constructor(
    options: { readonly taskLabel?: string; readonly includeCatalogFixture?: boolean } = {},
  ) {
    this.taskLabel = options.taskLabel ?? 'PCI-ENG-018-B-R1';
    this.includeCatalogFixture = options.includeCatalogFixture ?? false;
    this.name = `${this.taskLabel === 'PCI-ENG-018-C' ? 'pci-018c' : 'pci-018br1'}-${randomBytes(5).toString('hex')}`;
  }
  get postgresEvidenceFileName(): string {
    return `${this.taskLabel}-${this.name}-postgres.json`;
  }
  private async podman(args: string[], env = process.env) {
    const result = await runProcess('podman', args, env);
    (this.evidence.commands as ProcessEvidence[]).push(result);
    if (result.exitCode !== 0) throw new Error(`Podman ${args[0]} failed (${result.exitCode}).`);
    return result.stdout.trim();
  }
  url(database: string, role: 'postgres' | 'migration' | 'runtime' | 'bootstrap') {
    const username = role === 'postgres' ? role : `pci_ops_${role}`;
    return `postgres://${username}:${this.secrets[role]}@127.0.0.1:${this.port}/${database}`;
  }
  client(database: string, role: 'postgres' | 'migration' | 'runtime' | 'bootstrap') {
    const client = postgres(this.url(database, role), {
      max: 1,
      prepare: false,
      onnotice: () => {},
    });
    this.clients.push(client);
    return client;
  }
  async start() {
    this.folder = await mkdtemp(
      join(tmpdir(), this.taskLabel === 'PCI-ENG-018-C' ? 'pci-018c-' : 'pci-018br1-'),
    );
    this.evidence.podman = JSON.parse(
      await this.podman(['version', '--format', 'json']),
    ) as unknown;
    this.evidence.image = JSON.parse(
      await this.podman(['image', 'inspect', this.image, '--format', 'json']),
    ) as unknown;
    this.evidence.containerId = await this.podman(
      [
        'run',
        '--detach',
        '--name',
        this.name,
        '--label',
        `pci.task=${this.taskLabel}`,
        '--image-volume=ignore',
        '--publish',
        '127.0.0.1::5432',
        '--tmpfs',
        '/var/lib/postgresql/data:rw,size=1073741824',
        '--env',
        'POSTGRES_PASSWORD',
        this.image,
      ],
      { ...process.env, POSTGRES_PASSWORD: this.secrets.postgres },
    );
    this.created = true;
    this.evidence.portBinding = await this.podman(['port', this.name, '5432/tcp']);
    this.port = String(this.evidence.portBinding).split(':').at(-1)!;
    this.admin = this.client('postgres', 'postgres');
    for (let i = 0; i < 60; i++) {
      try {
        await this.admin`SELECT 1`;
        break;
      } catch {
        if (i === 59) throw new Error('PostgreSQL not ready');
        await new Promise((r) => setTimeout(r, 250));
      }
    }
    this.evidence.server = await this
      .admin`SELECT version(), current_setting('server_version_num') AS version_num`;
    await initializeOperationsRoleFixture(this.admin, this.secrets);
    await this.admin.unsafe(
      `CREATE ROLE pci_ops_legacy_owner NOLOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS; CREATE ROLE pci_ops_bootstrap LOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS PASSWORD '${this.secrets.bootstrap}'; GRANT pci_ops_legacy_owner TO pci_ops_migration WITH INHERIT FALSE, SET TRUE;`,
    );
    await this.admin.unsafe(journalProvisioningSql);
    await this.admin.unsafe(
      'ALTER DEFAULT PRIVILEGES FOR ROLE pci_ops_function_owner REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC',
    );
    await this.migrationFolder('legacy', 4);
    await this.migrationFolder('history', 5);
    await this.migrationFolder('complete', 6);
  }
  async migrationFolder(name: string, count: number, source?: string) {
    const folder = join(this.folder, name);
    await mkdir(join(folder, 'meta'), { recursive: true });
    const journal = JSON.parse(
      await readFile('database/migrations/meta/_journal.json', 'utf8'),
    ) as { entries: { tag: string; when: number }[] };
    const entries = [];
    for (const tag of tags.slice(0, count)) {
      await writeFile(
        join(folder, `${tag}.sql`),
        await readFile(resolve('database/migrations', `${tag}.sql`)),
      );
      entries.push({ ...journal.entries.find((e) => e.tag === tag)!, idx: entries.length });
    }
    if (source) {
      await writeFile(join(folder, 'installation_fixture.sql'), source);
      entries.push({ idx: entries.length, tag: 'installation_fixture', when: 100000 });
    }
    await writeFile(
      join(folder, 'meta/_journal.json'),
      JSON.stringify({ version: '7', dialect: 'postgresql', entries }),
    );
    return folder;
  }
  async migrate(database: string, folder: string, expectSuccess = true) {
    const result = await runProcess(
      process.execPath,
      ['--import', 'tsx', 'scripts/database/run-controlled-migration.ts', folder],
      { ...process.env, PCI_MIGRATION_DATABASE_URL: this.url(database, 'migration') },
    );
    (this.evidence.wrapper as unknown[]).push({ database, ...result });
    if (expectSuccess && result.exitCode !== 0)
      throw new Error(`Controlled migration failed: ${result.stderr}`);
    return result;
  }
  async database(legacySetup?: (sql: Sql) => Promise<void>) {
    const name = `pci_ops_migration_fixture_admin_${++this.sequence}`;
    await this.admin.unsafe(`CREATE DATABASE ${name}`);
    const admin = this.client(name, 'postgres');
    const migration = this.client(name, 'migration');
    const bootstrap = this.client(name, 'bootstrap');
    await admin.unsafe(
      `GRANT USAGE,CREATE ON SCHEMA public TO pci_ops_table_owner,pci_ops_legacy_owner; CREATE SCHEMA operations_api AUTHORIZATION pci_ops_function_owner; CREATE SCHEMA operations_private AUTHORIZATION pci_ops_function_owner; REVOKE ALL ON SCHEMA operations_api,operations_private FROM PUBLIC; GRANT USAGE ON SCHEMA operations_api TO pci_ops_runtime; GRANT USAGE ON SCHEMA operations_private TO pci_ops_table_owner; GRANT CREATE ON DATABASE ${name} TO pci_ops_journal_owner`,
    );
    await bootstrapMigrationPrerequisites(bootstrap);
    await admin.unsafe(`REVOKE CREATE ON DATABASE ${name} FROM pci_ops_journal_owner`);
    await this.migrate(name, join(this.folder, 'legacy'));
    await migration.begin(async (tx) => {
      await tx.unsafe('SET LOCAL ROLE pci_ops_legacy_owner');
      await tx.unsafe(
        'GRANT SELECT,REFERENCES,TRIGGER ON public.operations_human_principals,public.operations_accounts TO pci_ops_table_owner; GRANT SELECT,INSERT ON public.operations_human_principals,public.operations_accounts TO pci_ops_function_owner; GRANT UPDATE(status) ON public.operations_human_principals TO pci_ops_function_owner',
      );
    });
    if (legacySetup) await legacySetup(admin);
    await admin.unsafe(
      'GRANT MAINTAIN ON public.operations_human_principals,public.operations_accounts TO pci_ops_table_owner',
    );
    try {
      await this.migrate(name, join(this.folder, 'complete'));
    } finally {
      await admin.unsafe(
        'REVOKE MAINTAIN ON public.operations_human_principals,public.operations_accounts FROM pci_ops_table_owner',
      );
    }
    if (this.includeCatalogFixture || process.env.PCI_INCLUDE_CATALOG_FIXTURE === '1') {
      await this.installCatalogReadFixture(admin);
    }
    (this.evidence.databases as unknown[]).push({
      name,
      journal: await admin`SELECT * FROM drizzle.__drizzle_migrations ORDER BY id`,
      roles: await migration`SELECT session_user,current_user,pg_backend_pid(),current_database()`,
    });
    return {
      name,
      admin,
      migration,
      url: this.url(name, 'migration'),
      runtimeUrl: this.url(name, 'runtime'),
    };
  }

  private async installCatalogReadFixture(database: Sql): Promise<void> {
    const catalogMigration = await readFile(
      resolve('database/migrations/0034_database_managed_service_policy.sql'),
      'utf8',
    );
    await database.unsafe(catalogMigration);
    await database.unsafe(
      'GRANT SELECT ON public.service_policy_releases,public.service_policy_capabilities,public.service_policy_templates,public.service_policy_audits TO pci_ops_runtime',
    );
    await database.unsafe(
      `INSERT INTO public.service_policy_audits
        (id, actor_id, entity_type, entity_id, action, before_state, after_state, reason, policy_version, occurred_at, correlation_id)
       VALUES ('catalog-browser-audit', 'fixture-platform-system', 'capability', 'capability-dance-teaching', 'updated',
         '{"status":"draft"}'::jsonb, '{"status":"active"}'::jsonb, 'Disposable read-only browser fixture', 'v1', now(), 'catalog-browser-correlation')
       ON CONFLICT (id) DO NOTHING`,
    );
    this.evidence.catalogFixture = {
      installed: true,
      tables: await database`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name LIKE 'service_policy_%'
        ORDER BY table_name
      `,
      rows: await database`
        SELECT 'capabilities' AS relation, count(*)::int AS count FROM public.service_policy_capabilities
        UNION ALL SELECT 'templates', count(*)::int FROM public.service_policy_templates
        UNION ALL SELECT 'audits', count(*)::int FROM public.service_policy_audits
      `,
      runtimePrivileges: await database`
        SELECT table_name,
          has_table_privilege('pci_ops_runtime', format('public.%I', table_name), 'SELECT') AS select
        FROM (VALUES
          ('service_policy_releases'),
          ('service_policy_capabilities'),
          ('service_policy_templates'),
          ('service_policy_audits')
        ) AS tables(table_name)
        ORDER BY table_name
      `,
    };
  }
  async failureDatabase(kind: 'sqlFailure' | 'commitFailure') {
    const name = `pci_ops_migration_fixture_failure_${++this.sequence}`;
    await this.admin.unsafe(`CREATE DATABASE ${name}`);
    const admin = this.client(name, 'postgres'),
      bootstrap = this.client(name, 'bootstrap');
    await admin.unsafe(
      `GRANT USAGE,CREATE ON SCHEMA public TO pci_ops_table_owner; GRANT CREATE ON DATABASE ${name} TO pci_ops_journal_owner`,
    );
    await bootstrapMigrationPrerequisites(bootstrap);
    await admin.unsafe(`REVOKE CREATE ON DATABASE ${name} FROM pci_ops_journal_owner`);
    const folder = await this.migrationFolder(kind, 0, installationFixtureSources[kind]);
    const process = await this.migrate(name, folder, false);
    const state =
      await admin`SELECT to_regclass('public.pci_install_rollback')::text AS marker, to_regclass('public.pci_install_child')::text AS child, (SELECT count(*)::int FROM drizzle.__drizzle_migrations) AS journal_count`;
    (this.evidence.failures as unknown[]).push({ kind, process, state });
    return { process, state };
  }
  async close() {
    await Promise.allSettled(this.clients.map((c) => c.end({ timeout: 0 })));
    if (this.created) await this.podman(['rm', '--force', '--volumes', this.name]);
    this.evidence.remaining = await this.podman([
      'ps',
      '--all',
      '--filter',
      `name=${this.name}`,
      '--format',
      '{{.ID}} {{.Names}}',
    ]);
    this.evidence.finishedAt = new Date().toISOString();
    const evidencePath = `docs/09_Engineering_Governance/evidence/${this.postgresEvidenceFileName}`;
    const serialized = JSON.stringify(this.evidence, null, 2);
    if (Object.values(this.secrets).some((secret) => serialized.includes(secret)))
      throw new Error('Evidence contains secret');
    await writeFile(evidencePath, serialized + '\n', { flag: 'wx' });
  }
}
