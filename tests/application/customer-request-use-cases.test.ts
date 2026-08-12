import { describe, expect, it } from 'vitest';

import { InMemoryCommerceActionRepository } from '../../adapters/in-memory/in-memory-commerce-action-repository.js';
import { InMemoryCustomerRepository } from '../../adapters/in-memory/in-memory-customer-repository.js';
import { InMemoryEntityCollectionRepository } from '../../adapters/in-memory/in-memory-entity-collection-repository.js';
import { InMemoryNotificationAdapter } from '../../adapters/notifications/in-memory-notification-adapter.js';
import { InMemoryProductEventStore } from '../../adapters/in-memory/in-memory-product-event-store.js';
import { InMemoryUnitOfWork } from '../../adapters/in-memory/in-memory-unit-of-work.js';
import { FixedClock } from '../../adapters/in-memory/fixed-clock.js';
import { SequentialIdGenerator } from '../../adapters/in-memory/sequential-id-generator.js';
import { CanonicalEventRecorder } from '../../applications/core/canonical-event-recorder.js';
import {
  DecideCustomerRequestUseCase,
  GetCreatorSubmittedRequestsUseCase,
  GetCustomerRequestResultUseCase,
  GetPublicOfferingUseCase,
  SubmitCustomerRequestUseCase,
} from '../../applications/customer-request/customer-request-use-cases.js';
import {
  createDraftCommerceIdentity,
  publishCommerceIdentity,
  type Capability,
  type CommerceIdentity,
} from '../../modules/creator-commerce-identity/commerce-identity.js';
import { unpublishOffering, type Offering } from '../../modules/service-offering/offering.js';

async function createFixture() {
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
  const customerRepository = new InMemoryCustomerRepository();
  const commerceActionRepository = new InMemoryCommerceActionRepository();
  const productEventStore = new InMemoryProductEventStore();
  const notificationAdapter = new InMemoryNotificationAdapter();
  const unitOfWork = new InMemoryUnitOfWork(
    [
      identityRepository,
      capabilityRepository,
      offeringRepository,
      customerRepository,
      commerceActionRepository,
      productEventStore,
    ],
    productEventStore,
    {
      identityRepository,
      capabilityRepository,
      offeringRepository,
      customerRepository,
      commerceActionRepository,
    },
  );
  const canonicalEventRecorder = new CanonicalEventRecorder({
    clock: new FixedClock('2026-08-12T10:00:00.000Z'),
    eventStore: productEventStore,
    idGenerator: new SequentialIdGenerator('event'),
  });

  await identityRepository.save(
    publishCommerceIdentity(
      createDraftCommerceIdentity('creator-1', {
        displayName: 'Dancer One',
        bio: 'Private dance lessons',
        socialLinks: [],
      }),
    ),
  );
  await capabilityRepository.save({
    id: 'capability-1',
    creatorId: 'creator-1',
    name: 'Private Dance Lesson',
    description: 'One-on-one dance instruction.',
  });
  await offeringRepository.save({
    id: 'offering-1',
    creatorId: 'creator-1',
    capabilityIds: ['capability-1'],
    title: 'Private dance lesson',
    description: 'One hour of one-on-one instruction.',
    availability: { description: 'Weekends by request.' },
    requestInstructions: 'Share your preferred time and experience level.',
    state: 'published',
  });

  const dependencies = {
    identityRepository,
    capabilityRepository,
    offeringRepository,
    customerRepository,
    commerceActionRepository,
    idGenerator: new SequentialIdGenerator('request'),
    canonicalEventRecorder,
    notificationPort: notificationAdapter,
    unitOfWork,
  };
  return {
    getPublicOffering: new GetPublicOfferingUseCase(dependencies),
    submitCustomerRequest: new SubmitCustomerRequestUseCase(dependencies),
    listCreatorSubmittedRequests: new GetCreatorSubmittedRequestsUseCase(dependencies),
    confirmCustomerRequest: new DecideCustomerRequestUseCase(dependencies, 'confirm'),
    declineCustomerRequest: new DecideCustomerRequestUseCase(dependencies, 'decline'),
    getCustomerRequestResult: new GetCustomerRequestResultUseCase(dependencies),
    identityRepository,
    capabilityRepository,
    offeringRepository,
    customerRepository,
    commerceActionRepository,
    productEventStore,
    notificationAdapter,
    canonicalEventRecorder,
    unitOfWork,
  };
}

describe('Customer Request application use cases', () => {
  it('shows a Published public Offering and records storefront_viewed', async () => {
    const { getPublicOffering, productEventStore } = await createFixture();

    await expect(
      getPublicOffering.execute('offering-1', { correlationId: 'storefront-view-1' }),
    ).resolves.toMatchObject({
      creator: {
        displayName: 'Dancer One',
        capabilityNames: ['Private Dance Lesson'],
      },
      offering: {
        id: 'offering-1',
        requestInstructions: 'Share your preferred time and experience level.',
      },
    });
    await expect(productEventStore.list()).resolves.toEqual([
      expect.objectContaining({
        name: 'storefront_viewed',
        objectId: 'creator-1',
      }),
    ]);
  });

  it('blocks public access when the owning Commerce Identity is not Published', async () => {
    const { getPublicOffering, identityRepository, productEventStore } = await createFixture();
    await identityRepository.save(
      createDraftCommerceIdentity('creator-1', {
        displayName: 'Dancer One',
        bio: 'Private dance lessons',
        socialLinks: [],
      }),
    );

    await expect(
      getPublicOffering.execute('offering-1', {
        correlationId: 'draft-identity-storefront-view',
      }),
    ).rejects.toMatchObject({
      category: 'unavailable',
      code: 'service_offering_unavailable',
    });
    await expect(productEventStore.list()).resolves.toEqual([]);
  });

  it('creates a Customer and Submitted Commerce Action for a complete Request', async () => {
    const {
      submitCustomerRequest,
      commerceActionRepository,
      productEventStore,
      notificationAdapter,
    } = await createFixture();

    const action = await submitCustomerRequest.execute(
      {
        offeringId: 'offering-1',
        contactName: 'Buyer One',
        contactMethod: 'buyer@example.test',
        requestMessage: 'I would like a weekend lesson.',
      },
      { correlationId: 'request-submit-1' },
    );

    expect(action).toMatchObject({
      customerId: 'request-1',
      creatorId: 'creator-1',
      offeringId: 'offering-1',
      state: 'submitted',
    });
    await expect(commerceActionRepository.findById(action.id)).resolves.toEqual(action);
    await expect(productEventStore.list()).resolves.toEqual([
      expect.objectContaining({
        name: 'commerce_action_submitted',
        objectId: action.id,
      }),
    ]);
    expect(notificationAdapter.list()).toEqual([
      {
        kind: 'creator_request_submitted',
        recipientCreatorId: 'creator-1',
        actionId: action.id,
        offeringId: 'offering-1',
        offeringTitle: 'Private dance lesson',
      },
    ]);
  });

  it('blocks duplicate unresolved Requests and keeps the original Action', async () => {
    const { submitCustomerRequest, commerceActionRepository } = await createFixture();
    const command = {
      offeringId: 'offering-1',
      contactName: 'Buyer One',
      contactMethod: 'buyer@example.test',
      requestMessage: 'I would like a weekend lesson.',
    };
    const action = await submitCustomerRequest.execute(command, {
      correlationId: 'request-submit-1',
    });

    await expect(
      submitCustomerRequest.execute(command, { correlationId: 'request-submit-2' }),
    ).rejects.toMatchObject({
      category: 'conflict',
      code: 'duplicate_unresolved_customer_request',
    });
    await expect(commerceActionRepository.findById(action.id)).resolves.toEqual(action);
  });

  it('blocks incomplete Request information without creating an Action or submitted event', async () => {
    const {
      submitCustomerRequest,
      commerceActionRepository,
      productEventStore,
      notificationAdapter,
    } = await createFixture();

    await expect(
      submitCustomerRequest.execute(
        {
          offeringId: 'offering-1',
          contactName: 'Buyer One',
          contactMethod: '',
          requestMessage: 'I would like a weekend lesson.',
        },
        { correlationId: 'request-submit-incomplete' },
      ),
    ).rejects.toMatchObject({
      category: 'validation',
      code: 'customer_request_information_missing',
    });
    await expect(commerceActionRepository.findByOwnerId('creator-1')).resolves.toEqual([]);
    await expect(productEventStore.list()).resolves.toEqual([]);
    expect(notificationAdapter.list()).toEqual([]);
  });

  it('blocks new Requests after Unpublish and preserves the existing Submitted Action', async () => {
    const { submitCustomerRequest, offeringRepository, commerceActionRepository } =
      await createFixture();
    const action = await submitCustomerRequest.execute(
      {
        offeringId: 'offering-1',
        contactName: 'Buyer One',
        contactMethod: 'buyer@example.test',
        requestMessage: 'I would like a weekend lesson.',
      },
      { correlationId: 'request-submit-1' },
    );
    const publishedOffering = await offeringRepository.findById('offering-1');

    await offeringRepository.save(unpublishOffering(publishedOffering as Offering));

    await expect(
      submitCustomerRequest.execute(
        {
          offeringId: 'offering-1',
          contactName: 'Buyer Two',
          contactMethod: 'buyer-two@example.test',
          requestMessage: 'I would like a weekday lesson.',
        },
        { correlationId: 'request-submit-2' },
      ),
    ).rejects.toMatchObject({
      category: 'unavailable',
      code: 'service_offering_unavailable',
    });
    await expect(commerceActionRepository.findById(action.id)).resolves.toEqual(
      expect.objectContaining({ state: 'submitted' }),
    );
  });

  it('lists only the owning Creator submitted Requests with Customer and Offering context', async () => {
    const {
      submitCustomerRequest,
      listCreatorSubmittedRequests,
      offeringRepository,
      customerRepository,
      commerceActionRepository,
    } = await createFixture();
    const ownAction = await submitCustomerRequest.execute(
      {
        offeringId: 'offering-1',
        contactName: 'Buyer One',
        contactMethod: 'buyer@example.test',
        requestMessage: 'I would like a weekend lesson.',
      },
      { correlationId: 'request-submit-1' },
    );
    await customerRepository.save({
      id: 'customer-other',
      contactName: 'Buyer Two',
      contactMethod: 'buyer-two@example.test',
    });
    await offeringRepository.save({
      id: 'offering-other',
      creatorId: 'creator-2',
      capabilityIds: [],
      title: 'Other Creator Offering',
      description: 'Other description.',
      availability: { description: 'By request.' },
      requestInstructions: 'Share details.',
      state: 'unpublished',
    });
    await commerceActionRepository.save({
      id: 'action-other',
      customerId: 'customer-other',
      creatorId: 'creator-2',
      offeringId: 'offering-other',
      requestMessage: 'Other request.',
      resultAccessToken: 'result-other',
      state: 'submitted',
    });

    await expect(
      listCreatorSubmittedRequests.execute({
        actor: { kind: 'creator', creatorId: 'creator-1' },
        correlationId: 'creator-list-1',
      }),
    ).resolves.toEqual([
      {
        action: ownAction,
        customer: {
          id: ownAction.customerId,
          contactName: 'Buyer One',
          contactMethod: 'buyer@example.test',
        },
        offering: {
          id: 'offering-1',
          title: 'Private dance lesson',
        },
      },
    ]);
  });

  it.each([
    ['confirm', 'confirmed', 'commerce_confirmed'],
    ['decline', 'declined', 'commerce_declined'],
  ] as const)(
    '%s transitions an owned Submitted Request once and exposes a non-payment Customer result',
    async (decision, expectedState, expectedEvent) => {
      const {
        submitCustomerRequest,
        confirmCustomerRequest,
        declineCustomerRequest,
        getCustomerRequestResult,
        commerceActionRepository,
        productEventStore,
        notificationAdapter,
      } = await createFixture();
      const action = await submitCustomerRequest.execute(
        {
          offeringId: 'offering-1',
          contactName: 'Buyer One',
          contactMethod: 'buyer@example.test',
          requestMessage: 'I would like a weekend lesson.',
        },
        { correlationId: 'request-submit-1' },
      );
      const useCase = decision === 'confirm' ? confirmCustomerRequest : declineCustomerRequest;

      await expect(
        useCase.execute(action.id, {
          actor: { kind: 'creator', creatorId: 'creator-1' },
          correlationId: `request-${decision}-1`,
        }),
      ).resolves.toMatchObject({ id: action.id, state: expectedState });
      await expect(commerceActionRepository.findById(action.id)).resolves.toMatchObject({
        state: expectedState,
      });
      const customerResult = await getCustomerRequestResult.execute(action.resultAccessToken);
      expect(customerResult).toMatchObject({
        actionId: action.id,
        state: expectedState,
      });
      expect(customerResult.message).toMatch(/records only the Creator's response/);

      const terminalEvents = (await productEventStore.list()).filter(
        (event) => event.name === expectedEvent,
      );
      expect(terminalEvents).toHaveLength(1);
      expect(notificationAdapter.list().at(-1)).toMatchObject({
        kind: decision === 'confirm' ? 'customer_request_confirmed' : 'customer_request_declined',
        recipientCustomerId: action.customerId,
        actionId: action.id,
        resultAccessToken: action.resultAccessToken,
      });
    },
  );

  it('keeps valid state and canonical events when notification delivery fails', async () => {
    const fixture = await createFixture();
    const failingDependencies = {
      identityRepository: fixture.identityRepository,
      capabilityRepository: fixture.capabilityRepository,
      offeringRepository: fixture.offeringRepository,
      customerRepository: fixture.customerRepository,
      commerceActionRepository: fixture.commerceActionRepository,
      idGenerator: new SequentialIdGenerator('failed-notification'),
      canonicalEventRecorder: fixture.canonicalEventRecorder,
      notificationPort: {
        deliver: () => Promise.reject(new Error('simulated notification failure')),
      },
      unitOfWork: fixture.unitOfWork,
    };
    const submit = new SubmitCustomerRequestUseCase(failingDependencies);
    const confirm = new DecideCustomerRequestUseCase(failingDependencies, 'confirm');
    const action = await submit.execute(
      {
        offeringId: 'offering-1',
        contactName: 'Buyer One',
        contactMethod: 'buyer@example.test',
        requestMessage: 'I would like a weekend lesson.',
      },
      { correlationId: 'notification-failure-submit' },
    );

    await expect(
      confirm.execute(action.id, {
        actor: { kind: 'creator', creatorId: 'creator-1' },
        correlationId: 'notification-failure-confirm',
      }),
    ).resolves.toMatchObject({ state: 'confirmed' });
    await expect(fixture.commerceActionRepository.findById(action.id)).resolves.toMatchObject({
      state: 'confirmed',
    });
    await expect(fixture.productEventStore.list()).resolves.toEqual([
      expect.objectContaining({ name: 'commerce_action_submitted', objectId: action.id }),
      expect.objectContaining({ name: 'commerce_confirmed', objectId: action.id }),
    ]);
  });

  it('rejects repeated and unauthorized terminal actions without changing state or adding events', async () => {
    const {
      submitCustomerRequest,
      confirmCustomerRequest,
      declineCustomerRequest,
      commerceActionRepository,
      productEventStore,
      notificationAdapter,
    } = await createFixture();
    const action = await submitCustomerRequest.execute(
      {
        offeringId: 'offering-1',
        contactName: 'Buyer One',
        contactMethod: 'buyer@example.test',
        requestMessage: 'I would like a weekend lesson.',
      },
      { correlationId: 'request-submit-1' },
    );

    await expect(
      confirmCustomerRequest.execute(action.id, {
        actor: { kind: 'creator', creatorId: 'creator-2' },
        correlationId: 'request-confirm-unauthorized',
      }),
    ).rejects.toMatchObject({
      category: 'authorization',
      code: 'commerce_action_not_owned',
    });
    await expect(
      confirmCustomerRequest.execute(action.id, {
        actor: { kind: 'creator', creatorId: 'creator-1' },
        correlationId: 'request-confirm-1',
      }),
    ).resolves.toMatchObject({ state: 'confirmed' });
    await expect(
      declineCustomerRequest.execute(action.id, {
        actor: { kind: 'creator', creatorId: 'creator-1' },
        correlationId: 'request-decline-repeat',
      }),
    ).rejects.toMatchObject({
      category: 'conflict',
      code: 'commerce_action_already_decided',
    });

    await expect(commerceActionRepository.findById(action.id)).resolves.toMatchObject({
      state: 'confirmed',
    });
    const terminalEvents = (await productEventStore.list()).filter(
      (event) => event.name === 'commerce_confirmed' || event.name === 'commerce_declined',
    );
    expect(terminalEvents).toEqual([
      expect.objectContaining({
        name: 'commerce_confirmed',
        objectId: action.id,
      }),
    ]);
    expect(notificationAdapter.list()).toHaveLength(2);
    expect(notificationAdapter.list().at(-1)).toMatchObject({
      kind: 'customer_request_confirmed',
      actionId: action.id,
    });
  });

  it('allows only one concurrent terminal decision and records one terminal event', async () => {
    const {
      submitCustomerRequest,
      confirmCustomerRequest,
      declineCustomerRequest,
      commerceActionRepository,
      productEventStore,
    } = await createFixture();
    const action = await submitCustomerRequest.execute(
      {
        offeringId: 'offering-1',
        contactName: 'Buyer One',
        contactMethod: 'buyer@example.test',
        requestMessage: 'I would like a weekend lesson.',
      },
      { correlationId: 'request-submit-1' },
    );
    const context = {
      actor: { kind: 'creator' as const, creatorId: 'creator-1' },
      correlationId: 'request-concurrent-decision',
    };

    const decisions = await Promise.allSettled([
      confirmCustomerRequest.execute(action.id, context),
      declineCustomerRequest.execute(action.id, context),
    ]);

    expect(decisions.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    const rejected = decisions.find((result) => result.status === 'rejected');
    expect(rejected?.status).toBe('rejected');
    if (rejected?.status === 'rejected') {
      expect(rejected.reason).toMatchObject({
        category: 'conflict',
        code: 'commerce_action_already_decided',
      });
    }
    const decidedAction = await commerceActionRepository.findById(action.id);
    expect(['confirmed', 'declined']).toContain(decidedAction?.state);
    const terminalEvents = (await productEventStore.list()).filter(
      (event) => event.name === 'commerce_confirmed' || event.name === 'commerce_declined',
    );
    expect(terminalEvents).toHaveLength(1);
  });
});
