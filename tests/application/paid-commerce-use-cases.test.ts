import { describe, expect, it } from 'vitest';

import { InMemoryCommerceActionRepository } from '../../adapters/in-memory/in-memory-commerce-action-repository.js';
import { InMemoryEntityCollectionRepository } from '../../adapters/in-memory/in-memory-entity-collection-repository.js';
import { FixedClock } from '../../adapters/in-memory/fixed-clock.js';
import { InMemoryPaidCommerceRepository } from '../../adapters/in-memory/in-memory-paid-commerce-repository.js';
import { InMemoryProductEventStore } from '../../adapters/in-memory/in-memory-product-event-store.js';
import { InMemoryUnitOfWork } from '../../adapters/in-memory/in-memory-unit-of-work.js';
import { SequentialIdGenerator } from '../../adapters/in-memory/sequential-id-generator.js';
import { CanonicalEventRecorder } from '../../applications/core/canonical-event-recorder.js';
import {
  BeginOrderPaymentUseCase,
  CompleteControlledWithdrawalUseCase,
  CreatePaidServiceOrderUseCase,
  GetCreatorWalletUseCase,
  RecordControlledPaymentFactUseCase,
  RecordPaidServiceFulfillmentUseCase,
  ReleaseControlledSettlementUseCase,
  RequestCreatorWithdrawalUseCase,
} from '../../applications/paid-commerce/paid-commerce-use-cases.js';
import type { CommerceAction } from '../../modules/customer-request/commerce-action.js';
import type { Offering } from '../../modules/service-offering/offering.js';

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
  const clock = new FixedClock('2026-08-14T10:00:00.000Z');
  const canonicalEventRecorder = new CanonicalEventRecorder({
    clock,
    eventStore: productEventStore,
    idGenerator: new SequentialIdGenerator('event'),
  });
  const dependencies = {
    commerceActionRepository,
    offeringRepository,
    paidCommerceRepository,
    idGenerator: new SequentialIdGenerator('paid'),
    clock,
    canonicalEventRecorder,
    unitOfWork,
  };

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

  return {
    createOrder: new CreatePaidServiceOrderUseCase(dependencies),
    beginPayment: new BeginOrderPaymentUseCase(dependencies),
    confirmPayment: new RecordControlledPaymentFactUseCase(dependencies),
    recordFulfillment: new RecordPaidServiceFulfillmentUseCase(dependencies),
    releaseSettlement: new ReleaseControlledSettlementUseCase(dependencies),
    getWallet: new GetCreatorWalletUseCase(dependencies),
    requestWithdrawal: new RequestCreatorWithdrawalUseCase(dependencies),
    completeWithdrawal: new CompleteControlledWithdrawalUseCase(dependencies),
    paidCommerceRepository,
    productEventStore,
  };
}

describe('Paid Commerce application use cases', () => {
  it('creates an auditable controlled paid-service earnings cycle', async () => {
    const fixture = await createFixture();
    const creatorContext = {
      actor: { kind: 'creator' as const, creatorId: 'creator-1' },
      correlationId: 'creator-order-1',
    };
    const operationsContext = {
      actor: { kind: 'pilot_operations' as const, operatorId: 'operator-1' },
      correlationId: 'operations-money-1',
    };

    const order = await fixture.createOrder.execute(
      {
        commerceActionId: 'action-1',
        grossPriceMinor: 39900n,
        serviceTerms: 'One 60-minute in-person dance lesson in Shanghai.',
      },
      creatorContext,
    );
    const payment = await fixture.paidCommerceRepository.findPaymentByOrderId(order.id);
    expect(payment).toBeDefined();
    if (payment === undefined) {
      throw new Error('Order creation must create a pending Payment.');
    }
    const paid = await fixture.confirmPayment.execute(
      { orderId: order.id, controlledEvidenceReference: 'payment-fixture-1' },
      operationsContext,
    );
    const replayedPayment = await fixture.confirmPayment.execute(
      { orderId: order.id, controlledEvidenceReference: 'payment-fixture-1' },
      operationsContext,
    );
    const fulfilled = await fixture.recordFulfillment.execute(
      { orderId: order.id, evidenceReference: 'fulfillment-evidence-1' },
      creatorContext,
    );
    const settled = await fixture.releaseSettlement.execute(
      {
        orderId: order.id,
        providerFeeMinor: 240n,
        platformFeeMinor: 3990n,
        calculationVersion: 'vs02-cny-v1',
        controlledEvidenceReference: 'settlement-fixture-1',
      },
      operationsContext,
    );
    const wallet = await fixture.getWallet.execute(creatorContext);
    const withdrawal = await fixture.requestWithdrawal.execute(
      {
        amountMinor: 35670n,
        destinationReference: 'destination-redacted-1',
        idempotencyKey: 'withdrawal-key-1',
      },
      creatorContext,
    );
    const duplicateWithdrawal = await fixture.requestWithdrawal.execute(
      {
        amountMinor: 35670n,
        destinationReference: 'destination-redacted-1',
        idempotencyKey: 'withdrawal-key-1',
      },
      creatorContext,
    );
    const completedWithdrawal = await fixture.completeWithdrawal.execute(
      {
        withdrawalId: withdrawal.id,
        controlledEvidenceReference: 'withdrawal-fixture-1',
      },
      operationsContext,
    );
    const replayedWithdrawal = await fixture.completeWithdrawal.execute(
      {
        withdrawalId: withdrawal.id,
        controlledEvidenceReference: 'withdrawal-fixture-1',
      },
      operationsContext,
    );
    const finalWallet = await fixture.getWallet.execute(creatorContext);

    expect(order.state).toBe('payment_pending');
    expect(payment?.state).toBe('pending');
    expect(paid.order.state).toBe('paid');
    expect(replayedPayment.payment.id).toBe(paid.payment.id);
    expect(fulfilled.order.state).toBe('fulfilled');
    expect(settled.order.state).toBe('completed');
    expect(settled.settlement.creatorNet.minor).toBe(35670n);
    expect(wallet).toMatchObject({
      pending: 0n,
      available: 35670n,
      restricted: 0n,
      withdrawalInProgress: 0n,
      withdrawn: 0n,
    });
    expect(duplicateWithdrawal.id).toBe(withdrawal.id);
    expect(completedWithdrawal.state).toBe('completed');
    expect(replayedWithdrawal.id).toBe(completedWithdrawal.id);
    expect(finalWallet).toMatchObject({
      pending: 0n,
      available: 0n,
      withdrawalInProgress: 0n,
      withdrawn: 35670n,
    });

    const ledger = await fixture.paidCommerceRepository.listLedgerEntriesByCreatorId('creator-1');
    expect(ledger.map((entry) => entry.type)).toEqual([
      'pending_earnings_credited',
      'settlement_released',
      'withdrawal_reserved',
      'withdrawal_completed',
    ]);
    await expect(fixture.productEventStore.list()).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'order_created', objectId: order.id }),
        expect.objectContaining({ name: 'payment_attempted', objectId: payment.id }),
        expect.objectContaining({ name: 'payment_confirmed', objectId: payment.id }),
        expect.objectContaining({
          name: 'fulfillment_recorded',
          objectId: fulfilled.fulfillment.id,
        }),
        expect.objectContaining({ name: 'settlement_released', objectId: settled.settlement.id }),
        expect.objectContaining({ name: 'withdrawal_completed', objectId: withdrawal.id }),
      ]),
    );
  });

  it('does not permit a Customer or Creator to confirm a Payment fact', async () => {
    const fixture = await createFixture();
    const creatorContext = {
      actor: { kind: 'creator' as const, creatorId: 'creator-1' },
      correlationId: 'creator-order-1',
    };
    const order = await fixture.createOrder.execute(
      {
        commerceActionId: 'action-1',
        grossPriceMinor: 39900n,
        serviceTerms: 'One 60-minute in-person dance lesson in Shanghai.',
      },
      creatorContext,
    );
    await expect(
      fixture.confirmPayment.execute(
        { orderId: order.id, controlledEvidenceReference: 'untrusted-payment' },
        creatorContext,
      ),
    ).rejects.toMatchObject({
      code: 'controlled_money_fact_requires_operations',
      category: 'authorization',
    });
  });
});
