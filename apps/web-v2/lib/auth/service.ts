'use client';

import { apiClient } from '@/lib/api/client';
import { setSession, clearSession, getSession } from '@/lib/auth/session';

/**
 * 认证 API 请求的数据类型
 */

export interface SignupRequest {
  email: string;
  password: string;
  name: string;
}

export interface SignupResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name?: string;
    createdAt?: string;
  };
  expiresIn: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name?: string;
    createdAt?: string;
  };
  expiresIn: number;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * 认证服务类
 * 处理所有认证相关的 API 调用
 */
export class AuthService {
  /**
   * 用户注册
   */
  async signup(credentials: SignupRequest): Promise<SignupResponse> {
    try {
      const { data, error } = await apiClient.POST('/api/v1/auth/signup', {
        body: credentials,
      });

      if (error) {
        throw new Error(error.error?.message || error.message || '注册失败');
      }

      if (!data) {
        throw new Error('No response data from signup');
      }

      const response = data as SignupResponse;

      // 保存会话
      this.saveSession(response);

      return response;
    } catch (err) {
      console.error('Signup error');
      throw err;
    }
  }

  /**
   * 用户登陆
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const { data, error } = await apiClient.POST('/api/v1/auth/login', {
        body: credentials,
      });

      if (error) {
        throw new Error(error.error?.message || error.message || '登陆失败');
      }

      if (!data) {
        throw new Error('No response data from login');
      }

      const response = data as LoginResponse;

      // 保存会话
      this.saveSession(response);

      return response;
    } catch (err) {
      console.error('Login error');
      throw err;
    }
  }

  /**
   * 刷新 Token
   */
  async refresh(refreshToken: string): Promise<RefreshResponse> {
    try {
      const { data, error } = await apiClient.POST('/api/v1/auth/refresh', {
        body: { refreshToken },
      });

      if (error) {
        throw new Error(error.message || 'Token 刷新失败');
      }

      if (!data) {
        throw new Error('No response data from refresh');
      }

      return data as RefreshResponse;
    } catch (err) {
      console.error('Refresh error');
      throw err;
    }
  }

  /**
   * 用户登出
   */
  async logout(): Promise<void> {
    try {
      const { error, status } = await apiClient.POST('/api/v1/auth/logout');
      if (error && (status !== 401 || getSession())) throw new Error(error.error?.message || error.message || '登出失败');
      clearSession();
    } catch (err) {
      console.error('Logout error');
      throw err;
    }
  }

  /**
   * 忘记密码 - 请求重置邮件
   */
  async forgotPassword(request: ForgotPasswordRequest): Promise<void> {
    void request;
    throw new Error('密码找回暂不可用。');
  }

  /**
   * 重置密码
   */
  async resetPassword(request: ResetPasswordRequest): Promise<void> {
    void request;
    throw new Error('密码重置暂不可用。');
  }

  /**
   * 保存会话到 localStorage
   */
  private saveSession(response: SignupResponse | LoginResponse): void {
    setSession({
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      userEmail: response.user.email,
      expiresAt: Math.floor(Date.now() / 1000) + response.expiresIn,
    });
  }
}

/**
 * 创建单例实例
 */
export const authService = new AuthService();
