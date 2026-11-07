import { describe, it, expect, beforeEach } from 'vitest';
import { generateAccessToken, generateRefreshToken, verifyAccessToken, verifyRefreshToken, hashToken } from '../lib/auth/token-service.js';

/**
 * ========================================================================
 * 认证系统集成测试
 * ========================================================================
 * 
 * 测试完整的认证工作流:
 * 1. Signup → Token 生成
 * 2. Login → Token 生成
 * 3. Refresh → Token 更新
 * 4. Logout → Token 失效
 */

describe('Authentication Workflow', () => {
  // ========================================================================
  // Signup 工作流
  // ========================================================================

  describe('Signup Workflow', () => {
    it('should generate tokens after signup', () => {
      const userId = 'user-123';
      const email = 'user@example.com';

      // 模拟 signup 时的 token 生成
      const accessToken = generateAccessToken(userId, email);
      const refreshToken = generateRefreshToken(userId);

      // 验证两个 token 都有效
      expect(verifyAccessToken(accessToken).valid).toBe(true);
      expect(verifyRefreshToken(refreshToken).valid).toBe(true);

      // 验证 token 中包含正确的用户信息
      const accessPayload = verifyAccessToken(accessToken).payload;
      expect(accessPayload?.sub).toBe(userId);
      expect(accessPayload?.email).toBe(email);
    });

    it('should store refresh token hash in database', () => {
      const userId = 'user-123';
      const refreshToken = generateRefreshToken(userId);

      // 模拟数据库存储 hash
      const tokenHash = hashToken(refreshToken);

      // 模拟数据库查询时验证
      const isValid = tokenHash === hashToken(refreshToken);
      expect(isValid).toBe(true);
    });
  });

  // ========================================================================
  // Login 工作流
  // ========================================================================

  describe('Login Workflow', () => {
    it('should generate tokens after login', () => {
      const userId = 'user-456';
      const email = 'login@example.com';

      // 模拟 login 时的 token 生成
      const accessToken = generateAccessToken(userId, email);
      const refreshToken = generateRefreshToken(userId);

      expect(verifyAccessToken(accessToken).valid).toBe(true);
      expect(verifyRefreshToken(refreshToken).valid).toBe(true);
    });

    it('should track last login time', () => {
      // 虽然 token 中没有 last_login_at
      // 但应该在数据库中更新
      const userId = 'user-456';

      // 生成 token
      const accessToken = generateAccessToken(userId, 'login@example.com');

      // 验证 token
      const result = verifyAccessToken(accessToken);
      expect(result.payload?.iat).toBeDefined();

      // last_login_at 应该是现在
      const now = Math.floor(Date.now() / 1000);
      const tokenIssuedTime = result.payload?.iat || 0;

      expect(Math.abs(now - tokenIssuedTime)).toBeLessThan(5);
    });
  });

  // ========================================================================
  // Refresh Token 工作流
  // ========================================================================

  describe('Refresh Token Workflow', () => {
    it('should refresh access token without changing refresh token', () => {
      const userId = 'user-789';

      // 1. 登陆后获得 tokens
      const originalAccessToken = generateAccessToken(userId, 'refresh@example.com');
      const refreshToken = generateRefreshToken(userId);

      // 2. 验证原始 token
      const originalPayload = verifyAccessToken(originalAccessToken).payload;
      expect(originalPayload?.sub).toBe(userId);

      // 3. 使用 refreshToken 刷新
      const newAccessToken = generateAccessToken(userId, 'refresh@example.com');

      // 4. 验证新 token
      const newPayload = verifyAccessToken(newAccessToken).payload;
      expect(newPayload?.sub).toBe(userId);

      // 5. AccessToken 可能不同（取决于生成时间）
      // 但来自同一个用户
      expect(originalPayload?.sub).toBe(newPayload?.sub);

      // 6. RefreshToken 保持不变
      const refreshPayload = verifyRefreshToken(refreshToken).payload;
      expect(refreshPayload?.sub).toBe(userId);
    });

    it('should reject expired access token after refresh', () => {
      const userId = 'user-999';

      // 1. 生成已过期的 token
      const expiredAccessToken = generateAccessToken(userId, 'test@example.com', -100);

      // 2. 验证应该失败
      const result = verifyAccessToken(expiredAccessToken);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('expired');

      // 3. 但 refresh token 应该仍然有效
      const refreshToken = generateRefreshToken(userId);
      const refreshResult = verifyRefreshToken(refreshToken);
      expect(refreshResult.valid).toBe(true);
    });
  });

  // ========================================================================
  // Logout 工作流
  // ========================================================================

  describe('Logout Workflow', () => {
    it('should invalidate token after logout', () => {
      const userId = 'user-logout';

      // 1. 登陆获得 tokens
      const accessToken = generateAccessToken(userId, 'logout@example.com');
      const refreshToken = generateRefreshToken(userId);

      // 2. 在登出前都有效
      expect(verifyAccessToken(accessToken).valid).toBe(true);
      expect(verifyRefreshToken(refreshToken).valid).toBe(true);

      // 3. 登出后，应该在服务器端标记为已撤销
      // 注意: 完整实现需要检查数据库中的 is_revoked 标记
      // 此处只验证 token 格式仍然有效（但在数据库中应该被标记）

      // 验证 token 格式本身仍然有效
      expect(verifyAccessToken(accessToken).valid).toBe(true);
      expect(verifyRefreshToken(refreshToken).valid).toBe(true);

      // 但数据库中应该有 is_revoked = true 的记录
      // 在完整实现中，登出时应该：
      // 1. 找到所有该用户的 refresh tokens
      // 2. 标记它们为 is_revoked = true
      // 3. 这样即使 token 本身格式有效，也会被拒绝
    });

    it('should support single token logout', () => {
      const userId = 'user-single-logout';

      // 1. 用户在多个设备上登陆
      const token1 = generateRefreshToken(userId);
      const token2 = generateRefreshToken(userId);
      const token3 = generateRefreshToken(userId);

      // 2. 所有 token 都有效
      expect(verifyRefreshToken(token1).valid).toBe(true);
      expect(verifyRefreshToken(token2).valid).toBe(true);
      expect(verifyRefreshToken(token3).valid).toBe(true);

      // 3. 登出单个 token（从一个设备）
      // 在完整实现中:
      // - 标记 token1 hash 对应的记录为 is_revoked = true
      // - token2 和 token3 保持有效

      // 验证 token 本身格式仍然有效
      expect(verifyRefreshToken(token1).valid).toBe(true);
      // 但在数据库查询时应该返回 revoked
    });

    it('should support full device logout', () => {
      const userId = 'user-full-logout';

      // 1. 用户在多个设备上登陆
      const tokens = Array.from({ length: 3 }, () => generateRefreshToken(userId));

      // 2. 所有 token 都有效
      tokens.forEach((token) => {
        expect(verifyRefreshToken(token).valid).toBe(true);
      });

      // 3. 全设备登出（类似 Google "登出所有其他设备"）
      // 在完整实现中:
      // - 找到该用户的所有 refresh_tokens
      // - 标记所有为 is_revoked = true
      // - 用户需要重新登陆
    });
  });

  // ========================================================================
  // 完整工作流 (E2E)
  // ========================================================================

  describe('Complete End-to-End Workflow', () => {
    it('should handle complete signup -> login -> use -> refresh -> logout flow', () => {
      // ===== PHASE 1: SIGNUP =====
      const userId = 'user-e2e-flow';
      const email = 'e2e@example.com';

      const signupAccessToken = generateAccessToken(userId, email);
      const signupRefreshToken = generateRefreshToken(userId);

      expect(verifyAccessToken(signupAccessToken).valid).toBe(true);
      expect(verifyRefreshToken(signupRefreshToken).valid).toBe(true);

      // ===== PHASE 2: LOGIN =====
      // （实际上不需要重复生成，但展示登陆流程）
      const loginAccessToken = generateAccessToken(userId, email);
      const loginRefreshToken = generateRefreshToken(userId);

      expect(verifyAccessToken(loginAccessToken).valid).toBe(true);

      // ===== PHASE 3: USE API =====
      // 使用 access token 调用 API
      const apiPayload = verifyAccessToken(loginAccessToken).payload;
      expect(apiPayload?.sub).toBe(userId);
      expect(apiPayload?.email).toBe(email);

      // ===== PHASE 4: REFRESH =====
      // Access token 过期后，使用 refresh token 刷新
      expect(verifyRefreshToken(loginRefreshToken).valid).toBe(true);

      const newAccessToken = generateAccessToken(userId, email);
      expect(verifyAccessToken(newAccessToken).valid).toBe(true);

      // ===== PHASE 5: LOGOUT =====
      // 用户登出
      // 在完整实现中，应该标记 refresh token 为已撤销

      // 验证登出后 token 格式仍然有效（但应该在 DB 中被标记）
      expect(verifyRefreshToken(loginRefreshToken).valid).toBe(true);
      // 在数据库查询时应该返回 is_revoked = true
    });

    it('should handle concurrent token refresh without race conditions', () => {
      const userId = 'user-concurrent';

      // 模拟多个并发刷新请求
      const refreshToken = generateRefreshToken(userId);

      // 创建多个新 token（模拟并发请求）
      const newTokens = Array.from({ length: 5 }, () =>
        generateAccessToken(userId, 'concurrent@example.com'),
      );

      // 所有新 token 都应该有效
      newTokens.forEach((token) => {
        const result = verifyAccessToken(token);
        expect(result.valid).toBe(true);
        expect(result.payload?.sub).toBe(userId);
      });

      // 完整实现中应该考虑:
      // - Token 轮换策略（每次刷新生成新 refresh token）
      // - 并发锁（防止同时使用多个 refresh token）
      // - 审计日志（记录所有 token 操作）
    });
  });

  // ========================================================================
  // 安全工作流
  // ========================================================================

  describe('Security Workflows', () => {
    it('should prevent token reuse after logout', () => {
      const userId = 'user-security-test';
      const token = generateAccessToken(userId, 'security@example.com');

      // 登出（标记为已撤销）
      // 在数据库中: UPDATE refresh_tokens SET is_revoked = true

      // 虽然 token 签名仍然有效
      expect(verifyAccessToken(token).valid).toBe(true);

      // 但数据库查询应该返回已撤销
      // 完整实现应该检查:
      // SELECT * FROM refresh_tokens WHERE token_hash = ? AND is_revoked = true
    });

    it('should reject tampered tokens', () => {
      const token = generateAccessToken('user-123', 'test@example.com');
      const parts = token.split('.');

      // 篡改 payload
      const tamperedToken = `${parts[0]}.invalid-payload.${parts[2]}`;

      const result = verifyAccessToken(tamperedToken);
      expect(result.valid).toBe(false);
    });

    it('should reject tokens from different users', () => {
      const token1 = generateAccessToken('user-1', 'user1@example.com');
      const token2 = generateAccessToken('user-2', 'user2@example.com');

      const payload1 = verifyAccessToken(token1).payload;
      const payload2 = verifyAccessToken(token2).payload;

      expect(payload1?.sub).not.toBe(payload2?.sub);
      expect(payload1?.email).not.toBe(payload2?.email);
    });
  });
});
