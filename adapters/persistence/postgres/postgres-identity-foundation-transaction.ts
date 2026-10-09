import type {
  IdentityFoundationTransaction,
  IdentityFoundationTransactionScope,
} from '../../../applications/identity-foundation/identity-foundation-transaction.js';
import { PostgresCanonicalCommerceProfileRepository } from './postgres-canonical-commerce-profile-repository.js';
import { PostgresCanonicalCommerceReferenceRepository } from './postgres-canonical-commerce-reference-repository.js';
import { PostgresCommerceRelationshipRepository } from './postgres-commerce-relationship-repository.js';
import type { ProductDatabase } from './postgres-database.js';

export class PostgresIdentityFoundationTransaction implements IdentityFoundationTransaction {
  public constructor(private readonly database: ProductDatabase) {}

  public execute<Result>(
    operation: (scope: IdentityFoundationTransactionScope) => Promise<Result>,
  ): Promise<Result> {
    return this.database.transaction((transaction) =>
      operation({
        commerceProfileRepository: new PostgresCanonicalCommerceProfileRepository(transaction),
        commerceReferenceRepository: new PostgresCanonicalCommerceReferenceRepository(transaction),
        commerceRelationshipRepository: new PostgresCommerceRelationshipRepository(transaction),
      }),
    );
  }
}
