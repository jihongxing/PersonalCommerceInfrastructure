import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient, refreshSession } from '@/lib/api/client';
import { clearSession, getSession, setSession } from './session';
import { authService } from './service';

const session = {
  accessToken: 'old-access',
  refreshToken: 'old-refresh',
  userEmail: 'user@example.test',
  expiresAt: 1,
};
const response = (status: number, body: object = {}) =>
  ({ status, ok: status < 400, json: async () => body }) as Response;

describe('session logout recovery', () => {
  beforeEach(() => setSession(session));
  afterEach(() => {
    clearSession();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('refreshes an expired access token and revokes the session before clearing it', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(response(401, { error: { code: 'invalid_access_token' } }))
      .mockResolvedValueOnce(
        response(200, { accessToken: 'new-access', refreshToken: 'new-refresh', expiresIn: 60 }),
      )
      .mockResolvedValueOnce(response(200));
    vi.stubGlobal('fetch', fetchMock);

    await expect(authService.logout()).resolves.toBeUndefined();
    expect(fetchMock.mock.calls.map(([url]) => String(url).split('/').pop())).toEqual([
      'logout',
      'refresh',
      'logout',
    ]);
    expect(new Headers(fetchMock.mock.calls[2][1].headers).get('Authorization')).toBe(
      'Bearer new-access',
    );
    expect(getSession()).toBeNull();
  });

  it('clears the local session when refresh is rejected', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(response(401, { error: { code: 'invalid_access_token' } }))
        .mockResolvedValueOnce(response(401, { error: { code: 'invalid_token' } })),
    );
    await expect(authService.logout()).resolves.toBeUndefined();
    expect(getSession()).toBeNull();
  });

  it('preserves the session and reports a network failure', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network failure')));
    await expect(authService.logout()).rejects.toThrow('network failure');
    expect(getSession()).toEqual(session);
  });

  it('reports a second logout rejection after a successful refresh', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(response(401, { error: { code: 'invalid_access_token' } }))
        .mockResolvedValueOnce(
          response(200, { accessToken: 'new-access', refreshToken: 'new-refresh', expiresIn: 60 }),
        )
        .mockResolvedValueOnce(response(401, { error: { message: 'logout rejected' } })),
    );
    await expect(authService.logout()).rejects.toThrow('logout rejected');
    expect(getSession()?.accessToken).toBe('new-access');
  });

  it('does not restore a session after logout while refresh is in flight', async () => {
    let finish!: (value: Response) => void;
    const pending = new Promise<Response>((resolve) => {
      finish = resolve;
    });
    vi.stubGlobal(
      'fetch',
      vi.fn().mockReturnValueOnce(pending).mockResolvedValueOnce(response(200)),
    );
    const refresh = refreshSession();
    await authService.logout();
    finish(response(200, { accessToken: 'late', refreshToken: 'late-refresh', expiresIn: 60 }));
    await refresh;
    expect(getSession()).toBeNull();
  });

  it('does not replace a newer login with a late refresh response', async () => {
    let finish!: (value: Response) => void;
    vi.stubGlobal(
      'fetch',
      vi.fn().mockReturnValue(
        new Promise<Response>((resolve) => {
          finish = resolve;
        }),
      ),
    );
    const refresh = refreshSession();
    const newer = { ...session, accessToken: 'new-login', refreshToken: 'new-login-refresh' };
    setSession(newer);
    finish(response(200, { accessToken: 'late', refreshToken: 'late-refresh', expiresIn: 60 }));
    await expect(refresh).resolves.toBe(false);
    expect(getSession()).toEqual(newer);
  });

  it('does not refresh a rejected login request', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(response(401, { error: { code: 'invalid_credentials' } }));
    vi.stubGlobal('fetch', fetchMock);
    expect(
      (await apiClient.POST('/api/v1/auth/login', { body: { email: 'x', password: 'x' } })).status,
    ).toBe(401);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
