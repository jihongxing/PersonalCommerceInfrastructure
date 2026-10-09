import {
  assignCommerceReference,
  permanentlyReserveCommerceReference,
  type AssignedCommerceReference,
} from '../../modules/identity-infrastructure/commerce-reference-contract.js';
import type {
  CommerceProfileId,
  CommerceReference,
} from '../../modules/identity-infrastructure/identity-contract.js';
import {
  CommerceProfileAlreadyHasReferenceError,
  CommerceProfileNotFoundForReferenceError,
  CommerceReferenceAlreadyExistsError,
  CommerceReferenceLifecycleConflictError,
  CommerceReferenceNotFoundError,
  type CommerceReferenceRepository,
} from '../../modules/identity-infrastructure/commerce-reference-repository.js';
import type { CommerceProfileRepository } from '../../modules/identity-infrastructure/commerce-profile-repository.js';

export class InMemoryCanonicalCommerceReferenceRepository implements CommerceReferenceRepository {
  private readonly referencesByValue = new Map<CommerceReference, AssignedCommerceReference>();
  private readonly referencesByProfile = new Map<CommerceProfileId, CommerceReference>();

  public constructor(private readonly profiles: CommerceProfileRepository) {}

  public async assign(input: {
    readonly commerceReference: CommerceReference;
    readonly commerceProfileId: CommerceProfileId;
    readonly assignedAt: string;
  }): Promise<void> {
    if (!(await this.profiles.exists(input.commerceProfileId))) {
      throw new CommerceProfileNotFoundForReferenceError(input.commerceProfileId);
    }
    if (this.referencesByValue.has(input.commerceReference)) {
      throw new CommerceReferenceAlreadyExistsError(input.commerceReference);
    }
    if (this.referencesByProfile.has(input.commerceProfileId)) {
      throw new CommerceProfileAlreadyHasReferenceError(input.commerceProfileId);
    }

    const assigned = assignCommerceReference({
      ...input,
      assignedReferences: [],
    });
    this.referencesByValue.set(assigned.commerceReference, structuredClone(assigned));
    this.referencesByProfile.set(assigned.commerceProfileId, assigned.commerceReference);
  }

  public getByReference(
    commerceReference: CommerceReference,
  ): Promise<AssignedCommerceReference | undefined> {
    const reference = this.referencesByValue.get(commerceReference);
    return Promise.resolve(reference === undefined ? undefined : structuredClone(reference));
  }

  public async getByProfileId(
    profileId: CommerceProfileId,
  ): Promise<AssignedCommerceReference | undefined> {
    const reference = this.referencesByProfile.get(profileId);
    return reference === undefined ? undefined : this.getByReference(reference);
  }

  public async exists(commerceReference: CommerceReference): Promise<boolean> {
    return (await this.getByReference(commerceReference)) !== undefined;
  }

  public reserve(input: {
    readonly commerceReference: CommerceReference;
    readonly updatedAt: string;
  }): Promise<void> {
    const existing = this.referencesByValue.get(input.commerceReference);
    if (existing === undefined) {
      return Promise.reject(new CommerceReferenceNotFoundError(input.commerceReference));
    }
    if (existing.lifecycle !== 'ASSIGNED') {
      return Promise.reject(new CommerceReferenceLifecycleConflictError(input.commerceReference));
    }

    this.referencesByValue.set(
      input.commerceReference,
      permanentlyReserveCommerceReference(existing, input.updatedAt),
    );
    return Promise.resolve();
  }

  public createSnapshot(): unknown {
    return structuredClone({
      referencesByValue: this.referencesByValue,
      referencesByProfile: this.referencesByProfile,
    });
  }

  public restoreSnapshot(snapshot: unknown): void {
    if (
      typeof snapshot !== 'object' ||
      snapshot === null ||
      !('referencesByValue' in snapshot) ||
      !('referencesByProfile' in snapshot) ||
      !(snapshot.referencesByValue instanceof Map) ||
      !(snapshot.referencesByProfile instanceof Map)
    ) {
      throw new TypeError('Commerce Reference repository snapshot is invalid.');
    }
    const typedSnapshot = snapshot as {
      readonly referencesByValue: Map<CommerceReference, AssignedCommerceReference>;
      readonly referencesByProfile: Map<CommerceProfileId, CommerceReference>;
    };
    this.referencesByValue.clear();
    this.referencesByProfile.clear();
    for (const [reference, assigned] of structuredClone(typedSnapshot.referencesByValue)) {
      this.referencesByValue.set(reference, assigned);
    }
    for (const [profileId, reference] of structuredClone(typedSnapshot.referencesByProfile)) {
      this.referencesByProfile.set(profileId, reference);
    }
  }
}
