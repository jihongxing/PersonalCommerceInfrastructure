import { afterEach, describe, expect, it, vi } from 'vitest';
import { trace } from '@opentelemetry/api';

vi.mock('@/lib/auth/session', () => ({
  getBearerToken: () => 'private-access-token',
  getSession: () => ({
    accessToken: 'private-access-token',
    refreshToken: 'private-refresh-token',
  }),
  setSession: vi.fn(),
  clearSession: vi.fn(),
}));

describe('concurrent refresh export', () => {
  afterEach(() => {
    trace.disable();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('exports a bounded wait span for every waiter after a shared transport failure', async () => {
    vi.stubEnv('NEXT_PUBLIC_OTEL_BROWSER_TRACING_ENABLED', 'true');
    vi.stubEnv('NEXT_PUBLIC_API_BASE_URL', 'http://localhost:8080');
    let failRefresh!: (reason: Error) => void;
    const refresh = new Promise<Response>((_resolve, reject) => {
      failRefresh = reject;
    });
    const exports: string[] = [];
    const fetchMock = vi.fn((url: string, options?: RequestInit) => {
      if (url.endsWith('/api/v1/telemetry/browser-traces')) {
        if (typeof options?.body === 'string') exports.push(options.body);
        return Promise.resolve({ ok: true } as Response);
      }
      if (url.endsWith('/api/v1/auth/refresh')) return refresh;
      return Promise.resolve({
        status: 401,
        ok: false,
        json: async () => ({ error: { code: 'expired' } }),
      } as Response);
    });
    vi.stubGlobal('fetch', fetchMock);
    const logging = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { apiClient } = await import('./client');
    const requests = Array.from({ length: 24 }, () => apiClient.GET('/api/v1/creator/identity'));
    await vi.waitFor(() =>
      expect(
        fetchMock.mock.calls.filter(([url]) => !url.endsWith('/api/v1/telemetry/browser-traces')),
      ).toHaveLength(25),
    );
    failRefresh(new Error('private-refresh-token'));
    expect((await Promise.all(requests)).every((result) => result.status === 0)).toBe(true);

    type ExportSpan = {
      traceId: string;
      spanId: string;
      route?: string;
      operation?: string;
      outcome?: string;
      links: Array<{ traceId: string; spanId: string }>;
    };
    const spans = () =>
      exports.flatMap((body) => (JSON.parse(body) as { spans: ExportSpan[] }).spans);
    await vi.waitFor(() => expect(spans()).toHaveLength(49), { timeout: 5000 });
    const all = spans();
    const originals = all.filter((span) => span.route === '/api/v1/creator/identity');
    const shared = all.find((span) => span.route === '/api/v1/auth/refresh');
    const waits = all.filter((span) => span.operation === 'auth.refresh.wait');
    expect(originals).toHaveLength(24);
    expect(shared).toBeDefined();
    expect(waits).toHaveLength(24);
    const expected = new Set(originals.map((span) => `${span.traceId}/${span.spanId}`));
    for (const wait of waits) {
      expect(wait.outcome).toBe('error');
      expect(wait.links).toHaveLength(2);
      expect(wait.links[1]).toEqual({ traceId: shared!.traceId, spanId: shared!.spanId });
      expect(expected.delete(`${wait.links[0].traceId}/${wait.links[0].spanId}`)).toBe(true);
    }
    expect(expected.size).toBe(0);
    expect(exports.join('\n')).not.toContain('private-');
    expect(JSON.stringify(logging.mock.calls)).not.toContain('private-');
    expect(exports.every((body) => new TextEncoder().encode(body).byteLength <= 16384)).toBe(true);
  });
});
