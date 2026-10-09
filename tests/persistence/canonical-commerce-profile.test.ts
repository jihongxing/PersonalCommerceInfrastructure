import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { getTableConfig } from 'drizzle-orm/pg-core';
import { describe, expect, it } from 'vitest';

import { InMemoryCanonicalCommerceProfileRepository } from '../../adapters/in-memory/in-memory-canonical-commerce-profile-repository.js';
import { InMemoryInternalIdentityRepository } from '../../adapters/in-memory/in-memory-internal-identity-repository.js';
import { rehydrateCommerceProfileRow } from '../../adapters/persistence/postgres/postgres-canonical-commerce-profile-repository.js';
import {
  createCanonicalCommerceProfileService,
  type CommerceProfileClock,
} from '../../applications/canonical-commerce-profile/canonical-commerce-profile-service.js';
import { UuidCommerceProfileIdGenerator } from '../../applications/canonical-commerce-profile/uuid-commerce-profile-id-generator.js';
import {
  createAuthenticationAccountId,
  createCommerceProfile,
  createCommerceProfileId,
  createInternalIdentity,
  createInternalIdentityId,
  transitionInternalIdentity,
  transitionCommerceProfile,
} from '../../modules/identity-infrastructure/identity-contract.js';
import {
  CommerceProfileAlreadyExistsError,
  CommerceProfileLifecycleConflictError,
  CommerceProfileOwnerNotFoundError,
} from '../../modules/identity-infrastructure/commerce-profile-repository.js';
import { commerceProfiles } from '../../database/schema/commerce-profile.js';

const createdAt = '2026-08-26T00:00:00.000Z';

describe('canonical Commerce Profile durable persistence', () => {
  it('defines the Profile table with one required Identity owner and canonical durable facts', () => {
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
    expect(config.foreignKeys).toHaveLength(1);
    expect(config.foreignKeys[0]?.onDelete).toBe('restrict');
  });

  it('creates a valid ACTIVE Profile and rehydrates it through the canonical contract', async () => {
    const identityRepository = new InMemoryInternalIdentityRepository();
    const profileRepository = new InMemoryCanonicalCommerceProfileRepository(identityRepository);
    const identity = await createPersistedIdentity(identityRepository, 'identity_a');
    const profile = createProfile('profile_a', identity.internalIdentityId);

    await profileRepository.create(profile);

    await expect(profileRepository.getById(profile.commerceProfileId)).resolves.toEqual(profile);
    expect(
      rehydrateCommerceProfileRow({
        commerceProfileId: profile.commerceProfileId,
        owningIdentityId: identity.internalIdentityId,
        lifecycle: 'ACTIVE',
        displayName: 'Studio North',
        createdAt,
        updatedAt: createdAt,
      }),
    ).toEqual(profile);
  });

  it('generates distinct canonical Profile IDs for a known owner', async () => {
    const identityRepository = new InMemoryInternalIdentityRepository();
    const profileRepository = new InMemoryCanonicalCommerceProfileRepository(identityRepository);
    const identity = await createPersistedIdentity(identityRepository, 'identity_a');
    const service = createCanonicalCommerceProfileService({
      repository: profileRepository,
      idGenerator: new UuidCommerceProfileIdGenerator(),
      clock: fixedClock(createdAt),
    });

    const [first, second] = await Promise.all([
      service.create({
        owningIdentityId: identity.internalIdentityId,
        presentation: { displayName: 'Studio North' },
      }),
      service.create({
        owningIdentityId: identity.internalIdentityId,
        presentation: { displayName: 'Studio South' },
      }),
    ]);

    expect(first.commerceProfileId).not.toBe(second.commerceProfileId);
    expect(first.lifecycle).toBe('ACTIVE');
    expect(first.createdAt).toBe(createdAt);
    expect(first.updatedAt).toBe(createdAt);
  });

  it('rejects a stored row whose lifecycle is not canonical', () => {
    expect(() =>
      rehydrateCommerceProfileRow({
        commerceProfileId: 'profile_a',
        owningIdentityId: 'identity_a',
        lifecycle: 'DRAFT',
        displayName: 'Studio North',
        createdAt,
        updatedAt: createdAt,
      }),
    ).toThrow('Commerce Profile lifecycle DRAFT is invalid.');
  });

  it('rejects an unknown owner and duplicate Profile ID', async () => {
    const identityRepository = new InMemoryInternalIdentityRepository();
    const profileRepository = new InMemoryCanonicalCommerceProfileRepository(identityRepository);
    const unknownOwnerProfile = createProfile(
      'profile_unknown',
      createInternalIdentityId('identity_missing'),
    );

    await expect(profileRepository.create(unknownOwnerProfile)).rejects.toBeInstanceOf(
      CommerceProfileOwnerNotFoundError,
    );

    const identity = await createPersistedIdentity(identityRepository, 'identity_a');
    const profile = createProfile('profile_a', identity.internalIdentityId);
    await profileRepository.create(profile);

    await expect(profileRepository.create(profile)).rejects.toBeInstanceOf(
      CommerceProfileAlreadyExistsError,
    );
  });

  it('allows one Identity to own many Profiles and filters owned Profile reads', async () => {
    const identityRepository = new InMemoryInternalIdentityRepository();
    const profileRepository = new InMemoryCanonicalCommerceProfileRepository(identityRepository);
    const identityA = await createPersistedIdentity(identityRepository, 'identity_a');
    const identityB = await createPersistedIdentity(identityRepository, 'identity_b');
    const profilesForA = [
      createProfile('profile_a', identityA.internalIdentityId),
      createProfile('profile_b', identityA.internalIdentityId),
      createProfile('profile_c', identityA.internalIdentityId),
    ];
    const profileForB = createProfile('profile_other', identityB.internalIdentityId);

    await Promise.all([
      ...profilesForA.map((profile) => profileRepository.create(profile)),
      profileRepository.create(profileForB),
    ]);

    await expect(profileRepository.listOwnedByIdentity(identityA.internalIdentityId)).resolves.toEqual(
      profilesForA,
    );
    await expect(profileRepository.listOwnedByIdentity(identityB.internalIdentityId)).resolves.toEqual([
      profileForB,
    ]);
  });

  it('keeps Identity and Profile lifecycle durable states independent', async () => {
    const identityRepository = new InMemoryInternalIdentityRepository();
    const profileRepository = new InMemoryCanonicalCommerceProfileRepository(identityRepository);
    const identity = await createPersistedIdentity(identityRepository, 'identity_a');
    const profile = createProfile('profile_a', identity.internalIdentityId);
    await profileRepository.create(profile);

    const archivedIdentity = transitionInternalIdentity(
      identity,
      'ARCHIVED',
      '2026-08-26T01:00:00.000Z',
    );
    await identityRepository.updateLifecycle({
      identityId: identity.internalIdentityId,
      expectedLifecycle: identity.lifecycle,
      nextLifecycle: archivedIdentity.lifecycle,
      updatedAt: archivedIdentity.updatedAt,
    });

    await expect(profileRepository.getById(profile.commerceProfileId)).resolves.toEqual(profile);
  });

  it('persists each allowed lifecycle transition while preserving profile ID, owner, and createdAt', async () => {
    const identityRepository = new InMemoryInternalIdentityRepository();
    const profileRepository = new InMemoryCanonicalCommerceProfileRepository(identityRepository);
    const identity = await createPersistedIdentity(identityRepository, 'identity_a');
    const active = createProfile('profile_a', identity.internalIdentityId);
    await profileRepository.create(active);

    const suspended = await persistTransition(profileRepository, active, 'SUSPENDED', '2026-08-26T01:00:00.000Z');
    const reactivated = await persistTransition(
      profileRepository,
      suspended,
      'ACTIVE',
      '2026-08-26T02:00:00.000Z',
    );
    const archivedFromActive = transitionCommerceProfile(
      reactivated,
      'ARCHIVED',
      '2026-08-26T03:00:00.000Z',
    );
    const archivedFromSuspended = transitionCommerceProfile(
      suspended,
      'ARCHIVED',
      '2026-08-26T03:00:00.000Z',
    );

    expect(archivedFromActive.lifecycle).toBe('ARCHIVED');
    expect(archivedFromSuspended.lifecycle).toBe('ARCHIVED');
    expect(reactivated.commerceProfileId).toBe(active.commerceProfileId);
    expect(reactivated.owningIdentityId).toBe(active.owningIdentityId);
    expect(reactivated.createdAt).toBe(active.createdAt);
    expect(reactivated.updatedAt).toBe('2026-08-26T02:00:00.000Z');
    expect(() =>
      transitionCommerceProfile(archivedFromActive, 'ACTIVE', '2026-08-26T04:00:00.000Z'),
    ).toThrow();
    expect(() =>
      transitionCommerceProfile(archivedFromActive, 'SUSPENDED', '2026-08-26T04:00:00.000Z'),
    ).toThrow();
  });

  it('persists presentation updates conditionally without changing immutable Profile facts', async () => {
    const identityRepository = new InMemoryInternalIdentityRepository();
    const profileRepository = new InMemoryCanonicalCommerceProfileRepository(identityRepository);
    const identity = await createPersistedIdentity(identityRepository, 'identity_a');
    const profile = createProfile('profile_a', identity.internalIdentityId);
    await profileRepository.create(profile);

    await profileRepository.updatePresentation({
      profileId: profile.commerceProfileId,
      displayName: 'Studio North Updated',
      expectedUpdatedAt: profile.updatedAt,
      updatedAt: '2026-08-26T01:00:00.000Z',
    });

    await expect(profileRepository.getById(profile.commerceProfileId)).resolves.toEqual({
      ...profile,
      presentation: { displayName: 'Studio North Updated' },
      updatedAt: '2026-08-26T01:00:00.000Z',
    });

    await expect(
      profileRepository.updatePresentation({
        profileId: profile.commerceProfileId,
        displayName: 'Stale Update',
        expectedUpdatedAt: profile.updatedAt,
        updatedAt: '2026-08-26T02:00:00.000Z',
      }),
    ).rejects.toBeInstanceOf(CommerceProfileLifecycleConflictError);

    await expect(profileRepository.getById(profile.commerceProfileId)).resolves.toEqual({
      ...profile,
      presentation: { displayName: 'Studio North Updated' },
      updatedAt: '2026-08-26T01:00:00.000Z',
    });
  });

  it('rejects the losing conditional lifecycle update without mutating stored timestamps', async () => {
    const identityRepository = new InMemoryInternalIdentityRepository();
    const profileRepository = new InMemoryCanonicalCommerceProfileRepository(identityRepository);
    const identity = await createPersistedIdentity(identityRepository, 'identity_a');
    const profile = createProfile('profile_a', identity.internalIdentityId);
    await profileRepository.create(profile);

    await Promise.all([
      profileRepository.updateLifecycle({
        profileId: profile.commerceProfileId,
        expectedLifecycle: 'ACTIVE',
        expectedUpdatedAt: profile.updatedAt,
        nextLifecycle: 'SUSPENDED',
        updatedAt: '2026-08-26T01:00:00.000Z',
      }),
      expect(
        profileRepository.updateLifecycle({
          profileId: profile.commerceProfileId,
          expectedLifecycle: 'ACTIVE',
          expectedUpdatedAt: profile.updatedAt,
          nextLifecycle: 'ARCHIVED',
          updatedAt: '2026-08-26T02:00:00.000Z',
        }),
      ).rejects.toBeInstanceOf(CommerceProfileLifecycleConflictError),
    ]);

    await expect(profileRepository.getById(profile.commerceProfileId)).resolves.toEqual({
      ...profile,
      lifecycle: 'SUSPENDED',
      updatedAt: '2026-08-26T01:00:00.000Z',
    });
  });

  it('keeps Profile, Identity, and Authentication Account IDs isolated', () => {
    const accountId = createAuthenticationAccountId('account_a');
    const identityId = createInternalIdentityId('identity_a');
    const profileId = createCommerceProfileId('profile_a');

    expect(accountId).toBe('account_a');
    expect(identityId).toBe('identity_a');
    expect(profileId).toBe('profile_a');
  });

  it('enforces the forward-only foreign key and canonical lifecycle migration constraints', async () => {
    const migration = await readFile(
      resolve('database/migrations/0018_stage2_commerce_profile_core.sql'),
      'utf8',
    );

    expect(migration).toContain('"commerce_profile_id" varchar(128) PRIMARY KEY NOT NULL');
    expect(migration).toContain('"owning_identity_id" varchar(128) NOT NULL');
    expect(migration).toContain(
      'FOREIGN KEY ("owning_identity_id") REFERENCES "public"."identities"("identity_id")',
    );
    expect(migration).toContain('ON DELETE RESTRICT');
    expect(migration).toContain('CHECK ("lifecycle" IN (\'ACTIVE\', \'SUSPENDED\', \'ARCHIVED\'))');
    expect(migration).not.toMatch(
      /\b(commerce_reference|external_platform|relationship|oauth|account_id|bio|avatar_url|location|social_links)\b/iu,
    );
  });
});

async function createPersistedIdentity(
  repository: InMemoryInternalIdentityRepository,
  identityValue: string,
) {
  const identity = createInternalIdentity({
    internalIdentityId: createInternalIdentityId(identityValue),
    createdAt,
  });
  await repository.create(identity);
  return identity;
}

function createProfile(profileValue: string, owningIdentityId: ReturnType<typeof createInternalIdentityId>) {
  return createCommerceProfile({
    commerceProfileId: createCommerceProfileId(profileValue),
    owningIdentityId,
    presentation: { displayName: 'Studio North' },
    createdAt,
  });
}

function fixedClock(now: string): CommerceProfileClock {
  return { now: () => now };
}

async function persistTransition(
  repository: InMemoryCanonicalCommerceProfileRepository,
  profile: ReturnType<typeof createProfile>,
  nextLifecycle: 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED',
  updatedAt: string,
) {
  const updated = transitionCommerceProfile(profile, nextLifecycle, updatedAt);
  await repository.updateLifecycle({
    profileId: profile.commerceProfileId,
    expectedLifecycle: profile.lifecycle,
    expectedUpdatedAt: profile.updatedAt,
    nextLifecycle: updated.lifecycle,
    updatedAt: updated.updatedAt,
  });
  return updated;
}
