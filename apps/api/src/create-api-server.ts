import swagger from '@fastify/swagger';
import rateLimit from '@fastify/rate-limit';
import { TypeBoxValidatorCompiler } from '@fastify/type-provider-typebox';
import Fastify, { type FastifyInstance } from 'fastify';
import { randomUUID } from 'node:crypto';

import { createInMemoryCreatorIdentityComposition } from '../../../adapters/in-memory/creator-identity-composition.js';
import { registerApiErrorHandling } from '../../../adapters/transport/http/api-error-handler.js';
import type { IQrCodeGenerator } from '../../../adapters/image-generation/qr-code-generator.js';
import { registerCreatorIdentityRoutes } from '../../../adapters/transport/http/creator-identity-routes.js';
import { registerPrivateIdentityRoutes } from '../../../adapters/transport/http/private-identity-routes.js';
import { registerPrivateCommerceProfileRoutes } from '../../../adapters/transport/http/private-commerce-profile-routes.js';
import { registerPrivateCommerceReferenceRoutes } from '../../../adapters/transport/http/private-commerce-reference-routes.js';
import { registerPrivateExternalPlatformAccountRoutes } from '../../../adapters/transport/http/private-external-platform-account-routes.js';
import { registerPrivateCommerceRelationshipRoutes } from '../../../adapters/transport/http/private-commerce-relationship-routes.js';
import { registerPrivateSelfDeclaredExternalRelationshipRoutes } from '../../../adapters/transport/http/private-self-declared-external-relationship-routes.js';
import type { CurrentUserIdentityService } from '../../../applications/account-identity-membership/current-user-identity-service.js';
import type { SelfServiceIdentityInitializationService } from '../../../applications/account-identity-membership/self-service-identity-initialization-service.js';
import type { PrivateCommerceProfileService } from '../../../applications/private-commerce-profile/private-commerce-profile-service.js';
import type { PrivateCommerceReferenceService } from '../../../applications/private-commerce-reference/private-commerce-reference-service.js';
import type { PrivateExternalPlatformAccountService } from '../../../applications/private-external-platform-account/private-external-platform-account-service.js';
import type { PrivateCommerceRelationshipService } from '../../../applications/private-commerce-relationship/private-commerce-relationship-service.js';
import type { PrivateSelfDeclaredExternalRelationshipService } from '../../../applications/private-external-platform-relationship/private-self-declared-external-relationship-service.js';
import { registerCustomerRequestRoutes } from '../../../adapters/transport/http/customer-request-routes.js';
import { registerServiceOfferingRoutes } from '../../../adapters/transport/http/service-offering-routes.js';
import { registerSystemRoutes } from '../../../adapters/transport/http/system-routes.js';
import type { AuthContextProvider } from '../../../applications/core/ports/auth-context-provider.js';
import type { CreatorIdentityService } from '../../../applications/creator-identity/creator-identity-service.js';
import type { ServiceOfferingService } from '../../../applications/service-offering/offering-service.js';
import type { CustomerRequestService } from '../../../applications/customer-request/customer-request-service.js';
import type { SafeLogger } from '../../../adapters/observability/safe-logger.js';
import type { PerformanceMonitor } from '../../../adapters/observability/performance-monitor.js';
import { registerExternalObservationRoutes } from '../../../adapters/transport/http/external-observation-routes.js';
import type { OperationsAuthContextProvider } from '../../../applications/core/ports/operations-auth-context-provider.js';
import type { RecordExternalObservationUseCase } from '../../../applications/shadow-commerce/external-observation-use-cases.js';
import type { PaidCommerceService } from '../../../applications/paid-commerce/paid-commerce-service.js';
import { registerPaidCommerceRoutes } from '../../../adapters/transport/http/paid-commerce-routes.js';
import { registerLocalCommerceSimulationRoutes } from '../../../adapters/transport/http/local-commerce-simulation-routes.js';
import { registerLocalPaidCommerceProductRoutes } from '../../../adapters/transport/http/local-paid-commerce-product-routes.js';
import type { LocalCommerceSimulationService } from '../../../applications/paid-commerce/local-commerce-simulation-service.js';
import type { LocalPaidCommerceProductService } from '../../../applications/paid-commerce/local-paid-commerce-product-service.js';
import { registerProviderWebhookRoutes } from '../../../adapters/transport/http/provider-webhook-routes.js';
import type { ProviderWebhookRuntime } from '../../../applications/paid-commerce/provider-webhook-runtime.js';
import { registerCommercialPilotOperationsRoutes } from '../../../adapters/transport/http/commercial-pilot-operations-routes.js';
import type { CommercialPilotOperationsService } from '../../../applications/paid-commerce/commercial-pilot-operations.js';
import type { ReservationService } from '../../../applications/reservation/reservation-service.js';
import { registerReservationRoutes } from '../../../adapters/transport/http/reservation-routes.js';
import type { ContractService } from '../../../applications/contract-commerce/contract-service.js';
import { registerContractRoutes } from '../../../adapters/transport/http/contract-routes.js';

export interface ApiServerDependencies {
  readonly authContextProvider?: AuthContextProvider;
  readonly creatorIdentityService?: CreatorIdentityService;
  readonly currentUserIdentityService?: CurrentUserIdentityService;
  readonly selfServiceIdentityInitializationService?: SelfServiceIdentityInitializationService;
  readonly privateCommerceProfileService?: PrivateCommerceProfileService;
  readonly privateCommerceReferenceService?: PrivateCommerceReferenceService;
  readonly privateExternalPlatformAccountService?: PrivateExternalPlatformAccountService;
  readonly privateCommerceRelationshipService?: PrivateCommerceRelationshipService;
  readonly privateSelfDeclaredExternalRelationshipService?: PrivateSelfDeclaredExternalRelationshipService;
  readonly serviceOfferingService?: ServiceOfferingService;
  readonly customerRequestService?: CustomerRequestService;
  readonly qrCodeGenerator?: IQrCodeGenerator;
  readonly operationsAuthContextProvider?: OperationsAuthContextProvider;
  readonly recordExternalObservation?: RecordExternalObservationUseCase;
  readonly paidCommerceService?: PaidCommerceService;
  readonly localCommerceSimulationService?: LocalCommerceSimulationService;
  readonly localPaidCommerceProductService?: LocalPaidCommerceProductService;
  readonly providerWebhookRuntime?: ProviderWebhookRuntime;
  readonly commercialPilotOperationsService?: CommercialPilotOperationsService;
  readonly reservationService?: ReservationService;
  readonly contractService?: ContractService;
  readonly corsAllowedOrigins?: readonly string[];
  readonly publicOrigin?: string;
  readonly checkReadiness?: () => Promise<void>;
  readonly logger?: SafeLogger;
  readonly performanceMonitor?: PerformanceMonitor;
}

export async function createApiServer(
  dependencies: ApiServerDependencies = {},
): Promise<FastifyInstance> {
  const server = Fastify({
    genReqId: () => randomUUID(),
    requestIdHeader: 'x-correlation-id',
  });
  const composition = createInMemoryCreatorIdentityComposition(dependencies.publicOrigin);
  const hasExternalComposition =
    dependencies.authContextProvider !== undefined ||
    dependencies.creatorIdentityService !== undefined ||
    dependencies.currentUserIdentityService !== undefined ||
    dependencies.selfServiceIdentityInitializationService !== undefined ||
    dependencies.privateCommerceProfileService !== undefined ||
    dependencies.privateCommerceReferenceService !== undefined ||
    dependencies.privateCommerceRelationshipService !== undefined ||
    dependencies.privateSelfDeclaredExternalRelationshipService !== undefined ||
    dependencies.serviceOfferingService !== undefined ||
    dependencies.customerRequestService !== undefined ||
    dependencies.operationsAuthContextProvider !== undefined ||
    dependencies.recordExternalObservation !== undefined ||
    dependencies.paidCommerceService !== undefined ||
    dependencies.localPaidCommerceProductService !== undefined ||
    dependencies.commercialPilotOperationsService !== undefined ||
    dependencies.reservationService !== undefined ||
    dependencies.contractService !== undefined ||
    dependencies.providerWebhookRuntime !== undefined;

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

  // Performance monitoring hook
  if (dependencies.performanceMonitor !== undefined) {
    server.addHook('onResponse', (_request, _reply, done) => {
      // Performance metrics recorded by onResponse hook
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

  // Register rate limiting before routes
  await server.register(rateLimit, {
    max: 100, // 每个 IP 每分钟 100 次请求
    timeWindow: '1 minute',
    skipOnError: false,
    errorResponseBuilder: (_request, context) => ({
      error: 'TOO_MANY_REQUESTS',
      message: `Rate limit exceeded. Retry after ${context.after}`,
      statusCode: 429,
    }),
  });

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
        { name: 'private-identity', description: 'Authenticated Internal Identity.' },
        {
          name: 'private-commerce-profile',
          description: 'Authenticated Commerce Profile management.',
        },
        {
          name: 'private-commerce-reference',
          description: 'Authenticated Commerce Reference viewing.',
        },
        { name: 'service-offering', description: 'Creator Service Offerings.' },
        { name: 'customer-request', description: 'Public Storefront and Customer Requests.' },
        { name: 'external-observation', description: 'Pilot Operations external facts.' },
        { name: 'paid-commerce', description: 'VS-02 controlled paid-service earnings flow.' },
        { name: 'contract-commerce', description: 'Provider-neutral Quote then Accept contracts.' },
        {
          name: 'provider-webhook',
          description: 'Provider-neutral signed event receipt boundary.',
        },
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
  registerPrivateIdentityRoutes(server, {
    authContextProvider: dependencies.authContextProvider ?? composition.authContextProvider,
    service:
      dependencies.currentUserIdentityService ?? composition.currentUserIdentityService,
    initializationService:
      dependencies.selfServiceIdentityInitializationService ??
      composition.selfServiceIdentityInitializationService,
  });
  registerPrivateCommerceProfileRoutes(server, {
    authContextProvider: dependencies.authContextProvider ?? composition.authContextProvider,
    service:
      dependencies.privateCommerceProfileService ?? composition.privateCommerceProfileService,
  });
  registerPrivateCommerceReferenceRoutes(server, {
    authContextProvider: dependencies.authContextProvider ?? composition.authContextProvider,
    service:
      dependencies.privateCommerceReferenceService ?? composition.privateCommerceReferenceService,
  });
  registerPrivateExternalPlatformAccountRoutes(server, {
    authContextProvider: dependencies.authContextProvider ?? composition.authContextProvider,
    service:
      dependencies.privateExternalPlatformAccountService ??
      composition.privateExternalPlatformAccountService,
  });
  registerPrivateCommerceRelationshipRoutes(server, {
    authContextProvider: dependencies.authContextProvider ?? composition.authContextProvider,
    service:
      dependencies.privateCommerceRelationshipService ??
      composition.privateCommerceRelationshipService,
  });
  registerPrivateSelfDeclaredExternalRelationshipRoutes(server, {
    authContextProvider: dependencies.authContextProvider ?? composition.authContextProvider,
    service:
      dependencies.privateSelfDeclaredExternalRelationshipService ??
      composition.privateSelfDeclaredExternalRelationshipService,
  });
  registerServiceOfferingRoutes(server, {
    authContextProvider: dependencies.authContextProvider ?? composition.authContextProvider,
    service: dependencies.serviceOfferingService ?? composition.offeringService,
  });
  registerCustomerRequestRoutes(server, {
    service: dependencies.customerRequestService ?? composition.customerRequestService,
    authContextProvider: dependencies.authContextProvider ?? composition.authContextProvider,
    qrCodeGenerator: dependencies.qrCodeGenerator ?? composition.qrCodeGenerator,
  });
  registerExternalObservationRoutes(server, {
    authContextProvider:
      dependencies.operationsAuthContextProvider ?? composition.operationsAuthContextProvider,
    recordObservation:
      dependencies.recordExternalObservation ?? composition.recordExternalObservation,
  });
  registerPaidCommerceRoutes(server, {
    service: dependencies.paidCommerceService ?? composition.paidCommerceService,
    authContextProvider: dependencies.authContextProvider ?? composition.authContextProvider,
    operationsAuthContextProvider:
      dependencies.operationsAuthContextProvider ?? composition.operationsAuthContextProvider,
  });
  registerReservationRoutes(server, {
    service: dependencies.reservationService ?? composition.reservationService,
    authContextProvider: dependencies.authContextProvider ?? composition.authContextProvider,
  });
  registerContractRoutes(server, {
    service: dependencies.contractService ?? composition.contractService,
    paidCommerceService: dependencies.paidCommerceService ?? composition.paidCommerceService,
    authContextProvider: dependencies.authContextProvider ?? composition.authContextProvider,
  });
  const localCommerceSimulationService =
    dependencies.localCommerceSimulationService ??
    (hasExternalComposition ? undefined : composition.localCommerceSimulationService);
  if (localCommerceSimulationService !== undefined) {
    registerLocalCommerceSimulationRoutes(server, {
      service: localCommerceSimulationService,
      operationsAuthContextProvider:
        dependencies.operationsAuthContextProvider ?? composition.operationsAuthContextProvider,
    });
  }
  const localPaidCommerceProductService =
    dependencies.localPaidCommerceProductService ??
    (hasExternalComposition ? undefined : composition.localPaidCommerceProductService);
  if (localPaidCommerceProductService !== undefined) {
    registerLocalPaidCommerceProductRoutes(server, {
      service: localPaidCommerceProductService,
      authContextProvider: dependencies.authContextProvider ?? composition.authContextProvider,
    });
  }
  registerProviderWebhookRoutes(server, {
    runtime: dependencies.providerWebhookRuntime ?? composition.providerWebhookRuntime,
  });
  registerCommercialPilotOperationsRoutes(server, {
    authContextProvider:
      dependencies.operationsAuthContextProvider ?? composition.operationsAuthContextProvider,
    service:
      dependencies.commercialPilotOperationsService ?? composition.commercialPilotOperationsService,
  });

  server.get('/openapi.json', async (_request, reply) => {
    await reply.send(server.swagger());
  });

  await server.ready();
  return server;
}
