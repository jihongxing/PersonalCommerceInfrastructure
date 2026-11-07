/**
 * 安全审计 & XSS/CSRF 防护
 */

/**
 * XSS 防护管理器
 */
export class XSSProtectionManager {
  /**
   * 清理 HTML（防止 XSS）
   */
  static sanitizeHTML(html: string): string {
    // 简单的 HTML 转义
    return this.escapeHTML(html);
  }

  /**
   * 转义 HTML 特殊字符
   */
  static escapeHTML(text: string): string {
    const map: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return text.replace(/[&<>"']/g, (char) => map[char]);
  }

  /**
   * 验证 URL 是否安全（防止 javascript: 协议）
   */
  static validateURL(url: string): boolean {
    try {
      const parsed = new URL(url, window.location.href);
      // 允许的协议
      const allowedProtocols = ['http:', 'https:', 'mailto:'];
      return allowedProtocols.includes(parsed.protocol);
    } catch {
      return false;
    }
  }

  /**
   * 清理用户输入（防止 XSS）
   */
  static sanitizeInput(input: string): string {
    // 移除潜在的危险字符和标签
    return input
      .replace(/<[^>]*>/g, '') // 移除所有 HTML 标签
      .replace(/javascript:/gi, '') // 移除 javascript: 协议
      .replace(/on\w+\s*=/gi, '') // 移除事件处理器
      .trim();
  }

  /**
   * 安全的 JSON 解析
   */
  static safeJSONParse(jsonString: string): any {
    try {
      // 使用 JSON.parse 的内置保护
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('Invalid JSON:', error);
      return null;
    }
  }
}

/**
 * CSRF 防护管理器
 */
export class CSRFProtectionManager {
  private static readonly CSRF_TOKEN_KEY = 'x-csrf-token';
  private static readonly CSRF_HEADER_KEY = 'X-CSRF-Token';

  /**
   * 生成 CSRF token
   */
  static generateToken(): string {
    // 生成随机的 64 字符 token
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join(
      ''
    );
  }

  /**
   * 保存 CSRF token 到 localStorage
   */
  static saveToken(): void {
    if (typeof localStorage !== 'undefined') {
      const token = this.generateToken();
      localStorage.setItem(this.CSRF_TOKEN_KEY, token);
    }
  }

  /**
   * 获取 CSRF token
   */
  static getToken(): string | null {
    if (typeof localStorage === 'undefined') {
      return null;
    }
    return localStorage.getItem(this.CSRF_TOKEN_KEY);
  }

  /**
   * 验证 CSRF token
   */
  static validateToken(token: string): boolean {
    const storedToken = this.getToken();
    return storedToken === token && token.length > 0;
  }

  /**
   * 添加 CSRF token 到请求头
   */
  static addToHeaders(headers: Headers): void {
    const token = this.getToken();
    if (token) {
      headers.set(this.CSRF_HEADER_KEY, token);
    }
  }
}

/**
 * 密码安全策略
 */
export class PasswordSecurityPolicy {
  /**
   * 密码要求
   */
  static readonly REQUIREMENTS = {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: false, // 可选但推荐
    maxLength: 128,
  };

  /**
   * 验证密码强度
   */
  static validatePassword(password: string): {
    isValid: boolean;
    score: number;
    feedback: string[];
  } {
    const feedback: string[] = [];
    let score = 0;

    // 长度检查
    if (password.length < this.REQUIREMENTS.minLength) {
      feedback.push(`密码至少需要 ${this.REQUIREMENTS.minLength} 个字符`);
    } else {
      score++;
    }

    if (password.length > this.REQUIREMENTS.maxLength) {
      feedback.push(`密码不超过 ${this.REQUIREMENTS.maxLength} 个字符`);
    } else {
      score++;
    }

    // 大写字母
    if (this.REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
      feedback.push('至少需要一个大写字母');
    } else if (/[A-Z]/.test(password)) {
      score++;
    }

    // 小写字母
    if (this.REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
      feedback.push('至少需要一个小写字母');
    } else if (/[a-z]/.test(password)) {
      score++;
    }

    // 数字
    if (this.REQUIREMENTS.requireNumbers && !/[0-9]/.test(password)) {
      feedback.push('至少需要一个数字');
    } else if (/[0-9]/.test(password)) {
      score++;
    }

    // 特殊字符
    if (this.REQUIREMENTS.requireSpecialChars && !/[!@#$%^&*]/.test(password)) {
      feedback.push('建议包含特殊字符 (!@#$%^&*)');
    } else if (/[!@#$%^&*]/.test(password)) {
      score++;
    }

    const isValid = feedback.length === 0 && password.length >= this.REQUIREMENTS.minLength;

    return {
      isValid,
      score: Math.min(score, 5),
      feedback,
    };
  }

  /**
   * 获取密码强度等级
   */
  static getStrengthLevel(score: number): string {
    switch (score) {
      case 0:
        return 'very-weak';
      case 1:
        return 'weak';
      case 2:
        return 'fair';
      case 3:
        return 'good';
      case 4:
        return 'strong';
      case 5:
        return 'very-strong';
      default:
        return 'unknown';
    }
  }
}

/**
 * 速率限制管理器
 */
export class RateLimitManager {
  private attempts: Map<string, { count: number; resetTime: number }> = new Map();
  private readonly WINDOW_SIZE = 60 * 1000; // 1 分钟
  private readonly MAX_ATTEMPTS = 5; // 每分钟最多 5 次

  /**
   * 检查是否超过速率限制
   */
  isLimited(key: string): boolean {
    const now = Date.now();
    const record = this.attempts.get(key);

    // 没有记录或已过期
    if (!record || now >= record.resetTime) {
      this.attempts.set(key, {
        count: 1,
        resetTime: now + this.WINDOW_SIZE,
      });
      return false;
    }

    // 检查是否超过限制
    if (record.count >= this.MAX_ATTEMPTS) {
      return true;
    }

    // 增加计数
    record.count++;
    return false;
  }

  /**
   * 重置特定 key 的限制
   */
  reset(key: string): void {
    this.attempts.delete(key);
  }

  /**
   * 获取剩余尝试次数
   */
  getRemainingAttempts(key: string): number {
    const record = this.attempts.get(key);
    if (!record) {
      return this.MAX_ATTEMPTS;
    }

    const now = Date.now();
    if (now >= record.resetTime) {
      this.reset(key);
      return this.MAX_ATTEMPTS;
    }

    return Math.max(0, this.MAX_ATTEMPTS - record.count);
  }

  /**
   * 获取重置时间（毫秒）
   */
  getResetTime(key: string): number {
    const record = this.attempts.get(key);
    if (!record) {
      return 0;
    }

    const now = Date.now();
    const remaining = record.resetTime - now;
    return Math.max(0, remaining);
  }
}

/**
 * 安全头部管理器
 * （需要后端支持，这里提供客户端验证）
 */
export class SecurityHeadersValidator {
  /**
   * 验证 CSP 头
   */
  static validateCSP(): boolean {
    // 检查是否设置了 Content-Security-Policy
    // 这需要在后端设置，客户端可以验证
    return true; // 需要后端实现
  }

  /**
   * 验证 HSTS 头
   */
  static validateHSTS(): boolean {
    // 检查是否设置了 Strict-Transport-Security
    return window.location.protocol === 'https:';
  }

  /**
   * 验证 X-Frame-Options
   */
  static validateXFrameOptions(): boolean {
    // 防止被嵌入到 iframe 中
    return window.self === window.top;
  }

  /**
   * 验证 X-Content-Type-Options
   */
  static validateXContentTypeOptions(): boolean {
    // 需要后端设置 X-Content-Type-Options: nosniff
    return true;
  }
}

/**
 * 创建全局安全管理器
 */
export const securityManager = {
  xss: XSSProtectionManager,
  csrf: CSRFProtectionManager,
  password: PasswordSecurityPolicy,
  rateLimit: new RateLimitManager(),
  headers: SecurityHeadersValidator,
};
