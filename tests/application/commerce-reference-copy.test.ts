import { afterEach, describe, expect, it, vi } from 'vitest';

import { copyText } from '../../apps/web-v2/lib/copy-text.js';

afterEach(() => vi.unstubAllGlobals());

describe('Commerce Reference copy presentation', () => {
  it('copies the canonical C号 rather than its grouped display value', async () => {
    const copied: string[] = [];

    vi.stubGlobal('navigator', {
      clipboard: {
        writeText: (value: string) => Promise.resolve().then(() => void copied.push(value)),
      },
    });
    expect(await copyText('3C7M4Q9RDFHJKNTWVY')).toBe(true);

    expect(copied).toEqual(['3C7M4Q9RDFHJKNTWVY']);
  });
});
