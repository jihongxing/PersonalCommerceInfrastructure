import {
  bigint,
  index,
  jsonb,
  pgTable,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';

export const paidServiceOrders = pgTable(
  'paid_service_orders',
  {
    id: varchar('id', { length: 128 }).primaryKey(),
    commerceActionId: varchar('commerce_action_id', { length: 128 }).notNull(),
    creatorId: varchar('creator_id', { length: 128 }).notNull(),
    customerId: varchar('customer_id', { length: 128 }).notNull(),
    offeringId: varchar('offering_id', { length: 128 }).notNull(),
    offeringTitle: varchar('offering_title', { length: 160 }).notNull(),
    offeringDescription: varchar('offering_description', { length: 2_000 }).notNull(),
    serviceTerms: varchar('service_terms', { length: 2_000 }).notNull(),
    currency: varchar('currency', { length: 3 }).notNull(),
    grossPriceMinor: bigint('gross_price_minor', { mode: 'bigint' }).notNull(),
    state: varchar('state', { length: 32 }).notNull(),
    createdAt: timestamp('created_at', { mode: 'string', withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'string', withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('paid_service_orders_commerce_action_unique').on(table.commerceActionId),
    index('paid_service_orders_creator_created_at_idx').on(table.creatorId, table.createdAt),
    index('paid_service_orders_customer_created_at_idx').on(table.customerId, table.createdAt),
  ],
);

export const paidCommercePayments = pgTable(
  'paid_commerce_payments',
  {
    id: varchar('id', { length: 128 }).primaryKey(),
    orderId: varchar('order_id', { length: 128 }).notNull(),
    currency: varchar('currency', { length: 3 }).notNull(),
    amountMinor: bigint('amount_minor', { mode: 'bigint' }).notNull(),
    state: varchar('state', { length: 32 }).notNull(),
    correlationId: varchar('correlation_id', { length: 128 }).notNull(),
    providerReference: varchar('provider_reference', { length: 512 }),
    createdAt: timestamp('created_at', { mode: 'string', withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'string', withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('paid_commerce_payments_order_unique').on(table.orderId),
    uniqueIndex('paid_commerce_payments_correlation_unique').on(table.correlationId),
  ],
);

export const paidCommerceFulfillments = pgTable(
  'paid_commerce_fulfillments',
  {
    id: varchar('id', { length: 128 }).primaryKey(),
    orderId: varchar('order_id', { length: 128 }).notNull(),
    creatorId: varchar('creator_id', { length: 128 }).notNull(),
    state: varchar('state', { length: 32 }).notNull(),
    evidenceReference: varchar('evidence_reference', { length: 512 }).notNull(),
    fulfilledAt: timestamp('fulfilled_at', { mode: 'string', withTimezone: true }),
    createdAt: timestamp('created_at', { mode: 'string', withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex('paid_commerce_fulfillments_order_unique').on(table.orderId)],
);

export const paidCommerceSettlements = pgTable(
  'paid_commerce_settlements',
  {
    id: varchar('id', { length: 128 }).primaryKey(),
    orderId: varchar('order_id', { length: 128 }).notNull(),
    paymentId: varchar('payment_id', { length: 128 }).notNull(),
    fulfillmentId: varchar('fulfillment_id', { length: 128 }).notNull(),
    creatorId: varchar('creator_id', { length: 128 }).notNull(),
    currency: varchar('currency', { length: 3 }).notNull(),
    grossMinor: bigint('gross_minor', { mode: 'bigint' }).notNull(),
    providerFeeMinor: bigint('provider_fee_minor', { mode: 'bigint' }).notNull(),
    platformFeeMinor: bigint('platform_fee_minor', { mode: 'bigint' }).notNull(),
    deductionsMinor: bigint('deductions_minor', { mode: 'bigint' }).notNull(),
    creatorNetMinor: bigint('creator_net_minor', { mode: 'bigint' }).notNull(),
    state: varchar('state', { length: 32 }).notNull(),
    calculationVersion: varchar('calculation_version', { length: 128 }).notNull(),
    createdAt: timestamp('created_at', { mode: 'string', withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'string', withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex('paid_commerce_settlements_order_unique').on(table.orderId)],
);

export const creatorEarningsLedgerEntries = pgTable(
  'creator_earnings_ledger_entries',
  {
    id: varchar('id', { length: 128 }).primaryKey(),
    creatorId: varchar('creator_id', { length: 128 }).notNull(),
    currency: varchar('currency', { length: 3 }).notNull(),
    amountMinor: bigint('amount_minor', { mode: 'bigint' }).notNull(),
    type: varchar('type', { length: 64 }).notNull(),
    effectiveAt: timestamp('effective_at', { mode: 'string', withTimezone: true }).notNull(),
    orderId: varchar('order_id', { length: 128 }).notNull(),
    paymentId: varchar('payment_id', { length: 128 }),
    settlementId: varchar('settlement_id', { length: 128 }),
    withdrawalId: varchar('withdrawal_id', { length: 128 }),
    correlationId: varchar('correlation_id', { length: 128 }).notNull(),
    auditContext: jsonb('audit_context').$type<Record<string, string>>().notNull().default({}),
    recordedAt: timestamp('recorded_at', { mode: 'string', withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('creator_earnings_ledger_creator_effective_at_idx').on(
      table.creatorId,
      table.effectiveAt,
    ),
    uniqueIndex('creator_earnings_ledger_correlation_type_unique').on(
      table.correlationId,
      table.type,
    ),
  ],
);

export const paidCommerceWithdrawals = pgTable(
  'paid_commerce_withdrawals',
  {
    id: varchar('id', { length: 128 }).primaryKey(),
    creatorId: varchar('creator_id', { length: 128 }).notNull(),
    currency: varchar('currency', { length: 3 }).notNull(),
    amountMinor: bigint('amount_minor', { mode: 'bigint' }).notNull(),
    destinationReference: varchar('destination_reference', { length: 512 }).notNull(),
    idempotencyKey: varchar('idempotency_key', { length: 256 }).notNull(),
    state: varchar('state', { length: 32 }).notNull(),
    correlationId: varchar('correlation_id', { length: 128 }).notNull(),
    providerReference: varchar('provider_reference', { length: 512 }),
    createdAt: timestamp('created_at', { mode: 'string', withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'string', withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('paid_commerce_withdrawals_creator_idempotency_unique').on(
      table.creatorId,
      table.idempotencyKey,
    ),
  ],
);
