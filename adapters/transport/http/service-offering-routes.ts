import type { FastifyInstance, FastifyRequest } from 'fastify';
import { Type } from 'typebox';

import { extractBearerToken } from '../../auth/transport/bearer-token.js';
import { ApplicationError } from '../../../applications/core/application-error.js';
import type { ActorContext } from '../../../applications/core/actor-context.js';
import type { AuthContextProvider } from '../../../applications/core/ports/auth-context-provider.js';
import type { ServiceOfferingService } from '../../../applications/service-offering/offering-service.js';
import type { CreateServiceOfferingCommand } from '../../../applications/service-offering/offering-use-cases.js';
import {
  CreateServiceOfferingRequestSchema,
  DistributionAssetResponseSchema,
  PublishServiceOfferingResponseSchema,
  ServiceOfferingListResponseSchema,
  ServiceOfferingResponseSchema,
  UpdateServiceOfferingRequestSchema,
} from '../../../contracts/api/v1/service-offering-contracts.js';
import { ApiErrorEnvelopeSchema } from '../../../contracts/api/v1/system-contracts.js';
import {
  missingPublishConditions,
  type Offering,
} from '../../../modules/service-offering/offering.js';

interface AuthenticatedRequest extends FastifyRequest {
  authContext?: ActorContext;
}

export interface ServiceOfferingRouteDependencies {
  readonly authContextProvider: AuthContextProvider;
  readonly service: ServiceOfferingService;
}

function requireContext(request: AuthenticatedRequest): ActorContext {
  if (request.authContext === undefined) {
    throw new ApplicationError({
      category: 'authentication',
      code: 'missing_auth_context',
      message: 'Authenticated request requires an Actor Context.',
    });
  }

  return request.authContext;
}

function offeringResponse(offering: Offering) {
  return {
    id: offering.id,
    creatorId: offering.creatorId,
    capabilityIds: [...offering.capabilityIds],
    title: offering.title,
    description: offering.description,
    ...(offering.availability === undefined
      ? {}
      : { availabilityDescription: offering.availability.description }),
    ...(offering.appearance === undefined ? {} : { appearance: offering.appearance }),
    requestInstructions: offering.requestInstructions,
    state: offering.state,
    missingPublishConditions: missingPublishConditions(offering),
  };
}

export function registerServiceOfferingRoutes(
  server: FastifyInstance,
  dependencies: ServiceOfferingRouteDependencies,
): void {
  const authenticate = async (request: AuthenticatedRequest): Promise<void> => {
    const accessToken = extractBearerToken(request.headers.authorization);
    request.authContext = await dependencies.authContextProvider.resolveActorContext({
      accessToken,
      correlationId: request.id,
    });
  };

  server.get(
    '/api/v1/creator/offerings',
    {
      schema: {
        operationId: 'listCreatorServiceOfferings',
        response: {
          200: ServiceOfferingListResponseSchema,
          401: ApiErrorEnvelopeSchema,
        },
        tags: ['service-offering'],
      },
      preHandler: authenticate,
    },
    async (request) => ({
      offerings: (await dependencies.service.list(requireContext(request))).map(offeringResponse),
    }),
  );

  server.post(
    '/api/v1/creator/offerings',
    {
      schema: {
        operationId: 'createCreatorServiceOffering',
        body: CreateServiceOfferingRequestSchema,
        response: {
          201: ServiceOfferingResponseSchema,
          400: ApiErrorEnvelopeSchema,
          401: ApiErrorEnvelopeSchema,
          404: ApiErrorEnvelopeSchema,
        },
        tags: ['service-offering'],
      },
      preHandler: authenticate,
    },
    async (request, reply) => {
      const offering = await dependencies.service.create(
        request.body as CreateServiceOfferingCommand,
        requireContext(request),
      );
      return reply.status(201).send(offeringResponse(offering));
    },
  );

  server.patch(
    '/api/v1/creator/offerings/:offeringId',
    {
      schema: {
        operationId: 'updateCreatorServiceOffering',
        params: Type.Object({ offeringId: Type.String({ minLength: 1 }) }),
        body: UpdateServiceOfferingRequestSchema,
        response: {
          200: ServiceOfferingResponseSchema,
          400: ApiErrorEnvelopeSchema,
          401: ApiErrorEnvelopeSchema,
          403: ApiErrorEnvelopeSchema,
          404: ApiErrorEnvelopeSchema,
        },
        tags: ['service-offering'],
      },
      preHandler: authenticate,
    },
    async (request) => {
      const { offeringId } = request.params as { readonly offeringId: string };
      const offering = await dependencies.service.update(
        {
          offeringId,
          ...(request.body as CreateServiceOfferingCommand),
        },
        requireContext(request),
      );
      return offeringResponse(offering);
    },
  );

  server.post(
    '/api/v1/creator/offerings/:offeringId/publish',
    {
      schema: {
        operationId: 'publishCreatorServiceOffering',
        params: Type.Object({ offeringId: Type.String({ minLength: 1 }) }),
        response: {
          200: PublishServiceOfferingResponseSchema,
          400: ApiErrorEnvelopeSchema,
          401: ApiErrorEnvelopeSchema,
          403: ApiErrorEnvelopeSchema,
          404: ApiErrorEnvelopeSchema,
          500: ApiErrorEnvelopeSchema,
        },
        tags: ['service-offering'],
      },
      preHandler: authenticate,
    },
    async (request) => {
      const { offeringId } = request.params as { readonly offeringId: string };
      const result = await dependencies.service.publish({ offeringId }, requireContext(request));
      return {
        offering: {
          id: result.offering.id,
          creatorId: result.offering.creatorId,
          state: result.offering.state,
        },
        distributionAsset: result.distributionAsset,
      };
    },
  );

  server.post(
    '/api/v1/creator/offerings/:offeringId/unpublish',
    {
      schema: {
        operationId: 'unpublishCreatorServiceOffering',
        params: Type.Object({ offeringId: Type.String({ minLength: 1 }) }),
        response: {
          200: ServiceOfferingResponseSchema,
          401: ApiErrorEnvelopeSchema,
          403: ApiErrorEnvelopeSchema,
          404: ApiErrorEnvelopeSchema,
        },
        tags: ['service-offering'],
      },
      preHandler: authenticate,
    },
    async (request) => {
      const { offeringId } = request.params as { readonly offeringId: string };
      const offering = await dependencies.service.unpublish(
        { offeringId },
        requireContext(request),
      );
      return offeringResponse(offering);
    },
  );

  server.post(
    '/api/v1/creator/offerings/:offeringId/distribution',
    {
      schema: {
        operationId: 'recordCreatorExternalDistribution',
        params: Type.Object({ offeringId: Type.String({ minLength: 1 }) }),
        response: {
          200: DistributionAssetResponseSchema,
          401: ApiErrorEnvelopeSchema,
          403: ApiErrorEnvelopeSchema,
          404: ApiErrorEnvelopeSchema,
          409: ApiErrorEnvelopeSchema,
        },
        tags: ['service-offering'],
      },
      preHandler: authenticate,
    },
    async (request) => {
      const { offeringId } = request.params as { readonly offeringId: string };
      return dependencies.service.recordExternalDistribution(
        { offeringId },
        requireContext(request),
      );
    },
  );
}
