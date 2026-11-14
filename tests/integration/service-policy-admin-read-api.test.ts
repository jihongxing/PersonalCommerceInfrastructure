import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';

import { createApiServer } from '../../apps/api/src/create-api-server.js';
import { createActorContext } from '../../applications/core/actor-context.js';
import { ApplicationError } from '../../applications/core/application-error.js';
import type { OperationsHumanAuthenticationRuntime } from '../../applications/operations-identity/operations-human-authentication.js';

describe('Operations Admin read-only Catalog and Audit API', () => {
  let server: FastifyInstance;
  const humanRuntime = {
    resolveActorContext({
      accessToken,
      correlationId,
    }: {
      accessToken: string;
      correlationId: string;
    }) {
      if (accessToken === 'catalog-read-token') {
        return Promise.resolve(
          createActorContext({
            actor: {
              kind: 'operations_human',
              principalId: 'principal-read',
              accountId: 'account-read',
              sessionId: 'session-read',
              permissions: ['catalog:read'],
            },
            accountId: 'account-read',
            correlationId,
          }),
        );
      }
      if (accessToken === 'audit-read-token') {
        return Promise.resolve(
          createActorContext({
            actor: {
              kind: 'operations_human',
              principalId: 'principal-audit',
              accountId: 'account-audit',
              sessionId: 'session-audit',
              permissions: ['audit:read'],
            },
            accountId: 'account-audit',
            correlationId,
          }),
        );
      }
      throw new ApplicationError({
        category: 'authentication',
        code: 'invalid_test_session',
        message: 'Authentication could not be verified.',
      });
    },
    login() {
      return Promise.reject(new Error('not used'));
    },
    logout() {
      return Promise.reject(new Error('not used'));
    },
  } satisfies OperationsHumanAuthenticationRuntime;

  beforeAll(async () => {
    server = await createApiServer({
      operationsHumanAuthenticationRuntime: humanRuntime,
      rateLimitMax: 1_000,
      logger: { debug() {}, info() {}, warn() {}, error() {} },
    });
    // Use the existing accepted write route only to create a real audit fixture.
    const mutation = await server.inject({
      method: 'PATCH',
      url: '/api/v1/operations/service-policy/capabilities/capability-dance-teaching',
      headers: { authorization: 'Bearer test-operations-token' },
      payload: { status: 'paused', reason: 'read-only API fixture' },
    });
    expect(mutation.statusCode).toBe(200);
  });

  afterAll(async () => {
    await server.close();
  });

  it('requires a Human Operations Session and the Catalog permission', async () => {
    expect(
      (await server.inject({ method: 'GET', url: '/api/v1/operations/admin/catalog/capabilities' }))
        .statusCode,
    ).toBe(401);
    expect(
      (
        await server.inject({
          method: 'GET',
          url: '/api/v1/operations/admin/catalog/capabilities',
          headers: { authorization: 'Bearer audit-read-token' },
        })
      ).statusCode,
    ).toBe(403);
    const response = await server.inject({
      method: 'GET',
      url: '/api/v1/operations/admin/catalog/capabilities?q=dance&page=1&pageSize=1',
      headers: { authorization: 'Bearer catalog-read-token', 'x-principal-id': 'forged' },
    });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ kind: 'capabilities', page: 1, pageSize: 1, total: 2 });
    const catalog = response.json<{ items: Array<{ id: string }> }>();
    expect(catalog.items[0]).toMatchObject({ id: 'capability-dance-teaching' });
  });

  it('returns authoritative Catalog details and separates templates', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/api/v1/operations/admin/catalog/capabilities/capability-dance-teaching',
      headers: { authorization: 'Bearer catalog-read-token' },
    });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ id: 'capability-dance-teaching', status: 'paused' });
    const missing = await server.inject({
      method: 'GET',
      url: '/api/v1/operations/admin/catalog/templates/does-not-exist',
      headers: { authorization: 'Bearer catalog-read-token' },
    });
    expect(missing.statusCode).toBe(404);
  });

  it('supports read-only Audit list/detail with redaction and permission separation', async () => {
    const denied = await server.inject({
      method: 'GET',
      url: '/api/v1/operations/admin/audit',
      headers: { authorization: 'Bearer catalog-read-token' },
    });
    expect(denied.statusCode).toBe(403);
    const list = await server.inject({
      method: 'GET',
      url: '/api/v1/operations/admin/audit?entityType=capability&action=updated&pageSize=10',
      headers: { authorization: 'Bearer audit-read-token' },
    });
    expect(list.statusCode).toBe(200);
    const record = list.json<{
      items: Array<{ id: string; before: Record<string, unknown>; actorCategory?: string }>;
    }>().items[0];
    expect(record?.id).toBeTypeOf('string');
    expect(record?.actorCategory).toBe('unknown');
    const detail = await server.inject({
      method: 'GET',
      url: `/api/v1/operations/admin/audit/${record!.id}`,
      headers: { authorization: 'Bearer audit-read-token' },
    });
    expect(detail.statusCode).toBe(200);
    expect(JSON.stringify(detail.json())).not.toMatch(
      /password|verifier|session|digest|secret|token/iu,
    );
    expect(
      (
        await server.inject({
          method: 'PATCH',
          url: '/api/v1/operations/admin/audit/' + record!.id,
          headers: { authorization: 'Bearer audit-read-token' },
          payload: {},
        })
      ).statusCode,
    ).toBe(404);
  });
});
