import {
  bigint,
  bigserial,
  boolean,
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
    commerceActionId: varchar('commerce_action_id', { length: 128 }),
    reservationId: varchar('reservation_id', { length: 128 }),
    contractId: varchar('contract_id', { length: 128 }),
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
    uniqueIndex('paid_service_orders_reservation_unique').on(table.reservationId),
    uniqueIndex('paid_service_orders_contract_unique').on(table.contractId),
    index('paid_service_orders_creator_created_at_idx').on(table.creatorId, table.createdAt),
    index('paid_service_orders_customer_created_at_idx').on(table.customerId, table.createdAt),
  ],
);

export const availabilitySlots = pgTable(
  'availability_slots',
  {
    id: varchar('id', { length: 128 }).primaryKey(),
    creatorId: varchar('creator_id', { length: 128 }).notNull(),
    offeringId: varchar('offering_id', { length: 128 }).notNull(),
    startsAt: timestamp('starts_at', { mode: 'string', withTimezone: true }).notNull(),
    endsAt: timestamp('ends_at', { mode: 'string', withTimezone: true }).notNull(),
    capacity: bigint('capacity', { mode: 'number' }).notNull().default(1),
    state: varchar('state', { length: 32 }).notNull(),
    createdAt: timestamp('created_at', { mode: 'string', withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'string', withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('availability_slots_creator_offering_time_unique').on(
      table.creatorId,
      table.offeringId,
      table.startsAt,
      table.endsAt,
    ),
    index('availability_slots_offering_start_idx').on(table.offeringId, table.startsAt),
  ],
);

export const reservations = pgTable(
  'reservations',
  {
    id: varchar('id', { length: 128 }).primaryKey(),
    creatorId: varchar('creator_id', { length: 128 }).notNull(),
    customerId: varchar('customer_id', { length: 128 }).notNull(),
    offeringId: varchar('offering_id', { length: 128 }).notNull(),
    availabilitySlotId: varchar('availability_slot_id', { length: 128 }).notNull(),
    resultAccessToken: varchar('result_access_token', { length: 128 }).notNull(),
    state: varchar('state', { length: 32 }).notNull(),
    heldAt: timestamp('held_at', { mode: 'string', withTimezone: true }).notNull(),
    holdExpiresAt: timestamp('hold_expires_at', { mode: 'string', withTimezone: true }).notNull(),
    confirmedAt: timestamp('confirmed_at', { mode: 'string', withTimezone: true }),
    cancelledAt: timestamp('cancelled_at', { mode: 'string', withTimezone: true }),
    cancelledBy: varchar('cancelled_by', { length: 32 }),
    rescheduledAt: timestamp('rescheduled_at', { mode: 'string', withTimezone: true }),
    orderId: varchar('order_id', { length: 128 }),
    snapshot: jsonb('snapshot').$type<{
      offeringTitle: string;
      offeringDescription: string;
      serviceTerms: string;
      slotStartsAt: string;
      slotEndsAt: string;
    }>(),
    rescheduleHistory: jsonb('reschedule_history')
      .$type<
        {
          fromAvailabilitySlotId: string;
          toAvailabilitySlotId: string;
          occurredAt: string;
          actor: 'creator' | 'customer';
        }[]
      >()
      .notNull()
      .default([]),
    createdAt: timestamp('created_at', { mode: 'string', withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'string', withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('reservations_result_access_token_unique').on(table.resultAccessToken),
    uniqueIndex('reservations_order_unique').on(table.orderId),
    index('reservations_creator_idx').on(table.creatorId, table.createdAt),
    index('reservations_slot_state_idx').on(table.availabilitySlotId, table.state),
  ],
);

export const commercialContracts = pgTable(
  'commercial_contracts',
  {
    id: varchar('id', { length: 128 }).primaryKey(),
    commerceActionId: varchar('commerce_action_id', { length: 128 }).notNull(),
    creatorId: varchar('creator_id', { length: 128 }).notNull(),
    buyerId: varchar('buyer_id', { length: 128 }).notNull(),
    offeringId: varchar('offering_id', { length: 128 }).notNull(),
    resultAccessToken: varchar('result_access_token', { length: 128 }).notNull(),
    state: varchar('state', { length: 32 }).notNull(),
    currentScopeVersionId: varchar('current_scope_version_id', { length: 128 }),
    proposedAt: timestamp('proposed_at', { mode: 'string', withTimezone: true }),
    proposalExpiresAt: timestamp('proposal_expires_at', { mode: 'string', withTimezone: true }),
    acceptedAt: timestamp('accepted_at', { mode: 'string', withTimezone: true }),
    acceptedBy: varchar('accepted_by', { length: 128 }),
    contractedAt: timestamp('contracted_at', { mode: 'string', withTimezone: true }),
    orderId: varchar('order_id', { length: 128 }),
    rejectedAt: timestamp('rejected_at', { mode: 'string', withTimezone: true }),
    cancelledAt: timestamp('cancelled_at', { mode: 'string', withTimezone: true }),
    cancelledBy: varchar('cancelled_by', { length: 32 }),
    createdAt: timestamp('created_at', { mode: 'string', withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'string', withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('commercial_contracts_commerce_action_unique').on(table.commerceActionId),
    uniqueIndex('commercial_contracts_result_access_token_unique').on(table.resultAccessToken),
    uniqueIndex('commercial_contracts_order_unique').on(table.orderId),
    index('commercial_contracts_creator_created_at_idx').on(table.creatorId, table.createdAt),
  ],
);

export const commercialContractScopeVersions = pgTable(
  'commercial_contract_scope_versions',
  {
    id: varchar('id', { length: 128 }).primaryKey(),
    contractId: varchar('contract_id', { length: 128 }).notNull(),
    version: bigint('version', { mode: 'number' }).notNull(),
    performanceType: varchar('performance_type', { length: 512 }).notNull(),
    performanceDate: timestamp('performance_date', {
      mode: 'string',
      withTimezone: true,
    }).notNull(),
    location: varchar('location', { length: 1_000 }).notNull(),
    durationMinutes: bigint('duration_minutes', { mode: 'number' }).notNull(),
    creatorHeadcount: bigint('creator_headcount', { mode: 'number' }).notNull(),
    deliverables: varchar('deliverables', { length: 4_000 }).notNull(),
    priceMinor: bigint('price_minor', { mode: 'bigint' }).notNull(),
    currency: varchar('currency', { length: 3 }).notNull(),
    cancellationTerms: varchar('cancellation_terms', { length: 4_000 }).notNull(),
    fulfillmentCriteria: varchar('fulfillment_criteria', { length: 4_000 }).notNull(),
    createdAt: timestamp('created_at', { mode: 'string', withTimezone: true }).notNull(),
    createdBy: varchar('created_by', { length: 128 }).notNull(),
  },
  (table) => [
    uniqueIndex('commercial_contract_scope_versions_contract_version_unique').on(
      table.contractId,
      table.version,
    ),
    index('commercial_contract_scope_versions_contract_idx').on(table.contractId),
  ],
);

export const commercialContractAcceptanceFacts = pgTable(
  'commercial_contract_acceptance_facts',
  {
    id: varchar('id', { length: 256 }).primaryKey(),
    contractId: varchar('contract_id', { length: 128 }).notNull(),
    scopeVersionId: varchar('scope_version_id', { length: 128 }).notNull(),
    actorId: varchar('actor_id', { length: 128 }).notNull(),
    actorKind: varchar('actor_kind', { length: 32 }).notNull(),
    acceptedAt: timestamp('accepted_at', { mode: 'string', withTimezone: true }).notNull(),
  },
  (table) => [
    uniqueIndex('commercial_contract_acceptance_facts_contract_buyer_unique').on(
      table.contractId,
      table.actorId,
      table.scopeVersionId,
    ),
    index('commercial_contract_acceptance_facts_contract_idx').on(table.contractId),
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

export const providerWebhookReceipts = pgTable(
  'provider_webhook_receipts',
  {
    providerId: varchar('provider_id', { length: 128 }).notNull(),
    providerEventId: varchar('provider_event_id', { length: 256 }).notNull(),
    payloadSha256: varchar('payload_sha256', { length: 64 }).notNull(),
    receivedAt: timestamp('received_at', { mode: 'string', withTimezone: true }).notNull(),
    processed: boolean('processed').notNull().default(false),
    processedAt: timestamp('processed_at', { mode: 'string', withTimezone: true }),
    recordedAt: timestamp('recorded_at', { mode: 'string', withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('provider_webhook_receipts_event_unique').on(
      table.providerId,
      table.providerEventId,
    ),
    index('provider_webhook_receipts_received_at_idx').on(table.receivedAt),
  ],
);

export const providerFactReceipts = pgTable(
  'provider_fact_receipts',
  {
    providerId: varchar('provider_id', { length: 128 }).notNull(),
    providerEventId: varchar('provider_event_id', { length: 256 }).notNull(),
    providerReference: varchar('provider_reference', { length: 512 }).notNull(),
    kind: varchar('kind', { length: 64 }).notNull(),
    resourceType: varchar('resource_type', { length: 32 }).notNull(),
    internalReference: varchar('internal_reference', { length: 128 }).notNull(),
    amountMinor: bigint('amount_minor', { mode: 'bigint' }).notNull(),
    currency: varchar('currency', { length: 3 }).notNull(),
    sequence: bigint('sequence', { mode: 'number' }).notNull(),
    occurredAt: timestamp('occurred_at', { mode: 'string', withTimezone: true }).notNull(),
    recordedAt: timestamp('recorded_at', { mode: 'string', withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('provider_fact_receipts_event_unique').on(table.providerId, table.providerEventId),
    index('provider_fact_receipts_resource_sequence_idx').on(
      table.providerId,
      table.resourceType,
      table.internalReference,
      table.sequence,
    ),
  ],
);

export const providerFactObservations = pgTable(
  'provider_fact_observations',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    providerId: varchar('provider_id', { length: 128 }).notNull(),
    providerEventId: varchar('provider_event_id', { length: 256 }).notNull(),
    providerReference: varchar('provider_reference', { length: 512 }).notNull(),
    kind: varchar('kind', { length: 64 }).notNull(),
    resourceType: varchar('resource_type', { length: 32 }).notNull(),
    internalReference: varchar('internal_reference', { length: 128 }).notNull(),
    occurredAt: timestamp('occurred_at', { mode: 'string', withTimezone: true }).notNull(),
    status: varchar('status', { length: 32 }).notNull(),
    reason: varchar('reason', { length: 256 }),
    recordedAt: timestamp('recorded_at', { mode: 'string', withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('provider_fact_observations_resource_idx').on(
      table.providerId,
      table.resourceType,
      table.internalReference,
      table.recordedAt,
    ),
  ],
);

export const operationsActionAudits = pgTable(
  'operations_action_audits',
  {
    id: varchar('id', { length: 128 }).primaryKey(),
    actorId: varchar('actor_id', { length: 128 }).notNull(),
    action: varchar('action', { length: 64 }).notNull(),
    targetType: varchar('target_type', { length: 32 }).notNull(),
    targetId: varchar('target_id', { length: 128 }).notNull(),
    before: jsonb('before_state').$type<Record<string, unknown>>().notNull(),
    after: jsonb('after_state').$type<Record<string, unknown>>().notNull(),
    reason: varchar('reason', { length: 1024 }).notNull(),
    occurredAt: timestamp('occurred_at', { mode: 'string', withTimezone: true }).notNull(),
    correlationId: varchar('correlation_id', { length: 128 }).notNull(),
    recordedAt: timestamp('recorded_at', { mode: 'string', withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('operations_action_audits_target_idx').on(
      table.targetType,
      table.targetId,
      table.occurredAt,
    ),
    index('operations_action_audits_actor_idx').on(table.actorId, table.occurredAt),
  ],
);
