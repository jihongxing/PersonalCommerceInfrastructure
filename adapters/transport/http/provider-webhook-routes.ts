import type { FastifyInstance } from 'fastify';
import { Type } from 'typebox';

import { createActorContext } from '../../../applications/core/actor-context.js';
import type { ProviderWebhookRuntime } from '../../../applications/paid-commerce/provider-webhook-runtime.js';
import { ApiErrorEnvelopeSchema } from '../../../contracts/api/v1/system-contracts.js';

export function registerProviderWebhookRoutes(
  server: FastifyInstance,
  dependencies: { readonly runtime: ProviderWebhookRuntime },
): void {
  server.addContentTypeParser(
    'application/provider-webhook+json',
    { parseAs: 'buffer' },
    (_request, body, done) => {
      done(null, body);
    },
  );

  server.post(
    '/api/v1/providers/:providerId/webhooks/:providerEventId',
    {
      schema: {
        operationId: 'receiveProviderWebhook',
        params: Type.Object({
          providerId: Type.String({ minLength: 1 }),
          providerEventId: Type.String({ minLength: 1 }),
        }),
        consumes: ['application/provider-webhook+json'],
        response: {
          200: Type.Object({
            status: Type.Union([Type.Literal('accepted'), Type.Literal('idempotent')]),
            transitioned: Type.Boolean(),
          }),
          401: ApiErrorEnvelopeSchema,
          409: ApiErrorEnvelopeSchema,
          422: ApiErrorEnvelopeSchema,
        },
        tags: ['provider-webhook'],
      },
    },
    async (request) => {
      const { providerId, providerEventId } = request.params as {
        readonly providerId: string;
        readonly providerEventId: string;
      };
      const payload = request.body;
      if (!Buffer.isBuffer(payload)) {
        throw new Error('Provider webhook payload must preserve raw bytes.');
      }

      return dependencies.runtime.process(
        {
          providerId,
          providerEventId,
          headers: Object.fromEntries(
            Object.entries(request.headers).map(([name, value]) => [
              name,
              Array.isArray(value) ? value.join(',') : value,
            ]),
          ),
          payload,
          receivedAt: new Date().toISOString(),
        },
        createActorContext({
          actor: { kind: 'pilot_operations', operatorId: `provider-webhook:${providerId}` },
          correlationId: request.id,
        }),
      );
    },
  );
}
