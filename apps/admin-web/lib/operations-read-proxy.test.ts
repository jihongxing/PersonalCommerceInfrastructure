import { describe, expect, it, vi } from 'vitest';
import { proxyOperationsReadRequest } from './operations-read-proxy';

const configuration = {
  apiOrigin: 'http://127.0.0.1:8080',
  webOrigin: 'http://localhost:3002',
  production: false,
};
const credential = 'a'.repeat(43);

describe('Operations read BFF boundary', () => {
  it('forwards only the opaque Session credential and preserves API status/body', async () => {
    const upstream = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        Response.json(
          { items: [{ id: 'catalog-1' }], page: 1, pageSize: 20, total: 1 },
          { status: 200, headers: { 'x-correlation-id': 'correlation-1' } },
        ),
      );
    const response = await proxyOperationsReadRequest(
      new Request('http://localhost:3002/api/operations/catalog/capabilities'),
      '/api/v1/operations/admin/catalog/capabilities?page=1',
      configuration,
      credential,
      upstream,
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ items: [{ id: 'catalog-1' }] });
    const init = upstream.mock.calls[0]![1]!;
    expect(new Headers(init.headers).get('authorization')).toBe(`Bearer ${credential}`);
    expect(new Headers(init.headers).has('x-principal-id')).toBe(false);
  });

  it('rejects missing sessions and cross-site reads before contacting the API', async () => {
    const upstream = vi.fn<typeof fetch>();
    expect(
      (
        await proxyOperationsReadRequest(
          new Request('http://localhost:3002/api/operations/audit'),
          '/api/v1/operations/admin/audit',
          configuration,
          undefined,
          upstream,
        )
      ).status,
    ).toBe(401);
    expect(
      (
        await proxyOperationsReadRequest(
          new Request('http://localhost:3002/api/operations/audit', {
            headers: { origin: 'https://evil.invalid' },
          }),
          '/api/v1/operations/admin/audit',
          configuration,
          credential,
          upstream,
        )
      ).status,
    ).toBe(403);
    expect(upstream).not.toHaveBeenCalled();
  });

  it('turns upstream/network failures into a non-sensitive retry response', async () => {
    const upstream = vi.fn<typeof fetch>().mockRejectedValue(new Error('private failure'));
    const response = await proxyOperationsReadRequest(
      new Request('http://localhost:3002/api/operations/audit'),
      '/api/v1/operations/admin/audit',
      configuration,
      credential,
      upstream,
    );
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain('private failure');
  });
});
