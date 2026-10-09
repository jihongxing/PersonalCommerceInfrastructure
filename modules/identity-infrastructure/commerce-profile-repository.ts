import type {
  CommerceProfile,
  CommerceProfileId,
  CommerceProfileLifecycle,
  InternalIdentityId,
} from './identity-contract.js';

export class CommerceProfileAlreadyExistsError extends Error {
  public constructor(profileId: CommerceProfileId) {
    super(`Commerce Profile ${profileId} already exists.`);
    this.name = 'CommerceProfileAlreadyExistsError';
  }
}

export class CommerceProfileNotFoundError extends Error {
  public constructor(profileId: CommerceProfileId) {
    super(`Commerce Profile ${profileId} was not found.`);
    this.name = 'CommerceProfileNotFoundError';
  }
}

export class CommerceProfileOwnerNotFoundError extends Error {
  public constructor(identityId: InternalIdentityId) {
    super(`Internal Identity ${identityId} does not exist for Commerce Profile ownership.`);
    this.name = 'CommerceProfileOwnerNotFoundError';
  }
}

export class CommerceProfileLifecycleConflictError extends Error {
  public constructor(profileId: CommerceProfileId) {
    super(`Commerce Profile ${profileId} changed concurrently.`);
    this.name = 'CommerceProfileLifecycleConflictError';
  }
}

export interface CommerceProfileRepository {
  create(profile: CommerceProfile): Promise<void>;
  getById(profileId: CommerceProfileId): Promise<CommerceProfile | undefined>;
  exists(profileId: CommerceProfileId): Promise<boolean>;
  listOwnedByIdentity(identityId: InternalIdentityId): Promise<readonly CommerceProfile[]>;
  updatePresentation(input: {
    readonly profileId: CommerceProfileId;
    readonly displayName: string;
    readonly expectedUpdatedAt: string;
    readonly updatedAt: string;
  }): Promise<void>;
  updateLifecycle(input: {
    readonly profileId: CommerceProfileId;
    readonly expectedLifecycle: CommerceProfileLifecycle;
    readonly expectedUpdatedAt: string;
    readonly nextLifecycle: CommerceProfileLifecycle;
    readonly updatedAt: string;
  }): Promise<void>;
}
