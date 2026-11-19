import { Type, type Static } from 'typebox';

const GoodsOfferingStateSchema = Type.Union([
  Type.Literal('draft'),
  Type.Literal('published'),
  Type.Literal('paused'),
]);

const GoodsOrderStateSchema = Type.Union([
  Type.Literal('pending'),
  Type.Literal('accepted'),
  Type.Literal('rejected'),
]);

const GoodsTermsSchema = Type.Object(
  {
    title: Type.String({ minLength: 1, maxLength: 160 }),
    description: Type.String({ minLength: 1, maxLength: 2_000 }),
    priceMinor: Type.String({ pattern: '^\\d+$' }),
    currency: Type.String({ pattern: '^[A-Z]{3}$' }),
    fulfillmentDescription: Type.String({ minLength: 1, maxLength: 1_000 }),
    preparationDescription: Type.String({ minLength: 1, maxLength: 1_000 }),
    imageUrl: Type.Optional(Type.String({ maxLength: 2_048 })),
  },
  { additionalProperties: false },
);

export const GoodsOfferingResponseSchema = Type.Object(
  {
    id: Type.String({ minLength: 1 }),
    sellerId: Type.String({ minLength: 1 }),
    revision: Type.Integer({ minimum: 1 }),
    state: GoodsOfferingStateSchema,
    terms: GoodsTermsSchema,
    createdAt: Type.String(),
    updatedAt: Type.String(),
  },
  { additionalProperties: false },
);

export const GoodsOfferingListResponseSchema = Type.Object(
  { offerings: Type.Array(GoodsOfferingResponseSchema) },
  { additionalProperties: false },
);

export const GoodsOfferingInputSchema = GoodsTermsSchema;

export const GoodsOfferingUpdateSchema = Type.Object(
  { expectedRevision: Type.Integer({ minimum: 1 }), terms: GoodsTermsSchema },
  { additionalProperties: false },
);

export const GoodsOfferingStateChangeSchema = Type.Object(
  { expectedRevision: Type.Integer({ minimum: 1 }) },
  { additionalProperties: false },
);

export const GoodsPublicOfferingSchema = Type.Object(
  {
    id: Type.String({ minLength: 1 }),
    sellerId: Type.String({ minLength: 1 }),
    revision: Type.Integer({ minimum: 1 }),
    state: Type.Literal('published'),
    terms: GoodsTermsSchema,
  },
  { additionalProperties: false },
);

const GoodsOrderSnapshotSchema = Type.Object(
  {
    title: Type.String(),
    description: Type.String(),
    priceMinor: Type.String({ pattern: '^\\d+$' }),
    currency: Type.String({ pattern: '^[A-Z]{3}$' }),
    fulfillmentDescription: Type.String(),
    preparationDescription: Type.String(),
    imageUrl: Type.Optional(Type.String()),
    offeringRevision: Type.Integer({ minimum: 1 }),
  },
  { additionalProperties: false },
);

export const GoodsOrderSchema = Type.Object(
  {
    id: Type.String({ minLength: 1 }),
    offeringId: Type.String({ minLength: 1 }),
    sellerId: Type.String({ minLength: 1 }),
    buyerAccountId: Type.String({ minLength: 1 }),
    idempotencyKey: Type.String({ minLength: 1 }),
    state: GoodsOrderStateSchema,
    snapshot: GoodsOrderSnapshotSchema,
    submittedAt: Type.String(),
    updatedAt: Type.String(),
  },
  { additionalProperties: false },
);

const GoodsAcceptanceSchema = Type.Object(
  {
    id: Type.String(),
    orderId: Type.String(),
    sellerId: Type.String(),
    actorAccountId: Type.String(),
    occurredAt: Type.String(),
    correlationId: Type.String(),
  },
  { additionalProperties: false },
);

const GoodsCommitmentSchema = Type.Object(
  {
    id: Type.String(),
    orderId: Type.String(),
    sellerId: Type.String(),
    buyerAccountId: Type.String(),
    createdAt: Type.String(),
    correlationId: Type.String(),
  },
  { additionalProperties: false },
);

const GoodsDeliverySchema = Type.Object(
  {
    id: Type.String(),
    orderId: Type.String(),
    sellerId: Type.String(),
    method: Type.String(),
    note: Type.String(),
    occurredAt: Type.String(),
    correlationId: Type.String(),
  },
  { additionalProperties: false },
);

const GoodsReceiptSchema = Type.Object(
  {
    id: Type.String(),
    orderId: Type.String(),
    buyerAccountId: Type.String(),
    note: Type.String(),
    occurredAt: Type.String(),
    correlationId: Type.String(),
  },
  { additionalProperties: false },
);

const GoodsCancellationProposalSchema = Type.Object(
  {
    id: Type.String(),
    orderId: Type.String(),
    sellerId: Type.String(),
    reason: Type.String(),
    occurredAt: Type.String(),
    correlationId: Type.String(),
  },
  { additionalProperties: false },
);

export const GoodsOrderViewSchema = Type.Object(
  {
    order: GoodsOrderSchema,
    acceptance: Type.Optional(GoodsAcceptanceSchema),
    commitment: Type.Optional(GoodsCommitmentSchema),
    delivery: Type.Optional(GoodsDeliverySchema),
    buyerReceipt: Type.Optional(GoodsReceiptSchema),
    sellerCancellationProposal: Type.Optional(GoodsCancellationProposalSchema),
  },
  { additionalProperties: false },
);

export const GoodsOrderListResponseSchema = Type.Object(
  { orders: Type.Array(GoodsOrderViewSchema) },
  { additionalProperties: false },
);

export const GoodsOrderSubmitSchema = Type.Object(
  { idempotencyKey: Type.String({ minLength: 1, maxLength: 128 }) },
  { additionalProperties: false },
);

export const GoodsReasonSchema = Type.Object(
  { reason: Type.String({ minLength: 1, maxLength: 2_000 }) },
  { additionalProperties: false },
);

export const GoodsDeliveryInputSchema = Type.Object(
  {
    method: Type.String({ minLength: 1, maxLength: 240 }),
    note: Type.String({ maxLength: 2_000 }),
  },
  { additionalProperties: false },
);

export const GoodsReceiptInputSchema = Type.Object(
  { note: Type.String({ maxLength: 2_000 }) },
  { additionalProperties: false },
);

export type GoodsOfferingInputBody = Static<typeof GoodsOfferingInputSchema>;
export type GoodsOfferingUpdateBody = Static<typeof GoodsOfferingUpdateSchema>;
export type GoodsOfferingStateChangeBody = Static<typeof GoodsOfferingStateChangeSchema>;
export type GoodsOrderSubmitBody = Static<typeof GoodsOrderSubmitSchema>;
export type GoodsReasonBody = Static<typeof GoodsReasonSchema>;
export type GoodsDeliveryInputBody = Static<typeof GoodsDeliveryInputSchema>;
export type GoodsReceiptInputBody = Static<typeof GoodsReceiptInputSchema>;
