import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { getTableConfig } from 'drizzle-orm/pg-core';
import { describe, expect, it } from 'vitest';

import { accountIdentityMemberships } from '../../database/schema/account-identity-membership.js';

describe('Account Identity Membership persistence contract', () => {
  it('uses an independent relationship table with no profile or legacy creator ownership', () => {
    const config = getTableConfig(accountIdentityMemberships);

    expect(config.name).toBe('account_identity_memberships');
    expect(config.columns.map((column) => column.name)).toEqual([
      'membership_id',
      'account_id',
      'identity_id',
      'authority',
      'state',
      'created_at',
      'updated_at',
      'revoked_at',
    ]);
    expect(config.columns.map((column) => column.name)).not.toContain('creator_id');
    expect(config.columns.map((column) => column.name)).not.toContain('commerce_profile_id');
  });

  it('enforces the OWNER-only, foreign key, state, and active-owner uniqueness contracts', async () => {
    const migration = await readFile(
      resolve('database/migrations/0017_stage2_account_identity_membership.sql'),
      'utf8',
    );

    expect(migration).toContain('FOREIGN KEY ("identity_id") REFERENCES "public"."identities"');
    expect(migration).toContain('CHECK ("authority" = \'OWNER\')');
    expect(migration).toContain(
      "CHECK (\"state\" IN ('ACTIVE', 'SUSPENDED', 'REVOKED', 'HISTORICAL'))",
    );
    expect(migration).toContain(
      'ON "account_identity_memberships" USING btree ("account_id")',
    );
    expect(migration).toContain('WHERE "state" = \'ACTIVE\'');
    expect(migration).toContain('CHECK (');
  });
});
