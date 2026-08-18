import { describe, expect, it } from 'vitest';

import { LocalCommerceSimulator } from './local-commerce-simulator.js';

const operationRequest = {
  internalReference: 'order-1',
  amountMinor: 39900n,
  currency: 'CNY' as const,
  idempotencyKey: 'payment-1',
};

describe('LocalCommerceSimulator', () => {
  it('implements the unchanged Provider Port with simulation identity and payment success facts', async () => {
    const simulator = new LocalCommerceSimulator('test', () => '2026-08-16T10:00:00.000Z');

    const payment = await simulator.createPaymentIntent(operationRequest);
    const replayedPayment = await simulator.createPaymentIntent(operationRequest);
    const [event] = simulator.listUndeliveredEvents();

    expect(event).toBeDefined();
    if (event === undefined) {
      throw new Error('Local Commerce Simulator did not emit a Payment success event.');
    }
    expect(payment).toEqual(replayedPayment);
    expect(payment.providerId).toBe('local_commerce_simulator');
    expect(event).toMatchObject({
      kind: 'PaymentSucceeded',
      resourceType: 'payment',
      evidence: {
        origin: 'simulation',
        providerId: 'local_commerce_simulator',
        environment: 'test',
      },
    });
    await expect(simulator.getPaymentStatus(payment.providerReference)).resolves.toBe('succeeded');
    await expect(
      simulator.verifyPaymentFact({ providerEventId: event.providerEventId }),
    ).resolves.toMatchObject({
      verification: 'verified',
      kind: 'PaymentSucceeded',
      internalReference: 'order-1',
    });
  });

  it('produces failed and delayed payment outcomes without fabricating success', async () => {
    const failed = new LocalCommerceSimulator('test');
    failed.configureScenario({ payment: 'failed' });
    const failedPayment = await failed.createPaymentIntent(operationRequest);
    const [failedEvent] = failed.listUndeliveredEvents();

    expect(failedEvent?.kind).toBe('PaymentFailed');
    await expect(failed.getPaymentStatus(failedPayment.providerReference)).resolves.toBe('failed');

    const delayed = new LocalCommerceSimulator('test');
    delayed.configureScenario({ payment: 'delayed' });
    const delayedPayment = await delayed.createPaymentIntent(operationRequest);

    expect(delayed.listUndeliveredEvents()).toEqual([]);
    await expect(delayed.getPaymentStatus(delayedPayment.providerReference)).resolves.toBe(
      'pending',
    );
    delayed.advance(delayedPayment.providerReference);
    expect(delayed.listUndeliveredEvents()).toHaveLength(1);
    await expect(delayed.getPaymentStatus(delayedPayment.providerReference)).resolves.toBe(
      'succeeded',
    );
  });

  it('emits duplicate and out-of-order provider events as explicit simulation faults', async () => {
    const duplicate = new LocalCommerceSimulator('test');
    duplicate.configureScenario({ payment: 'duplicate_event' });
    await duplicate.createPaymentIntent(operationRequest);
    expect(duplicate.listUndeliveredEvents().map((event) => event.kind)).toEqual([
      'PaymentSucceeded',
      'PaymentSucceeded',
    ]);

    const outOfOrder = new LocalCommerceSimulator('test');
    outOfOrder.configureScenario({ payment: 'out_of_order_event' });
    await outOfOrder.createPaymentIntent(operationRequest);
    expect(outOfOrder.listUndeliveredEvents().map((event) => event.sequence)).toEqual([2, 1]);
  });

  it('models settlement and withdrawal failures without inventing unsupported Provider facts', async () => {
    const settlement = new LocalCommerceSimulator('controlled');
    settlement.configureScenario({ settlement: 'failed' });
    const settlementOperation = await settlement.createSettlement({
      ...operationRequest,
      internalReference: 'order-settlement-1',
      idempotencyKey: 'settlement-1',
      amountMinor: 35670n,
    });

    expect(settlement.listUndeliveredEvents()).toEqual([]);
    await expect(
      settlement.getSettlementStatus(settlementOperation.providerReference),
    ).resolves.toBe('failed');

    const withdrawal = new LocalCommerceSimulator('controlled');
    withdrawal.configureScenario({ withdrawal: 'failed' });
    const withdrawalOperation = await withdrawal.createWithdrawalIntent({
      ...operationRequest,
      internalReference: 'withdrawal-1',
      idempotencyKey: 'withdrawal-1',
      amountMinor: 35670n,
    });
    const [withdrawalEvent] = withdrawal.listUndeliveredEvents();

    expect(withdrawalEvent?.kind).toBe('WithdrawalFailed');
    await expect(
      withdrawal.getWithdrawalStatus(withdrawalOperation.providerReference),
    ).resolves.toBe('failed');
  });

  it('does not fabricate a successful refund fact for the failed-refund scenario', () => {
    const simulator = new LocalCommerceSimulator('test');
    simulator.configureScenario({ refund: 'failed_refund' });

    expect(() =>
      simulator.recordRefundSucceeded({
        providerReference: 'local_commerce_simulator:payment:payment-1',
        internalReference: 'order-1',
        amountMinor: 39900n,
        currency: 'CNY',
      }),
    ).toThrow('Simulation refund failed');
    expect(simulator.listUndeliveredEvents()).toEqual([]);
  });

  it('replays the same Refund fact idempotently and rejects conflicting reuse', () => {
    const simulator = new LocalCommerceSimulator('test');
    const input = {
      providerReference: 'local_commerce_simulator:payment:refund-1',
      internalReference: 'order-1',
      amountMinor: 39_900n,
      currency: 'CNY' as const,
    };

    const first = simulator.recordRefundSucceeded(input);
    simulator.takeEvents();
    const replay = simulator.recordRefundSucceeded(input);

    expect(replay.providerEventId).toBe(first.providerEventId);
    expect(simulator.takeEvents()).toEqual([first]);
    expect(() => simulator.recordRefundSucceeded({ ...input, amountMinor: 39_800n })).toThrow(
      'conflicts with the original Refund fact',
    );
  });
});
