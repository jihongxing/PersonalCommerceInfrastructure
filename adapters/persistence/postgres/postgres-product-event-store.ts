import type { ProductEventStore } from '../../../applications/core/ports/product-event-store.js';
import { productEvents } from '../../../database/schema/product-events.js';
import type { CanonicalEvent } from '../../../modules/product-facts/canonical-events.js';

import type { ProductDatabase } from './postgres-database.js';

export class PostgresProductEventStore implements ProductEventStore {
  public constructor(private readonly database: ProductDatabase) {}

  public async append(event: CanonicalEvent): Promise<void> {
    await this.database.insert(productEvents).values({
      actorId: event.actorId,
      correlationId: event.correlationId,
      id: event.id,
      name: event.name,
      objectId: event.objectId,
      occurredAt: event.occurredAt,
      payload: event.payload,
      source: event.source,
    });
  }
}
