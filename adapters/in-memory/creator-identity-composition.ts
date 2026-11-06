import type { AuthContextProvider } from '../../applications/core/ports/auth-context-provider.js';
import { createIdentityProfileAuthorizationPolicy } from '../../applications/core/identity-profile-authorization-policy.js';
import { createIdentityProfileContextResolver } from '../../applications/core/identity-profile-context.js';
import {
  createCreatorIdentityService,
  type CreatorIdentityService,
} from '../../applications/creator-identity/creator-identity-service.js';
import {
  createAccountIdentityMembershipService,
  type AccountIdentityMembershipService,
} from '../../applications/account-identity-membership/account-identity-membership-service.js';
import {
  createCurrentUserIdentityService,
  type CurrentUserIdentityService,
} from '../../applications/account-identity-membership/current-user-identity-service.js';
import {
  createSelfServiceIdentityInitializationService,
  type SelfServiceIdentityInitializationService,
} from '../../applications/account-identity-membership/self-service-identity-initialization-service.js';
import {
  createCommerceProfileService,
  type CommerceProfileService,
} from '../../applications/commerce-profile/commerce-profile-service.js';
import { createCanonicalCommerceProfileService } from '../../applications/canonical-commerce-profile/canonical-commerce-profile-service.js';
import { UuidCommerceProfileIdGenerator } from '../../applications/canonical-commerce-profile/uuid-commerce-profile-id-generator.js';
import { CsprngCommerceReferenceGenerator } from '../../applications/canonical-commerce-reference/commerce-reference-generator.js';
import type {
  CommerceRelationshipId,
  ExternalPlatformAccountId,
} from '../../modules/identity-infrastructure/external-platform-contract.js';
import {
  createPrivateCommerceProfileService,
  type PrivateCommerceProfileService,
} from '../../applications/private-commerce-profile/private-commerce-profile-service.js';
import {
  createPrivateCommerceReferenceService,
  type PrivateCommerceReferenceService,
} from '../../applications/private-commerce-reference/private-commerce-reference-service.js';
import {
  createPrivateExternalPlatformAccountService,
  type PrivateExternalPlatformAccountService,
} from '../../applications/private-external-platform-account/private-external-platform-account-service.js';
import {
  createPrivateCommerceRelationshipService,
  type PrivateCommerceRelationshipService,
} from '../../applications/private-commerce-relationship/private-commerce-relationship-service.js';
import {
  createPrivateSelfDeclaredExternalRelationshipService,
  type PrivateSelfDeclaredExternalRelationshipService,
} from '../../applications/private-external-platform-relationship/private-self-declared-external-relationship-service.js';
import {
  createServiceOfferingService,
  type ServiceOfferingService,
} from '../../applications/service-offering/offering-service.js';
import {
  createCustomerRequestService,
  type CustomerRequestService,
} from '../../applications/customer-request/customer-request-service.js';
import type {
  Capability,
  CommerceIdentity,
} from '../../modules/creator-commerce-identity/commerce-identity.js';
import type { Offering } from '../../modules/service-offering/offering.js';
import type { DistributionAsset } from '../../modules/distribution/distribution-asset.js';
import { InMemoryAuthContextProvider } from '../auth/testing/in-memory-auth-context-provider.js';
import { InMemoryEntityCollectionRepository } from './in-memory-entity-collection-repository.js';
import { InMemoryIdentityRepository } from './in-memory-identity-repository.js';
import { InMemoryAccountIdentityMembershipRepository } from './in-memory-account-identity-membership-repository.js';
import { InMemoryCommerceProfileRepository } from './in-memory-commerce-profile-repository.js';
import { InMemoryCanonicalCommerceProfileRepository } from './in-memory-canonical-commerce-profile-repository.js';
import { InMemoryCanonicalCommerceReferenceRepository } from './in-memory-canonical-commerce-reference-repository.js';
import { InMemoryExternalPlatformAccountRepository } from './in-memory-external-platform-account-repository.js';
import { InMemoryCommerceRelationshipRepository } from './in-memory-commerce-relationship-repository.js';
import { SequentialIdGenerator } from './sequential-id-generator.js';
import { InMemoryProductEventStore } from './in-memory-product-event-store.js';
import { InMemoryUnitOfWork } from './in-memory-unit-of-work.js';
import { StaticPublicOfferingUrlGenerator } from './public-offering-url-generator.js';
import { CanonicalEventRecorder } from '../../applications/core/canonical-event-recorder.js';
import { FixedClock } from './fixed-clock.js';
import { InMemoryCustomerRepository } from './in-memory-customer-repository.js';
import { InMemoryCommerceActionRepository } from './in-memory-commerce-action-repository.js';
import { InMemoryFulfillmentCodeRepository } from './in-memory-fulfillment-code-repository.js';
import type { IQrCodeGenerator } from '../image-generation/qr-code-generator.js';
import { QrCodeGeneratorImpl } from '../image-generation/qr-code-generator.js';
import { InMemoryNotificationAdapter } from '../notifications/in-memory-notification-adapter.js';
import { RecordExternalObservationUseCase } from '../../applications/shadow-commerce/external-observation-use-cases.js';
import { StaticOperationsAuthContextProvider } from '../auth/operations/static-operations-auth-context-provider.js';
import type { OperationsAuthContextProvider } from '../../applications/core/ports/operations-auth-context-provider.js';
import {
  createPaidCommerceService,
  type PaidCommerceService,
} from '../../applications/paid-commerce/paid-commerce-service.js';
import { InMemoryPaidCommerceRepository } from './in-memory-paid-commerce-repository.js';
import { InMemoryProviderFactReceiptGuard } from './in-memory-provider-fact-receipt-guard.js';
import { InMemoryOperationsActionAuditStore } from './in-memory-operations-action-audit-store.js';
import { CommercialPilotOperationsService } from '../../applications/paid-commerce/commercial-pilot-operations.js';
import { LocalCommercialPilotOperationsActionExecutor } from '../../applications/paid-commerce/local-commercial-pilot-operations-action-executor.js';
import { InMemoryProviderWebhookReceiptStore } from './in-memory-provider-webhook-receipt-store.js';
import { ProviderFactApplicationPolicy } from '../../applications/paid-commerce/provider-fact-application-policy.js';
import {
  ProviderWebhookRuntime,
  RejectingProviderEventNormalizer,
  RejectingProviderWebhookSignatureVerifier,
} from '../../applications/paid-commerce/provider-webhook-runtime.js';
import { RealMoneyActivationGuard } from '../../applications/paid-commerce/real-money-activation-guard.js';
import {
  createLocalCommerceSimulationService,
  type LocalCommerceSimulationService,
} from '../../applications/paid-commerce/local-commerce-simulation-service.js';
import { LocalCommerceSimulator } from '../providers/local-commerce-simulator/local-commerce-simulator.js';
import {
  createLocalPaidCommerceProductService,
  type LocalPaidCommerceProductService,
} from '../../applications/paid-commerce/local-paid-commerce-product-service.js';
import {
  createReservationService,
  type ReservationService,
} from '../../applications/reservation/reservation-service.js';
import { InMemoryReservationRepository } from './in-memory-reservation-repository.js';
import {
  createContractService,
  type ContractService,
} from '../../applications/contract-commerce/contract-service.js';
import { InMemoryContractRepository } from './in-memory-contract-repository.js';

export interface CreatorIdentityComposition {
  readonly authContextProvider: AuthContextProvider;
  readonly accountIdentityMembershipService: AccountIdentityMembershipService;
  readonly currentUserIdentityService: CurrentUserIdentityService;
  readonly selfServiceIdentityInitializationService: SelfServiceIdentityInitializationService;
  readonly commerceProfileService: CommerceProfileService;
  readonly privateCommerceProfileService: PrivateCommerceProfileService;
  readonly privateCommerceReferenceService: PrivateCommerceReferenceService;
  readonly privateExternalPlatformAccountService: PrivateExternalPlatformAccountService;
  readonly privateCommerceRelationshipService: PrivateCommerceRelationshipService;
  readonly privateSelfDeclaredExternalRelationshipService: PrivateSelfDeclaredExternalRelationshipService;
  readonly service: CreatorIdentityService;
  readonly offeringService: ServiceOfferingService;
  readonly customerRequestService: CustomerRequestService;
  readonly qrCodeGenerator: IQrCodeGenerator;
  readonly operationsAuthContextProvider: OperationsAuthContextProvider;
  readonly recordExternalObservation: RecordExternalObservationUseCase;
  readonly paidCommerceService: PaidCommerceService;
  readonly localCommerceSimulationService: LocalCommerceSimulationService;
  readonly localPaidCommerceProductService: LocalPaidCommerceProductService;
  readonly reservationService: ReservationService;
  readonly contractService: ContractService;
  readonly commercialPilotOperationsService: CommercialPilotOperationsService;
  readonly providerWebhookRuntime: ProviderWebhookRuntime;
  readonly notificationAdapter: InMemoryNotificationAdapter;
}

export function createInMemoryCreatorIdentityComposition(
  publicOrigin = 'http://127.0.0.1:3001',
): CreatorIdentityComposition {
  const formalIdentityRepository = new InMemoryIdentityRepository();
  const accountIdentityMembershipRepository = new InMemoryAccountIdentityMembershipRepository();
  const commerceProfileRepository = new InMemoryCommerceProfileRepository();
  const canonicalCommerceProfileRepository = new InMemoryCanonicalCommerceProfileRepository({
    exists: async (identityId) =>
      (await formalIdentityRepository.findById(identityId)) !== undefined,
  });
  const canonicalCommerceReferenceRepository = new InMemoryCanonicalCommerceReferenceRepository(
    canonicalCommerceProfileRepository,
  );
  const externalPlatformAccountRepository = new InMemoryExternalPlatformAccountRepository();
  const commerceRelationshipRepository = new InMemoryCommerceRelationshipRepository(
    externalPlatformAccountRepository,
    canonicalCommerceProfileRepository,
  );
  const identityRepository = new InMemoryEntityCollectionRepository<CommerceIdentity>(
    (identity) => identity.creatorId,
    (identity) => identity.creatorId,
  );
  const capabilityRepository = new InMemoryEntityCollectionRepository<Capability>(
    (capability) => capability.id,
    (capability) => capability.creatorId,
  );
  const offeringRepository = new InMemoryEntityCollectionRepository<Offering>(
    (offering) => offering.id,
    (offering) => offering.creatorId,
  );
  const distributionAssetRepository = new InMemoryEntityCollectionRepository<DistributionAsset>(
    (asset) => asset.offeringId,
    (asset) => asset.offeringId,
  );
  const customerRepository = new InMemoryCustomerRepository();
  const commerceActionRepository = new InMemoryCommerceActionRepository();
  const fulfillmentCodeRepository = new InMemoryFulfillmentCodeRepository();
  const paidCommerceRepository = new InMemoryPaidCommerceRepository();
  const reservationRepository = new InMemoryReservationRepository();
  const contractRepository = new InMemoryContractRepository();
  const productEventStore = new InMemoryProductEventStore();
  const unitOfWork = new InMemoryUnitOfWork(
    [
      formalIdentityRepository,
      accountIdentityMembershipRepository,
      commerceProfileRepository,
      canonicalCommerceProfileRepository,
      canonicalCommerceReferenceRepository,
      externalPlatformAccountRepository,
      commerceRelationshipRepository,
      identityRepository,
      capabilityRepository,
      offeringRepository,
      distributionAssetRepository,
      customerRepository,
      commerceActionRepository,
      paidCommerceRepository,
      reservationRepository,
      contractRepository,
      productEventStore,
    ],
    productEventStore,
    {
      formalIdentityRepository,
      accountIdentityMembershipRepository,
      commerceProfileRepository: canonicalCommerceProfileRepository,
      commerceReferenceRepository: canonicalCommerceReferenceRepository,
      externalPlatformAccountRepository,
      commerceRelationshipRepository,
      identityRepository,
      capabilityRepository,
      offeringRepository,
      distributionAssetRepository,
      customerRepository,
      commerceActionRepository,
      paidCommerceRepository,
      reservationRepository,
      contractRepository,
      contractScopeVersionRepository: contractRepository,
      contractAcceptanceFactRepository: contractRepository,
    },
  );
  const canonicalEventRecorder = new CanonicalEventRecorder({
    clock: new FixedClock('2026-08-12T00:00:00.000Z'),
    eventStore: productEventStore,
    idGenerator: new SequentialIdGenerator('event'),
  });
  const accountIdentityMembershipService = createAccountIdentityMembershipService({
    membershipRepository: accountIdentityMembershipRepository,
    unitOfWork,
    identityIdGenerator: new SequentialIdGenerator('identity'),
    membershipIdGenerator: new SequentialIdGenerator('membership'),
    clock: new FixedClock('2026-08-12T00:00:00.000Z'),
  });
  const currentUserIdentityService = createCurrentUserIdentityService({
    identityRepository: formalIdentityRepository,
    membershipRepository: accountIdentityMembershipRepository,
  });
  const selfServiceIdentityInitializationService = createSelfServiceIdentityInitializationService({
    identityRepository: formalIdentityRepository,
    membershipRepository: accountIdentityMembershipRepository,
    unitOfWork,
    identityIdGenerator: new SequentialIdGenerator('identity'),
    membershipIdGenerator: new SequentialIdGenerator('membership'),
    clock: new FixedClock('2026-08-12T00:00:00.000Z'),
  });
  const identityProfileAuthorizationPolicy = createIdentityProfileAuthorizationPolicy({
    contextResolver: createIdentityProfileContextResolver({
      identityRepository: formalIdentityRepository,
      commerceProfileRepository,
      accountIdentityMembershipRepository,
    }),
  });
  const commerceProfileService = createCommerceProfileService({
    commerceProfileRepository,
    authorizationPolicy: identityProfileAuthorizationPolicy,
    commerceProfileIdGenerator: new SequentialIdGenerator('commerce-profile'),
    clock: new FixedClock('2026-08-12T00:00:00.000Z'),
  });
  const canonicalCommerceProfileService = createCanonicalCommerceProfileService({
    repository: canonicalCommerceProfileRepository,
    idGenerator: new UuidCommerceProfileIdGenerator(),
    clock: new FixedClock('2026-08-12T00:00:00.000Z'),
  });
  const privateCommerceProfileService = createPrivateCommerceProfileService({
    currentUserIdentityService,
    commerceProfileService: canonicalCommerceProfileService,
    commerceProfileIdGenerator: new UuidCommerceProfileIdGenerator(),
    commerceReferenceGenerator: new CsprngCommerceReferenceGenerator(),
    clock: new FixedClock('2026-08-12T00:00:00.000Z'),
    unitOfWork,
  });
  const privateCommerceReferenceService = createPrivateCommerceReferenceService({
    currentUserIdentityService,
    commerceProfileService: canonicalCommerceProfileService,
    commerceReferenceRepository: canonicalCommerceReferenceRepository,
  });
  const privateExternalPlatformAccountService = createPrivateExternalPlatformAccountService({
    currentUserIdentityService,
    commerceProfileService: canonicalCommerceProfileService,
    commerceRelationshipRepository,
    externalPlatformAccountRepository,
  });
  const privateCommerceRelationshipService = createPrivateCommerceRelationshipService({
    currentUserIdentityService,
    commerceProfileService: canonicalCommerceProfileService,
    commerceRelationshipRepository,
    externalPlatformAccountRepository,
  });
  const privateSelfDeclaredExternalRelationshipService =
    createPrivateSelfDeclaredExternalRelationshipService({
      currentUserIdentityService,
      commerceProfileService: canonicalCommerceProfileService,
      unitOfWork,
      externalPlatformAccountIdGenerator: {
        generate: () => `external-account-${crypto.randomUUID()}` as ExternalPlatformAccountId,
      },
      commerceRelationshipIdGenerator: {
        generate: () => `relationship-${crypto.randomUUID()}` as CommerceRelationshipId,
      },
      clock: new FixedClock('2026-08-12T00:00:00.000Z'),
    });
  const notificationAdapter = new InMemoryNotificationAdapter();
  const idGenerator = new SequentialIdGenerator('offering');
  const paidCommerceService = createPaidCommerceService({
    commerceActionRepository,
    offeringRepository,
    paidCommerceRepository,
    idGenerator: new SequentialIdGenerator('paid-commerce'),
    clock: new FixedClock('2026-08-12T00:00:00.000Z'),
    canonicalEventRecorder,
    unitOfWork,
    contractRepository,
  });
  const providerFactReceiptGuard = new InMemoryProviderFactReceiptGuard();
  const providerFactApplicationPolicy = new ProviderFactApplicationPolicy({
    paidCommerceService,
    paidCommerceRepository,
    receiptGuard: providerFactReceiptGuard,
  });
  const localCommerceSimulationService = createLocalCommerceSimulationService({
    simulator: new LocalCommerceSimulator('test', () => '2026-08-16T00:00:00.000Z'),
    applicationPolicy: providerFactApplicationPolicy,
    paidCommerceService,
  });
  const localPaidCommerceProductService = createLocalPaidCommerceProductService({
    commerceIdentityRepository: identityRepository,
    commerceActionRepository,
    customerRepository,
    paidCommerceRepository,
    paidCommerceService,
    simulationService: localCommerceSimulationService,
    reservationRepository,
    contractRepository,
  });
  const reservationService = createReservationService({
    offeringRepository,
    customerRepository,
    reservationRepository,
    paidCommerceRepository,
    idGenerator: new SequentialIdGenerator('reservation'),
    clock: new FixedClock('2026-08-12T00:00:00.000Z'),
    holdTtlMilliseconds: 15 * 60 * 1_000,
    canonicalEventRecorder,
    unitOfWork,
  });
  const contractService = createContractService({
    contractRepository,
    scopeVersionRepository: contractRepository,
    acceptanceFactRepository: contractRepository,
    commerceActionRepository,
    offeringRepository,
    paidCommerceRepository,
    idGenerator: new SequentialIdGenerator('contract'),
    clock: new FixedClock('2026-08-12T00:00:00.000Z'),
    canonicalEventRecorder,
    unitOfWork,
  });
  const commercialPilotOperationsService = new CommercialPilotOperationsService({
    repository: paidCommerceRepository,
    evidenceSources: {
      listCanonicalEvents: () => productEventStore.list(),
      listProviderFacts: () => providerFactReceiptGuard.listObservations(),
    },
    auditStore: new InMemoryOperationsActionAuditStore(),
    actionExecutor: new LocalCommercialPilotOperationsActionExecutor({
      repository: paidCommerceRepository,
      paidCommerceService,
      simulationService: localCommerceSimulationService,
    }),
    now: () => new Date().toISOString(),
    generateId: () => `operations-audit-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  });
  return {
    accountIdentityMembershipService,
    currentUserIdentityService,
    selfServiceIdentityInitializationService,
    commerceProfileService,
    privateCommerceProfileService,
    privateCommerceReferenceService,
    privateExternalPlatformAccountService,
    privateCommerceRelationshipService,
    privateSelfDeclaredExternalRelationshipService,
    authContextProvider: new InMemoryAuthContextProvider([
      {
        accessToken: 'test-creator-token',
        actor: { kind: 'creator', creatorId: 'creator-test-1' },
      },
      {
        accessToken: 'test-other-creator-token',
        actor: { kind: 'creator', creatorId: 'creator-test-2' },
      },
    ]),
    service: createCreatorIdentityService({
      identityRepository,
      capabilityRepository,
      idGenerator: new SequentialIdGenerator('capability'),
    }),
    offeringService: createServiceOfferingService({
      identityRepository,
      capabilityRepository,
      offeringRepository,
      idGenerator,
      distributionAssetRepository,
      publicOfferingUrlGenerator: new StaticPublicOfferingUrlGenerator(publicOrigin),
      canonicalEventRecorder,
      unitOfWork,
    }),
    customerRequestService: createCustomerRequestService({
      identityRepository,
      capabilityRepository,
      offeringRepository,
      customerRepository,
      commerceActionRepository,
      fulfillmentCodeRepository,
      idGenerator,
      canonicalEventRecorder,
      notificationPort: notificationAdapter,
      unitOfWork,
      contractRepository,
    }),
    qrCodeGenerator: new QrCodeGeneratorImpl(),
    operationsAuthContextProvider: new StaticOperationsAuthContextProvider({
      accessToken: 'test-operations-token',
      operatorId: 'pilot-operator-test-1',
    }),
    recordExternalObservation: new RecordExternalObservationUseCase({
      commerceActionRepository,
      canonicalEventRecorder,
      productEventStore,
    }),
    paidCommerceService,
    localCommerceSimulationService,
    localPaidCommerceProductService,
    reservationService,
    contractService,
    commercialPilotOperationsService,
    providerWebhookRuntime: new ProviderWebhookRuntime({
      signatureVerifier: new RejectingProviderWebhookSignatureVerifier(),
      normalizer: new RejectingProviderEventNormalizer(),
      receiptStore: new InMemoryProviderWebhookReceiptStore(),
      applicationPolicy: providerFactApplicationPolicy,
      activationGuard: new RealMoneyActivationGuard({
        runtimeEnvironment: 'test',
        realMoneyEnabled: false,
        liveProviderConfigured: false,
      }),
    }),
    notificationAdapter,
  };
}
