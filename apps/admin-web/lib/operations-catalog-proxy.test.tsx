import { afterEach, describe, expect, it, vi } from 'vitest';

import { proxyOperationsCatalogRequest } from './operations-catalog-proxy';

describe('operations catalog BFF proxy', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('forwards only the server-held opaque credential', async () => {
    const upstream = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ policyVersion: 'draft-1' }), {
        status: 201,
        headers: { 'content-type': 'application/json', 'x-correlation-id': 'corr-1' },
      }),
    );
    vi.stubGlobal('fetch', upstream);
    const response = await proxyOperationsCatalogRequest(
      new Request('https://admin.example.test/api/operations/catalog/drafts', {
        method: 'POST',
        headers: { origin: 'https://admin.example.test', 'x-principal-id': 'forged' },
        body: JSON.stringify({ reason: 'test' }),
      }),
      '/api/v1/operations/admin/catalog/drafts',
      {
        apiOrigin: 'https://api.example.test',
        webOrigin: 'https://admin.example.test',
        production: true,
      },
      'a'.repeat(43),
    );
    expect(response.status).toBe(201);
    expect(upstream).toHaveBeenCalledWith(
      'https://api.example.test/api/v1/operations/admin/catalog/drafts',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ authorization: `Bearer ${'a'.repeat(43)}` }),
      }),
    );
    expect(
      (upstream.mock.calls[0]?.[1]?.headers as Record<string, string>)['x-principal-id'],
    ).toBeUndefined();
  });

  it('does not send an empty JSON body for bodyless preview requests', async () => {
    const upstream = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ status: 'VALID', errors: [], changes: [] }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', upstream);
    const response = await proxyOperationsCatalogRequest(
      new Request('https://admin.example.test/api/operations/catalog/drafts/draft-1/preview', {
        method: 'POST',
        headers: { origin: 'https://admin.example.test' },
      }),
      '/api/v1/operations/admin/catalog/drafts/draft-1/preview',
      {
        apiOrigin: 'https://api.example.test',
        webOrigin: 'https://admin.example.test',
        production: true,
      },
      'a'.repeat(43),
    );
    expect(response.status).toBe(200);
    const options = upstream.mock.calls[0]?.[1];
    expect(options?.body).toBeUndefined();
    expect(options?.headers).not.toHaveProperty('content-type');
  });

  it('preserves an upstream 204 without constructing an invalid response body', async () => {
    const upstream = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', upstream);
    const response = await proxyOperationsCatalogRequest(
      new Request('https://admin.example.test/api/operations/catalog/drafts/draft-1/activate', {
        method: 'POST',
        headers: { origin: 'https://admin.example.test' },
      }),
      '/api/v1/operations/admin/catalog/drafts/draft-1/activate',
      {
        apiOrigin: 'https://api.example.test',
        webOrigin: 'https://admin.example.test',
        production: true,
      },
      'a'.repeat(43),
    );
    expect(response.status).toBe(204);
    expect(await response.text()).toBe('');
  });

  it.each([
    [undefined, 401],
    ['https://evil.example.test', 403],
  ])('rejects unsafe browser requests (%s)', async (origin, status) => {
    const response = await proxyOperationsCatalogRequest(
      new Request('https://admin.example.test/api/operations/catalog/drafts', {
        method: 'POST',
        headers: origin === undefined ? {} : { origin },
      }),
      '/api/v1/operations/admin/catalog/drafts',
      {
        apiOrigin: 'https://api.example.test',
        webOrigin: 'https://admin.example.test',
        production: true,
      },
      origin === undefined ? undefined : 'a'.repeat(43),
    );
    expect(response.status).toBe(status);
  });
});
