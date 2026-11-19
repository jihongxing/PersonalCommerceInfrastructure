import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { readMigrationFiles } from 'drizzle-orm/migrator';
import postgres from 'postgres';
import {
  InstallationContractError,
  installationRoles,
  requireInstallation,
} from './operations-migration-permissions.js';
import { activationHistoryRoles, initialAdminRoles } from './operations-migration-phases.js';

export const databaseName = 'personal_commerce';
export const deploymentRoles = {
  ...installationRoles,
  installer: databaseName,
  applicationOwner: 'pci_app_object_owner',
  api: 'pci_api_runtime',
  bff: 'pci_creator_bff_runtime',
  audit: 'pci_ops_audit_reader',
} as const;

export const phaseRanges = {
  foundation: [0, 40],
  activation: [40, 41],
  finish: [41, 45],
} as const;

export type ProductionPhase = keyof typeof phaseRanges;
export const membershipMigrationIndex = 43;
export const previousFinalMigrationIndex = membershipMigrationIndex;
export const previousFinalMigrationCount = previousFinalMigrationIndex + 1;

export function supportsReadyMigrationCount(count: number, total: number): boolean {
  return count === total || count === previousFinalMigrationIndex || count === previousFinalMigrationCount;
}

const migrationFolder = 'database/migrations';
const reviewedManifest = '308cb862603fe5b7e890fa601508f697b1a18a7b60631bc0dac9d922233720d1';
const historicalCrlfMigrationCount = 43;

export function productionMigrations(migrationsFolder = migrationFolder) {
  const journal = JSON.parse(readFileSync(`${migrationsFolder}/meta/_journal.json`, 'utf8')) as {
    entries: { idx: number; tag: string; when: number }[];
  };
  const migrations = readMigrationFiles({ migrationsFolder }).map((migration, index) => {
    const sql = migration.sql.join('--> statement-breakpoint').replaceAll('\r\n', '\n');
    requireInstallation(!sql.includes('\r'), 'unsupported production migration line ending');
    const historicalSql = index < historicalCrlfMigrationCount ? sql.replaceAll('\n', '\r\n') : sql;
    return {
      ...migration,
      sql: sql.split('--> statement-breakpoint'),
      hash: createHash('sha256').update(historicalSql).digest('hex'),
    };
  });
  const identity = journal.entries.map(
    (entry, index) => `${entry.idx}:${entry.tag}:${entry.when}:${migrations[index]?.hash}`,
  );
  requireInstallation(
    createHash('sha256').update(identity.join('\n')).digest('hex') === reviewedManifest,
    'unreviewed production migration manifest',
  );
  return migrations;
}

export function verifyProductionHistory(
  history: readonly { hash: string; created_at: string | number }[],
  migrations: ReturnType<typeof productionMigrations>,
  expectedLength: number,
) {
  requireInstallation(history.length === expectedLength, 'unexpected production Journal size');
  for (const [index, row] of history.entries()) {
    const migration = migrations[index];
    requireInstallation(
      row.hash === migration?.hash && Number(row.created_at) === migration.folderMillis,
      `production Journal differs from reviewed history at index ${index}`,
    );
  }
}

export function productionPhaseRoles(index: number, statementCount: number): readonly string[] {
  if (index === 40 || index === 41) {
    const roles = index === 40 ? activationHistoryRoles : initialAdminRoles;
    requireInstallation(roles.length === statementCount, 'reviewed Operations chunk count');
    return roles;
  }
  const owner =
    index >= 36 && index <= 39 ? deploymentRoles.legacyFixture : deploymentRoles.applicationOwner;
  return Array.from({ length: statementCount }, () => owner);
}

export function internalDatabasePassword(value: string | undefined, role: string): string {
  let parsed: URL;
  try {
    parsed = new URL(value ?? '');
  } catch {
    throw new InstallationContractError('database URL is missing or invalid');
  }
  requireInstallation(
    ['postgres:', 'postgresql:'].includes(parsed.protocol) &&
      parsed.hostname === 'postgres' &&
      parsed.port === '5432' &&
      parsed.pathname === `/${databaseName}` &&
      parsed.username === role &&
      !parsed.search &&
      !parsed.hash &&
      !!parsed.password,
    'database URL must use its required independent role on the internal Compose database',
  );
  try {
    return decodeURIComponent(parsed.password);
  } catch {
    throw new InstallationContractError('database URL password encoding is invalid');
  }
}

export function deploymentConnection(username: string, password: string) {
  return postgres({
    host: 'postgres',
    port: 5432,
    database: databaseName,
    username,
    password,
    max: 1,
    prepare: false,
    connect_timeout: 5,
    connection: { search_path: 'pg_catalog, pg_temp' },
    onnotice: () => undefined,
  });
}

export function safeDeploymentFailure(error: unknown): string {
  if (error instanceof InstallationContractError) return error.rule;
  if (error instanceof postgres.PostgresError && /^[A-Z0-9]{5}$/.test(error.code)) {
    return `PostgreSQL SQLSTATE ${error.code}`;
  }
  return 'database step failed (details withheld to protect credentials)';
}
