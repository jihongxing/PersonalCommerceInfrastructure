/**
 * Token 缓存和请求去重策略
 */

import { getSession, AuthSession } from '@/lib/auth/session';

/**
 * Token 缓存管理
 */
export class TokenCacheManager {
  private cache: Map<string, { token: string; expiresAt: number }> = new Map();
  private readonly MAX_CACHE_SIZE = 100;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 分钟

  /**
   * 获取缓存的 token
   */
  get(key: string): string | null {
    const cached = this.cache.get(key);
    if (!cached) {
      return null;
    }

    // 检查是否过期
    if (Date.now() > cached.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return cached.token;
  }

  /**
   * 设置 token 缓存
   */
  set(key: string, token: string): void {
    // 如果缓存已满，删除最旧的条目
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      token,
      expiresAt: Date.now() + this.CACHE_TTL,
    });
  }

  /**
   * 清空缓存
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * 获取缓存统计
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.MAX_CACHE_SIZE,
      utilization: `${((this.cache.size / this.MAX_CACHE_SIZE) * 100).toFixed(2)}%`,
    };
  }
}

/**
 * 请求去重管理器
 * 防止重复提交相同请求
 */
export class RequestDeduplicator {
  private pendingRequests: Map<string, Promise<any>> = new Map();
  private readonly REQUEST_TIMEOUT = 30 * 1000; // 30 秒

  /**
   * 生成请求键
   */
  private generateKey(url: string, options?: RequestInit): string {
    const method = options?.method || 'GET';
    const body = options?.body ? JSON.stringify(options.body) : '';
    return `${method}:${url}:${body}`;
  }

  /**
   * 执行请求（去重）
   */
  async execute<T>(
    url: string,
    executor: () => Promise<T>,
    options?: RequestInit
  ): Promise<T> {
    const key = this.generateKey(url, options);

    // 如果已有相同请求在进行，返回现有 Promise
    const existing = this.pendingRequests.get(key);
    if (existing) {
      return existing;
    }

    // 创建新请求的 Promise
    const promise = executor()
      .then((result) => {
        // 请求完成，从待处理中移除
        this.pendingRequests.delete(key);
        return result;
      })
      .catch((error) => {
        // 请求失败，从待处理中移除
        this.pendingRequests.delete(key);
        throw error;
      });

    // 设置超时，防止请求永远挂起
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => {
        this.pendingRequests.delete(key);
        reject(new Error('Request timeout'));
      }, this.REQUEST_TIMEOUT)
    );

    // 存储到待处理中
    this.pendingRequests.set(key, Promise.race([promise, timeoutPromise]));

    return this.pendingRequests.get(key)!;
  }

  /**
   * 清空待处理请求
   */
  clear(): void {
    this.pendingRequests.clear();
  }

  /**
   * 获取统计信息
   */
  getStats() {
    return {
      pendingRequests: this.pendingRequests.size,
    };
  }
}

/**
 * Token 预刷新管理器
 * 在 token 即将过期时提前刷新
 */
export class TokenPreRefreshManager {
  private refreshTimer: NodeJS.Timeout | null = null;
  private readonly REFRESH_THRESHOLD = 2 * 60 * 1000; // 在过期前 2 分钟刷新

  /**
   * 启动预刷新监视
   */
  startMonitoring(onRefresh: () => Promise<void>): void {
    this.stopMonitoring();

    const checkAndRefresh = () => {
      const session = getSession();
      if (!session) {
        return;
      }

      const timeUntilExpiry = session.expiresAt * 1000 - Date.now();

      // 如果即将过期，触发刷新
      if (timeUntilExpiry < this.REFRESH_THRESHOLD && timeUntilExpiry > 0) {
        onRefresh().catch(console.error);
      }

      // 继续监视
      this.refreshTimer = setTimeout(checkAndRefresh, 30 * 1000); // 每 30 秒检查一次
    };

    this.refreshTimer = setTimeout(checkAndRefresh, 30 * 1000);
  }

  /**
   * 停止预刷新监视
   */
  stopMonitoring(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }
}

/**
 * 创建全局实例
 */
export const tokenCacheManager = new TokenCacheManager();
export const requestDeduplicator = new RequestDeduplicator();
export const tokenPreRefreshManager = new TokenPreRefreshManager();
