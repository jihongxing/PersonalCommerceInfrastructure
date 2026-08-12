import { describe, expect, it } from 'vitest';

import { InMemoryAuthContextProvider } from './in-memory-auth-context-provider.js';

describe('in-memory Auth adapter', () => {
  it('resolves a configured test identity', async () => {
    const provider = new InMemoryAuthContextProvider([
      {
        accessToken: 'creator-token',
        actor: { kind: 'creator', creatorId: 'creator-1' },
      },
    ]);

    await expect(
      provider.resolveActorContext({
        accessToken: 'creator-token',
        correlationId: 'correlation-1',
      }),
    ).resolves.toEqual({
      actor: { kind: 'creator', creatorId: 'creator-1' },
      correlationId: 'correlation-1',
    });
  });

  it('rejects an unknown test identity', async () => {
    const provider = new InMemoryAuthContextProvider([]);

    await expect(
      provider.resolveActorContext({
        accessToken: 'unknown-token',
        correlationId: 'correlation-1',
      }),
    ).rejects.toMatchObject({
      category: 'authentication',
      code: 'invalid_access_token',
    });
  });
});
