import type {
  AccountIdentityMembership,
  AccountIdentityMembershipState,
} from '../../modules/account-identity-membership/account-identity-membership.js';
import {
  AccountIdentityMembershipAlreadyExistsError,
  type AccountIdentityMembershipRepository,
} from '../../applications/account-identity-membership/account-identity-membership-repositories.js';
import type { TransactionParticipant } from './transaction-participant.js';

export class InMemoryAccountIdentityMembershipRepository
  implements AccountIdentityMembershipRepository, TransactionParticipant
{
  private readonly memberships = new Map<string, AccountIdentityMembership>();

  public create(membership: AccountIdentityMembership): Promise<void> {
    if (this.hasActiveOwner(membership.accountId)) {
      return Promise.reject(new AccountIdentityMembershipAlreadyExistsError(membership.accountId));
    }
    this.memberships.set(membership.membershipId, structuredClone(membership));
    return Promise.resolve();
  }

  public findById(membershipId: string): Promise<AccountIdentityMembership | undefined> {
    const membership = this.memberships.get(membershipId);
    return Promise.resolve(membership === undefined ? undefined : structuredClone(membership));
  }

  public findActiveByAccountAndIdentity(
    accountId: string,
    identityId: string,
  ): Promise<AccountIdentityMembership | undefined> {
    const membership = [...this.memberships.values()].find(
      (candidate) =>
        candidate.accountId === accountId &&
        candidate.identityId === identityId &&
        candidate.authority === 'OWNER' &&
        candidate.state === 'ACTIVE',
    );
    return Promise.resolve(membership === undefined ? undefined : structuredClone(membership));
  }

  public findActiveByAccount(accountId: string): Promise<AccountIdentityMembership | undefined> {
    const membership = [...this.memberships.values()].find(
      (candidate) =>
        candidate.accountId === accountId &&
        candidate.authority === 'OWNER' &&
        candidate.state === 'ACTIVE',
    );
    return Promise.resolve(membership === undefined ? undefined : structuredClone(membership));
  }

  public listByIdentity(identityId: string): Promise<readonly AccountIdentityMembership[]> {
    return Promise.resolve(
      [...this.memberships.values()]
        .filter((membership) => membership.identityId === identityId)
        .map((membership) => structuredClone(membership)),
    );
  }

  public listByAccount(accountId: string): Promise<readonly AccountIdentityMembership[]> {
    return Promise.resolve(
      [...this.memberships.values()]
        .filter((membership) => membership.accountId === accountId)
        .map((membership) => structuredClone(membership)),
    );
  }

  public countActiveOwners(identityId: string): Promise<number> {
    return Promise.resolve(
      [...this.memberships.values()].filter(
        (membership) =>
          membership.identityId === identityId &&
          membership.authority === 'OWNER' &&
          membership.state === 'ACTIVE',
      ).length,
    );
  }

  public updateState(
    membershipId: string,
    state: AccountIdentityMembershipState,
    updatedAt: string,
    revokedAt?: string,
  ): Promise<void> {
    const membership = this.memberships.get(membershipId);
    if (membership === undefined) {
      return Promise.reject(new Error('Membership not found.'));
    }
    this.memberships.set(membershipId, {
      ...membership,
      state,
      updatedAt,
      ...(revokedAt === undefined ? {} : { revokedAt }),
    });
    return Promise.resolve();
  }

  public createSnapshot(): unknown {
    return structuredClone(this.memberships);
  }

  public restoreSnapshot(snapshot: unknown): void {
    this.memberships.clear();
    for (const [membershipId, membership] of structuredClone(
      snapshot as Map<string, AccountIdentityMembership>,
    )) {
      this.memberships.set(membershipId, membership);
    }
  }

  private hasActiveOwner(accountId: string): boolean {
    return [...this.memberships.values()].some(
      (membership) =>
        membership.accountId === accountId &&
        membership.authority === 'OWNER' &&
        membership.state === 'ACTIVE',
    );
  }
}
