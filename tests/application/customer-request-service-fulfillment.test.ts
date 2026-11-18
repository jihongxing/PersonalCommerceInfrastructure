import { describe, expect, it } from 'vitest';

import { createActorContext } from '../../applications/core/actor-context.js';
import { CanonicalEventRecorder } from '../../applications/core/canonical-event-recorder.js';
import { createCustomerRequestService } from '../../applications/customer-request/customer-request-service.js';
import { InMemoryCommerceActionRepository } from '../../adapters/in-memory/in-memory-commerce-action-repository.js';
import { InMemoryCustomerRepository } from '../../adapters/in-memory/in-memory-customer-repository.js';
import { InMemoryEntityCollectionRepository } from '../../adapters/in-memory/in-memory-entity-collection-repository.js';
import { InMemoryFulfillmentCodeRepository } from '../../adapters/in-memory/in-memory-fulfillment-code-repository.js';
import { InMemoryNotificationAdapter } from '../../adapters/notifications/in-memory-notification-adapter.js';
import { InMemoryProductEventStore } from '../../adapters/in-memory/in-memory-product-event-store.js';
import { InMemoryServicePolicyCatalogRepository } from '../../adapters/in-memory/in-memory-service-policy-catalog-repository.js';
import { InMemoryUnitOfWork } from '../../adapters/in-memory/in-memory-unit-of-work.js';
import { FixedClock } from '../../adapters/in-memory/fixed-clock.js';
import { SequentialIdGenerator } from '../../adapters/in-memory/sequential-id-generator.js';
import { initialServicePolicyCatalog } from '../../modules/service-policy/catalog-seed.js';
import { FulfillmentCode } from '../../domain/fulfillment-code.js';
import type {
  Capability,
  CommerceIdentity,
} from '../../modules/creator-commerce-identity/commerce-identity.js';
import type { Offering } from '../../modules/service-offering/offering.js';

class FailingCommerceActionRepository extends InMemoryCommerceActionRepository {
  public override updateFulfillmentStatus(): Promise<void> {
    return Promise.reject(new Error('simulated action update failure'));
  }
}

function createFixture(actionRepository: InMemoryCommerceActionRepository) {
  const productEventStore = new InMemoryProductEventStore();
  const fulfillmentCodeRepository = new InMemoryFulfillmentCodeRepository();
  const unitOfWork = new InMemoryUnitOfWork(
    [actionRepository, fulfillmentCodeRepository, productEventStore],
    productEventStore,
    { commerceActionRepository: actionRepository, fulfillmentCodeRepository },
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

  return {
    service: createCustomerRequestService({
      identityRepository,
      capabilityRepository,
      offeringRepository,
      customerRepository: new InMemoryCustomerRepository(),
      // This outer repository is intentionally empty. The service must use the
      // repositories supplied by the UoW scope for the fulfillment operation.
      commerceActionRepository: new InMemoryCommerceActionRepository(),
      fulfillmentCodeRepository: new InMemoryFulfillmentCodeRepository(),
      idGenerator: new SequentialIdGenerator('test'),
      canonicalEventRecorder: new CanonicalEventRecorder({
        clock: new FixedClock('2026-11-18T00:00:00.000Z'),
        eventStore: productEventStore,
        idGenerator: new SequentialIdGenerator('event'),
      }),
      notificationPort: new InMemoryNotificationAdapter(),
      unitOfWork,
      servicePolicyCatalogRepository: new InMemoryServicePolicyCatalogRepository(
        initialServicePolicyCatalog,
      ),
    }),
    fulfillmentCodeRepository,
  };
}

function confirmedAction() {
  return {
    id: 'action-1',
    customerId: 'customer-1',
    creatorId: 'creator-1',
    offeringId: 'offering-1',
    requestMessage: 'Please confirm this request.',
    resultAccessToken: 'result-token-1',
    state: 'confirmed' as const,
  };
}

describe('CustomerRequestService fulfillment transaction boundary', () => {
  it('uses scoped repositories and commits both fulfillment records', async () => {
    const actionRepository = new InMemoryCommerceActionRepository();
    await actionRepository.save(confirmedAction());
    const fixture = createFixture(actionRepository);
    const code = FulfillmentCode.generate('action-1');
    await fixture.fulfillmentCodeRepository.save(code);

    await expect(
      fixture.service.confirmFulfillment(
        'action-1',
        code.getCode(),
        createActorContext({
          actor: { kind: 'creator', creatorId: 'creator-1' },
          correlationId: 'fulfillment-commit',
        }),
      ),
    ).resolves.toMatchObject({ actionId: 'action-1', status: 'fulfilled' });
    expect((await fixture.fulfillmentCodeRepository.findByCode(code.getCode()))?.getStatus()).toBe(
      'fulfilled',
    );
  });

  it('rolls the code claim back when the action update fails', async () => {
    const actionRepository = new FailingCommerceActionRepository();
    await actionRepository.save(confirmedAction());
    const fixture = createFixture(actionRepository);
    const code = FulfillmentCode.generate('action-1');
    await fixture.fulfillmentCodeRepository.save(code);

    await expect(
      fixture.service.confirmFulfillment(
        'action-1',
        code.getCode(),
        createActorContext({
          actor: { kind: 'creator', creatorId: 'creator-1' },
          correlationId: 'fulfillment-rollback',
        }),
      ),
    ).rejects.toThrow('simulated action update failure');
    expect((await fixture.fulfillmentCodeRepository.findByCode(code.getCode()))?.getStatus()).toBe(
      'pending',
    );
  });
});
