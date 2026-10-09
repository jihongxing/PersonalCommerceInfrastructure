import {
  createAccountIdentityMembership,
  transitionAccountIdentityMembership,
  type AccountIdentityMembership,
  type AccountIdentityMembershipState,
} from '../../modules/account-identity-membership/account-identity-membership.js';
import { createIdentity, type Identity } from '../../modules/identity/identity.js';
import { DomainTransitionError } from '../../modules/shared/domain-error.js';
import type { AccountContext } from '../core/account-context.js';
import { ApplicationError } from '../core/application-error.js';
import type { Clock } from '../core/ports/clock.js';
import type { IdGenerator } from '../core/ports/id-generator.js';
import type { UnitOfWork } from '../core/ports/unit-of-work.js';
import {
  AccountIdentityMembershipAlreadyExistsError,
  type AccountIdentityMembershipRepository,
} from './account-identity-membership-repositories.js';

export interface AccountIdentityMembershipService {
  createIdentityForAuthenticatedAccount(accountContext: AccountContext): Promise<{
    readonly identity: Identity;
    readonly membership: AccountIdentityMembership;
  }>;
  getMembership(membershipId: string): Promise<AccountIdentityMembership>;
  listIdentityMemberships(identityId: string): Promise<readonly AccountIdentityMembership[]>;
  listAccountMemberships(accountId: string): Promise<readonly AccountIdentityMembership[]>;
  suspendMembership(
    accountContext: AccountContext,
    membershipId: string,
  ): Promise<AccountIdentityMembership>;
  revokeMembership(
    accountContext: AccountContext,
    membershipId: string,
  ): Promise<AccountIdentityMembership>;
  reactivateMembership(
    accountContext: AccountContext,
    membershipId: string,
  ): Promise<AccountIdentityMembership>;
  isIdentityOwner(accountId: string, identityId: string): Promise<boolean>;
  getCurrentIdentity(accountContext: AccountContext): Promise<{
    readonly identity: Identity;
    readonly membership: AccountIdentityMembership;
  }>;
}

export function createAccountIdentityMembershipService(dependencies: {
  readonly membershipRepository: AccountIdentityMembershipRepository;
  readonly unitOfWork: UnitOfWork;
  readonly identityIdGenerator: IdGenerator;
  readonly membershipIdGenerator: IdGenerator;
  readonly clock: Clock;
}): AccountIdentityMembershipService {
  const createIdentityWithOwner = async (accountContext: AccountContext) => {
    return dependencies.unitOfWork.execute(async (scope) => {
      const identityRepository = scope.formalIdentityRepository;
      const membershipRepository = scope.accountIdentityMembershipRepository;

      if (identityRepository === undefined || membershipRepository === undefined) {
        throw new ApplicationError({
          category: 'internal',
          code: 'identity_membership_transaction_not_configured',
          message: 'Identity membership transaction support is not configured.',
        });
      }

      const existingMembership = await membershipRepository.findActiveByAccount(
        accountContext.accountId,
      );
      if (existingMembership !== undefined) {
        const existingIdentity = await identityRepository.findById(existingMembership.identityId);
        if (existingIdentity === undefined) {
          throw new ApplicationError({
            category: 'internal',
            code: 'active_membership_identity_missing',
            message: 'The active Account Identity Membership points to a missing Identity.',
          });
        }
        return { identity: existingIdentity, membership: existingMembership };
      }

      const now = dependencies.clock.now();
      const identity = createIdentity(dependencies.identityIdGenerator.generate(), now);
      const membership = createAccountIdentityMembership({
        membershipId: dependencies.membershipIdGenerator.generate(),
        accountId: accountContext.accountId,
        identityId: identity.identityId,
        authority: 'OWNER',
        createdAt: now,
      });

      try {
        await identityRepository.create(identity);
        await membershipRepository.create(membership);
      } catch (error) {
        throw mapPersistenceError(error);
      }

      return { identity, membership };
    });
  };

  return {
    createIdentityForAuthenticatedAccount(accountContext) {
      return createIdentityWithOwner(accountContext);
    },

    getMembership(membershipId) {
      return findMembership(dependencies.membershipRepository, membershipId);
    },

    listIdentityMemberships(identityId) {
      return dependencies.membershipRepository.listByIdentity(identityId);
    },

    listAccountMemberships(accountId) {
      return dependencies.membershipRepository.listByAccount(accountId);
    },

    suspendMembership(accountContext, membershipId) {
      return changeMembershipState(dependencies, accountContext, membershipId, 'SUSPENDED');
    },

    revokeMembership(accountContext, membershipId) {
      return changeMembershipState(dependencies, accountContext, membershipId, 'REVOKED');
    },

    reactivateMembership(accountContext, membershipId) {
      return changeMembershipState(dependencies, accountContext, membershipId, 'ACTIVE');
    },

    async isIdentityOwner(accountId, identityId) {
      if (accountId.trim().length === 0 || identityId.trim().length === 0) {
        return false;
      }

      const membership = await dependencies.membershipRepository.findActiveByAccountAndIdentity(
        accountId,
        identityId,
      );
      return membership?.authority === 'OWNER' && membership.state === 'ACTIVE';
    },

    async getCurrentIdentity(accountContext) {
      const membership = await dependencies.membershipRepository.findActiveByAccount(
        accountContext.accountId,
      );
      if (membership === undefined) {
        throw new ApplicationError({
          category: 'authorization',
          code: 'active_identity_binding_not_found',
          message: 'The authenticated Account has no active Identity binding.',
        });
      }
      const identity = await dependencies.unitOfWork.execute(async (scope) => {
        if (scope.formalIdentityRepository === undefined) {
          throw new ApplicationError({
            category: 'internal',
            code: 'identity_repository_not_configured',
            message: 'Identity repository is not configured.',
          });
        }
        return scope.formalIdentityRepository.findById(membership.identityId);
      });
      if (identity === undefined) {
        throw new ApplicationError({
          category: 'internal',
          code: 'active_identity_binding_target_missing',
          message: 'The active Identity binding points to a missing Identity.',
        });
      }
      return { identity, membership };
    },
  };
}

async function changeMembershipState(
  dependencies: {
    readonly membershipRepository: AccountIdentityMembershipRepository;
    readonly clock: Clock;
  },
  accountContext: AccountContext,
  membershipId: string,
  state: AccountIdentityMembershipState,
): Promise<AccountIdentityMembership> {
  const membership = await findMembership(dependencies.membershipRepository, membershipId);
  const authorizedMembership =
    await dependencies.membershipRepository.findActiveByAccountAndIdentity(
      accountContext.accountId,
      membership.identityId,
    );
  if (authorizedMembership?.authority !== 'OWNER') {
    throw new ApplicationError({
      category: 'authorization',
      code: 'membership_not_owner',
      message: 'An active OWNER membership is required.',
    });
  }

  let updated: AccountIdentityMembership;

  try {
    updated = transitionAccountIdentityMembership(membership, state, dependencies.clock.now());
  } catch (error) {
    if (error instanceof DomainTransitionError) {
      throw new ApplicationError({
        category: 'conflict',
        code:
          membership.state === 'REVOKED'
            ? 'membership_revoked'
            : 'invalid_membership_state_transition',
        message:
          membership.state === 'REVOKED'
            ? 'Revoked memberships are terminal.'
            : 'Membership state transition is not allowed.',
        cause: error,
      });
    }
    throw error;
  }

  if (membership.state === 'ACTIVE' && state !== 'ACTIVE') {
    const activeOwnerCount = await dependencies.membershipRepository.countActiveOwners(
      membership.identityId,
    );
    if (activeOwnerCount <= 1) {
      throw new ApplicationError({
        category: 'conflict',
        code:
          state === 'REVOKED' ? 'last_owner_cannot_be_revoked' : 'last_owner_cannot_be_suspended',
        message:
          state === 'REVOKED'
            ? 'The last active OWNER membership cannot be revoked.'
            : 'The last active OWNER membership cannot be suspended.',
      });
    }
  }

  try {
    await dependencies.membershipRepository.updateState(
      updated.membershipId,
      updated.state,
      updated.updatedAt,
      updated.revokedAt,
    );
  } catch (error) {
    throw mapPersistenceError(error);
  }

  return updated;
}

async function findMembership(
  repository: AccountIdentityMembershipRepository,
  membershipId: string,
): Promise<AccountIdentityMembership> {
  const membership = await repository.findById(membershipId);
  if (membership === undefined) {
    throw new ApplicationError({
      category: 'not_found',
      code: 'membership_not_found',
      message: 'Account Identity Membership was not found.',
    });
  }
  return membership;
}

function mapPersistenceError(error: unknown): ApplicationError {
  if (error instanceof AccountIdentityMembershipAlreadyExistsError) {
    return new ApplicationError({
      category: 'conflict',
      code: 'membership_already_exists',
      message: 'Account already has an active OWNER membership.',
      cause: error,
    });
  }

  return new ApplicationError({
    category: 'conflict',
    code: 'membership_persistence_conflict',
    message:
      'Account Identity Membership could not be persisted because of a persistence conflict.',
    cause: error,
  });
}
