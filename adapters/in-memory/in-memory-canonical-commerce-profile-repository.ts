import type {
  CommerceProfile,
  CommerceProfileId,
  InternalIdentityId,
} from '../../modules/identity-infrastructure/identity-contract.js';
import {
  CommerceProfileAlreadyExistsError,
  CommerceProfileLifecycleConflictError,
  CommerceProfileNotFoundError,
  CommerceProfileOwnerNotFoundError,
  type CommerceProfileRepository,
} from '../../modules/identity-infrastructure/commerce-profile-repository.js';

interface ProfileOwnerIdentityLookup {
  exists(identityId: InternalIdentityId): Promise<boolean>;
}

export class InMemoryCanonicalCommerceProfileRepository implements CommerceProfileRepository {
  private readonly profiles = new Map<CommerceProfileId, CommerceProfile>();

  public constructor(private readonly identities: ProfileOwnerIdentityLookup) {}

  public async create(profile: CommerceProfile): Promise<void> {
    if (!(await this.identities.exists(profile.owningIdentityId))) {
      throw new CommerceProfileOwnerNotFoundError(profile.owningIdentityId);
    }
    if (this.profiles.has(profile.commerceProfileId)) {
      throw new CommerceProfileAlreadyExistsError(profile.commerceProfileId);
    }
    this.profiles.set(profile.commerceProfileId, structuredClone(profile));
  }

  public createSnapshot(): unknown {
    return structuredClone(this.profiles);
  }

  public restoreSnapshot(snapshot: unknown): void {
    if (!(snapshot instanceof Map)) {
      throw new TypeError('Commerce Profile repository snapshot is invalid.');
    }
    this.profiles.clear();
    const profiles = snapshot as Map<CommerceProfileId, CommerceProfile>;
    for (const [profileId, profile] of structuredClone(profiles)) {
      this.profiles.set(profileId, profile);
    }
  }

  public getById(profileId: CommerceProfileId): Promise<CommerceProfile | undefined> {
    const profile = this.profiles.get(profileId);
    return Promise.resolve(profile === undefined ? undefined : structuredClone(profile));
  }

  public exists(profileId: CommerceProfileId): Promise<boolean> {
    return Promise.resolve(this.profiles.has(profileId));
  }

  public listOwnedByIdentity(identityId: InternalIdentityId): Promise<readonly CommerceProfile[]> {
    return Promise.resolve(
      [...this.profiles.values()]
        .filter((profile) => profile.owningIdentityId === identityId)
        .map((profile) => structuredClone(profile)),
    );
  }

  public updatePresentation(input: {
    readonly profileId: CommerceProfileId;
    readonly displayName: string;
    readonly expectedUpdatedAt: string;
    readonly updatedAt: string;
  }): Promise<void> {
    const profile = this.profiles.get(input.profileId);
    if (profile === undefined) {
      return Promise.reject(new CommerceProfileNotFoundError(input.profileId));
    }
    if (profile.updatedAt !== input.expectedUpdatedAt) {
      return Promise.reject(new CommerceProfileLifecycleConflictError(input.profileId));
    }
    this.profiles.set(input.profileId, {
      ...profile,
      presentation: { displayName: input.displayName },
      updatedAt: input.updatedAt,
    });
    return Promise.resolve();
  }

  public updateLifecycle(input: {
    readonly profileId: CommerceProfileId;
    readonly expectedLifecycle: CommerceProfile['lifecycle'];
    readonly expectedUpdatedAt: string;
    readonly nextLifecycle: CommerceProfile['lifecycle'];
    readonly updatedAt: string;
  }): Promise<void> {
    const profile = this.profiles.get(input.profileId);
    if (profile === undefined) {
      return Promise.reject(new CommerceProfileNotFoundError(input.profileId));
    }
    if (
      profile.lifecycle !== input.expectedLifecycle ||
      profile.updatedAt !== input.expectedUpdatedAt
    ) {
      return Promise.reject(new CommerceProfileLifecycleConflictError(input.profileId));
    }
    this.profiles.set(input.profileId, {
      ...profile,
      lifecycle: input.nextLifecycle,
      updatedAt: input.updatedAt,
    });
    return Promise.resolve();
  }
}
