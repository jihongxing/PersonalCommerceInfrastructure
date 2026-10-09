import {
  createAccountIdentityMembership,
  type AccountIdentityMembership,
} from '../../modules/account-identity-membership/account-identity-membership.js';
import { createIdentity, type Identity } from '../../modules/identity/identity.js';
import type { AccountContext } from '../core/account-context.js';
import { ApplicationError } from '../core/application-error.js';
import type { Clock } from '../core/ports/clock.js';
import type { IdGenerator } from '../core/ports/id-generator.js';
import type { UnitOfWork } from '../core/ports/unit-of-work.js';
import type { IdentityRepository } from '../identity/identity-repositories.js';
import {
  AccountIdentityMembershipAlreadyExistsError,
  type AccountIdentityMembershipRepository,
} from './account-identity-membership-repositories.js';

export interface InitializedPrivateIdentity {
  readonly identityId: string;
  readonly status: 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED';
  readonly createdAt: string;
}

export interface SelfServiceIdentityInitializationService {
  initializeAuthenticatedIdentity(
    accountContext: AccountContext,
  ): Promise<InitializedPrivateIdentity>;
}

export function createSelfServiceIdentityInitializationService(dependencies: {
  readonly identityRepository: IdentityRepository;
  readonly membershipRepository: AccountIdentityMembershipRepository;
  readonly unitOfWork: UnitOfWork;
  readonly identityIdGenerator: IdGenerator;
  readonly membershipIdGenerator: IdGenerator;
  readonly clock: Clock;
}): SelfServiceIdentityInitializationService {
  return {
    async initializeAuthenticatedIdentity(accountContext) {
      try {
        return await dependencies.unitOfWork.execute(async (scope) => {
          const identityRepository = scope.formalIdentityRepository;
          const membershipRepository = scope.accountIdentityMembershipRepository;

          if (identityRepository === undefined || membershipRepository === undefined) {
            throw new ApplicationError({
              category: 'internal',
              code: 'identity_onboarding_transaction_not_configured',
              message: 'Identity onboarding transaction support is not configured.',
            });
          }

          const existingMembership = await membershipRepository.findActiveByAccount(
            accountContext.accountId,
          );
          if (existingMembership !== undefined) {
            return toInitializedIdentity(
              await resolveBindingIdentity(identityRepository, existingMembership),
            );
          }

          const historicalMemberships = await membershipRepository.listByAccount(
            accountContext.accountId,
          );
          if (historicalMemberships.length > 0) {
            throw new ApplicationError({
              category: 'authorization',
              code: 'identity_onboarding_not_available',
              message: 'Identity onboarding is not available for this Account.',
            });
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

          await identityRepository.create(identity);
          await membershipRepository.create(membership);

          return toInitializedIdentity(identity);
        });
      } catch (error) {
        const isMembershipConflict = error instanceof AccountIdentityMembershipAlreadyExistsError;
        const isConcurrentObservation = isConcurrentActiveBindingObservation(error);
        if (!isMembershipConflict && !isConcurrentObservation) {
          throw error;
        }

        const membership = await dependencies.membershipRepository.findActiveByAccount(
          accountContext.accountId,
        );
        if (membership !== undefined) {
          return toInitializedIdentity(
            await resolveBindingIdentity(dependencies.identityRepository, membership),
          );
        }

        if (isConcurrentObservation) {
          const historicalMemberships = await dependencies.membershipRepository.listByAccount(
            accountContext.accountId,
          );
          if (historicalMemberships.length > 0) {
            throw error;
          }
        }

        if (membership === undefined) {
          throw new ApplicationError({
            category: 'conflict',
            code: 'identity_onboarding_conflict',
            message: 'Identity onboarding could not be completed. Please try again.',
          });
        }

        throw new ApplicationError({
          category: 'internal',
          code: 'identity_onboarding_unreachable',
          message: 'Identity onboarding reached an unreachable state.',
        });
      }
    },
  };
}

function isConcurrentActiveBindingObservation(error: unknown): boolean {
  return (
    error instanceof ApplicationError &&
    error.category === 'authorization' &&
    error.code === 'identity_onboarding_not_available'
  );
}

async function resolveBindingIdentity(
  identityRepository: IdentityRepository,
  membership: AccountIdentityMembership,
): Promise<Identity> {
  const identity = await identityRepository.findById(membership.identityId);
  if (identity === undefined) {
    throw new ApplicationError({
      category: 'internal',
      code: 'active_identity_binding_target_missing',
      message: 'The active Identity binding points to a missing Identity.',
    });
  }
  return identity;
}

function toInitializedIdentity(identity: Identity): InitializedPrivateIdentity {
  return {
    identityId: identity.identityId,
    status: identity.lifecycle,
    createdAt: identity.createdAt,
  };
}
