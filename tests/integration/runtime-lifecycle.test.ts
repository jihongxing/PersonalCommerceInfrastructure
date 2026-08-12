import { EventEmitter } from 'node:events';
import { describe, expect, it, vi } from 'vitest';

import { createSafeLogger } from '../../adapters/observability/safe-logger.js';
import { installGracefulShutdown } from '../../apps/api/src/runtime-lifecycle.js';

describe('API runtime lifecycle', () => {
  it('closes the runtime once when a termination signal arrives', async () => {
    const signalSource = new EventEmitter();
    const close = vi.fn(() => Promise.resolve());
    const messages: string[] = [];
    const removeHandlers = installGracefulShutdown(
      {
        close,
        server: {} as never,
      },
      createSafeLogger('info', (message) => {
        messages.push(message);
      }),
      signalSource,
    );

    signalSource.emit('SIGTERM');
    signalSource.emit('SIGINT');
    await vi.waitFor(() => {
      expect(close).toHaveBeenCalledTimes(1);
    });

    expect(messages.join('\n')).toContain('api_shutdown_started');
    expect(messages.join('\n')).toContain('api_shutdown_completed');
    removeHandlers();
  });
});
