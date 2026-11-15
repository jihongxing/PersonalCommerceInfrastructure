import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createApiServer } from '../../apps/api/src/create-api-server.js';
import type { FastifyInstance } from 'fastify';

describe('service policy API', () => {
  let server: FastifyInstance;

  beforeAll(async () => {
    server = await createApiServer({ rateLimitMax: 1_000 });
  });

  afterAll(async () => {
    await server.close();
  });

  it('serves the database-backed catalog to Creators', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/api/v1/creator/service-catalog',
      headers: { authorization: 'Bearer test-creator-token' },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json<{
      policyVersion: string;
      capabilities: readonly { id: string }[];
      templates: readonly { id: string }[];
    }>();
    expect(body.policyVersion).toBe('v1');
    expect(body.capabilities.some((item) => item.id === 'capability-dance-teaching')).toBe(true);
    expect(body.templates.some((item) => item.id === 'template-dance-private-lesson')).toBe(true);
  });

  it('retires every legacy Catalog Operations route before authentication or business access', async () => {
    const routes = [
      { method: 'GET' as const, url: '/api/v1/operations/service-policy/workspace' },
      { method: 'GET' as const, url: '/api/v1/operations/service-policy/audit' },
      {
        method: 'PATCH' as const,
        url: '/api/v1/operations/service-policy/capabilities/capability-dance-teaching',
        payload: { status: 'paused', reason: 'must not execute' },
      },
      {
        method: 'PATCH' as const,
        url: '/api/v1/operations/service-policy/templates/template-dance-private-lesson',
        payload: { status: 'paused', reason: 'must not execute' },
      },
      {
        method: 'POST' as const,
        url: '/api/v1/operations/service-policy/releases',
        payload: { version: 'v1', reason: 'must not execute' },
      },
    ];
    const before = await server.inject({
      method: 'GET',
      url: '/api/v1/creator/service-catalog',
      headers: { authorization: 'Bearer test-creator-token' },
    });
    for (const route of routes) {
      for (const authorization of ['Bearer test-operations-token', 'Bearer invalid-token']) {
        const response = await server.inject({
          ...route,
          headers: { authorization },
        });
        expect(response.statusCode, response.body).toBe(410);
        expect(response.json()).toMatchObject({
          error: { code: 'legacy_catalog_operations_route_retired' },
        });
      }
      const forged = await server.inject({
        ...route,
        headers: {
          'x-principal-id': 'forged',
          'x-permissions': 'catalog:policy:activate',
        },
      });
      expect(forged.statusCode, forged.body).toBe(410);
    }
    const after = await server.inject({
      method: 'GET',
      url: '/api/v1/creator/service-catalog',
      headers: { authorization: 'Bearer test-creator-token' },
    });
    expect(after.json()).toEqual(before.json());
  });
});
