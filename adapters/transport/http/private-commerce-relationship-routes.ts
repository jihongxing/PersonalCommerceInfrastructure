import type { FastifyInstance, FastifyRequest } from 'fastify';
import { Type } from 'typebox';

import type { PrivateCommerceRelationshipService } from '../../../applications/private-commerce-relationship/private-commerce-relationship-service.js';
import type { AuthContextProvider } from '../../../applications/core/ports/auth-context-provider.js';
import {
  PrivateCommerceRelationshipListSchema,
  PrivateCommerceRelationshipViewSchema,
} from '../../../contracts/api/v1/private-identity-contracts.js';
import { ApiErrorEnvelopeSchema } from '../../../contracts/api/v1/system-contracts.js';
import { extractBearerToken } from '../../auth/transport/bearer-token.js';

const RelationshipParamsSchema = Type.Object(
  { relationshipId: Type.String({ minLength: 1 }) },
  { additionalProperties: false },
);

const RelationshipQuerySchema = Type.Object(
  {
    commerceProfileId: Type.Optional(Type.String({ minLength: 1 })),
    externalPlatformAccountId: Type.Optional(Type.String({ minLength: 1 })),
  },
  { additionalProperties: false },
);

export function registerPrivateCommerceRelationshipRoutes(
  server: FastifyInstance,
  dependencies: {
    readonly authContextProvider: AuthContextProvider;
    readonly service: PrivateCommerceRelationshipService;
  },
): void {
  server.get(
    '/api/v1/private/commerce-relationships',
    {
      schema: {
        operationId: 'listMyCommerceRelationships',
        querystring: RelationshipQuerySchema,
        response: {
          200: PrivateCommerceRelationshipListSchema,
          401: ApiErrorEnvelopeSchema,
          403: ApiErrorEnvelopeSchema,
        },
        tags: ['private-commerce-relationship'],
      },
      preHandler: async (request) => {
        (request as AuthenticatedRequest).accountContext =
          await dependencies.authContextProvider.resolveAccountContext({
            accessToken: extractBearerToken(request.headers.authorization),
            correlationId: request.id,
          });
      },
    },
    async (request) => ({
      relationships: await dependencies.service.listMyCommerceRelationships(
        requireAccountContext(request),
        request.query as {
          readonly commerceProfileId?: string;
          readonly externalPlatformAccountId?: string;
        },
      ),
    }),
  );

  server.get(
    '/api/v1/private/commerce-relationships/:relationshipId',
    {
      schema: {
        operationId: 'getMyCommerceRelationship',
        params: RelationshipParamsSchema,
        response: {
          200: PrivateCommerceRelationshipViewSchema,
          401: ApiErrorEnvelopeSchema,
          403: ApiErrorEnvelopeSchema,
          404: ApiErrorEnvelopeSchema,
        },
        tags: ['private-commerce-relationship'],
      },
      preHandler: async (request) => {
        (request as AuthenticatedRequest).accountContext =
          await dependencies.authContextProvider.resolveAccountContext({
            accessToken: extractBearerToken(request.headers.authorization),
            correlationId: request.id,
          });
      },
    },
    async (request) =>
      dependencies.service.getMyCommerceRelationship(
        requireAccountContext(request),
        (request.params as { readonly relationshipId: string }).relationshipId,
      ),
  );
}

interface AuthenticatedRequest {
  accountContext?: Awaited<ReturnType<AuthContextProvider['resolveAccountContext']>>;
}

function requireAccountContext(
  request: FastifyRequest,
): NonNullable<AuthenticatedRequest['accountContext']> {
  const accountContext = (request as AuthenticatedRequest).accountContext;
  if (accountContext === undefined) {
    throw new Error('Private Commerce Relationship route requires an authenticated Account context.');
  }
  return accountContext;
}
