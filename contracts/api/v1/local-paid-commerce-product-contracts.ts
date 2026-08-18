import { Type } from 'typebox';

const MoneyMinorSchema = Type.String({ pattern: '^[0-9]+$' });
const CurrencySchema = Type.Literal('CNY');

const PaymentStateSchema = Type.Union([
  Type.Literal('pending'),
  Type.Literal('confirmed'),
  Type.Literal('failed'),
  Type.Literal('expired'),
  Type.Literal('refunded'),
  Type.Literal('reversed'),
]);

const OrderStateSchema = Type.Union([
  Type.Literal('created'),
  Type.Literal('payment_pending'),
  Type.Literal('paid'),
  Type.Literal('fulfilled'),
  Type.Literal('completed'),
  Type.Literal('cancelled'),
  Type.Literal('pending_resolution'),
  Type.Literal('refunded'),
]);

const SettlementStateSchema = Type.Union([
  Type.Literal('pending'),
  Type.Literal('released'),
  Type.Literal('failed'),
  Type.Literal('resolved'),
  Type.Literal('reversed'),
]);

const WithdrawalStateSchema = Type.Union([
  Type.Literal('requested'),
  Type.Literal('completed'),
  Type.Literal('failed'),
  Type.Literal('reversed'),
]);

const OrderSchema = Type.Object(
  {
    id: Type.String({ minLength: 1 }),
    commerceActionId: Type.Optional(Type.String({ minLength: 1 })),
    reservationId: Type.Optional(Type.String({ minLength: 1 })),
    state: OrderStateSchema,
    snapshot: Type.Object(
      {
        offeringTitle: Type.String({ minLength: 1 }),
        offeringDescription: Type.String({ minLength: 1 }),
        serviceTerms: Type.String({ minLength: 1 }),
        currency: CurrencySchema,
        grossPriceMinor: MoneyMinorSchema,
      },
      { additionalProperties: false },
    ),
  },
  { additionalProperties: false },
);

const PaymentSchema = Type.Object(
  {
    id: Type.String({ minLength: 1 }),
    state: PaymentStateSchema,
    amountMinor: MoneyMinorSchema,
    currency: CurrencySchema,
  },
  { additionalProperties: false },
);

export const LocalCheckoutSchema = Type.Object(
  {
    origin: Type.Literal('simulation'),
    providerId: Type.Literal('local_commerce_simulator'),
    creatorDisplayName: Type.String({ minLength: 1 }),
    order: OrderSchema,
    payment: Type.Optional(PaymentSchema),
  },
  { additionalProperties: false },
);

export const SimulateProductPaymentSchema = Type.Object(
  {
    scenario: Type.Union([
      Type.Literal('success'),
      Type.Literal('failed'),
      Type.Literal('delayed'),
      Type.Literal('expired'),
      Type.Literal('duplicate_event'),
      Type.Literal('out_of_order_event'),
    ]),
  },
  { additionalProperties: false },
);

export const SimulateProductSettlementSchema = Type.Object(
  {
    scenario: Type.Union([
      Type.Literal('immediate'),
      Type.Literal('delayed'),
      Type.Literal('failed'),
      Type.Literal('duplicate'),
      Type.Literal('conflicting_terminal_event'),
    ]),
  },
  { additionalProperties: false },
);

export const SimulateProductWithdrawalSchema = Type.Object(
  {
    scenario: Type.Union([
      Type.Literal('success'),
      Type.Literal('failed'),
      Type.Literal('delayed'),
      Type.Literal('duplicate'),
    ]),
  },
  { additionalProperties: false },
);

export const SimulateProductRefundSchema = Type.Object(
  {
    scenario: Type.Union([
      Type.Literal('before_settlement'),
      Type.Literal('after_settlement'),
      Type.Literal('failed_refund'),
    ]),
  },
  { additionalProperties: false },
);

export const AdvanceProductSimulationSchema = Type.Object(
  { providerReference: Type.String({ minLength: 1, maxLength: 512 }) },
  { additionalProperties: false },
);

export const ProductSimulationCommandResultSchema = Type.Object(
  {
    origin: Type.Literal('simulation'),
    providerId: Type.Literal('local_commerce_simulator'),
    operationProviderReference: Type.Optional(Type.String({ minLength: 1 })),
    eventCount: Type.Integer({ minimum: 0 }),
    processed: Type.Array(
      Type.Object(
        {
          receiptStatus: Type.Union([
            Type.Literal('accepted'),
            Type.Literal('idempotent'),
            Type.Literal('stale'),
            Type.Literal('conflict'),
          ]),
          reason: Type.Optional(Type.String({ minLength: 1 })),
          transitioned: Type.Boolean(),
        },
        { additionalProperties: false },
      ),
    ),
  },
  { additionalProperties: false },
);

const CreatorOrderSchema = Type.Object(
  {
    order: OrderSchema,
    customerName: Type.String({ minLength: 1 }),
    payment: Type.Optional(PaymentSchema),
    fulfillmentState: Type.Union([
      Type.Literal('not_started'),
      Type.Literal('pending'),
      Type.Literal('fulfilled'),
      Type.Literal('disputed'),
    ]),
    settlement: Type.Optional(
      Type.Object(
        {
          state: SettlementStateSchema,
          grossMinor: MoneyMinorSchema,
          providerFeeMinor: MoneyMinorSchema,
          platformFeeMinor: MoneyMinorSchema,
          adjustmentMinor: MoneyMinorSchema,
          creatorNetMinor: MoneyMinorSchema,
        },
        { additionalProperties: false },
      ),
    ),
    earningsState: Type.Union([
      Type.Literal('not_started'),
      Type.Literal('pending'),
      Type.Literal('available'),
      Type.Literal('pending_resolution'),
      Type.Literal('refunded'),
    ]),
  },
  { additionalProperties: false },
);

export const CreatorLocalCommerceWorkspaceSchema = Type.Object(
  {
    origin: Type.Literal('simulation'),
    providerId: Type.Literal('local_commerce_simulator'),
    orders: Type.Array(CreatorOrderSchema),
    wallet: Type.Object(
      {
        currency: CurrencySchema,
        pendingMinor: MoneyMinorSchema,
        availableMinor: MoneyMinorSchema,
        restrictedMinor: MoneyMinorSchema,
        withdrawalInProgressMinor: MoneyMinorSchema,
        withdrawnMinor: MoneyMinorSchema,
        recoveryOutstandingMinor: MoneyMinorSchema,
      },
      { additionalProperties: false },
    ),
    withdrawals: Type.Array(
      Type.Object(
        {
          id: Type.String({ minLength: 1 }),
          amountMinor: MoneyMinorSchema,
          currency: CurrencySchema,
          state: WithdrawalStateSchema,
        },
        { additionalProperties: false },
      ),
    ),
  },
  { additionalProperties: false },
);
