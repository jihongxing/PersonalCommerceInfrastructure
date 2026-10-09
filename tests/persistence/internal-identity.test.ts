import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { getTableConfig } from 'drizzle-orm/pg-core';
import { describe, expect, it } from 'vitest';

import { InMemoryInternalIdentityRepository } from '../../adapters/in-memory/in-memory-internal-identity-repository.js';
import {
  createInternalIdentityService,
  type InternalIdentityClock,
} from '../../applications/internal-identity/internal-identity-service.js';
import { UuidInternalIdentityIdGenerator } from '../../applications/internal-identity/uuid-internal-identity-id-generator.js';
import { rehydrateIdentityRow } from '../../adapters/persistence/postgres/postgres-internal-identity-repository.js';
import {
  createAuthenticationAccountId,
  createCommerceProfileId,
  createInternalIdentity,
  createInternalIdentityId,
  transitionInternalIdentity,
} from '../../modules/identity-infrastructure/identity-contract.js';
import {
  InternalIdentityAlreadyExistsError,
  InternalIdentityConcurrentUpdateError,
  InternalIdentityNotFoundError,
} from '../../modules/identity-infrastructure/internal-identity-repository.js';
import { identities } from '../../database/schema/identity.js';

const createdAt = '2026-08-26T00:00:00.000Z';

describe('Internal Identity durable persistence', () => {
  it('defines a PII-free identity table with the durable fact fields only', () => {
    const config = getTableConfig(identities);

    expect(config.name).toBe('identities');
    expect(config.columns.map((column) => column.name)).toEqual([
      'identity_id',
      'lifecycle',
      'created_at',
      'updated_at',
    ]);
  });

  it('creates and rehydrates the canonical InternalIdentity', async () => {
    const repository = new InMemoryInternalIdentityRepository();
    const identity = createInternalIdentity({
      internalIdentityId: createInternalIdentityId('identity_01'),
      createdAt,
    });

    await repository.create(identity);

    await expect(repository.getById(identity.internalIdentityId)).resolves.toEqual(identity);
    expect(
      rehydrateIdentityRow({
        identityId: identity.internalIdentityId,
        lifecycle: 'ACTIVE',
        createdAt,
        updatedAt: createdAt,
      }),
    ).toEqual(identity);
  });

  it('generates distinct canonical InternalIdentityIds and creates ACTIVE identities', async () => {
    const repository = new InMemoryInternalIdentityRepository();
    const service = createInternalIdentityService({
      repository,
      idGenerator: new UuidInternalIdentityIdGenerator(),
      clock: fixedClock(createdAt),
    });

    const [first, second] = await Promise.all([service.create(), service.create()]);

    expect(first.internalIdentityId).not.toBe(second.internalIdentityId);
    expect(first.lifecycle).toBe('ACTIVE');
    expect(first.createdAt).toBe(createdAt);
    expect(first.updatedAt).toBe(createdAt);
    await expect(repository.exists(first.internalIdentityId)).resolves.toBe(true);
    await expect(repository.exists(second.internalIdentityId)).resolves.toBe(true);
  });

  it('rejects a stored row whose lifecycle is not a canonical domain value', () => {
    expect(() =>
      rehydrateIdentityRow({
        identityId: 'identity_01',
        lifecycle: 'DELETED',
        createdAt,
        updatedAt: createdAt,
      }),
    ).toThrow('Internal Identity lifecycle DELETED is invalid.');
  });

  it('rejects missing and duplicate IDs through explicit repository errors', async () => {
    const repository = new InMemoryInternalIdentityRepository();
    const identity = createInternalIdentity({
      internalIdentityId: createInternalIdentityId('identity_01'),
      createdAt,
    });
    await repository.create(identity);

    await expect(repository.create(identity)).rejects.toBeInstanceOf(InternalIdentityAlreadyExistsError);
    await expect(repository.getById(createInternalIdentityId('identity_missing'))).resolves.toBeUndefined();
    await expect(
      repository.updateLifecycle({
        identityId: createInternalIdentityId('identity_missing'),
        expectedLifecycle: 'ACTIVE',
        nextLifecycle: 'SUSPENDED',
        updatedAt: '2026-08-26T01:00:00.000Z',
      }),
    ).rejects.toBeInstanceOf(InternalIdentityNotFoundError);
  });

  it('persists all canonical lifecycle transitions without changing the ID', async () => {
    const repository = new InMemoryInternalIdentityRepository();
    const identity = createInternalIdentity({
      internalIdentityId: createInternalIdentityId('identity_01'),
      createdAt,
    });
    await repository.create(identity);

    const suspended = transitionInternalIdentity(
      identity,
      'SUSPENDED',
      '2026-08-26T01:00:00.000Z',
    );
    await repository.updateLifecycle({
      identityId: identity.internalIdentityId,
      expectedLifecycle: identity.lifecycle,
      nextLifecycle: suspended.lifecycle,
      updatedAt: suspended.updatedAt,
    });

    await expect(repository.getById(identity.internalIdentityId)).resolves.toEqual(suspended);
    const reactivated = transitionInternalIdentity(
      suspended,
      'ACTIVE',
      '2026-08-26T02:00:00.000Z',
    );
    await repository.updateLifecycle({
      identityId: identity.internalIdentityId,
      expectedLifecycle: suspended.lifecycle,
      nextLifecycle: reactivated.lifecycle,
      updatedAt: reactivated.updatedAt,
    });
    await expect(repository.getById(identity.internalIdentityId)).resolves.toEqual(reactivated);

    const archivedFromActive = transitionInternalIdentity(
      reactivated,
      'ARCHIVED',
      '2026-08-26T02:00:00.000Z',
    );
    expect(() =>
      transitionInternalIdentity(archivedFromActive, 'ACTIVE', '2026-08-26T03:00:00.000Z'),
    ).toThrow();
    expect(() =>
      transitionInternalIdentity(archivedFromActive, 'SUSPENDED', '2026-08-26T03:00:00.000Z'),
    ).toThrow();

    const archivedFromSuspended = transitionInternalIdentity(
      suspended,
      'ARCHIVED',
      '2026-08-26T03:00:00.000Z',
    );
    expect(archivedFromSuspended.lifecycle).toBe('ARCHIVED');
    expect(reactivated.internalIdentityId).toBe(identity.internalIdentityId);
    expect(reactivated.createdAt).toBe(identity.createdAt);
  });

  it('rejects concurrent lifecycle updates after the first conditional update wins', async () => {
    const repository = new InMemoryInternalIdentityRepository();
    const identity = createInternalIdentity({
      internalIdentityId: createInternalIdentityId('identity_01'),
      createdAt,
    });
    await repository.create(identity);

    await Promise.all([
      repository.updateLifecycle({
        identityId: identity.internalIdentityId,
        expectedLifecycle: 'ACTIVE',
        nextLifecycle: 'SUSPENDED',
        updatedAt: '2026-08-26T01:00:00.000Z',
      }),
      expect(
        repository.updateLifecycle({
          identityId: identity.internalIdentityId,
          expectedLifecycle: 'ACTIVE',
          nextLifecycle: 'ARCHIVED',
          updatedAt: '2026-08-26T01:00:00.000Z',
        }),
      ).rejects.toBeInstanceOf(InternalIdentityConcurrentUpdateError),
    ]);
  });

  it('keeps account, internal identity, and commerce profile IDs nominally isolated', () => {
    const accountId = createAuthenticationAccountId('account_01');
    const identityId = createInternalIdentityId('identity_01');
    const profileId = createCommerceProfileId('profile_01');

    expect(accountId).toBe('account_01');
    expect(identityId).toBe('identity_01');
    expect(profileId).toBe('profile_01');
  });

  it('enforces database lifecycle and non-null constraints in the forward-only migration', async () => {
    const migration = await readFile(
      resolve('database/migrations/0016_stage2_identity_core.sql'),
      'utf8',
    );

    expect(migration).toContain('"identity_id" varchar(128) PRIMARY KEY NOT NULL');
    expect(migration).toContain('"lifecycle" varchar(32) DEFAULT \'ACTIVE\' NOT NULL');
    expect(migration).toContain('"created_at" timestamp with time zone DEFAULT now() NOT NULL');
    expect(migration).toContain('"updated_at" timestamp with time zone DEFAULT now() NOT NULL');
    expect(migration).toContain('CHECK ("lifecycle" IN (\'ACTIVE\', \'SUSPENDED\', \'ARCHIVED\'))');
    expect(migration).not.toMatch(
      /\b(email|phone|display_name|brand_name|account_id|commerce_profile|commerce_reference|external_platform)/iu,
    );
  });
});

function fixedClock(now: string): InternalIdentityClock {
  return { now: () => now };
}
