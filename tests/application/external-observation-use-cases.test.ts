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
    }),
  };
}

describe('External observation application use case', () => {
  it.each(['external_paid_verified', 'fulfillment_observed'] as const)(
    'records %s with evidence without changing Commerce Action state',
    async (type) => {
      const { commerceActionRepository, productEventStore, recordObservation } =
        await createFixture();

      await recordObservation.execute(
        {
          actionId: 'action-1',
          type,
          evidenceReference: `evidence-${type}`,
        },
        {
          actor: { kind: 'pilot_operations', operatorId: 'operator-1' },
          correlationId: `observation-${type}`,
        },
      );

      await expect(commerceActionRepository.findById('action-1')).resolves.toMatchObject({
        state: 'confirmed',
      });
      await expect(productEventStore.list()).resolves.toEqual([
        expect.objectContaining({
          name: type,
          actorId: 'operator-1',
          objectId: 'action-1',
          source: 'pilot_operations',
          payload: {
            evidenceReference: `evidence-${type}`,
          },
        }),
      ]);
    },
  );

  it('rejects missing evidence or a non-operations actor without recording an event', async () => {
    const { productEventStore, recordObservation } = await createFixture();

    await expect(
      recordObservation.execute(
        {
          actionId: 'action-1',
          type: 'external_paid_verified',
          evidenceReference: '',
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
});
