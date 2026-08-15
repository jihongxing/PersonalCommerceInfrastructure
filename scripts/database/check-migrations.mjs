import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import process from 'node:process';

import { canonicalEventNames } from '../../dist/modules/product-facts/canonical-events.js';

const migrationsDirectory = resolve('database/migrations');
const journalPath = resolve(migrationsDirectory, 'meta/_journal.json');
const journal = JSON.parse(await readFile(journalPath, 'utf8'));
const migrationFiles = (await readdir(migrationsDirectory))
  .filter((file) => file.endsWith('.sql'))
  .sort();
const journalMigrationFiles = journal.entries.map((entry) => `${entry.tag}.sql`);

if (migrationFiles.length === 0) {
  throw new Error('No SQL migrations found.');
}

if (JSON.stringify(migrationFiles) !== JSON.stringify(journalMigrationFiles)) {
  throw new Error(
    `SQL migrations must exactly match the Drizzle journal. SQL: ${migrationFiles.join(', ')}; journal: ${journalMigrationFiles.join(', ')}`,
  );
}

const firstMigration = await readFile(
  resolve(migrationsDirectory, journalMigrationFiles[0]),
  'utf8',
);
const migrationText = (
  await Promise.all(
    journalMigrationFiles.map((migrationFile) =>
      readFile(resolve(migrationsDirectory, migrationFile), 'utf8'),
    ),
  )
).join('\n');

for (const requiredFragment of [
  'CREATE TABLE "product_events"',
  '"id" varchar(128) PRIMARY KEY NOT NULL',
  '"correlation_id" varchar(128) NOT NULL',
  '"payload" jsonb',
  'product_events_correlation_event_object_unique',
  'product_events_object_occurred_at_idx',
  'product_events_actor_occurred_at_idx',
]) {
  if (!firstMigration.includes(requiredFragment)) {
    throw new Error(`Migration is missing required fragment: ${requiredFragment}`);
  }
}

for (const eventName of canonicalEventNames) {
  if (!migrationText.includes(`'${eventName}'`)) {
    throw new Error(`Migration is missing canonical event: ${eventName}`);
  }
}

if (/CREATE TABLE\s+"?(payment|settlement|refund|marketplace|customer_crm)/iu.test(migrationText)) {
  throw new Error('Migration creates a deferred capability table.');
}

process.stdout.write(`Migration check passed: ${journalMigrationFiles.join(', ')}`);
