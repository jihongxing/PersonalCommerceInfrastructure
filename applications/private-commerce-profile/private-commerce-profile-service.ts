import type { CurrentUserIdentityService } from '../account-identity-membership/current-user-identity-service.js';
import type { CanonicalCommerceProfileService } from '../canonical-commerce-profile/canonical-commerce-profile-service.js';
import type { CommerceReferenceGenerator } from '../canonical-commerce-reference/commerce-reference-generator.js';
import type { AccountContext } from '../core/account-context.js';
import type { UnitOfWork } from '../core/ports/unit-of-work.js';
import { ApplicationError } from '../core/application-error.js';
import {
  CommerceProfileLifecycleConflictError,
  CommerceProfileNotFoundError,
} from '../../modules/identity-infrastructure/commerce-profile-repository.js';
import { DomainTransitionError } from '../../modules/shared/domain-error.js';
import {
  createCommerceProfile,
  createCommerceProfileId,
  createInternalIdentityId,
  type CommerceProfile,
  type CommerceProfileId,
} from '../../modules/identity-infrastructure/identity-contract.js';
import { formatCommerceReferenceForDisplay } from '../../modules/identity-infrastructure/commerce-reference-contract.js';
import { CommerceReferenceAlreadyExistsError } from '../../modules/identity-infrastructure/commerce-reference-repository.js';

export interface PrivateCommerceProfileView {
  readonly commerceProfileId: string;
  readonly displayName: string;
  readonly lifecycle: 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED';
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly commerceReference?: string;
  readonly commerceReferenceDisplayValue?: string;
}

export interface PrivateCommerceProfileService {
  listMyCommerceProfiles(accountContext: AccountContext): Promise<readonly PrivateCommerceProfileView[]>;
  createMyCommerceProfile(
    accountContext: AccountContext,
    input: { readonly displayName: string },
  ): Promise<PrivateCommerceProfileView>;
  getMyCommerceProfile(
    accountContext: AccountContext,
    profileId: string,
  ): Promise<PrivateCommerceProfileView>;
  updateMyCommerceProfile(
    accountContext: AccountContext,
    profileId: string,
    input: { readonly displayName: string },
  ): Promise<PrivateCommerceProfileView>;
  suspendMyCommerceProfile(
    accountContext: AccountContext,
    profileId: string,
  ): Promise<PrivateCommerceProfileView>;
  archiveMyCommerceProfile(
    accountContext: AccountContext,
    profileId: string,
  ): Promise<PrivateCommerceProfileView>;
  reactivateMyCommerceProfile(
    accountContext: AccountContext,
    profileId: string,
  ): Promise<PrivateCommerceProfileView>;
}

export function createPrivateCommerceProfileService(dependencies: {
  readonly currentUserIdentityService: CurrentUserIdentityService;
  readonly commerceProfileService: CanonicalCommerceProfileService;
  readonly commerceProfileIdGenerator?: { generate(): CommerceProfileId };
  readonly commerceReferenceGenerator?: CommerceReferenceGenerator;
  readonly clock?: { now(): string };
  readonly unitOfWork?: UnitOfWork;
  readonly maxReferenceGenerationAttempts?: number;
}): PrivateCommerceProfileService {
  return {
    async listMyCommerceProfiles(accountContext) {
      const identityId = await resolveCurrentIdentityId(dependencies, accountContext);
      return (await dependencies.commerceProfileService.listOwnedByIdentity(identityId)).map(toPrivateView);
    },

    async createMyCommerceProfile(accountContext, input) {
      const owningIdentityId = await resolveCurrentIdentityId(dependencies, accountContext);
      if (
        dependencies.commerceProfileIdGenerator === undefined ||
        dependencies.commerceReferenceGenerator === undefined ||
        dependencies.clock === undefined ||
        dependencies.unitOfWork === undefined
      ) {
        return toPrivateView(
          await dependencies.commerceProfileService.create({
            owningIdentityId,
            presentation: { displayName: input.displayName },
          }),
        );
      }
      const commerceProfileIdGenerator = dependencies.commerceProfileIdGenerator;
      const commerceReferenceGenerator = dependencies.commerceReferenceGenerator;
      const clock = dependencies.clock;
      const unitOfWork = dependencies.unitOfWork;
      const maxAttempts = dependencies.maxReferenceGenerationAttempts ?? 8;
      for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        try {
          return await unitOfWork.execute(async (scope) => {
            if (
              scope.commerceProfileRepository === undefined ||
              scope.commerceReferenceRepository === undefined
            ) {
              throw new Error('Atomic Commerce Profile creation is not configured.');
            }
            const createdAt = clock.now();
            const profile = createCommerceProfile({
              commerceProfileId: commerceProfileIdGenerator.generate(),
              owningIdentityId,
              presentation: { displayName: input.displayName },
              createdAt,
            });
            const commerceReference = commerceReferenceGenerator.generate();
            await scope.commerceProfileRepository.create(profile);
            await scope.commerceReferenceRepository.assign({
              commerceReference,
              commerceProfileId: profile.commerceProfileId,
              assignedAt: createdAt,
            });
            return {
              ...toPrivateView(profile),
              commerceReference,
              commerceReferenceDisplayValue: formatCommerceReferenceForDisplay(commerceReference),
            };
          });
        } catch (error) {
          if (error instanceof CommerceReferenceAlreadyExistsError && attempt + 1 < maxAttempts) {
            continue;
          }
          if (error instanceof CommerceReferenceAlreadyExistsError) {
            throw new ApplicationError({
              category: 'conflict',
              code: 'commerce_reference_generation_retryable',
              message: 'Commerce Profile creation could not be completed. Please try again.',
            });
          }
          throw error;
        }
      }
      throw new ApplicationError({
        category: 'conflict',
        code: 'commerce_reference_generation_retryable',
        message: 'Commerce Profile creation could not be completed. Please try again.',
      });
    },

    async getMyCommerceProfile(accountContext, profileId) {
      return toPrivateView(await getOwnedProfile(dependencies, accountContext, profileId));
    },

    async updateMyCommerceProfile(accountContext, profileId, input) {
      await getOwnedProfile(dependencies, accountContext, profileId);
      return toPrivateView(await runPrivateProfileMutation(async () =>
        dependencies.commerceProfileService.updatePresentation(
          createCommerceProfileId(profileId),
          { displayName: input.displayName },
        ),
      ));
    },

    async suspendMyCommerceProfile(accountContext, profileId) {
      return changeLifecycle(dependencies, accountContext, profileId, 'SUSPENDED');
    },

    async archiveMyCommerceProfile(accountContext, profileId) {
      return changeLifecycle(dependencies, accountContext, profileId, 'ARCHIVED');
    },

    async reactivateMyCommerceProfile(accountContext, profileId) {
      return changeLifecycle(dependencies, accountContext, profileId, 'ACTIVE');
    },
  };
}

async function changeLifecycle(
  dependencies: {
    readonly currentUserIdentityService: CurrentUserIdentityService;
    readonly commerceProfileService: CanonicalCommerceProfileService;
  },
  accountContext: AccountContext,
  profileId: string,
  lifecycle: 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED',
): Promise<PrivateCommerceProfileView> {
  await getOwnedProfile(dependencies, accountContext, profileId);
  return toPrivateView(await runPrivateProfileMutation(async () =>
    dependencies.commerceProfileService.changeLifecycle(createCommerceProfileId(profileId), lifecycle),
  ));
}

async function getOwnedProfile(
  dependencies: {
    readonly currentUserIdentityService: CurrentUserIdentityService;
    readonly commerceProfileService: CanonicalCommerceProfileService;
  },
  accountContext: AccountContext,
  profileId: string,
): Promise<CommerceProfile> {
  const identityId = await resolveCurrentIdentityId(dependencies, accountContext);
  try {
    const profile = await dependencies.commerceProfileService.get(createCommerceProfileId(profileId));
    if (profile.owningIdentityId !== identityId) {
      throw privateProfileNotFound();
    }
    return profile;
  } catch (error) {
    if (error instanceof ApplicationError) {
      throw error;
    }
    throw privateProfileNotFound();
  }
}

async function resolveCurrentIdentityId(
  dependencies: { readonly currentUserIdentityService: CurrentUserIdentityService },
  accountContext: AccountContext,
) {
  return createInternalIdentityId(
    (await dependencies.currentUserIdentityService.getCurrentIdentity(accountContext)).identityId,
  );
}

function toPrivateView(profile: CommerceProfile): PrivateCommerceProfileView {
  return {
    commerceProfileId: profile.commerceProfileId,
    displayName: profile.presentation.displayName,
    lifecycle: profile.lifecycle,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}

function privateProfileNotFound(): ApplicationError {
  return new ApplicationError({
    category: 'not_found',
    code: 'private_commerce_profile_not_found',
    message: 'Commerce Profile was not found.',
  });
}

async function runPrivateProfileMutation<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof CommerceProfileNotFoundError) {
      throw privateProfileNotFound();
    }
    if (error instanceof CommerceProfileLifecycleConflictError || error instanceof DomainTransitionError) {
      throw new ApplicationError({
        category: 'conflict',
        code: 'commerce_profile_lifecycle_conflict',
        message: 'Commerce Profile cannot be changed from its current lifecycle.',
      });
    }
    throw error;
  }
}
