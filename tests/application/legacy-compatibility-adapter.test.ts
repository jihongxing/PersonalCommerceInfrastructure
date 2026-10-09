import { describe, expect, it } from 'vitest';

import { InMemoryAccountIdentityMembershipRepository } from '../../adapters/in-memory/in-memory-account-identity-membership-repository.js';
import { InMemoryCommerceProfileRepository } from '../../adapters/in-memory/in-memory-commerce-profile-repository.js';
import { InMemoryIdentityRepository } from '../../adapters/in-memory/in-memory-identity-repository.js';
import { InMemoryLegacySubjectMappingRepository } from '../../adapters/in-memory/in-memory-legacy-subject-mapping-repository.js';
import { createLegacyCompatibilityAdapter } from '../../applications/legacy-subject-mapping/legacy-compatibility-adapter.js';
import { createAccountContext } from '../../applications/core/account-context.js';
import { createIdentityProfileAuthorizationPolicy } from '../../applications/core/identity-profile-authorization-policy.js';
import { createIdentityProfileContextResolver } from '../../applications/core/identity-profile-context.js';
import { createAccountIdentityMembership } from '../../modules/account-identity-membership/account-identity-membership.js';
import { createCommerceProfile } from '../../modules/commerce-profile/commerce-profile.js';
import { createIdentity } from '../../modules/identity/identity.js';
import { createLegacySubjectMapping } from '../../modules/legacy-subject-mapping/legacy-subject-mapping.js';

const timestamp = '2026-08-26T00:00:00.000Z';

async function createFixture() {
  const identityRepository = new InMemoryIdentityRepository();
  const profileRepository = new InMemoryCommerceProfileRepository();
  const mappingRepository = new InMemoryLegacySubjectMappingRepository();
  const membershipRepository = new InMemoryAccountIdentityMembershipRepository();
  const identity = createIdentity('identity-1', timestamp);
  const profile = createCommerceProfile({
    commerceProfileId: 'profile-a',
    identityId: identity.identityId,
    presentation: { displayName: 'Initial Profile', socialLinks: [] },
    createdAt: timestamp,
  });
  const mapping = createLegacySubjectMapping({
    mappingId: 'mapping-1',
    legacySubjectReference: 'creator-1',
    identityId: identity.identityId,
    initialCommerceProfileId: profile.commerceProfileId,
    createdAt: timestamp,
  });
  await identityRepository.create(identity);
  await profileRepository.create(profile);
  await mappingRepository.create(mapping);
  const adapter = createLegacyCompatibilityAdapter({
    legacySubjectMappingRepository: mappingRepository,
    identityRepository,
    commerceProfileRepository: profileRepository,
    authorizationPolicy: createIdentityProfileAuthorizationPolicy({
      contextResolver: createIdentityProfileContextResolver({
        identityRepository,
        commerceProfileRepository: profileRepository,
        accountIdentityMembershipRepository: membershipRepository,
      }),
    }),
  });
  return {
    adapter,
    identityRepository,
    profileRepository,
    mappingRepository,
    membershipRepository,
  };
}

describe('Legacy Compatibility Adapter', () => {
  it.each(['ACTIVE', 'VERIFIED'] as const)('resolves %s mappings', async (state) => {
    const fixture = await createFixture();
    if (state === 'VERIFIED') {
      await fixture.mappingRepository.updateState('mapping-1', state, timestamp, {
        verifiedAt: '2026-08-26T00:01:00.000Z',
      });
    }

    await expect(fixture.adapter.resolveByLegacySubject('creator-1')).resolves.toMatchObject({
      legacySubjectReference: 'creator-1',
      identityId: 'identity-1',
      initialCommerceProfileId: 'profile-a',
      mappingState: state,
      resolutionSource: 'LEGACY_SUBJECT_MAPPING',
    });
  });

  it('distinguishes missing, ambiguous, failed, retired, and invalid mappings', async () => {
    const missing = await createFixture();
    await expect(missing.adapter.resolveByLegacySubject('unknown')).rejects.toMatchObject({
      code: 'compatibility_not_mapped',
    });

    for (const [state, code, metadata] of [
      [
        'AMBIGUOUS',
        'compatibility_mapping_ambiguous',
        { mappingFailureCode: 'MULTIPLE_CANDIDATES' },
      ],
      ['FAILED', 'compatibility_mapping_failed', { mappingFailureCode: 'LEGACY_DATA_INVALID' }],
      ['RETIRED', 'compatibility_mapping_retired', {}],
    ] as const) {
      const fixture = await createFixture();
      await fixture.mappingRepository.updateState('mapping-1', state, timestamp, metadata);
      await expect(fixture.adapter.resolveByLegacySubject('creator-1')).rejects.toMatchObject({
        code,
      });
    }

    const invalid = await createFixture();
    await invalid.mappingRepository.create(
      createLegacySubjectMapping({
        mappingId: 'mapping-2',
        legacySubjectReference: 'creator-2',
        identityId: 'missing-identity',
        initialCommerceProfileId: 'missing-profile',
        createdAt: timestamp,
      }),
    );
    await expect(invalid.adapter.resolveByLegacySubject('creator-2')).rejects.toMatchObject({
      code: 'compatibility_mapping_invalid',
    });

    const mismatched = await createFixture();
    await mismatched.identityRepository.create(createIdentity('identity-2', timestamp));
    await mismatched.profileRepository.create(
      createCommerceProfile({
        commerceProfileId: 'profile-b',
        identityId: 'identity-2',
        presentation: { displayName: 'Wrong owner', socialLinks: [] },
        createdAt: timestamp,
      }),
    );
    await mismatched.mappingRepository.create(
      createLegacySubjectMapping({
        mappingId: 'mapping-3',
        legacySubjectReference: 'creator-3',
        identityId: 'identity-1',
        initialCommerceProfileId: 'profile-b',
        createdAt: timestamp,
      }),
    );
    await expect(mismatched.adapter.resolveByLegacySubject('creator-3')).rejects.toMatchObject({
      code: 'compatibility_mapping_invalid',
    });
  });

  it('does not guess a legacy subject from AccountContext and requires membership for mutation', async () => {
    const fixture = await createFixture();
    const account = createAccountContext({ accountId: 'account-1', correlationId: 'test-1' });

    await expect(fixture.adapter.resolveForMutation(account, 'creator-1')).rejects.toMatchObject({
      code: 'compatibility_access_denied',
    });
    await expect(fixture.adapter.resolveForMutation(account, '')).rejects.toMatchObject({
      code: 'compatibility_not_resolvable',
    });
  });

  it('requires active OWNER membership and active Identity/Profile for mutation', async () => {
    const fixture = await createFixture();
    const account = createAccountContext({ accountId: 'account-1', correlationId: 'test-2' });
    await fixture.membershipRepository.create(
      createAccountIdentityMembership({
        membershipId: 'membership-1',
        accountId: account.accountId,
        identityId: 'identity-1',
        authority: 'OWNER',
        createdAt: timestamp,
      }),
    );
    await fixture.profileRepository.updateLifecycle('profile-a', 'ACTIVE', timestamp);

    await expect(fixture.adapter.resolveForMutation(account, 'creator-1')).resolves.toMatchObject({
      identityLifecycle: 'ACTIVE',
      profileLifecycle: 'ACTIVE',
    });

    await fixture.identityRepository.updateLifecycle('identity-1', 'SUSPENDED', timestamp);
    await expect(fixture.adapter.resolveForMutation(account, 'creator-1')).rejects.toMatchObject({
      code: 'identity_not_operational',
    });

    await fixture.identityRepository.updateLifecycle('identity-1', 'ARCHIVED', timestamp);
    await expect(fixture.adapter.resolveForMutation(account, 'creator-1')).rejects.toMatchObject({
      code: 'identity_not_operational',
    });
  });

  it('rejects suspended and archived mapped Profiles for mutation while preserving read resolution', async () => {
    const fixture = await createFixture();
    const account = createAccountContext({ accountId: 'account-1', correlationId: 'test-3' });
    await fixture.membershipRepository.create(
      createAccountIdentityMembership({
        membershipId: 'membership-1',
        accountId: account.accountId,
        identityId: 'identity-1',
        authority: 'OWNER',
        createdAt: timestamp,
      }),
    );
    await fixture.profileRepository.updateLifecycle('profile-a', 'ACTIVE', timestamp);
    await fixture.profileRepository.updateLifecycle('profile-a', 'SUSPENDED', timestamp);

    await expect(fixture.adapter.resolveByLegacySubject('creator-1')).resolves.toMatchObject({
      profileLifecycle: 'SUSPENDED',
    });
    await expect(fixture.adapter.resolveForMutation(account, 'creator-1')).rejects.toMatchObject({
      code: 'commerce_profile_not_operational',
    });

    await fixture.profileRepository.updateLifecycle('profile-a', 'ARCHIVED', timestamp);
    await expect(fixture.adapter.resolveForMutation(account, 'creator-1')).rejects.toMatchObject({
      code: 'commerce_profile_not_operational',
    });
  });

  it('denies inactive and wrong-Identity memberships', async () => {
    const fixture = await createFixture();
    const account = createAccountContext({ accountId: 'account-1', correlationId: 'test-4' });
    await fixture.profileRepository.updateLifecycle('profile-a', 'ACTIVE', timestamp);
    await fixture.identityRepository.create(createIdentity('identity-2', timestamp));
    await fixture.membershipRepository.create(
      createAccountIdentityMembership({
        membershipId: 'membership-1',
        accountId: account.accountId,
        identityId: 'identity-2',
        authority: 'OWNER',
        createdAt: timestamp,
      }),
    );

    await expect(fixture.adapter.resolveForMutation(account, 'creator-1')).rejects.toMatchObject({
      code: 'compatibility_access_denied',
    });

    await fixture.membershipRepository.updateState(
      'membership-1',
      'SUSPENDED',
      '2026-08-26T00:01:00.000Z',
    );
    await fixture.membershipRepository.create(
      createAccountIdentityMembership({
        membershipId: 'membership-2',
        accountId: account.accountId,
        identityId: 'identity-1',
        authority: 'OWNER',
        createdAt: timestamp,
      }),
    );
    await fixture.membershipRepository.updateState(
      'membership-2',
      'SUSPENDED',
      '2026-08-26T00:01:00.000Z',
    );
    await expect(fixture.adapter.resolveForMutation(account, 'creator-1')).rejects.toMatchObject({
      code: 'compatibility_access_denied',
    });
  });

  it('resolves the mapped initial Profile when the Identity owns multiple Profiles', async () => {
    const fixture = await createFixture();
    await fixture.profileRepository.create(
      createCommerceProfile({
        commerceProfileId: 'profile-b',
        identityId: 'identity-1',
        presentation: { displayName: 'Second Profile', socialLinks: [] },
        createdAt: timestamp,
      }),
    );

    await expect(fixture.adapter.resolveByLegacySubject('creator-1')).resolves.toMatchObject({
      initialCommerceProfileId: 'profile-a',
    });
  });

  it('keeps mapping reads side-effect free', async () => {
    const fixture = await createFixture();
    const before = await fixture.mappingRepository.findHistoricalByLegacySubject('creator-1');

    await fixture.adapter.resolveByLegacySubject('creator-1');

    await expect(
      fixture.mappingRepository.findHistoricalByLegacySubject('creator-1'),
    ).resolves.toEqual(before);
  });
});
