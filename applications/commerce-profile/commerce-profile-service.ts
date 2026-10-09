import {
  createCommerceProfile,
  transitionCommerceProfile,
  updateCommerceProfilePresentation,
  type CommerceProfile,
  type CommerceProfileLifecycle,
  type CommerceProfilePresentation,
} from '../../modules/commerce-profile/commerce-profile.js';
import { DomainTransitionError } from '../../modules/shared/domain-error.js';
import type { AccountContext } from '../core/account-context.js';
import { ApplicationError } from '../core/application-error.js';
import type {
  IdentityProfileAuthorizationPolicy,
  ProfileMutationOperation,
} from '../core/identity-profile-authorization-policy.js';
import type { Clock } from '../core/ports/clock.js';
import type { IdGenerator } from '../core/ports/id-generator.js';
import {
  CommerceProfileAlreadyExistsError,
  type CommerceProfileRepository,
} from './commerce-profile-repositories.js';

export interface CommerceProfileService {
  create(
    accountContext: AccountContext,
    input: { readonly identityId: string; readonly presentation: CommerceProfilePresentation },
  ): Promise<CommerceProfile>;
  get(
    accountContext: AccountContext,
    identityId: string,
    commerceProfileId: string,
  ): Promise<CommerceProfile>;
  list(accountContext: AccountContext, identityId: string): Promise<readonly CommerceProfile[]>;
  update(
    accountContext: AccountContext,
    identityId: string,
    commerceProfileId: string,
    presentation: CommerceProfilePresentation,
  ): Promise<CommerceProfile>;
  activate(
    accountContext: AccountContext,
    identityId: string,
    commerceProfileId: string,
  ): Promise<CommerceProfile>;
  suspend(
    accountContext: AccountContext,
    identityId: string,
    commerceProfileId: string,
  ): Promise<CommerceProfile>;
  archive(
    accountContext: AccountContext,
    identityId: string,
    commerceProfileId: string,
  ): Promise<CommerceProfile>;
}

export function createCommerceProfileService(dependencies: {
  readonly commerceProfileRepository: CommerceProfileRepository;
  readonly authorizationPolicy: IdentityProfileAuthorizationPolicy;
  readonly commerceProfileIdGenerator: IdGenerator;
  readonly clock: Clock;
}): CommerceProfileService {
  return {
    async create(accountContext, input) {
      const identityContext = await dependencies.authorizationPolicy.authorizeIdentityMutation(
        accountContext,
        input.identityId,
        'CREATE_COMMERCE_PROFILE',
      );

      const now = dependencies.clock.now();
      const profile = createCommerceProfile({
        commerceProfileId: dependencies.commerceProfileIdGenerator.generate(),
        identityId: identityContext.identityId,
        presentation: input.presentation,
        createdAt: now,
      });

      try {
        await dependencies.commerceProfileRepository.create(profile);
      } catch (error) {
        throw mapPersistenceError(error);
      }
      return profile;
    },

    async get(accountContext, identityId, commerceProfileId) {
      await dependencies.authorizationPolicy.authorizeProfileRead(
        accountContext,
        identityId,
        commerceProfileId,
      );
      return findProfile(dependencies.commerceProfileRepository, commerceProfileId);
    },

    async list(accountContext, identityId) {
      await dependencies.authorizationPolicy.authorizeIdentityRead(accountContext, identityId);
      return dependencies.commerceProfileRepository.listByIdentityId(identityId);
    },

    async update(accountContext, identityId, commerceProfileId, presentation) {
      await dependencies.authorizationPolicy.authorizeProfileMutation(
        accountContext,
        identityId,
        commerceProfileId,
        'UPDATE_PRESENTATION',
      );
      const profile = await findProfile(dependencies.commerceProfileRepository, commerceProfileId);
      let updated: CommerceProfile;
      try {
        updated = updateCommerceProfilePresentation(
          profile,
          presentation,
          dependencies.clock.now(),
        );
      } catch (error) {
        throw profileTransitionError(profile, 'update', error);
      }
      await updatePresentation(dependencies.commerceProfileRepository, updated);
      return updated;
    },

    activate(accountContext, identityId, commerceProfileId) {
      return changeLifecycle(
        dependencies,
        accountContext,
        identityId,
        commerceProfileId,
        'ACTIVE',
        'ACTIVATE_PROFILE',
      );
    },

    suspend(accountContext, identityId, commerceProfileId) {
      return changeLifecycle(
        dependencies,
        accountContext,
        identityId,
        commerceProfileId,
        'SUSPENDED',
        'SUSPEND_PROFILE',
      );
    },

    archive(accountContext, identityId, commerceProfileId) {
      return changeLifecycle(
        dependencies,
        accountContext,
        identityId,
        commerceProfileId,
        'ARCHIVED',
        'ARCHIVE_PROFILE',
      );
    },
  };
}

async function changeLifecycle(
  dependencies: {
    readonly commerceProfileRepository: CommerceProfileRepository;
    readonly authorizationPolicy: IdentityProfileAuthorizationPolicy;
    readonly clock: Clock;
  },
  accountContext: AccountContext,
  identityId: string,
  commerceProfileId: string,
  lifecycle: CommerceProfileLifecycle,
  operation: ProfileMutationOperation,
): Promise<CommerceProfile> {
  await dependencies.authorizationPolicy.authorizeProfileMutation(
    accountContext,
    identityId,
    commerceProfileId,
    operation,
  );
  const profile = await findProfile(dependencies.commerceProfileRepository, commerceProfileId);
  let updated: CommerceProfile;
  try {
    updated = transitionCommerceProfile(profile, lifecycle, dependencies.clock.now());
  } catch (error) {
    throw profileTransitionError(profile, lifecycle, error);
  }

  try {
    await dependencies.commerceProfileRepository.updateLifecycle(
      updated.commerceProfileId,
      updated.lifecycle,
      updated.updatedAt,
    );
  } catch (error) {
    throw new ApplicationError({
      category: 'conflict',
      code: 'commerce_profile_persistence_conflict',
      message:
        'Commerce Profile lifecycle could not be persisted because of a persistence conflict.',
      cause: error,
    });
  }
  return updated;
}

async function findProfile(
  repository: CommerceProfileRepository,
  commerceProfileId: string,
): Promise<CommerceProfile> {
  const profile = await repository.findById(commerceProfileId);
  if (profile === undefined) {
    throw new ApplicationError({
      category: 'not_found',
      code: 'commerce_profile_not_found',
      message: 'Commerce Profile not found.',
    });
  }
  return profile;
}

async function updatePresentation(
  repository: CommerceProfileRepository,
  profile: CommerceProfile,
): Promise<void> {
  try {
    await repository.updatePresentation(
      profile.commerceProfileId,
      profile.presentation,
      profile.updatedAt,
    );
  } catch (error) {
    throw new ApplicationError({
      category: 'conflict',
      code: 'commerce_profile_persistence_conflict',
      message:
        'Commerce Profile presentation could not be persisted because of a persistence conflict.',
      cause: error,
    });
  }
}

function profileTransitionError(
  profile: CommerceProfile,
  operation: string,
  error: unknown,
): ApplicationError {
  if (!(error instanceof DomainTransitionError)) {
    return new ApplicationError({
      category: 'validation',
      code: 'commerce_profile_validation_failed',
      message: 'Commerce Profile data is invalid.',
      cause: error,
    });
  }
  if (profile.lifecycle === 'ARCHIVED') {
    return new ApplicationError({
      category: 'conflict',
      code: 'commerce_profile_already_archived',
      message: 'Archived Commerce Profile cannot be changed.',
      cause: error,
    });
  }
  return new ApplicationError({
    category: 'conflict',
    code: 'invalid_commerce_profile_state_transition',
    message: `Commerce Profile cannot transition from ${profile.lifecycle} to ${operation}.`,
    cause: error,
  });
}

function mapPersistenceError(error: unknown): ApplicationError {
  if (error instanceof CommerceProfileAlreadyExistsError) {
    return new ApplicationError({
      category: 'conflict',
      code: 'commerce_profile_already_exists',
      message: 'Commerce Profile already exists.',
      cause: error,
    });
  }
  return new ApplicationError({
    category: 'conflict',
    code: 'commerce_profile_persistence_conflict',
    message: 'Commerce Profile could not be persisted because of a persistence conflict.',
    cause: error,
  });
}
