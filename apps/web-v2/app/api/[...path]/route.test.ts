// @vitest-environment node
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from './route';

const store = vi.hoisted(() => ({
  getForLogout: vi.fn(),
  get: vi.fn(),
  revoke: vi.fn(),
  updateTokens: vi.fn(),
  withSessionLock: vi.fn(),
}));
vi.mock('@/lib/server/creator-session-store', () => ({ creatorWebSessionStore: store }));
const session = {
  id: 'opaque',
  accountId: 'creator-account',
  email: 'synthetic@example.test',
  accessToken: 'server-access',
  refreshToken: 'server-refresh',
  expiresAt: '2099-01-01',
};
const upstream = (status: number, body: object) => new Response(JSON.stringify(body), { status });
const request = (path = 'logout', cookie = true) =>
  POST(
    new NextRequest(`http://localhost:3445/api/v1/auth/${path}`, {
      method: 'POST',
      headers: {
        origin: 'http://localhost:3445',
        'x-csrf-token': 'csrf',
        ...(cookie
          ? { cookie: 'pci_creator_session=opaque; pci_creator_csrf=csrf' }
          : { cookie: 'pci_creator_csrf=csrf' }),
      },
    }),
    { params: Promise.resolve({ path: ['v1', 'auth', path] }) },
  );

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv('NODE_ENV', 'test');
  vi.stubEnv('CREATOR_BFF_COOKIE_SECURE', '0');
  vi.stubEnv('CREATOR_BFF_ALLOWED_ORIGINS', 'http://localhost:3445');
  vi.stubEnv('CREATOR_BFF_REVOCATION_SECRET', 'test-bff-secret-at-least-thirty-two-bytes');
  store.getForLogout.mockResolvedValue(session);
  store.get.mockResolvedValue(session);
  store.withSessionLock.mockImplementation(async (_id, operation) => operation(store));
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('BFF authoritative logout', () => {
  it.each(['revoked', 'already_revoked'])('completes only after explicit %s', async (state) => {
    const fetchMock = vi.fn().mockResolvedValue(upstream(200, { state }));
    vi.stubGlobal('fetch', fetchMock);
    const response = await request();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, state });
    expect(store.revoke).toHaveBeenCalledWith('opaque');
    expect(response.cookies.get('pci_creator_session')?.value).toBe('');
    const [, options] = fetchMock.mock.calls[0];
    expect(JSON.parse(options.body)).toEqual({ refreshToken: 'server-refresh' });
    expect(options.headers['x-creator-bff-revocation-secret']).toBeDefined();
  });

  it.each([
    [500, {}],
    [401, { error: { code: 'anything_else' } }],
    [401, { error: { code: 'invalid_refresh_token' } }],
    [401, { error: { code: 'expired_refresh_token' } }],
    [200, { ok: true }],
  ])('retains retry credentials on unconfirmed upstream response %s %j', async (status, body) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(upstream(status, body)));
    const response = await request();
    expect(response.status).not.toBe(200);
    expect(JSON.stringify(await response.json())).not.toMatch(
      /server-refresh|server-access|"ok"\s*:/,
    );
    expect(store.revoke).not.toHaveBeenCalled();
    expect(response.headers.has('set-cookie')).toBe(false);
  });

  it('retains credentials and cookie when upstream is unreachable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('network failed')));
    const response = await request();
    expect(response.status).toBe(503);
    expect(store.revoke).not.toHaveBeenCalled();
    expect(response.headers.has('set-cookie')).toBe(false);
  });

  it('does not claim success without a session or server authentication configuration', async () => {
    expect((await request('logout', false)).status).toBe(409);
    vi.stubEnv('CREATOR_BFF_REVOCATION_SECRET', '');
    expect((await request()).status).toBe(503);
    expect(store.revoke).not.toHaveBeenCalled();
  });

  it('does not proxy the server-only revocation route to browsers', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    expect((await request('revoke-session')).status).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('keeps a failed concurrent refresh from destroying the logout retry credential', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(upstream(503, {})));
    const response = await request('refresh');
    expect(response.status).toBe(503);
    expect(store.revoke).not.toHaveBeenCalled();
    expect(response.headers.has('set-cookie')).toBe(false);
  });
});
