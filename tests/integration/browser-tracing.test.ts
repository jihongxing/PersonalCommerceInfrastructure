import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApiServer } from '../../apps/api/src/create-api-server.js';
import { createSafeLogger } from '../../adapters/observability/safe-logger.js';

describe('browser trace ingestion', () => {
  afterEach(() => vi.unstubAllGlobals());

  const validPayload = () => ({
    spans: [
      {
        traceId: '1'.repeat(32),
        spanId: '2'.repeat(16),
        startMs: Date.now(),
        durationMs: 1,
        method: 'GET',
        route: '/api/v1/*',
        status: 200,
        links: [],
      },
    ],
  });

  it('forwards only the allowlisted refresh wait operation as an internal span', async () => {
    let forwarded = '';
    vi.stubGlobal(
      'fetch',
      vi.fn((_url: string, options: RequestInit) => {
        forwarded = typeof options.body === 'string' ? options.body : '';
        return Promise.resolve(new Response('{}'));
      }),
    );
    const server = await createApiServer({
      browserTracingEndpoint: 'http://collector.test/v1/traces',
      corsAllowedOrigins: ['http://localhost:3000'],
    });
    const span = {
      ...validPayload().spans[0],
      operation: 'auth.refresh.wait',
      outcome: 'rejected',
      links: [{ traceId: '3'.repeat(32), spanId: '4'.repeat(16) }],
      secret: 'must-not-be-forwarded',
    };
    const inject = (payload: unknown) =>
      server.inject({
        method: 'POST',
        url: '/api/v1/telemetry/browser-traces',
        headers: { origin: 'http://localhost:3000' },
        payload: { spans: [payload] },
      });
    try {
      expect((await inject(span)).statusCode).toBe(202);
      const payload = JSON.parse(forwarded) as {
        resourceSpans: Array<{ scopeSpans: Array<{ spans: Array<{ attributes: unknown }> }> }>;
      };
      const exported = payload.resourceSpans[0].scopeSpans[0].spans[0];
      expect(exported).toMatchObject({
        name: 'auth.refresh.wait',
        kind: 1,
        status: { code: 2 },
        links: span.links,
      });
      expect(exported.attributes).toEqual([
        { key: 'pci.refresh.outcome', value: { stringValue: 'rejected' } },
      ]);
      expect(forwarded).not.toContain('must-not-be-forwarded');
      expect((await inject({ ...span, operation: 'other' })).statusCode).toBe(400);
      expect((await inject({ ...span, outcome: 'private-value' })).statusCode).toBe(400);
    } finally {
      await server.close();
    }
  });

  it('bounds concurrent collector requests and accepts new exports after completion', async () => {
    const pending: Array<(response: Response) => void> = [];
    const forward = vi
      .fn()
      .mockImplementation(() => new Promise<Response>((resolve) => pending.push(resolve)));
    vi.stubGlobal('fetch', forward);
    const messages: string[] = [];
    const server = await createApiServer({
      browserTracingEndpoint: 'http://collector.test/v1/traces',
      corsAllowedOrigins: ['http://localhost:3000'],
      logger: createSafeLogger('warn', (message) => messages.push(message)),
    });
    const inject = () =>
      server.inject({
        method: 'POST',
        url: '/api/v1/telemetry/browser-traces',
        headers: { origin: 'http://localhost:3000' },
        payload: validPayload(),
      });
    const requests: PromiseLike<{ statusCode: number }>[] = [];
    try {
      for (let i = 0; i < 16; i += 1) requests.push(inject().then((response) => response));
      await vi.waitFor(() => expect(pending).toHaveLength(16));
      expect((await inject()).statusCode).toBe(503);
      expect(forward).toHaveBeenCalledTimes(16);
      expect(messages.join('\n')).toContain('collector_concurrency_limit');
      pending.shift()?.(new Response('{}'));
      expect((await requests[0]).statusCode).toBe(202);
      const recovered = inject().then((response) => response);
      await vi.waitFor(() => expect(forward).toHaveBeenCalledTimes(17));
      pending.pop()?.(new Response('{}'));
      expect((await recovered).statusCode).toBe(202);
    } finally {
      for (const resolve of pending) resolve(new Response('{}'));
      await Promise.all(requests);
      await server.close();
    }
  });

  it('rejects an oversized streamed collector response and releases capacity', async () => {
    let cancelled = false;
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array(9000));
        controller.enqueue(new Uint8Array(9000));
      },
      cancel() {
        cancelled = true;
      },
    });
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(new Response(stream))
        .mockResolvedValueOnce(new Response('{"partialSuccess":{}}')),
    );
    const server = await createApiServer({
      browserTracingEndpoint: 'http://collector.test/v1/traces',
      corsAllowedOrigins: ['http://localhost:3000'],
    });
    const inject = () =>
      server.inject({
        method: 'POST',
        url: '/api/v1/telemetry/browser-traces',
        headers: { origin: 'http://localhost:3000' },
        payload: validPayload(),
      });
    try {
      expect((await inject()).statusCode).toBe(503);
      expect(cancelled).toBe(true);
      expect((await inject()).statusCode).toBe(202);
    } finally {
      await server.close();
    }
  });

  it('does not forward telemetry to a collector redirect and recovers', async () => {
    let collectorRequests = 0;
    let redirectRequests = 0;
    const collector = createServer((request, response) => {
      if (request.url === '/redirected') {
        redirectRequests += 1;
        response.end('{}');
      } else if (++collectorRequests === 1) {
        response.writeHead(307, { location: '/redirected' }).end();
      } else {
        response.end('{}');
      }
    });
    await new Promise<void>((resolve) => collector.listen(0, '127.0.0.1', resolve));
    const address = collector.address() as AddressInfo;
    const server = await createApiServer({
      browserTracingEndpoint: `http://127.0.0.1:${address.port}/v1/traces`,
      corsAllowedOrigins: ['http://localhost:3000'],
    });
    const inject = () =>
      server.inject({
        method: 'POST',
        url: '/api/v1/telemetry/browser-traces',
        headers: { origin: 'http://localhost:3000' },
        payload: validPayload(),
      });
    try {
      expect((await inject()).statusCode).toBe(503);
      expect(redirectRequests).toBe(0);
      expect((await inject()).statusCode).toBe(202);
      expect(collectorRequests).toBe(2);
    } finally {
      await server.close();
      collector.closeAllConnections();
      await new Promise<void>((resolve, reject) =>
        collector.close((error) => (error ? reject(error) : resolve())),
      );
    }
  });

  it('times out a stalled collector response body and recovers', async () => {
    let requests = 0;
    const collector = createServer((_request, response) => {
      requests += 1;
      response.writeHead(200, { 'content-type': 'application/json' });
      if (requests === 1) response.write('{');
      else response.end('{}');
    });
    await new Promise<void>((resolve) => collector.listen(0, '127.0.0.1', resolve));
    const address = collector.address() as AddressInfo;
    const server = await createApiServer({
      browserTracingEndpoint: `http://127.0.0.1:${address.port}/v1/traces`,
      corsAllowedOrigins: ['http://localhost:3000'],
    });
    const inject = () =>
      server.inject({
        method: 'POST',
        url: '/api/v1/telemetry/browser-traces',
        headers: { origin: 'http://localhost:3000' },
        payload: validPayload(),
      });
    try {
      expect((await inject()).statusCode).toBe(503);
      expect((await inject()).statusCode).toBe(202);
      expect(requests).toBe(2);
    } finally {
      await server.close();
      collector.closeAllConnections();
      await new Promise<void>((resolve, reject) =>
        collector.close((error) => (error ? reject(error) : resolve())),
      );
    }
  }, 10000);

  it('enforces origin and field bounds and forwards only permitted attributes', async () => {
    let forwarded = '';
    const forward = vi.fn((_url: string, options: RequestInit) => {
      forwarded = typeof options.body === 'string' ? options.body : '';
      return Promise.resolve(new Response('{"partialSuccess":{}}'));
    });
    vi.stubGlobal('fetch', forward);
    const server = await createApiServer({
      browserTracingEndpoint: 'http://collector.test/v1/traces',
      corsAllowedOrigins: ['http://localhost:3000'],
    });
    const span = {
      traceId: '1'.repeat(32),
      spanId: '2'.repeat(16),
      startMs: Date.now(),
      durationMs: 4,
      method: 'POST',
      route: '/api/v1/auth/signup',
      status: 201,
      links: [{ traceId: '3'.repeat(32), spanId: '4'.repeat(16), token: 'nested-link-secret' }],
      secret: 'credential-must-not-leave',
      nested: { email: 'private-person@example.test', password: 'private-password' },
    };
    try {
      expect(
        (
          await server.inject({
            method: 'POST',
            url: '/api/v1/telemetry/browser-traces',
            headers: { origin: 'http://attacker.test' },
            payload: { spans: [span] },
          })
        ).statusCode,
      ).toBe(403);
      expect(
        (
          await server.inject({
            method: 'POST',
            url: '/api/v1/telemetry/browser-traces',
            headers: { origin: 'http://localhost:3000' },
            payload: { spans: [{ ...span, route: '/private?token=secret' }] },
          })
        ).statusCode,
      ).toBe(400);
      expect(
        (
          await server.inject({
            method: 'POST',
            url: '/api/v1/telemetry/browser-traces',
            headers: {
              origin: 'http://localhost:3000',
              authorization: 'Bearer incoming-access-secret',
              cookie: 'session=incoming-cookie-secret',
            },
            payload: { spans: [span] },
          })
        ).statusCode,
      ).toBe(202);
      expect(forward).toHaveBeenCalledTimes(1);
      for (const secret of [
        'credential-must-not-leave',
        'nested-link-secret',
        'private-person@example.test',
        'private-password',
        'incoming-access-secret',
        'incoming-cookie-secret',
      ])
        expect(forwarded).not.toContain(secret);
      const options = forward.mock.calls[0]?.[1];
      expect(options?.headers).toEqual({ 'content-type': 'application/json' });
      expect(forwarded).toContain('/api/v1/auth/signup');
    } finally {
      await server.close();
    }
  });

  it('preserves a received HTTP status and an independent client failure', async () => {
    let forwarded = '';
    const forward = vi.fn((_url: string, options: RequestInit) => {
      forwarded = typeof options.body === 'string' ? options.body : '';
      return Promise.resolve(new Response('{}'));
    });
    vi.stubGlobal('fetch', forward);
    const server = await createApiServer({
      browserTracingEndpoint: 'http://collector.test/v1/traces',
      corsAllowedOrigins: ['http://localhost:3000'],
    });
    const span = {
      traceId: '1'.repeat(32),
      spanId: '2'.repeat(16),
      startMs: Date.now(),
      durationMs: 15000,
      method: 'POST',
      route: '/api/v1/auth/refresh',
      status: 200,
      failed: true,
      links: [],
    };
    const inject = (candidate: object) =>
      server.inject({
        method: 'POST',
        url: '/api/v1/telemetry/browser-traces',
        headers: { origin: 'http://localhost:3000' },
        payload: { spans: [candidate] },
      });
    try {
      expect((await inject({ ...span, failed: 'true' })).statusCode).toBe(400);
      expect((await inject(span)).statusCode).toBe(202);
      const body = JSON.parse(forwarded) as {
        resourceSpans: { scopeSpans: { spans: { status: unknown; attributes: unknown[] }[] }[] }[];
      };
      const exported = body.resourceSpans[0]?.scopeSpans[0]?.spans[0];
      expect(exported?.status).toEqual({ code: 2 });
      expect(exported?.attributes).toContainEqual({
        key: 'http.response.status_code',
        value: { intValue: '200' },
      });
      expect((await inject({ ...span, failed: undefined })).statusCode).toBe(202);
    } finally {
      await server.close();
    }
  });

  it('returns a bounded failure when the collector is unavailable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('unavailable')));
    const server = await createApiServer({
      browserTracingEndpoint: 'http://collector.test/v1/traces',
      corsAllowedOrigins: ['http://localhost:3000'],
    });
    try {
      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/telemetry/browser-traces',
        headers: { origin: 'http://localhost:3000' },
        payload: {
          spans: [
            {
              traceId: '1'.repeat(32),
              spanId: '2'.repeat(16),
              startMs: Date.now(),
              durationMs: 1,
              method: 'GET',
              route: '/api/v1/*',
              status: 200,
              links: [],
            },
          ],
        },
      });
      expect(response.statusCode).toBe(503);
      expect((await server.inject({ url: '/health' })).statusCode).toBe(200);
    } finally {
      await server.close();
    }
  });

  it('rejects oversized batches and limits forwarding from one client', async () => {
    const forward = vi.fn().mockImplementation(() => Promise.resolve(new Response('{}')));
    vi.stubGlobal('fetch', forward);
    const server = await createApiServer({
      browserTracingEndpoint: 'http://collector.test/v1/traces',
      corsAllowedOrigins: ['http://localhost:3000'],
    });
    const span = {
      traceId: '1'.repeat(32),
      spanId: '2'.repeat(16),
      startMs: Date.now(),
      durationMs: 1,
      method: 'GET',
      route: '/api/v1/*',
      status: 200,
      links: [],
    };
    const headers = { origin: 'http://localhost:3000' };
    const inject = (payload: unknown) =>
      server.inject({ method: 'POST', url: '/api/v1/telemetry/browser-traces', headers, payload });
    try {
      expect((await inject({ spans: Array.from({ length: 21 }, () => span) })).statusCode).toBe(
        400,
      );
      expect(
        (await inject({ spans: [{ ...span, extra: 'x'.repeat(16384) }] })).statusCode,
      ).toBeGreaterThanOrEqual(400);
      expect(forward).not.toHaveBeenCalled();

      let accepted = 0;
      for (let index = 0; index < 61; index += 1) {
        const response = await inject({ spans: [span] });
        if (response.statusCode === 202) accepted += 1;
      }
      expect(accepted).toBeLessThanOrEqual(60);
      expect(accepted).toBeGreaterThan(0);
      expect(forward).toHaveBeenCalledTimes(accepted);
    } finally {
      await server.close();
    }
  });

  it('reports partial rejection and malformed collector acknowledgements without logging their contents', async () => {
    const messages: string[] = [];
    const responses = [
      new Response(
        '{"partialSuccess":{"rejectedSpans":"1","errorMessage":"private-collector-detail"}}',
      ),
      new Response('{"partialSuccess":{"rejectedSpans":"0","errorMessage":"private-warning"}}'),
      new Response('{"partialSuccess":{"rejectedSpans":"invalid"}}'),
      new Response('', { status: 503 }),
      new Response('{"partial_success":{"rejected_spans":"1"}}'),
      new Response('{"partialSuccess":null}'),
    ];
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() => Promise.resolve(responses.shift())),
    );
    const server = await createApiServer({
      browserTracingEndpoint: 'http://collector.test/v1/traces',
      corsAllowedOrigins: ['http://localhost:3000'],
      logger: createSafeLogger('warn', (message) => messages.push(message)),
    });
    const payload = {
      spans: [
        {
          traceId: '1'.repeat(32),
          spanId: '2'.repeat(16),
          startMs: Date.now(),
          durationMs: 1,
          method: 'GET',
          route: '/api/v1/*',
          status: 200,
          links: [],
        },
      ],
    };
    try {
      const statuses: number[] = [];
      for (let i = 0; i < 6; i += 1) {
        const response = await server.inject({
          method: 'POST',
          url: '/api/v1/telemetry/browser-traces',
          headers: { origin: 'http://localhost:3000' },
          payload,
        });
        statuses.push(response.statusCode);
      }
      expect(statuses).toEqual([503, 202, 503, 503, 503, 503]);
      expect(messages.join('\n')).toContain('collector_rejected_spans');
      expect(messages.join('\n')).toContain('trace_browser_export_warning');
      expect(messages.join('\n')).toContain('collector_http_error');
      expect(messages.join('\n')).not.toContain('private-collector-detail');
      expect(messages.join('\n')).not.toContain('private-warning');
    } finally {
      await server.close();
    }
  });
});
