'use client';

import { getBearerToken, setSession, getSession, clearSession } from '@/lib/auth/session';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

/**
 * HTTP 拦截器配置
 */
export interface RequestInterceptorConfig {
  onRequest?: (config: RequestInit) => RequestInit | Promise<RequestInit>;
  onResponse?: (response: Response) => Response | Promise<Response>;
  onError?: (error: Error) => Error | Promise<Error>;
}

/**
 * 创建具有拦截器功能的 fetch
 */
export function createInterceptedFetch(config: RequestInterceptorConfig = {}) {
  const originalFetch = globalThis.fetch;

  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === 'string' ? input : input.toString();
    let requestInit = init || {};

    // 请求拦截器
    try {
      if (config.onRequest) {
        requestInit = await config.onRequest(requestInit);
      }
    } catch (error) {
      console.error('Request interceptor error:', error);
    }

    try {
      let response = await originalFetch(url, requestInit);

      // 401 自动刷新 token
      if (response.status === 401) {
        const session = getSession();
        if (session?.refreshToken) {
          try {
            const refreshUrl = new URL('/api/v1/auth/refresh', API_BASE_URL).toString();
            const refreshResponse = await originalFetch(refreshUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refreshToken: session.refreshToken }),
            });

            if (refreshResponse.ok) {
              const refreshData = await refreshResponse.json();
              // 更新会话
              setSession({
                accessToken: refreshData.accessToken,
                refreshToken: refreshData.refreshToken,
                userEmail: session.userEmail,
                expiresAt: Math.floor(Date.now() / 1000) + refreshData.expiresIn,
              });

              // 使用新 token 重试原始请求
              const newHeaders = new Headers(requestInit.headers || {});
              newHeaders.set('Authorization', `Bearer ${refreshData.accessToken}`);

              response = await originalFetch(url, {
                ...requestInit,
                headers: newHeaders,
              });
            }
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError);
            clearSession();
            if (typeof window !== 'undefined') {
              window.location.href = '/auth/login';
            }
          }
        } else {
          // 无 refresh token，清理并重定向
          clearSession();
          if (typeof window !== 'undefined') {
            window.location.href = '/auth/login';
          }
        }
      }

      // 响应拦截器
      try {
        if (config.onResponse) {
          response = await config.onResponse(response);
        }
      } catch (error) {
        console.error('Response interceptor error:', error);
      }

      return response;
    } catch (error) {
      // 错误拦截器
      if (config.onError) {
        throw await config.onError(error instanceof Error ? error : new Error(String(error)));
      }
      throw error;
    }
  };
}

/**
 * 初始化全局 fetch 拦截器
 * 用于自动添加 Bearer Token
 */
export function initializeFetchInterceptor() {
  const interceptedFetch = createInterceptedFetch({
    onRequest: (config) => {
      const token = getBearerToken();
      const headers = new Headers(config.headers || {});

      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }

      return {
        ...config,
        headers,
      };
    },
  });

  // 替换全局 fetch（仅在客户端）
  if (typeof window !== 'undefined') {
    (globalThis as any).fetch = interceptedFetch;
  }
}
