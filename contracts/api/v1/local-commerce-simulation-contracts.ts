import { Type } from 'typebox';

const CurrencySchema = Type.Literal('CNY');
const MoneyMinorSchema = Type.String({ pattern: '^[0-9]+$' });

const PaymentScenarioSchema = Type.Union([
  Type.Literal('success'),
  Type.Literal('failed'),
  Type.Literal('delayed'),
  Type.Literal('expired'),
  Type.Literal('duplicate_event'),
  Type.Literal('out_of_order_event'),
]);
const SettlementScenarioSchema = Type.Union([
  Type.Literal('immediate'),
  Type.Literal('delayed'),
  Type.Literal('failed'),
  Type.Literal('duplicate'),
  Type.Literal('conflicting_terminal_event'),
]);
const WithdrawalScenarioSchema = Type.Union([
  Type.Literal('success'),
  Type.Literal('failed'),
  Type.Literal('delayed'),
  Type.Literal('duplicate'),
]);
const RefundScenarioSchema = Type.Union([
  Type.Literal('before_settlement'),
  Type.Literal('after_settlement'),
  Type.Literal('failed_refund'),
]);

export const SimulationScenarioSchema = Type.Object(
  {
    payment: PaymentScenarioSchema,
    settlement: SettlementScenarioSchema,
    withdrawal: WithdrawalScenarioSchema,
    refund: RefundScenarioSchema,
  },
  { additionalProperties: false },
);

export const ConfigureSimulationScenarioSchema = Type.Partial(SimulationScenarioSchema, {
  additionalProperties: false,
});

export const SimulationOperationSchema = Type.Object(
  {
    amountMinor: MoneyMinorSchema,
    currency: CurrencySchema,
    idempotencyKey: Type.String({ minLength: 1, maxLength: 256 }),
  },
  { additionalProperties: false },
);

export const SimulationSettlementOperationSchema = Type.Object(
  {
    amountMinor: MoneyMinorSchema,
    currency: CurrencySchema,
    idempotencyKey: Type.String({ minLength: 1, maxLength: 256 }),
    providerFeeMinor: MoneyMinorSchema,
    platformFeeMinor: MoneyMinorSchema,
    deductionsMinor: MoneyMinorSchema,
    calculationVersion: Type.String({ minLength: 1, maxLength: 128 }),
  },
  { additionalProperties: false },
);

export const AdvanceSimulationSchema = Type.Object(
  { providerReference: Type.String({ minLength: 1, maxLength: 512 }) },
  { additionalProperties: false },
);

export const SimulationRefundSchema = Type.Object(
  {
    providerReference: Type.String({ minLength: 1, maxLength: 512 }),
    amountMinor: MoneyMinorSchema,
    currency: CurrencySchema,
  },
  { additionalProperties: false },
);

export const SimulationResultSchema = Type.Object(
  {
    origin: Type.Literal('simulation'),
    providerId: Type.Literal('local_commerce_simulator'),
    scenario: SimulationScenarioSchema,
    operationProviderReference: Type.Optional(Type.String({ minLength: 1, maxLength: 512 })),
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
          transitioned: Type.Boolean(),
        },
        { additionalProperties: false },
      ),
    ),
  },
  { additionalProperties: false },
);
