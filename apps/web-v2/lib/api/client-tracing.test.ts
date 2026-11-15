import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from './client';

const ok = () => new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'content-type': 'application/json' } });

describe('Creator BFF client boundary', () => {
  afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });
  it('uses same-origin credentials without a browser Authorization header', async () => {
    const fetchMock = vi.fn().mockResolvedValue(ok()); vi.stubGlobal('fetch', fetchMock);
    await apiClient.GET('/api/v1/creator/identity');
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.credentials).toBe('same-origin'); expect(new Headers(init.headers).get('authorization')).toBeNull();
  });
  it('sends the readable CSRF cookie on mutations', async () => {
    document.cookie = 'pci_creator_csrf=test-csrf'; const fetchMock = vi.fn().mockResolvedValue(ok()); vi.stubGlobal('fetch', fetchMock);
    await apiClient.POST('/api/v1/creator/requests/action-1/confirm');
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]; expect(new Headers(init.headers).get('x-csrf-token')).toBe('test-csrf');
  });
  it('returns structured unauthorized errors and never retries with a token', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: { code: 'invalid_session' } }), { status: 401 })); vi.stubGlobal('fetch', fetchMock);
    await expect(apiClient.GET('/api/v1/creator/identity')).resolves.toMatchObject({ status: 401 }); expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});