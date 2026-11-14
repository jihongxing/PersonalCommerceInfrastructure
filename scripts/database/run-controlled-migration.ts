import { migrateWithRoleContext, ControlledMigrationFailure } from './migrate-with-role-context.js';
try {
  const url = process.env.PCI_MIGRATION_DATABASE_URL;
  const folder = process.argv[2];
  if (!url || !folder) throw new Error('Missing controlled migration input.');
  const result = await migrateWithRoleContext(url, folder, (event) =>
    console.log(JSON.stringify(event)),
  );
  console.log(JSON.stringify({ event: 'confirmed-success', ...result }));
} catch (error) {
  console.error(
    JSON.stringify({
      event: 'failed',
      sqlstate: error instanceof ControlledMigrationFailure ? error.sqlstate : 'CLIENT_ERROR',
      commitOutcome:
        error instanceof ControlledMigrationFailure ? error.commitOutcome : 'not_committed',
    }),
  );
  process.exitCode = 1;
}
