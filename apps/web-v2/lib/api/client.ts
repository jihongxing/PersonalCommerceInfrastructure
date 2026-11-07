'use client';

import { getBearerToken, setSession, getSession, clearSession } from '@/lib/auth/session';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

class SimpleApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request(
    method: string,
    path: string,
    options: any = {}
  ): Promise<any> {
    const url = `${this.baseUrl}${path}`;
    const token = getBearerToken();

    const headers = new Headers(options.headers || {});
    headers.set('Content-Type', 'application/json');

    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    let body: string | undefined;
    if (options.body) {
      body = JSON.stringify(options.body);
    }

    try {
      const response = await fetch(url, {
        method,
        headers,
        body,
      });

      const data = await response.json();

      if (response.status === 401) {
        const session = getSession();
        if (session?.refreshToken) {
          try {
            const refreshResponse = await fetch(
              `${this.baseUrl}/api/v1/auth/refresh`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken: session.refreshToken }),
              }
            );

            if (refreshResponse.ok) {
              const refreshData = await refreshResponse.json();
              setSession({
                accessToken: refreshData.accessToken,
                refreshToken: session.refreshToken,
              });

              return this.request(method, path, options);
            }
          } catch (error) {
            console.error('Token refresh failed:', error);
          }
        }

        clearSession();
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login';
        }
      }

      return {
        data: response.ok ? data : null,
        error: response.ok ? null : data,
        status: response.status,
      };
    } catch (error) {
      console.error('API request failed:', error);
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
    public status?: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
