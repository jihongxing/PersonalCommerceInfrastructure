import { and, eq } from 'drizzle-orm';

import { identities } from '../../../database/schema/identity.js';
import {
  createInternalIdentityId,
  rehydrateInternalIdentity,
  type InternalIdentity,
  type InternalIdentityId,
} from '../../../modules/identity-infrastructure/identity-contract.js';
import {
  InternalIdentityAlreadyExistsError,
  InternalIdentityConcurrentUpdateError,
  InternalIdentityNotFoundError,
  type InternalIdentityRepository,
} from '../../../modules/identity-infrastructure/internal-identity-repository.js';
import type { ProductDatabase } from './postgres-database.js';

export class PostgresInternalIdentityRepository implements InternalIdentityRepository {
  public constructor(private readonly database: ProductDatabase) {}

  public async create(identity: InternalIdentity): Promise<void> {
    try {
      await this.database.insert(identities).values({
        identityId: identity.internalIdentityId,
        lifecycle: identity.lifecycle,
        createdAt: identity.createdAt,
        updatedAt: identity.updatedAt,
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new InternalIdentityAlreadyExistsError(identity.internalIdentityId);
      }

      throw error;
    }
  }

  public async getById(identityId: InternalIdentityId): Promise<InternalIdentity | undefined> {
    const rows = await this.database
      .select()
      .from(identities)
      .where(eq(identities.identityId, identityId));
    const row = rows[0];
    return row === undefined ? undefined : rehydrateIdentityRow(row);
  }

  public async exists(identityId: InternalIdentityId): Promise<boolean> {
    return (await this.getById(identityId)) !== undefined;
  }

  public async updateLifecycle(input: {
    readonly identityId: InternalIdentityId;
    readonly expectedLifecycle: InternalIdentity['lifecycle'];
    readonly nextLifecycle: InternalIdentity['lifecycle'];
    readonly updatedAt: string;
  }): Promise<void> {
    const result = await this.database
      .update(identities)
      .set({ lifecycle: input.nextLifecycle, updatedAt: input.updatedAt })
      .where(
        and(
          eq(identities.identityId, input.identityId),
          eq(identities.lifecycle, input.expectedLifecycle),
        ),
      )
      .returning({ identityId: identities.identityId });

    if (result.length === 1) {
      return;
    }

    if ((await this.getById(input.identityId)) === undefined) {
      throw new InternalIdentityNotFoundError(input.identityId);
    }

    throw new InternalIdentityConcurrentUpdateError(input.identityId);
  }
}

export function rehydrateIdentityRow(row: {
  readonly identityId: string;
  readonly lifecycle: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}): InternalIdentity {
  return rehydrateInternalIdentity({
    internalIdentityId: createInternalIdentityId(row.identityId),
    lifecycle: row.lifecycle,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

function isUniqueViolation(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === '23505';
}
