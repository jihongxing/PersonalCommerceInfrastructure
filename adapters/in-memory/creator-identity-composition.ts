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

export interface CreatorIdentityComposition {
  readonly authContextProvider: AuthContextProvider;
  readonly service: CreatorIdentityService;
  readonly offeringService: ServiceOfferingService;
  readonly customerRequestService: CustomerRequestService;
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
  const productEventStore = new InMemoryProductEventStore();
  const unitOfWork = new InMemoryUnitOfWork(
    [
      identityRepository,
      capabilityRepository,
      offeringRepository,
      distributionAssetRepository,
      customerRepository,
      commerceActionRepository,
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
    },
  );
  const canonicalEventRecorder = new CanonicalEventRecorder({
    clock: new FixedClock('2026-08-12T00:00:00.000Z'),
    eventStore: productEventStore,
    idGenerator: new SequentialIdGenerator('event'),
  });
  const notificationAdapter = new InMemoryNotificationAdapter();
  const idGenerator = new SequentialIdGenerator('offering');
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
    }),
    notificationAdapter,
  };
}
