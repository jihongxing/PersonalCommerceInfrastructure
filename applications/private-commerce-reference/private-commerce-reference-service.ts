import type { CurrentUserIdentityService } from '../account-identity-membership/current-user-identity-service.js';
import type { CanonicalCommerceProfileService } from '../canonical-commerce-profile/canonical-commerce-profile-service.js';
import type { AccountContext } from '../core/account-context.js';
import { ApplicationError } from '../core/application-error.js';
import {
  formatCommerceReferenceForDisplay,
  createCommerceReference,
} from '../../modules/identity-infrastructure/commerce-reference-contract.js';
import { CommerceProfileNotFoundError } from '../../modules/identity-infrastructure/commerce-profile-repository.js';
import type { CommerceReferenceRepository } from '../../modules/identity-infrastructure/commerce-reference-repository.js';
import { CommerceReferenceAlreadyExistsError } from '../../modules/identity-infrastructure/commerce-reference-repository.js';
import { createCommerceProfileId } from '../../modules/identity-infrastructure/identity-contract.js';
import { generateCommerceReference } from '../../modules/commerce-reference/commerce-reference-generator.js';

export type PrivateCommerceReferenceView =
  | {
      readonly assignmentStatus: 'ASSIGNED';
      readonly commerceReference: string;
      readonly displayValue: string;
    }
  | {
      readonly assignmentStatus: 'NOT_ASSIGNED';
    };

export interface PrivateCommerceReferenceService {
  getMyCommerceReference(
    accountContext: AccountContext,
    profileId: string,
  ): Promise<PrivateCommerceReferenceView>;

  assignCommerceReferenceWithRetry(
    commerceProfileId: string,
    maxRetries?: number,
  ): Promise<string>;
}

export function createPrivateCommerceReferenceService(dependencies: {
  readonly currentUserIdentityService: CurrentUserIdentityService;
  readonly commerceProfileService: CanonicalCommerceProfileService;
  readonly commerceReferenceRepository: CommerceReferenceRepository;
}): PrivateCommerceReferenceService {
  return {
    async getMyCommerceReference(accountContext, profileId) {
      const currentIdentity = await dependencies.currentUserIdentityService.getCurrentIdentity(
        accountContext,
      );
      let profile;
      try {
        profile = await dependencies.commerceProfileService.get(createCommerceProfileId(profileId));
      } catch (error) {
        if (error instanceof CommerceProfileNotFoundError) {
          throw privateCommerceProfileNotFound();
        }
        throw error;
      }

      if (
        profile === undefined ||
        profile.owningIdentityId !== currentIdentity.identityId
      ) {
        throw privateCommerceProfileNotFound();
      }

      const assigned = await dependencies.commerceReferenceRepository.getByProfileId(
        profile.commerceProfileId,
      );
      if (assigned === undefined) {
        return { assignmentStatus: 'NOT_ASSIGNED' };
      }

      return {
        assignmentStatus: 'ASSIGNED',
        commerceReference: assigned.commerceReference,
        displayValue: formatCommerceReferenceForDisplay(assigned.commerceReference),
      };
    },

    async assignCommerceReferenceWithRetry(
      commerceProfileId: string,
      maxRetries: number = 3,
    ): Promise<string> {
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        const ref = generateCommerceReference();

        try {
          await dependencies.commerceReferenceRepository.assign({
            commerceReference: createCommerceReference(ref),
            commerceProfileId: createCommerceProfileId(commerceProfileId),
            assignedAt: new Date().toISOString(),
          });

          return ref;
        } catch (error) {
          if (error instanceof CommerceReferenceAlreadyExistsError && attempt < maxRetries) {
            // 碰撞，重试
            continue;
          }

          throw error;
        }
      }

      throw new ApplicationError({
        category: 'conflict',
        code: 'commerce_reference_assignment_failed',
        message: `Failed to assign Commerce Reference after ${maxRetries} retries`,
      });
    },
  };
}

function privateCommerceProfileNotFound(): ApplicationError {
  return new ApplicationError({
    category: 'not_found',
    code: 'private_commerce_profile_not_found',
    message: 'Commerce Profile is not available to the current authenticated Identity.',
  });
}
