import type { LocalAuthService } from '../../../applications/account-identity-membership/local-auth-service.js';

export function startPasswordRecoveryWorker(
  service: LocalAuthService,
  onFailure: () => void,
  idleDelay = 2_000,
): { stop(): Promise<void> } {
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let current: Promise<void> | undefined;

  const run = () => {
    current = (async () => {
      let delay = idleDelay;
      try {
        if (await service.processNextPasswordRecovery()) delay = 0;
      } catch {
        onFailure();
      }
      if (!stopped) {
        timer = setTimeout(run, delay);
        timer.unref();
      }
    })();
  };
  run();
  return {
    async stop() {
      stopped = true;
      if (timer) clearTimeout(timer);
      await current;
    },
  };
}
