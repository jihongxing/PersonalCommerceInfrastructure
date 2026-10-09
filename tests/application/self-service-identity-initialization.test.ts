import { describe, expect, it } from 'vitest';

import { InMemoryAccountIdentityMembershipRepository } from '../../adapters/in-memory/in-memory-account-identity-membership-repository.js';
import { FixedClock } from '../../adapters/in-memory/fixed-clock.js';
import { InMemoryIdentityRepository } from '../../adapters/in-memory/in-memory-identity-repository.js';
import { InMemoryProductEventStore } from '../../adapters/in-memory/in-memory-product-event-store.js';
import { InMemoryUnitOfWork } from '../../adapters/in-memory/in-memory-unit-of-work.js';
import { SequentialIdGenerator } from '../../adapters/in-memory/sequential-id-generator.js';
import { createAccountIdentityMembership } from '../../modules/account-identity-membership/account-identity-membership.js';
import { createSelfServiceIdentityInitializationService } from '../../applications/account-identity-membership/self-service-identity-initialization-service.js';
import type { AccountIdentityMembershipRepository } from '../../applications/account-identity-membership/account-identity-membership-repositories.js';
import type { TransactionParticipant } from '../../adapters/in-memory/transaction-participant.js';

const accountA = {
  accountId: 'supabase:account-a',
  correlationId: 'correlation-account-a',
};

class FailingMembershipRepository extends InMemoryAccountIdentityMembershipRepository {
  public override create(): Promise<void> {
    return Promise.reject(new Error('Membership persistence failed.'));
  }
}

function setup(
  membershipRepository: AccountIdentityMembershipRepository & TransactionParticipant = new InMemoryAccountIdentityMembershipRepository(),
) {
  const identityRepository = new InMemoryIdentityRepository();
  const productEventStore = new InMemoryProductEventStore();
  const unitOfWork = new InMemoryUnitOfWork(
    [identityRepository, membershipRepository, productEventStore],
    productEventStore,
    {
      formalIdentityRepository: identityRepository,
      accountIdentityMembershipRepository: membershipRepository,
    },
  );
  const service = createSelfServiceIdentityInitializationService({
    identityRepository,
    membershipRepository,
    unitOfWork,
    identityIdGenerator: new SequentialIdGenerator('identity'),
    membershipIdGenerator: new SequentialIdGenerator('membership'),
    clock: new FixedClock('2026-08-27T00:00:00.000Z'),
  });
  return { identityRepository, membershipRepository, service };
}

describe('Self-service Identity initialization', () => {
  it('creates an independent ACTIVE Identity and ACTIVE OWNER binding', async () => {
    const { identityRepository, membershipRepository, service } = setup();

    const initialized = await service.initializeAuthenticatedIdentity(accountA);

    expect(initialized).toEqual({
      identityId: 'identity-1',
      status: 'ACTIVE',
      createdAt: '2026-08-27T00:00:00.000Z',
    });
    expect(await identityRepository.findById(initialized.identityId)).toMatchObject({
      identityId: 'identity-1',
      lifecycle: 'ACTIVE',
    });
    await expect(membershipRepository.findActiveByAccount(accountA.accountId)).resolves.toMatchObject({
      accountId: accountA.accountId,
      identityId: initialized.identityId,
      authority: 'OWNER',
      state: 'ACTIVE',
    });
    expect(accountA.accountId).not.toBe(initialized.identityId);
  });

  it('is idempotent and returns the same Identity for repeated initialization', async () => {
    const { identityRepository, membershipRepository, service } = setup();

    const results = await Promise.all([
      service.initializeAuthenticatedIdentity(accountA),
      service.initializeAuthenticatedIdentity(accountA),
      service.initializeAuthenticatedIdentity(accountA),
    ]);

    expect(new Set(results.map((result) => result.identityId))).toEqual(new Set(['identity-1']));
    expect(await identityRepository.findById('identity-2')).toBeUndefined();
    expect(await membershipRepository.listByAccount(accountA.accountId)).toHaveLength(1);
  });

  it('returns an existing active binding without creating another Identity', async () => {
    const { identityRepository, service } = setup();
    await service.initializeAuthenticatedIdentity(accountA);

    const initialized = await service.initializeAuthenticatedIdentity(accountA);

    expect(initialized.identityId).toBe('identity-1');
    expect(await identityRepository.findById('identity-2')).toBeUndefined();
  });

  it.each(['SUSPENDED', 'REVOKED', 'HISTORICAL'] as const)(
    'fails closed when the Account has a %s binding',
    async (state) => {
      const { identityRepository, membershipRepository, service } = setup();
      await membershipRepository.create(
        createAccountIdentityMembership({
          membershipId: `membership-${state.toLowerCase()}`,
          accountId: accountA.accountId,
          identityId: 'identity-existing',
          authority: 'OWNER',
          createdAt: '2026-08-27T00:00:00.000Z',
        }),
      );
      await identityRepository.create({
        identityId: 'identity-existing',
        lifecycle: 'ACTIVE',
        createdAt: '2026-08-27T00:00:00.000Z',
        updatedAt: '2026-08-27T00:00:00.000Z',
      });
      await membershipRepository.updateState(
        `membership-${state.toLowerCase()}`,
        state,
        '2026-08-27T00:00:01.000Z',
      );

      await expect(service.initializeAuthenticatedIdentity(accountA)).rejects.toMatchObject({
        category: 'authorization',
        code: 'identity_onboarding_not_available',
      });
      expect(await identityRepository.findById('identity-1')).toBeUndefined();
    },
  );

  it('rolls back the Identity when binding persistence fails', async () => {
    const membershipRepository = new FailingMembershipRepository();
    const { identityRepository, service } = setup(membershipRepository);

    await expect(service.initializeAuthenticatedIdentity(accountA)).rejects.toThrow(
      'Membership persistence failed.',
    );
    await expect(identityRepository.findById('identity-1')).resolves.toBeUndefined();
    await expect(membershipRepository.listByAccount(accountA.accountId)).resolves.toHaveLength(0);
  });

  it('does not accept a caller-selected Identity or Account', async () => {
    const { membershipRepository, service } = setup();

    const initialized = await service.initializeAuthenticatedIdentity(accountA);

    expect(initialized.identityId).not.toBe('identity-attacker');
    await expect(membershipRepository.findActiveByAccount('supabase:account-b')).resolves.toBeUndefined();
  });
});
