import {
  createCommerceRelationship,
  transitionCommerceRelationship,
  type CommerceRelationship,
  type CommerceRelationshipId,
  type CommerceRelationshipLifecycle,
  type CommerceRelationshipRole,
  type ExternalPlatformAccountId,
} from '../../modules/identity-infrastructure/external-platform-contract.js';
import type { CommerceProfileId } from '../../modules/identity-infrastructure/identity-contract.js';
import type { CommerceProfileRepository } from '../../modules/identity-infrastructure/commerce-profile-repository.js';
import {
  CommerceRelationshipAccountNotFoundError,
  CommerceRelationshipNotFoundError,
  CommerceRelationshipProfileNotFoundError,
  type CommerceRelationshipRepository,
} from '../../modules/identity-infrastructure/commerce-relationship-repository.js';
import type { ExternalPlatformAccountRepository } from '../../modules/identity-infrastructure/external-platform-account-repository.js';
import type { Clock } from '../core/ports/clock.js';
import type { IdentityFoundationTransaction } from '../identity-foundation/identity-foundation-transaction.js';
import { toPrivateIdentityFoundationApplicationError } from '../identity-foundation/private-identity-foundation-error.js';

export interface CommerceRelationshipIdGenerator {
  generate(): CommerceRelationshipId;
}

export interface CommerceRelationshipService {
  create(input: {
    readonly externalPlatformAccountId: ExternalPlatformAccountId;
    readonly commerceProfileId: CommerceProfileId;
    readonly role: CommerceRelationshipRole;
    readonly effectiveAt: string;
  }): Promise<CommerceRelationship>;
  get(relationshipId: CommerceRelationshipId): Promise<CommerceRelationship>;
  listForAccount(accountId: ExternalPlatformAccountId): Promise<readonly CommerceRelationship[]>;
  listForProfile(profileId: CommerceProfileId): Promise<readonly CommerceRelationship[]>;
  getActiveForAccount(
    accountId: ExternalPlatformAccountId,
  ): Promise<CommerceRelationship | undefined>;
  changeLifecycle(
    relationshipId: CommerceRelationshipId,
    lifecycle: CommerceRelationshipLifecycle,
  ): Promise<CommerceRelationship>;
  replaceSuspendedWithVerified(input: {
    readonly suspendedRelationshipId: CommerceRelationshipId;
    readonly verifiedRelationshipId: CommerceRelationshipId;
  }): Promise<CommerceRelationship>;
}

export function createCommerceRelationshipService(dependencies: {
  readonly commerceRelationshipRepository: CommerceRelationshipRepository;
  readonly commerceProfileRepository: CommerceProfileRepository;
  readonly externalPlatformAccountRepository: ExternalPlatformAccountRepository;
  readonly transaction: IdentityFoundationTransaction;
  readonly idGenerator: CommerceRelationshipIdGenerator;
  readonly clock: Clock;
}): CommerceRelationshipService {
  return {
    async create(input) {
      try {
        if (
          !(await dependencies.externalPlatformAccountRepository.exists(
            input.externalPlatformAccountId,
          ))
        ) {
          throw new CommerceRelationshipAccountNotFoundError(input.externalPlatformAccountId);
        }
        if (!(await dependencies.commerceProfileRepository.exists(input.commerceProfileId))) {
          throw new CommerceRelationshipProfileNotFoundError(input.commerceProfileId);
        }
        const createdAt = dependencies.clock.now();
        const relationship = createCommerceRelationship({
          commerceRelationshipId: dependencies.idGenerator.generate(),
          externalPlatformAccountId: input.externalPlatformAccountId,
          commerceProfileId: input.commerceProfileId,
          role: input.role,
          effectiveAt: input.effectiveAt,
          createdAt,
        });
        await dependencies.commerceRelationshipRepository.create(relationship);
        return relationship;
      } catch (error) {
        return toPrivateIdentityFoundationApplicationError(error);
      }
    },

    async get(relationshipId) {
      try {
        const relationship =
          await dependencies.commerceRelationshipRepository.getById(relationshipId);
        if (relationship === undefined) {
          throw new CommerceRelationshipNotFoundError(relationshipId);
        }
        return relationship;
      } catch (error) {
        return toPrivateIdentityFoundationApplicationError(error);
      }
    },

    async listForAccount(accountId) {
      try {
        return await dependencies.commerceRelationshipRepository.listByExternalPlatformAccount(
          accountId,
        );
      } catch (error) {
        return toPrivateIdentityFoundationApplicationError(error);
      }
    },

    async listForProfile(profileId) {
      try {
        return await dependencies.commerceRelationshipRepository.listByCommerceProfile(profileId);
      } catch (error) {
        return toPrivateIdentityFoundationApplicationError(error);
      }
    },

    async getActiveForAccount(accountId) {
      try {
        return await dependencies.commerceRelationshipRepository.getActiveByExternalPlatformAccount(
          accountId,
        );
      } catch (error) {
        return toPrivateIdentityFoundationApplicationError(error);
      }
    },

    async changeLifecycle(relationshipId, lifecycle) {
      try {
        const relationship = await requireRelationship(
          dependencies.commerceRelationshipRepository,
          relationshipId,
        );
        const updated = transitionCommerceRelationship({
          relationship,
          lifecycle,
          updatedAt: dependencies.clock.now(),
          relationships:
            await dependencies.commerceRelationshipRepository.listByExternalPlatformAccount(
              relationship.externalPlatformAccountId,
            ),
        });
        await dependencies.commerceRelationshipRepository.updateLifecycle({
          relationshipId,
          expectedLifecycle: relationship.lifecycle,
          nextLifecycle: updated.lifecycle,
          updatedAt: updated.updatedAt,
        });
        return updated;
      } catch (error) {
        return toPrivateIdentityFoundationApplicationError(error);
      }
    },

    async replaceSuspendedWithVerified(input) {
      try {
        return await dependencies.transaction.execute(async (scope) => {
          const suspended = await requireRelationship(
            scope.commerceRelationshipRepository,
            input.suspendedRelationshipId,
          );
          const verified = await requireRelationship(
            scope.commerceRelationshipRepository,
            input.verifiedRelationshipId,
          );
          if (suspended.externalPlatformAccountId !== verified.externalPlatformAccountId) {
            throw new TypeError('Commerce Relationship replacement requires the same account.');
          }

          const historical = transitionCommerceRelationship({
            relationship: suspended,
            lifecycle: 'HISTORICAL',
            updatedAt: dependencies.clock.now(),
            relationships: await scope.commerceRelationshipRepository.listByExternalPlatformAccount(
              suspended.externalPlatformAccountId,
            ),
          });
          await scope.commerceRelationshipRepository.updateLifecycle({
            relationshipId: suspended.commerceRelationshipId,
            expectedLifecycle: suspended.lifecycle,
            nextLifecycle: historical.lifecycle,
            updatedAt: historical.updatedAt,
          });

          const active = transitionCommerceRelationship({
            relationship: verified,
            lifecycle: 'ACTIVE',
            updatedAt: dependencies.clock.now(),
            relationships: await scope.commerceRelationshipRepository.listByExternalPlatformAccount(
              verified.externalPlatformAccountId,
            ),
          });
          await scope.commerceRelationshipRepository.updateLifecycle({
            relationshipId: verified.commerceRelationshipId,
            expectedLifecycle: verified.lifecycle,
            nextLifecycle: active.lifecycle,
            updatedAt: active.updatedAt,
          });
          return active;
        });
      } catch (error) {
        return toPrivateIdentityFoundationApplicationError(error);
      }
    },
  };
}

async function requireRelationship(
  repository: CommerceRelationshipRepository,
  relationshipId: CommerceRelationshipId,
): Promise<CommerceRelationship> {
  const relationship = await repository.getById(relationshipId);
  if (relationship === undefined) {
    throw new CommerceRelationshipNotFoundError(relationshipId);
  }
  return relationship;
}
