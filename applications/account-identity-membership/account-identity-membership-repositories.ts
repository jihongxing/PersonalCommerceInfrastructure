import type {
  AccountIdentityMembership,
  AccountIdentityMembershipState,
} from '../../modules/account-identity-membership/account-identity-membership.js';

export class AccountIdentityMembershipAlreadyExistsError extends Error {
  public constructor(accountId: string) {
    super(`Account ${accountId} already has an active OWNER membership.`);
    this.name = 'AccountIdentityMembershipAlreadyExistsError';
  }
}

export interface AccountIdentityMembershipRepository {
  create(membership: AccountIdentityMembership): Promise<void>;
  findById(membershipId: string): Promise<AccountIdentityMembership | undefined>;
  findActiveByAccountAndIdentity(
    accountId: string,
    identityId: string,
  ): Promise<AccountIdentityMembership | undefined>;
  findActiveByAccount(accountId: string): Promise<AccountIdentityMembership | undefined>;
  listByIdentity(identityId: string): Promise<readonly AccountIdentityMembership[]>;
  listByAccount(accountId: string): Promise<readonly AccountIdentityMembership[]>;
  countActiveOwners(identityId: string): Promise<number>;
  updateState(
    membershipId: string,
    state: AccountIdentityMembershipState,
    updatedAt: string,
    revokedAt?: string,
  ): Promise<void>;
}
