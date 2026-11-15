import { describe, expect, it, vi } from 'vitest';
import { apiClient } from './client';

describe('BFF error privacy', () => {
  it('does not place credential-shaped values in request headers', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ error: { code: 'invalid_session' } }), { status: 401 }),
      );
    vi.stubGlobal('fetch', fetchMock);
    await apiClient.GET('/api/v1/creator/identity');
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.stringify(Object.fromEntries(new Headers(init.headers)))).not.toMatch(
      /access|refresh|bearer/i,
    );
    vi.unstubAllGlobals();
  });
});
