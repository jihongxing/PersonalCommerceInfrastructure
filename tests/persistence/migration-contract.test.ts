import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';

import { getTableConfig } from 'drizzle-orm/pg-core';
import { describe, expect, it } from 'vitest';

import { productEvents } from '../../database/schema/product-events.js';
import { canonicalEventNames } from '../../modules/product-facts/canonical-events.js';

describe('PostgreSQL persistence contract', () => {
  it('maps the canonical event store without creating product tables', () => {
    const config = getTableConfig(productEvents);

    expect(config.name).toBe('product_events');
    expect(config.columns.map((column) => column.name)).toEqual([
      'id',
      'name',
      'occurred_at',
      'actor_id',
      'object_id',
      'correlation_id',
      'source',
      'payload',
      'recorded_at',
    ]);
  });

  it('keeps the migration aligned with the canonical event registry', async () => {
    const migrationsDirectory = resolve('database/migrations');
    const journal = JSON.parse(
      await readFile(resolve(migrationsDirectory, 'meta/_journal.json'), 'utf8'),
    ) as {
      entries: Array<{ tag: string }>;
    };
    const migrationFiles = (await readdir(migrationsDirectory))
      .filter((file) => file.endsWith('.sql'))
      .sort();
    const journalMigrationFiles = journal.entries.map((entry) => `${entry.tag}.sql`);

    expect(migrationFiles).toEqual(journalMigrationFiles);

    const migration = await readFile(
      resolve(migrationsDirectory, journalMigrationFiles[0] as string),
      'utf8',
    );

    for (const eventName of canonicalEventNames) {
      expect(migration).toContain(`'${eventName}'`);
    }
    expect(migration).toContain('product_events_correlation_event_object_unique');
    expect(migration).toContain('product_events_object_occurred_at_idx');
    expect(migration).toContain('product_events_actor_occurred_at_idx');
    expect(migration).not.toMatch(/\b(payment|settlement|refund|marketplace|customer_crm)\b/iu);
  });
});
