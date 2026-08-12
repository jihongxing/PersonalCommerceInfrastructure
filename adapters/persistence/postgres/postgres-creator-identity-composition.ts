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

export interface CreatorIdentityDatabaseConfiguration {
  readonly databaseUrl: string;
}

export interface CreatorIdentityAuthConfiguration {
  readonly supabaseUrl: string;
  readonly supabaseAnonKey: string;
  readonly creatorActorMappings: ReadonlyMap<string, string>;
}

export interface PostgresCreatorIdentityComposition {
  readonly authContextProvider: AuthContextProvider;
  readonly service: CreatorIdentityService;
  readonly offeringService: ServiceOfferingService;
  readonly customerRequestService: CustomerRequestService;
  readonly database: PostgresDatabaseConnection;
}

export function createPostgresCreatorIdentityComposition(
  databaseConfiguration: CreatorIdentityDatabaseConfiguration,
  authConfiguration: CreatorIdentityAuthConfiguration,
  publicOrigin: string,
  notificationPort: NotificationPort,
): PostgresCreatorIdentityComposition {
  const database = createPostgresDatabase(databaseConfiguration.databaseUrl);
  const identityRepository = new PostgresCommerceIdentityRepository(database.database);
  const capabilityRepository = new PostgresCapabilityRepository(database.database);
  const offeringRepository = new PostgresOfferingRepository(database.database);
  const distributionAssetRepository = new PostgresDistributionAssetRepository(database.database);
  const customerRepository = new PostgresCustomerRepository(database.database);
  const commerceActionRepository = new PostgresCommerceActionRepository(database.database);
  const idGenerator = new UuidIdGenerator();
  const unitOfWork = new PostgresUnitOfWork(database.database);
  const canonicalEventRecorder = new CanonicalEventRecorder({
    clock: new FixedClock(new Date().toISOString()),
    eventStore: new PostgresProductEventStore(database.database),
    idGenerator: new UuidIdGenerator(),
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
    }),
  };
}
