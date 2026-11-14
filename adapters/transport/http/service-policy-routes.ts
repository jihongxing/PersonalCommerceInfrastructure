import type { FastifyInstance, FastifyRequest } from 'fastify';
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
  CapabilityCatalogItemSchema,
  ServiceCatalogResponseSchema,
  ServiceOfferingTemplateSchema,
  ServicePolicyAdminUpdateSchema,
  ServicePolicyAdminWorkspaceSchema,
  ServicePolicyAuditSchema,
  ServicePolicyPublishVersionSchema,
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

  const authenticateOperations = async (request: AuthenticatedRequest): Promise<void> => {
    request.operationsContext =
      await dependencies.operationsAuthContextProvider.resolveActorContext({
        accessToken: extractBearerToken(request.headers.authorization),
        correlationId: request.id,
      });
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
    request.operationsContext =
      await dependencies.humanOperationsAuthContextProvider.resolveActorContext({
        accessToken: extractBearerToken(request.headers.authorization),
        correlationId: request.id,
      });
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
    return ['updated', 'published'].includes(value)
      ? (value as AuditReadFilters['action'])
      : invalidFilter('action');
  }

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
          200: ServicePolicyAdminWorkspaceSchema,
          401: ApiErrorEnvelopeSchema,
          403: ApiErrorEnvelopeSchema,
        },
        tags: ['service-policy'],
      },
      preHandler: authenticateOperations,
    },
    async (request) => dependencies.adminService.getWorkspace(requireOperationsContext(request)),
  );

  server.get(
    '/api/v1/operations/service-policy/audit',
    {
      schema: {
        operationId: 'listServicePolicyAudit',
        response: {
          200: Type.Array(ServicePolicyAuditSchema),
          401: ApiErrorEnvelopeSchema,
          403: ApiErrorEnvelopeSchema,
        },
        tags: ['service-policy'],
      },
      preHandler: authenticateOperations,
    },
    async (request) => {
      requireOperationsContext(request);
      return dependencies.catalogRepository.listAudit();
    },
  );

  server.patch(
    '/api/v1/operations/service-policy/capabilities/:id',
    {
      schema: {
        operationId: 'updateServicePolicyCapability',
        params: IdParamsSchema,
        body: ServicePolicyAdminUpdateSchema,
        response: {
          200: CapabilityCatalogItemSchema,
          400: ApiErrorEnvelopeSchema,
          401: ApiErrorEnvelopeSchema,
          403: ApiErrorEnvelopeSchema,
          404: ApiErrorEnvelopeSchema,
        },
        tags: ['service-policy'],
      },
      preHandler: authenticateOperations,
    },
    async (request) => {
      const { id } = request.params as { readonly id: string };
      return dependencies.adminService.updateCapability(
        id,
        request.body as Parameters<ServicePolicyAdminService['updateCapability']>[1],
        requireOperationsContext(request),
      );
    },
  );

  server.patch(
    '/api/v1/operations/service-policy/templates/:id',
    {
      schema: {
        operationId: 'updateServicePolicyTemplate',
        params: IdParamsSchema,
        body: ServicePolicyAdminUpdateSchema,
        response: {
          200: ServiceOfferingTemplateSchema,
          400: ApiErrorEnvelopeSchema,
          401: ApiErrorEnvelopeSchema,
          403: ApiErrorEnvelopeSchema,
          404: ApiErrorEnvelopeSchema,
        },
        tags: ['service-policy'],
      },
      preHandler: authenticateOperations,
    },
    async (request) => {
      const { id } = request.params as { readonly id: string };
      return dependencies.adminService.updateTemplate(
        id,
        request.body as Parameters<ServicePolicyAdminService['updateTemplate']>[1],
        requireOperationsContext(request),
      );
    },
  );

  server.post(
    '/api/v1/operations/service-policy/releases',
    {
      schema: {
        operationId: 'publishServicePolicyVersion',
        body: ServicePolicyPublishVersionSchema,
        response: {
          204: Type.Null(),
          400: ApiErrorEnvelopeSchema,
          401: ApiErrorEnvelopeSchema,
          403: ApiErrorEnvelopeSchema,
        },
        tags: ['service-policy'],
      },
      preHandler: authenticateOperations,
    },
    async (request, reply) => {
      const body = request.body as { readonly version: string; readonly reason: string };
      await dependencies.adminService.publishVersion(
        body.version,
        body.reason,
        requireOperationsContext(request),
      );
      return reply.status(204).send();
    },
  );
}
