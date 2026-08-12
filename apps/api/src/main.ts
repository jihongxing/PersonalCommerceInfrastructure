import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import {
  loadAuthConfiguration,
  loadConfiguration,
  loadDatabaseConfiguration,
} from '../../prototype/src/configuration/bootstrap.js';
import {
  createPostgresCreatorIdentityComposition,
  type CreatorIdentityAuthConfiguration,
  type CreatorIdentityDatabaseConfiguration,
} from '../../../adapters/persistence/postgres/postgres-creator-identity-composition.js';
import { LogNotificationAdapter } from '../../../adapters/notifications/log-notification-adapter.js';
import { createSafeLogger } from '../../../adapters/observability/safe-logger.js';
import { createApiServer } from './create-api-server.js';

export async function startApi(): Promise<void> {
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
          corsAllowedOrigins: [configuration.webReferenceClientOrigin],
          publicOrigin: configuration.webReferenceClientOrigin,
        },
  );

  try {
    await server.listen({
      host: configuration.apiHost,
      port: configuration.apiPort,
    });
  } catch (error) {
    if (composition !== undefined) {
      await composition.database.close();
    }
    throw error;
  }
}

const entryPath = process.argv[1];

if (entryPath !== undefined && import.meta.url === pathToFileURL(resolve(entryPath)).href) {
  await startApi();
}
