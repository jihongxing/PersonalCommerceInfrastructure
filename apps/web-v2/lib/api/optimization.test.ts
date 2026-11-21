/**
 * 性能优化测试
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TokenCacheManager, RequestDeduplicator, TokenPreRefreshManager } from './optimization.js';
import { clearSession, setSession } from '../auth/session.js';

describe('Performance Optimization', () => {
  describe('TokenCacheManager', () => {
    let cacheManager: TokenCacheManager;

    beforeEach(() => {
      cacheManager = new TokenCacheManager();
    });

    it('不会缓存浏览器凭据', () => {
      cacheManager.set('key1', 'token123');
      expect(cacheManager.get('key1')).toBeNull();
    });

    it('应该返回 null 当缓存不存在', () => {
      expect(cacheManager.get('nonexistent')).toBeNull();
    });

    it('应该清空缓存', () => {
      cacheManager.set('key1', 'token123');
      cacheManager.clear();
      expect(cacheManager.get('key1')).toBeNull();
    });

    it('写入多个凭据后缓存统计仍为空', () => {
      cacheManager.set('key1', 'token1');
      cacheManager.set('key2', 'token2');

      expect(cacheManager.get('key1')).toBeNull();
      expect(cacheManager.get('key2')).toBeNull();
      expect(cacheManager.getStats()).toEqual({ size: 0, maxSize: 0, utilization: '0.00%' });
    });
  });

  describe('RequestDeduplicator', () => {
    let deduplicator: RequestDeduplicator;

    beforeEach(() => {
      deduplicator = new RequestDeduplicator();
    });

    afterEach(() => {
      deduplicator.clear();
    });

    it('应该执行请求', async () => {
      const executor = vi.fn(() => Promise.resolve({ data: 'test' }));

      const result = await deduplicator.execute('/api/test', executor);

      expect(result).toEqual({ data: 'test' });
      expect(executor).toHaveBeenCalledTimes(1);
    });

    it('应该去重相同的请求', async () => {
      const executor = vi.fn(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return { data: 'test' };
      });

      // 同时执行两个相同的请求
      const [result1, result2] = await Promise.all([
        deduplicator.execute('/api/test', executor),
        deduplicator.execute('/api/test', executor),
      ]);

      // executor 应该只被调用一次
      expect(executor).toHaveBeenCalledTimes(1);
      expect(result1).toEqual({ data: 'test' });
      expect(result2).toEqual({ data: 'test' });
    });

    it('应该分别处理不同的请求', async () => {
      const executor1 = vi.fn(() => Promise.resolve({ data: 'test1' }));
      const executor2 = vi.fn(() => Promise.resolve({ data: 'test2' }));

      const result1 = await deduplicator.execute('/api/test1', executor1);
      const result2 = await deduplicator.execute('/api/test2', executor2);

      expect(executor1).toHaveBeenCalledTimes(1);
      expect(executor2).toHaveBeenCalledTimes(1);
      expect(result1).toEqual({ data: 'test1' });
      expect(result2).toEqual({ data: 'test2' });
    });

    it('应该处理请求错误', async () => {
      const executor = vi.fn(() => Promise.reject(new Error('Request failed')));

      await expect(deduplicator.execute('/api/test', executor)).rejects.toThrow('Request failed');
    });

    it('应该提供待处理请求统计', async () => {
      expect(deduplicator.getStats().pendingRequests).toBe(0);
      const pending = deduplicator.execute('/api/test', () => Promise.resolve({ data: 'test' }));
      expect(deduplicator.getStats().pendingRequests).toBe(1);
      await pending;
      expect(deduplicator.getStats().pendingRequests).toBe(0);
    });

    it('应该清空待处理请求', async () => {
      const pending = deduplicator.execute('/api/test', () => Promise.resolve({ data: 'test' }));

      deduplicator.clear();

      const stats = deduplicator.getStats();
      expect(stats.pendingRequests).toBe(0);
      await pending;
    });
  });

  describe('TokenPreRefreshManager', () => {
    let preRefreshManager: TokenPreRefreshManager;

    beforeEach(() => {
      vi.useFakeTimers();
      setSession({ userEmail: 'monitoring@example.test' });
      preRefreshManager = new TokenPreRefreshManager();
    });

    afterEach(() => {
      preRefreshManager.stopMonitoring();
      clearSession();
      vi.useRealTimers();
    });

    it('浏览器会话不会启动凭据刷新', async () => {
      const onRefresh = vi.fn(() => Promise.resolve());

      preRefreshManager.startMonitoring(onRefresh);

      await vi.advanceTimersByTimeAsync(60_000);
      expect(onRefresh).not.toHaveBeenCalled();
    });
  });

  describe('并发请求', () => {
    it('去重大量相同请求', async () => {
      const deduplicator = new RequestDeduplicator();
      const executor = vi.fn(() => Promise.resolve({ data: 'test' }));

      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(deduplicator.execute('/api/test', executor));
      }

      await Promise.all(promises);

      // 10 个相同请求应该只执行 1 次
      expect(executor).toHaveBeenCalledTimes(1);
    });
    it('应该在多个操作中使用去重器', async () => {
      const deduplicator = new RequestDeduplicator();
      const executor = vi.fn(() => Promise.resolve({ authenticated: true }));

      // 并行请求相同的端点
      const results = await Promise.all([
        deduplicator.execute('/api/auth', executor),
        deduplicator.execute('/api/auth', executor),
        deduplicator.execute('/api/auth', executor),
      ]);

      // 都应该返回相同结果
      expect(results.every((r) => r.authenticated === true)).toBe(true);
      // 只执行一次
      expect(executor).toHaveBeenCalledTimes(1);
    });
  });
});
