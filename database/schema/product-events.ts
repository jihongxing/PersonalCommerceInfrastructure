import { check, index, jsonb, pgTable, timestamp, uniqueIndex, varchar } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

import { canonicalEventNames } from '../../modules/product-facts/canonical-events.js';

const eventNameSqlList = canonicalEventNames.map((name) => `'${name}'`).join(', ');

export const productEvents = pgTable(
  'product_events',
  {
    id: varchar('id', { length: 128 }).primaryKey(),
    name: varchar('name', { length: 64 }).notNull(),
    occurredAt: timestamp('occurred_at', { mode: 'string', withTimezone: true }).notNull(),
    actorId: varchar('actor_id', { length: 128 }).notNull(),
    objectId: varchar('object_id', { length: 128 }).notNull(),
    correlationId: varchar('correlation_id', { length: 128 }).notNull(),
    source: varchar('source', { length: 32 }).notNull(),
    payload: jsonb('payload').notNull().default({}),
    recordedAt: timestamp('recorded_at', { mode: 'string', withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check('product_events_name_check', sql.raw(`${table.name.name} in (${eventNameSqlList})`)),
    check(
      'product_events_source_check',
      sql.raw(`${table.source.name} in ('system', 'creator', 'customer', 'pilot_operations')`),
    ),
    uniqueIndex('product_events_correlation_event_object_unique').on(
      table.correlationId,
      table.name,
      table.objectId,
    ),
    uniqueIndex('product_events_external_fact_unique')
      .on(table.name, table.objectId)
      .where(sql`${table.name} in ('external_paid_verified', 'fulfillment_observed')`),
    index('product_events_object_occurred_at_idx').on(table.objectId, table.occurredAt),
    index('product_events_actor_occurred_at_idx').on(table.actorId, table.occurredAt),
  ],
);

export type ProductEventRow = typeof productEvents.$inferSelect;
export type NewProductEventRow = typeof productEvents.$inferInsert;
