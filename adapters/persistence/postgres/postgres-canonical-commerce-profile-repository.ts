import { and, eq } from 'drizzle-orm';

import { commerceProfiles } from '../../../database/schema/commerce-profile.js';
import {
  createCommerceProfileId,
  createInternalIdentityId,
  rehydrateCommerceProfile,
  type CommerceProfile,
  type CommerceProfileId,
  type InternalIdentityId,
} from '../../../modules/identity-infrastructure/identity-contract.js';
import {
  CommerceProfileAlreadyExistsError,
  CommerceProfileLifecycleConflictError,
  CommerceProfileNotFoundError,
  CommerceProfileOwnerNotFoundError,
  type CommerceProfileRepository,
} from '../../../modules/identity-infrastructure/commerce-profile-repository.js';
import type { ProductDatabase } from './postgres-database.js';

export class PostgresCanonicalCommerceProfileRepository implements CommerceProfileRepository {
  public constructor(private readonly database: ProductDatabase) {}

  public async create(profile: CommerceProfile): Promise<void> {
    try {
      await this.database.insert(commerceProfiles).values({
        commerceProfileId: profile.commerceProfileId,
        owningIdentityId: profile.owningIdentityId,
        lifecycle: profile.lifecycle,
        displayName: profile.presentation.displayName,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new CommerceProfileAlreadyExistsError(profile.commerceProfileId);
      }
      if (isForeignKeyViolation(error)) {
        throw new CommerceProfileOwnerNotFoundError(profile.owningIdentityId);
      }
      throw error;
    }
  }

  public async getById(profileId: CommerceProfileId): Promise<CommerceProfile | undefined> {
    const rows = await this.database
      .select()
      .from(commerceProfiles)
      .where(eq(commerceProfiles.commerceProfileId, profileId));
    const row = rows[0];
    return row === undefined ? undefined : rehydrateCommerceProfileRow(row);
  }

  public async exists(profileId: CommerceProfileId): Promise<boolean> {
    return (await this.getById(profileId)) !== undefined;
  }

  public async listOwnedByIdentity(
    identityId: InternalIdentityId,
  ): Promise<readonly CommerceProfile[]> {
    const rows = await this.database
      .select()
      .from(commerceProfiles)
      .where(eq(commerceProfiles.owningIdentityId, identityId));
    return rows.map(rehydrateCommerceProfileRow);
  }

  public async updatePresentation(input: {
    readonly profileId: CommerceProfileId;
    readonly displayName: string;
    readonly expectedUpdatedAt: string;
    readonly updatedAt: string;
  }): Promise<void> {
    const result = await this.database
      .update(commerceProfiles)
      .set({ displayName: input.displayName, updatedAt: input.updatedAt })
      .where(
        and(
          eq(commerceProfiles.commerceProfileId, input.profileId),
          eq(commerceProfiles.updatedAt, input.expectedUpdatedAt),
        ),
      )
      .returning({ profileId: commerceProfiles.commerceProfileId });

    if (result.length === 1) {
      return;
    }
    if ((await this.getById(input.profileId)) === undefined) {
      throw new CommerceProfileNotFoundError(input.profileId);
    }
    throw new CommerceProfileLifecycleConflictError(input.profileId);
  }

  public async updateLifecycle(input: {
    readonly profileId: CommerceProfileId;
    readonly expectedLifecycle: CommerceProfile['lifecycle'];
    readonly expectedUpdatedAt: string;
    readonly nextLifecycle: CommerceProfile['lifecycle'];
    readonly updatedAt: string;
  }): Promise<void> {
    const result = await this.database
      .update(commerceProfiles)
      .set({ lifecycle: input.nextLifecycle, updatedAt: input.updatedAt })
      .where(
        and(
          eq(commerceProfiles.commerceProfileId, input.profileId),
          eq(commerceProfiles.lifecycle, input.expectedLifecycle),
          eq(commerceProfiles.updatedAt, input.expectedUpdatedAt),
        ),
      )
      .returning({ profileId: commerceProfiles.commerceProfileId });

    if (result.length === 1) {
      return;
    }
    if ((await this.getById(input.profileId)) === undefined) {
      throw new CommerceProfileNotFoundError(input.profileId);
    }
    throw new CommerceProfileLifecycleConflictError(input.profileId);
  }
}

export function rehydrateCommerceProfileRow(row: {
  readonly commerceProfileId: string;
  readonly owningIdentityId: string;
  readonly lifecycle: string;
  readonly displayName: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}): CommerceProfile {
  return rehydrateCommerceProfile({
    commerceProfileId: createCommerceProfileId(row.commerceProfileId),
    owningIdentityId: createInternalIdentityId(row.owningIdentityId),
    lifecycle: row.lifecycle,
    presentation: { displayName: row.displayName },
    createdAt: toCanonicalTimestamp(row.createdAt),
    updatedAt: toCanonicalTimestamp(row.updatedAt),
  });
}

function isUniqueViolation(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === '23505';
}

function isForeignKeyViolation(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === '23503';
}

function toCanonicalTimestamp(value: string): string {
  return new Date(value).toISOString();
}
