import type { CommerceProfileId, CommerceReference } from './identity-contract.js';
import type {
  AssignedCommerceReference,
} from './commerce-reference-contract.js';

export class CommerceReferenceAlreadyExistsError extends Error {
  public constructor(reference: CommerceReference) {
    super(`Commerce Reference ${reference} is already assigned.`);
    this.name = 'CommerceReferenceAlreadyExistsError';
  }
}

export class CommerceReferenceNotFoundError extends Error {
  public constructor(reference: CommerceReference) {
    super(`Commerce Reference ${reference} was not found.`);
    this.name = 'CommerceReferenceNotFoundError';
  }
}

export class CommerceProfileAlreadyHasReferenceError extends Error {
  public constructor(profileId: CommerceProfileId) {
    super(`Commerce Profile ${profileId} already has a Commerce Reference.`);
    this.name = 'CommerceProfileAlreadyHasReferenceError';
  }
}

export class CommerceProfileNotFoundForReferenceError extends Error {
  public constructor(profileId: CommerceProfileId) {
    super(`Commerce Profile ${profileId} does not exist for Commerce Reference assignment.`);
    this.name = 'CommerceProfileNotFoundForReferenceError';
  }
}

export class CommerceReferenceLifecycleConflictError extends Error {
  public constructor(reference: CommerceReference) {
    super(`Commerce Reference ${reference} changed concurrently or cannot transition.`);
    this.name = 'CommerceReferenceLifecycleConflictError';
  }
}

export interface CommerceReferenceRepository {
  assign(input: {
    readonly commerceReference: CommerceReference;
    readonly commerceProfileId: CommerceProfileId;
    readonly assignedAt: string;
  }): Promise<void>;
  getByReference(
    commerceReference: CommerceReference,
  ): Promise<AssignedCommerceReference | undefined>;
  getByProfileId(profileId: CommerceProfileId): Promise<AssignedCommerceReference | undefined>;
  exists(commerceReference: CommerceReference): Promise<boolean>;
  reserve(input: {
    readonly commerceReference: CommerceReference;
    readonly updatedAt: string;
  }): Promise<void>;
}
