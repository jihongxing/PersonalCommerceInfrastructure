import {
  index,
  integer,
  jsonb,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

export const goodsOfferings = pgTable(
  'goods_offerings',
  {
    id: uuid('id').primaryKey(),
    sellerId: varchar('seller_id', { length: 128 }).notNull(),
    revision: integer('revision').notNull(),
    state: varchar('state', { length: 32 }).notNull(),
    data: jsonb('data').notNull(),
    createdAt: timestamp('created_at', { mode: 'string', withTimezone: true }).notNull(),
    updatedAt: timestamp('updated_at', { mode: 'string', withTimezone: true }).notNull(),
  },
  (table) => [index('goods_offerings_seller_idx').on(table.sellerId, table.createdAt, table.id)],
);

export const goodsOrders = pgTable(
  'goods_orders',
  {
    id: uuid('id').primaryKey(),
    offeringId: uuid('offering_id').notNull(),
    sellerId: varchar('seller_id', { length: 128 }).notNull(),
    buyerAccountId: varchar('buyer_account_id', { length: 256 }).notNull(),
    idempotencyKey: varchar('idempotency_key', { length: 128 }).notNull(),
    state: varchar('state', { length: 32 }).notNull(),
    snapshot: jsonb('snapshot').notNull(),
    data: jsonb('data').notNull(),
    submittedAt: timestamp('submitted_at', { mode: 'string', withTimezone: true }).notNull(),
    updatedAt: timestamp('updated_at', { mode: 'string', withTimezone: true }).notNull(),
  },
  (table) => [
    uniqueIndex('goods_orders_buyer_idempotency_unique').on(
      table.buyerAccountId,
      table.idempotencyKey,
    ),
    index('goods_orders_seller_idx').on(table.sellerId, table.submittedAt, table.id),
    index('goods_orders_buyer_idx').on(table.buyerAccountId, table.submittedAt, table.id),
  ],
);

export const goodsOrderAcceptances = pgTable(
  'goods_order_acceptances',
  {
    id: uuid('id').primaryKey(),
    orderId: uuid('order_id').notNull(),
    sellerId: varchar('seller_id', { length: 128 }).notNull(),
    data: jsonb('data').notNull(),
    occurredAt: timestamp('occurred_at', { mode: 'string', withTimezone: true }).notNull(),
  },
  (table) => [uniqueIndex('goods_order_acceptances_order_unique').on(table.orderId)],
);

export const goodsCommitments = pgTable(
  'goods_commitments',
  {
    id: uuid('id').primaryKey(),
    orderId: uuid('order_id').notNull(),
    sellerId: varchar('seller_id', { length: 128 }).notNull(),
    buyerAccountId: varchar('buyer_account_id', { length: 256 }).notNull(),
    data: jsonb('data').notNull(),
    createdAt: timestamp('created_at', { mode: 'string', withTimezone: true }).notNull(),
  },
  (table) => [uniqueIndex('goods_commitments_order_unique').on(table.orderId)],
);

export const goodsDeliveries = pgTable(
  'goods_deliveries',
  {
    id: uuid('id').primaryKey(),
    orderId: uuid('order_id').notNull(),
    sellerId: varchar('seller_id', { length: 128 }).notNull(),
    data: jsonb('data').notNull(),
    occurredAt: timestamp('occurred_at', { mode: 'string', withTimezone: true }).notNull(),
  },
  (table) => [uniqueIndex('goods_deliveries_order_unique').on(table.orderId)],
);

export const goodsBuyerReceipts = pgTable(
  'goods_buyer_receipts',
  {
    id: uuid('id').primaryKey(),
    orderId: uuid('order_id').notNull(),
    buyerAccountId: varchar('buyer_account_id', { length: 256 }).notNull(),
    data: jsonb('data').notNull(),
    occurredAt: timestamp('occurred_at', { mode: 'string', withTimezone: true }).notNull(),
  },
  (table) => [uniqueIndex('goods_buyer_receipts_order_unique').on(table.orderId)],
);

export const goodsCancellationProposals = pgTable(
  'goods_cancellation_proposals',
  {
    id: uuid('id').primaryKey(),
    orderId: uuid('order_id').notNull(),
    sellerId: varchar('seller_id', { length: 128 }).notNull(),
    data: jsonb('data').notNull(),
    occurredAt: timestamp('occurred_at', { mode: 'string', withTimezone: true }).notNull(),
  },
  (table) => [uniqueIndex('goods_cancellation_proposals_order_unique').on(table.orderId)],
);

export const goodsAudits = pgTable(
  'goods_audits',
  {
    id: uuid('id').primaryKey(),
    targetType: varchar('target_type', { length: 64 }).notNull(),
    targetId: uuid('target_id').notNull(),
    action: varchar('action', { length: 128 }).notNull(),
    beforeState: jsonb('before_state').notNull(),
    afterState: jsonb('after_state').notNull(),
    reason: varchar('reason', { length: 2_000 }).notNull(),
    actorId: varchar('actor_id', { length: 256 }).notNull(),
    actorAccountId: varchar('actor_account_id', { length: 256 }),
    occurredAt: timestamp('occurred_at', { mode: 'string', withTimezone: true }).notNull(),
    correlationId: varchar('correlation_id', { length: 128 }).notNull(),
  },
  (table) => [
    index('goods_audits_target_idx').on(
      table.targetType,
      table.targetId,
      table.occurredAt,
      table.id,
    ),
  ],
);
