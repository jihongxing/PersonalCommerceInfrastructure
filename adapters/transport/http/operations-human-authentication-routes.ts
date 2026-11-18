import type { FastifyInstance } from 'fastify';
import { Type } from 'typebox';

import { ApplicationError } from '../../../applications/core/application-error.js';
import {
  OperationsHumanAuthenticationError,
  type OperationsHumanAuthenticationRuntime,
} from '../../../applications/operations-identity/operations-human-authentication.js';
import { OperationsSessionNotAuthenticatedError } from '../../../applications/operations-identity/operations-session-repositories.js';
import { extractBearerToken } from '../../auth/transport/bearer-token.js';
import { ApiErrorEnvelopeSchema } from '../../../contracts/api/v1/system-contracts.js';

import {
  OperationsLoginBodySchema,
  OperationsLoginResponseSchema,
  OperationsCurrentSessionResponseSchema,
} from '../../../contracts/api/v1/operations-human-authentication-contracts.js';

export function registerOperationsHumanAuthenticationRoutes(
  server: FastifyInstance,
  runtime: OperationsHumanAuthenticationRuntime,
): void {
  server.addHook('onSend', async (request, reply) => {
    if (request.url.startsWith('/api/v1/operations/auth/'))
      reply.header('cache-control', 'no-store');
  });
  server.post<{ Body: { loginIdentifier: string; password: string } }>(
    '/api/v1/operations/auth/login',
    {
      schema: {
        body: OperationsLoginBodySchema,
        response: {
          200: OperationsLoginResponseSchema,
          401: ApiErrorEnvelopeSchema,
        },
        tags: ['operations-authentication'],
      },
      config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
    },
    async (request) => {
      try {
        const result = await runtime.login({
          loginIdentifier: request.body.loginIdentifier,
          password: request.body.password,
          correlationId: request.id,
        });
        return {
          credential: result.credential,
          principalId: result.principalId,
          accountId: result.accountId,
          sessionId: result.sessionId,
          absoluteExpiresAt: result.absoluteExpiresAt.toISOString(),
          permissions: result.permissions,
        };
      } catch (error) {
        throw authenticationError(error);
      }
    },
  );

  server.get(
    '/api/v1/operations/auth/session',
    {
      schema: {
        response: { 200: OperationsCurrentSessionResponseSchema, 401: ApiErrorEnvelopeSchema },
        tags: ['operations-authentication'],
      },
    },
    async (request) => {
      try {
        const context = await runtime.resolveActorContext({
          accessToken: extractBearerToken(request.headers.authorization),
          correlationId: request.id,
        });
        if (context.actor.kind !== 'operations_human')
          throw new OperationsHumanAuthenticationError();
        return {
          principalId: context.actor.principalId,
          accountId: context.actor.accountId,
          sessionId: context.actor.sessionId,
          permissions: context.actor.permissions,
        };
      } catch (error) {
        throw authenticationError(error);
      }
    },
  );

  server.post(
    '/api/v1/operations/auth/logout',
    {
      schema: {
        response: { 204: Type.Null(), 401: ApiErrorEnvelopeSchema },
        tags: ['operations-authentication'],
      },
    },
    async (request, reply) => {
      try {
        await runtime.logout({
          credential: extractBearerToken(request.headers.authorization),
          correlationId: request.id,
        });
        return reply.status(204).send();
      } catch (error) {
        throw authenticationError(error);
      }
    },
  );
}

export function authenticationError(error: unknown): ApplicationError {
  if (error instanceof ApplicationError) return error;
  if (
    error instanceof OperationsHumanAuthenticationError ||
    error instanceof OperationsSessionNotAuthenticatedError
  ) {
    return new ApplicationError({
      category: 'authentication',
      code: 'invalid_operations_credentials',
      message: 'Operations authentication could not be verified.',
    });
  }
  return new ApplicationError({
    category: 'unavailable',
    code: 'operations_auth_unavailable',
    message: 'Operations authentication is temporarily unavailable.',
  });
}
