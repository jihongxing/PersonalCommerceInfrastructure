import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import {
  loadAuthConfiguration,
  loadConfiguration,
  loadDatabaseConfiguration,
  loadOperationsAuthConfiguration,
} from '../../prototype/src/configuration/bootstrap.js';
import {
  createPostgresCreatorIdentityComposition,
  type CreatorIdentityAuthConfiguration,
  type CreatorIdentityDatabaseConfiguration,
} from '../../../adapters/persistence/postgres/postgres-creator-identity-composition.js';
import { LogNotificationAdapter } from '../../../adapters/notifications/log-notification-adapter.js';
import { createSafeLogger } from '../../../adapters/observability/safe-logger.js';
import { createApiServer } from './create-api-server.js';
import { installGracefulShutdown, type ApiRuntime } from './runtime-lifecycle.js';

export async function startApi(): Promise<ApiRuntime> {
  const configuration = loadConfiguration();
  const logger = createSafeLogger(configuration.logLevel);
  const composition =
    configuration.environment === 'test'
      ? undefined
      : createPostgresCreatorIdentityComposition(
          loadDatabaseConfiguration() satisfies CreatorIdentityDatabaseConfiguration,
          loadAuthConfiguration() satisfies CreatorIdentityAuthConfiguration,
          configuration.webReferenceClientOrigin,
          new LogNotificationAdapter(logger),
          loadOperationsAuthConfiguration(),
        );
  const server = await createApiServer(
    composition === undefined
      ? {
          corsAllowedOrigins: [configuration.webReferenceClientOrigin],
          publicOrigin: configuration.webReferenceClientOrigin,
        }
      : {
          authContextProvider: composition.authContextProvider,
          creatorIdentityService: composition.service,
          serviceOfferingService: composition.offeringService,
          customerRequestService: composition.customerRequestService,
          operationsAuthContextProvider: composition.operationsAuthContextProvider,
          recordExternalObservation: composition.recordExternalObservation,
          paidCommerceService: composition.paidCommerceService,
          checkReadiness: () => composition.database.checkReadiness(),
          corsAllowedOrigins: [configuration.webReferenceClientOrigin],
          logger,
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
