import type { FastifyInstance, FastifyRequest } from 'fastify';
import { Type } from 'typebox';

import { extractBearerToken } from '../../auth/transport/bearer-token.js';
import { ApplicationError } from '../../../applications/core/application-error.js';
import type { AuthContextProvider } from '../../../applications/core/ports/auth-context-provider.js';
import type { ActorContext } from '../../../applications/core/actor-context.js';
import type { CreatorIdentityService } from '../../../applications/creator-identity/creator-identity-service.js';
import {
  AddCapabilityRequestSchema,
  CapabilitySchema,
  CommerceIdentityResponseSchema,
  CreateCommerceIdentityRequestSchema,
  UpdateCommerceIdentityRequestSchema,
} from '../../../contracts/api/v1/creator-identity-contracts.js';
import { ApiErrorEnvelopeSchema } from '../../../contracts/api/v1/system-contracts.js';
import type {
  AddCapabilityCommand,
  CreateCommerceIdentityCommand,
  UpdateCommerceIdentityCommand,
} from '../../../applications/creator-identity/creator-identity-use-cases.js';

interface AuthenticatedRequest extends FastifyRequest {
  authContext?: ActorContext;
}

function requireContext(request: AuthenticatedRequest): ActorContext {
  if (request.authContext === undefined) {
    throw new ApplicationError({
      category: 'authentication',
      code: 'missing_auth_context',
      message: 'Authentication is required.',
    });
  }

  return request.authContext;
}

function identityResponse(identity: Awaited<ReturnType<CreatorIdentityService['get']>>) {
  return {
    creatorId: identity.creatorId,
    profile: identity.profile,
    capabilityIds: identity.capabilityIds,
    capabilities: identity.capabilities,
    state: identity.state,
  };
}

export function registerCreatorIdentityRoutes(
  server: FastifyInstance,
  dependencies: {
    readonly authContextProvider: AuthContextProvider;
    readonly service: CreatorIdentityService;
  },
): void {
  const authenticate = async (request: AuthenticatedRequest): Promise<void> => {
    const token = extractBearerToken(request.headers.authorization);
    request.authContext = await dependencies.authContextProvider.resolveActorContext({
      accessToken: token,
      correlationId: request.id,
    });
  };

  server.get(
    '/api/v1/creator/identity',
    {
      schema: {
        operationId: 'getCreatorIdentity',
        response: {
          200: CommerceIdentityResponseSchema,
          401: ApiErrorEnvelopeSchema,
          404: ApiErrorEnvelopeSchema,
        },
        tags: ['creator-identity'],
      },
      preHandler: authenticate,
    },
    async (request) => identityResponse(await dependencies.service.get(requireContext(request))),
  );

  server.post(
    '/api/v1/creator/identity',
    {
      schema: {
        operationId: 'createCreatorIdentity',
        body: CreateCommerceIdentityRequestSchema,
        response: {
          201: CommerceIdentityResponseSchema,
          400: ApiErrorEnvelopeSchema,
          401: ApiErrorEnvelopeSchema,
          409: ApiErrorEnvelopeSchema,
        },
        tags: ['creator-identity'],
      },
      preHandler: authenticate,
    },
    async (request, reply) => {
      const identity = await dependencies.service.create(
        request.body as CreateCommerceIdentityCommand,
        requireContext(request),
      );
      const current = await dependencies.service.get(requireContext(request));
      return reply.status(201).send(identityResponse({ ...current, ...identity }));
    },
  );

  server.patch(
    '/api/v1/creator/identity',
    {
      schema: {
        operationId: 'updateCreatorIdentity',
        body: UpdateCommerceIdentityRequestSchema,
        response: {
          200: CommerceIdentityResponseSchema,
          400: ApiErrorEnvelopeSchema,
          401: ApiErrorEnvelopeSchema,
          404: ApiErrorEnvelopeSchema,
        },
        tags: ['creator-identity'],
      },
      preHandler: authenticate,
    },
    async (request) =>
      identityResponse({
        ...(await dependencies.service.get(requireContext(request))),
        ...(await dependencies.service.update(
          request.body as UpdateCommerceIdentityCommand,
          requireContext(request),
        )),
      }),
  );

  server.post(
    '/api/v1/creator/identity/capabilities',
    {
      schema: {
        operationId: 'addCreatorCapability',
        body: AddCapabilityRequestSchema,
        response: {
          201: CommerceIdentityResponseSchema,
          400: ApiErrorEnvelopeSchema,
          401: ApiErrorEnvelopeSchema,
          404: ApiErrorEnvelopeSchema,
        },
        tags: ['creator-identity'],
      },
      preHandler: authenticate,
    },
    async (request, reply) => {
      const identity = await dependencies.service.addCapability(
        request.body as AddCapabilityCommand,
        requireContext(request),
      );
      const current = await dependencies.service.get(requireContext(request));
      return reply.status(201).send(identityResponse({ ...current, ...identity }));
    },
  );

  const capabilityParams = Type.Object({
    capabilityId: Type.String({ minLength: 1, maxLength: 128 }),
  });
  server.get<{ Params: { capabilityId: string } }>(
    '/api/v1/creator/identity/capabilities/:capabilityId',
    {
      schema: {
        operationId: 'getCreatorCapability',
        params: capabilityParams,
        response: {
          200: CapabilitySchema,
          401: ApiErrorEnvelopeSchema,
          404: ApiErrorEnvelopeSchema,
        },
        tags: ['creator-identity'],
      },
      preHandler: authenticate,
    },
    async (request) =>
      dependencies.service.getCapability(request.params.capabilityId, requireContext(request)),
  );
  server.patch<{ Params: { capabilityId: string }; Body: AddCapabilityCommand }>(
    '/api/v1/creator/identity/capabilities/:capabilityId',
    {
      schema: {
        operationId: 'updateCreatorCapability',
        params: capabilityParams,
        body: AddCapabilityRequestSchema,
        response: {
          200: CapabilitySchema,
          400: ApiErrorEnvelopeSchema,
          401: ApiErrorEnvelopeSchema,
          404: ApiErrorEnvelopeSchema,
        },
        tags: ['creator-identity'],
      },
      preHandler: authenticate,
    },
    async (request) =>
      dependencies.service.updateCapability(
        request.params.capabilityId,
        request.body,
        requireContext(request),
      ),
  );
  server.delete<{ Params: { capabilityId: string } }>(
    '/api/v1/creator/identity/capabilities/:capabilityId',
    {
      schema: {
        operationId: 'deleteCreatorCapability',
        params: capabilityParams,
        response: {
          204: Type.Null(),
          401: ApiErrorEnvelopeSchema,
          404: ApiErrorEnvelopeSchema,
          409: ApiErrorEnvelopeSchema,
        },
        tags: ['creator-identity'],
      },
      preHandler: authenticate,
    },
    async (request, reply) => {
      await dependencies.service.deleteCapability(
        request.params.capabilityId,
        requireContext(request),
      );
      return reply.status(204).send();
    },
  );
}
