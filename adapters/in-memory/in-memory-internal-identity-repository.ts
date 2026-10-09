import type {
  InternalIdentity,
  InternalIdentityId,
} from '../../modules/identity-infrastructure/identity-contract.js';
import {
  InternalIdentityAlreadyExistsError,
  InternalIdentityConcurrentUpdateError,
  InternalIdentityNotFoundError,
  type InternalIdentityRepository,
} from '../../modules/identity-infrastructure/internal-identity-repository.js';

export class InMemoryInternalIdentityRepository implements InternalIdentityRepository {
  private readonly identities = new Map<InternalIdentityId, InternalIdentity>();

  public create(identity: InternalIdentity): Promise<void> {
    if (this.identities.has(identity.internalIdentityId)) {
      return Promise.reject(new InternalIdentityAlreadyExistsError(identity.internalIdentityId));
    }

    this.identities.set(identity.internalIdentityId, structuredClone(identity));
    return Promise.resolve();
  }

  public getById(identityId: InternalIdentityId): Promise<InternalIdentity | undefined> {
    const identity = this.identities.get(identityId);
    return Promise.resolve(identity === undefined ? undefined : structuredClone(identity));
  }

  public exists(identityId: InternalIdentityId): Promise<boolean> {
    return Promise.resolve(this.identities.has(identityId));
  }

  public updateLifecycle(input: {
    readonly identityId: InternalIdentityId;
    readonly expectedLifecycle: InternalIdentity['lifecycle'];
    readonly nextLifecycle: InternalIdentity['lifecycle'];
    readonly updatedAt: string;
  }): Promise<void> {
    const identity = this.identities.get(input.identityId);
    if (identity === undefined) {
      return Promise.reject(new InternalIdentityNotFoundError(input.identityId));
    }
    if (identity.lifecycle !== input.expectedLifecycle) {
      return Promise.reject(new InternalIdentityConcurrentUpdateError(input.identityId));
    }

    this.identities.set(input.identityId, {
      ...identity,
      lifecycle: input.nextLifecycle,
      updatedAt: input.updatedAt,
    });
    return Promise.resolve();
  }
}
