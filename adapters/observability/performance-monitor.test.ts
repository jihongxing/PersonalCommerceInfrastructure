import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

import {
  createConsolePerformanceMonitor,
  createAggregatingPerformanceMonitor,
  createNoOpPerformanceMonitor,
  createPerformanceMonitor,
} from './performance-monitor.js';

describe('Performance Monitor', () => {
  describe('createConsolePerformanceMonitor', () => {
    beforeEach(() => {
      vi.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('logs performance metrics to console', () => {
      const monitor = createConsolePerformanceMonitor();

      monitor.record({
        correlationId: 'test-123',
        operation: 'create_order',
        durationMs: 150,
        startedAt: '2026-11-06T08:00:00Z',
        completedAt: '2026-11-06T08:00:00.150Z',
      });

      expect(console.log).toHaveBeenCalledWith(
        '[PERFORMANCE]',
        expect.stringContaining('create_order'),
      );
    });

    it('startTimer returns a stop function', () => {
      const monitor = createConsolePerformanceMonitor();
      const stop = monitor.startTimer('test-456', 'withdraw_funds');

      expect(typeof stop).toBe('function');
    });

    it('records duration when timer is stopped', () => {
      const monitor = createConsolePerformanceMonitor();
      const stop = monitor.startTimer('test-789', 'process_payment');

      // 模拟一些工作
      const start = Date.now();
      while (Date.now() - start < 10) {
        // 忙等待 10ms
      }

      stop();

      expect(console.log).toHaveBeenCalledWith(
        '[PERFORMANCE]',
        expect.stringContaining('process_payment'),
      );
    });

    it('includes metadata in recorded metrics', () => {
      const monitor = createConsolePerformanceMonitor();
      const stop = monitor.startTimer('test-abc', 'update_user', {
        userId: 'user-123',
        success: true,
      });

      stop();

      expect(console.log).toHaveBeenCalledWith(
        '[PERFORMANCE]',
        expect.stringContaining('user-123'),
      );
    });
  });

  describe('createAggregatingPerformanceMonitor', () => {
    it('collects metrics in memory', () => {
      const monitor = createAggregatingPerformanceMonitor();

      monitor.record({
        correlationId: 'test-1',
        operation: 'op1',
        durationMs: 100,
        startedAt: '2026-11-06T08:00:00Z',
        completedAt: '2026-11-06T08:00:00.100Z',
      });

      monitor.record({
        correlationId: 'test-2',
        operation: 'op2',
        durationMs: 200,
        startedAt: '2026-11-06T08:00:01Z',
        completedAt: '2026-11-06T08:00:01.200Z',
      });

      const metrics = monitor.getMetrics();
      expect(metrics).toHaveLength(2);
      expect(metrics[0]?.operation).toBe('op1');
      expect(metrics[1]?.operation).toBe('op2');
    });

    it('calculates statistics', () => {
      const monitor = createAggregatingPerformanceMonitor();

      monitor.record({
        correlationId: 'test-1',
        operation: 'query',
        durationMs: 100,
        startedAt: '2026-11-06T08:00:00Z',
        completedAt: '2026-11-06T08:00:00.100Z',
      });

      monitor.record({
        correlationId: 'test-2',
        operation: 'query',
        durationMs: 200,
        startedAt: '2026-11-06T08:00:01Z',
        completedAt: '2026-11-06T08:00:01.200Z',
      });

      monitor.record({
        correlationId: 'test-3',
        operation: 'mutation',
        durationMs: 300,
        startedAt: '2026-11-06T08:00:02Z',
        completedAt: '2026-11-06T08:00:02.300Z',
      });

      const stats = monitor.getStats();

      expect(stats.totalOperations).toBe(3);
      expect(stats.averageDurationMs).toBe(200);
      expect(stats.maxDurationMs).toBe(300);
      expect(stats.minDurationMs).toBe(100);
      expect(stats.operationCounts).toEqual({
        query: 2,
        mutation: 1,
      });
    });

    it('returns empty stats when no metrics', () => {
      const monitor = createAggregatingPerformanceMonitor();
      const stats = monitor.getStats();

      expect(stats.totalOperations).toBe(0);
      expect(stats.averageDurationMs).toBe(0);
      expect(stats.operationCounts).toEqual({});
    });

    it('clears collected metrics', () => {
      const monitor = createAggregatingPerformanceMonitor();

      monitor.record({
        correlationId: 'test-1',
        operation: 'op1',
        durationMs: 100,
        startedAt: '2026-11-06T08:00:00Z',
        completedAt: '2026-11-06T08:00:00.100Z',
      });

      expect(monitor.getMetrics()).toHaveLength(1);

      monitor.clear();

      expect(monitor.getMetrics()).toHaveLength(0);
      expect(monitor.getStats().totalOperations).toBe(0);
    });

    it('startTimer records metrics', () => {
      const monitor = createAggregatingPerformanceMonitor();
      const stop = monitor.startTimer('test-123', 'test_operation');

      stop();

      const metrics = monitor.getMetrics();
      expect(metrics).toHaveLength(1);
      expect(metrics[0]?.operation).toBe('test_operation');
      expect(metrics[0]?.correlationId).toBe('test-123');
      expect(metrics[0]?.durationMs).toBeGreaterThanOrEqual(0);
    });
  });

  describe('createNoOpPerformanceMonitor', () => {
    it('does not throw errors', () => {
      const monitor = createNoOpPerformanceMonitor();

      expect(() => {
        monitor.record({
          correlationId: 'test-1',
          operation: 'op1',
          durationMs: 100,
          startedAt: '2026-11-06T08:00:00Z',
          completedAt: '2026-11-06T08:00:00.100Z',
        });
      }).not.toThrow();
    });

    it('startTimer returns a no-op function', () => {
      const monitor = createNoOpPerformanceMonitor();
      const stop = monitor.startTimer('test-123', 'test_op');

      expect(typeof stop).toBe('function');
      expect(() => stop()).not.toThrow();
    });
  });

  describe('createPerformanceMonitor', () => {
    it('creates console monitor by default', () => {
      const monitor = createPerformanceMonitor();
      expect(monitor).toBeDefined();
    });

    it('creates no-op monitor when disabled', () => {
      const monitor = createPerformanceMonitor({ enabled: false });
      
      // No-op monitor doesn't collect metrics
      const stop = monitor.startTimer('test-1', 'op1');
      stop();
      
      // Should not throw
      expect(() => monitor.record({
        correlationId: 'test-1',
        operation: 'op1',
        durationMs: 100,
        startedAt: '2026-11-06T08:00:00Z',
        completedAt: '2026-11-06T08:00:00.100Z',
      })).not.toThrow();
    });

    it('creates aggregate monitor when mode is aggregate', () => {
      const monitor = createPerformanceMonitor({ mode: 'aggregate' });
      
      // Type assertion to access aggregate-specific methods
      const aggregateMonitor = monitor as ReturnType<typeof createAggregatingPerformanceMonitor>;
      
      monitor.record({
        correlationId: 'test-1',
        operation: 'op1',
        durationMs: 100,
        startedAt: '2026-11-06T08:00:00Z',
        completedAt: '2026-11-06T08:00:00.100Z',
      });

      const metrics = aggregateMonitor.getMetrics();
      expect(metrics).toHaveLength(1);
    });

    it('creates console monitor when mode is console', () => {
      vi.spyOn(console, 'log').mockImplementation(() => {});
      
      const monitor = createPerformanceMonitor({ mode: 'console' });
      
      monitor.record({
        correlationId: 'test-1',
        operation: 'op1',
        durationMs: 100,
        startedAt: '2026-11-06T08:00:00Z',
        completedAt: '2026-11-06T08:00:00.100Z',
      });

      expect(console.log).toHaveBeenCalledWith(
        '[PERFORMANCE]',
        expect.any(String),
      );

      vi.restoreAllMocks();
    });
  });

  describe('real-world scenarios', () => {
    it('measures database query performance', () => {
      const monitor = createAggregatingPerformanceMonitor();

      // 模拟数据库查询
      const stop = monitor.startTimer('query-1', 'fetch_user', {
        resourceType: 'User',
        resourceId: 'user-123',
      });

      // 模拟查询时间
      const start = Date.now();
      while (Date.now() - start < 5) {
        // 忙等待 5ms
      }

      stop();

      const metrics = monitor.getMetrics();
      expect(metrics[0]?.durationMs).toBeGreaterThanOrEqual(5);
      expect(metrics[0]?.metadata?.resourceType).toBe('User');
    });

    it('tracks API endpoint performance', () => {
      const monitor = createAggregatingPerformanceMonitor();

      // 模拟 API 请求处理
      const stop = monitor.startTimer('req-123', 'POST /api/orders', {
        userId: 'user-456',
        success: true,
      });

      stop();

      const stats = monitor.getStats();
      expect(stats.operationCounts['POST /api/orders']).toBe(1);
    });

    it('identifies slow operations', () => {
      const monitor = createAggregatingPerformanceMonitor();

      // 快速操作
      for (let i = 0; i < 5; i++) {
        monitor.record({
          correlationId: `fast-${i}`,
          operation: 'fast_query',
          durationMs: 10,
          startedAt: '2026-11-06T08:00:00Z',
          completedAt: '2026-11-06T08:00:00.010Z',
        });
      }

      // 慢操作
      monitor.record({
        correlationId: 'slow-1',
        operation: 'slow_query',
        durationMs: 500,
        startedAt: '2026-11-06T08:00:01Z',
        completedAt: '2026-11-06T08:00:01.500Z',
      });

      const stats = monitor.getStats();
      expect(stats.maxDurationMs).toBe(500);
      expect(stats.minDurationMs).toBe(10);
    });
  });
});
