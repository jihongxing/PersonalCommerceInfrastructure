import type { UnitOfWork, UnitOfWorkScope } from '../../applications/core/ports/unit-of-work.js';
import type { AccountIdentityMembershipRepository } from '../../applications/account-identity-membership/account-identity-membership-repositories.js';
import type { ProductEventStore } from '../../applications/core/ports/product-event-store.js';
import type { DistributionAssetRepository } from '../../applications/distribution/distribution-repositories.js';
import type {
  CapabilityRepository,
  CommerceIdentityRepository,
} from '../../applications/creator-identity/creator-identity-repositories.js';
import type { OfferingRepository } from '../../applications/service-offering/offering-repositories.js';
import type {
  CommerceActionRepository,
  CustomerRepository,
} from '../../applications/customer-request/customer-request-repositories.js';
import type { PaidCommerceRepository } from '../../applications/paid-commerce/paid-commerce-repositories.js';
import type { ReservationRepository } from '../../applications/reservation/reservation-repositories.js';
import type {
  ContractAcceptanceFactRepository,
  ContractRepository,
  ContractScopeVersionRepository,
} from '../../applications/contract-commerce/contract-repositories.js';
import type { IdentityRepository } from '../../applications/identity/identity-repositories.js';
import type { LegacySubjectMappingRepository } from '../../applications/legacy-subject-mapping/legacy-subject-mapping-repositories.js';
import type { CommerceProfileRepository } from '../../modules/identity-infrastructure/commerce-profile-repository.js';
import type { CommerceReferenceRepository } from '../../modules/identity-infrastructure/commerce-reference-repository.js';
import type { ExternalPlatformAccountRepository } from '../../modules/identity-infrastructure/external-platform-account-repository.js';
import type { CommerceRelationshipRepository } from '../../modules/identity-infrastructure/commerce-relationship-repository.js';

import type { TransactionParticipant } from './transaction-participant.js';

export class InMemoryUnitOfWork implements UnitOfWork {
  private transactionTail: Promise<void> = Promise.resolve();

  public constructor(
    private readonly participants: readonly TransactionParticipant[],
    private readonly productEventStore: ProductEventStore,
    private readonly repositories: {
      readonly formalIdentityRepository?: IdentityRepository;
      readonly commerceProfileRepository?: CommerceProfileRepository;
      readonly commerceReferenceRepository?: CommerceReferenceRepository;
      readonly externalPlatformAccountRepository?: ExternalPlatformAccountRepository;
      readonly commerceRelationshipRepository?: CommerceRelationshipRepository;
      readonly legacySubjectMappingRepository?: LegacySubjectMappingRepository;
      readonly accountIdentityMembershipRepository?: AccountIdentityMembershipRepository;
      readonly identityRepository?: CommerceIdentityRepository;
      readonly capabilityRepository?: CapabilityRepository;
      readonly offeringRepository?: OfferingRepository;
      readonly distributionAssetRepository?: DistributionAssetRepository;
      readonly customerRepository?: CustomerRepository;
      readonly commerceActionRepository?: CommerceActionRepository;
      readonly paidCommerceRepository?: PaidCommerceRepository;
      readonly reservationRepository?: ReservationRepository;
      readonly contractRepository?: ContractRepository;
      readonly contractScopeVersionRepository?: ContractScopeVersionRepository;
      readonly contractAcceptanceFactRepository?: ContractAcceptanceFactRepository;
    } = {},
  ) {}

  public async execute<Result>(
    operation: (scope: UnitOfWorkScope) => Promise<Result>,
  ): Promise<Result> {
    const previousTransaction = this.transactionTail;
    let releaseTransaction: () => void = () => undefined;
    this.transactionTail = new Promise<void>((resolve) => {
      releaseTransaction = resolve;
    });
    await previousTransaction;

    const snapshots = this.participants.map((participant) => participant.createSnapshot());
    const scope: UnitOfWorkScope = {
      productEventStore: this.productEventStore,
      ...this.repositories,
    };

    try {
      return await operation(scope);
    } catch (error) {
      this.participants.forEach((participant, index) => {
        participant.restoreSnapshot(snapshots[index]);
      });
      throw error;
    } finally {
      releaseTransaction();
    }
  }
}
