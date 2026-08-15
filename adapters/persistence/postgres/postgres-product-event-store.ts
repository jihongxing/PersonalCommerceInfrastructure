import { and, eq } from 'drizzle-orm';

import type { ProductEventStore } from '../../../applications/core/ports/product-event-store.js';
import { productEvents } from '../../../database/schema/product-events.js';
import type {
  CanonicalEvent,
  CanonicalEventName,
} from '../../../modules/product-facts/canonical-events.js';

import type { ProductDatabase } from './postgres-database.js';

export class PostgresProductEventStore implements ProductEventStore {
  public constructor(private readonly database: ProductDatabase) {}

  public async append(event: CanonicalEvent): Promise<void> {
    const insert = this.database.insert(productEvents).values({
      actorId: event.actorId,
      correlationId: event.correlationId,
      id: event.id,
      name: event.name,
      objectId: event.objectId,
      occurredAt: event.occurredAt,
      payload: event.payload,
      source: event.source,
    });

    if (event.name === 'external_paid_verified' || event.name === 'fulfillment_observed') {
      await insert.onConflictDoNothing();
      return;
    }

    await insert;
  }

  public async findByNameAndObjectId(
    name: CanonicalEventName,
    objectId: string,
  ): Promise<CanonicalEvent | undefined> {
    const rows = await this.database
      .select()
      .from(productEvents)
      .where(and(eq(productEvents.name, name), eq(productEvents.objectId, objectId)))
      .limit(1);
    const row = rows[0];

    return row === undefined
      ? undefined
      : {
          id: row.id,
          name: row.name as CanonicalEventName,
          occurredAt: row.occurredAt,
          actorId: row.actorId,
          objectId: row.objectId,
          correlationId: row.correlationId,
          source: row.source as CanonicalEvent['source'],
          payload: row.payload as Readonly<Record<string, unknown>>,
        };
  }
}
