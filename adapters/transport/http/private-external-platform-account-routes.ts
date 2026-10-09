import type { FastifyInstance, FastifyRequest } from 'fastify';
import { Type } from 'typebox';

import type { PrivateExternalPlatformAccountService } from '../../../applications/private-external-platform-account/private-external-platform-account-service.js';
import type { AuthContextProvider } from '../../../applications/core/ports/auth-context-provider.js';
import {
  PrivateExternalPlatformAccountListSchema,
  PrivateExternalPlatformAccountViewSchema,
} from '../../../contracts/api/v1/private-identity-contracts.js';
import { ApiErrorEnvelopeSchema } from '../../../contracts/api/v1/system-contracts.js';
import { extractBearerToken } from '../../auth/transport/bearer-token.js';

const ExternalPlatformAccountParamsSchema = Type.Object(
  {
    externalPlatformAccountId: Type.String({ minLength: 1 }),
  },
  { additionalProperties: false },
);

export function registerPrivateExternalPlatformAccountRoutes(
  server: FastifyInstance,
  dependencies: {
    readonly authContextProvider: AuthContextProvider;
    readonly service: PrivateExternalPlatformAccountService;
  },
): void {
  server.get(
    '/api/v1/private/external-platform-accounts',
    {
      schema: {
        operationId: 'listMyExternalPlatformAccounts',
        response: {
          200: PrivateExternalPlatformAccountListSchema,
          401: ApiErrorEnvelopeSchema,
          403: ApiErrorEnvelopeSchema,
        },
        tags: ['private-external-platform-account'],
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
      accounts: await dependencies.service.listMyExternalPlatformAccounts(
        requireAccountContext(request),
      ),
    }),
  );

  server.get(
    '/api/v1/private/external-platform-accounts/:externalPlatformAccountId',
    {
      schema: {
        operationId: 'getMyExternalPlatformAccount',
        params: ExternalPlatformAccountParamsSchema,
        response: {
          200: PrivateExternalPlatformAccountViewSchema,
          401: ApiErrorEnvelopeSchema,
          403: ApiErrorEnvelopeSchema,
          404: ApiErrorEnvelopeSchema,
        },
        tags: ['private-external-platform-account'],
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
      dependencies.service.getMyExternalPlatformAccount(
        requireAccountContext(request),
        (request.params as { readonly externalPlatformAccountId: string })
          .externalPlatformAccountId,
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
    throw new Error('Private External Platform Account route requires an authenticated Account context.');
  }
  return accountContext;
}
