import { and, eq } from 'drizzle-orm';

import { commerceReferences } from '../../../database/schema/commerce-reference.js';
import {
  createCommerceReference,
  rehydrateAssignedCommerceReference,
  type AssignedCommerceReference,
} from '../../../modules/identity-infrastructure/commerce-reference-contract.js';
import {
  createCommerceProfileId,
  type CommerceProfileId,
  type CommerceReference,
} from '../../../modules/identity-infrastructure/identity-contract.js';
import {
  CommerceProfileNotFoundForReferenceError,
  CommerceReferenceAlreadyExistsError,
  CommerceReferenceLifecycleConflictError,
  CommerceReferenceNotFoundError,
  type CommerceReferenceRepository,
} from '../../../modules/identity-infrastructure/commerce-reference-repository.js';
import type { ProductDatabase } from './postgres-database.js';

export class PostgresCanonicalCommerceReferenceRepository implements CommerceReferenceRepository {
  public constructor(private readonly database: ProductDatabase) {}

  public async assign(input: {
    readonly commerceReference: CommerceReference;
    readonly commerceProfileId: CommerceProfileId;
    readonly assignedAt: string;
  }): Promise<void> {
    const assigned = rehydrateAssignedCommerceReference({
      commerceReference: createCommerceReference(input.commerceReference),
      commerceProfileId: createCommerceProfileId(input.commerceProfileId),
      lifecycle: 'ASSIGNED',
      assignedAt: input.assignedAt,
      updatedAt: input.assignedAt,
    });

    try {
      await this.database.insert(commerceReferences).values({
        commerceReference: assigned.commerceReference,
        commerceProfileId: assigned.commerceProfileId,
        lifecycle: assigned.lifecycle,
        assignedAt: assigned.assignedAt,
        createdAt: assigned.assignedAt,
        updatedAt: assigned.updatedAt,
      });
    } catch (error) {
      if (isForeignKeyViolation(error)) {
        throw new CommerceProfileNotFoundForReferenceError(input.commerceProfileId);
      }
      if (isUniqueViolation(error)) {
        throw new CommerceReferenceAlreadyExistsError(input.commerceReference);
      }
      throw error;
    }
  }

  public async getByReference(
    commerceReference: CommerceReference,
  ): Promise<AssignedCommerceReference | undefined> {
    const rows = await this.database
      .select()
      .from(commerceReferences)
      .where(eq(commerceReferences.commerceReference, commerceReference));
    const row = rows[0];
    return row === undefined ? undefined : rehydrateCommerceReferenceRow(row);
  }

  public async getByProfileId(
    profileId: CommerceProfileId,
  ): Promise<AssignedCommerceReference | undefined> {
    const rows = await this.database
      .select()
      .from(commerceReferences)
      .where(eq(commerceReferences.commerceProfileId, profileId));
    const row = rows[0];
    return row === undefined ? undefined : rehydrateCommerceReferenceRow(row);
  }

  public async exists(commerceReference: CommerceReference): Promise<boolean> {
    return (await this.getByReference(commerceReference)) !== undefined;
  }

  public async reserve(input: {
    readonly commerceReference: CommerceReference;
    readonly updatedAt: string;
  }): Promise<void> {
    const result = await this.database
      .update(commerceReferences)
      .set({ lifecycle: 'PERMANENTLY_RESERVED', updatedAt: input.updatedAt })
      .where(
        and(
          eq(commerceReferences.commerceReference, input.commerceReference),
          eq(commerceReferences.lifecycle, 'ASSIGNED'),
        ),
      )
      .returning({ commerceReference: commerceReferences.commerceReference });

    if (result.length === 1) {
      return;
    }
    if ((await this.getByReference(input.commerceReference)) === undefined) {
      throw new CommerceReferenceNotFoundError(input.commerceReference);
    }
    throw new CommerceReferenceLifecycleConflictError(input.commerceReference);
  }

}

export function rehydrateCommerceReferenceRow(row: {
  readonly commerceReference: string;
  readonly commerceProfileId: string;
  readonly lifecycle: string;
  readonly assignedAt: string;
  readonly updatedAt: string;
}): AssignedCommerceReference {
  return rehydrateAssignedCommerceReference({
    commerceReference: createCommerceReference(row.commerceReference),
    commerceProfileId: createCommerceProfileId(row.commerceProfileId),
    lifecycle: row.lifecycle,
    assignedAt: row.assignedAt,
    updatedAt: row.updatedAt,
  });
}

function isUniqueViolation(error: unknown): boolean {
  return hasPostgresCode(error, '23505');
}

function isForeignKeyViolation(error: unknown): boolean {
  return hasPostgresCode(error, '23503');
}

function hasPostgresCode(error: unknown, code: string): boolean {
  if (typeof error !== 'object' || error === null) {
    return false;
  }
  if ('code' in error && error.code === code) {
    return true;
  }
  if ('cause' in error) {
    return hasPostgresCode(error.cause, code);
  }
  return false;
}
