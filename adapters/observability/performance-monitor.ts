/**
 * Performance metrics collected during request processing.
 */
export interface PerformanceMetrics {
  correlationId: string;
  operation: string;
  durationMs: number;
  startedAt: string;
  completedAt: string;
  breakdown?: {
    databaseMs?: number;
    externalServiceMs?: number;
    businessLogicMs?: number;
    serializationMs?: number;
  };
  metadata?: Record<string, unknown>;
}

/**
 * Performance monitor interface.
 */
export interface PerformanceMonitor {
  record(metrics: PerformanceMetrics): void;
  startTimer(correlationId: string, operation: string, metadata?: Record<string, unknown>): () => void;
}

/**
 * In-memory performance monitor that logs to console.
 */
export function createConsolePerformanceMonitor(): PerformanceMonitor {
  return {
    record(metrics) {
      console.log('[PERFORMANCE]', JSON.stringify(metrics));
    },

    startTimer(correlationId, operation, metadata) {
      const startTime = Date.now();
      const startedAt = new Date().toISOString();

      return () => {
        this.record({
          correlationId,
          operation,
          durationMs: Date.now() - startTime,
          startedAt,
          completedAt: new Date().toISOString(),
          metadata,
        });
      };
    },
  };
}

/**
 * Aggregating performance monitor that collects metrics in memory.
 */
export function createAggregatingPerformanceMonitor(): PerformanceMonitor & {
  getMetrics(): PerformanceMetrics[];
  clear(): void;
  getStats(): {
    totalOperations: number;
    averageDurationMs: number;
    maxDurationMs: number;
    minDurationMs: number;
    operationCounts: Record<string, number>;
  };
} {
  const metrics: PerformanceMetrics[] = [];

  return {
    record(metric) {
      metrics.push(metric);
    },

    startTimer(correlationId, operation, metadata) {
      const startTime = Date.now();
      const startedAt = new Date().toISOString();

      return () => {
        this.record({
          correlationId,
          operation,
          durationMs: Date.now() - startTime,
          startedAt,
          completedAt: new Date().toISOString(),
          metadata,
        });
      };
    },

    getMetrics() {
      return [...metrics];
    },

    clear() {
      metrics.length = 0;
    },

    getStats() {
      if (metrics.length === 0) {
        return {
          totalOperations: 0,
          averageDurationMs: 0,
          maxDurationMs: 0,
          minDurationMs: 0,
          operationCounts: {},
        };
      }

      const durations = metrics.map((m) => m.durationMs);
      const operationCounts: Record<string, number> = {};

      for (const metric of metrics) {
        operationCounts[metric.operation] = (operationCounts[metric.operation] ?? 0) + 1;
      }

      return {
        totalOperations: metrics.length,
        averageDurationMs: durations.reduce((a, b) => a + b, 0) / durations.length,
        maxDurationMs: Math.max(...durations),
        minDurationMs: Math.min(...durations),
        operationCounts,
      };
    },
  };
}

/**
 * No-op performance monitor.
 */
export function createNoOpPerformanceMonitor(): PerformanceMonitor {
  return {
    record() {},
    startTimer() {
      return () => {};
    },
  };
}

/**
 * Creates a performance monitor based on configuration.
 */
export function createPerformanceMonitor(
  options: {
    enabled?: boolean;
    mode?: 'console' | 'aggregate' | 'noop';
  } = {},
): PerformanceMonitor {
  const { enabled = true, mode = 'console' } = options;

  if (!enabled) {
    return createNoOpPerformanceMonitor();
  }

  switch (mode) {
    case 'console':
      return createConsolePerformanceMonitor();
    case 'aggregate':
      return createAggregatingPerformanceMonitor();
    case 'noop':
      return createNoOpPerformanceMonitor();
    default:
      return createConsolePerformanceMonitor();
  }
}
