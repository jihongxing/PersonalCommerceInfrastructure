import { describe, expect, it } from 'vitest';

import { InMemoryAccountIdentityMembershipRepository } from '../../adapters/in-memory/in-memory-account-identity-membership-repository.js';
import { InMemoryCanonicalCommerceProfileRepository } from '../../adapters/in-memory/in-memory-canonical-commerce-profile-repository.js';
import { InMemoryCanonicalCommerceReferenceRepository } from '../../adapters/in-memory/in-memory-canonical-commerce-reference-repository.js';
import { FixedClock } from '../../adapters/in-memory/fixed-clock.js';
import { InMemoryIdentityRepository } from '../../adapters/in-memory/in-memory-identity-repository.js';
import { InMemoryProductEventStore } from '../../adapters/in-memory/in-memory-product-event-store.js';
import { InMemoryUnitOfWork } from '../../adapters/in-memory/in-memory-unit-of-work.js';
import { SequentialIdGenerator } from '../../adapters/in-memory/sequential-id-generator.js';
import { createAccountIdentityMembershipService } from '../../applications/account-identity-membership/account-identity-membership-service.js';
import { createCurrentUserIdentityService } from '../../applications/account-identity-membership/current-user-identity-service.js';
import { createCanonicalCommerceProfileService } from '../../applications/canonical-commerce-profile/canonical-commerce-profile-service.js';
import { createPrivateCommerceProfileService } from '../../applications/private-commerce-profile/private-commerce-profile-service.js';
import { createCommerceProfileId } from '../../modules/identity-infrastructure/identity-contract.js';
import { createCommerceReference } from '../../modules/identity-infrastructure/commerce-reference-contract.js';

const accountA = { accountId: 'test:account-a', correlationId: 'correlation-a' };
const accountB = { accountId: 'test:account-b', correlationId: 'correlation-b' };

function setup(options: {
  readonly references?: readonly string[];
  readonly referenceRepository?: InMemoryCanonicalCommerceReferenceRepository;
  readonly referenceGenerator?: { generate(): ReturnType<typeof createCommerceReference> };
} = {}) {
  let profileIndex = 0;
  let referenceIndex = 0;
  const references = options.references ?? ['3C7M4Q9RDFHJKNTWVY', '4C7M4Q9RDFHJKNTWVY'];
  const identityRepository = new InMemoryIdentityRepository();
  const membershipRepository = new InMemoryAccountIdentityMembershipRepository();
  const unitOfWork = new InMemoryUnitOfWork(
    [identityRepository, membershipRepository],
    new InMemoryProductEventStore(),
    {
      formalIdentityRepository: identityRepository,
      accountIdentityMembershipRepository: membershipRepository,
    },
  );
  const membershipService = createAccountIdentityMembershipService({
    membershipRepository,
    unitOfWork,
    identityIdGenerator: new SequentialIdGenerator('identity'),
    membershipIdGenerator: new SequentialIdGenerator('membership'),
    clock: new FixedClock('2026-08-27T00:00:00.000Z'),
  });
  const profileRepository = new InMemoryCanonicalCommerceProfileRepository({
    exists: async (identityId) => (await identityRepository.findById(identityId)) !== undefined,
  });
  const referenceRepository =
    options.referenceRepository ?? new InMemoryCanonicalCommerceReferenceRepository(profileRepository);
  const participants = [identityRepository, membershipRepository, profileRepository, referenceRepository];
  const atomicUnitOfWork = new InMemoryUnitOfWork(participants, new InMemoryProductEventStore(), {
    formalIdentityRepository: identityRepository,
    accountIdentityMembershipRepository: membershipRepository,
    commerceProfileRepository: profileRepository,
    commerceReferenceRepository: referenceRepository,
  });
  const currentUserIdentityService = createCurrentUserIdentityService({
    identityRepository,
    membershipRepository,
  });
  const service = createPrivateCommerceProfileService({
    currentUserIdentityService,
    commerceProfileService: createCanonicalCommerceProfileService({
      repository: profileRepository,
      idGenerator: {
        generate: () => createCommerceProfileId(`profile-${profileIndex++}`),
      },
      clock: new FixedClock('2026-08-27T00:00:00.000Z'),
    }),
    commerceProfileIdGenerator: {
      generate: () => createCommerceProfileId(`profile-${crypto.randomUUID()}`),
    },
    commerceReferenceGenerator: {
      generate: () =>
        options.referenceGenerator?.generate() ??
        createCommerceReference(references[referenceIndex++] ?? references[0]!),
    },
    clock: new FixedClock('2026-08-27T00:00:00.000Z'),
    unitOfWork: atomicUnitOfWork,
  });

  return { membershipService, profileRepository, referenceRepository, service };
}

describe('Private Commerce Profile service', () => {
  it('creates, lists, reads, updates, suspends, reactivates, and archives only the current Identity profiles', async () => {
    const { membershipService, service } = setup();
    const identityA = await membershipService.createIdentityForAuthenticatedAccount(accountA);
    await membershipService.createIdentityForAuthenticatedAccount(accountB);

    const profile = await service.createMyCommerceProfile(accountA, { displayName: 'Studio A' });

    await expect(service.listMyCommerceProfiles(accountA)).resolves.toMatchObject([
      {
        commerceProfileId: profile.commerceProfileId,
        displayName: profile.displayName,
        lifecycle: profile.lifecycle,
      },
    ]);
    await expect(service.getMyCommerceProfile(accountA, profile.commerceProfileId)).resolves.toMatchObject({
      commerceProfileId: profile.commerceProfileId,
      displayName: profile.displayName,
      lifecycle: profile.lifecycle,
    });
    await expect(
      service.updateMyCommerceProfile(accountA, profile.commerceProfileId, {
        displayName: 'Studio A Updated',
      }),
    ).resolves.toMatchObject({ displayName: 'Studio A Updated' });
    await expect(
      service.suspendMyCommerceProfile(accountA, profile.commerceProfileId),
    ).resolves.toMatchObject({ lifecycle: 'SUSPENDED' });
    await expect(
      service.reactivateMyCommerceProfile(accountA, profile.commerceProfileId),
    ).resolves.toMatchObject({ lifecycle: 'ACTIVE' });
    await expect(
      service.archiveMyCommerceProfile(accountA, profile.commerceProfileId),
    ).resolves.toMatchObject({ lifecycle: 'ARCHIVED' });
    await expect(
      service.reactivateMyCommerceProfile(accountA, profile.commerceProfileId),
    ).rejects.toMatchObject({ category: 'conflict' });

    expect(identityA.identity.identityId).toBe('identity-1');
  });

  it('fails closed for a foreign profile and preserves its presentation and lifecycle', async () => {
    const { membershipService, profileRepository, service } = setup();
    await membershipService.createIdentityForAuthenticatedAccount(accountA);
    const identityB = await membershipService.createIdentityForAuthenticatedAccount(accountB);
    const foreignProfile = await service.createMyCommerceProfile(accountB, { displayName: 'Studio B' });

    await expect(
      service.updateMyCommerceProfile(accountA, foreignProfile.commerceProfileId, {
        displayName: 'Compromised',
      }),
    ).rejects.toMatchObject({ code: 'private_commerce_profile_not_found' });
    await expect(
      service.archiveMyCommerceProfile(accountA, foreignProfile.commerceProfileId),
    ).rejects.toMatchObject({ code: 'private_commerce_profile_not_found' });

    await expect(
      profileRepository.getById(createCommerceProfileId(foreignProfile.commerceProfileId)),
    ).resolves.toMatchObject({
      owningIdentityId: identityB.identity.identityId,
      lifecycle: 'ACTIVE',
      presentation: { displayName: 'Studio B' },
    });
  });

  it('fails closed when the authenticated Account has no active Identity binding', async () => {
    const { service } = setup();

    await expect(service.listMyCommerceProfiles(accountA)).rejects.toMatchObject({
      code: 'active_identity_binding_not_found',
    });
  });

  it('creates a canonical Commerce Reference atomically with the Profile', async () => {
    const { membershipService, referenceRepository, service } = setup();
    await membershipService.createIdentityForAuthenticatedAccount(accountA);

    const profile = await service.createMyCommerceProfile(accountA, { displayName: 'Studio A' });

    expect(profile.commerceReference).toBe('3C7M4Q9RDFHJKNTWVY');
    expect(profile.commerceReferenceDisplayValue).toBe('3C7M4Q-9RDFHJ-KNTWVY');
    await expect(referenceRepository.getByProfileId(createCommerceProfileId(profile.commerceProfileId)))
      .resolves.toMatchObject({ commerceReference: '3C7M4Q9RDFHJKNTWVY' });
  });

  it('retries a unique collision and assigns only the succeeding candidate', async () => {
    const { membershipService, referenceRepository, service } = setup({
      references: [
        '3C7M4Q9RDFHJKNTWVY',
        '3C7M4Q9RDFHJKNTWVY',
        '4C7M4Q9RDFHJKNTWVY',
      ],
    });
    await membershipService.createIdentityForAuthenticatedAccount(accountA);

    const first = await service.createMyCommerceProfile(accountA, { displayName: 'First' });
    const second = await service.createMyCommerceProfile(accountA, { displayName: 'Second' });

    expect(first.commerceReference).toBe('3C7M4Q9RDFHJKNTWVY');
    expect(second.commerceReference).toBe('4C7M4Q9RDFHJKNTWVY');
    await expect(
      referenceRepository.getByProfileId(createCommerceProfileId(second.commerceProfileId)),
    ).resolves.toMatchObject({ commerceReference: '4C7M4Q9RDFHJKNTWVY' });
  });

  it('rolls back the Profile when Reference persistence fails', async () => {
    const profileRepository = new InMemoryCanonicalCommerceProfileRepository({
      exists: () => Promise.resolve(true),
    });
    const failingReferenceRepository = new FailingReferenceRepository(profileRepository);
    const { membershipService, service } = setup({ referenceRepository: failingReferenceRepository });
    await membershipService.createIdentityForAuthenticatedAccount(accountA);

    await expect(
      service.createMyCommerceProfile(accountA, { displayName: 'Rollback' }),
    ).rejects.toThrow('Reference persistence failed.');
    await expect(service.listMyCommerceProfiles(accountA)).resolves.toEqual([]);
  });
});

class FailingReferenceRepository extends InMemoryCanonicalCommerceReferenceRepository {
  public override assign(): Promise<void> {
    return Promise.reject(new Error('Reference persistence failed.'));
  }
}
