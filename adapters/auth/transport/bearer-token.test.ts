import { describe, expect, it } from 'vitest';

import { extractBearerToken } from './bearer-token.js';

describe('Bearer token transport adapter', () => {
  it('extracts a bearer token without logging or transforming it', () => {
    expect(extractBearerToken('Bearer token-1')).toBe('token-1');
    expect(extractBearerToken(' bearer   token-2 ')).toBe('token-2');
  });

  it.each([undefined, '', 'Basic token-1', 'Bearer'])(
    'rejects invalid authorization input: %s',
    (header) => {
      expect(() => extractBearerToken(header)).toThrowError(
        expect.objectContaining({
          category: 'authentication',
        }),
      );
    },
  );
});
