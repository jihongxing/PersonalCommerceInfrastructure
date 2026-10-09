import type { ProductEventStore } from './product-event-store.js';
import type { AccountIdentityMembershipRepository } from '../../account-identity-membership/account-identity-membership-repositories.js';
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
import type { IdentityRepository } from '../../identity/identity-repositories.js';
import type { LegacySubjectMappingRepository } from '../../legacy-subject-mapping/legacy-subject-mapping-repositories.js';
import type { CommerceProfileRepository } from '../../../modules/identity-infrastructure/commerce-profile-repository.js';
import type { CommerceReferenceRepository } from '../../../modules/identity-infrastructure/commerce-reference-repository.js';
import type { ExternalPlatformAccountRepository } from '../../../modules/identity-infrastructure/external-platform-account-repository.js';
import type { CommerceRelationshipRepository } from '../../../modules/identity-infrastructure/commerce-relationship-repository.js';

export interface UnitOfWorkScope {
  readonly productEventStore: ProductEventStore;
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
}

export interface UnitOfWork {
  execute<Result>(operation: (scope: UnitOfWorkScope) => Promise<Result>): Promise<Result>;
}
