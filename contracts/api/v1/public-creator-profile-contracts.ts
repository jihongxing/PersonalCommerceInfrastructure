import { Type } from 'typebox';

/**
 * 公开的 Creator Profile 视图
 * 通过 Commerce Reference (C号) 访问
 */
export const PublicCreatorProfileSchema = Type.Object(
  {
    commerceReference: Type.String({ minLength: 18, maxLength: 18 }),
    displayName: Type.String({ minLength: 1 }),
    // 未来可扩展: bio, avatarUrl 等
  },
  { additionalProperties: false },
);

/**
 * 公开的 Creator Profile 响应（包含 Offerings）
 */
export const PublicCreatorProfileResponseSchema = Type.Object(
  {
    profile: PublicCreatorProfileSchema,
    offerings: Type.Array(
      Type.Object({
        id: Type.String({ minLength: 1 }),
        title: Type.String({ maxLength: 160 }),
        description: Type.String({ maxLength: 2_000 }),
        // 注意：公开 API 不暴露 creatorId
      }),
    ),
  },
  { additionalProperties: false },
);
