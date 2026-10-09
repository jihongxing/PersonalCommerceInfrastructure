import Fastify from 'fastify';
import { Type } from 'typebox';
import { describe, expect, it } from 'vitest';

import { ApplicationError } from '../../applications/core/application-error.js';
import { createInMemoryCreatorIdentityComposition } from '../../adapters/in-memory/creator-identity-composition.js';
import { createApiServer } from '../../apps/api/src/create-api-server.js';
import { createSafeLogger } from '../../adapters/observability/safe-logger.js';
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

  it('reports dependency readiness failures without failing liveness', async () => {
    const server = await createApiServer({
      checkReadiness: () => Promise.reject(new Error('database unavailable')),
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
    expect(readiness.statusCode).toBe(503);
    expect(readiness.json()).toEqual({
      service: 'vs-01-api',
      status: 'not_ready',
      version: 'v1',
    });

    await server.close();
  });

  it('writes correlated request lifecycle logs without credentials', async () => {
    const messages: string[] = [];
    const server = await createApiServer({
      logger: createSafeLogger('info', (message) => {
        messages.push(message);
      }),
    });

    const response = await server.inject({
      headers: {
        authorization: 'Bearer secret-token',
      },
      method: 'GET',
      url: '/api/v1/health',
    });

    expect(response.statusCode).toBe(200);
    expect(messages.some((message) => message.includes('api_request_started'))).toBe(true);
    expect(messages.some((message) => message.includes('api_request_completed'))).toBe(true);
    expect(messages.join('\n')).toContain(response.headers['x-correlation-id']);
    expect(messages.join('\n')).not.toContain('secret-token');

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

  it('generates OpenAPI for system, Creator, public, and approved Operations routes', async () => {
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
      '/api/v1/private/onboarding/initialize',
      '/api/v1/private/identity',
      '/api/v1/private/profiles',
      '/api/v1/private/profiles/{profileId}',
      '/api/v1/private/profiles/{profileId}/suspend',
      '/api/v1/private/profiles/{profileId}/archive',
      '/api/v1/private/profiles/{profileId}/reactivate',
      '/api/v1/private/profiles/{profileId}/reference',
      '/api/v1/private/external-platform-accounts',
      '/api/v1/private/external-platform-accounts/{externalPlatformAccountId}',
    '/api/v1/private/commerce-relationships',
    '/api/v1/private/commerce-relationships/{relationshipId}',
    '/api/v1/private/external-platform-relationships',
      '/api/v1/creator/offerings',
      '/api/v1/creator/offerings/{offeringId}',
      '/api/v1/creator/offerings/{offeringId}/publish',
      '/api/v1/creator/offerings/{offeringId}/unpublish',
      '/api/v1/creator/offerings/{offeringId}/distribution',
      '/api/v1/public/offerings/{offeringId}',
      '/api/v1/public/offerings/{offeringId}/requests',
      '/api/v1/public/requests/{resultAccessToken}',
      '/api/v1/creator/requests',
      '/api/v1/creator/confirmed-requests',
      '/api/v1/creator/requests/{actionId}/confirm',
      '/api/v1/creator/requests/{actionId}/decline',
      '/api/v1/operations/requests/{actionId}/external-payment',
      '/api/v1/operations/requests/{actionId}/fulfillment',
      '/api/v1/creator/paid-orders',
      '/api/v1/public/requests/{resultAccessToken}/paid-service-status',
      '/api/v1/creator/paid-orders/{orderId}/fulfillment',
      '/api/v1/creator/wallet',
      '/api/v1/creator/wallet/withdrawals',
      '/api/v1/operations/paid-orders/{orderId}/payment-confirmed',
      '/api/v1/operations/paid-orders/{orderId}/payment-failed',
      '/api/v1/operations/paid-orders/{orderId}/settlement-released',
      '/api/v1/operations/withdrawals/{withdrawalId}/completed',
      '/api/v1/public/offerings/{offeringId}/availability-slots',
      '/api/v1/creator/offerings/{offeringId}/availability-slots',
      '/api/v1/public/offerings/{offeringId}/reservation-holds',
      '/api/v1/public/reservations/{resultAccessToken}',
      '/api/v1/public/reservations/{resultAccessToken}/cancel',
      '/api/v1/creator/reservations',
      '/api/v1/creator/reservations/{reservationId}/confirm',
      '/api/v1/creator/reservations/{reservationId}/cancel',
      '/api/v1/creator/reservations/{reservationId}/reschedule',
      '/api/v1/creator/reservations/{reservationId}/no-show',
      '/api/v1/creator/contracts/proposals',
      '/api/v1/creator/contracts',
      '/api/v1/creator/contracts/{contractId}',
      '/api/v1/public/contracts/{resultAccessToken}',
      '/api/v1/public/contracts/{resultAccessToken}/scope',
      '/api/v1/public/contracts/{resultAccessToken}/order',
      '/api/v1/public/contracts/{resultAccessToken}/accept',
      '/api/v1/public/contracts/{resultAccessToken}/reject',
      '/api/v1/creator/contracts/{contractId}/expire',
      '/api/v1/creator/contracts/{contractId}/cancel',
      '/api/v1/public/contracts/{resultAccessToken}/cancel',
      '/api/v1/operations/simulation/scenario',
      '/api/v1/operations/simulation/paid-orders/{orderId}/payment',
      '/api/v1/operations/simulation/paid-orders/{orderId}/settlement',
      '/api/v1/operations/simulation/withdrawals/{withdrawalId}',
      '/api/v1/operations/simulation/advance',
      '/api/v1/operations/simulation/paid-orders/{orderId}/refund',
      '/api/v1/local-commerce/requests/{resultAccessToken}/checkout',
      '/api/v1/local-commerce/requests/{resultAccessToken}/payment',
      '/api/v1/local-commerce/requests/{resultAccessToken}/payment/advance',
      '/api/v1/creator/local-commerce/workspace',
      '/api/v1/creator/local-commerce/orders/{orderId}/settlement',
      '/api/v1/creator/local-commerce/orders/{orderId}/settlement/advance',
      '/api/v1/creator/local-commerce/withdrawals/{withdrawalId}/simulate',
      '/api/v1/creator/local-commerce/withdrawals/{withdrawalId}/advance',
      '/api/v1/creator/local-commerce/orders/{orderId}/refund',
      '/api/v1/providers/{providerId}/webhooks/{providerEventId}',
      '/api/v1/operations/commercial-pilot/workspace',
      '/api/v1/operations/commercial-pilot/orders/{orderId}/evidence',
      '/api/v1/operations/commercial-pilot/orders/{orderId}/retry-settlement',
      '/api/v1/operations/commercial-pilot/withdrawals/{withdrawalId}/retry',
      '/api/v1/operations/commercial-pilot/resolutions',
      '/openapi.json',
    ]);
    expect(JSON.stringify(openApi)).toContain('creator-identity');
    expect(JSON.stringify(openApi)).toContain('service-offering');
    expect(JSON.stringify(openApi)).toContain('contract-commerce');
    expect(JSON.stringify(openApi)).not.toContain('paymentCredential');
    expect(JSON.stringify(openApi)).not.toContain('providerSecret');
    expect(JSON.stringify(openApi)).not.toContain('providerApiKey');

    await server.close();
  });

  it('does not expose Local Commerce Simulation routes when an external composition is supplied', async () => {
    const composition = createInMemoryCreatorIdentityComposition();
    const server = await createApiServer({
      authContextProvider: composition.authContextProvider,
      creatorIdentityService: composition.service,
      serviceOfferingService: composition.offeringService,
      customerRequestService: composition.customerRequestService,
      operationsAuthContextProvider: composition.operationsAuthContextProvider,
      recordExternalObservation: composition.recordExternalObservation,
      paidCommerceService: composition.paidCommerceService,
      providerWebhookRuntime: composition.providerWebhookRuntime,
    });

    const response = await server.inject({
      method: 'POST',
      url: '/api/v1/operations/simulation/scenario',
      headers: { authorization: 'Bearer test-operations-token' },
      payload: { payment: 'success' },
    });

    expect(response.statusCode).toBe(404);
    const productResponse = await server.inject({
      method: 'GET',
      url: '/api/v1/local-commerce/requests/result-token/checkout',
    });
    expect(productResponse.statusCode).toBe(404);
    await server.close();
  });

  it('rejects Provider webhooks when signature verification is not configured', async () => {
    const server = await createApiServer();

    const response = await server.inject({
      method: 'POST',
      url: '/api/v1/providers/future-provider/webhooks/event-1',
      headers: {
        'content-type': 'application/provider-webhook+json',
      },
      payload: Buffer.from('{"provider":"payload"}'),
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({
      error: {
        category: 'authentication',
        code: 'provider_webhook_signature_rejected',
      },
    });

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
