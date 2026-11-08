import { eq } from 'drizzle-orm';
import { commerceReferences } from '../../../database/schema/commerce-reference.js';
import { createCommerceReference } from '../../../modules/identity-infrastructure/commerce-reference-contract.js';
import type {
  CommerceReference,
  InternalIdentityId,
} from '../../../modules/identity-infrastructure/identity-contract.js';
import type { IdentityReferenceRepository } from '../../../applications/canonical-commerce-reference/identity-commerce-reference-service.js';
import type { ProductDatabase } from './postgres-database.js';

export class PostgresIdentityCommerceReferenceRepository implements IdentityReferenceRepository {
  constructor(private readonly database: ProductDatabase) {}

  async find(identityId: InternalIdentityId): Promise<CommerceReference | undefined> {
    const rows = await this.database
      .select({ value: commerceReferences.commerceReference })
      .from(commerceReferences)
      .where(eq(commerceReferences.identityId, identityId));
    return rows[0] === undefined ? undefined : createCommerceReference(rows[0].value);
  }

  async tryAssign(
    identityId: InternalIdentityId,
    reference: CommerceReference,
    assignedAt: string,
  ): Promise<boolean> {
    const rows = await this.database
      .insert(commerceReferences)
      .values({
        identityId,
        commerceReference: createCommerceReference(reference),
        assignedAt,
        createdAt: assignedAt,
        updatedAt: assignedAt,
      })
      .onConflictDoNothing()
      .returning({ value: commerceReferences.commerceReference });
    return rows.length === 1;
  }
}
