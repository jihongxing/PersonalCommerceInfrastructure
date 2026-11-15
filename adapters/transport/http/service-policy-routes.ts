import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { Type } from 'typebox';
import type { CatalogQueryRepository } from '../../../applications/operations-admin/operations-query-repository.js';

import { extractBearerToken } from '../../auth/transport/bearer-token.js';
import { ApplicationError } from '../../../applications/core/application-error.js';
import type { ActorContext } from '../../../applications/core/actor-context.js';
import type { AuthContextProvider } from '../../../applications/core/ports/auth-context-provider.js';
import type { OperationsAuthContextProvider } from '../../../applications/core/ports/operations-auth-context-provider.js';
import type { ServicePolicyAdminService } from '../../../applications/service-policy/service-policy-admin-service.js';
import type { ServicePolicyCatalogRepository } from '../../../applications/service-policy/service-policy-repositories.js';
import {
  createServicePolicyReadService,
  type AuditReadFilters,
  type CatalogReadFilters,
  type CatalogReadKind,
} from '../../../applications/service-policy/service-policy-read-service.js';
import { requireOperationsHumanPermission } from '../../../applications/operations-identity/operations-human-authentication.js';
import {
  ServiceCatalogResponseSchema,
  ServicePolicyDraftCreateSchema,
  ServicePolicyDraftUpdateSchema,
  ServicePolicyDraftActivateSchema,
  ServicePolicyDraftSchema,
  ServicePolicyValidationResultSchema,
  ServicePolicyPreviewResultSchema,
  OperationsAuditDetailResponseSchema,
  OperationsAuditReadResponseSchema,
  OperationsCatalogDetailResponseSchema,
  OperationsCatalogReadResponseSchema,
} from '../../../contracts/api/v1/service-policy-contracts.js';
import { ApiErrorEnvelopeSchema } from '../../../contracts/api/v1/system-contracts.js';

interface AuthenticatedRequest extends FastifyRequest {
  authContext?: ActorContext;
  operationsContext?: ActorContext;
}

const IdParamsSchema = Type.Object({ id: Type.String({ minLength: 1 }) });
const CatalogKindParamsSchema = Type.Object({
  kind: Type.Union([Type.Literal('capabilities'), Type.Literal('templates')]),
});
const DraftParamsSchema = Type.Object({ version: Type.String({ minLength: 1, maxLength: 32 }) });
const DraftItemParamsSchema = Type.Object({
  version: Type.String({ minLength: 1, maxLength: 32 }),
  kind: Type.Union([Type.Literal('capabilities'), Type.Literal('templates')]),
  id: Type.String({ minLength: 1 }),
});
const CatalogQuerySchema = Type.Object({
  page: Type.Optional(Type.String()),
  pageSize: Type.Optional(Type.String()),
  q: Type.Optional(Type.String({ maxLength: 160 })),
  status: Type.Optional(Type.String()),
  riskTier: Type.Optional(Type.String()),
});
const AuditQuerySchema = Type.Object({
  page: Type.Optional(Type.String()),
  pageSize: Type.Optional(Type.String()),
  q: Type.Optional(Type.String({ maxLength: 160 })),
  entityType: Type.Optional(Type.String()),
  action: Type.Optional(Type.String()),
});

const LEGACY_CATALOG_ROUTE_RETIRED_CODE = 'legacy_catalog_operations_route_retired';

async function retireLegacyCatalogRoute(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<FastifyReply> {
  return reply.status(410).send({
    error: {
      category: 'not_found',
      code: LEGACY_CATALOG_ROUTE_RETIRED_CODE,
      correlationId: request.id,
      message: 'This legacy Catalog Operations route has been retired.',
    },
  });
}

export function registerServicePolicyRoutes(
  server: FastifyInstance,
  dependencies: {
    readonly authContextProvider: AuthContextProvider;
    readonly operationsAuthContextProvider: OperationsAuthContextProvider;
    readonly catalogRepository: ServicePolicyCatalogRepository;
    readonly readQueries?: CatalogQueryRepository;
    readonly adminService: ServicePolicyAdminService;
    readonly humanOperationsAuthContextProvider?: OperationsAuthContextProvider;
  },
): void {
  const readService = createServicePolicyReadService({
    repository: dependencies.catalogRepository,
    queries: dependencies.readQueries,
  });
  const authenticateCreator = async (request: AuthenticatedRequest): Promise<void> => {
    request.authContext = await dependencies.authContextProvider.resolveActorContext({
      accessToken: extractBearerToken(request.headers.authorization),
      correlationId: request.id,
    });
    if (request.authContext.actor.kind !== 'creator') {
      throw new ApplicationError({
        category: 'authorization',
        code: 'creator_actor_required',
        message: 'A Creator actor is required.',
      });
    }
  };

  const requireOperationsContext = (request: AuthenticatedRequest): ActorContext => {
    if (request.operationsContext === undefined) {
      throw new ApplicationError({
        category: 'authentication',
        code: 'missing_operations_auth_context',
        message: 'Authenticated operations request requires an Actor Context.',
      });
    }
    return request.operationsContext;
  };

  const authenticateHumanRead = async (request: AuthenticatedRequest): Promise<void> => {
    if (dependencies.humanOperationsAuthContextProvider === undefined) {
      throw new ApplicationError({
        category: 'unavailable',
        code: 'operations_human_runtime_unavailable',
        message: 'Operations Human authentication is temporarily unavailable.',
      });
    }
    try {
      request.operationsContext =
        await dependencies.humanOperationsAuthContextProvider.resolveActorContext({
          accessToken: extractBearerToken(request.headers.authorization),
          correlationId: request.id,
        });
    } catch (error) {
      if (error instanceof ApplicationError) throw error;
      throw new ApplicationError({
        category: 'authentication',
        code: 'invalid_operations_credentials',
        message: 'Operations authentication could not be verified.',
        cause: error,
      });
    }
  };

  const requireReadPermission = (
    request: AuthenticatedRequest,
    permission: 'catalog:read' | 'audit:read',
  ) => {
    if (request.operationsContext === undefined)
      throw new ApplicationError({
        category: 'authentication',
        code: 'missing_operations_auth_context',
        message: 'Authenticated operations request requires an Actor Context.',
      });
    requireOperationsHumanPermission(request.operationsContext, permission);
  };

  const requireReadContext = (request: AuthenticatedRequest): ActorContext => {
    const context = requireOperationsContext(request);
    requireOperationsHumanPermission(context, 'catalog:read');
    return context;
  };

  const requireHumanPermission = (
    request: AuthenticatedRequest,
    permission: 'catalog:draft:create' | 'catalog:draft:update' | 'catalog:policy:activate',
  ): ActorContext => {
    const context = requireOperationsContext(request);
    requireOperationsHumanPermission(context, permission);
    return context;
  };

  const parsePage = (value: string | undefined, fallback: number, maximum: number): number => {
    const parsed = value === undefined ? fallback : Number(value);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > maximum)
      throw new ApplicationError({
        category: 'validation',
        code: 'invalid_pagination',
        message: 'Pagination is invalid.',
      });
    return parsed;
  };

  const parseCatalogFilters = (query: Record<string, string | undefined>): CatalogReadFilters => ({
    page: parsePage(query.page, 1, 10_000),
    pageSize: parsePage(query.pageSize, 20, 100),
    ...(query.q === undefined ? {} : { query: query.q }),
    ...(query.status === undefined ? {} : { status: parseStatus(query.status) }),
    ...(query.riskTier === undefined ? {} : { riskTier: parseRiskTier(query.riskTier) }),
  });

  const parseAuditFilters = (query: Record<string, string | undefined>): AuditReadFilters => ({
    page: parsePage(query.page, 1, 10_000),
    pageSize: parsePage(query.pageSize, 20, 100),
    ...(query.q === undefined ? {} : { query: query.q }),
    ...(query.entityType === undefined ? {} : { entityType: parseEntityType(query.entityType) }),
    ...(query.action === undefined ? {} : { action: parseAction(query.action) }),
  });

  function invalidFilter(name: string): never {
    throw new ApplicationError({
      category: 'validation',
      code: 'invalid_read_filter',
      message: `Invalid ${name} filter.`,
    });
  }
  function parseStatus(value: string): CatalogReadFilters['status'] {
    return ['draft', 'active', 'paused', 'retired'].includes(value)
      ? (value as CatalogReadFilters['status'])
      : invalidFilter('status');
  }
  function parseRiskTier(value: string): CatalogReadFilters['riskTier'] {
    return ['low', 'review', 'prohibited'].includes(value)
      ? (value as CatalogReadFilters['riskTier'])
      : invalidFilter('riskTier');
  }
  function parseEntityType(value: string): AuditReadFilters['entityType'] {
    return ['capability', 'template', 'release'].includes(value)
      ? (value as AuditReadFilters['entityType'])
      : invalidFilter('entityType');
  }
  function parseAction(value: string): AuditReadFilters['action'] {
    return [
      'updated',
      'published',
      'draft_created',
      'draft_updated',
      'previewed',
      'validated',
      'activated',
      'activation_failed',
      'draft_update_failed',
    ].includes(value)
      ? (value as AuditReadFilters['action'])
      : invalidFilter('action');
  }

  server.post(
    '/api/v1/operations/admin/catalog/drafts',
    {
      schema: {
        operationId: 'createOperationsCatalogDraft',
        body: ServicePolicyDraftCreateSchema,
        response: {
          201: ServicePolicyDraftSchema,
          401: ApiErrorEnvelopeSchema,
          403: ApiErrorEnvelopeSchema,
        },
        tags: ['operations-admin-catalog'],
      },
      preHandler: authenticateHumanRead,
    },
    async (request, reply) => {
      const body = request.body as { readonly reason: string };
      const context = requireHumanPermission(request, 'catalog:draft:create');
      return reply
        .status(201)
        .send(await dependencies.adminService.createDraft(body.reason, context));
    },
  );

  server.get(
    '/api/v1/operations/admin/catalog/drafts',
    {
      schema: {
        operationId: 'listOperationsCatalogDrafts',
        response: {
          200: Type.Array(ServicePolicyDraftSchema),
          401: ApiErrorEnvelopeSchema,
          403: ApiErrorEnvelopeSchema,
        },
        tags: ['operations-admin-catalog'],
      },
      preHandler: authenticateHumanRead,
    },
    async (request) => dependencies.adminService.listDrafts(requireReadContext(request)),
  );

  server.get(
    '/api/v1/operations/admin/catalog/drafts/:version',
    {
      schema: {
        operationId: 'getOperationsCatalogDraft',
        params: DraftParamsSchema,
        response: {
          200: ServicePolicyDraftSchema,
          401: ApiErrorEnvelopeSchema,
          403: ApiErrorEnvelopeSchema,
        },
        tags: ['operations-admin-catalog'],
      },
      preHandler: authenticateHumanRead,
    },
    async (request) =>
      dependencies.adminService.getDraft(
        (request.params as { readonly version: string }).version,
        requireReadContext(request),
      ),
  );

  server.patch(
    '/api/v1/operations/admin/catalog/drafts/:version/:kind/:id',
    {
      schema: {
        operationId: 'updateOperationsCatalogDraftItem',
        params: DraftItemParamsSchema,
        body: ServicePolicyDraftUpdateSchema,
        response: {
          200: ServicePolicyDraftSchema,
          400: ApiErrorEnvelopeSchema,
          401: ApiErrorEnvelopeSchema,
          403: ApiErrorEnvelopeSchema,
          404: ApiErrorEnvelopeSchema,
          409: ApiErrorEnvelopeSchema,
        },
        tags: ['operations-admin-catalog'],
      },
      preHandler: authenticateHumanRead,
    },
    async (request) => {
      const params = request.params as {
        readonly version: string;
        readonly kind: 'capabilities' | 'templates';
        readonly id: string;
      };
      const body = request.body as Parameters<ServicePolicyAdminService['updateDraftItem']>[3];
      return dependencies.adminService.updateDraftItem(
        params.version,
        params.kind === 'capabilities' ? 'capability' : 'template',
        params.id,
        body,
        requireHumanPermission(request, 'catalog:draft:update'),
      );
    },
  );

  for (const action of ['preview', 'validate'] as const) {
    server.post(
      `/api/v1/operations/admin/catalog/drafts/:version/${action}`,
      {
        schema: {
          operationId: `${action}OperationsCatalogDraft`,
          params: DraftParamsSchema,
          response: {
            200:
              action === 'preview'
                ? ServicePolicyPreviewResultSchema
                : ServicePolicyValidationResultSchema,
            401: ApiErrorEnvelopeSchema,
            403: ApiErrorEnvelopeSchema,
            404: ApiErrorEnvelopeSchema,
          },
          tags: ['operations-admin-catalog'],
        },
        preHandler: authenticateHumanRead,
      },
      async (request) => {
        const version = (request.params as { readonly version: string }).version;
        const context = requireReadContext(request);
        return action === 'preview'
          ? dependencies.adminService.previewDraft(version, context)
          : dependencies.adminService.validateDraft(version, context);
      },
    );
  }

  server.post(
    '/api/v1/operations/admin/catalog/drafts/:version/activate',
    {
      schema: {
        operationId: 'activateOperationsCatalogDraft',
        params: DraftParamsSchema,
        body: ServicePolicyDraftActivateSchema,
        response: {
          204: Type.Null(),
          400: ApiErrorEnvelopeSchema,
          401: ApiErrorEnvelopeSchema,
          403: ApiErrorEnvelopeSchema,
          409: ApiErrorEnvelopeSchema,
        },
        tags: ['operations-admin-catalog'],
      },
      preHandler: authenticateHumanRead,
    },
    async (request, reply) => {
      const version = (request.params as { readonly version: string }).version;
      const body = request.body as Parameters<ServicePolicyAdminService['activateDraft']>[1];
      await dependencies.adminService.activateDraft(
        version,
        body,
        requireHumanPermission(request, 'catalog:policy:activate'),
      );
      return reply.status(204).send();
    },
  );

  server.get(
    '/api/v1/operations/admin/catalog/:kind',
    {
      schema: {
        operationId: 'listOperationsAdminCatalog',
        params: CatalogKindParamsSchema,
        querystring: CatalogQuerySchema,
        response: {
          200: OperationsCatalogReadResponseSchema,
          401: ApiErrorEnvelopeSchema,
          403: ApiErrorEnvelopeSchema,
        },
        tags: ['operations-admin-read'],
      },
      preHandler: authenticateHumanRead,
    },
    async (request) => {
      requireReadPermission(request, 'catalog:read');
      const params = request.params as { kind: CatalogReadKind };
      return readService.listCatalog(
        params.kind,
        parseCatalogFilters(request.query as Record<string, string | undefined>),
      );
    },
  );

  server.get(
    '/api/v1/operations/admin/catalog/:kind/:id',
    {
      schema: {
        operationId: 'getOperationsAdminCatalogItem',
        params: Type.Intersect([CatalogKindParamsSchema, IdParamsSchema]),
        response: {
          200: OperationsCatalogDetailResponseSchema,
          401: ApiErrorEnvelopeSchema,
          403: ApiErrorEnvelopeSchema,
          404: ApiErrorEnvelopeSchema,
        },
        tags: ['operations-admin-read'],
      },
      preHandler: authenticateHumanRead,
    },
    async (request) => {
      requireReadPermission(request, 'catalog:read');
      const params = request.params as { kind: CatalogReadKind; id: string };
      return readService.getCatalog(params.kind, params.id);
    },
  );

  server.get(
    '/api/v1/operations/admin/audit',
    {
      schema: {
        operationId: 'listOperationsAdminAudit',
        querystring: AuditQuerySchema,
        response: {
          200: OperationsAuditReadResponseSchema,
          401: ApiErrorEnvelopeSchema,
          403: ApiErrorEnvelopeSchema,
        },
        tags: ['operations-admin-read'],
      },
      preHandler: authenticateHumanRead,
    },
    async (request) => {
      requireReadPermission(request, 'audit:read');
      return readService.listAudit(
        parseAuditFilters(request.query as Record<string, string | undefined>),
      );
    },
  );

  server.get(
    '/api/v1/operations/admin/audit/:id',
    {
      schema: {
        operationId: 'getOperationsAdminAudit',
        params: IdParamsSchema,
        response: {
          200: OperationsAuditDetailResponseSchema,
          401: ApiErrorEnvelopeSchema,
          403: ApiErrorEnvelopeSchema,
          404: ApiErrorEnvelopeSchema,
        },
        tags: ['operations-admin-read'],
      },
      preHandler: authenticateHumanRead,
    },
    async (request) => {
      requireReadPermission(request, 'audit:read');
      return readService.getAudit((request.params as { id: string }).id);
    },
  );

  server.get(
    '/api/v1/creator/service-catalog',
    {
      schema: {
        operationId: 'getCreatorServiceCatalog',
        response: { 200: ServiceCatalogResponseSchema, 401: ApiErrorEnvelopeSchema },
        tags: ['service-policy'],
      },
      preHandler: authenticateCreator,
    },
    async () => dependencies.catalogRepository.getSnapshot(),
  );

  server.get(
    '/api/v1/operations/service-policy/workspace',
    {
      schema: {
        operationId: 'getServicePolicyOperationsWorkspace',
        response: {
          410: ApiErrorEnvelopeSchema,
        },
        tags: ['service-policy'],
      },
    },
    retireLegacyCatalogRoute,
  );

  server.get(
    '/api/v1/operations/service-policy/audit',
    {
      schema: {
        operationId: 'listServicePolicyAudit',
        response: {
          410: ApiErrorEnvelopeSchema,
        },
        tags: ['service-policy'],
      },
    },
    retireLegacyCatalogRoute,
  );

  server.patch(
    '/api/v1/operations/service-policy/capabilities/:id',
    {
      schema: {
        operationId: 'updateServicePolicyCapability',
        response: {
          410: ApiErrorEnvelopeSchema,
        },
        tags: ['service-policy'],
      },
    },
    retireLegacyCatalogRoute,
  );

  server.patch(
    '/api/v1/operations/service-policy/templates/:id',
    {
      schema: {
        operationId: 'updateServicePolicyTemplate',
        response: {
          410: ApiErrorEnvelopeSchema,
        },
        tags: ['service-policy'],
      },
    },
    retireLegacyCatalogRoute,
  );

  server.post(
    '/api/v1/operations/service-policy/releases',
    {
      schema: {
        operationId: 'publishServicePolicyVersion',
        response: {
          410: ApiErrorEnvelopeSchema,
        },
        tags: ['service-policy'],
      },
    },
    retireLegacyCatalogRoute,
  );
}
