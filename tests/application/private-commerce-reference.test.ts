import { describe, expect, it } from 'vitest';

import { InMemoryAccountIdentityMembershipRepository } from '../../adapters/in-memory/in-memory-account-identity-membership-repository.js';
import { InMemoryCanonicalCommerceProfileRepository } from '../../adapters/in-memory/in-memory-canonical-commerce-profile-repository.js';
import { InMemoryCanonicalCommerceReferenceRepository } from '../../adapters/in-memory/in-memory-canonical-commerce-reference-repository.js';
import { InMemoryIdentityRepository } from '../../adapters/in-memory/in-memory-identity-repository.js';
import { InMemoryProductEventStore } from '../../adapters/in-memory/in-memory-product-event-store.js';
import { InMemoryUnitOfWork } from '../../adapters/in-memory/in-memory-unit-of-work.js';
import { SequentialIdGenerator } from '../../adapters/in-memory/sequential-id-generator.js';
import { FixedClock } from '../../adapters/in-memory/fixed-clock.js';
import { createAccountIdentityMembershipService } from '../../applications/account-identity-membership/account-identity-membership-service.js';
import { createCurrentUserIdentityService } from '../../applications/account-identity-membership/current-user-identity-service.js';
import { createCanonicalCommerceProfileService } from '../../applications/canonical-commerce-profile/canonical-commerce-profile-service.js';
import { createPrivateCommerceReferenceService } from '../../applications/private-commerce-reference/private-commerce-reference-service.js';
import { createCommerceReference } from '../../modules/identity-infrastructure/commerce-reference-contract.js';
import {
  createCommerceProfileId,
  createInternalIdentityId,
} from '../../modules/identity-infrastructure/identity-contract.js';

const accountA = { accountId: 'test:account-a', correlationId: 'correlation-a' };
const accountB = { accountId: 'test:account-b', correlationId: 'correlation-b' };

function setup() {
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
  const referenceRepository = new InMemoryCanonicalCommerceReferenceRepository(profileRepository);
  const commerceProfileService = createCanonicalCommerceProfileService({
    repository: profileRepository,
    idGenerator: {
      generate: () => createCommerceProfileId(`profile-${Math.random().toString(16).slice(2)}`),
    },
    clock: new FixedClock('2026-08-27T00:00:00.000Z'),
  });
  const service = createPrivateCommerceReferenceService({
    currentUserIdentityService: createCurrentUserIdentityService({
      identityRepository,
      membershipRepository,
    }),
    commerceProfileService,
    commerceReferenceRepository: referenceRepository,
  });

  return { commerceProfileService, membershipService, referenceRepository, service };
}

describe('Private Commerce Reference service', () => {
  it('returns the canonical and grouped C号 for an owned Profile', async () => {
    const { commerceProfileService, membershipService, referenceRepository, service } = setup();
    const identity = await membershipService.createIdentityForAuthenticatedAccount(accountA);
    const profile = await commerceProfileService.create({
      owningIdentityId: createInternalIdentityId(identity.identity.identityId),
      presentation: { displayName: 'Studio A' },
    });
    await referenceRepository.assign({
      commerceReference: createCommerceReference('3C7M4Q9RDFHJKNTWVY'),
      commerceProfileId: profile.commerceProfileId,
      assignedAt: '2026-08-27T00:00:00.000Z',
    });

    await expect(service.getMyCommerceReference(accountA, profile.commerceProfileId)).resolves.toEqual({
      assignmentStatus: 'ASSIGNED',
      commerceReference: '3C7M4Q9RDFHJKNTWVY',
      displayValue: '3C7M4Q-9RDFHJ-KNTWVY',
    });
  });

  it('returns the explicit empty state without assigning a reference', async () => {
    const { commerceProfileService, membershipService, referenceRepository, service } = setup();
    const identity = await membershipService.createIdentityForAuthenticatedAccount(accountA);
    const profile = await commerceProfileService.create({
      owningIdentityId: createInternalIdentityId(identity.identity.identityId),
      presentation: { displayName: 'No C号' },
    });

    await expect(service.getMyCommerceReference(accountA, profile.commerceProfileId)).resolves.toEqual({
      assignmentStatus: 'NOT_ASSIGNED',
    });
    await expect(referenceRepository.getByProfileId(profile.commerceProfileId)).resolves.toBeUndefined();
  });

  it('fails closed for a foreign Profile and a missing active binding', async () => {
    const { commerceProfileService, membershipService, service } = setup();
    await membershipService.createIdentityForAuthenticatedAccount(accountA);
    const identityB = await membershipService.createIdentityForAuthenticatedAccount(accountB);
    const profileB = await commerceProfileService.create({
      owningIdentityId: createInternalIdentityId(identityB.identity.identityId),
      presentation: { displayName: 'Studio B' },
    });

    await expect(service.getMyCommerceReference(accountA, profileB.commerceProfileId)).rejects.toMatchObject({
      code: 'private_commerce_profile_not_found',
    });
    await expect(service.getMyCommerceReference(
      { accountId: 'test:unbound', correlationId: 'correlation-unbound' },
      profileB.commerceProfileId,
    )).rejects.toMatchObject({ code: 'active_identity_binding_not_found' });
  });
});
