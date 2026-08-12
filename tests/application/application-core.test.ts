import { describe, expect, it } from 'vitest';

import { ApplicationError } from '../../applications/core/application-error.js';
import { createActorContext } from '../../applications/core/actor-context.js';
import { CanonicalEventRecorder } from '../../applications/core/canonical-event-recorder.js';
import type { ApplicationUseCase } from '../../applications/core/application-use-case.js';
import { FixedClock } from '../../adapters/in-memory/fixed-clock.js';
import { InMemoryEntityRepository } from '../../adapters/in-memory/in-memory-entity-repository.js';
import { InMemoryProductEventStore } from '../../adapters/in-memory/in-memory-product-event-store.js';
import { InMemoryUnitOfWork } from '../../adapters/in-memory/in-memory-unit-of-work.js';
import { SequentialIdGenerator } from '../../adapters/in-memory/sequential-id-generator.js';

interface ExampleEntity {
  readonly id: string;
  readonly state: 'draft' | 'published';
}

describe('application core', () => {
  it('defines a client-independent application error model', () => {
    const error = new ApplicationError({
      category: 'conflict',
      code: 'invalid_state_transition',
      message: 'The requested state transition is not allowed.',
    });

    expect(error).toMatchObject({
      name: 'ApplicationError',
      category: 'conflict',
      code: 'invalid_state_transition',
      message: 'The requested state transition is not allowed.',
    });
  });

  it('creates an actor context without depending on an authentication provider', () => {
    const context = createActorContext({
      actor: { kind: 'creator', creatorId: 'creator-1' },
      correlationId: 'correlation-1',
    });

    expect(context).toEqual({
      actor: { kind: 'creator', creatorId: 'creator-1' },
      correlationId: 'correlation-1',
    });
  });

  it('rejects an actor context without a correlation id', () => {
    expect(() =>
      createActorContext({
        actor: { kind: 'platform' },
        correlationId: ' ',
      }),
    ).toThrowError(ApplicationError);
  });

  it('provides a platform-independent application use case contract', async () => {
    const useCase: ApplicationUseCase<{ readonly value: string }, string> = {
      execute(command, context) {
        return Promise.resolve(`${context.actor.kind}:${command.value}`);
      },
    };

    const result = await useCase.execute(
      { value: 'ok' },
      createActorContext({
        actor: { kind: 'platform' },
        correlationId: 'correlation-2',
      }),
    );

    expect(result).toBe('platform:ok');
  });

  it('records a governed canonical event through application ports', async () => {
    const eventStore = new InMemoryProductEventStore();
    const recorder = new CanonicalEventRecorder({
      clock: new FixedClock('2026-08-11T12:00:00.000Z'),
      eventStore,
      idGenerator: new SequentialIdGenerator('event'),
    });

    const event = await recorder.record({
      actorId: 'creator-1',
      correlationId: 'correlation-3',
      name: 'creator_published',
      objectId: 'identity-1',
      source: 'creator',
    });

    expect(event).toEqual({
      actorId: 'creator-1',
      correlationId: 'correlation-3',
      id: 'event-1',
      name: 'creator_published',
      objectId: 'identity-1',
      occurredAt: '2026-08-11T12:00:00.000Z',
      payload: {},
      source: 'creator',
    });
    await expect(eventStore.list()).resolves.toEqual([event]);
  });

  it('commits state and canonical events together', async () => {
    const repository = new InMemoryEntityRepository<ExampleEntity>((entity) => entity.id);
    const eventStore = new InMemoryProductEventStore();
    const unitOfWork = new InMemoryUnitOfWork([repository, eventStore], eventStore);
    const recorder = new CanonicalEventRecorder({
      clock: new FixedClock('2026-08-11T12:00:00.000Z'),
      eventStore,
      idGenerator: new SequentialIdGenerator('event'),
    });

    await unitOfWork.execute(async ({ productEventStore: scopedEventStore }) => {
      await repository.save({ id: 'entity-1', state: 'published' });
      await recorder.record(
        {
          actorId: 'creator-1',
          correlationId: 'correlation-4',
          name: 'creator_published',
          objectId: 'entity-1',
          source: 'creator',
        },
        scopedEventStore,
      );
    });

    await expect(repository.findById('entity-1')).resolves.toEqual({
      id: 'entity-1',
      state: 'published',
    });
    await expect(eventStore.list()).resolves.toHaveLength(1);
  });

  it('rolls state and canonical events back together', async () => {
    const repository = new InMemoryEntityRepository<ExampleEntity>((entity) => entity.id);
    const eventStore = new InMemoryProductEventStore();
    const unitOfWork = new InMemoryUnitOfWork([repository, eventStore], eventStore);
    const recorder = new CanonicalEventRecorder({
      clock: new FixedClock('2026-08-11T12:00:00.000Z'),
      eventStore,
      idGenerator: new SequentialIdGenerator('event'),
    });

    await expect(
      unitOfWork.execute(async ({ productEventStore: scopedEventStore }) => {
        await repository.save({ id: 'entity-1', state: 'published' });
        await recorder.record(
          {
            actorId: 'creator-1',
            correlationId: 'correlation-5',
            name: 'creator_published',
            objectId: 'entity-1',
            source: 'creator',
          },
          scopedEventStore,
        );
        throw new Error('simulated failure');
      }),
    ).rejects.toThrow('simulated failure');

    await expect(repository.findById('entity-1')).resolves.toBeUndefined();
    await expect(eventStore.list()).resolves.toEqual([]);
  });
});
