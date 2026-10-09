import type {
  CommerceProfile,
  CommerceProfileLifecycle,
  CommerceProfilePresentation,
} from '../../modules/commerce-profile/commerce-profile.js';

export class CommerceProfileAlreadyExistsError extends Error {
  public constructor(commerceProfileId: string) {
    super(`Commerce Profile ${commerceProfileId} already exists.`);
    this.name = 'CommerceProfileAlreadyExistsError';
  }
}

export interface CommerceProfileRepository {
  create(profile: CommerceProfile): Promise<void>;
  findById(commerceProfileId: string): Promise<CommerceProfile | undefined>;
  listByIdentityId(identityId: string): Promise<readonly CommerceProfile[]>;
  updatePresentation(
    commerceProfileId: string,
    presentation: CommerceProfilePresentation,
    updatedAt: string,
  ): Promise<void>;
  updateLifecycle(
    commerceProfileId: string,
    lifecycle: CommerceProfileLifecycle,
    updatedAt: string,
  ): Promise<void>;
}
