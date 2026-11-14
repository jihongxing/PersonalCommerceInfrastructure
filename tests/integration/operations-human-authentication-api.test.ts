import { describe, expect, it } from 'vitest';

import { createActorContext } from '../../applications/core/actor-context.js';
import type { OperationsHumanAuthenticationRuntime } from '../../applications/operations-identity/operations-human-authentication.js';
import { createApiServer } from '../../apps/api/src/create-api-server.js';
import {
  createOperationsAccountId,
  createOperationsHumanPrincipalId,
  createOperationsSessionId,
} from '../../modules/operations-identity/operations-identity-contract.js';

describe('Operations Human authentication API', () => {
  it('supports BFF login, session validation and logout revocation', async () => {
    let revoked = false;
    const runtime: OperationsHumanAuthenticationRuntime = {
      login() {
        return Promise.resolve({
          credential: 'opaque-session-credential-12345678901234567890',
          principalId: createOperationsHumanPrincipalId('principal-1'),
          accountId: createOperationsAccountId('account-1'),
          sessionId: createOperationsSessionId('session-1'),
          absoluteExpiresAt: new Date('2030-01-01T00:00:00.000Z'),
          permissions: ['catalog:read', 'audit:read'],
        });
      },
      resolveActorContext(request) {
        if (request.accessToken !== 'opaque-session-credential-12345678901234567890' || revoked) {
          return Promise.reject(new Error('unauthenticated'));
        }
        return Promise.resolve(
          createActorContext({
            actor: {
              kind: 'operations_human',
              principalId: 'principal-1',
              accountId: 'account-1',
              sessionId: 'session-1',
              permissions: ['catalog:read', 'audit:read'],
            },
            correlationId: request.correlationId,
          }),
        );
      },
      logout() {
        revoked = true;
        return Promise.resolve();
      },
    };
    const server = await createApiServer({ operationsHumanAuthenticationRuntime: runtime });
    try {
      const login = await server.inject({
        method: 'POST',
        url: '/api/v1/operations/auth/login',
        payload: { loginIdentifier: 'operator@example.invalid', password: 'correct horse battery' },
      });
      expect(login.statusCode).toBe(200);
      expect(login.json()).toHaveProperty('credential');

      const session = await server.inject({
        method: 'GET',
        url: '/api/v1/operations/auth/session',
        headers: { authorization: 'Bearer opaque-session-credential-12345678901234567890' },
      });
      expect(session.statusCode).toBe(200);
      expect(session.json()).toMatchObject({
        accountId: 'account-1',
        permissions: ['catalog:read', 'audit:read'],
      });

      const logout = await server.inject({
        method: 'POST',
        url: '/api/v1/operations/auth/logout',
        headers: { authorization: 'Bearer opaque-session-credential-12345678901234567890' },
      });
      expect(logout.statusCode).toBe(204);
    } finally {
      await server.close();
    }
  });
});
