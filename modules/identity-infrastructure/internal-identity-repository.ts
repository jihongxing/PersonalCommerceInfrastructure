import type {
  IdentityLifecycle,
  InternalIdentity,
  InternalIdentityId,
} from './identity-contract.js';

export class InternalIdentityAlreadyExistsError extends Error {
  public constructor(identityId: InternalIdentityId) {
    super(`Internal Identity ${identityId} already exists.`);
    this.name = 'InternalIdentityAlreadyExistsError';
  }
}

export class InternalIdentityNotFoundError extends Error {
  public constructor(identityId: InternalIdentityId) {
    super(`Internal Identity ${identityId} was not found.`);
    this.name = 'InternalIdentityNotFoundError';
  }
}

export class InternalIdentityConcurrentUpdateError extends Error {
  public constructor(identityId: InternalIdentityId) {
    super(`Internal Identity ${identityId} changed concurrently.`);
    this.name = 'InternalIdentityConcurrentUpdateError';
  }
}

export interface InternalIdentityRepository {
  create(identity: InternalIdentity): Promise<void>;
  getById(identityId: InternalIdentityId): Promise<InternalIdentity | undefined>;
  exists(identityId: InternalIdentityId): Promise<boolean>;
  updateLifecycle(input: {
    readonly identityId: InternalIdentityId;
    readonly expectedLifecycle: IdentityLifecycle;
    readonly nextLifecycle: IdentityLifecycle;
    readonly updatedAt: string;
  }): Promise<void>;
}
