import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import {
  loadConfiguration,
  loadDatabaseConfiguration,
  loadOperationsAuthConfiguration,
  loadRealMoneyRuntimeConfiguration,
} from '../../prototype/src/configuration/bootstrap.js';
import { QrCodeGeneratorImpl } from '../../../adapters/image-generation/qr-code-generator.js';
import {
  createPostgresCreatorIdentityComposition,
  type CreatorIdentityDatabaseConfiguration,
} from '../../../adapters/persistence/postgres/postgres-creator-identity-composition.js';
import { InMemoryAuthContextProvider } from '../../../adapters/auth/testing/in-memory-auth-context-provider.js';
import { LogNotificationAdapter } from '../../../adapters/notifications/log-notification-adapter.js';
import { createPostgresDatabase } from '../../../adapters/persistence/postgres/postgres-database.js';
import { createPostgresOperationsIdentityComposition } from '../../../adapters/persistence/postgres/postgres-operations-identity-composition.js';
import {
  productionOperationsDatabaseUrl,
  verifyProductionOperationsRuntime,
} from '../../../adapters/persistence/postgres/production-operations-runtime.js';
import { ResendPasswordResetDelivery } from '../../../adapters/notifications/resend-password-reset-delivery.js';
import { createSafeLogger } from '../../../adapters/observability/safe-logger.js';
import { createPerformanceMonitor } from '../../../adapters/observability/performance-monitor.js';
import { loadTracingConfiguration, startTracing } from '../../../adapters/observability/tracing.js';
import { createApiServer } from './create-api-server.js';
import { installGracefulShutdown, type ApiRuntime } from './runtime-lifecycle.js';
import { startPasswordRecoveryWorker } from './password-recovery-worker.js';

function loadApiConfiguration() {
  const development = (process.env.APP_ENV ?? 'development') === 'development';
  return loadConfiguration({
    ...process.env,
    API_PORT: process.env.API_PORT ?? '8080',
    ...(development && process.env.WEB_REFERENCE_CLIENT_ORIGIN === undefined
      ? { WEB_REFERENCE_CLIENT_ORIGIN: 'http://localhost:3000' }
      : {}),
  });
}

export async function startApi(): Promise<ApiRuntime> {
  const configuration = loadApiConfiguration();
  const tracingConfiguration = loadTracingConfiguration();
  const rateLimitOverride = process.env.API_RATE_LIMIT_MAX;
  if (rateLimitOverride !== undefined && configuration.environment === 'production') {
    throw new Error('API_RATE_LIMIT_MAX cannot be overridden in production.');
  }
  const rateLimitMax = rateLimitOverride === undefined ? undefined : Number(rateLimitOverride);
  if (
    rateLimitMax !== undefined &&
    (!Number.isInteger(rateLimitMax) || rateLimitMax < 1 || rateLimitMax > 10_000)
  ) {
    throw new Error('API_RATE_LIMIT_MAX must be an integer from 1 to 10000.');
  }
  const browserTracingEndpoint = tracingConfiguration.browserEnabled
    ? tracingConfiguration.endpoint
    : undefined;
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
  let composition: ReturnType<typeof createPostgresCreatorIdentityComposition> | undefined;
  let operationsConnection: ReturnType<typeof createPostgresDatabase> | undefined;
  let server: Awaited<ReturnType<typeof createApiServer>> | undefined;
  let passwordRecoveryWorker: ReturnType<typeof startPasswordRecoveryWorker> | undefined;
  const tracing = startTracing(tracingConfiguration, logger);
  try {
    const operationsUrl =
      configuration.environment === 'production'
        ? productionOperationsDatabaseUrl(process.env)
        : undefined;
    if (operationsUrl !== undefined) {
      operationsConnection = createPostgresDatabase(operationsUrl);
      await verifyProductionOperationsRuntime(operationsConnection.client);
    }
    const productionOperations =
      operationsConnection === undefined
        ? undefined
        : createPostgresOperationsIdentityComposition(operationsConnection.database);
    const mailKey = process.env.PASSWORD_RESET_RESEND_API_KEY;
    const mailFrom = process.env.PASSWORD_RESET_FROM;
    if (Boolean(mailKey) !== Boolean(mailFrom))
      throw new Error('Password recovery mail configuration is incomplete.');
    const passwordResetDelivery =
      mailKey && mailFrom
        ? new ResendPasswordResetDelivery(mailKey, mailFrom, configuration.webReferenceClientOrigin)
        : undefined;
    composition =
      configuration.environment === 'test' && !usePostgresTestComposition
        ? undefined
        : createPostgresCreatorIdentityComposition(
            loadDatabaseConfiguration() satisfies CreatorIdentityDatabaseConfiguration,
            {
              localAuthSecret: process.env.JWT_SECRET ?? '',
              ...(passwordResetDelivery ? { passwordResetDelivery } : {}),
            },
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
            logger,
          );
    server = await createApiServer(
      composition === undefined
        ? {
            corsAllowedOrigins: [configuration.webReferenceClientOrigin],
            publicOrigin: configuration.webReferenceClientOrigin,
            logger,
            ...(rateLimitMax === undefined ? {} : { rateLimitMax }),
            ...(browserTracingEndpoint === undefined ? {} : { browserTracingEndpoint }),
          }
        : {
            ...(usePostgresTestComposition || composition.localAuthService === undefined
              ? {}
              : {
                  localAuthService: composition.localAuthService,
                  ...(process.env.CREATOR_BFF_REVOCATION_SECRET
                    ? { creatorBffRevocationSecret: process.env.CREATOR_BFF_REVOCATION_SECRET }
                    : {}),
                }),
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
            publicHomepageService: composition.publicHomepageService,
            serviceOfferingService: composition.offeringService,
            customerRequestService: composition.customerRequestService,
            qrCodeGenerator: new QrCodeGeneratorImpl(),
            operationsAuthContextProvider: composition.operationsAuthContextProvider,
            ...(configuration.environment === 'production'
              ? productionOperations === undefined
                ? {}
                : {
                    operationsHumanAuthenticationRuntime:
                      productionOperations.humanAuthenticationRuntime,
                  }
              : {
                  operationsHumanAuthenticationRuntime:
                    composition.operationsIdentityPersistence.humanAuthenticationRuntime,
                }),
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
            servicePolicyCatalogRepository: composition.servicePolicyCatalogRepository,
            servicePolicyAdminService: composition.servicePolicyAdminService,
            scenarioOperationsService: composition.scenarioOperationsService,
            operationsFlowReadService: composition.operationsFlowReadService,
            operationsQueryRepository: composition.operationsQueryRepository,
            currentUserIdentityService: composition.currentUserIdentityService,
            selfServiceIdentityInitializationService:
              composition.selfServiceIdentityInitializationService,
            privateCommerceProfileService: composition.privateCommerceProfileService,
            privateCommerceReferenceService: composition.privateCommerceReferenceService,
            privateExternalPlatformAccountService:
              composition.privateExternalPlatformAccountService,
            privateCommerceRelationshipService: composition.privateCommerceRelationshipService,
            privateSelfDeclaredExternalRelationshipService:
              composition.privateSelfDeclaredExternalRelationshipService,
            database: composition.database, // 用于公开 Creator Profile API
            checkReadiness: composition.database.checkReadiness.bind(composition.database),
            corsAllowedOrigins: [configuration.webReferenceClientOrigin],
            logger,
            ...(rateLimitMax === undefined ? {} : { rateLimitMax }),
            performanceMonitor,
            publicOrigin: configuration.webReferenceClientOrigin,
            ...(browserTracingEndpoint === undefined ? {} : { browserTracingEndpoint }),
          },
    );

    await server.listen({
      host: configuration.apiHost,
      port: configuration.apiPort,
    });
    if (composition?.localAuthService && !usePostgresTestComposition) {
      passwordRecoveryWorker = startPasswordRecoveryWorker(
        composition.localAuthService,
        () => logger.error('password_recovery_worker_failed', { errorCategory: 'worker_failed' }),
        passwordResetDelivery ? 2_000 : 30_000,
      );
    }
    logger.info('api_started', {
      environment: configuration.environment,
      host: configuration.apiHost,
      port: configuration.apiPort,
    });
  } catch (error) {
    try {
      if (server !== undefined) await server.close();
    } finally {
      try {
        if (passwordRecoveryWorker !== undefined) await passwordRecoveryWorker.stop();
        await Promise.all([composition?.database.close(), operationsConnection?.close()]);
      } finally {
        await tracing.shutdown();
      }
    }
    throw error;
  }

  const runningServer = server;
  const runningComposition = composition;
  let closing: Promise<void> | undefined;
  return {
    server: runningServer,
    close: () => {
      closing ??= (async () => {
        try {
          try {
            await runningServer.close();
          } finally {
            if (passwordRecoveryWorker !== undefined) await passwordRecoveryWorker.stop();
            await Promise.all([
              runningComposition?.database.close(),
              operationsConnection?.close(),
            ]);
          }
        } finally {
          await tracing.shutdown();
        }
      })();
      return closing;
    },
  };
}

const entryPath = process.argv[1];

if (entryPath !== undefined && import.meta.url === pathToFileURL(resolve(entryPath)).href) {
  try {
    const runtime = await startApi();
    const configuration = loadApiConfiguration();
    installGracefulShutdown(runtime, createSafeLogger(configuration.logLevel));
  } catch (error) {
    const logger = createSafeLogger('error');
    logger.error('api_start_failed', {
      errorName: error instanceof Error ? error.name : 'UnknownError',
    });
    process.exitCode = 1;
  }
}
