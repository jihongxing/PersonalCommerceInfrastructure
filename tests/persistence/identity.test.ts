import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { getTableConfig } from 'drizzle-orm/pg-core';
import { describe, expect, it } from 'vitest';

import { identities } from '../../database/schema/identity.js';

describe('Identity persistence contract', () => {
  it('defines the independent Identity table without account or legacy ownership', () => {
    const config = getTableConfig(identities);

    expect(config.name).toBe('identities');
    expect(config.columns.map((column) => column.name)).toEqual([
      'identity_id',
      'lifecycle',
      'created_at',
      'updated_at',
    ]);
  });

  it('persists only the approved lifecycle values in the migration contract', async () => {
    const migration = await readFile(
      resolve('database/migrations/0016_stage2_identity_core.sql'),
      'utf8',
    );

    expect(migration).toContain('"identity_id" varchar(128) PRIMARY KEY NOT NULL');
    expect(migration).toContain("CHECK (\"lifecycle\" IN ('ACTIVE', 'SUSPENDED', 'ARCHIVED'))");
    expect(migration).not.toContain('creator_id');
    expect(migration).not.toContain('account_id');
  });
});
