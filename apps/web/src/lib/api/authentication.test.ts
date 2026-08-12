import { describe, expect, it } from 'vitest';

import { applyBearerAuthentication } from './authentication.js';

describe('Web API authentication adapter', () => {
  it('adds a bearer token without exposing Provider SDK types', async () => {
    const request = await applyBearerAuthentication(
      new Request('https://api.example.test/api/v1/health'),
      {
        getAccessToken: () => Promise.resolve('access-token'),
      },
    );

    expect(request.headers.get('authorization')).toBe('Bearer access-token');
  });

  it('leaves anonymous requests unchanged', async () => {
    const request = await applyBearerAuthentication(
      new Request('https://api.example.test/api/v1/health'),
      {
        getAccessToken: () => Promise.resolve(undefined),
      },
    );

    expect(request.headers.has('authorization')).toBe(false);
  });
});
