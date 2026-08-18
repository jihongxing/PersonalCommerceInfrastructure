import type { AuthContextProvider } from '../../../applications/core/ports/auth-context-provider.js';
import type { NotificationPort } from '../../../applications/core/ports/notification-port.js';
import {
  createCreatorIdentityService,
  type CreatorIdentityService,
} from '../../../applications/creator-identity/creator-identity-service.js';
import {
  createServiceOfferingService,
  type ServiceOfferingService,
} from '../../../applications/service-offering/offering-service.js';
import {
  createCustomerRequestService,
  type CustomerRequestService,
} from '../../../applications/customer-request/customer-request-service.js';
import { createSupabaseAuthContextProvider } from '../../auth/supabase/supabase-auth-context-provider.js';
import { InMemoryCreatorActorResolver } from '../../auth/testing/creator-actor-resolver.js';
import { UuidIdGenerator } from '../../system/uuid-id-generator.js';
import {
  PostgresCapabilityRepository,
  PostgresCommerceActionRepository,
  PostgresCommerceIdentityRepository,
  PostgresCustomerRepository,
  PostgresDistributionAssetRepository,
  PostgresOfferingRepository,
} from './postgres-creator-identity-repositories.js';
import { createPostgresDatabase, type PostgresDatabaseConnection } from './postgres-database.js';
import { PostgresUnitOfWork } from './postgres-unit-of-work.js';
import { PostgresProductEventStore } from './postgres-product-event-store.js';
import { CanonicalEventRecorder } from '../../../applications/core/canonical-event-recorder.js';
import { FixedClock } from '../../in-memory/fixed-clock.js';
import { StaticPublicOfferingUrlGenerator } from '../../in-memory/public-offering-url-generator.js';
import { RecordExternalObservationUseCase } from '../../../applications/shadow-commerce/external-observation-use-cases.js';
import { StaticOperationsAuthContextProvider } from '../../auth/operations/static-operations-auth-context-provider.js';
import type { OperationsAuthContextProvider } from '../../../applications/core/ports/operations-auth-context-provider.js';
import {
  createPaidCommerceService,
  type PaidCommerceService,
} from '../../../applications/paid-commerce/paid-commerce-service.js';
import { PostgresPaidCommerceRepository } from './postgres-paid-commerce-repository.js';
import { PostgresProviderFactReceiptGuard } from './postgres-provider-fact-receipt-guard.js';
import { PostgresProviderWebhookReceiptStore } from './postgres-provider-webhook-receipt-store.js';
import { ProviderFactApplicationPolicy } from '../../../applications/paid-commerce/provider-fact-application-policy.js';
import {
  createLocalCommerceSimulationService,
  type LocalCommerceSimulationService,
} from '../../../applications/paid-commerce/local-commerce-simulation-service.js';
import { LocalCommerceSimulator } from '../../providers/local-commerce-simulator/local-commerce-simulator.js';
import {
  createLocalPaidCommerceProductService,
  type LocalPaidCommerceProductService,
} from '../../../applications/paid-commerce/local-paid-commerce-product-service.js';
import {
  ProviderWebhookRuntime,
  RejectingProviderEventNormalizer,
  RejectingProviderWebhookSignatureVerifier,
} from '../../../applications/paid-commerce/provider-webhook-runtime.js';
import { RealMoneyActivationGuard } from '../../../applications/paid-commerce/real-money-activation-guard.js';
import { CommercialPilotOperationsService } from '../../../applications/paid-commerce/commercial-pilot-operations.js';
import { PostgresOperationsActionAuditStore } from './postgres-operations-action-audit-store.js';
import { LocalCommercialPilotOperationsActionExecutor } from '../../../applications/paid-commerce/local-commercial-pilot-operations-action-executor.js';
import {
  createReservationService,
  type ReservationService,
} from '../../../applications/reservation/reservation-service.js';
import { PostgresReservationRepository } from './postgres-reservation-repository.js';
import { PostgresContractRepository } from './postgres-contract-repository.js';
import {
  createContractService,
  type ContractService,
} from '../../../applications/contract-commerce/contract-service.js';

export interface CreatorIdentityDatabaseConfiguration {
  readonly databaseUrl: string;
}

export interface CreatorIdentityAuthConfiguration {
  readonly supabaseUrl: string;
  readonly supabaseAnonKey: string;
  readonly creatorActorMappings: ReadonlyMap<string, string>;
}

export interface OperationsConfiguration {
  readonly operationsAccessToken: string;
  readonly operationsOperatorId: string;
}

export interface RealMoneyRuntimeCompositionConfiguration {
  readonly runtimeEnvironment: 'local' | 'test' | 'controlled' | 'production';
  readonly realMoneyEnabled: boolean;
  readonly founderActivationReference?: string;
  readonly liveProviderConfigured: boolean;
}

export interface PostgresCreatorIdentityComposition {
  readonly authContextProvider: AuthContextProvider;
  readonly service: CreatorIdentityService;
  readonly offeringService: ServiceOfferingService;
  readonly customerRequestService: CustomerRequestService;
  readonly operationsAuthContextProvider: OperationsAuthContextProvider;
  readonly recordExternalObservation: RecordExternalObservationUseCase;
  readonly paidCommerceService: PaidCommerceService;
  readonly localCommerceSimulationService?: LocalCommerceSimulationService;
  readonly localPaidCommerceProductService?: LocalPaidCommerceProductService;
  readonly commercialPilotOperationsService: CommercialPilotOperationsService;
  readonly reservationService: ReservationService;
  readonly contractService: ContractService;
  readonly providerWebhookRuntime: ProviderWebhookRuntime;
  readonly database: PostgresDatabaseConnection;
}

export function createPostgresCreatorIdentityComposition(
  databaseConfiguration: CreatorIdentityDatabaseConfiguration,
  authConfiguration: CreatorIdentityAuthConfiguration,
  publicOrigin: string,
  notificationPort: NotificationPort,
  operationsConfiguration: OperationsConfiguration,
  realMoneyRuntimeConfiguration: RealMoneyRuntimeCompositionConfiguration = {
    runtimeEnvironment: 'local',
    realMoneyEnabled: false,
    liveProviderConfigured: false,
  },
): PostgresCreatorIdentityComposition {
  const database = createPostgresDatabase(databaseConfiguration.databaseUrl);
  const identityRepository = new PostgresCommerceIdentityRepository(database.database);
  const capabilityRepository = new PostgresCapabilityRepository(database.database);
  const offeringRepository = new PostgresOfferingRepository(database.database);
  const distributionAssetRepository = new PostgresDistributionAssetRepository(database.database);
  const customerRepository = new PostgresCustomerRepository(database.database);
  const commerceActionRepository = new PostgresCommerceActionRepository(database.database);
  const paidCommerceRepository = new PostgresPaidCommerceRepository(database.database);
  const reservationRepository = new PostgresReservationRepository(database.database);
  const contractRepository = new PostgresContractRepository(database.database);
  const idGenerator = new UuidIdGenerator();
  const unitOfWork = new PostgresUnitOfWork(database.database);
  const productEventStore = new PostgresProductEventStore(database.database);
  const canonicalEventRecorder = new CanonicalEventRecorder({
    clock: new FixedClock(new Date().toISOString()),
    eventStore: productEventStore,
    idGenerator: new UuidIdGenerator(),
  });
  const paidCommerceService = createPaidCommerceService({
    commerceActionRepository,
    offeringRepository,
    paidCommerceRepository,
    idGenerator,
    clock: new FixedClock(new Date().toISOString()),
    canonicalEventRecorder,
    unitOfWork,
    contractRepository,
  });
  const providerFactReceiptGuard = new PostgresProviderFactReceiptGuard(database.database);
  const providerFactApplicationPolicy = new ProviderFactApplicationPolicy({
    paidCommerceService,
    paidCommerceRepository,
    receiptGuard: providerFactReceiptGuard,
  });
  const localCommerceSimulationService =
    realMoneyRuntimeConfiguration.runtimeEnvironment === 'production'
      ? undefined
      : createLocalCommerceSimulationService({
          simulator: new LocalCommerceSimulator(
            realMoneyRuntimeConfiguration.runtimeEnvironment === 'test'
              ? 'test'
              : realMoneyRuntimeConfiguration.runtimeEnvironment,
          ),
          applicationPolicy: providerFactApplicationPolicy,
          paidCommerceService,
        });
  const localPaidCommerceProductService =
    localCommerceSimulationService === undefined
      ? undefined
      : createLocalPaidCommerceProductService({
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
    idGenerator,
    clock: new FixedClock(new Date().toISOString()),
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
    idGenerator,
    clock: new FixedClock(new Date().toISOString()),
    canonicalEventRecorder,
    unitOfWork,
  });
  const commercialPilotOperationsService = new CommercialPilotOperationsService({
    repository: paidCommerceRepository,
    evidenceSources: {
      listCanonicalEvents: () => productEventStore.list(),
      listProviderFacts: () => providerFactReceiptGuard.listObservations(),
    },
    auditStore: new PostgresOperationsActionAuditStore(database.database),
    ...(localCommerceSimulationService === undefined
      ? {}
      : {
          actionExecutor: new LocalCommercialPilotOperationsActionExecutor({
            repository: paidCommerceRepository,
            paidCommerceService,
            simulationService: localCommerceSimulationService,
          }),
        }),
    now: () => new Date().toISOString(),
    generateId: () => new UuidIdGenerator().generate(),
  });

  return {
    database,
    authContextProvider: createSupabaseAuthContextProvider(
      authConfiguration,
      new InMemoryCreatorActorResolver(authConfiguration.creatorActorMappings),
    ),
    service: createCreatorIdentityService({
      identityRepository,
      capabilityRepository,
      idGenerator,
      unitOfWork,
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
      notificationPort,
      unitOfWork,
      contractRepository,
    }),
    operationsAuthContextProvider: new StaticOperationsAuthContextProvider({
      accessToken: operationsConfiguration.operationsAccessToken,
      operatorId: operationsConfiguration.operationsOperatorId,
    }),
    recordExternalObservation: new RecordExternalObservationUseCase({
      commerceActionRepository,
      canonicalEventRecorder,
      productEventStore,
    }),
    paidCommerceService,
    ...(localCommerceSimulationService === undefined ? {} : { localCommerceSimulationService }),
    ...(localPaidCommerceProductService === undefined ? {} : { localPaidCommerceProductService }),
    commercialPilotOperationsService,
    reservationService,
    contractService,
    providerWebhookRuntime: new ProviderWebhookRuntime({
      signatureVerifier: new RejectingProviderWebhookSignatureVerifier(),
      normalizer: new RejectingProviderEventNormalizer(),
      receiptStore: new PostgresProviderWebhookReceiptStore(database.database),
      applicationPolicy: providerFactApplicationPolicy,
      activationGuard: new RealMoneyActivationGuard(realMoneyRuntimeConfiguration),
    }),
  };
}
