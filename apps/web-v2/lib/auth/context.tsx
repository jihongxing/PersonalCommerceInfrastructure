'use client';

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { clearSession } from '@/lib/auth/session';
import { apiClient } from '@/lib/api/client';
import { queryClient } from '@/lib/api/query-client';
import { authService } from './service';

export interface AuthUser { email: string; }
export interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  restoreError: boolean;
  retryRestore: () => void;
  signup: (email: string, password: string, name: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string, confirmPassword: string) => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [restoreError, setRestoreError] = useState(false);
  const restoreVersion = useRef(0);

  const restore = useCallback(async () => {
    const version = ++restoreVersion.current;
    setIsLoading(true);
    setRestoreError(false);
    try {
      const { data, error } = await apiClient.GET<{ authenticated: boolean; user: AuthUser | null }>(
        '/api/v1/auth/session',
      );
      if (version !== restoreVersion.current) return;
      if (error) throw new Error(error.error?.message || error.message || '无法验证登录状态');
      setUser(data?.authenticated && data.user ? { email: data.user.email } : null);
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
    queueMicrotask(() => { if (!cancelled) void restore(); });
    const onExpired = () => { clearSession(); setUser(null); };
    window.addEventListener('creator-auth-expired', onExpired);
    return () => {
      cancelled = true;
      version.current++;
      window.removeEventListener('creator-auth-expired', onExpired);
    };
  }, [restore]);

  const signup = async (email: string, password: string, name: string) => {
    setError(null);
    try { const response = await authService.signup({ email, password, name }); setUser({ email: response.user.email }); }
    catch (err) { const message = err instanceof Error ? err.message : '注册失败'; setError(message); throw err; }
  };

  const login = async (email: string, password: string) => {
    setError(null);
    try { const response = await authService.login({ email, password }); setUser({ email: response.user.email }); }
    catch (err) { const message = err instanceof Error ? err.message : '登陆失败'; setError(message); throw err; }
  };

  const logout = async () => {
    setError(null);
    try { await authService.logout(); restoreVersion.current++; queryClient.clear(); setUser(null); }
    catch (err) { const message = err instanceof Error ? err.message : '登出失败'; setError(message); throw err; }
  };

  const forgotPassword = async (email: string) => {
    setError(null);
    try { await authService.forgotPassword({ email }); }
    catch (err) { const message = err instanceof Error ? err.message : '请求失败'; setError(message); throw err; }
  };

  const resetPassword = async (token: string, newPassword: string, confirmPassword: string) => {
    setError(null);
    try { await authService.resetPassword({ token, newPassword, confirmPassword }); setUser(null); }
    catch (err) { const message = err instanceof Error ? err.message : '重置失败'; setError(message); throw err; }
  };

  const value: AuthContextType = {
    user, isLoading, isAuthenticated: user !== null, error, restoreError,
    retryRestore: () => { void restore(); }, signup, login, logout, forgotPassword, resetPassword,
    clearError: () => setError(null),
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
