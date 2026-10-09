import type { AuthContextProvider } from '../../../applications/core/ports/auth-context-provider.js';
import type { NotificationPort } from '../../../applications/core/ports/notification-port.js';
import { createIdentityProfileAuthorizationPolicy } from '../../../applications/core/identity-profile-authorization-policy.js';
import { createIdentityProfileContextResolver } from '../../../applications/core/identity-profile-context.js';
import {
  createCreatorIdentityService,
  type CreatorIdentityService,
} from '../../../applications/creator-identity/creator-identity-service.js';
import {
  createAccountIdentityMembershipService,
  type AccountIdentityMembershipService,
} from '../../../applications/account-identity-membership/account-identity-membership-service.js';
import {
  createCurrentUserIdentityService,
  type CurrentUserIdentityService,
} from '../../../applications/account-identity-membership/current-user-identity-service.js';
import {
  createSelfServiceIdentityInitializationService,
  type SelfServiceIdentityInitializationService,
} from '../../../applications/account-identity-membership/self-service-identity-initialization-service.js';
import {
  createCommerceProfileService,
  type CommerceProfileService,
} from '../../../applications/commerce-profile/commerce-profile-service.js';
import { createCanonicalCommerceProfileService } from '../../../applications/canonical-commerce-profile/canonical-commerce-profile-service.js';
import { UuidCommerceProfileIdGenerator } from '../../../applications/canonical-commerce-profile/uuid-commerce-profile-id-generator.js';
import { CsprngCommerceReferenceGenerator } from '../../../applications/canonical-commerce-reference/commerce-reference-generator.js';
import type {
  CommerceRelationshipId,
  ExternalPlatformAccountId,
} from '../../../modules/identity-infrastructure/external-platform-contract.js';
import {
  createPrivateCommerceProfileService,
  type PrivateCommerceProfileService,
} from '../../../applications/private-commerce-profile/private-commerce-profile-service.js';
import {
  createPrivateCommerceReferenceService,
  type PrivateCommerceReferenceService,
} from '../../../applications/private-commerce-reference/private-commerce-reference-service.js';
import {
  createPrivateExternalPlatformAccountService,
  type PrivateExternalPlatformAccountService,
} from '../../../applications/private-external-platform-account/private-external-platform-account-service.js';
import {
  createPrivateCommerceRelationshipService,
  type PrivateCommerceRelationshipService,
} from '../../../applications/private-commerce-relationship/private-commerce-relationship-service.js';
import {
  createPrivateSelfDeclaredExternalRelationshipService,
  type PrivateSelfDeclaredExternalRelationshipService,
} from '../../../applications/private-external-platform-relationship/private-self-declared-external-relationship-service.js';
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
import { PostgresAccountIdentityMembershipRepository } from './postgres-account-identity-membership-repository.js';
import { PostgresCommerceProfileRepository } from './postgres-commerce-profile-repository.js';
import { PostgresCanonicalCommerceProfileRepository } from './postgres-canonical-commerce-profile-repository.js';
import { PostgresCanonicalCommerceReferenceRepository } from './postgres-canonical-commerce-reference-repository.js';
import { PostgresExternalPlatformAccountRepository } from './postgres-external-platform-account-repository.js';
import { PostgresCommerceRelationshipRepository } from './postgres-commerce-relationship-repository.js';
import { createPostgresDatabase, type PostgresDatabaseConnection } from './postgres-database.js';
import { PostgresIdentityRepository } from './postgres-identity-repository.js';
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
  const accountIdentityMembershipRepository = new PostgresAccountIdentityMembershipRepository(
    database.database,
  );
  const formalIdentityRepository = new PostgresIdentityRepository(database.database);
  const commerceProfileRepository = new PostgresCommerceProfileRepository(database.database);
  const canonicalCommerceProfileRepository = new PostgresCanonicalCommerceProfileRepository(
    database.database,
  );
  const canonicalCommerceReferenceRepository = new PostgresCanonicalCommerceReferenceRepository(
    database.database,
  );
  const externalPlatformAccountRepository = new PostgresExternalPlatformAccountRepository(
    database.database,
  );
  const commerceRelationshipRepository = new PostgresCommerceRelationshipRepository(
    database.database,
  );
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
  const accountIdentityMembershipService = createAccountIdentityMembershipService({
    membershipRepository: accountIdentityMembershipRepository,
    unitOfWork,
    identityIdGenerator: new UuidIdGenerator(),
    membershipIdGenerator: new UuidIdGenerator(),
    clock: new FixedClock(new Date().toISOString()),
  });
  const currentUserIdentityService = createCurrentUserIdentityService({
    identityRepository: formalIdentityRepository,
    membershipRepository: accountIdentityMembershipRepository,
  });
  const selfServiceIdentityInitializationService = createSelfServiceIdentityInitializationService({
    identityRepository: formalIdentityRepository,
    membershipRepository: accountIdentityMembershipRepository,
    unitOfWork,
    identityIdGenerator: new UuidIdGenerator(),
    membershipIdGenerator: new UuidIdGenerator(),
    clock: new FixedClock(new Date().toISOString()),
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
    commerceProfileIdGenerator: new UuidIdGenerator(),
    clock: new FixedClock(new Date().toISOString()),
  });
  const canonicalCommerceProfileService = createCanonicalCommerceProfileService({
    repository: canonicalCommerceProfileRepository,
    idGenerator: new UuidCommerceProfileIdGenerator(),
    clock: new FixedClock(new Date().toISOString()),
  });
  const privateCommerceProfileService = createPrivateCommerceProfileService({
    currentUserIdentityService,
    commerceProfileService: canonicalCommerceProfileService,
    commerceProfileIdGenerator: new UuidCommerceProfileIdGenerator(),
    commerceReferenceGenerator: new CsprngCommerceReferenceGenerator(),
    clock: new FixedClock(new Date().toISOString()),
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
        generate: () =>
          `external-account-${new UuidIdGenerator().generate()}` as ExternalPlatformAccountId,
      },
      commerceRelationshipIdGenerator: {
        generate: () =>
          `relationship-${new UuidIdGenerator().generate()}` as CommerceRelationshipId,
      },
      clock: new FixedClock(new Date().toISOString()),
    });
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
    accountIdentityMembershipService,
    currentUserIdentityService,
    selfServiceIdentityInitializationService,
    commerceProfileService,
    privateCommerceProfileService,
    privateCommerceReferenceService,
    privateExternalPlatformAccountService,
    privateCommerceRelationshipService,
    privateSelfDeclaredExternalRelationshipService,
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
