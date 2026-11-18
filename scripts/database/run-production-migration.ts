import {
  installationIdentity,
  requireInstallation,
  verifyActivationHistoryPrerequisites,
  verifyInstallationRoles,
} from './operations-migration-permissions.js';
import {
  databaseName,
  deploymentConnection,
  deploymentRoles,
  internalDatabasePassword,
  phaseRanges,
  type ProductionPhase,
  productionMigrations,
  productionPhaseRoles,
  safeDeploymentFailure,
  verifyProductionHistory,
} from './production-migration-policy.js';
import { deploymentFingerprint } from './production-database-catalog.js';

async function run(phase: ProductionPhase) {
  const migrations = productionMigrations();
  const password = internalDatabasePassword(
    process.env.MIGRATION_DATABASE_URL,
    deploymentRoles.migration,
  );
  const connection = deploymentConnection(deploymentRoles.migration, password);
  const [start, end] = phaseRanges[phase];
  try {
    await connection.begin(async (tx) => {
      const identity = await installationIdentity(tx);
      requireInstallation(
        identity.database === databaseName &&
          identity.session_user === deploymentRoles.migration &&
          identity.current_user === deploymentRoles.migration,
        'independent production migration identity',
      );
      await verifyInstallationRoles(tx);
      const schemas = await tx<{ valid: boolean }[]>`
        SELECT count(*)=3 AND bool_and(pg_get_userbyid(nspowner)=CASE
          WHEN nspname='drizzle' THEN ${deploymentRoles.journal} ELSE ${deploymentRoles.function} END) AS valid
        FROM pg_namespace WHERE nspname IN ('operations_api', 'operations_private', 'drizzle')`;
      requireInstallation(
        schemas[0]?.valid === true,
        'Bootstrap-owned production schemas are required',
      );
      await tx`SELECT pg_advisory_xact_lock(71017211)`;
      await tx`SET LOCAL search_path TO public, pg_catalog, pg_temp`;
      const history = await tx<{ hash: string; created_at: string }[]>`
        SELECT hash, created_at FROM drizzle.__drizzle_migrations ORDER BY id`;
      verifyProductionHistory(history, migrations, start);
      if (phase === 'activation') {
        await tx`SET LOCAL ROLE ${tx(deploymentRoles.legacyFixture)}`;
        await tx`GRANT MAINTAIN ON public.operations_human_principals, public.operations_accounts TO ${tx(deploymentRoles.table)}`;
        await tx`SET LOCAL ROLE ${tx(deploymentRoles.table)}`;
        await verifyActivationHistoryPrerequisites(tx);
        await tx`RESET ROLE`;
      }

      for (let index = start; index < end; index += 1) {
        const migration = migrations[index]!;
        const roles = productionPhaseRoles(index, migration.sql.length);
        process.stdout.write(`Production migration ${String(index).padStart(4, '0')}\n`);
        for (const [statementIndex, statement] of migration.sql.entries()) {
          await tx`SET LOCAL ROLE ${tx(roles[statementIndex]!)}`;
          await tx.unsafe(statement);
        }
        await tx`RESET ROLE`;
        await tx`INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES (${migration.hash}, ${migration.folderMillis})`;
      }
      if (phase === 'foundation' || phase === 'activation') {
        await tx`SET LOCAL ROLE ${tx(deploymentRoles.legacyFixture)}`;
        if (phase === 'foundation') {
          await tx`GRANT SELECT, REFERENCES, TRIGGER ON public.operations_human_principals, public.operations_accounts TO pci_ops_table_owner`;
          await tx`GRANT SELECT, INSERT ON public.operations_human_principals, public.operations_accounts TO pci_ops_function_owner`;
          await tx`GRANT UPDATE (status) ON public.operations_human_principals TO pci_ops_function_owner`;
        } else {
          await tx`REVOKE MAINTAIN ON public.operations_human_principals, public.operations_accounts FROM ${tx(deploymentRoles.table)}`;
        }
        await tx`RESET ROLE`;
      }
      await tx`SET LOCAL search_path TO pg_catalog, pg_temp`;
      const fingerprint = await deploymentFingerprint(tx);
      await tx`INSERT INTO pci_deployment.migration_checkpoint (migration_count, fingerprint) VALUES (${end}, ${fingerprint})`;
    });
    process.stdout.write(`Production migration phase ${phase} committed\n`);
  } finally {
    await connection.end();
  }
}

const phase = process.argv[2];
try {
  requireInstallation(
    phase !== undefined && Object.hasOwn(phaseRanges, phase),
    'unknown production migration phase',
  );
  await run(phase as ProductionPhase);
} catch (error) {
  process.stderr.write(`Production migration stopped: ${safeDeploymentFailure(error)}\n`);
  process.exitCode = 1;
}
