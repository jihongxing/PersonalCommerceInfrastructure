import { describe, expect, it } from 'vitest';

import { FixedClock } from '../../adapters/in-memory/fixed-clock.js';
import { InMemoryAccountIdentityMembershipRepository } from '../../adapters/in-memory/in-memory-account-identity-membership-repository.js';
import { InMemoryCommerceProfileRepository } from '../../adapters/in-memory/in-memory-commerce-profile-repository.js';
import { InMemoryIdentityRepository } from '../../adapters/in-memory/in-memory-identity-repository.js';
import { InMemoryProductEventStore } from '../../adapters/in-memory/in-memory-product-event-store.js';
import { InMemoryUnitOfWork } from '../../adapters/in-memory/in-memory-unit-of-work.js';
import { SequentialIdGenerator } from '../../adapters/in-memory/sequential-id-generator.js';
import { createAccountIdentityMembershipService } from '../../applications/account-identity-membership/account-identity-membership-service.js';
import { createCommerceProfileService } from '../../applications/commerce-profile/commerce-profile-service.js';
import { createIdentityProfileAuthorizationPolicy } from '../../applications/core/identity-profile-authorization-policy.js';
import { createIdentityProfileContextResolver } from '../../applications/core/identity-profile-context.js';

const accountA = { accountId: 'supabase:account-a', correlationId: 'correlation-a' };
const accountB = { accountId: 'supabase:account-b', correlationId: 'correlation-b' };

function setup() {
  const identityRepository = new InMemoryIdentityRepository();
  const membershipRepository = new InMemoryAccountIdentityMembershipRepository();
  const commerceProfileRepository = new InMemoryCommerceProfileRepository();
  const productEventStore = new InMemoryProductEventStore();
  const unitOfWork = new InMemoryUnitOfWork(
    [identityRepository, membershipRepository, productEventStore],
    productEventStore,
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
    clock: new FixedClock('2026-08-26T00:00:00.000Z'),
  });
  const authorizationPolicy = createIdentityProfileAuthorizationPolicy({
    contextResolver: createIdentityProfileContextResolver({
      identityRepository,
      commerceProfileRepository,
      accountIdentityMembershipRepository: membershipRepository,
    }),
  });
  const service = createCommerceProfileService({
    commerceProfileRepository,
    authorizationPolicy,
    commerceProfileIdGenerator: new SequentialIdGenerator('commerce-profile'),
    clock: new FixedClock('2026-08-26T00:00:00.000Z'),
  });
  return {
    identityRepository,
    membershipRepository,
    membershipService,
    commerceProfileRepository,
    service,
  };
}

async function createIdentityWithOwner(
  membershipService: ReturnType<typeof setup>['membershipService'],
) {
  return membershipService.createIdentityForAuthenticatedAccount(accountA);
}

describe('Commerce Profile application service', () => {
  it('creates and manages explicit profiles for an authorized Identity', async () => {
    const { membershipService, service } = setup();
    const { identity } = await createIdentityWithOwner(membershipService);
    const first = await service.create(accountA, {
      identityId: identity.identityId,
      presentation: { displayName: 'First', socialLinks: [] },
    });
    const second = await service.create(accountA, {
      identityId: identity.identityId,
      presentation: { displayName: 'Second', socialLinks: [] },
    });

    await service.update(accountA, identity.identityId, first.commerceProfileId, {
      displayName: 'First Updated',
      socialLinks: [],
    });
    await service.activate(accountA, identity.identityId, first.commerceProfileId);
    await service.suspend(accountA, identity.identityId, first.commerceProfileId);

    await expect(
      service.get(accountA, identity.identityId, first.commerceProfileId),
    ).resolves.toMatchObject({
      lifecycle: 'SUSPENDED',
      presentation: { displayName: 'First Updated' },
    });
    await expect(
      service.get(accountA, identity.identityId, second.commerceProfileId),
    ).resolves.toMatchObject({ lifecycle: 'DRAFT' });
  });

  it('fails closed for a wrong account and a mismatched Identity/Profile pair', async () => {
    const { membershipService, service } = setup();
    const { identity } = await createIdentityWithOwner(membershipService);
    const profile = await service.create(accountA, {
      identityId: identity.identityId,
      presentation: { displayName: 'Protected', socialLinks: [] },
    });

    await expect(
      service.update(accountB, identity.identityId, profile.commerceProfileId, {
        displayName: 'Hijacked',
        socialLinks: [],
      }),
    ).rejects.toMatchObject({ code: 'context_access_denied' });
    await expect(
      service.get(accountA, 'identity-other', profile.commerceProfileId),
    ).rejects.toMatchObject({ code: 'context_identity_not_found' });
  });

  it('denies mutations after membership revocation but preserves authorized historical reads', async () => {
    const { membershipRepository, membershipService, service } = setup();
    const { identity, membership } = await createIdentityWithOwner(membershipService);
    const profile = await service.create(accountA, {
      identityId: identity.identityId,
      presentation: { displayName: 'Historical', socialLinks: [] },
    });
    await membershipRepository.updateState(
      membership.membershipId,
      'SUSPENDED',
      '2026-08-26T01:00:00.000Z',
    );

    await expect(
      service.update(accountA, identity.identityId, profile.commerceProfileId, {
        displayName: 'Denied',
        socialLinks: [],
      }),
    ).rejects.toMatchObject({ code: 'context_membership_not_active' });
  });

  it('enforces Identity and Profile operational gates without changing persisted lifecycle', async () => {
    const { identityRepository, membershipService, service } = setup();
    const { identity } = await createIdentityWithOwner(membershipService);
    const activeProfile = await service.create(accountA, {
      identityId: identity.identityId,
      presentation: { displayName: 'Active', socialLinks: [] },
    });
    await service.activate(accountA, identity.identityId, activeProfile.commerceProfileId);
    await identityRepository.updateLifecycle(
      identity.identityId,
      'SUSPENDED',
      '2026-08-26T01:00:00.000Z',
    );

    await expect(
      service.update(accountA, identity.identityId, activeProfile.commerceProfileId, {
        displayName: 'Denied',
        socialLinks: [],
      }),
    ).rejects.toMatchObject({ code: 'identity_not_operational' });
    await expect(
      service.get(accountA, identity.identityId, activeProfile.commerceProfileId),
    ).resolves.toMatchObject({ lifecycle: 'ACTIVE' });

    await identityRepository.updateLifecycle(
      identity.identityId,
      'ACTIVE',
      '2026-08-26T02:00:00.000Z',
    );
    await service.suspend(accountA, identity.identityId, activeProfile.commerceProfileId);
    await expect(
      service.update(accountA, identity.identityId, activeProfile.commerceProfileId, {
        displayName: 'Denied while profile suspended',
        socialLinks: [],
      }),
    ).rejects.toMatchObject({ code: 'commerce_profile_not_operational' });
  });

  it('keeps archived profiles historically readable while denying every mutation', async () => {
    const { membershipService, service } = setup();
    const { identity } = await createIdentityWithOwner(membershipService);
    const profile = await service.create(accountA, {
      identityId: identity.identityId,
      presentation: { displayName: 'Archived', socialLinks: [] },
    });
    await service.archive(accountA, identity.identityId, profile.commerceProfileId);

    await expect(
      service.get(accountA, identity.identityId, profile.commerceProfileId),
    ).resolves.toMatchObject({ lifecycle: 'ARCHIVED' });
    await expect(
      service.update(accountA, identity.identityId, profile.commerceProfileId, {
        displayName: 'Denied',
        socialLinks: [],
      }),
    ).rejects.toMatchObject({ code: 'commerce_profile_not_operational' });
  });
});
