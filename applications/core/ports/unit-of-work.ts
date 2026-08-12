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

export interface UnitOfWorkScope {
  readonly productEventStore: ProductEventStore;
  readonly identityRepository?: CommerceIdentityRepository;
  readonly capabilityRepository?: CapabilityRepository;
  readonly offeringRepository?: OfferingRepository;
  readonly distributionAssetRepository?: DistributionAssetRepository;
  readonly customerRepository?: CustomerRepository;
  readonly commerceActionRepository?: CommerceActionRepository;
}

export interface UnitOfWork {
  execute<Result>(operation: (scope: UnitOfWorkScope) => Promise<Result>): Promise<Result>;
}
