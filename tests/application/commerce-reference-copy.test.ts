import { describe, expect, it } from 'vitest';

import { copyCanonicalCommerceReference } from '../../apps/web/src/lib/commerce-reference-copy.js';

describe('Commerce Reference copy presentation', () => {
  it('copies the canonical C号 rather than its grouped display value', async () => {
    const copied: string[] = [];

    await copyCanonicalCommerceReference(
      { writeText: (value) => Promise.resolve().then(() => void copied.push(value)) },
      '3C7M4Q9RDFHJKNTWVY',
    );

    expect(copied).toEqual(['3C7M4Q9RDFHJKNTWVY']);
  });
});
