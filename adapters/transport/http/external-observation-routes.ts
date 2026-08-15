import type { FastifyInstance, FastifyRequest } from 'fastify';
import { Type } from 'typebox';

import { extractBearerToken } from '../../auth/transport/bearer-token.js';
import type { ActorContext } from '../../../applications/core/actor-context.js';
import { ApplicationError } from '../../../applications/core/application-error.js';
import type { OperationsAuthContextProvider } from '../../../applications/core/ports/operations-auth-context-provider.js';
import type {
  ExternalObservationType,
  RecordExternalObservationCommand,
  RecordExternalObservationUseCase,
} from '../../../applications/shadow-commerce/external-observation-use-cases.js';
import {
  ExternalObservationResponseSchema,
  RecordExternalObservationSchema,
} from '../../../contracts/api/v1/external-observation-contracts.js';
import { ApiErrorEnvelopeSchema } from '../../../contracts/api/v1/system-contracts.js';

interface AuthenticatedOperationsRequest extends FastifyRequest {
  operationsContext?: ActorContext;
}

export function registerExternalObservationRoutes(
  server: FastifyInstance,
  dependencies: {
    readonly authContextProvider: OperationsAuthContextProvider;
    readonly recordObservation: RecordExternalObservationUseCase;
  },
): void {
  const authenticate = async (request: AuthenticatedOperationsRequest): Promise<void> => {
    request.operationsContext = await dependencies.authContextProvider.resolveActorContext({
      accessToken: extractBearerToken(request.headers.authorization),
      correlationId: request.id,
    });
  };

  function requireContext(request: AuthenticatedOperationsRequest): ActorContext {
    if (request.operationsContext === undefined) {
      throw new ApplicationError({
        category: 'authentication',
        code: 'missing_operations_auth_context',
        message: 'Authenticated operations request requires an Actor Context.',
      });
    }
    return request.operationsContext;
  }

  const register = (path: string, operationId: string, type: ExternalObservationType): void => {
    server.post(
      path,
      {
        schema: {
          operationId,
          params: Type.Object({ actionId: Type.String({ minLength: 1 }) }),
          body: RecordExternalObservationSchema,
          response: {
            200: ExternalObservationResponseSchema,
            400: ApiErrorEnvelopeSchema,
            401: ApiErrorEnvelopeSchema,
            403: ApiErrorEnvelopeSchema,
            404: ApiErrorEnvelopeSchema,
            409: ApiErrorEnvelopeSchema,
          },
          tags: ['external-observation'],
        },
        preHandler: authenticate,
      },
      async (request) => {
        const { actionId } = request.params as { readonly actionId: string };
        const command = request.body as Omit<RecordExternalObservationCommand, 'actionId' | 'type'>;
        const event = await dependencies.recordObservation.execute(
          { actionId, type, ...command },
          requireContext(request),
        );

        return {
          actionId,
          type,
          evidenceReference: String(event.payload.evidenceReference),
          occurredAt: String(event.payload.occurredAt),
          recordedBy: event.actorId,
        };
      },
    );
  };

  register(
    '/api/v1/operations/requests/:actionId/external-payment',
    'recordExternalPaymentFact',
    'external_paid_verified',
  );
  register(
    '/api/v1/operations/requests/:actionId/fulfillment',
    'recordFulfillmentFact',
    'fulfillment_observed',
  );
}
