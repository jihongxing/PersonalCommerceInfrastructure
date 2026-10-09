import {
  createCommerceProfile,
  transitionCommerceProfile,
  updateCommerceProfilePresentation,
  type CommerceProfile,
  type CommerceProfileId,
  type CommerceProfileLifecycle,
  type CommerceProfilePresentation,
  type InternalIdentityId,
} from '../../modules/identity-infrastructure/identity-contract.js';
import {
  CommerceProfileNotFoundError,
  type CommerceProfileRepository,
} from '../../modules/identity-infrastructure/commerce-profile-repository.js';

export interface CommerceProfileIdGenerator {
  generate(): CommerceProfileId;
}

export interface CommerceProfileClock {
  now(): string;
}

export interface CanonicalCommerceProfileService {
  create(input: {
    readonly owningIdentityId: InternalIdentityId;
    readonly presentation: CommerceProfilePresentation;
  }): Promise<CommerceProfile>;
  get(profileId: CommerceProfileId): Promise<CommerceProfile>;
  listOwnedByIdentity(identityId: InternalIdentityId): Promise<readonly CommerceProfile[]>;
  updatePresentation(
    profileId: CommerceProfileId,
    presentation: CommerceProfilePresentation,
  ): Promise<CommerceProfile>;
  changeLifecycle(
    profileId: CommerceProfileId,
    lifecycle: CommerceProfileLifecycle,
  ): Promise<CommerceProfile>;
}

export function createCanonicalCommerceProfileService(dependencies: {
  readonly repository: CommerceProfileRepository;
  readonly idGenerator: CommerceProfileIdGenerator;
  readonly clock: CommerceProfileClock;
}): CanonicalCommerceProfileService {
  return {
    async create(input) {
      const createdAt = dependencies.clock.now();
      const profile = createCommerceProfile({
        commerceProfileId: dependencies.idGenerator.generate(),
        owningIdentityId: input.owningIdentityId,
        presentation: input.presentation,
        createdAt,
      });
      await dependencies.repository.create(profile);
      return profile;
    },

    async get(profileId) {
      const profile = await dependencies.repository.getById(profileId);
      if (profile === undefined) {
        throw new CommerceProfileNotFoundError(profileId);
      }
      return profile;
    },

    listOwnedByIdentity(identityId) {
      return dependencies.repository.listOwnedByIdentity(identityId);
    },

    async updatePresentation(profileId, presentation) {
      const profile = await this.get(profileId);
      const updated = updateCommerceProfilePresentation(
        profile,
        presentation,
        nextUpdateTimestamp(profile.updatedAt, dependencies.clock.now()),
      );
      await dependencies.repository.updatePresentation({
        profileId,
        displayName: updated.presentation.displayName,
        expectedUpdatedAt: profile.updatedAt,
        updatedAt: updated.updatedAt,
      });
      return updated;
    },

    async changeLifecycle(profileId, lifecycle) {
      const profile = await this.get(profileId);
      const updated = transitionCommerceProfile(
        profile,
        lifecycle,
        nextUpdateTimestamp(profile.updatedAt, dependencies.clock.now()),
      );
      await dependencies.repository.updateLifecycle({
        profileId,
        expectedLifecycle: profile.lifecycle,
        expectedUpdatedAt: profile.updatedAt,
        nextLifecycle: updated.lifecycle,
        updatedAt: updated.updatedAt,
      });
      return updated;
    },
  };
}

function nextUpdateTimestamp(previous: string, current: string): string {
  if (current > previous) {
    return current;
  }
  return new Date(new Date(previous).getTime() + 1).toISOString();
}
