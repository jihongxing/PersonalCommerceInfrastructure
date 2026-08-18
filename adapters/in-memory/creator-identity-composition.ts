import type { AuthContextProvider } from '../../applications/core/ports/auth-context-provider.js';
import {
  createCreatorIdentityService,
  type CreatorIdentityService,
} from '../../applications/creator-identity/creator-identity-service.js';
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
import { SequentialIdGenerator } from './sequential-id-generator.js';
import { InMemoryProductEventStore } from './in-memory-product-event-store.js';
import { InMemoryUnitOfWork } from './in-memory-unit-of-work.js';
import { StaticPublicOfferingUrlGenerator } from './public-offering-url-generator.js';
import { CanonicalEventRecorder } from '../../applications/core/canonical-event-recorder.js';
import { FixedClock } from './fixed-clock.js';
import { InMemoryCustomerRepository } from './in-memory-customer-repository.js';
import { InMemoryCommerceActionRepository } from './in-memory-commerce-action-repository.js';
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
  readonly service: CreatorIdentityService;
  readonly offeringService: ServiceOfferingService;
  readonly customerRequestService: CustomerRequestService;
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
  const paidCommerceRepository = new InMemoryPaidCommerceRepository();
  const reservationRepository = new InMemoryReservationRepository();
  const contractRepository = new InMemoryContractRepository();
  const productEventStore = new InMemoryProductEventStore();
  const unitOfWork = new InMemoryUnitOfWork(
    [
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
      idGenerator,
      canonicalEventRecorder,
      notificationPort: notificationAdapter,
      unitOfWork,
      contractRepository,
    }),
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
