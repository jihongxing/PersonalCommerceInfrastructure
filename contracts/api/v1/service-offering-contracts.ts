import { Type } from 'typebox';

const OfferingStateSchema = Type.Union([
  Type.Literal('draft'),
  Type.Literal('published'),
  Type.Literal('unpublished'),
  Type.Literal('archived'),
]);

const MissingPublishConditionSchema = Type.Union([
  Type.Literal('title'),
  Type.Literal('description'),
  Type.Literal('capability'),
  Type.Literal('availability'),
  Type.Literal('request_instructions'),
]);

const DistributionAssetStateSchema = Type.Union([
  Type.Literal('generated'),
  Type.Literal('distributed'),
]);

export const DistributionAssetResponseSchema = Type.Object(
  {
    offeringId: Type.String({ minLength: 1 }),
    publicUrl: Type.String({ format: 'uri' }),
    state: DistributionAssetStateSchema,
  },
  { additionalProperties: false },
);

export const PublishServiceOfferingResponseSchema = Type.Object(
  {
    offering: Type.Object(
      {
        id: Type.String({ minLength: 1 }),
        creatorId: Type.String({ minLength: 1 }),
        state: Type.Literal('published'),
      },
      { additionalProperties: false },
    ),
    distributionAsset: DistributionAssetResponseSchema,
  },
  { additionalProperties: false },
);

export const ServiceOfferingResponseSchema = Type.Object(
  {
    id: Type.String({ minLength: 1 }),
    creatorId: Type.String({ minLength: 1 }),
    capabilityIds: Type.Array(Type.String({ minLength: 1 })),
    title: Type.String({ maxLength: 160 }),
    description: Type.String({ maxLength: 2_000 }),
    availabilityDescription: Type.Optional(Type.String({ minLength: 1, maxLength: 1_000 })),
    requestInstructions: Type.String({ maxLength: 1_000 }),
    state: OfferingStateSchema,
    missingPublishConditions: Type.Array(MissingPublishConditionSchema),
  },
  { additionalProperties: false },
);

export const ServiceOfferingListResponseSchema = Type.Object(
  {
    offerings: Type.Array(ServiceOfferingResponseSchema),
  },
  { additionalProperties: false },
);

export const CreateServiceOfferingRequestSchema = Type.Object(
  {
    capabilityIds: Type.Array(Type.String({ minLength: 1 }), { maxItems: 8 }),
    title: Type.String({ maxLength: 160 }),
    description: Type.String({ maxLength: 2_000 }),
    availabilityDescription: Type.Optional(Type.String({ minLength: 1, maxLength: 1_000 })),
    requestInstructions: Type.String({ maxLength: 1_000 }),
  },
  { additionalProperties: false },
);

export const UpdateServiceOfferingRequestSchema = CreateServiceOfferingRequestSchema;
