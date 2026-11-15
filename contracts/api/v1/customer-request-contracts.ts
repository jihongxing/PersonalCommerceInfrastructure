import { Type } from 'typebox';

const PublicAppearanceOfferingSchema = Type.Object(
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
    upcomingTitle: Type.String({ minLength: 1, maxLength: 240 }),
    externalUrl: Type.Optional(Type.String({ format: 'uri', maxLength: 2_048 })),
  },
  { additionalProperties: false },
);

export const PublicOfferingResponseSchema = Type.Object(
  {
    creator: Type.Object(
      {
        displayName: Type.String({ minLength: 1, maxLength: 120 }),
        bio: Type.String({ minLength: 1, maxLength: 2_000 }),
        capabilityNames: Type.Array(Type.String({ minLength: 1, maxLength: 120 })),
      },
      { additionalProperties: false },
    ),
    offering: Type.Object(
      {
        id: Type.String({ minLength: 1 }),
        title: Type.String({ minLength: 1, maxLength: 160 }),
        description: Type.String({ minLength: 1, maxLength: 2_000 }),
        availabilityDescription: Type.String({ minLength: 1, maxLength: 1_000 }),
        appearance: Type.Optional(PublicAppearanceOfferingSchema),
        requestInstructions: Type.String({ minLength: 1, maxLength: 1_000 }),
      },
      { additionalProperties: false },
    ),
  },
  { additionalProperties: false },
);

export const SubmitCustomerRequestSchema = Type.Object(
  {
    contactName: Type.String({ minLength: 1, maxLength: 160 }),
    contactMethod: Type.String({ minLength: 1, maxLength: 320 }),
    requestMessage: Type.String({ minLength: 1, maxLength: 2_000 }),
  },
  { additionalProperties: false },
);

export const CustomerRequestResultSchema = Type.Object(
  {
    actionId: Type.String({ minLength: 1 }),
    resultAccessToken: Type.String({ minLength: 1 }),
    state: Type.Union([
      Type.Literal('submitted'),
      Type.Literal('confirmed'),
      Type.Literal('declined'),
    ]),
    message: Type.String({ minLength: 1 }),
  },
  { additionalProperties: false },
);

export const CreatorSubmittedRequestSchema = Type.Object(
  {
    action: Type.Object(
      {
        id: Type.String({ minLength: 1 }),
        customerId: Type.String({ minLength: 1 }),
        creatorId: Type.String({ minLength: 1 }),
        offeringId: Type.String({ minLength: 1 }),
        requestMessage: Type.String({ minLength: 1 }),
        resultAccessToken: Type.String({ minLength: 1 }),
        state: Type.Literal('submitted'),
      },
      { additionalProperties: false },
    ),
    customer: Type.Object(
      {
        id: Type.String({ minLength: 1 }),
        contactName: Type.String({ minLength: 1 }),
        contactMethod: Type.String({ minLength: 1 }),
      },
      { additionalProperties: false },
    ),
    offering: Type.Object(
      {
        id: Type.String({ minLength: 1 }),
        title: Type.String({ minLength: 1 }),
      },
      { additionalProperties: false },
    ),
  },
  { additionalProperties: false },
);

export const CreatorSubmittedRequestListSchema = Type.Object(
  { requests: Type.Array(CreatorSubmittedRequestSchema) },
  { additionalProperties: false },
);

export const CreatorConfirmedRequestSchema = Type.Object(
  {
    action: Type.Object(
      {
        id: Type.String({ minLength: 1 }),
        customerId: Type.String({ minLength: 1 }),
        creatorId: Type.String({ minLength: 1 }),
        offeringId: Type.String({ minLength: 1 }),
        requestMessage: Type.String({ minLength: 1 }),
        resultAccessToken: Type.String({ minLength: 1 }),
        state: Type.Literal('confirmed'),
      },
      { additionalProperties: false },
    ),
    customer: Type.Object(
      {
        id: Type.String({ minLength: 1 }),
        contactName: Type.String({ minLength: 1 }),
        contactMethod: Type.String({ minLength: 1 }),
      },
      { additionalProperties: false },
    ),
    offering: Type.Object(
      {
        id: Type.String({ minLength: 1 }),
        title: Type.String({ minLength: 1 }),
      },
      { additionalProperties: false },
    ),
  },
  { additionalProperties: false },
);

export const CreatorConfirmedRequestListSchema = Type.Object(
  { requests: Type.Array(CreatorConfirmedRequestSchema) },
  { additionalProperties: false },
);

export const CreatorDecisionResponseSchema = Type.Object(
  {
    actionId: Type.String({ minLength: 1 }),
    state: Type.Union([Type.Literal('confirmed'), Type.Literal('declined')]),
    resultAccessToken: Type.String({ minLength: 1 }),
  },
  { additionalProperties: false },
);
