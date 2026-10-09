import { eq } from 'drizzle-orm';

import {
  IdentityAlreadyExistsError,
  type IdentityRepository,
} from '../../../applications/identity/identity-repositories.js';
import type { Identity, IdentityLifecycle } from '../../../modules/identity/identity.js';
import { identities } from '../../../database/schema/identity.js';
import type { ProductDatabase } from './postgres-database.js';

export class PostgresIdentityRepository implements IdentityRepository {
  public constructor(private readonly database: ProductDatabase) {}

  public async create(identity: Identity): Promise<void> {
    try {
      await this.database.insert(identities).values({
        identityId: identity.identityId,
        lifecycle: identity.lifecycle,
        createdAt: identity.createdAt,
        updatedAt: identity.updatedAt,
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new IdentityAlreadyExistsError(identity.identityId);
      }
      throw error;
    }
  }

  public async findById(identityId: string): Promise<Identity | undefined> {
    const rows = await this.database
      .select()
      .from(identities)
      .where(eq(identities.identityId, identityId));
    const row = rows[0];
    return row === undefined
      ? undefined
      : {
          identityId: row.identityId,
          lifecycle: row.lifecycle as IdentityLifecycle,
          createdAt: new Date(row.createdAt).toISOString(),
          updatedAt: new Date(row.updatedAt).toISOString(),
        };
  }

  public async updateLifecycle(
    identityId: string,
    lifecycle: IdentityLifecycle,
    updatedAt: string,
  ): Promise<void> {
    await this.database
      .update(identities)
      .set({ lifecycle, updatedAt })
      .where(eq(identities.identityId, identityId));
  }
}

function isUniqueViolation(error: unknown): boolean {
  const databaseError =
    typeof error === 'object' && error !== null && 'cause' in error ? error.cause : error;
  return (
    typeof databaseError === 'object' &&
    databaseError !== null &&
    'code' in databaseError &&
    databaseError.code === '23505'
  );
}
