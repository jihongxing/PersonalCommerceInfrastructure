import { describe, expect, it } from 'vitest';

import { InMemoryAccountIdentityMembershipRepository } from '../../adapters/in-memory/in-memory-account-identity-membership-repository.js';
import { FixedClock } from '../../adapters/in-memory/fixed-clock.js';
import { InMemoryIdentityRepository } from '../../adapters/in-memory/in-memory-identity-repository.js';
import { InMemoryProductEventStore } from '../../adapters/in-memory/in-memory-product-event-store.js';
import { InMemoryUnitOfWork } from '../../adapters/in-memory/in-memory-unit-of-work.js';
import { SequentialIdGenerator } from '../../adapters/in-memory/sequential-id-generator.js';
import { createAccountIdentityMembershipService } from '../../applications/account-identity-membership/account-identity-membership-service.js';

const accountA = {
  accountId: 'supabase:account-a',
  correlationId: 'correlation-account-a',
};
const accountB = {
  accountId: 'supabase:account-b',
  correlationId: 'correlation-account-b',
};

class FailingMembershipRepository extends InMemoryAccountIdentityMembershipRepository {
  public override create(): Promise<void> {
    return Promise.reject(new Error('Membership persistence failed.'));
  }
}

function setup() {
  const identityRepository = new InMemoryIdentityRepository();
  const membershipRepository = new InMemoryAccountIdentityMembershipRepository();
  const productEventStore = new InMemoryProductEventStore();
  const unitOfWork = new InMemoryUnitOfWork(
    [identityRepository, membershipRepository, productEventStore],
    productEventStore,
    {
      formalIdentityRepository: identityRepository,
      accountIdentityMembershipRepository: membershipRepository,
    },
  );
  const service = createAccountIdentityMembershipService({
    membershipRepository,
    unitOfWork,
    identityIdGenerator: new SequentialIdGenerator('identity'),
    membershipIdGenerator: new SequentialIdGenerator('membership'),
    clock: new FixedClock('2026-08-26T00:00:00.000Z'),
  });
  return { identityRepository, membershipRepository, service };
}

describe('Account Identity Membership application service', () => {
  it('creates an independent identity and its initial OWNER membership atomically', async () => {
    const { service } = setup();

    const created = await service.createIdentityForAuthenticatedAccount(accountA);

    expect(created.identity).toMatchObject({
      identityId: 'identity-1',
      lifecycle: 'ACTIVE',
    });
    expect(created.identity).not.toHaveProperty('accountId');
    expect(created.membership).toMatchObject({
      membershipId: 'membership-1',
      accountId: 'supabase:account-a',
      identityId: 'identity-1',
      authority: 'OWNER',
      state: 'ACTIVE',
    });
    await expect(service.isIdentityOwner('supabase:account-a', 'identity-1')).resolves.toBe(true);
  });

  it('fails closed when the Account does not have an active membership', async () => {
    const { service } = setup();
    const created = await service.createIdentityForAuthenticatedAccount(accountA);

    await expect(
      service.isIdentityOwner('supabase:account-b', created.identity.identityId),
    ).resolves.toBe(false);
  });

  it('creates only from an explicit authenticated Account context', async () => {
    const { service } = setup();

    const created = await service.createIdentityForAuthenticatedAccount({
      accountId: 'supabase:account-a',
      correlationId: 'correlation-1',
    });

    expect(created.membership.accountId).toBe('supabase:account-a');
  });

  it('returns the existing Identity when onboarding is retried for the same Account', async () => {
    const { service } = setup();

    const first = await service.createIdentityForAuthenticatedAccount(accountA);
    const second = await service.createIdentityForAuthenticatedAccount(accountA);

    expect(second.identity.identityId).toBe(first.identity.identityId);
    expect(second.membership.membershipId).toBe(first.membership.membershipId);
  });

  it('creates one active binding and one Identity when onboarding requests race', async () => {
    const { membershipRepository, service } = setup();

    const [first, second] = await Promise.all([
      service.createIdentityForAuthenticatedAccount(accountA),
      service.createIdentityForAuthenticatedAccount(accountA),
    ]);

    expect(first.identity.identityId).toBe(second.identity.identityId);
    expect(first.membership.membershipId).toBe(second.membership.membershipId);
    expect(await membershipRepository.listByAccount(accountA.accountId)).toHaveLength(1);
    await expect(membershipRepository.findActiveByAccount(accountA.accountId)).resolves.toMatchObject(
      {
        identityId: first.identity.identityId,
        state: 'ACTIVE',
      },
    );
  });

  it('allows multiple Accounts to bind to the same Identity', async () => {
    const { identityRepository, membershipRepository, service } = setup();
    const first = await service.createIdentityForAuthenticatedAccount(accountA);
    const secondMembership = {
      ...first.membership,
      membershipId: 'membership-2',
      accountId: 'supabase:account-b',
    };

    await membershipRepository.create(secondMembership);

    expect(await membershipRepository.listByIdentity(first.identity.identityId)).toHaveLength(2);
    expect(
      await membershipRepository.findActiveByAccount('supabase:account-b'),
    ).toMatchObject({ identityId: first.identity.identityId });
    expect(await identityRepository.findById(first.identity.identityId)).toBeDefined();
  });

  it('resolves only the Identity from the authenticated Account active binding', async () => {
    const { service } = setup();
    const created = await service.createIdentityForAuthenticatedAccount(accountA);

    await expect(service.getCurrentIdentity(accountA)).resolves.toMatchObject({
      identity: { identityId: created.identity.identityId },
      membership: { accountId: accountA.accountId },
    });
  });

  it('fails closed when the authenticated Account has no active binding', async () => {
    const { service } = setup();

    await expect(service.getCurrentIdentity(accountB)).rejects.toMatchObject({
      category: 'authorization',
      code: 'active_identity_binding_not_found',
    });
  });

  it('rolls back Identity creation when initial OWNER membership persistence fails', async () => {
    const identityRepository = new InMemoryIdentityRepository();
    const membershipRepository = new FailingMembershipRepository();
    const productEventStore = new InMemoryProductEventStore();
    const service = createAccountIdentityMembershipService({
      membershipRepository,
      unitOfWork: new InMemoryUnitOfWork(
        [identityRepository, membershipRepository, productEventStore],
        productEventStore,
        {
          formalIdentityRepository: identityRepository,
          accountIdentityMembershipRepository: membershipRepository,
        },
      ),
      identityIdGenerator: new SequentialIdGenerator('identity'),
      membershipIdGenerator: new SequentialIdGenerator('membership'),
      clock: new FixedClock('2026-08-26T00:00:00.000Z'),
    });

    await expect(service.createIdentityForAuthenticatedAccount(accountA)).rejects.toMatchObject({
      category: 'conflict',
      code: 'membership_persistence_conflict',
    });
    await expect(identityRepository.findById('identity-1')).resolves.toBeUndefined();
  });

  it('prevents suspension or revocation of the last active OWNER', async () => {
    const { service } = setup();
    const created = await service.createIdentityForAuthenticatedAccount(accountA);

    await expect(
      service.suspendMembership(accountA, created.membership.membershipId),
    ).rejects.toMatchObject({
      category: 'conflict',
      code: 'last_owner_cannot_be_suspended',
    });
    await expect(
      service.revokeMembership(accountA, created.membership.membershipId),
    ).rejects.toMatchObject({
      category: 'conflict',
      code: 'last_owner_cannot_be_revoked',
    });
  });

  it('does not use creatorId or Actor kind when evaluating ownership', async () => {
    const { service } = setup();
    const created = await service.createIdentityForAuthenticatedAccount(accountA);

    await expect(
      service.isIdentityOwner('creator-legacy-id', created.identity.identityId),
    ).resolves.toBe(false);
  });

  it('denies membership mutations from an Account that is not an active OWNER', async () => {
    const { service } = setup();
    const created = await service.createIdentityForAuthenticatedAccount(accountA);

    await expect(
      service.suspendMembership(
        {
          accountId: 'supabase:account-b',
          correlationId: 'correlation-account-b',
        },
        created.membership.membershipId,
      ),
    ).rejects.toMatchObject({
      category: 'authorization',
      code: 'membership_not_owner',
    });
  });
});
