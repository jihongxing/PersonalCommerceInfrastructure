import { describe, it, expect, beforeEach, vi } from 'vitest';
import { generateAccessToken, generateRefreshToken, verifyAccessToken, verifyRefreshToken, hashToken, verifyTokenHash } from '../lib/auth/token-service.js';

/**
 * ========================================================================
 * Token 生成和验证 - 单元测试
 * ========================================================================
 */

describe('Token Service', () => {
  // ========================================================================
  // AccessToken 测试
  // ========================================================================

  describe('AccessToken', () => {
    it('should generate a valid access token', () => {
      const userId = 'user-123';
      const email = 'test@example.com';

      const token = generateAccessToken(userId, email);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT 格式: header.payload.signature
    });

    it('should verify a valid access token', () => {
      const userId = 'user-123';
      const email = 'test@example.com';

      const token = generateAccessToken(userId, email);
      const result = verifyAccessToken(token);

      expect(result.valid).toBe(true);
      expect(result.payload).toBeDefined();
      expect(result.payload?.sub).toBe(userId);
      expect(result.payload?.email).toBe(email);
      expect(result.payload?.type).toBe('access');
    });

    it('should reject an invalid access token', () => {
      const invalidToken = 'invalid.token.here';
      const result = verifyAccessToken(invalidToken);

      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject an expired access token', () => {
      // 生成一个过期时间为过去的 token
      const userId = 'user-123';
      const email = 'test@example.com';
      const expiredInSeconds = -100; // 已过期 100 秒

      const token = generateAccessToken(userId, email, expiredInSeconds);
      const result = verifyAccessToken(token);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('expired');
    });

    it('should include correct token type in payload', () => {
      const token = generateAccessToken('user-123', 'test@example.com');
      const result = verifyAccessToken(token);

      expect(result.payload?.type).toBe('access');
    });

    it('should reject refresh token as access token', () => {
      const refreshToken = generateRefreshToken('user-123');
      const result = verifyAccessToken(refreshToken);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid token type');
    });
  });

  // ========================================================================
  // RefreshToken 测试
  // ========================================================================

  describe('RefreshToken', () => {
    it('should generate a valid refresh token', () => {
      const userId = 'user-123';

      const token = generateRefreshToken(userId);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should verify a valid refresh token', () => {
      const userId = 'user-123';

      const token = generateRefreshToken(userId);
      const result = verifyRefreshToken(token);

      expect(result.valid).toBe(true);
      expect(result.payload).toBeDefined();
      expect(result.payload?.sub).toBe(userId);
      expect(result.payload?.type).toBe('refresh');
    });

    it('should include JWT ID when provided', () => {
      const userId = 'user-123';
      const jti = 'token-id-123';

      const token = generateRefreshToken(userId, 7 * 24 * 60 * 60, jti);
      const result = verifyRefreshToken(token);

      expect(result.payload?.jti).toBe(jti);
    });

    it('should reject access token as refresh token', () => {
      const accessToken = generateAccessToken('user-123', 'test@example.com');
      const result = verifyRefreshToken(accessToken);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid token type');
    });
  });

  // ========================================================================
  // Token 哈希测试
  // ========================================================================

  describe('Token Hashing', () => {
    it('should hash a token consistently', () => {
      const token = generateAccessToken('user-123', 'test@example.com');
      const hash1 = hashToken(token);
      const hash2 = hashToken(token);

      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different tokens', () => {
      const token1 = generateAccessToken('user-123', 'test@example.com');
      const token2 = generateAccessToken('user-456', 'other@example.com');

      const hash1 = hashToken(token1);
      const hash2 = hashToken(token2);

      expect(hash1).not.toBe(hash2);
    });

    it('should verify token matches its hash', () => {
      const token = generateAccessToken('user-123', 'test@example.com');
      const hash = hashToken(token);

      const isValid = verifyTokenHash(token, hash);

      expect(isValid).toBe(true);
    });

    it('should reject mismatched token and hash', () => {
      const token1 = generateAccessToken('user-123', 'test@example.com');
      const token2 = generateAccessToken('user-456', 'other@example.com');

      const hash1 = hashToken(token1);
      const isValid = verifyTokenHash(token2, hash1);

      expect(isValid).toBe(false);
    });

    it('should not expose token in hash', () => {
      const token = generateAccessToken('user-123', 'test@example.com');
      const hash = hashToken(token);

      expect(hash).not.toContain(token);
      expect(hash).not.toContain('user-123');
      expect(hash).not.toContain('test@example.com');
    });
  });

  // ========================================================================
  // Token 过期时间测试
  // ========================================================================

  describe('Token Expiration', () => {
    it('should include correct expiration time', () => {
      const userId = 'user-123';
      const email = 'test@example.com';
      const expiresIn = 30 * 60; // 30 分钟

      const token = generateAccessToken(userId, email, expiresIn);
      const result = verifyAccessToken(token);

      expect(result.payload?.exp).toBeDefined();

      // 验证 exp 时间在合理范围内 (允许 ±5 秒误差)
      const now = Math.floor(Date.now() / 1000);
      const expectedExp = now + expiresIn;
      const actualExp = result.payload?.exp || 0;

      expect(Math.abs(actualExp - expectedExp)).toBeLessThan(5);
    });

    it('should accept token close to expiration', () => {
      const userId = 'user-123';
      const email = 'test@example.com';
      const expiresIn = 1; // 1 秒

      const token = generateAccessToken(userId, email, expiresIn);

      // 立即验证应该通过
      const result = verifyAccessToken(token);
      expect(result.valid).toBe(true);
    });
  });

  // ========================================================================
  // Token 签名测试
  // ========================================================================

  describe('Token Signature', () => {
    it('should reject token with tampered payload', () => {
      const token = generateAccessToken('user-123', 'test@example.com');
      const parts = token.split('.');

      // 修改 payload
      const tamperedPayload = Buffer.from('{"sub":"hacker","email":"hack@example.com"}').toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
      const tamperedToken = `${parts[0]}.${tamperedPayload}.${parts[2]}`;

      const result = verifyAccessToken(tamperedToken);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('signature');
    });

    it('should reject token with tampered signature', () => {
      const token = generateAccessToken('user-123', 'test@example.com');
      const parts = token.split('.');

      // 修改签名
      const tamperedSignature = 'tamperedsignaturetamperedsignature';
      const tamperedToken = `${parts[0]}.${parts[1]}.${tamperedSignature}`;

      const result = verifyAccessToken(tamperedToken);

      expect(result.valid).toBe(false);
    });
  });

  // ========================================================================
  // 边界情况测试
  // ========================================================================

  describe('Edge Cases', () => {
    it('should handle empty user ID', () => {
      const token = generateAccessToken('', 'test@example.com');
      const result = verifyAccessToken(token);

      expect(result.valid).toBe(true);
      expect(result.payload?.sub).toBe('');
    });

    it('should handle special characters in email', () => {
      const email = 'test+special@example.co.uk';
      const token = generateAccessToken('user-123', email);
      const result = verifyAccessToken(token);

      expect(result.valid).toBe(true);
      expect(result.payload?.email).toBe(email);
    });

    it('should handle very long user ID', () => {
      const longUserId = 'user-' + 'x'.repeat(1000);
      const token = generateAccessToken(longUserId, 'test@example.com');
      const result = verifyAccessToken(token);

      expect(result.valid).toBe(true);
      expect(result.payload?.sub).toBe(longUserId);
    });

    it('should reject malformed tokens', () => {
      const invalidTokens = [
        'single-part',
        'two.parts',
        'five.parts.with.extra.data',
        '',
        null,
        undefined,
        {},
      ];

      invalidTokens.forEach((invalid) => {
        const result = verifyAccessToken(invalid as any);
        expect(result.valid).toBe(false);
      });
    });
  });

  // ========================================================================
  // 安全测试
  // ========================================================================

  describe('Security', () => {
    it('should use different signatures for different tokens', () => {
      const token1 = generateAccessToken('user-1', 'test1@example.com');
      const token2 = generateAccessToken('user-2', 'test2@example.com');

      const sig1 = token1.split('.')[2];
      const sig2 = token2.split('.')[2];

      expect(sig1).not.toBe(sig2);
    });

    it('should include issued-at time', () => {
      const token = generateAccessToken('user-123', 'test@example.com');
      const result = verifyAccessToken(token);

      expect(result.payload?.iat).toBeDefined();
      expect(typeof result.payload?.iat).toBe('number');

      // iat 应该是最近的时间戳
      const now = Math.floor(Date.now() / 1000);
      expect(Math.abs(now - (result.payload?.iat || 0))).toBeLessThan(5);
    });

    it('should use HS256 algorithm', () => {
      const token = generateAccessToken('user-123', 'test@example.com');
      const header = JSON.parse(Buffer.from(token.split('.')[0], 'base64').toString('utf-8'));

      expect(header.alg).toBe('HS256');
      expect(header.typ).toBe('JWT');
    });
  });
});
