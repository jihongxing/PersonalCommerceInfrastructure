import swagger from '@fastify/swagger';
import { TypeBoxValidatorCompiler } from '@fastify/type-provider-typebox';
import Fastify, { type FastifyInstance } from 'fastify';

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

export interface ApiServerDependencies {
  readonly authContextProvider?: AuthContextProvider;
  readonly creatorIdentityService?: CreatorIdentityService;
  readonly serviceOfferingService?: ServiceOfferingService;
  readonly customerRequestService?: CustomerRequestService;
  readonly corsAllowedOrigins?: readonly string[];
  readonly publicOrigin?: string;
}

export async function createApiServer(
  dependencies: ApiServerDependencies = {},
): Promise<FastifyInstance> {
  const server = Fastify();
  const composition = createInMemoryCreatorIdentityComposition(dependencies.publicOrigin);

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

  registerApiErrorHandling(server);
  registerSystemRoutes(server);
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
