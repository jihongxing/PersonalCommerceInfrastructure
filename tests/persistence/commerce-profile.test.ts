import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { getTableConfig } from 'drizzle-orm/pg-core';
import { describe, expect, it } from 'vitest';

import { commerceProfiles } from '../../database/schema/commerce-profile.js';

describe('Commerce Profile persistence contract', () => {
  it('uses an independent canonical Profile table anchored to exactly one Internal Identity', () => {
    const config = getTableConfig(commerceProfiles);

    expect(config.name).toBe('commerce_profiles');
    expect(config.columns.map((column) => column.name)).toEqual([
      'commerce_profile_id',
      'owning_identity_id',
      'lifecycle',
      'display_name',
      'created_at',
      'updated_at',
    ]);
    expect(config.columns.map((column) => column.name)).not.toContain('creator_id');
    expect(config.columns.map((column) => column.name)).not.toContain('account_id');
    expect(config.columns.map((column) => column.name)).not.toContain('commerce_id');
    expect(config.columns.map((column) => column.name)).not.toContain('platform_account_id');
  });

  it('enforces the formal Identity foreign key and canonical Profile lifecycle values', async () => {
    const migration = await readFile(
      resolve('database/migrations/0018_stage2_commerce_profile_core.sql'),
      'utf8',
    );

    expect(migration).toContain(
      'FOREIGN KEY ("owning_identity_id") REFERENCES "public"."identities"("identity_id")',
    );
    expect(migration).toContain("CHECK (\"lifecycle\" IN ('ACTIVE', 'SUSPENDED', 'ARCHIVED'))");
    expect(migration).toContain('ON DELETE RESTRICT');
  });
});
