import { Value } from 'typebox/value';
import { describe, expect, it } from 'vitest';

import {
  ApiErrorEnvelopeSchema,
  ApiVersion,
  HealthResponseSchema,
  ReadinessResponseSchema,
} from '../../contracts/api/v1/system-contracts.js';

describe('API v1 contracts', () => {
  it('freezes the cross-client API version', () => {
    expect(ApiVersion).toBe('v1');
  });

  it('accepts the governed system response contracts', () => {
    expect(
      Value.Check(HealthResponseSchema, {
        service: 'vs-01-api',
        status: 'ok',
        version: 'v1',
      }),
    ).toBe(true);
    expect(
      Value.Check(ReadinessResponseSchema, {
        service: 'vs-01-api',
        status: 'ready',
        version: 'v1',
      }),
    ).toBe(true);
    expect(
      Value.Check(ReadinessResponseSchema, {
        service: 'vs-01-api',
        status: 'not_ready',
        version: 'v1',
      }),
    ).toBe(true);
  });

  it('requires a stable error envelope and correlation id', () => {
    expect(
      Value.Check(ApiErrorEnvelopeSchema, {
        error: {
          category: 'not_found',
          code: 'route_not_found',
          correlationId: 'request-1',
          message: 'Route not found.',
        },
      }),
    ).toBe(true);
    expect(
      Value.Check(ApiErrorEnvelopeSchema, {
        error: {
          category: 'not_found',
          code: 'route_not_found',
          message: 'Route not found.',
        },
      }),
    ).toBe(false);
  });
});
