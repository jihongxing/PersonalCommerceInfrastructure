import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { describe, expect, it } from 'vitest';
import { runTracingProbe } from '../../scripts/operations/tracing-probe.js';

describe('tracing operations probe', () => {
  it('verifies the exact exported span and authenticates only the query', async () => {
    let receivedTrace = '';
    let receivedSpan = '';
    let collectorAuthorization: string | undefined;
    let queryAuthorization: string | undefined;
    let queryCount = 0;
    const server = createServer((request, response) => {
      if (request.method === 'POST') {
        collectorAuthorization = request.headers.authorization;
        let raw = '';
        request.setEncoding('utf8');
        request.on('data', (chunk: string) => {
          raw += chunk;
        });
        request.on('end', () => {
          const body = JSON.parse(raw) as {
            resourceSpans: Array<{
              scopeSpans: Array<{ spans: Array<{ traceId: string; spanId: string }> }>;
            }>;
          };
          receivedTrace = body.resourceSpans[0]!.scopeSpans[0]!.spans[0]!.traceId;
          receivedSpan = body.resourceSpans[0]!.scopeSpans[0]!.spans[0]!.spanId;
          response.end('{"partialSuccess":{}}');
        });
      } else {
        queryAuthorization = request.headers.authorization;
        expect(request.url).toBe(`/prefix/api/traces/${receivedTrace}`);
        if (queryCount++ === 0) {
          response.writeHead(503).end();
          return;
        }
        response.end(
          JSON.stringify({ data: [{ spans: [{ traceID: receivedTrace, spanID: receivedSpan }] }] }),
        );
      }
    });
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const address = server.address() as AddressInfo;
    try {
      const base = `http://127.0.0.1:${address.port}`;
      const traceId = await runTracingProbe({
        TRACING_PROBE_OTLP_URL: `${base}/v1/traces`,
        TRACING_PROBE_JAEGER_URL: `${base}/prefix`,
        TRACING_PROBE_QUERY_TOKEN: 'private-test-token',
      });
      expect(traceId).toBe(receivedTrace);
      expect(receivedSpan).toMatch(/^[0-9a-f]{16}$/u);
      expect(collectorAuthorization).toBeUndefined();
      expect(queryAuthorization).toBe('Bearer private-test-token');
      expect(queryCount).toBe(2);
    } finally {
      server.closeAllConnections();
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
    }
  });

  it.each([
    ['{"partialSuccess":null}', 'Invalid collector response'],
    ['{"partialSuccess":{"rejectedSpans":"bad"}}', 'Invalid collector response'],
    ['{"partialSuccess":{"rejectedSpans":"1"}}', 'Collector rejected probe'],
    ['{"partialSuccess":{},"partial_success":{}}', 'Invalid collector response'],
    ['{"partialSuccess":{"rejectedSpans":"0","rejected_spans":"0"}}', 'Invalid collector response'],
    [
      '{"partialSuccess":{"errorMessage":"warning","error_message":"warning"}}',
      'Invalid collector response',
    ],
    ['{"partialSuccess":{"errorMessage":123}}', 'Invalid collector response'],
    ['{"partialSuccess":{"rejectedSpans":9007199254740992}}', 'Invalid collector response'],
  ])(
    'rejects an invalid or partial collector acknowledgement',
    async (acknowledgement, message) => {
      const server = createServer((_request, response) => response.end(acknowledgement));
      await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
      const address = server.address() as AddressInfo;
      try {
        const base = `http://127.0.0.1:${address.port}`;
        await expect(
          runTracingProbe({
            TRACING_PROBE_OTLP_URL: `${base}/v1/traces`,
            TRACING_PROBE_JAEGER_URL: base,
          }),
        ).rejects.toThrow(message);
      } finally {
        server.closeAllConnections();
        await new Promise<void>((resolve, reject) =>
          server.close((error) => (error ? reject(error) : resolve())),
        );
      }
    },
  );

  it('fails immediately when the query is unauthorized', async () => {
    const server = createServer((request, response) => {
      if (request.method === 'POST') response.end('{}');
      else response.writeHead(403).end();
    });
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const address = server.address() as AddressInfo;
    try {
      const base = `http://127.0.0.1:${address.port}`;
      await expect(
        runTracingProbe({
          TRACING_PROBE_OTLP_URL: `${base}/v1/traces`,
          TRACING_PROBE_JAEGER_URL: base,
        }),
      ).rejects.toThrow('Trace query unauthorized');
    } finally {
      server.closeAllConnections();
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
    }
  });

  it('rejects insecure remote endpoints and credentials embedded in URLs', async () => {
    await expect(
      runTracingProbe({
        TRACING_PROBE_OTLP_URL: 'http://remote.example/v1/traces',
        TRACING_PROBE_JAEGER_URL: 'http://localhost:16686',
      }),
    ).rejects.toThrow('Invalid probe endpoint');
    await expect(
      runTracingProbe({
        TRACING_PROBE_OTLP_URL: 'http://localhost:4318/v1/traces',
        TRACING_PROBE_JAEGER_URL: 'https://user:secret@example.test',
      }),
    ).rejects.toThrow('Invalid probe endpoint');
  });
});
