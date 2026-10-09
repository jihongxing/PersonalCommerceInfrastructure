import { DomainTransitionError } from '../../modules/shared/domain-error.js';
import {
  CommerceProfileAlreadyExistsError,
  CommerceProfileLifecycleConflictError,
  CommerceProfileNotFoundError,
  CommerceProfileOwnerNotFoundError,
} from '../../modules/identity-infrastructure/commerce-profile-repository.js';
import {
  CommerceProfileAlreadyHasReferenceError,
  CommerceProfileNotFoundForReferenceError,
  CommerceReferenceAlreadyExistsError,
  CommerceReferenceLifecycleConflictError,
  CommerceReferenceNotFoundError,
} from '../../modules/identity-infrastructure/commerce-reference-repository.js';
import {
  ActiveCommerceRelationshipConflictError,
  CommerceRelationshipAccountNotFoundError,
  CommerceRelationshipAlreadyExistsError,
  CommerceRelationshipLifecycleConflictError,
  CommerceRelationshipNotFoundError,
  CommerceRelationshipProfileNotFoundError,
} from '../../modules/identity-infrastructure/commerce-relationship-repository.js';
import {
  ExternalPlatformAccountAlreadyExistsError,
  ExternalPlatformAccountLifecycleConflictError,
  ExternalPlatformAccountNotFoundError,
} from '../../modules/identity-infrastructure/external-platform-account-repository.js';
import {
  InternalIdentityAlreadyExistsError,
  InternalIdentityConcurrentUpdateError,
  InternalIdentityNotFoundError,
} from '../../modules/identity-infrastructure/internal-identity-repository.js';
import { ApplicationError } from '../core/application-error.js';

export function toPrivateIdentityFoundationApplicationError(error: unknown): never {
  if (error instanceof ApplicationError) {
    throw error;
  }
  if (
    error instanceof InternalIdentityNotFoundError ||
    error instanceof CommerceProfileNotFoundError ||
    error instanceof CommerceProfileNotFoundForReferenceError ||
    error instanceof CommerceRelationshipAccountNotFoundError ||
    error instanceof CommerceRelationshipProfileNotFoundError ||
    error instanceof CommerceRelationshipNotFoundError ||
    error instanceof ExternalPlatformAccountNotFoundError ||
    error instanceof CommerceReferenceNotFoundError
  ) {
    throw applicationError('not_found', 'identity_foundation_not_found', error);
  }
  if (
    error instanceof InternalIdentityAlreadyExistsError ||
    error instanceof InternalIdentityConcurrentUpdateError ||
    error instanceof CommerceProfileAlreadyExistsError ||
    error instanceof CommerceProfileOwnerNotFoundError ||
    error instanceof CommerceProfileLifecycleConflictError ||
    error instanceof CommerceReferenceAlreadyExistsError ||
    error instanceof CommerceProfileAlreadyHasReferenceError ||
    error instanceof CommerceReferenceLifecycleConflictError ||
    error instanceof CommerceRelationshipAlreadyExistsError ||
    error instanceof ActiveCommerceRelationshipConflictError ||
    error instanceof CommerceRelationshipLifecycleConflictError ||
    error instanceof ExternalPlatformAccountAlreadyExistsError ||
    error instanceof ExternalPlatformAccountLifecycleConflictError
  ) {
    throw applicationError('conflict', 'identity_foundation_conflict', error);
  }
  if (error instanceof DomainTransitionError) {
    throw applicationError('conflict', 'identity_foundation_invalid_state', error);
  }
  if (error instanceof TypeError) {
    throw applicationError('validation', 'identity_foundation_invalid_input', error);
  }
  throw applicationError('unavailable', 'identity_foundation_persistence_failure', error);
}

function applicationError(
  category: ApplicationError['category'],
  code: string,
  cause: unknown,
): ApplicationError {
  const message = cause instanceof Error ? cause.message : 'Private Identity Foundation failed.';
  return new ApplicationError({
    category,
    code,
    message,
    cause,
  });
}
