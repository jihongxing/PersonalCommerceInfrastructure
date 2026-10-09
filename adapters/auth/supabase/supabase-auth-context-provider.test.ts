import { describe, expect, it } from 'vitest';

import { ApplicationError } from '../../../applications/core/application-error.js';
import { createAuthContextProvider } from '../../../applications/core/ports/auth-context-provider.js';
import { SupabaseTokenVerifier } from './supabase-auth-context-provider.js';

describe('Supabase Auth adapter', () => {
  it('maps a verified provider identity through the Creator resolver', async () => {
    const provider = createAuthContextProvider({
      tokenVerifier: {
        verifyAccessToken: (accessToken) =>
          Promise.resolve({
            provider: 'supabase',
            subject: accessToken,
          }),
      },
      creatorActorResolver: {
        resolveCreatorId: (identity) => Promise.resolve(`creator-for-${identity.subject}`),
      },
    });

    await expect(
      provider.resolveActorContext({
        accessToken: 'supabase-user-1',
        correlationId: 'correlation-1',
      }),
    ).resolves.toEqual({
      accountId: 'supabase:supabase-user-1',
      actor: {
        kind: 'creator',
        creatorId: 'creator-for-supabase-user-1',
      },
      correlationId: 'correlation-1',
    });
  });

  it('rejects a verified identity without an explicit Creator mapping', async () => {
    const provider = createAuthContextProvider({
      tokenVerifier: {
        verifyAccessToken: () =>
          Promise.resolve({
            provider: 'supabase',
            subject: 'supabase-user-1',
          }),
      },
      creatorActorResolver: {
        resolveCreatorId: () => Promise.resolve(undefined),
      },
    });

    await expect(
      provider.resolveActorContext({
        accessToken: 'access-token',
        correlationId: 'correlation-1',
      }),
    ).rejects.toMatchObject({
      category: 'authentication',
      code: 'creator_actor_not_mapped',
    });
  });

  it('uses Supabase getUser to verify a non-empty access token', async () => {
    const verifier = new SupabaseTokenVerifier({
      auth: {
        getUser: (accessToken: string) =>
          Promise.resolve({
            data: { user: { id: `user-for-${accessToken}` } },
            error: null,
          }),
      },
    } as never);

    await expect(verifier.verifyAccessToken('token-1')).resolves.toEqual({
      provider: 'supabase',
      subject: 'user-for-token-1',
    });
  });

  it('does not expose provider errors and rejects invalid tokens', async () => {
    const verifier = new SupabaseTokenVerifier({
      auth: {
        getUser: () =>
          Promise.resolve({
            data: { user: null },
            error: new Error('provider detail must not escape'),
          }),
      },
    } as never);

    await expect(verifier.verifyAccessToken('token-1')).rejects.toMatchObject({
      category: 'authentication',
      code: 'invalid_access_token',
      message: 'Authentication could not be verified.',
    });
    await expect(verifier.verifyAccessToken('   ')).rejects.toMatchObject({
      category: 'authentication',
      code: 'missing_access_token',
    });
    await expect(verifier.verifyAccessToken('token-1')).rejects.toBeInstanceOf(ApplicationError);
  });
});
