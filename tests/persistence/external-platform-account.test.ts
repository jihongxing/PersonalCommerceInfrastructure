import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { getTableConfig } from 'drizzle-orm/pg-core';
import { describe, expect, it } from 'vitest';

import { InMemoryExternalPlatformAccountRepository } from '../../adapters/in-memory/in-memory-external-platform-account-repository.js';
import { InMemoryCanonicalCommerceProfileRepository } from '../../adapters/in-memory/in-memory-canonical-commerce-profile-repository.js';
import { InMemoryInternalIdentityRepository } from '../../adapters/in-memory/in-memory-internal-identity-repository.js';
import { rehydrateExternalPlatformAccountRow } from '../../adapters/persistence/postgres/postgres-external-platform-account-repository.js';
import { createExternalPlatformAccountService } from '../../applications/external-platform-account/external-platform-account-service.js';
import { externalPlatformAccounts } from '../../database/schema/external-platform-account.js';
import {
  createExternalPlatform,
  createExternalPlatformAccount,
  createExternalPlatformAccountId,
  createExternalPlatformNamespace,
  createPlatformAccountIdentifier,
  transitionExternalPlatformAccount,
  type ExternalPlatformAccountId,
} from '../../modules/identity-infrastructure/external-platform-contract.js';
import {
  ExternalPlatformAccountAlreadyExistsError,
  ExternalPlatformAccountLifecycleConflictError,
  ExternalPlatformAccountNotFoundError,
} from '../../modules/identity-infrastructure/external-platform-account-repository.js';
import {
  createCommerceProfileId,
  createCommerceProfile,
  createInternalIdentity,
  createInternalIdentityId,
  type CommerceProfileId,
  type CommerceReference,
  type InternalIdentityId,
} from '../../modules/identity-infrastructure/identity-contract.js';

const createdAt = '2026-08-26T00:00:00.000Z';

describe('External Platform Account durable persistence', () => {
  it('defines an independent account table with namespace uniqueness and no direct ownership foreign keys', () => {
    const config = getTableConfig(externalPlatformAccounts);

    expect(config.name).toBe('external_platform_accounts');
    expect(config.columns.map((column) => column.name)).toEqual([
      'external_platform_account_id',
      'platform',
      'platform_account_id',
      'lifecycle',
      'created_at',
      'updated_at',
    ]);
    expect(config.foreignKeys).toHaveLength(0);
    expect(config.uniqueConstraints).toHaveLength(1);
    expect(config.uniqueConstraints[0]?.columns.map((column) => column.name)).toEqual([
      'platform',
      'platform_account_id',
    ]);
  });

  it('persists active accounts independently and rehydrates canonical namespace facts', async () => {
    const repository = new InMemoryExternalPlatformAccountRepository();
    const account = createAccount('account_a', 'instagram', 'A');

    await repository.create(account);

    await expect(repository.getById(account.externalPlatformAccountId)).resolves.toEqual(account);
    await expect(
      repository.getByPlatformAccount(
        createExternalPlatformNamespace('instagram'),
        createPlatformAccountIdentifier('A'),
      ),
    ).resolves.toEqual(account);
    await expect(repository.exists(account.externalPlatformAccountId)).resolves.toBe(true);
    expect(
      rehydrateExternalPlatformAccountRow({
        externalPlatformAccountId: account.externalPlatformAccountId,
        platform: 'instagram',
        platformAccountId: 'A',
        lifecycle: 'ACTIVE',
        createdAt,
        updatedAt: createdAt,
      }),
    ).toEqual(account);
  });

  it('generates a separate canonical PCI account ID from explicit platform namespace facts', async () => {
    const repository = new InMemoryExternalPlatformAccountRepository();
    const service = createExternalPlatformAccountService({
      repository,
      idGenerator: {
        generate: () => createExternalPlatformAccountId('pci_external_account_a'),
      },
      clock: { now: () => createdAt },
    });

    const account = await service.register({ platform: ' Instagram ', platformAccountId: 'A' });

    expect(account).toMatchObject({
      externalPlatformAccountId: 'pci_external_account_a',
      platform: { namespace: 'instagram' },
      platformAccountId: 'A',
      lifecycle: 'ACTIVE',
    });
    expect(account.externalPlatformAccountId).not.toBe(account.platformAccountId);
  });

  it('keeps an Account independent beside a persisted Identity and Commerce Profile', async () => {
    const identityRepository = new InMemoryInternalIdentityRepository();
    const profileRepository = new InMemoryCanonicalCommerceProfileRepository(identityRepository);
    const accountRepository = new InMemoryExternalPlatformAccountRepository();
    const identity = createInternalIdentity({
      internalIdentityId: createInternalIdentityId('identity_a'),
      createdAt,
    });
    const profile = createCommerceProfile({
      commerceProfileId: createCommerceProfileId('profile_a'),
      owningIdentityId: identity.internalIdentityId,
      presentation: { displayName: 'Studio North' },
      createdAt,
    });
    const account = createAccount('account_a', 'instagram', 'A');

    await identityRepository.create(identity);
    await profileRepository.create(profile);
    await accountRepository.create(account);

    await expect(profileRepository.getById(profile.commerceProfileId)).resolves.toEqual(profile);
    await expect(accountRepository.getById(account.externalPlatformAccountId)).resolves.toEqual(
      account,
    );
    expect(getTableConfig(externalPlatformAccounts).foreignKeys).toHaveLength(0);
  });

  it('rejects malformed durable rows before they become domain objects', () => {
    expect(() =>
      rehydrateExternalPlatformAccountRow({
        externalPlatformAccountId: 'account_a',
        platform: 'instagram',
        platformAccountId: 'A',
        lifecycle: 'UNKNOWN',
        createdAt,
        updatedAt: createdAt,
      }),
    ).toThrow('External Platform Account lifecycle UNKNOWN is invalid.');
    expect(() =>
      rehydrateExternalPlatformAccountRow({
        externalPlatformAccountId: 'account_a',
        platform: 'Instagram!',
        platformAccountId: 'A',
        lifecycle: 'ACTIVE',
        createdAt,
        updatedAt: createdAt,
      }),
    ).toThrow(TypeError);
  });

  it('allows separate namespace facts but rejects a duplicate platform and account identifier', async () => {
    const repository = new InMemoryExternalPlatformAccountRepository();
    const instagramA = createAccount('account_instagram_a', 'instagram', 'A');
    const instagramB = createAccount('account_instagram_b', 'instagram', 'B');
    const youtubeA = createAccount('account_youtube_a', 'youtube', 'A');

    await repository.create(instagramA);
    await repository.create(instagramB);
    await repository.create(youtubeA);

    await expect(
      repository.create(createAccount('duplicate', 'instagram', 'A')),
    ).rejects.toBeInstanceOf(ExternalPlatformAccountAlreadyExistsError);
    await expect(
      repository.getByPlatformAccount(
        createExternalPlatformNamespace('youtube'),
        createPlatformAccountIdentifier('A'),
      ),
    ).resolves.toEqual(youtubeA);
  });

  it('allows only one winner for concurrent duplicate creation', async () => {
    const repository = new InMemoryExternalPlatformAccountRepository();

    const results = await Promise.allSettled([
      repository.create(createAccount('account_a', 'instagram', 'A')),
      repository.create(createAccount('account_b', 'instagram', 'A')),
    ]);

    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((result) => result.status === 'rejected')).toHaveLength(1);
    assertRejectedWith(results, ExternalPlatformAccountAlreadyExistsError);
  });

  it.each([
    ['ACTIVE', 'SUSPENDED'],
    ['ACTIVE', 'REVOKED'],
    ['SUSPENDED', 'ACTIVE'],
    ['SUSPENDED', 'REVOKED'],
  ] as const)('persists allowed lifecycle transition %s -> %s', async (from, next) => {
    const repository = new InMemoryExternalPlatformAccountRepository();
    const active = createAccount('account_a', 'instagram', 'A');
    await repository.create(active);
    const current =
      from === 'ACTIVE'
        ? active
        : await persistTransition(repository, active, 'SUSPENDED', '2026-08-26T01:00:00.000Z');
    const transitioned = transitionExternalPlatformAccount(
      current,
      next,
      '2026-08-26T02:00:00.000Z',
    );

    await repository.updateLifecycle({
      accountId: current.externalPlatformAccountId,
      expectedLifecycle: current.lifecycle,
      nextLifecycle: transitioned.lifecycle,
      updatedAt: transitioned.updatedAt,
    });

    await expect(repository.getById(active.externalPlatformAccountId)).resolves.toEqual(
      transitioned,
    );
  });

  it('rejects revoked transitions and leaves stored timestamps unchanged', async () => {
    const repository = new InMemoryExternalPlatformAccountRepository();
    const active = createAccount('account_a', 'instagram', 'A');
    await repository.create(active);
    const revoked = await persistTransition(
      repository,
      active,
      'REVOKED',
      '2026-08-26T01:00:00.000Z',
    );

    await expect(
      repository.updateLifecycle({
        accountId: revoked.externalPlatformAccountId,
        expectedLifecycle: 'REVOKED',
        nextLifecycle: 'ACTIVE',
        updatedAt: '2026-08-26T02:00:00.000Z',
      }),
    ).rejects.toThrow('ExternalPlatformAccount cannot perform active from state REVOKED');
    await expect(repository.getById(revoked.externalPlatformAccountId)).resolves.toEqual(revoked);
  });

  it('uses conditional lifecycle mutation so concurrent updates cannot lose each other', async () => {
    const repository = new InMemoryExternalPlatformAccountRepository();
    const active = createAccount('account_a', 'instagram', 'A');
    await repository.create(active);

    const results = await Promise.allSettled([
      repository.updateLifecycle({
        accountId: active.externalPlatformAccountId,
        expectedLifecycle: 'ACTIVE',
        nextLifecycle: 'SUSPENDED',
        updatedAt: '2026-08-26T01:00:00.000Z',
      }),
      repository.updateLifecycle({
        accountId: active.externalPlatformAccountId,
        expectedLifecycle: 'ACTIVE',
        nextLifecycle: 'REVOKED',
        updatedAt: '2026-08-26T02:00:00.000Z',
      }),
    ]);

    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((result) => result.status === 'rejected')).toHaveLength(1);
    assertRejectedWith(results, ExternalPlatformAccountLifecycleConflictError);
    const stored = await repository.getById(active.externalPlatformAccountId);
    expect(stored?.createdAt).toBe(createdAt);
    expect(stored?.updatedAt).toMatch(/^2026-08-26T0[12]:00:00\.000Z$/u);
  });

  it('reports missing account IDs and missing platform namespace facts explicitly', async () => {
    const repository = new InMemoryExternalPlatformAccountRepository();
    const service = createExternalPlatformAccountService({
      repository,
      idGenerator: { generate: () => createExternalPlatformAccountId('unused') },
      clock: { now: () => createdAt },
    });
    const missingAccountId = createExternalPlatformAccountId('account_missing');

    await expect(service.get(missingAccountId)).rejects.toBeInstanceOf(
      ExternalPlatformAccountNotFoundError,
    );
    await expect(
      service.getByPlatformAccount({ platform: 'instagram', platformAccountId: 'missing' }),
    ).rejects.toBeInstanceOf(ExternalPlatformAccountNotFoundError);
    await expect(
      repository.updateLifecycle({
        accountId: missingAccountId,
        expectedLifecycle: 'ACTIVE',
        nextLifecycle: 'SUSPENDED',
        updatedAt: '2026-08-26T01:00:00.000Z',
      }),
    ).rejects.toBeInstanceOf(ExternalPlatformAccountNotFoundError);
  });

  it('keeps External Platform Account IDs isolated from Identity, Profile, and Reference types', () => {
    const accountId = createExternalPlatformAccountId('account_a');
    const identityId = createInternalIdentityId('identity_a');
    const profileId = createCommerceProfileId('profile_a');

    acceptsExternalPlatformAccountId(accountId);
    // @ts-expect-error External Platform Account ID is not an Internal Identity ID.
    acceptsInternalIdentityId(accountId);
    // @ts-expect-error External Platform Account ID is not a Commerce Profile ID.
    acceptsCommerceProfileId(accountId);
    // @ts-expect-error External Platform Account ID is not a Commerce Reference.
    acceptsCommerceReference(accountId);

    void identityId;
    void profileId;
  });

  it('keeps immutable account identity fields out of mutation APIs and migration ownership fields', async () => {
    const repository = new InMemoryExternalPlatformAccountRepository();
    const account = createAccount('account_a', 'instagram', 'A');
    await repository.create(account);
    await persistTransition(repository, account, 'SUSPENDED', '2026-08-26T01:00:00.000Z');

    await expect(repository.getById(account.externalPlatformAccountId)).resolves.toEqual({
      ...account,
      lifecycle: 'SUSPENDED',
      updatedAt: '2026-08-26T01:00:00.000Z',
    });

    const migration = await readFile(
      resolve('database/migrations/0021_stage2_external_platform_account_core.sql'),
      'utf8',
    );
    expect(migration).toContain('"external_platform_account_id" varchar(128) PRIMARY KEY NOT NULL');
    expect(migration).toContain('UNIQUE ("platform", "platform_account_id")');
    expect(migration).toContain("CHECK (\"lifecycle\" IN ('ACTIVE', 'SUSPENDED', 'REVOKED'))");
    expect(migration).not.toMatch(
      /\b(commerce_profile_id|internal_identity_id|commerce_reference|relationship_id|oauth|token|credential|password|session|verification|payment|outbox)\b/iu,
    );
  });
});

function createAccount(accountValue: string, namespace: string, platformAccountValue: string) {
  return createExternalPlatformAccount({
    externalPlatformAccountId: createExternalPlatformAccountId(accountValue),
    platform: createExternalPlatform(createExternalPlatformNamespace(namespace)),
    platformAccountId: createPlatformAccountIdentifier(platformAccountValue),
    createdAt,
  });
}

async function persistTransition(
  repository: InMemoryExternalPlatformAccountRepository,
  account: ReturnType<typeof createAccount>,
  nextLifecycle: 'ACTIVE' | 'SUSPENDED' | 'REVOKED',
  updatedAt: string,
) {
  const transitioned = transitionExternalPlatformAccount(account, nextLifecycle, updatedAt);
  await repository.updateLifecycle({
    accountId: account.externalPlatformAccountId,
    expectedLifecycle: account.lifecycle,
    nextLifecycle: transitioned.lifecycle,
    updatedAt: transitioned.updatedAt,
  });
  return transitioned;
}

function acceptsExternalPlatformAccountId(value: ExternalPlatformAccountId): void {
  void value;
}

function acceptsInternalIdentityId(value: InternalIdentityId): void {
  void value;
}

function acceptsCommerceProfileId(value: CommerceProfileId): void {
  void value;
}

function acceptsCommerceReference(value: CommerceReference): void {
  void value;
}

function assertRejectedWith(
  results: readonly PromiseSettledResult<unknown>[],
  errorType: new (...args: never[]) => Error,
): void {
  const rejected = results.find(
    (result): result is PromiseRejectedResult => result.status === 'rejected',
  );
  expect(rejected).toBeDefined();
  expect(rejected?.reason).toBeInstanceOf(errorType);
}
