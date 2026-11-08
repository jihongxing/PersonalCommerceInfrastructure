import { createServer } from 'node:http';
import { trace } from '@opentelemetry/api';
import { describe, expect, it } from 'vitest';
import { createSafeLogger } from '../../adapters/observability/safe-logger.js';
import { startTracing } from '../../adapters/observability/tracing.js';

describe('tracing partial success', () => {
  it('reports an OTLP partial acceptance without exposing collector details', async () => {
    let requests = 0;
    const collector = createServer((_request, response) => {
      requests += 1;
      response.writeHead(200, { 'content-type': 'application/json' });
      response.end(
        '{"partialSuccess":{"rejectedSpans":"1","errorMessage":"private-collector-detail"}}',
      );
    });
    await new Promise<void>((resolve) => collector.listen(0, '127.0.0.1', resolve));
    const address = collector.address();
    if (!address || typeof address === 'string') throw new Error('Missing collector address');
    const messages: string[] = [];
    const tracing = startTracing(
      {
        enabled: true,
        serviceName: 'pci-api-partial-success-test',
        environment: 'test',
        endpoint: `http://127.0.0.1:${address.port}/v1/traces`,
        samplingRate: 1,
        queueSize: 16,
        exportTimeoutMs: 1000,
        shutdownTimeoutMs: 2000,
      },
      createSafeLogger('info', (message) => messages.push(message)),
    );
    try {
      trace.getTracer('partial-success-test').startSpan('test').end();
      await tracing.shutdown();
      expect(requests).toBe(1);
      expect(
        messages.filter((message) => message.includes('trace_export_partial_success')),
      ).toHaveLength(1);
      expect(messages.join('\n')).not.toContain('private-collector-detail');
    } finally {
      await tracing.shutdown();
      collector.closeAllConnections();
      await new Promise<void>((resolve, reject) =>
        collector.close((error) => (error ? reject(error) : resolve())),
      );
    }
  });
});
