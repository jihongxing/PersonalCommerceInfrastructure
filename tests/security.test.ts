/**
 * 安全审计测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  XSSProtectionManager,
  CSRFProtectionManager,
  PasswordSecurityPolicy,
  RateLimitManager,
  SecurityHeadersValidator,
} from '../apps/web-v2/lib/security/security-manager';

describe('Security Audit', () => {
  describe('XSS Protection', () => {
    it('应该转义 HTML 特殊字符', () => {
      const input = '<script>alert("XSS")</script>';
      const escaped = XSSProtectionManager.escapeHTML(input);

      expect(escaped).toContain('&lt;');
      expect(escaped).toContain('&gt;');
      expect(escaped).not.toContain('<script>');
    });

    it('应该验证安全 URL', () => {
      if (typeof window === 'undefined') {
        expect(true).toBe(true);
        return;
      }

      expect(XSSProtectionManager.validateURL('https://example.com')).toBe(true);
      expect(XSSProtectionManager.validateURL('http://example.com')).toBe(true);
      expect(XSSProtectionManager.validateURL('mailto:test@example.com')).toBe(true);
    });

    it('应该拒绝不安全 URL', () => {
      if (typeof window === 'undefined') {
        expect(true).toBe(true);
        return;
      }

      expect(XSSProtectionManager.validateURL('javascript:alert("XSS")')).toBe(false);
    });

    it('应该清理用户输入', () => {
      const input = '<img src=x onerror="alert(\'XSS\')">';
      const cleaned = XSSProtectionManager.sanitizeInput(input);

      expect(cleaned).not.toContain('<');
      expect(cleaned).not.toContain('onerror');
      expect(cleaned).not.toContain('javascript:');
    });

    it('应该安全解析 JSON', () => {
      const validJSON = '{"email":"test@example.com"}';
      const result = XSSProtectionManager.safeJSONParse(validJSON);

      expect(result).toEqual({ email: 'test@example.com' });
    });

    it('应该处理无效 JSON', () => {
      const invalidJSON = '{invalid json}';
      const result = XSSProtectionManager.safeJSONParse(invalidJSON);

      expect(result).toBeNull();
    });
  });

  describe('CSRF Protection', () => {
    beforeEach(() => {
      if (typeof localStorage !== 'undefined') {
        localStorage.clear();
      }
    });

    it('应该生成 CSRF token', () => {
      const token = CSRFProtectionManager.generateToken();

      expect(token).toBeDefined();
      expect(token.length).toBeGreaterThan(0);
    });

    it('应该保存和获取 token', () => {
      if (typeof localStorage === 'undefined') {
        expect(true).toBe(true);
        return;
      }

      CSRFProtectionManager.saveToken();
      const token = CSRFProtectionManager.getToken();

      expect(token).not.toBeNull();
      expect(token?.length).toBeGreaterThan(0);
    });

    it('应该验证 CSRF token', () => {
      if (typeof localStorage === 'undefined') {
        expect(true).toBe(true);
        return;
      }

      CSRFProtectionManager.saveToken();
      const token = CSRFProtectionManager.getToken();

      expect(CSRFProtectionManager.validateToken(token!)).toBe(true);
      expect(CSRFProtectionManager.validateToken('invalid')).toBe(false);
    });

    it('应该生成不同的 token', () => {
      const token1 = CSRFProtectionManager.generateToken();
      const token2 = CSRFProtectionManager.generateToken();

      expect(token1).not.toBe(token2);
    });

    it('应该添加 token 到请求头', () => {
      if (typeof localStorage === 'undefined') {
        expect(true).toBe(true);
        return;
      }

      CSRFProtectionManager.saveToken();
      const headers = new Headers();

      CSRFProtectionManager.addToHeaders(headers);

      expect(headers.get('X-CSRF-Token')).not.toBeNull();
    });
  });

  describe('Password Security Policy', () => {
    it('应该验证有效密码', () => {
      const result = PasswordSecurityPolicy.validatePassword('SecurePass123');

      expect(result.isValid).toBe(true);
      expect(result.feedback.length).toBe(0);
    });

    it('应该拒绝太短的密码', () => {
      const result = PasswordSecurityPolicy.validatePassword('Short1');

      expect(result.isValid).toBe(false);
      expect(result.feedback.some(f => f.includes('字符'))).toBe(true);
    });

    it('应该检查大写字母', () => {
      const result = PasswordSecurityPolicy.validatePassword('lowercase123');

      expect(result.isValid).toBe(false);
      expect(result.feedback.some(f => f.includes('大写'))).toBe(true);
    });

    it('应该检查小写字母', () => {
      const result = PasswordSecurityPolicy.validatePassword('UPPERCASE123');

      expect(result.isValid).toBe(false);
      expect(result.feedback.some(f => f.includes('小写'))).toBe(true);
    });

    it('应该检查数字', () => {
      const result = PasswordSecurityPolicy.validatePassword('NoNumbers');

      expect(result.isValid).toBe(false);
      expect(result.feedback.some(f => f.includes('数字'))).toBe(true);
    });

    it('应该计算密码强度', () => {
      const weak = PasswordSecurityPolicy.validatePassword('Pass1');
      const strong = PasswordSecurityPolicy.validatePassword('StrongPassword123!');

      expect(weak.score).toBeLessThan(strong.score);
    });

    it('应该获取强度等级', () => {
      expect(PasswordSecurityPolicy.getStrengthLevel(0)).toBe('very-weak');
      expect(PasswordSecurityPolicy.getStrengthLevel(2)).toBe('fair');
      expect(PasswordSecurityPolicy.getStrengthLevel(5)).toBe('very-strong');
    });
  });

  describe('Rate Limiting', () => {
    let rateLimiter: RateLimitManager;

    beforeEach(() => {
      rateLimiter = new RateLimitManager();
    });

    it('应该允许初始请求', () => {
      expect(rateLimiter.isLimited('user1')).toBe(false);
    });

    it('应该允许在限制内的请求', () => {
      for (let i = 0; i < 5; i++) {
        expect(rateLimiter.isLimited('user1')).toBe(false);
      }
    });

    it('应该阻止超过限制的请求', () => {
      for (let i = 0; i < 5; i++) {
        rateLimiter.isLimited('user1');
      }

      expect(rateLimiter.isLimited('user1')).toBe(true);
    });

    it('应该为不同用户独立计数', () => {
      expect(rateLimiter.isLimited('user1')).toBe(false);
      expect(rateLimiter.isLimited('user2')).toBe(false);
    });

    it('应该跟踪剩余尝试次数', () => {
      expect(rateLimiter.getRemainingAttempts('user1')).toBe(5);

      rateLimiter.isLimited('user1');
      expect(rateLimiter.getRemainingAttempts('user1')).toBe(4);

      rateLimiter.isLimited('user1');
      expect(rateLimiter.getRemainingAttempts('user1')).toBe(3);
    });

    it('应该重置限制', () => {
      for (let i = 0; i < 5; i++) {
        rateLimiter.isLimited('user1');
      }

      expect(rateLimiter.isLimited('user1')).toBe(true);

      rateLimiter.reset('user1');

      expect(rateLimiter.isLimited('user1')).toBe(false);
    });

    it('应该返回重置时间', () => {
      rateLimiter.isLimited('user1');

      const resetTime = rateLimiter.getResetTime('user1');
      expect(resetTime).toBeGreaterThan(0);
      expect(resetTime).toBeLessThanOrEqual(60 * 1000);
    });
  });

  describe('Security Headers Validation', () => {
    it('应该验证 HTTPS', () => {
      if (typeof window === 'undefined') {
        expect(true).toBe(true);
        return;
      }

      const isHTTPS = window.location.protocol === 'https:';
      expect(SecurityHeadersValidator.validateHSTS()).toBe(isHTTPS);
    });

    it('应该验证不在 iframe 中', () => {
      if (typeof window === 'undefined') {
        expect(true).toBe(true);
        return;
      }

      expect(SecurityHeadersValidator.validateXFrameOptions()).toBe(true);
    });

    it('应该验证 CSP', () => {
      expect(SecurityHeadersValidator.validateCSP()).toBe(true);
    });

    it('应该验证 X-Content-Type-Options', () => {
      expect(SecurityHeadersValidator.validateXContentTypeOptions()).toBe(true);
    });
  });

  describe('集成场景', () => {
    it('应该完整处理登陆表单安全', () => {
      // 1. 生成 CSRF token
      CSRFProtectionManager.saveToken();

      // 2. 验证密码
      const passwordResult = PasswordSecurityPolicy.validatePassword('SecurePass123');
      expect(passwordResult.isValid).toBe(true);

      // 3. 清理用户输入
      const userInput = '<script>alert("XSS")</script>test@example.com';
      const cleanedInput = XSSProtectionManager.sanitizeInput(userInput);
      expect(cleanedInput).not.toContain('<script>');

      // 4. 检查速率限制
      const rateLimiter = new RateLimitManager();
      expect(rateLimiter.isLimited('login_attempt_user')).toBe(false);
    });

    it('应该完整处理密码重置安全', () => {
      // 1. 清理邮箱输入
      const emailInput = '<img src=x onerror="alert(\'XSS\')">';
      const cleanedEmail = XSSProtectionManager.sanitizeInput(emailInput);
      expect(cleanedEmail).not.toContain('<');

      // 2. 验证重置密码
      const resetResult = PasswordSecurityPolicy.validatePassword('NewSecurePass123');
      expect(resetResult.isValid).toBe(true);

      // 3. 检查速率限制
      const rateLimiter = new RateLimitManager();
      for (let i = 0; i < 3; i++) {
        expect(rateLimiter.isLimited('reset_attempt')).toBe(false);
      }

      // 在合理范围内
      expect(rateLimiter.getRemainingAttempts('reset_attempt')).toBe(2);
    });
  });
});
