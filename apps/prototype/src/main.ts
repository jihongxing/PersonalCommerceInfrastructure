import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { createSafeLogger } from '../../../adapters/observability/safe-logger.js';
import { loadConfiguration } from './configuration/bootstrap.js';
import { createFoundationManifest } from './foundation.js';

export function startPrototype(): void {
  const configuration = loadConfiguration();
  const foundation = createFoundationManifest();
  const logger = createSafeLogger(configuration.logLevel);

  logger.info('prototype_foundation_ready', {
    application: foundation.application,
    environment: configuration.environment,
    status: 'foundation-ready',
    businessCapabilities: foundation.businessCapabilities,
  });
}

const entryPath = process.argv[1];

if (entryPath !== undefined && import.meta.url === pathToFileURL(resolve(entryPath)).href) {
  startPrototype();
}
