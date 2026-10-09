import { Type } from 'typebox';

export const PrivateIdentityViewSchema = Type.Object(
  {
    identityId: Type.String({ minLength: 1 }),
    status: Type.Union([
      Type.Literal('ACTIVE'),
      Type.Literal('SUSPENDED'),
      Type.Literal('ARCHIVED'),
    ]),
    createdAt: Type.String({ minLength: 1 }),
  },
  { additionalProperties: false },
);

export const PrivateCommerceProfileViewSchema = Type.Object(
  {
    commerceProfileId: Type.String({ minLength: 1 }),
    displayName: Type.String({ minLength: 1 }),
    lifecycle: Type.Union([
      Type.Literal('ACTIVE'),
      Type.Literal('SUSPENDED'),
      Type.Literal('ARCHIVED'),
    ]),
    createdAt: Type.String({ minLength: 1 }),
    updatedAt: Type.String({ minLength: 1 }),
    commerceReference: Type.Optional(Type.String({ minLength: 18, maxLength: 18 })),
    commerceReferenceDisplayValue: Type.Optional(Type.String({ minLength: 20, maxLength: 20 })),
  },
  { additionalProperties: false },
);

export const PrivateCommerceProfileListSchema = Type.Object(
  {
    profiles: Type.Array(PrivateCommerceProfileViewSchema),
  },
  { additionalProperties: false },
);

export const PrivateCommerceProfileInputSchema = Type.Object(
  {
    displayName: Type.String({ minLength: 1 }),
  },
  { additionalProperties: false },
);

export const PrivateCommerceReferenceViewSchema = Type.Union(
  [
    Type.Object(
      {
        assignmentStatus: Type.Literal('ASSIGNED'),
        commerceReference: Type.String({ minLength: 18, maxLength: 18 }),
        displayValue: Type.String({ minLength: 20, maxLength: 20 }),
      },
      { additionalProperties: false },
    ),
    Type.Object(
      {
        assignmentStatus: Type.Literal('NOT_ASSIGNED'),
      },
      { additionalProperties: false },
    ),
  ],
  { discriminator: 'assignmentStatus' },
);

export const PrivateExternalPlatformAccountViewSchema = Type.Object(
  {
    externalPlatformAccountId: Type.String({ minLength: 1 }),
    platform: Type.String({ minLength: 1 }),
    platformAccountId: Type.String({ minLength: 1 }),
    lifecycle: Type.Union([
      Type.Literal('ACTIVE'),
      Type.Literal('SUSPENDED'),
      Type.Literal('REVOKED'),
    ]),
  },
  { additionalProperties: false },
);

export const PrivateExternalPlatformAccountListSchema = Type.Object(
  {
    accounts: Type.Array(PrivateExternalPlatformAccountViewSchema),
  },
  { additionalProperties: false },
);

export const PrivateCommerceRelationshipViewSchema = Type.Object(
  {
    relationshipId: Type.String({ minLength: 1 }),
    profile: Type.Object(
      {
        commerceProfileId: Type.String({ minLength: 1 }),
        displayName: Type.String({ minLength: 1 }),
      },
      { additionalProperties: false },
    ),
    externalPlatformAccount: Type.Object(
      {
        platform: Type.String({ minLength: 1 }),
        platformAccountId: Type.String({ minLength: 1 }),
        lifecycle: Type.Union([
          Type.Literal('ACTIVE'),
          Type.Literal('SUSPENDED'),
          Type.Literal('REVOKED'),
        ]),
      },
      { additionalProperties: false },
    ),
    role: Type.Union([
      Type.Literal('OWNER'),
      Type.Literal('MANAGER'),
      Type.Literal('DELEGATED_MANAGER'),
    ]),
    provenance: Type.Union([
      Type.Literal('SELF_DECLARED'),
      Type.Literal('PLATFORM_VERIFIED'),
      Type.Literal('UNKNOWN'),
    ]),
    lifecycle: Type.Union([
      Type.Literal('PROPOSED'),
      Type.Literal('VERIFIED'),
      Type.Literal('ACTIVE'),
      Type.Literal('SUSPENDED'),
      Type.Literal('REVOKED'),
      Type.Literal('HISTORICAL'),
    ]),
    effectiveAt: Type.String({ minLength: 1 }),
    createdAt: Type.String({ minLength: 1 }),
    updatedAt: Type.String({ minLength: 1 }),
  },
  { additionalProperties: false },
);

export const PrivateSelfDeclaredExternalRelationshipInputSchema = Type.Object(
  {
    platform: Type.String({ minLength: 1 }),
    platformAccountId: Type.String({ minLength: 1 }),
    commerceProfileId: Type.String({ minLength: 1 }),
  },
  { additionalProperties: false },
);

export const PrivateSelfDeclaredExternalRelationshipViewSchema = Type.Object(
  {
    externalPlatformAccount: Type.Object(
      {
        platform: Type.String({ minLength: 1 }),
        platformAccountId: Type.String({ minLength: 1 }),
        lifecycle: Type.Union([
          Type.Literal('ACTIVE'),
          Type.Literal('SUSPENDED'),
          Type.Literal('REVOKED'),
        ]),
      },
      { additionalProperties: false },
    ),
    commerceRelationship: Type.Object(
      {
        relationshipId: Type.String({ minLength: 1 }),
        role: Type.Literal('OWNER'),
        lifecycle: Type.Literal('PROPOSED'),
        provenance: Type.Literal('SELF_DECLARED'),
        effectiveAt: Type.String({ minLength: 1 }),
        createdAt: Type.String({ minLength: 1 }),
      },
      { additionalProperties: false },
    ),
  },
  { additionalProperties: false },
);

export const PrivateCommerceRelationshipListSchema = Type.Object(
  {
    relationships: Type.Array(PrivateCommerceRelationshipViewSchema),
  },
  { additionalProperties: false },
);
