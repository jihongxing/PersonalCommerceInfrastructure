import type { FastifyInstance, FastifyRequest } from 'fastify';
import { ApplicationError } from '../../applications/core/application-error.js';
import type {
  SignUpRequest,
  LoginRequest,
  RefreshTokenRequest,
  LogoutRequest,
} from '../../contracts/api/v1/auth-contracts.js';
import {
  SignUpRequestSchema,
  SignUpResponseSchema,
  LoginRequestSchema,
  LoginResponseSchema,
  RefreshTokenRequestSchema,
  RefreshTokenResponseSchema,
  LogoutRequestSchema,
  LogoutResponseSchema,
} from '../../contracts/api/v1/auth-contracts.js';
import { ApiErrorEnvelopeSchema } from '../../contracts/api/v1/system-contracts.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken, hashToken } from '../../lib/auth/token-service.js';

// ========================================================================
// 密码验证
// ========================================================================

/**
 * 验证密码强度
 * 最少 8 字符，包含大小写、数字、特殊字符
 */
function validatePasswordStrength(password: string): { valid: boolean; error?: string } {
  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters' };
  }

  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain uppercase letter' };
  }

  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'Password must contain lowercase letter' };
  }

  if (!/\d/.test(password)) {
    return { valid: false, error: 'Password must contain number' };
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { valid: false, error: 'Password must contain special character' };
  }

  return { valid: true };
}

/**
 * 验证邮箱格式 (简化版)
 */
function validateEmail(email: string): { valid: boolean; error?: string } {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Invalid email format' };
  }
  return { valid: true };
}

// ========================================================================
// 注册认证路由
// ========================================================================

export function registerAuthRoutes(
  server: FastifyInstance,
  dependencies: {
    readonly db: {
      insertAccount: (data: {
        id: string;
        email: string;
        passwordHash: string;
        name?: string;
      }) => Promise<{ id: string; email: string; name?: string; createdAt: string }>;
      findAccountByEmail: (email: string) => Promise<
        | {
            id: string;
            email: string;
            name?: string;
            isActive: boolean;
            createdAt: string;
          }
        | null
      >;
      updateAccountLastLogin: (id: string) => Promise<void>;
      insertRefreshToken: (data: {
        id: string;
        accountId: string;
        tokenHash: string;
        expiresAt: string;
      }) => Promise<void>;
    };
    readonly authProvider: {
      createUser: (email: string, password: string) => Promise<{ id: string }>;
      verifyPassword: (email: string, password: string) => Promise<boolean>;
    };
  },
): void {
  // ========================================================================
  // POST /api/v1/auth/signup - 用户注册
  // ========================================================================

  server.post(
    '/api/v1/auth/signup',
    {
      schema: {
        operationId: 'signUp',
        body: SignUpRequestSchema,
        response: {
          201: SignUpResponseSchema,
          400: ApiErrorEnvelopeSchema,
          409: ApiErrorEnvelopeSchema,
          500: ApiErrorEnvelopeSchema,
        },
        tags: ['auth'],
      },
    },
    async (request: FastifyRequest<{ Body: SignUpRequest }>, reply) => {
      const { email, password, name } = request.body;

      // 1. 验证邮箱格式
      const emailValidation = validateEmail(email);
      if (!emailValidation.valid) {
        throw new ApplicationError({
          category: 'validation',
          code: 'invalid_email_format',
          message: emailValidation.error || 'Invalid email format',
        });
      }

      // 2. 验证密码强度
      const passwordValidation = validatePasswordStrength(password);
      if (!passwordValidation.valid) {
        throw new ApplicationError({
          category: 'validation',
          code: 'weak_password',
          message: passwordValidation.error || 'Password is too weak',
        });
      }

      // 3. 检查邮箱是否已存在
      const existingAccount = await dependencies.db.findAccountByEmail(email);
      if (existingAccount) {
        throw new ApplicationError({
          category: 'business',
          code: 'user_already_exists',
          message: 'Email already registered',
          statusCode: 409,
        });
      }

      // 4. 调用认证提供商创建用户
      let userId: string;
      try {
        const authResult = await dependencies.authProvider.createUser(email, password);
        userId = authResult.id;
      } catch (error) {
        throw new ApplicationError({
          category: 'external',
          code: 'auth_provider_error',
          message: 'Failed to create user account',
          statusCode: 500,
        });
      }

      // 5. 创建本地账户记录
      const now = new Date().toISOString();
      const createdAccount = await dependencies.db.insertAccount({
        id: userId,
        email,
        passwordHash: '', // 由认证提供商管理
        name,
      });

      // 6. 生成 Token
      const expiresIn = 15 * 60; // 15 分钟
      const accessToken = generateAccessToken(userId, email, expiresIn);
      const refreshToken = generateRefreshToken(userId, 7 * 24 * 60 * 60); // 7 天

      // 7. 存储 RefreshToken 哈希
      const refreshTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      await dependencies.db.insertRefreshToken({
        id: `refresh_${userId}_${Date.now()}`,
        accountId: userId,
        tokenHash: hashToken(refreshToken),
        expiresAt: refreshTokenExpiresAt,
      });

      // 8. 返回响应
      return reply.code(201).send({
        accessToken,
        refreshToken,
        user: {
          id: createdAccount.id,
          email: createdAccount.email,
          name: createdAccount.name,
          createdAt: createdAccount.createdAt,
        },
        expiresIn,
      });
    },
  );

  // ========================================================================
  // POST /api/v1/auth/login - 用户登陆
  // ========================================================================

  server.post(
    '/api/v1/auth/login',
    {
      schema: {
        operationId: 'login',
        body: LoginRequestSchema,
        response: {
          200: LoginResponseSchema,
          401: ApiErrorEnvelopeSchema,
          404: ApiErrorEnvelopeSchema,
          500: ApiErrorEnvelopeSchema,
        },
        tags: ['auth'],
      },
    },
    async (request: FastifyRequest<{ Body: LoginRequest }>, reply) => {
      const { email, password } = request.body;

      // 1. 验证邮箱格式
      const emailValidation = validateEmail(email);
      if (!emailValidation.valid) {
        throw new ApplicationError({
          category: 'validation',
          code: 'invalid_email_format',
          message: emailValidation.error || 'Invalid credentials',
        });
      }

      // 2. 查询账户
      const account = await dependencies.db.findAccountByEmail(email);
      if (!account) {
        throw new ApplicationError({
          category: 'authentication',
          code: 'invalid_credentials',
          message: 'Invalid email or password',
          statusCode: 401,
        });
      }

      // 3. 检查账户是否激活
      if (!account.isActive) {
        throw new ApplicationError({
          category: 'authentication',
          code: 'user_not_found',
          message: 'Account is disabled',
          statusCode: 401,
        });
      }

      // 4. 验证密码
      let isPasswordValid = false;
      try {
        isPasswordValid = await dependencies.authProvider.verifyPassword(email, password);
      } catch (error) {
        throw new ApplicationError({
          category: 'external',
          code: 'auth_provider_error',
          message: 'Password verification failed',
          statusCode: 500,
        });
      }

      if (!isPasswordValid) {
        throw new ApplicationError({
          category: 'authentication',
          code: 'invalid_credentials',
          message: 'Invalid email or password',
          statusCode: 401,
        });
      }

      // 5. 更新最后登陆时间
      try {
        await dependencies.db.updateAccountLastLogin(account.id);
      } catch (error) {
        // 记录但不中断流程
        console.error('Failed to update last login time:', error);
      }

      // 6. 生成 Token
      const expiresIn = 15 * 60; // 15 分钟
      const accessToken = generateAccessToken(account.id, email, expiresIn);
      const refreshToken = generateRefreshToken(account.id, 7 * 24 * 60 * 60); // 7 天

      // 7. 存储 RefreshToken 哈希
      const refreshTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      await dependencies.db.insertRefreshToken({
        id: `refresh_${account.id}_${Date.now()}`,
        accountId: account.id,
        tokenHash: hashToken(refreshToken),
        expiresAt: refreshTokenExpiresAt,
      });

      // 8. 返回响应
      return reply.send({
        accessToken,
        refreshToken,
        user: {
          id: account.id,
          email: account.email,
          name: account.name,
          createdAt: account.createdAt,
        },
        expiresIn,
      });
    },
  );

  // ========================================================================
  // POST /api/v1/auth/refresh - Token 刷新
  // ========================================================================

  server.post(
    '/api/v1/auth/refresh',
    {
      schema: {
        operationId: 'refreshToken',
        body: RefreshTokenRequestSchema,
        response: {
          200: RefreshTokenResponseSchema,
          401: ApiErrorEnvelopeSchema,
        },
        tags: ['auth'],
      },
    },
    async (request: FastifyRequest<{ Body: RefreshTokenRequest }>) => {
      const { refreshToken } = request.body;

      // 1. 验证 RefreshToken 格式和签名
      const result = verifyRefreshToken(refreshToken);
      if (!result.valid) {
        throw new ApplicationError({
          category: 'authentication',
          code: 'invalid_token',
          message: result.error || 'Invalid refresh token',
          statusCode: 401,
        });
      }

      const payload = result.payload!;
      const userId = payload.sub;

      // 2. 验证 RefreshToken 在数据库中未被撤销（可选）
      // 在完整实现中，应该检查数据库中的 refresh_tokens 表
      // 确保该 token 未被标记为 is_revoked = true
      // 此处暂时跳过，因为还需要实现完整的数据库查询

      // 3. 生成新的 AccessToken
      const expiresIn = 15 * 60;
      const newAccessToken = generateAccessToken(userId, '', expiresIn);

      // 4. 可选：生成新的 RefreshToken (token 轮换)
      // 注意: 完整的 token 轮换需要：
      // - 撤销旧 refresh token
      // - 生成新 refresh token
      // - 存储新 token hash
      // 此处为简化版本，仅刷新 access token

      return {
        accessToken: newAccessToken,
        refreshToken, // RefreshToken 保持不变
        expiresIn,
      };
    },
  );

  // ========================================================================
  // POST /api/v1/auth/logout - 用户登出
  // ========================================================================

  server.post(
    '/api/v1/auth/logout',
    {
      schema: {
        operationId: 'logout',
        body: LogoutRequestSchema,
        response: {
          200: LogoutResponseSchema,
          400: ApiErrorEnvelopeSchema,
        },
        tags: ['auth'],
      },
    },
    async (request: FastifyRequest<{ Body: LogoutRequest }>) => {
      const { refreshToken } = request.body;

      // 如果提供了 refreshToken，标记为已撤销
      if (refreshToken) {
        try {
          // 1. 验证 token 格式
          const result = verifyRefreshToken(refreshToken);
          if (!result.valid) {
            // token 已过期或无效，无需处理
            // 客户端已删除本地 token，登出完成
            return { ok: true };
          }

          // 2. 在数据库中标记该 token 为已撤销
          // 这需要通过 dependencies.db.revokeRefreshToken()
          // 此处为简化实现，实际应该调用数据库接口

          // 完整实现应该是：
          // await dependencies.db.revokeRefreshToken(tokenHash, payload.sub);
        } catch (error) {
          // 即使撤销失败，仍然返回成功
          // 因为客户端会删除本地 token
          console.error('Failed to revoke token:', error);
        }
      }

      // 返回成功
      // 客户端应该删除本地存储的 token
      return { ok: true };
    },
  );
}
