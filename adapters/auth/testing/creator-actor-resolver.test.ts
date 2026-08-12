import { describe, expect, it } from 'vitest';

import { InMemoryCreatorActorResolver } from './creator-actor-resolver.js';

describe('InMemoryCreatorActorResolver', () => {
  it('requires an explicit provider identity mapping', async () => {
    const resolver = new InMemoryCreatorActorResolver(new Map([['supabase:user-1', 'creator-1']]));

    await expect(
      resolver.resolveCreatorId({ provider: 'supabase', subject: 'user-1' }),
    ).resolves.toBe('creator-1');
    await expect(
      resolver.resolveCreatorId({ provider: 'supabase', subject: 'unknown' }),
    ).resolves.toBeUndefined();
  });
});
