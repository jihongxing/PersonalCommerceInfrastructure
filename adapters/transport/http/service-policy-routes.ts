import type { FastifyInstance, FastifyRequest } from 'fastify';
import { Type } from 'typebox';

import { extractBearerToken } from '../../auth/transport/bearer-token.js';
import { ApplicationError } from '../../../applications/core/application-error.js';
import type { ActorContext } from '../../../applications/core/actor-context.js';
import type { AuthContextProvider } from '../../../applications/core/ports/auth-context-provider.js';
import type { OperationsAuthContextProvider } from '../../../applications/core/ports/operations-auth-context-provider.js';
import type { ServicePolicyAdminService } from '../../../applications/service-policy/service-policy-admin-service.js';
import type { ServicePolicyCatalogRepository } from '../../../applications/service-policy/service-policy-repositories.js';
import {
  CapabilityCatalogItemSchema,
  ServiceCatalogResponseSchema,
  ServiceOfferingTemplateSchema,
  ServicePolicyAdminUpdateSchema,
  ServicePolicyAdminWorkspaceSchema,
  ServicePolicyAuditSchema,
  ServicePolicyPublishVersionSchema,
} from '../../../contracts/api/v1/service-policy-contracts.js';
import { ApiErrorEnvelopeSchema } from '../../../contracts/api/v1/system-contracts.js';

interface AuthenticatedRequest extends FastifyRequest {
  authContext?: ActorContext;
  operationsContext?: ActorContext;
}

const IdParamsSchema = Type.Object({ id: Type.String({ minLength: 1 }) });

export function registerServicePolicyRoutes(
  server: FastifyInstance,
  dependencies: {
    readonly authContextProvider: AuthContextProvider;
    readonly operationsAuthContextProvider: OperationsAuthContextProvider;
    readonly catalogRepository: ServicePolicyCatalogRepository;
    readonly adminService: ServicePolicyAdminService;
  },
): void {
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
