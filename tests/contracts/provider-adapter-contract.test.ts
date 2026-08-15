import { describe, expect, it } from 'vitest';

import { InMemoryProviderCapabilityRegistry } from '../../adapters/in-memory/in-memory-provider-capability-registry.js';
import { InMemoryProviderFactReceiptGuard } from '../../adapters/in-memory/in-memory-provider-fact-receipt-guard.js';
import {
  ReferenceProviderAdapter,
  type ReferenceProviderEvent,
} from '../../adapters/in-memory/reference-provider-adapter.js';
import type {
  ProviderFactResourceType,
  ProviderPort,
  VerifiedProviderFact,
} from '../../applications/paid-commerce/provider-ports.js';

describe('Provider Adapter Contract', () => {
  it('requires the Reference Provider Adapter to satisfy the Provider-neutral Port', async () => {
    await verifyProviderPortContract(new ReferenceProviderAdapter());
  });

  it('records Provider capability evidence without enabling a Domain capability', async () => {
    const registry = new InMemoryProviderCapabilityRegistry();
    await registry.register({
      providerId: 'reference_provider',
      market: 'CN',
      currency: 'CNY',
      payment: 'confirmed',
      settlement: 'candidate',
      withdrawal: 'unknown_blocking',
      refund: 'unknown_blocking',
      dispute: 'unknown_blocking',
      accountModel: 'reference_only',
      constraints: ['local verification harness only'],
      evidenceReference: 'vs02b-reference-provider-contract',
    });

    const record = await registry.findByProviderId('reference_provider');
    expect(record).toEqual({
      providerId: 'reference_provider',
      market: 'CN',
      currency: 'CNY',
      payment: 'confirmed',
      settlement: 'candidate',
      withdrawal: 'unknown_blocking',
      refund: 'unknown_blocking',
      dispute: 'unknown_blocking',
      accountModel: 'reference_only',
      constraints: ['local verification harness only'],
      evidenceReference: 'vs02b-reference-provider-contract',
    });
  });

  it('guards duplicate, stale and conflicting verified Provider Facts', async () => {
    const guard = new InMemoryProviderFactReceiptGuard();
    const succeeded = providerFact({
      providerEventId: 'payment-success-1',
      kind: 'PaymentSucceeded',
      resourceType: 'payment',
      internalReference: 'order-1',
      amountMinor: 39900n,
      sequence: 2,
    });

    await expect(guard.inspect(succeeded)).resolves.toEqual({ status: 'accepted' });
    await guard.recordAccepted(succeeded);
    await expect(guard.inspect(succeeded)).resolves.toEqual({ status: 'idempotent' });
    await expect(
      guard.inspect(
        providerFact({
          ...succeeded,
          providerEventId: 'payment-success-2',
          occurredAt: '2026-08-15T10:00:01.000Z',
        }),
      ),
    ).resolves.toEqual({ status: 'idempotent' });
    await expect(
      guard.inspect(
        providerFact({
          ...succeeded,
          providerEventId: 'payment-failed-1',
          kind: 'PaymentFailed',
          occurredAt: '2026-08-15T10:00:02.000Z',
          sequence: 3,
        }),
      ),
    ).resolves.toMatchObject({ status: 'conflict' });
    await expect(
      guard.inspect(
        providerFact({
          ...succeeded,
          providerEventId: 'payment-success-stale',
          occurredAt: '2026-08-15T09:59:59.000Z',
          sequence: 1,
        }),
      ),
    ).resolves.toMatchObject({ status: 'stale' });
  });
});

async function verifyProviderPortContract(provider: ProviderPort): Promise<void> {
  const payment = await provider.createPaymentIntent({
    internalReference: 'order-1',
    amountMinor: 39900n,
    currency: 'CNY',
    idempotencyKey: 'payment-intent-1',
  });
  const replayedPayment = await provider.createPaymentIntent({
    internalReference: 'order-1',
    amountMinor: 39900n,
    currency: 'CNY',
    idempotencyKey: 'payment-intent-1',
  });
  expect(replayedPayment).toEqual(payment);
  await expect(provider.getPaymentStatus(payment.providerReference)).resolves.toBe('pending');

  const adapter = provider as ReferenceProviderAdapter;
  adapter.recordEvent(
    providerEvent({
      providerEventId: 'payment-success-1',
      providerReference: payment.providerReference,
      kind: 'PaymentSucceeded',
      resourceType: 'payment',
      internalReference: 'order-1',
      amountMinor: 39900n,
      sequence: 1,
    }),
  );
  const paymentFact = await provider.verifyPaymentFact({ providerEventId: 'payment-success-1' });
  expect(paymentFact).toMatchObject({
    verification: 'verified',
    kind: 'PaymentSucceeded',
    resourceType: 'payment',
    amountMinor: 39900n,
    currency: 'CNY',
  });
  const safeFact = JSON.stringify(paymentFact, (_, value: unknown) =>
    typeof value === 'bigint' ? value.toString() : value,
  );
  expect(safeFact).not.toContain('secret');
  expect(safeFact).not.toContain('signature');
  await expect(provider.getPaymentStatus(payment.providerReference)).resolves.toBe('succeeded');
  await expect(provider.verifyPaymentFact({ providerEventId: 'missing' })).resolves.toEqual({
    verification: 'rejected',
    providerId: 'reference_provider',
    providerEventId: 'missing',
    reason: 'unknown_event',
  });

  const settlement = await provider.createSettlement({
    internalReference: 'order-1',
    amountMinor: 35670n,
    currency: 'CNY',
    idempotencyKey: 'settlement-1',
  });
  const withdrawal = await provider.createWithdrawalIntent({
    internalReference: 'withdrawal-1',
    amountMinor: 35670n,
    currency: 'CNY',
    idempotencyKey: 'withdrawal-1',
  });
  await expect(provider.getSettlementStatus(settlement.providerReference)).resolves.toBe('pending');
  await expect(provider.getWithdrawalStatus(withdrawal.providerReference)).resolves.toBe('pending');

  adapter.recordEvent(
    providerEvent({
      providerEventId: 'settlement-success-1',
      providerReference: settlement.providerReference,
      kind: 'SettlementSucceeded',
      resourceType: 'settlement',
      internalReference: 'order-1',
      amountMinor: 35670n,
      sequence: 1,
    }),
  );
  adapter.recordEvent(
    providerEvent({
      providerEventId: 'withdrawal-failed-1',
      providerReference: withdrawal.providerReference,
      kind: 'WithdrawalFailed',
      resourceType: 'withdrawal',
      internalReference: 'withdrawal-1',
      amountMinor: 35670n,
      sequence: 1,
    }),
  );
  await expect(
    provider.verifySettlementFact({ providerEventId: 'settlement-success-1' }),
  ).resolves.toMatchObject({
    verification: 'verified',
    kind: 'SettlementSucceeded',
    resourceType: 'settlement',
  });
  await expect(
    provider.verifyWithdrawalFact({ providerEventId: 'withdrawal-failed-1' }),
  ).resolves.toMatchObject({
    verification: 'verified',
    kind: 'WithdrawalFailed',
    resourceType: 'withdrawal',
  });
  await expect(provider.getSettlementStatus(settlement.providerReference)).resolves.toBe(
    'succeeded',
  );
  await expect(provider.getWithdrawalStatus(withdrawal.providerReference)).resolves.toBe('failed');
}

function providerEvent(input: {
  readonly providerEventId: string;
  readonly providerReference: string;
  readonly kind: ReferenceProviderEvent['kind'];
  readonly resourceType: ProviderFactResourceType;
  readonly internalReference: string;
  readonly amountMinor: bigint;
  readonly sequence: number;
}): ReferenceProviderEvent {
  return {
    ...input,
    currency: 'CNY',
    occurredAt: '2026-08-15T10:00:00.000Z',
  };
}

function providerFact(
  input: Omit<
    VerifiedProviderFact,
    'verification' | 'providerId' | 'providerReference' | 'currency' | 'occurredAt'
  > & {
    readonly occurredAt?: string;
  },
): VerifiedProviderFact {
  return {
    verification: 'verified',
    providerId: 'reference_provider',
    providerReference: 'reference-provider-resource-1',
    currency: 'CNY',
    occurredAt: '2026-08-15T10:00:00.000Z',
    ...input,
  };
}
