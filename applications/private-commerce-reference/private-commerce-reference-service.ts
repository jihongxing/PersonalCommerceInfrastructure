import type { CurrentUserIdentityService } from '../account-identity-membership/current-user-identity-service.js';
import type { CanonicalCommerceProfileService } from '../canonical-commerce-profile/canonical-commerce-profile-service.js';
import type { AccountContext } from '../core/account-context.js';
import { ApplicationError } from '../core/application-error.js';
import { formatCommerceReferenceForDisplay } from '../../modules/identity-infrastructure/commerce-reference-contract.js';
import { CommerceProfileNotFoundError } from '../../modules/identity-infrastructure/commerce-profile-repository.js';
import type { CommerceReferenceRepository } from '../../modules/identity-infrastructure/commerce-reference-repository.js';
import {
  createCommerceProfileId,
  type CommerceReference,
} from '../../modules/identity-infrastructure/identity-contract.js';
import type { IdentityCommerceReferenceService } from '../canonical-commerce-reference/identity-commerce-reference-service.js';

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

  getMyIdentityReference(accountContext: AccountContext): Promise<PrivateCommerceReferenceView>;
}

export function createPrivateCommerceReferenceService(dependencies: {
  readonly currentUserIdentityService: CurrentUserIdentityService;
  readonly commerceProfileService: CanonicalCommerceProfileService;
  readonly commerceReferenceRepository: CommerceReferenceRepository;
  readonly identityReferenceService?: IdentityCommerceReferenceService;
}): PrivateCommerceReferenceService {
  return {
    async getMyCommerceReference(accountContext, profileId) {
      const currentIdentity =
        await dependencies.currentUserIdentityService.getCurrentIdentity(accountContext);
      let profile;
      try {
        profile = await dependencies.commerceProfileService.get(createCommerceProfileId(profileId));
      } catch (error) {
        if (error instanceof CommerceProfileNotFoundError) {
          throw privateCommerceProfileNotFound();
        }
        throw error;
      }

      if (profile === undefined || profile.owningIdentityId !== currentIdentity.identityId) {
        throw privateCommerceProfileNotFound();
      }

      const reference = dependencies.identityReferenceService
        ? await dependencies.identityReferenceService.find(currentIdentity.identityId)
        : (await dependencies.commerceReferenceRepository.getByProfileId(profile.commerceProfileId))
            ?.commerceReference;
      return toView(reference);
    },
    async getMyIdentityReference(accountContext) {
      const identity =
        await dependencies.currentUserIdentityService.getCurrentIdentity(accountContext);
      if (!dependencies.identityReferenceService)
        throw new Error('Identity reference service is not configured.');
      return toView(await dependencies.identityReferenceService.find(identity.identityId));
    },
  };
}

function toView(reference: CommerceReference | undefined): PrivateCommerceReferenceView {
  return reference === undefined
    ? { assignmentStatus: 'NOT_ASSIGNED' }
    : {
        assignmentStatus: 'ASSIGNED',
        commerceReference: reference,
        displayValue: formatCommerceReferenceForDisplay(reference),
      };
}

function privateCommerceProfileNotFound(): ApplicationError {
  return new ApplicationError({
    category: 'not_found',
    code: 'private_commerce_profile_not_found',
    message: 'Commerce Profile is not available to the current authenticated Identity.',
  });
}
