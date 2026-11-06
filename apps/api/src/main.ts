import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import {
  loadAuthConfiguration,
  loadConfiguration,
  loadDatabaseConfiguration,
  loadOperationsAuthConfiguration,
  loadRealMoneyRuntimeConfiguration,
} from '../../prototype/src/configuration/bootstrap.js';
import { QrCodeGeneratorImpl } from '../../../adapters/image-generation/qr-code-generator.js';
import {
  createPostgresCreatorIdentityComposition,
  type CreatorIdentityAuthConfiguration,
  type CreatorIdentityDatabaseConfiguration,
} from '../../../adapters/persistence/postgres/postgres-creator-identity-composition.js';
import { InMemoryAuthContextProvider } from '../../../adapters/auth/testing/in-memory-auth-context-provider.js';
import { LogNotificationAdapter } from '../../../adapters/notifications/log-notification-adapter.js';
import { createSafeLogger } from '../../../adapters/observability/safe-logger.js';
import { createPerformanceMonitor } from '../../../adapters/observability/performance-monitor.js';
import { createApiServer } from './create-api-server.js';
import { installGracefulShutdown, type ApiRuntime } from './runtime-lifecycle.js';

export async function startApi(): Promise<ApiRuntime> {
  const configuration = loadConfiguration();
  const usePostgresTestComposition =
    configuration.environment === 'test' && configuration.usePostgresTestComposition;
  const realMoneyRuntime = loadRealMoneyRuntimeConfiguration();
  const logger = createSafeLogger(configuration.logLevel);
  const performanceMonitor = createPerformanceMonitor({
    mode: configuration.environment === 'production' ? 'aggregate' : 'console',
    enabled: true,
  });
  logger.info('real_money_runtime_configured', {
    runtimeEnvironment: realMoneyRuntime.runtimeEnvironment,
    realMoneyEnabled: realMoneyRuntime.realMoneyEnabled,
    founderActivationReference: realMoneyRuntime.founderActivationReference ?? 'none',
    liveProviderId: realMoneyRuntime.provider?.providerId ?? 'none',
    liveProviderConfigured: realMoneyRuntime.provider !== undefined,
  });
  const composition =
    configuration.environment === 'test' && !usePostgresTestComposition
      ? undefined
      : createPostgresCreatorIdentityComposition(
          loadDatabaseConfiguration() satisfies CreatorIdentityDatabaseConfiguration,
          loadAuthConfiguration() satisfies CreatorIdentityAuthConfiguration,
          configuration.webReferenceClientOrigin,
          new LogNotificationAdapter(logger),
          loadOperationsAuthConfiguration(),
          {
            runtimeEnvironment: realMoneyRuntime.runtimeEnvironment,
            realMoneyEnabled: realMoneyRuntime.realMoneyEnabled,
            ...(realMoneyRuntime.founderActivationReference === undefined
              ? {}
              : { founderActivationReference: realMoneyRuntime.founderActivationReference }),
            liveProviderConfigured: realMoneyRuntime.provider !== undefined,
          },
        );
  const server = await createApiServer(
    composition === undefined
      ? {
          corsAllowedOrigins: [configuration.webReferenceClientOrigin],
          publicOrigin: configuration.webReferenceClientOrigin,
        }
      : {
          authContextProvider: usePostgresTestComposition
            ? new InMemoryAuthContextProvider([
                {
                  accessToken: 'test-creator-token',
                  actor: { kind: 'creator', creatorId: 'creator-test-1' },
                },
                {
                  accessToken: 'test-other-creator-token',
                  actor: { kind: 'creator', creatorId: 'creator-test-2' },
                },
              ])
            : composition.authContextProvider,
          creatorIdentityService: composition.service,
          serviceOfferingService: composition.offeringService,
          customerRequestService: composition.customerRequestService,
          qrCodeGenerator: new QrCodeGeneratorImpl(),
          operationsAuthContextProvider: composition.operationsAuthContextProvider,
          recordExternalObservation: composition.recordExternalObservation,
          paidCommerceService: composition.paidCommerceService,
          ...(composition.localCommerceSimulationService === undefined
            ? {}
            : { localCommerceSimulationService: composition.localCommerceSimulationService }),
          ...(composition.localPaidCommerceProductService === undefined
            ? {}
            : { localPaidCommerceProductService: composition.localPaidCommerceProductService }),
          providerWebhookRuntime: composition.providerWebhookRuntime,
          commercialPilotOperationsService: composition.commercialPilotOperationsService,
          reservationService: composition.reservationService,
          contractService: composition.contractService,
          currentUserIdentityService: composition.currentUserIdentityService,
          selfServiceIdentityInitializationService: composition.selfServiceIdentityInitializationService,
          privateCommerceProfileService: composition.privateCommerceProfileService,
          privateCommerceReferenceService: composition.privateCommerceReferenceService,
          privateExternalPlatformAccountService: composition.privateExternalPlatformAccountService,
          privateCommerceRelationshipService: composition.privateCommerceRelationshipService,
          privateSelfDeclaredExternalRelationshipService:
            composition.privateSelfDeclaredExternalRelationshipService,
          database: composition.database, // 用于公开 Creator Profile API
          checkReadiness: () => composition.database.checkReadiness(),
          corsAllowedOrigins: [configuration.webReferenceClientOrigin],
          logger,
          performanceMonitor,
          publicOrigin: configuration.webReferenceClientOrigin,
        },
  );

  try {
    await server.listen({
      host: configuration.apiHost,
      port: configuration.apiPort,
    });
    logger.info('api_started', {
      environment: configuration.environment,
      host: configuration.apiHost,
      port: configuration.apiPort,
    });
  } catch (error) {
    if (composition !== undefined) {
      await composition.database.close();
    }
    throw error;
  }

  return {
    server,
    close: async () => {
      await server.close();
      if (composition !== undefined) {
        await composition.database.close();
      }
    },
  };
}

const entryPath = process.argv[1];

if (entryPath !== undefined && import.meta.url === pathToFileURL(resolve(entryPath)).href) {
  try {
    const runtime = await startApi();
    const configuration = loadConfiguration();
    installGracefulShutdown(runtime, createSafeLogger(configuration.logLevel));
  } catch (error) {
    const logger = createSafeLogger('error');
    logger.error('api_start_failed', {
      errorName: error instanceof Error ? error.name : 'UnknownError',
    });
    process.exitCode = 1;
  }
}
