import { describe, expect, it } from 'vitest';

import { InMemoryAccountIdentityMembershipRepository } from '../../adapters/in-memory/in-memory-account-identity-membership-repository.js';
import { InMemoryCanonicalCommerceProfileRepository } from '../../adapters/in-memory/in-memory-canonical-commerce-profile-repository.js';
import { InMemoryCommerceRelationshipRepository } from '../../adapters/in-memory/in-memory-commerce-relationship-repository.js';
import { InMemoryExternalPlatformAccountRepository } from '../../adapters/in-memory/in-memory-external-platform-account-repository.js';
import { FixedClock } from '../../adapters/in-memory/fixed-clock.js';
import { InMemoryIdentityRepository } from '../../adapters/in-memory/in-memory-identity-repository.js';
import { InMemoryProductEventStore } from '../../adapters/in-memory/in-memory-product-event-store.js';
import { InMemoryUnitOfWork } from '../../adapters/in-memory/in-memory-unit-of-work.js';
import { SequentialIdGenerator } from '../../adapters/in-memory/sequential-id-generator.js';
import { createAccountIdentityMembershipService } from '../../applications/account-identity-membership/account-identity-membership-service.js';
import { createCurrentUserIdentityService } from '../../applications/account-identity-membership/current-user-identity-service.js';
import { createCanonicalCommerceProfileService } from '../../applications/canonical-commerce-profile/canonical-commerce-profile-service.js';
import { createPrivateCommerceRelationshipService } from '../../applications/private-commerce-relationship/private-commerce-relationship-service.js';
import {
  createCommerceRelationshipId,
  createExternalPlatform,
  createExternalPlatformAccount,
  createExternalPlatformAccountId,
  createExternalPlatformNamespace,
  createPlatformAccountIdentifier,
  rehydrateCommerceRelationship,
} from '../../modules/identity-infrastructure/external-platform-contract.js';
import { createCommerceProfileId } from '../../modules/identity-infrastructure/identity-contract.js';

const accountA = { accountId: 'test:account-a', correlationId: 'correlation-a' };
const accountB = { accountId: 'test:account-b', correlationId: 'correlation-b' };
const createdAt = '2026-08-27T00:00:00.000Z';

describe('Private Commerce Relationship service', () => {
  it('lists owned profile relationships including history and filters only the authorized scope', async () => {
    const fixture = setup();
    const identityA = await fixture.membershipService.createIdentityForAuthenticatedAccount(accountA);
    const identityB = await fixture.membershipService.createIdentityForAuthenticatedAccount(accountB);
    const profileA1 = await fixture.createProfile(identityA.identity.identityId, 'Studio A');
    const profileA2 = await fixture.createProfile(identityA.identity.identityId, 'Brand A');
    const profileB = await fixture.createProfile(identityB.identity.identityId, 'Studio B');
    await fixture.createRelationship('relationship-a-old', 'account-a', profileA1.commerceProfileId, {
      lifecycle: 'HISTORICAL',
      effectiveAt: '2026-08-25T00:00:00.000Z',
      role: 'MANAGER',
    });
    await fixture.createRelationshipForExistingAccount(
      'relationship-a-current',
      'relationship-a-old',
      profileA1.commerceProfileId,
      {
      lifecycle: 'ACTIVE',
      effectiveAt: '2026-08-26T00:00:00.000Z',
      role: 'OWNER',
      },
    );
    await fixture.createRelationship('relationship-a-brand', 'account-a-brand', profileA2.commerceProfileId, {
      lifecycle: 'ACTIVE',
      effectiveAt: '2026-08-27T00:00:00.000Z',
      role: 'DELEGATED_MANAGER',
    });
    await fixture.createRelationship('relationship-b', 'account-b', profileB.commerceProfileId, {
      lifecycle: 'ACTIVE',
      effectiveAt: '2026-08-27T00:00:00.000Z',
      role: 'OWNER',
    });

    await expect(fixture.service.listMyCommerceRelationships(accountA)).resolves.toMatchObject([
      {
        relationshipId: 'relationship-a-old',
        profile: { commerceProfileId: profileA1.commerceProfileId, displayName: 'Studio A' },
        externalPlatformAccount: { platform: 'instagram', platformAccountId: 'account-a' },
        role: 'MANAGER',
        lifecycle: 'HISTORICAL',
      },
      {
        relationshipId: 'relationship-a-current',
        profile: { commerceProfileId: profileA1.commerceProfileId, displayName: 'Studio A' },
        externalPlatformAccount: { platform: 'instagram', platformAccountId: 'account-a' },
        lifecycle: 'ACTIVE',
      },
      {
        relationshipId: 'relationship-a-brand',
        profile: { commerceProfileId: profileA2.commerceProfileId, displayName: 'Brand A' },
        lifecycle: 'ACTIVE',
      },
    ]);
    await expect(
      fixture.service.listMyCommerceRelationships(accountA, {
        commerceProfileId: profileA2.commerceProfileId,
      }),
    ).resolves.toMatchObject([{ relationshipId: 'relationship-a-brand' }]);
    await expect(
      fixture.service.listMyCommerceRelationships(accountA, {
        commerceProfileId: profileB.commerceProfileId,
      }),
    ).resolves.toEqual([]);
  });

  it('fails closed when a relationship belongs to another Identity', async () => {
    const fixture = setup();
    const identityA = await fixture.membershipService.createIdentityForAuthenticatedAccount(accountA);
    const identityB = await fixture.membershipService.createIdentityForAuthenticatedAccount(accountB);
    const profileA = await fixture.createProfile(identityA.identity.identityId, 'Studio A');
    const profileB = await fixture.createProfile(identityB.identity.identityId, 'Studio B');
    await fixture.createRelationship('relationship-a', 'account-a', profileA.commerceProfileId, {
      lifecycle: 'ACTIVE',
      effectiveAt: createdAt,
      role: 'OWNER',
    });
    await fixture.createRelationship('relationship-b', 'account-b', profileB.commerceProfileId, {
      lifecycle: 'ACTIVE',
      effectiveAt: createdAt,
      role: 'OWNER',
    });

    await expect(
      fixture.service.getMyCommerceRelationship(accountA, 'relationship-b'),
    ).rejects.toMatchObject({ code: 'private_commerce_relationship_not_found' });
    await expect(
      fixture.service.listMyCommerceRelationships(accountA, {
        externalPlatformAccountId: 'account-b',
      }),
    ).resolves.toEqual([]);
  });
});

function setup() {
  const identityRepository = new InMemoryIdentityRepository();
  const membershipRepository = new InMemoryAccountIdentityMembershipRepository();
  const membershipService = createAccountIdentityMembershipService({
    membershipRepository,
    unitOfWork: new InMemoryUnitOfWork(
      [identityRepository, membershipRepository],
      new InMemoryProductEventStore(),
      {
        formalIdentityRepository: identityRepository,
        accountIdentityMembershipRepository: membershipRepository,
      },
    ),
    identityIdGenerator: new SequentialIdGenerator('identity'),
    membershipIdGenerator: new SequentialIdGenerator('membership'),
    clock: new FixedClock(createdAt),
  });
  const profileRepository = new InMemoryCanonicalCommerceProfileRepository({
    exists: async (identityId) => (await identityRepository.findById(identityId)) !== undefined,
  });
  const profileGenerator = new SequentialIdGenerator('profile');
  const profileService = createCanonicalCommerceProfileService({
    repository: profileRepository,
    idGenerator: { generate: () => createCommerceProfileId(profileGenerator.generate()) },
    clock: new FixedClock(createdAt),
  });
  const accountRepository = new InMemoryExternalPlatformAccountRepository();
  const relationshipRepository = new InMemoryCommerceRelationshipRepository(
    accountRepository,
    profileRepository,
  );
  const currentUserIdentityService = createCurrentUserIdentityService({
    identityRepository,
    membershipRepository,
  });

  return {
    membershipService,
    service: createPrivateCommerceRelationshipService({
      currentUserIdentityService,
      commerceProfileService: profileService,
      commerceRelationshipRepository: relationshipRepository,
      externalPlatformAccountRepository: accountRepository,
    }),
    createProfile: (owningIdentityId: string, displayName: string) =>
      profileService.create({
        owningIdentityId: owningIdentityId as never,
        presentation: { displayName },
      }),
    async createRelationship(
      relationshipId: string,
      platformAccountId: string,
      commerceProfileId: string,
      input: { readonly lifecycle: 'ACTIVE' | 'HISTORICAL'; readonly effectiveAt: string; readonly role: 'OWNER' | 'MANAGER' | 'DELEGATED_MANAGER' },
    ) {
      await accountRepository.create(
        createExternalPlatformAccount({
          externalPlatformAccountId: createExternalPlatformAccountId(`external-${relationshipId}`),
          platform: createExternalPlatform(createExternalPlatformNamespace('instagram')),
          platformAccountId: createPlatformAccountIdentifier(platformAccountId),
          createdAt,
        }),
      );
      const relationship = rehydrateCommerceRelationship({
        commerceRelationshipId: createCommerceRelationshipId(relationshipId),
        externalPlatformAccountId: createExternalPlatformAccountId(`external-${relationshipId}`),
        commerceProfileId: createCommerceProfileId(commerceProfileId),
        role: input.role,
        lifecycle: input.lifecycle,
        effectiveAt: input.effectiveAt,
        createdAt,
        updatedAt: createdAt,
      });
      await relationshipRepository.create(relationship);
    },
    async createRelationshipForExistingAccount(
      relationshipId: string,
      existingRelationshipId: string,
      commerceProfileId: string,
      input: {
        readonly lifecycle: 'ACTIVE' | 'HISTORICAL';
        readonly effectiveAt: string;
        readonly role: 'OWNER' | 'MANAGER' | 'DELEGATED_MANAGER';
      },
    ) {
      await relationshipRepository.create(
        rehydrateCommerceRelationship({
          commerceRelationshipId: createCommerceRelationshipId(relationshipId),
          externalPlatformAccountId: createExternalPlatformAccountId(`external-${existingRelationshipId}`),
          commerceProfileId: createCommerceProfileId(commerceProfileId),
          role: input.role,
          lifecycle: input.lifecycle,
          effectiveAt: input.effectiveAt,
          createdAt,
          updatedAt: createdAt,
        }),
      );
    },
  };
}
