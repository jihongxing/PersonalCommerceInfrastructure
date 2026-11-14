import type { FastifyInstance, FastifyRequest } from 'fastify';
import { Type } from 'typebox';
import type { OperationsAuthContextProvider } from '../../../applications/core/ports/operations-auth-context-provider.js';
import { ApplicationError } from '../../../applications/core/application-error.js';
import { requireOperationsHumanPermission } from '../../../applications/operations-identity/operations-human-authentication.js';
import type {
  OperationsOfferingState,
  OperationsRequestState,
} from '../../../applications/operations-admin/operations-flow-read-service.js';
import type { createOperationsFlowReadService } from '../../../applications/operations-admin/operations-flow-read-service.js';
import { extractBearerToken } from '../../auth/transport/bearer-token.js';
import { ApiErrorEnvelopeSchema } from '../../../contracts/api/v1/system-contracts.js';
import {
  OperationsOfferingDetailResponseSchema,
  OperationsOfferingListResponseSchema,
  OperationsRequestDetailResponseSchema,
  OperationsRequestListResponseSchema,
} from '../../../contracts/api/v1/operations-flow-contracts.js';

type OperationsFlowReadService = ReturnType<typeof createOperationsFlowReadService>;
interface AuthenticatedRequest extends FastifyRequest {
  operationsContext?: Parameters<typeof requireOperationsHumanPermission>[0];
}

export function registerOperationsFlowReadRoutes(
  server: FastifyInstance,
  dependencies: {
    readonly service: OperationsFlowReadService;
    readonly humanOperationsAuthContextProvider?: OperationsAuthContextProvider;
  },
): void {
  server.addHook('onSend', async (request, reply) => {
    if (/^\/api\/v1\/operations\/admin\/(offerings|requests)([/?]|$)/u.test(request.url))
      reply.header('cache-control', 'no-store');
  });
  const authenticate = async (request: AuthenticatedRequest): Promise<void> => {
    if (dependencies.humanOperationsAuthContextProvider === undefined)
      throw new ApplicationError({
        category: 'unavailable',
        code: 'operations_human_runtime_unavailable',
        message: 'Operations Human authentication is temporarily unavailable.',
      });
    request.operationsContext =
      await dependencies.humanOperationsAuthContextProvider.resolveActorContext({
        accessToken: extractBearerToken(request.headers.authorization),
        correlationId: request.id,
      });
  };
  const permission = (request: AuthenticatedRequest, value: 'offering:read' | 'request:read') => {
    if (request.operationsContext === undefined)
      throw new ApplicationError({
        category: 'authentication',
        code: 'missing_operations_auth_context',
        message: 'Authenticated operations request requires an Actor Context.',
      });
    requireOperationsHumanPermission(request.operationsContext, value);
  };
  const page = (value: string | undefined, fallback: number, max: number) => {
    const parsed = value === undefined ? fallback : Number(value);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > max)
      throw new ApplicationError({
        category: 'validation',
        code: 'invalid_pagination',
        message: 'Pagination is invalid.',
      });
    return parsed;
  };
  const query = Type.Object({
    page: Type.Optional(Type.String()),
    pageSize: Type.Optional(Type.String()),
    q: Type.Optional(Type.String()),
    state: Type.Optional(Type.String()),
  });
  const params = Type.Object({ id: Type.String({ minLength: 1 }) });
  server.get(
    '/api/v1/operations/admin/offerings',
    {
      schema: {
        operationId: 'listOperationsAdminOfferings',
        querystring: query,
        response: {
          200: OperationsOfferingListResponseSchema,
          401: ApiErrorEnvelopeSchema,
          403: ApiErrorEnvelopeSchema,
        },
        tags: ['operations-admin-read'],
      },
      preHandler: authenticate,
    },
    async (request) => {
      permission(request, 'offering:read');
      const input = request.query as Record<string, string | undefined>;
      const state = input.state as OperationsOfferingState | undefined;
      if (state !== undefined && !['draft', 'published', 'unpublished', 'archived'].includes(state))
        invalidState();
      return dependencies.service.listOfferings({
        page: page(input.page, 1, 10_000),
        pageSize: page(input.pageSize, 20, 100),
        ...(input.q === undefined ? {} : { query: input.q }),
        ...(state === undefined ? {} : { state }),
      });
    },
  );
  server.get(
    '/api/v1/operations/admin/offerings/:id',
    {
      schema: {
        operationId: 'getOperationsAdminOffering',
        params,
        response: {
          200: OperationsOfferingDetailResponseSchema,
          401: ApiErrorEnvelopeSchema,
          403: ApiErrorEnvelopeSchema,
          404: ApiErrorEnvelopeSchema,
        },
        tags: ['operations-admin-read'],
      },
      preHandler: authenticate,
    },
    async (request) => {
      permission(request, 'offering:read');
      return dependencies.service.getOffering((request.params as { id: string }).id);
    },
  );
  server.get(
    '/api/v1/operations/admin/requests',
    {
      schema: {
        operationId: 'listOperationsAdminRequests',
        querystring: query,
        response: {
          200: OperationsRequestListResponseSchema,
          401: ApiErrorEnvelopeSchema,
          403: ApiErrorEnvelopeSchema,
        },
        tags: ['operations-admin-read'],
      },
      preHandler: authenticate,
    },
    async (request) => {
      permission(request, 'request:read');
      const input = request.query as Record<string, string | undefined>;
      const state = input.state as OperationsRequestState | undefined;
      if (state !== undefined && !['draft', 'submitted', 'confirmed', 'declined'].includes(state))
        invalidState();
      return dependencies.service.listRequests({
        page: page(input.page, 1, 10_000),
        pageSize: page(input.pageSize, 20, 100),
        ...(input.q === undefined ? {} : { query: input.q }),
        ...(state === undefined ? {} : { state }),
      });
    },
  );
  server.get(
    '/api/v1/operations/admin/requests/:id',
    {
      schema: {
        operationId: 'getOperationsAdminRequest',
        params,
        response: {
          200: OperationsRequestDetailResponseSchema,
          401: ApiErrorEnvelopeSchema,
          403: ApiErrorEnvelopeSchema,
          404: ApiErrorEnvelopeSchema,
        },
        tags: ['operations-admin-read'],
      },
      preHandler: authenticate,
    },
    async (request) => {
      permission(request, 'request:read');
      return dependencies.service.getRequest((request.params as { id: string }).id);
    },
  );
}

function invalidState(): never {
  throw new ApplicationError({
    category: 'validation',
    code: 'invalid_read_filter',
    message: 'Invalid state filter.',
  });
}
