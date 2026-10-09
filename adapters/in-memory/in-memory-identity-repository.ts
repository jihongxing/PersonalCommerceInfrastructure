import type { Identity, IdentityLifecycle } from '../../modules/identity/identity.js';
import {
  IdentityAlreadyExistsError,
  type IdentityRepository,
} from '../../applications/identity/identity-repositories.js';
import type { TransactionParticipant } from './transaction-participant.js';

export class InMemoryIdentityRepository implements IdentityRepository, TransactionParticipant {
  private readonly identities = new Map<string, Identity>();

  public create(identity: Identity): Promise<void> {
    if (this.identities.has(identity.identityId)) {
      return Promise.reject(new IdentityAlreadyExistsError(identity.identityId));
    }
    this.identities.set(identity.identityId, structuredClone(identity));
    return Promise.resolve();
  }

  public findById(identityId: string): Promise<Identity | undefined> {
    const identity = this.identities.get(identityId);
    return Promise.resolve(identity === undefined ? undefined : structuredClone(identity));
  }

  public updateLifecycle(
    identityId: string,
    lifecycle: IdentityLifecycle,
    updatedAt: string,
  ): Promise<void> {
    const identity = this.identities.get(identityId);
    if (identity === undefined) {
      return Promise.reject(new Error('Identity not found.'));
    }
    this.identities.set(identityId, { ...identity, lifecycle, updatedAt });
    return Promise.resolve();
  }

  public createSnapshot(): unknown {
    return structuredClone(this.identities);
  }

  public restoreSnapshot(snapshot: unknown): void {
    this.identities.clear();
    for (const [identityId, identity] of structuredClone(snapshot as Map<string, Identity>)) {
      this.identities.set(identityId, identity);
    }
  }
}
