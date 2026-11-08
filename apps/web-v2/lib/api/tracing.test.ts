import { afterEach, describe, expect, it, vi } from 'vitest';
import { trace } from '@opentelemetry/api';

describe('browser tracing exporter', () => {
  afterEach(() => {
    trace.disable();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('batches ended spans within the receiver limit and exports only allowed data', async () => {
    vi.stubEnv('NEXT_PUBLIC_OTEL_BROWSER_TRACING_ENABLED', 'true');
    vi.stubEnv('NEXT_PUBLIC_API_BASE_URL', 'http://localhost:8080');
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);
    const {
      finishRefreshWaitSpan,
      finishRequestSpan,
      injectRequestTrace,
      startRefreshWaitSpan,
      startRequestSpan,
    } = await import('./tracing');

    for (let index = 0; index < 10; index += 1) {
      const links = Array.from({ length: 16 }, (_, link) => ({
        traceId: (link + 1).toString(16).padStart(32, '0'),
        spanId: (link + 1).toString(16).padStart(16, '0'),
        traceFlags: 1,
      }));
      const span = startRequestSpan(
        'GET',
        '/api/v1/private/user@example.test?token=secret-value',
        links,
      );
      expect(span).toBeDefined();
      const headers = new Headers();
      injectRequestTrace(span, headers, 'http://localhost:8080/api/v1/creator/identity');
      expect(headers.get('traceparent')).toMatch(/^00-[0-9a-f]{32}-[0-9a-f]{16}-01$/u);
      const untrustedHeaders = new Headers();
      injectRequestTrace(span, untrustedHeaders, 'https://untrusted.example.test/');
      expect(untrustedHeaders.has('traceparent')).toBe(false);
      finishRequestSpan(span, 200);
    }

    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2), { timeout: 3000 });
    const batches = fetchMock.mock.calls.map(([, options]) => {
      expect(options.credentials).toBe('omit');
      expect(options.keepalive).toBe(true);
      expect(options.redirect).toBe('error');
      expect(options.body).not.toContain('user@example.test');
      expect(options.body).not.toContain('secret-value');
      expect(new TextEncoder().encode(options.body).byteLength).toBeLessThanOrEqual(16384);
      return JSON.parse(options.body).spans as Array<{ route: string }>;
    });
    expect(batches.map((batch) => batch.length)).toEqual([8, 2]);
    expect(batches.flat().every((span) => span.route === '/api/v1/*')).toBe(true);

    const waitLinks = Array.from({ length: 2 }, (_, index) => ({
      traceId: (index + 1).toString(16).padStart(32, '0'),
      spanId: (index + 1).toString(16).padStart(16, '0'),
      traceFlags: 1,
    }));
    finishRefreshWaitSpan(startRefreshWaitSpan(waitLinks), 'rejected');
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3), { timeout: 3000 });
    const wait = JSON.parse(fetchMock.mock.calls[2][1].body).spans[0];
    expect(wait).toMatchObject({
      operation: 'auth.refresh.wait',
      outcome: 'rejected',
      links: waitLinks.map(({ traceId, spanId }) => ({ traceId, spanId })),
    });
    expect(wait).not.toHaveProperty('method');

    fetchMock.mockImplementation(() => {
      throw new Error('synchronous export failure');
    });
    for (let batch = 0; batch < 33; batch += 1) {
      for (let index = 0; index < 8; index += 1) {
        finishRequestSpan(startRequestSpan('GET', '/api/v1/creator/identity'), 200);
      }
      await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(batch + 4));
    }
    fetchMock.mockResolvedValue({ ok: true });
    for (let index = 0; index < 8; index += 1) {
      finishRequestSpan(startRequestSpan('GET', '/api/v1/creator/identity'), 200);
    }
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(37));
    finishRequestSpan(startRequestSpan('POST', '/api/v1/auth/refresh'), 200, true);
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(38), { timeout: 3000 });
    const failed = JSON.parse(fetchMock.mock.calls[37][1].body).spans[0];
    expect(failed).toMatchObject({ route: '/api/v1/auth/refresh', status: 200, failed: true });
  });
});
