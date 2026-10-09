import { describe, expect, it } from 'vitest';

import { createAuthContextProvider } from '../../applications/core/ports/auth-context-provider.js';

describe('Authentication Account context', () => {
  it('derives an Account ID from the verified provider identity without inferring OWNER', async () => {
    const provider = createAuthContextProvider({
      tokenVerifier: {
        verifyAccessToken: () =>
          Promise.resolve({
            provider: 'supabase',
            subject: 'provider-user-1',
          }),
      },
      creatorActorResolver: {
        resolveCreatorId: () => Promise.resolve('legacy-creator-1'),
      },
    });

    await expect(
      provider.resolveAccountContext({
        accessToken: 'valid-token',
        correlationId: 'correlation-1',
      }),
    ).resolves.toEqual({
      accountId: 'supabase:provider-user-1',
      correlationId: 'correlation-1',
    });

    await expect(
      provider.resolveActorContext({
        accessToken: 'valid-token',
        correlationId: 'correlation-1',
      }),
    ).resolves.toEqual({
      accountId: 'supabase:provider-user-1',
      actor: {
        kind: 'creator',
        creatorId: 'legacy-creator-1',
      },
      correlationId: 'correlation-1',
    });
  });
});
