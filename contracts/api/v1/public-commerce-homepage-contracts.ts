import { Type } from 'typebox';

export const HomepageConfigurationSchema = Type.Object(
  {
    state: Type.Union([
      Type.Literal('UNPUBLISHED'),
      Type.Literal('PUBLISHED'),
      Type.Literal('PAUSED'),
    ]),
    commerceProfileId: Type.Union([Type.String(), Type.Null()]),
    commerceProfile: Type.Union([
      Type.Object(
        {
          id: Type.String({ minLength: 1 }),
          displayName: Type.String({ minLength: 1 }),
          lifecycle: Type.Union([
            Type.Literal('ACTIVE'),
            Type.Literal('SUSPENDED'),
            Type.Literal('ARCHIVED'),
          ]),
        },
        { additionalProperties: false },
      ),
      Type.Null(),
    ]),
  },
  { additionalProperties: false },
);

export const PublicHomepageSchema = Type.Object(
  {
    commerceReference: Type.String(),
    displayName: Type.String(),
    offerings: Type.Array(
      Type.Object(
        { id: Type.String(), title: Type.String(), description: Type.String() },
        { additionalProperties: false },
      ),
    ),
  },
  { additionalProperties: false },
);

const ProfileSummarySchema = Type.Union([
  Type.Object(
    {
      id: Type.String({ minLength: 1 }),
      displayName: Type.String({ minLength: 1 }),
      lifecycle: Type.Union([
        Type.Literal('ACTIVE'),
        Type.Literal('SUSPENDED'),
        Type.Literal('ARCHIVED'),
      ]),
    },
    { additionalProperties: false },
  ),
  Type.Null(),
]);

export const HomepageVersionSchema = Type.Object(
  {
    homepageId: Type.String({ minLength: 1 }),
    identityId: Type.String({ minLength: 1 }),
    commerceProfileId: Type.Union([Type.String(), Type.Null()]),
    state: Type.Union([
      Type.Literal('UNPUBLISHED'),
      Type.Literal('PUBLISHED'),
      Type.Literal('PAUSED'),
      Type.Literal('ARCHIVED'),
    ]),
    isDefault: Type.Boolean(),
    createdAt: Type.String(),
    updatedAt: Type.String(),
    commerceProfile: ProfileSummarySchema,
  },
  { additionalProperties: false },
);

export const HomepageWindowSchema = Type.Object(
  {
    windowId: Type.String({ minLength: 1 }),
    identityId: Type.String({ minLength: 1 }),
    homepageId: Type.String({ minLength: 1 }),
    startsAt: Type.String(),
    endsAt: Type.String(),
    timeZone: Type.String({ minLength: 1 }),
    state: Type.Union([Type.Literal('ENABLED'), Type.Literal('DISABLED')]),
    createdAt: Type.String(),
    updatedAt: Type.String(),
  },
  { additionalProperties: false },
);

export const HomepageManagementSchema = Type.Object(
  {
    configuration: HomepageConfigurationSchema,
    versions: Type.Array(HomepageVersionSchema),
    windows: Type.Array(HomepageWindowSchema),
    activeHomepageId: Type.Union([Type.String(), Type.Null()]),
    defaultHomepageId: Type.Union([Type.String(), Type.Null()]),
    nextSwitchAt: Type.Union([Type.String(), Type.Null()]),
  },
  { additionalProperties: false },
);

export const HomepageVersionInputSchema = Type.Object(
  { profileId: Type.String({ minLength: 1, maxLength: 128 }) },
  { additionalProperties: false },
);

export const HomepagePreviewQuerySchema = Type.Object(
  { at: Type.Optional(Type.String({ minLength: 1, maxLength: 64 })) },
  { additionalProperties: false },
);

export const HomepageWindowInputSchema = Type.Object(
  {
    startsAt: Type.String({ minLength: 1, maxLength: 64 }),
    endsAt: Type.String({ minLength: 1, maxLength: 64 }),
    timeZone: Type.String({ minLength: 1, maxLength: 64 }),
  },
  { additionalProperties: false },
);

export const HomepageWindowUpdateSchema = Type.Object(
  {
    startsAt: Type.String({ minLength: 1, maxLength: 64 }),
    endsAt: Type.String({ minLength: 1, maxLength: 64 }),
    timeZone: Type.String({ minLength: 1, maxLength: 64 }),
    state: Type.Union([Type.Literal('ENABLED'), Type.Literal('DISABLED')]),
  },
  { additionalProperties: false },
);
