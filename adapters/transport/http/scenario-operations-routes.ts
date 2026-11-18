import type { FastifyInstance, FastifyRequest } from 'fastify';
import { ApplicationError } from '../../../applications/core/application-error.js';
import type { OperationsAuthContextProvider } from '../../../applications/core/ports/operations-auth-context-provider.js';
import type { ScenarioOperationsService } from '../../../applications/operations-admin/scenario-operations.js';
import {
  ScenarioOperationsChangeSchema,
  ScenarioOperationsResponseSchema,
  ScenarioRevisionSchema,
  type ScenarioOperationsChange,
} from '../../../contracts/api/v1/scenario-operations-contracts.js';
import { ApiErrorEnvelopeSchema } from '../../../contracts/api/v1/system-contracts.js';
import { extractBearerToken } from '../../auth/transport/bearer-token.js';
import { authenticationError } from './operations-human-authentication-routes.js';

export function registerScenarioOperationsRoutes(
  server: FastifyInstance,
  service: ScenarioOperationsService,
  auth: OperationsAuthContextProvider | undefined,
) {
  const path = '/api/v1/operations/admin/scenarios';
  const errors = {
    400: ApiErrorEnvelopeSchema,
    401: ApiErrorEnvelopeSchema,
    403: ApiErrorEnvelopeSchema,
    409: ApiErrorEnvelopeSchema,
    422: ApiErrorEnvelopeSchema,
  };
  const resolveActor = async (request: FastifyRequest) => {
    if (auth === undefined) {
      throw new ApplicationError({
        category: 'unavailable',
        code: 'operations_human_runtime_unavailable',
        message: 'Operations Human authentication is unavailable.',
      });
    }
    try {
      return await auth.resolveActorContext({
        accessToken: extractBearerToken(request.headers.authorization),
        correlationId: request.id,
      });
    } catch (error) {
      throw authenticationError(error);
    }
  };

  server.get(
    path,
    {
      schema: {
        operationId: 'listOperationsScenarios',
        response: { 200: ScenarioOperationsResponseSchema, ...errors },
      },
    },
    async (request, reply) => {
      reply.header('cache-control', 'no-store');
      return service.list(await resolveActor(request));
    },
  );

  server.patch<{ Body: ScenarioOperationsChange }>(
    path,
    {
      schema: {
        operationId: 'changeOperationsScenarioIntake',
        body: ScenarioOperationsChangeSchema,
        response: { 200: ScenarioRevisionSchema, ...errors },
      },
    },
    async (request, reply) => {
      reply.header('cache-control', 'no-store');
      return service.change(request.body, await resolveActor(request));
    },
  );
}
