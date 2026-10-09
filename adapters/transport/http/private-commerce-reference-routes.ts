import type { FastifyInstance, FastifyRequest } from 'fastify';
import { Type } from 'typebox';

import type { PrivateCommerceReferenceService } from '../../../applications/private-commerce-reference/private-commerce-reference-service.js';
import type { AuthContextProvider } from '../../../applications/core/ports/auth-context-provider.js';
import {
  PrivateCommerceReferenceViewSchema,
} from '../../../contracts/api/v1/private-identity-contracts.js';
import { ApiErrorEnvelopeSchema } from '../../../contracts/api/v1/system-contracts.js';
import { extractBearerToken } from '../../auth/transport/bearer-token.js';

const ProfileParamsSchema = Type.Object(
  {
    profileId: Type.String({ minLength: 1 }),
  },
  { additionalProperties: false },
);

export function registerPrivateCommerceReferenceRoutes(
  server: FastifyInstance,
  dependencies: {
    readonly authContextProvider: AuthContextProvider;
    readonly service: PrivateCommerceReferenceService;
  },
): void {
  server.get(
    '/api/v1/private/profiles/:profileId/reference',
    {
      schema: {
        operationId: 'getMyCommerceReference',
        params: ProfileParamsSchema,
        response: {
          200: PrivateCommerceReferenceViewSchema,
          401: ApiErrorEnvelopeSchema,
          403: ApiErrorEnvelopeSchema,
          404: ApiErrorEnvelopeSchema,
        },
        tags: ['private-commerce-reference'],
      },
      preHandler: async (request) => {
        const accountContext = await dependencies.authContextProvider.resolveAccountContext({
          accessToken: extractBearerToken(request.headers.authorization),
          correlationId: request.id,
        });
        (request as AuthenticatedRequest).accountContext = accountContext;
      },
    },
    async (request) =>
      dependencies.service.getMyCommerceReference(
        requireAccountContext(request),
        (request.params as { readonly profileId: string }).profileId,
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
    throw new Error('Private Commerce Reference route requires an authenticated Account context.');
  }
  return accountContext;
}
