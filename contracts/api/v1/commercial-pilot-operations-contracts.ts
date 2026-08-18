import { Type } from 'typebox';

const MoneyMinorSchema = Type.String({ pattern: '^[0-9]+$' });
const IssueSchema = Type.Union([
  Type.Literal('missing_fact'),
  Type.Literal('duplicate_fact'),
  Type.Literal('conflicting_fact'),
  Type.Literal('pending_resolution'),
  Type.Literal('recovery_outstanding'),
]);

const EventSchema = Type.Object(
  {
    id: Type.String({ minLength: 1 }),
    name: Type.String({ minLength: 1 }),
    occurredAt: Type.String({ format: 'date-time' }),
    actorId: Type.String({ minLength: 1 }),
    objectId: Type.String({ minLength: 1 }),
    correlationId: Type.String({ minLength: 1 }),
    source: Type.String({ minLength: 1 }),
    payload: Type.Record(Type.String(), Type.Unknown()),
  },
  { additionalProperties: false },
);

const LedgerEntrySchema = Type.Object(
  {
    id: Type.String({ minLength: 1 }),
    type: Type.String({ minLength: 1 }),
    amountMinor: MoneyMinorSchema,
    currency: Type.Literal('CNY'),
    orderId: Type.String({ minLength: 1 }),
    paymentId: Type.Optional(Type.String({ minLength: 1 })),
    settlementId: Type.Optional(Type.String({ minLength: 1 })),
    withdrawalId: Type.Optional(Type.String({ minLength: 1 })),
    effectiveAt: Type.String({ format: 'date-time' }),
    correlationId: Type.String({ minLength: 1 }),
  },
  { additionalProperties: false },
);

const WithdrawalSchema = Type.Object(
  {
    id: Type.String({ minLength: 1 }),
    state: Type.String({ minLength: 1 }),
    amountMinor: MoneyMinorSchema,
    providerReference: Type.Optional(Type.String({ minLength: 1 })),
  },
  { additionalProperties: false },
);

const OperationsOrderSchema = Type.Object(
  {
    order: Type.Object(
      {
        id: Type.String({ minLength: 1 }),
        creatorId: Type.String({ minLength: 1 }),
        customerId: Type.String({ minLength: 1 }),
        offeringId: Type.String({ minLength: 1 }),
        offeringSnapshot: Type.Object(
          {
            title: Type.String(),
            description: Type.String(),
            serviceTerms: Type.String(),
          },
          { additionalProperties: false },
        ),
        amountMinor: MoneyMinorSchema,
        currency: Type.Literal('CNY'),
        state: Type.String({ minLength: 1 }),
      },
      { additionalProperties: false },
    ),
    payment: Type.Optional(
      Type.Object(
        {
          id: Type.String({ minLength: 1 }),
          state: Type.String({ minLength: 1 }),
          providerReference: Type.Optional(Type.String({ minLength: 1 })),
          timestamp: Type.Optional(Type.String({ format: 'date-time' })),
        },
        { additionalProperties: false },
      ),
    ),
    settlement: Type.Optional(
      Type.Object(
        {
          id: Type.String({ minLength: 1 }),
          state: Type.String({ minLength: 1 }),
          grossMinor: MoneyMinorSchema,
          providerFeeMinor: MoneyMinorSchema,
          platformFeeMinor: MoneyMinorSchema,
          creatorNetMinor: MoneyMinorSchema,
          timestamp: Type.Optional(Type.String({ format: 'date-time' })),
        },
        { additionalProperties: false },
      ),
    ),
    earnings: Type.Object(
      {
        scope: Type.Literal('order_earnings_projection'),
        pendingMinor: MoneyMinorSchema,
        availableMinor: MoneyMinorSchema,
        restrictedMinor: MoneyMinorSchema,
        recoveryOutstandingMinor: MoneyMinorSchema,
      },
      { additionalProperties: false },
    ),
    creatorWallet: Type.Object(
      {
        scope: Type.Literal('creator_wallet_projection'),
        pendingMinor: MoneyMinorSchema,
        availableMinor: MoneyMinorSchema,
        restrictedMinor: MoneyMinorSchema,
        recoveryOutstandingMinor: MoneyMinorSchema,
        withdrawalInProgressMinor: MoneyMinorSchema,
        withdrawnMinor: MoneyMinorSchema,
      },
      { additionalProperties: false },
    ),
    withdrawals: Type.Array(WithdrawalSchema),
    origin: Type.Union([
      Type.Literal('simulation'),
      Type.Literal('provider'),
      Type.Literal('unknown'),
    ]),
    providerId: Type.Optional(Type.String({ minLength: 1 })),
    issues: Type.Array(IssueSchema),
    ledgerEntries: Type.Array(LedgerEntrySchema),
    canonicalEvents: Type.Array(EventSchema),
  },
  { additionalProperties: false },
);

export const CommercialPilotOperationsWorkspaceSchema = Type.Object(
  {
    orders: Type.Array(OperationsOrderSchema),
    audit: Type.Array(
      Type.Object(
        {
          id: Type.String({ minLength: 1 }),
          actorId: Type.String({ minLength: 1 }),
          action: Type.String({ minLength: 1 }),
          targetType: Type.String({ minLength: 1 }),
          targetId: Type.String({ minLength: 1 }),
          before: Type.Record(Type.String(), Type.Unknown()),
          after: Type.Record(Type.String(), Type.Unknown()),
          reason: Type.String({ minLength: 1 }),
          occurredAt: Type.String({ format: 'date-time' }),
          correlationId: Type.String({ minLength: 1 }),
        },
        { additionalProperties: false },
      ),
    ),
  },
  { additionalProperties: false },
);

export const CommercialPilotOperationsEvidenceSchema = Type.Intersect([
  OperationsOrderSchema,
  Type.Object(
    {
      classification: Type.Literal('commercial_evidence_summary'),
      generatedAt: Type.String({ format: 'date-time' }),
      realCommerceEvidence: Type.Literal(false),
    },
    { additionalProperties: false },
  ),
]);

export const OperationsReasonSchema = Type.Object(
  { reason: Type.String({ minLength: 1, maxLength: 1024 }) },
  { additionalProperties: false },
);

export const OperationsResolutionSchema = Type.Object(
  {
    action: Type.Union([
      Type.Literal('reconciliation'),
      Type.Literal('manual_resolution'),
      Type.Literal('recovery_resolution'),
    ]),
    targetType: Type.Union([
      Type.Literal('order'),
      Type.Literal('settlement'),
      Type.Literal('withdrawal'),
      Type.Literal('recovery'),
    ]),
    targetId: Type.String({ minLength: 1 }),
    reason: Type.String({ minLength: 1, maxLength: 1024 }),
  },
  { additionalProperties: false },
);

export const OperationsActionResponseSchema = Type.Object(
  { status: Type.Literal('recorded') },
  { additionalProperties: false },
);
