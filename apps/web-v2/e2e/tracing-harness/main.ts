import { apiClient, refreshSession } from '@/lib/api/client';
import { getSession, setSession } from '@/lib/auth/session';
import { authService } from '@/lib/auth/service';

type RequestRecord = {
  path: string;
  status: number;
  traceparent: string | null;
  cancelledWaiter?: boolean;
};
const requests: RequestRecord[] = [];
type ExportedSpan = {
  traceId: string;
  spanId: string;
  method: string;
  route: string;
  status: number;
  durationMs: number;
  links: { traceId: string; spanId: string }[];
};
const exports: { spans: ExportedSpan[]; status: number; containsPrivateData: boolean }[] = [];
const nativeFetch = window.fetch.bind(window);
const password = 'tracing-acceptance-password';
let email = '';
let holdRefresh = false;
let releaseRefresh: (() => void) | undefined;
let timeoutResult: { status: number; sessionUnchanged: boolean } | undefined;
let cancelledSignal: AbortSignal | undefined;

window.fetch = async (input, init) => {
  const url = new URL(
    typeof input === 'string' ? input : input instanceof URL ? input.href : input.url,
  );
  const response = await nativeFetch(input, init);
  if (url.pathname === '/api/v1/telemetry/browser-traces' && typeof init?.body === 'string') {
    exports.push({
      spans: JSON.parse(init.body).spans,
      status: response.status,
      containsPrivateData:
        (email !== '' && init.body.includes(email)) || init.body.includes(password),
    });
  } else if (url.origin === 'http://localhost:18080') {
    requests.push({
      path: url.pathname,
      status: response.status,
      traceparent: new Headers(init?.headers).get('traceparent'),
      ...(cancelledSignal && init?.signal === cancelledSignal ? { cancelledWaiter: true } : {}),
    });
    if (url.pathname === '/api/v1/auth/refresh') {
      if (holdRefresh) {
        const readBody = response.json.bind(response);
        response.json = async () => {
          await new Promise<void>((resolve) => {
            releaseRefresh = resolve;
          });
          return readBody();
        };
      } else {
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
    }
  }
  return response;
};

const base64url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes))
    .replace(/=/gu, '')
    .replace(/\+/gu, '-')
    .replace(/\//gu, '_');

async function expireSignedAccessToken(secret: string): Promise<void> {
  const session = getSession();
  if (!session) throw new Error('Missing test session');
  const [header, payload] = session.accessToken.split('.');
  const claims = JSON.parse(atob(payload.replace(/-/gu, '+').replace(/_/gu, '/')));
  claims.exp = Math.floor(Date.now() / 1000) - 60;
  const message = `${header}.${base64url(new TextEncoder().encode(JSON.stringify(claims)))}`;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = new Uint8Array(
    await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message)),
  );
  setSession({ ...session, accessToken: `${message}.${base64url(signature)}` });
}

const harness = {
  async signup() {
    requests.length = 0;
    email = `tracing-${crypto.randomUUID()}@example.test`;
    await authService.signup({ email, password, name: 'Tracing test' });
    return { authenticated: Boolean(getSession()), requests: [...requests] };
  },
  async concurrentExpired(secret: string) {
    requests.length = 0;
    await expireSignedAccessToken(secret);
    const results = await Promise.all([
      apiClient.GET('/api/v1/creator/identity'),
      apiClient.GET('/api/v1/creator/identity'),
    ]);
    return { statuses: results.map((result) => result.status), requests: [...requests] };
  },
  async cancelRefreshWaiter(secret: string) {
    requests.length = 0;
    await expireSignedAccessToken(secret);
    const controller = new AbortController();
    cancelledSignal = controller.signal;
    const cancelled = apiClient.GET('/api/v1/creator/identity', { signal: controller.signal });
    const remaining = apiClient.GET('/api/v1/creator/identity');
    const deadline = performance.now() + 5000;
    while (
      !requests.some((request) => request.path === '/api/v1/auth/refresh') ||
      requests.filter((request) => request.status === 401).length !== 2
    ) {
      if (performance.now() > deadline) throw new Error('Refresh did not start');
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    controller.abort();
    const results = await Promise.all([cancelled, remaining]);
    cancelledSignal = undefined;
    return { statuses: results.map((result) => result.status), requests: [...requests] };
  },
  async startRefreshTimeout(secret: string) {
    requests.length = 0;
    timeoutResult = undefined;
    await expireSignedAccessToken(secret);
    const previousSession = JSON.stringify(getSession());
    holdRefresh = true;
    void apiClient.GET('/api/v1/creator/identity').then((result) => {
      timeoutResult = {
        status: result.status,
        sessionUnchanged: JSON.stringify(getSession()) === previousSession,
      };
    });
    return true;
  },
  async finishRefreshTimeout() {
    if (!timeoutResult || !releaseRefresh) return null;
    holdRefresh = false;
    releaseRefresh();
    releaseRefresh = undefined;
    const sessionBeforeRelease = JSON.stringify(getSession());
    await new Promise((resolve) => setTimeout(resolve, 0));
    return {
      ...timeoutResult,
      lateSessionUnchanged: JSON.stringify(getSession()) === sessionBeforeRelease,
      requests: [...requests],
    };
  },
  async rejectedRefresh() {
    requests.length = 0;
    const session = getSession();
    if (!session) throw new Error('Missing test session');
    setSession({ ...session, refreshToken: 'invalid-acceptance-refresh-token' });
    const result = await refreshSession();
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
    const before = exports.length;
    await this.cancelledRequest();
    const started = performance.now();
    document.dispatchEvent(new Event('pagehide'));
    while (exports.length === before && performance.now() - started < 700) {
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    return { elapsedMs: performance.now() - started, batches: exports.slice(before) };
  },
  exports() {
    return [...exports];
  },
  sensitiveValues() {
    const session = getSession();
    return [email, password, session?.accessToken, session?.refreshToken].filter(Boolean);
  },
};

Object.assign(window, { traceHarness: harness });
