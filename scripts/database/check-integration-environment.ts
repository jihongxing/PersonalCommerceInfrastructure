import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import type { Sql } from 'postgres';

import { createPostgresDatabase } from '../../adapters/persistence/postgres/postgres-database.js';

const requiredTables = [
  'identities',
  'commerce_profiles',
  'commerce_references',
  'external_platform_accounts',
  'commerce_relationships',
] as const;

const requiredConstraints = [
  {
    tableName: 'identities',
    type: 'p',
    definitionParts: ['primary key (identity_id)'],
  },
  {
    tableName: 'identities',
    type: 'c',
    definitionParts: ['lifecycle', "'active'", "'suspended'", "'archived'"],
  },
  {
    tableName: 'commerce_profiles',
    type: 'p',
    definitionParts: ['primary key (commerce_profile_id)'],
  },
  {
    tableName: 'commerce_profiles',
    type: 'f',
    definitionParts: ['foreign key (owning_identity_id)', 'on delete restrict'],
    referencedTableName: 'identities',
  },
  {
    tableName: 'commerce_profiles',
    type: 'c',
    definitionParts: ['lifecycle', "'active'", "'suspended'", "'archived'"],
  },
  {
    tableName: 'commerce_references',
    type: 'p',
    definitionParts: ['primary key (commerce_reference)'],
  },
  {
    tableName: 'commerce_references',
    type: 'u',
    definitionParts: ['unique (commerce_profile_id)'],
  },
  {
    tableName: 'commerce_references',
    type: 'f',
    definitionParts: ['foreign key (commerce_profile_id)', 'on delete restrict'],
    referencedTableName: 'commerce_profiles',
  },
  {
    tableName: 'commerce_references',
    type: 'c',
    definitionParts: ['lifecycle', "'assigned'", "'permanently_reserved'"],
  },
  {
    tableName: 'external_platform_accounts',
    type: 'p',
    definitionParts: ['primary key (external_platform_account_id)'],
  },
  {
    tableName: 'external_platform_accounts',
    type: 'u',
    definitionParts: ['unique (platform, platform_account_id)'],
  },
  {
    tableName: 'external_platform_accounts',
    type: 'c',
    definitionParts: ['lifecycle', "'active'", "'suspended'", "'revoked'"],
  },
  {
    tableName: 'commerce_relationships',
    type: 'p',
    definitionParts: ['primary key (commerce_relationship_id)'],
  },
  {
    tableName: 'commerce_relationships',
    type: 'f',
    definitionParts: ['foreign key (external_platform_account_id)', 'on delete restrict'],
    referencedTableName: 'external_platform_accounts',
  },
  {
    tableName: 'commerce_relationships',
    type: 'f',
    definitionParts: ['foreign key (commerce_profile_id)', 'on delete restrict'],
    referencedTableName: 'commerce_profiles',
  },
  {
    tableName: 'commerce_relationships',
    type: 'c',
    definitionParts: ['role', "'owner'", "'manager'", "'delegated_manager'"],
  },
  {
    tableName: 'commerce_relationships',
    type: 'c',
    definitionParts: [
      'lifecycle',
      "'proposed'",
      "'verified'",
      "'active'",
      "'suspended'",
      "'revoked'",
      "'historical'",
    ],
  },
] as const;

export interface IntegrationEnvironmentConfiguration {
  readonly databaseUrl: string;
  readonly databaseName: string;
}

export function loadIntegrationEnvironmentConfiguration(
  environment: NodeJS.ProcessEnv = process.env,
): IntegrationEnvironmentConfiguration {
  const databaseUrl = environment.DATABASE_URL?.trim();
  if (databaseUrl === undefined || databaseUrl.length === 0) {
    throw new Error('DATABASE_URL is required for PostgreSQL integration preflight.');
  }

  if (environment.PCI_INTEGRATION_DATABASE?.trim() !== '1') {
    throw new Error('PCI_INTEGRATION_DATABASE=1 is required for PostgreSQL integration preflight.');
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(databaseUrl);
  } catch {
    throw new Error('DATABASE_URL must be a valid PostgreSQL connection URL.');
  }

  if (parsedUrl.protocol !== 'postgres:' && parsedUrl.protocol !== 'postgresql:') {
    throw new Error('DATABASE_URL must use the PostgreSQL protocol.');
  }

  const databaseName = decodeURIComponent(parsedUrl.pathname).replace(/^\/+/u, '');
  if (databaseName.length === 0 || !databaseName.toLowerCase().includes('integration')) {
    throw new Error(
      'DATABASE_URL must target a dedicated non-production database whose name includes "integration".',
    );
  }

  return { databaseUrl, databaseName };
}

export async function checkPostgresIntegrationEnvironment(
  configuration: IntegrationEnvironmentConfiguration,
): Promise<string> {
  const connection = createPostgresDatabase(configuration.databaseUrl);

  try {
    await connection.checkReadiness();
    const serverVersion = await readServerVersion(connection.client);
    await verifyMigrationState(connection.client);
    await verifyRequiredSchema(connection.client);
    return serverVersion;
  } finally {
    await connection.close();
  }
}

async function readServerVersion(client: Sql): Promise<string> {
  const rows = await client<readonly { readonly serverVersion: string }[]>`
    select current_setting('server_version') as "serverVersion"
  `;
  const serverVersion = rows[0]?.serverVersion;
  if (serverVersion === undefined || serverVersion.length === 0) {
    throw new Error('PostgreSQL server version is unavailable.');
  }
  return serverVersion;
}

async function verifyMigrationState(client: Sql): Promise<void> {
  const expectedMigrationCount = await readExpectedMigrationCount();
  const rows = await client<readonly { readonly count: string }[]>`
    select count(*)::text as "count"
    from drizzle.__drizzle_migrations
  `;
  const appliedMigrationCount = Number(rows[0]?.count);

  if (
    !Number.isInteger(appliedMigrationCount) ||
    appliedMigrationCount !== expectedMigrationCount
  ) {
    throw new Error('PostgreSQL migration state is not current.');
  }
}

async function verifyRequiredSchema(client: Sql): Promise<void> {
  const tableRows = await client<readonly { readonly tableName: string }[]>`
    select table_name as "tableName"
    from information_schema.tables
    where table_schema = 'public'
      and table_name in (
        'identities',
        'commerce_profiles',
        'commerce_references',
        'external_platform_accounts',
        'commerce_relationships'
      )
  `;
  assertExpectedNames(
    requiredTables,
    tableRows.map((row) => row.tableName),
    'required tables',
  );

  const constraintRows = await client<
    readonly {
      readonly tableName: string;
      readonly constraintType: string;
      readonly constraintDefinition: string;
      readonly referencedTableName: string | null;
    }[]
  >`
    select
      source_table.relname as "tableName",
      constraint_row.contype as "constraintType",
      pg_get_constraintdef(constraint_row.oid) as "constraintDefinition",
      referenced_table.relname as "referencedTableName"
    from pg_catalog.pg_constraint as constraint_row
    join pg_catalog.pg_class as source_table
      on source_table.oid = constraint_row.conrelid
    join pg_catalog.pg_namespace as source_namespace
      on source_namespace.oid = source_table.relnamespace
    left join pg_catalog.pg_class as referenced_table
      on referenced_table.oid = constraint_row.confrelid
    where source_namespace.nspname = 'public'
      and source_table.relname in (
        'identities',
        'commerce_profiles',
        'commerce_references',
        'external_platform_accounts',
        'commerce_relationships'
      )
  `;
  assertExpectedConstraints(requiredConstraints, constraintRows);

  const indexRows = await client<
    readonly { readonly indexDefinition: string; readonly isUnique: boolean }[]
  >`
    select
      pg_get_indexdef(indexrelid) as "indexDefinition",
      indisunique as "isUnique"
    from pg_catalog.pg_index
    where indexrelid = 'public.commerce_relationships_one_active_account_unique'::regclass
  `;
  const activeRelationshipIndex = indexRows[0];
  const indexDefinition = activeRelationshipIndex?.indexDefinition;
  if (
    activeRelationshipIndex?.isUnique !== true ||
    indexDefinition === undefined ||
    !/create unique index.*where.*lifecycle.*active/iu.test(indexDefinition)
  ) {
    throw new Error('The active Commerce Relationship partial unique index is unavailable.');
  }
}

async function readExpectedMigrationCount(): Promise<number> {
  const journalPath = resolve('database/migrations/meta/_journal.json');
  const journal = JSON.parse(await readFile(journalPath, 'utf8')) as {
    readonly entries?: readonly unknown[];
  };
  if (journal.entries === undefined || journal.entries.length === 0) {
    throw new Error('Migration journal is unavailable.');
  }
  return journal.entries.length;
}

function assertExpectedNames(
  expectedNames: readonly string[],
  actualNames: readonly string[],
  label: string,
): void {
  const actualNameSet = new Set(actualNames);
  if (expectedNames.some((name) => !actualNameSet.has(name))) {
    throw new Error(`PostgreSQL ${label} are incomplete.`);
  }
}

function assertExpectedConstraints(
  expectedConstraints: readonly {
    readonly tableName: string;
    readonly type: string;
    readonly definitionParts: readonly string[];
    readonly referencedTableName?: string;
  }[],
  actualConstraints: readonly {
    readonly tableName: string;
    readonly constraintType: string;
    readonly constraintDefinition: string;
    readonly referencedTableName: string | null;
  }[],
): void {
  if (
    expectedConstraints.some(
      (expectedConstraint) =>
        !actualConstraints.some((actualConstraint) => {
          const normalizedDefinition = actualConstraint.constraintDefinition.toLowerCase();
          return (
            actualConstraint.tableName === expectedConstraint.tableName &&
            actualConstraint.constraintType === expectedConstraint.type &&
            (expectedConstraint.referencedTableName === undefined ||
              actualConstraint.referencedTableName === expectedConstraint.referencedTableName) &&
            expectedConstraint.definitionParts.every((part) =>
              normalizedDefinition.includes(part.toLowerCase()),
            )
          );
        }),
    )
  ) {
    throw new Error('PostgreSQL required constraints are incomplete.');
  }
}

async function main(): Promise<void> {
  try {
    const configuration = loadIntegrationEnvironmentConfiguration();
    const serverVersion = await checkPostgresIntegrationEnvironment(configuration);
    process.stdout.write(
      `PostgreSQL integration environment preflight passed (server version: ${serverVersion}).\n`,
    );
  } catch {
    process.stderr.write(
      'PostgreSQL integration environment preflight failed. Verify the non-production integration database, DATABASE_URL, PCI_INTEGRATION_DATABASE=1, applied migrations, and required schema without logging credentials.\n',
    );
    process.exitCode = 1;
  }
}

if (
  process.argv[1] !== undefined &&
  import.meta.url === new URL(`file://${process.argv[1]}`).href
) {
  await main();
}
