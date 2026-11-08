import { createServer, type Server } from 'node:http';
import type { Socket } from 'node:net';
import { trace } from '@opentelemetry/api';
import { afterAll, describe, expect, it, vi } from 'vitest';
import { createSafeLogger } from '../../adapters/observability/safe-logger.js';
import { startTracing } from '../../adapters/observability/tracing.js';
import { createApiServer } from '../../apps/api/src/create-api-server.js';

describe('tracing exporter failure', () => {
  let collector: Server | undefined;
  const sockets = new Set<Socket>();

  afterAll(async () => {
    for (const socket of sockets) socket.destroy();
    if (collector) await new Promise<void>((resolve) => collector!.close(() => resolve()));
  });

  it('keeps the API available, reports queue drops and bounds shutdown during network timeout', async () => {
    let collectorRequests = 0;
    collector = createServer(() => {
      collectorRequests += 1;
    });
    collector.on('connection', (socket) => {
      sockets.add(socket);
      socket.on('close', () => sockets.delete(socket));
    });
    await new Promise<void>((resolve) => collector!.listen(0, '127.0.0.1', resolve));
    const address = collector.address();
    if (!address || typeof address === 'string') throw new Error('Missing collector address');

    const messages: string[] = [];
    const logger = createSafeLogger('info', (message) => messages.push(message));
    const tracing = startTracing(
      {
        enabled: true,
        serviceName: 'pci-api-test',
        environment: 'test',
        endpoint: `http://127.0.0.1:${address.port}/v1/traces`,
        samplingRate: 1,
        queueSize: 2,
        exportTimeoutMs: 300,
        shutdownTimeoutMs: 150,
      },
      logger,
    );
    const api = await createApiServer({ logger, checkReadiness: async () => {} });
    try {
      const tracer = trace.getTracer('export-failure-test');
      for (let index = 0; index < 30; index += 1) tracer.startSpan('test').end();
      expect(messages.filter((message) => message.includes('trace_queue_full'))).toHaveLength(1);
      expect(messages.join('\n')).not.toContain('trace_queue_dropped');
      await vi.waitFor(() => expect(collectorRequests).toBeGreaterThan(0));
      expect((await api.inject({ url: '/health' })).statusCode).toBe(200);
      expect((await api.inject({ url: '/api/v1/readiness' })).statusCode).toBe(200);
      await vi.waitFor(() => expect(messages.join('\n')).toContain('trace_export_failed'), {
        timeout: 3000,
      });
      tracer.startSpan('queue-recovered').end();
      expect(messages.join('\n')).toContain('trace_queue_dropped');

      const started = performance.now();
      await tracing.shutdown();
      expect(performance.now() - started).toBeLessThan(1000);
      await tracing.shutdown();
    } finally {
      await api.close();
      await tracing.shutdown().catch(() => {});
    }
  });
});
