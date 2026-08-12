import type { FastifyError, FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

import {
  ApplicationError,
  type ApplicationErrorCategory,
} from '../../../applications/core/application-error.js';
import type { SafeLogger } from '../../observability/safe-logger.js';
const statusByCategory: Readonly<Record<ApplicationErrorCategory, number>> = {
  validation: 400,
  authentication: 401,
  authorization: 403,
  not_found: 404,
  conflict: 409,
  unavailable: 422,
  internal: 500,
};

function correlationId(request: FastifyRequest): string {
  return request.id;
}

function applicationErrorFromFastify(error: FastifyError): ApplicationError {
  if (error.validation !== undefined) {
    return new ApplicationError({
      category: 'validation',
      code: 'request_validation_failed',
      message: 'Request validation failed.',
      cause: error,
    });
  }

  return new ApplicationError({
    category: 'internal',
    code: 'internal_error',
    message: 'An unexpected error occurred.',
    cause: error,
  });
}

function sendApplicationError(
  error: ApplicationError,
  request: FastifyRequest,
  reply: FastifyReply,
): void {
  const requestCorrelationId = correlationId(request);

  reply.header('x-correlation-id', requestCorrelationId);
  void reply.status(statusByCategory[error.category]).send({
    error: {
      category: error.category,
      code: error.code,
      correlationId: requestCorrelationId,
      message: error.message,
    },
  });
}

export function registerApiErrorHandling(server: FastifyInstance, logger?: SafeLogger): void {
  server.addHook('onRequest', (request, reply, done) => {
    reply.header('x-correlation-id', correlationId(request));
    done();
  });

  server.setNotFoundHandler((request, reply) => {
    sendApplicationError(
      new ApplicationError({
        category: 'not_found',
        code: 'route_not_found',
        message: 'Route not found.',
      }),
      request,
      reply,
    );
  });

  server.setErrorHandler((error: FastifyError | ApplicationError, request, reply) => {
    if (error instanceof ApplicationError) {
      sendApplicationError(error, request, reply);
      return;
    }

    const applicationError = applicationErrorFromFastify(error);
    if (applicationError.category === 'internal') {
      logger?.error('unhandled_api_error', {
        correlationId: request.id,
        errorName: error.name,
        method: request.method,
        path: request.routeOptions.url ?? request.url,
      });
    }
    sendApplicationError(applicationError, request, reply);
  });
}
