import type { FastifyInstance, FastifyRequest } from 'fastify';

import type { PrivateSelfDeclaredExternalRelationshipService } from '../../../applications/private-external-platform-relationship/private-self-declared-external-relationship-service.js';
import type { AuthContextProvider } from '../../../applications/core/ports/auth-context-provider.js';
import {
  PrivateSelfDeclaredExternalRelationshipInputSchema,
  PrivateSelfDeclaredExternalRelationshipViewSchema,
} from '../../../contracts/api/v1/private-identity-contracts.js';
import { ApiErrorEnvelopeSchema } from '../../../contracts/api/v1/system-contracts.js';
import { extractBearerToken } from '../../auth/transport/bearer-token.js';

export function registerPrivateSelfDeclaredExternalRelationshipRoutes(
  server: FastifyInstance,
  dependencies: {
    readonly authContextProvider: AuthContextProvider;
    readonly service: PrivateSelfDeclaredExternalRelationshipService;
  },
): void {
  server.post(
    '/api/v1/private/external-platform-relationships',
    {
      schema: {
        operationId: 'createMySelfDeclaredExternalRelationship',
        body: PrivateSelfDeclaredExternalRelationshipInputSchema,
        response: {
          201: PrivateSelfDeclaredExternalRelationshipViewSchema,
          400: ApiErrorEnvelopeSchema,
          401: ApiErrorEnvelopeSchema,
          403: ApiErrorEnvelopeSchema,
          404: ApiErrorEnvelopeSchema,
          409: ApiErrorEnvelopeSchema,
        },
        tags: ['private-self-service'],
      },
      preHandler: async (request) => {
        (request as AuthenticatedRequest).accountContext =
          await dependencies.authContextProvider.resolveAccountContext({
            accessToken: extractBearerToken(request.headers.authorization),
            correlationId: request.id,
          });
      },
    },
    async (request, reply) => {
      const result = await dependencies.service.createMySelfDeclaredExternalRelationship(
        requireAccountContext(request),
        request.body as {
          readonly platform: string;
          readonly platformAccountId: string;
          readonly commerceProfileId: string;
        },
      );
      return reply.status(201).send({
        externalPlatformAccount: {
          platform: result.externalPlatformAccount.platform.namespace,
          platformAccountId: result.externalPlatformAccount.platformAccountId,
          lifecycle: result.externalPlatformAccount.lifecycle,
        },
        commerceRelationship: {
          relationshipId: result.commerceRelationship.commerceRelationshipId,
          role: result.commerceRelationship.role,
          lifecycle: result.commerceRelationship.lifecycle,
          provenance: result.commerceRelationship.provenance,
          effectiveAt: result.commerceRelationship.effectiveAt,
          createdAt: result.commerceRelationship.createdAt,
        },
      });
    },
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
    throw new Error('Private self-declared external relationship route requires authentication.');
  }
  return accountContext;
}
