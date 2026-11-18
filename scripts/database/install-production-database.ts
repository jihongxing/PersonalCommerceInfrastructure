import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import {
  installationIdentity,
  operationsSchemaProvisioningSql,
  requireInstallation,
  type InstallationSql,
  verifyJournalStructure,
} from './operations-migration-permissions.js';
import {
  databaseName,
  deploymentConnection,
  deploymentRoles as roles,
  internalDatabasePassword,
  phaseRanges,
  type ProductionPhase,
  productionMigrations,
  safeDeploymentFailure,
  verifyProductionHistory,
} from './production-migration-policy.js';
import { deploymentFingerprint } from './production-database-catalog.js';
import { fulfillmentRuntimeGrant, productionRuntimeGrants } from './production-runtime-grants.js';
import {
  productionOperationsDatabaseUrl,
  verifyProductionOperationsRuntime,
} from '../../adapters/persistence/postgres/production-operations-runtime.js';

const childScript = fileURLToPath(new URL('./run-production-migration.js', import.meta.url));
const restrictedRole = 'NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS';
const schemaOwners = [roles.applicationOwner, roles.legacyFixture, roles.table];
const applicationRoles = [roles.api, roles.bff];
const rolePasswords = [
  [roles.migration, 'MIGRATION_DATABASE_URL'],
  [roles.api, 'API_DATABASE_URL'],
  [roles.bff, 'CREATOR_BFF_DATABASE_URL'],
] as const;

async function migrationPhase(phase: ProductionPhase) {
  const code = await new Promise<number | null>((resolve, reject) => {
    const child = spawn(process.execPath, [childScript, phase], {
      env: { MIGRATION_DATABASE_URL: process.env.MIGRATION_DATABASE_URL },
      stdio: ['ignore', 'inherit', 'inherit'],
    });
    child.once('error', reject);
    child.once('close', resolve);
  });
  requireInstallation(code === 0, `migration phase ${phase} failed`);
}

async function bootstrap(tx: InstallationSql, passwords: ReadonlyMap<string, string>) {
  const pristine = await tx<{ valid: boolean }[]>`
    SELECT NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname !~ '^pg_'
      AND nspname NOT IN ('public', 'information_schema', 'pci_deployment'))
      AND NOT EXISTS (SELECT 1 FROM pg_class WHERE relnamespace='public'::regnamespace)
      AND NOT EXISTS (SELECT 1 FROM pg_proc WHERE pronamespace='public'::regnamespace)
      AND NOT EXISTS (SELECT 1 FROM pg_type WHERE typnamespace='public'::regnamespace)
      AND NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname IN ${tx(Object.values(roles).filter((role) => role !== roles.installer))})
      AS valid`;
  requireInstallation(
    pristine[0]?.valid === true,
    'empty-volume marker conflicts with database objects or roles',
  );
  for (const role of [...schemaOwners, roles.function, roles.journal, roles.audit]) {
    await tx`CREATE ROLE ${tx(role)} NOLOGIN ${tx.unsafe(restrictedRole)}`;
  }
  await tx`CREATE ROLE ${tx(roles.runtime)} LOGIN ${tx.unsafe(restrictedRole)}`;
  await tx`CREATE ROLE ${tx(roles.bootstrap)} NOLOGIN ${tx.unsafe(restrictedRole)}`;
  await tx`SET LOCAL log_statement TO 'none'`;
  await tx`SET LOCAL log_min_error_statement TO 'panic'`;
  await tx`SET LOCAL log_parameter_max_length_on_error TO 0`;
  for (const [role, password] of passwords) {
    const literal = await tx<{ value: string }[]>`SELECT quote_literal(${password}::text) AS value`;
    await tx`CREATE ROLE ${tx(role)} LOGIN ${tx.unsafe(restrictedRole)} PASSWORD ${tx.unsafe(literal[0]!.value)}`;
  }

  await tx`REVOKE ALL ON DATABASE ${tx(databaseName)} FROM PUBLIC`;
  await tx`REVOKE CONNECT ON DATABASE postgres, template1 FROM PUBLIC`;
  for (const role of [roles.migration, ...applicationRoles]) {
    await tx`GRANT CONNECT ON DATABASE ${tx(databaseName)} TO ${tx(role)}`;
  }
  await tx`REVOKE ALL ON SCHEMA public FROM PUBLIC`;
  for (const role of [...schemaOwners, roles.function, roles.runtime, ...applicationRoles]) {
    await tx`GRANT USAGE ON SCHEMA public TO ${tx(role)}`;
  }
  for (const owner of schemaOwners) {
    await tx`GRANT CREATE ON SCHEMA public TO ${tx(owner)}`;
    await tx`GRANT ${tx(owner)} TO ${tx(roles.migration)} WITH INHERIT FALSE, SET TRUE`;
  }
  await tx`GRANT ${tx(roles.function)} TO ${tx(roles.migration)} WITH INHERIT FALSE, SET TRUE`;
  await tx.unsafe(operationsSchemaProvisioningSql);
  for (const owner of [...schemaOwners, roles.function]) {
    await tx`ALTER DEFAULT PRIVILEGES FOR ROLE ${tx(owner)} REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC`;
  }
  for (const role of [roles.migration, ...applicationRoles]) {
    await tx`ALTER ROLE ${tx(role)} IN DATABASE ${tx(databaseName)} SET search_path TO public, pg_catalog, pg_temp`;
  }
  await tx`CREATE EXTENSION btree_gist WITH SCHEMA public`;
  await tx`REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC`;
  await tx`GRANT USAGE ON SCHEMA pci_deployment TO ${tx(roles.migration)}`;
  await tx`GRANT INSERT ON pci_deployment.migration_checkpoint TO ${tx(roles.migration)}`;
  await tx`UPDATE pci_deployment.installation SET state='provisioned' WHERE singleton`;
}

async function initializeJournal(connection: ReturnType<typeof deploymentConnection>) {
  const password = randomBytes(32).toString('hex');
  const bootstrapConnection = deploymentConnection(roles.bootstrap, password);
  try {
    await connection.begin(async (tx) => {
      await tx`SET LOCAL log_statement TO 'none'`;
      await tx`SET LOCAL log_min_error_statement TO 'panic'`;
      await tx`SET LOCAL log_parameter_max_length_on_error TO 0`;
      const [credentials] = await tx<{ password: string; expires: string }[]>`
        SELECT quote_literal(${password}::text) AS password,
          quote_literal(clock_timestamp() + interval '5 minutes') AS expires`;
      await tx`ALTER ROLE ${tx(roles.bootstrap)} LOGIN PASSWORD ${tx.unsafe(credentials!.password)} VALID UNTIL ${tx.unsafe(credentials!.expires)}`;
      await tx`GRANT CONNECT ON DATABASE ${tx(databaseName)} TO ${tx(roles.bootstrap)}`;
      await tx`GRANT CREATE ON DATABASE ${tx(databaseName)} TO ${tx(roles.journal)}`;
      await tx`GRANT ${tx(roles.journal)} TO ${tx(roles.bootstrap)} WITH INHERIT FALSE, SET TRUE`;
    });
    await bootstrapConnection.begin(async (tx) => {
      const identity = await installationIdentity(tx);
      requireInstallation(
        identity.database === databaseName &&
          identity.session_user === roles.bootstrap &&
          identity.current_user === roles.bootstrap,
        'independent Journal Bootstrap identity',
      );
      await tx`SET LOCAL ROLE ${tx(roles.journal)}`;
      const [schema] = await tx<{ present: boolean }[]>`
        SELECT to_regnamespace('drizzle') IS NOT NULL AS present`;
      if (!schema?.present) {
        await tx`CREATE SCHEMA drizzle AUTHORIZATION ${tx(roles.journal)}`;
        await tx`CREATE TABLE drizzle.__drizzle_migrations (id serial PRIMARY KEY, hash text NOT NULL, created_at bigint)`;
        await tx`REVOKE ALL ON SCHEMA drizzle FROM PUBLIC`;
        await tx`REVOKE ALL ON TABLE drizzle.__drizzle_migrations FROM PUBLIC`;
        await tx`REVOKE ALL ON SEQUENCE drizzle.__drizzle_migrations_id_seq FROM PUBLIC`;
        await tx`GRANT USAGE ON SCHEMA drizzle TO ${tx(roles.migration)}`;
        await tx`GRANT SELECT, INSERT ON drizzle.__drizzle_migrations TO ${tx(roles.migration)}`;
        await tx`GRANT USAGE ON SEQUENCE drizzle.__drizzle_migrations_id_seq TO ${tx(roles.migration)}`;
      }
      await verifyJournalStructure(tx);
      await verifyHistory(tx, productionMigrations(), 0);
    });
  } finally {
    await bootstrapConnection.end();
    await connection.begin(async (tx) => {
      await tx`ALTER ROLE ${tx(roles.bootstrap)} NOLOGIN PASSWORD NULL VALID UNTIL 'infinity'`;
      await tx`REVOKE CONNECT ON DATABASE ${tx(databaseName)} FROM ${tx(roles.bootstrap)}`;
      await tx`REVOKE CREATE ON DATABASE ${tx(databaseName)} FROM ${tx(roles.journal)}`;
      await tx`REVOKE ${tx(roles.journal)} FROM ${tx(roles.bootstrap)}`;
    });
  }
  const fingerprint = await deploymentFingerprint(connection);
  await connection`UPDATE pci_deployment.installation SET state='installing', fingerprint=${fingerprint} WHERE singleton`;
}

async function verifyHistory(
  connection: InstallationSql,
  migrations: ReturnType<typeof productionMigrations>,
  expectedLength?: number,
) {
  const history = await connection<{ hash: string; created_at: string }[]>`
    SELECT hash, created_at FROM drizzle.__drizzle_migrations ORDER BY id`;
  verifyProductionHistory(history, migrations, expectedLength ?? history.length);
  return history.length;
}

async function verifyLogins(passwords: ReadonlyMap<string, string>) {
  for (const [role, password] of passwords) {
    const connection = deploymentConnection(role, password);
    try {
      const identity = await installationIdentity(connection);
      requireInstallation(
        identity.database === databaseName &&
          identity.current_user === role &&
          identity.session_user === role,
        'database login identity mismatch',
      );
    } finally {
      await connection.end();
    }
  }
}

async function upgradeFulfillmentGrant(tx: InstallationSql) {
  const [grant] = await tx<{ status: boolean; confirmed: boolean }[]>`
    SELECT has_column_privilege(${roles.api}, 'public.commerce_actions', 'fulfillment_status', 'UPDATE') AS status,
      has_column_privilege(${roles.api}, 'public.commerce_actions', 'fulfillment_confirmed_at', 'UPDATE') AS confirmed`;
  requireInstallation(
    grant && grant.status === grant.confirmed,
    'inconsistent fulfillment runtime grant',
  );
  if (grant.status) return;

  await tx.unsafe(fulfillmentRuntimeGrant);
  const fingerprint = await deploymentFingerprint(tx);
  await tx`UPDATE pci_deployment.installation SET fingerprint=${fingerprint} WHERE singleton`;
}

async function finalizeOperationsAccess(tx: InstallationSql, password: string | undefined) {
  await tx`REVOKE CREATE ON SCHEMA public FROM ${tx(roles.applicationOwner)}`;
  if (password === undefined) return;
  const [runtime] = await tx<{ provisioned: boolean }[]>`
    SELECT rolpassword IS NOT NULL AS provisioned FROM pg_authid WHERE rolname=${roles.runtime}`;
  requireInstallation(runtime, 'missing Operations runtime role');
  if (!runtime.provisioned) {
    await tx`SET LOCAL log_statement TO 'none'`;
    await tx`SET LOCAL log_min_error_statement TO 'panic'`;
    await tx`SET LOCAL log_parameter_max_length_on_error TO 0`;
    const [credential] = await tx<{ password: string }[]>`
      SELECT quote_literal(${password}::text) AS password`;
    await tx`ALTER ROLE ${tx(roles.runtime)} PASSWORD ${tx.unsafe(credential!.password)}`;
    await tx`GRANT CONNECT ON DATABASE ${tx(databaseName)} TO ${tx(roles.runtime)}`;
  }
}

async function install() {
  const migrations = productionMigrations();
  const adminPassword = process.env.POSTGRES_PASSWORD;
  requireInstallation(!!adminPassword, 'database installer credential is required');
  const passwords = new Map<string, string>(
    rolePasswords.map(([role, key]) => [role, internalDatabasePassword(process.env[key], role)]),
  );
  const operationsUrl = productionOperationsDatabaseUrl(process.env);
  const operationsPassword =
    operationsUrl === undefined
      ? undefined
      : internalDatabasePassword(operationsUrl, roles.runtime);
  const credentialSet = [
    adminPassword,
    ...passwords.values(),
    ...(operationsPassword === undefined ? [] : [operationsPassword]),
  ];
  requireInstallation(
    new Set(credentialSet).size === credentialSet.length,
    'database roles require distinct credentials',
  );
  const connection = deploymentConnection(roles.installer, adminPassword);
  try {
    const admin = await connection<{ valid: boolean }[]>`
      SELECT d.datname=${databaseName} AND r.rolsuper AND d.datdba=r.oid
        AND session_user=${roles.installer} AND current_setting('server_version_num')::integer BETWEEN 170006 AND 179999 AS valid
      FROM pg_database d JOIN pg_roles r ON r.rolname=current_user WHERE d.datname=current_database()`;
    requireInstallation(admin[0]?.valid === true, 'required PostgreSQL 17 installer identity');
    const lock = await connection<
      { acquired: boolean }[]
    >`SELECT pg_try_advisory_lock(71017212) AS acquired`;
    requireInstallation(lock[0]?.acquired === true, 'another database installer is active');
    const marker = await connection<{ valid: boolean }[]>`
      SELECT n.nspowner=r.oid AND c.relowner=r.oid AND c.relkind='r' AS valid FROM pg_namespace n
      JOIN pg_class c ON c.relnamespace=n.oid JOIN pg_roles r ON r.rolname=current_user
      WHERE n.nspname='pci_deployment' AND c.relname='installation'`;
    requireInstallation(
      marker[0]?.valid === true,
      'no trusted Compose first-boot marker; existing volume is not adopted',
    );
    const rows = await connection<
      { state: string; fingerprint: string | null }[]
    >`SELECT state, fingerprint FROM pci_deployment.installation WHERE singleton`;
    const installed = rows[0];
    requireInstallation(installed, 'missing trusted installation state');
    if (installed.state === 'pending') {
      await connection.begin((tx) => bootstrap(tx, passwords));
    }
    if (installed.state === 'pending' || installed.state === 'provisioned') {
      await initializeJournal(connection);
      process.stdout.write('Production database and Journal Bootstrap committed\n');
    }
    await verifyJournalStructure(connection);
    let count = await verifyHistory(connection, migrations);
    await verifyLogins(passwords);
    if (installed.state === 'ready') {
      requireInstallation(count === migrations.length, 'ready database has incomplete Journal');
      await connection.begin(async (tx) => {
        requireInstallation(
          installed.fingerprint === (await deploymentFingerprint(tx)),
          'existing database owner, schema or privilege drift',
        );
        await upgradeFulfillmentGrant(tx);
        await finalizeOperationsAccess(tx, operationsPassword);
        const fingerprint = await deploymentFingerprint(tx);
        await tx`UPDATE pci_deployment.installation SET fingerprint=${fingerprint} WHERE singleton AND fingerprint IS DISTINCT FROM ${fingerprint}`;
      });
    } else {
      const [checkpoint] =
        count === 0
          ? await connection<
              { fingerprint: string }[]
            >`SELECT fingerprint FROM pci_deployment.installation WHERE singleton`
          : await connection<
              { fingerprint: string }[]
            >`SELECT fingerprint FROM pci_deployment.migration_checkpoint WHERE migration_count=${count}`;
      requireInstallation(
        checkpoint?.fingerprint === (await deploymentFingerprint(connection)),
        'unrecognized migration checkpoint or catalog drift; database left untouched',
      );
      for (const phase of Object.keys(phaseRanges) as ProductionPhase[]) {
        const [start, end] = phaseRanges[phase];
        if (count >= end) continue;
        requireInstallation(count === start, 'unsupported migration phase boundary');
        await migrationPhase(phase);
        count = await verifyHistory(connection, migrations, end);
      }
      await connection.begin(async (tx) => {
        await tx.unsafe(productionRuntimeGrants);
        await finalizeOperationsAccess(tx, operationsPassword);
        await tx`REVOKE INSERT ON pci_deployment.migration_checkpoint FROM ${tx(roles.migration)}`;
        await tx`REVOKE USAGE ON SCHEMA pci_deployment FROM ${tx(roles.migration)}`;
        const fingerprint = await deploymentFingerprint(tx);
        await tx`UPDATE pci_deployment.installation SET state='ready', fingerprint=${fingerprint} WHERE singleton`;
      });
    }
    if (operationsPassword !== undefined) {
      const operations = deploymentConnection(roles.runtime, operationsPassword);
      try {
        await verifyProductionOperationsRuntime(operations);
      } finally {
        await operations.end();
      }
    }
    process.stdout.write('Production database: reviewed history and separated logins verified\n');
  } finally {
    await connection.end();
  }
}

try {
  await install();
} catch (error) {
  process.stderr.write(`Production database stopped: ${safeDeploymentFailure(error)}\n`);
  process.exitCode = 1;
}
