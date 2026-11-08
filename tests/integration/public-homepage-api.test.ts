import { describe, expect, it, vi } from 'vitest';
import { InMemoryAuthContextProvider } from '../../adapters/auth/testing/in-memory-auth-context-provider.js';
import { createApiServer } from '../../apps/api/src/create-api-server.js';
import {
  createPublicHomepageService,
  type PublicHomepageRepository,
} from '../../applications/public-commerce-homepage/public-commerce-homepage-service.js';

describe('public homepage HTTP contract', () => {
  it('distinguishes invalid, unavailable and failed lookups, prevents caching, and requires preview authentication', async () => {
    const reference = '3C7M4Q9RDFHJKNTWVY';
    const view = '639f7d17-9391-4095-ab84-128daf2e0300';
    const resolve = vi.fn().mockResolvedValue({
      commerceReference: reference,
      displayName: 'Public',
      offerings: [],
      email: 'private@example.invalid',
    });
    const repository: PublicHomepageRepository = {
      configuration: vi.fn(),
      selectProfile: vi.fn(),
      transition: vi.fn(),
      preview: vi.fn(),
      resolve,
    };
    const server = await createApiServer({
      authContextProvider: new InMemoryAuthContextProvider([]),
      publicHomepageService: createPublicHomepageService({
        repository,
        currentUserIdentityService: { getCurrentIdentity: vi.fn() },
      }),
    });
    try {
      const get = (number: string) =>
        server.inject({ method: 'GET', url: `/api/v1/public/homepages/${number}?viewId=${view}` });
      const success = await get('3c7m4q-9rdfhj-kntwvy');
      expect(success.statusCode).toBe(200);
      expect(success.headers['cache-control']).toBe('no-store');
      expect(success.json()).toEqual({
        commerceReference: reference,
        displayName: 'Public',
        offerings: [],
      });
      expect(resolve).toHaveBeenCalledWith(reference, view);
      const invalid = await get('bad');
      expect(invalid.statusCode).toBe(400);
      expect(invalid.headers['cache-control']).toBe('no-store');
      resolve.mockResolvedValueOnce(undefined);
      expect((await get(reference)).statusCode).toBe(404);
      resolve.mockRejectedValueOnce(new Error('database down'));
      const failed = await get(reference);
      expect(failed.statusCode).toBe(500);
      expect(failed.headers['cache-control']).toBe('no-store');
      expect(
        (await server.inject({ method: 'GET', url: '/api/v1/private/homepage/preview' }))
          .statusCode,
      ).toBe(401);
    } finally {
      await server.close();
    }
  });

  it('includes homepage routes in the default OpenAPI document', async () => {
    const server = await createApiServer();
    try {
      await server.ready();
      const document = server.swagger();
      expect(document.paths?.['/api/v1/public/homepages/{reference}']).toBeDefined();
      expect(document.paths?.['/api/v1/private/homepage/publish']).toBeDefined();
    } finally {
      await server.close();
    }
  });

  it('returns the current public Profile summary in the private configuration', async () => {
    const configuration = {
      state: 'PUBLISHED' as const,
      commerceProfileId: 'profile-current',
      commerceProfile: {
        id: 'profile-current',
        displayName: '工作资料',
        lifecycle: 'ACTIVE' as const,
      },
    };
    const server = await createApiServer({
      authContextProvider: new InMemoryAuthContextProvider([
        { accessToken: 'creator-token', actor: { kind: 'creator', creatorId: 'creator-a' } },
      ]),
      publicHomepageService: createPublicHomepageService({
        repository: {
          configuration: vi.fn().mockResolvedValue(configuration),
          selectProfile: vi.fn(),
          transition: vi.fn(),
          preview: vi.fn(),
          resolve: vi.fn(),
        },
        currentUserIdentityService: {
          getCurrentIdentity: vi
            .fn()
            .mockResolvedValue({ identityId: 'identity-a', status: 'ACTIVE', createdAt: '' }),
        },
      }),
    });
    try {
      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/private/homepage',
        headers: { authorization: 'Bearer creator-token' },
      });
      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual(configuration);
    } finally {
      await server.close();
    }
  });
});
