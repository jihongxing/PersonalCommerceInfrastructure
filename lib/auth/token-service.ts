import { createHmac, randomBytes } from 'crypto';

/**
 * ========================================================================
 * Token 生成和验证服务
 * ========================================================================
 * 
 * 使用 HS256 (HMAC SHA-256) 生成 JWT Token
 * 支持 AccessToken (短期) 和 RefreshToken (长期)
 */

// ========================================================================
// 配置
// ========================================================================

const TOKEN_CONFIG = {
  // 从环境变量获取，如果不存在使用开发密钥
  JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-key-change-in-production-' + randomBytes(16).toString('hex'),
  
  // Token 过期时间
  ACCESS_TOKEN_EXPIRES_IN: 15 * 60, // 15 分钟 (秒数)
  REFRESH_TOKEN_EXPIRES_IN: 7 * 24 * 60 * 60, // 7 天 (秒数)
  PASSWORD_RESET_TOKEN_EXPIRES_IN: 60 * 60, // 1 小时 (秒数)
};

// ========================================================================
// JWT Payload 定义
// ========================================================================

export interface AccessTokenPayload {
  sub: string; // 用户 ID
  email: string;
  iat: number; // 签发时间
  exp: number; // 过期时间
  type: 'access';
}

export interface RefreshTokenPayload {
  sub: string; // 用户 ID
  iat: number;
  exp: number;
  type: 'refresh';
  jti?: string; // JWT ID (可选，用于撤销)
}

// ========================================================================
// JWT 生成和验证
// ========================================================================

/**
 * Base64URL 编码 (RFC 4648)
 */
function base64urlEncode(data: Buffer): string {
  return data.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Base64URL 解码 (RFC 4648)
 */
function base64urlDecode(data: string): Buffer {
  const base64 = data.replace(/-/g, '+').replace(/_/g, '/');
  const padding = (4 - (base64.length % 4)) % 4;
  return Buffer.from(base64 + '='.repeat(padding), 'base64');
}

/**
 * 创建 JWT Header
 */
function createHeader(): string {
  const header = {
    alg: 'HS256',
    typ: 'JWT',
  };
  return base64urlEncode(Buffer.from(JSON.stringify(header), 'utf-8'));
}

/**
 * 创建 JWT Payload
 */
function createPayload(data: Record<string, unknown>): string {
  return base64urlEncode(Buffer.from(JSON.stringify(data), 'utf-8'));
}

/**
 * 创建签名
 */
function createSignature(data: string, secret: string): string {
  const hmac = createHmac('sha256', secret);
  hmac.update(data);
  return base64urlEncode(hmac.digest());
}

/**
 * 验证签名
 */
function verifySignature(header: string, payload: string, signature: string, secret: string): boolean {
  const expectedSignature = createSignature(`${header}.${payload}`, secret);
  return expectedSignature === signature;
}

// ========================================================================
// Token 生成
// ========================================================================

/**
 * 生成 AccessToken
 * 
 * @param userId 用户 ID
 * @param email 用户邮箱
 * @param expiresIn Token 过期时间 (秒数，可选，默认 15 分钟)
 * @returns JWT Token 字符串
 */
export function generateAccessToken(
  userId: string,
  email: string,
  expiresIn: number = TOKEN_CONFIG.ACCESS_TOKEN_EXPIRES_IN,
): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: AccessTokenPayload = {
    sub: userId,
    email,
    iat: now,
    exp: now + expiresIn,
    type: 'access',
  };

  const header = createHeader();
  const payloadStr = createPayload(payload);
  const signature = createSignature(`${header}.${payloadStr}`, TOKEN_CONFIG.JWT_SECRET);

  return `${header}.${payloadStr}.${signature}`;
}

/**
 * 生成 RefreshToken
 * 
 * @param userId 用户 ID
 * @param expiresIn Token 过期时间 (秒数，可选，默认 7 天)
 * @param jti 可选的 JWT ID (用于撤销)
 * @returns JWT Token 字符串
 */
export function generateRefreshToken(
  userId: string,
  expiresIn: number = TOKEN_CONFIG.REFRESH_TOKEN_EXPIRES_IN,
  jti?: string,
): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: RefreshTokenPayload = {
    sub: userId,
    iat: now,
    exp: now + expiresIn,
    type: 'refresh',
    jti,
  };

  const header = createHeader();
  const payloadStr = createPayload(payload);
  const signature = createSignature(`${header}.${payloadStr}`, TOKEN_CONFIG.JWT_SECRET);

  return `${header}.${payloadStr}.${signature}`;
}

/**
 * 生成密码重置 Token
 * 
 * 注意: 这是一个简单的随机 Token，不是 JWT
 * 存储在数据库中，用于密码重置链接
 */
export function generatePasswordResetToken(): string {
  return randomBytes(32).toString('hex');
}

// ========================================================================
// Token 验证
// ========================================================================

export interface TokenVerifyResult<T> {
  valid: boolean;
  payload?: T;
  error?: string;
}

/**
 * 验证并解析 Token
 */
function verifyAndParseToken<T>(token: string): TokenVerifyResult<T> {
  try {
    const parts = token.split('.');

    if (parts.length !== 3) {
      return {
        valid: false,
        error: 'Invalid token format',
      };
    }

    const [header, payload, signature] = parts;

    // 验证签名
    if (!verifySignature(header, payload, signature, TOKEN_CONFIG.JWT_SECRET)) {
      return {
        valid: false,
        error: 'Invalid signature',
      };
    }

    // 解析 payload
    const decodedPayload = base64urlDecode(payload).toString('utf-8');
    const parsedPayload = JSON.parse(decodedPayload) as T & { exp: number };

    // 检查过期时间
    const now = Math.floor(Date.now() / 1000);
    if (parsedPayload.exp < now) {
      return {
        valid: false,
        error: 'Token expired',
      };
    }

    return {
      valid: true,
      payload: parsedPayload,
    };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * 验证 AccessToken
 */
export function verifyAccessToken(token: string): TokenVerifyResult<AccessTokenPayload> {
  const result = verifyAndParseToken<AccessTokenPayload>(token);

  if (!result.valid) {
    return result;
  }

  if (result.payload?.type !== 'access') {
    return {
      valid: false,
      error: 'Invalid token type',
    };
  }

  return result;
}

/**
 * 验证 RefreshToken
 */
export function verifyRefreshToken(token: string): TokenVerifyResult<RefreshTokenPayload> {
  const result = verifyAndParseToken<RefreshTokenPayload>(token);

  if (!result.valid) {
    return result;
  }

  if (result.payload?.type !== 'refresh') {
    return {
      valid: false,
      error: 'Invalid token type',
    };
  }

  return result;
}

// ========================================================================
// Token 哈希 (用于数据库存储)
// ========================================================================

/**
 * 对 Token 进行哈希处理
 * 用于在数据库中存储 Token 的 Hash，而不是完整 Token
 * 
 * 注意: 这不是加密，是单向哈希
 * 即使数据库被盗，攻击者也无法获得完整的 Token
 */
export function hashToken(token: string): string {
  const hash = createHmac('sha256', TOKEN_CONFIG.JWT_SECRET);
  hash.update(token);
  return hash.digest('hex');
}

/**
 * 验证 Token 与其哈希是否匹配
 */
export function verifyTokenHash(token: string, hash: string): boolean {
  const expectedHash = hashToken(token);
  return expectedHash === hash;
}

// ========================================================================
// Token 配置导出
// ========================================================================

export const getTokenConfig = () => ({
  accessTokenExpiresIn: TOKEN_CONFIG.ACCESS_TOKEN_EXPIRES_IN,
  refreshTokenExpiresIn: TOKEN_CONFIG.REFRESH_TOKEN_EXPIRES_IN,
  passwordResetTokenExpiresIn: TOKEN_CONFIG.PASSWORD_RESET_TOKEN_EXPIRES_IN,
});
