import type { FastifyInstance, FastifyRequest } from 'fastify';
import { Type } from 'typebox';

import { extractBearerToken } from '../../auth/transport/bearer-token.js';
import type { ActorContext } from '../../../applications/core/actor-context.js';
import { ApplicationError } from '../../../applications/core/application-error.js';
import type { OperationsAuthContextProvider } from '../../../applications/core/ports/operations-auth-context-provider.js';
import type { CommercialPilotOperationsService } from '../../../applications/paid-commerce/commercial-pilot-operations.js';
import {
  CommercialPilotOperationsEvidenceSchema,
  CommercialPilotOperationsWorkspaceSchema,
  OperationsActionResponseSchema,
  OperationsReasonSchema,
  OperationsResolutionSchema,
} from '../../../contracts/api/v1/commercial-pilot-operations-contracts.js';
import { ApiErrorEnvelopeSchema } from '../../../contracts/api/v1/system-contracts.js';

interface AuthenticatedOperationsRequest extends FastifyRequest {
  operationsContext?: ActorContext;
}

export function registerCommercialPilotOperationsRoutes(
  server: FastifyInstance,
  dependencies: {
    readonly authContextProvider: OperationsAuthContextProvider;
    readonly service: CommercialPilotOperationsService;
  },
): void {
  const authenticate = async (request: AuthenticatedOperationsRequest): Promise<void> => {
    request.operationsContext = await dependencies.authContextProvider.resolveActorContext({
      accessToken: extractBearerToken(request.headers.authorization),
      correlationId: request.id,
    });
  };

  const requireContext = (request: AuthenticatedOperationsRequest): ActorContext => {
    if (request.operationsContext === undefined) {
      throw new ApplicationError({
        category: 'authentication',
        code: 'missing_operations_auth_context',
        message: 'Authenticated operations request requires an Actor Context.',
      });
    }
    return request.operationsContext;
  };

  server.get(
    '/api/v1/operations/commercial-pilot/workspace',
    {
      schema: {
        operationId: 'getCommercialPilotOperationsWorkspace',
        response: {
          200: CommercialPilotOperationsWorkspaceSchema,
          401: ApiErrorEnvelopeSchema,
          403: ApiErrorEnvelopeSchema,
        },
        tags: ['commercial-pilot-operations'],
      },
      preHandler: authenticate,
    },
    async (request) => dependencies.service.getWorkspace(requireContext(request)),
  );

  server.get(
    '/api/v1/operations/commercial-pilot/orders/:orderId/evidence',
    {
      schema: {
        operationId: 'exportCommercialPilotEvidence',
        params: Type.Object({ orderId: Type.String({ minLength: 1 }) }),
        response: {
          200: CommercialPilotOperationsEvidenceSchema,
          401: ApiErrorEnvelopeSchema,
          403: ApiErrorEnvelopeSchema,
          404: ApiErrorEnvelopeSchema,
        },
        tags: ['commercial-pilot-operations'],
      },
      preHandler: authenticate,
    },
    async (request) => {
      const { orderId } = request.params as { readonly orderId: string };
      return dependencies.service.exportEvidence(orderId, requireContext(request));
    },
  );

  server.post(
    '/api/v1/operations/commercial-pilot/orders/:orderId/retry-settlement',
    {
      schema: {
        operationId: 'retryCommercialPilotSettlement',
        params: Type.Object({ orderId: Type.String({ minLength: 1 }) }),
        body: OperationsReasonSchema,
        response: {
          200: OperationsActionResponseSchema,
          400: ApiErrorEnvelopeSchema,
          401: ApiErrorEnvelopeSchema,
          403: ApiErrorEnvelopeSchema,
          409: ApiErrorEnvelopeSchema,
        },
        tags: ['commercial-pilot-operations'],
      },
      preHandler: authenticate,
    },
    async (request) => {
      const { orderId } = request.params as { readonly orderId: string };
      const { reason } = request.body as { readonly reason: string };
      await dependencies.service.retrySettlement(orderId, reason, requireContext(request));
      return { status: 'recorded' as const };
    },
  );

  server.post(
    '/api/v1/operations/commercial-pilot/withdrawals/:withdrawalId/retry',
    {
      schema: {
        operationId: 'retryCommercialPilotWithdrawal',
        params: Type.Object({ withdrawalId: Type.String({ minLength: 1 }) }),
        body: OperationsReasonSchema,
        response: {
          200: OperationsActionResponseSchema,
          400: ApiErrorEnvelopeSchema,
          401: ApiErrorEnvelopeSchema,
          403: ApiErrorEnvelopeSchema,
          409: ApiErrorEnvelopeSchema,
        },
        tags: ['commercial-pilot-operations'],
      },
      preHandler: authenticate,
    },
    async (request) => {
      const { withdrawalId } = request.params as { readonly withdrawalId: string };
      const { reason } = request.body as { readonly reason: string };
      await dependencies.service.retryWithdrawal(withdrawalId, reason, requireContext(request));
      return { status: 'recorded' as const };
    },
  );

  server.post(
    '/api/v1/operations/commercial-pilot/resolutions',
    {
      schema: {
        operationId: 'recordCommercialPilotResolution',
        body: OperationsResolutionSchema,
        response: {
          200: OperationsActionResponseSchema,
          400: ApiErrorEnvelopeSchema,
          401: ApiErrorEnvelopeSchema,
          403: ApiErrorEnvelopeSchema,
          404: ApiErrorEnvelopeSchema,
        },
        tags: ['commercial-pilot-operations'],
      },
      preHandler: authenticate,
    },
    async (request) => {
      await dependencies.service.recordResolution(
        request.body as {
          readonly action: 'reconciliation' | 'manual_resolution' | 'recovery_resolution';
          readonly targetType: 'order' | 'settlement' | 'withdrawal' | 'recovery';
          readonly targetId: string;
          readonly reason: string;
        },
        requireContext(request),
      );
      return { status: 'recorded' as const };
    },
  );
}
