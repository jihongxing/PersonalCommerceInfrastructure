import { describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';

import { InMemoryAuthContextProvider } from '../../adapters/auth/testing/in-memory-auth-context-provider.js';
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
import {
  createPrivateCommerceRelationshipService,
  type PrivateCommerceRelationshipView,
} from '../../applications/private-commerce-relationship/private-commerce-relationship-service.js';
import { createApiServer } from '../../apps/api/src/create-api-server.js';
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

const createdAt = '2026-08-27T00:00:00.000Z';
type PrivateCommerceRelationshipListResponse = {
  readonly relationships: readonly PrivateCommerceRelationshipView[];
};

describe('Private Commerce Relationship API', () => {
  let server: FastifyInstance;
  let fixture: ReturnType<typeof setup>;

  it('returns owned relationship history and denies foreign selectors', async () => {
    fixture = setup();
    const identityA = await fixture.membershipService.createIdentityForAuthenticatedAccount({
      accountId: 'test:token-a',
      correlationId: 'correlation-a',
    });
    const identityB = await fixture.membershipService.createIdentityForAuthenticatedAccount({
      accountId: 'test:token-b',
      correlationId: 'correlation-b',
    });
    const profileA = await fixture.createProfile(identityA.identity.identityId, 'Studio A');
    const profileB = await fixture.createProfile(identityB.identity.identityId, 'Studio B');
    await fixture.createRelationship('relationship-a-old', 'account-a', profileA.commerceProfileId, 'HISTORICAL', 'MANAGER', '2026-08-25T00:00:00.000Z');
    await fixture.createRelationshipForExistingAccount(
      'relationship-a-current',
      'relationship-a-old',
      profileA.commerceProfileId,
      'ACTIVE',
      'OWNER',
      '2026-08-26T00:00:00.000Z',
    );
    await fixture.createRelationship('relationship-b', 'account-b', profileB.commerceProfileId, 'ACTIVE', 'OWNER', createdAt);
    server = await createApiServer({
      authContextProvider: new InMemoryAuthContextProvider([
        { accessToken: 'token-a', actor: { kind: 'creator', creatorId: 'creator-a' } },
        { accessToken: 'token-b', actor: { kind: 'creator', creatorId: 'creator-b' } },
      ]),
      privateCommerceRelationshipService: fixture.service,
    });

    const list = await server.inject({
      method: 'GET',
      url: '/api/v1/private/commerce-relationships?commerceProfileId=foreign-profile&externalPlatformAccountId=account-b',
      headers: { authorization: 'Bearer token-a' },
    });
    expect(list.statusCode).toBe(200);
    expect(list.json<PrivateCommerceRelationshipListResponse>().relationships).toHaveLength(0);

    const profileFiltered = await server.inject({
      method: 'GET',
      url: `/api/v1/private/commerce-relationships?commerceProfileId=${profileA.commerceProfileId}`,
      headers: { authorization: 'Bearer token-a' },
    });
    expect(profileFiltered.statusCode).toBe(200);
    expect(
      profileFiltered.json<PrivateCommerceRelationshipListResponse>().relationships,
    ).toHaveLength(2);

    const accountFiltered = await server.inject({
      method: 'GET',
      url: '/api/v1/private/commerce-relationships?externalPlatformAccountId=external-relationship-a-old',
      headers: { authorization: 'Bearer token-a' },
    });
    expect(accountFiltered.statusCode).toBe(200);
    expect(
      accountFiltered.json<PrivateCommerceRelationshipListResponse>().relationships,
    ).toMatchObject([
      { relationshipId: 'relationship-a-old', lifecycle: 'HISTORICAL' },
      { relationshipId: 'relationship-a-current', lifecycle: 'ACTIVE' },
    ]);

    const injectedIdentityAndRelationship = await server.inject({
      method: 'GET',
      url: '/api/v1/private/commerce-relationships?identityId=identity-b&relationshipId=relationship-b',
      headers: { authorization: 'Bearer token-a' },
    });
    expect(injectedIdentityAndRelationship.statusCode).toBe(400);

    const owned = await server.inject({
      method: 'GET',
      url: '/api/v1/private/commerce-relationships',
      headers: { authorization: 'Bearer token-a' },
    });
    expect(owned.statusCode).toBe(200);
    expect(owned.json()).toMatchObject({
      relationships: [
        {
          relationshipId: 'relationship-a-old',
          profile: { commerceProfileId: profileA.commerceProfileId, displayName: 'Studio A' },
          externalPlatformAccount: { platform: 'instagram', platformAccountId: 'account-a' },
          role: 'MANAGER',
          lifecycle: 'HISTORICAL',
        },
        {
          relationshipId: 'relationship-a-current',
          profile: { commerceProfileId: profileA.commerceProfileId, displayName: 'Studio A' },
          role: 'OWNER',
          lifecycle: 'ACTIVE',
        },
      ],
    });

    const foreign = await server.inject({
      method: 'GET',
      url: '/api/v1/private/commerce-relationships/relationship-b?profileId=foreign-profile&identityId=identity-b&externalPlatformAccountId=account-b',
      headers: { authorization: 'Bearer token-a' },
    });
    expect(foreign.statusCode).toBe(404);
    expect(foreign.json()).toMatchObject({
      error: { code: 'private_commerce_relationship_not_found' },
    });
  });

  it('returns an empty state for an authenticated Identity with no relationships', async () => {
    fixture = setup();
    await fixture.membershipService.createIdentityForAuthenticatedAccount({
      accountId: 'test:token-empty',
      correlationId: 'correlation-empty',
    });
    server = await createApiServer({
      authContextProvider: new InMemoryAuthContextProvider([
        { accessToken: 'token-empty', actor: { kind: 'creator', creatorId: 'creator-empty' } },
      ]),
      privateCommerceRelationshipService: fixture.service,
    });
    const response = await server.inject({
      method: 'GET',
      url: '/api/v1/private/commerce-relationships',
      headers: { authorization: 'Bearer token-empty' },
    });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ relationships: [] });
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
  const profileIdGenerator = new SequentialIdGenerator('profile');
  const profileService = createCanonicalCommerceProfileService({
    repository: profileRepository,
    idGenerator: { generate: () => createCommerceProfileId(profileIdGenerator.generate()) },
    clock: new FixedClock(createdAt),
  });
  const accountRepository = new InMemoryExternalPlatformAccountRepository();
  const relationshipRepository = new InMemoryCommerceRelationshipRepository(accountRepository, profileRepository);
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
      profileService.create({ owningIdentityId: owningIdentityId as never, presentation: { displayName } }),
    async createRelationship(
      relationshipId: string,
      platformAccountId: string,
      commerceProfileId: string,
      lifecycle: 'ACTIVE' | 'HISTORICAL',
      role: 'OWNER' | 'MANAGER' | 'DELEGATED_MANAGER',
      effectiveAt: string,
    ) {
      const accountId = createExternalPlatformAccountId(`external-${relationshipId}`);
      await accountRepository.create(createExternalPlatformAccount({
        externalPlatformAccountId: accountId,
        platform: createExternalPlatform(createExternalPlatformNamespace('instagram')),
        platformAccountId: createPlatformAccountIdentifier(platformAccountId),
        createdAt,
      }));
      await relationshipRepository.create(rehydrateCommerceRelationship({
        commerceRelationshipId: createCommerceRelationshipId(relationshipId),
        externalPlatformAccountId: accountId,
        commerceProfileId: createCommerceProfileId(commerceProfileId),
        role,
        lifecycle,
        effectiveAt,
        createdAt,
        updatedAt: createdAt,
      }));
    },
    async createRelationshipForExistingAccount(
      relationshipId: string,
      existingRelationshipId: string,
      commerceProfileId: string,
      lifecycle: 'ACTIVE' | 'HISTORICAL',
      role: 'OWNER' | 'MANAGER' | 'DELEGATED_MANAGER',
      effectiveAt: string,
    ) {
      await relationshipRepository.create(rehydrateCommerceRelationship({
        commerceRelationshipId: createCommerceRelationshipId(relationshipId),
        externalPlatformAccountId: createExternalPlatformAccountId(`external-${existingRelationshipId}`),
        commerceProfileId: createCommerceProfileId(commerceProfileId),
        role,
        lifecycle,
        effectiveAt,
        createdAt,
        updatedAt: createdAt,
      }));
    },
  };
}
