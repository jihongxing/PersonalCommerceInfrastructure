import { describe, expect, it, vi } from 'vitest';

import { GuardedLiveProviderAdapter } from '../../applications/paid-commerce/live-provider-adapter.js';
import { RealMoneyActivationGuard } from '../../applications/paid-commerce/real-money-activation-guard.js';
import type { ProviderPort } from '../../applications/paid-commerce/provider-ports.js';

function providerMock(): {
  readonly provider: ProviderPort;
  readonly createPaymentIntent: ReturnType<typeof vi.fn>;
} {
  const createPaymentIntent = vi.fn().mockResolvedValue({
    providerId: 'live-provider',
    providerReference: 'payment-1',
    internalReference: 'order-1',
    status: 'pending',
  });
  return {
    createPaymentIntent,
    provider: {
      providerId: 'live-provider',
      createPaymentIntent,
      getPaymentStatus: vi.fn().mockResolvedValue('pending'),
      verifyPaymentFact: vi.fn(),
      createSettlement: vi.fn(),
      getSettlementStatus: vi.fn(),
      verifySettlementFact: vi.fn(),
      createWithdrawalIntent: vi.fn(),
      getWithdrawalStatus: vi.fn(),
      verifyWithdrawalFact: vi.fn(),
    },
  };
}

describe('Guarded Live Provider Adapter', () => {
  it('blocks a new Live Payment before calling the Provider when the kill switch is off', () => {
    const { provider, createPaymentIntent } = providerMock();
    const adapter = new GuardedLiveProviderAdapter(
      provider,
      new RealMoneyActivationGuard({
        runtimeEnvironment: 'controlled',
        realMoneyEnabled: false,
        liveProviderConfigured: true,
      }),
    );

    expect(() =>
      adapter.createPaymentIntent({
        internalReference: 'order-1',
        amountMinor: 39_900n,
        currency: 'CNY',
        idempotencyKey: 'live-payment-1',
      }),
    ).toThrow('Live payment is disabled by the real-money kill switch.');
    expect(createPaymentIntent).not.toHaveBeenCalled();
  });

  it('never falls back to a test transport when the Live Provider is unavailable', () => {
    const { provider, createPaymentIntent } = providerMock();
    const adapter = new GuardedLiveProviderAdapter(
      provider,
      new RealMoneyActivationGuard({
        runtimeEnvironment: 'controlled',
        realMoneyEnabled: true,
        founderActivationReference: 'founder-go-2026-001',
        liveProviderConfigured: false,
      }),
    );

    expect(() =>
      adapter.createPaymentIntent({
        internalReference: 'order-1',
        amountMinor: 39_900n,
        currency: 'CNY',
        idempotencyKey: 'live-payment-1',
      }),
    ).toThrow('Live payment requires a configured Live Provider.');
    expect(createPaymentIntent).not.toHaveBeenCalled();
  });
});
