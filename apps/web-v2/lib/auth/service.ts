'use client';

import { apiClient } from '@/lib/api/client';
import { clearSession } from '@/lib/auth/session';

export interface SignupRequest {
  email: string;
  password: string;
  name: string;
}
export interface AuthResponse {
  user: { id: string; email: string; name?: string; createdAt?: string };
  expiresIn?: number;
}
export type SignupResponse = AuthResponse;
export type LoginRequest = Omit<SignupRequest, 'name'>;
export type LoginResponse = AuthResponse;
export type RefreshResponse = { authenticated: boolean; user?: AuthResponse['user'] };
export interface ForgotPasswordRequest {
  email: string;
}
export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

function messageFor(
  error: { error?: { message?: string }; message?: string } | null,
  fallback: string,
) {
  return error?.error?.message || error?.message || fallback;
}

export class AuthService {
  async signup(credentials: SignupRequest): Promise<SignupResponse> {
    try {
      const { data, error } = await apiClient.POST<AuthResponse>('/api/v1/auth/signup', {
        body: credentials,
      });
      if (error) throw new Error(messageFor(error, '注册失败'));
      if (!data?.user) throw new Error('No response data from signup');
      return data;
    } catch (err) {
      console.error('Signup error');
      throw err;
    }
  }

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const { data, error } = await apiClient.POST<AuthResponse>('/api/v1/auth/login', {
        body: credentials,
      });
      if (error) throw new Error(messageFor(error, '登陆失败'));
      if (!data?.user) throw new Error('No response data from login');
      return data;
    } catch (err) {
      console.error('Login error');
      throw err;
    }
  }

  async refresh(): Promise<RefreshResponse> {
    try {
      const { data, error } = await apiClient.POST<RefreshResponse>('/api/v1/auth/refresh');
      if (error) throw new Error(messageFor(error, '刷新登录状态失败'));
      if (!data) throw new Error('No response data from refresh');
      return data;
    } catch (err) {
      console.error('Refresh error');
      throw err;
    }
  }

  async logout(): Promise<void> {
    try {
      const { error, status } = await apiClient.POST('/api/v1/auth/logout');
      if (error && status !== 401) throw new Error(messageFor(error, '登出失败'));
      clearSession();
    } catch (err) {
      console.error('Logout error');
      throw err;
    }
  }

  async forgotPassword(request: ForgotPasswordRequest): Promise<void> {
    const { error } = await apiClient.POST('/api/v1/auth/forgot-password', { body: request });
    if (error) throw new Error(messageFor(error, '密码找回暂不可用，请稍后重试。'));
  }

  async resetPassword(request: ResetPasswordRequest): Promise<void> {
    const { error } = await apiClient.POST('/api/v1/auth/reset-password', {
      body: { token: request.token, newPassword: request.newPassword },
    });
    if (error) throw new Error(messageFor(error, '密码重置失败，请稍后重试。'));
    clearSession();
  }
}

export const authService = new AuthService();
