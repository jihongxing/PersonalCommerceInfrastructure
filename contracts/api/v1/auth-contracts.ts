import { Type } from 'typebox';

/**
 * ========================================================================
 * 认证系统 API 合约
 * ========================================================================
 * 
 * 定义所有认证相关的 API 端点的请求/响应格式
 * 使用 Typebox 用于运行时验证和类型生成
 * 
 * 端点列表:
 *   1. POST   /api/v1/auth/signup - 用户注册
 *   2. POST   /api/v1/auth/login - 用户登陆
 *   3. POST   /api/v1/auth/refresh - Token 刷新
 *   4. POST   /api/v1/auth/logout - 用户登出
 *   5. POST   /api/v1/auth/forgot-password - 忘记密码
 *   6. POST   /api/v1/auth/reset-password - 重置密码
 */

// ========================================================================
// 错误代码定义
// ========================================================================

export const AuthenticationErrorCodes = [
  'missing_authorization',
  'invalid_authorization',
  'missing_access_token',
  'invalid_access_token',
  'creator_actor_not_mapped',
  'invalid_credentials',
  'user_not_found',
  'user_already_exists',
  'invalid_token',
  'token_expired',
  'weak_password',
  'invalid_email_format',
] as const;

export type AuthenticationErrorCode = (typeof AuthenticationErrorCodes)[number];

export const AuthorizationHeaderSchema = Type.String({
  pattern: '^Bearer\\s+\\S+$',
  minLength: 8,
});

// ========================================================================
// 用户信息 Schema
// ========================================================================

export const UserInfoSchema = Type.Object(
  {
    id: Type.String({ minLength: 1, maxLength: 36 }),
    email: Type.String({ format: 'email' }),
    name: Type.Optional(Type.String({ minLength: 1, maxLength: 120 })),
    createdAt: Type.String({ format: 'date-time' }),
  },
  { additionalProperties: false }
);

// ========================================================================
// Token Schema
// ========================================================================

export const TokenResponseSchema = Type.Object(
  {
    accessToken: Type.String({ minLength: 20 }),
    refreshToken: Type.String({ minLength: 20 }),
    expiresIn: Type.Number({ minimum: 60 }), // 秒数
  },
  { additionalProperties: false }
);

export const AuthResponseSchema = Type.Object(
  {
    accessToken: Type.String({ minLength: 20 }),
    refreshToken: Type.String({ minLength: 20 }),
    user: UserInfoSchema,
    setupPending: Type.Optional(Type.Boolean()),
    expiresIn: Type.Number({ minimum: 60 }),
  },
  { additionalProperties: false }
);

// ========================================================================
// 1. POST /api/v1/auth/signup - 用户注册
// ========================================================================

export const SignUpRequestSchema = Type.Object(
  {
    email: Type.String({ format: 'email', maxLength: 255 }),
    password: Type.String({ minLength: 8, maxLength: 128 }),
    name: Type.Optional(Type.String({ minLength: 1, maxLength: 120 })),
  },
  { additionalProperties: false }
);

export type SignUpRequest = {
  email: string;
  password: string;
  name?: string;
};

export const SignUpResponseSchema = AuthResponseSchema;

export type SignUpResponse = {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name?: string;
    createdAt: string;
  };
  expiresIn: number;
};

// ========================================================================
// 2. POST /api/v1/auth/login - 用户登陆
// ========================================================================

export const LoginRequestSchema = Type.Object(
  {
    email: Type.String({ format: 'email', maxLength: 255 }),
    password: Type.String({ minLength: 1, maxLength: 128 }),
  },
  { additionalProperties: false }
);

export type LoginRequest = {
  email: string;
  password: string;
};

export const LoginResponseSchema = AuthResponseSchema;

export type LoginResponse = SignUpResponse;

// ========================================================================
// 3. POST /api/v1/auth/refresh - Token 刷新
// ========================================================================

export const RefreshTokenRequestSchema = Type.Object(
  {
    refreshToken: Type.String({ minLength: 20 }),
  },
  { additionalProperties: false }
);

export type RefreshTokenRequest = {
  refreshToken: string;
};

export const RefreshTokenResponseSchema = TokenResponseSchema;

export type RefreshTokenResponse = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};

// ========================================================================
// 4. POST /api/v1/auth/logout - 用户登出
// ========================================================================

export const LogoutRequestSchema = Type.Object(
  {
    refreshToken: Type.Optional(Type.String({ minLength: 20 })),
  },
  { additionalProperties: false }
);

export type LogoutRequest = {
  refreshToken?: string;
};

export const LogoutResponseSchema = Type.Object(
  {
    ok: Type.Boolean(),
  },
  { additionalProperties: false }
);

export type LogoutResponse = {
  ok: boolean;
};

// ========================================================================
// 5. POST /api/v1/auth/forgot-password - 忘记密码
// ========================================================================

export const ForgotPasswordRequestSchema = Type.Object(
  {
    email: Type.String({ format: 'email', maxLength: 255 }),
  },
  { additionalProperties: false }
);

export type ForgotPasswordRequest = {
  email: string;
};

export const ForgotPasswordResponseSchema = Type.Object(
  {
    ok: Type.Boolean(),
    message: Type.String(),
  },
  { additionalProperties: false }
);

export type ForgotPasswordResponse = {
  ok: boolean;
  message: string;
};

// ========================================================================
// 6. POST /api/v1/auth/reset-password - 重置密码
// ========================================================================

export const ResetPasswordRequestSchema = Type.Object(
  {
    token: Type.String({ minLength: 32, maxLength: 255 }),
    newPassword: Type.String({ minLength: 8, maxLength: 128 }),
  },
  { additionalProperties: false }
);

export type ResetPasswordRequest = {
  token: string;
  newPassword: string;
};

export const ResetPasswordResponseSchema = Type.Object(
  {
    ok: Type.Boolean(),
  },
  { additionalProperties: false }
);

export type ResetPasswordResponse = {
  ok: boolean;
};
