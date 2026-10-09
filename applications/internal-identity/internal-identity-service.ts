import {
  createInternalIdentity,
  transitionInternalIdentity,
  type IdentityLifecycle,
  type InternalIdentity,
  type InternalIdentityId,
} from '../../modules/identity-infrastructure/identity-contract.js';
import {
  InternalIdentityNotFoundError,
  type InternalIdentityRepository,
} from '../../modules/identity-infrastructure/internal-identity-repository.js';

export interface InternalIdentityIdGenerator {
  generate(): InternalIdentityId;
}

export interface InternalIdentityClock {
  now(): string;
}

export interface InternalIdentityService {
  create(): Promise<InternalIdentity>;
  get(identityId: InternalIdentityId): Promise<InternalIdentity>;
  changeLifecycle(
    identityId: InternalIdentityId,
    lifecycle: IdentityLifecycle,
  ): Promise<InternalIdentity>;
}

export function createInternalIdentityService(dependencies: {
  readonly repository: InternalIdentityRepository;
  readonly idGenerator: InternalIdentityIdGenerator;
  readonly clock: InternalIdentityClock;
}): InternalIdentityService {
  return {
    async create() {
      const createdAt = dependencies.clock.now();
      const identity = createInternalIdentity({
        internalIdentityId: dependencies.idGenerator.generate(),
        createdAt,
      });
      await dependencies.repository.create(identity);
      return identity;
    },

    async get(identityId) {
      const identity = await dependencies.repository.getById(identityId);
      if (identity === undefined) {
        throw new InternalIdentityNotFoundError(identityId);
      }

      return identity;
    },

    async changeLifecycle(identityId, lifecycle) {
      const identity = await this.get(identityId);
      const updated = transitionInternalIdentity(identity, lifecycle, dependencies.clock.now());
      await dependencies.repository.updateLifecycle({
        identityId,
        expectedLifecycle: identity.lifecycle,
        nextLifecycle: updated.lifecycle,
        updatedAt: updated.updatedAt,
      });
      return updated;
    },
  };
}
