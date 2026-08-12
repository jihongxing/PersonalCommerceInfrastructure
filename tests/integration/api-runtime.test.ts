import Fastify from 'fastify';
import { Type } from 'typebox';
import { describe, expect, it } from 'vitest';

import { ApplicationError } from '../../applications/core/application-error.js';
import { createApiServer } from '../../apps/api/src/create-api-server.js';
import { registerApiErrorHandling } from '../../adapters/transport/http/api-error-handler.js';

describe('API runtime skeleton', () => {
  it('serves versioned health and readiness contracts', async () => {
    const server = await createApiServer({
      corsAllowedOrigins: ['http://127.0.0.1:43125'],
    });

    const health = await server.inject({
      method: 'GET',
      url: '/api/v1/health',
    });
    const readiness = await server.inject({
      method: 'GET',
      url: '/api/v1/readiness',
    });

    expect(health.statusCode).toBe(200);
    expect(health.headers['x-correlation-id']).toBeTypeOf('string');
    expect(health.json()).toEqual({
      service: 'vs-01-api',
      status: 'ok',
      version: 'v1',
    });
    expect(readiness.statusCode).toBe(200);
    expect(readiness.json()).toEqual({
      service: 'vs-01-api',
      status: 'ready',
      version: 'v1',
    });

    await server.close();
  });

  it('serves the cross-client CORS preflight contract', async () => {
    const server = await createApiServer({
      corsAllowedOrigins: ['http://127.0.0.1:43125'],
    });

    const response = await server.inject({
      method: 'OPTIONS',
      url: '/api/v1/creator/identity',
      headers: {
        origin: 'http://127.0.0.1:43125',
        'access-control-request-method': 'POST',
        'access-control-request-headers': 'authorization, content-type',
      },
    });

    expect(response.statusCode).toBe(204);
    expect(response.headers['access-control-allow-origin']).toBe('http://127.0.0.1:43125');
    expect(response.headers['access-control-allow-methods']).toContain('POST');

    await server.close();
  });

  it('generates OpenAPI for system, M2–M6 Creator and public routes', async () => {
    const server = await createApiServer();
    await server.ready();

    const openApi = server.swagger();

    expect(openApi.info).toMatchObject({
      title: 'Personal Commerce Infrastructure API',
      version: '0.1.0',
    });
    expect(Object.keys(openApi.paths ?? {})).toEqual([
      '/api/v1/health',
      '/api/v1/readiness',
      '/api/v1/creator/identity',
      '/api/v1/creator/identity/capabilities',
      '/api/v1/creator/offerings',
      '/api/v1/creator/offerings/{offeringId}',
      '/api/v1/creator/offerings/{offeringId}/publish',
      '/api/v1/creator/offerings/{offeringId}/unpublish',
      '/api/v1/creator/offerings/{offeringId}/distribution',
      '/api/v1/public/offerings/{offeringId}',
      '/api/v1/public/offerings/{offeringId}/requests',
      '/api/v1/public/requests/{resultAccessToken}',
      '/api/v1/creator/requests',
      '/api/v1/creator/requests/{actionId}/confirm',
      '/api/v1/creator/requests/{actionId}/decline',
      '/openapi.json',
    ]);
    expect(JSON.stringify(openApi)).toContain('creator-identity');
    expect(JSON.stringify(openApi)).toContain('service-offering');
    expect(JSON.stringify(openApi)).not.toContain('payment');

    await server.close();
  });

  it('serves the generated OpenAPI document as JSON', async () => {
    const server = await createApiServer();

    const response = await server.inject({
      method: 'GET',
      url: '/openapi.json',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      info: {
        title: 'Personal Commerce Infrastructure API',
        version: '0.1.0',
      },
      openapi: '3.0.3',
    });

    await server.close();
  });

  it('maps application errors to the stable error envelope', async () => {
    const server = Fastify();
    registerApiErrorHandling(server);
    server.get('/test-error', () => {
      throw new ApplicationError({
        category: 'conflict',
        code: 'invalid_state_transition',
        message: 'The requested state transition is not allowed.',
      });
    });

    const response = await server.inject({
      method: 'GET',
      url: '/test-error',
    });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toEqual({
      error: {
        category: 'conflict',
        code: 'invalid_state_transition',
        correlationId: response.headers['x-correlation-id'],
        message: 'The requested state transition is not allowed.',
      },
    });

    await server.close();
  });

  it('maps transport validation failures without leaking framework details', async () => {
    const server = Fastify();
    registerApiErrorHandling(server);
    server.post(
      '/validated',
      {
        schema: {
          body: Type.Object({
            name: Type.String({ minLength: 1 }),
          }),
        },
      },
      () => ({ accepted: true }),
    );

    const response = await server.inject({
      method: 'POST',
      payload: {},
      url: '/validated',
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      error: {
        category: 'validation',
        code: 'request_validation_failed',
        correlationId: response.headers['x-correlation-id'],
        message: 'Request validation failed.',
      },
    });
    expect(response.body).not.toContain('validationContext');

    await server.close();
  });

  it('returns a governed error for unknown routes', async () => {
    const server = await createApiServer();

    const response = await server.inject({
      method: 'GET',
      url: '/unknown',
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({
      error: {
        category: 'not_found',
        code: 'route_not_found',
        correlationId: response.headers['x-correlation-id'],
        message: 'Route not found.',
      },
    });

    await server.close();
  });

  it('can bind an independent API runtime socket', async () => {
    const server = await createApiServer();
    const address = await server.listen({
      host: '127.0.0.1',
      port: 0,
    });

    expect(address).toMatch(/^http:\/\/127\.0\.0\.1:\d+$/u);

    await server.close();
  });
});
