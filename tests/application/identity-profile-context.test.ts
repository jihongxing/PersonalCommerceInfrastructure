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

async function createFixture() {
  const identityRepository = new InMemoryIdentityRepository();
  const commerceProfileRepository = new InMemoryCommerceProfileRepository();
  const accountIdentityMembershipRepository = new InMemoryAccountIdentityMembershipRepository();
  const identity = createIdentity('identity-1', timestamp);
  const profileA = createCommerceProfile({
    commerceProfileId: 'profile-a',
    identityId: identity.identityId,
    presentation: { displayName: 'Profile A', socialLinks: [] },
    createdAt: timestamp,
  });
  const profileB = createCommerceProfile({
    commerceProfileId: 'profile-b',
    identityId: identity.identityId,
    presentation: { displayName: 'Profile B', socialLinks: [] },
    createdAt: timestamp,
  });
  await identityRepository.create(identity);
  await commerceProfileRepository.create(profileA);
  await commerceProfileRepository.create(profileB);
  await accountIdentityMembershipRepository.create(
    createAccountIdentityMembership({
      membershipId: 'membership-1',
      accountId: 'account-1',
      identityId: identity.identityId,
      authority: 'OWNER',
      createdAt: timestamp,
    }),
  );

  return {
    account: createAccountContext({ accountId: 'account-1', correlationId: 'test-correlation' }),
    wrongAccount: createAccountContext({
      accountId: 'account-2',
      correlationId: 'wrong-account-correlation',
    }),
    identityRepository,
    commerceProfileRepository,
    accountIdentityMembershipRepository,
    resolver: createIdentityProfileContextResolver({
      identityRepository,
      commerceProfileRepository,
      accountIdentityMembershipRepository,
    }),
    authorizationPolicy: createIdentityProfileAuthorizationPolicy({
      contextResolver: createIdentityProfileContextResolver({
        identityRepository,
        commerceProfileRepository,
        accountIdentityMembershipRepository,
      }),
    }),
  };
}

describe('Identity and Profile Application Context', () => {
  it('resolves explicit Account, Identity, and Profile context with active OWNER evidence', async () => {
    const fixture = await createFixture();

    await expect(
      fixture.resolver.resolveProfileContext(fixture.account, 'identity-1', 'profile-a'),
    ).resolves.toMatchObject({
      commerceProfileId: 'profile-a',
      profileLifecycle: 'DRAFT',
      identity: {
        accountId: 'account-1',
        correlationId: 'test-correlation',
        identityId: 'identity-1',
        identityLifecycle: 'ACTIVE',
        membershipId: 'membership-1',
        authorization: 'OWNER',
      },
    });
  });

  it('fails closed for missing Identity, missing Profile, and cross-Identity Profile context', async () => {
    const fixture = await createFixture();
    await fixture.identityRepository.create(createIdentity('identity-2', timestamp));
    await fixture.commerceProfileRepository.create(
      createCommerceProfile({
        commerceProfileId: 'profile-other',
        identityId: 'identity-2',
        presentation: { displayName: 'Other Identity', socialLinks: [] },
        createdAt: timestamp,
      }),
    );

    await expect(
      fixture.resolver.resolveIdentityContext(fixture.account, 'missing-identity'),
    ).rejects.toMatchObject({ code: 'context_identity_not_found' });
    await expect(
      fixture.resolver.resolveProfileContext(fixture.account, 'identity-1', 'missing-profile'),
    ).rejects.toMatchObject({ code: 'context_profile_not_found' });
    await expect(
      fixture.resolver.resolveProfileContext(fixture.account, 'identity-1', 'profile-other'),
    ).rejects.toMatchObject({ code: 'context_mismatch' });
  });

  it('requires current active membership evidence and does not authorize a wrong Account', async () => {
    const fixture = await createFixture();

    await expect(
      fixture.resolver.resolveIdentityContext(fixture.wrongAccount, 'identity-1'),
    ).rejects.toMatchObject({ code: 'context_access_denied' });

    await fixture.accountIdentityMembershipRepository.updateState(
      'membership-1',
      'SUSPENDED',
      '2026-08-26T00:01:00.000Z',
    );
    await expect(
      fixture.resolver.resolveIdentityContext(fixture.account, 'identity-1'),
    ).rejects.toMatchObject({ code: 'context_membership_not_active' });
  });

  it('keeps profiles distinct and never selects a default Profile', async () => {
    const fixture = await createFixture();

    const profileA = await fixture.resolver.resolveProfileContext(
      fixture.account,
      'identity-1',
      'profile-a',
    );
    const profileB = await fixture.resolver.resolveProfileContext(
      fixture.account,
      'identity-1',
      'profile-b',
    );

    expect(profileA.commerceProfileId).toBe('profile-a');
    expect(profileB.commerceProfileId).toBe('profile-b');
    expect(profileA).not.toEqual(profileB);
  });

  it('re-evaluates Identity and Profile operational state for mutation context', async () => {
    const fixture = await createFixture();
    await fixture.commerceProfileRepository.updateLifecycle('profile-a', 'ACTIVE', timestamp);
    await expect(
      fixture.authorizationPolicy.authorizeProfileMutation(
        fixture.account,
        'identity-1',
        'profile-a',
        'UPDATE_PRESENTATION',
      ),
    ).resolves.toMatchObject({
      commerceProfileId: 'profile-a',
      identity: { identityLifecycle: 'ACTIVE' },
      profileLifecycle: 'ACTIVE',
    });

    await fixture.identityRepository.updateLifecycle('identity-1', 'SUSPENDED', timestamp);
    await expect(
      fixture.authorizationPolicy.authorizeProfileMutation(
        fixture.account,
        'identity-1',
        'profile-a',
        'UPDATE_PRESENTATION',
      ),
    ).rejects.toMatchObject({ code: 'identity_not_operational' });
    await fixture.identityRepository.updateLifecycle('identity-1', 'ARCHIVED', timestamp);
    await expect(
      fixture.authorizationPolicy.authorizeProfileMutation(
        fixture.account,
        'identity-1',
        'profile-a',
        'UPDATE_PRESENTATION',
      ),
    ).rejects.toMatchObject({ code: 'identity_not_operational' });
  });

  it('rejects suspended and archived Profiles for mutation while preserving authorized read context', async () => {
    const fixture = await createFixture();
    await fixture.commerceProfileRepository.updateLifecycle('profile-a', 'ACTIVE', timestamp);
    await fixture.commerceProfileRepository.updateLifecycle('profile-a', 'SUSPENDED', timestamp);

    await expect(
      fixture.resolver.resolveProfileContext(fixture.account, 'identity-1', 'profile-a'),
    ).resolves.toMatchObject({ profileLifecycle: 'SUSPENDED' });
    await expect(
      fixture.authorizationPolicy.authorizeProfileMutation(
        fixture.account,
        'identity-1',
        'profile-a',
        'UPDATE_PRESENTATION',
      ),
    ).rejects.toMatchObject({ code: 'commerce_profile_not_operational' });

    await fixture.commerceProfileRepository.updateLifecycle('profile-a', 'ARCHIVED', timestamp);
    await expect(
      fixture.authorizationPolicy.authorizeProfileMutation(
        fixture.account,
        'identity-1',
        'profile-a',
        'UPDATE_PRESENTATION',
      ),
    ).rejects.toMatchObject({ code: 'commerce_profile_not_operational' });
  });

  it('does not accept a legacy creatorId as a context principal', async () => {
    const fixture = await createFixture();

    await expect(
      fixture.resolver.resolveIdentityContext(fixture.account, 'creator-legacy-1'),
    ).rejects.toMatchObject({ code: 'context_identity_not_found' });
  });
});
