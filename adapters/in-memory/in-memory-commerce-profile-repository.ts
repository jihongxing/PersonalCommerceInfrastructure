import {
  CommerceProfileAlreadyExistsError,
  type CommerceProfileRepository,
} from '../../applications/commerce-profile/commerce-profile-repositories.js';
import type {
  CommerceProfile,
  CommerceProfileLifecycle,
  CommerceProfilePresentation,
} from '../../modules/commerce-profile/commerce-profile.js';
import type { TransactionParticipant } from './transaction-participant.js';

export class InMemoryCommerceProfileRepository
  implements CommerceProfileRepository, TransactionParticipant
{
  private readonly profiles = new Map<string, CommerceProfile>();

  public create(profile: CommerceProfile): Promise<void> {
    if (this.profiles.has(profile.commerceProfileId)) {
      return Promise.reject(new CommerceProfileAlreadyExistsError(profile.commerceProfileId));
    }
    this.profiles.set(profile.commerceProfileId, profile);
    return Promise.resolve();
  }

  public findById(commerceProfileId: string): Promise<CommerceProfile | undefined> {
    return Promise.resolve(this.profiles.get(commerceProfileId));
  }

  public listByIdentityId(identityId: string): Promise<readonly CommerceProfile[]> {
    return Promise.resolve(
      [...this.profiles.values()].filter((profile) => profile.identityId === identityId),
    );
  }

  public updatePresentation(
    commerceProfileId: string,
    presentation: CommerceProfilePresentation,
    updatedAt: string,
  ): Promise<void> {
    const profile = this.profiles.get(commerceProfileId);
    if (profile === undefined) {
      return Promise.resolve();
    }
    this.profiles.set(commerceProfileId, { ...profile, presentation, updatedAt });
    return Promise.resolve();
  }

  public updateLifecycle(
    commerceProfileId: string,
    lifecycle: CommerceProfileLifecycle,
    updatedAt: string,
  ): Promise<void> {
    const profile = this.profiles.get(commerceProfileId);
    if (profile === undefined) {
      return Promise.resolve();
    }
    this.profiles.set(commerceProfileId, { ...profile, lifecycle, updatedAt });
    return Promise.resolve();
  }

  public createSnapshot(): unknown {
    return structuredClone(this.profiles);
  }

  public restoreSnapshot(snapshot: unknown): void {
    this.profiles.clear();
    for (const [commerceProfileId, profile] of structuredClone(
      snapshot as Map<string, CommerceProfile>,
    )) {
      this.profiles.set(commerceProfileId, profile);
    }
  }
}
