import type { FastifyInstance } from 'fastify';

import type { SafeLogger } from '../../../adapters/observability/safe-logger.js';

export interface ApiRuntime {
  readonly server: FastifyInstance;
  close(): Promise<void>;
}

export interface ShutdownSignalSource {
  once(signal: 'SIGINT' | 'SIGTERM', listener: () => void): void;
  off(signal: 'SIGINT' | 'SIGTERM', listener: () => void): void;
}

export function installGracefulShutdown(
  runtime: ApiRuntime,
  logger: SafeLogger,
  signalSource: ShutdownSignalSource = process,
): () => void {
  let closing: Promise<void> | undefined;

  const shutdown = (signal: 'SIGINT' | 'SIGTERM') => {
    if (closing !== undefined) {
      return;
    }

    logger.info('api_shutdown_started', { signal });
    closing = runtime
      .close()
      .then(() => {
        logger.info('api_shutdown_completed', { signal });
      })
      .catch((error: unknown) => {
        logger.error('api_shutdown_failed', {
          errorName: error instanceof Error ? error.name : 'UnknownError',
          signal,
        });
        process.exitCode = 1;
      });
  };

  const onSigint = () => {
    shutdown('SIGINT');
  };
  const onSigterm = () => {
    shutdown('SIGTERM');
  };

  signalSource.once('SIGINT', onSigint);
  signalSource.once('SIGTERM', onSigterm);

  return () => {
    signalSource.off('SIGINT', onSigint);
    signalSource.off('SIGTERM', onSigterm);
  };
}
