'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getSession, clearSession, AuthSession } from '@/lib/auth/session';
import { initializeFetchInterceptor } from '@/lib/api/interceptor';
import { authService } from './service';

/**
 * 用户信息类型
 */
export interface AuthUser {
  email: string;
}

/**
 * 认证上下文类型
 */
export interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;

  // 认证操作
  signup: (email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string, confirmPassword: string) => Promise<void>;

  // 状态重置
  clearError: () => void;
}

/**
 * 创建认证上下文
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * 认证提供者组件
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * 初始化：从 localStorage 恢复会话
   */
  useEffect(() => {
    try {
      const session = getSession();
      if (session) {
        setUser({
          email: session.userEmail,
        });
      }
      // 初始化 fetch 拦截器
      initializeFetchInterceptor();
    } catch (err) {
      console.error('Failed to restore session:', err);
      clearSession();
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 注册
   */
  const signup = async (email: string, password: string) => {
    setError(null);
    try {
      const response = await authService.signup({ email, password });
      setUser({
        email: response.user.email,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : '注册失败';
      setError(message);
      throw err;
    }
  };

  /**
   * 登陆
   */
  const login = async (email: string, password: string) => {
    setError(null);
    try {
      const response = await authService.login({ email, password });
      setUser({
        email: response.user.email,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : '登陆失败';
      setError(message);
      throw err;
    }
  };

  /**
   * 登出
   */
  const logout = async () => {
    setError(null);
    try {
      await authService.logout();
      setUser(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : '登出失败';
      setError(message);
      throw err;
    }
  };

  /**
   * 忘记密码
   */
  const forgotPassword = async (email: string) => {
    setError(null);
    try {
      await authService.forgotPassword({ email });
    } catch (err) {
      const message = err instanceof Error ? err.message : '请求失败';
      setError(message);
      throw err;
    }
  };

  /**
   * 重置密码
   */
  const resetPassword = async (
    token: string,
    newPassword: string,
    confirmPassword: string
  ) => {
    setError(null);
    try {
      await authService.resetPassword({ token, newPassword, confirmPassword });
    } catch (err) {
      const message = err instanceof Error ? err.message : '重置失败';
      setError(message);
      throw err;
    }
  };

  /**
   * 清除错误
   */
  const clearError = () => setError(null);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: user !== null,
    error,
    signup,
    login,
    logout,
    forgotPassword,
    resetPassword,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * useAuth Hook - 使用认证上下文
 */
export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
