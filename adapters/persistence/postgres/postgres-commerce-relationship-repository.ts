import { and, asc, eq } from 'drizzle-orm';

import { commerceProfiles } from '../../../database/schema/commerce-profile.js';
import { commerceRelationships } from '../../../database/schema/commerce-relationship.js';
import { externalPlatformAccounts } from '../../../database/schema/external-platform-account.js';
import {
  createCommerceRelationshipId,
  createExternalPlatformAccountId,
  rehydrateCommerceRelationship,
  transitionCommerceRelationship,
  type CommerceRelationship,
  type CommerceRelationshipId,
  type CommerceRelationshipLifecycle,
  type ExternalPlatformAccountId,
} from '../../../modules/identity-infrastructure/external-platform-contract.js';
import {
  ActiveCommerceRelationshipConflictError,
  CommerceRelationshipAccountNotFoundError,
  CommerceRelationshipAlreadyExistsError,
  CommerceRelationshipLifecycleConflictError,
  CommerceRelationshipNotFoundError,
  CommerceRelationshipProfileNotFoundError,
  type CommerceRelationshipRepository,
} from '../../../modules/identity-infrastructure/commerce-relationship-repository.js';
import {
  createCommerceProfileId,
  type CommerceProfileId,
} from '../../../modules/identity-infrastructure/identity-contract.js';
import type { ProductDatabase } from './postgres-database.js';

export class PostgresCommerceRelationshipRepository implements CommerceRelationshipRepository {
  public constructor(private readonly database: ProductDatabase) {}

  public async create(relationship: CommerceRelationship): Promise<void> {
    try {
      const inserted = await this.database
        .insert(commerceRelationships)
        .values({
          commerceRelationshipId: relationship.commerceRelationshipId,
          externalPlatformAccountId: relationship.externalPlatformAccountId,
          commerceProfileId: relationship.commerceProfileId,
          role: relationship.role,
          provenance: relationship.provenance,
          lifecycle: relationship.lifecycle,
          effectiveAt: relationship.effectiveAt,
          createdAt: relationship.createdAt,
          updatedAt: relationship.updatedAt,
        })
        .onConflictDoNothing()
        .returning({ relationshipId: commerceRelationships.commerceRelationshipId });
      if (inserted.length === 0) {
        const existingTarget = (
          await this.listByCommerceProfile(relationship.commerceProfileId)
        ).find(
          (candidate) =>
            candidate.externalPlatformAccountId === relationship.externalPlatformAccountId &&
            candidate.lifecycle === 'PROPOSED' &&
            candidate.provenance === 'SELF_DECLARED',
        );
        if (existingTarget !== undefined) {
          throw new CommerceRelationshipAlreadyExistsError(existingTarget.commerceRelationshipId);
        }
        throw new ActiveCommerceRelationshipConflictError(relationship.externalPlatformAccountId);
      }
    } catch (error) {
      if (isForeignKeyViolation(error)) {
        await this.throwReferenceFailure(relationship);
      }
      throw error;
    }
  }

  public async getById(
    relationshipId: CommerceRelationshipId,
  ): Promise<CommerceRelationship | undefined> {
    const rows = await this.database
      .select()
      .from(commerceRelationships)
      .where(eq(commerceRelationships.commerceRelationshipId, relationshipId));
    const row = rows[0];
    return row === undefined ? undefined : rehydrateCommerceRelationshipRow(row);
  }

  public async listByExternalPlatformAccount(
    accountId: ExternalPlatformAccountId,
  ): Promise<readonly CommerceRelationship[]> {
    const rows = await this.database
      .select()
      .from(commerceRelationships)
      .where(eq(commerceRelationships.externalPlatformAccountId, accountId))
      .orderBy(
        asc(commerceRelationships.effectiveAt),
        asc(commerceRelationships.createdAt),
        asc(commerceRelationships.commerceRelationshipId),
      );
    return rows.map(rehydrateCommerceRelationshipRow);
  }

  public async listByCommerceProfile(
    profileId: CommerceProfileId,
  ): Promise<readonly CommerceRelationship[]> {
    const rows = await this.database
      .select()
      .from(commerceRelationships)
      .where(eq(commerceRelationships.commerceProfileId, profileId))
      .orderBy(
        asc(commerceRelationships.effectiveAt),
        asc(commerceRelationships.createdAt),
        asc(commerceRelationships.commerceRelationshipId),
      );
    return rows.map(rehydrateCommerceRelationshipRow);
  }

  public async getActiveByExternalPlatformAccount(
    accountId: ExternalPlatformAccountId,
  ): Promise<CommerceRelationship | undefined> {
    const rows = await this.database
      .select()
      .from(commerceRelationships)
      .where(
        and(
          eq(commerceRelationships.externalPlatformAccountId, accountId),
          eq(commerceRelationships.lifecycle, 'ACTIVE'),
        ),
      );
    const row = rows[0];
    return row === undefined ? undefined : rehydrateCommerceRelationshipRow(row);
  }

  public async updateLifecycle(input: {
    readonly relationshipId: CommerceRelationshipId;
    readonly expectedLifecycle: CommerceRelationshipLifecycle;
    readonly nextLifecycle: CommerceRelationshipLifecycle;
    readonly updatedAt: string;
  }): Promise<void> {
    const relationship = await this.getById(input.relationshipId);
    if (relationship === undefined) {
      throw new CommerceRelationshipNotFoundError(input.relationshipId);
    }
    if (relationship.lifecycle !== input.expectedLifecycle) {
      throw new CommerceRelationshipLifecycleConflictError(input.relationshipId);
    }

    const transitioned = transitionCommerceRelationship({
      relationship,
      lifecycle: input.nextLifecycle,
      updatedAt: input.updatedAt,
      relationships: await this.listByExternalPlatformAccount(
        relationship.externalPlatformAccountId,
      ),
    });

    try {
      const result = await this.database
        .update(commerceRelationships)
        .set({ lifecycle: transitioned.lifecycle, updatedAt: transitioned.updatedAt })
        .where(
          and(
            eq(commerceRelationships.commerceRelationshipId, input.relationshipId),
            eq(commerceRelationships.lifecycle, input.expectedLifecycle),
          ),
        )
        .returning({ relationshipId: commerceRelationships.commerceRelationshipId });

      if (result.length === 1) {
        return;
      }
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ActiveCommerceRelationshipConflictError(relationship.externalPlatformAccountId);
      }
      throw error;
    }

    throw new CommerceRelationshipLifecycleConflictError(input.relationshipId);
  }

  private async throwReferenceFailure(relationship: CommerceRelationship): Promise<never> {
    const accountExists = await this.database
      .select({ accountId: externalPlatformAccounts.externalPlatformAccountId })
      .from(externalPlatformAccounts)
      .where(
        eq(
          externalPlatformAccounts.externalPlatformAccountId,
          relationship.externalPlatformAccountId,
        ),
      );
    if (accountExists.length === 0) {
      throw new CommerceRelationshipAccountNotFoundError(relationship.externalPlatformAccountId);
    }

    const profileExists = await this.database
      .select({ profileId: commerceProfiles.commerceProfileId })
      .from(commerceProfiles)
      .where(eq(commerceProfiles.commerceProfileId, relationship.commerceProfileId));
    if (profileExists.length === 0) {
      throw new CommerceRelationshipProfileNotFoundError(relationship.commerceProfileId);
    }

    throw new CommerceRelationshipProfileNotFoundError(relationship.commerceProfileId);
  }

}

export function rehydrateCommerceRelationshipRow(row: {
  readonly commerceRelationshipId: string;
  readonly externalPlatformAccountId: string;
  readonly commerceProfileId: string;
  readonly role: string;
  readonly provenance?: string;
  readonly lifecycle: string;
  readonly effectiveAt: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}): CommerceRelationship {
  return rehydrateCommerceRelationship({
    commerceRelationshipId: createCommerceRelationshipId(row.commerceRelationshipId),
    externalPlatformAccountId: createExternalPlatformAccountId(row.externalPlatformAccountId),
    commerceProfileId: createCommerceProfileId(row.commerceProfileId),
    role: row.role,
    provenance: row.provenance ?? 'UNKNOWN',
    lifecycle: row.lifecycle,
    effectiveAt: row.effectiveAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

function isUniqueViolation(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === '23505';
}

function isForeignKeyViolation(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === '23503';
}
