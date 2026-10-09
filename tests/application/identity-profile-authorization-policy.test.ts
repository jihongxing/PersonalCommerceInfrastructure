import { describe, expect, it } from 'vitest';

import { InMemoryAccountIdentityMembershipRepository } from '../../adapters/in-memory/in-memory-account-identity-membership-repository.js';
import { InMemoryCommerceProfileRepository } from '../../adapters/in-memory/in-memory-commerce-profile-repository.js';
import { InMemoryIdentityRepository } from '../../adapters/in-memory/in-memory-identity-repository.js';
import { createAccountContext } from '../../applications/core/account-context.js';
import { createIdentityProfileAuthorizationPolicy } from '../../applications/core/identity-profile-authorization-policy.js';
import { createIdentityProfileContextResolver } from '../../applications/core/identity-profile-context.js';
import { createAccountIdentityMembership } from '../../modules/account-identity-membership/account-identity-membership.js';
import { createCommerceProfile } from '../../modules/commerce-profile/commerce-profile.js';
import { createIdentity } from '../../modules/identity/identity.js';

const timestamp = '2026-08-26T00:00:00.000Z';
const accountA = createAccountContext({ accountId: 'account-a', correlationId: 'correlation-a' });
const accountB = createAccountContext({ accountId: 'account-b', correlationId: 'correlation-b' });

async function createFixture() {
  const identityRepository = new InMemoryIdentityRepository();
  const commerceProfileRepository = new InMemoryCommerceProfileRepository();
  const membershipRepository = new InMemoryAccountIdentityMembershipRepository();
  const identityA = createIdentity('identity-a', timestamp);
  const identityB = createIdentity('identity-b', timestamp);
  const profileA1 = createCommerceProfile({
    commerceProfileId: 'profile-a1',
    identityId: identityA.identityId,
    presentation: { displayName: 'A1', socialLinks: [] },
    createdAt: timestamp,
  });
  const profileA2 = createCommerceProfile({
    commerceProfileId: 'profile-a2',
    identityId: identityA.identityId,
    presentation: { displayName: 'A2', socialLinks: [] },
    createdAt: timestamp,
  });
  const profileB = createCommerceProfile({
    commerceProfileId: 'profile-b',
    identityId: identityB.identityId,
    presentation: { displayName: 'B', socialLinks: [] },
    createdAt: timestamp,
  });
  await identityRepository.create(identityA);
  await identityRepository.create(identityB);
  await commerceProfileRepository.create(profileA1);
  await commerceProfileRepository.create(profileA2);
  await commerceProfileRepository.create(profileB);
  await membershipRepository.create(
    createAccountIdentityMembership({
      membershipId: 'membership-a',
      accountId: accountA.accountId,
      identityId: identityA.identityId,
      authority: 'OWNER',
      createdAt: timestamp,
    }),
  );
  await membershipRepository.create(
    createAccountIdentityMembership({
      membershipId: 'membership-b',
      accountId: accountB.accountId,
      identityId: identityB.identityId,
      authority: 'OWNER',
      createdAt: timestamp,
    }),
  );
  const policy = createIdentityProfileAuthorizationPolicy({
    contextResolver: createIdentityProfileContextResolver({
      identityRepository,
      commerceProfileRepository,
      accountIdentityMembershipRepository: membershipRepository,
    }),
  });
  return {
    identityRepository,
    commerceProfileRepository,
    membershipRepository,
    policy,
  };
}

describe('Identity and Profile Authorization Policy', () => {
  it('authorizes an active OWNER for identity and profile mutation', async () => {
    const fixture = await createFixture();
    await fixture.commerceProfileRepository.updateLifecycle('profile-a1', 'ACTIVE', timestamp);

    await expect(
      fixture.policy.authorizeIdentityMutation(accountA, 'identity-a', 'CREATE_COMMERCE_PROFILE'),
    ).resolves.toMatchObject({ identityId: 'identity-a', authorization: 'OWNER' });
    await expect(
      fixture.policy.authorizeProfileMutation(
        accountA,
        'identity-a',
        'profile-a1',
        'UPDATE_PRESENTATION',
      ),
    ).resolves.toMatchObject({ commerceProfileId: 'profile-a1' });
  });

  it('enforces cross-identity and cross-profile isolation', async () => {
    const fixture = await createFixture();

    await expect(
      fixture.policy.authorizeIdentityMutation(accountA, 'identity-b', 'CREATE_COMMERCE_PROFILE'),
    ).rejects.toMatchObject({ code: 'context_access_denied' });
    await expect(
      fixture.policy.authorizeProfileRead(accountA, 'identity-a', 'profile-b'),
    ).rejects.toMatchObject({ code: 'context_mismatch' });
    await expect(
      fixture.policy.authorizeProfileRead(accountB, 'identity-a', 'profile-a1'),
    ).rejects.toMatchObject({ code: 'context_access_denied' });
  });

  it('requires explicit profile selection and does not authorize another profile by default', async () => {
    const fixture = await createFixture();
    await fixture.commerceProfileRepository.updateLifecycle('profile-a2', 'ACTIVE', timestamp);

    const first = await fixture.policy.authorizeProfileMutation(
      accountA,
      'identity-a',
      'profile-a1',
      'UPDATE_PRESENTATION',
    );
    const second = await fixture.policy.authorizeProfileMutation(
      accountA,
      'identity-a',
      'profile-a2',
      'UPDATE_PRESENTATION',
    );

    expect(first.commerceProfileId).toBe('profile-a1');
    expect(second.commerceProfileId).toBe('profile-a2');
  });

  it('denies identity and profile mutation when lifecycle gates are not operational', async () => {
    const fixture = await createFixture();
    await fixture.identityRepository.updateLifecycle('identity-a', 'SUSPENDED', timestamp);

    await expect(
      fixture.policy.authorizeIdentityMutation(accountA, 'identity-a', 'SUSPEND_IDENTITY'),
    ).rejects.toMatchObject({ code: 'identity_not_operational' });
    await fixture.identityRepository.updateLifecycle('identity-a', 'ARCHIVED', timestamp);
    await expect(
      fixture.policy.authorizeProfileMutation(
        accountA,
        'identity-a',
        'profile-a1',
        'UPDATE_PRESENTATION',
      ),
    ).rejects.toMatchObject({ code: 'identity_not_operational' });
  });

  it('re-evaluates membership after a context was previously resolved', async () => {
    const fixture = await createFixture();
    await fixture.policy.authorizeProfileRead(accountA, 'identity-a', 'profile-a1');
    await fixture.membershipRepository.updateState('membership-a', 'REVOKED', timestamp, timestamp);

    await expect(
      fixture.policy.authorizeProfileMutation(
        accountA,
        'identity-a',
        'profile-a1',
        'UPDATE_PRESENTATION',
      ),
    ).rejects.toMatchObject({ code: 'context_membership_not_active' });
  });

  it('does not treat creatorId or Actor kind as authorization evidence', async () => {
    const fixture = await createFixture();

    await expect(
      fixture.policy.authorizeIdentityMutation(
        accountA,
        'creator-legacy-1',
        'CREATE_COMMERCE_PROFILE',
      ),
    ).rejects.toMatchObject({ code: 'context_identity_not_found' });
    await expect(
      fixture.policy.authorizeIdentityMutation(
        createAccountContext({ accountId: 'creator-actor', correlationId: 'creator-actor' }),
        'identity-a',
        'CREATE_COMMERCE_PROFILE',
      ),
    ).rejects.toMatchObject({ code: 'context_access_denied' });
  });
});
