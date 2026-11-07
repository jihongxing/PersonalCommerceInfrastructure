import createClient from 'openapi-fetch';
import { getBearerToken } from '@/lib/auth/session';

// TODO: Import types from contracts package
// import type { paths } from '@personal-commerce-infrastructure/contracts';

// 临时使用空的 paths 类型，等待 contracts 包完善
type paths = Record<string, any>;

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

export const apiClient = createClient<paths>({ 
  baseUrl: API_BASE_URL,
});

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
