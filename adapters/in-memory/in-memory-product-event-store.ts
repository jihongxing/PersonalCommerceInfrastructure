import type { ProductEventStore } from '../../applications/core/ports/product-event-store.js';
import type { CanonicalEvent } from '../../modules/product-facts/canonical-events.js';

import type { TransactionParticipant } from './transaction-participant.js';

export class InMemoryProductEventStore implements ProductEventStore, TransactionParticipant {
  private events: CanonicalEvent[] = [];

  public append(event: CanonicalEvent): Promise<void> {
    this.events.push(structuredClone(event));
    return Promise.resolve();
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
