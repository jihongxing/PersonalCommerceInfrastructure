import { describe, expect, it, vi } from 'vitest';

import { createSupabaseSessionProvider, type AuthSession } from './session.js';

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();

  public get length(): number {
    return this.values.size;
  }

  public clear(): void {
    this.values.clear();
  }

  public getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  public key(index: number): string | null {
    return [...this.values.keys()][index] ?? null;
  }

  public removeItem(key: string): void {
    this.values.delete(key);
  }

  public setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

function response(body: unknown, ok = true): Response {
  return new Response(JSON.stringify(body), { status: ok ? 200 : 400 });
}

function sessionBody(overrides: Partial<AuthSession> = {}) {
  return {
    access_token: overrides.accessToken ?? 'access-token',
    refresh_token: overrides.refreshToken ?? 'refresh-token',
    expires_in: 3600,
    user: { email: overrides.userEmail ?? 'creator@example.test' },
  };
}

describe('Supabase Web Session adapter', () => {
  it('signs in, persists the session, and exposes only the access token', async () => {
    const storage = new MemoryStorage();
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(response(sessionBody()));
    const provider = createSupabaseSessionProvider(
      { supabaseUrl: 'https://project.supabase.co', supabaseAnonKey: 'anon-key' },
      storage,
      fetcher,
    );

    await expect(provider.signIn('creator@example.test', 'password')).resolves.toMatchObject({
      accessToken: 'access-token',
    });
    await expect(provider.getAccessToken()).resolves.toBe('access-token');
    expect(storage.length).toBe(1);
    expect(fetcher).toHaveBeenCalledWith(
      'https://project.supabase.co/auth/v1/token?grant_type=password',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ email: 'creator@example.test', password: 'password' }),
      }),
    );
  });

  it('restores a persisted session and refreshes it before expiry', async () => {
    const storage = new MemoryStorage();
    storage.setItem(
      'personal-commerce.auth-session',
      JSON.stringify({
        accessToken: 'expired-access-token',
        refreshToken: 'refresh-token',
        expiresAt: Date.now() + 1000,
        userEmail: 'creator@example.test',
      }),
    );
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(response(sessionBody({ accessToken: 'refreshed-access-token' })));
    const provider = createSupabaseSessionProvider(
      { supabaseUrl: 'https://project.supabase.co', supabaseAnonKey: 'anon-key' },
      storage,
      fetcher,
    );

    expect(provider.getSession()).toMatchObject({ accessToken: 'expired-access-token' });
    await expect(provider.getAccessToken()).resolves.toBe('refreshed-access-token');
    expect(fetcher).toHaveBeenCalledWith(
      'https://project.supabase.co/auth/v1/token?grant_type=refresh_token',
      expect.objectContaining({
        body: JSON.stringify({ refresh_token: 'refresh-token' }),
      }),
    );
  });

  it('clears an expired session when refresh fails and signs out cleanly', async () => {
    const storage = new MemoryStorage();
    storage.setItem(
      'personal-commerce.auth-session',
      JSON.stringify({
        accessToken: 'expired-access-token',
        refreshToken: 'refresh-token',
        expiresAt: Date.now() + 1000,
        userEmail: 'creator@example.test',
      }),
    );
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(response({ error: 'invalid_grant' }, false));
    const provider = createSupabaseSessionProvider(
      { supabaseUrl: 'https://project.supabase.co', supabaseAnonKey: 'anon-key' },
      storage,
      fetcher,
    );

    await expect(provider.getAccessToken()).resolves.toBeUndefined();
    expect(provider.getSession()).toBeNull();
    expect(storage.getItem('personal-commerce.auth-session')).toBeNull();
  });

  it('returns no session when sign up requires email confirmation', async () => {
    const storage = new MemoryStorage();
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(response({ user: { email: 'creator@example.test' } }));
    const provider = createSupabaseSessionProvider(
      { supabaseUrl: 'https://project.supabase.co', supabaseAnonKey: 'anon-key' },
      storage,
      fetcher,
    );

    await expect(provider.signUp('creator@example.test', 'password')).resolves.toBeNull();
    expect(provider.getSession()).toBeNull();
  });
});
