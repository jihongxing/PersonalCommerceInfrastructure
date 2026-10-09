import type { FastifyInstance, FastifyRequest } from 'fastify';
import { Type } from 'typebox';

import type { PrivateCommerceProfileService } from '../../../applications/private-commerce-profile/private-commerce-profile-service.js';
import { ApplicationError } from '../../../applications/core/application-error.js';
import type { AuthContextProvider } from '../../../applications/core/ports/auth-context-provider.js';
import {
  PrivateCommerceProfileInputSchema,
  PrivateCommerceProfileListSchema,
  PrivateCommerceProfileViewSchema,
} from '../../../contracts/api/v1/private-identity-contracts.js';
import { ApiErrorEnvelopeSchema } from '../../../contracts/api/v1/system-contracts.js';
import { extractBearerToken } from '../../auth/transport/bearer-token.js';

const ProfileParamsSchema = Type.Object(
  {
    profileId: Type.String({ minLength: 1 }),
  },
  { additionalProperties: false },
);

export function registerPrivateCommerceProfileRoutes(
  server: FastifyInstance,
  dependencies: {
    readonly authContextProvider: AuthContextProvider;
    readonly service: PrivateCommerceProfileService;
  },
): void {
  const authenticate = async (request: FastifyRequest): Promise<void> => {
    const accountContext = await dependencies.authContextProvider.resolveAccountContext({
      accessToken: extractBearerToken(request.headers.authorization),
      correlationId: request.id,
    });
    (request as AuthenticatedRequest).accountContext = accountContext;
  };

  server.get(
    '/api/v1/private/profiles',
    {
      schema: {
        operationId: 'listMyCommerceProfiles',
        response: { 200: PrivateCommerceProfileListSchema, 401: ApiErrorEnvelopeSchema, 403: ApiErrorEnvelopeSchema },
        tags: ['private-commerce-profile'],
      },
      preHandler: authenticate,
    },
    async (request) => ({ profiles: await dependencies.service.listMyCommerceProfiles(requireAccountContext(request)) }),
  );

  server.post(
    '/api/v1/private/profiles',
    {
      schema: {
        operationId: 'createMyCommerceProfile',
        body: PrivateCommerceProfileInputSchema,
        response: { 201: PrivateCommerceProfileViewSchema, 400: ApiErrorEnvelopeSchema, 401: ApiErrorEnvelopeSchema, 403: ApiErrorEnvelopeSchema },
        tags: ['private-commerce-profile'],
      },
      preHandler: authenticate,
    },
    async (request, reply) =>
      reply.status(201).send(
        await dependencies.service.createMyCommerceProfile(
          requireAccountContext(request),
          request.body as { readonly displayName: string },
        ),
      ),
  );

  registerProfileRoute(server, dependencies, 'GET', '', 'getMyCommerceProfile', async (accountContext, profileId) =>
    dependencies.service.getMyCommerceProfile(accountContext, profileId),
  );
  registerProfileRoute(server, dependencies, 'PATCH', '', 'updateMyCommerceProfile', async (accountContext, profileId, request) =>
    dependencies.service.updateMyCommerceProfile(accountContext, profileId, request.body as { readonly displayName: string }),
    PrivateCommerceProfileInputSchema,
  );
  registerProfileRoute(server, dependencies, 'POST', '/suspend', 'suspendMyCommerceProfile', async (accountContext, profileId) =>
    dependencies.service.suspendMyCommerceProfile(accountContext, profileId),
  );
  registerProfileRoute(server, dependencies, 'POST', '/archive', 'archiveMyCommerceProfile', async (accountContext, profileId) =>
    dependencies.service.archiveMyCommerceProfile(accountContext, profileId),
  );
  registerProfileRoute(server, dependencies, 'POST', '/reactivate', 'reactivateMyCommerceProfile', async (accountContext, profileId) =>
    dependencies.service.reactivateMyCommerceProfile(accountContext, profileId),
  );
}

function registerProfileRoute(
  server: FastifyInstance,
  dependencies: {
    readonly authContextProvider: AuthContextProvider;
    readonly service: PrivateCommerceProfileService;
  },
  method: 'GET' | 'PATCH' | 'POST',
  suffix: '' | '/suspend' | '/archive' | '/reactivate',
  operationId: string,
  handler: (
    accountContext: NonNullable<AuthenticatedRequest['accountContext']>,
    profileId: string,
    request: FastifyRequest,
  ) => Promise<unknown>,
  body?: typeof PrivateCommerceProfileInputSchema,
): void {
  server.route({
    method,
    url: `/api/v1/private/profiles/:profileId${suffix}`,
    schema: {
      operationId,
      params: ProfileParamsSchema,
      ...(body === undefined ? {} : { body }),
      response: {
        200: PrivateCommerceProfileViewSchema,
        400: ApiErrorEnvelopeSchema,
        401: ApiErrorEnvelopeSchema,
        403: ApiErrorEnvelopeSchema,
        404: ApiErrorEnvelopeSchema,
        409: ApiErrorEnvelopeSchema,
      },
      tags: ['private-commerce-profile'],
    },
    preHandler: async (request) => {
      const accountContext = await dependencies.authContextProvider.resolveAccountContext({
        accessToken: extractBearerToken(request.headers.authorization),
        correlationId: request.id,
      });
      (request as AuthenticatedRequest).accountContext = accountContext;
    },
    handler: async (request) =>
      handler(
        requireAccountContext(request),
        (request.params as { readonly profileId: string }).profileId,
        request,
      ),
  });
}

type AuthenticatedRequest = FastifyRequest & {
  accountContext?: Awaited<ReturnType<AuthContextProvider['resolveAccountContext']>>;
};

function requireAccountContext(request: FastifyRequest): NonNullable<AuthenticatedRequest['accountContext']> {
  const accountContext = (request as AuthenticatedRequest).accountContext;
  if (accountContext === undefined) {
    throw new ApplicationError({
      category: 'authentication',
      code: 'missing_auth_context',
      message: 'Authentication is required.',
    });
  }
  return accountContext;
}
