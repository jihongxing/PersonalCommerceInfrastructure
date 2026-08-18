import { describe, expect, it } from 'vitest';

import {
  assertWeChatPayOfficialSandboxConfigurationUnavailable,
  getWeChatPayOfficialSandboxCapability,
  UnavailableWeChatPayOfficialSandboxTransport,
  WeChatPayOfficialSandboxUnavailableError,
} from '../../adapters/providers/wechat-pay/wechat-pay-official-sandbox-boundary.js';
import { WeChatPayProviderAdapter } from '../../adapters/providers/wechat-pay/wechat-pay-provider-adapter.js';

describe('WeChat Pay official Sandbox boundary', () => {
  it('records the official Sandbox as an unavailable external dependency', () => {
    expect(getWeChatPayOfficialSandboxCapability()).toEqual({
      providerId: 'wechat_pay_platform_collection_and_disbursement',
      environment: 'official_sandbox',
      availability: 'unavailable_external_dependency',
      payment: 'unavailable',
      settlement: 'unavailable',
      withdrawal: 'unavailable',
      refund: 'unavailable',
      webhook: 'unavailable',
      evidenceReference: 'VS-02G-SANDBOX-UNAVAILABLE-EXTERNAL-DEPENDENCY',
    });
  });

  it('rejects every Provider operation instead of falling back to a controlled transport', async () => {
    const adapter = new WeChatPayProviderAdapter(
      new UnavailableWeChatPayOfficialSandboxTransport(),
    );
    const request = {
      internalReference: 'order-official-sandbox-1',
      amountMinor: 39900n,
      currency: 'CNY' as const,
      idempotencyKey: 'official-sandbox-payment-1',
    };

    await expect(adapter.createPaymentIntent(request)).rejects.toBeInstanceOf(
      WeChatPayOfficialSandboxUnavailableError,
    );
    await expect(adapter.createSettlement(request)).rejects.toBeInstanceOf(
      WeChatPayOfficialSandboxUnavailableError,
    );
    await expect(adapter.createWithdrawalIntent(request)).rejects.toBeInstanceOf(
      WeChatPayOfficialSandboxUnavailableError,
    );
    await expect(adapter.getPaymentStatus('official-sandbox-payment-1')).rejects.toThrow(
      'SANDBOX UNAVAILABLE — EXTERNAL DEPENDENCY',
    );
    await expect(
      adapter.verifyPaymentFact({ providerEventId: 'official-sandbox-event-1' }),
    ).rejects.toThrow('SANDBOX UNAVAILABLE — EXTERNAL DEPENDENCY');
  });

  it('does not accept guessed official Sandbox configuration', () => {
    expect(() =>
      assertWeChatPayOfficialSandboxConfigurationUnavailable({
        endpoint: 'https://unverified.example.test',
        testAccountReference: 'unverified-test-account',
        credentialReference: 'unverified-credential',
        webhookVerificationReference: 'unverified-signature-contract',
        currency: 'CNY',
        region: 'CN',
      }),
    ).toThrow('official endpoint, credentials, signature and test-account evidence');
    expect(() => assertWeChatPayOfficialSandboxConfigurationUnavailable(undefined)).not.toThrow();
  });
});
