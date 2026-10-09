import type { CommerceProfileRepository } from '../../../applications/commerce-profile/commerce-profile-repositories.js';
import type {
  CommerceProfile,
  CommerceProfileLifecycle,
  CommerceProfilePresentation,
} from '../../../modules/commerce-profile/commerce-profile.js';
import type { ProductDatabase } from './postgres-database.js';

export class PostgresCommerceProfileRepository implements CommerceProfileRepository {
  public constructor(private readonly database: ProductDatabase) {}

  public create(profile: CommerceProfile): Promise<void> {
    void profile;
    return this.unsupportedWrite();
  }

  public findById(commerceProfileId: string): Promise<CommerceProfile | undefined> {
    void commerceProfileId;
    return Promise.reject(this.unsupportedError());
  }

  public listByIdentityId(identityId: string): Promise<readonly CommerceProfile[]> {
    void identityId;
    return Promise.reject(this.unsupportedError());
  }

  public updatePresentation(
    commerceProfileId: string,
    presentation: CommerceProfilePresentation,
    updatedAt: string,
  ): Promise<void> {
    void commerceProfileId;
    void presentation;
    void updatedAt;
    return this.unsupportedWrite();
  }

  public updateLifecycle(
    commerceProfileId: string,
    lifecycle: CommerceProfileLifecycle,
    updatedAt: string,
  ): Promise<void> {
    void commerceProfileId;
    void lifecycle;
    void updatedAt;
    return this.unsupportedWrite();
  }

  private unsupportedWrite(): Promise<void> {
    return Promise.reject(this.unsupportedError());
  }

  private unsupportedError(): Error {
    void this.database;
    return new Error(
      'Legacy Commerce Profile persistence is not available. Use PostgresCanonicalCommerceProfileRepository.',
    );
  }
}
