import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { readMigrationFiles } from 'drizzle-orm/migrator';
import { activationHistoryRoles, initialAdminRoles } from './operations-migration-phases.js';
import postgres, { type TransactionSql } from 'postgres';

import {
  InstallationContractError,
  installationIdentity,
  installationRoles,
  requireInstallation,
  requireInstallationIdentity,
  verifyActivationHistoryPrerequisites,
  verifyJournal,
} from './operations-migration-permissions.js';

const breakpoint = '\n--> statement-breakpoint\n';
// These deliberately small installation probes are not the C2-1 History/Audit model.
// Their exact bytes, stage boundaries and roles are fixed here for review. Migration 0040 has a
// separate fixed policy below and requires an external DBA temporary MAINTAIN grant.
const fixtureTableStatements = [
  'CREATE TABLE public.pci_install_fixture_history (principal_id varchar(128) PRIMARY KEY REFERENCES public.operations_human_principals(principal_id) ON DELETE RESTRICT)',
  'CREATE TABLE public.pci_install_fixture_audit (stage text, pid integer, session_name name, current_name name)',
  'GRANT SELECT ON public.pci_install_fixture_history TO pci_ops_function_owner',
  'GRANT INSERT ON public.pci_install_fixture_audit TO pci_ops_function_owner',
  "INSERT INTO public.pci_install_fixture_audit SELECT 'table', pg_backend_pid(), session_user, current_user",
];
const fixtureFunctionStatements = [
  `CREATE FUNCTION operations_private.pci_install_fixture_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$ BEGIN IF NOT EXISTS (SELECT 1 FROM public.pci_install_fixture_history WHERE principal_id=NEW.principal_id) THEN RAISE EXCEPTION 'Fixture history missing' USING ERRCODE='23514'; END IF; RETURN NULL; END $$`,
  'GRANT EXECUTE ON FUNCTION operations_private.pci_install_fixture_guard() TO pci_ops_table_owner',
  `CREATE FUNCTION operations_api.pci_install_fixture_record() RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$ BEGIN INSERT INTO public.pci_install_fixture_audit SELECT 'function',pg_backend_pid(),session_user,current_user; RETURN 1; END $$`,
  'SELECT operations_api.pci_install_fixture_record()',
];
const fixtureFinalStatements = [
  'CREATE CONSTRAINT TRIGGER pci_install_fixture_required AFTER INSERT ON public.operations_human_principals DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION operations_private.pci_install_fixture_guard()',
];

export const installationFixtureSources = Object.freeze({
  foundation: [
    ...fixtureTableStatements,
    ...fixtureFunctionStatements,
    ...fixtureFinalStatements,
  ].join(breakpoint),
  sqlFailure:
    'CREATE TABLE public.pci_install_rollback (id integer PRIMARY KEY)' +
    breakpoint +
    "DO $$ BEGIN RAISE EXCEPTION 'Fixture SQL failure' USING ERRCODE='P0001'; END $$",
  commitFailure:
    'CREATE TABLE public.pci_install_rollback (id integer PRIMARY KEY)' +
    breakpoint +
    'CREATE TABLE public.pci_install_child (id integer REFERENCES public.pci_install_rollback(id) DEFERRABLE INITIALLY DEFERRED)' +
    breakpoint +
    'INSERT INTO public.pci_install_child VALUES (99)',
  simple: 'CREATE TABLE public.pci_install_rollback (id integer PRIMARY KEY)',
});

const legacyHashes: readonly string[] = [
  'e32c149f080fe8d9e498b109b6136d0f33d58e29a5aa30efdc8304a0454ca286',
  'bc409153eededb45c8132f324242b08f55019b3e79c7d16311ff2c0132ee12e0',
  '344196ebc3a1c91afa710a7f399e55119a394e992915792c882c031f8f817594',
  '7fba8a695294bb2abf2c98e790d72f92b33451909691e5e2b60d72366621e363',
];
const activationHistoryHash = '80c6bc3431fcc8f249e79a64cace60c6816f55cd889fce4c77cd4c007bf74ed7';
const initialAdminBootstrapHash =
  'a4f9445de19f685e0386826a565ba2c4d469818507d0f1686675a5a395ff3aec';
const reviewedMigrationTags = new Map<string, string>([
  [legacyHashes[0]!, '0036_operations_principal_persistence'],
  [legacyHashes[1]!, '0037_operations_credential_persistence'],
  [legacyHashes[2]!, '0038_operations_session_persistence'],
  [legacyHashes[3]!, '0039_operations_identity_terminal_state_protection'],
  [activationHistoryHash, '0040_operations_activation_history_persistence'],
  [initialAdminBootstrapHash, '0041_operations_initial_admin_bootstrap'],
]);
const activationHistoryFolderMillis = 1_794_777_600_000;
const initialAdminBootstrapFolderMillis = 1_794_777_600_001;
const legacyFolderMillis = [
  [36_000, 1_794_477_491_886],
  [37_000, 1_794_500_821_357],
  [38_000, 1_794_691_200_001],
  [39_000, 1_794_691_200_002],
] as const;
const digest = (sql: string) => createHash('sha256').update(sql).digest('hex');
export const approvedInstallationHashes: readonly string[] = Object.freeze([
  ...legacyHashes,
  activationHistoryHash,
  initialAdminBootstrapHash,
  ...Object.values(installationFixtureSources).map(digest),
]);

export type MigrationEvidence = Readonly<{
  event: string;
  pid: number;
  session_user: string;
  current_user: string;
  database: string;
  statement?: string;
  sqlstate?: string;
}>;

export class ControlledMigrationFailure extends Error {
  constructor(
    readonly sqlstate: string,
    readonly commitOutcome: 'not_committed' | 'unknown',
    readonly poolDestroyed: boolean,
    readonly roleVerified: boolean,
  ) {
    super(
      `Controlled migration stopped (${sqlstate}); commit=${commitOutcome}; reconnect/reconcile before retry.`,
    );
    this.name = 'ControlledMigrationFailure';
  }
}

function errorCode(error: unknown): string {
  if (error instanceof InstallationContractError) return 'CONTRACT_REJECTED';
  return typeof error === 'object' && error !== null && 'code' in error
    ? String(error.code)
    : 'CLIENT_ERROR';
}

/** Only reviewed, disposable installation policies are enabled. No production/0040 execution policy exists. */
export async function migrateWithRoleContext(
  databaseUrl: string,
  migrationsFolder: string,
  record: (event: MigrationEvidence) => void = () => {},
): Promise<{ applied: number; skipped: number }> {
  const url = new URL(databaseUrl);
  requireInstallation(
    ['postgres:', 'postgresql:'].includes(url.protocol) &&
      ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname) &&
      url.username === installationRoles.migration &&
      /^\/pci_ops_migration_fixture_[a-z0-9_]+$/.test(url.pathname),
    'dedicated disposable Migration connection',
  );
  const journal = JSON.parse(
    await readFile(join(migrationsFolder, 'meta/_journal.json'), 'utf8'),
  ) as {
    entries?: { tag?: unknown }[];
  };
  const migrations = readMigrationFiles({ migrationsFolder });
  requireInstallation(migrations.length > 0, 'empty installation manifest');
  requireInstallation(
    Array.isArray(journal.entries) && journal.entries.length === migrations.length,
    'migration filename manifest shape',
  );
  requireInstallation(
    new Set(migrations.map((m) => m.hash)).size === migrations.length,
    'duplicate manifest hash',
  );
  for (let i = 0; i < migrations.length; i++) {
    const item = migrations[i]!;
    const tag = journal.entries[i]!.tag;
    const reviewedTag = reviewedMigrationTags.get(item.hash);
    if (reviewedTag !== undefined)
      requireInstallation(tag === reviewedTag, 'reviewed Migration filename/hash binding');
    const legacyIndex = legacyHashes.indexOf(item.hash);
    requireInstallation(
      approvedInstallationHashes.includes(item.hash) &&
        Number.isSafeInteger(item.folderMillis) &&
        (i === 0 || item.folderMillis > migrations[i - 1]!.folderMillis) &&
        (legacyIndex < 0
          ? item.folderMillis ===
            (item.hash === activationHistoryHash
              ? activationHistoryFolderMillis
              : item.hash === initialAdminBootstrapHash
                ? initialAdminBootstrapFolderMillis
                : 100_000)
          : item.folderMillis === legacyFolderMillis[legacyIndex]![0] ||
            item.folderMillis === legacyFolderMillis[legacyIndex]![1]),
      'unapproved SQL/hash/order; no fallback identity and no real 0040 policy',
    );
  }
  // Dedicated pool is never shared with API/runtime; it is closed on every exit.
  const pool = postgres(databaseUrl, {
    max: 1,
    prepare: false,
    connect_timeout: 5,
    onnotice: () => {},
  });
  let applied = 0;
  let skipped = 0;
  let stage = 'preflight';
  let failed = false;
  let commitOutcome: 'not_committed' | 'unknown' = 'not_committed';
  let sqlstate = '';
  let roleVerified = false;
  let lastEvidence: MigrationEvidence | undefined;
  const emit = async (tx: TransactionSql, event: string, statement?: string) => {
    lastEvidence = { ...(await installationIdentity(tx)), event, statement };
    record({ ...lastEvidence, ...(event.endsWith('-after') ? { sqlstate: '00000' } : {}) });
  };
  try {
    await requireInstallationIdentity(pool, installationRoles.migration);
    // A distinct transaction per migration; the previous successful migration remains committed.
    for (const migration of migrations) {
      stage = 'transaction';
      const didApply = await pool.begin(async (tx) => {
        try {
          await requireInstallationIdentity(tx, installationRoles.migration);
          await tx.unsafe('SELECT pg_advisory_xact_lock(71017211)');
          await verifyJournal(tx, approvedInstallationHashes);
          await emit(
            tx,
            'journal-read',
            'SELECT id, hash, created_at FROM drizzle.__drizzle_migrations ORDER BY id',
          );
          const history = await tx<{ id: number; hash: string; created_at: string }[]>`
          SELECT id, hash, created_at FROM drizzle.__drizzle_migrations ORDER BY id`;
          for (let i = 0; i < history.length; i++) {
            const item = history[i]!;
            requireInstallation(
              migrations.some(
                (m) => m.hash === item.hash && m.folderMillis === Number(item.created_at),
              ) &&
                (i === 0 || Number(item.created_at) > Number(history[i - 1]!.created_at)),
              'Journal does not match reviewed complete installation history',
            );
          }
          if (
            history.some(
              (h) => h.hash === migration.hash && Number(h.created_at) === migration.folderMillis,
            )
          )
            return false;
          requireInstallation(
            !history.some((h) => Number(h.created_at) >= migration.folderMillis),
            'Journal gap or rewritten history',
          );
          const legacy = legacyHashes.includes(migration.hash);
          const foundation = migration.hash === digest(installationFixtureSources.foundation);
          const activationHistory = migration.hash === activationHistoryHash;
          if (activationHistory) {
            await emit(
              tx,
              'activation-history-permission-preflight-before',
              'verify temporary MAINTAIN and fixed role boundary',
            );
            await verifyActivationHistoryPrerequisites(tx);
            await emit(
              tx,
              'activation-history-permission-preflight-after',
              'verify temporary MAINTAIN and fixed role boundary',
            );
          }
          requireInstallation(
            !activationHistory || migration.sql.length === activationHistoryRoles.length,
            'reviewed 0040 statement count and phase policy',
          );
          const initialAdmin = migration.hash === initialAdminBootstrapHash;
          requireInstallation(
            !initialAdmin || migration.sql.length === initialAdminRoles.length,
            'reviewed 0041 phase policy',
          );
          let previousRole = '';
          for (let i = 0; i < migration.sql.length; i++) {
            const role = initialAdmin
              ? initialAdminRoles[i]!
              : legacy
                ? installationRoles.legacyFixture
                : activationHistory
                  ? activationHistoryRoles[i]!
                  : foundation &&
                      i >= fixtureTableStatements.length &&
                      i < fixtureTableStatements.length + fixtureFunctionStatements.length
                    ? installationRoles.function
                    : installationRoles.table;
            if (role !== previousRole) {
              const membership = await tx<{ valid: boolean }[]>`SELECT EXISTS(
              SELECT 1 FROM pg_auth_members m JOIN pg_roles member ON member.oid=m.member JOIN pg_roles owner ON owner.oid=m.roleid
              WHERE member.rolname='pci_ops_migration' AND owner.rolname=${role} AND NOT m.inherit_option AND m.set_option
            ) AS valid`;
              requireInstallation(
                membership[0]!.valid,
                'explicit SET membership with INHERIT FALSE',
              );
              // role comes exclusively from this module's fixed policy, never a caller-provided name.
              if (previousRole) {
                await emit(tx, 'reset-before', 'RESET ROLE');
                await tx.unsafe('RESET ROLE');
                await emit(tx, 'reset-after', 'RESET ROLE');
              }
              await emit(tx, 'set-before', `SET LOCAL ROLE ${role}`);
              await tx.unsafe(`SET LOCAL ROLE ${role}`);
              await emit(tx, 'set-after', `SET LOCAL ROLE ${role}`);
              previousRole = role;
            }
            const statement = migration.sql[i]!;
            await emit(tx, 'sql-before', statement);
            await tx.unsafe(statement);
            await emit(tx, 'sql-after', statement);
          }
          await emit(tx, 'reset-before', 'RESET ROLE');
          await tx.unsafe('RESET ROLE');
          await emit(tx, 'reset-after', 'RESET ROLE');
          await requireInstallationIdentity(tx, installationRoles.migration);
          await emit(
            tx,
            'journal-insert',
            'INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES ($1,$2)',
          );
          await tx`INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES (${migration.hash},${migration.folderMillis})`;
          await emit(
            tx,
            'journal-insert-after',
            'INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES ($1,$2)',
          );
          await emit(tx, 'commit-before', 'COMMIT');
          stage = 'commit';
          return true;
        } catch (error) {
          const code = errorCode(error);
          if (code.startsWith('CONNECTION') || code.startsWith('08') || code.startsWith('57')) {
            // postgres-js 3.4.9 races begin's scope against onclose. Destroy the dedicated
            // pool before rejecting the scope: its automatic ROLLBACK must not enqueue a
            // write against the already closed socket. No business pool or retry is involved.
            await pool.end({ timeout: 0 });
          }
          throw error;
        }
      });
      if (didApply) applied++;
      else skipped++;
      stage = 'confirmed';
      const current = await requireInstallationIdentity(pool, installationRoles.migration);
      record({ ...current, event: 'transaction-confirmed', sqlstate: '00000' });
    }
  } catch (error) {
    failed = true;
    sqlstate = errorCode(error);
    if (lastEvidence) {
      // Retain the last observed identity, not a fabricated live identity after disconnect.
      try {
        record({ ...lastEvidence, event: 'failure-last-observed-context', sqlstate });
      } catch {
        // A failing evidence callback cannot replace the original installation failure.
      }
    }
    // A server constraint/permission error is an explicit rejection; a lost COMMIT reply is not.
    const serverRejection =
      /^[0-9A-Z]{5}$/.test(sqlstate) && !sqlstate.startsWith('08') && !sqlstate.startsWith('57');
    commitOutcome =
      (stage === 'commit' && !serverRejection) ||
      sqlstate.startsWith('08') ||
      sqlstate.startsWith('CONNECTION') ||
      sqlstate.startsWith('57')
        ? 'unknown'
        : 'not_committed';
    if (commitOutcome === 'not_committed') {
      try {
        const current = await requireInstallationIdentity(pool, installationRoles.migration);
        roleVerified = true;
        record({ ...current, event: 'failure-rolled-back', sqlstate });
      } catch {
        roleVerified = false;
      }
    }
  } finally {
    await pool.end({ timeout: failed ? 0 : 5 });
  }
  if (failed) throw new ControlledMigrationFailure(sqlstate, commitOutcome, true, roleVerified);
  return { applied, skipped };
}
