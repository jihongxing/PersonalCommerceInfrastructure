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
    expect(response.json()).toMatchObject({
      policyVersion: 'v1',
      capabilities: expect.arrayContaining([
        expect.objectContaining({ id: 'capability-dance-teaching' }),
      ]),
      templates: expect.arrayContaining([
        expect.objectContaining({ id: 'template-dance-private-lesson' }),
      ]),
    });
  });

  it('protects Operations lifecycle controls and records audit evidence', async () => {
    const unauthorized = await server.inject({
      method: 'GET',
      url: '/api/v1/operations/service-policy/workspace',
      headers: { authorization: 'Bearer test-creator-token' },
    });
    expect(unauthorized.statusCode).toBe(401);

    const paused = await server.inject({
      method: 'PATCH',
      url: '/api/v1/operations/service-policy/capabilities/capability-dance-teaching',
      headers: { authorization: 'Bearer test-operations-token' },
      payload: { status: 'paused', reason: 'Emergency review' },
    });
    expect(paused.statusCode).toBe(200);
    expect(paused.json()).toMatchObject({ status: 'paused' });

    const catalog = await server.inject({
      method: 'GET',
      url: '/api/v1/creator/service-catalog',
      headers: { authorization: 'Bearer test-creator-token' },
    });
    expect(catalog.json().capabilities).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'capability-dance-teaching', status: 'paused' }),
      ]),
    );

    const audit = await server.inject({
      method: 'GET',
      url: '/api/v1/operations/service-policy/audit',
      headers: { authorization: 'Bearer test-operations-token' },
    });
    expect(audit.statusCode).toBe(200);
    expect(audit.json()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          entityId: 'capability-dance-teaching',
          reason: 'Emergency review',
        }),
      ]),
    );

    const published = await server.inject({
      method: 'POST',
      url: '/api/v1/operations/service-policy/releases',
      headers: { authorization: 'Bearer test-operations-token' },
      payload: { version: 'v1', reason: 'Confirm current policy' },
    });
    expect(published.statusCode).toBe(204);
  });
});
