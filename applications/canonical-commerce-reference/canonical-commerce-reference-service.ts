import {
  createCommerceReference,
  type AssignedCommerceReference,
} from '../../modules/identity-infrastructure/commerce-reference-contract.js';
import type {
  CommerceProfileId,
  CommerceReference,
} from '../../modules/identity-infrastructure/identity-contract.js';
import type { CommerceProfileRepository } from '../../modules/identity-infrastructure/commerce-profile-repository.js';
import {
  CommerceProfileNotFoundForReferenceError,
  type CommerceReferenceRepository,
} from '../../modules/identity-infrastructure/commerce-reference-repository.js';
import type { Clock } from '../core/ports/clock.js';
import type { IdentityFoundationTransaction } from '../identity-foundation/identity-foundation-transaction.js';
import { toPrivateIdentityFoundationApplicationError } from '../identity-foundation/private-identity-foundation-error.js';

export interface CanonicalCommerceReferenceService {
  assign(input: {
    readonly commerceReference: CommerceReference;
    readonly commerceProfileId: CommerceProfileId;
  }): Promise<AssignedCommerceReference>;
}

export function createCanonicalCommerceReferenceService(dependencies: {
  readonly commerceProfileRepository: CommerceProfileRepository;
  readonly commerceReferenceRepository: CommerceReferenceRepository;
  readonly transaction: IdentityFoundationTransaction;
  readonly clock: Clock;
}): CanonicalCommerceReferenceService {
  return {
    async assign(input) {
      try {
        const commerceReference = createCommerceReference(input.commerceReference);
        const assignedAt = dependencies.clock.now();

        return await dependencies.transaction.execute(async (scope) => {
          if (!(await scope.commerceProfileRepository.exists(input.commerceProfileId))) {
            throw new CommerceProfileNotFoundForReferenceError(input.commerceProfileId);
          }
          await scope.commerceReferenceRepository.assign({
            commerceReference,
            commerceProfileId: input.commerceProfileId,
            assignedAt,
          });
          const assigned =
            await scope.commerceReferenceRepository.getByReference(commerceReference);
          if (assigned === undefined) {
            throw new Error('Commerce Reference assignment did not persist.');
          }
          return assigned;
        });
      } catch (error) {
        return toPrivateIdentityFoundationApplicationError(error);
      }
    },
  };
}
