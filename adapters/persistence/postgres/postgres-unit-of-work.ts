import type { UnitOfWork, UnitOfWorkScope } from '../../../applications/core/ports/unit-of-work.js';
import { withTraceSpan } from '../../observability/tracing.js';

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
import { PostgresPaidCommerceRepository } from './postgres-paid-commerce-repository.js';
import { PostgresReservationRepository } from './postgres-reservation-repository.js';
import { PostgresContractRepository } from './postgres-contract-repository.js';
import { PostgresAccountIdentityMembershipRepository } from './postgres-account-identity-membership-repository.js';
import { PostgresIdentityRepository } from './postgres-identity-repository.js';
import { PostgresLegacySubjectMappingRepository } from './postgres-legacy-subject-mapping-repository.js';
import { PostgresCanonicalCommerceProfileRepository } from './postgres-canonical-commerce-profile-repository.js';
import { PostgresCanonicalCommerceReferenceRepository } from './postgres-canonical-commerce-reference-repository.js';
import { PostgresExternalPlatformAccountRepository } from './postgres-external-platform-account-repository.js';
import { PostgresCommerceRelationshipRepository } from './postgres-commerce-relationship-repository.js';
import { PostgresFulfillmentCodeRepository } from './postgres-fulfillment-code-repository.js';

export class PostgresUnitOfWork implements UnitOfWork {
  public constructor(private readonly database: ProductDatabase) {}

  public execute<Result>(operation: (scope: UnitOfWorkScope) => Promise<Result>): Promise<Result> {
    return withTraceSpan('postgres.transaction', () => this.database.transaction(async (transaction) =>
      operation({
        productEventStore: new PostgresProductEventStore(transaction),
        formalIdentityRepository: new PostgresIdentityRepository(transaction),
        commerceProfileRepository: new PostgresCanonicalCommerceProfileRepository(transaction),
        commerceReferenceRepository: new PostgresCanonicalCommerceReferenceRepository(transaction),
        externalPlatformAccountRepository: new PostgresExternalPlatformAccountRepository(transaction),
        commerceRelationshipRepository: new PostgresCommerceRelationshipRepository(transaction),
        legacySubjectMappingRepository: new PostgresLegacySubjectMappingRepository(transaction),
        accountIdentityMembershipRepository: new PostgresAccountIdentityMembershipRepository(
          transaction,
        ),
        identityRepository: new PostgresCommerceIdentityRepository(transaction),
        capabilityRepository: new PostgresCapabilityRepository(transaction),
        offeringRepository: new PostgresOfferingRepository(transaction),
        distributionAssetRepository: new PostgresDistributionAssetRepository(transaction),
        customerRepository: new PostgresCustomerRepository(transaction),
        commerceActionRepository: new PostgresCommerceActionRepository(transaction),
        fulfillmentCodeRepository: new PostgresFulfillmentCodeRepository(transaction),
        paidCommerceRepository: new PostgresPaidCommerceRepository(transaction),
        reservationRepository: new PostgresReservationRepository(transaction),
        contractRepository: new PostgresContractRepository(transaction),
        contractScopeVersionRepository: new PostgresContractRepository(transaction),
        contractAcceptanceFactRepository: new PostgresContractRepository(transaction),
      }),
    ));
  }
}
