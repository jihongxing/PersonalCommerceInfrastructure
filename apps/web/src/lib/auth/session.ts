export interface AuthSession {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly expiresAt: number | null;
  readonly userEmail: string | null;
}

export interface AuthSessionProvider {
  getSession(): AuthSession | null;
  getAccessToken(): Promise<string | undefined>;
  signIn(email: string, password: string): Promise<AuthSession>;
  signUp(email: string, password: string): Promise<AuthSession | null>;
  signOut(): Promise<void>;
  subscribe(listener: (session: AuthSession | null) => void): () => void;
}

interface SupabaseAuthResponse {
  readonly access_token?: string;
  readonly refresh_token?: string;
  readonly expires_in?: number;
  readonly user?: { readonly email?: string | null } | null;
  readonly error?: string;
  readonly error_description?: string;
  readonly msg?: string;
}

const storageKey = 'personal-commerce.auth-session';
const sessionEvent = 'personal-commerce.auth-session-changed';
const requestTimeoutMs = 15_000;

function readStoredSession(storage: Storage): AuthSession | null {
  const raw = storage.getItem(storageKey);

  if (raw === null) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<AuthSession>;
    if (
      typeof parsed.accessToken !== 'string' ||
      typeof parsed.refreshToken !== 'string' ||
      (parsed.expiresAt !== null && typeof parsed.expiresAt !== 'number')
    ) {
      storage.removeItem(storageKey);
      return null;
    }

    return {
      accessToken: parsed.accessToken,
      refreshToken: parsed.refreshToken,
      expiresAt: parsed.expiresAt ?? null,
      userEmail: typeof parsed.userEmail === 'string' ? parsed.userEmail : null,
    };
  } catch {
    storage.removeItem(storageKey);
    return null;
  }
}

function authError(response: SupabaseAuthResponse): Error {
  void response;
  return new Error('Authentication failed.');
}

export function createSupabaseSessionProvider(
  configuration: {
    readonly supabaseUrl: string;
    readonly supabaseAnonKey: string;
    readonly authBaseUrl?: string;
  },
  storage: Storage,
  fetcher: typeof fetch = fetch,
): AuthSessionProvider {
  let session = readStoredSession(storage);
  const listeners = new Set<(nextSession: AuthSession | null) => void>();

  function publish(nextSession: AuthSession | null): void {
    session = nextSession;
    if (nextSession === null) {
      storage.removeItem(storageKey);
    } else {
      storage.setItem(storageKey, JSON.stringify(nextSession));
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event(sessionEvent));
    }
    listeners.forEach((listener) => listener(session));
  }

  async function request(path: string, init: RequestInit): Promise<SupabaseAuthResponse> {
    const abortController = new AbortController();
    const timeout = setTimeout(() => abortController.abort(), requestTimeoutMs);

    try {
      const response = await fetcher(
        `${configuration.authBaseUrl ?? `${configuration.supabaseUrl.replace(/\/$/u, '')}/auth/v1`}${path}`,
        {
          ...init,
          headers: {
            apikey: configuration.supabaseAnonKey,
            'content-type': 'application/json',
            ...(init.headers ?? {}),
          },
          signal: abortController.signal,
        },
      );
      const body = (await response.json()) as SupabaseAuthResponse;
      if (!response.ok) {
        throw authError(body);
      }
      return body;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new Error('Authentication request timed out.');
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  function sessionFromResponse(response: SupabaseAuthResponse): AuthSession {
    if (response.access_token === undefined || response.refresh_token === undefined) {
      throw new Error('Authentication did not return a usable session.');
    }

    return {
      accessToken: response.access_token,
      refreshToken: response.refresh_token,
      expiresAt: response.expires_in === undefined ? null : Date.now() + response.expires_in * 1000,
      userEmail: response.user?.email ?? null,
    };
  }

  async function refresh(): Promise<AuthSession | null> {
    if (session === null) {
      return null;
    }

    try {
      const response = await request('/token?grant_type=refresh_token', {
        method: 'POST',
        body: JSON.stringify({ refresh_token: session.refreshToken }),
      });
      const nextSession = sessionFromResponse(response);
      publish(nextSession);
      return nextSession;
    } catch {
      publish(null);
      return null;
    }
  }

  return {
    getSession: () => session,
    getAccessToken: async () => {
      if (session === null) {
        return undefined;
      }
      if (session.expiresAt !== null && session.expiresAt - Date.now() < 30_000) {
        return (await refresh())?.accessToken;
      }
      return session.accessToken;
    },
    signIn: async (email, password) => {
      const response = await request('/token?grant_type=password', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      const nextSession = sessionFromResponse(response);
      publish(nextSession);
      return nextSession;
    },
    signUp: async (email, password) => {
      const response = await request('/signup', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (response.access_token === undefined || response.refresh_token === undefined) {
        return null;
      }
      const nextSession = sessionFromResponse(response);
      publish(nextSession);
      return nextSession;
    },
    signOut: async () => {
      if (session !== null) {
        await request('/logout', {
          method: 'POST',
          headers: { authorization: `Bearer ${session.accessToken}` },
        }).catch(() => undefined);
      }
      publish(null);
    },
    subscribe: (listener) => {
      listeners.add(listener);
      const handleStorage = (event: StorageEvent) => {
        if (event.key === storageKey) {
          session = readStoredSession(storage);
          listener(session);
        }
      };
      if (typeof window !== 'undefined') {
        window.addEventListener('storage', handleStorage);
      }
      return () => {
        listeners.delete(listener);
        if (typeof window !== 'undefined') {
          window.removeEventListener('storage', handleStorage);
        }
      };
    },
  };
}
