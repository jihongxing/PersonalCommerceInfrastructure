import { describe, expect, it } from 'vitest';

import { FixedClock } from '../../adapters/in-memory/fixed-clock.js';
import { InMemoryAccountIdentityMembershipRepository } from '../../adapters/in-memory/in-memory-account-identity-membership-repository.js';
import { InMemoryCommerceProfileRepository } from '../../adapters/in-memory/in-memory-commerce-profile-repository.js';
import { InMemoryIdentityRepository } from '../../adapters/in-memory/in-memory-identity-repository.js';
import { SequentialIdGenerator } from '../../adapters/in-memory/sequential-id-generator.js';
import { createAccountContext } from '../../applications/core/account-context.js';
import { createIdentityProfileAuthorizationPolicy } from '../../applications/core/identity-profile-authorization-policy.js';
import { createIdentityProfileContextResolver } from '../../applications/core/identity-profile-context.js';
import { createIdentityService } from '../../applications/identity/identity-service.js';
import { createAccountIdentityMembership } from '../../modules/account-identity-membership/account-identity-membership.js';

const timestamp = '2026-08-26T00:00:00.000Z';
const account = createAccountContext({ accountId: 'account-1', correlationId: 'test-correlation' });

function setup() {
  const identityRepository = new InMemoryIdentityRepository();
  const membershipRepository = new InMemoryAccountIdentityMembershipRepository();
  const commerceProfileRepository = new InMemoryCommerceProfileRepository();
  const authorizationPolicy = createIdentityProfileAuthorizationPolicy({
    contextResolver: createIdentityProfileContextResolver({
      identityRepository,
      commerceProfileRepository,
      accountIdentityMembershipRepository: membershipRepository,
    }),
  });
  const service = createIdentityService({
    identityRepository,
    authorizationPolicy,
    idGenerator: new SequentialIdGenerator('identity'),
    clock: new FixedClock(timestamp),
  });
  return { identityRepository, membershipRepository, service };
}

describe('Identity application service', () => {
  it('creates and reads an identity without using creatorId or accountId', async () => {
    const { service } = setup();
    const identity = await service.create();

    expect(identity.identityId).toBe('identity-1');
    expect(identity).not.toHaveProperty('creatorId');
    expect(identity).not.toHaveProperty('accountId');
    await expect(service.get(identity.identityId)).resolves.toEqual(identity);
    await expect(service.getStatus(identity.identityId)).resolves.toBe('ACTIVE');
  });

  it('maps duplicate identity persistence to an explicit application conflict', async () => {
    const identityRepository = new InMemoryIdentityRepository();
    const membershipRepository = new InMemoryAccountIdentityMembershipRepository();
    const service = createIdentityService({
      identityRepository,
      authorizationPolicy: createIdentityProfileAuthorizationPolicy({
        contextResolver: createIdentityProfileContextResolver({
          identityRepository,
          commerceProfileRepository: new InMemoryCommerceProfileRepository(),
          accountIdentityMembershipRepository: membershipRepository,
        }),
      }),
      idGenerator: { generate: () => 'identity-duplicate' },
      clock: new FixedClock(timestamp),
    });

    await service.create();
    await expect(service.create()).rejects.toMatchObject({
      category: 'conflict',
      code: 'identity_already_exists',
    });
  });

  it('requires an active OWNER membership for lifecycle mutation', async () => {
    const { membershipRepository, service } = setup();
    const identity = await service.create();

    await expect(service.suspend(account, identity.identityId)).rejects.toMatchObject({
      code: 'context_access_denied',
    });
    await membershipRepository.create(
      createAccountIdentityMembership({
        membershipId: 'membership-1',
        accountId: account.accountId,
        identityId: identity.identityId,
        authority: 'OWNER',
        createdAt: timestamp,
      }),
    );
    await expect(service.suspend(account, identity.identityId)).resolves.toMatchObject({
      lifecycle: 'SUSPENDED',
    });
    await expect(service.reactivate(account, identity.identityId)).rejects.toMatchObject({
      code: 'identity_not_operational',
    });
    await expect(service.archive(account, identity.identityId)).rejects.toMatchObject({
      code: 'identity_not_operational',
    });
  });

  it('maps missing identities to the application error boundary', async () => {
    const { service } = setup();

    await expect(service.get('missing')).rejects.toMatchObject({
      category: 'not_found',
      code: 'identity_not_found',
    });
  });
});
