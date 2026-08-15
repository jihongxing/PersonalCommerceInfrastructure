import { describe, expect, it } from 'vitest';

import { InMemoryCommerceActionRepository } from '../../adapters/in-memory/in-memory-commerce-action-repository.js';
import { InMemoryProductEventStore } from '../../adapters/in-memory/in-memory-product-event-store.js';
import { FixedClock } from '../../adapters/in-memory/fixed-clock.js';
import { SequentialIdGenerator } from '../../adapters/in-memory/sequential-id-generator.js';
import { CanonicalEventRecorder } from '../../applications/core/canonical-event-recorder.js';
import { RecordExternalObservationUseCase } from '../../applications/shadow-commerce/external-observation-use-cases.js';

async function createFixture() {
  const commerceActionRepository = new InMemoryCommerceActionRepository();
  const productEventStore = new InMemoryProductEventStore();
  const canonicalEventRecorder = new CanonicalEventRecorder({
    clock: new FixedClock('2026-08-12T12:00:00.000Z'),
    eventStore: productEventStore,
    idGenerator: new SequentialIdGenerator('event'),
  });
  await commerceActionRepository.save({
    id: 'action-1',
    customerId: 'customer-1',
    creatorId: 'creator-1',
    offeringId: 'offering-1',
    requestMessage: 'I would like a lesson.',
    resultAccessToken: 'result-1',
    state: 'confirmed',
  });

  return {
    commerceActionRepository,
    productEventStore,
    recordObservation: new RecordExternalObservationUseCase({
      commerceActionRepository,
      canonicalEventRecorder,
      productEventStore,
    }),
  };
}

describe('External observation application use case', () => {
  it('records external payment then fulfillment without changing Commerce Action state', async () => {
    const { commerceActionRepository, productEventStore, recordObservation } =
      await createFixture();

    await recordObservation.execute(
      {
        actionId: 'action-1',
        type: 'external_paid_verified',
        evidenceReference: 'evidence-external-paid',
        occurredAt: '2026-08-14T12:00:00.000Z',
      },
      {
        actor: { kind: 'pilot_operations', operatorId: 'operator-1' },
        correlationId: 'observation-external-paid',
      },
    );
    await recordObservation.execute(
      {
        actionId: 'action-1',
        type: 'fulfillment_observed',
        evidenceReference: 'evidence-fulfillment',
        occurredAt: '2026-08-14T13:00:00.000Z',
      },
      {
        actor: { kind: 'pilot_operations', operatorId: 'operator-1' },
        correlationId: 'observation-fulfillment',
      },
    );

    await expect(commerceActionRepository.findById('action-1')).resolves.toMatchObject({
      state: 'confirmed',
    });
    await expect(productEventStore.list()).resolves.toEqual([
      expect.objectContaining({
        name: 'external_paid_verified',
        actorId: 'operator-1',
        objectId: 'action-1',
        source: 'pilot_operations',
        payload: {
          evidenceReference: 'evidence-external-paid',
          occurredAt: '2026-08-14T12:00:00.000Z',
        },
      }),
      expect.objectContaining({
        name: 'fulfillment_observed',
        actorId: 'operator-1',
        objectId: 'action-1',
        source: 'pilot_operations',
        payload: {
          evidenceReference: 'evidence-fulfillment',
          occurredAt: '2026-08-14T13:00:00.000Z',
        },
      }),
    ]);
  });

  it('rejects missing evidence or a non-operations actor without recording an event', async () => {
    const { productEventStore, recordObservation } = await createFixture();

    await expect(
      recordObservation.execute(
        {
          actionId: 'action-1',
          type: 'external_paid_verified',
          evidenceReference: '',
          occurredAt: '2026-08-14T12:00:00.000Z',
        },
        {
          actor: { kind: 'pilot_operations', operatorId: 'operator-1' },
          correlationId: 'observation-missing-evidence',
        },
      ),
    ).rejects.toMatchObject({
      category: 'validation',
      code: 'external_observation_evidence_required',
    });
    await expect(
      recordObservation.execute(
        {
          actionId: 'action-1',
          type: 'fulfillment_observed',
          evidenceReference: 'evidence-1',
          occurredAt: '2026-08-14T12:00:00.000Z',
        },
        {
          actor: { kind: 'creator', creatorId: 'creator-1' },
          correlationId: 'observation-unauthorized',
        },
      ),
    ).rejects.toMatchObject({
      category: 'authorization',
      code: 'pilot_operations_actor_required',
    });
    await expect(productEventStore.list()).resolves.toEqual([]);
  });

  it('requires a confirmed Action and external payment before fulfillment', async () => {
    const { commerceActionRepository, productEventStore, recordObservation } =
      await createFixture();
    await commerceActionRepository.save({
      id: 'action-1',
      customerId: 'customer-1',
      creatorId: 'creator-1',
      offeringId: 'offering-1',
      requestMessage: 'I would like a lesson.',
      resultAccessToken: 'result-1',
      state: 'submitted',
    });

    await expect(
      recordObservation.execute(
        {
          actionId: 'action-1',
          type: 'external_paid_verified',
          evidenceReference: 'evidence-payment',
          occurredAt: '2026-08-14T12:00:00.000Z',
        },
        {
          actor: { kind: 'pilot_operations', operatorId: 'operator-1' },
          correlationId: 'observation-unconfirmed',
        },
      ),
    ).rejects.toMatchObject({
      category: 'conflict',
      code: 'external_observation_requires_confirmed_action',
    });

    await commerceActionRepository.save({
      id: 'action-1',
      customerId: 'customer-1',
      creatorId: 'creator-1',
      offeringId: 'offering-1',
      requestMessage: 'I would like a lesson.',
      resultAccessToken: 'result-1',
      state: 'confirmed',
    });
    await expect(
      recordObservation.execute(
        {
          actionId: 'action-1',
          type: 'fulfillment_observed',
          evidenceReference: 'evidence-fulfillment',
          occurredAt: '2026-08-14T13:00:00.000Z',
        },
        {
          actor: { kind: 'pilot_operations', operatorId: 'operator-1' },
          correlationId: 'observation-fulfillment-before-payment',
        },
      ),
    ).rejects.toMatchObject({
      category: 'conflict',
      code: 'fulfillment_requires_external_payment',
    });
    await expect(productEventStore.list()).resolves.toEqual([]);
  });

  it('returns the existing external fact for repeated idempotent calls', async () => {
    const { productEventStore, recordObservation } = await createFixture();
    const command = {
      actionId: 'action-1',
      type: 'external_paid_verified' as const,
      evidenceReference: 'evidence-payment',
      occurredAt: '2026-08-14T12:00:00.000Z',
    };
    const context = {
      actor: { kind: 'pilot_operations' as const, operatorId: 'operator-1' },
      correlationId: 'observation-payment',
    };

    const first = await recordObservation.execute(command, context);
    const repeated = await recordObservation.execute(
      { ...command, evidenceReference: 'different-evidence' },
      { ...context, correlationId: 'observation-payment-repeat' },
    );

    expect(repeated).toEqual(first);
    await expect(productEventStore.list()).resolves.toHaveLength(1);
  });
});
