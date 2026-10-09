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
import { InMemoryAuthContextProvider } from '../../adapters/auth/testing/in-memory-auth-context-provider.js';
import { createAccountIdentityMembershipService } from '../../applications/account-identity-membership/account-identity-membership-service.js';
import { createCurrentUserIdentityService } from '../../applications/account-identity-membership/current-user-identity-service.js';
import { createCanonicalCommerceProfileService } from '../../applications/canonical-commerce-profile/canonical-commerce-profile-service.js';
import { createPrivateCommerceProfileService } from '../../applications/private-commerce-profile/private-commerce-profile-service.js';
import { createPrivateExternalPlatformAccountService } from '../../applications/private-external-platform-account/private-external-platform-account-service.js';
import { createApiServer } from '../../apps/api/src/create-api-server.js';
import {
  createCommerceRelationship,
  createCommerceRelationshipId,
  createExternalPlatform,
  createExternalPlatformAccount,
  createExternalPlatformAccountId,
  createExternalPlatformNamespace,
  createPlatformAccountIdentifier,
} from '../../modules/identity-infrastructure/external-platform-contract.js';
import { createCommerceProfileId } from '../../modules/identity-infrastructure/identity-contract.js';

const accountA = { accountId: 'test:token-a', correlationId: 'correlation-a' };
const accountB = { accountId: 'test:token-b', correlationId: 'correlation-b' };
const createdAt = '2026-08-27T00:00:00.000Z';

describe('Private External Platform Account API', () => {
  it('lists authorized accounts and fails closed for foreign account and injected resource parameters', async () => {
    const fixture = setup();
    await fixture.membershipService.createIdentityForAuthenticatedAccount(accountA);
    await fixture.membershipService.createIdentityForAuthenticatedAccount(accountB);
    const profileA = await fixture.privateCommerceProfileService.createMyCommerceProfile(accountA, {
      displayName: 'Studio A',
    });
    const profileB = await fixture.privateCommerceProfileService.createMyCommerceProfile(accountB, {
      displayName: 'Studio B',
    });
    const externalAccountA = await fixture.createAccount('external-a', 'instagram', 'studio-a');
    const externalAccountB = await fixture.createAccount('external-b', 'tiktok', 'studio-b');
    await fixture.relate('relationship-a', externalAccountA.externalPlatformAccountId, profileA.commerceProfileId);
    await fixture.relate('relationship-b', externalAccountB.externalPlatformAccountId, profileB.commerceProfileId);
    const server = await createApiServer({
      authContextProvider: new InMemoryAuthContextProvider([
        { accessToken: 'token-a', actor: { kind: 'creator', creatorId: 'creator-a' } },
        { accessToken: 'token-b', actor: { kind: 'creator', creatorId: 'creator-b' } },
      ]),
      privateExternalPlatformAccountService: fixture.service,
    });

    try {
      const own = await server.inject({
        method: 'GET',
        url: '/api/v1/private/external-platform-accounts?identityId=identity-b&profileId=profile-b&relationshipId=relationship-b',
        headers: { authorization: 'Bearer token-a' },
      });
      expect(own.statusCode).toBe(200);
      expect(own.json()).toEqual({
        accounts: [
          {
            externalPlatformAccountId: 'external-a',
            platform: 'instagram',
            platformAccountId: 'studio-a',
            lifecycle: 'ACTIVE',
          },
        ],
      });

      const foreign = await server.inject({
        method: 'GET',
        url: '/api/v1/private/external-platform-accounts/external-b?identityId=identity-b&profileId=profile-b&relationshipId=relationship-b',
        headers: { authorization: 'Bearer token-a' },
      });
      expect(foreign.statusCode).toBe(404);
      expect(foreign.json()).toMatchObject({
        error: { code: 'private_external_platform_account_not_found' },
      });
    } finally {
      await server.close();
    }
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
  const commerceProfileService = createCanonicalCommerceProfileService({
    repository: profileRepository,
    idGenerator: {
      generate: () => createCommerceProfileId(profileIdGenerator.generate()),
    },
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
    privateCommerceProfileService: createPrivateCommerceProfileService({
      currentUserIdentityService,
      commerceProfileService,
    }),
    service: createPrivateExternalPlatformAccountService({
      currentUserIdentityService,
      commerceProfileService,
      commerceRelationshipRepository: relationshipRepository,
      externalPlatformAccountRepository: accountRepository,
    }),
    async createAccount(accountId: string, platform: string, platformAccountId: string) {
      const account = createExternalPlatformAccount({
        externalPlatformAccountId: createExternalPlatformAccountId(accountId),
        platform: createExternalPlatform(createExternalPlatformNamespace(platform)),
        platformAccountId: createPlatformAccountIdentifier(platformAccountId),
        createdAt,
      });
      await accountRepository.create(account);
      return account;
    },
    async relate(relationshipId: string, externalPlatformAccountId: string, commerceProfileId: string) {
      await relationshipRepository.create(
        createCommerceRelationship({
          commerceRelationshipId: createCommerceRelationshipId(relationshipId),
          externalPlatformAccountId: createExternalPlatformAccountId(externalPlatformAccountId),
          commerceProfileId: commerceProfileId as never,
          role: 'OWNER',
          effectiveAt: createdAt,
          createdAt,
        }),
      );
    },
  };
}
