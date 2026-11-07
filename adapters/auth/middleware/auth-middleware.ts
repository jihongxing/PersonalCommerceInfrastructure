import type { FastifyRequest } from 'fastify';
import { ApplicationError } from '../../applications/core/application-error.js';
import { extractBearerToken } from '../auth/transport/bearer-token.js';
import { verifyAccessToken } from '../../lib/auth/token-service.js';

/**
 * ========================================================================
 * 认证中间件
 * ========================================================================
 * 
 * 用于验证 HTTP 请求中的 AccessToken
 * 在所有需要认证的端点前执行
 */

export interface AuthenticatedRequest extends FastifyRequest {
  userId?: string;
  userEmail?: string;
}

/**
 * 认证中间件
 * 
 * 功能:
 * 1. 从 Authorization 头提取 Bearer Token
 * 2. 验证 Token 签名和过期时间
 * 3. 将用户信息附加到 request 对象
 * 
 * 使用示例:
 * ```typescript
 * server.get(
 *   '/api/v1/protected-route',
 *   { preHandler: authenticateRequest },
 *   handler
 * );
 * ```
 */
export async function authenticateRequest(request: AuthenticatedRequest): Promise<void> {
  // 1. 提取 Bearer Token
  const token = extractBearerToken(request.headers.authorization);

  // 2. 验证 Token
  const result = verifyAccessToken(token);

  if (!result.valid) {
    throw new ApplicationError({
      category: 'authentication',
      code: 'invalid_token',
      message: result.error || 'Invalid access token',
      statusCode: 401,
    });
  }

  // 3. 提取用户信息
  const payload = result.payload!;
  request.userId = payload.sub;
  request.userEmail = payload.email;
}

/**
 * 获取认证的用户 ID
 * 
 * @param request 认证后的请求对象
 * @returns 用户 ID
 * @throws 如果用户未认证
 */
export function getAuthenticatedUserId(request: AuthenticatedRequest): string {
  if (!request.userId) {
    throw new ApplicationError({
      category: 'authentication',
      code: 'missing_auth_context',
      message: 'User context not found',
      statusCode: 401,
    });
  }

  return request.userId;
}

/**
 * 获取认证的用户邮箱
 * 
 * @param request 认证后的请求对象
 * @returns 用户邮箱
 * @throws 如果用户未认证
 */
export function getAuthenticatedUserEmail(request: AuthenticatedRequest): string {
  if (!request.userEmail) {
    throw new ApplicationError({
      category: 'authentication',
      code: 'missing_auth_context',
      message: 'User context not found',
      statusCode: 401,
    });
  }

  return request.userEmail;
}

/**
 * 创建可选的认证中间件
 * 
 * 如果提供了 Authorization 头，则验证 Token
 * 如果没有提供，则继续执行（不抛出错误）
 * 
 * 使用场景: 公共端点但可以接收认证用户信息
 */
export async function authenticateRequestOptional(
  request: AuthenticatedRequest,
): Promise<void> {
  const authHeader = request.headers.authorization;

  if (!authHeader) {
    // 没有提供 Authorization 头，继续
    return;
  }

  try {
    // 尝试验证 Token
    const token = extractBearerToken(authHeader);
    const result = verifyAccessToken(token);

    if (result.valid && result.payload) {
      // 成功验证，附加用户信息
      request.userId = result.payload.sub;
      request.userEmail = result.payload.email;
    }
    // 如果验证失败但有 token，忽略错误，继续
  } catch (error) {
    // 忽略提取或验证中的错误，继续
  }
}
