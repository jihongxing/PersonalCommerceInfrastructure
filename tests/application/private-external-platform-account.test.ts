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
import { createPrivateExternalPlatformAccountService } from '../../applications/private-external-platform-account/private-external-platform-account-service.js';
import {
  createCommerceRelationship,
  createCommerceRelationshipId,
  createExternalPlatform,
  createExternalPlatformAccount,
  createExternalPlatformAccountId,
  createExternalPlatformNamespace,
  createPlatformAccountIdentifier,
} from '../../modules/identity-infrastructure/external-platform-contract.js';
import { createCommerceProfileId, createInternalIdentityId } from '../../modules/identity-infrastructure/identity-contract.js';

const accountA = { accountId: 'test:account-a', correlationId: 'correlation-a' };
const accountB = { accountId: 'test:account-b', correlationId: 'correlation-b' };
const createdAt = '2026-08-27T00:00:00.000Z';

describe('Private External Platform Account service', () => {
  it('lists only relationship-authorized accounts across the current Identity profiles', async () => {
    const fixture = setup();
    const identityA = await fixture.membershipService.createIdentityForAuthenticatedAccount(accountA);
    const identityB = await fixture.membershipService.createIdentityForAuthenticatedAccount(accountB);
    const profileA1 = await createProfile(fixture, identityA.identity.identityId, 'Studio A');
    const profileA2 = await createProfile(fixture, identityA.identity.identityId, 'Brand A');
    const profileB = await createProfile(fixture, identityB.identity.identityId, 'Studio B');
    const accountInstagramA = await createAccount(fixture, 'account-instagram-a', 'instagram', 'studio-a');
    const accountInstagramA2 = await createAccount(fixture, 'account-instagram-a-2', 'instagram', 'brand-a');
    const accountTikTokB = await createAccount(fixture, 'account-tiktok-b', 'tiktok', 'studio-b');
    await relate(fixture, 'relationship-a-1', accountInstagramA, profileA1.commerceProfileId);
    await relate(fixture, 'relationship-a-2', accountInstagramA2, profileA2.commerceProfileId);
    await relate(fixture, 'relationship-b', accountTikTokB, profileB.commerceProfileId);

    await expect(fixture.service.listMyExternalPlatformAccounts(accountA)).resolves.toEqual([
      {
        externalPlatformAccountId: 'account-instagram-a',
        platform: 'instagram',
        platformAccountId: 'studio-a',
        lifecycle: 'ACTIVE',
      },
      {
        externalPlatformAccountId: 'account-instagram-a-2',
        platform: 'instagram',
        platformAccountId: 'brand-a',
        lifecycle: 'ACTIVE',
      },
    ]);
  });

  it('fails closed for a foreign account and leaves an empty authorized scope empty', async () => {
    const fixture = setup();
    await fixture.membershipService.createIdentityForAuthenticatedAccount(accountA);
    const identityB = await fixture.membershipService.createIdentityForAuthenticatedAccount(accountB);
    const profileB = await createProfile(fixture, identityB.identity.identityId, 'Studio B');
    const foreign = await createAccount(fixture, 'account-b', 'youtube', 'channel-b');
    await relate(fixture, 'relationship-b', foreign, profileB.commerceProfileId);

    await expect(fixture.service.listMyExternalPlatformAccounts(accountA)).resolves.toEqual([]);
    await expect(
      fixture.service.getMyExternalPlatformAccount(accountA, foreign.externalPlatformAccountId),
    ).rejects.toMatchObject({
      category: 'not_found',
      code: 'private_external_platform_account_not_found',
    });
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
  const commerceProfileService = createCanonicalCommerceProfileService({
    repository: profileRepository,
    idGenerator: {
      generate: () => createCommerceProfileId(`profile-${Math.random().toString(16).slice(2)}`),
    },
    clock: new FixedClock(createdAt),
  });
  const accountRepository = new InMemoryExternalPlatformAccountRepository();
  const relationshipRepository = new InMemoryCommerceRelationshipRepository(
    accountRepository,
    profileRepository,
  );

  return {
    membershipService,
    commerceProfileService,
    accountRepository,
    relationshipRepository,
    service: createPrivateExternalPlatformAccountService({
      currentUserIdentityService: createCurrentUserIdentityService({
        identityRepository,
        membershipRepository,
      }),
      commerceProfileService,
      commerceRelationshipRepository: relationshipRepository,
      externalPlatformAccountRepository: accountRepository,
    }),
  };
}

async function createProfile(
  fixture: ReturnType<typeof setup>,
  identityId: string,
  displayName: string,
) {
  return fixture.commerceProfileService.create({
    owningIdentityId: createInternalIdentityId(identityId),
    presentation: { displayName },
  });
}

async function createAccount(
  fixture: ReturnType<typeof setup>,
  externalPlatformAccountId: string,
  platform: string,
  platformAccountId: string,
) {
  const account = createExternalPlatformAccount({
    externalPlatformAccountId: createExternalPlatformAccountId(externalPlatformAccountId),
    platform: createExternalPlatform(createExternalPlatformNamespace(platform)),
    platformAccountId: createPlatformAccountIdentifier(platformAccountId),
    createdAt,
  });
  await fixture.accountRepository.create(account);
  return account;
}

async function relate(
  fixture: ReturnType<typeof setup>,
  relationshipId: string,
  account: { readonly externalPlatformAccountId: ReturnType<typeof createExternalPlatformAccountId> },
  commerceProfileId: ReturnType<typeof createCommerceProfileId>,
) {
  await fixture.relationshipRepository.create(
    createCommerceRelationship({
      commerceRelationshipId: createCommerceRelationshipId(relationshipId),
      externalPlatformAccountId: account.externalPlatformAccountId,
      commerceProfileId,
      role: 'OWNER',
      effectiveAt: createdAt,
      createdAt,
    }),
  );
}
