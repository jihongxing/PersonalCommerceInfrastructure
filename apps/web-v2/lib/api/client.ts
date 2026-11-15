'use client';

import type { SpanContext } from '@opentelemetry/api';
import { finishRequestSpan, injectRequestTrace, startRequestSpan } from './tracing';
import { clearSession } from '@/lib/auth/session';

// Browser requests stay on the same origin and cross the Creator BFF route.
const API_BASE_URL = '';

type ApiRequestOptions = {
  headers?: HeadersInit;
  body?: unknown;
  signal?: AbortSignal;
  params?: { path?: Record<string, unknown>; [key: string]: unknown };
};
type ApiResponse<T> = {
  data: T | null;
  error: { error?: { message?: string; code?: string }; message?: string } | null;
  status: number;
};

function csrfToken(): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const item = document.cookie.split('; ').find((value) => value.startsWith('pci_creator_csrf='));
  return item ? decodeURIComponent(item.slice('pci_creator_csrf='.length)) : undefined;
}

function isMutation(method: string): boolean {
  return method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS';
}

class SimpleApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/u, '');
  }

  private async request<T = unknown>(
    method: string,
    path: string,
    options: ApiRequestOptions = {},
    links: SpanContext[] = [],
  ): Promise<ApiResponse<T>> {
    const resolvedPath = path.replace(/\{([^}]+)\}/g, (_match, key: string) =>
      encodeURIComponent(String(options.params?.path?.[key] ?? '')),
    );
    const url = `${this.baseUrl}${resolvedPath}`;
    const headers = new Headers(options.headers || {});
    if (options.body !== undefined) headers.set('Content-Type', 'application/json');
    if (isMutation(method)) {
      const token = csrfToken();
      if (token) headers.set('X-CSRF-Token', token);
    }

    const span = startRequestSpan(method, path, links);
    injectRequestTrace(span, headers, url);
    let status = 0;
    try {
      const response = await fetch(url, {
        method,
        headers,
        credentials: 'same-origin',
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
        signal: options.signal,
      });
      status = response.status;
      let data: unknown = null;
      if (response.status !== 204) {
        try {
          data = await response.json();
        } catch {
          data = null;
        }
      }
      finishRequestSpan(span, status);
      if (response.status === 401 && !path.startsWith('/api/v1/auth/')) {
        clearSession();
        if (typeof window !== 'undefined')
          window.dispatchEvent(new CustomEvent('creator-auth-expired'));
      }
      return {
        data: response.ok ? (data as T) : null,
        error: response.ok
          ? null
          : ((data as ApiResponse<T>['error']) ?? { message: response.statusText }),
        status,
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

  GET<T = unknown>(path: string, options?: ApiRequestOptions) {
    return this.request<T>('GET', path, options);
  }

  POST<T = unknown>(path: string, options?: ApiRequestOptions) {
    return this.request<T>('POST', path, options);
  }

  PUT<T = unknown>(path: string, options?: ApiRequestOptions) {
    return this.request<T>('PUT', path, options);
  }

  PATCH<T = unknown>(path: string, options?: ApiRequestOptions) {
    return this.request<T>('PATCH', path, options);
  }

  DELETE<T = unknown>(path: string, options?: ApiRequestOptions) {
    return this.request<T>('DELETE', path, options);
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
