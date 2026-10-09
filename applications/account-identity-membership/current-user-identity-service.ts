import type { AccountContext } from '../core/account-context.js';
import { ApplicationError } from '../core/application-error.js';
import type { IdentityRepository } from '../identity/identity-repositories.js';
import type { AccountIdentityMembershipRepository } from './account-identity-membership-repositories.js';

export interface PrivateIdentityView {
  readonly identityId: string;
  readonly status: 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED';
  readonly createdAt: string;
}

export interface CurrentUserIdentityService {
  getCurrentIdentity(accountContext: AccountContext): Promise<PrivateIdentityView>;
}

export function createCurrentUserIdentityService(dependencies: {
  readonly identityRepository: IdentityRepository;
  readonly membershipRepository: AccountIdentityMembershipRepository;
}): CurrentUserIdentityService {
  return {
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

      const identity = await dependencies.identityRepository.findById(membership.identityId);
      if (identity === undefined) {
        throw new ApplicationError({
          category: 'internal',
          code: 'active_identity_binding_target_missing',
          message: 'The active Identity binding points to a missing Identity.',
        });
      }

      return {
        identityId: identity.identityId,
        status: identity.lifecycle,
        createdAt: identity.createdAt,
      };
    },
  };
}
