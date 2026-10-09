import type {
  CommerceRelationship,
  CommerceRelationshipId,
  CommerceRelationshipLifecycle,
  ExternalPlatformAccountId,
} from './external-platform-contract.js';
import type { CommerceProfileId } from './identity-contract.js';

export class CommerceRelationshipAlreadyExistsError extends Error {
  public constructor(public readonly relationshipId: CommerceRelationshipId) {
    super(`Commerce Relationship ${relationshipId} already exists.`);
    this.name = 'CommerceRelationshipAlreadyExistsError';
  }
}

export class CommerceRelationshipNotFoundError extends Error {
  public constructor(public readonly relationshipId: CommerceRelationshipId) {
    super(`Commerce Relationship ${relationshipId} was not found.`);
    this.name = 'CommerceRelationshipNotFoundError';
  }
}

export class CommerceRelationshipAccountNotFoundError extends Error {
  public constructor(public readonly accountId: ExternalPlatformAccountId) {
    super(`External Platform Account ${accountId} was not found for Commerce Relationship.`);
    this.name = 'CommerceRelationshipAccountNotFoundError';
  }
}

export class CommerceRelationshipProfileNotFoundError extends Error {
  public constructor(public readonly profileId: CommerceProfileId) {
    super(`Commerce Profile ${profileId} was not found for Commerce Relationship.`);
    this.name = 'CommerceRelationshipProfileNotFoundError';
  }
}

export class ActiveCommerceRelationshipConflictError extends Error {
  public constructor(public readonly accountId: ExternalPlatformAccountId) {
    super(`External Platform Account ${accountId} already has an active Commerce Relationship.`);
    this.name = 'ActiveCommerceRelationshipConflictError';
  }
}

export class CommerceRelationshipLifecycleConflictError extends Error {
  public constructor(public readonly relationshipId: CommerceRelationshipId) {
    super(`Commerce Relationship ${relationshipId} changed concurrently.`);
    this.name = 'CommerceRelationshipLifecycleConflictError';
  }
}

export interface CommerceRelationshipRepository {
  create(relationship: CommerceRelationship): Promise<void>;
  getById(relationshipId: CommerceRelationshipId): Promise<CommerceRelationship | undefined>;
  listByExternalPlatformAccount(
    accountId: ExternalPlatformAccountId,
  ): Promise<readonly CommerceRelationship[]>;
  listByCommerceProfile(profileId: CommerceProfileId): Promise<readonly CommerceRelationship[]>;
  getActiveByExternalPlatformAccount(
    accountId: ExternalPlatformAccountId,
  ): Promise<CommerceRelationship | undefined>;
  updateLifecycle(input: {
    readonly relationshipId: CommerceRelationshipId;
    readonly expectedLifecycle: CommerceRelationshipLifecycle;
    readonly nextLifecycle: CommerceRelationshipLifecycle;
    readonly updatedAt: string;
  }): Promise<void>;
}
