import { createServer } from 'node:http';
import { describe, expect, it } from 'vitest';
import { startTracing } from '../../adapters/observability/tracing.js';
import { createApiServer } from '../../apps/api/src/create-api-server.js';

describe('tracing shutdown', () => {
  it('exports a completed request before the scheduled batch when shutdown is called', async () => {
    let receivedBytes = 0;
    let requests = 0;
    const chunks: Buffer[] = [];
    const collector = createServer((request, response) => {
      requests += 1;
      request.on('data', (chunk: Buffer) => {
        receivedBytes += chunk.length;
        chunks.push(chunk);
      });
      request.on('end', () => {
        response.writeHead(200, { 'content-type': 'application/x-protobuf' });
        response.end();
      });
    });
    await new Promise<void>((resolve) => collector.listen(0, '127.0.0.1', resolve));
    const address = collector.address();
    if (!address || typeof address === 'string') throw new Error('Missing collector address');
    const tracing = startTracing({
      enabled: true,
      serviceName: 'pci-api-shutdown-test',
      environment: 'test',
      endpoint: `http://127.0.0.1:${address.port}/v1/traces`,
      samplingRate: 1,
      queueSize: 128,
      exportTimeoutMs: 1000,
      shutdownTimeoutMs: 2000,
    });
    const api = await createApiServer();
    try {
      expect(
        (
          await api.inject({
            url: '/health?token=query-secret-marker',
            headers: {
              traceparent: '00-123456789abcdef0123456789abcdef0-123456789abcdef0-01',
              tracestate: 'example=state-secret-marker',
              baggage: 'secret=baggage-secret-marker',
              authorization: 'Bearer authorization-secret-marker',
              cookie: 'session=cookie-secret-marker',
            },
          })
        ).statusCode,
      ).toBe(200);
      expect(requests).toBe(0);
      await api.close();
      await tracing.shutdown();
      expect(requests).toBe(1);
      expect(receivedBytes).toBeGreaterThan(0);
      const exported = Buffer.concat(chunks).toString('utf8');
      const data = JSON.parse(exported) as {
        resourceSpans: Array<{
          scopeSpans: Array<{
            spans: Array<{ traceId: string; parentSpanId: string; traceState?: string }>;
          }>;
        }>;
      };
      const span = data.resourceSpans[0]?.scopeSpans[0]?.spans[0];
      expect(span?.traceId).toBe('123456789abcdef0123456789abcdef0');
      expect(span?.parentSpanId).toBe('123456789abcdef0');
      expect(span?.traceState).toBeUndefined();
      for (const secret of [
        'query-secret-marker',
        'state-secret-marker',
        'baggage-secret-marker',
        'authorization-secret-marker',
        'cookie-secret-marker',
      ])
        expect(exported).not.toContain(secret);
    } finally {
      await api.close();
      await tracing.shutdown();
      await new Promise<void>((resolve) => collector.close(() => resolve()));
    }
  });
});
