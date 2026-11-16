import { Type } from 'typebox';

const OfferingStateSchema = Type.Union([
  Type.Literal('draft'),
  Type.Literal('published'),
  Type.Literal('unpublished'),
  Type.Literal('archived'),
]);

const PolicyStatusSchema = Type.Union([
  Type.Literal('not_checked'),
  Type.Literal('auto_approved'),
  Type.Literal('review_required'),
  Type.Literal('approved'),
  Type.Literal('rejected'),
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

const AppearanceOfferingSchema = Type.Object(
  {
    appearanceType: Type.Union([
      Type.Literal('convention'),
      Type.Literal('guest'),
      Type.Literal('brand'),
      Type.Literal('photo'),
      Type.Literal('signing'),
    ]),
    startsOn: Type.String({ format: 'date' }),
    endsOn: Type.Optional(Type.String({ format: 'date' })),
    locationDescription: Type.String({ minLength: 1, maxLength: 500 }),
    buyerType: Type.Union([
      Type.Literal('organizer'),
      Type.Literal('brand'),
      Type.Literal('fan_group'),
      Type.Literal('approved_external_requester'),
    ]),
    pricingRule: Type.Optional(Type.String({ minLength: 1, maxLength: 500 })),
    requestCallToAction: Type.String({ minLength: 1, maxLength: 240 }),
    upcomingTitle: Type.Optional(Type.String({ minLength: 1, maxLength: 240 })),
    externalUrl: Type.Optional(Type.String({ format: 'uri', maxLength: 2_048 })),
  },
  { additionalProperties: false },
);

export const DistributionAssetResponseSchema = Type.Object(
  {
    offeringId: Type.String({ minLength: 1 }),
    publicUrl: Type.String({ format: 'uri' }),
    state: DistributionAssetStateSchema,
  },
  { additionalProperties: false },
);

export const OptionalDistributionAssetResponseSchema = Type.Union([
  DistributionAssetResponseSchema,
  Type.Null(),
]);

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
    templateId: Type.Optional(Type.String({ minLength: 1, maxLength: 128 })),
    title: Type.String({ maxLength: 160 }),
    description: Type.String({ maxLength: 2_000 }),
    availabilityDescription: Type.Optional(Type.String({ minLength: 1, maxLength: 1_000 })),
    appearance: Type.Optional(AppearanceOfferingSchema),
    requestInstructions: Type.String({ maxLength: 1_000 }),
    state: OfferingStateSchema,
    policyStatus: PolicyStatusSchema,
    policyReason: Type.Optional(Type.String({ maxLength: 1_000 })),
    policyVersion: Type.Optional(Type.String({ maxLength: 32 })),
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
    templateId: Type.Optional(Type.String({ minLength: 1, maxLength: 128 })),
    title: Type.String({ maxLength: 160 }),
    description: Type.String({ maxLength: 2_000 }),
    availabilityDescription: Type.Optional(Type.String({ minLength: 1, maxLength: 1_000 })),
    appearance: Type.Optional(AppearanceOfferingSchema),
    requestInstructions: Type.String({ maxLength: 1_000 }),
  },
  { additionalProperties: false },
);

// Omission preserves existing Appearance; a supplied object replaces it. There
// is no null/partial-object clearing operation in this contract.
export const UpdateServiceOfferingRequestSchema = CreateServiceOfferingRequestSchema;
