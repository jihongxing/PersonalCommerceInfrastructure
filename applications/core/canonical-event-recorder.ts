import {
  createCanonicalEvent,
  type CanonicalEvent,
  type CanonicalEventName,
} from '../../modules/product-facts/canonical-events.js';

import type { Clock } from './ports/clock.js';
import type { IdGenerator } from './ports/id-generator.js';
import type { ProductEventStore } from './ports/product-event-store.js';

export interface RecordCanonicalEvent {
  readonly name: CanonicalEventName;
  readonly actorId: string;
  readonly objectId: string;
  readonly correlationId: string;
  readonly source: CanonicalEvent['source'];
  readonly payload?: CanonicalEvent['payload'];
}

export interface CanonicalEventRecorderDependencies {
  readonly clock: Clock;
  readonly eventStore: ProductEventStore;
  readonly idGenerator: IdGenerator;
}

export class CanonicalEventRecorder {
  public constructor(private readonly dependencies: CanonicalEventRecorderDependencies) {}

  public async record(
    input: RecordCanonicalEvent,
    eventStore: ProductEventStore = this.dependencies.eventStore,
  ): Promise<CanonicalEvent> {
    const event = createCanonicalEvent({
      ...input,
      id: this.dependencies.idGenerator.generate(),
      occurredAt: this.dependencies.clock.now(),
    });

    await eventStore.append(event);
    return event;
  }
}
