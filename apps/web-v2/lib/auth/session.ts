/**
 * 简单的客户端认证会话管理
 *
 * 会话由 apps/api 签发和刷新。
 */

const STORAGE_KEY = 'pci.auth.session';

export interface AuthSession {
  accessToken: string;
  refreshToken?: string;
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
    // Session timestamps are stored as Unix seconds to match the API contract.
    if (session.expiresAt && Math.floor(Date.now() / 1000) > session.expiresAt && !session.refreshToken) {
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
