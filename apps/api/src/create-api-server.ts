import swagger from '@fastify/swagger';
import { TypeBoxValidatorCompiler } from '@fastify/type-provider-typebox';
import Fastify, { type FastifyInstance } from 'fastify';
import { randomUUID } from 'node:crypto';

import { createInMemoryCreatorIdentityComposition } from '../../../adapters/in-memory/creator-identity-composition.js';
import { registerApiErrorHandling } from '../../../adapters/transport/http/api-error-handler.js';
import { registerCreatorIdentityRoutes } from '../../../adapters/transport/http/creator-identity-routes.js';
import { registerCustomerRequestRoutes } from '../../../adapters/transport/http/customer-request-routes.js';
import { registerServiceOfferingRoutes } from '../../../adapters/transport/http/service-offering-routes.js';
import { registerSystemRoutes } from '../../../adapters/transport/http/system-routes.js';
import type { AuthContextProvider } from '../../../applications/core/ports/auth-context-provider.js';
import type { CreatorIdentityService } from '../../../applications/creator-identity/creator-identity-service.js';
import type { ServiceOfferingService } from '../../../applications/service-offering/offering-service.js';
import type { CustomerRequestService } from '../../../applications/customer-request/customer-request-service.js';
import type { SafeLogger } from '../../../adapters/observability/safe-logger.js';

export interface ApiServerDependencies {
  readonly authContextProvider?: AuthContextProvider;
  readonly creatorIdentityService?: CreatorIdentityService;
  readonly serviceOfferingService?: ServiceOfferingService;
  readonly customerRequestService?: CustomerRequestService;
  readonly corsAllowedOrigins?: readonly string[];
  readonly publicOrigin?: string;
  readonly checkReadiness?: () => Promise<void>;
  readonly logger?: SafeLogger;
}

export async function createApiServer(
  dependencies: ApiServerDependencies = {},
): Promise<FastifyInstance> {
  const server = Fastify({
    genReqId: () => randomUUID(),
    requestIdHeader: 'x-correlation-id',
  });
  const composition = createInMemoryCreatorIdentityComposition(dependencies.publicOrigin);

  if (dependencies.logger !== undefined) {
    server.addHook('onRequest', (request, _reply, done) => {
      dependencies.logger?.info('api_request_started', {
        correlationId: request.id,
        method: request.method,
        path: request.routeOptions.url ?? request.url,
      });
      done();
    });
    server.addHook('onResponse', (request, reply, done) => {
      dependencies.logger?.info('api_request_completed', {
        correlationId: request.id,
        method: request.method,
        path: request.routeOptions.url ?? request.url,
        statusCode: reply.statusCode,
      });
      done();
    });
  }

  server.addHook('onRequest', async (request, reply) => {
    const origin = request.headers.origin;
    if (origin !== undefined && dependencies.corsAllowedOrigins?.includes(origin) === true) {
      reply.header('access-control-allow-origin', origin);
      reply.header('vary', 'Origin');
      reply.header('access-control-allow-headers', 'authorization, content-type');
      reply.header('access-control-allow-methods', 'GET, POST, PATCH, OPTIONS');
    }

    if (request.method === 'OPTIONS') {
      await reply.status(204).send();
    }
  });

  server.setValidatorCompiler(TypeBoxValidatorCompiler);

  await server.register(swagger, {
    openapi: {
      info: {
        title: 'Personal Commerce Infrastructure API',
        version: '0.1.0',
      },
      openapi: '3.0.3',
      tags: [
        { name: 'system', description: 'API runtime health and readiness.' },
        { name: 'creator-identity', description: 'Creator Commerce Identity.' },
        { name: 'service-offering', description: 'Creator Service Offerings.' },
        { name: 'customer-request', description: 'Public Storefront and Customer Requests.' },
      ],
    },
  });

  registerApiErrorHandling(server, dependencies.logger);
  registerSystemRoutes(
    server,
    dependencies.checkReadiness === undefined
      ? {}
      : {
          checkReadiness: dependencies.checkReadiness,
        },
  );
  registerCreatorIdentityRoutes(server, {
    authContextProvider: dependencies.authContextProvider ?? composition.authContextProvider,
    service: dependencies.creatorIdentityService ?? composition.service,
  });
  registerServiceOfferingRoutes(server, {
    authContextProvider: dependencies.authContextProvider ?? composition.authContextProvider,
    service: dependencies.serviceOfferingService ?? composition.offeringService,
  });
  registerCustomerRequestRoutes(server, {
    service: dependencies.customerRequestService ?? composition.customerRequestService,
    authContextProvider: dependencies.authContextProvider ?? composition.authContextProvider,
  });

  server.get('/openapi.json', async (_request, reply) => {
    await reply.send(server.swagger());
  });

  await server.ready();
  return server;
}
