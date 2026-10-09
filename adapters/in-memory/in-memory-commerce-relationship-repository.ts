import {
  transitionCommerceRelationship,
  type CommerceRelationship,
  type CommerceRelationshipId,
  type CommerceRelationshipLifecycle,
  type ExternalPlatformAccountId,
} from '../../modules/identity-infrastructure/external-platform-contract.js';
import {
  ActiveCommerceRelationshipConflictError,
  CommerceRelationshipAlreadyExistsError,
  CommerceRelationshipLifecycleConflictError,
  CommerceRelationshipNotFoundError,
  type CommerceRelationshipRepository,
} from '../../modules/identity-infrastructure/commerce-relationship-repository.js';
import type { CommerceProfileId } from '../../modules/identity-infrastructure/identity-contract.js';
import type { ExternalPlatformAccountRepository } from '../../modules/identity-infrastructure/external-platform-account-repository.js';
import type { CommerceProfileRepository } from '../../modules/identity-infrastructure/commerce-profile-repository.js';
import {
  CommerceRelationshipAccountNotFoundError,
  CommerceRelationshipProfileNotFoundError,
} from '../../modules/identity-infrastructure/commerce-relationship-repository.js';

export class InMemoryCommerceRelationshipRepository implements CommerceRelationshipRepository {
  private readonly relationshipsById = new Map<CommerceRelationshipId, CommerceRelationship>();

  public constructor(
    private readonly accounts: ExternalPlatformAccountRepository,
    private readonly profiles: CommerceProfileRepository,
  ) {}

  public async create(relationship: CommerceRelationship): Promise<void> {
    if (!(await this.accounts.exists(relationship.externalPlatformAccountId))) {
      throw new CommerceRelationshipAccountNotFoundError(relationship.externalPlatformAccountId);
    }
    if (!(await this.profiles.exists(relationship.commerceProfileId))) {
      throw new CommerceRelationshipProfileNotFoundError(relationship.commerceProfileId);
    }
    if (this.relationshipsById.has(relationship.commerceRelationshipId)) {
      throw new CommerceRelationshipAlreadyExistsError(relationship.commerceRelationshipId);
    }
    if (
      relationship.lifecycle === 'ACTIVE' &&
      this.hasOtherActiveRelationship(relationship.externalPlatformAccountId)
    ) {
      throw new ActiveCommerceRelationshipConflictError(relationship.externalPlatformAccountId);
    }
    if (
      relationship.lifecycle === 'PROPOSED' &&
      relationship.provenance === 'SELF_DECLARED' &&
      this.list().some(
        (candidate) =>
          candidate.externalPlatformAccountId === relationship.externalPlatformAccountId &&
          candidate.commerceProfileId === relationship.commerceProfileId &&
          candidate.lifecycle === 'PROPOSED' &&
          candidate.provenance === 'SELF_DECLARED',
      )
    ) {
      throw new CommerceRelationshipAlreadyExistsError(relationship.commerceRelationshipId);
    }

    this.relationshipsById.set(relationship.commerceRelationshipId, relationship);
  }

  public getById(
    relationshipId: CommerceRelationshipId,
  ): Promise<CommerceRelationship | undefined> {
    return Promise.resolve(this.relationshipsById.get(relationshipId));
  }

  public listByExternalPlatformAccount(
    accountId: ExternalPlatformAccountId,
  ): Promise<readonly CommerceRelationship[]> {
    return Promise.resolve(
      this.list().filter((relationship) => relationship.externalPlatformAccountId === accountId),
    );
  }

  public listByCommerceProfile(
    profileId: CommerceProfileId,
  ): Promise<readonly CommerceRelationship[]> {
    return Promise.resolve(
      this.list().filter((relationship) => relationship.commerceProfileId === profileId),
    );
  }

  public async getActiveByExternalPlatformAccount(
    accountId: ExternalPlatformAccountId,
  ): Promise<CommerceRelationship | undefined> {
    return (await this.listByExternalPlatformAccount(accountId)).find(
      (relationship) => relationship.lifecycle === 'ACTIVE',
    );
  }

  public updateLifecycle(input: {
    readonly relationshipId: CommerceRelationshipId;
    readonly expectedLifecycle: CommerceRelationshipLifecycle;
    readonly nextLifecycle: CommerceRelationshipLifecycle;
    readonly updatedAt: string;
  }): Promise<void> {
    const relationship = this.relationshipsById.get(input.relationshipId);
    if (relationship === undefined) {
      return Promise.reject(new CommerceRelationshipNotFoundError(input.relationshipId));
    }
    if (relationship.lifecycle !== input.expectedLifecycle) {
      return Promise.reject(new CommerceRelationshipLifecycleConflictError(input.relationshipId));
    }
    if (
      input.nextLifecycle === 'ACTIVE' &&
      this.hasOtherActiveRelationship(
        relationship.externalPlatformAccountId,
        relationship.commerceRelationshipId,
      )
    ) {
      return Promise.reject(
        new ActiveCommerceRelationshipConflictError(relationship.externalPlatformAccountId),
      );
    }

    try {
      this.relationshipsById.set(
        relationship.commerceRelationshipId,
        transitionCommerceRelationship({
          relationship,
          lifecycle: input.nextLifecycle,
          updatedAt: input.updatedAt,
          relationships: this.list(),
        }),
      );
    } catch (error) {
      return Promise.reject(
        error instanceof Error
          ? error
          : new Error('Commerce Relationship lifecycle update failed.'),
      );
    }
    return Promise.resolve();
  }

  public createSnapshot(): unknown {
    return structuredClone(this.relationshipsById);
  }

  public restoreSnapshot(snapshot: unknown): void {
    if (!(snapshot instanceof Map)) {
      throw new TypeError('Commerce Relationship repository snapshot must be a Map.');
    }
    this.relationshipsById.clear();
    for (const [relationshipId, relationship] of structuredClone(
      snapshot as Map<CommerceRelationshipId, CommerceRelationship>,
    )) {
      this.relationshipsById.set(relationshipId, relationship);
    }
  }

  private list(): readonly CommerceRelationship[] {
    return [...this.relationshipsById.values()].sort(compareByEffectiveAtThenCreatedAt);
  }

  private hasOtherActiveRelationship(
    accountId: ExternalPlatformAccountId,
    excludedRelationshipId?: CommerceRelationshipId,
  ): boolean {
    return this.list().some(
      (relationship) =>
        relationship.commerceRelationshipId !== excludedRelationshipId &&
        relationship.externalPlatformAccountId === accountId &&
        relationship.lifecycle === 'ACTIVE',
    );
  }
}

function compareByEffectiveAtThenCreatedAt(
  left: CommerceRelationship,
  right: CommerceRelationship,
): number {
  return (
    left.effectiveAt.localeCompare(right.effectiveAt) ||
    left.createdAt.localeCompare(right.createdAt) ||
    left.commerceRelationshipId.localeCompare(right.commerceRelationshipId)
  );
}
