'use client';

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { getSession, clearSession } from '@/lib/auth/session';
import { refreshSession } from '@/lib/api/client';
import { queryClient } from '@/lib/api/query-client';
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
  restoreError: boolean;
  retryRestore: () => void;

  // 认证操作
  signup: (email: string, password: string, name: string) => Promise<void>;
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
  const [restoreError, setRestoreError] = useState(false);
  const restoreVersion = useRef(0);

  /**
   * 初始化：从 localStorage 恢复会话
   */
  const restore = useCallback(async () => {
    const version = ++restoreVersion.current;
    setIsLoading(true);
    setRestoreError(false);
    try {
      const session = getSession();
      if (session) {
        if (session.expiresAt <= Math.floor(Date.now() / 1000) && session.refreshToken) {
          if (!(await refreshSession())) {
            if (version !== restoreVersion.current) return;
            if (getSession()?.refreshToken === session.refreshToken) clearSession();
          }
        }
        if (version !== restoreVersion.current) return;
        const currentSession = getSession();
        setUser(currentSession ? { email: currentSession.userEmail } : null);
      } else {
        setUser(null);
      }
    } catch {
      if (version !== restoreVersion.current) return;
      setUser(null);
      setRestoreError(true);
    } finally {
      if (version === restoreVersion.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const version = restoreVersion;
    queueMicrotask(() => {
      if (!cancelled) void restore();
    });
    return () => {
      cancelled = true;
      version.current++;
    };
  }, [restore]);

  /**
   * 注册
   */
  const signup = async (email: string, password: string, name: string) => {
    setError(null);
    try {
      const response = await authService.signup({ email, password, name });
      restoreVersion.current++;
      setRestoreError(false);
      setIsLoading(false);
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
      restoreVersion.current++;
      setRestoreError(false);
      setIsLoading(false);
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
      restoreVersion.current++;
      queryClient.clear();
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
  const resetPassword = async (token: string, newPassword: string, confirmPassword: string) => {
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
    restoreError,
    retryRestore: () => {
      void restore();
    },
    signup,
    login,
    logout,
    forgotPassword,
    resetPassword,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
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
