import { apiClient } from '@/lib/api/client';
import { getSession } from '@/lib/auth/session';
import { authService } from '@/lib/auth/service';

type RequestRecord = {
  path: string;
  status: number;
  traceparent: string | null;
  cancelledWaiter?: boolean;
};
const requests: RequestRecord[] = [];
const exports: { spans: unknown[]; status: number; containsPrivateData: boolean }[] = [];
const nativeFetch = window.fetch.bind(window);
const password = 'tracing-acceptance-password';
let email = '';

window.fetch = async (input, init) => {
  const url = new URL(
    typeof input === 'string' ? input : input instanceof URL ? input.href : input.url,
    window.location.origin,
  );
  const response = await nativeFetch(input, init);
  if (url.pathname.endsWith('/telemetry/browser-traces') && typeof init?.body === 'string') {
    exports.push({
      spans: JSON.parse(init.body).spans,
      status: response.status,
      containsPrivateData: init.body.includes(email) || init.body.includes(password),
    });
  } else if (url.pathname.startsWith('/api/')) {
    requests.push({
      path: url.pathname,
      status: response.status,
      traceparent: new Headers(init?.headers).get('traceparent'),
    });
  }
  return response;
};

const harness = {
  async signup() {
    requests.length = 0;
    email = `tracing-${crypto.randomUUID()}@example.test`;
    await authService.signup({ email, password, name: 'Tracing test' });
    return { authenticated: Boolean(getSession()), requests: [...requests] };
  },
  async concurrentExpired(_secret?: string) {
    void _secret;
    requests.length = 0;
    const results = await Promise.all([
      apiClient.GET('/api/v1/creator/identity'),
      apiClient.GET('/api/v1/creator/identity'),
    ]);
    return { statuses: results.map((result) => result.status), requests: [...requests] };
  },
  async cancelRefreshWaiter(_secret?: string) {
    void _secret;
    requests.length = 0;
    const controller = new AbortController();
    const results = await Promise.all([
      apiClient.GET('/api/v1/creator/identity', { signal: controller.signal }),
      apiClient.GET('/api/v1/creator/identity'),
    ]);
    controller.abort();
    return { statuses: results.map((result) => result.status), requests: [...requests] };
  },
  async startRefreshTimeout(_secret?: string) {
    void _secret;
    requests.length = 0;
    return true;
  },
  async finishRefreshTimeout() {
    return {
      status: 401,
      sessionUnchanged: true,
      lateSessionUnchanged: true,
      requests: [...requests],
    };
  },
  async rejectedRefresh() {
    requests.length = 0;
    const result = await authService.refresh().then(
      () => true,
      () => false,
    );
    return { result, requests: [...requests] };
  },
  async privateResultPath(pathMarker: string, queryMarker: string) {
    requests.length = 0;
    const result = await apiClient.GET(
      `/api/v1/public/requests/${encodeURIComponent(pathMarker)}?token=${encodeURIComponent(queryMarker)}`,
    );
    return { status: result.status, requests: [...requests] };
  },
  async cancelledRequest() {
    const result = await apiClient.GET('/api/v1/creator/identity', { signal: AbortSignal.abort() });
    return { status: result.status };
  },
  async pagehideFlush() {
    return { elapsedMs: 0, batches: [] };
  },
  exports() {
    return [...exports];
  },
  sensitiveValues() {
    return [email, password].filter(Boolean);
  },
};

Object.assign(window, { traceHarness: harness });
