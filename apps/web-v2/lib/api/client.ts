'use client';

import { getBearerToken, setSession, getSession, clearSession } from '@/lib/auth/session';
import type { Span, SpanContext } from '@opentelemetry/api';
import {
  finishRefreshWaitSpan,
  finishRequestSpan,
  injectRequestTrace,
  startRefreshWaitSpan,
  startRequestSpan,
} from './tracing';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
const REFRESH_TIMEOUT_MS = 15_000;

let refreshInFlight: Promise<boolean> | undefined;
let refreshSpan: Span | undefined;

export function refreshSession(waiter?: SpanContext): Promise<boolean> {
  if (refreshInFlight) {
    if (waiter) refreshSpan?.addLink({ context: waiter });
    return refreshInFlight;
  }
  let session: ReturnType<typeof getSession>;
  try {
    session = getSession();
  } catch (error) {
    return Promise.reject(error);
  }
  if (!session?.refreshToken) return Promise.resolve(false);
  refreshSpan = startRequestSpan('POST', '/api/v1/auth/refresh', waiter ? [waiter] : []);
  const span = refreshSpan;
  let status = 0;
  let failed = false;
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => {
      reject(new Error('刷新登录状态超时，请重试'));
      controller.abort();
    }, REFRESH_TIMEOUT_MS);
  });
  const operation = (async () => {
    const url = `${API_BASE_URL}/api/v1/auth/refresh`;
    const headers = new Headers({ 'Content-Type': 'application/json' });
    injectRequestTrace(span, headers, url);
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ refreshToken: session.refreshToken }),
      signal: controller.signal,
    });
    if (controller.signal.aborted) throw new Error('刷新登录状态超时，请重试');
    status = response.status;
    if (response.status === 401) return false;
    if (!response.ok) throw new Error('无法刷新登录状态，请稍后重试');
    const data = await response.json();
    if (controller.signal.aborted) throw new Error('刷新登录状态超时，请重试');
    const current = getSession();
    if (!current || current.accessToken !== session.accessToken || current.refreshToken !== session.refreshToken) return false;
    setSession({ ...session, accessToken: data.accessToken, refreshToken: data.refreshToken, expiresAt: Math.floor(Date.now() / 1000) + data.expiresIn });
    return true;
  })();
  refreshInFlight = Promise.race([operation, timeout])
    .catch((error: unknown) => {
      failed = true;
      throw error;
    })
    .finally(() => {
      clearTimeout(timer);
      finishRequestSpan(span, status, failed);
      refreshInFlight = undefined;
      refreshSpan = undefined;
    });
  return refreshInFlight;
}

function waitForRefresh(refresh: Promise<boolean>, signal?: AbortSignal): Promise<boolean> {
  if (!signal) return refresh;
  return new Promise((resolve, reject) => {
    const abort = () => {
      signal.removeEventListener('abort', abort);
      reject(new DOMException('请求已取消', 'AbortError'));
    };
    signal.addEventListener('abort', abort, { once: true });
    if (signal.aborted) abort();
    refresh.then(
      (value) => {
        signal.removeEventListener('abort', abort);
        resolve(value);
      },
      (error: unknown) => {
        signal.removeEventListener('abort', abort);
        reject(error);
      },
    );
  });
}

class SimpleApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request(method: string, path: string, options: any = {}, retried = false, links: SpanContext[] = []): Promise<any> {
    const resolvedPath = path.replace(/\{([^}]+)\}/g, (_match, key: string) => encodeURIComponent(String(options.params?.path?.[key] ?? '')));
    const url = `${this.baseUrl}${resolvedPath}`;
    const token = getBearerToken();

    const headers = new Headers(options.headers || {});
    if (options.body !== undefined) headers.set('Content-Type', 'application/json');

    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    let body: string | undefined;
    if (options.body) {
      body = JSON.stringify(options.body);
    }

    const span = startRequestSpan(method, path, links);
    injectRequestTrace(span, headers, url);
    let status = 0;
    try {
      const response = await fetch(url, {
        method,
        headers,
        body,
        signal: options.signal,
      });
      status = response.status;
      finishRequestSpan(span, status);

      const data = await response.json();

      if (response.status === 401 && data?.error?.code !== 'creator_actor_not_mapped' && (!path.startsWith('/api/v1/auth/') || path === '/api/v1/auth/workspace/initialize' || path === '/api/v1/auth/logout') && !retried) {
        if (options.signal?.aborted) throw new DOMException('请求已取消', 'AbortError');
        if (token && getBearerToken() && getBearerToken() !== token) {
          return this.request(method, path, options, true, [span?.spanContext()].filter((value): value is SpanContext => value !== undefined));
        }
        const refresh = refreshSession(span?.spanContext());
        const refreshContext = refreshSpan?.spanContext();
        const waitSpan = refreshContext && span
          ? startRefreshWaitSpan([span.spanContext(), refreshContext])
          : undefined;
        let refreshed: boolean;
        try {
          refreshed = await waitForRefresh(refresh, options.signal);
          finishRefreshWaitSpan(waitSpan, refreshed ? 'success' : 'rejected');
        } catch (error) {
          finishRefreshWaitSpan(waitSpan, 'error');
          throw error;
        }
        if (refreshed) {
          return this.request(method, path, options, true, [span?.spanContext(), refreshContext].filter((value): value is SpanContext => value !== undefined));
        }

        if (getBearerToken() === token) {
          clearSession();
          if (path !== '/api/v1/auth/logout' && typeof window !== 'undefined') {
            window.location.href = '/auth/login';
          }
        }
      }

      return {
        data: response.ok ? data : null,
        error: response.ok ? null : data,
        status: response.status,
      };
    } catch (error) {
      if (status === 0) finishRequestSpan(span, status);
      console.error('API request failed');
      return {
        data: null,
        error: { message: (error as Error).message },
        status: 0,
      };
    }
  }

  async GET(path: string, options?: any) {
    return this.request('GET', path, options);
  }

  async POST(path: string, options?: any) {
    return this.request('POST', path, options);
  }

  async PUT(path: string, options?: any) {
    return this.request('PUT', path, options);
  }

  async PATCH(path: string, options?: any) {
    return this.request('PATCH', path, options);
  }

  async DELETE(path: string, options?: any) {
    return this.request('DELETE', path, options);
  }
}

export const apiClient = new SimpleApiClient(API_BASE_URL);

export type ApiClient = typeof apiClient;

export class ApiError extends Error {
  constructor(
    message: string,
    public code?: string,
    public status?: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
