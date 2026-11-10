import { describe, expect, it, vi } from 'vitest';
import type { LocalAuthService } from '../../applications/account-identity-membership/local-auth-service.js';
import { startPasswordRecoveryWorker } from '../../apps/api/src/password-recovery-worker.js';

describe('password recovery worker', () => {
  it('waits for in-flight work when stopping and does not schedule more work', async () => {
    vi.useFakeTimers();
    try {
      let finish!: (value: boolean) => void;
      const processNextPasswordRecovery = vi.fn(
        () => new Promise<boolean>((resolve) => (finish = resolve)),
      );
      const worker = startPasswordRecoveryWorker(
        { processNextPasswordRecovery } as unknown as LocalAuthService,
        vi.fn(),
      );
      let stopped = false;
      const stopping = worker.stop().then(() => (stopped = true));
      await Promise.resolve();
      expect(stopped).toBe(false);
      finish(true);
      await stopping;
      await vi.runAllTimersAsync();
      expect(processNextPasswordRecovery).toHaveBeenCalledOnce();
    } finally {
      vi.useRealTimers();
    }
  });
});
