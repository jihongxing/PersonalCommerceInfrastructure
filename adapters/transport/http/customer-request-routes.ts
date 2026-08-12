import type { FastifyInstance, FastifyRequest } from 'fastify';
import { Type } from 'typebox';

import { extractBearerToken } from '../../auth/transport/bearer-token.js';
import type { ActorContext } from '../../../applications/core/actor-context.js';
import { ApplicationError } from '../../../applications/core/application-error.js';
import type { AuthContextProvider } from '../../../applications/core/ports/auth-context-provider.js';
import type { CustomerRequestService } from '../../../applications/customer-request/customer-request-service.js';
import type { SubmitCustomerRequestCommand } from '../../../applications/customer-request/customer-request-use-cases.js';
import {
  CustomerRequestResultSchema,
  CreatorDecisionResponseSchema,
  CreatorSubmittedRequestListSchema,
  PublicOfferingResponseSchema,
  SubmitCustomerRequestSchema,
} from '../../../contracts/api/v1/customer-request-contracts.js';
import { ApiErrorEnvelopeSchema } from '../../../contracts/api/v1/system-contracts.js';

export function registerCustomerRequestRoutes(
  server: FastifyInstance,
  dependencies: {
    readonly service: CustomerRequestService;
    readonly authContextProvider: AuthContextProvider;
  },
): void {
  const params = Type.Object({ offeringId: Type.String({ minLength: 1 }) });
  const actionParams = Type.Object({ actionId: Type.String({ minLength: 1 }) });

  interface AuthenticatedRequest extends FastifyRequest {
    authContext?: ActorContext;
  }

  const authenticate = async (request: AuthenticatedRequest): Promise<void> => {
    const accessToken = extractBearerToken(request.headers.authorization);
    request.authContext = await dependencies.authContextProvider.resolveActorContext({
      accessToken,
      correlationId: request.id,
    });
  };

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

  server.get(
    '/api/v1/public/offerings/:offeringId',
    {
      schema: {
        operationId: 'getPublicServiceOffering',
        params,
        response: {
          200: PublicOfferingResponseSchema,
          422: ApiErrorEnvelopeSchema,
        },
        tags: ['customer-request'],
      },
    },
    async (request) => {
      const { offeringId } = request.params as { readonly offeringId: string };
      return dependencies.service.getPublicOffering(offeringId, { correlationId: request.id });
    },
  );

  server.post(
    '/api/v1/public/offerings/:offeringId/requests',
    {
      schema: {
        operationId: 'submitCustomerRequest',
        params,
        body: SubmitCustomerRequestSchema,
        response: {
          201: CustomerRequestResultSchema,
          400: ApiErrorEnvelopeSchema,
          409: ApiErrorEnvelopeSchema,
          422: ApiErrorEnvelopeSchema,
        },
        tags: ['customer-request'],
      },
    },
    async (request, reply) => {
      const { offeringId } = request.params as { readonly offeringId: string };
      const action = await dependencies.service.submit(
        {
          offeringId,
          ...(request.body as Omit<SubmitCustomerRequestCommand, 'offeringId'>),
        },
        { correlationId: request.id },
      );
      return reply.status(201).send({
        actionId: action.id,
        state: action.state,
        resultAccessToken: action.resultAccessToken,
        message:
          "Your Request was submitted and is waiting for the Creator. This status records only the Creator's response to your Request.",
      });
    },
  );

  server.get(
    '/api/v1/public/requests/:resultAccessToken',
    {
      schema: {
        operationId: 'getCustomerRequestResult',
        params: Type.Object({ resultAccessToken: Type.String({ minLength: 1 }) }),
        response: {
          200: CustomerRequestResultSchema,
          404: ApiErrorEnvelopeSchema,
        },
        tags: ['customer-request'],
      },
    },
    async (request) => {
      const { resultAccessToken } = request.params as { readonly resultAccessToken: string };
      const result = await dependencies.service.getResult(resultAccessToken);
      return {
        ...result,
        resultAccessToken,
      };
    },
  );

  server.get(
    '/api/v1/creator/requests',
    {
      schema: {
        operationId: 'listCreatorSubmittedRequests',
        response: {
          200: CreatorSubmittedRequestListSchema,
          401: ApiErrorEnvelopeSchema,
        },
        tags: ['customer-request'],
      },
      preHandler: authenticate,
    },
    async (request) => ({
      requests: await dependencies.service.listCreatorSubmittedRequests(requireContext(request)),
    }),
  );

  server.post(
    '/api/v1/creator/requests/:actionId/confirm',
    {
      schema: {
        operationId: 'confirmCreatorRequest',
        params: actionParams,
        response: {
          200: CreatorDecisionResponseSchema,
          401: ApiErrorEnvelopeSchema,
          403: ApiErrorEnvelopeSchema,
          404: ApiErrorEnvelopeSchema,
          409: ApiErrorEnvelopeSchema,
        },
        tags: ['customer-request'],
      },
      preHandler: authenticate,
    },
    async (request) => {
      const { actionId } = request.params as { readonly actionId: string };
      const action = await dependencies.service.confirm(actionId, requireContext(request));
      return {
        actionId: action.id,
        state: action.state,
        resultAccessToken: action.resultAccessToken,
      };
    },
  );

  server.post(
    '/api/v1/creator/requests/:actionId/decline',
    {
      schema: {
        operationId: 'declineCreatorRequest',
        params: actionParams,
        response: {
          200: CreatorDecisionResponseSchema,
          401: ApiErrorEnvelopeSchema,
          403: ApiErrorEnvelopeSchema,
          404: ApiErrorEnvelopeSchema,
          409: ApiErrorEnvelopeSchema,
        },
        tags: ['customer-request'],
      },
      preHandler: authenticate,
    },
    async (request) => {
      const { actionId } = request.params as { readonly actionId: string };
      const action = await dependencies.service.decline(actionId, requireContext(request));
      return {
        actionId: action.id,
        state: action.state,
        resultAccessToken: action.resultAccessToken,
      };
    },
  );
}
