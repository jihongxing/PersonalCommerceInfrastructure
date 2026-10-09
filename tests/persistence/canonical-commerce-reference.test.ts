import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { getTableConfig } from 'drizzle-orm/pg-core';
import { describe, expect, it } from 'vitest';

import { InMemoryCanonicalCommerceProfileRepository } from '../../adapters/in-memory/in-memory-canonical-commerce-profile-repository.js';
import { InMemoryCanonicalCommerceReferenceRepository } from '../../adapters/in-memory/in-memory-canonical-commerce-reference-repository.js';
import { InMemoryInternalIdentityRepository } from '../../adapters/in-memory/in-memory-internal-identity-repository.js';
import { rehydrateCommerceReferenceRow } from '../../adapters/persistence/postgres/postgres-canonical-commerce-reference-repository.js';
import { commerceReferences } from '../../database/schema/commerce-reference.js';
import {
  createCommerceReference,
  type CommerceReference,
} from '../../modules/identity-infrastructure/commerce-reference-contract.js';
import {
  createAuthenticationAccountId,
  createCommerceProfile,
  createCommerceProfileId,
  createInternalIdentity,
  createInternalIdentityId,
  transitionCommerceProfile,
  type AuthenticationAccountId,
  type CommerceProfileId,
  type InternalIdentityId,
} from '../../modules/identity-infrastructure/identity-contract.js';
import {
  CommerceProfileAlreadyHasReferenceError,
  CommerceProfileNotFoundForReferenceError,
  CommerceReferenceAlreadyExistsError,
  CommerceReferenceLifecycleConflictError,
} from '../../modules/identity-infrastructure/commerce-reference-repository.js';

const createdAt = '2026-08-26T00:00:00.000Z';
const reservedAt = '2026-08-26T01:00:00.000Z';
const referenceA = createCommerceReference('3C7M4Q9RDFHJKNTWVY');
const referenceB = createCommerceReference('4C7M4Q9RDFHJKNTWVY');

describe('canonical Commerce Reference durable persistence', () => {
  it('defines a one-to-one Profile association with canonical durable facts', () => {
    const config = getTableConfig(commerceReferences);

    expect(config.name).toBe('commerce_references');
    expect(config.columns.map((column) => column.name)).toEqual([
      'commerce_reference',
      'commerce_profile_id',
      'lifecycle',
      'assigned_at',
      'created_at',
      'updated_at',
    ]);
    expect(config.foreignKeys).toHaveLength(1);
    expect(config.foreignKeys[0]?.onDelete).toBe('restrict');
    expect(config.uniqueConstraints).toHaveLength(1);
  });

  it('assigns a supplied canonical Reference to one existing Profile and rehydrates it', async () => {
    const { referenceRepository, profileA } = await createFixture();

    await referenceRepository.assign({
      commerceReference: referenceA,
      commerceProfileId: profileA.commerceProfileId,
      assignedAt: createdAt,
    });

    const expected = {
      commerceReference: referenceA,
      commerceProfileId: profileA.commerceProfileId,
      lifecycle: 'ASSIGNED',
      assignedAt: createdAt,
      updatedAt: createdAt,
    } as const;
    await expect(referenceRepository.getByReference(referenceA)).resolves.toEqual(expected);
    await expect(referenceRepository.getByProfileId(profileA.commerceProfileId)).resolves.toEqual(
      expected,
    );
    expect(
      rehydrateCommerceReferenceRow({
        commerceReference: referenceA,
        commerceProfileId: profileA.commerceProfileId,
        lifecycle: 'ASSIGNED',
        assignedAt: createdAt,
        updatedAt: createdAt,
      }),
    ).toEqual(expected);
  });

  it('rejects invalid persisted canonical values and non-canonical lifecycle states', () => {
    expect(() =>
      rehydrateCommerceReferenceRow({
        commerceReference: '3c7m4q9rdfhjkntwvy',
        commerceProfileId: 'profile_a',
        lifecycle: 'ASSIGNED',
        assignedAt: createdAt,
        updatedAt: createdAt,
      }),
    ).toThrow(TypeError);
    expect(() =>
      rehydrateCommerceReferenceRow({
        commerceReference: referenceA,
        commerceProfileId: 'profile_a',
        lifecycle: 'RELEASED',
        assignedAt: createdAt,
        updatedAt: createdAt,
      }),
    ).toThrow('Commerce Reference lifecycle RELEASED is invalid.');
  });

  it('rejects an unknown Profile, duplicate Reference, and second Reference for one Profile', async () => {
    const { referenceRepository, profileA, profileB } = await createFixture();

    await expect(
      referenceRepository.assign({
        commerceReference: referenceA,
        commerceProfileId: createCommerceProfileId('profile_unknown'),
        assignedAt: createdAt,
      }),
    ).rejects.toBeInstanceOf(CommerceProfileNotFoundForReferenceError);

    await referenceRepository.assign({
      commerceReference: referenceA,
      commerceProfileId: profileA.commerceProfileId,
      assignedAt: createdAt,
    });

    await expect(
      referenceRepository.assign({
        commerceReference: referenceA,
        commerceProfileId: profileB.commerceProfileId,
        assignedAt: createdAt,
      }),
    ).rejects.toBeInstanceOf(CommerceReferenceAlreadyExistsError);
    await expect(
      referenceRepository.assign({
        commerceReference: referenceB,
        commerceProfileId: profileA.commerceProfileId,
        assignedAt: createdAt,
      }),
    ).rejects.toBeInstanceOf(CommerceProfileAlreadyHasReferenceError);
  });

  it('allows exactly one winning concurrent assignment for the same Profile', async () => {
    const { referenceRepository, profileA } = await createFixture();

    const results = await Promise.allSettled([
      referenceRepository.assign({
        commerceReference: referenceA,
        commerceProfileId: profileA.commerceProfileId,
        assignedAt: createdAt,
      }),
      referenceRepository.assign({
        commerceReference: referenceB,
        commerceProfileId: profileA.commerceProfileId,
        assignedAt: createdAt,
      }),
    ]);

    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((result) => result.status === 'rejected')).toHaveLength(1);
    await expect(referenceRepository.getByProfileId(profileA.commerceProfileId)).resolves.toBeDefined();
  });

  it('permanently reserves only once and protects the losing conditional update', async () => {
    const { referenceRepository, profileA } = await createFixture();
    await referenceRepository.assign({
      commerceReference: referenceA,
      commerceProfileId: profileA.commerceProfileId,
      assignedAt: createdAt,
    });

    await Promise.all([
      referenceRepository.reserve({ commerceReference: referenceA, updatedAt: reservedAt }),
      expect(
        referenceRepository.reserve({
          commerceReference: referenceA,
          updatedAt: '2026-08-26T02:00:00.000Z',
        }),
      ).rejects.toBeInstanceOf(CommerceReferenceLifecycleConflictError),
    ]);

    await expect(referenceRepository.getByReference(referenceA)).resolves.toEqual({
      commerceReference: referenceA,
      commerceProfileId: profileA.commerceProfileId,
      lifecycle: 'PERMANENTLY_RESERVED',
      assignedAt: createdAt,
      updatedAt: reservedAt,
    });
  });

  it('never reuses a permanently reserved Reference after its Profile is archived', async () => {
    const { profileRepository, referenceRepository, profileA, profileB } = await createFixture();
    await referenceRepository.assign({
      commerceReference: referenceA,
      commerceProfileId: profileA.commerceProfileId,
      assignedAt: createdAt,
    });
    await referenceRepository.reserve({ commerceReference: referenceA, updatedAt: reservedAt });

    const archived = transitionCommerceProfile(
      profileA,
      'ARCHIVED',
      '2026-08-26T02:00:00.000Z',
    );
    await profileRepository.updateLifecycle({
      profileId: archived.commerceProfileId,
      expectedLifecycle: profileA.lifecycle,
      expectedUpdatedAt: profileA.updatedAt,
      nextLifecycle: archived.lifecycle,
      updatedAt: archived.updatedAt,
    });

    await expect(referenceRepository.getByReference(referenceA)).resolves.toMatchObject({
      lifecycle: 'PERMANENTLY_RESERVED',
      commerceProfileId: profileA.commerceProfileId,
    });
    await expect(
      referenceRepository.assign({
        commerceReference: referenceA,
        commerceProfileId: profileB.commerceProfileId,
        assignedAt: '2026-08-26T03:00:00.000Z',
      }),
    ).rejects.toBeInstanceOf(CommerceReferenceAlreadyExistsError);
  });

  it('keeps an assigned Reference unchanged when its Profile is suspended', async () => {
    const { profileRepository, referenceRepository, profileA } = await createFixture();
    await referenceRepository.assign({
      commerceReference: referenceA,
      commerceProfileId: profileA.commerceProfileId,
      assignedAt: createdAt,
    });

    const suspended = transitionCommerceProfile(
      profileA,
      'SUSPENDED',
      '2026-08-26T02:00:00.000Z',
    );
    await profileRepository.updateLifecycle({
      profileId: suspended.commerceProfileId,
      expectedLifecycle: profileA.lifecycle,
      expectedUpdatedAt: profileA.updatedAt,
      nextLifecycle: suspended.lifecycle,
      updatedAt: suspended.updatedAt,
    });

    await expect(referenceRepository.getByReference(referenceA)).resolves.toEqual({
      commerceReference: referenceA,
      commerceProfileId: profileA.commerceProfileId,
      lifecycle: 'ASSIGNED',
      assignedAt: createdAt,
      updatedAt: createdAt,
    });
  });

  it('keeps Reference and target Profile immutable because the repository exposes no update path', async () => {
    const { referenceRepository, profileA } = await createFixture();
    await referenceRepository.assign({
      commerceReference: referenceA,
      commerceProfileId: profileA.commerceProfileId,
      assignedAt: createdAt,
    });

    expect(Object.getOwnPropertyNames(Object.getPrototypeOf(referenceRepository))).not.toEqual(
      expect.arrayContaining(['delete', 'release', 'reassign', 'updateReference', 'updateTarget']),
    );

    await referenceRepository.reserve({ commerceReference: referenceA, updatedAt: reservedAt });
    await expect(referenceRepository.getByReference(referenceA)).resolves.toMatchObject({
      commerceReference: referenceA,
      commerceProfileId: profileA.commerceProfileId,
    });
  });

  it('preserves the Internal Identity to Profile to Reference chain', async () => {
    const { identity, referenceRepository, profileA } = await createFixture();
    await referenceRepository.assign({
      commerceReference: referenceA,
      commerceProfileId: profileA.commerceProfileId,
      assignedAt: createdAt,
    });

    const stored = await referenceRepository.getByReference(referenceA);

    expect(stored?.commerceProfileId).toBe(profileA.commerceProfileId);
    expect(profileA.owningIdentityId).toBe(identity.internalIdentityId);
  });

  it('keeps the Reference namespace nominally isolated from account, identity, and Profile IDs', () => {
    const accountId = createAuthenticationAccountId('account_a');
    const identityId = createInternalIdentityId('identity_a');
    const profileId = createCommerceProfileId('profile_a');

    acceptsCommerceReference(referenceA);

    // @ts-expect-error Authentication Account ID is not a Commerce Reference.
    acceptsCommerceReference(accountId);
    // @ts-expect-error Internal Identity ID is not a Commerce Reference.
    acceptsCommerceReference(identityId);
    // @ts-expect-error Commerce Profile ID is not a Commerce Reference.
    acceptsCommerceReference(profileId);
    // @ts-expect-error Commerce Reference is not an Authentication Account ID.
    acceptsAuthenticationAccountId(referenceA);
    // @ts-expect-error Commerce Reference is not an Internal Identity ID.
    acceptsInternalIdentityId(referenceA);
    // @ts-expect-error Commerce Reference is not a Commerce Profile ID.
    acceptsCommerceProfileId(referenceA);
  });

  it('enforces forward-only durable constraints without unrelated runtime tables or fields', async () => {
    const migration = await readFile(
      resolve('database/migrations/0020_stage2_commerce_reference_core.sql'),
      'utf8',
    );

    expect(migration).toContain('"commerce_reference" varchar(18) PRIMARY KEY NOT NULL');
    expect(migration).toContain('"commerce_profile_id" varchar(128) NOT NULL');
    expect(migration).toContain('UNIQUE ("commerce_profile_id")');
    expect(migration).toContain(
      'FOREIGN KEY ("commerce_profile_id") REFERENCES "public"."commerce_profiles"("commerce_profile_id")',
    );
    expect(migration).toContain('ON DELETE RESTRICT');
    expect(migration).toContain(
      'CHECK ("lifecycle" IN (\'ASSIGNED\', \'PERMANENTLY_RESERVED\'))',
    );
    expect(migration).not.toMatch(
      /\b(identity_id|account_id|resolver|qr_|oauth|external_platform|relationship|token|payment|outbox)\b/iu,
    );
  });
});

async function createFixture() {
  const identityRepository = new InMemoryInternalIdentityRepository();
  const profileRepository = new InMemoryCanonicalCommerceProfileRepository(identityRepository);
  const referenceRepository = new InMemoryCanonicalCommerceReferenceRepository(profileRepository);
  const identity = createInternalIdentity({
    internalIdentityId: createInternalIdentityId('identity_a'),
    createdAt,
  });
  await identityRepository.create(identity);

  const profileA = createProfile('profile_a', identity.internalIdentityId);
  const profileB = createProfile('profile_b', identity.internalIdentityId);
  await profileRepository.create(profileA);
  await profileRepository.create(profileB);

  return { identity, profileRepository, referenceRepository, profileA, profileB };
}

function createProfile(
  profileId: string,
  owningIdentityId: ReturnType<typeof createInternalIdentityId>,
) {
  return createCommerceProfile({
    commerceProfileId: createCommerceProfileId(profileId),
    owningIdentityId,
    presentation: { displayName: `Studio ${profileId}` },
    createdAt,
  });
}

function acceptsCommerceReference(value: CommerceReference): void {
  void value;
}

function acceptsAuthenticationAccountId(value: AuthenticationAccountId): void {
  void value;
}

function acceptsInternalIdentityId(value: InternalIdentityId): void {
  void value;
}

function acceptsCommerceProfileId(value: CommerceProfileId): void {
  void value;
}
