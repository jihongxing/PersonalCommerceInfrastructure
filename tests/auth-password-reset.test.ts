import { describe, it, expect } from 'vitest';
import {
  generatePasswordResetToken,
  verifyPasswordResetToken,
  validatePasswordStrength,
  arePasswordsIdentical,
  isNewPasswordSameAsOld,
} from '../lib/auth/password-reset-service.js';
import { hashToken } from '../lib/auth/token-service.js';

/**
 * ========================================================================
 * 密码重置服务单元测试
 * ========================================================================
 */

describe('Password Reset Service', () => {
  // ========================================================================
  // Token 生成测试
  // ========================================================================

  describe('Password Reset Token Generation', () => {
    it('should generate a valid reset token', () => {
      const resetToken = generatePasswordResetToken();

      expect(resetToken.token).toBeDefined();
      expect(resetToken.hash).toBeDefined();
      expect(resetToken.expiresAt).toBeDefined();

      // Token 应该是 Base64URL 格式
      expect(typeof resetToken.token).toBe('string');
      expect(resetToken.token.length).toBeGreaterThan(0);

      // Token 长度应该是 32 字符（24 字节 base64url 编码）
      expect(resetToken.token.length).toBe(32);
    });

    it('should generate different tokens each time', () => {
      const token1 = generatePasswordResetToken();
      const token2 = generatePasswordResetToken();

      expect(token1.token).not.toBe(token2.token);
      expect(token1.hash).not.toBe(token2.hash);
    });

    it('should have correct expiry time (1 hour)', () => {
      const now = Math.floor(Date.now() / 1000);
      const resetToken = generatePasswordResetToken();

      // 应该在 1 小时内过期
      const expiryTime = resetToken.expiresAt - now;
      expect(expiryTime).toBeGreaterThanOrEqual(3599); // 至少 3599 秒
      expect(expiryTime).toBeLessThanOrEqual(3601); // 最多 3601 秒
    });

    it('should generate consistent hash for same token', () => {
      const resetToken = generatePasswordResetToken();

      // Token 的哈希应该一致
      const hash1 = hashToken(resetToken.token);
      const hash2 = hashToken(resetToken.token);

      expect(hash1).toBe(hash2);
      expect(hash1).toBe(resetToken.hash);
    });
  });

  // ========================================================================
  // Token 验证测试
  // ========================================================================

  describe('Password Reset Token Verification', () => {
    it('should accept valid token', () => {
      const resetToken = generatePasswordResetToken();

      const result = verifyPasswordResetToken(
        resetToken.hash,
        resetToken.expiresAt,
        false, // is_used
      );

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject expired token', () => {
      const expiredTime = Math.floor(Date.now() / 1000) - 3600; // 1 小时前过期

      const result = verifyPasswordResetToken(
        'some_hash',
        expiredTime,
        false, // is_used
      );

      expect(result.valid).toBe(false);
      expect(result.error).toContain('expired');
    });

    it('should reject already used token', () => {
      const resetToken = generatePasswordResetToken();

      const result = verifyPasswordResetToken(
        resetToken.hash,
        resetToken.expiresAt,
        true, // is_used = true
      );

      expect(result.valid).toBe(false);
      expect(result.error).toContain('already been used');
    });

    it('should reject token that is both expired and used', () => {
      const expiredTime = Math.floor(Date.now() / 1000) - 3600;

      const result = verifyPasswordResetToken(
        'some_hash',
        expiredTime,
        true, // is_used = true
      );

      expect(result.valid).toBe(false);
      // 应该先检查过期时间
      expect(result.error).toContain('expired');
    });
  });

  // ========================================================================
  // 密码强度验证测试
  // ========================================================================

  describe('Password Strength Validation', () => {
    it('should accept strong password', () => {
      const password = 'SecurePass123!';

      const result = validatePasswordStrength(password);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject password too short', () => {
      const password = 'Short1!';

      const result = validatePasswordStrength(password);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('8 characters');
    });

    it('should reject password without uppercase', () => {
      const password = 'lowercase123!';

      const result = validatePasswordStrength(password);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('uppercase');
    });

    it('should reject password without lowercase', () => {
      const password = 'UPPERCASE123!';

      const result = validatePasswordStrength(password);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('lowercase');
    });

    it('should reject password without digit', () => {
      const password = 'NoDigitHere!';

      const result = validatePasswordStrength(password);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('digit');
    });

    it('should reject password without special character', () => {
      const password = 'NoSpecialChar123';

      const result = validatePasswordStrength(password);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('special character');
    });

    it('should accept password with various special characters', () => {
      const passwords = [
        'SecurePass123!',
        'SecurePass123@',
        'SecurePass123#',
        'SecurePass123$',
        'SecurePass123%',
        'SecurePass123^',
        'SecurePass123&',
        'SecurePass123*',
      ];

      passwords.forEach((password) => {
        const result = validatePasswordStrength(password);
        expect(result.valid).toBe(true);
      });
    });
  });

  // ========================================================================
  // 密码比较测试
  // ========================================================================

  describe('Password Comparison', () => {
    it('should identify identical passwords', () => {
      const password = 'SecurePass123!';

      const result = arePasswordsIdentical(password, password);

      expect(result).toBe(true);
    });

    it('should identify different passwords', () => {
      const password1 = 'SecurePass123!';
      const password2 = 'DifferentPass456!';

      const result = arePasswordsIdentical(password1, password2);

      expect(result).toBe(false);
    });

    it('should be case sensitive', () => {
      const password1 = 'SecurePass123!';
      const password2 = 'securepass123!';

      const result = arePasswordsIdentical(password1, password2);

      expect(result).toBe(false);
    });
  });

  // ========================================================================
  // 完整工作流测试
  // ========================================================================

  describe('Password Reset Workflow', () => {
    it('should handle complete password reset flow', () => {
      // 1. 用户请求重置密码
      const resetToken = generatePasswordResetToken();
      expect(resetToken.token).toBeDefined();

      // 2. 验证 token 有效性
      const verifyResult = verifyPasswordResetToken(
        resetToken.hash,
        resetToken.expiresAt,
        false,
      );
      expect(verifyResult.valid).toBe(true);

      // 3. 用户输入新密码
      const newPassword = 'NewSecurePass456!';

      // 4. 验证新密码强度
      const passwordValidation = validatePasswordStrength(newPassword);
      expect(passwordValidation.valid).toBe(true);

      // 5. 模拟重置成功
      // 在实际应用中，这里会：
      // - 更新数据库中的密码哈希
      // - 标记 token 为已用
      // - 可选地撤销所有旧 refresh tokens
    });

    it('should reject reset with weak password', () => {
      const resetToken = generatePasswordResetToken();

      // Token 有效
      const verifyResult = verifyPasswordResetToken(
        resetToken.hash,
        resetToken.expiresAt,
        false,
      );
      expect(verifyResult.valid).toBe(true);

      // 但新密码强度不够
      const newPassword = 'weak';
      const passwordValidation = validatePasswordStrength(newPassword);
      expect(passwordValidation.valid).toBe(false);
    });

    it('should reject reset with expired token', () => {
      const expiredTime = Math.floor(Date.now() / 1000) - 3600;

      // Token 已过期
      const verifyResult = verifyPasswordResetToken(
        'some_hash',
        expiredTime,
        false,
      );
      expect(verifyResult.valid).toBe(false);
    });

    it('should reject reset with already used token', () => {
      const resetToken = generatePasswordResetToken();

      // Token 已被使用
      const verifyResult = verifyPasswordResetToken(
        resetToken.hash,
        resetToken.expiresAt,
        true, // is_used = true
      );
      expect(verifyResult.valid).toBe(false);
    });

    it('should require matching passwords', () => {
      const password1 = 'SecurePass123!';
      const password2 = 'DifferentPass456!';

      const match = arePasswordsIdentical(password1, password2);
      expect(match).toBe(false);
    });

    it('should not allow reusing old password (framework)', () => {
      const oldPasswordHash = 'hash_of_old_password';
      const newPassword = 'NewSecurePass456!';

      // 此函数返回 false（即新密码与旧密码不同）
      const isSame = isNewPasswordSameAsOld(newPassword, oldPasswordHash);
      expect(isSame).toBe(false);
    });
  });

  // ========================================================================
  // 边界情况测试
  // ========================================================================

  describe('Edge Cases', () => {
    it('should handle minimum valid password length', () => {
      // 最短的有效密码: 8 字符
      const password = 'Abcde123!';

      const result = validatePasswordStrength(password);
      expect(result.valid).toBe(true);
    });

    it('should handle very long password', () => {
      const password = 'VeryLongPassword123!' + 'a'.repeat(100);

      const result = validatePasswordStrength(password);
      expect(result.valid).toBe(true);
    });

    it('should handle password with unicode characters', () => {
      // 包含 unicode 但仍满足所有要求
      const password = 'SecurePass123!你好';

      const result = validatePasswordStrength(password);
      // 应该包含所有必需的字符
      expect(result.valid).toBe(true);
    });

    it('should handle token verification on boundary expiry time', () => {
      // Token 在"现在"之后即将过期时（使用 < 比较）
      // 则 token 应该仍然有效
      const now = Math.floor(Date.now() / 1000);

      const result = verifyPasswordResetToken(
        'some_hash',
        now, // 现在过期（但由于使用 < 比较，仍有效）
        false,
      );

      // 由于使用 expiresAt < now（而不是 <=），
      // 当 expiresAt === now 时，token 仍然有效
      expect(result.valid).toBe(true);
    });

    it('should handle token verification just before expiry', () => {
      // Token 即将过期（1 秒后）
      const now = Math.floor(Date.now() / 1000);

      const result = verifyPasswordResetToken(
        'some_hash',
        now + 1, // 1 秒后过期
        false,
      );

      expect(result.valid).toBe(true);
    });
  });

  // ========================================================================
  // 安全测试
  // ========================================================================

  describe('Security', () => {
    it('should generate cryptographically secure tokens', () => {
      const tokens = new Set();

      // 生成 1000 个 token，都应该不同
      for (let i = 0; i < 1000; i++) {
        const resetToken = generatePasswordResetToken();
        tokens.add(resetToken.token);
      }

      expect(tokens.size).toBe(1000);
    });

    it('should not expose raw token in hash', () => {
      const resetToken = generatePasswordResetToken();

      // Token 和 hash 应该不同
      expect(resetToken.token).not.toBe(resetToken.hash);

      // Token 不应该包含在 hash 中（作为明文）
      expect(resetToken.hash).not.toContain(resetToken.token);
    });

    it('should provide consistent hash for database lookup', () => {
      const resetToken = generatePasswordResetToken();

      // 多次哈希应该得到相同结果
      const hash1 = hashToken(resetToken.token);
      const hash2 = hashToken(resetToken.token);

      expect(hash1).toBe(hash2);
    });

    it('should validate password requirements independently', () => {
      // 即使密码满足大部分要求，缺少一个仍应被拒绝
      const passwordsWithMissingRequirement = [
        'Short1!', // 太短（7 字符）
        'nouppercase123!', // 无大写
        'NOLOWERCASE123!', // 无小写
        'NoDigitsHere!', // 无数字
        'NoSpecialCharacter123', // 无特殊字符
      ];

      passwordsWithMissingRequirement.forEach((password) => {
        const result = validatePasswordStrength(password);
        expect(result.valid).toBe(false);
      });
    });
  });
});
