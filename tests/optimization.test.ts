/**
 * 性能优化测试
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  TokenCacheManager,
  RequestDeduplicator,
  TokenPreRefreshManager,
} from '../apps/web-v2/lib/api/optimization';

describe('Performance Optimization', () => {
  describe('TokenCacheManager', () => {
    let cacheManager: TokenCacheManager;

    beforeEach(() => {
      cacheManager = new TokenCacheManager();
    });

    it('应该缓存 token', () => {
      cacheManager.set('key1', 'token123');
      expect(cacheManager.get('key1')).toBe('token123');
    });

    it('应该返回 null 当缓存不存在', () => {
      expect(cacheManager.get('nonexistent')).toBeNull();
    });

    it('应该清空缓存', () => {
      cacheManager.set('key1', 'token123');
      cacheManager.clear();
      expect(cacheManager.get('key1')).toBeNull();
    });

    it('应该支持多个缓存条目', () => {
      cacheManager.set('key1', 'token1');
      cacheManager.set('key2', 'token2');
      cacheManager.set('key3', 'token3');

      expect(cacheManager.get('key1')).toBe('token1');
      expect(cacheManager.get('key2')).toBe('token2');
      expect(cacheManager.get('key3')).toBe('token3');
    });

    it('应该提供缓存统计', () => {
      cacheManager.set('key1', 'token1');
      cacheManager.set('key2', 'token2');

      const stats = cacheManager.getStats();
      expect(stats.size).toBe(2);
      expect(stats.maxSize).toBe(100);
      expect(stats.utilization).toMatch(/^2\.00%$/);
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
      const executor = vi.fn(async () => ({ data: 'test' }));

      const result = await deduplicator.execute(
        '/api/test',
        executor
      );

      expect(result).toEqual({ data: 'test' });
      expect(executor).toHaveBeenCalledTimes(1);
    });

    it('应该去重相同的请求', async () => {
      const executor = vi.fn(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
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
      const executor1 = vi.fn(async () => ({ data: 'test1' }));
      const executor2 = vi.fn(async () => ({ data: 'test2' }));

      const result1 = await deduplicator.execute('/api/test1', executor1);
      const result2 = await deduplicator.execute('/api/test2', executor2);

      expect(executor1).toHaveBeenCalledTimes(1);
      expect(executor2).toHaveBeenCalledTimes(1);
      expect(result1).toEqual({ data: 'test1' });
      expect(result2).toEqual({ data: 'test2' });
    });

    it('应该处理请求错误', async () => {
      const executor = vi.fn(async () => {
        throw new Error('Request failed');
      });

      await expect(
        deduplicator.execute('/api/test', executor)
      ).rejects.toThrow('Request failed');
    });

    it('应该提供待处理请求统计', async () => {
      let stats = deduplicator.getStats();
      expect(stats.pendingRequests).toBe(0);

      deduplicator.execute('/api/test', async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return { data: 'test' };
      });

      stats = deduplicator.getStats();
      expect(stats.pendingRequests).toBeGreaterThan(0);
    });

    it('应该清空待处理请求', () => {
      deduplicator.execute('/api/test', async () => ({
        data: 'test',
      }));

      deduplicator.clear();

      const stats = deduplicator.getStats();
      expect(stats.pendingRequests).toBe(0);
    });
  });

  describe('TokenPreRefreshManager', () => {
    let preRefreshManager: TokenPreRefreshManager;

    beforeEach(() => {
      preRefreshManager = new TokenPreRefreshManager();
    });

    afterEach(() => {
      preRefreshManager.stopMonitoring();
    });

    it('应该启动和停止监视', (done) => {
      const onRefresh = vi.fn(async () => {});

      preRefreshManager.startMonitoring(onRefresh);

      // 验证正在监视
      setTimeout(() => {
        preRefreshManager.stopMonitoring();
        done();
      }, 100);
    });

    it('应该处理监视期间的错误', (done) => {
      const onRefresh = vi.fn(async () => {
        throw new Error('Refresh failed');
      });

      preRefreshManager.startMonitoring(onRefresh);

      // 验证监视继续运行
      setTimeout(() => {
        preRefreshManager.stopMonitoring();
        done();
      }, 100);
    });
  });

  describe('缓存性能测试', () => {
    it('大量缓存操作性能', () => {
      const cacheManager = new TokenCacheManager();
      const startTime = performance.now();

      for (let i = 0; i < 1000; i++) {
        cacheManager.set(`key${i}`, `token${i}`);
      }

      const insertTime = performance.now() - startTime;

      // 应该在合理时间内完成
      expect(insertTime).toBeLessThan(100); // 100ms
    });

    it('去重大量相同请求', async () => {
      const deduplicator = new RequestDeduplicator();
      const executor = vi.fn(async () => ({ data: 'test' }));

      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(
          deduplicator.execute('/api/test', executor)
        );
      }

      await Promise.all(promises);

      // 10 个相同请求应该只执行 1 次
      expect(executor).toHaveBeenCalledTimes(1);
    });
  });

  describe('集成场景', () => {
    it('应该在缓存中存储和检索 token', () => {
      const cacheManager = new TokenCacheManager();

      cacheManager.set('user123', 'eyJhbGc...');
      expect(cacheManager.get('user123')).toBe('eyJhbGc...');
    });

    it('应该在多个操作中使用去重器', async () => {
      const deduplicator = new RequestDeduplicator();
      const executor = vi.fn(async () => ({ authenticated: true }));

      // 并行请求相同的端点
      const results = await Promise.all([
        deduplicator.execute('/api/auth', executor),
        deduplicator.execute('/api/auth', executor),
        deduplicator.execute('/api/auth', executor),
      ]);

      // 都应该返回相同结果
      expect(results.every(r => r.authenticated === true)).toBe(true);
      // 只执行一次
      expect(executor).toHaveBeenCalledTimes(1);
    });
  });
});
