import { describe, expect, it } from 'vitest';

import { createActorContext } from '../../applications/core/actor-context.js';
import {
  RealMoneyActivationGuard,
  type RealMoneyRuntimeState,
} from '../../applications/paid-commerce/real-money-activation-guard.js';

const disabledRuntime: RealMoneyRuntimeState = {
  runtimeEnvironment: 'controlled',
  realMoneyEnabled: false,
  liveProviderConfigured: false,
};

describe('real-money activation guard', () => {
  it('rejects Live Payment while REAL_MONEY_ENABLED is false', () => {
    const guard = new RealMoneyActivationGuard(disabledRuntime);

    expect(() => guard.assertLiveOperationAllowed('payment')).toThrow(
      'Live payment is disabled by the real-money kill switch.',
    );
  });

  it('does not apply the Live kill switch to controlled transports', () => {
    const guard = new RealMoneyActivationGuard(disabledRuntime);

    expect(() => guard.assertControlledOperationAllowed()).not.toThrow();
  });

  it('does not allow Creator or Customer actors to activate Live commerce', () => {
    const guard = new RealMoneyActivationGuard(disabledRuntime);

    expect(() =>
      guard.assertRuntimeControlAuthority(
        createActorContext({
          actor: { kind: 'creator', creatorId: 'creator-1' },
          correlationId: 'creator-attempt-1',
        }),
      ),
    ).toThrow('Real-money runtime control requires authorized Operations.');
    expect(() =>
      guard.assertRuntimeControlAuthority(
        createActorContext({
          actor: { kind: 'customer', customerId: 'customer-1' },
          correlationId: 'customer-attempt-1',
        }),
      ),
    ).toThrow('Real-money runtime control requires authorized Operations.');
  });

  it('rejects Live Payment when no Live Provider is configured', () => {
    const guard = new RealMoneyActivationGuard({
      runtimeEnvironment: 'controlled',
      realMoneyEnabled: true,
      founderActivationReference: 'founder-go-2026-001',
      liveProviderConfigured: false,
    });

    expect(() => guard.assertLiveOperationAllowed('payment')).toThrow(
      'Live payment requires a configured Live Provider.',
    );
  });

  it('allows Live operations only with controlled runtime, founder approval, and Provider config', () => {
    const guard = new RealMoneyActivationGuard({
      runtimeEnvironment: 'controlled',
      realMoneyEnabled: true,
      founderActivationReference: 'founder-go-2026-001',
      liveProviderConfigured: true,
    });

    expect(() => guard.assertLiveOperationAllowed('payment')).not.toThrow();
    expect(() => guard.assertLiveOperationAllowed('settlement')).not.toThrow();
    expect(() => guard.assertLiveOperationAllowed('withdrawal')).not.toThrow();
  });
});
