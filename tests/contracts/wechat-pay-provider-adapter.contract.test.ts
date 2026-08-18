import { describe, expect, it } from 'vitest';

import { InMemoryProviderFactReceiptGuard } from '../../adapters/in-memory/in-memory-provider-fact-receipt-guard.js';
import { ControlledWeChatPaySandboxTransport } from '../../adapters/providers/wechat-pay/controlled-wechat-pay-sandbox-transport.js';
import { InMemoryWeChatPayCreatorAccountMappingStore } from '../../adapters/providers/wechat-pay/wechat-pay-account-mapping.js';
import { WeChatPayProviderAdapter } from '../../adapters/providers/wechat-pay/wechat-pay-provider-adapter.js';
import type {
  WeChatPaySandboxEvent,
  WeChatPaySandboxTransport,
} from '../../adapters/providers/wechat-pay/wechat-pay-sandbox-transport.js';
import type { ProviderPort } from '../../applications/paid-commerce/provider-ports.js';

describe('WeChat Pay Provider Adapter Contract', () => {
  it('satisfies the Provider-neutral Payment, Settlement and Withdrawal Port', async () => {
    const transport = new ControlledWeChatPaySandboxTransport();
    const adapter = new WeChatPayProviderAdapter(transport);

    await verifyPortContract(adapter, transport);
  });

  it('maps Provider test events into neutral facts and preserves replay/conflict safety', async () => {
    const transport = new ControlledWeChatPaySandboxTransport();
    const adapter = new WeChatPayProviderAdapter(transport);
    const payment = await adapter.createPaymentIntent({
      internalReference: 'order-1',
      amountMinor: 39900n,
      currency: 'CNY',
      idempotencyKey: 'payment-1',
    });
    transport.recordVerifiedEvent(
      event({
        eventId: 'payment-success-1',
        providerReference: payment.providerReference,
        eventType: 'payment_succeeded',
        operationType: 'payment',
        internalReference: 'order-1',
        amountMinor: 39900n,
        sequence: 2,
      }),
    );

    const fact = await adapter.verifyPaymentFact({ providerEventId: 'payment-success-1' });
    expect(fact).toMatchObject({
      verification: 'verified',
      kind: 'PaymentSucceeded',
      resourceType: 'payment',
      amountMinor: 39900n,
      currency: 'CNY',
    });
    if (fact.verification !== 'verified') {
      throw new Error('WeChat Pay Adapter must normalize its verified test event.');
    }
    const guard = new InMemoryProviderFactReceiptGuard();
    await expect(guard.inspect(fact)).resolves.toEqual({ status: 'accepted' });
    await guard.recordAccepted(fact);
    await expect(guard.inspect(fact)).resolves.toEqual({ status: 'idempotent' });
    await expect(
      guard.inspect({ ...fact, providerEventId: 'payment-success-duplicate' }),
    ).resolves.toEqual({ status: 'idempotent' });
    await expect(
      guard.inspect({
        ...fact,
        providerEventId: 'payment-failed-conflict',
        kind: 'PaymentFailed',
        sequence: 3,
      }),
    ).resolves.toMatchObject({ status: 'conflict' });
    await expect(
      guard.inspect({
        ...fact,
        providerEventId: 'payment-success-stale',
        sequence: 1,
      }),
    ).resolves.toMatchObject({ status: 'stale' });
  });

  it('maps payment, settlement, withdrawal and refund signals without exposing Provider-only data', async () => {
    const transport = new ControlledWeChatPaySandboxTransport();
    const adapter = new WeChatPayProviderAdapter(transport);
    const signals = [
      {
        eventType: 'payment_failed',
        operationType: 'payment',
        kind: 'PaymentFailed',
        resourceType: 'payment',
      },
      {
        eventType: 'refund_succeeded',
        operationType: 'payment',
        kind: 'RefundSucceeded',
        resourceType: 'payment',
      },
      {
        eventType: 'settlement_succeeded',
        operationType: 'settlement',
        kind: 'SettlementSucceeded',
        resourceType: 'settlement',
      },
      {
        eventType: 'withdrawal_succeeded',
        operationType: 'withdrawal',
        kind: 'WithdrawalSucceeded',
        resourceType: 'withdrawal',
      },
      {
        eventType: 'withdrawal_failed',
        operationType: 'withdrawal',
        kind: 'WithdrawalFailed',
        resourceType: 'withdrawal',
      },
    ] as const;

    for (const [index, signal] of signals.entries()) {
      const operation = await createOperation(adapter, signal.operationType, `resource-${index}`);
      transport.recordVerifiedEvent(
        event({
          eventId: `event-${index}`,
          providerReference: operation.providerReference,
          eventType: signal.eventType,
          operationType: signal.operationType,
          internalReference: `resource-${index}`,
          amountMinor: 35670n,
          sequence: 1,
        }),
      );
      const fact = await verifyFact(adapter, signal.resourceType, `event-${index}`);
      expect(fact).toMatchObject({
        verification: 'verified',
        kind: signal.kind,
        resourceType: signal.resourceType,
        amountMinor: 35670n,
        currency: 'CNY',
      });
      expect(serialize(fact)).not.toContain('sub_mch_id');
      expect(serialize(fact)).not.toContain('api_key');
      expect(serialize(fact)).not.toContain('certificate');
    }
  });

  it('normalizes transport failures and keeps Creator account mapping outside Money Domain', async () => {
    const adapter = new WeChatPayProviderAdapter(new FailingWeChatPaySandboxTransport());
    await expect(
      adapter.createPaymentIntent({
        internalReference: 'order-1',
        amountMinor: 39900n,
        currency: 'CNY',
        idempotencyKey: 'payment-1',
      }),
    ).rejects.toMatchObject({
      code: 'wechat_pay_sandbox_operation_rejected',
      message: 'WeChat Pay test operation could not be created.',
    });
    await expect(adapter.verifyPaymentFact({ providerEventId: 'event-1' })).rejects.toMatchObject({
      code: 'wechat_pay_sandbox_event_rejected',
      message: 'WeChat Pay test event could not be verified.',
    });

    const accountMappings = new InMemoryWeChatPayCreatorAccountMappingStore();
    await accountMappings.save({
      creatorId: 'creator-1',
      subMerchantReference: 'test-sub-merchant-reference',
      status: 'candidate',
      evidenceReference: '35A-wechat-pay-platform-collection-and-disbursement',
    });
    await expect(accountMappings.findByCreatorId('creator-1')).resolves.toEqual({
      creatorId: 'creator-1',
      subMerchantReference: 'test-sub-merchant-reference',
      status: 'candidate',
      evidenceReference: '35A-wechat-pay-platform-collection-and-disbursement',
    });
  });
});

async function verifyPortContract(
  adapter: WeChatPayProviderAdapter,
  transport: ControlledWeChatPaySandboxTransport,
): Promise<void> {
  const payment = await adapter.createPaymentIntent({
    internalReference: 'order-1',
    amountMinor: 39900n,
    currency: 'CNY',
    idempotencyKey: 'payment-1',
  });
  const replayed = await adapter.createPaymentIntent({
    internalReference: 'order-1',
    amountMinor: 39900n,
    currency: 'CNY',
    idempotencyKey: 'payment-1',
  });
  expect(replayed).toEqual(payment);
  await expect(adapter.getPaymentStatus(payment.providerReference)).resolves.toBe('pending');

  const settlement = await adapter.createSettlement({
    internalReference: 'order-1',
    amountMinor: 35670n,
    currency: 'CNY',
    idempotencyKey: 'settlement-1',
  });
  const withdrawal = await adapter.createWithdrawalIntent({
    internalReference: 'withdrawal-1',
    amountMinor: 35670n,
    currency: 'CNY',
    idempotencyKey: 'withdrawal-1',
  });
  transport.recordVerifiedEvent(
    event({
      eventId: 'settlement-success-1',
      providerReference: settlement.providerReference,
      eventType: 'settlement_succeeded',
      operationType: 'settlement',
      internalReference: 'order-1',
      amountMinor: 35670n,
      sequence: 1,
    }),
  );
  transport.recordVerifiedEvent(
    event({
      eventId: 'withdrawal-success-1',
      providerReference: withdrawal.providerReference,
      eventType: 'withdrawal_succeeded',
      operationType: 'withdrawal',
      internalReference: 'withdrawal-1',
      amountMinor: 35670n,
      sequence: 1,
    }),
  );
  await expect(
    adapter.verifySettlementFact({ providerEventId: 'settlement-success-1' }),
  ).resolves.toMatchObject({ verification: 'verified', kind: 'SettlementSucceeded' });
  await expect(
    adapter.verifyWithdrawalFact({ providerEventId: 'withdrawal-success-1' }),
  ).resolves.toMatchObject({ verification: 'verified', kind: 'WithdrawalSucceeded' });
  await expect(adapter.getSettlementStatus(settlement.providerReference)).resolves.toBe(
    'succeeded',
  );
  await expect(adapter.getWithdrawalStatus(withdrawal.providerReference)).resolves.toBe(
    'succeeded',
  );
}

async function createOperation(
  adapter: ProviderPort,
  operationType: 'payment' | 'settlement' | 'withdrawal',
  internalReference: string,
) {
  const request = {
    internalReference,
    amountMinor: 35670n,
    currency: 'CNY' as const,
    idempotencyKey: `${operationType}-${internalReference}`,
  };
  switch (operationType) {
    case 'payment':
      return adapter.createPaymentIntent(request);
    case 'settlement':
      return adapter.createSettlement(request);
    case 'withdrawal':
      return adapter.createWithdrawalIntent(request);
  }
}

function verifyFact(
  adapter: ProviderPort,
  resourceType: 'payment' | 'settlement' | 'withdrawal',
  providerEventId: string,
) {
  switch (resourceType) {
    case 'payment':
      return adapter.verifyPaymentFact({ providerEventId });
    case 'settlement':
      return adapter.verifySettlementFact({ providerEventId });
    case 'withdrawal':
      return adapter.verifyWithdrawalFact({ providerEventId });
  }
}

function event(
  input: Omit<WeChatPaySandboxEvent, 'currency' | 'occurredAt'>,
): WeChatPaySandboxEvent {
  return {
    ...input,
    currency: 'CNY',
    occurredAt: '2026-08-15T12:00:00.000Z',
  };
}

function serialize(value: unknown): string {
  return JSON.stringify(value, (_, nestedValue: unknown) =>
    typeof nestedValue === 'bigint' ? nestedValue.toString() : nestedValue,
  );
}

class FailingWeChatPaySandboxTransport implements WeChatPaySandboxTransport {
  public readonly environment = 'controlled_test_transport' as const;

  public submit(): Promise<never> {
    return Promise.reject(new Error('api_key=must-not-leak'));
  }

  public getStatus(): Promise<never> {
    return Promise.reject(new Error('api_key=must-not-leak'));
  }

  public verifyEvent(): Promise<never> {
    return Promise.reject(new Error('api_key=must-not-leak'));
  }
}
