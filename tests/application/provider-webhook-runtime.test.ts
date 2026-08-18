import { describe, expect, it, vi } from 'vitest';

import { createActorContext } from '../../applications/core/actor-context.js';
import { InMemoryProviderWebhookReceiptStore } from '../../adapters/in-memory/in-memory-provider-webhook-receipt-store.js';
import {
  ProviderWebhookRuntime,
  type ProviderEventNormalizer,
  type ProviderWebhookSignatureVerifier,
} from '../../applications/paid-commerce/provider-webhook-runtime.js';
import type { ProviderFactApplicationPolicy } from '../../applications/paid-commerce/provider-fact-application-policy.js';
import { RealMoneyActivationGuard } from '../../applications/paid-commerce/real-money-activation-guard.js';

const operationsContext = createActorContext({
  actor: { kind: 'pilot_operations', operatorId: 'runtime-webhook' },
  correlationId: 'webhook-1',
});

const verifiedFact = {
  verification: 'verified' as const,
  providerId: 'future-provider',
  providerEventId: 'event-1',
  providerReference: 'provider-payment-1',
  kind: 'PaymentSucceeded' as const,
  resourceType: 'payment' as const,
  internalReference: 'payment-1',
  amountMinor: 10_000n,
  currency: 'CNY' as const,
  sequence: 1,
  occurredAt: '2026-08-16T10:00:00.000Z',
};

describe('Provider webhook runtime', () => {
  it('rejects an unsigned Provider event before normalization', async () => {
    const normalize = vi.fn();
    const normalizer: ProviderEventNormalizer = {
      normalize,
    };
    const runtime = new ProviderWebhookRuntime({
      signatureVerifier: {
        verify: () => Promise.resolve({ verification: 'rejected', reason: 'invalid_signature' }),
      },
      normalizer,
      receiptStore: new InMemoryProviderWebhookReceiptStore(),
      applicationPolicy: {
        process: vi.fn(),
      } as unknown as ProviderFactApplicationPolicy,
    });

    await expect(
      runtime.process(
        {
          providerId: 'future-provider',
          providerEventId: 'event-1',
          headers: {},
          payload: Buffer.from('{}'),
          receivedAt: '2026-08-16T10:00:00.000Z',
        },
        operationsContext,
      ),
    ).rejects.toThrow('Provider webhook signature verification failed.');
    expect(normalize).not.toHaveBeenCalled();
  });

  it('treats duplicate events as idempotent and rejects conflicting events', async () => {
    const signatureVerifier: ProviderWebhookSignatureVerifier = {
      verify: () => Promise.resolve({ verification: 'verified' }),
    };
    const applicationPolicy = {
      process: vi
        .fn()
        .mockResolvedValueOnce({ receipt: { status: 'accepted' }, transitioned: true })
        .mockResolvedValueOnce({ receipt: { status: 'idempotent' }, transitioned: false })
        .mockResolvedValueOnce({
          receipt: { status: 'conflict', reason: 'provider_event_conflict' },
          transitioned: false,
        }),
    } as unknown as ProviderFactApplicationPolicy;
    const runtime = new ProviderWebhookRuntime({
      signatureVerifier,
      normalizer: { normalize: () => Promise.resolve({ fact: verifiedFact }) },
      receiptStore: new InMemoryProviderWebhookReceiptStore(),
      applicationPolicy,
    });

    await expect(
      runtime.process(
        {
          providerId: 'future-provider',
          providerEventId: 'event-1',
          headers: { 'x-provider-signature': 'opaque-signature' },
          payload: Buffer.from('{}'),
          receivedAt: '2026-08-16T10:00:00.000Z',
        },
        operationsContext,
      ),
    ).resolves.toMatchObject({ status: 'accepted' });
    await expect(
      runtime.process(
        {
          providerId: 'future-provider',
          providerEventId: 'event-1',
          headers: { 'x-provider-signature': 'opaque-signature' },
          payload: Buffer.from('{}'),
          receivedAt: '2026-08-16T10:00:01.000Z',
        },
        operationsContext,
      ),
    ).resolves.toMatchObject({ status: 'idempotent' });

    await expect(
      runtime.process(
        {
          providerId: 'future-provider',
          providerEventId: 'event-1',
          headers: { 'x-provider-signature': 'opaque-signature' },
          payload: Buffer.from('{"conflict":true}'),
          receivedAt: '2026-08-16T10:00:02.000Z',
        },
        operationsContext,
      ),
    ).rejects.toThrow('Provider webhook event conflicts with accepted evidence.');
  });

  it('blocks a verified Live Provider Fact while the kill switch is off', async () => {
    const process = vi.fn();
    const applicationPolicy = { process } as unknown as ProviderFactApplicationPolicy;
    const runtime = new ProviderWebhookRuntime({
      signatureVerifier: {
        verify: () => Promise.resolve({ verification: 'verified' }),
      },
      normalizer: { normalize: () => Promise.resolve({ fact: verifiedFact }) },
      receiptStore: new InMemoryProviderWebhookReceiptStore(),
      applicationPolicy,
      activationGuard: new RealMoneyActivationGuard({
        runtimeEnvironment: 'controlled',
        realMoneyEnabled: false,
        liveProviderConfigured: true,
      }),
    });

    await expect(
      runtime.process(
        {
          providerId: 'future-provider',
          providerEventId: 'event-1',
          headers: { 'x-provider-signature': 'opaque-signature' },
          payload: Buffer.from('{}'),
          receivedAt: '2026-08-16T10:00:00.000Z',
        },
        operationsContext,
      ),
    ).rejects.toThrow('Live payment is disabled by the real-money kill switch.');
    expect(process).not.toHaveBeenCalled();
  });
});
