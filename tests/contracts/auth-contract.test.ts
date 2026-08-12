import { Value } from 'typebox/value';
import { describe, expect, it } from 'vitest';

import {
  AuthenticationErrorCodes,
  AuthorizationHeaderSchema,
} from '../../contracts/api/v1/auth-contracts.js';

describe('Auth API contracts', () => {
  it('accepts only Bearer authorization headers', () => {
    expect(Value.Check(AuthorizationHeaderSchema, 'Bearer access-token')).toBe(true);
    expect(Value.Check(AuthorizationHeaderSchema, 'Basic access-token')).toBe(false);
    expect(Value.Check(AuthorizationHeaderSchema, 'Bearer')).toBe(false);
  });

  it('freezes the authentication error code vocabulary', () => {
    expect(AuthenticationErrorCodes).toEqual([
      'missing_authorization',
      'invalid_authorization',
      'missing_access_token',
      'invalid_access_token',
      'creator_actor_not_mapped',
    ]);
  });
});
