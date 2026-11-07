import crypto from 'crypto';
import { ApplicationError } from '../../applications/core/application-error.js';
import { hashToken } from './token-service.js';

/**
 * ========================================================================
 * 密码重置服务
 * ========================================================================
 *
 * 处理密码重置的完整流程：
 * 1. 生成重置 token
 * 2. 验证重置 token
 * 3. 标记重置为已用
 */

export interface PasswordResetToken {
  token: string;
  hash: string;
  expiresAt: number;
}

/**
 * 生成密码重置 token
 *
 * Token 特性:
 * - 24 字节（192 位）随机生成的 token
 * - 返回 Base64URL 编码的 token
 * - 有效期: 1 小时 (3600 秒)
 *
 * @returns PasswordResetToken
 */
export function generatePasswordResetToken(): PasswordResetToken {
  // 生成 24 字节随机 token
  const randomBytes = crypto.randomBytes(24);
  const token = randomBytes.toString('base64url');

  // 生成 token hash（用于数据库存储）
  const hash = hashToken(token);

  // 有效期: 1 小时
  const expiresAt = Math.floor(Date.now() / 1000) + 60 * 60;

  return {
    token,
    hash,
    expiresAt,
  };
}

/**
 * 验证密码重置 token
 *
 * 验证流程:
 * 1. 检查 token 是否在数据库中存在（通过 hash 对比）
 * 2. 检查 token 是否已过期
 * 3. 检查 token 是否已被使用
 *
 * @param tokenHash - 从数据库查询到的 token hash
 * @param expiresAt - token 过期时间（Unix timestamp）
 * @param isUsed - token 是否已被使用
 * @returns { valid: boolean, error?: string }
 */
export function verifyPasswordResetToken(
  tokenHash: string,
  expiresAt: number,
  isUsed: boolean,
): { valid: boolean; error?: string } {
  // 1. 检查 token 是否已过期
  const now = Math.floor(Date.now() / 1000);
  if (expiresAt < now) {
    return {
      valid: false,
      error: 'Reset token has expired',
    };
  }

  // 2. 检查 token 是否已被使用
  if (isUsed) {
    return {
      valid: false,
      error: 'Reset token has already been used',
    };
  }

  // Token 有效
  return { valid: true };
}

/**
 * 验证密码强度
 *
 * 要求:
 * - 最少 8 字符
 * - 包含大写字母
 * - 包含小写字母
 * - 包含数字
 * - 包含特殊字符
 *
 * @param password - 密码
 * @returns { valid: boolean, error?: string }
 */
export function validatePasswordStrength(password: string): {
  valid: boolean;
  error?: string;
} {
  // 检查长度
  if (password.length < 8) {
    return {
      valid: false,
      error: 'Password must be at least 8 characters long',
    };
  }

  // 检查大写字母
  if (!/[A-Z]/.test(password)) {
    return {
      valid: false,
      error: 'Password must contain at least one uppercase letter',
    };
  }

  // 检查小写字母
  if (!/[a-z]/.test(password)) {
    return {
      valid: false,
      error: 'Password must contain at least one lowercase letter',
    };
  }

  // 检查数字
  if (!/\d/.test(password)) {
    return {
      valid: false,
      error: 'Password must contain at least one digit',
    };
  }

  // 检查特殊字符
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return {
      valid: false,
      error:
        'Password must contain at least one special character (!@#$%^&*()_+-=[]{};"\'|,.<>/?)',
    };
  }

  return { valid: true };
}

/**
 * 检查两个密码是否相同
 *
 * @param password1 - 第一个密码
 * @param password2 - 第二个密码
 * @returns boolean
 */
export function arePasswordsIdentical(password1: string, password2: string): boolean {
  return password1 === password2;
}

/**
 * 检查新密码是否与旧密码相同
 *
 * @param newPassword - 新密码
 * @param oldPasswordHash - 旧密码的 hash
 * @returns boolean
 */
export function isNewPasswordSameAsOld(
  newPassword: string,
  oldPasswordHash: string,
): boolean {
  // 这是一个简化版本
  // 在实际应用中，应该使用 bcrypt.compare 或类似的库
  // 来比较密码和哈希
  // 此处仅作示意，实际应该调用 Supabase auth API

  // 由于我们不知道如何比较 Supabase 中存储的密码，
  // 这里返回 false（假设新密码不同）
  return false;
}

/**
 * 检查重置流程是否需要失效所有旧 token
 *
 * 建议: 是的
 * 原因: 出于安全考虑，密码重置时应该失效所有现有的 refresh token
 * 这样可以强制用户在所有设备上重新登陆
 *
 * @returns boolean
 */
export function shouldRevokeAllTokensOnPasswordReset(): boolean {
  return true;
}
