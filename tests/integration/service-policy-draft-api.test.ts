import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';

import { createApiServer } from '../../apps/api/src/create-api-server.js';
import { createActorContext } from '../../applications/core/actor-context.js';
import type { OperationsHumanAuthenticationRuntime } from '../../applications/operations-identity/operations-human-authentication.js';
import { ApplicationError } from '../../applications/core/application-error.js';

describe('controlled Catalog policy API', () => {
  let server: FastifyInstance;
  const runtime = {
    resolveActorContext({
      accessToken,
      correlationId,
    }: {
      accessToken: string;
      correlationId: string;
    }) {
      const permissions =
        accessToken === 'full-catalog-token'
          ? [
              'catalog:read',
              'catalog:draft:create',
              'catalog:draft:update',
              'catalog:policy:activate',
            ]
          : accessToken === 'catalog-create-token'
            ? ['catalog:read', 'catalog:draft:create']
            : accessToken === 'catalog-update-token'
              ? ['catalog:read', 'catalog:draft:update']
              : accessToken === 'catalog-activate-token'
                ? ['catalog:read', 'catalog:policy:activate']
                : ['catalog:read'];
      if (!accessToken.includes('catalog')) {
        throw new ApplicationError({
          category: 'authentication',
          code: 'invalid_test_session',
          message: 'Invalid test session.',
        });
      }
      return Promise.resolve(
        createActorContext({
          actor: {
            kind: 'operations_human',
            principalId: 'principal-draft',
            accountId: 'account-draft',
            sessionId: 'session-draft',
            permissions,
          },
          accountId: 'account-draft',
          correlationId,
        }),
      );
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
      operationsHumanAuthenticationRuntime: runtime,
      rateLimitMax: 1_000,
    });
  });
  afterAll(async () => server.close());

  it('enforces separate draft permissions and activates only after confirmation', async () => {
    const denied = await server.inject({
      method: 'POST',
      url: '/api/v1/operations/admin/catalog/drafts',
      headers: { authorization: 'Bearer catalog-read-token' },
      payload: { reason: 'Denied draft' },
    });
    expect(denied.statusCode).toBe(403);
    const created = await server.inject({
      method: 'POST',
      url: '/api/v1/operations/admin/catalog/drafts',
      headers: { authorization: 'Bearer catalog-create-token' },
      payload: { reason: 'Create draft' },
    });
    expect(created.statusCode).toBe(201);
    const draft = created.json<{
      policyVersion: string;
      revision: string;
      capabilities: Array<{ id: string }>;
    }>();
    const listed = await server.inject({
      method: 'GET',
      url: '/api/v1/operations/admin/catalog/drafts',
      headers: { authorization: 'Bearer catalog-read-token' },
    });
    expect(listed.statusCode).toBe(200);
    expect(listed.json<Array<{ policyVersion: string }>>()).toEqual(
      expect.arrayContaining([expect.objectContaining({ policyVersion: draft.policyVersion })]),
    );
    const updateDenied = await server.inject({
      method: 'PATCH',
      url: `/api/v1/operations/admin/catalog/drafts/${draft.policyVersion}/capabilities/${draft.capabilities[0]!.id}`,
      headers: { authorization: 'Bearer catalog-read-token' },
      payload: { riskTier: 'review', expectedRevision: draft.revision, reason: 'Denied edit' },
    });
    expect(updateDenied.statusCode).toBe(403);
    const update = await server.inject({
      method: 'PATCH',
      url: `/api/v1/operations/admin/catalog/drafts/${draft.policyVersion}/capabilities/${draft.capabilities[0]!.id}`,
      headers: { authorization: 'Bearer catalog-update-token' },
      payload: { riskTier: 'review', expectedRevision: draft.revision, reason: 'Reclassify risk' },
    });
    expect(update.statusCode).toBe(200);
    const updated = update.json<{ revision: string }>();
    const preview = await server.inject({
      method: 'POST',
      url: `/api/v1/operations/admin/catalog/drafts/${draft.policyVersion}/preview`,
      headers: { authorization: 'Bearer catalog-read-token' },
    });
    expect(preview.statusCode).toBe(200);
    expect(preview.json()).toMatchObject({ status: 'VALID' });
    expect(preview.json<{ changes: Array<{ field: string }> }>().changes).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: 'riskTier' })]),
    );
    const activationDenied = await server.inject({
      method: 'POST',
      url: `/api/v1/operations/admin/catalog/drafts/${draft.policyVersion}/activate`,
      headers: { authorization: 'Bearer catalog-update-token' },
      payload: { expectedRevision: updated.revision, reason: 'Denied activation', confirm: true },
    });
    expect(activationDenied.statusCode).toBe(403);
    const unconfirmed = await server.inject({
      method: 'POST',
      url: `/api/v1/operations/admin/catalog/drafts/${draft.policyVersion}/activate`,
      headers: { authorization: 'Bearer catalog-activate-token' },
      payload: {
        expectedRevision: updated.revision,
        reason: 'Missing confirmation',
        confirm: false,
      },
    });
    expect(unconfirmed.statusCode).toBe(400);
    const activated = await server.inject({
      method: 'POST',
      url: `/api/v1/operations/admin/catalog/drafts/${draft.policyVersion}/activate`,
      headers: { authorization: 'Bearer catalog-activate-token' },
      payload: { expectedRevision: updated.revision, reason: 'Activate policy', confirm: true },
    });
    expect(activated.statusCode).toBe(204);
  });
});
