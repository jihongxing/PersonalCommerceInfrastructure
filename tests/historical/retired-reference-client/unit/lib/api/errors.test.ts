import { describe, expect, it } from 'vitest';

import { errorFromResponse } from './errors.js';

describe('Web API error adapter', () => {
  it('maps the governed API error envelope', async () => {
    const error = await errorFromResponse(
      new Response(
        JSON.stringify({
          error: {
            category: 'authentication',
            code: 'invalid_access_token',
            correlationId: 'correlation-1',
            message: 'Authentication could not be verified.',
          },
        }),
        {
          status: 401,
          headers: {
            'content-type': 'application/json',
          },
        },
      ),
    );

    expect(error).toMatchObject({
      status: 401,
      category: 'authentication',
      code: 'invalid_access_token',
      correlationId: 'correlation-1',
    });
  });

  it('uses a safe fallback for malformed API errors', async () => {
    const error = await errorFromResponse(
      new Response('unavailable', {
        status: 503,
        headers: {
          'x-correlation-id': 'correlation-2',
        },
      }),
    );

    expect(error).toMatchObject({
      status: 503,
      category: 'internal',
      code: 'invalid_api_error_response',
      correlationId: 'correlation-2',
    });
  });
});
