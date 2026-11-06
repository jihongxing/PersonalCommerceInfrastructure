import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { getTableConfig } from 'drizzle-orm/pg-core';
import { describe, expect, it } from 'vitest';

import { InMemoryCanonicalCommerceProfileRepository } from '../../adapters/in-memory/in-memory-canonical-commerce-profile-repository.js';
import { InMemoryCommerceRelationshipRepository } from '../../adapters/in-memory/in-memory-commerce-relationship-repository.js';
import { InMemoryExternalPlatformAccountRepository } from '../../adapters/in-memory/in-memory-external-platform-account-repository.js';
import { InMemoryInternalIdentityRepository } from '../../adapters/in-memory/in-memory-internal-identity-repository.js';
import { rehydrateCommerceRelationshipRow } from '../../adapters/persistence/postgres/postgres-commerce-relationship-repository.js';
import { commerceRelationships } from '../../database/schema/commerce-relationship.js';
import {
  createCommerceRelationship,
  createCommerceRelationshipId,
  createExternalPlatform,
  createExternalPlatformAccount,
  createExternalPlatformAccountId,
  createExternalPlatformNamespace,
  createPlatformAccountIdentifier,
  transitionCommerceRelationship,
  type CommerceRelationship,
  type CommerceRelationshipId,
  type ExternalPlatformAccountId,
} from '../../modules/identity-infrastructure/external-platform-contract.js';
import {
  ActiveCommerceRelationshipConflictError,
  CommerceRelationshipAccountNotFoundError,
  CommerceRelationshipLifecycleConflictError,
  CommerceRelationshipProfileNotFoundError,
} from '../../modules/identity-infrastructure/commerce-relationship-repository.js';
import {
  createCommerceProfile,
  createCommerceProfileId,
  createInternalIdentity,
  createInternalIdentityId,
  type CommerceProfileId,
  type CommerceReference,
  type InternalIdentityId,
} from '../../modules/identity-infrastructure/identity-contract.js';

const createdAt = '2026-08-26T00:00:00.000Z';

describe('Commerce Relationship durable persistence', () => {
  it('defines restrictive Account/Profile foreign keys, canonical constraints, and active uniqueness', () => {
    const config = getTableConfig(commerceRelationships);

    expect(config.name).toBe('commerce_relationships');
    expect(config.columns.map((column) => column.name)).toEqual([
      'commerce_relationship_id',
      'external_platform_account_id',
      'commerce_profile_id',
      'role',
      'provenance',
      'lifecycle',
      'effective_at',
      'created_at',
      'updated_at',
    ]);
    expect(config.foreignKeys).toHaveLength(2);
    expect(config.foreignKeys.map((foreignKey) => foreignKey.onDelete)).toEqual([
      'restrict',
      'restrict',
    ]);
    expect(config.indexes.map((index) => index.config.name)).toContain(
      'commerce_relationships_one_active_account_unique',
    );
  });

  it('creates a valid PROPOSED relationship and rehydrates canonical durable facts', async () => {
    const fixture = await createFixture();
    const relationship = createRelationship({
      relationshipId: 'relationship_a',
      accountId: fixture.accountA.externalPlatformAccountId,
      profileId: fixture.profileA.commerceProfileId,
      role: 'OWNER',
    });

    await fixture.relationships.create(relationship);

    await expect(
      fixture.relationships.getById(relationship.commerceRelationshipId),
    ).resolves.toEqual(relationship);
    expect(
      rehydrateCommerceRelationshipRow({
        commerceRelationshipId: relationship.commerceRelationshipId,
        externalPlatformAccountId: relationship.externalPlatformAccountId,
        commerceProfileId: relationship.commerceProfileId,
        role: 'OWNER',
        provenance: 'SELF_DECLARED',
        lifecycle: 'PROPOSED',
        effectiveAt: relationship.effectiveAt,
        createdAt,
        updatedAt: createdAt,
      }),
    ).toEqual(relationship);
  });

  it('rejects unknown Account and Profile facts without auto-creating either aggregate', async () => {
    const fixture = await createFixture();

    await expect(
      fixture.relationships.create(
        createRelationship({
          relationshipId: 'relationship_unknown_account',
          accountId: createExternalPlatformAccountId('account_unknown'),
          profileId: fixture.profileA.commerceProfileId,
          role: 'OWNER',
        }),
      ),
    ).rejects.toBeInstanceOf(CommerceRelationshipAccountNotFoundError);

    await expect(
      fixture.relationships.create(
        createRelationship({
          relationshipId: 'relationship_unknown_profile',
          accountId: fixture.accountA.externalPlatformAccountId,
          profileId: createCommerceProfileId('profile_unknown'),
          role: 'OWNER',
        }),
      ),
    ).rejects.toBeInstanceOf(CommerceRelationshipProfileNotFoundError);
  });

  it.each(['OWNER', 'MANAGER', 'DELEGATED_MANAGER'] as const)(
    'persists approved role %s as an immutable relationship fact',
    async (role) => {
      const fixture = await createFixture();
      const relationship = createRelationship({
        relationshipId: `relationship_${role.toLowerCase()}`,
        accountId: fixture.accountA.externalPlatformAccountId,
        profileId: fixture.profileA.commerceProfileId,
        role,
      });

      await fixture.relationships.create(relationship);
      await activate(fixture.relationships, relationship, '2026-08-26T01:00:00.000Z');

      await expect(
        fixture.relationships.getById(relationship.commerceRelationshipId),
      ).resolves.toMatchObject({
        externalPlatformAccountId: relationship.externalPlatformAccountId,
        commerceProfileId: relationship.commerceProfileId,
        role,
        effectiveAt: relationship.effectiveAt,
        createdAt: relationship.createdAt,
      });
    },
  );

  it('rejects non-canonical role and lifecycle rows during rehydration', () => {
    const row = {
      commerceRelationshipId: 'relationship_a',
      externalPlatformAccountId: 'account_a',
      commerceProfileId: 'profile_a',
      role: 'INVALID',
      lifecycle: 'PROPOSED',
      effectiveAt: createdAt,
      createdAt,
      updatedAt: createdAt,
    };

    expect(() => rehydrateCommerceRelationshipRow(row)).toThrow(
      'Commerce Relationship role is invalid.',
    );
    expect(() =>
      rehydrateCommerceRelationshipRow({ ...row, role: 'OWNER', lifecycle: 'INVALID' }),
    ).toThrow('Commerce Relationship lifecycle INVALID is invalid.');
  });

  it('persists canonical lifecycle transitions and rejects revoked reactivation', async () => {
    const fixture = await createFixture();
    const proposed = createRelationship({
      relationshipId: 'relationship_a',
      accountId: fixture.accountA.externalPlatformAccountId,
      profileId: fixture.profileA.commerceProfileId,
      role: 'OWNER',
    });
    await fixture.relationships.create(proposed);

    const verified = await transition(
      fixture.relationships,
      proposed,
      'VERIFIED',
      '2026-08-26T01:00:00.000Z',
    );
    const active = await transition(
      fixture.relationships,
      verified,
      'ACTIVE',
      '2026-08-26T02:00:00.000Z',
    );
    const suspended = await transition(
      fixture.relationships,
      active,
      'SUSPENDED',
      '2026-08-26T03:00:00.000Z',
    );
    const reactivated = await transition(
      fixture.relationships,
      suspended,
      'ACTIVE',
      '2026-08-26T04:00:00.000Z',
    );
    const revoked = await transition(
      fixture.relationships,
      reactivated,
      'REVOKED',
      '2026-08-26T05:00:00.000Z',
    );
    const historical = await transition(
      fixture.relationships,
      revoked,
      'HISTORICAL',
      '2026-08-26T06:00:00.000Z',
    );

    expect(historical.lifecycle).toBe('HISTORICAL');
    await expect(
      fixture.relationships.updateLifecycle({
        relationshipId: historical.commerceRelationshipId,
        expectedLifecycle: 'HISTORICAL',
        nextLifecycle: 'ACTIVE',
        updatedAt: '2026-08-26T07:00:00.000Z',
      }),
    ).rejects.toThrow('CommerceRelationship cannot perform active from state HISTORICAL');
  });

  it('allows only one ACTIVE relationship per Account despite concurrent activation attempts', async () => {
    const fixture = await createFixture();
    const first = createRelationship({
      relationshipId: 'relationship_a',
      accountId: fixture.accountA.externalPlatformAccountId,
      profileId: fixture.profileA.commerceProfileId,
      role: 'OWNER',
    });
    const second = createRelationship({
      relationshipId: 'relationship_b',
      accountId: fixture.accountA.externalPlatformAccountId,
      profileId: fixture.profileB.commerceProfileId,
      role: 'MANAGER',
    });
    await fixture.relationships.create(first);
    await fixture.relationships.create(second);
    const [firstVerified, secondVerified] = await Promise.all([
      transition(fixture.relationships, first, 'VERIFIED', '2026-08-26T01:00:00.000Z'),
      transition(fixture.relationships, second, 'VERIFIED', '2026-08-26T01:00:00.000Z'),
    ]);

    const results = await Promise.allSettled([
      fixture.relationships.updateLifecycle({
        relationshipId: firstVerified.commerceRelationshipId,
        expectedLifecycle: 'VERIFIED',
        nextLifecycle: 'ACTIVE',
        updatedAt: '2026-08-26T02:00:00.000Z',
      }),
      fixture.relationships.updateLifecycle({
        relationshipId: secondVerified.commerceRelationshipId,
        expectedLifecycle: 'VERIFIED',
        nextLifecycle: 'ACTIVE',
        updatedAt: '2026-08-26T02:00:00.000Z',
      }),
    ]);

    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((result) => result.status === 'rejected')).toHaveLength(1);
    assertRejectedWith(results, ActiveCommerceRelationshipConflictError);
    await expect(
      fixture.relationships.getActiveByExternalPlatformAccount(first.externalPlatformAccountId),
    ).resolves.toMatchObject({ lifecycle: 'ACTIVE' });
  });

  it('preserves historical binding and permits a new active relationship for the same Account', async () => {
    const fixture = await createFixture();
    const oldRelationship = createRelationship({
      relationshipId: 'relationship_old',
      accountId: fixture.accountA.externalPlatformAccountId,
      profileId: fixture.profileA.commerceProfileId,
      role: 'OWNER',
      effectiveAt: '2026-08-26T01:00:00.000Z',
    });
    await fixture.relationships.create(oldRelationship);
    const oldActive = await activate(
      fixture.relationships,
      oldRelationship,
      '2026-08-26T02:00:00.000Z',
    );
    const oldSuspended = await transition(
      fixture.relationships,
      oldActive,
      'SUSPENDED',
      '2026-08-26T03:00:00.000Z',
    );
    const historical = await transition(
      fixture.relationships,
      oldSuspended,
      'HISTORICAL',
      '2026-08-26T04:00:00.000Z',
    );
    const replacement = createRelationship({
      relationshipId: 'relationship_new',
      accountId: fixture.accountA.externalPlatformAccountId,
      profileId: fixture.profileB.commerceProfileId,
      role: 'MANAGER',
      effectiveAt: '2026-08-26T05:00:00.000Z',
    });
    await fixture.relationships.create(replacement);
    const activeReplacement = await activate(
      fixture.relationships,
      replacement,
      '2026-08-26T06:00:00.000Z',
    );

    await expect(
      fixture.relationships.listByExternalPlatformAccount(
        fixture.accountA.externalPlatformAccountId,
      ),
    ).resolves.toEqual([historical, activeReplacement]);
    await expect(
      fixture.relationships.listByCommerceProfile(fixture.profileA.commerceProfileId),
    ).resolves.toEqual([historical]);
    expect(historical).toMatchObject({
      commerceProfileId: fixture.profileA.commerceProfileId,
      role: 'OWNER',
      effectiveAt: '2026-08-26T01:00:00.000Z',
      createdAt,
      lifecycle: 'HISTORICAL',
    });
  });

  it('allows one Profile to relate to multiple Accounts in the same platform namespace', async () => {
    const fixture = await createFixture();
    const secondAccount = createAccount('account_b', 'instagram', 'B');
    await fixture.accounts.create(secondAccount);
    const first = createRelationship({
      relationshipId: 'relationship_a',
      accountId: fixture.accountA.externalPlatformAccountId,
      profileId: fixture.profileA.commerceProfileId,
      role: 'OWNER',
    });
    const second = createRelationship({
      relationshipId: 'relationship_b',
      accountId: secondAccount.externalPlatformAccountId,
      profileId: fixture.profileA.commerceProfileId,
      role: 'MANAGER',
      effectiveAt: '2026-08-26T01:00:00.000Z',
    });
    await fixture.relationships.create(first);
    await fixture.relationships.create(second);

    await expect(
      fixture.relationships.listByCommerceProfile(fixture.profileA.commerceProfileId),
    ).resolves.toEqual([first, second]);
  });

  it('uses conditional lifecycle writes so a losing transition does not mutate history timestamps', async () => {
    const fixture = await createFixture();
    const proposed = createRelationship({
      relationshipId: 'relationship_a',
      accountId: fixture.accountA.externalPlatformAccountId,
      profileId: fixture.profileA.commerceProfileId,
      role: 'OWNER',
    });
    await fixture.relationships.create(proposed);
    const verified = await transition(
      fixture.relationships,
      proposed,
      'VERIFIED',
      '2026-08-26T01:00:00.000Z',
    );
    const active = await transition(
      fixture.relationships,
      verified,
      'ACTIVE',
      '2026-08-26T02:00:00.000Z',
    );

    const results = await Promise.allSettled([
      fixture.relationships.updateLifecycle({
        relationshipId: active.commerceRelationshipId,
        expectedLifecycle: 'ACTIVE',
        nextLifecycle: 'SUSPENDED',
        updatedAt: '2026-08-26T03:00:00.000Z',
      }),
      fixture.relationships.updateLifecycle({
        relationshipId: active.commerceRelationshipId,
        expectedLifecycle: 'ACTIVE',
        nextLifecycle: 'REVOKED',
        updatedAt: '2026-08-26T04:00:00.000Z',
      }),
    ]);

    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((result) => result.status === 'rejected')).toHaveLength(1);
    assertRejectedWith(results, CommerceRelationshipLifecycleConflictError);
    const stored = await fixture.relationships.getById(active.commerceRelationshipId);
    expect(stored).toMatchObject({
      commerceRelationshipId: active.commerceRelationshipId,
      externalPlatformAccountId: active.externalPlatformAccountId,
      commerceProfileId: active.commerceProfileId,
      role: active.role,
      effectiveAt: active.effectiveAt,
      createdAt,
    });
    expect(stored?.updatedAt).toMatch(/^2026-08-26T0[34]:00:00\.000Z$/u);
  });

  it('keeps Relationship IDs isolated from Account, Profile, Identity, and Reference IDs', () => {
    const relationshipId = createCommerceRelationshipId('relationship_a');

    acceptsCommerceRelationshipId(relationshipId);
    // @ts-expect-error Commerce Relationship ID is not an External Platform Account ID.
    acceptsExternalPlatformAccountId(relationshipId);
    // @ts-expect-error Commerce Relationship ID is not a Commerce Profile ID.
    acceptsCommerceProfileId(relationshipId);
    // @ts-expect-error Commerce Relationship ID is not an Internal Identity ID.
    acceptsInternalIdentityId(relationshipId);
    // @ts-expect-error Commerce Relationship ID is not a Commerce Reference.
    acceptsCommerceReference(relationshipId);
  });

  it('keeps immutable relationship facts out of ordinary mutation APIs and migration scope', async () => {
    const fixture = await createFixture();
    const relationship = createRelationship({
      relationshipId: 'relationship_a',
      accountId: fixture.accountA.externalPlatformAccountId,
      profileId: fixture.profileA.commerceProfileId,
      role: 'OWNER',
    });
    await fixture.relationships.create(relationship);
    await activate(fixture.relationships, relationship, '2026-08-26T01:00:00.000Z');

    const migration = await readFile(
      resolve('database/migrations/0022_stage2_commerce_relationship_core.sql'),
      'utf8',
    );
    expect(migration).toContain('FOREIGN KEY ("external_platform_account_id")');
    expect(migration).toContain('FOREIGN KEY ("commerce_profile_id")');
    expect(migration).toContain("CHECK (\"role\" IN ('OWNER', 'MANAGER', 'DELEGATED_MANAGER'))");
    expect(migration).toContain(
      "CHECK (\"lifecycle\" IN ('PROPOSED', 'VERIFIED', 'ACTIVE', 'SUSPENDED', 'REVOKED', 'HISTORICAL'))",
    );
    expect(migration).toContain(
      'CREATE UNIQUE INDEX "commerce_relationships_one_active_account_unique"',
    );
    expect(migration).toContain('WHERE "lifecycle" = \'ACTIVE\'');
    expect(migration).not.toMatch(
      /\b(internal_identity_id|commerce_reference|oauth|token|credential|password|session|verification|payment|outbox|cascade)\b/iu,
    );
  });
});

async function createFixture() {
  const identities = new InMemoryInternalIdentityRepository();
  const profiles = new InMemoryCanonicalCommerceProfileRepository(identities);
  const accounts = new InMemoryExternalPlatformAccountRepository();
  const relationships = new InMemoryCommerceRelationshipRepository(accounts, profiles);
  const identity = createInternalIdentity({
    internalIdentityId: createInternalIdentityId('identity_a'),
    createdAt,
  });
  const profileA = createCommerceProfile({
    commerceProfileId: createCommerceProfileId('profile_a'),
    owningIdentityId: identity.internalIdentityId,
    presentation: { displayName: 'Studio A' },
    createdAt,
  });
  const profileB = createCommerceProfile({
    commerceProfileId: createCommerceProfileId('profile_b'),
    owningIdentityId: identity.internalIdentityId,
    presentation: { displayName: 'Studio B' },
    createdAt,
  });
  const accountA = createAccount('account_a', 'instagram', 'A');

  await identities.create(identity);
  await profiles.create(profileA);
  await profiles.create(profileB);
  await accounts.create(accountA);

  return { accounts, relationships, profileA, profileB, accountA };
}

function createAccount(accountId: string, platform: string, platformAccountId: string) {
  return createExternalPlatformAccount({
    externalPlatformAccountId: createExternalPlatformAccountId(accountId),
    platform: createExternalPlatform(createExternalPlatformNamespace(platform)),
    platformAccountId: createPlatformAccountIdentifier(platformAccountId),
    createdAt,
  });
}

function createRelationship(input: {
  readonly relationshipId: string;
  readonly accountId: ExternalPlatformAccountId;
  readonly profileId: CommerceProfileId;
  readonly role: CommerceRelationship['role'];
  readonly effectiveAt?: string;
}) {
  return createCommerceRelationship({
    commerceRelationshipId: createCommerceRelationshipId(input.relationshipId),
    externalPlatformAccountId: input.accountId,
    commerceProfileId: input.profileId,
    role: input.role,
    effectiveAt: input.effectiveAt ?? createdAt,
    createdAt,
  });
}

async function activate(
  repository: InMemoryCommerceRelationshipRepository,
  relationship: CommerceRelationship,
  updatedAt: string,
): Promise<CommerceRelationship> {
  const verified = await transition(repository, relationship, 'VERIFIED', updatedAt);
  return transition(repository, verified, 'ACTIVE', updatedAt);
}

async function transition(
  repository: InMemoryCommerceRelationshipRepository,
  relationship: CommerceRelationship,
  lifecycle: CommerceRelationship['lifecycle'],
  updatedAt: string,
): Promise<CommerceRelationship> {
  const updated = transitionCommerceRelationship({
    relationship,
    lifecycle,
    updatedAt,
    relationships: await repository.listByExternalPlatformAccount(
      relationship.externalPlatformAccountId,
    ),
  });
  await repository.updateLifecycle({
    relationshipId: relationship.commerceRelationshipId,
    expectedLifecycle: relationship.lifecycle,
    nextLifecycle: updated.lifecycle,
    updatedAt: updated.updatedAt,
  });
  return updated;
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

function acceptsCommerceRelationshipId(value: CommerceRelationshipId): void {
  void value;
}

function acceptsExternalPlatformAccountId(value: ExternalPlatformAccountId): void {
  void value;
}

function acceptsCommerceProfileId(value: CommerceProfileId): void {
  void value;
}

function acceptsInternalIdentityId(value: InternalIdentityId): void {
  void value;
}

function acceptsCommerceReference(value: CommerceReference): void {
  void value;
}
