import { describe, expect, it } from 'vitest';
import { Value } from 'typebox/value';

import { OperationsLoginResponseSchema } from '../../contracts/api/v1/operations-human-authentication-contracts.js';
import { OPERATIONS_HUMAN_PERMISSIONS } from '../../modules/operations-identity/operations-identity-contract.js';

describe('Operations Human authentication response contract', () => {
  it('accepts exactly the approved seven permissions', () => {
    const response = {
      principalId: 'principal-1',
      accountId: 'account-1',
      sessionId: 'session-1',
      permissions: OPERATIONS_HUMAN_PERMISSIONS,
      absoluteExpiresAt: '2030-01-01T00:00:00.000Z',
      credential: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
    };
    expect(Value.Check(OperationsLoginResponseSchema, response)).toBe(true);
    expect(response.permissions).toHaveLength(7);
  });

  it('rejects permissions outside the approved closed set', () => {
    const response = {
      principalId: 'principal-1',
      accountId: 'account-1',
      sessionId: 'session-1',
      permissions: [...OPERATIONS_HUMAN_PERMISSIONS, 'admin:*'],
      absoluteExpiresAt: '2030-01-01T00:00:00.000Z',
      credential: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
    };
    expect(Value.Check(OperationsLoginResponseSchema, response)).toBe(false);
  });
});
