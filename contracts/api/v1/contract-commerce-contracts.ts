import { Type } from 'typebox';

const CurrencySchema = Type.Literal('CNY');
const MoneyMinorSchema = Type.String({ pattern: '^[0-9]+$' });
const ContractStateSchema = Type.Union([
  Type.Literal('draft'),
  Type.Literal('proposed'),
  Type.Literal('accepted'),
  Type.Literal('contracted'),
  Type.Literal('rejected'),
  Type.Literal('expired'),
  Type.Literal('cancelled'),
]);

export const ContractScopeSchema = Type.Object(
  {
    performanceType: Type.String({ minLength: 1, maxLength: 240 }),
    performanceDate: Type.String({ minLength: 1, maxLength: 160 }),
    location: Type.String({ minLength: 1, maxLength: 500 }),
    durationMinutes: Type.Integer({ minimum: 1, maximum: 1_440 }),
    creatorHeadcount: Type.Integer({ minimum: 1, maximum: 200 }),
    deliverables: Type.String({ minLength: 1, maxLength: 4_000 }),
    priceMinor: MoneyMinorSchema,
    currency: CurrencySchema,
    cancellationTerms: Type.String({ minLength: 1, maxLength: 4_000 }),
    fulfillmentCriteria: Type.String({ minLength: 1, maxLength: 4_000 }),
  },
  { additionalProperties: false },
);

export const CreateContractProposalSchema = Type.Object(
  {
    commerceActionId: Type.String({ minLength: 1 }),
    scope: ContractScopeSchema,
    proposalExpiresAt: Type.String({ format: 'date-time' }),
  },
  { additionalProperties: false },
);

export const ContractScopeVersionSchema = Type.Object(
  {
    id: Type.String({ minLength: 1 }),
    contractId: Type.String({ minLength: 1 }),
    version: Type.Integer({ minimum: 1 }),
    scope: ContractScopeSchema,
    createdAt: Type.String({ format: 'date-time' }),
    createdBy: Type.String({ minLength: 1 }),
  },
  { additionalProperties: false },
);

export const ContractSchema = Type.Object(
  {
    id: Type.String({ minLength: 1 }),
    commerceActionId: Type.String({ minLength: 1 }),
    creatorId: Type.String({ minLength: 1 }),
    buyerId: Type.String({ minLength: 1 }),
    offeringId: Type.String({ minLength: 1 }),
    resultAccessToken: Type.String({ minLength: 1 }),
    state: ContractStateSchema,
    currentScopeVersionId: Type.Optional(Type.String({ minLength: 1 })),
    proposedAt: Type.Optional(Type.String({ format: 'date-time' })),
    proposalExpiresAt: Type.Optional(Type.String({ format: 'date-time' })),
    acceptedAt: Type.Optional(Type.String({ format: 'date-time' })),
    acceptedBy: Type.Optional(Type.String({ minLength: 1 })),
    contractedAt: Type.Optional(Type.String({ format: 'date-time' })),
    orderId: Type.Optional(Type.String({ minLength: 1 })),
    rejectedAt: Type.Optional(Type.String({ format: 'date-time' })),
    cancelledAt: Type.Optional(Type.String({ format: 'date-time' })),
    cancelledBy: Type.Optional(Type.Union([Type.Literal('creator'), Type.Literal('buyer')])),
  },
  { additionalProperties: false },
);

export const ContractDetailsSchema = Type.Object(
  {
    contract: ContractSchema,
    scopeVersion: ContractScopeVersionSchema,
  },
  { additionalProperties: false },
);

export const CreatorContractListSchema = Type.Object(
  { contracts: Type.Array(ContractDetailsSchema) },
  { additionalProperties: false },
);

export const ContractRelatedOrderSchema = Type.Object(
  {
    orderId: Type.String({ minLength: 1 }),
    orderState: Type.Union([
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
      Type.Literal('created'),
      Type.Literal('pending'),
      Type.Literal('confirmed'),
      Type.Literal('failed'),
      Type.Literal('expired'),
      Type.Literal('refunded'),
      Type.Literal('reversed'),
    ]),
  },
  { additionalProperties: false },
);
