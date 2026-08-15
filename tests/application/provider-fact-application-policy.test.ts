import { describe, expect, it } from 'vitest';

import { InMemoryEntityCollectionRepository } from '../../adapters/in-memory/in-memory-entity-collection-repository.js';
import { InMemoryCommerceActionRepository } from '../../adapters/in-memory/in-memory-commerce-action-repository.js';
import { InMemoryPaidCommerceRepository } from '../../adapters/in-memory/in-memory-paid-commerce-repository.js';
import { InMemoryProductEventStore } from '../../adapters/in-memory/in-memory-product-event-store.js';
import { InMemoryUnitOfWork } from '../../adapters/in-memory/in-memory-unit-of-work.js';
import { InMemoryProviderFactReceiptGuard } from '../../adapters/in-memory/in-memory-provider-fact-receipt-guard.js';
import {
  ReferenceProviderAdapter,
  type ReferenceProviderEvent,
} from '../../adapters/in-memory/reference-provider-adapter.js';
import { FixedClock } from '../../adapters/in-memory/fixed-clock.js';
import { SequentialIdGenerator } from '../../adapters/in-memory/sequential-id-generator.js';
import { CanonicalEventRecorder } from '../../applications/core/canonical-event-recorder.js';
import { ProviderFactApplicationPolicy } from '../../applications/paid-commerce/provider-fact-application-policy.js';
import { createPaidCommerceService } from '../../applications/paid-commerce/paid-commerce-service.js';
import type { CommerceAction } from '../../modules/customer-request/commerce-action.js';
import type { Offering } from '../../modules/service-offering/offering.js';

describe('Provider Fact Application Policy', () => {
  it('accepts a verified Payment Fact once and prevents a conflicting terminal fact', async () => {
    const fixture = await createFixture();
    const order = await fixture.createOrder();
    const payment = await fixture.provider.createPaymentIntent({
      internalReference: order.id,
      amountMinor: 39900n,
      currency: 'CNY',
      idempotencyKey: 'payment-1',
    });
    fixture.provider.recordEvent({
      providerEventId: 'payment-success-1',
      providerReference: payment.providerReference,
      kind: 'PaymentSucceeded',
      resourceType: 'payment',
      internalReference: order.id,
      amountMinor: 39900n,
      currency: 'CNY',
      sequence: 1,
      occurredAt: '2026-08-15T10:00:00.000Z',
    });

    const fact = await fixture.provider.verifyPaymentFact({ providerEventId: 'payment-success-1' });
    if (fact.verification !== 'verified') {
      throw new Error('Reference Provider must verify its recorded Payment Fact.');
    }
    await expect(fixture.policy.process({ fact }, fixture.operationsContext)).resolves.toEqual({
      receipt: { status: 'accepted' },
      transitioned: true,
    });
    await expect(fixture.policy.process({ fact }, fixture.operationsContext)).resolves.toEqual({
      receipt: { status: 'idempotent' },
      transitioned: false,
    });

    fixture.provider.recordEvent({
      providerEventId: 'payment-failed-1',
      providerReference: payment.providerReference,
      kind: 'PaymentFailed',
      resourceType: 'payment',
      internalReference: order.id,
      amountMinor: 39900n,
      currency: 'CNY',
      sequence: 2,
      occurredAt: '2026-08-15T10:01:00.000Z',
    });
    const conflict = await fixture.provider.verifyPaymentFact({
      providerEventId: 'payment-failed-1',
    });
    if (conflict.verification !== 'verified') {
      throw new Error('Reference Provider must verify its recorded Payment Fact.');
    }
    await expect(
      fixture.policy.process({ fact: conflict }, fixture.operationsContext),
    ).resolves.toMatchObject({
      receipt: { status: 'conflict' },
      transitioned: false,
    });
    await expect(
      fixture.paidCommerceRepository.findPaymentByOrderId(order.id),
    ).resolves.toMatchObject({
      state: 'confirmed',
    });
    await expect(fixture.productEventStore.list()).resolves.toHaveLength(3);
  });

  it('rejects an amount mismatch before recording the Provider Event and accepts the corrected Fact', async () => {
    const fixture = await createFixture();
    const order = await fixture.createOrder();
    fixture.provider.recordEvent({
      providerEventId: 'payment-amount-check',
      providerReference: 'reference_provider:payment:payment-amount-check',
      kind: 'PaymentSucceeded',
      resourceType: 'payment',
      internalReference: order.id,
      amountMinor: 1n,
      currency: 'CNY',
      sequence: 1,
      occurredAt: '2026-08-15T10:00:00.000Z',
    });
    const invalid = await fixture.provider.verifyPaymentFact({
      providerEventId: 'payment-amount-check',
    });
    if (invalid.verification !== 'verified') {
      throw new Error('Reference Provider must verify recorded Facts.');
    }
    await expect(
      fixture.policy.process({ fact: invalid }, fixture.operationsContext),
    ).rejects.toThrow('Provider Payment Fact amount or currency does not match the Order.');

    fixture.provider.recordEvent({
      ...invalid,
      providerEventId: 'payment-amount-corrected',
      amountMinor: 39900n,
      occurredAt: '2026-08-15T10:00:01.000Z',
    });
    const corrected = await fixture.provider.verifyPaymentFact({
      providerEventId: 'payment-amount-corrected',
    });
    if (corrected.verification !== 'verified') {
      throw new Error('Reference Provider must verify corrected Facts.');
    }
    await expect(
      fixture.policy.process({ fact: corrected }, fixture.operationsContext),
    ).resolves.toMatchObject({
      receipt: { status: 'accepted' },
      transitioned: true,
    });
  });

  it('does not leak an Adapter-only secret through Provider Facts, product events, errors or Ledger data', async () => {
    const fixture = await createFixture();
    const order = await fixture.createOrder();
    const providerSecret = 'reference-provider-secret-must-not-leak';
    const adapterOnlyEvent = {
      providerEventId: 'payment-secret-isolation',
      providerReference: 'reference_provider:payment:payment-secret-isolation',
      kind: 'PaymentSucceeded',
      resourceType: 'payment',
      internalReference: order.id,
      amountMinor: 39900n,
      currency: 'CNY',
      sequence: 1,
      occurredAt: '2026-08-15T10:00:00.000Z',
      providerSecret,
    } as ReferenceProviderEvent;
    fixture.provider.recordEvent(adapterOnlyEvent);
    const fact = await fixture.provider.verifyPaymentFact({
      providerEventId: 'payment-secret-isolation',
    });
    if (fact.verification !== 'verified') {
      throw new Error('Reference Provider must verify recorded Facts.');
    }
    expect(serialize(fact)).not.toContain(providerSecret);
    const invalidFact = {
      ...fact,
      amountMinor: 1n,
      providerSecret,
    } as typeof fact;
    await expect(
      fixture.policy.process({ fact: invalidFact }, fixture.operationsContext),
    ).rejects.not.toThrow(providerSecret);
    await fixture.policy.process({ fact }, fixture.operationsContext);
    expect(serialize(await fixture.productEventStore.list())).not.toContain(providerSecret);
    expect(
      serialize(await fixture.paidCommerceRepository.listLedgerEntriesByCreatorId('creator-1')),
    ).not.toContain(providerSecret);
  });

  it('restores available earnings through a verified Withdrawal Failed Fact without writing Wallet Balance', async () => {
    const fixture = await createFixture();
    const order = await fixture.createOrder();
    await fixture.confirmAndSettle(order.id);
    const withdrawal = await fixture.service.requestWithdrawal(
      {
        amountMinor: 35670n,
        destinationReference: 'destination-redacted-1',
        idempotencyKey: 'withdrawal-intent-1',
      },
      fixture.creatorContext,
    );
    fixture.provider.recordEvent({
      providerEventId: 'withdrawal-failed-1',
      providerReference: 'reference_provider:withdrawal:withdrawal-intent-1',
      kind: 'WithdrawalFailed',
      resourceType: 'withdrawal',
      internalReference: withdrawal.id,
      amountMinor: 35670n,
      currency: 'CNY',
      sequence: 1,
      occurredAt: '2026-08-15T11:00:00.000Z',
    });
    const fact = await fixture.provider.verifyWithdrawalFact({
      providerEventId: 'withdrawal-failed-1',
    });
    if (fact.verification !== 'verified') {
      throw new Error('Reference Provider must verify recorded Facts.');
    }
    await expect(fixture.policy.process({ fact }, fixture.operationsContext)).resolves.toEqual({
      receipt: { status: 'accepted' },
      transitioned: true,
    });
    await expect(fixture.service.getCreatorWallet(fixture.creatorContext)).resolves.toMatchObject({
      available: 35670n,
      withdrawalInProgress: 0n,
      withdrawn: 0n,
    });
    await expect(
      fixture.paidCommerceRepository.findWithdrawalById(withdrawal.id),
    ).resolves.toMatchObject({
      state: 'failed',
    });
  });
});

async function createFixture() {
  const commerceActionRepository = new InMemoryCommerceActionRepository();
  const offeringRepository = new InMemoryEntityCollectionRepository<Offering>(
    (offering) => offering.id,
    (offering) => offering.creatorId,
  );
  const paidCommerceRepository = new InMemoryPaidCommerceRepository();
  const productEventStore = new InMemoryProductEventStore();
  const unitOfWork = new InMemoryUnitOfWork(
    [commerceActionRepository, offeringRepository, paidCommerceRepository, productEventStore],
    productEventStore,
    { commerceActionRepository, offeringRepository, paidCommerceRepository },
  );
  const clock = new FixedClock('2026-08-15T09:00:00.000Z');
  const service = createPaidCommerceService({
    commerceActionRepository,
    offeringRepository,
    paidCommerceRepository,
    idGenerator: new SequentialIdGenerator('paid'),
    clock,
    canonicalEventRecorder: new CanonicalEventRecorder({
      clock,
      eventStore: productEventStore,
      idGenerator: new SequentialIdGenerator('event'),
    }),
    unitOfWork,
  });
  await offeringRepository.save({
    id: 'offering-1',
    creatorId: 'creator-1',
    capabilityIds: ['capability-1'],
    title: 'Private dance lesson',
    description: 'One hour of one-on-one dance instruction.',
    availability: { description: 'Weekends by request.' },
    requestInstructions: 'Share your preferred time.',
    state: 'published',
  });
  await commerceActionRepository.save({
    id: 'action-1',
    creatorId: 'creator-1',
    customerId: 'customer-1',
    offeringId: 'offering-1',
    requestMessage: 'I would like a beginner lesson.',
    resultAccessToken: 'result-token-1',
    state: 'confirmed',
  } satisfies CommerceAction);

  const creatorContext = {
    actor: { kind: 'creator' as const, creatorId: 'creator-1' },
    correlationId: 'creator-vs02b',
  };
  const operationsContext = {
    actor: { kind: 'pilot_operations' as const, operatorId: 'operator-vs02b' },
    correlationId: 'operations-vs02b',
  };
  const provider = new ReferenceProviderAdapter();
  const policy = new ProviderFactApplicationPolicy({
    paidCommerceService: service,
    paidCommerceRepository,
    receiptGuard: new InMemoryProviderFactReceiptGuard(),
  });

  return {
    service,
    provider,
    policy,
    paidCommerceRepository,
    productEventStore,
    creatorContext,
    operationsContext,
    createOrder: () =>
      service.createOrder(
        {
          commerceActionId: 'action-1',
          grossPriceMinor: 39900n,
          serviceTerms: 'One 60-minute in-person dance lesson in Shanghai.',
        },
        creatorContext,
      ),
    confirmAndSettle: async (orderId: string) => {
      await service.recordControlledPayment(
        { orderId, controlledEvidenceReference: 'fixture-payment' },
        operationsContext,
      );
      await service.recordFulfillment(
        { orderId, evidenceReference: 'fixture-fulfillment' },
        creatorContext,
      );
      await service.releaseControlledSettlement(
        {
          orderId,
          providerFeeMinor: 240n,
          platformFeeMinor: 3990n,
          calculationVersion: 'vs02-cny-v1',
          controlledEvidenceReference: 'fixture-settlement',
        },
        operationsContext,
      );
    },
  };
}

function serialize(value: unknown): string {
  return JSON.stringify(value, (_, nestedValue: unknown) =>
    typeof nestedValue === 'bigint' ? nestedValue.toString() : nestedValue,
  );
}
