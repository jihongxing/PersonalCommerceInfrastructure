import { describe, expect, it, vi } from 'vitest';
import { proxyOperationsAuthRequest } from './operations-auth-proxy';

const configuration = {
  apiOrigin: 'http://127.0.0.1:8080',
  webOrigin: 'http://localhost:3002',
  production: false,
};
const credential = 'a'.repeat(43);
const request = (headers: Record<string, string> = { origin: 'http://localhost:3002' }) =>
  new Request('http://localhost:3002/api/operations/auth/logout', { method: 'POST', headers });

describe('Operations BFF boundary', () => {
  it.each(['network', '503', 'unconfirmed'] as const)(
    'preserves cookie on %s logout failure and permits confirmed retry',
    async (failure) => {
      const upstream = vi.fn<typeof fetch>();
      if (failure === 'network') upstream.mockRejectedValueOnce(new Error('connection lost'));
      else
        upstream.mockResolvedValueOnce(
          new Response(null, { status: failure === '503' ? 503 : 200 }),
        );
      upstream.mockResolvedValueOnce(new Response(null, { status: 204 }));
      const failed = await proxyOperationsAuthRequest(
        request(),
        'logout',
        configuration,
        credential,
        upstream,
      );
      expect(failed.status).toBe(503);
      expect(failed.headers.has('set-cookie')).toBe(false);
      const retried = await proxyOperationsAuthRequest(
        request(),
        'logout',
        configuration,
        credential,
        upstream,
      );
      expect(retried.status).toBe(204);
      expect(retried.headers.get('set-cookie')).toContain('Max-Age=0');
    },
  );
  it('clears cookie for confirmed absent/already-revoked Session', async () => {
    const upstream = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 204 }));
    expect(
      (await proxyOperationsAuthRequest(request(), 'logout', configuration, credential, upstream))
        .status,
    ).toBe(204);
    expect(
      (await proxyOperationsAuthRequest(request(), 'logout', configuration, undefined, upstream))
        .status,
    ).toBe(204);
    expect(upstream).toHaveBeenCalledOnce();
  });
  it.each<Record<string, string>>([
    {},
    { origin: 'https://evil.invalid' },
    { origin: 'http://localhost:3002', 'sec-fetch-site': 'cross-site' },
  ])('rejects absent/invalid Origin or cross-site mutation', async (headers) => {
    const upstream = vi.fn<typeof fetch>();
    expect(
      (
        await proxyOperationsAuthRequest(
          request(headers),
          'logout',
          configuration,
          credential,
          upstream,
        )
      ).status,
    ).toBe(403);
    expect(upstream).not.toHaveBeenCalled();
  });
  it('discards forged browser identity and permission headers', async () => {
    const upstream = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json({
        principalId: 'real-p',
        accountId: 'real-a',
        sessionId: 'real-s',
        permissions: ['catalog:read', 'audit:read', 'offering:read', 'request:read'],
      }),
    );
    const result = await proxyOperationsAuthRequest(
      request({ 'x-principal-id': 'forged', 'x-permissions': 'catalog:write' }),
      'session',
      configuration,
      credential,
      upstream,
    );
    expect(result.status).toBe(200);
    const forwarded = new Headers(upstream.mock.calls[0]![1]!.headers);
    expect(forwarded.get('authorization')).toBe(`Bearer ${credential}`);
    expect(forwarded.has('x-principal-id')).toBe(false);
    expect(forwarded.has('x-permissions')).toBe(false);
  });
  it('returns only metadata with a host-only HttpOnly Secure cookie outside localhost', async () => {
    const upstream = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json({
        principalId: 'p',
        accountId: 'a',
        sessionId: 's',
        permissions: ['catalog:read', 'audit:read', 'offering:read', 'request:read'],
        credential,
      }),
    );
    const result = await proxyOperationsAuthRequest(
      new Request('https://admin.example.test/api/operations/auth/login', {
        method: 'POST',
        headers: { origin: 'https://admin.example.test' },
        body: '{}',
      }),
      'login',
      { ...configuration, webOrigin: 'https://admin.example.test' },
      undefined,
      upstream,
    );
    const cookie = result.headers.get('set-cookie')!;
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('Secure');
    expect(cookie).toContain('SameSite=Lax');
    expect(cookie).not.toContain('Domain=');
    expect(await result.text()).not.toContain(credential);
  });
});
