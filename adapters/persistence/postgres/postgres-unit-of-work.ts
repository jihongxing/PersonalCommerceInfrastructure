import type { UnitOfWork, UnitOfWorkScope } from '../../../applications/core/ports/unit-of-work.js';

import type { ProductDatabase } from './postgres-database.js';
import {
  PostgresCapabilityRepository,
  PostgresCommerceActionRepository,
  PostgresCommerceIdentityRepository,
  PostgresCustomerRepository,
  PostgresDistributionAssetRepository,
  PostgresOfferingRepository,
} from './postgres-creator-identity-repositories.js';
import { PostgresProductEventStore } from './postgres-product-event-store.js';

export class PostgresUnitOfWork implements UnitOfWork {
  public constructor(private readonly database: ProductDatabase) {}

  public execute<Result>(operation: (scope: UnitOfWorkScope) => Promise<Result>): Promise<Result> {
    return this.database.transaction(async (transaction) =>
      operation({
        productEventStore: new PostgresProductEventStore(transaction),
        identityRepository: new PostgresCommerceIdentityRepository(transaction),
        capabilityRepository: new PostgresCapabilityRepository(transaction),
        offeringRepository: new PostgresOfferingRepository(transaction),
        distributionAssetRepository: new PostgresDistributionAssetRepository(transaction),
        customerRepository: new PostgresCustomerRepository(transaction),
        commerceActionRepository: new PostgresCommerceActionRepository(transaction),
      }),
    );
  }
}
