/**
 * Browser-side authentication state.
 *
 * Creator credentials are owned by the same-origin BFF and live only in its
 * server-side session store. This module intentionally never reads or writes
 * localStorage/sessionStorage and never exposes a bearer token to callers.
 */

export interface AuthSession {
  userEmail: string;
}

let currentSession: AuthSession | null = null;

export function getSession(): AuthSession | null {
  return currentSession;
}

// Accept legacy-shaped callers during the migration, but discard credentials.
export function setSession(session: { userEmail?: unknown; user?: { email?: unknown } }): void {
  const email =
    typeof session.userEmail === 'string'
      ? session.userEmail
      : typeof session.user?.email === 'string'
        ? session.user.email
        : undefined;
  currentSession = email ? { userEmail: email } : null;
}

export function clearSession(): void {
  currentSession = null;
}

export function isAuthenticated(): boolean {
  return currentSession !== null;
}

/**
 * Retained as a compatibility shim for retired callers. BFF requests use the
 * HttpOnly cookie and must never add an Authorization header in the browser.
 */
export function getBearerToken(): null {
  return null;
}