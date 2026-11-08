import { Type } from 'typebox';

const SocialLinkSchema = Type.String({ minLength: 1, maxLength: 512 });

const CompleteCommerceIdentityProfileSchema = Type.Object(
  {
    displayName: Type.String({ minLength: 1, maxLength: 120 }),
    bio: Type.String({ minLength: 1, maxLength: 2_000 }),
    avatarUrl: Type.Optional(Type.String({ minLength: 1, maxLength: 2_048 })),
    location: Type.Optional(Type.String({ minLength: 1, maxLength: 120 })),
    socialLinks: Type.Array(SocialLinkSchema, { maxItems: 8 }),
  },
  { additionalProperties: false },
);

export const CommerceIdentityProfileSchema = Type.Object(
  {
    ...CompleteCommerceIdentityProfileSchema.properties,
    displayName: Type.String({ maxLength: 120 }),
    bio: Type.String({ maxLength: 2_000 }),
  },
  { additionalProperties: false },
);

export const CapabilitySchema = Type.Object(
  {
    id: Type.String({ minLength: 1 }),
    name: Type.String({ minLength: 1, maxLength: 120 }),
    description: Type.String({ minLength: 1, maxLength: 1_000 }),
  },
  { additionalProperties: false },
);

export const CommerceIdentityResponseSchema = Type.Object(
  {
    creatorId: Type.String({ minLength: 1 }),
    profile: CommerceIdentityProfileSchema,
    capabilityIds: Type.Array(Type.String({ minLength: 1 })),
    capabilities: Type.Array(CapabilitySchema),
    state: Type.Union([
      Type.Literal('draft'),
      Type.Literal('published'),
      Type.Literal('unpublished'),
    ]),
  },
  { additionalProperties: false },
);

export const CreateCommerceIdentityRequestSchema = Type.Object(
  {
    profile: CompleteCommerceIdentityProfileSchema,
  },
  { additionalProperties: false },
);

export const UpdateCommerceIdentityRequestSchema = CreateCommerceIdentityRequestSchema;

export const AddCapabilityRequestSchema = Type.Object(
  {
    name: Type.String({ minLength: 1, maxLength: 120 }),
    description: Type.String({ minLength: 1, maxLength: 1_000 }),
  },
  { additionalProperties: false },
);
