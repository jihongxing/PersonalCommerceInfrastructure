import { Type } from 'typebox';

const CurrencySchema = Type.Literal('CNY');
const MoneyMinorSchema = Type.String({ pattern: '^[0-9]+$' });

export const CreatePaidServiceOrderSchema = Type.Object(
  {
    commerceActionId: Type.String({ minLength: 1 }),
    grossPriceMinor: MoneyMinorSchema,
    serviceTerms: Type.String({ minLength: 1, maxLength: 2_000 }),
  },
  { additionalProperties: false },
);

export const PaidServiceOrderSchema = Type.Object(
  {
    id: Type.String({ minLength: 1 }),
    commerceActionId: Type.String({ minLength: 1 }),
    creatorId: Type.String({ minLength: 1 }),
    customerId: Type.String({ minLength: 1 }),
    offeringId: Type.String({ minLength: 1 }),
    state: Type.Union([
      Type.Literal('created'),
      Type.Literal('payment_pending'),
      Type.Literal('paid'),
      Type.Literal('fulfilled'),
      Type.Literal('completed'),
      Type.Literal('cancelled'),
      Type.Literal('pending_resolution'),
      Type.Literal('refunded'),
    ]),
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

export const CreatorPaidServiceOrderListSchema = Type.Object(
  { orders: Type.Array(PaidServiceOrderSchema) },
  { additionalProperties: false },
);

export const CreatorWalletSchema = Type.Object(
  {
    currency: CurrencySchema,
    pendingMinor: MoneyMinorSchema,
    availableMinor: MoneyMinorSchema,
    restrictedMinor: MoneyMinorSchema,
    withdrawalInProgressMinor: MoneyMinorSchema,
    withdrawnMinor: MoneyMinorSchema,
  },
  { additionalProperties: false },
);

export const PublicPaidServiceOrderStatusSchema = Type.Object(
  {
    orderState: Type.Union([
      Type.Literal('not_created'),
      Type.Literal('created'),
      Type.Literal('payment_pending'),
      Type.Literal('paid'),
      Type.Literal('fulfilled'),
      Type.Literal('completed'),
      Type.Literal('cancelled'),
      Type.Literal('pending_resolution'),
      Type.Literal('refunded'),
    ]),
    paymentState: Type.Union([
      Type.Literal('not_started'),
      Type.Literal('pending'),
      Type.Literal('confirmed'),
      Type.Literal('failed'),
      Type.Literal('refunded'),
      Type.Literal('reversed'),
    ]),
  },
  { additionalProperties: false },
);

export const RequestWithdrawalSchema = Type.Object(
  {
    amountMinor: MoneyMinorSchema,
    destinationReference: Type.String({ minLength: 1, maxLength: 512 }),
    idempotencyKey: Type.String({ minLength: 1, maxLength: 256 }),
  },
  { additionalProperties: false },
);

export const WithdrawalSchema = Type.Object(
  {
    id: Type.String({ minLength: 1 }),
    creatorId: Type.String({ minLength: 1 }),
    currency: CurrencySchema,
    amountMinor: MoneyMinorSchema,
    state: Type.Union([
      Type.Literal('requested'),
      Type.Literal('completed'),
      Type.Literal('failed'),
      Type.Literal('reversed'),
    ]),
  },
  { additionalProperties: false },
);

export const RecordControlledPaymentSchema = Type.Object(
  { controlledEvidenceReference: Type.String({ minLength: 1, maxLength: 512 }) },
  { additionalProperties: false },
);

export const RecordFulfillmentSchema = Type.Object(
  { evidenceReference: Type.String({ minLength: 1, maxLength: 512 }) },
  { additionalProperties: false },
);

export const ReleaseControlledSettlementSchema = Type.Object(
  {
    providerFeeMinor: MoneyMinorSchema,
    platformFeeMinor: MoneyMinorSchema,
    deductionsMinor: Type.Optional(MoneyMinorSchema),
    calculationVersion: Type.String({ minLength: 1, maxLength: 128 }),
    controlledEvidenceReference: Type.String({ minLength: 1, maxLength: 512 }),
  },
  { additionalProperties: false },
);

export const CompleteControlledWithdrawalSchema = Type.Object(
  { controlledEvidenceReference: Type.String({ minLength: 1, maxLength: 512 }) },
  { additionalProperties: false },
);
