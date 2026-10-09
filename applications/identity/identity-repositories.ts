import type { Identity, IdentityLifecycle } from '../../modules/identity/identity.js';

export class IdentityAlreadyExistsError extends Error {
  public constructor(identityId: string) {
    super(`Identity ${identityId} already exists.`);
    this.name = 'IdentityAlreadyExistsError';
  }
}

export interface IdentityRepository {
  create(identity: Identity): Promise<void>;
  findById(identityId: string): Promise<Identity | undefined>;
  updateLifecycle(
    identityId: string,
    lifecycle: IdentityLifecycle,
    updatedAt: string,
  ): Promise<void>;
}
