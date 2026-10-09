import type { FastifyInstance, FastifyRequest } from 'fastify';

import { ApplicationError } from '../../../applications/core/application-error.js';
import type { CurrentUserIdentityService } from '../../../applications/account-identity-membership/current-user-identity-service.js';
import type { SelfServiceIdentityInitializationService } from '../../../applications/account-identity-membership/self-service-identity-initialization-service.js';
import type { AuthContextProvider } from '../../../applications/core/ports/auth-context-provider.js';
import { ApiErrorEnvelopeSchema } from '../../../contracts/api/v1/system-contracts.js';
import { PrivateIdentityViewSchema } from '../../../contracts/api/v1/private-identity-contracts.js';
import { extractBearerToken } from '../../auth/transport/bearer-token.js';

export function registerPrivateIdentityRoutes(
  server: FastifyInstance,
  dependencies: {
    readonly authContextProvider: AuthContextProvider;
    readonly service: CurrentUserIdentityService;
    readonly initializationService: SelfServiceIdentityInitializationService;
  },
): void {
  server.post(
    '/api/v1/private/onboarding/initialize',
    {
      schema: {
        operationId: 'initializePrivateIdentityOnboarding',
        response: {
          200: PrivateIdentityViewSchema,
          401: ApiErrorEnvelopeSchema,
          403: ApiErrorEnvelopeSchema,
          409: ApiErrorEnvelopeSchema,
        },
        tags: ['private-identity'],
      },
      preHandler: async (request: FastifyRequest) => {
        const accountContext = await dependencies.authContextProvider.resolveAccountContext({
          accessToken: extractBearerToken(request.headers.authorization),
          correlationId: request.id,
        });
        if (
          request.body !== undefined &&
          (typeof request.body !== 'object' ||
            request.body === null ||
            Object.keys(request.body).length > 0)
        ) {
          throw new ApplicationError({
            category: 'validation',
            code: 'request_validation_failed',
            message: 'Request validation failed.',
          });
        }
        (request as FastifyRequest & { accountContext?: typeof accountContext }).accountContext =
          accountContext;
      },
    },
    async (request) => {
      const accountContext = (
        request as FastifyRequest & {
          accountContext?: Awaited<
            ReturnType<AuthContextProvider['resolveAccountContext']>
          >;
        }
      ).accountContext;
      if (accountContext === undefined) {
        throw new ApplicationError({
          category: 'authentication',
          code: 'missing_auth_context',
          message: 'Authentication is required.',
        });
      }
      return dependencies.initializationService.initializeAuthenticatedIdentity(accountContext);
    },
  );

  server.get(
    '/api/v1/private/identity',
    {
      schema: {
        operationId: 'getCurrentPrivateIdentity',
        response: {
          200: PrivateIdentityViewSchema,
          401: ApiErrorEnvelopeSchema,
          403: ApiErrorEnvelopeSchema,
        },
        tags: ['private-identity'],
      },
      preHandler: async (request: FastifyRequest) => {
        const accountContext = await dependencies.authContextProvider.resolveAccountContext({
          accessToken: extractBearerToken(request.headers.authorization),
          correlationId: request.id,
        });
        (request as FastifyRequest & { accountContext?: typeof accountContext }).accountContext =
          accountContext;
      },
    },
    async (request) => {
      const accountContext = (
        request as FastifyRequest & {
          accountContext?: Awaited<
            ReturnType<AuthContextProvider['resolveAccountContext']>
          >;
        }
      ).accountContext;
      if (accountContext === undefined) {
        throw new ApplicationError({
          category: 'authentication',
          code: 'missing_auth_context',
          message: 'Authentication is required.',
        });
      }
      return dependencies.service.getCurrentIdentity(accountContext);
    },
  );
}
