import type { AccountIdentityMembershipRepository } from '../account-identity-membership/account-identity-membership-repositories.js';
import type { CommerceProfileRepository } from '../commerce-profile/commerce-profile-repositories.js';
import type { IdentityRepository } from '../identity/identity-repositories.js';
import type { AccountContext } from './account-context.js';
import { ApplicationError } from './application-error.js';

export interface IdentityApplicationContext {
  readonly accountId: string;
  readonly correlationId: string;
  readonly identityId: string;
  readonly identityLifecycle: 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED';
  readonly membershipId: string;
  readonly authorization: 'OWNER';
}

export interface ProfileApplicationContext {
  readonly identity: IdentityApplicationContext;
  readonly commerceProfileId: string;
  readonly profileLifecycle: 'DRAFT' | 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED';
}

export interface IdentityProfileContextResolver {
  resolveIdentityContext(
    accountContext: AccountContext,
    identityId: string,
  ): Promise<IdentityApplicationContext>;
  resolveProfileContext(
    accountContext: AccountContext,
    identityId: string,
    commerceProfileId: string,
  ): Promise<ProfileApplicationContext>;
}

export function createIdentityProfileContextResolver(dependencies: {
  readonly identityRepository: IdentityRepository;
  readonly commerceProfileRepository: CommerceProfileRepository;
  readonly accountIdentityMembershipRepository: AccountIdentityMembershipRepository;
}): IdentityProfileContextResolver {
  return {
    async resolveIdentityContext(accountContext, identityId) {
      return resolveIdentityContext(dependencies, accountContext, identityId);
    },

    async resolveProfileContext(accountContext, identityId, commerceProfileId) {
      return resolveProfileContext(dependencies, accountContext, identityId, commerceProfileId);
    },
  };
}

async function resolveIdentityContext(
  dependencies: {
    readonly identityRepository: IdentityRepository;
    readonly accountIdentityMembershipRepository: AccountIdentityMembershipRepository;
  },
  accountContext: AccountContext,
  identityId: string,
): Promise<IdentityApplicationContext> {
  const identity = await dependencies.identityRepository.findById(identityId);
  if (identity === undefined) {
    throw new ApplicationError({
      category: 'not_found',
      code: 'context_identity_not_found',
      message: 'Identity context cannot be resolved because the Identity was not found.',
    });
  }

  const membership =
    await dependencies.accountIdentityMembershipRepository.findActiveByAccountAndIdentity(
      accountContext.accountId,
      identity.identityId,
    );
  if (membership === undefined) {
    return throwMembershipResolutionError(
      dependencies.accountIdentityMembershipRepository,
      accountContext.accountId,
      identity.identityId,
    );
  }

  return Object.freeze({
    accountId: accountContext.accountId,
    correlationId: accountContext.correlationId,
    identityId: identity.identityId,
    identityLifecycle: identity.lifecycle,
    membershipId: membership.membershipId,
    authorization: 'OWNER',
  });
}

async function resolveProfileContext(
  dependencies: {
    readonly identityRepository: IdentityRepository;
    readonly commerceProfileRepository: CommerceProfileRepository;
    readonly accountIdentityMembershipRepository: AccountIdentityMembershipRepository;
  },
  accountContext: AccountContext,
  identityId: string,
  commerceProfileId: string,
): Promise<ProfileApplicationContext> {
  const identity = await resolveIdentityContext(dependencies, accountContext, identityId);
  const profile = await dependencies.commerceProfileRepository.findById(commerceProfileId);
  if (profile === undefined) {
    throw new ApplicationError({
      category: 'not_found',
      code: 'context_profile_not_found',
      message: 'Profile context cannot be resolved because the Commerce Profile was not found.',
    });
  }
  if (profile.identityId !== identity.identityId) {
    throw new ApplicationError({
      category: 'authorization',
      code: 'context_mismatch',
      message: 'Commerce Profile does not belong to the resolved Identity.',
    });
  }

  return Object.freeze({
    identity,
    commerceProfileId: profile.commerceProfileId,
    profileLifecycle: profile.lifecycle,
  });
}

async function throwMembershipResolutionError(
  repository: AccountIdentityMembershipRepository,
  accountId: string,
  identityId: string,
): Promise<never> {
  const membership = (await repository.listByAccount(accountId)).find(
    (candidate) => candidate.identityId === identityId,
  );
  if (membership !== undefined) {
    throw new ApplicationError({
      category: 'authorization',
      code: 'context_membership_not_active',
      message: 'An active OWNER membership is required for this Identity context.',
    });
  }
  throw new ApplicationError({
    category: 'authorization',
    code: 'context_access_denied',
    message: 'The authenticated Account is not authorized for this Identity context.',
  });
}
