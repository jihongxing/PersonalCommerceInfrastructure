/**
 * 简单的客户端认证会话管理
 * 
 * 注意：这是一个简化版本，用于 Phase 4 演示。
 * 生产环境应该使用更安全的认证方案（Supabase/Auth0/NextAuth.js）
 */

const STORAGE_KEY = 'pci.auth.session';

export interface AuthSession {
  accessToken: string;
  userEmail: string;
  expiresAt: number;
}

/**
 * 从 localStorage 获取会话
 */
export function getSession(): AuthSession | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const session = JSON.parse(raw) as AuthSession;
    
    // 检查是否过期
    if (session.expiresAt && Date.now() > session.expiresAt) {
      clearSession();
      return null;
    }

    return session;
  } catch {
    clearSession();
    return null;
  }
}

/**
 * 保存会话到 localStorage
 */
export function setSession(session: AuthSession): void {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

/**
 * 清除会话
 */
export function clearSession(): void {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.removeItem(STORAGE_KEY);
}

/**
 * 检查是否已登录
 */
export function isAuthenticated(): boolean {
  return getSession() !== null;
}

/**
 * 获取 Bearer Token（用于 API 请求）
 */
export function getBearerToken(): string | null {
  const session = getSession();
  return session ? session.accessToken : null;
}
