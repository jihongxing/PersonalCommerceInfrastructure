import { describe, expect, it } from 'vitest';

import { InMemoryAccountIdentityMembershipRepository } from '../../adapters/in-memory/in-memory-account-identity-membership-repository.js';
import { InMemoryIdentityRepository } from '../../adapters/in-memory/in-memory-identity-repository.js';
import { InMemoryProductEventStore } from '../../adapters/in-memory/in-memory-product-event-store.js';
import { InMemoryUnitOfWork } from '../../adapters/in-memory/in-memory-unit-of-work.js';
import { FixedClock } from '../../adapters/in-memory/fixed-clock.js';
import { SequentialIdGenerator } from '../../adapters/in-memory/sequential-id-generator.js';
import { createCurrentUserIdentityService } from '../../applications/account-identity-membership/current-user-identity-service.js';
import { createAccountIdentityMembershipService } from '../../applications/account-identity-membership/account-identity-membership-service.js';

describe('Current user Identity resolution', () => {
  it('returns the authenticated Account active binding target as a private DTO', async () => {
    const identityRepository = new InMemoryIdentityRepository();
    const membershipRepository = new InMemoryAccountIdentityMembershipRepository();
    const eventStore = new InMemoryProductEventStore();
    const membershipService = createAccountIdentityMembershipService({
      membershipRepository,
      unitOfWork: new InMemoryUnitOfWork(
        [identityRepository, membershipRepository, eventStore],
        eventStore,
        {
          formalIdentityRepository: identityRepository,
          accountIdentityMembershipRepository: membershipRepository,
        },
      ),
      identityIdGenerator: new SequentialIdGenerator('identity'),
      membershipIdGenerator: new SequentialIdGenerator('membership'),
      clock: new FixedClock('2026-08-27T00:00:00.000Z'),
    });
    const accountContext = { accountId: 'account-a', correlationId: 'correlation-a' };
    await membershipService.createIdentityForAuthenticatedAccount(accountContext);
    const service = createCurrentUserIdentityService({
      identityRepository,
      membershipRepository,
    });

    await expect(service.getCurrentIdentity(accountContext)).resolves.toEqual({
      identityId: 'identity-1',
      status: 'ACTIVE',
      createdAt: '2026-08-27T00:00:00.000Z',
    });
  });

  it('does not accept an arbitrary Identity ID because the use case has no such input', () => {
    const service = createCurrentUserIdentityService({
      identityRepository: new InMemoryIdentityRepository(),
      membershipRepository: new InMemoryAccountIdentityMembershipRepository(),
    });

    expect(service.getCurrentIdentity.length).toBe(1);
  });
});
