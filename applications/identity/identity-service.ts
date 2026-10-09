import {
  createIdentity,
  transitionIdentity,
  type Identity,
  type IdentityLifecycle,
} from '../../modules/identity/identity.js';
import { DomainTransitionError } from '../../modules/shared/domain-error.js';
import { ApplicationError } from '../core/application-error.js';
import type {
  IdentityMutationOperation,
  IdentityProfileAuthorizationPolicy,
} from '../core/identity-profile-authorization-policy.js';
import type { AccountContext } from '../core/account-context.js';
import type { Clock } from '../core/ports/clock.js';
import type { IdGenerator } from '../core/ports/id-generator.js';
import { IdentityAlreadyExistsError, type IdentityRepository } from './identity-repositories.js';

export interface IdentityService {
  create(): Promise<Identity>;
  get(identityId: string): Promise<Identity>;
  getStatus(identityId: string): Promise<IdentityLifecycle>;
  suspend(accountContext: AccountContext, identityId: string): Promise<Identity>;
  archive(accountContext: AccountContext, identityId: string): Promise<Identity>;
  reactivate(accountContext: AccountContext, identityId: string): Promise<Identity>;
}

export function createIdentityService(dependencies: {
  readonly identityRepository: IdentityRepository;
  readonly authorizationPolicy: IdentityProfileAuthorizationPolicy;
  readonly idGenerator: IdGenerator;
  readonly clock: Clock;
}): IdentityService {
  return {
    async create() {
      const identity = createIdentity(
        dependencies.idGenerator.generate(),
        dependencies.clock.now(),
      );

      try {
        await dependencies.identityRepository.create(identity);
      } catch (error) {
        if (error instanceof IdentityAlreadyExistsError) {
          throw new ApplicationError({
            category: 'conflict',
            code: 'identity_already_exists',
            message: 'Identity already exists.',
            cause: error,
          });
        }

        throw new ApplicationError({
          category: 'conflict',
          code: 'identity_persistence_conflict',
          message: 'Identity could not be persisted because of a persistence conflict.',
          cause: error,
        });
      }

      return identity;
    },

    get(identityId) {
      return findIdentity(dependencies.identityRepository, identityId);
    },

    async getStatus(identityId) {
      const identity = await findIdentity(dependencies.identityRepository, identityId);
      return identity.lifecycle;
    },

    suspend(accountContext, identityId) {
      return changeLifecycle(
        dependencies,
        accountContext,
        identityId,
        'SUSPENDED',
        'SUSPEND_IDENTITY',
      );
    },

    archive(accountContext, identityId) {
      return changeLifecycle(
        dependencies,
        accountContext,
        identityId,
        'ARCHIVED',
        'ARCHIVE_IDENTITY',
      );
    },

    reactivate(accountContext, identityId) {
      return changeLifecycle(
        dependencies,
        accountContext,
        identityId,
        'ACTIVE',
        'REACTIVATE_IDENTITY',
      );
    },
  };
}

async function changeLifecycle(
  dependencies: {
    readonly identityRepository: IdentityRepository;
    readonly authorizationPolicy: IdentityProfileAuthorizationPolicy;
    readonly clock: Clock;
  },
  accountContext: AccountContext,
  identityId: string,
  lifecycle: IdentityLifecycle,
  operation: IdentityMutationOperation,
): Promise<Identity> {
  await dependencies.authorizationPolicy.authorizeIdentityMutation(
    accountContext,
    identityId,
    operation,
  );
  const identity = await findIdentity(dependencies.identityRepository, identityId);
  let updated: Identity;
  try {
    updated = transitionIdentity(identity, lifecycle, dependencies.clock.now());
  } catch (error) {
    throw identityTransitionError(identity, lifecycle, error);
  }

  try {
    await dependencies.identityRepository.updateLifecycle(identityId, lifecycle, updated.updatedAt);
  } catch (error) {
    throw new ApplicationError({
      category: 'conflict',
      code: 'identity_persistence_conflict',
      message: 'Identity lifecycle could not be persisted because of a persistence conflict.',
      cause: error,
    });
  }

  return updated;
}

function identityTransitionError(
  identity: Identity,
  lifecycle: IdentityLifecycle,
  error: unknown,
): ApplicationError {
  if (!(error instanceof DomainTransitionError)) {
    return new ApplicationError({
      category: 'internal',
      code: 'identity_lifecycle_transition_failed',
      message: 'Identity lifecycle transition failed.',
      cause: error,
    });
  }

  if (identity.lifecycle === 'ARCHIVED') {
    return new ApplicationError({
      category: 'conflict',
      code: 'identity_already_archived',
      message: 'Archived Identity cannot be reactivated or changed.',
      cause: error,
    });
  }

  return new ApplicationError({
    category: 'conflict',
    code: 'invalid_identity_state_transition',
    message: `Identity cannot transition from ${identity.lifecycle} to ${lifecycle}.`,
    cause: error,
  });
}

async function findIdentity(repository: IdentityRepository, identityId: string): Promise<Identity> {
  const identity = await repository.findById(identityId);
  if (identity === undefined) {
    throw new ApplicationError({
      category: 'not_found',
      code: 'identity_not_found',
      message: 'Identity not found.',
    });
  }

  return identity;
}
