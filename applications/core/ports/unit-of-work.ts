import type { ProductEventStore } from './product-event-store.js';
import type {
  CapabilityRepository,
  CommerceIdentityRepository,
} from '../../creator-identity/creator-identity-repositories.js';
import type { OfferingRepository } from '../../service-offering/offering-repositories.js';
import type { DistributionAssetRepository } from '../../distribution/distribution-repositories.js';
import type {
  CommerceActionRepository,
  CustomerRepository,
} from '../../customer-request/customer-request-repositories.js';
import type { PaidCommerceRepository } from '../../paid-commerce/paid-commerce-repositories.js';
import type { ReservationRepository } from '../../reservation/reservation-repositories.js';
import type {
  ContractAcceptanceFactRepository,
  ContractRepository,
  ContractScopeVersionRepository,
} from '../../contract-commerce/contract-repositories.js';

export interface UnitOfWorkScope {
  readonly productEventStore: ProductEventStore;
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
}

export interface UnitOfWork {
  execute<Result>(operation: (scope: UnitOfWorkScope) => Promise<Result>): Promise<Result>;
}
