import { afterEach, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth/session', () => ({
  getBearerToken: () => null,
  getSession: () => null,
  setSession: vi.fn(),
  clearSession: vi.fn(),
}));

afterEach(() => vi.unstubAllGlobals());

it('accepts a 204 DELETE without attempting to parse a response body', async () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
  vi.stubGlobal('fetch', fetchMock);
  const { apiClient } = await import('./client');

  expect(await apiClient.DELETE('/api/v1/private/homepage-windows/window-1')).toEqual({
    data: null,
    error: null,
    status: 204,
  });
  expect(fetchMock).toHaveBeenCalledWith(
    expect.stringContaining('/api/v1/private/homepage-windows/window-1'),
    expect.objectContaining({ method: 'DELETE' }),
  );
});

it('still exposes structured errors from a failed DELETE', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: { code: 'conflict', message: 'Window conflict' } }), {
        status: 409,
      }),
    ),
  );
  const { apiClient } = await import('./client');

  expect(await apiClient.DELETE('/api/v1/private/homepage-windows/window-1')).toMatchObject({
    data: null,
    error: { error: { code: 'conflict', message: 'Window conflict' } },
    status: 409,
  });
});
