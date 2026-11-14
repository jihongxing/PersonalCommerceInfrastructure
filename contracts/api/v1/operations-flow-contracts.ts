import { Type } from 'typebox';

const PageSchema = Type.Object({
  page: Type.Integer({ minimum: 1 }),
  pageSize: Type.Integer({ minimum: 1, maximum: 100 }),
  total: Type.Integer({ minimum: 0 }),
});

const OfferingStateSchema = Type.Union([
  Type.Literal('draft'),
  Type.Literal('published'),
  Type.Literal('unpublished'),
  Type.Literal('archived'),
]);

const DistributionSchema = Type.Union([
  Type.Null(),
  Type.Object({ publicUrl: Type.String({ format: 'uri' }), state: Type.String({ minLength: 1 }) }),
]);

export const OperationsOfferingReadSchema = Type.Object(
  {
    id: Type.String({ minLength: 1 }),
    creator: Type.Object({
      id: Type.String({ minLength: 1 }),
      displayName: Type.Optional(Type.String()),
    }),
    capabilityIds: Type.Array(Type.String({ minLength: 1 })),
    capabilities: Type.Array(
      Type.Object({
        id: Type.String(),
        name: Type.Optional(Type.String()),
        catalogItemId: Type.Optional(Type.String()),
      }),
    ),
    createdAt: Type.Optional(Type.String({ format: 'date-time' })),
    updatedAt: Type.Optional(Type.String({ format: 'date-time' })),
    templateId: Type.Optional(Type.String()),
    title: Type.String(),
    description: Type.String(),
    availabilityDescription: Type.Optional(Type.String()),
    requestInstructions: Type.String(),
    state: OfferingStateSchema,
    policyStatus: Type.String({ minLength: 1 }),
    policyReason: Type.Optional(Type.String()),
    policyVersion: Type.Optional(Type.String()),
    distribution: DistributionSchema,
  },
  { additionalProperties: false },
);

export const OperationsOfferingListResponseSchema = Type.Intersect([
  PageSchema,
  Type.Object({ items: Type.Array(OperationsOfferingReadSchema) }),
]);
export const OperationsOfferingDetailResponseSchema = OperationsOfferingReadSchema;

const RequestStateSchema = Type.Union([
  Type.Literal('draft'),
  Type.Literal('submitted'),
  Type.Literal('confirmed'),
  Type.Literal('declined'),
]);

export const OperationsRequestReadSchema = Type.Object(
  {
    id: Type.String({ minLength: 1 }),
    offeringId: Type.String({ minLength: 1 }),
    offering: Type.Union([
      Type.Null(),
      Type.Object({
        id: Type.String({ minLength: 1 }),
        title: Type.String(),
        state: Type.String({ minLength: 1 }),
      }),
    ]),
    creator: Type.Object({
      id: Type.String({ minLength: 1 }),
      displayName: Type.Optional(Type.String()),
    }),
    customer: Type.Object({ id: Type.String({ minLength: 1 }) }),
    state: RequestStateSchema,
    createdAt: Type.Optional(Type.String({ format: 'date-time' })),
    updatedAt: Type.Optional(Type.String({ format: 'date-time' })),
    creatorDecision: Type.Union([
      Type.Literal('not_recorded'),
      Type.Literal('confirmed'),
      Type.Literal('declined'),
    ]),
    requestContentVisibility: Type.Literal('withheld'),
  },
  { additionalProperties: false },
);

export const OperationsRequestListResponseSchema = Type.Intersect([
  PageSchema,
  Type.Object({ items: Type.Array(OperationsRequestReadSchema) }),
]);
export const OperationsRequestDetailResponseSchema = OperationsRequestReadSchema;
