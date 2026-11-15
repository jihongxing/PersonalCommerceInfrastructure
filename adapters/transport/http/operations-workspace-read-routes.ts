import type { FastifyInstance, FastifyRequest } from 'fastify';
import { Type } from 'typebox';
import type { ActorContext } from '../../../applications/core/actor-context.js';
import { ApplicationError } from '../../../applications/core/application-error.js';
import type { OperationsAuthContextProvider } from '../../../applications/core/ports/operations-auth-context-provider.js';
import type { OperationsWorkspaceReadService } from '../../../applications/operations-admin/operations-workspace-read-service.js';
import type { ReadModule } from '../../../applications/operations-admin/operations-query-repository.js';
import {
  exceptionRules,
  type ExceptionRuleId,
} from '../../../applications/operations-admin/operations-exceptions.js';
import {
  OperationsOverviewResponseSchema,
  OperationsExceptionsResponseSchema,
  OperationsSearchResponseSchema,
} from '../../../contracts/api/v1/operations-workspace-contracts.js';
import { ApiErrorEnvelopeSchema } from '../../../contracts/api/v1/system-contracts.js';
import { extractBearerToken } from '../../auth/transport/bearer-token.js';

interface AuthenticatedRequest extends FastifyRequest {
  operationsContext?: ActorContext;
}
export function registerOperationsWorkspaceReadRoutes(
  server: FastifyInstance,
  dependencies: {
    readonly service?: OperationsWorkspaceReadService;
    readonly auth?: OperationsAuthContextProvider;
  },
) {
  server.addHook('onSend', async (request, reply) => {
    if (/^\/api\/v1\/operations\/admin\/(overview|search|exceptions)([/?]|$)/u.test(request.url))
      reply.header('cache-control', 'no-store');
  });
  const authenticate = async (request: AuthenticatedRequest) => {
    if (!dependencies.auth) unavailable();
    request.operationsContext = await dependencies.auth.resolveActorContext({
      accessToken: extractBearerToken(request.headers.authorization),
      correlationId: request.id,
    });
  };
  for (const resource of ['overview', 'search'] as const) {
    server.get(
      `/api/v1/operations/admin/${resource}`,
      {
        schema: {
          operationId:
            resource === 'overview' ? 'getOperationsOverview' : 'searchOperationsWorkspace',
          ...(resource === 'search'
            ? {
                querystring: Type.Object(
                  {
                    q: Type.String({ minLength: 1, maxLength: 160 }),
                    page: Type.Optional(Type.String({ pattern: '^[1-9][0-9]{0,4}$' })),
                    pageSize: Type.Optional(Type.String({ pattern: '^[1-9][0-9]{0,2}$' })),
                    module: Type.Optional(
                      Type.Union(
                        ['all', 'catalog', 'offering', 'request', 'audit'].map((value) =>
                          Type.Literal(value),
                        ),
                      ),
                    ),
                  },
                  { additionalProperties: false },
                ),
              }
            : {}),
          response: {
            200:
              resource === 'overview'
                ? OperationsOverviewResponseSchema
                : OperationsSearchResponseSchema,
            401: ApiErrorEnvelopeSchema,
            403: ApiErrorEnvelopeSchema,
          },
          tags: ['operations-admin-read'],
        },
        preHandler: authenticate,
      },
      async (request, reply) => {
        reply.header('cache-control', 'no-store');
        if (!dependencies.service) unavailable();
        const context = (request as AuthenticatedRequest).operationsContext!;
        if (resource === 'overview') return dependencies.service.overview(context);
        const query = request.query as {
          q: string;
          page?: string;
          pageSize?: string;
          module?: ReadModule | 'all';
        };
        const page = Number(query.page ?? 1),
          pageSize = Number(query.pageSize ?? 20);
        if (page > 10000 || pageSize > 100 || !query.q.trim())
          throw new ApplicationError({
            category: 'validation',
            code: 'invalid_search',
            message: 'Search parameters are invalid.',
          });
        return dependencies.service.search(context, {
          query: query.q.trim(),
          page,
          pageSize,
          ...(query.module && query.module !== 'all' ? { module: query.module } : {}),
        });
      },
    );
  }
  server.get(
    '/api/v1/operations/admin/exceptions',
    {
      schema: {
        operationId: 'listOperationsExceptions',
        querystring: Type.Object(
          {
            page: Type.Optional(Type.String({ pattern: '^[1-9][0-9]{0,4}$' })),
            pageSize: Type.Optional(Type.String({ pattern: '^[1-9][0-9]{0,2}$' })),
            ruleId: Type.Optional(Type.Union(exceptionRules.map((rule) => Type.Literal(rule.id)))),
            classification: Type.Optional(
              Type.Union([Type.Literal('confirmed_fact'), Type.Literal('needs_review')]),
            ),
            source: Type.Optional(
              Type.Union(['offering', 'request', 'audit'].map((value) => Type.Literal(value))),
            ),
          },
          { additionalProperties: false },
        ),
        response: {
          200: OperationsExceptionsResponseSchema,
          401: ApiErrorEnvelopeSchema,
          403: ApiErrorEnvelopeSchema,
        },
        tags: ['operations-admin-read'],
      },
      preHandler: authenticate,
    },
    async (request) => {
      if (!dependencies.service) unavailable();
      const query = request.query as {
        page?: string;
        pageSize?: string;
        ruleId?: ExceptionRuleId;
        classification?: 'confirmed_fact' | 'needs_review';
        source?: 'offering' | 'request' | 'audit';
      };
      const page = Number(query.page ?? 1);
      const pageSize = Number(query.pageSize ?? 20);
      if (!Number.isInteger(page) || page < 1 || page > 10000)
        throw new ApplicationError({
          category: 'validation',
          code: 'invalid_pagination',
          message: 'Pagination is invalid.',
        });
      if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100)
        throw new ApplicationError({
          category: 'validation',
          code: 'invalid_pagination',
          message: 'Pagination is invalid.',
        });
      return dependencies.service.exceptions((request as AuthenticatedRequest).operationsContext!, {
        page,
        pageSize,
        ...(query.ruleId === undefined ? {} : { ruleId: query.ruleId }),
        ...(query.classification === undefined ? {} : { classification: query.classification }),
        ...(query.source === undefined ? {} : { source: query.source }),
      });
    },
  );
}
function unavailable(): never {
  throw new ApplicationError({
    category: 'unavailable',
    code: 'operations_query_unavailable',
    message: 'Operations queries are temporarily unavailable.',
  });
}
