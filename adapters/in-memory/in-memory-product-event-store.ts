import type { ProductEventStore } from '../../applications/core/ports/product-event-store.js';
import type {
  CanonicalEvent,
  CanonicalEventName,
} from '../../modules/product-facts/canonical-events.js';

import type { TransactionParticipant } from './transaction-participant.js';

export class InMemoryProductEventStore implements ProductEventStore, TransactionParticipant {
  private events: CanonicalEvent[] = [];

  public append(event: CanonicalEvent): Promise<void> {
    if (
      (event.name === 'external_paid_verified' || event.name === 'fulfillment_observed') &&
      this.events.some(
        (existing) => existing.name === event.name && existing.objectId === event.objectId,
      )
    ) {
      return Promise.resolve();
    }
    this.events.push(structuredClone(event));
    return Promise.resolve();
  }

  public findByNameAndObjectId(
    name: CanonicalEventName,
    objectId: string,
  ): Promise<CanonicalEvent | undefined> {
    return Promise.resolve(
      structuredClone(
        this.events.find((event) => event.name === name && event.objectId === objectId),
      ),
    );
  }

  public list(): Promise<readonly CanonicalEvent[]> {
    return Promise.resolve(structuredClone(this.events));
  }

  public createSnapshot(): unknown {
    return structuredClone(this.events);
  }

  public restoreSnapshot(snapshot: unknown): void {
    if (!Array.isArray(snapshot)) {
      throw new TypeError('Product event store snapshot must be an Array.');
    }

    this.events = structuredClone(snapshot) as CanonicalEvent[];
  }
}
