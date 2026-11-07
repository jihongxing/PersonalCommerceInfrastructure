import createClient from 'openapi-fetch';
import { getBearerToken, setSession, getSession, clearSession } from '@/lib/auth/session';

// TODO: Import types from contracts package
// import type { paths } from '@personal-commerce-infrastructure/contracts';

// 临时使用空的 paths 类型，等待 contracts 包完善
type paths = Record<string, any>;

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

/**
 * 创建带拦截器的 API 客户端
 */
function createApiClient() {
  const client = createClient<paths>({ 
    baseUrl: API_BASE_URL,
  });

  // 保存原始的 request 方法
  const originalRequest = (client as any).request?.bind(client) || (() => ({}));

  /**
   * 请求拦截器 - 自动添加 Bearer Token
   */
  async function requestWithAuth(init: any) {
    const token = getBearerToken();

    // 添加 Bearer Token 到请求头
    const headers = new Headers(init.headers || {});
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    return {
      ...init,
      headers,
    };
  }

  /**
   * 响应拦截器 - 处理 401 和自动刷新
   */
  async function handleResponse(response: Response, init: any): Promise<any | null> {
    // 401 Unauthorized
    if (response.status === 401) {
      // 尝试使用 refresh token 刷新
      const session = getSession();
      if (session?.refreshToken) {
        try {
          const refreshResponse = await fetch(
            `${API_BASE_URL}/api/v1/auth/refresh`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refreshToken: session.refreshToken }),
            }
          );

          if (refreshResponse.ok) {
            const refreshData = await refreshResponse.json();
            // 更新会话
            setSession({
              accessToken: refreshData.accessToken,
              userEmail: session.userEmail,
              expiresAt: Math.floor(Date.now() / 1000) + 15 * 60,
            });

            // 重试原始请求
            const newHeaders = new Headers(init.headers || {});
            newHeaders.set('Authorization', `Bearer ${refreshData.accessToken}`);

            const retryResponse = await fetch(response.url, {
              ...init,
              headers: newHeaders,
            });

            if (retryResponse.ok) {
              return await retryResponse.json();
            }
          }
        } catch (error) {
          console.error('Token refresh failed:', error);
        }
      }

      // 刷新失败，清理会话并重定向到登陆
      clearSession();
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
      }
    }

    return null;
  }

  // 使用 openapi-fetch 的中间件系统来实现拦截器
  // 这里我们返回原始客户端，但已配置 headers 获取器
  return {
    ...client,
    // 扩展：当需要发送请求时自动添加 token
    async makeRequest(init: any) {
      return requestWithAuth(init);
    },
  };
}

export const apiClient = createApiClient() as any;

export type ApiClient = typeof apiClient;

/**
 * API 错误类
 */
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
